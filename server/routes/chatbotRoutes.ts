/**
 * AI Chatbot Routes
 * 
 * Provides secure backend API for AI chatbot interactions
 * Keeps OpenAI API key server-side to prevent exposure
 */

import { Router } from 'express';
import OpenAI from 'openai';
import { logger } from '../utils/logger';
import { isAuthenticated } from '../auth';

const router = Router();

// Apply authentication to all chatbot routes to prevent abuse
// Users must be logged in to use the chatbot
router.use(isAuthenticated);

// Initialize OpenAI client server-side
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || ''
});

const chatbotLogger = logger.withContext('ChatbotRoutes');

// Simple rate limiting: track last request time per session
const rateLimitMap = new Map<string, number>();
const RATE_LIMIT_MS = 2000; // 2 seconds between requests

function checkRateLimit(sessionId: string): boolean {
  const lastRequest = rateLimitMap.get(sessionId);
  const now = Date.now();
  
  if (lastRequest && (now - lastRequest) < RATE_LIMIT_MS) {
    return false; // Rate limit exceeded
  }
  
  rateLimitMap.set(sessionId, now);
  return true;
}

// System prompt with UK accounting expertise
const SYSTEM_PROMPT = `You are an expert UK corporate compliance assistant for PromptSubmissions, an AI-powered platform for UK corporate filings. You help users with:

## UK ACCOUNTING & TAX EXPERTISE:
- Corporation Tax returns (CT600)
- Annual Accounts preparation 
- Confirmation Statements
- VAT returns and compliance
- UK GAAP accounting standards
- Companies House filing requirements
- HMRC regulations and deadlines

## PLATFORM FEATURES:
- AI document processing for invoices, receipts, bank statements
- Extended Trial Balance generation
- Financial statement preparation (P&L, Balance Sheet, Cash Flow)
- Journal entry processing and audit trails
- Multi-format export (PDF, Excel, CSV)
- Credit-based billing system
- April 2027 mandatory software filing compliance

## PRICING & PLANS:
- Starter: £199.99 (200 credits) - Dormant companies
- Professional: £399.99 (400 credits) - Most popular
- Business: £799.99 (800 credits) - Growing businesses
- Enterprise: £1499.99 (1500 credits) - Accounting firms

## KEY REGULATIONS:
- April 2027: All UK companies must use software for filing
- Small companies now require P&L statements
- Digital-first approach mandatory
- Audit trail requirements for tax compliance

Always provide accurate, helpful guidance on UK regulations and platform usage. Be professional but friendly. If you don't know something specific, direct users to contact support.`;

// Store conversation history per session (in production, use Redis or database)
const conversationSessions = new Map<string, any[]>();

/**
 * Send message to AI chatbot
 * POST /api/chatbot/message
 */
router.post('/message', async (req, res) => {
  try {
    const { message, sessionId } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Get session ID and check rate limit
    const sid = sessionId || 'default';
    if (!checkRateLimit(sid)) {
      return res.status(429).json({ 
        error: 'Too many requests. Please wait a moment before sending another message.' 
      });
    }

    if (!process.env.OPENAI_API_KEY) {
      chatbotLogger.warn('OpenAI API key not configured');
      return res.status(503).json({ 
        error: 'Chatbot is temporarily unavailable. Please contact support.' 
      });
    }

    // Get or create conversation history
    if (!conversationSessions.has(sid)) {
      conversationSessions.set(sid, [
        { role: 'system', content: SYSTEM_PROMPT }
      ]);
    }

    const conversation = conversationSessions.get(sid)!;

    // Add user message
    conversation.push({ role: 'user', content: message });

    // Call OpenAI API
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: conversation,
      max_tokens: 1000,
      temperature: 0.7,
      presence_penalty: 0.1,
      frequency_penalty: 0.1
    });

    const assistantMessage = response.choices[0].message.content || 
      "I apologize, but I couldn't generate a response. Please try again.";

    // Add assistant response to conversation
    conversation.push({ role: 'assistant', content: assistantMessage });

    // Keep conversation manageable (last 20 messages + system prompt)
    if (conversation.length > 21) {
      conversationSessions.set(sid, [
        conversation[0], // Keep system prompt
        ...conversation.slice(-20)
      ]);
    }

    chatbotLogger.info('Chatbot message processed', { 
      sessionId: sid,
      messageLength: message.length 
    });

    res.json({ 
      message: assistantMessage,
      sessionId: sid
    });

  } catch (error: any) {
    chatbotLogger.error('Error processing chatbot message:', error);
    
    if (error.status === 429) {
      return res.status(429).json({ 
        error: 'Too many requests. Please try again in a moment.' 
      });
    }

    res.status(500).json({ 
      error: 'Failed to process your message. Please try again.' 
    });
  }
});

/**
 * Clear conversation history
 * POST /api/chatbot/clear
 */
router.post('/clear', async (req, res) => {
  try {
    const { sessionId } = req.body;
    const sid = sessionId || 'default';

    conversationSessions.delete(sid);

    res.json({ success: true });
  } catch (error) {
    chatbotLogger.error('Error clearing conversation:', error);
    res.status(500).json({ error: 'Failed to clear conversation' });
  }
});

/**
 * Get quick response suggestions
 * GET /api/chatbot/quick-responses
 */
router.get('/quick-responses', (req, res) => {
  const quickResponses = [
    {
      question: "What's the April 2027 deadline about?",
      answer: "From April 2027, all UK companies must use software for filing accounts with Companies House."
    },
    {
      question: "How much does it cost?",
      answer: "Our Professional plan at £399.99 for 400 credits is most popular."
    },
    {
      question: "What documents do I need to upload?",
      answer: "Upload invoices, receipts, bank statements, and financial documents. Our AI will process them."
    },
    {
      question: "How do I prepare Corporation Tax returns?",
      answer: "Upload financial documents, generate the Extended Trial Balance, then use our Tax Engine."
    },
    {
      question: "What's an Extended Trial Balance?",
      answer: "A comprehensive summary of all accounts showing debits, credits, and balances."
    }
  ];

  res.json(quickResponses);
});

export default router;

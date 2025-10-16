import OpenAI from "openai";

// Note: In production, API calls should go through the backend for security
// This is a demo setup - the API key should be handled server-side
const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY || '',
  dangerouslyAllowBrowser: true
});

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

export class AIChatbotService {
  private conversation: ChatMessage[] = [];
  private systemPrompt = `You are an expert UK corporate compliance assistant for PromptSubmissions, an AI-powered platform for UK corporate filings. You help users with:

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
- Starter: £79 (50 credits) - Dormant companies
- Professional: £199 (150 credits) - Small businesses (MOST POPULAR)
- Business: £399 (350 credits) - Growing businesses
- Enterprise: £899 (850 credits) - Accounting firms

## KEY REGULATIONS:
- April 2027: All UK companies must use software for filing
- Small companies now require P&L statements
- Digital-first approach mandatory
- Audit trail requirements for tax compliance

Always provide accurate, helpful guidance on UK regulations and platform usage. Be professional but friendly. If you don't know something specific, direct users to contact support.`;

  constructor() {
    this.conversation = [{
      role: 'system',
      content: this.systemPrompt,
      timestamp: new Date()
    }];
  }

  async sendMessage(message: string): Promise<string> {
    // Add user message to conversation
    this.conversation.push({
      role: 'user',
      content: message,
      timestamp: new Date()
    });

    try {
      // Check if OpenAI API key is available
      if (!import.meta.env.VITE_OPENAI_API_KEY) {
        return "I'm currently unavailable. Please contact support for assistance with UK compliance questions.";
      }

      const response = await openai.chat.completions.create({
        model: "gpt-4o", // Latest model with multimodal capabilities
        messages: this.conversation.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        max_tokens: 1000,
        temperature: 0.7,
        presence_penalty: 0.1,
        frequency_penalty: 0.1
      });

      const assistantMessage = response.choices[0].message.content || "I apologize, but I couldn't generate a response. Please try again.";

      // Add assistant response to conversation
      this.conversation.push({
        role: 'assistant',
        content: assistantMessage,
        timestamp: new Date()
      });

      // Keep conversation history manageable using app constants
      if (this.conversation.length > APP_CONFIG.LIMITS.MAX_CONVERSATION_LENGTH) {
        this.conversation = [
          this.conversation[0], // Keep system message
          ...this.conversation.slice(APP_CONFIG.LIMITS.CONVERSATION_HISTORY_LIMIT)
        ];
      }

      return assistantMessage;
    } catch (error) {
      // Handle AI chatbot errors silently
      return "I'm experiencing technical difficulties. Please try again or contact support if the issue persists.";
    }
  }

  getConversationHistory(): ChatMessage[] {
    return this.conversation.filter(msg => msg.role !== 'system');
  }

  clearConversation(): void {
    this.conversation = [{
      role: 'system',
      content: this.systemPrompt,
      timestamp: new Date()
    }];
  }

  // Predefined quick responses for common queries
  getQuickResponses(): Array<{question: string, answer: string}> {
    return [
      {
        question: "What's the April 2027 deadline about?",
        answer: "From April 2027, all UK companies must use software for filing accounts with Companies House. No more web or paper filing will be accepted."
      },
      {
        question: "How much does it cost?",
        answer: "Our Professional plan at £199 for 150 credits is most popular, covering 6 small company filings with AI processing."
      },
      {
        question: "What documents do I need to upload?",
        answer: "Upload invoices, receipts, bank statements, and any financial documents. Our AI will automatically categorize and process them."
      },
      {
        question: "How do I prepare Corporation Tax returns?",
        answer: "Upload your financial documents, generate the Extended Trial Balance, then use our Tax Engine to automatically prepare your CT600 return."
      },
      {
        question: "What's an Extended Trial Balance?",
        answer: "It's a comprehensive summary of all your accounts showing debits, credits, and final balances - essential for preparing accurate financial statements."
      }
    ];
  }
}

export const aiChatbotService = new AIChatbotService();
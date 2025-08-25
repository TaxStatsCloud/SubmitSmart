/**
 * OpenAI Service
 * 
 * This service handles interactions with the OpenAI API for:
 * - Document analysis
 * - Filing draft generation
 * - Compliance checking
 * - Assistant conversations
 */

import OpenAI from "openai";
import { logger } from "../utils/logger";
import { APP_CONFIG, DOCUMENT_ANALYSIS_PROMPTS } from '@shared/constants';
import { Logger } from '@shared/logger';

// Create logger instance for this service
const aiLogger = logger.withContext('OpenAIService');

// Check for API key
if (!process.env.OPENAI_API_KEY) {
  aiLogger.warn('OPENAI_API_KEY is not set. OpenAI functionality will be disabled.');
}

// Log status about API key (for debugging)
const hasApiKey = !!process.env.OPENAI_API_KEY;
Logger.info('Initializing OpenAI client');
Logger.info(`API Key available: ${hasApiKey ? 'Yes (not showing for security)' : 'No'}`);

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * Generate a text completion response using OpenAI
 * 
 * @param prompt User prompt
 * @param systemPrompt Optional system prompt for context
 * @returns Generated text response
 */
export async function generateCompletion(
  prompt: string,
  systemPrompt?: string
): Promise<string> {
  try {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key is not configured');
    }

    const messages: Array<{role: 'system' | 'user' | 'assistant', content: string}> = [
      ...(systemPrompt ? [{ role: "system" as const, content: systemPrompt }] : []),
      { role: "user" as const, content: prompt }
    ];

    const response = await openai.chat.completions.create({
      model: APP_CONFIG.OPENAI.MODEL,
      messages,
      temperature: APP_CONFIG.OPENAI.TEMPERATURE.CREATIVE,
      max_tokens: APP_CONFIG.OPENAI.MAX_TOKENS.STANDARD
    });

    return response.choices[0].message.content || '';
  } catch (error) {
    aiLogger.error('Error generating completion:', error);
    throw error;
  }
}

/**
 * Generate a structured JSON response using OpenAI
 * 
 * @param prompt User prompt
 * @param systemPrompt Optional system prompt for context
 * @returns Structured response as a typed object
 */
export async function generateStructuredResponse<T>(
  prompt: string,
  systemPrompt?: string
): Promise<T> {
  try {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key is not configured');
    }

    const enhancedSystemPrompt = `${systemPrompt || 'You are a helpful assistant.'} 
    You must respond with valid JSON that can be parsed directly. Do not include any explanations, markdown formatting, or surrounding backticks. 
    The response should be a valid JSON object that matches the expected schema.`;

    const messages: Array<{role: 'system' | 'user' | 'assistant', content: string}> = [
      { role: "system" as const, content: enhancedSystemPrompt },
      { role: "user" as const, content: prompt }
    ];

    const response = await openai.chat.completions.create({
      model: APP_CONFIG.OPENAI.MODEL,
      messages,
      temperature: APP_CONFIG.OPENAI.TEMPERATURE.STRUCTURED,
      max_tokens: APP_CONFIG.OPENAI.MAX_TOKENS.EXTENDED,
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content || '{}';
    return JSON.parse(content) as T;
  } catch (error) {
    aiLogger.error('Error generating structured response:', error);
    throw error;
  }
}

/**
 * Analyze a document using OpenAI
 * 
 * @param documentContent Document content to analyze
 * @param documentType Type of document (e.g., trial_balance, invoice)
 * @returns Analysis results
 */
export async function analyzeDocument<T>(
  documentContent: string,
  documentType: string
): Promise<T> {
  try {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key is not configured');
    }

    // Create system prompt based on document type
    let systemPrompt = `You are an expert financial document analyzer specializing in ${documentType} analysis. 
                       Extract key information from the document and provide a structured analysis.`;

    // Get prompt based on document type
    let prompt = '';
    switch (documentType) {
      case 'trial_balance':
        prompt = DOCUMENT_ANALYSIS_PROMPTS.TRIAL_BALANCE + `\n\nDocument content:\n${documentContent}`;
        break;
      case 'invoice':
        prompt = DOCUMENT_ANALYSIS_PROMPTS.INVOICE + `\n\nDocument content:\n${documentContent}`;
        break;
      case 'bank_statement':
        prompt = DOCUMENT_ANALYSIS_PROMPTS.BANK_STATEMENT + `\n\nDocument content:\n${documentContent}`;
        break;
      default:
        prompt = DOCUMENT_ANALYSIS_PROMPTS.DEFAULT(documentType) + `\n\nDocument content:\n${documentContent}`;
        break;
    }

    return await generateStructuredResponse<T>(prompt, systemPrompt);
  } catch (error) {
    aiLogger.error(`Error analyzing ${documentType} document:`, error);
    throw error;
  }
}

/**
 * Generate a draft filing based on provided data
 * 
 * @param filingType Type of filing to generate
 * @param companyData Company information
 * @param documentData Data extracted from analyzed documents
 * @returns Generated filing draft
 */
export async function generateFilingDraft<T>(
  filingType: string,
  companyData: any,
  documentData: any[]
): Promise<T> {
  try {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key is not configured');
    }

    // Create system prompt based on filing type
    const systemPrompt = `You are an expert in UK corporate filings and compliance, specializing in ${filingType} preparation. 
                         Generate a complete draft filing based on the provided company and document data.`;

    // Create a detailed prompt with all available data
    const prompt = `Generate a detailed draft for a ${filingType} filing for the following company and document data:
                   
                   Company Data:
                   ${JSON.stringify(companyData, null, 2)}
                   
                   Document Data:
                   ${JSON.stringify(documentData, null, 2)}
                   
                   For a ${filingType}, include all required sections and fields according to UK regulatory requirements.
                   Ensure all calculations are accurate and consistent across the filing.
                   Flag any potential issues or missing information that might need attention.
                   
                   Respond with a comprehensive JSON structure that represents the complete filing draft.`;

    return await generateStructuredResponse<T>(prompt, systemPrompt);
  } catch (error) {
    aiLogger.error(`Error generating ${filingType} filing draft:`, error);
    throw error;
  }
}

/**
 * Check a filing draft for compliance issues
 * 
 * @param filingType Type of filing to check
 * @param filingData Draft filing data to analyze
 * @returns Compliance check results
 */
export async function checkFilingCompliance(
  filingType: string,
  filingData: any
): Promise<{
  compliant: boolean;
  issues: Array<{
    severity: 'critical' | 'warning' | 'info';
    field: string;
    message: string;
    recommendation: string;
  }>;
  recommendations: string[];
}> {
  try {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key is not configured');
    }

    // Create system prompt for compliance checking
    const systemPrompt = `You are an expert compliance auditor for UK corporate filings, specializing in ${filingType} compliance.
                         Review the provided filing data and identify any issues or non-compliance with UK regulatory requirements.
                         Categorize issues by severity: critical (must fix), warning (should fix), and info (suggestions).`;

    // Create a detailed prompt for the compliance check
    const prompt = `Review this ${filingType} filing for compliance with UK regulatory requirements:
                   
                   Filing Data:
                   ${JSON.stringify(filingData, null, 2)}
                   
                   Check for:
                   - Missing required fields
                   - Data inconsistencies
                   - Mathematical errors
                   - Regulatory compliance issues
                   - Format or structural problems
                   
                   For each issue found, provide:
                   - Severity (critical, warning, or info)
                   - The specific field or section with the issue
                   - A clear description of the problem
                   - A specific recommendation to resolve it
                   
                   Also provide a list of general recommendations for improving the filing.
                   
                   Respond with a JSON structure that includes:
                   - A boolean 'compliant' field indicating if the filing has any critical issues
                   - An array of issues with severity, field, message, and recommendation
                   - An array of general recommendations`;

    return await generateStructuredResponse(prompt, systemPrompt);
  } catch (error) {
    aiLogger.error(`Error checking ${filingType} filing compliance:`, error);
    throw error;
  }
}

/**
 * Generate a response for the AI assistant
 * 
 * @param userMessage User message
 * @param conversationHistory Previous messages in the conversation
 * @returns AI generated response
 */
export async function generateAssistantResponse(
  userMessage: string,
  conversationHistory: Array<{ role: 'user' | 'assistant', content: string }>
): Promise<string> {
  try {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key is not configured');
    }

    // System prompt for the assistant
    const systemPrompt = `You are an AI assistant for PromptSubmissions, an AI-powered platform for UK corporate compliance,
                         specializing in automated Confirmation Statements, Annual Accounts, and Corporation Tax return processing.
                         
                         You help users with:
                         - Understanding UK regulatory requirements
                         - Navigating the filing preparation process
                         - Interpreting financial documents
                         - Troubleshooting issues with their filings
                         - Understanding data extracted from their documents
                         
                         Be helpful, clear, and concise. If you don't know something, admit it and offer to connect the user with support.
                         Format your responses using Markdown for readability when appropriate.`;

    // Prepare conversation messages
    const messages = [
      { role: "system", content: systemPrompt },
      ...conversationHistory.map(msg => ({ 
        role: msg.role as "user" | "assistant", 
        content: msg.content 
      })),
      { role: "user", content: userMessage }
    ];

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages,
      temperature: 0.7,
      max_tokens: 2000
    });

    return response.choices[0].message.content || '';
  } catch (error) {
    aiLogger.error('Error generating assistant response:', error);
    throw error;
  }
}
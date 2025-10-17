/**
 * AI Chatbot Service
 * 
 * Provides secure chatbot functionality by calling backend API
 * Never exposes OpenAI API keys to the client
 */

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

export class AIChatbotService {
  private conversation: ChatMessage[] = [];
  private sessionId: string;

  constructor() {
    // Generate unique session ID for this conversation
    this.sessionId = `session-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  }

  async sendMessage(message: string): Promise<string> {
    // Add user message to conversation
    this.conversation.push({
      role: 'user',
      content: message,
      timestamp: new Date()
    });

    try {
      // Call backend API instead of OpenAI directly
      const response = await fetch('/api/chatbot/message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include', // Include session cookies
        body: JSON.stringify({
          message,
          sessionId: this.sessionId
        })
      });

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('Too many requests. Please wait a moment before trying again.');
        }
        throw new Error('Failed to get response from chatbot');
      }

      const data = await response.json();
      const assistantMessage = data.message;

      // Add assistant response to conversation
      this.conversation.push({
        role: 'assistant',
        content: assistantMessage,
        timestamp: new Date()
      });

      return assistantMessage;
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage = error instanceof Error ? error.message : 
        'I apologize, but I encountered an error. Please try again or contact support.';
      
      // Add error message to conversation
      this.conversation.push({
        role: 'assistant',
        content: errorMessage,
        timestamp: new Date()
      });

      return errorMessage;
    }
  }

  getConversationHistory(): ChatMessage[] {
    return this.conversation.filter(msg => msg.role !== 'system');
  }

  async clearConversation(): Promise<void> {
    try {
      await fetch('/api/chatbot/clear', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          sessionId: this.sessionId
        })
      });

      this.conversation = [];
      // Generate new session ID
      this.sessionId = `session-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    } catch (error) {
      console.error('Error clearing conversation:', error);
      // Clear client-side even if backend call fails
      this.conversation = [];
    }
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
        answer: "Our Professional plan at £399.99 for 400 credits is most popular, covering multiple filings with AI processing."
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

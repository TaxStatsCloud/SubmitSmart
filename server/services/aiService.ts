import { storage } from "../storage";
// Import generateCompletion dynamically to avoid loading issues
// import { generateCompletion } from "./openai";

/**
 * Generates an AI response for the assistant chat
 * @param userMessage User's message content
 * @param userId User ID for contextual information
 * @returns AI-generated response
 */
export async function generateResponse(userMessage: string, userId: number): Promise<string> {
  try {
    // Import the OpenAI function dynamically to avoid initialization issues
    const { generateCompletion } = await import("./openai");
    // Get user context
    const user = await storage.getUser(userId);
    if (!user) {
      throw new Error("User not found");
    }
    
    // Get company context if available
    let companyContext = "";
    if (user.companyId) {
      const company = await storage.getCompany(user.companyId);
      if (company) {
        companyContext = `\nCompany Information:
- Name: ${company.name}
- Registration Number: ${company.registrationNumber}
- Status: ${company.status}
- Incorporation Date: ${company.incorporationDate}
- Registered Address: ${company.registeredAddress}`;
      }
    }
    
    // Get previous messages for context (last 5)
    const previousMessages = await storage.getAssistantMessagesByUser(userId);
    let messageHistory = "";
    
    if (previousMessages.length > 0) {
      // Sort by creation date
      const sortedMessages = [...previousMessages].sort((a, b) => 
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
      
      // Take last 5 messages (or fewer if there aren't 5)
      const recentMessages = sortedMessages.slice(-10);
      
      messageHistory = recentMessages.map(msg => 
        `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`
      ).join("\n\n");
    }
    
    // Create a comprehensive system prompt with context
    const systemPrompt = `You are "Submitra Assistant", an AI assistant specialized in helping UK companies with regulatory filings and compliance.

User Information:
- Name: ${user.fullName}
- Role: ${user.role}
- Email: ${user.email}
- Available Credits: ${user.credits}
${companyContext}

Your expertise includes:
1. UK Companies House filings (Confirmation Statements, Annual Accounts)
2. HMRC Corporation Tax returns (CT600)
3. UK GAAP and IFRS accounting standards
4. UK corporate compliance requirements
5. Document analysis for financial reporting

Guidelines for your responses:
- Be conversational but professional
- Explain technical terms in simple language
- Provide specific, actionable advice
- When uncertain, acknowledge limitations and suggest consulting a professional accountant
- Recommend document uploads when appropriate for detailed analysis
- Mention credit requirements for specific services (10 credits for Confirmation Statement, 25 for Annual Accounts, 30 for Corporation Tax Return)

IMPORTANT: Never make up information about UK compliance laws. If unsure, acknowledge limitations.
IMPORTANT: Recent message history is provided below to maintain conversation context.

${messageHistory ? "Recent conversation history:\n" + messageHistory : "This is a new conversation."}`;

    // Generate AI response using OpenAI
    return await generateCompletion(userMessage, systemPrompt);
  } catch (error) {
    console.error("Error generating assistant response:", error);
    
    // Fallback responses if OpenAI fails
    const fallbacks = [
      "I'm sorry, I'm having trouble connecting to my knowledge base right now. Could you please try again in a moment?",
      "It seems I'm experiencing a temporary issue. Please try your question again shortly.",
      "I apologize for the inconvenience, but I'm unable to process your request at the moment. Please try again later."
    ];
    
    return fallbacks[Math.floor(Math.random() * fallbacks.length)];
  }
}

/**
 * Analyzes financial document content
 * @param documentId ID of the document to analyze
 * @returns Analysis results including extracted data
 */
export async function analyzeFinancialDocument(documentId: number) {
  try {
    const document = await storage.getDocument(documentId);
    
    if (!document) {
      throw new Error('Document not found');
    }
    
    // In a real implementation, this would extract text from the document
    // For now, we'll simulate document content based on the document type
    let simulatedContent = "";
    
    if (document.type === 'trial_balance') {
      simulatedContent = `TRIAL BALANCE
Company: ${document.name.split('.')[0]}
Period End: 30 June 2023

ACCOUNT CODE | ACCOUNT NAME | DEBIT | CREDIT
1000 | Cash | 125000 | 
1100 | Accounts Receivable | 218500 | 
1200 | Inventory | 165000 | 
1300 | Fixed Assets | 349000 | 
2000 | Accounts Payable | | 89500
2100 | Loans | | 232000
3000 | Share Capital | | 150000
3100 | Retained Earnings | | 36000
4000 | Sales Revenue | | 625000
5000 | Cost of Sales | 375000 | 
6000 | Operating Expenses | 215000 | 
TOTALS | | 1447500 | 1447500`;
    } else if (document.type === 'accounting_export') {
      simulatedContent = `ACCOUNTING EXPORT - XERO
Company: ${document.name.split('.')[0]}
Period: 01/01/2023 - 30/06/2023

BALANCE SHEET
Assets:
  Cash: 125000
  Accounts Receivable: 218500
  Inventory: 165000
  Fixed Assets: 349000
  Total Assets: 857500

Liabilities:
  Accounts Payable: 89500
  Loans: 232000
  Total Liabilities: 321500

Equity:
  Share Capital: 150000
  Retained Earnings: 386000
  Total Equity: 536000

PROFIT AND LOSS
Revenue:
  Sales: 625000
  Total Revenue: 625000

Expenses:
  Cost of Sales: 375000
  Operating Expenses: 215000
  Total Expenses: 590000

Net Profit: 35000

Transaction Count: 534`;
    } else if (document.type === 'bank_statement') {
      simulatedContent = `BANK STATEMENT
Bank: Example Bank
Account Number: XXXX-XXXX-XXXX-1234
Period: 01/06/2023 - 30/06/2023
Opening Balance: 98500
Closing Balance: 125000

TRANSACTIONS:
01/06/2023 | PAYMENT RECEIVED | REF: INV-2023-0042 | +15000
03/06/2023 | SUPPLIER PAYMENT | REF: SUP-2023-0021 | -8750
05/06/2023 | PAYMENT RECEIVED | REF: INV-2023-0043 | +22500
08/06/2023 | RENT PAYMENT | REF: RENT-JUN | -4500
10/06/2023 | UTILITY PAYMENT | REF: UTIL-JUN | -1250
12/06/2023 | PAYMENT RECEIVED | REF: INV-2023-0044 | +18000
...40 more transactions...
28/06/2023 | PAYMENT RECEIVED | REF: INV-2023-0049 | +21500
30/06/2023 | STAFF SALARIES | REF: SAL-JUN | -36500

Summary:
Total Inflows: 188500
Total Outflows: 162000
Net Movement: 26500`;
    } else {
      // For other document types, create a generic content representation
      simulatedContent = `Document: ${document.name}
Type: ${document.type}
Size: ${document.size} bytes
Uploaded: ${document.uploadedAt}`;
    }
    
    // Use the OpenAI document analysis function
    const { analyzeDocument } = await import('./openai');
    const analysis = await analyzeDocument(simulatedContent, document.type);
    
    // Update document metadata with analysis results
    await storage.updateDocument(documentId, {
      processingStatus: 'completed',
      processedAt: new Date(),
      metadata: analysis
    });
    
    return analysis;
  } catch (error) {
    console.error(`Error analyzing document ${documentId}:`, error);
    
    // Update document with processing error
    const document = await storage.getDocument(documentId);
    if (document) {
      await storage.updateDocument(documentId, {
        processingStatus: 'failed',
        processedAt: new Date(),
        processingError: error instanceof Error ? error.message : 'Unknown error during document analysis'
      });
    }
    
    throw error;
  }
}

/**
 * Generates a draft filing based on submitted documents
 * @param filingType Type of filing to generate
 * @param documentIds Array of document IDs to use
 * @param companyId Company ID
 * @returns Generated filing data
 */
export async function generateDraft(filingType: string, documentIds: number[], companyId: number) {
  try {
    // Get company information
    const company = await storage.getCompany(companyId);
    
    if (!company) {
      throw new Error('Company not found');
    }
    
    // Get documents
    const documents = await Promise.all(
      documentIds.map(id => storage.getDocument(id))
    );
    
    const validDocuments = documents.filter(doc => doc !== undefined) as any[];
    
    if (validDocuments.length === 0) {
      throw new Error('No valid documents found for draft generation');
    }
    
    // Collect document analysis data
    const documentData = validDocuments.map(doc => ({
      id: doc.id,
      name: doc.name,
      type: doc.type,
      metadata: doc.metadata || {}
    }));
    
    // Format company data for the AI
    const companyData = {
      name: company.name,
      registrationNumber: company.registrationNumber,
      registeredAddress: company.registeredAddress,
      incorporationDate: company.incorporationDate,
      accountingReference: company.accountingReference,
      status: company.status
    };
    
    // Use the OpenAI draft generation function
    const { generateFilingDraft } = await import('./openai');
    return await generateFilingDraft(filingType, companyData, documentData);
  } catch (error) {
    console.error(`Error generating ${filingType} draft:`, error);
    throw error;
  }
}

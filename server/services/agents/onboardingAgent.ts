/**
 * Onboarding Agent
 * 
 * This agent is responsible for:
 * 1. Managing the user onboarding process
 * 2. Tracking document uploads and processing them
 * 3. Guiding users through the filing preparation workflow
 */

import { db } from "../../db";
import { users, companies, documents, filings, agentRuns, activities } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import { logger } from "../../utils/logger";
import { emailService } from "../emailService";
import { analyzeDocument } from "../openai";

// Creating a specialized logger for this agent
const agentLogger = logger.withContext('OnboardingAgent');

/**
 * Main function to handle onboarding for a new user
 * This is triggered when a user signs up
 */
export async function onboardNewUser(userId: number): Promise<{
  success: boolean;
  userId: number;
}> {
  try {
    // Start a new agent run
    const [agentRun] = await db
      .insert(agentRuns)
      .values({
        agentType: 'onboarding',
        status: 'running',
        startedAt: new Date(),
        createdAt: new Date(),
        metrics: {},
        metadata: { userId }
      })
      .returning();

    agentLogger.info(`Starting onboarding agent run for user ${userId}: ${agentRun.id}`);

    // Get user data with company information
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId));
    
    if (!user) {
      throw new Error(`User ${userId} not found`);
    }
    
    // Get company data if the user is associated with a company
    let company = null;
    if (user.companyId) {
      [company] = await db
        .select()
        .from(companies)
        .where(eq(companies.id, user.companyId));
    }
    
    // Send welcome email
    await emailService.sendWelcomeEmail(user.email, user.fullName);
    
    // Create activity record for user signup
    await db
      .insert(activities)
      .values({
        userId: user.id,
        companyId: user.companyId,
        type: 'user_signup',
        description: `${user.fullName} created an account`,
        createdAt: new Date()
      });
    
    // Update agent run with completion status
    await db
      .update(agentRuns)
      .set({
        status: 'completed',
        completedAt: new Date(),
        metrics: {
          userOnboarded: true
        }
      })
      .where(eq(agentRuns.id, agentRun.id));
    
    agentLogger.info(`Completed onboarding agent run for user ${userId}`);
    
    return {
      success: true,
      userId: user.id
    };
  } catch (error) {
    agentLogger.error(`Error in onboarding agent for user ${userId}:`, error);
    throw error;
  }
}

/**
 * Process an uploaded document
 * This is triggered when a user uploads a document
 */
export async function processUploadedDocument(documentId: number): Promise<{
  success: boolean;
  documentId: number;
  processingComplete: boolean;
}> {
  try {
    // Start a new agent run for document processing
    const [agentRun] = await db
      .insert(agentRuns)
      .values({
        agentType: 'document_processing',
        status: 'running',
        startedAt: new Date(),
        createdAt: new Date(),
        metrics: {},
        metadata: { documentId }
      })
      .returning();

    agentLogger.info(`Starting document processing agent run: ${agentRun.id}`);

    // Get document data
    const [document] = await db
      .select()
      .from(documents)
      .where(eq(documents.id, documentId));
    
    if (!document) {
      throw new Error(`Document ${documentId} not found`);
    }
    
    // Update document status to processing
    await db
      .update(documents)
      .set({
        processingStatus: 'processing'
      })
      .where(eq(documents.id, documentId));
    
    // Get user and company data
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, document.userId));
    
    const [company] = await db
      .select()
      .from(companies)
      .where(eq(companies.id, document.companyId));
    
    // Analyze the document using OpenAI
    try {
      const analysisResult = await analyzeDocumentContent(document);
      
      // Update document with analysis results
      await db
        .update(documents)
        .set({
          processingStatus: 'completed',
          processedAt: new Date(),
          metadata: analysisResult
        })
        .where(eq(documents.id, documentId));
      
      // Create activity record for document processing
      await db
        .insert(activities)
        .values({
          userId: user.id,
          companyId: company.id,
          type: 'document_processed',
          description: `Document "${document.name}" was processed successfully`,
          createdAt: new Date(),
          metadata: {
            documentId: document.id,
            documentType: document.type
          }
        });
      
      // Check if we can generate a filing draft
      const canGenerateDraft = await checkForFilingDraftGeneration(document.companyId, document.type);
      
      // Update agent run with completion status
      await db
        .update(agentRuns)
        .set({
          status: 'completed',
          completedAt: new Date(),
          metrics: {
            documentProcessed: true,
            processingTime: new Date().getTime() - new Date(agentRun.startedAt || 0).getTime(),
            canGenerateDraft
          }
        })
        .where(eq(agentRuns.id, agentRun.id));
      
      agentLogger.info(`Document ${documentId} processed successfully`);
      
      // If we can generate a filing draft, do it now
      if (canGenerateDraft.canGenerate) {
        await generateFilingDraft(document.companyId, canGenerateDraft.filingType, user.id);
      }
      
      return {
        success: true,
        documentId: document.id,
        processingComplete: true
      };
    } catch (error) {
      // Update document with error status
      await db
        .update(documents)
        .set({
          processingStatus: 'failed',
          processingError: error.message || 'Unknown error during processing'
        })
        .where(eq(documents.id, documentId));
      
      // Update agent run with error status
      await db
        .update(agentRuns)
        .set({
          status: 'failed',
          completedAt: new Date(),
          error: error.message || 'Unknown error during processing'
        })
        .where(eq(agentRuns.id, agentRun.id));
      
      agentLogger.error(`Error processing document ${documentId}:`, error);
      
      return {
        success: false,
        documentId: document.id,
        processingComplete: false
      };
    }
  } catch (error) {
    agentLogger.error(`Error in document processing agent for document ${documentId}:`, error);
    throw error;
  }
}

/**
 * Send welcome email to a new user
 */
async function sendWelcomeEmail(user: any, company: any | null): Promise<boolean> {
  const companyName = company ? company.name : 'your company';
  
  const htmlContent = `
    <html>
      <body>
        <h2>Welcome to PromptSubmissions!</h2>
        
        <p>Dear ${user.fullName},</p>
        
        <p>Thank you for signing up with PromptSubmissions, your AI-powered filing and compliance platform for UK companies.</p>
        
        <p>We're excited to help you streamline your regulatory compliance processes for ${companyName}.</p>
        
        <h3>Getting Started</h3>
        
        <p>Here's what you can do next:</p>
        
        <ol>
          <li><strong>Upload your financial documents</strong> - We'll analyze them automatically</li>
          <li><strong>Set up your company profile</strong> - Ensure all your company details are correct</li>
          <li><strong>Start a new filing</strong> - Choose from Confirmation Statements, Annual Accounts, or Corporation Tax returns</li>
        </ol>
        
        <p><a href="https://promptsubmissions.com/dashboard">Click here to access your dashboard</a></p>
        
        <p>If you have any questions, simply reply to this email or use the AI assistant in the application.</p>
        
        <p>Best regards,<br>
        The PromptSubmissions Team</p>
      </body>
    </html>
  `;
  
  return await sendEmail({
    to: user.email,
    from: "welcome@promptsubmissions.com",
    subject: "Welcome to PromptSubmissions",
    html: htmlContent
  });
}

/**
 * Analyze document content using OpenAI
 * This is a placeholder that would call the actual OpenAI service
 */
async function analyzeDocumentContent(document: any): Promise<any> {
  agentLogger.info(`Analyzing document: ${document.name} (${document.type})`);
  
  // This is a placeholder for the actual OpenAI analysis
  // In a real implementation, this would use the OpenAI service to analyze the document content
  
  // For now, return placeholder analysis based on document type
  const documentTypes = {
    'trial_balance': {
      periodEnd: new Date().toISOString().split('T')[0],
      totalAssets: 1250000,
      totalLiabilities: 850000,
      netAssets: 400000,
      revenue: 2500000,
      profit: 350000,
      lineItems: 120
    },
    'invoice': {
      invoiceNumber: 'INV-' + Math.floor(Math.random() * 10000),
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      totalAmount: Math.floor(Math.random() * 10000),
      vatAmount: Math.floor(Math.random() * 2000),
      items: 5
    },
    'bank_statement': {
      bankName: 'Example Bank',
      accountNumber: 'XXXX' + Math.floor(Math.random() * 10000),
      periodStart: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      periodEnd: new Date().toISOString().split('T')[0],
      openingBalance: Math.floor(Math.random() * 100000),
      closingBalance: Math.floor(Math.random() * 100000),
      transactions: Math.floor(Math.random() * 100)
    },
    'accounting_export': {
      softwareName: 'Example Accounting',
      periodStart: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      periodEnd: new Date().toISOString().split('T')[0],
      accounts: Math.floor(Math.random() * 200),
      transactions: Math.floor(Math.random() * 5000)
    }
  };
  
  // Return metadata based on document type, or a generic metadata object
  return documentTypes[document.type] || {
    fileType: document.contentType,
    pageCount: Math.floor(Math.random() * 20) + 1,
    extracted: {}
  };
}

/**
 * Check if we have enough documents to generate a filing draft
 */
async function checkForFilingDraftGeneration(companyId: number, documentType: string): Promise<{
  canGenerate: boolean;
  filingType: string;
  missingDocuments: string[];
}> {
  // Get all processed documents for this company
  const processedDocuments = await db
    .select()
    .from(documents)
    .where(
      and(
        eq(documents.companyId, companyId),
        eq(documents.processingStatus, 'completed')
      )
    );
  
  // Get document types
  const documentTypes = processedDocuments.map(doc => doc.type);
  
  // Required documents for different filing types
  const requiredDocuments = {
    'confirmation_statement': ['company_details', 'shareholders_list'],
    'annual_accounts': ['trial_balance', 'bank_statement', 'accounting_export'],
    'corporation_tax': ['trial_balance', 'tax_computation', 'accounting_export']
  };
  
  // Determine which filing type this document is most relevant for
  let relevantFilingType = '';
  if (['company_details', 'shareholders_list'].includes(documentType)) {
    relevantFilingType = 'confirmation_statement';
  } else if (['trial_balance', 'bank_statement', 'accounting_export'].includes(documentType)) {
    relevantFilingType = 'annual_accounts';
  } else if (['trial_balance', 'tax_computation', 'accounting_export'].includes(documentType)) {
    relevantFilingType = 'corporation_tax';
  }
  
  if (!relevantFilingType) {
    return {
      canGenerate: false,
      filingType: '',
      missingDocuments: []
    };
  }
  
  // Check if we have all required documents for this filing type
  const required = requiredDocuments[relevantFilingType];
  const missing = required.filter(docType => !documentTypes.includes(docType));
  
  return {
    canGenerate: missing.length === 0,
    filingType: relevantFilingType,
    missingDocuments: missing
  };
}

/**
 * Generate a filing draft based on processed documents
 */
async function generateFilingDraft(companyId: number, filingType: string, userId: number): Promise<{
  success: boolean;
  filingId?: number;
}> {
  try {
    agentLogger.info(`Generating ${filingType} draft for company ${companyId}`);
    
    // Get processed documents for this company and filing type
    const documents = await db
      .select()
      .from(documents)
      .where(
        and(
          eq(documents.companyId, companyId),
          eq(documents.processingStatus, 'completed')
        )
      );
    
    // Get document IDs
    const documentIds = documents.map(doc => doc.id);
    
    // Create a new filing draft
    const [filing] = await db
      .insert(filings)
      .values({
        companyId,
        userId,
        type: filingType,
        status: 'draft',
        createdAt: new Date(),
        updatedAt: new Date(),
        documentIds,
        progress: 30, // Start with 30% progress since we already have documents
        data: {
          generatedFromDocuments: true,
          documentIds,
          status: 'generated'
        }
      })
      .returning();
    
    // Create activity record for filing generation
    await db
      .insert(activities)
      .values({
        userId,
        companyId,
        type: 'filing_generate',
        description: `${filingType} draft was generated automatically`,
        createdAt: new Date(),
        metadata: {
          filingId: filing.id,
          filingType,
          documentIds
        }
      });
    
    agentLogger.info(`Generated ${filingType} draft with ID ${filing.id}`);
    
    return {
      success: true,
      filingId: filing.id
    };
  } catch (error) {
    agentLogger.error(`Error generating ${filingType} draft for company ${companyId}:`, error);
    return {
      success: false
    };
  }
}

/**
 * Send document reminder email
 */
export async function sendDocumentReminder(userId: number, filingType: string, missingDocuments: string[]): Promise<boolean> {
  try {
    // Get user data
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId));
    
    if (!user) {
      throw new Error(`User ${userId} not found`);
    }
    
    // Get company data
    let company = null;
    if (user.companyId) {
      [company] = await db
        .select()
        .from(companies)
        .where(eq(companies.id, user.companyId));
    }
    
    if (!company) {
      throw new Error(`Company not found for user ${userId}`);
    }
    
    // Format missing documents for display
    const formattedDocuments = missingDocuments.map(doc => {
      // Convert snake_case to Title Case
      return doc.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    });
    
    // Format filing type for display
    const formattedFilingType = filingType
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    
    // Generate email content
    const htmlContent = `
      <html>
        <body>
          <h2>Additional Documents Needed</h2>
          
          <p>Dear ${user.fullName},</p>
          
          <p>We've started preparing your ${formattedFilingType} for ${company.name}, but we need a few more documents to complete it.</p>
          
          <p>Please upload the following documents to continue:</p>
          
          <ul>
            ${formattedDocuments.map(doc => `<li>${doc}</li>`).join('')}
          </ul>
          
          <p><a href="https://promptsubmissions.com/dashboard/documents/upload">Click here to upload documents</a></p>
          
          <p>Once we have all the required documents, we'll be able to complete your filing draft automatically.</p>
          
          <p>Best regards,<br>
          The PromptSubmissions Team</p>
        </body>
      </html>
    `;
    
    // Send the email
    return await sendEmail({
      to: user.email,
      from: "filings@promptsubmissions.com",
      subject: `Additional Documents Needed for Your ${formattedFilingType}`,
      html: htmlContent
    });
  } catch (error) {
    agentLogger.error(`Error sending document reminder to user ${userId}:`, error);
    return false;
  }
}
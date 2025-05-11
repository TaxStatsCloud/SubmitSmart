/**
 * Contact Research Agent
 * 
 * This agent is responsible for:
 * 1. Finding contact information for companies in our database
 * 2. Using AI to search for and validate contact details
 * 3. Storing the contact information for outreach
 */

import { db } from "../../db";
import { companies, companyContacts, agentRuns } from "@shared/schema";
import { eq, isNull, not, inArray } from "drizzle-orm";
import { logger } from "../../utils/logger";
import OpenAI from "openai";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Creating a specialized logger for this agent
const agentLogger = logger.withContext('ContactResearchAgent');

/**
 * Main function to find contact information for companies
 * This will be run on a schedule (e.g., daily)
 */
export async function findCompanyContactInformation(batchSize: number = 10): Promise<{
  processed: number;
  contactsFound: number;
}> {
  try {
    // Start a new agent run
    const [agentRun] = await db
      .insert(agentRuns)
      .values({
        agentType: 'contact_research',
        status: 'running',
        startedAt: new Date(),
        createdAt: new Date(),
        metrics: {},
        metadata: { batchSize }
      })
      .returning();

    agentLogger.info(`Starting contact research agent run: ${agentRun.id}`);

    // Get companies without contact information
    const companiesWithoutContacts = await getCompaniesWithoutContacts(batchSize);
    
    agentLogger.info(`Found ${companiesWithoutContacts.length} companies to research`);
    
    let contactsFound = 0;
    
    // Process each company to find contact information
    for (const company of companiesWithoutContacts) {
      try {
        const contactResult = await findContactForCompany(company);
        
        if (contactResult.found) {
          contactsFound++;
        }
        
        // Implement rate limiting to avoid API limits and be respectful of services
        await rateLimitDelay(3000); // 3 second delay between requests
      } catch (error) {
        agentLogger.error(`Error researching contacts for ${company.name}:`, error);
        // Continue with the next company - don't let one failure stop the process
      }
    }
    
    // Update agent run with completion status
    await db
      .update(agentRuns)
      .set({
        status: 'completed',
        completedAt: new Date(),
        metrics: {
          companiesProcessed: companiesWithoutContacts.length,
          contactsFound
        }
      })
      .where(eq(agentRuns.id, agentRun.id));
    
    agentLogger.info(`Completed contact research agent run: ${agentRun.id}`, {
      companiesProcessed: companiesWithoutContacts.length,
      contactsFound
    });
    
    return {
      processed: companiesWithoutContacts.length,
      contactsFound
    };
  } catch (error) {
    agentLogger.error('Error in contact research agent:', error);
    throw error;
  }
}

/**
 * Get companies that don't have contact information yet
 */
async function getCompaniesWithoutContacts(limit: number): Promise<any[]> {
  // First get companies that have no contacts at all
  const companiesWithNoContacts = await db
    .select()
    .from(companies)
    .where(
      not(
        inArray(
          companies.id,
          db.select({ id: companyContacts.companyId }).from(companyContacts)
        )
      )
    )
    .limit(limit);

  // If we didn't fill our limit, get companies that have contacts marked as "not_found"
  // that we might want to try researching again
  if (companiesWithNoContacts.length < limit) {
    const remainingLimit = limit - companiesWithNoContacts.length;
    
    // Get companies with only "not_found" contacts that were researched more than 30 days ago
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const companiesWithOldFailedResearch = await db.execute(/* sql */`
      SELECT c.* FROM companies c
      JOIN company_contacts cc ON c.id = cc.company_id
      WHERE cc.verification_status = 'not_found'
      AND cc.created_at < $1
      AND NOT EXISTS (
        SELECT 1 FROM company_contacts cc2
        WHERE cc2.company_id = c.id
        AND cc2.verification_status != 'not_found'
      )
      LIMIT $2
    `, [thirtyDaysAgo, remainingLimit]);
    
    return [...companiesWithNoContacts, ...companiesWithOldFailedResearch];
  }
  
  return companiesWithNoContacts;
}

/**
 * Find contact information for a specific company
 */
async function findContactForCompany(company: any): Promise<{
  found: boolean;
  contactId?: number;
}> {
  agentLogger.info(`Researching contacts for: ${company.name} (${company.registrationNumber})`);
  
  try {
    // Use OpenAI to find contact information
    const emailResult = await findCompanyEmailWithAI(company);
    
    if (emailResult && emailResult !== "Not found" && isValidEmail(emailResult)) {
      // We found a valid email, store it in the database
      const [contact] = await db
        .insert(companyContacts)
        .values({
          companyId: company.id,
          email: emailResult,
          source: "ai_research",
          verificationStatus: "pending",
          isPrimary: true,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();
      
      agentLogger.info(`Found contact email for ${company.name}: ${emailResult}`);
      
      return {
        found: true,
        contactId: contact.id
      };
    } else {
      // No valid email found, mark as researched but not found
      const [contact] = await db
        .insert(companyContacts)
        .values({
          companyId: company.id,
          email: null,
          source: "ai_research",
          verificationStatus: "not_found",
          isPrimary: false,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();
      
      agentLogger.info(`No contact email found for ${company.name}`);
      
      return {
        found: false,
        contactId: contact.id
      };
    }
  } catch (error) {
    agentLogger.error(`Error finding contact for ${company.name}:`, error);
    
    // Record the failure in the database
    await db
      .insert(companyContacts)
      .values({
        companyId: company.id,
        email: null,
        source: "ai_research",
        verificationStatus: "error",
        isPrimary: false,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    
    throw error;
  }
}

/**
 * Use OpenAI to find an email address for a company
 */
async function findCompanyEmailWithAI(company: any): Promise<string | null> {
  try {
    // Create a prompt that asks OpenAI to find company contact information
    const prompt = `Find the official contact email address for the UK registered company "${company.name}" with registration number ${company.registrationNumber}. The company address is ${company.registeredAddress}. Return ONLY the email address if found, or "Not found" if no email could be identified. Do not include any explanations or additional text.`;
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        { 
          role: "system", 
          content: "You are a research assistant tasked with finding official company contact information. Only return the exact email address found or 'Not found'. No other text." 
        },
        { 
          role: "user", 
          content: prompt 
        }
      ],
      temperature: 0.2, // Low temperature for more focused responses
      max_tokens: 100
    });
    
    const result = response.choices[0].message.content?.trim();
    
    return result || null;
  } catch (error) {
    agentLogger.error('Error using OpenAI to find company email:', error);
    return null;
  }
}

/**
 * Validate an email address format
 */
function isValidEmail(email: string): boolean {
  // Regular expression for basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Add a delay between API requests to respect rate limits
 */
async function rateLimitDelay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
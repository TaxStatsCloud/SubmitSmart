/**
 * Companies House Agent
 * 
 * This agent is responsible for:
 * 1. Collecting data about companies from Companies House API
 * 2. Identifying companies with upcoming filing deadlines
 * 3. Storing this information in the database for further processing
 */

import { db } from "../../db";
import { companies, filingReminders, agentRuns, prospects } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import { executeTransaction } from "../../db";
import { logger } from "../../utils/logger";

// Interface for Companies House API response
interface CompaniesHouseCompany {
  company_number: string;
  company_name: string;
  company_status: string;
  company_type: string;
  registered_office_address: {
    address_line_1?: string;
    address_line_2?: string;
    locality?: string;
    postal_code?: string;
    country?: string;
  };
  incorporation_date?: string;
  next_accounts_due?: string;
  next_confirmation_statement_due?: string;
  sic_codes?: string[];
}

/**
 * Main function to identify companies with upcoming filing deadlines
 * This will be run on a schedule (e.g., weekly)
 */
export async function identifyCompaniesWithUpcomingFilings(): Promise<{ 
  processed: number; 
  filingReminders: number; 
}> {
  try {
    // Start a new agent run
    const [agentRun] = await db
      .insert(agentRuns)
      .values({
        agentType: 'companies_house',
        status: 'running',
        startedAt: new Date(),
        createdAt: new Date(),
        metrics: {},
        metadata: {}
      })
      .returning();

    logger.info(`Starting Companies House agent run: ${agentRun.id}`);

    // Fetch companies with upcoming filings from Companies House API
    const companiesData = await fetchCompaniesWithUpcomingFilings();
    
    let filingRemindersCreated = 0;
    let prospectsCreated = 0;
    let prospectsUpdated = 0;
    
    // Process each company and create filing reminders + prospects
    for (const companyData of companiesData) {
      const companyId = await processCompany(companyData);
      
      // Create filing reminders for the company
      if (companyData.next_confirmation_statement_due) {
        await createFilingReminder(
          companyId, 
          'confirmation_statement', 
          new Date(companyData.next_confirmation_statement_due)
        );
        filingRemindersCreated++;
      }
      
      if (companyData.next_accounts_due) {
        await createFilingReminder(
          companyId, 
          'annual_accounts', 
          new Date(companyData.next_accounts_due)
        );
        filingRemindersCreated++;
      }
      
      // Create or update prospect record with lead scoring
      const prospectResult = await createOrUpdateProspect(companyData, agentRun.id);
      if (prospectResult.created) {
        prospectsCreated++;
      } else {
        prospectsUpdated++;
      }
    }
    
    // Update agent run with completion status
    await db
      .update(agentRuns)
      .set({
        status: 'completed',
        completedAt: new Date(),
        metrics: {
          companiesProcessed: companiesData.length,
          filingRemindersCreated,
          prospectsCreated,
          prospectsUpdated
        }
      })
      .where(eq(agentRuns.id, agentRun.id));
    
    logger.info(`Completed Companies House agent run: ${agentRun.id}`, {
      companiesProcessed: companiesData.length,
      filingRemindersCreated
    });
    
    return {
      processed: companiesData.length,
      filingReminders: filingRemindersCreated
    };
  } catch (error) {
    logger.error('Error in Companies House agent:', error);
    throw error;
  }
}

/**
 * Fetch companies with upcoming filings from Companies House API
 */
async function fetchCompaniesWithUpcomingFilings(): Promise<CompaniesHouseCompany[]> {
  logger.info('Fetching companies with upcoming filings from Companies House API');
  
  // Check if API key is configured
  if (!process.env.COMPANIES_HOUSE_API_KEY) {
    logger.warn('COMPANIES_HOUSE_API_KEY not configured - skipping Companies House API discovery');
    return [];
  }

  try {
    // Import the Companies House API service
    const { companiesHouseApiService } = await import('../companiesHouseApiService');
    
    // Enhanced search strategy with industry targeting
    // Priority sectors: Professional services, retail, tech, hospitality, construction
    const searchQueries = [
      // General company types
      'Limited', 'Ltd', 'LLP', 'PLC',
      // Industry-specific terms for better targeting
      'Consulting', 'Services', 'Solutions', 'Digital', 'Technology',
      'Retail', 'Restaurant', 'Cafe', 'Construction', 'Property'
    ];
    
    const allCompanies: CompaniesHouseCompany[] = [];
    const seenCompanies = new Set<string>(); // Deduplication
    
    for (const query of searchQueries) {
      const companies = await companiesHouseApiService.getCompaniesWithUpcomingDeadlines(
        query,
        90, // days ahead
        50  // Increased from 20 to 50 results per query for better coverage
      );
      
      // Map to expected format with deduplication
      for (const { profile } of companies) {
        // Skip if we've already seen this company
        if (seenCompanies.has(profile.company_number)) {
          continue;
        }
        seenCompanies.add(profile.company_number);
        
        allCompanies.push({
          company_number: profile.company_number,
          company_name: profile.company_name,
          company_status: profile.company_status,
          company_type: profile.type || 'ltd',
          registered_office_address: {
            address_line_1: profile.registered_office_address?.address_line_1 || '',
            locality: profile.registered_office_address?.locality || '',
            postal_code: profile.registered_office_address?.postal_code || ''
          },
          incorporation_date: profile.date_of_creation,
          next_accounts_due: profile.accounts?.next_due,
          next_confirmation_statement_due: profile.confirmation_statement?.next_due,
          sic_codes: profile.sic_codes || []
        });
      }
      
      // Adaptive rate limiting: faster for early queries, slower to avoid API limits
      const delay = allCompanies.length > 200 ? 1000 : 500;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    logger.info(`Found ${allCompanies.length} companies with upcoming filings`);
    return allCompanies;
  } catch (error) {
    logger.error('Error fetching from Companies House API:', error);
    return [];
  }
}

/**
 * Process a company from Companies House data
 * Store or update in our database
 */
async function processCompany(companyData: CompaniesHouseCompany): Promise<number> {
  try {
    // Try to find if the company already exists in our database
    const [existingCompany] = await db
      .select()
      .from(companies)
      .where(eq(companies.registrationNumber, companyData.company_number));
    
    if (existingCompany) {
      // Update existing company with latest data
      const [updatedCompany] = await db
        .update(companies)
        .set({
          name: companyData.company_name,
          status: companyData.company_status,
        })
        .where(eq(companies.id, existingCompany.id))
        .returning();
      
      return updatedCompany.id;
    } else {
      // Create new company record
      const formattedAddress = formatCompaniesHouseAddress(companyData.registered_office_address);
      
      const [newCompany] = await db
        .insert(companies)
        .values({
          name: companyData.company_name,
          registrationNumber: companyData.company_number,
          registeredAddress: formattedAddress,
          incorporationDate: companyData.incorporation_date ? new Date(companyData.incorporation_date) : new Date(),
          status: companyData.company_status
        })
        .returning();
      
      return newCompany.id;
    }
  } catch (error) {
    logger.error(`Error processing company ${companyData.company_number}:`, error);
    throw error;
  }
}

/**
 * Create a filing reminder for a company
 */
async function createFilingReminder(
  companyId: number, 
  filingType: string, 
  dueDate: Date
): Promise<void> {
  try {
    // Check if a reminder already exists
    const existingReminder = await db.query.filingReminders.findFirst({
      where: and(
        eq(filingReminders.companyId, companyId),
        eq(filingReminders.filingType, filingType),
        eq(filingReminders.status, 'pending')
      )
    });
    
    if (existingReminder) {
      // Update the existing reminder if the due date changed
      if (existingReminder.dueDate.getTime() !== dueDate.getTime()) {
        await db
          .update(filingReminders)
          .set({ dueDate })
          .where(eq(filingReminders.id, existingReminder.id));
      }
    } else {
      // Create a new reminder
      await db
        .insert(filingReminders)
        .values({
          companyId,
          filingType,
          dueDate,
          status: 'pending',
          createdAt: new Date()
        });
    }
  } catch (error) {
    logger.error(`Error creating filing reminder for company ${companyId}:`, error);
    throw error;
  }
}

/**
 * Create or update prospect record with lead scoring
 */
async function createOrUpdateProspect(
  companyData: CompaniesHouseCompany, 
  agentRunId: number
): Promise<{ created: boolean }> {
  try {
    // Calculate lead score based on deadline urgency
    let leadScore = 0;
    
    // Active company status
    if (companyData.company_status === 'active') {
      leadScore += 30;
    }
    
    // Score based on accounts deadline proximity
    if (companyData.next_accounts_due) {
      const daysUntil = getDaysUntil(companyData.next_accounts_due);
      if (daysUntil <= 30) {
        leadScore += 40;
      } else if (daysUntil <= 60) {
        leadScore += 30;
      } else if (daysUntil <= 90) {
        leadScore += 20;
      }
    }
    
    // Score based on CS deadline
    if (companyData.next_confirmation_statement_due) {
      const daysUntil = getDaysUntil(companyData.next_confirmation_statement_due);
      if (daysUntil <= 30) {
        leadScore += 20;
      } else if (daysUntil <= 60) {
        leadScore += 15;
      } else if (daysUntil <= 90) {
        leadScore += 10;
      }
    }
    
    leadScore = Math.min(leadScore, 100);
    
    // Check if prospect already exists
    const existingProspect = await db.query.prospects.findFirst({
      where: eq(prospects.companyNumber, companyData.company_number)
    });
    
    if (existingProspect) {
      // Update existing prospect - preserve lead status and other CRM fields
      await db.update(prospects)
        .set({
          // Only update fields from Companies House API
          companyName: companyData.company_name,
          companyStatus: companyData.company_status,
          incorporationDate: companyData.incorporation_date || null,
          accountsDueDate: companyData.next_accounts_due || null,
          confirmationStatementDueDate: companyData.next_confirmation_statement_due || null,
          entitySize: 'micro', // Default heuristic
          sic_codes: companyData.sic_codes || [],
          leadScore, // Update score based on new deadlines
          // Preserve existing leadStatus - DO NOT reset to 'new'
          agentRunId, // Track latest discovery run
          updatedAt: new Date()
        })
        .where(eq(prospects.id, existingProspect.id));
      
      return { created: false };
    } else {
      // Create new prospect with default leadStatus='new'
      const prospectData = {
        companyNumber: companyData.company_number,
        companyName: companyData.company_name,
        companyStatus: companyData.company_status,
        incorporationDate: companyData.incorporation_date || null,
        accountsDueDate: companyData.next_accounts_due || null,
        confirmationStatementDueDate: companyData.next_confirmation_statement_due || null,
        entitySize: 'micro', // Default heuristic
        sic_codes: companyData.sic_codes || [],
        leadScore,
        leadStatus: 'new',
        agentRunId,
        discoverySource: 'companies_house_api'
      };
      
      await db.insert(prospects).values(prospectData);
      return { created: true };
    }
  } catch (error) {
    logger.error(`Error creating/updating prospect for ${companyData.company_number}:`, error);
    return { created: false };
  }
}

/**
 * Calculate days until a date
 */
function getDaysUntil(dateStr: string): number {
  const targetDate = new Date(dateStr);
  const today = new Date();
  const diffTime = targetDate.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Format Companies House address into a single string
 */
function formatCompaniesHouseAddress(address: any): string {
  const parts = [];
  
  if (address.address_line_1) parts.push(address.address_line_1);
  if (address.address_line_2) parts.push(address.address_line_2);
  if (address.locality) parts.push(address.locality);
  if (address.postal_code) parts.push(address.postal_code);
  if (address.country) parts.push(address.country);
  
  return parts.join(', ');
}
/**
 * Outreach Email Agent
 * 
 * This agent is responsible for:
 * 1. Identifying companies with upcoming filings and valid contact information
 * 2. Generating and sending personalized outreach emails
 * 3. Tracking outreach campaign results
 */

import { db } from "../../db";
import { companies, companyContacts, filingReminders, outreachCampaigns, agentRuns } from "@shared/schema";
import { eq, and, gte, lte, not, inArray } from "drizzle-orm";
import { logger } from "../../utils/logger";
import { sendEmail } from "../emailService";

// Creating a specialized logger for this agent
const agentLogger = logger.withContext('OutreachEmailAgent');

// Timeframes for different email types (in days)
const TIMEFRAMES = {
  ADVANCE_NOTICE: {
    MIN: 30,  // 1 month before deadline
    MAX: 90   // 3 months before deadline
  },
  REMINDER: {
    MIN: 14,  // 2 weeks before deadline
    MAX: 30   // 1 month before deadline
  },
  URGENT: {
    MIN: 1,   // 1 day before deadline
    MAX: 14   // 2 weeks before deadline
  }
};

/**
 * Main function to send filing reminder emails
 * This will be run on a schedule (e.g., daily)
 */
export async function sendFilingReminderEmails(): Promise<{
  processed: number;
  emailsSent: number;
}> {
  try {
    // Start a new agent run
    const [agentRun] = await db
      .insert(agentRuns)
      .values({
        agentType: 'outreach_email',
        status: 'running',
        startedAt: new Date(),
        createdAt: new Date(),
        metrics: {},
        metadata: {}
      })
      .returning();

    agentLogger.info(`Starting outreach email agent run: ${agentRun.id}`);

    // Get eligible companies for reminder emails
    const eligibleCompanies = await getCompaniesForReminders();
    
    agentLogger.info(`Found ${eligibleCompanies.length} companies eligible for reminders`);
    
    let emailsSent = 0;
    
    // Process each company to send appropriate reminders
    for (const company of eligibleCompanies) {
      try {
        const emailSendingResult = await processCompanyReminders(company);
        
        if (emailSendingResult.sent) {
          emailsSent++;
        }
        
        // Implement rate limiting to avoid email service limits
        await rateLimitDelay(1000); // 1 second delay between emails
      } catch (error) {
        agentLogger.error(`Error sending reminder for ${company.name}:`, error);
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
          companiesProcessed: eligibleCompanies.length,
          emailsSent
        }
      })
      .where(eq(agentRuns.id, agentRun.id));
    
    agentLogger.info(`Completed outreach email agent run: ${agentRun.id}`, {
      companiesProcessed: eligibleCompanies.length,
      emailsSent
    });
    
    return {
      processed: eligibleCompanies.length,
      emailsSent
    };
  } catch (error) {
    agentLogger.error('Error in outreach email agent:', error);
    throw error;
  }
}

/**
 * Get companies eligible for filing reminder emails
 */
async function getCompaniesForReminders(): Promise<any[]> {
  // The approach here is to get companies that:
  // 1. Have valid contact information
  // 2. Have pending filings with upcoming deadlines
  // 3. Haven't received a reminder email in the last 7 days
  
  const today = new Date();
  const threeMothsFromNow = new Date(today);
  threeMothsFromNow.setDate(today.getDate() + 90);
  
  const oneWeekAgo = new Date(today);
  oneWeekAgo.setDate(today.getDate() - 7);
  
  const companies = await db.execute(/* sql */`
    SELECT 
      c.*,
      json_agg(fr.*) as filing_reminders,
      json_agg(cc.*) as contacts
    FROM 
      companies c
    JOIN 
      filing_reminders fr ON c.id = fr.company_id
    JOIN 
      company_contacts cc ON c.id = cc.company_id
    WHERE 
      fr.status = 'pending'
      AND fr.due_date BETWEEN NOW() AND $1
      AND cc.email IS NOT NULL
      AND cc.verification_status != 'bounce'
      AND cc.verification_status != 'unsubscribed'
      AND (fr.last_reminder_sent IS NULL OR fr.last_reminder_sent < $2)
      AND NOT EXISTS (
        SELECT 1 FROM outreach_campaigns oc
        WHERE oc.company_id = c.id
        AND oc.campaign_type = 'filing_reminder'
        AND oc.sent_at > $2
      )
    GROUP BY c.id
  `, [threeMothsFromNow, oneWeekAgo]);
  
  return companies;
}

/**
 * Process filings for a company and send reminders as needed
 */
async function processCompanyReminders(company: any): Promise<{
  sent: boolean;
  campaignId?: number;
}> {
  agentLogger.info(`Processing reminders for: ${company.name}`);
  
  try {
    // Find primary contact or use the first valid contact
    const contacts = company.contacts || [];
    const primaryContact = contacts.find((c: any) => c.is_primary) || contacts[0];
    
    if (!primaryContact || !primaryContact.email) {
      agentLogger.warn(`No valid contact found for ${company.name}`);
      return { sent: false };
    }
    
    // Get filing reminders and determine the most urgent one
    const filingReminders = company.filing_reminders || [];
    if (filingReminders.length === 0) {
      return { sent: false };
    }
    
    // Sort reminders by due date (ascending)
    filingReminders.sort((a: any, b: any) => {
      return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
    });
    
    // Get filing types and deadlines
    const filingTypes: string[] = [];
    const deadlines: Date[] = [];
    const reminderIds: number[] = [];
    
    filingReminders.forEach((reminder: any) => {
      filingTypes.push(formatFilingType(reminder.filing_type));
      deadlines.push(new Date(reminder.due_date));
      reminderIds.push(reminder.id);
    });
    
    // Determine how urgent the message should be
    const daysToEarliestDeadline = calculateDaysToDeadline(deadlines[0]);
    const urgencyLevel = determineUrgencyLevel(daysToEarliestDeadline);
    
    // Generate and send email
    const emailResult = await sendReminderEmail({
      company,
      contact: primaryContact,
      filingTypes,
      deadlines,
      urgencyLevel
    });
    
    if (emailResult.success) {
      // Create outreach campaign record
      const [campaign] = await db
        .insert(outreachCampaigns)
        .values({
          companyId: company.id,
          contactId: primaryContact.id,
          campaignType: 'filing_reminder',
          emailSent: true,
          emailSubject: emailResult.subject,
          sentAt: new Date(),
          metadata: {
            filingTypes,
            deadlines: deadlines.map(d => d.toISOString()),
            daysToEarliestDeadline,
            urgencyLevel
          },
          createdAt: new Date()
        })
        .returning();
      
      // Update filing reminders to mark as reminded
      for (const reminderId of reminderIds) {
        await db
          .update(filingReminders)
          .set({
            lastReminderSent: new Date()
          })
          .where(eq(filingReminders.id, reminderId));
      }
      
      agentLogger.info(`Sent reminder email to ${company.name} at ${primaryContact.email}`);
      
      return {
        sent: true,
        campaignId: campaign.id
      };
    } else {
      agentLogger.error(`Failed to send email to ${company.name}:`, emailResult.error);
      return { sent: false };
    }
  } catch (error) {
    agentLogger.error(`Error processing reminders for ${company.name}:`, error);
    throw error;
  }
}

/**
 * Send a reminder email
 */
async function sendReminderEmail(params: {
  company: any;
  contact: any;
  filingTypes: string[];
  deadlines: Date[];
  urgencyLevel: 'advance_notice' | 'reminder' | 'urgent';
}): Promise<{
  success: boolean;
  subject?: string;
  error?: any;
}> {
  try {
    const { company, contact, filingTypes, deadlines, urgencyLevel } = params;
    
    // Generate subject line based on urgency
    let subject = '';
    const joinedFilingTypes = filingTypes.join(" and ");
    
    switch (urgencyLevel) {
      case 'advance_notice':
        subject = `Advance Notice: ${joinedFilingTypes} Filing Due`;
        break;
      case 'reminder':
        subject = `Reminder: ${joinedFilingTypes} Filing Due Soon`;
        break;
      case 'urgent':
        subject = `URGENT: ${joinedFilingTypes} Filing Deadline Approaching`;
        break;
    }
    
    // Format deadlines for display
    const formattedDeadlines = deadlines.map(date => date.toLocaleDateString('en-GB'));
    
    // Generate email content based on urgency and filing types
    const htmlContent = generateEmailContent({
      companyName: company.name,
      filingTypes,
      formattedDeadlines,
      urgencyLevel,
      contactName: contact.name || company.name
    });
    
    // Send the email
    const emailSent = await sendEmail({
      to: contact.email,
      from: "filings@promptsubmissions.com",
      subject,
      html: htmlContent
    });
    
    if (emailSent) {
      return {
        success: true,
        subject
      };
    } else {
      return {
        success: false,
        error: 'Email sending failed'
      };
    }
  } catch (error) {
    return {
      success: false,
      error
    };
  }
}

/**
 * Generate email content based on filing types and urgency
 */
function generateEmailContent(params: {
  companyName: string;
  filingTypes: string[];
  formattedDeadlines: string[];
  urgencyLevel: 'advance_notice' | 'reminder' | 'urgent';
  contactName: string;
}): string {
  const { companyName, filingTypes, formattedDeadlines, urgencyLevel, contactName } = params;
  
  // Create filing list items
  let filingListItems = '';
  for (let i = 0; i < filingTypes.length; i++) {
    filingListItems += `<li>${filingTypes[i]} due on ${formattedDeadlines[i]}</li>`;
  }
  
  // Different messaging based on urgency level
  let urgencyMessage = '';
  let ctaText = '';
  
  switch (urgencyLevel) {
    case 'advance_notice':
      urgencyMessage = `We wanted to let you know that your company has upcoming filing obligations with Companies House.`;
      ctaText = `Plan ahead and make sure your filings are submitted on time.`;
      break;
    case 'reminder':
      urgencyMessage = `This is a friendly reminder that your company has filing obligations due within the next 30 days.`;
      ctaText = `Start preparing your submission now to ensure you meet the deadline.`;
      break;
    case 'urgent':
      urgencyMessage = `Your company has filing obligations that are due very soon. Immediate action is required to avoid penalties.`;
      ctaText = `Submit your filings as soon as possible to avoid late penalties.`;
      break;
  }
  
  // Construct email content
  return `
    <html>
      <body>
        <p>Dear ${contactName || companyName} Team,</p>
        
        <p>${urgencyMessage}</p>
        
        <ul>
          ${filingListItems}
        </ul>
        
        <p><strong>${ctaText}</strong></p>
        
        <p>PromptSubmissions is an AI-powered platform that makes filing your ${filingTypes.join(" and ")} simple and efficient:</p>
        
        <ul>
          <li>Intelligent assistance that guides you through the entire process</li>
          <li>Automated data extraction from your financial documents</li>
          <li>Built-in compliance checks to ensure accuracy</li>
          <li>Direct submission to Companies House</li>
        </ul>
        
        <p><a href="https://promptsubmissions.com/signup?company=${companyName}">Click here to get started</a> - it takes less than 5 minutes to set up your account.</p>
        
        <p>Best regards,<br>
        The PromptSubmissions Team</p>
        
        <p style="font-size: 10px; color: #666;">
          If you no longer wish to receive these notifications, please <a href="https://promptsubmissions.com/unsubscribe?email=${encodeURIComponent(params.contactName)}">unsubscribe here</a>.
        </p>
      </body>
    </html>
  `;
}

/**
 * Calculate days until a deadline
 */
function calculateDaysToDeadline(deadline: Date): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const deadlineDate = new Date(deadline);
  deadlineDate.setHours(0, 0, 0, 0);
  
  const diffTime = deadlineDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
}

/**
 * Determine urgency level based on days to deadline
 */
function determineUrgencyLevel(daysToDeadline: number): 'advance_notice' | 'reminder' | 'urgent' {
  if (daysToDeadline >= TIMEFRAMES.ADVANCE_NOTICE.MIN && daysToDeadline <= TIMEFRAMES.ADVANCE_NOTICE.MAX) {
    return 'advance_notice';
  } else if (daysToDeadline >= TIMEFRAMES.REMINDER.MIN && daysToDeadline < TIMEFRAMES.REMINDER.MAX) {
    return 'reminder';
  } else {
    return 'urgent';
  }
}

/**
 * Format filing type for display
 */
function formatFilingType(filingType: string): string {
  switch (filingType) {
    case 'confirmation_statement':
      return 'Confirmation Statement';
    case 'annual_accounts':
      return 'Annual Accounts';
    case 'corporation_tax':
      return 'Corporation Tax Return';
    default:
      return filingType.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  }
}

/**
 * Add a delay between email sends to respect rate limits
 */
async function rateLimitDelay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
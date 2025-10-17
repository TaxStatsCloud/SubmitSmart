/**
 * Prospect Outreach Service
 * 
 * Automated email outreach to prospects based on lead score and deadlines
 */

import { db } from '../db';
import { prospects } from '@shared/schema';
import { eq, and, gte, lte, sql } from 'drizzle-orm';
import { 
  getInitialOutreachTemplate, 
  getFollowUpTemplate, 
  getDeadlineWarningTemplate,
  type ProspectEmailData 
} from './emailTemplates';
import { logger } from '../utils/logger';

const sgMail = require('@sendgrid/mail');

// Initialize SendGrid
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
} else {
  logger.warn('SendGrid API key not configured - email outreach disabled');
}

const FROM_EMAIL = 'noreply@promptsubmissions.com';
const REPLY_TO_EMAIL = 'support@promptsubmissions.com';

export interface OutreachResult {
  sent: number;
  failed: number;
  skipped: number;
  errors: string[];
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
 * Send initial outreach to high-priority prospects who haven't been contacted
 */
export async function sendInitialOutreach(options: {
  minScore?: number;
  maxProspects?: number;
  dryRun?: boolean;
} = {}): Promise<OutreachResult> {
  const { minScore = 60, maxProspects = 50, dryRun = false } = options;
  
  const result: OutreachResult = {
    sent: 0,
    failed: 0,
    skipped: 0,
    errors: []
  };

  try {
    // Find high-priority prospects who haven't been contacted yet
    const targetProspects = await db.query.prospects.findMany({
      where: and(
        eq(prospects.leadStatus, 'new'),
        gte(prospects.leadScore, minScore)
      ),
      limit: maxProspects
    });

    logger.info(`Found ${targetProspects.length} prospects for initial outreach`);

    for (const prospect of targetProspects) {
      try {
        // Build email data
        const emailData: ProspectEmailData = {
          companyName: prospect.companyName,
          companyNumber: prospect.companyNumber,
          accountsDueDate: prospect.accountsDueDate || undefined,
          confirmationStatementDueDate: prospect.confirmationStatementDueDate || undefined,
          daysUntilAccountsDeadline: prospect.accountsDueDate ? getDaysUntil(prospect.accountsDueDate) : undefined,
          daysUntilCSDeadline: prospect.confirmationStatementDueDate ? getDaysUntil(prospect.confirmationStatementDueDate) : undefined,
          signUpLink: `https://promptsubmissions.replit.app/signup?ref=${prospect.companyNumber}`
        };

        const template = getInitialOutreachTemplate(emailData);

        if (dryRun) {
          logger.info(`[DRY RUN] Would send email to ${prospect.companyName}:`, {
            subject: template.subject,
            companyNumber: prospect.companyNumber
          });
          result.sent++;
          continue;
        }

        // Send email via SendGrid
        await sgMail.send({
          to: `info@${prospect.companyNumber}.com`, // Placeholder - would need actual contact email
          from: FROM_EMAIL,
          replyTo: REPLY_TO_EMAIL,
          subject: template.subject,
          text: template.text,
          html: template.html
        });

        // Update prospect status to 'contacted'
        await db.update(prospects)
          .set({
            leadStatus: 'contacted',
            updatedAt: new Date(),
            metadata: sql`jsonb_set(
              COALESCE(metadata, '{}'::jsonb),
              '{lastContactedAt}',
              to_jsonb(NOW())
            )`
          })
          .where(eq(prospects.id, prospect.id));

        result.sent++;
        logger.info(`Sent initial outreach to ${prospect.companyName}`);

      } catch (error: any) {
        result.failed++;
        result.errors.push(`${prospect.companyName}: ${error.message}`);
        logger.error(`Failed to send email to ${prospect.companyName}:`, error);
      }

      // Rate limiting - 100ms delay between emails
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return result;

  } catch (error: any) {
    logger.error('Error in initial outreach campaign:', error);
    throw error;
  }
}

/**
 * Send follow-up emails to contacted prospects who haven't converted
 */
export async function sendFollowUpEmails(options: {
  daysSinceLastContact?: number;
  maxProspects?: number;
  dryRun?: boolean;
} = {}): Promise<OutreachResult> {
  const { daysSinceLastContact = 7, maxProspects = 30, dryRun = false } = options;
  
  const result: OutreachResult = {
    sent: 0,
    failed: 0,
    skipped: 0,
    errors: []
  };

  try {
    // Find contacted prospects who need follow-up
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysSinceLastContact);

    const targetProspects = await db.query.prospects.findMany({
      where: and(
        eq(prospects.leadStatus, 'contacted'),
        lte(prospects.updatedAt, cutoffDate)
      ),
      limit: maxProspects
    });

    logger.info(`Found ${targetProspects.length} prospects for follow-up`);

    for (const prospect of targetProspects) {
      try {
        const emailData: ProspectEmailData = {
          companyName: prospect.companyName,
          companyNumber: prospect.companyNumber,
          accountsDueDate: prospect.accountsDueDate || undefined,
          confirmationStatementDueDate: prospect.confirmationStatementDueDate || undefined,
          daysUntilAccountsDeadline: prospect.accountsDueDate ? getDaysUntil(prospect.accountsDueDate) : undefined,
          daysUntilCSDeadline: prospect.confirmationStatementDueDate ? getDaysUntil(prospect.confirmationStatementDueDate) : undefined,
          signUpLink: `https://promptsubmissions.replit.app/signup?ref=${prospect.companyNumber}`
        };

        const template = getFollowUpTemplate(emailData);

        if (dryRun) {
          logger.info(`[DRY RUN] Would send follow-up to ${prospect.companyName}`);
          result.sent++;
          continue;
        }

        await sgMail.send({
          to: `info@${prospect.companyNumber}.com`,
          from: FROM_EMAIL,
          replyTo: REPLY_TO_EMAIL,
          subject: template.subject,
          text: template.text,
          html: template.html
        });

        await db.update(prospects)
          .set({
            updatedAt: new Date(),
            metadata: sql`jsonb_set(
              COALESCE(metadata, '{}'::jsonb),
              '{lastFollowUpAt}',
              to_jsonb(NOW())
            )`
          })
          .where(eq(prospects.id, prospect.id));

        result.sent++;
        logger.info(`Sent follow-up to ${prospect.companyName}`);

      } catch (error: any) {
        result.failed++;
        result.errors.push(`${prospect.companyName}: ${error.message}`);
        logger.error(`Failed to send follow-up to ${prospect.companyName}:`, error);
      }

      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return result;

  } catch (error: any) {
    logger.error('Error in follow-up campaign:', error);
    throw error;
  }
}

/**
 * Send urgent deadline warnings to prospects with approaching deadlines
 */
export async function sendDeadlineWarnings(options: {
  daysThreshold?: number;
  maxProspects?: number;
  dryRun?: boolean;
} = {}): Promise<OutreachResult> {
  const { daysThreshold = 14, maxProspects = 50, dryRun = false } = options;
  
  const result: OutreachResult = {
    sent: 0,
    failed: 0,
    skipped: 0,
    errors: []
  };

  try {
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() + daysThreshold);

    // Find prospects with deadlines approaching
    const targetProspects = await db.query.prospects.findMany({
      where: and(
        lte(prospects.accountsDueDate, thresholdDate.toISOString().split('T')[0]),
        gte(prospects.accountsDueDate, new Date().toISOString().split('T')[0])
      ),
      limit: maxProspects
    });

    logger.info(`Found ${targetProspects.length} prospects with deadline warnings`);

    for (const prospect of targetProspects) {
      try {
        const daysUntilDeadline = prospect.accountsDueDate ? getDaysUntil(prospect.accountsDueDate) : 0;

        // Skip if already sent warning recently
        const metadata = prospect.metadata as any;
        if (metadata?.lastWarningAt) {
          const lastWarning = new Date(metadata.lastWarningAt);
          const daysSinceWarning = Math.floor((Date.now() - lastWarning.getTime()) / (1000 * 60 * 60 * 24));
          if (daysSinceWarning < 3) {
            result.skipped++;
            continue;
          }
        }

        const emailData: ProspectEmailData = {
          companyName: prospect.companyName,
          companyNumber: prospect.companyNumber,
          accountsDueDate: prospect.accountsDueDate || undefined,
          confirmationStatementDueDate: prospect.confirmationStatementDueDate || undefined,
          daysUntilAccountsDeadline: daysUntilDeadline,
          daysUntilCSDeadline: prospect.confirmationStatementDueDate ? getDaysUntil(prospect.confirmationStatementDueDate) : undefined,
          signUpLink: `https://promptsubmissions.replit.app/signup?ref=${prospect.companyNumber}&urgent=1`
        };

        const template = getDeadlineWarningTemplate(emailData);

        if (dryRun) {
          logger.info(`[DRY RUN] Would send deadline warning to ${prospect.companyName}`);
          result.sent++;
          continue;
        }

        await sgMail.send({
          to: `info@${prospect.companyNumber}.com`,
          from: FROM_EMAIL,
          replyTo: REPLY_TO_EMAIL,
          subject: template.subject,
          text: template.text,
          html: template.html
        });

        await db.update(prospects)
          .set({
            updatedAt: new Date(),
            metadata: sql`jsonb_set(
              COALESCE(metadata, '{}'::jsonb),
              '{lastWarningAt}',
              to_jsonb(NOW())
            )`
          })
          .where(eq(prospects.id, prospect.id));

        result.sent++;
        logger.info(`Sent deadline warning to ${prospect.companyName}`);

      } catch (error: any) {
        result.failed++;
        result.errors.push(`${prospect.companyName}: ${error.message}`);
        logger.error(`Failed to send warning to ${prospect.companyName}:`, error);
      }

      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return result;

  } catch (error: any) {
    logger.error('Error in deadline warning campaign:', error);
    throw error;
  }
}

/**
 * Run all automated outreach campaigns
 */
export async function runAutomatedOutreach(dryRun: boolean = false): Promise<{
  initial: OutreachResult;
  followUp: OutreachResult;
  warnings: OutreachResult;
}> {
  logger.info(`Running automated outreach campaigns (dryRun: ${dryRun})`);

  const [initial, followUp, warnings] = await Promise.all([
    sendInitialOutreach({ dryRun }),
    sendFollowUpEmails({ dryRun }),
    sendDeadlineWarnings({ dryRun })
  ]);

  return { initial, followUp, warnings };
}

/**
 * Alerting Service
 * 
 * Handles critical system alerts and notifications
 * - System errors and failures
 * - Low credit warnings
 * - Filing deadline reminders
 * - Failed submission alerts
 */

import { emailService } from './emailService';
import { logger } from '../utils/logger';
import { storage } from '../storage';

const alertLogger = logger.withContext('AlertingService');

export interface Alert {
  type: 'critical' | 'warning' | 'info';
  category: 'system' | 'user' | 'filing' | 'credit';
  title: string;
  message: string;
  userId?: number;
  metadata?: Record<string, any>;
}

export class AlertingService {
  private static instance: AlertingService;
  private adminEmails: string[] = ['admin@promptsubmissions.com'];
  
  private constructor() {
    alertLogger.info('Alerting Service initialized');
  }

  static getInstance(): AlertingService {
    if (!AlertingService.instance) {
      AlertingService.instance = new AlertingService();
    }
    return AlertingService.instance;
  }

  /**
   * Send a critical system alert to administrators
   */
  async sendSystemAlert(alert: Alert): Promise<void> {
    try {
      alertLogger.warn('System alert triggered:', alert);

      // Send email to all admins
      for (const email of this.adminEmails) {
        await emailService.sendEmail({
          to: email,
          subject: `[${alert.type.toUpperCase()}] ${alert.title}`,
          html: this.formatAlertEmail(alert),
        });
      }

      alertLogger.info('System alert sent to admins');
    } catch (error) {
      alertLogger.error('Failed to send system alert:', error);
    }
  }

  /**
   * Send low credit warning to user
   */
  async sendLowCreditWarning(userId: number, currentCredits: number): Promise<void> {
    try {
      const user = await storage.getUser(userId);
      if (!user?.email) {
        alertLogger.warn(`Cannot send low credit warning - user ${userId} has no email`);
        return;
      }

      const alert: Alert = {
        type: 'warning',
        category: 'credit',
        title: 'Low Credit Balance',
        message: `Your credit balance is low (${currentCredits} credits remaining). Purchase more credits to continue using filing services.`,
        userId,
        metadata: { currentCredits },
      };

      await emailService.sendEmail({
        to: user.email,
        subject: '⚠️ Low Credit Balance - PromptSubmissions',
        html: this.formatUserAlertEmail(alert, user.firstName || 'there'),
      });

      alertLogger.info('Low credit warning sent', { userId, currentCredits });
    } catch (error) {
      alertLogger.error('Failed to send low credit warning:', error);
    }
  }

  /**
   * Send filing deadline reminder
   */
  async sendFilingDeadlineReminder(userId: number, filingType: string, dueDate: Date): Promise<void> {
    try {
      const user = await storage.getUser(userId);
      if (!user?.email) {
        alertLogger.warn(`Cannot send deadline reminder - user ${userId} has no email`);
        return;
      }

      const daysUntilDue = Math.ceil((dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

      const alert: Alert = {
        type: 'warning',
        category: 'filing',
        title: 'Filing Deadline Approaching',
        message: `Your ${filingType} filing is due in ${daysUntilDue} days (${dueDate.toLocaleDateString()}). Don't miss the deadline!`,
        userId,
        metadata: { filingType, dueDate: dueDate.toISOString(), daysUntilDue },
      };

      await emailService.sendEmail({
        to: user.email,
        subject: `🔔 Filing Deadline Reminder - ${filingType}`,
        html: this.formatUserAlertEmail(alert, user.firstName || 'there'),
      });

      alertLogger.info('Filing deadline reminder sent', { userId, filingType, daysUntilDue });
    } catch (error) {
      alertLogger.error('Failed to send filing deadline reminder:', error);
    }
  }

  /**
   * Send failed filing alert
   */
  async sendFailedFilingAlert(userId: number, filingId: number, filingType: string, error: string): Promise<void> {
    try {
      const user = await storage.getUser(userId);
      if (!user?.email) {
        alertLogger.warn(`Cannot send failed filing alert - user ${userId} has no email`);
        return;
      }

      const alert: Alert = {
        type: 'critical',
        category: 'filing',
        title: 'Filing Submission Failed',
        message: `Your ${filingType} filing (ID: ${filingId}) failed to submit. Error: ${error}`,
        userId,
        metadata: { filingId, filingType, error },
      };

      // Send to user
      await emailService.sendEmail({
        to: user.email,
        subject: `❌ Filing Submission Failed - ${filingType}`,
        html: this.formatUserAlertEmail(alert, user.firstName || 'there'),
      });

      // Also alert admins for critical failures
      await this.sendSystemAlert({
        ...alert,
        message: `User ${userId} experienced filing failure: ${alert.message}`,
      });

      alertLogger.info('Failed filing alert sent', { userId, filingId, filingType });
    } catch (error) {
      alertLogger.error('Failed to send filing failure alert:', error);
    }
  }

  /**
   * Monitor credit usage and send warnings
   */
  async monitorCreditUsage(userId: number, currentCredits: number): Promise<void> {
    const LOW_CREDIT_THRESHOLD = 100;
    const CRITICAL_CREDIT_THRESHOLD = 50;

    if (currentCredits <= CRITICAL_CREDIT_THRESHOLD) {
      await this.sendLowCreditWarning(userId, currentCredits);
    } else if (currentCredits <= LOW_CREDIT_THRESHOLD) {
      // Send less urgent warning
      alertLogger.info('User approaching low credit threshold', { userId, currentCredits });
    }
  }

  /**
   * Check for upcoming filing deadlines and send reminders
   */
  async checkFilingDeadlines(): Promise<void> {
    try {
      // Get all active filings with deadlines in the next 7 days
      const upcomingFilings = await storage.getUpcomingFilings(7);

      for (const filing of upcomingFilings) {
        if (filing.dueDate) {
          await this.sendFilingDeadlineReminder(
            filing.userId,
            filing.type,
            filing.dueDate
          );
        }
      }

      alertLogger.info('Filing deadline check completed', { count: upcomingFilings.length });
    } catch (error) {
      alertLogger.error('Error checking filing deadlines:', error);
    }
  }

  /**
   * Format alert email for admins
   */
  private formatAlertEmail(alert: Alert): string {
    const typeColors: Record<string, string> = {
      critical: '#dc2626',
      warning: '#ea580c',
      info: '#2563eb',
    };

    const color = typeColors[alert.type] || '#64748b';

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: ${color}; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
            .content { background: #f8f9fa; padding: 20px; border-radius: 0 0 8px 8px; }
            .badge { display: inline-block; padding: 4px 12px; border-radius: 4px; font-size: 12px; font-weight: bold; background: ${color}; color: white; }
            .metadata { background: white; padding: 15px; border-radius: 4px; margin-top: 15px; }
            .metadata-item { margin: 5px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">System Alert</h1>
              <span class="badge">${alert.type.toUpperCase()}</span>
            </div>
            <div class="content">
              <h2>${alert.title}</h2>
              <p>${alert.message}</p>
              
              ${alert.metadata ? `
                <div class="metadata">
                  <strong>Alert Details:</strong>
                  ${Object.entries(alert.metadata).map(([key, value]) => `
                    <div class="metadata-item"><strong>${key}:</strong> ${JSON.stringify(value)}</div>
                  `).join('')}
                </div>
              ` : ''}
              
              <p style="margin-top: 20px; color: #64748b; font-size: 12px;">
                This is an automated alert from PromptSubmissions monitoring system.
              </p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Format alert email for users
   */
  private formatUserAlertEmail(alert: Alert, userName: string): string {
    const typeEmojis: Record<string, string> = {
      critical: '🚨',
      warning: '⚠️',
      info: 'ℹ️',
    };

    const emoji = typeEmojis[alert.type] || '📧';

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }
            .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0; font-size: 32px;">${emoji} ${alert.title}</h1>
            </div>
            <div class="content">
              <p>Hi ${userName},</p>
              <p>${alert.message}</p>
              
              ${alert.category === 'credit' ? `
                <a href="https://promptsubmissions.com/credits" class="button">Purchase Credits</a>
              ` : ''}
              
              ${alert.category === 'filing' ? `
                <a href="https://promptsubmissions.com/dashboard" class="button">View Dashboard</a>
              ` : ''}
              
              <p style="margin-top: 30px; color: #64748b; font-size: 14px;">
                If you have any questions, please contact our support team.
              </p>
              
              <p style="color: #64748b; font-size: 12px; margin-top: 20px;">
                PromptSubmissions - AI-Powered UK Corporate Compliance
              </p>
            </div>
          </div>
        </body>
      </html>
    `;
  }
}

export const alertingService = AlertingService.getInstance();

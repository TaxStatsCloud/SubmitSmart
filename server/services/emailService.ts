/**
 * Email Service
 * 
 * This service handles all email sending functionality for the application
 * using SendGrid as the email delivery provider.
 */

import { MailService } from '@sendgrid/mail';
import { logger } from '../utils/logger';

// Create logger instance for this service
const emailLogger = logger.withContext('EmailService');

// Check for API key
if (process.env.NODE_ENV === 'production' && !process.env.SENDGRID_API_KEY) {
  emailLogger.warn('SENDGRID_API_KEY is not set. Email sending will be disabled in production.');
}

// Initialize SendGrid client
const mailService = new MailService();
if (process.env.SENDGRID_API_KEY) {
  mailService.setApiKey(process.env.SENDGRID_API_KEY);
  emailLogger.info('SendGrid API initialized');
}

// Interface for email parameters
export interface EmailParams {
  to: string;
  from: string;
  subject: string;
  text?: string;
  html?: string;
  cc?: string | string[];
  bcc?: string | string[];
  attachments?: any[];
  templateId?: string;
  dynamicTemplateData?: Record<string, any>;
}

/**
 * Send an email using SendGrid
 * 
 * @param params Email parameters
 * @returns Promise resolving to boolean indicating success
 */
export async function sendEmail(params: EmailParams): Promise<boolean> {
  if (!process.env.SENDGRID_API_KEY) {
    if (process.env.NODE_ENV === 'production') {
      emailLogger.error('Cannot send email: SENDGRID_API_KEY is not set');
      return false;
    } else {
      // In development, just log the email instead of sending it
      emailLogger.info('Development mode: Email would be sent', {
        to: params.to,
        from: params.from,
        subject: params.subject
      });
      return true;
    }
  }
  
  try {
    // Prepare email data
    const msg = {
      to: params.to,
      from: params.from,
      subject: params.subject,
      text: params.text,
      html: params.html,
      cc: params.cc,
      bcc: params.bcc,
      attachments: params.attachments,
      templateId: params.templateId,
      dynamicTemplateData: params.dynamicTemplateData
    };
    
    // Ensure we have either text, html, or templateId
    if (!msg.text && !msg.html && !msg.templateId) {
      throw new Error('Email must contain text, html, or templateId');
    }
    
    // Send email through SendGrid
    await mailService.send(msg);
    
    emailLogger.info('Email sent successfully', {
      to: params.to,
      subject: params.subject
    });
    
    return true;
  } catch (error) {
    emailLogger.error('Failed to send email:', error);
    return false;
  }
}

/**
 * Check if the SendGrid API key is configured
 * 
 * @returns Boolean indicating if the API key is set
 */
export function isEmailServiceConfigured(): boolean {
  return !!process.env.SENDGRID_API_KEY;
}

/**
 * Get the domain used for sending emails
 * 
 * @returns Domain name used for sending emails
 */
export function getEmailDomain(): string {
  return process.env.EMAIL_DOMAIN || 'promptsubmissions.com';
}

/**
 * Create a formatted sender email address
 * 
 * @param type Type of sender (e.g., 'support', 'noreply', 'filings')
 * @returns Formatted email address
 */
export function getSenderAddress(type: string = 'noreply'): string {
  const domain = getEmailDomain();
  return `${type}@${domain}`;
}
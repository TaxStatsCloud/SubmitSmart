import { MailService } from '@sendgrid/mail';

class EmailService {
  private mailService: MailService;

  constructor() {
    this.mailService = new MailService();
    
    if (!process.env.SENDGRID_API_KEY) {
      throw new Error("SENDGRID_API_KEY environment variable must be set");
    }
    
    this.mailService.setApiKey(process.env.SENDGRID_API_KEY);
    console.log('📧 EmailService: SendGrid API initialized');
  }

  async sendWelcomeEmail(to: string, userName: string): Promise<boolean> {
    try {
      await this.mailService.send({
        to,
        from: 'support@promptsubmissions.com',
        subject: 'Welcome to PromptSubmissions - Your AI-Powered Compliance Platform',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 20px; text-align: center;">
              <h1 style="margin: 0; font-size: 28px;">Welcome to PromptSubmissions</h1>
              <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">AI-Powered UK Corporate Compliance Platform</p>
            </div>
            
            <div style="padding: 40px 20px;">
              <h2 style="color: #333; margin-bottom: 20px;">Hello ${userName},</h2>
              
              <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
                Thank you for joining PromptSubmissions! You now have access to the UK's most advanced 
                AI-powered compliance platform for corporate filings, tax preparation, and regulatory submissions.
              </p>
              
              <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #333; margin-top: 0;">What you can do now:</h3>
                <ul style="color: #666; line-height: 1.8;">
                  <li>✅ Upload and process financial documents with AI</li>
                  <li>✅ Generate Extended Trial Balance automatically</li>
                  <li>✅ Create professional financial statements</li>
                  <li>✅ Prepare Corporation Tax returns</li>
                  <li>✅ File with Companies House and HMRC</li>
                </ul>
              </div>
              
              <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
                <h4 style="color: #856404; margin-top: 0;">🚨 Important: April 2027 Deadline</h4>
                <p style="color: #856404; margin-bottom: 0;">
                  Companies House has mandated that all UK companies must use software for account filing from April 2027. 
                  PromptSubmissions is perfectly positioned to handle this transition with our AI-powered platform.
                </p>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="https://promptsubmissions.com/dashboard" 
                   style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                  Start Your First Filing
                </a>
              </div>
              
              <p style="color: #666; line-height: 1.6;">
                Need help getting started? Our AI assistant is available 24/7 to guide you through the process.
              </p>
            </div>
            
            <div style="background: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e9ecef;">
              <p style="color: #666; margin: 0; font-size: 14px;">
                PromptSubmissions - Professional AI-Powered UK Corporate Compliance
              </p>
            </div>
          </div>
        `,
      });
      return true;
    } catch (error) {
      console.error('SendGrid email error:', error);
      return false;
    }
  }

  async sendFilingConfirmation(to: string, filingType: string, companyName: string): Promise<boolean> {
    try {
      await this.mailService.send({
        to,
        from: 'support@promptsubmissions.com',
        subject: `${filingType} Filing Completed - ${companyName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #28a745; color: white; padding: 30px 20px; text-align: center;">
              <h1 style="margin: 0; font-size: 24px;">Filing Completed Successfully</h1>
            </div>
            
            <div style="padding: 30px 20px;">
              <h2 style="color: #333;">Your ${filingType} has been submitted</h2>
              
              <div style="background: #d4edda; border: 1px solid #c3e6cb; border-radius: 5px; padding: 15px; margin: 20px 0;">
                <strong>Company:</strong> ${companyName}<br>
                <strong>Filing Type:</strong> ${filingType}<br>
                <strong>Status:</strong> Successfully Submitted<br>
                <strong>Date:</strong> ${new Date().toLocaleDateString('en-GB')}
              </div>
              
              <p style="color: #666; line-height: 1.6;">
                Your filing has been processed and submitted to the relevant authorities. 
                You can download your filing documents from your dashboard.
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="https://promptsubmissions.com/dashboard" 
                   style="background: #28a745; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px;">
                  View Dashboard
                </a>
              </div>
            </div>
          </div>
        `,
      });
      return true;
    } catch (error) {
      console.error('SendGrid email error:', error);
      return false;
    }
  }

  async sendPaymentConfirmation(to: string, amount: number, credits: number): Promise<boolean> {
    try {
      await this.mailService.send({
        to,
        from: 'support@promptsubmissions.com',
        subject: `Payment Confirmation - ${credits} Credits Added`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #17a2b8; color: white; padding: 30px 20px; text-align: center;">
              <h1 style="margin: 0; font-size: 24px;">Payment Successful</h1>
            </div>
            
            <div style="padding: 30px 20px;">
              <h2 style="color: #333;">Thank you for your payment</h2>
              
              <div style="background: #d1ecf1; border: 1px solid #bee5eb; border-radius: 5px; padding: 15px; margin: 20px 0;">
                <strong>Amount Paid:</strong> £${amount.toFixed(2)}<br>
                <strong>Credits Added:</strong> ${credits}<br>
                <strong>Date:</strong> ${new Date().toLocaleDateString('en-GB')}<br>
                <strong>Status:</strong> Payment Confirmed
              </div>
              
              <p style="color: #666; line-height: 1.6;">
                Your credits have been added to your account and are ready to use for filings. 
                Each filing type uses different amounts of credits based on complexity.
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="https://promptsubmissions.com/dashboard" 
                   style="background: #17a2b8; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px;">
                  Start Filing
                </a>
              </div>
            </div>
          </div>
        `,
      });
      return true;
    } catch (error) {
      console.error('SendGrid email error:', error);
      return false;
    }
  }

  /**
   * Send a generic email (for notifications and alerts)
   */
  async sendEmail(params: {
    to: string;
    subject: string;
    text?: string;
    html?: string;
  }): Promise<boolean> {
    try {
      await this.mailService.send({
        to: params.to,
        from: 'support@promptsubmissions.com',
        subject: params.subject,
        text: params.text,
        html: params.html || params.text,
      });
      return true;
    } catch (error) {
      console.error('SendGrid email error:', error);
      return false;
    }
  }
}

export const emailService = new EmailService();
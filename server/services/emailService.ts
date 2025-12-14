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

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(params: {
    to: string;
    userName: string;
    resetToken: string;
    resetUrl: string;
  }): Promise<boolean> {
    try {
      await this.mailService.send({
        to: params.to,
        from: 'support@promptsubmissions.com',
        subject: 'Reset Your Password - PromptSubmissions',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px 20px; text-align: center;">
              <h1 style="margin: 0; font-size: 24px;">Password Reset Request</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">PromptSubmissions</p>
            </div>

            <div style="padding: 30px 20px;">
              <h2 style="color: #333; margin-bottom: 20px;">Hello ${params.userName},</h2>

              <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
                We received a request to reset the password for your PromptSubmissions account.
                If you didn't make this request, you can safely ignore this email.
              </p>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${params.resetUrl}"
                   style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                  Reset Your Password
                </a>
              </div>

              <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
                <p style="color: #856404; margin: 0; font-size: 14px;">
                  <strong>Important:</strong> This link will expire in 1 hour for security reasons.
                  If you need a new link, please request another password reset.
                </p>
              </div>

              <p style="color: #666; line-height: 1.6; font-size: 14px;">
                If the button above doesn't work, copy and paste this link into your browser:
                <br>
                <a href="${params.resetUrl}" style="color: #667eea; word-break: break-all;">${params.resetUrl}</a>
              </p>
            </div>

            <div style="background: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e9ecef;">
              <p style="color: #666; margin: 0; font-size: 14px;">
                PromptSubmissions - AI-Powered UK Corporate Compliance
              </p>
              <p style="color: #999; margin: 10px 0 0 0; font-size: 12px;">
                If you didn't request this reset, please contact support@promptsubmissions.com
              </p>
            </div>
          </div>
        `,
      });
      console.log(`✅ Password reset email sent to ${params.to}`);
      return true;
    } catch (error) {
      console.error('❌ Error sending password reset email:', error);
      return false;
    }
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
  async sendContactFormEmail(
    formData: {
      name: string;
      email: string;
      phone?: string;
      subject: string;
      message: string;
    }
  ): Promise<boolean> {
    try {
      // Send notification to support team
      await this.mailService.send({
        to: 'support@promptsubmissions.com',
        from: 'support@promptsubmissions.com',
        replyTo: formData.email,
        subject: `Contact Form: ${formData.subject}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #667eea; color: white; padding: 20px; text-align: center;">
              <h2 style="margin: 0;">New Contact Form Submission</h2>
            </div>
            
            <div style="padding: 30px; background: #f8f9fa;">
              <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                <h3 style="color: #333; margin-top: 0; border-bottom: 2px solid #667eea; padding-bottom: 10px;">Contact Details</h3>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #666; font-weight: bold; width: 120px;">Name:</td>
                    <td style="padding: 8px 0; color: #333;">${formData.name}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #666; font-weight: bold;">Email:</td>
                    <td style="padding: 8px 0; color: #333;">
                      <a href="mailto:${formData.email}" style="color: #667eea;">${formData.email}</a>
                    </td>
                  </tr>
                  ${formData.phone ? `
                  <tr>
                    <td style="padding: 8px 0; color: #666; font-weight: bold;">Phone:</td>
                    <td style="padding: 8px 0; color: #333;">${formData.phone}</td>
                  </tr>
                  ` : ''}
                  <tr>
                    <td style="padding: 8px 0; color: #666; font-weight: bold;">Subject:</td>
                    <td style="padding: 8px 0; color: #333;">${formData.subject}</td>
                  </tr>
                </table>
              </div>
              
              <div style="background: white; padding: 20px; border-radius: 8px;">
                <h3 style="color: #333; margin-top: 0; border-bottom: 2px solid #667eea; padding-bottom: 10px;">Message</h3>
                <p style="color: #333; line-height: 1.6; white-space: pre-wrap;">${formData.message}</p>
              </div>
              
              <div style="margin-top: 20px; padding: 15px; background: #fff3cd; border-left: 4px solid #ffc107; border-radius: 4px;">
                <p style="margin: 0; color: #856404; font-size: 14px;">
                  <strong>Quick Reply:</strong> Click reply in your email client to respond directly to ${formData.email}
                </p>
              </div>
            </div>
            
            <div style="background: #333; color: white; padding: 15px; text-align: center; font-size: 12px;">
              <p style="margin: 0;">Sent via PromptSubmissions Contact Form</p>
              <p style="margin: 5px 0 0 0; opacity: 0.7;">${new Date().toLocaleString('en-GB', { timeZone: 'Europe/London' })}</p>
            </div>
          </div>
        `,
      });

      // Send confirmation to user
      await this.mailService.send({
        to: formData.email,
        from: 'support@promptsubmissions.com',
        subject: 'We received your message - PromptSubmissions',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 20px; text-align: center;">
              <h1 style="margin: 0; font-size: 28px;">Thank You for Contacting Us</h1>
              <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">We'll get back to you within 24 hours</p>
            </div>
            
            <div style="padding: 40px 20px;">
              <h2 style="color: #333; margin-bottom: 20px;">Hello ${formData.name},</h2>
              
              <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
                Thank you for reaching out to PromptSubmissions. We've received your message and our support team 
                will review it shortly. We typically respond within 24 hours during business hours.
              </p>
              
              <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #333; margin-top: 0;">Your Message Summary</h3>
                <p style="color: #666; margin: 5px 0;"><strong>Subject:</strong> ${formData.subject}</p>
                <p style="color: #666; margin: 5px 0;"><strong>Submitted:</strong> ${new Date().toLocaleString('en-GB', { timeZone: 'Europe/London' })}</p>
              </div>
              
              <div style="background: #e7f3ff; border-left: 4px solid #2196F3; padding: 15px; margin: 20px 0;">
                <h4 style="color: #1976D2; margin-top: 0;">Need Urgent Help?</h4>
                <p style="color: #1976D2; margin-bottom: 10px; font-size: 14px;">
                  For urgent matters, you can also reach us at:
                </p>
                <p style="color: #1976D2; margin: 5px 0; font-size: 14px;">
                  📞 Phone: <strong>0161 817 3556</strong> (Mon-Fri, 9 AM - 5 PM GMT)
                </p>
              </div>
              
              <p style="color: #666; line-height: 1.6;">
                In the meantime, feel free to explore our <a href="https://promptsubmissions.com/faq" style="color: #667eea;">FAQ page</a> 
                or check out our <a href="https://promptsubmissions.com/resources" style="color: #667eea;">resources</a> 
                for helpful guides and documentation.
              </p>
            </div>
            
            <div style="background: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e9ecef;">
              <p style="color: #666; margin: 0; font-size: 14px;">
                PromptSubmissions - Professional AI-Powered UK Corporate Compliance
              </p>
              <p style="color: #999; margin: 10px 0 0 0; font-size: 12px;">
                56 Oldham Road, Ashton Under Lyne, OL6 7AP, United Kingdom
              </p>
            </div>
          </div>
        `,
      });

      console.log(`✅ Contact form email sent from ${formData.email} about "${formData.subject}"`);
      return true;
    } catch (error) {
      console.error('❌ Error sending contact form email:', error);
      return false;
    }
  }

  /**
   * Send CT600 submission confirmation email
   */
  async sendCT600SubmissionConfirmation(params: {
    to: string;
    userName: string;
    companyName: string;
    companyNumber: string;
    accountingPeriodStart: string;
    accountingPeriodEnd: string;
    taxDue: number;
    correlationId: string;
  }): Promise<boolean> {
    try {
      await this.mailService.send({
        to: params.to,
        from: 'support@promptsubmissions.com',
        subject: `CT600 Submitted - ${params.companyName} (${params.companyNumber})`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px 20px; text-align: center;">
              <h1 style="margin: 0; font-size: 24px;">CT600 Corporation Tax Return Submitted</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">Your submission is being processed by HMRC</p>
            </div>

            <div style="padding: 30px 20px;">
              <h2 style="color: #333; margin-bottom: 20px;">Hello ${params.userName},</h2>

              <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
                Your CT600 Corporation Tax return has been successfully submitted to HMRC.
                Here are the details of your submission:
              </p>

              <div style="background: #e8f5e9; border: 1px solid #c8e6c9; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <h3 style="color: #2e7d32; margin-top: 0; margin-bottom: 15px;">📋 Submission Details</h3>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #666; font-weight: bold; width: 180px;">Company:</td>
                    <td style="padding: 8px 0; color: #333;">${params.companyName}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #666; font-weight: bold;">Company Number:</td>
                    <td style="padding: 8px 0; color: #333;">${params.companyNumber}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #666; font-weight: bold;">Accounting Period:</td>
                    <td style="padding: 8px 0; color: #333;">${params.accountingPeriodStart} to ${params.accountingPeriodEnd}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #666; font-weight: bold;">Corporation Tax Due:</td>
                    <td style="padding: 8px 0; color: #333; font-weight: bold;">£${params.taxDue.toLocaleString('en-GB', { minimumFractionDigits: 2 })}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #666; font-weight: bold;">HMRC Reference:</td>
                    <td style="padding: 8px 0; color: #333; font-family: monospace;">${params.correlationId}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #666; font-weight: bold;">Submission Date:</td>
                    <td style="padding: 8px 0; color: #333;">${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                  </tr>
                </table>
              </div>

              <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
                <h4 style="color: #856404; margin-top: 0;">⏳ What Happens Next?</h4>
                <p style="color: #856404; margin-bottom: 0; font-size: 14px;">
                  HMRC will process your submission within 72 hours. You'll receive an email notification
                  when your return is accepted or if any issues need to be addressed. You can also check
                  the status in your Filing Dashboard at any time.
                </p>
              </div>

              <div style="text-align: center; margin: 30px 0;">
                <a href="https://promptsubmissions.com/filings/status"
                   style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                  View Filing Status
                </a>
              </div>

              <p style="color: #666; line-height: 1.6; font-size: 14px;">
                <strong>Important:</strong> Please keep this email for your records. The HMRC Reference number
                can be used to track your submission or for any correspondence with HMRC.
              </p>
            </div>

            <div style="background: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e9ecef;">
              <p style="color: #666; margin: 0; font-size: 14px;">
                PromptSubmissions - AI-Powered UK Corporate Tax Compliance
              </p>
            </div>
          </div>
        `,
      });
      console.log(`✅ CT600 submission confirmation sent to ${params.to} for ${params.companyNumber}`);
      return true;
    } catch (error) {
      console.error('❌ Error sending CT600 submission confirmation:', error);
      return false;
    }
  }

  /**
   * Send CT600 status update email (accepted/rejected)
   */
  async sendCT600StatusUpdate(params: {
    to: string;
    userName: string;
    companyName: string;
    companyNumber: string;
    status: 'accepted' | 'rejected' | 'pending' | 'processing';
    correlationId: string;
    hmrcReference?: string;
    errors?: string[];
    accountingPeriodEnd: string;
    taxDue: number;
  }): Promise<boolean> {
    try {
      const isAccepted = params.status === 'accepted';
      const isRejected = params.status === 'rejected';

      const statusColors = {
        accepted: { bg: '#e8f5e9', border: '#4caf50', text: '#2e7d32', icon: '✅' },
        rejected: { bg: '#ffebee', border: '#f44336', text: '#c62828', icon: '❌' },
        pending: { bg: '#fff3e0', border: '#ff9800', text: '#e65100', icon: '⏳' },
        processing: { bg: '#e3f2fd', border: '#2196f3', text: '#1565c0', icon: '🔄' }
      };

      const colors = statusColors[params.status] || statusColors.pending;
      const statusLabel = params.status.charAt(0).toUpperCase() + params.status.slice(1);

      await this.mailService.send({
        to: params.to,
        from: 'support@promptsubmissions.com',
        subject: `CT600 ${statusLabel} - ${params.companyName} (${params.companyNumber})`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: ${isAccepted ? '#4caf50' : isRejected ? '#f44336' : '#ff9800'}; color: white; padding: 30px 20px; text-align: center;">
              <h1 style="margin: 0; font-size: 24px;">${colors.icon} CT600 ${statusLabel}</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">${params.companyName}</p>
            </div>

            <div style="padding: 30px 20px;">
              <h2 style="color: #333; margin-bottom: 20px;">Hello ${params.userName},</h2>

              ${isAccepted ? `
                <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
                  Great news! HMRC has <strong style="color: #2e7d32;">accepted</strong> your CT600 Corporation Tax return.
                  Your filing is now complete.
                </p>

                <div style="background: ${colors.bg}; border: 1px solid ${colors.border}; border-radius: 8px; padding: 20px; margin: 20px 0;">
                  <h3 style="color: ${colors.text}; margin-top: 0;">✅ Filing Accepted</h3>
                  <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                      <td style="padding: 8px 0; color: #666; font-weight: bold; width: 180px;">Company:</td>
                      <td style="padding: 8px 0; color: #333;">${params.companyName} (${params.companyNumber})</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; color: #666; font-weight: bold;">Period Ending:</td>
                      <td style="padding: 8px 0; color: #333;">${params.accountingPeriodEnd}</td>
                    </tr>
                    ${params.hmrcReference ? `
                    <tr>
                      <td style="padding: 8px 0; color: #666; font-weight: bold;">HMRC Reference:</td>
                      <td style="padding: 8px 0; color: #333; font-family: monospace;">${params.hmrcReference}</td>
                    </tr>
                    ` : ''}
                    <tr>
                      <td style="padding: 8px 0; color: #666; font-weight: bold;">Corporation Tax Due:</td>
                      <td style="padding: 8px 0; color: #333; font-weight: bold;">£${params.taxDue.toLocaleString('en-GB', { minimumFractionDigits: 2 })}</td>
                    </tr>
                  </table>
                </div>

                <div style="background: #e3f2fd; border-left: 4px solid #2196f3; padding: 15px; margin: 20px 0;">
                  <h4 style="color: #1565c0; margin-top: 0;">💳 Payment Reminder</h4>
                  <p style="color: #1565c0; margin-bottom: 0; font-size: 14px;">
                    Remember to pay any Corporation Tax due by the payment deadline (typically 9 months and 1 day
                    after your accounting period end date). You can pay via HMRC's online payment service.
                  </p>
                </div>
              ` : isRejected ? `
                <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
                  Unfortunately, HMRC has <strong style="color: #c62828;">rejected</strong> your CT600 Corporation Tax return.
                  Please review the errors below and resubmit.
                </p>

                <div style="background: ${colors.bg}; border: 1px solid ${colors.border}; border-radius: 8px; padding: 20px; margin: 20px 0;">
                  <h3 style="color: ${colors.text}; margin-top: 0;">❌ Filing Rejected</h3>
                  <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                      <td style="padding: 8px 0; color: #666; font-weight: bold; width: 180px;">Company:</td>
                      <td style="padding: 8px 0; color: #333;">${params.companyName} (${params.companyNumber})</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; color: #666; font-weight: bold;">Reference:</td>
                      <td style="padding: 8px 0; color: #333; font-family: monospace;">${params.correlationId}</td>
                    </tr>
                  </table>
                </div>

                ${params.errors && params.errors.length > 0 ? `
                <div style="background: #fff8e1; border: 1px solid #ffcc80; border-radius: 8px; padding: 20px; margin: 20px 0;">
                  <h4 style="color: #e65100; margin-top: 0;">⚠️ Errors to Address:</h4>
                  <ul style="color: #666; margin: 0; padding-left: 20px;">
                    ${params.errors.map(err => `<li style="margin: 8px 0;">${err}</li>`).join('')}
                  </ul>
                </div>
                ` : ''}

                <div style="text-align: center; margin: 30px 0;">
                  <a href="https://promptsubmissions.com/ct600-filing"
                     style="background: #f44336; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                    Review and Resubmit
                  </a>
                </div>
              ` : `
                <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
                  Your CT600 Corporation Tax return is currently <strong style="color: ${colors.text};">${params.status}</strong>.
                  We'll notify you when HMRC provides a final response.
                </p>

                <div style="background: ${colors.bg}; border: 1px solid ${colors.border}; border-radius: 8px; padding: 20px; margin: 20px 0;">
                  <h3 style="color: ${colors.text}; margin-top: 0;">${colors.icon} Status: ${statusLabel}</h3>
                  <p style="color: #666; margin: 0;">
                    Company: ${params.companyName} (${params.companyNumber})<br>
                    Reference: ${params.correlationId}
                  </p>
                </div>
              `}

              <div style="text-align: center; margin: 30px 0;">
                <a href="https://promptsubmissions.com/filings/status"
                   style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                  View Filing Dashboard
                </a>
              </div>
            </div>

            <div style="background: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e9ecef;">
              <p style="color: #666; margin: 0; font-size: 14px;">
                PromptSubmissions - AI-Powered UK Corporate Tax Compliance
              </p>
              <p style="color: #999; margin: 10px 0 0 0; font-size: 12px;">
                Questions? Contact us at support@promptsubmissions.com
              </p>
            </div>
          </div>
        `,
      });
      console.log(`✅ CT600 status update (${params.status}) sent to ${params.to} for ${params.companyNumber}`);
      return true;
    } catch (error) {
      console.error('❌ Error sending CT600 status update:', error);
      return false;
    }
  }
}

export const emailService = new EmailService();
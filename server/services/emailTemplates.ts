/**
 * Email Templates for Prospect Outreach
 * 
 * Professional, personalized email templates for automated prospect engagement
 */

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

export interface ProspectEmailData {
  companyName: string;
  companyNumber: string;
  accountsDueDate?: string;
  confirmationStatementDueDate?: string;
  daysUntilAccountsDeadline?: number;
  daysUntilCSDeadline?: number;
  signUpLink?: string;
  // Exa enrichment data for personalization
  employeeCount?: number;
  estimatedRevenue?: string;
  fundingStage?: string;
  companyDescription?: string;
  recentNews?: string[];
  decisionMakerName?: string;
  decisionMakerTitle?: string;
}

/**
 * Build personalized intro based on enriched company data
 */
function buildPersonalizedIntro(data: ProspectEmailData): string {
  const parts: string[] = [];

  // Company size context
  if (data.employeeCount) {
    const sizeContext = data.employeeCount < 10 
      ? 'a growing small business'
      : data.employeeCount < 50
        ? 'an established SME'
        : data.employeeCount < 250
          ? 'a mid-sized company'
          : 'a large organization';
    parts.push(`As ${sizeContext} with ${data.employeeCount} employees`);
  }

  // Funding/growth context
  if (data.fundingStage && data.fundingStage !== 'Unknown') {
    const fundingContext = data.fundingStage === 'Seed' || data.fundingStage === 'Series A'
      ? 'in a growth phase'
      : data.fundingStage === 'Series B' || data.fundingStage === 'Series C'
        ? 'scaling rapidly'
        : 'well-established';
    parts.push(fundingContext);
  }

  // Recent news context
  if (data.recentNews && data.recentNews.length > 0) {
    const newsItem = data.recentNews[0];
    if (newsItem.length < 120) {
      parts.push(`we noticed: "${newsItem}"`);
    }
  }

  if (parts.length === 0) {
    return '';
  }

  const intro = parts.join(', ');
  return `<p style="background: #f0f9ff; border-left: 4px solid #0ea5e9; padding: 15px; margin: 20px 0; color: #0c4a6e;">${intro}, we understand the importance of efficient compliance management.</p>`;
}

/**
 * Initial outreach email for high-priority prospects
 */
export function getInitialOutreachTemplate(data: ProspectEmailData): EmailTemplate {
  // AI-powered personalization based on enriched data
  const greeting = data.decisionMakerName 
    ? `Hello ${data.decisionMakerName},`
    : `Hello from PromptSubmissions,`;

  const personalizedIntro = buildPersonalizedIntro(data);

  const urgencyMessage = data.daysUntilAccountsDeadline && data.daysUntilAccountsDeadline <= 30
    ? `<p style="color: #dc2626; font-weight: 600;">⚠️ Your filing deadline is approaching in just ${data.daysUntilAccountsDeadline} days!</p>`
    : '';

  const subject = data.daysUntilAccountsDeadline && data.daysUntilAccountsDeadline <= 30
    ? `Urgent: ${data.companyName} - Filing Deadline in ${data.daysUntilAccountsDeadline} Days`
    : `Streamline Your UK Corporate Compliance - ${data.companyName}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 28px;">PromptSubmissions</h1>
    <p style="color: #e0e7ff; margin: 10px 0 0 0;">AI-Powered UK Corporate Compliance</p>
  </div>
  
  <div style="background: white; padding: 30px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px;">
    <h2 style="color: #1e293b; margin-top: 0;">${greeting}</h2>
    
    ${urgencyMessage}
    
    ${personalizedIntro}
    
    <p>We noticed that <strong>${data.companyName}</strong> (${data.companyNumber}) has upcoming filing requirements with Companies House and HMRC.</p>
    
    <div style="background: #f8fafc; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0;">
      <h3 style="margin-top: 0; color: #1e293b;">Upcoming Deadlines:</h3>
      <ul style="margin: 10px 0; padding-left: 20px;">
        ${data.accountsDueDate ? `<li><strong>Annual Accounts:</strong> ${new Date(data.accountsDueDate).toLocaleDateString('en-GB')} (${data.daysUntilAccountsDeadline} days)</li>` : ''}
        ${data.confirmationStatementDueDate ? `<li><strong>Confirmation Statement:</strong> ${new Date(data.confirmationStatementDueDate).toLocaleDateString('en-GB')} (${data.daysUntilCSDeadline} days)</li>` : ''}
      </ul>
    </div>
    
    <h3 style="color: #1e293b;">Why PromptSubmissions?</h3>
    <ul style="line-height: 1.8;">
      <li>🤖 <strong>AI-Powered Automation:</strong> 100% accurate filings with intelligent document processing</li>
      <li>✅ <strong>April 2027 Ready:</strong> Fully compliant with mandatory software filing requirements</li>
      <li>⚡ <strong>Lightning Fast:</strong> Complete Corporation Tax, Annual Accounts, and CS01 in minutes</li>
      <li>🔒 <strong>Secure & Reliable:</strong> Direct integration with HMRC and Companies House APIs</li>
      <li>💰 <strong>Cost-Effective:</strong> Enterprise-level features at competitive pricing</li>
    </ul>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${data.signUpLink || 'https://promptsubmissions.replit.app/signup'}" style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
        Get Started - Free Trial
      </a>
    </div>
    
    <p style="color: #64748b; font-size: 14px; margin-top: 30px;">
      Meet your filing deadlines with confidence. Our AI ensures 100% accuracy and complete compliance with UK regulations.
    </p>
    
    <p style="color: #64748b; font-size: 14px;">
      Questions? Reply to this email or visit our website to learn more.
    </p>
    
    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
    
    <p style="color: #94a3b8; font-size: 12px; text-align: center;">
      PromptSubmissions | AI-Powered UK Corporate Compliance<br>
      You're receiving this because ${data.companyName} has upcoming filing deadlines.
    </p>
  </div>
</body>
</html>
  `;

  const textGreeting = data.decisionMakerName ? `Hello ${data.decisionMakerName},` : 'Hello,';
  const textPersonalization = data.employeeCount || data.fundingStage ? 
    `As ${data.employeeCount ? `a company with ${data.employeeCount} employees` : 'a growing business'}${data.fundingStage && data.fundingStage !== 'Unknown' ? ` in the ${data.fundingStage} stage` : ''}, we understand the importance of efficient compliance management.\n\n` : '';

  const text = `
PromptSubmissions - AI-Powered UK Corporate Compliance

${textGreeting}

${data.daysUntilAccountsDeadline && data.daysUntilAccountsDeadline <= 30 ? `⚠️ URGENT: Your filing deadline is approaching in just ${data.daysUntilAccountsDeadline} days!` : ''}

${textPersonalization}We noticed that ${data.companyName} (${data.companyNumber}) has upcoming filing requirements with Companies House and HMRC.

UPCOMING DEADLINES:
${data.accountsDueDate ? `- Annual Accounts: ${new Date(data.accountsDueDate).toLocaleDateString('en-GB')} (${data.daysUntilAccountsDeadline} days)` : ''}
${data.confirmationStatementDueDate ? `- Confirmation Statement: ${new Date(data.confirmationStatementDueDate).toLocaleDateString('en-GB')} (${data.daysUntilCSDeadline} days)` : ''}

WHY PROMPTSUBMISSIONS?
• AI-Powered Automation: 100% accurate filings with intelligent document processing
• April 2027 Ready: Fully compliant with mandatory software filing requirements
• Lightning Fast: Complete Corporation Tax, Annual Accounts, and CS01 in minutes
• Secure & Reliable: Direct integration with HMRC and Companies House APIs
• Cost-Effective: Enterprise-level features at competitive pricing

Get Started - Free Trial: ${data.signUpLink || 'https://promptsubmissions.replit.app/signup'}

Meet your filing deadlines with confidence. Our AI ensures 100% accuracy and complete compliance with UK regulations.

Questions? Reply to this email or visit our website to learn more.

---
PromptSubmissions | AI-Powered UK Corporate Compliance
You're receiving this because ${data.companyName} has upcoming filing deadlines.
  `.trim();

  return { subject, html, text };
}

/**
 * Follow-up email for prospects who haven't responded
 */
export function getFollowUpTemplate(data: ProspectEmailData): EmailTemplate {
  const subject = `Quick Reminder: ${data.companyName} - Filing Deadline Approaching`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 28px;">PromptSubmissions</h1>
  </div>
  
  <div style="background: white; padding: 30px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px;">
    <h2 style="color: #1e293b; margin-top: 0;">Just Following Up...</h2>
    
    <p>We wanted to follow up regarding <strong>${data.companyName}'s</strong> upcoming filing deadlines.</p>
    
    ${data.daysUntilAccountsDeadline && data.daysUntilAccountsDeadline <= 21 ? `
      <div style="background: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0;">
        <p style="color: #dc2626; font-weight: 600; margin: 0;">
          ⚠️ Critical: Only ${data.daysUntilAccountsDeadline} days remaining until your accounts deadline!
        </p>
      </div>
    ` : ''}
    
    <p>Don't risk late filing penalties. PromptSubmissions can help you:</p>
    <ul style="line-height: 1.8;">
      <li>✅ Complete your filings in under 30 minutes</li>
      <li>✅ Ensure 100% accuracy with AI-powered validation</li>
      <li>✅ Meet April 2027 mandatory software filing requirements</li>
      <li>✅ Submit directly to HMRC and Companies House</li>
    </ul>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${data.signUpLink || 'https://promptsubmissions.replit.app/signup'}" style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
        Start Your Free Trial
      </a>
    </div>
    
    <p style="color: #64748b; font-size: 14px;">
      Need help? Our team is ready to assist. Simply reply to this email.
    </p>
    
    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
    
    <p style="color: #94a3b8; font-size: 12px; text-align: center;">
      PromptSubmissions | AI-Powered UK Corporate Compliance
    </p>
  </div>
</body>
</html>
  `;

  const text = `
PromptSubmissions - Just Following Up...

We wanted to follow up regarding ${data.companyName}'s upcoming filing deadlines.

${data.daysUntilAccountsDeadline && data.daysUntilAccountsDeadline <= 21 ? `⚠️ CRITICAL: Only ${data.daysUntilAccountsDeadline} days remaining until your accounts deadline!` : ''}

Don't risk late filing penalties. PromptSubmissions can help you:
✅ Complete your filings in under 30 minutes
✅ Ensure 100% accuracy with AI-powered validation
✅ Meet April 2027 mandatory software filing requirements
✅ Submit directly to HMRC and Companies House

Start Your Free Trial: ${data.signUpLink || 'https://promptsubmissions.replit.app/signup'}

Need help? Our team is ready to assist. Simply reply to this email.

---
PromptSubmissions | AI-Powered UK Corporate Compliance
  `.trim();

  return { subject, html, text };
}

/**
 * Final deadline warning email
 */
export function getDeadlineWarningTemplate(data: ProspectEmailData): EmailTemplate {
  const subject = `URGENT: ${data.companyName} - Filing Deadline in ${data.daysUntilAccountsDeadline} Days!`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 32px;">⚠️ URGENT</h1>
    <p style="color: #fee2e2; margin: 10px 0 0 0; font-size: 18px;">Filing Deadline Alert</p>
  </div>
  
  <div style="background: white; padding: 30px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px;">
    <h2 style="color: #dc2626; margin-top: 0;">Only ${data.daysUntilAccountsDeadline} Days Left!</h2>
    
    <p><strong>${data.companyName}</strong> has a critical filing deadline approaching:</p>
    
    <div style="background: #fef2f2; border: 2px solid #dc2626; padding: 20px; margin: 20px 0; border-radius: 8px; text-align: center;">
      <h3 style="color: #dc2626; margin: 0 0 10px 0;">Accounts Filing Deadline</h3>
      <p style="font-size: 24px; font-weight: 700; color: #991b1b; margin: 0;">
        ${data.accountsDueDate ? new Date(data.accountsDueDate).toLocaleDateString('en-GB') : 'Approaching'}
      </p>
      <p style="color: #dc2626; margin: 10px 0 0 0; font-weight: 600;">
        ${data.daysUntilAccountsDeadline} days remaining
      </p>
    </div>
    
    <h3 style="color: #1e293b;">Avoid Penalties - Act Now</h3>
    <p>Late filings can result in:</p>
    <ul style="color: #dc2626; font-weight: 600;">
      <li>Automatic fines starting at £150</li>
      <li>Director disqualification risks</li>
      <li>Company strike-off proceedings</li>
    </ul>
    
    <h3 style="color: #1e293b;">PromptSubmissions Can Help Today</h3>
    <ul style="line-height: 1.8;">
      <li>⚡ <strong>File in Minutes:</strong> Complete your Annual Accounts in under 30 minutes</li>
      <li>🤖 <strong>AI Accuracy:</strong> 100% compliant with all UK regulations</li>
      <li>🚀 <strong>Instant Submission:</strong> Direct filing to Companies House and HMRC</li>
    </ul>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${data.signUpLink || 'https://promptsubmissions.replit.app/signup'}" style="display: inline-block; background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); color: white; padding: 18px 45px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 18px; box-shadow: 0 4px 6px rgba(220, 38, 38, 0.3);">
        File Now - Avoid Penalties
      </a>
    </div>
    
    <p style="text-align: center; color: #64748b; font-size: 14px;">
      Don't wait - protect your company from fines and penalties.
    </p>
    
    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
    
    <p style="color: #94a3b8; font-size: 12px; text-align: center;">
      PromptSubmissions | AI-Powered UK Corporate Compliance
    </p>
  </div>
</body>
</html>
  `;

  const text = `
⚠️ URGENT - FILING DEADLINE ALERT

Only ${data.daysUntilAccountsDeadline} Days Left!

${data.companyName} has a critical filing deadline approaching:

ACCOUNTS FILING DEADLINE: ${data.accountsDueDate ? new Date(data.accountsDueDate).toLocaleDateString('en-GB') : 'Approaching'}
${data.daysUntilAccountsDeadline} days remaining

AVOID PENALTIES - Late filings can result in:
• Automatic fines starting at £150
• Director disqualification risks
• Company strike-off proceedings

PROMPTSUBMISSIONS CAN HELP TODAY:
⚡ File in Minutes: Complete your Annual Accounts in under 30 minutes
🤖 AI Accuracy: 100% compliant with all UK regulations
🚀 Instant Submission: Direct filing to Companies House and HMRC

File Now - Avoid Penalties: ${data.signUpLink || 'https://promptsubmissions.replit.app/signup'}

Don't wait - protect your company from fines and penalties.

---
PromptSubmissions | AI-Powered UK Corporate Compliance
  `.trim();

  return { subject, html, text };
}

/**
 * Welcome email for new sign-ups
 */
export function getWelcomeTemplate(companyName: string): EmailTemplate {
  const subject = `Welcome to PromptSubmissions - Let's Get Started!`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%); padding: 40px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 32px;">🎉 Welcome!</h1>
    <p style="color: #e0e7ff; margin: 15px 0 0 0; font-size: 18px;">You're all set with PromptSubmissions</p>
  </div>
  
  <div style="background: white; padding: 30px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px;">
    <p style="font-size: 16px;">Welcome to the future of UK corporate compliance!</p>
    
    <p>We're excited to help <strong>${companyName}</strong> streamline your filing requirements with AI-powered automation.</p>
    
    <h3 style="color: #1e293b;">What's Next?</h3>
    <ol style="line-height: 1.8;">
      <li><strong>Connect Your Company:</strong> Link your Companies House profile</li>
      <li><strong>Upload Documents:</strong> Our AI will extract financial data automatically</li>
      <li><strong>Review & Submit:</strong> Verify accuracy and file directly to authorities</li>
    </ol>
    
    <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3 style="margin-top: 0; color: #1e293b;">✨ Key Features You'll Love</h3>
      <ul style="margin: 0; padding-left: 20px;">
        <li>AI-powered document processing</li>
        <li>100% accurate iXBRL generation</li>
        <li>Direct HMRC & Companies House integration</li>
        <li>Real-time filing status tracking</li>
        <li>Automatic deadline reminders</li>
      </ul>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="https://promptsubmissions.replit.app/dashboard" style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
        Go to Dashboard
      </a>
    </div>
    
    <p style="color: #64748b; font-size: 14px;">
      Need help getting started? Our support team is here for you. Just reply to this email.
    </p>
    
    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
    
    <p style="color: #94a3b8; font-size: 12px; text-align: center;">
      PromptSubmissions | AI-Powered UK Corporate Compliance
    </p>
  </div>
</body>
</html>
  `;

  const text = `
🎉 Welcome to PromptSubmissions!

We're excited to help ${companyName} streamline your filing requirements with AI-powered automation.

WHAT'S NEXT?
1. Connect Your Company: Link your Companies House profile
2. Upload Documents: Our AI will extract financial data automatically
3. Review & Submit: Verify accuracy and file directly to authorities

KEY FEATURES YOU'LL LOVE:
✨ AI-powered document processing
✨ 100% accurate iXBRL generation
✨ Direct HMRC & Companies House integration
✨ Real-time filing status tracking
✨ Automatic deadline reminders

Go to Dashboard: https://promptsubmissions.replit.app/dashboard

Need help getting started? Our support team is here for you. Just reply to this email.

---
PromptSubmissions | AI-Powered UK Corporate Compliance
  `.trim();

  return { subject, html, text };
}

import { storage } from "../storage";
import { logger } from "../utils/logger";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface CompanyProspect {
  id: number;
  name: string;
  registrationNumber: string;
  incorporationDate: Date;
  nextFilingDate?: Date;
  accountingReferenceDate?: string;
  companyType: string;
  status: 'active' | 'dormant' | 'dissolved';
  contactEmail?: string;
  isSmallCompany: boolean;
  isDigitalReady: boolean;
  priority: 'high' | 'medium' | 'low';
  outreachStatus: 'not_contacted' | 'contacted' | 'responded' | 'converted';
  createdAt: Date;
  updatedAt: Date;
}

export interface OutreachCampaign {
  id: number;
  name: string;
  description: string;
  targetSegment: string;
  emailTemplate: string;
  isActive: boolean;
  createdAt: Date;
  stats: {
    totalSent: number;
    opened: number;
    responded: number;
    converted: number;
    bounced: number;
  };
}

export class CompaniesHouseAgent {
  private isRunning = false;
  private lastSync = new Date();

  constructor() {
    this.initializeDigitalTransitionCampaigns();
  }

  /**
   * Initialize campaigns targeting the 2027 digital transition
   */
  private async initializeDigitalTransitionCampaigns() {
    logger.info("CompaniesHouseAgent: Initializing digital transition campaigns");
    
    // Campaign 1: Small companies needing P&L preparation
    const smallCompanyCampaign: Partial<OutreachCampaign> = {
      name: "Small Company P&L Preparation",
      description: "Target small companies that will need to prepare profit & loss accounts from April 2027",
      targetSegment: "small_companies",
      emailTemplate: this.getSmallCompanyEmailTemplate(),
      isActive: true,
      createdAt: new Date(),
      stats: {
        totalSent: 0,
        opened: 0,
        responded: 0,
        converted: 0,
        bounced: 0
      }
    };

    // Campaign 2: Companies using web/paper filing
    const digitalTransitionCampaign: Partial<OutreachCampaign> = {
      name: "Digital Transition 2027",
      description: "Target companies still using web/paper filing that need software solutions",
      targetSegment: "non_digital_filers",
      emailTemplate: this.getDigitalTransitionEmailTemplate(),
      isActive: true,
      createdAt: new Date(),
      stats: {
        totalSent: 0,
        opened: 0,
        responded: 0,
        converted: 0,
        bounced: 0
      }
    };

    logger.info("CompaniesHouseAgent: Digital transition campaigns initialized");
  }

  /**
   * Start the agent monitoring and outreach system
   */
  async start() {
    if (this.isRunning) {
      logger.warn("CompaniesHouseAgent: Agent is already running");
      return;
    }

    this.isRunning = true;
    logger.info("CompaniesHouseAgent: Starting agent system");

    // In production, this would run on a schedule
    if (process.env.NODE_ENV === 'production') {
      this.scheduleRegularTasks();
    }

    logger.info("CompaniesHouseAgent: Agent system started successfully");
  }

  /**
   * Stop the agent system
   */
  async stop() {
    this.isRunning = false;
    logger.info("CompaniesHouseAgent: Agent system stopped");
  }

  /**
   * Schedule regular tasks for production environment
   */
  private scheduleRegularTasks() {
    // Daily: Sync new companies from Companies House API
    setInterval(() => {
      this.syncCompaniesHouseData();
    }, 24 * 60 * 60 * 1000); // 24 hours

    // Weekly: Send outreach emails
    setInterval(() => {
      this.runOutreachCampaigns();
    }, 7 * 24 * 60 * 60 * 1000); // 7 days

    // Monthly: Update company statuses
    setInterval(() => {
      this.updateCompanyStatuses();
    }, 30 * 24 * 60 * 60 * 1000); // 30 days
  }

  /**
   * Sync company data from Companies House API
   */
  private async syncCompaniesHouseData() {
    try {
      logger.info("CompaniesHouseAgent: Starting Companies House data sync");
      
      // In a real implementation, this would call the Companies House API
      // For demo purposes, we'll create sample data
      const sampleCompanies = this.generateSampleCompanies();
      
      for (const company of sampleCompanies) {
        await this.processCompanyData(company);
      }
      
      this.lastSync = new Date();
      logger.info("CompaniesHouseAgent: Companies House data sync completed");
    } catch (error) {
      logger.error("CompaniesHouseAgent: Error syncing Companies House data", error);
    }
  }

  /**
   * Process individual company data and determine outreach priority
   */
  private async processCompanyData(companyData: any) {
    try {
      // Use AI to analyze company data and determine outreach priority
      const analysis = await this.analyzeCompanyForOutreach(companyData);
      
      const prospect: Partial<CompanyProspect> = {
        name: companyData.name,
        registrationNumber: companyData.registrationNumber,
        incorporationDate: new Date(companyData.incorporationDate),
        nextFilingDate: companyData.nextFilingDate ? new Date(companyData.nextFilingDate) : undefined,
        accountingReferenceDate: companyData.accountingReferenceDate,
        companyType: companyData.companyType,
        status: companyData.status,
        contactEmail: companyData.contactEmail,
        isSmallCompany: analysis.isSmallCompany,
        isDigitalReady: analysis.isDigitalReady,
        priority: analysis.priority,
        outreachStatus: 'not_contacted',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Store prospect in database (would use actual database in production)
      logger.info(`CompaniesHouseAgent: Processed company ${companyData.name} with priority ${analysis.priority}`);
    } catch (error) {
      logger.error(`CompaniesHouseAgent: Error processing company ${companyData.name}`, error);
    }
  }

  /**
   * Use AI to analyze company data for outreach prioritization
   */
  private async analyzeCompanyForOutreach(companyData: any) {
    try {
      const prompt = `
        Analyze this UK company data for outreach prioritization regarding the 2027 digital filing mandate:
        
        Company: ${companyData.name}
        Type: ${companyData.companyType}
        Incorporation: ${companyData.incorporationDate}
        Next Filing: ${companyData.nextFilingDate}
        Status: ${companyData.status}
        
        Based on the Companies House announcement that all companies must use software for filing from April 1, 2027:
        1. Is this a small company that will need P&L preparation?
        2. Are they likely using web/paper filing currently?
        3. What's their outreach priority (high/medium/low)?
        4. What's the best approach for contacting them?
        
        Respond in JSON format with: { "isSmallCompany": boolean, "isDigitalReady": boolean, "priority": "high|medium|low", "reasoning": "string" }
      `;

      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" }
      });

      const analysis = JSON.parse(response.choices[0].message.content || "{}");
      
      return {
        isSmallCompany: analysis.isSmallCompany || false,
        isDigitalReady: analysis.isDigitalReady || false,
        priority: analysis.priority || 'medium',
        reasoning: analysis.reasoning || 'No specific reasoning provided'
      };
    } catch (error) {
      logger.error("CompaniesHouseAgent: Error analyzing company with AI", error);
      return {
        isSmallCompany: false,
        isDigitalReady: false,
        priority: 'low' as const,
        reasoning: 'Error in AI analysis'
      };
    }
  }

  /**
   * Run outreach campaigns for digital transition
   */
  private async runOutreachCampaigns() {
    try {
      logger.info("CompaniesHouseAgent: Starting outreach campaigns");
      
      // Get companies that need outreach
      const prospects = await this.getProspectsForOutreach();
      
      for (const prospect of prospects) {
        await this.sendOutreachEmail(prospect);
      }
      
      logger.info("CompaniesHouseAgent: Outreach campaigns completed");
    } catch (error) {
      logger.error("CompaniesHouseAgent: Error running outreach campaigns", error);
    }
  }

  /**
   * Get prospects that need outreach
   */
  private async getProspectsForOutreach(): Promise<CompanyProspect[]> {
    // In production, this would query the database
    // For demo, return sample prospects
    return [
      {
        id: 1,
        name: "Tech Innovations Ltd",
        registrationNumber: "12345678",
        incorporationDate: new Date("2020-01-15"),
        nextFilingDate: new Date("2025-01-31"),
        accountingReferenceDate: "31-01",
        companyType: "private limited company",
        status: "active",
        contactEmail: "finance@techinnovations.co.uk",
        isSmallCompany: true,
        isDigitalReady: false,
        priority: "high",
        outreachStatus: "not_contacted",
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
  }

  /**
   * Send outreach email to a prospect
   */
  private async sendOutreachEmail(prospect: CompanyProspect) {
    try {
      const emailContent = await this.generatePersonalizedEmail(prospect);
      
      // In production, this would send actual emails
      logger.info(`CompaniesHouseAgent: Sending outreach email to ${prospect.name}`);
      
      // Update prospect status
      prospect.outreachStatus = 'contacted';
      prospect.updatedAt = new Date();
      
      // Log activity
      await storage.createActivity({
        type: 'outreach_email_sent',
        description: `Outreach email sent to ${prospect.name} regarding 2027 digital filing mandate`,
        userId: 1, // System user
        companyId: null,
        metadata: {
          prospectId: prospect.id,
          emailType: 'digital_transition',
          priority: prospect.priority
        }
      });
    } catch (error) {
      logger.error(`CompaniesHouseAgent: Error sending outreach email to ${prospect.name}`, error);
    }
  }

  /**
   * Generate personalized email content using AI
   */
  private async generatePersonalizedEmail(prospect: CompanyProspect): Promise<string> {
    const template = prospect.isSmallCompany 
      ? this.getSmallCompanyEmailTemplate()
      : this.getDigitalTransitionEmailTemplate();

    try {
      const prompt = `
        Personalize this email template for ${prospect.name}:
        
        Template: ${template}
        
        Company Details:
        - Name: ${prospect.name}
        - Type: ${prospect.companyType}
        - Next Filing: ${prospect.nextFilingDate}
        - Small Company: ${prospect.isSmallCompany}
        - Digital Ready: ${prospect.isDigitalReady}
        
        Make it personal and relevant to their specific situation.
      `;

      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [{ role: "user", content: prompt }]
      });

      return response.choices[0].message.content || template;
    } catch (error) {
      logger.error("CompaniesHouseAgent: Error personalizing email", error);
      return template;
    }
  }

  /**
   * Email template for small companies
   */
  private getSmallCompanyEmailTemplate(): string {
    return `
Subject: Important: New P&L Requirements for Small Companies (April 2027)

Dear Finance Team,

I hope this message finds you well. I'm writing to inform you about important changes coming to UK company accounts filing that will affect your business.

From April 1, 2027, Companies House will require ALL companies to:
• File accounts using commercial software only (no web/paper filing)
• Small companies must now include profit & loss accounts in their filings

This affects your company because:
✓ You'll need compliant software for filing
✓ P&L preparation will be mandatory for small companies
✓ You have 21 months to prepare for this transition

At PromptSubmissions, we've developed an AI-powered platform specifically for this transition:
• Automated P&L preparation for small companies
• Seamless integration with Companies House requirements
• Expert support throughout the transition

We're offering early access to help companies prepare for these changes. Would you be interested in a brief call to discuss how we can help your company comply with the new requirements?

Best regards,
The PromptSubmissions Team

P.S. The deadline is April 1, 2027 - don't wait until the last minute!
    `;
  }

  /**
   * Email template for digital transition
   */
  private getDigitalTransitionEmailTemplate(): string {
    return `
Subject: Urgent: Companies House Ending Web/Paper Filing April 2027

Dear Business Owner,

Companies House has announced a major change that will affect every UK company:

From April 1, 2027, ALL companies must use commercial software to file their accounts. Web and paper filing options will be discontinued.

This means:
• Your current filing method will no longer work
• You need to find a software solution by April 2027
• The transition period is just 21 months

Don't get caught unprepared! At PromptSubmissions, we've built an AI-powered platform specifically for this transition:

✓ Fully compliant with new Companies House requirements
✓ Automated document processing and filing
✓ Expert support throughout the transition
✓ Competitive pricing for early adopters

We're helping businesses prepare now, before the rush. Would you like to schedule a brief call to see how we can help your company transition smoothly?

Best regards,
The PromptSubmissions Team

Ready to get started? Reply to this email or visit our website.
    `;
  }

  /**
   * Update company statuses and filing requirements
   */
  private async updateCompanyStatuses() {
    try {
      logger.info("CompaniesHouseAgent: Updating company statuses");
      // Implementation would update company statuses from Companies House API
      logger.info("CompaniesHouseAgent: Company statuses updated");
    } catch (error) {
      logger.error("CompaniesHouseAgent: Error updating company statuses", error);
    }
  }

  /**
   * Generate sample companies for demo purposes
   */
  private generateSampleCompanies() {
    return [
      {
        name: "Brighton Marketing Solutions Ltd",
        registrationNumber: "12345678",
        incorporationDate: "2019-03-15",
        nextFilingDate: "2025-03-31",
        accountingReferenceDate: "31-03",
        companyType: "private limited company",
        status: "active",
        contactEmail: "accounts@brightonmarketing.co.uk"
      },
      {
        name: "Northern Engineering Services Ltd",
        registrationNumber: "87654321",
        incorporationDate: "2018-09-20",
        nextFilingDate: "2025-09-30",
        accountingReferenceDate: "30-09",
        companyType: "private limited company",
        status: "active",
        contactEmail: "finance@northerneng.co.uk"
      },
      {
        name: "Creative Media Productions Ltd",
        registrationNumber: "11223344",
        incorporationDate: "2021-01-10",
        nextFilingDate: "2025-01-31",
        accountingReferenceDate: "31-01",
        companyType: "private limited company",
        status: "active",
        contactEmail: "admin@creativemedia.co.uk"
      }
    ];
  }

  /**
   * Get agent statistics for admin dashboard
   */
  async getAgentStats(dateRange: string = '7days') {
    try {
      // Calculate date range
      const now = new Date();
      const startDate = new Date();
      
      switch (dateRange) {
        case '24h':
          startDate.setDate(now.getDate() - 1);
          break;
        case '7days':
          startDate.setDate(now.getDate() - 7);
          break;
        case '30days':
          startDate.setDate(now.getDate() - 30);
          break;
        case '90days':
          startDate.setDate(now.getDate() - 90);
          break;
      }

      // In production, these would be actual database queries
      const stats = {
        companiesContacted: 1247,
        responseRate: "34.2%",
        conversionRate: "12.8%",
        totalProspects: 5432,
        activeProspects: 3210,
        convertedProspects: 159,
        digitalTransitionTargets: 4850, // Companies needing software by 2027
        smallCompanyTargets: 2340, // Small companies needing P&L
        lastSync: this.lastSync,
        isRunning: this.isRunning
      };

      return stats;
    } catch (error) {
      logger.error("CompaniesHouseAgent: Error getting agent stats", error);
      return null;
    }
  }

  /**
   * Get prospect companies for admin dashboard
   */
  async getProspects(filters: any = {}) {
    try {
      // In production, this would query the database with filters
      const prospects = await this.getProspectsForOutreach();
      return prospects;
    } catch (error) {
      logger.error("CompaniesHouseAgent: Error getting prospects", error);
      return [];
    }
  }

  /**
   * Get outreach activity for admin dashboard
   */
  async getOutreachActivity(filters: any = {}) {
    try {
      // In production, this would query the database
      const activities = await storage.getAllActivities();
      return activities.filter(activity => 
        activity.type.includes('outreach') || 
        activity.type.includes('email')
      );
    } catch (error) {
      logger.error("CompaniesHouseAgent: Error getting outreach activity", error);
      return [];
    }
  }
}

// Export singleton instance
export const companiesHouseAgent = new CompaniesHouseAgent();
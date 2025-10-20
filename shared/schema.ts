import { pgTable, text, serial, integer, boolean, timestamp, jsonb, date, varchar, uniqueIndex, foreignKey, primaryKey, pgEnum, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations, sql } from "drizzle-orm";

// Replit Auth - Session storage table (REQUIRED for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Users - Updated for Replit Auth compatibility
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  // Replit Auth fields
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  // Legacy Firebase fields (kept for backward compatibility)
  username: text("username").unique(),
  password: text("password"),
  fullName: text("full_name"),
  profileImage: text("profile_image"),
  // Common fields
  role: text("role").notNull().default("director"), // director, accountant, admin, auditor
  companyId: integer("company_id").references(() => companies.id),
  subscriptionTierId: integer("subscription_tier_id").references(() => subscriptionTiers.id),
  credits: integer("credits").notNull().default(50),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  password: true,
  fullName: true,
  role: true,
  companyId: true,
}).extend({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

// Replit Auth - UpsertUser type for Replit Auth operations
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

// Companies
export const companies = pgTable("companies", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  registrationNumber: text("registration_number").notNull().unique(),
  registeredAddress: text("registered_address").notNull(),
  incorporationDate: timestamp("incorporation_date").notNull(),
  accountingReference: text("accounting_reference"),
  status: text("status").notNull().default("active"),
});

export const insertCompanySchema = createInsertSchema(companies).pick({
  name: true,
  registrationNumber: true,
  registeredAddress: true,
  incorporationDate: true,
  accountingReference: true,
  status: true,
});

// User Companies Junction Table - for multi-company management (Professional/Enterprise tiers)
export const userCompanies = pgTable("user_companies", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  companyId: integer("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
  role: text("role").notNull().default("owner"), // owner, accountant, viewer
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertUserCompanySchema = createInsertSchema(userCompanies).pick({
  userId: true,
  companyId: true,
  role: true,
  isActive: true,
});

export type UserCompany = typeof userCompanies.$inferSelect;
export type InsertUserCompany = z.infer<typeof insertUserCompanySchema>;

// E-Filing Credentials for Companies House XML Gateway
export const eFilingCredentials = pgTable("efiling_credentials", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  companyId: integer("company_id").references(() => companies.id),
  presenterIdNumber: text("presenter_id_number").notNull(), // 11 alphanumeric chars (e.g., E1234567890)
  presenterAuthenticationCode: text("presenter_authentication_code").notNull(), // Stored encrypted, MD5 hashed for submission
  companyAuthenticationCode: text("company_authentication_code"), // 6-8 digits, company-specific
  testMode: boolean("test_mode").notNull().default(true),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertEFilingCredentialsSchema = createInsertSchema(eFilingCredentials).pick({
  userId: true,
  companyId: true,
  presenterIdNumber: true,
  presenterAuthenticationCode: true,
  companyAuthenticationCode: true,
  testMode: true,
  isActive: true,
});

export type EFilingCredentials = typeof eFilingCredentials.$inferSelect;
export type InsertEFilingCredentials = z.infer<typeof insertEFilingCredentialsSchema>;

// Document types: trial_balance, invoice, bank_statement, accounting_export
export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").notNull().references(() => companies.id),
  userId: integer("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  type: text("type").notNull(),
  size: integer("size").notNull(),
  contentType: text("content_type").notNull(),
  path: text("path").notNull(),
  uploadedAt: timestamp("uploaded_at").notNull().defaultNow(),
  processedAt: timestamp("processed_at"),
  processingStatus: text("processing_status").notNull().default("pending"), // pending, processing, completed, failed
  processingError: text("processing_error"),
  metadata: jsonb("metadata"),
});

export const insertDocumentSchema = createInsertSchema(documents).pick({
  companyId: true,
  userId: true,
  name: true,
  type: true,
  size: true,
  contentType: true,
  path: true,
});

// Tax Filing Section Validation Schemas
export const taxFilingSectionDataSchema = z.object({
  sectionId: z.string().min(1, "Section ID is required"),
  data: z.record(z.any()).refine((data) => data !== null, {
    message: "Section data cannot be null"
  })
});

export const companyInfoSectionSchema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  companyNumber: z.string().min(8, "Company number must be at least 8 characters"),
  utr: z.string().min(10, "UTR must be at least 10 characters"),
  address: z.object({
    line1: z.string().min(1, "Address line 1 is required"),
    line2: z.string().optional(),
    postcode: z.string().min(1, "Postcode is required"),
    country: z.string().default("GB")
  }).optional()
});

export const incomeStatementSectionSchema = z.object({
  turnover: z.number().min(0, "Turnover cannot be negative"),
  costOfSales: z.number().min(0, "Cost of sales cannot be negative").optional(),
  grossProfit: z.number().optional(),
  administrativeExpenses: z.number().min(0, "Administrative expenses cannot be negative").optional(),
  operatingProfit: z.number().optional(),
  netProfit: z.number().optional()
});

export const balanceSheetSectionSchema = z.object({
  fixedAssets: z.number().min(0, "Fixed assets cannot be negative").optional(),
  currentAssets: z.number().min(0, "Current assets cannot be negative").optional(),
  cash: z.number().optional(),
  totalAssets: z.number().min(0, "Total assets cannot be negative").optional(),
  currentLiabilities: z.number().min(0, "Current liabilities cannot be negative").optional(),
  longTermLiabilities: z.number().min(0, "Long term liabilities cannot be negative").optional(),
  totalLiabilities: z.number().min(0, "Total liabilities cannot be negative").optional(),
  netAssets: z.number().optional()
});

// Validation schema selector based on section ID
export const getTaxFilingSectionSchema = (sectionId: string) => {
  switch (sectionId) {
    case 'company-info':
      return companyInfoSectionSchema;
    case 'income-statement':
      return incomeStatementSectionSchema;
    case 'balance-sheet':
      return balanceSheetSectionSchema;
    default:
      return z.record(z.any()); // Allow other sections but ensure it's an object
  }
};

// Filing types: confirmation_statement, annual_accounts, corporation_tax
export const filings = pgTable("filings", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").notNull().references(() => companies.id),
  userId: integer("user_id").notNull().references(() => users.id),
  type: text("type").notNull(),
  status: text("status").notNull().default("draft"), // draft, in_progress, awaiting_approval, approved, submitted, rejected
  dueDate: timestamp("due_date"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  submitDate: timestamp("submit_date"),
  data: jsonb("data"),
  documentIds: integer("document_ids").array(),
  progress: integer("progress").notNull().default(0),
});

export const insertFilingSchema = createInsertSchema(filings).pick({
  companyId: true,
  userId: true,
  type: true,
  status: true,
  dueDate: true,
  data: true,
  documentIds: true,
  progress: true,
});

// Activities
export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  companyId: integer("company_id").references(() => companies.id),
  type: text("type").notNull(), // document_upload, filing_update, user_invite, etc.
  description: text("description").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  metadata: jsonb("metadata"),
});

export const insertActivitySchema = createInsertSchema(activities).pick({
  userId: true,
  companyId: true,
  type: true,
  description: true,
  metadata: true,
});

// Assistant messages
export const assistantMessages = pgTable("assistant_messages", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  role: text("role").notNull(), // user, assistant
  content: text("content").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  metadata: jsonb("metadata"),
});

export const insertAssistantMessageSchema = createInsertSchema(assistantMessages).pick({
  userId: true,
  role: true,
  content: true,
  metadata: true,
});

// Type exports
export type Company = typeof companies.$inferSelect;
export type InsertCompany = z.infer<typeof insertCompanySchema>;

export type Document = typeof documents.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;

export type Filing = typeof filings.$inferSelect;
export type InsertFiling = z.infer<typeof insertFilingSchema>;

export type Activity = typeof activities.$inferSelect;
export type InsertActivity = z.infer<typeof insertActivitySchema>;

export type AssistantMessage = typeof assistantMessages.$inferSelect;
export type InsertAssistantMessage = z.infer<typeof insertAssistantMessageSchema>;

// Filing reminders - Used to track companies with upcoming filing requirements
export const filingReminders = pgTable("filing_reminders", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").notNull().references(() => companies.id),
  filingType: text("filing_type").notNull(), // confirmation_statement, annual_accounts, corporation_tax
  dueDate: timestamp("due_date").notNull(),
  status: text("status").notNull().default("pending"), // pending, reminded, completed, overdue
  createdAt: timestamp("created_at").notNull().defaultNow(),
  lastReminderSent: timestamp("last_reminder_sent"),
});

export const insertFilingReminderSchema = createInsertSchema(filingReminders).pick({
  companyId: true,
  filingType: true,
  dueDate: true,
  status: true
});

// Company contacts - Stores contact information for outreach purposes
export const companyContacts = pgTable("company_contacts", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").notNull().references(() => companies.id),
  email: text("email"),
  name: text("name"),
  position: text("position"),
  phone: text("phone"),
  isPrimary: boolean("is_primary").default(false),
  source: text("source").notNull(), // manual, ai_research, companies_house, etc.
  verificationStatus: text("verification_status").notNull().default("pending"), // pending, verified, bounce, unsubscribed
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertCompanyContactSchema = createInsertSchema(companyContacts).pick({
  companyId: true,
  email: true,
  name: true,
  position: true,
  phone: true,
  isPrimary: true,
  source: true,
  verificationStatus: true
});

// Outreach campaigns - Tracks marketing and outreach activities
export const outreachCampaigns = pgTable("outreach_campaigns", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").notNull().references(() => companies.id),
  contactId: integer("contact_id").references(() => companyContacts.id),
  campaignType: text("campaign_type").notNull(), // filing_reminder, welcome, feedback, etc.
  emailSent: boolean("email_sent").notNull().default(false),
  emailSubject: text("email_subject"),
  sentAt: timestamp("sent_at"),
  openedAt: timestamp("opened_at"),
  clickedAt: timestamp("clicked_at"),
  respondedAt: timestamp("responded_at"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertOutreachCampaignSchema = createInsertSchema(outreachCampaigns).pick({
  companyId: true,
  contactId: true,
  campaignType: true,
  emailSent: true,
  emailSubject: true,
  metadata: true
});

// Prospects - Companies discovered from Companies House API with upcoming filing deadlines
export const prospects = pgTable("prospects", {
  id: serial("id").primaryKey(),
  companyNumber: text("company_number").notNull().unique(),
  companyName: text("company_name").notNull(),
  companyStatus: text("company_status").notNull(), // active, dissolved, liquidation, etc.
  incorporationDate: text("incorporation_date"),
  
  // Filing deadline information from Companies House
  accountsDueDate: text("accounts_due_date"),
  confirmationStatementDueDate: text("confirmation_statement_due_date"),
  
  // Company size indicators
  entitySize: text("entity_size"), // micro, small, medium, large
  sic_codes: text("sic_codes").array(),
  
  // Exa enrichment data
  enrichmentStatus: text("enrichment_status").default("pending"), // pending, enriched, failed
  enrichedAt: timestamp("enriched_at"),
  companyWebsite: text("company_website"),
  companyDescription: text("company_description"),
  employeeCount: integer("employee_count"),
  estimatedRevenue: text("estimated_revenue"),
  fundingStage: text("funding_stage"),
  techStack: text("tech_stack").array(),
  recentNews: text("recent_news").array(),
  socialProfiles: jsonb("social_profiles"), // {linkedin, twitter, etc.}
  
  // Lead scoring (enhanced with enriched data)
  leadScore: integer("lead_score").default(0), // 0-100 score based on deadline proximity, size, signals
  leadStatus: text("lead_status").notNull().default("new"), // new, contacted, qualified, converted, lost
  
  // Contact information
  contactEmail: text("contact_email"), // Primary contact email for outreach
  contactName: text("contact_name"), // Primary contact name
  
  // Outreach tracking
  lastContactedAt: timestamp("last_contacted_at"),
  convertedAt: timestamp("converted_at"),
  convertedToUserId: integer("converted_to_user_id").references(() => users.id),
  
  // Discovery metadata
  agentRunId: integer("agent_run_id").references(() => agentRuns.id),
  discoverySource: text("discovery_source").notNull(), // companies_house_api, manual, import
  
  // Additional metadata for tracking outreach history
  metadata: jsonb("metadata"),
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertProspectSchema = createInsertSchema(prospects).pick({
  companyNumber: true,
  companyName: true,
  companyStatus: true,
  incorporationDate: true,
  accountsDueDate: true,
  confirmationStatementDueDate: true,
  entitySize: true,
  sic_codes: true,
  leadScore: true,
  leadStatus: true,
  agentRunId: true,
  discoverySource: true
});

export type Prospect = typeof prospects.$inferSelect;
export type InsertProspect = z.infer<typeof insertProspectSchema>;

// Decision Makers - C-level contacts discovered via Exa enrichment
export const decisionMakers = pgTable("decision_makers", {
  id: serial("id").primaryKey(),
  prospectId: integer("prospect_id").notNull().references(() => prospects.id),
  name: text("name").notNull(),
  title: text("title").notNull(), // CFO, Finance Director, Managing Director, CEO, etc.
  email: text("email"),
  phone: text("phone"),
  linkedinUrl: text("linkedin_url"),
  
  // Enrichment metadata
  source: text("source").notNull().default("exa"), // exa, hunter, manual, companies_house
  confidence: integer("confidence").default(0), // 0-100 confidence score
  
  // Outreach tracking
  contactedAt: timestamp("contacted_at"),
  respondedAt: timestamp("responded_at"),
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertDecisionMakerSchema = createInsertSchema(decisionMakers).pick({
  prospectId: true,
  name: true,
  title: true,
  email: true,
  phone: true,
  linkedinUrl: true,
  source: true,
  confidence: true,
});

export type DecisionMaker = typeof decisionMakers.$inferSelect;
export type InsertDecisionMaker = z.infer<typeof insertDecisionMakerSchema>;

// Document templates - Provides templates for users to download and fill
export const documentTemplates = pgTable("document_templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  filingType: text("filing_type").notNull(), // confirmation_statement, annual_accounts, corporation_tax
  templateType: text("template_type").notNull(), // excel, csv, pdf, word
  path: text("path").notNull(),
  version: text("version").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertDocumentTemplateSchema = createInsertSchema(documentTemplates).pick({
  name: true,
  description: true,
  filingType: true,
  templateType: true,
  path: true,
  version: true,
  isActive: true
});

// Agent runs - Tracks execution of automated agents
export const agentRuns = pgTable("agent_runs", {
  id: serial("id").primaryKey(),
  agentType: text("agent_type").notNull(), // companies_house, contact_research, outreach_email, onboarding
  status: text("status").notNull(), // scheduled, running, completed, failed
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  error: text("error"),
  metrics: jsonb("metrics"), // Performance metrics like items processed, success rate, etc.
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertAgentRunSchema = createInsertSchema(agentRuns).pick({
  agentType: true,
  status: true,
  metadata: true
});

// Subscription tiers - Professional and Enterprise pricing
export const subscriptionTiers = pgTable("subscription_tiers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(), // basic, professional, enterprise
  displayName: text("display_name").notNull(),
  description: text("description"),
  monthlyPrice: integer("monthly_price").notNull(), // in pence (0 for basic)
  annualPrice: integer("annual_price"), // in pence (discounted annual rate)
  creditMultiplier: integer("credit_multiplier").notNull().default(100), // stored as percentage (100 = 1.0x, 120 = 1.2x, 150 = 1.5x)
  features: jsonb("features"), // { multi_company_management: bool, priority_support: bool, batch_operations: bool, dedicated_support: bool, custom_sla: bool, api_access: bool }
  maxCompanies: integer("max_companies"), // null = unlimited
  maxUsers: integer("max_users"), // null = unlimited for enterprise
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0), // for display ordering
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertSubscriptionTierSchema = createInsertSchema(subscriptionTiers).pick({
  name: true,
  displayName: true,
  description: true,
  monthlyPrice: true,
  annualPrice: true,
  creditMultiplier: true,
  features: true,
  maxCompanies: true,
  maxUsers: true,
  isActive: true,
  sortOrder: true,
});

// User subscriptions - Tracks active subscriptions and billing
export const userSubscriptions = pgTable("user_subscriptions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  tierId: integer("tier_id").notNull().references(() => subscriptionTiers.id),
  status: text("status").notNull().default("active"), // active, cancelled, expired, past_due
  billingCycle: text("billing_cycle").notNull(), // monthly, annual
  currentPeriodStart: timestamp("current_period_start").notNull(),
  currentPeriodEnd: timestamp("current_period_end").notNull(),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").notNull().default(false),
  stripeSubscriptionId: text("stripe_subscription_id"),
  stripeCustomerId: text("stripe_customer_id"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertUserSubscriptionSchema = createInsertSchema(userSubscriptions).pick({
  userId: true,
  tierId: true,
  status: true,
  billingCycle: true,
  currentPeriodStart: true,
  currentPeriodEnd: true,
  cancelAtPeriodEnd: true,
  stripeSubscriptionId: true,
  stripeCustomerId: true,
  metadata: true,
});

// Credit packages
export const creditPackages = pgTable("credit_packages", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  price: integer("price").notNull(), // in pence/cents
  creditAmount: integer("credit_amount").notNull(),
  minTierLevel: integer("min_tier_level"), // null=all tiers, 1=Basic+, 2=Professional+, 3=Enterprise only
  tierDiscount: integer("tier_discount").default(0), // Additional % discount for tier (0-100)
  isActive: boolean("is_active").notNull().default(true),
  isPopular: boolean("is_popular").default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertCreditPackageSchema = createInsertSchema(creditPackages).pick({
  name: true,
  description: true,
  price: true,
  creditAmount: true,
  minTierLevel: true,
  tierDiscount: true,
  isActive: true,
  isPopular: true,
});

// Filing costs
export const filingCosts = pgTable("filing_costs", {
  id: serial("id").primaryKey(),
  filingType: text("filing_type").notNull().unique(), // confirmation_statement, annual_accounts, corporation_tax
  creditCost: integer("credit_cost").notNull(),
  actualCost: integer("actual_cost").notNull(), // in pence/cents (e.g. £34 = 3400)
  description: text("description"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertFilingCostSchema = createInsertSchema(filingCosts).pick({
  filingType: true,
  creditCost: true,
  actualCost: true,
  description: true,
  isActive: true,
});

// Credit transactions
export const creditTransactions = pgTable("credit_transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  type: text("type").notNull(), // purchase, usage, refund, adjustment
  amount: integer("amount").notNull(), // positive for additions, negative for deductions
  balance: integer("balance").notNull(), // user balance after transaction
  description: text("description").notNull(),
  metadata: jsonb("metadata"),
  filingId: integer("filing_id").references(() => filings.id),
  packageId: integer("package_id").references(() => creditPackages.id),
  stripePaymentId: text("stripe_payment_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertCreditTransactionSchema = createInsertSchema(creditTransactions).pick({
  userId: true,
  type: true,
  amount: true,
  balance: true,
  description: true,
  metadata: true,
  filingId: true,
  packageId: true,
  stripePaymentId: true,
});

// Processed Webhook Events - For idempotent webhook processing
export const processedWebhookEvents = pgTable("processed_webhook_events", {
  id: serial("id").primaryKey(),
  eventId: text("event_id").notNull().unique(), // Stripe payment_intent.id or other unique event identifier
  eventType: text("event_type").notNull(), // e.g., 'stripe_payment_intent_succeeded'
  processedAt: timestamp("processed_at").notNull().defaultNow(),
  metadata: jsonb("metadata"), // Additional data about the event
});

export const insertProcessedWebhookEventSchema = createInsertSchema(processedWebhookEvents).pick({
  eventId: true,
  eventType: true,
  metadata: true,
});

export type ProcessedWebhookEvent = typeof processedWebhookEvents.$inferSelect;
export type InsertProcessedWebhookEvent = z.infer<typeof insertProcessedWebhookEventSchema>;

// Prior Year Data for Comparative Reporting
export const priorYearData = pgTable("prior_year_data", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").notNull().references(() => companies.id),
  userId: integer("user_id").notNull().references(() => users.id),
  yearEnding: date("year_ending").notNull(),
  dataType: text("data_type").notNull(), // 'trial_balance', 'accounts', 'companies_house_filing'
  sourceType: text("source_type").notNull(), // 'uploaded', 'companies_house_api', 'manual_entry'
  sourceReference: text("source_reference"), // File name or API reference
  data: jsonb("data").notNull(), // JSON structure of financial data
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  isVerified: boolean("is_verified").notNull().default(false),
});

export const insertPriorYearDataSchema = createInsertSchema(priorYearData).pick({
  companyId: true,
  userId: true,
  yearEnding: true,
  dataType: true,
  sourceType: true,
  sourceReference: true,
  data: true,
  isVerified: true,
});

// Comparative Period Configurations
export const comparativePeriods = pgTable("comparative_periods", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").notNull().references(() => companies.id),
  currentYearEnding: date("current_year_ending").notNull(),
  priorYearEnding: date("prior_year_ending").notNull(),
  layoutTemplate: text("layout_template").notNull().default("standard"), // Template for consistent formatting
  mappingRules: jsonb("mapping_rules"), // Account mapping between periods
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertComparativePeriodSchema = createInsertSchema(comparativePeriods).pick({
  companyId: true,
  currentYearEnding: true,
  priorYearEnding: true,
  layoutTemplate: true,
  mappingRules: true,
  isActive: true,
});

// Auditor Invitations
export const auditorInvitations = pgTable("auditor_invitations", {
  id: serial("id").primaryKey(),
  invitedBy: integer("invited_by").notNull().references(() => users.id),
  companyId: integer("company_id").notNull().references(() => companies.id),
  auditorEmail: text("auditor_email").notNull(),
  auditorName: text("auditor_name"),
  token: text("token").notNull().unique(),
  status: text("status").notNull().default("pending"), // pending, accepted, expired, cancelled
  accessLevel: text("access_level").notNull().default("read_only"), // read_only (can view filings & docs)
  filingIds: integer("filing_ids").array(), // Specific filings to grant access to (null = all filings)
  expiresAt: timestamp("expires_at").notNull(),
  acceptedAt: timestamp("accepted_at"),
  acceptedUserId: integer("accepted_user_id").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertAuditorInvitationSchema = createInsertSchema(auditorInvitations).pick({
  invitedBy: true,
  companyId: true,
  auditorEmail: true,
  auditorName: true,
  token: true,
  status: true,
  accessLevel: true,
  filingIds: true,
  expiresAt: true,
});

// Companies House Filing History
export const companiesHouseFilings = pgTable("companies_house_filings", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").notNull().references(() => companies.id),
  registrationNumber: text("registration_number").notNull(),
  filingDate: date("filing_date").notNull(),
  accountsPeriodEndOn: date("accounts_period_end_on").notNull(),
  accountsPeriodStartOn: date("accounts_period_start_on").notNull(),
  category: text("category").notNull(), // 'accounts', 'confirmation-statement', etc.
  description: text("description").notNull(),
  actionDate: date("action_date"),
  paperFiled: boolean("paper_filed").default(false),
  filingHistoryData: jsonb("filing_history_data"), // Raw data from Companies House API
  accountsData: jsonb("accounts_data"), // Extracted accounts data if available
  isImported: boolean("is_imported").notNull().default(false),
  importedAt: timestamp("imported_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertCompaniesHouseFilingSchema = createInsertSchema(companiesHouseFilings).pick({
  companyId: true,
  registrationNumber: true,
  filingDate: true,
  accountsPeriodEndOn: true,
  accountsPeriodStartOn: true,
  category: true,
  description: true,
  actionDate: true,
  paperFiled: true,
  filingHistoryData: true,
  accountsData: true,
  isImported: true,
});

// Opening Trial Balances
export const openingTrialBalances = pgTable("opening_trial_balances", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").notNull().references(() => companies.id),
  userId: integer("user_id").notNull().references(() => users.id),
  periodStartDate: date("period_start_date").notNull(),
  periodEndDate: date("period_end_date").notNull(),
  fileName: text("file_name").notNull(),
  fileSize: integer("file_size").notNull(),
  filePath: text("file_path").notNull(),
  uploadedAt: timestamp("uploaded_at").notNull().defaultNow(),
  processedAt: timestamp("processed_at"),
  processingStatus: text("processing_status").notNull().default("pending"), // pending, processing, completed, failed
  processingError: text("processing_error"),
  trialBalanceData: jsonb("trial_balance_data"), // Structured trial balance data
  totalDebits: integer("total_debits").default(0), // In pence
  totalCredits: integer("total_credits").default(0), // In pence
  accountCount: integer("account_count").default(0),
  isVerified: boolean("is_verified").notNull().default(false),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertOpeningTrialBalanceSchema = createInsertSchema(openingTrialBalances).pick({
  companyId: true,
  userId: true,
  periodStartDate: true,
  periodEndDate: true,
  fileName: true,
  fileSize: true,
  filePath: true,
  trialBalanceData: true,
  totalDebits: true,
  totalCredits: true,
  accountCount: true,
  isVerified: true,
  notes: true,
});

// Export additional types
export type FilingReminder = typeof filingReminders.$inferSelect;
export type InsertFilingReminder = z.infer<typeof insertFilingReminderSchema>;

export type CompanyContact = typeof companyContacts.$inferSelect;
export type InsertCompanyContact = z.infer<typeof insertCompanyContactSchema>;

export type OutreachCampaign = typeof outreachCampaigns.$inferSelect;
export type InsertOutreachCampaign = z.infer<typeof insertOutreachCampaignSchema>;

export type DocumentTemplate = typeof documentTemplates.$inferSelect;
export type InsertDocumentTemplate = z.infer<typeof insertDocumentTemplateSchema>;

export type AgentRun = typeof agentRuns.$inferSelect;
export type InsertAgentRun = z.infer<typeof insertAgentRunSchema>;

export type SubscriptionTier = typeof subscriptionTiers.$inferSelect;
export type InsertSubscriptionTier = z.infer<typeof insertSubscriptionTierSchema>;

export type UserSubscription = typeof userSubscriptions.$inferSelect;
export type InsertUserSubscription = z.infer<typeof insertUserSubscriptionSchema>;

export type CreditPackage = typeof creditPackages.$inferSelect;
export type InsertCreditPackage = z.infer<typeof insertCreditPackageSchema>;

export type FilingCost = typeof filingCosts.$inferSelect;
export type InsertFilingCost = z.infer<typeof insertFilingCostSchema>;

export type CreditTransaction = typeof creditTransactions.$inferSelect;
export type InsertCreditTransaction = z.infer<typeof insertCreditTransactionSchema>;

export type PriorYearData = typeof priorYearData.$inferSelect;
export type InsertPriorYearData = z.infer<typeof insertPriorYearDataSchema>;

export type ComparativePeriod = typeof comparativePeriods.$inferSelect;
export type InsertComparativePeriod = z.infer<typeof insertComparativePeriodSchema>;

export type AuditorInvitation = typeof auditorInvitations.$inferSelect;
export type InsertAuditorInvitation = z.infer<typeof insertAuditorInvitationSchema>;

export type CompaniesHouseFiling = typeof companiesHouseFilings.$inferSelect;
export type InsertCompaniesHouseFiling = z.infer<typeof insertCompaniesHouseFilingSchema>;

export type OpeningTrialBalance = typeof openingTrialBalances.$inferSelect;
export type InsertOpeningTrialBalance = z.infer<typeof insertOpeningTrialBalanceSchema>;

// Define relationships between tables for better querying
export const usersRelations = relations(users, ({ one, many }) => ({
  company: one(companies, { fields: [users.companyId], references: [companies.id] }),
  subscriptionTier: one(subscriptionTiers, { fields: [users.subscriptionTierId], references: [subscriptionTiers.id] }),
  documents: many(documents),
  filings: many(filings),
  activities: many(activities),
  assistantMessages: many(assistantMessages),
  transactions: many(creditTransactions),
  subscriptions: many(userSubscriptions),
  userCompanies: many(userCompanies),
  auditorInvitationsSent: many(auditorInvitations),
}));

export const companiesRelations = relations(companies, ({ many }) => ({
  users: many(users),
  documents: many(documents),
  filings: many(filings),
  filingReminders: many(filingReminders),
  contacts: many(companyContacts),
  outreachCampaigns: many(outreachCampaigns),
  priorYearData: many(priorYearData),
  comparativePeriods: many(comparativePeriods),
  companiesHouseFilings: many(companiesHouseFilings),
  openingTrialBalances: many(openingTrialBalances),
  userCompanies: many(userCompanies)
}));

export const userCompaniesRelations = relations(userCompanies, ({ one }) => ({
  user: one(users, { fields: [userCompanies.userId], references: [users.id] }),
  company: one(companies, { fields: [userCompanies.companyId], references: [companies.id] })
}));

export const prospectsRelations = relations(prospects, ({ many, one }) => ({
  decisionMakers: many(decisionMakers),
  agentRun: one(agentRuns, { fields: [prospects.agentRunId], references: [agentRuns.id] }),
  convertedUser: one(users, { fields: [prospects.convertedToUserId], references: [users.id] })
}));

export const decisionMakersRelations = relations(decisionMakers, ({ one }) => ({
  prospect: one(prospects, { fields: [decisionMakers.prospectId], references: [prospects.id] })
}));

export const documentsRelations = relations(documents, ({ one }) => ({
  company: one(companies, { fields: [documents.companyId], references: [companies.id] }),
  user: one(users, { fields: [documents.userId], references: [users.id] })
}));

export const filingsRelations = relations(filings, ({ one }) => ({
  company: one(companies, { fields: [filings.companyId], references: [companies.id] }),
  user: one(users, { fields: [filings.userId], references: [users.id] })
}));

export const activitiesRelations = relations(activities, ({ one }) => ({
  user: one(users, { fields: [activities.userId], references: [users.id] }),
  company: one(companies, { 
    fields: [activities.companyId], 
    references: [companies.id]
  })
}));

export const assistantMessagesRelations = relations(assistantMessages, ({ one }) => ({
  user: one(users, { fields: [assistantMessages.userId], references: [users.id] })
}));

export const filingRemindersRelations = relations(filingReminders, ({ one }) => ({
  company: one(companies, { fields: [filingReminders.companyId], references: [companies.id] })
}));

export const companyContactsRelations = relations(companyContacts, ({ one, many }) => ({
  company: one(companies, { fields: [companyContacts.companyId], references: [companies.id] }),
  outreachCampaigns: many(outreachCampaigns)
}));

export const outreachCampaignsRelations = relations(outreachCampaigns, ({ one }) => ({
  company: one(companies, { fields: [outreachCampaigns.companyId], references: [companies.id] }),
  contact: one(companyContacts, { 
    fields: [outreachCampaigns.contactId], 
    references: [companyContacts.id]
  })
}));

// Subscription tiers relations
export const subscriptionTiersRelations = relations(subscriptionTiers, ({ many }) => ({
  users: many(users),
  subscriptions: many(userSubscriptions)
}));

// User subscriptions relations
export const userSubscriptionsRelations = relations(userSubscriptions, ({ one }) => ({
  user: one(users, { fields: [userSubscriptions.userId], references: [users.id] }),
  tier: one(subscriptionTiers, { fields: [userSubscriptions.tierId], references: [subscriptionTiers.id] })
}));

// Credit packages relations
export const creditPackagesRelations = relations(creditPackages, ({ many }) => ({
  transactions: many(creditTransactions)
}));

// Credit transactions relations
export const creditTransactionsRelations = relations(creditTransactions, ({ one }) => ({
  user: one(users, { fields: [creditTransactions.userId], references: [users.id] }),
  filing: one(filings, { fields: [creditTransactions.filingId], references: [filings.id] }),
  package: one(creditPackages, { fields: [creditTransactions.packageId], references: [creditPackages.id] })
}));

// Prior year data relations
export const priorYearDataRelations = relations(priorYearData, ({ one }) => ({
  company: one(companies, { fields: [priorYearData.companyId], references: [companies.id] }),
  user: one(users, { fields: [priorYearData.userId], references: [users.id] })
}));

// Comparative periods relations
export const comparativePeriodsRelations = relations(comparativePeriods, ({ one }) => ({
  company: one(companies, { fields: [comparativePeriods.companyId], references: [companies.id] })
}));

// Auditor invitations relations
export const auditorInvitationsRelations = relations(auditorInvitations, ({ one }) => ({
  inviter: one(users, { fields: [auditorInvitations.invitedBy], references: [users.id] }),
  company: one(companies, { fields: [auditorInvitations.companyId], references: [companies.id] }),
  acceptedUser: one(users, { fields: [auditorInvitations.acceptedUserId], references: [users.id] })
}));

// Companies House filings relations
export const companiesHouseFilingsRelations = relations(companiesHouseFilings, ({ one }) => ({
  company: one(companies, { fields: [companiesHouseFilings.companyId], references: [companies.id] })
}));

// Opening trial balance relations
export const openingTrialBalancesRelations = relations(openingTrialBalances, ({ one }) => ({
  company: one(companies, { fields: [openingTrialBalances.companyId], references: [companies.id] }),
  user: one(users, { fields: [openingTrialBalances.userId], references: [users.id] })
}));

// Audit Logs - Track all system actions and changes
export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  action: text("action").notNull(), // e.g., "filing_submitted", "user_login", "credit_purchased"
  entityType: text("entity_type"), // e.g., "filing", "user", "company"
  entityId: integer("entity_id"), // ID of the affected entity
  changes: jsonb("changes"), // JSON object with before/after values
  metadata: jsonb("metadata"), // Additional context (IP, user agent, etc.)
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertAuditLogSchema = createInsertSchema(auditLogs).pick({
  userId: true,
  action: true,
  entityType: true,
  entityId: true,
  changes: true,
  metadata: true,
  ipAddress: true,
  userAgent: true,
});

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;

// Audit logs relations
export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(users, { fields: [auditLogs.userId], references: [users.id] })
}));

// Admin Notifications - For error alerts and system notifications
export const adminNotifications = pgTable("admin_notifications", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(), // e.g., "error_alert", "system_alert", "performance_alert"
  severity: text("severity").notNull(), // "critical", "high", "medium", "low"
  title: text("title").notNull(),
  message: text("message").notNull(),
  auditLogId: integer("audit_log_id").references(() => auditLogs.id),
  isRead: boolean("is_read").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  readAt: timestamp("read_at"),
});

export const insertAdminNotificationSchema = createInsertSchema(adminNotifications).omit({
  id: true,
  createdAt: true,
});

export type AdminNotification = typeof adminNotifications.$inferSelect;
export type InsertAdminNotification = z.infer<typeof insertAdminNotificationSchema>;

// Admin notifications relations
export const adminNotificationsRelations = relations(adminNotifications, ({ one }) => ({
  auditLog: one(auditLogs, { fields: [adminNotifications.auditLogId], references: [auditLogs.id] })
}));

// Accounting Policy Templates - Pre-configured templates for common industries
export const accountingPolicyTemplates = pgTable("accounting_policy_templates", {
  id: serial("id").primaryKey(),
  industry: text("industry").notNull(), // e.g., "Tech/SaaS", "Retail", "Professional Services"
  entitySize: text("entity_size").notNull(), // micro, small, medium, large
  templateName: text("template_name").notNull(),
  description: text("description"),
  basisOfPreparation: text("basis_of_preparation").notNull(),
  goingConcern: text("going_concern").notNull(),
  turnoverRecognitionPolicy: text("turnover_recognition_policy").notNull(),
  tangibleFixedAssetsPolicy: text("tangible_fixed_assets_policy").notNull(),
  stocksValuationPolicy: text("stocks_valuation_policy"),
  taxationPolicy: text("taxation_policy").notNull(),
  pensionCosts: text("pension_costs"),
  foreignCurrency: text("foreign_currency"),
  leases: text("leases"),
  industrySpecificPolicies: jsonb("industry_specific_policies"), // Additional policies specific to industry
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertAccountingPolicyTemplateSchema = createInsertSchema(accountingPolicyTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type AccountingPolicyTemplate = typeof accountingPolicyTemplates.$inferSelect;
export type InsertAccountingPolicyTemplate = z.infer<typeof insertAccountingPolicyTemplateSchema>;

// Accounting Policies History - Track changes to accounting policies year-over-year
export const accountingPoliciesHistory = pgTable("accounting_policies_history", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => users.id),
  filingId: integer("filing_id").references(() => filings.id, { onDelete: "cascade" }),
  yearEnding: text("year_ending").notNull(), // e.g., "2024-12-31"
  accountingFramework: text("accounting_framework").notNull(), // FRS 102, FRS 105, UK IFRS
  policiesData: jsonb("policies_data").notNull(), // Full accounting policies as JSON
  changesFromPriorYear: jsonb("changes_from_prior_year"), // Detected changes from previous year
  changeReason: text("change_reason"), // User explanation for policy changes
  financialImpact: jsonb("financial_impact"), // Impact on current and prior year figures
  isRestatement: boolean("is_restatement").default(false), // True if prior year restated
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertAccountingPoliciesHistorySchema = createInsertSchema(accountingPoliciesHistory).omit({
  id: true,
  createdAt: true,
});

export type AccountingPoliciesHistory = typeof accountingPoliciesHistory.$inferSelect;
export type InsertAccountingPoliciesHistory = z.infer<typeof insertAccountingPoliciesHistorySchema>;

// Accounting policies history relations
export const accountingPoliciesHistoryRelations = relations(accountingPoliciesHistory, ({ one }) => ({
  company: one(companies, { fields: [accountingPoliciesHistory.companyId], references: [companies.id] }),
  user: one(users, { fields: [accountingPoliciesHistory.userId], references: [users.id] }),
  filing: one(filings, { fields: [accountingPoliciesHistory.filingId], references: [filings.id] })
}));

// Custom Notes - User-defined additional notes for financial statements
export const customNotes = pgTable("custom_notes", {
  id: serial("id").primaryKey(),
  filingId: integer("filing_id").notNull().references(() => filings.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => users.id),
  noteTitle: text("note_title").notNull(),
  noteContent: text("note_content").notNull(),
  displayOrder: integer("display_order").notNull().default(0), // Order in which notes appear
  ixbrlTag: text("ixbrl_tag"), // Optional iXBRL tag for tagging
  noteType: text("note_type").default("general"), // general, accounting_policy, disclosure, etc.
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertCustomNoteSchema = createInsertSchema(customNotes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type CustomNote = typeof customNotes.$inferSelect;
export type InsertCustomNote = z.infer<typeof insertCustomNoteSchema>;

// Custom notes relations
export const customNotesRelations = relations(customNotes, ({ one }) => ({
  filing: one(filings, { fields: [customNotes.filingId], references: [filings.id] }),
  user: one(users, { fields: [customNotes.userId], references: [users.id] })
}));

// AI Rate Limits - GLOBAL tracking across ALL AI endpoints (atomic with FOR UPDATE)
// Max 10 AI requests per minute per user across directors/strategic/notes/cashflow/bulk endpoints
export const aiRateLimits = pgTable("ai_rate_limits", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }).unique(), // ONE record per user
  ipAddress: text("ip_address"), // For monitoring/analytics, not enforced yet
  requestCount: integer("request_count").notNull().default(0), // Total requests in current window across ALL endpoints
  windowStartedAt: timestamp("window_started_at").notNull().defaultNow(), // When current 60s window started
  lastRequestAt: timestamp("last_request_at").notNull().defaultNow(), // Last request timestamp for cleanup
  isBlocked: boolean("is_blocked").default(false), // True if user exceeded 10 req/min
  blockedUntil: timestamp("blocked_until"), // When the 5-minute block expires
  totalBlockCount: integer("total_block_count").notNull().default(0), // Track repeat offenders
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertAIRateLimitSchema = createInsertSchema(aiRateLimits).omit({
  id: true,
});

export type AIRateLimit = typeof aiRateLimits.$inferSelect;
export type InsertAIRateLimit = z.infer<typeof insertAIRateLimitSchema>;

// AI rate limits relations
export const aiRateLimitsRelations = relations(aiRateLimits, ({ one }) => ({
  user: one(users, { fields: [aiRateLimits.userId], references: [users.id] })
}));


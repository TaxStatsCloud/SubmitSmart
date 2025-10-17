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
  role: text("role").notNull().default("director"), // director, accountant, admin
  companyId: integer("company_id").references(() => companies.id),
  credits: integer("credits").notNull().default(50),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  fullName: true,
  role: true,
  companyId: true,
  profileImage: true,
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
  
  // Lead scoring
  leadScore: integer("lead_score").default(0), // 0-100 score based on deadline proximity, size, etc.
  leadStatus: text("lead_status").notNull().default("new"), // new, contacted, qualified, converted, lost
  
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

// Credit packages
export const creditPackages = pgTable("credit_packages", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  price: integer("price").notNull(), // in pence/cents
  creditAmount: integer("credit_amount").notNull(),
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

export type CompaniesHouseFiling = typeof companiesHouseFilings.$inferSelect;
export type InsertCompaniesHouseFiling = z.infer<typeof insertCompaniesHouseFilingSchema>;

export type OpeningTrialBalance = typeof openingTrialBalances.$inferSelect;
export type InsertOpeningTrialBalance = z.infer<typeof insertOpeningTrialBalanceSchema>;

// Define relationships between tables for better querying
export const usersRelations = relations(users, ({ one, many }) => ({
  company: one(companies, { fields: [users.companyId], references: [companies.id] }),
  documents: many(documents),
  filings: many(filings),
  activities: many(activities),
  assistantMessages: many(assistantMessages),
  transactions: many(creditTransactions)
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
  openingTrialBalances: many(openingTrialBalances)
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

// Companies House filings relations
export const companiesHouseFilingsRelations = relations(companiesHouseFilings, ({ one }) => ({
  company: one(companies, { fields: [companiesHouseFilings.companyId], references: [companies.id] })
}));

// Opening trial balance relations
export const openingTrialBalancesRelations = relations(openingTrialBalances, ({ one }) => ({
  company: one(companies, { fields: [openingTrialBalances.companyId], references: [companies.id] }),
  user: one(users, { fields: [openingTrialBalances.userId], references: [users.id] })
}));



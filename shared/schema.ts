import { pgTable, text, serial, integer, boolean, timestamp, jsonb, date, varchar, uniqueIndex, foreignKey, primaryKey, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Users
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  fullName: text("full_name").notNull(),
  role: text("role").notNull().default("director"), // director, accountant, admin
  companyId: integer("company_id").references(() => companies.id),
  profileImage: text("profile_image"),
  credits: integer("credits").notNull().default(50),
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
  dueDate: true,
  data: true,
  documentIds: true,
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
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

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
  outreachCampaigns: many(outreachCampaigns)
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



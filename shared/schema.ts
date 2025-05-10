import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

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

import { 
  users, type User, type InsertUser,
  companies, type Company, type InsertCompany,
  documents, type Document, type InsertDocument,
  filings, type Filing, type InsertFiling,
  activities, type Activity, type InsertActivity,
  assistantMessages, type AssistantMessage, type InsertAssistantMessage,
  creditPackages, type CreditPackage, type InsertCreditPackage,
  filingCosts, type FilingCost, type InsertFilingCost,
  creditTransactions, type CreditTransaction, type InsertCreditTransaction
} from "@shared/schema";
import { eq } from "drizzle-orm";
import { db } from "./db";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, userData: Partial<User>): Promise<User>;
  deleteUser(id: number): Promise<void>;
  
  // Company methods
  getCompany(id: number): Promise<Company | undefined>;
  getAllCompanies(): Promise<Company[]>;
  createCompany(company: InsertCompany): Promise<Company>;
  updateCompany(id: number, companyData: Partial<Company>): Promise<Company>;
  deleteCompany(id: number): Promise<void>;
  
  // Document methods
  getDocument(id: number): Promise<Document | undefined>;
  getAllDocuments(): Promise<Document[]>;
  getDocumentsByCompany(companyId: number): Promise<Document[]>;
  createDocument(document: InsertDocument): Promise<Document>;
  updateDocument(id: number, documentData: Partial<Document>): Promise<Document>;
  deleteDocument(id: number): Promise<void>;
  
  // Filing methods
  getFiling(id: number): Promise<Filing | undefined>;
  getAllFilings(): Promise<Filing[]>;
  getFilingsByCompany(companyId: number): Promise<Filing[]>;
  getFilingsByUser(userId: number): Promise<Filing[]>;
  createFiling(filing: InsertFiling): Promise<Filing>;
  updateFiling(id: number, filingData: Partial<Filing>): Promise<Filing>;
  deleteFiling(id: number): Promise<void>;
  
  // Activity methods
  getActivity(id: number): Promise<Activity | undefined>;
  getAllActivities(): Promise<Activity[]>;
  getActivitiesByCompany(companyId: number): Promise<Activity[]>;
  getActivitiesByUser(userId: number): Promise<Activity[]>;
  createActivity(activity: InsertActivity): Promise<Activity>;
  
  // Assistant message methods
  getAssistantMessage(id: number): Promise<AssistantMessage | undefined>;
  getAssistantMessagesByUser(userId: number): Promise<AssistantMessage[]>;
  createAssistantMessage(message: InsertAssistantMessage): Promise<AssistantMessage>;
  deleteAssistantMessagesByUser(userId: number): Promise<void>;
  
  // Credit package methods
  getCreditPackage(id: number): Promise<CreditPackage | undefined>;
  getAllCreditPackages(): Promise<CreditPackage[]>;
  getActiveCreditPackages(): Promise<CreditPackage[]>;
  createCreditPackage(packageData: InsertCreditPackage): Promise<CreditPackage>;
  updateCreditPackage(id: number, packageData: Partial<CreditPackage>): Promise<CreditPackage>;
  deleteCreditPackage(id: number): Promise<void>;
  
  // Filing cost methods
  getFilingCost(id: number): Promise<FilingCost | undefined>;
  getFilingCostByType(filingType: string): Promise<FilingCost | undefined>;
  getAllFilingCosts(): Promise<FilingCost[]>;
  createFilingCost(costData: InsertFilingCost): Promise<FilingCost>;
  updateFilingCost(id: number, costData: Partial<FilingCost>): Promise<FilingCost>;
  
  // Credit transaction methods
  getCreditTransaction(id: number): Promise<CreditTransaction | undefined>;
  getCreditTransactionsByUser(userId: number): Promise<CreditTransaction[]>;
  createCreditTransaction(transaction: InsertCreditTransaction): Promise<CreditTransaction>;
  
  // User credit methods
  getUserCredits(userId: number): Promise<number>;
  updateUserCredits(userId: number, amount: number): Promise<User>;
  deductCreditsForFiling(userId: number, filingType: string, filingId: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private companies: Map<number, Company>;
  private documents: Map<number, Document>;
  private filings: Map<number, Filing>;
  private activities: Map<number, Activity>;
  private assistantMessages: Map<number, AssistantMessage>;
  private creditPackages: Map<number, CreditPackage>;
  private filingCosts: Map<number, FilingCost>;
  private creditTransactions: Map<number, CreditTransaction>;
  
  private userId: number;
  private companyId: number;
  private documentId: number;
  private filingId: number;
  private activityId: number;
  private messageId: number;
  private packageId: number;
  private costId: number;
  private transactionId: number;

  constructor() {
    this.users = new Map();
    this.companies = new Map();
    this.documents = new Map();
    this.filings = new Map();
    this.activities = new Map();
    this.assistantMessages = new Map();
    this.creditPackages = new Map();
    this.filingCosts = new Map();
    this.creditTransactions = new Map();
    
    this.userId = 1;
    this.companyId = 1;
    this.documentId = 1;
    this.filingId = 1;
    this.activityId = 1;
    this.messageId = 1;
    this.packageId = 1;
    this.costId = 1;
    this.transactionId = 1;
    
    // Add sample data
    this.initSampleData();
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userId++;
    const now = new Date();
    const user: User = { 
      ...insertUser, 
      id,
      credits: insertUser.credits ?? 50,
      role: insertUser.role ?? 'director',
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User> {
    const user = await this.getUser(id);
    
    if (!user) {
      throw new Error(`User with ID ${id} not found`);
    }
    
    const updatedUser = { ...user, ...userData };
    this.users.set(id, updatedUser);
    
    return updatedUser;
  }

  async deleteUser(id: number): Promise<void> {
    this.users.delete(id);
  }

  // Company methods
  async getCompany(id: number): Promise<Company | undefined> {
    return this.companies.get(id);
  }

  async getAllCompanies(): Promise<Company[]> {
    return Array.from(this.companies.values());
  }

  async createCompany(insertCompany: InsertCompany): Promise<Company> {
    const id = this.companyId++;
    const company: Company = { ...insertCompany, id };
    this.companies.set(id, company);
    return company;
  }

  async updateCompany(id: number, companyData: Partial<Company>): Promise<Company> {
    const company = await this.getCompany(id);
    
    if (!company) {
      throw new Error(`Company with ID ${id} not found`);
    }
    
    const updatedCompany = { ...company, ...companyData };
    this.companies.set(id, updatedCompany);
    
    return updatedCompany;
  }

  async deleteCompany(id: number): Promise<void> {
    this.companies.delete(id);
  }

  // Document methods
  async getDocument(id: number): Promise<Document | undefined> {
    return this.documents.get(id);
  }

  async getAllDocuments(): Promise<Document[]> {
    return Array.from(this.documents.values());
  }

  async getDocumentsByCompany(companyId: number): Promise<Document[]> {
    return Array.from(this.documents.values())
      .filter(document => document.companyId === companyId);
  }

  async createDocument(insertDocument: InsertDocument): Promise<Document> {
    const id = this.documentId++;
    const now = new Date();
    const document: Document = { 
      ...insertDocument, 
      id,
      uploadedAt: now,
      processingStatus: 'pending',
      metadata: {}
    };
    this.documents.set(id, document);
    return document;
  }

  async updateDocument(id: number, documentData: Partial<Document>): Promise<Document> {
    const document = await this.getDocument(id);
    
    if (!document) {
      throw new Error(`Document with ID ${id} not found`);
    }
    
    const updatedDocument = { ...document, ...documentData };
    this.documents.set(id, updatedDocument);
    
    return updatedDocument;
  }

  async deleteDocument(id: number): Promise<void> {
    this.documents.delete(id);
  }

  // Filing methods
  async getFiling(id: number): Promise<Filing | undefined> {
    return this.filings.get(id);
  }

  async getAllFilings(): Promise<Filing[]> {
    return Array.from(this.filings.values());
  }

  async getFilingsByCompany(companyId: number): Promise<Filing[]> {
    return Array.from(this.filings.values())
      .filter(filing => filing.companyId === companyId);
  }

  async getFilingsByUser(userId: number): Promise<Filing[]> {
    return Array.from(this.filings.values())
      .filter(filing => filing.userId === userId);
  }

  async createFiling(insertFiling: InsertFiling): Promise<Filing> {
    const id = this.filingId++;
    const now = new Date();
    const filing: Filing = { 
      ...insertFiling, 
      id,
      status: insertFiling.status || 'draft',
      createdAt: now,
      updatedAt: now,
      progress: insertFiling.progress || 0,
      documentIds: insertFiling.documentIds || []
    };
    this.filings.set(id, filing);
    return filing;
  }

  async updateFiling(id: number, filingData: Partial<Filing>): Promise<Filing> {
    const filing = await this.getFiling(id);
    
    if (!filing) {
      throw new Error(`Filing with ID ${id} not found`);
    }
    
    const updatedFiling = { 
      ...filing, 
      ...filingData,
      updatedAt: new Date()
    };
    this.filings.set(id, updatedFiling);
    
    return updatedFiling;
  }

  async deleteFiling(id: number): Promise<void> {
    this.filings.delete(id);
  }

  // Activity methods
  async getActivity(id: number): Promise<Activity | undefined> {
    return this.activities.get(id);
  }

  async getAllActivities(): Promise<Activity[]> {
    return Array.from(this.activities.values());
  }

  async getActivitiesByCompany(companyId: number): Promise<Activity[]> {
    return Array.from(this.activities.values())
      .filter(activity => activity.companyId === companyId);
  }

  async getActivitiesByUser(userId: number): Promise<Activity[]> {
    return Array.from(this.activities.values())
      .filter(activity => activity.userId === userId);
  }

  async createActivity(insertActivity: InsertActivity): Promise<Activity> {
    const id = this.activityId++;
    const now = new Date();
    const activity: Activity = { 
      ...insertActivity, 
      id,
      createdAt: now,
      metadata: insertActivity.metadata || {}
    };
    this.activities.set(id, activity);
    return activity;
  }

  // Assistant message methods
  async getAssistantMessage(id: number): Promise<AssistantMessage | undefined> {
    return this.assistantMessages.get(id);
  }

  async getAssistantMessagesByUser(userId: number): Promise<AssistantMessage[]> {
    return Array.from(this.assistantMessages.values())
      .filter(message => message.userId === userId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  async createAssistantMessage(insertMessage: InsertAssistantMessage): Promise<AssistantMessage> {
    const id = this.messageId++;
    const now = new Date();
    const message: AssistantMessage = { 
      ...insertMessage, 
      id,
      createdAt: now,
      metadata: insertMessage.metadata || {}
    };
    this.assistantMessages.set(id, message);
    return message;
  }

  async deleteAssistantMessagesByUser(userId: number): Promise<void> {
    const userMessages = await this.getAssistantMessagesByUser(userId);
    
    for (const message of userMessages) {
      this.assistantMessages.delete(message.id);
    }
  }

  // Initialize sample data for demonstration
  private initSampleData() {
    // Sample user
    const sampleUser: User = {
      id: this.userId++,
      username: 'sarah.thompson',
      password: 'password123',
      email: 'sarah@example.com',
      fullName: 'Sarah Thompson',
      role: 'director',
      companyId: 1,
      profileImage: 'https://images.unsplash.com/photo-1502685104226-ee32379fefbe?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
      credits: 72
    };
    this.users.set(sampleUser.id, sampleUser);

    // Sample companies
    const companies = [
      {
        id: this.companyId++,
        name: 'Acme Trading Ltd',
        registrationNumber: '12345678',
        registeredAddress: '123 Business Street, London, UK',
        incorporationDate: new Date('2015-06-10'),
        accountingReference: 'December 31',
        status: 'active'
      },
      {
        id: this.companyId++,
        name: 'Bright Innovations Ltd',
        registrationNumber: '87654321',
        registeredAddress: '456 Tech Avenue, Manchester, UK',
        incorporationDate: new Date('2018-03-22'),
        accountingReference: 'March 31',
        status: 'active'
      },
      {
        id: this.companyId++,
        name: 'Global Services Ltd',
        registrationNumber: '11223344',
        registeredAddress: '789 Corporate Road, Birmingham, UK',
        incorporationDate: new Date('2017-09-15'),
        accountingReference: 'September 30',
        status: 'active'
      }
    ];

    for (const company of companies) {
      this.companies.set(company.id, company);
    }

    // Sample filings
    const filings = [
      {
        id: this.filingId++,
        companyId: 1,
        userId: 1,
        type: 'confirmation_statement',
        status: 'not_started',
        dueDate: new Date('2023-08-15'),
        createdAt: new Date('2023-07-01'),
        updatedAt: new Date('2023-07-01'),
        data: {},
        documentIds: [],
        progress: 0
      },
      {
        id: this.filingId++,
        companyId: 2,
        userId: 1,
        type: 'annual_accounts',
        status: 'in_progress',
        dueDate: new Date('2023-09-30'),
        createdAt: new Date('2023-07-15'),
        updatedAt: new Date('2023-07-18'),
        data: {},
        documentIds: [1],
        progress: 60
      },
      {
        id: this.filingId++,
        companyId: 3,
        userId: 1,
        type: 'corporation_tax',
        status: 'not_started',
        dueDate: new Date('2023-11-12'),
        createdAt: new Date('2023-07-20'),
        updatedAt: new Date('2023-07-20'),
        data: {},
        documentIds: [],
        progress: 0
      }
    ];

    for (const filing of filings) {
      this.filings.set(filing.id, filing);
    }

    // Sample documents
    const documents = [
      {
        id: this.documentId++,
        companyId: 2,
        userId: 1,
        name: 'Trial Balance Q2.xlsx',
        type: 'trial_balance',
        size: 1024 * 1024 * 2, // 2MB
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        path: '/uploads/trial-balance-q2.xlsx',
        uploadedAt: new Date('2023-07-15'),
        processedAt: new Date('2023-07-15'),
        processingStatus: 'completed',
        processingError: null,
        metadata: {
          periodEnd: '2023-06-30',
          totalDebits: 1250000,
          totalCredits: 1250000,
          lineItems: 120
        }
      }
    ];

    for (const document of documents) {
      this.documents.set(document.id, document);
    }

    // Sample activities
    const activities = [
      {
        id: this.activityId++,
        userId: 1,
        companyId: 2,
        type: 'document_upload',
        description: 'You uploaded <span class="font-medium">Trial Balance Q2.xlsx</span>',
        createdAt: new Date('2023-07-15T10:42:00'),
        metadata: { documentId: 1 }
      },
      {
        id: this.activityId++,
        userId: 1,
        companyId: null,
        type: 'user_accept',
        description: '<span class="font-medium">James Wilson</span> accepted your invitation to collaborate',
        createdAt: new Date('2023-07-14T14:15:00'),
        metadata: { inviteeId: 2 }
      },
      {
        id: this.activityId++,
        userId: 1,
        companyId: 2,
        type: 'filing_generate',
        description: 'PromptSubmissions AI generated <span class="font-medium">Annual Accounts draft</span> for Bright Innovations Ltd',
        createdAt: new Date('2023-07-13T09:30:00'),
        metadata: { filingId: 2 }
      }
    ];

    for (const activity of activities) {
      this.activities.set(activity.id, activity);
    }
  }
}

// Database implementation of IStorage
export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({ ...userData, role: userData.role || undefined })
      .where(eq(users.id, id))
      .returning();
    
    if (!updatedUser) {
      throw new Error(`User with ID ${id} not found`);
    }
    
    return updatedUser;
  }

  async deleteUser(id: number): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  // Company methods
  async getCompany(id: number): Promise<Company | undefined> {
    const [company] = await db.select().from(companies).where(eq(companies.id, id));
    return company;
  }

  async getAllCompanies(): Promise<Company[]> {
    return await db.select().from(companies);
  }

  async createCompany(insertCompany: InsertCompany): Promise<Company> {
    const [company] = await db
      .insert(companies)
      .values(insertCompany)
      .returning();
    return company;
  }

  async updateCompany(id: number, companyData: Partial<Company>): Promise<Company> {
    const [updatedCompany] = await db
      .update(companies)
      .set(companyData)
      .where(eq(companies.id, id))
      .returning();
    
    if (!updatedCompany) {
      throw new Error(`Company with ID ${id} not found`);
    }
    
    return updatedCompany;
  }

  async deleteCompany(id: number): Promise<void> {
    await db.delete(companies).where(eq(companies.id, id));
  }

  // Document methods
  async getDocument(id: number): Promise<Document | undefined> {
    const [document] = await db.select().from(documents).where(eq(documents.id, id));
    return document;
  }

  async getAllDocuments(): Promise<Document[]> {
    return await db.select().from(documents);
  }

  async getDocumentsByCompany(companyId: number): Promise<Document[]> {
    return await db
      .select()
      .from(documents)
      .where(eq(documents.companyId, companyId));
  }

  async createDocument(insertDocument: InsertDocument): Promise<Document> {
    const [document] = await db
      .insert(documents)
      .values({
        ...insertDocument,
        uploadedAt: new Date(),
        processingStatus: 'pending'
      })
      .returning();
    return document;
  }

  async updateDocument(id: number, documentData: Partial<Document>): Promise<Document> {
    const [updatedDocument] = await db
      .update(documents)
      .set(documentData)
      .where(eq(documents.id, id))
      .returning();
    
    if (!updatedDocument) {
      throw new Error(`Document with ID ${id} not found`);
    }
    
    return updatedDocument;
  }

  async deleteDocument(id: number): Promise<void> {
    await db.delete(documents).where(eq(documents.id, id));
  }

  // Filing methods
  async getFiling(id: number): Promise<Filing | undefined> {
    const [filing] = await db.select().from(filings).where(eq(filings.id, id));
    return filing;
  }

  async getAllFilings(): Promise<Filing[]> {
    return await db.select().from(filings);
  }

  async getFilingsByCompany(companyId: number): Promise<Filing[]> {
    return await db
      .select()
      .from(filings)
      .where(eq(filings.companyId, companyId));
  }

  async getFilingsByUser(userId: number): Promise<Filing[]> {
    return await db
      .select()
      .from(filings)
      .where(eq(filings.userId, userId));
  }

  async createFiling(insertFiling: InsertFiling): Promise<Filing> {
    const now = new Date();
    const [filing] = await db
      .insert(filings)
      .values({
        ...insertFiling,
        status: 'draft',
        createdAt: now,
        updatedAt: now,
        progress: 0
      })
      .returning();
    return filing;
  }

  async updateFiling(id: number, filingData: Partial<Filing>): Promise<Filing> {
    const [updatedFiling] = await db
      .update(filings)
      .set({
        ...filingData,
        updatedAt: new Date()
      })
      .where(eq(filings.id, id))
      .returning();
    
    if (!updatedFiling) {
      throw new Error(`Filing with ID ${id} not found`);
    }
    
    return updatedFiling;
  }

  async deleteFiling(id: number): Promise<void> {
    await db.delete(filings).where(eq(filings.id, id));
  }

  // Activity methods
  async getActivity(id: number): Promise<Activity | undefined> {
    const [activity] = await db.select().from(activities).where(eq(activities.id, id));
    return activity;
  }

  async getAllActivities(): Promise<Activity[]> {
    return await db.select().from(activities);
  }

  async getActivitiesByCompany(companyId: number): Promise<Activity[]> {
    return await db
      .select()
      .from(activities)
      .where(eq(activities.companyId, companyId));
  }

  async getActivitiesByUser(userId: number): Promise<Activity[]> {
    return await db
      .select()
      .from(activities)
      .where(eq(activities.userId, userId));
  }

  async createActivity(insertActivity: InsertActivity): Promise<Activity> {
    const [activity] = await db
      .insert(activities)
      .values({
        ...insertActivity,
        createdAt: new Date()
      })
      .returning();
    return activity;
  }

  // Assistant message methods
  async getAssistantMessage(id: number): Promise<AssistantMessage | undefined> {
    const [message] = await db.select().from(assistantMessages).where(eq(assistantMessages.id, id));
    return message;
  }

  async getAssistantMessagesByUser(userId: number): Promise<AssistantMessage[]> {
    return await db
      .select()
      .from(assistantMessages)
      .where(eq(assistantMessages.userId, userId))
      .orderBy(assistantMessages.createdAt);
  }

  async createAssistantMessage(insertMessage: InsertAssistantMessage): Promise<AssistantMessage> {
    const [message] = await db
      .insert(assistantMessages)
      .values({
        ...insertMessage,
        createdAt: new Date()
      })
      .returning();
    return message;
  }

  async deleteAssistantMessagesByUser(userId: number): Promise<void> {
    await db
      .delete(assistantMessages)
      .where(eq(assistantMessages.userId, userId));
  }
}

// Decide which storage implementation to use
// For now, use MemStorage for development until database is fully set up
export const storage = new MemStorage();

// Uncomment the following line when ready to switch to database storage
// export const storage = new DatabaseStorage();

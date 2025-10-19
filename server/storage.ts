import { 
  users, type User, type InsertUser, type UpsertUser,
  companies, type Company, type InsertCompany,
  documents, type Document, type InsertDocument,
  filings, type Filing, type InsertFiling,
  activities, type Activity, type InsertActivity,
  assistantMessages, type AssistantMessage, type InsertAssistantMessage,
  subscriptionTiers, type SubscriptionTier, type InsertSubscriptionTier,
  userSubscriptions, type UserSubscription, type InsertUserSubscription,
  creditPackages, type CreditPackage, type InsertCreditPackage,
  filingCosts, type FilingCost, type InsertFilingCost,
  creditTransactions, type CreditTransaction, type InsertCreditTransaction,
  priorYearData, type PriorYearData, type InsertPriorYearData,
  comparativePeriods, type ComparativePeriod, type InsertComparativePeriod,
  companiesHouseFilings, type CompaniesHouseFiling, type InsertCompaniesHouseFiling,
  userCompanies, type UserCompany, type InsertUserCompany
} from "@shared/schema";
import { eq, and, or, gte, sql } from "drizzle-orm";
import { db } from "./db";

export interface IStorage {
  // User methods (legacy - for backward compatibility)
  getUser(id: number | string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, userData: Partial<User>): Promise<User>;
  deleteUser(id: number): Promise<void>;
  
  // Replit Auth methods (REQUIRED for Replit Auth)
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Company methods
  getCompany(id: number): Promise<Company | undefined>;
  getAllCompanies(): Promise<Company[]>;
  createCompany(company: InsertCompany): Promise<Company>;
  updateCompany(id: number, companyData: Partial<Company>): Promise<Company>;
  deleteCompany(id: number): Promise<void>;
  
  // Multi-company management methods (Professional/Enterprise tiers)
  getUserCompanies(userId: number): Promise<(UserCompany & { company: Company })[]>;
  getUserCompanyCount(userId: number): Promise<number>;
  addUserCompany(userCompany: InsertUserCompany): Promise<UserCompany>;
  removeUserCompany(userId: number, companyId: number): Promise<void>;
  createCompanyWithUser(company: InsertCompany, userId: number, role?: string): Promise<{ company: Company; userCompany: UserCompany }>;
  
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
  getMostRecentFilingByType(companyId: number, filingType: string): Promise<Filing | undefined>;
  getUpcomingFilings(daysAhead: number): Promise<Filing[]>;
  createFiling(filing: InsertFiling): Promise<Filing>;
  createFilingWithCreditDeduction(filing: InsertFiling, creditCost: number, description: string): Promise<{ filing: Filing; remainingCredits: number }>;
  deductAICredits(userId: number, creditCost: number, description: string, metadata?: Record<string, any>): Promise<number>;
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
  getCreditPackagesForUser(userId: number): Promise<CreditPackage[]>;
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
  
  // Prior year data methods
  getPriorYearData(id: number): Promise<PriorYearData | undefined>;
  getPriorYearDataByCompany(companyId: number): Promise<PriorYearData[]>;
  getPriorYearDataByCompanyAndYear(companyId: number, yearEnding: string): Promise<PriorYearData[]>;
  createPriorYearData(data: InsertPriorYearData): Promise<PriorYearData>;
  updatePriorYearData(id: number, data: Partial<PriorYearData>): Promise<PriorYearData>;
  deletePriorYearData(id: number): Promise<void>;
  
  // Comparative period methods
  getComparativePeriod(id: number): Promise<ComparativePeriod | undefined>;
  getComparativePeriodByCompany(companyId: number): Promise<ComparativePeriod[]>;
  getActiveComparativePeriod(companyId: number): Promise<ComparativePeriod | undefined>;
  createComparativePeriod(data: InsertComparativePeriod): Promise<ComparativePeriod>;
  updateComparativePeriod(id: number, data: Partial<ComparativePeriod>): Promise<ComparativePeriod>;
  deleteComparativePeriod(id: number): Promise<void>;
  
  // Companies House filing methods
  getCompaniesHouseFiling(id: number): Promise<CompaniesHouseFiling | undefined>;
  getCompaniesHouseFilingsByCompany(companyId: number): Promise<CompaniesHouseFiling[]>;
  getCompaniesHouseFilingsByRegistrationNumber(registrationNumber: string): Promise<CompaniesHouseFiling[]>;
  createCompaniesHouseFiling(data: InsertCompaniesHouseFiling): Promise<CompaniesHouseFiling>;
  updateCompaniesHouseFiling(id: number, data: Partial<CompaniesHouseFiling>): Promise<CompaniesHouseFiling>;
  deleteCompaniesHouseFiling(id: number): Promise<void>;
  
  // Subscription tier methods
  getSubscriptionTier(id: number): Promise<SubscriptionTier | undefined>;
  getSubscriptionTierByName(name: string): Promise<SubscriptionTier | undefined>;
  getAllSubscriptionTiers(): Promise<SubscriptionTier[]>;
  getActiveSubscriptionTiers(): Promise<SubscriptionTier[]>;
  createSubscriptionTier(data: InsertSubscriptionTier): Promise<SubscriptionTier>;
  updateSubscriptionTier(id: number, data: Partial<SubscriptionTier>): Promise<SubscriptionTier>;
  deleteSubscriptionTier(id: number): Promise<void>;
  
  // User subscription methods
  getUserSubscription(id: number): Promise<UserSubscription | undefined>;
  getUserSubscriptionsByUser(userId: number): Promise<UserSubscription[]>;
  getActiveUserSubscription(userId: number): Promise<UserSubscription | undefined>;
  createUserSubscription(data: InsertUserSubscription): Promise<UserSubscription>;
  updateUserSubscription(id: number, data: Partial<UserSubscription>): Promise<UserSubscription>;
  cancelUserSubscription(id: number, cancelAtPeriodEnd: boolean): Promise<UserSubscription>;
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
  private priorYearData: Map<number, PriorYearData>;
  private comparativePeriods: Map<number, ComparativePeriod>;
  private companiesHouseFilings: Map<number, CompaniesHouseFiling>;
  
  private userId: number;
  private companyId: number;
  private documentId: number;
  private filingId: number;
  private activityId: number;
  private messageId: number;
  private packageId: number;
  private costId: number;
  private transactionId: number;
  private priorYearId: number;
  private comparativePeriodId: number;
  private companiesHouseFilingId: number;

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
    this.priorYearData = new Map();
    this.comparativePeriods = new Map();
    this.companiesHouseFilings = new Map();
    
    this.userId = 1;
    this.companyId = 1;
    this.documentId = 1;
    this.filingId = 1;
    this.activityId = 1;
    this.messageId = 1;
    this.packageId = 1;
    this.costId = 1;
    this.transactionId = 1;
    this.priorYearId = 1;
    this.comparativePeriodId = 1;
    this.companiesHouseFilingId = 1;
    
    // Add sample data
    this.initSampleData();
  }

  // User methods
  async getUser(id: number | string): Promise<User | undefined> {
    return this.users.get(id as number);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userId++;
    const now = new Date();
    const user: User = { 
      ...insertUser,
      id,
      email: insertUser.email ?? null,
      firstName: null,
      lastName: null,
      profileImageUrl: null,
      username: insertUser.username ?? null,
      password: insertUser.password ?? null,
      fullName: insertUser.fullName ?? null,
      profileImage: insertUser.profileImage ?? null,
      companyId: insertUser.companyId ?? null,
      credits: 50,
      role: insertUser.role ?? 'director',
      createdAt: now,
      updatedAt: now,
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

  // Replit Auth methods (REQUIRED for Replit Auth)
  async upsertUser(userData: UpsertUser): Promise<User> {
    const id = userData.id || this.userId++;
    const existing = await this.getUser(id);
    const now = new Date();
    
    const user: User = {
      id,
      email: userData.email ?? existing?.email ?? null,
      firstName: userData.firstName ?? existing?.firstName ?? null,
      lastName: userData.lastName ?? existing?.lastName ?? null,
      profileImageUrl: userData.profileImageUrl ?? existing?.profileImageUrl ?? null,
      username: userData.username ?? existing?.username ?? null,
      password: userData.password ?? existing?.password ?? null,
      fullName: userData.fullName ?? existing?.fullName ?? null,
      profileImage: userData.profileImage ?? existing?.profileImage ?? null,
      companyId: userData.companyId ?? existing?.companyId ?? null,
      credits: userData.credits ?? existing?.credits ?? 50,
      role: userData.role ?? existing?.role ?? 'director',
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };
    
    this.users.set(id as number, user);
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
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
    const company: Company = { 
      ...insertCompany, 
      id,
      accountingReference: insertCompany.accountingReference ?? null,
      status: insertCompany.status ?? 'active'
    };
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
      processedAt: null,
      processingStatus: 'pending',
      processingError: null,
      metadata: null
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
      dueDate: insertFiling.dueDate ?? null,
      createdAt: now,
      updatedAt: now,
      submitDate: null,
      data: insertFiling.data ?? null,
      documentIds: insertFiling.documentIds ?? null,
      progress: insertFiling.progress || 0
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
      companyId: insertActivity.companyId ?? null,
      createdAt: now,
      metadata: insertActivity.metadata ?? null
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
  
  // Credit package methods
  async getCreditPackage(id: number): Promise<CreditPackage | undefined> {
    return this.creditPackages.get(id);
  }
  
  async getAllCreditPackages(): Promise<CreditPackage[]> {
    return Array.from(this.creditPackages.values());
  }
  
  async getActiveCreditPackages(): Promise<CreditPackage[]> {
    return Array.from(this.creditPackages.values())
      .filter(pkg => pkg.isActive);
  }

  async getCreditPackagesForUser(userId: number): Promise<CreditPackage[]> {
    // Get user's subscription tier
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }

    let userTierLevel = 1; // Default to Basic tier
    if (user.subscriptionTierId) {
      const tier = await this.getSubscriptionTier(user.subscriptionTierId);
      if (tier) {
        userTierLevel = tier.tierLevel;
      }
    }

    // Return active packages available to user's tier
    return Array.from(this.creditPackages.values())
      .filter(pkg => 
        pkg.isActive && 
        (!pkg.minTierLevel || pkg.minTierLevel <= userTierLevel)
      )
      .sort((a, b) => a.creditAmount - b.creditAmount);
  }
  
  async createCreditPackage(packageData: InsertCreditPackage): Promise<CreditPackage> {
    const id = this.packageId++;
    
    const creditPackage: CreditPackage = {
      ...packageData,
      id,
      description: packageData.description ?? null,
      isActive: packageData.isActive ?? true,
      isPopular: packageData.isPopular ?? null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.creditPackages.set(id, creditPackage);
    return creditPackage;
  }
  
  async updateCreditPackage(id: number, packageData: Partial<CreditPackage>): Promise<CreditPackage> {
    const existingPackage = this.creditPackages.get(id);
    
    if (!existingPackage) {
      throw new Error(`Credit package with ID ${id} not found`);
    }
    
    const updatedPackage: CreditPackage = {
      ...existingPackage,
      ...packageData,
      updatedAt: new Date()
    };
    
    this.creditPackages.set(id, updatedPackage);
    return updatedPackage;
  }
  
  async deleteCreditPackage(id: number): Promise<void> {
    this.creditPackages.delete(id);
  }
  
  // Filing cost methods
  async getFilingCost(id: number): Promise<FilingCost | undefined> {
    return this.filingCosts.get(id);
  }
  
  async getFilingCostByType(filingType: string): Promise<FilingCost | undefined> {
    return Array.from(this.filingCosts.values())
      .find(cost => cost.filingType === filingType && cost.isActive);
  }
  
  async getAllFilingCosts(): Promise<FilingCost[]> {
    return Array.from(this.filingCosts.values());
  }
  
  async createFilingCost(costData: InsertFilingCost): Promise<FilingCost> {
    const id = this.costId++;
    
    const filingCost: FilingCost = {
      ...costData,
      id,
      description: costData.description ?? null,
      isActive: costData.isActive ?? true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.filingCosts.set(id, filingCost);
    return filingCost;
  }
  
  async updateFilingCost(id: number, costData: Partial<FilingCost>): Promise<FilingCost> {
    const existingCost = this.filingCosts.get(id);
    
    if (!existingCost) {
      throw new Error(`Filing cost with ID ${id} not found`);
    }
    
    const updatedCost: FilingCost = {
      ...existingCost,
      ...costData,
      updatedAt: new Date()
    };
    
    this.filingCosts.set(id, updatedCost);
    return updatedCost;
  }
  
  // Credit transaction methods
  async getCreditTransaction(id: number): Promise<CreditTransaction | undefined> {
    return this.creditTransactions.get(id);
  }
  
  async getCreditTransactionsByUser(userId: number): Promise<CreditTransaction[]> {
    return Array.from(this.creditTransactions.values())
      .filter(transaction => transaction.userId === userId);
  }
  
  async createCreditTransaction(transaction: InsertCreditTransaction): Promise<CreditTransaction> {
    const id = this.transactionId++;
    
    const creditTransaction: CreditTransaction = {
      ...transaction,
      id,
      metadata: transaction.metadata ?? null,
      filingId: transaction.filingId ?? null,
      packageId: transaction.packageId ?? null,
      stripePaymentId: transaction.stripePaymentId ?? null,
      createdAt: new Date()
    };
    
    this.creditTransactions.set(id, creditTransaction);
    return creditTransaction;
  }
  
  // User credit methods
  async getUserCredits(userId: number): Promise<number> {
    const user = await this.getUser(userId);
    
    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }
    
    return user.credits;
  }
  
  async updateUserCredits(userId: number, amount: number): Promise<User> {
    const user = await this.getUser(userId);
    
    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }
    
    const updatedCredits = user.credits + amount;
    
    if (updatedCredits < 0) {
      throw new Error(`User ${userId} does not have enough credits`);
    }
    
    const updatedUser = await this.updateUser(userId, { credits: updatedCredits });
    
    // Create a transaction record
    await this.createCreditTransaction({
      userId,
      type: amount > 0 ? 'purchase' : 'usage',
      amount,
      balance: updatedCredits,
      description: amount > 0 
        ? `Added ${amount} credits to account` 
        : `Used ${Math.abs(amount)} credits for service`,
      metadata: {}
    });
    
    return updatedUser;
  }
  
  async deductCreditsForFiling(userId: number, filingType: string, filingId: number): Promise<boolean> {
    // Get the filing cost
    const filingCost = await this.getFilingCostByType(filingType);
    
    if (!filingCost) {
      throw new Error(`Filing cost for type ${filingType} not found`);
    }
    
    const user = await this.getUser(userId);
    
    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }
    
    if (user.credits < filingCost.creditCost) {
      return false; // Not enough credits
    }
    
    // Deduct credits and create transaction
    await this.updateUserCredits(userId, -filingCost.creditCost);
    
    // Create transaction with filing reference
    await this.createCreditTransaction({
      userId,
      type: 'usage',
      amount: -filingCost.creditCost,
      balance: user.credits - filingCost.creditCost,
      description: `Used ${filingCost.creditCost} credits for ${filingType} filing`,
      filingId,
      metadata: { 
        filingType,
        actualCost: filingCost.actualCost
      }
    });
    
    return true;
  }

  // Initialize sample data for demonstration
  private initSampleData() {
    // Sample user
    const now = new Date();
    const sampleUser: User = {
      id: this.userId++,
      email: 'sarah@example.com',
      firstName: null,
      lastName: null,
      profileImageUrl: null,
      username: 'sarah.thompson',
      password: 'password123',
      fullName: 'Sarah Thompson',
      profileImage: 'https://images.unsplash.com/photo-1502685104226-ee32379fefbe?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
      role: 'director',
      companyId: 1,
      credits: 72,
      createdAt: now,
      updatedAt: now
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
        submitDate: null,
        data: null,
        documentIds: null,
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
        submitDate: null,
        data: null,
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
        submitDate: null,
        data: null,
        documentIds: null,
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
    
    // Competitive UK Market Pricing - Updated Jan 2025
    const creditPackages = [
      // STAGE 1: Simple filings (Dormant & Micro-entity companies)
      {
        id: this.packageId++,
        name: 'Starter Pack',
        description: 'Perfect for dormant companies and micro-entities',
        price: 19999, // £199.99 in pence
        creditAmount: 200, // 2 dormant accounts (£100 each) or 2 confirmation statements (£70 each) + Corporation Tax (£70)
        isActive: true,
        isPopular: false,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: this.packageId++,
        name: 'Professional Pack',
        description: 'Most popular for growing businesses with regular filing needs',
        price: 39999, // £399.99 in pence
        creditAmount: 400, // 1 annual account (£250) + 2 corporation tax (£70 each) + VAT filing (£45) + confirmation statement (£70)
        isActive: true,
        isPopular: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      
      // STAGE 2: Moderate complexity (Small companies with P&L)
      {
        id: this.packageId++,
        name: 'Business Pack',
        description: 'For established businesses with multiple companies and complex filings',
        price: 79999, // £799.99 in pence
        creditAmount: 800, // Multiple companies with various filing types
        isActive: true,
        isPopular: false,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: this.packageId++,
        name: 'Enterprise Pack',
        description: 'For accounting firms and large operations with high-volume needs',
        price: 149999, // £1,499.99 in pence
        creditAmount: 1500, // High volume for accounting firms
        isActive: true,
        isPopular: false,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      
      // STAGE 3: Complex filings (Future - Full statutory & audited accounts)
      {
        id: this.packageId++,
        name: 'Premium Enterprise',
        description: 'White-label solution for accounting firms with unlimited filings',
        price: 299999, // £2,999.99 in pence
        creditAmount: 3000, // Enterprise-level volume
        isActive: false, // Will be activated in Stage 3
        isPopular: false,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: this.packageId++,
        name: 'White-Label Partner',
        description: 'Custom solution for large accounting firms and software integrators',
        price: 599999, // £5,999.99 in pence
        creditAmount: 6000, // Maximum volume for partners
        isActive: false, // Will be activated in Stage 3
        isPopular: false,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    
    for (const packageData of creditPackages) {
      this.creditPackages.set(packageData.id, packageData);
    }
    
    // Staged Rollout Filing Costs
    const filingCosts = [
      // STAGE 1: Simple filings (Launch immediately)
      {
        id: this.costId++,
        filingType: 'dormant_accounts',
        creditCost: 100, // £100 per filing - competitive with market
        actualCost: 0,
        description: 'Dormant company accounts - balance sheet only',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: this.costId++,
        filingType: 'micro_entity_accounts',
        creditCost: 140, // £140 per filing - competitive for micro-entities
        actualCost: 0,
        description: 'Micro-entity accounts - simplified balance sheet (up to £632k turnover)',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: this.costId++,
        filingType: 'confirmation_statement',
        creditCost: 100, // £100 per filing (standardized pricing)
        actualCost: 3400, // £34.00 in pence (Companies House fee)
        description: 'Annual confirmation statement submission to Companies House',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      
      // STAGE 2: Moderate complexity (6-12 months later)
      {
        id: this.costId++,
        filingType: 'small_company_accounts',
        creditCost: 220, // £220 per filing - competitive for small company accounts
        actualCost: 0,
        description: 'Small company accounts with P&L preparation (up to £10.2m turnover)',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: this.costId++,
        filingType: 'annual_accounts',
        creditCost: 200, // £200 per filing (standardized pricing)
        actualCost: 0,
        description: 'Annual accounts with P&L requirements (post-April 2027 compliant)',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: this.costId++,
        filingType: 'corporation_tax',
        creditCost: 150, // £150 per filing (standardized pricing)
        actualCost: 0,
        description: 'Corporation tax return (CT600) preparation and submission',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: this.costId++,
        filingType: 'vat_filing',
        creditCost: 45, // £45 per filing - competitive for VAT returns
        actualCost: 0,
        description: 'VAT return filing',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      
      // STAGE 3: Complex filings (12+ months later)
      {
        id: this.costId++,
        filingType: 'full_statutory_accounts',
        creditCost: 350, // £350 per filing - competitive for full statutory accounts
        actualCost: 0,
        description: 'Full statutory accounts with directors report (medium/large companies)',
        isActive: false, // Will be activated in Stage 3
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: this.costId++,
        filingType: 'audited_accounts',
        creditCost: 500, // £500 per filing - premium for audited accounts
        actualCost: 0,
        description: 'Audited accounts requiring multi-team collaboration',
        isActive: false, // Will be activated in Stage 3
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: this.costId++,
        filingType: 'group_accounts',
        creditCost: 750, // £750 per filing - premium for group accounts
        actualCost: 0,
        description: 'Group accounts for parent companies',
        isActive: false, // Will be activated in Stage 3
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    
    for (const costData of filingCosts) {
      this.filingCosts.set(costData.id, costData);
    }
  }

  // Prior year data methods
  async getPriorYearData(id: number): Promise<PriorYearData | undefined> {
    return this.priorYearData.get(id);
  }

  async getPriorYearDataByCompany(companyId: number): Promise<PriorYearData[]> {
    return Array.from(this.priorYearData.values()).filter(data => data.companyId === companyId);
  }

  async getPriorYearDataByCompanyAndYear(companyId: number, yearEnding: string): Promise<PriorYearData[]> {
    return Array.from(this.priorYearData.values()).filter(
      data => data.companyId === companyId && data.yearEnding === yearEnding
    );
  }

  async createPriorYearData(insertData: InsertPriorYearData): Promise<PriorYearData> {
    const id = this.priorYearId++;
    const now = new Date();
    const priorYearData: PriorYearData = {
      ...insertData,
      id,
      sourceReference: insertData.sourceReference ?? null,
      isVerified: insertData.isVerified ?? false,
      createdAt: now,
      updatedAt: now
    };
    this.priorYearData.set(id, priorYearData);
    return priorYearData;
  }

  async updatePriorYearData(id: number, updateData: Partial<PriorYearData>): Promise<PriorYearData> {
    const existing = await this.getPriorYearData(id);
    if (!existing) {
      throw new Error(`Prior year data with id ${id} not found`);
    }
    const updated = { ...existing, ...updateData, updatedAt: new Date() };
    this.priorYearData.set(id, updated);
    return updated;
  }

  async deletePriorYearData(id: number): Promise<void> {
    this.priorYearData.delete(id);
  }

  // Comparative period methods
  async getComparativePeriod(id: number): Promise<ComparativePeriod | undefined> {
    return this.comparativePeriods.get(id);
  }

  async getComparativePeriodByCompany(companyId: number): Promise<ComparativePeriod[]> {
    return Array.from(this.comparativePeriods.values()).filter(period => period.companyId === companyId);
  }

  async getActiveComparativePeriod(companyId: number): Promise<ComparativePeriod | undefined> {
    return Array.from(this.comparativePeriods.values()).find(
      period => period.companyId === companyId && period.isActive
    );
  }

  async createComparativePeriod(insertData: InsertComparativePeriod): Promise<ComparativePeriod> {
    const id = this.comparativePeriodId++;
    const now = new Date();
    const comparativePeriod: ComparativePeriod = {
      ...insertData,
      id,
      isActive: insertData.isActive ?? false,
      layoutTemplate: insertData.layoutTemplate ?? 'default',
      mappingRules: insertData.mappingRules ?? null,
      createdAt: now,
      updatedAt: now
    };
    this.comparativePeriods.set(id, comparativePeriod);
    return comparativePeriod;
  }

  async updateComparativePeriod(id: number, updateData: Partial<ComparativePeriod>): Promise<ComparativePeriod> {
    const existing = await this.getComparativePeriod(id);
    if (!existing) {
      throw new Error(`Comparative period with id ${id} not found`);
    }
    const updated = { ...existing, ...updateData, updatedAt: new Date() };
    this.comparativePeriods.set(id, updated);
    return updated;
  }

  async deleteComparativePeriod(id: number): Promise<void> {
    this.comparativePeriods.delete(id);
  }

  // Companies House filing methods
  async getCompaniesHouseFiling(id: number): Promise<CompaniesHouseFiling | undefined> {
    return this.companiesHouseFilings.get(id);
  }

  async getCompaniesHouseFilingsByCompany(companyId: number): Promise<CompaniesHouseFiling[]> {
    return Array.from(this.companiesHouseFilings.values()).filter(filing => filing.companyId === companyId);
  }

  async getCompaniesHouseFilingsByRegistrationNumber(registrationNumber: string): Promise<CompaniesHouseFiling[]> {
    return Array.from(this.companiesHouseFilings.values()).filter(
      filing => filing.registrationNumber === registrationNumber
    );
  }

  async createCompaniesHouseFiling(insertData: InsertCompaniesHouseFiling): Promise<CompaniesHouseFiling> {
    const id = this.companiesHouseFilingId++;
    const now = new Date();
    const companiesHouseFiling: CompaniesHouseFiling = {
      ...insertData,
      id,
      actionDate: insertData.actionDate ?? null,
      paperFiled: insertData.paperFiled ?? false,
      filingHistoryData: insertData.filingHistoryData ?? null,
      accountsData: insertData.accountsData ?? null,
      isImported: insertData.isImported ?? false,
      createdAt: now,
      importedAt: insertData.isImported ? now : null
    };
    this.companiesHouseFilings.set(id, companiesHouseFiling);
    return companiesHouseFiling;
  }

  async updateCompaniesHouseFiling(id: number, updateData: Partial<CompaniesHouseFiling>): Promise<CompaniesHouseFiling> {
    const existing = await this.getCompaniesHouseFiling(id);
    if (!existing) {
      throw new Error(`Companies House filing with id ${id} not found`);
    }
    const updated = { ...existing, ...updateData };
    this.companiesHouseFilings.set(id, updated);
    return updated;
  }

  async deleteCompaniesHouseFiling(id: number): Promise<void> {
    this.companiesHouseFilings.delete(id);
  }
}

// Database implementation of IStorage
export class DatabaseStorage implements IStorage {
  // User methods (supporting both legacy and Replit Auth)
  async getUser(id: number | string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, Number(id)));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
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

  // Replit Auth methods (REQUIRED for Replit Auth)
  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
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

  // Multi-company management methods (Professional/Enterprise tiers)
  async getUserCompanies(userId: number): Promise<(UserCompany & { company: Company })[]> {
    const results = await db
      .select({
        id: userCompanies.id,
        userId: userCompanies.userId,
        companyId: userCompanies.companyId,
        role: userCompanies.role,
        isActive: userCompanies.isActive,
        createdAt: userCompanies.createdAt,
        company: companies
      })
      .from(userCompanies)
      .innerJoin(companies, eq(userCompanies.companyId, companies.id))
      .where(and(
        eq(userCompanies.userId, userId),
        eq(userCompanies.isActive, true)
      ));
    
    return results;
  }

  async getUserCompanyCount(userId: number): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(userCompanies)
      .where(and(
        eq(userCompanies.userId, userId),
        eq(userCompanies.isActive, true)
      ));
    
    return Number(result[0]?.count || 0);
  }

  async addUserCompany(insertUserCompany: InsertUserCompany): Promise<UserCompany> {
    const [userCompany] = await db
      .insert(userCompanies)
      .values(insertUserCompany)
      .returning();
    
    return userCompany;
  }

  async removeUserCompany(userId: number, companyId: number): Promise<void> {
    await db
      .update(userCompanies)
      .set({ isActive: false })
      .where(and(
        eq(userCompanies.userId, userId),
        eq(userCompanies.companyId, companyId)
      ));
  }

  async createCompanyWithUser(insertCompany: InsertCompany, userId: number, role: string = 'owner'): Promise<{ company: Company; userCompany: UserCompany }> {
    // Use a transaction to ensure both records are created atomically
    return await db.transaction(async (tx) => {
      // Create the company
      const [company] = await tx
        .insert(companies)
        .values(insertCompany)
        .returning();
      
      // Link the company to the user
      const [userCompany] = await tx
        .insert(userCompanies)
        .values({
          userId,
          companyId: company.id,
          role,
          isActive: true
        })
        .returning();
      
      return { company, userCompany };
    });
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

  async getMostRecentFilingByType(companyId: number, filingType: string): Promise<Filing | undefined> {
    const [filing] = await db
      .select()
      .from(filings)
      .where(
        and(
          eq(filings.companyId, companyId),
          eq(filings.type, filingType)
        )
      )
      .orderBy(sql`${filings.createdAt} DESC`)
      .limit(1);
    return filing;
  }

  async getUpcomingFilings(daysAhead: number): Promise<Filing[]> {
    const now = new Date();
    const futureDate = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);
    
    return await db
      .select()
      .from(filings)
      .where(
        and(
          gte(filings.dueDate, now),
          sql`${filings.dueDate} <= ${futureDate}`
        )
      );
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

  async createFilingWithCreditDeduction(
    insertFiling: InsertFiling, 
    creditCost: number, 
    description: string
  ): Promise<{ filing: Filing; remainingCredits: number }> {
    // Wrap credit deduction, filing creation, and transaction logging in a single transaction
    return await db.transaction(async (tx) => {
      const userId = insertFiling.userId;

      // 1. Atomically deduct credits (fails if insufficient balance)
      const [updatedUser] = await tx
        .update(users)
        .set({ credits: sql`${users.credits} - ${creditCost}` })
        .where(
          and(
            eq(users.id, userId),
            gte(users.credits, creditCost)
          )
        )
        .returning();

      if (!updatedUser) {
        throw new Error(`User ${userId} does not have enough credits (required: ${creditCost})`);
      }

      // 2. Create filing record
      const now = new Date();
      const [filing] = await tx
        .insert(filings)
        .values({
          ...insertFiling,
          status: insertFiling.status || 'draft',
          createdAt: now,
          updatedAt: now,
          progress: 0
        })
        .returning();

      // 3. Create credit transaction record
      await tx.insert(creditTransactions).values({
        userId,
        type: 'filing_deduction',
        amount: -creditCost,
        balance: updatedUser.credits,
        description,
        filingId: filing.id,
        metadata: { filingType: filing.type },
        createdAt: now
      });

      // Return both filing and remaining credits
      return {
        filing,
        remainingCredits: updatedUser.credits
      };
    });
  }

  /**
   * Atomically deduct credits for AI generation (prevents race conditions)
   * Returns the remaining credit balance after deduction
   */
  async deductAICredits(
    userId: number,
    creditCost: number,
    description: string,
    metadata?: Record<string, any>
  ): Promise<number> {
    // Wrap credit deduction and transaction logging in a single atomic transaction
    return await db.transaction(async (tx) => {
      // 1. Atomically deduct credits using SQL to prevent race conditions
      const [updatedUser] = await tx
        .update(users)
        .set({ credits: sql`${users.credits} - ${creditCost}` })
        .where(
          and(
            eq(users.id, userId),
            gte(users.credits, creditCost)
          )
        )
        .returning();

      if (!updatedUser) {
        throw new Error(`User ${userId} does not have enough credits (required: ${creditCost})`);
      }

      // 2. Create credit transaction record
      const now = new Date();
      await tx.insert(creditTransactions).values({
        userId,
        type: 'ai_generation',
        amount: -creditCost,
        balance: updatedUser.credits,
        description,
        metadata,
        createdAt: now
      });

      // Return remaining credits
      return updatedUser.credits;
    });
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

  // Credit package methods
  async getCreditPackage(id: number): Promise<CreditPackage | undefined> {
    const [pkg] = await db.select().from(creditPackages).where(eq(creditPackages.id, id));
    return pkg;
  }

  async getAllCreditPackages(): Promise<CreditPackage[]> {
    return await db.select().from(creditPackages);
  }

  async getActiveCreditPackages(): Promise<CreditPackage[]> {
    return await db
      .select()
      .from(creditPackages)
      .where(eq(creditPackages.isActive, true));
  }

  async getCreditPackagesForUser(userId: number): Promise<CreditPackage[]> {
    // Get user's subscription tier
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }

    let userTierLevel = 1; // Default to Basic tier
    if (user.subscriptionTierId) {
      const tier = await this.getSubscriptionTier(user.subscriptionTierId);
      if (tier) {
        userTierLevel = tier.tierLevel;
      }
    }

    // Return all active packages where minTierLevel is null OR minTierLevel <= user's tier level
    // This means: Basic users see packages with null or 1, Professional see null/1/2, Enterprise see all
    return await db
      .select()
      .from(creditPackages)
      .where(
        and(
          eq(creditPackages.isActive, true),
          or(
            sql`${creditPackages.minTierLevel} IS NULL`,
            sql`${creditPackages.minTierLevel} <= ${userTierLevel}`
          )
        )
      )
      .orderBy(creditPackages.creditAmount);
  }

  async createCreditPackage(packageData: InsertCreditPackage): Promise<CreditPackage> {
    const [pkg] = await db
      .insert(creditPackages)
      .values({
        ...packageData,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    return pkg;
  }

  async updateCreditPackage(id: number, packageData: Partial<CreditPackage>): Promise<CreditPackage> {
    const [updatedPackage] = await db
      .update(creditPackages)
      .set({
        ...packageData,
        updatedAt: new Date()
      })
      .where(eq(creditPackages.id, id))
      .returning();
    
    if (!updatedPackage) {
      throw new Error(`Credit package with ID ${id} not found`);
    }
    
    return updatedPackage;
  }

  async deleteCreditPackage(id: number): Promise<void> {
    await db.delete(creditPackages).where(eq(creditPackages.id, id));
  }

  // Filing cost methods
  async getFilingCost(id: number): Promise<FilingCost | undefined> {
    const [cost] = await db.select().from(filingCosts).where(eq(filingCosts.id, id));
    return cost;
  }

  async getFilingCostByType(filingType: string): Promise<FilingCost | undefined> {
    const [cost] = await db
      .select()
      .from(filingCosts)
      .where(eq(filingCosts.filingType, filingType));
    return cost;
  }

  async getAllFilingCosts(): Promise<FilingCost[]> {
    return await db.select().from(filingCosts);
  }

  async createFilingCost(costData: InsertFilingCost): Promise<FilingCost> {
    const [cost] = await db
      .insert(filingCosts)
      .values({
        ...costData,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    return cost;
  }

  async updateFilingCost(id: number, costData: Partial<FilingCost>): Promise<FilingCost> {
    const [updatedCost] = await db
      .update(filingCosts)
      .set({
        ...costData,
        updatedAt: new Date()
      })
      .where(eq(filingCosts.id, id))
      .returning();
    
    if (!updatedCost) {
      throw new Error(`Filing cost with ID ${id} not found`);
    }
    
    return updatedCost;
  }

  // Credit transaction methods
  async getCreditTransaction(id: number): Promise<CreditTransaction | undefined> {
    const [transaction] = await db.select().from(creditTransactions).where(eq(creditTransactions.id, id));
    return transaction;
  }

  async getCreditTransactionsByUser(userId: number): Promise<CreditTransaction[]> {
    return await db
      .select()
      .from(creditTransactions)
      .where(eq(creditTransactions.userId, userId));
  }

  async createCreditTransaction(transaction: InsertCreditTransaction): Promise<CreditTransaction> {
    const [newTransaction] = await db
      .insert(creditTransactions)
      .values({
        ...transaction,
        createdAt: new Date()
      })
      .returning();
    return newTransaction;
  }

  // User credit methods
  async getUserCredits(userId: number): Promise<number> {
    const user = await this.getUser(userId);
    
    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }
    
    return user.credits;
  }

  async updateUserCredits(userId: number, amount: number, description?: string, metadata?: any, filingId?: number): Promise<User> {
    // Use database transaction with conditional update for atomicity and race prevention
    return await db.transaction(async (tx) => {
      // For positive amounts (adding credits), no need to check minimum
      // For negative amounts (deducting credits), use guarded update
      const [updatedUser] = await tx
        .update(users)
        .set({ credits: sql`${users.credits} + ${amount}` })
        .where(
          amount >= 0 
            ? eq(users.id, userId)
            : and(
                eq(users.id, userId),
                gte(users.credits, Math.abs(amount))
              )
        )
        .returning();
      
      if (!updatedUser) {
        throw new Error(
          amount >= 0 
            ? `User with ID ${userId} not found`
            : `User ${userId} does not have enough credits`
        );
      }
      
      // Create a transaction record
      await tx.insert(creditTransactions).values({
        userId,
        type: amount > 0 ? 'purchase' : 'usage',
        amount,
        balance: updatedUser.credits,
        description: description || (amount > 0 
          ? `Added ${amount} credits to account` 
          : `Used ${Math.abs(amount)} credits for service`),
        filingId: filingId ?? null,
        metadata: metadata ?? {},
        createdAt: new Date()
      });
      
      return updatedUser;
    });
  }

  async deductCreditsForFiling(userId: number, filingType: string, filingId: number): Promise<boolean> {
    // Use database transaction with guarded update to prevent race conditions
    return await db.transaction(async (tx) => {
      const [filingCost] = await tx
        .select()
        .from(filingCosts)
        .where(eq(filingCosts.filingType, filingType));
      
      if (!filingCost) {
        throw new Error(`Filing cost for type ${filingType} not found`);
      }
      
      // Atomic guarded update: only succeeds if user has enough credits
      const [updatedUser] = await tx
        .update(users)
        .set({ credits: sql`${users.credits} - ${filingCost.creditCost}` })
        .where(and(
          eq(users.id, userId),
          gte(users.credits, filingCost.creditCost)
        ))
        .returning();
      
      // If update failed, user doesn't exist or has insufficient credits
      if (!updatedUser) {
        return false;
      }
      
      // Create single transaction record with actual balance
      await tx.insert(creditTransactions).values({
        userId,
        type: 'usage',
        amount: -filingCost.creditCost,
        balance: updatedUser.credits,
        description: `Used ${filingCost.creditCost} credits for ${filingType} filing`,
        filingId,
        metadata: { 
          filingType,
          actualCost: filingCost.actualCost
        },
        createdAt: new Date()
      });
      
      return true;
    });
  }

  // Prior year data methods
  async getPriorYearData(id: number): Promise<PriorYearData | undefined> {
    const [data] = await db.select().from(priorYearData).where(eq(priorYearData.id, id));
    return data;
  }

  async getPriorYearDataByCompany(companyId: number): Promise<PriorYearData[]> {
    return await db
      .select()
      .from(priorYearData)
      .where(eq(priorYearData.companyId, companyId));
  }

  async getPriorYearDataByCompanyAndYear(companyId: number, yearEnding: string): Promise<PriorYearData[]> {
    return await db
      .select()
      .from(priorYearData)
      .where(and(
        eq(priorYearData.companyId, companyId),
        eq(priorYearData.yearEnding, yearEnding)
      ));
  }

  async createPriorYearData(data: InsertPriorYearData): Promise<PriorYearData> {
    const [newData] = await db
      .insert(priorYearData)
      .values({
        ...data,
        createdAt: new Date()
      })
      .returning();
    return newData;
  }

  async updatePriorYearData(id: number, data: Partial<PriorYearData>): Promise<PriorYearData> {
    const [updatedData] = await db
      .update(priorYearData)
      .set(data)
      .where(eq(priorYearData.id, id))
      .returning();
    
    if (!updatedData) {
      throw new Error(`Prior year data with ID ${id} not found`);
    }
    
    return updatedData;
  }

  async deletePriorYearData(id: number): Promise<void> {
    await db.delete(priorYearData).where(eq(priorYearData.id, id));
  }

  // Comparative period methods
  async getComparativePeriod(id: number): Promise<ComparativePeriod | undefined> {
    const [period] = await db.select().from(comparativePeriods).where(eq(comparativePeriods.id, id));
    return period;
  }

  async getComparativePeriodByCompany(companyId: number): Promise<ComparativePeriod[]> {
    return await db
      .select()
      .from(comparativePeriods)
      .where(eq(comparativePeriods.companyId, companyId));
  }

  async getActiveComparativePeriod(companyId: number): Promise<ComparativePeriod | undefined> {
    const [period] = await db
      .select()
      .from(comparativePeriods)
      .where(and(
        eq(comparativePeriods.companyId, companyId),
        eq(comparativePeriods.isActive, true)
      ));
    return period;
  }

  async createComparativePeriod(data: InsertComparativePeriod): Promise<ComparativePeriod> {
    const [period] = await db
      .insert(comparativePeriods)
      .values({
        ...data,
        createdAt: new Date()
      })
      .returning();
    return period;
  }

  async updateComparativePeriod(id: number, data: Partial<ComparativePeriod>): Promise<ComparativePeriod> {
    const [updatedPeriod] = await db
      .update(comparativePeriods)
      .set(data)
      .where(eq(comparativePeriods.id, id))
      .returning();
    
    if (!updatedPeriod) {
      throw new Error(`Comparative period with ID ${id} not found`);
    }
    
    return updatedPeriod;
  }

  async deleteComparativePeriod(id: number): Promise<void> {
    await db.delete(comparativePeriods).where(eq(comparativePeriods.id, id));
  }

  // Companies House filing methods
  async getCompaniesHouseFiling(id: number): Promise<CompaniesHouseFiling | undefined> {
    const [filing] = await db.select().from(companiesHouseFilings).where(eq(companiesHouseFilings.id, id));
    return filing;
  }

  async getCompaniesHouseFilingsByCompany(companyId: number): Promise<CompaniesHouseFiling[]> {
    return await db
      .select()
      .from(companiesHouseFilings)
      .where(eq(companiesHouseFilings.companyId, companyId));
  }

  async getCompaniesHouseFilingsByRegistrationNumber(registrationNumber: string): Promise<CompaniesHouseFiling[]> {
    return await db
      .select()
      .from(companiesHouseFilings)
      .where(eq(companiesHouseFilings.registrationNumber, registrationNumber));
  }

  async createCompaniesHouseFiling(data: InsertCompaniesHouseFiling): Promise<CompaniesHouseFiling> {
    const [filing] = await db
      .insert(companiesHouseFilings)
      .values({
        ...data,
        createdAt: new Date()
      })
      .returning();
    return filing;
  }

  async updateCompaniesHouseFiling(id: number, data: Partial<CompaniesHouseFiling>): Promise<CompaniesHouseFiling> {
    const [updatedFiling] = await db
      .update(companiesHouseFilings)
      .set(data)
      .where(eq(companiesHouseFilings.id, id))
      .returning();
    
    if (!updatedFiling) {
      throw new Error(`Companies House filing with ID ${id} not found`);
    }
    
    return updatedFiling;
  }

  async deleteCompaniesHouseFiling(id: number): Promise<void> {
    await db.delete(companiesHouseFilings).where(eq(companiesHouseFilings.id, id));
  }

  // Subscription tier methods
  async getSubscriptionTier(id: number): Promise<SubscriptionTier | undefined> {
    const [tier] = await db.select().from(subscriptionTiers).where(eq(subscriptionTiers.id, id));
    return tier;
  }

  async getSubscriptionTierByName(name: string): Promise<SubscriptionTier | undefined> {
    const [tier] = await db.select().from(subscriptionTiers).where(eq(subscriptionTiers.name, name));
    return tier;
  }

  async getAllSubscriptionTiers(): Promise<SubscriptionTier[]> {
    return await db.select().from(subscriptionTiers).orderBy(subscriptionTiers.sortOrder);
  }

  async getActiveSubscriptionTiers(): Promise<SubscriptionTier[]> {
    return await db
      .select()
      .from(subscriptionTiers)
      .where(eq(subscriptionTiers.isActive, true))
      .orderBy(subscriptionTiers.sortOrder);
  }

  async createSubscriptionTier(data: InsertSubscriptionTier): Promise<SubscriptionTier> {
    const [tier] = await db
      .insert(subscriptionTiers)
      .values({
        ...data,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    return tier;
  }

  async updateSubscriptionTier(id: number, data: Partial<SubscriptionTier>): Promise<SubscriptionTier> {
    const [updatedTier] = await db
      .update(subscriptionTiers)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(eq(subscriptionTiers.id, id))
      .returning();
    
    if (!updatedTier) {
      throw new Error(`Subscription tier with ID ${id} not found`);
    }
    
    return updatedTier;
  }

  async deleteSubscriptionTier(id: number): Promise<void> {
    await db.delete(subscriptionTiers).where(eq(subscriptionTiers.id, id));
  }

  // User subscription methods
  async getUserSubscription(id: number): Promise<UserSubscription | undefined> {
    const [subscription] = await db.select().from(userSubscriptions).where(eq(userSubscriptions.id, id));
    return subscription;
  }

  async getUserSubscriptionsByUser(userId: number): Promise<UserSubscription[]> {
    return await db
      .select()
      .from(userSubscriptions)
      .where(eq(userSubscriptions.userId, userId))
      .orderBy(userSubscriptions.createdAt);
  }

  async getActiveUserSubscription(userId: number): Promise<UserSubscription | undefined> {
    const [subscription] = await db
      .select()
      .from(userSubscriptions)
      .where(and(
        eq(userSubscriptions.userId, userId),
        eq(userSubscriptions.status, 'active')
      ));
    return subscription;
  }

  async createUserSubscription(data: InsertUserSubscription): Promise<UserSubscription> {
    const [subscription] = await db
      .insert(userSubscriptions)
      .values({
        ...data,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    return subscription;
  }

  async updateUserSubscription(id: number, data: Partial<UserSubscription>): Promise<UserSubscription> {
    const [updatedSubscription] = await db
      .update(userSubscriptions)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(eq(userSubscriptions.id, id))
      .returning();
    
    if (!updatedSubscription) {
      throw new Error(`User subscription with ID ${id} not found`);
    }
    
    return updatedSubscription;
  }

  async cancelUserSubscription(id: number, cancelAtPeriodEnd: boolean): Promise<UserSubscription> {
    const updateData: Partial<UserSubscription> = {
      cancelAtPeriodEnd,
      updatedAt: new Date()
    };
    
    // If immediate cancellation, set status to cancelled
    if (!cancelAtPeriodEnd) {
      updateData.status = 'cancelled';
    }
    
    const [cancelledSubscription] = await db
      .update(userSubscriptions)
      .set(updateData)
      .where(eq(userSubscriptions.id, id))
      .returning();
    
    if (!cancelledSubscription) {
      throw new Error(`User subscription with ID ${id} not found`);
    }
    
    return cancelledSubscription;
  }
}

// Decide which storage implementation to use
// Use DatabaseStorage for production-ready persistence
export const storage = new DatabaseStorage();

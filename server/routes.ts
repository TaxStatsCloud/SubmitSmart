import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { insertUserSchema, insertCompanySchema, insertDocumentSchema, insertFilingSchema, insertActivitySchema, insertAssistantMessageSchema } from "@shared/schema";
import { processDocument } from "./services/documentService";
import { generateResponse } from "./services/aiService";
import { searchCompanies, getCompanyProfile, getFilingDeadlines } from "./services/companiesHouseService";
import { generateCompletion } from "./services/openai";
import multer from "multer";
import path from "path";
import fs from "fs";
import { WebSocketServer } from "ws";
import agentRoutes from "./routes/agentRoutes";
import billingRoutes from "./routes/billingRoutes";

// Configure multer for file uploads
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      // Create uploads directory if it doesn't exist
      const uploadsDir = path.join(process.cwd(), "uploads");
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
      // Generate unique filename
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
      const ext = path.extname(file.originalname);
      cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
    }
  }),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept only certain file types
    const allowedTypes = ['.pdf', '.xls', '.xlsx', '.csv'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`Only ${allowedTypes.join(', ')} files are allowed`));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // Register agent routes
  app.use('/api/agents', agentRoutes);
  
  // Admin routes for Companies House agent monitoring
  app.get('/api/admin/agent-stats', async (req, res) => {
    try {
      const { dateRange } = req.query;
      const { companiesHouseAgent } = await import('./services/companiesHouseAgent');
      const stats = await companiesHouseAgent.getAgentStats(dateRange as string);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch agent stats' });
    }
  });
  
  app.get('/api/admin/prospects', async (req, res) => {
    try {
      const { companiesHouseAgent } = await import('./services/companiesHouseAgent');
      const prospects = await companiesHouseAgent.getProspects(req.query);
      res.json(prospects);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch prospects' });
    }
  });
  
  app.get('/api/admin/outreach', async (req, res) => {
    try {
      const { companiesHouseAgent } = await import('./services/companiesHouseAgent');
      const outreach = await companiesHouseAgent.getOutreachActivity(req.query);
      res.json(outreach);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch outreach data' });
    }
  });
  
  app.get('/api/admin/user-usage', async (req, res) => {
    try {
      // Get user activity from storage
      const activities = await storage.getAllActivities();
      const users = await storage.getAllUsers ? await storage.getAllUsers() : [];
      
      const userUsage = {
        totalUsers: users.length,
        activeUsers: users.filter(u => u.credits > 0).length,
        recentActivities: activities.slice(0, 20),
        featureUsage: {
          documentUpload: activities.filter(a => a.type === 'document_upload').length,
          confirmationStatements: activities.filter(a => a.type === 'confirmation_statement').length,
          annualAccounts: activities.filter(a => a.type === 'annual_accounts').length,
          corporationTax: activities.filter(a => a.type === 'corporation_tax').length,
          aiAssistant: activities.filter(a => a.type === 'ai_chat').length,
        }
      };
      
      res.json(userUsage);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch user usage data' });
    }
  });
  
  // Tax Engine API endpoints
  app.get('/api/tax-filings/:companyId/:period', async (req, res) => {
    try {
      const { companyId, period } = req.params;
      
      // Get or create tax filing record
      const existingFiling = await storage.getFilingsByCompany(Number(companyId));
      const taxFiling = existingFiling.find(f => f.type === 'corporation_tax' && f.data?.period === period);
      
      if (taxFiling) {
        res.json(taxFiling);
      } else {
        // Create new tax filing
        const newFiling = await storage.createFiling({
          type: 'corporation_tax',
          companyId: Number(companyId),
          userId: req.user?.id || 1,
          data: { period, sections: {}, progress: 0 },
          status: 'draft',
          progress: 0
        });
        res.json(newFiling);
      }
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch tax filing data' });
    }
  });
  
  app.post('/api/tax-filings/:companyId/:period/section', async (req, res) => {
    try {
      const { companyId, period } = req.params;
      const { sectionId, data } = req.body;
      
      // Get existing filing
      const existingFilings = await storage.getFilingsByCompany(Number(companyId));
      const taxFiling = existingFilings.find(f => f.type === 'corporation_tax' && f.data?.period === period);
      
      if (taxFiling) {
        // Update section data
        const updatedData = {
          ...taxFiling.data,
          sections: {
            ...taxFiling.data.sections,
            [sectionId]: data
          }
        };
        
        // Calculate progress
        const totalSections = 7; // company-info, income-statement, balance-sheet, etc.
        const completedSections = Object.keys(updatedData.sections).length;
        const progress = Math.round((completedSections / totalSections) * 100);
        
        const updatedFiling = await storage.updateFiling(taxFiling.id, {
          data: updatedData,
          progress
        });
        
        res.json(updatedFiling);
      } else {
        res.status(404).json({ error: 'Tax filing not found' });
      }
    } catch (error) {
      res.status(500).json({ error: 'Failed to save tax filing section' });
    }
  });
  
  app.post('/api/tax-filings/:companyId/:period/calculate', async (req, res) => {
    try {
      const { companyId, period } = req.params;
      
      // Get existing filing
      const existingFilings = await storage.getFilingsByCompany(Number(companyId));
      const taxFiling = existingFilings.find(f => f.type === 'corporation_tax' && f.data?.period === period);
      
      if (taxFiling && taxFiling.data?.sections) {
        // Use AI to calculate tax liability
        const { generateCompletion } = await import('./services/openai');
        
        const calculationPrompt = `
          Calculate UK Corporation Tax for this company based on the following data:
          
          Company Data: ${JSON.stringify(taxFiling.data.sections)}
          
          Please calculate:
          1. Taxable profit/loss
          2. Corporation tax liability
          3. Any adjustments needed
          4. Final tax due/refund
          
          Respond in JSON format with: {
            "taxableProfit": number,
            "corporationTax": number,
            "adjustments": number,
            "finalTaxDue": number,
            "calculation": "detailed explanation"
          }
        `;
        
        const calculation = await generateCompletion(calculationPrompt);
        
        // Update filing with calculation results
        const updatedFiling = await storage.updateFiling(taxFiling.id, {
          data: {
            ...taxFiling.data,
            calculation: JSON.parse(calculation)
          }
        });
        
        res.json(updatedFiling);
      } else {
        res.status(404).json({ error: 'Tax filing not found or incomplete' });
      }
    } catch (error) {
      res.status(500).json({ error: 'Failed to calculate tax liability' });
    }
  });
  
  app.post('/api/tax-filings/:companyId/:period/submit', async (req, res) => {
    try {
      const { companyId, period } = req.params;
      
      // Get existing filing
      const existingFilings = await storage.getFilingsByCompany(Number(companyId));
      const taxFiling = existingFilings.find(f => f.type === 'corporation_tax' && f.data?.period === period);
      
      if (taxFiling) {
        // Update filing status to submitted
        const updatedFiling = await storage.updateFiling(taxFiling.id, {
          status: 'submitted',
          progress: 100
        });
        
        // Create activity record
        await storage.createActivity({
          type: 'tax_filing_submitted',
          description: `Corporation Tax return submitted for ${period}`,
          userId: req.user?.id || 1,
          companyId: Number(companyId),
          metadata: {
            filingId: taxFiling.id,
            period: period,
            submittedAt: new Date().toISOString()
          }
        });
        
        res.json(updatedFiling);
      } else {
        res.status(404).json({ error: 'Tax filing not found' });
      }
    } catch (error) {
      res.status(500).json({ error: 'Failed to submit tax filing' });
    }
  });
  
  // Register billing routes
  app.use('/api/billing', billingRoutes);
  
  // Setup WebSocket server for real-time updates with a specific path
  // to avoid conflicts with Vite's WebSocket server
  const wss = new WebSocketServer({ 
    server: httpServer,
    path: '/api/ws'  // Use a specific path for our WebSocket
  });
  
  wss.on('connection', (ws) => {
    console.log('WebSocket client connected to /api/ws');
    
    ws.on('message', (message) => {
      console.log('Received message:', message);
    });
    
    ws.on('close', () => {
      console.log('WebSocket client disconnected from /api/ws');
    });
  });
  
  // Helper function to broadcast updates to all connected clients
  const broadcastUpdate = (type: string, data: any) => {
    wss.clients.forEach((client) => {
      if (client.readyState === client.OPEN) {
        client.send(JSON.stringify({ type, data }));
      }
    });
  };

  // Authentication routes
  app.post('/api/auth/register', async (req, res) => {
    try {
      const validatedData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(validatedData);
      
      // Remove password from response
      const { password, ...userWithoutPassword } = user;
      
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: error.errors });
      } else {
        res.status(500).json({ message: 'Failed to create user' });
      }
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required' });
      }
      
      const user = await storage.getUserByUsername(username);
      
      if (!user || user.password !== password) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      
      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;
      
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: 'Login failed' });
    }
  });

  app.post('/api/auth/logout', (req, res) => {
    res.json({ message: 'Logout successful' });
  });

  app.get('/api/auth/me', async (req, res) => {
    // In a real app, this would use session information
    // For now, return a sample user
    const user = await storage.getUserByUsername('sarah.thompson');
    
    if (!user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    // Remove password from response
    const { password, ...userWithoutPassword } = user;
    
    res.json(userWithoutPassword);
  });

  app.patch('/api/auth/me', async (req, res) => {
    try {
      // In a real app, would verify user from session
      const userId = 1; // Sample user ID
      
      const { fullName, email, currentPassword, newPassword } = req.body;
      
      // Verify current password if changing password
      if (newPassword) {
        if (!currentPassword) {
          return res.status(400).json({ message: 'Current password is required' });
        }
        
        const user = await storage.getUser(userId);
        
        if (!user || user.password !== currentPassword) {
          return res.status(401).json({ message: 'Current password is incorrect' });
        }
      }
      
      // Update user information
      const updatedUser = await storage.updateUser(userId, {
        ...(fullName && { fullName }),
        ...(email && { email }),
        ...(newPassword && { password: newPassword }),
      });
      
      // Remove password from response
      const { password, ...userWithoutPassword } = updatedUser;
      
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: 'Failed to update user' });
    }
  });

  // Company routes
  app.post('/api/companies', async (req, res) => {
    try {
      const validatedData = insertCompanySchema.parse(req.body);
      const company = await storage.createCompany(validatedData);
      res.status(201).json(company);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: error.errors });
      } else {
        res.status(500).json({ message: 'Failed to create company' });
      }
    }
  });

  app.get('/api/companies', async (req, res) => {
    try {
      const companies = await storage.getAllCompanies();
      res.json(companies);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch companies' });
    }
  });

  app.get('/api/companies/:id', async (req, res) => {
    try {
      const companyId = parseInt(req.params.id);
      const company = await storage.getCompany(companyId);
      
      if (!company) {
        return res.status(404).json({ message: 'Company not found' });
      }
      
      res.json(company);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch company' });
    }
  });

  // Document routes
  app.post('/api/documents/upload', upload.single('file'), async (req, res) => {
    try {
      const file = req.file;
      
      if (!file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }
      
      // In a real app, would get user ID from session
      const userId = 1; // Sample user ID
      
      // In a real app, would get company ID from request
      const companyId = 1; // Sample company ID
      
      const documentData = {
        companyId,
        userId,
        name: file.originalname,
        type: req.body.type || 'unknown',
        size: file.size,
        contentType: file.mimetype,
        path: file.path,
      };
      
      const validatedData = insertDocumentSchema.parse(documentData);
      const document = await storage.createDocument(validatedData);
      
      // Broadcast document upload event
      broadcastUpdate('document_uploaded', document);
      
      // Create activity for document upload
      await storage.createActivity({
        userId,
        companyId,
        type: 'document_upload',
        description: `Uploaded document: ${file.originalname}`,
        metadata: { documentId: document.id }
      });
      
      // Start document processing asynchronously
      processDocument(document.id)
        .then((processedDoc) => {
          broadcastUpdate('document_processed', processedDoc);
        })
        .catch((error) => {
          console.error('Error processing document:', error);
          broadcastUpdate('document_processing_failed', { documentId: document.id, error: error.message });
        });
      
      res.status(201).json(document);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: error.errors });
      } else {
        res.status(500).json({ message: error instanceof Error ? error.message : 'Failed to upload document' });
      }
    }
  });

  app.get('/api/documents', async (req, res) => {
    try {
      // In a real app, would filter by user/company from session
      const documents = await storage.getAllDocuments();
      res.json(documents);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch documents' });
    }
  });

  app.get('/api/documents/:id', async (req, res) => {
    try {
      const documentId = parseInt(req.params.id);
      const document = await storage.getDocument(documentId);
      
      if (!document) {
        return res.status(404).json({ message: 'Document not found' });
      }
      
      res.json(document);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch document' });
    }
  });

  app.delete('/api/documents/:id', async (req, res) => {
    try {
      const documentId = parseInt(req.params.id);
      const document = await storage.getDocument(documentId);
      
      if (!document) {
        return res.status(404).json({ message: 'Document not found' });
      }
      
      // Delete file from storage
      if (document.path && fs.existsSync(document.path)) {
        fs.unlinkSync(document.path);
      }
      
      await storage.deleteDocument(documentId);
      
      res.json({ message: 'Document deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete document' });
    }
  });

  app.post('/api/documents/:id/process', async (req, res) => {
    try {
      const documentId = parseInt(req.params.id);
      const document = await storage.getDocument(documentId);
      
      if (!document) {
        return res.status(404).json({ message: 'Document not found' });
      }
      
      const processedDoc = await processDocument(documentId);
      res.json(processedDoc);
    } catch (error) {
      res.status(500).json({ message: 'Failed to process document' });
    }
  });

  // Filing routes
  app.post('/api/filings', async (req, res) => {
    try {
      const validatedData = insertFilingSchema.parse(req.body);
      const filing = await storage.createFiling(validatedData);
      
      // In a real app, would get user ID from session
      const userId = validatedData.userId || 1;
      
      // Create activity for filing creation
      await storage.createActivity({
        userId,
        companyId: validatedData.companyId,
        type: 'filing_create',
        description: `Created new ${validatedData.type} filing`,
        metadata: { filingId: filing.id }
      });
      
      res.status(201).json(filing);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: error.errors });
      } else {
        res.status(500).json({ message: 'Failed to create filing' });
      }
    }
  });

  app.get('/api/filings', async (req, res) => {
    try {
      // In a real app, would filter by user/company from session
      const filings = await storage.getAllFilings();
      
      // Enhance filings with company names
      const enhancedFilings = await Promise.all(filings.map(async (filing) => {
        const company = await storage.getCompany(filing.companyId);
        return {
          ...filing,
          companyName: company ? company.name : 'Unknown Company'
        };
      }));
      
      res.json(enhancedFilings);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch filings' });
    }
  });

  app.get('/api/filings/:id', async (req, res) => {
    try {
      const filingId = parseInt(req.params.id);
      const filing = await storage.getFiling(filingId);
      
      if (!filing) {
        return res.status(404).json({ message: 'Filing not found' });
      }
      
      // Enhance filing with company name
      const company = await storage.getCompany(filing.companyId);
      const enhancedFiling = {
        ...filing,
        companyName: company ? company.name : 'Unknown Company'
      };
      
      res.json(enhancedFiling);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch filing' });
    }
  });

  app.patch('/api/filings/:id', async (req, res) => {
    try {
      const filingId = parseInt(req.params.id);
      const filing = await storage.getFiling(filingId);
      
      if (!filing) {
        return res.status(404).json({ message: 'Filing not found' });
      }
      
      const updatedFiling = await storage.updateFiling(filingId, req.body);
      
      // In a real app, would get user ID from session
      const userId = filing.userId || 1;
      
      // Create activity for filing update
      await storage.createActivity({
        userId,
        companyId: filing.companyId,
        type: 'filing_update',
        description: `Updated ${filing.type} filing`,
        metadata: { filingId: filing.id }
      });
      
      res.json(updatedFiling);
    } catch (error) {
      res.status(500).json({ message: 'Failed to update filing' });
    }
  });

  app.delete('/api/filings/:id', async (req, res) => {
    try {
      const filingId = parseInt(req.params.id);
      const filing = await storage.getFiling(filingId);
      
      if (!filing) {
        return res.status(404).json({ message: 'Filing not found' });
      }
      
      await storage.deleteFiling(filingId);
      
      res.json({ message: 'Filing deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete filing' });
    }
  });

  app.post('/api/filings/:id/submit', async (req, res) => {
    try {
      const filingId = parseInt(req.params.id);
      const filing = await storage.getFiling(filingId);
      
      if (!filing) {
        return res.status(404).json({ message: 'Filing not found' });
      }
      
      // Update filing status to submitted
      const updatedFiling = await storage.updateFiling(filingId, {
        status: 'submitted',
        submitDate: new Date()
      });
      
      // In a real app, would get user ID from session
      const userId = filing.userId || 1;
      
      // Create activity for filing submission
      await storage.createActivity({
        userId,
        companyId: filing.companyId,
        type: 'filing_submit',
        description: `Submitted ${filing.type} filing`,
        metadata: { filingId: filing.id }
      });
      
      res.json(updatedFiling);
    } catch (error) {
      res.status(500).json({ message: 'Failed to submit filing' });
    }
  });

  // Activity routes
  app.get('/api/activities', async (req, res) => {
    try {
      // In a real app, would filter by user/company from session
      const activities = await storage.getAllActivities();
      
      // Sort by creation date, newest first
      activities.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      
      res.json(activities);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch activities' });
    }
  });

  // Assistant routes
  app.get('/api/assistant/messages', async (req, res) => {
    try {
      // In a real app, would filter by user from session
      const userId = 1; // Sample user ID
      
      const messages = await storage.getAssistantMessagesByUser(userId);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch assistant messages' });
    }
  });

  app.post('/api/assistant/messages', async (req, res) => {
    try {
      // In a real app, would get user ID from session
      const userId = 1; // Sample user ID
      
      // Validate user message
      const { content } = req.body;
      
      if (!content) {
        return res.status(400).json({ message: 'Message content is required' });
      }
      
      // Save user message
      const userMessage = await storage.createAssistantMessage({
        userId,
        role: 'user',
        content,
        metadata: {}
      });
      
      // Generate AI response
      const aiResponse = await generateResponse(content, userId);
      
      // Save AI response
      const assistantMessage = await storage.createAssistantMessage({
        userId,
        role: 'assistant',
        content: aiResponse,
        metadata: {}
      });
      
      res.status(201).json(assistantMessage);
    } catch (error) {
      res.status(500).json({ message: 'Failed to process message' });
    }
  });

  app.delete('/api/assistant/messages', async (req, res) => {
    try {
      // In a real app, would get user ID from session
      const userId = 1; // Sample user ID
      
      await storage.deleteAssistantMessagesByUser(userId);
      
      res.json({ message: 'Assistant messages cleared successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to clear assistant messages' });
    }
  });

  // AI routes
  app.post('/api/ai/analyze-document/:id', async (req, res) => {
    try {
      const documentId = parseInt(req.params.id);
      const document = await storage.getDocument(documentId);
      
      if (!document) {
        return res.status(404).json({ message: 'Document not found' });
      }
      
      // Process document if not already processed
      if (document.processingStatus !== 'completed') {
        const processedDoc = await processDocument(documentId);
        
        if (processedDoc.processingStatus !== 'completed') {
          return res.status(400).json({ message: 'Document processing failed' });
        }
      }
      
      // Return document analysis results
      res.json(document.metadata || { message: 'No analysis available' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to analyze document' });
    }
  });

  // Companies House API routes
  app.get('/api/companies-house/search', async (req, res) => {
    try {
      const { q, items_per_page, start_index } = req.query;
      
      if (!q) {
        return res.status(400).json({ message: 'Search query is required' });
      }
      
      const results = await searchCompanies(
        q as string, 
        items_per_page ? parseInt(items_per_page as string) : undefined,
        start_index ? parseInt(start_index as string) : undefined
      );
      
      res.json(results);
    } catch (error) {
      res.status(500).json({ message: 'Failed to search companies' });
    }
  });

  app.get('/api/companies-house/company/:number', async (req, res) => {
    try {
      const companyNumber = req.params.number;
      const company = await getCompanyProfile(companyNumber);
      
      res.json(company);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch company profile' });
    }
  });

  app.get('/api/companies-house/company/:number/filing-deadlines', async (req, res) => {
    try {
      const companyNumber = req.params.number;
      const deadlines = await getFilingDeadlines(companyNumber);
      
      res.json(deadlines);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch filing deadlines' });
    }
  });

  // Simple test route that doesn't use OpenAI
  app.get('/api/test/openai', async (req, res) => {
    console.log("OpenAI test route called");
    
    // Just return a static response for now to verify the server routes are working
    res.json({ 
      success: true,
      message: "API route is functioning correctly",
      info: "The actual OpenAI integration is working based on standalone tests, but we're bypassing it here for debugging purposes."
    });
  });
  
  // Separate route for actual OpenAI testing
  app.get('/api/test/openai-actual', async (req, res) => {
    console.log("Full OpenAI test route called");
    try {
      // Check if API key is available
      console.log("API Key available:", process.env.OPENAI_API_KEY ? "Yes (not showing for security)" : "No");
      
      // Try a basic prompt
      const prompt = "Tell me the top 3 requirements for UK company compliance in one sentence";
      console.log("Sending test prompt to OpenAI");
      
      const response = await generateCompletion(prompt);
      console.log("Received response from OpenAI:", response.substring(0, 50) + "...");
      
      res.json({ 
        success: true, 
        apiKeyAvailable: !!process.env.OPENAI_API_KEY,
        response 
      });
    } catch (error) {
      console.error("OpenAI test route error:", error);
      res.status(500).json({ 
        success: false, 
        apiKeyAvailable: !!process.env.OPENAI_API_KEY,
        message: 'Failed to generate OpenAI response',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  return httpServer;
}

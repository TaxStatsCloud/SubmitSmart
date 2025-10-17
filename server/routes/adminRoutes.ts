/**
 * Admin Management Routes
 * 
 * Provides comprehensive admin API endpoints for:
 * - User management (CRUD operations, role changes)
 * - Subscription and order management
 * - Analytics and reporting
 */

import { Router } from 'express';
import { isAdmin } from '../auth';
import { storage } from '../storage';
import { z } from 'zod';
import { hashPassword } from '../auth';
import { db } from '../db';
import { users, creditTransactions, creditPackages, filings, companies } from '@shared/schema';
import { eq, desc, and, gte, lte, sql } from 'drizzle-orm';

const router = Router();

// Apply admin authentication to all routes
router.use(isAdmin);

/**
 * USER MANAGEMENT ROUTES
 */

// Get all users with pagination and filtering
router.get('/users', async (req, res) => {
  try {
    const { role, limit = '100', offset = '0' } = req.query;
    
    let query = db.query.users.findMany({
      orderBy: [desc(users.createdAt)],
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
    });

    const allUsers = await query;
    
    // Filter by role if specified
    const filteredUsers = role 
      ? allUsers.filter(u => u.role === role)
      : allUsers;
    
    // Remove password from response
    const usersWithoutPassword = filteredUsers.map(({ password, ...user }) => user);
    
    res.json(usersWithoutPassword);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get user by ID
router.get('/users/:id', async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const user = await storage.getUser(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const { password, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Create new user
router.post('/users', async (req, res) => {
  try {
    const { email, password: rawPassword, fullName, role = 'director' } = z.object({
      email: z.string().email(),
      password: z.string().min(6),
      fullName: z.string().optional(),
      role: z.enum(['director', 'accountant', 'admin']).optional(),
    }).parse(req.body);
    
    const existingUser = await storage.getUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: 'Email already exists' });
    }
    
    const hashedPassword = await hashPassword(rawPassword);
    const user = await storage.createUser({
      email,
      password: hashedPassword,
      fullName: fullName || email.split('@')[0],
      role,
    });
    
    const { password, ...userWithoutPassword } = user;
    res.status(201).json(userWithoutPassword);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// Update user
router.patch('/users/:id', async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const updates = z.object({
      fullName: z.string().optional(),
      role: z.enum(['director', 'accountant', 'admin']).optional(),
      credits: z.number().optional(),
    }).parse(req.body);
    
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    await db.update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, userId));
    
    const updatedUser = await storage.getUser(userId);
    if (!updatedUser) {
      return res.status(500).json({ error: 'Failed to fetch updated user' });
    }
    
    const { password, ...userWithoutPassword } = updatedUser;
    res.json(userWithoutPassword);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Delete user
router.delete('/users/:id', async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    
    // Prevent deleting the current admin user
    if (req.user?.id === userId) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }
    
    await db.delete(users).where(eq(users.id, userId));
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

/**
 * SUBSCRIPTION & ORDER MANAGEMENT ROUTES
 */

// Get all credit transactions (orders)
router.get('/transactions', async (req, res) => {
  try {
    const { userId, type, limit = '100', offset = '0' } = req.query;
    
    const transactions = await db.query.creditTransactions.findMany({
      orderBy: [desc(creditTransactions.createdAt)],
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
    });
    
    // Filter by userId if specified
    const filteredByUser = userId 
      ? transactions.filter(t => t.userId === parseInt(userId as string))
      : transactions;
    
    // Filter by type if specified
    const filteredTransactions = type
      ? filteredByUser.filter(t => t.type === type)
      : filteredByUser;
    
    res.json(filteredTransactions);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

// Get transaction statistics
router.get('/transactions/stats', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const allTransactions = await db.query.creditTransactions.findMany();
    
    // Filter by date range if specified
    let filtered = allTransactions;
    if (startDate) {
      filtered = filtered.filter(t => new Date(t.createdAt) >= new Date(startDate as string));
    }
    if (endDate) {
      filtered = filtered.filter(t => new Date(t.createdAt) <= new Date(endDate as string));
    }
    
    const totalRevenue = filtered
      .filter(t => t.type === 'purchase')
      .reduce((sum, t) => sum + (t.amount || 0), 0);
    
    const totalCreditsIssued = filtered
      .filter(t => t.type === 'purchase')
      .reduce((sum, t) => sum + (t.credits || 0), 0);
    
    const totalCreditsUsed = filtered
      .filter(t => t.type === 'deduction')
      .reduce((sum, t) => sum + Math.abs(t.credits || 0), 0);
    
    res.json({
      totalTransactions: filtered.length,
      totalRevenue,
      totalCreditsIssued,
      totalCreditsUsed,
      averageOrderValue: filtered.filter(t => t.type === 'purchase').length > 0
        ? totalRevenue / filtered.filter(t => t.type === 'purchase').length
        : 0,
    });
  } catch (error) {
    console.error('Error fetching transaction stats:', error);
    res.status(500).json({ error: 'Failed to fetch transaction stats' });
  }
});

// Get credit packages
router.get('/packages', async (req, res) => {
  try {
    const packages = await storage.getActiveCreditPackages();
    res.json(packages);
  } catch (error) {
    console.error('Error fetching packages:', error);
    res.status(500).json({ error: 'Failed to fetch packages' });
  }
});

// Create or update credit package
router.post('/packages', async (req, res) => {
  try {
    const packageData = z.object({
      id: z.number().optional(),
      name: z.string(),
      credits: z.number(),
      price: z.number(),
      description: z.string().optional(),
      isActive: z.boolean().optional(),
    }).parse(req.body);
    
    if (packageData.id) {
      // Update existing package
      await db.update(creditPackages)
        .set(packageData)
        .where(eq(creditPackages.id, packageData.id));
      
      const updated = await db.query.creditPackages.findFirst({
        where: eq(creditPackages.id, packageData.id),
      });
      res.json(updated);
    } else {
      // Create new package
      const [created] = await db.insert(creditPackages)
        .values(packageData)
        .returning();
      res.status(201).json(created);
    }
  } catch (error) {
    console.error('Error managing package:', error);
    res.status(500).json({ error: 'Failed to manage package' });
  }
});

/**
 * ANALYTICS ROUTES
 */

// Get comprehensive analytics dashboard data
router.get('/analytics/dashboard', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    // User analytics
    const allUsers = await db.query.users.findMany();
    const totalUsers = allUsers.length;
    const usersByRole = {
      director: allUsers.filter(u => u.role === 'director').length,
      accountant: allUsers.filter(u => u.role === 'accountant').length,
      admin: allUsers.filter(u => u.role === 'admin').length,
    };
    
    // Filing analytics
    const allFilings = await db.query.filings.findMany();
    let filings = allFilings;
    if (startDate) {
      filings = filings.filter(f => new Date(f.createdAt) >= new Date(startDate as string));
    }
    if (endDate) {
      filings = filings.filter(f => new Date(f.createdAt) <= new Date(endDate as string));
    }
    
    const filingsByStatus = {
      draft: filings.filter(f => f.status === 'draft').length,
      in_progress: filings.filter(f => f.status === 'in_progress').length,
      awaiting_approval: filings.filter(f => f.status === 'awaiting_approval').length,
      approved: filings.filter(f => f.status === 'approved').length,
      submitted: filings.filter(f => f.status === 'submitted').length,
      rejected: filings.filter(f => f.status === 'rejected').length,
    };
    
    const filingsByType = {
      confirmation_statement: filings.filter(f => f.type === 'confirmation_statement').length,
      annual_accounts: filings.filter(f => f.type === 'annual_accounts').length,
      corporation_tax: filings.filter(f => f.type === 'corporation_tax').length,
    };
    
    // Transaction analytics
    const allTransactions = await db.query.creditTransactions.findMany();
    let transactions = allTransactions;
    if (startDate) {
      transactions = transactions.filter(t => new Date(t.createdAt) >= new Date(startDate as string));
    }
    if (endDate) {
      transactions = transactions.filter(t => new Date(t.createdAt) <= new Date(endDate as string));
    }
    
    const revenue = transactions
      .filter(t => t.type === 'purchase')
      .reduce((sum, t) => sum + (t.amount || 0), 0);
    
    // Company analytics
    const totalCompanies = (await db.query.companies.findMany()).length;
    
    res.json({
      users: {
        total: totalUsers,
        byRole: usersByRole,
      },
      filings: {
        total: filings.length,
        byStatus: filingsByStatus,
        byType: filingsByType,
      },
      transactions: {
        total: transactions.length,
        revenue,
        averageValue: transactions.filter(t => t.type === 'purchase').length > 0
          ? revenue / transactions.filter(t => t.type === 'purchase').length
          : 0,
      },
      companies: {
        total: totalCompanies,
      },
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// Get user activity analytics
router.get('/analytics/user-activity', async (req, res) => {
  try {
    const { days = '30' } = req.query;
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(days as string));
    
    const users = await db.query.users.findMany({
      where: gte(users.createdAt, daysAgo),
    });
    
    // Group by date
    const activityByDate = users.reduce((acc, user) => {
      const date = user.createdAt.toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    res.json({
      newUsers: users.length,
      activityByDate,
    });
  } catch (error) {
    console.error('Error fetching user activity:', error);
    res.status(500).json({ error: 'Failed to fetch user activity' });
  }
});

// Get revenue analytics
router.get('/analytics/revenue', async (req, res) => {
  try {
    const { days = '30' } = req.query;
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(days as string));
    
    const transactions = await db.query.creditTransactions.findMany({
      where: and(
        gte(creditTransactions.createdAt, daysAgo),
        eq(creditTransactions.type, 'purchase')
      ),
    });
    
    // Group by date
    const revenueByDate = transactions.reduce((acc, t) => {
      const date = t.createdAt.toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + (t.amount || 0);
      return acc;
    }, {} as Record<string, number>);
    
    const totalRevenue = transactions.reduce((sum, t) => sum + (t.amount || 0), 0);
    
    res.json({
      totalRevenue,
      transactions: transactions.length,
      revenueByDate,
      averageOrderValue: transactions.length > 0 ? totalRevenue / transactions.length : 0,
    });
  } catch (error) {
    console.error('Error fetching revenue analytics:', error);
    res.status(500).json({ error: 'Failed to fetch revenue analytics' });
  }
});

// Get filing analytics
router.get('/analytics/filings', async (req, res) => {
  try {
    const { days = '30' } = req.query;
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(days as string));
    
    const allFilings = await db.query.filings.findMany({
      where: gte(filings.createdAt, daysAgo),
    });
    
    res.json({
      total: allFilings.length,
      byType: {
        confirmation_statement: allFilings.filter(f => f.type === 'confirmation_statement').length,
        annual_accounts: allFilings.filter(f => f.type === 'annual_accounts').length,
        corporation_tax: allFilings.filter(f => f.type === 'corporation_tax').length,
      },
      byStatus: {
        draft: allFilings.filter(f => f.status === 'draft').length,
        in_progress: allFilings.filter(f => f.status === 'in_progress').length,
        submitted: allFilings.filter(f => f.status === 'submitted').length,
        approved: allFilings.filter(f => f.status === 'approved').length,
      },
      submissionRate: allFilings.length > 0 
        ? (allFilings.filter(f => f.status === 'submitted').length / allFilings.length) * 100
        : 0,
    });
  } catch (error) {
    console.error('Error fetching filing analytics:', error);
    res.status(500).json({ error: 'Failed to fetch filing analytics' });
  }
});

export default router;

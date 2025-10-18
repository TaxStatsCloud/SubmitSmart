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
import { users, creditTransactions, creditPackages, filings, companies, auditLogs, insertSubscriptionTierSchema } from '@shared/schema';
import { eq, desc, and, gte, lte, sql } from 'drizzle-orm';
import { notificationService } from '../services/notificationService';

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

/**
 * PRODUCTION MONITORING ANALYTICS ROUTES
 */

// Get error trends and analytics
router.get('/analytics/production/errors', async (req, res) => {
  try {
    const { days = '7' } = req.query;
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(days as string));
    
    const errorLogs = await db.query.auditLogs.findMany({
      where: and(
        eq(auditLogs.action, 'error'),
        gte(auditLogs.createdAt, daysAgo)
      ),
      orderBy: [desc(auditLogs.createdAt)],
    });
    
    // Group by severity
    const bySeverity = {
      critical: errorLogs.filter(e => (e.metadata as any)?.severity === 'critical').length,
      high: errorLogs.filter(e => (e.metadata as any)?.severity === 'high').length,
      medium: errorLogs.filter(e => (e.metadata as any)?.severity === 'medium').length,
      low: errorLogs.filter(e => (e.metadata as any)?.severity === 'low').length,
    };
    
    // Group by date
    const errorsByDate = errorLogs.reduce((acc, log) => {
      const date = log.createdAt.toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    // Get top error messages
    const errorMessages = errorLogs.reduce((acc, log) => {
      const message = (log.metadata as any)?.message || 'Unknown error';
      acc[message] = (acc[message] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const topErrors = Object.entries(errorMessages)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([message, count]) => ({ message, count }));
    
    // Recent errors (last 20)
    const recentErrors = errorLogs.slice(0, 20).map(log => ({
      id: log.id,
      severity: (log.metadata as any)?.severity || 'medium',
      message: (log.metadata as any)?.message || 'Unknown error',
      context: (log.metadata as any)?.context,
      timestamp: log.createdAt,
      userId: log.userId,
    }));
    
    res.json({
      total: errorLogs.length,
      bySeverity,
      errorsByDate,
      topErrors,
      recentErrors,
    });
  } catch (error) {
    console.error('Error fetching error analytics:', error);
    res.status(500).json({ error: 'Failed to fetch error analytics' });
  }
});

// Get API performance metrics
router.get('/analytics/production/api-performance', async (req, res) => {
  try {
    const { days = '7' } = req.query;
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(days as string));
    
    const apiLogs = await db.query.auditLogs.findMany({
      where: and(
        eq(auditLogs.action, 'api_call'),
        gte(auditLogs.createdAt, daysAgo)
      ),
      orderBy: [desc(auditLogs.createdAt)],
    });
    
    // Calculate average response time
    const responseTimes = apiLogs
      .map(log => (log.metadata as any)?.responseTime)
      .filter(time => typeof time === 'number');
    
    const avgResponseTime = responseTimes.length > 0
      ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length
      : 0;
    
    // Group by status code
    const byStatusCode = {
      success: apiLogs.filter(log => {
        const status = (log.metadata as any)?.statusCode;
        return status >= 200 && status < 300;
      }).length,
      clientError: apiLogs.filter(log => {
        const status = (log.metadata as any)?.statusCode;
        return status >= 400 && status < 500;
      }).length,
      serverError: apiLogs.filter(log => {
        const status = (log.metadata as any)?.statusCode;
        return status >= 500;
      }).length,
    };
    
    // Group by endpoint
    const endpointStats = apiLogs.reduce((acc, log) => {
      const endpoint = (log.metadata as any)?.url || 'unknown';
      if (!acc[endpoint]) {
        acc[endpoint] = { count: 0, totalTime: 0, errors: 0 };
      }
      acc[endpoint].count++;
      acc[endpoint].totalTime += (log.metadata as any)?.responseTime || 0;
      const status = (log.metadata as any)?.statusCode;
      if (status >= 400) acc[endpoint].errors++;
      return acc;
    }, {} as Record<string, { count: number; totalTime: number; errors: number }>);
    
    const slowestEndpoints = Object.entries(endpointStats)
      .map(([endpoint, stats]) => ({
        endpoint,
        avgResponseTime: stats.totalTime / stats.count,
        calls: stats.count,
        errorRate: (stats.errors / stats.count) * 100,
      }))
      .sort((a, b) => b.avgResponseTime - a.avgResponseTime)
      .slice(0, 10);
    
    // Group by date
    const callsByDate = apiLogs.reduce((acc, log) => {
      const date = log.createdAt.toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    res.json({
      totalCalls: apiLogs.length,
      avgResponseTime: Math.round(avgResponseTime),
      byStatusCode,
      slowestEndpoints,
      callsByDate,
    });
  } catch (error) {
    console.error('Error fetching API performance analytics:', error);
    res.status(500).json({ error: 'Failed to fetch API performance analytics' });
  }
});

// Get user activity analytics
router.get('/analytics/production/user-activity', async (req, res) => {
  try {
    const { days = '7' } = req.query;
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(days as string));
    
    const activityLogs = await db.query.auditLogs.findMany({
      where: and(
        eq(auditLogs.action, 'user_action'),
        gte(auditLogs.createdAt, daysAgo)
      ),
      orderBy: [desc(auditLogs.createdAt)],
    });
    
    // Group by action type
    const byActionType = activityLogs.reduce((acc, log) => {
      const actionType = (log.metadata as any)?.actionType || 'unknown';
      acc[actionType] = (acc[actionType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const topActions = Object.entries(byActionType)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([action, count]) => ({ action, count }));
    
    // Group by date
    const actionsByDate = activityLogs.reduce((acc, log) => {
      const date = log.createdAt.toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    // Active users count
    const activeUsers = new Set(activityLogs.map(log => log.userId).filter(Boolean)).size;
    
    res.json({
      totalActions: activityLogs.length,
      activeUsers,
      topActions,
      actionsByDate,
    });
  } catch (error) {
    console.error('Error fetching user activity analytics:', error);
    res.status(500).json({ error: 'Failed to fetch user activity analytics' });
  }
});

// Get filing progress/drop-off analytics
router.get('/analytics/production/filing-progress', async (req, res) => {
  try {
    const { days = '30' } = req.query;
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(days as string));
    
    const progressLogs = await db.query.auditLogs.findMany({
      where: and(
        eq(auditLogs.action, 'filing_progress'),
        gte(auditLogs.createdAt, daysAgo)
      ),
    });
    
    // Group by filing type and step
    const progressByType = progressLogs.reduce((acc, log) => {
      const filingType = (log.metadata as any)?.filingType || 'unknown';
      const step = (log.metadata as any)?.step || 0;
      
      if (!acc[filingType]) {
        acc[filingType] = {};
      }
      acc[filingType][step] = (acc[filingType][step] || 0) + 1;
      return acc;
    }, {} as Record<string, Record<number, number>>);
    
    // Calculate drop-off rates
    const dropOffAnalysis = Object.entries(progressByType).map(([filingType, steps]) => {
      const sortedSteps = Object.entries(steps).sort(([a], [b]) => parseInt(a) - parseInt(b));
      const dropOffs = sortedSteps.map(([step, count], index) => {
        if (index === 0) return { step: parseInt(step), count, dropOffRate: 0 };
        const prevCount = sortedSteps[index - 1][1];
        return {
          step: parseInt(step),
          count,
          dropOffRate: prevCount > 0 ? ((prevCount - count) / prevCount) * 100 : 0,
        };
      });
      
      return {
        filingType,
        steps: dropOffs,
      };
    });
    
    res.json({
      totalProgressEvents: progressLogs.length,
      dropOffAnalysis,
    });
  } catch (error) {
    console.error('Error fetching filing progress analytics:', error);
    res.status(500).json({ error: 'Failed to fetch filing progress analytics' });
  }
});

/**
 * ADMIN NOTIFICATIONS ROUTES
 */

// Get all notifications (with optional unread filter)
router.get('/notifications', async (req, res) => {
  try {
    const { unreadOnly = 'false', limit = '50', offset = '0' } = req.query;
    
    const notifications = await notificationService.getNotifications({
      unreadOnly: unreadOnly === 'true',
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
    });
    
    res.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// Get unread notification count
router.get('/notifications/unread-count', async (req, res) => {
  try {
    const count = await notificationService.getUnreadCount();
    res.json({ count });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({ error: 'Failed to fetch unread count' });
  }
});

// Mark notification as read
router.patch('/notifications/:id/read', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await notificationService.markAsRead(id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

// Mark all notifications as read
router.patch('/notifications/mark-all-read', async (req, res) => {
  try {
    await notificationService.markAllAsRead();
    res.json({ success: true });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ error: 'Failed to mark all notifications as read' });
  }
});

/**
 * SUBSCRIPTION TIER MANAGEMENT ROUTES
 */

// Get all subscription tiers
router.get('/tiers', async (req, res) => {
  try {
    const tiers = await storage.getAllSubscriptionTiers();
    res.json(tiers);
  } catch (error) {
    console.error('Error fetching subscription tiers:', error);
    res.status(500).json({ error: 'Failed to fetch subscription tiers' });
  }
});

// Get tier by ID
router.get('/tiers/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const tier = await storage.getSubscriptionTier(id);
    
    if (!tier) {
      return res.status(404).json({ error: 'Subscription tier not found' });
    }
    
    res.json(tier);
  } catch (error) {
    console.error('Error fetching subscription tier:', error);
    res.status(500).json({ error: 'Failed to fetch subscription tier' });
  }
});

// Create new tier
router.post('/tiers', async (req, res) => {
  try {
    const validatedData = insertSubscriptionTierSchema.parse(req.body);
    const tier = await storage.createSubscriptionTier(validatedData);
    res.status(201).json(tier);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    console.error('Error creating subscription tier:', error);
    res.status(500).json({ error: 'Failed to create subscription tier' });
  }
});

// Update tier
router.patch('/tiers/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const partialData = insertSubscriptionTierSchema.partial().parse(req.body);
    const tier = await storage.updateSubscriptionTier(id, partialData);
    res.json(tier);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    console.error('Error updating subscription tier:', error);
    res.status(500).json({ error: 'Failed to update subscription tier' });
  }
});

// Delete tier
router.delete('/tiers/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await storage.deleteSubscriptionTier(id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting subscription tier:', error);
    res.status(500).json({ error: 'Failed to delete subscription tier' });
  }
});

// Assign user to tier
router.patch('/users/:id/tier', async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const { tierId } = req.body;
    
    if (!tierId && tierId !== null) {
      return res.status(400).json({ error: 'tierId is required' });
    }
    
    const user = await storage.updateUser(userId, { subscriptionTierId: tierId });
    const { password, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
    console.error('Error assigning user to tier:', error);
    res.status(500).json({ error: 'Failed to assign user to tier' });
  }
});

export default router;

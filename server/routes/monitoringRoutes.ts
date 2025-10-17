/**
 * Monitoring Routes
 * 
 * Backend routes for system monitoring and health metrics
 * Admin-only access for production monitoring dashboard
 */

import { Router } from 'express';
import { isAuthenticated, isAdmin } from '../auth';
import { logger } from '../utils/logger';
import { storage } from '../storage';
import { db } from '../db';
import { filings, users, creditTransactions } from '@shared/schema';
import { sql, gte, and, eq, desc } from 'drizzle-orm';
import os from 'os';

const router = Router();
router.use(isAuthenticated);
router.use(isAdmin);

const monitoringLogger = logger.withContext('MonitoringRoutes');

/**
 * Get system health metrics
 * GET /api/monitoring/health
 */
router.get('/health', async (req, res) => {
  try {
    const uptime = process.uptime();
    const memory = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    // Database connection check
    let dbHealthy = true;
    try {
      await db.execute(sql`SELECT 1`);
    } catch (error) {
      dbHealthy = false;
      monitoringLogger.error('Database health check failed:', error);
    }

    const healthMetrics = {
      status: dbHealthy ? 'healthy' : 'degraded',
      uptime: Math.floor(uptime),
      uptimeFormatted: formatUptime(uptime),
      memory: {
        heapUsed: Math.round(memory.heapUsed / 1024 / 1024), // MB
        heapTotal: Math.round(memory.heapTotal / 1024 / 1024), // MB
        external: Math.round(memory.external / 1024 / 1024), // MB
        rss: Math.round(memory.rss / 1024 / 1024), // MB
      },
      cpu: {
        user: Math.round(cpuUsage.user / 1000), // ms
        system: Math.round(cpuUsage.system / 1000), // ms
      },
      system: {
        platform: os.platform(),
        arch: os.arch(),
        cpus: os.cpus().length,
        totalMemory: Math.round(os.totalmem() / 1024 / 1024 / 1024), // GB
        freeMemory: Math.round(os.freemem() / 1024 / 1024 / 1024), // GB
      },
      database: {
        connected: dbHealthy,
      },
      timestamp: new Date().toISOString(),
    };

    res.json(healthMetrics);
  } catch (error: any) {
    monitoringLogger.error('Error fetching health metrics:', error);
    res.status(500).json({ error: 'Failed to fetch health metrics' });
  }
});

/**
 * Get filing statistics
 * GET /api/monitoring/filings/stats
 */
router.get('/filings/stats', async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const daysAgo = new Date(Date.now() - Number(days) * 24 * 60 * 60 * 1000);

    // Get filing stats by type and status
    const stats = await db
      .select({
        type: filings.type,
        status: filings.status,
        count: sql<number>`count(*)::int`,
      })
      .from(filings)
      .where(gte(filings.createdAt, daysAgo))
      .groupBy(filings.type, filings.status);

    // Calculate success rates
    const filingsByType: Record<string, any> = {};
    
    stats.forEach(({ type, status, count }) => {
      if (!filingsByType[type]) {
        filingsByType[type] = {
          total: 0,
          submitted: 0,
          draft: 0,
          failed: 0,
          successRate: 0,
        };
      }
      
      filingsByType[type].total += count;
      
      if (status === 'submitted') {
        filingsByType[type].submitted += count;
      } else if (status === 'draft') {
        filingsByType[type].draft += count;
      } else if (status === 'failed') {
        filingsByType[type].failed += count;
      }
    });

    // Calculate success rates
    Object.keys(filingsByType).forEach(type => {
      const data = filingsByType[type];
      data.successRate = data.total > 0 
        ? Math.round((data.submitted / data.total) * 100) 
        : 0;
    });

    res.json({
      period: `Last ${days} days`,
      filingsByType,
      totalFilings: Object.values(filingsByType).reduce((sum: number, t: any) => sum + t.total, 0),
    });
  } catch (error: any) {
    monitoringLogger.error('Error fetching filing stats:', error);
    res.status(500).json({ error: 'Failed to fetch filing statistics' });
  }
});

/**
 * Get user activity metrics
 * GET /api/monitoring/users/activity
 */
router.get('/users/activity', async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const daysAgo = new Date(Date.now() - Number(days) * 24 * 60 * 60 * 1000);

    // Total users
    const totalUsers = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(users);

    // New users in period
    const newUsers = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(users)
      .where(gte(users.createdAt, daysAgo));

    // Active users (users with filings in period)
    const activeUsers = await db
      .select({ count: sql<number>`count(distinct ${filings.userId})::int` })
      .from(filings)
      .where(gte(filings.createdAt, daysAgo));

    // Credits usage
    const creditsUsed = await db
      .select({ 
        total: sql<number>`sum(abs(${creditTransactions.amount}))::int`,
      })
      .from(creditTransactions)
      .where(
        and(
          gte(creditTransactions.createdAt, daysAgo),
          sql`${creditTransactions.amount} < 0`
        )
      );

    const creditsPurchased = await db
      .select({ 
        total: sql<number>`sum(${creditTransactions.amount})::int`,
      })
      .from(creditTransactions)
      .where(
        and(
          gte(creditTransactions.createdAt, daysAgo),
          sql`${creditTransactions.amount} > 0`
        )
      );

    res.json({
      period: `Last ${days} days`,
      users: {
        total: totalUsers[0]?.count || 0,
        new: newUsers[0]?.count || 0,
        active: activeUsers[0]?.count || 0,
      },
      credits: {
        used: creditsUsed[0]?.total || 0,
        purchased: creditsPurchased[0]?.total || 0,
        netChange: (creditsPurchased[0]?.total || 0) - (creditsUsed[0]?.total || 0),
      },
    });
  } catch (error: any) {
    monitoringLogger.error('Error fetching user activity:', error);
    res.status(500).json({ error: 'Failed to fetch user activity metrics' });
  }
});

/**
 * Get recent errors and warnings
 * GET /api/monitoring/errors
 */
router.get('/errors', async (req, res) => {
  try {
    const { limit = 50 } = req.query;

    // Get recent failed filings
    const recentErrors = await db
      .select({
        id: filings.id,
        type: filings.type,
        userId: filings.userId,
        status: filings.status,
        createdAt: filings.createdAt,
        data: filings.data,
      })
      .from(filings)
      .where(eq(filings.status, 'failed'))
      .orderBy(desc(filings.createdAt))
      .limit(Number(limit));

    res.json({
      errors: recentErrors,
      count: recentErrors.length,
    });
  } catch (error: any) {
    monitoringLogger.error('Error fetching recent errors:', error);
    res.status(500).json({ error: 'Failed to fetch recent errors' });
  }
});

/**
 * Get filing timeline data (for charts)
 * GET /api/monitoring/filings/timeline
 */
router.get('/filings/timeline', async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const daysAgo = new Date(Date.now() - Number(days) * 24 * 60 * 60 * 1000);

    // Group filings by date and type
    const timeline = await db
      .select({
        date: sql<string>`date(${filings.createdAt})`,
        type: filings.type,
        count: sql<number>`count(*)::int`,
      })
      .from(filings)
      .where(gte(filings.createdAt, daysAgo))
      .groupBy(sql`date(${filings.createdAt})`, filings.type)
      .orderBy(sql`date(${filings.createdAt})`);

    res.json({
      period: `Last ${days} days`,
      timeline,
    });
  } catch (error: any) {
    monitoringLogger.error('Error fetching filing timeline:', error);
    res.status(500).json({ error: 'Failed to fetch filing timeline' });
  }
});

/**
 * Helper function to format uptime
 */
function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);
  
  return parts.join(' ');
}

export default router;

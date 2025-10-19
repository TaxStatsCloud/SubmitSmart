/**
 * AI Rate Limiting Middleware
 * 
 * Prevents OpenAI token burn by:
 * 1. Checking user credits BEFORE generation (fail fast)
 * 2. IP-based throttling (max 10 requests per minute)
 * 3. Blocking users who repeatedly exceed limits
 */

import { Request, Response, NextFunction } from 'express';
import { db } from '../db';
import { aiRateLimits, users } from '../../shared/schema';
import { eq, and, sql, gte } from 'drizzle-orm';
import { logger } from '../utils/logger';

const rateLimiterLogger = logger.withContext('AIRateLimiter');

// Rate limiting configuration
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 10; // 10 requests per minute
const BLOCK_DURATION_MS = 5 * 60 * 1000; // 5 minutes block duration

export interface AIRateLimiterOptions {
  requiredCredits: number;
  endpoint: string;
}

/**
 * AI Rate Limiting Middleware
 * 
 * Usage:
 * router.post('/directors-report', aiRateLimiter({ 
 *   requiredCredits: 150, 
 *   endpoint: '/api/ai/directors-report' 
 * }), async (req, res) => { ... });
 */
export function aiRateLimiter(options: AIRateLimiterOptions) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';
      const { requiredCredits, endpoint } = options;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // 1. Pre-check user credits (fail fast before calling OpenAI)
      const [user] = await db.select().from(users).where(eq(users.id, userId));
      
      if (!user) {
        return res.status(401).json({ error: 'User not found' });
      }

      if (user.credits < requiredCredits) {
        rateLimiterLogger.warn('Blocked request - insufficient credits', {
          userId,
          required: requiredCredits,
          available: user.credits,
          endpoint
        });

        return res.status(402).json({
          error: 'Insufficient credits',
          required: requiredCredits,
          available: user.credits,
          message: `You need ${requiredCredits} credits but only have ${user.credits} available. Please purchase more credits.`
        });
      }

      // 2. Check if user is currently blocked
      const now = new Date();
      const [existingLimit] = await db
        .select()
        .from(aiRateLimits)
        .where(
          and(
            eq(aiRateLimits.userId, userId),
            eq(aiRateLimits.endpoint, endpoint),
            eq(aiRateLimits.isBlocked, true),
            gte(aiRateLimits.blockedUntil!, now)
          )
        )
        .limit(1);

      if (existingLimit) {
        const remainingBlockTime = Math.ceil(
          (existingLimit.blockedUntil!.getTime() - now.getTime()) / 1000
        );

        rateLimiterLogger.warn('Blocked request - user is rate limited', {
          userId,
          endpoint,
          remainingBlockTime
        });

        return res.status(429).json({
          error: 'Too many requests',
          message: `You've been temporarily blocked due to excessive requests. Please try again in ${remainingBlockTime} seconds.`,
          retryAfter: remainingBlockTime
        });
      }

      // 3. Check rate limit window (GLOBAL across ALL AI endpoints)
      const windowStart = new Date(now.getTime() - RATE_LIMIT_WINDOW_MS);
      const windowEnd = new Date(now.getTime());

      // Aggregate ALL AI endpoint requests for this user in the current window
      const userRateLimitRecords = await db
        .select()
        .from(aiRateLimits)
        .where(
          and(
            eq(aiRateLimits.userId, userId),
            gte(aiRateLimits.windowEnd, windowStart),
            eq(aiRateLimits.isBlocked, false)
          )
        );

      // Calculate total requests across ALL endpoints in current window
      const totalRequestsInWindow = userRateLimitRecords.reduce(
        (sum, record) => sum + record.requestCount, 
        0
      );

      // Find or create rate limit record for this specific endpoint
      const [rateLimitRecord] = await db
        .select()
        .from(aiRateLimits)
        .where(
          and(
            eq(aiRateLimits.userId, userId),
            eq(aiRateLimits.endpoint, endpoint),
            gte(aiRateLimits.windowEnd, windowStart),
            eq(aiRateLimits.isBlocked, false)
          )
        )
        .orderBy(sql`${aiRateLimits.lastRequest} DESC`)
        .limit(1);

      // Check if user exceeded GLOBAL limit across all endpoints
      if (totalRequestsInWindow + 1 > MAX_REQUESTS_PER_WINDOW) {
        // Exceeded global rate limit - block user across ALL AI endpoints
        const blockedUntil = new Date(now.getTime() + BLOCK_DURATION_MS);

        // Block user on all their rate limit records
        await db
          .update(aiRateLimits)
          .set({
            isBlocked: true,
            blockedUntil
          })
          .where(
            and(
              eq(aiRateLimits.userId, userId),
              gte(aiRateLimits.windowEnd, windowStart)
            )
          );

        rateLimiterLogger.warn('User exceeded GLOBAL rate limit - blocking', {
          userId,
          endpoint,
          totalRequestsInWindow: totalRequestsInWindow + 1,
          limit: MAX_REQUESTS_PER_WINDOW,
          blockedUntil
        });

        return res.status(429).json({
          error: 'Too many requests',
          message: `You've made ${totalRequestsInWindow + 1} AI generation requests in the last minute across all endpoints. Maximum allowed is ${MAX_REQUESTS_PER_WINDOW} total. You've been temporarily blocked for ${BLOCK_DURATION_MS / 60000} minutes.`,
          retryAfter: BLOCK_DURATION_MS / 1000
        });
      }

      if (rateLimitRecord && rateLimitRecord.windowEnd > now) {
        // Window still active for this endpoint - increment request count
        const newRequestCount = rateLimitRecord.requestCount + 1;

        // Update request count for this endpoint
        await db
          .update(aiRateLimits)
          .set({
            requestCount: newRequestCount,
            lastRequest: now
          })
          .where(eq(aiRateLimits.id, rateLimitRecord.id));

        rateLimiterLogger.info('Rate limit check passed (global tracking)', {
          userId,
          endpoint,
          endpointRequestCount: newRequestCount,
          totalRequestsInWindow: totalRequestsInWindow + 1,
          limit: MAX_REQUESTS_PER_WINDOW
        });

      } else {
        // Create new rate limit window
        await db.insert(aiRateLimits).values({
          userId,
          ipAddress,
          endpoint,
          requestCount: 1,
          windowStart: now,
          windowEnd: new Date(now.getTime() + RATE_LIMIT_WINDOW_MS),
          lastRequest: now,
          isBlocked: false
        });

        rateLimiterLogger.info('New rate limit window created', {
          userId,
          endpoint
        });
      }

      // 4. Cleanup old rate limit records (older than 1 hour)
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      await db
        .delete(aiRateLimits)
        .where(
          and(
            eq(aiRateLimits.userId, userId),
            sql`${aiRateLimits.windowEnd} < ${oneHourAgo}`
          )
        );

      // All checks passed - proceed to handler
      next();

    } catch (error: any) {
      rateLimiterLogger.error('Rate limiter error:', error);
      // Don't block request on rate limiter error - fail open
      next();
    }
  };
}

/**
 * Cleanup old rate limit records (run periodically)
 */
export async function cleanupRateLimitRecords() {
  try {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const result = await db
      .delete(aiRateLimits)
      .where(sql`${aiRateLimits.windowEnd} < ${oneDayAgo}`);

    rateLimiterLogger.info('Cleaned up old rate limit records', { result });
  } catch (error: any) {
    rateLimiterLogger.error('Error cleaning up rate limit records:', error);
  }
}

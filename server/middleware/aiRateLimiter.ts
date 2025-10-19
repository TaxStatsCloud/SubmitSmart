/**
 * AI Rate Limiting Middleware - Production-Grade Atomic Implementation
 * 
 * Prevents OpenAI token burn with GLOBAL rate limiting across all AI endpoints:
 * - Max 10 AI requests per minute per user (across ALL endpoints combined)
 * - Atomic database transactions with FOR UPDATE row-level locking
 * - 5-minute automatic blocking for abusers
 * - Zero race conditions under concurrent load
 * 
 * Architecture:
 * 1. Pre-check user credits (fail fast before OpenAI call)
 * 2. Use PostgreSQL transaction with SELECT ... FOR UPDATE to lock user's rate limit record
 * 3. Rolling 60-second window (auto-resets after 60s)
 * 4. Block user across ALL endpoints on 11th request
 * 5. Automatic unblocking after 5 minutes
 */

import { Request, Response, NextFunction } from 'express';
import { db } from '../db';
import { aiRateLimits, users } from '../../shared/schema';
import { eq, sql } from 'drizzle-orm';
import { logger } from '../utils/logger';

const rateLimiterLogger = logger.withContext('AIRateLimiter');

// Rate limiting configuration
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 60 seconds rolling window
const MAX_REQUESTS_PER_WINDOW = 10; // 10 total AI requests per minute
const BLOCK_DURATION_MS = 5 * 60 * 1000; // 5 minute block for abusers

export interface AIRateLimiterOptions {
  requiredCredits?: number; // Optional - if not provided, skip credit pre-check
  endpoint: string;
}

/**
 * Atomic AI Rate Limiting Middleware
 * 
 * Usage:
 * router.post('/directors-report', aiRateLimiter({ 
 *   requiredCredits: 150, 
 *   endpoint: '/api/ai/directors-report' 
 * }), async (req, res) => { ... });
 */
export function aiRateLimiter(options: AIRateLimiterOptions) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();
    
    try {
      const userId = req.user?.id;
      const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';
      const { requiredCredits, endpoint } = options;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // ============================================================
      // STEP 1: Pre-check user credits (fail fast before OpenAI)
      // Skip if requiredCredits not provided (for dynamic pricing endpoints)
      // ============================================================
      if (requiredCredits !== undefined && requiredCredits > 0) {
        const [user] = await db.select().from(users).where(eq(users.id, userId));
        
        if (!user) {
          return res.status(401).json({ error: 'User not found' });
        }

        if (user.credits < requiredCredits) {
          rateLimiterLogger.warn('Blocked - insufficient credits', {
            userId,
            endpoint,
            required: requiredCredits,
            available: user.credits
          });

          return res.status(402).json({
            error: 'Insufficient credits',
            required: requiredCredits,
            available: user.credits,
            message: `You need ${requiredCredits} credits but only have ${user.credits}. Please purchase more credits.`
          });
        }
      }

      // ============================================================
      // STEP 2: Atomic rate limiting with database transaction
      // Uses UPSERT + SELECT FOR UPDATE to prevent ALL race conditions
      // ============================================================
      await db.transaction(async (tx) => {
        const now = new Date();
        const nowMs = now.getTime();

        // ATOMIC UPSERT: Create row if doesn't exist, or update if it does
        // This prevents UNIQUE_VIOLATION race on first-time concurrent requests
        await tx
          .insert(aiRateLimits)
          .values({
            userId,
            ipAddress,
            requestCount: 0, // Will be incremented below
            windowStartedAt: now,
            lastRequestAt: now,
            isBlocked: false,
            totalBlockCount: 0
          })
          .onConflictDoUpdate({
            target: aiRateLimits.userId,
            set: {
              ipAddress, // Update IP for monitoring
              updatedAt: now
            }
          });

        // Now lock and read the record (guaranteed to exist after upsert)
        const [rateLimitRecord] = await tx
          .select()
          .from(aiRateLimits)
          .where(eq(aiRateLimits.userId, userId))
          .for('update'); // PostgreSQL row-level lock prevents concurrent bypass

        if (!rateLimitRecord) {
          // Should never happen after upsert, but handle gracefully
          throw new Error('Rate limit record missing after upsert');
        }

        // Check if user is currently blocked
        if (rateLimitRecord.isBlocked && rateLimitRecord.blockedUntil && rateLimitRecord.blockedUntil > now) {
          const remainingBlockTimeSeconds = Math.ceil(
            (rateLimitRecord.blockedUntil.getTime() - nowMs) / 1000
          );

          rateLimiterLogger.warn('Request blocked - user is rate limited', {
            userId,
            endpoint,
            remainingBlockTimeSeconds,
            totalBlockCount: rateLimitRecord.totalBlockCount
          });

          throw {
            status: 429,
            error: 'Too many requests',
            message: `You've been temporarily blocked for making too many AI requests. Please wait ${remainingBlockTimeSeconds} seconds before trying again.`,
            retryAfter: remainingBlockTimeSeconds
          };
        }

        // Unblock user if block duration has expired
        if (rateLimitRecord.isBlocked && rateLimitRecord.blockedUntil && rateLimitRecord.blockedUntil <= now) {
          await tx
            .update(aiRateLimits)
            .set({
              isBlocked: false,
              blockedUntil: null,
              requestCount: 0,
              windowStartedAt: now,
              lastRequestAt: now,
              updatedAt: now
            })
            .where(eq(aiRateLimits.userId, userId));

          rateLimiterLogger.info('User unblocked - block duration expired', {
            userId,
            totalBlockCount: rateLimitRecord.totalBlockCount
          });
        }

        // Calculate window age
        const windowAgeMs = nowMs - rateLimitRecord.windowStartedAt.getTime();
        const isWindowExpired = windowAgeMs >= RATE_LIMIT_WINDOW_MS;

        // Determine new request count
        let newRequestCount: number;
        
        if (isWindowExpired) {
          // Window expired - reset to new window with this request as first
          newRequestCount = 1;
          
          await tx
            .update(aiRateLimits)
            .set({
              requestCount: 1,
              windowStartedAt: now,
              lastRequestAt: now,
              updatedAt: now
            })
            .where(eq(aiRateLimits.userId, userId));

          rateLimiterLogger.info('New rate limit window started', {
            userId,
            endpoint,
            requestCount: 1,
            previousWindowAgeMs: windowAgeMs
          });
        } else {
          // Window is still active - increment request count
          newRequestCount = rateLimitRecord.requestCount + 1;
        }

        // Check rate limit (applies to both new and existing windows)
        if (newRequestCount > MAX_REQUESTS_PER_WINDOW) {
          // EXCEEDED RATE LIMIT - Block user for 5 minutes
          const blockedUntil = new Date(nowMs + BLOCK_DURATION_MS);
          const newBlockCount = rateLimitRecord.totalBlockCount + 1;

          await tx
            .update(aiRateLimits)
            .set({
              isBlocked: true,
              blockedUntil,
              totalBlockCount: newBlockCount,
              requestCount: newRequestCount,
              lastRequestAt: now,
              updatedAt: now
            })
            .where(eq(aiRateLimits.userId, userId));

          rateLimiterLogger.warn('RATE LIMIT EXCEEDED - User blocked', {
            userId,
            endpoint,
            requestCount: newRequestCount,
            limit: MAX_REQUESTS_PER_WINDOW,
            blockedUntil,
            totalBlockCount: newBlockCount,
            windowAgeMs
          });

          throw {
            status: 429,
            error: 'Too many requests',
            message: `Rate limit exceeded: ${newRequestCount} AI requests in ${Math.round(windowAgeMs / 1000)} seconds. Maximum allowed is ${MAX_REQUESTS_PER_WINDOW} per minute. You've been blocked for ${BLOCK_DURATION_MS / 60000} minutes.`,
            retryAfter: BLOCK_DURATION_MS / 1000
          };
        }

        // Within rate limit - increment and allow (only if window not expired)
        if (!isWindowExpired) {
          await tx
            .update(aiRateLimits)
            .set({
              requestCount: newRequestCount,
              lastRequestAt: now,
              updatedAt: now
            })
            .where(eq(aiRateLimits.userId, userId));
        }

        const elapsedMs = Date.now() - startTime;
        rateLimiterLogger.info('Rate limit check passed', {
          userId,
          endpoint,
          requestCount: newRequestCount,
          limit: MAX_REQUESTS_PER_WINDOW,
          windowAgeSeconds: Math.round(windowAgeMs / 1000),
          windowExpired: isWindowExpired,
          checkDurationMs: elapsedMs
        });
      });

      // All checks passed - proceed to AI generation handler
      next();

    } catch (error: any) {
      // Handle rate limit errors thrown from transaction
      if (error.status === 429) {
        return res.status(429).json({
          error: error.error,
          message: error.message,
          retryAfter: error.retryAfter
        });
      }

      // Unexpected error - log but don't block request (fail open for resilience)
      rateLimiterLogger.error('Rate limiter unexpected error:', {
        error: error.message,
        stack: error.stack,
        endpoint: options.endpoint
      });
      
      // Fail open to prevent rate limiter bugs from breaking AI features
      next();
    }
  };
}

/**
 * Cleanup old rate limit records (run via cron job)
 * Removes records for users who haven't made AI requests in 7 days
 */
export async function cleanupStaleRateLimitRecords() {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    const deleted = await db
      .delete(aiRateLimits)
      .where(sql`${aiRateLimits.lastRequestAt} < ${sevenDaysAgo}`)
      .returning({ userId: aiRateLimits.userId });

    rateLimiterLogger.info('Cleaned up stale rate limit records', { 
      count: deleted.length 
    });
    
    return deleted.length;
  } catch (error: any) {
    rateLimiterLogger.error('Error cleaning up rate limit records:', error);
    return 0;
  }
}

import { db } from "../db";
import { auditLogs, InsertAuditLog } from "@shared/schema";
import type { Request } from "express";

class AuditService {
  /**
   * Create an audit log entry
   */
  async log(params: {
    userId?: number;
    action: string;
    entityType?: string;
    entityId?: number;
    changes?: Record<string, any>;
    metadata?: Record<string, any>;
    req?: Request;
  }): Promise<void> {
    try {
      const { userId, action, entityType, entityId, changes, metadata, req } = params;

      const auditEntry: InsertAuditLog = {
        userId: userId || null,
        action,
        entityType: entityType || null,
        entityId: entityId || null,
        changes: changes || null,
        metadata: metadata || null,
        ipAddress: req ? this.getClientIp(req) : null,
        userAgent: req?.get('user-agent') || null,
      };

      await db.insert(auditLogs).values(auditEntry);
    } catch (error) {
      // Don't throw - audit logging should never break the main flow
      console.error('Audit logging failed:', error);
    }
  }

  /**
   * Log a filing submission
   */
  async logFilingSubmission(params: {
    userId: number;
    filingId: number;
    filingType: string;
    status: string;
    req?: Request;
  }): Promise<void> {
    await this.log({
      userId: params.userId,
      action: 'filing_submitted',
      entityType: 'filing',
      entityId: params.filingId,
      metadata: {
        filingType: params.filingType,
        status: params.status,
      },
      req: params.req,
    });
  }

  /**
   * Log a filing status change
   */
  async logFilingStatusChange(params: {
    userId: number;
    filingId: number;
    oldStatus: string;
    newStatus: string;
    req?: Request;
  }): Promise<void> {
    await this.log({
      userId: params.userId,
      action: 'filing_status_changed',
      entityType: 'filing',
      entityId: params.filingId,
      changes: {
        before: { status: params.oldStatus },
        after: { status: params.newStatus },
      },
      req: params.req,
    });
  }

  /**
   * Log user authentication
   */
  async logUserLogin(params: {
    userId: number;
    method: string;
    req?: Request;
  }): Promise<void> {
    await this.log({
      userId: params.userId,
      action: 'user_login',
      entityType: 'user',
      entityId: params.userId,
      metadata: {
        authMethod: params.method,
      },
      req: params.req,
    });
  }

  /**
   * Log user logout
   */
  async logUserLogout(params: {
    userId: number;
    req?: Request;
  }): Promise<void> {
    await this.log({
      userId: params.userId,
      action: 'user_logout',
      entityType: 'user',
      entityId: params.userId,
      req: params.req,
    });
  }

  /**
   * Log credit transaction
   */
  async logCreditTransaction(params: {
    userId: number;
    transactionId: number;
    amount: number;
    type: string;
    req?: Request;
  }): Promise<void> {
    await this.log({
      userId: params.userId,
      action: 'credit_transaction',
      entityType: 'credit_transaction',
      entityId: params.transactionId,
      metadata: {
        amount: params.amount,
        type: params.type,
      },
      req: params.req,
    });
  }

  /**
   * Log user role change
   */
  async logRoleChange(params: {
    adminUserId: number;
    targetUserId: number;
    oldRole: string;
    newRole: string;
    req?: Request;
  }): Promise<void> {
    await this.log({
      userId: params.adminUserId,
      action: 'user_role_changed',
      entityType: 'user',
      entityId: params.targetUserId,
      changes: {
        before: { role: params.oldRole },
        after: { role: params.newRole },
      },
      req: params.req,
    });
  }

  /**
   * Log company data changes
   */
  async logCompanyUpdate(params: {
    userId: number;
    companyId: number;
    changes: Record<string, any>;
    req?: Request;
  }): Promise<void> {
    await this.log({
      userId: params.userId,
      action: 'company_updated',
      entityType: 'company',
      entityId: params.companyId,
      changes: params.changes,
      req: params.req,
    });
  }

  /**
   * Log document upload
   */
  async logDocumentUpload(params: {
    userId: number;
    documentId: number;
    filename: string;
    fileType: string;
    req?: Request;
  }): Promise<void> {
    await this.log({
      userId: params.userId,
      action: 'document_uploaded',
      entityType: 'document',
      entityId: params.documentId,
      metadata: {
        filename: params.filename,
        fileType: params.fileType,
      },
      req: params.req,
    });
  }

  /**
   * Log security events
   */
  async logSecurityEvent(params: {
    userId?: number;
    event: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    details?: Record<string, any>;
    req?: Request;
  }): Promise<void> {
    await this.log({
      userId: params.userId,
      action: `security_${params.event}`,
      metadata: {
        severity: params.severity,
        ...params.details,
      },
      req: params.req,
    });
  }

  /**
   * Get client IP from request (handles proxies)
   */
  private getClientIp(req: Request): string | null {
    const forwarded = req.get('x-forwarded-for');
    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }
    return req.ip || req.socket.remoteAddress || null;
  }

  /**
   * Get audit logs for a specific user
   */
  async getUserAuditLogs(userId: number, limit: number = 100) {
    return await db.query.auditLogs.findMany({
      where: (logs, { eq }) => eq(logs.userId, userId),
      orderBy: (logs, { desc }) => [desc(logs.createdAt)],
      limit,
    });
  }

  /**
   * Get audit logs for a specific entity
   */
  async getEntityAuditLogs(entityType: string, entityId: number, limit: number = 100) {
    return await db.query.auditLogs.findMany({
      where: (logs, { eq, and }) => and(
        eq(logs.entityType, entityType),
        eq(logs.entityId, entityId)
      ),
      orderBy: (logs, { desc }) => [desc(logs.createdAt)],
      limit,
    });
  }

  /**
   * Get recent audit logs (admin only)
   */
  async getRecentAuditLogs(limit: number = 100) {
    return await db.query.auditLogs.findMany({
      orderBy: (logs, { desc }) => [desc(logs.createdAt)],
      limit,
      with: {
        user: {
          columns: {
            id: true,
            email: true,
            fullName: true,
          },
        },
      },
    });
  }

  /**
   * Log an error with stack trace
   * Production monitoring - track all application errors
   */
  async logError(params: {
    userId?: number;
    error: Error | any;
    context?: string;
    severity?: 'low' | 'medium' | 'high' | 'critical';
    req?: Request;
  }): Promise<void> {
    const { userId, error, context, severity = 'medium', req } = params;
    
    await this.log({
      userId,
      action: 'error_occurred',
      metadata: {
        errorName: error?.name || 'UnknownError',
        errorMessage: error?.message || String(error),
        stackTrace: error?.stack || null,
        context: context || 'unknown',
        severity,
        url: req?.url || null,
        method: req?.method || null,
      },
      req,
    });
  }

  /**
   * Log API call with performance metrics
   * Track response times, status codes, and endpoints
   */
  async logApiCall(params: {
    userId?: number;
    method: string;
    url: string;
    statusCode: number;
    responseTime: number; // milliseconds
    req?: Request;
  }): Promise<void> {
    const { userId, method, url, statusCode, responseTime, req } = params;
    
    await this.log({
      userId,
      action: 'api_call',
      metadata: {
        method,
        url,
        statusCode,
        responseTime,
        isSuccess: statusCode >= 200 && statusCode < 400,
      },
      req,
    });
  }

  /**
   * Log user actions (page views, button clicks, form submissions)
   * Track user behavior for analytics
   */
  async logUserAction(params: {
    userId: number;
    action: string;
    category?: string;
    label?: string;
    value?: number;
    metadata?: Record<string, any>;
    req?: Request;
  }): Promise<void> {
    const { userId, action, category, label, value, metadata, req } = params;
    
    await this.log({
      userId,
      action: `user_action_${action}`,
      metadata: {
        category: category || 'general',
        label: label || null,
        value: value || null,
        ...metadata,
      },
      req,
    });
  }

  /**
   * Log filing workflow progress
   * Track where users drop off in filing wizards
   */
  async logFilingProgress(params: {
    userId: number;
    filingId: number;
    filingType: string;
    step: number;
    stepName: string;
    completed: boolean;
    req?: Request;
  }): Promise<void> {
    const { userId, filingId, filingType, step, stepName, completed, req } = params;
    
    await this.log({
      userId,
      action: completed ? 'filing_step_completed' : 'filing_step_started',
      entityType: 'filing',
      entityId: filingId,
      metadata: {
        filingType,
        step,
        stepName,
      },
      req,
    });
  }

  /**
   * Log integration API calls (HMRC, Companies House, etc.)
   * Track external API performance and errors
   */
  async logIntegrationCall(params: {
    userId: number;
    integration: string;
    endpoint: string;
    success: boolean;
    responseTime: number;
    errorMessage?: string;
    req?: Request;
  }): Promise<void> {
    const { userId, integration, endpoint, success, responseTime, errorMessage, req } = params;
    
    await this.log({
      userId,
      action: 'integration_api_call',
      metadata: {
        integration,
        endpoint,
        success,
        responseTime,
        errorMessage: errorMessage || null,
      },
      req,
    });
  }

  /**
   * Log credit system events
   * Track credit purchases, usage, and balance changes
   */
  async logCreditEvent(params: {
    userId: number;
    eventType: 'purchase' | 'usage' | 'refund' | 'expiry';
    amount: number;
    balanceBefore: number;
    balanceAfter: number;
    reason?: string;
    req?: Request;
  }): Promise<void> {
    const { userId, eventType, amount, balanceBefore, balanceAfter, reason, req } = params;
    
    await this.log({
      userId,
      action: `credit_${eventType}`,
      entityType: 'credit',
      metadata: {
        amount,
        balanceBefore,
        balanceAfter,
        reason: reason || null,
      },
      req,
    });
  }
}

export const auditService = new AuditService();

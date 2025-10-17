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
}

export const auditService = new AuditService();

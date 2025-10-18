/**
 * Admin Notification Service
 * 
 * Manages system notifications for administrators:
 * - Error alerts (critical/high severity errors)
 * - Performance alerts (slow API endpoints)
 * - System alerts (important system events)
 */

import { db } from '../db';
import { adminNotifications, type InsertAdminNotification } from '@shared/schema';
import { eq, desc, and } from 'drizzle-orm';
import { emailService } from './emailService';

export class NotificationService {
  /**
   * Create a new admin notification
   */
  async createNotification(notification: InsertAdminNotification): Promise<void> {
    try {
      await db.insert(adminNotifications).values(notification);
      
      // Send email alert for critical severity
      if (notification.severity === 'critical') {
        await this.sendEmailAlert(notification);
      }
    } catch (error) {
      console.error('Failed to create admin notification:', error);
    }
  }

  /**
   * Create error alert notification from audit log
   */
  async createErrorAlert(params: {
    auditLogId: number;
    severity: 'critical' | 'high' | 'medium' | 'low';
    errorMessage: string;
    context?: string;
  }): Promise<void> {
    const { auditLogId, severity, errorMessage, context } = params;
    
    const title = severity === 'critical' 
      ? '🚨 Critical Error Detected'
      : `⚠️ ${severity.charAt(0).toUpperCase() + severity.slice(1)} Severity Error`;
    
    const message = context 
      ? `${errorMessage} (Context: ${context})`
      : errorMessage;
    
    await this.createNotification({
      type: 'error_alert',
      severity,
      title,
      message,
      auditLogId,
      isRead: false,
    });
  }

  /**
   * Create performance alert notification
   */
  async createPerformanceAlert(params: {
    endpoint: string;
    avgResponseTime: number;
    threshold: number;
  }): Promise<void> {
    const { endpoint, avgResponseTime, threshold } = params;
    
    await this.createNotification({
      type: 'performance_alert',
      severity: avgResponseTime > threshold * 2 ? 'high' : 'medium',
      title: '⚡ Slow API Endpoint Detected',
      message: `Endpoint ${endpoint} is averaging ${avgResponseTime}ms (threshold: ${threshold}ms)`,
      isRead: false,
    });
  }

  /**
   * Get unread notifications count
   */
  async getUnreadCount(): Promise<number> {
    const unread = await db.query.adminNotifications.findMany({
      where: eq(adminNotifications.isRead, false),
    });
    return unread.length;
  }

  /**
   * Get all notifications (paginated)
   */
  async getNotifications(params: {
    limit?: number;
    offset?: number;
    unreadOnly?: boolean;
  }): Promise<typeof adminNotifications.$inferSelect[]> {
    const { limit = 50, offset = 0, unreadOnly = false } = params;
    
    const where = unreadOnly ? eq(adminNotifications.isRead, false) : undefined;
    
    const notifications = await db.query.adminNotifications.findMany({
      where,
      orderBy: [desc(adminNotifications.createdAt)],
      limit,
      offset,
    });
    
    return notifications;
  }

  /**
   * Mark notification as read
   */
  async markAsRead(id: number): Promise<void> {
    await db.update(adminNotifications)
      .set({ isRead: true, readAt: new Date() })
      .where(eq(adminNotifications.id, id));
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<void> {
    await db.update(adminNotifications)
      .set({ isRead: true, readAt: new Date() })
      .where(eq(adminNotifications.isRead, false));
  }

  /**
   * Send email alert to admins for critical errors
   */
  private async sendEmailAlert(notification: InsertAdminNotification): Promise<void> {
    try {
      // Get all admin users
      const { users } = await import('@shared/schema');
      const admins = await db.query.users.findMany({
        where: eq(users.role, 'admin'),
      });
      
      if (admins.length === 0) return;
      
      for (const admin of admins) {
        if (!admin.email) continue;
        
        await emailService.sendEmail({
          to: admin.email,
          subject: `${notification.title} - PromptSubmissions Alert`,
          text: `
Critical Error Alert

${notification.title}

${notification.message}

Time: ${new Date().toISOString()}

Please review the admin dashboard for more details.

--
PromptSubmissions Production Monitoring
          `.trim(),
          html: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background: #dc2626; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
    <h2 style="margin: 0;">${notification.title}</h2>
  </div>
  <div style="background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; border-radius: 0 0 8px 8px;">
    <p style="margin: 0 0 15px 0; color: #374151;">${notification.message}</p>
    <p style="margin: 0; color: #6b7280; font-size: 14px;">
      <strong>Time:</strong> ${new Date().toLocaleString()}
    </p>
    <hr style="margin: 20px 0; border: none; border-top: 1px solid #e5e7eb;" />
    <p style="margin: 0; color: #6b7280; font-size: 14px;">
      Please review the admin dashboard for more details.
    </p>
  </div>
</div>
          `.trim(),
        });
      }
    } catch (error) {
      console.error('Failed to send email alert:', error);
    }
  }
}

export const notificationService = new NotificationService();

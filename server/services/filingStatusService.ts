/**
 * Filing Status Service
 *
 * Tracks CT600 submission status and provides polling mechanism
 * for async status updates from HMRC
 */

import { db } from '../db';
import { eq, desc, and } from 'drizzle-orm';
import * as schema from '@shared/schema';
import { hmrcCTService } from './hmrcCTService';
import { emailService } from './emailService';

export interface FilingStatusRecord {
  id: number;
  userId: number;
  companyId: number;
  companyNumber: string;
  companyName: string;
  filingType: 'ct600' | 'annual_accounts' | 'confirmation_statement';
  status: 'draft' | 'pending' | 'submitted' | 'accepted' | 'rejected' | 'error';
  correlationId: string | null;
  submittedAt: Date | null;
  hmrcResponse: any;
  errorMessage: string | null;
  accountingPeriodStart: string;
  accountingPeriodEnd: string;
  taxDue: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface StatusPollResult {
  correlationId: string;
  status: 'pending' | 'processing' | 'accepted' | 'rejected' | 'error';
  message: string;
  hmrcReference?: string;
  errors?: string[];
  updatedAt: Date;
}

class FilingStatusService {
  /**
   * Create a new filing status record
   */
  async createFilingRecord(data: {
    userId: number;
    companyId: number;
    companyNumber: string;
    companyName: string;
    filingType: 'ct600' | 'annual_accounts' | 'confirmation_statement';
    accountingPeriodStart: string;
    accountingPeriodEnd: string;
    taxDue: number;
  }): Promise<number> {
    const [result] = await db.insert(schema.filings).values({
      userId: data.userId,
      companyId: data.companyId,
      type: data.filingType === 'ct600' ? 'corporation_tax' : data.filingType,
      status: 'draft',
      data: {
        companyNumber: data.companyNumber,
        companyName: data.companyName,
        accountingPeriodStart: data.accountingPeriodStart,
        accountingPeriodEnd: data.accountingPeriodEnd,
        taxDue: data.taxDue
      },
      progress: 0,
      dueDate: new Date(data.accountingPeriodEnd),
    }).returning({ id: schema.filings.id });

    return result.id;
  }

  /**
   * Update filing status after HMRC submission
   */
  async updateFilingStatus(
    filingId: number,
    status: 'submitted' | 'accepted' | 'rejected' | 'error',
    correlationId: string | null,
    hmrcResponse?: any,
    errorMessage?: string
  ): Promise<void> {
    await db.update(schema.filings)
      .set({
        status: status === 'submitted' ? 'submitted' :
                status === 'accepted' ? 'approved' :
                status === 'rejected' ? 'rejected' : 'draft',
        submitDate: status === 'submitted' || status === 'accepted' ? new Date() : undefined,
        data: hmrcResponse ? { ...hmrcResponse, correlationId, errorMessage } : { correlationId, errorMessage },
        progress: status === 'accepted' ? 100 :
                  status === 'submitted' ? 75 :
                  status === 'rejected' ? 0 : 50
      })
      .where(eq(schema.filings.id, filingId));
  }

  /**
   * Get all filings for a user
   */
  async getUserFilings(userId: number): Promise<any[]> {
    const filings = await db.query.filings.findMany({
      where: eq(schema.filings.userId, userId),
      orderBy: [desc(schema.filings.createdAt)]
    });

    return filings.map(f => ({
      id: f.id,
      type: f.type,
      status: f.status,
      progress: f.progress,
      companyNumber: (f.data as any)?.companyNumber,
      companyName: (f.data as any)?.companyName,
      accountingPeriodStart: (f.data as any)?.accountingPeriodStart,
      accountingPeriodEnd: (f.data as any)?.accountingPeriodEnd,
      taxDue: (f.data as any)?.taxDue,
      correlationId: (f.data as any)?.correlationId,
      errorMessage: (f.data as any)?.errorMessage,
      submittedAt: f.submitDate,
      createdAt: f.createdAt,
      dueDate: f.dueDate
    }));
  }

  /**
   * Get filing by ID
   */
  async getFilingById(filingId: number, userId: number): Promise<any | null> {
    const filing = await db.query.filings.findFirst({
      where: and(
        eq(schema.filings.id, filingId),
        eq(schema.filings.userId, userId)
      )
    });

    if (!filing) return null;

    return {
      id: filing.id,
      type: filing.type,
      status: filing.status,
      progress: filing.progress,
      data: filing.data,
      submittedAt: filing.submitDate,
      createdAt: filing.createdAt,
      dueDate: filing.dueDate
    };
  }

  /**
   * Poll HMRC for submission status
   */
  async pollHMRCStatus(correlationId: string): Promise<StatusPollResult> {
    try {
      // Call HMRC status endpoint
      const result = await hmrcCTService.pollSubmissionStatus(correlationId);

      return {
        correlationId,
        status: result.status as StatusPollResult['status'],
        message: result.message || 'Status retrieved',
        hmrcReference: result.hmrcReference,
        errors: result.errors,
        updatedAt: new Date()
      };
    } catch (error: any) {
      return {
        correlationId,
        status: 'error',
        message: error.message || 'Failed to poll HMRC status',
        updatedAt: new Date()
      };
    }
  }

  /**
   * Poll and update filing status
   */
  async pollAndUpdateStatus(filingId: number, correlationId: string): Promise<StatusPollResult> {
    const pollResult = await this.pollHMRCStatus(correlationId);

    // Get filing details for email notification
    const filing = await db.query.filings.findFirst({
      where: eq(schema.filings.id, filingId),
      with: { user: true }
    });

    // Update the filing record based on poll result
    if (pollResult.status === 'accepted') {
      await this.updateFilingStatus(filingId, 'accepted', correlationId, {
        hmrcReference: pollResult.hmrcReference,
        acceptedAt: new Date()
      });

      // Send acceptance email notification
      if (filing?.user?.email) {
        const filingData = filing.data as any;
        await emailService.sendCT600StatusUpdate({
          to: filing.user.email,
          userName: filing.user.fullName || filing.user.username || 'User',
          companyName: filingData?.companyName || 'Unknown Company',
          companyNumber: filingData?.companyNumber || '',
          status: 'accepted',
          correlationId,
          hmrcReference: pollResult.hmrcReference,
          accountingPeriodEnd: filingData?.accountingPeriodEnd || '',
          taxDue: filingData?.taxDue || 0
        });
      }
    } else if (pollResult.status === 'rejected') {
      await this.updateFilingStatus(filingId, 'rejected', correlationId, {
        errors: pollResult.errors,
        rejectedAt: new Date()
      }, pollResult.errors?.join(', '));

      // Send rejection email notification
      if (filing?.user?.email) {
        const filingData = filing.data as any;
        await emailService.sendCT600StatusUpdate({
          to: filing.user.email,
          userName: filing.user.fullName || filing.user.username || 'User',
          companyName: filingData?.companyName || 'Unknown Company',
          companyNumber: filingData?.companyNumber || '',
          status: 'rejected',
          correlationId,
          errors: pollResult.errors,
          accountingPeriodEnd: filingData?.accountingPeriodEnd || '',
          taxDue: filingData?.taxDue || 0
        });
      }
    }

    return pollResult;
  }

  /**
   * Send CT600 submission confirmation email
   */
  async sendSubmissionConfirmation(params: {
    userId: number;
    companyName: string;
    companyNumber: string;
    accountingPeriodStart: string;
    accountingPeriodEnd: string;
    taxDue: number;
    correlationId: string;
  }): Promise<void> {
    try {
      // Get user email
      const user = await db.query.users.findFirst({
        where: eq(schema.users.id, params.userId)
      });

      if (user?.email) {
        await emailService.sendCT600SubmissionConfirmation({
          to: user.email,
          userName: user.fullName || user.username || 'User',
          companyName: params.companyName,
          companyNumber: params.companyNumber,
          accountingPeriodStart: params.accountingPeriodStart,
          accountingPeriodEnd: params.accountingPeriodEnd,
          taxDue: params.taxDue,
          correlationId: params.correlationId
        });
      }
    } catch (error) {
      console.error('[FilingStatus] Error sending submission confirmation email:', error);
      // Don't throw - email failure shouldn't break the submission flow
    }
  }

  /**
   * Get pending submissions that need status polling
   */
  async getPendingSubmissions(): Promise<Array<{ id: number; correlationId: string }>> {
    const filings = await db.query.filings.findMany({
      where: eq(schema.filings.status, 'submitted')
    });

    return filings
      .filter(f => (f.data as any)?.correlationId)
      .map(f => ({
        id: f.id,
        correlationId: (f.data as any).correlationId
      }));
  }
}

export const filingStatusService = new FilingStatusService();

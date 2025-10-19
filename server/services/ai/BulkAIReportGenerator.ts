/**
 * Bulk AI Report Generation Service
 * 
 * Generates all 4 AI reports (Directors, Strategic, Notes, Cash Flow) in parallel
 * with bulk discount pricing: 500 credits vs 650 credits individually (23% savings).
 */

import { generateDirectorsReport, type DirectorsReportInput } from './DirectorsReportAIGenerator';
import { generateStrategicReport, type StrategicReportInput } from './StrategicReportAIGenerator';
import { generateNotesToAccounts, type NotesToAccountsInput } from './NotesToAccountsAIGenerator';
import { generateCashFlowStatement, type CashFlowInput } from './CashFlowAIGenerator';
import { logger } from '../../utils/logger';

const bulkLogger = logger.withContext('BulkAIReportGenerator');

export interface BulkReportInput {
  // Directors Report Input
  directorsReport: DirectorsReportInput;
  
  // Strategic Report Input (for large companies)
  strategicReport?: StrategicReportInput;
  
  // Notes to Accounts Input
  notesToAccounts: NotesToAccountsInput;
  
  // Cash Flow Statement Input (for medium/large companies)
  cashFlowStatement?: CashFlowInput;
}

export interface BulkReportOutput {
  directorsReport: any;
  strategicReport?: any;
  notesToAccounts: any;
  cashFlowStatement?: any;
  reportsGenerated: number;
  creditsUsed: number;
  creditsSaved: number;
}

/**
 * Bulk Credit Cost Constants
 * Individual costs: Directors (150) + Strategic (200) + Notes (100) + Cash Flow (200) = 650
 * Bulk discount: 500 credits (23% savings = 150 credits)
 */
export const BULK_AI_CREDIT_COST = 500;
export const INDIVIDUAL_TOTAL_COST = 650; // 150 + 200 + 100 + 200
export const BULK_SAVINGS = INDIVIDUAL_TOTAL_COST - BULK_AI_CREDIT_COST; // 150 credits

/**
 * Generate all 4 AI reports in parallel with bulk discount
 */
export async function generateBulkAIReports(
  input: BulkReportInput
): Promise<BulkReportOutput> {
  try {
    bulkLogger.info('Starting bulk AI report generation', {
      companyName: input.directorsReport.companyName,
      includesStrategic: !!input.strategicReport,
      includesCashFlow: !!input.cashFlowStatement
    });

    // Generate all reports in parallel for maximum speed
    const [directorsReport, strategicReport, notesToAccounts, cashFlowStatement] = await Promise.all([
      // Always generate Directors Report
      generateDirectorsReport(input.directorsReport),
      
      // Generate Strategic Report if provided (large companies)
      input.strategicReport 
        ? generateStrategicReport(input.strategicReport)
        : Promise.resolve(undefined),
      
      // Always generate Notes to Accounts
      generateNotesToAccounts(input.notesToAccounts),
      
      // Generate Cash Flow if provided (medium/large companies)
      input.cashFlowStatement
        ? generateCashFlowStatement(input.cashFlowStatement)
        : Promise.resolve(undefined)
    ]);

    const reportsGenerated = [
      directorsReport,
      strategicReport,
      notesToAccounts,
      cashFlowStatement
    ].filter(r => r !== undefined).length;

    bulkLogger.info('Bulk AI reports generated successfully', {
      companyName: input.directorsReport.companyName,
      reportsGenerated,
      creditsUsed: BULK_AI_CREDIT_COST,
      creditsSaved: BULK_SAVINGS
    });

    return {
      directorsReport,
      strategicReport,
      notesToAccounts,
      cashFlowStatement,
      reportsGenerated,
      creditsUsed: BULK_AI_CREDIT_COST,
      creditsSaved: BULK_SAVINGS
    };

  } catch (error: any) {
    bulkLogger.error('Error in bulk AI report generation:', error);
    throw new Error(`Failed to generate bulk AI reports: ${error.message}`);
  }
}

/**
 * Calculate individual cost for reports that would be generated
 */
export function calculateIndividualCost(input: BulkReportInput): number {
  let cost = 0;
  
  // Directors Report (always included)
  cost += 150;
  
  // Strategic Report (large companies)
  if (input.strategicReport) {
    cost += 200;
  }
  
  // Notes to Accounts (always included)
  cost += 100;
  
  // Cash Flow Statement (medium/large companies)
  if (input.cashFlowStatement) {
    cost += 200;
  }
  
  return cost;
}

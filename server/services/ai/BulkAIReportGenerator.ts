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
 * Bulk Discount Configuration
 * Apply 20% discount to whatever reports are actually generated
 * This ensures fair pricing - you only pay for what you get
 */
export const BULK_DISCOUNT_PERCENTAGE = 0.20; // 20% discount

/**
 * Individual Report Costs
 */
export const REPORT_COSTS = {
  DIRECTORS: 150,
  STRATEGIC: 200,
  NOTES: 100,
  CASH_FLOW: 200
} as const;

/**
 * Calculate bulk pricing based on reports that will actually be generated
 * Applies 20% discount to the sum of individual report costs
 */
export function calculateBulkPricing(input: BulkReportInput): {
  individualCost: number;
  bulkCost: number;
  savings: number;
} {
  let individualCost = REPORT_COSTS.DIRECTORS + REPORT_COSTS.NOTES; // Always include these
  
  if (input.strategicReport) {
    individualCost += REPORT_COSTS.STRATEGIC;
  }
  
  if (input.cashFlowStatement) {
    individualCost += REPORT_COSTS.CASH_FLOW;
  }
  
  const bulkCost = Math.round(individualCost * (1 - BULK_DISCOUNT_PERCENTAGE));
  const savings = individualCost - bulkCost;
  
  return { individualCost, bulkCost, savings };
}

/**
 * Generate all requested AI reports in parallel with bulk discount
 * FAIR PRICING: You only pay for the reports that are actually generated
 */
export async function generateBulkAIReports(
  input: BulkReportInput
): Promise<BulkReportOutput> {
  try {
    // Calculate pricing based on what will be generated
    const pricing = calculateBulkPricing(input);
    
    bulkLogger.info('Starting bulk AI report generation', {
      companyName: input.directorsReport.companyName,
      includesStrategic: !!input.strategicReport,
      includesCashFlow: !!input.cashFlowStatement,
      individualCost: pricing.individualCost,
      bulkCost: pricing.bulkCost,
      savings: pricing.savings
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
      creditsUsed: pricing.bulkCost,
      creditsSaved: pricing.savings
    });

    return {
      directorsReport,
      strategicReport,
      notesToAccounts,
      cashFlowStatement,
      reportsGenerated,
      creditsUsed: pricing.bulkCost,
      creditsSaved: pricing.savings
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

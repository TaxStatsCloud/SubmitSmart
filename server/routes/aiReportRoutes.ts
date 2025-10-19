/**
 * AI Report Generation Routes
 * 
 * API endpoints for AI-powered report generation (chargeable features)
 * - Directors Report: 150 credits
 * - Strategic Report: 200 credits
 * - Notes to Accounts: 100 credits
 * - Cash Flow Statement: 200 credits
 */

import { Router } from 'express';
import { isAuthenticated } from '../auth';
import { logger } from '../utils/logger';
import { storage } from '../storage';
import { getAIAssistanceCost } from '../../shared/filingCosts';
import { generateDirectorsReport } from '../services/ai/DirectorsReportAIGenerator';
import { generateStrategicReport } from '../services/ai/StrategicReportAIGenerator';
import { generateNotesToAccounts } from '../services/ai/NotesToAccountsAIGenerator';
import { generateCashFlowStatement } from '../services/ai/CashFlowAIGenerator';
import { generateBulkAIReports, calculateBulkPricing } from '../services/ai/BulkAIReportGenerator';
import { aiRateLimiter } from '../middleware/aiRateLimiter';

const router = Router();
router.use(isAuthenticated);

const aiReportLogger = logger.withContext('AIReportRoutes');

/**
 * Generate Directors Report using AI
 * POST /api/ai/directors-report
 * Cost: 150 credits
 */
router.post('/directors-report', aiRateLimiter({ 
  requiredCredits: getAIAssistanceCost('DIRECTORS_REPORT'), 
  endpoint: '/api/ai/directors-report' 
}), async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const REQUIRED_CREDITS = getAIAssistanceCost('DIRECTORS_REPORT');

    // Generate the report FIRST (fail fast if generation fails)
    const report = await generateDirectorsReport(req.body);

    // Atomically deduct credits (prevents race conditions)
    try {
      const remainingCredits = await storage.deductAICredits(
        userId,
        REQUIRED_CREDITS,
        `AI Directors Report Generation for ${req.body.companyName}`,
        { 
          reportType: 'directors_report',
          companyNumber: req.body.companyNumber,
          companyName: req.body.companyName
        }
      );

      aiReportLogger.info('Directors report generated', {
        userId,
        companyNumber: req.body.companyNumber,
        creditsDeducted: REQUIRED_CREDITS
      });

      res.json({
        success: true,
        report,
        creditsUsed: REQUIRED_CREDITS,
        remainingCredits
      });
    } catch (error: any) {
      // Handle insufficient credits error
      if (error.message?.includes('does not have enough credits')) {
        const user = await storage.getUser(userId);
        return res.status(402).json({
          error: 'Insufficient credits',
          required: REQUIRED_CREDITS,
          available: user?.credits || 0
        });
      }
      throw error;
    }

  } catch (error: any) {
    aiReportLogger.error('Error generating directors report:', error);
    res.status(500).json({ error: 'Failed to generate directors report' });
  }
});

/**
 * Generate Strategic Report using AI
 * POST /api/ai/strategic-report
 * Cost: 200 credits
 */
router.post('/strategic-report', aiRateLimiter({ 
  requiredCredits: getAIAssistanceCost('STRATEGIC_REPORT'), 
  endpoint: '/api/ai/strategic-report' 
}), async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const REQUIRED_CREDITS = getAIAssistanceCost('STRATEGIC_REPORT');

    // Generate the report FIRST (fail fast if generation fails)
    const report = await generateStrategicReport(req.body);

    // Atomically deduct credits (prevents race conditions)
    try {
      const remainingCredits = await storage.deductAICredits(
        userId,
        REQUIRED_CREDITS,
        `AI Strategic Report Generation for ${req.body.companyName}`,
        { 
          reportType: 'strategic_report',
          companyNumber: req.body.companyNumber,
          companyName: req.body.companyName
        }
      );

      aiReportLogger.info('Strategic report generated', {
        userId,
        companyNumber: req.body.companyNumber,
        creditsDeducted: REQUIRED_CREDITS
      });

      res.json({
        success: true,
        report,
        creditsUsed: REQUIRED_CREDITS,
        remainingCredits
      });
    } catch (error: any) {
      // Handle insufficient credits error
      if (error.message?.includes('does not have enough credits')) {
        const user = await storage.getUser(userId);
        return res.status(402).json({
          error: 'Insufficient credits',
          required: REQUIRED_CREDITS,
          available: user?.credits || 0
        });
      }
      throw error;
    }

  } catch (error: any) {
    aiReportLogger.error('Error generating strategic report:', error);
    res.status(500).json({ error: 'Failed to generate strategic report' });
  }
});

/**
 * Generate Notes to Accounts using AI
 * POST /api/ai/notes-to-accounts
 * Cost: 100 credits
 */
router.post('/notes-to-accounts', aiRateLimiter({ 
  requiredCredits: getAIAssistanceCost('NOTES_TO_ACCOUNTS'), 
  endpoint: '/api/ai/notes-to-accounts' 
}), async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const REQUIRED_CREDITS = getAIAssistanceCost('NOTES_TO_ACCOUNTS');

    // Generate the notes FIRST (fail fast if generation fails)
    const notes = await generateNotesToAccounts(req.body);

    // Atomically deduct credits (prevents race conditions)
    try {
      const remainingCredits = await storage.deductAICredits(
        userId,
        REQUIRED_CREDITS,
        `AI Notes to Accounts Generation for ${req.body.companyName}`,
        { 
          reportType: 'notes_to_accounts',
          companyNumber: req.body.companyNumber,
          companyName: req.body.companyName
        }
      );

      aiReportLogger.info('Notes to accounts generated', {
        userId,
        companyNumber: req.body.companyNumber,
        creditsDeducted: REQUIRED_CREDITS
      });

      res.json({
        success: true,
        notes,
        creditsUsed: REQUIRED_CREDITS,
        remainingCredits
      });
    } catch (error: any) {
      // Handle insufficient credits error
      if (error.message?.includes('does not have enough credits')) {
        const user = await storage.getUser(userId);
        return res.status(402).json({
          error: 'Insufficient credits',
          required: REQUIRED_CREDITS,
          available: user?.credits || 0
        });
      }
      throw error;
    }

  } catch (error: any) {
    aiReportLogger.error('Error generating notes to accounts:', error);
    res.status(500).json({ error: 'Failed to generate notes to accounts' });
  }
});

/**
 * Generate Cash Flow Statement using AI from Trial Balances
 * POST /api/ai/cash-flow-statement
 * Cost: 200 credits
 */
router.post('/cash-flow-statement', aiRateLimiter({ 
  requiredCredits: getAIAssistanceCost('CASH_FLOW_STATEMENT'), 
  endpoint: '/api/ai/cash-flow-statement' 
}), async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const REQUIRED_CREDITS = getAIAssistanceCost('CASH_FLOW_STATEMENT');

    // Generate the Cash Flow Statement FIRST (fail fast if generation fails)
    const cashFlow = await generateCashFlowStatement(req.body);

    // Atomically deduct credits (prevents race conditions)
    try {
      const remainingCredits = await storage.deductAICredits(
        userId,
        REQUIRED_CREDITS,
        `AI Cash Flow Statement Generation for ${req.body.companyName}`,
        { 
          reportType: 'cash_flow_statement',
          companyNumber: req.body.companyNumber,
          companyName: req.body.companyName
        }
      );

      aiReportLogger.info('Cash Flow Statement generated', {
        userId,
        companyNumber: req.body.companyNumber,
        creditsDeducted: REQUIRED_CREDITS,
        netCashFromOperating: cashFlow.netCashFromOperatingActivities
      });

      res.json({
        success: true,
        cashFlow,
        creditsUsed: REQUIRED_CREDITS,
        remainingCredits
      });
    } catch (error: any) {
      // Handle insufficient credits error
      if (error.message?.includes('does not have enough credits')) {
        const user = await storage.getUser(userId);
        return res.status(402).json({
          error: 'Insufficient credits',
          required: REQUIRED_CREDITS,
          available: user?.credits || 0
        });
      }
      throw error;
    }

  } catch (error: any) {
    aiReportLogger.error('Error generating Cash Flow Statement:', error);
    res.status(500).json({ error: 'Failed to generate Cash Flow Statement' });
  }
});

/**
 * Generate All Requested Reports in Bulk with 20% Discount
 * POST /api/ai/bulk-generate-reports
 * FAIR PRICING: You only pay for the reports that are actually generated
 * 
 * Cost examples:
 * - Directors + Notes only (2 reports): 200 credits (vs 250 individually)
 * - All 4 reports: 520 credits (vs 650 individually)
 * 
 * Request body: Same as individual endpoints (flat structure), will be transformed internally
 */
router.post('/bulk-generate-reports', aiRateLimiter({ 
  endpoint: '/api/ai/bulk-generate-reports' 
  // No requiredCredits - we calculate exact cost in the handler for fair pricing
}), async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const {
      companyNumber,
      companyName,
      accountingPeriodEnd,
      entitySize,
      directors,
      principalActivities,
      financialResults,
      dividends,
      futureDevelopments,
      currentYearTB,
      priorYearTB
    } = req.body;

    // Build nested input structure for bulk generator
    const bulkInput = {
      directorsReport: {
        companyNumber,
        companyName,
        periodEnd: accountingPeriodEnd,
        directors: directors || [],
        principalActivities,
        turnover: financialResults?.turnover,
        profit: financialResults?.profit,
        dividends,
        futureOutlook: futureDevelopments
      },
      notesToAccounts: {
        companyNumber,
        companyName,
        periodEnd: accountingPeriodEnd,
        entitySize: entitySize || 'SMALL'
      },
      strategicReport: entitySize === 'LARGE' ? {
        companyNumber,
        companyName,
        periodEnd: accountingPeriodEnd,
        businessModel: principalActivities,
        strategicObjectives: futureDevelopments,
        turnover: financialResults?.turnover,
        profit: financialResults?.profit
      } : undefined,
      cashFlowStatement: (entitySize === 'MEDIUM' || entitySize === 'LARGE') && currentYearTB && priorYearTB ? {
        companyNumber,
        companyName,
        periodEnd: accountingPeriodEnd,
        currentYearTB,
        priorYearTB
      } : undefined
    };

    // Calculate exact pricing based on what will be generated
    const pricing = calculateBulkPricing(bulkInput);

    // Double-check user has enough credits for the ACTUAL cost (not the max estimate)
    const user = await storage.getUser(userId);
    if (!user || user.credits < pricing.bulkCost) {
      return res.status(402).json({
        error: 'Insufficient credits',
        required: pricing.bulkCost,
        available: user?.credits || 0,
        message: `This bulk generation requires ${pricing.bulkCost} credits (saves you ${pricing.savings} credits vs ${pricing.individualCost} individually)`
      });
    }

    // Generate all reports FIRST (fail fast if generation fails)
    const bulkReports = await generateBulkAIReports(bulkInput);

    // Atomically deduct the ACTUAL credits used (prevents race conditions)
    try {
      const remainingCredits = await storage.deductAICredits(
        userId,
        bulkReports.creditsUsed, // Use actual cost from generator
        `Bulk AI Report Generation for ${companyName}`,
        { 
          reportType: 'bulk_generation',
          companyNumber,
          companyName,
          reportsGenerated: bulkReports.reportsGenerated,
          creditsSaved: bulkReports.creditsSaved,
          individualCost: pricing.individualCost
        }
      );

      aiReportLogger.info('Bulk AI reports generated and charged', {
        userId,
        companyNumber,
        companyName,
        reportsGenerated: bulkReports.reportsGenerated,
        creditsDeducted: bulkReports.creditsUsed,
        creditsSaved: bulkReports.creditsSaved,
        individualCost: pricing.individualCost
      });

      res.json({
        success: true,
        ...bulkReports,
        individualCost: pricing.individualCost,
        remainingCredits
      });
    } catch (error: any) {
      // Handle insufficient credits error
      if (error.message?.includes('does not have enough credits')) {
        return res.status(402).json({
          error: 'Insufficient credits',
          required: bulkReports.creditsUsed,
          available: user?.credits || 0,
          message: `Bulk generation requires ${bulkReports.creditsUsed} credits (saves you ${bulkReports.creditsSaved} credits vs ${pricing.individualCost} individually)`
        });
      }
      throw error;
    }

  } catch (error: any) {
    aiReportLogger.error('Error in bulk AI report generation:', error);
    res.status(500).json({ error: 'Failed to generate bulk AI reports' });
  }
});

export default router;

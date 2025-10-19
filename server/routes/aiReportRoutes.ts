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
import { generateBulkAIReports, BULK_AI_CREDIT_COST, INDIVIDUAL_TOTAL_COST, BULK_SAVINGS } from '../services/ai/BulkAIReportGenerator';
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
 * Generate All Reports in Bulk with Discount
 * POST /api/ai/bulk-generate-reports
 * Cost: 500 credits (vs 650 individually = 23% savings)
 */
router.post('/bulk-generate-reports', aiRateLimiter({ 
  requiredCredits: BULK_AI_CREDIT_COST, 
  endpoint: '/api/ai/bulk-generate-reports' 
}), async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Generate all reports FIRST (fail fast if generation fails)
    const bulkReports = await generateBulkAIReports(req.body);

    // Atomically deduct credits (prevents race conditions)
    try {
      const remainingCredits = await storage.deductAICredits(
        userId,
        BULK_AI_CREDIT_COST,
        `Bulk AI Report Generation for ${req.body.directorsReport.companyName}`,
        { 
          reportType: 'bulk_generation',
          companyNumber: req.body.directorsReport.companyNumber,
          companyName: req.body.directorsReport.companyName,
          reportsGenerated: bulkReports.reportsGenerated,
          creditsSaved: BULK_SAVINGS
        }
      );

      aiReportLogger.info('Bulk AI reports generated and charged', {
        userId,
        companyNumber: req.body.directorsReport.companyNumber,
        reportsGenerated: bulkReports.reportsGenerated,
        creditsDeducted: BULK_AI_CREDIT_COST,
        creditsSaved: BULK_SAVINGS
      });

      res.json({
        success: true,
        ...bulkReports,
        creditsUsed: BULK_AI_CREDIT_COST,
        creditsSaved: BULK_SAVINGS,
        individualCost: INDIVIDUAL_TOTAL_COST,
        remainingCredits
      });
    } catch (error: any) {
      // Handle insufficient credits error
      if (error.message?.includes('does not have enough credits')) {
        const user = await storage.getUser(userId);
        return res.status(402).json({
          error: 'Insufficient credits',
          required: BULK_AI_CREDIT_COST,
          available: user?.credits || 0,
          message: `Bulk generation requires ${BULK_AI_CREDIT_COST} credits (saves you ${BULK_SAVINGS} credits vs individual reports)`
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

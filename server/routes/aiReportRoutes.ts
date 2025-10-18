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

const router = Router();
router.use(isAuthenticated);

const aiReportLogger = logger.withContext('AIReportRoutes');

/**
 * Generate Directors Report using AI
 * POST /api/ai/directors-report
 * Cost: 150 credits
 */
router.post('/directors-report', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const REQUIRED_CREDITS = getAIAssistanceCost('DIRECTORS_REPORT');

    // Check user credits
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    if (user.credits < REQUIRED_CREDITS) {
      return res.status(402).json({
        error: 'Insufficient credits',
        required: REQUIRED_CREDITS,
        available: user.credits
      });
    }

    // Generate the report
    const report = await generateDirectorsReport(req.body);

    // Deduct credits
    await storage.updateUser(userId, {
      credits: user.credits - REQUIRED_CREDITS
    });

    // Log the transaction
    await storage.createCreditTransaction({
      userId,
      amount: -REQUIRED_CREDITS,
      type: 'usage',
      description: `AI Directors Report Generation for ${req.body.companyName}`,
      balance: user.credits - REQUIRED_CREDITS
    });

    aiReportLogger.info('Directors report generated', {
      userId,
      companyNumber: req.body.companyNumber,
      creditsDeducted: REQUIRED_CREDITS
    });

    res.json({
      success: true,
      report,
      creditsUsed: REQUIRED_CREDITS,
      remainingCredits: user.credits - REQUIRED_CREDITS
    });

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
router.post('/strategic-report', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const REQUIRED_CREDITS = getAIAssistanceCost('STRATEGIC_REPORT');

    // Check user credits
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    if (user.credits < REQUIRED_CREDITS) {
      return res.status(402).json({
        error: 'Insufficient credits',
        required: REQUIRED_CREDITS,
        available: user.credits
      });
    }

    // Generate the report
    const report = await generateStrategicReport(req.body);

    // Deduct credits
    await storage.updateUser(userId, {
      credits: user.credits - REQUIRED_CREDITS
    });

    // Log the transaction
    await storage.createCreditTransaction({
      userId,
      amount: -REQUIRED_CREDITS,
      type: 'usage',
      description: `AI Strategic Report Generation for ${req.body.companyName}`,
      balance: user.credits - REQUIRED_CREDITS
    });

    aiReportLogger.info('Strategic report generated', {
      userId,
      companyNumber: req.body.companyNumber,
      creditsDeducted: REQUIRED_CREDITS
    });

    res.json({
      success: true,
      report,
      creditsUsed: REQUIRED_CREDITS,
      remainingCredits: user.credits - REQUIRED_CREDITS
    });

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
router.post('/notes-to-accounts', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const REQUIRED_CREDITS = getAIAssistanceCost('NOTES_TO_ACCOUNTS');

    // Check user credits
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    if (user.credits < REQUIRED_CREDITS) {
      return res.status(402).json({
        error: 'Insufficient credits',
        required: REQUIRED_CREDITS,
        available: user.credits
      });
    }

    // Generate the notes
    const notes = await generateNotesToAccounts(req.body);

    // Deduct credits
    await storage.updateUser(userId, {
      credits: user.credits - REQUIRED_CREDITS
    });

    // Log the transaction
    await storage.createCreditTransaction({
      userId,
      amount: -REQUIRED_CREDITS,
      type: 'usage',
      description: `AI Notes to Accounts Generation for ${req.body.companyName}`,
      balance: user.credits - REQUIRED_CREDITS
    });

    aiReportLogger.info('Notes to accounts generated', {
      userId,
      companyNumber: req.body.companyNumber,
      creditsDeducted: REQUIRED_CREDITS
    });

    res.json({
      success: true,
      notes,
      creditsUsed: REQUIRED_CREDITS,
      remainingCredits: user.credits - REQUIRED_CREDITS
    });

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
router.post('/cash-flow-statement', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const REQUIRED_CREDITS = getAIAssistanceCost('CASH_FLOW_STATEMENT');

    // Check user credits
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    if (user.credits < REQUIRED_CREDITS) {
      return res.status(402).json({
        error: 'Insufficient credits',
        required: REQUIRED_CREDITS,
        available: user.credits
      });
    }

    // Generate the Cash Flow Statement
    const cashFlow = await generateCashFlowStatement(req.body);

    // Deduct credits
    await storage.updateUser(userId, {
      credits: user.credits - REQUIRED_CREDITS
    });

    // Log the transaction
    await storage.createCreditTransaction({
      userId,
      amount: -REQUIRED_CREDITS,
      type: 'usage',
      description: `AI Cash Flow Statement Generation for ${req.body.companyName}`,
      balance: user.credits - REQUIRED_CREDITS
    });

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
      remainingCredits: user.credits - REQUIRED_CREDITS
    });

  } catch (error: any) {
    aiReportLogger.error('Error generating Cash Flow Statement:', error);
    res.status(500).json({ error: 'Failed to generate Cash Flow Statement' });
  }
});

export default router;

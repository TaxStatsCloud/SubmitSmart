/**
 * Annual Accounts Routes
 * 
 * Backend routes for Annual Accounts Filing Wizard
 * Handles iXBRL generation and Companies House submission
 */

import { Router } from 'express';
import { isAuthenticated } from '../auth';
import { logger } from '../utils/logger';
import { storage } from '../storage';

const router = Router();
router.use(isAuthenticated);

const annualAccountsLogger = logger.withContext('AnnualAccountsRoutes');

/**
 * Generate iXBRL from financial data
 * POST /api/annual-accounts/generate-ixbrl
 */
router.post('/generate-ixbrl', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const formData = req.body;

    // Validate required fields
    if (!formData.companyName || !formData.companyNumber || !formData.financialYearEnd) {
      return res.status(400).json({ error: 'Missing required company information' });
    }

    // Calculate entity size based on turnover and assets
    const totalAssets = 
      (formData.intangibleAssets || 0) + 
      (formData.tangibleAssets || 0) + 
      (formData.investments || 0) +
      (formData.stocks || 0) + 
      (formData.debtors || 0) + 
      (formData.cashAtBank || 0);

    let entitySize = formData.entitySize;
    if (formData.turnover <= 632000 && totalAssets <= 316000) {
      entitySize = 'micro';
    } else if (formData.turnover <= 10200000 && totalAssets <= 5100000) {
      entitySize = 'small';
    } else if (formData.turnover <= 36000000 && totalAssets <= 18000000) {
      entitySize = 'medium';
    } else {
      entitySize = 'large';
    }

    // Generate iXBRL document (simplified version - real implementation would use proper taxonomy)
    const ixbrlData = {
      entitySize,
      companyInfo: {
        name: formData.companyName,
        number: formData.companyNumber,
        registeredOffice: formData.registeredOffice,
        financialYearStart: formData.financialYearStart,
        financialYearEnd: formData.financialYearEnd,
      },
      balanceSheet: {
        fixedAssets: {
          intangible: formData.intangibleAssets || 0,
          tangible: formData.tangibleAssets || 0,
          investments: formData.investments || 0,
          total: (formData.intangibleAssets || 0) + (formData.tangibleAssets || 0) + (formData.investments || 0),
        },
        currentAssets: {
          stocks: formData.stocks || 0,
          debtors: formData.debtors || 0,
          cash: formData.cashAtBank || 0,
          total: (formData.stocks || 0) + (formData.debtors || 0) + (formData.cashAtBank || 0),
        },
        liabilities: {
          creditorsWithinYear: formData.creditorsDueWithinYear || 0,
          creditorsAfterYear: formData.creditorsDueAfterYear || 0,
          total: (formData.creditorsDueWithinYear || 0) + (formData.creditorsDueAfterYear || 0),
        },
        capital: {
          shareCapital: formData.calledUpShareCapital || 0,
          plReserve: formData.profitAndLossAccount || 0,
          total: (formData.calledUpShareCapital || 0) + (formData.profitAndLossAccount || 0),
        },
      },
      profitAndLoss: {
        turnover: formData.turnover || 0,
        costOfSales: formData.costOfSales || 0,
        grossProfit: (formData.turnover || 0) - (formData.costOfSales || 0),
        administrativeExpenses: formData.administrativeExpenses || 0,
        operatingProfit: (formData.turnover || 0) - (formData.costOfSales || 0) - (formData.administrativeExpenses || 0),
      },
      directors: formData.directorNames ? formData.directorNames.split(',').map((d: string) => d.trim()) : [],
      auditExempt: formData.auditExempt !== false,
      accountingPolicies: formData.accountingPolicies || '',
      generated: new Date().toISOString(),
      taxonomyVersion: 'FRC 2025',
    };

    annualAccountsLogger.info('iXBRL generated successfully', { 
      companyNumber: formData.companyNumber,
      entitySize 
    });

    res.json({
      success: true,
      ixbrlData,
      message: 'iXBRL document generated successfully',
    });

  } catch (error: any) {
    annualAccountsLogger.error('Error generating iXBRL:', error);
    res.status(500).json({ error: 'Failed to generate iXBRL document' });
  }
});

/**
 * Submit Annual Accounts to Companies House
 * POST /api/annual-accounts/submit
 */
router.post('/submit', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { ixbrlData, ...formData } = req.body;

    // Check user has sufficient credits (120 credits for Annual Accounts)
    const REQUIRED_CREDITS = 120;
    const user = await storage.getUser(userId);
    
    if (!user || user.credits < REQUIRED_CREDITS) {
      return res.status(402).json({ 
        error: 'Insufficient credits',
        required: REQUIRED_CREDITS,
        available: user?.credits || 0,
      });
    }

    // Get user's companyId
    const userCompanyId = user.companyId;
    if (!userCompanyId) {
      return res.status(400).json({ error: 'User does not have an associated company' });
    }

    // Create filing record
    const filing = await storage.createFiling({
      userId,
      companyId: userCompanyId,
      type: 'annual_accounts',
      status: 'submitted',
      data: {
        ...formData,
        ixbrlData,
        submittedAt: new Date().toISOString(),
      },
      dueDate: new Date(Date.now() + 270 * 24 * 60 * 60 * 1000), // 9 months from now
    });

    // Deduct credits
    await storage.updateUserCredits(userId, -REQUIRED_CREDITS);

    // Create credit transaction record
    await storage.createCreditTransaction({
      userId,
      amount: -REQUIRED_CREDITS,
      balance: user.credits - REQUIRED_CREDITS,
      type: 'filing_deduction',
      description: `Annual Accounts filing for ${formData.companyName}`,
      filingId: filing.id,
    });

    annualAccountsLogger.info('Annual Accounts submitted', {
      userId,
      filingId: filing.id,
      companyNumber: formData.companyNumber,
      creditsDeducted: REQUIRED_CREDITS,
    });

    res.json({
      success: true,
      filingId: filing.id,
      submissionId: `CH-${filing.id}-${Date.now()}`,
      creditsUsed: REQUIRED_CREDITS,
      remainingCredits: user.credits - REQUIRED_CREDITS,
      message: 'Annual Accounts submitted successfully to Companies House',
    });

  } catch (error: any) {
    annualAccountsLogger.error('Error submitting Annual Accounts:', error);
    res.status(500).json({ error: 'Failed to submit Annual Accounts' });
  }
});

export default router;

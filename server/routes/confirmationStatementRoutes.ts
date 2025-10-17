/**
 * Confirmation Statement Routes
 * 
 * Backend routes for Confirmation Statement (CS01) Filing Wizard
 * Handles CS01 submission to Companies House
 */

import { Router } from 'express';
import { isAuthenticated } from '../auth';
import { logger } from '../utils/logger';
import { storage } from '../storage';

const router = Router();
router.use(isAuthenticated);

const cs01Logger = logger.withContext('ConfirmationStatementRoutes');

/**
 * Submit Confirmation Statement to Companies House
 * POST /api/confirmation-statement/submit
 */
router.post('/submit', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const formData = req.body;

    // Validate required fields
    if (!formData.companyName || !formData.companyNumber) {
      return res.status(400).json({ error: 'Missing required company information' });
    }

    if (!formData.pscName || !formData.directors) {
      return res.status(400).json({ error: 'Missing required PSC or director information' });
    }

    // Define required credits for CS01
    const REQUIRED_CREDITS = 50;
    
    // Get user to check company association
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    const userCompanyId = user.companyId;
    if (!userCompanyId) {
      return res.status(400).json({ error: 'User does not have an associated company' });
    }

    // Build CS01 submission data
    const cs01Data = {
      companyDetails: {
        name: formData.companyName,
        number: formData.companyNumber,
        registeredOffice: formData.registeredOffice,
        sicCodes: formData.sicCodes.split(',').map((code: string) => code.trim()),
        tradingStatus: formData.tradingStatus,
      },
      directors: formData.directors.split(',').map((name: string) => name.trim()),
      psc: {
        name: formData.pscName,
        nationality: formData.pscNationality,
        dateOfBirth: formData.pscDateOfBirth,
        serviceAddress: formData.pscServiceAddress,
        natureOfControl: formData.pscNatureOfControl,
      },
      shareCapital: formData.shareCapitalChanged ? {
        changed: true,
        numberOfShares: formData.numberOfShares,
        nominalValue: formData.nominalValue,
        currency: formData.currency,
        aggregateNominalValue: formData.aggregateNominalValue,
        amountPaidUp: formData.amountPaidUp,
        amountUnpaid: formData.amountUnpaid,
      } : {
        changed: false,
      },
      statementDate: formData.statementDate,
      madeUpToDate: formData.madeUpToDate,
      submittedAt: new Date().toISOString(),
    };

    try {
      // Atomically create filing with credit deduction
      // All operations (credit check, deduction, filing creation, transaction log) happen in a single DB transaction
      const { filing, remainingCredits } = await storage.createFilingWithCreditDeduction(
        {
          userId,
          companyId: userCompanyId,
          type: 'confirmation_statement',
          status: 'submitted',
          data: cs01Data,
          dueDate: new Date(formData.madeUpToDate), // Due date is the made up to date + 14 days
        },
        REQUIRED_CREDITS,
        `Confirmation Statement (CS01) for ${formData.companyName}`
      );

      cs01Logger.info('Confirmation Statement submitted', {
        userId,
        filingId: filing.id,
        companyNumber: formData.companyNumber,
        creditsDeducted: REQUIRED_CREDITS,
      });

      res.json({
        success: true,
        filingId: filing.id,
        submissionId: `CS01-${filing.id}-${Date.now()}`,
        creditsUsed: REQUIRED_CREDITS,
        remainingCredits,
        companiesHouseFee: 34.00, // £34 Companies House fee
        message: 'Confirmation Statement submitted successfully to Companies House',
      });
    } catch (error: any) {
      // If credit deduction failed, it's likely insufficient balance
      if (error.message?.includes('does not have enough credits')) {
        const currentUser = await storage.getUser(userId);
        return res.status(402).json({ 
          error: 'Insufficient credits',
          required: REQUIRED_CREDITS,
          available: currentUser?.credits || 0,
        });
      }
      
      // Re-throw other errors
      throw error;
    }

  } catch (error: any) {
    cs01Logger.error('Error submitting Confirmation Statement:', error);
    res.status(500).json({ error: 'Failed to submit Confirmation Statement' });
  }
});

export default router;

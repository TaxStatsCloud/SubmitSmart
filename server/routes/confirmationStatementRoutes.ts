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
import { auditService } from '../services/auditService';
import { CS01FilingService } from '../services/filing/CS01FilingService';
import { CS01Data } from '../services/filing/CS01XMLGenerator';
import { getConfirmationStatementCost } from '../../shared/filingCosts';

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

    const { documentIds, paymentMethodId, ...formData } = req.body;

    // Validate required fields
    if (!formData.companyName || !formData.companyNumber) {
      return res.status(400).json({ error: 'Missing required company information' });
    }

    if (!formData.pscName || !formData.directors) {
      return res.status(400).json({ error: 'Missing required PSC or director information' });
    }

    if (!paymentMethodId) {
      return res.status(400).json({ error: 'Payment method is required. Companies House filing fee of £34.00 must be paid.' });
    }

    // Calculate required credits for CS01 using centralized pricing
    const REQUIRED_CREDITS = getConfirmationStatementCost();
    
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
    const cs01Data: CS01Data = {
      companyName: formData.companyName,
      companyNumber: formData.companyNumber,
      registeredOffice: formData.registeredOffice,
      registeredEmailAddress: formData.registeredEmailAddress || 'noreply@example.com',
      sicCodes: formData.sicCodes,
      tradingStatus: formData.tradingStatus,
      tradingOnStockExchange: formData.tradingOnStockExchange || false,
      stockExchangeName: formData.stockExchangeName,
      directors: formData.directors,
      pscName: formData.pscName,
      pscNationality: formData.pscNationality,
      pscDateOfBirth: formData.pscDateOfBirth,
      pscServiceAddress: formData.pscServiceAddress,
      pscNatureOfControl: Array.isArray(formData.pscNatureOfControl) ? formData.pscNatureOfControl : [formData.pscNatureOfControl],
      shareholders: formData.shareholders || [],
      shareClasses: formData.shareClasses || [],
      shareCapitalChanged: formData.shareCapitalChanged || false,
      numberOfShares: formData.numberOfShares,
      nominalValue: formData.nominalValue,
      currency: formData.currency || 'GBP',
      aggregateNominalValue: formData.aggregateNominalValue,
      amountPaidUp: formData.amountPaidUp,
      amountUnpaid: formData.amountUnpaid,
      statutoryRegistersLocation: formData.statutoryRegistersLocation || 'registered_office',
      statutoryRegistersOtherAddress: formData.statutoryRegistersOtherAddress,
      statementOfLawfulPurposes: formData.statementOfLawfulPurposes !== false,
      statementDate: formData.statementDate,
      madeUpToDate: formData.madeUpToDate,
    };

    try {
      // Create initial filing record
      const { filing, remainingCredits } = await storage.createFilingWithCreditDeduction(
        {
          userId,
          companyId: userCompanyId,
          type: 'confirmation_statement',
          status: 'processing',
          data: cs01Data,
          documentIds: documentIds || [],
          dueDate: new Date(formData.madeUpToDate),
        },
        REQUIRED_CREDITS,
        `Confirmation Statement (CS01) for ${formData.companyName}`
      );

      // Submit to Companies House via CS01FilingService
      const submissionResult = await CS01FilingService.submitCS01({
        filingId: filing.id,
        companyId: userCompanyId,
        userId,
        cs01Data,
        paymentMethodId,
      });

      if (!submissionResult.success) {
        // Update filing to failed status
        await storage.updateFiling(filing.id, {
          status: 'failed',
          data: {
            ...cs01Data,
            submissionError: submissionResult.errors?.join('; '),
            xmlResponse: submissionResult.xmlResponse,
          }
        });

        cs01Logger.error('CS01 submission failed', {
          userId,
          filingId: filing.id,
          errors: submissionResult.errors,
        });

        return res.status(400).json({
          success: false,
          error: submissionResult.errors?.[0] || 'Failed to submit to Companies House',
          errors: submissionResult.errors,
        });
      }

      // Update filing with success details
      await storage.updateFiling(filing.id, {
        status: 'submitted',
        data: {
          ...cs01Data,
          submissionId: submissionResult.submissionId,
          companiesHouseReference: submissionResult.companiesHouseReference,
          paymentIntentId: submissionResult.paymentIntentId,
          xmlRequest: submissionResult.xmlRequest,
          xmlResponse: submissionResult.xmlResponse,
        }
      });

      cs01Logger.info('Confirmation Statement submitted successfully', {
        userId,
        filingId: filing.id,
        submissionId: submissionResult.submissionId,
        companiesHouseReference: submissionResult.companiesHouseReference,
        creditsDeducted: REQUIRED_CREDITS,
      });

      await auditService.logFilingSubmission({
        userId,
        filingId: filing.id,
        filingType: 'confirmation_statement',
        status: 'submitted',
        req,
      });

      res.json({
        success: true,
        filingId: filing.id,
        submissionId: submissionResult.submissionId,
        companiesHouseReference: submissionResult.companiesHouseReference,
        creditsUsed: REQUIRED_CREDITS,
        remainingCredits,
        companiesHouseFee: 34.00,
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

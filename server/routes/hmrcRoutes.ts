import { Router } from 'express';
import { hmrcCTService } from '../services/hmrcCTService';
import { ct600ValidationService } from '../services/ct600ValidationService';

const router = Router();

// ============================================================================
// CT600 COMPANY VALIDATION ENDPOINTS
// These endpoints integrate with Companies House for pre-submission validation
// ============================================================================

/**
 * Validate company eligibility for CT600 filing
 * Returns comprehensive validation result including:
 * - Company status and eligibility
 * - Suggested accounting period
 * - Filing deadlines
 * - Warnings and recommendations
 */
router.post('/ct600/validate-company', async (req, res) => {
  try {
    const { companyNumber } = req.body;

    if (!companyNumber) {
      return res.status(400).json({
        message: 'Company number is required',
        isEligible: false
      });
    }

    console.log(`[CT600] Validating company: ${companyNumber}`);
    const validation = await ct600ValidationService.validateForCT600(companyNumber);

    res.json({
      success: true,
      ...validation
    });
  } catch (error: any) {
    console.error('[CT600] Validation error:', error);
    res.status(500).json({
      message: error.message || 'Failed to validate company',
      isEligible: false,
      eligibilityReasons: ['Validation service error']
    });
  }
});

/**
 * Get company lookup by number - quick lookup for auto-complete
 */
router.get('/ct600/lookup/:companyNumber', async (req, res) => {
  try {
    const { companyNumber } = req.params;

    if (!companyNumber || companyNumber.length < 4) {
      return res.status(400).json({
        message: 'Valid company number is required (minimum 4 characters)'
      });
    }

    const validation = await ct600ValidationService.validateForCT600(companyNumber);

    // Return simplified lookup result
    res.json({
      found: !!validation.companyDetails,
      company: validation.companyDetails,
      status: validation.companyStatus,
      isEligible: validation.isEligible,
      warnings: validation.warnings.slice(0, 3) // Return first 3 warnings
    });
  } catch (error: any) {
    if (error.status === 404) {
      return res.json({ found: false, message: 'Company not found' });
    }
    res.status(500).json({ message: error.message });
  }
});

/**
 * Get pre-fill data for CT600 form
 * Returns company details and suggested accounting period
 */
router.get('/ct600/prefill/:companyNumber', async (req, res) => {
  try {
    const { companyNumber } = req.params;

    if (!companyNumber) {
      return res.status(400).json({ message: 'Company number is required' });
    }

    const prefillData = await ct600ValidationService.getPreFillData(companyNumber);

    if (!prefillData) {
      return res.status(404).json({
        message: 'Company not found or data unavailable'
      });
    }

    res.json({
      success: true,
      data: prefillData
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * Validate UTR format
 */
router.post('/ct600/validate-utr', async (req, res) => {
  try {
    const { utr } = req.body;

    if (!utr) {
      return res.status(400).json({ valid: false, message: 'UTR is required' });
    }

    const result = ct600ValidationService.validateUTR(utr);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ valid: false, message: error.message });
  }
});

/**
 * Validate accounting period
 */
router.post('/ct600/validate-period', async (req, res) => {
  try {
    const { startDate, endDate, incorporationDate } = req.body;

    if (!startDate || !endDate) {
      return res.status(400).json({
        valid: false,
        errors: ['Start and end dates are required']
      });
    }

    const result = ct600ValidationService.validateAccountingPeriod(
      startDate,
      endDate,
      incorporationDate
    );

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ valid: false, errors: [error.message] });
  }
});

// ============================================================================
// CT600 SUBMISSION ENDPOINTS (Existing)
// ============================================================================

// HMRC Corporation Tax API routes
router.post('/ct600/submit', async (req, res) => {
  try {
    const { corporationTaxData } = req.body;

    if (!corporationTaxData) {
      return res.status(400).json({
        success: false,
        message: "Corporation tax data is required"
      });
    }

    // Validate data before submission
    const validation = hmrcCTService.validateCT600Data(corporationTaxData);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: "Invalid corporation tax data",
        errors: validation.errors,
        warnings: validation.warnings
      });
    }

    // Include warnings in response even if valid
    console.log(`[CT600] Submitting for company: ${corporationTaxData.companyNumber}`);

    // Generate XML and submit to HMRC
    const xmlData = await hmrcCTService.generateCT600XML(corporationTaxData);
    const submissionResult = await hmrcCTService.submitCT600(xmlData);

    // Parse any HMRC errors for user-friendly messages
    let parsedError = null;
    if (submissionResult.error && !submissionResult.success) {
      // Try to extract error code from response
      const errorMatch = submissionResult.error.match(/(\d{4}):/);
      if (errorMatch) {
        parsedError = hmrcCTService.parseHMRCError(errorMatch[1], submissionResult.error);
      }
    }

    res.json({
      success: submissionResult.success,
      correlationId: submissionResult.correlationId,
      error: parsedError?.userMessage || submissionResult.error,
      errorDetails: parsedError,
      warnings: validation.warnings,
      xmlData: xmlData // Include for testing/debugging
    });
  } catch (error: any) {
    console.error('[CT600] Submission error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
      errorType: 'SERVER_ERROR'
    });
  }
});

router.get('/ct600/status/:correlationId', async (req, res) => {
  try {
    const { correlationId } = req.params;
    
    if (!correlationId) {
      return res.status(400).json({ message: "Correlation ID is required" });
    }
    
    // Poll HMRC for submission status
    const statusResult = await hmrcCTService.pollSubmissionStatus(correlationId);
    
    res.json({ 
      correlationId,
      ...statusResult
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/ct600/test-submission', async (req, res) => {
  try {
    const testResult = await hmrcCTService.generateTestSubmission();
    
    res.json({
      message: "Test submission generated",
      ...testResult
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Generate CT600 XML without submitting
router.post('/ct600/generate-xml', async (req, res) => {
  try {
    const { corporationTaxData } = req.body;
    
    if (!corporationTaxData) {
      return res.status(400).json({ message: "Corporation tax data is required" });
    }
    
    const validation = hmrcCTService.validateCT600Data(corporationTaxData);
    if (!validation.valid) {
      return res.status(400).json({ 
        message: "Invalid corporation tax data",
        errors: validation.errors 
      });
    }
    
    const xmlData = await hmrcCTService.generateCT600XML(corporationTaxData);
    
    res.json({
      message: "CT600 XML generated successfully",
      xmlData,
      validation: validation
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// NEW: Compute tax from financial data and generate CT600
router.post('/ct600/compute-and-generate', async (req, res) => {
  try {
    const { financialData, companyData, options } = req.body;
    
    if (!financialData) {
      return res.status(400).json({ message: "Financial data is required" });
    }
    
    if (!companyData || !companyData.companyName || !companyData.companyNumber) {
      return res.status(400).json({ message: "Company data (name and number) is required" });
    }
    
    const result = await hmrcCTService.computeAndGenerateCT600(
      financialData,
      companyData,
      options
    );
    
    res.json({
      message: "Tax computation and CT600 generation successful",
      computation: result.computation,
      xmlData: result.xmlData
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Compute tax and submit CT600 in one step
router.post('/ct600/compute-and-submit', async (req, res) => {
  try {
    const { financialData, companyData, options } = req.body;
    
    if (!financialData) {
      return res.status(400).json({ message: "Financial data is required" });
    }
    
    if (!companyData || !companyData.companyName || !companyData.companyNumber) {
      return res.status(400).json({ message: "Company data (name and number) is required" });
    }
    
    // Step 1: Compute and generate
    const result = await hmrcCTService.computeAndGenerateCT600(
      financialData,
      companyData,
      options
    );
    
    // Step 2: Submit to HMRC
    const submissionResult = await hmrcCTService.submitCT600(result.xmlData);
    
    res.json({
      message: "Tax computation and submission successful",
      computation: result.computation,
      submission: {
        success: submissionResult.success,
        correlationId: submissionResult.correlationId,
        error: submissionResult.error
      },
      xmlData: result.xmlData
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
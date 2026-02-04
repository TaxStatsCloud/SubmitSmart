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

/**
 * Search companies by name
 * Returns list of matching companies from Companies House
 */
router.get('/ct600/search-companies', async (req, res) => {
  try {
    const { q, limit } = req.query;

    if (!q || typeof q !== 'string' || q.length < 2) {
      return res.status(400).json({
        message: 'Search query must be at least 2 characters'
      });
    }

    const { companiesHouseService } = await import('../services/companiesHouseService');
    const results = await companiesHouseService.searchCompanies(q, Number(limit) || 10);

    // Transform results for easier consumption
    const companies = results.items?.map((item: any) => ({
      companyNumber: item.company_number,
      companyName: item.title,
      companyStatus: item.company_status,
      companyType: item.company_type,
      incorporationDate: item.date_of_creation,
      address: item.address_snippet,
      matchedPreviousCompanyName: item.matched_previous_company_name
    })) || [];

    res.json({
      success: true,
      query: q,
      totalResults: results.total_results || 0,
      companies
    });
  } catch (error: any) {
    console.error('[CT600] Company search error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to search companies'
    });
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

// ============================================================================
// FILING STATUS TRACKING ENDPOINTS
// ============================================================================

/**
 * Get all filings for the current user
 */
router.get('/filings', async (req: any, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const { filingStatusService } = await import('../services/filingStatusService');
    const filings = await filingStatusService.getUserFilings(userId);

    res.json({
      success: true,
      filings
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * Get a specific filing by ID
 */
router.get('/filings/:id', async (req: any, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const filingId = parseInt(req.params.id);
    if (isNaN(filingId)) {
      return res.status(400).json({ message: 'Invalid filing ID' });
    }

    const { filingStatusService } = await import('../services/filingStatusService');
    const filing = await filingStatusService.getFilingById(filingId, userId);

    if (!filing) {
      return res.status(404).json({ message: 'Filing not found' });
    }

    res.json({
      success: true,
      filing
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * Poll HMRC for filing status update
 */
router.post('/filings/:id/poll', async (req: any, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const filingId = parseInt(req.params.id);
    if (isNaN(filingId)) {
      return res.status(400).json({ message: 'Invalid filing ID' });
    }

    const { filingStatusService } = await import('../services/filingStatusService');
    const filing = await filingStatusService.getFilingById(filingId, userId);

    if (!filing) {
      return res.status(404).json({ message: 'Filing not found' });
    }

    const correlationId = filing.data?.correlationId;
    if (!correlationId) {
      return res.status(400).json({ message: 'Filing has no correlation ID - not yet submitted to HMRC' });
    }

    const pollResult = await filingStatusService.pollAndUpdateStatus(filingId, correlationId);

    res.json({
      success: true,
      ...pollResult
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// ============================================================================
// PDF EXPORT ENDPOINT
// ============================================================================

/**
 * Generate PDF summary of CT600 submission
 */
router.post('/ct600/export-pdf', async (req, res) => {
  try {
    const { ct600Data } = req.body;

    if (!ct600Data) {
      return res.status(400).json({ message: 'CT600 data is required' });
    }

    const { ct600PdfService } = await import('../services/ct600PdfService');
    const pdfBuffer = await ct600PdfService.generateCT600Pdf({
      companyName: ct600Data.companyName,
      companyNumber: ct600Data.companyNumber,
      utr: ct600Data.utr,
      accountingPeriodStart: ct600Data.accountingPeriodStart,
      accountingPeriodEnd: ct600Data.accountingPeriodEnd,
      turnover: ct600Data.turnover || 0,
      costOfSales: ct600Data.costOfSales || 0,
      operatingExpenses: ct600Data.operatingExpenses || 0,
      tradingProfit: ct600Data.tradingProfit || 0,
      interestReceived: ct600Data.interestReceived,
      dividendsReceived: ct600Data.dividendsReceived,
      propertyIncome: ct600Data.propertyIncome,
      depreciationAddBack: ct600Data.depreciationAddBack,
      capitalAllowances: ct600Data.capitalAllowances,
      lossesBroughtForward: ct600Data.lossesBroughtForward,
      charitableDonations: ct600Data.charitableDonations,
      profitsBeforeReliefs: ct600Data.profitsBeforeReliefs || 0,
      totalProfitsChargeable: ct600Data.totalProfitsChargeable || 0,
      corporationTaxRate: ct600Data.corporationTaxRate || 19,
      corporationTaxDue: ct600Data.corporationTaxDue || 0,
      marginalRelief: ct600Data.marginalRelief,
      paymentDueDate: ct600Data.paymentDueDate,
      filingDueDate: ct600Data.filingDueDate,
      submissionDate: ct600Data.submissionDate,
      correlationId: ct600Data.correlationId
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=CT600-${ct600Data.companyNumber}-${ct600Data.accountingPeriodEnd}.pdf`);
    res.send(pdfBuffer);
  } catch (error: any) {
    console.error('[CT600] PDF export error:', error);
    res.status(500).json({ message: error.message || 'Failed to generate PDF' });
  }
});

export default router;
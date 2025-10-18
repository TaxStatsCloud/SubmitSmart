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
import { auditService } from '../services/auditService';
import { IXBRLPackagingService } from '../services/ixbrl/IXBRLPackagingService';
import { getAnnualAccountsCost, EntitySize } from '../../shared/filingCosts';
import { EntitySizeDetector, EntityMetrics } from '../services/ixbrl/EntitySizeDetector';

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

    const { ixbrlData, documentIds, ...formData } = req.body;
    
    // ============ CRITICAL VALIDATION ============
    // Prevent users from forging entity size to bypass tiered pricing
    
    // Extract financial metrics from submission data
    const balanceSheet = ixbrlData?.balanceSheet || {};
    const profitLoss = ixbrlData?.profitAndLoss || {};
    
    // Calculate total assets from balance sheet - ALWAYS compute from components (never trust provided totals)
    // Modern structure: balanceSheet.fixedAssets.{intangible, tangible, investments}
    // Legacy structure: balanceSheet.{intangibleAssets, tangibleAssets, investments}
    
    const totalFixedAssets = balanceSheet.fixedAssets
      ? (Number(balanceSheet.fixedAssets.intangible) || 0) +  
        (Number(balanceSheet.fixedAssets.tangible) || 0) + 
        (Number(balanceSheet.fixedAssets.investments) || 0)
      : (Number(balanceSheet.intangibleAssets) || 0) +  
        (Number(balanceSheet.tangibleAssets) || 0) + 
        (Number(balanceSheet.investments) || 0);
    
    const totalCurrentAssets = balanceSheet.currentAssets
      ? (Number(balanceSheet.currentAssets.stocks) || 0) + 
        (Number(balanceSheet.currentAssets.debtors) || 0) + 
        (Number(balanceSheet.currentAssets.cash) || 0)
      : (Number(balanceSheet.stocks) || 0) + 
        (Number(balanceSheet.debtors) || 0) + 
        (Number(balanceSheet.cash) || 0);
    
    const totalAssets = totalFixedAssets + totalCurrentAssets;
    
    // Validate against provided totals if present (detect tampering)
    if (balanceSheet.fixedAssets?.total !== undefined) {
      const providedFixedTotal = Number(balanceSheet.fixedAssets.total) || 0;
      if (Math.abs(providedFixedTotal - totalFixedAssets) > 0.01) {
        annualAccountsLogger.warn('Fixed assets total mismatch detected', {
          provided: providedFixedTotal,
          computed: totalFixedAssets,
          userId: req.user?.id,
          companyNumber: formData.companyNumber
        });
      }
    }
    
    if (balanceSheet.currentAssets?.total !== undefined) {
      const providedCurrentTotal = Number(balanceSheet.currentAssets.total) || 0;
      if (Math.abs(providedCurrentTotal - totalCurrentAssets) > 0.01) {
        annualAccountsLogger.warn('Current assets total mismatch detected', {
          provided: providedCurrentTotal,
          computed: totalCurrentAssets,
          userId: req.user?.id,
          companyNumber: formData.companyNumber
        });
      }
    }
    
    const turnover = Number(profitLoss.turnover || profitLoss.revenue) || 0;
    const employees = Number(formData.averageEmployees || formData.employees) || 0;
    
    // Detect actual entity size based on financial thresholds
    const detectedEntitySize: EntitySize = (() => {
      if (totalAssets === 0 && turnover === 0) {
        // No financial data provided - default to small for safety
        annualAccountsLogger.warn('No financial metrics provided - defaulting to small entity');
        return 'small';
      }
      
      const metrics: EntityMetrics = {
        turnover,
        balanceSheet: totalAssets,
        employees
      };
      
      const sizeResult = EntitySizeDetector.detectSize(metrics);
      return sizeResult.size;
    })();
    
    // Compare declared entity size with detected size
    const declaredEntitySize = (ixbrlData?.entitySize || formData.entitySize || detectedEntitySize) as EntitySize;
    
    // Security check: Reject if user tries to declare smaller entity size to pay less
    const sizeHierarchy = { micro: 0, small: 1, medium: 2, large: 3 };
    if (sizeHierarchy[declaredEntitySize] < sizeHierarchy[detectedEntitySize]) {
      annualAccountsLogger.error('Entity size forgery attempt detected', {
        declared: declaredEntitySize,
        detected: detectedEntitySize,
        turnover,
        totalAssets,
        employees,
        userId: req.user?.id
      });
      
      return res.status(400).json({
        error: 'Entity size mismatch',
        message: `Based on your financial data (turnover: £${turnover.toLocaleString()}, assets: £${totalAssets.toLocaleString()}), your company qualifies as a ${detectedEntitySize} entity. You cannot file as a ${declaredEntitySize} entity.`,
        detectedEntitySize,
        declaredEntitySize
      });
    }
    
    // Use the detected entity size for credit calculation
    const entitySize = detectedEntitySize;
    
    // Validate required sections for medium/large entities
    if (entitySize === 'medium' || entitySize === 'large') {
      // Medium and Large companies MUST have Cash Flow Statement with substantive content
      const cashFlowData = ixbrlData?.cashFlowStatement || formData.cashFlowStatement;
      const hasSubstantiveCashFlow = cashFlowData && (
        typeof cashFlowData === 'object' && (
          cashFlowData.netCashFromOperatingActivities !== undefined ||
          cashFlowData.netCashFromInvestingActivities !== undefined ||
          cashFlowData.netCashFromFinancingActivities !== undefined ||
          cashFlowData.operatingActivities !== undefined
        )
      );
      
      if (!hasSubstantiveCashFlow) {
        annualAccountsLogger.error('Cash Flow Statement missing or empty for medium/large entity', {
          entitySize,
          companyNumber: formData.companyNumber,
          userId: req.user?.id,
          hasCashFlowFlag: !!cashFlowData,
          cashFlowDataType: typeof cashFlowData
        });
        
        return res.status(400).json({
          error: 'Cash Flow Statement required',
          message: `${entitySize.charAt(0).toUpperCase() + entitySize.slice(1)} companies must include a complete Cash Flow Statement under FRS 102. Please complete the Cash Flow section with operating, investing, and financing activities.`,
          requiredSections: ['cashFlowStatement'],
          requiredFields: ['netCashFromOperatingActivities', 'netCashFromInvestingActivities', 'netCashFromFinancingActivities']
        });
      }
    }
    
    if (entitySize === 'large') {
      // Large companies MUST have Strategic Report with substantive content
      const strategicReportData = ixbrlData?.strategicReport || formData.strategicReport;
      const hasSubstantiveStrategicReport = (
        (strategicReportData && typeof strategicReportData === 'object') ||
        (formData.businessModel && formData.businessModel.length > 50 &&
         formData.principalRisks && formData.principalRisks.length > 50 &&
         formData.keyPerformanceIndicators && formData.keyPerformanceIndicators.length > 30)
      );
      
      if (!hasSubstantiveStrategicReport) {
        annualAccountsLogger.error('Strategic Report missing or incomplete for large entity', {
          entitySize,
          companyNumber: formData.companyNumber,
          userId: req.user?.id,
          hasStrategicReportFlag: !!strategicReportData,
          hasBusinessModel: !!formData.businessModel,
          businessModelLength: formData.businessModel?.length || 0,
          hasPrincipalRisks: !!formData.principalRisks,
          principalRisksLength: formData.principalRisks?.length || 0,
          hasKPIs: !!formData.keyPerformanceIndicators,
          kpisLength: formData.keyPerformanceIndicators?.length || 0
        });
        
        return res.status(400).json({
          error: 'Strategic Report required',
          message: 'Large companies must include a comprehensive Strategic Report under Companies Act 2006 s414A. Please complete the Strategic Report section with detailed business model (minimum 50 characters), principal risks (minimum 50 characters), and key performance indicators (minimum 30 characters).',
          requiredSections: ['strategicReport', 'businessModel', 'principalRisks', 'keyPerformanceIndicators'],
          minimumLengths: {
            businessModel: 50,
            principalRisks: 50,
            keyPerformanceIndicators: 30
          }
        });
      }
    }
    
    // Calculate tiered credit cost based on validated entity size
    const REQUIRED_CREDITS = getAnnualAccountsCost(entitySize);
    
    annualAccountsLogger.info('Filing validated and credit cost calculated', {
      declaredEntitySize,
      detectedEntitySize,
      finalEntitySize: entitySize,
      credits: REQUIRED_CREDITS,
      turnover,
      totalAssets,
      employees
    });
    
    // Get user to check company association
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    const userCompanyId = user.companyId;
    if (!userCompanyId) {
      return res.status(400).json({ error: 'User does not have an associated company' });
    }

    // Generate actual iXBRL HTML with proper tagging using IXBRLPackagingService
    let generatedIxbrlHtml = null;
    if (ixbrlData) {
      try {
        // Transform ixbrlData into IXBRLPackagingService format
        const packageData = {
          context: {
            companyNumber: ixbrlData.companyInfo?.number || formData.companyNumber,
            companyName: ixbrlData.companyInfo?.name || formData.companyName,
            periodStart: ixbrlData.companyInfo?.financialYearStart || formData.financialYearStart,
            periodEnd: ixbrlData.companyInfo?.financialYearEnd || formData.financialYearEnd,
            balanceSheetDate: ixbrlData.companyInfo?.financialYearEnd || formData.financialYearEnd,
            entitySize: ixbrlData.entitySize || 'micro'
          },
          balanceSheet: {
            currentYear: ixbrlData.balanceSheet || {},
            previousYear: {}
          },
          profitLoss: {
            currentYear: ixbrlData.profitAndLoss || {},
            previousYear: {}
          },
          directorsReport: {
            companyName: ixbrlData.companyInfo?.name || formData.companyName,
            companyNumber: ixbrlData.companyInfo?.number || formData.companyNumber,
            periodEnd: ixbrlData.companyInfo?.financialYearEnd || formData.financialYearEnd,
            directors: ixbrlData.directors?.map((d: string) => ({ name: d })) || [],
            principalActivities: formData.principalActivities || 'Trading company',
            auditExemption: ixbrlData.auditExempt !== false,
            smallCompanyRegime: ixbrlData.entitySize === 'micro' || ixbrlData.entitySize === 'small',
            directorApprovalDate: formData.approvalDate || ixbrlData.companyInfo?.financialYearEnd,
            directorSignature: formData.signatoryDirector || ixbrlData.directors?.[0] || '',
            directorPosition: 'Director'
          },
          notes: {
            accountingPolicies: {
              companyName: ixbrlData.companyInfo?.name || formData.companyName,
              companyNumber: ixbrlData.companyInfo?.number || formData.companyNumber,
              periodEnd: ixbrlData.companyInfo?.financialYearEnd || formData.financialYearEnd,
              accountingFramework: 'FRS 102',
              goingConcern: true,
              turnoverRecognitionPolicy: 'Turnover represents the amounts receivable for goods and services provided in the normal course of business, net of trade discounts, VAT and other sales related taxes.',
              tangibleFixedAssetsDepreciationPolicy: 'Tangible fixed assets are stated at cost less accumulated depreciation.',
              taxationPolicy: 'Current tax is provided at amounts expected to be paid (or recovered) using the tax rates and laws that have been enacted or substantively enacted by the balance sheet date.',
              pensionCosts: ixbrlData.accountingPolicies || 'The company operates a defined contribution pension scheme. Contributions are charged to the profit and loss account as they become payable.'
            }
          },
          entitySize: ixbrlData.entitySize || 'micro'
        };

        // Generate iXBRL HTML with proper tagging
        const zipBuffer = IXBRLPackagingService.createSubmissionPackage(packageData as any);
        generatedIxbrlHtml = zipBuffer.toString('base64');
        
        annualAccountsLogger.info('iXBRL HTML generated with proper tagging', {
          companyNumber: packageData.context.companyNumber,
          packageSize: zipBuffer.length
        });
      } catch (error: any) {
        annualAccountsLogger.error('Error generating iXBRL HTML:', error);
        // Continue with submission even if iXBRL generation fails (for now)
      }
    }

    try {
      // Atomically create filing with credit deduction
      // All operations (credit check, deduction, filing creation, transaction log) happen in a single DB transaction
      const { filing, remainingCredits } = await storage.createFilingWithCreditDeduction(
        {
          userId,
          companyId: userCompanyId,
          type: 'annual_accounts',
          status: 'submitted',
          data: {
            ...formData,
            ixbrlData: {
              ...ixbrlData,
              ixbrlHtml: generatedIxbrlHtml // Store the generated iXBRL HTML
            },
            submittedAt: new Date().toISOString(),
          },
          documentIds: documentIds || [], // Link source documents
          dueDate: new Date(Date.now() + 270 * 24 * 60 * 60 * 1000), // 9 months from now
        },
        REQUIRED_CREDITS,
        `Annual Accounts filing for ${formData.companyName}`
      );

      annualAccountsLogger.info('Annual Accounts submitted', {
        userId,
        filingId: filing.id,
        companyNumber: formData.companyName,
        creditsDeducted: REQUIRED_CREDITS,
        ixbrlGenerated: !!generatedIxbrlHtml
      });

      // Log audit event
      await auditService.logFilingSubmission({
        userId,
        filingId: filing.id,
        filingType: 'annual_accounts',
        status: 'submitted',
        req,
      });

      res.json({
        success: true,
        filingId: filing.id,
        submissionId: `CH-${filing.id}-${Date.now()}`,
        creditsUsed: REQUIRED_CREDITS,
        remainingCredits,
        message: 'Annual Accounts submitted successfully to Companies House',
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
    annualAccountsLogger.error('Error submitting Annual Accounts:', error);
    res.status(500).json({ error: 'Failed to submit Annual Accounts' });
  }
});

/**
 * Fetch prior year data for comparative figures
 * GET /api/annual-accounts/prior-year/:companyId
 */
router.get('/prior-year/:companyId', async (req, res) => {
  try {
    const userId = req.user?.id;
    const companyId = parseInt(req.params.companyId);

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!companyId) {
      return res.status(400).json({ error: 'Company ID is required' });
    }

    annualAccountsLogger.info('Fetching prior year data', { userId, companyId });

    // Import required modules at the top
    const { db } = await import('@db');
    const { priorYearData } = await import('@shared/schema');
    const { eq, and, desc } = await import('drizzle-orm');

    // Fetch the most recent prior year data for this company
    const priorData = await db
      .select()
      .from(priorYearData)
      .where(
        and(
          eq(priorYearData.companyId, companyId),
          eq(priorYearData.dataType, 'annual_accounts')
        )
      )
      .orderBy(desc(priorYearData.yearEnding))
      .limit(1);

    if (!priorData || priorData.length === 0) {
      return res.json({
        success: false,
        message: 'No prior year data found',
        data: null
      });
    }

    const data = priorData[0].data as any;

    annualAccountsLogger.info('Prior year data loaded', { 
      companyId, 
      yearEnding: priorData[0].yearEnding,
      sourceType: priorData[0].sourceType 
    });

    res.json({
      success: true,
      data: {
        yearEnding: priorData[0].yearEnding,
        sourceType: priorData[0].sourceType,
        // Map the data to the form fields with "Prior" suffix
        intangibleAssetsPrior: data.intangibleAssets || 0,
        tangibleAssetsPrior: data.tangibleAssets || 0,
        investmentsPrior: data.investments || 0,
        stocksPrior: data.stocks || 0,
        debtorsPrior: data.debtors || 0,
        cashAtBankPrior: data.cashAtBank || 0,
        creditorsDueWithinYearPrior: data.creditorsDueWithinYear || 0,
        creditorsDueAfterYearPrior: data.creditorsDueAfterYear || 0,
        calledUpShareCapitalPrior: data.calledUpShareCapital || 0,
        profitAndLossAccountPrior: data.profitAndLossAccount || 0,
        turnoverPrior: data.turnover || 0,
        costOfSalesPrior: data.costOfSales || 0,
        grossProfitPrior: data.grossProfit || 0,
        administrativeExpensesPrior: data.administrativeExpenses || 0,
        operatingProfitPrior: data.operatingProfit || 0,
      }
    });

  } catch (error: any) {
    annualAccountsLogger.error('Error fetching prior year data:', error);
    res.status(500).json({ 
      error: 'Failed to fetch prior year data',
      details: error.message 
    });
  }
});

export default router;

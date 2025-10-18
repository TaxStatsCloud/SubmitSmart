/**
 * CT600 Validation and Computation Logic
 * Implements HMRC rules for Corporation Tax calculations
 */

import { CT600_BOXES, CT600_VALIDATION_RULES, SUPPLEMENTARY_PAGES, PRIOR_YEAR_COMPARISON_ALERTS } from './ct600BoxMapping';

export interface CT600FormData {
  // Company Info (Boxes 1-10)
  companyName: string;
  companyNumber: string;
  utr: string;
  accountingPeriodStart: string;
  accountingPeriodEnd: string;

  // Activity Detection
  hasPropertyIncome: boolean;
  isCloseCompany: boolean;
  hasOverseasIncome: boolean;
  hasControlledForeignCompanies: boolean;
  hasGroupRelief: boolean;
  paidDividends: boolean;
  hasTransferPricing: boolean;

  // Trading Income (Boxes 40-44)
  turnover: number;
  costOfSales?: number;
  operatingExpenses?: number;

  // Non-Trading Income (Boxes 50-55)
  interestReceived?: number;
  dividendsReceived?: number;
  propertyIncome?: number;

  // Adjustments (Boxes 70-90)
  depreciationAddBack?: number;
  capitalAllowances?: number;
  entertainmentExpenses?: number;

  // Reliefs (Boxes 100-115)
  lossesBroughtForward?: number;
  rdReliefClaim?: number;
  charitableDonations?: number;

  // Associated Companies (Box 140)
  numberOfAssociatedCompanies: number;

  // Prior Year Data (for comparison)
  turnoverPrior?: number;
  costOfSalesPrior?: number;
  operatingExpensesPrior?: number;
  interestReceivedPrior?: number;
  dividendsReceivedPrior?: number;
  propertyIncomePrior?: number;
  depreciationAddBackPrior?: number;
  capitalAllowancesPrior?: number;
  lossesBroughtForwardPrior?: number;
  rdReliefClaimPrior?: number;
  charitableDonationsPrior?: number;
}

export interface CT600Computation {
  // Trading Profit Calculation
  grossProfit: number; // Box 42
  tradingProfit: number; // Box 44
  
  // Total Income
  totalTradingIncome: number;
  totalNonTradingIncome: number;
  totalIncome: number;
  
  // Adjustments
  totalAddBacks: number;
  totalDeductions: number;
  
  // Chargeable Profits
  adjustedTradingProfit: number;
  profitsBeforeReliefs: number; // Box 120
  totalProfitsChargeable: number; // Box 125
  
  // Tax Calculation
  applicableRate: number;
  corporationTaxBeforeMarginalRelief: number;
  marginalRelief: number; // Box 150
  corporationTaxDue: number; // Box 155
  
  // Thresholds (adjusted for associated companies)
  lowerThreshold: number;
  upperThreshold: number;
  effectiveRate: number;
  
  // Payment Info
  paymentDueDate: string;
  filingDueDate: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: Array<{
    field: string;
    message: string;
    boxNumber?: string;
  }>;
  warnings: Array<{
    field: string;
    message: string;
    severity: 'low' | 'medium' | 'high';
  }>;
  requiredSupplementaryPages: string[];
}

/**
 * Validate CT600 form data against HMRC rules
 */
export function validateCT600(data: CT600FormData): ValidationResult {
  const errors: ValidationResult['errors'] = [];
  const warnings: ValidationResult['warnings'] = [];
  const requiredSupplementaryPages: string[] = [];

  // Apply box-level validation rules
  CT600_VALIDATION_RULES.forEach(({ field, rule, message }) => {
    const value = data[field as keyof CT600FormData];
    const result = rule(value, data);
    
    if (result === false) {
      errors.push({
        field,
        message,
        boxNumber: findBoxNumber(field)
      });
    } else if (typeof result === 'string') {
      warnings.push({
        field,
        message: result,
        severity: 'medium'
      });
    }
  });

  // Check required supplementary pages
  SUPPLEMENTARY_PAGES.forEach(page => {
    const triggerValue = data[page.triggerField as keyof CT600FormData];
    if (page.triggerCondition(triggerValue)) {
      requiredSupplementaryPages.push(`${page.code}: ${page.name}`);
    }
  });

  // Prior year comparison warnings
  if (data.turnoverPrior) {
    PRIOR_YEAR_COMPARISON_ALERTS.forEach(alert => {
      const currentValue = data[alert.field as keyof CT600FormData] as number || 0;
      const priorField = `${alert.field}Prior` as keyof CT600FormData;
      const priorValue = data[priorField] as number || 0;
      
      if (priorValue > 0) {
        const percentChange = Math.abs((currentValue - priorValue) / priorValue * 100);
        if (percentChange > alert.threshold) {
          warnings.push({
            field: alert.field,
            message: `${alert.message} (Change: ${percentChange.toFixed(1)}%)`,
            severity: percentChange > 50 ? 'high' : 'medium'
          });
        }
      }
    });
  }

  // Specific business logic validations
  const computation = computeCT600Tax(data);
  
  // Check if corporation tax rate seems incorrect
  if (computation.totalProfitsChargeable > 0) {
    if (computation.effectiveRate < 19 || computation.effectiveRate > 25) {
      warnings.push({
        field: 'corporationTaxDue',
        message: `Effective tax rate of ${computation.effectiveRate.toFixed(2)}% is outside normal range (19-25%). Please review.`,
        severity: 'high'
      });
    }
  }

  // Warning if no capital allowances claimed but depreciation added back
  if ((data.depreciationAddBack || 0) > 0 && (!data.capitalAllowances || data.capitalAllowances === 0)) {
    warnings.push({
      field: 'capitalAllowances',
      message: 'You added back depreciation but claimed no capital allowances. Most businesses can claim capital allowances - are you sure this is correct?',
      severity: 'medium'
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    requiredSupplementaryPages
  };
}

/**
 * Compute Corporation Tax based on HMRC rules
 */
export function computeCT600Tax(data: CT600FormData): CT600Computation {
  // Step 1: Calculate Trading Profit (Box 44)
  const grossProfit = (data.turnover || 0) - (data.costOfSales || 0);
  const tradingProfit = grossProfit - (data.operatingExpenses || 0);

  // Step 2: Calculate Non-Trading Income
  const totalNonTradingIncome = 
    (data.interestReceived || 0) +
    (data.propertyIncome || 0);
  // Note: UK dividends usually exempt, not added to taxable profits

  // Step 3: Apply Adjustments
  const totalAddBacks = 
    (data.depreciationAddBack || 0) +
    (data.entertainmentExpenses || 0);

  const totalDeductions = 
    (data.capitalAllowances || 0);

  const adjustedTradingProfit = tradingProfit + totalAddBacks - totalDeductions;

  // Step 4: Calculate Profits Before Reliefs (Box 120)
  const profitsBeforeReliefs = adjustedTradingProfit + totalNonTradingIncome;

  // Step 5: Apply Reliefs
  const totalReliefs = 
    (data.lossesBroughtForward || 0) +
    (data.rdReliefClaim || 0) +
    (data.charitableDonations || 0);

  // Step 6: Total Profits Chargeable to CT (Box 125)
  const totalProfitsChargeable = Math.max(0, profitsBeforeReliefs - totalReliefs);

  // Step 7: Determine Tax Thresholds (adjust for associated companies)
  const associatesMultiplier = 1 + (data.numberOfAssociatedCompanies || 0);
  const lowerThreshold = 50000 / associatesMultiplier;
  const upperThreshold = 250000 / associatesMultiplier;

  // Step 8: Calculate Corporation Tax
  let corporationTaxBeforeMarginalRelief = 0;
  let marginalRelief = 0;
  let applicableRate = 0;

  if (totalProfitsChargeable <= lowerThreshold) {
    // Small Profits Rate: 19%
    applicableRate = 19;
    corporationTaxBeforeMarginalRelief = totalProfitsChargeable * 0.19;
  } else if (totalProfitsChargeable >= upperThreshold) {
    // Main Rate: 25%
    applicableRate = 25;
    corporationTaxBeforeMarginalRelief = totalProfitsChargeable * 0.25;
  } else {
    // Marginal Relief applies
    applicableRate = 25; // Start with main rate
    corporationTaxBeforeMarginalRelief = totalProfitsChargeable * 0.25;
    
    // Marginal Relief Calculation (Box 150)
    // Formula: (Upper Limit - Profits) × Basic Profits ÷ Profits × Marginal Relief Fraction (currently 3/200)
    const marginalReliefFraction = 3 / 200;
    marginalRelief = (upperThreshold - totalProfitsChargeable) * marginalReliefFraction;
  }

  const corporationTaxDue = Math.max(0, corporationTaxBeforeMarginalRelief - marginalRelief);
  const effectiveRate = totalProfitsChargeable > 0 ? (corporationTaxDue / totalProfitsChargeable) * 100 : 0;

  // Step 9: Calculate Due Dates
  let paymentDueDate = '';
  let filingDueDate = '';
  
  if (data.accountingPeriodEnd) {
    const periodEnd = new Date(data.accountingPeriodEnd);
    
    // Validate that we have a valid date
    if (!isNaN(periodEnd.getTime())) {
      // Payment due: 9 months and 1 day after period end
      const paymentDue = new Date(periodEnd);
      paymentDue.setMonth(paymentDue.getMonth() + 9);
      paymentDue.setDate(paymentDue.getDate() + 1);
      
      // Filing due: 12 months after period end
      const filingDue = new Date(periodEnd);
      filingDue.setFullYear(filingDue.getFullYear() + 1);
      
      paymentDueDate = paymentDue.toISOString().split('T')[0];
      filingDueDate = filingDue.toISOString().split('T')[0];
    }
  }

  return {
    grossProfit,
    tradingProfit,
    totalTradingIncome: data.turnover || 0,
    totalNonTradingIncome,
    totalIncome: (data.turnover || 0) + totalNonTradingIncome,
    totalAddBacks,
    totalDeductions,
    adjustedTradingProfit,
    profitsBeforeReliefs,
    totalProfitsChargeable,
    applicableRate,
    corporationTaxBeforeMarginalRelief,
    marginalRelief,
    corporationTaxDue,
    lowerThreshold,
    upperThreshold,
    effectiveRate,
    paymentDueDate,
    filingDueDate
  };
}

/**
 * Find box number for a given field name
 */
function findBoxNumber(fieldName: string): string | undefined {
  const boxEntry = Object.entries(CT600_BOXES).find(([key, box]) => 
    box.label.toLowerCase().replace(/\s+/g, '') === fieldName.toLowerCase().replace(/\s+/g, '')
  );
  return boxEntry?.[1].boxNumber;
}

/**
 * Generate box-by-box breakdown for review
 */
export function generateBoxBreakdown(data: CT600FormData, computation: CT600Computation) {
  return {
    companyInfo: [
      { box: "1", label: "Company Name", value: data.companyName },
      { box: "2", label: "Company Number", value: data.companyNumber },
      { box: "3", label: "UTR", value: data.utr },
      { box: "30", label: "Period Start", value: data.accountingPeriodStart },
      { box: "35", label: "Period End", value: data.accountingPeriodEnd },
    ],
    tradingIncome: [
      { box: "40", label: "Turnover", value: data.turnover, currency: true },
      { box: "41", label: "Cost of Sales", value: data.costOfSales, currency: true },
      { box: "42", label: "Gross Profit", value: computation.grossProfit, currency: true, calculated: true },
      { box: "43", label: "Operating Expenses", value: data.operatingExpenses, currency: true },
      { box: "44", label: "Trading Profit", value: computation.tradingProfit, currency: true, calculated: true },
    ],
    nonTradingIncome: [
      { box: "50", label: "Interest Received", value: data.interestReceived, currency: true },
      { box: "51", label: "Dividends Received (UK)", value: data.dividendsReceived, currency: true },
      { box: "52", label: "Property Income", value: data.propertyIncome, currency: true },
    ],
    adjustments: [
      { box: "70", label: "Depreciation Add-back", value: data.depreciationAddBack, currency: true },
      { box: "71", label: "Capital Allowances", value: data.capitalAllowances, currency: true },
      { box: "72", label: "Entertainment Expenses", value: data.entertainmentExpenses, currency: true },
    ],
    reliefs: [
      { box: "100", label: "Losses Brought Forward", value: data.lossesBroughtForward, currency: true },
      { box: "101", label: "R&D Tax Relief", value: data.rdReliefClaim, currency: true },
      { box: "102", label: "Charitable Donations", value: data.charitableDonations, currency: true },
    ],
    taxComputation: [
      { box: "120", label: "Profits Before Reliefs", value: computation.profitsBeforeReliefs, currency: true, calculated: true },
      { box: "125", label: "Total Profits Chargeable", value: computation.totalProfitsChargeable, currency: true, calculated: true },
      { box: "140", label: "Associated Companies", value: data.numberOfAssociatedCompanies },
      { box: "145", label: "CT Liability (Before Relief)", value: computation.corporationTaxBeforeMarginalRelief, currency: true, calculated: true },
      { box: "150", label: "Marginal Relief", value: computation.marginalRelief, currency: true, calculated: true },
      { box: "155", label: "Tax Payable", value: computation.corporationTaxDue, currency: true, calculated: true, highlight: true },
    ],
  };
}

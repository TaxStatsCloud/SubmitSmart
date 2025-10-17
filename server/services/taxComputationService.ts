/**
 * Corporation Tax Computation Service
 * Implements UK Corporation Tax rules for computing tax liability
 * 
 * Tax Rates (2024/25):
 * - Small Profits Rate (SPR): 19% for profits ≤ £50,000
 * - Main Rate: 25% for profits ≥ £250,000
 * - Marginal Relief: Tapered rate for profits between £50,000-£250,000
 * 
 * References:
 * - HMRC CT600 Guide
 * - Corporation Tax Act 2010
 * - Finance Act 2023
 */

export interface FinancialData {
  // Trading income
  turnover: number;
  costOfSales: number;
  operatingExpenses: number;
  
  // Other income
  interestReceived?: number;
  dividendsReceived?: number;
  
  // Deductions & Adjustments
  depreciationAddBack?: number; // Add back depreciation
  capitalAllowances?: number; // Deduct capital allowances
  
  // Reliefs
  lossesBroughtForward?: number;
  rdReliefClaim?: number; // R&D enhanced deduction
  patentBoxRelief?: number;
  
  // Other
  charitableDonations?: number;
  groupRelief?: number;
  
  // Associated companies (for marginal relief threshold adjustment)
  numberOfAssociatedCompanies?: number; // Default 0 if not provided
  
  // Period information
  accountingPeriodStart: string;
  accountingPeriodEnd: string;
  numberOfDays?: number;
}

export interface TaxComputation {
  // Step 1: Calculate trading profit
  tradingProfit: number;
  
  // Step 2: Add other income
  totalIncome: number;
  
  // Step 3: Apply deductions
  profitsBeforeDeductions: number;
  
  // Step 4: Calculate chargeable profits
  chargeableProfits: number;
  
  // Step 5: Calculate corporation tax
  corporationTaxRate: number;
  corporationTaxBeforeReliefs: number;
  
  // Step 6: Apply tax reliefs
  totalReliefs: number;
  corporationTaxDue: number;
  
  // Breakdown for CT600
  breakdown: {
    tradingProfitCalculation: {
      turnover: number;
      costOfSales: number;
      operatingExpenses: number;
      tradingProfit: number;
    };
    adjustments: {
      depreciationAddBack: number;
      capitalAllowances: number;
      netAdjustment: number;
    };
    otherIncome: {
      interestReceived: number;
      dividendsReceived: number;
      total: number;
    };
    deductions: {
      lossesBroughtForward: number;
      charitableDonations: number;
      groupRelief: number;
      total: number;
    };
    taxCalculation: {
      chargeableProfits: number;
      applicableRate: number;
      taxBeforeReliefs: number;
      marginalReliefApplied: boolean;
      marginalReliefAmount: number;
    };
    reliefs: {
      rdRelief: number;
      patentBoxRelief: number;
      total: number;
    };
  };
  
  // Summary for display
  summary: {
    effectiveTaxRate: number; // Actual tax / profit
    taxBalance: number; // Amount due to HMRC
  };
}

export class TaxComputationService {
  // 2024/25 UK Corporation Tax thresholds
  private readonly SMALL_PROFITS_LIMIT = 50000;
  private readonly UPPER_PROFITS_LIMIT = 250000;
  private readonly SMALL_PROFITS_RATE = 0.19; // 19%
  private readonly MAIN_RATE = 0.25; // 25%
  private readonly MARGINAL_RELIEF_FRACTION = 3/200; // 0.015
  
  /**
   * Compute corporation tax from financial data
   */
  public computeTax(data: FinancialData): TaxComputation {
    // Step 1: Calculate trading profit
    const tradingProfit = this.calculateTradingProfit(data);
    
    // Step 2: Add other income
    const totalIncome = this.calculateTotalIncome(tradingProfit, data);
    
    // Step 3: Apply tax adjustments (depreciation, capital allowances)
    const adjustedProfit = this.applyAdjustments(totalIncome, data);
    
    // Step 4: Apply deductions (losses, donations, group relief)
    const profitsBeforeDeductions = adjustedProfit;
    const chargeableProfits = this.applyDeductions(adjustedProfit, data);
    
    // Step 5: Calculate corporation tax (with marginal relief if applicable)
    const taxCalculation = this.calculateCorporationTax(chargeableProfits, data);
    
    // Step 6: Apply tax reliefs (R&D, Patent Box)
    const totalReliefs = (data.rdReliefClaim || 0) + (data.patentBoxRelief || 0);
    const corporationTaxDue = Math.max(0, taxCalculation.taxAmount - totalReliefs);
    
    // Build comprehensive breakdown
    const breakdown = this.buildBreakdown(data, tradingProfit, totalIncome, adjustedProfit, chargeableProfits, taxCalculation, totalReliefs);
    
    return {
      tradingProfit,
      totalIncome,
      profitsBeforeDeductions,
      chargeableProfits,
      corporationTaxRate: taxCalculation.rate,
      corporationTaxBeforeReliefs: taxCalculation.taxAmount,
      totalReliefs,
      corporationTaxDue,
      breakdown,
      summary: {
        effectiveTaxRate: tradingProfit > 0 ? (corporationTaxDue / tradingProfit) * 100 : 0,
        taxBalance: corporationTaxDue
      }
    };
  }
  
  /**
   * Calculate trading profit from P&L
   */
  private calculateTradingProfit(data: FinancialData): number {
    const grossProfit = data.turnover - data.costOfSales;
    const tradingProfit = grossProfit - data.operatingExpenses;
    return tradingProfit;
  }
  
  /**
   * Add other income sources
   */
  private calculateTotalIncome(tradingProfit: number, data: FinancialData): number {
    const interestReceived = data.interestReceived || 0;
    const dividendsReceived = data.dividendsReceived || 0;
    
    return tradingProfit + interestReceived + dividendsReceived;
  }
  
  /**
   * Apply tax adjustments (add back depreciation, deduct capital allowances)
   */
  private applyAdjustments(income: number, data: FinancialData): number {
    const depreciationAddBack = data.depreciationAddBack || 0;
    const capitalAllowances = data.capitalAllowances || 0;
    
    // Add back depreciation (not tax deductible)
    // Deduct capital allowances (tax deductible alternative)
    return income + depreciationAddBack - capitalAllowances;
  }
  
  /**
   * Apply deductions (losses, donations, group relief)
   */
  private applyDeductions(adjustedProfit: number, data: FinancialData): number {
    const lossesBroughtForward = Math.min(data.lossesBroughtForward || 0, adjustedProfit);
    const charitableDonations = data.charitableDonations || 0;
    const groupRelief = data.groupRelief || 0;
    
    let chargeableProfits = adjustedProfit - lossesBroughtForward;
    chargeableProfits = Math.max(0, chargeableProfits - charitableDonations);
    chargeableProfits = Math.max(0, chargeableProfits - groupRelief);
    
    return chargeableProfits;
  }
  
  /**
   * Calculate corporation tax with marginal relief
   * 
   * Tax rates:
   * - ≤ £50,000: 19% (Small Profits Rate)
   * - £50,001 - £249,999: Marginal relief applies
   * - ≥ £250,000: 25% (Main Rate)
   * 
   * HMRC Marginal Relief Formula (CTA 2010 s.19):
   * MR = (UpperLimit − AugmentedProfits) × (ChargeableProfits ÷ AugmentedProfits) × 3/200
   * 
   * Where:
   * - AugmentedProfits = ChargeableProfits + Dividends
   * - Thresholds are divided by (1 + number of associated companies)
   */
  private calculateCorporationTax(chargeableProfits: number, data: FinancialData): {
    rate: number;
    taxAmount: number;
    marginalReliefApplied: boolean;
    marginalReliefAmount: number;
  } {
    // Step 1: Adjust thresholds for associated companies
    const numberOfAssociatedCompanies = data.numberOfAssociatedCompanies || 0;
    const associatedDivisor = 1 + numberOfAssociatedCompanies;
    
    const baseLowerLimit = this.SMALL_PROFITS_LIMIT / associatedDivisor;
    const baseUpperLimit = this.UPPER_PROFITS_LIMIT / associatedDivisor;
    
    // Step 2: Adjust thresholds for short accounting periods
    const daysInPeriod = data.numberOfDays || this.calculateDays(data.accountingPeriodStart, data.accountingPeriodEnd);
    const periodFraction = daysInPeriod / 365;
    
    const adjustedLowerLimit = baseLowerLimit * periodFraction;
    const adjustedUpperLimit = baseUpperLimit * periodFraction;
    
    // Step 3: Calculate augmented profits (chargeable profits + dividends)
    const dividendsReceived = data.dividendsReceived || 0;
    const augmentedProfits = chargeableProfits + dividendsReceived;
    
    // Step 4: Determine tax based on augmented profits thresholds
    if (augmentedProfits <= adjustedLowerLimit) {
      // Small company - 19%
      return {
        rate: this.SMALL_PROFITS_RATE,
        taxAmount: chargeableProfits * this.SMALL_PROFITS_RATE,
        marginalReliefApplied: false,
        marginalReliefAmount: 0
      };
    }
    
    if (augmentedProfits >= adjustedUpperLimit) {
      // Large company - 25%
      return {
        rate: this.MAIN_RATE,
        taxAmount: chargeableProfits * this.MAIN_RATE,
        marginalReliefApplied: false,
        marginalReliefAmount: 0
      };
    }
    
    // Step 5: Apply marginal relief (HMRC statutory formula)
    // MR = (UpperLimit − AugmentedProfits) × (ChargeableProfits ÷ AugmentedProfits) × 3/200
    const marginalReliefAmount = 
      (adjustedUpperLimit - augmentedProfits) * 
      (chargeableProfits / augmentedProfits) * 
      this.MARGINAL_RELIEF_FRACTION;
    
    const taxAtMainRate = chargeableProfits * this.MAIN_RATE;
    const taxAfterMarginalRelief = taxAtMainRate - marginalReliefAmount;
    
    // Effective rate after marginal relief
    const effectiveRate = taxAfterMarginalRelief / chargeableProfits;
    
    return {
      rate: effectiveRate,
      taxAmount: taxAfterMarginalRelief,
      marginalReliefApplied: true,
      marginalReliefAmount
    };
  }
  
  /**
   * Calculate number of days in accounting period
   */
  private calculateDays(startDate: string, endDate: string): number {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays + 1; // Include end date
  }
  
  /**
   * Build detailed breakdown for CT600 and display
   */
  private buildBreakdown(
    data: FinancialData,
    tradingProfit: number,
    totalIncome: number,
    adjustedProfit: number,
    chargeableProfits: number,
    taxCalculation: { rate: number; taxAmount: number; marginalReliefApplied: boolean; marginalReliefAmount: number },
    totalReliefs: number
  ) {
    return {
      tradingProfitCalculation: {
        turnover: data.turnover,
        costOfSales: data.costOfSales,
        operatingExpenses: data.operatingExpenses,
        tradingProfit
      },
      adjustments: {
        depreciationAddBack: data.depreciationAddBack || 0,
        capitalAllowances: data.capitalAllowances || 0,
        netAdjustment: (data.depreciationAddBack || 0) - (data.capitalAllowances || 0)
      },
      otherIncome: {
        interestReceived: data.interestReceived || 0,
        dividendsReceived: data.dividendsReceived || 0,
        total: (data.interestReceived || 0) + (data.dividendsReceived || 0)
      },
      deductions: {
        lossesBroughtForward: data.lossesBroughtForward || 0,
        charitableDonations: data.charitableDonations || 0,
        groupRelief: data.groupRelief || 0,
        total: (data.lossesBroughtForward || 0) + (data.charitableDonations || 0) + (data.groupRelief || 0)
      },
      taxCalculation: {
        chargeableProfits,
        dividendsReceived: data.dividendsReceived || 0,
        augmentedProfits: chargeableProfits + (data.dividendsReceived || 0),
        numberOfAssociatedCompanies: data.numberOfAssociatedCompanies || 0,
        applicableRate: taxCalculation.rate * 100,
        taxBeforeReliefs: taxCalculation.taxAmount,
        marginalReliefApplied: taxCalculation.marginalReliefApplied,
        marginalReliefAmount: taxCalculation.marginalReliefAmount
      },
      reliefs: {
        rdRelief: data.rdReliefClaim || 0,
        patentBoxRelief: data.patentBoxRelief || 0,
        total: totalReliefs
      }
    };
  }
  
  /**
   * Format tax computation for CT600 submission
   */
  public formatForCT600(computation: TaxComputation, companyData: any) {
    return {
      companyName: companyData.companyName,
      companyNumber: companyData.companyNumber,
      accountingPeriodStart: companyData.accountingPeriodStart,
      accountingPeriodEnd: companyData.accountingPeriodEnd,
      
      // Turnover
      turnover: computation.breakdown.tradingProfitCalculation.turnover,
      
      // Trading profit
      profit: computation.tradingProfit,
      
      // Deductions
      lossesBroughtForward: computation.breakdown.deductions.lossesBroughtForward,
      
      // Taxable profit
      taxableProfit: computation.chargeableProfits,
      
      // Tax calculation
      taxRate: computation.corporationTaxRate * 100,
      corporationTaxDue: computation.corporationTaxDue,
      taxBalance: computation.summary.taxBalance,
      
      // Additional info for declaration
      authorizedPerson: companyData.authorizedPerson || 'Director'
    };
  }
  
  /**
   * Validate financial data before computation
   */
  public validateFinancialData(data: FinancialData): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (data.turnover < 0) errors.push('Turnover cannot be negative');
    if (data.costOfSales < 0) errors.push('Cost of sales cannot be negative');
    if (data.operatingExpenses < 0) errors.push('Operating expenses cannot be negative');
    
    if (!data.accountingPeriodStart) errors.push('Accounting period start date is required');
    if (!data.accountingPeriodEnd) errors.push('Accounting period end date is required');
    
    // Validate period dates
    if (data.accountingPeriodStart && data.accountingPeriodEnd) {
      const start = new Date(data.accountingPeriodStart);
      const end = new Date(data.accountingPeriodEnd);
      
      if (start >= end) {
        errors.push('Accounting period end date must be after start date');
      }
      
      const days = this.calculateDays(data.accountingPeriodStart, data.accountingPeriodEnd);
      if (days > 366) {
        errors.push('Accounting period cannot exceed 366 days');
      }
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
}

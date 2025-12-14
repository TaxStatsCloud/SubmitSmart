/**
 * CT600 Corporation Tax Validation Service
 *
 * Integrates with Companies House to validate company eligibility
 * and pre-fill company data before CT600 submission.
 *
 * This service addresses key reliability issues:
 * 1. Company validation before HMRC submission
 * 2. Eligibility checking (active status, correct entity type)
 * 3. Accounting reference date verification
 * 4. Filing history analysis for context
 */

import { companiesHouseService, type CompanyInfo, type FilingHistory } from './companiesHouseService';

export interface CT600EligibilityResult {
  isEligible: boolean;
  companyStatus: 'active' | 'dissolved' | 'liquidation' | 'dormant' | 'unknown';
  eligibilityReasons: string[];
  warnings: string[];
  companyDetails: {
    companyName: string;
    companyNumber: string;
    registeredAddress: string;
    incorporationDate: string;
    companyType: string;
    sicCodes: string[];
  } | null;
  accountsInfo: {
    accountingReferenceDate: string | null;
    lastAccountsFiled: string | null;
    lastAccountsType: string | null;
    nextAccountsDue: string | null;
    nextAccountsMadeUpTo: string | null;
  } | null;
  filingDeadlines: {
    ct600Deadline: string | null;
    paymentDeadline: string | null;
    annualAccountsDeadline: string | null;
    confirmationStatementDeadline: string | null;
  } | null;
  lastCT600Filed: {
    date: string;
    periodEnd: string;
  } | null;
  suggestedAccountingPeriod: {
    start: string;
    end: string;
  } | null;
}

export interface CT600PreFillData {
  companyName: string;
  companyNumber: string;
  registeredAddress: string;
  accountingPeriodStart: string;
  accountingPeriodEnd: string;
  utr: string | null; // UTR must be provided by user - cannot be looked up
  suggestedFilingDeadline: string | null;
  suggestedPaymentDeadline: string | null;
  companyType: string;
  isCloseCompany: boolean;
  sicCodes: string[];
}

export class CT600ValidationService {
  /**
   * Validate company eligibility for CT600 filing
   * This is the primary validation method that should be called before any CT600 submission
   */
  async validateForCT600(companyNumber: string): Promise<CT600EligibilityResult> {
    const result: CT600EligibilityResult = {
      isEligible: false,
      companyStatus: 'unknown',
      eligibilityReasons: [],
      warnings: [],
      companyDetails: null,
      accountsInfo: null,
      filingDeadlines: null,
      lastCT600Filed: null,
      suggestedAccountingPeriod: null
    };

    try {
      // Normalize company number (pad to 8 characters)
      const normalizedNumber = companyNumber.padStart(8, '0');

      // Step 1: Fetch company information from Companies House
      console.log(`[CT600 Validation] Fetching company info for: ${normalizedNumber}`);
      const companyInfo = await companiesHouseService.getCompanyInfo(normalizedNumber);

      // Step 2: Map company status
      result.companyStatus = this.mapCompanyStatus(companyInfo.company_status);

      // Step 3: Populate company details
      result.companyDetails = {
        companyName: companyInfo.company_name,
        companyNumber: companyInfo.company_number,
        registeredAddress: this.formatAddress(companyInfo.registered_office_address),
        incorporationDate: companyInfo.date_of_creation,
        companyType: companyInfo.type || 'ltd',
        sicCodes: companyInfo.sic_codes || []
      };

      // Step 4: Populate accounts info
      if (companyInfo.accounts) {
        result.accountsInfo = {
          accountingReferenceDate: companyInfo.accounts.accounting_reference_date
            ? `${companyInfo.accounts.accounting_reference_date.day}/${companyInfo.accounts.accounting_reference_date.month}`
            : null,
          lastAccountsFiled: companyInfo.accounts.last_accounts?.made_up_to || null,
          lastAccountsType: companyInfo.accounts.last_accounts?.type || null,
          nextAccountsDue: companyInfo.accounts.next_due || null,
          nextAccountsMadeUpTo: companyInfo.accounts.next_made_up_to || null
        };
      }

      // Step 5: Calculate filing deadlines
      result.filingDeadlines = await this.calculateFilingDeadlines(companyInfo);

      // Step 6: Fetch filing history to find last CT600
      try {
        const filingHistory = await companiesHouseService.getFilingHistory(normalizedNumber, 50);
        result.lastCT600Filed = this.findLastCT600(filingHistory);
      } catch (historyError) {
        console.warn('[CT600 Validation] Could not fetch filing history:', historyError);
        result.warnings.push('Unable to retrieve filing history');
      }

      // Step 7: Suggest accounting period
      result.suggestedAccountingPeriod = this.suggestAccountingPeriod(companyInfo, result.lastCT600Filed);

      // Step 8: Determine eligibility
      const eligibilityCheck = this.checkEligibility(companyInfo, result);
      result.isEligible = eligibilityCheck.eligible;
      result.eligibilityReasons = eligibilityCheck.reasons;
      result.warnings = [...result.warnings, ...eligibilityCheck.warnings];

      console.log(`[CT600 Validation] Company ${normalizedNumber} eligibility: ${result.isEligible}`);

    } catch (error: any) {
      console.error('[CT600 Validation] Error:', error);

      // Handle specific error cases
      if (error.status === 404) {
        result.eligibilityReasons.push('Company not found in Companies House register');
      } else if (error.message?.includes('disabled')) {
        result.eligibilityReasons.push('Companies House API is currently unavailable');
        result.warnings.push('Validation skipped - please verify company details manually');
      } else {
        result.eligibilityReasons.push(`Validation error: ${error.message || 'Unknown error'}`);
      }
    }

    return result;
  }

  /**
   * Get pre-fill data for CT600 form
   */
  async getPreFillData(companyNumber: string): Promise<CT600PreFillData | null> {
    try {
      const validation = await this.validateForCT600(companyNumber);

      if (!validation.companyDetails) {
        return null;
      }

      // Determine if likely a close company (most UK small companies are)
      const isCloseCompany = this.isLikelyCloseCompany(validation.companyDetails.companyType);

      return {
        companyName: validation.companyDetails.companyName,
        companyNumber: validation.companyDetails.companyNumber,
        registeredAddress: validation.companyDetails.registeredAddress,
        accountingPeriodStart: validation.suggestedAccountingPeriod?.start || '',
        accountingPeriodEnd: validation.suggestedAccountingPeriod?.end || '',
        utr: null, // UTR cannot be obtained from Companies House
        suggestedFilingDeadline: validation.filingDeadlines?.ct600Deadline || null,
        suggestedPaymentDeadline: validation.filingDeadlines?.paymentDeadline || null,
        companyType: validation.companyDetails.companyType,
        isCloseCompany,
        sicCodes: validation.companyDetails.sicCodes
      };
    } catch (error) {
      console.error('[CT600 Validation] Error getting pre-fill data:', error);
      return null;
    }
  }

  /**
   * Validate UTR format (basic validation - cannot verify against HMRC)
   */
  validateUTR(utr: string): { valid: boolean; message: string } {
    // Remove any spaces or dashes
    const cleanUTR = utr.replace(/[\s-]/g, '');

    // UTR should be exactly 10 digits
    if (!/^\d{10}$/.test(cleanUTR)) {
      return {
        valid: false,
        message: 'UTR must be exactly 10 digits'
      };
    }

    // Basic checksum validation (mod 97 check for some UTRs)
    // Note: Not all UTRs follow this pattern, so this is advisory only

    return {
      valid: true,
      message: 'UTR format is valid'
    };
  }

  /**
   * Validate accounting period
   */
  validateAccountingPeriod(
    startDate: string,
    endDate: string,
    companyIncorporationDate?: string
  ): { valid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    const start = new Date(startDate);
    const end = new Date(endDate);

    // Check valid dates
    if (isNaN(start.getTime())) {
      errors.push('Invalid accounting period start date');
    }
    if (isNaN(end.getTime())) {
      errors.push('Invalid accounting period end date');
    }

    if (errors.length > 0) {
      return { valid: false, errors, warnings };
    }

    // End date must be after start date
    if (end <= start) {
      errors.push('Accounting period end date must be after start date');
    }

    // Period cannot exceed 12 months (366 days to account for leap years)
    const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    if (daysDiff > 366) {
      errors.push('Accounting period cannot exceed 12 months');
    }

    // Check if period is in the future
    const today = new Date();
    if (end > today) {
      errors.push('Accounting period cannot end in the future');
    }

    // Check if start is before company incorporation
    if (companyIncorporationDate) {
      const incorporation = new Date(companyIncorporationDate);
      if (start < incorporation) {
        errors.push('Accounting period cannot start before company incorporation date');
      }
    }

    // Warning for very short periods
    if (daysDiff < 30) {
      warnings.push('Accounting period is unusually short (less than 30 days)');
    }

    // Warning for period ending more than 12 months ago
    const monthsAgo = (today.getTime() - end.getTime()) / (1000 * 60 * 60 * 24 * 30);
    if (monthsAgo > 12) {
      warnings.push('CT600 filing deadline may have passed. Late filing penalties may apply.');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Map Companies House status to our internal status
   */
  private mapCompanyStatus(chStatus: string): CT600EligibilityResult['companyStatus'] {
    const statusMap: Record<string, CT600EligibilityResult['companyStatus']> = {
      'active': 'active',
      'dissolved': 'dissolved',
      'liquidation': 'liquidation',
      'receivership': 'liquidation',
      'administration': 'liquidation',
      'voluntary-arrangement': 'liquidation',
      'converted-closed': 'dissolved',
      'insolvency-proceedings': 'liquidation',
      'registered': 'active',
      'dormant': 'dormant'
    };

    return statusMap[chStatus?.toLowerCase()] || 'unknown';
  }

  /**
   * Format Companies House address object into string
   */
  private formatAddress(address: CompanyInfo['registered_office_address']): string {
    if (!address) return 'Address not available';

    const parts = [
      address.address_line_1,
      address.address_line_2,
      address.locality,
      address.region,
      address.postal_code,
      address.country
    ].filter(Boolean);

    return parts.join(', ');
  }

  /**
   * Calculate filing deadlines based on accounting reference date
   */
  private async calculateFilingDeadlines(companyInfo: CompanyInfo): Promise<CT600EligibilityResult['filingDeadlines']> {
    const deadlines: CT600EligibilityResult['filingDeadlines'] = {
      ct600Deadline: null,
      paymentDeadline: null,
      annualAccountsDeadline: null,
      confirmationStatementDeadline: null
    };

    // Annual accounts deadline from Companies House
    if (companyInfo.accounts?.next_due) {
      deadlines.annualAccountsDeadline = companyInfo.accounts.next_due;
    }

    // Confirmation statement deadline
    if (companyInfo.confirmation_statement?.next_due) {
      deadlines.confirmationStatementDeadline = companyInfo.confirmation_statement.next_due;
    }

    // CT600 deadline is 12 months after accounting period end
    // Payment deadline is 9 months and 1 day after period end
    if (companyInfo.accounts?.next_made_up_to) {
      const periodEnd = new Date(companyInfo.accounts.next_made_up_to);

      // CT600 filing deadline: 12 months after period end
      const ct600Deadline = new Date(periodEnd);
      ct600Deadline.setFullYear(ct600Deadline.getFullYear() + 1);
      deadlines.ct600Deadline = ct600Deadline.toISOString().split('T')[0];

      // Payment deadline: 9 months and 1 day after period end
      const paymentDeadline = new Date(periodEnd);
      paymentDeadline.setMonth(paymentDeadline.getMonth() + 9);
      paymentDeadline.setDate(paymentDeadline.getDate() + 1);
      deadlines.paymentDeadline = paymentDeadline.toISOString().split('T')[0];
    }

    return deadlines;
  }

  /**
   * Find the last CT600/Corporation Tax filing in history
   */
  private findLastCT600(filingHistory: FilingHistory): CT600EligibilityResult['lastCT600Filed'] | null {
    // Look for corporation tax related filings
    // Note: Companies House doesn't directly show CT600 filings, but we can infer from accounts
    const ctRelatedCategories = ['accounts', 'annual-return', 'confirmation-statement'];
    const accountsFilings = filingHistory.items.filter(item =>
      item.category === 'accounts' || item.type?.includes('AA')
    );

    if (accountsFilings.length > 0) {
      const lastAccounts = accountsFilings[0];
      // Extract period end from description if available
      const periodMatch = lastAccounts.description?.match(/made up to (\d{1,2} \w+ \d{4})/i);

      return {
        date: lastAccounts.date,
        periodEnd: periodMatch ? this.parseUKDate(periodMatch[1]) : lastAccounts.date
      };
    }

    return null;
  }

  /**
   * Suggest the next accounting period based on history and ARD
   */
  private suggestAccountingPeriod(
    companyInfo: CompanyInfo,
    lastFiling: CT600EligibilityResult['lastCT600Filed'] | null
  ): CT600EligibilityResult['suggestedAccountingPeriod'] {
    // If we have the next made up to date, use that
    if (companyInfo.accounts?.next_made_up_to) {
      const endDate = new Date(companyInfo.accounts.next_made_up_to);
      const startDate = new Date(endDate);
      startDate.setFullYear(startDate.getFullYear() - 1);
      startDate.setDate(startDate.getDate() + 1); // Day after previous period end

      return {
        start: startDate.toISOString().split('T')[0],
        end: endDate.toISOString().split('T')[0]
      };
    }

    // If we have a last filing, suggest the following period
    if (lastFiling?.periodEnd) {
      const lastEnd = new Date(lastFiling.periodEnd);
      const startDate = new Date(lastEnd);
      startDate.setDate(startDate.getDate() + 1);
      const endDate = new Date(startDate);
      endDate.setFullYear(endDate.getFullYear() + 1);
      endDate.setDate(endDate.getDate() - 1);

      return {
        start: startDate.toISOString().split('T')[0],
        end: endDate.toISOString().split('T')[0]
      };
    }

    // If company is new, suggest from incorporation to ARD
    if (companyInfo.date_of_creation && companyInfo.accounts?.accounting_reference_date) {
      const incorp = new Date(companyInfo.date_of_creation);
      const ard = companyInfo.accounts.accounting_reference_date;

      // Find the next ARD after incorporation
      let endDate = new Date(incorp.getFullYear(), parseInt(ard.month) - 1, parseInt(ard.day));
      if (endDate <= incorp) {
        endDate.setFullYear(endDate.getFullYear() + 1);
      }

      return {
        start: companyInfo.date_of_creation,
        end: endDate.toISOString().split('T')[0]
      };
    }

    return null;
  }

  /**
   * Check company eligibility for CT600 filing
   */
  private checkEligibility(
    companyInfo: CompanyInfo,
    result: CT600EligibilityResult
  ): { eligible: boolean; reasons: string[]; warnings: string[] } {
    const reasons: string[] = [];
    const warnings: string[] = [];

    // Check 1: Company must exist
    if (!companyInfo) {
      reasons.push('Company not found in Companies House register');
      return { eligible: false, reasons, warnings };
    }

    // Check 2: Company status
    const status = companyInfo.company_status?.toLowerCase();
    if (status === 'dissolved') {
      reasons.push('Company is dissolved. Only final CT600 returns can be filed.');
      warnings.push('Consult HMRC guidance on filing returns for dissolved companies');
    } else if (status === 'liquidation' || status === 'receivership' || status === 'administration') {
      warnings.push(`Company is in ${status}. Special filing procedures may apply.`);
    } else if (status !== 'active') {
      warnings.push(`Company status is "${status}". Verify filing requirements with HMRC.`);
    }

    // Check 3: Company type must be liable for Corporation Tax
    const companyType = companyInfo.type?.toLowerCase() || '';
    const nonCTTypes = ['limited-partnership', 'scottish-partnership', 'llp', 'registered-society'];
    if (nonCTTypes.some(type => companyType.includes(type))) {
      reasons.push(`Company type "${companyInfo.type}" may not be liable for Corporation Tax`);
      warnings.push('LLPs and partnerships are typically taxed at partner level, not corporation tax');
    }

    // Check 4: Must have accounting reference date
    if (!companyInfo.accounts?.accounting_reference_date) {
      warnings.push('Accounting reference date not found. Please verify with Companies House.');
    }

    // Check 5: Company age - very new companies may not have a period to file for yet
    if (companyInfo.date_of_creation) {
      const incorpDate = new Date(companyInfo.date_of_creation);
      const daysSinceIncorp = (Date.now() - incorpDate.getTime()) / (1000 * 60 * 60 * 24);

      if (daysSinceIncorp < 365) {
        warnings.push('Company is less than 1 year old. First CT600 may cover a period less than 12 months.');
      }
    }

    // Check 6: Dormant company handling
    if (status === 'dormant' || companyType.includes('dormant')) {
      warnings.push('Dormant companies may be exempt from Corporation Tax. Check eligibility for dormant company exemption.');
    }

    // Final eligibility determination
    const eligible = reasons.length === 0 ||
      (reasons.length === 1 && reasons[0].includes('dissolved')); // Allow dissolved for final returns

    if (eligible && reasons.length === 0) {
      reasons.push('Company is eligible for CT600 filing');
    }

    return { eligible, reasons, warnings };
  }

  /**
   * Check if company is likely a close company
   * (Small companies with few shareholders are usually close companies)
   */
  private isLikelyCloseCompany(companyType: string): boolean {
    const closeCompanyTypes = ['ltd', 'private-limited-guarant-nsc', 'private-limited-shares-section-30-exemption'];
    const type = companyType.toLowerCase();

    // Most UK private limited companies are close companies
    return closeCompanyTypes.some(t => type.includes(t)) || type.includes('private');
  }

  /**
   * Parse UK date format (e.g., "31 March 2024")
   */
  private parseUKDate(dateStr: string): string {
    const months: Record<string, string> = {
      'january': '01', 'february': '02', 'march': '03', 'april': '04',
      'may': '05', 'june': '06', 'july': '07', 'august': '08',
      'september': '09', 'october': '10', 'november': '11', 'december': '12'
    };

    const match = dateStr.match(/(\d{1,2})\s+(\w+)\s+(\d{4})/i);
    if (match) {
      const day = match[1].padStart(2, '0');
      const month = months[match[2].toLowerCase()] || '01';
      const year = match[3];
      return `${year}-${month}-${day}`;
    }

    return dateStr;
  }
}

export const ct600ValidationService = new CT600ValidationService();

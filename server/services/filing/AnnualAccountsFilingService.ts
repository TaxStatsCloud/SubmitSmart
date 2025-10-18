import { CompaniesHouseAuthService, FilingAuthConfig } from '../govtalk';
import { IXBRLContext } from '../ixbrl/IXBRLGenerator';
import { BalanceSheetData } from '../ixbrl/BalanceSheetGenerator';
import { ProfitLossData } from '../ixbrl/ProfitLossGenerator';
import { DirectorsReportData } from '../ixbrl/DirectorsReportGenerator';
import { AccountingPoliciesData, NotesToAccountsData } from '../ixbrl/AccountingPoliciesGenerator';
import { IXBRLPackagingService, AnnualAccountsPackageData } from '../ixbrl/IXBRLPackagingService';
import { EntitySize } from '../ixbrl/EntitySizeDetector';

export interface AnnualAccountsSubmissionData {
  // Company Context
  context: IXBRLContext;
  
  // Financial Statements
  balanceSheet: {
    currentYear: BalanceSheetData;
    previousYear?: BalanceSheetData;
  };
  profitLoss: {
    currentYear: ProfitLossData;
    previousYear?: ProfitLossData;
  };
  
  // Reports and Notes
  directorsReport: DirectorsReportData;
  notes: NotesToAccountsData;
  
  // Entity Classification
  entitySize: EntitySize;
}

export interface AnnualAccountsSubmissionRequest {
  filingId: number;
  companyId: number;
  userId: number;
  accountsData: AnnualAccountsSubmissionData;
}

export interface AnnualAccountsSubmissionResult {
  success: boolean;
  submissionId?: string;
  companiesHouseReference?: string;
  errors?: string[];
  xmlRequest?: string;
  xmlResponse?: string;
  ixbrlPackagePath?: string;
}

export class AnnualAccountsFilingService {
  /**
   * Process Annual Accounts filing submission to Companies House
   * Note: Annual Accounts can be filed electronically for free (no mandatory fee)
   */
  static async submitAnnualAccounts(
    request: AnnualAccountsSubmissionRequest
  ): Promise<AnnualAccountsSubmissionResult> {
    try {
      // Validate required data
      const validation = this.validateAccountsData(request.accountsData);
      if (!validation.valid) {
        return {
          success: false,
          errors: validation.errors
        };
      }

      // Prepare package data for iXBRL generation
      const packageData: AnnualAccountsPackageData = {
        context: request.accountsData.context,
        balanceSheet: request.accountsData.balanceSheet,
        profitLoss: request.accountsData.profitLoss,
        directorsReport: request.accountsData.directorsReport,
        notes: request.accountsData.notes,
        entitySize: request.accountsData.entitySize
      };

      // Generate and package iXBRL documents into ZIP
      const zipBuffer = IXBRLPackagingService.createSubmissionPackage(packageData);

      // Convert ZIP to base64 for XML transmission
      const zipBase64 = zipBuffer.toString('base64');

      // Build Companies House submission XML
      const accountsBodyXml = this.buildAccountsSubmissionXML(
        request.accountsData.context,
        request.accountsData.entitySize,
        zipBase64
      );

      // Authenticate and submit to Companies House
      const config = FilingAuthConfig.getConfig();
      const authService = new CompaniesHouseAuthService(
        config.companiesHouse,
        FilingAuthConfig.isTestEnvironment()
      );

      const transactionId = this.generateTransactionId();

      const fullXmlRequest = authService.buildAuthenticatedRequest({
        messageClass: 'Accounts',
        transactionId,
        bodyXml: accountsBodyXml,
        keys: {
          CompanyNumber: request.accountsData.context.companyNumber
        }
      });

      const xmlResponse = await authService.submitToGateway(fullXmlRequest);

      // Parse response
      const isSuccess = this.isSuccessfulSubmission(xmlResponse);

      if (!isSuccess) {
        const errors = this.parseResponseErrors(xmlResponse);
        return {
          success: false,
          errors: errors.length > 0 ? errors : ['Companies House rejected the Annual Accounts submission.'],
          xmlRequest: fullXmlRequest,
          xmlResponse
        };
      }

      const companiesHouseReference = this.extractReferenceFromResponse(xmlResponse);

      return {
        success: true,
        submissionId: transactionId,
        companiesHouseReference,
        xmlRequest: fullXmlRequest,
        xmlResponse
      };

    } catch (error) {
      console.error('Annual Accounts submission error:', error);
      return {
        success: false,
        errors: [error instanceof Error ? error.message : 'Unknown error occurred']
      };
    }
  }

  /**
   * Build the XML body for Annual Accounts submission
   */
  private static buildAccountsSubmissionXML(
    context: IXBRLContext,
    entitySize: EntitySize,
    zipBase64: string
  ): string {
    const accountsType = entitySize === 'micro' ? 'MicroEntity' :
                        entitySize === 'small' ? 'SmallFull' :
                        entitySize === 'medium' ? 'MediumFull' : 'FullAccounts';

    return `
<AccountsData>
  <CompanyNumber>${this.escapeXml(context.companyNumber)}</CompanyNumber>
  <CompanyName>${this.escapeXml(context.companyName)}</CompanyName>
  <AccountsType>${accountsType}</AccountsType>
  <PeriodEndDate>${context.periodEnd}</PeriodEndDate>
  <AccountsFormat>iXBRL</AccountsFormat>
  <Package encoding="base64">${zipBase64}</Package>
</AccountsData>`.trim();
  }

  /**
   * Validate accounts data
   */
  private static validateAccountsData(data: AnnualAccountsSubmissionData): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate context
    if (!data.context.companyNumber || !/^[A-Z0-9]{8}$/.test(data.context.companyNumber)) {
      errors.push('Invalid company number format');
    }

    if (!data.context.companyName) {
      errors.push('Company name is required');
    }

    if (!data.context.periodStart || !data.context.periodEnd) {
      errors.push('Accounting period start and end dates are required');
    }

    if (!data.context.balanceSheetDate) {
      errors.push('Balance sheet date is required');
    }

    // Validate financial data
    if (!data.balanceSheet?.currentYear) {
      errors.push('Current year balance sheet is required');
    }

    if (!data.profitLoss?.currentYear) {
      errors.push('Current year profit & loss is required');
    }

    // Validate directors report
    if (!data.directorsReport) {
      errors.push('Directors report is required');
    } else {
      if (!data.directorsReport.directors || data.directorsReport.directors.length === 0) {
        errors.push('At least one director is required');
      }
      if (!data.directorsReport.directorApprovalDate) {
        errors.push('Director approval date is required');
      }
      if (!data.directorsReport.directorSignature) {
        errors.push('Director signature is required');
      }
    }

    // Validate notes
    if (!data.notes?.accountingPolicies) {
      errors.push('Accounting policies are required');
    }

    // Validate balance sheet totals
    if (data.balanceSheet?.currentYear) {
      const bs = data.balanceSheet.currentYear;
      
      // Calculate total assets
      const fixedAssets = (bs.intangibleAssets || 0) + 
                         (bs.tangibleAssets || 0) + 
                         (bs.investments || 0);
      const currentAssets = (bs.stocks || 0) + 
                           (bs.debtors || 0) + 
                           (bs.cash || 0);
      const totalAssets = fixedAssets + currentAssets;

      // Calculate net assets
      const netAssets = totalAssets - 
                       (bs.creditorsDueWithinOneYear || 0) -
                       (bs.creditorsDueAfterOneYear || 0) -
                       (bs.provisions || 0);

      // Calculate total equity
      const totalEquity = bs.calledUpShareCapital +
                         (bs.sharePremium || 0) +
                         (bs.revaluationReserve || 0) +
                         (bs.otherReserves || 0) +
                         bs.profitAndLossAccount;

      // Check if balance sheet balances (with small tolerance for rounding)
      if (Math.abs(netAssets - totalEquity) > 1) {
        errors.push(`Balance sheet does not balance: Net Assets (£${netAssets.toFixed(2)}) must equal Total Equity (£${totalEquity.toFixed(2)})`);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Generate transaction ID
   */
  private static generateTransactionId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    return `AA-${timestamp}-${random}`.toUpperCase();
  }

  /**
   * Check if submission was successful
   */
  private static isSuccessfulSubmission(xmlResponse: string): boolean {
    return xmlResponse.includes('<StatusCode>1</StatusCode>') ||
           xmlResponse.includes('<Response>Accepted</Response>');
  }

  /**
   * Parse error messages from response
   */
  private static parseResponseErrors(xmlResponse: string): string[] {
    const errors: string[] = [];
    const errorPattern = /<Error[^>]*>([^<]+)<\/Error>/g;
    const textPattern = /<Text>([^<]+)<\/Text>/g;

    let match;
    while ((match = errorPattern.exec(xmlResponse)) !== null) {
      errors.push(match[1]);
    }

    while ((match = textPattern.exec(xmlResponse)) !== null) {
      if (!errors.includes(match[1])) {
        errors.push(match[1]);
      }
    }

    return errors;
  }

  /**
   * Extract Companies House reference from response
   */
  private static extractReferenceFromResponse(xmlResponse: string): string | undefined {
    const patterns = [
      /<CompaniesHouseReference>([^<]+)<\/CompaniesHouseReference>/,
      /<SubmissionNumber>([^<]+)<\/SubmissionNumber>/,
      /<BarCode>([^<]+)<\/BarCode>/
    ];

    for (const pattern of patterns) {
      const match = xmlResponse.match(pattern);
      if (match) {
        return match[1];
      }
    }

    return undefined;
  }

  /**
   * Escape XML special characters
   */
  private static escapeXml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
}

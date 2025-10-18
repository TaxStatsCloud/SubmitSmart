import AdmZip from 'adm-zip';
import { IXBRLGenerator, IXBRLContext } from './IXBRLGenerator';
import { BalanceSheetGenerator, BalanceSheetData } from './BalanceSheetGenerator';
import { ProfitLossGenerator, ProfitLossData } from './ProfitLossGenerator';
import { DirectorsReportGenerator, DirectorsReportData } from './DirectorsReportGenerator';
import { NotesToAccountsGenerator, NotesToAccountsData } from './AccountingPoliciesGenerator';
import { CashFlowStatementGenerator, CashFlowData } from './CashFlowStatementGenerator';
import { StrategicReportGenerator, StrategicReportData } from './StrategicReportGenerator';
import { EntitySize } from './EntitySizeDetector';

export interface AnnualAccountsPackageData {
  context: IXBRLContext;
  balanceSheet: {
    currentYear: BalanceSheetData;
    previousYear?: BalanceSheetData;
  };
  profitLoss: {
    currentYear: ProfitLossData;
    previousYear?: ProfitLossData;
  };
  directorsReport: DirectorsReportData;
  notes: NotesToAccountsData;
  entitySize: EntitySize;
  cashFlow?: {
    currentYear: CashFlowData;
    previousYear?: CashFlowData;
  };
  strategicReport?: StrategicReportData;
}

export class IXBRLPackagingService {
  /**
   * Generate complete iXBRL HTML document for Annual Accounts
   */
  static generateIXBRLDocument(data: AnnualAccountsPackageData): string {
    const { context, balanceSheet, profitLoss, directorsReport, notes, entitySize, cashFlow, strategicReport } = data;

    // Start document
    let html = IXBRLGenerator.generateDocumentHeader(context);
    html += IXBRLGenerator.generateContexts(context, !!balanceSheet.previousYear);

    // Main content container
    html += '<div class="annual-accounts">\n';
    html += `<h1>${context.companyName}</h1>\n`;
    html += `<h2>Registered Number: ${context.companyNumber}</h2>\n`;
    html += '<h2>Annual Accounts</h2>\n';
    html += `<h3>For the year ended ${context.periodEnd}</h3>\n`;
    html += '<br/>\n';

    // Generate Strategic Report (Large companies only)
    if (entitySize === 'large' && strategicReport) {
      html += '<div class="strategic-report">\n';
      html += StrategicReportGenerator.generate(context, strategicReport);
      html += '</div>\n';
      html += '<br/><div class="page-break"></div><br/>\n';
    }

    // Generate Directors' Report
    html += DirectorsReportGenerator.generate(directorsReport, entitySize);
    html += '<br/><div class="page-break"></div><br/>\n';

    // Generate Balance Sheet
    html += '<div class="balance-sheet">\n';
    html += BalanceSheetGenerator.generate(
      context,
      balanceSheet
    );
    html += '</div>\n';
    html += '<br/><div class="page-break"></div><br/>\n';

    // Generate Profit & Loss Account
    const profitLossFormat = entitySize === 'micro' ? 'abridged' : 
                            entitySize === 'small' ? 'standard' : 'detailed';
    html += '<div class="profit-loss">\n';
    html += ProfitLossGenerator.generate(
      context,
      profitLoss,
      profitLossFormat
    );
    html += '</div>\n';
    html += '<br/><div class="page-break"></div><br/>\n';

    // Generate Cash Flow Statement (Medium and Large companies only)
    if ((entitySize === 'medium' || entitySize === 'large') && cashFlow) {
      html += '<div class="cash-flow-statement">\n';
      html += CashFlowStatementGenerator.generate(context, cashFlow);
      html += '</div>\n';
      html += '<br/><div class="page-break"></div><br/>\n';
    }

    // Generate Notes to the Accounts
    html += NotesToAccountsGenerator.generate(notes, entitySize);

    html += '</div>\n';
    html += IXBRLGenerator.generateDocumentFooter();

    return html;
  }

  /**
   * Create ZIP package with iXBRL HTML document for Companies House submission
   * @returns Buffer containing the ZIP file
   */
  static createSubmissionPackage(data: AnnualAccountsPackageData): Buffer {
    const ixbrlHtml = this.generateIXBRLDocument(data);

    // Create ZIP archive
    const zip = new AdmZip();

    // Add iXBRL HTML document
    // Filename format: {company-number}-{period-end}-accounts.html
    const periodEnd = data.context.periodEnd.replace(/-/g, '');
    const filename = `${data.context.companyNumber}-${periodEnd}-accounts.html`;
    
    zip.addFile(filename, Buffer.from(ixbrlHtml, 'utf-8'));

    // Return ZIP buffer
    return zip.toBuffer();
  }

  /**
   * Validate iXBRL document structure
   * Performs basic structural validation before submission
   */
  static validateDocument(data: AnnualAccountsPackageData): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate context
    if (!data.context.companyNumber || data.context.companyNumber.length < 8) {
      errors.push('Invalid company number');
    }

    if (!data.context.periodStart || !data.context.periodEnd) {
      errors.push('Missing accounting period dates');
    }

    if (!data.context.balanceSheetDate) {
      errors.push('Missing balance sheet date');
    }

    // Validate balance sheet totals match
    const bsData = data.balanceSheet.currentYear;
    const totalAssets = (bsData.intangibleAssets || 0) + 
                       (bsData.tangibleAssets || 0) + 
                       (bsData.investments || 0) +
                       (bsData.stocks || 0) + 
                       (bsData.debtors || 0) + 
                       (bsData.cash || 0);

    const totalLiabilities = (bsData.creditorsDueWithinOneYear || 0) + 
                            (bsData.creditorsDueAfterOneYear || 0) + 
                            (bsData.provisions || 0);

    const netAssets = totalAssets - totalLiabilities;

    const totalCapital = (bsData.calledUpShareCapital || 0) + 
                        (bsData.sharePremium || 0) + 
                        (bsData.revaluationReserve || 0) + 
                        (bsData.otherReserves || 0) + 
                        (bsData.profitAndLossAccount || 0);

    // Allow small rounding differences (£1)
    if (Math.abs(netAssets - totalCapital) > 1) {
      errors.push(`Balance sheet does not balance: Net Assets ${netAssets} != Total Capital ${totalCapital}`);
    }

    // Validate directors' report
    if (!data.directorsReport.directors || data.directorsReport.directors.length === 0) {
      errors.push('No directors listed in directors\' report');
    }

    if (!data.directorsReport.principalActivities) {
      errors.push('Missing principal activities description');
    }

    if (!data.directorsReport.directorApprovalDate) {
      errors.push('Missing director approval date');
    }

    if (!data.directorsReport.directorSignature) {
      errors.push('Missing director signature');
    }

    // Validate accounting policies
    if (!data.notes.accountingPolicies.accountingFramework) {
      errors.push('Missing accounting framework declaration');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Generate preview HTML (without iXBRL tagging) for user review
   */
  static generatePreviewHTML(data: AnnualAccountsPackageData): string {
    // Strip iXBRL tags from the document for human-readable preview
    const fullDocument = this.generateIXBRLDocument(data);
    
    // Remove ix: namespace tags but keep the content
    let preview = fullDocument.replace(/<ix:nonFraction[^>]*>(.*?)<\/ix:nonFraction>/g, '$1');
    preview = preview.replace(/<ix:nonNumeric[^>]*>(.*?)<\/ix:nonNumeric>/g, '$1');
    preview = preview.replace(/<ix:header>[\s\S]*?<\/ix:header>/g, '');
    
    // Add preview-specific styling
    preview = preview.replace(
      '<head>',
      `<head>
      <style>
        .preview-banner {
          background: #fff3cd;
          border: 2px solid #ffc107;
          padding: 15px;
          margin: 20px 0;
          text-align: center;
          font-weight: bold;
        }
      </style>`
    );

    preview = preview.replace(
      '<body>',
      `<body>
      <div class="preview-banner">
        PREVIEW ONLY - This is not the final submission document
      </div>`
    );

    return preview;
  }
}

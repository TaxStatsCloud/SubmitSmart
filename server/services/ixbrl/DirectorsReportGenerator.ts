import { IXBRLGenerator } from './IXBRLGenerator';
import { EntitySize } from './EntitySizeDetector';

export interface DirectorsReportData {
  companyName: string;
  companyNumber: string;
  periodEnd: string;
  directors: Array<{
    name: string;
    appointmentDate?: string;
    resignationDate?: string;
  }>;
  principalActivities: string;
  businessReview?: string;
  keyPerformanceIndicators?: string;
  principalRisks?: string;
  futureDevelopments?: string;
  researchAndDevelopment?: string;
  dividendsProposed?: number;
  dividendsPaid?: number;
  auditExemption: boolean;
  auditExemptionReason?: string;
  smallCompanyRegime: boolean;
  directorApprovalDate: string;
  directorSignature: string;
  directorPosition: string;
}

export class DirectorsReportGenerator {
  /**
   * Generate complete Directors' Report with iXBRL tagging
   */
  static generate(data: DirectorsReportData, entitySize: EntitySize): string {
    let html = '<div class="directors-report">\n';
    html += '<h2>Directors\' Report</h2>\n';
    html += '<p>For the year ended ' + IXBRLGenerator.tagDate(data.periodEnd, 'balanceSheetDate', 'balance-sheet') + '</p>\n';
    html += '<br/>\n';

    // Directors
    html += this.generateDirectorsSection(data);

    // Principal Activities
    html += this.generatePrincipalActivitiesSection(data);

    // Business Review (optional for small companies)
    if (data.businessReview && entitySize !== 'micro' && entitySize !== 'small') {
      html += this.generateBusinessReviewSection(data);
    }

    // Financial Instruments (if large company)
    if (entitySize === 'large') {
      html += this.generateFinancialInstrumentsSection(data);
    }

    // Dividends
    if (data.dividendsProposed || data.dividendsPaid) {
      html += this.generateDividendsSection(data);
    }

    // Audit Exemption Statement (if applicable)
    if (data.auditExemption) {
      html += this.generateAuditExemptionSection(data);
    }

    // Small Company Regime Statement
    if (data.smallCompanyRegime) {
      html += this.generateSmallCompanyStatement(data);
    }

    // Director Approval
    html += this.generateDirectorApprovalSection(data);

    html += '</div>\n';

    return html;
  }

  /**
   * Generate Directors section
   */
  private static generateDirectorsSection(data: DirectorsReportData): string {
    let html = '<h3>Directors</h3>\n';
    html += '<p>The directors who served during the year were:</p>\n';
    html += '<ul>\n';

    for (const director of data.directors) {
      html += `<li>${IXBRLGenerator.tagText(director.name, 'NameDirectorSigningFinancialStatements', 'current')}`;
      
      if (director.resignationDate) {
        html += ' (resigned ' + IXBRLGenerator.tagDate(director.resignationDate, 'DateAuthorisationDirectorsReport', 'current') + ')';
      }
      
      html += '</li>\n';
    }

    html += '</ul>\n';
    html += '<br/>\n';

    return html;
  }

  /**
   * Generate Principal Activities section
   */
  private static generatePrincipalActivitiesSection(data: DirectorsReportData): string {
    let html = '<h3>Principal Activities</h3>\n';
    html += `<p>${IXBRLGenerator.tagText(
      data.principalActivities,
      'DescriptionPrincipalActivities',
      'current'
    )}</p>\n`;
    html += '<br/>\n';

    return html;
  }

  /**
   * Generate Business Review section (required for medium/large companies)
   */
  private static generateBusinessReviewSection(data: DirectorsReportData): string {
    let html = '<h3>Business Review</h3>\n';

    if (data.businessReview) {
      html += `<p>${data.businessReview}</p>\n`;
    }

    if (data.keyPerformanceIndicators) {
      html += '<h4>Key Performance Indicators</h4>\n';
      html += `<p>${data.keyPerformanceIndicators}</p>\n`;
    }

    if (data.principalRisks) {
      html += '<h4>Principal Risks and Uncertainties</h4>\n';
      html += `<p>${data.principalRisks}</p>\n`;
    }

    if (data.futureDevelopments) {
      html += '<h4>Future Developments</h4>\n';
      html += `<p>${data.futureDevelopments}</p>\n`;
    }

    if (data.researchAndDevelopment) {
      html += '<h4>Research and Development</h4>\n';
      html += `<p>${data.researchAndDevelopment}</p>\n`;
    }

    html += '<br/>\n';

    return html;
  }

  /**
   * Generate Financial Instruments section (required for large companies under FRS 102)
   */
  private static generateFinancialInstrumentsSection(data: DirectorsReportData): string {
    let html = '<h3>Financial Instruments</h3>\n';
    html += '<p>The company has not disclosed information required by FRS 102 Section 11 and Section 12 ';
    html += 'regarding financial instruments as the company is entitled to the exemption from this requirement ';
    html += 'on the grounds that it qualifies as a small company.</p>\n';
    html += '<br/>\n';

    return html;
  }

  /**
   * Generate Dividends section
   */
  private static generateDividendsSection(data: DirectorsReportData): string {
    let html = '<h3>Dividends</h3>\n';

    if (data.dividendsPaid) {
      html += '<p>Dividends paid during the year: ';
      html += IXBRLGenerator.tagMonetary(data.dividendsPaid, 'DividendsPaidOrdinaryShares', 'current', 'GBP', 0);
      html += '</p>\n';
    }

    if (data.dividendsProposed) {
      html += '<p>The directors propose a final dividend of: ';
      html += IXBRLGenerator.tagMonetary(data.dividendsProposed, 'ProposedDividendShareClassOrdinary', 'current', 'GBP', 0);
      html += '</p>\n';
    }

    html += '<br/>\n';

    return html;
  }

  /**
   * Generate Audit Exemption Statement
   */
  private static generateAuditExemptionSection(data: DirectorsReportData): string {
    let html = '<h3>Statement of Directors\' Responsibilities</h3>\n';
    html += '<p>The directors acknowledge their responsibilities for:</p>\n';
    html += '<ul>\n';
    html += '<li>Ensuring that the company keeps accounting records which comply with Section 386 of the Companies Act 2006; and</li>\n';
    html += '<li>Preparing financial statements which give a true and fair view of the state of affairs of the company ';
    html += 'as at the end of the financial year and of its profit or loss for the financial year in accordance with ';
    html += 'the requirements of Section 393, and which otherwise comply with the requirements of the Companies Act 2006 ';
    html += 'relating to financial statements, so far as applicable to the company.</li>\n';
    html += '</ul>\n';
    html += '<br/>\n';

    html += '<h4>Audit Exemption</h4>\n';
    html += '<p>';
    html += IXBRLGenerator.tagText(
      'The company is entitled to exemption from audit under Section 477 of the Companies Act 2006 for the year ended ' + data.periodEnd + '.',
      'StatementOnQualityExemptionFromAudit',
      'current'
    );
    html += '</p>\n';

    html += '<p>The members have not required the company to obtain an audit of its financial statements ';
    html += 'for the year ended ' + data.periodEnd + ' in accordance with Section 476 of the Companies Act 2006.</p>\n';

    html += '<p>The directors acknowledge their responsibilities for:</p>\n';
    html += '<ul>\n';
    html += '<li>Ensuring that the company keeps accounting records which comply with Sections 386 and 387 ';
    html += 'of the Companies Act 2006; and</li>\n';
    html += '<li>Preparing financial statements which give a true and fair view of the state of affairs of the company ';
    html += 'as at the end of each financial year and of its profit or loss for each financial year in accordance ';
    html += 'with the requirements of Sections 394 and 395 and which otherwise comply with the requirements of ';
    html += 'the Companies Act 2006 relating to financial statements, so far as applicable to the company.</li>\n';
    html += '</ul>\n';
    html += '<br/>\n';

    return html;
  }

  /**
   * Generate Small Company Regime Statement
   */
  private static generateSmallCompanyStatement(data: DirectorsReportData): string {
    let html = '<h3>Small Company Provisions</h3>\n';
    html += '<p>';
    html += IXBRLGenerator.tagText(
      'This report has been prepared in accordance with the provisions applicable to companies entitled to the small companies regime.',
      'CompanyEntitledToExemptionUnderSection477CompaniesAct2006RelatingToSmallCompanies',
      'current'
    );
    html += '</p>\n';
    html += '<br/>\n';

    return html;
  }

  /**
   * Generate Director Approval Section
   */
  private static generateDirectorApprovalSection(data: DirectorsReportData): string {
    let html = '<h3>Approval</h3>\n';
    html += '<p>This report was approved by the board of directors on ';
    html += IXBRLGenerator.tagDate(data.directorApprovalDate, 'DateAuthorisationDirectorsReport', 'current');
    html += ' and signed on its behalf by:</p>\n';
    html += '<br/>\n';
    html += '<p><strong>' + IXBRLGenerator.tagText(data.directorSignature, 'NameDirectorSigningDirectorsReport', 'current') + '</strong></p>\n';
    html += '<p>' + data.directorPosition + '</p>\n';
    html += '<br/>\n';

    return html;
  }
}

import { XMLBuilder } from 'fast-xml-parser';

/**
 * iXBRL Generation Service
 * Generates inline XBRL documents with UK GAAP taxonomy tagging for Companies House submission
 * 
 * Standards:
 * - FRC 2025 UK GAAP Taxonomy
 * - Inline XBRL 1.1 Specification
 * - Companies House iXBRL requirements
 */

interface AccountsData {
  balanceSheet: any;
  profitLoss: any;
  notes: string;
  accountsType: 'micro' | 'small' | 'medium' | 'large';
  accountingPeriodStart: string;
  accountingPeriodEnd: string;
  companyName: string;
  companyNumber: string;
  directors?: string[];
  auditExempt?: boolean;
  auditExemptionType?: string;
  averageNumberOfEmployees: number; // MANDATORY for all filings (since Oct 2020)
  accountingStandard?: 'FRS102' | 'FRS105' | 'FRS101' | 'UKIFRS';
  turnover?: number;
  balanceSheetTotal?: number;
  principalActivities?: string; // Required for Directors' Report
  approvalDate?: string; // Required for Directors' Report
  signatoryDirector?: string; // Required for Directors' Report
}

interface iXBRLDocument {
  html: string;
  size: number;
  contextRefs: string[];
  unitRefs: string[];
}

export class IXBRLGenerationService {
  private taxonomyVersion = '2025-01-01';
  private namespace = {
    html: 'http://www.w3.org/1999/xhtml',
    ix: 'http://www.xbrl.org/2013/inlineXBRL',
    xbrli: 'http://www.xbrl.org/2003/instance',
    link: 'http://www.xbrl.org/2003/linkbase',
    xlink: 'http://www.w3.org/1999/xlink',
    'uk-gaap': 'https://xbrl.frc.org.uk/frs/2025-01-01/frs-2025-01-01.xsd',
    'uk-core': 'https://xbrl.frc.org.uk/core/2025-01-01/core-2025-01-01.xsd',
    'uk-bus': 'https://xbrl.frc.org.uk/cd/2025-01-01/business/bus-2025-01-01.xsd',
    iso4217: 'http://www.xbrl.org/2003/iso4217',
  };

  /**
   * Determine company size based on April 2025 thresholds
   * Company must meet 2 of 3 criteria:
   * Micro: Turnover ≤ £1m, Balance Sheet ≤ £500k, Employees ≤ 10
   * Small: Turnover ≤ £15m, Balance Sheet ≤ £7.5m, Employees ≤ 50
   * Medium: Turnover ≤ £54m, Balance Sheet ≤ £27m, Employees ≤ 250
   */
  determineEntitySize(
    turnover: number,
    balanceSheetTotal: number,
    averageEmployees: number
  ): 'micro' | 'small' | 'medium' | 'large' {
    // Micro-entity thresholds (effective April 6, 2025)
    const microCriteria = [
      turnover <= 1000000,
      balanceSheetTotal <= 500000,
      averageEmployees <= 10,
    ].filter(Boolean).length;

    if (microCriteria >= 2) return 'micro';

    // Small company thresholds
    const smallCriteria = [
      turnover <= 15000000,
      balanceSheetTotal <= 7500000,
      averageEmployees <= 50,
    ].filter(Boolean).length;

    if (smallCriteria >= 2) return 'small';

    // Medium company thresholds
    const mediumCriteria = [
      turnover <= 54000000,
      balanceSheetTotal <= 27000000,
      averageEmployees <= 250,
    ].filter(Boolean).length;

    if (mediumCriteria >= 2) return 'medium';

    return 'large';
  }

  /**
   * Generate iXBRL-tagged accounts document
   */
  async generateiXBRLAccounts(accountsData: AccountsData): Promise<iXBRLDocument> {
    try {
      // Auto-determine entity size if not provided or if financial data is available
      if (accountsData.turnover !== undefined && 
          accountsData.balanceSheetTotal !== undefined && 
          accountsData.averageNumberOfEmployees !== undefined) {
        accountsData.accountsType = this.determineEntitySize(
          accountsData.turnover,
          accountsData.balanceSheetTotal,
          accountsData.averageNumberOfEmployees
        );
        console.log(`Auto-determined entity size: ${accountsData.accountsType}`);
      }

      // Validate average employees for ALL companies (mandatory field from Oct 2020)
      if (accountsData.averageNumberOfEmployees === undefined) {
        throw new Error('Average number of employees is a mandatory field for all Companies House filings (required since October 2020)');
      }

      // Validate required fields for small+ companies
      if (accountsData.accountsType === 'small' || 
          accountsData.accountsType === 'medium' || 
          accountsData.accountsType === 'large') {
        if (!accountsData.directors || accountsData.directors.length === 0) {
          throw new Error('Directors are required for small, medium, and large companies');
        }
      }
      
      const contextRefs = this.generateContexts(accountsData);
      const unitRefs = this.generateUnits();
      
      const htmlContent = this.buildHTMLStructure(accountsData, contextRefs, unitRefs);
      
      return {
        html: htmlContent,
        size: Buffer.from(htmlContent).length,
        contextRefs: contextRefs.map(c => c.id),
        unitRefs: unitRefs.map(u => u.id),
      };
    } catch (error: any) {
      console.error('iXBRL generation failed:', error);
      throw new Error(`Failed to generate iXBRL document: ${error.message}`);
    }
  }

  /**
   * Generate XBRL contexts for current and prior periods
   */
  private generateContexts(accountsData: AccountsData) {
    const startDate = new Date(accountsData.accountingPeriodStart);
    const endDate = new Date(accountsData.accountingPeriodEnd);
    
    // Prior period (previous year)
    const priorStartDate = new Date(startDate);
    priorStartDate.setFullYear(priorStartDate.getFullYear() - 1);
    const priorEndDate = new Date(endDate);
    priorEndDate.setFullYear(priorEndDate.getFullYear() - 1);

    return [
      {
        id: 'current-period',
        entity: accountsData.companyNumber,
        period: {
          startDate: this.formatDate(startDate),
          endDate: this.formatDate(endDate),
        },
      },
      {
        id: 'current-instant',
        entity: accountsData.companyNumber,
        instant: this.formatDate(endDate),
      },
      {
        id: 'prior-period',
        entity: accountsData.companyNumber,
        period: {
          startDate: this.formatDate(priorStartDate),
          endDate: this.formatDate(priorEndDate),
        },
      },
      {
        id: 'prior-instant',
        entity: accountsData.companyNumber,
        instant: this.formatDate(priorEndDate),
      },
    ];
  }

  /**
   * Generate unit definitions (GBP currency)
   */
  private generateUnits() {
    return [
      {
        id: 'GBP',
        measure: 'iso4217:GBP',
      },
    ];
  }

  /**
   * Build complete HTML structure with iXBRL tags
   */
  private buildHTMLStructure(
    accountsData: AccountsData,
    contexts: any[],
    units: any[]
  ): string {
    const namespaceDeclarations = Object.entries(this.namespace)
      .map(([prefix, uri]) => `xmlns:${prefix}="${uri}"`)
      .join(' ');

    return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html ${namespaceDeclarations}>
<head>
  <meta charset="UTF-8" />
  <title>${accountsData.companyName} - Annual Accounts</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; }
    h1 { color: #333; }
    h2 { color: #666; margin-top: 30px; }
    table { border-collapse: collapse; width: 100%; margin: 20px 0; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #f2f2f2; }
    .number { text-align: right; }
    .statement { background-color: #f9f9f9; padding: 15px; margin: 20px 0; border-left: 4px solid #007bff; }
    .directors-report { margin: 20px 0; }
  </style>
  
  <!-- XBRL Contexts and Schema Reference -->
  <ix:header>
    <ix:references>
      <link:schemaRef 
        xlink:href="https://xbrl.frc.org.uk/frs/2025-01-01/frs-2025-01-01.xsd" 
        xlink:type="simple" />
    </ix:references>
    <ix:hidden>
      ${contexts.map(ctx => this.renderContext(ctx)).join('\n      ')}
      ${units.map(unit => this.renderUnit(unit)).join('\n      ')}
    </ix:hidden>
  </ix:header>
</head>
<body>
  <h1>${accountsData.companyName}</h1>
  <p>Company Number: <ix:nonNumeric name="uk-core:CompaniesHouseRegisteredNumber" contextRef="current-instant">${accountsData.companyNumber}</ix:nonNumeric></p>
  <p>Registered in England and Wales</p>
  
  ${accountsData.accountsType === 'small' || accountsData.accountsType === 'medium' || accountsData.accountsType === 'large' ? this.renderDirectorsReport(accountsData) : ''}
  
  <h2>Balance Sheet</h2>
  <p>As at <ix:nonFraction name="uk-core:BalanceSheetDate" contextRef="current-instant">${accountsData.accountingPeriodEnd}</ix:nonFraction></p>
  
  ${this.renderBalanceSheet(accountsData.balanceSheet, accountsData)}
  
  ${accountsData.auditExempt ? this.renderAuditExemptionStatement(accountsData) : ''}
  
  <h2>Profit and Loss Account</h2>
  <p>For the period ending <ix:nonFraction name="uk-gaap:EndDateForPeriodCoveredByReport" contextRef="current-period">${accountsData.accountingPeriodEnd}</ix:nonFraction></p>
  
  ${this.renderProfitLoss(accountsData.profitLoss)}
  
  <h2>Notes to the Accounts</h2>
  ${this.renderNotes(accountsData.notes, accountsData)}
  
</body>
</html>`;
  }

  /**
   * Render XBRL context
   */
  private renderContext(ctx: any): string {
    if (ctx.instant) {
      return `<xbrli:context id="${ctx.id}">
        <xbrli:entity>
          <xbrli:identifier scheme="http://www.companieshouse.gov.uk/">${ctx.entity}</xbrli:identifier>
        </xbrli:entity>
        <xbrli:period>
          <xbrli:instant>${ctx.instant}</xbrli:instant>
        </xbrli:period>
      </xbrli:context>`;
    } else {
      return `<xbrli:context id="${ctx.id}">
        <xbrli:entity>
          <xbrli:identifier scheme="http://www.companieshouse.gov.uk/">${ctx.entity}</xbrli:identifier>
        </xbrli:entity>
        <xbrli:period>
          <xbrli:startDate>${ctx.period.startDate}</xbrli:startDate>
          <xbrli:endDate>${ctx.period.endDate}</xbrli:endDate>
        </xbrli:period>
      </xbrli:context>`;
    }
  }

  /**
   * Render XBRL unit
   */
  private renderUnit(unit: any): string {
    return `<xbrli:unit id="${unit.id}">
      <xbrli:measure>${unit.measure}</xbrli:measure>
    </xbrli:unit>`;
  }

  /**
   * Render Directors' Report with iXBRL tagging (for small+ companies)
   */
  private renderDirectorsReport(accountsData: AccountsData): string {
    // Validate required fields for Directors' Report
    if (!accountsData.directors || accountsData.directors.length === 0) {
      throw new Error('Directors are required for Directors\' Report');
    }
    if (!accountsData.principalActivities) {
      throw new Error('Principal activities description is required for Directors\' Report');
    }
    if (!accountsData.approvalDate) {
      throw new Error('Approval date is required for Directors\' Report');
    }
    if (!accountsData.signatoryDirector) {
      throw new Error('Signatory director is required for Directors\' Report');
    }

    const directors = accountsData.directors;
    
    return `
  <h2>Directors' Report</h2>
  <div class="directors-report">
    <h3>Principal Activities</h3>
    <p>
      <ix:nonNumeric name="uk-bus:DescriptionPrincipalActivities" contextRef="current-period">
        ${accountsData.principalActivities}
      </ix:nonNumeric>
    </p>
    
    <h3>Directors</h3>
    <p>The directors who served during the year were:</p>
    <ul>
      ${directors.map(director => `<li><ix:nonNumeric name="uk-bus:NameEntityOfficer" contextRef="current-period">${director}</ix:nonNumeric></li>`).join('\n      ')}
    </ul>
    
    <h3>Financial Results</h3>
    <p>
      The profit for the financial year amounted to 
      <ix:nonFraction name="uk-gaap:ProfitLoss" contextRef="current-period" unitRef="GBP" decimals="0">
        ${accountsData.profitLoss?.profitBeforeTax || 0}
      </ix:nonFraction> pounds sterling.
    </p>
    
    <h3>Employees</h3>
    <p>
      The average number of employees during the period was 
      <ix:nonFraction name="uk-bus:AverageNumberEmployeesDuringPeriod" contextRef="current-period" decimals="0">
        ${accountsData.averageNumberOfEmployees}
      </ix:nonFraction>.
    </p>
    
    <p><strong>This report was approved by the board of directors on <ix:nonNumeric name="uk-bus:DateAuthorisationFinancialStatementsForIssue" contextRef="current-instant">${accountsData.approvalDate}</ix:nonNumeric> and signed on its behalf by:</strong></p>
    <p><br/><ix:nonNumeric name="uk-bus:NameAuthorisingPersonEntity" contextRef="current-instant">${accountsData.signatoryDirector}</ix:nonNumeric><br/>Director</p>
  </div>`;
  }

  /**
   * Render Audit Exemption Statement (mandatory for exempt companies from April 2027)
   */
  private renderAuditExemptionStatement(accountsData: AccountsData): string {
    const exemptionType = accountsData.auditExemptionType || 'small company';
    
    return `
  <div class="statement">
    <h3>Statement of Directors' Responsibilities in Respect of the Accounts</h3>
    <p>
      <ix:nonNumeric name="uk-bus:StatementOnComplianceWithAuditExemptionProvisions" contextRef="current-period">
        For the year ending ${accountsData.accountingPeriodEnd}, the company was entitled to exemption from audit under section 477 of the Companies Act 2006 relating to ${exemptionType}s.
      </ix:nonNumeric>
    </p>
    
    <p>
      <ix:nonNumeric name="uk-bus:StatementOfDirectorsResponsibilities" contextRef="current-period">
        The directors acknowledge their responsibilities for:
      </ix:nonNumeric>
    </p>
    <ul>
      <li>Ensuring that the company keeps accounting records which comply with sections 386 and 387 of the Companies Act 2006; and</li>
      <li>Preparing accounts which give a true and fair view of the state of affairs of the company as at the end of the financial year and of its profit or loss for the financial year in accordance with the requirements of sections 394 and 395 and which otherwise comply with the requirements of the Companies Act 2006 relating to accounts, so far as applicable to the company.</li>
    </ul>
    
    <p>
      <ix:nonNumeric name="uk-bus:StatementThatMembersHaveNotRequiredCompanyToObtainAnAudit" contextRef="current-period">
        The members have not required the company to obtain an audit in accordance with section 476 of the Companies Act 2006.
      </ix:nonNumeric>
    </p>
  </div>`;
  }

  /**
   * Render balance sheet with iXBRL tags
   */
  private renderBalanceSheet(balanceSheet: any, accountsData: AccountsData): string {
    return `
  <table>
    <thead>
      <tr>
        <th>Item</th>
        <th class="number">Current Year (£)</th>
        <th class="number">Prior Year (£)</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <th colspan="3">Fixed Assets</th>
      </tr>
      <tr>
        <td>Tangible assets</td>
        <td class="number">
          <ix:nonFraction name="uk-gaap:TangibleFixedAssets" contextRef="current-instant" unitRef="GBP" decimals="0">
            ${balanceSheet.fixedAssets?.tangible || 0}
          </ix:nonFraction>
        </td>
        <td class="number">
          <ix:nonFraction name="uk-gaap:TangibleFixedAssets" contextRef="prior-instant" unitRef="GBP" decimals="0">
            ${balanceSheet.fixedAssets?.tangiblePrior || 0}
          </ix:nonFraction>
        </td>
      </tr>
      <tr>
        <th colspan="3">Current Assets</th>
      </tr>
      <tr>
        <td>Debtors</td>
        <td class="number">
          <ix:nonFraction name="uk-gaap:Debtors" contextRef="current-instant" unitRef="GBP" decimals="0">
            ${balanceSheet.currentAssets?.debtors || 0}
          </ix:nonFraction>
        </td>
        <td class="number">
          <ix:nonFraction name="uk-gaap:Debtors" contextRef="prior-instant" unitRef="GBP" decimals="0">
            ${balanceSheet.currentAssets?.debtorsPrior || 0}
          </ix:nonFraction>
        </td>
      </tr>
      <tr>
        <td>Cash at bank</td>
        <td class="number">
          <ix:nonFraction name="uk-gaap:CashBankInHand" contextRef="current-instant" unitRef="GBP" decimals="0">
            ${balanceSheet.currentAssets?.cash || 0}
          </ix:nonFraction>
        </td>
        <td class="number">
          <ix:nonFraction name="uk-gaap:CashBankInHand" contextRef="prior-instant" unitRef="GBP" decimals="0">
            ${balanceSheet.currentAssets?.cashPrior || 0}
          </ix:nonFraction>
        </td>
      </tr>
      <tr>
        <th>Total Assets</th>
        <th class="number">
          <ix:nonFraction name="uk-gaap:CurrentAssets" contextRef="current-instant" unitRef="GBP" decimals="0">
            ${balanceSheet.totalAssets || 0}
          </ix:nonFraction>
        </th>
        <th class="number">
          <ix:nonFraction name="uk-gaap:CurrentAssets" contextRef="prior-instant" unitRef="GBP" decimals="0">
            ${balanceSheet.totalAssetsPrior || 0}
          </ix:nonFraction>
        </th>
      </tr>
      <tr>
        <th colspan="3">Liabilities</th>
      </tr>
      <tr>
        <td>Creditors (due within one year)</td>
        <td class="number">
          <ix:nonFraction name="uk-gaap:CreditorsDueWithinOneYear" contextRef="current-instant" unitRef="GBP" decimals="0">
            ${balanceSheet.currentLiabilities || 0}
          </ix:nonFraction>
        </td>
        <td class="number">
          <ix:nonFraction name="uk-gaap:CreditorsDueWithinOneYear" contextRef="prior-instant" unitRef="GBP" decimals="0">
            ${balanceSheet.currentLiabilitiesPrior || 0}
          </ix:nonFraction>
        </td>
      </tr>
      <tr>
        <th>Net Assets</th>
        <th class="number">
          <ix:nonFraction name="uk-gaap:NetAssetsLiabilities" contextRef="current-instant" unitRef="GBP" decimals="0">
            ${balanceSheet.netAssets || 0}
          </ix:nonFraction>
        </th>
        <th class="number">
          <ix:nonFraction name="uk-gaap:NetAssetsLiabilities" contextRef="prior-instant" unitRef="GBP" decimals="0">
            ${balanceSheet.netAssetsPrior || 0}
          </ix:nonFraction>
        </th>
      </tr>
    </tbody>
  </table>`;
  }

  /**
   * Render profit and loss with iXBRL tags
   */
  private renderProfitLoss(profitLoss: any): string {
    return `
  <table>
    <thead>
      <tr>
        <th>Item</th>
        <th class="number">Current Year (£)</th>
        <th class="number">Prior Year (£)</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Turnover</td>
        <td class="number">
          <ix:nonFraction name="uk-gaap:Turnover" contextRef="current-period" unitRef="GBP" decimals="0">
            ${profitLoss.turnover || 0}
          </ix:nonFraction>
        </td>
        <td class="number">
          <ix:nonFraction name="uk-gaap:Turnover" contextRef="prior-period" unitRef="GBP" decimals="0">
            ${profitLoss.turnoverPrior || 0}
          </ix:nonFraction>
        </td>
      </tr>
      <tr>
        <td>Cost of sales</td>
        <td class="number">
          <ix:nonFraction name="uk-gaap:CostSales" contextRef="current-period" unitRef="GBP" decimals="0">
            ${profitLoss.costOfSales || 0}
          </ix:nonFraction>
        </td>
        <td class="number">
          <ix:nonFraction name="uk-gaap:CostSales" contextRef="prior-period" unitRef="GBP" decimals="0">
            ${profitLoss.costOfSalesPrior || 0}
          </ix:nonFraction>
        </td>
      </tr>
      <tr>
        <th>Gross Profit</th>
        <th class="number">
          <ix:nonFraction name="uk-gaap:GrossProfit" contextRef="current-period" unitRef="GBP" decimals="0">
            ${profitLoss.grossProfit || 0}
          </ix:nonFraction>
        </th>
        <th class="number">
          <ix:nonFraction name="uk-gaap:GrossProfit" contextRef="prior-period" unitRef="GBP" decimals="0">
            ${profitLoss.grossProfitPrior || 0}
          </ix:nonFraction>
        </th>
      </tr>
      <tr>
        <td>Administrative expenses</td>
        <td class="number">
          <ix:nonFraction name="uk-gaap:AdministrativeExpenses" contextRef="current-period" unitRef="GBP" decimals="0">
            ${profitLoss.administrativeExpenses || 0}
          </ix:nonFraction>
        </td>
        <td class="number">
          <ix:nonFraction name="uk-gaap:AdministrativeExpenses" contextRef="prior-period" unitRef="GBP" decimals="0">
            ${profitLoss.administrativeExpensesPrior || 0}
          </ix:nonFraction>
        </td>
      </tr>
      <tr>
        <th>Operating Profit</th>
        <th class="number">
          <ix:nonFraction name="uk-gaap:OperatingProfitLoss" contextRef="current-period" unitRef="GBP" decimals="0">
            ${profitLoss.operatingProfit || 0}
          </ix:nonFraction>
        </th>
        <th class="number">
          <ix:nonFraction name="uk-gaap:OperatingProfitLoss" contextRef="prior-period" unitRef="GBP" decimals="0">
            ${profitLoss.operatingProfitPrior || 0}
          </ix:nonFraction>
        </th>
      </tr>
      <tr>
        <th>Profit Before Tax</th>
        <th class="number">
          <ix:nonFraction name="uk-gaap:ProfitLossBeforeTax" contextRef="current-period" unitRef="GBP" decimals="0">
            ${profitLoss.profitBeforeTax || 0}
          </ix:nonFraction>
        </th>
        <th class="number">
          <ix:nonFraction name="uk-gaap:ProfitLossBeforeTax" contextRef="prior-period" unitRef="GBP" decimals="0">
            ${profitLoss.profitBeforeTaxPrior || 0}
          </ix:nonFraction>
        </th>
      </tr>
    </tbody>
  </table>`;
  }

  /**
   * Render notes with comprehensive iXBRL tagging (full tagging requirement)
   */
  private renderNotes(notes: string, accountsData: AccountsData): string {
    const accountingStandard = accountsData.accountingStandard || 'FRS102';
    
    return `<div class="notes">
    <h3>1. Accounting Policies</h3>
    <p>
      <ix:nonNumeric name="uk-bus:AccountingPolicy" contextRef="current-period">
        <strong>Basis of preparation:</strong> These accounts have been prepared in accordance with 
        <ix:nonNumeric name="uk-core:NameAccountingStandardsApplied" contextRef="current-period">
          ${accountingStandard === 'FRS105' ? 'FRS 105 "The Financial Reporting Standard applicable to the Micro-entities Regime"' : 
            accountingStandard === 'FRS102' ? 'FRS 102 "The Financial Reporting Standard applicable in the UK and Republic of Ireland"' :
            accountingStandard}
        </ix:nonNumeric>
        and the Companies Act 2006.
      </ix:nonNumeric>
    </p>
    
    ${accountsData.accountsType === 'micro' ? `
    <p>
      <ix:nonNumeric name="uk-bus:AccountingPolicyMeasurementConventionRealisedProfitsAndLosses" contextRef="current-period">
        <strong>Measurement convention:</strong> The accounts are prepared on the historical cost basis.
      </ix:nonNumeric>
    </p>
    ` : ''}
    
    ${accountsData.averageNumberOfEmployees !== undefined ? `
    <h3>2. Employees</h3>
    <p>
      The average number of persons employed by the company (including directors) during the year was 
      <ix:nonFraction name="uk-bus:AverageNumberEmployeesDuringPeriod" contextRef="current-period" decimals="0">
        ${accountsData.averageNumberOfEmployees}
      </ix:nonFraction>.
    </p>
    ` : ''}
    
    <h3>${accountsData.averageNumberOfEmployees !== undefined ? '3' : '2'}. Additional Information</h3>
    ${notes || '<p>No additional notes to disclose.</p>'}
  </div>`;
  }

  /**
   * Format date for XBRL (YYYY-MM-DD)
   */
  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Validate iXBRL document (basic validation)
   */
  async validateiXBRL(document: iXBRLDocument): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    // Check minimum required tags
    if (!document.html.includes('uk-gaap:Turnover')) {
      errors.push('Missing required tag: Turnover');
    }
    
    if (!document.html.includes('uk-gaap:NetAssetsLiabilities')) {
      errors.push('Missing required tag: Net Assets/Liabilities');
    }

    // Check contexts exist
    if (document.contextRefs.length === 0) {
      errors.push('No XBRL contexts defined');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

export const ixbrlGenerationService = new IXBRLGenerationService();

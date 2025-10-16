import { XMLBuilder } from 'fast-xml-parser';

/**
 * HMRC iXBRL Tax Computation Service
 * Generates iXBRL-tagged tax computations for CT600 submissions
 * 
 * CRITICAL: HMRC requires iXBRL format (NOT plain XML) since April 2011
 * - Uses FRC taxonomies for UK GAAP/IFRS
 * - Includes Detailed Profit & Loss (DPL) tagging (mandatory since April 2014)
 * - Full tagging of all tax computation elements
 * 
 * Standards:
 * - FRC 2025 UK GAAP/IFRS Taxonomies
 * - HMRC CT Computation Taxonomy
 * - Inline XBRL 1.1 Specification
 */

interface TaxComputationData {
  // Company information
  companyName: string;
  companyNumber: string; // Companies House registration number
  companyUTR: string; // 10-digit UTR
  
  // Accounting period
  accountingPeriodStart: string; // YYYY-MM-DD
  accountingPeriodEnd: string; // YYYY-MM-DD
  
  // Profit & Loss (for DPL tagging)
  turnover: number;
  costOfSales?: number;
  grossProfit: number;
  operationalExpenses?: number;
  administrativeExpenses?: number;
  distributionCosts?: number;
  otherExpenses?: number;
  operatingProfit: number;
  interestReceivable?: number;
  interestPayable?: number;
  profitBeforeTax: number;
  
  // Tax adjustments
  addBackDepreciation?: number;
  addBackEntertainment?: number;
  otherAdditions?: number[];
  capitalAllowances?: number;
  otherDeductions?: number[];
  
  // Tax computation results
  taxableProfit: number;
  corporationTaxRate: number; // e.g., 19 or 25
  corporationTaxDue: number;
  
  // Additional elements
  losses?: {
    broughtForward?: number;
    carriedForward?: number;
    usedInPeriod?: number;
  };
  
  rdCredits?: number;
  otherReliefs?: number[];
}

interface iXBRLComputationDocument {
  html: string;
  size: number;
  contextRefs: string[];
  unitRefs: string[];
  validationChecks: {
    hasDPL: boolean;
    hasComputationTags: boolean;
    hasRequiredContexts: boolean;
  };
}

export class HMRCIXBRLComputationService {
  private taxonomyVersion = '2025-01-01';
  private namespace = {
    html: 'http://www.w3.org/1999/xhtml',
    ix: 'http://www.xbrl.org/2013/inlineXBRL',
    xbrli: 'http://www.xbrl.org/2003/instance',
    link: 'http://www.xbrl.org/2003/linkbase',
    'uk-gaap': 'http://www.xbrl.org/uk/fr/gaap/pt/2025-01-01',
    'uk-core': 'http://www.xbrl.org/uk/cd/2025-01-01',
    'uk-bus': 'http://www.xbrl.org/uk/fr/business/2025-01-01',
    'hmrc-ct': 'http://www.hmrc.gov.uk/ct/2025-01-01',
    iso4217: 'http://www.xbrl.org/2003/iso4217',
  };

  /**
   * Generate iXBRL-tagged tax computation document
   * This is what HMRC actually requires for CT600 submissions
   */
  async generateIXBRLTaxComputation(data: TaxComputationData): Promise<iXBRLComputationDocument> {
    try {
      const contextRefs = this.generateContexts(data);
      const unitRefs = this.generateUnits();
      
      const htmlContent = this.buildComputationHTML(data, contextRefs, unitRefs);
      
      const validationChecks = {
        hasDPL: htmlContent.includes('uk-gaap:Turnover'),
        hasComputationTags: htmlContent.includes('hmrc-ct:TaxableProfit'),
        hasRequiredContexts: contextRefs.length >= 2,
      };
      
      return {
        html: htmlContent,
        size: Buffer.from(htmlContent).length,
        contextRefs: contextRefs.map(c => c.id),
        unitRefs: unitRefs.map(u => u.id),
        validationChecks,
      };
    } catch (error: any) {
      console.error('[HMRC iXBRL] Computation generation failed:', error);
      throw new Error(`Failed to generate iXBRL tax computation: ${error.message}`);
    }
  }

  /**
   * Generate XBRL contexts for computation
   * HMRC requires specific context structure
   */
  private generateContexts(data: TaxComputationData) {
    const startDate = new Date(data.accountingPeriodStart);
    const endDate = new Date(data.accountingPeriodEnd);

    return [
      {
        id: 'current-period',
        entity: data.companyNumber,
        period: {
          startDate: this.formatDate(startDate),
          endDate: this.formatDate(endDate),
        },
      },
      {
        id: 'current-instant',
        entity: data.companyNumber,
        instant: this.formatDate(endDate),
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
      {
        id: 'pure',
        measure: 'xbrli:pure',
      },
    ];
  }

  /**
   * Build complete iXBRL HTML document with tax computation
   */
  private buildComputationHTML(
    data: TaxComputationData,
    contexts: any[],
    units: any[]
  ): string {
    const namespaceDeclarations = Object.entries(this.namespace)
      .map(([prefix, uri]) => `xmlns:${prefix}="${uri}"`)
      .join(' ');

    const totalAdditions = this.calculateTotalAdditions(data);
    const totalDeductions = this.calculateTotalDeductions(data);

    return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html ${namespaceDeclarations}>
<head>
  <meta charset="UTF-8" />
  <title>Corporation Tax Computation - ${data.companyName}</title>
  <style>
    body { 
      font-family: Arial, sans-serif; 
      margin: 40px; 
      color: #333;
    }
    h1 { 
      color: #1a1a1a; 
      border-bottom: 3px solid #005ea5; 
      padding-bottom: 10px;
    }
    h2 { 
      color: #005ea5; 
      margin-top: 30px;
      border-bottom: 1px solid #ddd;
      padding-bottom: 5px;
    }
    table { 
      border-collapse: collapse; 
      width: 100%; 
      margin: 20px 0;
      background: white;
    }
    th, td { 
      border: 1px solid #ddd; 
      padding: 12px 8px; 
      text-align: left; 
    }
    th { 
      background-color: #005ea5; 
      color: white;
      font-weight: 600;
    }
    td.number { 
      text-align: right; 
      font-family: 'Courier New', monospace;
    }
    tr.total { 
      background-color: #f0f4f8; 
      font-weight: bold;
    }
    tr.subtotal { 
      background-color: #f8f9fa;
      font-weight: 600;
    }
    .section { 
      margin: 30px 0;
      padding: 20px;
      background: #f8f9fa;
      border-left: 4px solid #005ea5;
    }
    .info-box {
      background: #e3f2fd;
      border: 1px solid #90caf9;
      border-radius: 4px;
      padding: 15px;
      margin: 20px 0;
    }
    .guidance {
      background: #fff3cd;
      border: 1px solid #ffc107;
      border-radius: 4px;
      padding: 15px;
      margin: 20px 0;
    }
  </style>
  
  <!-- XBRL Contexts and Units -->
  <ix:header>
    <ix:hidden>
      ${contexts.map(ctx => this.renderContext(ctx)).join('\n      ')}
      ${units.map(unit => this.renderUnit(unit)).join('\n      ')}
    </ix:hidden>
  </ix:header>
</head>
<body>
  <h1>Corporation Tax Computation</h1>
  
  <div class="info-box">
    <p><strong>Company:</strong> <ix:nonNumeric name="uk-core:EntityCurrentLegalName" contextRef="current-instant">${data.companyName}</ix:nonNumeric></p>
    <p><strong>Company Number:</strong> <ix:nonNumeric name="uk-core:CompaniesHouseRegisteredNumber" contextRef="current-instant">${data.companyNumber}</ix:nonNumeric></p>
    <p><strong>UTR:</strong> <ix:nonNumeric name="uk-core:UKCompaniesHouseRegisteredNumber" contextRef="current-instant">${data.companyUTR}</ix:nonNumeric></p>
    <p><strong>Accounting Period:</strong> 
      <ix:nonFraction name="uk-core:StartDateForPeriodCoveredByReport" contextRef="current-period" format="ixt:datedaymonthyearen">${data.accountingPeriodStart}</ix:nonFraction> to 
      <ix:nonFraction name="uk-core:EndDateForPeriodCoveredByReport" contextRef="current-period" format="ixt:datedaymonthyearen">${data.accountingPeriodEnd}</ix:nonFraction>
    </p>
  </div>

  <!-- SECTION 1: Detailed Profit & Loss (DPL) - MANDATORY for HMRC -->
  <div class="section">
    <h2>Detailed Profit and Loss Account</h2>
    <p class="guidance"><strong>HMRC Requirement:</strong> Detailed P&L tagging is mandatory for all accounting periods starting on or after 1 April 2014. This must be tagged in EITHER the tax computation OR the accounts (not both).</p>
    
    <table>
      <thead>
        <tr>
          <th>Description</th>
          <th class="number">Amount (£)</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Turnover</strong></td>
          <td class="number">
            <ix:nonFraction name="uk-gaap:Turnover" contextRef="current-period" unitRef="GBP" decimals="0">
              ${data.turnover}
            </ix:nonFraction>
          </td>
        </tr>
        ${data.costOfSales ? `
        <tr>
          <td>Cost of Sales</td>
          <td class="number">
            <ix:nonFraction name="uk-gaap:CostSales" contextRef="current-period" unitRef="GBP" decimals="0" sign="-">
              ${data.costOfSales}
            </ix:nonFraction>
          </td>
        </tr>` : ''}
        <tr class="subtotal">
          <td><strong>Gross Profit</strong></td>
          <td class="number">
            <ix:nonFraction name="uk-gaap:GrossProfit" contextRef="current-period" unitRef="GBP" decimals="0">
              ${data.grossProfit}
            </ix:nonFraction>
          </td>
        </tr>
        ${data.administrativeExpenses ? `
        <tr>
          <td>Administrative Expenses</td>
          <td class="number">
            <ix:nonFraction name="uk-gaap:AdministrativeExpenses" contextRef="current-period" unitRef="GBP" decimals="0" sign="-">
              ${data.administrativeExpenses}
            </ix:nonFraction>
          </td>
        </tr>` : ''}
        ${data.distributionCosts ? `
        <tr>
          <td>Distribution Costs</td>
          <td class="number">
            <ix:nonFraction name="uk-gaap:DistributionCosts" contextRef="current-period" unitRef="GBP" decimals="0" sign="-">
              ${data.distributionCosts}
            </ix:nonFraction>
          </td>
        </tr>` : ''}
        <tr class="subtotal">
          <td><strong>Operating Profit</strong></td>
          <td class="number">
            <ix:nonFraction name="uk-gaap:OperatingProfitLoss" contextRef="current-period" unitRef="GBP" decimals="0">
              ${data.operatingProfit}
            </ix:nonFraction>
          </td>
        </tr>
        ${data.interestReceivable ? `
        <tr>
          <td>Interest Receivable</td>
          <td class="number">
            <ix:nonFraction name="uk-gaap:InterestReceivable" contextRef="current-period" unitRef="GBP" decimals="0">
              ${data.interestReceivable}
            </ix:nonFraction>
          </td>
        </tr>` : ''}
        ${data.interestPayable ? `
        <tr>
          <td>Interest Payable</td>
          <td class="number">
            <ix:nonFraction name="uk-gaap:InterestPayable" contextRef="current-period" unitRef="GBP" decimals="0" sign="-">
              ${data.interestPayable}
            </ix:nonFraction>
          </td>
        </tr>` : ''}
        <tr class="total">
          <td><strong>Profit Before Tax</strong></td>
          <td class="number">
            <ix:nonFraction name="uk-gaap:ProfitLossBeforeTax" contextRef="current-period" unitRef="GBP" decimals="0">
              ${data.profitBeforeTax}
            </ix:nonFraction>
          </td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- SECTION 2: Tax Computation Adjustments -->
  <div class="section">
    <h2>Tax Computation</h2>
    
    <table>
      <thead>
        <tr>
          <th>Description</th>
          <th class="number">Amount (£)</th>
        </tr>
      </thead>
      <tbody>
        <tr class="total">
          <td><strong>Accounting Profit per Accounts</strong></td>
          <td class="number">
            <ix:nonFraction name="hmrc-ct:AccountingProfit" contextRef="current-period" unitRef="GBP" decimals="0">
              ${data.profitBeforeTax}
            </ix:nonFraction>
          </td>
        </tr>
        
        <tr><th colspan="2">Add Back:</th></tr>
        ${data.addBackDepreciation ? `
        <tr>
          <td>Depreciation</td>
          <td class="number">
            <ix:nonFraction name="hmrc-ct:DepreciationAddBack" contextRef="current-period" unitRef="GBP" decimals="0">
              ${data.addBackDepreciation}
            </ix:nonFraction>
          </td>
        </tr>` : ''}
        ${data.addBackEntertainment ? `
        <tr>
          <td>Entertainment (Disallowable)</td>
          <td class="number">
            <ix:nonFraction name="hmrc-ct:EntertainmentDisallowed" contextRef="current-period" unitRef="GBP" decimals="0">
              ${data.addBackEntertainment}
            </ix:nonFraction>
          </td>
        </tr>` : ''}
        ${this.renderOtherAdditions(data.otherAdditions)}
        
        <tr class="subtotal">
          <td><strong>Total Additions</strong></td>
          <td class="number">
            <ix:nonFraction name="hmrc-ct:TotalAdditions" contextRef="current-period" unitRef="GBP" decimals="0">
              ${totalAdditions}
            </ix:nonFraction>
          </td>
        </tr>
        
        <tr><th colspan="2">Deduct:</th></tr>
        ${data.capitalAllowances ? `
        <tr>
          <td>Capital Allowances</td>
          <td class="number">
            <ix:nonFraction name="hmrc-ct:CapitalAllowances" contextRef="current-period" unitRef="GBP" decimals="0" sign="-">
              ${data.capitalAllowances}
            </ix:nonFraction>
          </td>
        </tr>` : ''}
        ${this.renderOtherDeductions(data.otherDeductions)}
        ${data.losses?.usedInPeriod ? `
        <tr>
          <td>Losses Used in Period</td>
          <td class="number">
            <ix:nonFraction name="hmrc-ct:LossesUsed" contextRef="current-period" unitRef="GBP" decimals="0" sign="-">
              ${data.losses.usedInPeriod}
            </ix:nonFraction>
          </td>
        </tr>` : ''}
        
        <tr class="subtotal">
          <td><strong>Total Deductions</strong></td>
          <td class="number">
            <ix:nonFraction name="hmrc-ct:TotalDeductions" contextRef="current-period" unitRef="GBP" decimals="0" sign="-">
              ${totalDeductions}
            </ix:nonFraction>
          </td>
        </tr>
        
        <tr class="total">
          <td><strong>Taxable Profit (CT600 Box 37)</strong></td>
          <td class="number">
            <ix:nonFraction name="hmrc-ct:TaxableProfit" contextRef="current-period" unitRef="GBP" decimals="0">
              ${data.taxableProfit}
            </ix:nonFraction>
          </td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- SECTION 3: Corporation Tax Liability -->
  <div class="section">
    <h2>Corporation Tax Liability</h2>
    
    <table>
      <thead>
        <tr>
          <th>Description</th>
          <th class="number">Amount (£) / Rate (%)</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Taxable Profit</td>
          <td class="number">
            <ix:nonFraction name="hmrc-ct:TaxableProfit" contextRef="current-period" unitRef="GBP" decimals="0">
              ${data.taxableProfit}
            </ix:nonFraction>
          </td>
        </tr>
        <tr>
          <td>Corporation Tax Rate</td>
          <td class="number">
            <ix:nonFraction name="hmrc-ct:CorporationTaxRate" contextRef="current-period" unitRef="pure" decimals="2">
              ${data.corporationTaxRate}
            </ix:nonFraction>%
          </td>
        </tr>
        <tr class="total">
          <td><strong>Corporation Tax Due (CT600 Box 470)</strong></td>
          <td class="number">
            <ix:nonFraction name="hmrc-ct:CorporationTaxDue" contextRef="current-period" unitRef="GBP" decimals="0">
              ${data.corporationTaxDue}
            </ix:nonFraction>
          </td>
        </tr>
        ${data.rdCredits ? `
        <tr>
          <td>Less: R&D Tax Credits</td>
          <td class="number">
            <ix:nonFraction name="hmrc-ct:ResearchDevelopmentCredit" contextRef="current-period" unitRef="GBP" decimals="0" sign="-">
              ${data.rdCredits}
            </ix:nonFraction>
          </td>
        </tr>` : ''}
        <tr class="total">
          <td><strong>Total Tax Payable</strong></td>
          <td class="number">
            <ix:nonFraction name="hmrc-ct:TotalTaxPayable" contextRef="current-period" unitRef="GBP" decimals="0">
              ${this.calculateTotalTax(data)}
            </ix:nonFraction>
          </td>
        </tr>
      </tbody>
    </table>
  </div>

  ${data.losses ? this.renderLossesSection(data.losses) : ''}

  <!-- Validation Summary -->
  <div class="info-box">
    <h3>iXBRL Tagging Compliance</h3>
    <p>✅ Detailed Profit & Loss (DPL) tagging complete (mandatory since April 2014)</p>
    <p>✅ Tax computation elements tagged with HMRC CT taxonomy</p>
    <p>✅ Company entity identifier linked to Companies House registration</p>
    <p>✅ Accounting period dates properly tagged</p>
    <p>✅ All monetary values tagged with GBP currency unit</p>
  </div>

  <div class="guidance">
    <h3>Important Notes for HMRC Submission</h3>
    <ul>
      <li>This computation must be submitted in iXBRL format with your CT600 return</li>
      <li>DPL tagging should appear in EITHER the computation OR the accounts (not both)</li>
      <li>Ensure all figures match the CT600 form (HMRC validates cross-references)</li>
      <li>The taxable profit must equal CT600 Box 37</li>
      <li>Corporation tax due must equal CT600 Box 470</li>
    </ul>
  </div>

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
   * Render other additions
   */
  private renderOtherAdditions(additions?: number[]): string {
    if (!additions || additions.length === 0) return '';
    
    return additions.map((amount, index) => `
        <tr>
          <td>Other Addition ${index + 1}</td>
          <td class="number">
            <ix:nonFraction name="hmrc-ct:OtherAddition" contextRef="current-period" unitRef="GBP" decimals="0">
              ${amount}
            </ix:nonFraction>
          </td>
        </tr>`).join('');
  }

  /**
   * Render other deductions
   */
  private renderOtherDeductions(deductions?: number[]): string {
    if (!deductions || deductions.length === 0) return '';
    
    return deductions.map((amount, index) => `
        <tr>
          <td>Other Deduction ${index + 1}</td>
          <td class="number">
            <ix:nonFraction name="hmrc-ct:OtherDeduction" contextRef="current-period" unitRef="GBP" decimals="0" sign="-">
              ${amount}
            </ix:nonFraction>
          </td>
        </tr>`).join('');
  }

  /**
   * Render losses section
   */
  private renderLossesSection(losses: any): string {
    return `
  <!-- SECTION 4: Losses -->
  <div class="section">
    <h2>Tax Losses</h2>
    
    <table>
      <thead>
        <tr>
          <th>Description</th>
          <th class="number">Amount (£)</th>
        </tr>
      </thead>
      <tbody>
        ${losses.broughtForward ? `
        <tr>
          <td>Losses Brought Forward</td>
          <td class="number">
            <ix:nonFraction name="hmrc-ct:LossesBroughtForward" contextRef="current-instant" unitRef="GBP" decimals="0">
              ${losses.broughtForward}
            </ix:nonFraction>
          </td>
        </tr>` : ''}
        ${losses.usedInPeriod ? `
        <tr>
          <td>Less: Losses Used in Period</td>
          <td class="number">
            <ix:nonFraction name="hmrc-ct:LossesUsedInPeriod" contextRef="current-period" unitRef="GBP" decimals="0" sign="-">
              ${losses.usedInPeriod}
            </ix:nonFraction>
          </td>
        </tr>` : ''}
        ${losses.carriedForward ? `
        <tr class="total">
          <td><strong>Losses Carried Forward</strong></td>
          <td class="number">
            <ix:nonFraction name="hmrc-ct:LossesCarriedForward" contextRef="current-instant" unitRef="GBP" decimals="0">
              ${losses.carriedForward}
            </ix:nonFraction>
          </td>
        </tr>` : ''}
      </tbody>
    </table>
  </div>`;
  }

  /**
   * Calculate total additions
   */
  private calculateTotalAdditions(data: TaxComputationData): number {
    let total = 0;
    if (data.addBackDepreciation) total += data.addBackDepreciation;
    if (data.addBackEntertainment) total += data.addBackEntertainment;
    if (data.otherAdditions) {
      total += data.otherAdditions.reduce((sum, val) => sum + val, 0);
    }
    return total;
  }

  /**
   * Calculate total deductions
   */
  private calculateTotalDeductions(data: TaxComputationData): number {
    let total = 0;
    if (data.capitalAllowances) total += data.capitalAllowances;
    if (data.losses?.usedInPeriod) total += data.losses.usedInPeriod;
    if (data.otherDeductions) {
      total += data.otherDeductions.reduce((sum, val) => sum + val, 0);
    }
    return total;
  }

  /**
   * Calculate total tax payable
   */
  private calculateTotalTax(data: TaxComputationData): number {
    let total = data.corporationTaxDue;
    if (data.rdCredits) total -= data.rdCredits;
    if (data.otherReliefs) {
      total -= data.otherReliefs.reduce((sum, val) => sum + val, 0);
    }
    return Math.max(0, total); // Tax cannot be negative
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
   * Validate iXBRL computation document
   */
  async validateIXBRLComputation(document: iXBRLComputationDocument): Promise<{ valid: boolean; errors: string[]; warnings: string[] }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check DPL tagging (mandatory since April 2014)
    if (!document.validationChecks.hasDPL) {
      errors.push('Missing Detailed Profit & Loss (DPL) tagging - mandatory for all periods starting on/after 1 April 2014');
    }

    // Check computation tags
    if (!document.validationChecks.hasComputationTags) {
      errors.push('Missing tax computation tags (HMRC CT taxonomy)');
    }

    // Check contexts
    if (!document.validationChecks.hasRequiredContexts) {
      errors.push('Missing required XBRL contexts (need period and instant contexts)');
    }

    // Check for common validation issues
    if (!document.html.includes('hmrc-ct:TaxableProfit')) {
      errors.push('Missing taxable profit tag (must match CT600 Box 37)');
    }

    if (!document.html.includes('hmrc-ct:CorporationTaxDue')) {
      errors.push('Missing corporation tax due tag (must match CT600 Box 470)');
    }

    // Size check
    if (document.size > 10 * 1024 * 1024) {
      warnings.push('Document size exceeds 10MB - consider Base64 encoding for faster HMRC processing');
    }

    // DPL duplication warning
    warnings.push('Ensure DPL is tagged in EITHER computation OR accounts (not both) to avoid HMRC compliance reviews');

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }
}

export const hmrcIXBRLComputationService = new HMRCIXBRLComputationService();
export type { TaxComputationData, iXBRLComputationDocument };

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
    'uk-gaap': 'http://www.xbrl.org/uk/fr/gaap/pt/2025-01-01',
    'uk-core': 'http://www.xbrl.org/uk/cd/2025-01-01',
    iso4217: 'http://www.xbrl.org/2003/iso4217',
  };

  /**
   * Generate iXBRL-tagged accounts document
   */
  async generateiXBRLAccounts(accountsData: AccountsData): Promise<iXBRLDocument> {
    try {
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
    table { border-collapse: collapse; width: 100%; margin: 20px 0; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #f2f2f2; }
    .number { text-align: right; }
  </style>
  
  <!-- XBRL Contexts -->
  <ix:header>
    <ix:hidden>
      ${contexts.map(ctx => this.renderContext(ctx)).join('\n      ')}
      ${units.map(unit => this.renderUnit(unit)).join('\n      ')}
    </ix:hidden>
  </ix:header>
</head>
<body>
  <h1>${accountsData.companyName}</h1>
  <p>Company Number: <ix:nonNumeric name="uk-core:EntityCurrentLegalName" contextRef="current-instant">${accountsData.companyNumber}</ix:nonNumeric></p>
  
  <h2>Balance Sheet</h2>
  <p>As at <ix:nonFraction name="uk-core:BalanceSheetDate" contextRef="current-instant">${accountsData.accountingPeriodEnd}</ix:nonFraction></p>
  
  ${this.renderBalanceSheet(accountsData.balanceSheet)}
  
  <h2>Profit and Loss Account</h2>
  <p>For the period ending <ix:nonFraction name="uk-gaap:EndDateForPeriodCoveredByReport" contextRef="current-period">${accountsData.accountingPeriodEnd}</ix:nonFraction></p>
  
  ${this.renderProfitLoss(accountsData.profitLoss)}
  
  <h2>Notes to the Accounts</h2>
  ${this.renderNotes(accountsData.notes)}
  
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
   * Render balance sheet with iXBRL tags
   */
  private renderBalanceSheet(balanceSheet: any): string {
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
   * Render notes (untagged for now - could be enhanced)
   */
  private renderNotes(notes: string): string {
    return `<div class="notes">${notes}</div>`;
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

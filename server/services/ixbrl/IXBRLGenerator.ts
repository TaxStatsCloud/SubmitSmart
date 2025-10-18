/**
 * iXBRL Generator Base Service
 * 
 * Generates iXBRL (Inline XBRL) documents for UK Annual Accounts
 * conforming to FRC 2025 Taxonomy Suite
 * 
 * iXBRL embeds XBRL tags directly in HTML, allowing:
 * 1. Human-readable presentation (HTML)
 * 2. Machine-readable structured data (XBRL tags)
 * 3. Direct submission to Companies House and HMRC
 */

import { EntitySize } from './EntitySizeDetector';

export interface IXBRLContext {
  companyName: string;
  companyNumber: string;
  periodStart: string; // YYYY-MM-DD
  periodEnd: string; // YYYY-MM-DD
  balanceSheetDate: string; // YYYY-MM-DD
  entitySize: EntitySize;
  accountingFramework: string;
  currency: string; // e.g., "GBP"
}

export interface IXBRLNamespaces {
  ix: string;
  xbrli: string;
  ixtSecNumFormat: string;
  xlink: string;
  link: string;
  iso4217: string;
  ukGAAP: string;
  core: string;
  countries: string;
  dirRep: string;
  bus: string;
}

export class IXBRLGenerator {
  /**
   * FRC 2025 Taxonomy namespaces (corrected URLs)
   */
  private static readonly FRC_2025_NAMESPACES: IXBRLNamespaces = {
    ix: 'http://www.xbrl.org/2013/inlineXBRL',
    xbrli: 'http://www.xbrl.org/2003/instance',
    ixtSecNumFormat: 'http://www.sec.gov/inlineXBRL/transformation/2015-08-31',
    xlink: 'http://www.w3.org/1999/xlink',
    link: 'http://www.xbrl.org/2003/linkbase',
    iso4217: 'http://www.xbrl.org/2003/iso4217',
    ukGAAP: 'http://xbrl.frc.org.uk/cd/2025-01-01/business',
    core: 'http://xbrl.frc.org.uk/cd/2025-01-01/business',
    countries: 'http://xbrl.frc.org.uk/cd/2025-01-01/countries',
    dirRep: 'http://xbrl.frc.org.uk/reports/2025-01-01/dirRep',
    bus: 'http://xbrl.frc.org.uk/cd/2025-01-01/business',
  };

  /**
   * Get schema reference URL based on accounting framework/entity size
   */
  private static getSchemaRef(entitySize: EntitySize): string {
    switch (entitySize) {
      case 'micro':
        return 'http://xbrl.frc.org.uk/fr/2025-01-01/uk-gaap-frs-105-2025-01-01.xsd';
      case 'small':
      case 'medium':
        return 'http://xbrl.frc.org.uk/fr/2025-01-01/uk-gaap-frs-102-2025-01-01.xsd';
      case 'large':
        return 'http://xbrl.frc.org.uk/fr/2025-01-01/uk-ifrs-2025-01-01.xsd';
      default:
        return 'http://xbrl.frc.org.uk/fr/2025-01-01/uk-gaap-frs-102-2025-01-01.xsd';
    }
  }

  /**
   * Generate iXBRL HTML document header with all required namespaces
   */
  static generateDocumentHeader(context: IXBRLContext): string {
    const namespaces = this.FRC_2025_NAMESPACES;

    return `<!DOCTYPE html>
<html xmlns="${namespaces.ix}"
      xmlns:xbrli="${namespaces.xbrli}"
      xmlns:ixt-sec-num-format="${namespaces.ixtSecNumFormat}"
      xmlns:xlink="${namespaces.xlink}"
      xmlns:link="${namespaces.link}"
      xmlns:iso4217="${namespaces.iso4217}"
      xmlns:uk-gaap="${namespaces.ukGAAP}"
      xmlns:core="${namespaces.core}"
      xmlns:countries="${namespaces.countries}"
      xmlns:dir-rep="${namespaces.dirRep}"
      xmlns:bus="${namespaces.bus}">
<head>
  <meta charset="UTF-8" />
  <meta name="generator" content="PromptSubmissions iXBRL Generator" />
  <title>Annual Accounts - ${this.escapeHtml(context.companyName)} - ${context.periodEnd}</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      line-height: 1.6;
    }
    h1, h2, h3 {
      color: #333;
      margin-top: 30px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    th, td {
      padding: 10px;
      text-align: left;
      border-bottom: 1px solid #ddd;
    }
    th {
      background-color: #f5f5f5;
      font-weight: bold;
    }
    .number {
      text-align: right;
      font-family: 'Courier New', monospace;
    }
    .total {
      border-top: 2px solid #333;
      font-weight: bold;
    }
    .note {
      font-size: 0.9em;
      color: #666;
      margin-top: 5px;
    }
  </style>
</head>
<body>`;
  }

  /**
   * Generate iXBRL contexts (time periods and scenarios) with comparative period support
   */
  static generateContexts(context: IXBRLContext, includeComparative: boolean = true): string {
    const currentPeriodId = 'current';
    const previousPeriodId = 'previous';
    const balanceSheetId = 'balance-sheet';
    const balanceSheetPreviousId = 'balance-sheet-previous';

    // Calculate previous period dates (assume 12-month period)
    const periodEndDate = new Date(context.periodEnd);
    const periodStartDate = new Date(context.periodStart);
    const previousPeriodEndDate = new Date(periodStartDate);
    previousPeriodEndDate.setDate(previousPeriodEndDate.getDate() - 1);
    const previousPeriodStartDate = new Date(previousPeriodEndDate);
    previousPeriodStartDate.setFullYear(previousPeriodStartDate.getFullYear() - 1);
    previousPeriodStartDate.setDate(previousPeriodStartDate.getDate() + 1);

    const formatDate = (date: Date) => date.toISOString().split('T')[0];

    let contextsXml = `
  <ix:header>
    <ix:hidden>
      <ix:references>
        <!-- Schema reference (dynamic based on entity size) -->
        <link:schemaRef xlink:type="simple"
                        xlink:href="${this.getSchemaRef(context.entitySize)}" />
      </ix:references>
      
      <!-- Current period context -->
      <xbrli:context id="${currentPeriodId}">
        <xbrli:entity>
          <xbrli:identifier scheme="http://www.companieshouse.gov.uk/">
            ${context.companyNumber}
          </xbrli:identifier>
        </xbrli:entity>
        <xbrli:period>
          <xbrli:startDate>${context.periodStart}</xbrli:startDate>
          <xbrli:endDate>${context.periodEnd}</xbrli:endDate>
        </xbrli:period>
      </xbrli:context>
      
      <!-- Balance sheet date context (instant) -->
      <xbrli:context id="${balanceSheetId}">
        <xbrli:entity>
          <xbrli:identifier scheme="http://www.companieshouse.gov.uk/">
            ${context.companyNumber}
          </xbrli:identifier>
        </xbrli:entity>
        <xbrli:period>
          <xbrli:instant>${context.balanceSheetDate}</xbrli:instant>
        </xbrli:period>
      </xbrli:context>`;

    if (includeComparative) {
      contextsXml += `
      
      <!-- Previous period context -->
      <xbrli:context id="${previousPeriodId}">
        <xbrli:entity>
          <xbrli:identifier scheme="http://www.companieshouse.gov.uk/">
            ${context.companyNumber}
          </xbrli:identifier>
        </xbrli:entity>
        <xbrli:period>
          <xbrli:startDate>${formatDate(previousPeriodStartDate)}</xbrli:startDate>
          <xbrli:endDate>${formatDate(previousPeriodEndDate)}</xbrli:endDate>
        </xbrli:period>
      </xbrli:context>
      
      <!-- Balance sheet previous date context (instant) -->
      <xbrli:context id="${balanceSheetPreviousId}">
        <xbrli:entity>
          <xbrli:identifier scheme="http://www.companieshouse.gov.uk/">
            ${context.companyNumber}
          </xbrli:identifier>
        </xbrli:entity>
        <xbrli:period>
          <xbrli:instant>${formatDate(previousPeriodEndDate)}</xbrli:instant>
        </xbrli:period>
      </xbrli:context>`;
    }

    contextsXml += `
      
      <!-- Unit for currency -->
      <xbrli:unit id="${context.currency}">
        <xbrli:measure>iso4217:${context.currency}</xbrli:measure>
      </xbrli:unit>
      
      <!-- Unit for pure numbers (shares, employees, etc.) -->
      <xbrli:unit id="pure">
        <xbrli:measure>xbrli:pure</xbrli:measure>
      </xbrli:unit>
    </ix:hidden>
  </ix:header>`;

    return contextsXml;
  }

  /**
   * Tag a monetary value with iXBRL (corrected for Companies House validation)
   */
  static tagMonetary(
    value: number,
    concept: string,
    contextRef: string = 'current',
    currency: string = 'GBP',
    decimals: number = 0
  ): string {
    const isNegative = value < 0;
    const absValue = Math.abs(value);
    const formattedValue = absValue.toLocaleString('en-GB');

    // For negative values, include sign attribute; for positive, omit it
    const signAttr = isNegative ? ' sign="-"' : '';

    return `<ix:nonFraction contextRef="${contextRef}" name="uk-gaap:${concept}" unitRef="${currency}" decimals="${decimals}" format="ixt-sec-num-format:numdotdecimal"${signAttr}>${formattedValue}</ix:nonFraction>`;
  }

  /**
   * Tag a text value with iXBRL
   */
  static tagText(value: string, concept: string, contextRef: string = 'current'): string {
    return `<ix:nonNumeric 
      contextRef="${contextRef}" 
      name="uk-gaap:${concept}">${this.escapeHtml(value)}</ix:nonNumeric>`;
  }

  /**
   * Tag a date value with iXBRL
   */
  static tagDate(date: string, concept: string, contextRef: string = 'current'): string {
    return `<ix:nonNumeric 
      contextRef="${contextRef}" 
      name="uk-gaap:${concept}" 
      format="ixt:datelonguk">${date}</ix:nonNumeric>`;
  }

  /**
   * Generate document footer
   */
  static generateDocumentFooter(): string {
    return `
</body>
</html>`;
  }

  /**
   * Escape HTML special characters
   */
  private static escapeHtml(text: string): string {
    const map: { [key: string]: string } = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };
    return text.replace(/[&<>"']/g, (char) => map[char]);
  }

  /**
   * Generate complete iXBRL document wrapper
   */
  static wrapDocument(context: IXBRLContext, content: string): string {
    return `${this.generateDocumentHeader(context)}
${this.generateContexts(context)}

<div class="annual-accounts">
  <h1>${this.escapeHtml(context.companyName)}</h1>
  <h2>Registered Number: ${context.companyNumber}</h2>
  <h2>Annual Accounts</h2>
  <h3>For the year ended ${context.periodEnd}</h3>
  
  ${content}
  
  <div class="note">
    <p>These accounts have been prepared in accordance with ${this.escapeHtml(context.accountingFramework)}.</p>
    <p>Generated by PromptSubmissions - AI-Powered UK Corporate Compliance Platform</p>
  </div>
</div>

${this.generateDocumentFooter()}`;
  }
}

/**
 * iXBRL Profit & Loss Account Generator
 * 
 * Generates FRC 2025 compliant P&L statements with comparative year support
 * Supports all entity sizes and formats (detailed, abridged, micro)
 */

import { IXBRLGenerator, IXBRLContext } from './IXBRLGenerator';
import { EntitySize } from './EntitySizeDetector';

export interface ProfitLossData {
  // Revenue
  turnover: number;
  otherOperatingIncome?: number;
  
  // Cost of Sales (for detailed P&L)
  costOfSales?: number;
  
  // Operating Expenses
  administrativeExpenses?: number;
  distributionCosts?: number;
  otherOperatingCharges?: number;
  
  // Employment
  staffCosts?: number;
  
  // Finance
  interestPayable?: number;
  interestReceivable?: number;
  
  // Tax
  taxOnProfitOrLoss?: number;
  
  // Final Result
  profitLossForFinancialYear: number;
}

export interface ComparativeProfitLoss {
  currentYear: ProfitLossData;
  previousYear?: ProfitLossData;
}

export class ProfitLossGenerator {
  /**
   * Generate complete iXBRL Profit & Loss Account
   */
  static generate(
    context: IXBRLContext,
    data: ComparativeProfitLoss,
    format: 'detailed' | 'standard' | 'abridged' = 'standard'
  ): string {
    const { currentYear, previousYear } = data;

    let html = '<div class="profit-loss">\n';
    html += '<h2>Profit and Loss Account</h2>\n';
    html += `<h3>For the year ended ${context.periodEnd}</h3>\n\n`;

    html += '<table>\n';
    html += '<thead>\n';
    html += '<tr>\n';
    html += '<th>Note</th>\n';
    html += '<th></th>\n';
    html += `<th class="number">${new Date(context.periodEnd).getFullYear()}<br/>£</th>\n`;
    if (previousYear) {
      html += `<th class="number">${new Date(context.periodEnd).getFullYear() - 1}<br/>£</th>\n`;
    }
    html += '</tr>\n';
    html += '</thead>\n';
    html += '<tbody>\n';

    if (format === 'detailed') {
      html += this.generateDetailedFormat(currentYear, previousYear);
    } else if (format === 'abridged') {
      html += this.generateAbridgedFormat(currentYear, previousYear);
    } else {
      html += this.generateStandardFormat(currentYear, previousYear);
    }

    html += '</tbody>\n';
    html += '</table>\n';
    html += '</div>\n';

    return html;
  }

  /**
   * Generate detailed P&L format (with Cost of Sales)
   */
  private static generateDetailedFormat(
    current: ProfitLossData,
    previous: ProfitLossData | undefined
  ): string {
    let html = '';

    // Turnover
    html += '<tr>\n';
    html += '<td>1</td>\n';
    html += '<td><strong>Turnover</strong></td>\n';
    html += `<td class="number"><strong>${IXBRLGenerator.tagMonetary(
      current.turnover,
      'Turnover',
      'current',
      'GBP',
      0
    )}</strong></td>\n`;
    if (previous) {
      html += `<td class="number"><strong>${IXBRLGenerator.tagMonetary(
        previous.turnover,
        'Turnover',
        'previous',
        'GBP',
        0
      )}</strong></td>\n`;
    }
    html += '</tr>\n';

    // Cost of Sales
    if (current.costOfSales) {
      html += '<tr>\n';
      html += '<td>2</td>\n';
      html += '<td>Cost of sales</td>\n';
      html += `<td class="number">${IXBRLGenerator.tagMonetary(
        -current.costOfSales,
        'CostSales',
        'current',
        'GBP',
        0
      )}</td>\n`;
      if (previous && previous.costOfSales) {
        html += `<td class="number">${IXBRLGenerator.tagMonetary(
          -previous.costOfSales,
          'CostSales',
          'previous',
          'GBP',
          0
        )}</td>\n`;
      } else if (previous) {
        html += `<td class="number">-</td>\n`;
      }
      html += '</tr>\n';

      // Gross Profit
      const grossProfit = current.turnover - (current.costOfSales || 0);
      const prevGrossProfit = previous ? previous.turnover - (previous.costOfSales || 0) : 0;

      html += '<tr class="total">\n';
      html += '<td></td>\n';
      html += '<td><strong>Gross profit</strong></td>\n';
      html += `<td class="number"><strong>${IXBRLGenerator.tagMonetary(
        grossProfit,
        'GrossProfit',
        'current',
        'GBP',
        0
      )}</strong></td>\n`;
      if (previous) {
        html += `<td class="number"><strong>${IXBRLGenerator.tagMonetary(
          prevGrossProfit,
          'GrossProfit',
          'previous',
          'GBP',
          0
        )}</strong></td>\n`;
      }
      html += '</tr>\n';
      html += '<tr><td colspan="4">&nbsp;</td></tr>\n';
    }

    html += this.generateExpensesSection(current, previous);
    html += this.generateOperatingProfitSection(current, previous);
    html += this.generateFinanceSection(current, previous);
    html += this.generateTaxSection(current, previous);
    html += this.generateFinalProfitSection(current, previous);

    return html;
  }

  /**
   * Generate standard P&L format
   */
  private static generateStandardFormat(
    current: ProfitLossData,
    previous: ProfitLossData | undefined
  ): string {
    let html = '';

    // Turnover
    html += '<tr>\n';
    html += '<td>1</td>\n';
    html += '<td><strong>Turnover</strong></td>\n';
    html += `<td class="number"><strong>${IXBRLGenerator.tagMonetary(
      current.turnover,
      'Turnover',
      'current',
      'GBP',
      0
    )}</strong></td>\n`;
    if (previous) {
      html += `<td class="number"><strong>${IXBRLGenerator.tagMonetary(
        previous.turnover,
        'Turnover',
        'previous',
        'GBP',
        0
      )}</strong></td>\n`;
    }
    html += '</tr>\n';
    html += '<tr><td colspan="4">&nbsp;</td></tr>\n';

    html += this.generateExpensesSection(current, previous);
    html += this.generateOperatingProfitSection(current, previous);
    html += this.generateFinanceSection(current, previous);
    html += this.generateTaxSection(current, previous);
    html += this.generateFinalProfitSection(current, previous);

    return html;
  }

  /**
   * Generate abridged P&L format (minimal disclosure)
   */
  private static generateAbridgedFormat(
    current: ProfitLossData,
    previous: ProfitLossData | undefined
  ): string {
    let html = '';

    html += '<tr>\n';
    html += '<td></td>\n';
    html += '<td><strong>Profit/(loss) for the financial year</strong></td>\n';
    html += `<td class="number"><strong>${IXBRLGenerator.tagMonetary(
      current.profitLossForFinancialYear,
      'ProfitLossForPeriod',
      'current',
      'GBP',
      0
    )}</strong></td>\n`;
    if (previous) {
      html += `<td class="number"><strong>${IXBRLGenerator.tagMonetary(
        previous.profitLossForFinancialYear,
        'ProfitLossForPeriod',
        'previous',
        'GBP',
        0
      )}</strong></td>\n`;
    }
    html += '</tr>\n';

    return html;
  }

  /**
   * Generate expenses section
   */
  private static generateExpensesSection(
    current: ProfitLossData,
    previous: ProfitLossData | undefined
  ): string {
    let html = '';

    if (current.administrativeExpenses) {
      html += '<tr>\n';
      html += '<td>3</td>\n';
      html += '<td>Administrative expenses</td>\n';
      html += `<td class="number">${IXBRLGenerator.tagMonetary(
        -current.administrativeExpenses,
        'AdministrativeExpenses',
        'current',
        'GBP',
        0
      )}</td>\n`;
      if (previous && previous.administrativeExpenses) {
        html += `<td class="number">${IXBRLGenerator.tagMonetary(
          -previous.administrativeExpenses,
          'AdministrativeExpenses',
          'previous',
          'GBP',
          0
        )}</td>\n`;
      } else if (previous) {
        html += `<td class="number">-</td>\n`;
      }
      html += '</tr>\n';
    }

    if (current.distributionCosts) {
      html += '<tr>\n';
      html += '<td>4</td>\n';
      html += '<td>Distribution costs</td>\n';
      html += `<td class="number">${IXBRLGenerator.tagMonetary(
        -current.distributionCosts,
        'DistributionCosts',
        'current',
        'GBP',
        0
      )}</td>\n`;
      if (previous && previous.distributionCosts) {
        html += `<td class="number">${IXBRLGenerator.tagMonetary(
          -previous.distributionCosts,
          'DistributionCosts',
          'previous',
          'GBP',
          0
        )}</td>\n`;
      } else if (previous) {
        html += `<td class="number">-</td>\n`;
      }
      html += '</tr>\n';
    }

    if (current.otherOperatingCharges) {
      html += '<tr>\n';
      html += '<td>5</td>\n';
      html += '<td>Other operating charges</td>\n';
      html += `<td class="number">${IXBRLGenerator.tagMonetary(
        -current.otherOperatingCharges,
        'OtherOperatingExpensesFormat1',
        'current',
        'GBP',
        0
      )}</td>\n`;
      if (previous && previous.otherOperatingCharges) {
        html += `<td class="number">${IXBRLGenerator.tagMonetary(
          -previous.otherOperatingCharges,
          'OtherOperatingExpensesFormat1',
          'previous',
          'GBP',
          0
        )}</td>\n`;
      } else if (previous) {
        html += `<td class="number">-</td>\n`;
      }
      html += '</tr>\n';
    }

    return html;
  }

  /**
   * Generate operating profit section
   */
  private static generateOperatingProfitSection(
    current: ProfitLossData,
    previous: ProfitLossData | undefined
  ): string {
    const operatingProfit = current.turnover - 
      (current.costOfSales || 0) -
      (current.administrativeExpenses || 0) -
      (current.distributionCosts || 0) -
      (current.otherOperatingCharges || 0) +
      (current.otherOperatingIncome || 0);

    const prevOperatingProfit = previous ? 
      previous.turnover - 
      (previous.costOfSales || 0) -
      (previous.administrativeExpenses || 0) -
      (previous.distributionCosts || 0) -
      (previous.otherOperatingCharges || 0) +
      (previous.otherOperatingIncome || 0) : 0;

    let html = '<tr class="total">\n';
    html += '<td></td>\n';
    html += '<td><strong>Operating profit</strong></td>\n';
    html += `<td class="number"><strong>${IXBRLGenerator.tagMonetary(
      operatingProfit,
      'OperatingProfit',
      'current',
      'GBP',
      0
    )}</strong></td>\n`;
    if (previous) {
      html += `<td class="number"><strong>${IXBRLGenerator.tagMonetary(
        prevOperatingProfit,
        'OperatingProfit',
        'previous',
        'GBP',
        0
      )}</strong></td>\n`;
    }
    html += '</tr>\n';
    html += '<tr><td colspan="4">&nbsp;</td></tr>\n';

    return html;
  }

  /**
   * Generate finance section (interest)
   */
  private static generateFinanceSection(
    current: ProfitLossData,
    previous: ProfitLossData | undefined
  ): string {
    let html = '';

    if (current.interestReceivable) {
      html += '<tr>\n';
      html += '<td>6</td>\n';
      html += '<td>Interest receivable and similar income</td>\n';
      html += `<td class="number">${IXBRLGenerator.tagMonetary(
        current.interestReceivable,
        'InterestReceivableSimilarIncome',
        'current',
        'GBP',
        0
      )}</td>\n`;
      if (previous && previous.interestReceivable) {
        html += `<td class="number">${IXBRLGenerator.tagMonetary(
          previous.interestReceivable,
          'InterestReceivableSimilarIncome',
          'previous',
          'GBP',
          0
        )}</td>\n`;
      } else if (previous) {
        html += `<td class="number">-</td>\n`;
      }
      html += '</tr>\n';
    }

    if (current.interestPayable) {
      html += '<tr>\n';
      html += '<td>7</td>\n';
      html += '<td>Interest payable and similar charges</td>\n';
      html += `<td class="number">${IXBRLGenerator.tagMonetary(
        -current.interestPayable,
        'InterestPayableSimilarCharges',
        'current',
        'GBP',
        0
      )}</td>\n`;
      if (previous && previous.interestPayable) {
        html += `<td class="number">${IXBRLGenerator.tagMonetary(
          -previous.interestPayable,
          'InterestPayableSimilarCharges',
          'previous',
          'GBP',
          0
        )}</td>\n`;
      } else if (previous) {
        html += `<td class="number">-</td>\n`;
      }
      html += '</tr>\n';
    }

    if (current.interestReceivable || current.interestPayable) {
      const operatingProfit = current.turnover - 
        (current.costOfSales || 0) -
        (current.administrativeExpenses || 0) -
        (current.distributionCosts || 0) -
        (current.otherOperatingCharges || 0) +
        (current.otherOperatingIncome || 0);

      const profitBeforeTax = operatingProfit + 
        (current.interestReceivable || 0) - 
        (current.interestPayable || 0);

      const prevOperatingProfit = previous ? 
        previous.turnover - 
        (previous.costOfSales || 0) -
        (previous.administrativeExpenses || 0) -
        (previous.distributionCosts || 0) -
        (previous.otherOperatingCharges || 0) +
        (previous.otherOperatingIncome || 0) : 0;

      const prevProfitBeforeTax = previous ?
        prevOperatingProfit + 
        (previous.interestReceivable || 0) - 
        (previous.interestPayable || 0) : 0;

      html += '<tr class="total">\n';
      html += '<td></td>\n';
      html += '<td><strong>Profit on ordinary activities before taxation</strong></td>\n';
      html += `<td class="number"><strong>${IXBRLGenerator.tagMonetary(
        profitBeforeTax,
        'ProfitLossOnOrdinaryActivitiesBeforeTax',
        'current',
        'GBP',
        0
      )}</strong></td>\n`;
      if (previous) {
        html += `<td class="number"><strong>${IXBRLGenerator.tagMonetary(
          prevProfitBeforeTax,
          'ProfitLossOnOrdinaryActivitiesBeforeTax',
          'previous',
          'GBP',
          0
        )}</strong></td>\n`;
      }
      html += '</tr>\n';
      html += '<tr><td colspan="4">&nbsp;</td></tr>\n';
    }

    return html;
  }

  /**
   * Generate tax section
   */
  private static generateTaxSection(
    current: ProfitLossData,
    previous: ProfitLossData | undefined
  ): string {
    if (!current.taxOnProfitOrLoss) {
      return '';
    }

    let html = '<tr>\n';
    html += '<td>8</td>\n';
    html += '<td>Tax on profit on ordinary activities</td>\n';
    html += `<td class="number">${IXBRLGenerator.tagMonetary(
      -current.taxOnProfitOrLoss,
      'TaxTaxCreditOnProfitOrLossOnOrdinaryActivities',
      'current',
      'GBP',
      0
    )}</td>\n`;
    if (previous && previous.taxOnProfitOrLoss) {
      html += `<td class="number">${IXBRLGenerator.tagMonetary(
        -previous.taxOnProfitOrLoss,
        'TaxTaxCreditOnProfitOrLossOnOrdinaryActivities',
        'previous',
        'GBP',
        0
      )}</td>\n`;
    } else if (previous) {
      html += `<td class="number">-</td>\n`;
    }
    html += '</tr>\n';
    html += '<tr><td colspan="4">&nbsp;</td></tr>\n';

    return html;
  }

  /**
   * Generate final profit section
   */
  private static generateFinalProfitSection(
    current: ProfitLossData,
    previous: ProfitLossData | undefined
  ): string {
    let html = '<tr class="total">\n';
    html += '<td></td>\n';
    html += '<td><strong>Profit for the financial year</strong></td>\n';
    html += `<td class="number"><strong>${IXBRLGenerator.tagMonetary(
      current.profitLossForFinancialYear,
      'ProfitLoss',
      'current',
      'GBP',
      0
    )}</strong></td>\n`;
    if (previous) {
      html += `<td class="number"><strong>${IXBRLGenerator.tagMonetary(
        previous.profitLossForFinancialYear,
        'ProfitLoss',
        'previous',
        'GBP',
        0
      )}</strong></td>\n`;
    }
    html += '</tr>\n';

    return html;
  }
}

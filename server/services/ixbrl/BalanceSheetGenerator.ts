/**
 * iXBRL Balance Sheet Generator
 * 
 * Generates FRC 2025 compliant Balance Sheets for all entity sizes:
 * - Micro-entities (FRS 105 / UKSEF)
 * - Small companies (FRS 102 Section 1A)
 * - Medium companies (FRS 102)
 * - Large companies (UK IFRS / FRS 102)
 */

import { IXBRLGenerator, IXBRLContext } from './IXBRLGenerator';
import { EntitySize } from './EntitySizeDetector';

export interface BalanceSheetData {
  // Fixed Assets
  intangibleAssets?: number;
  tangibleAssets?: number;
  investments?: number;
  
  // Current Assets
  stocks?: number;
  debtors?: number;
  cash?: number;
  
  // Current Liabilities
  creditorsDueWithinOneYear?: number;
  
  // Non-current Liabilities
  creditorsDueAfterOneYear?: number;
  provisions?: number;
  
  // Capital and Reserves
  calledUpShareCapital: number;
  sharePremium?: number;
  revaluationReserve?: number;
  otherReserves?: number;
  profitAndLossAccount: number;
}

export interface ComparativeBalanceSheet {
  currentYear: BalanceSheetData;
  previousYear?: BalanceSheetData;
}

export class BalanceSheetGenerator {
  /**
   * Generate complete iXBRL Balance Sheet
   */
  static generate(
    context: IXBRLContext,
    data: ComparativeBalanceSheet
  ): string {
    const { currentYear, previousYear } = data;

    let html = '<div class="balance-sheet">\n';
    html += '<h2>Balance Sheet</h2>\n';
    html += `<h3>As at ${context.balanceSheetDate}</h3>\n\n`;

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

    // Fixed Assets Section
    html += this.generateFixedAssetsSection(currentYear, previousYear, context.entitySize);

    // Current Assets Section
    html += this.generateCurrentAssetsSection(currentYear, previousYear, context.entitySize);

    // Creditors Section
    html += this.generateCreditorsSection(currentYear, previousYear, context.entitySize);

    // Net Assets Section
    html += this.generateNetAssetsSection(currentYear, previousYear);

    // Capital and Reserves Section
    html += this.generateCapitalReservesSection(currentYear, previousYear);

    html += '</tbody>\n';
    html += '</table>\n';

    // Approval statement (required by Companies Act 2006)
    html += this.generateApprovalStatement(context);

    html += '</div>\n';

    return html;
  }

  /**
   * Generate Fixed Assets section
   */
  private static generateFixedAssetsSection(
    current: BalanceSheetData,
    previous: BalanceSheetData | undefined,
    entitySize: EntitySize
  ): string {
    let html = '';

    const totalFixedAssets = (current.intangibleAssets || 0) + 
                             (current.tangibleAssets || 0) + 
                             (current.investments || 0);

    if (totalFixedAssets > 0) {
      html += '<tr><td colspan="4"><strong>Fixed Assets</strong></td></tr>\n';

      if (current.intangibleAssets) {
        html += '<tr>\n';
        html += '<td>1</td>\n';
        html += '<td>Intangible assets</td>\n';
        html += `<td class="number">${IXBRLGenerator.tagMonetary(
          current.intangibleAssets,
          'IntangibleAssets',
          'balance-sheet',
          'GBP',
          0
        )}</td>\n`;
        if (previous && previous.intangibleAssets) {
          html += `<td class="number">${IXBRLGenerator.tagMonetary(
            previous.intangibleAssets,
            'IntangibleAssets',
            'balance-sheet-previous',
            'GBP',
            0
          )}</td>\n`;
        } else if (previous) {
          html += `<td class="number">-</td>\n`;
        }
        html += '</tr>\n';
      }

      if (current.tangibleAssets) {
        html += '<tr>\n';
        html += '<td>2</td>\n';
        html += '<td>Tangible assets</td>\n';
        html += `<td class="number">${IXBRLGenerator.tagMonetary(
          current.tangibleAssets,
          'PropertyPlantEquipment',
          'balance-sheet',
          'GBP',
          0
        )}</td>\n`;
        if (previous && previous.tangibleAssets) {
          html += `<td class="number">${IXBRLGenerator.tagMonetary(
            previous.tangibleAssets,
            'PropertyPlantEquipment',
            'balance-sheet-previous',
            'GBP',
            0
          )}</td>\n`;
        } else if (previous) {
          html += `<td class="number">-</td>\n`;
        }
        html += '</tr>\n';
      }

      if (current.investments) {
        html += '<tr>\n';
        html += '<td>3</td>\n';
        html += '<td>Investments</td>\n';
        html += `<td class="number">${IXBRLGenerator.tagMonetary(
          current.investments,
          'FixedAssetInvestments',
          'balance-sheet',
          'GBP',
          0
        )}</td>\n`;
        if (previous && previous.investments) {
          html += `<td class="number">${IXBRLGenerator.tagMonetary(
            previous.investments,
            'FixedAssetInvestments',
            'balance-sheet-previous',
            'GBP',
            0
          )}</td>\n`;
        } else if (previous) {
          html += `<td class="number">-</td>\n`;
        }
        html += '</tr>\n';
      }

      // Total Fixed Assets
      const prevTotalFixed = previous ? 
        (previous.intangibleAssets || 0) + (previous.tangibleAssets || 0) + (previous.investments || 0) : 0;

      html += '<tr class="total">\n';
      html += '<td></td>\n';
      html += '<td><strong>Total Fixed Assets</strong></td>\n';
      html += `<td class="number"><strong>${IXBRLGenerator.tagMonetary(
        totalFixedAssets,
        'FixedAssets',
        'balance-sheet',
        'GBP',
        0
      )}</strong></td>\n`;
      if (previous) {
        html += `<td class="number"><strong>${IXBRLGenerator.tagMonetary(
          prevTotalFixed,
          'FixedAssets',
          'balance-sheet-previous',
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
   * Generate Current Assets section
   */
  private static generateCurrentAssetsSection(
    current: BalanceSheetData,
    previous: BalanceSheetData | undefined,
    entitySize: EntitySize
  ): string {
    let html = '<tr><td colspan="4"><strong>Current Assets</strong></td></tr>\n';

    if (current.stocks) {
      html += '<tr>\n';
      html += '<td>4</td>\n';
      html += '<td>Stocks</td>\n';
      html += `<td class="number">${IXBRLGenerator.tagMonetary(
        current.stocks,
        'Stocks',
        'balance-sheet',
        'GBP',
        0
      )}</td>\n`;
      if (previous && previous.stocks) {
        html += `<td class="number">${IXBRLGenerator.tagMonetary(
          previous.stocks,
          'Stocks',
          'balance-sheet-previous',
          'GBP',
          0
        )}</td>\n`;
      } else if (previous) {
        html += `<td class="number">-</td>\n`;
      }
      html += '</tr>\n';
    }

    if (current.debtors) {
      html += '<tr>\n';
      html += '<td>5</td>\n';
      html += '<td>Debtors</td>\n';
      html += `<td class="number">${IXBRLGenerator.tagMonetary(
        current.debtors,
        'Debtors',
        'balance-sheet',
        'GBP',
        0
      )}</td>\n`;
      if (previous && previous.debtors) {
        html += `<td class="number">${IXBRLGenerator.tagMonetary(
          previous.debtors,
          'Debtors',
          'balance-sheet-previous',
          'GBP',
          0
        )}</td>\n`;
      } else if (previous) {
        html += `<td class="number">-</td>\n`;
      }
      html += '</tr>\n';
    }

    if (current.cash) {
      html += '<tr>\n';
      html += '<td>6</td>\n';
      html += '<td>Cash at bank and in hand</td>\n';
      html += `<td class="number">${IXBRLGenerator.tagMonetary(
        current.cash,
        'CashBankInHand',
        'balance-sheet',
        'GBP',
        0
      )}</td>\n`;
      if (previous && previous.cash) {
        html += `<td class="number">${IXBRLGenerator.tagMonetary(
          previous.cash,
          'CashBankInHand',
          'balance-sheet-previous',
          'GBP',
          0
        )}</td>\n`;
      } else if (previous) {
        html += `<td class="number">-</td>\n`;
      }
      html += '</tr>\n';
    }

    const totalCurrentAssets = (current.stocks || 0) + (current.debtors || 0) + (current.cash || 0);
    const prevTotalCurrent = previous ? 
      (previous.stocks || 0) + (previous.debtors || 0) + (previous.cash || 0) : 0;

    html += '<tr class="total">\n';
    html += '<td></td>\n';
    html += '<td><strong>Total Current Assets</strong></td>\n';
    html += `<td class="number"><strong>${IXBRLGenerator.tagMonetary(
      totalCurrentAssets,
      'CurrentAssets',
      'balance-sheet',
      'GBP',
      0
    )}</strong></td>\n`;
    if (previous) {
      html += `<td class="number"><strong>${IXBRLGenerator.tagMonetary(
        prevTotalCurrent,
        'CurrentAssets',
        'balance-sheet-previous',
        'GBP',
        0
      )}</strong></td>\n`;
    }
    html += '</tr>\n';
    html += '<tr><td colspan="4">&nbsp;</td></tr>\n';

    return html;
  }

  /**
   * Generate Creditors section
   */
  private static generateCreditorsSection(
    current: BalanceSheetData,
    previous: BalanceSheetData | undefined,
    entitySize: EntitySize
  ): string {
    let html = '';

    if (current.creditorsDueWithinOneYear) {
      html += '<tr><td colspan="4"><strong>Creditors: amounts falling due within one year</strong></td></tr>\n';
      html += '<tr>\n';
      html += '<td>7</td>\n';
      html += '<td>Creditors</td>\n';
      html += `<td class="number">${IXBRLGenerator.tagMonetary(
        -current.creditorsDueWithinOneYear,
        'CreditorsDueWithinOneYear',
        'balance-sheet',
        'GBP',
        0
      )}</td>\n`;
      if (previous && previous.creditorsDueWithinOneYear) {
        html += `<td class="number">${IXBRLGenerator.tagMonetary(
          -previous.creditorsDueWithinOneYear,
          'CreditorsDueWithinOneYear',
          'balance-sheet-previous',
          'GBP',
          0
        )}</td>\n`;
      } else if (previous) {
        html += `<td class="number">-</td>\n`;
      }
      html += '</tr>\n';

      // Net Current Assets
      const totalCurrentAssets = (current.stocks || 0) + (current.debtors || 0) + (current.cash || 0);
      const netCurrentAssets = totalCurrentAssets - (current.creditorsDueWithinOneYear || 0);
      
      const prevTotalCurrent = previous ? 
        (previous.stocks || 0) + (previous.debtors || 0) + (previous.cash || 0) : 0;
      const prevNetCurrent = previous ? 
        prevTotalCurrent - (previous.creditorsDueWithinOneYear || 0) : 0;

      html += '<tr class="total">\n';
      html += '<td></td>\n';
      html += '<td><strong>Net Current Assets</strong></td>\n';
      html += `<td class="number"><strong>${IXBRLGenerator.tagMonetary(
        netCurrentAssets,
        'NetCurrentAssetsLiabilities',
        'balance-sheet',
        'GBP',
        0
      )}</strong></td>\n`;
      if (previous) {
        html += `<td class="number"><strong>${IXBRLGenerator.tagMonetary(
          prevNetCurrent,
          'NetCurrentAssetsLiabilities',
          'balance-sheet-previous',
          'GBP',
          0
        )}</strong></td>\n`;
      }
      html += '</tr>\n';
      html += '<tr><td colspan="4">&nbsp;</td></tr>\n';
    }

    if (current.creditorsDueAfterOneYear) {
      html += '<tr><td colspan="4"><strong>Creditors: amounts falling due after more than one year</strong></td></tr>\n';
      html += '<tr>\n';
      html += '<td>8</td>\n';
      html += '<td>Creditors</td>\n';
      html += `<td class="number">${IXBRLGenerator.tagMonetary(
        -current.creditorsDueAfterOneYear,
        'CreditorsDueAfterOneYear',
        'balance-sheet',
        'GBP',
        0
      )}</td>\n`;
      if (previous && previous.creditorsDueAfterOneYear) {
        html += `<td class="number">${IXBRLGenerator.tagMonetary(
          -previous.creditorsDueAfterOneYear,
          'CreditorsDueAfterOneYear',
          'balance-sheet-previous',
          'GBP',
          0
        )}</td>\n`;
      } else if (previous) {
        html += `<td class="number">-</td>\n`;
      }
      html += '</tr>\n';
      html += '<tr><td colspan="4">&nbsp;</td></tr>\n';
    }

    return html;
  }

  /**
   * Generate Net Assets section
   */
  private static generateNetAssetsSection(
    current: BalanceSheetData,
    previous: BalanceSheetData | undefined
  ): string {
    const totalAssets = (current.intangibleAssets || 0) + 
                        (current.tangibleAssets || 0) + 
                        (current.investments || 0) +
                        (current.stocks || 0) + 
                        (current.debtors || 0) + 
                        (current.cash || 0);

    const totalLiabilities = (current.creditorsDueWithinOneYear || 0) + 
                             (current.creditorsDueAfterOneYear || 0) + 
                             (current.provisions || 0);

    const netAssets = totalAssets - totalLiabilities;

    const prevTotalAssets = previous ? 
      (previous.intangibleAssets || 0) + (previous.tangibleAssets || 0) + (previous.investments || 0) +
      (previous.stocks || 0) + (previous.debtors || 0) + (previous.cash || 0) : 0;

    const prevTotalLiabilities = previous ?
      (previous.creditorsDueWithinOneYear || 0) + (previous.creditorsDueAfterOneYear || 0) + (previous.provisions || 0) : 0;

    const prevNetAssets = prevTotalAssets - prevTotalLiabilities;

    let html = '<tr class="total">\n';
    html += '<td></td>\n';
    html += '<td><strong>Net Assets</strong></td>\n';
    html += `<td class="number"><strong>${IXBRLGenerator.tagMonetary(
      netAssets,
      'NetAssetsLiabilitiesIncludingPensionAssetLiability',
      'balance-sheet',
      'GBP',
      0
    )}</strong></td>\n`;
    if (previous) {
      html += `<td class="number"><strong>${IXBRLGenerator.tagMonetary(
        prevNetAssets,
        'NetAssetsLiabilitiesIncludingPensionAssetLiability',
        'balance-sheet-previous',
        'GBP',
        0
      )}</strong></td>\n`;
    }
    html += '</tr>\n';
    html += '<tr><td colspan="4">&nbsp;</td></tr>\n';

    return html;
  }

  /**
   * Generate Capital and Reserves section
   */
  private static generateCapitalReservesSection(
    current: BalanceSheetData,
    previous: BalanceSheetData | undefined
  ): string {
    let html = '<tr><td colspan="4"><strong>Capital and Reserves</strong></td></tr>\n';

    html += '<tr>\n';
    html += '<td>9</td>\n';
    html += '<td>Called up share capital</td>\n';
    html += `<td class="number">${IXBRLGenerator.tagMonetary(
      current.calledUpShareCapital,
      'CalledUpShareCapital',
      'balance-sheet',
      'GBP',
      0
    )}</td>\n`;
    if (previous && previous.calledUpShareCapital) {
      html += `<td class="number">${IXBRLGenerator.tagMonetary(
        previous.calledUpShareCapital,
        'CalledUpShareCapital',
        'balance-sheet-previous',
        'GBP',
        0
      )}</td>\n`;
    } else if (previous) {
      html += `<td class="number">-</td>\n`;
    }
    html += '</tr>\n';

    if (current.sharePremium) {
      html += '<tr>\n';
      html += '<td></td>\n';
      html += '<td>Share premium account</td>\n';
      html += `<td class="number">${IXBRLGenerator.tagMonetary(
        current.sharePremium,
        'SharePremiumAccount',
        'balance-sheet',
        'GBP',
        0
      )}</td>\n`;
      if (previous && previous.sharePremium) {
        html += `<td class="number">${IXBRLGenerator.tagMonetary(
          previous.sharePremium,
          'SharePremiumAccount',
          'balance-sheet-previous',
          'GBP',
          0
        )}</td>\n`;
      } else if (previous) {
        html += `<td class="number">-</td>\n`;
      }
      html += '</tr>\n';
    }

    if (current.otherReserves) {
      html += '<tr>\n';
      html += '<td></td>\n';
      html += '<td>Other reserves</td>\n';
      html += `<td class="number">${IXBRLGenerator.tagMonetary(
        current.otherReserves,
        'OtherReserves',
        'balance-sheet',
        'GBP',
        0
      )}</td>\n`;
      if (previous && previous.otherReserves) {
        html += `<td class="number">${IXBRLGenerator.tagMonetary(
          previous.otherReserves,
          'OtherReserves',
          'balance-sheet-previous',
          'GBP',
          0
        )}</td>\n`;
      } else if (previous) {
        html += `<td class="number">-</td>\n`;
      }
      html += '</tr>\n';
    }

    html += '<tr>\n';
    html += '<td></td>\n';
    html += '<td>Profit and loss account</td>\n';
    html += `<td class="number">${IXBRLGenerator.tagMonetary(
      current.profitAndLossAccount,
      'RetainedEarningsAccumulatedLosses',
      'balance-sheet',
      'GBP',
      0
    )}</td>\n`;
    if (previous && previous.profitAndLossAccount !== undefined) {
      html += `<td class="number">${IXBRLGenerator.tagMonetary(
        previous.profitAndLossAccount,
        'RetainedEarningsAccumulatedLosses',
        'balance-sheet-previous',
        'GBP',
        0
      )}</td>\n`;
    } else if (previous) {
      html += `<td class="number">-</td>\n`;
    }
    html += '</tr>\n';

    const totalEquity = current.calledUpShareCapital + 
                        (current.sharePremium || 0) + 
                        (current.otherReserves || 0) + 
                        current.profitAndLossAccount;

    const prevTotalEquity = previous ? 
      (previous.calledUpShareCapital || 0) + 
      (previous.sharePremium || 0) + 
      (previous.otherReserves || 0) + 
      (previous.profitAndLossAccount || 0) : 0;

    html += '<tr class="total">\n';
    html += '<td></td>\n';
    html += '<td><strong>Total Equity</strong></td>\n';
    html += `<td class="number"><strong>${IXBRLGenerator.tagMonetary(
      totalEquity,
      'TotalEquity',
      'balance-sheet',
      'GBP',
      0
    )}</strong></td>\n`;
    if (previous) {
      html += `<td class="number"><strong>${IXBRLGenerator.tagMonetary(
        prevTotalEquity,
        'TotalEquity',
        'balance-sheet-previous',
        'GBP',
        0
      )}</strong></td>\n`;
    }
    html += '</tr>\n';

    return html;
  }

  /**
   * Generate approval statement (required by Companies Act 2006)
   */
  private static generateApprovalStatement(context: IXBRLContext): string {
    return `
<div class="approval-statement" style="margin-top: 40px;">
  <p>
    The financial statements have been prepared and delivered in accordance with the provisions
    applicable to companies subject to the small companies regime.
  </p>
  <p>
    The directors acknowledge their responsibilities for complying with the requirements of the
    Companies Act 2006 with respect to accounting records and the preparation of financial statements.
  </p>
  <p>
    These financial statements were approved by the board of directors on ${IXBRLGenerator.tagDate(
      new Date().toISOString().split('T')[0],
      'DateAuthorisationFinancialStatementsForIssue',
      'current'
    )} and were signed on its behalf by:
  </p>
  <div style="margin-top: 40px;">
    <p>_______________________</p>
    <p><strong>Director</strong></p>
  </div>
</div>`;
  }
}

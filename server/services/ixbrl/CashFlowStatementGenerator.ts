/**
 * iXBRL Cash Flow Statement Generator
 * 
 * Generates FRC 2025 compliant Cash Flow Statements using the indirect method
 * Required for medium-sized and large companies under FRS 102
 * 
 * Format: Reconciliation of profit before taxation to net cash flow from operating activities
 * Activities: Operating, Investing, Financing
 */

import { IXBRLGenerator, IXBRLContext } from './IXBRLGenerator';
import { EntitySize } from './EntitySizeDetector';

export interface CashFlowData {
  // Operating Activities - Indirect Method
  profitBeforeTax: number;
  
  // Adjustments for non-cash items
  depreciation?: number;
  amortization?: number;
  interestPayable?: number;
  interestReceivable?: number;
  gainLossOnDisposal?: number;
  
  // Working capital changes
  increaseDecreaseInStocks?: number;
  increaseDecreaseInDebtors?: number;
  increaseDecreaseInCreditors?: number;
  
  // Tax and interest paid
  taxPaid?: number;
  interestPaid?: number;
  
  // Investing Activities
  purchaseOfTangibleAssets?: number;
  purchaseOfIntangibleAssets?: number;
  purchaseOfInvestments?: number;
  proceedsFromDisposalOfAssets?: number;
  
  // Financing Activities
  proceedsFromShareIssue?: number;
  repaymentOfBorrowings?: number;
  newLoansReceived?: number;
  dividendsPaid?: number;
  
  // Opening and closing cash
  openingCash: number;
  closingCash: number;
}

export interface ComparativeCashFlow {
  currentYear: CashFlowData;
  previousYear?: CashFlowData;
}

export class CashFlowStatementGenerator {
  /**
   * Generate complete iXBRL Cash Flow Statement
   */
  static generate(
    context: IXBRLContext,
    data: ComparativeCashFlow
  ): string {
    const { currentYear, previousYear } = data;

    let html = '<div class="cash-flow-statement">\n';
    html += '<h2>Cash Flow Statement</h2>\n';
    html += '<h3>For the year ended ' + context.periodEnd + '</h3>\n\n';

    html += '<table>\n';
    html += '<thead>\n';
    html += '<tr>\n';
    html += '<th>Note</th>\n';
    html += '<th></th>\n';
    html += '<th class="number">' + new Date(context.periodEnd).getFullYear() + '<br/>£</th>\n';
    if (previousYear) {
      html += '<th class="number">' + (new Date(context.periodEnd).getFullYear() - 1) + '<br/>£</th>\n';
    }
    html += '</tr>\n';
    html += '</thead>\n';
    html += '<tbody>\n';

    // Operating Activities
    html += this.generateOperatingActivities(currentYear, previousYear);

    // Investing Activities
    html += this.generateInvestingActivities(currentYear, previousYear);

    // Financing Activities
    html += this.generateFinancingActivities(currentYear, previousYear);

    // Net increase/decrease in cash
    html += this.generateNetCashMovement(currentYear, previousYear);

    // Cash reconciliation
    html += this.generateCashReconciliation(currentYear, previousYear);

    html += '</tbody>\n';
    html += '</table>\n';
    html += '</div>\n';

    return html;
  }

  /**
   * Generate Operating Activities section (Indirect Method)
   */
  private static generateOperatingActivities(
    current: CashFlowData,
    previous: CashFlowData | undefined
  ): string {
    let html = '';

    // Section header
    html += '<tr class="section-header">\n';
    html += '<td></td>\n';
    html += '<td colspan="' + (previous ? '3' : '2') + '"><strong>Cash flows from operating activities</strong></td>\n';
    html += '</tr>\n';

    // Profit before tax
    html += '<tr>\n';
    html += '<td></td>\n';
    html += '<td>Profit before taxation</td>\n';
    html += '<td class="number">' + IXBRLGenerator.tagMonetary(
      current.profitBeforeTax,
      'ProfitLossBeforeTax',
      'current',
      'GBP',
      0
    ) + '</td>\n';
    if (previous) {
      html += '<td class="number">' + IXBRLGenerator.tagMonetary(
        previous.profitBeforeTax,
        'ProfitLossBeforeTax',
        'previous',
        'GBP',
        0
      ) + '</td>\n';
    }
    html += '</tr>\n';

    // Adjustments for non-cash items
    html += '<tr>\n';
    html += '<td></td>\n';
    html += '<td><em>Adjustments for:</em></td>\n';
    html += '<td></td>\n';
    if (previous) html += '<td></td>\n';
    html += '</tr>\n';

    if (current.depreciation !== undefined && current.depreciation !== 0) {
      html += '<tr>\n';
      html += '<td></td>\n';
      html += '<td>Depreciation of tangible assets</td>\n';
      html += '<td class="number">' + IXBRLGenerator.tagMonetary(
        current.depreciation,
        'DepreciationAmortisationImpairmentExpense',
        'current',
        'GBP',
        0
      ) + '</td>\n';
      if (previous) {
        html += '<td class="number">' + IXBRLGenerator.tagMonetary(
          previous.depreciation || 0,
          'DepreciationAmortisationImpairmentExpense',
          'previous',
          'GBP',
          0
        ) + '</td>\n';
      }
      html += '</tr>\n';
    }

    if (current.amortization !== undefined && current.amortization !== 0) {
      html += '<tr>\n';
      html += '<td></td>\n';
      html += '<td>Amortisation of intangible assets</td>\n';
      html += '<td class="number">' + IXBRLGenerator.tagMonetary(
        current.amortization,
        'AmortisationIntangibleNoncurrentAssets',
        'current',
        'GBP',
        0
      ) + '</td>\n';
      if (previous) {
        html += '<td class="number">' + IXBRLGenerator.tagMonetary(
          previous.amortization || 0,
          'AmortisationIntangibleNoncurrentAssets',
          'previous',
          'GBP',
          0
        ) + '</td>\n';
      }
      html += '</tr>\n';
    }

    if (current.interestPayable !== undefined && current.interestPayable !== 0) {
      html += '<tr>\n';
      html += '<td></td>\n';
      html += '<td>Interest payable</td>\n';
      html += '<td class="number">' + IXBRLGenerator.tagMonetary(
        current.interestPayable,
        'InterestPayableSimilarCharges',
        'current',
        'GBP',
        0
      ) + '</td>\n';
      if (previous) {
        html += '<td class="number">' + IXBRLGenerator.tagMonetary(
          previous.interestPayable || 0,
          'InterestPayableSimilarCharges',
          'previous',
          'GBP',
          0
        ) + '</td>\n';
      }
      html += '</tr>\n';
    }

    if (current.interestReceivable !== undefined && current.interestReceivable !== 0) {
      html += '<tr>\n';
      html += '<td></td>\n';
      html += '<td>Interest receivable</td>\n';
      html += '<td class="number">' + IXBRLGenerator.tagMonetary(
        -current.interestReceivable, // Negative because we're adding it back
        'InterestReceivableSimilarIncome',
        'current',
        'GBP',
        -1 // Sign indicates credit/negative
      ) + '</td>\n';
      if (previous) {
        html += '<td class="number">' + IXBRLGenerator.tagMonetary(
          -(previous.interestReceivable || 0),
          'InterestReceivableSimilarIncome',
          'previous',
          'GBP',
          -1
        ) + '</td>\n';
      }
      html += '</tr>\n';
    }

    if (current.gainLossOnDisposal !== undefined && current.gainLossOnDisposal !== 0) {
      html += '<tr>\n';
      html += '<td></td>\n';
      html += '<td>Gain/loss on disposal of fixed assets</td>\n';
      html += '<td class="number">' + IXBRLGenerator.tagMonetary(
        -current.gainLossOnDisposal, // Negative gain, positive loss
        'ProfitLossOnDisposalFixedAssets',
        'current',
        'GBP',
        current.gainLossOnDisposal >= 0 ? -1 : 1
      ) + '</td>\n';
      if (previous) {
        const prevValue = previous.gainLossOnDisposal || 0;
        html += '<td class="number">' + IXBRLGenerator.tagMonetary(
          -prevValue,
          'ProfitLossOnDisposalFixedAssets',
          'previous',
          'GBP',
          prevValue >= 0 ? -1 : 1
        ) + '</td>\n';
      }
      html += '</tr>\n';
    }

    // Working capital changes
    html += '<tr>\n';
    html += '<td></td>\n';
    html += '<td><em>Changes in working capital:</em></td>\n';
    html += '<td></td>\n';
    if (previous) html += '<td></td>\n';
    html += '</tr>\n';

    if (current.increaseDecreaseInStocks !== undefined && current.increaseDecreaseInStocks !== 0) {
      html += '<tr>\n';
      html += '<td></td>\n';
      html += '<td>(Increase)/decrease in stocks</td>\n';
      html += '<td class="number">' + IXBRLGenerator.tagMonetary(
        -current.increaseDecreaseInStocks, // Increase is negative cash flow
        'IncreaseDecreaseInventories',
        'current',
        'GBP',
        current.increaseDecreaseInStocks >= 0 ? -1 : 1
      ) + '</td>\n';
      if (previous) {
        const prevValue = previous.increaseDecreaseInStocks || 0;
        html += '<td class="number">' + IXBRLGenerator.tagMonetary(
          -prevValue,
          'IncreaseDecreaseInventories',
          'previous',
          'GBP',
          prevValue >= 0 ? -1 : 1
        ) + '</td>\n';
      }
      html += '</tr>\n';
    }

    if (current.increaseDecreaseInDebtors !== undefined && current.increaseDecreaseInDebtors !== 0) {
      html += '<tr>\n';
      html += '<td></td>\n';
      html += '<td>(Increase)/decrease in debtors</td>\n';
      html += '<td class="number">' + IXBRLGenerator.tagMonetary(
        -current.increaseDecreaseInDebtors,
        'IncreaseDecreaseTradeOtherReceivables',
        'current',
        'GBP',
        current.increaseDecreaseInDebtors >= 0 ? -1 : 1
      ) + '</td>\n';
      if (previous) {
        const prevValue = previous.increaseDecreaseInDebtors || 0;
        html += '<td class="number">' + IXBRLGenerator.tagMonetary(
          -prevValue,
          'IncreaseDecreaseTradeOtherReceivables',
          'previous',
          'GBP',
          prevValue >= 0 ? -1 : 1
        ) + '</td>\n';
      }
      html += '</tr>\n';
    }

    if (current.increaseDecreaseInCreditors !== undefined && current.increaseDecreaseInCreditors !== 0) {
      html += '<tr>\n';
      html += '<td></td>\n';
      html += '<td>Increase/(decrease) in creditors</td>\n';
      html += '<td class="number">' + IXBRLGenerator.tagMonetary(
        current.increaseDecreaseInCreditors,
        'IncreaseDecreaseTradeOtherPayables',
        'current',
        'GBP',
        current.increaseDecreaseInCreditors >= 0 ? 1 : -1
      ) + '</td>\n';
      if (previous) {
        const prevValue = previous.increaseDecreaseInCreditors || 0;
        html += '<td class="number">' + IXBRLGenerator.tagMonetary(
          prevValue,
          'IncreaseDecreaseTradeOtherPayables',
          'previous',
          'GBP',
          prevValue >= 0 ? 1 : -1
        ) + '</td>\n';
      }
      html += '</tr>\n';
    }

    // Calculate and display net cash from operations
    const netCashFromOps = this.calculateNetCashFromOperations(current);
    const prevNetCashFromOps = previous ? this.calculateNetCashFromOperations(previous) : 0;

    html += '<tr class="subtotal">\n';
    html += '<td></td>\n';
    html += '<td><strong>Cash generated from operations</strong></td>\n';
    html += '<td class="number"><strong>' + IXBRLGenerator.tagMonetary(
      netCashFromOps,
      'CashGeneratedFromOperations',
      'current',
      'GBP',
      netCashFromOps >= 0 ? 1 : -1
    ) + '</strong></td>\n';
    if (previous) {
      html += '<td class="number"><strong>' + IXBRLGenerator.tagMonetary(
        prevNetCashFromOps,
        'CashGeneratedFromOperations',
        'previous',
        'GBP',
        prevNetCashFromOps >= 0 ? 1 : -1
      ) + '</strong></td>\n';
    }
    html += '</tr>\n';

    // Interest and tax paid
    if (current.interestPaid !== undefined && current.interestPaid !== 0) {
      html += '<tr>\n';
      html += '<td></td>\n';
      html += '<td>Interest paid</td>\n';
      html += '<td class="number">' + IXBRLGenerator.tagMonetary(
        -current.interestPaid,
        'InterestPaid',
        'current',
        'GBP',
        -1
      ) + '</td>\n';
      if (previous) {
        html += '<td class="number">' + IXBRLGenerator.tagMonetary(
          -(previous.interestPaid || 0),
          'InterestPaid',
          'previous',
          'GBP',
          -1
        ) + '</td>\n';
      }
      html += '</tr>\n';
    }

    if (current.taxPaid !== undefined && current.taxPaid !== 0) {
      html += '<tr>\n';
      html += '<td></td>\n';
      html += '<td>Tax paid</td>\n';
      html += '<td class="number">' + IXBRLGenerator.tagMonetary(
        -current.taxPaid,
        'TaxationPaid',
        'current',
        'GBP',
        -1
      ) + '</td>\n';
      if (previous) {
        html += '<td class="number">' + IXBRLGenerator.tagMonetary(
          -(previous.taxPaid || 0),
          'TaxationPaid',
          'previous',
          'GBP',
          -1
        ) + '</td>\n';
      }
      html += '</tr>\n';
    }

    // Net cash from operating activities (total)
    const netOperating = netCashFromOps - (current.interestPaid || 0) - (current.taxPaid || 0);
    const prevNetOperating = prevNetCashFromOps - (previous?.interestPaid || 0) - (previous?.taxPaid || 0);

    html += '<tr class="total">\n';
    html += '<td></td>\n';
    html += '<td><strong>Net cash from operating activities</strong></td>\n';
    html += '<td class="number"><strong>' + IXBRLGenerator.tagMonetary(
      netOperating,
      'NetCashFromOperatingActivities',
      'current',
      'GBP',
      netOperating >= 0 ? 1 : -1
    ) + '</strong></td>\n';
    if (previous) {
      html += '<td class="number"><strong>' + IXBRLGenerator.tagMonetary(
        prevNetOperating,
        'NetCashFromOperatingActivities',
        'previous',
        'GBP',
        prevNetOperating >= 0 ? 1 : -1
      ) + '</strong></td>\n';
    }
    html += '</tr>\n';

    return html;
  }

  /**
   * Generate Investing Activities section
   */
  private static generateInvestingActivities(
    current: CashFlowData,
    previous: CashFlowData | undefined
  ): string {
    let html = '';

    // Section header
    html += '<tr class="section-header">\n';
    html += '<td></td>\n';
    html += '<td colspan="' + (previous ? '3' : '2') + '"><strong>Cash flows from investing activities</strong></td>\n';
    html += '</tr>\n';

    if (current.purchaseOfTangibleAssets !== undefined && current.purchaseOfTangibleAssets !== 0) {
      html += '<tr>\n';
      html += '<td></td>\n';
      html += '<td>Purchase of tangible fixed assets</td>\n';
      html += '<td class="number">' + IXBRLGenerator.tagMonetary(
        -current.purchaseOfTangibleAssets,
        'PurchasePropertyPlantEquipment',
        'current',
        'GBP',
        -1
      ) + '</td>\n';
      if (previous) {
        html += '<td class="number">' + IXBRLGenerator.tagMonetary(
          -(previous.purchaseOfTangibleAssets || 0),
          'PurchasePropertyPlantEquipment',
          'previous',
          'GBP',
          -1
        ) + '</td>\n';
      }
      html += '</tr>\n';
    }

    if (current.purchaseOfIntangibleAssets !== undefined && current.purchaseOfIntangibleAssets !== 0) {
      html += '<tr>\n';
      html += '<td></td>\n';
      html += '<td>Purchase of intangible assets</td>\n';
      html += '<td class="number">' + IXBRLGenerator.tagMonetary(
        -current.purchaseOfIntangibleAssets,
        'PurchaseIntangibleAssets',
        'current',
        'GBP',
        -1
      ) + '</td>\n';
      if (previous) {
        html += '<td class="number">' + IXBRLGenerator.tagMonetary(
          -(previous.purchaseOfIntangibleAssets || 0),
          'PurchaseIntangibleAssets',
          'previous',
          'GBP',
          -1
        ) + '</td>\n';
      }
      html += '</tr>\n';
    }

    if (current.purchaseOfInvestments !== undefined && current.purchaseOfInvestments !== 0) {
      html += '<tr>\n';
      html += '<td></td>\n';
      html += '<td>Purchase of investments</td>\n';
      html += '<td class="number">' + IXBRLGenerator.tagMonetary(
        -current.purchaseOfInvestments,
        'PurchaseFinancialAssets',
        'current',
        'GBP',
        -1
      ) + '</td>\n';
      if (previous) {
        html += '<td class="number">' + IXBRLGenerator.tagMonetary(
          -(previous.purchaseOfInvestments || 0),
          'PurchaseFinancialAssets',
          'previous',
          'GBP',
          -1
        ) + '</td>\n';
      }
      html += '</tr>\n';
    }

    if (current.proceedsFromDisposalOfAssets !== undefined && current.proceedsFromDisposalOfAssets !== 0) {
      html += '<tr>\n';
      html += '<td></td>\n';
      html += '<td>Proceeds from disposal of fixed assets</td>\n';
      html += '<td class="number">' + IXBRLGenerator.tagMonetary(
        current.proceedsFromDisposalOfAssets,
        'ProceedsFromDisposalPropertyPlantEquipment',
        'current',
        'GBP',
        1
      ) + '</td>\n';
      if (previous) {
        html += '<td class="number">' + IXBRLGenerator.tagMonetary(
          previous.proceedsFromDisposalOfAssets || 0,
          'ProceedsFromDisposalPropertyPlantEquipment',
          'previous',
          'GBP',
          1
        ) + '</td>\n';
      }
      html += '</tr>\n';
    }

    // Net cash from investing activities
    const netInvesting = (current.proceedsFromDisposalOfAssets || 0) - 
                        (current.purchaseOfTangibleAssets || 0) - 
                        (current.purchaseOfIntangibleAssets || 0) - 
                        (current.purchaseOfInvestments || 0);
    
    const prevNetInvesting = previous ? 
      (previous.proceedsFromDisposalOfAssets || 0) - 
      (previous.purchaseOfTangibleAssets || 0) - 
      (previous.purchaseOfIntangibleAssets || 0) - 
      (previous.purchaseOfInvestments || 0) : 0;

    html += '<tr class="total">\n';
    html += '<td></td>\n';
    html += '<td><strong>Net cash from investing activities</strong></td>\n';
    html += '<td class="number"><strong>' + IXBRLGenerator.tagMonetary(
      netInvesting,
      'NetCashFromInvestingActivities',
      'current',
      'GBP',
      netInvesting >= 0 ? 1 : -1
    ) + '</strong></td>\n';
    if (previous) {
      html += '<td class="number"><strong>' + IXBRLGenerator.tagMonetary(
        prevNetInvesting,
        'NetCashFromInvestingActivities',
        'previous',
        'GBP',
        prevNetInvesting >= 0 ? 1 : -1
      ) + '</strong></td>\n';
    }
    html += '</tr>\n';

    return html;
  }

  /**
   * Generate Financing Activities section
   */
  private static generateFinancingActivities(
    current: CashFlowData,
    previous: CashFlowData | undefined
  ): string {
    let html = '';

    // Section header
    html += '<tr class="section-header">\n';
    html += '<td></td>\n';
    html += '<td colspan="' + (previous ? '3' : '2') + '"><strong>Cash flows from financing activities</strong></td>\n';
    html += '</tr>\n';

    if (current.proceedsFromShareIssue !== undefined && current.proceedsFromShareIssue !== 0) {
      html += '<tr>\n';
      html += '<td></td>\n';
      html += '<td>Proceeds from issue of share capital</td>\n';
      html += '<td class="number">' + IXBRLGenerator.tagMonetary(
        current.proceedsFromShareIssue,
        'ProceedsFromIssuingShares',
        'current',
        'GBP',
        1
      ) + '</td>\n';
      if (previous) {
        html += '<td class="number">' + IXBRLGenerator.tagMonetary(
          previous.proceedsFromShareIssue || 0,
          'ProceedsFromIssuingShares',
          'previous',
          'GBP',
          1
        ) + '</td>\n';
      }
      html += '</tr>\n';
    }

    if (current.newLoansReceived !== undefined && current.newLoansReceived !== 0) {
      html += '<tr>\n';
      html += '<td></td>\n';
      html += '<td>New loans received</td>\n';
      html += '<td class="number">' + IXBRLGenerator.tagMonetary(
        current.newLoansReceived,
        'ProceedsFromBorrowings',
        'current',
        'GBP',
        1
      ) + '</td>\n';
      if (previous) {
        html += '<td class="number">' + IXBRLGenerator.tagMonetary(
          previous.newLoansReceived || 0,
          'ProceedsFromBorrowings',
          'previous',
          'GBP',
          1
        ) + '</td>\n';
      }
      html += '</tr>\n';
    }

    if (current.repaymentOfBorrowings !== undefined && current.repaymentOfBorrowings !== 0) {
      html += '<tr>\n';
      html += '<td></td>\n';
      html += '<td>Repayment of borrowings</td>\n';
      html += '<td class="number">' + IXBRLGenerator.tagMonetary(
        -current.repaymentOfBorrowings,
        'RepaymentsOfBorrowings',
        'current',
        'GBP',
        -1
      ) + '</td>\n';
      if (previous) {
        html += '<td class="number">' + IXBRLGenerator.tagMonetary(
          -(previous.repaymentOfBorrowings || 0),
          'RepaymentsOfBorrowings',
          'previous',
          'GBP',
          -1
        ) + '</td>\n';
      }
      html += '</tr>\n';
    }

    if (current.dividendsPaid !== undefined && current.dividendsPaid !== 0) {
      html += '<tr>\n';
      html += '<td></td>\n';
      html += '<td>Dividends paid</td>\n';
      html += '<td class="number">' + IXBRLGenerator.tagMonetary(
        -current.dividendsPaid,
        'DividendsPaid',
        'current',
        'GBP',
        -1
      ) + '</td>\n';
      if (previous) {
        html += '<td class="number">' + IXBRLGenerator.tagMonetary(
          -(previous.dividendsPaid || 0),
          'DividendsPaid',
          'previous',
          'GBP',
          -1
        ) + '</td>\n';
      }
      html += '</tr>\n';
    }

    // Net cash from financing activities
    const netFinancing = (current.proceedsFromShareIssue || 0) + 
                        (current.newLoansReceived || 0) - 
                        (current.repaymentOfBorrowings || 0) - 
                        (current.dividendsPaid || 0);
    
    const prevNetFinancing = previous ? 
      (previous.proceedsFromShareIssue || 0) + 
      (previous.newLoansReceived || 0) - 
      (previous.repaymentOfBorrowings || 0) - 
      (previous.dividendsPaid || 0) : 0;

    html += '<tr class="total">\n';
    html += '<td></td>\n';
    html += '<td><strong>Net cash from financing activities</strong></td>\n';
    html += '<td class="number"><strong>' + IXBRLGenerator.tagMonetary(
      netFinancing,
      'NetCashFromFinancingActivities',
      'current',
      'GBP',
      netFinancing >= 0 ? 1 : -1
    ) + '</strong></td>\n';
    if (previous) {
      html += '<td class="number"><strong>' + IXBRLGenerator.tagMonetary(
        prevNetFinancing,
        'NetCashFromFinancingActivities',
        'previous',
        'GBP',
        prevNetFinancing >= 0 ? 1 : -1
      ) + '</strong></td>\n';
    }
    html += '</tr>\n';

    return html;
  }

  /**
   * Generate Net Cash Movement section
   */
  private static generateNetCashMovement(
    current: CashFlowData,
    previous: CashFlowData | undefined
  ): string {
    let html = '';

    const netOperating = this.calculateNetOperatingCashFlow(current);
    const netInvesting = this.calculateNetInvestingCashFlow(current);
    const netFinancing = this.calculateNetFinancingCashFlow(current);
    const netMovement = netOperating + netInvesting + netFinancing;

    const prevNetOperating = previous ? this.calculateNetOperatingCashFlow(previous) : 0;
    const prevNetInvesting = previous ? this.calculateNetInvestingCashFlow(previous) : 0;
    const prevNetFinancing = previous ? this.calculateNetFinancingCashFlow(previous) : 0;
    const prevNetMovement = prevNetOperating + prevNetInvesting + prevNetFinancing;

    html += '<tr class="total-bold">\n';
    html += '<td></td>\n';
    html += '<td><strong>Net increase/(decrease) in cash and cash equivalents</strong></td>\n';
    html += '<td class="number"><strong>' + IXBRLGenerator.tagMonetary(
      netMovement,
      'IncreaseDecreaseInCashCashEquivalents',
      'current',
      'GBP',
      netMovement >= 0 ? 1 : -1
    ) + '</strong></td>\n';
    if (previous) {
      html += '<td class="number"><strong>' + IXBRLGenerator.tagMonetary(
        prevNetMovement,
        'IncreaseDecreaseInCashCashEquivalents',
        'previous',
        'GBP',
        prevNetMovement >= 0 ? 1 : -1
      ) + '</strong></td>\n';
    }
    html += '</tr>\n';

    return html;
  }

  /**
   * Generate Cash Reconciliation section
   */
  private static generateCashReconciliation(
    current: CashFlowData,
    previous: CashFlowData | undefined
  ): string {
    let html = '';

    html += '<tr>\n';
    html += '<td></td>\n';
    html += '<td>Cash and cash equivalents at beginning of year</td>\n';
    html += '<td class="number">' + IXBRLGenerator.tagMonetary(
      current.openingCash,
      'CashCashEquivalents',
      'previous',
      'GBP',
      current.openingCash >= 0 ? 1 : -1
    ) + '</td>\n';
    if (previous) {
      html += '<td class="number">' + IXBRLGenerator.tagMonetary(
        previous.openingCash,
        'CashCashEquivalents',
        'previous-previous',
        'GBP',
        previous.openingCash >= 0 ? 1 : -1
      ) + '</td>\n';
    }
    html += '</tr>\n';

    html += '<tr class="final-total">\n';
    html += '<td></td>\n';
    html += '<td><strong>Cash and cash equivalents at end of year</strong></td>\n';
    html += '<td class="number"><strong>' + IXBRLGenerator.tagMonetary(
      current.closingCash,
      'CashCashEquivalents',
      'current',
      'GBP',
      current.closingCash >= 0 ? 1 : -1
    ) + '</strong></td>\n';
    if (previous) {
      html += '<td class="number"><strong>' + IXBRLGenerator.tagMonetary(
        previous.closingCash,
        'CashCashEquivalents',
        'previous',
        'GBP',
        previous.closingCash >= 0 ? 1 : -1
      ) + '</strong></td>\n';
    }
    html += '</tr>\n';

    return html;
  }

  /**
   * Calculate net cash from operations
   */
  private static calculateNetCashFromOperations(data: CashFlowData): number {
    return data.profitBeforeTax +
           (data.depreciation || 0) +
           (data.amortization || 0) +
           (data.interestPayable || 0) -
           (data.interestReceivable || 0) -
           (data.gainLossOnDisposal || 0) -
           (data.increaseDecreaseInStocks || 0) -
           (data.increaseDecreaseInDebtors || 0) +
           (data.increaseDecreaseInCreditors || 0);
  }

  /**
   * Calculate net operating cash flow (after interest and tax)
   */
  private static calculateNetOperatingCashFlow(data: CashFlowData): number {
    return this.calculateNetCashFromOperations(data) -
           (data.interestPaid || 0) -
           (data.taxPaid || 0);
  }

  /**
   * Calculate net investing cash flow
   */
  private static calculateNetInvestingCashFlow(data: CashFlowData): number {
    return (data.proceedsFromDisposalOfAssets || 0) -
           (data.purchaseOfTangibleAssets || 0) -
           (data.purchaseOfIntangibleAssets || 0) -
           (data.purchaseOfInvestments || 0);
  }

  /**
   * Calculate net financing cash flow
   */
  private static calculateNetFinancingCashFlow(data: CashFlowData): number {
    return (data.proceedsFromShareIssue || 0) +
           (data.newLoansReceived || 0) -
           (data.repaymentOfBorrowings || 0) -
           (data.dividendsPaid || 0);
  }
}

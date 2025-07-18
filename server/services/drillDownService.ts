export interface DrillDownData {
  lineItem: string;
  totalAmount: number;
  components: DrillDownComponent[];
  calculationMethod: string;
  sourceDocuments: SourceDocument[];
  auditTrail: AuditTrailEntry[];
  reconciliation: ReconciliationData;
}

export interface DrillDownComponent {
  id: string;
  description: string;
  amount: number;
  accountCode: string;
  sourceType: 'trial_balance' | 'adjustment' | 'reclassification' | 'manual';
  documentReferences: string[];
  dateRange?: {
    from: string;
    to: string;
  };
}

export interface SourceDocument {
  id: string;
  type: 'invoice' | 'receipt' | 'bank_statement' | 'journal_entry' | 'trial_balance';
  filename: string;
  date: string;
  amount: number;
  description: string;
  extractedData?: any;
}

export interface AuditTrailEntry {
  timestamp: string;
  action: string;
  user: string;
  oldValue?: any;
  newValue?: any;
  reason?: string;
  documentIds?: string[];
}

export interface ReconciliationData {
  trialBalanceAmount: number;
  adjustments: number;
  finalAmount: number;
  variance: number;
  explanations: string[];
}

export class DrillDownService {
  
  async getBalanceSheetDrillDown(lineItem: string, companyId: number, periodEnd: string): Promise<DrillDownData> {
    switch (lineItem.toLowerCase()) {
      case 'fixed assets':
        return this.getFixedAssetsDrillDown(companyId, periodEnd);
      case 'current assets':
        return this.getCurrentAssetsDrillDown(companyId, periodEnd);
      case 'cash at bank and in hand':
        return this.getCashDrillDown(companyId, periodEnd);
      case 'creditors: amounts falling due within one year':
        return this.getCurrentLiabilitiesDrillDown(companyId, periodEnd);
      case 'called up share capital':
        return this.getShareCapitalDrillDown(companyId, periodEnd);
      case 'profit and loss account':
        return this.getRetainedEarningsDrillDown(companyId, periodEnd);
      default:
        return this.getGenericDrillDown(lineItem, companyId, periodEnd);
    }
  }

  async getProfitLossDrillDown(lineItem: string, companyId: number, periodEnd: string): Promise<DrillDownData> {
    switch (lineItem.toLowerCase()) {
      case 'turnover':
        return this.getTurnoverDrillDown(companyId, periodEnd);
      case 'cost of sales':
        return this.getCostOfSalesDrillDown(companyId, periodEnd);
      case 'administrative expenses':
        return this.getAdministrativeExpensesDrillDown(companyId, periodEnd);
      case 'interest payable':
        return this.getInterestDrillDown(companyId, periodEnd);
      default:
        return this.getGenericDrillDown(lineItem, companyId, periodEnd);
    }
  }

  private async getFixedAssetsDrillDown(companyId: number, periodEnd: string): Promise<DrillDownData> {
    // Simulate fetching from trial balance and supporting documents
    const components: DrillDownComponent[] = [
      {
        id: 'fa-tangible',
        description: 'Tangible Fixed Assets',
        amount: 45000,
        accountCode: '1100',
        sourceType: 'trial_balance',
        documentReferences: ['TB_2024_001', 'FA_REGISTER_001'],
        dateRange: { from: '2024-01-01', to: '2024-12-31' }
      },
      {
        id: 'fa-intangible',
        description: 'Intangible Fixed Assets',
        amount: 5000,
        accountCode: '1000',
        sourceType: 'trial_balance',
        documentReferences: ['TB_2024_001', 'SOFTWARE_LICENSE_001'],
        dateRange: { from: '2024-01-01', to: '2024-12-31' }
      },
      {
        id: 'fa-depreciation',
        description: 'Less: Accumulated Depreciation',
        amount: -15000,
        accountCode: '1150',
        sourceType: 'adjustment',
        documentReferences: ['DEPRECIATION_CALC_2024'],
        dateRange: { from: '2024-01-01', to: '2024-12-31' }
      }
    ];

    const sourceDocuments: SourceDocument[] = [
      {
        id: 'TB_2024_001',
        type: 'trial_balance',
        filename: 'Trial_Balance_Dec_2024.xlsx',
        date: '2024-12-31',
        amount: 50000,
        description: 'Year-end trial balance extract for fixed assets'
      },
      {
        id: 'FA_REGISTER_001',
        type: 'journal_entry',
        filename: 'Fixed_Asset_Register.pdf',
        date: '2024-12-31',
        amount: 45000,
        description: 'Detailed fixed asset register with cost and depreciation'
      }
    ];

    const auditTrail: AuditTrailEntry[] = [
      {
        timestamp: '2024-12-31T09:00:00Z',
        action: 'Initial Trial Balance Import',
        user: 'system_import',
        newValue: 50000,
        documentIds: ['TB_2024_001']
      },
      {
        timestamp: '2024-12-31T10:30:00Z',
        action: 'Depreciation Calculation Applied',
        user: 'finance_team',
        oldValue: 50000,
        newValue: 35000,
        reason: 'Annual depreciation charge calculated per company policy',
        documentIds: ['DEPRECIATION_CALC_2024']
      }
    ];

    return {
      lineItem: 'Fixed Assets',
      totalAmount: 35000,
      components,
      calculationMethod: 'Cost less accumulated depreciation (Straight-line method over useful life)',
      sourceDocuments,
      auditTrail,
      reconciliation: {
        trialBalanceAmount: 50000,
        adjustments: -15000,
        finalAmount: 35000,
        variance: 0,
        explanations: ['Depreciation calculated using straight-line method', 'Rates: Buildings 2%, Equipment 20%']
      }
    };
  }

  private async getCashDrillDown(companyId: number, periodEnd: string): Promise<DrillDownData> {
    const components: DrillDownComponent[] = [
      {
        id: 'cash-current',
        description: 'Current Account - Barclays ****1234',
        amount: 15750.45,
        accountCode: '1200',
        sourceType: 'trial_balance',
        documentReferences: ['BANK_STMT_DEC_2024', 'BANK_REC_DEC_2024']
      },
      {
        id: 'cash-savings',
        description: 'Business Savings Account - HSBC ****5678',
        amount: 25000.00,
        accountCode: '1201',
        sourceType: 'trial_balance',
        documentReferences: ['SAVINGS_STMT_DEC_2024']
      },
      {
        id: 'petty-cash',
        description: 'Petty Cash',
        amount: 150.00,
        accountCode: '1202',
        sourceType: 'trial_balance',
        documentReferences: ['PETTY_CASH_COUNT_DEC_2024']
      },
      {
        id: 'reconciliation-adj',
        description: 'Bank Reconciliation Adjustments',
        amount: -100.00,
        accountCode: '1200',
        sourceType: 'adjustment',
        documentReferences: ['BANK_REC_DEC_2024'],
        dateRange: { from: '2024-12-31', to: '2024-12-31' }
      }
    ];

    const sourceDocuments: SourceDocument[] = [
      {
        id: 'BANK_STMT_DEC_2024',
        type: 'bank_statement',
        filename: 'Barclays_Statement_Dec_2024.pdf',
        date: '2024-12-31',
        amount: 15850.45,
        description: 'Bank statement showing closing balance before reconciliation'
      },
      {
        id: 'BANK_REC_DEC_2024',
        type: 'journal_entry',
        filename: 'Bank_Reconciliation_Dec_2024.xlsx',
        date: '2024-12-31',
        amount: -100.00,
        description: 'Bank reconciliation with outstanding items'
      }
    ];

    return {
      lineItem: 'Cash at Bank and in Hand',
      totalAmount: 40800.45,
      components,
      calculationMethod: 'Bank statement balances adjusted for reconciling items (outstanding cheques, deposits in transit)',
      sourceDocuments,
      auditTrail: [
        {
          timestamp: '2024-12-31T16:00:00Z',
          action: 'Bank Statement Import',
          user: 'finance_team',
          newValue: 40900.45,
          documentIds: ['BANK_STMT_DEC_2024', 'SAVINGS_STMT_DEC_2024']
        },
        {
          timestamp: '2024-12-31T17:30:00Z',
          action: 'Bank Reconciliation Applied',
          user: 'senior_accountant',
          oldValue: 40900.45,
          newValue: 40800.45,
          reason: 'Outstanding cheque £100 identified',
          documentIds: ['BANK_REC_DEC_2024']
        }
      ],
      reconciliation: {
        trialBalanceAmount: 40900.45,
        adjustments: -100.00,
        finalAmount: 40800.45,
        variance: 0,
        explanations: [
          'Outstanding cheque #1234 for £100 dated 30/12/2024',
          'All deposits cleared by year end',
          'Petty cash count reconciled'
        ]
      }
    };
  }

  private async getTurnoverDrillDown(companyId: number, periodEnd: string): Promise<DrillDownData> {
    const components: DrillDownComponent[] = [
      {
        id: 'sales-uk',
        description: 'UK Sales',
        amount: 285000,
        accountCode: '4000',
        sourceType: 'trial_balance',
        documentReferences: ['SALES_INVOICES_2024', 'VAT_RETURNS_2024']
      },
      {
        id: 'sales-export',
        description: 'Export Sales',
        amount: 45000,
        accountCode: '4001',
        sourceType: 'trial_balance',
        documentReferences: ['EXPORT_INVOICES_2024']
      },
      {
        id: 'other-income',
        description: 'Other Operating Income',
        amount: 5000,
        accountCode: '4100',
        sourceType: 'trial_balance',
        documentReferences: ['MISC_INCOME_2024']
      },
      {
        id: 'sales-returns',
        description: 'Less: Sales Returns and Allowances',
        amount: -2500,
        accountCode: '4500',
        sourceType: 'trial_balance',
        documentReferences: ['CREDIT_NOTES_2024']
      }
    ];

    return {
      lineItem: 'Turnover',
      totalAmount: 332500,
      components,
      calculationMethod: 'Gross sales less returns and allowances, recognised on delivery (FRS 102 Section 23)',
      sourceDocuments: [
        {
          id: 'SALES_INVOICES_2024',
          type: 'invoice',
          filename: 'Sales_Invoice_Analysis_2024.xlsx',
          date: '2024-12-31',
          amount: 285000,
          description: 'Detailed analysis of all UK sales invoices raised in 2024'
        }
      ],
      auditTrail: [
        {
          timestamp: '2024-12-31T12:00:00Z',
          action: 'Revenue Recognition Applied',
          user: 'revenue_accountant',
          reason: 'FRS 102 Section 23 - Revenue from contracts with customers',
          documentIds: ['SALES_INVOICES_2024']
        }
      ],
      reconciliation: {
        trialBalanceAmount: 335000,
        adjustments: -2500,
        finalAmount: 332500,
        variance: 0,
        explanations: [
          'Revenue recognised on delivery per FRS 102',
          'All invoices matched to delivery notes',
          'Credit notes properly allocated to correct periods'
        ]
      }
    };
  }

  private async getGenericDrillDown(lineItem: string, companyId: number, periodEnd: string): Promise<DrillDownData> {
    // Fallback for any line item not specifically handled
    return {
      lineItem,
      totalAmount: 0,
      components: [],
      calculationMethod: 'Manual calculation required - specific drill-down not available',
      sourceDocuments: [],
      auditTrail: [],
      reconciliation: {
        trialBalanceAmount: 0,
        adjustments: 0,
        finalAmount: 0,
        variance: 0,
        explanations: ['Detailed drill-down analysis not implemented for this line item']
      }
    };
  }

  async getJournalEntriesForAccount(accountCode: string, companyId: number, periodEnd: string): Promise<any[]> {
    // This would typically query the database for journal entries
    return [
      {
        date: '2024-12-31',
        reference: 'JE001',
        description: 'Year-end depreciation charge',
        debit: accountCode === '6000' ? 5000 : 0,
        credit: accountCode === '1150' ? 5000 : 0,
        documentRef: 'DEPRECIATION_CALC_2024'
      }
    ];
  }

  async getTrialBalanceMovement(accountCode: string, companyId: number, fromDate: string, toDate: string): Promise<any> {
    // This would show movement analysis for the account
    return {
      openingBalance: 10000,
      debits: 15000,
      credits: 5000,
      closingBalance: 20000,
      numberOfTransactions: 45,
      largestTransaction: { amount: 2500, date: '2024-06-15', description: 'Equipment purchase' }
    };
  }
}
/**
 * HMRC CT600 Box Mapping Reference
 * Maps form fields to actual CT600 form box numbers for compliance
 * 
 * Main CT600 Boxes 1-165
 * Supplementary Pages: CT600A-J for specific scenarios
 */

export interface CT600Box {
  boxNumber: string;
  label: string;
  description: string;
  validation?: {
    min?: number;
    max?: number;
    required?: boolean;
    mustBeInteger?: boolean;
  };
  conditionalOn?: string; // Field name this box depends on
  helpText?: string;
}

// Main CT600 Form Boxes (Selection of key boxes)
export const CT600_BOXES: Record<string, CT600Box> = {
  // Company Identification (Boxes 1-10)
  box1: {
    boxNumber: "1",
    label: "Company Name",
    description: "Full legal name as registered with Companies House",
    validation: { required: true }
  },
  box2: {
    boxNumber: "2",
    label: "Company Registration Number",
    description: "8-character Companies House number",
    validation: { required: true }
  },
  box3: {
    boxNumber: "3",
    label: "Company UTR",
    description: "10-digit Unique Taxpayer Reference",
    validation: { required: true }
  },
  box30: {
    boxNumber: "30",
    label: "Period Start Date",
    description: "First day of accounting period",
    validation: { required: true }
  },
  box35: {
    boxNumber: "35",
    label: "Period End Date",
    description: "Last day of accounting period (max 12 months from start)",
    validation: { required: true }
  },

  // Trading Income (Boxes 40-65)
  box40: {
    boxNumber: "40",
    label: "Turnover",
    description: "Total trading income excluding VAT",
    validation: { required: true, min: 0 },
    helpText: "Include all revenue from trading activities. Exclude: VAT, capital receipts, non-trading income"
  },
  box41: {
    boxNumber: "41",
    label: "Cost of Sales",
    description: "Direct costs of goods/services sold",
    validation: { min: 0 },
    helpText: "Include: raw materials, direct labour, manufacturing costs. Exclude: depreciation, admin costs"
  },
  box42: {
    boxNumber: "42",
    label: "Gross Profit",
    description: "Turnover minus Cost of Sales (Box 40 - Box 41)",
    validation: { min: 0 }
  },
  box43: {
    boxNumber: "43",
    label: "Operating Expenses",
    description: "Administration and selling expenses",
    validation: { min: 0 },
    helpText: "Include all business expenses. WARNING: Some items must be added back (depreciation, entertainment)"
  },
  box44: {
    boxNumber: "44",
    label: "Trading Profit/Loss",
    description: "Gross profit minus operating expenses (Box 42 - Box 43)",
  },

  // Non-Trading Income (Boxes 50-60)
  box50: {
    boxNumber: "50",
    label: "Interest Received",
    description: "Bank interest and loan interest received",
    validation: { min: 0 },
    helpText: "Include all interest from: bank accounts, loans to third parties, government securities"
  },
  box51: {
    boxNumber: "51",
    label: "Dividends Received (UK)",
    description: "Dividends from UK companies",
    validation: { min: 0 },
    helpText: "Usually exempt from Corporation Tax but must be declared"
  },
  box52: {
    boxNumber: "52",
    label: "Property Income",
    description: "Net profit from UK property rental",
    validation: { min: 0 },
    conditionalOn: "hasPropertyIncome",
    helpText: "If >£0, you must complete form CT600C (Property Income)"
  },

  // Adjustments to Profit (Boxes 70-90)
  box70: {
    boxNumber: "70",
    label: "Depreciation Add-back",
    description: "Depreciation charged in accounts (must be added back)",
    validation: { min: 0 },
    helpText: "Depreciation is NOT tax-deductible. Add back 100% and claim capital allowances instead"
  },
  box71: {
    boxNumber: "71",
    label: "Capital Allowances",
    description: "Tax relief on capital expenditure (deduct)",
    validation: { min: 0 },
    helpText: "Annual Investment Allowance (AIA): 100% relief up to £1m. Writing Down Allowance: 18% (main pool), 6% (special rate)"
  },
  box72: {
    boxNumber: "72",
    label: "Entertainment Expenses",
    description: "Non-deductible entertainment (add back)",
    validation: { min: 0 },
    helpText: "Client entertainment: 100% disallowed. Staff entertainment: generally allowed if reasonable"
  },

  // Losses and Reliefs (Boxes 100-115)
  box100: {
    boxNumber: "100",
    label: "Losses Brought Forward",
    description: "Trading losses from previous periods",
    validation: { min: 0 },
    helpText: "Can offset against total profits. Post-April 2017 rules: max 50% of profits over £5m can be relieved"
  },
  box101: {
    boxNumber: "101",
    label: "R&D Tax Relief",
    description: "Research & Development enhanced expenditure deduction",
    validation: { min: 0 },
    helpText: "SME scheme: 186% deduction (86% enhancement). RDEC scheme: 20% above-the-line credit"
  },
  box102: {
    boxNumber: "102",
    label: "Charitable Donations",
    description: "Qualifying charitable donations (deductible)",
    validation: { min: 0 },
    helpText: "Donations to UK registered charities are fully deductible. Exclude: donations with quid-pro-quo benefits"
  },

  // Profits Chargeable to CT (Boxes 120-135)
  box120: {
    boxNumber: "120",
    label: "Profits Before Deductions",
    description: "Adjusted trading profit plus non-trading income",
    validation: { min: 0 }
  },
  box125: {
    boxNumber: "125",
    label: "Total Profits Chargeable",
    description: "Profits after all adjustments and reliefs",
    validation: { min: 0 }
  },

  // Tax Computation (Boxes 140-165)
  box140: {
    boxNumber: "140",
    label: "Number of Associated Companies",
    description: "Companies under common control (affects profit thresholds)",
    validation: { min: 0, mustBeInteger: true },
    helpText: "Include companies with >50% common ownership. Thresholds divided by (1 + number of associates)"
  },
  box145: {
    boxNumber: "145",
    label: "Corporation Tax Liability",
    description: "Tax due at applicable rate",
    validation: { min: 0 },
    helpText: "Rate: 19% (profits ≤£50k), 25% (profits ≥£250k), marginal relief 19-25% (profits £50k-£250k)"
  },
  box150: {
    boxNumber: "150",
    label: "Marginal Relief",
    description: "Relief for profits between £50k-£250k",
    validation: { min: 0 },
    helpText: "Formula: (Upper Limit - Profits) × Basic Profits ÷ Profits × Marginal Relief Fraction"
  },
  box155: {
    boxNumber: "155",
    label: "Tax Payable After Reliefs",
    description: "Final Corporation Tax due",
    validation: { min: 0 }
  },
};

// Supplementary Page Requirements
export interface SupplementaryPage {
  code: string;
  name: string;
  triggerField: string;
  triggerCondition: (value: any) => boolean;
  description: string;
  requiredFields: string[];
}

export const SUPPLEMENTARY_PAGES: SupplementaryPage[] = [
  {
    code: "CT600A",
    name: "Loans to Participators",
    triggerField: "isCloseCompany",
    triggerCondition: (val) => val === true,
    description: "Required if your company is a close company and made loans to shareholders/directors",
    requiredFields: ["loanAmount", "interestCharged", "s455TaxDue"]
  },
  {
    code: "CT600C",
    name: "Profits from UK Land and Buildings",
    triggerField: "hasPropertyIncome",
    triggerCondition: (val) => val === true,
    description: "Required if your company has property rental income",
    requiredFields: ["propertyIncome", "propertyExpenses", "propertyProfit"]
  },
  {
    code: "CT600D",
    name: "Insurance Companies",
    triggerField: "isInsuranceCompany",
    triggerCondition: (val) => val === true,
    description: "Required for insurance companies",
    requiredFields: []
  },
  {
    code: "CT600E",
    name: "Charities and Community Amateur Sports Clubs",
    triggerField: "isCharity",
    triggerCondition: (val) => val === true,
    description: "Required for charities and CASCs",
    requiredFields: []
  },
  {
    code: "CT600F",
    name: "Overseas Matters",
    triggerField: "hasOverseasIncome",
    triggerCondition: (val) => val === true,
    description: "Required if company has foreign income, assets, or operates overseas",
    requiredFields: ["overseasIncome", "overseasTaxPaid"]
  },
  {
    code: "CT600G",
    name: "Group and Consortium Relief",
    triggerField: "hasGroupRelief",
    triggerCondition: (val) => val === true,
    description: "Required if claiming group relief or consortium relief",
    requiredFields: ["reliefClaimedFrom", "reliefAmount"]
  },
  {
    code: "CT600I",
    name: "Controlled Foreign Companies",
    triggerField: "hasControlledForeignCompanies",
    triggerCondition: (val) => val === true,
    description: "Required if company controls foreign subsidiaries",
    requiredFields: ["cfcName", "cfcCountry", "cfcProfits"]
  },
  {
    code: "CT600J",
    name: "Supplementary Charge",
    triggerField: "isOilGasCompany",
    triggerCondition: (val) => val === true,
    description: "Required for oil and gas companies subject to supplementary charge",
    requiredFields: []
  },
];

// Validation Rules
export interface ValidationRule {
  field: string;
  rule: (value: any, formData: any) => boolean | string;
  message: string;
}

export const CT600_VALIDATION_RULES: ValidationRule[] = [
  {
    field: "utr",
    rule: (val) => /^\d{10}$/.test(val),
    message: "UTR must be exactly 10 digits"
  },
  {
    field: "companyNumber",
    rule: (val) => /^[A-Z0-9]{8}$/.test(val.toUpperCase()),
    message: "Company number must be 8 characters"
  },
  {
    field: "accountingPeriodEnd",
    rule: (end, data) => {
      if (!data.accountingPeriodStart || !end) return true;
      const start = new Date(data.accountingPeriodStart);
      const endDate = new Date(end);
      const diffMonths = (endDate.getFullYear() - start.getFullYear()) * 12 + (endDate.getMonth() - start.getMonth());
      return diffMonths <= 12;
    },
    message: "Accounting period cannot exceed 12 months"
  },
  {
    field: "capitalAllowances",
    rule: (val, data) => {
      // Capital allowances cannot exceed total expenditure on qualifying assets
      // This is a simplified check - proper validation would check against actual capital additions
      return true; // Placeholder - implement actual logic
    },
    message: "Capital allowances appear unusually high - please verify"
  },
  {
    field: "lossesBroughtForward",
    rule: (val, data) => {
      // Losses can only be offset against profits up to certain limits
      // Post-April 2017: max 50% of profits over £5m can be relieved
      const profits = (data.turnover || 0) - (data.costOfSales || 0) - (data.operatingExpenses || 0);
      if (profits > 5000000 && val > profits * 0.5) {
        return "Loss relief may be restricted to 50% of profits over £5m";
      }
      return true;
    },
    message: "Loss relief appears to exceed allowable limits"
  },
];

// Prior Year Comparison Flags
export interface ComparisonAlert {
  field: string;
  threshold: number; // Percentage change to trigger alert
  message: string;
}

export const PRIOR_YEAR_COMPARISON_ALERTS: ComparisonAlert[] = [
  {
    field: "turnover",
    threshold: 30,
    message: "Turnover has changed by more than 30% from prior year. HMRC may request explanation."
  },
  {
    field: "operatingExpenses",
    threshold: 40,
    message: "Operating expenses have changed significantly. Ensure all adjustments are correctly classified."
  },
  {
    field: "capitalAllowances",
    threshold: 100,
    message: "Capital allowances have changed substantially. Ensure capital additions are properly documented."
  },
];

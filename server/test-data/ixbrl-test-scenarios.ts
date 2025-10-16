/**
 * Realistic Test Scenarios for iXBRL Generation and Validation
 * Covers all entity sizes: micro, small, medium, large
 * Based on actual UK company data patterns
 */

export interface TestScenario {
  entitySize: 'micro' | 'small' | 'medium' | 'large';
  company: {
    name: string;
    registrationNumber: string;
    registeredAddress: string;
    sicCode: string;
    sicDescription: string;
  };
  financialData: {
    periodEnd: string; // YYYY-MM-DD
    periodStart: string; // YYYY-MM-DD
    turnover: number;
    costOfSales?: number;
    grossProfit?: number;
    administrativeExpenses?: number;
    operatingProfit?: number;
    interestPayable?: number;
    profitBeforeTax: number;
    tax?: number;
    profitAfterTax: number;
    tangibleFixedAssets: number;
    intangibleFixedAssets?: number;
    investments?: number;
    totalFixedAssets: number;
    stock?: number;
    debtors: number;
    cashAtBank: number;
    totalCurrentAssets: number;
    creditors: number;
    netCurrentAssets: number;
    totalAssetsLessCurrentLiabilities: number;
    longTermCreditors?: number;
    provisions?: number;
    netAssets: number;
    calledUpShareCapital: number;
    profitAndLossReserve: number;
    totalShareholdersEquity: number;
  };
  directorInfo?: {
    directors: Array<{
      name: string;
      role: string;
    }>;
    principalActivities: string;
    approvalDate: string; // YYYY-MM-DD
    signatoryDirector: string;
  };
  employees: {
    average: number;
  };
  accountingFramework: 'FRS102' | 'FRS105' | 'FRS101' | 'UKIFRS';
  auditExempt: boolean;
}

/**
 * Micro-Entity Test Scenario
 * Threshold: Turnover ≤ £1m, Assets ≤ £500k, Employees ≤ 10
 */
export const microEntityScenario: TestScenario = {
  entitySize: 'micro',
  company: {
    name: 'Micro Tech Consulting Ltd',
    registrationNumber: '12345678',
    registeredAddress: '10 High Street, London, EC1A 1BB',
    sicCode: '62020',
    sicDescription: 'Information technology consultancy activities',
  },
  financialData: {
    periodEnd: '2024-03-31',
    periodStart: '2023-04-01',
    turnover: 450000,
    costOfSales: 180000,
    grossProfit: 270000,
    administrativeExpenses: 185000,
    operatingProfit: 85000,
    interestPayable: 2000,
    profitBeforeTax: 83000,
    tax: 15770, // 19% CT rate
    profitAfterTax: 67230,
    tangibleFixedAssets: 25000,
    intangibleFixedAssets: 0,
    totalFixedAssets: 25000,
    stock: 0, // Consultancy - no stock
    debtors: 75000,
    cashAtBank: 120000,
    totalCurrentAssets: 195000,
    creditors: 45000,
    netCurrentAssets: 150000,
    totalAssetsLessCurrentLiabilities: 175000,
    longTermCreditors: 0,
    netAssets: 175000,
    calledUpShareCapital: 1,
    profitAndLossReserve: 174999,
    totalShareholdersEquity: 175000,
  },
  employees: {
    average: 6,
  },
  accountingFramework: 'FRS105', // Micro-entities regime
  auditExempt: true,
};

/**
 * Small Company Test Scenario
 * Threshold: Turnover ≤ £15m, Assets ≤ £7.5m, Employees ≤ 50
 */
export const smallCompanyScenario: TestScenario = {
  entitySize: 'small',
  company: {
    name: 'Artisan Coffee Roasters Limited',
    registrationNumber: '87654321',
    registeredAddress: '45 Market Square, Manchester, M1 1AA',
    sicCode: '10831',
    sicDescription: 'Tea and coffee processing',
  },
  financialData: {
    periodEnd: '2024-12-31',
    periodStart: '2024-01-01',
    turnover: 3250000,
    costOfSales: 1625000,
    grossProfit: 1625000,
    administrativeExpenses: 975000,
    operatingProfit: 650000,
    interestPayable: 35000,
    profitBeforeTax: 615000,
    tax: 116850, // 19% CT rate
    profitAfterTax: 498150,
    tangibleFixedAssets: 850000,
    intangibleFixedAssets: 50000,
    investments: 0,
    totalFixedAssets: 900000,
    stock: 325000,
    debtors: 425000,
    cashAtBank: 275000,
    totalCurrentAssets: 1025000,
    creditors: 385000,
    netCurrentAssets: 640000,
    totalAssetsLessCurrentLiabilities: 1540000,
    longTermCreditors: 250000,
    provisions: 0,
    netAssets: 1290000,
    calledUpShareCapital: 100,
    profitAndLossReserve: 1289900,
    totalShareholdersEquity: 1290000,
  },
  directorInfo: {
    directors: [
      { name: 'Sarah Mitchell', role: 'Managing Director' },
      { name: 'James Patterson', role: 'Finance Director' },
      { name: 'Emma Thompson', role: 'Operations Director' },
    ],
    principalActivities: 'The company specializes in sourcing, roasting, and distributing premium coffee beans to retail and wholesale customers across the UK. We operate two roasting facilities and maintain direct relationships with coffee farmers in Ethiopia, Colombia, and Brazil.',
    approvalDate: '2025-03-15',
    signatoryDirector: 'Sarah Mitchell',
  },
  employees: {
    average: 28,
  },
  accountingFramework: 'FRS102', // Section 1A available
  auditExempt: true,
};

/**
 * Medium Company Test Scenario
 * Threshold: Turnover ≤ £54m, Assets ≤ £27m, Employees ≤ 250
 */
export const mediumCompanyScenario: TestScenario = {
  entitySize: 'medium',
  company: {
    name: 'Advanced Manufacturing Solutions PLC',
    registrationNumber: '11223344',
    registeredAddress: 'Innovation Park, Birmingham, B5 7RN',
    sicCode: '28990',
    sicDescription: 'Manufacture of other special-purpose machinery',
  },
  financialData: {
    periodEnd: '2024-06-30',
    periodStart: '2023-07-01',
    turnover: 18750000,
    costOfSales: 11250000,
    grossProfit: 7500000,
    administrativeExpenses: 3750000,
    operatingProfit: 3750000,
    interestPayable: 150000,
    profitBeforeTax: 3600000,
    tax: 684000, // 19% CT rate
    profitAfterTax: 2916000,
    tangibleFixedAssets: 5250000,
    intangibleFixedAssets: 750000,
    investments: 250000,
    totalFixedAssets: 6250000,
    stock: 1875000,
    debtors: 3125000,
    cashAtBank: 1250000,
    totalCurrentAssets: 6250000,
    creditors: 2500000,
    netCurrentAssets: 3750000,
    totalAssetsLessCurrentLiabilities: 10000000,
    longTermCreditors: 1500000,
    provisions: 250000,
    netAssets: 8250000,
    calledUpShareCapital: 1000,
    profitAndLossReserve: 8249000,
    totalShareholdersEquity: 8250000,
  },
  directorInfo: {
    directors: [
      { name: 'Dr. Robert Anderson', role: 'Chief Executive Officer' },
      { name: 'Helen Williams', role: 'Chief Financial Officer' },
      { name: 'Michael Chen', role: 'Chief Operating Officer' },
      { name: 'Amanda Foster', role: 'Non-Executive Director' },
    ],
    principalActivities: 'The company designs, manufactures, and services specialized machinery for the automotive and aerospace industries. Our products include precision tooling equipment, automated assembly systems, and quality control instruments. We hold ISO 9001 and AS9100 certifications and operate manufacturing facilities in Birmingham and Glasgow.',
    approvalDate: '2024-09-20',
    signatoryDirector: 'Dr. Robert Anderson',
  },
  employees: {
    average: 142,
  },
  accountingFramework: 'FRS102', // Full standard
  auditExempt: false, // Medium companies typically audited
};

/**
 * Large Company Test Scenario
 * Threshold: Exceeds medium thresholds
 */
export const largeCompanyScenario: TestScenario = {
  entitySize: 'large',
  company: {
    name: 'National Distribution Group Limited',
    registrationNumber: '99887766',
    registeredAddress: 'Distribution Centre, Leeds, LS10 1AB',
    sicCode: '52291',
    sicDescription: 'Freight transport agency and cargo handling',
  },
  financialData: {
    periodEnd: '2024-12-31',
    periodStart: '2024-01-01',
    turnover: 125000000,
    costOfSales: 87500000,
    grossProfit: 37500000,
    administrativeExpenses: 18750000,
    operatingProfit: 18750000,
    interestPayable: 625000,
    profitBeforeTax: 18125000,
    tax: 3443750, // 19% CT rate
    profitAfterTax: 14681250,
    tangibleFixedAssets: 28750000,
    intangibleFixedAssets: 3750000,
    investments: 2500000,
    totalFixedAssets: 35000000,
    stock: 2500000,
    debtors: 15625000,
    cashAtBank: 6250000,
    totalCurrentAssets: 24375000,
    creditors: 12500000,
    netCurrentAssets: 11875000,
    totalAssetsLessCurrentLiabilities: 46875000,
    longTermCreditors: 8750000,
    provisions: 625000,
    netAssets: 37500000,
    calledUpShareCapital: 5000,
    profitAndLossReserve: 37495000,
    totalShareholdersEquity: 37500000,
  },
  directorInfo: {
    directors: [
      { name: 'David Thompson', role: 'Group Chief Executive' },
      { name: 'Catherine Davies', role: 'Group Finance Director' },
      { name: 'Mark Sullivan', role: 'Group Operations Director' },
      { name: 'Jennifer Clarke', role: 'Group HR Director' },
      { name: 'Sir Peter Harrison', role: 'Non-Executive Chairman' },
      { name: 'Prof. Linda Morgan', role: 'Independent Non-Executive Director' },
    ],
    principalActivities: 'The Group operates a nationwide network of distribution centres providing warehousing, freight forwarding, and logistics services to major retailers and manufacturers. We maintain 18 strategically located distribution hubs across the UK, operating a fleet of over 500 vehicles. Our services include same-day delivery, temperature-controlled storage, and reverse logistics. The Group employs advanced warehouse management systems and has invested significantly in sustainability initiatives, including electric vehicle deployment and solar panel installations across our facilities.',
    approvalDate: '2025-03-30',
    signatoryDirector: 'David Thompson',
  },
  employees: {
    average: 387,
  },
  accountingFramework: 'FRS102', // Full standard
  auditExempt: false, // Large companies require audit
};

/**
 * Edge Case: Small Company at Threshold Boundaries
 */
export const thresholdBoundaryScenario: TestScenario = {
  entitySize: 'small',
  company: {
    name: 'Threshold Testing Limited',
    registrationNumber: '55443322',
    registeredAddress: '99 Border Lane, Edinburgh, EH1 2NG',
    sicCode: '62012',
    sicDescription: 'Business and domestic software development',
  },
  financialData: {
    periodEnd: '2024-03-31',
    periodStart: '2023-04-01',
    turnover: 14950000, // Just under £15m threshold
    costOfSales: 7475000,
    grossProfit: 7475000,
    administrativeExpenses: 4485000,
    operatingProfit: 2990000,
    interestPayable: 75000,
    profitBeforeTax: 2915000,
    tax: 553850,
    profitAfterTax: 2361150,
    tangibleFixedAssets: 1200000,
    intangibleFixedAssets: 850000,
    totalFixedAssets: 2050000,
    stock: 0,
    debtors: 2490000,
    cashAtBank: 1850000,
    totalCurrentAssets: 4340000,
    creditors: 1240000,
    netCurrentAssets: 3100000,
    totalAssetsLessCurrentLiabilities: 5150000,
    longTermCreditors: 0,
    netAssets: 5150000,
    calledUpShareCapital: 50,
    profitAndLossReserve: 5149950,
    totalShareholdersEquity: 5150000,
  },
  directorInfo: {
    directors: [
      { name: 'Thomas Wright', role: 'Director' },
      { name: 'Rachel Green', role: 'Director' },
    ],
    principalActivities: 'The company develops bespoke software solutions for financial services clients, including risk management systems, trading platforms, and regulatory compliance tools.',
    approvalDate: '2024-06-20',
    signatoryDirector: 'Thomas Wright',
  },
  employees: {
    average: 49, // Just under 50 threshold
  },
  accountingFramework: 'FRS102',
  auditExempt: true,
};

/**
 * All test scenarios
 */
export const allTestScenarios: TestScenario[] = [
  microEntityScenario,
  smallCompanyScenario,
  mediumCompanyScenario,
  largeCompanyScenario,
  thresholdBoundaryScenario,
];

/**
 * Get test scenario by entity size
 */
export function getTestScenarioBySize(size: 'micro' | 'small' | 'medium' | 'large'): TestScenario {
  return allTestScenarios.find(s => s.entitySize === size) || microEntityScenario;
}

/**
 * Validation helper: Verify entity size classification is correct
 */
export function verifyEntitySizeClassification(scenario: TestScenario): boolean {
  const { turnover, totalFixedAssets, totalCurrentAssets } = scenario.financialData;
  const { average: employees } = scenario.employees;
  
  const balanceSheetTotal = totalFixedAssets + totalCurrentAssets;
  
  // Count how many criteria are met for each threshold
  const microCriteria = [
    turnover <= 1000000,
    balanceSheetTotal <= 500000,
    employees <= 10
  ].filter(Boolean).length;
  
  const smallCriteria = [
    turnover <= 15000000,
    balanceSheetTotal <= 7500000,
    employees <= 50
  ].filter(Boolean).length;
  
  const mediumCriteria = [
    turnover <= 54000000,
    balanceSheetTotal <= 27000000,
    employees <= 250
  ].filter(Boolean).length;
  
  // Determine expected size (2 out of 3 criteria)
  let expectedSize: string;
  if (microCriteria >= 2) {
    expectedSize = 'micro';
  } else if (smallCriteria >= 2) {
    expectedSize = 'small';
  } else if (mediumCriteria >= 2) {
    expectedSize = 'medium';
  } else {
    expectedSize = 'large';
  }
  
  return expectedSize === scenario.entitySize;
}

import { IXBRLGenerator } from './IXBRLGenerator';
import { EntitySize } from './EntitySizeDetector';

export interface AccountingPoliciesData {
  companyName: string;
  companyNumber: string;
  periodEnd: string;
  accountingFramework: 'FRS 105' | 'FRS 102' | 'UK IFRS';
  goingConcern: boolean;
  goingConcernUncertainties?: string;
  turnoverRecognitionPolicy: string;
  tangibleFixedAssetsDepreciationPolicy: string;
  stocksValuationPolicy?: string;
  taxationPolicy: string;
  pensionCosts?: string;
  foreignCurrency?: string;
  leases?: string;
  governmentGrants?: string;
  researchAndDevelopment?: string;
}

export interface NotesToAccountsData {
  // Note 1: Accounting Policies (uses AccountingPoliciesData)
  accountingPolicies: AccountingPoliciesData;

  // Note 2: Employees (if applicable)
  employeeNumbers?: {
    average: number;
    administration?: number;
    production?: number;
    distribution?: number;
  };
  employeeCosts?: {
    wages: number;
    socialSecurity: number;
    pension: number;
  };

  // Note 3: Directors' Remuneration (if required)
  directorsRemuneration?: {
    total: number;
    highestPaid?: number;
  };

  // Note 4: Tangible Fixed Assets
  tangibleFixedAssets?: {
    landBuildings?: number;
    plantMachinery?: number;
    fixturesFittings?: number;
    motorVehicles?: number;
  };

  // Note 5: Debtors
  debtorsBreakdown?: {
    tradeDebtors: number;
    otherDebtors?: number;
    prepayments?: number;
  };

  // Note 6: Creditors
  creditorsBreakdown?: {
    tradeCreditorsWithinOneYear: number;
    taxationSocialSecurity?: number;
    otherCreditors?: number;
    accruals?: number;
  };

  // Note 7: Share Capital
  shareCapital?: {
    authorised: {
      numShares: number;
      nominalValue: number;
      shareClass: string;
    };
    issued: {
      numShares: number;
      nominalValue: number;
      shareClass: string;
    };
  };

  // Note 8: Related Party Transactions
  relatedPartyTransactions?: Array<{
    party: string;
    nature: string;
    amount: number;
  }>;

  // Note 9: Post Balance Sheet Events
  postBalanceSheetEvents?: string;

  // Note 10: Ultimate Controlling Party
  ultimateControllingParty?: string;
}

export class AccountingPoliciesGenerator {
  /**
   * Generate Accounting Policies note with iXBRL tagging
   */
  static generate(data: AccountingPoliciesData, entitySize: EntitySize): string {
    let html = '<div class="accounting-policies">\n';
    html += '<h3>Note 1: Accounting Policies</h3>\n';
    html += '<br/>\n';

    // Basis of Preparation
    html += this.generateBasisOfPreparation(data, entitySize);

    // Going Concern
    html += this.generateGoingConcern(data);

    // Turnover Recognition
    html += this.generateTurnoverRecognitionPolicy(data);

    // Tangible Fixed Assets
    html += this.generateTangibleFixedAssetsPolicy(data);

    // Stocks (if applicable)
    if (data.stocksValuationPolicy) {
      html += this.generateStocksPolicy(data);
    }

    // Taxation
    html += this.generateTaxationPolicy(data);

    // Pension Costs (if applicable)
    if (data.pensionCosts) {
      html += this.generatePensionCostsPolicy(data);
    }

    // Foreign Currency (if applicable)
    if (data.foreignCurrency) {
      html += this.generateForeignCurrencyPolicy(data);
    }

    html += '</div>\n';

    return html;
  }

  /**
   * Generate Basis of Preparation section
   */
  private static generateBasisOfPreparation(data: AccountingPoliciesData, entitySize: EntitySize): string {
    let html = '<h4>Basis of Preparation</h4>\n';
    html += '<p>';
    html += IXBRLGenerator.tagText(
      `These financial statements have been prepared in accordance with ${data.accountingFramework} ` +
      `"The Financial Reporting Standard applicable in the UK and Republic of Ireland" ` +
      `and the Companies Act 2006.`,
      'DescriptionBasisPreparationFinancialStatements',
      'current'
    );
    html += '</p>\n';

    if (entitySize === 'micro') {
      html += '<p>The company has taken advantage of the provisions applicable to micro-entities.</p>\n';
    } else if (entitySize === 'small') {
      html += '<p>The company has taken advantage of the provisions available to small companies.</p>\n';
    }

    html += '<p>The financial statements are prepared under the historical cost convention.</p>\n';
    html += '<br/>\n';

    return html;
  }

  /**
   * Generate Going Concern section
   */
  private static generateGoingConcern(data: AccountingPoliciesData): string {
    let html = '<h4>Going Concern</h4>\n';

    if (data.goingConcern) {
      html += '<p>';
      html += IXBRLGenerator.tagText(
        'The directors have prepared the financial statements on a going concern basis as they have a ' +
        'reasonable expectation that the company has adequate resources to continue in operational existence ' +
        'for the foreseeable future.',
        'DescriptionAccountingPolicyGoingConcern',
        'current'
      );
      html += '</p>\n';

      if (data.goingConcernUncertainties) {
        html += `<p>${data.goingConcernUncertainties}</p>\n`;
      }
    } else {
      html += '<p>The directors do not consider the going concern basis to be appropriate. ';
      html += 'The financial statements have been prepared on a break-up basis.</p>\n';
    }

    html += '<br/>\n';

    return html;
  }

  /**
   * Generate Turnover Recognition Policy
   */
  private static generateTurnoverRecognitionPolicy(data: AccountingPoliciesData): string {
    let html = '<h4>Turnover</h4>\n';
    html += `<p>${IXBRLGenerator.tagText(
      data.turnoverRecognitionPolicy,
      'DescriptionAccountingPolicyTurnover',
      'current'
    )}</p>\n`;
    html += '<br/>\n';

    return html;
  }

  /**
   * Generate Tangible Fixed Assets Policy
   */
  private static generateTangibleFixedAssetsPolicy(data: AccountingPoliciesData): string {
    let html = '<h4>Tangible Fixed Assets</h4>\n';
    html += `<p>${IXBRLGenerator.tagText(
      data.tangibleFixedAssetsDepreciationPolicy,
      'DescriptionAccountingPolicyPropertyPlantEquipment',
      'current'
    )}</p>\n`;
    html += '<br/>\n';

    return html;
  }

  /**
   * Generate Stocks Policy
   */
  private static generateStocksPolicy(data: AccountingPoliciesData): string {
    let html = '<h4>Stocks</h4>\n';
    html += `<p>${IXBRLGenerator.tagText(
      data.stocksValuationPolicy!,
      'DescriptionAccountingPolicyInventories',
      'current'
    )}</p>\n`;
    html += '<br/>\n';

    return html;
  }

  /**
   * Generate Taxation Policy
   */
  private static generateTaxationPolicy(data: AccountingPoliciesData): string {
    let html = '<h4>Taxation</h4>\n';
    html += `<p>${IXBRLGenerator.tagText(
      data.taxationPolicy,
      'DescriptionAccountingPolicyIncomeTax',
      'current'
    )}</p>\n`;
    html += '<br/>\n';

    return html;
  }

  /**
   * Generate Pension Costs Policy
   */
  private static generatePensionCostsPolicy(data: AccountingPoliciesData): string {
    let html = '<h4>Pension Costs</h4>\n';
    html += `<p>${IXBRLGenerator.tagText(
      data.pensionCosts!,
      'DescriptionAccountingPolicyEmployeeBenefits',
      'current'
    )}</p>\n';
    html += '<br/>\n';

    return html;
  }

  /**
   * Generate Foreign Currency Policy
   */
  private static generateForeignCurrencyPolicy(data: AccountingPoliciesData): string {
    let html = '<h4>Foreign Currency Translation</h4>\n';
    html += `<p>${IXBRLGenerator.tagText(
      data.foreignCurrency!,
      'DescriptionAccountingPolicyForeignCurrency',
      'current'
    )}</p>\n`;
    html += '<br/>\n';

    return html;
  }
}

export class NotesToAccountsGenerator {
  /**
   * Generate all Notes to the Accounts with iXBRL tagging
   */
  static generate(data: NotesToAccountsData, entitySize: EntitySize): string {
    let html = '<div class="notes-to-accounts">\n';
    html += '<h2>Notes to the Financial Statements</h2>\n';
    html += `<p>For the year ended ${data.accountingPolicies.periodEnd}</p>\n`;
    html += '<br/>\n';

    // Note 1: Accounting Policies
    html += AccountingPoliciesGenerator.generate(data.accountingPolicies, entitySize);

    // Note 2: Employees
    if (data.employeeNumbers || data.employeeCosts) {
      html += this.generateEmployeesNote(data);
    }

    // Note 3: Directors' Remuneration
    if (data.directorsRemuneration && entitySize !== 'micro') {
      html += this.generateDirectorsRemunerationNote(data);
    }

    // Additional notes based on what's provided...
    if (data.debtorsBreakdown) {
      html += this.generateDebtorsNote(data);
    }

    if (data.creditorsBreakdown) {
      html += this.generateCreditorsNote(data);
    }

    if (data.shareCapital) {
      html += this.generateShareCapitalNote(data);
    }

    if (data.ultimateControllingParty) {
      html += this.generateUltimateControllingPartyNote(data);
    }

    html += '</div>\n';

    return html;
  }

  /**
   * Generate Employees Note
   */
  private static generateEmployeesNote(data: NotesToAccountsData): string {
    let html = '<h3>Note 2: Employees</h3>\n';

    if (data.employeeNumbers) {
      html += '<p>The average number of employees during the year was:</p>\n';
      html += '<table class="notes-table">\n';
      html += '<tr><td>Total employees</td><td class="number">';
      html += IXBRLGenerator.tagNonFraction(data.employeeNumbers.average, 'AverageNumberEmployeesDuringPeriod', 'current', 'pure', 0);
      html += '</td></tr>\n';
      html += '</table>\n';
      html += '<br/>\n';
    }

    if (data.employeeCosts) {
      html += '<p>Staff costs for the above persons:</p>\n';
      html += '<table class="notes-table">\n';
      html += '<tr><td>Wages and salaries</td><td class="number">';
      html += IXBRLGenerator.tagMonetary(data.employeeCosts.wages, 'WagesSalaries', 'current', 'GBP', 0);
      html += '</td></tr>\n';
      html += '<tr><td>Social security costs</td><td class="number">';
      html += IXBRLGenerator.tagMonetary(data.employeeCosts.socialSecurity, 'SocialSecurityCosts', 'current', 'GBP', 0);
      html += '</td></tr>\n';
      html += '<tr><td>Pension costs</td><td class="number">';
      html += IXBRLGenerator.tagMonetary(data.employeeCosts.pension, 'PensionCosts', 'current', 'GBP', 0);
      html += '</td></tr>\n';
      html += '</table>\n';
    }

    html += '<br/>\n';
    return html;
  }

  /**
   * Generate Directors' Remuneration Note
   */
  private static generateDirectorsRemunerationNote(data: NotesToAccountsData): string {
    let html = '<h3>Note 3: Directors\' Remuneration</h3>\n';
    html += '<table class="notes-table">\n';
    html += '<tr><td>Directors\' aggregate remuneration</td><td class="number">';
    html += IXBRLGenerator.tagMonetary(data.directorsRemuneration!.total, 'DirectorsRemuneration', 'current', 'GBP', 0);
    html += '</td></tr>\n';

    if (data.directorsRemuneration!.highestPaid) {
      html += '<tr><td>Highest paid director</td><td class="number">';
      html += IXBRLGenerator.tagMonetary(data.directorsRemuneration!.highestPaid, 'RemunerationHighestPaidDirector', 'current', 'GBP', 0);
      html += '</td></tr>\n';
    }

    html += '</table>\n';
    html += '<br/>\n';

    return html;
  }

  /**
   * Generate Debtors Note
   */
  private static generateDebtorsNote(data: NotesToAccountsData): string {
    let html = '<h3>Note: Debtors</h3>\n';
    html += '<table class="notes-table">\n';
    html += '<tr><td>Trade debtors</td><td class="number">';
    html += IXBRLGenerator.tagMonetary(data.debtorsBreakdown!.tradeDebtors, 'TradeDebtors', 'balance-sheet', 'GBP', 0);
    html += '</td></tr>\n';

    if (data.debtorsBreakdown!.otherDebtors) {
      html += '<tr><td>Other debtors</td><td class="number">';
      html += IXBRLGenerator.tagMonetary(data.debtorsBreakdown!.otherDebtors, 'OtherDebtors', 'balance-sheet', 'GBP', 0);
      html += '</td></tr>\n';
    }

    if (data.debtorsBreakdown!.prepayments) {
      html += '<tr><td>Prepayments</td><td class="number">';
      html += IXBRLGenerator.tagMonetary(data.debtorsBreakdown!.prepayments, 'PrepaymentsAccruedIncomeCurrentFinancialAsset', 'balance-sheet', 'GBP', 0);
      html += '</td></tr>\n';
    }

    html += '</table>\n';
    html += '<br/>\n';

    return html;
  }

  /**
   * Generate Creditors Note
   */
  private static generateCreditorsNote(data: NotesToAccountsData): string {
    let html = '<h3>Note: Creditors: amounts falling due within one year</h3>\n';
    html += '<table class="notes-table">\n';
    html += '<tr><td>Trade creditors</td><td class="number">';
    html += IXBRLGenerator.tagMonetary(data.creditorsBreakdown!.tradeCreditorsWithinOneYear, 'TradeCreditorsWithinOneYear', 'balance-sheet', 'GBP', 0);
    html += '</td></tr>\n';

    if (data.creditorsBreakdown!.taxationSocialSecurity) {
      html += '<tr><td>Taxation and social security</td><td class="number">';
      html += IXBRLGenerator.tagMonetary(data.creditorsBreakdown!.taxationSocialSecurity, 'TaxationSocialSecurityWithinOneYear', 'balance-sheet', 'GBP', 0);
      html += '</td></tr>\n';
    }

    if (data.creditorsBreakdown!.accruals) {
      html += '<tr><td>Accruals and deferred income</td><td class="number">';
      html += IXBRLGenerator.tagMonetary(data.creditorsBreakdown!.accruals, 'AccrualsDeferredIncomeWithinOneYear', 'balance-sheet', 'GBP', 0);
      html += '</td></tr>\n';
    }

    html += '</table>\n';
    html += '<br/>\n';

    return html;
  }

  /**
   * Generate Share Capital Note
   */
  private static generateShareCapitalNote(data: NotesToAccountsData): string {
    let html = '<h3>Note: Share Capital</h3>\n';
    html += '<table class="notes-table">\n';
    html += '<thead>\n';
    html += '<tr><th>Share Class</th><th>Number</th><th>Nominal Value</th></tr>\n';
    html += '</thead>\n';
    html += '<tbody>\n';

    html += '<tr><td colspan="3"><strong>Authorised</strong></td></tr>\n';
    html += `<tr><td>${data.shareCapital!.authorised.shareClass}</td><td class="number">`;
    html += IXBRLGenerator.tagNonFraction(data.shareCapital!.authorised.numShares, 'NumberOrdinarySharesAuthorised', 'balance-sheet', 'pure', 0);
    html += `</td><td class="number">`;
    html += IXBRLGenerator.tagMonetary(data.shareCapital!.authorised.nominalValue, 'AuthorisedShareCapital', 'balance-sheet', 'GBP', 2);
    html += '</td></tr>\n';

    html += '<tr><td colspan="3"><strong>Issued and Fully Paid</strong></td></tr>\n';
    html += `<tr><td>${data.shareCapital!.issued.shareClass}</td><td class="number">`;
    html += IXBRLGenerator.tagNonFraction(data.shareCapital!.issued.numShares, 'NumberOrdinarySharesIssued', 'balance-sheet', 'pure', 0);
    html += `</td><td class="number">`;
    html += IXBRLGenerator.tagMonetary(data.shareCapital!.issued.nominalValue, 'CalledUpShareCapital', 'balance-sheet', 'GBP', 2);
    html += '</td></tr>\n';

    html += '</tbody>\n';
    html += '</table>\n';
    html += '<br/>\n';

    return html;
  }

  /**
   * Generate Ultimate Controlling Party Note
   */
  private static generateUltimateControllingPartyNote(data: NotesToAccountsData): string {
    let html = '<h3>Note: Ultimate Controlling Party</h3>\n';
    html += `<p>${IXBRLGenerator.tagText(
      data.ultimateControllingParty!,
      'NameUltimateParentUndertaking',
      'current'
    )}</p>\n`;
    html += '<br/>\n';

    return html;
  }
}

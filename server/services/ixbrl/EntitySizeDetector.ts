/**
 * Entity Size Detector
 * 
 * Determines entity size classification based on Companies Act 2006 thresholds
 * for micro-entity, small, medium, and large companies
 * 
 * Thresholds (UK Companies Act 2006):
 * - Micro-entity: Turnover ≤ £632k, Balance sheet ≤ £316k, Employees ≤ 10
 * - Small: Turnover ≤ £10.2m, Balance sheet ≤ £5.1m, Employees ≤ 50
 * - Medium: Turnover ≤ £36m, Balance sheet ≤ £18m, Employees ≤ 250
 * - Large: Exceeds medium thresholds
 * 
 * A company qualifies for a size category if it meets 2 out of 3 criteria for 2 consecutive years
 */

export interface EntityMetrics {
  turnover: number; // Annual turnover in GBP
  balanceSheet: number; // Total assets in GBP
  employees: number; // Average number of employees
}

export type EntitySize = 'micro' | 'small' | 'medium' | 'large';

export interface EntitySizeResult {
  size: EntitySize;
  qualifiesAs: EntitySize[];
  criteria: {
    turnover: boolean;
    balanceSheet: boolean;
    employees: boolean;
  };
  requiresAudit: boolean;
  canUseAbbrreviated: boolean;
  canUseMicroEntity: boolean;
}

export class EntitySizeDetector {
  // UK Companies Act 2006 thresholds
  private static readonly THRESHOLDS = {
    micro: {
      turnover: 632_000,
      balanceSheet: 316_000,
      employees: 10,
    },
    small: {
      turnover: 10_200_000,
      balanceSheet: 5_100_000,
      employees: 50,
    },
    medium: {
      turnover: 36_000_000,
      balanceSheet: 18_000_000,
      employees: 250,
    },
  };

  /**
   * Detect entity size based on current year metrics
   * Company qualifies if it meets 2 out of 3 criteria
   */
  static detectSize(metrics: EntityMetrics): EntitySizeResult {
    const microCriteria = this.evaluateCriteria(metrics, 'micro');
    const smallCriteria = this.evaluateCriteria(metrics, 'small');
    const mediumCriteria = this.evaluateCriteria(metrics, 'medium');

    const qualifiesAs: EntitySize[] = [];

    if (this.meetsThreshold(microCriteria)) {
      qualifiesAs.push('micro');
    }
    if (this.meetsThreshold(smallCriteria)) {
      qualifiesAs.push('small');
    }
    if (this.meetsThreshold(mediumCriteria)) {
      qualifiesAs.push('medium');
    }

    const size: EntitySize = qualifiesAs.length > 0 ? qualifiesAs[0] : 'large';

    return {
      size,
      qualifiesAs,
      criteria: size === 'micro' ? microCriteria : 
                size === 'small' ? smallCriteria : 
                size === 'medium' ? mediumCriteria : 
                { turnover: false, balanceSheet: false, employees: false },
      requiresAudit: this.requiresAudit(size, metrics),
      canUseAbbrreviated: size === 'small' || size === 'micro',
      canUseMicroEntity: size === 'micro',
    };
  }

  /**
   * Detect size across two consecutive years
   * Company must qualify for 2 consecutive years to use that classification
   */
  static detectSizeAcrossTwoYears(
    currentYear: EntityMetrics,
    previousYear: EntityMetrics
  ): EntitySizeResult {
    const currentResult = this.detectSize(currentYear);
    const previousResult = this.detectSize(previousYear);

    const currentQualifies = new Set(currentResult.qualifiesAs);
    const previousQualifies = new Set(previousResult.qualifiesAs);

    const consecutiveQualifies: EntitySize[] = [];
    for (const size of currentResult.qualifiesAs) {
      if (previousQualifies.has(size)) {
        consecutiveQualifies.push(size);
      }
    }

    const size: EntitySize = consecutiveQualifies.length > 0 ? consecutiveQualifies[0] : 'large';

    return {
      size,
      qualifiesAs: consecutiveQualifies,
      criteria: currentResult.criteria,
      requiresAudit: this.requiresAudit(size, currentYear),
      canUseAbbrreviated: size === 'small' || size === 'micro',
      canUseMicroEntity: size === 'micro',
    };
  }

  /**
   * Evaluate if metrics meet criteria for a given size category
   */
  private static evaluateCriteria(
    metrics: EntityMetrics,
    category: 'micro' | 'small' | 'medium'
  ): { turnover: boolean; balanceSheet: boolean; employees: boolean } {
    const thresholds = this.THRESHOLDS[category];

    return {
      turnover: metrics.turnover <= thresholds.turnover,
      balanceSheet: metrics.balanceSheet <= thresholds.balanceSheet,
      employees: metrics.employees <= thresholds.employees,
    };
  }

  /**
   * Check if criteria meets 2 out of 3 rule
   */
  private static meetsThreshold(criteria: {
    turnover: boolean;
    balanceSheet: boolean;
    employees: boolean;
  }): boolean {
    const count = [criteria.turnover, criteria.balanceSheet, criteria.employees].filter(
      (c) => c
    ).length;
    return count >= 2;
  }

  /**
   * Determine if company requires audit based on size
   * Small companies (including micro) are generally exempt from audit unless:
   * - They are public companies
   * - They are part of an ineligible group
   * - Shareholders require it
   */
  private static requiresAudit(size: EntitySize, metrics: EntityMetrics): boolean {
    // Simplified logic - in practice, there are more factors
    // Medium and large companies generally require audit
    if (size === 'medium' || size === 'large') {
      return true;
    }

    // Small and micro companies are generally exempt
    // unless specific conditions apply
    return false;
  }

  /**
   * Get filing format recommendations based on entity size
   */
  static getFilingRecommendations(sizeResult: EntitySizeResult): {
    recommendedFormat: string;
    availableFormats: string[];
    disclosureRequirements: string[];
  } {
    const formats: { [key in EntitySize]: string[] } = {
      micro: ['Micro-entity accounts (FRS 105 or UKSEF)', 'Abridged accounts'],
      small: ['Small company accounts (FRS 102 Section 1A)', 'Abridged accounts', 'Full accounts'],
      medium: ['Full accounts (FRS 102)', 'Full accounts (UK IFRS)'],
      large: ['Full accounts (FRS 102)', 'Full accounts (UK IFRS)', 'Full accounts (IFRS)'],
    };

    const disclosures: { [key in EntitySize]: string[] } = {
      micro: ['Basic balance sheet', 'Notes to accounts (minimal)', 'No P&L required for public filing'],
      small: ['Balance sheet', 'P&L account', 'Notes to accounts', 'Directors\' report'],
      medium: ['Balance sheet', 'P&L account', 'Cash flow statement', 'Notes to accounts', 'Directors\' report', 'Strategic report'],
      large: ['Balance sheet', 'P&L account', 'Cash flow statement', 'Notes to accounts', 'Directors\' report', 'Strategic report', 'Corporate governance statement'],
    };

    return {
      recommendedFormat: formats[sizeResult.size][0],
      availableFormats: formats[sizeResult.size],
      disclosureRequirements: disclosures[sizeResult.size],
    };
  }

  /**
   * Get applicable accounting framework based on entity size
   */
  static getApplicableFramework(size: EntitySize): {
    primaryFramework: string;
    alternativeFrameworks: string[];
    taxonomyEntryPoint: string;
  } {
    const frameworks: { [key in EntitySize]: { primary: string; alternatives: string[]; taxonomy: string } } = {
      micro: {
        primary: 'FRS 105 - The Financial Reporting Standard applicable to the Micro-entities Regime',
        alternatives: ['UKSEF - UK Small Entities Framework'],
        taxonomy: 'uk-gaap-frs-105-2025-01-01',
      },
      small: {
        primary: 'FRS 102 Section 1A - Small Entities',
        alternatives: ['FRS 102 - Full Framework', 'FRS 101 - Reduced Disclosure Framework'],
        taxonomy: 'uk-gaap-frs-102-2025-01-01',
      },
      medium: {
        primary: 'FRS 102 - The Financial Reporting Standard applicable in the UK and Republic of Ireland',
        alternatives: ['UK IFRS', 'FRS 101 - Reduced Disclosure Framework'],
        taxonomy: 'uk-gaap-frs-102-2025-01-01',
      },
      large: {
        primary: 'UK IFRS - International Financial Reporting Standards',
        alternatives: ['FRS 102', 'IFRS (full)'],
        taxonomy: 'uk-ifrs-2025-01-01',
      },
    };

    const framework = frameworks[size];

    return {
      primaryFramework: framework.primary,
      alternativeFrameworks: framework.alternatives,
      taxonomyEntryPoint: framework.taxonomy,
    };
  }
}

/**
 * Single source of truth for filing credit costs
 * All pages should import from this file to ensure consistency
 * 
 * Tiered pricing based on filing complexity:
 * - Annual Accounts: Based on entity size (micro/small/medium/large)
 * - Corporation Tax: Based on complexity and supplementary pages
 * - Confirmation Statement: Flat rate (minimal variation)
 */

// Base filing costs
export const FILING_COSTS = {
  CONFIRMATION_STATEMENT: 100,
  ANNUAL_ACCOUNTS: 200, // Small company default
  CORPORATION_TAX: 150, // Simple CT600 default
} as const;

// Tiered Annual Accounts pricing based on entity size
export const ANNUAL_ACCOUNTS_TIERS = {
  micro: 150,   // Simplified accounts, no Cash Flow, minimal disclosures
  small: 200,   // Standard accounts, no Cash Flow required
  medium: 300,  // Full accounts + Cash Flow Statement required
  large: 400,   // Full accounts + Cash Flow + Strategic Report required
} as const;

// Tiered Corporation Tax pricing based on complexity
export const CT600_TIERS = {
  simple: 150,        // Basic trading company, no supplementary pages
  standard: 200,      // Standard company with some supplementary pages
  complex: 300,       // Complex company with multiple supplementary pages (CT600A/B/C/D)
  group: 400,         // Group companies with consolidated returns
} as const;

export type FilingType = keyof typeof FILING_COSTS;
export type EntitySize = keyof typeof ANNUAL_ACCOUNTS_TIERS;
export type CT600Complexity = keyof typeof CT600_TIERS;

/**
 * Get credit cost for Annual Accounts based on entity size
 */
export function getAnnualAccountsCost(entitySize: EntitySize): number {
  return ANNUAL_ACCOUNTS_TIERS[entitySize];
}

/**
 * Get credit cost for CT600 based on complexity
 */
export function getCT600Cost(complexity: CT600Complexity): number {
  return CT600_TIERS[complexity];
}

/**
 * Helper function to get credit cost for a filing type (flat rate filings)
 */
export function getFilingCost(filingType: FilingType): number {
  return FILING_COSTS[filingType];
}

/**
 * Helper function to format credit cost as string
 */
export function formatFilingCost(filingType: FilingType): string {
  return `${FILING_COSTS[filingType]} credits`;
}

/**
 * Get entity size description for pricing display
 */
export function getEntitySizeDescription(entitySize: EntitySize): string {
  const descriptions = {
    micro: 'Micro-entity accounts (simplified, no Cash Flow)',
    small: 'Small company accounts (standard)',
    medium: 'Medium company accounts (includes Cash Flow Statement)',
    large: 'Large company accounts (includes Cash Flow + Strategic Report)',
  };
  return descriptions[entitySize];
}

/**
 * Get CT600 complexity description for pricing display
 */
export function getCT600ComplexityDescription(complexity: CT600Complexity): string {
  const descriptions = {
    simple: 'Simple trading company (no supplementary pages)',
    standard: 'Standard company (some supplementary pages)',
    complex: 'Complex company (multiple supplementary pages)',
    group: 'Group companies (consolidated returns)',
  };
  return descriptions[complexity];
}

/**
 * Detect CT600 complexity based on supplementary pages required
 */
export function detectCT600Complexity(supplementaryPages: string[]): CT600Complexity {
  if (supplementaryPages.length === 0) {
    return 'simple';
  } else if (supplementaryPages.length <= 2) {
    return 'standard';
  } else if (supplementaryPages.length <= 5) {
    return 'complex';
  } else {
    return 'group';
  }
}

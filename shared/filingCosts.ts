/**
 * Single source of truth for filing credit costs
 * All pages should import from this file to ensure consistency
 */

export const FILING_COSTS = {
  CONFIRMATION_STATEMENT: 100,
  ANNUAL_ACCOUNTS: 200,
  CORPORATION_TAX: 150,
} as const;

export type FilingType = keyof typeof FILING_COSTS;

/**
 * Helper function to get credit cost for a filing type
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

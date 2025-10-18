/**
 * Subscription Tier Seeding Script
 * 
 * This script initializes the default subscription tiers in the database.
 * It is called during server startup to ensure the tiers exist.
 * 
 * Tiers:
 * - Basic (Free): Single company, limited features
 * - Professional: Multi-company management for accountants
 * - Enterprise: Volume discounts, dedicated support, custom SLAs
 */

import { db } from '../db';
import { subscriptionTiers } from '@shared/schema';
import { eq } from 'drizzle-orm';

interface TierConfig {
  name: string;
  displayName: string;
  description: string;
  monthlyPrice: number;
  annualPrice: number | null;
  creditMultiplier: number;
  features: Record<string, boolean | number>;
  maxCompanies: number | null;
  maxUsers: number | null;
  sortOrder: number;
}

const DEFAULT_TIERS: TierConfig[] = [
  {
    name: 'basic',
    displayName: 'Basic',
    description: 'Perfect for individual directors managing a single company',
    monthlyPrice: 0, // Free
    annualPrice: null,
    creditMultiplier: 100, // 1.0x (no multiplier)
    features: {
      multi_company_management: false,
      priority_support: false,
      batch_operations: false,
      dedicated_support: false,
      custom_sla: false,
      api_access: false,
      client_dashboard: false,
    },
    maxCompanies: 1,
    maxUsers: 1,
    sortOrder: 1,
  },
  {
    name: 'professional',
    displayName: 'Professional',
    description: 'For accountants managing multiple clients with advanced features',
    monthlyPrice: 9900, // £99/month in pence
    annualPrice: 99000, // £990/year (17% discount) in pence
    creditMultiplier: 120, // 1.2x credit multiplier (20% more credits per purchase)
    features: {
      multi_company_management: true,
      priority_support: true,
      batch_operations: true,
      dedicated_support: false,
      custom_sla: false,
      api_access: true,
      client_dashboard: true,
      max_companies: 25,
    },
    maxCompanies: 25,
    maxUsers: 5,
    sortOrder: 2,
  },
  {
    name: 'enterprise',
    displayName: 'Enterprise',
    description: 'For large firms with volume needs, dedicated support, and custom SLAs',
    monthlyPrice: 29900, // £299/month in pence
    annualPrice: 299000, // £2,990/year (17% discount) in pence
    creditMultiplier: 150, // 1.5x credit multiplier (50% more credits per purchase)
    features: {
      multi_company_management: true,
      priority_support: true,
      batch_operations: true,
      dedicated_support: true,
      custom_sla: true,
      api_access: true,
      client_dashboard: true,
      max_companies: null, // Unlimited
      volume_discount_50_filings: 5, // 5% discount for 50+ filings/month
      volume_discount_100_filings: 10, // 10% discount for 100+ filings/month
    },
    maxCompanies: null, // Unlimited
    maxUsers: null, // Unlimited
    sortOrder: 3,
  },
];

/**
 * Seeds the database with default subscription tiers
 * This is idempotent - it will not create duplicates
 */
export async function seedSubscriptionTiers(): Promise<void> {
  try {
    console.log('🎯 Seeding subscription tiers...');
    
    for (const tierConfig of DEFAULT_TIERS) {
      // Check if tier already exists
      const [existingTier] = await db
        .select()
        .from(subscriptionTiers)
        .where(eq(subscriptionTiers.name, tierConfig.name));
      
      if (existingTier) {
        console.log(`  ✓ Tier "${tierConfig.displayName}" already exists (skipping)`);
        continue;
      }
      
      // Create the tier
      await db.insert(subscriptionTiers).values({
        name: tierConfig.name,
        displayName: tierConfig.displayName,
        description: tierConfig.description,
        monthlyPrice: tierConfig.monthlyPrice,
        annualPrice: tierConfig.annualPrice,
        creditMultiplier: tierConfig.creditMultiplier,
        features: tierConfig.features,
        maxCompanies: tierConfig.maxCompanies,
        maxUsers: tierConfig.maxUsers,
        isActive: true,
        sortOrder: tierConfig.sortOrder,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      
      console.log(`  ✓ Created tier: ${tierConfig.displayName} (${tierConfig.name})`);
    }
    
    console.log('✅ Subscription tier seeding complete');
  } catch (error) {
    console.error('❌ Error seeding subscription tiers:', error);
    throw error;
  }
}

/**
 * Gets the basic tier (for new user default)
 */
export async function getBasicTier() {
  const [basicTier] = await db
    .select()
    .from(subscriptionTiers)
    .where(eq(subscriptionTiers.name, 'basic'));
  
  return basicTier;
}

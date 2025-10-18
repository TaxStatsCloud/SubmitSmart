/**
 * Stripe Payment Service
 * 
 * Handles Stripe payment processing for credit packages and filing fees
 */

import Stripe from 'stripe';
import { storage } from '../storage';
import { CreditPackage } from '@shared/schema';

// Initialize Stripe with API key
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required environment variable: STRIPE_SECRET_KEY');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16', // Specify API version
});

/**
 * Create a payment intent for purchasing credits
 */
export async function createCreditPackagePaymentIntent(
  userId: number, 
  packageId: number
): Promise<{ clientSecret: string; package: CreditPackage; discountApplied?: number; finalPrice?: number }> {
  // Get the credit package
  const creditPackage = await storage.getCreditPackage(packageId);
  
  if (!creditPackage) {
    throw new Error(`Credit package with ID ${packageId} not found`);
  }
  
  // Get the user
  const user = await storage.getUser(userId);
  
  if (!user) {
    throw new Error(`User with ID ${userId} not found`);
  }
  
  // Apply Enterprise tier volume discounts
  let finalPrice = creditPackage.price;
  let discountApplied = 0;
  
  if (user.subscriptionTierId) {
    const tier = await storage.getSubscriptionTier(user.subscriptionTierId);
    
    if (tier && tier.features) {
      const features = tier.features as any;
      
      // Apply volume discount based on credit amount
      if (creditPackage.creditAmount >= 100 && features.volume_discount_100_filings) {
        discountApplied = features.volume_discount_100_filings; // e.g., 10%
        finalPrice = Math.round(creditPackage.price * (100 - discountApplied) / 100);
      } else if (creditPackage.creditAmount >= 50 && features.volume_discount_50_filings) {
        discountApplied = features.volume_discount_50_filings; // e.g., 5%
        finalPrice = Math.round(creditPackage.price * (100 - discountApplied) / 100);
      }
    }
  }
  
  // Create a payment intent with Stripe
  const paymentIntent = await stripe.paymentIntents.create({
    amount: finalPrice, // Apply volume discount if applicable
    currency: 'gbp',
    description: `Credit Package: ${creditPackage.name} (${creditPackage.creditAmount} credits)${discountApplied > 0 ? ` - ${discountApplied}% Enterprise discount` : ''}`,
    metadata: {
      userId: userId.toString(),
      packageId: packageId.toString(),
      packageName: creditPackage.name,
      creditAmount: creditPackage.creditAmount.toString(),
      originalPrice: creditPackage.price.toString(),
      discountApplied: discountApplied.toString(),
      finalPrice: finalPrice.toString()
    }
  });
  
  return {
    clientSecret: paymentIntent.client_secret,
    package: creditPackage,
    discountApplied: discountApplied > 0 ? discountApplied : undefined,
    finalPrice: discountApplied > 0 ? finalPrice : undefined
  };
}

/**
 * Create a payment intent for a specific filing
 */
export async function createFilingPaymentIntent(
  userId: number,
  filingId: number, 
  filingType: string
): Promise<{ clientSecret: string; filingCost: number; creditCost: number }> {
  // Get the filing cost
  const filingCost = await storage.getFilingCostByType(filingType);
  
  if (!filingCost) {
    throw new Error(`Filing cost for type ${filingType} not found`);
  }
  
  // Get the filing
  const filing = await storage.getFiling(filingId);
  
  if (!filing) {
    throw new Error(`Filing with ID ${filingId} not found`);
  }
  
  // Get the company
  const company = await storage.getCompany(filing.companyId);
  
  if (!company) {
    throw new Error(`Company with ID ${filing.companyId} not found`);
  }
  
  // Create a payment intent with Stripe
  const paymentIntent = await stripe.paymentIntents.create({
    amount: filingCost.actualCost, // Cost is already in pence/cents
    currency: 'gbp',
    description: `Filing Fee: ${filingType} for ${company.name}`,
    metadata: {
      userId: userId.toString(),
      filingId: filingId.toString(),
      filingType,
      companyId: company.id.toString(),
      companyName: company.name,
      actualCost: filingCost.actualCost.toString(),
      creditCost: filingCost.creditCost.toString()
    }
  });
  
  return {
    clientSecret: paymentIntent.client_secret,
    filingCost: filingCost.actualCost,
    creditCost: filingCost.creditCost
  };
}

/**
 * Process a successful payment webhook
 */
export async function handleSuccessfulPayment(
  paymentIntentId: string
): Promise<void> {
  // Retrieve the payment intent to verify it's real and get metadata
  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
  
  if (paymentIntent.status !== 'succeeded') {
    throw new Error(`Payment ${paymentIntentId} has not succeeded`);
  }
  
  const metadata = paymentIntent.metadata;
  
  // Process credit package purchase
  if (metadata.packageId) {
    const userId = parseInt(metadata.userId);
    const packageId = parseInt(metadata.packageId);
    const creditAmount = parseInt(metadata.creditAmount);
    
    // Add credits to user's account
    const user = await storage.getUser(userId);
    
    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }
    
    // Add credits and create a transaction with the Stripe payment ID
    await storage.updateUserCredits(userId, creditAmount);
    
    // Create a transaction record with Stripe payment details
    await storage.createCreditTransaction({
      userId,
      type: 'purchase',
      amount: creditAmount,
      balance: user.credits + creditAmount,
      description: `Purchased ${creditAmount} credits (${metadata.packageName})`,
      packageId,
      stripePaymentId: paymentIntentId,
      metadata: { 
        paymentAmount: paymentIntent.amount,
        paymentCurrency: paymentIntent.currency
      }
    });
  }
  
  // Process filing payment
  else if (metadata.filingId) {
    const userId = parseInt(metadata.userId);
    const filingId = parseInt(metadata.filingId);
    const filingType = metadata.filingType;
    
    // Mark filing as paid in our system
    await storage.updateFiling(filingId, {
      status: 'payment_received'
    });
    
    // Create an activity record
    await storage.createActivity({
      userId,
      companyId: parseInt(metadata.companyId),
      type: 'filing_payment',
      description: `Payment received for ${filingType} filing`,
      metadata: { 
        filingId,
        paymentAmount: paymentIntent.amount,
        paymentCurrency: paymentIntent.currency,
        stripePaymentId: paymentIntentId
      }
    });
  }
}
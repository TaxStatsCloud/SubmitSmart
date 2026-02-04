/**
 * Billing and Credit Management Routes
 * 
 * Provides API endpoints for managing credits, 
 * viewing credit packages, and handling filing payments.
 */

import { Router } from 'express';
import { storage } from '../storage';
import { z } from 'zod';
import { insertCreditTransactionSchema } from '@shared/schema';
import { createCreditPackagePaymentIntent, createFilingPaymentIntent, handleSuccessfulPayment } from '../services/stripeService';
import Stripe from 'stripe';
import { json } from 'express';

const router = Router();

// Get current user's credits
router.get('/credits', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const userId = (req.user as any).id;
    const credits = await storage.getUserCredits(userId);
    res.json({ credits });
  } catch (error) {
    console.error('Error getting user credits:', error);
    res.status(500).json({ error: 'Failed to get user credits' });
  }
});

// Get all credit packages
router.get('/packages', async (req, res) => {
  try {
    const packages = await storage.getActiveCreditPackages();
    res.json(packages);
  } catch (error) {
    console.error('Error getting credit packages:', error);
    res.status(500).json({ error: 'Failed to get credit packages' });
  }
});

// Get tier-specific credit packages for current user
router.get('/packages/user', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const userId = (req.user as any).id;
    
    const packages = await storage.getCreditPackagesForUser(userId);
    res.json(packages);
  } catch (error) {
    console.error('Error fetching tier-specific credit packages:', error);
    res.status(500).json({ error: 'Failed to get credit packages' });
  }
});

// Get filing costs
router.get('/filing-costs', async (req, res) => {
  try {
    const costs = await storage.getAllFilingCosts();
    res.json(costs);
  } catch (error) {
    console.error('Error getting filing costs:', error);
    res.status(500).json({ error: 'Failed to get filing costs' });
  }
});

// Pre-filing credit validation - check if user has enough credits before starting a filing
router.get('/validate-credits/:filingType', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { filingType } = req.params;
    const userId = (req.user as any).id;

    // Get user's current credits
    const userCredits = await storage.getUserCredits(userId);

    // Get cost for this filing type
    const filingCosts = await storage.getAllFilingCosts();
    const cost = filingCosts.find((c: any) => c.filingType === filingType);

    if (!cost) {
      return res.status(404).json({
        error: `Filing type '${filingType}' not found`,
        valid: false
      });
    }

    const hasEnoughCredits = userCredits >= cost.creditCost;
    const shortfall = hasEnoughCredits ? 0 : cost.creditCost - userCredits;

    res.json({
      valid: hasEnoughCredits,
      currentCredits: userCredits,
      requiredCredits: cost.creditCost,
      shortfall,
      filingType,
      message: hasEnoughCredits
        ? `You have enough credits for this filing (${userCredits} available, ${cost.creditCost} required)`
        : `You need ${shortfall} more credits for this filing (${userCredits} available, ${cost.creditCost} required)`
    });
  } catch (error) {
    console.error('Error validating credits:', error);
    res.status(500).json({ error: 'Failed to validate credits' });
  }
});

// Get user's credit transaction history
router.get('/transactions', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const userId = (req.user as any).id;
    const transactions = await storage.getCreditTransactionsByUser(userId);
    res.json(transactions);
  } catch (error) {
    console.error('Error getting credit transactions:', error);
    res.status(500).json({ error: 'Failed to get credit transactions' });
  }
});

// Create a payment intent for credit purchase
router.post('/create-payment-intent', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const { packageId } = z.object({
      packageId: z.number()
    }).parse(req.body);
    
    const userId = (req.user as any).id;
    
    const result = await createCreditPackagePaymentIntent(userId, packageId);
    
    res.json({
      clientSecret: result.clientSecret,
      package: result.package,
      discountApplied: result.discountApplied,
      finalPrice: result.finalPrice,
      originalPrice: result.package.price
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to create payment intent' });
  }
});

// Create a payment intent for filing payment
router.post('/create-filing-payment', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const { filingId, filingType } = z.object({
      filingId: z.number(),
      filingType: z.string()
    }).parse(req.body);
    
    const userId = (req.user as any).id;
    
    const result = await createFilingPaymentIntent(userId, filingId, filingType);
    
    res.json({
      clientSecret: result.clientSecret,
      filingCost: result.filingCost,
      creditCost: result.creditCost
    });
  } catch (error) {
    console.error('Error creating filing payment:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to create filing payment' });
  }
});

// Stripe webhook endpoint to handle payment events
// NOTE: This webhook uses the atomic processing method to prevent race conditions
// IMPORTANT: Always returns 200 to prevent Stripe retry storms
router.post('/webhook', json({ type: 'application/json' }), async (req, res) => {
  try {
    const sig = req.headers['stripe-signature'] as string;
    
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error('[BILLING-WEBHOOK] Stripe configuration missing');
      // Return 200 even for config errors to prevent retries
      return res.json({ received: true, error: 'Configuration error' });
    }
    
    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      // For testing without webhook signature validation
      const event = req.body;
      await handleStripeEvent(event);
      return res.json({ received: true });
    }
    
    // In production, validate the webhook signature
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
    
    await handleStripeEvent(event);
    res.json({ received: true });
  } catch (error) {
    console.error('[BILLING-WEBHOOK] Error handling webhook:', error);
    // CRITICAL: Return 200 even on errors to prevent Stripe retry storms
    // All errors are logged but webhook is acknowledged to stop retries
    res.json({ received: true, error: error instanceof Error ? error.message : 'Webhook error' });
  }
});

// Deduct credits for a filing 
router.post('/deduct-credits', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const { filingType, filingId } = z.object({
      filingType: z.string(),
      filingId: z.number()
    }).parse(req.body);
    
    const userId = (req.user as any).id;
    const success = await storage.deductCreditsForFiling(userId, filingType, filingId);
    
    if (!success) {
      return res.status(400).json({ error: 'Insufficient credits for this filing' });
    }
    
    const updatedUser = await storage.getUser(userId);
    
    if (!updatedUser) {
      return res.status(500).json({ error: 'Failed to get updated user information' });
    }
    
    res.json({ 
      success: true, 
      remainingCredits: updatedUser.credits
    });
  } catch (error) {
    console.error('Error deducting credits:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to deduct credits' });
  }
});

// Helper function to handle Stripe events using atomic processing
async function handleStripeEvent(event: any) {
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      const metadata = paymentIntent.metadata;
      
      // Process credit package purchase with atomic transaction
      if (metadata.packageId && metadata.userId) {
        try {
          const creditAmount = parseInt(metadata.creditAmount);
          const userIdNum = parseInt(metadata.userId);
          
          // Validate metadata
          if (isNaN(creditAmount) || creditAmount <= 0) {
            console.error(`[BILLING-WEBHOOK] Invalid credits amount: ${metadata.creditAmount}`);
            return; // Return success to prevent retries
          }
          if (isNaN(userIdNum) || userIdNum <= 0) {
            console.error(`[BILLING-WEBHOOK] Invalid user ID: ${metadata.userId}`);
            return; // Return success to prevent retries
          }
          
          // Use atomic processing method to prevent race conditions
          await storage.processStripeWebhookAtomic({
            eventId: paymentIntent.id,
            userId: userIdNum,
            credits: creditAmount,
            planId: metadata.packageName || `package_${metadata.packageId}`,
            paymentIntentId: paymentIntent.id,
            amount: paymentIntent.amount / 100, // Convert to pounds
          });
          
          console.log(`[BILLING-WEBHOOK] Successfully processed payment ${paymentIntent.id}: ${creditAmount} credits added to user ${userIdNum}`);
        } catch (error: any) {
          if (error.message === 'ALREADY_PROCESSED') {
            console.log(`[BILLING-WEBHOOK] Payment ${paymentIntent.id} already processed (duplicate webhook), skipping`);
          } else if (error.message === 'USER_NOT_FOUND') {
            console.error(`[BILLING-WEBHOOK] User not found: ${metadata.userId}`);
          } else {
            console.error('[BILLING-WEBHOOK] Error processing payment:', error);
          }
          // Always return success (no throw) to prevent Stripe retry storms
        }
      }
      // Handle filing payments atomically
      else if (metadata.filingId && metadata.userId) {
        try {
          const filingIdNum = parseInt(metadata.filingId);
          const userIdNum = parseInt(metadata.userId);
          const companyIdNum = parseInt(metadata.companyId);
          
          // Validate metadata
          if (isNaN(filingIdNum) || filingIdNum <= 0) {
            console.error(`[BILLING-WEBHOOK] Invalid filing ID: ${metadata.filingId}`);
            return;
          }
          if (isNaN(userIdNum) || userIdNum <= 0) {
            console.error(`[BILLING-WEBHOOK] Invalid user ID: ${metadata.userId}`);
            return;
          }
          if (isNaN(companyIdNum) || companyIdNum <= 0) {
            console.error(`[BILLING-WEBHOOK] Invalid company ID: ${metadata.companyId}`);
            return;
          }
          
          // Use atomic processing for filing payments
          await storage.processFilingPaymentWebhookAtomic({
            eventId: paymentIntent.id,
            userId: userIdNum,
            filingId: filingIdNum,
            filingType: metadata.filingType,
            companyId: companyIdNum,
            companyName: metadata.companyName,
            paymentIntentId: paymentIntent.id,
            amount: paymentIntent.amount / 100, // Convert to pounds
          });
          
          console.log(`[BILLING-WEBHOOK] Successfully processed filing payment ${paymentIntent.id} for filing ${filingIdNum}`);
        } catch (error: any) {
          if (error.message === 'ALREADY_PROCESSED') {
            console.log(`[BILLING-WEBHOOK] Filing payment ${paymentIntent.id} already processed (duplicate webhook), skipping`);
          } else {
            console.error('[BILLING-WEBHOOK] Error processing filing payment:', error);
          }
          // Always return success (no throw) to prevent Stripe retry storms
        }
      }
      break;
    default:
      console.log(`Unhandled event type: ${event.type}`);
  }
}

export default router;
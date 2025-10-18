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
    // For demo purposes, using sample user - in production use req.isAuthenticated()
    // if (!req.isAuthenticated()) {
    //   return res.status(401).json({ error: 'Not authenticated' });
    // }
    
    // For demo purposes - in production use req.user.id
    const userId = 1;
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
    // For demo purposes, using sample user
    // if (!req.isAuthenticated()) {
    //   return res.status(401).json({ error: 'Not authenticated' });
    // }
    
    // For demo purposes - in production use req.user.id
    const userId = 1;
    
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

// Get user's credit transaction history
router.get('/transactions', async (req, res) => {
  try {
    // For demo purposes, using sample user
    // if (!req.isAuthenticated()) {
    //   return res.status(401).json({ error: 'Not authenticated' });
    // }
    
    // For demo purposes - in production use req.user.id
    const userId = 1;
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
    // For demo purposes, using sample user
    // if (!req.isAuthenticated()) {
    //   return res.status(401).json({ error: 'Not authenticated' });
    // }
    
    const { packageId } = z.object({
      packageId: z.number()
    }).parse(req.body);
    
    // For demo purposes - in production use req.user.id
    const userId = 1;
    
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
    // For demo purposes, using sample user
    // if (!req.isAuthenticated()) {
    //   return res.status(401).json({ error: 'Not authenticated' });
    // }
    
    const { filingId, filingType } = z.object({
      filingId: z.number(),
      filingType: z.string()
    }).parse(req.body);
    
    // For demo purposes - in production use req.user.id
    const userId = 1;
    
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
router.post('/webhook', json({ type: 'application/json' }), async (req, res) => {
  try {
    const sig = req.headers['stripe-signature'] as string;
    
    if (!process.env.STRIPE_SECRET_KEY) {
      return res.status(500).json({ error: 'Stripe configuration missing' });
    }
    
    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      // For testing without webhook signature validation
      const event = req.body;
      await handleStripeEvent(event);
      return res.json({ received: true });
    }
    
    // In production, you would validate the webhook signature
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
    
    await handleStripeEvent(event);
    res.json({ received: true });
  } catch (error) {
    console.error('Error handling webhook:', error);
    res.status(400).json({ error: error instanceof Error ? error.message : 'Webhook error' });
  }
});

// Deduct credits for a filing 
router.post('/deduct-credits', async (req, res) => {
  try {
    // For demo purposes, using sample user
    // if (!req.isAuthenticated()) {
    //   return res.status(401).json({ error: 'Not authenticated' });
    // }
    
    const { filingType, filingId } = z.object({
      filingType: z.string(),
      filingId: z.number()
    }).parse(req.body);
    
    // For demo purposes - in production use req.user.id
    const userId = 1;
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

// Helper function to handle Stripe events
async function handleStripeEvent(event: any) {
  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      await handleSuccessfulPayment(paymentIntent.id);
      break;
    // Add other event types as needed
    default:
      console.log(`Unhandled event type: ${event.type}`);
  }
}

export default router;
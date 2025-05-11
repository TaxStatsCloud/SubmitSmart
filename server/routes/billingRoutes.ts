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

const router = Router();

// Get current user's credits
router.get('/credits', async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const credits = await storage.getUserCredits(req.user.id);
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
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const transactions = await storage.getCreditTransactionsByUser(req.user.id);
    res.json(transactions);
  } catch (error) {
    console.error('Error getting credit transactions:', error);
    res.status(500).json({ error: 'Failed to get credit transactions' });
  }
});

// Purchase credits (creates Stripe payment intent)
router.post('/purchase', async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const { packageId } = z.object({
      packageId: z.number()
    }).parse(req.body);
    
    const creditPackage = await storage.getCreditPackage(packageId);
    
    if (!creditPackage) {
      return res.status(404).json({ error: 'Credit package not found' });
    }
    
    if (!process.env.STRIPE_SECRET_KEY) {
      return res.status(500).json({ error: 'Stripe configuration missing' });
    }
    
    // This would typically create a Stripe payment intent
    // For now, we'll just add the credits directly (for testing)
    const updatedUser = await storage.updateUserCredits(req.user.id, creditPackage.creditAmount);
    
    res.json({ 
      success: true, 
      creditsAdded: creditPackage.creditAmount, 
      newBalance: updatedUser.credits 
    });
  } catch (error) {
    console.error('Error purchasing credits:', error);
    res.status(500).json({ error: 'Failed to process credit purchase' });
  }
});

// Deduct credits for a filing 
router.post('/deduct-credits', async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const { filingType, filingId } = z.object({
      filingType: z.string(),
      filingId: z.number()
    }).parse(req.body);
    
    const success = await storage.deductCreditsForFiling(req.user.id, filingType, filingId);
    
    if (!success) {
      return res.status(400).json({ error: 'Insufficient credits for this filing' });
    }
    
    const updatedUser = await storage.getUser(req.user.id);
    
    res.json({ 
      success: true, 
      remainingCredits: updatedUser.credits
    });
  } catch (error) {
    console.error('Error deducting credits:', error);
    res.status(500).json({ error: 'Failed to deduct credits' });
  }
});

export default router;
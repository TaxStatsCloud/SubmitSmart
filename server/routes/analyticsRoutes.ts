import express from "express";
import { storage } from "../storage";
import { isAuthenticated } from "../auth";

const router = express.Router();

// Get filing analytics for the authenticated user
router.get("/filings", isAuthenticated, async (req, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Get all filings for the user
    const filings = await storage.getFilingsByUser(userId);
    
    // Calculate statistics
    const totalFilings = filings.length;
    const completedFilings = filings.filter(f => f.status === 'submitted' || f.status === 'approved').length;
    const pendingFilings = filings.filter(f => f.status === 'pending' || f.status === 'draft').length;
    const failedFilings = filings.filter(f => f.status === 'rejected' || f.status === 'failed').length;
    const successRate = totalFilings > 0 ? (completedFilings / totalFilings) * 100 : 0;

    // Calculate credits used
    const creditTransactions = await storage.getCreditTransactionsByUser(userId);
    const creditsUsed = creditTransactions
      .filter(t => t.type === 'filing_deduction' || t.type === 'usage')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    // Calculate money saved (vs traditional accounting services)
    // Assumptions:
    // - Annual Accounts with accountant: £500 avg (we charge £120 credits = ~£12)
    // - Confirmation Statement with accountant: £150 avg (we charge £50 credits = ~£5)
    // - Corporation Tax with accountant: £600 avg (we charge £100 credits = ~£10)
    const savingsPerType: Record<string, number> = {
      'annual_accounts': 500 - 12,  // £488 saved
      'confirmation_statement': 150 - 5,  // £145 saved
      'corporation_tax': 600 - 10,  // £590 saved
    };
    
    const moneySaved = filings.reduce((sum, filing) => {
      return sum + (savingsPerType[filing.type] || 0);
    }, 0);

    // Group filings by type
    const filingsByType = filings.reduce((acc, filing) => {
      const existing = acc.find(f => f.type === filing.type);
      if (existing) {
        existing.count++;
      } else {
        acc.push({ type: filing.type, count: 1 });
      }
      return acc;
    }, [] as { type: string; count: number }[]);

    // Group filings by month (last 6 months)
    const monthlyActivity: { month: string; count: number }[] = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = date.toLocaleString('en-US', { month: 'short', year: '2-digit' });
      
      const count = filings.filter(f => {
        const filingDate = new Date(f.createdAt);
        return filingDate.getMonth() === date.getMonth() && 
               filingDate.getFullYear() === date.getFullYear();
      }).length;
      
      monthlyActivity.push({ month: monthKey, count });
    }

    res.json({
      totalFilings,
      completedFilings,
      pendingFilings,
      failedFilings,
      creditsUsed,
      moneySaved,
      successRate,
      filingsByType,
      monthlyActivity,
    });
  } catch (error: any) {
    console.error('Error fetching filing analytics:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// Get credit usage analytics
router.get("/credits", isAuthenticated, async (req, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const transactions = await storage.getCreditTransactionsByUser(userId);
    
    // Group by month
    const monthlyCredits: { month: string; purchased: number; used: number }[] = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = date.toLocaleString('en-US', { month: 'short', year: '2-digit' });
      
      const monthTransactions = transactions.filter(t => {
        const transactionDate = new Date(t.createdAt);
        return transactionDate.getMonth() === date.getMonth() && 
               transactionDate.getFullYear() === date.getFullYear();
      });
      
      const purchased = monthTransactions
        .filter(t => t.amount > 0)
        .reduce((sum, t) => sum + t.amount, 0);
      
      const used = Math.abs(monthTransactions
        .filter(t => t.amount < 0)
        .reduce((sum, t) => sum + t.amount, 0));
      
      monthlyCredits.push({ month: monthKey, purchased, used });
    }

    res.json({
      monthlyCredits,
      totalPurchased: transactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0),
      totalUsed: Math.abs(transactions.filter(t => t.amount < 0).reduce((sum, t) => sum + t.amount, 0)),
    });
  } catch (error: any) {
    console.error('Error fetching credit analytics:', error);
    res.status(500).json({ error: 'Failed to fetch credit analytics' });
  }
});

export default router;

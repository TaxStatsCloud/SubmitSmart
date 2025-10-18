import { Router } from 'express';
import { generateFilingRecommendations } from '../services/recommendationService';

const router = Router();

/**
 * GET /api/recommendations
 * Get AI-powered filing recommendations for the authenticated user
 */
router.get('/', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const userId = req.user.id;
    
    // SECURITY: Never accept companyId from query params to prevent cross-tenant access
    // Always use the authenticated user's own company
    const recommendations = await generateFilingRecommendations(userId);
    
    res.json({
      recommendations,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching filing recommendations:', error);
    res.status(500).json({ error: 'Failed to generate recommendations' });
  }
});

export default router;

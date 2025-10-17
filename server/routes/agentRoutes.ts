/**
 * Agent Management Routes
 * 
 * Provides API endpoints for managing and monitoring agents.
 * These routes allow administrators to:
 * - View agent status and execution history
 * - Manually trigger agent runs
 * - Update agent scheduling
 */

import { Router } from 'express';
import { 
  runAgent, 
  runAgentSequence, 
  getAgentRuns, 
  getAgentRunsByType,
  AgentType 
} from '../services/agents/agentOrchestrator';
import { 
  getScheduledAgents, 
  updateSchedule, 
  disableSchedule, 
  runManualAgentExecution,
  ScheduleConfig
} from '../services/agents/scheduler';
import { logger } from '../utils/logger';

const router = Router();
const agentRoutesLogger = logger.withContext('AgentRoutes');

/**
 * Get all agent runs
 * GET /api/agents/runs
 */
router.get('/runs', async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
    const runs = await getAgentRuns(limit);
    res.json(runs);
  } catch (error) {
    agentRoutesLogger.error('Error getting agent runs:', error);
    res.status(500).json({ error: 'Failed to get agent runs' });
  }
});

/**
 * Get agent runs by type
 * GET /api/agents/runs/:type
 */
router.get('/runs/:type', async (req, res) => {
  try {
    const agentType = req.params.type;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
    const runs = await getAgentRunsByType(agentType, limit);
    res.json(runs);
  } catch (error) {
    agentRoutesLogger.error(`Error getting agent runs for type ${req.params.type}:`, error);
    res.status(500).json({ error: 'Failed to get agent runs' });
  }
});

/**
 * Get all scheduled agents
 * GET /api/agents/schedules
 */
router.get('/schedules', (req, res) => {
  try {
    const schedules = getScheduledAgents();
    res.json(schedules);
  } catch (error) {
    agentRoutesLogger.error('Error getting scheduled agents:', error);
    res.status(500).json({ error: 'Failed to get scheduled agents' });
  }
});

/**
 * Run an agent manually
 * POST /api/agents/run
 */
router.post('/run', async (req, res) => {
  try {
    const { agentType, params } = req.body;
    
    if (!agentType) {
      return res.status(400).json({ error: 'Agent type is required' });
    }
    
    // Validate agent type
    const validAgentTypes: AgentType[] = [
      'companies_house', 
      'contact_research', 
      'outreach_email', 
      'onboarding', 
      'document_processing'
    ];
    
    if (!validAgentTypes.includes(agentType as AgentType)) {
      return res.status(400).json({ error: 'Invalid agent type' });
    }
    
    agentRoutesLogger.info(`Manually running agent: ${agentType}`, params);
    
    // Run the agent
    const result = await runManualAgentExecution(agentType as AgentType, params || {});
    
    res.json({
      success: true,
      result
    });
  } catch (error) {
    agentRoutesLogger.error('Error running agent:', error);
    res.status(500).json({ error: 'Failed to run agent' });
  }
});

/**
 * Run a sequence of agents manually
 * POST /api/agents/run-sequence
 */
router.post('/run-sequence', async (req, res) => {
  try {
    const { sequence } = req.body;
    
    if (!sequence || !Array.isArray(sequence)) {
      return res.status(400).json({ error: 'Sequence must be an array of agent configurations' });
    }
    
    agentRoutesLogger.info(`Manually running agent sequence with ${sequence.length} steps`);
    
    // Run the sequence
    const results = await runAgentSequence(sequence);
    
    res.json({
      success: true,
      results
    });
  } catch (error) {
    agentRoutesLogger.error('Error running agent sequence:', error);
    res.status(500).json({ error: 'Failed to run agent sequence' });
  }
});

/**
 * Update agent schedule
 * PATCH /api/agents/schedule
 */
router.patch('/schedule', (req, res) => {
  try {
    const config: ScheduleConfig = req.body;
    
    if (!config.agentType || !config.cronExpression) {
      return res.status(400).json({ error: 'Agent type and cron expression are required' });
    }
    
    // Update the schedule
    const success = updateSchedule(config);
    
    if (success) {
      res.json({
        success: true,
        message: `Schedule updated for ${config.agentType}`
      });
    } else {
      res.status(500).json({ error: 'Failed to update schedule' });
    }
  } catch (error) {
    agentRoutesLogger.error('Error updating agent schedule:', error);
    res.status(500).json({ error: 'Failed to update schedule' });
  }
});

/**
 * Disable agent schedule
 * DELETE /api/agents/schedule/:type
 */
router.delete('/schedule/:type', (req, res) => {
  try {
    const agentType = req.params.type as AgentType;
    
    // Disable the schedule
    const success = disableSchedule(agentType);
    
    if (success) {
      res.json({
        success: true,
        message: `Schedule disabled for ${agentType}`
      });
    } else {
      res.status(404).json({ error: 'No schedule found for agent type' });
    }
  } catch (error) {
    agentRoutesLogger.error(`Error disabling schedule for ${req.params.type}:`, error);
    res.status(500).json({ error: 'Failed to disable schedule' });
  }
});

/**
 * Get all prospects with optional filtering
 * GET /api/agents/prospects
 */
router.get('/prospects', async (req, res) => {
  try {
    const { db } = await import('../db');
    const { prospects } = await import('@shared/schema');
    const { eq, gte, and, desc } = await import('drizzle-orm');
    
    const { status, minScore, limit } = req.query;
    let conditions = [];

    if (status && typeof status === 'string') {
      conditions.push(eq(prospects.leadStatus, status));
    }

    if (minScore && !isNaN(Number(minScore))) {
      conditions.push(gte(prospects.leadScore, Number(minScore)));
    }

    const results = await db.query.prospects.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      orderBy: [desc(prospects.leadScore), desc(prospects.createdAt)],
      limit: limit ? Number(limit) : 100
    });

    res.json(results);
  } catch (error) {
    agentRoutesLogger.error('Error fetching prospects:', error);
    res.status(500).json({ error: 'Failed to fetch prospects' });
  }
});

/**
 * Get agent performance statistics
 * GET /api/agents/stats
 */
router.get('/stats', async (req, res) => {
  try {
    const { db } = await import('../db');
    const { agentRuns } = await import('@shared/schema');
    const { eq } = await import('drizzle-orm');
    
    const { agentType } = req.query;

    const runs = await db.query.agentRuns.findMany({
      where: agentType && typeof agentType === 'string' ? eq(agentRuns.agentType, agentType) : undefined
    });

    const totalRuns = runs.length;
    const successfulRuns = runs.filter(r => r.status === 'completed').length;
    const failedRuns = runs.filter(r => r.status === 'failed').length;
    
    const totalProspects = runs.reduce((sum, run) => {
      const metrics = run.metrics as any;
      return sum + (metrics?.totalProcessed || metrics?.companiesProcessed || 0);
    }, 0);

    res.json({
      totalRuns,
      successfulRuns,
      failedRuns,
      averageProspectsPerRun: totalRuns > 0 ? Math.round(totalProspects / totalRuns) : 0
    });
  } catch (error) {
    agentRoutesLogger.error('Error fetching agent stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

export default router;
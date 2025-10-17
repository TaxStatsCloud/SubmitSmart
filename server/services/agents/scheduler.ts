/**
 * Agent Scheduler
 * 
 * This service provides a more robust scheduling mechanism for agent runs
 * using node-cron for precise scheduling with cron expressions.
 */

import cron from 'node-cron';
import { runAgent, AgentType } from './agentOrchestrator';
import { logger } from '../../utils/logger';
import { db } from '../../db';
import { agentRuns } from '@shared/schema';
import { eq } from 'drizzle-orm';

// Creating a specialized logger for the scheduler
const schedulerLogger = logger.withContext('AgentScheduler');

// Store active scheduled tasks
const scheduledTasks: Record<string, cron.ScheduledTask> = {};

/**
 * Schedule configuration type
 */
export interface ScheduleConfig {
  agentType: AgentType;
  cronExpression: string;
  params?: Record<string, any>;
  enabled: boolean;
  description: string;
}

/**
 * Default schedule configuration for all agents
 */
const defaultSchedules: ScheduleConfig[] = [
  {
    agentType: 'companies_house',
    cronExpression: '0 2 * * *', // Every day at 2 AM
    params: { 
      searchQuery: 'limited',
      daysAhead: 90,
      maxResults: 100
    },
    enabled: true,
    description: 'Daily Companies House lead discovery'
  },
  {
    agentType: 'contact_research',
    cronExpression: '0 3 * * *', // Every day at 3 AM (after discovery)
    params: { batchSize: 50 },
    enabled: true,
    description: 'Daily email enrichment for new prospects'
  },
  {
    agentType: 'outreach_email',
    cronExpression: '0 9 * * 1-5', // Every weekday at 9 AM
    enabled: true,
    description: 'Weekday automated outreach emails'
  }
];

/**
 * Initialize all agent schedules
 */
export function initializeSchedules(schedules: ScheduleConfig[] = defaultSchedules): void {
  schedulerLogger.info('Initializing agent schedules');
  
  // Only schedule agents in production
  if (process.env.NODE_ENV !== 'production') {
    schedulerLogger.info('Agent scheduling disabled in development mode');
    return;
  }
  
  // Schedule each agent
  for (const schedule of schedules) {
    if (schedule.enabled) {
      scheduleAgent(schedule);
    } else {
      schedulerLogger.info(`Agent ${schedule.agentType} schedule disabled`);
    }
  }
  
  schedulerLogger.info(`Initialized ${Object.keys(scheduledTasks).length} agent schedules`);
}

/**
 * Schedule a single agent
 */
export function scheduleAgent(config: ScheduleConfig): boolean {
  try {
    // Validate cron expression
    if (!cron.validate(config.cronExpression)) {
      schedulerLogger.error(`Invalid cron expression for ${config.agentType}: ${config.cronExpression}`);
      return false;
    }
    
    // Cancel any existing schedule for this agent
    if (scheduledTasks[config.agentType]) {
      scheduledTasks[config.agentType].stop();
      delete scheduledTasks[config.agentType];
    }
    
    // Schedule the agent
    const task = cron.schedule(config.cronExpression, async () => {
      schedulerLogger.info(`Running scheduled ${config.agentType} agent`);
      
      try {
        await runAgent(config.agentType, config.params || {});
        schedulerLogger.info(`Completed scheduled ${config.agentType} agent run`);
      } catch (error) {
        schedulerLogger.error(`Scheduled ${config.agentType} agent failed:`, error);
        
        // Record the failure in the database
        await db
          .insert(agentRuns)
          .values({
            agentType: config.agentType,
            status: 'failed',
            startedAt: new Date(),
            completedAt: new Date(),
            error: error.message || 'Unknown error',
            metrics: {},
            metadata: { scheduled: true },
            createdAt: new Date()
          });
      }
    });
    
    // Store the scheduled task
    scheduledTasks[config.agentType] = task;
    
    schedulerLogger.info(`Scheduled ${config.agentType} agent with cron: ${config.cronExpression}`);
    return true;
  } catch (error) {
    schedulerLogger.error(`Error scheduling ${config.agentType} agent:`, error);
    return false;
  }
}

/**
 * Update an agent's schedule
 */
export function updateSchedule(config: ScheduleConfig): boolean {
  return scheduleAgent(config);
}

/**
 * Disable an agent's schedule
 */
export function disableSchedule(agentType: AgentType): boolean {
  if (scheduledTasks[agentType]) {
    scheduledTasks[agentType].stop();
    delete scheduledTasks[agentType];
    schedulerLogger.info(`Disabled ${agentType} agent schedule`);
    return true;
  }
  
  schedulerLogger.warn(`No schedule found for ${agentType} agent`);
  return false;
}

/**
 * Get all scheduled agents
 */
export function getScheduledAgents(): string[] {
  return Object.keys(scheduledTasks);
}

/**
 * Run a manual agent execution
 */
export async function runManualAgentExecution(
  agentType: AgentType,
  params: Record<string, any> = {}
): Promise<any> {
  schedulerLogger.info(`Running manual ${agentType} agent execution`, params);
  
  try {
    // Create agent run record with manual flag
    const [agentRun] = await db
      .insert(agentRuns)
      .values({
        agentType: agentType,
        status: 'running',
        startedAt: new Date(),
        metrics: {},
        metadata: { manual: true, params },
        createdAt: new Date()
      })
      .returning();
    
    // Run the agent
    const result = await runAgent(agentType, params);
    
    // Update the agent run record
    await db
      .update(agentRuns)
      .set({
        status: result.success ? 'completed' : 'failed',
        completedAt: new Date(),
        error: result.success ? null : result.error,
        metrics: result.metrics
      })
      .where(eq(agentRuns.id, agentRun.id));
    
    schedulerLogger.info(`Completed manual ${agentType} agent execution`);
    return result;
  } catch (error) {
    schedulerLogger.error(`Manual ${agentType} agent execution failed:`, error);
    throw error;
  }
}

/**
 * Shutdown all scheduled tasks
 * This should be called when the application is shutting down
 */
export function shutdownScheduler(): void {
  schedulerLogger.info('Shutting down agent scheduler');
  
  // Stop all scheduled tasks
  for (const agentType in scheduledTasks) {
    scheduledTasks[agentType].stop();
    delete scheduledTasks[agentType];
  }
  
  schedulerLogger.info('Agent scheduler shutdown complete');
}
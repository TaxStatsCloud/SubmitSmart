/**
 * Agent Orchestrator
 * 
 * This service coordinates the execution of all agents in the system.
 * It handles scheduling, error handling, and reporting for agent runs.
 */

import { identifyCompaniesWithUpcomingFilings } from './companiesHouseAgent';
import { findCompanyContactInformation } from './contactResearchAgent';
import { sendFilingReminderEmails } from './outreachEmailAgent';
import { onboardNewUser, processUploadedDocument } from './onboardingAgent';
import { logger } from '../../utils/logger';
import { db } from '../../db';
import { agentRuns } from '@shared/schema';
import { eq } from 'drizzle-orm';

// Creating a specialized logger for the orchestrator
const orchestratorLogger = logger.withContext('AgentOrchestrator');

/**
 * Agent types supported by the system
 */
export type AgentType = 
  | 'companies_house' 
  | 'contact_research' 
  | 'outreach_email' 
  | 'onboarding'
  | 'document_processing';

/**
 * Agent execution result
 */
export interface AgentResult {
  success: boolean;
  agentType: AgentType;
  metrics: Record<string, any>;
  error?: string;
}

/**
 * Run a specific agent
 */
export async function runAgent(
  agentType: AgentType,
  params: Record<string, any> = {}
): Promise<AgentResult> {
  orchestratorLogger.info(`Starting agent: ${agentType}`, params);
  
  try {
    let result: any;
    
    switch (agentType) {
      case 'companies_house':
        result = await identifyCompaniesWithUpcomingFilings();
        return {
          success: true,
          agentType,
          metrics: {
            companiesProcessed: result.processed,
            filingRemindersCreated: result.filingReminders
          }
        };
      
      case 'contact_research':
        const batchSize = params.batchSize || 10;
        result = await findCompanyContactInformation(batchSize);
        return {
          success: true,
          agentType,
          metrics: {
            companiesProcessed: result.processed,
            contactsFound: result.contactsFound
          }
        };
      
      case 'outreach_email':
        result = await sendFilingReminderEmails();
        return {
          success: true,
          agentType,
          metrics: {
            companiesProcessed: result.processed,
            emailsSent: result.emailsSent
          }
        };
      
      case 'onboarding':
        if (!params.userId) {
          throw new Error('userId is required for onboarding agent');
        }
        result = await onboardNewUser(params.userId);
        return {
          success: result.success,
          agentType,
          metrics: {
            userId: result.userId
          }
        };
      
      case 'document_processing':
        if (!params.documentId) {
          throw new Error('documentId is required for document processing agent');
        }
        result = await processUploadedDocument(params.documentId);
        return {
          success: result.success,
          agentType,
          metrics: {
            documentId: result.documentId,
            processingComplete: result.processingComplete
          }
        };
      
      default:
        throw new Error(`Unknown agent type: ${agentType}`);
    }
  } catch (error) {
    orchestratorLogger.error(`Error running agent ${agentType}:`, error);
    
    return {
      success: false,
      agentType,
      metrics: {},
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Run multiple agents in sequence
 */
export async function runAgentSequence(
  sequence: Array<{
    agentType: AgentType;
    params?: Record<string, any>;
  }>
): Promise<AgentResult[]> {
  const results: AgentResult[] = [];
  
  for (const step of sequence) {
    const result = await runAgent(step.agentType, step.params);
    results.push(result);
    
    // If an agent fails, stop the sequence
    if (!result.success) {
      orchestratorLogger.warn(`Agent sequence stopped due to failure of ${step.agentType}`);
      break;
    }
  }
  
  return results;
}

/**
 * Get all agent runs with their metrics
 */
export async function getAgentRuns(limit: number = 50): Promise<any[]> {
  return await db.query.agentRuns.findMany({
    orderBy: (agentRuns, { desc }) => [desc(agentRuns.createdAt)],
    limit
  });
}

/**
 * Get agent runs by type
 */
export async function getAgentRunsByType(agentType: string, limit: number = 50): Promise<any[]> {
  return await db.query.agentRuns.findMany({
    where: eq(agentRuns.agentType, agentType),
    orderBy: (agentRuns, { desc }) => [desc(agentRuns.createdAt)],
    limit
  });
}

/**
 * Schedule for running agents
 * This is a simplified version that would be replaced with a proper job scheduler
 * in a production environment
 */
export function initializeAgentSchedule(): void {
  orchestratorLogger.info('Initializing agent schedule');
  
  // In a real application, this would use a proper job scheduler like node-cron
  // For now, we'll use simple setInterval for demonstration
  
  // Companies House agent - Run weekly
  setInterval(async () => {
    try {
      orchestratorLogger.info('Running scheduled Companies House agent');
      await runAgent('companies_house');
    } catch (error) {
      orchestratorLogger.error('Scheduled Companies House agent failed:', error);
    }
  }, 7 * 24 * 60 * 60 * 1000); // Weekly
  
  // Contact Research agent - Run daily
  setInterval(async () => {
    try {
      orchestratorLogger.info('Running scheduled Contact Research agent');
      await runAgent('contact_research', { batchSize: 20 });
    } catch (error) {
      orchestratorLogger.error('Scheduled Contact Research agent failed:', error);
    }
  }, 24 * 60 * 60 * 1000); // Daily
  
  // Outreach Email agent - Run daily
  setInterval(async () => {
    try {
      orchestratorLogger.info('Running scheduled Outreach Email agent');
      await runAgent('outreach_email');
    } catch (error) {
      orchestratorLogger.error('Scheduled Outreach Email agent failed:', error);
    }
  }, 24 * 60 * 60 * 1000); // Daily
  
  orchestratorLogger.info('Agent schedule initialized');
}

/**
 * Initialize agents on application startup
 * This is called when the application starts
 */
export function initializeAgents(): void {
  // In a production application, you might want to run initial 
  // data loading or configuration here
  
  orchestratorLogger.info('Initializing agents');
  
  // Initialize agent schedule
  if (process.env.NODE_ENV === 'production') {
    initializeAgentSchedule();
  } else {
    orchestratorLogger.info('Agent scheduling disabled in development mode');
  }
  
  orchestratorLogger.info('Agent initialization complete');
}
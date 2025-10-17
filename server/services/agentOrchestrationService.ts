/**
 * Agent Orchestration Service
 * 
 * Manages automated agents for:
 * - Companies House API queries for companies with filing deadlines
 * - Lead scoring and qualification
 * - Automated prospect discovery and tracking
 * - Agent run monitoring and metrics
 */

import { db } from '../db';
import { prospects, agentRuns, insertProspectSchema } from '@shared/schema';
import { companiesHouseApiService } from './companiesHouseApiService';
import { eq, and, gte, sql } from 'drizzle-orm';

export class AgentOrchestrationService {
  /**
   * Run Companies House discovery agent
   * Searches for companies with upcoming filing deadlines and creates prospects
   */
  async runCompaniesHouseAgent(
    searchQuery: string,
    daysAhead: number = 90,
    maxResults: number = 50
  ): Promise<{
    agentRunId: number;
    prospectsCreated: number;
    prospectsUpdated: number;
    totalProcessed: number;
  }> {
    // Create agent run record
    const [agentRun] = await db.insert(agentRuns).values({
      agentType: 'companies_house',
      status: 'running',
      startedAt: new Date(),
      metadata: {
        searchQuery,
        daysAhead,
        maxResults
      }
    }).returning();

    let prospectsCreated = 0;
    let prospectsUpdated = 0;

    try {
      console.log(`[Agent] Starting Companies House discovery agent (run ${agentRun.id})`);
      console.log(`[Agent] Search query: "${searchQuery}", days ahead: ${daysAhead}`);

      // Get companies with upcoming deadlines
      const companiesWithDeadlines = await companiesHouseApiService.getCompaniesWithUpcomingDeadlines(
        searchQuery,
        daysAhead,
        maxResults
      );

      console.log(`[Agent] Found ${companiesWithDeadlines.length} companies with upcoming deadlines`);

      // Process each company
      for (const { profile, leadScore, entitySize } of companiesWithDeadlines) {
        try {
          // Check if prospect already exists
          const existingProspect = await db.query.prospects.findFirst({
            where: eq(prospects.companyNumber, profile.company_number)
          });

          const prospectData = {
            companyNumber: profile.company_number,
            companyName: profile.company_name,
            companyStatus: profile.company_status,
            incorporationDate: profile.date_of_creation || null,
            accountsDueDate: profile.accounts?.next_due || null,
            confirmationStatementDueDate: profile.confirmation_statement?.next_due || null,
            entitySize,
            sic_codes: profile.sic_codes || [],
            leadScore,
            leadStatus: 'new',
            agentRunId: agentRun.id,
            discoverySource: 'companies_house_api'
          };

          if (existingProspect) {
            // Update existing prospect with latest data
            await db.update(prospects)
              .set({
                ...prospectData,
                updatedAt: new Date()
              })
              .where(eq(prospects.id, existingProspect.id));
            
            prospectsUpdated++;
            console.log(`[Agent] Updated prospect: ${profile.company_name} (${profile.company_number})`);
          } else {
            // Create new prospect
            await db.insert(prospects).values(prospectData);
            prospectsCreated++;
            console.log(`[Agent] Created prospect: ${profile.company_name} (${profile.company_number}), score: ${leadScore}`);
          }
        } catch (error) {
          console.error(`[Agent] Error processing ${profile.company_number}:`, error);
        }
      }

      // Update agent run as completed
      await db.update(agentRuns)
        .set({
          status: 'completed',
          completedAt: new Date(),
          metrics: {
            prospectsCreated,
            prospectsUpdated,
            totalProcessed: companiesWithDeadlines.length
          }
        })
        .where(eq(agentRuns.id, agentRun.id));

      console.log(`[Agent] Completed run ${agentRun.id}: ${prospectsCreated} created, ${prospectsUpdated} updated`);

      return {
        agentRunId: agentRun.id,
        prospectsCreated,
        prospectsUpdated,
        totalProcessed: companiesWithDeadlines.length
      };
    } catch (error) {
      // Mark agent run as failed
      await db.update(agentRuns)
        .set({
          status: 'failed',
          completedAt: new Date(),
          error: error instanceof Error ? error.message : 'Unknown error'
        })
        .where(eq(agentRuns.id, agentRun.id));

      throw error;
    }
  }

  /**
   * Get high-priority prospects for outreach
   * Returns prospects with high lead scores that haven't been contacted recently
   */
  async getHighPriorityProspects(limit: number = 20): Promise<any[]> {
    const highPriorityProspects = await db.query.prospects.findMany({
      where: and(
        eq(prospects.leadStatus, 'new'),
        gte(prospects.leadScore, 60) // High priority threshold
      ),
      orderBy: (prospects, { desc }) => [desc(prospects.leadScore)],
      limit
    });

    return highPriorityProspects;
  }

  /**
   * Get agent run statistics
   */
  async getAgentRunStats(agentType?: string): Promise<{
    totalRuns: number;
    successfulRuns: number;
    failedRuns: number;
    averageProspectsPerRun: number;
  }> {
    const runs = await db.query.agentRuns.findMany({
      where: agentType ? eq(agentRuns.agentType, agentType) : undefined
    });

    const totalRuns = runs.length;
    const successfulRuns = runs.filter(r => r.status === 'completed').length;
    const failedRuns = runs.filter(r => r.status === 'failed').length;
    
    const totalProspects = runs.reduce((sum, run) => {
      const metrics = run.metrics as any;
      return sum + (metrics?.totalProcessed || 0);
    }, 0);

    return {
      totalRuns,
      successfulRuns,
      failedRuns,
      averageProspectsPerRun: totalRuns > 0 ? Math.round(totalProspects / totalRuns) : 0
    };
  }

  /**
   * Schedule automated discovery runs
   * This would be called by a cron job in production
   */
  async scheduleDiscoveryRuns(searchQueries: string[]): Promise<void> {
    for (const query of searchQueries) {
      try {
        await this.runCompaniesHouseAgent(query, 90, 50);
      } catch (error) {
        console.error(`Error running discovery for query "${query}":`, error);
      }
    }
  }
}

export const agentOrchestrationService = new AgentOrchestrationService();

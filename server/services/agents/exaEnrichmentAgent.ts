import { db } from '../../db';
import { prospects, decisionMakers, agentRuns } from '../../../shared/schema';
import { exaService } from '../exaService';
import { logger } from '../../utils/logger';
import { eq, and, or, isNull } from 'drizzle-orm';

const agentLogger = logger.withContext('ExaEnrichmentAgent');

export interface ExaEnrichmentMetrics {
  prospectsProcessed: number;
  prospectsEnriched: number;
  decisionMakersFound: number;
  errors: number;
  leadScoreImprovements: number;
}

export class ExaEnrichmentAgent {
  async run(limit: number = 50): Promise<{
    success: boolean;
    metrics: ExaEnrichmentMetrics;
    agentRunId?: number;
  }> {
    agentLogger.info('Starting Exa enrichment agent', { limit });

    // Create agent run record
    const [agentRun] = await db
      .insert(agentRuns)
      .values({
        agentType: 'exa_enrichment',
        status: 'running',
        startedAt: new Date(),
        metadata: { limit },
      })
      .returning();

    const metrics: ExaEnrichmentMetrics = {
      prospectsProcessed: 0,
      prospectsEnriched: 0,
      decisionMakersFound: 0,
      errors: 0,
      leadScoreImprovements: 0,
    };

    try {
      // Find prospects that need enrichment
      const unenrichedProspects = await db
        .select()
        .from(prospects)
        .where(
          and(
            eq(prospects.companyStatus, 'active'),
            or(
              eq(prospects.enrichmentStatus, 'pending'),
              isNull(prospects.enrichmentStatus)
            )
          )
        )
        .limit(limit);

      agentLogger.info('Found prospects to enrich', { count: unenrichedProspects.length });

      for (const prospect of unenrichedProspects) {
        try {
          metrics.prospectsProcessed++;

          agentLogger.info('Enriching prospect', {
            companyName: prospect.companyName,
            companyNumber: prospect.companyNumber,
          });

          // Step 1: Enrich company data
          const enrichmentData = await exaService.enrichCompany(
            prospect.companyName,
            prospect.companyNumber
          );

          if (enrichmentData) {
            // Calculate enhanced lead score
            const enhancedLeadScore = this.calculateEnhancedLeadScore(
              prospect,
              enrichmentData
            );

            // Update prospect with enriched data
            await db
              .update(prospects)
              .set({
                enrichmentStatus: 'enriched',
                enrichedAt: new Date(),
                companyWebsite: enrichmentData.website,
                companyDescription: enrichmentData.description,
                employeeCount: enrichmentData.employeeCount,
                estimatedRevenue: enrichmentData.estimatedRevenue,
                fundingStage: enrichmentData.fundingStage,
                techStack: enrichmentData.techStack,
                recentNews: enrichmentData.recentNews,
                socialProfiles: enrichmentData.socialProfiles,
                leadScore: enhancedLeadScore,
                updatedAt: new Date(),
              })
              .where(eq(prospects.id, prospect.id));

            metrics.prospectsEnriched++;

            if (enhancedLeadScore > (prospect.leadScore || 0)) {
              metrics.leadScoreImprovements++;
            }

            // Step 2: Find decision makers
            const contacts = await exaService.findDecisionMakers(
              prospect.companyName,
              enrichmentData.website
            );

            if (contacts.length > 0) {
              // Insert decision makers
              for (const contact of contacts) {
                await db.insert(decisionMakers).values({
                  prospectId: prospect.id,
                  name: contact.name,
                  title: contact.title,
                  email: contact.email,
                  phone: contact.phone,
                  linkedinUrl: contact.linkedinUrl,
                  source: 'exa',
                  confidence: contact.confidence,
                });

                metrics.decisionMakersFound++;
              }

              agentLogger.info('Decision makers discovered', {
                companyName: prospect.companyName,
                count: contacts.length,
              });
            }
          } else {
            // Mark as failed enrichment
            await db
              .update(prospects)
              .set({
                enrichmentStatus: 'failed',
                enrichedAt: new Date(),
                updatedAt: new Date(),
              })
              .where(eq(prospects.id, prospect.id));
          }

          // Rate limiting: wait 1 second between enrichments to avoid API rate limits
          await new Promise(resolve => setTimeout(resolve, 1000));

        } catch (error: any) {
          agentLogger.error('Error enriching prospect', {
            prospectId: prospect.id,
            companyName: prospect.companyName,
            error: error.message,
          });
          metrics.errors++;

          // Mark as failed
          await db
            .update(prospects)
            .set({
              enrichmentStatus: 'failed',
              enrichedAt: new Date(),
              updatedAt: new Date(),
            })
            .where(eq(prospects.id, prospect.id));
        }
      }

      // Update agent run as completed
      await db
        .update(agentRuns)
        .set({
          status: 'completed',
          completedAt: new Date(),
          metrics: metrics as any,
        })
        .where(eq(agentRuns.id, agentRun.id));

      agentLogger.info('Exa enrichment agent completed', metrics);

      return {
        success: true,
        metrics,
        agentRunId: agentRun.id,
      };

    } catch (error: any) {
      agentLogger.error('Exa enrichment agent failed', error);

      // Update agent run as failed
      await db
        .update(agentRuns)
        .set({
          status: 'failed',
          completedAt: new Date(),
          error: error.message,
          metrics: metrics as any,
        })
        .where(eq(agentRuns.id, agentRun.id));

      return {
        success: false,
        metrics,
        agentRunId: agentRun.id,
      };
    }
  }

  private calculateEnhancedLeadScore(prospect: any, enrichmentData: any): number {
    let score = prospect.leadScore || 0;

    // Boost for employee count (indicates company size and potential)
    if (enrichmentData.employeeCount) {
      if (enrichmentData.employeeCount >= 50) score += 15;
      else if (enrichmentData.employeeCount >= 20) score += 10;
      else if (enrichmentData.employeeCount >= 10) score += 5;
    }

    // Boost for funding (indicates growth potential)
    if (enrichmentData.fundingStage) {
      const fundingBoost: Record<string, number> = {
        'Seed': 5,
        'Series A': 10,
        'Series B': 15,
        'Series C': 20,
        'Public': 25,
      };
      score += fundingBoost[enrichmentData.fundingStage] || 0;
    }

    // Boost for having a website (indicates professionalism)
    if (enrichmentData.website) score += 5;

    // Boost for recent news (indicates activity)
    if (enrichmentData.recentNews && enrichmentData.recentNews.length > 0) {
      score += Math.min(enrichmentData.recentNews.length * 2, 10);
    }

    // Boost for social presence (indicates marketing maturity)
    if (enrichmentData.socialProfiles) {
      const profileCount = Object.keys(enrichmentData.socialProfiles).length;
      score += Math.min(profileCount * 3, 10);
    }

    // Cap at 100
    return Math.min(score, 100);
  }
}

export const exaEnrichmentAgent = new ExaEnrichmentAgent();

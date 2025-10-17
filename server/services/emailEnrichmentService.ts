/**
 * Email Enrichment Service
 * 
 * Enriches prospect records with contact emails using Hunter.io
 * Supports both bulk enrichment and individual prospect enrichment
 */

import { db } from '../db';
import { prospects } from '@shared/schema';
import { eq, isNull, and } from 'drizzle-orm';
import { hunterService } from './hunterService';
import { logger } from '../utils/logger';

export interface EnrichmentResult {
  prospectId: number;
  companyName: string;
  emailFound: string | null;
  confidence?: number;
  success: boolean;
  error?: string;
}

export class EmailEnrichmentService {
  /**
   * Enrich a single prospect with contact email
   */
  async enrichProspect(prospectId: number): Promise<EnrichmentResult> {
    try {
      const prospect = await db.query.prospects.findFirst({
        where: eq(prospects.id, prospectId)
      });

      if (!prospect) {
        return {
          prospectId,
          companyName: 'Unknown',
          emailFound: null,
          success: false,
          error: 'Prospect not found'
        };
      }

      logger.info(`EmailEnrichmentService: Enriching prospect ${prospectId}: ${prospect.companyName}`);

      // Find email using Hunter.io
      const result = await hunterService.findCompanyEmail(prospect.companyName);

      if (result.email) {
        // Update prospect with found email
        await db.update(prospects)
          .set({
            contactEmail: result.email,
            contactName: result.firstName && result.lastName 
              ? `${result.firstName} ${result.lastName}` 
              : null,
            metadata: {
              ...((prospect.metadata as any) || {}),
              emailEnrichment: {
                source: 'hunter.io',
                confidence: result.confidence,
                position: result.position,
                enrichedAt: new Date().toISOString()
              }
            },
            updatedAt: new Date()
          })
          .where(eq(prospects.id, prospectId));

        logger.info(`EmailEnrichmentService: Successfully enriched ${prospect.companyName} with ${result.email}`);

        return {
          prospectId,
          companyName: prospect.companyName,
          emailFound: result.email,
          confidence: result.confidence,
          success: true
        };
      } else {
        logger.info(`EmailEnrichmentService: No email found for ${prospect.companyName}`);
        
        return {
          prospectId,
          companyName: prospect.companyName,
          emailFound: null,
          success: false,
          error: 'No email found'
        };
      }
    } catch (error) {
      logger.error(`EmailEnrichmentService: Error enriching prospect ${prospectId}:`, error);
      
      return {
        prospectId,
        companyName: 'Error',
        emailFound: null,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Enrich multiple prospects with contact emails
   */
  async enrichProspects(prospectIds: number[]): Promise<EnrichmentResult[]> {
    const results: EnrichmentResult[] = [];

    for (const id of prospectIds) {
      const result = await this.enrichProspect(id);
      results.push(result);
      
      // Add small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    return results;
  }

  /**
   * Enrich all prospects without emails (bulk operation)
   */
  async enrichProspectsWithoutEmails(limit: number = 50): Promise<{
    total: number;
    enriched: number;
    failed: number;
    results: EnrichmentResult[];
  }> {
    try {
      // Get prospects without contact emails
      const prospectsToEnrich = await db.query.prospects.findMany({
        where: and(
          isNull(prospects.contactEmail),
          eq(prospects.leadStatus, 'new')
        ),
        limit
      });

      logger.info(`EmailEnrichmentService: Starting bulk enrichment for ${prospectsToEnrich.length} prospects`);

      const results: EnrichmentResult[] = [];
      let enriched = 0;
      let failed = 0;

      for (const prospect of prospectsToEnrich) {
        const result = await this.enrichProspect(prospect.id);
        results.push(result);
        
        if (result.success && result.emailFound) {
          enriched++;
        } else {
          failed++;
        }
        
        // Rate limiting: 1 request per second
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      logger.info(`EmailEnrichmentService: Bulk enrichment complete - ${enriched} enriched, ${failed} failed`);

      return {
        total: prospectsToEnrich.length,
        enriched,
        failed,
        results
      };
    } catch (error) {
      logger.error('EmailEnrichmentService: Error in bulk enrichment:', error);
      throw error;
    }
  }

  /**
   * Get enrichment statistics
   */
  async getEnrichmentStats(): Promise<{
    totalProspects: number;
    withEmail: number;
    withoutEmail: number;
    enrichmentRate: number;
  }> {
    const allProspects = await db.query.prospects.findMany();
    const withEmail = allProspects.filter(p => p.contactEmail).length;
    const withoutEmail = allProspects.filter(p => !p.contactEmail).length;

    return {
      totalProspects: allProspects.length,
      withEmail,
      withoutEmail,
      enrichmentRate: allProspects.length > 0 ? Math.round((withEmail / allProspects.length) * 100) : 0
    };
  }
}

export const emailEnrichmentService = new EmailEnrichmentService();

/**
 * Hunter.io Email Enrichment Service
 * 
 * Uses Hunter.io API to find professional email addresses for companies.
 * Supports both domain-based email finding and email verification.
 */

import { logger } from '../utils/logger';

const HUNTER_API_KEY = process.env.HUNTER_API_KEY;
const HUNTER_API_BASE = 'https://api.hunter.io/v2';

export interface HunterEmailResult {
  email: string | null;
  firstName?: string;
  lastName?: string;
  position?: string;
  confidence?: number;
  type?: string;
  source?: string;
}

export interface HunterDomainSearchResult {
  emails: Array<{
    value: string;
    type: string;
    confidence: number;
    firstName?: string;
    lastName?: string;
    position?: string;
  }>;
  pattern?: string;
  organization?: string;
}

export class HunterService {
  private apiKey: string;

  constructor() {
    if (!HUNTER_API_KEY) {
      logger.warn('HunterService: HUNTER_API_KEY not set - email enrichment will be disabled');
      this.apiKey = '';
    } else {
      this.apiKey = HUNTER_API_KEY;
      logger.info('HunterService: Initialized with API key');
    }
  }

  /**
   * Check if Hunter.io service is available
   */
  isAvailable(): boolean {
    return !!this.apiKey;
  }

  /**
   * Extract domain from company name
   */
  private extractDomain(companyName: string): string {
    // Clean up company name: remove Ltd, Limited, LLP, etc.
    let cleaned = companyName
      .toLowerCase()
      .replace(/\b(limited|ltd|llp|plc|holdings|group|company|co\.?)\b/gi, '')
      .replace(/[^a-z0-9\s]/g, '')
      .trim()
      .replace(/\s+/g, '');

    // Add .co.uk for UK companies
    return `${cleaned}.co.uk`;
  }

  /**
   * Find email addresses for a domain using Hunter.io Domain Search
   */
  async findEmailsByDomain(domain: string, companyName?: string): Promise<HunterDomainSearchResult> {
    if (!this.isAvailable()) {
      throw new Error('Hunter.io API key not configured');
    }

    try {
      const url = `${HUNTER_API_BASE}/domain-search?domain=${encodeURIComponent(domain)}&api_key=${this.apiKey}&limit=5`;
      
      logger.info(`HunterService: Searching emails for domain: ${domain}`);

      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) {
        logger.error(`HunterService: API error for ${domain}:`, data);
        throw new Error(data.errors?.[0]?.details || 'Hunter.io API error');
      }

      const emails = data.data?.emails || [];
      const pattern = data.data?.pattern;

      logger.info(`HunterService: Found ${emails.length} emails for ${domain}`);

      return {
        emails: emails.map((e: any) => ({
          value: e.value,
          type: e.type,
          confidence: e.confidence,
          firstName: e.first_name,
          lastName: e.last_name,
          position: e.position
        })),
        pattern,
        organization: data.data?.organization || companyName
      };
    } catch (error) {
      logger.error(`HunterService: Error finding emails for ${domain}:`, error);
      throw error;
    }
  }

  /**
   * Find the best email for a company (prioritize generic/info emails or highest confidence)
   */
  async findCompanyEmail(companyName: string, companyDomain?: string): Promise<HunterEmailResult> {
    if (!this.isAvailable()) {
      return { email: null };
    }

    try {
      const domain = companyDomain || this.extractDomain(companyName);
      const result = await this.findEmailsByDomain(domain, companyName);

      if (result.emails.length === 0) {
        logger.info(`HunterService: No emails found for ${companyName}`);
        return { email: null };
      }

      // Prioritize generic emails (info@, contact@, hello@, accounts@)
      const genericEmail = result.emails.find(e => 
        e.type === 'generic' || 
        e.value.startsWith('info@') || 
        e.value.startsWith('contact@') ||
        e.value.startsWith('hello@') ||
        e.value.startsWith('accounts@') ||
        e.value.startsWith('finance@')
      );

      if (genericEmail) {
        logger.info(`HunterService: Found generic email for ${companyName}: ${genericEmail.value}`);
        return {
          email: genericEmail.value,
          confidence: genericEmail.confidence,
          type: genericEmail.type
        };
      }

      // Otherwise, use highest confidence email
      const bestEmail = result.emails.reduce((best, current) => 
        current.confidence > best.confidence ? current : best
      );

      logger.info(`HunterService: Found best email for ${companyName}: ${bestEmail.value} (confidence: ${bestEmail.confidence})`);

      return {
        email: bestEmail.value,
        firstName: bestEmail.firstName,
        lastName: bestEmail.lastName,
        position: bestEmail.position,
        confidence: bestEmail.confidence,
        type: bestEmail.type
      };
    } catch (error) {
      logger.error(`HunterService: Error finding company email for ${companyName}:`, error);
      return { email: null };
    }
  }

  /**
   * Verify an email address
   */
  async verifyEmail(email: string): Promise<{ valid: boolean; score: number; }> {
    if (!this.isAvailable()) {
      throw new Error('Hunter.io API key not configured');
    }

    try {
      const url = `${HUNTER_API_BASE}/email-verifier?email=${encodeURIComponent(email)}&api_key=${this.apiKey}`;
      
      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.errors?.[0]?.details || 'Hunter.io API error');
      }

      const result = data.data;
      
      return {
        valid: result.status === 'valid',
        score: result.score || 0
      };
    } catch (error) {
      logger.error(`HunterService: Error verifying email ${email}:`, error);
      throw error;
    }
  }

  /**
   * Generate email patterns based on company domain
   */
  generateEmailPatterns(firstName: string, lastName: string, domain: string): string[] {
    const patterns = [
      `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${domain}`,
      `${firstName.toLowerCase()}@${domain}`,
      `${firstName.charAt(0).toLowerCase()}${lastName.toLowerCase()}@${domain}`,
      `${firstName.toLowerCase()}${lastName.charAt(0).toLowerCase()}@${domain}`,
      `info@${domain}`,
      `contact@${domain}`,
      `accounts@${domain}`,
      `finance@${domain}`
    ];

    return patterns;
  }
}

export const hunterService = new HunterService();

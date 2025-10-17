import { logger } from '../utils/logger';

const exaLogger = logger.withContext('ExaService');

export interface CompanyEnrichmentData {
  website?: string;
  description?: string;
  employeeCount?: number;
  estimatedRevenue?: string;
  fundingStage?: string;
  techStack?: string[];
  recentNews?: string[];
  socialProfiles?: {
    linkedin?: string;
    twitter?: string;
    facebook?: string;
  };
}

export interface DecisionMakerContact {
  name: string;
  title: string;
  email?: string;
  phone?: string;
  linkedinUrl?: string;
  confidence: number;
}

class ExaService {
  private apiKey: string;
  private baseUrl = 'https://api.exa.ai';

  constructor() {
    this.apiKey = process.env.EXA_API_KEY || '';
    if (!this.apiKey) {
      exaLogger.warn('EXA_API_KEY not configured');
    }
  }

  async enrichCompany(
    companyName: string,
    companyNumber: string
  ): Promise<CompanyEnrichmentData | null> {
    if (!this.apiKey) {
      exaLogger.warn('Cannot enrich company: EXA_API_KEY not configured');
      return null;
    }

    try {
      exaLogger.info('Enriching company', { companyName, companyNumber });

      // Step 1: Search for the company's website and basic information
      const searchQuery = `${companyName} UK company ${companyNumber}`;
      const searchResponse = await fetch(`${this.baseUrl}/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
        },
        body: JSON.stringify({
          query: searchQuery,
          type: 'neural',
          numResults: 5,
          category: 'company',
          useAutoprompt: true,
          contents: {
            text: true,
            summary: true,
          },
        }),
      });

      if (!searchResponse.ok) {
        const errorText = await searchResponse.text();
        exaLogger.error('Exa search failed', { status: searchResponse.status, error: errorText });
        return null;
      }

      const searchData = await searchResponse.json();
      
      if (!searchData.results || searchData.results.length === 0) {
        exaLogger.info('No results found for company', { companyName });
        return null;
      }

      // Extract the most relevant result (first one)
      const primaryResult = searchData.results[0];
      const website = primaryResult.url || '';

      // Step 2: Get detailed content about the company
      const enrichmentData: CompanyEnrichmentData = {
        website,
        description: primaryResult.summary || primaryResult.text?.substring(0, 500),
      };

      // Step 3: Search for company size and revenue information
      const sizeQuery = `${companyName} employees revenue funding`;
      const sizeResponse = await fetch(`${this.baseUrl}/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
        },
        body: JSON.stringify({
          query: sizeQuery,
          type: 'neural',
          numResults: 3,
          contents: {
            text: true,
          },
        }),
      });

      if (sizeResponse.ok) {
        const sizeData = await sizeResponse.json();
        if (sizeData.results && sizeData.results.length > 0) {
          // Parse size information from content
          const content = sizeData.results[0].text || '';
          enrichmentData.employeeCount = this.extractEmployeeCount(content);
          enrichmentData.estimatedRevenue = this.extractRevenue(content);
          enrichmentData.fundingStage = this.extractFundingStage(content);
        }
      }

      // Step 4: Find social profiles
      const socialQuery = `${companyName} linkedin twitter`;
      const socialResponse = await fetch(`${this.baseUrl}/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
        },
        body: JSON.stringify({
          query: socialQuery,
          type: 'neural',
          numResults: 5,
        }),
      });

      if (socialResponse.ok) {
        const socialData = await socialResponse.json();
        enrichmentData.socialProfiles = this.extractSocialProfiles(socialData.results || []);
      }

      // Step 5: Get recent news
      const newsQuery = `${companyName} news recent announcements`;
      const newsResponse = await fetch(`${this.baseUrl}/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
        },
        body: JSON.stringify({
          query: newsQuery,
          type: 'neural',
          numResults: 3,
          category: 'news',
          contents: {
            summary: true,
          },
        }),
      });

      if (newsResponse.ok) {
        const newsData = await newsResponse.json();
        enrichmentData.recentNews = (newsData.results || [])
          .map((r: any) => r.summary || r.title)
          .filter(Boolean)
          .slice(0, 5);
      }

      exaLogger.info('Company enrichment completed', { 
        companyName,
        hasWebsite: !!enrichmentData.website,
        hasDescription: !!enrichmentData.description,
      });

      return enrichmentData;

    } catch (error: any) {
      exaLogger.error('Error enriching company:', error);
      return null;
    }
  }

  async findDecisionMakers(
    companyName: string,
    companyWebsite?: string
  ): Promise<DecisionMakerContact[]> {
    if (!this.apiKey) {
      exaLogger.warn('Cannot find decision makers: EXA_API_KEY not configured');
      return [];
    }

    try {
      exaLogger.info('Finding decision makers', { companyName, companyWebsite });

      // Search for CFO, Finance Director, Managing Director
      const titles = ['CFO', 'Finance Director', 'Financial Director', 'Managing Director', 'CEO', 'Chief Financial Officer'];
      const searchQueries = titles.map(title => `${companyName} ${title}`);

      const contacts: DecisionMakerContact[] = [];

      // Search for each title
      for (const query of searchQueries) {
        const response = await fetch(`${this.baseUrl}/search`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': this.apiKey,
          },
          body: JSON.stringify({
            query,
            type: 'neural',
            numResults: 3,
            contents: {
              text: true,
            },
          }),
        });

        if (!response.ok) continue;

        const data = await response.json();
        
        // Extract contact information from results
        for (const result of data.results || []) {
          const extracted = this.extractContactInfo(result, companyName);
          if (extracted && !contacts.find(c => c.email === extracted.email || c.name === extracted.name)) {
            contacts.push(extracted);
          }
        }

        // Rate limiting: wait 500ms between requests
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      exaLogger.info('Decision makers found', { companyName, count: contacts.length });
      return contacts;

    } catch (error: any) {
      exaLogger.error('Error finding decision makers:', error);
      return [];
    }
  }

  private extractEmployeeCount(text: string): number | undefined {
    const patterns = [
      /(\d+[\d,]*)\s*employees/i,
      /team\s*of\s*(\d+[\d,]*)/i,
      /(\d+[\d,]*)\s*people/i,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        const count = parseInt(match[1].replace(/,/g, ''));
        if (!isNaN(count) && count > 0 && count < 1000000) {
          return count;
        }
      }
    }

    return undefined;
  }

  private extractRevenue(text: string): string | undefined {
    const patterns = [
      /£([\d.]+)\s*(million|m|billion|b)/i,
      /\$([\d.]+)\s*(million|m|billion|b)/i,
      /revenue\s*of\s*£([\d.]+)\s*(million|m|billion|b)?/i,
      /turnover\s*of\s*£([\d.]+)\s*(million|m|billion|b)?/i,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        return match[0];
      }
    }

    return undefined;
  }

  private extractFundingStage(text: string): string | undefined {
    const stages = ['Seed', 'Series A', 'Series B', 'Series C', 'Series D', 'Pre-seed', 'Bootstrapped', 'Public'];
    
    for (const stage of stages) {
      if (text.toLowerCase().includes(stage.toLowerCase())) {
        return stage;
      }
    }

    return undefined;
  }

  private extractSocialProfiles(results: any[]): CompanyEnrichmentData['socialProfiles'] {
    const profiles: CompanyEnrichmentData['socialProfiles'] = {};

    for (const result of results) {
      const url = result.url || '';
      if (url.includes('linkedin.com')) {
        profiles.linkedin = url;
      } else if (url.includes('twitter.com') || url.includes('x.com')) {
        profiles.twitter = url;
      } else if (url.includes('facebook.com')) {
        profiles.facebook = url;
      }
    }

    return profiles;
  }

  private extractContactInfo(result: any, companyName: string): DecisionMakerContact | null {
    const text = result.text || '';
    const url = result.url || '';

    // Extract name (simple heuristic - looks for capitalized words before title)
    const nameMatch = text.match(/([A-Z][a-z]+\s+[A-Z][a-z]+)\s*(?:is|,)?\s*(?:CFO|Finance Director|CEO|Managing Director)/i);
    const name = nameMatch ? nameMatch[1] : '';

    // Extract title
    const titleMatch = text.match(/(CFO|Finance Director|Financial Director|Managing Director|CEO|Chief Financial Officer)/i);
    const title = titleMatch ? titleMatch[1] : '';

    // Extract email
    const emailMatch = text.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/);
    const email = emailMatch ? emailMatch[1] : undefined;

    // LinkedIn URL
    const linkedinUrl = url.includes('linkedin.com') ? url : undefined;

    if (!name || !title) return null;

    // Confidence score based on available information
    let confidence = 40; // Base confidence
    if (email) confidence += 30;
    if (linkedinUrl) confidence += 20;
    if (text.toLowerCase().includes(companyName.toLowerCase())) confidence += 10;

    return {
      name,
      title,
      email,
      linkedinUrl,
      confidence,
    };
  }
}

export const exaService = new ExaService();

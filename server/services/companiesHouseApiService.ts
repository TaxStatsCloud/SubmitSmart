/**
 * Companies House API Service
 * 
 * Integrates with the official UK Companies House API to:
 * - Search for companies with upcoming filing deadlines
 * - Retrieve detailed company information
 * - Extract filing history and upcoming deadlines
 * - Support automated lead generation for the agent system
 * 
 * API Documentation: https://developer.company-information.service.gov.uk/
 */

interface CompaniesHouseCompany {
  company_number: string;
  company_name: string;
  company_status: string;
  date_of_creation?: string;
  sic_codes?: string[];
  type?: string;
}

interface CompaniesHouseFilingHistory {
  items?: Array<{
    type: string;
    date: string;
    description: string;
  }>;
}

interface CompaniesHouseProfile {
  company_number: string;
  company_name: string;
  company_status: string;
  date_of_creation: string;
  sic_codes?: string[];
  accounts?: {
    next_due?: string;
    next_made_up_to?: string;
    overdue?: boolean;
  };
  confirmation_statement?: {
    next_due?: string;
    next_made_up_to?: string;
    overdue?: boolean;
  };
}

export class CompaniesHouseApiService {
  private apiKey: string;
  private baseUrl = 'https://api.company-information.service.gov.uk';

  constructor() {
    const apiKey = process.env.COMPANIES_HOUSE_API_KEY;
    if (!apiKey) {
      throw new Error('COMPANIES_HOUSE_API_KEY environment variable is required');
    }
    // Companies House requires Basic authentication with API key as username and blank password
    // Format: Basic base64(apiKey:)
    this.apiKey = `Basic ${Buffer.from(`${apiKey}:`).toString('base64')}`;
  }

  /**
   * Search for companies by query
   */
  async searchCompanies(query: string, itemsPerPage: number = 20): Promise<{
    companies: CompaniesHouseCompany[];
    totalResults: number;
  }> {
    try {
      const url = `${this.baseUrl}/search/companies?q=${encodeURIComponent(query)}&items_per_page=${itemsPerPage}`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': this.apiKey,
        },
      });

      if (!response.ok) {
        throw new Error(`Companies House API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        companies: data.items || [],
        totalResults: data.total_results || 0
      };
    } catch (error) {
      console.error('Error searching companies:', error);
      throw error;
    }
  }

  /**
   * Get detailed company profile including filing deadlines
   */
  async getCompanyProfile(companyNumber: string): Promise<CompaniesHouseProfile | null> {
    try {
      const url = `${this.baseUrl}/company/${companyNumber}`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': this.apiKey,
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`Companies House API error: ${response.status} ${response.statusText}`);
      }

      const profile = await response.json();
      return profile;
    } catch (error) {
      console.error(`Error fetching company ${companyNumber}:`, error);
      throw error;
    }
  }

  /**
   * Calculate lead score based on filing deadline proximity and company characteristics
   * Score: 0-100 (higher = more urgent/valuable lead)
   */
  calculateLeadScore(profile: CompaniesHouseProfile): number {
    let score = 0;

    // Base score for active companies
    if (profile.company_status === 'active') {
      score += 30;
    }

    // Score based on accounts deadline proximity (max 40 points)
    if (profile.accounts?.next_due) {
      const daysUntilDue = this.getDaysUntilDate(profile.accounts.next_due);
      
      if (daysUntilDue <= 30) {
        score += 40; // Very urgent
      } else if (daysUntilDue <= 60) {
        score += 30; // Urgent
      } else if (daysUntilDue <= 90) {
        score += 20; // Moderate
      } else if (daysUntilDue <= 120) {
        score += 10; // Low urgency
      }
    }

    // Score based on confirmation statement deadline (max 20 points)
    if (profile.confirmation_statement?.next_due) {
      const daysUntilDue = this.getDaysUntilDate(profile.confirmation_statement.next_due);
      
      if (daysUntilDue <= 30) {
        score += 20;
      } else if (daysUntilDue <= 60) {
        score += 15;
      } else if (daysUntilDue <= 90) {
        score += 10;
      }
    }

    // Bonus for overdue filings (high priority)
    if (profile.accounts?.overdue || profile.confirmation_statement?.overdue) {
      score += 10;
    }

    return Math.min(score, 100);
  }

  /**
   * Determine entity size based on company type and SIC codes
   * This is a heuristic - actual size requires financial data
   */
  determineEntitySize(profile: CompaniesHouseProfile): string {
    // Default to micro for most small companies
    // Actual classification requires turnover, balance sheet, employee data
    return 'micro';
  }

  /**
   * Get companies with upcoming deadlines within specified days
   */
  async getCompaniesWithUpcomingDeadlines(
    searchQuery: string,
    daysAhead: number = 90,
    maxResults: number = 50
  ): Promise<Array<{
    profile: CompaniesHouseProfile;
    leadScore: number;
    entitySize: string;
  }>> {
    const searchResults = await this.searchCompanies(searchQuery, maxResults);
    const companiesWithDeadlines: Array<{
      profile: CompaniesHouseProfile;
      leadScore: number;
      entitySize: string;
    }> = [];

    for (const company of searchResults.companies) {
      try {
        const profile = await this.getCompanyProfile(company.company_number);
        
        if (!profile || profile.company_status !== 'active') {
          continue;
        }

        // Check if company has upcoming deadlines
        const hasUpcomingAccountsDeadline = profile.accounts?.next_due && 
          this.getDaysUntilDate(profile.accounts.next_due) <= daysAhead;
        
        const hasUpcomingCSDeadline = profile.confirmation_statement?.next_due && 
          this.getDaysUntilDate(profile.confirmation_statement.next_due) <= daysAhead;

        if (hasUpcomingAccountsDeadline || hasUpcomingCSDeadline) {
          const leadScore = this.calculateLeadScore(profile);
          const entitySize = this.determineEntitySize(profile);
          
          companiesWithDeadlines.push({
            profile,
            leadScore,
            entitySize
          });
        }

        // Rate limiting - avoid hitting API too fast
        await this.sleep(100);
      } catch (error) {
        console.error(`Error processing company ${company.company_number}:`, error);
        continue;
      }
    }

    // Sort by lead score (highest first)
    return companiesWithDeadlines.sort((a, b) => b.leadScore - a.leadScore);
  }

  /**
   * Calculate days until a date
   */
  private getDaysUntilDate(dateString: string): number {
    const targetDate = new Date(dateString);
    const today = new Date();
    const diffTime = targetDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  /**
   * Sleep utility for rate limiting
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const companiesHouseApiService = new CompaniesHouseApiService();

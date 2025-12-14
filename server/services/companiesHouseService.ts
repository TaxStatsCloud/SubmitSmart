import https from 'https';

export interface CompanyInfo {
  company_name: string;
  company_number: string;
  company_status: string;
  type: string;
  date_of_creation: string;
  date_of_cessation?: string;
  registered_office_address: {
    address_line_1?: string;
    address_line_2?: string;
    locality?: string;
    region?: string;
    postal_code?: string;
    country?: string;
  };
  sic_codes?: string[];
  accounts?: {
    accounting_reference_date?: {
      day: string;
      month: string;
    };
    last_accounts?: {
      made_up_to?: string;
      type?: string;
    };
    next_due?: string;
    next_made_up_to?: string;
  };
  confirmation_statement?: {
    last_made_up_to?: string;
    next_due?: string;
    next_made_up_to?: string;
  };
}

export interface FilingHistory {
  items: Array<{
    category: string;
    description: string;
    date: string;
    transaction_id: string;
    type: string;
    links?: {
      self: string;
      document_metadata?: string;
    };
  }>;
  total_count: number;
}

export interface CompaniesHouseError {
  error: string;
  type: string;
}

class CompaniesHouseService {
  private apiKey: string;
  private baseUrl = 'https://api.company-information.service.gov.uk';

  constructor() {
    this.apiKey = process.env.COMPANIES_HOUSE_API_KEY || '';
    if (!this.apiKey) {
      console.warn('COMPANIES_HOUSE_API_KEY environment variable not set - Companies House API features will be disabled');
      this.apiKey = 'disabled'; // Allow service to instantiate but fail gracefully
    }
  }

  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Make HTTP request with retry logic and exponential backoff
   */
  private async makeRequest(path: string, retries: number = 3): Promise<any> {
    if (this.apiKey === 'disabled') {
      throw new Error('Companies House API is disabled - API key not provided');
    }

    const makeAttempt = (): Promise<any> => {
      return new Promise((resolve, reject) => {
        const options = {
          hostname: 'api.company-information.service.gov.uk',
          port: 443,
          path,
          method: 'GET',
          headers: {
            'Authorization': `Basic ${Buffer.from(this.apiKey + ':').toString('base64')}`,
            'Accept': 'application/json',
            'User-Agent': 'PromptSubmissions/1.0'
          }
        };

        const req = https.request(options, (res) => {
          let data = '';
          res.on('data', (chunk) => {
            data += chunk;
          });

          res.on('end', () => {
            try {
              const parsed = JSON.parse(data);
              if (res.statusCode === 200) {
                resolve(parsed);
              } else {
                reject({
                  status: res.statusCode,
                  error: parsed,
                  message: parsed.error || 'Unknown error',
                  retryable: res.statusCode === 429 || res.statusCode === 503 || res.statusCode === 502
                });
              }
            } catch (error) {
              reject({
                status: res.statusCode,
                error: 'Invalid JSON response',
                message: data,
                retryable: false
              });
            }
          });
        });

        req.on('error', (error) => {
          reject({
            status: 0,
            error: 'Connection error',
            message: error.message,
            retryable: true // Network errors are retryable
          });
        });

        req.setTimeout(15000, () => {
          req.destroy();
          reject({
            status: 0,
            error: 'Request timeout',
            message: 'Request timed out after 15 seconds',
            retryable: true // Timeouts are retryable
          });
        });

        req.end();
      });
    };

    // Attempt with exponential backoff retry
    let lastError: any;
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await makeAttempt();
      } catch (error: any) {
        lastError = error;

        // Don't retry non-retryable errors (404, 400, etc.)
        if (!error.retryable) {
          throw error;
        }

        // Don't retry if we've exhausted all attempts
        if (attempt === retries) {
          console.error(`[Companies House] All ${retries + 1} attempts failed for ${path}`);
          throw error;
        }

        // Exponential backoff: 1s, 2s, 4s
        const delay = Math.pow(2, attempt) * 1000;
        console.log(`[Companies House] Attempt ${attempt + 1} failed, retrying in ${delay}ms...`);
        await this.sleep(delay);
      }
    }

    throw lastError;
  }

  async getCompanyInfo(companyNumber: string): Promise<CompanyInfo> {
    const path = `/company/${companyNumber.padStart(8, '0')}`;
    return this.makeRequest(path);
  }

  async getFilingHistory(companyNumber: string, itemsPerPage: number = 35): Promise<FilingHistory> {
    const path = `/company/${companyNumber.padStart(8, '0')}/filing-history?items_per_page=${itemsPerPage}`;
    return this.makeRequest(path);
  }

  async getOfficers(companyNumber: string): Promise<any> {
    const path = `/company/${companyNumber.padStart(8, '0')}/officers`;
    return this.makeRequest(path);
  }

  async searchCompanies(query: string, itemsPerPage: number = 20): Promise<any> {
    const encodedQuery = encodeURIComponent(query);
    const path = `/search/companies?q=${encodedQuery}&items_per_page=${itemsPerPage}`;
    return this.makeRequest(path);
  }

  async getCompanyProfile(companyNumber: string): Promise<any> {
    const path = `/company/${companyNumber.padStart(8, '0')}`;
    return this.makeRequest(path);
  }

  // Check if company is eligible for specific filing types
  async checkFilingEligibility(companyNumber: string): Promise<{
    canFileConfirmationStatement: boolean;
    canFileAnnualAccounts: boolean;
    canFileCorporationTax: boolean;
    reasons: string[];
  }> {
    try {
      const company = await this.getCompanyInfo(companyNumber);
      const reasons: string[] = [];
      
      const canFileConfirmationStatement = company.company_status === 'active';
      const canFileAnnualAccounts = company.company_status === 'active';
      const canFileCorporationTax = ['active', 'dissolved'].includes(company.company_status);
      
      if (company.company_status === 'dissolved') {
        reasons.push('Company is dissolved - only final corporation tax returns may be filed');
      }
      
      if (company.company_status === 'liquidation') {
        reasons.push('Company is in liquidation - special filing requirements apply');
      }
      
      return {
        canFileConfirmationStatement,
        canFileAnnualAccounts,
        canFileCorporationTax,
        reasons
      };
    } catch (error) {
      throw new Error(`Failed to check filing eligibility: ${error.message}`);
    }
  }

  // Get next filing deadlines
  async getFilingDeadlines(companyNumber: string): Promise<{
    confirmationStatement?: string;
    annualAccounts?: string;
    corporationTax?: string;
  }> {
    try {
      const company = await this.getCompanyInfo(companyNumber);
      const deadlines: any = {};
      
      if (company.confirmation_statement?.next_due) {
        deadlines.confirmationStatement = company.confirmation_statement.next_due;
      }
      
      if (company.accounts?.next_due) {
        deadlines.annualAccounts = company.accounts.next_due;
      }
      
      // Corporation tax deadline is typically 12 months after accounting period end
      if (company.accounts?.next_made_up_to) {
        const accountingDate = new Date(company.accounts.next_made_up_to);
        accountingDate.setFullYear(accountingDate.getFullYear() + 1);
        deadlines.corporationTax = accountingDate.toISOString().split('T')[0];
      }
      
      return deadlines;
    } catch (error) {
      throw new Error(`Failed to get filing deadlines: ${error.message}`);
    }
  }

  // Get rate limit information
  getRateLimitInfo(): {
    limit: number;
    window: string;
    description: string;
  } {
    return {
      limit: 600,
      window: '5 minutes',
      description: 'Companies House API allows 600 requests per 5-minute window'
    };
  }
}

export const companiesHouseService = new CompaniesHouseService();
export default companiesHouseService;
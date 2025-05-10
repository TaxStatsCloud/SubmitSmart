import { apiRequest } from "./queryClient";

/**
 * Interface for company search results
 */
interface CompanySearchResult {
  companyNumber: string;
  companyName: string;
  companyStatus: string;
  companyType: string;
  incorporationDate: string;
  address: {
    addressLine1?: string;
    addressLine2?: string;
    locality?: string;
    postalCode?: string;
    country?: string;
  };
}

/**
 * Interface for company filing history items
 */
interface FilingHistoryItem {
  transactionId: string;
  category: string;
  description: string;
  date: string;
  links?: {
    document_metadata?: string;
    self?: string;
  };
  filingType?: string;
  status?: string;
}

/**
 * Interface for company officers
 */
interface CompanyOfficer {
  name: string;
  officerRole: string;
  appointedOn: string;
  dateOfBirth?: {
    month: number;
    year: number;
  };
  address?: {
    addressLine1?: string;
    addressLine2?: string;
    locality?: string;
    postalCode?: string;
    country?: string;
  };
}

/**
 * Searches Companies House by company name
 * @param query The company name to search for
 * @param itemsPerPage Number of results per page (default: 20)
 * @param startIndex Starting index for pagination (default: 0)
 * @returns Search results for companies matching the query
 */
export async function searchCompany(
  query: string,
  itemsPerPage: number = 20,
  startIndex: number = 0
): Promise<{ items: CompanySearchResult[], totalResults: number }> {
  try {
    const response = await apiRequest(
      'GET',
      `/api/companies-house/search?q=${encodeURIComponent(query)}&items_per_page=${itemsPerPage}&start_index=${startIndex}`
    );
    return response.json();
  } catch (error) {
    console.error('Error searching companies:', error);
    throw error;
  }
}

/**
 * Gets company details by company number
 * @param companyNumber The Companies House company number
 * @returns Detailed company information
 */
export async function getCompanyDetails(companyNumber: string) {
  try {
    const response = await apiRequest('GET', `/api/companies-house/company/${companyNumber}`);
    return response.json();
  } catch (error) {
    console.error('Error getting company details:', error);
    throw error;
  }
}

/**
 * Gets filing history for a company
 * @param companyNumber The Companies House company number
 * @param itemsPerPage Number of results per page (default: 20)
 * @param startIndex Starting index for pagination (default: 0)
 * @returns Filing history items for the company
 */
export async function getFilingHistory(
  companyNumber: string,
  itemsPerPage: number = 20,
  startIndex: number = 0
): Promise<{ items: FilingHistoryItem[], totalCount: number }> {
  try {
    const response = await apiRequest(
      'GET',
      `/api/companies-house/company/${companyNumber}/filing-history?items_per_page=${itemsPerPage}&start_index=${startIndex}`
    );
    return response.json();
  } catch (error) {
    console.error('Error getting filing history:', error);
    throw error;
  }
}

/**
 * Gets officers (directors, secretaries) for a company
 * @param companyNumber The Companies House company number
 * @param itemsPerPage Number of results per page (default: 20)
 * @param startIndex Starting index for pagination (default: 0)
 * @returns Company officers
 */
export async function getCompanyOfficers(
  companyNumber: string,
  itemsPerPage: number = 20,
  startIndex: number = 0
): Promise<{ items: CompanyOfficer[], totalResults: number }> {
  try {
    const response = await apiRequest(
      'GET',
      `/api/companies-house/company/${companyNumber}/officers?items_per_page=${itemsPerPage}&start_index=${startIndex}`
    );
    return response.json();
  } catch (error) {
    console.error('Error getting company officers:', error);
    throw error;
  }
}

/**
 * Prepares a confirmation statement for filing
 * @param companyNumber The Companies House company number
 * @returns Draft confirmation statement data
 */
export async function prepareConfirmationStatement(companyNumber: string) {
  try {
    const response = await apiRequest(
      'GET',
      `/api/companies-house/company/${companyNumber}/confirmation-statement`
    );
    return response.json();
  } catch (error) {
    console.error('Error preparing confirmation statement:', error);
    throw error;
  }
}

/**
 * Submits a confirmation statement to Companies House
 * @param companyNumber The Companies House company number
 * @param statementData The confirmation statement data to submit
 * @returns Submission response
 */
export async function submitConfirmationStatement(companyNumber: string, statementData: any) {
  try {
    const response = await apiRequest(
      'POST',
      `/api/companies-house/company/${companyNumber}/confirmation-statement`,
      statementData
    );
    return response.json();
  } catch (error) {
    console.error('Error submitting confirmation statement:', error);
    throw error;
  }
}

/**
 * Gets filing deadlines for a company
 * @param companyNumber The Companies House company number
 * @returns Company filing deadlines
 */
export async function getFilingDeadlines(companyNumber: string) {
  try {
    const response = await apiRequest(
      'GET',
      `/api/companies-house/company/${companyNumber}/filing-deadlines`
    );
    return response.json();
  } catch (error) {
    console.error('Error getting filing deadlines:', error);
    throw error;
  }
}

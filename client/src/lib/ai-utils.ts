import { apiRequest } from "./queryClient";

/**
 * Analyzes a document for financial data extraction
 * @param documentId The ID of the document to analyze
 * @returns Structured financial data extracted from the document
 */
export async function analyzeDocument(documentId: number) {
  try {
    const response = await apiRequest('POST', `/api/ai/analyze-document/${documentId}`);
    return response.json();
  } catch (error) {
    console.error('Error analyzing document:', error);
    throw error;
  }
}

/**
 * Generates a draft filing based on document analysis and filing type
 * @param filingType The type of filing to generate (confirmation_statement, annual_accounts, corporation_tax)
 * @param documentIds Array of document IDs to use for the filing
 * @param companyId The ID of the company for which the filing is being generated
 * @returns A draft filing object containing the generated content
 */
export async function generateDraftFiling(
  filingType: string, 
  documentIds: number[], 
  companyId: number
) {
  try {
    const response = await apiRequest('POST', '/api/ai/generate-filing', {
      filingType,
      documentIds,
      companyId
    });
    return response.json();
  } catch (error) {
    console.error('Error generating draft filing:', error);
    throw error;
  }
}

/**
 * Validates a filing for compliance with UK standards
 * @param filingId The ID of the filing to validate
 * @returns Validation results including any compliance issues
 */
export async function validateFiling(filingId: number) {
  try {
    const response = await apiRequest('POST', `/api/ai/validate-filing/${filingId}`);
    return response.json();
  } catch (error) {
    console.error('Error validating filing:', error);
    throw error;
  }
}

/**
 * Gets a financial terminology explanation
 * @param term The financial term to explain
 * @returns An explanation of the term in plain English
 */
export async function explainFinancialTerm(term: string) {
  try {
    const response = await apiRequest('POST', '/api/ai/explain-term', { term });
    return response.json();
  } catch (error) {
    console.error('Error explaining term:', error);
    throw error;
  }
}

/**
 * Identifies inconsistencies or errors in filing data
 * @param filingId The ID of the filing to check
 * @returns Array of identified issues with explanations
 */
export async function identifyFilingIssues(filingId: number) {
  try {
    const response = await apiRequest('POST', `/api/ai/identify-issues/${filingId}`);
    return response.json();
  } catch (error) {
    console.error('Error identifying filing issues:', error);
    throw error;
  }
}

/**
 * Analyzes a trial balance to generate accounts
 * @param documentId The ID of the trial balance document
 * @param accountingStandard The accounting standard to use ('UK_GAAP' or 'IFRS')
 * @param entitySize The size of the entity ('small', 'medium', 'micro')
 * @returns Generated draft accounts
 */
export async function generateAccountsFromTrialBalance(
  documentId: number,
  accountingStandard: 'UK_GAAP' | 'IFRS',
  entitySize: 'small' | 'medium' | 'micro'
) {
  try {
    const response = await apiRequest('POST', '/api/ai/generate-accounts', {
      documentId,
      accountingStandard,
      entitySize
    });
    return response.json();
  } catch (error) {
    console.error('Error generating accounts:', error);
    throw error;
  }
}

/**
 * Generates a Corporation Tax computation based on financial data
 * @param filingId The ID of the annual accounts filing
 * @returns Generated corporation tax computation and CT600 form data
 */
export async function generateCorporationTaxComputation(filingId: number) {
  try {
    const response = await apiRequest('POST', `/api/ai/generate-ct-computation/${filingId}`);
    return response.json();
  } catch (error) {
    console.error('Error generating CT computation:', error);
    throw error;
  }
}

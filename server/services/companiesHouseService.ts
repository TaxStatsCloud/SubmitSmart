/**
 * Companies House API service
 * Provides functions to interact with the Companies House API
 */

/**
 * Search for companies by name
 * @param query Search query
 * @param itemsPerPage Number of results per page
 * @param startIndex Starting index for pagination
 * @returns Search results
 */
export async function searchCompanies(
  query: string,
  itemsPerPage: number = 20,
  startIndex: number = 0
) {
  // In a real implementation, this would call the Companies House API
  // For now, return sample data based on the query
  
  const sampleCompanies = [
    {
      companyNumber: '12345678',
      companyName: 'Acme Trading Ltd',
      companyStatus: 'active',
      companyType: 'ltd',
      incorporationDate: '2015-06-10',
      address: {
        addressLine1: '123 Business Street',
        locality: 'London',
        postalCode: 'EC1A 1BB',
        country: 'United Kingdom'
      }
    },
    {
      companyNumber: '87654321',
      companyName: 'Bright Innovations Ltd',
      companyStatus: 'active',
      companyType: 'ltd',
      incorporationDate: '2018-03-22',
      address: {
        addressLine1: '456 Tech Avenue',
        locality: 'Manchester',
        postalCode: 'M1 1AA',
        country: 'United Kingdom'
      }
    },
    {
      companyNumber: '11223344',
      companyName: 'Global Services Ltd',
      companyStatus: 'active',
      companyType: 'ltd',
      incorporationDate: '2017-09-15',
      address: {
        addressLine1: '789 Corporate Road',
        locality: 'Birmingham',
        postalCode: 'B1 1BB',
        country: 'United Kingdom'
      }
    }
  ];
  
  // Filter companies based on query
  const filteredCompanies = sampleCompanies.filter(company => 
    company.companyName.toLowerCase().includes(query.toLowerCase())
  );
  
  // Apply pagination
  const paginatedResults = filteredCompanies.slice(
    startIndex,
    startIndex + itemsPerPage
  );
  
  return {
    items: paginatedResults,
    totalResults: filteredCompanies.length,
    itemsPerPage,
    startIndex
  };
}

/**
 * Get company profile by company number
 * @param companyNumber Companies House company number
 * @returns Company profile data
 */
export async function getCompanyProfile(companyNumber: string) {
  // In a real implementation, this would call the Companies House API
  // For now, return sample data based on the company number
  
  const sampleCompanies = {
    '12345678': {
      companyNumber: '12345678',
      companyName: 'Acme Trading Ltd',
      type: 'private-limited-company',
      status: 'active',
      incorporationDate: '2015-06-10',
      registeredOfficeAddress: {
        addressLine1: '123 Business Street',
        locality: 'London',
        postalCode: 'EC1A 1BB',
        country: 'United Kingdom'
      },
      sicCodes: ['62020', '62090'],
      accounts: {
        nextDue: '2023-09-30',
        lastMadeUpTo: '2022-12-31',
        accountingReferenceDate: {
          day: '31',
          month: '12'
        }
      },
      confirmationStatement: {
        nextDue: '2023-08-15',
        lastMadeUpTo: '2022-08-01'
      },
      hasInsolvencyHistory: false,
      hasCharges: false,
      canFile: true
    },
    '87654321': {
      companyNumber: '87654321',
      companyName: 'Bright Innovations Ltd',
      type: 'private-limited-company',
      status: 'active',
      incorporationDate: '2018-03-22',
      registeredOfficeAddress: {
        addressLine1: '456 Tech Avenue',
        locality: 'Manchester',
        postalCode: 'M1 1AA',
        country: 'United Kingdom'
      },
      sicCodes: ['62020', '62012'],
      accounts: {
        nextDue: '2023-12-31',
        lastMadeUpTo: '2022-03-31',
        accountingReferenceDate: {
          day: '31',
          month: '3'
        }
      },
      confirmationStatement: {
        nextDue: '2023-09-30',
        lastMadeUpTo: '2022-09-15'
      },
      hasInsolvencyHistory: false,
      hasCharges: false,
      canFile: true
    },
    '11223344': {
      companyNumber: '11223344',
      companyName: 'Global Services Ltd',
      type: 'private-limited-company',
      status: 'active',
      incorporationDate: '2017-09-15',
      registeredOfficeAddress: {
        addressLine1: '789 Corporate Road',
        locality: 'Birmingham',
        postalCode: 'B1 1BB',
        country: 'United Kingdom'
      },
      sicCodes: ['62020', '70229'],
      accounts: {
        nextDue: '2023-06-30',
        lastMadeUpTo: '2022-09-30',
        accountingReferenceDate: {
          day: '30',
          month: '9'
        }
      },
      confirmationStatement: {
        nextDue: '2023-11-12',
        lastMadeUpTo: '2022-11-01'
      },
      hasInsolvencyHistory: false,
      hasCharges: true,
      canFile: true
    }
  };
  
  const company = sampleCompanies[companyNumber as keyof typeof sampleCompanies];
  
  if (!company) {
    throw new Error(`Company ${companyNumber} not found`);
  }
  
  return company;
}

/**
 * Get filing history for a company
 * @param companyNumber Companies House company number
 * @param itemsPerPage Number of results per page
 * @param startIndex Starting index for pagination
 * @returns Filing history items
 */
export async function getFilingHistory(
  companyNumber: string,
  itemsPerPage: number = 20,
  startIndex: number = 0
) {
  // In a real implementation, this would call the Companies House API
  // For now, return sample data based on the company number
  
  const sampleFilingHistory = [
    {
      transactionId: 'MzMxMjM2NjgzOGFkaXF6a2N4',
      category: 'accounts',
      description: 'accounts-with-accounts-type-total-exemption-small',
      date: '2022-05-15',
      links: {
        document_metadata: '/document/MzMxMjM2NjgzOGFkaXF6a2N4',
        self: '/company/12345678/filing-history/MzMxMjM2NjgzOGFkaXF6a2N4'
      },
      filingType: 'AA',
      status: 'accepted'
    },
    {
      transactionId: 'MzMxMjM2YTNiOWVkaXF6a2N4',
      category: 'confirmation-statement',
      description: 'confirmation-statement-with-updates',
      date: '2022-08-01',
      links: {
        document_metadata: '/document/MzMxMjM2YTNiOWVkaXF6a2N4',
        self: '/company/12345678/filing-history/MzMxMjM2YTNiOWVkaXF6a2N4'
      },
      filingType: 'CS01',
      status: 'accepted'
    },
    {
      transactionId: 'MzMxMjM2Y2I1MmVkaXF6a2N4',
      category: 'officers',
      description: 'appoint-person-director',
      date: '2021-09-10',
      links: {
        document_metadata: '/document/MzMxMjM2Y2I1MmVkaXF6a2N4',
        self: '/company/12345678/filing-history/MzMxMjM2Y2I1MmVkaXF6a2N4'
      },
      filingType: 'AP01',
      status: 'accepted'
    }
  ];
  
  // Apply pagination
  const paginatedResults = sampleFilingHistory.slice(
    startIndex,
    startIndex + itemsPerPage
  );
  
  return {
    items: paginatedResults,
    totalCount: sampleFilingHistory.length,
    itemsPerPage,
    startIndex
  };
}

/**
 * Get filing deadlines for a company
 * @param companyNumber Companies House company number
 * @returns Filing deadlines for the company
 */
export async function getFilingDeadlines(companyNumber: string) {
  // In a real implementation, this would calculate deadlines based on
  // company profile information from the Companies House API
  
  // Get company profile to use incorporation date and other details
  const company = await getCompanyProfile(companyNumber);
  
  return {
    confirmationStatement: {
      dueDate: company.confirmationStatement.nextDue,
      periodEndDate: company.confirmationStatement.lastMadeUpTo,
      status: new Date(company.confirmationStatement.nextDue) < new Date() ? 'overdue' : 'upcoming'
    },
    accounts: {
      dueDate: company.accounts.nextDue,
      periodEndDate: company.accounts.lastMadeUpTo,
      status: new Date(company.accounts.nextDue) < new Date() ? 'overdue' : 'upcoming'
    },
    corporationTax: {
      // Corporation Tax is typically due 12 months after the end of the accounting period
      dueDate: addMonths(new Date(company.accounts.lastMadeUpTo), 12).toISOString().split('T')[0],
      periodEndDate: company.accounts.lastMadeUpTo,
      status: 'upcoming'
    }
  };
}

/**
 * Add months to a date
 * @param date Date to add months to
 * @param months Number of months to add
 * @returns New date with added months
 */
function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

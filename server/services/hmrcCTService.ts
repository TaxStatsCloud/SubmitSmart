import { XMLBuilder, XMLParser } from 'fast-xml-parser';
import fetch from 'node-fetch';
import { APP_CONFIG } from '@shared/constants';

/**
 * HMRC Corporation Tax API Service
 * Handles XML submission and polling for CT600 returns
 * 
 * Official HMRC Test Credentials:
 * - Vendor ID: 9233
 * - Sender ID: CTUser100
 * - Test UTR: 8596148860
 */

export class HMRCCTService {
  private readonly vendorId = APP_CONFIG.HMRC.VENDOR_ID;
  private readonly testSenderID = APP_CONFIG.HMRC.TEST_SENDER_ID;
  private readonly testUTR = APP_CONFIG.HMRC.TEST_UTR;
  
  // Test environment endpoints
  private readonly testSubmissionEndpoint = APP_CONFIG.HMRC.ENDPOINTS.TEST_SUBMISSION;
  private readonly testPollingEndpoint = APP_CONFIG.HMRC.ENDPOINTS.TEST_POLLING;
  
  private xmlBuilder: XMLBuilder;
  private xmlParser: XMLParser;

  constructor() {
    this.xmlBuilder = new XMLBuilder({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      format: true,
      suppressEmptyNode: true
    });

    this.xmlParser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      parseAttributeValue: true
    });
  }

  /**
   * Generate CT600 XML submission for HMRC
   */
  async generateCT600XML(corporationTaxData: any): Promise<string> {
    const submissionData = {
      '?xml': {
        '@_version': '1.0',
        '@_encoding': 'UTF-8'
      },
      'IRenvelope': {
        '@_xmlns': 'http://www.govtalk.gov.uk/taxation/CT/envelope',
        '@_xmlns:ct': 'http://www.govtalk.gov.uk/taxation/CT/ct',
        
        'IRheader': {
          'Keys': {
            'Key': {
              '@_Type': 'UTR',
              '#text': this.testUTR
            }
          },
          'PeriodEnd': corporationTaxData.accountingPeriodEnd,
          'DefaultCurrency': 'GBP',
          'IRmark': {
            '@_Type': 'generic',
            '#text': 'HMRC-CT-1.0'
          },
          'Sender': {
            'SenderID': this.testSenderID,
            'Password': 'password1', // From HMRC test credentials
            'Vendor': {
              'VendorID': this.vendorId,
              'VendorName': 'PromptSubmissions'
            }
          }
        },
        
        'IRbody': {
          'ct:CT600': {
            '@_xmlns:ct': 'http://www.govtalk.gov.uk/taxation/CT/ct',
            
            // Company details
            'ct:CompanyDetails': {
              'ct:CompanyName': corporationTaxData.companyName,
              'ct:CompanyRegistrationNumber': corporationTaxData.companyNumber,
              'ct:CompanyUTR': this.testUTR,
              'ct:CompanyAddress': {
                'ct:AddressLine1': corporationTaxData.address.line1,
                'ct:AddressLine2': corporationTaxData.address.line2,
                'ct:Postcode': corporationTaxData.address.postcode,
                'ct:Country': corporationTaxData.address.country || 'GB'
              }
            },
            
            // Accounting period
            'ct:AccountingPeriod': {
              'ct:PeriodStart': corporationTaxData.accountingPeriodStart,
              'ct:PeriodEnd': corporationTaxData.accountingPeriodEnd
            },
            
            // Financial data
            'ct:FinancialData': {
              'ct:TurnoverTotal': this.formatCurrency(corporationTaxData.turnover || 0),
              'ct:TotalProfit': this.formatCurrency(corporationTaxData.profit || 0),
              'ct:TaxableProfit': this.formatCurrency(corporationTaxData.taxableProfit || 0),
              'ct:CorporationTaxDue': this.formatCurrency(corporationTaxData.corporationTaxDue || 0),
              'ct:TaxPaid': this.formatCurrency(corporationTaxData.taxPaid || 0),
              'ct:TaxBalance': this.formatCurrency(corporationTaxData.taxBalance || 0)
            },
            
            // Computations
            'ct:Computations': {
              'ct:ProfitLossAccount': {
                'ct:TurnoverRevenue': this.formatCurrency(corporationTaxData.turnover || 0),
                'ct:CostOfSales': this.formatCurrency(corporationTaxData.costOfSales || 0),
                'ct:GrossProfit': this.formatCurrency(corporationTaxData.grossProfit || 0),
                'ct:AdministrativeExpenses': this.formatCurrency(corporationTaxData.administrativeExpenses || 0),
                'ct:OperatingProfit': this.formatCurrency(corporationTaxData.operatingProfit || 0),
                'ct:NetProfit': this.formatCurrency(corporationTaxData.profit || 0)
              },
              'ct:TaxComputation': {
                'ct:AccountingProfit': this.formatCurrency(corporationTaxData.profit || 0),
                'ct:Adjustments': this.formatCurrency(corporationTaxData.adjustments || 0),
                'ct:TaxableProfit': this.formatCurrency(corporationTaxData.taxableProfit || 0),
                'ct:CorporationTaxRate': corporationTaxData.taxRate || 19,
                'ct:CorporationTaxDue': this.formatCurrency(corporationTaxData.corporationTaxDue || 0)
              }
            },
            
            // Declaration
            'ct:Declaration': {
              'ct:AuthorizedPerson': corporationTaxData.authorizedPerson || 'Director',
              'ct:DeclarationDate': new Date().toISOString().split('T')[0],
              'ct:DeclarationText': 'The information given in this return is correct and complete to the best of my knowledge and belief.'
            }
          }
        }
      }
    };

    return this.xmlBuilder.build(submissionData);
  }

  /**
   * Submit CT600 return to HMRC test environment
   */
  async submitCT600(xmlData: string): Promise<{
    success: boolean;
    correlationId?: string;
    pollUrl?: string;
    error?: string;
  }> {
    try {
      const response = await fetch(this.testSubmissionEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/xml',
          'SOAPAction': 'urn:submitCT600',
          'X-Vendor-ID': this.vendorId,
          'X-Sender-ID': this.testSenderID
        },
        body: xmlData
      });

      if (response.ok) {
        const responseText = await response.text();
        const parsedResponse = this.xmlParser.parse(responseText);
        
        // Extract correlation ID for polling
        const correlationId = parsedResponse?.IRenvelope?.IRheader?.CorrelationID;
        
        return {
          success: true,
          correlationId,
          pollUrl: `${this.testPollingEndpoint}/${correlationId}`
        };
      } else {
        return {
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Poll submission status from HMRC
   */
  async pollSubmissionStatus(correlationId: string): Promise<{
    status: 'pending' | 'accepted' | 'rejected' | 'error';
    message?: string;
    errors?: string[];
  }> {
    try {
      const response = await fetch(`${this.testPollingEndpoint}/${correlationId}`, {
        method: 'GET',
        headers: {
          'X-Vendor-ID': this.vendorId,
          'X-Sender-ID': this.testSenderID
        }
      });

      if (response.ok) {
        const responseText = await response.text();
        const parsedResponse = this.xmlParser.parse(responseText);
        
        const status = parsedResponse?.IRenvelope?.IRheader?.Status;
        const message = parsedResponse?.IRenvelope?.IRheader?.Message;
        const errors = parsedResponse?.IRenvelope?.IRbody?.Errors;
        
        return {
          status: this.mapHMRCStatus(status),
          message,
          errors: Array.isArray(errors) ? errors : errors ? [errors] : undefined
        };
      } else {
        return {
          status: 'error',
          message: `HTTP ${response.status}: ${response.statusText}`
        };
      }
    } catch (error) {
      return {
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Generate test CT600 submission with mock data
   */
  async generateTestSubmission(): Promise<{
    xmlData: string;
    submissionResult: any;
  }> {
    const mockCTData = {
      companyName: 'Test Company Ltd',
      companyNumber: '12345678',
      address: {
        line1: '123 Test Street',
        line2: 'Test Area',
        postcode: 'TE1 1ST',
        country: 'GB'
      },
      accountingPeriodStart: '2023-01-01',
      accountingPeriodEnd: '2023-12-31',
      turnover: 500000,
      costOfSales: 200000,
      grossProfit: 300000,
      administrativeExpenses: 150000,
      operatingProfit: 150000,
      profit: 150000,
      adjustments: 0,
      taxableProfit: 150000,
      taxRate: 19,
      corporationTaxDue: 28500,
      taxPaid: 0,
      taxBalance: 28500,
      authorizedPerson: 'Director'
    };

    const xmlData = await this.generateCT600XML(mockCTData);
    const submissionResult = await this.submitCT600(xmlData);

    return {
      xmlData,
      submissionResult
    };
  }

  /**
   * Format currency values for XML (pence to pounds)
   */
  private formatCurrency(pence: number): string {
    return (pence / 100).toFixed(2);
  }

  /**
   * Map HMRC status codes to internal status
   */
  private mapHMRCStatus(hmrcStatus: string): 'pending' | 'accepted' | 'rejected' | 'error' {
    switch (hmrcStatus?.toLowerCase()) {
      case 'accepted':
      case 'success':
        return 'accepted';
      case 'rejected':
      case 'failed':
        return 'rejected';
      case 'pending':
      case 'processing':
        return 'pending';
      default:
        return 'error';
    }
  }

  /**
   * Validate CT600 data before submission
   */
  validateCT600Data(data: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.companyName) errors.push('Company name is required');
    if (!data.companyNumber) errors.push('Company registration number is required');
    if (!data.accountingPeriodStart) errors.push('Accounting period start date is required');
    if (!data.accountingPeriodEnd) errors.push('Accounting period end date is required');
    if (!data.address?.line1) errors.push('Company address is required');
    if (!data.address?.postcode) errors.push('Company postcode is required');
    
    // Validate financial data
    if (data.turnover < 0) errors.push('Turnover cannot be negative');
    if (data.profit < 0) errors.push('Profit cannot be negative');
    if (data.taxableProfit < 0) errors.push('Taxable profit cannot be negative');
    if (data.corporationTaxDue < 0) errors.push('Corporation tax due cannot be negative');

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

export const hmrcCTService = new HMRCCTService();
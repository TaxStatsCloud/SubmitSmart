// Application Constants
export const APP_CONFIG = {
  // HMRC Configuration
  HMRC: {
    VENDOR_ID: '9233',
    TEST_SENDER_ID: 'CTUser100',
    TEST_UTR: '8596148860',
    ENDPOINTS: {
      TEST_SUBMISSION: process.env.HMRC_TEST_ENDPOINT || 'https://test-api.service.hmrc.gov.uk/ct/submit',
      TEST_POLLING: process.env.HMRC_TEST_POLLING || 'https://test-api.service.hmrc.gov.uk/ct/poll'
    }
  },

  // Companies House Filing Fees (in pounds)
  COMPANIES_HOUSE_FEES: {
    ACCOUNTS: {
      MICRO: 12,
      SMALL: 12,
      MEDIUM: 40,
      LARGE: 40,
      DEFAULT: 12
    },
    CONFIRMATION_STATEMENT: 13,
    CHANGE_OF_DETAILS: 0 // Free
  },

  // OpenAI Configuration
  OPENAI: {
    MODEL: 'gpt-4o',
    TEMPERATURE: {
      CREATIVE: 0.7,
      STRUCTURED: 0.3
    },
    MAX_TOKENS: {
      STANDARD: 1000,
      EXTENDED: 2000
    }
  },

  // Application Limits
  LIMITS: {
    MAX_RECONNECT_ATTEMPTS: 5,
    MOBILE_BREAKPOINT: 768,
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
    RECENT_DOCUMENTS_COUNT: 5
  }
} as const;

// Email Templates
export const EMAIL_SENDER = 'support@promptsubmissions.com';

// Document Analysis Prompts
export const DOCUMENT_ANALYSIS_PROMPTS = {
  TRIAL_BALANCE: `Analyze this trial balance document and extract:
    - Period end date
    - Total debits and credits
    - Major account categories with their values
    - Any significant observations or potential issues
    
    Respond with a JSON structure that includes these extracted fields.`,
    
  INVOICE: `Analyze this invoice document and extract:
    - Invoice number
    - Issue date
    - Due date
    - Vendor/supplier information
    - Line items with descriptions, quantities, and amounts
    - Total amount (excluding tax)
    - VAT/tax amount
    - Total amount (including tax)
    
    Respond with a JSON structure that includes these extracted fields.`,
    
  BANK_STATEMENT: `Analyze this bank statement document and extract:
    - Bank name
    - Account number (masked if present)
    - Statement period (start and end dates)
    - Opening balance
    - Closing balance
    - Significant transactions (deposits and withdrawals)
    - Any bank fees or charges
    
    Respond with a JSON structure that includes these extracted fields.`,
    
  DEFAULT: (documentType: string) => `Analyze this ${documentType} document and extract key information relevant for financial reporting and compliance.
    
    Respond with a JSON structure that includes all extracted fields.`
} as const;
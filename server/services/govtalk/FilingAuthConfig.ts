import { CompaniesHouseCredentials } from './CompaniesHouseAuthService';
import { HMRCCredentials } from './HMRCAuthService';

export type FilingEnvironment = 'test' | 'live';

export interface FilingAuthConfiguration {
  companiesHouse: CompaniesHouseCredentials;
  hmrc: HMRCCredentials;
}

export class FilingAuthConfig {
  private static getEnvironment(): FilingEnvironment {
    const isProduction = process.env.REPLIT_DEPLOYMENT === '1';
    const forceTest = process.env.FILING_FORCE_TEST === 'true';
    
    return (isProduction && !forceTest) ? 'live' : 'test';
  }

  static getConfig(): FilingAuthConfiguration {
    const env = this.getEnvironment();
    
    if (env === 'test') {
      return this.getTestConfig();
    } else {
      return this.getLiveConfig();
    }
  }

  private static getTestConfig(): FilingAuthConfiguration {
    const hmrcTestSenderId = process.env.HMRC_TEST_SENDER_ID || 'CTUser100';
    const hmrcTestPassword = process.env.HMRC_TEST_PASSWORD;
    const hmrcTestUtr = process.env.HMRC_TEST_UTR || '8596148860';

    if (!hmrcTestPassword) {
      throw new Error('HMRC_TEST_PASSWORD environment variable is required for test environment');
    }

    return {
      companiesHouse: {
        presenterId: process.env.COMPANIES_HOUSE_PRESENTER_ID || '',
        password: process.env.COMPANIES_HOUSE_PASSWORD || '',
        emailAddress: 'test@taxstats.cloud',
      },
      hmrc: {
        vendorId: '9233',
        senderId: hmrcTestSenderId,
        password: hmrcTestPassword,
        utr: hmrcTestUtr,
      },
    };
  }

  private static getLiveConfig(): FilingAuthConfiguration {
    if (!process.env.COMPANIES_HOUSE_PRESENTER_ID || !process.env.COMPANIES_HOUSE_PASSWORD) {
      throw new Error('Missing Companies House credentials in production environment');
    }

    if (!process.env.HMRC_LIVE_SENDER_ID || !process.env.HMRC_LIVE_PASSWORD) {
      throw new Error('Missing HMRC live credentials in production environment');
    }

    return {
      companiesHouse: {
        presenterId: process.env.COMPANIES_HOUSE_PRESENTER_ID,
        password: process.env.COMPANIES_HOUSE_PASSWORD,
        emailAddress: process.env.COMPANIES_HOUSE_EMAIL || 'filings@taxstats.cloud',
      },
      hmrc: {
        vendorId: '9233',
        senderId: process.env.HMRC_LIVE_SENDER_ID,
        password: process.env.HMRC_LIVE_PASSWORD,
        utr: '',
      },
    };
  }

  static isTestEnvironment(): boolean {
    return this.getEnvironment() === 'test';
  }
}

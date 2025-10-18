import crypto from 'crypto';
import { GovTalkEnvelopeBuilder, GovTalkHeader } from './GovTalkEnvelopeBuilder';

export interface CompaniesHouseCredentials {
  presenterId: string;
  password: string;
  emailAddress?: string;
}

export interface CompaniesHouseSubmissionRequest {
  messageClass: string;
  transactionId: string;
  bodyXml: string;
  keys?: { [key: string]: string };
}

export class CompaniesHouseAuthService {
  private envelopeBuilder: GovTalkEnvelopeBuilder;
  private credentials: CompaniesHouseCredentials;
  private isTestEnvironment: boolean;

  constructor(credentials: CompaniesHouseCredentials, isTestEnvironment: boolean = false) {
    this.envelopeBuilder = new GovTalkEnvelopeBuilder();
    this.credentials = credentials;
    this.isTestEnvironment = isTestEnvironment;
  }

  private generateCHMD5Hash(password: string): string {
    return crypto.createHash('md5').update(password).digest('hex').toUpperCase();
  }

  buildAuthenticatedRequest(request: CompaniesHouseSubmissionRequest): string {
    const header: GovTalkHeader = {
      messageDetails: {
        messageClass: request.messageClass,
        qualifier: 'request',
        transactionId: request.transactionId,
      },
      senderDetails: {
        senderId: this.credentials.presenterId,
        authentication: {
          method: 'CHMD5',
          value: this.generateCHMD5Hash(this.credentials.password),
        },
        emailAddress: this.credentials.emailAddress,
      },
    };

    return this.envelopeBuilder.buildEnvelope(header, request.bodyXml, request.keys);
  }

  async submitToGateway(xmlRequest: string): Promise<string> {
    const endpoint = this.isTestEnvironment
      ? 'https://xmlgw.companieshouse.gov.uk/v1-0/xmlgw/Gateway'
      : 'https://xmlgw.companieshouse.gov.uk/v1-0/xmlgw/Gateway';
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml; charset=UTF-8',
      },
      body: xmlRequest,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Companies House Gateway error (${response.status}): ${errorText}`);
    }

    return await response.text();
  }
}

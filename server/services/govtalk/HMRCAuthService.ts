import { GovTalkEnvelopeBuilder, GovTalkHeader } from './GovTalkEnvelopeBuilder';
import { IRmarkService } from './IRmarkService';

export interface HMRCCredentials {
  vendorId: string;
  senderId: string;
  password: string;
  utr?: string;
}

export interface HMRCSubmissionRequest {
  messageClass: string;
  transactionId: string;
  bodyXml: string;
  utr: string;
  periodEnd: string;
  companyName?: string;
}

export class HMRCAuthService {
  private envelopeBuilder: GovTalkEnvelopeBuilder;
  private credentials: HMRCCredentials;
  private isTestEnvironment: boolean;

  constructor(credentials: HMRCCredentials, isTestEnvironment: boolean = false) {
    this.envelopeBuilder = new GovTalkEnvelopeBuilder();
    this.credentials = credentials;
    this.isTestEnvironment = isTestEnvironment;
  }

  async buildAuthenticatedRequest(request: HMRCSubmissionRequest): Promise<string> {
    const irheader = IRmarkService.buildIRheader(
      request.utr,
      request.periodEnd,
      this.credentials.vendorId,
      this.credentials.senderId,
      this.credentials.password,
      undefined
    );

    const irenvelopeBody = `<IRenvelope xmlns="http://www.govtalk.gov.uk/taxation/CT/2">
  ${irheader}
  ${request.bodyXml}
</IRenvelope>`;

    const header: GovTalkHeader = {
      messageDetails: {
        messageClass: request.messageClass,
        qualifier: 'request',
        transactionId: request.transactionId,
      },
      senderDetails: {
        senderId: this.credentials.senderId,
        authentication: {
          method: 'clear',
          value: this.credentials.password,
        },
      },
    };

    const keys = {
      UTR: request.utr,
    };

    const govtalkXml = this.envelopeBuilder.buildEnvelope(header, irenvelopeBody, keys);

    const irmark = await IRmarkService.calculateIRmark(govtalkXml);

    const finalIRheader = IRmarkService.buildIRheader(
      request.utr,
      request.periodEnd,
      this.credentials.vendorId,
      this.credentials.senderId,
      this.credentials.password,
      irmark
    );

    const finalIRenvelopeBody = `<IRenvelope xmlns="http://www.govtalk.gov.uk/taxation/CT/2">
  ${finalIRheader}
  ${request.bodyXml}
</IRenvelope>`;

    return this.envelopeBuilder.buildEnvelope(header, finalIRenvelopeBody, keys);
  }

  async submitToHMRC(xmlRequest: string): Promise<string> {
    const endpoint = this.isTestEnvironment
      ? 'https://secure.dev.gateway.gov.uk/submission'
      : 'https://secure.gateway.gov.uk/submission';
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/xml; charset=UTF-8',
      },
      body: xmlRequest,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HMRC Gateway error (${response.status}): ${errorText}`);
    }

    return await response.text();
  }
}

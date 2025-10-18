export interface HMRCCredentials {
  vendorId: string;
  senderId: string;
  password: string;
  utr?: string;
}

export interface HMRCSubmissionRequest {
  messageClass: string;
  transactionId: string;
  body: any;
  utr?: string;
  keys?: { [key: string]: string };
}

export class HMRCAuthService {
  private credentials: HMRCCredentials;

  constructor(credentials: HMRCCredentials) {
    this.credentials = credentials;
  }

  buildAuthenticatedRequest(request: HMRCSubmissionRequest): string {
    const utr = request.utr || this.credentials.utr;
    
    if (!utr) {
      throw new Error('UTR is required for HMRC submissions');
    }

    const xmlDoc = `<?xml version="1.0" encoding="UTF-8"?>
<IRenvelope xmlns="http://www.govtalk.gov.uk/taxation/CT/2">
  <IRheader>
    <Keys>
      <Key Type="UTR">${utr}</Key>
    </Keys>
    <PeriodEnd>${this.formatDate(new Date())}</PeriodEnd>
    <DefaultCurrency>GBP</DefaultCurrency>
    <IRmark Type="generic">
      <Sender>
        <SenderID>${this.credentials.senderId}</SenderID>
        <Password>${this.credentials.password}</Password>
        <URI>https://www.hmrc.gov.uk/vendor/${this.credentials.vendorId}</URI>
      </Sender>
    </IRmark>
  </IRheader>
  ${request.body}
</IRenvelope>`;

    return xmlDoc;
  }

  async submitToHMRC(xmlRequest: string, isTest: boolean = false): Promise<string> {
    const endpoint = isTest 
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

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}

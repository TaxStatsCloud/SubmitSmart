import crypto from 'crypto';
import https from 'https';
import http from 'http';

/**
 * Companies House XML Gateway Service
 * Handles submission of accounts and forms to Companies House via XML Gateway
 * 
 * Protocol:
 * - HTTP POST to XML Gateway endpoint
 * - GovTalk Message Envelope wrapping
 * - MD5 authentication
 * - iXBRL/XML document submission
 */

interface GovTalkSubmissionRequest {
  messageClass: 'Accounts' | 'ConfirmationStatement' | 'SchemaStatus';
  messageQualifier: 'request' | 'response';
  transactionId: string;
  senderDetails: {
    presenterIdNumber: string;
    presenterAuthenticationCode: string;
    emailAddress: string;
  };
  companyNumber: string;
  testMode: boolean;
  documentBody: string; // iXBRL or XML content
  packageNumber?: string; // Required for test: 0012
}

interface GovTalkSubmissionResponse {
  success: boolean;
  submissionId?: string;
  status: 'accepted' | 'rejected' | 'pending' | 'processing';
  errors?: Array<{
    code: string;
    message: string;
    type: 'business' | 'fatal' | 'warning';
  }>;
  responseBody?: string;
  barcode?: string;
}

export class CompaniesHouseXMLGatewayService {
  private gatewayUrl = 'https://xmlgw.companieshouse.gov.uk/v1-0/xmlgw/Gateway';
  private testGatewayUrl = 'http://xmlgw.companieshouse.gov.uk/v1-0/xmlgw/Gateway';
  private envelopeVersion = '1.0';
  private govTalkNamespace = 'http://www.govtalk.gov.uk/schemas/govtalk/govtalkheader';

  /**
   * Submit accounts or forms to Companies House XML Gateway
   */
  async submitToGateway(request: GovTalkSubmissionRequest): Promise<GovTalkSubmissionResponse> {
    try {
      console.info('[CH XML Gateway] Preparing submission:', {
        class: request.messageClass,
        company: request.companyNumber,
        testMode: request.testMode,
      });

      // Generate MD5 hash of authentication code
      const authHash = this.generateMD5Hash(request.senderDetails.presenterAuthenticationCode);

      // Build GovTalk envelope
      const govTalkEnvelope = this.buildGovTalkEnvelope({
        ...request,
        authHash,
      });

      // Submit to gateway
      const response = await this.postToGateway(govTalkEnvelope, request.testMode);

      // Parse response
      return this.parseGatewayResponse(response);

    } catch (error: any) {
      console.error('[CH XML Gateway] Submission failed:', error);
      throw new Error(`XML Gateway submission failed: ${error.message}`);
    }
  }

  /**
   * Build GovTalk message envelope
   */
  private buildGovTalkEnvelope(request: GovTalkSubmissionRequest & { authHash: string }): string {
    const timestamp = new Date().toISOString();
    
    return `<?xml version="1.0" encoding="UTF-8"?>
<GovTalkMessage xmlns="${this.govTalkNamespace}">
  <EnvelopeVersion>${this.envelopeVersion}</EnvelopeVersion>
  
  <Header>
    <MessageDetails>
      <Class>${request.messageClass}</Class>
      <Qualifier>${request.messageQualifier}</Qualifier>
      <Function>submit</Function>
      <TransactionID>${request.transactionId}</TransactionID>
      <CorrelationID>${request.transactionId}</CorrelationID>
      <Transformation>XML</Transformation>
      <GatewayTest>${request.testMode ? '1' : '0'}</GatewayTest>
    </MessageDetails>
    
    <SenderDetails>
      <IDAuthentication>
        <SenderID>${request.senderDetails.presenterIdNumber}</SenderID>
        <Authentication>
          <Method>CHMD5</Method>
          <Value>${request.authHash}</Value>
        </Authentication>
      </IDAuthentication>
      <EmailAddress>${request.senderDetails.emailAddress}</EmailAddress>
    </SenderDetails>
  </Header>
  
  <GovTalkDetails>
    <Keys>
      <Key Type="CompanyNumber">${request.companyNumber}</Key>
      ${request.packageNumber ? `<Key Type="PackageReference">${request.packageNumber}</Key>` : ''}
    </Keys>
  </GovTalkDetails>
  
  <Body>
    ${request.documentBody}
  </Body>
  
</GovTalkMessage>`;
  }

  /**
   * Generate MD5 hash for authentication
   */
  private generateMD5Hash(authCode: string): string {
    return crypto
      .createHash('md5')
      .update(authCode)
      .digest('hex')
      .toUpperCase();
  }

  /**
   * POST XML envelope to Companies House gateway
   */
  private postToGateway(xmlEnvelope: string, testMode: boolean): Promise<string> {
    return new Promise((resolve, reject) => {
      const url = testMode ? this.testGatewayUrl : this.gatewayUrl;
      const parsedUrl = new URL(url);
      const protocol = parsedUrl.protocol === 'https:' ? https : http;

      const options = {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
        path: parsedUrl.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'text/xml; charset=UTF-8',
          'Content-Length': Buffer.byteLength(xmlEnvelope),
          'User-Agent': 'PromptSubmissions/1.0',
        },
      };

      const req = protocol.request(options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          if (res.statusCode === 200) {
            resolve(data);
          } else {
            reject(new Error(`Gateway returned status ${res.statusCode}: ${data}`));
          }
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      req.write(xmlEnvelope);
      req.end();
    });
  }

  /**
   * Parse gateway response XML
   */
  private parseGatewayResponse(responseXml: string): GovTalkSubmissionResponse {
    // Basic XML parsing (in production, use proper XML parser)
    const errors: Array<{ code: string; message: string; type: 'business' | 'fatal' | 'warning' }> = [];
    let status: 'accepted' | 'rejected' | 'pending' | 'processing' = 'pending';
    let submissionId = '';
    let barcode = '';

    // Extract errors
    const errorMatches = Array.from(responseXml.matchAll(/<Error>[\s\S]*?<Number>(.*?)<\/Number>[\s\S]*?<Text>(.*?)<\/Text>[\s\S]*?<Type>(.*?)<\/Type>[\s\S]*?<\/Error>/g));
    for (const match of errorMatches) {
      const errorType = match[3].toLowerCase();
      errors.push({
        code: match[1],
        message: match[2],
        type: (errorType === 'business' || errorType === 'fatal' || errorType === 'warning') 
          ? errorType 
          : 'fatal',
      });
    }

    // Check if submission was successful
    const qualifierMatch = responseXml.match(/<Qualifier>(.*?)<\/Qualifier>/);
    if (qualifierMatch) {
      const qualifier = qualifierMatch[1];
      if (qualifier === 'acknowledgement') {
        status = 'accepted';
      } else if (qualifier === 'error') {
        status = 'rejected';
      }
    }

    // Extract submission/correlation ID
    const correlationMatch = responseXml.match(/<CorrelationID>(.*?)<\/CorrelationID>/);
    if (correlationMatch) {
      submissionId = correlationMatch[1];
    }

    // Extract barcode if present
    const barcodeMatch = responseXml.match(/<Barcode>(.*?)<\/Barcode>/);
    if (barcodeMatch) {
      barcode = barcodeMatch[1];
    }

    // Determine overall success
    const hasFatalErrors = errors.some(e => e.type === 'fatal' || e.type === 'business');
    const success = !hasFatalErrors && status !== 'rejected';

    return {
      success,
      submissionId: submissionId || undefined,
      status,
      errors: errors.length > 0 ? errors : undefined,
      responseBody: responseXml,
      barcode: barcode || undefined,
    };
  }

  /**
   * Check gateway schema status (for testing connectivity)
   */
  async checkSchemaStatus(): Promise<{ available: boolean; schemas: string[] }> {
    const request: GovTalkSubmissionRequest = {
      messageClass: 'SchemaStatus',
      messageQualifier: 'request',
      transactionId: `SS-${Date.now()}`,
      senderDetails: {
        presenterIdNumber: 'TEST',
        presenterAuthenticationCode: 'TEST',
        emailAddress: 'test@example.com',
      },
      companyNumber: '00000000',
      testMode: true,
      documentBody: '<SchemaStatusRequest/>',
    };

    try {
      const response = await this.submitToGateway(request);
      const schemas = this.extractSchemaList(response.responseBody || '');
      
      return {
        available: response.success,
        schemas,
      };
    } catch (error) {
      return {
        available: false,
        schemas: [],
      };
    }
  }

  /**
   * Extract schema list from response
   */
  private extractSchemaList(responseXml: string): string[] {
    const schemas: string[] = [];
    const schemaMatches = Array.from(responseXml.matchAll(/<Schema>(.*?)<\/Schema>/g));
    
    for (const match of schemaMatches) {
      schemas.push(match[1]);
    }
    
    return schemas;
  }

  /**
   * Generate unique transaction ID
   */
  generateTransactionId(prefix: string = 'ACC'): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${prefix}-${timestamp}-${random}`;
  }
}

export const companiesHouseXMLGatewayService = new CompaniesHouseXMLGatewayService();

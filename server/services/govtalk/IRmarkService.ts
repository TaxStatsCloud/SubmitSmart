import crypto from 'crypto';
import { DOMParser } from '@xmldom/xmldom';
const c14n = require('xml-c14n')();

export class IRmarkService {
  /**
   * Calculate IRmark hash for HMRC submissions according to Generic IRmark Specification v1.2
   * 
   * Algorithm:
   * 1. Extract Body element from GovTalk envelope
   * 2. Remove any existing IRmark element
   * 3. Apply XML Canonicalization (Inclusive C14N without comments - http://www.w3.org/TR/2001/REC-xml-c14n-20010315)
   * 4. Normalize line endings to \n
   * 5. Calculate SHA-1 hash
   * 6. Encode as Base64
   */
  static calculateIRmark(fullXml: string): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(fullXml, 'text/xml');

        const bodyElements = doc.getElementsByTagNameNS('http://www.govtalk.gov.uk/CM/envelope', 'Body');
        if (bodyElements.length === 0) {
          throw new Error('No Body element found in GovTalk envelope');
        }

        const bodyElement = bodyElements[0];

        const irmarkElements = doc.getElementsByTagName('IRmark');
        for (let i = irmarkElements.length - 1; i >= 0; i--) {
          const irmark = irmarkElements[i];
          if (irmark.parentNode) {
            irmark.parentNode.removeChild(irmark);
          }
        }

        const canonicaliser = c14n.createCanonicaliser('http://www.w3.org/TR/2001/REC-xml-c14n-20010315');

        canonicaliser.canonicalise(bodyElement, (err: Error | null, canonicalXml: string) => {
          if (err) {
            return reject(new Error(`XML canonicalization failed: ${err.message}`));
          }

          const normalized = canonicalXml.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

          const hash = crypto.createHash('sha1');
          hash.update(normalized, 'utf8');
          
          const irmark = hash.digest('base64');
          
          resolve(irmark);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Build IRheader section with IRmark for HMRC CT submissions
   */
  static buildIRheader(
    utr: string,
    periodEnd: string,
    vendorId: string,
    senderId: string,
    password: string,
    irmark?: string
  ): string {
    const vendorUri = `https://www.hmrc.gov.uk/vendor/${this.escapeXml(vendorId)}`;
    
    return `<IRheader>
  <Keys>
    <Key Type="UTR">${this.escapeXml(utr)}</Key>
  </Keys>
  <PeriodEnd>${this.escapeXml(periodEnd)}</PeriodEnd>
  <DefaultCurrency>GBP</DefaultCurrency>
  <IRmark Type="generic">${irmark || 'PLACEHOLDER'}</IRmark>
  <Sender>
    <SenderID>${this.escapeXml(senderId)}</SenderID>
    <Password>${this.escapeXml(password)}</Password>
    <URI>${vendorUri}</URI>
    <Name>TaxStats Cloud</Name>
    <Capacity>Agent</Capacity>
    <Address>
      <Line>PromptSubmissions</Line>
      <Line>UK</Line>
    </Address>
    <Contact>
      <Name>TaxStats Support</Name>
      <Email>support@taxstats.cloud</Email>
      <Telephone>020 0000 0000</Telephone>
    </Contact>
  </Sender>
</IRheader>`;
  }

  private static escapeXml(unsafe: string): string {
    return unsafe
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
}

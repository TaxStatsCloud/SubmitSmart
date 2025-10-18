import { create, fragment } from 'xmlbuilder2';
import { XMLBuilder } from 'xmlbuilder2/lib/interfaces';

export interface GovTalkMessageDetails {
  messageClass: string;
  qualifier: 'request' | 'response' | 'acknowledgement' | 'poll';
  transactionId: string;
  correlationId?: string;
}

export interface GovTalkSenderDetails {
  senderId: string;
  authentication?: {
    method: string;
    value: string;
  };
  emailAddress?: string;
}

export interface GovTalkHeader {
  messageDetails: GovTalkMessageDetails;
  senderDetails: GovTalkSenderDetails;
}

export interface GovTalkKeys {
  [key: string]: string;
}

export class GovTalkEnvelopeBuilder {
  private namespace = 'http://www.govtalk.gov.uk/CM/envelope';
  private schemaLocation = 'http://www.govtalk.gov.uk/CM/envelope http://xmlgw.companieshouse.gov.uk/v1-0/schema/Egov_ch-v2-0.xsd';

  buildEnvelope(header: GovTalkHeader, bodyXml: string, keys?: GovTalkKeys): string {
    const root = create({ version: '1.0', encoding: 'UTF-8' })
      .ele(this.namespace, 'GovTalkMessage')
      .att('http://www.w3.org/2001/XMLSchema-instance', 'xsi:schemaLocation', this.schemaLocation);

    root.ele('EnvelopeVersion').txt('2.0');

    const headerEle = root.ele('Header');
    
    const msgDetails = headerEle.ele('MessageDetails');
    msgDetails.ele('Class').txt(header.messageDetails.messageClass);
    msgDetails.ele('Qualifier').txt(header.messageDetails.qualifier);
    msgDetails.ele('TransactionID').txt(header.messageDetails.transactionId);
    if (header.messageDetails.correlationId) {
      msgDetails.ele('CorrelationID').txt(header.messageDetails.correlationId);
    }

    const senderDetails = headerEle.ele('SenderDetails');
    const idAuth = senderDetails.ele('IDAuthentication');
    idAuth.ele('SenderID').txt(header.senderDetails.senderId);
    
    if (header.senderDetails.authentication) {
      const auth = idAuth.ele('Authentication');
      auth.ele('Method').txt(header.senderDetails.authentication.method);
      auth.ele('Value').txt(header.senderDetails.authentication.value);
    }

    if (header.senderDetails.emailAddress) {
      senderDetails.ele('EmailAddress').txt(header.senderDetails.emailAddress);
    }

    const govTalkDetails = root.ele('GovTalkDetails');
    if (keys && Object.keys(keys).length > 0) {
      const keysEle = govTalkDetails.ele('Keys');
      Object.entries(keys).forEach(([type, value]) => {
        keysEle.ele('Key')
          .att('Type', type)
          .txt(value);
      });
    } else {
      govTalkDetails.ele('Keys');
    }

    const bodyEle = root.ele('Body');
    
    if (bodyXml && bodyXml.trim().length > 0) {
      const bodyFragment = fragment(bodyXml);
      bodyEle.import(bodyFragment);
    }

    return root.end({ prettyPrint: true });
  }

}

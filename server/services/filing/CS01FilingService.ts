import { CompaniesHouseAuthService, FilingAuthConfig } from '../govtalk';
import { CS01XMLGenerator, CS01Data } from './CS01XMLGenerator';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-04-30.basil',
});

export interface CS01SubmissionRequest {
  filingId: number;
  companyId: number;
  userId: number;
  cs01Data: CS01Data;
  paymentMethodId?: string;
}

export interface CS01SubmissionResult {
  success: boolean;
  submissionId?: string;
  companiesHouseReference?: string;
  paymentIntentId?: string;
  errors?: string[];
  xmlRequest?: string;
  xmlResponse?: string;
}

export class CS01FilingService {
  private static readonly FILING_FEE_POUNDS = 34;
  private static readonly FILING_FEE_PENCE = 3400;

  /**
   * Process CS01 filing submission with payment and Companies House submission
   */
  static async submitCS01(request: CS01SubmissionRequest): Promise<CS01SubmissionResult> {
    try {
      const validation = CS01XMLGenerator.validateCS01Data(request.cs01Data);
      if (!validation.valid) {
        return {
          success: false,
          errors: validation.errors
        };
      }

      if (!request.paymentMethodId) {
        return {
          success: false,
          errors: ['Payment method is required. Companies House filing fee of £34.00 must be paid before submission.']
        };
      }

      const paymentIntent = await this.processPayment(
        request.userId,
        request.paymentMethodId,
        request.companyId
      );
      const paymentIntentId = paymentIntent.id;

      const cs01BodyXml = CS01XMLGenerator.generateCS01Body(request.cs01Data);

      const config = FilingAuthConfig.getConfig();
      const authService = new CompaniesHouseAuthService(
        config.companiesHouse,
        FilingAuthConfig.isTestEnvironment()
      );

      const transactionId = this.generateTransactionId();
      
      const fullXmlRequest = authService.buildAuthenticatedRequest({
        messageClass: 'ConfirmationStatement',
        transactionId,
        bodyXml: cs01BodyXml,
        keys: {
          CompanyNumber: request.cs01Data.companyNumber
        }
      });

      const xmlResponse = await authService.submitToGateway(fullXmlRequest);

      const isSuccess = this.isSuccessfulSubmission(xmlResponse);
      
      if (!isSuccess) {
        const errors = this.parseResponseErrors(xmlResponse);
        return {
          success: false,
          errors: errors.length > 0 ? errors : ['Companies House rejected the submission. Please check the response for details.'],
          xmlRequest: fullXmlRequest,
          xmlResponse
        };
      }

      const companiesHouseReference = this.extractReferenceFromResponse(xmlResponse);

      return {
        success: true,
        submissionId: transactionId,
        companiesHouseReference,
        paymentIntentId,
        xmlRequest: fullXmlRequest,
        xmlResponse
      };

    } catch (error) {
      console.error('CS01 submission error:', error);
      return {
        success: false,
        errors: [error instanceof Error ? error.message : 'Unknown error occurred']
      };
    }
  }

  /**
   * Process Stripe payment for CS01 filing fee
   */
  private static async processPayment(
    userId: number,
    paymentMethodId: string,
    companyId: number
  ): Promise<Stripe.PaymentIntent> {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: this.FILING_FEE_PENCE,
      currency: 'gbp',
      payment_method: paymentMethodId,
      confirm: true,
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: 'never'
      },
      metadata: {
        userId: String(userId),
        companyId: String(companyId),
        filingType: 'confirmation_statement',
        description: 'Companies House Confirmation Statement (CS01) Filing Fee'
      },
      description: `CS01 Filing Fee - Company ID ${companyId}`
    });

    if (paymentIntent.status !== 'succeeded') {
      throw new Error(`Payment failed with status: ${paymentIntent.status}`);
    }

    return paymentIntent;
  }

  /**
   * Generate unique transaction ID for Companies House submission
   */
  private static generateTransactionId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 9);
    return `CS01-${timestamp}-${random}`.toUpperCase();
  }

  /**
   * Extract Companies House reference from XML response
   */
  private static extractReferenceFromResponse(xmlResponse: string): string | undefined {
    const referenceMatch = xmlResponse.match(/<SubmissionNumber>([^<]+)<\/SubmissionNumber>/);
    if (referenceMatch) {
      return referenceMatch[1];
    }

    const confirmationMatch = xmlResponse.match(/<ConfirmationCode>([^<]+)<\/ConfirmationCode>/);
    if (confirmationMatch) {
      return confirmationMatch[1];
    }

    return undefined;
  }

  /**
   * Parse Companies House XML response for errors
   */
  static parseResponseErrors(xmlResponse: string): string[] {
    const errors: string[] = [];
    
    const errorMatches = Array.from(xmlResponse.matchAll(/<Error[^>]*>([^<]+)<\/Error>/g));
    for (const match of errorMatches) {
      errors.push(match[1]);
    }

    const messageMatches = Array.from(xmlResponse.matchAll(/<Message[^>]*>([^<]+)<\/Message>/g));
    for (const match of messageMatches) {
      if (match[1].toLowerCase().includes('error') || match[1].toLowerCase().includes('fail')) {
        errors.push(match[1]);
      }
    }

    return errors;
  }

  /**
   * Check if Companies House response indicates successful submission
   */
  static isSuccessfulSubmission(xmlResponse: string): boolean {
    if (xmlResponse.includes('<Status>Success</Status>')) {
      return true;
    }
    if (xmlResponse.includes('<Qualifier>acknowledgement</Qualifier>')) {
      return true;
    }
    if (xmlResponse.includes('<SubmissionNumber>')) {
      return true;
    }
    
    const errors = this.parseResponseErrors(xmlResponse);
    return errors.length === 0;
  }
}

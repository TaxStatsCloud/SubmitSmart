import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface ExtractedFinancialData {
  documentType: string;
  transactions: Array<{
    description: string;
    amount: number;
    date: string;
    category: 'sales' | 'purchases' | 'expenses' | 'other';
    subcategory?: string;
  }>;
  summary: {
    totalAmount: number;
    currency: string;
    period?: string;
  };
}

export class AIDocumentProcessor {
  /**
   * Process uploaded financial documents and extract key data
   */
  async processDocument(filePath: string, documentType: string): Promise<ExtractedFinancialData> {
    try {
      console.log(`Processing document: ${filePath} of type: ${documentType}`);
      
      // Read file and convert to base64 for image processing
      const fileBuffer = fs.readFileSync(filePath);
      const fileExtension = path.extname(filePath).toLowerCase();
      
      if (fileExtension === '.pdf') {
        // For PDF files, we'll extract text and process it
        return await this.processPDFDocument(fileBuffer, documentType);
      } else if (['.jpg', '.jpeg', '.png'].includes(fileExtension)) {
        // For images, use vision API
        return await this.processImageDocument(fileBuffer, documentType);
      } else {
        throw new Error(`Unsupported file type: ${fileExtension}`);
      }
    } catch (error) {
      console.error('Error processing document:', error);
      throw new Error(`Failed to process document: ${error.message}`);
    }
  }

  private async processPDFDocument(fileBuffer: Buffer, documentType: string): Promise<ExtractedFinancialData> {
    // For PDF processing, we'll use a text-based approach
    // In a real implementation, you'd use a PDF parsing library
    
    const prompt = this.buildExtractionPrompt(documentType);
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: prompt
        },
        {
          role: "user",
          content: `Please analyse this ${documentType} document and extract the financial data. Return the response as JSON only.`
        }
      ],
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(response.choices[0].message.content);
    return this.validateAndFormatResponse(result, documentType);
  }

  private async processImageDocument(fileBuffer: Buffer, documentType: string): Promise<ExtractedFinancialData> {
    const base64Image = fileBuffer.toString('base64');
    const prompt = this.buildExtractionPrompt(documentType);
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: prompt
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Please analyse this ${documentType} document image and extract the financial data. Return the response as JSON only.`
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`
              }
            }
          ]
        }
      ],
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(response.choices[0].message.content);
    return this.validateAndFormatResponse(result, documentType);
  }

  private buildExtractionPrompt(documentType: string): string {
    const basePrompt = `You are a UK accounting expert specialising in analysing financial documents for corporation tax returns. Extract financial data from the provided document and return it as JSON.`;
    
    const documentSpecificInstructions = {
      'sales_invoices': `
        For sales invoices, extract:
        - Invoice details (number, date, customer)
        - Line items with descriptions and amounts
        - VAT amounts (if applicable)
        - Total amounts
        Categorise as 'sales' transactions.
      `,
      'purchase_invoices': `
        For purchase invoices, extract:
        - Supplier details and invoice information
        - Purchased items/services with costs
        - VAT amounts (if applicable)
        - Total amounts
        Categorise as 'purchases' transactions.
      `,
      'expense_receipts': `
        For expense receipts, extract:
        - Expense type and description
        - Amount and date
        - Supplier/vendor information
        - VAT amounts (if applicable)
        Categorise as 'expenses' with appropriate subcategories (travel, office supplies, professional fees, etc.).
      `,
      'bank_statements': `
        For bank statements, extract:
        - Transaction dates and descriptions
        - Amounts (debit/credit)
        - Running balances
        - Categorise transactions as sales, purchases, or expenses based on descriptions
      `
    };

    return `${basePrompt}

    ${documentSpecificInstructions[documentType] || 'Extract all financial transactions and amounts from the document.'}

    Return the response in this exact JSON format:
    {
      "documentType": "${documentType}",
      "transactions": [
        {
          "description": "Transaction description",
          "amount": 123.45,
          "date": "2024-01-01",
          "category": "sales|purchases|expenses|other",
          "subcategory": "optional subcategory"
        }
      ],
      "summary": {
        "totalAmount": 123.45,
        "currency": "GBP",
        "period": "optional period"
      }
    }

    Important:
    - All amounts should be in GBP (British Pounds)
    - Use British date format (DD/MM/YYYY)
    - Be precise with amounts, include pence
    - Categorise transactions appropriately for UK corporation tax purposes
    - If VAT is shown separately, include it in the amounts but note it in descriptions
    `;
  }

  private validateAndFormatResponse(result: any, documentType: string): ExtractedFinancialData {
    // Validate and format the response
    const validated: ExtractedFinancialData = {
      documentType,
      transactions: [],
      summary: {
        totalAmount: 0,
        currency: 'GBP'
      }
    };

    if (result.transactions && Array.isArray(result.transactions)) {
      validated.transactions = result.transactions.map(transaction => ({
        description: transaction.description || 'Unknown transaction',
        amount: parseFloat(transaction.amount) || 0,
        date: transaction.date || new Date().toISOString().split('T')[0],
        category: transaction.category || 'other',
        subcategory: transaction.subcategory
      }));
    }

    if (result.summary) {
      validated.summary = {
        totalAmount: parseFloat(result.summary.totalAmount) || 0,
        currency: result.summary.currency || 'GBP',
        period: result.summary.period
      };
    }

    return validated;
  }

  /**
   * Aggregate processed documents into P&L categories
   */
  async aggregateFinancialData(extractedData: ExtractedFinancialData[]): Promise<{
    turnover: number;
    otherIncome: number;
    costOfSales: number;
    administrativeExpenses: number;
    professionalFees: number;
    otherExpenses: number;
  }> {
    const aggregated = {
      turnover: 0,
      otherIncome: 0,
      costOfSales: 0,
      administrativeExpenses: 0,
      professionalFees: 0,
      otherExpenses: 0
    };

    extractedData.forEach(data => {
      data.transactions.forEach(transaction => {
        switch (transaction.category) {
          case 'sales':
            aggregated.turnover += transaction.amount;
            break;
          case 'purchases':
            aggregated.costOfSales += transaction.amount;
            break;
          case 'expenses':
            if (transaction.subcategory === 'professional_fees') {
              aggregated.professionalFees += transaction.amount;
            } else if (transaction.subcategory === 'administrative') {
              aggregated.administrativeExpenses += transaction.amount;
            } else {
              aggregated.otherExpenses += transaction.amount;
            }
            break;
          case 'other':
            aggregated.otherIncome += transaction.amount;
            break;
        }
      });
    });

    return aggregated;
  }
}

export const aiDocumentProcessor = new AIDocumentProcessor();
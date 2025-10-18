/**
 * Cash Flow Statement AI Generator
 * 
 * Generates compliant Cash Flow Statements from Trial Balances using OpenAI.
 * Costs 200 credits per generation.
 * 
 * Key UK Requirements (FRS 102 Section 7 - Indirect Method):
 * - Reconciles operating profit to net cash from operating activities
 * - Adjusts for non-cash items (depreciation, provisions)
 * - Adjusts for working capital changes (stocks, debtors, creditors)
 * - Cash flows from investing activities (capex, investments)
 * - Cash flows from financing activities (loans, dividends)
 * - Net increase/decrease in cash and cash equivalents
 */

import OpenAI from "openai";
import { logger } from "../../utils/logger";

const cashFlowLogger = logger.withContext('CashFlowAIGenerator');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export interface TrialBalance {
  accountName: string;
  accountCode: string;
  debit: number;
  credit: number;
  category: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
}

export interface CashFlowInput {
  companyName: string;
  companyNumber: string;
  periodEnd: string;
  currentYearTB: TrialBalance[];
  priorYearTB: TrialBalance[];
  operatingProfit?: number;
  depreciation?: number;
  interestPaid?: number;
  taxPaid?: number;
}

export interface CashFlowOutput {
  // Operating Activities
  profitBeforeTax: number; // Aligned with wizard schema (was operatingProfit)
  depreciation: number;
  increaseDecreaseInStocks: number;
  increaseDecreaseInDebtors: number;
  increaseDecreaseInCreditors: number;
  interestPaid: number;
  taxPaid: number;
  netCashFromOperatingActivities: number;
  
  // Investing Activities
  purchaseOfTangibleAssets: number; // Aligned with wizard schema
  proceedsFromSaleOfAssets: number;
  purchaseOfInvestments: number;
  netCashFromInvestingActivities: number;
  
  // Financing Activities
  newLoansReceived: number; // Aligned with wizard schema
  repaymentOfBorrowings: number;
  dividendsPaid: number;
  netCashFromFinancingActivities: number;
  
  // Summary
  netIncreaseDecreaseInCash: number;
  openingCash: number; // Renamed from cashAtBeginning to match wizard
  closingCash: number; // Renamed from cashAtEnd to match wizard
  
  // Full formatted statement
  cashFlowStatement: string; // Renamed from fullStatement to match wizard
  
  // Reconciliation notes (optional for internal use)
  reconciliationNotes: string;
}

/**
 * Generate a compliant Cash Flow Statement using AI from Trial Balances
 */
export async function generateCashFlowStatement(
  input: CashFlowInput
): Promise<CashFlowOutput> {
  try {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key is not configured');
    }

    cashFlowLogger.info('Generating Cash Flow Statement', {
      companyName: input.companyName,
      companyNumber: input.companyNumber,
      currentYearTBLines: input.currentYearTB.length,
      priorYearTBLines: input.priorYearTB.length
    });

    const systemPrompt = `You are an expert UK corporate accountant specializing in preparing Cash Flow Statements that comply with FRS 102 Section 7 requirements using the indirect method.

Your role is to analyze Trial Balances from current and prior years and generate a fully compliant Cash Flow Statement.

Key Requirements:
1. Follow FRS 102 Section 7 - Statement of Cash Flows (indirect method)
2. Reconcile operating profit to net cash from operating activities
3. Adjust for non-cash items (depreciation, amortization, provisions)
4. Calculate working capital changes by comparing current year vs prior year
5. Classify cash flows into: Operating, Investing, Financing
6. Ensure mathematical accuracy - all figures must reconcile
7. Provide clear reconciliation notes explaining key movements

Technical Rules:
- Increase in current assets = NEGATIVE cash flow (cash tied up)
- Decrease in current assets = POSITIVE cash flow (cash released)
- Increase in current liabilities = POSITIVE cash flow (cash received)
- Decrease in current liabilities = NEGATIVE cash flow (cash paid out)
- Depreciation is added back (non-cash expense)
- Capital expenditure is negative cash flow in investing section
- Loan proceeds are positive, repayments are negative in financing section

Output Format:
- All amounts in GBP (no pence)
- Negative amounts shown with minus sign
- Professional presentation suitable for statutory accounts
- Clear section headings
- Comprehensive reconciliation notes`;

    const prompt = `Analyze the following Trial Balances and generate a compliant FRS 102 Cash Flow Statement (indirect method):

Company Information:
- Name: ${input.companyName}
- Registration Number: ${input.companyNumber}
- Period Ending: ${input.periodEnd}

Current Year Trial Balance:
${input.currentYearTB.map(line => 
  `${line.accountCode} ${line.accountName} (${line.category}): Dr £${line.debit.toFixed(2)} Cr £${line.credit.toFixed(2)}`
).join('\n')}

Prior Year Trial Balance:
${input.priorYearTB.map(line => 
  `${line.accountCode} ${line.accountName} (${line.category}): Dr £${line.debit.toFixed(2)} Cr £${line.credit.toFixed(2)}`
).join('\n')}

Additional Information:
- Operating Profit: £${input.operatingProfit?.toLocaleString() || 'Calculate from TB'}
- Depreciation: £${input.depreciation?.toLocaleString() || 'Calculate from TB'}
- Interest Paid: £${input.interestPaid?.toLocaleString() || 'Calculate from TB'}
- Tax Paid: £${input.taxPaid?.toLocaleString() || 'Calculate from TB'}

Instructions:
1. Calculate operating profit if not provided (Revenue - Operating Expenses)
2. Identify depreciation charge from TB (usually in expense accounts)
3. Calculate working capital changes:
   - Stocks: Compare current year vs prior year stock balances
   - Debtors: Compare trade debtors movement
   - Creditors: Compare trade creditors movement
4. Identify fixed asset additions from movement in tangible/intangible assets
5. Identify loan movements from long-term liabilities
6. Calculate dividends paid from retained earnings movement
7. Reconcile all cash movements to opening and closing cash balances

Generate a complete Cash Flow Statement with:
- Operating Activities section (indirect method reconciliation)
- Investing Activities section
- Financing Activities section
- Full formatted statement text
- Detailed reconciliation notes explaining key movements and assumptions

Respond with valid JSON matching this structure (all amounts as numbers without £ or commas):
{
  "profitBeforeTax": 0,
  "depreciation": 0,
  "increaseDecreaseInStocks": 0,
  "increaseDecreaseInDebtors": 0,
  "increaseDecreaseInCreditors": 0,
  "interestPaid": 0,
  "taxPaid": 0,
  "netCashFromOperatingActivities": 0,
  "purchaseOfTangibleAssets": 0,
  "proceedsFromSaleOfAssets": 0,
  "purchaseOfInvestments": 0,
  "netCashFromInvestingActivities": 0,
  "newLoansReceived": 0,
  "repaymentOfBorrowings": 0,
  "dividendsPaid": 0,
  "netCashFromFinancingActivities": 0,
  "netIncreaseDecreaseInCash": 0,
  "openingCash": 0,
  "closingCash": 0,
  "cashFlowStatement": "string",
  "reconciliationNotes": "string"
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt }
      ],
      temperature: 0.3, // Lower temperature for more precise financial calculations
      max_tokens: 4000,
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content || '{}';
    const result = JSON.parse(content) as CashFlowOutput;

    cashFlowLogger.info('Cash Flow Statement generated successfully', {
      companyNumber: input.companyNumber,
      netCashFromOperating: result.netCashFromOperatingActivities,
      netCashFromInvesting: result.netCashFromInvestingActivities,
      netCashFromFinancing: result.netCashFromFinancingActivities
    });

    return result;

  } catch (error: any) {
    cashFlowLogger.error('Error generating Cash Flow Statement:', error);
    throw new Error(`Failed to generate Cash Flow Statement: ${error.message}`);
  }
}

/**
 * Notes to Accounts AI Generator
 * 
 * Generates detailed accounting policy notes using OpenAI.
 * Costs 100 credits per generation.
 * 
 * UK Requirements:
 * - Accounting policies for all material items
 * - FRS 102 compliance
 * - Basis of preparation
 * - Going concern assessment
 * - Revenue recognition
 * - Depreciation policies
 * - Taxation
 * - Pensions and employee benefits
 */

import OpenAI from "openai";
import { logger } from "../../utils/logger";

const notesLogger = logger.withContext('NotesToAccountsAIGenerator');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export interface NotesToAccountsInput {
  companyName: string;
  companyNumber: string;
  periodEnd: string;
  accountingFramework?: string; // FRS 102, FRS 105, etc.
  entitySize?: 'micro' | 'small' | 'medium' | 'large';
  hasFixedAssets?: boolean;
  hasStock?: boolean;
  hasPensions?: boolean;
  hasLeases?: boolean;
  turnover?: number;
  industry?: string;
  specificPolicies?: string;
}

export interface NotesToAccountsOutput {
  basisOfPreparation: string;
  goingConcern: string;
  accountingPolicies: {
    turnover: string;
    tangibleFixedAssets: string;
    stock: string;
    taxation: string;
    pensionCosts: string;
    leases?: string;
    foreignCurrency?: string;
    financialInstruments?: string;
  };
  criticalAccountingJudgments: string;
  fullNotes: string;
}

/**
 * Generate detailed accounting policy notes
 */
export async function generateNotesToAccounts(
  input: NotesToAccountsInput
): Promise<NotesToAccountsOutput> {
  try {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key is not configured');
    }

    notesLogger.info('Generating notes to accounts', {
      companyName: input.companyName,
      companyNumber: input.companyNumber
    });

    const framework = input.accountingFramework || 'FRS 102';
    const entitySize = input.entitySize || 'small';

    const systemPrompt = `You are an expert UK chartered accountant specializing in preparing accounting policy notes that comply with ${framework} and Companies Act 2006 requirements.

Your role is to generate professional, technically accurate accounting policy notes for UK companies.

Key Requirements:
1. Comply with ${framework} Section 1A requirements (or full FRS 102 for larger entities)
2. Use technically correct accounting terminology
3. Be specific to the company's circumstances
4. Include all mandatory accounting policies
5. Follow FRC (Financial Reporting Council) guidance
6. Write in clear, professional language
7. Ensure consistency with statutory requirements

Output Format:
- Technically accurate accounting language
- Clear policy statements
- Appropriate level of detail for ${entitySize} entity
- Compliant with UK GAAP
- Professional presentation suitable for statutory accounts`;

    const prompt = `Generate comprehensive accounting policy notes for the following UK company:

Company Information:
- Name: ${input.companyName}
- Registration Number: ${input.companyNumber}
- Period Ending: ${input.periodEnd}
- Entity Size: ${entitySize}
- Accounting Framework: ${framework}
- Industry: ${input.industry || 'General trading'}

Balance Sheet Composition:
- Has Fixed Assets: ${input.hasFixedAssets ? 'Yes' : 'No'}
- Has Stock/Inventory: ${input.hasStock ? 'Yes' : 'No'}
- Has Pension Scheme: ${input.hasPensions ? 'Yes' : 'No'}
- Has Operating Leases: ${input.hasLeases ? 'Yes' : 'No'}

Financial Context:
- Turnover: £${input.turnover?.toLocaleString() || 'Not provided'}

Specific Requirements:
${input.specificPolicies || 'Standard policies for a UK trading company'}

Required Sections:
1. Basis of Preparation - Accounting framework and company information
2. Going Concern - Assessment of going concern basis
3. Accounting Policies:
   - Turnover recognition
   - Tangible fixed assets and depreciation
   - Stock/inventory valuation
   - Taxation (current and deferred)
   - Pension costs
   - Leases (if applicable)
   - Foreign currency (if applicable)
   - Financial instruments (if applicable)
4. Critical Accounting Judgments - Key estimates and assumptions

Generate comprehensive notes with structured accounting policies, plus a fullNotes field containing the complete formatted notes section.

Respond with valid JSON matching this structure:
{
  "basisOfPreparation": "string",
  "goingConcern": "string",
  "accountingPolicies": {
    "turnover": "string",
    "tangibleFixedAssets": "string",
    "stock": "string",
    "taxation": "string",
    "pensionCosts": "string",
    "leases": "string (optional)",
    "foreignCurrency": "string (optional)",
    "financialInstruments": "string (optional)"
  },
  "criticalAccountingJudgments": "string",
  "fullNotes": "string"
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt }
      ],
      temperature: 0.6, // Slightly lower for more consistent technical content
      max_tokens: 3500,
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content || '{}';
    const result = JSON.parse(content) as NotesToAccountsOutput;

    notesLogger.info('Notes to accounts generated successfully', {
      companyNumber: input.companyNumber,
      policies: Object.keys(result.accountingPolicies || {}).length
    });

    return result;

  } catch (error: any) {
    notesLogger.error('Error generating notes to accounts:', error);
    throw new Error(`Failed to generate notes to accounts: ${error.message}`);
  }
}

/**
 * Directors Report AI Generator
 * 
 * Generates compliant directors' reports from company data using OpenAI.
 * Costs 150 credits per generation.
 * 
 * Key UK Requirements:
 * - Principal activities and business review
 * - Results and dividends  
 * - Future developments
 * - Directors' names
 * - Political and charitable donations (if applicable)
 * - Financial instruments disclosures (if applicable)
 */

import OpenAI from "openai";
import { logger } from "../../utils/logger";

const directorsReportLogger = logger.withContext('DirectorsReportAIGenerator');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export interface DirectorsReportInput {
  companyName: string;
  companyNumber: string;
  periodEnd: string;
  directors: string[];
  principalActivities?: string;
  turnover?: number;
  profit?: number;
  dividends?: number;
  industry?: string;
  marketConditions?: string;
  futureOutlook?: string;
}

export interface DirectorsReportOutput {
  principalActivities: string;
  businessReview: string;
  resultsAndDividends: string;
  futureDevelopments: string;
  directorsStatement: string;
  politicalAndCharitableContributions: string;
  financialInstruments: string;
  fullReport: string;
}

/**
 * Generate a compliant directors' report using AI
 */
export async function generateDirectorsReport(
  input: DirectorsReportInput
): Promise<DirectorsReportOutput> {
  try {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key is not configured');
    }

    directorsReportLogger.info('Generating directors report', {
      companyName: input.companyName,
      companyNumber: input.companyNumber
    });

    const systemPrompt = `You are an expert UK corporate accountant and company secretary specializing in preparing directors' reports that comply with Companies Act 2006 requirements.

Your role is to generate professional, compliant directors' reports for small and medium-sized UK companies.

Key Requirements:
1. Follow Companies Act 2006 requirements for directors' reports
2. Write in formal, professional business language
3. Include all mandatory sections
4. Ensure content is specific and relevant to the company
5. Avoid generic boilerplate where possible
6. Include appropriate forward-looking statements
7. Comply with small companies regime exemptions where applicable

Output Format:
- Professional tone suitable for statutory accounts
- Clear section headings
- Concise but comprehensive content
- Specific to the company's circumstances
- Legally compliant language`;

    const prompt = `Generate a compliant directors' report for the following UK company:

Company Information:
- Name: ${input.companyName}
- Registration Number: ${input.companyNumber}
- Period Ending: ${input.periodEnd}
- Directors: ${input.directors.join(', ')}

Financial Information:
- Turnover: £${input.turnover?.toLocaleString() || 'Not provided'}
- Profit/(Loss): £${input.profit?.toLocaleString() || 'Not provided'}
- Dividends: £${input.dividends?.toLocaleString() || 'None'}

Business Context:
- Principal Activities: ${input.principalActivities || 'General trading company'}
- Industry: ${input.industry || 'Not specified'}
- Market Conditions: ${input.marketConditions || 'General UK market conditions'}
- Future Outlook: ${input.futureOutlook || 'Continued operations expected'}

Required Sections:
1. Principal Activities - Describe what the company does
2. Business Review - Review of performance during the period
3. Results and Dividends - Financial performance and dividend policy
4. Future Developments - Plans and outlook
5. Directors' Statement - Statement of directors' responsibilities
6. Political and Charitable Contributions - State if none
7. Financial Instruments - Brief disclosure if applicable

Generate a comprehensive directors' report with each section as a separate field, plus a fullReport field containing the complete formatted report.

Respond with valid JSON matching this structure:
{
  "principalActivities": "string",
  "businessReview": "string",
  "resultsAndDividends": "string",
  "futureDevelopments": "string",
  "directorsStatement": "string",
  "politicalAndCharitableContributions": "string",
  "financialInstruments": "string",
  "fullReport": "string"
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 3000,
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content || '{}';
    const result = JSON.parse(content) as DirectorsReportOutput;

    directorsReportLogger.info('Directors report generated successfully', {
      companyNumber: input.companyNumber,
      sections: Object.keys(result).length
    });

    return result;

  } catch (error: any) {
    directorsReportLogger.error('Error generating directors report:', error);
    throw new Error(`Failed to generate directors report: ${error.message}`);
  }
}

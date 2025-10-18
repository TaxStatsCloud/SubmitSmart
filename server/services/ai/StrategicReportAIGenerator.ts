/**
 * Strategic Report AI Generator
 * 
 * Generates compliant strategic reports for large companies using OpenAI.
 * Costs 200 credits per generation.
 * 
 * UK Requirements (Companies Act 2006 s414A-414D):
 * - Business model description
 * - Strategy and objectives
 * - Principal risks and uncertainties
 * - Key performance indicators (KPIs)
 * - Section 172(1) statement (directors' duty to promote success)
 * - Non-financial information (employees, environment, social matters)
 */

import OpenAI from "openai";
import { logger } from "../../utils/logger";

const strategicReportLogger = logger.withContext('StrategicReportAIGenerator');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export interface StrategicReportInput {
  companyName: string;
  companyNumber: string;
  periodEnd: string;
  turnover?: number;
  profit?: number;
  employees?: number;
  industry?: string;
  businessModel?: string;
  principalActivities?: string;
  strategicObjectives?: string;
  risks?: string;
  kpis?: string;
  environmentalImpact?: string;
  socialMatters?: string;
}

export interface StrategicReportOutput {
  businessModel: string;
  strategyAndObjectives: string;
  principalRisks: string;
  keyPerformanceIndicators: string;
  section172Statement: string;
  employeeMatters: string;
  environmentalMatters: string;
  socialMatters: string;
  fullReport: string;
}

/**
 * Generate a compliant strategic report for large companies
 */
export async function generateStrategicReport(
  input: StrategicReportInput
): Promise<StrategicReportOutput> {
  try {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key is not configured');
    }

    strategicReportLogger.info('Generating strategic report', {
      companyName: input.companyName,
      companyNumber: input.companyNumber
    });

    const systemPrompt = `You are an expert UK corporate governance specialist and strategic advisor with deep knowledge of Companies Act 2006 strategic reporting requirements.

Your role is to generate professional strategic reports for large UK companies that comply with sections 414A-414D of the Companies Act 2006.

Key Requirements:
1. Comply with Companies Act 2006 strategic reporting framework
2. Include all mandatory sections for large companies
3. Write in professional, forward-looking language
4. Provide specific, measurable KPIs
5. Address stakeholder interests comprehensively
6. Include Section 172(1) statement (directors' duty to promote success)
7. Cover non-financial information (employees, environment, social)

Output Format:
- Professional executive-level tone
- Strategic and forward-looking focus
- Specific to the company's circumstances
- Balanced view of performance, opportunities, and risks
- Compliant with FRC guidance on strategic reporting`;

    const prompt = `Generate a compliant strategic report for the following large UK company:

Company Information:
- Name: ${input.companyName}
- Registration Number: ${input.companyNumber}
- Period Ending: ${input.periodEnd}
- Industry: ${input.industry || 'General business'}

Financial Metrics:
- Turnover: £${input.turnover?.toLocaleString() || 'Not provided'}
- Profit/(Loss): £${input.profit?.toLocaleString() || 'Not provided'}
- Employees: ${input.employees || 'Not specified'}

Business Context:
- Principal Activities: ${input.principalActivities || 'Not specified'}
- Business Model: ${input.businessModel || 'Not specified - please infer from industry and activities'}
- Strategic Objectives: ${input.strategicObjectives || 'Sustainable growth and value creation'}
- Known Risks: ${input.risks || 'Market volatility, regulatory changes, competitive pressures'}
- KPIs: ${input.kpis || 'Revenue growth, profitability, customer satisfaction'}
- Environmental Impact: ${input.environmentalImpact || 'Standard for industry'}
- Social Matters: ${input.socialMatters || 'Employee welfare and community engagement'}

Required Sections:
1. Business Model - How the company generates value
2. Strategy and Objectives - Long-term plans and goals
3. Principal Risks and Uncertainties - Key threats to achieving objectives
4. Key Performance Indicators - Measurable metrics to track performance
5. Section 172(1) Statement - How directors have promoted company success while considering stakeholders
6. Employee Matters - Workforce policies and engagement
7. Environmental Matters - Environmental impact and initiatives
8. Social Matters - Community and social responsibility

Generate a comprehensive strategic report with each section as a separate field, plus a fullReport field containing the complete formatted document.

Respond with valid JSON matching this structure:
{
  "businessModel": "string",
  "strategyAndObjectives": "string",
  "principalRisks": "string",
  "keyPerformanceIndicators": "string",
  "section172Statement": "string",
  "employeeMatters": "string",
  "environmentalMatters": "string",
  "socialMatters": "string",
  "fullReport": "string"
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 4000,
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content || '{}';
    const result = JSON.parse(content) as StrategicReportOutput;

    strategicReportLogger.info('Strategic report generated successfully', {
      companyNumber: input.companyNumber,
      sections: Object.keys(result).length
    });

    return result;

  } catch (error: any) {
    strategicReportLogger.error('Error generating strategic report:', error);
    throw new Error(`Failed to generate strategic report: ${error.message}`);
  }
}

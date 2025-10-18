import OpenAI from "openai";
import { db } from "../db";
import { companies, filings, filingReminders, filingCosts } from "@shared/schema";
import { eq, and, gte, desc } from "drizzle-orm";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface FilingRecommendation {
  filingType: 'confirmation_statement' | 'annual_accounts' | 'corporation_tax';
  priority: 'high' | 'medium' | 'low';
  reason: string;
  dueDate?: string;
  creditCost: number;
  actionUrl: string;
  estimatedTime: string;
  benefits: string[];
}

export interface RecommendationContext {
  companyId: number;
  companyName: string;
  incorporationDate?: Date;
  accountingReferenceDate?: string;
  recentFilings: any[];
  upcomingDeadlines: any[];
  entitySize?: string;
}

/**
 * Generate AI-powered filing recommendations based on company data
 */
export async function generateFilingRecommendations(
  userId: number,
  companyId?: number
): Promise<FilingRecommendation[]> {
  try {
    // Get user's company
    const userCompanies = await db.query.companies.findMany({
      where: eq(companies.id, companyId || 1),
      limit: 1,
    });

    if (!userCompanies || userCompanies.length === 0) {
      return getDefaultRecommendations();
    }

    const company = userCompanies[0];

    // Get recent filings for this company
    const recentFilings = await db.query.filings.findMany({
      where: eq(filings.companyId, company.id),
      orderBy: [desc(filings.createdAt)],
      limit: 10,
    });

    // Get upcoming filing deadlines
    const upcomingDeadlines = await db.query.filingReminders.findMany({
      where: and(
        eq(filingReminders.companyId, company.id),
        gte(filingReminders.dueDate, new Date())
      ),
      orderBy: [desc(filingReminders.dueDate)],
      limit: 5,
    });

    // Get filing costs
    const costs = await db.query.filingCosts.findMany({
      where: eq(filingCosts.isActive, true),
    });

    const costMap = costs.reduce((acc: Record<string, number>, cost) => {
      acc[cost.filingType] = cost.creditCost;
      return acc;
    }, {} as Record<string, number>);

    // Build context for AI
    const context: RecommendationContext = {
      companyId: company.id,
      companyName: company.name,
      incorporationDate: company.incorporationDate,
      accountingReferenceDate: company.accountingReference || undefined,
      recentFilings: recentFilings.map((f: any) => ({
        type: f.type,
        status: f.status,
        dueDate: f.dueDate,
        submitDate: f.submitDate,
      })),
      upcomingDeadlines: upcomingDeadlines.map((d: any) => ({
        filingType: d.filingType,
        dueDate: d.dueDate,
        status: d.status,
      })),
    };

    // Generate AI-powered recommendations
    const recommendations = await generateAIRecommendations(context, costMap);
    
    return recommendations;
  } catch (error) {
    console.error('Error generating filing recommendations:', error);
    return getDefaultRecommendations();
  }
}

/**
 * Use OpenAI to analyze company context and generate smart recommendations
 */
async function generateAIRecommendations(
  context: RecommendationContext,
  costMap: Record<string, number>
): Promise<FilingRecommendation[]> {
  const today = new Date();
  const sixMonthsFromNow = new Date(today.getTime() + 180 * 24 * 60 * 60 * 1000);
  
  const prompt = `You are a UK corporate compliance expert. Analyze this company and recommend which filings they should prioritize.

Company: ${context.companyName}
Incorporation Date: ${context.incorporationDate || 'Unknown'}
Accounting Reference: ${context.accountingReferenceDate || 'Unknown'}

Recent Filings:
${context.recentFilings.length > 0 ? context.recentFilings.map(f => 
  `- ${f.type}: ${f.status} ${f.dueDate ? `(due: ${new Date(f.dueDate).toLocaleDateString('en-GB')})` : ''}`
).join('\n') : 'No recent filings'}

Upcoming Deadlines:
${context.upcomingDeadlines.length > 0 ? context.upcomingDeadlines.map(d => 
  `- ${d.filingType}: ${new Date(d.dueDate).toLocaleDateString('en-GB')} (${d.status})`
).join('\n') : 'No upcoming deadlines'}

Available Filing Types:
1. Confirmation Statement (CS01) - Annual requirement, low complexity
2. Annual Accounts (iXBRL) - FRC 2025 compliant, mandatory by April 2027
3. Corporation Tax (CT600) - Tax return filing

Based on this information, recommend 1-3 filings the company should prioritize. For each recommendation:
1. Identify the filing type (use exact: confirmation_statement, annual_accounts, or corporation_tax)
2. Set priority (high, medium, or low) based on urgency and legal requirements
3. Explain why this filing is important NOW (max 100 chars)
4. Estimate time to complete (e.g., "15-20 minutes", "1-2 hours")
5. List 2-3 key benefits (each max 60 chars)

Respond in JSON array format:
[
  {
    "filingType": "annual_accounts",
    "priority": "high",
    "reason": "Year-end approaching and iXBRL mandatory by April 2027",
    "estimatedTime": "1-2 hours",
    "benefits": ["Avoid £1,500+ late filing penalties", "iXBRL compliant for 2027", "Build filing history"]
  }
]

Important: Only recommend filings that are actually needed. Don't recommend if recently completed.`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a UK corporate compliance expert. Provide concise, actionable filing recommendations in JSON format."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 1000,
      response_format: { type: "json_object" }
    });

    const responseText = completion.choices[0]?.message?.content;
    if (!responseText) {
      throw new Error("No response from OpenAI");
    }

    // Parse AI response
    const aiResponse = JSON.parse(responseText);
    const aiRecommendations = Array.isArray(aiResponse) ? aiResponse : (aiResponse.recommendations || []);

    // Map AI recommendations to our format with costs and URLs
    const recommendations: FilingRecommendation[] = aiRecommendations.map((rec: any) => {
      const filingType = rec.filingType;
      const urlMap: Record<string, string> = {
        'confirmation_statement': '/wizards/confirmation-statement',
        'annual_accounts': '/wizards/annual-accounts',
        'corporation_tax': '/wizards/ct600'
      };

      // Find matching deadline if exists
      const matchingDeadline = context.upcomingDeadlines.find(d => 
        d.filingType === filingType
      );

      return {
        filingType,
        priority: rec.priority || 'medium',
        reason: rec.reason || `Complete your ${filingType.replace('_', ' ')} filing`,
        dueDate: matchingDeadline?.dueDate ? new Date(matchingDeadline.dueDate).toISOString() : undefined,
        creditCost: costMap[filingType] || 50,
        actionUrl: urlMap[filingType] || '/new-filing',
        estimatedTime: rec.estimatedTime || '30-45 minutes',
        benefits: rec.benefits || ['Stay compliant', 'Avoid penalties']
      };
    });

    return recommendations;
  } catch (error) {
    console.error('Error calling OpenAI for recommendations:', error);
    return getDefaultRecommendations();
  }
}

/**
 * Fallback recommendations when AI or data is unavailable
 */
function getDefaultRecommendations(): FilingRecommendation[] {
  return [
    {
      filingType: 'annual_accounts',
      priority: 'high',
      reason: 'Prepare for April 2027 iXBRL mandatory filing deadline',
      creditCost: 120,
      actionUrl: '/wizards/annual-accounts',
      estimatedTime: '1-2 hours',
      benefits: [
        'Avoid £1,500+ late filing penalties',
        'iXBRL compliant for April 2027',
        'Professional financial reporting'
      ]
    },
    {
      filingType: 'confirmation_statement',
      priority: 'medium',
      reason: 'Annual requirement to confirm company details',
      creditCost: 50,
      actionUrl: '/wizards/confirmation-statement',
      estimatedTime: '15-20 minutes',
      benefits: [
        'Quick and simple process',
        'Avoid £150+ late filing penalties',
        'Keep Companies House records current'
      ]
    }
  ];
}

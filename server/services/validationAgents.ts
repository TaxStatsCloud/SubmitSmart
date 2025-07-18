import { OpenAI } from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface ValidationResult {
  isValid: boolean;
  confidence: number;
  issues: ValidationIssue[];
  recommendations: string[];
  auditTrail: AuditTrailEntry[];
}

export interface ValidationIssue {
  severity: 'critical' | 'warning' | 'info';
  category: string;
  description: string;
  affectedItems: string[];
  suggestedFix: string;
  regulatoryReference?: string;
}

export interface AuditTrailEntry {
  timestamp: string;
  action: string;
  validator: string;
  result: string;
  evidence: any;
}

export class TrialBalanceValidationAgent {
  async validateTrialBalance(trialBalanceData: any): Promise<ValidationResult> {
    const issues: ValidationIssue[] = [];
    const auditTrail: AuditTrailEntry[] = [];
    
    // 1. Mathematical Accuracy Check
    const mathValidation = await this.validateMathematicalAccuracy(trialBalanceData);
    issues.push(...mathValidation.issues);
    auditTrail.push(...mathValidation.auditTrail);
    
    // 2. Account Code Validation
    const accountValidation = await this.validateAccountCodes(trialBalanceData);
    issues.push(...accountValidation.issues);
    auditTrail.push(...accountValidation.auditTrail);
    
    // 3. UK GAAP Compliance Check
    const gaapValidation = await this.validateGAAPCompliance(trialBalanceData);
    issues.push(...gaapValidation.issues);
    auditTrail.push(...gaapValidation.auditTrail);
    
    // 4. Completeness Check
    const completenessValidation = await this.validateCompleteness(trialBalanceData);
    issues.push(...completenessValidation.issues);
    auditTrail.push(...completenessValidation.auditTrail);

    const criticalIssues = issues.filter(i => i.severity === 'critical');
    const isValid = criticalIssues.length === 0;
    const confidence = this.calculateConfidenceScore(issues, trialBalanceData);

    return {
      isValid,
      confidence,
      issues,
      recommendations: this.generateRecommendations(issues),
      auditTrail
    };
  }

  private async validateMathematicalAccuracy(data: any) {
    const issues: ValidationIssue[] = [];
    const auditTrail: AuditTrailEntry[] = [];
    
    // Check if debits equal credits
    const totalDebits = data.entries?.reduce((sum: number, entry: any) => 
      sum + (entry.debit || 0), 0) || 0;
    const totalCredits = data.entries?.reduce((sum: number, entry: any) => 
      sum + (entry.credit || 0), 0) || 0;
    
    const difference = Math.abs(totalDebits - totalCredits);
    const tolerance = 0.01; // 1p tolerance for rounding
    
    auditTrail.push({
      timestamp: new Date().toISOString(),
      action: 'Mathematical Balance Check',
      validator: 'TrialBalanceValidationAgent',
      result: `Debits: £${totalDebits.toFixed(2)}, Credits: £${totalCredits.toFixed(2)}, Difference: £${difference.toFixed(2)}`,
      evidence: { totalDebits, totalCredits, difference, tolerance }
    });

    if (difference > tolerance) {
      issues.push({
        severity: 'critical',
        category: 'Mathematical Accuracy',
        description: `Trial balance does not balance. Difference of £${difference.toFixed(2)} between debits and credits.`,
        affectedItems: ['Trial Balance Total'],
        suggestedFix: 'Review all entries for data entry errors or missing transactions.',
        regulatoryReference: 'Companies Act 2006 - Section 394 (Duty to prepare individual accounts)'
      });
    }

    return { issues, auditTrail };
  }

  private async validateAccountCodes(data: any) {
    const issues: ValidationIssue[] = [];
    const auditTrail: AuditTrailEntry[] = [];
    
    const validAccountCodes = {
      // Assets (1000-1999)
      1000: 'Fixed Assets - Intangible',
      1100: 'Fixed Assets - Tangible',
      1200: 'Current Assets - Stock',
      1300: 'Current Assets - Debtors',
      1400: 'Current Assets - Cash',
      // Liabilities (2000-2999)
      2000: 'Creditors - Amounts falling due within one year',
      2100: 'Creditors - Amounts falling due after more than one year',
      2200: 'Provisions for liabilities',
      // Capital (3000-3999)
      3000: 'Called up share capital',
      3100: 'Share premium account',
      3200: 'Revaluation reserve',
      3300: 'Profit and loss account',
      // Income (4000-4999)
      4000: 'Turnover',
      4100: 'Other operating income',
      // Expenses (5000-9999)
      5000: 'Cost of sales',
      6000: 'Administrative expenses',
      7000: 'Distribution costs',
      8000: 'Other operating charges',
      9000: 'Interest and similar charges'
    };

    const invalidCodes: string[] = [];
    
    data.entries?.forEach((entry: any) => {
      const accountCode = entry.accountCode;
      if (accountCode && !this.isValidAccountCode(accountCode, validAccountCodes)) {
        invalidCodes.push(accountCode);
      }
    });

    auditTrail.push({
      timestamp: new Date().toISOString(),
      action: 'Account Code Validation',
      validator: 'TrialBalanceValidationAgent',
      result: `Checked ${data.entries?.length || 0} entries, found ${invalidCodes.length} invalid codes`,
      evidence: { totalEntries: data.entries?.length, invalidCodes }
    });

    if (invalidCodes.length > 0) {
      issues.push({
        severity: 'warning',
        category: 'Account Classification',
        description: `Found ${invalidCodes.length} potentially invalid account codes.`,
        affectedItems: invalidCodes,
        suggestedFix: 'Review account codes against standard UK chart of accounts.',
        regulatoryReference: 'FRS 102 - Presentation of Financial Statements'
      });
    }

    return { issues, auditTrail };
  }

  private async validateGAAPCompliance(data: any) {
    const issues: ValidationIssue[] = [];
    const auditTrail: AuditTrailEntry[] = [];

    // Use AI to check for GAAP compliance patterns
    const prompt = `As a UK chartered accountant, analyze this trial balance data for FRS 102 compliance issues:

${JSON.stringify(data, null, 2)}

Check for:
1. Proper classification of assets and liabilities
2. Correct presentation of share capital
3. Appropriate grouping of income and expenses
4. Missing mandatory disclosures

Respond with JSON: { "issues": [{"severity": "critical|warning|info", "description": "...", "reference": "FRS 102 section"}] }`;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0.1
      });

      const aiAnalysis = JSON.parse(response.choices[0].message.content || '{"issues":[]}');
      
      aiAnalysis.issues?.forEach((aiIssue: any) => {
        issues.push({
          severity: aiIssue.severity || 'info',
          category: 'UK GAAP Compliance',
          description: aiIssue.description,
          affectedItems: ['Trial Balance Structure'],
          suggestedFix: aiIssue.suggestedFix || 'Review FRS 102 requirements',
          regulatoryReference: aiIssue.reference
        });
      });

      auditTrail.push({
        timestamp: new Date().toISOString(),
        action: 'UK GAAP Compliance Check',
        validator: 'TrialBalanceValidationAgent',
        result: `AI analysis completed, found ${aiAnalysis.issues?.length || 0} compliance issues`,
        evidence: { aiAnalysis, tokensUsed: response.usage?.total_tokens }
      });

    } catch (error) {
      auditTrail.push({
        timestamp: new Date().toISOString(),
        action: 'UK GAAP Compliance Check',
        validator: 'TrialBalanceValidationAgent',
        result: 'AI analysis failed',
        evidence: { error: error.message }
      });
    }

    return { issues, auditTrail };
  }

  private async validateCompleteness(data: any) {
    const issues: ValidationIssue[] = [];
    const auditTrail: AuditTrailEntry[] = [];

    const requiredAccountTypes = [
      { code: '1000-1999', name: 'Assets', required: true },
      { code: '2000-2999', name: 'Liabilities', required: true },
      { code: '3000-3999', name: 'Equity', required: true }
    ];

    const presentAccountTypes = new Set();
    data.entries?.forEach((entry: any) => {
      const code = parseInt(entry.accountCode);
      if (code >= 1000 && code <= 1999) presentAccountTypes.add('Assets');
      if (code >= 2000 && code <= 2999) presentAccountTypes.add('Liabilities');
      if (code >= 3000 && code <= 3999) presentAccountTypes.add('Equity');
    });

    const missingTypes = requiredAccountTypes
      .filter(type => type.required && !presentAccountTypes.has(type.name))
      .map(type => type.name);

    auditTrail.push({
      timestamp: new Date().toISOString(),
      action: 'Completeness Check',
      validator: 'TrialBalanceValidationAgent',
      result: `Found account types: ${Array.from(presentAccountTypes).join(', ')}`,
      evidence: { presentAccountTypes: Array.from(presentAccountTypes), missingTypes }
    });

    if (missingTypes.length > 0) {
      issues.push({
        severity: 'warning',
        category: 'Completeness',
        description: `Missing required account types: ${missingTypes.join(', ')}`,
        affectedItems: missingTypes,
        suggestedFix: 'Ensure all major account categories are represented in the trial balance.',
        regulatoryReference: 'Companies Act 2006 - Schedule 1 (Balance Sheet Formats)'
      });
    }

    return { issues, auditTrail };
  }

  private isValidAccountCode(code: string, validCodes: any): boolean {
    const numCode = parseInt(code);
    if (isNaN(numCode)) return false;
    
    // Check if it falls within valid ranges
    return (numCode >= 1000 && numCode <= 9999);
  }

  private calculateConfidenceScore(issues: ValidationIssue[], data: any): number {
    let score = 100;
    
    issues.forEach(issue => {
      switch (issue.severity) {
        case 'critical': score -= 25; break;
        case 'warning': score -= 10; break;
        case 'info': score -= 2; break;
      }
    });

    return Math.max(0, Math.min(100, score));
  }

  private generateRecommendations(issues: ValidationIssue[]): string[] {
    const recommendations: string[] = [];
    
    const criticalIssues = issues.filter(i => i.severity === 'critical');
    if (criticalIssues.length > 0) {
      recommendations.push('Address all critical issues before proceeding with filing.');
    }

    const mathIssues = issues.filter(i => i.category === 'Mathematical Accuracy');
    if (mathIssues.length > 0) {
      recommendations.push('Verify source documents and recalculate all balances.');
    }

    const complianceIssues = issues.filter(i => i.category === 'UK GAAP Compliance');
    if (complianceIssues.length > 0) {
      recommendations.push('Consult FRS 102 guidance for proper account classification.');
    }

    if (recommendations.length === 0) {
      recommendations.push('Trial balance validation passed. Proceed with confidence.');
    }

    return recommendations;
  }
}

export class FinancialStatementValidationAgent {
  async validateFinancialStatements(statements: any): Promise<ValidationResult> {
    const issues: ValidationIssue[] = [];
    const auditTrail: AuditTrailEntry[] = [];

    // 1. Cross-statement consistency
    const consistencyValidation = await this.validateCrossStatementConsistency(statements);
    issues.push(...consistencyValidation.issues);
    auditTrail.push(...consistencyValidation.auditTrail);

    // 2. Regulatory format compliance
    const formatValidation = await this.validateRegulatoryFormat(statements);
    issues.push(...formatValidation.issues);
    auditTrail.push(...formatValidation.auditTrail);

    // 3. Disclosure requirements
    const disclosureValidation = await this.validateDisclosures(statements);
    issues.push(...disclosureValidation.issues);
    auditTrail.push(...disclosureValidation.auditTrail);

    const criticalIssues = issues.filter(i => i.severity === 'critical');
    const isValid = criticalIssues.length === 0;
    const confidence = this.calculateConfidenceScore(issues);

    return {
      isValid,
      confidence,
      issues,
      recommendations: this.generateRecommendations(issues),
      auditTrail
    };
  }

  private async validateCrossStatementConsistency(statements: any) {
    const issues: ValidationIssue[] = [];
    const auditTrail: AuditTrailEntry[] = [];

    // Check if P&L net profit matches movement in retained earnings
    const netProfit = statements.profitLoss?.netProfit || 0;
    const retainedEarningsMovement = statements.balanceSheet?.retainedEarningsMovement || 0;
    
    const difference = Math.abs(netProfit - retainedEarningsMovement);
    
    auditTrail.push({
      timestamp: new Date().toISOString(),
      action: 'Cross-Statement Consistency Check',
      validator: 'FinancialStatementValidationAgent',
      result: `Net Profit: £${netProfit}, Retained Earnings Movement: £${retainedEarningsMovement}`,
      evidence: { netProfit, retainedEarningsMovement, difference }
    });

    if (difference > 0.01) {
      issues.push({
        severity: 'critical',
        category: 'Cross-Statement Consistency',
        description: `Net profit (£${netProfit}) does not match retained earnings movement (£${retainedEarningsMovement})`,
        affectedItems: ['Profit & Loss', 'Balance Sheet'],
        suggestedFix: 'Verify dividend payments and other equity movements are properly recorded.',
        regulatoryReference: 'FRS 102 Section 6 - Statement of Changes in Equity'
      });
    }

    return { issues, auditTrail };
  }

  private async validateRegulatoryFormat(statements: any) {
    const issues: ValidationIssue[] = [];
    const auditTrail: AuditTrailEntry[] = [];

    // Use AI to validate format compliance
    const prompt = `As a UK chartered accountant, validate these financial statements against Companies Act 2006 and FRS 102 format requirements:

${JSON.stringify(statements, null, 2)}

Check for:
1. Proper balance sheet format (Format 1 or 2)
2. P&L layout compliance
3. Required comparative figures
4. Mandatory notes and disclosures

Respond with JSON: { "formatIssues": [{"severity": "critical|warning", "description": "...", "reference": "..."}] }`;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0.1
      });

      const aiAnalysis = JSON.parse(response.choices[0].message.content || '{"formatIssues":[]}');
      
      aiAnalysis.formatIssues?.forEach((issue: any) => {
        issues.push({
          severity: issue.severity || 'warning',
          category: 'Regulatory Format',
          description: issue.description,
          affectedItems: ['Financial Statement Format'],
          suggestedFix: 'Adjust format to comply with statutory requirements',
          regulatoryReference: issue.reference
        });
      });

      auditTrail.push({
        timestamp: new Date().toISOString(),
        action: 'Regulatory Format Validation',
        validator: 'FinancialStatementValidationAgent',
        result: `AI validation completed, found ${aiAnalysis.formatIssues?.length || 0} format issues`,
        evidence: { aiAnalysis }
      });

    } catch (error) {
      auditTrail.push({
        timestamp: new Date().toISOString(),
        action: 'Regulatory Format Validation',
        validator: 'FinancialStatementValidationAgent',
        result: 'AI validation failed',
        evidence: { error: error.message }
      });
    }

    return { issues, auditTrail };
  }

  private async validateDisclosures(statements: any) {
    const issues: ValidationIssue[] = [];
    const auditTrail: AuditTrailEntry[] = [];

    const requiredDisclosures = [
      'Accounting policies',
      'Turnover analysis',
      'Employee information',
      'Directors\' remuneration'
    ];

    const missingDisclosures = requiredDisclosures.filter(disclosure => 
      !statements.notes?.some((note: any) => 
        note.title?.toLowerCase().includes(disclosure.toLowerCase())
      )
    );

    auditTrail.push({
      timestamp: new Date().toISOString(),
      action: 'Disclosure Requirements Check',
      validator: 'FinancialStatementValidationAgent',
      result: `Checked ${requiredDisclosures.length} required disclosures, ${missingDisclosures.length} missing`,
      evidence: { requiredDisclosures, missingDisclosures, presentNotes: statements.notes?.length || 0 }
    });

    if (missingDisclosures.length > 0) {
      issues.push({
        severity: 'warning',
        category: 'Disclosure Requirements',
        description: `Missing required disclosures: ${missingDisclosures.join(', ')}`,
        affectedItems: missingDisclosures,
        suggestedFix: 'Add missing note disclosures as required by Companies Act 2006.',
        regulatoryReference: 'Companies Act 2006 - Schedule 1'
      });
    }

    return { issues, auditTrail };
  }

  private calculateConfidenceScore(issues: ValidationIssue[]): number {
    let score = 100;
    
    issues.forEach(issue => {
      switch (issue.severity) {
        case 'critical': score -= 30; break;
        case 'warning': score -= 15; break;
        case 'info': score -= 5; break;
      }
    });

    return Math.max(0, Math.min(100, score));
  }

  private generateRecommendations(issues: ValidationIssue[]): string[] {
    const recommendations: string[] = [];
    
    const criticalIssues = issues.filter(i => i.severity === 'critical');
    if (criticalIssues.length > 0) {
      recommendations.push('Critical issues found - statements not suitable for filing until resolved.');
    }

    const formatIssues = issues.filter(i => i.category === 'Regulatory Format');
    if (formatIssues.length > 0) {
      recommendations.push('Review Companies Act 2006 format requirements.');
    }

    if (recommendations.length === 0) {
      recommendations.push('Financial statements validation passed - suitable for statutory filing.');
    }

    return recommendations;
  }
}
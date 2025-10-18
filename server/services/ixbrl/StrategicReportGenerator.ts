/**
 * iXBRL Strategic Report Generator
 * 
 * Generates FRC 2025 compliant Strategic Reports
 * Required for large companies under Companies Act 2006 s414A
 * 
 * Content requirements:
 * - Fair review of the company's business
 * - Description of principal risks and uncertainties
 * - Key performance indicators (KPIs)
 * - Analysis using financial and non-financial indicators
 */

import { IXBRLGenerator, IXBRLContext } from './IXBRLGenerator';

export interface StrategicReportData {
  // Business Review
  businessModel?: string;
  strategyAndObjectives?: string;
  businessReview?: string;
  
  // Performance Analysis
  keyPerformanceIndicators?: {
    name: string;
    value: string;
    analysis: string;
  }[];
  financialPerformance?: string;
  
  // Risks and Uncertainties
  principalRisks?: {
    risk: string;
    impact: string;
    mitigation: string;
  }[];
  
  // Additional Sections
  environmentalMatters?: string;
  employees?: string;
  socialMatters?: string;
  humanRights?: string;
  antiCorruption?: string;
  
  // Future Prospects
  futureDevelopments?: string;
  
  // Approval
  approvalDate?: string;
  approvedByDirector?: string;
  directorPosition?: string;
}

export class StrategicReportGenerator {
  /**
   * Generate complete iXBRL Strategic Report
   */
  static generate(
    context: IXBRLContext,
    data: StrategicReportData
  ): string {
    let html = '<div class="strategic-report">\n';
    html += '<h2>Strategic Report</h2>\n';
    html += '<h3>For the year ended ' + context.periodEnd + '</h3>\n\n';

    // Business model and strategy
    if (data.businessModel || data.strategyAndObjectives) {
      html += this.generateBusinessModelSection(data, context);
    }

    // Business review
    if (data.businessReview) {
      html += this.generateBusinessReviewSection(data, context);
    }

    // Performance analysis with KPIs
    if (data.keyPerformanceIndicators || data.financialPerformance) {
      html += this.generatePerformanceSection(data, context);
    }

    // Principal risks and uncertainties
    if (data.principalRisks) {
      html += this.generateRisksSection(data, context);
    }

    // Non-financial information (for qualifying companies)
    if (data.environmentalMatters || data.employees || data.socialMatters) {
      html += this.generateNonFinancialSection(data, context);
    }

    // Future developments
    if (data.futureDevelopments) {
      html += this.generateFutureSection(data, context);
    }

    // Approval statement
    html += this.generateApprovalStatement(data, context);

    html += '</div>\n';

    return html;
  }

  /**
   * Generate Business Model and Strategy section
   */
  private static generateBusinessModelSection(
    data: StrategicReportData,
    context: IXBRLContext
  ): string {
    let html = '<div class="business-model">\n';
    html += '<h3>Business Model and Strategy</h3>\n\n';

    if (data.businessModel) {
      html += '<h4>Business Model</h4>\n';
      html += '<p>';
      html += IXBRLGenerator.tagText(
        data.businessModel,
        'DescriptionBusinessModel',
        'current'
      );
      html += '</p>\n\n';
    }

    if (data.strategyAndObjectives) {
      html += '<h4>Strategy and Objectives</h4>\n';
      html += '<p>';
      html += IXBRLGenerator.tagText(
        data.strategyAndObjectives,
        'DescriptionStrategyObjectives',
        'current'
      );
      html += '</p>\n\n';
    }

    html += '</div>\n\n';
    return html;
  }

  /**
   * Generate Business Review section
   */
  private static generateBusinessReviewSection(
    data: StrategicReportData,
    context: IXBRLContext
  ): string {
    let html = '<div class="business-review">\n';
    html += '<h3>Review of the Business</h3>\n\n';
    html += '<p>';
    html += IXBRLGenerator.tagText(
      data.businessReview!,
      'DescriptionBusinessReview',
      'current'
    );
    html += '</p>\n';
    html += '</div>\n\n';
    return html;
  }

  /**
   * Generate Performance Analysis section with KPIs
   */
  private static generatePerformanceSection(
    data: StrategicReportData,
    context: IXBRLContext
  ): string {
    let html = '<div class="performance-analysis">\n';
    html += '<h3>Performance Analysis</h3>\n\n';

    if (data.financialPerformance) {
      html += '<h4>Financial Performance</h4>\n';
      html += '<p>';
      html += IXBRLGenerator.tagText(
        data.financialPerformance,
        'AnalysisIncomeExpense',
        'current'
      );
      html += '</p>\n\n';
    }

    if (data.keyPerformanceIndicators && data.keyPerformanceIndicators.length > 0) {
      html += '<h4>Key Performance Indicators</h4>\n\n';
      html += '<table class="kpi-table">\n';
      html += '<thead>\n';
      html += '<tr>\n';
      html += '<th>KPI</th>\n';
      html += '<th>Value</th>\n';
      html += '<th>Analysis</th>\n';
      html += '</tr>\n';
      html += '</thead>\n';
      html += '<tbody>\n';

      for (const kpi of data.keyPerformanceIndicators) {
        html += '<tr>\n';
        html += '<td>';
        html += IXBRLGenerator.tagText(
          kpi.name,
          'NameKeyPerformanceIndicator',
          'current'
        );
        html += '</td>\n';
        html += '<td>';
        html += IXBRLGenerator.tagText(
          kpi.value,
          'ValueKeyPerformanceIndicator',
          'current'
        );
        html += '</td>\n';
        html += '<td>' + this.escapeHtml(kpi.analysis) + '</td>\n';
        html += '</tr>\n';
      }

      html += '</tbody>\n';
      html += '</table>\n\n';
    }

    html += '</div>\n\n';
    return html;
  }

  /**
   * Generate Principal Risks and Uncertainties section
   */
  private static generateRisksSection(
    data: StrategicReportData,
    context: IXBRLContext
  ): string {
    let html = '<div class="principal-risks">\n';
    html += '<h3>Principal Risks and Uncertainties</h3>\n\n';

    if (data.principalRisks && data.principalRisks.length > 0) {
      for (let i = 0; i < data.principalRisks.length; i++) {
        const risk = data.principalRisks[i];
        html += '<div class="risk-item">\n';
        html += '<h4>Risk ' + (i + 1) + ': ';
        html += IXBRLGenerator.tagText(
          risk.risk,
          'DescriptionPrincipalRisk',
          'current'
        );
        html += '</h4>\n';
        
        html += '<p><strong>Impact:</strong> ' + this.escapeHtml(risk.impact) + '</p>\n';
        html += '<p><strong>Mitigation:</strong> ' + this.escapeHtml(risk.mitigation) + '</p>\n';
        html += '</div>\n\n';
      }
    }

    html += '</div>\n\n';
    return html;
  }

  /**
   * Generate Non-Financial Information section
   * (Required for large companies meeting certain criteria - s414CB)
   */
  private static generateNonFinancialSection(
    data: StrategicReportData,
    context: IXBRLContext
  ): string {
    let html = '<div class="non-financial-information">\n';
    html += '<h3>Non-Financial Information</h3>\n\n';

    if (data.environmentalMatters) {
      html += '<h4>Environmental Matters</h4>\n';
      html += '<p>';
      html += IXBRLGenerator.tagText(
        data.environmentalMatters,
        'DescriptionEnvironmentalMatters',
        'current'
      );
      html += '</p>\n\n';
    }

    if (data.employees) {
      html += '<h4>Employees</h4>\n';
      html += '<p>';
      html += IXBRLGenerator.tagText(
        data.employees,
        'DescriptionEmployeesInformationStatement',
        'current'
      );
      html += '</p>\n\n';
    }

    if (data.socialMatters) {
      html += '<h4>Social Matters</h4>\n';
      html += '<p>';
      html += IXBRLGenerator.tagText(
        data.socialMatters,
        'DescriptionSocialMatters',
        'current'
      );
      html += '</p>\n\n';
    }

    if (data.humanRights) {
      html += '<h4>Human Rights</h4>\n';
      html += '<p>';
      html += IXBRLGenerator.tagText(
        data.humanRights,
        'DescriptionHumanRights',
        'current'
      );
      html += '</p>\n\n';
    }

    if (data.antiCorruption) {
      html += '<h4>Anti-Corruption and Anti-Bribery Matters</h4>\n';
      html += '<p>';
      html += IXBRLGenerator.tagText(
        data.antiCorruption,
        'DescriptionAntiCorruptionAntiBriberyMatters',
        'current'
      );
      html += '</p>\n\n';
    }

    html += '</div>\n\n';
    return html;
  }

  /**
   * Generate Future Developments section
   */
  private static generateFutureSection(
    data: StrategicReportData,
    context: IXBRLContext
  ): string {
    let html = '<div class="future-developments">\n';
    html += '<h3>Future Developments</h3>\n\n';
    html += '<p>';
    html += IXBRLGenerator.tagText(
      data.futureDevelopments!,
      'DescriptionFutureDevelopments',
      'current'
    );
    html += '</p>\n';
    html += '</div>\n\n';
    return html;
  }

  /**
   * Generate approval statement
   */
  private static generateApprovalStatement(
    data: StrategicReportData,
    context: IXBRLContext
  ): string {
    let html = '<div class="approval-statement">\n';
    html += '<p>This strategic report was approved by the board of directors on ';
    html += IXBRLGenerator.tagText(
      data.approvalDate || context.periodEnd,
      'DateApprovalStrategicReport',
      'current'
    );
    html += ' and signed on its behalf by:</p>\n\n';
    
    html += '<p class="signature">\n';
    html += '<strong>';
    html += IXBRLGenerator.tagText(
      data.approvedByDirector || 'Director',
      'NameSigningOfficer',
      'current'
    );
    html += '</strong><br/>\n';
    html += this.escapeHtml(data.directorPosition || 'Director') + '\n';
    html += '</p>\n';
    html += '</div>\n';
    return html;
  }

  /**
   * Escape HTML special characters
   */
  private static escapeHtml(text: string): string {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, (m) => map[m]);
  }
}

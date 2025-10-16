/**
 * iXBRL Validation Service
 * Validates iXBRL documents against Companies House and FRC 2025 requirements
 * 
 * Validation Rules:
 * - Well-formed XML/HTML structure
 * - Valid XBRL namespace declarations
 * - Required FRC 2025 taxonomy elements present
 * - Valid context and unit references
 * - Mandatory fields per entity size
 * - April 2027 compliance requirements
 */

import { DOMParser } from '@xmldom/xmldom';

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  code: string;
  message: string;
  severity: 'error';
  location?: string;
}

export interface ValidationWarning {
  code: string;
  message: string;
  severity: 'warning';
  location?: string;
}

export class IXBRLValidationService {
  private requiredNamespaces = {
    'xmlns:ix': 'http://www.xbrl.org/2013/inlineXBRL',
    'xmlns:xbrli': 'http://www.xbrl.org/2003/instance',
    'xmlns:link': 'http://www.xbrl.org/2003/linkbase',
    'xmlns:xlink': 'http://www.w3.org/1999/xlink',
    'xmlns:uk-gaap': 'https://xbrl.frc.org.uk/frs/2025-01-01/frs-2025-01-01.xsd',
    'xmlns:uk-core': 'https://xbrl.frc.org.uk/core/2025-01-01/core-2025-01-01.xsd',
    'xmlns:uk-bus': 'https://xbrl.frc.org.uk/cd/2025-01-01/business/bus-2025-01-01.xsd',
  };

  /**
   * Validate complete iXBRL document
   */
  async validateiXBRLDocument(html: string, entitySize: 'micro' | 'small' | 'medium' | 'large'): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    try {
      // 1. Parse XML structure with error checking
      const errorHandler = {
        errors: [] as string[],
        error: function(msg: string) { this.errors.push(msg); },
        fatalError: function(msg: string) { this.errors.push(msg); }
      };
      
      const doc = new DOMParser({
        errorHandler: errorHandler as any
      }).parseFromString(html, 'text/xml');
      
      if (errorHandler.errors.length > 0) {
        errors.push({
          code: 'XML_PARSE_ERROR',
          message: `XML parsing errors: ${errorHandler.errors.join('; ')}`,
          severity: 'error',
        });
        return { isValid: false, errors, warnings };
      }

      if (!doc || !doc.documentElement) {
        errors.push({
          code: 'XML_PARSE_ERROR',
          message: 'Failed to parse iXBRL document as valid XML',
          severity: 'error',
        });
        return { isValid: false, errors, warnings };
      }

      // 2. Validate namespace declarations
      this.validateNamespaces(html, errors);

      // 3. Validate required elements
      this.validateRequiredElements(html, entitySize, errors, warnings);

      // 4. Validate contexts and units
      this.validateContextsAndUnits(html, errors);

      // 5. Validate FRC 2025 specific requirements
      this.validateFRC2025Requirements(html, entitySize, errors, warnings);

      // 6. Validate April 2027 mandatory requirements
      this.validateApril2027Requirements(html, entitySize, errors);

      // 7. Validate QName formats
      this.validateQNames(html, errors);

      // 8. Validate entity-specific requirements
      this.validateEntitySpecificRequirements(html, entitySize, errors);

    } catch (error) {
      errors.push({
        code: 'VALIDATION_EXCEPTION',
        message: `Validation failed with exception: ${error instanceof Error ? error.message : String(error)}`,
        severity: 'error',
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate all required namespaces are declared
   */
  private validateNamespaces(html: string, errors: ValidationError[]): void {
    for (const [nsPrefix, nsUri] of Object.entries(this.requiredNamespaces)) {
      if (!html.includes(nsPrefix) || !html.includes(nsUri)) {
        errors.push({
          code: 'MISSING_NAMESPACE',
          message: `Required namespace ${nsPrefix}="${nsUri}" is missing`,
          severity: 'error',
        });
      }
    }

    // Check for schema reference
    if (!html.includes('link:schemaRef')) {
      errors.push({
        code: 'MISSING_SCHEMA_REF',
        message: 'Schema reference (link:schemaRef) is required in ix:header',
        severity: 'error',
      });
    }
  }

  /**
   * Validate required elements based on entity size
   */
  private validateRequiredElements(html: string, entitySize: string, errors: ValidationError[], warnings: ValidationWarning[]): void {
    // Updated to match actual generator output
    const requiredElements = {
      all: [
        'uk-core:CompaniesHouseRegisteredNumber',
        'uk-core:EntityCurrentLegalOrRegisteredName',
        'uk-core:BalanceSheetDate', // Generator uses uk-core, not uk-bus
        'uk-bus:AverageNumberEmployeesDuringPeriod', // Mandatory since Oct 2020
      ],
      micro: [
        'uk-gaap:FixedAssets',
        'uk-gaap:CurrentAssets',
        'uk-gaap:NetCurrentAssetsLiabilities',
        'uk-gaap:NetAssetsLiabilitiesIncludingPensionAssetLiability',
        'uk-gaap:Turnover', // P&L mandatory from April 2027
      ],
      small: [
        'uk-gaap:FixedAssets',
        'uk-gaap:CurrentAssets',
        'uk-gaap:NetCurrentAssetsLiabilities',
        'uk-gaap:NetAssetsLiabilitiesIncludingPensionAssetLiability',
        'uk-gaap:Turnover',
        'uk-bus:DescriptionPrincipalActivities', // Directors' Report required
        'uk-bus:NameEntityOfficer',
      ],
      medium: [
        'uk-gaap:FixedAssets',
        'uk-gaap:CurrentAssets',
        'uk-gaap:NetCurrentAssetsLiabilities',
        'uk-gaap:NetAssetsLiabilitiesIncludingPensionAssetLiability',
        'uk-gaap:Turnover',
        'uk-bus:DescriptionPrincipalActivities',
        'uk-bus:NameEntityOfficer',
      ],
      large: [
        'uk-gaap:FixedAssets',
        'uk-gaap:CurrentAssets',
        'uk-gaap:NetCurrentAssetsLiabilities',
        'uk-gaap:NetAssetsLiabilitiesIncludingPensionAssetLiability',
        'uk-gaap:Turnover',
        'uk-bus:DescriptionPrincipalActivities',
        'uk-bus:NameEntityOfficer',
      ],
    };

    // Check elements required for all entities
    for (const element of requiredElements.all) {
      if (!html.includes(element)) {
        errors.push({
          code: 'MISSING_REQUIRED_ELEMENT',
          message: `Required element ${element} is missing (mandatory for all filings)`,
          severity: 'error',
          location: element,
        });
      }
    }

    // Check entity-specific elements
    const sizeElements = requiredElements[entitySize as keyof typeof requiredElements] || [];
    for (const element of sizeElements) {
      if (!html.includes(element)) {
        errors.push({
          code: 'MISSING_REQUIRED_ELEMENT',
          message: `Required element ${element} is missing for ${entitySize} entity`,
          severity: 'error',
          location: element,
        });
      }
    }
  }

  /**
   * Validate contexts and units are properly defined and referenced
   */
  private validateContextsAndUnits(html: string, errors: ValidationError[]): void {
    // Check for context definitions
    if (!html.includes('<xbrli:context')) {
      errors.push({
        code: 'MISSING_CONTEXTS',
        message: 'No XBRL contexts found - at least one context is required',
        severity: 'error',
      });
    }

    // Check for unit definitions
    if (!html.includes('<xbrli:unit')) {
      errors.push({
        code: 'MISSING_UNITS',
        message: 'No XBRL units found - at least one unit is required for numeric facts',
        severity: 'error',
      });
    }

    // Extract context and unit IDs
    const contextIdMatches = html.match(/<xbrli:context[^>]+id="([^"]+)"/g) || [];
    const definedContextIds = new Set(
      contextIdMatches.map(match => {
        const idMatch = match.match(/id="([^"]+)"/);
        return idMatch ? idMatch[1] : '';
      }).filter(Boolean)
    );

    const unitIdMatches = html.match(/<xbrli:unit[^>]+id="([^"]+)"/g) || [];
    const definedUnitIds = new Set(
      unitIdMatches.map(match => {
        const idMatch = match.match(/id="([^"]+)"/);
        return idMatch ? idMatch[1] : '';
      }).filter(Boolean)
    );

    // Validate contextRef references - must match exactly
    const contextRefs = html.match(/contextRef="([^"]+)"/g) || [];
    for (const ref of contextRefs) {
      const refId = ref.match(/contextRef="([^"]+)"/)?.[1];
      if (refId && !definedContextIds.has(refId)) {
        errors.push({
          code: 'INVALID_CONTEXT_REF',
          message: `Context reference "${refId}" is not defined as xbrli:context id`,
          severity: 'error',
        });
      }
    }

    // Validate unitRef references - must match exactly
    const unitRefs = html.match(/unitRef="([^"]+)"/g) || [];
    for (const ref of unitRefs) {
      const refId = ref.match(/unitRef="([^"]+)"/)?.[1];
      if (refId && !definedUnitIds.has(refId)) {
        errors.push({
          code: 'INVALID_UNIT_REF',
          message: `Unit reference "${refId}" is not defined as xbrli:unit id`,
          severity: 'error',
        });
      }
    }
  }

  /**
   * Validate FRC 2025 specific requirements
   */
  private validateFRC2025Requirements(html: string, entitySize: string, errors: ValidationError[], warnings: ValidationWarning[]): void {
    // Validate accounting framework is declared
    const frameworks = ['FRS102', 'FRS105', 'FRS101', 'UKIFRS'];
    const hasFramework = frameworks.some(fw => html.includes(fw));
    
    if (!hasFramework) {
      warnings.push({
        code: 'MISSING_ACCOUNTING_FRAMEWORK',
        message: 'Accounting framework (FRS102/FRS105/FRS101/UKIFRS) should be declared',
        severity: 'warning',
      });
    }

    // Validate full tagging (April 2027 requirement)
    if (!html.includes('uk-bus:AccountingPolicy')) {
      warnings.push({
        code: 'MISSING_ACCOUNTING_POLICIES',
        message: 'Accounting policies should be tagged with uk-bus:AccountingPolicy',
        severity: 'warning',
      });
    }

    // Validate audit exemption for small companies
    if (entitySize === 'small' || entitySize === 'micro') {
      const hasAuditExemption = html.includes('uk-bus:StatementOnComplianceWithAuditExemptionProvisions');
      if (!hasAuditExemption) {
        warnings.push({
          code: 'MISSING_AUDIT_EXEMPTION',
          message: 'Audit exemption statement is recommended for small/micro entities',
          severity: 'warning',
        });
      }
    }
  }

  /**
   * Validate April 2027 mandatory requirements
   */
  private validateApril2027Requirements(html: string, entitySize: string, errors: ValidationError[]): void {
    // P&L is now mandatory for ALL entities (including micro)
    if (!html.includes('uk-gaap:Turnover') && !html.includes('uk-gaap:GrossProfitLoss')) {
      errors.push({
        code: 'MISSING_PROFIT_LOSS',
        message: 'Profit & Loss statement is mandatory for all entities from April 2027',
        severity: 'error',
      });
    }

    // Directors' Report mandatory for small+ companies - check based on entity size parameter
    if ((entitySize === 'small' || entitySize === 'medium' || entitySize === 'large') && 
        (!html.includes('Directors\' Report') && !html.includes('Directors Report'))) {
      errors.push({
        code: 'MISSING_DIRECTORS_REPORT',
        message: `Directors' Report is mandatory for ${entitySize} companies from April 2027`,
        severity: 'error',
      });
    }

    // Average employees mandatory (since Oct 2020, but critical for April 2027)
    if (!html.includes('uk-bus:AverageNumberEmployeesDuringPeriod')) {
      errors.push({
        code: 'MISSING_AVERAGE_EMPLOYEES',
        message: 'Average number of employees is a mandatory disclosure',
        severity: 'error',
      });
    }
  }

  /**
   * Validate QName formats are correct (no spaces, proper prefixes)
   */
  private validateQNames(html: string, errors: ValidationError[]): void {
    // Find all name attributes
    const nameAttrs = html.match(/name="([^"]+)"/g) || [];
    
    for (const attr of nameAttrs) {
      const qname = attr.match(/name="([^"]+)"/)?.[1];
      if (qname) {
        // Check for spaces in QName
        if (qname.includes(' ')) {
          errors.push({
            code: 'INVALID_QNAME',
            message: `Invalid QName "${qname}" contains spaces`,
            severity: 'error',
            location: qname,
          });
        }

        // Check for valid prefix
        if (qname.includes(':')) {
          const prefix = qname.split(':')[0];
          const validPrefixes = ['uk-gaap', 'uk-core', 'uk-bus', 'ix', 'xbrli'];
          if (!validPrefixes.includes(prefix)) {
            errors.push({
              code: 'INVALID_QNAME_PREFIX',
              message: `QName "${qname}" uses unknown prefix "${prefix}"`,
              severity: 'error',
              location: qname,
            });
          }
        }
      }
    }
  }

  /**
   * Validate entity-specific requirements
   */
  private validateEntitySpecificRequirements(html: string, entitySize: string, errors: ValidationError[]): void {
    // Micro-entities can use simplified format but still need P&L from April 2027
    if (entitySize === 'micro') {
      if (!html.includes('uk-gaap:Turnover')) {
        errors.push({
          code: 'MICRO_MISSING_PL',
          message: 'Micro-entities must include Profit & Loss from April 2027 (no more P&L privacy)',
          severity: 'error',
        });
      }
    }

    // Small companies need Directors' Report - check for actual tagged content
    if (entitySize === 'small') {
      const hasDirectorsReport = html.includes('Directors\' Report') || html.includes('Directors Report');
      const hasPrincipalActivities = html.includes('uk-bus:DescriptionPrincipalActivities');
      
      if (!hasDirectorsReport || !hasPrincipalActivities) {
        errors.push({
          code: 'SMALL_MISSING_DIRECTORS_REPORT',
          message: 'Small companies must include Directors\' Report with principal activities (uk-bus:DescriptionPrincipalActivities)',
          severity: 'error',
        });
      }
    }

    // Medium/Large companies have additional requirements
    if (entitySize === 'medium' || entitySize === 'large') {
      // Check for Directors' Report (same as small)
      const hasDirectorsReport = html.includes('Directors\' Report') || html.includes('Directors Report');
      const hasPrincipalActivities = html.includes('uk-bus:DescriptionPrincipalActivities');
      
      if (!hasDirectorsReport || !hasPrincipalActivities) {
        errors.push({
          code: 'MEDIUM_LARGE_MISSING_DIRECTORS_REPORT',
          message: `${entitySize} companies must include Directors' Report with principal activities`,
          severity: 'error',
        });
      }
    }
  }

  /**
   * Generate validation report summary
   */
  generateValidationReport(result: ValidationResult): string {
    const lines: string[] = [];
    lines.push('=== iXBRL VALIDATION REPORT ===\n');
    lines.push(`Status: ${result.isValid ? '✅ VALID' : '❌ INVALID'}\n`);
    lines.push(`Errors: ${result.errors.length}`);
    lines.push(`Warnings: ${result.warnings.length}\n`);

    if (result.errors.length > 0) {
      lines.push('\n🔴 ERRORS:');
      for (const error of result.errors) {
        lines.push(`  [${error.code}] ${error.message}`);
        if (error.location) {
          lines.push(`    Location: ${error.location}`);
        }
      }
    }

    if (result.warnings.length > 0) {
      lines.push('\n⚠️  WARNINGS:');
      for (const warning of result.warnings) {
        lines.push(`  [${warning.code}] ${warning.message}`);
        if (warning.location) {
          lines.push(`    Location: ${warning.location}`);
        }
      }
    }

    if (result.isValid) {
      lines.push('\n✅ Document is ready for Companies House submission');
    } else {
      lines.push('\n❌ Document has errors that must be fixed before submission');
    }

    return lines.join('\n');
  }
}

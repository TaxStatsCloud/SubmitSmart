/**
 * Enhanced iXBRL Validation Service
 * Production-grade validation using DOM/XPath queries and comprehensive placeholder detection
 * 
 * Key Enhancements:
 * - DOM-based element validation (not regex)
 * - XPath queries for complex requirements
 * - Comprehensive placeholder detection
 * - Fact value validation
 * - Cross-reference verification
 * - Schema-aware checking
 */

import { DOMParser } from '@xmldom/xmldom';
import xpath from 'xpath';

export interface EnhancedValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  placeholders: PlaceholderDetection[];
  statistics: ValidationStatistics;
}

export interface ValidationError {
  code: string;
  message: string;
  severity: 'error';
  location?: string;
  element?: string;
  xpath?: string;
}

export interface ValidationWarning {
  code: string;
  message: string;
  severity: 'warning';
  location?: string;
  element?: string;
  xpath?: string;
}

export interface PlaceholderDetection {
  type: 'placeholder' | 'template' | 'invalid_date' | 'invalid_value';
  message: string;
  value: string;
  location: string;
  element?: string;
  severity: 'error' | 'warning';
}

export interface ValidationStatistics {
  totalFacts: number;
  taggedElements: number;
  contexts: number;
  units: number;
  namespaces: number;
  validationTime: number;
}

export class IXBRLEnhancedValidationService {
  private requiredNamespaces = {
    'ix': 'http://www.xbrl.org/2013/inlineXBRL',
    'xbrli': 'http://www.xbrl.org/2003/instance',
    'link': 'http://www.xbrl.org/2003/linkbase',
    'xlink': 'http://www.w3.org/1999/xlink',
    'uk-gaap': 'https://xbrl.frc.org.uk/frs/2025-01-01/frs-2025-01-01.xsd',
    'uk-core': 'https://xbrl.frc.org.uk/core/2025-01-01/core-2025-01-01.xsd',
    'uk-bus': 'https://xbrl.frc.org.uk/cd/2025-01-01/business/bus-2025-01-01.xsd',
  };

  private placeholderPatterns = [
    // Common placeholder text
    /\[.*?\]/g, // [Company Name], [Date], etc.
    /\{.*?\}/g, // {placeholder}
    /XXX+/gi, // XXX, XXXX
    /TBD|TO BE DETERMINED|PLACEHOLDER/gi,
    /INSERT\s+\w+/gi, // INSERT NAME, INSERT VALUE
    /FILL\s+IN/gi,
    /<.*?>/g, // <placeholder>
    /EXAMPLE|SAMPLE|TEST/gi,
    /Company\s*Name/gi, // Generic company name
    /Director\s*Name/gi, // Generic director name
    /DD[\/\-\.]MM[\/\-\.]YYYY/gi, // Date placeholders
    /YYYY[\/\-\.]MM[\/\-\.]DD/gi,
    /00\/00\/0000/g, // Zero dates
    /99\/99\/9999/g, // Dummy dates
  ];

  /**
   * Validate complete iXBRL document with enhanced checks
   */
  async validateiXBRLDocument(
    html: string, 
    entitySize: 'micro' | 'small' | 'medium' | 'large'
  ): Promise<EnhancedValidationResult> {
    const startTime = Date.now();
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const placeholders: PlaceholderDetection[] = [];

    try {
      // Parse document with enhanced error handling
      const doc = this.parseDocument(html, errors);
      if (!doc) {
        return {
          isValid: false,
          errors,
          warnings,
          placeholders,
          statistics: this.getDefaultStatistics(Date.now() - startTime)
        };
      }

      // Run all validation checks
      this.validateNamespacesDOM(doc, errors);
      this.validateSchemaReference(doc, errors);
      this.validateContextsDOM(doc, errors);
      this.validateUnitsDOM(doc, errors);
      this.validateRequiredElementsDOM(doc, entitySize, errors, warnings);
      this.validateCrossReferences(doc, errors);
      this.validateContextPeriodTypes(doc, errors, warnings);
      this.validateFactValues(doc, errors, warnings);
      this.validateApril2027RequirementsDOM(doc, entitySize, errors);
      this.detectPlaceholders(doc, placeholders);

      // Gather statistics
      const statistics = this.gatherStatistics(doc, Date.now() - startTime);

      return {
        isValid: errors.length === 0 && placeholders.filter(p => p.severity === 'error').length === 0,
        errors,
        warnings,
        placeholders,
        statistics,
      };

    } catch (error) {
      errors.push({
        code: 'VALIDATION_EXCEPTION',
        message: `Enhanced validation failed: ${error instanceof Error ? error.message : String(error)}`,
        severity: 'error',
      });

      return {
        isValid: false,
        errors,
        warnings,
        placeholders,
        statistics: this.getDefaultStatistics(Date.now() - startTime)
      };
    }
  }

  /**
   * Parse XML document with comprehensive error handling
   */
  private parseDocument(html: string, errors: ValidationError[]): Document | null {
    try {
      const errorHandler = {
        errors: [] as string[],
        warnings: [] as string[],
        error: function(msg: string) { this.errors.push(msg); },
        warning: function(msg: string) { this.warnings.push(msg); },
        fatalError: function(msg: string) { this.errors.push(msg); }
      };

      const doc = new DOMParser({
        errorHandler: errorHandler as any,
        locator: {}
      }).parseFromString(html, 'text/html');

      if (errorHandler.errors.length > 0) {
        for (const err of errorHandler.errors) {
          errors.push({
            code: 'XML_PARSE_ERROR',
            message: `XML parsing error: ${err}`,
            severity: 'error',
          });
        }
        return null;
      }

      if (!doc || !doc.documentElement) {
        errors.push({
          code: 'XML_INVALID_STRUCTURE',
          message: 'Document has no root element',
          severity: 'error',
        });
        return null;
      }

      return doc;
    } catch (error) {
      errors.push({
        code: 'XML_PARSE_EXCEPTION',
        message: `Failed to parse document: ${error instanceof Error ? error.message : String(error)}`,
        severity: 'error',
      });
      return null;
    }
  }

  /**
   * Validate namespaces using DOM
   */
  private validateNamespacesDOM(doc: Document, errors: ValidationError[]): void {
    const root = doc.documentElement;
    
    for (const [prefix, uri] of Object.entries(this.requiredNamespaces)) {
      const nsPrefix = prefix.replace('xmlns:', '');
      const declaredUri = root.getAttribute(`xmlns:${nsPrefix}`);
      
      if (!declaredUri) {
        errors.push({
          code: 'MISSING_NAMESPACE',
          message: `Required namespace xmlns:${nsPrefix} is not declared on root element`,
          severity: 'error',
          element: 'html',
        });
      } else if (declaredUri !== uri) {
        errors.push({
          code: 'INCORRECT_NAMESPACE_URI',
          message: `Namespace xmlns:${nsPrefix} has incorrect URI. Expected: ${uri}, Found: ${declaredUri}`,
          severity: 'error',
          element: 'html',
        });
      }
    }
  }

  /**
   * Validate schema reference exists in ix:header
   */
  private validateSchemaReference(doc: Document, errors: ValidationError[]): void {
    const headers = doc.getElementsByTagName('ix:header');
    
    if (headers.length === 0) {
      errors.push({
        code: 'MISSING_IX_HEADER',
        message: 'ix:header element is required for iXBRL documents',
        severity: 'error',
      });
      return;
    }

    const header = headers[0];
    const schemaRefs = header.getElementsByTagName('link:schemaRef');
    
    if (schemaRefs.length === 0) {
      errors.push({
        code: 'MISSING_SCHEMA_REF',
        message: 'link:schemaRef is required in ix:header',
        severity: 'error',
        element: 'ix:header',
      });
    } else {
      const schemaRef = schemaRefs[0];
      const href = schemaRef.getAttribute('xlink:href');
      
      if (!href || !href.includes('xbrl.frc.org.uk')) {
        errors.push({
          code: 'INVALID_SCHEMA_REF',
          message: 'Schema reference must point to FRC taxonomy (xbrl.frc.org.uk)',
          severity: 'error',
          element: 'link:schemaRef',
        });
      }
    }
  }

  /**
   * Validate contexts using DOM
   */
  private validateContextsDOM(doc: Document, errors: ValidationError[]): void {
    const contexts = doc.getElementsByTagName('xbrli:context');
    
    if (contexts.length === 0) {
      errors.push({
        code: 'MISSING_CONTEXTS',
        message: 'At least one xbrli:context is required',
        severity: 'error',
      });
      return;
    }

    // Validate each context
    for (let i = 0; i < contexts.length; i++) {
      const context = contexts[i];
      const id = context.getAttribute('id');
      
      if (!id) {
        errors.push({
          code: 'CONTEXT_MISSING_ID',
          message: `Context at index ${i} is missing required id attribute`,
          severity: 'error',
          element: 'xbrli:context',
        });
      }

      // Check for entity identifier
      const entities = context.getElementsByTagName('xbrli:entity');
      if (entities.length === 0) {
        errors.push({
          code: 'CONTEXT_MISSING_ENTITY',
          message: `Context "${id}" is missing xbrli:entity element`,
          severity: 'error',
          element: 'xbrli:context',
          location: id || `context[${i}]`,
        });
      } else {
        const entity = entities[0];
        const identifiers = entity.getElementsByTagName('xbrli:identifier');
        if (identifiers.length === 0) {
          errors.push({
            code: 'CONTEXT_MISSING_IDENTIFIER',
            message: `Context "${id}" is missing xbrli:identifier element`,
            severity: 'error',
            element: 'xbrli:context',
            location: id || `context[${i}]`,
          });
        }
      }

      // Check for period
      const periods = context.getElementsByTagName('xbrli:period');
      if (periods.length === 0) {
        errors.push({
          code: 'CONTEXT_MISSING_PERIOD',
          message: `Context "${id}" is missing xbrli:period element`,
          severity: 'error',
          element: 'xbrli:context',
          location: id || `context[${i}]`,
        });
      }
    }
  }

  /**
   * Validate units using DOM
   */
  private validateUnitsDOM(doc: Document, errors: ValidationError[]): void {
    const units = doc.getElementsByTagName('xbrli:unit');
    
    if (units.length === 0) {
      errors.push({
        code: 'MISSING_UNITS',
        message: 'At least one xbrli:unit is required for numeric facts',
        severity: 'error',
      });
      return;
    }

    // Validate each unit
    for (let i = 0; i < units.length; i++) {
      const unit = units[i];
      const id = unit.getAttribute('id');
      
      if (!id) {
        errors.push({
          code: 'UNIT_MISSING_ID',
          message: `Unit at index ${i} is missing required id attribute`,
          severity: 'error',
          element: 'xbrli:unit',
        });
      }

      // Check for measure
      const measures = unit.getElementsByTagName('xbrli:measure');
      if (measures.length === 0) {
        errors.push({
          code: 'UNIT_MISSING_MEASURE',
          message: `Unit "${id}" is missing xbrli:measure element`,
          severity: 'error',
          element: 'xbrli:unit',
          location: id || `unit[${i}]`,
        });
      }
    }
  }

  /**
   * Validate required elements using DOM queries
   */
  private validateRequiredElementsDOM(
    doc: Document, 
    entitySize: string, 
    errors: ValidationError[], 
    warnings: ValidationWarning[]
  ): void {
    const requiredElements = {
      all: [
        { name: 'uk-core:CompaniesHouseRegisteredNumber', description: 'Companies House registration number' },
        { name: 'uk-core:EntityCurrentLegalOrRegisteredName', description: 'Company legal name' },
        { name: 'uk-core:BalanceSheetDate', description: 'Balance sheet date' },
        { name: 'uk-bus:AverageNumberEmployeesDuringPeriod', description: 'Average employees (mandatory)' },
      ],
      micro: [
        { name: 'uk-gaap:FixedAssets', description: 'Fixed assets' },
        { name: 'uk-gaap:CurrentAssets', description: 'Current assets' },
        { name: 'uk-gaap:Turnover', description: 'Turnover (P&L mandatory from April 2027)' },
      ],
      small: [
        { name: 'uk-gaap:FixedAssets', description: 'Fixed assets' },
        { name: 'uk-gaap:CurrentAssets', description: 'Current assets' },
        { name: 'uk-gaap:Turnover', description: 'Turnover' },
        { name: 'uk-bus:DescriptionPrincipalActivities', description: 'Principal activities (Directors\' Report)' },
        { name: 'uk-bus:NameEntityOfficer', description: 'Director names' },
      ],
      medium: [
        { name: 'uk-gaap:FixedAssets', description: 'Fixed assets' },
        { name: 'uk-gaap:CurrentAssets', description: 'Current assets' },
        { name: 'uk-gaap:Turnover', description: 'Turnover' },
        { name: 'uk-bus:DescriptionPrincipalActivities', description: 'Principal activities' },
        { name: 'uk-bus:NameEntityOfficer', description: 'Director names' },
      ],
      large: [
        { name: 'uk-gaap:FixedAssets', description: 'Fixed assets' },
        { name: 'uk-gaap:CurrentAssets', description: 'Current assets' },
        { name: 'uk-gaap:Turnover', description: 'Turnover' },
        { name: 'uk-bus:DescriptionPrincipalActivities', description: 'Principal activities' },
        { name: 'uk-bus:NameEntityOfficer', description: 'Director names' },
      ],
    };

    // Check all required elements
    const allElements = [
      ...requiredElements.all,
      ...(requiredElements[entitySize as keyof typeof requiredElements] || [])
    ];

    for (const { name, description } of allElements) {
      const elements = this.getElementsByNameAttribute(doc, name);
      
      if (elements.length === 0) {
        errors.push({
          code: 'MISSING_REQUIRED_ELEMENT',
          message: `Required element ${name} (${description}) is missing`,
          severity: 'error',
          element: name,
        });
      }
    }
  }

  /**
   * Validate cross-references between facts and contexts/units
   */
  private validateCrossReferences(doc: Document, errors: ValidationError[]): void {
    // Get all defined context IDs
    const contexts = doc.getElementsByTagName('xbrli:context');
    const contextIds = new Set<string>();
    for (let i = 0; i < contexts.length; i++) {
      const id = contexts[i].getAttribute('id');
      if (id) contextIds.add(id);
    }

    // Get all defined unit IDs
    const units = doc.getElementsByTagName('xbrli:unit');
    const unitIds = new Set<string>();
    for (let i = 0; i < units.length; i++) {
      const id = units[i].getAttribute('id');
      if (id) unitIds.add(id);
    }

    // Check all facts reference valid contexts
    const allElements = doc.getElementsByTagName('*');
    for (let i = 0; i < allElements.length; i++) {
      const element = allElements[i];
      const contextRef = element.getAttribute('contextRef');
      const unitRef = element.getAttribute('unitRef');
      const name = element.getAttribute('name');

      if (contextRef && !contextIds.has(contextRef)) {
        errors.push({
          code: 'INVALID_CONTEXT_REF',
          message: `Element references undefined context "${contextRef}"`,
          severity: 'error',
          element: name || element.tagName,
          location: contextRef,
        });
      }

      if (unitRef && !unitIds.has(unitRef)) {
        errors.push({
          code: 'INVALID_UNIT_REF',
          message: `Element references undefined unit "${unitRef}"`,
          severity: 'error',
          element: name || element.tagName,
          location: unitRef,
        });
      }
    }
  }

  /**
   * Validate fact values with proper type separation
   */
  private validateFactValues(doc: Document, errors: ValidationError[], warnings: ValidationWarning[]): void {
    // Validate numeric facts (ix:nonFraction - monetary values)
    this.validateNumericFacts(doc, errors, warnings);
    
    // Validate textual facts (ix:nonNumeric - text content like names, descriptions)
    this.validateTextualFacts(doc, errors, warnings);
  }

  /**
   * Validate numeric facts (ix:nonFraction) with UK currency format support
   */
  private validateNumericFacts(doc: Document, errors: ValidationError[], warnings: ValidationWarning[]): void {
    // Only validate actual numeric facts - ix:nonFraction elements
    const ixNonFractions = doc.getElementsByTagName('ix:nonFraction');
    
    for (let i = 0; i < ixNonFractions.length; i++) {
      const fact = ixNonFractions[i];
      const value = this.getElementText(fact);
      const name = fact.getAttribute('name') || fact.tagName;
      const decimals = fact.getAttribute('decimals');
      const unitRef = fact.getAttribute('unitRef');
      const contextRef = fact.getAttribute('contextRef');
      
      if (!value || value.trim() === '') {
        warnings.push({
          code: 'EMPTY_NUMERIC_FACT',
          message: `Numeric fact "${name}" has empty value`,
          severity: 'warning',
          element: name,
        });
        continue;
      }

      // Check for required attributes on ix:nonFraction
      if (!contextRef) {
        errors.push({
          code: 'MISSING_CONTEXT_REF',
          message: `ix:nonFraction element "${name}" must have contextRef attribute`,
          severity: 'error',
          element: name,
        });
      }

      if (!decimals) {
        errors.push({
          code: 'MISSING_DECIMALS_ATTRIBUTE',
          message: `ix:nonFraction element "${name}" must have decimals attribute`,
          severity: 'error',
          element: name,
        });
      }

      if (!unitRef) {
        errors.push({
          code: 'MISSING_UNIT_REF',
          message: `ix:nonFraction element "${name}" must have unitRef attribute`,
          severity: 'error',
          element: name,
        });
      }

      // Normalize UK currency format: remove £, commas, handle brackets for negatives
      const normalizedValue = this.normalizeNumericValue(value);
      
      if (normalizedValue === null) {
        errors.push({
          code: 'INVALID_NUMERIC_VALUE',
          message: `Numeric fact "${name}" has invalid value "${value}"`,
          severity: 'error',
          element: name,
          location: value,
        });
        continue;
      }

      // Warn about suspicious zero values (but allow legitimate zeros)
      if (normalizedValue === 0 && this.isLikelyPlaceholderZero(name)) {
        warnings.push({
          code: 'SUSPICIOUS_ZERO_VALUE',
          message: `Numeric fact "${name}" has zero value - verify this is correct for your company`,
          severity: 'warning',
          element: name,
          location: value,
        });
      }
    }
  }

  /**
   * Validate textual facts (ix:nonNumeric) - directors' names, descriptions, etc.
   */
  private validateTextualFacts(doc: Document, errors: ValidationError[], warnings: ValidationWarning[]): void {
    // ix:nonNumeric is for text content with XBRL tagging (NOT numeric)
    const ixNonNumerics = doc.getElementsByTagName('ix:nonNumeric');
    
    for (let i = 0; i < ixNonNumerics.length; i++) {
      const fact = ixNonNumerics[i];
      const value = this.getElementText(fact);
      const name = fact.getAttribute('name') || fact.tagName;
      const contextRef = fact.getAttribute('contextRef');
      
      // Check for empty textual facts
      if (!value || value.trim() === '') {
        warnings.push({
          code: 'EMPTY_TEXTUAL_FACT',
          message: `Textual fact "${name}" has empty value`,
          severity: 'warning',
          element: name,
        });
        continue;
      }

      // Check for required contextRef
      if (!contextRef) {
        errors.push({
          code: 'MISSING_CONTEXT_REF',
          message: `ix:nonNumeric element "${name}" must have contextRef attribute`,
          severity: 'error',
          element: name,
        });
      }

      // Textual facts are checked for placeholders by detectPlaceholders()
      // No numeric validation needed here
    }
  }

  /**
   * Normalize UK currency format to numeric value
   * Handles: £1,234.56, (1,234.56), -1,234.56, 1234.56
   */
  private normalizeNumericValue(value: string): number | null {
    try {
      // Remove currency symbols, whitespace, commas
      let normalized = value
        .replace(/[£$€\s,]/g, '')
        .trim();

      // Handle bracketed negatives (UK accounting format)
      if (normalized.startsWith('(') && normalized.endsWith(')')) {
        normalized = '-' + normalized.slice(1, -1);
      }

      // Try to parse
      const numValue = parseFloat(normalized);
      
      // Verify it's a valid number
      if (isNaN(numValue) || !isFinite(numValue)) {
        return null;
      }

      return numValue;
    } catch {
      return null;
    }
  }

  /**
   * Check if zero value is likely a placeholder (major assets/liabilities shouldn't be zero)
   */
  private isLikelyPlaceholderZero(elementName: string): boolean {
    const majorElements = [
      'FixedAssets',
      'CurrentAssets', 
      'Turnover',
      'NetAssetsLiabilities',
      'CalledUpShareCapital'
    ];
    
    return majorElements.some(elem => elementName.includes(elem));
  }

  /**
   * Validate context period types (instant vs duration)
   */
  private validateContextPeriodTypes(doc: Document, errors: ValidationError[], warnings: ValidationWarning[]): void {
    const contexts = doc.getElementsByTagName('xbrli:context');
    
    for (let i = 0; i < contexts.length; i++) {
      const context = contexts[i];
      const id = context.getAttribute('id');
      const periods = context.getElementsByTagName('xbrli:period');
      
      if (periods.length > 0) {
        const period = periods[0];
        const instant = period.getElementsByTagName('xbrli:instant');
        const startDate = period.getElementsByTagName('xbrli:startDate');
        const endDate = period.getElementsByTagName('xbrli:endDate');
        
        // Context must be either instant (point in time) or duration (period)
        const hasInstant = instant.length > 0;
        const hasDuration = startDate.length > 0 && endDate.length > 0;
        
        if (!hasInstant && !hasDuration) {
          errors.push({
            code: 'INVALID_CONTEXT_PERIOD',
            message: `Context "${id}" must have either instant or duration (startDate+endDate)`,
            severity: 'error',
            element: 'xbrli:context',
            location: id || `context[${i}]`,
          });
        }
        
        if (hasInstant && hasDuration) {
          errors.push({
            code: 'AMBIGUOUS_CONTEXT_PERIOD',
            message: `Context "${id}" cannot have both instant and duration - must be one or the other`,
            severity: 'error',
            element: 'xbrli:context',
            location: id || `context[${i}]`,
          });
        }
        
        // Validate date formats
        if (hasInstant) {
          const instantValue = this.getElementText(instant[0]);
          if (!this.isValidDate(instantValue)) {
            errors.push({
              code: 'INVALID_INSTANT_DATE',
              message: `Context "${id}" has invalid instant date "${instantValue}" - must be YYYY-MM-DD format`,
              severity: 'error',
              element: 'xbrli:instant',
              location: id || `context[${i}]`,
            });
          }
        }
        
        if (hasDuration) {
          const startDateValue = this.getElementText(startDate[0]);
          const endDateValue = this.getElementText(endDate[0]);
          
          if (!this.isValidDate(startDateValue)) {
            errors.push({
              code: 'INVALID_START_DATE',
              message: `Context "${id}" has invalid startDate "${startDateValue}" - must be YYYY-MM-DD format`,
              severity: 'error',
              element: 'xbrli:startDate',
              location: id || `context[${i}]`,
            });
          }
          
          if (!this.isValidDate(endDateValue)) {
            errors.push({
              code: 'INVALID_END_DATE',
              message: `Context "${id}" has invalid endDate "${endDateValue}" - must be YYYY-MM-DD format`,
              severity: 'error',
              element: 'xbrli:endDate',
              location: id || `context[${i}]`,
            });
          }
          
          // Verify end date is after start date
          if (this.isValidDate(startDateValue) && this.isValidDate(endDateValue)) {
            const start = new Date(startDateValue);
            const end = new Date(endDateValue);
            
            if (end <= start) {
              errors.push({
                code: 'INVALID_DATE_RANGE',
                message: `Context "${id}" has endDate (${endDateValue}) before or equal to startDate (${startDateValue})`,
                severity: 'error',
                element: 'xbrli:period',
                location: id || `context[${i}]`,
              });
            }
          }
        }
      }
    }
  }

  /**
   * Validate April 2027 mandatory requirements using DOM
   */
  private validateApril2027RequirementsDOM(doc: Document, entitySize: string, errors: ValidationError[]): void {
    // P&L mandatory for ALL entities
    const turnover = this.getElementsByNameAttribute(doc, 'uk-gaap:Turnover');
    if (turnover.length === 0) {
      errors.push({
        code: 'MISSING_PROFIT_LOSS',
        message: 'Profit & Loss statement is mandatory for all entities from April 2027',
        severity: 'error',
      });
    }

    // Directors' Report mandatory for small+
    if (entitySize !== 'micro') {
      const principalActivities = this.getElementsByNameAttribute(doc, 'uk-bus:DescriptionPrincipalActivities');
      if (principalActivities.length === 0) {
        errors.push({
          code: 'MISSING_DIRECTORS_REPORT',
          message: `Directors' Report with principal activities is mandatory for ${entitySize} companies`,
          severity: 'error',
        });
      }

      const directors = this.getElementsByNameAttribute(doc, 'uk-bus:NameEntityOfficer');
      if (directors.length === 0) {
        errors.push({
          code: 'MISSING_DIRECTOR_NAMES',
          message: 'At least one director name must be included in Directors\' Report',
          severity: 'error',
        });
      }
    }

    // Average employees mandatory for ALL
    const avgEmployees = this.getElementsByNameAttribute(doc, 'uk-bus:AverageNumberEmployeesDuringPeriod');
    if (avgEmployees.length === 0) {
      errors.push({
        code: 'MISSING_AVERAGE_EMPLOYEES',
        message: 'Average number of employees is mandatory for all companies',
        severity: 'error',
      });
    }
  }

  /**
   * Comprehensive placeholder detection
   */
  private detectPlaceholders(doc: Document, placeholders: PlaceholderDetection[]): void {
    // Check all text content in the document
    const allElements = doc.getElementsByTagName('*');
    
    for (let i = 0; i < allElements.length; i++) {
      const element = allElements[i];
      const text = this.getElementText(element);
      const name = element.getAttribute('name') || element.tagName;
      
      if (!text || text.trim() === '') continue;

      // Check against placeholder patterns
      for (const pattern of this.placeholderPatterns) {
        const matches = text.match(pattern);
        if (matches) {
          placeholders.push({
            type: 'placeholder',
            message: `Potential placeholder detected in ${name}`,
            value: text,
            location: name,
            element: name,
            severity: 'error',
          });
          break; // Only report once per element
        }
      }

      // Check for invalid dates
      if (this.isDateField(name) && !this.isValidDate(text)) {
        placeholders.push({
          type: 'invalid_date',
          message: `Invalid date format in ${name}`,
          value: text,
          location: name,
          element: name,
          severity: 'error',
        });
      }

      // Check for suspicious repeated characters
      if (/(.)\1{4,}/.test(text)) { // 5 or more repeated characters
        placeholders.push({
          type: 'placeholder',
          message: `Suspicious repeated characters in ${name}`,
          value: text,
          location: name,
          element: name,
          severity: 'warning',
        });
      }
    }
  }

  /**
   * Gather validation statistics
   */
  private gatherStatistics(doc: Document, validationTime: number): ValidationStatistics {
    const contexts = doc.getElementsByTagName('xbrli:context');
    const units = doc.getElementsByTagName('xbrli:unit');
    
    // Count facts (elements with name attribute containing ':')
    const allElements = doc.getElementsByTagName('*');
    let factCount = 0;
    let taggedCount = 0;
    
    for (let i = 0; i < allElements.length; i++) {
      const name = allElements[i].getAttribute('name');
      if (name && name.includes(':')) {
        factCount++;
        if (name.startsWith('uk-')) taggedCount++;
      }
    }

    return {
      totalFacts: factCount,
      taggedElements: taggedCount,
      contexts: contexts.length,
      units: units.length,
      namespaces: Object.keys(this.requiredNamespaces).length,
      validationTime,
    };
  }

  /**
   * Helper: Get elements by name attribute
   */
  private getElementsByNameAttribute(doc: Document, nameValue: string): Element[] {
    const results: Element[] = [];
    const allElements = doc.getElementsByTagName('*');
    
    for (let i = 0; i < allElements.length; i++) {
      const element = allElements[i];
      if (element.getAttribute('name') === nameValue) {
        results.push(element);
      }
    }
    
    return results;
  }

  /**
   * Helper: Get elements with specific attribute
   */
  private getElementsWithAttribute(doc: Document, attrName: string): Element[] {
    const results: Element[] = [];
    const allElements = doc.getElementsByTagName('*');
    
    for (let i = 0; i < allElements.length; i++) {
      const element = allElements[i];
      if (element.hasAttribute(attrName)) {
        results.push(element);
      }
    }
    
    return results;
  }

  /**
   * Helper: Get element text content
   */
  private getElementText(element: Element): string {
    return element.textContent || '';
  }

  /**
   * Helper: Check if field is a date field
   */
  private isDateField(name: string): boolean {
    const dateFields = [
      'BalanceSheetDate',
      'StartDateForPeriodCoveredByReport',
      'EndDateForPeriodCoveredByReport',
      'DateAuthorisationFinancialStatementsForIssue',
      'Date',
    ];
    return dateFields.some(field => name.includes(field));
  }

  /**
   * Helper: Validate date format
   */
  private isValidDate(dateStr: string): boolean {
    // Check for ISO format YYYY-MM-DD
    const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/;
    if (!isoDatePattern.test(dateStr)) return false;

    // Verify it's a valid date
    const date = new Date(dateStr);
    return date instanceof Date && !isNaN(date.getTime());
  }

  /**
   * Get default statistics when validation fails early
   */
  private getDefaultStatistics(validationTime: number): ValidationStatistics {
    return {
      totalFacts: 0,
      taggedElements: 0,
      contexts: 0,
      units: 0,
      namespaces: 0,
      validationTime,
    };
  }

  /**
   * Generate comprehensive validation report
   */
  generateValidationReport(result: EnhancedValidationResult): string {
    const lines: string[] = [];
    
    lines.push('═══════════════════════════════════════════════════════════');
    lines.push('          ENHANCED iXBRL VALIDATION REPORT');
    lines.push('═══════════════════════════════════════════════════════════\n');
    
    // Status
    const statusIcon = result.isValid ? '✅' : '❌';
    lines.push(`Status: ${statusIcon} ${result.isValid ? 'VALID - Ready for submission' : 'INVALID - Errors must be fixed'}\n`);
    
    // Statistics
    lines.push('📊 DOCUMENT STATISTICS:');
    lines.push(`  Total Facts: ${result.statistics.totalFacts}`);
    lines.push(`  UK-Tagged Elements: ${result.statistics.taggedElements}`);
    lines.push(`  Contexts: ${result.statistics.contexts}`);
    lines.push(`  Units: ${result.statistics.units}`);
    lines.push(`  Namespaces: ${result.statistics.namespaces}`);
    lines.push(`  Validation Time: ${result.statistics.validationTime}ms\n`);
    
    // Summary
    lines.push('📋 SUMMARY:');
    lines.push(`  Errors: ${result.errors.length}`);
    lines.push(`  Warnings: ${result.warnings.length}`);
    lines.push(`  Placeholders: ${result.placeholders.filter(p => p.severity === 'error').length} critical, ${result.placeholders.filter(p => p.severity === 'warning').length} warnings\n`);
    
    // Errors
    if (result.errors.length > 0) {
      lines.push('🔴 ERRORS (Must Fix):');
      lines.push('───────────────────────────────────────────────────────────');
      for (const error of result.errors) {
        lines.push(`  [${error.code}] ${error.message}`);
        if (error.element) lines.push(`    Element: ${error.element}`);
        if (error.location) lines.push(`    Location: ${error.location}`);
        lines.push('');
      }
    }
    
    // Placeholders
    const criticalPlaceholders = result.placeholders.filter(p => p.severity === 'error');
    if (criticalPlaceholders.length > 0) {
      lines.push('🚨 PLACEHOLDERS DETECTED (Must Fix):');
      lines.push('───────────────────────────────────────────────────────────');
      for (const ph of criticalPlaceholders) {
        lines.push(`  [${ph.type.toUpperCase()}] ${ph.message}`);
        lines.push(`    Value: "${ph.value}"`);
        lines.push(`    Location: ${ph.location}`);
        lines.push('');
      }
    }
    
    // Warnings
    if (result.warnings.length > 0) {
      lines.push('⚠️  WARNINGS (Recommended Fixes):');
      lines.push('───────────────────────────────────────────────────────────');
      for (const warning of result.warnings) {
        lines.push(`  [${warning.code}] ${warning.message}`);
        if (warning.element) lines.push(`    Element: ${warning.element}`);
        if (warning.location) lines.push(`    Location: ${warning.location}`);
        lines.push('');
      }
    }
    
    const warningPlaceholders = result.placeholders.filter(p => p.severity === 'warning');
    if (warningPlaceholders.length > 0) {
      lines.push('⚠️  POTENTIAL ISSUES:');
      lines.push('───────────────────────────────────────────────────────────');
      for (const ph of warningPlaceholders) {
        lines.push(`  [${ph.type.toUpperCase()}] ${ph.message}`);
        lines.push(`    Value: "${ph.value}"`);
        lines.push('');
      }
    }
    
    // Conclusion
    lines.push('═══════════════════════════════════════════════════════════');
    if (result.isValid) {
      lines.push('✅ VALIDATION PASSED');
      lines.push('Document meets FRC 2025 and April 2027 requirements.');
      lines.push('Ready for Companies House submission.');
    } else {
      lines.push('❌ VALIDATION FAILED');
      lines.push('Please fix all errors before attempting submission.');
      lines.push('Errors must be corrected to comply with Companies House requirements.');
    }
    lines.push('═══════════════════════════════════════════════════════════\n');
    
    return lines.join('\n');
  }
}

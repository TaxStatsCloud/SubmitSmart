# Professional Review Materials
## iXBRL Generation & Validation System

**Platform**: PromptSubmissions  
**Purpose**: Accountant and compliance professional review  
**Version**: 2.0 (October 2025)  
**Compliance**: FRC 2025 Taxonomy, April 2027 Requirements

---

## Document Purpose

This document provides technical specifications, validation rules, and review checklists for qualified accountants and compliance professionals evaluating the PromptSubmissions iXBRL generation and validation system for Companies House filing compliance.

---

## Table of Contents

1. [Technical Specifications](#technical-specifications)
2. [Validation Rules Reference](#validation-rules-reference)
3. [FRC 2025 Compliance Matrix](#frc-2025-compliance-matrix)
4. [Entity Size Classification](#entity-size-classification)
5. [Sample Outputs](#sample-outputs)
6. [Professional Review Checklist](#professional-review-checklist)
7. [Known Limitations](#known-limitations)
8. [Contact Information](#contact-information)

---

## Technical Specifications

### System Architecture

**iXBRL Generation Service** (`ixbrlGenerationService.ts`):
- Generates FRC 2025 compliant iXBRL documents
- Automatic entity size detection based on April 2025 thresholds
- Conditional report inclusion based on company size
- Full digital tagging of financial statements and notes

**iXBRL Validation Services**:
- **Legacy Service**: Basic regex-based pre-checks (backwards compatibility)
- **Enhanced Service**: Production-grade DOM/XPath validation with schema-aware checks

### FRC 2025 Taxonomy Implementation

**Namespace URIs** (Official FRC 2025):
```
xmlns:ix="http://www.xbrl.org/2013/inlineXBRL"
xmlns:xbrli="http://www.xbrl.org/2003/instance"
xmlns:uk-gaap="https://xbrl.frc.org.uk/frs/2025-01-01/frs-2025-01-01.xsd"
xmlns:uk-core="https://xbrl.frc.org.uk/core/2025-01-01/core-2025-01-01.xsd"
xmlns:uk-bus="https://xbrl.frc.org.uk/cd/2025-01-01/business/bus-2025-01-01.xsd"
```

**Schema Reference**:
- Location: `ix:header > link:schemaRef`
- Attribute: `xlink:href` pointing to FRC taxonomy
- Required: Yes (enforced by validation)

### Accounting Frameworks Supported

| Framework | Entity Types | Standard |
|-----------|-------------|----------|
| FRS 105 | Micro-entities | Micro-entities Regime |
| FRS 102 | Small, Medium, Large | UK/RoI Standard |
| FRS 102 1A | Small entities | Simplified disclosures |
| FRS 101 | Qualifying entities | Reduced Disclosure Framework |
| UK-IFRS | Large companies/groups | International standards |

---

## Validation Rules Reference

### Enhanced Validation Service

**DOM-Based Validation** (Not Regex):
- Proper XML/DOM parsing with error handling
- Element queries using DOM methods
- XPath support for complex structural requirements

**Fact Type Separation**:
```
ix:nonFraction = Numeric/monetary facts
  - Requires: contextRef, unitRef, decimals attributes
  - Validation: UK currency format normalization
  - Handles: £1,234.56, (1,234), -1,234.56

ix:nonNumeric = Textual facts
  - Requires: contextRef attribute
  - Validation: Placeholder detection, empty check
  - Examples: Director names, principal activities
```

### Validation Categories

#### 1. Structural Validation
- ✅ Well-formed XML/HTML structure
- ✅ Required namespace declarations
- ✅ Schema reference in ix:header
- ✅ Context and unit definitions
- ✅ Cross-reference integrity (contextRef/unitRef)

#### 2. Context Validation
- ✅ Context must be instant XOR duration (not both)
- ✅ ISO date format (YYYY-MM-DD) validation
- ✅ Date range validation (endDate > startDate)
- ✅ Entity identifier present
- ✅ Period element present

#### 3. Fact Validation
- ✅ Numeric facts: UK currency format support
- ✅ Required attributes: contextRef, unitRef, decimals
- ✅ Invalid value detection
- ✅ Suspicious zero warnings (major elements only)
- ✅ Textual facts: contextRef required, no numeric parsing

#### 4. Placeholder Detection (14 Patterns)
- ✅ Bracket placeholders: [Company Name], [Date]
- ✅ Curly braces: {placeholder}, {value}
- ✅ Repetition: XXX, XXXX
- ✅ Keywords: TBD, PLACEHOLDER, INSERT, FILL IN
- ✅ Examples: EXAMPLE, SAMPLE, TEST
- ✅ Generic names: "Company Name", "Director Name"
- ✅ Date placeholders: DD/MM/YYYY, YYYY-MM-DD
- ✅ Dummy dates: 00/00/0000, 99/99/9999
- ✅ Repeated characters: 5+ same character (aaaaa)

#### 5. April 2027 Requirements
- ✅ Profit & Loss mandatory for ALL entities (including micro)
- ✅ Directors' Report mandatory for small/medium/large
- ✅ Average employees mandatory for ALL entities
- ✅ Principal activities tagged (uk-bus:DescriptionPrincipalActivities)
- ✅ Director names tagged (uk-bus:NameEntityOfficer)

---

## FRC 2025 Compliance Matrix

### Micro-Entities (Turnover ≤ £1m, Assets ≤ £500k, Employees ≤ 10)

| Requirement | Status | Implementation |
|-------------|--------|----------------|
| Balance Sheet | ✅ Complete | Full tagging with uk-gaap elements |
| Profit & Loss | ✅ Complete | Mandatory from April 2027 |
| Average Employees | ✅ Complete | uk-bus:AverageNumberEmployeesDuringPeriod |
| Accounting Policies | ✅ Complete | FRS105 framework tagged |
| Audit Exemption | ✅ Complete | Section 477 statement (if applicable) |
| Directors' Report | ❌ Not Required | Micro-entities exempt |

### Small Companies (Turnover ≤ £15m, Assets ≤ £7.5m, Employees ≤ 50)

| Requirement | Status | Implementation |
|-------------|--------|----------------|
| Balance Sheet | ✅ Complete | Full tagging |
| Profit & Loss | ✅ Complete | Mandatory |
| Directors' Report | ✅ Complete | With principal activities, directors list |
| Average Employees | ✅ Complete | Mandatory disclosure |
| Accounting Policies | ✅ Complete | FRS102/FRS102 1A |
| Audit Exemption | ✅ Complete | Section 477/476 statements |
| Approval Statement | ✅ Complete | Date and signatory director |

### Medium Companies (Turnover ≤ £54m, Assets ≤ £27m, Employees ≤ 250)

| Requirement | Status | Implementation |
|-------------|--------|----------------|
| Full Financial Statements | ✅ Complete | Comprehensive tagging |
| Directors' Report | ✅ Complete | Enhanced disclosures |
| Cash Flow (recommended) | ⚠️ Optional | Not yet implemented |
| Comprehensive Notes | ✅ Complete | Full tagging |
| Average Employees | ✅ Complete | Mandatory |

### Large Companies (Exceed Medium Thresholds)

| Requirement | Status | Implementation |
|-------------|--------|----------------|
| Statutory Accounts | ✅ Complete | Full compliance |
| Directors' Report | ✅ Complete | Comprehensive |
| Strategic Report | ⚠️ Optional | Not yet implemented |
| Cash Flow Statement | ⚠️ Optional | Not yet implemented |
| Audit Report | N/A | External requirement |

---

## Entity Size Classification

### April 2025 Thresholds (2-of-3 Criteria)

**Automatic Classification Algorithm**:
```typescript
function classifyEntitySize(turnover, assets, employees):
  microCriteria = [
    turnover ≤ £1,000,000,
    assets ≤ £500,000,
    employees ≤ 10
  ]
  
  smallCriteria = [
    turnover ≤ £15,000,000,
    assets ≤ £7,500,000,
    employees ≤ 50
  ]
  
  mediumCriteria = [
    turnover ≤ £54,000,000,
    assets ≤ £27,000,000,
    employees ≤ 250
  ]
  
  if count(microCriteria) ≥ 2: return "micro"
  if count(smallCriteria) ≥ 2: return "small"
  if count(mediumCriteria) ≥ 2: return "medium"
  return "large"
```

### Example Classifications

**Example 1: Confirmed Micro (2-of-3 Rule)**
- Turnover: £800,000 ✓ (micro criterion met)
- Assets: £450,000 ✓ (micro criterion met)
- Employees: 12 ✗ (exceeds micro limit of 10)
- **Result**: Micro (meets 2 of 3 micro criteria - Classification = Micro)
- **Note**: Under 2-of-3 rule, entity qualifies as micro despite exceeding one threshold

**Example 2: Not Micro (Fails 2-of-3), Becomes Small**
- Turnover: £1,250,000 ✗ (exceeds £1m micro limit)
- Assets: £650,000 ✗ (exceeds £500k micro limit)
- Employees: 8 ✓ (micro criterion met)
- **Result**: Small (meets only 1 of 3 micro criteria → check small criteria: all 3 met)

**Example 3: Confirmed Small**
- Turnover: £3,250,000 ✓
- Assets: £1,925,000 ✓
- Employees: 28 ✓
- **Result**: Small (meets all 3 criteria)

**Example 4: Remains Small Despite One Threshold Breach**
- Turnover: £18,750,000 ✗ (exceeds £15m small limit)
- Assets: £6,250,000 ✓ (small criterion met)
- Employees: 42 ✓ (small criterion met)
- **Result**: Small (meets 2 of 3 small criteria - Classification = Small)
- **Note**: Exceeding one threshold doesn't change classification under 2-of-3 rule

**Example 5: Medium Classification (Fails Small 2-of-3)**
- Turnover: £18,750,000 ✗ (exceeds £15m)
- Assets: £8,000,000 ✗ (exceeds £7.5m)
- Employees: 42 ✓ (small criterion met)
- **Result**: Medium (meets only 1 of 3 small criteria → check medium: meets all 3 = Medium)
- **Note**: Must fail 2 of 3 small criteria to move to medium size

### Edge Cases and Boundary Situations

**First-Year Filing**:
- No prior year data available
- Classification based on current year figures only
- Document in notes that this is the first filing period

**Consecutive Year Threshold Breaches**:
- Company must meet size criteria for 2 consecutive years before reclassification
- Example: Small company has one year with £16m turnover → remains small
- If turnover exceeds £15m for 2 consecutive years → reclassifies to medium

**Dormant Companies**:
- No trading activity during period
- Typically classified as micro (minimal assets, no turnover, no employees)
- Must still file accounts annually

**Group Companies**:
- Parent company thresholds apply to consolidated group figures
- Individual subsidiaries classified on standalone basis
- Aggregated turnover/assets/employees used for group classification

**Public Interest Entities**:
- Listed companies, banks, insurers automatically excluded from small/micro
- Must prepare full accounts regardless of size thresholds
- Enhanced audit and disclosure requirements apply

---

## Sample Outputs

### Validation Report Example

```
═══════════════════════════════════════════════════════════
          ENHANCED iXBRL VALIDATION REPORT
═══════════════════════════════════════════════════════════

Status: ✅ VALID - Ready for submission

📊 DOCUMENT STATISTICS:
  Total Facts: 127
  UK-Tagged Elements: 89
  Contexts: 4
  Units: 2
  Namespaces: 7
  Validation Time: 245ms

📋 SUMMARY:
  Errors: 0
  Warnings: 2
  Placeholders: 0 critical, 0 warnings

⚠️  WARNINGS (Recommended Fixes):
───────────────────────────────────────────────────────────
  [SUSPICIOUS_ZERO_VALUE] Fact "uk-gaap:FixedAssets" has zero value
    - verify this is correct for your company
    Element: uk-gaap:FixedAssets
    Location: 0

═══════════════════════════════════════════════════════════
✅ VALIDATION PASSED
Document meets FRC 2025 and April 2027 requirements.
Ready for Companies House submission.
═══════════════════════════════════════════════════════════
```

### Error Example (Invalid Date)

```
🔴 ERRORS (Must Fix):
───────────────────────────────────────────────────────────
  [INVALID_START_DATE] Context "period" has invalid startDate
    "2024-13-01" - must be YYYY-MM-DD format
    Element: xbrli:startDate
    Location: period
```

### Placeholder Detection Example

```
🚨 PLACEHOLDERS DETECTED (Must Fix):
───────────────────────────────────────────────────────────
  [PLACEHOLDER] Potential placeholder detected in 
    uk-bus:DescriptionPrincipalActivities
    Value: "[Insert company activities here]"
    Location: uk-bus:DescriptionPrincipalActivities

  [INVALID_DATE] Invalid date format in 
    uk-bus:DateAuthorisationFinancialStatementsForIssue
    Value: "DD/MM/YYYY"
    Location: uk-bus:DateAuthorisationFinancialStatementsForIssue
```

---

## Professional Review Checklist

### Pre-Filing Review (Accountant Sign-Off)

**Section A: Entity Information**
- [ ] Company name matches Companies House records exactly
- [ ] Company registration number correct (8 digits)
- [ ] Registered address current and complete
- [ ] SIC code appropriate for business activities
- [ ] Accounting period dates correct (start and end)

**Section B: Entity Size Classification**
- [ ] Turnover figure used for classification verified
- [ ] Balance sheet total calculated correctly (Fixed + Current Assets)
- [ ] Average employees count verified
- [ ] 2-of-3 criteria rule correctly applied
- [ ] Entity size classification matches manual calculation

**Section C: Financial Statement Accuracy**
- [ ] Balance Sheet balances (Assets = Liabilities + Equity)
- [ ] Profit & Loss calculations verified
- [ ] Net assets equals shareholders' equity
- [ ] Prior year comparatives included (if applicable)
- [ ] All figures reconcile to trial balance

**Section D: Mandatory Disclosures**
- [ ] Profit & Loss included (ALL entity sizes from April 2027)
- [ ] Average employees disclosed (mandatory for ALL)
- [ ] Accounting policies stated clearly
- [ ] Accounting framework identified (FRS102/105/101/UKIFRS)
- [ ] Measurement convention stated

**Section E: Directors' Report (Small/Medium/Large Only)**
- [ ] Principal activities description is accurate and specific
- [ ] All directors who served during year are listed
- [ ] Director names spelled correctly
- [ ] Financial results summary included
- [ ] Approval date is realistic (within filing deadline)
- [ ] Signatory director name matches director list

**Section F: Audit Exemption (If Claiming)**
- [ ] Company meets all three exemption criteria:
  - [ ] Turnover ≤ £10.2m
  - [ ] Balance sheet total ≤ £5.1m
  - [ ] Average employees ≤ 50
- [ ] Section 477 statement included
- [ ] Directors' responsibilities statement included
- [ ] Members' agreement statement included (Section 476)

**Section G: Technical Compliance**
- [ ] All monetary values formatted consistently
- [ ] No placeholder text remains ([Company Name], XXX, TBD, etc.)
- [ ] All dates in ISO format (YYYY-MM-DD)
- [ ] No template markers or dummy data
- [ ] All required iXBRL tags present

**Section H: iXBRL Validation**
- [ ] Enhanced validation passed (0 errors)
- [ ] Critical placeholders resolved
- [ ] Context references valid
- [ ] Unit references valid
- [ ] Namespace declarations correct
- [ ] Schema reference points to FRC 2025 taxonomy

**Section I: Final Checks**
- [ ] Document renders correctly in browser
- [ ] All figures human-readable
- [ ] Cross-references functional
- [ ] File size reasonable (< 5MB)
- [ ] No XML parsing errors

### Sign-Off

**Prepared by**: _______________________________  
**Qualified Accountant**: [ ] Yes [ ] No  
**Professional Body**: _______________________________  
**Membership Number**: _______________________________  

**Reviewed Date**: _______________________________  
**Approval for Filing**: [ ] Yes [ ] No [ ] With Conditions  

**Comments / Conditions**:
```
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________
```

**Signature**: _______________________________

---

## Known Limitations

### Current System Limitations

1. **Cash Flow Statement**: Not currently auto-generated
   - **Impact**: Medium/large companies may need manual addition
   - **Workaround**: Add cash flow data manually before submission
   - **Timeline**: Planned for future release

2. **Strategic Report**: Not currently implemented
   - **Impact**: Large companies may need manual addition
   - **Workaround**: Add strategic report manually if required
   - **Timeline**: Planned for future release

3. **Prior Year Comparatives**: Basic implementation
   - **Impact**: May need manual verification
   - **Workaround**: Verify prior year figures manually
   - **Timeline**: Enhanced support planned

4. **Complex Group Structures**: Limited support
   - **Impact**: Parent/subsidiary relationships not fully automated
   - **Workaround**: Manual consolidation may be required
   - **Timeline**: Under consideration

5. **Related Party Transactions**: Manual input required
   - **Impact**: Requires accountant input for complex situations
   - **Workaround**: Add manually in notes section
   - **Timeline**: Planned enhancement

### Validation Limitations

1. **Business Logic Validation**: Limited
   - System validates technical compliance, not business logic
   - Example: Won't detect if profit margin is implausible
   - **Recommendation**: Professional review still essential

2. **Accounting Standards**: Framework-level checks only
   - Validates framework declaration, not detailed FRS102/105 rules
   - **Recommendation**: Accountant should verify accounting treatment

3. **Tax Calculations**: Not validated
   - System doesn't verify corporation tax calculations
   - **Recommendation**: Tax specialist review recommended

---

## Regulatory References

### Companies Act 2006
- **Section 477**: Audit exemption for small companies
- **Section 476**: Members' requirement for audit
- **Section 394**: Directors' duty to prepare accounts

### FRC Standards
- **FRS 102**: Financial Reporting Standard applicable in UK and RoI
- **FRS 105**: Financial Reporting Standard for Micro-entities
- **FRS 101**: Reduced Disclosure Framework
- **UK-IFRS**: International Financial Reporting Standards

### Companies House Requirements
- **Filing Deadline**: 9 months (private companies), 6 months (public)
- **Late Filing Penalties**: £150 to £1,500 depending on delay
- **Mandatory Software Filing**: April 2027 (4.8M UK companies affected)

---

## Contact Information

### Technical Support
- **Email**: technical@promptsubmissions.com
- **Phone**: 020 XXXX XXXX
- **Hours**: Monday-Friday, 9am-5pm GMT

### Compliance Queries
- **Email**: compliance@promptsubmissions.com
- **For**: FRC taxonomy, Companies House requirements

### Professional Services
- **For**: Complex cases requiring accountant consultation
- **Email**: professional@promptsubmissions.com

### Emergency Support (Filing Deadline)
- **Email**: urgent@promptsubmissions.com
- **Phone**: 020 XXXX XXXX (24/7 during filing season)

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 2.0 | Oct 2025 | Enhanced validation service, April 2027 compliance |
| 1.5 | Jun 2025 | FRC 2025 taxonomy implementation |
| 1.0 | Jan 2025 | Initial release |

---

## Appendix: Validation Error Codes

### Critical Errors (Must Fix)
- `XML_PARSE_ERROR`: Document not well-formed
- `MISSING_NAMESPACE`: Required namespace not declared
- `MISSING_SCHEMA_REF`: Schema reference not in ix:header
- `INVALID_CONTEXT_REF`: References undefined context
- `INVALID_UNIT_REF`: References undefined unit
- `MISSING_PROFIT_LOSS`: P&L required for all entities
- `MISSING_DIRECTORS_REPORT`: Required for small/medium/large
- `MISSING_AVERAGE_EMPLOYEES`: Mandatory disclosure missing

### Attribute Errors
- `MISSING_DECIMALS_ATTRIBUTE`: ix:nonFraction requires decimals
- `MISSING_UNIT_REF`: Monetary fact requires unitRef
- `MISSING_CONTEXT_REF`: Fact requires contextRef

### Value Errors
- `INVALID_NUMERIC_VALUE`: Cannot parse as number
- `INVALID_DATE_RANGE`: End date before start date
- `INVALID_CONTEXT_PERIOD`: Must be instant OR duration

### Warnings (Recommended Fixes)
- `SUSPICIOUS_ZERO_VALUE`: Major element has zero value
- `EMPTY_NUMERIC_FACT`: Numeric fact has no value
- `EMPTY_TEXTUAL_FACT`: Textual fact has no value

---

**Document prepared by**: PromptSubmissions Technical Team  
**Last updated**: October 2025  
**Next review**: Upon Companies House April 2027 implementation

---

*This document is for professional review purposes. While PromptSubmissions provides tools for technical compliance, directors remain legally responsible for the accuracy and completeness of filed accounts. Qualified professional review is recommended for all filings.*

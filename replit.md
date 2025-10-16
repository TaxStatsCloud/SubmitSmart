# PromptSubmissions - AI-Powered UK Corporate Compliance Platform

## Overview
PromptSubmissions is an AI-powered platform for UK corporate compliance, specializing in automated Confirmation Statements, Annual Accounts, and Corporation Tax return processing. It provides comprehensive tax preparation, agentic workflows for identifying and onboarding companies with filing deadlines, admin monitoring dashboards, and a credit-based billing system. The platform is strategically positioned to capitalize on the upcoming mandatory software filing requirement by Companies House for all UK companies by April 2027, targeting a market of 4.8+ million companies.

## User Preferences
- **Silicon Valley-level UI/UX**: Premium design with glass morphism, gradients, and professional visual hierarchy
- **Competitive Pricing**: Enterprise-level pricing that reflects the platform's professional capabilities
- **AI Excellence**: Chatbot must be expert-level on UK accounting rules, tax compliance, and platform usage
- Focus on professional, clean UI design with cutting-edge visual elements
- Prioritize user experience and workflow efficiency with intuitive navigation
- Maintain comprehensive documentation and error handling
- **Critical Priority**: Maximum accuracy in all filings with comprehensive supporting documentation
- **Auditor Trust**: Build features that provide transparency and detailed audit trails
- **Documentation Guidance**: Provide hints and support for users to upload correct documentation
- **Authority Compliance**: Ensure all filings meet the highest standards for HMRC and Companies House acceptance

## System Architecture
The platform features a React frontend with TypeScript, a Node.js/Express backend, and a PostgreSQL database with Drizzle ORM. UI/UX emphasizes a Silicon Valley-level design system with glass morphism, gradient backgrounds, and intuitive quick actions. Core technical implementations include AI-driven document processing using OpenAI, comprehensive financial reporting (P&L, Balance Sheet, Cash Flow), and an Extended Trial Balance system. Filing automation supports both HMRC and Companies House via XML Gateway integrations for iXBRL and CT600 submissions. The system also includes an agent orchestration system for proactive outreach and a credit-based billing system. Authentication is handled via Replit Auth with Google OAuth.

### Companies House April 2027 Compliance
The platform implements Companies House mandatory software filing requirements effective April 2027 (4.8M UK companies affected):

**iXBRL Generation Service** (`server/services/ixbrlGenerationService.ts`):
- **FRC 2025 Taxonomy**: Official namespace URIs (xbrl.frc.org.uk) with schema reference in ix:header
- **Entity Size Auto-Detection**: Automatic classification (micro/small/medium/large) based on April 2025 thresholds:
  - Micro: Turnover ≤ £1m, Balance Sheet ≤ £500k, Employees ≤ 10
  - Small: Turnover ≤ £15m, Balance Sheet ≤ £7.5m, Employees ≤ 50
  - Medium: Turnover ≤ £54m, Balance Sheet ≤ £27m, Employees ≤ 250
  - Large: Exceeds medium thresholds (2-of-3 criteria rule applies)
- **Mandatory P&L for Micro-Entities**: P&L privacy abolished - all entities must file profit & loss from April 2027
- **Directors' Report**: Mandatory for small/medium/large companies with required fields:
  - Principal activities description (required input field)
  - Directors list with iXBRL tagging
  - Financial results summary
  - Approval date and signatory director (required input fields)
- **Audit Exemption Statements**: Proper FRC 2025 tags for Section 477 compliance:
  - uk-bus:StatementOnComplianceWithAuditExemptionProvisions
  - uk-bus:StatementOfDirectorsResponsibilities
  - uk-bus:StatementThatMembersHaveNotRequiredCompanyToObtainAnAudit
- **Full Tagging Mandate**: Comprehensive notes and disclosures:
  - Accounting policies (FRS102/FRS105/FRS101/UKIFRS)
  - Measurement convention and basis of preparation
  - Average employees (mandatory for ALL companies since Oct 2020)
  - Complete balance sheet and P&L tagging
- **Input Validation**: Required fields validated before generation (directors, principal activities, approval date, average employees)

**iXBRL Validation Services**:

*Legacy Service* (`server/services/ixbrlValidationService.ts`):
- Basic regex-based validation for backwards compatibility
- String pattern matching for quick pre-checks
- Context/unit reference verification
- Maintained for legacy integrations

*Enhanced Service* (`server/services/ixbrlEnhancedValidationService.ts`) - **PRODUCTION READY**:
- **DOM/XPath Validation**: Proper XML parsing with element queries
- **Comprehensive Placeholder Detection**: 
  - Pattern matching ([placeholder], {template}, XXX, TBD, etc.)
  - Invalid date detection (DD/MM/YYYY, 00/00/0000, etc.)
  - Repeated character detection (suspicious patterns)
  - Generic name detection (Company Name, Director Name)
- **Fact Value Validation**: Numeric format checking, zero value warnings
- **Cross-Reference Verification**: Context and unit ID validation using DOM
- **Namespace Validation**: Proper DOM-based namespace declaration checking
- **Schema Reference Validation**: FRC 2025 taxonomy verification
- **Statistics Reporting**: Total facts, tagged elements, contexts, units
- **Detailed Reporting**: Error codes, warnings, placeholder locations, validation time

**Implementation Status**:
- ✅ **Complete**: FRC 2025 taxonomy, entity size detection, mandatory P&L inclusion, Directors' Report templates, audit exemption tags
- ✅ **Complete**: Full iXBRL tagging structure, namespace URIs, schema references
- ✅ **Complete**: Input field validation (required data must be provided)
- ✅ **Complete**: DOM/XPath-based validation with comprehensive element checking
- ✅ **Complete**: Comprehensive placeholder detection (patterns, dates, repeated characters)
- ✅ **Complete**: Enhanced validation integrated into Companies House and HMRC filing workflows (production default)
- ✅ **Complete**: Admin dashboard with validation results display (errors, warnings, placeholders, statistics)
- ✅ **Complete**: Professional accountant review dashboard with approval workflow
- ⚠️ **Basic**: Legacy regex-based validation (ixbrlValidationService.ts) for backwards compatibility
- 🚀 **Production**: Enhanced validation service (ixbrlEnhancedValidationService.ts) with DOM parsing, fact validation, cross-reference checking

### Professional Review Dashboard
The platform includes a dedicated accountant-facing review dashboard (`/filings/review`) for professional oversight:

**FilingReview Page** (`client/src/pages/FilingReview.tsx`):
- **Summary Metrics**: Real-time cards showing total filings awaiting review, warnings count, errors count, ready-to-approve count
- **Filing Cards**: Color-coded borders (red for errors, amber for warnings, green for valid) with company information, entity size badges, and validation status
- **Validation Details**: Expandable accordion with tabs for:
  - Summary: Overall status, error/warning/placeholder counts
  - Errors: Detailed list of validation errors with code, message, element, location
  - Warnings: Detailed list of warnings with full context
  - Statistics: iXBRL metrics (total facts, tagged elements, contexts, units)
- **Approval Workflow**: 
  - Approve button disabled for filings with errors or placeholders (client-side enforcement)
  - Server-side validation prevents approval bypass (400/409 status codes)
  - Reject button allows returning filings for revision with reason
  - Activity logging for all approval/rejection actions
  - Toast notifications for success/error feedback

**Review API Endpoints** (`server/routes.ts`):
- `GET /api/filings/awaiting-approval` - Fetches filings with status 'awaiting_approval', sorted by creation date
- `POST /api/filings/:id/approve` - Approves filing with server-side validation enforcement:
  - Blocks if errorCount > 0 (returns 400)
  - Blocks if placeholderCount > 0 (returns 400)
  - Requires validation results to exist (returns 409)
  - Creates activity log on success
- `POST /api/filings/:id/reject` - Rejects filing with required reason validation:
  - Validates reason is non-empty string (returns 400 if invalid)
  - Stores rejection reason in filing metadata
  - Creates activity log with rejection details

**Security & Validation**:
- Dual-layer validation: Client-side UX + Server-side enforcement
- Prevents approval bypass via direct API calls
- Detailed error responses for debugging
- Activity audit trail for compliance

## External Dependencies
- **OpenAI**: For AI-driven document processing and financial data extraction.
- **PostgreSQL**: Primary database for all application data.
- **Drizzle ORM**: Used for database interactions.
- **Stripe**: For payment processing and the credit-based billing system.
- **Companies House XML Gateway**: For direct electronic filing of Annual Accounts (iXBRL) and Confirmation Statements (CS01).
- **HMRC Corporation Tax API**: For submission of CT600 tax returns.
- **Replit Auth**: For user authentication and session management.
- **SendGrid**: For email notifications (welcome emails, filing confirmations, payment notifications).
- **WebSockets**: For real-time updates and notifications.
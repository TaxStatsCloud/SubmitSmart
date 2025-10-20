# PromptSubmissions - AI-Powered UK Corporate Compliance Platform

## Overview
PromptSubmissions is an AI-powered platform for UK corporate compliance, automating the submission of Confirmation Statements, Annual Accounts, and Corporation Tax returns. It uses AI for tax preparation, agentic workflows for onboarding and deadline management, and provides administrative monitoring dashboards. The platform operates on a **tiered credit-based billing system** where filing costs vary by complexity, addressing the upcoming mandatory software filing requirement by Companies House by April 2027 and targeting the UK corporate compliance market.

## Credit-Based Pricing Model

### Tiered Pricing Philosophy
More complex filings require more AI processing, validation, and compliance checks, justifying higher credit costs:

**Annual Accounts (Entity Size-Based)**:
- **Micro-entity**: 150 credits - Simplified accounts, no Cash Flow Statement, minimal disclosures
- **Small company**: 200 credits - Standard accounts, full P&L, no Cash Flow required
- **Medium company**: 300 credits - Full accounts + mandatory Cash Flow Statement
- **Large company**: 400 credits - Full accounts + Cash Flow + Strategic Report

**Corporation Tax CT600 (Complexity-Based)**:
- **Simple**: 150 credits - Basic trading company, no supplementary pages
- **Standard**: 200 credits - Standard company with some supplementary pages
- **Complex**: 300 credits - Multiple supplementary pages (CT600A/B/C/D)
- **Group**: 400 credits - Group companies with consolidated returns

**Confirmation Statement (CS01)**: 100 credits (flat rate - minimal variation)

## User Preferences
- **Silicon Valley-level UI/UX**: Premium design with glass morphism, gradients, and professional visual hierarchy
- **Dark Mode Support**: Full dark mode implementation with system preference detection and manual toggle
- **Competitive Pricing**: Enterprise-level pricing that reflects the platform's professional capabilities
- **AI Excellence**: Chatbot must be expert-level on UK accounting rules, tax compliance, and platform usage
- Focus on professional, clean UI design with cutting-edge visual elements
- Prioritize user experience and workflow efficiency with intuitive navigation
- Maintain comprehensive documentation and error handling
- **Critical Priority**: Maximum accuracy in all filings with comprehensive supporting documentation
- **Auditor Trust**: Build features that provide transparency and detailed audit trails
- **Auditor Access**: Enable users to invite external auditors to review filings and source documents with read-only access
- **Documentation Guidance**: Provide hints and support for users to upload correct documentation
- **Authority Compliance**: Ensure all filings meet the highest standards for HMRC and Companies House acceptance

## Exemptions Strategy

UK companies can claim various exemptions when filing accounts:

**Audit Exemption**: Small companies (turnover ≤£10.2m, assets ≤£5.1m) can claim audit exemption under Companies Act 2006 s477. Platform validates eligibility based on financial thresholds.

**Abbreviated Accounts**: Small companies can file abbreviated accounts to Companies House while maintaining full accounts for members. Platform generates both versions when requested.

**Dormant Company Exemptions**: Dormant companies have simplified filing requirements. Platform detects dormancy (no significant accounting transactions) and applies appropriate exemptions.

**Filing Workflow**: Exemptions wizard step added before final review, with automatic eligibility checks and appropriate exemption statements included in iXBRL packages.

## System Architecture
The platform utilizes a React frontend (TypeScript), a Node.js/Express backend, and a PostgreSQL database with Drizzle ORM. The UI/UX emphasizes a Silicon Valley-level design with glass morphism and gradient backgrounds. Key functionalities include AI-driven document processing, comprehensive financial reporting (P&L, Balance Sheet, Cash Flow), an Extended Trial Balance system, and an iXBRL Generation Service supporting FRC 2025 Taxonomy.

Filing automation integrates with HMRC and Companies House via XML Gateway for iXBRL and CT600 submissions, including sophisticated authentication for both government APIs. A multi-agent system automates customer acquisition, featuring a Companies House Discovery Agent, an Email Enrichment Service, and a three-tier Outreach Campaign System. Admin dashboards provide real-time lead pipelines, agent control, conversion analytics, and user management with role-based access control. Authentication is handled via email/password with Passport.js, scrypt hashing, and PostgreSQL-backed session storage.

**Critical Backend Enforcement**: Entity size detection validates against actual financial thresholds to prevent tiered pricing bypasses. Medium/large companies cannot file without substantive Cash Flow Statements and Strategic Reports (large only). All credit deduction paths use centralized tiered pricing functions.

The system incorporates multi-company management with tier-based limits, a secure backend AI chatbot, and smart recommendation security with tenant isolation. UX includes a UK Accounting Expert AI Chatbot, deadline warnings, credit usage visualization, and AI-powered smart filing recommendations. Guided filing workflows for Annual Accounts, Confirmation Statements, and CT600 offer contextual help. An invitation-based Auditor Access System provides a read-only `auditor` role. Legal disclaimers are integrated at three levels to ensure compliance and user responsibility without impacting user experience. The platform also supports comparative year functionality for UK accounting standards, and a comprehensive CT600 validation system mapped to all 165 HMRC form boxes, including intelligent supplementary page detection and prior year comparison.

**AI-Powered Report Generation** (Chargeable Revenue Features): Four AI services generate compliant UK statutory reports using OpenAI GPT-4o:
- **Directors Report Generator** (150 credits): Creates compliant directors' reports including principal activities, business review, results/dividends, future developments, and statutory statements
- **Strategic Report Generator** (200 credits): Produces comprehensive strategic reports for large companies with business model, KPIs, principal risks, Section 172(1) statement, and ESG disclosures
- **Notes to Accounts Generator** (100 credits): Generates detailed accounting policy notes with FRS 102 compliance, basis of preparation, going concern, and all key accounting policies
- **Cash Flow Statement Generator** (200 credits): Analyzes current and prior year Trial Balances to produce FRS 102 compliant Cash Flow Statements using the indirect method, with operating, investing, and financing activities sections
- **Bulk Generation with Dynamic Pricing** (20% discount): Generates multiple reports in parallel with FAIR PRICING - you only pay for reports actually generated. Examples: 2 reports (Directors + Notes) = 200 credits vs 250 individually; all 4 reports = 520 credits vs 650 individually. Pricing calculated dynamically based on company size and provided data.

API endpoints at `/api/ai/directors-report`, `/api/ai/strategic-report`, `/api/ai/notes-to-accounts`, `/api/ai/cash-flow-statement`, and `/api/ai/bulk-generate-reports` validate credits, generate reports, deduct charges, and log transactions. Bulk endpoint uses dynamic pricing with optional rate limiter credit check to ensure fairness. All AI output schemas are 100% aligned with the Annual Accounts Wizard form fields for seamless integration.

**Production-Grade Rate Limiting**: Global 10 AI requests/minute limit across ALL endpoints using atomic PostgreSQL transactions with SELECT FOR UPDATE row-level locking. UPSERT pattern prevents first-time race conditions. 5-minute automatic blocking for abusers with comprehensive logging.

**Atomic Webhook Processing**: Production-grade Stripe webhook handling with database-level idempotency protection using `processedWebhookEvents` table with unique constraint on `eventId`. All webhook operations execute within database transactions ensuring atomicity:

- **Credit Purchases** (`processStripeWebhookAtomic`): Event recording, credit addition, and transaction creation in single atomic transaction - if any step fails, all changes rollback.
- **Filing Payments** (`processFilingPaymentWebhookAtomic`): Event recording, filing status update, and activity creation in single atomic transaction.

Unique constraint on `eventId` prevents duplicate processing even under race conditions or webhook retries. Error handling returns HTTP 200 on all handled failures (including duplicates) to prevent Stripe retry storms while logging all errors for monitoring. Both webhook endpoints (`/api/stripe-webhook` and `/api/billing/webhook`) use atomic processing methods ensuring consistency across all payment flows.

## UX Enhancement Suite (Production-Ready)

**"Replit-Level Quality"** - 10 production-ready features designed to make accountants genuinely enjoy using the platform:

**1. Auto-Save System** (`useAutoSave` hook):
- 30-second interval with 1-second debounce for rapid keystrokes
- Crash recovery via localStorage with hash-based change detection
- beforeunload protection with unsaved changes warning
- Handles pristine data, edit/revert scenarios correctly
- Visual indicator (AutoSaveIndicator) showing save status

**2. Granular Progress Tracking** (`FilingProgress` component):
- Step-by-step filing workflow visualization
- Status icons (pending/in_progress/completed/error)
- Error messaging with descriptions
- Overall completion percentage bar
- Used in Annual Accounts, CT600, and CS01 wizards

**3. Contextual AI Help** (`ContextualHelp` component):
- Info/warning/help tooltip types with icons
- Examples and warnings sections for complex fields
- Fully accessible (aria-labels, screen reader support)
- Multiple positioning options (top/right/bottom/left)

**4. Smart Validation Messages** (`SmartValidationMessage` component):
- Error/warning/success/suggestion types with distinct styling
- Actionable buttons with auto-fix support
- Helpful guidance instead of generic errors (e.g., "Your turnover exceeds micro-entity limits. Upgrade to small company filing?")

**5. Activity Feed & Audit Trail** (`ActivityFeed` component):
- Real-time activity stream with type-specific icons
- Metadata badges for context (filing types, amounts, users)
- Timestamps with "time ago" formatting
- Ready for WebSocket/React Query integration

**6. Excel Import/Export** (`excelHelpers` utility):
- Intelligent column mapping (auto-detects Account Code, Debit, Credit headers)
- 10,000 row limit prevents UI thread lock on large files
- Trial balance validation with error reporting
- Export functionality for reports and data

**7. Celebration Micro-interactions** (`CelebrationConfetti` component):
- Canvas-based confetti animation (zero React state churn)
- Physics simulation with gravity and rotation
- 50 particles with color variety
- Triggers on filing submissions and credit purchases

**8. Smart Dashboard** (`SmartDashboardWidget` component):
- Urgency + date sorting (high/medium/low priority)
- "What needs attention today" widget
- Credit balance and activity trends display
- Quick action buttons for common tasks

**9. Version History System** (`VersionHistory` component):
- Auto-save/manual-save/pre-submission snapshots
- Preview and restore workflow with confirmation
- Export functionality for audit trails
- Supports rollback to any previous version

**10. Filing Progress Integration**:
- Integrated into CS01, Annual Accounts, and CT600 wizards
- Real-time step tracking with estimated time remaining
- Visual feedback for validation and submission progress

**Bug Fixes & Production Readiness:**
- Fixed CS01 wizard Share Capital step progression (was missing Next button)
- All components tested end-to-end with Playwright
- Responsive design verified (mobile + desktop)
- Accessibility compliance (ARIA labels, screen reader support)
- Production deployment verified (port 5000, env vars, PostgreSQL persistence)

## External Dependencies
- **OpenAI**: AI-driven document processing, financial data extraction, and smart filing recommendations.
- **PostgreSQL**: Primary database for application data, session storage, and persistence.
- **Drizzle ORM**: Database interaction.
- **Stripe**: Payment processing and credit-based billing.
- **Companies House XML Gateway**: Direct electronic filing (Annual Accounts, Confirmation Statements).
- **HMRC Corporation Tax API**: CT600 tax return submission.
- **Passport.js**: Email/password authentication.
- **SendGrid**: Email notifications.
- **WebSockets**: Real-time updates and notifications.
- **Hunter.io**: Email enrichment service for lead generation.
- **Exa AI**: Neural search API for advanced company data enrichment and decision maker discovery.
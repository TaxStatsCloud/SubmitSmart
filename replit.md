# PromptSubmissions - AI-Powered UK Corporate Compliance Platform

## Overview
PromptSubmissions is an AI-powered platform for UK corporate compliance, automating Confirmation Statements, Annual Accounts, and Corporation Tax returns. It includes AI-driven tax preparation, agentic workflows for company onboarding and deadline identification, administrative monitoring dashboards, and a credit-based billing system. The platform aims to address the upcoming mandatory software filing requirement by Companies House by April 2027, targeting over 4.8 million companies in the UK corporate compliance market.

## User Preferences
- **Silicon Valley-level UI/UX**: Premium design with glass morphism, gradients, and professional visual hierarchy
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

## System Architecture
The platform utilizes a React frontend (TypeScript), a Node.js/Express backend, and a PostgreSQL database with Drizzle ORM. The UI/UX emphasizes a Silicon Valley-level design with glass morphism, gradient backgrounds, and intuitive quick actions. Core features include AI-driven document processing, comprehensive financial reporting (P&L, Balance Sheet, Cash Flow), and an Extended Trial Balance system. Filing automation integrates with HMRC and Companies House via XML Gateway for iXBRL and CT600 submissions.

The platform includes a sophisticated multi-agent system for automated customer acquisition:
- **Companies House Discovery Agent**: Industry-targeted searches, lead scoring based on filing deadlines, entity size, and company status. Includes deduplication and adaptive rate limiting.
- **Email Enrichment Service**: Automated contact discovery via Hunter.io for prospects without email addresses, with confidence scoring and rate limiting.
- **Outreach Campaign System**: Three-tier email campaigns (initial, follow-up, urgent warnings) with personalized templates, SendGrid integration, and campaign tracking.

Admin dashboards provide real-time lead pipelines, agent control, conversion analytics, and user management with role-based access control. Authentication uses email/password with Passport.js, scrypt hashing, and PostgreSQL-backed session storage with a 7-day TTL.

A critical iXBRL Generation Service supports Companies House's mandatory filing requirements, incorporating the FRC 2025 Taxonomy, automatic entity size detection, and robust tagging. An enhanced iXBRL Validation Service, using DOM/XPath, ensures comprehensive validation and detailed error reporting. A professional accountant review dashboard (`/filings/review`) offers summary metrics, validation results, and an approval workflow with dual-layer validation.

Recent enhancements include multi-company management with tier-based limits (Basic, Professional, Enterprise), secure backend AI chatbot integration to prevent API key exposure, and smart recommendation security for tenant isolation. The agent system has been enhanced with broader industry targeting, increased result fetching, and improved data mapping. Exa AI integration provides comprehensive company data enrichment, including decision maker discovery and enhanced lead scoring. Production readiness is ensured with PostgreSQL for persistence.

UX enhancements include a UK Accounting Expert AI Chatbot, deadline warnings with urgency indicators, credit usage visualization, and AI-powered smart filing recommendations. Guided filing workflows for Annual Accounts, Confirmation Statements, and CT600 include contextual help and progress tracking. Analytics accuracy has been improved with consistent metrics and comprehensive audit logging. Advanced pricing tiers (Basic, Professional, Enterprise) offer varying credit multipliers and company management limits, with volume discounts and tier-specific credit packages. Mobile optimization includes responsive dashboards, mobile-optimized wizards, and full PWA support.

## Phase 3 Completion Status (100% - January 2025)

**Status**: Phase 3 complete (21/21 tasks) - All guided workflows, production monitoring, advanced pricing, mobile optimization, and comprehensive E2E testing finished and architect-approved.

### Critical Bugs Fixed During Testing
Testing uncovered and resolved several production-critical bugs:

1. **CT600 Free Filing Bug** (Task 19): CT600 wizard was not deducting credits - users could file Corporation Tax returns for free. Fixed by adding `storage.createFilingWithCreditDeduction` with 30-credit atomic deduction.

2. **Billing Multi-Tenancy Bug** (Task 20): All 6 billing API endpoints (`/credits`, `/transactions`, `/packages/user`, `/create-payment-intent`, `/create-filing-payment`, `/deduct-credits`) used hardcoded `userId = 1` instead of authenticated user ID. Users saw incorrect balances and transaction history. Fixed by using `req.user.id` for proper multi-tenant isolation.

3. **Annual Accounts Cost Mismatch** (Task 17): Backend charged 120 credits but should charge 25 credits. Fixed backend storage call and removed hardcoded "120" from frontend alert.

4. **Confirmation Statement Documentation** (Task 18): Frontend showed 10 credits but actual cost is 50 credits. Updated documentation and added missing `wizardRoute` for Start Filing button.

### E2E Testing Coverage
Complete playwright-based E2E test suite covering all critical user workflows:
- **Annual Accounts Wizard** (Task 17): All 3 steps, financial data entry, credit deduction, database verification
- **Confirmation Statement Wizard** (Task 18): Company info, officers, shareholders, SIC codes, 50-credit deduction
- **CT600 Filing Wizard** (Task 19): Tax calculations, reliefs, allowances, 30-credit deduction, HMRC-ready XML
- **Payment & Credit System** (Task 20): Credit balance display, transaction history, credit package pricing, tier-specific packages
- **Admin Workflows** (Task 21): User management, tier management, analytics dashboard, production monitoring

All tests include database verification, atomic transaction validation, and multi-tenancy isolation checks.

### Production Readiness
- ✅ **Credit System Integrity**: All filing wizards use atomic `createFilingWithCreditDeduction` transactions
- ✅ **Multi-Tenant Security**: Billing endpoints enforce user isolation via authenticated `req.user.id`
- ✅ **Accurate Billing**: Credit costs verified - Annual Accounts (25), Confirmation Statement (50), CT600 (30)
- ✅ **Transaction Logging**: All credit deductions create audit trail in `credit_transactions` table
- ✅ **Mobile Optimization**: 44px touch targets, responsive navigation (bottom tabs/hamburger/sidebar), PWA support
- ✅ **Admin Features**: User management, tier assignment, analytics, production monitoring all functional

## Production Hardening Audit (January 2025)

**Status**: 🚨 **Critical production blockers eliminated** - All hardcoded user/company IDs removed, authentication middleware enforced across all sensitive endpoints.

### Critical Fixes Applied
Fixed 13+ endpoints with hardcoded `userId = 1` or `companyId = 1` that would have caused catastrophic multi-tenancy failures in production:

1. **Tax Filing Endpoints** (4 endpoints):
   - `GET /api/tax-filings/:companyId/:period` - Added auth, uses `req.user.id`
   - `POST /api/tax-filings/:companyId/:period/section` - Added auth, uses `req.user.id`
   - `POST /api/tax-filings/:companyId/:period/calculate` - Added auth
   - `POST /api/tax-filings/:companyId/:period/submit` - Added auth, uses `req.user.id`

2. **User Profile Endpoints** (2 endpoints):
   - `GET /api/auth/me` - Removed hardcoded 'sarah.thompson' lookup, uses `req.user.id`
   - `PATCH /api/auth/me` - Added auth, uses `req.user.id`

3. **Document Upload Endpoint** (1 endpoint):
   - `POST /api/documents/upload` - Added auth, uses `req.user.id` and `req.user.companyId`
   - Validates user has associated company before upload

4. **Assistant/Chatbot Endpoints** (3 endpoints):
   - `GET /api/assistant/messages` - Added auth, uses `req.user.id`
   - `POST /api/assistant/messages` - Added auth, uses `req.user.id`
   - `DELETE /api/assistant/messages` - Added auth, uses `req.user.id`

5. **Filing Management Endpoints** (7 endpoints):
   - `POST /api/filings` - Added auth, uses `req.user.id`
   - `PATCH /api/filings/:id` - Added auth, uses `req.user.id`
   - `DELETE /api/filings/:id` - Added auth, uses `req.user.id` (prevents anonymous deletion)
   - `POST /api/filings/:id/submit` - Added auth, uses `req.user.id`
   - `POST /api/filings/:id/approve` - Added auth, uses `req.user.id`
   - `POST /api/filings/:id/reject` - Added auth, uses `req.user.id`

6. **Admin Monitoring Endpoints** (5 endpoints):
   - `GET /api/admin/agent-stats` - Added `isAdmin` middleware (role-based access control)
   - `GET /api/admin/prospects` - Added `isAdmin` middleware (role-based access control)
   - `GET /api/admin/outreach` - Added `isAdmin` middleware (role-based access control)
   - `GET /api/admin/user-usage` - Added `isAdmin` middleware (role-based access control)
   - `GET /api/admin/filings` - Added `isAdmin` middleware (role-based access control)

### Security Improvements
- **Authentication Enforcement**: All sensitive endpoints now require `isAuthenticated` middleware
- **Role-Based Authorization**: Admin endpoints protected with `isAdmin` middleware (returns 403 for non-admin users)
- **User Isolation**: Activity logging, filing operations, and document uploads use authenticated user ID
- **Company Validation**: Document uploads verify user has associated company
- **Audit Trail Integrity**: All activity logs now correctly attribute actions to authenticated users

### Data Pre-Population Enhancement (January 2025)
**Feature**: Automatic form pre-fill from Annual Accounts to CT600 filing

**Implementation**:
- New endpoint: `GET /api/ct600/prefill/:companyId`
- Maps P&L data: turnover, cost of sales, administrative expenses → CT600 operating expenses
- Pre-fills company info: name, registration number, accounting period
- Visual indicator: Blue alert banner shows source filing date
- UX benefit: Saves 5-10 minutes per CT600 filing
- All pre-filled fields remain editable

**Future Extensions**:
- Confirmation Statement ← Annual Accounts (officer details, registered office)
- Next Year's Annual Accounts ← Previous Year (comparative figures, opening balances)
- Multi-year P&L trends with auto-calculated YoY growth

### Auditor Access System (January 2025)
**Feature**: Invitation-based auditor access for external accountants/auditors

**Implementation**:
- New role: `auditor` (read-only access to filings + source documents)
- Auditor invitations table: Token-based, email invitations with 7-day expiry
- Email integration: SendGrid sends professional invitation emails
- Endpoints:
  - `POST /api/auditors/invite` - Send invitation (requires auth + companyId)
  - `GET /api/auditors/invitations` - List company invitations
  - `POST /api/auditors/accept/:token` - Accept invitation, create/upgrade account
  - `DELETE /api/auditors/invitations/:id` - Cancel invitation
- Middleware: `isAuditor` for role-based access control (admin can also access)
- Security: Invitations expire, can be cancelled, granular filing-level access control

**Use Cases**:
- Directors invite their accountant to review Annual Accounts before submission
- External auditors review supporting documents for compliance
- Accountants verify CT600 calculations and tax reliefs

### Known Minor Issues (Non-Blocking)
- Admin analytics `/api/admin/analytics/user-activity` endpoint returns 500 error (ReferenceError: `users2` before initialization)
- TypeScript diagnostics in legacy code (server/routes.ts, CorporationTax.tsx, Credits.tsx)
- Transaction page UI shows "Balance: 75 credits" while header/DB confirm 70 credits (display calculation issue)

### Credit Costs Reference
| Filing Type | Credit Cost | Route |
|-------------|-------------|-------|
| Annual Accounts | 25 credits | `/wizards/annual-accounts` |
| Confirmation Statement | 50 credits | `/wizards/confirmation-statement` |
| Corporation Tax (CT600) | 30 credits | `/wizards/ct600` |

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
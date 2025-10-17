# PromptSubmissions - AI-Powered UK Corporate Compliance Platform

## Overview
PromptSubmissions is an AI-powered platform designed for UK corporate compliance, automating Confirmation Statements, Annual Accounts, and Corporation Tax returns. It includes comprehensive tax preparation, agentic workflows for identifying and onboarding companies with filing deadlines, administrative monitoring dashboards, and a credit-based billing system. The platform aims to capture a significant share of the UK corporate compliance market by providing solutions for the upcoming mandatory software filing requirement by Companies House by April 2027, impacting over 4.8 million companies.

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
The platform is built with a React frontend (TypeScript), a Node.js/Express backend, and a PostgreSQL database utilizing Drizzle ORM. The UI/UX emphasizes a Silicon Valley-level design with glass morphism, gradient backgrounds, and intuitive quick actions. Key technical features include AI-driven document processing, comprehensive financial reporting (P&L, Balance Sheet, Cash Flow), and an Extended Trial Balance system. Filing automation integrates with HMRC and Companies House via XML Gateway for iXBRL and CT600 submissions.

### Agent System & Lead Generation (ENHANCED - Oct 2025)
The platform features a sophisticated multi-agent system for automated customer acquisition:

**Companies House Discovery Agent** (Enhanced):
- Industry-targeted search with 14 query terms covering professional services, retail, tech, hospitality, construction
- Fetches 50 results per query (up from 20), discovering 700+ unique companies per run
- Deduplication system prevents duplicate processing using Set-based tracking
- Adaptive rate limiting (500ms-1000ms) to optimize API usage while respecting limits
- Automated lead scoring based on filing deadlines, entity size, and company status

**Email Enrichment Service** (Hunter.io):
- Automated contact discovery for prospects without email addresses
- Batch enrichment supporting up to 50 prospects per run
- Confidence scoring and position tracking for discovered contacts
- Rate-limited API calls (1 request/second) to avoid quota exhaustion

**Outreach Campaign System**:
- Three-tier email campaigns: Initial outreach, follow-ups, urgent deadline warnings
- Personalized templates with company-specific filing deadlines
- Campaign tracking with metadata (last contacted, follow-up dates, conversion status)
- SendGrid integration with bounce/unsubscribe handling

**Admin Dashboards**:
- ProspectsDashboard: Real-time lead pipeline, lead scoring, manual agent triggers
- AgentControlPanel: Schedule management, manual agent execution, run history
- AdminAnalytics: Conversion metrics, campaign performance, revenue analytics
- UserManagement: Role-based access control, subscription management

Agent management is secured via admin-only routes protected by isAdmin middleware requiring role='admin'.

Authentication is managed via email/password with Passport.js (passport-local strategy), using secure password hashing (scrypt) and PostgreSQL-backed session storage (connect-pg-simple) with 7-day session TTL. Session table is auto-created at startup with verification check. A /api/refresh-session endpoint allows users to refresh their session after role changes (note: users must explicitly call this endpoint as sessions cache user data).

A critical component is the iXBRL Generation Service, designed for Companies House's April 2027 mandatory filing requirements. It incorporates the FRC 2025 Taxonomy, automatic entity size detection, mandatory P&L for micro-entities, and robust Directors' Report and audit exemption statement generation with full tagging. An enhanced iXBRL Validation Service, using DOM/XPath, ensures comprehensive validation, including placeholder detection, fact value validation, and cross-reference verification, reporting detailed errors and warnings. A professional accountant review dashboard (`/filings/review`) provides summary metrics, color-coded filing cards, detailed validation results, and an approval workflow with dual-layer client-side and server-side validation to prevent approval bypass.

## Recent Changes (October 2025)

### Authentication & Admin Access
- Fixed dev-login endpoint session serialization bug (corrected passportUser object structure)
- Verified admin credentials: admin@promptsubmissions.com / Admin123! (documented in ADMIN_CREDENTIALS.md)
- Integrated admin routes into sidebar navigation with role-based visibility
- Fixed Landing page Sign In button routing to /auth

### Security Enhancements
- **CRITICAL FIX**: Migrated AI chatbot from client-side OpenAI calls to secure backend API
- Created `/api/chatbot/*` routes to handle AI interactions server-side
- Removed OpenAI API key exposure from client environment variables
- Implemented session-based conversation management with proper rate limiting
- AI chatbot now properly secured against API key theft and unauthorized usage

### Agent System Enhancements
- **Companies House Discovery**: Expanded from 3 to 14 industry-targeted search terms
- Increased per-query results from 20 to 50 (700+ companies per run vs 60 previously)
- Added Set-based deduplication to prevent duplicate company processing
- Implemented adaptive rate limiting (500ms-1000ms based on volume)
- Improved data mapping with better fallbacks for company type, address, SIC codes

### Exa Integration for Data Enrichment (October 2025)
- **Comprehensive Company Enrichment**: Integrated Exa AI neural search API for advanced company data enrichment
- Extended prospects schema with enriched fields: website, description, employee count, revenue, funding stage, tech stack, recent news, social profiles
- Created decision_makers table to track C-level contacts (CFOs, Finance Directors, MDs, CEOs) discovered via Exa
- **ExaService**: Company enrichment with 300+ data points, decision maker discovery, intelligent data extraction
- **ExaEnrichmentAgent**: Automated batch enrichment of prospects with enhanced lead scoring based on company signals
- **Enhanced Lead Scoring**: Boosts for employee count (5-15 pts), funding stage (5-25 pts), website presence (5 pts), recent news (2-10 pts), social profiles (3-10 pts)
- **ProspectCard Component**: Modern card-based UI showing enriched company data and decision maker contacts
- Admin controls via ProspectsDashboard "Enrich Data" button and `/api/agents/exa-enrichment` endpoint
- Rate limiting: 1s per prospect, 500ms per decision maker query to respect Exa API limits

### Critical Storage Fix (October 2025)
- **FIXED**: Switched from MemStorage to DatabaseStorage for production-ready persistence
- All user data, prospects, filings now properly persisted to PostgreSQL
- Admin login now works correctly with database-backed authentication
- Session management fully integrated with PostgreSQL (connect-pg-simple)

### System State
**Production Ready:**
- iXBRL generation with FRC 2025 taxonomy compliance
- Enhanced iXBRL validation service with comprehensive error detection
- CT600 corporation tax filing automation
- Confirmation Statement (CS01) filing
- Admin portal with user management, subscriptions, analytics
- Multi-agent system for lead generation and customer acquisition
- Email/password authentication with secure session management
- Credit-based billing system with Stripe integration

**Recently Completed (October 2025):**
- UK Accounting Expert AI Chatbot: Comprehensive knowledge base covering Corporation Tax (CT600), Annual Accounts (iXBRL), Confirmation Statements (CS01), UK GAAP (FRS 102), filing deadlines, penalties, entity size detection, and detailed workflow guides for all filing types
- Enhanced quick responses with 8 common queries covering April 2027 deadline, tax rates, document requirements, credit system, and penalties
- **Phase 1 (Foundation)**: Filing analytics dashboard with accurate metrics, comprehensive audit logging infrastructure
- **Phase 2 (UX Excellence - In Progress)**: Deadline warnings with urgency indicators, credit usage visualization with low balance alerts

### UX Enhancements - Phase 2 (October 2025)

**Dashboard Improvements:**
- **Deadline Warnings Component**: Prominent visual alerts for urgent filings (<30 days: critical red, <60 days: warning amber)
  - Displays up to 3 critical filings and 2 warning filings with countdown timers
  - Actionable "Start Filing" or "Continue" buttons for immediate action
  - Overdue filing alerts with clear penalty warnings
  - Auto-hides when no urgent deadlines exist

- **Credit Usage Visualization**: Interactive charts showing credit consumption patterns
  - 30-day credit balance trend with area chart visualization
  - Usage statistics: total spent, total purchased, average per filing
  - Low balance warnings (amber for <100 credits, critical red for <50 credits)
  - Direct "Buy Credits" integration for seamless top-ups
  - Empty state handling for new users

**Analytics Accuracy (Phase 1):**
- All metrics use consistent "attempted filings" population (submitted/approved/failed) - excludes drafts/pending
- Success rate accurately represents actual filing outcomes vs drafts
- Money saved calculation only counts completed filings (not failed attempts)
- Work-in-progress displayed separately in amber notification card
- Comprehensive audit logging for all filing submissions with defensive error handling

**In Development:**
- Guided filing workflows with enhanced validation hints and field-level help (planned)
- Production error tracking and monitoring (planned)
- User onboarding tutorials and interactive guides (planned)
- Advanced pricing tiers for enterprises and accountant firms (planned)

## External Dependencies
- **OpenAI**: AI-driven document processing and financial data extraction.
- **PostgreSQL**: Primary database for application data and session storage.
- **Drizzle ORM**: Database interaction.
- **Stripe**: Payment processing and credit-based billing.
- **Companies House XML Gateway**: Direct electronic filing (Annual Accounts, Confirmation Statements).
- **HMRC Corporation Tax API**: CT600 tax return submission.
- **Passport.js**: Email/password authentication with secure session management.
- **SendGrid**: Email notifications.
- **WebSockets**: Real-time updates and notifications.
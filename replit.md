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

UX enhancements include a UK Accounting Expert AI Chatbot, deadline warnings with urgency indicators, credit usage visualization, and AI-powered smart filing recommendations. Guided filing workflows for Annual Accounts, Confirmation Statements, and CT600 include contextual help and progress tracking. Analytics accuracy has been improved with consistent metrics and comprehensive audit logging. Advanced pricing tiers (Basic, Professional, Enterprise) offer varying credit multipliers and company management limits, with volume discounts and tier-specific credit packages. Mobile optimization includes responsive dashboards, mobile-optimized wizards, and planned PWA support.

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
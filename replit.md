# PromptSubmissions - AI-Powered UK Corporate Compliance Platform

## Overview
PromptSubmissions is an AI-powered platform designed for UK corporate compliance, automating the submission of Confirmation Statements, Annual Accounts, and Corporation Tax returns. It leverages AI for tax preparation, employs agentic workflows for company onboarding and deadline management, and provides administrative monitoring dashboards. The platform operates on a credit-based billing system and aims to address the upcoming mandatory software filing requirement by Companies House by April 2027, targeting the significant UK corporate compliance market.

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
The platform features a React frontend (TypeScript), a Node.js/Express backend, and a PostgreSQL database with Drizzle ORM. The UI/UX emphasizes a Silicon Valley-level design with glass morphism and gradient backgrounds. Core functionalities include AI-driven document processing, comprehensive financial reporting (P&L, Balance Sheet, Cash Flow), and an Extended Trial Balance system. Filing automation integrates with HMRC and Companies House via XML Gateway for iXBRL and CT600 submissions.

A sophisticated multi-agent system automates customer acquisition, including a Companies House Discovery Agent for lead generation, an Email Enrichment Service via Hunter.io, and a three-tier Outreach Campaign System. Admin dashboards offer real-time lead pipelines, agent control, conversion analytics, and user management with role-based access control. Authentication is handled via email/password with Passport.js, scrypt hashing, and PostgreSQL-backed session storage.

The platform includes a critical iXBRL Generation Service supporting Companies House's mandatory filing requirements, incorporating the FRC 2025 Taxonomy and automatic entity size detection. An enhanced iXBRL Validation Service ensures comprehensive validation. A professional accountant review dashboard (`/filings/review`) provides summary metrics, validation results, and an approval workflow.

Recent enhancements include multi-company management with tier-based limits, secure backend AI chatbot integration, and smart recommendation security for tenant isolation. The agent system has been improved with broader industry targeting and Exa AI integration for comprehensive company data enrichment. UX improvements include a UK Accounting Expert AI Chatbot, deadline warnings, credit usage visualization, and AI-powered smart filing recommendations. Guided filing workflows for Annual Accounts, Confirmation Statements, and CT600 offer contextual help. Advanced pricing tiers (Basic, Professional, Enterprise) and mobile optimization with PWA support are also implemented.

Legal disclaimers are integrated at three levels: an AI Assistant Disclaimer, Filing Submission Warnings requiring explicit acknowledgment, and site-wide Footer Disclaimers, all emphasizing user responsibility and disclaiming professional advice. Critical production hardening involved removing hardcoded user/company IDs and enforcing authentication middleware and role-based authorization across all sensitive endpoints. Features like automatic form pre-fill from Annual Accounts to CT600 and an invitation-based Auditor Access System with a read-only `auditor` role have been implemented.

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
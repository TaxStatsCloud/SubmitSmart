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
The platform is built with a React frontend (TypeScript), a Node.js/Express backend, and a PostgreSQL database utilizing Drizzle ORM. The UI/UX emphasizes a Silicon Valley-level design with glass morphism, gradient backgrounds, and intuitive quick actions. Key technical features include AI-driven document processing, comprehensive financial reporting (P&L, Balance Sheet, Cash Flow), and an Extended Trial Balance system. Filing automation integrates with HMRC and Companies House via XML Gateway for iXBRL and CT600 submissions. The system incorporates an automated Companies House API discovery agent for lead generation, tracking companies with upcoming filing deadlines, and an automated customer onboarding and lead conversion system with outreach campaigns, real-time company verification, and conversion tracking. Authentication is managed via email/password with Passport.js (passport-local strategy), using secure password hashing (scrypt) and PostgreSQL-backed session storage (connect-pg-simple) with 7-day session TTL.

A critical component is the iXBRL Generation Service, designed for Companies House's April 2027 mandatory filing requirements. It incorporates the FRC 2025 Taxonomy, automatic entity size detection, mandatory P&L for micro-entities, and robust Directors' Report and audit exemption statement generation with full tagging. An enhanced iXBRL Validation Service, using DOM/XPath, ensures comprehensive validation, including placeholder detection, fact value validation, and cross-reference verification, reporting detailed errors and warnings. A professional accountant review dashboard (`/filings/review`) provides summary metrics, color-coded filing cards, detailed validation results, and an approval workflow with dual-layer client-side and server-side validation to prevent approval bypass.

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
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
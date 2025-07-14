# PromptSubmissions - AI-Powered UK Corporate Compliance Platform

## Project Overview
PromptSubmissions is an AI-powered platform for UK corporate compliance, specializing in automated Confirmation Statements, Annual Accounts, and Corporation Tax return processing. The platform now includes comprehensive tax preparation capabilities similar to Xero Tax, agentic workflows for identifying and onboarding companies with filing deadlines, admin monitoring dashboards, and a credit-based billing system with Stripe integration.

## Key Technologies
- React frontend with TypeScript
- Node.js backend with Express
- AI-driven document processing (OpenAI integration)
- PostgreSQL database with Drizzle ORM
- Stripe payment processing
- Real-time WebSocket notifications
- Agent-based outreach system

## Recent Changes
- **July 14, 2025**: PRICING UPDATE - Aligned with UK market: Corporation Tax £70, Dormant Accounts £100, Confirmation Statements £70, based on competitive analysis of accountant fees (£325-£480 for Corp Tax, £49-£300 for dormant accounts)
- **July 14, 2025**: Updated credit packages to market-competitive levels: Starter Pack £199.99 (200 credits), Professional Pack £399.99 (400 credits), Business Pack £799.99 (800 credits), Enterprise Pack £1,499.99 (1,500 credits)
- **July 14, 2025**: Enhanced filing cost structure: Micro-entity accounts £140, Small company accounts £220, Annual accounts £250, VAT filing £45, Full statutory accounts £350
- **July 14, 2025**: Fixed logout button functionality using proper Firebase signOut method with improved error handling and user feedback
- **July 14, 2025**: MAJOR UI UPGRADE - Implemented Silicon Valley-level design system with glass morphism, gradient backgrounds, and premium visual elements
- **July 14, 2025**: Enhanced AI chatbot with comprehensive UK accounting and tax expertise, covering CT600, VAT, Companies House regulations, and platform features
- **July 14, 2025**: Created enhanced dashboard with real-time status indicators, glass cards, and intuitive quick actions for professional users
- **July 14, 2025**: Implemented comprehensive Firebase authentication system with Google sign-in, user session management, and secure authentication context
- **July 14, 2025**: Integrated SendGrid email service with professional welcome emails, filing confirmations, and payment notifications
- **July 14, 2025**: Built competitive Stripe subscription system with enhanced UI and credit-based billing system
- **July 14, 2025**: Enhanced authentication flow with protected routes, login/logout functionality, and user state management
- **July 14, 2025**: Fixed critical cash balance calculation error in Balance Sheet - now properly nets all account 1200 entries to show correct £0 balance matching Trial Balance
- **July 14, 2025**: Added comprehensive PDF, Excel, and CSV export functionality for all financial statements with proper error handling and professional formatting
- **July 14, 2025**: Enhanced journal entry system with comprehensive audit trail capabilities, supporting document uploads, and detailed explanations for maximum accuracy and auditor trust
- **July 14, 2025**: Improved journal entry interface with responsive design, proper scrolling, and enhanced description fields for thorough documentation
- **July 13, 2025**: Built comprehensive Financial Reporting module with detailed P&L, Balance Sheet, Cash Flow, Statement of Changes in Equity, and Statement of Comprehensive Income
- **July 13, 2025**: Implemented AI-powered note generation system for customizable financial statement notes with UK GAAP compliance
- **July 13, 2025**: Created proper accounting workflow: Documents → Extended Trial Balance → Financial Statements
- **July 13, 2025**: Added customizable financial notes with AI generation options, templates, and company-specific details
- **July 13, 2025**: Enhanced Extended Trial Balance system with journal entries and automatic calculation of final balances
- **July 13, 2025**: Implemented comprehensive AI Document Processing System with bulk upload capabilities, duplicate detection, and automatic P&L population
- **July 13, 2025**: Built advanced document management with visual separation between sales/revenue and purchase/expense documents
- **July 13, 2025**: Created intelligent duplicate file detection system that identifies files by name/size and provides user dialog for managing conflicts
- **July 13, 2025**: Enhanced bulk upload system supporting multiple file types (.pdf, .jpg, .jpeg, .png) with proper error handling and progress tracking
- **July 13, 2025**: Implemented AI-powered financial data extraction using OpenAI GPT-4o vision model to automatically populate corporation tax returns
- **July 13, 2025**: Added real-time P&L calculations with automatic categorization of sales invoices, purchase invoices, and expense receipts
- **July 13, 2025**: Created comprehensive API endpoints for document processing, aggregation, and financial data retrieval

## Major Market Opportunity - Companies House Digital Transformation
**Critical Update (June 26, 2025)**: Companies House announced mandatory software filing for all company accounts from April 1, 2027. This creates a massive market opportunity for PromptSubmissions:

### Key Changes:
- **Mandatory Software Filing**: All companies must use commercial software (no web/paper filing)
- **Timeline**: 21 months to transition (1 accounting year + 9 months)
- **New Requirements**: Profit and loss accounts required for small/micro entities
- **Market Impact**: Every UK company will need software solution by April 2027

### Strategic Implications:
1. **Captive Market**: 4.8+ million UK companies must find software solutions
2. **Competitive Advantage**: Our existing AI-powered platform positions us perfectly
3. **Revenue Opportunity**: Subscription model for mandatory compliance software
4. **Agent System Value**: Can target companies proactively before deadline
5. **Tax Engine Integration**: Full-service solution from accounts to tax filing

## Project Architecture
### Frontend (React/TypeScript)
- Component-based architecture with shadcn/ui
- Real-time updates via WebSocket
- Responsive design for mobile/desktop
- Authentication context with role-based access

### Backend (Node.js/Express)
- RESTful API architecture
- PostgreSQL database with Drizzle ORM
- OpenAI integration for document processing
- Stripe payment processing
- Agent orchestration system

### Key Features
1. **Document Processing**: AI-powered analysis of financial documents
2. **Filing Automation**: Automated preparation of statutory filings
3. **Tax Preparation**: Comprehensive tax calculation and filing engine
4. **Agent System**: Automated outreach to companies with filing deadlines
5. **Admin Dashboard**: Real-time monitoring of agent activities and conversions
6. **Credit System**: Flexible billing with Stripe integration

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

## Strategic Staged Rollout Plan

### Stage 1: Simple Filings (Immediate Launch)
**Target**: Dormant companies and micro-entities (up to £632k turnover)
**Complexity**: Low - balance sheet only or simplified accounts
**Market Size**: ~2 million companies
**Credit Costs**: 5-10 credits per filing
**Key Benefits**: Easy onboarding, quick wins, foundation for growth

### Stage 2: Moderate Complexity (6-12 months)
**Target**: Small companies (up to £10.2m turnover) with new P&L requirements
**Complexity**: Medium - full accounts with profit & loss preparation
**Market Size**: ~2.5 million companies
**Credit Costs**: 25-35 credits per filing
**Key Benefits**: Higher value services, captures 2027 P&L mandate

### Stage 3: Complex Filings (12+ months)
**Target**: Medium/large companies requiring audited accounts
**Complexity**: High - multi-team collaboration (auditors, finance, tax)
**Market Size**: ~300k companies
**Credit Costs**: 50-100 credits per filing
**Key Benefits**: Premium pricing, accounting firm partnerships

## Billing Strategy
**Credit System Advantages**:
- ✅ Flexible pricing for different account types
- ✅ Pay-as-you-go suits seasonal filing patterns
- ✅ Scales from simple to complex filings
- ✅ No long-term commitments (reduces barrier to entry)

**Market-Competitive Pricing Structure** (Updated July 2025):
- **Starter Pack**: £199.99 for 200 credits (2 dormant accounts + corporation tax)
- **Professional Pack**: £399.99 for 400 credits (mixed filings for growing businesses) - MOST POPULAR
- **Business Pack**: £799.99 for 800 credits (multiple companies with complex filings)
- **Enterprise Pack**: £1,499.99 for 1,500 credits (high-volume accounting firms)

**Individual Filing Costs**:
- **Dormant Company Accounts**: £100 per filing
- **Corporation Tax (CT600)**: £70 per filing
- **Confirmation Statement**: £70 per filing
- **Micro-entity Accounts**: £140 per filing
- **Small Company Accounts**: £220 per filing
- **Annual Accounts**: £250 per filing
- **VAT Filing**: £45 per filing

## Next Steps
1. Launch Stage 1 filings immediately to capture early market
2. Enhance agent system to target companies affected by 2027 changes
3. Develop Stage 2 capabilities for small company P&L requirements
4. Build collaboration features for Stage 3 multi-team workflows
5. Consider accounting firm partnerships for complex filings

## Market Position
PromptSubmissions is uniquely positioned to capitalize on the mandatory digital transformation of UK corporate filing through a staged rollout approach that builds from simple to complex filings, ensuring sustainable growth while maintaining quality and user experience across all complexity levels.
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
- Focus on professional, clean UI design
- Prioritize user experience and workflow efficiency
- Maintain comprehensive documentation
- Implement proper error handling and loading states

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

**Tiered Pricing Structure**:
- **Dormant Pack**: £19.99 for 25 credits (5 filings)
- **Micro Business Pack**: £39.99 for 50 credits (5 filings)
- **Small Business Pack**: £89.99 for 100 credits (4 filings)
- **Professional Pack**: £179.99 for 200 credits (mixed filings)
- **Enterprise Pack**: £499.99 for 500 credits (future)

## Next Steps
1. Launch Stage 1 filings immediately to capture early market
2. Enhance agent system to target companies affected by 2027 changes
3. Develop Stage 2 capabilities for small company P&L requirements
4. Build collaboration features for Stage 3 multi-team workflows
5. Consider accounting firm partnerships for complex filings

## Market Position
PromptSubmissions is uniquely positioned to capitalize on the mandatory digital transformation of UK corporate filing through a staged rollout approach that builds from simple to complex filings, ensuring sustainable growth while maintaining quality and user experience across all complexity levels.
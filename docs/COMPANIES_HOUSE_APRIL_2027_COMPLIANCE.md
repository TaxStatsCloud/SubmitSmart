# Companies House April 2027 Compliance Guide

## What's Changing?

From **April 2027**, all UK companies must file their annual accounts **electronically using approved software**. The free WebFiling service will no longer be available for accounts submissions. This affects **4.8 million UK companies**.

### Why This Matters

- **Mandatory for ALL companies**: Micro, small, medium, and large companies must use software
- **No more free WebFiling**: Companies must use approved filing software like PromptSubmissions
- **New requirements**: Enhanced disclosure requirements and full digital tagging

---

## Key Changes for Your Company

### 1. Micro-Entities (Turnover ≤ £1m, Assets ≤ £500k, Employees ≤ 10)

**What's New:**
- ✅ **Profit & Loss now MANDATORY** - No more P&L privacy
- ✅ **Average employees disclosure** - Must report number of employees
- ✅ **Full digital tagging** - All figures must be tagged with iXBRL

**What You Need:**
- Balance Sheet data
- **Profit & Loss statement** (new requirement)
- Average number of employees during the year
- Accounting policies (FRS105 recommended for micro-entities)

---

### 2. Small Companies (Turnover ≤ £15m, Assets ≤ £7.5m, Employees ≤ 50)

**What's New:**
- ✅ **Directors' Report now MANDATORY**
- ✅ **Full disclosure** - No more abridged accounts option
- ✅ **Enhanced tagging** - All disclosures must be digitally tagged

**What You Need:**
- Complete Balance Sheet
- Profit & Loss statement
- **Directors' Report** including:
  - Principal activities description
  - List of directors who served during the year
  - Financial results summary
  - Approval date and signatory director
- Average number of employees
- Accounting policies (FRS102/FRS105)
- Audit exemption statement (if applicable)

---

### 3. Medium Companies (Turnover ≤ £54m, Assets ≤ £27m, Employees ≤ 250)

**What's New:**
- ✅ **Full disclosure requirements**
- ✅ **Comprehensive tagging**
- ✅ **Directors' Report mandatory**

**What You Need:**
- Complete financial statements
- Directors' Report (same as small companies)
- Cash Flow Statement (recommended)
- Full notes to accounts
- Average number of employees
- Accounting policies (FRS102 or UKIFRS)

---

### 4. Large Companies (Exceed medium thresholds)

**What's New:**
- ✅ **Full statutory accounts**
- ✅ **Comprehensive disclosures**
- ✅ **Enhanced digital tagging**

**What You Need:**
- Full statutory accounts
- Directors' Report
- Strategic Report (if applicable)
- Cash Flow Statement
- Comprehensive notes
- Audit report (typically required)

---

## How PromptSubmissions Helps You Comply

### 🤖 Platform Features

Our platform provides:

1. **Company Size Detection**
   - Analyzes turnover, assets, and employees
   - Applies April 2025 thresholds
   - Determines micro/small/medium/large classification

2. **iXBRL Generation**
   - Uses official FRC 2025 taxonomy
   - Applies digital tags per company size
   - Generates required report templates

3. **Pre-Submission Validation**
   - Basic compliance checking (regex-based)
   - Required field verification
   - Context and unit reference checking
   - QName format validation
   - **Note**: Manual review recommended before final submission

### Current Capabilities vs. Roadmap

| Feature | Status | Details |
|---------|--------|---------|
| FRC 2025 Taxonomy | ✅ Complete | Official namespaces and schema |
| Entity Size Detection | ✅ Complete | Automatic classification |
| iXBRL Tagging Structure | ✅ Complete | Full tagging templates |
| Required Field Validation | ✅ Complete | Input verification |
| Basic Validation | ✅ Complete | Regex-based pre-checks |
| DOM/XPath Validation | 📋 Planned | Production-grade validation |
| Placeholder Detection | 📋 Planned | Comprehensive content checking |
| Direct Filing API | ✅ Complete | Companies House XML Gateway |

### 📋 Required Information Checklist

Before filing, you'll need to provide:

**For ALL Companies:**
- ✅ Company name and number
- ✅ Accounting period dates
- ✅ Balance Sheet figures
- ✅ Profit & Loss figures (including micro-entities)
- ✅ **Average number of employees** (mandatory since Oct 2020)
- ✅ Accounting framework (FRS102, FRS105, FRS101, or UKIFRS)

**Additional for Small/Medium/Large:**
- ✅ List of directors who served during the year
- ✅ Principal activities description
- ✅ Approval date for accounts
- ✅ Signatory director name
- ✅ Audit exemption details (if applicable)

**Additional for Medium/Large:**
- ✅ Cash Flow Statement
- ✅ Comprehensive notes to accounts
- ✅ Additional disclosures per size

---

## Understanding Entity Size Classification

Your company size is determined by meeting **2 out of 3** criteria:

### Thresholds (effective April 6, 2025)

| Size | Turnover | Balance Sheet Total | Employees |
|------|----------|---------------------|-----------|
| **Micro** | ≤ £1m | ≤ £500k | ≤ 10 |
| **Small** | ≤ £15m | ≤ £7.5m | ≤ 50 |
| **Medium** | ≤ £54m | ≤ £27m | ≤ 250 |
| **Large** | > Medium thresholds | > Medium thresholds | > Medium thresholds |

**Example:** A company with £800k turnover, £450k assets, and 12 employees is **Small** (meets 2 of 3 criteria for Micro, but fails employees threshold, so moves to next tier).

---

## Mandatory Disclosures

### For Micro-Entities

**Balance Sheet:**
- Fixed assets
- Current assets
- Current liabilities (if any)
- Net assets
- Called up share capital
- Profit and loss account reserve

**Profit & Loss (NEW - mandatory from April 2027):**
- Turnover
- Cost of sales / Operating expenses
- Profit or loss before tax
- Tax on profit or loss
- Profit or loss for financial year

**Notes:**
- Accounting policies
- Average number of employees

---

### For Small Companies

**Additional Requirements:**
- **Directors' Report** with:
  - Principal activities during the year
  - Names of all directors
  - Financial results summary
  - Approval statement with date and signatory

- **Audit Exemption Statement** (if claiming exemption):
  - Company entitled to exemption under s.477 Companies Act 2006
  - Directors acknowledge responsibilities
  - Members have not required audit under s.476

---

### For Medium/Large Companies

**Full Disclosure Including:**
- Strategic Report (large companies)
- Directors' Report
- Comprehensive notes covering:
  - Accounting policies
  - Tangible/intangible fixed assets
  - Debtors and creditors
  - Share capital and reserves
  - Related party transactions
  - Post balance sheet events
  - Any other material disclosures

---

## Accounting Frameworks

Choose the appropriate framework for your company:

### **FRS 105** - The Financial Reporting Standard applicable to the Micro-entities Regime
- **For:** Micro-entities only
- **Simplest option** with minimal disclosure requirements
- Reduced measurement requirements

### **FRS 102** - The Financial Reporting Standard applicable in the UK and Republic of Ireland
- **For:** Small, medium, and large companies
- Most commonly used standard
- Section 1A available for small entities (simplified)

### **FRS 101** - Reduced Disclosure Framework
- **For:** Qualifying entities (typically subsidiaries of groups using IFRS)
- Based on EU-adopted IFRS with reduced disclosures

### **UK-IFRS** - International Financial Reporting Standards
- **For:** Large companies and groups
- Full IFRS compliance
- Most comprehensive disclosure requirements

---

## Audit Exemption

### Who Can Claim Exemption?

**Small companies** can claim audit exemption if they meet **ALL** criteria:
- Turnover ≤ £10.2m
- Balance sheet total ≤ £5.1m
- Average employees ≤ 50

### Required Statements

If claiming exemption, your accounts must include:

1. **Statement of Compliance:**
   - "For the year ending [date], the company was entitled to exemption from audit under section 477 of the Companies Act 2006 relating to small companies."

2. **Directors' Responsibilities:**
   - Keeping proper accounting records
   - Preparing accounts that give a true and fair view

3. **Members' Agreement:**
   - "The members have not required the company to obtain an audit in accordance with section 476 of the Companies Act 2006."

---

## Filing Timeline

### Important Deadlines

1. **Financial Year End** → Your company's accounting period end date

2. **Accounts Preparation** → Within 9 months (private companies) or 6 months (public companies)

3. **Companies House Filing** → Same deadline as preparation

4. **HMRC Corporation Tax** → 12 months after year end for CT600, 9 months for payment

### PromptSubmissions Workflow

1. **Upload Documents** → Provide your financial data
2. **AI Processing** → System extracts figures and prepares accounts
3. **Review & Approve** → Check generated accounts
4. **Automatic Filing** → System submits to Companies House in iXBRL format
5. **Confirmation** → Receive filing receipt and confirmation

---

## Common Questions

### Q: What is iXBRL?
**A:** Inline XBRL is a format that combines human-readable accounts with machine-readable tags. It allows Companies House to automatically process and analyze your accounts while you view them normally.

### Q: Do I still need an accountant?
**A:** PromptSubmissions automates the filing process, but we recommend professional review for complex situations. Our AI assists with data extraction and formatting, but final responsibility rests with directors.

### Q: What if my company is dormant?
**A:** Dormant companies still need to file accounts, but with simplified requirements. The platform handles dormant company filings with appropriate iXBRL tagging.

### Q: Can I file late?
**A:** Late filing incurs automatic penalties from Companies House. File on time to avoid:
- £150 penalty (1 day to 1 month late)
- £375 penalty (1 to 3 months late)
- £750 penalty (3 to 6 months late)
- £1,500 penalty (over 6 months late)

### Q: What happens if I don't file electronically?
**A:** From April 2027, paper and WebFiling submissions will not be accepted. You must use approved software like PromptSubmissions.

---

## Getting Help

### Support Resources

- **Platform Help**: In-app chatbot for filing questions
- **Technical Support**: help@promptsubmissions.com
- **Compliance Queries**: compliance@promptsubmissions.com
- **Companies House**: Direct queries to Companies House
- **HMRC**: Corporation tax questions to HMRC

### Professional Advice

For complex situations, consider consulting:
- Chartered Accountant (CA)
- Certified Public Accountant (CPA)
- Tax advisor
- Company solicitor

---

## Summary: Your Action Plan

### ✅ **Before April 2027**

1. **Register** with PromptSubmissions
2. **Gather** all required financial information
3. **Understand** your company size classification
4. **Prepare** Directors' Report (if small/medium/large)
5. **Test** the filing process with previous year's accounts

### ✅ **For Each Filing**

1. **Upload** your financial data
2. **Review** AI-generated accounts
3. **Confirm** all required information included
4. **Validate** compliance checking passes
5. **Submit** to Companies House
6. **Archive** filing confirmation

### ✅ **Stay Compliant**

- Keep accurate financial records
- File by deadline (9 months for private companies)
- Ensure all mandatory disclosures included
- Maintain director and employee records
- Update accounting policies as needed

---

## Technical Specifications

### FRC 2025 Taxonomy

Our platform uses the official Financial Reporting Council 2025 taxonomy:

- **Namespace**: https://xbrl.frc.org.uk/
- **Schema**: FRS 2025-01-01
- **Core elements**: uk-core, uk-gaap, uk-bus
- **Schema reference**: Included in ix:header

### Mandatory Tags

All filings include properly tagged:
- Company identification (name, number)
- Period covered (start/end dates)
- Balance sheet items (assets, liabilities, equity)
- Profit & loss items (turnover, expenses, profit)
- Directors and employees information
- Accounting policies and framework
- Audit exemption (if applicable)

---

**Last Updated:** October 2025  
**Platform Version:** 2.0  
**April 2027 Preparation:** In Progress - Core features complete, validation enhancements planned

---

## Important Notice

**Director Responsibility:** Directors remain legally responsible for the accuracy and completeness of filed accounts, regardless of software used. PromptSubmissions provides tools to assist with technical compliance, but cannot guarantee acceptance by Companies House or accuracy of financial data.

**Professional Review Recommended:** While our platform automates iXBRL generation and provides basic validation, we recommend professional review by a qualified accountant before filing, especially for:
- First-time filings using the platform
- Complex financial situations
- Group accounts
- Companies approaching size thresholds

**Validation Status:** Current validation uses regex-based pre-checks. Enhanced DOM/XPath validation is planned to provide production-grade compliance checking.

---

*This guide is for informational purposes. Consult qualified professionals for specific advice on your company's compliance requirements.*

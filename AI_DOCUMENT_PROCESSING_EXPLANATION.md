# AI Document Processing System - How It Works

## Overview
The AI document processing system automatically extracts financial data from uploaded documents and populates the Profit & Loss statement for corporation tax returns. Here's how your uploaded documents are being utilized:

## Document Processing Pipeline

### 1. Document Upload & Storage
- **Bank Statements**: Uploaded as `.pdf`, `.csv`, or `.xlsx` files
- **Sales Invoices**: Uploaded as `.pdf`, `.jpg`, `.jpeg`, or `.png` files (bulk upload supported)
- **Purchase Invoices**: Uploaded as `.pdf`, `.jpg`, `.jpeg`, or `.png` files (bulk upload supported)
- **Expense Receipts**: Uploaded as `.pdf`, `.jpg`, `.jpeg`, or `.png` files (bulk upload supported)

### 2. AI Analysis Process
When you upload financial documents, the system:

1. **Identifies Document Type**: Automatically categorizes based on the upload section
2. **Extracts Text/Data**: Uses OpenAI's GPT-4o vision model to read document content
3. **Extracts Financial Information**:
   - Transaction descriptions
   - Amounts (converted to GBP)
   - Dates
   - Categories (sales, purchases, expenses)
   - VAT amounts (if applicable)

### 3. Data Categorization
The AI automatically categorizes extracted data into UK corporation tax categories:

#### Sales Documents → Turnover
- **Sales Invoices**: Client invoices, service fees → Sales Turnover
- **Bank Statements**: Incoming payments → Sales Turnover or Other Income

#### Purchase Documents → Expenses
- **Purchase Invoices**: Supplier bills → Cost of Sales
- **Expense Receipts**: 
  - Travel, office supplies → Administrative Expenses
  - Legal, accounting fees → Professional Fees
  - Other business expenses → Other Expenses

### 4. Automatic P&L Population
The processed data automatically populates the Income Statement:

```
TURNOVER
├── Sales Turnover: £2,450.00 (from sales invoices)
├── Other Income: £150.00 (from bank statements)
└── Total Turnover: £2,600.00

EXPENSES
├── Cost of Sales: £800.00 (from purchase invoices)
├── Administrative Expenses: £450.00 (from expense receipts)
├── Professional Fees: £300.00 (from legal/accounting receipts)
├── Other Expenses: £200.00 (from miscellaneous receipts)
└── Total Expenses: £1,750.00

NET PROFIT: £850.00
```

## Current Implementation Status

### ✅ Working Features
- **Bulk Upload System**: Upload multiple files simultaneously
- **Duplicate Detection**: Automatically detects and handles duplicate files
- **Document Storage**: Secure storage with metadata tracking
- **AI Processing Framework**: Complete AI service integration
- **Data Aggregation**: Automatic financial data categorization
- **P&L Population**: Real-time calculation and display

### 🔄 Processing Flow
1. **Upload Documents** → Documents tab bulk upload
2. **AI Analysis** → Automatic background processing
3. **Data Extraction** → Financial data extracted and categorized
4. **P&L Update** → Income Statement auto-populated with extracted data
5. **Review & Adjust** → User can review and modify AI-generated figures

### 📊 Document Usage Examples

**Sales Invoice Processing:**
- Extracts: Client name, invoice number, services, amounts, VAT
- Categorizes: Sales revenue, professional fees, other income
- Populates: Sales Turnover section

**Purchase Invoice Processing:**
- Extracts: Supplier, items/services, costs, VAT
- Categorizes: Cost of goods, business expenses, professional services
- Populates: Cost of Sales, Administrative Expenses

**Expense Receipt Processing:**
- Extracts: Vendor, expense type, amount, date
- Categorizes: Travel, office supplies, professional fees
- Populates: Administrative Expenses, Professional Fees

## User Experience
1. **Upload**: Use bulk upload buttons for different document types
2. **Processing**: AI automatically processes documents in the background
3. **Review**: Navigate to Income Statement tab to see auto-populated figures
4. **Adjust**: Modify any AI-generated figures as needed
5. **Continue**: Proceed with confidence to balance sheet and submission

## Technical Architecture
- **AI Model**: OpenAI GPT-4o with vision capabilities
- **Processing**: Asynchronous background processing
- **Storage**: Secure document storage with extracted data metadata
- **API**: RESTful endpoints for data aggregation and retrieval
- **Frontend**: Real-time updates and user-friendly interface

This system transforms manual data entry into an automated, intelligent process that saves time and reduces errors in corporation tax return preparation.
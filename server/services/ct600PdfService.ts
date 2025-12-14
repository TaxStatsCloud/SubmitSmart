/**
 * CT600 PDF Export Service
 *
 * Generates a PDF summary of CT600 submissions
 * for download and record-keeping
 */

import PDFDocument from 'pdfkit';

interface CT600PdfData {
  companyName: string;
  companyNumber: string;
  utr: string;
  accountingPeriodStart: string;
  accountingPeriodEnd: string;
  turnover: number;
  costOfSales: number;
  operatingExpenses: number;
  tradingProfit: number;
  interestReceived?: number;
  dividendsReceived?: number;
  propertyIncome?: number;
  depreciationAddBack?: number;
  capitalAllowances?: number;
  lossesBroughtForward?: number;
  charitableDonations?: number;
  profitsBeforeReliefs: number;
  totalProfitsChargeable: number;
  corporationTaxRate: number;
  corporationTaxDue: number;
  marginalRelief?: number;
  paymentDueDate?: string;
  filingDueDate?: string;
  submissionDate?: string;
  correlationId?: string;
}

class CT600PdfService {
  /**
   * Generate a PDF document for CT600 submission
   */
  async generateCT600Pdf(data: CT600PdfData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50 });
        const chunks: Buffer[] = [];

        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // Header
        doc.fontSize(20).font('Helvetica-Bold').text('CT600 Corporation Tax Return', { align: 'center' });
        doc.moveDown(0.5);
        doc.fontSize(10).font('Helvetica').fillColor('#666').text('Summary Document - Not for HMRC submission', { align: 'center' });
        doc.moveDown(2);

        // Company Information Section
        this.addSectionHeader(doc, 'Company Information');
        this.addRow(doc, 'Company Name', data.companyName);
        this.addRow(doc, 'Company Number', data.companyNumber);
        this.addRow(doc, 'UTR', data.utr);
        this.addRow(doc, 'Accounting Period', `${this.formatDate(data.accountingPeriodStart)} to ${this.formatDate(data.accountingPeriodEnd)}`);
        doc.moveDown();

        // Trading Income Section
        this.addSectionHeader(doc, 'Trading Income');
        this.addRow(doc, 'Turnover (Box 40)', this.formatCurrency(data.turnover));
        this.addRow(doc, 'Cost of Sales (Box 41)', this.formatCurrency(data.costOfSales));
        this.addRow(doc, 'Operating Expenses (Box 43)', this.formatCurrency(data.operatingExpenses));
        this.addRow(doc, 'Trading Profit (Box 44)', this.formatCurrency(data.tradingProfit), true);
        doc.moveDown();

        // Other Income Section
        if (data.interestReceived || data.dividendsReceived || data.propertyIncome) {
          this.addSectionHeader(doc, 'Other Income');
          if (data.interestReceived) this.addRow(doc, 'Interest Received (Box 50)', this.formatCurrency(data.interestReceived));
          if (data.dividendsReceived) this.addRow(doc, 'Dividends Received (Box 51)', this.formatCurrency(data.dividendsReceived));
          if (data.propertyIncome) this.addRow(doc, 'Property Income (Box 52)', this.formatCurrency(data.propertyIncome));
          doc.moveDown();
        }

        // Adjustments Section
        if (data.depreciationAddBack || data.capitalAllowances) {
          this.addSectionHeader(doc, 'Adjustments');
          if (data.depreciationAddBack) this.addRow(doc, 'Depreciation Add-back (Box 70)', this.formatCurrency(data.depreciationAddBack));
          if (data.capitalAllowances) this.addRow(doc, 'Capital Allowances (Box 71)', this.formatCurrency(data.capitalAllowances));
          doc.moveDown();
        }

        // Reliefs Section
        if (data.lossesBroughtForward || data.charitableDonations) {
          this.addSectionHeader(doc, 'Reliefs & Deductions');
          if (data.lossesBroughtForward) this.addRow(doc, 'Losses Brought Forward (Box 100)', this.formatCurrency(data.lossesBroughtForward));
          if (data.charitableDonations) this.addRow(doc, 'Charitable Donations (Box 102)', this.formatCurrency(data.charitableDonations));
          doc.moveDown();
        }

        // Tax Computation Section
        this.addSectionHeader(doc, 'Corporation Tax Computation');
        this.addRow(doc, 'Profits Before Reliefs (Box 120)', this.formatCurrency(data.profitsBeforeReliefs));
        this.addRow(doc, 'Total Profits Chargeable (Box 125)', this.formatCurrency(data.totalProfitsChargeable));
        this.addRow(doc, 'Corporation Tax Rate', `${data.corporationTaxRate.toFixed(2)}%`);
        if (data.marginalRelief) {
          this.addRow(doc, 'Marginal Relief (Box 150)', this.formatCurrency(data.marginalRelief));
        }
        this.addRow(doc, 'Corporation Tax Due (Box 155)', this.formatCurrency(data.corporationTaxDue), true);
        doc.moveDown();

        // Important Dates Section
        this.addSectionHeader(doc, 'Important Dates');
        if (data.paymentDueDate) this.addRow(doc, 'Payment Due Date', this.formatDate(data.paymentDueDate));
        if (data.filingDueDate) this.addRow(doc, 'Filing Due Date', this.formatDate(data.filingDueDate));
        if (data.submissionDate) this.addRow(doc, 'Submission Date', this.formatDate(data.submissionDate));
        if (data.correlationId) this.addRow(doc, 'HMRC Reference', data.correlationId);
        doc.moveDown(2);

        // Footer
        doc.fontSize(8).fillColor('#999').text(
          `Generated by SubmitSmart on ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}`,
          { align: 'center' }
        );
        doc.text('This document is for your records only. The official submission has been made electronically to HMRC.', { align: 'center' });

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  private addSectionHeader(doc: PDFKit.PDFDocument, title: string) {
    doc.fontSize(12).font('Helvetica-Bold').fillColor('#333').text(title);
    doc.moveDown(0.3);
    doc.strokeColor('#ddd').lineWidth(1)
      .moveTo(50, doc.y)
      .lineTo(550, doc.y)
      .stroke();
    doc.moveDown(0.5);
  }

  private addRow(doc: PDFKit.PDFDocument, label: string, value: string, highlight = false) {
    const y = doc.y;
    doc.fontSize(10).font('Helvetica').fillColor('#666').text(label, 50, y);
    doc.fontSize(10)
      .font(highlight ? 'Helvetica-Bold' : 'Helvetica')
      .fillColor(highlight ? '#000' : '#333')
      .text(value, 350, y, { align: 'right', width: 200 });
    doc.moveDown(0.5);
  }

  private formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(amount);
  }

  private formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  }
}

export const ct600PdfService = new CT600PdfService();

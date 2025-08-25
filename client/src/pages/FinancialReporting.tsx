import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  FileText, 
  TrendingUp, 
  Calculator, 
  DollarSign, 
  BarChart3, 
  PieChart, 
  FileSpreadsheet,
  Edit,
  Wand2,
  Save,
  Eye,
  Download,
  Plus,
  Trash2,
  FileDown,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';

interface FinancialLineItem {
  id: string;
  description: string;
  amount: number;
  note?: string;
  customizable: boolean;
}

interface FinancialNote {
  id: string;
  title: string;
  content: string;
  type: 'standard' | 'custom' | 'ai_generated';
  template?: string;
  accountingPolicy?: string;
}

export default function FinancialReporting() {
  const [activeReport, setActiveReport] = useState('profit-loss');
  const [showNoteDialog, setShowNoteDialog] = useState(false);
  const [editingNote, setEditingNote] = useState<FinancialNote | null>(null);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [exportingPDF, setExportingPDF] = useState(false);
  const { toast } = useToast();

  // Financial data state
  const [profitLossData, setProfitLossData] = useState<FinancialLineItem[]>([
    { id: 'turnover', description: 'Turnover', amount: 0, customizable: true },
    { id: 'cost_of_sales', description: 'Cost of Sales', amount: 0, customizable: true },
    { id: 'gross_profit', description: 'Gross Profit', amount: 0, customizable: false },
    { id: 'admin_expenses', description: 'Administrative Expenses', amount: 0, customizable: true },
    { id: 'distribution_costs', description: 'Distribution Costs', amount: 0, customizable: true },
    { id: 'other_operating_income', description: 'Other Operating Income', amount: 0, customizable: true },
    { id: 'operating_profit', description: 'Operating Profit', amount: 0, customizable: false },
    { id: 'investment_income', description: 'Investment Income', amount: 0, customizable: true },
    { id: 'interest_payable', description: 'Interest Payable', amount: 0, customizable: true },
    { id: 'profit_before_tax', description: 'Profit Before Tax', amount: 0, customizable: false },
    { id: 'tax_charge', description: 'Tax on Profit', amount: 0, customizable: true },
    { id: 'profit_after_tax', description: 'Profit for the Financial Year', amount: 0, customizable: false }
  ]);

  const [balanceSheetData, setBalanceSheetData] = useState({
    fixedAssets: [
      { id: 'tangible_assets', description: 'Tangible Assets', amount: 0, customizable: true },
      { id: 'intangible_assets', description: 'Intangible Assets', amount: 0, customizable: true },
      { id: 'investments', description: 'Investments', amount: 0, customizable: true }
    ],
    currentAssets: [
      { id: 'stock', description: 'Stock', amount: 0, customizable: true },
      { id: 'debtors', description: 'Debtors', amount: 0, customizable: true },
      { id: 'cash_bank', description: 'Cash at Bank and in Hand', amount: 0, customizable: true }
    ],
    currentLiabilities: [
      { id: 'creditors_due_within_one_year', description: 'Creditors: amounts falling due within one year', amount: 0, customizable: true },
      { id: 'bank_overdraft', description: 'Bank Overdraft', amount: 0, customizable: true }
    ],
    longTermLiabilities: [
      { id: 'creditors_due_after_one_year', description: 'Creditors: amounts falling due after more than one year', amount: 0, customizable: true },
      { id: 'provisions', description: 'Provisions for Liabilities', amount: 0, customizable: true }
    ],
    equity: [
      { id: 'share_capital', description: 'Called up Share Capital', amount: 0, customizable: true },
      { id: 'share_premium', description: 'Share Premium Account', amount: 0, customizable: true },
      { id: 'retained_earnings', description: 'Profit and Loss Account', amount: 0, customizable: true }
    ]
  });

  const [cashFlowData, setCashFlowData] = useState<FinancialLineItem[]>([
    { id: 'operating_activities', description: 'Net Cash from Operating Activities', amount: 0, customizable: true },
    { id: 'investing_activities', description: 'Net Cash from Investing Activities', amount: 0, customizable: true },
    { id: 'financing_activities', description: 'Net Cash from Financing Activities', amount: 0, customizable: true },
    { id: 'net_increase_cash', description: 'Net Increase in Cash and Cash Equivalents', amount: 0, customizable: false }
  ]);

  const [financialNotes, setFinancialNotes] = useState<FinancialNote[]>([
    {
      id: 'accounting_policies',
      title: 'Accounting Policies',
      content: 'The financial statements have been prepared under the historical cost convention and in accordance with Financial Reporting Standard 102 (FRS 102).',
      type: 'standard',
      template: 'accounting_policies'
    },
    {
      id: 'turnover',
      title: 'Turnover',
      content: 'Turnover represents the amounts derived from the provision of goods and services which fall within the company\'s ordinary activities.',
      type: 'standard',
      template: 'turnover'
    },
    {
      id: 'employees',
      title: 'Employees',
      content: 'The average monthly number of employees during the year was as follows...',
      type: 'custom'
    }
  ]);

  const [newNote, setNewNote] = useState({
    title: '',
    content: '',
    type: 'custom' as const,
    template: '',
    companyDetails: ''
  });

  // Note templates
  const noteTemplates = {
    accounting_policies: 'Standard accounting policies template',
    turnover: 'Revenue recognition policy template',
    fixed_assets: 'Fixed assets depreciation policy template',
    stock: 'Stock valuation policy template',
    debtors: 'Debtors provision policy template',
    creditors: 'Creditors payment policy template',
    taxation: 'Corporation tax policy template',
    employees: 'Employee benefits policy template',
    directors_remuneration: 'Directors remuneration disclosure template',
    share_capital: 'Share capital structure template',
    post_balance_sheet_events: 'Post balance sheet events template'
  };

  // Load financial data from ETB
  useEffect(() => {
    const loadFinancialData = () => {
      const etbData = localStorage.getItem('etbData');
      
      // Debug: Log the ETB data to console
      console.log('ETB Data from localStorage:', etbData);
      
      if (etbData) {
        const parsedData = JSON.parse(etbData);
        console.log('Parsed ETB Data:', parsedData);
        
        // Update P&L from ETB final balances
        if (parsedData.finalBalances) {
          console.log('Final balances found:', parsedData.finalBalances);
          setProfitLossData(prev => prev.map(item => {
            switch (item.id) {
              case 'turnover':
                return { ...item, amount: parsedData.finalBalances.revenue || 0 };
              case 'cost_of_sales':
              case 'admin_expenses':
                return { ...item, amount: parsedData.finalBalances.expenses || 0 };
              case 'gross_profit':
                return { ...item, amount: (parsedData.finalBalances.revenue || 0) - (parsedData.finalBalances.expenses || 0) };
              case 'operating_profit':
              case 'profit_before_tax':
              case 'profit_after_tax':
                return { ...item, amount: (parsedData.finalBalances.revenue || 0) - (parsedData.finalBalances.expenses || 0) };
              default:
                return item;
            }
          }));

          // Update Balance Sheet from ETB final balances
          // Distribute assets based on account codes from trial balance
          const trialBalanceData = parsedData.trialBalance || [];
          console.log('Trial balance data for balance sheet:', trialBalanceData);
          
          const assetsTotalFromTB = trialBalanceData
            .filter((entry: any) => entry.accountCode.startsWith('1'))
            .reduce((sum: number, entry: any) => sum + (entry.debit - entry.credit), 0);
          const liabilitiesTotalFromTB = trialBalanceData
            .filter((entry: any) => entry.accountCode.startsWith('2'))
            .reduce((sum: number, entry: any) => sum + (entry.credit - entry.debit), 0);
          const equityTotalFromTB = trialBalanceData
            .filter((entry: any) => entry.accountCode.startsWith('3'))
            .reduce((sum: number, entry: any) => sum + (entry.credit - entry.debit), 0);
            
          console.log('Balance sheet totals calculated:', {
            assets: assetsTotalFromTB,
            liabilities: liabilitiesTotalFromTB,
            equity: equityTotalFromTB
          });

          setBalanceSheetData(prev => ({
            ...prev,
            currentAssets: prev.currentAssets.map(item => {
              if (item.id === 'debtors') {
                const debtorsBalance = trialBalanceData
                  .filter((entry: any) => entry.accountCode === '1100')
                  .reduce((sum: number, entry: any) => sum + (entry.debit - entry.credit), 0);
                return { ...item, amount: Math.max(0, debtorsBalance) };
              }
              if (item.id === 'cash_bank') {
                // Calculate net cash position from all 1200 entries
                const cashEntries = trialBalanceData.filter((entry: any) => entry.accountCode === '1200');
                const totalDebits = cashEntries.reduce((sum: number, entry: any) => sum + entry.debit, 0);
                const totalCredits = cashEntries.reduce((sum: number, entry: any) => sum + entry.credit, 0);
                const netCashBalance = totalDebits - totalCredits;
                
                console.log('Cash balance calculation:', {
                  cashEntries,
                  totalDebits,
                  totalCredits,
                  netCashBalance
                });
                
                // Only show positive cash balances on assets side
                return { ...item, amount: Math.max(0, netCashBalance) };
              }
              return item;
            }),
            currentLiabilities: prev.currentLiabilities.map(item => {
              if (item.id === 'vat_liability') {
                const vatBalance = trialBalanceData
                  .filter(entry => entry.accountCode === '2200')
                  .reduce((sum, entry) => sum + (entry.credit - entry.debit), 0);
                return { ...item, amount: Math.max(0, vatBalance) };
              }
              if (item.id === 'trade_creditors') {
                const creditorsBalance = trialBalanceData
                  .filter(entry => entry.accountCode === '2100')
                  .reduce((sum, entry) => sum + (entry.credit - entry.debit), 0);
                return { ...item, amount: Math.max(0, creditorsBalance) };
              }
              return item;
            }),
            equity: prev.equity.map(item => {
              if (item.id === 'retained_earnings') {
                const profitLoss = (parsedData.finalBalances.revenue || 0) - (parsedData.finalBalances.expenses || 0);
                return { ...item, amount: profitLoss };
              }
              return item;
            })
          }));
        } else {
          console.log('No finalBalances found in ETB data');
        }
      } else {
        console.log('No ETB data found in localStorage');
        
        // Show info toast to user
        toast({
          title: "No ETB Data Found",
          description: "Please complete the Extended Trial Balance first to populate financial statements.",
          variant: "default",
        });
      }
    };

    loadFinancialData();
  }, []);

  const handleGenerateAiNote = async () => {
    if (!newNote.title || !newNote.companyDetails) {
      toast({
        title: "Missing information",
        description: "Please provide note title and company details for AI generation.",
        variant: "destructive"
      });
      return;
    }

    setAiGenerating(true);
    try {
      const response = await fetch('/api/ai/generate-note', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: newNote.title,
          template: newNote.template,
          companyDetails: newNote.companyDetails,
          existingNotes: financialNotes
        })
      });

      if (response.ok) {
        const result = await response.json();
        setNewNote(prev => ({
          ...prev,
          content: result.content,
          type: 'ai_generated'
        }));
        
        toast({
          title: "AI Note Generated",
          description: "The note has been generated successfully. Review and customize as needed.",
        });
      } else {
        throw new Error('Failed to generate note');
      }
    } catch (error) {
      toast({
        title: "AI Generation Failed",
        description: "Failed to generate note. Please try again or write manually.",
        variant: "destructive"
      });
    } finally {
      setAiGenerating(false);
    }
  };

  const handleSaveNote = () => {
    if (!newNote.title || !newNote.content) {
      toast({
        title: "Missing information",
        description: "Please provide both title and content for the note.",
        variant: "destructive"
      });
      return;
    }

    const noteToSave: FinancialNote = {
      id: `note_${Date.now()}`,
      title: newNote.title,
      content: newNote.content,
      type: newNote.type,
      template: newNote.template || undefined
    };

    setFinancialNotes(prev => [...prev, noteToSave]);
    setNewNote({
      title: '',
      content: '',
      type: 'custom',
      template: '',
      companyDetails: ''
    });
    setShowNoteDialog(false);

    toast({
      title: "Note Saved",
      description: "The financial note has been saved successfully.",
    });
  };

  const updateLineItem = (reportType: string, itemId: string, amount: number) => {
    if (reportType === 'profit-loss') {
      setProfitLossData(prev => prev.map(item => 
        item.id === itemId ? { ...item, amount } : item
      ));
    } else if (reportType === 'cash-flow') {
      setCashFlowData(prev => prev.map(item => 
        item.id === itemId ? { ...item, amount } : item
      ));
    }
  };

  const calculateTotals = () => {
    const fixedAssetsTotal = balanceSheetData.fixedAssets.reduce((sum, item) => sum + item.amount, 0);
    const currentAssetsTotal = balanceSheetData.currentAssets.reduce((sum, item) => sum + item.amount, 0);
    const currentLiabilitiesTotal = balanceSheetData.currentLiabilities.reduce((sum, item) => sum + item.amount, 0);
    const longTermLiabilitiesTotal = balanceSheetData.longTermLiabilities.reduce((sum, item) => sum + item.amount, 0);
    const equityTotal = balanceSheetData.equity.reduce((sum, item) => sum + item.amount, 0);

    return {
      totalAssets: fixedAssetsTotal + currentAssetsTotal,
      netCurrentAssets: currentAssetsTotal - currentLiabilitiesTotal,
      totalLiabilities: currentLiabilitiesTotal + longTermLiabilitiesTotal,
      netAssets: fixedAssetsTotal + currentAssetsTotal - currentLiabilitiesTotal - longTermLiabilitiesTotal,
      totalEquity: equityTotal
    };
  };

  const totals = calculateTotals();

  // Export functions
  const exportToPDF = async (reportType: string) => {
    setExportingPDF(true);
    try {
      const element = document.getElementById(`${reportType}-report`);
      if (!element) {
        throw new Error('Report element not found');
      }

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 295; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const reportNames = {
        'profit-loss': 'Profit_and_Loss_Statement',
        'balance-sheet': 'Balance_Sheet',
        'cash-flow': 'Cash_Flow_Statement',
        'equity': 'Statement_of_Changes_in_Equity',
        'comprehensive': 'Statement_of_Comprehensive_Income'
      };

      const fileName = `${reportNames[reportType as keyof typeof reportNames] || reportType}_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);

      toast({
        title: "PDF Export Successful",
        description: `${reportType.replace('-', ' ')} has been exported to PDF`,
      });
    } catch (error) {
      console.error('PDF Export Error:', error);
      toast({
        title: "PDF Export Failed",
        description: "There was an error exporting the report to PDF",
        variant: "destructive",
      });
    } finally {
      setExportingPDF(false);
    }
  };

  const exportToExcel = (reportType: string) => {
    try {
      let data: any[] = [];
      let sheetName = '';

      switch (reportType) {
        case 'profit-loss':
          sheetName = 'Profit and Loss';
          data = profitLossData.map(item => ({
            'Description': item.description,
            'Amount (£)': item.amount.toFixed(2)
          }));
          break;
        
        case 'balance-sheet':
          sheetName = 'Balance Sheet';
          data = [
            { 'Section': 'Fixed Assets', 'Description': '', 'Amount (£)': '' },
            ...balanceSheetData.fixedAssets.map(item => ({
              'Section': '',
              'Description': item.description,
              'Amount (£)': item.amount.toFixed(2)
            })),
            { 'Section': '', 'Description': 'Total Fixed Assets', 'Amount (£)': balanceSheetData.fixedAssets.reduce((sum, item) => sum + item.amount, 0).toFixed(2) },
            { 'Section': 'Current Assets', 'Description': '', 'Amount (£)': '' },
            ...balanceSheetData.currentAssets.map(item => ({
              'Section': '',
              'Description': item.description,
              'Amount (£)': item.amount.toFixed(2)
            })),
            { 'Section': '', 'Description': 'Total Current Assets', 'Amount (£)': balanceSheetData.currentAssets.reduce((sum, item) => sum + item.amount, 0).toFixed(2) },
            { 'Section': 'Current Liabilities', 'Description': '', 'Amount (£)': '' },
            ...balanceSheetData.currentLiabilities.map(item => ({
              'Section': '',
              'Description': item.description,
              'Amount (£)': item.amount.toFixed(2)
            })),
            { 'Section': '', 'Description': 'Net Current Assets', 'Amount (£)': totals.netCurrentAssets.toFixed(2) },
            { 'Section': 'Long-term Liabilities', 'Description': '', 'Amount (£)': '' },
            ...balanceSheetData.longTermLiabilities.map(item => ({
              'Section': '',
              'Description': item.description,
              'Amount (£)': item.amount.toFixed(2)
            })),
            { 'Section': 'Capital and Reserves', 'Description': '', 'Amount (£)': '' },
            ...balanceSheetData.equity.map(item => ({
              'Section': '',
              'Description': item.description,
              'Amount (£)': item.amount.toFixed(2)
            })),
            { 'Section': '', 'Description': 'Total Assets', 'Amount (£)': totals.totalAssets.toFixed(2) },
            { 'Section': '', 'Description': 'Net Assets', 'Amount (£)': totals.netAssets.toFixed(2) }
          ];
          break;
        
        case 'cash-flow':
          sheetName = 'Cash Flow';
          data = cashFlowData.map(item => ({
            'Description': item.description,
            'Amount (£)': item.amount.toFixed(2)
          }));
          break;
        
        case 'equity-changes':
          sheetName = 'Statement of Changes in Equity';
          data = [
            { 'Description': 'Share Capital', 'Beginning': '0.00', 'Changes': '0.00', 'Ending': '0.00' },
            { 'Description': 'Share Premium', 'Beginning': '0.00', 'Changes': '0.00', 'Ending': '0.00' },
            { 'Description': 'Retained Earnings', 'Beginning': '0.00', 'Changes': '0.00', 'Ending': '0.00' },
            { 'Description': 'Total Equity', 'Beginning': '0.00', 'Changes': '0.00', 'Ending': '0.00' }
          ];
          break;
        
        case 'comprehensive-income':
          sheetName = 'Statement of Comprehensive Income';
          data = [
            { 'Description': 'Profit for the financial year', 'Amount (£)': '0.00' },
            { 'Description': 'Other comprehensive income', 'Amount (£)': '0.00' },
            { 'Description': 'Total comprehensive income', 'Amount (£)': '0.00' }
          ];
          break;

        default:
          throw new Error('Unknown report type');
      }

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, sheetName);

      const fileName = `${sheetName.replace(/ /g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);

      toast({
        title: "Excel Export Successful",
        description: `${sheetName} has been exported to Excel`,
      });
    } catch (error) {
      console.error('Excel Export Error:', error);
      toast({
        title: "Excel Export Failed",
        description: "There was an error exporting the report to Excel",
        variant: "destructive",
      });
    }
  };

  const exportToCSV = (reportType: string) => {
    try {
      let data: any[] = [];
      let fileName = '';

      switch (reportType) {
        case 'profit-loss':
          fileName = 'Profit_and_Loss';
          data = profitLossData.map(item => ({
            'Description': item.description,
            'Amount': item.amount
          }));
          break;
        
        case 'balance-sheet':
          fileName = 'Balance_Sheet';
          data = [
            { 'Section': 'Fixed Assets', 'Description': '', 'Amount': '' },
            ...balanceSheetData.fixedAssets.map(item => ({
              'Section': '',
              'Description': item.description,
              'Amount': item.amount
            })),
            { 'Section': 'Current Assets', 'Description': '', 'Amount': '' },
            ...balanceSheetData.currentAssets.map(item => ({
              'Section': '',
              'Description': item.description,
              'Amount': item.amount
            }))
          ];
          break;
        
        case 'cash-flow':
          fileName = 'Cash_Flow';
          data = cashFlowData.map(item => ({
            'Description': item.description,
            'Amount': item.amount
          }));
          break;
        
        case 'equity-changes':
          fileName = 'Statement_of_Changes_in_Equity';
          data = [
            { 'Description': 'Share Capital', 'Beginning': 0, 'Changes': 0, 'Ending': 0 },
            { 'Description': 'Share Premium', 'Beginning': 0, 'Changes': 0, 'Ending': 0 },
            { 'Description': 'Retained Earnings', 'Beginning': 0, 'Changes': 0, 'Ending': 0 }
          ];
          break;
        
        case 'comprehensive-income':
          fileName = 'Statement_of_Comprehensive_Income';
          data = [
            { 'Description': 'Profit for the financial year', 'Amount': 0 },
            { 'Description': 'Other comprehensive income', 'Amount': 0 },
            { 'Description': 'Total comprehensive income', 'Amount': 0 }
          ];
          break;

        default:
          throw new Error('Unknown report type');
      }

      const ws = XLSX.utils.json_to_sheet(data);
      const csvContent = XLSX.utils.sheet_to_csv(ws);
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${fileName}_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "CSV Export Successful",
        description: `${fileName.replace('_', ' ')} has been exported to CSV`,
      });
    } catch (error) {
      console.error('CSV Export Error:', error);
      toast({
        title: "CSV Export Failed",
        description: "There was an error exporting the report to CSV",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Financial Reporting</h1>
          <p className="text-muted-foreground">Comprehensive financial statements and notes</p>
          
          {/* ETB Data Status Indicator */}
          <div className="flex items-center gap-2 mt-2">
            {localStorage.getItem('etbData') ? (
              <Badge className="bg-green-100 text-green-800">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                ETB Data Loaded
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-yellow-50 text-yellow-800 border-yellow-300">
                <AlertTriangle className="h-3 w-3 mr-1" />
                No ETB Data - Run Extended Trial Balance First
              </Badge>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => exportToPDF(activeReport)}
            disabled={exportingPDF}
          >
            <FileDown className="h-4 w-4 mr-2" />
            {exportingPDF ? 'Exporting...' : 'Export PDF'}
          </Button>
          <Button
            variant="outline"
            onClick={() => exportToExcel(activeReport)}
          >
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Export Excel
          </Button>
          <Button
            variant="outline"
            onClick={() => exportToCSV(activeReport)}
          >
            <FileText className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      <Tabs value={activeReport} onValueChange={setActiveReport}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="profit-loss">
            <TrendingUp className="h-4 w-4 mr-2" />
            P&L
          </TabsTrigger>
          <TabsTrigger value="balance-sheet">
            <Calculator className="h-4 w-4 mr-2" />
            Balance Sheet
          </TabsTrigger>
          <TabsTrigger value="cash-flow">
            <DollarSign className="h-4 w-4 mr-2" />
            Cash Flow
          </TabsTrigger>
          <TabsTrigger value="equity-changes">
            <BarChart3 className="h-4 w-4 mr-2" />
            Equity Changes
          </TabsTrigger>
          <TabsTrigger value="comprehensive-income">
            <PieChart className="h-4 w-4 mr-2" />
            Comprehensive Income
          </TabsTrigger>
          <TabsTrigger value="notes">
            <FileText className="h-4 w-4 mr-2" />
            Notes
          </TabsTrigger>
        </TabsList>

        {/* Profit & Loss Statement */}
        <TabsContent value="profit-loss" className="space-y-4">
          <Card id="profit-loss-report">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Profit and Loss Account
              </CardTitle>
              <CardDescription>
                For the year ended [Date]
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {profitLossData.map((item) => (
                  <div key={item.id} className="flex justify-between items-center py-2 border-b">
                    <div className="flex-1">
                      <Label className={item.customizable ? '' : 'font-bold'}>{item.description}</Label>
                      {item.note && (
                        <p className="text-sm text-muted-foreground mt-1">Note: {item.note}</p>
                      )}
                    </div>
                    <div className="w-32">
                      {item.customizable ? (
                        <Input
                          type="number"
                          step="0.01"
                          value={item.amount}
                          onChange={(e) => updateLineItem('profit-loss', item.id, parseFloat(e.target.value) || 0)}
                          className="text-right"
                        />
                      ) : (
                        <div className="text-right font-medium">
                          £{item.amount.toLocaleString('en-GB', { minimumFractionDigits: 2 })}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Balance Sheet */}
        <TabsContent value="balance-sheet" className="space-y-4">
          <Card id="balance-sheet-report">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Balance Sheet
              </CardTitle>
              <CardDescription>
                As at [Date]
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Assets Side */}
                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold mb-3">Fixed Assets</h3>
                    <div className="space-y-2">
                      {balanceSheetData.fixedAssets.map((item) => (
                        <div key={item.id} className="flex justify-between items-center">
                          <Label className="text-sm">{item.description}</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={item.amount}
                            onChange={(e) => {
                              const newAmount = parseFloat(e.target.value) || 0;
                              setBalanceSheetData(prev => ({
                                ...prev,
                                fixedAssets: prev.fixedAssets.map(asset =>
                                  asset.id === item.id ? { ...asset, amount: newAmount } : asset
                                )
                              }));
                            }}
                            className="w-32 text-right"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-3">Current Assets</h3>
                    <div className="space-y-2">
                      {balanceSheetData.currentAssets.map((item) => (
                        <div key={item.id} className="flex justify-between items-center">
                          <Label className="text-sm">{item.description}</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={item.amount}
                            onChange={(e) => {
                              const newAmount = parseFloat(e.target.value) || 0;
                              setBalanceSheetData(prev => ({
                                ...prev,
                                currentAssets: prev.currentAssets.map(asset =>
                                  asset.id === item.id ? { ...asset, amount: newAmount } : asset
                                )
                              }));
                            }}
                            className="w-32 text-right"
                          />
                        </div>
                      ))}
                      <div className="flex justify-between items-center pt-2 border-t">
                        <Label className="font-medium">Total Current Assets</Label>
                        <div className="w-32 text-right font-medium">
                          £{balanceSheetData.currentAssets.reduce((sum, item) => sum + item.amount, 0).toLocaleString('en-GB', { minimumFractionDigits: 2 })}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Liabilities & Equity Side */}
                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold mb-3">Current Liabilities</h3>
                    <div className="space-y-2">
                      {balanceSheetData.currentLiabilities.map((item) => (
                        <div key={item.id} className="flex justify-between items-center">
                          <Label className="text-sm">{item.description}</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={item.amount}
                            onChange={(e) => {
                              const newAmount = parseFloat(e.target.value) || 0;
                              setBalanceSheetData(prev => ({
                                ...prev,
                                currentLiabilities: prev.currentLiabilities.map(liability =>
                                  liability.id === item.id ? { ...liability, amount: newAmount } : liability
                                )
                              }));
                            }}
                            className="w-32 text-right"
                          />
                        </div>
                      ))}
                      <div className="flex justify-between items-center pt-2 border-t">
                        <Label className="font-medium">Net Current Assets</Label>
                        <div className="w-32 text-right font-medium">
                          £{totals.netCurrentAssets.toLocaleString('en-GB', { minimumFractionDigits: 2 })}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-3">Long-term Liabilities</h3>
                    <div className="space-y-2">
                      {balanceSheetData.longTermLiabilities.map((item) => (
                        <div key={item.id} className="flex justify-between items-center">
                          <Label className="text-sm">{item.description}</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={item.amount}
                            onChange={(e) => {
                              const newAmount = parseFloat(e.target.value) || 0;
                              setBalanceSheetData(prev => ({
                                ...prev,
                                longTermLiabilities: prev.longTermLiabilities.map(liability =>
                                  liability.id === item.id ? { ...liability, amount: newAmount } : liability
                                )
                              }));
                            }}
                            className="w-32 text-right"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-3">Capital and Reserves</h3>
                    <div className="space-y-2">
                      {balanceSheetData.equity.map((item) => (
                        <div key={item.id} className="flex justify-between items-center">
                          <Label className="text-sm">{item.description}</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={item.amount}
                            onChange={(e) => {
                              const newAmount = parseFloat(e.target.value) || 0;
                              setBalanceSheetData(prev => ({
                                ...prev,
                                equity: prev.equity.map(equity =>
                                  equity.id === item.id ? { ...equity, amount: newAmount } : equity
                                )
                              }));
                            }}
                            className="w-32 text-right"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <Separator className="my-6" />
              
              <div className="bg-muted p-4 rounded-lg">
                <div className="grid grid-cols-2 gap-4 text-lg font-medium">
                  <div className="flex justify-between">
                    <span>Total Assets:</span>
                    <span>£{totals.totalAssets.toLocaleString('en-GB', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Net Assets:</span>
                    <span>£{totals.netAssets.toLocaleString('en-GB', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cash Flow Statement */}
        <TabsContent value="cash-flow" className="space-y-4">
          <Card id="cash-flow-report">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Cash Flow Statement
              </CardTitle>
              <CardDescription>
                For the year ended [Date]
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {cashFlowData.map((item) => (
                  <div key={item.id} className="flex justify-between items-center py-2 border-b">
                    <Label className={item.customizable ? '' : 'font-bold'}>{item.description}</Label>
                    <div className="w-32">
                      {item.customizable ? (
                        <Input
                          type="number"
                          step="0.01"
                          value={item.amount}
                          onChange={(e) => updateLineItem('cash-flow', item.id, parseFloat(e.target.value) || 0)}
                          className="text-right"
                        />
                      ) : (
                        <div className="text-right font-medium">
                          £{item.amount.toLocaleString('en-GB', { minimumFractionDigits: 2 })}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Statement of Changes in Equity */}
        <TabsContent value="equity-changes" className="space-y-4">
          <Card id="equity-changes-report">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Statement of Changes in Equity
              </CardTitle>
              <CardDescription>
                For the year ended [Date]
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2"></th>
                      <th className="text-right p-2">Share Capital</th>
                      <th className="text-right p-2">Share Premium</th>
                      <th className="text-right p-2">Retained Earnings</th>
                      <th className="text-right p-2">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="p-2 font-medium">Balance at beginning of year</td>
                      <td className="p-2 text-right">£0.00</td>
                      <td className="p-2 text-right">£0.00</td>
                      <td className="p-2 text-right">£0.00</td>
                      <td className="p-2 text-right">£0.00</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-2">Profit for the year</td>
                      <td className="p-2 text-right">-</td>
                      <td className="p-2 text-right">-</td>
                      <td className="p-2 text-right">£0.00</td>
                      <td className="p-2 text-right">£0.00</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-2">Dividends paid</td>
                      <td className="p-2 text-right">-</td>
                      <td className="p-2 text-right">-</td>
                      <td className="p-2 text-right">£0.00</td>
                      <td className="p-2 text-right">£0.00</td>
                    </tr>
                    <tr className="border-t-2 font-medium">
                      <td className="p-2">Balance at end of year</td>
                      <td className="p-2 text-right">£0.00</td>
                      <td className="p-2 text-right">£0.00</td>
                      <td className="p-2 text-right">£0.00</td>
                      <td className="p-2 text-right">£0.00</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Statement of Comprehensive Income */}
        <TabsContent value="comprehensive-income" className="space-y-4">
          <Card id="comprehensive-income-report">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                Statement of Comprehensive Income
              </CardTitle>
              <CardDescription>
                For the year ended [Date]
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b">
                  <Label>Profit for the year</Label>
                  <div className="w-32 text-right font-medium">£0.00</div>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <Label>Other comprehensive income:</Label>
                  <div className="w-32"></div>
                </div>
                <div className="flex justify-between items-center py-2 border-b pl-4">
                  <Label>Items that will not be reclassified to profit or loss:</Label>
                  <div className="w-32"></div>
                </div>
                <div className="flex justify-between items-center py-2 border-b pl-8">
                  <Label>Actuarial gains/(losses) on pension scheme</Label>
                  <Input type="number" step="0.01" className="w-32 text-right" />
                </div>
                <div className="flex justify-between items-center py-2 border-b pl-4">
                  <Label>Items that may be reclassified to profit or loss:</Label>
                  <div className="w-32"></div>
                </div>
                <div className="flex justify-between items-center py-2 border-b pl-8">
                  <Label>Foreign exchange differences</Label>
                  <Input type="number" step="0.01" className="w-32 text-right" />
                </div>
                <div className="flex justify-between items-center py-2 border-t-2 font-medium">
                  <Label>Total comprehensive income for the year</Label>
                  <div className="w-32 text-right">£0.00</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notes to Financial Statements */}
        <TabsContent value="notes" className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-semibold">Notes to the Financial Statements</h2>
              <p className="text-muted-foreground">Customize notes or use AI to generate them</p>
            </div>
            <Dialog open={showNoteDialog} onOpenChange={setShowNoteDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Note
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl">
                <DialogHeader>
                  <DialogTitle>Add Financial Note</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="note-title">Note Title</Label>
                      <Input
                        id="note-title"
                        placeholder="e.g., Fixed Assets"
                        value={newNote.title}
                        onChange={(e) => setNewNote(prev => ({ ...prev, title: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="note-template">Template</Label>
                      <Select value={newNote.template} onValueChange={(value) => setNewNote(prev => ({ ...prev, template: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select template" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(noteTemplates).map(([key, description]) => (
                            <SelectItem key={key} value={key}>{description}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="company-details">Company Details for AI Generation</Label>
                    <Textarea
                      id="company-details"
                      placeholder="Provide specific details about your company, industry, key figures, etc. that should be included in the note..."
                      value={newNote.companyDetails}
                      onChange={(e) => setNewNote(prev => ({ ...prev, companyDetails: e.target.value }))}
                      rows={3}
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      onClick={handleGenerateAiNote}
                      disabled={aiGenerating}
                      variant="outline"
                    >
                      {aiGenerating ? (
                        <>
                          <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full mr-2" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Wand2 className="h-4 w-4 mr-2" />
                          Generate with AI
                        </>
                      )}
                    </Button>
                    <Badge variant="secondary">
                      {newNote.type === 'ai_generated' ? 'AI Generated' : 'Manual'}
                    </Badge>
                  </div>

                  <div>
                    <Label htmlFor="note-content">Note Content</Label>
                    <Textarea
                      id="note-content"
                      placeholder="Enter the note content or use AI to generate it..."
                      value={newNote.content}
                      onChange={(e) => setNewNote(prev => ({ ...prev, content: e.target.value }))}
                      rows={8}
                    />
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setShowNoteDialog(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleSaveNote}>
                      <Save className="h-4 w-4 mr-2" />
                      Save Note
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {financialNotes.map((note) => (
              <Card key={note.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{note.title}</CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant={note.type === 'ai_generated' ? 'default' : note.type === 'standard' ? 'secondary' : 'outline'}>
                        {note.type === 'ai_generated' ? 'AI Generated' : note.type === 'standard' ? 'Standard' : 'Custom'}
                      </Badge>
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
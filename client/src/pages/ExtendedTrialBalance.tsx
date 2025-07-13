import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Edit, Trash2, FileSpreadsheet, CheckCircle2, Calculator, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface TrialBalanceEntry {
  id: string;
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
  source: 'ai_processed' | 'manual_journal' | 'opening_balance';
  documentRef?: string;
  adjustmentRef?: string;
}

interface JournalEntry {
  id: string;
  date: string;
  description: string;
  reference: string;
  entries: {
    accountCode: string;
    accountName: string;
    debit: number;
    credit: number;
  }[];
}

const ACCOUNT_CODES = {
  // Revenue accounts
  '4000': 'Sales Revenue',
  '4100': 'Service Revenue',
  '4900': 'Other Income',
  
  // Expense accounts
  '5000': 'Cost of Sales',
  '6000': 'Administrative Expenses',
  '6100': 'Professional Fees',
  '6200': 'Travel & Entertainment',
  '6300': 'Office Expenses',
  '6400': 'Marketing & Advertising',
  '6500': 'Insurance',
  '6600': 'Depreciation',
  '6900': 'Other Expenses',
  
  // Asset accounts
  '1000': 'Fixed Assets',
  '1100': 'Current Assets',
  '1200': 'Cash at Bank',
  '1300': 'Debtors',
  '1400': 'Stock',
  
  // Liability accounts
  '2000': 'Current Liabilities',
  '2100': 'Creditors',
  '2200': 'Accruals',
  '2300': 'Long-term Liabilities',
  
  // Equity accounts
  '3000': 'Share Capital',
  '3100': 'Retained Earnings',
  '3200': 'Current Year Earnings'
};

export default function ExtendedTrialBalance() {
  const [trialBalance, setTrialBalance] = useState<TrialBalanceEntry[]>([]);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [showJournalDialog, setShowJournalDialog] = useState(false);
  const [editingJournal, setEditingJournal] = useState<JournalEntry | null>(null);
  const [aiProcessedData, setAiProcessedData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const [newJournal, setNewJournal] = useState({
    date: new Date().toISOString().split('T')[0],
    description: '',
    reference: '',
    entries: [
      { accountCode: '', accountName: '', debit: 0, credit: 0 },
      { accountCode: '', accountName: '', debit: 0, credit: 0 }
    ]
  });

  useEffect(() => {
    loadAiProcessedData();
  }, []);

  const loadAiProcessedData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/tax-filings/1/2024-25/processed-data');
      const data = await response.json();
      setAiProcessedData(data);
      
      // Generate trial balance from AI processed data
      const entries: TrialBalanceEntry[] = [];
      
      if (data.turnover > 0) {
        entries.push({
          id: 'tb_4000',
          accountCode: '4000',
          accountName: 'Sales Revenue',
          debit: 0,
          credit: data.turnover,
          source: 'ai_processed',
          documentRef: 'AI processed sales invoices'
        });
      }
      
      if (data.otherIncome > 0) {
        entries.push({
          id: 'tb_4900',
          accountCode: '4900',
          accountName: 'Other Income',
          debit: 0,
          credit: data.otherIncome,
          source: 'ai_processed',
          documentRef: 'AI processed other income'
        });
      }
      
      if (data.costOfSales > 0) {
        entries.push({
          id: 'tb_5000',
          accountCode: '5000',
          accountName: 'Cost of Sales',
          debit: data.costOfSales,
          credit: 0,
          source: 'ai_processed',
          documentRef: 'AI processed purchase invoices'
        });
      }
      
      if (data.administrativeExpenses > 0) {
        entries.push({
          id: 'tb_6000',
          accountCode: '6000',
          accountName: 'Administrative Expenses',
          debit: data.administrativeExpenses,
          credit: 0,
          source: 'ai_processed',
          documentRef: 'AI processed expense receipts'
        });
      }
      
      if (data.professionalFees > 0) {
        entries.push({
          id: 'tb_6100',
          accountCode: '6100',
          accountName: 'Professional Fees',
          debit: data.professionalFees,
          credit: 0,
          source: 'ai_processed',
          documentRef: 'AI processed professional fees'
        });
      }
      
      if (data.otherExpenses > 0) {
        entries.push({
          id: 'tb_6900',
          accountCode: '6900',
          accountName: 'Other Expenses',
          debit: data.otherExpenses,
          credit: 0,
          source: 'ai_processed',
          documentRef: 'AI processed other expenses'
        });
      }
      
      setTrialBalance(entries);
    } catch (error) {
      console.error('Error loading processed data:', error);
      toast({
        title: "Error loading data",
        description: "Failed to load AI processed data for trial balance.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddJournal = () => {
    // Validate journal entries
    const totalDebits = newJournal.entries.reduce((sum, entry) => sum + entry.debit, 0);
    const totalCredits = newJournal.entries.reduce((sum, entry) => sum + entry.credit, 0);
    
    if (Math.abs(totalDebits - totalCredits) > 0.01) {
      toast({
        title: "Journal entry error",
        description: "Debits and credits must balance.",
        variant: "destructive"
      });
      return;
    }
    
    const journalId = `journal_${Date.now()}`;
    const journal: JournalEntry = {
      id: journalId,
      date: newJournal.date,
      description: newJournal.description,
      reference: newJournal.reference,
      entries: newJournal.entries.filter(entry => entry.accountCode && (entry.debit > 0 || entry.credit > 0))
    };
    
    setJournalEntries([...journalEntries, journal]);
    
    // Update trial balance with journal entries
    const updatedTrialBalance = [...trialBalance];
    
    journal.entries.forEach(entry => {
      const existingEntry = updatedTrialBalance.find(tb => tb.accountCode === entry.accountCode);
      if (existingEntry) {
        existingEntry.debit += entry.debit;
        existingEntry.credit += entry.credit;
      } else {
        updatedTrialBalance.push({
          id: `tb_${entry.accountCode}_${journalId}`,
          accountCode: entry.accountCode,
          accountName: entry.accountName,
          debit: entry.debit,
          credit: entry.credit,
          source: 'manual_journal',
          adjustmentRef: `Journal ${journal.reference}`
        });
      }
    });
    
    setTrialBalance(updatedTrialBalance);
    setShowJournalDialog(false);
    setNewJournal({
      date: new Date().toISOString().split('T')[0],
      description: '',
      reference: '',
      entries: [
        { accountCode: '', accountName: '', debit: 0, credit: 0 },
        { accountCode: '', accountName: '', debit: 0, credit: 0 }
      ]
    });
    
    toast({
      title: "Journal entry added",
      description: "Trial balance updated with journal adjustment.",
    });
  };

  const addJournalLine = () => {
    setNewJournal({
      ...newJournal,
      entries: [...newJournal.entries, { accountCode: '', accountName: '', debit: 0, credit: 0 }]
    });
  };

  const updateJournalLine = (index: number, field: string, value: any) => {
    const updatedEntries = [...newJournal.entries];
    updatedEntries[index] = { ...updatedEntries[index], [field]: value };
    
    // Auto-populate account name when account code is selected
    if (field === 'accountCode' && value) {
      updatedEntries[index].accountName = ACCOUNT_CODES[value as keyof typeof ACCOUNT_CODES] || '';
    }
    
    setNewJournal({ ...newJournal, entries: updatedEntries });
  };

  const removeJournalLine = (index: number) => {
    if (newJournal.entries.length > 2) {
      const updatedEntries = newJournal.entries.filter((_, i) => i !== index);
      setNewJournal({ ...newJournal, entries: updatedEntries });
    }
  };

  const generateFinalBalances = () => {
    const finalBalances = {
      revenue: 0,
      expenses: 0,
      assets: 0,
      liabilities: 0,
      equity: 0
    };

    trialBalance.forEach(entry => {
      const netBalance = entry.credit - entry.debit;
      const code = entry.accountCode;
      
      if (code.startsWith('4')) {
        finalBalances.revenue += netBalance;
      } else if (code.startsWith('5') || code.startsWith('6')) {
        finalBalances.expenses += -netBalance;
      } else if (code.startsWith('1')) {
        finalBalances.assets += -netBalance;
      } else if (code.startsWith('2')) {
        finalBalances.liabilities += netBalance;
      } else if (code.startsWith('3')) {
        finalBalances.equity += netBalance;
      }
    });

    return finalBalances;
  };

  const totalDebits = trialBalance.reduce((sum, entry) => sum + entry.debit, 0);
  const totalCredits = trialBalance.reduce((sum, entry) => sum + entry.credit, 0);
  const journalDebits = newJournal.entries.reduce((sum, entry) => sum + entry.debit, 0);
  const journalCredits = newJournal.entries.reduce((sum, entry) => sum + entry.credit, 0);
  const finalBalances = generateFinalBalances();

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Extended Trial Balance</h1>
          <p className="text-muted-foreground">Review AI-processed transactions and make adjustments</p>
        </div>
        <Dialog open={showJournalDialog} onOpenChange={setShowJournalDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Journal Entry
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Add Journal Entry</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={newJournal.date}
                    onChange={(e) => setNewJournal({...newJournal, date: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="reference">Reference</Label>
                  <Input
                    id="reference"
                    placeholder="JE001"
                    value={newJournal.reference}
                    onChange={(e) => setNewJournal({...newJournal, reference: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    placeholder="Adjustment for..."
                    value={newJournal.description}
                    onChange={(e) => setNewJournal({...newJournal, description: e.target.value})}
                  />
                </div>
              </div>

              <div className="border rounded-lg p-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-medium">Journal Lines</h3>
                  <Button variant="outline" size="sm" onClick={addJournalLine}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Line
                  </Button>
                </div>
                
                <div className="space-y-2">
                  {newJournal.entries.map((entry, index) => (
                    <div key={index} className="grid grid-cols-12 gap-2 items-center">
                      <div className="col-span-2">
                        <Select 
                          value={entry.accountCode} 
                          onValueChange={(value) => updateJournalLine(index, 'accountCode', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Account" />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(ACCOUNT_CODES).map(([code, name]) => (
                              <SelectItem key={code} value={code}>{code} - {name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-4">
                        <Input
                          placeholder="Account Name"
                          value={entry.accountName}
                          onChange={(e) => updateJournalLine(index, 'accountName', e.target.value)}
                        />
                      </div>
                      <div className="col-span-2">
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="Debit"
                          value={entry.debit || ''}
                          onChange={(e) => updateJournalLine(index, 'debit', parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      <div className="col-span-2">
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="Credit"
                          value={entry.credit || ''}
                          onChange={(e) => updateJournalLine(index, 'credit', parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      <div className="col-span-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => removeJournalLine(index)}
                          disabled={newJournal.entries.length <= 2}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-4 p-3 bg-muted rounded-lg">
                  <div className="flex justify-between">
                    <span>Total Debits: £{journalDebits.toFixed(2)}</span>
                    <span>Total Credits: £{journalCredits.toFixed(2)}</span>
                    <span className={`font-medium ${Math.abs(journalDebits - journalCredits) < 0.01 ? 'text-green-600' : 'text-red-600'}`}>
                      Difference: £{Math.abs(journalDebits - journalCredits).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowJournalDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddJournal}>
                  Save Journal Entry
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p>Loading AI processed data...</p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {aiProcessedData && aiProcessedData.processedDocuments > 0 && (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                <strong>AI Processing Complete:</strong> {aiProcessedData.processedDocuments} documents processed and integrated into trial balance. Review the entries below and add any necessary adjustments.
              </AlertDescription>
            </Alert>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5" />
                Trial Balance
              </CardTitle>
              <CardDescription>
                Review and adjust account balances before generating final statements
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Account Code</th>
                      <th className="text-left p-2">Account Name</th>
                      <th className="text-right p-2">Debit</th>
                      <th className="text-right p-2">Credit</th>
                      <th className="text-left p-2">Source</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trialBalance.map((entry) => (
                      <tr key={entry.id} className="border-b hover:bg-muted/50">
                        <td className="p-2 font-mono">{entry.accountCode}</td>
                        <td className="p-2">{entry.accountName}</td>
                        <td className="p-2 text-right">
                          {entry.debit > 0 ? `£${entry.debit.toFixed(2)}` : '-'}
                        </td>
                        <td className="p-2 text-right">
                          {entry.credit > 0 ? `£${entry.credit.toFixed(2)}` : '-'}
                        </td>
                        <td className="p-2">
                          <Badge variant={entry.source === 'ai_processed' ? 'default' : 'secondary'}>
                            {entry.source === 'ai_processed' ? 'AI Processed' : 'Manual Journal'}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 font-medium">
                      <td className="p-2" colSpan={2}>Total</td>
                      <td className="p-2 text-right">£{totalDebits.toFixed(2)}</td>
                      <td className="p-2 text-right">£{totalCredits.toFixed(2)}</td>
                      <td className="p-2">
                        <Badge variant={Math.abs(totalDebits - totalCredits) < 0.01 ? 'default' : 'destructive'}>
                          {Math.abs(totalDebits - totalCredits) < 0.01 ? 'Balanced' : 'Out of Balance'}
                        </Badge>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </CardContent>
          </Card>

          {journalEntries.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Journal Entries</CardTitle>
                <CardDescription>Manual adjustments made to the trial balance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {journalEntries.map((journal) => (
                    <div key={journal.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-medium">{journal.reference}</h4>
                          <p className="text-sm text-muted-foreground">{journal.description}</p>
                        </div>
                        <div className="text-sm text-muted-foreground">{journal.date}</div>
                      </div>
                      <div className="grid grid-cols-4 gap-2 text-sm">
                        {journal.entries.map((entry, index) => (
                          <div key={index} className="flex justify-between">
                            <span>{entry.accountCode} - {entry.accountName}</span>
                            <span>
                              {entry.debit > 0 ? `Dr £${entry.debit.toFixed(2)}` : `Cr £${entry.credit.toFixed(2)}`}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Final Balances Summary
              </CardTitle>
              <CardDescription>
                These balances will be used to populate the Income Statement and Balance Sheet
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium mb-3 text-green-600">Income Statement</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Revenue</span>
                      <span className="font-medium">£{finalBalances.revenue.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Expenses</span>
                      <span className="font-medium">£{finalBalances.expenses.toFixed(2)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-medium">
                      <span>Net Profit/(Loss)</span>
                      <span className={finalBalances.revenue - finalBalances.expenses >= 0 ? 'text-green-600' : 'text-red-600'}>
                        £{(finalBalances.revenue - finalBalances.expenses).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="font-medium mb-3 text-blue-600">Balance Sheet</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Assets</span>
                      <span className="font-medium">£{finalBalances.assets.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Liabilities</span>
                      <span className="font-medium">£{finalBalances.liabilities.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Equity</span>
                      <span className="font-medium">£{finalBalances.equity.toFixed(2)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-medium">
                      <span>Net Assets</span>
                      <span>£{(finalBalances.assets - finalBalances.liabilities).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-center">
            <Button 
              size="lg" 
              className="w-full max-w-md"
              onClick={() => {
                // Save the trial balance data to the filing
                const saveData = {
                  trialBalance: trialBalance,
                  journalEntries: journalEntries,
                  finalBalances: finalBalances
                };
                
                // Store in localStorage temporarily or save to API
                localStorage.setItem('etbData', JSON.stringify(saveData));
                
                // Navigate to financial reporting instead
                window.location.href = '/financial-reporting';
              }}
            >
              Generate Financial Statements
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
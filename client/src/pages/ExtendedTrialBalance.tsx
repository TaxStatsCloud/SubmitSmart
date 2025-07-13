import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Edit, Trash2, FileSpreadsheet, CheckCircle2, Calculator, AlertTriangle, ChevronRight, Eye, Upload, X, FileText, Paperclip } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
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
  breakdown?: {
    documentName: string;
    amount: number;
    description: string;
    documentId: string;
  }[];
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
  source?: 'ai_generated' | 'manual_entry';
  supportingDocuments?: File[];
  aiExplanation?: string;
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

// Separate component for trial balance row with breakdown
function TrialBalanceRow({ entry, onEditBreakdown }: { entry: TrialBalanceEntry; onEditBreakdown: (entryId: string, item: any) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <>
      <tr 
        className="border-b hover:bg-muted/50 cursor-pointer"
        onClick={() => entry.breakdown && entry.breakdown.length > 0 && setIsOpen(!isOpen)}
      >
        <td className="p-2 font-mono">{entry.accountCode}</td>
        <td className="p-2">
          <div className="flex items-center gap-2">
            {entry.breakdown && entry.breakdown.length > 0 && (
              <ChevronRight className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
            )}
            {entry.accountName}
          </div>
        </td>
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
      {isOpen && entry.breakdown && entry.breakdown.length > 0 && (
        <tr>
          <td colSpan={5} className="p-2 bg-gray-50">
            <div className="ml-6 space-y-2">
              <div className="text-sm font-semibold text-gray-700 mb-3">
                Breakdown for {entry.accountName}:
              </div>
              <div className="space-y-1">
                {entry.breakdown.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center py-2 px-4 bg-white rounded border">
                    <div className="flex-1">
                      <div className="font-medium text-sm">{item.documentName}</div>
                      <div className="text-gray-600 text-xs">{item.description}</div>
                    </div>
                    <div className="font-mono text-right ml-4 font-medium">
                      £{item.amount.toFixed(2)}
                    </div>
                    <div className="ml-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditBreakdown(entry.id, item);
                        }}
                        className="h-6 w-6 p-0"
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export default function ExtendedTrialBalance() {
  const [trialBalance, setTrialBalance] = useState<TrialBalanceEntry[]>([]);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [showJournalDialog, setShowJournalDialog] = useState(false);
  const [editingJournal, setEditingJournal] = useState<JournalEntry | null>(null);
  const [aiProcessedData, setAiProcessedData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [aiJournalEntry, setAiJournalEntry] = useState({
    description: '',
    explanation: '',
    isGenerating: false,
    supportingDocuments: [] as File[]
  });
  const { toast } = useToast();

  const handleEditBreakdownItem = (entryId: string, item: any) => {
    const newAccountCode = prompt(`Edit account code for ${item.documentName}:`, '6000');
    if (newAccountCode) {
      const newDescription = prompt(`Edit description for ${item.documentName}:`, item.description);
      if (newDescription) {
        // Update the breakdown item
        fetch(`/api/trial-balance/2/2024-25/breakdown/${entryId}/${item.documentId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            accountCode: newAccountCode,
            accountName: accountNames[newAccountCode] || 'Unknown Account',
            amount: item.amount,
            description: newDescription
          }),
        })
        .then(response => response.json())
        .then(data => {
          if (data.success) {
            toast({
              title: "Item Updated",
              description: `${item.documentName} updated successfully`,
            });
            loadAiProcessedData(); // Refresh the data
          } else {
            toast({
              title: "Update Failed",
              description: "Failed to update breakdown item",
              variant: "destructive"
            });
          }
        })
        .catch(error => {
          console.error('Error updating breakdown item:', error);
          toast({
            title: "Update Failed",
            description: "Failed to update breakdown item",
            variant: "destructive"
          });
        });
      }
    }
  };

  const [newJournal, setNewJournal] = useState({
    date: new Date().toISOString().split('T')[0],
    description: '',
    reference: '',
    entries: [
      { accountCode: '', accountName: '', debit: 0, credit: 0 },
      { accountCode: '', accountName: '', debit: 0, credit: 0 }
    ],
    supportingDocuments: [] as File[]
  });

  useEffect(() => {
    loadAiProcessedData();
  }, []);

  const loadAiProcessedData = async () => {
    setLoading(true);
    try {
      // Fetch trial balance data from the new API endpoint
      const response = await fetch('/api/trial-balance/2/2024-25');
      const data = await response.json();
      
      if (data.trialBalance && data.trialBalance.length > 0) {
        // Use the trial balance entries directly from the API
        setTrialBalance(data.trialBalance);
        setAiProcessedData(data.finalBalances);
      } else {
        // Fallback to processed data aggregation
        const fallbackResponse = await fetch('/api/tax-filings/1/2024-25/processed-data');
        const fallbackData = await fallbackResponse.json();
        setAiProcessedData(fallbackData);
        
        // Generate trial balance from AI processed data
        const entries: TrialBalanceEntry[] = [];
        
        if (fallbackData.turnover > 0) {
          entries.push({
            id: 'tb_4000',
            accountCode: '4000',
            accountName: 'Sales Revenue',
            debit: 0,
            credit: fallbackData.turnover,
            source: 'ai_processed',
            documentRef: 'AI processed sales invoices'
          });
        }
        
        if (fallbackData.otherIncome > 0) {
          entries.push({
            id: 'tb_4900',
            accountCode: '4900',
            accountName: 'Other Income',
            debit: 0,
            credit: fallbackData.otherIncome,
            source: 'ai_processed',
            documentRef: 'AI processed other income'
          });
        }
        
        if (fallbackData.costOfSales > 0) {
          entries.push({
            id: 'tb_5000',
            accountCode: '5000',
            accountName: 'Cost of Sales',
            debit: fallbackData.costOfSales,
            credit: 0,
            source: 'ai_processed',
            documentRef: 'AI processed purchase invoices'
          });
        }
        
        if (fallbackData.administrativeExpenses > 0) {
          entries.push({
            id: 'tb_6000',
            accountCode: '6000',
            accountName: 'Administrative Expenses',
            debit: fallbackData.administrativeExpenses,
            credit: 0,
            source: 'ai_processed',
            documentRef: 'AI processed expense receipts'
          });
        }
        
        if (fallbackData.professionalFees > 0) {
          entries.push({
            id: 'tb_6100',
            accountCode: '6100',
            accountName: 'Professional Fees',
            debit: fallbackData.professionalFees,
            credit: 0,
            source: 'ai_processed',
            documentRef: 'AI processed professional fees'
          });
        }
        
        // Add opening balances for demo
        entries.push({
          id: 'tb_1200',
          accountCode: '1200',
          accountName: 'Cash at Bank',
          debit: 25000,
          credit: 0,
          source: 'opening_balance'
        });
        
        entries.push({
          id: 'tb_3000',
          accountCode: '3000',
          accountName: 'Share Capital',
          debit: 0,
          credit: 10000,
          source: 'opening_balance'
        });
        
        entries.push({
          id: 'tb_3100',
          accountCode: '3100',
          accountName: 'Retained Earnings',
          debit: 0,
          credit: 15000,
          source: 'opening_balance'
        });
        
        setTrialBalance(entries);
      }
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
      entries: newJournal.entries.filter(entry => entry.accountCode && (entry.debit > 0 || entry.credit > 0)),
      source: 'manual_entry',
      supportingDocuments: newJournal.supportingDocuments || []
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
      ],
      supportingDocuments: []
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

  const generateAiJournalEntry = async () => {
    if (!aiJournalEntry.description || !aiJournalEntry.explanation) {
      toast({
        title: "Missing Information",
        description: "Please provide both description and explanation",
        variant: "destructive"
      });
      return;
    }

    setAiJournalEntry(prev => ({ ...prev, isGenerating: true }));
    
    try {
      const response = await fetch('/api/trial-balance/2/2024-25/ai-journal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          description: aiJournalEntry.description,
          explanation: aiJournalEntry.explanation
        })
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        toast({
          title: "AI Journal Entry Generated",
          description: "Journal entry has been created successfully",
        });
        
        // Auto-fill the manual journal form with AI-generated entries
        setNewJournal({
          date: new Date().toISOString().split('T')[0],
          description: `${aiJournalEntry.description}\n\nDetailed Explanation: ${aiJournalEntry.explanation}\n\nAI Analysis: ${data.journalEntry.explanation}`,
          reference: 'AI Generated',
          entries: data.journalEntry.entries.map(entry => ({
            accountCode: entry.accountCode,
            accountName: entry.accountName,
            debit: entry.debit || 0,
            credit: entry.credit || 0
          })),
          supportingDocuments: aiJournalEntry.supportingDocuments || []
        });
        
        // Reset AI form
        setAiJournalEntry({
          description: '',
          explanation: '',
          isGenerating: false,
          supportingDocuments: []
        });
      } else {
        toast({
          title: "AI Generation Failed",
          description: data.message || "Failed to generate journal entry",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error generating AI journal entry:', error);
      toast({
        title: "AI Generation Failed",
        description: "Failed to generate journal entry",
        variant: "destructive"
      });
    } finally {
      setAiJournalEntry(prev => ({ ...prev, isGenerating: false }));
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
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader className="flex-shrink-0">
              <DialogTitle>Add Journal Entry</DialogTitle>
              <DialogDescription>
                Create manual adjustments to the trial balance or use AI to generate entries
              </DialogDescription>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto space-y-6 pr-2 pb-4">
              {/* AI Journal Entry Section */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-lg mb-3 text-blue-800">AI Journal Entry Generator</h3>
                <p className="text-sm text-blue-600 mb-4">
                  Describe your transaction and let AI create the proper accounting entries following UK standards.
                </p>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="ai-description">Transaction Description</Label>
                    <Input
                      id="ai-description"
                      value={aiJournalEntry.description}
                      onChange={(e) => setAiJournalEntry({...aiJournalEntry, description: e.target.value})}
                      placeholder="e.g., Paid £500 rent for office space"
                      className="h-12"
                    />
                  </div>
                  <div>
                    <Label htmlFor="ai-explanation">Detailed Explanation</Label>
                    <textarea
                      id="ai-explanation"
                      value={aiJournalEntry.explanation}
                      onChange={(e) => setAiJournalEntry({...aiJournalEntry, explanation: e.target.value})}
                      placeholder="e.g., Monthly rent payment for office premises at 123 Main St, paid via bank transfer on 13th July 2024. This is a recurring monthly expense for our main office location. Receipt attached for audit purposes."
                      className="w-full min-h-24 px-3 py-2 border border-input rounded-md bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-y"
                      rows={4}
                    />
                  </div>
                  <div>
                    <Label htmlFor="ai-documents">Supporting Documents (Optional)</Label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                      <input
                        type="file"
                        id="ai-documents"
                        multiple
                        accept=".pdf,.jpg,.jpeg,.png,.xlsx,.xls,.csv"
                        className="hidden"
                        onChange={(e) => {
                          const files = Array.from(e.target.files || []);
                          setAiJournalEntry({...aiJournalEntry, supportingDocuments: files});
                        }}
                      />
                      <label htmlFor="ai-documents" className="cursor-pointer">
                        <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">Click to upload supporting documents</p>
                        <p className="text-xs text-gray-500 mt-1">PDF, images, or spreadsheets</p>
                      </label>
                      {aiJournalEntry.supportingDocuments && aiJournalEntry.supportingDocuments.length > 0 && (
                        <div className="mt-3 text-left">
                          <p className="text-sm font-medium mb-2">Selected files:</p>
                          {aiJournalEntry.supportingDocuments.map((file, idx) => (
                            <div key={idx} className="flex items-center justify-between bg-gray-50 p-2 rounded text-sm">
                              <span>{file.name}</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  const newFiles = aiJournalEntry.supportingDocuments.filter((_, i) => i !== idx);
                                  setAiJournalEntry({...aiJournalEntry, supportingDocuments: newFiles});
                                }}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <Button 
                    onClick={generateAiJournalEntry}
                    disabled={aiJournalEntry.isGenerating}
                    className="w-full"
                  >
                    {aiJournalEntry.isGenerating ? 'Generating...' : 'Generate AI Journal Entry'}
                  </Button>
                </div>
              </div>

              {/* Manual Journal Entry Section */}
              <div className="border-t pt-4">
                <h3 className="font-semibold text-lg mb-3">Manual Journal Entry</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  <textarea
                    id="description"
                    value={newJournal.description}
                    onChange={(e) => setNewJournal({...newJournal, description: e.target.value})}
                    placeholder="e.g., Capital contributions by the two owners of £50 each. This represents initial capital investment into the business to fund startup costs and working capital requirements."
                    className="w-full min-h-16 px-3 py-2 border border-input rounded-md bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-y"
                    rows={3}
                  />
                </div>
                
                <div className="mt-4">
                  <Label htmlFor="manual-documents">Supporting Documents (Optional)</Label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 transition-colors">
                    <input
                      type="file"
                      id="manual-documents"
                      multiple
                      accept=".pdf,.jpg,.jpeg,.png,.xlsx,.xls,.csv"
                      className="hidden"
                      onChange={(e) => {
                        const files = Array.from(e.target.files || []);
                        setNewJournal({...newJournal, supportingDocuments: files});
                      }}
                    />
                    <label htmlFor="manual-documents" className="cursor-pointer">
                      <Paperclip className="h-6 w-6 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">Attach supporting documents</p>
                      <p className="text-xs text-gray-500 mt-1">Receipts, invoices, bank statements</p>
                    </label>
                    {newJournal.supportingDocuments && newJournal.supportingDocuments.length > 0 && (
                      <div className="mt-3 text-left">
                        <p className="text-sm font-medium mb-2">Attached files:</p>
                        {newJournal.supportingDocuments.map((file, idx) => (
                          <div key={idx} className="flex items-center justify-between bg-gray-50 p-2 rounded text-sm">
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-gray-500" />
                              <span>{file.name}</span>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const newFiles = newJournal.supportingDocuments.filter((_, i) => i !== idx);
                                setNewJournal({...newJournal, supportingDocuments: newFiles});
                              }}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
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
                    <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center bg-gray-50 p-3 rounded-lg">
                      <div className="md:col-span-2 space-y-1">
                        <Label className="text-xs text-gray-600">Account Code</Label>
                        <Select 
                          value={entry.accountCode} 
                          onValueChange={(value) => updateJournalLine(index, 'accountCode', value)}
                        >
                          <SelectTrigger className="h-10">
                            <SelectValue placeholder="Select Account" />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(ACCOUNT_CODES).map(([code, name]) => (
                              <SelectItem key={code} value={code}>{code} - {name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="md:col-span-4 space-y-1">
                        <Label className="text-xs text-gray-600">Account Name</Label>
                        <Input
                          placeholder="Account Name"
                          value={entry.accountName}
                          onChange={(e) => updateJournalLine(index, 'accountName', e.target.value)}
                          className="h-10"
                        />
                      </div>
                      <div className="md:col-span-2 space-y-1">
                        <Label className="text-xs text-gray-600">Debit (£)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={entry.debit || ''}
                          onChange={(e) => updateJournalLine(index, 'debit', parseFloat(e.target.value) || 0)}
                          className="h-10"
                        />
                      </div>
                      <div className="md:col-span-2 space-y-1">
                        <Label className="text-xs text-gray-600">Credit (£)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={entry.credit || ''}
                          onChange={(e) => updateJournalLine(index, 'credit', parseFloat(e.target.value) || 0)}
                          className="h-10"
                        />
                      </div>
                      <div className="md:col-span-2 space-y-1">
                        <Label className="text-xs text-gray-600">Actions</Label>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => removeJournalLine(index)}
                          disabled={newJournal.entries.length <= 2}
                          className="w-full h-10"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Remove
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-4 p-3 bg-muted rounded-lg">
                  <div className="flex flex-col sm:flex-row justify-between gap-2">
                    <span className="font-medium">Total Debits: £{journalDebits.toFixed(2)}</span>
                    <span className="font-medium">Total Credits: £{journalCredits.toFixed(2)}</span>
                    <span className={`font-semibold ${Math.abs(journalDebits - journalCredits) < 0.01 ? 'text-green-600' : 'text-red-600'}`}>
                      Difference: £{Math.abs(journalDebits - journalCredits).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4 border-t mt-6">
                <Button variant="outline" onClick={() => setShowJournalDialog(false)} className="w-full sm:w-auto">
                  Cancel
                </Button>
                <Button onClick={handleAddJournal} className="w-full sm:w-auto">
                  Save Journal Entry
                </Button>
              </div>
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
                      <TrialBalanceRow key={entry.id} entry={entry} onEditBreakdown={handleEditBreakdownItem} />
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
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-medium">{journal.reference}</h4>
                            <Badge variant="secondary" className="text-xs">
                              {journal.source === 'ai_generated' ? 'AI Generated' : 'Manual Entry'}
                            </Badge>
                          </div>
                          <div className="bg-gray-50 p-3 rounded-md mb-3">
                            <p className="text-sm text-gray-700 leading-relaxed">{journal.description}</p>
                          </div>
                          {journal.supportingDocuments && journal.supportingDocuments.length > 0 && (
                            <div className="mb-3">
                              <p className="text-xs text-gray-500 mb-1">Supporting Documents:</p>
                              <div className="flex flex-wrap gap-1">
                                {journal.supportingDocuments.map((doc, idx) => (
                                  <span key={idx} className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs">
                                    <FileText className="h-3 w-3" />
                                    {doc.name}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          {journal.aiExplanation && (
                            <div className="mb-3">
                              <p className="text-xs text-gray-500 mb-1">AI Explanation:</p>
                              <p className="text-xs text-gray-600 italic">{journal.aiExplanation}</p>
                            </div>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground ml-4">{journal.date}</div>
                      </div>
                      <div className="border-t pt-3">
                        <div className="grid grid-cols-1 gap-2">
                          {journal.entries.map((entry, index) => (
                            <div key={index} className="flex justify-between items-center bg-gray-50 p-2 rounded">
                              <span className="font-medium text-sm">{entry.accountCode} - {entry.accountName}</span>
                              <span className="font-mono text-sm">
                                {entry.debit > 0 ? `Dr £${entry.debit.toFixed(2)}` : `Cr £${entry.credit.toFixed(2)}`}
                              </span>
                            </div>
                          ))}
                        </div>
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
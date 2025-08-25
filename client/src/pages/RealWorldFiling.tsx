import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Upload, FileText, Calculator, CheckCircle2, AlertTriangle, Building, Receipt, FileSpreadsheet, Calendar, DollarSign, TrendingUp, Send } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

const RealWorldFiling = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("company-setup");
  const [progress, setProgress] = useState(10);
  const [filingData, setFilingData] = useState({
    companyName: "2 CIWT LIMITED",
    companyNumber: "15590153",
    filingType: "final_corporation_tax",
    accountingPeriod: "2024-03-24 to 2025-04-22",
    dissolutionDate: "2025-04-22",
    tradingCeased: "2025-04-22",
    sections: {
      companyInfo: {},
      profitAndLoss: {},
      balanceSheet: {},
      taxCalculation: {}
    }
  });

  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [duplicateFiles, setDuplicateFiles] = useState<{file: File, existingFile: string}[]>([]);
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
  const [aiProcessedData, setAiProcessedData] = useState({
    turnover: 0,
    otherIncome: 0,
    costOfSales: 0,
    administrativeExpenses: 0,
    professionalFees: 0,
    otherExpenses: 0,
    processedDocuments: 0,
    totalDocuments: 0
  });

  const [etbData, setEtbData] = useState<any>(null);

  // Load ETB data when component mounts
  useEffect(() => {
    const loadEtbData = () => {
      if (typeof window !== 'undefined') {
        const etbDataStored = localStorage.getItem('etbData');
        if (etbDataStored) {
          const parsedEtbData = JSON.parse(etbDataStored);
          setEtbData(parsedEtbData);
          
          // Use ETB final balances to populate forms
          if (parsedEtbData.finalBalances) {
            setAiProcessedData(prev => ({
              ...prev,
              turnover: parsedEtbData.finalBalances.revenue || 0,
              otherExpenses: parsedEtbData.finalBalances.expenses || 0,
              processedDocuments: parsedEtbData.trialBalance?.length || 0,
              totalDocuments: parsedEtbData.trialBalance?.length || 0
            }));
          }
        }
      }
    };
    
    loadEtbData();
  }, []);

  const checkForDuplicates = async (files: File[]) => {
    try {
      const response = await fetch('/api/documents');
      const existingDocs = await response.json();
      
      const duplicates = files.filter(file => 
        existingDocs.some((doc: any) => 
          doc.name === file.name && doc.size === file.size
        )
      );
      
      return duplicates.map(file => ({
        file,
        existingFile: existingDocs.find((doc: any) => doc.name === file.name && doc.size === file.size)?.id
      }));
    } catch (error) {
      console.error('Error checking duplicates:', error);
      return [];
    }
  };

  const fetchAiProcessedData = async () => {
    try {
      const response = await fetch('/api/tax-filings/1/2024-25/processed-data');
      const data = await response.json();
      setAiProcessedData(data);
    } catch (error) {
      console.error('Error fetching AI processed data:', error);
    }
  };

  const handleBulkUpload = async (files: File[], documentType: string) => {
    // Check for duplicates first
    const duplicates = await checkForDuplicates(files);
    
    if (duplicates.length > 0) {
      setDuplicateFiles(duplicates);
      setShowDuplicateDialog(true);
      return;
    }

    await processBulkUpload(files, documentType);
  };

  const processBulkUpload = async (files: File[], documentType: string) => {
    const uploadPromises = files.map(async (file) => {
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('documentType', documentType);
        formData.append('companyId', '1');
        formData.append('filingPeriod', '2024-25');
        
        const response = await fetch('/api/documents/upload', {
          method: 'POST',
          body: formData
        });
        
        if (response.ok) {
          const result = await response.json();
          return { success: true, file: file.name, result };
        } else {
          throw new Error(`Upload failed for ${file.name}`);
        }
      } catch (error) {
        return { success: false, file: file.name, error: error instanceof Error ? error.message : String(error) };
      }
    });

    const results = await Promise.all(uploadPromises);
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    if (successful.length > 0) {
      toast({
        title: "Bulk Upload Complete",
        description: `Successfully uploaded ${successful.length} files${failed.length > 0 ? `, ${failed.length} failed` : ''}`,
      });
    }

    if (failed.length > 0) {
      toast({
        title: "Some uploads failed",
        description: `Failed to upload: ${failed.map(f => f.file).join(', ')}`,
        variant: "destructive",
      });
    }

    return results;
  };

  const handleDuplicateResolution = async (action: 'skip' | 'replace', filesToProcess: File[], documentType: string) => {
    setShowDuplicateDialog(false);
    
    if (action === 'skip') {
      // Filter out duplicates and upload only new files
      const nonDuplicateFiles = filesToProcess.filter(file => 
        !duplicateFiles.some(dup => dup.file.name === file.name)
      );
      
      if (nonDuplicateFiles.length > 0) {
        await processBulkUpload(nonDuplicateFiles, documentType);
        toast({
          title: "Duplicates skipped",
          description: `Uploaded ${nonDuplicateFiles.length} new files, skipped ${duplicateFiles.length} duplicates.`,
        });
      } else {
        toast({
          title: "No new files to upload",
          description: "All selected files were duplicates and have been skipped.",
        });
      }
    } else {
      // Replace duplicates - first delete existing duplicates, then upload all files
      for (const duplicate of duplicateFiles) {
        try {
          await fetch(`/api/documents/${duplicate.existingFile}`, {
            method: 'DELETE'
          });
        } catch (error) {
          console.error('Error deleting duplicate:', error);
        }
      }
      
      await processBulkUpload(filesToProcess, documentType);
      toast({
        title: "Files replaced",
        description: `Replaced ${duplicateFiles.length} duplicate files and uploaded ${filesToProcess.length} files total.`,
      });
    }
    
    setDuplicateFiles([]);
  };

  const saveSectionMutation = useMutation({
    mutationFn: async (sectionData: any) => {
      console.log('Saving section data:', sectionData);
      const response = await fetch('/api/tax-filings/1/2024-25/section', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sectionData)
      });
      
      const result = await response.json();
      console.log('Save response:', result);
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to save section');
      }
      
      return result;
    },
    onSuccess: (data) => {
      console.log('Save successful:', data);
      toast({
        title: "Section saved",
        description: "Your progress has been saved successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['tax-filings'] });
    },
    onError: (error) => {
      console.error('Save error:', error);
      toast({
        title: "Save failed",
        description: error.message || "Failed to save section data",
        variant: "destructive"
      });
    }
  });

  const submitFilingMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('POST', '/api/tax-filings/1/2024-25/submit', {});
    },
    onSuccess: () => {
      toast({
        title: "Filing submitted",
        description: "Your corporation tax return has been submitted to HMRC",
      });
      setProgress(100);
    },
    onError: (error) => {
      toast({
        title: "Submission failed",
        description: "Failed to submit filing to HMRC",
        variant: "destructive"
      });
    }
  });

  const handleSaveSection = (sectionId: string, data: any) => {
    saveSectionMutation.mutate({ sectionId, data });
    setProgress(prev => Math.min(prev + 15, 90));
  };

  const handleFileUpload = async (file: File, documentType: string) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('documentType', documentType);
      formData.append('companyId', '1');
      formData.append('filingPeriod', '2024-25');
      
      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData
      });
      
      if (response.ok) {
        const result = await response.json();
        toast({
          title: "Document Uploaded",
          description: `${file.name} has been uploaded successfully.`,
        });
        
        // Update filing data to reflect uploaded document
        setFilingData(prev => ({
          ...prev,
          sections: {
            ...prev.sections,
            documents: {
              ...(prev.sections as any).documents || {},
              [documentType]: {
                filename: file.name,
                uploadedAt: new Date().toISOString(),
                status: 'uploaded'
              }
            }
          }
        }));
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload document",
        variant: "destructive",
      });
    }
  };

  const handleSubmitFiling = () => {
    submitFilingMutation.mutate();
  };

  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Real-World Filing: 2 CIWT Ltd</h1>
          <p className="text-muted-foreground mt-1">
            Final Corporation Tax Return for Dissolved Company
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-red-600">
            <AlertTriangle className="h-4 w-4 mr-1" />
            Dissolved Company
          </Badge>
          <Badge variant="secondary">
            <FileText className="h-4 w-4 mr-1" />
            CT600
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Progress Sidebar */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Filing Progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Overall Progress</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
              
              <Separator />
              
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Company Setup</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Document Upload</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 border-2 border-dashed border-gray-300 rounded-full" />
                  <span className="text-sm text-muted-foreground">Profit and Loss Account</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 border-2 border-dashed border-gray-300 rounded-full" />
                  <span className="text-sm text-muted-foreground">Balance Sheet</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 border-2 border-dashed border-gray-300 rounded-full" />
                  <span className="text-sm text-muted-foreground">Tax Calculation</span>
                </div>
              </div>

              <Separator />
              
              <div className="space-y-2">
                <div className="text-sm font-medium">Filing Details</div>
                <div className="text-xs text-muted-foreground space-y-1">
                  <div>Company: {filingData.companyNumber}</div>
                  <div>Type: Final CT600</div>
                  <div>Period: {filingData.accountingPeriod}</div>
                  <div>Dissolved: {filingData.dissolutionDate}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid grid-cols-5 w-full">
              <TabsTrigger value="company-setup">Company Setup</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
              <TabsTrigger value="income">Income Statement</TabsTrigger>
              <TabsTrigger value="balance">Balance Sheet</TabsTrigger>
              <TabsTrigger value="submit">Submit Filing</TabsTrigger>
            </TabsList>

            {/* Company Setup Tab */}
            <TabsContent value="company-setup" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="h-5 w-5" />
                    Company Information
                  </CardTitle>
                  <CardDescription>
                    Confirm company details for final corporation tax filing
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Special Case:</strong> This is a final corporation tax return for a dissolved company. 
                      HMRC requires this filing even though the company has been dissolved.
                    </AlertDescription>
                  </Alert>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="companyName">Company Name</Label>
                      <Input
                        id="companyName"
                        value={filingData.companyName}
                        onChange={(e) => setFilingData(prev => ({
                          ...prev,
                          companyName: e.target.value
                        }))}
                        disabled
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="companyNumber">Company Number</Label>
                      <Input
                        id="companyNumber"
                        value={filingData.companyNumber}
                        onChange={(e) => setFilingData(prev => ({
                          ...prev,
                          companyNumber: e.target.value
                        }))}
                        disabled
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="accountingPeriod">Accounting Period</Label>
                      <Input
                        id="accountingPeriod"
                        value={filingData.accountingPeriod}
                        onChange={(e) => setFilingData(prev => ({
                          ...prev,
                          accountingPeriod: e.target.value
                        }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dissolutionDate">Dissolution Date</Label>
                      <Input
                        id="dissolutionDate"
                        type="date"
                        value={filingData.dissolutionDate}
                        onChange={(e) => setFilingData(prev => ({
                          ...prev,
                          dissolutionDate: e.target.value
                        }))}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="filingReason">Reason for Filing</Label>
                    <Select value="final_return" onValueChange={() => {}}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select filing reason" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="final_return">Final return for dissolved company</SelectItem>
                        <SelectItem value="hmrc_request">HMRC compliance requirement</SelectItem>
                        <SelectItem value="cessation_return">Cessation of trade return</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="pt-4">
                    <Button 
                      onClick={() => {
                        handleSaveSection('companyInfo', filingData);
                        setActiveTab('documents');
                      }}
                      className="w-full"
                    >
                      Save & Continue to Documents
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Documents Tab */}
            <TabsContent value="documents" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Receipt className="h-5 w-5" />
                    Upload Supporting Documents
                  </CardTitle>
                  <CardDescription>
                    Upload bank statements, invoices, and receipts for the final accounting period
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="font-semibold text-lg text-green-600">Sales & Revenue Documents</h3>
                      <div className="grid grid-cols-1 gap-4">
                        <Card className="border-dashed border-2 hover:border-primary/50 transition-colors">
                          <CardContent className="p-6 text-center">
                            <FileSpreadsheet className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                            <h3 className="font-medium mb-1">Bank Statements</h3>
                            <p className="text-sm text-muted-foreground mb-3">
                              Upload final period bank statements
                            </p>
                            <Button variant="outline" size="sm" onClick={() => {
                              const input = document.createElement('input');
                              input.type = 'file';
                              input.accept = '.pdf,.csv,.xlsx,.xls';
                              input.onchange = (e) => {
                                const file = (e.target as HTMLInputElement).files?.[0];
                                if (file) {
                                  handleFileUpload(file, 'bank_statements');
                                }
                              };
                              input.click();
                            }}>
                              <Upload className="h-4 w-4 mr-2" />
                              Upload
                            </Button>
                          </CardContent>
                        </Card>

                        <Card className="border-dashed border-2 hover:border-primary/50 transition-colors">
                          <CardContent className="p-6 text-center">
                            <Receipt className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                            <h3 className="font-medium mb-1">Sales Invoices</h3>
                            <p className="text-sm text-muted-foreground mb-3">
                              Upload sales invoices and receipts (Multiple files)
                            </p>
                            <Button variant="outline" size="sm" onClick={() => {
                              const input = document.createElement('input');
                              input.type = 'file';
                              input.accept = '.pdf,.jpg,.jpeg,.png';
                              input.multiple = true;
                              input.onchange = (e) => {
                                const files = Array.from((e.target as HTMLInputElement).files || []);
                                if (files.length > 0) {
                                  setUploadedFiles(files);
                                  handleBulkUpload(files, 'sales_invoices');
                                }
                              };
                              input.click();
                            }}>
                              <Upload className="h-4 w-4 mr-2" />
                              Bulk Upload
                            </Button>
                          </CardContent>
                        </Card>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="font-semibold text-lg text-red-600">Purchase & Expense Documents</h3>
                      <div className="grid grid-cols-1 gap-4">
                        <Card className="border-dashed border-2 hover:border-primary/50 transition-colors">
                          <CardContent className="p-6 text-center">
                            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                            <h3 className="font-medium mb-1">Purchase Invoices</h3>
                            <p className="text-sm text-muted-foreground mb-3">
                              Upload supplier invoices and bills (Multiple files)
                            </p>
                            <Button variant="outline" size="sm" onClick={() => {
                              const input = document.createElement('input');
                              input.type = 'file';
                              input.accept = '.pdf,.jpg,.jpeg,.png';
                              input.multiple = true;
                              input.onchange = (e) => {
                                const files = Array.from((e.target as HTMLInputElement).files || []);
                                if (files.length > 0) {
                                  setUploadedFiles(files);
                                  handleBulkUpload(files, 'purchase_invoices');
                                }
                              };
                              input.click();
                            }}>
                              <Upload className="h-4 w-4 mr-2" />
                              Bulk Upload
                            </Button>
                          </CardContent>
                        </Card>

                        <Card className="border-dashed border-2 hover:border-primary/50 transition-colors">
                          <CardContent className="p-6 text-center">
                            <Receipt className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                            <h3 className="font-medium mb-1">Expense Receipts</h3>
                            <p className="text-sm text-muted-foreground mb-3">
                              Upload business expense receipts (Multiple files)
                            </p>
                            <Button variant="outline" size="sm" onClick={() => {
                              const input = document.createElement('input');
                              input.type = 'file';
                              input.accept = '.pdf,.jpg,.jpeg,.png';
                              input.multiple = true;
                              input.onchange = (e) => {
                                const files = Array.from((e.target as HTMLInputElement).files || []);
                                if (files.length > 0) {
                                  setUploadedFiles(files);
                                  handleBulkUpload(files, 'expense_receipts');
                                }
                              };
                              input.click();
                            }}>
                              <Upload className="h-4 w-4 mr-2" />
                              Bulk Upload
                            </Button>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  </div>

                  <Alert>
                    <FileText className="h-4 w-4" />
                    <AlertDescription>
                      <strong>AI Processing:</strong> Once uploaded, our AI will analyse your documents and automatically 
                      extract financial data for the profit and loss account and balance sheet. Duplicate files will be detected and you can choose to skip or replace them.
                    </AlertDescription>
                  </Alert>

                  <div className="pt-4">
                    <Button 
                      onClick={() => {
                        handleSaveSection('documents', { uploaded: true });
                        fetchAiProcessedData();
                        // Navigate to ETB instead of income tab
                        window.location.href = '/trial-balance';
                      }}
                      className="w-full"
                    >
                      Process Documents & Continue to Trial Balance
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Income Statement Tab */}
            <TabsContent value="income" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Profit and Loss (P&L)
                  </CardTitle>
                  <CardDescription>
                    Review and confirm turnover and expenses for the final trading period
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="font-medium text-green-600">Turnover</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span>Sales Turnover</span>
                          <Input 
                            className="w-32 text-right" 
                            placeholder="0.00" 
                            value={aiProcessedData.turnover > 0 ? aiProcessedData.turnover.toFixed(2) : ''}
                            onChange={(e) => setAiProcessedData({...aiProcessedData, turnover: parseFloat(e.target.value) || 0})}
                          />
                        </div>
                        <div className="flex justify-between">
                          <span>Other Income</span>
                          <Input 
                            className="w-32 text-right" 
                            placeholder="0.00" 
                            value={aiProcessedData.otherIncome > 0 ? aiProcessedData.otherIncome.toFixed(2) : ''}
                            onChange={(e) => setAiProcessedData({...aiProcessedData, otherIncome: parseFloat(e.target.value) || 0})}
                          />
                        </div>
                        <Separator />
                        <div className="flex justify-between font-medium">
                          <span>Total Turnover</span>
                          <span className="text-green-600">£{(aiProcessedData.turnover + aiProcessedData.otherIncome).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="font-medium text-red-600">Expenses</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span>Cost of Sales</span>
                          <Input 
                            className="w-32 text-right" 
                            placeholder="0.00" 
                            value={aiProcessedData.costOfSales > 0 ? aiProcessedData.costOfSales.toFixed(2) : ''}
                            onChange={(e) => setAiProcessedData({...aiProcessedData, costOfSales: parseFloat(e.target.value) || 0})}
                          />
                        </div>
                        <div className="flex justify-between">
                          <span>Administrative Expenses</span>
                          <Input 
                            className="w-32 text-right" 
                            placeholder="0.00" 
                            value={aiProcessedData.administrativeExpenses > 0 ? aiProcessedData.administrativeExpenses.toFixed(2) : ''}
                            onChange={(e) => setAiProcessedData({...aiProcessedData, administrativeExpenses: parseFloat(e.target.value) || 0})}
                          />
                        </div>
                        <div className="flex justify-between">
                          <span>Professional Fees</span>
                          <Input 
                            className="w-32 text-right" 
                            placeholder="0.00" 
                            value={aiProcessedData.professionalFees > 0 ? aiProcessedData.professionalFees.toFixed(2) : ''}
                            onChange={(e) => setAiProcessedData({...aiProcessedData, professionalFees: parseFloat(e.target.value) || 0})}
                          />
                        </div>
                        <div className="flex justify-between">
                          <span>Other Expenses</span>
                          <Input 
                            className="w-32 text-right" 
                            placeholder="0.00" 
                            value={aiProcessedData.otherExpenses > 0 ? aiProcessedData.otherExpenses.toFixed(2) : ''}
                            onChange={(e) => setAiProcessedData({...aiProcessedData, otherExpenses: parseFloat(e.target.value) || 0})}
                          />
                        </div>
                        <Separator />
                        <div className="flex justify-between font-medium">
                          <span>Total Expenses</span>
                          <span className="text-red-600">£{(aiProcessedData.costOfSales + aiProcessedData.administrativeExpenses + aiProcessedData.professionalFees + aiProcessedData.otherExpenses).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Card className="bg-muted/50">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Net Profit/(Loss)</span>
                        <span className="text-lg font-bold">
                          £{((aiProcessedData.turnover + aiProcessedData.otherIncome) - (aiProcessedData.costOfSales + aiProcessedData.administrativeExpenses + aiProcessedData.professionalFees + aiProcessedData.otherExpenses)).toFixed(2)}
                        </span>
                      </div>
                    </CardContent>
                  </Card>

                  {aiProcessedData.processedDocuments > 0 && (
                    <Alert>
                      <CheckCircle2 className="h-4 w-4" />
                      <AlertDescription>
                        <strong>{etbData ? 'Extended Trial Balance Complete' : 'AI Processing Complete'}:</strong> 
                        {etbData 
                          ? `Trial balance with ${etbData.trialBalance?.length || 0} account entries and ${etbData.journalEntries?.length || 0} journal adjustments has been processed.`
                          : `We've analysed ${aiProcessedData.processedDocuments} of your {aiProcessedData.totalDocuments} uploaded documents and automatically populated the financial data above.`
                        } You can review and adjust the figures if needed.
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="pt-4">
                    <Button 
                      onClick={() => {
                        handleSaveSection('profitAndLoss', { netProfit: 0 });
                        setActiveTab('balance');
                      }}
                      className="w-full"
                    >
                      Save Profit & Loss & Continue
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Balance Sheet Tab */}
            <TabsContent value="balance" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calculator className="h-5 w-5" />
                    Balance Sheet
                  </CardTitle>
                  <CardDescription>
                    Final balance sheet as at the dissolution date
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Dissolved Company:</strong> All assets should be at nil value and liabilities settled 
                      or transferred before dissolution.
                    </AlertDescription>
                  </Alert>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="font-medium">Assets</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span>Fixed Assets</span>
                          <Input className="w-32 text-right" placeholder="0.00" />
                        </div>
                        <div className="flex justify-between">
                          <span>Current Assets</span>
                          <Input className="w-32 text-right" placeholder="0.00" />
                        </div>
                        <div className="flex justify-between">
                          <span>Cash at Bank</span>
                          <Input className="w-32 text-right" placeholder="0.00" />
                        </div>
                        <Separator />
                        <div className="flex justify-between font-medium">
                          <span>Total Assets</span>
                          <span>£0.00</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="font-medium">Liabilities</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span>Current Liabilities</span>
                          <Input className="w-32 text-right" placeholder="0.00" />
                        </div>
                        <div className="flex justify-between">
                          <span>Long-term Liabilities</span>
                          <Input className="w-32 text-right" placeholder="0.00" />
                        </div>
                        <Separator />
                        <div className="flex justify-between font-medium">
                          <span>Total Liabilities</span>
                          <span>£0.00</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between font-medium">
                          <span>Net Assets</span>
                          <span>£0.00</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4">
                    <Button 
                      onClick={() => {
                        handleSaveSection('balanceSheet', { netAssets: 0 });
                        setActiveTab('submit');
                      }}
                      className="w-full"
                    >
                      Save Balance Sheet & Continue
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Submit Tab */}
            <TabsContent value="submit" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5" />
                    Submit Final Corporation Tax Return
                  </CardTitle>
                  <CardDescription>
                    Review and submit your final CT600 return to HMRC
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <Alert>
                    <CheckCircle2 className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Filing Summary:</strong> Final corporation tax return for dissolved company 
                      2 CIWT LIMITED (15590153) for period ending 22 April 2025.
                    </AlertDescription>
                  </Alert>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card className="bg-muted/50">
                      <CardContent className="p-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">£0.00</div>
                          <div className="text-sm text-muted-foreground">Corporation Tax Due</div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-muted/50">
                      <CardContent className="p-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold">£0.00</div>
                          <div className="text-sm text-muted-foreground">Taxable Profit</div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-medium">Filing Checklist</h3>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <span className="text-sm">Company information confirmed</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <span className="text-sm">Supporting documents uploaded</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <span className="text-sm">Income statement completed</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <span className="text-sm">Balance sheet completed</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4">
                    <Button 
                      onClick={handleSubmitFiling}
                      className="w-full"
                      disabled={submitFilingMutation.isPending}
                    >
                      {submitFilingMutation.isPending ? (
                        "Submitting to HMRC..."
                      ) : (
                        "Submit Final CT600 Return"
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Duplicate Files Dialog */}
      <Dialog open={showDuplicateDialog} onOpenChange={setShowDuplicateDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Duplicate Files Detected</DialogTitle>
            <DialogDescription>
              The following files already exist in your uploads:
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-2">
              {duplicateFiles.map((dup, index) => (
                <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded">
                  <FileText className="h-4 w-4" />
                  <span className="text-sm">{dup.file.name}</span>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                const originalFiles = uploadedFiles.filter(file => 
                  !duplicateFiles.some(dup => dup.file.name === file.name)
                );
                handleDuplicateResolution('skip', originalFiles, 'mixed');
              }}
            >
              Skip Duplicates ({duplicateFiles.length})
            </Button>
            <Button 
              onClick={() => {
                handleDuplicateResolution('replace', uploadedFiles, 'mixed');
              }}
            >
              Replace Existing ({duplicateFiles.length})
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RealWorldFiling;
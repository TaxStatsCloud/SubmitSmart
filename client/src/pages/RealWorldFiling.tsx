import { useState } from "react";
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
import { Upload, FileText, Calculator, CheckCircle2, AlertTriangle, Building, Receipt, FileSpreadsheet, Calendar, DollarSign } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
      incomeStatement: {},
      balanceSheet: {},
      taxCalculation: {}
    }
  });

  const saveSectionMutation = useMutation({
    mutationFn: async (sectionData: any) => {
      return apiRequest('POST', '/api/tax-filings/1/2024-25/section', sectionData);
    },
    onSuccess: () => {
      toast({
        title: "Section saved",
        description: "Your progress has been saved successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['tax-filings'] });
    },
    onError: (error) => {
      toast({
        title: "Save failed",
        description: "Failed to save section data",
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
                  <span className="text-sm text-muted-foreground">Income Statement</span>
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
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="border-dashed border-2 hover:border-primary/50 transition-colors">
                      <CardContent className="p-6 text-center">
                        <FileSpreadsheet className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                        <h3 className="font-medium mb-1">Bank Statements</h3>
                        <p className="text-sm text-muted-foreground mb-3">
                          Upload final period bank statements
                        </p>
                        <Button variant="outline" size="sm">
                          <Upload className="h-4 w-4 mr-2" />
                          Upload
                        </Button>
                      </CardContent>
                    </Card>

                    <Card className="border-dashed border-2 hover:border-primary/50 transition-colors">
                      <CardContent className="p-6 text-center">
                        <Receipt className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                        <h3 className="font-medium mb-1">Invoices</h3>
                        <p className="text-sm text-muted-foreground mb-3">
                          Upload sales invoices and receipts
                        </p>
                        <Button variant="outline" size="sm">
                          <Upload className="h-4 w-4 mr-2" />
                          Upload
                        </Button>
                      </CardContent>
                    </Card>

                    <Card className="border-dashed border-2 hover:border-primary/50 transition-colors">
                      <CardContent className="p-6 text-center">
                        <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                        <h3 className="font-medium mb-1">Receipts</h3>
                        <p className="text-sm text-muted-foreground mb-3">
                          Upload business expense receipts
                        </p>
                        <Button variant="outline" size="sm">
                          <Upload className="h-4 w-4 mr-2" />
                          Upload
                        </Button>
                      </CardContent>
                    </Card>
                  </div>

                  <Alert>
                    <FileText className="h-4 w-4" />
                    <AlertDescription>
                      <strong>AI Processing:</strong> Once uploaded, our AI will analyze your documents and automatically 
                      extract financial data for the income statement and balance sheet.
                    </AlertDescription>
                  </Alert>

                  <div className="pt-4">
                    <Button 
                      onClick={() => {
                        handleSaveSection('documents', { uploaded: true });
                        setActiveTab('income');
                      }}
                      className="w-full"
                    >
                      Process Documents & Continue
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
                    <DollarSign className="h-5 w-5" />
                    Income Statement (P&L)
                  </CardTitle>
                  <CardDescription>
                    Review and confirm income and expenses for the final trading period
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="font-medium text-green-600">Income</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span>Sales Revenue</span>
                          <Input className="w-32 text-right" placeholder="0.00" />
                        </div>
                        <div className="flex justify-between">
                          <span>Other Income</span>
                          <Input className="w-32 text-right" placeholder="0.00" />
                        </div>
                        <Separator />
                        <div className="flex justify-between font-medium">
                          <span>Total Income</span>
                          <span className="text-green-600">£0.00</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="font-medium text-red-600">Expenses</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span>Cost of Sales</span>
                          <Input className="w-32 text-right" placeholder="0.00" />
                        </div>
                        <div className="flex justify-between">
                          <span>Administrative Expenses</span>
                          <Input className="w-32 text-right" placeholder="0.00" />
                        </div>
                        <div className="flex justify-between">
                          <span>Professional Fees</span>
                          <Input className="w-32 text-right" placeholder="0.00" />
                        </div>
                        <div className="flex justify-between">
                          <span>Other Expenses</span>
                          <Input className="w-32 text-right" placeholder="0.00" />
                        </div>
                        <Separator />
                        <div className="flex justify-between font-medium">
                          <span>Total Expenses</span>
                          <span className="text-red-600">£0.00</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Card className="bg-muted/50">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Net Profit/(Loss)</span>
                        <span className="text-lg font-bold">£0.00</span>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="pt-4">
                    <Button 
                      onClick={() => {
                        handleSaveSection('incomeStatement', { netProfit: 0 });
                        setActiveTab('balance');
                      }}
                      className="w-full"
                    >
                      Save Income Statement & Continue
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
                    Final balance sheet as at dissolution date
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
    </div>
  );
};

export default RealWorldFiling;
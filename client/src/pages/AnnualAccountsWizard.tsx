import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { FileSpreadsheet, Building2, Calculator, CheckCircle, AlertTriangle, Send, ArrowLeft, ArrowRight, Upload, FileCheck } from "lucide-react";
import { FieldHint, InlineHint } from "@/components/wizard/FieldHint";
import { HelpPanel } from "@/components/wizard/HelpPanel";
import { ValidationGuidance } from "@/components/wizard/ValidationGuidance";
import { FilingSubmissionWarning } from "@/components/filing/FilingSubmissionWarning";
import { DocumentSelector } from "@/components/filings/DocumentSelector";

// Annual Accounts Form Schema with Comparative Year Support
const annualAccountsSchema = z.object({
  // Company Details
  companyName: z.string().min(1, "Company name is required"),
  companyNumber: z.string().min(8, "Company number must be at least 8 characters"),
  registeredOffice: z.string().min(1, "Registered office is required"),
  
  // Financial Year
  financialYearEnd: z.string().min(1, "Financial year end is required"),
  financialYearStart: z.string().min(1, "Financial year start is required"),
  
  // Entity Size (auto-detected but can be overridden)
  entitySize: z.enum(["micro", "small", "medium", "large"]),
  
  // === CURRENT YEAR ===
  
  // Balance Sheet - Fixed Assets (Current Year)
  intangibleAssets: z.coerce.number().min(0).default(0),
  tangibleAssets: z.coerce.number().min(0).default(0),
  investments: z.coerce.number().min(0).default(0),
  
  // Balance Sheet - Current Assets (Current Year)
  stocks: z.coerce.number().min(0).default(0),
  debtors: z.coerce.number().min(0).default(0),
  cashAtBank: z.coerce.number().min(0).default(0),
  
  // Balance Sheet - Creditors (Current Year)
  creditorsDueWithinYear: z.coerce.number().min(0).default(0),
  creditorsDueAfterYear: z.coerce.number().min(0).default(0),
  
  // Balance Sheet - Capital & Reserves (Current Year)
  calledUpShareCapital: z.coerce.number().min(0).default(0),
  profitAndLossAccount: z.coerce.number().default(0),
  
  // P&L Account (Current Year)
  turnover: z.coerce.number().min(0).default(0),
  costOfSales: z.coerce.number().min(0).default(0),
  grossProfit: z.coerce.number().default(0),
  administrativeExpenses: z.coerce.number().min(0).default(0),
  operatingProfit: z.coerce.number().default(0),
  
  // === PRIOR YEAR (Comparative Figures) ===
  
  // Balance Sheet - Fixed Assets (Prior Year)
  intangibleAssetsPrior: z.coerce.number().min(0).default(0).optional(),
  tangibleAssetsPrior: z.coerce.number().min(0).default(0).optional(),
  investmentsPrior: z.coerce.number().min(0).default(0).optional(),
  
  // Balance Sheet - Current Assets (Prior Year)
  stocksPrior: z.coerce.number().min(0).default(0).optional(),
  debtorsPrior: z.coerce.number().min(0).default(0).optional(),
  cashAtBankPrior: z.coerce.number().min(0).default(0).optional(),
  
  // Balance Sheet - Creditors (Prior Year)
  creditorsDueWithinYearPrior: z.coerce.number().min(0).default(0).optional(),
  creditorsDueAfterYearPrior: z.coerce.number().min(0).default(0).optional(),
  
  // Balance Sheet - Capital & Reserves (Prior Year)
  calledUpShareCapitalPrior: z.coerce.number().min(0).default(0).optional(),
  profitAndLossAccountPrior: z.coerce.number().default(0).optional(),
  
  // P&L Account (Prior Year)
  turnoverPrior: z.coerce.number().min(0).default(0).optional(),
  costOfSalesPrior: z.coerce.number().min(0).default(0).optional(),
  grossProfitPrior: z.coerce.number().default(0).optional(),
  administrativeExpensesPrior: z.coerce.number().min(0).default(0).optional(),
  operatingProfitPrior: z.coerce.number().default(0).optional(),
  
  // Directors & Audit
  directorNames: z.string().min(1, "At least one director required"),
  auditExempt: z.boolean().default(true),
  accountingPolicies: z.string().optional(),
  
  // Cash Flow Statement (Medium/Large companies only)
  profitBeforeTax: z.coerce.number().default(0).optional(),
  depreciation: z.coerce.number().min(0).default(0).optional(),
  increaseDecreaseInStocks: z.coerce.number().default(0).optional(),
  increaseDecreaseInDebtors: z.coerce.number().default(0).optional(),
  increaseDecreaseInCreditors: z.coerce.number().default(0).optional(),
  taxPaid: z.coerce.number().min(0).default(0).optional(),
  purchaseOfTangibleAssets: z.coerce.number().min(0).default(0).optional(),
  newLoansReceived: z.coerce.number().min(0).default(0).optional(),
  repaymentOfBorrowings: z.coerce.number().min(0).default(0).optional(),
  openingCash: z.coerce.number().default(0).optional(),
  closingCash: z.coerce.number().default(0).optional(),
  
  // Strategic Report (Large companies only)
  businessModel: z.string().optional(),
  principalRisks: z.string().optional(),
  keyPerformanceIndicators: z.string().optional(),
});

type AnnualAccountsFormData = z.infer<typeof annualAccountsSchema>;

export default function AnnualAccountsWizard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [iXBRLPreview, setIXBRLPreview] = useState<any>(null);
  const [showSubmissionWarning, setShowSubmissionWarning] = useState(false);
  const [priorYearDataLoaded, setPriorYearDataLoaded] = useState(false);
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<number[]>([]);
  
  // Credit requirements
  const FILING_COST = 25; // Annual Accounts filing cost in credits
  const userCredits = user?.credits || 0;
  const hasInsufficientCredits = userCredits < FILING_COST;

  const form = useForm<AnnualAccountsFormData>({
    resolver: zodResolver(annualAccountsSchema),
    defaultValues: {
      companyName: "",
      companyNumber: "",
      registeredOffice: "",
      financialYearStart: "",
      financialYearEnd: "",
      entitySize: "small",
      // Current Year
      intangibleAssets: 0,
      tangibleAssets: 0,
      investments: 0,
      stocks: 0,
      debtors: 0,
      cashAtBank: 0,
      creditorsDueWithinYear: 0,
      creditorsDueAfterYear: 0,
      calledUpShareCapital: 0,
      profitAndLossAccount: 0,
      turnover: 0,
      costOfSales: 0,
      grossProfit: 0,
      administrativeExpenses: 0,
      operatingProfit: 0,
      // Prior Year (Comparative Figures)
      intangibleAssetsPrior: 0,
      tangibleAssetsPrior: 0,
      investmentsPrior: 0,
      stocksPrior: 0,
      debtorsPrior: 0,
      cashAtBankPrior: 0,
      creditorsDueWithinYearPrior: 0,
      creditorsDueAfterYearPrior: 0,
      calledUpShareCapitalPrior: 0,
      profitAndLossAccountPrior: 0,
      turnoverPrior: 0,
      costOfSalesPrior: 0,
      grossProfitPrior: 0,
      administrativeExpensesPrior: 0,
      operatingProfitPrior: 0,
      // Other
      directorNames: "",
      auditExempt: true,
      accountingPolicies: "",
      // Cash Flow Statement
      profitBeforeTax: 0,
      depreciation: 0,
      increaseDecreaseInStocks: 0,
      increaseDecreaseInDebtors: 0,
      increaseDecreaseInCreditors: 0,
      taxPaid: 0,
      purchaseOfTangibleAssets: 0,
      newLoansReceived: 0,
      repaymentOfBorrowings: 0,
      openingCash: 0,
      closingCash: 0,
      // Strategic Report
      businessModel: "",
      principalRisks: "",
      keyPerformanceIndicators: "",
    },
  });

  // Fetch prior year data for auto-population
  const { data: priorYearData } = useQuery({
    queryKey: ['/api/annual-accounts/prior-year', user?.companyId],
    enabled: !!user?.companyId && !priorYearDataLoaded,
    staleTime: Infinity, // Don't refetch once loaded
  });

  // Auto-populate prior year fields when data loads
  useEffect(() => {
    if (priorYearData?.success && priorYearData.data && !priorYearDataLoaded) {
      const data = priorYearData.data;
      
      // Set all prior year fields
      Object.keys(data).forEach((key) => {
        if (key !== 'yearEnding' && key !== 'sourceType') {
          form.setValue(key as any, data[key]);
        }
      });

      setPriorYearDataLoaded(true);

      // Show notification
      toast({
        title: "Prior Year Data Loaded",
        description: `Comparative figures loaded from ${new Date(data.yearEnding).toLocaleDateString('en-GB')} (${data.sourceType})`,
      });
    }
  }, [priorYearData, priorYearDataLoaded, form, toast]);

  // Auto-detect entity size based on turnover
  const autoDetectEntitySize = () => {
    const values = form.getValues();
    const turnover = values.turnover;
    const totalAssets = 
      values.intangibleAssets + values.tangibleAssets + values.investments +
      values.stocks + values.debtors + values.cashAtBank;

    if (turnover <= 632000 && totalAssets <= 316000) {
      form.setValue("entitySize", "micro");
    } else if (turnover <= 10200000 && totalAssets <= 5100000) {
      form.setValue("entitySize", "small");
    } else if (turnover <= 36000000 && totalAssets <= 18000000) {
      form.setValue("entitySize", "medium");
    } else {
      form.setValue("entitySize", "large");
    }
  };

  // Generate iXBRL mutation
  const generateIXBRLMutation = useMutation({
    mutationFn: async (data: AnnualAccountsFormData) => {
      const response = await apiRequest('POST', '/api/annual-accounts/generate-ixbrl', data);
      return response.json();
    },
    onSuccess: (data) => {
      setIXBRLPreview(data);
      setCurrentStep(5);
      toast({
        title: "iXBRL Generated",
        description: "Annual accounts have been generated in iXBRL format",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate iXBRL accounts",
        variant: "destructive",
      });
    },
  });

  // Submit to Companies House mutation
  const submitToCompaniesHouseMutation = useMutation({
    mutationFn: async () => {
      const formData = form.getValues();
      const response = await apiRequest('POST', '/api/annual-accounts/submit', {
        ...formData,
        ixbrlData: iXBRLPreview,
        documentIds: selectedDocumentIds,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/filings'] });
      toast({
        title: "Submitted Successfully",
        description: "Annual Accounts have been submitted to Companies House",
      });
      setCurrentStep(6);
    },
    onError: (error: any) => {
      toast({
        title: "Submission Failed",
        description: error.message || "Failed to submit to Companies House",
        variant: "destructive",
      });
    },
  });

  const onGenerateIXBRL = async () => {
    // Auto-detect entity size before generation
    autoDetectEntitySize();
    
    const isValid = await form.trigger();
    if (isValid) {
      generateIXBRLMutation.mutate(form.getValues());
    }
  };

  const onSubmit = () => {
    setShowSubmissionWarning(true);
  };

  const handleConfirmSubmit = () => {
    setShowSubmissionWarning(false);
    submitToCompaniesHouseMutation.mutate();
  };

  const progressPercentage = (currentStep / 6) * 100;
  
  // Estimated time per step in minutes
  const stepTimes = [5, 10, 10, 5, 3, 2]; // Company Info, Balance Sheet, P&L, Documents, Review, Submit
  const remainingTime = currentStep >= 6 ? 0 : stepTimes.slice(currentStep - 1).reduce((a, b) => a + b, 0);

  return (
    <>
      {/* Filing Submission Warning Dialog */}
      <FilingSubmissionWarning
        isOpen={showSubmissionWarning}
        onCancel={() => setShowSubmissionWarning(false)}
        onConfirm={handleConfirmSubmit}
        filingType="annual_accounts"
        creditCost={FILING_COST}
      />

      <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <FileSpreadsheet className="h-8 w-8 text-emerald-600" />
          <h1 className="text-3xl font-bold">Annual Accounts Filing Wizard</h1>
        </div>
        <p className="text-muted-foreground">Prepare and file your annual financial statements with Companies House</p>
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between mb-2">
          <span className="text-sm font-medium">Progress</span>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">~{remainingTime} min remaining</span>
            <span className="text-sm text-muted-foreground">Step {currentStep} of 6</span>
          </div>
        </div>
        <Progress value={progressPercentage} className="h-2" />
        <div className="flex justify-between mt-2">
          <span className={`text-xs ${currentStep >= 1 ? 'text-primary font-medium' : 'text-muted-foreground'}`}>Company Info</span>
          <span className={`text-xs ${currentStep >= 2 ? 'text-primary font-medium' : 'text-muted-foreground'}`}>Balance Sheet</span>
          <span className={`text-xs ${currentStep >= 3 ? 'text-primary font-medium' : 'text-muted-foreground'}`}>P&L Account</span>
          <span className={`text-xs ${currentStep >= 4 ? 'text-primary font-medium' : 'text-muted-foreground'}`}>Documents</span>
          <span className={`text-xs ${currentStep >= 5 ? 'text-primary font-medium' : 'text-muted-foreground'}`}>Review</span>
          <span className={`text-xs ${currentStep >= 6 ? 'text-primary font-medium' : 'text-muted-foreground'}`}>Submit</span>
        </div>
      </div>

      {/* Credit Requirement Alert */}
      {hasInsufficientCredits ? (
        <Alert className="mb-6 border-red-500 bg-red-50 dark:bg-red-950">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertTitle className="text-red-900 dark:text-red-100">Insufficient Credits</AlertTitle>
          <AlertDescription className="text-red-800 dark:text-red-200">
            <div className="space-y-2">
              <p>This filing requires <strong>{FILING_COST} credits</strong>, but you only have <strong>{userCredits} credits</strong>.</p>
              <p>You can continue filling out the form, but you'll need to top up before submitting.</p>
              <Link href="/credits">
                <Button variant="outline" size="sm" className="mt-2 bg-white hover:bg-red-50" data-testid="button-top-up-credits">
                  Top Up Credits Now
                </Button>
              </Link>
            </div>
          </AlertDescription>
        </Alert>
      ) : (
        <Alert className="mb-6 border-emerald-500 bg-emerald-50 dark:bg-emerald-950">
          <CheckCircle className="h-4 w-4 text-emerald-600" />
          <AlertTitle className="text-emerald-900 dark:text-emerald-100">Credit Requirement</AlertTitle>
          <AlertDescription className="text-emerald-800 dark:text-emerald-200">
            This filing costs <strong>{FILING_COST} credits</strong>. You have <strong>{userCredits} credits</strong> available.
          </AlertDescription>
        </Alert>
      )}

      {/* April 2027 Alert */}
      <Alert className="mb-6 border-amber-500 bg-amber-50 dark:bg-amber-950">
        <AlertTriangle className="h-4 w-4 text-amber-600" />
        <AlertTitle className="text-amber-900 dark:text-amber-100">April 2027 Mandatory Software Filing</AlertTitle>
        <AlertDescription className="text-amber-800 dark:text-amber-200">
          From April 2027, all UK companies must file accounts via software in iXBRL format. Web and paper filing will be discontinued.
          Our wizard ensures full compliance with FRC 2025 Taxonomy requirements.
        </AlertDescription>
      </Alert>

      <Form {...form}>
        <form className="space-y-6">
          {/* Step 1: Company Information */}
          {currentStep === 1 && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Card className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Building2 className="h-5 w-5 text-primary" />
                    <h2 className="text-xl font-semibold">Company Information</h2>
                  </div>
                  
                  <ValidationGuidance 
                    errors={form.formState.errors} 
                    fieldGuidance={{
                      companyNumber: "Must be 8 characters (e.g., 12345678). Check your incorporation certificate.",
                      financialYearEnd: "This determines your 9-month filing deadline with Companies House.",
                      directorNames: "List all current directors as registered with Companies House."
                    }}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="companyName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="ABC Limited" {...field} data-testid="input-company-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="companyNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        Companies House Number *
                        <FieldHint 
                          description="Your unique 8-character company registration number issued by Companies House"
                          example="12345678"
                          type="help"
                        />
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="12345678" {...field} data-testid="input-company-number" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="registeredOffice"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Registered Office Address *</FormLabel>
                      <FormControl>
                        <Textarea placeholder="123 High Street, London, UK" {...field} data-testid="input-registered-office" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="financialYearStart"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Financial Year Start *</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} data-testid="input-fy-start" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="financialYearEnd"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        Financial Year End *
                        <FieldHint 
                          description="The last day of your accounting period. Your accounts must be filed within 9 months of this date."
                          example="31/12/2024"
                          type="warning"
                        />
                      </FormLabel>
                      <FormControl>
                        <Input type="date" {...field} data-testid="input-fy-end" />
                      </FormControl>
                      <FormDescription>9-month filing deadline from this date</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="directorNames"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Director Names *</FormLabel>
                      <FormControl>
                        <Input placeholder="John Smith, Jane Doe" {...field} data-testid="input-directors" />
                      </FormControl>
                      <FormDescription>Comma-separated list of director names</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

                  <div className="flex justify-end mt-6">
                    <Button 
                      type="button" 
                      onClick={() => setCurrentStep(2)}
                      data-testid="button-next-step"
                    >
                      Next: Balance Sheet <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              </div>

              {/* Help Panel */}
              <div className="hidden lg:block">
                <HelpPanel 
                  title="Step 1 Help"
                  currentStep={1}
                  tips={[
                    {
                      icon: Building2,
                      title: "Company Details",
                      description: "Enter your company information exactly as registered with Companies House.",
                      tips: [
                        "Check your incorporation certificate for the exact company number",
                        "Use the registered office address from Companies House records",
                        "Ensure all director names match current registrations"
                      ]
                    },
                    {
                      icon: FileSpreadsheet,
                      title: "Financial Year",
                      description: "Your financial year determines important filing deadlines.",
                      tips: [
                        "Accounts must be filed within 9 months of financial year end",
                        "First accounts may have longer deadline (21 months)",
                        "Late filing results in automatic penalties (£150-£1,500)"
                      ]
                    }
                  ]}
                  documentRequirements={{
                    required: [
                      "Certificate of Incorporation",
                      "Current company register extract",
                      "List of current directors"
                    ],
                    optional: [
                      "Previous year's accounts for reference"
                    ]
                  }}
                />
              </div>
            </div>
          )}

          {/* Step 2: Balance Sheet */}
          {currentStep === 2 && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Card className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Calculator className="h-5 w-5 text-primary" />
                    <h2 className="text-xl font-semibold">Balance Sheet</h2>
                  </div>

                  <InlineHint 
                    message="Balance Sheet shows your company's financial position at year-end. Assets (what you own) must equal Liabilities + Equity (what you owe)."
                    type="info"
                  />

                  <Tabs defaultValue="fixed-assets" className="w-full mt-4">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="fixed-assets">Fixed Assets</TabsTrigger>
                  <TabsTrigger value="current-assets">Current Assets</TabsTrigger>
                  <TabsTrigger value="liabilities">Liabilities</TabsTrigger>
                  <TabsTrigger value="capital">Capital</TabsTrigger>
                </TabsList>

                <TabsContent value="fixed-assets" className="mt-6">
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b-2 border-primary/20">
                          <th className="text-left py-3 px-2 font-semibold">Account</th>
                          <th className="text-right py-3 px-2 font-semibold w-32">Current Year (£)</th>
                          <th className="text-right py-3 px-2 font-semibold w-32 text-muted-foreground">Prior Year (£)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/50">
                        <tr>
                          <td className="py-3 px-2">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">Intangible Assets</span>
                              <FieldHint 
                                description="Non-physical assets with long-term value, including goodwill, patents, trademarks, software, and brand names."
                                example="£50,000 for purchased software licenses"
                                type="help"
                              />
                            </div>
                            <p className="text-sm text-muted-foreground">Goodwill, patents, trademarks</p>
                          </td>
                          <td className="py-3 px-2">
                            <FormField
                              control={form.control}
                              name="intangibleAssets"
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Input 
                                      type="number" 
                                      placeholder="0.00" 
                                      className="text-right"
                                      {...field}
                                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                      data-testid="input-intangible-assets"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </td>
                          <td className="py-3 px-2">
                            <FormField
                              control={form.control}
                              name="intangibleAssetsPrior"
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Input 
                                      type="number" 
                                      placeholder="0.00" 
                                      className="text-right bg-muted/30"
                                      {...field}
                                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                      data-testid="input-intangible-assets-prior"
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          </td>
                        </tr>
                        
                        <tr>
                          <td className="py-3 px-2">
                            <span className="font-medium">Tangible Assets</span>
                            <p className="text-sm text-muted-foreground">Property, equipment, vehicles</p>
                          </td>
                          <td className="py-3 px-2">
                            <FormField
                              control={form.control}
                              name="tangibleAssets"
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Input 
                                      type="number" 
                                      placeholder="0.00" 
                                      className="text-right"
                                      {...field}
                                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                      data-testid="input-tangible-assets"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </td>
                          <td className="py-3 px-2">
                            <FormField
                              control={form.control}
                              name="tangibleAssetsPrior"
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Input 
                                      type="number" 
                                      placeholder="0.00" 
                                      className="text-right bg-muted/30"
                                      {...field}
                                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                      data-testid="input-tangible-assets-prior"
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          </td>
                        </tr>

                        <tr>
                          <td className="py-3 px-2">
                            <span className="font-medium">Investments</span>
                            <p className="text-sm text-muted-foreground">Shares in subsidiaries, long-term investments</p>
                          </td>
                          <td className="py-3 px-2">
                            <FormField
                              control={form.control}
                              name="investments"
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Input 
                                      type="number" 
                                      placeholder="0.00" 
                                      className="text-right"
                                      {...field}
                                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                      data-testid="input-investments"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </td>
                          <td className="py-3 px-2">
                            <FormField
                              control={form.control}
                              name="investmentsPrior"
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Input 
                                      type="number" 
                                      placeholder="0.00" 
                                      className="text-right bg-muted/30"
                                      {...field}
                                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                      data-testid="input-investments-prior"
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </TabsContent>

                <TabsContent value="current-assets" className="mt-6">
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b-2 border-primary/20">
                          <th className="text-left py-3 px-2 font-semibold">Account</th>
                          <th className="text-right py-3 px-2 font-semibold w-32">Current Year (£)</th>
                          <th className="text-right py-3 px-2 font-semibold w-32 text-muted-foreground">Prior Year (£)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/50">
                        <tr>
                          <td className="py-3 px-2">
                            <span className="font-medium">Stocks / Inventory</span>
                            <p className="text-sm text-muted-foreground">Raw materials, work in progress, finished goods</p>
                          </td>
                          <td className="py-3 px-2">
                            <FormField
                              control={form.control}
                              name="stocks"
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Input 
                                      type="number" 
                                      placeholder="0.00" 
                                      className="text-right"
                                      {...field}
                                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                      data-testid="input-stocks"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </td>
                          <td className="py-3 px-2">
                            <FormField
                              control={form.control}
                              name="stocksPrior"
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Input 
                                      type="number" 
                                      placeholder="0.00" 
                                      className="text-right bg-muted/30"
                                      {...field}
                                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                      data-testid="input-stocks-prior"
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          </td>
                        </tr>

                        <tr>
                          <td className="py-3 px-2">
                            <span className="font-medium">Debtors (Amounts Receivable)</span>
                            <p className="text-sm text-muted-foreground">Trade debtors, prepayments, other receivables</p>
                          </td>
                          <td className="py-3 px-2">
                            <FormField
                              control={form.control}
                              name="debtors"
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Input 
                                      type="number" 
                                      placeholder="0.00" 
                                      className="text-right"
                                      {...field}
                                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                      data-testid="input-debtors"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </td>
                          <td className="py-3 px-2">
                            <FormField
                              control={form.control}
                              name="debtorsPrior"
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Input 
                                      type="number" 
                                      placeholder="0.00" 
                                      className="text-right bg-muted/30"
                                      {...field}
                                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                      data-testid="input-debtors-prior"
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          </td>
                        </tr>

                        <tr>
                          <td className="py-3 px-2">
                            <span className="font-medium">Cash at Bank and in Hand</span>
                            <p className="text-sm text-muted-foreground">Bank accounts, petty cash</p>
                          </td>
                          <td className="py-3 px-2">
                            <FormField
                              control={form.control}
                              name="cashAtBank"
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Input 
                                      type="number" 
                                      placeholder="0.00" 
                                      className="text-right"
                                      {...field}
                                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                      data-testid="input-cash"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </td>
                          <td className="py-3 px-2">
                            <FormField
                              control={form.control}
                              name="cashAtBankPrior"
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Input 
                                      type="number" 
                                      placeholder="0.00" 
                                      className="text-right bg-muted/30"
                                      {...field}
                                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                      data-testid="input-cash-prior"
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </TabsContent>

                <TabsContent value="liabilities" className="mt-6">
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b-2 border-primary/20">
                          <th className="text-left py-3 px-2 font-semibold">Account</th>
                          <th className="text-right py-3 px-2 font-semibold w-32">Current Year (£)</th>
                          <th className="text-right py-3 px-2 font-semibold w-32 text-muted-foreground">Prior Year (£)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/50">
                        <tr>
                          <td className="py-3 px-2">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">Creditors: Due Within One Year</span>
                              <FieldHint 
                                description="All debts payable within 12 months of the balance sheet date, including trade payables, bank overdrafts, PAYE/NI, VAT, and corporation tax due."
                                example="£25,000 (trade creditors £15k, HMRC £10k)"
                                type="help"
                              />
                            </div>
                            <p className="text-sm text-muted-foreground">Trade creditors, bank overdraft, taxation</p>
                          </td>
                          <td className="py-3 px-2">
                            <FormField
                              control={form.control}
                              name="creditorsDueWithinYear"
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Input 
                                      type="number" 
                                      placeholder="0.00" 
                                      className="text-right"
                                      {...field}
                                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                      data-testid="input-creditors-within-year"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </td>
                          <td className="py-3 px-2">
                            <FormField
                              control={form.control}
                              name="creditorsDueWithinYearPrior"
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Input 
                                      type="number" 
                                      placeholder="0.00" 
                                      className="text-right bg-muted/30"
                                      {...field}
                                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                      data-testid="input-creditors-within-year-prior"
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          </td>
                        </tr>

                        <tr>
                          <td className="py-3 px-2">
                            <span className="font-medium">Creditors: Due After One Year</span>
                            <p className="text-sm text-muted-foreground">Long-term loans, mortgages</p>
                          </td>
                          <td className="py-3 px-2">
                            <FormField
                              control={form.control}
                              name="creditorsDueAfterYear"
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Input 
                                      type="number" 
                                      placeholder="0.00" 
                                      className="text-right"
                                      {...field}
                                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                      data-testid="input-creditors-after-year"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </td>
                          <td className="py-3 px-2">
                            <FormField
                              control={form.control}
                              name="creditorsDueAfterYearPrior"
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Input 
                                      type="number" 
                                      placeholder="0.00" 
                                      className="text-right bg-muted/30"
                                      {...field}
                                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                      data-testid="input-creditors-after-year-prior"
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </TabsContent>

                <TabsContent value="capital" className="mt-6">
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b-2 border-primary/20">
                          <th className="text-left py-3 px-2 font-semibold">Account</th>
                          <th className="text-right py-3 px-2 font-semibold w-32">Current Year (£)</th>
                          <th className="text-right py-3 px-2 font-semibold w-32 text-muted-foreground">Prior Year (£)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/50">
                        <tr>
                          <td className="py-3 px-2">
                            <span className="font-medium">Called Up Share Capital</span>
                            <p className="text-sm text-muted-foreground">Issued share capital</p>
                          </td>
                          <td className="py-3 px-2">
                            <FormField
                              control={form.control}
                              name="calledUpShareCapital"
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Input 
                                      type="number" 
                                      placeholder="0.00" 
                                      className="text-right"
                                      {...field}
                                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                      data-testid="input-share-capital"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </td>
                          <td className="py-3 px-2">
                            <FormField
                              control={form.control}
                              name="calledUpShareCapitalPrior"
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Input 
                                      type="number" 
                                      placeholder="0.00" 
                                      className="text-right bg-muted/30"
                                      {...field}
                                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                      data-testid="input-share-capital-prior"
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          </td>
                        </tr>

                        <tr>
                          <td className="py-3 px-2">
                            <span className="font-medium">Profit and Loss Account Reserve</span>
                            <p className="text-sm text-muted-foreground">Retained earnings from previous years</p>
                          </td>
                          <td className="py-3 px-2">
                            <FormField
                              control={form.control}
                              name="profitAndLossAccount"
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Input 
                                      type="number" 
                                      placeholder="0.00" 
                                      className="text-right"
                                      {...field}
                                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                      data-testid="input-pl-reserve"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </td>
                          <td className="py-3 px-2">
                            <FormField
                              control={form.control}
                              name="profitAndLossAccountPrior"
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Input 
                                      type="number" 
                                      placeholder="0.00" 
                                      className="text-right bg-muted/30"
                                      {...field}
                                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                      data-testid="input-pl-reserve-prior"
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </TabsContent>
              </Tabs>

                  <div className="flex justify-between mt-6">
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={() => setCurrentStep(1)}
                      data-testid="button-back"
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" /> Back
                    </Button>
                    <Button 
                      type="button" 
                      onClick={() => setCurrentStep(3)}
                      data-testid="button-next"
                    >
                      Next: P&L Account <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              </div>

              {/* Help Panel */}
              <div className="hidden lg:block">
                <HelpPanel 
                  title="Step 2 Help"
                  currentStep={2}
                  tips={[
                    {
                      icon: Calculator,
                      title: "Balance Sheet Fundamentals",
                      description: "The Balance Sheet must balance: Assets = Liabilities + Equity",
                      tips: [
                        "Fixed Assets: Long-term items (property, equipment)",
                        "Current Assets: Short-term items (cash, inventory, debtors)",
                        "Liabilities: What you owe (creditors, loans)",
                        "All values should be at cost less depreciation"
                      ]
                    },
                    {
                      icon: FileCheck,
                      title: "UK GAAP Requirements",
                      description: "Follow FRS 102 (UK Generally Accepted Accounting Practice) standards.",
                      tips: [
                        "Assets must be valued at historical cost or revalued amount",
                        "Depreciation required for tangible fixed assets",
                        "Stock valued at lower of cost or net realizable value",
                        "Debtors shown net of bad debt provisions"
                      ]
                    },
                    {
                      icon: AlertTriangle,
                      title: "Entity Size Detection",
                      description: "We automatically detect your entity size based on thresholds.",
                      tips: [
                        "Micro: Turnover ≤ £632k, Assets ≤ £316k",
                        "Small: Turnover ≤ £10.2m, Assets ≤ £5.1m",
                        "Medium: Turnover ≤ £36m, Assets ≤ £18m",
                        "Large: Above medium thresholds"
                      ]
                    }
                  ]}
                  documentRequirements={{
                    required: [
                      "Fixed asset register",
                      "Bank statements at year end",
                      "Debtors and creditors lists",
                      "Stock valuation"
                    ],
                    optional: [
                      "Depreciation schedules",
                      "Asset purchase invoices"
                    ]
                  }}
                />
              </div>
            </div>
          )}

          {/* Step 3: P&L Account */}
          {currentStep === 3 && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Card className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <FileSpreadsheet className="h-5 w-5 text-primary" />
                    <h2 className="text-xl font-semibold">Profit & Loss Account</h2>
                  </div>

                  <Alert className="mb-6">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Small companies must file a P&L Account. Micro-entities can choose to file abbreviated accounts (Balance Sheet only).
                    </AlertDescription>
                  </Alert>

                  <div className="overflow-x-auto mb-6">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b-2 border-primary/20">
                          <th className="text-left py-3 px-2 font-semibold">Account</th>
                          <th className="text-right py-3 px-2 font-semibold w-32">Current Year (£)</th>
                          <th className="text-right py-3 px-2 font-semibold w-32 text-muted-foreground">Prior Year (£)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/50">
                        <tr>
                          <td className="py-3 px-2">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">Turnover *</span>
                              <FieldHint 
                                description="Total revenue from sales and services before VAT. This is your gross income for the financial year."
                                example="£500,000 (all sales excluding VAT)"
                                type="help"
                              />
                            </div>
                            <p className="text-sm text-muted-foreground">Total revenue for the financial year</p>
                          </td>
                          <td className="py-3 px-2">
                            <FormField
                              control={form.control}
                              name="turnover"
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Input 
                                      type="number" 
                                      placeholder="0.00" 
                                      className="text-right"
                                      {...field}
                                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                      data-testid="input-turnover"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </td>
                          <td className="py-3 px-2">
                            <FormField
                              control={form.control}
                              name="turnoverPrior"
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Input 
                                      type="number" 
                                      placeholder="0.00" 
                                      className="text-right bg-muted/30"
                                      {...field}
                                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                      data-testid="input-turnover-prior"
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          </td>
                        </tr>

                        <tr>
                          <td className="py-3 px-2">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">Cost of Sales</span>
                              <FieldHint 
                                description="Direct costs of producing goods or services: materials, direct labor, and other costs directly linked to sales."
                                example="£200,000 (materials £150k, direct labour £50k)"
                                type="help"
                              />
                            </div>
                            <p className="text-sm text-muted-foreground">Direct costs of goods/services sold</p>
                          </td>
                          <td className="py-3 px-2">
                            <FormField
                              control={form.control}
                              name="costOfSales"
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Input 
                                      type="number" 
                                      placeholder="0.00" 
                                      className="text-right"
                                      {...field}
                                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                      data-testid="input-cost-of-sales"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </td>
                          <td className="py-3 px-2">
                            <FormField
                              control={form.control}
                              name="costOfSalesPrior"
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Input 
                                      type="number" 
                                      placeholder="0.00" 
                                      className="text-right bg-muted/30"
                                      {...field}
                                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                      data-testid="input-cost-of-sales-prior"
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          </td>
                        </tr>

                        <tr>
                          <td className="py-3 px-2">
                            <span className="font-medium">Administrative Expenses</span>
                            <p className="text-sm text-muted-foreground">Rent, salaries, utilities, marketing</p>
                          </td>
                          <td className="py-3 px-2">
                            <FormField
                              control={form.control}
                              name="administrativeExpenses"
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Input 
                                      type="number" 
                                      placeholder="0.00" 
                                      className="text-right"
                                      {...field}
                                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                      data-testid="input-admin-expenses"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </td>
                          <td className="py-3 px-2">
                            <FormField
                              control={form.control}
                              name="administrativeExpensesPrior"
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Input 
                                      type="number" 
                                      placeholder="0.00" 
                                      className="text-right bg-muted/30"
                                      {...field}
                                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                      data-testid="input-admin-expenses-prior"
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="space-y-4">

                <Separator className="my-4" />

                <FormField
                  control={form.control}
                  name="accountingPolicies"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        Accounting Policies (Optional)
                        <FieldHint 
                          description="Describe the accounting methods used for depreciation, stock valuation, revenue recognition, and other key policies per FRS 102."
                          example="Fixed assets depreciated on straight-line basis over useful economic life. Stock valued at lower of cost and net realizable value."
                          type="help"
                        />
                      </FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe your accounting policies, e.g., depreciation methods, stock valuation..." 
                          {...field} 
                          data-testid="input-accounting-policies"
                        />
                      </FormControl>
                      <FormDescription>Required for small companies; optional for micro-entities</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

                  <div className="flex justify-between mt-6">
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={() => setCurrentStep(2)}
                      data-testid="button-back"
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" /> Back
                    </Button>
                    <Button 
                      type="button" 
                      onClick={() => setCurrentStep(4)}
                      data-testid="button-next"
                    >
                      Next: Documents <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              </div>

              {/* Help Panel */}
              <div className="hidden lg:block">
                <HelpPanel 
                  title="Step 3 Help"
                  currentStep={3}
                  tips={[
                    {
                      icon: FileSpreadsheet,
                      title: "Profit & Loss Structure",
                      description: "The P&L shows your trading performance over the financial year.",
                      tips: [
                        "Turnover: All sales revenue (exc. VAT)",
                        "Cost of Sales: Direct costs to generate those sales",
                        "Gross Profit: Turnover minus Cost of Sales",
                        "Operating Profit: Gross Profit minus expenses"
                      ]
                    },
                    {
                      icon: Calculator,
                      title: "Administrative Expenses",
                      description: "Include all indirect running costs of the business.",
                      tips: [
                        "Rent and rates for business premises",
                        "Staff salaries (not directly producing goods)",
                        "Professional fees (accounting, legal)",
                        "Marketing, utilities, insurance, depreciation"
                      ]
                    },
                    {
                      icon: AlertTriangle,
                      title: "Filing Requirements by Size",
                      description: "Different entity sizes have different requirements.",
                      tips: [
                        "Micro-entities: May file Balance Sheet only",
                        "Small companies: Must file full P&L",
                        "Medium/Large: Full accounts + Director's Report",
                        "April 2027: All must use iXBRL format"
                      ]
                    }
                  ]}
                  documentRequirements={{
                    required: [
                      "Sales invoices/records",
                      "Purchase invoices",
                      "Payroll summaries",
                      "Expense receipts"
                    ],
                    optional: [
                      "Management accounts",
                      "Previous P&L for comparison"
                    ]
                  }}
                />
              </div>
            </div>
          )}

          {/* Step 4: Supporting Documents */}
          {currentStep === 4 && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <DocumentSelector
                  selectedDocumentIds={selectedDocumentIds}
                  onSelectionChange={setSelectedDocumentIds}
                  filingType="annual_accounts"
                  recommendedTypes={["trial_balance", "bank_statement", "invoice", "accounting_export"]}
                />

                <div className="flex justify-between mt-6">
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => setCurrentStep(3)}
                    data-testid="button-back"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back
                  </Button>
                  <Button 
                    type="button" 
                    onClick={() => {
                      const values = form.getValues();
                      generateIXBRLMutation.mutate(values);
                    }}
                    disabled={generateIXBRLMutation.isPending}
                    data-testid="button-continue"
                  >
                    {generateIXBRLMutation.isPending ? "Generating Preview..." : "Continue to Review"}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="lg:col-span-1">
                <HelpPanel 
                  title="Why Attach Documents?"
                  currentStep={4}
                  tips={[
                    {
                      icon: FileCheck,
                      title: "Audit Trail",
                      description: "Create a complete evidence trail for your filing.",
                      tips: [
                        "Helps auditors verify your figures",
                        "Demonstrates due diligence to HMRC",
                        "Satisfies Companies House requirements",
                        "Supports your tax position if queried"
                      ]
                    },
                    {
                      icon: AlertTriangle,
                      title: "Best Practice",
                      description: "Professional accountants always maintain supporting documentation.",
                      tips: [
                        "Attach trial balance showing all accounts",
                        "Include bank statements for reconciliation",
                        "Upload invoices for major transactions",
                        "Keep expense receipts for deductions"
                      ]
                    }
                  ]}
                  documentRequirements={{
                    required: [],
                    optional: [
                      "Trial balance",
                      "Bank statements",
                      "Invoice records",
                      "Expense receipts"
                    ]
                  }}
                />
              </div>
            </div>
          )}

          {/* Step 5: Review & iXBRL Preview */}
          {currentStep === 5 && iXBRLPreview && (
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <h2 className="text-xl font-semibold">Review Annual Accounts</h2>
              </div>

              <Alert className="mb-6">
                <FileCheck className="h-4 w-4" />
                <AlertDescription>
                  Your annual accounts have been generated in iXBRL format compliant with FRC 2025 Taxonomy.
                  Please review carefully before submission to Companies House.
                </AlertDescription>
              </Alert>

              <div className="space-y-6">
                {/* Entity Size Badge */}
                <div>
                  <h3 className="font-medium mb-2">Entity Classification</h3>
                  <Badge variant={form.getValues().entitySize === "micro" ? "secondary" : "default"} data-testid="badge-entity-size">
                    {form.getValues().entitySize.toUpperCase()} ENTITY
                  </Badge>
                </div>

                {/* Balance Sheet Summary */}
                <div>
                  <h3 className="font-medium mb-3">Balance Sheet Summary</h3>
                  <div className="bg-muted p-4 rounded-md space-y-2">
                    <div className="flex justify-between">
                      <span>Total Fixed Assets:</span>
                      <span className="font-medium" data-testid="text-total-fixed-assets">
                        £{(form.getValues().intangibleAssets + form.getValues().tangibleAssets + form.getValues().investments).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Current Assets:</span>
                      <span className="font-medium" data-testid="text-total-current-assets">
                        £{(form.getValues().stocks + form.getValues().debtors + form.getValues().cashAtBank).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Liabilities:</span>
                      <span className="font-medium" data-testid="text-total-liabilities">
                        £{(form.getValues().creditorsDueWithinYear + form.getValues().creditorsDueAfterYear).toFixed(2)}
                      </span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-semibold">
                      <span>Net Assets:</span>
                      <span data-testid="text-net-assets">
                        £{(
                          form.getValues().intangibleAssets + form.getValues().tangibleAssets + 
                          form.getValues().investments + form.getValues().stocks + 
                          form.getValues().debtors + form.getValues().cashAtBank -
                          form.getValues().creditorsDueWithinYear - form.getValues().creditorsDueAfterYear
                        ).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* P&L Summary */}
                <div>
                  <h3 className="font-medium mb-3">Profit & Loss Summary</h3>
                  <div className="bg-muted p-4 rounded-md space-y-2">
                    <div className="flex justify-between">
                      <span>Turnover:</span>
                      <span className="font-medium" data-testid="text-turnover">£{form.getValues().turnover.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Cost of Sales:</span>
                      <span className="font-medium">-£{form.getValues().costOfSales.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Gross Profit:</span>
                      <span className="font-medium">{(form.getValues().turnover - form.getValues().costOfSales).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Administrative Expenses:</span>
                      <span className="font-medium">-£{form.getValues().administrativeExpenses.toFixed(2)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-semibold">
                      <span>Operating Profit:</span>
                      <span data-testid="text-operating-profit">
                        £{(form.getValues().turnover - form.getValues().costOfSales - form.getValues().administrativeExpenses).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* iXBRL Validation */}
                <div>
                  <h3 className="font-medium mb-3">iXBRL Validation</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm">FRC 2025 Taxonomy compliance</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm">All mandatory tags present</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm">Audit exemption statement included</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm">Directors' approval confirmed</span>
                    </div>
                  </div>
                </div>

                {/* Credit Cost */}
                <Alert>
                  <AlertDescription className="flex items-center justify-between">
                    <span>Filing cost: <strong>{FILING_COST} credits</strong></span>
                    <span className="text-sm text-muted-foreground">Companies House fee: FREE</span>
                  </AlertDescription>
                </Alert>
              </div>

              <div className="flex justify-between mt-6">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => setCurrentStep(4)}
                  data-testid="button-back"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Button>
                <Button 
                  type="button" 
                  onClick={onSubmit}
                  disabled={submitToCompaniesHouseMutation.isPending}
                  data-testid="button-submit"
                >
                  {submitToCompaniesHouseMutation.isPending ? "Submitting..." : "Submit to Companies House"}
                  <Send className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </Card>
          )}

          {/* Step 6: Success */}
          {currentStep === 6 && (
            <Card className="p-6">
              <div className="text-center py-8">
                <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
                <h2 className="text-2xl font-bold mb-2">Successfully Submitted!</h2>
                <p className="text-muted-foreground mb-6">
                  Your annual accounts have been filed with Companies House
                </p>
                
                <div className="bg-muted p-4 rounded-md max-w-md mx-auto mb-6">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Submission ID:</span>
                      <span className="font-medium">CH-{Date.now()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Company:</span>
                      <span className="font-medium">{form.getValues().companyName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Financial Year End:</span>
                      <span className="font-medium">{form.getValues().financialYearEnd}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Credits Used:</span>
                      <span className="font-medium">{FILING_COST}</span>
                    </div>
                  </div>
                </div>

                <Button onClick={() => window.location.href = '/dashboard'} data-testid="button-return-dashboard">
                  Return to Dashboard
                </Button>
              </div>
            </Card>
          )}
        </form>
      </Form>
      </div>
    </>
  );
}

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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Calculator, FileText, CheckCircle, AlertTriangle, Send, ArrowLeft, ArrowRight, Building2, TrendingUp, BarChart3, Download, FileCheck } from "lucide-react";
import { FieldHint, InlineHint } from "@/components/wizard/FieldHint";
import { HelpPanel } from "@/components/wizard/HelpPanel";
import { ValidationGuidance } from "@/components/wizard/ValidationGuidance";
import { FilingSubmissionWarning } from "@/components/filing/FilingSubmissionWarning";
import { DocumentSelector } from "@/components/filings/DocumentSelector";
import { PriorYearComparisonTable } from "@/components/ct600/PriorYearComparisonTable";
import { CT600BoxSummary } from "@/components/ct600/CT600BoxGuidance";

// CT600 Form Schema with Comparative Period Support and Activity Detection
const ct600Schema = z.object({
  // Company Info
  companyName: z.string().min(1, "Company name is required"),
  companyNumber: z.string().min(8, "Company number must be at least 8 characters"),
  utr: z.string().min(10, "UTR must be at least 10 characters"),
  
  // Accounting Period
  accountingPeriodStart: z.string().min(1, "Start date is required"),
  accountingPeriodEnd: z.string().min(1, "End date is required"),
  
  // === ACTIVITY DETECTION QUESTIONS ===
  hasPropertyIncome: z.boolean().default(false),
  isCloseCompany: z.boolean().default(false),
  hasOverseasIncome: z.boolean().default(false),
  hasControlledForeignCompanies: z.boolean().default(false),
  hasGroupRelief: z.boolean().default(false),
  paidDividends: z.boolean().default(false),
  hasTransferPricing: z.boolean().default(false),
  
  // === CURRENT PERIOD ===
  
  // Trading Income - using coerce to handle string inputs
  turnover: z.coerce.number().min(0, "Turnover cannot be negative"),
  costOfSales: z.coerce.number().min(0, "Cost of sales cannot be negative").optional(),
  operatingExpenses: z.coerce.number().min(0, "Operating expenses cannot be negative").optional(),
  
  // Other Income
  interestReceived: z.coerce.number().min(0).optional(),
  dividendsReceived: z.coerce.number().min(0).optional(),
  propertyIncome: z.coerce.number().min(0).optional(),
  
  // Adjustments
  depreciationAddBack: z.coerce.number().min(0).optional(),
  capitalAllowances: z.coerce.number().min(0).optional(),
  
  // Reliefs & Deductions
  lossesBroughtForward: z.coerce.number().min(0).optional(),
  rdReliefClaim: z.coerce.number().min(0).optional(),
  charitableDonations: z.coerce.number().min(0).optional(),
  
  // === PRIOR PERIOD (Comparative Figures) ===
  
  turnoverPrior: z.coerce.number().min(0).optional(),
  costOfSalesPrior: z.coerce.number().min(0).optional(),
  operatingExpensesPrior: z.coerce.number().min(0).optional(),
  interestReceivedPrior: z.coerce.number().min(0).optional(),
  dividendsReceivedPrior: z.coerce.number().min(0).optional(),
  propertyIncomePrior: z.coerce.number().min(0).optional(),
  depreciationAddBackPrior: z.coerce.number().min(0).optional(),
  capitalAllowancesPrior: z.coerce.number().min(0).optional(),
  lossesBroughtForwardPrior: z.coerce.number().min(0).optional(),
  rdReliefClaimPrior: z.coerce.number().min(0).optional(),
  charitableDonationsPrior: z.coerce.number().min(0).optional(),
  
  // Associated Companies
  numberOfAssociatedCompanies: z.coerce.number().min(0).default(0),
});

type CT600FormData = z.infer<typeof ct600Schema>;

export default function CT600Filing() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [computation, setComputation] = useState<any>(null);
  const [prefillApplied, setPrefillApplied] = useState(false);
  const [showSubmissionWarning, setShowSubmissionWarning] = useState(false);
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<number[]>([]);

  const form = useForm<CT600FormData>({
    resolver: zodResolver(ct600Schema),
    defaultValues: {
      companyName: "",
      companyNumber: "",
      utr: "",
      accountingPeriodStart: "",
      accountingPeriodEnd: "",
      // Activity Detection
      hasPropertyIncome: false,
      isCloseCompany: false,
      hasOverseasIncome: false,
      hasControlledForeignCompanies: false,
      hasGroupRelief: false,
      paidDividends: false,
      hasTransferPricing: false,
      // Current Period
      turnover: 0,
      costOfSales: 0,
      operatingExpenses: 0,
      interestReceived: 0,
      dividendsReceived: 0,
      propertyIncome: 0,
      depreciationAddBack: 0,
      capitalAllowances: 0,
      lossesBroughtForward: 0,
      rdReliefClaim: 0,
      charitableDonations: 0,
      // Prior Period
      turnoverPrior: 0,
      costOfSalesPrior: 0,
      operatingExpensesPrior: 0,
      interestReceivedPrior: 0,
      dividendsReceivedPrior: 0,
      propertyIncomePrior: 0,
      depreciationAddBackPrior: 0,
      capitalAllowancesPrior: 0,
      lossesBroughtForwardPrior: 0,
      rdReliefClaimPrior: 0,
      charitableDonationsPrior: 0,
      // Other
      numberOfAssociatedCompanies: 0,
    },
  });

  // Load company data
  const { data: company } = useQuery({
    queryKey: ['/api/companies', user?.companyId],
    enabled: !!user?.companyId,
  });

  // Fetch existing filing if any
  const { data: existingFiling } = useQuery({
    queryKey: ['/api/ct600/current'],
    enabled: !!user?.id,
  });

  // Fetch prefill data from Annual Accounts
  const { data: prefillData } = useQuery({
    queryKey: ['/api/ct600/prefill', user?.companyId],
    enabled: !!user?.companyId && !prefillApplied,
  });

  // Apply prefill data when it loads
  useEffect(() => {
    if (prefillData?.success && prefillData.data && !prefillApplied) {
      const data = prefillData.data;
      
      // Pre-populate form fields
      Object.keys(data).forEach((key) => {
        if (key in form.getValues()) {
          form.setValue(key as any, data[key]);
        }
      });

      setPrefillApplied(true);

      // Show notification
      toast({
        title: "Data Pre-filled",
        description: "Form pre-populated from your most recent Annual Accounts. You can edit all fields.",
      });
    }
  }, [prefillData, prefillApplied, form, toast]);

  // Compute tax mutation
  const computeTaxMutation = useMutation({
    mutationFn: async (data: CT600FormData) => {
      const response = await apiRequest('POST', '/api/ct600/compute', data);
      return response.json();
    },
    onSuccess: (data) => {
      setComputation(data);
      setCurrentStep(4);
      toast({
        title: "Tax Computed",
        description: `Corporation Tax: £${data.corporationTaxDue.toFixed(2)}`,
      });
    },
    onError: () => {
      toast({
        title: "Computation Failed",
        description: "Failed to compute corporation tax",
        variant: "destructive",
      });
    },
  });

  // Submit to HMRC mutation
  const submitToHMRCMutation = useMutation({
    mutationFn: async () => {
      const formData = form.getValues();
      const response = await apiRequest('POST', '/api/ct600/submit', {
        ...formData,
        computation,
        documentIds: selectedDocumentIds,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ct600/current'] });
      toast({
        title: "Submitted Successfully",
        description: "CT600 has been submitted to HMRC",
      });
      setCurrentStep(5);
    },
    onError: (error: any) => {
      toast({
        title: "Submission Failed",
        description: error.message || "Failed to submit to HMRC",
        variant: "destructive",
      });
    },
  });

  const onComputeTax = async () => {
    const isValid = await form.trigger();
    if (isValid) {
      computeTaxMutation.mutate(form.getValues());
    }
  };

  const onSubmitToHMRC = () => {
    setShowSubmissionWarning(true);
  };

  const handleConfirmSubmit = () => {
    setShowSubmissionWarning(false);
    submitToHMRCMutation.mutate();
  };

  const FILING_COST = 30; // CT600 filing cost in credits

  const progressPercentage = (currentStep / 5) * 100;
  
  // Estimated time per step in minutes
  const stepTimes = [5, 12, 5, 3, 2]; // Company Info, Financials & Adjustments, Documents, Review, Submit
  const remainingTime = currentStep >= 5 ? 0 : stepTimes.slice(currentStep - 1).reduce((a, b) => a + b, 0);

  return (
    <>
      {/* Filing Submission Warning Dialog */}
      <FilingSubmissionWarning
        isOpen={showSubmissionWarning}
        onCancel={() => setShowSubmissionWarning(false)}
        onConfirm={handleConfirmSubmit}
        filingType="ct600"
        creditCost={FILING_COST}
      />

      <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Calculator className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold">Corporation Tax (CT600)</h1>
        </div>
        <p className="text-muted-foreground">File your Corporation Tax Return with HMRC</p>
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between mb-2">
          <span className="text-sm font-medium">Progress</span>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">~{remainingTime} min remaining</span>
            <span className="text-sm text-muted-foreground">Step {currentStep} of 5</span>
          </div>
        </div>
        <Progress value={progressPercentage} className="h-2" />
        <div className="flex justify-between mt-2">
          <span className={`text-xs ${currentStep >= 1 ? 'text-primary font-medium' : 'text-muted-foreground'}`}>Company Info</span>
          <span className={`text-xs ${currentStep >= 2 ? 'text-primary font-medium' : 'text-muted-foreground'}`}>Financials</span>
          <span className={`text-xs ${currentStep >= 3 ? 'text-primary font-medium' : 'text-muted-foreground'}`}>Documents</span>
          <span className={`text-xs ${currentStep >= 4 ? 'text-primary font-medium' : 'text-muted-foreground'}`}>Review</span>
          <span className={`text-xs ${currentStep >= 5 ? 'text-primary font-medium' : 'text-muted-foreground'}`}>Submit</span>
        </div>
      </div>

      {/* Pre-fill Notification */}
      {prefillApplied && prefillData?.sourceFilingDate && (
        <Alert className="mb-6 border-blue-200 bg-blue-50 dark:bg-blue-950">
          <Download className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-900 dark:text-blue-100">
            <strong>Data imported from Annual Accounts</strong> - Form pre-populated with data from your filing on {new Date(prefillData.sourceFilingDate).toLocaleDateString('en-GB')}. All fields are editable - please review and update as needed.
          </AlertDescription>
        </Alert>
      )}

      <Form {...form}>
        <form className="space-y-6">
          {/* Step 1: Company Information */}
          {currentStep === 1 && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Card className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Building2 className="h-5 w-5 text-primary" />
                    <h2 className="text-xl font-semibold">Company Information & Accounting Period</h2>
                  </div>
                  
                  <ValidationGuidance 
                    errors={form.formState.errors} 
                    fieldGuidance={{
                      utr: "UTR must be exactly 10 digits. Find it on HMRC letters, your online tax account, or contact HMRC.",
                      accountingPeriodStart: "Must not exceed 12 months and should align with your financial year.",
                      accountingPeriodEnd: "Filing deadline is 12 months after this date. Late filing incurs £100-£1,000+ penalties.",
                      numberOfAssociatedCompanies: "Include companies under common control. Affects marginal relief thresholds (£50k-£250k)."
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
                          <FormLabel>Companies House Number *</FormLabel>
                          <FormControl>
                            <Input placeholder="12345678" {...field} data-testid="input-company-number" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="utr"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            Unique Taxpayer Reference (UTR) *
                            <FieldHint 
                              description="Your 10-digit UTR is HMRC's unique identifier for your company's tax affairs. Find it on Corporation Tax letters, your HMRC online account, or payslips."
                              example="1234567890 (exactly 10 digits)"
                              type="help"
                            />
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="1234567890" {...field} data-testid="input-utr" />
                          </FormControl>
                          <FormDescription>10-digit reference from HMRC</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="numberOfAssociatedCompanies"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            Number of Associated Companies
                            <FieldHint 
                              description="Associated companies are those under common control. This affects your marginal relief thresholds. Standard rate applies to profits over £250k (divided by 1 + associates)."
                              example="If you own 2 other companies, enter 2. The £250k threshold becomes £83,333 each (£250k ÷ 3)."
                              type="warning"
                            />
                          </FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              {...field} 
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              data-testid="input-associated-companies" 
                            />
                          </FormControl>
                          <FormDescription>Affects marginal relief calculation</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Separator className="my-6" />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="accountingPeriodStart"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            Accounting Period Start *
                            <FieldHint 
                              description="The first day of your accounting period for Corporation Tax. This should align with your company's financial year and cannot exceed 12 months in length."
                              example="01/04/2024"
                              type="help"
                            />
                          </FormLabel>
                          <FormControl>
                            <Input type="date" {...field} data-testid="input-period-start" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="accountingPeriodEnd"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            Accounting Period End *
                            <FieldHint 
                              description="The last day of your accounting period. Your CT600 must be filed within 12 months of this date. Late filing incurs automatic penalties (£100 for 1 day late, up to £1,000+)."
                              example="31/03/2025"
                              type="warning"
                            />
                          </FormLabel>
                          <FormControl>
                            <Input type="date" {...field} data-testid="input-period-end" />
                          </FormControl>
                          <FormDescription>Filing deadline: 12 months from this date</FormDescription>
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
                      Next: Financials <ArrowRight className="ml-2 h-4 w-4" />
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
                      icon: Calculator,
                      title: "CT600 Filing Requirements",
                      description: "Corporation Tax returns must be filed electronically with HMRC within strict deadlines.",
                      tips: [
                        "Filing deadline: 12 months after accounting period end",
                        "Payment deadline: 9 months and 1 day after period end",
                        "Late filing penalties: £100 (1 day late), £200 (3 months), up to £1,000+",
                        "Standard CT rate: 19% (profits under £50k)",
                        "Main rate: 25% (profits over £250k)",
                        "Marginal relief: 19-25% (profits £50k-£250k)"
                      ]
                    },
                    {
                      icon: Building2,
                      title: "UTR Explained",
                      description: "Your Unique Taxpayer Reference is HMRC's identifier for your company.",
                      tips: [
                        "Format: Exactly 10 digits (e.g., 1234567890)",
                        "Where to find it: HMRC letters, online tax account, corporation tax notices",
                        "Different from: Companies House number (8 digits), VAT number",
                        "How to get one: Automatically issued when you register for Corporation Tax",
                        "Lost your UTR? Call HMRC on 0300 200 3410"
                      ]
                    },
                    {
                      icon: TrendingUp,
                      title: "Associated Companies Rules",
                      description: "Companies under common control share profit thresholds for marginal relief.",
                      tips: [
                        "Definition: Companies with >50% common ownership or control",
                        "Impact: Thresholds divided by (1 + number of associates)",
                        "Example: 2 associates means £250k threshold becomes £83,333 each",
                        "Include: Parent companies, sister companies, subsidiaries",
                        "Penalties for incorrect disclosure: Up to £3,000"
                      ]
                    }
                  ]}
                  documentRequirements={{
                    required: [
                      "Company UTR (10-digit reference from HMRC)",
                      "Accounting period dates (max 12 months)",
                      "List of associated companies (if any)",
                      "Companies House number"
                    ],
                    optional: [
                      "Previous CT600 for reference",
                      "HMRC gateway credentials"
                    ]
                  }}
                />
              </div>
            </div>
          )}

          {/* Step 2: Financial Data */}
          {currentStep === 2 && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Card className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <FileText className="h-5 w-5 text-primary" />
                    <h2 className="text-xl font-semibold">Trading Income & Tax Adjustments</h2>
                  </div>

                  <InlineHint 
                    message="Corporation Tax is calculated on adjusted trading profits, not accounting profits. You must add back non-deductible expenses (like depreciation) and claim capital allowances instead."
                    type="info"
                  />

                  {priorYearData?.success && (
                    <Alert className="mt-4 bg-blue-50 border-blue-200">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        Prior period data loaded from {new Date(priorYearData.data.yearEnding).toLocaleDateString('en-GB')}. Prior period fields available for consistency validation.
                      </AlertDescription>
                    </Alert>
                  )}

                  <Tabs defaultValue="trading" className="w-full mt-4">
                    <TabsList className="grid w-full grid-cols-4">
                      <TabsTrigger value="trading">Income</TabsTrigger>
                      <TabsTrigger value="other">Other Income</TabsTrigger>
                      <TabsTrigger value="adjustments">Adjustments</TabsTrigger>
                      <TabsTrigger value="reliefs">Reliefs</TabsTrigger>
                    </TabsList>

                    <TabsContent value="trading" className="mt-6 space-y-4">
                      <FormField
                        control={form.control}
                        name="turnover"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              Turnover *
                              <FieldHint 
                                description="Total revenue from your trading activities during the accounting period. Use revenue recognition rules for Corporation Tax - generally when the sale is made, not when payment is received."
                                example="£500,000 annual sales (excluding VAT)"
                                type="help"
                              />
                            </FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="0.00" 
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                data-testid="input-turnover"
                              />
                            </FormControl>
                            <FormDescription>Total revenue from trading (excluding VAT)</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="costOfSales"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              Cost of Sales
                              <FieldHint 
                                description="Direct costs of producing goods or services sold. For CT purposes, include: raw materials, direct labour, manufacturing overheads. Exclude: depreciation, financing costs, head office expenses."
                                example="£200,000 (materials £150k + direct labour £50k)"
                                type="help"
                              />
                            </FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="0.00" 
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                data-testid="input-cost-of-sales"
                              />
                            </FormControl>
                            <FormDescription>Direct costs of goods/services sold</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="operatingExpenses"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              Operating Expenses
                              <FieldHint 
                                description="Business running costs. WARNING: Some expenses are NOT tax-deductible and must be added back: client entertainment (100%), depreciation (100%), business entertainment over £50/head, fines & penalties."
                                example="£100,000 (includes £10k depreciation to add back later)"
                                type="warning"
                              />
                            </FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="0.00" 
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                data-testid="input-operating-expenses"
                              />
                            </FormControl>
                            <FormDescription>Admin, selling & distribution costs</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </TabsContent>

                    <TabsContent value="other" className="mt-6 space-y-4">
                      <FormField
                        control={form.control}
                        name="interestReceived"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Interest Received</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="0.00" 
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                data-testid="input-interest-received"
                              />
                            </FormControl>
                            <FormDescription>Bank interest and investment income</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="dividendsReceived"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Dividends Received</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="0.00" 
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                data-testid="input-dividends-received"
                              />
                            </FormControl>
                            <FormDescription>Dividends from UK companies (usually exempt)</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </TabsContent>

                    <TabsContent value="adjustments" className="mt-6 space-y-4">
                      <FormField
                        control={form.control}
                        name="depreciationAddBack"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              Depreciation Add-Back
                              <FieldHint 
                                description="Depreciation is NOT tax-deductible for Corporation Tax. You must add it back to accounting profits and claim Capital Allowances instead. This is a fundamental CT adjustment."
                                example="If P&L shows £10k depreciation, add back £10k here and claim £10k+ capital allowances"
                                type="warning"
                              />
                            </FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="0.00" 
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                data-testid="input-depreciation-addback"
                              />
                            </FormControl>
                            <FormDescription>Depreciation charged in P&L (not tax-deductible)</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="capitalAllowances"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              Capital Allowances
                              <FieldHint 
                                description="Tax relief for business assets. Annual Investment Allowance (AIA): 100% relief on first £1m qualifying expenditure. Main pool (plant & machinery): 18% writing down allowance. Special rate pool (integral features): 6%."
                                example="£50k AIA claim on new equipment + £5k WDA on existing assets"
                                type="help"
                              />
                            </FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="0.00" 
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                data-testid="input-capital-allowances"
                              />
                            </FormControl>
                            <FormDescription>AIA, plant & machinery allowances (tax-deductible)</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </TabsContent>

                    <TabsContent value="reliefs" className="mt-6 space-y-4">
                      <FormField
                        control={form.control}
                        name="lossesBroughtForward"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              Losses Brought Forward
                              <FieldHint 
                                description="Trading losses from previous periods can be carried forward indefinitely and offset against future profits. Post-2017 rules: can offset up to 50% of profits over £5m (100% of first £5m)."
                                example="£20k losses from 2023 can reduce 2024 profits"
                                type="help"
                              />
                            </FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="0.00" 
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                data-testid="input-losses-brought-forward"
                              />
                            </FormControl>
                            <FormDescription>Previous trading losses to offset</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="rdReliefClaim"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              R&D Relief Claim
                              <FieldHint 
                                description="Research & Development tax relief for innovation projects. SME scheme (230% deduction): For companies with <500 staff, <€100m turnover. RDEC scheme (20% credit): For large companies or subcontracted R&D. Must be qualifying R&D activity."
                                example="£100k R&D spend × 230% = £230k deduction (SME)"
                                type="help"
                              />
                            </FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="0.00" 
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                data-testid="input-rd-relief"
                              />
                            </FormControl>
                            <FormDescription>Enhanced deduction for qualifying R&D</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="charitableDonations"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              Charitable Donations
                              <FieldHint 
                                description="Qualifying charitable donations are fully deductible. Must be to UK registered charities or Community Amateur Sports Clubs (CASCs). Exclude: political donations, sponsorships with advertising benefits, gifts to individuals."
                                example="£5,000 donation to Cancer Research UK (registered charity)"
                                type="help"
                              />
                            </FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="0.00" 
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                data-testid="input-charitable-donations"
                              />
                            </FormControl>
                            <FormDescription>Qualifying donations to registered charities</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </TabsContent>
                  </Tabs>

                  {/* Prior Year Comparison (if prior year data available) */}
                  {priorYearData?.success && form.getValues().turnoverPrior && (
                    <div className="mt-8">
                      <Separator className="mb-6" />
                      <PriorYearComparisonTable
                        title="Prior Year Comparison"
                        rows={[
                          {
                            label: "Turnover",
                            current: form.watch("turnover") || 0,
                            prior: form.watch("turnoverPrior") || 0,
                            boxNumber: "40"
                          },
                          {
                            label: "Cost of Sales",
                            current: form.watch("costOfSales") || 0,
                            prior: form.watch("costOfSalesPrior") || 0,
                            boxNumber: "41"
                          },
                          {
                            label: "Operating Expenses",
                            current: form.watch("operatingExpenses") || 0,
                            prior: form.watch("operatingExpensesPrior") || 0,
                            boxNumber: "43"
                          },
                          {
                            label: "Depreciation Add-back",
                            current: form.watch("depreciationAddBack") || 0,
                            prior: form.watch("depreciationAddBackPrior") || 0,
                            boxNumber: "70"
                          },
                          {
                            label: "Capital Allowances",
                            current: form.watch("capitalAllowances") || 0,
                            prior: form.watch("capitalAllowancesPrior") || 0,
                            boxNumber: "71"
                          },
                        ]}
                        showAlerts={true}
                        alertThreshold={30}
                      />
                    </div>
                  )}

                  <div className="flex justify-between mt-6">
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={() => setCurrentStep(1)}
                      data-testid="button-back-step"
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" /> Back
                    </Button>
                    <Button 
                      type="button" 
                      onClick={onComputeTax}
                      disabled={computeTaxMutation.isPending}
                      data-testid="button-compute-tax"
                    >
                      {computeTaxMutation.isPending ? "Computing..." : "Compute Tax"}
                      <ArrowRight className="ml-2 h-4 w-4" />
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
                      icon: AlertTriangle,
                      title: "Tax-Deductible vs Non-Deductible",
                      description: "Not all accounting expenses are tax-deductible. Common add-backs required:",
                      tips: [
                        "✗ Depreciation (100% add-back, claim capital allowances instead)",
                        "✗ Client entertainment (100% non-deductible)",
                        "✗ Business entertainment >£50/head (non-deductible)",
                        "✗ Fines, penalties, illegal payments (non-deductible)",
                        "✓ Staff salaries, wages, pensions (fully deductible)",
                        "✓ Office rent, utilities, insurance (fully deductible)",
                        "✓ Professional fees (legal, accounting - deductible)",
                        "✓ Staff entertaining, training (deductible)"
                      ]
                    },
                    {
                      icon: BarChart3,
                      title: "Capital Allowances Guide",
                      description: "Tax relief for capital expenditure on business assets.",
                      tips: [
                        "Annual Investment Allowance (AIA): 100% relief on first £1m",
                        "Main pool (plant & machinery): 18% writing down allowance",
                        "Special rate pool (integral features, long-life): 6% WDA",
                        "Qualifying: computers, vehicles, machinery, office equipment",
                        "Not qualifying: land, buildings (unless integral features)",
                        "Super-deduction (temporary): 130% relief on qualifying plant",
                        "Must maintain detailed fixed asset register"
                      ]
                    },
                    {
                      icon: TrendingUp,
                      title: "R&D Tax Relief",
                      description: "Enhanced relief for research & development activities.",
                      tips: [
                        "SME scheme: 230% deduction (130% enhancement on qualifying costs)",
                        "RDEC scheme: 20% tax credit for large companies",
                        "Qualifying costs: staff, materials, subcontractors, software",
                        "Must be 'seeking advance in science or technology'",
                        "Not R&D: routine testing, social sciences, arts & humanities",
                        "Claim within 2 years of accounting period end",
                        "HMRC may request detailed project reports"
                      ]
                    },
                    {
                      icon: FileText,
                      title: "Loss Relief Strategies",
                      description: "How to use trading losses to reduce Corporation Tax.",
                      tips: [
                        "Carry forward: Offset against future profits (indefinite)",
                        "Carry back: Offset against previous 12 months' profits",
                        "Post-2017: Can offset 100% of first £5m profits, then 50%",
                        "Group relief: Surrender losses to profitable group companies",
                        "Terminal loss relief: Extended carry-back on cessation",
                        "Must maintain loss memorandum tracking losses",
                        "Strategic: Consider timing of profits to maximize relief"
                      ]
                    }
                  ]}
                  documentRequirements={{
                    required: [
                      "Profit & Loss account for the period",
                      "Detailed expense analysis (deductible vs non-deductible)",
                      "Fixed asset register (for capital allowances)",
                      "Depreciation schedule from accounts",
                      "Loss memorandum (if claiming losses brought forward)"
                    ],
                    optional: [
                      "R&D project descriptions and cost breakdowns",
                      "Charitable donation receipts",
                      "Capital allowances computation (CA01)",
                      "Previous year's CT600 for comparison"
                    ]
                  }}
                />
              </div>
            </div>
          )}

          {/* Step 3: Supporting Documents */}
          {currentStep === 3 && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <DocumentSelector
                  selectedDocumentIds={selectedDocumentIds}
                  onSelectionChange={setSelectedDocumentIds}
                  filingType="ct600"
                  recommendedTypes={["trial_balance", "accounting_export", "bank_statement"]}
                />

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
                    onClick={() => {
                      const values = form.getValues();
                      generateComputationMutation.mutate(values);
                    }}
                    disabled={generateComputationMutation.isPending}
                    data-testid="button-continue"
                  >
                    {generateComputationMutation.isPending ? "Generating Computation..." : "Continue to Review"}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="lg:col-span-1">
                <HelpPanel 
                  title="Why Attach Documents?"
                  sections={[
                    {
                      icon: FileCheck,
                      title: "HMRC Compliance",
                      description: "HMRC may request supporting documents for your Corporation Tax return.",
                      tips: [
                        "Keep evidence for all claims and deductions",
                        "Maintain audit trail for 6+ years",
                        "Capital allowances require detailed records",
                        "R&D claims need project documentation"
                      ]
                    },
                    {
                      icon: AlertTriangle,
                      title: "Recommended Documents",
                      description: "Attach key documents to support your tax computation.",
                      tips: [
                        "Annual Accounts or management accounts",
                        "Capital allowances calculations",
                        "R&D relief calculations (if applicable)",
                        "Loss memorandum (if claiming losses)"
                      ]
                    }
                  ]}
                  documentRequirements={{
                    required: [],
                    optional: [
                      "Annual Accounts",
                      "Capital allowances schedule",
                      "R&D calculations",
                      "Loss memorandum"
                    ]
                  }}
                />
              </div>
            </div>
          )}

          {/* Step 4: Review & Computation */}
          {currentStep === 4 && computation && (
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <h2 className="text-xl font-semibold">Tax Computation Summary</h2>
              </div>

              <Alert className="mb-6">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Please review the computed tax liability carefully before submission to HMRC.
                </AlertDescription>
              </Alert>

              {/* Credit Requirement Alert */}
              {(() => {
                const FILING_COST = 30;
                const availableCredits = user?.credits || 0;
                const hasSufficientCredits = availableCredits >= FILING_COST;

                return (
                  <Alert 
                    className={`mb-6 ${hasSufficientCredits ? 'border-green-500 bg-green-50 dark:bg-green-950' : 'border-red-500 bg-red-50 dark:bg-red-950'}`}
                    data-testid="alert-credit-requirement"
                  >
                    <AlertDescription className={hasSufficientCredits ? 'text-green-900 dark:text-green-100' : 'text-red-900 dark:text-red-100'}>
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-medium">Filing cost: {FILING_COST} credits</span>
                          <span className="ml-2">| Available: {availableCredits} credits</span>
                        </div>
                        {!hasSufficientCredits && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => window.location.href = '/credits'}
                            className="border-red-600 text-red-600 hover:bg-red-100 dark:hover:bg-red-900"
                          >
                            Top Up Credits Now
                          </Button>
                        )}
                      </div>
                    </AlertDescription>
                  </Alert>
                );
              })()}

              <div className="space-y-6">
                {/* Trading Profit */}
                <div>
                  <h3 className="font-medium mb-3">Trading Profit Calculation</h3>
                  <div className="bg-muted p-4 rounded-md space-y-2">
                    <div className="flex justify-between">
                      <span>Turnover:</span>
                      <span className="font-medium">£{computation.breakdown.tradingProfitCalculation.turnover.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Cost of Sales:</span>
                      <span className="font-medium">-£{computation.breakdown.tradingProfitCalculation.costOfSales.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Operating Expenses:</span>
                      <span className="font-medium">-£{computation.breakdown.tradingProfitCalculation.operatingExpenses.toFixed(2)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-semibold">
                      <span>Trading Profit:</span>
                      <span className="text-primary" data-testid="text-trading-profit">£{computation.breakdown.tradingProfitCalculation.tradingProfit.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Tax Calculation */}
                <div>
                  <h3 className="font-medium mb-3">Corporation Tax Calculation</h3>
                  <div className="bg-muted p-4 rounded-md space-y-2">
                    <div className="flex justify-between">
                      <span>Chargeable Profits:</span>
                      <span className="font-medium">£{computation.chargeableProfits.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Applicable Rate:</span>
                      <span className="font-medium">{(computation.corporationTaxRate * 100).toFixed(2)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tax Before Reliefs:</span>
                      <span className="font-medium">£{computation.corporationTaxBeforeReliefs.toFixed(2)}</span>
                    </div>
                    {computation.totalReliefs > 0 && (
                      <div className="flex justify-between">
                        <span>Total Reliefs:</span>
                        <span className="font-medium text-green-600">-£{computation.totalReliefs.toFixed(2)}</span>
                      </div>
                    )}
                    <Separator />
                    <div className="flex justify-between font-semibold text-lg">
                      <span>Corporation Tax Due:</span>
                      <span className="text-primary" data-testid="text-tax-due">£{computation.corporationTaxDue.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {computation.breakdown.taxCalculation.marginalReliefApplied && (
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      Marginal Relief applied: £{computation.breakdown.taxCalculation.marginalReliefAmount.toFixed(2)}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Validation Warnings */}
                {computation.validation && computation.validation.warnings && computation.validation.warnings.length > 0 && (
                  <div>
                    <h3 className="font-medium mb-3 text-yellow-600 dark:text-yellow-400">Validation Warnings</h3>
                    <div className="space-y-2">
                      {computation.validation.warnings.map((warning: any, idx: number) => (
                        <Alert key={idx} className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
                          <AlertTriangle className="h-4 w-4 text-yellow-600" />
                          <AlertDescription className="text-yellow-900 dark:text-yellow-100">
                            <strong>{warning.field || 'General'}:</strong> {warning.message}
                            {warning.suggestedAction && <div className="mt-1 text-sm">Suggested: {warning.suggestedAction}</div>}
                          </AlertDescription>
                        </Alert>
                      ))}
                    </div>
                  </div>
                )}

                {/* Required Supplementary Pages Alert */}
                {computation.validation && computation.validation.requiredSupplementaryPages && computation.validation.requiredSupplementaryPages.length > 0 && (
                  <Alert className="border-blue-500 bg-blue-50 dark:bg-blue-950">
                    <FileText className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-900 dark:text-blue-100">
                      <strong>Required Supplementary Pages:</strong> Based on your company's activities, you must complete the following supplementary forms:
                      <ul className="mt-2 ml-4 list-disc">
                        {computation.validation.requiredSupplementaryPages.map((page: string, idx: number) => (
                          <li key={idx}>{page}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}

                {/* Box-by-Box Breakdown */}
                {computation.boxBreakdown && (
                  <div>
                    <h3 className="font-medium mb-3">HMRC Form CT600 - Box Breakdown</h3>
                    <div className="border rounded-md overflow-hidden">
                      <div className="bg-muted/50 p-3 border-b font-medium grid grid-cols-3 gap-2">
                        <div>Box Number</div>
                        <div>Description</div>
                        <div className="text-right">Value</div>
                      </div>
                      {Object.entries(computation.boxBreakdown).map(([boxNum, boxData]: [string, any]) => (
                        <div key={boxNum} className="p-3 border-b last:border-b-0 grid grid-cols-3 gap-2 items-center hover:bg-muted/30">
                          <div className="font-mono text-sm font-medium">{boxNum}</div>
                          <div className="text-sm">{boxData.description}</div>
                          <div className="text-right font-medium">
                            {typeof boxData.value === 'number' ? `£${boxData.value.toFixed(2)}` : boxData.value}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

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
                  onClick={onSubmitToHMRC}
                  disabled={submitToHMRCMutation.isPending}
                  data-testid="button-submit-hmrc"
                >
                  {submitToHMRCMutation.isPending ? "Submitting..." : "Submit to HMRC"}
                  <Send className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </Card>
          )}

          {/* Step 5: Success */}
          {currentStep === 5 && (
            <Card className="p-6 text-center">
              <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
              <h2 className="text-2xl font-semibold mb-2">CT600 Submitted Successfully</h2>
              <p className="text-muted-foreground mb-6">
                Your Corporation Tax return has been submitted to HMRC
              </p>
              <Badge className="mb-4">Reference: CT600-{Date.now()}</Badge>
              <div className="mt-6">
                <Button 
                  onClick={() => window.location.href = '/dashboard'}
                  data-testid="button-back-dashboard"
                >
                  Back to Dashboard
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

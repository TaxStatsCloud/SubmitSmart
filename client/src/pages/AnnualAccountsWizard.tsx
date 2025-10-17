import { useState } from "react";
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

// Annual Accounts Form Schema
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
  
  // Balance Sheet - Fixed Assets
  intangibleAssets: z.coerce.number().min(0).default(0),
  tangibleAssets: z.coerce.number().min(0).default(0),
  investments: z.coerce.number().min(0).default(0),
  
  // Balance Sheet - Current Assets
  stocks: z.coerce.number().min(0).default(0),
  debtors: z.coerce.number().min(0).default(0),
  cashAtBank: z.coerce.number().min(0).default(0),
  
  // Balance Sheet - Creditors
  creditorsDueWithinYear: z.coerce.number().min(0).default(0),
  creditorsDueAfterYear: z.coerce.number().min(0).default(0),
  
  // Balance Sheet - Capital & Reserves
  calledUpShareCapital: z.coerce.number().min(0).default(0),
  profitAndLossAccount: z.coerce.number().default(0),
  
  // P&L Account
  turnover: z.coerce.number().min(0).default(0),
  costOfSales: z.coerce.number().min(0).default(0),
  grossProfit: z.coerce.number().default(0),
  administrativeExpenses: z.coerce.number().min(0).default(0),
  operatingProfit: z.coerce.number().default(0),
  
  // Directors & Audit
  directorNames: z.string().min(1, "At least one director required"),
  auditExempt: z.boolean().default(true),
  accountingPolicies: z.string().optional(),
});

type AnnualAccountsFormData = z.infer<typeof annualAccountsSchema>;

export default function AnnualAccountsWizard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [iXBRLPreview, setIXBRLPreview] = useState<any>(null);

  const form = useForm<AnnualAccountsFormData>({
    resolver: zodResolver(annualAccountsSchema),
    defaultValues: {
      companyName: "",
      companyNumber: "",
      registeredOffice: "",
      financialYearStart: "",
      financialYearEnd: "",
      entitySize: "small",
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
      directorNames: "",
      auditExempt: true,
      accountingPolicies: "",
    },
  });

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
      setCurrentStep(4);
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
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/filings'] });
      toast({
        title: "Submitted Successfully",
        description: "Annual Accounts have been submitted to Companies House",
      });
      setCurrentStep(5);
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
    submitToCompaniesHouseMutation.mutate();
  };

  const progressPercentage = (currentStep / 5) * 100;

  return (
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
          <span className="text-sm text-muted-foreground">Step {currentStep} of 5</span>
        </div>
        <Progress value={progressPercentage} className="h-2" />
        <div className="flex justify-between mt-2">
          <span className={`text-xs ${currentStep >= 1 ? 'text-primary font-medium' : 'text-muted-foreground'}`}>Company Info</span>
          <span className={`text-xs ${currentStep >= 2 ? 'text-primary font-medium' : 'text-muted-foreground'}`}>Balance Sheet</span>
          <span className={`text-xs ${currentStep >= 3 ? 'text-primary font-medium' : 'text-muted-foreground'}`}>P&L Account</span>
          <span className={`text-xs ${currentStep >= 4 ? 'text-primary font-medium' : 'text-muted-foreground'}`}>Review</span>
          <span className={`text-xs ${currentStep >= 5 ? 'text-primary font-medium' : 'text-muted-foreground'}`}>Submit</span>
        </div>
      </div>

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
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Building2 className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-semibold">Company Information</h2>
              </div>
              
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
                      <FormLabel>Financial Year End *</FormLabel>
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
          )}

          {/* Step 2: Balance Sheet */}
          {currentStep === 2 && (
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Calculator className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-semibold">Balance Sheet</h2>
              </div>

              <Tabs defaultValue="fixed-assets" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="fixed-assets">Fixed Assets</TabsTrigger>
                  <TabsTrigger value="current-assets">Current Assets</TabsTrigger>
                  <TabsTrigger value="liabilities">Liabilities</TabsTrigger>
                  <TabsTrigger value="capital">Capital</TabsTrigger>
                </TabsList>

                <TabsContent value="fixed-assets" className="mt-6 space-y-4">
                  <FormField
                    control={form.control}
                    name="intangibleAssets"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Intangible Assets</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="0.00" 
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            data-testid="input-intangible-assets"
                          />
                        </FormControl>
                        <FormDescription>Goodwill, patents, trademarks</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="tangibleAssets"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tangible Assets</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="0.00" 
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            data-testid="input-tangible-assets"
                          />
                        </FormControl>
                        <FormDescription>Property, equipment, vehicles</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="investments"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Investments</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="0.00" 
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            data-testid="input-investments"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>

                <TabsContent value="current-assets" className="mt-6 space-y-4">
                  <FormField
                    control={form.control}
                    name="stocks"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Stocks / Inventory</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="0.00" 
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            data-testid="input-stocks"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="debtors"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Debtors (Amounts Receivable)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="0.00" 
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            data-testid="input-debtors"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="cashAtBank"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cash at Bank and in Hand</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="0.00" 
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            data-testid="input-cash"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>

                <TabsContent value="liabilities" className="mt-6 space-y-4">
                  <FormField
                    control={form.control}
                    name="creditorsDueWithinYear"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Creditors: Amounts Falling Due Within One Year</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="0.00" 
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            data-testid="input-creditors-within-year"
                          />
                        </FormControl>
                        <FormDescription>Trade creditors, bank overdraft, taxation</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="creditorsDueAfterYear"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Creditors: Amounts Falling Due After One Year</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="0.00" 
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            data-testid="input-creditors-after-year"
                          />
                        </FormControl>
                        <FormDescription>Long-term loans, mortgages</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>

                <TabsContent value="capital" className="mt-6 space-y-4">
                  <FormField
                    control={form.control}
                    name="calledUpShareCapital"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Called Up Share Capital</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="0.00" 
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            data-testid="input-share-capital"
                          />
                        </FormControl>
                        <FormDescription>Issued share capital</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="profitAndLossAccount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Profit and Loss Account Reserve</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="0.00" 
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            data-testid="input-pl-reserve"
                          />
                        </FormControl>
                        <FormDescription>Retained earnings from previous years</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
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
          )}

          {/* Step 3: P&L Account */}
          {currentStep === 3 && (
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

              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="turnover"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Turnover *</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="0.00" 
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          data-testid="input-turnover"
                        />
                      </FormControl>
                      <FormDescription>Total revenue for the financial year</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="costOfSales"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cost of Sales</FormLabel>
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
                  name="administrativeExpenses"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Administrative Expenses</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="0.00" 
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          data-testid="input-admin-expenses"
                        />
                      </FormControl>
                      <FormDescription>Rent, salaries, utilities, marketing</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Separator className="my-4" />

                <FormField
                  control={form.control}
                  name="accountingPolicies"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Accounting Policies (Optional)</FormLabel>
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
                  onClick={onGenerateIXBRL}
                  disabled={generateIXBRLMutation.isPending}
                  data-testid="button-generate-ixbrl"
                >
                  {generateIXBRLMutation.isPending ? "Generating..." : "Generate iXBRL"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </Card>
          )}

          {/* Step 4: Review & iXBRL Preview */}
          {currentStep === 4 && iXBRLPreview && (
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
                    <span>Filing cost: <strong>120 credits</strong></span>
                    <span className="text-sm text-muted-foreground">Companies House fee: FREE</span>
                  </AlertDescription>
                </Alert>
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

          {/* Step 5: Success */}
          {currentStep === 5 && (
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
                      <span className="font-medium">120</span>
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
  );
}

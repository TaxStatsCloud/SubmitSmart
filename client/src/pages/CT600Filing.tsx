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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Calculator, FileText, CheckCircle, AlertTriangle, Send, ArrowLeft, ArrowRight, Building2 } from "lucide-react";

// CT600 Form Schema with number coercion
const ct600Schema = z.object({
  // Company Info
  companyName: z.string().min(1, "Company name is required"),
  companyNumber: z.string().min(8, "Company number must be at least 8 characters"),
  utr: z.string().min(10, "UTR must be at least 10 characters"),
  
  // Accounting Period
  accountingPeriodStart: z.string().min(1, "Start date is required"),
  accountingPeriodEnd: z.string().min(1, "End date is required"),
  
  // Trading Income - using coerce to handle string inputs
  turnover: z.coerce.number().min(0, "Turnover cannot be negative"),
  costOfSales: z.coerce.number().min(0, "Cost of sales cannot be negative").optional(),
  operatingExpenses: z.coerce.number().min(0, "Operating expenses cannot be negative").optional(),
  
  // Other Income
  interestReceived: z.coerce.number().min(0).optional(),
  dividendsReceived: z.coerce.number().min(0).optional(),
  
  // Adjustments
  depreciationAddBack: z.coerce.number().min(0).optional(),
  capitalAllowances: z.coerce.number().min(0).optional(),
  
  // Reliefs & Deductions
  lossesBroughtForward: z.coerce.number().min(0).optional(),
  rdReliefClaim: z.coerce.number().min(0).optional(),
  charitableDonations: z.coerce.number().min(0).optional(),
  
  // Associated Companies
  numberOfAssociatedCompanies: z.coerce.number().min(0).default(0),
});

type CT600FormData = z.infer<typeof ct600Schema>;

export default function CT600Filing() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [computation, setComputation] = useState<any>(null);

  const form = useForm<CT600FormData>({
    resolver: zodResolver(ct600Schema),
    defaultValues: {
      companyName: "",
      companyNumber: "",
      utr: "",
      accountingPeriodStart: "",
      accountingPeriodEnd: "",
      turnover: 0,
      costOfSales: 0,
      operatingExpenses: 0,
      interestReceived: 0,
      dividendsReceived: 0,
      depreciationAddBack: 0,
      capitalAllowances: 0,
      lossesBroughtForward: 0,
      rdReliefClaim: 0,
      charitableDonations: 0,
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

  // Compute tax mutation
  const computeTaxMutation = useMutation({
    mutationFn: async (data: CT600FormData) => {
      const response = await apiRequest('POST', '/api/ct600/compute', data);
      return response.json();
    },
    onSuccess: (data) => {
      setComputation(data);
      setCurrentStep(3);
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
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ct600/current'] });
      toast({
        title: "Submitted Successfully",
        description: "CT600 has been submitted to HMRC",
      });
      setCurrentStep(4);
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
    submitToHMRCMutation.mutate();
  };

  const progressPercentage = (currentStep / 4) * 100;

  return (
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
          <span className="text-sm text-muted-foreground">Step {currentStep} of 4</span>
        </div>
        <Progress value={progressPercentage} className="h-2" />
        <div className="flex justify-between mt-2">
          <span className={`text-xs ${currentStep >= 1 ? 'text-primary font-medium' : 'text-muted-foreground'}`}>Company Info</span>
          <span className={`text-xs ${currentStep >= 2 ? 'text-primary font-medium' : 'text-muted-foreground'}`}>Financials</span>
          <span className={`text-xs ${currentStep >= 3 ? 'text-primary font-medium' : 'text-muted-foreground'}`}>Review</span>
          <span className={`text-xs ${currentStep >= 4 ? 'text-primary font-medium' : 'text-muted-foreground'}`}>Submit</span>
        </div>
      </div>

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
                      <FormLabel>Company Number *</FormLabel>
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
                      <FormLabel>Unique Taxpayer Reference (UTR) *</FormLabel>
                      <FormControl>
                        <Input placeholder="1234567890" {...field} data-testid="input-utr" />
                      </FormControl>
                      <FormDescription>10-digit UTR from HMRC</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="numberOfAssociatedCompanies"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Number of Associated Companies</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field} 
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          data-testid="input-associated-companies" 
                        />
                      </FormControl>
                      <FormDescription>For marginal relief calculation</FormDescription>
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
                      <FormLabel>Accounting Period Start *</FormLabel>
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
                      <FormLabel>Accounting Period End *</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} data-testid="input-period-end" />
                      </FormControl>
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
          )}

          {/* Step 2: Financial Data */}
          {currentStep === 2 && (
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-semibold">Financial Information</h2>
              </div>

              <Tabs defaultValue="trading" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="trading">Trading Income</TabsTrigger>
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
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="operatingExpenses"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Operating Expenses</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="0.00" 
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            data-testid="input-operating-expenses"
                          />
                        </FormControl>
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
                        <FormLabel>Depreciation Add-Back</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="0.00" 
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            data-testid="input-depreciation-addback"
                          />
                        </FormControl>
                        <FormDescription>Add back depreciation for tax purposes</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="capitalAllowances"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Capital Allowances</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="0.00" 
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            data-testid="input-capital-allowances"
                          />
                        </FormControl>
                        <FormDescription>Tax-deductible capital allowances</FormDescription>
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
                        <FormLabel>Losses Brought Forward</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="0.00" 
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            data-testid="input-losses-brought-forward"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="rdReliefClaim"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>R&D Relief Claim</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="0.00" 
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            data-testid="input-rd-relief"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="charitableDonations"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Charitable Donations</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="0.00" 
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            data-testid="input-charitable-donations"
                          />
                        </FormControl>
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
          )}

          {/* Step 3: Review & Computation */}
          {currentStep === 3 && computation && (
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
              </div>

              <div className="flex justify-between mt-6">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => setCurrentStep(2)}
                  data-testid="button-back-to-financials"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" /> Edit Financials
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

          {/* Step 4: Success */}
          {currentStep === 4 && (
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
  );
}

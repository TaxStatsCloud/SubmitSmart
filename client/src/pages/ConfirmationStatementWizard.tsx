import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { FileCheck, Building2, Users, CheckCircle, AlertTriangle, Send, ArrowLeft, ArrowRight, Shield } from "lucide-react";
import { FieldHint, InlineHint } from "@/components/wizard/FieldHint";
import { HelpPanel } from "@/components/wizard/HelpPanel";
import { ValidationGuidance } from "@/components/wizard/ValidationGuidance";

// CS01 Form Schema
const cs01Schema = z.object({
  // Company Details
  companyName: z.string().min(1, "Company name is required"),
  companyNumber: z.string().min(8, "Company number must be at least 8 characters"),
  registeredOffice: z.string().min(1, "Registered office is required"),
  
  // SIC Codes
  sicCodes: z.string().min(1, "At least one SIC code is required"),
  tradingStatus: z.enum(["trading", "dormant"]),
  
  // Directors
  directors: z.string().min(1, "At least one director is required"),
  
  // PSC (People with Significant Control)
  pscName: z.string().min(1, "PSC name is required"),
  pscNationality: z.string().min(1, "PSC nationality is required"),
  pscDateOfBirth: z.string().min(1, "PSC date of birth is required"),
  pscServiceAddress: z.string().min(1, "PSC service address is required"),
  pscNatureOfControl: z.array(z.string()).min(1, "Select at least one nature of control"),
  
  // Share Capital
  shareCapitalChanged: z.boolean(),
  numberOfShares: z.coerce.number().min(1).optional(),
  nominalValue: z.coerce.number().min(0).optional(),
  currency: z.string().default("GBP"),
  
  // Statement of Capital
  aggregateNominalValue: z.coerce.number().min(0).optional(),
  amountPaidUp: z.coerce.number().min(0).optional(),
  amountUnpaid: z.coerce.number().min(0).optional(),
  
  // Confirmation
  statementDate: z.string().min(1, "Statement date is required"),
  madeUpToDate: z.string().min(1, "Made up to date is required"),
});

type CS01FormData = z.infer<typeof cs01Schema>;

export default function ConfirmationStatementWizard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);

  const form = useForm<CS01FormData>({
    resolver: zodResolver(cs01Schema),
    defaultValues: {
      companyName: "",
      companyNumber: "",
      registeredOffice: "",
      sicCodes: "",
      tradingStatus: "trading",
      directors: "",
      pscName: "",
      pscNationality: "British",
      pscDateOfBirth: "",
      pscServiceAddress: "",
      pscNatureOfControl: [],
      shareCapitalChanged: false,
      numberOfShares: 0,
      nominalValue: 1.00,
      currency: "GBP",
      aggregateNominalValue: 0,
      amountPaidUp: 0,
      amountUnpaid: 0,
      statementDate: new Date().toISOString().split('T')[0],
      madeUpToDate: new Date().toISOString().split('T')[0],
    },
  });

  // Submit to Companies House mutation
  const submitToCompaniesHouseMutation = useMutation({
    mutationFn: async (data: CS01FormData) => {
      const response = await apiRequest('POST', '/api/confirmation-statement/submit', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/filings'] });
      toast({
        title: "Submitted Successfully",
        description: "Confirmation Statement has been submitted to Companies House",
      });
      setCurrentStep(4);
    },
    onError: (error: any) => {
      toast({
        title: "Submission Failed",
        description: error.message || "Failed to submit to Companies House",
        variant: "destructive",
      });
    },
  });

  const onSubmit = async () => {
    const isValid = await form.trigger();
    if (isValid) {
      submitToCompaniesHouseMutation.mutate(form.getValues());
    }
  };

  const progressPercentage = (currentStep / 4) * 100;

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <FileCheck className="h-8 w-8 text-purple-600" />
          <h1 className="text-3xl font-bold">Confirmation Statement (CS01) Wizard</h1>
        </div>
        <p className="text-muted-foreground">Annual confirmation of your company information for Companies House</p>
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between mb-2">
          <span className="text-sm font-medium">Progress</span>
          <span className="text-sm text-muted-foreground">Step {currentStep} of 4</span>
        </div>
        <Progress value={progressPercentage} className="h-2" />
        <div className="flex justify-between mt-2">
          <span className={`text-xs ${currentStep >= 1 ? 'text-primary font-medium' : 'text-muted-foreground'}`}>Company Details</span>
          <span className={`text-xs ${currentStep >= 2 ? 'text-primary font-medium' : 'text-muted-foreground'}`}>PSC & Directors</span>
          <span className={`text-xs ${currentStep >= 3 ? 'text-primary font-medium' : 'text-muted-foreground'}`}>Share Capital</span>
          <span className={`text-xs ${currentStep >= 4 ? 'text-primary font-medium' : 'text-muted-foreground'}`}>Submit</span>
        </div>
      </div>

      {/* Filing Deadline Alert */}
      <Alert className="mb-6 border-amber-500 bg-amber-50 dark:bg-amber-950">
        <AlertTriangle className="h-4 w-4 text-amber-600" />
        <AlertTitle className="text-amber-900 dark:text-amber-100">Annual Requirement</AlertTitle>
        <AlertDescription className="text-amber-800 dark:text-amber-200">
          You must file a Confirmation Statement at least once every 12 months. Late filing can result in penalties up to £5,000 and potential director disqualification.
        </AlertDescription>
      </Alert>

      <Form {...form}>
        <form className="space-y-6">
          {/* Step 1: Company Details */}
          {currentStep === 1 && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Card className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Building2 className="h-5 w-5 text-primary" />
                    <h2 className="text-xl font-semibold">Company Details</h2>
                  </div>

                  <ValidationGuidance 
                    errors={form.formState.errors} 
                    fieldGuidance={{
                      sicCodes: "Enter up to 4 SIC codes that best describe your business activities. You can search codes at companieshouse.gov.uk",
                      tradingStatus: "Dormant companies have no significant accounting transactions during the period."
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
                  name="sicCodes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        SIC Codes *
                        <FieldHint 
                          description="Standard Industrial Classification codes describe your business activities. You can have up to 4 codes. Use codes from the UK SIC 2007 system."
                          example="62011 (Ready-made interactive leisure software), 62012 (Business software development)"
                          type="help"
                        />
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="62011, 62012" {...field} data-testid="input-sic-codes" />
                      </FormControl>
                      <FormDescription>Standard Industrial Classification codes (comma-separated)</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="tradingStatus"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Trading Status *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-trading-status">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="trading">Trading</SelectItem>
                          <SelectItem value="dormant">Dormant</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="statementDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Statement Date *</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} data-testid="input-statement-date" />
                      </FormControl>
                      <FormDescription>Date you're making this statement</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="madeUpToDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Made Up To Date *</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} data-testid="input-made-up-to-date" />
                      </FormControl>
                      <FormDescription>Date to which the statement is made up</FormDescription>
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
                      Next: PSC & Directors <ArrowRight className="ml-2 h-4 w-4" />
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
                      icon: FileCheck,
                      title: "Confirmation Statement Purpose",
                      description: "The CS01 confirms your company information is up-to-date with Companies House.",
                      tips: [
                        "Must be filed at least once every 12 months",
                        "Late filing can result in penalties up to £5,000",
                        "Directors can be disqualified for persistent late filing",
                        "Fee: £13 online, £40 paper (from Companies House)"
                      ]
                    },
                    {
                      icon: Building2,
                      title: "SIC Codes Guide",
                      description: "Standard Industrial Classification codes describe your business activities.",
                      tips: [
                        "You can have up to 4 SIC codes",
                        "Use the UK SIC 2007 classification system",
                        "First code should be your main business activity",
                        "Search codes at: gov.uk/government/publications/standard-industrial-classification-of-economic-activities-sic"
                      ]
                    },
                    {
                      icon: AlertTriangle,
                      title: "Trading Status",
                      description: "Declare whether your company is trading or dormant.",
                      tips: [
                        "Trading: Company has significant accounting transactions",
                        "Dormant: No significant transactions during the period",
                        "Dormant companies still need to file confirmation statements",
                        "Being dormant may reduce filing requirements"
                      ]
                    }
                  ]}
                  documentRequirements={{
                    required: [
                      "Current Companies House certificate",
                      "Up-to-date company register",
                      "List of current directors and shareholders",
                      "Details of people with significant control (PSC)"
                    ],
                    optional: [
                      "Previous year's confirmation statement"
                    ]
                  }}
                />
              </div>
            </div>
          )}

          {/* Step 2: PSC & Directors */}
          {currentStep === 2 && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Card className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Users className="h-5 w-5 text-primary" />
                    <h2 className="text-xl font-semibold">People with Significant Control & Directors</h2>
                  </div>

                  <Alert className="mb-6">
                    <Shield className="h-4 w-4" />
                    <AlertDescription>
                      A Person with Significant Control (PSC) is anyone who owns more than 25% of shares or voting rights, 
                      or has the right to appoint or remove the majority of directors.
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-6">
                    <h3 className="font-medium">Directors</h3>
                    <FormField
                      control={form.control}
                      name="directors"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Director Names *</FormLabel>
                          <FormControl>
                            <Textarea placeholder="John Smith, Jane Doe" {...field} data-testid="input-directors" />
                          </FormControl>
                          <FormDescription>List all current directors (comma-separated)</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Separator className="my-6" />

                    <h3 className="font-medium">Person with Significant Control (PSC)</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="pscName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              PSC Name *
                              <FieldHint 
                                description="A Person with Significant Control (PSC) owns more than 25% of shares, holds more than 25% of voting rights, or has the right to appoint or remove directors."
                                example="John Smith (individual) or ABC Holdings Ltd (corporate entity)"
                                type="help"
                              />
                            </FormLabel>
                            <FormControl>
                              <Input placeholder="John Smith" {...field} data-testid="input-psc-name" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                  <FormField
                    control={form.control}
                    name="pscNationality"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>PSC Nationality *</FormLabel>
                        <FormControl>
                          <Input placeholder="British" {...field} data-testid="input-psc-nationality" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="pscDateOfBirth"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>PSC Date of Birth *</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} data-testid="input-psc-dob" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="pscServiceAddress"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel className="flex items-center gap-2">
                          PSC Service Address *
                          <FieldHint 
                            description="The service address appears on the public register at Companies House. PSCs can use their residential address or a service address."
                            type="warning"
                          />
                        </FormLabel>
                        <FormControl>
                          <Textarea placeholder="123 High Street, London, UK" {...field} data-testid="input-psc-address" />
                        </FormControl>
                        <FormDescription>This will appear on public record</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="pscNatureOfControl"
                    render={() => (
                      <FormItem className="md:col-span-2">
                        <FormLabel className="flex items-center gap-2">
                          Nature of Control *
                          <FieldHint 
                            description="Select all types of control that apply to this PSC. Multiple categories can apply to the same person."
                            example="A shareholder with 60% ownership would select both 'shares' and 'voting rights'"
                            type="help"
                          />
                        </FormLabel>
                        <div className="space-y-2">
                          {[
                            { id: "shares_over_25", label: "Owns more than 25% of shares" },
                            { id: "voting_over_25", label: "Holds more than 25% of voting rights" },
                            { id: "appoint_directors", label: "Right to appoint or remove directors" },
                            { id: "significant_influence", label: "Right to exercise significant influence or control" },
                          ].map((option) => (
                            <FormField
                              key={option.id}
                              control={form.control}
                              name="pscNatureOfControl"
                              render={({ field }) => {
                                return (
                                  <FormItem
                                    key={option.id}
                                    className="flex flex-row items-start space-x-3 space-y-0"
                                  >
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value?.includes(option.id)}
                                        onCheckedChange={(checked) => {
                                          return checked
                                            ? field.onChange([...field.value, option.id])
                                            : field.onChange(
                                                field.value?.filter(
                                                  (value) => value !== option.id
                                                )
                                              );
                                        }}
                                        data-testid={`checkbox-${option.id}`}
                                      />
                                    </FormControl>
                                    <FormLabel className="font-normal">
                                      {option.label}
                                    </FormLabel>
                                  </FormItem>
                                );
                              }}
                            />
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                    </div>
                  </div>

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
                      Next: Share Capital <ArrowRight className="ml-2 h-4 w-4" />
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
                      icon: Shield,
                      title: "PSC Requirements",
                      description: "Understanding People with Significant Control obligations.",
                      tips: [
                        "PSC owns >25% of shares or voting rights",
                        "PSC can appoint/remove majority of directors",
                        "PSC has right to exercise significant influence",
                        "All PSC information appears on public register",
                        "Failure to register PSC is a criminal offence"
                      ]
                    },
                    {
                      icon: Users,
                      title: "Director Responsibilities",
                      description: "Key duties and obligations of company directors.",
                      tips: [
                        "Directors must act in the company's best interests",
                        "Duty to promote success of the company",
                        "Must exercise independent judgment",
                        "Required to declare conflicts of interest",
                        "Personally liable for certain company debts if negligent"
                      ]
                    },
                    {
                      icon: AlertTriangle,
                      title: "Public Register",
                      description: "Information that appears on the public register.",
                      tips: [
                        "PSC names and dates of birth (month/year only)",
                        "Nature and extent of control",
                        "Service addresses (residential addresses protected)",
                        "Nationality and country of residence",
                        "All information is publicly searchable"
                      ]
                    }
                  ]}
                  documentRequirements={{
                    required: [
                      "PSC register with up-to-date entries",
                      "Director details and appointments",
                      "Confirmation of PSC nature of control",
                      "Service addresses for all PSCs"
                    ],
                    optional: [
                      "Board minutes approving PSC register",
                      "Share certificates confirming ownership"
                    ]
                  }}
                />
              </div>
            </div>
          )}

          {/* Step 3: Share Capital */}
          {currentStep === 3 && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Card className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <FileCheck className="h-5 w-5 text-primary" />
                    <h2 className="text-xl font-semibold">Statement of Capital</h2>
                  </div>

                  <InlineHint 
                    message="Share capital represents the total value of shares issued by your company. You must report any changes to share capital, including new share issues (allotments) or changes to share classes."
                    type="info"
                  />

                  <div className="space-y-6 mt-6">
                <FormField
                  control={form.control}
                  name="shareCapitalChanged"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="checkbox-share-capital-changed"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          Share capital has changed since last statement
                        </FormLabel>
                      </div>
                    </FormItem>
                  )}
                />

                {form.watch("shareCapitalChanged") && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pl-6 border-l-2 border-primary">
                    <FormField
                      control={form.control}
                      name="numberOfShares"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            Number of Shares *
                            <FieldHint 
                              description="The total number of shares your company has issued. This is the quantity of shares, not their value."
                              example="1,000 ordinary shares of £1 each"
                              type="help"
                            />
                          </FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="1000" 
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              data-testid="input-number-of-shares"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="nominalValue"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            Nominal Value per Share *
                            <FieldHint 
                              description="The par value or face value of each share, set when the shares were created. Also called 'par value'. This is not the market value."
                              example="£1.00 or £0.01 (common nominal values)"
                              type="help"
                            />
                          </FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.01"
                              placeholder="1.00" 
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              data-testid="input-nominal-value"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="currency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Currency *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-currency">
                                <SelectValue placeholder="Select currency" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="GBP">GBP (£)</SelectItem>
                              <SelectItem value="USD">USD ($)</SelectItem>
                              <SelectItem value="EUR">EUR (€)</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="aggregateNominalValue"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            Aggregate Nominal Value *
                            <FieldHint 
                              description="Total nominal value of all issued shares. Calculate by multiplying number of shares × nominal value per share."
                              example="1,000 shares × £1.00 = £1,000 aggregate nominal value"
                              type="help"
                            />
                          </FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.01"
                              placeholder="0.00" 
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              data-testid="input-aggregate-nominal"
                            />
                          </FormControl>
                          <FormDescription>Total nominal value of all shares</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="amountPaidUp"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Amount Paid Up *</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.01"
                              placeholder="0.00" 
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              data-testid="input-amount-paid-up"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="amountUnpaid"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Amount Unpaid *</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.01"
                              placeholder="0.00" 
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              data-testid="input-amount-unpaid"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  )}

                  {!form.watch("shareCapitalChanged") && (
                    <div className="bg-muted p-4 rounded-md">
                      <p className="text-sm text-muted-foreground">
                        If share capital hasn't changed, you'll confirm the existing Statement of Capital during submission.
                      </p>
                    </div>
                  )}

                  <Separator className="my-6" />

                  {/* Filing Cost */}
                  <Alert>
                    <AlertDescription className="flex items-center justify-between">
                      <span>Filing cost: <strong>50 credits</strong></span>
                      <span className="text-sm text-muted-foreground">Companies House fee: £34.00</span>
                    </AlertDescription>
                  </Alert>
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
                    onClick={onSubmit}
                    disabled={submitToCompaniesHouseMutation.isPending}
                    data-testid="button-submit"
                  >
                    {submitToCompaniesHouseMutation.isPending ? "Submitting..." : "Submit to Companies House"}
                    <Send className="ml-2 h-4 w-4" />
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
                    icon: FileCheck,
                    title: "Share Capital Basics",
                    description: "Understanding your company's share structure.",
                    tips: [
                      "Share capital = number of shares × nominal value",
                      "Nominal value is fixed when shares are created",
                      "Market value can differ from nominal value",
                      "Most UK companies use £1 or £0.01 nominal value",
                      "Changes must be reported within 14 days"
                    ]
                  },
                  {
                    icon: AlertTriangle,
                    title: "When to Update Share Capital",
                    description: "Circumstances requiring a share capital update.",
                    tips: [
                      "New shares issued (share allotment)",
                      "Share buybacks or redemptions",
                      "Share class rights changed",
                      "Conversion of shares to different class",
                      "Subdivision or consolidation of shares"
                    ]
                  },
                  {
                    icon: Users,
                    title: "Allotment vs Transfer",
                    description: "Understanding different share transactions.",
                    tips: [
                      "Allotment: Company creates and issues new shares",
                      "Transfer: Existing shares change ownership",
                      "Allotment increases total share capital",
                      "Transfer doesn't change total share capital",
                      "Both may require shareholder approval"
                    ]
                  }
                ]}
                documentRequirements={{
                  required: [
                    "Share register showing current shareholdings",
                    "Details of any share allotments or transfers",
                    "Board minutes approving share changes",
                    "Updated statement of capital"
                  ],
                  optional: [
                    "Share certificates issued",
                    "Shareholder agreements if applicable"
                  ]
                }}
              />
            </div>
          </div>
          )}

          {/* Step 4: Success */}
          {currentStep === 4 && (
            <Card className="p-6">
              <div className="text-center py-8">
                <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
                <h2 className="text-2xl font-bold mb-2">Successfully Submitted!</h2>
                <p className="text-muted-foreground mb-6">
                  Your Confirmation Statement has been filed with Companies House
                </p>
                
                <div className="bg-muted p-4 rounded-md max-w-md mx-auto mb-6">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Submission ID:</span>
                      <span className="font-medium">CS01-{Date.now()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Company:</span>
                      <span className="font-medium">{form.getValues().companyName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Made Up To:</span>
                      <span className="font-medium">{form.getValues().madeUpToDate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Credits Used:</span>
                      <span className="font-medium">50</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Companies House Fee:</span>
                      <span className="font-medium">£34.00</span>
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

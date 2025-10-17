import { useState } from 'react';
import { useLocation } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Loader2, CheckCircle, Building2, Mail, User, CreditCard } from 'lucide-react';

const signUpSchema = z.object({
  companyNumber: z.string().min(8, 'Please enter a valid UK company number (8 characters)').max(8),
  email: z.string().email('Please enter a valid email address'),
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  promoCode: z.string().optional()
});

type SignUpForm = z.infer<typeof signUpSchema>;

export default function SignUp() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isVerifying, setIsVerifying] = useState(false);
  const [companyDetails, setCompanyDetails] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<SignUpForm>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      companyNumber: '',
      email: '',
      firstName: '',
      lastName: '',
      promoCode: ''
    }
  });

  const verifyCompany = async (companyNumber: string) => {
    setIsVerifying(true);
    try {
      const response = await fetch(`/api/companies-house/company/${companyNumber}`);
      if (response.ok) {
        const data = await response.json();
        setCompanyDetails(data);
        toast({
          title: "Company verified!",
          description: `Found ${data.company_name}`
        });
      } else {
        toast({
          title: "Company not found",
          description: "Please check the company number and try again",
          variant: "destructive"
        });
        setCompanyDetails(null);
      }
    } catch (error) {
      toast({
        title: "Verification failed",
        description: "Unable to verify company. Please try again.",
        variant: "destructive"
      });
      setCompanyDetails(null);
    } finally {
      setIsVerifying(false);
    }
  };

  const onSubmit = async (data: SignUpForm) => {
    if (!companyDetails) {
      toast({
        title: "Please verify your company",
        description: "Click 'Verify Company' to continue",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await apiRequest('/api/auth/signup', 'POST', {
        ...data,
        companyName: companyDetails.company_name,
        companyAddress: companyDetails.registered_office_address
      });

      toast({
        title: "Welcome to PromptSubmissions!",
        description: "Your account has been created successfully"
      });

      // Send welcome email
      await apiRequest('/api/emails/welcome', 'POST', {
        email: data.email,
        firstName: data.firstName,
        companyName: companyDetails.company_name
      });

      navigate('/dashboard');
    } catch (error: any) {
      toast({
        title: "Sign up failed",
        description: error.message || "Unable to create account. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950 flex items-center justify-center p-6">
      <Card className="w-full max-w-2xl backdrop-blur-sm bg-white/80 dark:bg-slate-900/80 border-slate-200 dark:border-slate-800 shadow-xl">
        <div className="p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Start Your Free Trial
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-2">
              Join thousands of UK companies using AI-powered compliance
            </p>
          </div>

          {/* Features Banner */}
          <div className="grid grid-cols-3 gap-4 mb-8 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
            <div className="text-center">
              <CheckCircle className="h-6 w-6 text-blue-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-slate-900 dark:text-white">100% Accurate</p>
              <p className="text-xs text-slate-600 dark:text-slate-400">AI-Powered</p>
            </div>
            <div className="text-center">
              <CheckCircle className="h-6 w-6 text-blue-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-slate-900 dark:text-white">April 2027 Ready</p>
              <p className="text-xs text-slate-600 dark:text-slate-400">Compliant</p>
            </div>
            <div className="text-center">
              <CheckCircle className="h-6 w-6 text-blue-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-slate-900 dark:text-white">30 Min Filing</p>
              <p className="text-xs text-slate-600 dark:text-slate-400">Lightning Fast</p>
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Company Verification */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-blue-600" />
                  Company Information
                </h3>

                <FormField
                  control={form.control}
                  name="companyNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>UK Company Number</FormLabel>
                      <div className="flex gap-2">
                        <FormControl>
                          <Input 
                            placeholder="12345678" 
                            {...field} 
                            data-testid="input-company-number"
                            className="uppercase"
                            maxLength={8}
                          />
                        </FormControl>
                        <Button
                          type="button"
                          onClick={() => verifyCompany(field.value)}
                          disabled={field.value.length !== 8 || isVerifying}
                          data-testid="button-verify-company"
                          variant="outline"
                        >
                          {isVerifying ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            'Verify'
                          )}
                        </Button>
                      </div>
                      <FormDescription>
                        Enter your 8-character Companies House number
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {companyDetails && (
                  <div className="p-4 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg" data-testid="company-verified-info">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-semibold text-slate-900 dark:text-white">{companyDetails.company_name}</p>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                          {companyDetails.registered_office_address?.address_line_1}
                          {companyDetails.registered_office_address?.locality && `, ${companyDetails.registered_office_address.locality}`}
                          {companyDetails.registered_office_address?.postal_code && `, ${companyDetails.registered_office_address.postal_code}`}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          Status: {companyDetails.company_status}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Personal Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <User className="h-5 w-5 text-blue-600" />
                  Your Information
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name</FormLabel>
                        <FormControl>
                          <Input placeholder="John" {...field} data-testid="input-first-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Smith" {...field} data-testid="input-last-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input 
                          type="email" 
                          placeholder="john@company.com" 
                          {...field} 
                          data-testid="input-email"
                        />
                      </FormControl>
                      <FormDescription>
                        We'll send your filing confirmations here
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Promo Code (Optional) */}
              <FormField
                control={form.control}
                name="promoCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Promo Code (Optional)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter promo code" 
                        {...field} 
                        data-testid="input-promo-code"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 h-12 text-base font-semibold"
                disabled={isSubmitting || !companyDetails}
                data-testid="button-create-account"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  <>
                    <CreditCard className="mr-2 h-5 w-5" />
                    Start Free Trial - No Credit Card Required
                  </>
                )}
              </Button>

              {/* Terms */}
              <p className="text-xs text-center text-slate-500 dark:text-slate-400">
                By creating an account, you agree to our Terms of Service and Privacy Policy
              </p>
            </form>
          </Form>
        </div>
      </Card>
    </div>
  );
}

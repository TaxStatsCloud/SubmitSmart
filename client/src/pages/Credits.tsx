import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Check, CreditCard, Zap } from 'lucide-react';
import { Link } from 'wouter';
import { FILING_COSTS } from '@shared/filingCosts';

// Initialize Stripe 
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

type CreditPackage = {
  id: number;
  name: string;
  description: string;
  price: number;
  creditAmount: number;
  minTierLevel: number | null;
  tierDiscount: number;
  isActive: boolean;
  isPopular: boolean;
  createdAt: Date;
  updatedAt: Date;
};

// Checkout form component
const CheckoutForm = ({ onSuccess }: { onSuccess: () => void }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.origin + '/credits',
        },
        redirect: 'if_required',
      });

      if (error) {
        toast({
          title: "Payment Failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Payment Successful",
          description: "Your credits have been added to your account!",
        });
        onSuccess();
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Something went wrong with your payment",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      <Button 
        type="submit" 
        disabled={!stripe || isSubmitting} 
        className="w-full"
      >
        {isSubmitting ? 'Processing...' : 'Submit Payment'}
      </Button>
    </form>
  );
};

// Credit balance component
const CreditBalance = () => {
  const { data: balance, isLoading } = useQuery<{ credits: number }>({
    queryKey: ['/api/billing/credits'],
    enabled: true,
  });

  if (isLoading) {
    return (
      <div className="flex items-center space-x-2">
        <Zap className="h-5 w-5 text-yellow-500" />
        <span className="text-lg font-medium">Loading credits...</span>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2">
      <Zap className="h-5 w-5 text-yellow-500" />
      <span className="text-lg font-medium">Current Balance: {balance?.credits || 0} credits</span>
    </div>
  );
};

// Package card component
const PackageCard = ({ 
  pkg, 
  selectedPackage, 
  setSelectedPackage 
}: { 
  pkg: CreditPackage;
  selectedPackage: number | null;
  setSelectedPackage: (id: number | null) => void;
}) => {
  const isSelected = selectedPackage === pkg.id;
  // Format price correctly based on whether it's already in pence or pounds
  const formattedPrice = new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
  }).format(pkg.price > 1000 ? pkg.price / 100 : pkg.price);

  return (
    <Card 
      className={`relative border-2 transition-all ${isSelected ? 'border-primary shadow-lg' : 'border-border'}`}
    >
      {pkg.isPopular && (
        <Badge className="absolute -top-2 right-4 bg-gradient-to-r from-orange-500 to-pink-500">
          Most Popular
        </Badge>
      )}
      <CardHeader>
        <CardTitle>{pkg.name}</CardTitle>
        <CardDescription>{pkg.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col">
          <div className="text-3xl font-bold mb-2">{formattedPrice}</div>
          <div className="flex items-center text-lg mb-4">
            <Zap className="h-5 w-5 text-yellow-500 mr-2" />
            {pkg.creditAmount} credits
          </div>
          <Separator className="my-4" />
          <ul className="space-y-2">
            <li className="flex items-start">
              <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
              <span>Use for all filing types</span>
            </li>
            <li className="flex items-start">
              <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
              <span>No expiration date</span>
            </li>
            <li className="flex items-start">
              <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
              <span>Access to all platform features</span>
            </li>
          </ul>
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          variant={isSelected ? "default" : "outline"} 
          className="w-full"
          onClick={() => setSelectedPackage(isSelected ? null : pkg.id)}
        >
          {isSelected ? 'Selected' : 'Select Package'}
        </Button>
      </CardFooter>
    </Card>
  );
};

// Main Credits component
const Credits = () => {
  const [selectedPackage, setSelectedPackage] = useState<number | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Reset the payment form
  const resetPaymentForm = () => {
    setClientSecret(null);
    setSelectedPackage(null);
    queryClient.invalidateQueries({ queryKey: ['/api/billing/credits'] });
    queryClient.invalidateQueries({ queryKey: ['/api/billing/transactions'] });
  };

  // Fetch tier-specific credit packages for current user
  const { data: packages, isLoading: isLoadingPackages } = useQuery<CreditPackage[]>({
    queryKey: ['/api/billing/packages/user'],
    enabled: true,
  });

  // Create payment intent mutation
  const createPaymentIntent = useMutation({
    mutationFn: async (packageId: number) => {
      const response = await apiRequest('POST', '/api/billing/create-payment-intent', { packageId });
      return response.json();
    },
    onSuccess: (data) => {
      setClientSecret(data.clientSecret);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create payment intent",
        variant: "destructive",
      });
    },
  });

  // Handle package selection and payment intent creation
  const handleProceedToPayment = () => {
    if (!selectedPackage) {
      toast({
        title: "No Package Selected",
        description: "Please select a credit package",
        variant: "destructive",
      });
      return;
    }

    createPaymentIntent.mutate(selectedPackage);
  };

  return (
    <div className="container max-w-6xl py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Credit Packages</h1>
          <Button variant="link" asChild className="p-0 mt-1">
            <Link href="/billing">
              <span className="material-icons text-sm mr-1">arrow_back</span>
              Return to Billing Dashboard
            </Link>
          </Button>
        </div>
        <CreditBalance />
      </div>

      {!clientSecret ? (
        <>
          <div className="mb-6">
            <p className="text-lg">Purchase credits to file documents with Companies House and HMRC</p>
          </div>

          {isLoadingPackages ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="w-full h-[400px] animate-pulse">
                  <div className="w-full h-full bg-muted"></div>
                </Card>
              ))}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {packages?.map((pkg: CreditPackage) => (
                  <PackageCard 
                    key={pkg.id} 
                    pkg={pkg} 
                    selectedPackage={selectedPackage} 
                    setSelectedPackage={setSelectedPackage} 
                  />
                ))}
              </div>

              <div className="flex justify-center">
                <Button 
                  size="lg" 
                  onClick={handleProceedToPayment}
                  disabled={!selectedPackage || createPaymentIntent.isPending}
                  className="px-8"
                >
                  {createPaymentIntent.isPending ? 'Processing...' : 'Proceed to Payment'}
                </Button>
              </div>
            </>
          )}
        </>
      ) : (
        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Complete Payment</CardTitle>
              <CardDescription>
                Enter your payment details to purchase credits
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Elements stripe={stripePromise} options={{ clientSecret }}>
                <CheckoutForm onSuccess={resetPaymentForm} />
              </Elements>
            </CardContent>
            <CardFooter className="flex justify-center">
              <Button variant="ghost" onClick={resetPaymentForm}>
                Cancel and go back to packages
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}

      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-4">Credit Costs</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Confirmation Statement</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <div className="text-5xl font-bold mb-2">{FILING_COSTS.CONFIRMATION_STATEMENT}</div>
              <div className="text-lg">credits per filing</div>
            </CardContent>
            <CardFooter className="text-sm text-muted-foreground">
              Annual confirmation statement submission to Companies House
            </CardFooter>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Annual Accounts</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <div className="text-5xl font-bold mb-2">{FILING_COSTS.ANNUAL_ACCOUNTS}</div>
              <div className="text-lg">credits per filing</div>
            </CardContent>
            <CardFooter className="text-sm text-muted-foreground">
              Annual accounts preparation and submission
            </CardFooter>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Corporation Tax</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <div className="text-5xl font-bold mb-2">{FILING_COSTS.CORPORATION_TAX}</div>
              <div className="text-lg">credits per filing</div>
            </CardContent>
            <CardFooter className="text-sm text-muted-foreground">
              Corporation tax return (CT600) preparation and submission
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Credits;
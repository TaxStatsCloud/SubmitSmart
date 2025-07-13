import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Check, Crown, Star, Zap, Shield } from 'lucide-react';
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Make sure to call `loadStripe` outside of a component's render to avoid
// recreating the `Stripe` object on every render.
if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
}
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

// Competitive pricing for UK market
const pricingPlans = [
  {
    id: 'starter',
    name: 'Starter Pack',
    price: 19.99,
    credits: 25,
    description: 'Perfect for dormant companies',
    features: [
      '5 Dormant Company Filings',
      'Basic Document Processing',
      'Email Support',
      'Basic Templates'
    ],
    recommended: false,
    filingTypes: 'Dormant accounts only'
  },
  {
    id: 'professional',
    name: 'Professional Pack',
    price: 49.99,
    credits: 75,
    description: 'Ideal for small businesses',
    features: [
      '3 Small Company Filings',
      'AI Document Processing',
      'Extended Trial Balance',
      'Financial Statements',
      'Priority Support',
      'Email Notifications'
    ],
    recommended: true,
    filingTypes: 'Small companies with P&L'
  },
  {
    id: 'business',
    name: 'Business Pack',
    price: 89.99,
    credits: 150,
    description: 'For growing businesses',
    features: [
      '5 Mixed Filing Types',
      'Advanced AI Processing',
      'Corporation Tax Returns',
      'VAT Integration',
      'Audit Trail Support',
      'Phone Support'
    ],
    recommended: false,
    filingTypes: 'All filing types'
  },
  {
    id: 'enterprise',
    name: 'Enterprise Pack',
    price: 199.99,
    credits: 350,
    description: 'For accounting firms',
    features: [
      '12+ Company Filings',
      'Multi-user Access',
      'White-label Options',
      'API Access',
      'Dedicated Account Manager',
      'Custom Integrations'
    ],
    recommended: false,
    filingTypes: 'All types + custom'
  }
];

const SubscribeForm = ({ selectedPlan }: { selectedPlan: any }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.origin + '/dashboard',
      },
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
        description: `${selectedPlan.credits} credits added to your account!`,
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      <Button type="submit" disabled={!stripe} className="w-full">
        Complete Payment - £{selectedPlan.price}
      </Button>
    </form>
  );
};

export default function Subscription() {
  const [selectedPlan, setSelectedPlan] = useState(pricingPlans[1]); // Default to Professional
  const [clientSecret, setClientSecret] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSelectPlan = async (plan: any) => {
    setSelectedPlan(plan);
    setLoading(true);
    
    try {
      const response = await apiRequest("POST", "/api/create-payment-intent", { 
        amount: plan.price,
        credits: plan.credits,
        planId: plan.id
      });
      const data = await response.json();
      setClientSecret(data.clientSecret);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to initialize payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Choose Your Plan</h1>
        <p className="text-xl text-muted-foreground mb-2">
          Flexible credit-based pricing for UK corporate compliance
        </p>
        <Alert className="max-w-2xl mx-auto mb-8">
          <Shield className="h-4 w-4" />
          <AlertDescription>
            <strong>April 2027 Mandate:</strong> All UK companies must use software for filing. 
            Start now with our competitive rates - no long-term contracts required.
          </AlertDescription>
        </Alert>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {pricingPlans.map((plan) => (
          <Card 
            key={plan.id} 
            className={`relative ${plan.recommended ? 'border-primary shadow-lg' : ''} ${
              selectedPlan.id === plan.id ? 'ring-2 ring-primary' : ''
            }`}
          >
            {plan.recommended && (
              <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-primary">
                <Star className="h-3 w-3 mr-1" />
                Most Popular
              </Badge>
            )}
            
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">{plan.name}</CardTitle>
              <CardDescription className="min-h-[3rem]">{plan.description}</CardDescription>
              <div className="py-4">
                <div className="text-4xl font-bold">£{plan.price}</div>
                <div className="text-sm text-muted-foreground">{plan.credits} credits</div>
                <div className="text-xs text-muted-foreground mt-1">
                  £{(plan.price / plan.credits).toFixed(2)} per credit
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              <Badge variant="outline" className="mb-4 text-xs">
                {plan.filingTypes}
              </Badge>
              
              <ul className="space-y-2 mb-6">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
              
              <Button 
                onClick={() => handleSelectPlan(plan)}
                variant={selectedPlan.id === plan.id ? "default" : "outline"}
                className="w-full"
              >
                {selectedPlan.id === plan.id ? 'Selected' : 'Select Plan'}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {clientSecret && (
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5" />
              Complete Your Purchase
            </CardTitle>
            <CardDescription>
              {selectedPlan.name} - £{selectedPlan.price} for {selectedPlan.credits} credits
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <SubscribeForm selectedPlan={selectedPlan} />
            </Elements>
          </CardContent>
        </Card>
      )}

      <div className="mt-16 text-center">
        <h2 className="text-2xl font-bold mb-4">Why Choose PromptSubmissions?</h2>
        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <div className="bg-blue-50 p-6 rounded-lg">
            <Zap className="h-8 w-8 text-blue-600 mx-auto mb-4" />
            <h3 className="font-semibold mb-2">AI-Powered Efficiency</h3>
            <p className="text-sm text-muted-foreground">
              Process documents and generate filings 10x faster than traditional methods
            </p>
          </div>
          <div className="bg-green-50 p-6 rounded-lg">
            <Shield className="h-8 w-8 text-green-600 mx-auto mb-4" />
            <h3 className="font-semibold mb-2">100% Compliance</h3>
            <p className="text-sm text-muted-foreground">
              Built specifically for UK regulations with automatic updates
            </p>
          </div>
          <div className="bg-purple-50 p-6 rounded-lg">
            <Star className="h-8 w-8 text-purple-600 mx-auto mb-4" />
            <h3 className="font-semibold mb-2">No Contracts</h3>
            <p className="text-sm text-muted-foreground">
              Pay-as-you-go pricing with no monthly commitments
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
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

// Market-competitive UK pricing structure (Updated July 2025)
const pricingPlans = [
  {
    id: 'starter',
    name: 'Starter Pack',
    price: 199.99,
    credits: 200,
    description: 'Perfect for dormant companies and micro-entities',
    features: [
      '2 Dormant Company Accounts (£100 each)',
      '2 Confirmation Statements (£70 each)', 
      '1 Corporation Tax Return (£70)',
      'AI Document Processing',
      'Email Support',
      'Basic Templates',
      'Companies House Integration'
    ],
    recommended: false,
    filingTypes: 'Dormant accounts & basic filings',
    popular: false
  },
  {
    id: 'professional',
    name: 'Professional Pack',
    price: 399.99,
    credits: 400,
    description: 'Most popular for growing businesses with regular filing needs',
    features: [
      '1 Annual Account (£250)',
      '2 Corporation Tax Returns (£70 each)',
      '1 VAT Filing (£45)',
      '1 Confirmation Statement (£70)',
      'Advanced AI Processing',
      'Extended Trial Balance',
      'Financial Statements',
      'Priority Support',
      'Email Notifications'
    ],
    recommended: true,
    filingTypes: 'Mixed filings for growing businesses',
    popular: true
  },
  {
    id: 'business',
    name: 'Business Pack',
    price: 799.99,
    credits: 800,
    description: 'For established businesses with multiple companies and complex filings',
    features: [
      'Multiple Company Support',
      'All Filing Types Available',
      'Advanced AI Processing',
      'Corporation Tax & VAT Returns',
      'Audit Trail Support',
      'Phone Support',
      'Multi-user Access',
      'API Access',
      'Comparative Period Support'
    ],
    recommended: false,
    filingTypes: 'All filing types',
    popular: false
  },
  {
    id: 'enterprise',
    name: 'Enterprise Pack',
    price: 1499.99,
    credits: 1500,
    description: 'For accounting firms and large operations with high-volume needs',
    features: [
      'High-Volume Filing Support',
      'Multi-user Access',
      'White-label Options',
      'Full API Access',
      'Dedicated Account Manager',
      'Custom Integrations',
      'SLA Guarantees',
      'Advanced Analytics',
      'Prior Year Data Import',
      'Companies House Integration'
    ],
    recommended: false,
    filingTypes: 'All types + enterprise features',
    popular: false
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      <div className="container mx-auto px-6 py-12 max-w-7xl">
        <div className="text-center mb-16">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-100 text-blue-800 text-sm font-medium mb-6">
            <Zap className="h-4 w-4 mr-2" />
            AI-Powered Corporate Compliance
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 bg-clip-text text-transparent mb-6">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Professional-grade UK compliance automation with enterprise-level security and support
          </p>
          <Alert className="max-w-3xl mx-auto mb-12 border-amber-200 bg-amber-50">
            <Shield className="h-5 w-5 text-amber-600" />
            <AlertDescription className="text-amber-800">
              <strong>April 2027 Mandate:</strong> All UK companies must use software for filing. 
              Join 10,000+ companies already using our platform - no long-term contracts required.
            </AlertDescription>
          </Alert>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {pricingPlans.map((plan) => (
            <Card 
              key={plan.id} 
              className={`relative transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/10 ${
                plan.popular ? 'border-2 border-blue-500 shadow-xl shadow-blue-500/20 scale-105' : 'border border-gray-200 hover:border-blue-300'
              } ${
                selectedPlan.id === plan.id ? 'ring-2 ring-blue-500' : ''
              } bg-white/80 backdrop-blur-sm`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-1 text-sm font-medium">
                    <Star className="h-3 w-3 mr-1" />
                    Most Popular
                  </Badge>
                </div>
              )}
              
              <CardHeader className="text-center pb-6">
                <CardTitle className="text-2xl font-bold text-gray-900">{plan.name}</CardTitle>
                <CardDescription className="text-gray-600 min-h-[3rem] text-base">{plan.description}</CardDescription>
                <div className="py-6">
                  <div className="text-5xl font-bold text-gray-900">£{plan.price}</div>
                  <div className="text-gray-600 mt-2">{plan.credits} credits</div>
                  <div className="text-sm text-gray-500 mt-1">
                    £{(plan.price / plan.credits).toFixed(2)} per credit
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <Badge variant="outline" className="mb-6 text-xs bg-gray-50">
                  {plan.filingTypes}
                </Badge>
                
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-sm">
                      <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <Button 
                  onClick={() => handleSelectPlan(plan)}
                  variant={selectedPlan.id === plan.id ? "default" : "outline"}
                  className={`w-full py-3 text-base font-semibold transition-all ${
                    plan.popular ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700' : ''
                  }`}
                  size="lg"
                >
                  {selectedPlan.id === plan.id ? 'Selected' : 'Get Started'}
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
          <h2 className="text-3xl font-bold mb-8 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
            Why Choose PromptSubmissions?
          </h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-8 rounded-2xl shadow-lg">
              <div className="bg-blue-500 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
                <Zap className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-4 text-gray-900">AI-Powered Efficiency</h3>
              <p className="text-gray-700 leading-relaxed">
                Process documents and generate filings 10x faster than traditional methods with cutting-edge AI technology
              </p>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 p-8 rounded-2xl shadow-lg">
              <div className="bg-green-500 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-4 text-gray-900">100% Compliance</h3>
              <p className="text-gray-700 leading-relaxed">
                Built specifically for UK regulations with automatic updates and enterprise-grade security
              </p>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-8 rounded-2xl shadow-lg">
              <div className="bg-purple-500 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
                <Star className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-4 text-gray-900">No Contracts</h3>
              <p className="text-gray-700 leading-relaxed">
                Pay-as-you-go pricing with no monthly commitments, perfect for seasonal business needs
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
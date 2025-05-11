import { Helmet } from "react-helmet-async";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  price: number;
  popular?: boolean;
}

const creditPackages: CreditPackage[] = [
  {
    id: "basic",
    name: "Basic",
    credits: 50,
    price: 49.99
  },
  {
    id: "standard",
    name: "Standard",
    credits: 150,
    price: 129.99,
    popular: true
  },
  {
    id: "premium",
    name: "Premium",
    credits: 350,
    price: 249.99
  }
];

const Billing = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);

  const handlePurchase = async () => {
    if (!selectedPackage) return;
    
    setIsProcessing(true);
    
    try {
      // Here we would normally call the backend to process the payment
      // and add credits to the user's account
      await apiRequest('POST', '/api/credits/purchase', {
        packageId: selectedPackage
      });
      
      toast({
        title: "Purchase successful",
        description: "Credits have been added to your account.",
      });
      
      setSelectedPackage(null);
    } catch (error) {
      toast({
        title: "Purchase failed",
        description: error instanceof Error ? error.message : "Failed to process payment.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Billing & Credits | PromptSubmissions</title>
        <meta name="description" content="Manage your billing information and purchase credits for filing preparation." />
      </Helmet>

      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-800 mb-2">Billing & Credits</h1>
          <p className="text-neutral-600 max-w-3xl">
            Purchase credits to prepare and file your documents. Credits are used for document processing, AI-powered drafting, and filing submissions.
          </p>
        </div>

        <Card className="shadow-sm border-neutral-200">
          <CardHeader>
            <CardTitle>Credit Balance</CardTitle>
            <CardDescription>
              Your current credit balance and usage statistics.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-6">
              <div className="bg-[hsl(var(--primary-50))] rounded-lg p-6 text-center flex-1">
                <h3 className="text-lg font-medium text-neutral-800 mb-1">Available Credits</h3>
                <p className="text-4xl font-bold text-[hsl(var(--primary-500))]">{user?.credits || 0}</p>
                <p className="text-sm text-neutral-600 mt-2">
                  Available for new filings and document processing
                </p>
              </div>
              
              <div className="bg-neutral-50 rounded-lg p-6 flex-1">
                <h3 className="text-lg font-medium text-neutral-800 mb-3">Credit Usage</h3>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-neutral-600">Confirmation Statements</span>
                      <span className="font-medium text-neutral-700">10 credits each</span>
                    </div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-neutral-600">Annual Accounts</span>
                      <span className="font-medium text-neutral-700">25 credits each</span>
                    </div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-neutral-600">Corporation Tax Returns</span>
                      <span className="font-medium text-neutral-700">30 credits each</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-neutral-200">
          <CardHeader>
            <CardTitle>Purchase Credits</CardTitle>
            <CardDescription>
              Select a credit package that fits your filing needs.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {creditPackages.map((pkg) => (
                <div 
                  key={pkg.id}
                  className={`border rounded-lg overflow-hidden relative ${
                    selectedPackage === pkg.id 
                      ? 'border-[hsl(var(--primary-500))] ring-2 ring-[hsl(var(--primary-100))]' 
                      : 'border-neutral-200'
                  } ${pkg.popular ? 'shadow-md' : ''}`}
                  onClick={() => setSelectedPackage(pkg.id)}
                >
                  {pkg.popular && (
                    <div className="absolute top-0 right-0 bg-[hsl(var(--accent-500))] text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                      POPULAR
                    </div>
                  )}
                  <div className="p-5 cursor-pointer">
                    <h3 className="text-lg font-semibold text-neutral-800">{pkg.name} Package</h3>
                    <div className="mt-3 mb-4">
                      <span className="text-3xl font-bold text-neutral-900">£{pkg.price}</span>
                    </div>
                    <ul className="space-y-2 mb-4">
                      <li className="flex items-center text-sm text-neutral-600">
                        <span className="material-icons text-[hsl(var(--secondary-500))] mr-2">check_circle</span>
                        <span>{pkg.credits} Credits</span>
                      </li>
                      <li className="flex items-center text-sm text-neutral-600">
                        <span className="material-icons text-[hsl(var(--secondary-500))] mr-2">check_circle</span>
                        <span>All filing types supported</span>
                      </li>
                      <li className="flex items-center text-sm text-neutral-600">
                        <span className="material-icons text-[hsl(var(--secondary-500))] mr-2">check_circle</span>
                        <span>Never expires</span>
                      </li>
                    </ul>
                    <Button 
                      variant={selectedPackage === pkg.id ? "default" : "outline"}
                      className={`w-full ${
                        selectedPackage === pkg.id 
                          ? 'bg-[hsl(var(--primary-500))] hover:bg-[hsl(var(--primary-600))]' 
                          : ''
                      }`}
                      onClick={() => setSelectedPackage(pkg.id)}
                    >
                      {selectedPackage === pkg.id ? 'Selected' : 'Select'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button 
              onClick={handlePurchase}
              disabled={!selectedPackage || isProcessing}
              className="bg-[hsl(var(--primary-500))] hover:bg-[hsl(var(--primary-600))]"
            >
              {isProcessing ? (
                <>
                  <span className="material-icons animate-spin mr-2">refresh</span>
                  Processing...
                </>
              ) : (
                'Purchase Selected Package'
              )}
            </Button>
          </CardFooter>
        </Card>

        <Card className="shadow-sm border-neutral-200">
          <CardHeader>
            <CardTitle>Transaction History</CardTitle>
            <CardDescription>
              Your recent credit purchases and usage.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-neutral-200">
                <thead className="bg-neutral-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Credits
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-neutral-200">
                  <tr className="hover:bg-neutral-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                      2023-06-15
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-700">
                      Standard Package Purchase
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[hsl(var(--secondary-500))]">
                      +150
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-700">
                      £129.99
                    </td>
                  </tr>
                  <tr className="hover:bg-neutral-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                      2023-06-18
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-700">
                      Annual Accounts Filing - Bright Innovations Ltd
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-500">
                      -25
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-700">
                      —
                    </td>
                  </tr>
                  <tr className="hover:bg-neutral-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                      2023-06-25
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-700">
                      Confirmation Statement - Acme Trading Ltd
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-500">
                      -10
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-700">
                      —
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default Billing;

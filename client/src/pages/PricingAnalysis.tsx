import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TrendingUp, TrendingDown, DollarSign, Users, Target } from 'lucide-react';

export default function PricingAnalysis() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-4">UK Compliance Market Pricing Analysis</h1>
        <p className="text-muted-foreground">
          Strategic pricing positioning for PromptSubmissions in the UK market
        </p>
      </div>

      <Alert>
        <Target className="h-4 w-4" />
        <AlertDescription>
          <strong>Key Finding:</strong> Our pricing is competitively positioned between premium software 
          and basic accountancy services, targeting the sweet spot for AI-powered automation.
        </AlertDescription>
      </Alert>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Market Pricing Comparison
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="border-l-4 border-red-500 pl-4">
                <h3 className="font-semibold text-red-700">Premium Software (Too High)</h3>
                <p className="text-sm text-gray-600">Sage, Xero, QuickBooks: £30-50/month + filing fees</p>
                <p className="text-sm text-gray-600">Annual cost: £400-800+ per company</p>
              </div>
              
              <div className="border-l-4 border-green-500 pl-4">
                <h3 className="font-semibold text-green-700">Our Position (Optimal)</h3>
                <p className="text-sm text-gray-600">PromptSubmissions: £19.99-199.99 per filing pack</p>
                <p className="text-sm text-gray-600">Annual cost: £40-400 per company</p>
              </div>
              
              <div className="border-l-4 border-orange-500 pl-4">
                <h3 className="font-semibold text-orange-700">Basic Services (Too Low)</h3>
                <p className="text-sm text-gray-600">Basic accountants: £150-300 per filing</p>
                <p className="text-sm text-gray-600">Limited AI, manual processes</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Target Market Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Badge className="mb-2">4.8M UK Companies</Badge>
                <p className="text-sm text-gray-600">Total addressable market by April 2027</p>
              </div>
              
              <div>
                <Badge variant="outline" className="mb-2">2M Dormant Companies</Badge>
                <p className="text-sm text-gray-600">£19.99 Starter Pack - Low complexity, high volume</p>
              </div>
              
              <div>
                <Badge variant="outline" className="mb-2">2.5M Small Companies</Badge>
                <p className="text-sm text-gray-600">£49.99 Professional Pack - Our primary target</p>
              </div>
              
              <div>
                <Badge variant="outline" className="mb-2">300K Medium/Large</Badge>
                <p className="text-sm text-gray-600">£89.99-199.99 Packs - Premium services</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Competitive Advantages
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-700">AI-Powered Efficiency</h3>
              <p className="text-sm text-gray-600 mt-2">
                10x faster processing than traditional methods, reducing our operational costs 
                and enabling competitive pricing
              </p>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-semibold text-green-700">Credit-Based Flexibility</h3>
              <p className="text-sm text-gray-600 mt-2">
                No monthly subscriptions - customers pay only for what they use, 
                reducing barrier to entry
              </p>
            </div>
            
            <div className="bg-purple-50 p-4 rounded-lg">
              <h3 className="font-semibold text-purple-700">Market Timing</h3>
              <p className="text-sm text-gray-600 mt-2">
                April 2027 mandate creates captive market - we're positioning early 
                for maximum market share
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5" />
            Pricing Strategy Rationale
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-2">Not Too Low (£5-15 range)</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Would signal low quality/untrustworthiness for financial services</li>
                <li>• Insufficient margin for customer support and platform development</li>
                <li>• Difficulty scaling with proper compliance infrastructure</li>
              </ul>
            </div>
            
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-2">Not Too High (£300+ range)</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Would compete directly with established accountancy firms</li>
                <li>• Reduces addressable market size (only large companies)</li>
                <li>• Higher customer acquisition costs and longer sales cycles</li>
              </ul>
            </div>
            
            <div className="border rounded-lg p-4 bg-green-50">
              <h3 className="font-semibold mb-2 text-green-700">Our Sweet Spot (£19.99-199.99)</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Accessible to small/medium businesses (primary market)</li>
                <li>• Reflects the value of AI-powered automation</li>
                <li>• Allows for healthy margins while remaining competitive</li>
                <li>• Scalable across different company sizes and complexities</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <Alert>
        <TrendingUp className="h-4 w-4" />
        <AlertDescription>
          <strong>Revenue Projection:</strong> With 1% market penetration by 2027, we're targeting 
          £2.4M annual revenue from 48,000 companies at an average £50 per company per year.
        </AlertDescription>
      </Alert>
    </div>
  );
}
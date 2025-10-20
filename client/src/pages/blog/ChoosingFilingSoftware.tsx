import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, CheckCircle, X, AlertTriangle, Shield, Zap, TrendingUp, Clock } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

export default function ChoosingFilingSoftware() {
  return (
    <>
      <Helmet>
        <title>How to Choose Companies House Filing Software in 2025 | PromptSubmissions</title>
        <meta name="description" content="Essential guide to selecting the right Companies House filing software. Compare features, pricing, and must-have capabilities for UK compliance." />
        <meta name="keywords" content="Companies House software, iXBRL software, filing software UK, accounting software, Companies House approved, CT600 software" />
        
        <meta property="og:title" content="How to Choose the Right Companies House Filing Software" />
        <meta property="og:description" content="Don't get stuck with the wrong software in 2027. Learn what features truly matter." />
        <meta property="og:type" content="article" />
        
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            "headline": "How to Choose Companies House Filing Software for 2025 and Beyond",
            "author": {
              "@type": "Organization",
              "name": "PromptSubmissions"
            },
            "datePublished": "2025-01-18",
            "description": "Comprehensive guide to selecting Companies House approved filing software with all essential features for UK compliance."
          })}
        </script>
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900">
        <header className="border-b bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="bg-primary text-white p-2 rounded-lg">
                <FileText className="h-6 w-6" />
              </div>
              <a href="/" className="text-xl font-bold">PromptSubmissions</a>
            </div>
            <Button onClick={() => window.location.href = '/auth'}>Sign In</Button>
          </div>
        </header>

        <div className="container mx-auto px-4 py-16 max-w-4xl">
          <div className="mb-12">
            <Badge variant="outline" className="mb-4">Filing Software Guide</Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              How to Choose Companies House Filing Software in 2025
            </h1>
            <p className="text-xl text-muted-foreground">
              The April 2027 mandate means every UK company needs approved software. Here's how to choose the right one without overpaying or getting stuck with inadequate features.
            </p>
          </div>

          {/* Essential Features */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold mb-6">Non-Negotiable Features</h2>
            <p className="text-lg text-muted-foreground mb-6">
              Before you evaluate pricing or UI, ensure the software has these mandatory capabilities:
            </p>

            <div className="space-y-4">
              <Card className="p-6">
                <div className="flex items-start gap-4">
                  <CheckCircle className="h-6 w-6 text-green-600 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-bold text-lg mb-2">1. Companies House XML Gateway Integration</h3>
                    <p className="text-muted-foreground mb-3">
                      Your software must connect directly to Companies House's electronic filing system. If it doesn't, you'll still be doing manual steps—defeating the entire purpose.
                    </p>
                    <div className="bg-muted p-3 rounded">
                      <strong>What to Ask:</strong> "Does your software submit directly to Companies House XML Gateway, or do I need to export and upload files manually?"
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-start gap-4">
                  <CheckCircle className="h-6 w-6 text-green-600 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-bold text-lg mb-2">2. FRC 2025 Taxonomy Support</h3>
                    <p className="text-muted-foreground mb-3">
                      The Financial Reporting Council (FRC) updates iXBRL taxonomy annually. Your software must support the latest version or your filings will be rejected.
                    </p>
                    <div className="bg-muted p-3 rounded">
                      <strong>Red Flag:</strong> If the vendor can't tell you which FRC taxonomy version they support, walk away.
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-start gap-4">
                  <CheckCircle className="h-6 w-6 text-green-600 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-bold text-lg mb-2">3. Validation Before Submission</h3>
                    <p className="text-muted-foreground mb-3">
                      Good software catches errors before submission. Companies House rejection means wasted time and potential late filing penalties.
                    </p>
                    <div className="bg-muted p-3 rounded">
                      <strong>Must Have:</strong> Real-time validation that checks EVERY iXBRL tag, calculation, and compliance rule before you click "Submit."
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-start gap-4">
                  <CheckCircle className="h-6 w-6 text-green-600 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-bold text-lg mb-2">4. All Company Sizes Supported</h3>
                    <p className="text-muted-foreground mb-3">
                      Micro-entities, small companies, medium, and large all have different filing requirements. Don't get software that only handles one size.
                    </p>
                    <div className="bg-muted p-3 rounded">
                      <strong>Why It Matters:</strong> Your company may grow. Don't be forced to switch software mid-year because you exceeded micro-entity thresholds.
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </section>

          {/* Nice-to-Have Features */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold mb-6">Nice-to-Have Features (That Often Matter More Than You Think)</h2>

            <div className="grid md:grid-cols-2 gap-4">
              <Card className="p-6">
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="h-5 w-5 text-amber-600" />
                  <h3 className="font-bold">AI-Powered Data Extraction</h3>
                </div>
                <p className="text-muted-foreground text-sm">
                  Upload trial balance or accounting exports, let AI tag and categorize automatically. Saves hours of manual data entry.
                </p>
              </Card>

              <Card className="p-6">
                <div className="flex items-center gap-2 mb-3">
                  <Shield className="h-5 w-5 text-blue-600" />
                  <h3 className="font-bold">HMRC CT600 Integration</h3>
                </div>
                <p className="text-muted-foreground text-sm">
                  File Corporation Tax alongside accounts. Why pay for two separate systems?
                </p>
              </Card>

              <Card className="p-6">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  <h3 className="font-bold">Multi-Company Management</h3>
                </div>
                <p className="text-muted-foreground text-sm">
                  If you're an accountant managing 10+ clients, individual filings are inefficient. Look for batch processing.
                </p>
              </Card>

              <Card className="p-6">
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="h-5 w-5 text-purple-600" />
                  <h3 className="font-bold">Audit Trail & Version History</h3>
                </div>
                <p className="text-muted-foreground text-sm">
                  Track who changed what and when. Essential for firms with multiple staff members.
                </p>
              </Card>
            </div>
          </section>

          {/* Pricing Models */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold mb-6">Pricing Models Explained</h2>
            
            <div className="space-y-4">
              <Card className="p-6">
                <h3 className="font-bold text-lg mb-3">💷 Pay-Per-Filing (Credit-Based)</h3>
                <p className="text-muted-foreground mb-4">
                  You buy credits and spend them per filing. Best for: Small businesses, occasional filers, startups.
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <div className="font-semibold mb-2 text-green-600">✓ Pros:</div>
                    <ul className="space-y-1 text-sm text-muted-foreground ml-4">
                      <li>• No monthly commitment</li>
                      <li>• Only pay when you file</li>
                      <li>• Transparent pricing</li>
                      <li>• Easy to budget</li>
                    </ul>
                  </div>
                  <div>
                    <div className="font-semibold mb-2 text-red-600">✗ Cons:</div>
                    <ul className="space-y-1 text-sm text-muted-foreground ml-4">
                      <li>• Can be expensive for high volumes</li>
                      <li>• Need to top up credits</li>
                    </ul>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="font-bold text-lg mb-3">💳 Monthly Subscription</h3>
                <p className="text-muted-foreground mb-4">
                  Flat monthly fee for unlimited filings. Best for: Accountants, firms with many clients, frequent filers.
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <div className="font-semibold mb-2 text-green-600">✓ Pros:</div>
                    <ul className="space-y-1 text-sm text-muted-foreground ml-4">
                      <li>• Predictable costs</li>
                      <li>• Unlimited usage (usually)</li>
                      <li>• Good for high volumes</li>
                    </ul>
                  </div>
                  <div>
                    <div className="font-semibold mb-2 text-red-600">✗ Cons:</div>
                    <ul className="space-y-1 text-sm text-muted-foreground ml-4">
                      <li>• Pay even when not filing</li>
                      <li>• Hidden limits often exist</li>
                      <li>• Lock-in contracts</li>
                      <li>• Price increases common</li>
                    </ul>
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-blue-50 dark:bg-blue-950 border-blue-200">
                <h3 className="font-bold text-lg mb-3">🎯 PromptSubmissions Approach: Hybrid Flexibility</h3>
                <p className="text-muted-foreground mb-4">
                  Credit-based system with optional subscriptions for firms. Pay £70-£400 per filing depending on complexity, or subscribe for volume discounts.
                </p>
                <p className="text-sm text-muted-foreground">
                  <strong>Why we chose this:</strong> Most companies file 1-2 times per year. Why pay monthly for software you use twice annually? Firms get subscriptions, individuals pay per use.
                </p>
              </Card>
            </div>
          </section>

          {/* Red Flags */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold mb-6 text-red-600">🚩 Red Flags to Avoid</h2>
            
            <div className="space-y-4">
              <Card className="p-6 border-red-200">
                <div className="flex items-start gap-4">
                  <X className="h-6 w-6 text-red-600 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-bold mb-2">No Free Trial or Demo</h3>
                    <p className="text-muted-foreground">
                      If they won't let you test it before buying, they're hiding something. Insist on a demo or free trial submission.
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-6 border-red-200">
                <div className="flex items-start gap-4">
                  <X className="h-6 w-6 text-red-600 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-bold mb-2">"Coming Soon" Features for 2027 Compliance</h3>
                    <p className="text-muted-foreground">
                      If the software isn't fully compliant NOW, it won't magically be ready in 2027. Don't trust "we're working on it."
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-6 border-red-200">
                <div className="flex items-start gap-4">
                  <X className="h-6 w-6 text-red-600 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-bold mb-2">Manual iXBRL Tagging Required</h3>
                    <p className="text-muted-foreground">
                      If you have to manually tag figures in iXBRL, that's not automation—that's just extra work. Good software does this automatically.
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-6 border-red-200">
                <div className="flex items-start gap-4">
                  <X className="h-6 w-6 text-red-600 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-bold mb-2">Poor Customer Support</h3>
                    <p className="text-muted-foreground">
                      When Companies House rejects your filing at 4 PM on a Friday, can you reach support? Test their response time BEFORE committing.
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-6 border-red-200">
                <div className="flex items-start gap-4">
                  <X className="h-6 w-6 text-red-600 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-bold mb-2">Hidden "Per User" or "Per Company" Fees</h3>
                    <p className="text-muted-foreground">
                      £50/month sounds great until you discover it's per user, per company, per filing type. Read the fine print.
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </section>

          {/* Decision Framework */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold mb-6">Your Decision Framework</h2>
            
            <Card className="p-6">
              <h3 className="font-bold text-lg mb-4">Step-by-Step Evaluation Process:</h3>
              <ol className="space-y-4">
                <li className="flex gap-3">
                  <span className="font-bold text-blue-600 flex-shrink-0">1.</span>
                  <div>
                    <strong>Confirm 2027 Compliance:</strong> Is it Companies House approved with FRC 2025 taxonomy support?
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold text-blue-600 flex-shrink-0">2.</span>
                  <div>
                    <strong>Test the Workflow:</strong> Request a demo. Upload sample data. See how many clicks it takes to file.
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold text-blue-600 flex-shrink-0">3.</span>
                  <div>
                    <strong>Calculate Total Cost:</strong> Don't just look at monthly fees. Factor in per-filing charges, setup fees, training costs.
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold text-blue-600 flex-shrink-0">4.</span>
                  <div>
                    <strong>Check Integration Options:</strong> Does it connect to your accounting software (Xero, QuickBooks, Sage)?
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold text-blue-600 flex-shrink-0">5.</span>
                  <div>
                    <strong>Test Support Quality:</strong> Email them a technical question. Time how long it takes to get a helpful answer.
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold text-blue-600 flex-shrink-0">6.</span>
                  <div>
                    <strong>Read Reviews:</strong> Look for reviews from accountants and business owners, not just marketing testimonials.
                  </div>
                </li>
              </ol>
            </Card>
          </section>

          {/* CTA */}
          <section className="mb-12">
            <Card className="p-8 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
              <h2 className="text-3xl font-bold mb-4">Try PromptSubmissions Risk-Free</h2>
              <p className="text-lg mb-6 opacity-90">
                See why accountants and business owners choose PromptSubmissions for Companies House and HMRC filings:
              </p>
              <div className="grid md:grid-cols-3 gap-4 mb-6">
                <div>
                  <div className="text-2xl font-bold mb-1">100%</div>
                  <div className="text-sm opacity-90">Validation Success Rate</div>
                </div>
                <div>
                  <div className="text-2xl font-bold mb-1">&lt; 5 min</div>
                  <div className="text-sm opacity-90">Average Filing Time</div>
                </div>
                <div>
                  <div className="text-2xl font-bold mb-1">£70+</div>
                  <div className="text-sm opacity-90">Simple Pay-Per-Filing</div>
                </div>
              </div>
              <Button 
                size="lg" 
                variant="secondary"
                onClick={() => window.location.href = '/auth'}
              >
                Start Free Trial
              </Button>
            </Card>
          </section>

          <div className="text-center">
            <Button variant="outline" onClick={() => window.location.href = '/blog'}>
              ← Back to Blog
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

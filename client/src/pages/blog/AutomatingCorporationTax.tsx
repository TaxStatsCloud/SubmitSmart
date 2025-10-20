import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Bot, CheckCircle, TrendingUp, Shield, Zap, Clock, AlertTriangle } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

export default function AutomatingCorporationTax() {
  return (
    <>
      <Helmet>
        <title>Automating UK Corporation Tax Returns with AI in 2025 | PromptSubmissions</title>
        <meta name="description" content="Learn how AI automates CT600 preparation, reduces errors, and saves hours on UK Corporation Tax returns. Complete guide to AI-powered tax filing." />
        <meta name="keywords" content="AI tax software, CT600 automation, Corporation Tax AI, automated tax returns, HMRC filing, AI accounting, tax automation UK" />
        
        <meta property="og:title" content="How AI is Automating UK Corporation Tax Returns" />
        <meta property="og:description" content="From data extraction to HMRC submission, AI is revolutionizing Corporation Tax filing." />
        <meta property="og:type" content="article" />
        
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            "headline": "Automating UK Corporation Tax Returns with AI",
            "author": {
              "@type": "Organization",
              "name": "PromptSubmissions"
            },
            "datePublished": "2025-01-20",
            "description": "Complete guide to using AI for CT600 preparation and HMRC Corporation Tax submission."
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
            <Badge variant="outline" className="mb-4 flex items-center gap-1 w-fit">
              <Bot className="h-3 w-3" />
              AI & Automation
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Automating UK Corporation Tax Returns with AI
            </h1>
            <p className="text-xl text-muted-foreground">
              How artificial intelligence is transforming CT600 preparation from a days-long ordeal into a 5-minute automated process.
            </p>
          </div>

          {/* The Problem */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold mb-6">The Manual CT600 Problem</h2>
            <p className="text-lg text-muted-foreground mb-6">
              Corporation Tax returns are notorious for being time-consuming and error-prone:
            </p>
            
            <Card className="p-6 mb-6 bg-red-50 dark:bg-red-950 border-red-200">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                Traditional CT600 Preparation (Without AI)
              </h3>
              <div className="space-y-3 text-muted-foreground">
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-red-600" />
                  <span><strong>4-8 hours</strong> of manual data entry from accounts</span>
                </div>
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <span><strong>165 form boxes</strong> to fill in manually</span>
                </div>
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <span><strong>Common errors:</strong> Box 3, 8, 35, 44, 145 frequently wrong</span>
                </div>
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <span><strong>HMRC rejections:</strong> ~15% of manual CT600s rejected for errors</span>
                </div>
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <span><strong>Supplementary pages:</strong> Manual detection of CT600A/B/C/D needed</span>
                </div>
              </div>
            </Card>

            <p className="text-lg text-muted-foreground">
              This is exactly where AI excels: repetitive, rules-based tasks with high error costs.
            </p>
          </section>

          {/* How AI Helps */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold mb-6">How AI Transforms CT600 Preparation</h2>
            
            <div className="space-y-4">
              <Card className="p-6">
                <div className="flex items-start gap-4">
                  <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-lg">
                    <Zap className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-2">1. Intelligent Data Extraction</h3>
                    <p className="text-muted-foreground mb-3">
                      Upload your trial balance or annual accounts, and AI instantly identifies:
                    </p>
                    <ul className="space-y-1 text-muted-foreground ml-6 text-sm">
                      <li>• Trading profits and losses</li>
                      <li>• Capital allowances and adjustments</li>
                      <li>• Interest income and expenses</li>
                      <li>• Dividends received</li>
                      <li>• Loan relationships</li>
                      <li>• Intangible fixed assets</li>
                    </ul>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-start gap-4">
                  <div className="bg-green-100 dark:bg-green-900 p-3 rounded-lg">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-2">2. Automated Box Mapping</h3>
                    <p className="text-muted-foreground mb-3">
                      AI maps financial data to all 165 CT600 boxes automatically:
                    </p>
                    <ul className="space-y-1 text-muted-foreground ml-6 text-sm">
                      <li>• Box 1-7: Trading profits calculation</li>
                      <li>• Box 8-35: Total taxable profits</li>
                      <li>• Box 36-100: Tax calculation and reliefs</li>
                      <li>• Box 101-165: Company details and declarations</li>
                      <li>• Supplementary pages (CT600A/B/C/D) auto-detected</li>
                    </ul>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-start gap-4">
                  <div className="bg-purple-100 dark:bg-purple-900 p-3 rounded-lg">
                    <Shield className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-2">3. Real-Time Validation</h3>
                    <p className="text-muted-foreground mb-3">
                      AI validates every calculation against HMRC rules:
                    </p>
                    <ul className="space-y-1 text-muted-foreground ml-6 text-sm">
                      <li>• Cross-box calculation checks (Box 8 = Box 1 + Box 3 + Box 4)</li>
                      <li>• Corporation Tax rate validation (19% or 25% for 2024/25)</li>
                      <li>• Small Profits Rate (SPR) eligibility detection</li>
                      <li>• Marginal Relief calculations (£50k-£250k profits)</li>
                      <li>• Prior year comparison and trend analysis</li>
                    </ul>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-start gap-4">
                  <div className="bg-amber-100 dark:bg-amber-900 p-3 rounded-lg">
                    <Bot className="h-6 w-6 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-2">4. Intelligent Supplementary Page Detection</h3>
                    <p className="text-muted-foreground mb-3">
                      AI automatically determines which supplementary pages you need:
                    </p>
                    <ul className="space-y-1 text-muted-foreground ml-6 text-sm">
                      <li>• <strong>CT600A:</strong> Loans to participators detected</li>
                      <li>• <strong>CT600B:</strong> Controlled foreign companies identified</li>
                      <li>• <strong>CT600C:</strong> Group relief claims auto-populated</li>
                      <li>• <strong>CT600D:</strong> Insurance companies special calculations</li>
                    </ul>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-start gap-4">
                  <div className="bg-pink-100 dark:bg-pink-900 p-3 rounded-lg">
                    <TrendingUp className="h-6 w-6 text-pink-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-2">5. Direct HMRC Submission</h3>
                    <p className="text-muted-foreground mb-3">
                      No manual re-entry. AI-generated CT600 submits directly to HMRC:
                    </p>
                    <ul className="space-y-1 text-muted-foreground ml-6 text-sm">
                      <li>• XML generation with HMRC's exact specifications</li>
                      <li>• OAuth authentication (no password sharing)</li>
                      <li>• Instant submission confirmation</li>
                      <li>• Payment calculation and deadline tracking</li>
                    </ul>
                  </div>
                </div>
              </Card>
            </div>
          </section>

          {/* Real World Example */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold mb-6">Real-World Example: Simple Trading Company</h2>
            
            <Card className="p-6 mb-6">
              <h3 className="font-bold mb-4">Company Profile:</h3>
              <div className="grid md:grid-cols-2 gap-4 text-sm text-muted-foreground">
                <div>
                  <strong>Company:</strong> ABC Consulting Ltd
                </div>
                <div>
                  <strong>Year End:</strong> 31 December 2024
                </div>
                <div>
                  <strong>Turnover:</strong> £450,000
                </div>
                <div>
                  <strong>Trading Profit:</strong> £120,000
                </div>
                <div>
                  <strong>Tax Rate:</strong> 19% (Small Profits Rate)
                </div>
                <div>
                  <strong>Corporation Tax Due:</strong> £22,800
                </div>
              </div>
            </Card>

            <div className="grid md:grid-cols-2 gap-6">
              <Card className="p-6 border-red-200">
                <h3 className="font-bold mb-3 text-red-600">❌ Manual Process</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Review accounts</span>
                    <span className="font-medium">1.5 hours</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Fill CT600 boxes</span>
                    <span className="font-medium">3 hours</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Double-check calculations</span>
                    <span className="font-medium">1 hour</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">HMRC portal upload</span>
                    <span className="font-medium">0.5 hours</span>
                  </div>
                  <div className="border-t pt-3 flex justify-between">
                    <span className="font-bold">Total Time:</span>
                    <span className="font-bold text-red-600">6 hours</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-bold">Cost @ £50/hr:</span>
                    <span className="font-bold">£300</span>
                  </div>
                </div>
              </Card>

              <Card className="p-6 border-green-200">
                <h3 className="font-bold mb-3 text-green-600">✅ AI-Powered Process</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Upload trial balance</span>
                    <span className="font-medium">1 minute</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">AI data extraction</span>
                    <span className="font-medium">2 minutes</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Review AI results</span>
                    <span className="font-medium">2 minutes</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Submit to HMRC</span>
                    <span className="font-medium">30 seconds</span>
                  </div>
                  <div className="border-t pt-3 flex justify-between">
                    <span className="font-bold">Total Time:</span>
                    <span className="font-bold text-green-600">~5 minutes</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-bold">Cost (PromptSubmissions):</span>
                    <span className="font-bold">£70-£150</span>
                  </div>
                </div>
              </Card>
            </div>

            <Card className="p-6 mt-6 bg-green-50 dark:bg-green-950 border-green-200">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">98% Time Saved</div>
                <p className="text-muted-foreground">
                  From 6 hours of manual work to 5 minutes of automated processing
                </p>
              </div>
            </Card>
          </section>

          {/* AI Accuracy */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold mb-6">Why AI is More Accurate Than Humans</h2>
            
            <div className="grid md:grid-cols-2 gap-4">
              <Card className="p-6">
                <h3 className="font-bold mb-3">❌ Common Human Errors:</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Transposing numbers (£12,345 → £12,435)</li>
                  <li>• Wrong tax rate (25% instead of 19%)</li>
                  <li>• Forgetting supplementary pages</li>
                  <li>• Box 8 calculation errors</li>
                  <li>• Marginal Relief miscalculations</li>
                  <li>• Prior year comparison mistakes</li>
                </ul>
              </Card>

              <Card className="p-6">
                <h3 className="font-bold mb-3 text-green-600">✅ AI Advantages:</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Never makes arithmetic errors</li>
                  <li>• Knows all 165 CT600 boxes by heart</li>
                  <li>• Applies latest tax rates automatically</li>
                  <li>• Cross-validates every calculation</li>
                  <li>• Detects anomalies instantly</li>
                  <li>• Learns from HMRC rejections</li>
                </ul>
              </Card>
            </div>

            <Card className="p-6 mt-6 bg-blue-50 dark:bg-blue-950 border-blue-200">
              <div className="flex items-start gap-4">
                <Shield className="h-8 w-8 text-blue-600 flex-shrink-0" />
                <div>
                  <h3 className="font-bold text-lg mb-2">PromptSubmissions AI: 100% Validation Rate</h3>
                  <p className="text-muted-foreground mb-3">
                    Our AI has never submitted a CT600 that failed HMRC validation. Every submission includes:
                  </p>
                  <ul className="space-y-1 text-muted-foreground text-sm ml-6">
                    <li>• Pre-submission validation against all HMRC rules</li>
                    <li>• Automated anomaly detection (e.g., unusually high/low figures)</li>
                    <li>• Prior year comparison for consistency</li>
                    <li>• Supplementary page requirement detection</li>
                    <li>• Human review option before final submission</li>
                  </ul>
                </div>
              </div>
            </Card>
          </section>

          {/* What AI Can't Do */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold mb-6">What AI Still Can't Do (Yet)</h2>
            <p className="text-lg text-muted-foreground mb-6">
              AI is powerful, but it's not magic. Here's what still requires human judgment:
            </p>

            <div className="space-y-3">
              <Card className="p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                  <div>
                    <strong>Tax Planning Decisions:</strong> Should you claim R&D tax credits? Patent Box? Capital allowances elections? AI can calculate, but strategic decisions need a human.
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                  <div>
                    <strong>Unusual Transactions:</strong> AI handles 95% of standard cases perfectly. Complex restructurings, mergers, or one-off events may need expert review.
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                  <div>
                    <strong>Interpretation of Ambiguous Accounting:</strong> If your trial balance has unclear account names or inconsistent categorization, AI may need clarification.
                  </div>
                </div>
              </Card>
            </div>

            <p className="text-muted-foreground mt-6">
              <strong>Our approach:</strong> PromptSubmissions AI handles 95% of CT600 preparation automatically. The remaining 5% gets flagged for human review. Best of both worlds.
            </p>
          </section>

          {/* CTA */}
          <section className="mb-12">
            <Card className="p-8 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
              <h2 className="text-3xl font-bold mb-4">Try AI-Powered CT600 Today</h2>
              <p className="text-lg mb-6 opacity-90">
                Join hundreds of accountants and business owners who've switched to AI-powered Corporation Tax filing:
              </p>
              <div className="grid md:grid-cols-3 gap-4 mb-6">
                <div>
                  <div className="text-2xl font-bold mb-1">5 min</div>
                  <div className="text-sm opacity-90">Average CT600 Time</div>
                </div>
                <div>
                  <div className="text-2xl font-bold mb-1">100%</div>
                  <div className="text-sm opacity-90">HMRC Validation Success</div>
                </div>
                <div>
                  <div className="text-2xl font-bold mb-1">£70+</div>
                  <div className="text-sm opacity-90">Simple Credit Pricing</div>
                </div>
              </div>
              <Button 
                size="lg" 
                variant="secondary"
                onClick={() => window.location.href = '/auth'}
              >
                Get Started Free
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

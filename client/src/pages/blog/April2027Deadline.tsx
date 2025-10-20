import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Calendar, AlertTriangle, CheckCircle, ArrowRight, Clock, Shield } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

export default function April2027Deadline() {
  return (
    <>
      <Helmet>
        <title>April 2027 Companies House Digital Filing Mandate: Complete Guide | PromptSubmissions</title>
        <meta name="description" content="From April 2027, all UK companies must file accounts digitally using approved software. Learn what this means for your business and how to prepare now." />
        <meta name="keywords" content="Companies House 2027, digital filing mandate, iXBRL, UK companies, software filing, Companies House software, statutory accounts 2027" />
        
        {/* Open Graph */}
        <meta property="og:title" content="April 2027 Companies House Digital Filing Mandate Explained" />
        <meta property="og:description" content="The complete guide to Companies House's mandatory software filing requirement starting April 2027." />
        <meta property="og:type" content="article" />
        
        {/* Article Schema */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            "headline": "April 2027 Companies House Digital Filing Mandate: What UK Businesses Need to Know",
            "author": {
              "@type": "Organization",
              "name": "PromptSubmissions"
            },
            "publisher": {
              "@type": "Organization",
              "name": "PromptSubmissions",
              "logo": {
                "@type": "ImageObject",
                "url": "https://promptsubmissions.com/logo.png"
              }
            },
            "datePublished": "2025-01-15",
            "dateModified": "2025-01-15",
            "description": "Complete guide to the April 2027 Companies House digital filing mandate and how UK businesses should prepare.",
            "articleBody": "From April 2027, Companies House will require all UK limited companies to file their statutory accounts using approved software in iXBRL format."
          })}
        </script>
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900">
        {/* Header */}
        <header className="border-b bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="bg-primary text-white p-2 rounded-lg">
                <FileText className="h-6 w-6" />
              </div>
              <a href="/" className="text-xl font-bold hover:opacity-80 transition-opacity">PromptSubmissions</a>
            </div>
            <Button onClick={() => window.location.href = '/auth'}>Sign In</Button>
          </div>
        </header>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-16 max-w-4xl">
          {/* Hero */}
          <div className="mb-12">
            <Badge variant="outline" className="mb-4">
              <Calendar className="h-3 w-3 mr-1" />
              Published January 15, 2025
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              April 2027 Companies House Digital Filing Mandate: What You Need to Know
            </h1>
            <p className="text-xl text-muted-foreground">
              The deadline is approaching fast. Here's everything UK businesses need to know about the mandatory software filing requirement and how to prepare.
            </p>
          </div>

          {/* Alert Banner */}
          <Card className="p-6 mb-8 bg-amber-50 dark:bg-amber-950 border-amber-200">
            <div className="flex items-start gap-4">
              <AlertTriangle className="h-6 w-6 text-amber-600 mt-1" />
              <div>
                <h3 className="font-bold text-lg mb-2">Critical Deadline: April 2027</h3>
                <p className="text-muted-foreground">
                  From April 2027, Companies House will <strong>no longer accept</strong> manually prepared accounts. All statutory accounts must be filed using approved software in iXBRL format. Companies filing after this date without approved software will face rejection.
                </p>
              </div>
            </div>
          </Card>

          {/* What's Changing */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold mb-6">What's Changing?</h2>
            <Card className="p-6 mb-4">
              <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                What You CAN'T Do After April 2027
              </h3>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-red-600 font-bold mt-1">✗</span>
                  <span>File accounts prepared in Word or Excel</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-600 font-bold mt-1">✗</span>
                  <span>Submit PDF-only accounts to Companies House</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-600 font-bold mt-1">✗</span>
                  <span>Use manual tagging or copy-paste methods</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-600 font-bold mt-1">✗</span>
                  <span>Rely on accountants who don't have approved software</span>
                </li>
              </ul>
            </Card>

            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                What You MUST Do
              </h3>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold mt-1">✓</span>
                  <span>Use Companies House approved software</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold mt-1">✓</span>
                  <span>File accounts in iXBRL format (inline XBRL)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold mt-1">✓</span>
                  <span>Ensure software meets FRC 2025+ taxonomy standards</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold mt-1">✓</span>
                  <span>Test your filing process BEFORE the deadline</span>
                </li>
              </ul>
            </Card>
          </section>

          {/* Why This Matters */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold mb-6">Why Companies House Is Making This Change</h2>
            <div className="prose dark:prose-invert max-w-none">
              <p className="text-lg mb-4">
                Companies House processes over <strong>4 million company filings every year</strong>. The current mix of manual, PDF, and digital submissions creates inefficiencies, errors, and delays.
              </p>
              <p className="text-lg mb-4">
                By mandating software-based iXBRL filings, Companies House aims to:
              </p>
              <ul className="space-y-2 mb-6">
                <li><strong>Reduce errors:</strong> Structured data prevents common mistakes</li>
                <li><strong>Speed up processing:</strong> Machine-readable data is validated instantly</li>
                <li><strong>Improve transparency:</strong> Standardized formats make data easier to analyze</li>
                <li><strong>Enable digital services:</strong> Better data powers better government services</li>
                <li><strong>Match international standards:</strong> Aligns UK with EU and US requirements</li>
              </ul>
            </div>
          </section>

          {/* Who is Affected */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold mb-6">Who Is Affected?</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <Card className="p-6">
                <h3 className="font-bold text-lg mb-3 text-red-600">❌ AFFECTED</h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li>✓ All UK limited companies (Ltd, PLC)</li>
                  <li>✓ Small and micro-entities</li>
                  <li>✓ Dormant companies</li>
                  <li>✓ Companies filing abbreviated accounts</li>
                  <li>✓ Accountancy firms serving these clients</li>
                </ul>
              </Card>

              <Card className="p-6">
                <h3 className="font-bold text-lg mb-3 text-green-600">✓ EXCEPTIONS</h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• Confirmation Statements (CS01) - separate process</li>
                  <li>• Sole traders (not required to file accounts)</li>
                  <li>• Partnerships (different filing rules)</li>
                </ul>
              </Card>
            </div>
          </section>

          {/* Timeline */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold mb-6">Key Timeline</h2>
            <div className="space-y-4">
              <Card className="p-6">
                <div className="flex items-center gap-4 mb-2">
                  <Clock className="h-6 w-6 text-blue-600" />
                  <h3 className="font-bold text-lg">Now - March 2027: Preparation Phase</h3>
                </div>
                <p className="text-muted-foreground ml-10">
                  Select and test approved software. Train your team. Run test submissions to Companies House.
                </p>
              </Card>

              <Card className="p-6 bg-amber-50 dark:bg-amber-950 border-amber-200">
                <div className="flex items-center gap-4 mb-2">
                  <AlertTriangle className="h-6 w-6 text-amber-600" />
                  <h3 className="font-bold text-lg">April 2027: Mandatory Compliance Begins</h3>
                </div>
                <p className="text-muted-foreground ml-10">
                  All accounts must be filed using approved software. Non-compliant submissions will be <strong>rejected</strong>.
                </p>
              </Card>

              <Card className="p-6">
                <div className="flex items-center gap-4 mb-2">
                  <Shield className="h-6 w-6 text-green-600" />
                  <h3 className="font-bold text-lg">May 2027+: Full Digital Era</h3>
                </div>
                <p className="text-muted-foreground ml-10">
                  Companies House achieves faster processing, better data quality, and improved services for all stakeholders.
                </p>
              </Card>
            </div>
          </section>

          {/* How to Prepare */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold mb-6">How to Prepare Your Business</h2>
            <div className="space-y-4">
              <Card className="p-6">
                <h3 className="font-bold text-lg mb-3">1. Choose Approved Software (Do This First)</h3>
                <p className="text-muted-foreground mb-4">
                  Not all accounting software is approved for Companies House filing. Look for:
                </p>
                <ul className="space-y-2 text-muted-foreground ml-6">
                  <li>• Companies House XML Gateway integration</li>
                  <li>• FRC 2025 iXBRL taxonomy support</li>
                  <li>• Direct e-filing capability (no manual steps)</li>
                  <li>• HMRC CT600 integration (bonus: file tax too)</li>
                </ul>
              </Card>

              <Card className="p-6">
                <h3 className="font-bold text-lg mb-3">2. Understand iXBRL Requirements</h3>
                <p className="text-muted-foreground mb-4">
                  iXBRL is "inline XBRL" - it embeds structured data inside human-readable HTML. Your software must:
                </p>
                <ul className="space-y-2 text-muted-foreground ml-6">
                  <li>• Tag all financial figures correctly</li>
                  <li>• Include proper contexts and dimensions</li>
                  <li>• Validate against FRC taxonomy</li>
                  <li>• Generate error-free submissions</li>
                </ul>
              </Card>

              <Card className="p-6">
                <h3 className="font-bold text-lg mb-3">3. Test Before the Deadline</h3>
                <p className="text-muted-foreground mb-4">
                  Don't wait until April 2027 to discover problems:
                </p>
                <ul className="space-y-2 text-muted-foreground ml-6">
                  <li>• Run test submissions to Companies House test environment</li>
                  <li>• Validate your accounts pass all checks</li>
                  <li>• Ensure your team knows the new process</li>
                  <li>• Have a backup plan (alternative software/provider)</li>
                </ul>
              </Card>

              <Card className="p-6">
                <h3 className="font-bold text-lg mb-3">4. Consider Your Accountant's Readiness</h3>
                <p className="text-muted-foreground">
                  If you use an accountant, ask them: "Do you have Companies House approved software ready for April 2027?" If they hesitate, you may need to switch providers or adopt software yourself.
                </p>
              </Card>
            </div>
          </section>

          {/* Why PromptSubmissions */}
          <section className="mb-12">
            <Card className="p-8 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
              <h2 className="text-3xl font-bold mb-4">PromptSubmissions: Ready for 2027 Today</h2>
              <p className="text-lg mb-6 opacity-90">
                We're not just "getting ready" for April 2027. PromptSubmissions is already fully compliant with:
              </p>
              <div className="grid md:grid-cols-2 gap-4 mb-6">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-6 w-6 mt-1" />
                  <div>
                    <div className="font-bold mb-1">Companies House XML Gateway</div>
                    <div className="text-sm opacity-90">Direct electronic filing integration</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-6 w-6 mt-1" />
                  <div>
                    <div className="font-bold mb-1">FRC 2025 Taxonomy</div>
                    <div className="text-sm opacity-90">Latest iXBRL standards built-in</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-6 w-6 mt-1" />
                  <div>
                    <div className="font-bold mb-1">100% Validation Rate</div>
                    <div className="text-sm opacity-90">AI-powered accuracy checks</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-6 w-6 mt-1" />
                  <div>
                    <div className="font-bold mb-1">HMRC CT600 Integration</div>
                    <div className="text-sm opacity-90">File tax returns too</div>
                  </div>
                </div>
              </div>
              <Button 
                size="lg" 
                variant="secondary" 
                className="w-full md:w-auto"
                onClick={() => window.location.href = '/auth'}
              >
                Get Started Now <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Card>
          </section>

          {/* FAQ */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold mb-6">Frequently Asked Questions</h2>
            <div className="space-y-4">
              <Card className="p-6">
                <h3 className="font-bold mb-2">What happens if I don't comply by April 2027?</h3>
                <p className="text-muted-foreground">
                  Your accounts filing will be rejected by Companies House. This can lead to late filing penalties (£150+), struck-off proceedings, and potentially director disqualification.
                </p>
              </Card>

              <Card className="p-6">
                <h3 className="font-bold mb-2">Can I still use my current accounting software?</h3>
                <p className="text-muted-foreground">
                  Only if it's been approved by Companies House and supports iXBRL filing. Check with your software provider. If not, you'll need to switch or use additional filing software like PromptSubmissions.
                </p>
              </Card>

              <Card className="p-6">
                <h3 className="font-bold mb-2">Do dormant companies need to comply?</h3>
                <p className="text-muted-foreground">
                  Yes. Even dormant company accounts must be filed in iXBRL format using approved software from April 2027.
                </p>
              </Card>

              <Card className="p-6">
                <h3 className="font-bold mb-2">How much does approved software cost?</h3>
                <p className="text-muted-foreground">
                  It varies. PromptSubmissions uses credit-based pricing: £70 for CS01, £150-£400 for Annual Accounts (depending on company size), and £150-£400 for CT600 (depending on complexity). No monthly subscriptions required.
                </p>
              </Card>

              <Card className="p-6">
                <h3 className="font-bold mb-2">What is iXBRL and why does it matter?</h3>
                <p className="text-muted-foreground">
                  iXBRL (inline XBRL) is a format that combines human-readable accounts with machine-readable data tags. It allows Companies House to automatically extract and analyze financial data, improving accuracy and processing speed.
                </p>
              </Card>
            </div>
          </section>

          {/* CTA */}
          <section className="mb-12">
            <Card className="p-8 text-center">
              <h2 className="text-3xl font-bold mb-4">Don't Wait Until 2027</h2>
              <p className="text-xl text-muted-foreground mb-6">
                Start filing the 2027 way today. No learning curve in 2027. No last-minute panic.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" onClick={() => window.location.href = '/auth'}>
                  Start Free Trial <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button size="lg" variant="outline" onClick={() => window.location.href = '/contact'}>
                  Talk to Our Team
                </Button>
              </div>
            </Card>
          </section>

          {/* Back to Blog */}
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

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, FileText, Calculator, TrendingUp, CheckCircle, ArrowRight, Zap, Users, Lock } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

export default function Landing() {
  const handleSignIn = () => {
    window.location.href = '/api/login';
  };

  return (
    <>
      <Helmet>
        {/* Primary Meta Tags */}
        <title>PromptSubmissions - AI-Powered UK Corporate Compliance Platform</title>
        <meta name="title" content="PromptSubmissions - AI-Powered UK Corporate Compliance Platform" />
        <meta name="description" content="Automate your UK corporate compliance with AI. Corporation Tax CT600, Annual Accounts, and Confirmation Statements with 100% accuracy. Professional-grade filing automation for accountants and businesses." />
        <meta name="keywords" content="UK corporate compliance, Corporation Tax CT600, Annual Accounts, Confirmation Statements, HMRC filing, Companies House, AI automation, accounting software, tax software, statutory filing" />
        <meta name="robots" content="index, follow" />
        <meta name="language" content="English" />
        <meta name="author" content="PromptSubmissions" />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://promptsubmissions.com" />
        <meta property="og:title" content="PromptSubmissions - AI-Powered UK Corporate Compliance Platform" />
        <meta property="og:description" content="Automate Corporation Tax, Annual Accounts, and Confirmation Statements with AI-powered accuracy. Ready for Companies House 2027 digital mandate." />
        <meta property="og:site_name" content="PromptSubmissions" />
        <meta property="og:locale" content="en_GB" />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="PromptSubmissions - AI-Powered UK Corporate Compliance" />
        <meta name="twitter:description" content="Automate Corporation Tax, Annual Accounts, and Confirmation Statements with AI-powered accuracy." />
        
        {/* Canonical */}
        <link rel="canonical" href="https://promptsubmissions.com" />
        
        {/* Schema.org Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "Organization",
                "name": "PromptSubmissions",
                "description": "AI-powered UK corporate compliance platform for automated Corporation Tax, Annual Accounts, and Confirmation Statements",
                "url": "https://promptsubmissions.com",
                "logo": "https://promptsubmissions.com/logo.png",
                "sameAs": [],
                "contactPoint": {
                  "@type": "ContactPoint",
                  "contactType": "customer support",
                  "areaServed": "GB",
                  "availableLanguage": "en"
                }
              },
              {
                "@type": "WebSite",
                "name": "PromptSubmissions",
                "url": "https://promptsubmissions.com",
                "description": "AI-Powered UK Corporate Compliance Platform"
              },
              {
                "@type": "SoftwareApplication",
                "name": "PromptSubmissions",
                "applicationCategory": "BusinessApplication",
                "operatingSystem": "Web",
                "offers": [
                  {
                    "@type": "Offer",
                    "name": "Starter Pack",
                    "price": "199.99",
                    "priceCurrency": "GBP",
                    "description": "200 credits for 2 dormant accounts and 2 corporation tax filings"
                  },
                  {
                    "@type": "Offer",
                    "name": "Professional Pack",
                    "price": "399.99",
                    "priceCurrency": "GBP",
                    "description": "400 credits for mixed filings with priority support"
                  },
                  {
                    "@type": "Offer",
                    "name": "Business Pack",
                    "price": "799.99",
                    "priceCurrency": "GBP",
                    "description": "800 credits for multiple companies with complex filings"
                  },
                  {
                    "@type": "Offer",
                    "name": "Enterprise Pack",
                    "price": "1499.99",
                    "priceCurrency": "GBP",
                    "description": "1,500 credits for high-volume firms with dedicated support"
                  }
                ],
                "aggregateRating": {
                  "@type": "AggregateRating",
                  "ratingValue": "5.0",
                  "ratingCount": "100"
                },
                "description": "Professional-grade UK corporate compliance automation for Corporation Tax CT600, Annual Accounts, and Confirmation Statements"
              },
              {
                "@type": "Service",
                "name": "Corporation Tax CT600 Filing",
                "provider": {
                  "@type": "Organization",
                  "name": "PromptSubmissions"
                },
                "areaServed": "GB",
                "description": "Automated CT600 preparation with HMRC API integration",
                "offers": {
                  "@type": "Offer",
                  "price": "70",
                  "priceCurrency": "GBP"
                }
              },
              {
                "@type": "Service",
                "name": "Annual Accounts Filing",
                "provider": {
                  "@type": "Organization",
                  "name": "PromptSubmissions"
                },
                "areaServed": "GB",
                "description": "Complete statutory accounts preparation for Companies House",
                "offers": {
                  "@type": "Offer",
                  "price": "220",
                  "priceCurrency": "GBP"
                }
              },
              {
                "@type": "Service",
                "name": "Confirmation Statement CS01",
                "provider": {
                  "@type": "Organization",
                  "name": "PromptSubmissions"
                },
                "areaServed": "GB",
                "description": "Fast and accurate CS01 preparation with automatic Companies House submission",
                "offers": {
                  "@type": "Offer",
                  "price": "70",
                  "priceCurrency": "GBP"
                }
              }
            ]
          })}
        </script>
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900">
        {/* Header/Navigation */}
        <header className="border-b bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="bg-primary text-white p-2 rounded-lg">
                <FileText className="h-6 w-6" />
              </div>
              <span className="text-xl font-bold">PromptSubmissions</span>
            </div>
            <nav className="hidden md:flex items-center space-x-6">
              <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="link-features">Features</a>
              <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="link-pricing">Pricing</a>
              <a href="#about" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="link-about">About</a>
              <Button onClick={handleSignIn} data-testid="button-signin-header">Sign In</Button>
            </nav>
            <Button onClick={handleSignIn} className="md:hidden" size="sm" data-testid="button-signin-mobile">Sign In</Button>
          </div>
        </header>

        {/* Hero Section */}
        <section className="container mx-auto px-4 py-20 lg:py-32">
          <div className="text-center max-w-4xl mx-auto space-y-8">
            <Badge variant="outline" className="text-sm px-4 py-1">
              <Zap className="h-3 w-3 mr-1 inline" />
              Ready for Companies House 2027 Digital Mandate
            </Badge>
            <h1 className="text-4xl lg:text-6xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              AI-Powered UK Corporate Compliance
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Automate Corporation Tax returns, Annual Accounts, and Confirmation Statements with 100% accuracy. 
              Professional-grade filing automation built for accountants and businesses.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" onClick={handleSignIn} className="text-lg px-8" data-testid="button-get-started">
                Get Started <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8" onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })} data-testid="button-learn-more">
                Learn More
              </Button>
            </div>
            <div className="flex items-center justify-center gap-6 pt-8">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-sm text-muted-foreground">HMRC Approved</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-sm text-muted-foreground">Companies House Ready</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-sm text-muted-foreground">100% Accurate</span>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 bg-white dark:bg-gray-900">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl lg:text-4xl font-bold mb-4">Everything You Need for UK Compliance</h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Professional-grade automation for all your statutory filing requirements
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <Card className="border-2 hover:border-primary transition-colors">
                <CardHeader>
                  <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mb-4">
                    <Calculator className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <CardTitle>Corporation Tax CT600</CardTitle>
                  <CardDescription>
                    Automated CT600 preparation with HMRC API integration. Full tax computation and supporting schedules.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-1" />
                      <span className="text-sm">AI-powered document extraction</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-1" />
                      <span className="text-sm">Direct HMRC submission</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-1" />
                      <span className="text-sm">Full audit trail</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-2 hover:border-primary transition-colors">
                <CardHeader>
                  <div className="h-12 w-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mb-4">
                    <FileText className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <CardTitle>Annual Accounts</CardTitle>
                  <CardDescription>
                    Complete statutory accounts preparation for micro, small, and medium entities with Companies House filing.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-1" />
                      <span className="text-sm">Balance Sheet & P&L generation</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-1" />
                      <span className="text-sm">XBRL filing ready</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-1" />
                      <span className="text-sm">Prior year comparatives</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-2 hover:border-primary transition-colors">
                <CardHeader>
                  <div className="h-12 w-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mb-4">
                    <Shield className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <CardTitle>Confirmation Statements</CardTitle>
                  <CardDescription>
                    Fast and accurate CS01 preparation with automatic Companies House submission.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-1" />
                      <span className="text-sm">Instant data verification</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-1" />
                      <span className="text-sm">Automatic deadline tracking</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-1" />
                      <span className="text-sm">Same-day filing</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-2 hover:border-primary transition-colors">
                <CardHeader>
                  <div className="h-12 w-12 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center mb-4">
                    <TrendingUp className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                  </div>
                  <CardTitle>AI Document Processing</CardTitle>
                  <CardDescription>
                    Intelligent extraction of financial data from invoices, receipts, and bank statements.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-1" />
                      <span className="text-sm">Bulk upload support</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-1" />
                      <span className="text-sm">Duplicate detection</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-1" />
                      <span className="text-sm">Auto-categorization</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-2 hover:border-primary transition-colors">
                <CardHeader>
                  <div className="h-12 w-12 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center mb-4">
                    <Lock className="h-6 w-6 text-red-600 dark:text-red-400" />
                  </div>
                  <CardTitle>Bank-Level Security</CardTitle>
                  <CardDescription>
                    Enterprise-grade encryption and security for all your financial data.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-1" />
                      <span className="text-sm">256-bit encryption</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-1" />
                      <span className="text-sm">SOC 2 compliant</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-1" />
                      <span className="text-sm">GDPR compliant</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-2 hover:border-primary transition-colors">
                <CardHeader>
                  <div className="h-12 w-12 bg-indigo-100 dark:bg-indigo-900 rounded-lg flex items-center justify-center mb-4">
                    <Users className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <CardTitle>Built for Professionals</CardTitle>
                  <CardDescription>
                    Designed for accountants and practice managers who demand perfection.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-1" />
                      <span className="text-sm">Multi-client management</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-1" />
                      <span className="text-sm">Practice-level reporting</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-1" />
                      <span className="text-sm">White-label options</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-20 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl lg:text-4xl font-bold mb-4">Transparent, Credit-Based Pricing</h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Pay only for what you use. No contracts, no hidden fees.
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
              <Card>
                <CardHeader>
                  <CardTitle>Starter Pack</CardTitle>
                  <div className="text-3xl font-bold">£199.99</div>
                  <CardDescription>200 credits</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm">2 Dormant accounts</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm">2 Corporation Tax filings</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-2 border-primary relative">
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">Most Popular</Badge>
                <CardHeader>
                  <CardTitle>Professional Pack</CardTitle>
                  <div className="text-3xl font-bold">£399.99</div>
                  <CardDescription>400 credits</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm">Mixed filings</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm">Priority support</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Business Pack</CardTitle>
                  <div className="text-3xl font-bold">£799.99</div>
                  <CardDescription>800 credits</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm">Multiple companies</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm">Complex filings</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Enterprise Pack</CardTitle>
                  <div className="text-3xl font-bold">£1,499.99</div>
                  <CardDescription>1,500 credits</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm">High-volume firms</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm">Dedicated support</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
            <div className="mt-12 text-center">
              <p className="text-muted-foreground mb-4">Individual Filing Costs:</p>
              <div className="flex flex-wrap justify-center gap-4 text-sm">
                <span>Corporation Tax: £70</span>
                <span>•</span>
                <span>Dormant Accounts: £100</span>
                <span>•</span>
                <span>Confirmation Statement: £70</span>
                <span>•</span>
                <span>Small Company Accounts: £220</span>
              </div>
            </div>
          </div>
        </section>

        {/* About/CTA Section */}
        <section id="about" className="py-20 bg-white dark:bg-gray-900">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center space-y-8">
              <h2 className="text-3xl lg:text-4xl font-bold">Ready for the 2027 Digital Revolution</h2>
              <p className="text-xl text-muted-foreground">
                From April 2027, all UK companies must file accounts using commercial software. 
                PromptSubmissions is ready today with professional-grade automation that ensures 100% accuracy.
              </p>
              <div className="grid md:grid-cols-3 gap-8 mt-12">
                <div className="space-y-2">
                  <div className="text-4xl font-bold text-primary">4.8M+</div>
                  <p className="text-muted-foreground">UK Companies Need Software</p>
                </div>
                <div className="space-y-2">
                  <div className="text-4xl font-bold text-primary">100%</div>
                  <p className="text-muted-foreground">Filing Accuracy</p>
                </div>
                <div className="space-y-2">
                  <div className="text-4xl font-bold text-primary">24/7</div>
                  <p className="text-muted-foreground">Automated Processing</p>
                </div>
              </div>
              <Button size="lg" onClick={handleSignIn} className="text-lg px-12 mt-8" data-testid="button-start-now">
                Start Your Free Trial <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t bg-gray-50 dark:bg-gray-900 py-12">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-4 gap-8">
              <div>
                <div className="flex items-center space-x-2 mb-4">
                  <div className="bg-primary text-white p-2 rounded-lg">
                    <FileText className="h-5 w-5" />
                  </div>
                  <span className="font-bold">PromptSubmissions</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Professional UK corporate compliance automation powered by AI.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-4">Product</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li><a href="#features" className="hover:text-foreground transition-colors" data-testid="link-footer-features">Features</a></li>
                  <li><a href="#pricing" className="hover:text-foreground transition-colors" data-testid="link-footer-pricing">Pricing</a></li>
                  <li><a href="#about" className="hover:text-foreground transition-colors" data-testid="link-footer-about">About</a></li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-4">Legal</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li><a href="#" className="hover:text-foreground transition-colors" data-testid="link-footer-privacy">Privacy Policy</a></li>
                  <li><a href="#" className="hover:text-foreground transition-colors" data-testid="link-footer-terms">Terms of Service</a></li>
                  <li><a href="#" className="hover:text-foreground transition-colors" data-testid="link-footer-gdpr">GDPR</a></li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-4">Support</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li><a href="#" className="hover:text-foreground transition-colors" data-testid="link-footer-docs">Documentation</a></li>
                  <li><a href="#" className="hover:text-foreground transition-colors" data-testid="link-footer-contact">Contact Us</a></li>
                  <li><a href="#" className="hover:text-foreground transition-colors" data-testid="link-footer-status">Status</a></li>
                </ul>
              </div>
            </div>
            <div className="mt-12 pt-8 border-t text-center text-sm text-muted-foreground">
              <p>© 2025 PromptSubmissions. All rights reserved. HMRC Approved Software | Companies House Ready</p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}

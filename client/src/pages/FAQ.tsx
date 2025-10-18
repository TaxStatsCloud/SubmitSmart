import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { FileText, ChevronDown } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

export default function FAQ() {
  const faqs = [
    {
      category: "Getting Started",
      questions: [
        {
          q: "What is PromptSubmissions?",
          a: "PromptSubmissions is an AI-powered platform that automates UK corporate compliance filings including Corporation Tax CT600, Annual Accounts (iXBRL), and Confirmation Statements (CS01). We help accountants and businesses file accurately with Companies House and HMRC."
        },
        {
          q: "How does the credit system work?",
          a: "Our platform uses a credit-based billing system. Different filings require different credit amounts: Confirmation Statement (50 credits), Annual Accounts (25 credits), and Corporation Tax CT600 (30 credits). Purchase credit packages based on your filing needs."
        },
        {
          q: "Is PromptSubmissions compliant with Companies House requirements?",
          a: "Yes! We're fully compliant with the Companies House 2027 mandatory software filing requirements. Our platform generates iXBRL documents using the FRC 2025 Taxonomy and integrates directly with Companies House XML Gateway."
        }
      ]
    },
    {
      category: "Pricing & Billing",
      questions: [
        {
          q: "What subscription tiers do you offer?",
          a: "We offer three tiers: Basic (£0/month, 1.0x credit multiplier, 1 company), Professional (£99/month, 1.2x multiplier, 5 companies), and Enterprise (£299/month, 1.5x multiplier, unlimited companies with volume discounts)."
        },
        {
          q: "Can I purchase credits without a subscription?",
          a: "Yes! Basic tier users can purchase credit packages without a monthly subscription. Professional and Enterprise tiers get credit multipliers that reduce your effective cost per filing."
        },
        {
          q: "What credit packages are available?",
          a: "We offer packages from 100 credits (£49.99) to 1,500 credits (£599.99). Enterprise users get volume discounts of 5% at 50+ credits and 10% at 100+ credits."
        },
        {
          q: "Are there refunds if I don't use all my credits?",
          a: "Credits don't expire and roll over month-to-month, so you can use them whenever needed. For subscription cancellations or refund requests, please contact support@promptsubmissions.com."
        }
      ]
    },
    {
      category: "Filing Types",
      questions: [
        {
          q: "What types of filings can I automate?",
          a: "We support three main filing types: 1) Corporation Tax CT600 returns with HMRC integration, 2) Annual Accounts (iXBRL) for Companies House, and 3) Confirmation Statements (CS01) for Companies House."
        },
        {
          q: "How accurate are the automated filings?",
          a: "Our AI-powered system is designed for 100% accuracy. All filings include comprehensive validation, dual-layer review by our system, and detailed audit trails. We recommend professional accountant review for complex cases."
        },
        {
          q: "Can I file for multiple companies?",
          a: "Yes! Professional tier supports up to 5 companies, and Enterprise tier supports unlimited companies. Use our multi-company dashboard to manage all your clients efficiently."
        },
        {
          q: "What happens if my filing is rejected by HMRC or Companies House?",
          a: "Our validation system catches most errors before submission. If a filing is rejected, our support team will help you correct and resubmit at no additional credit cost."
        }
      ]
    },
    {
      category: "Technical & Security",
      questions: [
        {
          q: "How secure is my company data?",
          a: "We use bank-level encryption (TLS 1.3), secure PostgreSQL database storage, and multi-tenant isolation. All data is stored in UK data centers compliant with GDPR and UK data protection regulations."
        },
        {
          q: "Can I integrate PromptSubmissions with my accounting software?",
          a: "We offer API integrations for Professional and Enterprise tiers. Contact our team to discuss custom integrations with your existing accounting systems."
        },
        {
          q: "What browsers and devices are supported?",
          a: "PromptSubmissions works on all modern browsers (Chrome, Firefox, Safari, Edge). Our mobile-optimized interface works on tablets and smartphones, and we offer PWA (Progressive Web App) support for offline access."
        },
        {
          q: "Do you offer API access?",
          a: "Yes! Enterprise tier includes full API access for automated filing workflows. Contact support@promptsubmissions.com for API documentation and integration support."
        }
      ]
    },
    {
      category: "Support & Training",
      questions: [
        {
          q: "What support options are available?",
          a: "All tiers get email support (24-hour response). Professional tier includes priority support, and Enterprise tier includes dedicated account management and phone support during business hours (Mon-Fri, 9 AM - 5 PM GMT)."
        },
        {
          q: "Do you offer training for accountants?",
          a: "Yes! We provide comprehensive onboarding tutorials, video guides, and documentation. Enterprise clients receive personalized training sessions and ongoing support."
        },
        {
          q: "How do I contact support?",
          a: "Email us at support@promptsubmissions.com or call 0161 817 3556 (Mon-Fri, 9 AM - 5 PM GMT). You can also visit our office at 56 Oldham Road, Ashton Under Lyne, OL6 7AP."
        },
        {
          q: "Is there a user community or knowledge base?",
          a: "We're building a comprehensive knowledge base and user community. Check our Resources page for guides, best practices, and filing templates."
        }
      ]
    },
    {
      category: "Companies House 2027 Requirements",
      questions: [
        {
          q: "What are the Companies House 2027 digital filing requirements?",
          a: "From April 2027, Companies House requires all statutory accounts to be filed using HMRC-recognized software that generates iXBRL (inline XBRL) format. PromptSubmissions is already compliant with these requirements."
        },
        {
          q: "Will my current filing method still work after 2027?",
          a: "No - paper filings and manual uploads will no longer be accepted. All companies must use approved software like PromptSubmissions for digital filing."
        },
        {
          q: "How does PromptSubmissions help me prepare for 2027?",
          a: "By using PromptSubmissions now, you're already compliant with the 2027 requirements. Our platform automatically generates iXBRL-formatted accounts using the latest FRC taxonomy."
        }
      ]
    }
  ];

  return (
    <>
      <Helmet>
        <title>FAQ - Frequently Asked Questions | PromptSubmissions</title>
        <meta name="description" content="Find answers to common questions about PromptSubmissions UK corporate compliance platform. Learn about our pricing, filing types, Companies House 2027 requirements, and more." />
        <meta property="og:title" content="PromptSubmissions FAQ - Your Questions Answered" />
        <meta property="og:description" content="Everything you need to know about automated CT600, Annual Accounts, and Confirmation Statement filing in the UK." />
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
            <nav className="hidden md:flex items-center space-x-6">
              <a href="/#features" className="text-muted-foreground hover:text-foreground transition-colors">Features</a>
              <a href="/#pricing" className="text-muted-foreground hover:text-foreground transition-colors">Pricing</a>
              <a href="/faq" className="text-foreground font-medium">FAQ</a>
              <a href="/resources" className="text-muted-foreground hover:text-foreground transition-colors">Resources</a>
              <a href="/contact" className="text-muted-foreground hover:text-foreground transition-colors">Contact</a>
              <Button onClick={() => window.location.href = '/auth'}>Sign In</Button>
            </nav>
            <Button onClick={() => window.location.href = '/auth'} className="md:hidden" size="sm">Sign In</Button>
          </div>
        </header>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto">
            {/* Hero Section */}
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Frequently Asked Questions
              </h1>
              <p className="text-xl text-muted-foreground">
                Everything you need to know about UK corporate compliance automation
              </p>
            </div>

            {/* FAQ Sections */}
            <div className="space-y-8">
              {faqs.map((category, idx) => (
                <Card key={idx} className="border-none shadow-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur">
                  <CardContent className="p-6">
                    <h2 className="text-2xl font-bold mb-4 text-primary">{category.category}</h2>
                    <Accordion type="single" collapsible className="w-full">
                      {category.questions.map((faq, qIdx) => (
                        <AccordionItem key={qIdx} value={`item-${idx}-${qIdx}`}>
                          <AccordionTrigger className="text-left hover:no-underline" data-testid={`faq-question-${idx}-${qIdx}`}>
                            <span className="font-medium">{faq.q}</span>
                          </AccordionTrigger>
                          <AccordionContent className="text-muted-foreground" data-testid={`faq-answer-${idx}-${qIdx}`}>
                            {faq.a}
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* CTA Section */}
            <Card className="mt-12 border-none shadow-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white">
              <CardContent className="p-8 text-center">
                <h3 className="text-2xl font-bold mb-4">Still Have Questions?</h3>
                <p className="text-lg mb-6 opacity-90">
                  Our team is here to help you with any questions about UK corporate compliance
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button variant="secondary" size="lg" onClick={() => window.location.href = '/contact'} data-testid="button-contact-us">
                    Contact Support
                  </Button>
                  <Button variant="secondary" size="lg" onClick={() => window.location.href = '/auth'} data-testid="button-get-started">
                    Get Started Free
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Footer */}
        <footer className="border-t bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm py-8">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-4 gap-8">
              <div>
                <h4 className="font-semibold mb-4">Product</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li><a href="/#features" className="hover:text-foreground">Features</a></li>
                  <li><a href="/#pricing" className="hover:text-foreground">Pricing</a></li>
                  <li><a href="/faq" className="hover:text-foreground">FAQ</a></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-4">Resources</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li><a href="/resources" className="hover:text-foreground">Guides</a></li>
                  <li><a href="/blog" className="hover:text-foreground">Blog</a></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-4">Company</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li><a href="/contact" className="hover:text-foreground">Contact</a></li>
                  <li><a href="/terms" className="hover:text-foreground">Terms</a></li>
                  <li><a href="/privacy" className="hover:text-foreground">Privacy</a></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-4">Contact</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>56 Oldham Road</li>
                  <li>Ashton Under Lyne, OL6 7AP</li>
                  <li>0161 817 3556</li>
                </ul>
              </div>
            </div>
            <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
              <p>&copy; {new Date().getFullYear()} PromptSubmissions. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}

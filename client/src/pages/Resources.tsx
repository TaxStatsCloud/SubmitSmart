import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Download, BookOpen, Video, CheckCircle, FileCheck, Calculator } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

export default function Resources() {
  const guides = [
    {
      title: "Complete Guide to CT600 Filing",
      description: "Step-by-step instructions for Corporation Tax return preparation and HMRC submission",
      type: "PDF Guide",
      icon: FileText,
      size: "2.4 MB"
    },
    {
      title: "Annual Accounts Preparation Checklist",
      description: "Comprehensive checklist for preparing iXBRL accounts that meet Companies House requirements",
      type: "Checklist",
      icon: CheckCircle,
      size: "1.1 MB"
    },
    {
      title: "Confirmation Statement CS01 Template",
      description: "Pre-filled template with guidance notes for accurate CS01 submissions",
      type: "Template",
      icon: FileCheck,
      size: "850 KB"
    },
    {
      title: "Companies House 2027 Compliance Guide",
      description: "Everything you need to know about the mandatory digital filing requirements",
      type: "PDF Guide",
      icon: BookOpen,
      size: "3.2 MB"
    },
    {
      title: "Credit Calculator Spreadsheet",
      description: "Plan your filing costs and credit usage with this Excel calculator",
      type: "Excel",
      icon: Calculator,
      size: "450 KB"
    },
    {
      title: "iXBRL Tagging Reference",
      description: "Complete reference guide to FRC 2025 Taxonomy tags and validation rules",
      type: "PDF Guide",
      icon: FileText,
      size: "5.8 MB"
    }
  ];

  const videos = [
    {
      title: "Getting Started with PromptSubmissions",
      duration: "8:24",
      thumbnail: "bg-gradient-to-br from-blue-500 to-purple-500"
    },
    {
      title: "How to File Annual Accounts in 5 Minutes",
      duration: "5:12",
      thumbnail: "bg-gradient-to-br from-green-500 to-teal-500"
    },
    {
      title: "CT600 Wizard Walkthrough",
      duration: "12:45",
      thumbnail: "bg-gradient-to-br from-orange-500 to-red-500"
    },
    {
      title: "Multi-Company Management Tutorial",
      duration: "7:33",
      thumbnail: "bg-gradient-to-br from-purple-500 to-pink-500"
    }
  ];

  const apiDocs = [
    {
      title: "REST API Documentation",
      description: "Complete API reference for Enterprise tier integrations",
      badge: "Enterprise"
    },
    {
      title: "Webhook Integration Guide",
      description: "Real-time filing status updates via webhooks",
      badge: "Enterprise"
    },
    {
      title: "Authentication & Security",
      description: "OAuth 2.0 implementation and security best practices",
      badge: "All Tiers"
    }
  ];

  return (
    <>
      <Helmet>
        <title>Resources - Guides, Templates & Documentation | PromptSubmissions</title>
        <meta name="description" content="Free resources for UK corporate compliance: CT600 guides, Annual Accounts checklists, CS01 templates, video tutorials, and API documentation." />
        <meta property="og:title" content="PromptSubmissions Resources - Free Compliance Guides" />
        <meta property="og:description" content="Download guides, templates, and tutorials for UK Corporation Tax, Annual Accounts, and Confirmation Statements." />
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
              <a href="/faq" className="text-muted-foreground hover:text-foreground transition-colors">FAQ</a>
              <a href="/resources" className="text-foreground font-medium">Resources</a>
              <a href="/contact" className="text-muted-foreground hover:text-foreground transition-colors">Contact</a>
              <Button onClick={() => window.location.href = '/auth'}>Sign In</Button>
            </nav>
            <Button onClick={() => window.location.href = '/auth'} className="md:hidden" size="sm">Sign In</Button>
          </div>
        </header>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-6xl mx-auto">
            {/* Hero Section */}
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Resources & Downloads
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Everything you need to master UK corporate compliance and maximize PromptSubmissions
              </p>
            </div>

            {/* Downloadable Guides */}
            <div className="mb-16">
              <h2 className="text-3xl font-bold mb-6">Guides & Templates</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {guides.map((guide, idx) => (
                  <Card key={idx} className="border-none shadow-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur hover:shadow-2xl transition-all cursor-pointer group" data-testid={`card-guide-${idx}`}>
                    <CardHeader>
                      <div className="flex items-start justify-between mb-2">
                        <div className="p-3 rounded-lg bg-primary/10 text-primary">
                          <guide.icon className="h-6 w-6" />
                        </div>
                        <Badge variant="outline">{guide.type}</Badge>
                      </div>
                      <CardTitle className="text-lg group-hover:text-primary transition-colors">{guide.title}</CardTitle>
                      <CardDescription>{guide.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">{guide.size}</span>
                        <Button variant="ghost" size="sm" data-testid={`button-download-${idx}`}>
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Video Tutorials */}
            <div className="mb-16">
              <h2 className="text-3xl font-bold mb-6">Video Tutorials</h2>
              <div className="grid md:grid-cols-2 gap-6">
                {videos.map((video, idx) => (
                  <Card key={idx} className="border-none shadow-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur overflow-hidden hover:shadow-2xl transition-shadow cursor-pointer group" data-testid={`card-video-${idx}`}>
                    <div className={`h-48 ${video.thumbnail} flex items-center justify-center group-hover:scale-105 transition-transform`}>
                      <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center">
                        <Video className="h-8 w-8 text-primary" />
                      </div>
                    </div>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{video.title}</CardTitle>
                        <Badge variant="secondary">{video.duration}</Badge>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            </div>

            {/* API Documentation */}
            <div className="mb-16">
              <h2 className="text-3xl font-bold mb-6">Developer Resources</h2>
              <div className="grid md:grid-cols-3 gap-6">
                {apiDocs.map((doc, idx) => (
                  <Card key={idx} className="border-none shadow-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur hover:shadow-2xl transition-shadow cursor-pointer" data-testid={`card-api-${idx}`}>
                    <CardHeader>
                      <div className="flex items-start justify-between mb-2">
                        <Badge variant={doc.badge === "Enterprise" ? "default" : "outline"}>{doc.badge}</Badge>
                      </div>
                      <CardTitle className="text-lg">{doc.title}</CardTitle>
                      <CardDescription>{doc.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button variant="outline" className="w-full" data-testid={`button-view-${idx}`}>
                        View Documentation
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* CTA Section */}
            <Card className="border-none shadow-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white">
              <CardContent className="p-8 text-center">
                <h3 className="text-2xl font-bold mb-4">Need More Help?</h3>
                <p className="text-lg mb-6 opacity-90">
                  Our support team is ready to assist with training, custom integrations, and compliance questions
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button variant="secondary" size="lg" onClick={() => window.location.href = '/contact'} data-testid="button-contact-support">
                    Contact Support
                  </Button>
                  <Button variant="secondary" size="lg" onClick={() => window.location.href = '/faq'} data-testid="button-view-faq">
                    View FAQ
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

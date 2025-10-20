import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Calendar, User, ArrowRight, Clock } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

export default function Blog() {
  const blogPosts = [
    {
      title: "Companies House 2027 Digital Filing Mandate: What You Need to Know",
      excerpt: "From April 2027, all UK companies must file statutory accounts digitally using approved software. Learn how to prepare your business for this mandatory change.",
      category: "Compliance",
      date: "January 15, 2025",
      author: "PromptSubmissions Team",
      readTime: "5 min read",
      slug: "companies-house-2027-digital-filing-mandate"
    },
    {
      title: "Understanding iXBRL: The Future of Annual Accounts",
      excerpt: "iXBRL (inline XBRL) is now mandatory for Companies House filings. Discover what it is, why it matters, and how PromptSubmissions automates the entire process.",
      category: "Technology",
      date: "January 10, 2025",
      author: "Sarah Johnson",
      readTime: "7 min read",
      slug: "understanding-ixbrl-future-of-annual-accounts"
    },
    {
      title: "CT600 Filing Simplified: A Complete Guide for 2025",
      excerpt: "Corporation Tax returns don't have to be complicated. Our step-by-step guide walks you through CT600 preparation and HMRC submission.",
      category: "Tax",
      date: "January 5, 2025",
      author: "Michael Chen",
      readTime: "10 min read",
      slug: "ct600-filing-simplified-guide-2025"
    },
    {
      title: "How AI is Transforming UK Corporate Compliance",
      excerpt: "Artificial intelligence is revolutionizing accounting and compliance. Explore how PromptSubmissions uses AI to ensure 100% filing accuracy.",
      category: "AI & Innovation",
      date: "December 28, 2024",
      author: "Emma Davies",
      readTime: "6 min read",
      slug: "ai-transforming-uk-corporate-compliance"
    },
    {
      title: "Confirmation Statements CS01: Common Mistakes to Avoid",
      excerpt: "Even simple filings can go wrong. Learn the most common CS01 errors and how automated validation prevents rejection by Companies House.",
      category: "Compliance",
      date: "December 20, 2024",
      author: "David Thompson",
      readTime: "4 min read",
      slug: "confirmation-statements-cs01-common-mistakes"
    },
    {
      title: "Multi-Company Management for Accounting Firms",
      excerpt: "Managing compliance for multiple clients? Discover how PromptSubmissions' Professional and Enterprise tiers streamline multi-company workflows.",
      category: "Practice Management",
      date: "December 15, 2024",
      author: "Rachel Williams",
      readTime: "8 min read",
      slug: "multi-company-management-accounting-firms"
    }
  ];

  const categories = ["All", "Compliance", "Tax", "Technology", "AI & Innovation", "Practice Management"];

  return (
    <>
      <Helmet>
        <title>Blog - UK Corporate Compliance Insights | PromptSubmissions</title>
        <meta name="description" content="Expert insights on UK corporate compliance, tax filing, Companies House requirements, and accounting automation. Stay informed with PromptSubmissions blog." />
        <meta property="og:title" content="PromptSubmissions Blog - UK Compliance & Tax Insights" />
        <meta property="og:description" content="Latest news, guides, and best practices for UK Corporation Tax, Annual Accounts, and Confirmation Statements." />
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
              <a href="/resources" className="text-muted-foreground hover:text-foreground transition-colors">Resources</a>
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
                Insights & Resources
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Expert guidance on UK corporate compliance, tax filing, and accounting automation
              </p>
            </div>

            {/* Category Filter */}
            <div className="flex flex-wrap gap-2 justify-center mb-8">
              {categories.map((cat) => (
                <Badge key={cat} variant="outline" className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors px-4 py-2" data-testid={`badge-category-${cat.toLowerCase().replace(/\s+/g, '-')}`}>
                  {cat}
                </Badge>
              ))}
            </div>

            {/* Featured Post */}
            <Card className="mb-12 border-none shadow-2xl bg-gradient-to-r from-blue-600 to-purple-600 text-white overflow-hidden">
              <CardContent className="p-8">
                <Badge variant="secondary" className="mb-4">{blogPosts[0].category}</Badge>
                <h2 className="text-3xl md:text-4xl font-bold mb-4">{blogPosts[0].title}</h2>
                <p className="text-lg mb-6 opacity-90">{blogPosts[0].excerpt}</p>
                <div className="flex flex-wrap items-center gap-4 mb-6 text-sm opacity-80">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {blogPosts[0].date}
                  </span>
                  <span className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    {blogPosts[0].author}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {blogPosts[0].readTime}
                  </span>
                </div>
                <Button 
                  variant="secondary" 
                  size="lg" 
                  onClick={() => window.location.href = `/blog/${blogPosts[0].slug}`}
                  data-testid="button-read-featured"
                >
                  Read Article
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </CardContent>
            </Card>

            {/* Blog Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {blogPosts.slice(1).map((post, idx) => (
                <Card 
                  key={idx} 
                  className="border-none shadow-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur hover:shadow-2xl transition-shadow cursor-pointer" 
                  onClick={() => window.location.href = `/blog/${post.slug}`}
                  data-testid={`card-blog-${idx}`}
                >
                  <CardHeader>
                    <Badge variant="outline" className="w-fit mb-2">{post.category}</Badge>
                    <CardTitle className="hover:text-primary transition-colors">{post.title}</CardTitle>
                    <CardDescription>{post.excerpt}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mb-4">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {post.date}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {post.readTime}
                      </span>
                    </div>
                    <Button 
                      variant="ghost" 
                      className="w-full" 
                      onClick={(e) => {
                        e.stopPropagation();
                        window.location.href = `/blog/${post.slug}`;
                      }}
                      data-testid={`button-read-${idx}`}
                    >
                      Read More
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Newsletter CTA */}
            <Card className="mt-12 border-none shadow-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white">
              <CardContent className="p-8 text-center">
                <h3 className="text-2xl font-bold mb-4">Stay Updated</h3>
                <p className="text-lg mb-6 opacity-90">
                  Subscribe to our newsletter for the latest compliance insights, tax tips, and platform updates
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
                  <input 
                    type="email" 
                    placeholder="Enter your email" 
                    className="px-4 py-2 rounded-lg text-gray-900 flex-1"
                    data-testid="input-newsletter-email"
                  />
                  <Button variant="secondary" size="lg" data-testid="button-subscribe">
                    Subscribe
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

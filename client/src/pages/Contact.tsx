import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, Phone, MapPin, Clock, Send, FileText } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

export default function Contact() {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Message Sent",
      description: "Thank you for contacting us. We'll get back to you within 24 hours.",
    });
    setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <>
      <Helmet>
        <title>Contact Us - PromptSubmissions | UK Corporate Compliance Support</title>
        <meta name="description" content="Get in touch with PromptSubmissions for support with Corporation Tax CT600, Annual Accounts, and Confirmation Statements. Phone: 0161 817 3556 | Email: support@promptsubmissions.com" />
        <meta property="og:title" content="Contact PromptSubmissions - UK Corporate Compliance Support" />
        <meta property="og:description" content="Professional support for UK corporate filing automation. Contact us for help with CT600, Annual Accounts, and Confirmation Statements." />
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
              <a href="/contact" className="text-foreground font-medium">Contact</a>
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
                Get in Touch
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                We're here to help with all your UK corporate compliance needs
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Contact Information */}
              <div className="space-y-6">
                <Card className="border-none shadow-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Mail className="h-5 w-5 text-primary" />
                      Email Us
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <a href="mailto:support@promptsubmissions.com" className="text-lg text-primary hover:underline" data-testid="link-email">
                      support@promptsubmissions.com
                    </a>
                    <p className="text-sm text-muted-foreground mt-2">
                      We respond to all inquiries within 24 hours
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-none shadow-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Phone className="h-5 w-5 text-primary" />
                      Call Us
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <a href="tel:+441618173556" className="text-lg text-primary hover:underline" data-testid="link-phone">
                      0161 817 3556
                    </a>
                    <p className="text-sm text-muted-foreground mt-2">
                      Monday - Friday: 9:00 AM - 5:00 PM GMT
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-none shadow-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-primary" />
                      Visit Us
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1">
                    <p className="font-medium" data-testid="text-address-line1">56 Oldham Road</p>
                    <p data-testid="text-address-company">TaxStats</p>
                    <p data-testid="text-address-city">Ashton Under Lyne</p>
                    <p data-testid="text-address-postcode">OL6 7AP</p>
                    <p className="font-medium" data-testid="text-address-country">United Kingdom</p>
                  </CardContent>
                </Card>

                <Card className="border-none shadow-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-primary" />
                      Support Hours
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Monday - Friday:</span>
                      <span className="font-medium">9:00 AM - 5:00 PM</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Saturday - Sunday:</span>
                      <span className="font-medium">Closed</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-4">
                      Email support available 24/7 with response within 24 hours
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Contact Form */}
              <Card className="border-none shadow-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur">
                <CardHeader>
                  <CardTitle>Send us a Message</CardTitle>
                  <CardDescription>
                    Fill out the form below and we'll get back to you as soon as possible
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name *</Label>
                      <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="John Smith"
                        required
                        data-testid="input-contact-name"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address *</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="john.smith@company.co.uk"
                        required
                        data-testid="input-contact-email"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="0161 123 4567"
                        data-testid="input-contact-phone"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="subject">Subject *</Label>
                      <Input
                        id="subject"
                        name="subject"
                        value={formData.subject}
                        onChange={handleChange}
                        placeholder="e.g., Question about CT600 filing"
                        required
                        data-testid="input-contact-subject"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message">Message *</Label>
                      <Textarea
                        id="message"
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        placeholder="How can we help you?"
                        required
                        rows={6}
                        data-testid="textarea-contact-message"
                      />
                    </div>

                    <Button type="submit" className="w-full" size="lg" data-testid="button-submit-contact">
                      <Send className="h-4 w-4 mr-2" />
                      Send Message
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Additional Information */}
            <Card className="mt-8 border-none shadow-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white">
              <CardContent className="p-8 text-center">
                <h3 className="text-2xl font-bold mb-4">Need Immediate Help?</h3>
                <p className="text-lg mb-6 opacity-90">
                  For urgent filing deadlines or technical support, our team is ready to assist you
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button variant="secondary" size="lg" onClick={() => window.location.href = 'tel:+441618173556'} data-testid="button-call-now">
                    <Phone className="h-4 w-4 mr-2" />
                    Call Now
                  </Button>
                  <Button variant="secondary" size="lg" onClick={() => window.location.href = 'mailto:support@promptsubmissions.com'} data-testid="button-email-support">
                    <Mail className="h-4 w-4 mr-2" />
                    Email Support
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

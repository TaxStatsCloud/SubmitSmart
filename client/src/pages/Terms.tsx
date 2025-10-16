import { Helmet } from "react-helmet-async";
import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";

export default function Terms() {
  return (
    <>
      <Helmet>
        <title>Terms of Service | PromptSubmissions - UK Corporate Compliance Platform</title>
        <meta name="description" content="Terms of Service for PromptSubmissions - AI-powered UK corporate compliance platform for Corporation Tax, Annual Accounts, and Confirmation Statements." />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <Link href="/" className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 mb-8 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>

          <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-8 md:p-12">
            <h1 className="text-4xl font-bold text-white mb-4">Terms of Service</h1>
            <p className="text-purple-300 mb-8">Last Updated: October 2025</p>

            <div className="space-y-8 text-gray-300">
              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">1. Introduction</h2>
                <p className="leading-relaxed">
                  These Terms of Service ("Terms") govern your use of PromptSubmissions websites, applications, services, and content. 
                  By using our services, you agree to these Terms. PromptSubmissions ("we", "our", or "us") provides AI-powered corporate 
                  compliance services for UK companies.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">2. Services Provided</h2>
                <p className="leading-relaxed mb-4">
                  We provide digital compliance and filing services to UK companies, directors, and accountants. This includes:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>AI-powered Corporation Tax (CT600) return preparation and filing</li>
                  <li>Annual Accounts preparation and Companies House filing</li>
                  <li>Confirmation Statement (CS01) filing</li>
                  <li>Document processing and financial data extraction</li>
                  <li>Automated compliance monitoring and deadline tracking</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">3. User Obligations</h2>
                <p className="leading-relaxed mb-4">You agree to:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Provide accurate, complete, and up-to-date company and financial information</li>
                  <li>Use our services only for lawful purposes and in compliance with UK regulations</li>
                  <li>Not misuse, interfere with, or reverse-engineer our platforms</li>
                  <li>Keep your login credentials secure and confidential</li>
                  <li>Review all submissions before filing with HMRC or Companies House</li>
                  <li>Ensure all uploaded documents are genuine and accurate</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">4. Payment Terms</h2>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Services operate on a credit-based system with clear pricing displayed before purchase</li>
                  <li>Credit packages are non-refundable once purchased</li>
                  <li>Credits are deducted upon successful filing submission</li>
                  <li>All fees are clearly stated before any transaction</li>
                  <li>You are responsible for any applicable taxes or VAT</li>
                  <li>Payment processing is handled securely through Stripe</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">5. Intellectual Property</h2>
                <p className="leading-relaxed">
                  All content, software, AI models, and branding on our platforms are owned by PromptSubmissions or its licensors. 
                  You may not reproduce, distribute, or exploit our content without permission. Your company data remains your property, 
                  and we only process it to provide our services.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">6. AI-Powered Services</h2>
                <p className="leading-relaxed mb-4">
                  Our platform uses artificial intelligence to process documents and prepare filings. You acknowledge that:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>AI-generated outputs should be reviewed before submission</li>
                  <li>You remain responsible for the accuracy of all filings</li>
                  <li>AI tools are assistive and do not replace professional judgment or legal advice</li>
                  <li>We continuously improve our AI models but cannot guarantee 100% accuracy</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">7. Data Processing and HMRC/Companies House Submissions</h2>
                <p className="leading-relaxed">
                  By using our services, you authorize us to submit data on your behalf to HMRC and Companies House through their official APIs. 
                  We act as your authorized agent for these submissions, and you remain ultimately responsible for the accuracy and completeness 
                  of all filed information.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">8. Termination</h2>
                <p className="leading-relaxed">
                  We may suspend or terminate access to our services if you violate these Terms or misuse our systems. You may also request 
                  deletion of your account at any time. Unused credits are forfeited upon account termination.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">9. Disclaimers</h2>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>We are not responsible for third-party systems, downtime, or delays from HMRC or Companies House</li>
                  <li>We do our best to ensure accuracy but cannot guarantee outcomes of tax submissions or acceptance by authorities</li>
                  <li>Our services do not constitute tax advice, accounting advice, or legal advice</li>
                  <li>You should consult with qualified professionals for complex tax matters</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">10. Limitation of Liability</h2>
                <p className="leading-relaxed">
                  To the fullest extent permitted by law, PromptSubmissions shall not be liable for indirect, incidental, or consequential 
                  damages arising from the use or inability to use our services, including but not limited to penalties, interest charges, 
                  or fines imposed by HMRC or Companies House.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">11. Governing Law</h2>
                <p className="leading-relaxed">
                  These Terms are governed by the laws of England and Wales. Any disputes shall be subject to the jurisdiction of the English courts.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">12. Updates to These Terms</h2>
                <p className="leading-relaxed">
                  We reserve the right to update these Terms and will notify users of material changes via email or platform notice. 
                  Continued use of our services after changes constitutes acceptance of the updated Terms.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">13. Contact</h2>
                <div className="space-y-2">
                  <p><strong className="text-white">Email:</strong> legal@promptsubmissions.com</p>
                  <p><strong className="text-white">Website:</strong> https://promptsubmissions.com</p>
                  <p><strong className="text-white">Address:</strong> 56 Oldham Road, TaxStats, Ashton Under Lyne OL6 7AP</p>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

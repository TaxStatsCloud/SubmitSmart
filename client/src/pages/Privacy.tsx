import { Helmet } from "react-helmet-async";
import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";

export default function Privacy() {
  return (
    <>
      <Helmet>
        <title>Privacy Policy | PromptSubmissions - UK Corporate Compliance Platform</title>
        <meta name="description" content="Privacy Policy for PromptSubmissions - Learn how we protect your personal and company data in compliance with UK GDPR and data protection regulations." />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <Link href="/" className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 mb-8 transition-colors" data-testid="link-back-home">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>

          <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-8 md:p-12">
            <h1 className="text-4xl font-bold text-white mb-4">Privacy Policy</h1>
            <p className="text-purple-300 mb-8">Last Updated: October 2025</p>

            <div className="space-y-8 text-gray-300">
              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">1. Introduction</h2>
                <p className="leading-relaxed">
                  PromptSubmissions ("we", "our", or "us") is committed to protecting your personal data and ensuring transparency about 
                  how we collect, use, and store it. This Privacy Policy applies to all PromptSubmissions applications, platforms, services, 
                  and our website (https://promptsubmissions.com/).
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">2. Data We Collect</h2>
                <p className="leading-relaxed mb-4">We may collect the following data when you use our services:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong className="text-white">Personal Identification Data:</strong> Full name, email address, phone number, address</li>
                  <li><strong className="text-white">Company Information:</strong> Company name, registration number, registered address, incorporation date, Companies House filings</li>
                  <li><strong className="text-white">Financial Data:</strong> Tax returns, annual accounts, profit & loss statements, balance sheets, trial balances, invoices, receipts, bank statements</li>
                  <li><strong className="text-white">Tax Information:</strong> Corporation Tax computations, UTR, accounting periods, tax liabilities</li>
                  <li><strong className="text-white">Identity Verification Documents:</strong> Directors' details, shareholder information, authentication codes</li>
                  <li><strong className="text-white">Technical Data:</strong> IP address, browser type, operating system, usage data, and cookies</li>
                  <li><strong className="text-white">Payment Data:</strong> Credit card details (processed by Stripe), billing addresses, transaction history</li>
                  <li><strong className="text-white">Communication Data:</strong> Customer support chats, emails, AI chatbot interactions</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">3. How We Use Your Data</h2>
                <p className="leading-relaxed mb-4">We use your data for the following purposes:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>To provide and improve our corporate compliance and filing services</li>
                  <li>To process and submit Corporation Tax returns to HMRC via official APIs</li>
                  <li>To prepare and file Annual Accounts and Confirmation Statements with Companies House</li>
                  <li>To process financial documents using AI-powered extraction and analysis</li>
                  <li>For identity verification and fraud prevention</li>
                  <li>To communicate with you about filing deadlines, updates, or service notifications</li>
                  <li>To process payments and manage your credit balance</li>
                  <li>To comply with legal and regulatory obligations under UK law</li>
                  <li>To improve our AI models and service accuracy (using anonymized data only)</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">4. Legal Basis for Processing</h2>
                <p className="leading-relaxed mb-4">We process your data under the following legal bases:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong className="text-white">Contract Performance:</strong> To fulfill our service agreement with you</li>
                  <li><strong className="text-white">Legal Obligation:</strong> To comply with HMRC, Companies House, and UK tax regulations</li>
                  <li><strong className="text-white">Legitimate Interests:</strong> To improve our services and prevent fraud</li>
                  <li><strong className="text-white">Consent:</strong> For marketing communications (where you have opted in)</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">5. Sharing Your Data</h2>
                <p className="leading-relaxed mb-4">
                  We do not sell your personal data. We may share data with:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong className="text-white">HMRC:</strong> For Corporation Tax submissions and verifications via official API</li>
                  <li><strong className="text-white">Companies House:</strong> For Annual Accounts and Confirmation Statement filings via official API</li>
                  <li><strong className="text-white">Payment Providers:</strong> Stripe for processing payments and managing subscriptions</li>
                  <li><strong className="text-white">Cloud Service Providers:</strong> Replit, OpenAI for AI processing (under strict confidentiality agreements)</li>
                  <li><strong className="text-white">Email Services:</strong> SendGrid for transactional emails and notifications</li>
                  <li><strong className="text-white">Legal Authorities:</strong> If required by law or to protect our rights</li>
                </ul>
                <p className="leading-relaxed mt-4">
                  All third-party service providers are contractually bound to protect your data and use it only for specified purposes.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">6. Data Retention</h2>
                <p className="leading-relaxed">
                  We retain your data for as long as necessary to fulfill our contractual and legal obligations. Specifically:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4 mt-4">
                  <li><strong className="text-white">Financial Records:</strong> 7 years (in line with HMRC and accounting standards)</li>
                  <li><strong className="text-white">Company Filings:</strong> 7 years (UK statutory requirement)</li>
                  <li><strong className="text-white">Account Data:</strong> Until account deletion, then 30 days for backup purposes</li>
                  <li><strong className="text-white">Communication Logs:</strong> 3 years for customer support and compliance</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">7. Your Rights Under UK GDPR</h2>
                <p className="leading-relaxed mb-4">You have the right to:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong className="text-white">Access:</strong> Request a copy of the data we hold about you</li>
                  <li><strong className="text-white">Rectification:</strong> Request corrections to inaccurate or incomplete data</li>
                  <li><strong className="text-white">Erasure:</strong> Request deletion of your data (subject to legal retention requirements)</li>
                  <li><strong className="text-white">Restriction:</strong> Request limitation of processing in certain circumstances</li>
                  <li><strong className="text-white">Data Portability:</strong> Request your data in a machine-readable format</li>
                  <li><strong className="text-white">Objection:</strong> Object to processing based on legitimate interests</li>
                  <li><strong className="text-white">Withdraw Consent:</strong> Withdraw consent for marketing communications at any time</li>
                  <li><strong className="text-white">Complain:</strong> Lodge a complaint with the ICO (https://ico.org.uk)</li>
                </ul>
                <p className="leading-relaxed mt-4">
                  To exercise these rights, contact our Data Protection Officer at privacy@promptsubmissions.com
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">8. Security Measures</h2>
                <p className="leading-relaxed mb-4">We implement industry-standard security measures to protect your data:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong className="text-white">Encryption:</strong> Data encrypted in transit (TLS/SSL) and at rest</li>
                  <li><strong className="text-white">Secure Cloud Storage:</strong> Data stored on Replit's secure infrastructure</li>
                  <li><strong className="text-white">Access Control:</strong> Role-based access with multi-factor authentication</li>
                  <li><strong className="text-white">Regular Audits:</strong> Security assessments and vulnerability testing</li>
                  <li><strong className="text-white">Payment Security:</strong> PCI-DSS compliant payment processing via Stripe</li>
                  <li><strong className="text-white">API Security:</strong> Secure connections to HMRC and Companies House using official credentials</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">9. Cookies and Tracking</h2>
                <p className="leading-relaxed mb-4">
                  Our website uses cookies for performance, analytics, and personalization:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong className="text-white">Essential Cookies:</strong> Required for authentication and core functionality</li>
                  <li><strong className="text-white">Analytics Cookies:</strong> To understand how users interact with our platform</li>
                  <li><strong className="text-white">Preference Cookies:</strong> To remember your settings and preferences</li>
                </ul>
                <p className="leading-relaxed mt-4">
                  You can manage cookies through your browser settings. Disabling essential cookies may affect platform functionality.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">10. International Data Transfers</h2>
                <p className="leading-relaxed">
                  Your data is primarily processed and stored within the UK and European Economic Area (EEA). Where we use service providers 
                  outside the EEA (such as OpenAI for AI processing), we ensure appropriate safeguards are in place through Standard Contractual 
                  Clauses (SCCs) or equivalent mechanisms.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">11. Children's Privacy</h2>
                <p className="leading-relaxed">
                  Our services are not directed to individuals under 18. We do not knowingly collect personal data from children. 
                  If we become aware that we have collected data from a child without parental consent, we will delete it promptly.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">12. AI and Automated Decision-Making</h2>
                <p className="leading-relaxed">
                  We use AI to process documents and prepare filings. While our AI systems provide automated suggestions, all submissions 
                  require human review and approval. You have the right to request human intervention and to contest decisions made by 
                  automated systems.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">13. Changes to This Policy</h2>
                <p className="leading-relaxed">
                  We may update this Privacy Policy from time to time to reflect changes in our practices or legal requirements. 
                  We will notify you of material changes via email or platform notice. The "Last Updated" date at the top indicates 
                  when this policy was last revised.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">14. Contact Us</h2>
                <p className="leading-relaxed mb-4">
                  For any questions or requests about your data, please contact:
                </p>
                <div className="space-y-2">
                  <p><strong className="text-white">Data Protection Officer</strong></p>
                  <p><strong className="text-white">Email:</strong> privacy@promptsubmissions.com</p>
                  <p><strong className="text-white">Address:</strong> 56 Oldham Road, PromptSubmissions, Ashton Under Lyne OL6 7AP</p>
                  <p><strong className="text-white">Website:</strong> https://promptsubmissions.com</p>
                </div>
                <p className="leading-relaxed mt-4">
                  You can also contact the Information Commissioner's Office (ICO) if you have concerns about how we handle your data: 
                  <a href="https://ico.org.uk" className="text-purple-400 hover:text-purple-300 underline ml-1" target="_blank" rel="noopener noreferrer">
                    https://ico.org.uk
                  </a>
                </p>
              </section>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

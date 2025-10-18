import { Helmet } from "react-helmet-async";
import { Link } from "wouter";
import { ArrowLeft, AlertTriangle } from "lucide-react";

export default function Disclaimer() {
  return (
    <>
      <Helmet>
        <title>Legal Disclaimer | PromptSubmissions - UK Corporate Compliance Platform</title>
        <meta name="description" content="Legal disclaimer and important notices for PromptSubmissions - AI-powered UK corporate compliance platform." />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 dark:from-slate-950 dark:via-purple-950 dark:to-slate-950">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <Link href="/" className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 mb-8 transition-colors" data-testid="link-back-home">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>

          <div className="bg-white/5 dark:bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 dark:border-white/10 p-8 md:p-12">
            <div className="flex items-start gap-4 mb-6">
              <AlertTriangle className="w-8 h-8 text-yellow-400 flex-shrink-0 mt-1" />
              <div>
                <h1 className="text-4xl font-bold text-white dark:text-white mb-2">Legal Disclaimer</h1>
                <p className="text-purple-300 dark:text-purple-300">Important Legal Notices and User Responsibilities</p>
              </div>
            </div>

            <div className="space-y-8 text-gray-300 dark:text-gray-300">
              <section className="border-l-4 border-yellow-500 pl-6 py-2 bg-yellow-500/5 rounded-r-lg">
                <h2 className="text-2xl font-semibold text-white dark:text-white mb-4">⚠️ Critical Notice</h2>
                <p className="leading-relaxed text-lg font-medium text-yellow-200 dark:text-yellow-200">
                  <strong>YOU REMAIN LEGALLY RESPONSIBLE FOR ALL FILINGS.</strong> PromptSubmissions is a software tool designed to assist 
                  with UK corporate compliance filings. It does NOT replace professional accounting, tax, or legal advice. All submissions 
                  to HMRC and Companies House are made in YOUR name, and YOU bear full legal responsibility for their accuracy and completeness.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-white dark:text-white mb-4">1. Nature of Service</h2>
                <p className="leading-relaxed mb-4">
                  PromptSubmissions provides software tools and automation to assist with:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Corporation Tax (CT600) return preparation and electronic filing</li>
                  <li>Annual Accounts preparation and iXBRL submission to Companies House</li>
                  <li>Confirmation Statement (CS01) filing</li>
                  <li>Financial document processing using AI technology</li>
                  <li>Compliance deadline tracking and notifications</li>
                </ul>
                <p className="leading-relaxed mt-4">
                  <strong>Our software is a TOOL ONLY.</strong> We do not provide accounting services, tax advisory services, 
                  legal services, or professional consultancy. We are not accountants, tax advisors, or solicitors.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-white dark:text-white mb-4">2. Your Legal Responsibilities</h2>
                <p className="leading-relaxed mb-4">
                  As a user of PromptSubmissions, you acknowledge and accept that:
                </p>
                <ul className="list-disc list-inside space-y-3 ml-4">
                  <li><strong>YOU are responsible for all filings:</strong> Every submission made through our platform is made in your company's 
                  name and under your authority. You bear full legal responsibility to HMRC, Companies House, and other regulatory bodies.</li>
                  
                  <li><strong>YOU must verify all data:</strong> While our AI technology processes documents and prepares filings, 
                  you MUST review all outputs for accuracy before submission. Our software cannot guarantee 100% accuracy.</li>
                  
                  <li><strong>YOU must ensure compliance:</strong> It is your responsibility to ensure that all tax returns, accounts, 
                  and statutory filings comply with current UK tax law, accounting standards, and Companies Act requirements.</li>
                  
                  <li><strong>YOU are responsible for supporting documentation:</strong> You must maintain proper books and records, 
                  retain all source documents, and be able to justify all figures submitted to authorities.</li>
                  
                  <li><strong>YOU accept filing penalties:</strong> If filings are late, incorrect, or incomplete, YOU are liable 
                  for any penalties, interest charges, or enforcement action from HMRC or Companies House.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-white dark:text-white mb-4">3. Professional Review Strongly Recommended</h2>
                <p className="leading-relaxed mb-4">
                  <strong className="text-yellow-300 dark:text-yellow-300">We STRONGLY RECOMMEND that you engage a qualified accountant, 
                  tax advisor, or legal professional</strong> to review all filings prepared using PromptSubmissions, especially for:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Complex tax calculations involving losses, group relief, or international transactions</li>
                  <li>First-time filings for new companies</li>
                  <li>Significant changes in company structure, ownership, or business activities</li>
                  <li>Companies with turnover exceeding £10 million or unusual accounting treatments</li>
                  <li>Any filings where you are uncertain about tax treatment or legal requirements</li>
                </ul>
                <p className="leading-relaxed mt-4">
                  Professional review helps ensure compliance, optimize tax position, and provide an additional layer of verification.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-white dark:text-white mb-4">4. AI Technology Limitations</h2>
                <p className="leading-relaxed mb-4">
                  Our platform uses artificial intelligence (AI) to process documents, extract financial data, and prepare filings. 
                  You acknowledge that:
                </p>
                <ul className="list-disc list-inside space-y-3 ml-4">
                  <li><strong>AI is not infallible:</strong> While our models are trained on extensive datasets and follow UK accounting 
                  rules, AI can make errors in data extraction, interpretation, or calculation.</li>
                  
                  <li><strong>AI cannot exercise judgment:</strong> Complex tax matters often require professional judgment, interpretation 
                  of ambiguous rules, or strategic planning. AI tools cannot replace human expertise in these areas.</li>
                  
                  <li><strong>AI outputs must be verified:</strong> ALL AI-generated content, calculations, and filings must be reviewed 
                  and verified by you or your accountant before submission.</li>
                  
                  <li><strong>AI advice is not professional advice:</strong> Our AI chatbot provides general guidance based on UK tax rules 
                  and accounting standards, but this does NOT constitute professional tax advice, accounting advice, or legal advice.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-white dark:text-white mb-4">5. No Guarantees of Acceptance or Outcomes</h2>
                <p className="leading-relaxed mb-4">
                  PromptSubmissions makes NO WARRANTIES OR GUARANTEES regarding:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Acceptance of filings by HMRC or Companies House</li>
                  <li>Accuracy of tax calculations or compliance with current law</li>
                  <li>Optimization of tax position or identification of all available reliefs</li>
                  <li>Prevention of penalties, interest charges, or compliance investigations</li>
                  <li>Timing or success of electronic submissions to government systems</li>
                  <li>Compatibility with all possible accounting scenarios or business structures</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-white dark:text-white mb-4">6. Limitation of Liability</h2>
                <p className="leading-relaxed mb-4">
                  To the maximum extent permitted by UK law:
                </p>
                <ul className="list-disc list-inside space-y-3 ml-4">
                  <li>PromptSubmissions shall NOT be liable for any penalties, fines, interest charges, or enforcement action 
                  resulting from incorrect, late, or incomplete filings made using our platform.</li>
                  
                  <li>We are NOT responsible for errors in AI-generated content, calculations, or filing submissions.</li>
                  
                  <li>We are NOT liable for losses arising from reliance on our software, AI chatbot, or automated tools.</li>
                  
                  <li>Our total liability for any claim shall be limited to the amount you paid for our services in the 12 months 
                  preceding the claim (typically the cost of credits used).</li>
                  
                  <li>We exclude all liability for indirect, consequential, or special damages including loss of profits, 
                  business interruption, or reputational harm.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-white dark:text-white mb-4">7. Third-Party Systems and Downtime</h2>
                <p className="leading-relaxed">
                  We are not responsible for downtime, delays, rejections, or technical issues with:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4 mt-4">
                  <li>HMRC Gateway and Corporation Tax Online systems</li>
                  <li>Companies House WebFiling and XML Gateway services</li>
                  <li>Third-party payment processors (Stripe)</li>
                  <li>OpenAI and other AI service providers</li>
                  <li>Internet connectivity or infrastructure failures</li>
                </ul>
                <p className="leading-relaxed mt-4">
                  You should allow sufficient time before filing deadlines to account for potential technical issues.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-white dark:text-white mb-4">8. User Data and Document Security</h2>
                <p className="leading-relaxed">
                  While we implement industry-standard security measures to protect your data:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4 mt-4">
                  <li>You are responsible for maintaining the confidentiality of your login credentials</li>
                  <li>You should only upload genuine company documents and financial records</li>
                  <li>You acknowledge that data is transmitted over the internet and through third-party APIs</li>
                  <li>We cannot guarantee absolute security against all cyber threats</li>
                  <li>See our Privacy Policy for detailed information on data handling and processing</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-white dark:text-white mb-4">9. Changes to Tax Law and Regulations</h2>
                <p className="leading-relaxed">
                  UK tax law, accounting standards, and Companies House requirements change regularly. While we strive to keep 
                  our software updated with current rules:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4 mt-4">
                  <li>We cannot guarantee immediate updates for all legislative changes</li>
                  <li>You remain responsible for compliance with current law at the time of filing</li>
                  <li>You should verify that our software reflects the latest requirements before submission</li>
                  <li>Professional advice is recommended for filings made during transitional periods or when new rules apply</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-white dark:text-white mb-4">10. Audit Trail and Documentation Features</h2>
                <p className="leading-relaxed">
                  Our document audit trail and auditor access features are provided to assist with transparency and compliance verification. 
                  However:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4 mt-4">
                  <li>These features do NOT constitute a formal audit or assurance engagement</li>
                  <li>Invited auditors or accountants act independently and are not employed by PromptSubmissions</li>
                  <li>We are not responsible for the quality, timeliness, or accuracy of any professional review</li>
                  <li>The audit trail is for informational purposes and does not replace statutory record-keeping requirements</li>
                </ul>
              </section>

              <section className="border-l-4 border-purple-500 pl-6 py-2 bg-purple-500/5 rounded-r-lg">
                <h2 className="text-2xl font-semibold text-white dark:text-white mb-4">11. Contact for Questions</h2>
                <p className="leading-relaxed">
                  If you have questions about this disclaimer or need clarification on your responsibilities, please contact us at:
                </p>
                <p className="mt-4 text-purple-300 dark:text-purple-300">
                  <strong>Email:</strong> support@promptsubmissions.com
                </p>
                <p className="mt-4 leading-relaxed">
                  For specific tax, accounting, or legal questions related to your filings, please consult with a qualified professional 
                  rather than relying solely on our software or AI chatbot.
                </p>
              </section>

              <section className="bg-red-500/10 border-2 border-red-500 rounded-lg p-6 mt-8">
                <h2 className="text-2xl font-semibold text-red-300 dark:text-red-300 mb-4">⚠️ Final Acknowledgment</h2>
                <p className="leading-relaxed text-red-200 dark:text-red-200 font-medium">
                  By using PromptSubmissions, you acknowledge that you have read, understood, and accept this disclaimer in full. 
                  You confirm that you understand your legal responsibilities as a company director or officer, and that you will 
                  seek professional advice when appropriate. You agree that PromptSubmissions and its operators bear NO responsibility 
                  for the accuracy, timeliness, or compliance of any filings made using our platform.
                </p>
              </section>

              <div className="mt-12 pt-8 border-t border-white/10 dark:border-white/10 text-sm text-gray-400 dark:text-gray-400">
                <p>Last Updated: October 18, 2025</p>
                <p className="mt-2">
                  This disclaimer is subject to change. Please review regularly. For our complete terms of service, 
                  see <Link href="/terms" className="text-purple-400 hover:text-purple-300 underline">Terms of Service</Link>.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

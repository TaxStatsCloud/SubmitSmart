import { Link } from "wouter";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950">
      <div className="container mx-auto px-6 py-8">
        {/* Legal Disclaimer */}
        <div className="mb-6 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-amber-900 dark:text-amber-100 mb-2">
            ⚠️ Important Legal Disclaimer
          </h3>
          <div className="text-xs text-amber-800 dark:text-amber-200 space-y-2">
            <p>
              <strong>PromptSubmissions is a software tool only.</strong> We provide technology to assist with 
              UK corporate compliance filings but do not provide accounting, tax, or legal advice.
            </p>
            <p>
              While we strive for accuracy, <strong>you remain legally responsible</strong> for all information 
              submitted to Companies House and HMRC. Inaccurate filings may result in penalties, fines, or legal consequences.
            </p>
            <p>
              <strong>Professional review strongly recommended:</strong> We recommend having your filings reviewed 
              by a qualified chartered accountant, tax advisor, or solicitor before submission, especially for 
              complex matters or first-time filings.
            </p>
            <p>
              <strong>No warranties:</strong> PromptSubmissions Ltd makes no warranties regarding the accuracy, 
              completeness, or suitability of generated filings. We are not liable for any penalties, losses, 
              or legal consequences arising from your use of this platform.
            </p>
          </div>
        </div>

        {/* Footer Links */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-6">
          <div>
            <h4 className="font-semibold text-neutral-900 dark:text-neutral-100 mb-3">Company</h4>
            <ul className="space-y-2 text-sm text-neutral-600 dark:text-neutral-400">
              <li>
                <Link href="/about" className="hover:text-primary hover:underline">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-primary hover:underline">
                  Contact
                </Link>
              </li>
              <li>
                <a 
                  href="mailto:support@promptsubmissions.com" 
                  className="hover:text-primary hover:underline"
                >
                  support@promptsubmissions.com
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-neutral-900 dark:text-neutral-100 mb-3">Legal</h4>
            <ul className="space-y-2 text-sm text-neutral-600 dark:text-neutral-400">
              <li>
                <Link href="/terms" className="hover:text-primary hover:underline">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-primary hover:underline">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/disclaimer" className="hover:text-primary hover:underline">
                  Full Disclaimer
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-neutral-900 dark:text-neutral-100 mb-3">Resources</h4>
            <ul className="space-y-2 text-sm text-neutral-600 dark:text-neutral-400">
              <li>
                <a 
                  href="https://www.gov.uk/government/organisations/companies-house" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-primary hover:underline"
                >
                  Companies House
                </a>
              </li>
              <li>
                <a 
                  href="https://www.gov.uk/government/organisations/hm-revenue-customs" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-primary hover:underline"
                >
                  HMRC
                </a>
              </li>
              <li>
                <a 
                  href="https://find-and-update.company-information.service.gov.uk/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-primary hover:underline"
                >
                  Find a Company
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-neutral-900 dark:text-neutral-100 mb-3">Professional Bodies</h4>
            <ul className="space-y-2 text-sm text-neutral-600 dark:text-neutral-400">
              <li>
                <a 
                  href="https://www.icaew.com/membership/find-a-chartered-accountant" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-primary hover:underline"
                >
                  Find an ICAEW Accountant
                </a>
              </li>
              <li>
                <a 
                  href="https://www.accaglobal.com/gb/en/member/find-an-accountant.html" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-primary hover:underline"
                >
                  Find an ACCA Accountant
                </a>
              </li>
              <li>
                <a 
                  href="https://www.lawsociety.org.uk/for-the-public/using-a-solicitor/find-a-solicitor" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-primary hover:underline"
                >
                  Find a Solicitor
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-neutral-200 dark:border-neutral-800 pt-6">
          <div className="flex flex-col md:flex-row justify-between items-center text-xs text-neutral-600 dark:text-neutral-400">
            <p>
              © {new Date().getFullYear()} PromptSubmissions Ltd. All rights reserved.
            </p>
            <p className="mt-2 md:mt-0">
              Not regulated by the Financial Conduct Authority or any professional accounting body.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

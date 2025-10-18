import { Link } from "wouter";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900">
      <div className="container mx-auto px-6 py-8">
        {/* Footer Links */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-6">
          <div>
            <h4 className="font-semibold text-neutral-900 dark:text-white mb-3">Company</h4>
            <ul className="space-y-2 text-sm text-neutral-700 dark:text-neutral-300">
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
            <h4 className="font-semibold text-neutral-900 dark:text-white mb-3">Legal</h4>
            <ul className="space-y-2 text-sm text-neutral-700 dark:text-neutral-300">
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
            <h4 className="font-semibold text-neutral-900 dark:text-white mb-3">Resources</h4>
            <ul className="space-y-2 text-sm text-neutral-700 dark:text-neutral-300">
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
            <h4 className="font-semibold text-neutral-900 dark:text-white mb-3">Professional Bodies</h4>
            <ul className="space-y-2 text-sm text-neutral-700 dark:text-neutral-300">
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

        {/* Copyright & Compact Disclaimer */}
        <div className="border-t border-neutral-300 dark:border-neutral-700 pt-6">
          <div className="flex flex-col items-center text-center space-y-3">
            <p className="text-xs text-neutral-700 dark:text-neutral-300 max-w-4xl font-medium">
              PromptSubmissions is a software tool only. You remain legally responsible for all filings. 
              Professional review recommended. See our <Link href="/disclaimer" className="underline hover:text-primary font-semibold">full disclaimer</Link>.
            </p>
            <div className="flex flex-col md:flex-row justify-between items-center gap-2 text-xs text-neutral-700 dark:text-neutral-300">
              <p>
                © {new Date().getFullYear()} PromptSubmissions Ltd. All rights reserved.
              </p>
              <p>
                Not regulated by the Financial Conduct Authority or any professional accounting body.
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

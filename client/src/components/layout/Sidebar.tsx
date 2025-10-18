import { Link, useLocation } from "wouter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { LogOut } from "lucide-react";

const Sidebar = () => {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  
  const isActive = (path: string) => location === path;

  return (
    <aside className="hidden lg:flex lg:flex-shrink-0">
      <div className="flex flex-col w-64 bg-white dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-700">
        {/* Logo */}
        <div className="flex items-center justify-center h-16 px-4 border-b border-neutral-200 dark:border-neutral-700 bg-[hsl(var(--primary-500))] dark:bg-[hsl(var(--primary-600))]">
          <h1 className="text-2xl font-semibold text-white">
            PromptSubmissions
          </h1>
        </div>

        {/* Navigation Items */}
        <div className="flex flex-col flex-grow p-4 overflow-y-auto">
          <nav className="flex-1 space-y-1">
            {/* Dashboard */}
            <Link href="/" className={`sidebar-link ${isActive("/") ? "active" : ""}`}>
              <span className="material-icons sidebar-icon">dashboard</span>
              Dashboard
            </Link>

            {/* Filings */}
            <div className="sidebar-section">
              <h3 className="sidebar-heading">
                Filings
              </h3>
              
              <Link href="/filings/confirmation-statements" className={`sidebar-link ${isActive("/filings/confirmation-statements") ? "active" : ""}`}>
                <span className="material-icons sidebar-icon">description</span>
                Confirmation Statements
              </Link>
              
              <Link href="/filings/annual-accounts" className={`sidebar-link ${isActive("/filings/annual-accounts") ? "active" : ""}`}>
                <span className="material-icons sidebar-icon">receipt_long</span>
                Annual Accounts
              </Link>
              
              <Link href="/filings/corporation-tax" className={`sidebar-link ${isActive("/filings/corporation-tax") ? "active" : ""}`}>
                <span className="material-icons sidebar-icon">calculate</span>
                Corporation Tax (CT600)
              </Link>
              
              <Link href="/real-world-filing" className={`sidebar-link ${isActive("/real-world-filing") ? "active" : ""}`}>
                <span className="material-icons sidebar-icon">assignment</span>
                Real-World Filing Demo
              </Link>
              
              <Link href="/trial-balance" className={`sidebar-link ${isActive("/trial-balance") ? "active" : ""}`}>
                <span className="material-icons sidebar-icon">balance</span>
                Trial Balance
              </Link>
              
              <Link href="/financial-reporting" className={`sidebar-link ${isActive("/financial-reporting") ? "active" : ""}`}>
                <span className="material-icons sidebar-icon">analytics</span>
                Financial Reporting
              </Link>
            </div>

            {/* Documents */}
            <div className="sidebar-section">
              <h3 className="sidebar-heading">
                Documents
              </h3>
              
              <Link href="/upload" className={`sidebar-link ${isActive("/upload") ? "active" : ""}`}>
                <span className="material-icons sidebar-icon">upload_file</span>
                Upload Documents
              </Link>
              
              <Link href="/documents" className={`sidebar-link ${isActive("/documents") ? "active" : ""}`}>
                <span className="material-icons sidebar-icon">folder</span>
                Document Library
              </Link>
            </div>

            {/* Account */}
            <div className="sidebar-section">
              <h3 className="sidebar-heading">
                Account
              </h3>
              
              <Link href="/company" className={`sidebar-link ${isActive("/company") ? "active" : ""}`}>
                <span className="material-icons sidebar-icon">business</span>
                Company Details
              </Link>
              
              <Link href="/users" className={`sidebar-link ${isActive("/users") ? "active" : ""}`}>
                <span className="material-icons sidebar-icon">person</span>
                User Management
              </Link>
              
              <Link href="/billing" className={`sidebar-link ${isActive("/billing") ? "active" : ""}`}>
                <span className="material-icons sidebar-icon">credit_card</span>
                Billing & Credits
              </Link>
              
              <Link href="/credits" className={`sidebar-link sidebar-sublink ${isActive("/credits") ? "active" : ""}`}>
                <span className="material-icons sidebar-icon">add_card</span>
                Purchase Credits
              </Link>
              
              <Link href="/subscription" className={`sidebar-link sidebar-sublink ${isActive("/subscription") ? "active" : ""}`}>
                <span className="material-icons sidebar-icon">shopping_cart</span>
                Buy Credit Packs
              </Link>
              
              <Link href="/transactions" className={`sidebar-link sidebar-sublink ${isActive("/transactions") ? "active" : ""}`}>
                <span className="material-icons sidebar-icon">receipt_long</span>
                Transaction History
              </Link>
            </div>

            {/* Advanced Features */}
            <div className="sidebar-section">
              <h3 className="sidebar-heading">
                Advanced Tools
              </h3>
              
              <Link href="/tax-engine" className={`sidebar-link ${isActive("/tax-engine") ? "active" : ""}`}>
                <span className="material-icons sidebar-icon">calculate</span>
                Tax Preparation Engine
              </Link>
            </div>
            
            {/* Admin & System */}
            {(user as any)?.role === 'admin' && (
              <div className="sidebar-section">
                <h3 className="sidebar-heading">
                  Administration
                </h3>
                
                <Link href="/admin/dashboard" className={`sidebar-link ${isActive("/admin/dashboard") ? "active" : ""}`}>
                  <span className="material-icons sidebar-icon">dashboard</span>
                  Admin Dashboard
                </Link>
                
                <Link href="/admin/users" className={`sidebar-link ${isActive("/admin/users") ? "active" : ""}`}>
                  <span className="material-icons sidebar-icon">group</span>
                  User Management
                </Link>
                
                <Link href="/admin/tiers" className={`sidebar-link ${isActive("/admin/tiers") ? "active" : ""}`} data-testid="link-tier-management">
                  <span className="material-icons sidebar-icon">workspace_premium</span>
                  Pricing Tiers
                </Link>
                
                <Link href="/admin/subscriptions" className={`sidebar-link ${isActive("/admin/subscriptions") ? "active" : ""}`}>
                  <span className="material-icons sidebar-icon">shopping_bag</span>
                  Subscriptions
                </Link>
                
                <Link href="/admin/analytics" className={`sidebar-link ${isActive("/admin/analytics") ? "active" : ""}`}>
                  <span className="material-icons sidebar-icon">insights</span>
                  Analytics
                </Link>
                
                <Link href="/admin/monitoring" className={`sidebar-link ${isActive("/admin/monitoring") ? "active" : ""}`} data-testid="link-monitoring">
                  <span className="material-icons sidebar-icon">monitor_heart</span>
                  System Monitoring
                </Link>
                
                <Link href="/agent-control" className={`sidebar-link ${isActive("/agent-control") ? "active" : ""}`}>
                  <span className="material-icons sidebar-icon">settings</span>
                  Agent Control
                </Link>
                
                <Link href="/agents" className={`sidebar-link ${isActive("/agents") ? "active" : ""}`}>
                  <span className="material-icons sidebar-icon">smart_toy</span>
                  Agent Manager
                </Link>
              </div>
            )}
          </nav>
        </div>

        {/* User Profile */}
        <div className="flex items-center p-4 border-t border-neutral-200 dark:border-neutral-700">
          <div className="flex-shrink-0">
            <Avatar>
              <AvatarImage src={(user as any)?.profileImage || ""} alt={(user as any)?.displayName || user?.email || ""} />
              <AvatarFallback>{(user as any)?.displayName?.charAt(0) || user?.email?.charAt(0) || "U"}</AvatarFallback>
            </Avatar>
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{(user as any)?.displayName || user?.email || "User"}</p>
            <p className="text-xs text-neutral-600 dark:text-neutral-400">{(user as any)?.role || "User"}</p>
          </div>
          <Button 
            onClick={() => logoutMutation.mutate()}
            variant="ghost"
            size="sm"
            className="ml-auto p-2 text-neutral-400 hover:text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;

import { Link, useLocation } from "wouter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { LogOut } from "lucide-react";

const Sidebar = () => {
  const [location] = useLocation();
  const { user, signOut } = useAuth();
  
  const isActive = (path: string) => location === path;

  return (
    <aside className="hidden md:flex md:flex-shrink-0">
      <div className="flex flex-col w-64 bg-white border-r border-neutral-200">
        {/* Logo */}
        <div className="flex items-center justify-center h-16 px-4 border-b border-neutral-200 bg-[hsl(var(--primary-500))]">
          <h1 className="text-2xl font-semibold text-white">
            PromptSubmissions
          </h1>
        </div>

        {/* Navigation Items */}
        <div className="flex flex-col flex-grow p-4 overflow-y-auto">
          <nav className="flex-1 space-y-1">
            {/* Dashboard */}
            <Link href="/">
              <a className={`sidebar-link ${isActive("/") ? "active" : ""}`}>
                <span className="material-icons sidebar-icon">dashboard</span>
                Dashboard
              </a>
            </Link>

            {/* Filings */}
            <div className="sidebar-section">
              <h3 className="sidebar-heading">
                Filings
              </h3>
              
              <Link href="/filings/confirmation-statements">
                <a className={`sidebar-link ${isActive("/filings/confirmation-statements") ? "active" : ""}`}>
                  <span className="material-icons sidebar-icon">description</span>
                  Confirmation Statements
                </a>
              </Link>
              
              <Link href="/filings/annual-accounts">
                <a className={`sidebar-link ${isActive("/filings/annual-accounts") ? "active" : ""}`}>
                  <span className="material-icons sidebar-icon">receipt_long</span>
                  Annual Accounts
                </a>
              </Link>
              
              <Link href="/filings/corporation-tax">
                <a className={`sidebar-link ${isActive("/filings/corporation-tax") ? "active" : ""}`}>
                  <span className="material-icons sidebar-icon">calculate</span>
                  Corporation Tax (CT600)
                </a>
              </Link>
              
              <Link href="/real-world-filing">
                <a className={`sidebar-link ${isActive("/real-world-filing") ? "active" : ""}`}>
                  <span className="material-icons sidebar-icon">assignment</span>
                  Real-World Filing Demo
                </a>
              </Link>
              
              <Link href="/trial-balance">
                <a className={`sidebar-link ${isActive("/trial-balance") ? "active" : ""}`}>
                  <span className="material-icons sidebar-icon">balance</span>
                  Trial Balance
                </a>
              </Link>
              
              <Link href="/financial-reporting">
                <a className={`sidebar-link ${isActive("/financial-reporting") ? "active" : ""}`}>
                  <span className="material-icons sidebar-icon">analytics</span>
                  Financial Reporting
                </a>
              </Link>
            </div>

            {/* Documents */}
            <div className="sidebar-section">
              <h3 className="sidebar-heading">
                Documents
              </h3>
              
              <Link href="/upload">
                <a className={`sidebar-link ${isActive("/upload") ? "active" : ""}`}>
                  <span className="material-icons sidebar-icon">upload_file</span>
                  Upload Documents
                </a>
              </Link>
              
              <Link href="/documents">
                <a className={`sidebar-link ${isActive("/documents") ? "active" : ""}`}>
                  <span className="material-icons sidebar-icon">folder</span>
                  Document Library
                </a>
              </Link>
            </div>

            {/* Account */}
            <div className="sidebar-section">
              <h3 className="sidebar-heading">
                Account
              </h3>
              
              <Link href="/company">
                <a className={`sidebar-link ${isActive("/company") ? "active" : ""}`}>
                  <span className="material-icons sidebar-icon">business</span>
                  Company Details
                </a>
              </Link>
              
              <Link href="/users">
                <a className={`sidebar-link ${isActive("/users") ? "active" : ""}`}>
                  <span className="material-icons sidebar-icon">person</span>
                  User Management
                </a>
              </Link>
              
              <Link href="/billing">
                <a className={`sidebar-link ${isActive("/billing") ? "active" : ""}`}>
                  <span className="material-icons sidebar-icon">credit_card</span>
                  Billing & Credits
                </a>
              </Link>
              
              <Link href="/credits">
                <a className={`sidebar-link sidebar-sublink ${isActive("/credits") ? "active" : ""}`}>
                  <span className="material-icons sidebar-icon">add_card</span>
                  Purchase Credits
                </a>
              </Link>
              
              <Link href="/subscription">
                <a className={`sidebar-link sidebar-sublink ${isActive("/subscription") ? "active" : ""}`}>
                  <span className="material-icons sidebar-icon">shopping_cart</span>
                  Buy Credit Packs
                </a>
              </Link>
              
              <Link href="/transactions">
                <a className={`sidebar-link sidebar-sublink ${isActive("/transactions") ? "active" : ""}`}>
                  <span className="material-icons sidebar-icon">receipt_long</span>
                  Transaction History
                </a>
              </Link>
            </div>

            {/* Advanced Features */}
            <div className="sidebar-section">
              <h3 className="sidebar-heading">
                Advanced Tools
              </h3>
              
              <Link href="/tax-engine">
                <a className={`sidebar-link ${isActive("/tax-engine") ? "active" : ""}`}>
                  <span className="material-icons sidebar-icon">calculate</span>
                  Tax Preparation Engine
                </a>
              </Link>
            </div>
            
            {/* Admin & System */}
            {user?.role === 'admin' && (
              <div className="sidebar-section">
                <h3 className="sidebar-heading">
                  Administration
                </h3>
                
                <Link href="/agents">
                  <a className={`sidebar-link ${isActive("/agents") ? "active" : ""}`}>
                    <span className="material-icons sidebar-icon">smart_toy</span>
                    Agent Manager
                  </a>
                </Link>
                
                <Link href="/admin/dashboard">
                  <a className={`sidebar-link ${isActive("/admin/dashboard") ? "active" : ""}`}>
                    <span className="material-icons sidebar-icon">dashboard</span>
                    Admin Dashboard
                  </a>
                </Link>
              </div>
            )}
          </nav>
        </div>

        {/* User Profile */}
        <div className="flex items-center p-4 border-t border-neutral-200">
          <div className="flex-shrink-0">
            <Avatar>
              <AvatarImage src={user?.profileImage || ""} alt={user?.fullName || ""} />
              <AvatarFallback>{user?.fullName?.charAt(0) || "U"}</AvatarFallback>
            </Avatar>
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-neutral-700">{user?.fullName || "User"}</p>
            <p className="text-xs text-neutral-500">{user?.role || "Guest"}</p>
          </div>
          <Button 
            onClick={signOut}
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

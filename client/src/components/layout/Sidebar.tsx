import { Link, useLocation } from "wouter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";

const Sidebar = () => {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  
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
              
              <Link href="/transactions">
                <a className={`sidebar-link sidebar-sublink ${isActive("/transactions") ? "active" : ""}`}>
                  <span className="material-icons sidebar-icon">receipt_long</span>
                  Transaction History
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
          <button 
            onClick={logout}
            className="ml-auto p-1 rounded-full text-neutral-400 hover:text-neutral-600"
          >
            <span className="material-icons text-xl">logout</span>
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;

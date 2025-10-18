import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useAiAssistant } from "@/contexts/AiAssistantContext";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link, useLocation } from "wouter";
import { LogOut, Menu } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

const Header = () => {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  const { toggleAssistant } = useAiAssistant();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const isActive = (path: string) => location === path;

  // Extract page title from location
  const getPageTitle = () => {
    switch (location) {
      case "/":
        return "Dashboard";
      case "/upload":
        return "Upload Documents";
      case "/new-filing":
        return "New Filing";
      case "/profile":
        return "User Profile";
      case "/billing":
        return "Billing & Credits";
      default:
        if (location.startsWith("/filings/")) {
          const type = location.split("/").pop();
          return type?.split("-").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ") || "Filings";
        }
        return "PromptSubmissions";
    }
  };

  return (
    <header className="bg-white shadow-sm z-10">
      <div className="flex items-center justify-between h-16 px-4 border-b border-neutral-200">
        {/* Mobile Menu Toggle */}
        <Button 
          variant="ghost" 
          size="icon" 
          className="md:flex lg:hidden hidden"
          onClick={() => setMobileMenuOpen(true)}
          data-testid="button-mobile-menu"
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Breadcrumb */}
        <div className="hidden md:flex items-center ml-4">
          <span className="text-sm font-medium text-neutral-500">{getPageTitle()}</span>
        </div>

        {/* Right Side Items */}
        <div className="flex items-center">
          {/* Credits Display */}
          <div className="hidden md:flex items-center px-3 py-1 mr-4 rounded-full bg-neutral-100">
            <span className="material-icons mr-1 text-[hsl(var(--secondary-500))]">toll</span>
            <span className="text-sm font-medium text-neutral-700">Credits: <span>{user?.credits || 0}</span></span>
          </div>

          {/* Notification Button */}
          <button className="p-2 text-neutral-400 rounded-full hover:text-neutral-500 relative">
            <span className="material-icons">notifications</span>
            <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-[hsl(var(--accent-500))]"></span>
          </button>

          {/* Theme Toggle */}
          <div className="ml-2">
            <ThemeToggle />
          </div>

          {/* AI Assistant Button */}
          <Button 
            onClick={toggleAssistant}
            className="ml-3 text-sm font-medium text-white bg-[hsl(var(--primary-500))] hover:bg-[hsl(var(--primary-600))]"
          >
            <span className="material-icons mr-1 text-sm">smart_toy</span>
            <span>Prompt AI</span>
          </Button>
        </div>
      </div>

      {/* Mobile Navigation Sheet */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="w-[300px] p-0">
          <SheetHeader className="bg-[hsl(var(--primary-500))] p-4 text-left">
            <SheetTitle className="text-white text-xl">PromptSubmissions</SheetTitle>
          </SheetHeader>
          
          <div className="flex flex-col h-full">
            {/* Navigation Links */}
            <nav className="flex-1 overflow-y-auto p-4 space-y-1">
              <Link 
                href="/" 
                className={`sidebar-link ${isActive("/") ? "active" : ""}`}
                onClick={() => setMobileMenuOpen(false)}
                data-testid="link-dashboard"
              >
                <span className="material-icons sidebar-icon">dashboard</span>
                Dashboard
              </Link>

              <div className="sidebar-section">
                <h3 className="sidebar-heading">Filings</h3>
                <Link 
                  href="/filings/confirmation-statements" 
                  className={`sidebar-link ${isActive("/filings/confirmation-statements") ? "active" : ""}`}
                  onClick={() => setMobileMenuOpen(false)}
                  data-testid="link-confirmation-statements"
                >
                  <span className="material-icons sidebar-icon">description</span>
                  Confirmation Statements
                </Link>
                <Link 
                  href="/filings/annual-accounts" 
                  className={`sidebar-link ${isActive("/filings/annual-accounts") ? "active" : ""}`}
                  onClick={() => setMobileMenuOpen(false)}
                  data-testid="link-annual-accounts"
                >
                  <span className="material-icons sidebar-icon">receipt_long</span>
                  Annual Accounts
                </Link>
                <Link 
                  href="/filings/corporation-tax" 
                  className={`sidebar-link ${isActive("/filings/corporation-tax") ? "active" : ""}`}
                  onClick={() => setMobileMenuOpen(false)}
                  data-testid="link-corporation-tax"
                >
                  <span className="material-icons sidebar-icon">calculate</span>
                  Corporation Tax
                </Link>
              </div>

              <div className="sidebar-section">
                <h3 className="sidebar-heading">Documents</h3>
                <Link 
                  href="/upload" 
                  className={`sidebar-link ${isActive("/upload") ? "active" : ""}`}
                  onClick={() => setMobileMenuOpen(false)}
                  data-testid="link-upload"
                >
                  <span className="material-icons sidebar-icon">upload_file</span>
                  Upload Documents
                </Link>
              </div>

              <div className="sidebar-section">
                <h3 className="sidebar-heading">Account</h3>
                <Link 
                  href="/billing" 
                  className={`sidebar-link ${isActive("/billing") ? "active" : ""}`}
                  onClick={() => setMobileMenuOpen(false)}
                  data-testid="link-billing"
                >
                  <span className="material-icons sidebar-icon">credit_card</span>
                  Billing & Credits
                </Link>
              </div>

              {user?.role === 'admin' && (
                <div className="sidebar-section">
                  <h3 className="sidebar-heading">Admin</h3>
                  <Link 
                    href="/admin" 
                    className={`sidebar-link ${isActive("/admin") ? "active" : ""}`}
                    onClick={() => setMobileMenuOpen(false)}
                    data-testid="link-admin"
                  >
                    <span className="material-icons sidebar-icon">admin_panel_settings</span>
                    Admin Panel
                  </Link>
                </div>
              )}
            </nav>

            {/* User Profile */}
            <div className="border-t border-neutral-200 p-4">
              <div className="flex items-center mb-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={(user as any)?.profileImage || ""} />
                  <AvatarFallback>{user?.email?.charAt(0) || "U"}</AvatarFallback>
                </Avatar>
                <div className="ml-3 flex-1">
                  <p className="text-sm font-medium text-neutral-700">{user?.email || "User"}</p>
                  <p className="text-xs text-neutral-500">{user?.role || "User"}</p>
                </div>
              </div>
              <Button 
                onClick={() => {
                  logoutMutation.mutate();
                  setMobileMenuOpen(false);
                }}
                variant="outline"
                className="w-full"
                data-testid="button-logout"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </header>
  );
};

export default Header;

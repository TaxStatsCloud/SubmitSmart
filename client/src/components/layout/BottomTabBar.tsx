import { Link, useLocation } from "wouter";
import { Home, FileText, Upload, CreditCard, Menu } from "lucide-react";
import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { LogOut } from "lucide-react";

const BottomTabBar = () => {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  
  const isActive = (path: string) => location === path || location.startsWith(path);

  return (
    <>
      {/* Bottom Tab Bar - Fixed at bottom on mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 z-40">
        <div className="flex items-center justify-around h-16">
          {/* Dashboard Tab */}
          <Link 
            href="/"
            className={`flex flex-col items-center justify-center flex-1 h-full min-h-[44px] ${
              location === "/"
                ? "text-[hsl(var(--primary-500))]" 
                : "text-neutral-400"
            }`}
            data-testid="tab-dashboard"
          >
            <Home className="h-6 w-6 mb-1" />
            <span className="text-xs font-medium">Home</span>
          </Link>

          {/* Filings Tab */}
          <Link 
            href="/filings/annual-accounts"
            className={`flex flex-col items-center justify-center flex-1 h-full min-h-[44px] ${
              isActive("/filings") ? "text-[hsl(var(--primary-500))]" : "text-neutral-400"
            }`}
            data-testid="tab-filings"
          >
            <FileText className="h-6 w-6 mb-1" />
            <span className="text-xs font-medium">Filings</span>
          </Link>

          {/* Upload Tab */}
          <Link 
            href="/upload"
            className={`flex flex-col items-center justify-center flex-1 h-full min-h-[44px] ${
              isActive("/upload") ? "text-[hsl(var(--primary-500))]" : "text-neutral-400"
            }`}
            data-testid="tab-upload"
          >
            <Upload className="h-6 w-6 mb-1" />
            <span className="text-xs font-medium">Upload</span>
          </Link>

          {/* Billing Tab */}
          <Link 
            href="/billing"
            className={`flex flex-col items-center justify-center flex-1 h-full min-h-[44px] ${
              isActive("/billing") ? "text-[hsl(var(--primary-500))]" : "text-neutral-400"
            }`}
            data-testid="tab-billing"
          >
            <CreditCard className="h-6 w-6 mb-1" />
            <span className="text-xs font-medium">Billing</span>
          </Link>

          {/* More Menu Tab */}
          <button
            onClick={() => setMoreMenuOpen(true)}
            className={`flex flex-col items-center justify-center flex-1 h-full min-h-[44px] ${
              moreMenuOpen ? "text-[hsl(var(--primary-500))]" : "text-neutral-400"
            }`}
            data-testid="tab-more"
          >
            <Menu className="h-6 w-6 mb-1" />
            <span className="text-xs font-medium">More</span>
          </button>
        </div>
      </nav>

      {/* More Menu Sheet */}
      <Sheet open={moreMenuOpen} onOpenChange={setMoreMenuOpen}>
        <SheetContent side="bottom" className="h-[70vh] p-0">
          <SheetHeader className="bg-[hsl(var(--primary-500))] p-4 text-left">
            <SheetTitle className="text-white text-xl">More Options</SheetTitle>
          </SheetHeader>
          
          <div className="flex flex-col h-full">
            {/* Additional Navigation Links */}
            <nav className="flex-1 overflow-y-auto p-4 space-y-1">
              <div className="sidebar-section">
                <h3 className="sidebar-heading">Filings</h3>
                <Link 
                  href="/filings/confirmation-statements" 
                  className={`sidebar-link ${isActive("/filings/confirmation-statements") ? "active" : ""}`}
                  onClick={() => setMoreMenuOpen(false)}
                  data-testid="link-confirmation-statements"
                >
                  <span className="material-icons sidebar-icon">description</span>
                  Confirmation Statements
                </Link>
                <Link 
                  href="/filings/annual-accounts" 
                  className={`sidebar-link ${isActive("/filings/annual-accounts") ? "active" : ""}`}
                  onClick={() => setMoreMenuOpen(false)}
                  data-testid="link-annual-accounts"
                >
                  <span className="material-icons sidebar-icon">receipt_long</span>
                  Annual Accounts
                </Link>
                <Link 
                  href="/filings/corporation-tax" 
                  className={`sidebar-link ${isActive("/filings/corporation-tax") ? "active" : ""}`}
                  onClick={() => setMoreMenuOpen(false)}
                  data-testid="link-corporation-tax"
                >
                  <span className="material-icons sidebar-icon">calculate</span>
                  Corporation Tax
                </Link>
              </div>

              <div className="sidebar-section">
                <h3 className="sidebar-heading">Documents</h3>
                <Link 
                  href="/documents" 
                  className={`sidebar-link ${isActive("/documents") ? "active" : ""}`}
                  onClick={() => setMoreMenuOpen(false)}
                  data-testid="link-documents"
                >
                  <span className="material-icons sidebar-icon">folder</span>
                  Document Library
                </Link>
              </div>

              <div className="sidebar-section">
                <h3 className="sidebar-heading">Account</h3>
                <Link 
                  href="/company" 
                  className={`sidebar-link ${isActive("/company") ? "active" : ""}`}
                  onClick={() => setMoreMenuOpen(false)}
                  data-testid="link-company"
                >
                  <span className="material-icons sidebar-icon">business</span>
                  Company Details
                </Link>
                <Link 
                  href="/users" 
                  className={`sidebar-link ${isActive("/users") ? "active" : ""}`}
                  onClick={() => setMoreMenuOpen(false)}
                  data-testid="link-users"
                >
                  <span className="material-icons sidebar-icon">person</span>
                  User Management
                </Link>
              </div>

              {user?.role === 'admin' && (
                <div className="sidebar-section">
                  <h3 className="sidebar-heading">Admin</h3>
                  <Link 
                    href="/admin" 
                    className={`sidebar-link ${isActive("/admin") ? "active" : ""}`}
                    onClick={() => setMoreMenuOpen(false)}
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
                  setMoreMenuOpen(false);
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
    </>
  );
};

export default BottomTabBar;

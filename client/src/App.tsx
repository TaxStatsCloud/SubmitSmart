import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/Dashboard";
import Upload from "@/pages/Upload";
import NewFiling from "@/pages/NewFiling";
import UserProfile from "@/pages/UserProfile";
import Billing from "@/pages/Billing";
import AgentDashboard from "@/pages/AgentDashboard";
import Credits from "@/pages/Credits";
import CreditTransactions from "@/pages/CreditTransactions";
import AppLayout from "@/components/layout/AppLayout";
import Login from "@/pages/Login";
import Subscription from "@/pages/Subscription";
import { AuthProvider } from "@/contexts/AuthContext";
import { AiAssistantProvider } from "@/contexts/AiAssistantContext";
import { useEffect } from "react";
import { initWebSocket } from "@/lib/websocket";

// Import the new page components
import CompanyDetails from "@/pages/CompanyDetails";
import UserManagement from "@/pages/UserManagement";
import DocumentLibrary from "@/pages/DocumentLibrary";
import ConfirmationStatement from "@/pages/ConfirmationStatement";
import AnnualAccounts from "@/pages/AnnualAccounts";
import CorporationTax from "@/pages/CorporationTax";
import AdminDashboard from "@/pages/AdminDashboard";
import TaxEngine from "@/pages/TaxEngine";
import RealWorldFiling from "@/pages/RealWorldFiling";
import ExtendedTrialBalance from "@/pages/ExtendedTrialBalance";
import FinancialReporting from "@/pages/FinancialReporting";

function Router() {
  return (
    <AppLayout>
      <Switch>
        {/* Authentication */}
        <Route path="/login" component={Login} />
        
        {/* Dashboard */}
        <Route path="/" component={Dashboard} />
        
        {/* Filing routes */}
        <Route path="/new-filing" component={NewFiling} />
        <Route path="/filings/confirmation-statements" component={ConfirmationStatement} />
        <Route path="/filings/annual-accounts" component={AnnualAccounts} />
        <Route path="/filings/corporation-tax" component={CorporationTax} />
        
        {/* Real-world filing demo */}
        <Route path="/real-world-filing" component={RealWorldFiling} />
        
        {/* Trial balance and accounting */}
        <Route path="/trial-balance" component={ExtendedTrialBalance} />
        
        {/* Financial reporting */}
        <Route path="/financial-reporting" component={FinancialReporting} />
        
        {/* Document routes */}
        <Route path="/upload" component={Upload} />
        <Route path="/documents" component={DocumentLibrary} />
        
        {/* Account routes */}
        <Route path="/profile" component={UserProfile} />
        <Route path="/company" component={CompanyDetails} />
        <Route path="/users" component={UserManagement} />
        
        {/* Billing routes */}
        <Route path="/billing" component={Billing} />
        <Route path="/credits" component={Credits} />
        <Route path="/transactions" component={CreditTransactions} />
        <Route path="/subscription" component={Subscription} />
        
        {/* Advanced features */}
        <Route path="/tax-engine" component={TaxEngine} />
        
        {/* Admin routes */}
        <Route path="/agents" component={AgentDashboard} />
        <Route path="/admin/dashboard" component={AdminDashboard} />
        
        {/* 404 route */}
        <Route component={NotFound} />
      </Switch>
    </AppLayout>
  );
}

function App() {
  // Initialize WebSocket connection when App loads
  useEffect(() => {
    // Wait until the page is fully loaded to avoid
    // conflicts with Vite's WebSocket
    const timer = setTimeout(() => {
      try {
        initWebSocket();
        console.log("WebSocket connection initialized");
      } catch (error) {
        console.error("Failed to initialize WebSocket:", error);
      }
    }, 2000);
    
    return () => clearTimeout(timer);
  }, []);
  
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AiAssistantProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </AiAssistantProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;

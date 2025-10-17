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
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { AiAssistantProvider } from "@/contexts/AiAssistantContext";
import { AIChatbot } from "@/components/chat/AIChatbot";
import { useEffect } from "react";
import { initWebSocket } from "@/lib/websocket";

// Import the new page components
import CompanyDetails from "@/pages/CompanyDetails";
import UserManagement from "@/pages/UserManagement";
import DocumentLibrary from "@/pages/DocumentLibrary";
import ConfirmationStatement from "@/pages/ConfirmationStatement";
import AnnualAccounts from "@/pages/AnnualAccounts";
import CT600Filing from "@/pages/CT600Filing";
import AnnualAccountsWizard from "@/pages/AnnualAccountsWizard";
import ConfirmationStatementWizard from "@/pages/ConfirmationStatementWizard";
import AdminDashboard from "@/pages/AdminDashboard";
import TaxEngine from "@/pages/TaxEngine";
import RealWorldFiling from "@/pages/RealWorldFiling";
import ExtendedTrialBalance from "@/pages/ExtendedTrialBalance";
import FinancialReporting from "@/pages/FinancialReporting";
import ComparativePeriods from "@/pages/ComparativePeriods";
import OpeningTrialBalance from "@/pages/OpeningTrialBalance";
import HMRCIntegration from "@/pages/HMRCIntegration";
import ValidationDemo from "@/pages/ValidationDemo";
import HMRCTest from "@/pages/HMRCTest";
import FilingReview from "@/pages/FilingReview";
import Landing from "@/pages/Landing";
import Terms from "@/pages/Terms";
import Privacy from "@/pages/Privacy";
import ProspectsDashboard from "@/pages/ProspectsDashboard";
import AnalyticsDashboard from "@/pages/AnalyticsDashboard";
import AuthPage from "@/pages/AuthPage";
import AgentControlPanel from "@/pages/AgentControlPanel";
import SubscriptionManagement from "@/pages/SubscriptionManagement";
import AdminAnalytics from "@/pages/AdminAnalytics";
import MonitoringDashboard from "@/pages/MonitoringDashboard";
import OnboardingTutorial from "@/pages/OnboardingTutorial";
import { ProtectedRoute } from "@/lib/protected-route";

function Router() {
  const { user, isLoading } = useAuth();

  // Show landing page for logged-out users or loading state
  if (isLoading || !user) {
    return (
      <Switch>
        <Route path="/" component={Landing} />
        <Route path="/auth" component={AuthPage} />
        <Route path="/terms" component={Terms} />
        <Route path="/privacy" component={Privacy} />
        <Route component={Landing} />
      </Switch>
    );
  }

  // Show app layout with protected routes for logged-in users
  return (
    <AppLayout>
      <Switch>
        {/* Dashboard */}
        <ProtectedRoute path="/" component={Dashboard} />
        
        {/* Onboarding */}
        <Route path="/onboarding" component={OnboardingTutorial} />
        
        {/* Filing routes */}
        <Route path="/new-filing" component={NewFiling} />
        <Route path="/filings/confirmation-statements" component={ConfirmationStatement} />
        <Route path="/filings/annual-accounts" component={AnnualAccounts} />
        <Route path="/filings/corporation-tax" component={CT600Filing} />
        <Route path="/filings/review" component={FilingReview} />
        
        {/* Filing Wizards */}
        <Route path="/wizards/annual-accounts" component={AnnualAccountsWizard} />
        <Route path="/wizards/confirmation-statement" component={ConfirmationStatementWizard} />
        <Route path="/wizards/ct600" component={CT600Filing} />
        
        {/* Real-world filing demo */}
        <Route path="/real-world-filing" component={RealWorldFiling} />
        
        {/* Trial balance and accounting */}
        <Route path="/trial-balance" component={ExtendedTrialBalance} />
        
        {/* Financial reporting */}
        <Route path="/financial-reporting" component={FinancialReporting} />
        <Route path="/comparative-periods" component={ComparativePeriods} />
        <Route path="/opening-trial-balance" component={OpeningTrialBalance} />
        
        {/* HMRC Integration */}
        <Route path="/hmrc-integration" component={HMRCIntegration} />
        
        {/* HMRC Test Submission */}
        <Route path="/hmrc-test" component={HMRCTest} />
        
        {/* Validation Demo */}
        <Route path="/validation-demo" component={ValidationDemo} />
        
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
        <Route path="/agent-control" component={AgentControlPanel} />
        <Route path="/prospects" component={ProspectsDashboard} />
        <Route path="/analytics" component={AnalyticsDashboard} />
        <Route path="/admin/dashboard" component={AdminDashboard} />
        <Route path="/admin/users" component={UserManagement} />
        <Route path="/admin/subscriptions" component={SubscriptionManagement} />
        <Route path="/admin/analytics" component={AdminAnalytics} />
        <Route path="/admin/monitoring" component={MonitoringDashboard} />
        
        {/* 404 route */}
        <Route component={NotFound} />
      </Switch>
    </AppLayout>
  );
}

function App() {
  // Global error handlers for unhandled rejections
  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      // Log unhandled promise rejections in development only
      if (process.env.NODE_ENV === 'development') {
        console.error('Unhandled promise rejection:', event.reason);
      }
      event.preventDefault(); // Prevent the error from appearing in console as unhandled
    };

    const handleError = (event: ErrorEvent) => {
      // Log global errors in development only
      if (process.env.NODE_ENV === 'development') {
        console.error('Global error:', event.error);
      }
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleError);

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleError);
    };
  }, []);

  // Initialize WebSocket connection when App loads
  useEffect(() => {
    // Wait until the page is fully loaded to avoid
    // conflicts with Vite's WebSocket
    const timer = setTimeout(() => {
      try {
        initWebSocket();
        // WebSocket connection established successfully
      } catch (error) {
        // Silently handle WebSocket initialization failures
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
            <AIChatbot />
          </TooltipProvider>
        </AiAssistantProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;

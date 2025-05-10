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
import AppLayout from "@/components/layout/AppLayout";
import { AuthProvider } from "@/contexts/AuthContext";
import { AiAssistantProvider } from "@/contexts/AiAssistantContext";

function Router() {
  return (
    <AppLayout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/upload" component={Upload} />
        <Route path="/new-filing" component={NewFiling} />
        <Route path="/profile" component={UserProfile} />
        <Route path="/billing" component={Billing} />
        <Route component={NotFound} />
      </Switch>
    </AppLayout>
  );
}

function App() {
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

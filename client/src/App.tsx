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
import AppLayout from "@/components/layout/AppLayout";
import { AuthProvider } from "@/contexts/AuthContext";
import { AiAssistantProvider } from "@/contexts/AiAssistantContext";
import { useEffect } from "react";
import { initWebSocket } from "@/lib/websocket";

function Router() {
  return (
    <AppLayout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/upload" component={Upload} />
        <Route path="/new-filing" component={NewFiling} />
        <Route path="/profile" component={UserProfile} />
        <Route path="/billing" component={Billing} />
        <Route path="/agents" component={AgentDashboard} />
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

import { ReactNode } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import BottomTabBar from "./BottomTabBar";
import AssistantPanel from "@/components/ai/AssistantPanel";
import { useAiAssistant } from "@/contexts/AiAssistantContext";
import { Footer } from "@/components/layout/Footer";

interface AppLayoutProps {
  children: ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
  const { isAssistantOpen } = useAiAssistant();

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar / Navigation */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Top Header */}
        <Header />

        {/* Main Content - Extra padding on mobile for bottom tab bar */}
        <main className="flex-1 overflow-y-auto bg-[hsl(var(--neutral-50))] p-4 md:p-6 pb-20 md:pb-6">
          {children}
        </main>

        {/* Footer with Legal Disclaimer */}
        <Footer />
      </div>

      {/* Bottom Tab Bar (Mobile Only) */}
      <BottomTabBar />

      {/* AI Assistant (conditionally rendered) */}
      {isAssistantOpen && <AssistantPanel />}
    </div>
  );
};

export default AppLayout;

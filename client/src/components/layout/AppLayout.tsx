import { ReactNode } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import AssistantPanel from "@/components/ai/AssistantPanel";
import { useAiAssistant } from "@/contexts/AiAssistantContext";

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

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-[hsl(var(--neutral-50))] p-4 md:p-6">
          {children}
        </main>
      </div>

      {/* AI Assistant (conditionally rendered) */}
      {isAssistantOpen && <AssistantPanel />}
    </div>
  );
};

export default AppLayout;

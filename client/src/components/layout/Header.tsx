import { useAuth } from "@/contexts/AuthContext";
import { useAiAssistant } from "@/contexts/AiAssistantContext";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";

const Header = () => {
  const [location] = useLocation();
  const { user } = useAuth();
  const { toggleAssistant } = useAiAssistant();

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
        <button type="button" className="md:hidden p-2 text-neutral-400 rounded-md">
          <span className="material-icons">menu</span>
        </button>

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

          {/* AI Assistant Button */}
          <Button 
            onClick={toggleAssistant}
            className="ml-3 text-sm font-medium text-white bg-[hsl(var(--primary-500))] hover:bg-[hsl(var(--primary-600))]"
          >
            <span className="material-icons mr-1 text-sm">smart_toy</span>
            <span>PromptSubmissions Assistant</span>
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;

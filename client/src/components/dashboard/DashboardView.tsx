import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useSwipeable } from "react-swipeable";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import QuickActions from "./QuickActions";
import UpcomingFilings from "./UpcomingFilings";
import DraftFilings from "./DraftFilings";
import RecentActivity from "./RecentActivity";
import FilingAnalytics from "./FilingAnalytics";
import DeadlineWarnings from "./DeadlineWarnings";
import CreditUsageChart from "./CreditUsageChart";
import FilingRecommendations from "./FilingRecommendations";

// Mobile-optimized collapsible section wrapper with swipe gestures
const DashboardSection = ({ 
  title, 
  children, 
  defaultOpen = true,
  alwaysOpen = false
}: { 
  title: string; 
  children: React.ReactNode; 
  defaultOpen?: boolean;
  alwaysOpen?: boolean;
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  // Add swipe gesture support - swipe up to collapse, swipe down to expand
  const swipeHandlers = useSwipeable({
    onSwipedUp: () => !alwaysOpen && setIsOpen(false),
    onSwipedDown: () => !alwaysOpen && setIsOpen(true),
    preventScrollOnSwipe: false,
    trackMouse: false, // Only touch events, not mouse
  });

  if (alwaysOpen) {
    return <div className="mb-6">{children}</div>;
  }

  return (
    <Collapsible 
      open={isOpen} 
      onOpenChange={setIsOpen}
      className="mb-6"
      data-testid={`section-${title.toLowerCase().replace(/\s+/g, '-')}`}
    >
      <div 
        {...swipeHandlers}
        className="touch-pan-y" 
        data-testid={`swipeable-${title.toLowerCase().replace(/\s+/g, '-')}`}
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">{title}</h2>
          <CollapsibleTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm"
              className="h-11 w-11 p-0 min-h-[44px] min-w-[44px]"
              data-testid={`button-toggle-${title.toLowerCase().replace(/\s+/g, '-')}`}
            >
              {isOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </Button>
          </CollapsibleTrigger>
        </div>
        <CollapsibleContent>
          {children}
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
};

const DashboardView = () => {
  const { user } = useAuth();
  const firstName = user?.fullName?.split(' ')[0] || "User";

  return (
    <div className="pb-6">
      {/* Welcome and Quick Stats */}
      <div className="mb-6 md:mb-8">
        <h1 className="text-xl md:text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-3">Welcome, {firstName}</h1>
        <p className="text-sm md:text-base text-neutral-900 dark:text-neutral-100 max-w-3xl font-medium">
          Your dashboard shows an overview of your upcoming filings and compliance status. Upload documents to get started with automated filing preparation.
        </p>
      </div>

      {/* Deadline Warnings - Always visible (high priority) */}
      <DashboardSection title="" alwaysOpen>
        <DeadlineWarnings />
      </DashboardSection>

      {/* Quick Actions Section - Always visible on mobile for easy access */}
      <DashboardSection title="Quick Actions" alwaysOpen>
        <QuickActions />
      </DashboardSection>

      {/* Filing Analytics Section - Collapsible on mobile */}
      <DashboardSection title="Filing Analytics" defaultOpen={true}>
        <FilingAnalytics />
      </DashboardSection>

      {/* Credit Usage Section - Collapsible on mobile */}
      <DashboardSection title="Credit Usage" defaultOpen={false}>
        <CreditUsageChart />
      </DashboardSection>

      {/* Smart Filing Recommendations - Collapsible on mobile */}
      <DashboardSection title="Recommended Actions" defaultOpen={true}>
        <FilingRecommendations />
      </DashboardSection>

      {/* Upcoming Filings Section - Collapsible on mobile */}
      <DashboardSection title="Upcoming Filings" defaultOpen={true}>
        <UpcomingFilings />
      </DashboardSection>

      {/* Drafts and Recent Activity - Stack on mobile, side-by-side on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <DashboardSection title="Draft Filings" defaultOpen={false}>
          <DraftFilings />
        </DashboardSection>
        <DashboardSection title="Recent Activity" defaultOpen={false}>
          <RecentActivity />
        </DashboardSection>
      </div>
    </div>
  );
};

export default DashboardView;

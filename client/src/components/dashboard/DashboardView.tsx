import { useAuth } from "@/hooks/use-auth";
import QuickActions from "./QuickActions";
import UpcomingFilings from "./UpcomingFilings";
import DraftFilings from "./DraftFilings";
import RecentActivity from "./RecentActivity";
import FilingAnalytics from "./FilingAnalytics";

const DashboardView = () => {
  const { user } = useAuth();
  const firstName = user?.fullName?.split(' ')[0] || "User";

  return (
    <>
      {/* Welcome and Quick Stats */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-neutral-800 mb-2">Welcome, {firstName}</h1>
        <p className="text-neutral-600 max-w-3xl">
          Your dashboard shows an overview of your upcoming filings and compliance status. Upload documents to get started with automated filing preparation.
        </p>
      </div>

      {/* Filing Analytics Section */}
      <FilingAnalytics />

      {/* Quick Actions Section */}
      <QuickActions />

      {/* Upcoming Filings Section */}
      <UpcomingFilings />

      {/* Drafts and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DraftFilings />
        <RecentActivity />
      </div>
    </>
  );
};

export default DashboardView;

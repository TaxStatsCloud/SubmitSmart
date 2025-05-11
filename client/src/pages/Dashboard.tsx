import DashboardView from "@/components/dashboard/DashboardView";
import { Helmet } from "react-helmet-async";

const Dashboard = () => {
  return (
    <>
      <Helmet>
        <title>Dashboard | PromptSubmissions</title>
        <meta name="description" content="View your filing deadlines, draft documents, and recent activity on the PromptSubmissions dashboard." />
      </Helmet>
      <DashboardView />
    </>
  );
};

export default Dashboard;

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { EnhancedCard } from "@/components/ui/enhanced-card";
import { GlassCard } from "@/components/ui/glass-card";
import { Link } from "wouter";
import { 
  TrendingUp, 
  FileText, 
  Calendar, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Building2,
  Zap,
  Shield,
  Star,
  CreditCard,
  Users,
  ArrowRight,
  Sparkles,
  Target,
  BarChart3,
  Activity
} from "lucide-react";

interface DashboardData {
  filings: any[];
  activities: any[];
  credits: number;
  pendingTasks: number;
  completedFilings: number;
  upcomingDeadlines: any[];
}

export default function EnhancedDashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState("30days");
  
  const { data: dashboardData, isLoading } = useQuery<DashboardData>({
    queryKey: ['/api/dashboard'],
    queryFn: async () => {
      const [filings, activities] = await Promise.all([
        fetch('/api/filings').then(res => res.json()),
        fetch('/api/activities').then(res => res.json())
      ]);
      
      return {
        filings,
        activities,
        credits: 150, // Mock data for demo
        pendingTasks: 3,
        completedFilings: 12,
        upcomingDeadlines: [
          { company: "Example Ltd", type: "Annual Accounts", due: "2024-12-31", urgency: "medium" },
          { company: "Demo Corp", type: "Corporation Tax", due: "2024-11-30", urgency: "high" }
        ]
      };
    }
  });

  const quickStats = [
    {
      title: "Active Credits",
      value: dashboardData?.credits || 0,
      change: "+12%",
      trend: "up",
      icon: <CreditCard className="h-5 w-5" />,
      color: "bg-blue-500"
    },
    {
      title: "Completed Filings",
      value: dashboardData?.completedFilings || 0,
      change: "+8%",
      trend: "up",
      icon: <CheckCircle className="h-5 w-5" />,
      color: "bg-green-500"
    },
    {
      title: "Pending Tasks",
      value: dashboardData?.pendingTasks || 0,
      change: "-15%",
      trend: "down",
      icon: <Clock className="h-5 w-5" />,
      color: "bg-yellow-500"
    },
    {
      title: "Active Companies",
      value: "24",
      change: "+5%",
      trend: "up",
      icon: <Building2 className="h-5 w-5" />,
      color: "bg-purple-500"
    }
  ];

  const recentActivities = dashboardData?.activities?.slice(0, 5) || [];
  const upcomingDeadlines = dashboardData?.upcomingDeadlines || [];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 bg-clip-text text-transparent">
                Dashboard
              </h1>
              <p className="text-gray-600 mt-2">Welcome back! Here's what's happening with your compliance.</p>
            </div>
            <div className="flex items-center gap-4">
              <Badge className="bg-green-100 text-green-800 border-green-200">
                <Activity className="h-3 w-3 mr-1" />
                All Systems Operational
              </Badge>
              <Link href="/subscription">
                <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                  <Star className="h-4 w-4 mr-2" />
                  Upgrade Plan
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* April 2027 Alert */}
        <Alert className="mb-8 border-amber-200 bg-amber-50">
          <AlertTriangle className="h-5 w-5 text-amber-600" />
          <AlertDescription className="text-amber-800">
            <strong>April 2027 Deadline Approaching:</strong> All UK companies must use software for filing. 
            You're already prepared with PromptSubmissions! 
            <Link href="/subscription" className="underline ml-1">Learn more about our compliance solutions</Link>
          </AlertDescription>
        </Alert>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {quickStats.map((stat, index) => (
            <GlassCard key={index} className="p-6" variant="default">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">{stat.title}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{stat.value}</p>
                  <div className="flex items-center gap-1 mt-2">
                    <TrendingUp className={`h-3 w-3 ${stat.trend === 'up' ? 'text-green-500' : 'text-red-500'}`} />
                    <span className={`text-xs font-medium ${stat.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                      {stat.change}
                    </span>
                  </div>
                </div>
                <div className={`${stat.color} rounded-full p-3 text-white`}>
                  {stat.icon}
                </div>
              </div>
            </GlassCard>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick Actions */}
            <EnhancedCard 
              title="Quick Actions" 
              description="Common tasks and shortcuts"
              icon={<Zap className="h-5 w-5" />}
              variant="premium"
              gradient
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Link href="/upload">
                  <Button variant="outline" className="w-full h-auto p-4 flex-col gap-2 hover:bg-blue-50 hover:border-blue-200">
                    <FileText className="h-6 w-6 text-blue-600" />
                    <span className="font-medium">Upload Documents</span>
                    <span className="text-xs text-gray-500">Process financial documents with AI</span>
                  </Button>
                </Link>
                <Link href="/trial-balance">
                  <Button variant="outline" className="w-full h-auto p-4 flex-col gap-2 hover:bg-green-50 hover:border-green-200">
                    <BarChart3 className="h-6 w-6 text-green-600" />
                    <span className="font-medium">Trial Balance</span>
                    <span className="text-xs text-gray-500">Generate extended trial balance</span>
                  </Button>
                </Link>
                <Link href="/financial-reporting">
                  <Button variant="outline" className="w-full h-auto p-4 flex-col gap-2 hover:bg-purple-50 hover:border-purple-200">
                    <Target className="h-6 w-6 text-purple-600" />
                    <span className="font-medium">Financial Reports</span>
                    <span className="text-xs text-gray-500">Generate P&L, Balance Sheet</span>
                  </Button>
                </Link>
                <Link href="/filings/corporation-tax">
                  <Button variant="outline" className="w-full h-auto p-4 flex-col gap-2 hover:bg-orange-50 hover:border-orange-200">
                    <Calendar className="h-6 w-6 text-orange-600" />
                    <span className="font-medium">Corporation Tax</span>
                    <span className="text-xs text-gray-500">Prepare CT600 returns</span>
                  </Button>
                </Link>
              </div>
            </EnhancedCard>

            {/* Recent Activities */}
            <EnhancedCard 
              title="Recent Activities" 
              description="Latest actions and updates"
              icon={<Activity className="h-5 w-5" />}
              badge={`${recentActivities.length} activities`}
            >
              <div className="space-y-4">
                {recentActivities.map((activity, index) => (
                  <div key={index} className="flex items-start gap-4 p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                    <div className="p-2 bg-blue-100 rounded-full">
                      <FileText className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{activity.description}</p>
                      <p className="text-sm text-gray-500 mt-1">
                        {new Date(activity.createdAt).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {activity.type}
                    </Badge>
                  </div>
                ))}
                {recentActivities.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Activity className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No recent activities</p>
                  </div>
                )}
              </div>
            </EnhancedCard>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Upcoming Deadlines */}
            <EnhancedCard 
              title="Upcoming Deadlines" 
              description="Important filing dates"
              icon={<Calendar className="h-5 w-5" />}
              variant="warning"
              badge={`${upcomingDeadlines.length} upcoming`}
            >
              <div className="space-y-3">
                {upcomingDeadlines.map((deadline, index) => (
                  <div key={index} className="p-3 rounded-lg border border-gray-200 bg-white">
                    <div className="flex items-center justify-between mb-2">
                      <Badge 
                        variant={deadline.urgency === 'high' ? 'destructive' : 'secondary'}
                        className="text-xs"
                      >
                        {deadline.urgency} priority
                      </Badge>
                      <span className="text-xs text-gray-500">
                        Due: {new Date(deadline.due).toLocaleDateString('en-GB')}
                      </span>
                    </div>
                    <p className="font-medium text-gray-900">{deadline.company}</p>
                    <p className="text-sm text-gray-600">{deadline.type}</p>
                  </div>
                ))}
                {upcomingDeadlines.length === 0 && (
                  <div className="text-center py-6 text-gray-500">
                    <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                    <p className="text-sm">No upcoming deadlines</p>
                  </div>
                )}
              </div>
            </EnhancedCard>

            {/* Credit Usage */}
            <EnhancedCard 
              title="Credit Usage" 
              description="Current billing period"
              icon={<CreditCard className="h-5 w-5" />}
              variant="success"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Credits Remaining</span>
                  <span className="text-2xl font-bold text-green-600">{dashboardData?.credits || 0}</span>
                </div>
                <Progress value={75} className="h-2" />
                <p className="text-xs text-gray-600">
                  75% of your Professional plan credits used this month
                </p>
                <Link href="/subscription">
                  <Button size="sm" className="w-full">
                    <ArrowRight className="h-4 w-4 mr-2" />
                    Upgrade Plan
                  </Button>
                </Link>
              </div>
            </EnhancedCard>

            {/* Platform Status */}
            <EnhancedCard 
              title="Platform Status" 
              description="System health and updates"
              icon={<Shield className="h-5 w-5" />}
              variant="success"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">AI Processing</span>
                  </div>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">Operational</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Companies House API</span>
                  </div>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">Operational</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">HMRC Integration</span>
                  </div>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">Operational</Badge>
                </div>
                <div className="pt-2 border-t">
                  <p className="text-xs text-gray-600">Last updated: 2 minutes ago</p>
                </div>
              </div>
            </EnhancedCard>
          </div>
        </div>
      </div>
    </div>
  );
}
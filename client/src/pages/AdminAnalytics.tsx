import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import { Users, FileText, DollarSign, Building2, TrendingUp, AlertTriangle, Activity, Clock, Zap } from "lucide-react";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"];
const SEVERITY_COLORS = {
  critical: "#EF4444",
  high: "#F97316",
  medium: "#FBBF24",
  low: "#10B981",
};

const AdminAnalytics = () => {
  const [timeRange, setTimeRange] = useState("30");

  const { data: dashboard, isLoading: isLoadingDashboard } = useQuery<any>({
    queryKey: ['/api/admin/analytics/dashboard'],
  });

  const { data: userActivity, isLoading: isLoadingUserActivity } = useQuery<any>({
    queryKey: ['/api/admin/analytics/user-activity', timeRange],
  });

  const { data: revenue, isLoading: isLoadingRevenue } = useQuery<any>({
    queryKey: ['/api/admin/analytics/revenue', timeRange],
  });

  const { data: filingStats, isLoading: isLoadingFilings } = useQuery<any>({
    queryKey: ['/api/admin/analytics/filings', timeRange],
  });

  // Production monitoring data
  const { data: errorAnalytics, isLoading: isLoadingErrors } = useQuery<any>({
    queryKey: ['/api/admin/analytics/production/errors', { days: timeRange }],
  });

  const { data: apiPerformance, isLoading: isLoadingApi } = useQuery<any>({
    queryKey: ['/api/admin/analytics/production/api-performance', { days: timeRange }],
  });

  const { data: userActivityProd, isLoading: isLoadingUserActivityProd } = useQuery<any>({
    queryKey: ['/api/admin/analytics/production/user-activity', { days: timeRange }],
  });

  const { data: filingProgress, isLoading: isLoadingFilingProgress } = useQuery<any>({
    queryKey: ['/api/admin/analytics/production/filing-progress', { days: timeRange }],
  });

  // Transform data for charts
  const userRoleData = dashboard?.users?.byRole
    ? Object.entries(dashboard.users.byRole).map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value,
      }))
    : [];

  const filingStatusData = dashboard?.filings?.byStatus
    ? Object.entries(dashboard.filings.byStatus).map(([name, value]) => ({
        name: name.replace(/_/g, " ").charAt(0).toUpperCase() + name.slice(1),
        value,
      }))
    : [];

  const filingTypeData = dashboard?.filings?.byType
    ? Object.entries(dashboard.filings.byType).map(([name, value]) => ({
        name: name.replace(/_/g, " ").charAt(0).toUpperCase() + name.slice(1),
        value,
      }))
    : [];

  const revenueChartData = revenue?.revenueByDate
    ? Object.entries(revenue.revenueByDate).map(([date, amount]) => ({
        date: new Date(date).toLocaleDateString(),
        revenue: amount,
      }))
    : [];

  const userActivityChartData = userActivity?.activityByDate
    ? Object.entries(userActivity.activityByDate).map(([date, count]) => ({
        date: new Date(date).toLocaleDateString(),
        users: count,
      }))
    : [];

  // Production monitoring chart data
  const errorsByDateData = errorAnalytics?.errorsByDate
    ? Object.entries(errorAnalytics.errorsByDate).map(([date, count]) => ({
        date: new Date(date).toLocaleDateString(),
        errors: count,
      }))
    : [];

  const errorsBySeverityData = errorAnalytics?.bySeverity
    ? Object.entries(errorAnalytics.bySeverity).map(([severity, count]) => ({
        severity: severity.charAt(0).toUpperCase() + severity.slice(1),
        count,
      }))
    : [];

  const apiCallsByDateData = apiPerformance?.callsByDate
    ? Object.entries(apiPerformance.callsByDate).map(([date, count]) => ({
        date: new Date(date).toLocaleDateString(),
        calls: count,
      }))
    : [];

  const statusCodeData = apiPerformance?.byStatusCode
    ? [
        { name: 'Success (2xx)', value: apiPerformance.byStatusCode.success, color: '#10B981' },
        { name: 'Client Error (4xx)', value: apiPerformance.byStatusCode.clientError, color: '#F97316' },
        { name: 'Server Error (5xx)', value: apiPerformance.byStatusCode.serverError, color: '#EF4444' },
      ].filter(item => item.value > 0)
    : [];

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold" data-testid="heading-analytics">Analytics Dashboard</h1>
          <p className="text-muted-foreground mt-1">Comprehensive business insights and production monitoring</p>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange} data-testid="select-time-range">
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Time range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 Days</SelectItem>
            <SelectItem value="30">Last 30 Days</SelectItem>
            <SelectItem value="90">Last 90 Days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
          <TabsTrigger value="production" data-testid="tab-production">Production Monitoring</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex justify-between items-center">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Total Users</p>
                    <p className="text-2xl font-bold" data-testid="text-total-users">
                      {isLoadingDashboard ? <Skeleton className="h-8 w-16" /> : dashboard?.users?.total || 0}
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex justify-between items-center">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Total Filings</p>
                    <p className="text-2xl font-bold" data-testid="text-total-filings">
                      {isLoadingDashboard ? <Skeleton className="h-8 w-16" /> : dashboard?.filings?.total || 0}
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <FileText className="h-6 w-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex justify-between items-center">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Total Revenue</p>
                    <p className="text-2xl font-bold" data-testid="text-total-revenue">
                      {isLoadingRevenue ? (
                        <Skeleton className="h-8 w-24" />
                      ) : (
                        `£${(revenue?.totalRevenue || 0).toFixed(2)}`
                      )}
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <DollarSign className="h-6 w-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex justify-between items-center">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Companies</p>
                    <p className="text-2xl font-bold" data-testid="text-total-companies">
                      {isLoadingDashboard ? <Skeleton className="h-8 w-16" /> : dashboard?.companies?.total || 0}
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Building2 className="h-6 w-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row 1 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Revenue Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Revenue Trend</CardTitle>
                <CardDescription>Daily revenue over time</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingRevenue ? (
                  <Skeleton className="h-[300px] w-full" />
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={revenueChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="revenue" stroke="#8884d8" name="Revenue (£)" />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* User Activity Chart */}
            <Card>
              <CardHeader>
                <CardTitle>User Signups</CardTitle>
                <CardDescription>New user registrations</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingUserActivity ? (
                  <Skeleton className="h-[300px] w-full" />
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={userActivityChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="users" fill="#82ca9d" name="New Users" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Charts Row 2 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* User Roles Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Users by Role</CardTitle>
                <CardDescription>Distribution of user roles</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingDashboard ? (
                  <Skeleton className="h-[250px] w-full" />
                ) : (
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={userRoleData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {userRoleData.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Filing Status */}
            <Card>
              <CardHeader>
                <CardTitle>Filing Status</CardTitle>
                <CardDescription>Current filing stages</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingDashboard ? (
                  <Skeleton className="h-[250px] w-full" />
                ) : (
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={filingStatusData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {filingStatusData.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Filing Types */}
            <Card>
              <CardHeader>
                <CardTitle>Filing Types</CardTitle>
                <CardDescription>Distribution by filing type</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingDashboard ? (
                  <Skeleton className="h-[250px] w-full" />
                ) : (
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={filingTypeData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {filingTypeData.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Additional Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Filing Submission Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <p className="text-3xl font-bold" data-testid="text-submission-rate">
                    {isLoadingFilings ? (
                      <Skeleton className="h-10 w-20" />
                    ) : (
                      `${(filingStats?.submissionRate || 0).toFixed(1)}%`
                    )}
                  </p>
                  <TrendingUp className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Avg Order Value</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold" data-testid="text-avg-order-value">
                  {isLoadingRevenue ? (
                    <Skeleton className="h-10 w-24" />
                  ) : (
                    `£${(revenue?.averageOrderValue || 0).toFixed(2)}`
                  )}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>New Users</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold" data-testid="text-new-users">
                  {isLoadingUserActivity ? (
                    <Skeleton className="h-10 w-16" />
                  ) : (
                    userActivity?.newUsers || 0
                  )}
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="production" className="space-y-6">
          {/* Production Monitoring Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex justify-between items-center">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Total Errors</p>
                    <p className="text-2xl font-bold" data-testid="text-total-errors">
                      {isLoadingErrors ? <Skeleton className="h-8 w-16" /> : errorAnalytics?.total || 0}
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-red-500/10 flex items-center justify-center">
                    <AlertTriangle className="h-6 w-6 text-red-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex justify-between items-center">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">API Calls</p>
                    <p className="text-2xl font-bold" data-testid="text-api-calls">
                      {isLoadingApi ? <Skeleton className="h-8 w-20" /> : apiPerformance?.totalCalls?.toLocaleString() || 0}
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                    <Activity className="h-6 w-6 text-blue-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex justify-between items-center">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Avg Response Time</p>
                    <p className="text-2xl font-bold" data-testid="text-avg-response-time">
                      {isLoadingApi ? <Skeleton className="h-8 w-20" /> : `${apiPerformance?.avgResponseTime || 0}ms`}
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
                    <Clock className="h-6 w-6 text-green-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex justify-between items-center">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Active Users</p>
                    <p className="text-2xl font-bold" data-testid="text-active-users">
                      {isLoadingUserActivityProd ? <Skeleton className="h-8 w-16" /> : userActivityProd?.activeUsers || 0}
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-purple-500/10 flex items-center justify-center">
                    <Zap className="h-6 w-6 text-purple-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Error Tracking Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Error Trend</CardTitle>
                <CardDescription>Errors over time</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingErrors ? (
                  <Skeleton className="h-[300px] w-full" />
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={errorsByDateData}>
                      <defs>
                        <linearGradient id="colorErrors" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#EF4444" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Area type="monotone" dataKey="errors" stroke="#EF4444" fillOpacity={1} fill="url(#colorErrors)" />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Errors by Severity</CardTitle>
                <CardDescription>Error distribution by severity level</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingErrors ? (
                  <Skeleton className="h-[300px] w-full" />
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={errorsBySeverityData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="severity" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#8884d8">
                        {errorsBySeverityData.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={SEVERITY_COLORS[entry.severity.toLowerCase() as keyof typeof SEVERITY_COLORS] || "#8884d8"} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>

          {/* API Performance Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>API Call Volume</CardTitle>
                <CardDescription>API requests over time</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingApi ? (
                  <Skeleton className="h-[300px] w-full" />
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={apiCallsByDateData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="calls" stroke="#3B82F6" name="API Calls" />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Response Status Codes</CardTitle>
                <CardDescription>API response distribution</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingApi ? (
                  <Skeleton className="h-[300px] w-full" />
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={statusCodeData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {statusCodeData.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Top Errors Table */}
          <Card>
            <CardHeader>
              <CardTitle>Top Error Messages</CardTitle>
              <CardDescription>Most frequent errors in the selected time period</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingErrors ? (
                <Skeleton className="h-[200px] w-full" />
              ) : errorAnalytics?.topErrors?.length > 0 ? (
                <div className="space-y-2">
                  {errorAnalytics.topErrors.map((error: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg" data-testid={`error-item-${index}`}>
                      <p className="text-sm font-medium truncate flex-1">{error.message}</p>
                      <Badge variant="secondary" data-testid={`error-count-${index}`}>{error.count} occurrences</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">No errors recorded in this time period</p>
              )}
            </CardContent>
          </Card>

          {/* Slowest Endpoints */}
          <Card>
            <CardHeader>
              <CardTitle>Slowest API Endpoints</CardTitle>
              <CardDescription>Top 10 endpoints by average response time</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingApi ? (
                <Skeleton className="h-[200px] w-full" />
              ) : apiPerformance?.slowestEndpoints?.length > 0 ? (
                <div className="space-y-2">
                  {apiPerformance.slowestEndpoints.map((endpoint: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg" data-testid={`endpoint-item-${index}`}>
                      <div className="flex-1">
                        <p className="text-sm font-medium truncate">{endpoint.endpoint}</p>
                        <p className="text-xs text-muted-foreground">
                          {endpoint.calls} calls • {endpoint.errorRate.toFixed(1)}% error rate
                        </p>
                      </div>
                      <Badge variant={endpoint.avgResponseTime > 1000 ? "destructive" : "secondary"} data-testid={`endpoint-time-${index}`}>
                        {Math.round(endpoint.avgResponseTime)}ms
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">No API performance data available</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminAnalytics;

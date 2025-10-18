import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, CheckCircle, CreditCard, PoundSterling, FileText, AlertCircle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

interface FilingAnalytics {
  totalFilings: number;
  completedFilings: number;
  pendingFilings: number;
  failedFilings: number;
  creditsUsed: number;
  moneySaved: number;
  successRate: number;
  filingsByType: {
    type: string;
    count: number;
  }[];
  monthlyActivity: {
    month: string;
    count: number;
  }[];
}

const FilingAnalytics = () => {
  const { data: analytics, isLoading } = useQuery<FilingAnalytics>({
    queryKey: ['/api/analytics/filings'],
  });

  if (isLoading) {
    return (
      <div className="mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="pt-6">
                <div className="h-20 bg-neutral-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!analytics) return null;

  const statCards = [
    {
      title: "Total Filings",
      value: analytics.totalFilings,
      icon: FileText,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Completed",
      value: analytics.completedFilings,
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Credits Used",
      value: analytics.creditsUsed.toLocaleString(),
      icon: CreditCard,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: "Money Saved",
      value: `£${analytics.moneySaved.toLocaleString()}`,
      icon: PoundSterling,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
      subtitle: "vs traditional services",
    },
  ];

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

  // Status data for pie chart - only show attempted filings (exclude pending/drafts from main chart)
  const statusData = [
    { name: 'Completed', value: analytics.completedFilings },
    { name: 'Failed', value: analytics.failedFilings },
  ].filter(item => item.value > 0);
  
  // Separate card for drafts/pending
  const hasPendingWork = analytics.pendingFilings > 0;

  return (
    <div className="mb-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statCards.map((stat) => (
          <Card key={stat.title} className="hover:shadow-lg transition-shadow bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">{stat.title}</p>
                  <h3 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mt-1">{stat.value}</h3>
                  {stat.subtitle && (
                    <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">{stat.subtitle}</p>
                  )}
                </div>
                <div className={`${stat.bgColor} dark:opacity-80 p-3 rounded-full`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Success Rate Banner */}
      {analytics.totalFilings > 0 && (
        <Card className="mb-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 border-blue-200 dark:border-blue-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-white dark:bg-neutral-800 p-3 rounded-full">
                  <TrendingUp className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">Success Rate</h3>
                  <p className="text-sm text-neutral-700 dark:text-neutral-300 font-medium">Filing accuracy and completion</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-4xl font-bold text-blue-600 dark:text-blue-400">
                  {analytics.successRate.toFixed(1)}%
                </div>
                <p className="text-sm text-neutral-700 dark:text-neutral-300 font-medium">
                  {analytics.completedFilings} of {analytics.totalFilings} filings
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pending/Draft Work Notice */}
      {hasPendingWork && (
        <Card className="mb-6 bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="bg-amber-100 dark:bg-amber-900 p-2 rounded-full">
                <FileText className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h3 className="font-bold text-amber-900 dark:text-amber-100">Work in Progress</h3>
                <p className="text-sm text-amber-800 dark:text-amber-200 font-medium">
                  You have {analytics.pendingFilings} draft or pending filing{analytics.pendingFilings > 1 ? 's' : ''} that {analytics.pendingFilings > 1 ? 'haven\'t' : 'hasn\'t'} been submitted yet.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Charts */}
      {analytics.totalFilings > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Filings by Type */}
          <Card className="bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700">
            <CardHeader>
              <CardTitle className="text-lg text-neutral-900 dark:text-neutral-100">Submitted Filings by Type</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={analytics.filingsByType}>
                  <XAxis 
                    dataKey="type" 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => {
                      const labels: Record<string, string> = {
                        'annual_accounts': 'Accounts',
                        'confirmation_statement': 'CS01',
                        'corporation_tax': 'CT600',
                      };
                      return labels[value] || value;
                    }}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip 
                    formatter={(value: number) => [`${value} filings`, 'Count']}
                    labelFormatter={(label) => {
                      const labels: Record<string, string> = {
                        'annual_accounts': 'Annual Accounts',
                        'confirmation_statement': 'Confirmation Statement',
                        'corporation_tax': 'Corporation Tax',
                      };
                      return labels[label] || label;
                    }}
                  />
                  <Bar dataKey="count" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Filing Success Rate */}
          <Card className="bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700">
            <CardHeader>
              <CardTitle className="text-lg text-neutral-900 dark:text-neutral-100">Filing Outcomes</CardTitle>
            </CardHeader>
            <CardContent>
              {statusData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => [`${value} filings`, 'Count']} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[250px] text-neutral-500">
                  <p>No attempted filings yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* No Data State */}
      {analytics.totalFilings === 0 && (
        <Card className="border-dashed">
          <CardContent className="pt-12 pb-12 text-center">
            <div className="flex flex-col items-center gap-3">
              <div className="bg-neutral-100 p-4 rounded-full">
                <AlertCircle className="h-8 w-8 text-neutral-400" />
              </div>
              <h3 className="text-lg font-semibold text-neutral-700">No filing data yet</h3>
              <p className="text-sm text-neutral-500 max-w-md">
                Complete your first filing to see analytics and insights about your compliance activity.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default FilingAnalytics;

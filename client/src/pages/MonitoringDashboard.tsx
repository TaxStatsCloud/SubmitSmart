import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, AlertTriangle, CheckCircle, Clock, Database, Server, TrendingUp, Users, Zap } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function MonitoringDashboard() {
  const { data: health, isLoading: healthLoading } = useQuery({
    queryKey: ['/api/monitoring/health'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { data: filingStats, isLoading: filingStatsLoading } = useQuery({
    queryKey: ['/api/monitoring/filings/stats'],
  });

  const { data: userActivity, isLoading: userActivityLoading } = useQuery({
    queryKey: ['/api/monitoring/users/activity'],
  });

  const { data: errors, isLoading: errorsLoading } = useQuery({
    queryKey: ['/api/monitoring/errors'],
  });

  const { data: timeline, isLoading: timelineLoading } = useQuery({
    queryKey: ['/api/monitoring/filings/timeline'],
  });

  const isLoading = healthLoading || filingStatsLoading || userActivityLoading || errorsLoading || timelineLoading;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-blue-950 dark:to-indigo-950 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Production Monitoring
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-2">
              System health, filing statistics, and performance metrics
            </p>
          </div>
          
          {health && (
            <Badge 
              data-testid="badge-system-status"
              variant={health.status === 'healthy' ? 'default' : 'destructive'}
              className="px-4 py-2 text-lg"
            >
              {health.status === 'healthy' ? (
                <><CheckCircle className="w-5 h-5 mr-2" /> System Healthy</>
              ) : (
                <><AlertTriangle className="w-5 h-5 mr-2" /> System Degraded</>
              )}
            </Badge>
          )}
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-slate-600 dark:text-slate-400 mt-4">Loading monitoring data...</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="border-blue-200 dark:border-blue-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm" data-testid="card-uptime">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">System Uptime</CardTitle>
                  <Clock className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="text-uptime">{health?.uptimeFormatted || 'N/A'}</div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    {health?.uptime ? `${health.uptime} seconds` : 'Loading...'}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-green-200 dark:border-green-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm" data-testid="card-total-filings">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Filings</CardTitle>
                  <Activity className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="text-total-filings">
                    {filingStats?.totalFilings?.toLocaleString() || 0}
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    Last {filingStats?.period || '30 days'}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-purple-200 dark:border-purple-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm" data-testid="card-active-users">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                  <Users className="h-4 w-4 text-purple-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="text-active-users">
                    {userActivity?.users?.active?.toLocaleString() || 0}
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    {userActivity?.users?.total?.toLocaleString() || 0} total users
                  </p>
                </CardContent>
              </Card>

              <Card className="border-orange-200 dark:border-orange-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm" data-testid="card-memory-usage">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
                  <Server className="h-4 w-4 text-orange-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="text-memory-usage">
                    {health?.memory?.heapUsed || 0} MB
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    of {health?.memory?.heapTotal || 0} MB allocated
                  </p>
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="filings" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="filings" data-testid="tab-filings">Filing Statistics</TabsTrigger>
                <TabsTrigger value="users" data-testid="tab-users">User Activity</TabsTrigger>
                <TabsTrigger value="system" data-testid="tab-system">System Health</TabsTrigger>
                <TabsTrigger value="errors" data-testid="tab-errors">Recent Errors</TabsTrigger>
              </TabsList>

              <TabsContent value="filings" className="space-y-6">
                <Card className="border-blue-200 dark:border-blue-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle>Filing Statistics by Type</CardTitle>
                    <CardDescription>Success rates and submission volumes</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {filingStats?.filingsByType && Object.entries(filingStats.filingsByType).map(([type, data]: [string, any]) => (
                        <Card key={type} className="border-slate-200 dark:border-slate-700" data-testid={`card-filing-${type}`}>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-lg capitalize">{type.replace('_', ' ')}</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-slate-600 dark:text-slate-400">Total:</span>
                              <span className="font-semibold" data-testid={`text-${type}-total`}>{data.total}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-slate-600 dark:text-slate-400">Submitted:</span>
                              <span className="font-semibold text-green-600" data-testid={`text-${type}-submitted`}>{data.submitted}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-slate-600 dark:text-slate-400">Draft:</span>
                              <span className="font-semibold text-blue-600" data-testid={`text-${type}-draft`}>{data.draft}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-slate-600 dark:text-slate-400">Failed:</span>
                              <span className="font-semibold text-red-600" data-testid={`text-${type}-failed`}>{data.failed}</span>
                            </div>
                            <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                              <div className="flex justify-between items-center">
                                <span className="text-sm font-medium">Success Rate:</span>
                                <Badge 
                                  data-testid={`badge-${type}-success-rate`}
                                  variant={data.successRate >= 90 ? 'default' : data.successRate >= 70 ? 'secondary' : 'destructive'}
                                >
                                  {data.successRate}%
                                </Badge>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {timeline?.timeline && timeline.timeline.length > 0 && (
                  <Card className="border-blue-200 dark:border-blue-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle>Filing Timeline</CardTitle>
                      <CardDescription>Daily filing volumes by type</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={aggregateTimelineData(timeline.timeline)}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Line type="monotone" dataKey="annual_accounts" stroke="#3b82f6" name="Annual Accounts" />
                          <Line type="monotone" dataKey="confirmation_statement" stroke="#8b5cf6" name="CS01" />
                          <Line type="monotone" dataKey="corporation_tax" stroke="#10b981" name="CT600" />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="users" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="border-purple-200 dark:border-purple-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle>User Growth</CardTitle>
                      <CardDescription>User registration metrics</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-slate-600 dark:text-slate-400">Total Users</p>
                          <p className="text-3xl font-bold" data-testid="text-user-total">{userActivity?.users?.total?.toLocaleString() || 0}</p>
                        </div>
                        <Users className="h-12 w-12 text-purple-600/20" />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-slate-600 dark:text-slate-400">New Users (30d)</p>
                          <p className="text-3xl font-bold text-green-600" data-testid="text-user-new">{userActivity?.users?.new?.toLocaleString() || 0}</p>
                        </div>
                        <TrendingUp className="h-12 w-12 text-green-600/20" />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-slate-600 dark:text-slate-400">Active Users</p>
                          <p className="text-3xl font-bold text-blue-600" data-testid="text-user-active">{userActivity?.users?.active?.toLocaleString() || 0}</p>
                        </div>
                        <Activity className="h-12 w-12 text-blue-600/20" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-green-200 dark:border-green-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle>Credits Usage</CardTitle>
                      <CardDescription>Credit consumption metrics</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-slate-600 dark:text-slate-400">Credits Purchased</p>
                          <p className="text-3xl font-bold text-green-600" data-testid="text-credits-purchased">
                            {userActivity?.credits?.purchased?.toLocaleString() || 0}
                          </p>
                        </div>
                        <Zap className="h-12 w-12 text-green-600/20" />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-slate-600 dark:text-slate-400">Credits Used</p>
                          <p className="text-3xl font-bold text-orange-600" data-testid="text-credits-used">
                            {userActivity?.credits?.used?.toLocaleString() || 0}
                          </p>
                        </div>
                        <Activity className="h-12 w-12 text-orange-600/20" />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-slate-600 dark:text-slate-400">Net Change</p>
                          <p className={`text-3xl font-bold ${(userActivity?.credits?.netChange || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`} data-testid="text-credits-net">
                            {(userActivity?.credits?.netChange || 0) >= 0 ? '+' : ''}{userActivity?.credits?.netChange?.toLocaleString() || 0}
                          </p>
                        </div>
                        <TrendingUp className={`h-12 w-12 ${(userActivity?.credits?.netChange || 0) >= 0 ? 'text-green-600/20' : 'text-red-600/20'}`} />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="system" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="border-blue-200 dark:border-blue-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle>Memory Usage</CardTitle>
                      <CardDescription>Node.js process memory metrics</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-600 dark:text-slate-400">Heap Used:</span>
                        <span className="font-semibold" data-testid="text-heap-used">{health?.memory?.heapUsed} MB</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-600 dark:text-slate-400">Heap Total:</span>
                        <span className="font-semibold" data-testid="text-heap-total">{health?.memory?.heapTotal} MB</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-600 dark:text-slate-400">External:</span>
                        <span className="font-semibold" data-testid="text-memory-external">{health?.memory?.external} MB</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-600 dark:text-slate-400">RSS:</span>
                        <span className="font-semibold" data-testid="text-memory-rss">{health?.memory?.rss} MB</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-green-200 dark:border-green-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle>System Information</CardTitle>
                      <CardDescription>Server environment details</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-600 dark:text-slate-400">Platform:</span>
                        <span className="font-semibold" data-testid="text-platform">{health?.system?.platform}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-600 dark:text-slate-400">Architecture:</span>
                        <span className="font-semibold" data-testid="text-arch">{health?.system?.arch}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-600 dark:text-slate-400">CPUs:</span>
                        <span className="font-semibold" data-testid="text-cpus">{health?.system?.cpus}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-600 dark:text-slate-400">Total Memory:</span>
                        <span className="font-semibold" data-testid="text-total-memory">{health?.system?.totalMemory} GB</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-600 dark:text-slate-400">Free Memory:</span>
                        <span className="font-semibold" data-testid="text-free-memory">{health?.system?.freeMemory} GB</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-purple-200 dark:border-purple-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle>Database Status</CardTitle>
                      <CardDescription>PostgreSQL connection health</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center space-x-4">
                        <Database className={`h-12 w-12 ${health?.database?.connected ? 'text-green-600' : 'text-red-600'}`} />
                        <div>
                          <p className="text-lg font-semibold" data-testid="text-db-status">
                            {health?.database?.connected ? 'Connected' : 'Disconnected'}
                          </p>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            {health?.database?.connected ? 'All systems operational' : 'Connection issues detected'}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="errors" className="space-y-6">
                <Card className="border-red-200 dark:border-red-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle>Recent Failed Filings</CardTitle>
                    <CardDescription>Last 50 filing errors</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {errors?.errors && errors.errors.length > 0 ? (
                      <div className="space-y-3">
                        {errors.errors.map((error: any) => (
                          <div 
                            key={error.id} 
                            className="flex items-start space-x-3 p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800"
                            data-testid={`error-${error.id}`}
                          >
                            <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                            <div className="flex-1 space-y-1">
                              <div className="flex items-center justify-between">
                                <p className="font-semibold text-sm capitalize">{error.type.replace('_', ' ')}</p>
                                <p className="text-xs text-slate-600 dark:text-slate-400">
                                  {new Date(error.createdAt).toLocaleString()}
                                </p>
                              </div>
                              <p className="text-sm text-slate-600 dark:text-slate-400">
                                Filing ID: {error.id} | User ID: {error.userId}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-2" />
                        <p className="text-slate-600 dark:text-slate-400">No recent errors - all systems operational!</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </div>
  );
}

function aggregateTimelineData(timeline: any[]) {
  const dateMap: Record<string, any> = {};
  
  timeline.forEach(({ date, type, count }) => {
    if (!dateMap[date]) {
      dateMap[date] = { date, annual_accounts: 0, confirmation_statement: 0, corporation_tax: 0 };
    }
    dateMap[date][type] = count;
  });
  
  return Object.values(dateMap);
}

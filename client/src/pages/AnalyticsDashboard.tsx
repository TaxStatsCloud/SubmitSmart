import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, TrendingUp, Users, Target, CheckCircle, XCircle, ArrowRight } from 'lucide-react';

interface AnalyticsData {
  funnel: {
    new: number;
    contacted: number;
    qualified: number;
    converted: number;
    lost: number;
  };
  rates: {
    contactRate: number;
    qualificationRate: number;
    conversionRate: number;
  };
  avgScoreByStage: {
    new: number;
    contacted: number;
    qualified: number;
    converted: number;
  };
}

export default function AnalyticsDashboard() {
  const { data: analytics, isLoading } = useQuery<AnalyticsData>({
    queryKey: ['/api/agents/analytics'],
    queryFn: () => fetch('/api/agents/analytics').then(res => res.json())
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const totalProspects = analytics ? 
    analytics.funnel.new + analytics.funnel.contacted + analytics.funnel.qualified + analytics.funnel.converted + analytics.funnel.lost : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Pipeline Analytics & Conversion Metrics
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Track prospect progression and conversion performance
          </p>
        </div>

        {/* Conversion Rates */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-6 backdrop-blur-sm bg-white/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-slate-600 dark:text-slate-400">Contact Rate</p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white" data-testid="text-contact-rate">
                  {analytics?.rates.contactRate || 0}%
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Prospects contacted from discovery
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6 backdrop-blur-sm bg-white/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-orange-100 dark:bg-orange-900/30">
                <Target className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-slate-600 dark:text-slate-400">Qualification Rate</p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white" data-testid="text-qualification-rate">
                  {analytics?.rates.qualificationRate || 0}%
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Contacted → qualified prospects
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6 backdrop-blur-sm bg-white/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900/30">
                <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-slate-600 dark:text-slate-400">Conversion Rate</p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white" data-testid="text-conversion-rate">
                  {analytics?.rates.conversionRate || 0}%
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Overall prospect → customer
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Conversion Funnel */}
        <Card className="backdrop-blur-sm bg-white/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800">
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-6 text-slate-900 dark:text-white">Pipeline Funnel</h2>
            
            <div className="space-y-4">
              {/* New Prospects */}
              <div className="relative">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-slate-100 dark:bg-slate-800">New</Badge>
                    <span className="text-sm text-slate-600 dark:text-slate-400">
                      Avg Score: {Math.round(analytics?.avgScoreByStage.new || 0)}
                    </span>
                  </div>
                  <span className="text-2xl font-bold text-slate-900 dark:text-white">
                    {analytics?.funnel.new || 0}
                  </span>
                </div>
                <div className="h-12 bg-gradient-to-r from-slate-400 to-slate-500 dark:from-slate-600 dark:to-slate-700 rounded-lg flex items-center justify-center relative overflow-hidden">
                  <div 
                    className="absolute left-0 top-0 h-full bg-gradient-to-r from-blue-500 to-blue-600 opacity-20"
                    style={{ width: `${totalProspects > 0 ? (analytics?.funnel.new || 0) / totalProspects * 100 : 0}%` }}
                  />
                  <ArrowRight className="h-6 w-6 text-white absolute right-4" />
                </div>
              </div>

              {/* Contacted */}
              <div className="relative">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700">Contacted</Badge>
                    <span className="text-sm text-slate-600 dark:text-slate-400">
                      Avg Score: {Math.round(analytics?.avgScoreByStage.contacted || 0)}
                    </span>
                  </div>
                  <span className="text-2xl font-bold text-slate-900 dark:text-white">
                    {analytics?.funnel.contacted || 0}
                  </span>
                </div>
                <div className="h-12 bg-gradient-to-r from-green-400 to-green-500 dark:from-green-600 dark:to-green-700 rounded-lg flex items-center justify-center relative overflow-hidden">
                  <div 
                    className="absolute left-0 top-0 h-full bg-gradient-to-r from-green-600 to-green-700 opacity-30"
                    style={{ width: `${totalProspects > 0 ? (analytics?.funnel.contacted || 0) / totalProspects * 100 : 0}%` }}
                  />
                  <ArrowRight className="h-6 w-6 text-white absolute right-4" />
                </div>
              </div>

              {/* Qualified */}
              <div className="relative">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-orange-100 dark:bg-orange-900/30 border-orange-300 dark:border-orange-700">Qualified</Badge>
                    <span className="text-sm text-slate-600 dark:text-slate-400">
                      Avg Score: {Math.round(analytics?.avgScoreByStage.qualified || 0)}
                    </span>
                  </div>
                  <span className="text-2xl font-bold text-slate-900 dark:text-white">
                    {analytics?.funnel.qualified || 0}
                  </span>
                </div>
                <div className="h-12 bg-gradient-to-r from-orange-400 to-orange-500 dark:from-orange-600 dark:to-orange-700 rounded-lg flex items-center justify-center relative overflow-hidden">
                  <div 
                    className="absolute left-0 top-0 h-full bg-gradient-to-r from-orange-600 to-orange-700 opacity-30"
                    style={{ width: `${totalProspects > 0 ? (analytics?.funnel.qualified || 0) / totalProspects * 100 : 0}%` }}
                  />
                  <ArrowRight className="h-6 w-6 text-white absolute right-4" />
                </div>
              </div>

              {/* Converted */}
              <div className="relative">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-gradient-to-r from-blue-600 to-indigo-600">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Converted
                    </Badge>
                    <span className="text-sm text-slate-600 dark:text-slate-400">
                      Avg Score: {Math.round(analytics?.avgScoreByStage.converted || 0)}
                    </span>
                  </div>
                  <span className="text-2xl font-bold text-slate-900 dark:text-white">
                    {analytics?.funnel.converted || 0}
                  </span>
                </div>
                <div className="h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center relative overflow-hidden shadow-lg">
                  <div 
                    className="absolute left-0 top-0 h-full bg-gradient-to-r from-indigo-600 to-purple-600 opacity-40"
                    style={{ width: `${totalProspects > 0 ? (analytics?.funnel.converted || 0) / totalProspects * 100 : 0}%` }}
                  />
                  <CheckCircle className="h-6 w-6 text-white absolute right-4" />
                </div>
              </div>

              {/* Lost */}
              <div className="relative">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700">
                      <XCircle className="h-3 w-3 mr-1" />
                      Lost
                    </Badge>
                  </div>
                  <span className="text-2xl font-bold text-slate-900 dark:text-white">
                    {analytics?.funnel.lost || 0}
                  </span>
                </div>
                <div className="h-12 bg-gradient-to-r from-red-400 to-red-500 dark:from-red-600 dark:to-red-700 rounded-lg flex items-center justify-center relative overflow-hidden">
                  <div 
                    className="absolute left-0 top-0 h-full bg-gradient-to-r from-red-600 to-red-700 opacity-30"
                    style={{ width: `${totalProspects > 0 ? (analytics?.funnel.lost || 0) / totalProspects * 100 : 0}%` }}
                  />
                  <XCircle className="h-6 w-6 text-white absolute right-4" />
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Pipeline Insights */}
        <Card className="backdrop-blur-sm bg-white/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800">
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4 text-slate-900 dark:text-white">Pipeline Insights</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-3">Top Performers</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/30 rounded-lg">
                    <span className="text-sm text-slate-900 dark:text-white">Highest Conversion Rate</span>
                    <span className="font-bold text-green-600 dark:text-green-400">
                      {analytics?.rates.conversionRate || 0}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                    <span className="text-sm text-slate-900 dark:text-white">Total Customers Acquired</span>
                    <span className="font-bold text-blue-600 dark:text-blue-400">
                      {analytics?.funnel.converted || 0}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-3">Areas for Improvement</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-950/30 rounded-lg">
                    <span className="text-sm text-slate-900 dark:text-white">Prospects in Pipeline</span>
                    <span className="font-bold text-orange-600 dark:text-orange-400">
                      {(analytics?.funnel.new || 0) + (analytics?.funnel.contacted || 0) + (analytics?.funnel.qualified || 0)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-950/30 rounded-lg">
                    <span className="text-sm text-slate-900 dark:text-white">Lost Opportunities</span>
                    <span className="font-bold text-red-600 dark:text-red-400">
                      {analytics?.funnel.lost || 0}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

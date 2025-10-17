import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, TrendingUp, Users, Calendar, Play } from 'lucide-react';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface Prospect {
  id: number;
  companyNumber: string;
  companyName: string;
  companyStatus: string;
  accountsDueDate: string | null;
  confirmationStatementDueDate: string | null;
  entitySize: string | null;
  leadScore: number;
  leadStatus: string;
  discoverySource: string;
  createdAt: string;
}

interface AgentRun {
  id: number;
  agentType: string;
  status: string;
  startedAt: string;
  completedAt: string | null;
  metrics: any;
  createdAt: string;
}

export default function ProspectsDashboard() {
  const { toast } = useToast();

  const { data: prospects, isLoading: prospectsLoading } = useQuery<Prospect[]>({
    queryKey: ['/api/agents/prospects'],
    queryFn: () => fetch('/api/agents/prospects?limit=100').then(res => res.json())
  });

  const { data: agentRuns, isLoading: runsLoading } = useQuery<AgentRun[]>({
    queryKey: ['/api/agents/runs'],
    queryFn: () => fetch('/api/agents/runs?limit=20').then(res => res.json())
  });

  const { data: stats } = useQuery({
    queryKey: ['/api/agents/stats'],
    queryFn: () => fetch('/api/agents/stats').then(res => res.json())
  });

  const runDiscoveryMutation = async () => {
    try {
      toast({
        title: "Starting discovery...",
        description: "Querying Companies House API for companies with upcoming deadlines"
      });

      const result = await apiRequest('/api/agents/run', 'POST', {
        agentType: 'companies_house',
        params: {}
      });

      queryClient.invalidateQueries({ queryKey: ['/api/agents/prospects'] });
      queryClient.invalidateQueries({ queryKey: ['/api/agents/runs'] });
      queryClient.invalidateQueries({ queryKey: ['/api/agents/stats'] });

      toast({
        title: "Discovery completed",
        description: `Agent run completed successfully`
      });
    } catch (error: any) {
      toast({
        title: "Discovery failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const getDaysUntil = (dateStr: string | null) => {
    if (!dateStr) return null;
    const target = new Date(dateStr);
    const today = new Date();
    const diff = target.getTime() - today.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const getLeadScoreColor = (score: number) => {
    if (score >= 70) return 'text-red-600 dark:text-red-400';
    if (score >= 50) return 'text-orange-600 dark:text-orange-400';
    return 'text-blue-600 dark:text-blue-400';
  };

  const getLeadScoreBadge = (score: number) => {
    if (score >= 70) return <Badge variant="destructive">High Priority</Badge>;
    if (score >= 50) return <Badge className="bg-orange-500">Medium</Badge>;
    return <Badge variant="secondary">Low</Badge>;
  };

  const highPriorityProspects = prospects?.filter(p => p.leadScore >= 60) || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Prospects & Lead Generation
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              Automated discovery of companies with upcoming filing deadlines
            </p>
          </div>
          <Button 
            onClick={runDiscoveryMutation}
            data-testid="button-run-discovery"
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
          >
            <Play className="mr-2 h-4 w-4" />
            Run Discovery Agent
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-6 backdrop-blur-sm bg-white/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Total Prospects</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white" data-testid="text-total-prospects">
                  {prospects?.length || 0}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6 backdrop-blur-sm bg-white/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-red-100 dark:bg-red-900/30">
                <TrendingUp className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">High Priority</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white" data-testid="text-high-priority">
                  {highPriorityProspects.length}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6 backdrop-blur-sm bg-white/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900/30">
                <Calendar className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Agent Runs</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white" data-testid="text-agent-runs">
                  {stats?.totalRuns || 0}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6 backdrop-blur-sm bg-white/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                <TrendingUp className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Success Rate</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {stats?.totalRuns ? Math.round((stats.successfulRuns / stats.totalRuns) * 100) : 0}%
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Prospects Table */}
        <Card className="backdrop-blur-sm bg-white/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800">
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4 text-slate-900 dark:text-white">Discovered Prospects</h2>
            
            {prospectsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            ) : prospects && prospects.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-700">
                      <th className="text-left py-3 px-4 text-sm font-medium text-slate-600 dark:text-slate-400">Company</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-slate-600 dark:text-slate-400">Lead Score</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-slate-600 dark:text-slate-400">Accounts Due</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-slate-600 dark:text-slate-400">CS Due</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-slate-600 dark:text-slate-400">Status</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-slate-600 dark:text-slate-400">Source</th>
                    </tr>
                  </thead>
                  <tbody>
                    {prospects.map((prospect) => (
                      <tr 
                        key={prospect.id} 
                        className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                        data-testid={`row-prospect-${prospect.id}`}
                      >
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-medium text-slate-900 dark:text-white">{prospect.companyName}</p>
                            <p className="text-sm text-slate-500 dark:text-slate-400">{prospect.companyNumber}</p>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <span className={`text-lg font-bold ${getLeadScoreColor(prospect.leadScore)}`}>
                              {prospect.leadScore}
                            </span>
                            {getLeadScoreBadge(prospect.leadScore)}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          {prospect.accountsDueDate ? (
                            <div>
                              <p className="text-sm text-slate-900 dark:text-white">
                                {new Date(prospect.accountsDueDate).toLocaleDateString()}
                              </p>
                              <p className="text-xs text-slate-500 dark:text-slate-400">
                                {getDaysUntil(prospect.accountsDueDate)} days
                              </p>
                            </div>
                          ) : (
                            <span className="text-sm text-slate-400">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {prospect.confirmationStatementDueDate ? (
                            <div>
                              <p className="text-sm text-slate-900 dark:text-white">
                                {new Date(prospect.confirmationStatementDueDate).toLocaleDateString()}
                              </p>
                              <p className="text-xs text-slate-500 dark:text-slate-400">
                                {getDaysUntil(prospect.confirmationStatementDueDate)} days
                              </p>
                            </div>
                          ) : (
                            <span className="text-sm text-slate-400">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant="outline" className="capitalize">
                            {prospect.leadStatus}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-sm text-slate-600 dark:text-slate-400 capitalize">
                            {prospect.discoverySource.replace(/_/g, ' ')}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                <p className="text-slate-500 dark:text-slate-400">No prospects discovered yet</p>
                <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
                  Click "Run Discovery Agent" to start finding companies
                </p>
              </div>
            )}
          </div>
        </Card>

        {/* Recent Agent Runs */}
        <Card className="backdrop-blur-sm bg-white/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800">
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4 text-slate-900 dark:text-white">Recent Agent Runs</h2>
            
            {runsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
              </div>
            ) : agentRuns && agentRuns.length > 0 ? (
              <div className="space-y-3">
                {agentRuns.map((run) => (
                  <div 
                    key={run.id} 
                    className="flex items-center justify-between p-4 rounded-lg border border-slate-200 dark:border-slate-700"
                    data-testid={`agent-run-${run.id}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-2 h-2 rounded-full ${
                        run.status === 'completed' ? 'bg-green-500' : 
                        run.status === 'failed' ? 'bg-red-500' : 
                        'bg-blue-500'
                      }`} />
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white capitalize">
                          {run.agentType.replace(/_/g, ' ')}
                        </p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          {new Date(run.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={run.status === 'completed' ? 'default' : 'destructive'} className="capitalize">
                        {run.status}
                      </Badge>
                      {run.metrics && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          {run.metrics.companiesProcessed || 0} companies processed
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-slate-500 dark:text-slate-400 py-8">No agent runs yet</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

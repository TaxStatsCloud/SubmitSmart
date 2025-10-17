import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, TrendingUp, Users, Calendar, Play, Mail, MessageCircle, AlertTriangle, Sparkles } from 'lucide-react';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ProspectCard } from '@/components/ProspectCard';

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
  enrichmentStatus?: string;
  companyWebsite?: string;
  companyDescription?: string;
  employeeCount?: number;
  estimatedRevenue?: string;
  fundingStage?: string;
  recentNews?: string[];
}

interface DecisionMaker {
  id: number;
  prospectId: number;
  name: string;
  title: string;
  email?: string;
  phone?: string;
  linkedinUrl?: string;
  confidence: number;
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

  const runOutreachCampaign = async (type: 'all' | 'initial' | 'followup' | 'warnings') => {
    try {
      toast({
        title: "Starting outreach campaign...",
        description: "Sending personalized emails to prospects"
      });

      const endpoint = type === 'all' ? '/api/agents/outreach' : `/api/agents/outreach/${type}`;
      const result = await apiRequest(endpoint, 'POST', { dryRun: false }) as any;

      queryClient.invalidateQueries({ queryKey: ['/api/agents/prospects'] });

      const total = result.results?.total || result.result;
      toast({
        title: "Outreach completed",
        description: `Sent ${total?.sent || 0} emails successfully`
      });
    } catch (error: any) {
      toast({
        title: "Outreach failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const runExaEnrichment = async () => {
    try {
      toast({
        title: "Starting Exa enrichment...",
        description: "Enriching prospects with company data and finding decision makers"
      });

      const result = await apiRequest('/api/agents/exa-enrichment', 'POST', { limit: 50 }) as any;

      queryClient.invalidateQueries({ queryKey: ['/api/agents/prospects'] });
      queryClient.invalidateQueries({ queryKey: ['/api/agents/runs'] });
      queryClient.invalidateQueries({ queryKey: ['/api/agents/stats'] });

      toast({
        title: "Enrichment completed",
        description: `Enriched ${result.metrics?.prospectsEnriched || 0} prospects, found ${result.metrics?.decisionMakersFound || 0} contacts`
      });
    } catch (error: any) {
      toast({
        title: "Enrichment failed",
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
          <div className="flex gap-2">
            <Button 
              onClick={runExaEnrichment}
              data-testid="button-run-enrichment"
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Enrich Data
            </Button>
            <Button 
              onClick={runDiscoveryMutation}
              data-testid="button-run-discovery"
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              <Play className="mr-2 h-4 w-4" />
              Run Discovery
            </Button>
          </div>
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

        {/* Outreach Campaigns */}
        <Card className="backdrop-blur-sm bg-white/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800">
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4 text-slate-900 dark:text-white flex items-center gap-2">
              <Mail className="h-5 w-5 text-blue-600" />
              Automated Outreach Campaigns
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              Send personalized emails to prospects based on their lead score and filing deadlines
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Dialog>
                <DialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="h-auto py-4 flex-col gap-2"
                    data-testid="button-outreach-all"
                  >
                    <Mail className="h-5 w-5 text-blue-600" />
                    <div className="text-left">
                      <p className="font-semibold">Run All Campaigns</p>
                      <p className="text-xs text-slate-500">Initial + Follow-up + Warnings</p>
                    </div>
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Run All Outreach Campaigns</DialogTitle>
                    <DialogDescription>
                      This will send initial outreach, follow-ups, and deadline warnings to all eligible prospects. Are you sure?
                    </DialogDescription>
                  </DialogHeader>
                  <Button onClick={() => runOutreachCampaign('all')} className="w-full">
                    Confirm & Send All Campaigns
                  </Button>
                </DialogContent>
              </Dialog>

              <Button 
                variant="outline" 
                className="h-auto py-4 flex-col gap-2"
                onClick={() => runOutreachCampaign('initial')}
                data-testid="button-outreach-initial"
              >
                <MessageCircle className="h-5 w-5 text-green-600" />
                <div className="text-left">
                  <p className="font-semibold">Initial Outreach</p>
                  <p className="text-xs text-slate-500">High-priority prospects (score ≥60)</p>
                </div>
              </Button>

              <Button 
                variant="outline" 
                className="h-auto py-4 flex-col gap-2"
                onClick={() => runOutreachCampaign('followup')}
                data-testid="button-outreach-followup"
              >
                <Users className="h-5 w-5 text-orange-600" />
                <div className="text-left">
                  <p className="font-semibold">Follow-Up</p>
                  <p className="text-xs text-slate-500">Contacted prospects (7+ days)</p>
                </div>
              </Button>

              <Button 
                variant="outline" 
                className="h-auto py-4 flex-col gap-2"
                onClick={() => runOutreachCampaign('warnings')}
                data-testid="button-outreach-warnings"
              >
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <div className="text-left">
                  <p className="font-semibold">Deadline Warnings</p>
                  <p className="text-xs text-slate-500">Urgent deadlines (≤14 days)</p>
                </div>
              </Button>
            </div>
          </div>
        </Card>

        {/* Prospects Grid */}
        <div>
          <h2 className="text-xl font-semibold mb-4 text-slate-900 dark:text-white">Discovered Prospects</h2>
          
          {prospectsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : prospects && prospects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {prospects.map((prospect) => (
                <ProspectCard 
                  key={prospect.id} 
                  prospect={prospect}
                  data-testid={`card-prospect-${prospect.id}`}
                />
              ))}
            </div>
          ) : (
            <Card className="backdrop-blur-sm bg-white/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800">
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                <p className="text-slate-500 dark:text-slate-400">No prospects discovered yet</p>
                <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
                  Click "Run Discovery" to start finding companies
                </p>
              </div>
            </Card>
          )}
        </div>

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

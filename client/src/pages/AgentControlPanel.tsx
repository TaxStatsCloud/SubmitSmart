import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Search, Mail, Users, PlayCircle, Loader2, CheckCircle, XCircle, AlertTriangle } from "lucide-react";

export default function AgentControlPanel() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("limited");
  const [daysAhead, setDaysAhead] = useState(90);
  const [maxResults, setMaxResults] = useState(50);
  const [enrichmentLimit, setEnrichmentLimit] = useState(20);

  // Fetch prospects
  const { data: prospects = [], isLoading: loadingProspects } = useQuery<any[]>({
    queryKey: ['/api/agents/prospects'],
  });

  // Fetch enrichment stats
  const { data: enrichmentStats } = useQuery<{
    totalProspects: number;
    withEmail: number;
    withoutEmail: number;
    enrichmentRate: number;
  }>({
    queryKey: ['/api/agents/enrichment-stats'],
  });

  // Fetch agent stats
  const { data: agentStats } = useQuery<{
    totalRuns: number;
    successfulRuns: number;
    failedRuns: number;
    averageProspectsPerRun: number;
  }>({
    queryKey: ['/api/agents/stats'],
  });

  // Run discovery agent mutation
  const runDiscoveryMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/agents/run', {
        agentType: 'companies_house',
        params: { searchQuery, daysAhead, maxResults }
      });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/agents/prospects'] });
      queryClient.invalidateQueries({ queryKey: ['/api/agents/stats'] });
      toast({
        title: "Discovery Complete",
        description: `Processed ${data.result?.metrics?.companiesProcessed || 0} companies`,
      });
    },
    onError: () => {
      toast({
        title: "Discovery Failed",
        description: "Failed to run discovery agent",
        variant: "destructive",
      });
    },
  });

  // Bulk enrichment mutation
  const bulkEnrichmentMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/agents/prospects/enrich-bulk', {
        limit: enrichmentLimit
      });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/agents/prospects'] });
      queryClient.invalidateQueries({ queryKey: ['/api/agents/enrichment-stats'] });
      toast({
        title: "Enrichment Complete",
        description: `Enriched ${data.result?.enriched || 0} prospects with emails`,
      });
    },
    onError: () => {
      toast({
        title: "Enrichment Failed",
        description: "Failed to enrich prospects",
        variant: "destructive",
      });
    },
  });

  // Enrich single prospect mutation
  const enrichProspectMutation = useMutation({
    mutationFn: async (prospectId: number) => {
      const response = await apiRequest('POST', `/api/agents/prospects/${prospectId}/enrich`, {});
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/agents/prospects'] });
      queryClient.invalidateQueries({ queryKey: ['/api/agents/enrichment-stats'] });
      if (data.emailFound) {
        toast({
          title: "Email Found",
          description: `Found ${data.emailFound} for ${data.companyName}`,
        });
      } else {
        toast({
          title: "No Email Found",
          description: data.error || `Could not find email for ${data.companyName}`,
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Enrichment Error",
        description: error?.message || "Failed to enrich prospect",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Agent Control Panel</h1>
        <p className="text-muted-foreground">
          Manage lead discovery, email enrichment, and outreach campaigns
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Prospects</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{enrichmentStats?.totalProspects || 0}</div>
            <p className="text-xs text-muted-foreground">
              Companies discovered from Companies House
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Email Enrichment</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{enrichmentStats?.enrichmentRate || 0}%</div>
            <p className="text-xs text-muted-foreground">
              {enrichmentStats?.withEmail || 0} with emails, {enrichmentStats?.withoutEmail || 0} without
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Agent Runs</CardTitle>
            <PlayCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{agentStats?.totalRuns || 0}</div>
            <p className="text-xs text-muted-foreground">
              {agentStats?.successfulRuns || 0} successful, {agentStats?.failedRuns || 0} failed
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="discovery" className="space-y-4">
        <TabsList>
          <TabsTrigger value="discovery" data-testid="tab-discovery">
            <Search className="h-4 w-4 mr-2" />
            Lead Discovery
          </TabsTrigger>
          <TabsTrigger value="enrichment" data-testid="tab-enrichment">
            <Mail className="h-4 w-4 mr-2" />
            Email Enrichment
          </TabsTrigger>
          <TabsTrigger value="prospects" data-testid="tab-prospects">
            <Users className="h-4 w-4 mr-2" />
            Prospects
          </TabsTrigger>
        </TabsList>

        <TabsContent value="discovery" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Companies House Discovery Agent</CardTitle>
              <CardDescription>
                Search for UK companies with upcoming filing deadlines
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="search-query">Search Query</Label>
                  <Input
                    id="search-query"
                    data-testid="input-search-query"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="e.g., limited, consulting"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="days-ahead">Days Ahead</Label>
                  <Input
                    id="days-ahead"
                    data-testid="input-days-ahead"
                    type="number"
                    value={daysAhead}
                    onChange={(e) => setDaysAhead(parseInt(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max-results">Max Results</Label>
                  <Input
                    id="max-results"
                    data-testid="input-max-results"
                    type="number"
                    value={maxResults}
                    onChange={(e) => setMaxResults(parseInt(e.target.value))}
                  />
                </div>
              </div>
              <Button
                onClick={() => runDiscoveryMutation.mutate()}
                disabled={runDiscoveryMutation.isPending}
                className="w-full md:w-auto"
                data-testid="button-run-discovery"
              >
                {runDiscoveryMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Running Discovery...
                  </>
                ) : (
                  <>
                    <PlayCircle className="mr-2 h-4 w-4" />
                    Run Discovery Agent
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="enrichment" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Email Enrichment (Hunter.io)</CardTitle>
              <CardDescription>
                Find contact emails for prospects without email addresses
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="enrichment-limit">Number of Prospects to Enrich</Label>
                <Input
                  id="enrichment-limit"
                  data-testid="input-enrichment-limit"
                  type="number"
                  value={enrichmentLimit}
                  onChange={(e) => setEnrichmentLimit(parseInt(e.target.value))}
                  placeholder="e.g., 20"
                />
                <p className="text-sm text-muted-foreground">
                  Currently {enrichmentStats?.withoutEmail || 0} prospects without emails
                </p>
              </div>
              <Button
                onClick={() => bulkEnrichmentMutation.mutate()}
                disabled={bulkEnrichmentMutation.isPending}
                className="w-full md:w-auto"
                data-testid="button-bulk-enrich"
              >
                {bulkEnrichmentMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enriching...
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Enrich Prospects
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="prospects" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Discovered Prospects</CardTitle>
              <CardDescription>
                Companies found by the discovery agent
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingProspects ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : prospects.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertTriangle className="h-12 w-12 mx-auto mb-4" />
                  <p>No prospects found. Run the discovery agent to find companies.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Company</TableHead>
                      <TableHead>Filing Date</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {prospects.map((prospect: any) => (
                      <TableRow key={prospect.id} data-testid={`prospect-row-${prospect.id}`}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{prospect.companyName}</div>
                            <div className="text-sm text-muted-foreground">{prospect.companyNumber}</div>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          {prospect.accountsDueDate ? new Date(prospect.accountsDueDate).toLocaleDateString() : 'N/A'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={prospect.leadScore >= 70 ? "default" : prospect.leadScore >= 50 ? "secondary" : "outline"}>
                            {prospect.leadScore}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {prospect.contactEmail ? (
                            <div className="flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              <span className="text-sm">{prospect.contactEmail}</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <XCircle className="h-4 w-4 text-red-500" />
                              <span className="text-sm text-muted-foreground">No email</span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{prospect.leadStatus}</Badge>
                        </TableCell>
                        <TableCell>
                          {!prospect.contactEmail && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => enrichProspectMutation.mutate(prospect.id)}
                              disabled={enrichProspectMutation.isPending}
                              data-testid={`button-enrich-${prospect.id}`}
                            >
                              {enrichProspectMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Mail className="h-4 w-4" />
                              )}
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

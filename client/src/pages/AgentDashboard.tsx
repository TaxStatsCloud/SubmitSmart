import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { LucideActivity, LucideCalendar, LucideClipboardList, LucideClock, LucidePlay, LucideRefreshCw, LucideBell, LucideCheck } from 'lucide-react';
import { format } from 'date-fns';

// Agent types and interfaces
type AgentType = 'companies_house' | 'contact_research' | 'outreach_email' | 'onboarding' | 'document_processing';

interface AgentRun {
  id: number;
  agentType: AgentType;
  startTime: string;
  endTime: string | null;
  status: 'running' | 'completed' | 'failed';
  metrics: Record<string, any>;
  error?: string;
}

interface ScheduleConfig {
  agentType: AgentType;
  cronExpression: string;
  params?: Record<string, any>;
  enabled: boolean;
  description: string;
}

// Utility functions
const formatDateTime = (dateStr: string) => {
  return format(new Date(dateStr), 'MMM dd, yyyy HH:mm:ss');
};

const formatDuration = (startStr: string, endStr: string | null) => {
  if (!endStr) return 'Running...';
  
  const start = new Date(startStr).getTime();
  const end = new Date(endStr).getTime();
  const durationMs = end - start;
  
  if (durationMs < 1000) return `${durationMs}ms`;
  if (durationMs < 60000) return `${Math.floor(durationMs / 1000)}s`;
  
  const minutes = Math.floor(durationMs / 60000);
  const seconds = Math.floor((durationMs % 60000) / 1000);
  return `${minutes}m ${seconds}s`;
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'running': return 'bg-blue-500';
    case 'completed': return 'bg-green-500';
    case 'failed': return 'bg-red-500';
    default: return 'bg-gray-500';
  }
};

const AgentDashboard = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedAgentType, setSelectedAgentType] = useState<AgentType | ''>('');
  const [runParams, setRunParams] = useState<Record<string, string>>({});
  const [paramKey, setParamKey] = useState<string>('');
  const [paramValue, setParamValue] = useState<string>('');

  // Fetch all agent runs
  const { data: agentRuns, isLoading: isLoadingRuns } = useQuery({
    queryKey: ['/api/agents/runs'],
    refetchInterval: 10000 // Refresh every 10 seconds
  });

  // Fetch scheduled agents
  const { data: schedules, isLoading: isLoadingSchedules } = useQuery({
    queryKey: ['/api/agents/schedules'],
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  // Mutation to run an agent
  const runAgentMutation = useMutation({
    mutationFn: (data: { agentType: AgentType, params: Record<string, any> }) => 
      apiRequest('/api/agents/run', { method: 'POST', body: JSON.stringify(data) }),
    
    onSuccess: () => {
      toast({
        title: "Agent Started",
        description: `${selectedAgentType} agent has been started successfully.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/agents/runs'] });
      setRunParams({});
    },
    
    onError: (error: any) => {
      toast({
        title: "Failed to Start Agent",
        description: error.message || "An error occurred while starting the agent.",
        variant: "destructive"
      });
    }
  });

  // Mutation to update schedule
  const updateScheduleMutation = useMutation({
    mutationFn: (data: ScheduleConfig) => 
      apiRequest('/api/agents/schedule', { method: 'PATCH', body: JSON.stringify(data) }),
    
    onSuccess: () => {
      toast({
        title: "Schedule Updated",
        description: "Agent schedule has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/agents/schedules'] });
    },
    
    onError: (error: any) => {
      toast({
        title: "Failed to Update Schedule",
        description: error.message || "An error occurred while updating the schedule.",
        variant: "destructive"
      });
    }
  });

  // Mutation to disable schedule
  const disableScheduleMutation = useMutation({
    mutationFn: (agentType: AgentType) => 
      apiRequest(`/api/agents/schedule/${agentType}`, { method: 'DELETE' }),
    
    onSuccess: () => {
      toast({
        title: "Schedule Disabled",
        description: "Agent schedule has been disabled successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/agents/schedules'] });
    },
    
    onError: (error: any) => {
      toast({
        title: "Failed to Disable Schedule",
        description: error.message || "An error occurred while disabling the schedule.",
        variant: "destructive"
      });
    }
  });

  // Add parameter to run configuration
  const addParam = () => {
    if (!paramKey.trim()) return;
    
    setRunParams(prev => ({
      ...prev,
      [paramKey]: paramValue
    }));
    
    setParamKey('');
    setParamValue('');
  };

  // Run agent with current params
  const handleRunAgent = () => {
    if (!selectedAgentType) {
      toast({
        title: "Error",
        description: "Please select an agent type to run.",
        variant: "destructive"
      });
      return;
    }
    
    runAgentMutation.mutate({
      agentType: selectedAgentType,
      params: runParams
    });
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Agent Management Dashboard</h1>
      
      <Tabs defaultValue="runs">
        <TabsList className="mb-6">
          <TabsTrigger value="runs" className="flex items-center gap-2">
            <LucideActivity size={16} />
            Agent Runs
          </TabsTrigger>
          <TabsTrigger value="schedules" className="flex items-center gap-2">
            <LucideCalendar size={16} />
            Schedules
          </TabsTrigger>
          <TabsTrigger value="manual" className="flex items-center gap-2">
            <LucidePlay size={16} />
            Manual Run
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="runs">
          <Card>
            <CardHeader>
              <CardTitle>Agent Execution History</CardTitle>
              <CardDescription>
                Recent agent runs and their status
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingRuns ? (
                <div className="flex justify-center py-8">
                  <LucideRefreshCw className="animate-spin" />
                </div>
              ) : (
                <ScrollArea className="h-[400px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Agent Type</TableHead>
                        <TableHead>Start Time</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Details</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {agentRuns && agentRuns.length > 0 ? (
                        agentRuns.map((run: AgentRun) => (
                          <TableRow key={run.id}>
                            <TableCell className="font-medium">{run.agentType}</TableCell>
                            <TableCell>{formatDateTime(run.startTime)}</TableCell>
                            <TableCell>{formatDuration(run.startTime, run.endTime)}</TableCell>
                            <TableCell>
                              <Badge className={getStatusColor(run.status)}>
                                {run.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {run.status === 'failed' && run.error ? (
                                <span className="text-red-500">{run.error}</span>
                              ) : (
                                <details>
                                  <summary className="cursor-pointer text-sm text-blue-500">
                                    View Metrics
                                  </summary>
                                  <pre className="text-xs mt-2 p-2 bg-gray-100 rounded">
                                    {JSON.stringify(run.metrics, null, 2)}
                                  </pre>
                                </details>
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-4">
                            No agent runs found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </ScrollArea>
              )}
            </CardContent>
            <CardFooter>
              <Button 
                variant="outline" 
                onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/agents/runs'] })}
                className="ml-auto"
              >
                <LucideRefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="schedules">
          <Card>
            <CardHeader>
              <CardTitle>Agent Schedules</CardTitle>
              <CardDescription>
                Manage when agents run automatically
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingSchedules ? (
                <div className="flex justify-center py-8">
                  <LucideRefreshCw className="animate-spin" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Agent Type</TableHead>
                      <TableHead>Schedule (Cron)</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {schedules && schedules.length > 0 ? (
                      schedules.map((schedule: ScheduleConfig) => (
                        <TableRow key={schedule.agentType}>
                          <TableCell className="font-medium">{schedule.agentType}</TableCell>
                          <TableCell><code>{schedule.cronExpression}</code></TableCell>
                          <TableCell>{schedule.description}</TableCell>
                          <TableCell>
                            <Badge className={schedule.enabled ? "bg-green-500" : "bg-gray-500"}>
                              {schedule.enabled ? "Enabled" : "Disabled"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  updateScheduleMutation.mutate({
                                    ...schedule,
                                    enabled: !schedule.enabled
                                  });
                                }}
                              >
                                {schedule.enabled ? "Disable" : "Enable"}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  runAgentMutation.mutate({
                                    agentType: schedule.agentType as AgentType,
                                    params: schedule.params || {}
                                  });
                                }}
                              >
                                <LucidePlay className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-4">
                          No schedules found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
            <CardFooter>
              <Button 
                variant="outline" 
                onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/agents/schedules'] })}
                className="ml-auto"
              >
                <LucideRefreshCw className="mr-2 h-4 w-4" />
                Refresh Schedules
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="manual">
          <Card>
            <CardHeader>
              <CardTitle>Run Agent Manually</CardTitle>
              <CardDescription>
                Start an agent run with custom parameters
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <label className="text-sm font-medium mb-2 block">Select Agent Type</label>
                  <Select
                    value={selectedAgentType}
                    onValueChange={(value) => setSelectedAgentType(value as AgentType)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Agent Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="companies_house">Companies House Data Collector</SelectItem>
                      <SelectItem value="contact_research">Contact Research</SelectItem>
                      <SelectItem value="outreach_email">Outreach Email</SelectItem>
                      <SelectItem value="onboarding">Onboarding</SelectItem>
                      <SelectItem value="document_processing">Document Processing</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Parameters</label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      placeholder="Parameter Key"
                      value={paramKey}
                      onChange={(e) => setParamKey(e.target.value)}
                    />
                    <Input
                      placeholder="Parameter Value"
                      value={paramValue}
                      onChange={(e) => setParamValue(e.target.value)}
                    />
                    <Button 
                      variant="outline" 
                      onClick={addParam}
                    >
                      Add
                    </Button>
                  </div>
                  
                  <div className="p-4 bg-gray-50 rounded-md">
                    <h4 className="text-sm font-medium mb-2">Current Parameters:</h4>
                    {Object.keys(runParams).length > 0 ? (
                      <ul className="space-y-1">
                        {Object.entries(runParams).map(([key, value]) => (
                          <li key={key} className="flex justify-between text-sm">
                            <span className="font-mono">{key}:</span> 
                            <span>{value}</span>
                            <button 
                              className="text-red-500 text-xs"
                              onClick={() => {
                                const newParams = {...runParams};
                                delete newParams[key];
                                setRunParams(newParams);
                              }}
                            >
                              Remove
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-gray-500">No parameters added</p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={handleRunAgent}
                disabled={!selectedAgentType || runAgentMutation.isPending}
                className="ml-auto"
              >
                {runAgentMutation.isPending ? (
                  <>
                    <LucideRefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Running...
                  </>
                ) : (
                  <>
                    <LucidePlay className="mr-2 h-4 w-4" />
                    Run Agent
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AgentDashboard;
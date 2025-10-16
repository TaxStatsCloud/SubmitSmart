import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend, PieChart, Pie, Cell } from "recharts";
import { AlertCircle, BarChart3, CheckCircle2, Clock, FileText, MailCheck, MailX, MonitorCheck, ShieldAlert, ShieldCheck, Users2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import type { Filing } from "@shared/schema";

// Sample data for charts - to be replaced with actual data from API
const activityData = [
  { name: "Mon", outreachEmails: 45, responses: 12, signups: 3 },
  { name: "Tue", outreachEmails: 52, responses: 18, signups: 5 },
  { name: "Wed", outreachEmails: 48, responses: 21, signups: 7 },
  { name: "Thu", outreachEmails: 61, responses: 25, signups: 9 },
  { name: "Fri", outreachEmails: 55, responses: 22, signups: 6 },
  { name: "Sat", outreachEmails: 33, responses: 14, signups: 4 },
  { name: "Sun", outreachEmails: 29, responses: 11, signups: 2 },
];

const conversionData = [
  { name: "Contacted", value: 350 },
  { name: "Responded", value: 125 },
  { name: "Signed Up", value: 45 },
];

const COLORS = ["#0088FE", "#00C49F", "#FFBB28"];

// Filings Tab Component
function FilingsTab({ dateRange }: { dateRange: string }) {
  const { toast } = useToast();
  
  // Fetch all filings with validation results
  const { data: filings, isLoading: isLoadingFilings } = useQuery<Filing[]>({
    queryKey: ['/api/admin/filings', dateRange],
    refetchInterval: 30000, // Refresh every 30 seconds
  });
  
  return (
    <div className="grid grid-cols-1 gap-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
            <div>
              <CardTitle>Filing Submissions & Validation Results</CardTitle>
              <CardDescription>Monitor Companies House and HMRC submissions with enhanced validation</CardDescription>
            </div>
            
            <div className="flex items-center gap-3">
              <Input placeholder="Search by company..." className="w-full md:w-auto" />
              <Select defaultValue="all">
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Filings</SelectItem>
                  <SelectItem value="annual_accounts">Annual Accounts</SelectItem>
                  <SelectItem value="confirmation_statement">Confirmation Statement</SelectItem>
                  <SelectItem value="ct600">CT600 Tax Return</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex justify-between items-center">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Total Filings</p>
                    <p className="text-2xl font-bold">
                      {isLoadingFilings ? <Skeleton className="h-8 w-16" /> : filings?.length || 0}
                    </p>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex justify-between items-center">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Validation Passed</p>
                    <p className="text-2xl font-bold text-green-600">
                      {isLoadingFilings ? <Skeleton className="h-8 w-16" /> : 
                        filings?.filter((f: any) => f.metadata?.validationResults?.isValid).length || 0}
                    </p>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                    <ShieldCheck className="h-5 w-5 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex justify-between items-center">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Has Errors</p>
                    <p className="text-2xl font-bold text-red-600">
                      {isLoadingFilings ? <Skeleton className="h-8 w-16" /> : 
                        filings?.filter((f: any) => f.metadata?.validationResults?.errorCount > 0).length || 0}
                    </p>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                    <ShieldAlert className="h-5 w-5 text-red-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex justify-between items-center">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Placeholders Found</p>
                    <p className="text-2xl font-bold text-amber-600">
                      {isLoadingFilings ? <Skeleton className="h-8 w-16" /> : 
                        filings?.filter((f: any) => f.metadata?.validationResults?.placeholderCount > 0).length || 0}
                    </p>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
                    <AlertCircle className="h-5 w-5 text-amber-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Filings Table */}
          {isLoadingFilings ? (
            <div className="space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : (
            <div className="space-y-4">
              {filings && filings.length > 0 ? (
                filings.map((filing: any) => (
                  <FilingCard key={filing.id} filing={filing} />
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No filings found for the selected date range
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Filing Card Component with Validation Details
function FilingCard({ filing }: { filing: any }) {
  const validation = filing.metadata?.validationResults;
  const hasErrors = validation?.errorCount > 0;
  const hasWarnings = validation?.warningCount > 0;
  const hasPlaceholders = validation?.placeholderCount > 0;
  
  return (
    <Card className={hasErrors ? "border-red-200" : hasPlaceholders ? "border-amber-200" : "border-green-200"}>
      <CardContent className="pt-6">
        <div className="flex flex-col md:flex-row justify-between md:items-start gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="font-semibold text-lg">{filing.metadata?.companyName || "Unknown Company"}</h3>
              <Badge variant={filing.status === "submitted" ? "default" : filing.status === "failed" ? "destructive" : "outline"}>
                {filing.status}
              </Badge>
              {validation?.isValid && (
                <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300 hover:bg-green-200">
                  <ShieldCheck className="h-3 w-3 mr-1" />
                  Valid
                </Badge>
              )}
            </div>
            
            <div className="text-sm text-muted-foreground space-y-1">
              <p><span className="font-medium">Type:</span> {filing.filingType?.replace(/_/g, ' ')}</p>
              <p><span className="font-medium">Company:</span> {filing.metadata?.companyNumber}</p>
              <p><span className="font-medium">Submitted:</span> {formatDate(new Date(filing.createdAt))}</p>
              {filing.submissionId && <p><span className="font-medium">Submission ID:</span> {filing.submissionId}</p>}
            </div>
          </div>
          
          {/* Validation Summary */}
          {validation && (
            <div className="flex gap-2">
              {hasErrors && (
                <div className="px-3 py-2 rounded-md bg-red-50 border border-red-200">
                  <p className="text-xs text-red-600 font-medium">Errors</p>
                  <p className="text-2xl font-bold text-red-700">{validation.errorCount}</p>
                </div>
              )}
              {hasWarnings && (
                <div className="px-3 py-2 rounded-md bg-amber-50 border border-amber-200">
                  <p className="text-xs text-amber-600 font-medium">Warnings</p>
                  <p className="text-2xl font-bold text-amber-700">{validation.warningCount}</p>
                </div>
              )}
              {hasPlaceholders && (
                <div className="px-3 py-2 rounded-md bg-orange-50 border border-orange-200">
                  <p className="text-xs text-orange-600 font-medium">Placeholders</p>
                  <p className="text-2xl font-bold text-orange-700">{validation.placeholderCount}</p>
                </div>
              )}
              {validation.isValid && !hasErrors && !hasWarnings && !hasPlaceholders && (
                <div className="px-3 py-2 rounded-md bg-green-50 border border-green-200">
                  <p className="text-xs text-green-600 font-medium">Status</p>
                  <p className="text-sm font-bold text-green-700">All Clear</p>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Validation Details Accordion */}
        {validation && (hasErrors || hasWarnings || hasPlaceholders) && (
          <Accordion type="single" collapsible className="mt-4">
            <AccordionItem value="validation-details" className="border-none">
              <AccordionTrigger className="text-sm hover:no-underline">
                <span className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  View Validation Details
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4 pt-2">
                  {/* Errors */}
                  {hasErrors && validation.errors && validation.errors.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-semibold text-sm text-red-700 flex items-center gap-2">
                        <ShieldAlert className="h-4 w-4" />
                        Errors ({validation.errorCount})
                      </h4>
                      <div className="space-y-1">
                        {validation.errors.map((error: any, idx: number) => (
                          <Alert key={idx} variant="destructive" className="py-2">
                            <AlertDescription className="text-xs">
                              <span className="font-medium">{error.code}:</span> {error.message}
                              {error.element && <span className="block mt-1 text-muted-foreground">Element: {error.element}</span>}
                              {error.location && <span className="block text-muted-foreground">Location: {error.location}</span>}
                            </AlertDescription>
                          </Alert>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Warnings */}
                  {hasWarnings && validation.warnings && validation.warnings.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-semibold text-sm text-amber-700 flex items-center gap-2">
                        <AlertCircle className="h-4 w-4" />
                        Warnings ({validation.warningCount})
                      </h4>
                      <div className="space-y-1">
                        {validation.warnings.map((warning: any, idx: number) => (
                          <Alert key={idx} className="py-2 border-amber-200 bg-amber-50">
                            <AlertDescription className="text-xs">
                              <span className="font-medium">{warning.code}:</span> {warning.message}
                              {warning.element && <span className="block mt-1 text-muted-foreground">Element: {warning.element}</span>}
                              {warning.location && <span className="block text-muted-foreground">Location: {warning.location}</span>}
                            </AlertDescription>
                          </Alert>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Placeholders */}
                  {hasPlaceholders && validation.placeholders && validation.placeholders.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-semibold text-sm text-orange-700 flex items-center gap-2">
                        <AlertCircle className="h-4 w-4" />
                        Placeholders Detected ({validation.placeholderCount})
                      </h4>
                      <div className="space-y-1">
                        {validation.placeholders.map((placeholder: any, idx: number) => (
                          <Alert key={idx} className={`py-2 ${placeholder.severity === 'error' ? 'border-red-200 bg-red-50' : 'border-orange-200 bg-orange-50'}`}>
                            <AlertDescription className="text-xs">
                              <span className="font-medium uppercase">{placeholder.type}:</span> {placeholder.message}
                              {placeholder.location && <span className="block text-muted-foreground">Location: {placeholder.location}</span>}
                              <Badge variant={placeholder.severity === 'error' ? 'destructive' : 'outline'} className="mt-1">
                                {placeholder.severity}
                              </Badge>
                            </AlertDescription>
                          </Alert>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Statistics */}
                  {validation.statistics && (
                    <div className="bg-muted/50 p-3 rounded-md">
                      <h4 className="font-semibold text-sm mb-2">iXBRL Statistics</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                        <div>
                          <span className="text-muted-foreground">Total Facts:</span>
                          <span className="font-medium ml-1">{validation.statistics.totalFacts || 0}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Tagged Elements:</span>
                          <span className="font-medium ml-1">{validation.statistics.taggedElements || 0}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Contexts:</span>
                          <span className="font-medium ml-1">{validation.statistics.totalContexts || 0}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Units:</span>
                          <span className="font-medium ml-1">{validation.statistics.totalUnits || 0}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}
      </CardContent>
    </Card>
  );
}

const AdminDashboard = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [dateRange, setDateRange] = useState("7days");
  
  // Fetch agent stats
  const { data: agentStats, isLoading: isLoadingStats } = useQuery<any>({
    queryKey: ['/api/admin/agent-stats', dateRange],
    refetchInterval: 60000, // Refresh every minute
  });
  
  // Fetch prospect companies data
  const { data: prospects, isLoading: isLoadingProspects } = useQuery({
    queryKey: ['/api/admin/prospects'],
  });
  
  // Fetch outreach emails data
  const { data: outreach, isLoading: isLoadingOutreach } = useQuery({
    queryKey: ['/api/admin/outreach'],
  });
  
  // Fetch user usage data
  const { data: userUsage, isLoading: isLoadingUsage } = useQuery({
    queryKey: ['/api/admin/user-usage'],
  });

  return (
    <div className="container py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">Monitor agent performance and user activity</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Last 24 Hours</SelectItem>
              <SelectItem value="7days">Last 7 Days</SelectItem>
              <SelectItem value="30days">Last 30 Days</SelectItem>
              <SelectItem value="90days">Last 90 Days</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline">
            <Clock className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-5 mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="prospects">Company Prospects</TabsTrigger>
          <TabsTrigger value="outreach">Outreach Activity</TabsTrigger>
          <TabsTrigger value="filings">Filings & Validation</TabsTrigger>
          <TabsTrigger value="user-usage">User Activity</TabsTrigger>
        </TabsList>
        
        {/* Overview Tab */}
        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            {/* Agent Status Card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Agent Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <div className="space-y-1">
                    <p className="text-2xl font-bold">
                      {isLoadingStats ? <Skeleton className="h-8 w-20" /> : "Active"}
                    </p>
                    <p className="text-xs text-muted-foreground">All agents running</p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <MonitorCheck className="h-6 w-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Companies Contacted Card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Companies Contacted</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <div className="space-y-1">
                    <p className="text-2xl font-bold">
                      {isLoadingStats ? <Skeleton className="h-8 w-20" /> : agentStats?.companiesContacted || 350}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {dateRange === "24h" ? "Today" : 
                       dateRange === "7days" ? "This week" : 
                       dateRange === "30days" ? "This month" : "Last 3 months"}
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Users2 className="h-6 w-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Response Rate Card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Response Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <div className="space-y-1">
                    <p className="text-2xl font-bold">
                      {isLoadingStats ? <Skeleton className="h-8 w-20" /> : agentStats?.responseRate || "32.7%"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      <span className="text-green-500">+3.2%</span> from last period
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <MailCheck className="h-6 w-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Conversion Rate Card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <div className="space-y-1">
                    <p className="text-2xl font-bold">
                      {isLoadingStats ? <Skeleton className="h-8 w-20" /> : agentStats?.conversionRate || "11.5%"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      <span className="text-green-500">+1.7%</span> from last period
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <CheckCircle2 className="h-6 w-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Activity Chart */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Activity Trends</CardTitle>
                <CardDescription>Daily outreach, responses and sign-ups</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingStats ? (
                  <Skeleton className="h-[300px] w-full" />
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={activityData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="outreachEmails" stroke="#3b82f6" activeDot={{ r: 8 }} name="Outreach Emails" />
                      <Line type="monotone" dataKey="responses" stroke="#10b981" name="Responses" />
                      <Line type="monotone" dataKey="signups" stroke="#f59e0b" name="Sign-ups" />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
            
            {/* Conversion Funnel */}
            <Card>
              <CardHeader>
                <CardTitle>Conversion Funnel</CardTitle>
                <CardDescription>From prospects to customers</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingStats ? (
                  <Skeleton className="h-[300px] w-full" />
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={conversionData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {conversionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                )}
                
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="h-3 w-3 rounded-full bg-[#0088FE] mr-2" />
                      <span className="text-sm">Contacted</span>
                    </div>
                    <span className="font-medium">350</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="h-3 w-3 rounded-full bg-[#00C49F] mr-2" />
                      <span className="text-sm">Responded</span>
                    </div>
                    <span className="font-medium">125</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="h-3 w-3 rounded-full bg-[#FFBB28] mr-2" />
                      <span className="text-sm">Signed Up</span>
                    </div>
                    <span className="font-medium">45</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Prospects Tab */}
        <TabsContent value="prospects">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div>
                  <CardTitle>Company Prospects Database</CardTitle>
                  <CardDescription>Companies identified by the Companies House Agent</CardDescription>
                </div>
                
                <div className="flex items-center gap-3">
                  <Input placeholder="Search companies..." className="w-full md:w-auto" />
                  <Select defaultValue="all">
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="identified">Identified</SelectItem>
                      <SelectItem value="contacted">Contacted</SelectItem>
                      <SelectItem value="responded">Responded</SelectItem>
                      <SelectItem value="converted">Converted</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              {isLoadingProspects ? (
                <div className="space-y-4">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Company Name</TableHead>
                      <TableHead>Registration Number</TableHead>
                      <TableHead>Identified On</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Contact Info Found</TableHead>
                      <TableHead>Last Activity</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {/* Sample data - replace with actual data */}
                    <TableRow>
                      <TableCell className="font-medium">Acme Trading Ltd</TableCell>
                      <TableCell>12345678</TableCell>
                      <TableCell>{formatDate(new Date(2024, 4, 5))}</TableCell>
                      <TableCell>
                        <Badge>Contacted</Badge>
                      </TableCell>
                      <TableCell>Yes</TableCell>
                      <TableCell>Outreach email sent (2 days ago)</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Bright Innovations Ltd</TableCell>
                      <TableCell>87654321</TableCell>
                      <TableCell>{formatDate(new Date(2024, 4, 3))}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">Responded</Badge>
                      </TableCell>
                      <TableCell>Yes</TableCell>
                      <TableCell>Follow-up email sent (1 day ago)</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Global Services Ltd</TableCell>
                      <TableCell>56781234</TableCell>
                      <TableCell>{formatDate(new Date(2024, 4, 1))}</TableCell>
                      <TableCell>
                        <Badge className="bg-green-100 text-green-800 border-green-300">Converted</Badge>
                      </TableCell>
                      <TableCell>Yes</TableCell>
                      <TableCell>Account created (Today)</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Tech Solutions UK Ltd</TableCell>
                      <TableCell>43218765</TableCell>
                      <TableCell>{formatDate(new Date(2024, 4, 7))}</TableCell>
                      <TableCell>
                        <Badge variant="outline">Identified</Badge>
                      </TableCell>
                      <TableCell>No</TableCell>
                      <TableCell>Identification (Today)</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              )}
              
              <div className="flex items-center justify-end mt-4 space-x-2">
                <Button variant="outline" size="sm" disabled>Previous</Button>
                <Button variant="outline" size="sm">Next</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Outreach Tab */}
        <TabsContent value="outreach">
          <div className="grid grid-cols-1 gap-6">
            <Card>
              <CardHeader>
                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                  <div>
                    <CardTitle>Outreach Email Activity</CardTitle>
                    <CardDescription>Track email campaigns and responses</CardDescription>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Select defaultValue="all">
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Emails</SelectItem>
                        <SelectItem value="sent">Sent</SelectItem>
                        <SelectItem value="opened">Opened</SelectItem>
                        <SelectItem value="responded">Responded</SelectItem>
                        <SelectItem value="bounced">Bounced</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  {/* Email Stats Cards */}
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex justify-between items-center">
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">Total Sent</p>
                          <p className="text-2xl font-bold">
                            {isLoadingOutreach ? <Skeleton className="h-8 w-20" /> : "458"}
                          </p>
                        </div>
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <MailCheck className="h-5 w-5 text-primary" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex justify-between items-center">
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">Open Rate</p>
                          <p className="text-2xl font-bold">
                            {isLoadingOutreach ? <Skeleton className="h-8 w-20" /> : "48.9%"}
                          </p>
                        </div>
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <BarChart3 className="h-5 w-5 text-primary" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex justify-between items-center">
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">Bounce Rate</p>
                          <p className="text-2xl font-bold">
                            {isLoadingOutreach ? <Skeleton className="h-8 w-20" /> : "3.7%"}
                          </p>
                        </div>
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <MailX className="h-5 w-5 text-primary" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                {isLoadingOutreach ? (
                  <div className="space-y-4">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Company</TableHead>
                        <TableHead>Contact Email</TableHead>
                        <TableHead>Template</TableHead>
                        <TableHead>Sent Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {/* Sample data - replace with actual data */}
                      <TableRow>
                        <TableCell className="font-medium">Acme Trading Ltd</TableCell>
                        <TableCell>finance@acme-trading.co.uk</TableCell>
                        <TableCell>Initial Outreach</TableCell>
                        <TableCell>{formatDate(new Date(2024, 4, 9))}</TableCell>
                        <TableCell>
                          <Badge>Sent</Badge>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm">View</Button>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Bright Innovations Ltd</TableCell>
                        <TableCell>info@brightinnovations.co.uk</TableCell>
                        <TableCell>Initial Outreach</TableCell>
                        <TableCell>{formatDate(new Date(2024, 4, 8))}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">Opened</Badge>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm">View</Button>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Global Services Ltd</TableCell>
                        <TableCell>contact@globalservices.com</TableCell>
                        <TableCell>Initial Outreach</TableCell>
                        <TableCell>{formatDate(new Date(2024, 4, 7))}</TableCell>
                        <TableCell>
                          <Badge className="bg-green-100 text-green-800 border-green-300">Responded</Badge>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm">View</Button>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Tech Solutions UK Ltd</TableCell>
                        <TableCell>hello@techsolutions.co.uk</TableCell>
                        <TableCell>Follow-up</TableCell>
                        <TableCell>{formatDate(new Date(2024, 4, 6))}</TableCell>
                        <TableCell>
                          <Badge variant="destructive">Bounced</Badge>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm">View</Button>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                )}
                
                <div className="flex items-center justify-end mt-4 space-x-2">
                  <Button variant="outline" size="sm" disabled>Previous</Button>
                  <Button variant="outline" size="sm">Next</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Filings & Validation Tab */}
        <TabsContent value="filings">
          <FilingsTab dateRange={dateRange} />
        </TabsContent>
        
        {/* User Activity Tab */}
        <TabsContent value="user-usage">
          <div className="grid grid-cols-1 gap-6">
            <Card>
              <CardHeader>
                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                  <div>
                    <CardTitle>Platform Usage Analytics</CardTitle>
                    <CardDescription>Track how users are interacting with the platform</CardDescription>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Input placeholder="Search users..." className="w-full md:w-auto" />
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  {/* User Activity Graph */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Feature Usage</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {isLoadingUsage ? (
                        <Skeleton className="h-[250px] w-full" />
                      ) : (
                        <ResponsiveContainer width="100%" height={250}>
                          <BarChart data={[
                            { name: "Doc Upload", value: 128 },
                            { name: "CS Filing", value: 85 },
                            { name: "Accounts", value: 64 },
                            { name: "CT600", value: 57 },
                            { name: "AI Assistant", value: 142 },
                          ]}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="value" fill="#3b82f6" />
                          </BarChart>
                        </ResponsiveContainer>
                      )}
                    </CardContent>
                  </Card>
                  
                  {/* Top Users */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Top Users by Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {isLoadingUsage ? (
                        <div className="space-y-3">
                          <Skeleton className="h-8 w-full" />
                          <Skeleton className="h-8 w-full" />
                          <Skeleton className="h-8 w-full" />
                          <Skeleton className="h-8 w-full" />
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium mr-3">ST</div>
                              <div>
                                <p className="font-medium">Sarah Thompson</p>
                                <p className="text-xs text-muted-foreground">sarah.thompson@example.com</p>
                              </div>
                            </div>
                            <div className="flex items-center">
                              <span className="text-sm font-medium mr-2">42 activities</span>
                              <Button variant="ghost" size="sm">Details</Button>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-medium mr-3">JM</div>
                              <div>
                                <p className="font-medium">James Miller</p>
                                <p className="text-xs text-muted-foreground">james.miller@example.com</p>
                              </div>
                            </div>
                            <div className="flex items-center">
                              <span className="text-sm font-medium mr-2">38 activities</span>
                              <Button variant="ghost" size="sm">Details</Button>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-medium mr-3">EL</div>
                              <div>
                                <p className="font-medium">Emily Lee</p>
                                <p className="text-xs text-muted-foreground">emily.lee@example.com</p>
                              </div>
                            </div>
                            <div className="flex items-center">
                              <span className="text-sm font-medium mr-2">35 activities</span>
                              <Button variant="ghost" size="sm">Details</Button>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 font-medium mr-3">RD</div>
                              <div>
                                <p className="font-medium">Robert Davis</p>
                                <p className="text-xs text-muted-foreground">robert.davis@example.com</p>
                              </div>
                            </div>
                            <div className="flex items-center">
                              <span className="text-sm font-medium mr-2">29 activities</span>
                              <Button variant="ghost" size="sm">Details</Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Recent User Activity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isLoadingUsage ? (
                      <div className="space-y-3">
                        <Skeleton className="h-8 w-full" />
                        <Skeleton className="h-8 w-full" />
                        <Skeleton className="h-8 w-full" />
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>User</TableHead>
                            <TableHead>Activity</TableHead>
                            <TableHead>Date & Time</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          <TableRow>
                            <TableCell>
                              <div className="flex items-center">
                                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium mr-2">ST</div>
                                <span>Sarah Thompson</span>
                              </div>
                            </TableCell>
                            <TableCell>Uploaded financial documents</TableCell>
                            <TableCell>Today, 14:32</TableCell>
                            <TableCell>
                              <Badge className="bg-green-100 text-green-800 border-green-300">Completed</Badge>
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>
                              <div className="flex items-center">
                                <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-medium mr-2">JM</div>
                                <span>James Miller</span>
                              </div>
                            </TableCell>
                            <TableCell>Started confirmation statement filing</TableCell>
                            <TableCell>Today, 11:18</TableCell>
                            <TableCell>
                              <Badge>In Progress</Badge>
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>
                              <div className="flex items-center">
                                <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-medium mr-2">EL</div>
                                <span>Emily Lee</span>
                              </div>
                            </TableCell>
                            <TableCell>Purchased Premium Credit Package</TableCell>
                            <TableCell>Yesterday, 16:45</TableCell>
                            <TableCell>
                              <Badge className="bg-green-100 text-green-800 border-green-300">Completed</Badge>
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>
                              <div className="flex items-center">
                                <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 font-medium mr-2">RD</div>
                                <span>Robert Davis</span>
                              </div>
                            </TableCell>
                            <TableCell>Submitted CT600 tax return</TableCell>
                            <TableCell>Yesterday, 09:22</TableCell>
                            <TableCell>
                              <Badge variant="outline">Pending</Badge>
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;
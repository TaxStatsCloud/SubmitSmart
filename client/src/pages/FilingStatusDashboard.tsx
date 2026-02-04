import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  RefreshCw,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Building2,
  Calendar,
  Loader2,
  ExternalLink
} from "lucide-react";

interface Filing {
  id: number;
  type: string;
  status: string;
  progress: number;
  companyNumber: string;
  companyName: string;
  accountingPeriodStart: string;
  accountingPeriodEnd: string;
  taxDue: number;
  correlationId: string | null;
  errorMessage: string | null;
  submittedAt: string | null;
  createdAt: string;
  dueDate: string;
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  draft: { label: "Draft", color: "bg-gray-500", icon: <FileText className="h-4 w-4" /> },
  in_progress: { label: "In Progress", color: "bg-blue-500", icon: <Clock className="h-4 w-4" /> },
  submitted: { label: "Submitted", color: "bg-yellow-500", icon: <Clock className="h-4 w-4 animate-pulse" /> },
  approved: { label: "Accepted", color: "bg-green-500", icon: <CheckCircle className="h-4 w-4" /> },
  accepted: { label: "Accepted", color: "bg-green-500", icon: <CheckCircle className="h-4 w-4" /> },
  rejected: { label: "Rejected", color: "bg-red-500", icon: <XCircle className="h-4 w-4" /> },
  awaiting_approval: { label: "Awaiting Review", color: "bg-purple-500", icon: <Clock className="h-4 w-4" /> }
};

const typeLabels: Record<string, string> = {
  corporation_tax: "CT600",
  annual_accounts: "Annual Accounts",
  confirmation_statement: "Confirmation Statement",
  ct600: "CT600"
};

export default function FilingStatusDashboard() {
  const { toast } = useToast();
  const [pollingFilingId, setPollingFilingId] = useState<number | null>(null);

  // Fetch all filings
  const { data: filingsData, isLoading, refetch } = useQuery({
    queryKey: ['/api/hmrc/filings'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/hmrc/filings');
      return response.json();
    }
  });

  // Poll filing status mutation
  const pollStatusMutation = useMutation({
    mutationFn: async (filingId: number) => {
      const response = await apiRequest('POST', `/api/hmrc/filings/${filingId}/poll`);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/hmrc/filings'] });
      toast({
        title: `Status: ${data.status}`,
        description: data.message,
        variant: data.status === 'accepted' ? 'default' : data.status === 'rejected' ? 'destructive' : 'default'
      });
      setPollingFilingId(null);
    },
    onError: (error: any) => {
      toast({
        title: "Poll Failed",
        description: error.message || "Failed to poll HMRC status",
        variant: "destructive"
      });
      setPollingFilingId(null);
    }
  });

  const handlePollStatus = (filingId: number) => {
    setPollingFilingId(filingId);
    pollStatusMutation.mutate(filingId);
  };

  const filings: Filing[] = filingsData?.filings || [];

  const pendingFilings = filings.filter(f => ['draft', 'in_progress'].includes(f.status));
  const submittedFilings = filings.filter(f => f.status === 'submitted');
  const completedFilings = filings.filter(f => ['approved', 'accepted', 'rejected'].includes(f.status));

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount: number | null) => {
    if (amount === null || amount === undefined) return '-';
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const config = statusConfig[status] || statusConfig.draft;
    return (
      <Badge className={`${config.color} text-white flex items-center gap-1`}>
        {config.icon}
        {config.label}
      </Badge>
    );
  };

  const FilingTable = ({ filings, showPollButton = false }: { filings: Filing[], showPollButton?: boolean }) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Company</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Period</TableHead>
          <TableHead>Tax Due</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Submitted</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {filings.length === 0 ? (
          <TableRow>
            <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
              No filings found
            </TableCell>
          </TableRow>
        ) : (
          filings.map((filing) => (
            <TableRow key={filing.id}>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="font-medium">{filing.companyName || 'Unknown'}</div>
                    <div className="text-xs text-muted-foreground">{filing.companyNumber}</div>
                  </div>
                </div>
              </TableCell>
              <TableCell>{typeLabels[filing.type] || filing.type}</TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3 text-muted-foreground" />
                  <span className="text-sm">
                    {formatDate(filing.accountingPeriodStart)} - {formatDate(filing.accountingPeriodEnd)}
                  </span>
                </div>
              </TableCell>
              <TableCell className="font-medium">{formatCurrency(filing.taxDue)}</TableCell>
              <TableCell>{getStatusBadge(filing.status)}</TableCell>
              <TableCell>{formatDate(filing.submittedAt)}</TableCell>
              <TableCell>
                <div className="flex gap-2">
                  {showPollButton && filing.correlationId && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handlePollStatus(filing.id)}
                      disabled={pollingFilingId === filing.id}
                    >
                      {pollingFilingId === filing.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4" />
                      )}
                      <span className="ml-1">Check Status</span>
                    </Button>
                  )}
                  <Button size="sm" variant="ghost">
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Filing Status Dashboard</h1>
          <p className="text-muted-foreground">Track your CT600 and other HMRC submissions</p>
        </div>
        <Button onClick={() => refetch()} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Filings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filings.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{pendingFilings.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Awaiting HMRC</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{submittedFilings.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{completedFilings.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Submitted filings awaiting HMRC response */}
      {submittedFilings.length > 0 && (
        <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950">
          <Clock className="h-4 w-4 text-blue-600" />
          <AlertTitle className="text-blue-900 dark:text-blue-100">Submissions Pending HMRC Response</AlertTitle>
          <AlertDescription className="text-blue-800 dark:text-blue-200">
            You have {submittedFilings.length} filing(s) awaiting response from HMRC. Click "Check Status" to poll for updates.
          </AlertDescription>
        </Alert>
      )}

      {/* Filings Tabs */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">All Filings ({filings.length})</TabsTrigger>
          <TabsTrigger value="pending">Pending ({pendingFilings.length})</TabsTrigger>
          <TabsTrigger value="submitted">Submitted ({submittedFilings.length})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({completedFilings.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <FilingTable filings={filings} showPollButton />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pending" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              <FilingTable filings={pendingFilings} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="submitted" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              <FilingTable filings={submittedFilings} showPollButton />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="completed" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              <FilingTable filings={completedFilings} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

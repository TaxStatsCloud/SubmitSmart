import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FileText, Download, Filter, Search, ExternalLink, Calendar, Building2, FileCheck, AlertTriangle } from "lucide-react";
import { format } from "date-fns";

interface Filing {
  id: number;
  type: string;
  status: string;
  submitDate: string | null;
  createdAt: string;
  data: any;
  documentIds: number[] | null;
  companyId: number;
}

interface Document {
  id: number;
  name: string;
  type: string;
  size: number;
  uploadedAt: string;
  processingStatus: string;
  contentType: string;
}

interface FilingWithDocuments extends Filing {
  documents: Document[];
}

export default function DocumentAuditTrail() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [filingTypeFilter, setFilingTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Fetch all filings for the user's company
  const { data: filings = [], isLoading: isLoadingFilings } = useQuery<Filing[]>({
    queryKey: ['/api/filings'],
    enabled: !!user?.companyId,
  });

  // Fetch all documents for the user's company
  const { data: documents = [], isLoading: isLoadingDocuments } = useQuery<Document[]>({
    queryKey: ['/api/documents'],
    enabled: !!user?.companyId,
  });

  // Combine filings with their documents
  const filingsWithDocuments: FilingWithDocuments[] = filings.map((filing) => {
    const filingDocs = filing.documentIds
      ? documents.filter((doc) => filing.documentIds!.includes(doc.id))
      : [];
    return { ...filing, documents: filingDocs };
  });

  // Apply filters
  const filteredFilings = filingsWithDocuments.filter((filing) => {
    const matchesSearch = searchTerm === "" || 
      filing.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      filing.id.toString().includes(searchTerm);
    
    const matchesType = filingTypeFilter === "all" || filing.type === filingTypeFilter;
    const matchesStatus = statusFilter === "all" || filing.status === statusFilter;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  // Calculate statistics
  const totalFilings = filings.length;
  const filingsWithDocs = filingsWithDocuments.filter(f => f.documents.length > 0).length;
  const filingsWithoutDocs = totalFilings - filingsWithDocs;
  const totalDocuments = documents.length;

  const getFilingTypeLabel = (type: string) => {
    switch (type) {
      case "annual_accounts":
        return "Annual Accounts";
      case "ct600":
        return "CT600 Tax Return";
      case "confirmation_statement":
        return "Confirmation Statement";
      default:
        return type;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "submitted":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100";
      case "draft":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100";
      case "pending":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100";
      case "rejected":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100";
    }
  };

  const exportToCSV = () => {
    const headers = ["Filing ID", "Filing Type", "Status", "Submit Date", "Documents Count", "Document Names"];
    const rows = filteredFilings.map((filing) => [
      filing.id,
      getFilingTypeLabel(filing.type),
      filing.status,
      filing.submitDate ? format(new Date(filing.submitDate), "dd/MM/yyyy") : "Not submitted",
      filing.documents.length,
      filing.documents.map(d => d.name).join("; ") || "None"
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `document-audit-trail-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
  };

  const isLoading = isLoadingFilings || isLoadingDocuments;

  return (
    <>
      <Helmet>
        <title>Document Audit Trail | PromptSubmissions</title>
        <meta name="description" content="Complete audit trail showing which documents support each filing for compliance and transparency." />
      </Helmet>

      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-neutral-800 dark:text-neutral-100 mb-2">
            Document Audit Trail
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400">
            Complete audit trail showing which documents support each filing. Essential for auditor review and compliance verification.
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Filings</p>
                  <p className="text-2xl font-bold" data-testid="text-total-filings">{totalFilings}</p>
                </div>
                <FileText className="h-8 w-8 text-primary opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">With Documents</p>
                  <p className="text-2xl font-bold text-green-600" data-testid="text-filings-with-docs">{filingsWithDocs}</p>
                </div>
                <FileCheck className="h-8 w-8 text-green-600 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Without Documents</p>
                  <p className="text-2xl font-bold text-amber-600" data-testid="text-filings-without-docs">{filingsWithoutDocs}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-amber-600 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Documents</p>
                  <p className="text-2xl font-bold" data-testid="text-total-documents">{totalDocuments}</p>
                </div>
                <Building2 className="h-8 w-8 text-primary opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Export */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filters & Export
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={exportToCSV}
                disabled={filteredFilings.length === 0}
                data-testid="button-export-csv"
              >
                <Download className="h-4 w-4 mr-2" />
                Export to CSV
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by filing ID or type..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                  data-testid="input-search"
                />
              </div>

              <Select value={filingTypeFilter} onValueChange={setFilingTypeFilter}>
                <SelectTrigger data-testid="select-filing-type">
                  <SelectValue placeholder="Filter by filing type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Filing Types</SelectItem>
                  <SelectItem value="annual_accounts">Annual Accounts</SelectItem>
                  <SelectItem value="ct600">CT600 Tax Return</SelectItem>
                  <SelectItem value="confirmation_statement">Confirmation Statement</SelectItem>
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger data-testid="select-status">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Audit Trail Table */}
        <Card>
          <CardHeader>
            <CardTitle>Filing Document Audit Trail</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading audit trail...</div>
            ) : filteredFilings.length === 0 ? (
              <Alert>
                <AlertDescription>
                  No filings found matching your filters. Try adjusting your search criteria.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-6">
                {filteredFilings.map((filing) => (
                  <div key={filing.id} className="border rounded-lg p-4" data-testid={`filing-card-${filing.id}`}>
                    {/* Filing Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold">
                            {getFilingTypeLabel(filing.type)}
                          </h3>
                          <Badge className={getStatusColor(filing.status)}>
                            {filing.status}
                          </Badge>
                          {filing.documents.length === 0 && (
                            <Badge variant="outline" className="text-amber-600 border-amber-600">
                              No Documents
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>Filing ID: #{filing.id}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {filing.submitDate
                              ? `Submitted: ${format(new Date(filing.submitDate), "dd MMM yyyy")}`
                              : `Created: ${format(new Date(filing.createdAt), "dd MMM yyyy")}`
                            }
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-muted-foreground">
                          {filing.documents.length} document{filing.documents.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>

                    <Separator className="my-4" />

                    {/* Documents List */}
                    {filing.documents.length > 0 ? (
                      <div className="space-y-2">
                        <p className="text-sm font-medium mb-3">Supporting Documents:</p>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Document Name</TableHead>
                              <TableHead>Type</TableHead>
                              <TableHead>Size</TableHead>
                              <TableHead>Uploaded</TableHead>
                              <TableHead>Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filing.documents.map((doc) => (
                              <TableRow key={doc.id} data-testid={`document-row-${doc.id}`}>
                                <TableCell className="font-medium">
                                  <div className="flex items-center gap-2">
                                    <FileText className="h-4 w-4 text-muted-foreground" />
                                    {doc.name}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline" className="text-xs">
                                    {doc.type.replace(/_/g, ' ')}
                                  </Badge>
                                </TableCell>
                                <TableCell>{(doc.size / 1024).toFixed(1)} KB</TableCell>
                                <TableCell>{format(new Date(doc.uploadedAt), "dd/MM/yyyy")}</TableCell>
                                <TableCell>
                                  <Badge
                                    variant="outline"
                                    className={
                                      doc.processingStatus === "completed"
                                        ? "bg-green-50 text-green-700 dark:bg-green-900 dark:text-green-100"
                                        : doc.processingStatus === "failed"
                                        ? "bg-red-50 text-red-700 dark:bg-red-900 dark:text-red-100"
                                        : "bg-yellow-50 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-100"
                                    }
                                  >
                                    {doc.processingStatus}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <Alert className="bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800">
                        <AlertTriangle className="h-4 w-4 text-amber-600" />
                        <AlertDescription className="text-amber-900 dark:text-amber-100">
                          <strong>No supporting documents attached.</strong> Consider uploading documents to provide a
                          complete audit trail for this filing.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Help Section */}
        <Alert>
          <FileCheck className="h-4 w-4" />
          <AlertDescription>
            <p className="font-semibold mb-2">About the Document Audit Trail</p>
            <p className="text-sm">
              This report shows the complete document trail for all your filings. Auditors can use this to verify that
              each filing is supported by appropriate documentation. Filings without attached documents are highlighted
              for your attention.
            </p>
          </AlertDescription>
        </Alert>
      </div>
    </>
  );
}

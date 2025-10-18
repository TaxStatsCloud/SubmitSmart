import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FileText, Download, Search, Calendar, Building2, Shield, Eye, AlertCircle } from "lucide-react";
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

interface Company {
  id: number;
  name: string;
  registrationNumber: string;
}

interface FilingWithDetails extends Filing {
  documents: Document[];
  company: Company;
}

export default function AuditorPortal() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [filingTypeFilter, setFilingTypeFilter] = useState<string>("all");
  const [selectedFiling, setSelectedFiling] = useState<FilingWithDetails | null>(null);

  // Fetch filings accessible to auditor
  const { data: filings = [], isLoading: isLoadingFilings } = useQuery<FilingWithDetails[]>({
    queryKey: ['/api/auditors/filings'],
    enabled: user?.role === "auditor",
  });

  // Filter filings
  const filteredFilings = filings.filter((filing) => {
    const matchesSearch = searchTerm === "" || 
      filing.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      filing.company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      filing.id.toString().includes(searchTerm);
    
    const matchesType = filingTypeFilter === "all" || filing.type === filingTypeFilter;
    
    return matchesSearch && matchesType;
  });

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

  const renderFilingData = (filing: FilingWithDetails) => {
    if (!filing.data) return null;

    const data = filing.data;
    
    switch (filing.type) {
      case "annual_accounts":
        return (
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Financial Year</h4>
              <p className="text-sm">Year Ending: {data.yearEnding ? format(new Date(data.yearEnding), "dd/MM/yyyy") : "N/A"}</p>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Balance Sheet (£)</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Fixed Assets</p>
                  <p className="font-medium">{data.fixedAssets?.toLocaleString() || "0"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Current Assets</p>
                  <p className="font-medium">{data.currentAssets?.toLocaleString() || "0"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Total Liabilities</p>
                  <p className="font-medium">{data.totalLiabilities?.toLocaleString() || "0"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Net Assets</p>
                  <p className="font-medium">{data.netAssets?.toLocaleString() || "0"}</p>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Profit & Loss (£)</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Turnover</p>
                  <p className="font-medium">{data.turnover?.toLocaleString() || "0"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Operating Profit</p>
                  <p className="font-medium">{data.operatingProfit?.toLocaleString() || "0"}</p>
                </div>
              </div>
            </div>
          </div>
        );

      case "ct600":
        return (
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Accounting Period</h4>
              <p className="text-sm">
                {data.accountingPeriodStart ? format(new Date(data.accountingPeriodStart), "dd/MM/yyyy") : "N/A"} to{" "}
                {data.accountingPeriodEnd ? format(new Date(data.accountingPeriodEnd), "dd/MM/yyyy") : "N/A"}
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Tax Computation (£)</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Turnover</p>
                  <p className="font-medium">{data.turnover?.toLocaleString() || "0"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Trading Profit</p>
                  <p className="font-medium">{data.tradingProfit?.toLocaleString() || "0"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Taxable Profit</p>
                  <p className="font-medium">{data.taxableProfit?.toLocaleString() || "0"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Corporation Tax</p>
                  <p className="font-medium">{data.corporationTax?.toLocaleString() || "0"}</p>
                </div>
              </div>
            </div>
          </div>
        );

      case "confirmation_statement":
        return (
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Statement Date</h4>
              <p className="text-sm">
                {data.statementDate ? format(new Date(data.statementDate), "dd/MM/yyyy") : "N/A"}
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Trading Status</h4>
              <p className="text-sm">{data.tradingStatus || "N/A"}</p>
            </div>

            {data.sicCode && (
              <div>
                <h4 className="font-semibold mb-2">SIC Code</h4>
                <p className="text-sm">{data.sicCode}</p>
              </div>
            )}
          </div>
        );

      default:
        return <p className="text-sm text-muted-foreground">No details available</p>;
    }
  };

  if (user?.role !== "auditor") {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          This portal is only accessible to users with auditor role.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <>
      <Helmet>
        <title>Auditor Portal | PromptSubmissions</title>
        <meta name="description" content="Read-only access to company filings and documents for auditor review." />
      </Helmet>

      <div className="space-y-6">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Shield className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold text-neutral-800 dark:text-neutral-100">
              Auditor Portal
            </h1>
          </div>
          <p className="text-neutral-600 dark:text-neutral-400">
            Read-only access to company filings and supporting documents.
          </p>
        </div>

        {/* Read-Only Notice */}
        <Alert className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
          <Shield className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-900 dark:text-blue-100">
            <strong>Auditor Access Mode:</strong> You have read-only access to the filings below.
            You can view all filing details and documents but cannot make any changes or submissions.
          </AlertDescription>
        </Alert>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Filings</p>
                  <p className="text-2xl font-bold" data-testid="text-total-filings">{filings.length}</p>
                </div>
                <FileText className="h-8 w-8 text-primary opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Submitted</p>
                  <p className="text-2xl font-bold text-green-600">
                    {filings.filter(f => f.status === "submitted").length}
                  </p>
                </div>
                <Calendar className="h-8 w-8 text-green-600 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Companies</p>
                  <p className="text-2xl font-bold">
                    {new Set(filings.map(f => f.companyId)).size}
                  </p>
                </div>
                <Building2 className="h-8 w-8 text-primary opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filter Filings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by filing ID, company, or type..."
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
            </div>
          </CardContent>
        </Card>

        {/* Filings Table */}
        <Card>
          <CardHeader>
            <CardTitle>Accessible Filings</CardTitle>
            <CardDescription>
              Filings you have been granted access to review
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingFilings ? (
              <div className="text-center py-8 text-muted-foreground">Loading filings...</div>
            ) : filteredFilings.length === 0 ? (
              <Alert>
                <AlertDescription>
                  No filings found. {searchTerm || filingTypeFilter !== "all" ? "Try adjusting your filters." : "Contact the company to request access."}
                </AlertDescription>
              </Alert>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Filing ID</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Documents</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredFilings.map((filing) => (
                    <TableRow key={filing.id} data-testid={`filing-row-${filing.id}`}>
                      <TableCell className="font-medium">#{filing.id}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{filing.company.name}</p>
                          <p className="text-xs text-muted-foreground">{filing.company.registrationNumber}</p>
                        </div>
                      </TableCell>
                      <TableCell>{getFilingTypeLabel(filing.type)}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(filing.status)}>
                          {filing.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {filing.submitDate
                          ? format(new Date(filing.submitDate), "dd MMM yyyy")
                          : format(new Date(filing.createdAt), "dd MMM yyyy")
                        }
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {filing.documents.length} doc{filing.documents.length !== 1 ? 's' : ''}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedFiling(filing)}
                          data-testid={`button-view-${filing.id}`}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Filing Details Dialog */}
      <Dialog open={!!selectedFiling} onOpenChange={(open) => !open && setSelectedFiling(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto" data-testid="dialog-filing-details">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Filing #{selectedFiling?.id} - {selectedFiling && getFilingTypeLabel(selectedFiling.type)}
            </DialogTitle>
            <DialogDescription>
              Read-only view of filing details and supporting documents
            </DialogDescription>
          </DialogHeader>

          {selectedFiling && (
            <div className="space-y-6 py-4">
              {/* Company Info */}
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Company Information
                </h4>
                <div className="bg-muted/30 p-3 rounded-md">
                  <p className="font-medium">{selectedFiling.company.name}</p>
                  <p className="text-sm text-muted-foreground">Registration: {selectedFiling.company.registrationNumber}</p>
                </div>
              </div>

              <Separator />

              {/* Filing Details */}
              <div>
                <h4 className="font-semibold mb-2">Filing Details</h4>
                {renderFilingData(selectedFiling)}
              </div>

              <Separator />

              {/* Supporting Documents */}
              <div>
                <h4 className="font-semibold mb-2">Supporting Documents</h4>
                {selectedFiling.documents.length === 0 ? (
                  <Alert>
                    <AlertDescription>No documents attached to this filing.</AlertDescription>
                  </Alert>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Document Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Size</TableHead>
                        <TableHead>Uploaded</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedFiling.documents.map((doc) => (
                        <TableRow key={doc.id}>
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
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

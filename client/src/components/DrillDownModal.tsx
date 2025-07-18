import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Calculator,
  FileText,
  TrendingUp,
  Clock,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

interface DrillDownData {
  lineItem: string;
  totalAmount: number;
  components: DrillDownComponent[];
  calculationMethod: string;
  sourceDocuments: SourceDocument[];
  auditTrail: AuditTrailEntry[];
  reconciliation: ReconciliationData;
}

interface DrillDownComponent {
  id: string;
  description: string;
  amount: number;
  accountCode: string;
  sourceType: 'trial_balance' | 'adjustment' | 'reclassification' | 'manual';
  documentReferences: string[];
  dateRange?: {
    from: string;
    to: string;
  };
}

interface SourceDocument {
  id: string;
  type: 'invoice' | 'receipt' | 'bank_statement' | 'journal_entry' | 'trial_balance';
  filename: string;
  date: string;
  amount: number;
  description: string;
  extractedData?: any;
}

interface AuditTrailEntry {
  timestamp: string;
  action: string;
  user: string;
  oldValue?: any;
  newValue?: any;
  reason?: string;
  documentIds?: string[];
}

interface ReconciliationData {
  trialBalanceAmount: number;
  adjustments: number;
  finalAmount: number;
  variance: number;
  explanations: string[];
}

interface DrillDownModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  lineItem: string;
  statementType: 'balance-sheet' | 'profit-loss';
  companyId: number;
  periodEnd?: string;
}

export default function DrillDownModal({
  isOpen,
  onOpenChange,
  lineItem,
  statementType,
  companyId,
  periodEnd = '2024-12-31'
}: DrillDownModalProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['components']));

  const { data: drillDownData, isLoading, error } = useQuery({
    queryKey: ['drill-down', statementType, lineItem, companyId, periodEnd],
    queryFn: async () => {
      const endpoint = `/api/drill-down/${statementType}/${encodeURIComponent(lineItem)}/${companyId}?periodEnd=${periodEnd}`;
      const response = await fetch(endpoint);
      if (!response.ok) throw new Error('Failed to fetch drill-down data');
      const result = await response.json();
      return result.drillDown as DrillDownData;
    },
    enabled: isOpen && !!lineItem && !!companyId
  });

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB');
  };

  const getSourceTypeColor = (sourceType: string) => {
    switch (sourceType) {
      case 'trial_balance': return 'bg-blue-100 text-blue-800';
      case 'adjustment': return 'bg-yellow-100 text-yellow-800';
      case 'reclassification': return 'bg-purple-100 text-purple-800';
      case 'manual': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDocumentTypeIcon = (type: string) => {
    switch (type) {
      case 'invoice': return '📄';
      case 'receipt': return '🧾';
      case 'bank_statement': return '🏦';
      case 'journal_entry': return '📝';
      case 'trial_balance': return '⚖️';
      default: return '📎';
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="border-b pb-4">
          <DialogTitle className="flex items-center space-x-2">
            <Calculator className="h-5 w-5 text-blue-600" />
            <span>Drill-Down Analysis: {lineItem}</span>
          </DialogTitle>
          <DialogDescription>
            Detailed breakdown showing calculation method, source data, and audit trail
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2">Loading drill-down data...</span>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-8 text-red-600">
            <AlertCircle className="h-5 w-5 mr-2" />
            Failed to load drill-down data
          </div>
        ) : drillDownData ? (
          <div className="space-y-6">
            {/* Summary Card */}
            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50">
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600">
                      {formatCurrency(drillDownData.totalAmount)}
                    </div>
                    <div className="text-sm text-gray-600">Final Amount</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-semibold text-gray-700">
                      {drillDownData.components.length}
                    </div>
                    <div className="text-sm text-gray-600">Components</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-semibold text-gray-700">
                      {drillDownData.sourceDocuments.length}
                    </div>
                    <div className="text-sm text-gray-600">Source Documents</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Tabs defaultValue="breakdown" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="breakdown">Breakdown</TabsTrigger>
                <TabsTrigger value="reconciliation">Reconciliation</TabsTrigger>
                <TabsTrigger value="documents">Documents</TabsTrigger>
                <TabsTrigger value="audit">Audit Trail</TabsTrigger>
              </TabsList>

              <TabsContent value="breakdown" className="space-y-4">
                {/* Calculation Method */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Calculator className="h-5 w-5" />
                      <span>Calculation Method</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">
                      {drillDownData.calculationMethod}
                    </p>
                  </CardContent>
                </Card>

                {/* Components Breakdown */}
                <Card>
                  <CardHeader>
                    <CardTitle>Component Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Description</TableHead>
                          <TableHead>Account Code</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                          <TableHead>Source Type</TableHead>
                          <TableHead>Date Range</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {drillDownData.components.map((component) => (
                          <TableRow key={component.id}>
                            <TableCell className="font-medium">
                              {component.description}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{component.accountCode}</Badge>
                            </TableCell>
                            <TableCell className="text-right font-mono">
                              {formatCurrency(component.amount)}
                            </TableCell>
                            <TableCell>
                              <Badge className={getSourceTypeColor(component.sourceType)}>
                                {component.sourceType.replace('_', ' ')}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm text-gray-600">
                              {component.dateRange ? 
                                `${formatDate(component.dateRange.from)} - ${formatDate(component.dateRange.to)}` : 
                                'N/A'
                              }
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="reconciliation" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      <span>Reconciliation Summary</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-blue-50 p-4 rounded-lg">
                          <div className="text-sm text-blue-600 font-medium">Trial Balance Amount</div>
                          <div className="text-2xl font-bold text-blue-800">
                            {formatCurrency(drillDownData.reconciliation.trialBalanceAmount)}
                          </div>
                        </div>
                        <div className="bg-yellow-50 p-4 rounded-lg">
                          <div className="text-sm text-yellow-600 font-medium">Adjustments</div>
                          <div className="text-2xl font-bold text-yellow-800">
                            {formatCurrency(drillDownData.reconciliation.adjustments)}
                          </div>
                        </div>
                      </div>
                      
                      <div className="border-t pt-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium">Final Amount:</span>
                          <span className="text-xl font-bold">
                            {formatCurrency(drillDownData.reconciliation.finalAmount)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="font-medium">Variance:</span>
                          <span className={`font-bold ${
                            drillDownData.reconciliation.variance === 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {formatCurrency(drillDownData.reconciliation.variance)}
                          </span>
                        </div>
                      </div>

                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-medium mb-2">Explanations:</h4>
                        <ul className="space-y-1">
                          {drillDownData.reconciliation.explanations.map((explanation, index) => (
                            <li key={index} className="text-sm text-gray-700 flex items-start space-x-2">
                              <span className="text-green-600 mt-1">•</span>
                              <span>{explanation}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="documents" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <FileText className="h-5 w-5" />
                      <span>Source Documents</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {drillDownData.sourceDocuments.map((doc) => (
                        <div key={doc.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <span className="text-2xl">{getDocumentTypeIcon(doc.type)}</span>
                              <div>
                                <div className="font-medium">{doc.filename}</div>
                                <div className="text-sm text-gray-600">{doc.description}</div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold">{formatCurrency(doc.amount)}</div>
                              <div className="text-sm text-gray-600">{formatDate(doc.date)}</div>
                            </div>
                          </div>
                          {doc.extractedData && (
                            <details className="mt-3">
                              <summary className="cursor-pointer text-sm text-blue-600 font-medium">
                                View Extracted Data
                              </summary>
                              <pre className="mt-2 p-3 bg-gray-100 rounded text-xs overflow-x-auto">
                                {JSON.stringify(doc.extractedData, null, 2)}
                              </pre>
                            </details>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="audit" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Clock className="h-5 w-5" />
                      <span>Audit Trail</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {drillDownData.auditTrail.map((entry, index) => (
                        <div key={index} className="border-l-4 border-blue-500 pl-4 py-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-gray-900">{entry.action}</span>
                            <span className="text-sm text-gray-500">
                              {new Date(entry.timestamp).toLocaleString('en-GB')}
                            </span>
                          </div>
                          <div className="text-sm text-gray-600 mb-1">
                            <span className="font-medium">User:</span> {entry.user}
                          </div>
                          {entry.reason && (
                            <div className="text-sm text-gray-600 mb-2">
                              <span className="font-medium">Reason:</span> {entry.reason}
                            </div>
                          )}
                          {(entry.oldValue !== undefined || entry.newValue !== undefined) && (
                            <div className="bg-gray-50 p-3 rounded-md text-sm">
                              {entry.oldValue !== undefined && (
                                <div>
                                  <span className="font-medium">Old Value:</span> {formatCurrency(entry.oldValue)}
                                </div>
                              )}
                              {entry.newValue !== undefined && (
                                <div>
                                  <span className="font-medium">New Value:</span> {formatCurrency(entry.newValue)}
                                </div>
                              )}
                            </div>
                          )}
                          {entry.documentIds && entry.documentIds.length > 0 && (
                            <div className="mt-2">
                              <span className="text-sm font-medium text-gray-600">Related Documents:</span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {entry.documentIds.map((docId) => (
                                  <Badge key={docId} variant="outline" className="text-xs">
                                    {docId}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
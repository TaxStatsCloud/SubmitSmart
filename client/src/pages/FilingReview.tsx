import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  FileText, 
  Building2,
  Calendar,
  Shield,
  Eye,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Filing } from "@shared/schema";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

export default function FilingReview() {
  const { toast } = useToast();
  const [selectedFiling, setSelectedFiling] = useState<Filing | null>(null);
  const [expandedValidation, setExpandedValidation] = useState<Record<number, boolean>>({});

  // Fetch filings awaiting approval
  const { data: filings = [], isLoading } = useQuery<Filing[]>({
    queryKey: ['/api/filings/awaiting-approval'],
  });

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: async (filingId: number) => {
      const response = await apiRequest('POST', `/api/filings/${filingId}/approve`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Approval failed');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Filing Approved",
        description: "The filing has been approved and is ready for submission.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/filings/awaiting-approval'] });
      setSelectedFiling(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Approval Failed",
        description: error.message || "Server-side validation prevented approval. Please review validation results.",
        variant: "destructive",
      });
    },
  });

  // Reject mutation
  const rejectMutation = useMutation({
    mutationFn: async ({ filingId, reason }: { filingId: number; reason: string }) => {
      const response = await apiRequest('POST', `/api/filings/${filingId}/reject`, { reason });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Rejection failed');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Filing Rejected",
        description: "The filing has been rejected and returned for revision.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/filings/awaiting-approval'] });
      setSelectedFiling(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Rejection Failed",
        description: error.message || "Failed to reject filing. Please try again.",
        variant: "destructive",
      });
    },
  });

  const toggleValidation = (filingId: number) => {
    setExpandedValidation(prev => ({
      ...prev,
      [filingId]: !prev[filingId]
    }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'awaiting_approval':
        return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'approved':
        return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'rejected':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      default:
        return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
    }
  };

  const getValidationStatus = (filing: Filing) => {
    const metadata = filing.data as any;
    const validation = metadata?.validationResults;
    
    if (!validation) return { status: 'unknown', color: 'text-slate-500', icon: AlertTriangle };
    
    if (validation.errorCount > 0 || validation.placeholderCount > 0) {
      return { status: 'errors', color: 'text-red-500', icon: XCircle };
    }
    if (validation.warningCount > 0) {
      return { status: 'warnings', color: 'text-amber-500', icon: AlertTriangle };
    }
    return { status: 'valid', color: 'text-emerald-500', icon: CheckCircle2 };
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading filings for review...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Professional Filing Review
        </h1>
        <p className="text-muted-foreground">
          Review and approve filings before submission to Companies House and HMRC
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-6 md:grid-cols-4 mb-8">
        <Card className="border-2 border-slate-200 dark:border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Awaiting Review</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filings.length}</div>
          </CardContent>
        </Card>

        <Card className="border-2 border-amber-200 dark:border-amber-900">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">With Warnings</CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-500">
              {filings.filter(f => {
                const validation = (f.data as any)?.validationResults;
                return validation?.warningCount > 0 && !validation?.errorCount;
              }).length}
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-red-200 dark:border-red-900">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">With Errors</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">
              {filings.filter(f => {
                const validation = (f.data as any)?.validationResults;
                return validation?.errorCount > 0 || validation?.placeholderCount > 0;
              }).length}
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-emerald-200 dark:border-emerald-900">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ready to Approve</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-500">
              {filings.filter(f => {
                const validation = (f.data as any)?.validationResults;
                return validation?.isValid && !validation?.errorCount && !validation?.placeholderCount;
              }).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filings List */}
      {filings.length === 0 ? (
        <Card className="p-12 text-center">
          <Shield className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">No Filings Awaiting Review</h3>
          <p className="text-muted-foreground">
            All filings have been reviewed and processed. New filings will appear here for approval.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {filings.map((filing) => {
            const metadata = filing.data as any;
            const validation = metadata?.validationResults;
            const entitySize = metadata?.entitySize;
            const validationStatus = getValidationStatus(filing);
            const ValidationIcon = validationStatus.icon;

            return (
              <Card 
                key={filing.id}
                className={`border-2 transition-all hover:shadow-lg ${
                  validation?.errorCount > 0 || validation?.placeholderCount > 0
                    ? 'border-red-200 dark:border-red-900'
                    : validation?.warningCount > 0
                    ? 'border-amber-200 dark:border-amber-900'
                    : 'border-emerald-200 dark:border-emerald-900'
                }`}
                data-testid={`filing-card-${filing.id}`}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Building2 className="h-5 w-5 text-muted-foreground" />
                        <CardTitle className="text-xl">
                          {metadata?.companyName || `Company ${filing.companyId}`}
                        </CardTitle>
                        <Badge variant="outline" className={getStatusColor(filing.status)}>
                          {filing.status.replace('_', ' ')}
                        </Badge>
                        {entitySize && (
                          <Badge variant="secondary">
                            {entitySize.charAt(0).toUpperCase() + entitySize.slice(1)} Entity
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-6 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          <span>{filing.type}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>Period End: {metadata?.accountingPeriodEnd || 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <ValidationIcon className={`h-4 w-4 ${validationStatus.color}`} />
                          <span className={validationStatus.color}>
                            {validationStatus.status === 'valid' && 'Validation Passed'}
                            {validationStatus.status === 'warnings' && `${validation?.warningCount} Warnings`}
                            {validationStatus.status === 'errors' && `${validation?.errorCount + validation?.placeholderCount} Issues`}
                            {validationStatus.status === 'unknown' && 'Not Validated'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedFiling(filing)}
                        data-testid={`button-view-details-${filing.id}`}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => approveMutation.mutate(filing.id)}
                        disabled={
                          validation?.errorCount > 0 || 
                          validation?.placeholderCount > 0 ||
                          approveMutation.isPending
                        }
                        className="bg-emerald-600 hover:bg-emerald-700"
                        data-testid={`button-approve-${filing.id}`}
                      >
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Approve
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => rejectMutation.mutate({ 
                          filingId: filing.id, 
                          reason: 'Requires revision' 
                        })}
                        disabled={rejectMutation.isPending}
                        data-testid={`button-reject-${filing.id}`}
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Reject
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                {/* Validation Results */}
                {validation && (
                  <CardContent>
                    <Collapsible
                      open={expandedValidation[filing.id]}
                      onOpenChange={() => toggleValidation(filing.id)}
                    >
                      <CollapsibleTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full justify-between"
                          data-testid={`button-toggle-validation-${filing.id}`}
                        >
                          <span className="flex items-center gap-2">
                            <Shield className="h-4 w-4" />
                            Validation Details
                          </span>
                          {expandedValidation[filing.id] ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                      </CollapsibleTrigger>
                      
                      <CollapsibleContent className="mt-4">
                        <Tabs defaultValue="summary" className="w-full">
                          <TabsList className="grid w-full grid-cols-4">
                            <TabsTrigger value="summary">Summary</TabsTrigger>
                            <TabsTrigger value="errors">
                              Errors ({validation.errorCount + validation.placeholderCount})
                            </TabsTrigger>
                            <TabsTrigger value="warnings">
                              Warnings ({validation.warningCount})
                            </TabsTrigger>
                            <TabsTrigger value="stats">Statistics</TabsTrigger>
                          </TabsList>

                          <TabsContent value="summary" className="space-y-4">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                              <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-900">
                                <div className="text-sm text-muted-foreground">Status</div>
                                <div className={`text-lg font-semibold ${validationStatus.color}`}>
                                  {validation.isValid ? 'Valid' : 'Invalid'}
                                </div>
                              </div>
                              <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950">
                                <div className="text-sm text-muted-foreground">Errors</div>
                                <div className="text-lg font-semibold text-red-500">
                                  {validation.errorCount}
                                </div>
                              </div>
                              <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950">
                                <div className="text-sm text-muted-foreground">Warnings</div>
                                <div className="text-lg font-semibold text-amber-500">
                                  {validation.warningCount}
                                </div>
                              </div>
                              <div className="p-4 rounded-lg bg-orange-50 dark:bg-orange-950">
                                <div className="text-sm text-muted-foreground">Placeholders</div>
                                <div className="text-lg font-semibold text-orange-500">
                                  {validation.placeholderCount}
                                </div>
                              </div>
                            </div>
                          </TabsContent>

                          <TabsContent value="errors" className="space-y-2">
                            {validation.errors && validation.errors.length > 0 ? (
                              validation.errors.map((error: any, index: number) => (
                                <div
                                  key={index}
                                  className="p-3 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-900"
                                  data-testid={`error-item-${index}`}
                                >
                                  <div className="flex items-start gap-2">
                                    <XCircle className="h-4 w-4 text-red-500 mt-0.5" />
                                    <div className="flex-1">
                                      <div className="font-medium text-red-700 dark:text-red-400">
                                        {error.code}: {error.message}
                                      </div>
                                      {error.element && (
                                        <div className="text-sm text-muted-foreground mt-1">
                                          Element: {error.element}
                                        </div>
                                      )}
                                      {error.location && (
                                        <div className="text-sm text-muted-foreground">
                                          Location: {error.location}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))
                            ) : validation.placeholders && validation.placeholders.length > 0 ? (
                              validation.placeholders.map((placeholder: any, index: number) => (
                                <div
                                  key={index}
                                  className="p-3 rounded-lg bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-900"
                                  data-testid={`placeholder-item-${index}`}
                                >
                                  <div className="flex items-start gap-2">
                                    <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5" />
                                    <div className="flex-1">
                                      <div className="font-medium text-orange-700 dark:text-orange-400">
                                        {placeholder.type}: {placeholder.message}
                                      </div>
                                      {placeholder.location && (
                                        <div className="text-sm text-muted-foreground">
                                          {placeholder.location}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="text-center py-8 text-muted-foreground">
                                No errors or placeholders detected
                              </div>
                            )}
                          </TabsContent>

                          <TabsContent value="warnings" className="space-y-2">
                            {validation.warnings && validation.warnings.length > 0 ? (
                              validation.warnings.map((warning: any, index: number) => (
                                <div
                                  key={index}
                                  className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-900"
                                  data-testid={`warning-item-${index}`}
                                >
                                  <div className="flex items-start gap-2">
                                    <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5" />
                                    <div className="flex-1">
                                      <div className="font-medium text-amber-700 dark:text-amber-400">
                                        {warning.code}: {warning.message}
                                      </div>
                                      {warning.element && (
                                        <div className="text-sm text-muted-foreground mt-1">
                                          Element: {warning.element}
                                        </div>
                                      )}
                                      {warning.location && (
                                        <div className="text-sm text-muted-foreground">
                                          Location: {warning.location}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="text-center py-8 text-muted-foreground">
                                No warnings detected
                              </div>
                            )}
                          </TabsContent>

                          <TabsContent value="stats" className="space-y-2">
                            {validation.statistics ? (
                              <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950">
                                  <div className="text-sm text-muted-foreground">Total Facts</div>
                                  <div className="text-2xl font-bold text-blue-600">
                                    {validation.statistics.totalFacts}
                                  </div>
                                </div>
                                <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-950">
                                  <div className="text-sm text-muted-foreground">Tagged Elements</div>
                                  <div className="text-2xl font-bold text-purple-600">
                                    {validation.statistics.taggedElements}
                                  </div>
                                </div>
                                <div className="p-4 rounded-lg bg-indigo-50 dark:bg-indigo-950">
                                  <div className="text-sm text-muted-foreground">Contexts</div>
                                  <div className="text-2xl font-bold text-indigo-600">
                                    {validation.statistics.totalContexts}
                                  </div>
                                </div>
                                <div className="p-4 rounded-lg bg-cyan-50 dark:bg-cyan-950">
                                  <div className="text-sm text-muted-foreground">Units</div>
                                  <div className="text-2xl font-bold text-cyan-600">
                                    {validation.statistics.totalUnits}
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="text-center py-8 text-muted-foreground">
                                No statistics available
                              </div>
                            )}
                          </TabsContent>
                        </Tabs>
                      </CollapsibleContent>
                    </Collapsible>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

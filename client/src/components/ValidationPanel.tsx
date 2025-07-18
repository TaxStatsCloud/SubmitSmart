import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { CheckCircle, AlertTriangle, Info, ChevronDown, ChevronRight, Shield, Clock, FileText } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface ValidationResult {
  isValid: boolean;
  confidence: number;
  issues: ValidationIssue[];
  recommendations: string[];
  auditTrail: AuditTrailEntry[];
}

interface ValidationIssue {
  severity: 'critical' | 'warning' | 'info';
  category: string;
  description: string;
  affectedItems: string[];
  suggestedFix: string;
  regulatoryReference?: string;
}

interface AuditTrailEntry {
  timestamp: string;
  action: string;
  validator: string;
  result: string;
  evidence: any;
}

interface ValidationPanelProps {
  type: 'trial-balance' | 'financial-statements';
  dataId: number;
  data?: any;
  onValidationComplete?: (result: ValidationResult) => void;
}

export default function ValidationPanel({ type, dataId, data, onValidationComplete }: ValidationPanelProps) {
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  const runValidation = async () => {
    setIsValidating(true);
    try {
      const endpoint = type === 'trial-balance' 
        ? `/api/validate/trial-balance/${dataId}`
        : `/api/validate/financial-statements/${dataId}`;
      
      const response = await apiRequest("POST", endpoint, data ? { statements: data } : {});
      const result = await response.json();
      
      if (result.success) {
        setValidationResult(result.validation);
        onValidationComplete?.(result.validation);
      }
    } catch (error) {
      console.error('Validation failed:', error);
    } finally {
      setIsValidating(false);
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'info': return <Info className="h-4 w-4 text-blue-500" />;
      default: return <Info className="h-4 w-4" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'warning': return 'secondary';
      case 'info': return 'outline';
      default: return 'outline';
    }
  };

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Card className="w-full">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Shield className="h-6 w-6 text-blue-600" />
            <div>
              <CardTitle className="text-lg font-semibold text-gray-900">
                Validation Agent
              </CardTitle>
              <CardDescription className="text-sm text-gray-600">
                AI-powered accuracy and compliance validation
              </CardDescription>
            </div>
          </div>
          <Button 
            onClick={runValidation}
            disabled={isValidating}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isValidating ? (
              <>
                <Clock className="h-4 w-4 mr-2 animate-spin" />
                Validating...
              </>
            ) : (
              <>
                <Shield className="h-4 w-4 mr-2" />
                Run Validation
              </>
            )}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        {validationResult ? (
          <div className="space-y-6">
            {/* Validation Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="border-l-4 border-l-green-500">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className={`h-5 w-5 ${validationResult.isValid ? 'text-green-500' : 'text-red-500'}`} />
                    <span className="font-medium">
                      {validationResult.isValid ? 'PASSED' : 'FAILED'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">Overall Status</p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-blue-500">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl font-bold text-blue-600">
                      {validationResult.confidence}%
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">Confidence Score</p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-yellow-500">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl font-bold text-yellow-600">
                      {validationResult.issues.length}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">Issues Found</p>
                </CardContent>
              </Card>
            </div>

            {/* Issues Section */}
            {validationResult.issues.length > 0 && (
              <Collapsible 
                open={expandedSections.has('issues')}
                onOpenChange={() => toggleSection('issues')}
              >
                <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-500" />
                    <span className="font-medium">Validation Issues ({validationResult.issues.length})</span>
                  </div>
                  {expandedSections.has('issues') ? 
                    <ChevronDown className="h-4 w-4" /> : 
                    <ChevronRight className="h-4 w-4" />
                  }
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-4 space-y-3">
                  {validationResult.issues.map((issue, index) => (
                    <Alert key={index} className="border-l-4 border-l-yellow-500">
                      <div className="flex items-start space-x-3">
                        {getSeverityIcon(issue.severity)}
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <Badge variant={getSeverityColor(issue.severity) as any}>
                              {issue.severity.toUpperCase()}
                            </Badge>
                            <span className="text-sm font-medium text-gray-600">
                              {issue.category}
                            </span>
                          </div>
                          <AlertDescription className="text-gray-700 mb-2">
                            {issue.description}
                          </AlertDescription>
                          
                          {issue.affectedItems.length > 0 && (
                            <div className="mb-2">
                              <span className="text-sm font-medium text-gray-600">Affected Items:</span>
                              <ul className="list-disc list-inside text-sm text-gray-600 ml-4">
                                {issue.affectedItems.map((item, idx) => (
                                  <li key={idx}>{item}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          
                          <div className="bg-blue-50 p-3 rounded-md">
                            <span className="text-sm font-medium text-blue-800">Suggested Fix:</span>
                            <p className="text-sm text-blue-700 mt-1">{issue.suggestedFix}</p>
                            {issue.regulatoryReference && (
                              <p className="text-xs text-blue-600 mt-2">
                                Reference: {issue.regulatoryReference}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </Alert>
                  ))}
                </CollapsibleContent>
              </Collapsible>
            )}

            {/* Recommendations */}
            {validationResult.recommendations.length > 0 && (
              <Collapsible 
                open={expandedSections.has('recommendations')}
                onOpenChange={() => toggleSection('recommendations')}
              >
                <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="font-medium">Recommendations ({validationResult.recommendations.length})</span>
                  </div>
                  {expandedSections.has('recommendations') ? 
                    <ChevronDown className="h-4 w-4" /> : 
                    <ChevronRight className="h-4 w-4" />
                  }
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-4">
                  <div className="bg-green-50 p-4 rounded-lg">
                    <ul className="space-y-2">
                      {validationResult.recommendations.map((rec, index) => (
                        <li key={index} className="flex items-start space-x-2">
                          <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-green-800">{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            )}

            {/* Audit Trail */}
            <Collapsible 
              open={expandedSections.has('audit')}
              onOpenChange={() => toggleSection('audit')}
            >
              <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-center space-x-2">
                  <FileText className="h-5 w-5 text-gray-500" />
                  <span className="font-medium">Audit Trail ({validationResult.auditTrail.length} entries)</span>
                </div>
                {expandedSections.has('audit') ? 
                  <ChevronDown className="h-4 w-4" /> : 
                  <ChevronRight className="h-4 w-4" />
                }
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-4">
                <div className="space-y-3">
                  {validationResult.auditTrail.map((entry, index) => (
                    <div key={index} className="border rounded-lg p-4 bg-white">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900">{entry.action}</span>
                        <span className="text-sm text-gray-500">
                          {formatTimestamp(entry.timestamp)}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 mb-2">
                        <span className="font-medium">Validator:</span> {entry.validator}
                      </div>
                      <div className="text-sm text-gray-700 mb-2">
                        <span className="font-medium">Result:</span> {entry.result}
                      </div>
                      {entry.evidence && (
                        <details className="text-xs text-gray-500">
                          <summary className="cursor-pointer font-medium">Evidence</summary>
                          <pre className="mt-2 p-2 bg-gray-50 rounded overflow-x-auto">
                            {JSON.stringify(entry.evidence, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        ) : (
          <div className="text-center py-8">
            <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">
              Click "Run Validation" to perform comprehensive accuracy and compliance checks
            </p>
            <p className="text-sm text-gray-500">
              Our AI validation agents will verify mathematical accuracy, regulatory compliance, and data integrity
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
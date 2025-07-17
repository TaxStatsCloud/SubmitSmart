import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertTriangle, Send, FileText, Clock, RefreshCw, Shield } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Helmet } from 'react-helmet-async';

type SubmissionResult = {
  success: boolean;
  correlationId?: string;
  pollUrl?: string;
  error?: string;
  xmlData?: string;
};

type StatusResult = {
  status: 'pending' | 'accepted' | 'rejected' | 'error';
  message?: string;
  errors?: string[];
};

export default function HMRCIntegration() {
  const [submissionResult, setSubmissionResult] = useState<SubmissionResult | null>(null);
  const [statusResult, setStatusResult] = useState<StatusResult | null>(null);
  const [xmlOutput, setXmlOutput] = useState<string>('');
  const [correlationId, setCorrelationId] = useState<string>('');

  // Mock corporation tax data for testing
  const [ctData, setCTData] = useState({
    companyName: 'Test Company Ltd',
    companyNumber: '12345678',
    address: {
      line1: '123 Test Street',
      line2: 'Test Area',
      postcode: 'TE1 1ST',
      country: 'GB'
    },
    accountingPeriodStart: '2023-01-01',
    accountingPeriodEnd: '2023-12-31',
    turnover: 50000000, // £500,000 in pence
    costOfSales: 20000000, // £200,000 in pence
    administrativeExpenses: 15000000, // £150,000 in pence
    profit: 15000000, // £150,000 in pence
    taxableProfit: 15000000, // £150,000 in pence
    corporationTaxDue: 2850000, // £28,500 in pence
    taxPaid: 0,
    taxBalance: 2850000,
    authorizedPerson: 'Director'
  });

  // Generate XML mutation
  const generateXMLMutation = useMutation({
    mutationFn: (data: any) => apiRequest('POST', '/api/hmrc/ct600/generate-xml', { corporationTaxData: data }),
    onSuccess: async (response) => {
      const result = await response.json();
      setXmlOutput(result.xmlData);
      toast({
        title: 'XML Generated',
        description: 'CT600 XML generated successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Generation Failed',
        description: error.message || 'Failed to generate XML',
        variant: 'destructive',
      });
    }
  });

  // Submit CT600 mutation
  const submitCT600Mutation = useMutation({
    mutationFn: (data: any) => apiRequest('POST', '/api/hmrc/ct600/submit', { corporationTaxData: data }),
    onSuccess: async (response) => {
      const result = await response.json();
      setSubmissionResult(result);
      setXmlOutput(result.xmlData);
      if (result.correlationId) {
        setCorrelationId(result.correlationId);
      }
      toast({
        title: result.success ? 'Submission Successful' : 'Submission Failed',
        description: result.success ? 'CT600 submitted to HMRC' : result.error,
        variant: result.success ? 'default' : 'destructive',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Submission Failed',
        description: error.message || 'Failed to submit CT600',
        variant: 'destructive',
      });
    }
  });

  // Test submission mutation
  const testSubmissionMutation = useMutation({
    mutationFn: () => apiRequest('POST', '/api/hmrc/ct600/test-submission'),
    onSuccess: async (response) => {
      const result = await response.json();
      setSubmissionResult(result.submissionResult);
      setXmlOutput(result.xmlData);
      if (result.submissionResult.correlationId) {
        setCorrelationId(result.submissionResult.correlationId);
      }
      toast({
        title: 'Test Submission Complete',
        description: 'Test CT600 submission processed',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Test Failed',
        description: error.message || 'Test submission failed',
        variant: 'destructive',
      });
    }
  });

  // Poll status mutation
  const pollStatusMutation = useMutation({
    mutationFn: (corrId: string) => apiRequest('GET', `/api/hmrc/ct600/status/${corrId}`),
    onSuccess: async (response) => {
      const result = await response.json();
      setStatusResult(result);
      toast({
        title: 'Status Updated',
        description: `Status: ${result.status}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Status Check Failed',
        description: error.message || 'Failed to check status',
        variant: 'destructive',
      });
    }
  });

  const handleGenerateXML = () => {
    generateXMLMutation.mutate(ctData);
  };

  const handleSubmitCT600 = () => {
    submitCT600Mutation.mutate(ctData);
  };

  const handleTestSubmission = () => {
    testSubmissionMutation.mutate();
  };

  const handlePollStatus = () => {
    if (correlationId) {
      pollStatusMutation.mutate(correlationId);
    }
  };

  const formatCurrency = (pence: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(pence / 100);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'accepted':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'rejected':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <>
      <Helmet>
        <title>HMRC Integration | PromptSubmissions</title>
        <meta name="description" content="Direct HMRC Corporation Tax API integration for automated CT600 submissions" />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    HMRC Integration
                  </h1>
                  <p className="text-gray-600 mt-2">
                    Direct Corporation Tax API integration for automated CT600 submissions
                  </p>
                </div>
                <div className="flex items-center space-x-4">
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    <Shield className="w-4 h-4 mr-1" />
                    Vendor ID: 9233
                  </Badge>
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                    Test Environment
                  </Badge>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Test Data & Controls */}
              <div className="space-y-6">
                {/* Test Data */}
                <Card className="bg-white/80 backdrop-blur-sm shadow-lg border border-white/20">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <FileText className="w-5 h-5 text-blue-600" />
                      <span>Test Corporation Tax Data</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="company-name">Company Name</Label>
                          <Input
                            id="company-name"
                            value={ctData.companyName}
                            onChange={(e) => setCTData(prev => ({ ...prev, companyName: e.target.value }))}
                          />
                        </div>
                        <div>
                          <Label htmlFor="company-number">Company Number</Label>
                          <Input
                            id="company-number"
                            value={ctData.companyNumber}
                            onChange={(e) => setCTData(prev => ({ ...prev, companyNumber: e.target.value }))}
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="period-start">Period Start</Label>
                          <Input
                            id="period-start"
                            type="date"
                            value={ctData.accountingPeriodStart}
                            onChange={(e) => setCTData(prev => ({ ...prev, accountingPeriodStart: e.target.value }))}
                          />
                        </div>
                        <div>
                          <Label htmlFor="period-end">Period End</Label>
                          <Input
                            id="period-end"
                            type="date"
                            value={ctData.accountingPeriodEnd}
                            onChange={(e) => setCTData(prev => ({ ...prev, accountingPeriodEnd: e.target.value }))}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="turnover">Turnover</Label>
                          <Input
                            id="turnover"
                            value={formatCurrency(ctData.turnover)}
                            onChange={(e) => {
                              const value = parseFloat(e.target.value.replace(/[£,]/g, '')) || 0;
                              setCTData(prev => ({ ...prev, turnover: value * 100 }));
                            }}
                          />
                        </div>
                        <div>
                          <Label htmlFor="profit">Profit</Label>
                          <Input
                            id="profit"
                            value={formatCurrency(ctData.profit)}
                            onChange={(e) => {
                              const value = parseFloat(e.target.value.replace(/[£,]/g, '')) || 0;
                              setCTData(prev => ({ ...prev, profit: value * 100 }));
                            }}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="taxable-profit">Taxable Profit</Label>
                          <Input
                            id="taxable-profit"
                            value={formatCurrency(ctData.taxableProfit)}
                            onChange={(e) => {
                              const value = parseFloat(e.target.value.replace(/[£,]/g, '')) || 0;
                              setCTData(prev => ({ ...prev, taxableProfit: value * 100 }));
                            }}
                          />
                        </div>
                        <div>
                          <Label htmlFor="tax-due">Corporation Tax Due</Label>
                          <Input
                            id="tax-due"
                            value={formatCurrency(ctData.corporationTaxDue)}
                            onChange={(e) => {
                              const value = parseFloat(e.target.value.replace(/[£,]/g, '')) || 0;
                              setCTData(prev => ({ ...prev, corporationTaxDue: value * 100 }));
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Controls */}
                <Card className="bg-white/80 backdrop-blur-sm shadow-lg border border-white/20">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Send className="w-5 h-5 text-green-600" />
                      <span>HMRC API Controls</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <Button
                          onClick={handleGenerateXML}
                          disabled={generateXMLMutation.isPending}
                          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                        >
                          <FileText className="w-4 h-4 mr-2" />
                          {generateXMLMutation.isPending ? 'Generating...' : 'Generate XML'}
                        </Button>
                        <Button
                          onClick={handleSubmitCT600}
                          disabled={submitCT600Mutation.isPending}
                          className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                        >
                          <Send className="w-4 h-4 mr-2" />
                          {submitCT600Mutation.isPending ? 'Submitting...' : 'Submit CT600'}
                        </Button>
                      </div>
                      <Button
                        onClick={handleTestSubmission}
                        disabled={testSubmissionMutation.isPending}
                        variant="outline"
                        className="w-full bg-gradient-to-r from-yellow-50 to-orange-50 hover:from-yellow-100 hover:to-orange-100"
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        {testSubmissionMutation.isPending ? 'Testing...' : 'Run Test Submission'}
                      </Button>
                      
                      {correlationId && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label htmlFor="correlation-id">Correlation ID</Label>
                            <Button
                              onClick={handlePollStatus}
                              disabled={pollStatusMutation.isPending}
                              size="sm"
                              variant="outline"
                            >
                              <RefreshCw className="w-4 h-4 mr-1" />
                              {pollStatusMutation.isPending ? 'Checking...' : 'Check Status'}
                            </Button>
                          </div>
                          <Input
                            id="correlation-id"
                            value={correlationId}
                            onChange={(e) => setCorrelationId(e.target.value)}
                            placeholder="Enter correlation ID to check status"
                          />
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Results */}
              <div className="space-y-6">
                {/* Submission Results */}
                {submissionResult && (
                  <Card className="bg-white/80 backdrop-blur-sm shadow-lg border border-white/20">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        {submissionResult.success ? (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        ) : (
                          <AlertTriangle className="w-5 h-5 text-red-500" />
                        )}
                        <span>Submission Result</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">Status:</span>
                          <Badge className={submissionResult.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                            {submissionResult.success ? 'SUCCESS' : 'FAILED'}
                          </Badge>
                        </div>
                        
                        {submissionResult.correlationId && (
                          <div className="flex items-center justify-between">
                            <span className="font-medium">Correlation ID:</span>
                            <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                              {submissionResult.correlationId}
                            </code>
                          </div>
                        )}
                        
                        {submissionResult.pollUrl && (
                          <div className="flex items-center justify-between">
                            <span className="font-medium">Poll URL:</span>
                            <span className="text-sm text-blue-600 truncate">
                              {submissionResult.pollUrl}
                            </span>
                          </div>
                        )}
                        
                        {submissionResult.error && (
                          <Alert>
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription>
                              {submissionResult.error}
                            </AlertDescription>
                          </Alert>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Status Results */}
                {statusResult && (
                  <Card className="bg-white/80 backdrop-blur-sm shadow-lg border border-white/20">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        {getStatusIcon(statusResult.status)}
                        <span>HMRC Status</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">Status:</span>
                          <Badge className={getStatusColor(statusResult.status)}>
                            {statusResult.status.toUpperCase()}
                          </Badge>
                        </div>
                        
                        {statusResult.message && (
                          <div>
                            <span className="font-medium">Message:</span>
                            <p className="text-sm text-gray-600 mt-1">{statusResult.message}</p>
                          </div>
                        )}
                        
                        {statusResult.errors && statusResult.errors.length > 0 && (
                          <div>
                            <span className="font-medium">Errors:</span>
                            <ul className="text-sm text-red-600 mt-1 space-y-1">
                              {statusResult.errors.map((error, index) => (
                                <li key={index}>• {error}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* XML Output */}
                {xmlOutput && (
                  <Card className="bg-white/80 backdrop-blur-sm shadow-lg border border-white/20">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <FileText className="w-5 h-5 text-purple-600" />
                        <span>Generated XML</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Textarea
                        value={xmlOutput}
                        readOnly
                        className="min-h-[300px] font-mono text-sm"
                        placeholder="Generated XML will appear here..."
                      />
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
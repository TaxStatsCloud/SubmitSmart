import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

export default function HMRCTest() {
  const [result, setResult] = useState<any>(null);

  const testSubmission = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/hmrc/ct600/test-submission');
      return response.json();
    },
    onSuccess: (data) => {
      setResult(data);
    },
    onError: (error: any) => {
      setResult({
        success: false,
        error: error.message || 'Test submission failed'
      });
    }
  });

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>HMRC CT600 Test Submission</CardTitle>
          <CardDescription>
            Test CT600 submission using actual HMRC credentials
            <br />
            <strong>Vendor ID:</strong> 9233 | <strong>Test User:</strong> CTUser100 | <strong>Test UTR:</strong> 8596148860
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Button 
              onClick={() => testSubmission.mutate()}
              disabled={testSubmission.isPending}
              data-testid="button-test-submission"
              className="w-full"
            >
              {testSubmission.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting to HMRC...
                </>
              ) : (
                'Send Test CT600 to HMRC'
              )}
            </Button>
          </div>

          {result && (
            <div className="space-y-4">
              <Alert variant={result.success ? 'default' : 'destructive'}>
                <div className="flex items-start gap-2">
                  {result.success ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5" />
                  )}
                  <div className="flex-1">
                    <h4 className="font-semibold mb-1">
                      {result.success ? 'Submission Sent' : 'Submission Failed'}
                    </h4>
                    <AlertDescription>
                      {result.message || result.error}
                    </AlertDescription>
                  </div>
                </div>
              </Alert>

              {result.submissionResult && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">HMRC Response</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <dl className="space-y-2 text-sm">
                      <div>
                        <dt className="font-semibold">Status:</dt>
                        <dd className={result.submissionResult.success ? 'text-green-600' : 'text-red-600'}>
                          {result.submissionResult.success ? 'Success' : 'Failed'}
                        </dd>
                      </div>
                      {result.submissionResult.correlationId && (
                        <div>
                          <dt className="font-semibold">Correlation ID:</dt>
                          <dd className="font-mono">{result.submissionResult.correlationId}</dd>
                        </div>
                      )}
                      {result.submissionResult.pollUrl && (
                        <div>
                          <dt className="font-semibold">Poll URL:</dt>
                          <dd className="font-mono text-xs break-all">{result.submissionResult.pollUrl}</dd>
                        </div>
                      )}
                      {result.submissionResult.error && (
                        <div>
                          <dt className="font-semibold">Error:</dt>
                          <dd className="text-red-600">{result.submissionResult.error}</dd>
                        </div>
                      )}
                    </dl>
                  </CardContent>
                </Card>
              )}

              {result.xmlData && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Generated XML</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto text-xs">
                      {result.xmlData}
                    </pre>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>What This Tests:</strong>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>XML structure with your Vendor ID 9233</li>
                <li>HMRC Gateway authentication with CTUser100</li>
                <li>CT600 form generation</li>
                <li>Submission to HMRC test endpoint</li>
                <li>Response handling and error reporting</li>
              </ul>
              <p className="mt-2">
                <strong>Next Steps:</strong> Based on HMRC's response, we'll know exactly what iXBRL elements to add.
              </p>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { FileKey, Shield, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const credentialsSchema = z.object({
  companyId: z.number(),
  presenterIdNumber: z.string().min(1, 'Presenter ID is required'),
  presenterAuthenticationCode: z.string().min(1, 'Authentication code is required'),
  testMode: z.boolean().default(false),
});

type CredentialsFormData = z.infer<typeof credentialsSchema>;

interface EFilingCredentialsDialogProps {
  companyId: number;
}

export function EFilingCredentialsDialog({ companyId }: EFilingCredentialsDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);

  // Fetch existing credentials
  const { data: credentialsData, isLoading } = useQuery<any>({
    queryKey: ['/api/efiling-credentials', companyId],
    enabled: open && !!companyId,
  });

  const credentials = credentialsData?.credentials;

  const form = useForm<CredentialsFormData>({
    resolver: zodResolver(credentialsSchema),
    defaultValues: {
      companyId,
      presenterIdNumber: '',
      presenterAuthenticationCode: '',
      testMode: false,
    },
  });

  // Update form when credentials are loaded
  useEffect(() => {
    if (credentials) {
      form.reset({
        companyId,
        presenterIdNumber: credentials.presenterIdNumber,
        presenterAuthenticationCode: '', // Never populate password field
        testMode: credentials.testMode,
      });
    }
  }, [credentials, companyId, form]);

  const saveMutation = useMutation({
    mutationFn: async (data: CredentialsFormData) => {
      return await apiRequest('POST', '/api/efiling-credentials', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/efiling-credentials', companyId] });
      toast({
        title: 'Success',
        description: 'E-Filing credentials saved successfully',
      });
      setOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save credentials',
        variant: 'destructive',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!credentials?.id) throw new Error('No credentials to delete');
      return await apiRequest('DELETE', `/api/efiling-credentials/${credentials.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/efiling-credentials', companyId] });
      toast({
        title: 'Success',
        description: 'E-Filing credentials deleted successfully',
      });
      setOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete credentials',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: CredentialsFormData) => {
    saveMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={credentials ? 'outline' : 'default'} data-testid="button-efiling-credentials">
          <FileKey className="w-4 h-4 mr-2" />
          {credentials ? 'Update E-Filing Credentials' : 'Setup E-Filing Credentials'}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Companies House E-Filing Credentials
          </DialogTitle>
          <DialogDescription>
            Configure your Companies House XML Gateway credentials for direct filing of Annual Accounts and Confirmation Statements.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {credentials ? (
              <Card className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    Active Credentials
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-2">
                  <div>
                    <span className="font-medium">Presenter ID:</span> {credentials.presenterIdNumber}
                  </div>
                  <div>
                    <span className="font-medium">Mode:</span>{' '}
                    {credentials.testMode ? (
                      <span className="text-amber-600 font-semibold">Test Mode</span>
                    ) : (
                      <span className="text-green-600 font-semibold">Live Mode</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  No E-Filing credentials configured. You need to obtain credentials from Companies House to submit filings.
                </AlertDescription>
              </Alert>
            )}

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm space-y-2">
                <p className="font-semibold">How to get E-Filing credentials:</p>
                <ol className="list-decimal list-inside space-y-1 ml-2">
                  <li>Email <a href="mailto:xml@companieshouse.gov.uk" className="underline">xml@companieshouse.gov.uk</a></li>
                  <li>Request a Presenter ID and Authentication Code</li>
                  <li>For testing, request credentials starting with <code className="bg-muted px-1 rounded">666</code></li>
                  <li>Enter your credentials below to enable automated filing</li>
                </ol>
              </AlertDescription>
            </Alert>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="presenterIdNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Presenter ID Number</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="e.g., 66612345 (test) or your live ID"
                          data-testid="input-presenter-id"
                        />
                      </FormControl>
                      <FormDescription>
                        Your unique Companies House Presenter ID
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="presenterAuthenticationCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Authentication Code</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="password"
                          placeholder="Enter your authentication code"
                          data-testid="input-auth-code"
                        />
                      </FormControl>
                      <FormDescription>
                        Your presenter authentication code (will be encrypted)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="testMode"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Test Mode</FormLabel>
                        <FormDescription>
                          Enable test mode for sandbox submissions (Presenter ID must start with 666)
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="switch-test-mode"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <div className="flex gap-3 pt-4">
                  <Button
                    type="submit"
                    disabled={saveMutation.isPending}
                    className="flex-1"
                    data-testid="button-save-credentials"
                  >
                    {saveMutation.isPending ? 'Saving...' : credentials ? 'Update Credentials' : 'Save Credentials'}
                  </Button>
                  
                  {credentials && (
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={() => deleteMutation.mutate()}
                      disabled={deleteMutation.isPending}
                      data-testid="button-delete-credentials"
                    >
                      {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
                    </Button>
                  )}
                </div>
              </form>
            </Form>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

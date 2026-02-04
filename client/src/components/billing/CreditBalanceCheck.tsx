import { useQuery } from '@tanstack/react-query';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Zap, AlertTriangle, CreditCard, ArrowRight, Loader2 } from 'lucide-react';
import { Link } from 'wouter';
import { apiRequest } from '@/lib/queryClient';

interface CreditBalanceCheckProps {
  filingType: string;
  filingTypeName?: string;
  onCreditValidation?: (valid: boolean, credits: number, required: number) => void;
}

/**
 * Component to check if user has enough credits for a filing type
 * Shows a warning alert if insufficient credits with link to purchase more
 */
export function CreditBalanceCheck({
  filingType,
  filingTypeName,
  onCreditValidation
}: CreditBalanceCheckProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/billing/validate-credits', filingType],
    queryFn: async () => {
      const res = await apiRequest('GET', `/api/billing/validate-credits/${filingType}`);
      if (!res.ok) {
        throw new Error('Failed to validate credits');
      }
      return res.json();
    },
    refetchOnWindowFocus: true
  });

  // Call callback when validation completes
  if (data && onCreditValidation) {
    onCreditValidation(data.valid, data.currentCredits, data.requiredCredits);
  }

  if (isLoading) {
    return (
      <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950">
        <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
        <AlertDescription className="text-blue-800 dark:text-blue-200">
          Checking credit balance...
        </AlertDescription>
      </Alert>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Unable to verify credit balance. Please try again.
        </AlertDescription>
      </Alert>
    );
  }

  if (!data) return null;

  // Show success message if user has enough credits
  if (data.valid) {
    return (
      <Alert className="border-green-200 bg-green-50 dark:bg-green-950">
        <Zap className="h-4 w-4 text-green-600" />
        <AlertTitle className="text-green-900 dark:text-green-100">
          Credits Available
        </AlertTitle>
        <AlertDescription className="text-green-800 dark:text-green-200">
          <div className="flex items-center justify-between">
            <span>
              You have <strong>{data.currentCredits}</strong> credits available.
              This {filingTypeName || filingType} filing requires <strong>{data.requiredCredits}</strong> credits.
            </span>
            <Badge variant="outline" className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
              <Zap className="h-3 w-3 mr-1" />
              {data.currentCredits} credits
            </Badge>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  // Show warning if user doesn't have enough credits
  return (
    <Alert className="border-amber-300 bg-amber-50 dark:bg-amber-950">
      <AlertTriangle className="h-4 w-4 text-amber-600" />
      <AlertTitle className="text-amber-900 dark:text-amber-100">
        Insufficient Credits
      </AlertTitle>
      <AlertDescription className="text-amber-800 dark:text-amber-200">
        <div className="space-y-3">
          <p>
            You need <strong>{data.shortfall}</strong> more credits for this {filingTypeName || filingType} filing.
            (Current: <strong>{data.currentCredits}</strong>, Required: <strong>{data.requiredCredits}</strong>)
          </p>
          <div className="flex items-center gap-3">
            <Button asChild size="sm" className="bg-amber-600 hover:bg-amber-700">
              <Link href="/subscription">
                <CreditCard className="h-4 w-4 mr-1" />
                Buy Credits
                <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
            <span className="text-sm text-amber-700 dark:text-amber-300">
              You can still fill out the form and purchase credits later
            </span>
          </div>
        </div>
      </AlertDescription>
    </Alert>
  );
}

/**
 * Simple credit balance display for headers/navigation
 */
export function CreditBalanceDisplay() {
  const { data, isLoading } = useQuery({
    queryKey: ['/api/billing/credits'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/billing/credits');
      return res.json();
    }
  });

  if (isLoading) {
    return (
      <Badge variant="outline" className="animate-pulse">
        <Zap className="h-3 w-3 mr-1" />
        Loading...
      </Badge>
    );
  }

  if (!data) return null;

  return (
    <Badge
      variant="outline"
      className={`${
        data.credits > 0
          ? 'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300 border-green-300'
          : 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300 border-red-300'
      }`}
    >
      <Zap className="h-3 w-3 mr-1" />
      {data.credits} credits
    </Badge>
  );
}

import { Check, Calculator } from "lucide-react";
import FilingTemplate from "@/components/filings/FilingTemplate";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAuth } from "@/hooks/use-auth";

const CorporationTax = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  
  const { data: filing, isLoading } = useQuery({
    queryKey: ['/api/filings', 'corporation_tax'],
    enabled: !!user?.id,
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to load corporation tax data",
        variant: "destructive",
      });
    },
  });

  // Get latest corporation tax filing or use default values
  const filingData = Array.isArray(filing) && filing.length > 0 
    ? filing.find(f => f.type === "corporation_tax") 
    : null;

  return (
    <FilingTemplate
      title="Corporation Tax (CT600)"
      description="Company tax return preparation and filing with HMRC"
      icon={<Calculator className="h-8 w-8 text-primary" />}
      status={filingData?.status || "not_started"}
      progress={filingData?.progress || 0}
      dueDate={filingData?.dueDate}
      documents={filingData?.documentIds ? [
        { name: "CT600 Form" },
        { name: "Tax Computation" },
        { name: "iXBRL Accounts" }
      ] : []}
      wizardRoute="/wizards/ct600"
    >
      <div className="space-y-6">
        <Alert>
          <Check className="h-4 w-4" />
          <AlertTitle>Important Information</AlertTitle>
          <AlertDescription>
            Your company must file a Corporation Tax Return (CT600) with HMRC within 12 months 
            of your accounting period end date. You must pay your Corporation Tax 9 months and 
            1 day after the end of your accounting period. The CT600 must be accompanied by 
            accounts in iXBRL format and a tax computation.
          </AlertDescription>
        </Alert>
        
        <div className="bg-muted p-4 rounded-md">
          <h3 className="font-medium mb-2">Filing Costs</h3>
          <div className="flex items-center justify-between">
            <span>HMRC Fee:</span>
            <span className="font-medium">£0.00 (Free online filing)</span>
          </div>
          <div className="flex items-center justify-between mt-1">
            <span>PromptSubmissions Service:</span>
            <span className="font-medium">30 credits</span>
          </div>
        </div>
        
        {filingData ? (
          <div className="space-y-3">
            <h3 className="font-medium">Filing Information</h3>
            <p className="text-sm text-muted-foreground">Last updated: {new Date(filingData.updatedAt).toLocaleDateString()}</p>
            <p className="text-sm">Accounting period: {filingData.data?.periodStart || "Not specified"} to {filingData.data?.periodEnd || "Not specified"}</p>
            {filingData.data?.taxDue && (
              <p className="text-sm font-medium">Estimated tax due: £{filingData.data.taxDue}</p>
            )}
          </div>
        ) : (
          <div className="text-center py-4 text-muted-foreground">
            <p>No corporation tax filing in progress</p>
          </div>
        )}
      </div>
    </FilingTemplate>
  );
};

export default CorporationTax;
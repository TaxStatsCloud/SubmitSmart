import { Check, FileSpreadsheet } from "lucide-react";
import FilingTemplate from "@/components/filings/FilingTemplate";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAuth } from "@/hooks/use-auth";
import { FILING_COSTS } from "@shared/filingCosts";

const AnnualAccounts = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  
  const { data: filing, isLoading } = useQuery({
    queryKey: ['/api/filings', 'annual_accounts'],
    enabled: !!user?.uid,
  });

  // Get latest annual accounts filing or use default values
  const filingData = Array.isArray(filing) && filing.length > 0 
    ? filing.find(f => f.type === "annual_accounts") 
    : null;

  return (
    <FilingTemplate
      title="Annual Accounts"
      description="Preparation and filing of your company's annual financial statements"
      icon={<FileSpreadsheet className="h-8 w-8 text-primary" />}
      status={filingData?.status || "not_started"}
      progress={filingData?.progress || 0}
      dueDate={filingData?.dueDate}
      wizardRoute="/wizards/annual-accounts"
      documents={filingData?.documentIds ? [
        { name: "Balance Sheet" },
        { name: "Profit & Loss" },
        { name: "Notes to Accounts" }
      ] : []}
    >
      <div className="space-y-6">
        <Alert>
          <Check className="h-4 w-4" />
          <AlertTitle>Important Information</AlertTitle>
          <AlertDescription>
            Annual accounts must include a balance sheet, profit & loss account, notes about the 
            accounts, and a directors' report. For small companies, you can file simplified accounts. 
            Most private limited companies must file their accounts within 9 months of their financial year end.
          </AlertDescription>
        </Alert>
        
        <div className="bg-muted p-4 rounded-md">
          <h3 className="font-medium mb-2">Filing Costs</h3>
          <div className="flex items-center justify-between">
            <span>Companies House Fee:</span>
            <span className="font-medium">£0.00 (Free online filing)</span>
          </div>
          <div className="flex items-center justify-between mt-1">
            <span>PromptSubmissions Service:</span>
            <span className="font-medium">{FILING_COSTS.ANNUAL_ACCOUNTS} credits</span>
          </div>
        </div>
        
        {filingData ? (
          <div className="space-y-3">
            <h3 className="font-medium">Filing Information</h3>
            <p className="text-sm text-muted-foreground">Last updated: {new Date(filingData.updatedAt).toLocaleDateString()}</p>
            <p className="text-sm">Financial year end: {filingData.data?.yearEnd || "Not specified"}</p>
          </div>
        ) : (
          <div className="text-center py-4 text-muted-foreground">
            <p>No annual accounts filing in progress</p>
          </div>
        )}
      </div>
    </FilingTemplate>
  );
};

export default AnnualAccounts;
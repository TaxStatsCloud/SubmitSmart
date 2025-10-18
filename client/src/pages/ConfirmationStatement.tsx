import { Check, FileCheck } from "lucide-react";
import FilingTemplate from "@/components/filings/FilingTemplate";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAuth } from "@/hooks/use-auth";
import { FILING_COSTS } from "@shared/filingCosts";

const ConfirmationStatement = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  
  const { data: filing, isLoading } = useQuery({
    queryKey: ['/api/filings', 'confirmation_statement'],
    enabled: !!user?.id,
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to load confirmation statement data",
        variant: "destructive",
      });
    },
  });

  // Get latest confirmation statement filing or use default values
  const filingData = Array.isArray(filing) && filing.length > 0 
    ? filing.find(f => f.type === "confirmation_statement") 
    : null;

  return (
    <FilingTemplate
      title="Confirmation Statement"
      description="Annual confirmation of company information for Companies House"
      icon={<FileCheck className="h-8 w-8 text-primary" />}
      status={filingData?.status || "not_started"}
      progress={filingData?.progress || 0}
      dueDate={filingData?.dueDate}
      documents={filingData?.documentIds ? [{ name: "Company Information Document" }] : []}
      wizardRoute="/wizards/confirmation-statement"
    >
      <div className="space-y-6">
        <Alert>
          <Check className="h-4 w-4" />
          <AlertTitle>Important Information</AlertTitle>
          <AlertDescription>
            A confirmation statement updates Companies House with information about your company's 
            registered office, directors, company secretary, share capital, shareholders and people 
            with significant control. You must file this at least once every 12 months.
          </AlertDescription>
        </Alert>
        
        <div className="bg-muted p-4 rounded-md">
          <h3 className="font-medium mb-2">Filing Costs</h3>
          <div className="flex items-center justify-between">
            <span>Companies House Fee:</span>
            <span className="font-medium">£34.00</span>
          </div>
          <div className="flex items-center justify-between mt-1">
            <span>PromptSubmissions Service:</span>
            <span className="font-medium">{FILING_COSTS.CONFIRMATION_STATEMENT} credits</span>
          </div>
        </div>
        
        {filingData ? (
          <div className="space-y-3">
            <h3 className="font-medium">Filing Information</h3>
            <p className="text-sm text-muted-foreground">Last updated: {new Date(filingData.updatedAt).toLocaleDateString()}</p>
          </div>
        ) : (
          <div className="text-center py-4 text-muted-foreground">
            <p>No confirmation statement filing in progress</p>
          </div>
        )}
      </div>
    </FilingTemplate>
  );
};

export default ConfirmationStatement;
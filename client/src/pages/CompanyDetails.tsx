import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { BadgeInfo, Building2, CalendarClock, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { formatDate } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

const CompanyDetails = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  
  const { data: company, isLoading } = useQuery({
    queryKey: ['/api/companies', user?.companyId],
    enabled: !!user?.companyId,
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to load company details",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="container py-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Company Details</h1>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Building2 className="h-6 w-6 mr-2" />
            {isLoading ? <Skeleton className="h-8 w-64" /> : company?.name || "Your Company"}
          </CardTitle>
          <CardDescription>Manage your company information</CardDescription>
        </CardHeader>
        
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Registration Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start space-x-2">
                    <BadgeInfo className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Registration Number</p>
                      <p className="text-sm">{company?.registrationNumber || "Not available"}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-2">
                    <CalendarClock className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Incorporation Date</p>
                      <p className="text-sm">{company?.incorporationDate ? formatDate(company.incorporationDate) : "Not available"}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Address Information</h3>
                <div className="flex items-start space-x-2">
                  <MapPin className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Registered Address</p>
                    <p className="text-sm">{company?.registeredAddress || "Not available"}</p>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Accounting Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium">Accounting Reference Date</p>
                    <p className="text-sm">{company?.accountingReference || "Not available"}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium">Company Status</p>
                    <p className="text-sm">{company?.status || "Active"}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CompanyDetails;
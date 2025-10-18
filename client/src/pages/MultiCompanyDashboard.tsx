import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertCompanySchema, type InsertCompany } from "@shared/schema";
import { useState } from "react";
import { Building2, Plus, Users, FileText, Calendar, Trash2, ExternalLink } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface UserCompany {
  id: number;
  userId: number;
  companyId: number;
  role: string;
  isActive: boolean;
  createdAt: string;
  company: {
    id: number;
    name: string;
    registrationNumber: string;
    registeredAddress: string;
    incorporationDate: string;
    accountingReference: string | null;
    status: string;
  };
}

export default function MultiCompanyDashboard() {
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [companyToDelete, setCompanyToDelete] = useState<number | null>(null);

  // Fetch user's companies
  const { data: userCompanies, isLoading } = useQuery<UserCompany[]>({
    queryKey: ['/api/user/companies'],
  });

  // Create company mutation
  const createCompanyMutation = useMutation({
    mutationFn: async (data: InsertCompany) => {
      const response = await fetch('/api/user/companies', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create company');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user/companies'] });
      setIsAddDialogOpen(false);
      form.reset();
      toast({
        title: "Company added",
        description: "Your company has been added successfully.",
      });
    },
    onError: (error: any) => {
      const errorMessage = error.message || "Failed to add company";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  // Delete company mutation
  const deleteCompanyMutation = useMutation({
    mutationFn: async (companyId: number) => {
      const response = await fetch(`/api/user/companies/${companyId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete company');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user/companies'] });
      setCompanyToDelete(null);
      toast({
        title: "Company removed",
        description: "The company has been removed from your account.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to remove company",
        variant: "destructive",
      });
    },
  });

  const form = useForm<InsertCompany>({
    resolver: zodResolver(insertCompanySchema),
    defaultValues: {
      name: "",
      registrationNumber: "",
      registeredAddress: "",
      incorporationDate: new Date(),
      accountingReference: "",
      status: "active",
    },
  });

  const onSubmit = (data: InsertCompany) => {
    createCompanyMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    );
  }

  const companies = userCompanies || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Companies</h1>
          <p className="text-muted-foreground mt-1">
            Manage multiple companies from one account
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-company">
              <Plus className="mr-2 h-4 w-4" />
              Add Company
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Company</DialogTitle>
              <DialogDescription>
                Add a new company to your account. Make sure you have permission to manage this company's filings.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Acme Ltd" data-testid="input-company-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="registrationNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Registration Number</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="12345678" data-testid="input-registration-number" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="registeredAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Registered Address</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="123 High Street, London, UK" data-testid="input-registered-address" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="incorporationDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Incorporation Date</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                          value={field.value instanceof Date ? field.value.toISOString().split('T')[0] : ''}
                          onChange={(e) => field.onChange(new Date(e.target.value))}
                          data-testid="input-incorporation-date"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="accountingReference"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Accounting Reference (Optional)</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ''} placeholder="31/12" data-testid="input-accounting-reference" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)} data-testid="button-cancel">
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createCompanyMutation.isPending} data-testid="button-submit-company">
                    {createCompanyMutation.isPending ? "Adding..." : "Add Company"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Companies</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-companies">{companies.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {companies.filter(c => c.company.status === 'active').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">As Owner</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {companies.filter(c => c.role === 'owner').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">As Accountant</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {companies.filter(c => c.role === 'accountant').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Company Cards */}
      {companies.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No companies yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Add your first company to start managing filings
            </p>
            <Button onClick={() => setIsAddDialogOpen(true)} data-testid="button-add-first-company">
              <Plus className="mr-2 h-4 w-4" />
              Add Your First Company
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {companies.map((userCompany) => (
            <Card key={userCompany.id} className="hover:shadow-lg transition-shadow" data-testid={`card-company-${userCompany.companyId}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="h-5 w-5" />
                      {userCompany.company.name}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {userCompany.company.registrationNumber}
                    </CardDescription>
                  </div>
                  <Badge variant={userCompany.company.status === 'active' ? 'default' : 'secondary'}>
                    {userCompany.company.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>Role: <span className="text-foreground font-medium">{userCompany.role}</span></span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>Incorporated: <span className="text-foreground">
                      {new Date(userCompany.company.incorporationDate).toLocaleDateString('en-GB')}
                    </span></span>
                  </div>
                  {userCompany.company.accountingReference && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <FileText className="h-4 w-4" />
                      <span>Year End: <span className="text-foreground">{userCompany.company.accountingReference}</span></span>
                    </div>
                  )}
                </div>
                
                <div className="pt-3 border-t flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1" data-testid={`button-view-company-${userCompany.companyId}`}>
                    <ExternalLink className="mr-2 h-4 w-4" />
                    View Dashboard
                  </Button>
                  {userCompany.role === 'owner' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setCompanyToDelete(userCompany.companyId)}
                      data-testid={`button-delete-company-${userCompany.companyId}`}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={companyToDelete !== null} onOpenChange={(open) => !open && setCompanyToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Company?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the company from your account. You can always add it back later if needed.
              This does not delete the company or its filings.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => companyToDelete && deleteCompanyMutation.mutate(companyToDelete)}
              className="bg-destructive hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              Remove Company
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

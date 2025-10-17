import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { CreditCard, DollarSign, Package, TrendingUp, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatDate } from "@/lib/utils";

const SubscriptionManagement = () => {
  const [typeFilter, setTypeFilter] = useState<string>("all");
  
  const { data: transactions, isLoading: isLoadingTransactions } = useQuery<any[]>({
    queryKey: ['/api/admin/transactions', typeFilter !== "all" ? typeFilter : undefined],
  });

  const { data: stats, isLoading: isLoadingStats } = useQuery<any>({
    queryKey: ['/api/admin/transactions/stats'],
  });

  const { data: packages, isLoading: isLoadingPackages } = useQuery<any[]>({
    queryKey: ['/api/admin/packages'],
  });

  const filteredTransactions = transactions?.filter((t: any) =>
    typeFilter === "all" || t.type === typeFilter
  );

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Subscription & Order Management</h1>
          <p className="text-muted-foreground mt-1">Monitor credit purchases and usage</p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold">
                  {isLoadingStats ? (
                    <Skeleton className="h-8 w-24" />
                  ) : (
                    `£${(stats?.totalRevenue || 0).toFixed(2)}`
                  )}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Total Orders</p>
                <p className="text-2xl font-bold">
                  {isLoadingStats ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    stats?.totalTransactions || 0
                  )}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Package className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Credits Issued</p>
                <p className="text-2xl font-bold">
                  {isLoadingStats ? (
                    <Skeleton className="h-8 w-20" />
                  ) : (
                    (stats?.totalCreditsIssued || 0).toLocaleString()
                  )}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                <ArrowUpRight className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Credits Used</p>
                <p className="text-2xl font-bold">
                  {isLoadingStats ? (
                    <Skeleton className="h-8 w-20" />
                  ) : (
                    (stats?.totalCreditsUsed || 0).toLocaleString()
                  )}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                <ArrowDownRight className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Credit Packages */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Credit Packages</CardTitle>
          <CardDescription>Available credit packages for purchase</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingPackages ? (
            <div className="space-y-2">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {packages?.map((pkg: any) => (
                <Card key={pkg.id}>
                  <CardContent className="pt-6">
                    <div className="space-y-2">
                      <h3 className="font-semibold text-lg" data-testid={`text-package-${pkg.id}`}>{pkg.name}</h3>
                      <p className="text-2xl font-bold text-primary">£{pkg.price.toFixed(2)}</p>
                      <p className="text-sm text-muted-foreground">{pkg.credits} credits</p>
                      <Badge variant={pkg.isActive ? "default" : "outline"}>
                        {pkg.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center">
                <CreditCard className="h-5 w-5 mr-2" />
                All Transactions
              </CardTitle>
              <CardDescription>View all credit purchases and usage</CardDescription>
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px]" data-testid="select-filter-type">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Transactions</SelectItem>
                <SelectItem value="purchase">Purchases</SelectItem>
                <SelectItem value="deduction">Deductions</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent>
          {isLoadingTransactions ? (
            <div className="space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>User ID</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Credits</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions && filteredTransactions.length > 0 ? (
                  filteredTransactions.map((transaction: any) => (
                    <TableRow key={transaction.id}>
                      <TableCell data-testid={`text-date-${transaction.id}`}>
                        {formatDate(new Date(transaction.createdAt))}
                      </TableCell>
                      <TableCell data-testid={`text-user-${transaction.id}`}>
                        {transaction.userId}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={transaction.type === "purchase" ? "default" : "outline"}
                          data-testid={`badge-type-${transaction.id}`}
                        >
                          {transaction.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span 
                          className={transaction.credits > 0 ? "text-green-600" : "text-red-600"}
                          data-testid={`text-credits-${transaction.id}`}
                        >
                          {transaction.credits > 0 ? "+" : ""}{transaction.credits}
                        </span>
                      </TableCell>
                      <TableCell data-testid={`text-amount-${transaction.id}`}>
                        {transaction.amount ? `£${transaction.amount.toFixed(2)}` : "-"}
                      </TableCell>
                      <TableCell className="text-muted-foreground" data-testid={`text-description-${transaction.id}`}>
                        {transaction.description || "-"}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No transactions found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SubscriptionManagement;

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BadgePlus, BadgeMinus, Zap } from 'lucide-react';

// Transaction type
type Transaction = {
  id: number;
  userId: number;
  type: 'purchase' | 'usage' | 'refund' | 'adjustment';
  amount: number;
  balance: number;
  description: string;
  createdAt: string;
  filingId: number | null;
  packageId: number | null;
  stripePaymentId: string | null;
  metadata: any;
};

const CreditTransactions = () => {
  const [activeTab, setActiveTab] = useState('all');

  // Fetch transactions
  const { data: transactions, isLoading } = useQuery({
    queryKey: ['/api/billing/transactions'],
    enabled: true,
  });

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Filter transactions based on tab
  const filteredTransactions = transactions ? 
    transactions.filter((t: Transaction) => {
      if (activeTab === 'all') return true;
      if (activeTab === 'purchases') return t.type === 'purchase';
      if (activeTab === 'usage') return t.type === 'usage';
      return true;
    }) : [];

  return (
    <div className="container max-w-6xl py-8">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-2xl">Credit Transactions</CardTitle>
              <CardDescription>
                View your credit purchase and usage history
              </CardDescription>
            </div>
            <div className="flex items-center">
              <Zap className="h-5 w-5 text-yellow-500 mr-2" />
              <span className="text-lg font-medium">Balance: {transactions && transactions.length > 0 ? transactions[0].balance : 0} credits</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="all">All Transactions</TabsTrigger>
              <TabsTrigger value="purchases">Purchases</TabsTrigger>
              <TabsTrigger value="usage">Usage</TabsTrigger>
            </TabsList>
            <TabsContent value={activeTab}>
              {isLoading ? (
                <div className="h-60 flex items-center justify-center">
                  <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
                </div>
              ) : filteredTransactions.length === 0 ? (
                <div className="h-60 flex flex-col items-center justify-center text-muted-foreground">
                  <p className="mb-4">No transactions found</p>
                  <Button variant="outline" asChild>
                    <a href="/credits">Purchase Credits</a>
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[180px]">Date</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead className="text-right">Balance</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTransactions.map((transaction: Transaction) => (
                        <TableRow key={transaction.id}>
                          <TableCell className="font-medium">
                            {formatDate(transaction.createdAt)}
                          </TableCell>
                          <TableCell>{transaction.description}</TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              {transaction.type === 'purchase' ? (
                                <BadgePlus className="h-4 w-4 mr-1 text-green-500" />
                              ) : (
                                <BadgeMinus className="h-4 w-4 mr-1 text-amber-500" />
                              )}
                              {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                            </div>
                          </TableCell>
                          <TableCell className={`text-right ${transaction.amount > 0 ? 'text-green-600' : 'text-amber-600'}`}>
                            {transaction.amount > 0 ? '+' : ''}{transaction.amount}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {transaction.balance}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreditTransactions;
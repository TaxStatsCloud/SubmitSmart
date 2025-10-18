import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, TrendingDown, Coins } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

interface CreditTransaction {
  id: number;
  userId: number;
  amount: number;
  type: string;
  description: string;
  createdAt: string;
}

const CreditUsageChart = () => {
  const { data: user } = useQuery<{ credits: number }>({ queryKey: ['/api/user'] });
  const { data: transactions, isLoading } = useQuery<CreditTransaction[]>({ 
    queryKey: ['/api/billing/transactions'] 
  });

  if (isLoading || !user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Credit Usage</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[250px] flex items-center justify-center text-neutral-500">
            <p>Loading credit usage data...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentBalance = user.credits || 0;
  const isLowBalance = currentBalance < 100;
  const isCriticalBalance = currentBalance < 50;

  // Process transactions for chart (last 30 days)
  const chartData = (() => {
    if (!transactions || transactions.length === 0) {
      return [];
    }

    // Sort transactions by date
    const sortedTransactions = [...transactions].sort((a, b) => 
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    // Calculate running balance
    let runningBalance = currentBalance;
    const dataPoints: { date: string; balance: number; label: string }[] = [];

    // Work backwards from current balance
    for (let i = sortedTransactions.length - 1; i >= 0; i--) {
      const transaction = sortedTransactions[i];
      const date = new Date(transaction.createdAt);
      
      // Skip if older than 30 days
      const daysAgo = (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24);
      if (daysAgo > 30) break;

      // Reverse the transaction to get previous balance
      const previousBalance = runningBalance - transaction.amount;
      
      dataPoints.unshift({
        date: date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
        balance: Math.max(0, previousBalance),
        label: transaction.description,
      });

      runningBalance = previousBalance;
    }

    // Add current balance at the end
    dataPoints.push({
      date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
      balance: currentBalance,
      label: 'Current Balance',
    });

    return dataPoints;
  })();

  // Calculate usage statistics
  const usageStats = (() => {
    if (!transactions || transactions.length === 0) {
      return { totalSpent: 0, totalPurchased: 0, averagePerFiling: 0 };
    }

    const last30Days = transactions.filter(t => {
      const daysAgo = (Date.now() - new Date(t.createdAt).getTime()) / (1000 * 60 * 60 * 24);
      return daysAgo <= 30;
    });

    const totalSpent = last30Days
      .filter(t => t.type === 'filing_deduction' || t.type === 'usage')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const totalPurchased = last30Days
      .filter(t => t.type === 'purchase' || t.type === 'credit')
      .reduce((sum, t) => sum + t.amount, 0);

    const filingTransactions = last30Days.filter(t => t.type === 'filing_deduction');
    const averagePerFiling = filingTransactions.length > 0 
      ? totalSpent / filingTransactions.length 
      : 0;

    return { totalSpent, totalPurchased, averagePerFiling };
  })();

  return (
    <div className="space-y-4">
      {/* Low Balance Warning */}
      {isCriticalBalance && (
        <Card className="border-red-200 bg-red-50" data-testid="critical-balance-warning">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="bg-red-100 p-2 rounded-full">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-red-900">Critical: Low Credit Balance</h3>
                <p className="text-sm text-red-700 mt-1">
                  You have only {currentBalance} credits remaining. Purchase more credits to continue filing.
                </p>
                <Button 
                  size="sm" 
                  className="mt-3 bg-red-600 hover:bg-red-700"
                  asChild
                  data-testid="buy-credits-critical"
                >
                  <Link href="/credits">Buy Credits Now</Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {isLowBalance && !isCriticalBalance && (
        <Card className="border-amber-200 bg-amber-50" data-testid="low-balance-warning">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="bg-amber-100 p-2 rounded-full">
                <TrendingDown className="h-5 w-5 text-amber-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-amber-900">Low Credit Balance</h3>
                <p className="text-sm text-amber-700 mt-1">
                  You have {currentBalance} credits remaining. Consider purchasing more to avoid interruptions.
                </p>
                <Button 
                  size="sm" 
                  variant="outline"
                  className="mt-3 border-amber-600 text-amber-700 hover:bg-amber-100"
                  asChild
                  data-testid="buy-credits-warning"
                >
                  <Link href="/credits">Buy Credits</Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Credit Usage Chart */}
      <Card data-testid="credit-usage-chart">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Credit Usage Trend</CardTitle>
            <div className="flex items-center gap-2 text-sm">
              <Coins className="h-4 w-4 text-blue-600" />
              <span className="font-semibold text-neutral-900">{currentBalance} credits</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {chartData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }}
                    stroke="#94a3b8"
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    stroke="#94a3b8"
                  />
                  <Tooltip 
                    formatter={(value: number) => [`${value} credits`, 'Balance']}
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="balance" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    fill="url(#colorBalance)" 
                  />
                </AreaChart>
              </ResponsiveContainer>

              {/* Usage Statistics */}
              <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-neutral-200">
                <div>
                  <p className="text-xs text-neutral-500 mb-1">Spent (30 days)</p>
                  <p className="text-lg font-semibold text-neutral-900" data-testid="credits-spent">
                    {usageStats.totalSpent}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-neutral-500 mb-1">Purchased (30 days)</p>
                  <p className="text-lg font-semibold text-green-600" data-testid="credits-purchased">
                    +{usageStats.totalPurchased}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-neutral-500 mb-1">Avg per Filing</p>
                  <p className="text-lg font-semibold text-neutral-900" data-testid="credits-avg-filing">
                    {usageStats.averagePerFiling > 0 ? Math.round(usageStats.averagePerFiling) : 0}
                  </p>
                </div>
              </div>
            </>
          ) : (
            <div className="h-[250px] flex flex-col items-center justify-center text-neutral-500">
              <Coins className="h-12 w-12 text-neutral-300 mb-3" />
              <p>No credit transactions yet</p>
              <p className="text-sm mt-1">Your credit usage history will appear here</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CreditUsageChart;

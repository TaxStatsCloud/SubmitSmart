import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { TrendingUp, TrendingDown, AlertTriangle } from "lucide-react";

interface ComparisonRow {
  label: string;
  current: number;
  prior: number;
  boxNumber?: string;
}

interface PriorYearComparisonTableProps {
  rows: ComparisonRow[];
  title: string;
  showAlerts?: boolean;
  alertThreshold?: number; // Percentage change to trigger alert
}

export function PriorYearComparisonTable({ 
  rows, 
  title, 
  showAlerts = true,
  alertThreshold = 30 
}: PriorYearComparisonTableProps) {
  
  const calculateChange = (current: number, prior: number) => {
    if (prior === 0) return current > 0 ? 100 : 0;
    return ((current - prior) / prior) * 100;
  };

  const getChangeColor = (change: number) => {
    const absChange = Math.abs(change);
    if (absChange > alertThreshold) return "text-amber-600 dark:text-amber-400";
    if (change > 0) return "text-green-600 dark:text-green-400";
    if (change < 0) return "text-red-600 dark:text-red-400";
    return "text-muted-foreground";
  };

  const significantChanges = rows.filter(row => {
    const change = calculateChange(row.current, row.prior);
    return Math.abs(change) > alertThreshold;
  });

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground">
          Compare current period figures with prior year for consistency
        </p>
      </div>

      {showAlerts && significantChanges.length > 0 && (
        <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-900 dark:text-amber-100">
            <strong>Significant changes detected:</strong> {significantChanges.length} figure(s) have changed by more than {alertThreshold}% from prior year. HMRC may request explanations for large variations.
          </AlertDescription>
        </Alert>
      )}

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-[40%]">Item</TableHead>
              <TableHead className="text-right">Prior Year (£)</TableHead>
              <TableHead className="text-right">Current Year (£)</TableHead>
              <TableHead className="text-right">Change</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, index) => {
              const change = calculateChange(row.current, row.prior);
              const isSignificant = Math.abs(change) > alertThreshold;
              
              return (
                <TableRow key={index} className={isSignificant ? "bg-amber-50/50 dark:bg-amber-950/20" : ""}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {row.label}
                      {row.boxNumber && (
                        <Badge variant="outline" className="text-xs">
                          Box {row.boxNumber}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    £{row.prior.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    £{row.current.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className={`flex items-center justify-end gap-1 ${getChangeColor(change)}`}>
                      {change > 0 ? (
                        <TrendingUp className="h-4 w-4" />
                      ) : change < 0 ? (
                        <TrendingDown className="h-4 w-4" />
                      ) : null}
                      <span className="font-medium">
                        {change > 0 ? "+" : ""}{change.toFixed(1)}%
                      </span>
                      {isSignificant && (
                        <AlertTriangle className="h-4 w-4 text-amber-600 ml-1" />
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <div className="text-xs text-muted-foreground space-y-1">
        <p>• Changes over {alertThreshold}% are highlighted for review</p>
        <p>• HMRC may query significant variations - ensure you can explain them</p>
        <p>• Common reasons: business growth, one-off transactions, changes in accounting policy</p>
      </div>
    </div>
  );
}

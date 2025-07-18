import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calculator, TrendingUp, Eye, FileText } from "lucide-react";
import DrillDownModal from "./DrillDownModal";
import ValidationPanel from "./ValidationPanel";

interface FinancialLine {
  label: string;
  amount: number;
  isSubtotal?: boolean;
  isTotal?: boolean;
  indent?: number;
  accountCodes?: string[];
}

interface FinancialStatementProps {
  title: string;
  data: FinancialLine[];
  companyId: number;
  periodEnd: string;
  statementType: 'balance-sheet' | 'profit-loss';
  showValidation?: boolean;
}

export default function FinancialStatementWithDrillDown({
  title,
  data,
  companyId,
  periodEnd,
  statementType,
  showValidation = true
}: FinancialStatementProps) {
  const [selectedLineItem, setSelectedLineItem] = useState<string | null>(null);
  const [drillDownOpen, setDrillDownOpen] = useState(false);

  const formatCurrency = (amount: number) => {
    const absAmount = Math.abs(amount);
    const formatted = new Intl.NumberFormat('en-GB', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(absAmount);
    
    if (amount < 0) {
      return `(${formatted})`;
    }
    return formatted;
  };

  const handleDrillDown = (lineItem: string) => {
    setSelectedLineItem(lineItem);
    setDrillDownOpen(true);
  };

  const getLineItemStyle = (line: FinancialLine) => {
    let baseClasses = "group hover:bg-blue-50 transition-colors cursor-pointer rounded px-2 py-1";
    
    if (line.isTotal) {
      baseClasses += " border-t-2 border-black font-bold text-lg";
    } else if (line.isSubtotal) {
      baseClasses += " border-t border-gray-400 font-semibold";
    }
    
    return baseClasses;
  };

  const getIndentStyle = (indent: number = 0) => {
    return { paddingLeft: `${indent * 1.5}rem` };
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-gray-50">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FileText className="h-6 w-6" />
              <span>{title}</span>
            </div>
            <Badge variant="secondary" className="bg-white/20 text-white">
              Period Ending: {new Date(periodEnd).toLocaleDateString('en-GB')}
            </Badge>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="p-6">
          <div className="space-y-1">
            {data.map((line, index) => (
              <div
                key={index}
                className={getLineItemStyle(line)}
                style={getIndentStyle(line.indent)}
                onClick={() => handleDrillDown(line.label)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className={line.isTotal ? "text-lg" : line.isSubtotal ? "font-medium" : ""}>
                      {line.label}
                    </span>
                    {line.accountCodes && line.accountCodes.length > 0 && (
                      <div className="flex space-x-1">
                        {line.accountCodes.map((code) => (
                          <Badge key={code} variant="outline" className="text-xs">
                            {code}
                          </Badge>
                        ))}
                      </div>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDrillDown(line.label);
                      }}
                    >
                      <Calculator className="h-4 w-4 mr-1" />
                      Drill Down
                    </Button>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`font-mono ${line.isTotal ? "text-lg font-bold" : line.isSubtotal ? "font-semibold" : ""}`}>
                      £{formatCurrency(line.amount)}
                    </span>
                    <Eye className="h-4 w-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center space-x-2 text-blue-800">
              <TrendingUp className="h-5 w-5" />
              <span className="font-medium">Interactive Statement</span>
            </div>
            <p className="text-sm text-blue-700 mt-1">
              Click any line item to view detailed breakdown, source documents, and calculation methods.
              Each figure is fully traceable to supporting documentation.
            </p>
          </div>
        </CardContent>
      </Card>

      {showValidation && (
        <ValidationPanel
          type="financial-statements"
          dataId={companyId}
          data={{
            [statementType]: {
              title,
              data,
              periodEnd
            }
          }}
        />
      )}

      <DrillDownModal
        isOpen={drillDownOpen}
        onOpenChange={setDrillDownOpen}
        lineItem={selectedLineItem || ""}
        statementType={statementType}
        companyId={companyId}
        periodEnd={periodEnd}
      />
    </div>
  );
}
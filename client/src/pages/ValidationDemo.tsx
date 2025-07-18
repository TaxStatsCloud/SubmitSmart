import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Shield, 
  Calculator, 
  FileText, 
  CheckCircle2, 
  AlertTriangle,
  TrendingUp,
  BarChart3,
  Eye
} from "lucide-react";
import FinancialStatementWithDrillDown from "@/components/FinancialStatementWithDrillDown";
import ValidationPanel from "@/components/ValidationPanel";

export default function ValidationDemo() {
  const [selectedCompany, setSelectedCompany] = useState(1);

  // Sample Balance Sheet Data
  const balanceSheetData = [
    { 
      label: "FIXED ASSETS", 
      amount: 0, 
      isSubtotal: true,
      accountCodes: []
    },
    { 
      label: "Tangible assets", 
      amount: 35000, 
      indent: 1,
      accountCodes: ["1100", "1150"]
    },
    { 
      label: "Intangible assets", 
      amount: 5000, 
      indent: 1,
      accountCodes: ["1000"]
    },
    { 
      label: "Total Fixed Assets", 
      amount: 40000, 
      isSubtotal: true,
      accountCodes: []
    },
    { 
      label: "CURRENT ASSETS", 
      amount: 0, 
      isSubtotal: true,
      accountCodes: []
    },
    { 
      label: "Stock", 
      amount: 15000, 
      indent: 1,
      accountCodes: ["1200"]
    },
    { 
      label: "Debtors", 
      amount: 25000, 
      indent: 1,
      accountCodes: ["1300"]
    },
    { 
      label: "Cash at bank and in hand", 
      amount: 40800, 
      indent: 1,
      accountCodes: ["1400", "1401", "1402"]
    },
    { 
      label: "Total Current Assets", 
      amount: 80800, 
      isSubtotal: true,
      accountCodes: []
    },
    { 
      label: "CREDITORS: amounts falling due within one year", 
      amount: -45000, 
      isSubtotal: true,
      accountCodes: ["2000", "2001", "2002"]
    },
    { 
      label: "NET CURRENT ASSETS", 
      amount: 35800, 
      isSubtotal: true,
      accountCodes: []
    },
    { 
      label: "TOTAL ASSETS LESS CURRENT LIABILITIES", 
      amount: 75800, 
      isSubtotal: true,
      accountCodes: []
    },
    { 
      label: "CREDITORS: amounts falling due after more than one year", 
      amount: -15000, 
      isSubtotal: true,
      accountCodes: ["2100"]
    },
    { 
      label: "NET ASSETS", 
      amount: 60800, 
      isTotal: true,
      accountCodes: []
    },
    { 
      label: "CAPITAL AND RESERVES", 
      amount: 0, 
      isSubtotal: true,
      accountCodes: []
    },
    { 
      label: "Called up share capital", 
      amount: 1000, 
      indent: 1,
      accountCodes: ["3000"]
    },
    { 
      label: "Profit and loss account", 
      amount: 59800, 
      indent: 1,
      accountCodes: ["3300"]
    },
    { 
      label: "SHAREHOLDERS' FUNDS", 
      amount: 60800, 
      isTotal: true,
      accountCodes: []
    }
  ];

  // Sample P&L Data
  const profitLossData = [
    { 
      label: "TURNOVER", 
      amount: 332500, 
      isSubtotal: true,
      accountCodes: ["4000", "4001"]
    },
    { 
      label: "Cost of sales", 
      amount: -165000, 
      accountCodes: ["5000"]
    },
    { 
      label: "GROSS PROFIT", 
      amount: 167500, 
      isSubtotal: true,
      accountCodes: []
    },
    { 
      label: "Administrative expenses", 
      amount: -85000, 
      accountCodes: ["6000", "6001", "6002"]
    },
    { 
      label: "Distribution costs", 
      amount: -25000, 
      accountCodes: ["7000"]
    },
    { 
      label: "OPERATING PROFIT", 
      amount: 57500, 
      isSubtotal: true,
      accountCodes: []
    },
    { 
      label: "Interest receivable", 
      amount: 500, 
      accountCodes: ["4200"]
    },
    { 
      label: "Interest payable", 
      amount: -2000, 
      accountCodes: ["8000"]
    },
    { 
      label: "PROFIT BEFORE TAXATION", 
      amount: 56000, 
      isSubtotal: true,
      accountCodes: []
    },
    { 
      label: "Tax on profit", 
      amount: -10640, 
      accountCodes: ["8100"]
    },
    { 
      label: "PROFIT FOR THE FINANCIAL YEAR", 
      amount: 45360, 
      isTotal: true,
      accountCodes: []
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8 space-y-8">
        
        {/* Header Section */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center space-x-3">
            <Shield className="h-10 w-10 text-blue-600" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Validation Agents & Drill-Down Demo
            </h1>
          </div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Professional-grade accuracy validation and complete transparency through detailed drill-down analysis.
            Built for accountants and auditors who demand precision.
          </p>
        </div>

        {/* Features Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100">
            <CardContent className="p-6 text-center">
              <Shield className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-blue-900 mb-2">AI Validation Agents</h3>
              <p className="text-blue-700 text-sm">
                Mathematical accuracy, UK GAAP compliance, and regulatory validation with detailed audit trails
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100">
            <CardContent className="p-6 text-center">
              <Calculator className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-green-900 mb-2">Complete Drill-Down</h3>
              <p className="text-green-700 text-sm">
                Every figure traceable to source documents with calculation methods and reconciliation data
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100">
            <CardContent className="p-6 text-center">
              <FileText className="h-12 w-12 text-purple-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-purple-900 mb-2">Audit Trail</h3>
              <p className="text-purple-700 text-sm">
                Complete documentation of all changes, validations, and calculations for auditor review
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Interactive Demo */}
        <Tabs defaultValue="balance-sheet" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="balance-sheet" className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4" />
              <span>Balance Sheet</span>
            </TabsTrigger>
            <TabsTrigger value="profit-loss" className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4" />
              <span>Profit & Loss</span>
            </TabsTrigger>
            <TabsTrigger value="validation" className="flex items-center space-x-2">
              <Shield className="h-4 w-4" />
              <span>Validation</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="balance-sheet">
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-lg border-2 border-blue-200">
                <div className="flex items-center space-x-2 mb-4">
                  <Eye className="h-5 w-5 text-blue-600" />
                  <span className="font-medium text-blue-900">Interactive Balance Sheet</span>
                  <Badge variant="outline" className="ml-auto">Click any line for drill-down</Badge>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Click on any line item to see detailed breakdown, source documents, and calculation methodology.
                </p>
              </div>
              
              <FinancialStatementWithDrillDown
                title="Balance Sheet"
                data={balanceSheetData}
                companyId={selectedCompany}
                periodEnd="2024-12-31"
                statementType="balance-sheet"
                showValidation={false}
              />
            </div>
          </TabsContent>

          <TabsContent value="profit-loss">
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-lg border-2 border-green-200">
                <div className="flex items-center space-x-2 mb-4">
                  <Eye className="h-5 w-5 text-green-600" />
                  <span className="font-medium text-green-900">Interactive Profit & Loss Statement</span>
                  <Badge variant="outline" className="ml-auto">Full transparency</Badge>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Every figure is fully traceable with comprehensive audit trails and source document references.
                </p>
              </div>
              
              <FinancialStatementWithDrillDown
                title="Profit and Loss Account"
                data={profitLossData}
                companyId={selectedCompany}
                periodEnd="2024-12-31"
                statementType="profit-loss"
                showValidation={false}
              />
            </div>
          </TabsContent>

          <TabsContent value="validation">
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-lg border-2 border-purple-200">
                <div className="flex items-center space-x-2 mb-4">
                  <Shield className="h-5 w-5 text-purple-600" />
                  <span className="font-medium text-purple-900">AI Validation Agents</span>
                  <Badge variant="outline" className="ml-auto">Professional grade</Badge>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Comprehensive validation including mathematical accuracy, UK GAAP compliance, and regulatory requirements.
                </p>
              </div>

              <ValidationPanel
                type="trial-balance"
                dataId={selectedCompany}
                onValidationComplete={(result) => {
                  console.log('Validation completed:', result);
                }}
              />
            </div>
          </TabsContent>
        </Tabs>

        {/* Key Benefits */}
        <Card className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
          <CardHeader>
            <CardTitle className="text-center text-2xl font-bold">
              Built for Professional Accountants & Auditors
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="space-y-2">
                <CheckCircle2 className="h-8 w-8 mx-auto" />
                <h4 className="font-semibold">Mathematical Accuracy</h4>
                <p className="text-sm opacity-90">1p tolerance validation with automatic error detection</p>
              </div>
              <div className="space-y-2">
                <CheckCircle2 className="h-8 w-8 mx-auto" />
                <h4 className="font-semibold">UK GAAP Compliance</h4>
                <p className="text-sm opacity-90">FRS 102 validation with regulatory references</p>
              </div>
              <div className="space-y-2">
                <CheckCircle2 className="h-8 w-8 mx-auto" />
                <h4 className="font-semibold">Complete Traceability</h4>
                <p className="text-sm opacity-90">Every figure linked to source documents</p>
              </div>
              <div className="space-y-2">
                <CheckCircle2 className="h-8 w-8 mx-auto" />
                <h4 className="font-semibold">Audit Ready</h4>
                <p className="text-sm opacity-90">Comprehensive documentation and evidence trails</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
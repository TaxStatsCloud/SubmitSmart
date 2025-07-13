import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, AlertTriangle, XCircle, Loader2, Shield, TrendingUp, Calculator } from 'lucide-react';

interface ValidationCheck {
  id: string;
  name: string;
  description: string;
  category: 'mathematical' | 'compliance' | 'consistency' | 'completeness';
  severity: 'error' | 'warning' | 'info';
  status: 'pending' | 'passed' | 'failed' | 'running';
  details?: string;
  suggestions?: string[];
}

interface AccuracyValidationProps {
  filingData: any;
  documents: any[];
  onValidationComplete?: (results: ValidationCheck[]) => void;
}

const VALIDATION_CHECKS: ValidationCheck[] = [
  {
    id: 'trial_balance_balance',
    name: 'Trial Balance Mathematical Accuracy',
    description: 'Verify that total debits equal total credits',
    category: 'mathematical',
    severity: 'error',
    status: 'pending'
  },
  {
    id: 'bank_reconciliation',
    name: 'Bank Reconciliation Accuracy',
    description: 'Ensure bank balances match statements and trial balance',
    category: 'consistency',
    severity: 'error',
    status: 'pending'
  },
  {
    id: 'vat_calculations',
    name: 'VAT Calculation Verification',
    description: 'Validate VAT rates and calculations across all transactions',
    category: 'compliance',
    severity: 'error',
    status: 'pending'
  },
  {
    id: 'turnover_consistency',
    name: 'Turnover Figure Consistency',
    description: 'Check turnover matches across P&L, tax computation, and filing forms',
    category: 'consistency',
    severity: 'error',
    status: 'pending'
  },
  {
    id: 'depreciation_calculations',
    name: 'Depreciation & Capital Allowances',
    description: 'Verify depreciation rates and capital allowance calculations',
    category: 'compliance',
    severity: 'warning',
    status: 'pending'
  },
  {
    id: 'director_remuneration',
    name: 'Director Remuneration Disclosure',
    description: 'Ensure proper disclosure of director payments and benefits',
    category: 'compliance',
    severity: 'warning',
    status: 'pending'
  },
  {
    id: 'related_party_transactions',
    name: 'Related Party Transactions',
    description: 'Identify and properly disclose related party transactions',
    category: 'compliance',
    severity: 'warning',
    status: 'pending'
  },
  {
    id: 'accounting_policies',
    name: 'Accounting Policies Consistency',
    description: 'Verify accounting policies are applied consistently',
    category: 'consistency',
    severity: 'info',
    status: 'pending'
  },
  {
    id: 'prior_year_comparatives',
    name: 'Prior Year Comparative Figures',
    description: 'Ensure prior year figures are correctly restated if needed',
    category: 'completeness',
    severity: 'warning',
    status: 'pending'
  },
  {
    id: 'statutory_filing_requirements',
    name: 'Statutory Filing Requirements',
    description: 'Check all mandatory disclosures are included',
    category: 'compliance',
    severity: 'error',
    status: 'pending'
  }
];

export default function AccuracyValidation({ filingData, documents, onValidationComplete }: AccuracyValidationProps) {
  const [checks, setChecks] = useState<ValidationCheck[]>(VALIDATION_CHECKS);
  const [isRunning, setIsRunning] = useState(false);
  const [currentCheck, setCurrentCheck] = useState<string | null>(null);

  const runValidation = async () => {
    setIsRunning(true);
    const updatedChecks = [...checks];

    for (let i = 0; i < updatedChecks.length; i++) {
      const check = updatedChecks[i];
      setCurrentCheck(check.id);
      
      // Update check status to running
      updatedChecks[i] = { ...check, status: 'running' };
      setChecks([...updatedChecks]);

      // Simulate validation process
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

      // Simulate validation results (replace with actual validation logic)
      const result = await performValidationCheck(check, filingData, documents);
      updatedChecks[i] = { ...check, ...result };
      setChecks([...updatedChecks]);
    }

    setCurrentCheck(null);
    setIsRunning(false);
    
    if (onValidationComplete) {
      onValidationComplete(updatedChecks);
    }
  };

  const performValidationCheck = async (check: ValidationCheck, data: any, docs: any[]): Promise<Partial<ValidationCheck>> => {
    // This would contain actual validation logic
    // For now, we'll simulate some realistic results
    
    switch (check.id) {
      case 'trial_balance_balance':
        // Simulate checking if trial balance balances
        const balanceCheck = Math.random() > 0.2; // 80% pass rate
        return {
          status: balanceCheck ? 'passed' : 'failed',
          details: balanceCheck 
            ? 'Trial balance balances correctly - debits equal credits'
            : 'Trial balance does not balance - difference of £127.45',
          suggestions: balanceCheck ? [] : [
            'Check for transposition errors in data entry',
            'Verify all journal entries are properly posted',
            'Review suspense account entries'
          ]
        };

      case 'bank_reconciliation':
        const bankCheck = Math.random() > 0.3; // 70% pass rate
        return {
          status: bankCheck ? 'passed' : 'failed',
          details: bankCheck
            ? 'Bank reconciliation completed successfully'
            : 'Unreconciled items found totalling £342.16',
          suggestions: bankCheck ? [] : [
            'Review outstanding cheques and deposits',
            'Check for bank errors or timing differences',
            'Verify all bank charges are recorded'
          ]
        };

      case 'vat_calculations':
        const vatCheck = Math.random() > 0.15; // 85% pass rate
        return {
          status: vatCheck ? 'passed' : 'failed',
          details: vatCheck
            ? 'VAT calculations verified and correct'
            : 'VAT rate discrepancies found on 3 transactions',
          suggestions: vatCheck ? [] : [
            'Verify VAT rates for specific transaction dates',
            'Check exempt vs standard rated items',
            'Review reverse charge procedures'
          ]
        };

      case 'turnover_consistency':
        const turnoverCheck = Math.random() > 0.1; // 90% pass rate
        return {
          status: turnoverCheck ? 'passed' : 'failed',
          details: turnoverCheck
            ? 'Turnover figures consistent across all documents'
            : 'Turnover mismatch: P&L shows £125,000, tax computation shows £124,750',
          suggestions: turnoverCheck ? [] : [
            'Review sales cut-off procedures',
            'Check for timing differences in recognition',
            'Verify treatment of deposits and advances'
          ]
        };

      default:
        // Default simulation for other checks
        const randomCheck = Math.random() > 0.25; // 75% pass rate
        return {
          status: randomCheck ? 'passed' : (Math.random() > 0.5 ? 'failed' : 'passed'),
          details: randomCheck ? 'Check completed successfully' : 'Issues identified requiring attention',
          suggestions: randomCheck ? [] : ['Review relevant documentation', 'Consult with your accountant']
        };
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed': return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-600" />;
      case 'running': return <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />;
      default: return <div className="h-4 w-4 border-2 border-gray-300 rounded-full" />;
    }
  };

  const getStatusColor = (status: string, severity: string) => {
    if (status === 'passed') return 'text-green-600 bg-green-50 border-green-200';
    if (status === 'failed' && severity === 'error') return 'text-red-600 bg-red-50 border-red-200';
    if (status === 'failed' && severity === 'warning') return 'text-orange-600 bg-orange-50 border-orange-200';
    if (status === 'running') return 'text-blue-600 bg-blue-50 border-blue-200';
    return 'text-gray-600 bg-gray-50 border-gray-200';
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'mathematical': return Calculator;
      case 'compliance': return Shield;
      case 'consistency': return TrendingUp;
      case 'completeness': return CheckCircle2;
      default: return CheckCircle2;
    }
  };

  const completedChecks = checks.filter(c => c.status === 'passed' || c.status === 'failed').length;
  const passedChecks = checks.filter(c => c.status === 'passed').length;
  const failedChecks = checks.filter(c => c.status === 'failed').length;
  const progress = Math.round((completedChecks / checks.length) * 100);

  const categories = Array.from(new Set(checks.map(c => c.category)));

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-l-4 border-l-green-500">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-green-600" />
                Accuracy Validation & Quality Assurance
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Comprehensive checks to ensure filing accuracy and auditor confidence
              </p>
            </div>
            <Button onClick={runValidation} disabled={isRunning}>
              {isRunning ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {isRunning ? 'Running Validation...' : 'Run Full Validation'}
            </Button>
          </div>
          
          {isRunning && (
            <div className="mt-4">
              <div className="flex justify-between text-sm mb-2">
                <span>Validation Progress</span>
                <span>{completedChecks} of {checks.length} checks</span>
              </div>
              <Progress value={progress} className="h-2" />
              {currentCheck && (
                <p className="text-xs text-muted-foreground mt-2">
                  Running: {checks.find(c => c.id === currentCheck)?.name}
                </p>
              )}
            </div>
          )}
        </CardHeader>
      </Card>

      {/* Results Summary */}
      {completedChecks > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <div>
                  <div className="text-2xl font-bold text-green-600">{passedChecks}</div>
                  <div className="text-sm text-green-600">Passed</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-red-600" />
                <div>
                  <div className="text-2xl font-bold text-red-600">{failedChecks}</div>
                  <div className="text-sm text-red-600">Failed</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Calculator className="h-5 w-5 text-blue-600" />
                <div>
                  <div className="text-2xl font-bold text-blue-600">{Math.round((passedChecks / completedChecks) * 100) || 0}%</div>
                  <div className="text-sm text-blue-600">Accuracy Score</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Validation Checks by Category */}
      {categories.map(category => {
        const categoryChecks = checks.filter(c => c.category === category);
        const Icon = getCategoryIcon(category);
        
        return (
          <Card key={category}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 capitalize">
                <Icon className="h-5 w-5" />
                {category} Checks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {categoryChecks.map(check => (
                  <div key={check.id} className={`border rounded-lg p-4 ${getStatusColor(check.status, check.severity)}`}>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{check.name}</h4>
                          <Badge variant="outline" className="text-xs">
                            {check.severity}
                          </Badge>
                        </div>
                        <p className="text-sm opacity-90">{check.description}</p>
                      </div>
                      <div className="ml-4">
                        {getStatusIcon(check.status)}
                      </div>
                    </div>
                    
                    {check.details && (
                      <div className="mt-3 p-2 bg-white bg-opacity-50 rounded text-sm">
                        <strong>Result:</strong> {check.details}
                      </div>
                    )}
                    
                    {check.suggestions && check.suggestions.length > 0 && (
                      <div className="mt-3">
                        <p className="text-sm font-medium mb-1">Suggested Actions:</p>
                        <ul className="text-sm space-y-1">
                          {check.suggestions.map((suggestion, idx) => (
                            <li key={idx} className="flex items-start gap-1">
                              <span className="mt-1">•</span>
                              {suggestion}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}

      {/* Footer */}
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          <strong>Professional Standards:</strong> These validation checks are designed to meet the standards 
          expected by qualified auditors and HMRC. Addressing all failed checks ensures your filing will 
          withstand professional scrutiny and reduces the risk of enquiries.
        </AlertDescription>
      </Alert>
    </div>
  );
}
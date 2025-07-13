import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { HelpCircle, ChevronDown, ChevronRight, Lightbulb, AlertTriangle, CheckCircle2, FileText, Calculator, Shield } from 'lucide-react';

interface HelpItem {
  id: string;
  title: string;
  description: string;
  category: 'setup' | 'accuracy' | 'compliance' | 'best_practice';
  importance: 'critical' | 'high' | 'medium' | 'low';
  context: string[];
  content: {
    overview: string;
    steps: string[];
    tips: string[];
    warnings: string[];
    examples?: string[];
  };
}

interface ContextualHelpProps {
  context: string;
  position?: 'sidebar' | 'modal' | 'inline';
}

const HELP_ITEMS: HelpItem[] = [
  {
    id: 'trial_balance_accuracy',
    title: 'Ensuring Trial Balance Accuracy',
    description: 'Critical steps to verify your trial balance is mathematically correct and audit-ready',
    category: 'accuracy',
    importance: 'critical',
    context: ['trial_balance', 'journal_entries'],
    content: {
      overview: 'A balanced trial balance is fundamental to accurate financial reporting. Auditors will immediately check this basic requirement.',
      steps: [
        'Verify total debits equal total credits',
        'Check all transactions are posted to correct accounts',
        'Ensure opening balances are carried forward correctly',
        'Review journal entries for mathematical errors',
        'Confirm bank reconciliations are up to date'
      ],
      tips: [
        'Use account codes consistently (1xxx = Assets, 2xxx = Liabilities, etc.)',
        'Post adjusting entries before finalising the trial balance',
        'Keep detailed working papers for all journal entries',
        'Cross-reference with previous year comparatives'
      ],
      warnings: [
        'An unbalanced trial balance will be rejected by auditors',
        'Rounding differences should never exceed £1',
        'Suspense accounts should be cleared before filing'
      ],
      examples: [
        'Dr Cash £1,000 / Cr Sales £1,000 (Sale transaction)',
        'Dr Rent Expense £500 / Cr Cash £500 (Rent payment)'
      ]
    }
  },
  {
    id: 'document_retention',
    title: 'Document Retention & Audit Trail',
    description: 'Essential documentation requirements for HMRC compliance and audit confidence',
    category: 'compliance',
    importance: 'critical',
    context: ['documents', 'audit_support'],
    content: {
      overview: 'Proper documentation is your best defence in an HMRC enquiry. Auditors expect to see a complete audit trail for all transactions.',
      steps: [
        'Retain all source documents (invoices, receipts, bank statements)',
        'Maintain chronological filing system',
        'Keep records for at least 6 years after filing deadline',
        'Ensure all documents are legible and complete',
        'Store electronic copies securely with backups'
      ],
      tips: [
        'Scan paper documents to PDF for better preservation',
        'Use consistent naming conventions for electronic files',
        'Keep a document register or index',
        'Include VAT receipts showing supplier registration numbers'
      ],
      warnings: [
        'Missing documents can result in estimated assessments',
        'HMRC can impose penalties for inadequate records',
        'Reconstructed records are often challenged by auditors'
      ]
    }
  },
  {
    id: 'vat_compliance',
    title: 'VAT Accuracy & Compliance',
    description: 'Ensuring VAT calculations meet HMRC standards and audit requirements',
    category: 'compliance',
    importance: 'high',
    context: ['vat', 'invoices', 'purchases'],
    content: {
      overview: 'VAT errors are among the most common issues in audits. Correct VAT treatment protects against penalties and builds auditor confidence.',
      steps: [
        'Verify VAT rates for transaction dates (20%, 5%, 0%)',
        'Check supplier VAT registration numbers',
        'Apply reverse charge rules correctly',
        'Reconcile VAT returns with nominal ledger',
        'Ensure partial exemption calculations are correct'
      ],
      tips: [
        'Use VAT flat rate scheme if eligible to simplify calculations',
        'Keep records of VAT rate changes affecting your business',
        'Consider VAT implications before major transactions',
        'Review exempt vs zero-rated classifications carefully'
      ],
      warnings: [
        'Incorrect VAT rates can trigger HMRC investigations',
        'Missing VAT receipts may disallow input tax claims',
        'Late VAT registration can result in significant penalties'
      ]
    }
  },
  {
    id: 'related_party_disclosure',
    title: 'Related Party Transactions',
    description: 'Proper identification and disclosure of related party transactions for transparency',
    category: 'compliance',
    importance: 'high',
    context: ['directors', 'shareholders', 'related_parties'],
    content: {
      overview: 'Related party transactions must be identified and disclosed appropriately. This demonstrates transparency and builds trust with auditors.',
      steps: [
        'Identify all related parties (directors, shareholders, connected companies)',
        'Review all transactions with related parties',
        'Ensure transactions are at arms length',
        'Document the commercial rationale for transactions',
        'Disclose material transactions in accounts notes'
      ],
      tips: [
        'Maintain a related party register',
        'Document director loan accounts separately',
        'Consider tax implications of related party transactions',
        'Get independent valuations for significant transactions'
      ],
      warnings: [
        'Undisclosed related party transactions can trigger investigations',
        'Non-commercial terms may be challenged by HMRC',
        'Director benefit-in-kind implications must be considered'
      ]
    }
  },
  {
    id: 'depreciation_capital_allowances',
    title: 'Depreciation & Capital Allowances',
    description: 'Optimising capital allowances while maintaining accounting compliance',
    category: 'accuracy',
    importance: 'medium',
    context: ['fixed_assets', 'depreciation', 'tax_computation'],
    content: {
      overview: 'Proper treatment of depreciation and capital allowances can significantly impact your tax liability while maintaining accounting accuracy.',
      steps: [
        'Identify qualifying capital expenditure',
        'Apply correct capital allowance rates',
        'Consider Annual Investment Allowance (AIA) claims',
        'Reconcile depreciation with capital allowances',
        'Maintain fixed asset register'
      ],
      tips: [
        'Claim AIA in the year of highest profits where possible',
        'Consider timing of asset purchases for optimal allowances',
        'Keep detailed records of asset additions and disposals',
        'Review pooling vs individual asset treatment'
      ],
      warnings: [
        'Incorrect pooling can affect future allowance claims',
        'Missing capital allowance claims cannot usually be corrected later',
        'Balancing charges arise on asset disposals from pools'
      ]
    }
  }
];

export default function ContextualHelp({ context, position = 'sidebar' }: ContextualHelpProps) {
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const relevantHelp = HELP_ITEMS.filter(item => 
    item.context.includes(context) || !context
  );

  const categories = Array.from(new Set(relevantHelp.map(item => item.category)));

  const toggleItem = (itemId: string) => {
    setExpandedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'accuracy': return Calculator;
      case 'compliance': return Shield;
      case 'setup': return FileText;
      case 'best_practice': return Lightbulb;
      default: return HelpCircle;
    }
  };

  const getImportanceColor = (importance: string) => {
    switch (importance) {
      case 'critical': return 'border-red-500 bg-red-50';
      case 'high': return 'border-orange-500 bg-orange-50';
      case 'medium': return 'border-yellow-500 bg-yellow-50';
      case 'low': return 'border-blue-500 bg-blue-50';
      default: return 'border-gray-500 bg-gray-50';
    }
  };

  const getImportanceBadge = (importance: string) => {
    const colors = {
      critical: 'bg-red-100 text-red-800',
      high: 'bg-orange-100 text-orange-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-blue-100 text-blue-800'
    };
    return colors[importance as keyof typeof colors] || colors.medium;
  };

  if (position === 'inline') {
    return (
      <div className="border-l-4 border-l-blue-500 bg-blue-50 p-4 rounded-r-lg">
        <div className="flex items-start gap-3">
          <HelpCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="space-y-2">
            <h4 className="font-medium text-blue-900">Need Help?</h4>
            <p className="text-sm text-blue-800">
              Get contextual guidance to ensure accuracy and compliance.
            </p>
            <Button size="sm" variant="outline" className="text-blue-600 border-blue-300">
              <HelpCircle className="h-4 w-4 mr-2" />
              View Help
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-blue-900">
            <HelpCircle className="h-5 w-5" />
            Guidance & Best Practices
          </CardTitle>
          <p className="text-sm text-blue-700">
            Expert guidance to ensure accuracy and build auditor confidence
          </p>
        </CardHeader>
      </Card>

      {/* Category Filter */}
      {categories.length > 1 && (
        <div className="flex flex-wrap gap-2">
          <Button
            variant={selectedCategory === null ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(null)}
          >
            All ({relevantHelp.length})
          </Button>
          {categories.map(category => {
            const count = relevantHelp.filter(item => item.category === category).length;
            return (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className="capitalize"
              >
                {category.replace('_', ' ')} ({count})
              </Button>
            );
          })}
        </div>
      )}

      {/* Help Items */}
      <div className="space-y-3">
        {relevantHelp
          .filter(item => !selectedCategory || item.category === selectedCategory)
          .sort((a, b) => {
            const importanceOrder = { critical: 0, high: 1, medium: 2, low: 3 };
            return importanceOrder[a.importance as keyof typeof importanceOrder] - 
                   importanceOrder[b.importance as keyof typeof importanceOrder];
          })
          .map(item => {
            const isExpanded = expandedItems.includes(item.id);
            const Icon = getCategoryIcon(item.category);
            
            return (
              <Card key={item.id} className={`border-l-4 ${getImportanceColor(item.importance)}`}>
                <Collapsible open={isExpanded} onOpenChange={() => toggleItem(item.id)}>
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-gray-50 pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Icon className="h-4 w-4" />
                            <h3 className="font-medium">{item.title}</h3>
                            <Badge className={`text-xs ${getImportanceBadge(item.importance)}`}>
                              {item.importance}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{item.description}</p>
                        </div>
                        {isExpanded ? <ChevronDown className="h-4 w-4 mt-1" /> : <ChevronRight className="h-4 w-4 mt-1" />}
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent>
                    <CardContent className="pt-0">
                      <div className="space-y-4">
                        {/* Overview */}
                        <div className="bg-white p-3 rounded border">
                          <p className="text-sm text-gray-700">{item.content.overview}</p>
                        </div>

                        {/* Steps */}
                        <div>
                          <h4 className="font-medium text-sm mb-2 flex items-center gap-1">
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                            Action Steps
                          </h4>
                          <ol className="text-sm space-y-1">
                            {item.content.steps.map((step, idx) => (
                              <li key={idx} className="flex items-start gap-2">
                                <span className="bg-blue-100 text-blue-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">
                                  {idx + 1}
                                </span>
                                {step}
                              </li>
                            ))}
                          </ol>
                        </div>

                        {/* Tips */}
                        <div>
                          <h4 className="font-medium text-sm mb-2 flex items-center gap-1">
                            <Lightbulb className="h-4 w-4 text-yellow-600" />
                            Pro Tips
                          </h4>
                          <ul className="text-sm space-y-1">
                            {item.content.tips.map((tip, idx) => (
                              <li key={idx} className="flex items-start gap-2 text-green-700">
                                <span className="text-green-500 mt-1">💡</span>
                                {tip}
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Warnings */}
                        <div>
                          <h4 className="font-medium text-sm mb-2 flex items-center gap-1">
                            <AlertTriangle className="h-4 w-4 text-red-600" />
                            Important Warnings
                          </h4>
                          <ul className="text-sm space-y-1">
                            {item.content.warnings.map((warning, idx) => (
                              <li key={idx} className="flex items-start gap-2 text-red-700">
                                <span className="text-red-500 mt-1">⚠️</span>
                                {warning}
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Examples */}
                        {item.content.examples && (
                          <div>
                            <h4 className="font-medium text-sm mb-2">Examples</h4>
                            <div className="bg-gray-50 p-3 rounded text-sm font-mono">
                              {item.content.examples.map((example, idx) => (
                                <div key={idx} className="text-gray-700">{example}</div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            );
          })}
      </div>

      {/* Footer */}
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription className="text-sm">
          <strong>Professional Standards:</strong> This guidance is designed to meet the expectations 
          of qualified auditors, HMRC, and Companies House. Following these practices builds trust 
          and reduces the risk of queries or investigations.
        </AlertDescription>
      </Alert>
    </div>
  );
}
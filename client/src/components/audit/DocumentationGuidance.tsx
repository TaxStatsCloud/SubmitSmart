import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, AlertTriangle, FileText, Upload, ChevronDown, ChevronRight, Info, Shield, Users } from 'lucide-react';

interface DocumentRequirement {
  id: string;
  name: string;
  description: string;
  required: boolean;
  category: 'financial' | 'legal' | 'operational' | 'compliance';
  auditImportance: 'critical' | 'high' | 'medium' | 'low';
  filingTypes: string[];
  examples: string[];
  tips: string[];
  commonMistakes: string[];
  uploaded?: boolean;
}

interface DocumentationGuidanceProps {
  filingType: 'corporation_tax' | 'confirmation_statement' | 'annual_accounts';
  companyType?: 'micro' | 'small' | 'medium' | 'large';
  onDocumentUpload?: (requirement: DocumentRequirement, files: File[]) => void;
}

const DOCUMENT_REQUIREMENTS: DocumentRequirement[] = [
  {
    id: 'trial_balance',
    name: 'Trial Balance',
    description: 'Complete trial balance showing all account balances at year-end',
    required: true,
    category: 'financial',
    auditImportance: 'critical',
    filingTypes: ['corporation_tax', 'annual_accounts'],
    examples: ['Excel spreadsheet with debit/credit columns', 'PDF export from accounting software'],
    tips: [
      'Ensure all accounts are included with proper coding',
      'Verify that total debits equal total credits',
      'Include opening balances for comparison'
    ],
    commonMistakes: [
      'Missing prepayments or accruals',
      'Incorrect VAT treatment',
      'Unreconciled bank accounts'
    ]
  },
  {
    id: 'bank_statements',
    name: 'Bank Statements',
    description: 'Complete bank statements for all business accounts covering the full financial year',
    required: true,
    category: 'financial',
    auditImportance: 'critical',
    filingTypes: ['corporation_tax', 'annual_accounts', 'confirmation_statement'],
    examples: ['PDF statements from online banking', 'Paper statements scanned to PDF'],
    tips: [
      'Include all business bank accounts',
      'Ensure statements cover the entire accounting period',
      'Include both current and savings accounts'
    ],
    commonMistakes: [
      'Missing month-end statements',
      'Personal transactions mixed with business',
      'Incomplete statement periods'
    ]
  },
  {
    id: 'invoices_sales',
    name: 'Sales Invoices',
    description: 'All sales invoices issued during the accounting period',
    required: true,
    category: 'financial',
    auditImportance: 'high',
    filingTypes: ['corporation_tax', 'annual_accounts'],
    examples: ['PDF invoices', 'Export from invoicing software', 'Copy invoices'],
    tips: [
      'Include invoice numbers and dates',
      'Ensure VAT is correctly calculated',
      'Match to bank receipts where possible'
    ],
    commonMistakes: [
      'Missing invoice sequences',
      'Incorrect VAT rates applied',
      'Credit notes not properly recorded'
    ]
  },
  {
    id: 'purchase_invoices',
    name: 'Purchase Invoices & Receipts',
    description: 'All purchase invoices and expense receipts for business costs',
    required: true,
    category: 'financial',
    auditImportance: 'high',
    filingTypes: ['corporation_tax', 'annual_accounts'],
    examples: ['Supplier invoices', 'Expense receipts', 'Utility bills', 'Software subscriptions'],
    tips: [
      'Ensure receipts show VAT registration numbers',
      'Include both revenue and capital expenditure',
      'Organise by expense category'
    ],
    commonMistakes: [
      'Personal expenses included',
      'Missing VAT receipts',
      'Duplicate entries'
    ]
  },
  {
    id: 'payroll_records',
    name: 'Payroll Records',
    description: 'P60s, P11Ds, and payroll summaries for all employees',
    required: false,
    category: 'compliance',
    auditImportance: 'high',
    filingTypes: ['corporation_tax', 'annual_accounts'],
    examples: ['P60 forms', 'P11D forms', 'Payroll software reports'],
    tips: [
      'Include PAYE and NI contributions',
      'Ensure pension contributions are recorded',
      'Include director remuneration details'
    ],
    commonMistakes: [
      'Missing P11D for director benefits',
      'Incorrect pension scheme contributions',
      'Missing seasonal worker records'
    ]
  },
  {
    id: 'incorporation_docs',
    name: 'Incorporation Documents',
    description: 'Certificate of incorporation and memorandum & articles of association',
    required: true,
    category: 'legal',
    auditImportance: 'medium',
    filingTypes: ['confirmation_statement', 'annual_accounts'],
    examples: ['Certificate of Incorporation', 'Memorandum of Association', 'Articles of Association'],
    tips: [
      'Include original incorporation certificate',
      'Provide current articles if amended',
      'Include any special resolutions'
    ],
    commonMistakes: [
      'Outdated articles of association',
      'Missing special resolution documents',
      'Incorrect company registration details'
    ]
  }
];

export default function DocumentationGuidance({ filingType, companyType = 'small', onDocumentUpload }: DocumentationGuidanceProps) {
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['financial']);
  const [selectedRequirement, setSelectedRequirement] = useState<string | null>(null);

  const filteredRequirements = DOCUMENT_REQUIREMENTS.filter(req => 
    req.filingTypes.includes(filingType)
  );

  const categories = Array.from(new Set(filteredRequirements.map(req => req.category)));
  
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'financial': return FileText;
      case 'legal': return Shield;
      case 'operational': return Users;
      case 'compliance': return CheckCircle2;
      default: return FileText;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'financial': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'legal': return 'text-green-600 bg-green-50 border-green-200';
      case 'operational': return 'text-purple-600 bg-purple-50 border-purple-200';
      case 'compliance': return 'text-orange-600 bg-orange-50 border-orange-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getImportanceBadge = (importance: string) => {
    const colors = {
      critical: 'bg-red-100 text-red-800 border-red-300',
      high: 'bg-orange-100 text-orange-800 border-orange-300',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      low: 'bg-gray-100 text-gray-800 border-gray-300'
    };
    return colors[importance as keyof typeof colors] || colors.medium;
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const uploadedCount = filteredRequirements.filter(req => req.uploaded).length;
  const requiredCount = filteredRequirements.filter(req => req.required).length;
  const completionPercentage = Math.round((uploadedCount / filteredRequirements.length) * 100);

  return (
    <div className="space-y-6">
      {/* Header with Progress */}
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-600" />
                Documentation Guidance & Audit Support
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Ensure maximum accuracy and auditor confidence with proper documentation
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600">{completionPercentage}%</div>
              <div className="text-xs text-muted-foreground">Complete</div>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex justify-between text-sm mb-2">
              <span>Documentation Progress</span>
              <span>{uploadedCount} of {filteredRequirements.length} documents</span>
            </div>
            <Progress value={completionPercentage} className="h-2" />
          </div>
        </CardHeader>
      </Card>

      {/* Auditor Trust Statement */}
      <Alert className="border-green-200 bg-green-50">
        <Users className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800">
          <strong>Building Auditor Trust:</strong> Complete documentation with supporting evidence ensures 
          smooth audits and builds confidence with HMRC and Companies House. Each document requirement 
          below is designed to meet professional audit standards.
        </AlertDescription>
      </Alert>

      {/* Document Categories */}
      {categories.map(category => {
        const categoryRequirements = filteredRequirements.filter(req => req.category === category);
        const isExpanded = expandedCategories.includes(category);
        const Icon = getCategoryIcon(category);
        const categoryUploaded = categoryRequirements.filter(req => req.uploaded).length;
        
        return (
          <Card key={category} className={`border ${getCategoryColor(category)}`}>
            <Collapsible open={isExpanded} onOpenChange={() => toggleCategory(category)}>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Icon className="h-5 w-5" />
                      <div>
                        <h3 className="font-semibold capitalize">{category} Documents</h3>
                        <p className="text-sm text-muted-foreground">
                          {categoryRequirements.length} requirements • {categoryUploaded} uploaded
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {categoryUploaded}/{categoryRequirements.length}
                      </Badge>
                      {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </div>
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              
              <CollapsibleContent>
                <CardContent className="pt-0">
                  <div className="space-y-4">
                    {categoryRequirements.map(requirement => (
                      <div key={requirement.id} className="border rounded-lg p-4 bg-white">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium">{requirement.name}</h4>
                              {requirement.required && (
                                <Badge variant="destructive" className="text-xs">Required</Badge>
                              )}
                              <Badge className={`text-xs ${getImportanceBadge(requirement.auditImportance)}`}>
                                {requirement.auditImportance} importance
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-3">
                              {requirement.description}
                            </p>
                          </div>
                          <div className="ml-4">
                            {requirement.uploaded ? (
                              <CheckCircle2 className="h-5 w-5 text-green-600" />
                            ) : (
                              <div className="h-5 w-5 border-2 border-gray-300 rounded-full" />
                            )}
                          </div>
                        </div>

                        {/* Examples */}
                        <div className="mb-3">
                          <h5 className="text-xs font-medium text-gray-700 mb-1">Examples:</h5>
                          <div className="flex flex-wrap gap-1">
                            {requirement.examples.map((example, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {example}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        {/* Tips */}
                        <div className="mb-3">
                          <h5 className="text-xs font-medium text-green-700 mb-1">💡 Pro Tips:</h5>
                          <ul className="text-xs text-green-600 space-y-1">
                            {requirement.tips.map((tip, idx) => (
                              <li key={idx} className="flex items-start gap-1">
                                <span className="text-green-500 mt-0.5">•</span>
                                {tip}
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Common Mistakes */}
                        <div className="mb-4">
                          <h5 className="text-xs font-medium text-red-700 mb-1">⚠️ Common Mistakes:</h5>
                          <ul className="text-xs text-red-600 space-y-1">
                            {requirement.commonMistakes.map((mistake, idx) => (
                              <li key={idx} className="flex items-start gap-1">
                                <span className="text-red-500 mt-0.5">•</span>
                                {mistake}
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Upload Button */}
                        <div className="border-t pt-3">
                          <input
                            type="file"
                            id={`upload-${requirement.id}`}
                            multiple
                            accept=".pdf,.jpg,.jpeg,.png,.xlsx,.xls,.csv"
                            className="hidden"
                            onChange={(e) => {
                              const files = Array.from(e.target.files || []);
                              if (files.length > 0 && onDocumentUpload) {
                                onDocumentUpload(requirement, files);
                              }
                            }}
                          />
                          <label htmlFor={`upload-${requirement.id}`}>
                            <Button 
                              variant={requirement.uploaded ? "outline" : "default"} 
                              size="sm" 
                              className="w-full cursor-pointer"
                              asChild
                            >
                              <span>
                                <Upload className="h-4 w-4 mr-2" />
                                {requirement.uploaded ? 'Update Documents' : 'Upload Documents'}
                              </span>
                            </Button>
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>
        );
      })}

      {/* Footer Information */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Quality Assurance:</strong> Our AI system will validate your documents against HMRC requirements 
          and flag any potential issues before submission. This ensures maximum accuracy and reduces the risk 
          of queries from authorities.
        </AlertDescription>
      </Alert>
    </div>
  );
}
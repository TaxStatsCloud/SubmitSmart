import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CalendarDays, FileText, Download, Upload, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { useLocation } from 'wouter';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type PriorYearData = {
  id: number;
  companyId: number;
  yearEnding: string;
  dataType: 'trial_balance' | 'accounts' | 'companies_house_filing';
  sourceType: 'uploaded' | 'companies_house_api' | 'manual_entry';
  sourceReference?: string;
  data: any;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
};

type ComparativePeriod = {
  id: number;
  companyId: number;
  currentYearEnding: string;
  priorYearEnding: string;
  layoutTemplate: string;
  mappingRules?: any;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

type CompaniesHouseFiling = {
  id: number;
  companyId: number;
  registrationNumber: string;
  filingDate: string;
  accountsPeriodEndOn: string;
  category: string;
  description: string;
  isImported: boolean;
  createdAt: string;
};

export default function ComparativePeriods() {
  const [location] = useLocation();
  const queryClient = useQueryClient();
  const [selectedCompany, setSelectedCompany] = useState<number>(1);
  const [showImportForm, setShowImportForm] = useState(false);
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [newPeriod, setNewPeriod] = useState({
    currentYearEnding: '',
    priorYearEnding: '',
    layoutTemplate: 'standard'
  });

  // Fetch prior year data for the selected company
  const { data: priorYearData = [], isLoading: priorYearLoading } = useQuery({
    queryKey: ['/api/prior-year-data', selectedCompany],
    queryFn: () => apiRequest('GET', `/api/prior-year-data/${selectedCompany}`).then(res => res.json()),
    enabled: !!selectedCompany
  });

  // Fetch comparative periods for the selected company
  const { data: comparativePeriods = [], isLoading: periodsLoading } = useQuery({
    queryKey: ['/api/comparative-periods', selectedCompany],
    queryFn: () => apiRequest('GET', `/api/comparative-periods/${selectedCompany}`).then(res => res.json()),
    enabled: !!selectedCompany
  });

  // Fetch Companies House filings for the selected company
  const { data: companiesHouseFilings = [], isLoading: filingsLoading } = useQuery({
    queryKey: ['/api/companies-house-filings', selectedCompany],
    queryFn: () => apiRequest('GET', `/api/companies-house-filings/${selectedCompany}`).then(res => res.json()),
    enabled: !!selectedCompany
  });

  // Import Companies House filings mutation
  const importFilingsMutation = useMutation({
    mutationFn: (data: { registrationNumber: string; companyId: number }) =>
      apiRequest('POST', '/api/companies-house-filings/import', data),
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Companies House filings imported successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/companies-house-filings', selectedCompany] });
      setShowImportForm(false);
      setRegistrationNumber('');
    },
    onError: (error: any) => {
      toast({
        title: 'Import Failed',
        description: error.message || 'Failed to import Companies House filings',
        variant: 'destructive',
      });
    }
  });

  // Create comparative period mutation
  const createPeriodMutation = useMutation({
    mutationFn: (data: any) =>
      apiRequest('POST', '/api/comparative-periods', data),
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Comparative period configuration created successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/comparative-periods', selectedCompany] });
      setNewPeriod({
        currentYearEnding: '',
        priorYearEnding: '',
        layoutTemplate: 'standard'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create comparative period',
        variant: 'destructive',
      });
    }
  });

  const handleImportFilings = () => {
    if (!registrationNumber.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please enter a company registration number',
        variant: 'destructive',
      });
      return;
    }

    importFilingsMutation.mutate({
      registrationNumber: registrationNumber.trim(),
      companyId: selectedCompany
    });
  };

  const handleCreatePeriod = () => {
    if (!newPeriod.currentYearEnding || !newPeriod.priorYearEnding) {
      toast({
        title: 'Validation Error',
        description: 'Please select both current and prior year ending dates',
        variant: 'destructive',
      });
      return;
    }

    createPeriodMutation.mutate({
      companyId: selectedCompany,
      currentYearEnding: newPeriod.currentYearEnding,
      priorYearEnding: newPeriod.priorYearEnding,
      layoutTemplate: newPeriod.layoutTemplate,
      isActive: true
    });
  };

  const getSourceIcon = (sourceType: string) => {
    switch (sourceType) {
      case 'uploaded':
        return <Upload className="w-4 h-4 text-blue-500" />;
      case 'companies_house_api':
        return <Download className="w-4 h-4 text-green-500" />;
      case 'manual_entry':
        return <FileText className="w-4 h-4 text-purple-500" />;
      default:
        return <FileText className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Comparative Periods
                </h1>
                <p className="text-gray-600 mt-2">
                  Manage prior year data and comparative period configurations for consistent statutory accounts layout
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <Select value={selectedCompany.toString()} onValueChange={(value) => setSelectedCompany(parseInt(value))}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Select company" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Tech Solutions Ltd</SelectItem>
                    <SelectItem value="2">Bright Innovations Ltd</SelectItem>
                    <SelectItem value="3">Global Services Ltd</SelectItem>
                  </SelectContent>
                </Select>
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  Company ID: {selectedCompany}
                </Badge>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Prior Year Data Section */}
            <Card className="bg-white/80 backdrop-blur-sm shadow-lg border border-white/20">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CalendarDays className="w-5 h-5 text-blue-600" />
                  <span>Prior Year Data</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {priorYearLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                  </div>
                ) : priorYearData.length > 0 ? (
                  <div className="space-y-4">
                    {priorYearData.map((data: PriorYearData) => (
                      <div key={data.id} className="border rounded-lg p-4 bg-gradient-to-r from-blue-50 to-purple-50">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            {getSourceIcon(data.sourceType)}
                            <span className="font-medium">{data.yearEnding}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant={data.isVerified ? 'default' : 'secondary'}>
                              {data.isVerified ? 'Verified' : 'Pending'}
                            </Badge>
                            {data.isVerified && <CheckCircle className="w-4 h-4 text-green-500" />}
                          </div>
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <p><strong>Type:</strong> {data.dataType.replace('_', ' ')}</p>
                          <p><strong>Source:</strong> {data.sourceType.replace('_', ' ')}</p>
                          {data.sourceReference && (
                            <p><strong>Reference:</strong> {data.sourceReference}</p>
                          )}
                          <p><strong>Created:</strong> {format(new Date(data.createdAt), 'PPP')}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No prior year data found for this company</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Comparative Periods Section */}
            <Card className="bg-white/80 backdrop-blur-sm shadow-lg border border-white/20">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="w-5 h-5 text-purple-600" />
                  <span>Comparative Periods</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {periodsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {comparativePeriods.map((period: ComparativePeriod) => (
                      <div key={period.id} className="border rounded-lg p-4 bg-gradient-to-r from-purple-50 to-pink-50">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">
                            {period.currentYearEnding} vs {period.priorYearEnding}
                          </span>
                          <Badge variant={period.isActive ? 'default' : 'secondary'}>
                            {period.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <p><strong>Layout:</strong> {period.layoutTemplate}</p>
                          <p><strong>Created:</strong> {format(new Date(period.createdAt), 'PPP')}</p>
                        </div>
                      </div>
                    ))}

                    <Separator className="my-4" />

                    {/* Create New Period Form */}
                    <div className="space-y-4">
                      <h4 className="font-medium">Create New Comparative Period</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="currentYear">Current Year Ending</Label>
                          <Input
                            id="currentYear"
                            type="date"
                            value={newPeriod.currentYearEnding}
                            onChange={(e) => setNewPeriod(prev => ({ ...prev, currentYearEnding: e.target.value }))}
                          />
                        </div>
                        <div>
                          <Label htmlFor="priorYear">Prior Year Ending</Label>
                          <Input
                            id="priorYear"
                            type="date"
                            value={newPeriod.priorYearEnding}
                            onChange={(e) => setNewPeriod(prev => ({ ...prev, priorYearEnding: e.target.value }))}
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="template">Layout Template</Label>
                        <Select value={newPeriod.layoutTemplate} onValueChange={(value) => setNewPeriod(prev => ({ ...prev, layoutTemplate: value }))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="standard">Standard Layout</SelectItem>
                            <SelectItem value="detailed">Detailed Layout</SelectItem>
                            <SelectItem value="simplified">Simplified Layout</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Button 
                        onClick={handleCreatePeriod} 
                        disabled={createPeriodMutation.isPending}
                        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                      >
                        {createPeriodMutation.isPending ? 'Creating...' : 'Create Period'}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Companies House Filings Section */}
          <Card className="bg-white/80 backdrop-blur-sm shadow-lg border border-white/20 mt-8">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Download className="w-5 h-5 text-green-600" />
                  <span>Companies House Filing History</span>
                </div>
                <Button
                  onClick={() => setShowImportForm(!showImportForm)}
                  variant="outline"
                  size="sm"
                  className="bg-gradient-to-r from-green-50 to-blue-50 hover:from-green-100 hover:to-blue-100"
                >
                  Import Filings
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {showImportForm && (
                <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4 mb-6">
                  <div className="flex items-center space-x-4">
                    <div className="flex-1">
                      <Label htmlFor="regNumber">Company Registration Number</Label>
                      <Input
                        id="regNumber"
                        placeholder="e.g., 12345678"
                        value={registrationNumber}
                        onChange={(e) => setRegistrationNumber(e.target.value)}
                      />
                    </div>
                    <Button
                      onClick={handleImportFilings}
                      disabled={importFilingsMutation.isPending}
                      className="mt-6 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
                    >
                      {importFilingsMutation.isPending ? 'Importing...' : 'Import'}
                    </Button>
                  </div>
                </div>
              )}

              {filingsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" />
                </div>
              ) : companiesHouseFilings.length > 0 ? (
                <div className="space-y-4">
                  {companiesHouseFilings.map((filing: CompaniesHouseFiling) => (
                    <div key={filing.id} className="border rounded-lg p-4 bg-gradient-to-r from-green-50 to-blue-50">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{filing.description}</span>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline">{filing.category}</Badge>
                          {filing.isImported && <CheckCircle className="w-4 h-4 text-green-500" />}
                        </div>
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p><strong>Registration:</strong> {filing.registrationNumber}</p>
                        <p><strong>Filing Date:</strong> {format(new Date(filing.filingDate), 'PPP')}</p>
                        <p><strong>Period End:</strong> {format(new Date(filing.accountsPeriodEndOn), 'PPP')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Download className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No Companies House filings found</p>
                  <p className="text-sm text-gray-500 mt-2">Import filing history to populate comparative period data</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
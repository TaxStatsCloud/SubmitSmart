import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, Clock, Eye, Download, RefreshCw } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Helmet } from 'react-helmet-async';

type OpeningTrialBalance = {
  id: number;
  companyId: number;
  userId: number;
  periodStartDate: string;
  periodEndDate: string;
  fileName: string;
  fileSize: number;
  filePath: string;
  uploadedAt: string;
  processedAt?: string;
  processingStatus: 'pending' | 'processing' | 'completed' | 'failed';
  processingError?: string;
  trialBalanceData?: any;
  totalDebits: number;
  totalCredits: number;
  accountCount: number;
  isVerified: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

export default function OpeningTrialBalance() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedCompany, setSelectedCompany] = useState<number>(1);
  const [uploadForm, setUploadForm] = useState({
    periodStartDate: '',
    periodEndDate: '',
    notes: ''
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Fetch opening trial balances for the selected company
  const { data: openingBalances = [], isLoading, refetch } = useQuery({
    queryKey: ['/api/opening-trial-balances', selectedCompany],
    queryFn: () => apiRequest('GET', `/api/opening-trial-balances/${selectedCompany}`).then(res => res.json()),
    enabled: !!selectedCompany
  });

  // Upload opening trial balance mutation
  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const xhr = new XMLHttpRequest();
      return new Promise((resolve, reject) => {
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            setUploadProgress(Math.round((e.loaded * 100) / e.total));
          }
        });

        xhr.addEventListener('load', () => {
          setUploadProgress(100);
          if (xhr.status === 201) {
            resolve(JSON.parse(xhr.responseText));
          } else {
            reject(new Error(xhr.responseText));
          }
        });

        xhr.addEventListener('error', () => {
          reject(new Error('Upload failed'));
        });

        xhr.open('POST', '/api/opening-trial-balances/upload');
        xhr.send(formData);
      });
    },
    onSuccess: () => {
      toast({
        title: 'Upload Successful',
        description: 'Opening trial balance uploaded and processing started',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/opening-trial-balances', selectedCompany] });
      setSelectedFile(null);
      setUploadForm({ periodStartDate: '', periodEndDate: '', notes: '' });
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    onError: (error: any) => {
      toast({
        title: 'Upload Failed',
        description: error.message || 'Failed to upload opening trial balance',
        variant: 'destructive',
      });
      setUploadProgress(0);
    }
  });

  // Verify opening trial balance mutation
  const verifyMutation = useMutation({
    mutationFn: (data: { id: number; isVerified: boolean; notes?: string }) =>
      apiRequest('PUT', `/api/opening-trial-balances/${data.id}/verify`, {
        isVerified: data.isVerified,
        notes: data.notes
      }),
    onSuccess: () => {
      toast({
        title: 'Verification Updated',
        description: 'Opening trial balance verification status updated',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/opening-trial-balances', selectedCompany] });
    },
    onError: (error: any) => {
      toast({
        title: 'Verification Failed',
        description: error.message || 'Failed to update verification status',
        variant: 'destructive',
      });
    }
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
        'text/csv'
      ];
      
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: 'Invalid File Type',
          description: 'Please upload Excel (.xlsx, .xls) or CSV files only',
          variant: 'destructive',
        });
        return;
      }

      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: 'File Too Large',
          description: 'Please upload files smaller than 10MB',
          variant: 'destructive',
        });
        return;
      }

      setSelectedFile(file);
    }
  };

  const handleUpload = () => {
    if (!selectedFile) {
      toast({
        title: 'No File Selected',
        description: 'Please select a trial balance file to upload',
        variant: 'destructive',
      });
      return;
    }

    if (!uploadForm.periodStartDate || !uploadForm.periodEndDate) {
      toast({
        title: 'Missing Period Dates',
        description: 'Please specify the accounting period start and end dates',
        variant: 'destructive',
      });
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('companyId', selectedCompany.toString());
    formData.append('userId', '1'); // Mock user ID
    formData.append('periodStartDate', uploadForm.periodStartDate);
    formData.append('periodEndDate', uploadForm.periodEndDate);
    formData.append('notes', uploadForm.notes);

    uploadMutation.mutate(formData);
  };

  const handleVerify = (id: number, isVerified: boolean) => {
    verifyMutation.mutate({ id, isVerified });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'processing':
        return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(amount / 100);
  };

  return (
    <>
      <Helmet>
        <title>Opening Trial Balance | PromptSubmissions</title>
        <meta name="description" content="Upload and manage opening trial balance files for accurate statutory accounts preparation" />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Opening Trial Balance
                  </h1>
                  <p className="text-gray-600 mt-2">
                    Upload and manage opening trial balance files for accurate statutory accounts preparation
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

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Upload Section */}
              <div className="lg:col-span-1">
                <Card className="bg-white/80 backdrop-blur-sm shadow-lg border border-white/20">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Upload className="w-5 h-5 text-blue-600" />
                      <span>Upload Opening TB</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* File Selection */}
                      <div>
                        <Label htmlFor="file-upload">Select Trial Balance File</Label>
                        <div className="mt-2">
                          <input
                            ref={fileInputRef}
                            id="file-upload"
                            type="file"
                            accept=".xlsx,.xls,.csv"
                            onChange={handleFileSelect}
                            className="hidden"
                          />
                          <div
                            onClick={() => fileInputRef.current?.click()}
                            className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 cursor-pointer transition-colors"
                          >
                            <FileSpreadsheet className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                            <p className="text-sm text-gray-600">
                              Click to upload Excel or CSV file
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              Max file size: 10MB
                            </p>
                          </div>
                        </div>
                        {selectedFile && (
                          <div className="mt-2 p-3 bg-blue-50 rounded-lg">
                            <p className="text-sm font-medium text-blue-900">{selectedFile.name}</p>
                            <p className="text-xs text-blue-700">
                              {formatFileSize(selectedFile.size)}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Period Dates */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="start-date">Period Start</Label>
                          <Input
                            id="start-date"
                            type="date"
                            value={uploadForm.periodStartDate}
                            onChange={(e) => setUploadForm(prev => ({ ...prev, periodStartDate: e.target.value }))}
                          />
                        </div>
                        <div>
                          <Label htmlFor="end-date">Period End</Label>
                          <Input
                            id="end-date"
                            type="date"
                            value={uploadForm.periodEndDate}
                            onChange={(e) => setUploadForm(prev => ({ ...prev, periodEndDate: e.target.value }))}
                          />
                        </div>
                      </div>

                      {/* Notes */}
                      <div>
                        <Label htmlFor="notes">Notes (Optional)</Label>
                        <Textarea
                          id="notes"
                          placeholder="Add any relevant notes about this opening trial balance..."
                          value={uploadForm.notes}
                          onChange={(e) => setUploadForm(prev => ({ ...prev, notes: e.target.value }))}
                          rows={3}
                        />
                      </div>

                      {/* Upload Progress */}
                      {uploadMutation.isPending && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span>Uploading...</span>
                            <span>{uploadProgress}%</span>
                          </div>
                          <Progress value={uploadProgress} />
                        </div>
                      )}

                      {/* Upload Button */}
                      <Button
                        onClick={handleUpload}
                        disabled={uploadMutation.isPending || !selectedFile}
                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                      >
                        {uploadMutation.isPending ? 'Uploading...' : 'Upload Trial Balance'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Opening Balances List */}
              <div className="lg:col-span-2">
                <Card className="bg-white/80 backdrop-blur-sm shadow-lg border border-white/20">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <FileSpreadsheet className="w-5 h-5 text-green-600" />
                        <span>Opening Trial Balances</span>
                      </div>
                      <Button
                        onClick={() => refetch()}
                        variant="outline"
                        size="sm"
                        className="bg-gradient-to-r from-green-50 to-blue-50 hover:from-green-100 hover:to-blue-100"
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Refresh
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                      </div>
                    ) : openingBalances.length > 0 ? (
                      <div className="space-y-4">
                        {openingBalances.map((balance: OpeningTrialBalance) => (
                          <div key={balance.id} className="border rounded-lg p-4 bg-gradient-to-r from-blue-50 to-purple-50">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center space-x-3">
                                {getStatusIcon(balance.processingStatus)}
                                <span className="font-medium">{balance.fileName}</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Badge className={getStatusColor(balance.processingStatus)}>
                                  {balance.processingStatus}
                                </Badge>
                                {balance.isVerified && (
                                  <Badge variant="default" className="bg-green-100 text-green-800">
                                    Verified
                                  </Badge>
                                )}
                              </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-3">
                              <div>
                                <p><strong>Period:</strong></p>
                                <p>{format(new Date(balance.periodStartDate), 'MMM dd, yyyy')} - {format(new Date(balance.periodEndDate), 'MMM dd, yyyy')}</p>
                              </div>
                              <div>
                                <p><strong>File Size:</strong></p>
                                <p>{formatFileSize(balance.fileSize)}</p>
                              </div>
                              <div>
                                <p><strong>Uploaded:</strong></p>
                                <p>{format(new Date(balance.uploadedAt), 'MMM dd, yyyy')}</p>
                              </div>
                              <div>
                                <p><strong>Accounts:</strong></p>
                                <p>{balance.accountCount} accounts</p>
                              </div>
                            </div>

                            {balance.processingStatus === 'completed' && balance.trialBalanceData && (
                              <div className="bg-white/60 rounded-lg p-3 mb-3">
                                <div className="grid grid-cols-3 gap-4 text-sm">
                                  <div>
                                    <p className="font-medium text-gray-700">Total Debits:</p>
                                    <p className="text-green-600 font-mono">{formatCurrency(balance.totalDebits)}</p>
                                  </div>
                                  <div>
                                    <p className="font-medium text-gray-700">Total Credits:</p>
                                    <p className="text-blue-600 font-mono">{formatCurrency(balance.totalCredits)}</p>
                                  </div>
                                  <div>
                                    <p className="font-medium text-gray-700">Balance Status:</p>
                                    <p className={`font-medium ${balance.totalDebits === balance.totalCredits ? 'text-green-600' : 'text-red-600'}`}>
                                      {balance.totalDebits === balance.totalCredits ? 'Balanced' : 'Unbalanced'}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}

                            {balance.processingStatus === 'failed' && balance.processingError && (
                              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
                                <p className="text-sm text-red-800">
                                  <strong>Processing Error:</strong> {balance.processingError}
                                </p>
                              </div>
                            )}

                            {balance.notes && (
                              <div className="bg-gray-50 rounded-lg p-3 mb-3">
                                <p className="text-sm text-gray-700">
                                  <strong>Notes:</strong> {balance.notes}
                                </p>
                              </div>
                            )}

                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                {balance.processingStatus === 'completed' && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100"
                                  >
                                    <Eye className="w-4 h-4 mr-2" />
                                    View Details
                                  </Button>
                                )}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="bg-gradient-to-r from-blue-50 to-green-50 hover:from-blue-100 hover:to-green-100"
                                >
                                  <Download className="w-4 h-4 mr-2" />
                                  Download
                                </Button>
                              </div>
                              {balance.processingStatus === 'completed' && (
                                <Button
                                  onClick={() => handleVerify(balance.id, !balance.isVerified)}
                                  variant={balance.isVerified ? "destructive" : "default"}
                                  size="sm"
                                  disabled={verifyMutation.isPending}
                                  className={balance.isVerified ? 
                                    "bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600" :
                                    "bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                                  }
                                >
                                  {balance.isVerified ? 'Unverify' : 'Verify'}
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <FileSpreadsheet className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600">No opening trial balances found</p>
                        <p className="text-sm text-gray-500 mt-2">Upload your first opening trial balance to get started</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
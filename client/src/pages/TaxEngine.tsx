import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2, ChevronLeft, ChevronRight, CircleDashed, FileText, FileSpreadsheet, Receipt, Save } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";

const TaxEngine = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [activeSection, setActiveSection] = useState("company-info");
  const [accountingPeriod, setAccountingPeriod] = useState("");
  
  // Fetch user companies
  const { data: companies, isLoading: isLoadingCompanies } = useQuery({
    queryKey: ['/api/companies'],
    enabled: !!user?.id,
  });
  
  // Selected company
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(null);
  
  // Fetch tax filing details if a company is selected
  const { data: taxFiling, isLoading: isLoadingTaxFiling } = useQuery({
    queryKey: ['/api/tax-filings', selectedCompanyId, accountingPeriod],
    enabled: !!selectedCompanyId && !!accountingPeriod,
  });
  
  // Progress tracking
  const [progress, setProgress] = useState(0);
  const sections = [
    { id: "company-info", name: "Company Information", progress: 0 },
    { id: "income-statement", name: "Income Statement", progress: 0 },
    { id: "balance-sheet", name: "Balance Sheet", progress: 0 },
    { id: "tax-adjustments", name: "Tax Adjustments", progress: 0 },
    { id: "capital-allowances", name: "Capital Allowances", progress: 0 },
    { id: "tax-calculation", name: "Tax Calculation", progress: 0 },
    { id: "review-submit", name: "Review & Submit", progress: 0 },
  ];
  
  const handleSaveSection = (sectionId: string) => {
    toast({
      title: "Progress saved",
      description: "Your changes have been saved successfully",
    });
    
    // Update progress for demonstration purposes
    const updatedSections = sections.map(section => {
      if (section.id === sectionId) {
        return { ...section, progress: 100 };
      }
      return section;
    });
    
    // Calculate overall progress
    const totalProgress = updatedSections.reduce((sum, section) => sum + section.progress, 0) / updatedSections.length;
    setProgress(totalProgress);
  };
  
  const handleNextSection = () => {
    const currentIndex = sections.findIndex(section => section.id === activeSection);
    if (currentIndex < sections.length - 1) {
      setActiveSection(sections[currentIndex + 1].id);
    }
  };
  
  const handlePreviousSection = () => {
    const currentIndex = sections.findIndex(section => section.id === activeSection);
    if (currentIndex > 0) {
      setActiveSection(sections[currentIndex - 1].id);
    }
  };

  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Tax Preparation Engine</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => toast({
            title: "Draft saved",
            description: "Your tax return draft has been saved"
          })}>
            <Save className="h-4 w-4 mr-2" />
            Save Draft
          </Button>
          <Button>
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Submit to HMRC
          </Button>
        </div>
      </div>

      <Tabs className="space-y-4" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 max-w-lg mx-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tax-return">Tax Return</TabsTrigger>
          <TabsTrigger value="history">Filing History</TabsTrigger>
        </TabsList>
        
        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Tax Preparation Dashboard</CardTitle>
              <CardDescription>
                Prepare and file your company's tax returns with our simplified tax engine
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">Select Company</h3>
                    <Select 
                      value={selectedCompanyId?.toString() || ""} 
                      onValueChange={(value) => setSelectedCompanyId(Number(value))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a company" />
                      </SelectTrigger>
                      <SelectContent>
                        {isLoadingCompanies ? (
                          <SelectItem value="loading" disabled>Loading companies...</SelectItem>
                        ) : (
                          Array.isArray(companies) && companies.map((company) => (
                            <SelectItem key={company.id} value={company.id.toString()}>
                              {company.name}
                            </SelectItem>
                          )) || (
                            <SelectItem value="none" disabled>No companies available</SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">Accounting Period</h3>
                    <Select 
                      value={accountingPeriod} 
                      onValueChange={setAccountingPeriod}
                      disabled={!selectedCompanyId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select accounting period" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2024">Year ending 31 Dec 2024</SelectItem>
                        <SelectItem value="2023">Year ending 31 Dec 2023</SelectItem>
                        <SelectItem value="2022">Year ending 31 Dec 2022</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="pt-4">
                    <Button 
                      className="w-full" 
                      disabled={!selectedCompanyId || !accountingPeriod}
                      onClick={() => setActiveTab("tax-return")}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      {progress > 0 ? "Continue Tax Return" : "Start New Tax Return"}
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Filing Status</h3>
                  
                  {isLoadingTaxFiling ? (
                    <div className="space-y-4">
                      <Skeleton className="h-12 w-full" />
                      <Skeleton className="h-12 w-full" />
                      <Skeleton className="h-12 w-full" />
                    </div>
                  ) : selectedCompanyId && accountingPeriod ? (
                    <div className="space-y-4 bg-muted p-4 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Corporation Tax Return</span>
                        <Badge variant={progress === 100 ? "success" : progress > 0 ? "secondary" : "outline"}>
                          {progress === 100 ? "Completed" : progress > 0 ? "In Progress" : "Not Started"}
                        </Badge>
                      </div>
                      
                      <Progress value={progress} className="h-2" />
                      
                      <div className="text-sm text-muted-foreground">
                        <p>Tax return for period: {accountingPeriod}</p>
                        <p>Filing deadline: 31 Dec {Number(accountingPeriod) + 1}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-40 bg-muted rounded-lg">
                      <p className="text-muted-foreground">
                        Select a company and accounting period to view filing status
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Recent Tax Filings</CardTitle>
              <CardDescription>
                View your recent tax filings and their status
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingCompanies ? (
                <div className="space-y-4">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">Acme Trading Ltd</h4>
                      <p className="text-sm text-muted-foreground">Year ending 31 Dec 2023</p>
                    </div>
                    <Badge variant="success">Submitted</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">Bright Innovations Ltd</h4>
                      <p className="text-sm text-muted-foreground">Year ending 31 Dec 2023</p>
                    </div>
                    <Badge variant="secondary">In Progress</Badge>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Tax Return Tab */}
        <TabsContent value="tax-return">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <CardTitle>
                    {isLoadingCompanies 
                      ? <Skeleton className="h-8 w-56" /> 
                      : selectedCompanyId && companies
                        ? `${Array.isArray(companies) ? companies.find(c => c.id === selectedCompanyId)?.name : "Company"} - ${accountingPeriod} Tax Return`
                        : "Tax Return Preparation"
                    }
                  </CardTitle>
                  <CardDescription>Complete each section to prepare your corporation tax return</CardDescription>
                </div>
                
                <div className="flex items-center gap-2">
                  <Badge className="flex items-center gap-1">
                    <CircleDashed className="h-3 w-3 animate-spin" />
                    {progress}% Complete
                  </Badge>
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-1">
                  <div className="space-y-1">
                    <h3 className="text-lg font-medium mb-4">Sections</h3>
                    
                    {sections.map((section) => (
                      <button
                        key={section.id}
                        className={`w-full text-left px-3 py-2 rounded-md flex items-center justify-between ${activeSection === section.id ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'}`}
                        onClick={() => setActiveSection(section.id)}
                      >
                        <span>{section.name}</span>
                        {section.progress === 100 && <CheckCircle2 className="h-4 w-4" />}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="md:col-span-2 space-y-6">
                  {/* Company Information Section */}
                  {activeSection === "company-info" && (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-medium">Company Information</h3>
                        <Button variant="outline" size="sm" onClick={() => handleSaveSection("company-info")}>
                          <Save className="h-4 w-4 mr-2" />
                          Save
                        </Button>
                      </div>
                      
                      <Separator />
                      
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Company Name</label>
                            <Input 
                              value={Array.isArray(companies) && selectedCompanyId 
                                ? companies.find(c => c.id === selectedCompanyId)?.name || ""
                                : ""
                              } 
                              readOnly
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Company Registration Number</label>
                            <Input 
                              value={Array.isArray(companies) && selectedCompanyId 
                                ? companies.find(c => c.id === selectedCompanyId)?.registrationNumber || ""
                                : ""
                              } 
                              readOnly
                            />
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Accounting Period Start</label>
                            <Input type="date" defaultValue="2023-01-01" />
                          </div>
                          
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Accounting Period End</label>
                            <Input type="date" defaultValue="2023-12-31" />
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 gap-4">
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Tax Reference Number (UTR)</label>
                            <Input placeholder="Enter 10-digit UTR" />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Income Statement Section */}
                  {activeSection === "income-statement" && (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-medium">Income Statement</h3>
                        <Button variant="outline" size="sm" onClick={() => handleSaveSection("income-statement")}>
                          <Save className="h-4 w-4 mr-2" />
                          Save
                        </Button>
                      </div>
                      
                      <Separator />
                      
                      <div className="space-y-6">
                        <div>
                          <h4 className="font-medium mb-3">Income</h4>
                          <div className="space-y-3">
                            <div className="grid grid-cols-3 gap-4">
                              <div className="col-span-2">
                                <label className="text-sm font-medium">Sales/Revenue</label>
                              </div>
                              <div>
                                <Input type="number" placeholder="0.00" />
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-3 gap-4">
                              <div className="col-span-2">
                                <label className="text-sm font-medium">Other Income</label>
                              </div>
                              <div>
                                <Input type="number" placeholder="0.00" />
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <Separator />
                        
                        <div>
                          <h4 className="font-medium mb-3">Expenses</h4>
                          <div className="space-y-3">
                            <div className="grid grid-cols-3 gap-4">
                              <div className="col-span-2">
                                <label className="text-sm font-medium">Cost of Sales</label>
                              </div>
                              <div>
                                <Input type="number" placeholder="0.00" />
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-3 gap-4">
                              <div className="col-span-2">
                                <label className="text-sm font-medium">Administrative Expenses</label>
                              </div>
                              <div>
                                <Input type="number" placeholder="0.00" />
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-3 gap-4">
                              <div className="col-span-2">
                                <label className="text-sm font-medium">Salaries and Wages</label>
                              </div>
                              <div>
                                <Input type="number" placeholder="0.00" />
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-3 gap-4">
                              <div className="col-span-2">
                                <label className="text-sm font-medium">Rent and Rates</label>
                              </div>
                              <div>
                                <Input type="number" placeholder="0.00" />
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-3 gap-4">
                              <div className="col-span-2">
                                <label className="text-sm font-medium">Other Expenses</label>
                              </div>
                              <div>
                                <Input type="number" placeholder="0.00" />
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <Separator />
                        
                        <div className="bg-muted p-4 rounded-lg">
                          <div className="grid grid-cols-3 gap-4">
                            <div className="col-span-2">
                              <label className="font-medium">Net Profit/(Loss) before Tax</label>
                            </div>
                            <div>
                              <p className="font-bold text-right">£0.00</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Other sections would be implemented similarly */}
                  {(activeSection !== "company-info" && activeSection !== "income-statement") && (
                    <div className="flex items-center justify-center h-96 bg-muted rounded-lg">
                      <div className="text-center">
                        <FileSpreadsheet className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                        <h3 className="text-lg font-medium mb-1">{sections.find(s => s.id === activeSection)?.name}</h3>
                        <p className="text-muted-foreground">This section is part of the demo and isn't fully implemented yet.</p>
                        <Button className="mt-4" onClick={() => handleSaveSection(activeSection)}>
                          Mark as Complete
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex justify-between pt-6">
                    <Button 
                      variant="outline" 
                      onClick={handlePreviousSection}
                      disabled={activeSection === sections[0].id}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Previous
                    </Button>
                    
                    <Button 
                      onClick={handleNextSection}
                      disabled={activeSection === sections[sections.length - 1].id}
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Filing History Tab */}
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Tax Filing History</CardTitle>
              <CardDescription>
                View past tax filings and their status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <Select defaultValue="all">
                  <SelectTrigger className="w-full md:w-[250px]">
                    <SelectValue placeholder="Filter by company" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Companies</SelectItem>
                    {Array.isArray(companies) && companies.map((company) => (
                      <SelectItem key={company.id} value={company.id.toString()}>
                        {company.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between bg-muted p-4 rounded-lg">
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Receipt className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-medium">Acme Trading Ltd</h4>
                        <p className="text-sm text-muted-foreground">Corporation Tax Return (Year ending 31 Dec 2022)</p>
                        <p className="text-xs text-muted-foreground mt-1">Filed on 25 Nov 2023</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="success" className="mb-2">Submitted</Badge>
                      <div className="text-sm font-medium">Reference: CT6002023</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between bg-muted p-4 rounded-lg">
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Receipt className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-medium">Bright Innovations Ltd</h4>
                        <p className="text-sm text-muted-foreground">Corporation Tax Return (Year ending 31 Dec 2022)</p>
                        <p className="text-xs text-muted-foreground mt-1">Filed on 15 Oct 2023</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="success" className="mb-2">Submitted</Badge>
                      <div className="text-sm font-medium">Reference: CT6002022</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between bg-muted p-4 rounded-lg">
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Receipt className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-medium">Global Services Ltd</h4>
                        <p className="text-sm text-muted-foreground">Corporation Tax Return (Year ending 31 Dec 2022)</p>
                        <p className="text-xs text-muted-foreground mt-1">Filed on 30 Sep 2023</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="success" className="mb-2">Submitted</Badge>
                      <div className="text-sm font-medium">Reference: CT6002021</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TaxEngine;
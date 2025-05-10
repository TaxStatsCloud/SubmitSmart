import { Helmet } from "react-helmet-async";
import FilingTypeSelector from "@/components/filings/FilingTypeSelector";
import FileUpload from "@/components/filings/FileUpload";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";

const NewFiling = () => {
  const [selectedFilingType, setSelectedFilingType] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("type");
  const [uploadedDocumentIds, setUploadedDocumentIds] = useState<number[]>([]);

  const handleTypeSelection = (type: string) => {
    setSelectedFilingType(type);
    setActiveTab("documents");
  };

  const handleUploadComplete = (documentIds: number[]) => {
    setUploadedDocumentIds(documentIds);
    // If documents uploaded successfully, could auto-advance to next tab
    if (documentIds.length > 0) {
      setActiveTab("review");
    }
  };

  return (
    <>
      <Helmet>
        <title>New Filing | Submitra</title>
        <meta name="description" content="Start a new filing for your company - Confirmation Statement, Annual Accounts, or Corporation Tax Return." />
      </Helmet>

      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-800 mb-2">Create New Filing</h1>
          <p className="text-neutral-600 max-w-3xl">
            Select the type of filing you need to prepare and upload the relevant documents. Our AI will help generate a draft for your review.
          </p>
        </div>

        <Card className="shadow-sm border-neutral-200">
          <CardHeader>
            <CardTitle>Filing Preparation</CardTitle>
            <CardDescription>
              Follow the steps below to prepare your filing for submission.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-8">
                <TabsTrigger value="type" className="data-[state=active]:bg-[hsl(var(--primary-50))] data-[state=active]:text-[hsl(var(--primary-600))]">
                  <span className="material-icons mr-2 text-sm">description</span>
                  Filing Type
                </TabsTrigger>
                <TabsTrigger 
                  value="documents" 
                  disabled={!selectedFilingType}
                  className="data-[state=active]:bg-[hsl(var(--primary-50))] data-[state=active]:text-[hsl(var(--primary-600))]"
                >
                  <span className="material-icons mr-2 text-sm">upload_file</span>
                  Upload Documents
                </TabsTrigger>
                <TabsTrigger 
                  value="review" 
                  disabled={!selectedFilingType || uploadedDocumentIds.length === 0}
                  className="data-[state=active]:bg-[hsl(var(--primary-50))] data-[state=active]:text-[hsl(var(--primary-600))]"
                >
                  <span className="material-icons mr-2 text-sm">rate_review</span>
                  Review & Submit
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="type">
                <FilingTypeSelector 
                  onSelect={handleTypeSelection} 
                  showStartButton={false}
                />
              </TabsContent>
              
              <TabsContent value="documents">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-neutral-800">Upload Supporting Documents</h3>
                  <p className="text-neutral-600">
                    Upload the relevant financial documents for your {selectedFilingType?.replace('_', ' ')}. This helps our AI generate an accurate draft.
                  </p>
                  <FileUpload onUploadComplete={handleUploadComplete} />
                </div>
              </TabsContent>
              
              <TabsContent value="review">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-neutral-800">Review Filing Details</h3>
                  <p className="text-neutral-600">
                    Your documents are being processed. Once completed, you'll be able to review the generated filing draft here.
                  </p>
                  
                  <div className="p-8 bg-neutral-50 rounded-lg border border-neutral-200 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[hsl(var(--primary-100))] mb-4">
                      <span className="material-icons text-[hsl(var(--primary-500))] text-3xl">hourglass_empty</span>
                    </div>
                    <h4 className="text-lg font-medium text-neutral-800 mb-2">Processing Documents</h4>
                    <p className="text-neutral-600 max-w-md mx-auto">
                      Our AI is analyzing your documents to prepare your filing. This usually takes 2-5 minutes, depending on document complexity.
                    </p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default NewFiling;

import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useDocuments } from "@/hooks/use-documents";

interface FileUploadProps {
  onUploadComplete?: (documentIds: number[]) => void;
}

const FileUpload = ({ onUploadComplete }: FileUploadProps) => {
  const { toast } = useToast();
  const { uploadDocument, isUploading } = useDocuments();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [documentType, setDocumentType] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      setSelectedFiles(filesArray);
    }
  };
  
  const handleUpload = async () => {
    if (!selectedFiles.length) {
      toast({
        title: "No files selected",
        description: "Please select at least one file to upload.",
        variant: "destructive",
      });
      return;
    }
    
    if (!documentType) {
      toast({
        title: "Document type required",
        description: "Please select the type of document you are uploading.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const uploadedDocIds: number[] = [];
      
      for (const file of selectedFiles) {
        const documentId = await uploadDocument(file, documentType);
        if (documentId) {
          uploadedDocIds.push(documentId);
        }
      }
      
      toast({
        title: "Upload successful",
        description: `Successfully uploaded ${uploadedDocIds.length} document(s).`,
      });
      
      setSelectedFiles([]);
      setDocumentType("");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      
      if (onUploadComplete) {
        onUploadComplete(uploadedDocIds);
      }
    } catch (error) {
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "An unknown error occurred during upload.",
        variant: "destructive",
      });
    }
  };
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setSelectedFiles(Array.from(e.dataTransfer.files));
    }
  };
  
  return (
    <Card className="shadow-sm border-neutral-200">
      <CardHeader>
        <CardTitle>Upload Documents</CardTitle>
        <CardDescription>
          Upload your financial documents for AI-powered processing and filing preparation.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <Label htmlFor="document-type">Document Type</Label>
            <Select
              value={documentType}
              onValueChange={setDocumentType}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select document type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="trial_balance">Trial Balance</SelectItem>
                <SelectItem value="invoice">Invoice</SelectItem>
                <SelectItem value="bank_statement">Bank Statement</SelectItem>
                <SelectItem value="accounting_export">Accounting Export (CSV/Excel)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div 
            className="border-2 border-dashed border-neutral-200 rounded-lg p-8 text-center"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <Input
              ref={fileInputRef}
              id="file-upload"
              type="file"
              multiple
              className="hidden"
              onChange={handleFileChange}
            />
            
            <div className="space-y-2">
              <div className="flex justify-center">
                <span className="material-icons text-4xl text-neutral-400">upload_file</span>
              </div>
              <div className="text-sm text-neutral-600">
                <p>Drag and drop your files here, or</p>
                <Button 
                  variant="outline" 
                  className="mt-2"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Browse Files
                </Button>
              </div>
              <p className="text-xs text-neutral-500">
                Supported formats: PDF, XLS, XLSX, CSV
              </p>
            </div>
          </div>
          
          {selectedFiles.length > 0 && (
            <div className="mt-4">
              <Label>Selected Files</Label>
              <ul className="mt-2 space-y-2 text-sm">
                {selectedFiles.map((file, index) => (
                  <li key={index} className="flex items-center justify-between p-2 border rounded">
                    <div className="flex items-center">
                      <span className="material-icons mr-2 text-neutral-500">description</span>
                      <span className="truncate max-w-[200px]">{file.name}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const newFiles = [...selectedFiles];
                        newFiles.splice(index, 1);
                        setSelectedFiles(newFiles);
                      }}
                    >
                      <span className="material-icons text-neutral-500">close</span>
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button
          onClick={handleUpload}
          disabled={isUploading || selectedFiles.length === 0 || !documentType}
          className="bg-[hsl(var(--primary-500))] hover:bg-[hsl(var(--primary-600))]"
        >
          {isUploading ? (
            <>
              <span className="material-icons animate-spin mr-2">refresh</span>
              Uploading...
            </>
          ) : (
            <>
              <span className="material-icons mr-2">cloud_upload</span>
              Upload Files
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default FileUpload;

import { useState } from "react";
import { useDocuments } from "@/hooks/use-documents";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { FileText, Upload, CheckCircle2, AlertTriangle, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import FileUpload from "./FileUpload";

interface DocumentSelectorProps {
  selectedDocumentIds: number[];
  onSelectionChange: (documentIds: number[]) => void;
  filingType?: "annual_accounts" | "ct600" | "confirmation_statement";
  recommendedTypes?: string[];
}

export function DocumentSelector({
  selectedDocumentIds,
  onSelectionChange,
  filingType,
  recommendedTypes = [],
}: DocumentSelectorProps) {
  const { documents, isLoading } = useDocuments();
  const [showUploadDialog, setShowUploadDialog] = useState(false);

  const handleToggleDocument = (docId: number) => {
    if (selectedDocumentIds.includes(docId)) {
      onSelectionChange(selectedDocumentIds.filter((id) => id !== docId));
    } else {
      onSelectionChange([...selectedDocumentIds, docId]);
    }
  };

  const handleUploadComplete = (newDocIds: number[]) => {
    // Auto-select newly uploaded documents
    onSelectionChange([...selectedDocumentIds, ...newDocIds]);
    setShowUploadDialog(false);
  };

  const getDocumentTypeLabel = (type: string) => {
    return type
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const getRecommendationLevel = (docType: string) => {
    if (recommendedTypes.includes(docType)) return "recommended";
    return "optional";
  };

  const getFilingTypeGuidance = () => {
    switch (filingType) {
      case "annual_accounts":
        return {
          title: "Annual Accounts Documentation",
          description:
            "Attach source documents that support your financial statements. This creates a complete audit trail.",
          recommended: [
            "Trial Balance showing all account balances",
            "Bank statements for reconciliation",
            "Invoice records for revenue verification",
            "Expense receipts for deductions",
          ],
        };
      case "ct600":
        return {
          title: "CT600 Tax Return Documentation",
          description:
            "Attach documents that support your Corporation Tax computation and deductions.",
          recommended: [
            "Annual Accounts or management accounts",
            "Capital allowances calculations",
            "R&D relief calculations (if applicable)",
            "Charitable donations evidence",
          ],
        };
      case "confirmation_statement":
        return {
          title: "Confirmation Statement Documentation",
          description:
            "Attach documents that verify the information in your CS01 filing.",
          recommended: [
            "Share register or share certificates",
            "PSC register with ownership details",
            "Board minutes approving changes",
            "Updated Articles of Association (if changed)",
          ],
        };
      default:
        return {
          title: "Supporting Documentation",
          description: "Attach documents that support this filing.",
          recommended: [],
        };
    }
  };

  const guidance = getFilingTypeGuidance();
  const sortedDocuments = [...documents].sort(
    (a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
  );

  return (
    <Card className="p-6">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {guidance.title}
            </h3>
            <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" data-testid="button-upload-new-document">
                  <Plus className="h-4 w-4 mr-2" />
                  Upload New Document
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Upload Supporting Documents</DialogTitle>
                  <DialogDescription>{guidance.description}</DialogDescription>
                </DialogHeader>
                <FileUpload onUploadComplete={handleUploadComplete} />
              </DialogContent>
            </Dialog>
          </div>
          <p className="text-sm text-muted-foreground">{guidance.description}</p>
        </div>

        {/* Guidance */}
        {guidance.recommended.length > 0 && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <p className="font-semibold mb-2">Recommended Documents:</p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                {guidance.recommended.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        <Separator />

        {/* Document List */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium">Select Documents ({selectedDocumentIds.length} selected)</h4>
            {selectedDocumentIds.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onSelectionChange([])}
                data-testid="button-clear-selection"
              >
                Clear Selection
              </Button>
            )}
          </div>

          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading documents...</div>
          ) : sortedDocuments.length === 0 ? (
            <div className="text-center py-8">
              <Upload className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
              <p className="text-muted-foreground mb-4">No documents uploaded yet</p>
              <Button variant="outline" onClick={() => setShowUploadDialog(true)} data-testid="button-upload-first-document">
                <Plus className="h-4 w-4 mr-2" />
                Upload Your First Document
              </Button>
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {sortedDocuments.map((doc) => {
                const isSelected = selectedDocumentIds.includes(doc.id);
                const recommendationLevel = getRecommendationLevel(doc.type);

                return (
                  <div
                    key={doc.id}
                    className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                      isSelected
                        ? "border-primary bg-primary/5"
                        : "border-border hover:bg-muted/50"
                    }`}
                    data-testid={`document-item-${doc.id}`}
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => handleToggleDocument(doc.id)}
                      className="mt-1"
                      data-testid={`checkbox-document-${doc.id}`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-sm truncate">{doc.name}</p>
                        {recommendationLevel === "recommended" && (
                          <Badge variant="secondary" className="text-xs">
                            Recommended
                          </Badge>
                        )}
                        {doc.processingStatus === "completed" && (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Badge variant="outline" className="text-xs">
                          {getDocumentTypeLabel(doc.type)}
                        </Badge>
                        <span>•</span>
                        <span>
                          {new Date(doc.uploadedAt).toLocaleDateString("en-GB")}
                        </span>
                        <span>•</span>
                        <span>{(doc.size / 1024).toFixed(1)} KB</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Selected Summary */}
        {selectedDocumentIds.length > 0 && (
          <>
            <Separator />
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                <strong>{selectedDocumentIds.length} document(s) selected</strong> and will be
                attached to this filing for audit trail purposes.
              </AlertDescription>
            </Alert>
          </>
        )}
      </div>
    </Card>
  );
}

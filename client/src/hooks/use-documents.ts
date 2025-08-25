import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Document, InsertDocument } from "@shared/schema";
import { useToast } from "./use-toast";

interface UseDocumentsReturn {
  documents: Document[];
  recentDocuments: Document[];
  isLoading: boolean;
  isUploading: boolean;
  uploadDocument: (file: File, type: string) => Promise<number>;
  deleteDocument: (id: number) => Promise<void>;
  processDocument: (id: number) => Promise<Document>;
}

export function useDocuments(): UseDocumentsReturn {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isUploading, setIsUploading] = useState(false);

  // Fetch all documents
  const { data: documents = [], isLoading } = useQuery({
    queryKey: ['/api/documents'],
    refetchOnWindowFocus: true,
  });

  // Get recent documents (last 5)
  const recentDocuments = (documents && Array.isArray(documents))
    ? [...documents]
        .sort((a: Document, b: Document) => 
          new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())
        .slice(0, 5)
    : [];

  // Upload a document
  const uploadDocument = async (file: File, type: string): Promise<number> => {
    setIsUploading(true);
    try {
      // Create a FormData object to send the file
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);
      
      // Use fetch directly for FormData
      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || response.statusText);
      }
      
      const result = await response.json();
      
      // Invalidate the documents query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
      
      toast({
        title: "Document uploaded",
        description: "Your document has been uploaded successfully.",
      });
      
      return result.id;
    } catch (error) {
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred.",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  // Delete a document
  const deleteDocumentMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/documents/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
      toast({
        title: "Document deleted",
        description: "Your document has been deleted successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error deleting document",
        description: error instanceof Error ? error.message : "An unexpected error occurred.",
        variant: "destructive",
      });
    },
  });

  // Process a document
  const processDocumentMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('POST', `/api/documents/${id}/process`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
      toast({
        title: "Document processed",
        description: "Your document has been processed successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error processing document",
        description: error instanceof Error ? error.message : "An unexpected error occurred.",
        variant: "destructive",
      });
    },
  });

  return {
    documents: Array.isArray(documents) ? documents : [],
    recentDocuments,
    isLoading,
    isUploading,
    uploadDocument,
    deleteDocument: (id: number) => deleteDocumentMutation.mutateAsync(id),
    processDocument: (id: number) => processDocumentMutation.mutateAsync(id),
  };
}

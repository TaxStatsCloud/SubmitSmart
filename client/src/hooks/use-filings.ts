import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Filing, InsertFiling } from "@shared/schema";
import { useToast } from "./use-toast";

interface FilingWithCompanyName extends Filing {
  company: string;
}

interface UseFilingsReturn {
  upcomingFilings: FilingWithCompanyName[];
  draftFilings: {
    id: number;
    title: string;
    lastUpdated: string;
    progress: number;
  }[];
  isLoading: boolean;
  createFiling: (filing: InsertFiling) => Promise<Filing>;
  updateFiling: (id: number, filing: Partial<Filing>) => Promise<Filing>;
  deleteFiling: (id: number) => Promise<void>;
  submitFiling: (id: number) => Promise<Filing>;
}

export function useFilings(): UseFilingsReturn {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [upcomingFilings, setUpcomingFilings] = useState<FilingWithCompanyName[]>([]);
  const [draftFilings, setDraftFilings] = useState<{
    id: number;
    title: string;
    lastUpdated: string;
    progress: number;
  }[]>([]);

  // Fetch filings
  const { data: filings, isLoading } = useQuery({
    queryKey: ['/api/filings'],
    refetchOnWindowFocus: true,
  });

  // Create a new filing
  const createFilingMutation = useMutation({
    mutationFn: async (filing: InsertFiling) => {
      const response = await apiRequest('POST', '/api/filings', filing);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/filings'] });
      toast({
        title: "Filing created",
        description: "Your filing has been created successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error creating filing",
        description: error instanceof Error ? error.message : "An unexpected error occurred.",
        variant: "destructive",
      });
    },
  });

  // Update a filing
  const updateFilingMutation = useMutation({
    mutationFn: async ({ id, filing }: { id: number, filing: Partial<Filing> }) => {
      const response = await apiRequest('PATCH', `/api/filings/${id}`, filing);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/filings'] });
      toast({
        title: "Filing updated",
        description: "Your filing has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error updating filing",
        description: error instanceof Error ? error.message : "An unexpected error occurred.",
        variant: "destructive",
      });
    },
  });

  // Delete a filing
  const deleteFilingMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/filings/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/filings'] });
      toast({
        title: "Filing deleted",
        description: "Your filing has been deleted successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error deleting filing",
        description: error instanceof Error ? error.message : "An unexpected error occurred.",
        variant: "destructive",
      });
    },
  });

  // Submit a filing
  const submitFilingMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('POST', `/api/filings/${id}/submit`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/filings'] });
      toast({
        title: "Filing submitted",
        description: "Your filing has been submitted successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error submitting filing",
        description: error instanceof Error ? error.message : "An unexpected error occurred.",
        variant: "destructive",
      });
    },
  });

  // Process the filings data when it changes
  useEffect(() => {
    if (!filings) return;

    // Transform data for upcoming filings
    const upcoming = filings
      .filter((filing: Filing & { companyName?: string }) => 
        filing.status !== 'submitted' && filing.dueDate)
      .map((filing: Filing & { companyName?: string }) => ({
        ...filing,
        company: filing.companyName || 'Unknown Company',
      }))
      .sort((a: Filing, b: Filing) => 
        new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime());

    setUpcomingFilings(upcoming);

    // Transform data for draft filings
    const drafts = filings
      .filter((filing: Filing & { companyName?: string }) => 
        filing.status === 'draft' || filing.status === 'in_progress')
      .map((filing: Filing & { companyName?: string }) => ({
        id: filing.id,
        title: `${filing.type.replace('_', ' ')} - ${filing.companyName || 'Unknown Company'}`,
        lastUpdated: getRelativeTimeString(new Date(filing.updatedAt)),
        progress: filing.progress || 0,
      }));

    setDraftFilings(drafts);
  }, [filings]);

  // Helper function to format relative time
  function getRelativeTimeString(date: Date): string {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return "Today";
    } else if (diffDays === 1) {
      return "Yesterday";
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else if (diffDays < 30) {
      return `${Math.floor(diffDays / 7)} weeks ago`;
    } else {
      return `${Math.floor(diffDays / 30)} months ago`;
    }
  }

  return {
    upcomingFilings,
    draftFilings,
    isLoading,
    createFiling: (filing: InsertFiling) => createFilingMutation.mutateAsync(filing),
    updateFiling: (id: number, filing: Partial<Filing>) => 
      updateFilingMutation.mutateAsync({ id, filing }),
    deleteFiling: (id: number) => deleteFilingMutation.mutateAsync(id),
    submitFiling: (id: number) => submitFilingMutation.mutateAsync(id),
  };
}

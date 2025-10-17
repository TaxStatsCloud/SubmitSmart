import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { AssistantMessage } from "@shared/schema";
import { useToast } from "./use-toast";
import { useAuth } from "@/hooks/use-auth";

interface UseAssistantReturn {
  messages: AssistantMessage[];
  isLoading: boolean;
  sendMessage: (content: string) => Promise<AssistantMessage>;
  clearHistory: () => Promise<void>;
}

export function useAssistant(): UseAssistantReturn {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // Fetch chat history
  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['/api/assistant/messages'],
    enabled: !!user, // Only run query if user is authenticated
  });
  
  // Send a message to the assistant
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await apiRequest('POST', '/api/assistant/messages', { content });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/assistant/messages'] });
    },
    onError: (error) => {
      toast({
        title: "Failed to send message",
        description: error instanceof Error ? error.message : "An unexpected error occurred.",
        variant: "destructive",
      });
    },
  });
  
  // Clear chat history
  const clearHistoryMutation = useMutation({
    mutationFn: async () => {
      await apiRequest('DELETE', '/api/assistant/messages');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/assistant/messages'] });
      toast({
        title: "Chat history cleared",
        description: "Your conversation history has been cleared.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to clear history",
        description: error instanceof Error ? error.message : "An unexpected error occurred.",
        variant: "destructive",
      });
    },
  });
  
  return {
    messages: messages || [],
    isLoading,
    sendMessage: (content: string) => sendMessageMutation.mutateAsync(content),
    clearHistory: () => clearHistoryMutation.mutateAsync(),
  };
}

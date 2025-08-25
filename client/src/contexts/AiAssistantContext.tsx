import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { AssistantMessage } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "./AuthContext";
import { useToast } from "@/hooks/use-toast";

interface AiAssistantContextType {
  isAssistantOpen: boolean;
  isMinimized: boolean;
  messages: AssistantMessage[];
  toggleAssistant: () => void;
  closeAssistant: () => void;
  minimizeAssistant: () => void;
  sendMessage: (content: string) => Promise<void>;
}

interface AiAssistantProviderProps {
  children: ReactNode;
}

const AiAssistantContext = createContext<AiAssistantContextType | undefined>(undefined);

export const AiAssistantProvider = ({ children }: AiAssistantProviderProps) => {
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  // Load chat history when assistant is opened
  useEffect(() => {
    if (isAssistantOpen && user) {
      fetchChatHistory().catch((error) => {
        console.error('Failed to load chat history in useEffect:', error);
        // Don't crash the component on chat history failure
      });
    }
  }, [isAssistantOpen, user]);

  const fetchChatHistory = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      const response = await apiRequest("GET", "/api/assistant/messages");
      const data = await response.json();
      setMessages(data);
    } catch (error) {
      console.error("Failed to load chat history:", error);
      // Don't show toast for this error as it's not critical
    } finally {
      setIsLoading(false);
    }
  };

  const toggleAssistant = () => {
    if (isMinimized) {
      setIsMinimized(false);
      setIsAssistantOpen(true);
    } else {
      setIsAssistantOpen(!isAssistantOpen);
    }
  };

  const closeAssistant = () => {
    setIsAssistantOpen(false);
    setIsMinimized(false);
  };

  const minimizeAssistant = () => {
    setIsMinimized(!isMinimized);
  };

  const sendMessage = async (content: string) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to use the AI assistant.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Optimistically add user message to UI
      const userMessage: AssistantMessage = {
        id: Date.now(), // Temporary ID
        userId: parseInt(user.uid) || 1, // TODO: Fix Firebase-to-DB user mapping
        role: "user",
        content,
        createdAt: new Date(),
        metadata: {}
      };
      
      setMessages(prev => [...prev, userMessage]);
      
      // Send to backend
      const response = await apiRequest("POST", "/api/assistant/messages", {
        content,
      });
      
      // Get assistant's response
      const assistantMessage = await response.json();
      
      // Add assistant message to UI
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      toast({
        title: "Message failed",
        description: error instanceof Error ? error.message : "Failed to send message to assistant.",
        variant: "destructive",
      });
    }
  };

  return (
    <AiAssistantContext.Provider
      value={{
        isAssistantOpen,
        isMinimized,
        messages,
        toggleAssistant,
        closeAssistant,
        minimizeAssistant,
        sendMessage,
      }}
    >
      {children}
    </AiAssistantContext.Provider>
  );
};

export const useAiAssistant = () => {
  const context = useContext(AiAssistantContext);
  if (context === undefined) {
    throw new Error("useAiAssistant must be used within an AiAssistantProvider");
  }
  return context;
};

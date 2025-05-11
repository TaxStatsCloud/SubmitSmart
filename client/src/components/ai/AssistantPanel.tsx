import { useState, useRef, useEffect } from "react";
import { useAiAssistant } from "@/contexts/AiAssistantContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AssistantMessage } from "@shared/schema";

const AssistantPanel = () => {
  const { closeAssistant, minimizeAssistant, isMinimized, messages, sendMessage } = useAiAssistant();
  const { user } = useAuth();
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim()) return;
    
    sendMessage(input);
    setInput("");
  };

  if (isMinimized) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <Button 
          onClick={minimizeAssistant}
          className="rounded-full w-14 h-14 bg-[hsl(var(--primary-500))] hover:bg-[hsl(var(--primary-600))] shadow-lg flex items-center justify-center"
        >
          <span className="material-icons text-white">smart_toy</span>
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div className="w-96 bg-white rounded-lg shadow-xl border border-neutral-200 overflow-hidden flex flex-col" style={{ height: "500px" }}>
        {/* Assistant Header */}
        <div className="bg-[hsl(var(--primary-500))] p-4 flex items-center justify-between">
          <div className="flex items-center">
            <span className="material-icons text-white mr-2">smart_toy</span>
            <h3 className="text-white font-semibold">PromptSubmissions Assistant</h3>
          </div>
          <div>
            <button 
              className="text-white p-1 rounded hover:bg-[hsl(var(--primary-600))]"
              onClick={minimizeAssistant}
            >
              <span className="material-icons">remove</span>
            </button>
            <button 
              className="text-white p-1 rounded hover:bg-[hsl(var(--primary-600))]" 
              onClick={closeAssistant}
            >
              <span className="material-icons">close</span>
            </button>
          </div>
        </div>
        
        {/* Chat Messages */}
        <div className="flex-1 p-4 overflow-y-auto bg-neutral-50">
          {/* Welcome message if no messages */}
          {messages.length === 0 && (
            <div className="flex mb-4">
              <div className="w-8 h-8 rounded-full bg-[hsl(var(--primary-100))] flex items-center justify-center flex-shrink-0 mr-2">
                <span className="material-icons text-[hsl(var(--primary-500))] text-sm">smart_toy</span>
              </div>
              <div className="bg-white rounded-lg p-3 shadow-sm border border-neutral-200 max-w-[80%]">
                <p className="text-sm text-neutral-800">
                  Hello {user?.fullName?.split(' ')[0] || 'there'}! I'm your PromptSubmissions Assistant. I can help you prepare your filings, answer compliance questions, or guide you through the platform. What would you like help with today?
                </p>
              </div>
            </div>
          )}

          {/* Actual message history */}
          {messages.map((message, index) => (
            <div 
              key={message.id || index}
              className={`flex mb-4 ${message.role === 'user' ? 'justify-end' : ''}`}
            >
              {message.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-[hsl(var(--primary-100))] flex items-center justify-center flex-shrink-0 mr-2">
                  <span className="material-icons text-[hsl(var(--primary-500))] text-sm">smart_toy</span>
                </div>
              )}
              
              <div className={`${
                message.role === 'user' 
                  ? 'bg-[hsl(var(--primary-500))] text-white'
                  : 'bg-white text-neutral-800 border border-neutral-200'
              } rounded-lg p-3 shadow-sm max-w-[80%]`}>
                <div className="text-sm whitespace-pre-wrap">{message.content}</div>
              </div>
              
              {message.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-neutral-200 flex items-center justify-center flex-shrink-0 ml-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user?.profileImage || ""} alt={user?.fullName || ""} />
                    <AvatarFallback>{user?.fullName?.charAt(0) || "U"}</AvatarFallback>
                  </Avatar>
                </div>
              )}
            </div>
          ))}
          
          <div ref={messagesEndRef} />
        </div>
        
        {/* Input Area */}
        <div className="p-3 border-t border-neutral-200 bg-white">
          <form className="flex" onSubmit={handleSubmit}>
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question..."
              className="flex-1 border-neutral-300 rounded-l-md focus:ring-2 focus:ring-[hsl(var(--primary-500))] focus:border-[hsl(var(--primary-500))]"
            />
            <Button 
              type="submit" 
              className="bg-[hsl(var(--primary-500))] text-white px-4 rounded-r-md hover:bg-[hsl(var(--primary-600))]"
            >
              <span className="material-icons">send</span>
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AssistantPanel;

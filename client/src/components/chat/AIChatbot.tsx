import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  MessageCircle, 
  Send, 
  Minimize2, 
  Maximize2, 
  X, 
  Bot, 
  User,
  Sparkles,
  HelpCircle,
  FileText,
  Calculator,
  Building2
} from 'lucide-react';
import { aiChatbotService, ChatMessage } from '@/services/aiChatbotService';
import { cn } from '@/lib/utils';

interface AIChatbotProps {
  className?: string;
}

export function AIChatbot({ className }: AIChatbotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    setIsLoading(true);

    // Add user message to display
    setMessages(prev => [...prev, {
      role: 'user',
      content: userMessage,
      timestamp: new Date()
    }]);

    try {
      const response = await aiChatbotService.sendMessage(userMessage);
      
      // Add assistant response to display
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: response,
        timestamp: new Date()
      }]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'I apologize, but I encountered an error. Please try again or contact support.',
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const quickResponses = aiChatbotService.getQuickResponses();

  const handleQuickResponse = (question: string) => {
    setInputMessage(question);
    inputRef.current?.focus();
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-GB', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className={cn(
          "fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-300 hover:scale-110 z-50",
          className
        )}
      >
        <MessageCircle className="h-6 w-6" />
      </Button>
    );
  }

  return (
    <Card className={cn(
      "fixed bottom-6 right-6 w-96 h-[600px] shadow-2xl border-0 bg-white/95 backdrop-blur-sm z-50 transition-all duration-300",
      isMinimized && "h-16",
      className
    )}>
      <CardHeader className="flex flex-row items-center justify-between p-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/20 rounded-full">
            <Bot className="h-4 w-4" />
          </div>
          <div>
            <CardTitle className="text-sm font-semibold">AI Compliance Assistant</CardTitle>
            <p className="text-xs text-blue-100">UK Tax & Accounting Expert</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMinimized(!isMinimized)}
            className="h-8 w-8 p-0 hover:bg-white/20 text-white"
          >
            {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(false)}
            className="h-8 w-8 p-0 hover:bg-white/20 text-white"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      {!isMinimized && (
        <CardContent className="p-0 flex flex-col h-[536px]">
          <ScrollArea className="flex-1 p-4">
            {messages.length === 0 ? (
              <div className="space-y-4">
                <div className="text-center text-gray-500 mb-6">
                  <Sparkles className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                  <p className="text-sm">Hi! I'm your AI compliance assistant.</p>
                  <p className="text-xs">Ask me about UK accounting, tax rules, or how to use the platform.</p>
                </div>
                
                {/* AI Disclaimer - Most Urgent */}
                <div className="mb-4 bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <HelpCircle className="text-amber-600 h-4 w-4 mt-0.5 flex-shrink-0" />
                    <div className="text-xs text-amber-900">
                      <p className="font-semibold mb-1">Important Disclaimer</p>
                      <p className="mb-2">
                        This AI provides <strong>general guidance only</strong> and is not a substitute for professional accounting, tax, or legal advice.
                      </p>
                      <p className="mb-2">
                        While we strive for accuracy, AI-generated information may contain errors. <strong>Always verify critical information</strong> with a qualified professional before making filing decisions.
                      </p>
                      <p>
                        For complex matters, consult a chartered accountant, tax advisor, or solicitor. We are not liable for decisions made based on AI-generated content.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <p className="text-xs font-medium text-gray-700 mb-3">Quick questions:</p>
                  {quickResponses.slice(0, 3).map((item, idx) => (
                    <Button
                      key={idx}
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuickResponse(item.question)}
                      className="w-full justify-start text-left h-auto p-3 text-xs"
                    >
                      <HelpCircle className="h-3 w-3 mr-2 flex-shrink-0" />
                      {item.question}
                    </Button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      "flex gap-3",
                      message.role === 'user' ? 'justify-end' : 'justify-start'
                    )}
                  >
                    {message.role === 'assistant' && (
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="bg-blue-100 text-blue-600">
                          <Bot className="h-3 w-3" />
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div
                      className={cn(
                        "max-w-[75%] rounded-lg px-3 py-2 text-sm",
                        message.role === 'user'
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100 text-gray-900"
                      )}
                    >
                      <p className="whitespace-pre-wrap">{message.content}</p>
                      <p className={cn(
                        "text-xs mt-1",
                        message.role === 'user' ? "text-blue-100" : "text-gray-500"
                      )}>
                        {formatTime(message.timestamp)}
                      </p>
                    </div>
                    {message.role === 'user' && (
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="bg-blue-600 text-white">
                          <User className="h-3 w-3" />
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                ))}
                
                {isLoading && (
                  <div className="flex gap-3 justify-start">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="bg-blue-100 text-blue-600">
                        <Bot className="h-3 w-3" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="bg-gray-100 text-gray-900 rounded-lg px-3 py-2 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="animate-pulse">Thinking...</div>
                        <div className="flex space-x-1">
                          <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce"></div>
                          <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
            )}
          </ScrollArea>

          <div className="border-t p-4 bg-gray-50">
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about UK compliance, tax rules, or platform features..."
                className="flex-1 text-sm"
                disabled={isLoading}
              />
              <Button
                onClick={handleSendMessage}
                disabled={isLoading || !inputMessage.trim()}
                className="bg-blue-600 hover:bg-blue-700"
                size="sm"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="flex items-center gap-2 mt-3">
              <Badge variant="secondary" className="text-xs">
                <FileText className="h-3 w-3 mr-1" />
                Filings
              </Badge>
              <Badge variant="secondary" className="text-xs">
                <Calculator className="h-3 w-3 mr-1" />
                Tax Rules
              </Badge>
              <Badge variant="secondary" className="text-xs">
                <Building2 className="h-3 w-3 mr-1" />
                Companies House
              </Badge>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
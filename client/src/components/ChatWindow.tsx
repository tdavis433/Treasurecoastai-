import { X, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface Message {
  role: "assistant" | "user";
  content: string;
}

interface ChatWindowProps {
  isOpen: boolean;
  onClose: () => void;
  messages: Message[];
  onSendMessage: (message: string) => void;
  onMenuClick: (option: string) => void;
  isLoading: boolean;
  showMenu: boolean;
}

const menuOptions = [
  { id: "about", label: "About" },
  { id: "requirements", label: "Requirements" },
  { id: "availability", label: "Availability" },
  { id: "pricing", label: "Pricing" },
  { id: "apply", label: "Apply Now" },
  { id: "tour", label: "Request Tour/Call" },
  { id: "crisis", label: "Crisis Support" },
  { id: "contact", label: "Contact Info" },
];

export default function ChatWindow({
  isOpen,
  onClose,
  messages,
  onSendMessage,
  onMenuClick,
  isLoading,
  showMenu,
}: ChatWindowProps) {
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (inputValue.trim() && !isLoading) {
      onSendMessage(inputValue);
      setInputValue("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      data-testid="chat-window"
      className={cn(
        "fixed bottom-5 right-5 z-50 flex flex-col bg-background rounded-2xl shadow-xl border border-border transition-all duration-300",
        "w-[360px] h-[600px] max-h-[90vh]",
        "md:w-[360px]",
        "sm:w-[94vw] sm:right-[3vw]"
      )}
    >
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div>
          <h2 className="text-lg font-semibold text-foreground" data-testid="text-chat-title">
            HopeLine Assistant
          </h2>
          <p className="text-sm text-muted-foreground">
            Here to support your next step
          </p>
        </div>
        <Button
          data-testid="button-close-chat"
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-8 w-8"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((message, index) => (
          <div
            key={index}
            className={cn(
              "flex",
              message.role === "user" ? "justify-end" : "justify-start"
            )}
          >
            <div
              data-testid={`message-${message.role}-${index}`}
              className={cn(
                "max-w-[80%] rounded-xl p-3 text-sm",
                message.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-card text-card-foreground shadow-sm"
              )}
            >
              {message.content}
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-card text-card-foreground rounded-xl p-3 text-sm shadow-sm">
              <span className="inline-flex gap-1">
                <span className="animate-bounce">.</span>
                <span className="animate-bounce" style={{ animationDelay: "0.2s" }}>.</span>
                <span className="animate-bounce" style={{ animationDelay: "0.4s" }}>.</span>
              </span>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {showMenu && (
        <div className="px-4 pb-3">
          <div className="grid grid-cols-2 gap-2">
            {menuOptions.map((option) => (
              <Button
                key={option.id}
                data-testid={`button-menu-${option.id}`}
                variant="outline"
                size="sm"
                onClick={() => onMenuClick(option.id)}
                className="rounded-full text-xs font-medium hover-elevate"
              >
                {option.label}
              </Button>
            ))}
          </div>
        </div>
      )}

      <div className="p-4 border-t border-border">
        <div className="flex gap-2">
          <Input
            data-testid="input-chat-message"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            className="flex-1 rounded-lg"
            disabled={isLoading}
          />
          <Button
            data-testid="button-send-message"
            onClick={handleSend}
            disabled={!inputValue.trim() || isLoading}
            size="icon"
            className="rounded-lg"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

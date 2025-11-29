import { X, Send, Languages, RotateCcw, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect, useRef, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface Message {
  role: "assistant" | "user";
  content: string;
  suggestedReplies?: string[];
}

interface QuickAction {
  id: string;
  label: string;
  labelEs?: string;
  prompt?: string;
}

interface ChatWindowProps {
  isOpen: boolean;
  onClose: () => void;
  messages: Message[];
  onSendMessage: (message: string) => void;
  onMenuClick: (option: string) => void;
  isLoading: boolean;
  showMenu: boolean;
  language: string;
  onLanguageToggle: () => void;
  onResetChat: () => void;
  flowContent?: ReactNode;
  botName?: string;
  botTagline?: string;
  quickActions?: QuickAction[];
  onHumanHandoff?: () => void;
  showHumanHandoff?: boolean;
}

const defaultQuickActions: QuickAction[] = [
  { id: "services", label: "Our Services", labelEs: "Nuestros Servicios" },
  { id: "pricing", label: "Pricing", labelEs: "Precios" },
  { id: "hours", label: "Hours & Location", labelEs: "Horario y Ubicación" },
  { id: "contact", label: "Contact Us", labelEs: "Contáctenos" },
  { id: "appointment", label: "Book Appointment", labelEs: "Reservar Cita" },
  { id: "faq", label: "FAQs", labelEs: "Preguntas Frecuentes" },
];

export default function ChatWindow({
  isOpen,
  onClose,
  messages,
  onSendMessage,
  onMenuClick,
  isLoading,
  showMenu,
  language,
  onLanguageToggle,
  onResetChat,
  flowContent,
  botName = "AI Assistant",
  botTagline,
  quickActions = defaultQuickActions,
  onHumanHandoff,
  showHumanHandoff = false,
}: ChatWindowProps) {
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const isInitialState = messages.length === 1;
  
  const currentQuickActions = quickActions.map(action => ({
    id: action.id,
    label: language === "es" && action.labelEs ? action.labelEs : action.label,
    prompt: action.prompt
  }));

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
        "chat-window-position fixed z-[9999] flex flex-col bg-background rounded-2xl shadow-xl border border-border transition-all duration-300",
        "h-[650px] max-h-[90vh]"
      )}
    >
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div>
          <h2 className="text-lg font-semibold text-foreground" data-testid="text-chat-title">
            {botName}
          </h2>
          {botTagline && (
            <p className="text-sm text-muted-foreground">
              {botTagline}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button
            data-testid="button-toggle-language"
            variant="ghost"
            size="icon"
            onClick={onLanguageToggle}
            className="h-8 w-8"
            title={language === "es" ? "Switch to English" : "Cambiar a Español"}
          >
            <Languages className="h-4 w-4" />
          </Button>
          <Button
            data-testid="button-reset-chat"
            variant="ghost"
            size="icon"
            onClick={onResetChat}
            className="h-8 w-8"
            title={language === "es" ? "Reiniciar conversación" : "Reset conversation"}
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
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
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((message, index) => (
          <div key={index} className="space-y-2">
            <div
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
            {message.role === "assistant" && message.suggestedReplies && message.suggestedReplies.length > 0 && index === messages.length - 1 && !isLoading && (
              <div className="flex flex-wrap gap-1.5 pl-2">
                {message.suggestedReplies.map((reply, replyIndex) => (
                  <Button
                    key={replyIndex}
                    data-testid={`button-suggested-reply-${replyIndex}`}
                    variant="outline"
                    size="sm"
                    onClick={() => onSendMessage(reply)}
                    className="text-[10px] font-medium h-6 px-2 rounded-full hover-elevate"
                  >
                    {reply}
                  </Button>
                ))}
              </div>
            )}
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-card text-card-foreground rounded-xl p-3 text-sm shadow-sm">
              <div className="flex items-center gap-1" data-testid="typing-indicator">
                <span className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce" style={{ animationDuration: '0.6s' }} />
                <span className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce" style={{ animationDuration: '0.6s', animationDelay: '0.15s' }} />
                <span className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce" style={{ animationDuration: '0.6s', animationDelay: '0.3s' }} />
              </div>
            </div>
          </div>
        )}

        {flowContent && (
          <div className="flex justify-start w-full">
            <div className="w-full">
              {flowContent}
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {showMenu && isInitialState && (
        <div className="px-4 pb-2">
          <p className="text-[10px] text-muted-foreground mb-1.5 text-center">
            {language === "es" ? "Acciones Rápidas" : "Quick Actions"}
          </p>
          <div className="grid grid-cols-2 gap-1.5">
            {currentQuickActions.map((action) => (
              <Button
                key={action.id}
                data-testid={`button-quick-${action.id}`}
                variant="default"
                size="sm"
                onClick={() => onMenuClick(action.id)}
                className="text-[10px] font-medium h-7 px-2"
              >
                {action.label}
              </Button>
            ))}
          </div>
        </div>
      )}

      {showMenu && !isInitialState && (
        <div className="px-4 pb-2">
          <div className="grid grid-cols-2 gap-1.5">
            {currentQuickActions.slice(0, 6).map((action) => (
              <Button
                key={action.id}
                data-testid={`button-menu-${action.id}`}
                variant="outline"
                size="sm"
                onClick={() => onMenuClick(action.id)}
                className="rounded-full text-[10px] font-medium h-7 px-2 hover-elevate"
              >
                {action.label}
              </Button>
            ))}
          </div>
        </div>
      )}

      {showHumanHandoff && onHumanHandoff && (
        <div className="px-4 pb-2">
          <Button
            data-testid="button-human-handoff"
            variant="outline"
            size="sm"
            onClick={onHumanHandoff}
            className="w-full text-[10px] font-medium h-8 gap-2"
          >
            <User className="h-3 w-3" />
            {language === "es" ? "Hablar con una persona" : "Talk to a person"}
          </Button>
        </div>
      )}

      <div className="px-4 py-2 border-t border-border bg-muted/30">
        <p className="text-[10px] text-muted-foreground text-center leading-tight" data-testid="text-crisis-disclaimer">
          {language === "es" 
            ? "No es un servicio de emergencia. Para crisis, llama o envía mensaje de texto al 988, o llama al 911."
            : "Not an emergency service. For crisis, call or text 988, or call 911."}
        </p>
      </div>

      <div className="p-4 border-t border-border">
        <div className="flex gap-2">
          <Input
            data-testid="input-chat-message"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={language === "es" ? "Escribe tu mensaje..." : "Type your message..."}
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

      <div className="powered-footer">
        <span>Powered by </span>
        <strong>Treasure Coast AI</strong>
      </div>
    </div>
  );
}

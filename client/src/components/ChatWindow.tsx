import { X, Send, Languages, RotateCcw } from "lucide-react";
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
  language: string;
  onLanguageToggle: () => void;
  onResetChat: () => void;
}

const quickActions = {
  en: [
    { id: "about", label: "About The Faith House" },
    { id: "requirements", label: "Requirements" },
    { id: "availability", label: "Availability" },
    { id: "pricing", label: "Pricing" },
    { id: "qualify", label: "See if I qualify" },
    { id: "tour", label: "Request a call or tour" },
    { id: "crisis", label: "Crisis support" },
    { id: "contact", label: "Contact info" },
  ],
  es: [
    { id: "about", label: "Sobre The Faith House" },
    { id: "requirements", label: "Requisitos" },
    { id: "availability", label: "Disponibilidad" },
    { id: "pricing", label: "Precios" },
    { id: "qualify", label: "Ver si califico" },
    { id: "tour", label: "Pedir llamada o tour" },
    { id: "crisis", label: "Apoyo en crisis" },
    { id: "contact", label: "Información de contacto" },
  ],
};

const menuOptions = {
  en: [
    { id: "about", label: "About" },
    { id: "requirements", label: "Requirements" },
    { id: "availability", label: "Availability" },
    { id: "pricing", label: "Pricing" },
    { id: "apply", label: "Apply Now" },
    { id: "tour", label: "Request Tour/Call" },
    { id: "crisis", label: "Crisis Support" },
    { id: "contact", label: "Contact Info" },
  ],
  es: [
    { id: "about", label: "Acerca de" },
    { id: "requirements", label: "Requisitos" },
    { id: "availability", label: "Disponibilidad" },
    { id: "pricing", label: "Precios" },
    { id: "apply", label: "Aplicar Ahora" },
    { id: "tour", label: "Solicitar Tour/Llamada" },
    { id: "crisis", label: "Apoyo de Crisis" },
    { id: "contact", label: "Información de Contacto" },
  ],
};

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
}: ChatWindowProps) {
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const isInitialState = messages.length === 1;
  const currentQuickActions = quickActions[language as keyof typeof quickActions] || quickActions.en;
  const currentMenu = menuOptions[language as keyof typeof menuOptions] || menuOptions.en;

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
            {language === "es" ? "Aquí para apoyar tu próximo paso" : "Here to support your next step"}
          </p>
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

      {showMenu && isInitialState && (
        <div className="px-4 pb-3">
          <p className="text-xs text-muted-foreground mb-3 text-center">
            {language === "es" ? "Acciones Rápidas" : "Quick Actions"}
          </p>
          <div className="space-y-2">
            {currentQuickActions.map((action) => (
              <Button
                key={action.id}
                data-testid={`button-quick-${action.id}`}
                variant="default"
                size="default"
                onClick={() => onMenuClick(action.id)}
                className="w-full justify-center text-center font-medium"
              >
                {action.label}
              </Button>
            ))}
          </div>
        </div>
      )}

      {showMenu && !isInitialState && (
        <div className="px-4 pb-3">
          <div className="grid grid-cols-2 gap-2">
            {currentMenu.map((option) => (
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
    </div>
  );
}

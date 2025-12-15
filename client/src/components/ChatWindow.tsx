import { X, Send, Languages, RotateCcw, User, Calendar, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect, useRef, ReactNode } from "react";
import { cn } from "@/lib/utils";

// Action types from orchestrator
interface BookingFinalizeAction {
  type: 'BOOKING_FINALIZE';
  handling: 'internal' | 'external';
  bookingIntentId: string;
  label: string;
  externalUrl?: string;
  bookingType?: string;
}

type OrchestratorAction = BookingFinalizeAction;

interface Message {
  role: "assistant" | "user";
  content: string;
  suggestedReplies?: string[];
  bookingUrl?: string | null;
  bookingMode?: 'internal' | 'external';
  bookingProviderName?: string | null;
  paymentUrl?: string | null;
  actions?: OrchestratorAction[];  // New structured action payloads
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
  onBookingClick?: (url: string, type: 'booking' | 'payment') => void;
  onBookingFinalize?: (action: BookingFinalizeAction) => void;  // Handler for internal booking finalization
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
  onBookingClick,
  onBookingFinalize,
}: ChatWindowProps) {
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  
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
      // Maintain focus on input after sending
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
    // Shift+Enter allows line breaks naturally in textarea
  };
  
  // Focus input when chat opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

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
            {/* Render booking button from actions array (new structured approach) or legacy bookingUrl */}
            {message.role === "assistant" && index === messages.length - 1 && !isLoading && (() => {
              // Find BOOKING_FINALIZE action if present
              const bookingAction = message.actions?.find(a => a.type === 'BOOKING_FINALIZE') as BookingFinalizeAction | undefined;
              
              // Check if action has a valid intent ID (empty string = fallback mode)
              const hasValidAction = bookingAction && bookingAction.bookingIntentId;
              const hasFallbackAction = bookingAction && !bookingAction.bookingIntentId;
              const hasLegacyBookingUrl = !!message.bookingUrl;
              
              // Determine which button to show:
              // 1. Valid action with intent ID -> use action
              // 2. Fallback action (empty intent ID) with external URL -> use external URL from action
              // 3. Fallback action with internal mode -> still trigger finalize flow (handler will prompt for contact)
              // 4. Legacy bookingUrl -> use legacy link
              
              if (!hasValidAction && !hasFallbackAction && !hasLegacyBookingUrl) return null;
              
              return (
                <div className="flex flex-col gap-2 pl-2 mt-2">
                  {bookingAction ? (
                    // Action-based booking button (valid or fallback)
                    bookingAction.handling === 'external' && bookingAction.externalUrl ? (
                      // External mode with URL - always link
                      <a
                        href={bookingAction.externalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => onBookingClick?.(bookingAction.externalUrl!, 'booking')}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-cyan-500 to-cyan-600 text-white font-medium text-sm shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:from-cyan-600 hover:to-cyan-700 transition-all duration-200"
                        data-testid="button-book-appointment"
                      >
                        <Calendar className="h-4 w-4" />
                        {bookingAction.label}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : (
                      // Internal booking - button triggers finalization flow
                      // Works for both valid intent IDs and fallback mode (handler checks for empty ID)
                      <button
                        onClick={() => onBookingFinalize?.(bookingAction)}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-cyan-500 to-cyan-600 text-white font-medium text-sm shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:from-cyan-600 hover:to-cyan-700 transition-all duration-200"
                        data-testid="button-book-appointment"
                      >
                        <Calendar className="h-4 w-4" />
                        {bookingAction.label}
                      </button>
                    )
                  ) : (
                    // Legacy bookingUrl fallback (only when no action present)
                    <a
                      href={message.bookingUrl!}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => onBookingClick?.(message.bookingUrl!, 'booking')}
                      className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-cyan-500 to-cyan-600 text-white font-medium text-sm shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:from-cyan-600 hover:to-cyan-700 transition-all duration-200"
                      data-testid="button-book-appointment"
                    >
                      <Calendar className="h-4 w-4" />
                      {message.bookingMode === 'external' && message.bookingProviderName
                        ? (language === "es" 
                            ? `Continuar reserva en ${message.bookingProviderName}` 
                            : `Continue to book on ${message.bookingProviderName}`)
                        : (language === "es" ? "Completar Reserva" : "Complete Booking")}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                  {message.paymentUrl && (
                    <a
                      href={message.paymentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => onBookingClick?.(message.paymentUrl!, 'payment')}
                      className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-purple-600 text-white font-medium text-sm shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 hover:from-purple-600 hover:to-purple-700 transition-all duration-200"
                      data-testid="button-payment"
                    >
                      {language === "es" ? "Proceder al Pago" : "Proceed to Payment"}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              );
            })()}
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
        <div className="flex gap-2 items-end">
          <Textarea
            ref={inputRef}
            data-testid="input-chat-message"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={language === "es" ? "Escribe tu mensaje... (Enter para enviar)" : "Type your message... (Enter to send)"}
            className="flex-1 rounded-lg min-h-[40px] max-h-[120px] resize-none py-2"
            disabled={isLoading}
            rows={1}
          />
          <Button
            data-testid="button-send-message"
            onClick={handleSend}
            disabled={!inputValue.trim() || isLoading}
            size="icon"
            className="rounded-lg h-10 w-10 flex-shrink-0"
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

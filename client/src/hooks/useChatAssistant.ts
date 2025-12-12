/**
 * UNIFIED CHAT ASSISTANT HOOK
 * 
 * All chat widgets (admin preview, demo pages, public widget.js, client sites) 
 * MUST use this shared hook. Do not reimplement chat logic directly in 
 * components; wire them into this hook instead.
 * 
 * This keeps booking, lead capture, and analytics behavior consistent 
 * across the platform.
 */

import { useState, useCallback, useRef, useEffect } from "react";
import { 
  createChatClient, 
  ChatConfig, 
  ChatClient, 
  ChatMessage as LibChatMessage
} from "@/lib/chatClient";

export interface Message {
  role: "user" | "assistant";
  content: string;
  bookingUrl?: string;
  bookingType?: 'tour' | 'call' | 'appointment';
  bookingMode?: 'internal' | 'external';
  bookingProviderName?: string | null;
  paymentUrl?: string;
  suggestedReplies?: string[];
  isStreaming?: boolean;
}

export interface UseChatAssistantConfig extends Omit<ChatConfig, "source"> {
  source?: ChatConfig["source"];
  initialGreeting?: string;
  onError?: (error: Error) => void;
  onBookingClick?: (bookingUrl: string) => void;
}

export interface UseChatAssistantReturn {
  messages: Message[];
  isLoading: boolean;
  isPaused: boolean;
  error: string | null;
  sessionId: string;
  sendMessage: (content: string) => Promise<void>;
  resetChat: () => void;
  handleBookingClick: (bookingUrl: string) => void;
}

export function useChatAssistant(config: UseChatAssistantConfig): UseChatAssistantReturn {
  const {
    clientId,
    botId,
    widgetToken,
    source = "demo_page",
    language = "en",
    apiUrl = "",
    initialGreeting,
    onError,
    onBookingClick,
  } = config;

  const [messages, setMessages] = useState<Message[]>(() => {
    if (initialGreeting) {
      return [{ role: "assistant", content: initialGreeting }];
    }
    return [];
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clientRef = useRef<ChatClient | null>(null);
  
  // Use a ref to always have current message history for API calls
  // This prevents race conditions when multiple messages are sent rapidly
  const messagesRef = useRef<Message[]>(messages);
  
  // Keep ref in sync with state
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    clientRef.current = createChatClient({
      clientId,
      botId,
      widgetToken,
      source,
      language,
      apiUrl,
    });
  }, [clientId, botId, widgetToken, source, language, apiUrl]);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isLoading || isPaused) return;

    const client = clientRef.current;
    if (!client) return;

    const userMessage: Message = { role: "user", content: content.trim() };
    
    // Build the full message history using the ref (always current)
    const fullHistory = [...messagesRef.current, userMessage];
    
    // Update both state and ref
    messagesRef.current = fullHistory;
    setMessages(fullHistory);
    setIsLoading(true);
    setError(null);

    try {
      const apiMessages: LibChatMessage[] = fullHistory.map(m => ({
        role: m.role,
        content: m.content,
      }));

      const response = await client.sendMessage(apiMessages);

      const assistantMessage: Message = {
        role: "assistant",
        content: response.reply,
        bookingUrl: response.meta?.externalBookingUrl || undefined,
        bookingType: response.meta?.bookingType || undefined,
        bookingMode: response.meta?.bookingMode || 'internal',
        bookingProviderName: response.meta?.externalBookingProviderName || null,
        paymentUrl: response.meta?.externalPaymentUrl || undefined,
        suggestedReplies: response.meta?.suggestedReplies,
      };

      // Update both ref and state with assistant message
      messagesRef.current = [...messagesRef.current, assistantMessage];
      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      const error = err as Error;
      
      if (error.message === "SERVICE_PAUSED") {
        setIsPaused(true);
        setError("Service is temporarily unavailable. Please try again later.");
      } else if (error.message === "RATE_LIMITED") {
        setError("Too many requests. Please wait a moment and try again.");
      } else if (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN") {
        setError("Access denied. Please refresh the page and try again.");
      } else {
        setError("Failed to send message. Please try again.");
      }

      onError?.(error);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, isPaused, onError]);

  const resetChat = useCallback(() => {
    const client = clientRef.current;
    if (client) {
      client.resetSession();
    }
    
    const resetMessages = initialGreeting 
      ? [{ role: "assistant" as const, content: initialGreeting }] 
      : [];
    
    messagesRef.current = resetMessages;
    setMessages(resetMessages);
    setError(null);
    setIsPaused(false);
  }, [initialGreeting]);

  const handleBookingClick = useCallback((bookingUrl: string) => {
    const client = clientRef.current;
    if (client) {
      client.trackBookingClick();
    }
    onBookingClick?.(bookingUrl);
    
    window.open(bookingUrl, "_blank", "noopener,noreferrer");
  }, [onBookingClick]);

  return {
    messages,
    isLoading,
    isPaused,
    error,
    sessionId: clientRef.current?.getSessionId() || "",
    sendMessage,
    resetChat,
    handleBookingClick,
  };
}

/**
 * Streaming variant of useChatAssistant (currently a stub)
 * 
 * NOTE: This is a placeholder for future streaming implementation.
 * The base useChatAssistant hook already handles all chat functionality correctly.
 * If streaming is needed in the future, implement using Server-Sent Events
 * with proper message ref synchronization.
 */
export function useChatAssistantStreaming(config: UseChatAssistantConfig): UseChatAssistantReturn & {
  streamMessage: (content: string) => Promise<void>;
} {
  const baseReturn = useChatAssistant(config);

  // Streaming is not currently implemented - just use the regular sendMessage
  const streamMessage = useCallback(async (content: string) => {
    return baseReturn.sendMessage(content);
  }, [baseReturn.sendMessage]);

  return {
    ...baseReturn,
    streamMessage,
  };
}

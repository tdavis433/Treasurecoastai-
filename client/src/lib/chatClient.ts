/**
 * UNIFIED CHAT CLIENT
 * 
 * All chat widgets (admin preview, demo pages, public widget.js, client sites) 
 * MUST use this shared chat client. Do not reimplement chat logic directly in 
 * components; wire them into this module instead.
 * 
 * This keeps booking, lead capture, and analytics behavior consistent 
 * across the platform.
 */

export type ChatSource = 
  | "admin_preview" 
  | "public_widget" 
  | "demo_page" 
  | "client_site"
  | "widget";

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface ChatConfig {
  clientId: string;
  botId: string;
  widgetToken?: string;
  source: ChatSource;
  language?: "en" | "es";
  apiUrl?: string;
}

export interface ChatMeta {
  clientId: string;
  botId: string;
  sessionId: string;
  responseTimeMs?: number;
  showBooking?: boolean;
  externalBookingUrl?: string | null;
  externalPaymentUrl?: string | null;
  suggestedReplies?: string[];
  crisis?: boolean;
}

export interface ChatResponse {
  reply: string;
  meta?: ChatMeta;
  showAppointmentFlow?: boolean;
}

export interface StreamChunk {
  type: "chunk" | "done" | "error" | "meta";
  content?: string;
  reply?: string;
  meta?: ChatMeta;
  message?: string;
}

function generateSessionId(): string {
  return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function createChatClient(config: ChatConfig) {
  const {
    clientId,
    botId,
    widgetToken,
    source,
    language = "en",
    apiUrl = ""
  } = config;

  let sessionId = generateSessionId();

  const getHeaders = (): HeadersInit => {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };
    if (widgetToken) {
      headers["Authorization"] = `Bearer ${widgetToken}`;
    }
    return headers;
  };

  return {
    getSessionId: () => sessionId,
    
    setSessionId: (id: string) => {
      sessionId = id;
    },
    
    resetSession: () => {
      sessionId = generateSessionId();
      return sessionId;
    },

    sendMessage: async (messages: ChatMessage[]): Promise<ChatResponse> => {
      const url = `${apiUrl}/api/chat/${clientId}/${botId}`;
      
      const response = await fetch(url, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({
          messages,
          sessionId,
          language,
          source,
        }),
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        if (errorData.status === "paused") {
          throw new Error("SERVICE_PAUSED");
        }
        if (response.status === 429) {
          throw new Error("RATE_LIMITED");
        }
        if (response.status === 401) {
          throw new Error("UNAUTHORIZED");
        }
        if (response.status === 403) {
          throw new Error("FORBIDDEN");
        }
        
        throw new Error(errorData.message || errorData.error || "Failed to send message");
      }

      const data: ChatResponse = await response.json();
      return data;
    },

    sendMessageStream: async function*(messages: ChatMessage[]): AsyncGenerator<StreamChunk> {
      const url = `${apiUrl}/api/chat/${clientId}/${botId}/stream`;
      
      const response = await fetch(url, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({
          messages,
          sessionId,
          language,
          source,
        }),
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        yield { type: "error", message: errorData.message || "Stream failed" };
        return;
      }

      const contentType = response.headers.get("content-type");
      
      if (contentType?.includes("application/json")) {
        const data = await response.json();
        yield { type: "done", reply: data.reply, meta: data.meta };
        return;
      }

      if (!response.body) {
        yield { type: "error", message: "No response body" };
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const data = JSON.parse(line.slice(6));
                yield data as StreamChunk;
              } catch {
                // Skip malformed data
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }
    },

    trackBookingClick: async (leadId?: string): Promise<void> => {
      try {
        await fetch(`${apiUrl}/api/analytics/booking-click`, {
          method: "POST",
          headers: getHeaders(),
          body: JSON.stringify({
            clientId,
            botId,
            sessionId,
            leadId,
            source,
            timestamp: new Date().toISOString(),
          }),
          credentials: "include",
        });
      } catch {
        // Silent fail for analytics
        console.warn("Failed to track booking click");
      }
    },

    trackEvent: async (eventType: string, data?: Record<string, unknown>): Promise<void> => {
      try {
        await fetch(`${apiUrl}/api/analytics/event`, {
          method: "POST",
          headers: getHeaders(),
          body: JSON.stringify({
            clientId,
            botId,
            sessionId,
            eventType,
            source,
            data,
            timestamp: new Date().toISOString(),
          }),
          credentials: "include",
        });
      } catch {
        // Silent fail for analytics
        console.warn("Failed to track event:", eventType);
      }
    },
  };
}

export type ChatClient = ReturnType<typeof createChatClient>;

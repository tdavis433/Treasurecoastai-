import { useState, useCallback, useRef } from "react";

interface Message {
  role: "assistant" | "user";
  content: string;
  suggestedReplies?: string[];
  bookingUrl?: string | null;
  paymentUrl?: string | null;
}

interface StreamingChatOptions {
  clientId: string;
  botId: string;
  language?: string;
  sessionId: string;
  onStreamStart?: () => void;
  onStreamEnd?: (suggestedReplies: string[]) => void;
  onError?: (error: Error) => void;
}

export function useStreamingChat(options: StreamingChatOptions) {
  const { clientId, botId, language = "en", sessionId, onStreamStart, onStreamEnd, onError } = options;
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const abortControllerRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(async (
    messages: Message[],
    onChunk?: (content: string) => void
  ): Promise<{ content: string; suggestedReplies: string[]; bookingUrl?: string | null; paymentUrl?: string | null }> => {
    setIsStreaming(true);
    setStreamingContent("");
    onStreamStart?.();

    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch(`/api/chat/${clientId}/${botId}/stream`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: messages.map(m => ({ role: m.role, content: m.content })),
          sessionId,
          language,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to send message");
      }

      const contentType = response.headers.get("content-type");
      
      if (contentType?.includes("text/event-stream")) {
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let fullContent = "";
        let suggestedReplies: string[] = [];
        let bookingUrl: string | null = null;
        let paymentUrl: string | null = null;

        if (reader) {
          let buffer = "";
          
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
              if (line.startsWith("data: ")) {
                const data = line.slice(6);
                try {
                  const parsed = JSON.parse(data);
                  
                  if (parsed.type === "chunk") {
                    fullContent += parsed.content;
                    setStreamingContent(fullContent);
                    onChunk?.(parsed.content);
                  } else if (parsed.type === "done") {
                    suggestedReplies = parsed.suggestedReplies || [];
                    bookingUrl = parsed.meta?.externalBookingUrl || null;
                    paymentUrl = parsed.meta?.externalPaymentUrl || null;
                  } else if (parsed.type === "error") {
                    throw new Error(parsed.message);
                  }
                } catch (e) {
                  if (data !== "[DONE]") {
                    console.error("Failed to parse SSE data:", data, e);
                  }
                }
              }
            }
          }
        }

        setIsStreaming(false);
        setStreamingContent("");
        onStreamEnd?.(suggestedReplies);
        
        return { content: fullContent, suggestedReplies, bookingUrl, paymentUrl };
      } else {
        const data = await response.json();
        setIsStreaming(false);
        setStreamingContent("");
        onStreamEnd?.(data.suggestedReplies || []);
        
        return { 
          content: data.reply || "", 
          suggestedReplies: data.suggestedReplies || [],
          bookingUrl: data.meta?.externalBookingUrl || null,
          paymentUrl: data.meta?.externalPaymentUrl || null
        };
      }
    } catch (error) {
      setIsStreaming(false);
      setStreamingContent("");
      
      if (error instanceof Error && error.name !== "AbortError") {
        onError?.(error);
        throw error;
      }
      
      return { content: "", suggestedReplies: [], bookingUrl: null, paymentUrl: null };
    }
  }, [clientId, botId, language, sessionId, onStreamStart, onStreamEnd, onError]);

  const cancelStream = useCallback(() => {
    abortControllerRef.current?.abort();
    setIsStreaming(false);
    setStreamingContent("");
  }, []);

  return {
    sendMessage,
    cancelStream,
    isStreaming,
    streamingContent,
  };
}

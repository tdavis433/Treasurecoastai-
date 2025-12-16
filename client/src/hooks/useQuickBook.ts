/**
 * Quick Book v1 Hook
 * 
 * Implements a deterministic state machine for the booking flow:
 * SELECT_SERVICE → COLLECT_CONTACT → READY_TO_BOOK → DONE
 * 
 * UI controls the flow, not the AI. This ensures consistent behavior.
 * 
 * Guardrails:
 * - State machine is UI-controlled, not AI-controlled
 * - All API calls include workspace isolation
 * - Friendly fallbacks when config is missing
 */

import { useState, useCallback, useEffect } from "react";

export type QuickBookState = 
  | "IDLE"           // Initial state, waiting for service selection
  | "SELECT_SERVICE" // Showing service buttons
  | "COLLECT_CONTACT"// Showing contact form
  | "READY_TO_BOOK"  // Showing "Book Now" button
  | "DONE";          // Booking flow complete

export interface QuickBookService {
  id: string;
  name: string;
  priceCents?: number;
  durationMins?: number;
  bookingUrl?: string;
}

export interface QuickBookConfig {
  enabled: boolean;
  demoMode: boolean;
  bookingExternalUrl: string | null;
  bookingProviderName: string | null;
  services: QuickBookService[];
}

export interface QuickBookContact {
  name: string;
  phone?: string;
  email?: string;
}

export interface UseQuickBookConfig {
  clientId: string;
  botId: string;
  sessionId: string;
  onServiceSelect?: (service: QuickBookService) => void;
  onContactCapture?: (contact: QuickBookContact) => void;
  onBookNowClick?: (url: string, isDemoMode: boolean) => void;
}

export interface UseQuickBookReturn {
  state: QuickBookState;
  config: QuickBookConfig | null;
  isLoading: boolean;
  error: string | null;
  selectedService: QuickBookService | null;
  intentId: string | null;
  leadId: string | null;
  
  // Actions
  loadConfig: () => Promise<void>;
  selectService: (service: QuickBookService) => Promise<void>;
  submitContact: (contact: QuickBookContact) => Promise<void>;
  clickBookNow: () => Promise<{ url: string; isDemoMode: boolean } | null>;
  abandonBooking: () => Promise<void>;
  reset: () => void;
}

export function useQuickBook(hookConfig: UseQuickBookConfig): UseQuickBookReturn {
  const { clientId, botId, sessionId, onServiceSelect, onContactCapture, onBookNowClick } = hookConfig;
  
  const [state, setState] = useState<QuickBookState>("IDLE");
  const [config, setConfig] = useState<QuickBookConfig | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedService, setSelectedService] = useState<QuickBookService | null>(null);
  const [intentId, setIntentId] = useState<string | null>(null);
  const [leadId, setLeadId] = useState<string | null>(null);

  // Load Quick Book config on mount
  const loadConfig = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(`/api/quickbook/config/${clientId}/${botId}`);
      if (!response.ok) {
        throw new Error("Failed to load Quick Book config");
      }
      
      const data = await response.json();
      setConfig(data);
      
      if (data.enabled && data.services.length > 0) {
        setState("SELECT_SERVICE");
      }
    } catch (err) {
      console.error("[QuickBook] Error loading config:", err);
      // Friendly fallback - show default state
      setConfig({
        enabled: true,
        demoMode: true,
        bookingExternalUrl: null,
        bookingProviderName: null,
        services: [],
      });
      setError("Unable to load booking options");
    } finally {
      setIsLoading(false);
    }
  }, [clientId, botId]);

  // Auto-load config on mount
  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  // Select a service - creates booking intent
  const selectService = useCallback(async (service: QuickBookService) => {
    try {
      setIsLoading(true);
      setError(null);
      setSelectedService(service);
      
      const response = await fetch(`/api/quickbook/intent/start/${clientId}/${botId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId: service.id,
          serviceName: service.name,
          priceCents: service.priceCents,
          durationMins: service.durationMins,
          sessionId,
          botId,
        }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to start booking");
      }
      
      const data = await response.json();
      setIntentId(data.intentId);
      setState("COLLECT_CONTACT");
      
      onServiceSelect?.(service);
    } catch (err) {
      console.error("[QuickBook] Error selecting service:", err);
      setError("Unable to start booking. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [clientId, botId, sessionId, onServiceSelect]);

  // Submit contact info - creates/updates lead
  const submitContact = useCallback(async (contact: QuickBookContact) => {
    if (!intentId) {
      setError("No active booking. Please select a service first.");
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(`/api/quickbook/intent/lead/${clientId}/${botId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          intentId,
          name: contact.name,
          phone: contact.phone,
          email: contact.email,
        }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save contact info");
      }
      
      const data = await response.json();
      setLeadId(data.leadId);
      setState("READY_TO_BOOK");
      
      onContactCapture?.(contact);
    } catch (err: any) {
      console.error("[QuickBook] Error submitting contact:", err);
      setError(err.message || "Unable to save contact info. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [clientId, botId, intentId, onContactCapture]);

  // Click "Book Now" - get redirect URL
  const clickBookNow = useCallback(async () => {
    if (!intentId) {
      setError("No active booking. Please select a service first.");
      return null;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(`/api/quickbook/intent/click/${clientId}/${botId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ intentId }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to process booking");
      }
      
      const data = await response.json();
      const isDemoMode = data.redirectType === "demo";
      const url = data.url;
      
      setState("DONE");
      
      onBookNowClick?.(url, isDemoMode);
      
      return { url, isDemoMode };
    } catch (err) {
      console.error("[QuickBook] Error processing book now:", err);
      setError("Unable to proceed with booking. Please try again.");
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [clientId, botId, intentId, onBookNowClick]);

  // Abandon booking
  const abandonBooking = useCallback(async () => {
    if (!intentId) return;
    
    try {
      await fetch(`/api/quickbook/intent/abandon/${clientId}/${botId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ intentId }),
      });
    } catch (err) {
      console.error("[QuickBook] Error abandoning booking:", err);
    }
  }, [clientId, botId, intentId]);

  // Reset state
  const reset = useCallback(() => {
    setState("IDLE");
    setSelectedService(null);
    setIntentId(null);
    setLeadId(null);
    setError(null);
    
    // Reload config to show services again
    loadConfig();
  }, [loadConfig]);

  return {
    state,
    config,
    isLoading,
    error,
    selectedService,
    intentId,
    leadId,
    loadConfig,
    selectService,
    submitContact,
    clickBookNow,
    abandonBooking,
    reset,
  };
}

// Helper to format price from cents
export function formatPriceFromCents(cents?: number): string {
  if (!cents) return "";
  return `$${(cents / 100).toFixed(2)}`;
}

// Helper to format duration
export function formatDuration(mins?: number): string {
  if (!mins) return "";
  if (mins < 60) return `${mins} min`;
  const hours = Math.floor(mins / 60);
  const remainingMins = mins % 60;
  return remainingMins > 0 ? `${hours}h ${remainingMins}m` : `${hours} hour${hours > 1 ? 's' : ''}`;
}

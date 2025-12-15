/**
 * Booking Policy Engine
 * 
 * Single source of truth for determining how bookings should be handled.
 * This ensures consistent behavior across all templates and entry points.
 * 
 * Rules:
 * - INTERNAL booking types: PHONE_CALL, TOUR, CONSULTATION, DISCOVERY_CALL, INFO_CALL, ESTIMATE, CALLBACK
 * - EXTERNAL booking types: SERVICE_BOOKING, APPOINTMENT, RESERVATION, PAID_SERVICE (actual service bookings)
 * - If EXTERNAL required but URL missing/invalid: failsafe to internal with friendly message
 */

import { validateBookingUrl } from "./urlValidator";
import { structuredLogger } from "./structuredLogger";

// Booking types that should always be handled internally (no payment, just scheduling)
const INTERNAL_BOOKING_TYPES = new Set([
  'phone_call',
  'call',
  'callback',
  'tour',
  'consultation',
  'discovery_call',
  'info_call',
  'estimate',
  'inquiry',
  'request_callback',
  'free_consultation',
]);

// Booking types that should go to external provider (paid services, real appointments)
const EXTERNAL_BOOKING_TYPES = new Set([
  'service_booking',
  'appointment',
  'reservation',
  'paid_service',
  'grooming',
  'haircut',
  'massage',
  'treatment',
  'class',
  'session',
]);

export interface BookingResolution {
  handling: 'internal' | 'external';
  externalUrl?: string;
  failsafeActivated: boolean;
  failsafeReason?: string;
  bookingIntentId?: string;
}

export interface BookingPolicyContext {
  workspaceId: string;
  botId: string;
  bookingType?: string;
  clientSettings?: {
    bookingMode?: 'internal' | 'external';
    externalBookingUrl?: string | null;
    externalBookingProviderName?: string | null;
    enableBookingFailsafe?: boolean;
    appointmentTypeModes?: Record<string, { mode: 'internal' | 'external'; externalUrlOverride?: string }>;
  };
  templateBookingProfile?: {
    mode: 'internal' | 'external';
    primaryCTA?: string;
    failsafeEnabled?: boolean;
  };
}

/**
 * Resolves how a booking should be handled based on:
 * 1. Booking type (some types are always internal)
 * 2. Client/workspace settings (override defaults)
 * 3. Template defaults
 * 4. Failsafe logic (invalid external URL → pivot to internal)
 */
export function resolveBookingHandling(context: BookingPolicyContext): BookingResolution {
  const { workspaceId, botId, bookingType, clientSettings, templateBookingProfile } = context;
  
  // Step 1: Check if this booking type is always internal
  const normalizedType = (bookingType || '').toLowerCase().replace(/[\s-]/g, '_');
  
  if (INTERNAL_BOOKING_TYPES.has(normalizedType)) {
    structuredLogger.debug('Booking resolved to INTERNAL (type-based)', { 
      workspaceId, botId, bookingType: normalizedType 
    });
    return {
      handling: 'internal',
      failsafeActivated: false,
    };
  }
  
  // Step 2: Check for per-appointment-type mode overrides
  if (clientSettings?.appointmentTypeModes?.[normalizedType]) {
    const override = clientSettings.appointmentTypeModes[normalizedType];
    
    if (override.mode === 'external' && override.externalUrlOverride) {
      const urlValidation = validateBookingUrl(override.externalUrlOverride);
      
      if (urlValidation.valid) {
        return {
          handling: 'external',
          externalUrl: override.externalUrlOverride,
          failsafeActivated: false,
        };
      }
    }
    
    if (override.mode === 'internal') {
      return {
        handling: 'internal',
        failsafeActivated: false,
      };
    }
  }
  
  // Step 3: Check client settings for external mode
  const preferredMode = clientSettings?.bookingMode || templateBookingProfile?.mode || 'internal';
  
  if (preferredMode === 'external') {
    const candidateUrl = clientSettings?.externalBookingUrl;
    
    if (candidateUrl) {
      const urlValidation = validateBookingUrl(candidateUrl);
      
      if (urlValidation.valid) {
        structuredLogger.debug('Booking resolved to EXTERNAL', { 
          workspaceId, botId, url: candidateUrl 
        });
        return {
          handling: 'external',
          externalUrl: candidateUrl,
          failsafeActivated: false,
        };
      } else {
        // FAILSAFE: URL is invalid - pivot to internal
        structuredLogger.warn('FAILSAFE ACTIVATED: Invalid external booking URL', { 
          workspaceId, botId, url: candidateUrl, error: urlValidation.error 
        });
        return {
          handling: 'internal',
          failsafeActivated: true,
          failsafeReason: `External booking URL invalid: ${urlValidation.error}`,
        };
      }
    } else {
      // FAILSAFE: No external URL configured - pivot to internal
      structuredLogger.warn('FAILSAFE ACTIVATED: No external booking URL configured', { 
        workspaceId, botId 
      });
      return {
        handling: 'internal',
        failsafeActivated: true,
        failsafeReason: 'External booking URL not configured',
      };
    }
  }
  
  // Step 4: Default to internal
  return {
    handling: 'internal',
    failsafeActivated: false,
  };
}

/**
 * Determines the appropriate booking type from user intent signals
 */
export function inferBookingType(userMessage: string, previousMessages: string[] = []): string | undefined {
  const allText = [...previousMessages, userMessage].join(' ').toLowerCase();
  
  // Tour/visit intent
  if (/\b(tour|visit|come see|check out|see the (house|place|facility)|walk through|open house|look around)\b/i.test(allText)) {
    return 'tour';
  }
  
  // Phone call intent
  if (/\b(call|phone|speak with|talk to|ring|callback|call back|phone call)\b/i.test(allText)) {
    return 'phone_call';
  }
  
  // Consultation intent
  if (/\b(consult|consultation|meet|meeting|discuss|discovery)\b/i.test(allText)) {
    return 'consultation';
  }
  
  // Estimate/quote intent
  if (/\b(estimate|quote|pricing|cost|how much)\b/i.test(allText)) {
    return 'estimate';
  }
  
  // Generic appointment/booking
  if (/\b(book|appointment|schedule|reserve|reservation)\b/i.test(allText)) {
    return 'appointment';
  }
  
  return undefined;
}

/**
 * Determines if a booking type should show a Book Now button
 */
export function shouldShowBookingButton(
  showBooking: boolean,
  bookingType?: string,
  handling?: 'internal' | 'external'
): boolean {
  if (!showBooking) return false;
  
  // Always show button for internal handling (will trigger in-app flow)
  if (handling === 'internal') return true;
  
  // For external, only show if we have a valid URL (handled by resolveBookingHandling)
  if (handling === 'external') return true;
  
  return showBooking;
}

/**
 * Get the appropriate button label based on booking type and handling
 */
export function getBookingButtonLabel(
  bookingType?: string,
  handling?: 'internal' | 'external',
  providerName?: string | null,
  language: 'en' | 'es' = 'en'
): string {
  const type = (bookingType || '').toLowerCase();
  
  if (handling === 'external' && providerName) {
    return language === 'es' 
      ? `Continuar en ${providerName}` 
      : `Continue on ${providerName}`;
  }
  
  // Type-specific labels
  if (type.includes('tour')) {
    return language === 'es' ? 'Programar Tour' : 'Schedule Tour';
  }
  if (type.includes('call') || type.includes('phone')) {
    return language === 'es' ? 'Solicitar Llamada' : 'Request Callback';
  }
  if (type.includes('consult')) {
    return language === 'es' ? 'Programar Consulta' : 'Schedule Consultation';
  }
  if (type.includes('estimate')) {
    return language === 'es' ? 'Obtener Estimado' : 'Get Estimate';
  }
  
  // Default
  return language === 'es' ? 'Reservar Ahora' : 'Book Now';
}

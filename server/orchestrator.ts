/**
 * UNIFIED CONVERSATION ORCHESTRATOR
 * 
 * THE SINGLE BRAIN: All chat requests (widget, demo, admin preview, API) 
 * MUST go through this service. No duplicating chat logic elsewhere!
 * 
 * Responsibilities:
 * 1. Load and cache bot + client configuration
 * 2. Validate security (tokens, domains, rate limits)
 * 3. Check plan limits
 * 4. Process automations (office hours, keyword triggers)
 * 5. Handle crisis detection
 * 6. Build OpenAI prompt with full context
 * 7. Call OpenAI and stream/return response
 * 8. Post-process: lead capture, booking detection, analytics
 * 9. Return standardized response shape
 * 
 * Multi-tenant isolation: All operations scoped by clientId + botId
 */

import OpenAI from 'openai';
import { configCache } from './configCache';
import { storage } from './storage';
import { 
  BotConfig, 
  buildSystemPromptFromConfig, 
  detectCrisisInMessage, 
  getCrisisResponse 
} from './botConfig';
import { 
  processAutomations, 
  triggerWorkflowByEvent,
  extractContactInfo,
  AutomationContext,
  BotAutomationConfig,
  AutomationResult
} from './automations';
import { checkMessageLimit, incrementMessageCount, incrementAutomationCount } from './planLimits';
import { getClientStatus } from './botConfig';
import { addDays, addWeeks, setHours, setMinutes, startOfDay, format, getDay } from 'date-fns';
import { extractContactSignals, mergeContactSignals } from '@shared/contactSignals';
import { structuredLogger } from './structuredLogger';
import { resolveBookingHandling, getBookingButtonLabel } from './bookingPolicy';

/**
 * SAFE RETRY WRAPPER FOR CRITICAL WRITES
 * Retries once on transient DB errors to prevent data loss.
 * Used for: createLead, logConversation, logBookingIntentEvent
 */
async function withRetry<T>(
  operation: () => Promise<T>,
  operationName: string,
  maxRetries: number = 1
): Promise<T> {
  let lastError: Error | undefined;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;
      const isTransient = 
        error?.code === 'ECONNRESET' ||
        error?.code === 'ETIMEDOUT' ||
        error?.code === 'ENOTFOUND' ||
        error?.message?.includes('connection') ||
        error?.message?.includes('timeout') ||
        error?.message?.includes('temporarily unavailable');
      
      if (attempt < maxRetries && isTransient) {
        structuredLogger.warn(`${operationName} failed, retrying`, { attempt: attempt + 1, error: error?.message });
        await new Promise(resolve => setTimeout(resolve, 100 * (attempt + 1))); // Brief exponential backoff
      } else {
        structuredLogger.error(`${operationName} failed after all attempts`, { attempts: attempt + 1, error: error?.message || error });
        throw error;
      }
    }
  }
  
  throw lastError;
}

function categorizeMessageTopic(content: string): string {
  const lower = content.toLowerCase();
  
  if (/pric|cost|fee|pay|afford|money|\$/i.test(lower)) return 'pricing';
  if (/hour|open|close|time|when|schedule/i.test(lower)) return 'hours';
  if (/locat|address|where|direct|find/i.test(lower)) return 'location';
  if (/service|offer|provide|do you|can you/i.test(lower)) return 'services';
  if (/appointment|book|reserve|schedule|meet/i.test(lower)) return 'appointments';
  if (/help|support|assist|question/i.test(lower)) return 'support';
  if (/contact|call|email|phone|reach/i.test(lower)) return 'contact';
  if (/thank|great|good|awesome/i.test(lower)) return 'feedback';
  
  return 'general';
}

/**
 * BOOKING FAILSAFE: Validate external booking URL
 * Only HTTPS URLs are allowed - blocks javascript:, data:, file:, http: (insecure)
 * Returns true if URL is valid and safe for redirect
 */
export function isValidExternalBookingUrl(url: string | null | undefined): boolean {
  if (!url || typeof url !== 'string' || url.trim().length === 0) {
    return false;
  }
  
  const trimmed = url.trim().toLowerCase();
  
  // Block dangerous URL schemes
  const blockedSchemes = ['javascript:', 'data:', 'file:', 'vbscript:', 'about:'];
  for (const scheme of blockedSchemes) {
    if (trimmed.startsWith(scheme)) {
      structuredLogger.warn('Blocked dangerous URL scheme', { scheme, url });
      return false;
    }
  }
  
  // Block insecure HTTP - only HTTPS allowed
  if (trimmed.startsWith('http:')) {
    structuredLogger.warn('Blocked insecure HTTP URL (HTTPS required)', { url });
    return false;
  }
  
  // Must start with HTTPS
  if (!trimmed.startsWith('https://')) {
    structuredLogger.warn('URL must start with https://', { url });
    return false;
  }
  
  // Basic URL validation
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:') {
      return false;
    }
    // Must have a valid hostname
    if (!parsed.hostname || parsed.hostname.length < 3) {
      return false;
    }
    return true;
  } catch (e) {
    structuredLogger.warn('Invalid URL format', { url });
    return false;
  }
}

/**
 * URL REACHABILITY CACHE
 * Caches URL validation results to avoid repeated network requests.
 * TTL: 5 minutes for valid URLs, 1 minute for invalid (allows faster recovery)
 */
interface UrlCacheEntry {
  isReachable: boolean;
  statusCode?: number;
  checkedAt: number;
}

const urlReachabilityCache = new Map<string, UrlCacheEntry>();
const URL_CACHE_TTL_VALID = 5 * 60 * 1000;   // 5 minutes for valid URLs
const URL_CACHE_TTL_INVALID = 60 * 1000;      // 1 minute for invalid (faster retry)

/**
 * Check if a URL is reachable via HEAD request
 * Uses caching to avoid repeated network calls
 * Returns true if URL responds with 2xx/3xx status
 */
export async function isUrlReachable(url: string): Promise<{ reachable: boolean; statusCode?: number; cached: boolean }> {
  if (!isValidExternalBookingUrl(url)) {
    return { reachable: false, cached: false };
  }
  
  // Check cache first
  const cached = urlReachabilityCache.get(url);
  const now = Date.now();
  if (cached) {
    const ttl = cached.isReachable ? URL_CACHE_TTL_VALID : URL_CACHE_TTL_INVALID;
    if (now - cached.checkedAt < ttl) {
      return { reachable: cached.isReachable, statusCode: cached.statusCode, cached: true };
    }
  }
  
  // Perform HEAD request with short timeout
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      headers: {
        'User-Agent': 'TreasureCoastAI-LinkChecker/1.0',
      },
    });
    
    clearTimeout(timeoutId);
    
    const isReachable = response.status >= 200 && response.status < 400;
    
    // Cache the result
    urlReachabilityCache.set(url, {
      isReachable,
      statusCode: response.status,
      checkedAt: now,
    });
    
    if (!isReachable) {
      structuredLogger.warn('External booking URL returned error status', { 
        url, 
        status: response.status 
      });
    }
    
    return { reachable: isReachable, statusCode: response.status, cached: false };
  } catch (error: any) {
    // Network error, timeout, or other failure
    structuredLogger.warn('External booking URL unreachable', { 
      url, 
      error: error?.message || 'Unknown error' 
    });
    
    // Cache as unreachable
    urlReachabilityCache.set(url, {
      isReachable: false,
      checkedAt: now,
    });
    
    return { reachable: false, cached: false };
  }
}

/**
 * Clear URL reachability cache (for testing or after config changes)
 */
export function clearUrlReachabilityCache(url?: string): void {
  if (url) {
    urlReachabilityCache.delete(url);
  } else {
    urlReachabilityCache.clear();
  }
}

export interface ExtractedBookingInfo {
  name?: string;
  phone?: string;
  email?: string;
  preferredTime?: string;
  scheduledAt?: string; // ISO datetime parsed from preferredTime
  notes?: string;
  bookingType: 'tour' | 'phone_call' | 'request_callback';
  isComplete: boolean;
  isCompleteForExternal: boolean; // Stricter check for external booking (includes service)
  requestedService?: string; // Service type (haircut, beard trim, etc.)
}

/**
 * Parse a vague time phrase like "tomorrow afternoon" into an ISO datetime string
 * Returns null if parsing fails, so we can fall back to the original phrase
 */
function parseVagueTimeToDatetime(timePhrase: string): string | null {
  if (!timePhrase || timePhrase === 'To be confirmed') {
    return null;
  }
  
  const lower = timePhrase.toLowerCase().trim();
  const now = new Date();
  let baseDate: Date | null = null;
  
  // Helper to find next occurrence of a weekday (including today if it matches)
  // Uses modular arithmetic to handle week wrapping correctly (esp. Sunday)
  const getWeekdayDate = (targetDay: number, forceNextWeek: boolean = false): Date => {
    const today = getDay(now);
    // Calculate days until target: (target - today + 7) % 7
    // This gives 0 if same day, 1-6 for days later this week
    let daysUntil = (targetDay - today + 7) % 7;
    
    // If daysUntil is 0 (same day), check time - if we want same day, keep 0
    // Otherwise if forceNextWeek, add 7 days
    if (daysUntil === 0 && forceNextWeek) {
      daysUntil = 7;
    } else if (forceNextWeek) {
      // "next Monday" when it's Wednesday means 12 days (this coming Monday + 7)
      daysUntil += 7;
    }
    
    return startOfDay(addDays(now, daysUntil));
  };
  
  // Parse relative day references
  if (lower.includes('today')) {
    baseDate = startOfDay(now);
  } else if (lower.includes('tomorrow')) {
    baseDate = startOfDay(addDays(now, 1));
  } else if (lower.includes('next week')) {
    baseDate = startOfDay(addWeeks(now, 1));
  } else if (lower.includes('this week') || lower.includes('this weekend')) {
    // Default to Saturday for "this weekend"
    baseDate = getWeekdayDate(6, false); // Saturday
  } else if (lower.includes('next monday')) {
    baseDate = getWeekdayDate(1, true);
  } else if (lower.includes('next tuesday')) {
    baseDate = getWeekdayDate(2, true);
  } else if (lower.includes('next wednesday')) {
    baseDate = getWeekdayDate(3, true);
  } else if (lower.includes('next thursday')) {
    baseDate = getWeekdayDate(4, true);
  } else if (lower.includes('next friday')) {
    baseDate = getWeekdayDate(5, true);
  } else if (lower.includes('next saturday')) {
    baseDate = getWeekdayDate(6, true);
  } else if (lower.includes('next sunday')) {
    baseDate = getWeekdayDate(0, true);
  } else if (/\bmonday\b/.test(lower)) {
    baseDate = getWeekdayDate(1, false);
  } else if (/\btuesday\b/.test(lower)) {
    baseDate = getWeekdayDate(2, false);
  } else if (/\bwednesday\b/.test(lower)) {
    baseDate = getWeekdayDate(3, false);
  } else if (/\bthursday\b/.test(lower)) {
    baseDate = getWeekdayDate(4, false);
  } else if (/\bfriday\b/.test(lower)) {
    baseDate = getWeekdayDate(5, false);
  } else if (/\bsaturday\b/.test(lower)) {
    baseDate = getWeekdayDate(6, false);
  } else if (/\bsunday\b/.test(lower)) {
    baseDate = getWeekdayDate(0, false);
  }
  
  // If no date reference found, default to tomorrow
  if (!baseDate) {
    baseDate = startOfDay(addDays(now, 1));
  }
  
  // Parse time of day
  let hour = 14; // Default to 2 PM
  
  // First try to parse specific time like "3 PM" or "10:30am"
  const specificTimeMatch = lower.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i);
  if (specificTimeMatch) {
    let h = parseInt(specificTimeMatch[1], 10);
    const minutes = specificTimeMatch[2] ? parseInt(specificTimeMatch[2], 10) : 0;
    const period = specificTimeMatch[3].toLowerCase();
    
    if (period === 'pm' && h !== 12) {
      h += 12;
    } else if (period === 'am' && h === 12) {
      h = 0;
    }
    
    baseDate = setHours(baseDate, h);
    baseDate = setMinutes(baseDate, minutes);
  } else {
    // Parse general time of day
    if (lower.includes('morning')) {
      hour = 9;
    } else if (lower.includes('afternoon')) {
      hour = 14;
    } else if (lower.includes('evening')) {
      hour = 18;
    } else if (lower.includes('night')) {
      hour = 20;
    }
    
    baseDate = setHours(baseDate, hour);
    baseDate = setMinutes(baseDate, 0);
  }
  
  try {
    return baseDate.toISOString();
  } catch (e) {
    structuredLogger.warn('Failed to parse time phrase', { timePhrase, error: e });
    return null;
  }
}

export function extractBookingInfoFromConversation(
  messages: ChatMessage[],
  currentReply: string,
  currentUserMessage: string
): ExtractedBookingInfo | null {
  // FIX: Only search user messages for contact info (not bot/system messages) to prevent data crossover
  const userMessages = messages.filter(m => m.role === 'user').map(m => m.content).join(' ') + ' ' + currentUserMessage;
  // Also check AI reply for structured summaries like "Name: X, Phone: Y"
  const aiSummaryText = currentReply;
  
  // Check if AI explicitly confirms the booking in its response
  const aiConfirmsBooking = /I'?ve noted|noted your|passed along|team will (reach out|follow up|contact)|will be in touch|request:?[\s\S]*name:?|got your (info|details|contact)|have your (info|details|contact)|thank.* for (sharing|providing)|schedule.* tour|confirm.* (appointment|booking|tour)/i.test(currentReply);
  
  // Also check if the current message contains complete contact info (name + phone OR name + email)
  // This allows booking to be captured even if AI is still asking follow-up questions
  // Updated patterns to handle various name formats including "John Smith is my name", "I'm John", "My name is John Smith"
  const namePatternForCheck = /(?:my name is|i'?m|name:?|this is|call me|it'?s|i am)\s+[A-Za-z]{2,}|[A-Za-z]{2,}(?:\s+[A-Za-z]{2,})?\s+is my name/i;
  const hasNameInCurrentMessage = namePatternForCheck.test(currentUserMessage);
  const hasPhoneInCurrentMessage = /\b\(?\d{3}\)?[\s\-\.]?\d{3}[\s\-\.]?\d{4}\b/.test(currentUserMessage);
  const hasEmailInCurrentMessage = /\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/.test(currentUserMessage);
  const hasContactInCurrentMessage = hasPhoneInCurrentMessage || hasEmailInCurrentMessage;
  
  // Check conversation history for prior messages with name if current message only has contact info
  const hasNameInHistory = messages.some(m => 
    m.role === 'user' && namePatternForCheck.test(m.content)
  );
  const hasContactInHistory = messages.some(m => 
    m.role === 'user' && (/\b\(?\d{3}\)?[\s\-\.]?\d{3}[\s\-\.]?\d{4}\b/.test(m.content) || /\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/.test(m.content))
  );
  
  // We have complete info if: (name in current + contact in current) OR (name in history + contact in current) OR (name in current + contact in history)
  const hasCompleteInfoInConversation = 
    (hasNameInCurrentMessage && hasContactInCurrentMessage) ||
    (hasNameInHistory && hasContactInCurrentMessage) ||
    (hasNameInCurrentMessage && hasContactInHistory);
  
  // Only proceed if AI confirms OR we have complete contact info in the conversation
  if (!aiConfirmsBooking && !hasCompleteInfoInConversation) {
    return null;
  }

  const tourKeywords = /\b(tour|visit|come see|check out|see the house|see the place|come by|stop by|look around|walk through)\b/i;
  const callKeywords = /\b(call|phone|speak with|talk to|phone call|give .* a call|chat with|speak to someone)\b/i;
  const callbackKeywords = /\b(call\s*(?:me\s*)?back|callback|request\s*(?:a\s*)?call|get\s*back\s*to\s*me|reach\s*out|contact\s*me|follow\s*up)\b/i;
  
  // Determine booking type: callback > call > tour (more specific wins)
  let bookingType: 'tour' | 'phone_call' | 'request_callback';
  if (callbackKeywords.test(userMessages)) {
    bookingType = 'request_callback';
  } else if (callKeywords.test(userMessages)) {
    bookingType = 'phone_call';
  } else {
    bookingType = 'tour';
  }

  let name: string | undefined;
  let phone: string | undefined;
  let email: string | undefined;
  let preferredTime: string | undefined;

  // FIX: First search user messages only for contact info
  // Then fall back to AI summary if AI confirmed booking with structured format
  // Improved patterns to allow lowercase names and more flexible matching
  // Also handles "John Smith is my name" format
  const namePatterns = [
    /(?:my name is|i'?m|name:?|this is)\s+([A-Za-z][A-Za-z]+(?:\s+[A-Za-z][A-Za-z]+)?)/i,
    /(?:call me|it'?s)\s+([A-Za-z][A-Za-z]+(?:\s+[A-Za-z][A-Za-z]+)?)/i,
    /(?:i am|i'm)\s+([A-Za-z]+(?:\s+[A-Za-z]+)?)/i,
    /([A-Za-z][A-Za-z]+(?:\s+[A-Za-z][A-Za-z]+)?)\s+is my name\b/i,
  ];
  
  // Search user messages first (primary source)
  for (const pattern of namePatterns) {
    const match = userMessages.match(pattern);
    if (match && match[1] && match[1].length >= 2 && match[1].length < 50) {
      name = match[1].trim();
      break;
    }
  }
  
  // If not found in user messages, check AI's structured summary (permissive pattern)
  if (!name) {
    // Support bullet/dash prefixes like "- Name: asdf" and various label formats
    // Captures everything up to newline to handle all name formats including lowercase
    const aiNameMatch = aiSummaryText.match(/[-–•*]?\s*(?:(?:Client|Contact|Customer|Visitor|Guest|Your)?\s*Name)[:\-–•]?\s*([^\n,]+)/i);
    if (aiNameMatch && aiNameMatch[1] && aiNameMatch[1].trim().length >= 2 && aiNameMatch[1].trim().length < 50) {
      name = aiNameMatch[1].trim();
    }
  }

  const phonePatterns = [
    /(?:phone|number|cell|mobile|call me at|reach me at):?\s*([\d\s\-\(\)\.]{10,})/i,
    /\b(\(?\d{3}\)?[\s\-\.]?\d{3}[\s\-\.]?\d{4})\b/,
    /\b(\d{3}[\s\-\.]\d{3}[\s\-\.]\d{4})\b/,
  ];
  
  // Search user messages for phone (primary source)
  for (const pattern of phonePatterns) {
    const match = userMessages.match(pattern);
    if (match && match[1]) {
      const cleaned = match[1].replace(/\D/g, '');
      if (cleaned.length >= 10) {
        phone = match[1].trim();
        break;
      }
    }
  }
  
  // If not found in user messages, check AI's structured summary (permissive pattern)
  if (!phone) {
    // Support bullet/dash prefixes like "- Phone: 555-123-4567" and various label formats
    const aiPhoneMatch = aiSummaryText.match(/[-–•*]?\s*(?:Phone|Phone\s*Number|Contact\s*Number|Cell|Mobile|Telephone)[:\-–•]?\s*([\d\s\-\(\)\.]+)/i);
    if (aiPhoneMatch && aiPhoneMatch[1]) {
      const cleaned = aiPhoneMatch[1].replace(/\D/g, '');
      if (cleaned.length >= 10) {
        phone = aiPhoneMatch[1].trim();
      }
    }
  }

  const emailPatterns = [
    /(?:email|e-mail):?\s*([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i,
    /\b([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\b/,
  ];
  
  // Search user messages for email (primary source)
  for (const pattern of emailPatterns) {
    const match = userMessages.match(pattern);
    if (match && match[1]) {
      email = match[1].trim();
      break;
    }
  }
  
  // If not found in user messages, check AI's structured summary (permissive pattern)
  if (!email) {
    // Support bullet/dash prefixes like "- Email: test@example.com" and various label formats
    const aiEmailMatch = aiSummaryText.match(/[-–•*]?\s*(?:Email|Email\s*Address|E-mail|Contact\s*Email)[:\-–•]?\s*([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i);
    if (aiEmailMatch && aiEmailMatch[1]) {
      email = aiEmailMatch[1].trim();
    }
  }

  const timePatterns = [
    /(?:prefer|want|like|available|good for me|works for me|time:?|when:?)\s*(?:on\s+)?([A-Za-z]+(?:\s+(?:morning|afternoon|evening|night|\d{1,2}(?::\d{2})?\s*(?:am|pm)?)))/i,
    /(?:tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday)(?:\s+(?:morning|afternoon|evening|at\s+\d{1,2}(?::\d{2})?\s*(?:am|pm)?))?/i,
    /(?:this\s+)?(?:week|weekend|next\s+week)/i,
    /\d{1,2}(?::\d{2})?\s*(?:am|pm)/i,
  ];
  
  // Search user messages for time preference (primary source)
  for (const pattern of timePatterns) {
    const match = userMessages.match(pattern);
    if (match) {
      preferredTime = (match[1] || match[0]).trim();
      break;
    }
  }
  
  // If not found in user messages, check AI's structured summary (permissive pattern)
  if (!preferredTime) {
    // Support various label formats with flexible delimiters
    const aiTimeMatch = aiSummaryText.match(/(?:Preferred\s*time|Time|When|Availability|Schedule|Date|Appointment\s*Time)[:\-–•]?\s*([^\n]+)/i);
    if (aiTimeMatch && aiTimeMatch[1]) {
      preferredTime = aiTimeMatch[1].trim();
    }
  }
  
  if (!preferredTime) {
    preferredTime = 'To be confirmed';
  }

  // Parse the vague time phrase into an ISO datetime
  const parsedTime = parseVagueTimeToDatetime(preferredTime);
  const scheduledAt = parsedTime || undefined;
  if (scheduledAt) {
    structuredLogger.info('Booking time parsed', { preferredTime, scheduledAt });
  }
  
  // Extract requested service type (for barbershops, salons, etc.)
  let requestedService: string | undefined;
  const servicePatterns = [
    // Common barbershop/salon services
    /(?:want|need|get|book|schedule)(?:\s+a)?(?:\s+an?)?\s+(haircut|hair\s*cut|trim|beard\s*trim|shave|fade|lineup|line.?up|buzz\s*cut|taper|shape.?up|braids|twist|color|dye|highlights|perm|straightening|blowout|style|styling|manicure|pedicure|facial|massage|wax|waxing)/i,
    /(?:looking for|here for|came for|coming for)(?:\s+a)?(?:\s+an?)?\s+(haircut|hair\s*cut|trim|beard\s*trim|shave|fade|lineup|line.?up|buzz\s*cut|taper|shape.?up|braids|twist|color|dye|highlights|perm|straightening|blowout|style|styling|manicure|pedicure|facial|massage|wax|waxing)/i,
    // Direct service mention
    /\b(haircut|hair\s*cut|beard\s*trim|shave|fade|lineup|line.?up|buzz\s*cut|taper|shape.?up|braids|twist|colou?r|dye|highlights|perm|straightening|blowout|manicure|pedicure|facial|massage|wax(?:ing)?)\b/i,
  ];
  
  // Search user messages for service
  for (const pattern of servicePatterns) {
    const match = userMessages.match(pattern);
    if (match && match[1]) {
      requestedService = match[1].trim().toLowerCase();
      break;
    }
  }
  
  // Also check AI's structured summary for service
  if (!requestedService) {
    const aiServiceMatch = aiSummaryText.match(/[-–•*]?\s*(?:Service|Service\s*Requested|What|Treatment)[:\-–•]?\s*([^\n,]+)/i);
    if (aiServiceMatch && aiServiceMatch[1] && aiServiceMatch[1].trim().length >= 3) {
      requestedService = aiServiceMatch[1].trim().toLowerCase();
    }
  }

  // isComplete for internal bookings: name + phone is sufficient
  // For external bookings, we check isCompleteForExternal separately
  const isComplete = !!(name && phone);
  // For external booking mode, require name + phone + service
  const isCompleteForExternal = !!(name && phone && requestedService);
  
  structuredLogger.info('Booking info extraction result', {
    aiConfirmsBooking: true,
    bookingType,
    hasName: !!name,
    hasPhone: !!phone,
    hasEmail: !!email,
    hasPreferredTime: !!preferredTime,
    hasService: !!requestedService,
    requestedService,
    isComplete,
    isCompleteForExternal,
    extractedName: name,
    extractedPhone: phone?.slice(0, 6) + '***', // partial for privacy
    extractedEmail: email ? email.slice(0, 3) + '***' : undefined,
  });

  return {
    name,
    phone,
    email,
    preferredTime,
    scheduledAt,
    bookingType,
    isComplete,
    isCompleteForExternal,
    requestedService,
  };
}

/**
 * Extract contact info and booking intent from conversation messages
 * without requiring AI confirmation. Used as fallback when OpenAI fails.
 */
export function extractContactAndBookingFromMessages(
  messages: ChatMessage[],
  currentUserMessage: string
): {
  name?: string;
  phone?: string;
  email?: string;
  preferredTime?: string;
  scheduledAt?: string;
  bookingType?: 'tour' | 'phone_call';
  hasBookingIntent: boolean;
} {
  const userMessages = messages.filter(m => m.role === 'user').map(m => m.content);
  userMessages.push(currentUserMessage);
  const allUserText = userMessages.join(' ');
  
  // Extract contact info from user messages
  let name: string | undefined;
  let phone: string | undefined;
  let email: string | undefined;
  let preferredTime: string | undefined;
  
  // Name patterns
  const namePatterns = [
    /(?:my name is|i'?m|name:?|this is)\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i,
    /(?:call me|it'?s)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i,
  ];
  for (const pattern of namePatterns) {
    const match = allUserText.match(pattern);
    if (match && match[1] && match[1].length > 2 && match[1].length < 50) {
      name = match[1].trim();
      break;
    }
  }
  
  // Phone patterns
  const phonePatterns = [
    /(?:phone|number|cell|mobile|call me at|reach me at):?\s*([\d\s\-\(\)\.]{10,})/i,
    /\b(\(?\d{3}\)?[\s\-\.]?\d{3}[\s\-\.]?\d{4})\b/,
  ];
  for (const pattern of phonePatterns) {
    const match = allUserText.match(pattern);
    if (match && match[1]) {
      const cleaned = match[1].replace(/\D/g, '');
      if (cleaned.length >= 10) {
        phone = match[1].trim();
        break;
      }
    }
  }
  
  // Email patterns
  const emailPattern = /\b([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\b/;
  const emailMatch = allUserText.match(emailPattern);
  if (emailMatch && emailMatch[1]) {
    email = emailMatch[1].trim();
  }
  
  // Time patterns
  const timePatterns = [
    /(?:tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday)(?:\s+(?:morning|afternoon|evening|at\s+\d{1,2}(?::\d{2})?\s*(?:am|pm)?))?/i,
    /(?:this\s+)?(?:week|weekend|next\s+week)/i,
    /\d{1,2}(?::\d{2})?\s*(?:am|pm)/i,
  ];
  for (const pattern of timePatterns) {
    const match = allUserText.match(pattern);
    if (match) {
      preferredTime = match[0].trim();
      break;
    }
  }
  
  // Booking intent detection
  const tourKeywords = /\b(tour|visit|come see|check out|see the house|see the place|come by|stop by|look around|walk through)\b/i;
  const callKeywords = /\b(call|phone|speak with|talk to|phone call|give .* a call|chat with|speak to someone)\b/i;
  const bookingKeywords = /\b(book|booking|schedule|scheduling|appointment|reserve|reservation|tour|visit|phone call|call you|speak with|talk to|come see|check out the house)\b/i;
  
  const hasBookingIntent = bookingKeywords.test(allUserText);
  let bookingType: 'tour' | 'phone_call' | undefined;
  
  if (hasBookingIntent) {
    if (callKeywords.test(allUserText)) {
      bookingType = 'phone_call';
    } else if (tourKeywords.test(allUserText)) {
      bookingType = 'tour';
    }
  }
  
  // Parse time to datetime if we have a preferredTime
  const scheduledAt = preferredTime ? parseVagueTimeToDatetime(preferredTime) || undefined : undefined;
  
  return {
    name,
    phone,
    email,
    preferredTime,
    scheduledAt,
    bookingType,
    hasBookingIntent,
  };
}

// Initialize OpenAI client - prefer Replit AI integration (with baseURL), fallback to direct API key
const openaiApiKey = process.env.AI_INTEGRATIONS_OPENAI_API_KEY || process.env.OPENAI_API_KEY;
const openaiBaseUrl = process.env.AI_INTEGRATIONS_OPENAI_BASE_URL;

const openai = openaiApiKey
  ? new OpenAI({ 
      apiKey: openaiApiKey,
      baseURL: openaiBaseUrl || undefined, // Use Replit proxy if available
    })
  : null;

export type ChatSource = 'admin_preview' | 'public_widget' | 'demo_page' | 'client_site' | 'widget' | 'api';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface OrchestratorRequest {
  clientId: string;
  botId: string;
  messages: ChatMessage[];
  sessionId: string;
  language?: 'en' | 'es';
  source: ChatSource;
  widgetToken?: string;
}

// Action types for structured UI control
export interface BookingFinalizeAction {
  type: 'BOOKING_FINALIZE';
  handling: 'internal' | 'external';
  bookingIntentId: string;
  label: string;
  externalUrl?: string;  // Only if handling=external
  bookingType?: string;
}

export type OrchestratorAction = BookingFinalizeAction;

export interface OrchestratorMeta {
  clientId: string;
  botId: string;
  sessionId: string;
  responseTimeMs: number;
  showBooking: boolean;
  bookingType?: 'tour' | 'call' | 'appointment';  // Type of booking intent detected
  bookingMode: 'internal' | 'external';  // Whether booking is handled in-chat or via external URL
  externalBookingUrl: string | null;
  externalBookingProviderName?: string | null;  // e.g., "Square", "Acuity" for CTA button text
  externalPaymentUrl: string | null;
  suggestedReplies: string[];
  crisis?: boolean;
  automation?: boolean;
  ruleId?: string;
  leadCaptured?: boolean;
  bookingSaved?: boolean;  // When booking was saved during resilient persistence
  contactInfo?: { name?: string; email?: string; phone?: string };
  failsafeActivated?: boolean;  // True when external URL was invalid and we pivoted to internal
  actions?: OrchestratorAction[];  // Structured action payloads for frontend UI control
}

export interface OrchestratorResponse {
  success: boolean;
  reply: string;
  meta: OrchestratorMeta;
  error?: string;
  errorCode?: 'BOT_NOT_FOUND' | 'CLIENT_PAUSED' | 'LIMIT_EXCEEDED' | 'AI_UNAVAILABLE' | 'INTERNAL_ERROR';
}

export interface StreamChunk {
  type: 'chunk' | 'done' | 'error' | 'meta';
  content?: string;
  reply?: string;
  meta?: OrchestratorMeta;
  message?: string;
}

interface SessionData {
  sessionId: string;
  clientId: string;
  botId: string;
  startedAt: Date;
  lastMessageAt: Date;
  messageCount: number;
  userMessageCount: number;
  botMessageCount: number;
  totalResponseTimeMs: number;
  isActive: boolean;
  crisisDetected?: boolean;
  appointmentRequested?: boolean;
  leadCaptured?: boolean;
  topics?: string[];
  language?: string;
}

function logConversationToFile(data: {
  timestamp: string;
  clientId: string;
  botId: string;
  sessionId: string;
  userMessage: string;
  botReply: string;
}): void {
  // Only log message snippets in development to avoid exposing user data in production
  if (process.env.NODE_ENV !== 'production') {
    structuredLogger.info('Chat message', { 
      clientId: data.clientId, 
      botId: data.botId, 
      sessionId: data.sessionId,
      userMessageSnippet: data.userMessage.slice(0, 50),
      botReplySnippet: data.botReply.slice(0, 50)
    });
  }
}

function getBotCrisisResponse(config: BotConfig): string {
  return getCrisisResponse(config);
}

function determinePriority(
  hasBookingIntent: boolean,
  contactInfo: { email?: string; phone?: string; name?: string }
): 'high' | 'medium' | 'low' {
  if (hasBookingIntent && (contactInfo.email || contactInfo.phone)) {
    return 'high';
  }
  if (contactInfo.email || contactInfo.phone) {
    return 'medium';
  }
  return 'low';
}

class ConversationOrchestrator {
  /**
   * Process a chat message through the unified pipeline
   */
  async processMessage(request: OrchestratorRequest): Promise<OrchestratorResponse> {
    const startTime = Date.now();
    const { clientId, botId, messages, sessionId, language = 'en', source } = request;

    try {
      // 1. Load bot configuration (from cache)
      const botConfig = await configCache.getBotConfig(clientId, botId);
      if (!botConfig) {
        return this.errorResponse('BOT_NOT_FOUND', `Bot not found: ${clientId}/${botId}`, startTime, request);
      }

      // 2. Check client status
      const clientStatus = getClientStatus(clientId);
      if (clientStatus === 'paused') {
        return this.errorResponse('CLIENT_PAUSED', 'Service temporarily unavailable', startTime, request);
      }

      // 3. Check plan limits
      const limitCheck = await checkMessageLimit(clientId);
      if (!limitCheck.allowed) {
        return this.errorResponse('LIMIT_EXCEEDED', limitCheck.reason || 'Usage limit reached', startTime, request);
      }

      // 4. Get or create session data
      const sessionData = await this.getOrCreateSession(clientId, botId, sessionId, language);

      // 5. Get the last user message
      const lastUserMessage = messages[messages.length - 1];

      // 6. Crisis detection
      if (lastUserMessage?.role === 'user' && detectCrisisInMessage(lastUserMessage.content, botConfig)) {
        return await this.handleCrisisResponse(botConfig, sessionData, lastUserMessage.content, startTime, request);
      }

      // 7. Process automations
      const automationResult = this.processAutomationRules(botConfig, sessionData, lastUserMessage?.content || '');
      
      if (automationResult.triggered && automationResult.response && !automationResult.shouldContinue) {
        return await this.handleAutomationResponse(automationResult, sessionData, lastUserMessage?.content || '', startTime, request);
      }

      // 8. Build system prompt and call OpenAI
      const reply = await this.generateAIResponse(botConfig, messages, language, clientId);

      // 9. Post-processing: booking detection, lead capture
      const postProcessResult = await this.postProcessResponse(
        reply,
        lastUserMessage?.content || '',
        messages,
        sessionData,
        botConfig,
        clientId,
        botId
      );

      // 10. Update session and analytics with booking flag
      const responseTime = Date.now() - startTime;
      await this.updateSessionAndAnalytics(
        sessionData, 
        responseTime, 
        lastUserMessage?.content || '', 
        reply, 
        language,
        postProcessResult.showBooking
      );
      await incrementMessageCount(clientId);

      // 11. Log conversation
      logConversationToFile({
        timestamp: new Date().toISOString(),
        clientId,
        botId,
        sessionId,
        userMessage: lastUserMessage?.content || '',
        botReply: reply,
      });

      // 12. Get client settings for external URLs and booking mode
      const clientSettings = await configCache.getClientSettings(clientId);
      
      // 13. Use booking policy engine to resolve handling
      const bookingResolution = resolveBookingHandling({
        workspaceId: clientId,
        botId,
        bookingType: postProcessResult.bookingType,
        requestedService: postProcessResult.requestedService, // Pass detected service for service-specific URL lookup
        clientSettings: clientSettings ? {
          bookingMode: clientSettings.bookingMode as 'internal' | 'external',
          externalBookingUrl: clientSettings.externalBookingUrl,
          externalBookingProviderName: clientSettings.externalBookingProviderName,
          enableBookingFailsafe: clientSettings.enableBookingFailsafe,
          appointmentTypeModes: clientSettings.appointmentTypeModes as any,
          servicesCatalog: clientSettings.servicesCatalog as any, // Pass services catalog for service-specific URL lookup
        } : undefined,
      });
      
      const bookingMode = bookingResolution.handling;
      const bookingUrl = bookingResolution.externalUrl || null;
      const failsafeActivated = bookingResolution.failsafeActivated;
      
      // 14. Create booking intent and action payload when finalization is needed
      let actions: OrchestratorAction[] = [];
      
      // For internal bookings: Only emit BOOKING_FINALIZE when booking is actually saved (has complete info)
      // For external bookings: Only emit BOOKING_FINALIZE when name + phone + service are collected
      // This ensures the AI collects all customer info before showing the booking link
      const shouldEmitBookingAction = bookingMode === 'external' 
        ? postProcessResult.externalBookingInfoComplete 
        : postProcessResult.bookingSaved;
      
      structuredLogger.info('Booking action decision', {
        clientId,
        botId,
        sessionId,
        bookingMode,
        showBooking: postProcessResult.showBooking,
        externalBookingInfoComplete: postProcessResult.externalBookingInfoComplete,
        requestedService: postProcessResult.requestedService,
        bookingSaved: postProcessResult.bookingSaved,
        shouldEmitBookingAction,
      });
      
      if (shouldEmitBookingAction) {
        try {
          // Create a booking intent record server-side for tracking
          const bookingIntent = await storage.createBookingIntent({
            workspaceId: clientId,
            clientId: clientId,
            sessionId,
            bookingType: postProcessResult.bookingType || 'appointment',
            handling: bookingMode,
            externalUrl: bookingUrl || undefined,
            externalProviderName: clientSettings?.externalBookingProviderName || undefined,
            contactName: postProcessResult.contactInfo?.name || undefined,
            contactPhone: postProcessResult.contactInfo?.phone || undefined,
            contactEmail: postProcessResult.contactInfo?.email || undefined,
            status: 'intent',
          });
          
          // Build BOOKING_FINALIZE action for frontend
          const buttonLabel = getBookingButtonLabel(
            postProcessResult.bookingType,
            bookingMode,
            clientSettings?.externalBookingProviderName,
            language
          );
          
          actions.push({
            type: 'BOOKING_FINALIZE',
            handling: bookingMode,
            bookingIntentId: bookingIntent.id,
            label: buttonLabel,
            externalUrl: bookingMode === 'external' ? bookingUrl || undefined : undefined,
            bookingType: postProcessResult.bookingType,
          });
          
          structuredLogger.info('Booking intent created with action payload', {
            clientId,
            botId,
            sessionId,
            intentId: bookingIntent.id,
            handling: bookingMode,
            bookingType: postProcessResult.bookingType,
          });
        } catch (err) {
          structuredLogger.error('Failed to create booking intent', { error: err, clientId, botId, sessionId });
          
          // FALLBACK: Emit action without intent ID so button still appears
          // Widget can handle this by using legacy bookingUrl or prompting for contact info
          const fallbackLabel = getBookingButtonLabel(
            postProcessResult.bookingType,
            bookingMode,
            clientSettings?.externalBookingProviderName,
            language
          );
          
          actions.push({
            type: 'BOOKING_FINALIZE',
            handling: bookingMode,
            bookingIntentId: '', // Empty indicates fallback mode - widget should use legacy flow
            label: fallbackLabel,
            externalUrl: bookingMode === 'external' ? bookingUrl || undefined : undefined,
            bookingType: postProcessResult.bookingType,
          });
          
          structuredLogger.warn('Booking action emitted with fallback (no intent ID)', {
            clientId, botId, sessionId, handling: bookingMode
          });
        }
      }
      
      const responseActions = actions.length > 0 ? actions : undefined;
      
      structuredLogger.info('Orchestrator response prepared', {
        clientId,
        botId,
        sessionId,
        hasActions: !!responseActions,
        actionsCount: actions.length,
        bookingMode,
        bookingSaved: postProcessResult.bookingSaved,
        showBooking: postProcessResult.showBooking,
        actionsPreview: responseActions ? JSON.stringify(responseActions) : 'none',
      });
      
      return {
        success: true,
        reply,
        meta: {
          clientId,
          botId,
          sessionId,
          responseTimeMs: responseTime,
          showBooking: postProcessResult.showBooking,
          bookingType: postProcessResult.bookingType,
          bookingMode,
          bookingSaved: postProcessResult.bookingSaved,
          // Only include externalBookingUrl when we actually want to show the booking button
          // This prevents the widget's legacy fallback from showing the button prematurely
          externalBookingUrl: shouldEmitBookingAction ? bookingUrl : null,
          externalBookingProviderName: shouldEmitBookingAction && bookingMode === 'external' ? (clientSettings?.externalBookingProviderName || null) : null,
          externalPaymentUrl: postProcessResult.showBooking ? (clientSettings?.externalPaymentUrl || botConfig.externalPaymentUrl || null) : null,
          suggestedReplies: [],
          leadCaptured: postProcessResult.leadCaptured,
          contactInfo: postProcessResult.contactInfo,
          failsafeActivated,
          actions: responseActions,
        },
      };
    } catch (error: any) {
      structuredLogger.error('Error processing message', { error });
      
      // Check for OpenAI rate limit or transient errors
      const isRateLimitError = error?.status === 429 || 
        error?.code === 'rate_limit_exceeded' ||
        error?.message?.includes('Rate limit') ||
        error?.message?.includes('rate_limit') ||
        error?.message?.includes('429');
      
      const isTransientError = isRateLimitError || 
        error?.code === 'ETIMEDOUT' ||
        error?.code === 'ECONNRESET' ||
        error?.message?.includes('timeout') ||
        error?.message?.includes('network');
      
      if (isTransientError) {
        structuredLogger.error('OpenAI error (non-streaming) - attempting resilient lead/booking capture');
        
        // RESILIENT PERSISTENCE: Extract and save contact info even when OpenAI fails
        let savedLead = false;
        let savedBooking = false;
        
        try {
          const lastMsg = request.messages[request.messages.length - 1];
          const extracted = extractContactAndBookingFromMessages(request.messages, lastMsg?.content || '');
          
          // Save lead if we have contact info
          if (extracted.phone || extracted.email) {
            const existingLead = await storage.getLeadBySessionId(request.sessionId, request.clientId);
            
            if (!existingLead) {
              const newLead = await withRetry(
                () => storage.createLead({
                  clientId: request.clientId,
                  botId: request.botId,
                  sessionId: request.sessionId,
                  name: extracted.name || null,
                  email: extracted.email || null,
                  phone: extracted.phone || null,
                  status: 'new',
                  priority: extracted.hasBookingIntent ? 'high' : 'medium',
                  source: 'chat',
                  notes: 'Lead captured during AI service interruption - needs follow-up',
                }),
                'createLead (resilient non-stream)'
              );
              savedLead = true;
              
              // Trigger lead_captured automations
              triggerWorkflowByEvent(request.botId, 'lead_captured', {
                clientId: request.clientId,
                sessionId: request.sessionId,
                leadId: newLead.id,
                name: extracted.name,
                email: extracted.email,
                phone: extracted.phone,
              }).catch(err => structuredLogger.error('Error triggering lead_captured automation', { error: err }));
              
              structuredLogger.info('Resilient lead saved (non-streaming) despite OpenAI error', {
                clientId: request.clientId, sessionId: request.sessionId, hasPhone: !!extracted.phone, hasEmail: !!extracted.email
              });
            }
          }
          
          // Save booking if we have booking intent and contact info
          if (extracted.hasBookingIntent && extracted.phone && extracted.name) {
            const existingAppointment = await storage.getAppointmentBySessionId(request.sessionId, request.clientId);
            
            if (!existingAppointment) {
              const newAppointment = await storage.createAppointment(request.clientId, {
                name: extracted.name,
                contact: extracted.phone,
                email: extracted.email || null,
                preferredTime: extracted.preferredTime || 'Pending - needs confirmation',
                scheduledAt: extracted.scheduledAt ? new Date(extracted.scheduledAt) : null,
                appointmentType: extracted.bookingType || 'tour',
                notes: 'Booking created during AI service interruption - requires staff confirmation',
                contactPreference: 'phone',
                botId: request.botId,
                sessionId: request.sessionId,
              });
              savedBooking = true;
              
              // Trigger appointment_booked automations
              triggerWorkflowByEvent(request.botId, 'appointment_booked', {
                clientId: request.clientId,
                sessionId: request.sessionId,
                appointmentId: newAppointment.id,
                name: extracted.name,
                phone: extracted.phone,
                appointmentType: extracted.bookingType || 'tour',
              }).catch(err => structuredLogger.error('Error triggering appointment_booked automation', { error: err }));
              
              structuredLogger.info('Resilient booking saved (non-streaming) despite OpenAI error', {
                clientId: request.clientId, sessionId: request.sessionId, bookingType: extracted.bookingType, name: extracted.name
              });
            }
          }
        } catch (saveError) {
          structuredLogger.error('Error saving resilient lead/booking (non-streaming)', { error: saveError });
        }
        
        // Check if external booking is configured - show booking button even during errors
        let fallbackBookingUrl: string | null = null;
        let fallbackBookingMode: 'internal' | 'external' = 'internal';
        let fallbackProviderName: string | null = null;
        let failsafeActivated = false;
        let hasBookingIntent = false;
        
        try {
          const lastMsg = request.messages[request.messages.length - 1]?.content || '';
          const bookingKeywords = /\b(book|appointment|schedule|reserve|booking|consultation)\b/i;
          hasBookingIntent = bookingKeywords.test(lastMsg);
          
          const clientSettings = await configCache.getClientSettings(request.clientId);
          if (clientSettings?.bookingMode === 'external') {
            const candidateUrl = clientSettings.externalBookingUrl || null;
            if (isValidExternalBookingUrl(candidateUrl)) {
              fallbackBookingMode = 'external';
              fallbackBookingUrl = candidateUrl;
              fallbackProviderName = clientSettings.externalBookingProviderName || null;
            } else {
              // FAILSAFE: Invalid/missing URL - stay internal
              structuredLogger.warn('FAILSAFE in error handler: Invalid external URL', { clientId: request.clientId });
              failsafeActivated = true;
            }
          }
        } catch (e) {
          // Silently ignore - we'll just not show booking button
        }
        
        const showBookingOnError = hasBookingIntent && fallbackBookingMode === 'external' && !!fallbackBookingUrl;
        
        // Build appropriate friendly message based on what was saved
        let friendlyMessage: string;
        if (savedBooking) {
          friendlyMessage = "I'm experiencing some delays right now, but I've saved your information and booking request! Our team will reach out shortly to confirm the details. Thank you for your patience!";
        } else if (savedLead && showBookingOnError) {
          friendlyMessage = "I'm experiencing some delays right now, but I've saved your contact information. You can complete your booking by clicking the button below!";
        } else if (savedLead) {
          friendlyMessage = "I'm experiencing some delays right now, but don't worry - I've saved your contact information. Our team will reach out to you soon. Thank you for your patience!";
        } else if (showBookingOnError) {
          friendlyMessage = "I apologize, but I'm experiencing high demand right now. However, you can still complete your booking by clicking the button below!";
        } else {
          friendlyMessage = "I apologize, but I'm experiencing high demand right now. Please try again in a moment, or feel free to call us directly for immediate assistance.";
        }
        
        return {
          success: true,
          reply: friendlyMessage,
          meta: {
            clientId: request.clientId,
            botId: request.botId,
            sessionId: request.sessionId || `session_${Date.now()}`,
            responseTimeMs: Date.now() - startTime,
            showBooking: showBookingOnError || hasBookingIntent,
            bookingMode: fallbackBookingMode,
            externalBookingUrl: showBookingOnError ? fallbackBookingUrl : null,
            externalBookingProviderName: showBookingOnError ? fallbackProviderName : null,
            externalPaymentUrl: null,
            suggestedReplies: (showBookingOnError || hasBookingIntent) ? [] : ["When can I call you?", "What are your hours?"],
            leadCaptured: savedLead,
            bookingSaved: savedBooking,
            failsafeActivated,
          },
        };
      }
      
      return this.errorResponse('INTERNAL_ERROR', 'An error occurred processing your message', startTime, request);
    }
  }

  /**
   * Process a chat message with streaming response
   */
  async *processMessageStream(request: OrchestratorRequest): AsyncGenerator<StreamChunk> {
    const startTime = Date.now();
    const { clientId, botId, messages, sessionId, language = 'en' } = request;

    try {
      // 1. Load bot configuration
      const botConfig = await configCache.getBotConfig(clientId, botId);
      if (!botConfig) {
        yield { type: 'error', message: `Bot not found: ${clientId}/${botId}` };
        return;
      }

      // 2. Check client status
      const clientStatus = getClientStatus(clientId);
      if (clientStatus === 'paused') {
        yield { type: 'error', message: 'Service temporarily unavailable' };
        return;
      }

      // 3. Check plan limits
      const limitCheck = await checkMessageLimit(clientId);
      if (!limitCheck.allowed) {
        yield { type: 'error', message: limitCheck.reason || 'Usage limit reached' };
        return;
      }

      // 4. Get session and last message
      const sessionData = await this.getOrCreateSession(clientId, botId, sessionId, language);
      const lastUserMessage = messages[messages.length - 1];

      // 5. Crisis detection (non-streamed) - no booking button for crisis
      if (lastUserMessage?.role === 'user' && detectCrisisInMessage(lastUserMessage.content, botConfig)) {
        const crisisReply = getBotCrisisResponse(botConfig);
        
        yield {
          type: 'done',
          reply: crisisReply,
          meta: {
            clientId,
            botId,
            sessionId,
            responseTimeMs: Date.now() - startTime,
            showBooking: false,
            bookingMode: 'internal',
            externalBookingUrl: null,
            externalPaymentUrl: null,
            suggestedReplies: [],
            crisis: true,
          },
        };
        return;
      }

      // 6. Check automations (non-streamed if triggered) - no booking button for automations
      const automationResult = this.processAutomationRules(botConfig, sessionData, lastUserMessage?.content || '');
      
      if (automationResult.triggered && automationResult.response && !automationResult.shouldContinue) {
        await incrementAutomationCount(clientId);
        
        yield {
          type: 'done',
          reply: automationResult.response,
          meta: {
            clientId,
            botId,
            sessionId,
            responseTimeMs: Date.now() - startTime,
            showBooking: false,
            bookingMode: 'internal',
            externalBookingUrl: null,
            externalPaymentUrl: null,
            suggestedReplies: [],
            automation: true,
            ruleId: automationResult.ruleId,
          },
        };
        return;
      }

      // 7. Build system prompt and stream OpenAI response
      if (!openai) {
        yield { type: 'error', message: 'AI service not configured' };
        return;
      }

      const clientSettings = await configCache.getClientSettings(clientId);
      
      // Inject external URLs into bot config for prompt building
      const botConfigWithUrls: BotConfig = {
        ...botConfig,
        externalBookingUrl: clientSettings?.externalBookingUrl || botConfig.externalBookingUrl,
        externalPaymentUrl: clientSettings?.externalPaymentUrl || botConfig.externalPaymentUrl,
      };

      const systemPrompt = buildSystemPromptFromConfig(botConfigWithUrls, clientSettings?.behaviorPreset as any);

      const stream = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages,
        ],
        max_completion_tokens: 500,
        stream: true,
      });

      let fullReply = '';

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          fullReply += content;
          yield { type: 'chunk', content };
        }
      }

      // 8. Post-processing
      const postProcessResult = await this.postProcessResponse(
        fullReply,
        lastUserMessage?.content || '',
        messages,
        sessionData,
        botConfig,
        clientId,
        botId
      );

      // 9. Update session and analytics with booking flag
      const responseTime = Date.now() - startTime;
      await this.updateSessionAndAnalytics(
        sessionData, 
        responseTime, 
        lastUserMessage?.content || '', 
        fullReply, 
        language,
        postProcessResult.showBooking
      );
      await incrementMessageCount(clientId);

      // 10. Use booking policy engine to resolve handling (same as non-streaming path)
      const bookingResolution = resolveBookingHandling({
        workspaceId: clientId,
        botId,
        bookingType: postProcessResult.bookingType,
        requestedService: postProcessResult.requestedService, // Pass detected service for service-specific URL lookup
        clientSettings: clientSettings ? {
          bookingMode: clientSettings.bookingMode as 'internal' | 'external',
          externalBookingUrl: clientSettings.externalBookingUrl,
          externalBookingProviderName: clientSettings.externalBookingProviderName,
          enableBookingFailsafe: clientSettings.enableBookingFailsafe,
          appointmentTypeModes: clientSettings.appointmentTypeModes as any,
          servicesCatalog: clientSettings.servicesCatalog as any, // Pass services catalog for service-specific URL lookup
        } : undefined,
      });
      
      const streamBookingMode = bookingResolution.handling;
      const bookingUrl = bookingResolution.externalUrl || null;
      const failsafeActivated = bookingResolution.failsafeActivated;

      // 11. Create booking intent and action payload when finalization is needed
      let streamActions: OrchestratorAction[] = [];
      
      // For internal bookings: Only emit BOOKING_FINALIZE when booking is actually saved (has complete info)
      // For external bookings: Emit BOOKING_FINALIZE when showBooking is true (user can click to external system)
      const shouldEmitBookingAction = streamBookingMode === 'external' 
        ? postProcessResult.showBooking 
        : postProcessResult.bookingSaved;
      
      if (shouldEmitBookingAction) {
        try {
          // Create a booking intent record server-side for tracking
          const bookingIntent = await storage.createBookingIntent({
            workspaceId: clientId,
            clientId: clientId,
            sessionId,
            bookingType: postProcessResult.bookingType || 'appointment',
            handling: streamBookingMode,
            externalUrl: bookingUrl || undefined,
            externalProviderName: clientSettings?.externalBookingProviderName || undefined,
            contactName: postProcessResult.contactInfo?.name || undefined,
            contactPhone: postProcessResult.contactInfo?.phone || undefined,
            contactEmail: postProcessResult.contactInfo?.email || undefined,
            status: 'intent',
          });
          
          // Build BOOKING_FINALIZE action for frontend
          const buttonLabel = getBookingButtonLabel(
            postProcessResult.bookingType,
            streamBookingMode,
            clientSettings?.externalBookingProviderName,
            language
          );
          
          streamActions.push({
            type: 'BOOKING_FINALIZE',
            handling: streamBookingMode,
            bookingIntentId: bookingIntent.id,
            label: buttonLabel,
            externalUrl: streamBookingMode === 'external' ? bookingUrl || undefined : undefined,
            bookingType: postProcessResult.bookingType,
          });
          
          structuredLogger.info('Booking intent created (streaming) with action payload', {
            clientId,
            botId,
            sessionId,
            intentId: bookingIntent.id,
            handling: streamBookingMode,
            bookingType: postProcessResult.bookingType,
          });
        } catch (err) {
          structuredLogger.error('Failed to create booking intent (streaming)', { error: err, clientId, botId, sessionId });
          
          // FALLBACK: Emit action without intent ID so button still appears
          const fallbackLabel = getBookingButtonLabel(
            postProcessResult.bookingType,
            streamBookingMode,
            clientSettings?.externalBookingProviderName,
            language
          );
          
          streamActions.push({
            type: 'BOOKING_FINALIZE',
            handling: streamBookingMode,
            bookingIntentId: '', // Empty indicates fallback mode
            label: fallbackLabel,
            externalUrl: streamBookingMode === 'external' ? bookingUrl || undefined : undefined,
            bookingType: postProcessResult.bookingType,
          });
          
          structuredLogger.warn('Booking action emitted with fallback (streaming, no intent ID)', {
            clientId, botId, sessionId, handling: streamBookingMode
          });
        }
      }

      const paymentUrl = postProcessResult.showBooking 
        ? (clientSettings?.externalPaymentUrl || botConfig.externalPaymentUrl || null)
        : null;
      
      yield {
        type: 'done',
        reply: fullReply,
        meta: {
          clientId,
          botId,
          sessionId,
          responseTimeMs: responseTime,
          showBooking: postProcessResult.showBooking,
          bookingType: postProcessResult.bookingType,
          bookingMode: streamBookingMode,
          externalBookingUrl: bookingUrl,
          externalBookingProviderName: streamBookingMode === 'external' ? (clientSettings?.externalBookingProviderName || null) : null,
          externalPaymentUrl: paymentUrl,
          suggestedReplies: [],
          leadCaptured: postProcessResult.leadCaptured,
          bookingSaved: postProcessResult.bookingSaved || false,
          contactInfo: postProcessResult.contactInfo,
          failsafeActivated,
          actions: streamActions.length > 0 ? streamActions : undefined,
        },
      };

    } catch (error: any) {
      structuredLogger.error('Stream error', { error });
      
      // Check for OpenAI rate limit errors or transient errors
      const isRateLimitError = error?.status === 429 || 
        error?.code === 'rate_limit_exceeded' ||
        error?.message?.includes('Rate limit') ||
        error?.message?.includes('rate_limit') ||
        error?.message?.includes('429');
      
      const isTransientError = isRateLimitError || 
        error?.code === 'ETIMEDOUT' ||
        error?.code === 'ECONNRESET' ||
        error?.message?.includes('timeout') ||
        error?.message?.includes('network');
      
      if (isTransientError) {
        structuredLogger.error('OpenAI error - attempting to save lead/booking before returning friendly message');
        
        // RESILIENT PERSISTENCE: Extract and save contact info even when OpenAI fails
        let savedLead = false;
        let savedBooking = false;
        
        try {
          const lastMsg = messages[messages.length - 1];
          const extracted = extractContactAndBookingFromMessages(messages, lastMsg?.content || '');
          
          // Save lead if we have contact info
          if (extracted.phone || extracted.email) {
            const existingLead = await storage.getLeadBySessionId(sessionId, clientId);
            
            if (!existingLead) {
              const newLead = await withRetry(
                () => storage.createLead({
                  clientId,
                  botId,
                  sessionId,
                  name: extracted.name || null,
                  email: extracted.email || null,
                  phone: extracted.phone || null,
                  status: 'new',
                  priority: extracted.hasBookingIntent ? 'high' : 'medium',
                  source: 'chat',
                  notes: 'Lead captured during AI service interruption - needs follow-up',
                }),
                'createLead (resilient)'
              );
              savedLead = true;
              
              // Trigger lead_captured automations
              triggerWorkflowByEvent(botId, 'lead_captured', {
                clientId,
                sessionId,
                leadId: newLead.id,
                name: extracted.name,
                email: extracted.email,
                phone: extracted.phone,
              }).catch(err => structuredLogger.error('Error triggering lead_captured automation', { error: err }));
              
              structuredLogger.info('Resilient lead saved despite OpenAI error', {
                clientId, sessionId, hasPhone: !!extracted.phone, hasEmail: !!extracted.email
              });
            }
          }
          
          // Save booking if we have booking intent and contact info
          if (extracted.hasBookingIntent && extracted.phone && extracted.name) {
            const existingAppointment = await storage.getAppointmentBySessionId(sessionId, clientId);
            
            if (!existingAppointment) {
              const newAppointment = await storage.createAppointment(clientId, {
                name: extracted.name,
                contact: extracted.phone,
                email: extracted.email || null,
                preferredTime: extracted.preferredTime || 'Pending - needs confirmation',
                scheduledAt: extracted.scheduledAt ? new Date(extracted.scheduledAt) : null,
                appointmentType: extracted.bookingType || 'tour',
                notes: 'Booking created during AI service interruption - requires staff confirmation',
                contactPreference: 'phone',
                botId,
                sessionId,
              });
              savedBooking = true;
              
              // Trigger appointment_booked automations
              triggerWorkflowByEvent(botId, 'appointment_booked', {
                clientId,
                sessionId,
                appointmentId: newAppointment.id,
                name: extracted.name,
                phone: extracted.phone,
                appointmentType: extracted.bookingType || 'tour',
              }).catch(err => structuredLogger.error('Error triggering appointment_booked automation', { error: err }));
              
              structuredLogger.info('Resilient booking saved despite OpenAI error', {
                clientId, sessionId, bookingType: extracted.bookingType, name: extracted.name
              });
            }
          }
        } catch (saveError) {
          structuredLogger.error('Error saving resilient lead/booking', { error: saveError });
        }
        
        // Check if external booking is configured - show booking button even during errors
        let fallbackBookingUrl: string | null = null;
        let fallbackBookingMode: 'internal' | 'external' = 'internal';
        let fallbackProviderName: string | null = null;
        let hasBookingIntent = false;
        
        try {
          const lastMsg = messages[messages.length - 1]?.content || '';
          const bookingKeywords = /\b(book|appointment|schedule|reserve|booking|consultation)\b/i;
          hasBookingIntent = bookingKeywords.test(lastMsg);
          
          const fallbackSettings = await configCache.getClientSettings(clientId);
          if (fallbackSettings?.bookingMode === 'external' && fallbackSettings?.externalBookingUrl) {
            fallbackBookingMode = 'external';
            fallbackBookingUrl = fallbackSettings.externalBookingUrl;
            fallbackProviderName = fallbackSettings.externalBookingProviderName || null;
          }
        } catch (e) {
          // Silently ignore
        }
        
        const showBookingOnError = hasBookingIntent && fallbackBookingMode === 'external' && !!fallbackBookingUrl;
        
        // Build appropriate friendly message based on what was saved
        let friendlyMessage: string;
        if (savedBooking) {
          friendlyMessage = "I'm experiencing some delays right now, but I've saved your information and booking request! Our team will reach out shortly to confirm the details. Thank you for your patience!";
        } else if (savedLead && showBookingOnError) {
          friendlyMessage = "I'm experiencing some delays right now, but I've saved your contact information. You can complete your booking by clicking the button below!";
        } else if (savedLead) {
          friendlyMessage = "I'm experiencing some delays right now, but don't worry - I've saved your contact information. Our team will reach out to you soon. Thank you for your patience!";
        } else if (showBookingOnError) {
          friendlyMessage = "I apologize, but I'm experiencing high demand right now. However, you can still complete your booking by clicking the button below!";
        } else {
          friendlyMessage = "I apologize, but I'm experiencing high demand right now. Please try again in a moment, or feel free to call us directly for immediate assistance.";
        }
        
        yield { 
          type: 'done', 
          reply: friendlyMessage,
          meta: {
            clientId,
            botId,
            sessionId,
            responseTimeMs: Date.now() - startTime,
            showBooking: showBookingOnError,
            bookingMode: fallbackBookingMode,
            externalBookingUrl: showBookingOnError ? fallbackBookingUrl : null,
            externalBookingProviderName: showBookingOnError ? fallbackProviderName : null,
            externalPaymentUrl: null,
            suggestedReplies: showBookingOnError ? [] : ["When can I call you?", "What are your hours?"],
            leadCaptured: savedLead,
            bookingSaved: savedBooking,
          }
        };
        return;
      }
      
      yield { type: 'error', message: 'An error occurred processing your message' };
    }
  }

  /**
   * Get or create a chat session
   */
  private async getOrCreateSession(
    clientId: string,
    botId: string,
    sessionId: string,
    language: string
  ): Promise<SessionData> {
    const existingSession = await storage.getChatSession(sessionId, clientId, botId);
    
    if (existingSession) {
      return {
        sessionId: existingSession.sessionId,
        clientId: existingSession.clientId,
        botId: existingSession.botId,
        startedAt: existingSession.startedAt,
        lastMessageAt: new Date(),
        messageCount: existingSession.userMessageCount + existingSession.botMessageCount,
        userMessageCount: existingSession.userMessageCount,
        botMessageCount: existingSession.botMessageCount,
        totalResponseTimeMs: existingSession.totalResponseTimeMs,
        isActive: true,
        crisisDetected: existingSession.crisisDetected ?? undefined,
        appointmentRequested: existingSession.appointmentRequested ?? undefined,
        leadCaptured: false, // Will be detected fresh from conversation
        topics: (existingSession.topics as string[]) || [],
        language,
      };
    }

    // Create new session data (will be persisted after first response)
    return {
      sessionId,
      clientId,
      botId,
      startedAt: new Date(),
      lastMessageAt: new Date(),
      messageCount: 0,
      userMessageCount: 0,
      botMessageCount: 0,
      totalResponseTimeMs: 0,
      isActive: true,
      topics: [],
      language,
    };
  }

  /**
   * Process automation rules
   */
  private processAutomationRules(
    botConfig: BotConfig,
    sessionData: SessionData,
    message: string
  ): AutomationResult {
    const automationContext: AutomationContext = {
      clientId: sessionData.clientId,
      botId: sessionData.botId,
      sessionId: sessionData.sessionId,
      message,
      messageCount: sessionData.messageCount,
      timezone: botConfig.automations?.officeHours?.timezone,
      language: sessionData.language,
      officeHours: botConfig.automations?.officeHours,
    };

    return processAutomations(automationContext, botConfig.automations as BotAutomationConfig);
  }

  /**
   * Generate AI response using OpenAI with timeout and graceful fallback
   */
  private async generateAIResponse(
    botConfig: BotConfig,
    messages: ChatMessage[],
    language: string,
    clientId: string
  ): Promise<string> {
    if (!openai) {
      throw new Error('AI service not configured');
    }

    // Get client settings for external URLs and contact info for fallback
    const clientSettings = await configCache.getClientSettings(clientId);
    
    // Inject external URLs into bot config for prompt building
    const botConfigWithUrls: BotConfig = {
      ...botConfig,
      externalBookingUrl: clientSettings?.externalBookingUrl || botConfig.externalBookingUrl,
      externalPaymentUrl: clientSettings?.externalPaymentUrl || botConfig.externalPaymentUrl,
    };

    const systemPrompt = buildSystemPromptFromConfig(botConfigWithUrls, clientSettings?.behaviorPreset as any);

    // Build graceful fallback message with business contact info
    const businessPhone = clientSettings?.primaryPhone || botConfig.businessProfile?.phone;
    const businessEmail = clientSettings?.primaryEmail || botConfig.businessProfile?.email;
    const businessName = clientSettings?.businessName || botConfig.businessProfile?.businessName || 'our team';
    
    const contactDetails = [
      businessPhone && `call us at ${businessPhone}`,
      businessEmail && `email us at ${businessEmail}`,
    ].filter(Boolean).join(' or ');
    
    const fallbackMessage = language === 'es'
      ? `Disculpa, estoy teniendo dificultades técnicas. Por favor, comparte tu nombre y número de contacto para que ${businessName} pueda comunicarse contigo.${contactDetails ? ` También puedes ${contactDetails}.` : ''}`
      : `I'm having a bit of trouble right now, but I'd love to help! Could you share your name and best contact number or email so ${businessName} can reach out to you?${contactDetails ? ` You can also ${contactDetails}.` : ''}`;

    // 12 second timeout for OpenAI call
    const AI_TIMEOUT_MS = 12000;
    
    try {
      const completionPromise = openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages,
        ],
        max_completion_tokens: 500,
      });
      
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('AI_TIMEOUT')), AI_TIMEOUT_MS);
      });
      
      const completion = await Promise.race([completionPromise, timeoutPromise]);
      
      const defaultReply = language === 'es'
        ? 'Estoy aquí para ayudar. ¿Cómo puedo asistirte hoy?'
        : 'I\'m here to help. How can I assist you today?';

      return completion.choices[0]?.message?.content || defaultReply;
    } catch (error: any) {
      if (error?.message === 'AI_TIMEOUT') {
        structuredLogger.warn('OpenAI timeout', { timeoutMs: AI_TIMEOUT_MS, clientId });
      } else {
        structuredLogger.error('OpenAI error', { clientId, error: error?.message || error });
      }
      return fallbackMessage;
    }
  }

  /**
   * Post-process response for booking detection, lead capture, and topic tracking
   */
  private async postProcessResponse(
    reply: string,
    userMessage: string,
    messages: ChatMessage[],
    sessionData: SessionData,
    botConfig: BotConfig,
    clientId: string,
    botId: string
  ): Promise<{
    showBooking: boolean;
    externalBookingInfoComplete: boolean; // For external mode: name + phone + service collected
    bookingType?: 'tour' | 'call' | 'appointment';
    leadCaptured: boolean;
    bookingSaved?: boolean;
    contactInfo?: { name?: string; email?: string; phone?: string };
    requestedService?: string;
  }> {
    // Topic categorization
    const topic = categorizeMessageTopic(userMessage);
    if (topic !== 'general') {
      if (!sessionData.topics) {
        sessionData.topics = [];
      }
      if (!sessionData.topics.includes(topic)) {
        sessionData.topics.push(topic);
      }
    }

    // Booking intent detection - includes sober living specific terms (tour, phone call, etc.)
    const bookingKeywords = /\b(book|booking|schedule|scheduling|appointment|reserve|reservation|tour|visit|phone call|call you|speak with|talk to|come see|check out the house|see the house|see the place)\b|\bset up (a |an )?(appointment|meeting|visit|consultation|tour|call|phone call)\b|\bwant to (come in|visit|see you|tour|check it out|take a look|see the house|see the place)\b/i;
    const affirmativeKeywords = /\b(yes|yeah|sure|please|ok|okay|sounds good|that works|let'?s do|perfect|great|definitely|absolutely)\b/i;
    const aiAskedAboutBooking = /\b(schedule|book|appointment|come in|visit|tour|call|phone|when|preferred|date|time|availability)\b/i;

    // Booking type detection patterns
    const tourKeywords = /\b(tour|visit|come see|check out|see the house|see the place|come by|stop by|look around|walk through|open house)\b/i;
    const callKeywords = /\b(call|phone|speak with|talk to|phone call|give .* a call|chat with|speak to someone|call back|callback|ring)\b/i;

    const previousAssistantMessage = messages.filter(m => m.role === 'assistant').slice(-1)[0]?.content || '';
    
    const directBookingIntent = bookingKeywords.test(userMessage);
    const isAffirmativeToBookingPrompt = affirmativeKeywords.test(userMessage) && aiAskedAboutBooking.test(previousAssistantMessage);
    const alreadyRequestedBooking = sessionData.appointmentRequested || false;
    
    const conversationHasBookingIntent = messages.some(m => 
      m.role === 'user' && bookingKeywords.test(m.content)
    );
    
    // AI explicitly confirms booking is ready (not just mentioning booking as an option)
    const aiConfirmsBookingReady = /\b(finalize.*booking|complete.*booking|ready to book|booking confirmed|I.{0,20}scheduled|appointment.{0,15}(set|confirmed|booked)|click.*button.*book)\b/i.test(reply);
    
    // Extract booking info early to check if complete info has been collected
    const bookingInfo = extractBookingInfoFromConversation(messages, reply, userMessage);
    const bookingInfoComplete = bookingInfo?.isComplete || false;
    
    // Show booking button based on ACTIVE user intent - not just because AI mentioned booking
    // Direct intent: User explicitly asks to book in THIS message
    // Affirmative: User says "yes" to an AI booking prompt
    // Complete info: User has provided all booking details
    // AI confirms ready: AI says booking is finalized/ready (not just offering)
    const showBooking = directBookingIntent || isAffirmativeToBookingPrompt || bookingInfoComplete || aiConfirmsBookingReady;

    // Determine booking type based on user's message and conversation context
    let bookingType: 'tour' | 'call' | 'appointment' | undefined;
    if (showBooking) {
      // Check recent user messages for booking type
      const allUserMessages = messages.filter(m => m.role === 'user').map(m => m.content).join(' ') + ' ' + userMessage;
      
      if (callKeywords.test(allUserMessages)) {
        bookingType = 'call';
      } else if (tourKeywords.test(allUserMessages)) {
        bookingType = 'tour';
      } else {
        bookingType = 'appointment';
      }
    }

    // Track booking intent in session for lead prioritization, but not for button display
    if (directBookingIntent || isAffirmativeToBookingPrompt) {
      sessionData.appointmentRequested = true;
    }

    // Lead capture from message content - use both extractors for maximum capture
    const contactInfo = extractContactInfo(userMessage);
    
    // Also use extractContactSignals for careful email/phone extraction from any message
    const contactSignals = extractContactSignals(userMessage);
    
    // Merge signals into contactInfo if not already captured
    if (contactSignals.email && !contactInfo.email) {
      contactInfo.email = contactSignals.email;
    }
    if (contactSignals.phone && !contactInfo.phone) {
      contactInfo.phone = contactSignals.phone;
    }
    
    // Also merge from bookingInfo which may have extracted from AI summary
    if (bookingInfo) {
      if (bookingInfo.name && !contactInfo.name) contactInfo.name = bookingInfo.name;
      if (bookingInfo.email && !contactInfo.email) contactInfo.email = bookingInfo.email;
      if (bookingInfo.phone && !contactInfo.phone) contactInfo.phone = bookingInfo.phone;
    }
    
    const leadCaptured = !!(contactInfo.email || contactInfo.phone);
    
    structuredLogger.info('Contact info extraction result', {
      clientId,
      sessionId: sessionData.sessionId,
      hasName: !!contactInfo.name,
      hasEmail: !!contactInfo.email,
      hasPhone: !!contactInfo.phone,
      leadCaptured,
      previouslyLeadCaptured: sessionData.leadCaptured,
      bookingInfoComplete: bookingInfo?.isComplete,
    });

    // Always try to create/update lead if we have contact info (not just first time)
    if (leadCaptured) {
      // Create or update lead
      try {
        const existingLead = await storage.getLeadBySessionId(sessionData.sessionId, clientId);
        
        if (existingLead) {
          const updates: any = {};
          if (contactInfo.name && !existingLead.name) updates.name = contactInfo.name;
          if (contactInfo.email && !existingLead.email) updates.email = contactInfo.email;
          if (contactInfo.phone && !existingLead.phone) updates.phone = contactInfo.phone;
          
          const priority = determinePriority(showBooking, contactInfo);
          if (priority === 'high' && existingLead.priority !== 'high') {
            updates.priority = priority;
          }
          
          if (Object.keys(updates).length > 0) {
            await storage.updateLead(clientId, existingLead.id, updates);
            structuredLogger.info('Lead updated with new contact info', {
              leadId: existingLead.id,
              clientId,
              updates: Object.keys(updates),
            });
          }
        } else {
          const priority = determinePriority(showBooking, contactInfo);
          const newLead = await withRetry(
            () => storage.createLead({
              clientId,
              botId,
              sessionId: sessionData.sessionId,
              name: contactInfo.name || null,
              email: contactInfo.email || null,
              phone: contactInfo.phone || null,
              status: 'new',
              priority,
              source: 'chat',
            }),
            'createLead'
          );
          
          structuredLogger.info('New lead created', {
            leadId: newLead.id,
            clientId,
            sessionId: sessionData.sessionId,
            name: contactInfo.name,
            hasEmail: !!contactInfo.email,
            hasPhone: !!contactInfo.phone,
          });
          
          // Trigger lead_captured automations
          triggerWorkflowByEvent(botId, 'lead_captured', {
            clientId,
            sessionId: sessionData.sessionId,
            leadId: newLead.id,
            name: contactInfo.name,
            email: contactInfo.email,
            phone: contactInfo.phone,
          }).catch(err => structuredLogger.error('Error triggering lead_captured automation', { error: err }));
        }
        
        sessionData.leadCaptured = true;
      } catch (error) {
        structuredLogger.error('Error capturing lead', { error, clientId, sessionId: sessionData.sessionId });
      }
    }

    // AI-driven booking creation: When AI confirms it has "noted" the booking request
    // with complete info (name + phone required), create an appointment record
    // Note: bookingInfo is already extracted earlier for showBooking detection
    let bookingSaved = false;
    
    if (bookingInfo && bookingInfo.isComplete) {
      try {
        // DEDUPLICATION: Check for existing appointment by session ID first
        const existingAppointment = await storage.getAppointmentBySessionId(
          sessionData.sessionId,
          clientId
        );
        
        // CROSS-SESSION DEDUPLICATION: Check for any appointment with same type + contact info 
        // within 5-minute window to prevent spam across different sessions (e.g., widget refresh)
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        const allAppointments = await storage.getAllAppointments(clientId);
        const isDuplicateRecent = allAppointments.some(apt => {
          if (!apt.createdAt || new Date(apt.createdAt) <= fiveMinutesAgo) return false;
          if (apt.appointmentType !== bookingInfo.bookingType) return false;
          
          // Match by contact info (phone or email) for cross-session dedupe
          // Also match by sessionId for same-session dedupe
          const sameSession = apt.sessionId === sessionData.sessionId;
          const samePhone = bookingInfo.phone && apt.contact === bookingInfo.phone;
          const sameEmail = bookingInfo.email && apt.email === bookingInfo.email;
          
          return sameSession || samePhone || sameEmail;
        });
        
        if (!existingAppointment && !isDuplicateRecent) {
          structuredLogger.info('Creating AI-driven booking', {
            clientId,
            botId,
            sessionId: sessionData.sessionId,
            bookingType: bookingInfo.bookingType,
            name: bookingInfo.name,
            hasPhone: !!bookingInfo.phone,
            hasEmail: !!bookingInfo.email,
          });
          
          const newAppointment = await storage.createAppointment(clientId, {
            name: bookingInfo.name!,
            contact: bookingInfo.phone!,
            email: bookingInfo.email || null,
            preferredTime: bookingInfo.preferredTime || 'To be confirmed',
            scheduledAt: bookingInfo.scheduledAt ? new Date(bookingInfo.scheduledAt) : null,
            appointmentType: bookingInfo.bookingType,
            notes: bookingInfo.notes || null,
            contactPreference: 'phone',
            botId: botId,
            sessionId: sessionData.sessionId,
          });
          
          // Trigger appointment_booked automations
          triggerWorkflowByEvent(botId, 'appointment_booked', {
            clientId,
            sessionId: sessionData.sessionId,
            appointmentId: newAppointment.id,
            name: bookingInfo.name,
            phone: bookingInfo.phone,
            appointmentType: bookingInfo.bookingType,
          }).catch(err => structuredLogger.error('Error triggering appointment_booked automation', { error: err }));
          
          bookingSaved = true;
          structuredLogger.info('Booking created successfully', {
            clientId,
            botId,
            sessionId: sessionData.sessionId,
            bookingType: bookingInfo.bookingType,
            name: bookingInfo.name,
          });
        } else {
          structuredLogger.info('Skipping duplicate booking', {
            sessionId: sessionData.sessionId,
            reason: existingAppointment ? 'existing_session_appointment' : 'recent_duplicate_type',
            existingAppointmentId: existingAppointment?.id,
            bookingType: bookingInfo.bookingType,
          });
        }
      } catch (error: any) {
        // Log detailed error with context for debugging
        structuredLogger.error('Error creating AI-driven booking', {
          error: error?.message || error,
          clientId,
          botId,
          sessionId: sessionData.sessionId,
          bookingType: bookingInfo.bookingType,
          name: bookingInfo.name,
          hasPhone: !!bookingInfo.phone,
          hasEmail: !!bookingInfo.email,
        });
        // Note: The AI has already acknowledged the booking in its response.
        // We don't modify the response here - the team can still follow up manually
        // using the contact info from the conversation logs.
      }
    }

    // For external booking mode, require name + phone + service before showing button
    const externalBookingInfoComplete = bookingInfo?.isCompleteForExternal || false;
    
    return { 
      showBooking, 
      externalBookingInfoComplete,
      bookingType, 
      leadCaptured, 
      bookingSaved, 
      contactInfo: leadCaptured ? contactInfo : undefined,
      requestedService: bookingInfo?.requestedService,
    };
  }

  /**
   * Update session data and log analytics
   */
  private async updateSessionAndAnalytics(
    sessionData: SessionData,
    responseTimeMs: number,
    userMessage: string,
    botReply: string,
    language: string,
    showBooking: boolean = false
  ): Promise<void> {
    // Update session counters
    sessionData.messageCount += 2; // user + bot
    sessionData.userMessageCount += 1;
    sessionData.botMessageCount += 1;
    sessionData.totalResponseTimeMs += responseTimeMs;
    sessionData.lastMessageAt = new Date();

    // Persist session with all updated fields including booking intent
    await storage.createOrUpdateChatSession({
      sessionId: sessionData.sessionId,
      clientId: sessionData.clientId,
      botId: sessionData.botId,
      startedAt: sessionData.startedAt,
      userMessageCount: sessionData.userMessageCount,
      botMessageCount: sessionData.botMessageCount,
      totalResponseTimeMs: sessionData.totalResponseTimeMs,
      crisisDetected: sessionData.crisisDetected || false,
      appointmentRequested: sessionData.appointmentRequested || false,
      topics: sessionData.topics || [],
    });

    // Log to conversationAnalytics table for dashboard conversation counts
    const userCategory = categorizeMessageTopic(userMessage);
    await withRetry(
      () => storage.logConversation(sessionData.clientId, {
        sessionId: sessionData.sessionId,
        role: 'user',
        content: userMessage.slice(0, 500), // Limit content size
        category: userCategory,
      }),
      'logConversation (user)'
    );
    
    const botCategory = showBooking ? 'appointments' : categorizeMessageTopic(botReply);
    await withRetry(
      () => storage.logConversation(sessionData.clientId, {
        sessionId: sessionData.sessionId,
        role: 'assistant',
        content: botReply.slice(0, 500), // Limit content size
        category: botCategory,
      }),
      'logConversation (bot)'
    );

    // Log analytics events
    await storage.logAnalyticsEvent({
      clientId: sessionData.clientId,
      botId: sessionData.botId,
      sessionId: sessionData.sessionId,
      eventType: 'message',
      actor: 'user',
      messageContent: userMessage,
      metadata: { language } as any,
    });

    await storage.logAnalyticsEvent({
      clientId: sessionData.clientId,
      botId: sessionData.botId,
      sessionId: sessionData.sessionId,
      eventType: 'message',
      actor: 'bot',
      messageContent: botReply,
      responseTimeMs,
      metadata: { language } as any,
    });

    // Log booking intent analytics event if booking detected
    if (showBooking) {
      await storage.logAnalyticsEvent({
        clientId: sessionData.clientId,
        botId: sessionData.botId,
        sessionId: sessionData.sessionId,
        eventType: 'booking_intent',
        actor: 'user',
        messageContent: userMessage,
        metadata: { 
          hasBookingUrl: true,
        } as Record<string, any>,
      });
    }

    // Update daily analytics including appointment requests
    const isNewSession = sessionData.messageCount === 2;
    await storage.updateOrCreateDailyAnalytics({
      date: new Date().toISOString().split('T')[0],
      clientId: sessionData.clientId,
      botId: sessionData.botId,
      totalConversations: isNewSession ? 1 : 0,
      totalMessages: 2,
      userMessages: 1,
      botMessages: 1,
      appointmentRequests: showBooking ? 1 : 0,
    });
  }

  /**
   * Handle crisis response
   */
  private async handleCrisisResponse(
    botConfig: BotConfig,
    sessionData: SessionData,
    userMessage: string,
    startTime: number,
    request: OrchestratorRequest
  ): Promise<OrchestratorResponse> {
    const crisisReply = getBotCrisisResponse(botConfig);
    const responseTime = Date.now() - startTime;

    sessionData.crisisDetected = true;
    sessionData.botMessageCount += 1;
    sessionData.totalResponseTimeMs += responseTime;

    await storage.logAnalyticsEvent({
      clientId: request.clientId,
      botId: request.botId,
      sessionId: request.sessionId,
      eventType: 'crisis',
      actor: 'user',
      messageContent: userMessage,
      category: 'crisis',
      responseTimeMs: responseTime,
      metadata: { language: request.language ?? 'en' } as any,
    });

    await storage.createOrUpdateChatSession(sessionData);

    await storage.updateOrCreateDailyAnalytics({
      date: new Date().toISOString().split('T')[0],
      clientId: request.clientId,
      botId: request.botId,
      totalConversations: sessionData.messageCount === 0 ? 1 : 0,
      totalMessages: 2,
      userMessages: 1,
      botMessages: 1,
      crisisEvents: 1,
    });

    logConversationToFile({
      timestamp: new Date().toISOString(),
      clientId: request.clientId,
      botId: request.botId,
      sessionId: request.sessionId,
      userMessage,
      botReply: crisisReply,
    });

    return {
      success: true,
      reply: crisisReply,
      meta: {
        clientId: request.clientId,
        botId: request.botId,
        sessionId: request.sessionId,
        responseTimeMs: responseTime,
        showBooking: false,
        bookingMode: 'internal',
        externalBookingUrl: null,
        externalPaymentUrl: null,
        suggestedReplies: [],
        crisis: true,
      },
    };
  }

  /**
   * Handle automation-triggered response
   */
  private async handleAutomationResponse(
    automationResult: AutomationResult,
    sessionData: SessionData,
    userMessage: string,
    startTime: number,
    request: OrchestratorRequest
  ): Promise<OrchestratorResponse> {
    const responseTime = Date.now() - startTime;

    sessionData.botMessageCount += 1;
    sessionData.totalResponseTimeMs += responseTime;

    await storage.logAnalyticsEvent({
      clientId: request.clientId,
      botId: request.botId,
      sessionId: request.sessionId,
      eventType: 'automation',
      actor: 'bot',
      messageContent: automationResult.response!,
      responseTimeMs: responseTime,
      metadata: {
        language: request.language,
        automationRuleId: automationResult.ruleId,
        automationType: automationResult.metadata?.type,
      } as any,
    });

    await storage.createOrUpdateChatSession(sessionData);
    await incrementMessageCount(request.clientId);
    await incrementAutomationCount(request.clientId);

    logConversationToFile({
      timestamp: new Date().toISOString(),
      clientId: request.clientId,
      botId: request.botId,
      sessionId: request.sessionId,
      userMessage,
      botReply: automationResult.response!,
    });

    return {
      success: true,
      reply: automationResult.response!,
      meta: {
        clientId: request.clientId,
        botId: request.botId,
        sessionId: request.sessionId,
        responseTimeMs: responseTime,
        showBooking: false,
        bookingMode: 'internal',
        externalBookingUrl: null,
        externalPaymentUrl: null,
        suggestedReplies: [],
        automation: true,
        ruleId: automationResult.ruleId,
      },
    };
  }

  /**
   * Create standardized error response
   */
  private errorResponse(
    code: OrchestratorResponse['errorCode'],
    message: string,
    startTime: number,
    request: OrchestratorRequest
  ): OrchestratorResponse {
    return {
      success: false,
      reply: '',
      error: message,
      errorCode: code,
      meta: {
        clientId: request.clientId,
        botId: request.botId,
        sessionId: request.sessionId,
        responseTimeMs: Date.now() - startTime,
        showBooking: false,
        bookingMode: 'internal',
        externalBookingUrl: null,
        externalPaymentUrl: null,
        suggestedReplies: [],
      },
    };
  }

  /**
   * Invalidate cache for a bot (call after updates)
   */
  invalidateBotCache(clientId: string, botId: string): void {
    configCache.invalidateBotConfig(clientId, botId);
  }

  /**
   * Invalidate cache for a client (call after updates)
   */
  invalidateClientCache(clientId: string): void {
    configCache.invalidateClient(clientId);
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return configCache.getStats();
  }
}

// Singleton instance
export const orchestrator = new ConversationOrchestrator();

// Export class for testing
export { ConversationOrchestrator };

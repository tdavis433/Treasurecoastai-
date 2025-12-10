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

export interface ExtractedBookingInfo {
  name?: string;
  phone?: string;
  email?: string;
  preferredTime?: string;
  scheduledAt?: string; // ISO datetime parsed from preferredTime
  notes?: string;
  bookingType: 'tour' | 'phone_call';
  isComplete: boolean;
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
    console.warn('Failed to parse time phrase:', timePhrase, e);
    return null;
  }
}

export function extractBookingInfoFromConversation(
  messages: ChatMessage[],
  currentReply: string,
  currentUserMessage: string
): ExtractedBookingInfo | null {
  const allText = [...messages.map(m => m.content), currentUserMessage, currentReply].join(' ');
  const userMessages = messages.filter(m => m.role === 'user').map(m => m.content).join(' ') + ' ' + currentUserMessage;
  
  const aiConfirmsBooking = /I'?ve noted|noted your|passed along|team will (reach out|follow up|contact)|will be in touch|request:?[\s\S]*name:?/i.test(currentReply);
  
  if (!aiConfirmsBooking) {
    return null;
  }

  const tourKeywords = /\b(tour|visit|come see|check out|see the house|see the place|come by|stop by|look around|walk through)\b/i;
  const callKeywords = /\b(call|phone|speak with|talk to|phone call|give .* a call|chat with|speak to someone)\b/i;
  
  const bookingType: 'tour' | 'phone_call' = callKeywords.test(userMessages) ? 'phone_call' : 'tour';

  let name: string | undefined;
  let phone: string | undefined;
  let email: string | undefined;
  let preferredTime: string | undefined;

  const namePatterns = [
    /(?:my name is|i'?m|name:?|this is)\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i,
    /(?:call me|it'?s)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i,
    /^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)$/m,
    /Name:\s*([^\n,]+)/i,
  ];
  
  for (const pattern of namePatterns) {
    const match = allText.match(pattern);
    if (match && match[1] && match[1].length > 2 && match[1].length < 50) {
      name = match[1].trim();
      break;
    }
  }

  const phonePatterns = [
    /(?:phone|number|cell|mobile|call me at|reach me at):?\s*([\d\s\-\(\)\.]{10,})/i,
    /\b(\(?\d{3}\)?[\s\-\.]?\d{3}[\s\-\.]?\d{4})\b/,
    /\b(\d{3}[\s\-\.]\d{3}[\s\-\.]\d{4})\b/,
    /Phone:\s*([\d\s\-\(\)\.]+)/i,
  ];
  
  for (const pattern of phonePatterns) {
    const match = allText.match(pattern);
    if (match && match[1]) {
      const cleaned = match[1].replace(/\D/g, '');
      if (cleaned.length >= 10) {
        phone = match[1].trim();
        break;
      }
    }
  }

  const emailPatterns = [
    /(?:email|e-mail):?\s*([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i,
    /\b([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\b/,
    /Email:\s*([^\s,]+)/i,
  ];
  
  for (const pattern of emailPatterns) {
    const match = allText.match(pattern);
    if (match && match[1]) {
      email = match[1].trim();
      break;
    }
  }

  const timePatterns = [
    /(?:prefer|want|like|available|good for me|works for me|time:?|when:?)\s*(?:on\s+)?([A-Za-z]+(?:\s+(?:morning|afternoon|evening|night|\d{1,2}(?::\d{2})?\s*(?:am|pm)?)))/i,
    /(?:tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday)(?:\s+(?:morning|afternoon|evening|at\s+\d{1,2}(?::\d{2})?\s*(?:am|pm)?))?/i,
    /(?:this\s+)?(?:week|weekend|next\s+week)/i,
    /\d{1,2}(?::\d{2})?\s*(?:am|pm)/i,
    /Preferred time:\s*([^\n]+)/i,
  ];
  
  for (const pattern of timePatterns) {
    const match = allText.match(pattern);
    if (match) {
      preferredTime = (match[1] || match[0]).trim();
      break;
    }
  }
  if (!preferredTime) {
    preferredTime = 'To be confirmed';
  }

  // Parse the vague time phrase into an ISO datetime
  const parsedTime = parseVagueTimeToDatetime(preferredTime);
  const scheduledAt = parsedTime || undefined;
  if (scheduledAt) {
    console.log(`Booking time parsed: "${preferredTime}" -> ${scheduledAt}`);
  }

  const isComplete = !!(name && phone);

  return {
    name,
    phone,
    email,
    preferredTime,
    scheduledAt,
    bookingType,
    isComplete,
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

const openaiApiKey = process.env.OPENAI_API_KEY || process.env.AI_INTEGRATIONS_OPENAI_API_KEY;
const openai = openaiApiKey
  ? new OpenAI({ apiKey: openaiApiKey })
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

export interface OrchestratorMeta {
  clientId: string;
  botId: string;
  sessionId: string;
  responseTimeMs: number;
  showBooking: boolean;
  bookingType?: 'tour' | 'call' | 'appointment';  // Type of booking intent detected
  externalBookingUrl: string | null;
  externalPaymentUrl: string | null;
  suggestedReplies: string[];
  crisis?: boolean;
  automation?: boolean;
  ruleId?: string;
  leadCaptured?: boolean;
  bookingSaved?: boolean;  // When booking was saved during resilient persistence
  contactInfo?: { name?: string; email?: string; phone?: string };
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
  console.log(`[CHAT] ${data.clientId}/${data.botId} | ${data.sessionId} | User: ${data.userMessage.slice(0, 50)}... | Bot: ${data.botReply.slice(0, 50)}...`);
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

      // 12. Get client settings for external URLs
      const clientSettings = await configCache.getClientSettings(clientId);

      // 13. Return standardized response - only include booking URL when intent is detected
      const bookingUrl = postProcessResult.showBooking 
        ? (clientSettings?.externalBookingUrl || botConfig.externalBookingUrl || null)
        : null;
      
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
          externalBookingUrl: bookingUrl,
          externalPaymentUrl: postProcessResult.showBooking ? (clientSettings?.externalPaymentUrl || botConfig.externalPaymentUrl || null) : null,
          suggestedReplies: [],
          leadCaptured: postProcessResult.leadCaptured,
          contactInfo: postProcessResult.contactInfo,
        },
      };
    } catch (error: any) {
      console.error('[Orchestrator] Error processing message:', error);
      
      // Check for OpenAI rate limit errors
      const isRateLimitError = error?.status === 429 || 
        error?.code === 'rate_limit_exceeded' ||
        error?.message?.includes('Rate limit') ||
        error?.message?.includes('rate_limit') ||
        error?.message?.includes('429');
      
      if (isRateLimitError) {
        console.error('[Orchestrator] OpenAI rate limit exceeded - returning friendly message as normal reply');
        // Return as a successful response so the widget shows it as a normal message, not an error toast
        const friendlyMessage = "I apologize, but I'm experiencing high demand right now. Please try again in a moment, or feel free to call us directly for immediate assistance.";
        return {
          success: true,
          reply: friendlyMessage,
          meta: {
            clientId: request.clientId,
            botId: request.botId,
            sessionId: request.sessionId || `session_${Date.now()}`,
            responseTimeMs: Date.now() - startTime,
            showBooking: false,
            externalBookingUrl: null,
            externalPaymentUrl: null,
            suggestedReplies: ["When can I call you?", "What are your hours?"],
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

      const systemPrompt = buildSystemPromptFromConfig(botConfigWithUrls);

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

      // 10. Send final meta - only include booking URL when intent is detected
      const bookingUrl = postProcessResult.showBooking 
        ? (clientSettings?.externalBookingUrl || botConfig.externalBookingUrl || null)
        : null;
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
          externalBookingUrl: bookingUrl,
          externalPaymentUrl: paymentUrl,
          suggestedReplies: [],
          leadCaptured: postProcessResult.leadCaptured,
          bookingSaved: postProcessResult.bookingSaved || false,
          contactInfo: postProcessResult.contactInfo,
        },
      };

    } catch (error: any) {
      console.error('[Orchestrator] Stream error:', error);
      
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
        console.error('[Orchestrator] OpenAI error - attempting to save lead/booking before returning friendly message');
        
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
              const newLead = await storage.createLead({
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
              });
              savedLead = true;
              
              // Trigger lead_captured automations
              triggerWorkflowByEvent(botId, 'lead_captured', {
                clientId,
                sessionId,
                leadId: newLead.id,
                name: extracted.name,
                email: extracted.email,
                phone: extracted.phone,
              }).catch(err => console.error('[Automation] Error triggering lead_captured:', err));
              
              console.log('[Orchestrator] Resilient lead saved despite OpenAI error:', {
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
              }).catch(err => console.error('[Automation] Error triggering appointment_booked:', err));
              
              console.log('[Orchestrator] Resilient booking saved despite OpenAI error:', {
                clientId, sessionId, bookingType: extracted.bookingType, name: extracted.name
              });
            }
          }
        } catch (saveError) {
          console.error('[Orchestrator] Error saving resilient lead/booking:', saveError);
        }
        
        // Build appropriate friendly message based on what was saved
        let friendlyMessage: string;
        if (savedBooking) {
          friendlyMessage = "I'm experiencing some delays right now, but I've saved your information and booking request! Our team will reach out shortly to confirm the details. Thank you for your patience!";
        } else if (savedLead) {
          friendlyMessage = "I'm experiencing some delays right now, but don't worry - I've saved your contact information. Our team will reach out to you soon. Thank you for your patience!";
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
            showBooking: false,
            externalBookingUrl: null,
            externalPaymentUrl: null,
            suggestedReplies: ["When can I call you?", "What are your hours?"],
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
   * Generate AI response using OpenAI
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

    // Get client settings for external URLs
    const clientSettings = await configCache.getClientSettings(clientId);
    
    // Inject external URLs into bot config for prompt building
    const botConfigWithUrls: BotConfig = {
      ...botConfig,
      externalBookingUrl: clientSettings?.externalBookingUrl || botConfig.externalBookingUrl,
      externalPaymentUrl: clientSettings?.externalPaymentUrl || botConfig.externalPaymentUrl,
    };

    const systemPrompt = buildSystemPromptFromConfig(botConfigWithUrls);

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages,
      ],
      max_completion_tokens: 500,
    });

    const defaultReply = language === 'es'
      ? 'Estoy aquí para ayudar. ¿Cómo puedo asistirte hoy?'
      : 'I\'m here to help. How can I assist you today?';

    return completion.choices[0]?.message?.content || defaultReply;
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
    bookingType?: 'tour' | 'call' | 'appointment';
    leadCaptured: boolean;
    bookingSaved?: boolean;
    contactInfo?: { name?: string; email?: string; phone?: string };
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
    
    const aiMentionsBookingButton = /\b(book\s*appointment|book\s*a?\s*tour|schedule\s*a?\s*call|click.*button|scheduling\s*page|finalize.*booking|complete.*booking)\b/i.test(reply);
    
    const showBooking = directBookingIntent || isAffirmativeToBookingPrompt || alreadyRequestedBooking || conversationHasBookingIntent || aiMentionsBookingButton;

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

    if (directBookingIntent || isAffirmativeToBookingPrompt || conversationHasBookingIntent) {
      sessionData.appointmentRequested = true;
    }

    // Lead capture from message content
    const contactInfo = extractContactInfo(userMessage);
    const leadCaptured = !!(contactInfo.email || contactInfo.phone);

    if (leadCaptured && !sessionData.leadCaptured) {
      sessionData.leadCaptured = true;
      
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
          }
        } else {
          const priority = determinePriority(showBooking, contactInfo);
          const newLead = await storage.createLead({
            clientId,
            botId,
            sessionId: sessionData.sessionId,
            name: contactInfo.name || null,
            email: contactInfo.email || null,
            phone: contactInfo.phone || null,
            status: 'new',
            priority,
            source: 'chat',
          });
          
          // Trigger lead_captured automations
          triggerWorkflowByEvent(botId, 'lead_captured', {
            clientId,
            sessionId: sessionData.sessionId,
            leadId: newLead.id,
            name: contactInfo.name,
            email: contactInfo.email,
            phone: contactInfo.phone,
          }).catch(err => console.error('[Automation] Error triggering lead_captured:', err));
        }
      } catch (error) {
        console.error('[Orchestrator] Error capturing lead:', error);
      }
    }

    // AI-driven booking creation: When AI confirms it has "noted" the booking request
    // with complete info (name + phone required), create an appointment record
    const bookingInfo = extractBookingInfoFromConversation(messages, reply, userMessage);
    let bookingSaved = false;
    
    if (bookingInfo && bookingInfo.isComplete) {
      try {
        // Check if we already created a booking for this session
        const existingAppointment = await storage.getAppointmentBySessionId(
          sessionData.sessionId,
          clientId
        );
        
        if (!existingAppointment) {
          console.log(`[Orchestrator] Creating AI-driven booking for session ${sessionData.sessionId}`, {
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
          }).catch(err => console.error('[Automation] Error triggering appointment_booked:', err));
          
          bookingSaved = true;
          console.log(`[Orchestrator] Booking created successfully: ${bookingInfo.bookingType} for ${bookingInfo.name}`, {
            clientId,
            botId,
            sessionId: sessionData.sessionId,
          });
        } else {
          console.log(`[Orchestrator] Skipping duplicate booking for session ${sessionData.sessionId}`, {
            existingAppointmentId: existingAppointment.id,
          });
        }
      } catch (error: any) {
        // Log detailed error with context for debugging
        console.error('[Orchestrator] Error creating AI-driven booking:', {
          error: error?.message || error,
          stack: error?.stack,
          context: {
            clientId,
            botId,
            sessionId: sessionData.sessionId,
            bookingType: bookingInfo.bookingType,
            name: bookingInfo.name,
            hasPhone: !!bookingInfo.phone,
            hasEmail: !!bookingInfo.email,
          }
        });
        // Note: The AI has already acknowledged the booking in its response.
        // We don't modify the response here - the team can still follow up manually
        // using the contact info from the conversation logs.
      }
    }

    return { showBooking, bookingType, leadCaptured, bookingSaved, contactInfo: leadCaptured ? contactInfo : undefined };
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

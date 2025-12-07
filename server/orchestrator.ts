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
  extractContactInfo,
  AutomationContext,
  BotAutomationConfig,
  AutomationResult
} from './automations';
import { checkMessageLimit, incrementMessageCount, incrementAutomationCount } from './planLimits';
import { getClientStatus } from './botConfig';

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

interface ExtractedBookingInfo {
  name?: string;
  phone?: string;
  email?: string;
  preferredTime?: string;
  notes?: string;
  bookingType: 'tour' | 'phone_call';
  isComplete: boolean;
}

function extractBookingInfoFromConversation(
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

  const isComplete = !!(name && phone);

  return {
    name,
    phone,
    email,
    preferredTime,
    bookingType,
    isComplete,
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
    } catch (error) {
      console.error('[Orchestrator] Error processing message:', error);
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
          contactInfo: postProcessResult.contactInfo,
        },
      };

    } catch (error) {
      console.error('[Orchestrator] Stream error:', error);
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
            await storage.updateLead(existingLead.id, updates);
          }
        } else {
          const priority = determinePriority(showBooking, contactInfo);
          await storage.createLead({
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
        }
      } catch (error) {
        console.error('[Orchestrator] Error capturing lead:', error);
      }
    }

    // AI-driven booking creation: When AI confirms it has "noted" the booking request
    // with complete info (name + phone required), create an appointment record
    const bookingInfo = extractBookingInfoFromConversation(messages, reply, userMessage);
    
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
          
          await storage.createAppointment(clientId, {
            name: bookingInfo.name!,
            contact: bookingInfo.phone!,
            email: bookingInfo.email || null,
            preferredTime: bookingInfo.preferredTime || 'To be confirmed',
            appointmentType: bookingInfo.bookingType,
            notes: bookingInfo.notes || null,
            contactPreference: 'phone',
            botId: botId,
            sessionId: sessionData.sessionId,
          });
          
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

    return { showBooking, bookingType, leadCaptured, contactInfo: leadCaptured ? contactInfo : undefined };
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

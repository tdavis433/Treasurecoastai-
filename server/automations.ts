/**
 * Automations V1 Engine
 * 
 * Handles keyword triggers, office hours logic, lead capture, and fallback responses
 * for the Treasure Coast AI multi-tenant chatbot platform.
 */

export interface AutomationRule {
  id: string;
  type: 'keyword_trigger' | 'office_hours' | 'lead_capture' | 'fallback';
  enabled: boolean;
  priority: number;
  conditions: AutomationCondition[];
  response?: string;
  action?: AutomationAction;
  metadata?: Record<string, unknown>;
}

export interface AutomationCondition {
  type: 'keyword' | 'phrase' | 'regex' | 'time_range' | 'day_of_week' | 'message_count';
  value: string | string[] | number;
  match?: 'exact' | 'contains' | 'starts_with' | 'ends_with';
  caseSensitive?: boolean;
}

export interface AutomationAction {
  type: 'respond' | 'capture_lead' | 'tag_session' | 'trigger_workflow' | 'redirect';
  payload?: Record<string, unknown>;
}

export interface AutomationResult {
  triggered: boolean;
  ruleId?: string;
  response?: string;
  action?: AutomationAction;
  shouldContinue: boolean;
  metadata?: Record<string, unknown>;
}

export interface AutomationContext {
  clientId: string;
  botId: string;
  sessionId: string;
  message: string;
  messageCount: number;
  timezone?: string;
  language?: string;
  officeHours?: {
    schedule: Record<string, { open: string; close: string } | null>;
    timezone: string;
    afterHoursMessage?: string;
  };
}

export interface BotAutomationConfig {
  automations?: AutomationRule[];
  officeHours?: {
    schedule: Record<string, { open: string; close: string } | null>;
    timezone: string;
    afterHoursMessage?: string;
    enableAfterHoursMode?: boolean;
  };
  leadCapture?: {
    enabled: boolean;
    triggerKeywords?: string[];
    captureFields?: string[];
    successMessage?: string;
  };
  fallback?: {
    enabled: boolean;
    message?: string;
    minConfidence?: number;
  };
}

export function isWithinOfficeHours(
  officeHours?: BotAutomationConfig['officeHours'],
  checkTime?: Date
): boolean {
  if (!officeHours?.schedule || !officeHours.enableAfterHoursMode) {
    return true;
  }

  const now = checkTime || new Date();
  const timezone = officeHours.timezone || 'America/New_York';
  
  // Get day and time in the configured timezone
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    weekday: 'long',
    hour: 'numeric',
    minute: 'numeric',
    hour12: false
  });
  
  const parts = formatter.formatToParts(now);
  const dayPart = parts.find(p => p.type === 'weekday');
  const hourPart = parts.find(p => p.type === 'hour');
  const minutePart = parts.find(p => p.type === 'minute');
  
  if (!dayPart || !hourPart || !minutePart) {
    // Fallback to assuming open if we can't determine time
    return true;
  }
  
  const dayName = dayPart.value.toLowerCase();
  const currentHour = parseInt(hourPart.value, 10);
  const currentMinute = parseInt(minutePart.value, 10);
  
  const todayHours = officeHours.schedule[dayName];
  if (!todayHours) {
    // Closed on this day
    return false;
  }

  const [openHour, openMin] = todayHours.open.split(':').map(Number);
  const [closeHour, closeMin] = todayHours.close.split(':').map(Number);
  
  const currentMinutes = currentHour * 60 + currentMinute;
  const openMinutes = openHour * 60 + openMin;
  const closeMinutes = closeHour * 60 + closeMin;
  
  return currentMinutes >= openMinutes && currentMinutes < closeMinutes;
}

export function evaluateKeywordTrigger(
  message: string,
  rule: AutomationRule
): boolean {
  const normalizedMessage = message.toLowerCase().trim();
  
  for (const condition of rule.conditions) {
    if (condition.type !== 'keyword' && condition.type !== 'phrase' && condition.type !== 'regex') {
      continue;
    }
    
    const keywords = Array.isArray(condition.value) ? condition.value : [condition.value];
    const caseSensitive = condition.caseSensitive ?? false;
    const matchType = condition.match ?? 'contains';
    
    for (const keyword of keywords) {
      const keywordStr = String(keyword);
      const testMessage = caseSensitive ? message.trim() : normalizedMessage;
      const testKeyword = caseSensitive ? keywordStr : keywordStr.toLowerCase();
      
      let matched = false;
      
      if (condition.type === 'regex') {
        try {
          const regex = new RegExp(keywordStr, caseSensitive ? '' : 'i');
          matched = regex.test(message);
        } catch {
          matched = false;
        }
      } else {
        switch (matchType) {
          case 'exact':
            matched = testMessage === testKeyword;
            break;
          case 'starts_with':
            matched = testMessage.startsWith(testKeyword);
            break;
          case 'ends_with':
            matched = testMessage.endsWith(testKeyword);
            break;
          case 'contains':
          default:
            matched = testMessage.includes(testKeyword);
        }
      }
      
      if (matched) {
        return true;
      }
    }
  }
  
  return false;
}

export function detectLeadCaptureOpportunity(
  message: string,
  config?: BotAutomationConfig['leadCapture']
): boolean {
  if (!config?.enabled) {
    return false;
  }
  
  const defaultTriggers = [
    'contact me', 'call me', 'email me', 'get in touch',
    'schedule', 'appointment', 'booking', 'reserve',
    'my phone', 'my email', 'reach me at',
    'interested in', 'want to learn more', 'sign up',
    'demo', 'quote', 'estimate', 'consultation'
  ];
  
  const triggers = config.triggerKeywords?.length 
    ? config.triggerKeywords 
    : defaultTriggers;
  
  const normalizedMessage = message.toLowerCase();
  return triggers.some(trigger => normalizedMessage.includes(trigger.toLowerCase()));
}

export function extractContactInfo(message: string): { 
  email?: string; 
  phone?: string; 
  name?: string;
} {
  const result: { email?: string; phone?: string; name?: string } = {};
  
  const emailMatch = message.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/);
  if (emailMatch) {
    result.email = emailMatch[0];
  }
  
  const phoneMatch = message.match(/\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
  if (phoneMatch) {
    result.phone = phoneMatch[0];
  }
  
  const namePatterns = [
    /(?:my name(?:[''\u2019]s| is)|I[''\u2019]m|I am|this is|call me)\s+([A-Za-z''\u2019\-]+(?:\s+[A-Za-z''\u2019\-]+)*)/i,
    /(?:^|\s)([A-Z][a-z]+\s+[A-Z][a-z]+)(?:\s|$|,)/
  ];
  
  for (const pattern of namePatterns) {
    const match = message.match(pattern);
    if (match && match[1]) {
      result.name = match[1].trim();
      break;
    }
  }
  
  return result;
}

export function processAutomations(
  context: AutomationContext,
  config?: BotAutomationConfig
): AutomationResult {
  const result: AutomationResult = {
    triggered: false,
    shouldContinue: true
  };
  
  if (!config) {
    return result;
  }
  
  if (config.officeHours?.enableAfterHoursMode) {
    const withinHours = isWithinOfficeHours(config.officeHours);
    if (!withinHours) {
      result.triggered = true;
      result.ruleId = 'office_hours';
      result.response = config.officeHours.afterHoursMessage || 
        "Thank you for reaching out! We're currently outside of business hours. " +
        "Please leave your message and we'll get back to you during our next business day.";
      result.shouldContinue = true;
      result.metadata = { 
        type: 'office_hours',
        withinHours: false
      };
    }
  }
  
  const automations = config.automations || [];
  const sortedAutomations = [...automations]
    .filter(a => a.enabled)
    .sort((a, b) => b.priority - a.priority);
  
  for (const rule of sortedAutomations) {
    if (rule.type === 'keyword_trigger') {
      const matched = evaluateKeywordTrigger(context.message, rule);
      if (matched) {
        result.triggered = true;
        result.ruleId = rule.id;
        result.response = rule.response;
        result.action = rule.action;
        result.shouldContinue = false;
        result.metadata = {
          type: 'keyword_trigger',
          matchedRule: rule.id
        };
        break;
      }
    }
  }
  
  if (config.leadCapture?.enabled && !result.triggered) {
    const isLeadOpportunity = detectLeadCaptureOpportunity(context.message, config.leadCapture);
    if (isLeadOpportunity) {
      const contactInfo = extractContactInfo(context.message);
      if (contactInfo.email || contactInfo.phone || contactInfo.name) {
        result.action = {
          type: 'capture_lead',
          payload: {
            ...contactInfo,
            sessionId: context.sessionId,
            clientId: context.clientId,
            botId: context.botId,
            message: context.message,
            capturedAt: new Date().toISOString()
          }
        };
        result.metadata = {
          ...result.metadata,
          leadCaptured: true,
          contactInfo
        };
      }
    }
  }
  
  return result;
}

export function getDefaultAutomationConfig(): BotAutomationConfig {
  return {
    officeHours: {
      schedule: {
        monday: { open: '09:00', close: '17:00' },
        tuesday: { open: '09:00', close: '17:00' },
        wednesday: { open: '09:00', close: '17:00' },
        thursday: { open: '09:00', close: '17:00' },
        friday: { open: '09:00', close: '17:00' },
        saturday: null,
        sunday: null
      },
      timezone: 'America/New_York',
      afterHoursMessage: "Thank you for reaching out! We're currently outside of business hours. Please leave your message and we'll get back to you during our next business day.",
      enableAfterHoursMode: false
    },
    leadCapture: {
      enabled: true,
      triggerKeywords: [
        'contact me', 'call me', 'email me', 'schedule', 
        'appointment', 'interested', 'quote', 'consultation'
      ],
      captureFields: ['name', 'email', 'phone'],
      successMessage: "Thank you for your interest! We've captured your contact information and someone will reach out soon."
    },
    fallback: {
      enabled: false,
      message: "I apologize, but I'm not sure how to help with that. Would you like me to connect you with a team member?",
      minConfidence: 0.3
    },
    automations: []
  };
}

export function createKeywordAutomation(
  id: string,
  keywords: string[],
  response: string,
  priority: number = 10
): AutomationRule {
  return {
    id,
    type: 'keyword_trigger',
    enabled: true,
    priority,
    conditions: [
      {
        type: 'keyword',
        value: keywords,
        match: 'contains',
        caseSensitive: false
      }
    ],
    response
  };
}

export function createGreetingAutomation(greetingMessage: string): AutomationRule {
  return createKeywordAutomation(
    'greeting',
    ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening', 'howdy'],
    greetingMessage,
    100
  );
}

export function createHoursAutomation(
  hoursInfo: string,
  keywords: string[] = ['hours', 'open', 'close', 'when are you open', 'business hours']
): AutomationRule {
  return createKeywordAutomation(
    'business_hours_info',
    keywords,
    hoursInfo,
    50
  );
}

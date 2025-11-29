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

// =============================================
// PHASE 4: AUTOMATIONS V2 ENGINE
// =============================================

import { storage } from './storage';
import type { AutomationWorkflow, InsertAutomationRun } from '@shared/schema';

export interface AutomationV2Context {
  clientId: string;
  botId: string;
  sessionId: string;
  message: string;
  messageCount: number;
  timezone?: string;
  language?: string;
}

export interface AutomationV2Result {
  triggered: boolean;
  workflowId?: string;
  workflowName?: string;
  response?: string;
  actions?: AutomationWorkflow['actions'];
  shouldContinue: boolean;
  runId?: string;
}

/**
 * Process V2 automation workflows from database
 * Returns the first matching workflow result
 */
export async function processAutomationsV2(
  context: AutomationV2Context
): Promise<AutomationV2Result> {
  const result: AutomationV2Result = {
    triggered: false,
    shouldContinue: true,
  };

  try {
    // Get active workflows for this bot, sorted by priority
    const workflows = await storage.getActiveAutomationWorkflowsByBot(context.botId);
    
    if (workflows.length === 0) {
      return result;
    }

    for (const workflow of workflows) {
      // Check if workflow should trigger
      const shouldTrigger = await evaluateWorkflowTrigger(workflow, context);
      
      if (shouldTrigger.triggered) {
        // Check max executions per session
        if (workflow.maxExecutionsPerSession) {
          const executionCount = await storage.countAutomationRunsForSession(
            workflow.id,
            context.sessionId
          );
          if (executionCount >= workflow.maxExecutionsPerSession) {
            continue; // Skip this workflow, max executions reached
          }
        }

        // Create automation run log
        const run = await storage.createAutomationRun({
          workflowId: workflow.id,
          botId: context.botId,
          sessionId: context.sessionId,
          status: 'running',
          triggerContext: {
            message: context.message,
            messageCount: context.messageCount,
            triggerType: workflow.triggerType,
            matchedKeywords: shouldTrigger.matchedKeywords,
          } as any,
        });

        // Execute actions and get response
        const executionResult = await executeWorkflowActions(workflow, context);

        // Update run with results
        await storage.updateAutomationRun(run.id, {
          status: executionResult.success ? 'completed' : 'failed',
          completedAt: new Date(),
          actionsExecuted: executionResult.actionsExecuted,
          result: {
            success: executionResult.success,
            response: executionResult.response,
            error: executionResult.error,
          } as any,
          errorMessage: executionResult.error,
        });

        result.triggered = true;
        result.workflowId = workflow.id;
        result.workflowName = workflow.name;
        result.response = executionResult.response;
        result.actions = workflow.actions as AutomationWorkflow['actions'];
        result.shouldContinue = false; // First matching workflow wins
        result.runId = run.id;

        break; // Stop processing after first match
      }
    }
  } catch (error) {
    console.error('Error processing V2 automations:', error);
  }

  return result;
}

interface TriggerEvaluationResult {
  triggered: boolean;
  matchedKeywords?: string[];
}

/**
 * Evaluate if a workflow should trigger based on its trigger type and config
 */
async function evaluateWorkflowTrigger(
  workflow: AutomationWorkflow,
  context: AutomationV2Context
): Promise<TriggerEvaluationResult> {
  const config = workflow.triggerConfig as {
    keywords?: string[];
    matchType?: string;
    schedule?: string;
    inactivityMinutes?: number;
    messageCountThreshold?: number;
    eventType?: string;
  } || {};

  switch (workflow.triggerType) {
    case 'keyword': {
      const keywords = config.keywords || [];
      const matchType = config.matchType || 'contains';
      const message = context.message.toLowerCase();
      const matchedKeywords: string[] = [];

      for (const keyword of keywords) {
        const kw = keyword.toLowerCase();
        let matched = false;

        if (matchType === 'exact') {
          matched = message === kw;
        } else if (matchType === 'contains') {
          matched = message.includes(kw);
        } else if (matchType === 'regex') {
          try {
            matched = new RegExp(keyword, 'i').test(context.message);
          } catch {
            matched = false;
          }
        }

        if (matched) {
          matchedKeywords.push(keyword);
        }
      }

      return {
        triggered: matchedKeywords.length > 0,
        matchedKeywords,
      };
    }

    case 'message_count': {
      const threshold = config.messageCountThreshold || 1;
      return {
        triggered: context.messageCount === threshold,
      };
    }

    case 'inactivity': {
      // Inactivity triggers are handled by a separate scheduler
      // This check is for real-time evaluation which doesn't apply
      return { triggered: false };
    }

    case 'lead_captured':
    case 'appointment_booked': {
      // These are event-based triggers, not message-based
      // They should be triggered by the respective event handlers
      return { triggered: false };
    }

    default:
      return { triggered: false };
  }
}

interface ActionExecutionResult {
  success: boolean;
  response?: string;
  actionsExecuted: number;
  error?: string;
}

/**
 * Execute workflow actions and return the result
 */
async function executeWorkflowActions(
  workflow: AutomationWorkflow,
  context: AutomationV2Context
): Promise<ActionExecutionResult> {
  const actions = (workflow.actions || []) as Array<{
    id: string;
    type: string;
    order: number;
    config: {
      message?: string;
      delay?: number;
      template?: string;
      channel?: string;
      tags?: string[];
      variable?: { name: string; value: string };
    };
  }>;

  if (actions.length === 0) {
    return { success: true, actionsExecuted: 0 };
  }

  // Sort actions by order
  const sortedActions = [...actions].sort((a, b) => a.order - b.order);

  let response: string | undefined;
  let actionsExecuted = 0;

  try {
    for (const action of sortedActions) {
      switch (action.type) {
        case 'send_message': {
          // Replace placeholders in message
          let message = action.config.message || '';
          message = message.replace('{{botName}}', workflow.name);
          message = message.replace('{{sessionId}}', context.sessionId);
          response = message;
          actionsExecuted++;
          break;
        }

        case 'delay': {
          // In real-time context, we don't actually delay
          // Delays would be handled by a job queue
          actionsExecuted++;
          break;
        }

        case 'tag_session': {
          // Tag the session with the specified tags
          // This would integrate with session storage
          actionsExecuted++;
          break;
        }

        case 'capture_lead': {
          // Extract and capture lead info
          const contactInfo = extractContactInfo(context.message);
          if (contactInfo.email || contactInfo.phone || contactInfo.name) {
            // Lead would be captured via storage
            actionsExecuted++;
          }
          break;
        }

        case 'notify_staff': {
          // Send notification to staff
          // This would integrate with notification system
          actionsExecuted++;
          break;
        }

        default:
          // Unknown action type, skip
          break;
      }
    }

    return {
      success: true,
      response,
      actionsExecuted,
    };
  } catch (error) {
    return {
      success: false,
      actionsExecuted,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Trigger a workflow by event (for non-message triggers like lead_captured)
 */
export async function triggerWorkflowByEvent(
  botId: string,
  eventType: 'lead_captured' | 'appointment_booked',
  eventData: Record<string, any>
): Promise<AutomationV2Result> {
  const result: AutomationV2Result = {
    triggered: false,
    shouldContinue: true,
  };

  try {
    const workflows = await storage.getActiveAutomationWorkflowsByBot(botId);
    const eventWorkflows = workflows.filter(w => w.triggerType === eventType);

    for (const workflow of eventWorkflows) {
      // Create run log
      const run = await storage.createAutomationRun({
        workflowId: workflow.id,
        botId: botId,
        sessionId: eventData.sessionId || null,
        status: 'running',
        triggerContext: {
          triggerType: eventType,
          ...eventData,
        } as any,
      });

      // Execute actions
      const context: AutomationV2Context = {
        clientId: eventData.clientId || '',
        botId,
        sessionId: eventData.sessionId || '',
        message: '',
        messageCount: 0,
      };

      const executionResult = await executeWorkflowActions(workflow, context);

      // Update run
      await storage.updateAutomationRun(run.id, {
        status: executionResult.success ? 'completed' : 'failed',
        completedAt: new Date(),
        actionsExecuted: executionResult.actionsExecuted,
        result: {
          success: executionResult.success,
          response: executionResult.response,
          error: executionResult.error,
        } as any,
      });

      result.triggered = true;
      result.workflowId = workflow.id;
      result.workflowName = workflow.name;
      result.response = executionResult.response;
      result.runId = run.id;
    }
  } catch (error) {
    console.error('Error triggering workflow by event:', error);
  }

  return result;
}

import crypto from 'crypto';
import { db } from './storage';
import { clientSettings } from '@shared/schema';
import { eq } from 'drizzle-orm';

export interface WebhookPayload {
  event: 'lead.created' | 'lead.updated' | 'appointment.created' | 'session.started' | 'session.ended';
  timestamp: string;
  clientId: string;
  data: Record<string, any>;
}

interface WebhookConfig {
  webhookUrl: string | null;
  webhookSecret: string | null;
  webhookEnabled: boolean;
  webhookEvents: {
    newLead: boolean;
    newAppointment: boolean;
    chatSessionStart: boolean;
    chatSessionEnd: boolean;
    leadStatusChange: boolean;
  };
}

function generateSignature(payload: string, secret: string): string {
  return crypto
    .createHmac('sha256', secret)
    .update(payload, 'utf8')
    .digest('hex');
}

async function getWebhookConfig(clientId: string): Promise<WebhookConfig | null> {
  try {
    const [settings] = await db
      .select({
        webhookUrl: clientSettings.webhookUrl,
        webhookSecret: clientSettings.webhookSecret,
        webhookEnabled: clientSettings.webhookEnabled,
        webhookEvents: clientSettings.webhookEvents,
      })
      .from(clientSettings)
      .where(eq(clientSettings.clientId, clientId))
      .limit(1);
    
    if (!settings) {
      return null;
    }
    
    return {
      webhookUrl: settings.webhookUrl,
      webhookSecret: settings.webhookSecret,
      webhookEnabled: settings.webhookEnabled,
      webhookEvents: settings.webhookEvents ?? {
        newLead: true,
        newAppointment: true,
        chatSessionStart: false,
        chatSessionEnd: false,
        leadStatusChange: false,
      },
    };
  } catch (error) {
    console.error('[Webhook] Error fetching config:', error);
    return null;
  }
}

function shouldTriggerEvent(
  event: WebhookPayload['event'],
  config: WebhookConfig['webhookEvents']
): boolean {
  switch (event) {
    case 'lead.created':
      return config.newLead;
    case 'lead.updated':
      return config.leadStatusChange;
    case 'appointment.created':
      return config.newAppointment;
    case 'session.started':
      return config.chatSessionStart;
    case 'session.ended':
      return config.chatSessionEnd;
    default:
      return false;
  }
}

export async function sendWebhook(
  clientId: string,
  event: WebhookPayload['event'],
  data: Record<string, any>
): Promise<{ success: boolean; statusCode?: number; error?: string }> {
  try {
    const config = await getWebhookConfig(clientId);
    
    if (!config) {
      return { success: false, error: 'No webhook configuration found' };
    }
    
    if (!config.webhookEnabled) {
      return { success: false, error: 'Webhooks are disabled' };
    }
    
    if (!config.webhookUrl) {
      return { success: false, error: 'No webhook URL configured' };
    }
    
    if (!shouldTriggerEvent(event, config.webhookEvents)) {
      return { success: false, error: `Event ${event} is not enabled` };
    }
    
    const payload: WebhookPayload = {
      event,
      timestamp: new Date().toISOString(),
      clientId,
      data,
    };
    
    const payloadString = JSON.stringify(payload);
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'X-Webhook-Event': event,
      'X-Webhook-Timestamp': payload.timestamp,
    };
    
    if (config.webhookSecret) {
      const signature = generateSignature(payloadString, config.webhookSecret);
      headers['X-Webhook-Signature'] = `sha256=${signature}`;
    }
    
    console.log(`[Webhook] Sending ${event} to ${config.webhookUrl}`);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    try {
      const response = await fetch(config.webhookUrl, {
        method: 'POST',
        headers,
        body: payloadString,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        console.log(`[Webhook] Successfully delivered ${event} (${response.status})`);
        return { success: true, statusCode: response.status };
      } else {
        console.error(`[Webhook] Delivery failed: ${response.status} ${response.statusText}`);
        return { success: false, statusCode: response.status, error: response.statusText };
      }
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        console.error('[Webhook] Request timeout');
        return { success: false, error: 'Request timeout (10s)' };
      }
      throw fetchError;
    }
  } catch (error: any) {
    console.error('[Webhook] Error:', error.message);
    return { success: false, error: error.message };
  }
}

export async function sendLeadCreatedWebhook(
  clientId: string,
  lead: {
    id: string;
    name: string;
    email?: string | null;
    phone?: string | null;
    source?: string | null;
    status: string;
    createdAt: Date;
  }
): Promise<{ success: boolean; error?: string }> {
  return sendWebhook(clientId, 'lead.created', {
    leadId: lead.id,
    name: lead.name,
    email: lead.email,
    phone: lead.phone,
    source: lead.source,
    status: lead.status,
    createdAt: lead.createdAt.toISOString(),
  });
}

export async function sendLeadUpdatedWebhook(
  clientId: string,
  lead: {
    id: string;
    name: string;
    status: string;
    previousStatus?: string;
  }
): Promise<{ success: boolean; error?: string }> {
  return sendWebhook(clientId, 'lead.updated', {
    leadId: lead.id,
    name: lead.name,
    status: lead.status,
    previousStatus: lead.previousStatus,
  });
}

export async function sendAppointmentCreatedWebhook(
  clientId: string,
  appointment: {
    id: number;
    name: string;
    email?: string | null;
    phone?: string | null;
    preferredDate?: string | null;
    preferredTime?: string | null;
    appointmentType: string;
    notes?: string | null;
    createdAt: Date;
  }
): Promise<{ success: boolean; error?: string }> {
  return sendWebhook(clientId, 'appointment.created', {
    appointmentId: appointment.id,
    name: appointment.name,
    email: appointment.email,
    phone: appointment.phone,
    preferredDate: appointment.preferredDate,
    preferredTime: appointment.preferredTime,
    appointmentType: appointment.appointmentType,
    notes: appointment.notes,
    createdAt: appointment.createdAt.toISOString(),
  });
}

export async function sendSessionStartedWebhook(
  clientId: string,
  session: {
    sessionId: string;
    botId?: string;
    startedAt: Date;
    userAgent?: string;
  }
): Promise<{ success: boolean; error?: string }> {
  return sendWebhook(clientId, 'session.started', {
    sessionId: session.sessionId,
    botId: session.botId,
    startedAt: session.startedAt.toISOString(),
    userAgent: session.userAgent,
  });
}

export async function sendSessionEndedWebhook(
  clientId: string,
  session: {
    sessionId: string;
    botId?: string;
    startedAt: Date;
    endedAt: Date;
    messageCount: number;
    leadCaptured?: boolean;
    appointmentBooked?: boolean;
  }
): Promise<{ success: boolean; error?: string }> {
  return sendWebhook(clientId, 'session.ended', {
    sessionId: session.sessionId,
    botId: session.botId,
    startedAt: session.startedAt.toISOString(),
    endedAt: session.endedAt.toISOString(),
    durationMinutes: Math.round(
      (session.endedAt.getTime() - session.startedAt.getTime()) / 60000
    ),
    messageCount: session.messageCount,
    leadCaptured: session.leadCaptured,
    appointmentBooked: session.appointmentBooked,
  });
}

export async function testWebhook(
  clientId: string
): Promise<{ success: boolean; statusCode?: number; error?: string }> {
  const config = await getWebhookConfig(clientId);
  
  if (!config || !config.webhookUrl) {
    return { success: false, error: 'No webhook URL configured' };
  }
  
  const testPayload: WebhookPayload = {
    event: 'lead.created',
    timestamp: new Date().toISOString(),
    clientId,
    data: {
      test: true,
      message: 'This is a test webhook from Treasure Coast AI',
    },
  };
  
  const payloadString = JSON.stringify(testPayload);
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'X-Webhook-Event': 'test',
    'X-Webhook-Timestamp': testPayload.timestamp,
  };
  
  if (config.webhookSecret) {
    const signature = generateSignature(payloadString, config.webhookSecret);
    headers['X-Webhook-Signature'] = `sha256=${signature}`;
  }
  
  console.log(`[Webhook] Sending test to ${config.webhookUrl}`);
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    const response = await fetch(config.webhookUrl, {
      method: 'POST',
      headers,
      body: payloadString,
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      return { success: true, statusCode: response.status };
    } else {
      return { success: false, statusCode: response.status, error: response.statusText };
    }
  } catch (error: any) {
    if (error.name === 'AbortError') {
      return { success: false, error: 'Request timeout (10s)' };
    }
    return { success: false, error: error.message };
  }
}

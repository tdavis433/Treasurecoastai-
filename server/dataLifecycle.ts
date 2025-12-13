import { db } from './storage';
import { 
  leads, 
  appointments, 
  chatSessions, 
  chatAnalyticsEvents,
  dailyAnalytics,
  sessionStates,
  notificationLogs,
  conversationNotes,
  conversations,
  conversationMessages,
  workspaces
} from '@shared/schema';
import { eq, lt, inArray, sql } from 'drizzle-orm';
import { structuredLogger } from './structuredLogger';

export interface RetentionConfig {
  chatSessionsDays: number;
  leadsDays: number;
  appointmentsDays: number;
  analyticsEventsDays: number;
  notificationLogsDays: number;
  sessionStatesDays: number;
  conversationsDays: number;
}

const defaultRetentionConfig: RetentionConfig = {
  chatSessionsDays: parseInt(process.env.RETENTION_CHAT_SESSIONS_DAYS || '365', 10),
  leadsDays: parseInt(process.env.RETENTION_LEADS_DAYS || '730', 10),
  appointmentsDays: parseInt(process.env.RETENTION_APPOINTMENTS_DAYS || '730', 10),
  analyticsEventsDays: parseInt(process.env.RETENTION_ANALYTICS_DAYS || '180', 10),
  notificationLogsDays: parseInt(process.env.RETENTION_NOTIFICATION_LOGS_DAYS || '90', 10),
  sessionStatesDays: parseInt(process.env.RETENTION_SESSION_STATES_DAYS || '30', 10),
  conversationsDays: parseInt(process.env.RETENTION_CONVERSATIONS_DAYS || '365', 10),
};

export function getRetentionConfig(): RetentionConfig {
  return { ...defaultRetentionConfig };
}

async function getWorkspaceIdForClient(clientId: string): Promise<string | null> {
  const [workspace] = await db.select().from(workspaces).where(eq(workspaces.slug, clientId)).limit(1);
  return workspace?.id || null;
}

export async function exportClientData(clientId: string): Promise<{
  leads: any[];
  appointments: any[];
  chatSessions: any[];
  analyticsEvents: any[];
  conversations: any[];
  conversationMessages: any[];
  exportedAt: string;
}> {
  structuredLogger.info('Data export requested', { clientId, action: 'data_export' });

  const workspaceId = await getWorkspaceIdForClient(clientId);

  const [clientLeads, clientAppointments, clientSessions, clientEvents] = await Promise.all([
    db.select().from(leads).where(eq(leads.clientId, clientId)),
    db.select().from(appointments).where(eq(appointments.clientId, clientId)),
    db.select().from(chatSessions).where(eq(chatSessions.clientId, clientId)),
    db.select().from(chatAnalyticsEvents).where(eq(chatAnalyticsEvents.clientId, clientId)),
  ]);

  let clientConversations: any[] = [];
  let clientMessages: any[] = [];

  if (workspaceId) {
    clientConversations = await db.select().from(conversations).where(eq(conversations.workspaceId, workspaceId));
    
    if (clientConversations.length > 0) {
      const conversationIds = clientConversations.map(c => c.id);
      clientMessages = await db.select().from(conversationMessages).where(inArray(conversationMessages.conversationId, conversationIds));
    }
  }

  structuredLogger.info('Data export completed', { 
    clientId, 
    action: 'data_export_complete',
    counts: {
      leads: clientLeads.length,
      appointments: clientAppointments.length,
      chatSessions: clientSessions.length,
      analyticsEvents: clientEvents.length,
      conversations: clientConversations.length,
      conversationMessages: clientMessages.length,
    }
  });

  return {
    leads: clientLeads,
    appointments: clientAppointments,
    chatSessions: clientSessions,
    analyticsEvents: clientEvents,
    conversations: clientConversations,
    conversationMessages: clientMessages,
    exportedAt: new Date().toISOString(),
  };
}

export async function deleteClientData(clientId: string, options: {
  deleteLeads?: boolean;
  deleteAppointments?: boolean;
  deleteChatSessions?: boolean;
  deleteAnalytics?: boolean;
  deleteConversations?: boolean;
} = {}): Promise<{
  deletedCounts: Record<string, number>;
  deletedAt: string;
}> {
  const { 
    deleteLeads: delLeads = true, 
    deleteAppointments: delAppts = true, 
    deleteChatSessions: delSessions = true, 
    deleteAnalytics: delAnalytics = true,
    deleteConversations: delConvos = true 
  } = options;

  structuredLogger.info('Data deletion requested', { clientId, action: 'data_delete', options });

  const deletedCounts: Record<string, number> = {};
  const workspaceId = await getWorkspaceIdForClient(clientId);

  if (delLeads) {
    const result = await db.delete(leads).where(eq(leads.clientId, clientId)).returning();
    deletedCounts.leads = result.length;
  }

  if (delAppts) {
    const result = await db.delete(appointments).where(eq(appointments.clientId, clientId)).returning();
    deletedCounts.appointments = result.length;
  }

  if (delSessions) {
    const sessionResult = await db.delete(chatSessions).where(eq(chatSessions.clientId, clientId)).returning();
    deletedCounts.chatSessions = sessionResult.length;
  }

  if (delAnalytics) {
    const [eventsResult, dailyResult] = await Promise.all([
      db.delete(chatAnalyticsEvents).where(eq(chatAnalyticsEvents.clientId, clientId)).returning(),
      db.delete(dailyAnalytics).where(eq(dailyAnalytics.clientId, clientId)).returning(),
    ]);
    deletedCounts.analyticsEvents = eventsResult.length;
    deletedCounts.dailyAnalytics = dailyResult.length;
  }

  if (delConvos && workspaceId) {
    const clientConversations = await db.select({ id: conversations.id }).from(conversations).where(eq(conversations.workspaceId, workspaceId));
    
    if (clientConversations.length > 0) {
      const conversationIds = clientConversations.map(c => c.id);
      
      const msgResult = await db.delete(conversationMessages).where(inArray(conversationMessages.conversationId, conversationIds)).returning();
      deletedCounts.conversationMessages = msgResult.length;
      
      const convoResult = await db.delete(conversations).where(eq(conversations.workspaceId, workspaceId)).returning();
      deletedCounts.conversations = convoResult.length;
    }
  }

  structuredLogger.info('Data deletion completed', { clientId, action: 'data_delete_complete', deletedCounts });

  return {
    deletedCounts,
    deletedAt: new Date().toISOString(),
  };
}

export async function purgeOldData(config?: Partial<RetentionConfig>): Promise<{
  purgedCounts: Record<string, number>;
  purgedAt: string;
}> {
  const retentionConfig = { ...defaultRetentionConfig, ...config };
  const now = new Date();

  structuredLogger.info('Data purge started', { action: 'data_purge', config: retentionConfig });

  const purgedCounts: Record<string, number> = {};

  // Purge leads older than retention period
  const leadsCutoff = new Date(now.getTime() - retentionConfig.leadsDays * 24 * 60 * 60 * 1000);
  const leadsResult = await db.delete(leads).where(lt(leads.createdAt, leadsCutoff)).returning();
  purgedCounts.leads = leadsResult.length;

  // Purge appointments older than retention period
  const appointmentsCutoff = new Date(now.getTime() - retentionConfig.appointmentsDays * 24 * 60 * 60 * 1000);
  const appointmentsResult = await db.delete(appointments).where(lt(appointments.createdAt, appointmentsCutoff)).returning();
  purgedCounts.appointments = appointmentsResult.length;

  // Purge chat sessions older than retention period
  const sessionCutoff = new Date(now.getTime() - retentionConfig.chatSessionsDays * 24 * 60 * 60 * 1000);
  const sessionResult = await db.delete(chatSessions).where(lt(chatSessions.startedAt, sessionCutoff)).returning();
  purgedCounts.chatSessions = sessionResult.length;

  // Purge analytics events older than retention period
  const eventsCutoff = new Date(now.getTime() - retentionConfig.analyticsEventsDays * 24 * 60 * 60 * 1000);
  const eventsResult = await db.delete(chatAnalyticsEvents).where(lt(chatAnalyticsEvents.createdAt, eventsCutoff)).returning();
  purgedCounts.analyticsEvents = eventsResult.length;

  // Purge daily analytics older than retention period (same as analytics events)
  // dailyAnalytics.date is stored as YYYY-MM-DD text, so compare with formatted string
  const dailyCutoffStr = eventsCutoff.toISOString().split('T')[0];
  const dailyResult = await db.delete(dailyAnalytics).where(lt(dailyAnalytics.date, dailyCutoffStr)).returning();
  purgedCounts.dailyAnalytics = dailyResult.length;

  // Purge notification logs older than retention period
  const notificationCutoff = new Date(now.getTime() - retentionConfig.notificationLogsDays * 24 * 60 * 60 * 1000);
  const notificationResult = await db.delete(notificationLogs).where(lt(notificationLogs.createdAt, notificationCutoff)).returning();
  purgedCounts.notificationLogs = notificationResult.length;

  // Purge session states older than retention period
  const sessionStateCutoff = new Date(now.getTime() - retentionConfig.sessionStatesDays * 24 * 60 * 60 * 1000);
  const stateResult = await db.delete(sessionStates).where(lt(sessionStates.updatedAt, sessionStateCutoff)).returning();
  purgedCounts.sessionStates = stateResult.length;

  // Purge conversations and messages older than retention period
  const conversationsCutoff = new Date(now.getTime() - retentionConfig.conversationsDays * 24 * 60 * 60 * 1000);
  const oldConversations = await db.select({ id: conversations.id }).from(conversations).where(lt(conversations.updatedAt, conversationsCutoff));
  
  if (oldConversations.length > 0) {
    const oldConversationIds = oldConversations.map(c => c.id);
    
    // Delete messages first (foreign key constraint)
    const msgResult = await db.delete(conversationMessages).where(inArray(conversationMessages.conversationId, oldConversationIds)).returning();
    purgedCounts.conversationMessages = msgResult.length;
    
    // Delete conversation notes - notes use sessionId, not conversationId
    // We'll delete notes that are older than the cutoff date instead
    const notesResult = await db.delete(conversationNotes).where(lt(conversationNotes.createdAt, conversationsCutoff)).returning();
    purgedCounts.conversationNotes = notesResult.length;
    
    // Delete conversations
    const convoResult = await db.delete(conversations).where(inArray(conversations.id, oldConversationIds)).returning();
    purgedCounts.conversations = convoResult.length;
  } else {
    purgedCounts.conversationMessages = 0;
    purgedCounts.conversationNotes = 0;
    purgedCounts.conversations = 0;
  }

  structuredLogger.info('Data purge completed', { action: 'data_purge_complete', purgedCounts });

  return {
    purgedCounts,
    purgedAt: new Date().toISOString(),
  };
}

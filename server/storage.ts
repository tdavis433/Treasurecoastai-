import { 
  type Appointment, 
  type InsertAppointment, 
  type ClientSettings,
  type InsertClientSettings,
  type ConversationAnalytics,
  type InsertConversationAnalytics,
  type AdminUser,
  type ChatSession,
  type InsertChatSession,
  type ChatAnalyticsEvent,
  type InsertChatAnalyticsEvent,
  type DailyAnalytics,
  type InsertDailyAnalytics,
  type MonthlyUsage,
  type InsertMonthlyUsage,
  type Lead,
  type InsertLead,
  type WorkspaceMembership,
  type Workspace,
  type Bot,
  type AutomationWorkflow,
  type InsertAutomationWorkflow,
  type AutomationRun,
  type InsertAutomationRun,
  type WidgetSettings,
  type InsertWidgetSettings,
  type ConversationNote,
  type InsertConversationNote,
  type SessionState,
  type InsertSessionState,
  type SystemLog,
  type InsertSystemLog,
  type KnowledgeSource,
  type InsertKnowledgeSource,
  type KnowledgeDocument,
  type InsertKnowledgeDocument,
  type KnowledgeChunk,
  type InsertKnowledgeChunk,
  type ScrapedWebsite,
  type InsertScrapedWebsite,
  type BookingIntent,
  type InsertBookingIntent,
  appointments,
  clientSettings,
  conversationAnalytics,
  adminUsers,
  chatSessions,
  chatAnalyticsEvents,
  dailyAnalytics,
  monthlyUsage,
  leads,
  workspaceMemberships,
  workspaces,
  bots,
  automationWorkflows,
  automationRuns,
  widgetSettings,
  conversationNotes,
  sessionStates,
  systemLogs,
  conversations,
  conversationMessages,
  conversationParticipants,
  conversationActivities,
  messageAttachments,
  channels,
  knowledgeSources,
  knowledgeDocuments,
  knowledgeChunks,
  scrapedWebsites,
  notificationLogs,
  bookingIntents,
  type InsertNotificationLog,
  type NotificationLog,
} from "@shared/schema";
import * as schema from "@shared/schema";
import { drizzle } from "drizzle-orm/neon-serverless";
import { neonConfig, Pool } from "@neondatabase/serverless";
import { eq, and, gte, lte, lt, or, like, sql, desc } from "drizzle-orm";
import ws from "ws";

neonConfig.webSocketConstructor = ws;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool, { schema });

export interface IStorage {
  createAppointment(clientId: string, appointment: InsertAppointment): Promise<Appointment>;
  getAllAppointments(clientId: string): Promise<Appointment[]>;
  getFilteredAppointments(clientId: string, filters: { 
    status?: string; 
    startDate?: Date; 
    endDate?: Date; 
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ appointments: Appointment[]; total: number }>;
  getAppointmentById(clientId: string, id: string): Promise<Appointment | undefined>;
  getAppointmentBySessionId(sessionId: string, clientId: string): Promise<Appointment | undefined>;
  updateAppointment(clientId: string, id: string, updates: Partial<Appointment>): Promise<Appointment>;
  updateAppointmentStatus(clientId: string, id: string, status: string): Promise<void>;
  deleteAppointment(clientId: string, id: string): Promise<void>;
  
  getSettings(clientId: string): Promise<ClientSettings | undefined>;
  updateSettings(clientId: string, settings: Partial<InsertClientSettings>): Promise<ClientSettings>;
  
  logConversation(clientId: string, analytics: InsertConversationAnalytics): Promise<void>;
  getAnalytics(clientId: string, startDate?: Date, endDate?: Date): Promise<ConversationAnalytics[]>;
  getAnalyticsSummary(clientId: string, startDate?: Date, endDate?: Date): Promise<{
    totalConversations: number;
    totalAppointments: number;
    conversionRate: number;
    crisisRedirects: number;
    messagesByCategory: { category: string; count: number }[];
    dailyActivity: { date: string; conversations: number; appointments: number }[];
  }>;
  
  findAdminByUsername(username: string): Promise<AdminUser | undefined>;
  
  // Multi-tenant chat analytics
  createOrUpdateChatSession(session: InsertChatSession): Promise<ChatSession>;
  getChatSession(sessionId: string, clientId: string, botId: string): Promise<ChatSession | undefined>;
  updateChatSession(sessionId: string, clientId: string, botId: string, updates: Partial<ChatSession>): Promise<void>;
  logAnalyticsEvent(event: InsertChatAnalyticsEvent): Promise<void>;
  getClientAnalyticsSummary(clientId: string, botId?: string, startDate?: Date, endDate?: Date): Promise<{
    totalConversations: number;
    totalMessages: number;
    userMessages: number;
    botMessages: number;
    avgResponseTimeMs: number;
    crisisEvents: number;
    appointmentRequests: number;
    topicBreakdown: Record<string, number>;
  }>;
  getClientDailyTrends(clientId: string, botId?: string, days?: number): Promise<DailyAnalytics[]>;
  getClientRecentSessions(clientId: string, botId?: string, limit?: number): Promise<ChatSession[]>;
  updateOrCreateDailyAnalytics(analytics: InsertDailyAnalytics): Promise<void>;
  
  // Monthly usage tracking for plan limits
  getOrCreateMonthlyUsage(clientId: string, month: string): Promise<MonthlyUsage>;
  incrementMonthlyUsage(clientId: string, month: string, field: 'messages' | 'leads' | 'automations'): Promise<MonthlyUsage>;
  getMonthlyUsageHistory(clientId: string, months?: number): Promise<MonthlyUsage[]>;
  
  // Leads management
  createLead(lead: InsertLead): Promise<Lead>;
  getLeads(clientId: string, filters?: {
    status?: string;
    priority?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ leads: Lead[]; total: number }>;
  getLeadById(clientId: string, id: string): Promise<Lead | undefined>;
  updateLead(clientId: string, id: string, updates: Partial<Lead>): Promise<Lead>;
  deleteLead(clientId: string, id: string): Promise<void>;
  getLeadBySessionId(sessionId: string, clientId: string): Promise<Lead | undefined>;
  
  // Booking leads and analytics
  getBookingLeads(clientId: string, filters?: {
    status?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ leads: Lead[]; total: number }>;
  getBookingAnalytics(clientId: string, startDate?: Date, endDate?: Date): Promise<{
    totalBookingIntents: number;
    totalLeadCaptured: number;
    totalLinkClicks: number;
    pendingBookings: number;
    completedBookings: number;
    funnelMode: 'handoff' | 'confirmable' | 'internal';
    dailyTrends: { date: string; intents: number; clicks: number }[];
  }>;
  logBookingIntentEvent(data: { clientId: string; botId: string; sessionId: string; leadId?: string }): Promise<void>;
  logBookingLinkClickEvent(data: { clientId: string; botId: string; sessionId: string; leadId?: string; bookingUrl: string }): Promise<void>;
  
  // Booking intents - proper tracking table for booking flows
  createBookingIntent(intent: InsertBookingIntent): Promise<BookingIntent>;
  getBookingIntentById(id: string): Promise<BookingIntent | undefined>;
  getBookingIntentBySessionId(sessionId: string, workspaceId: string): Promise<BookingIntent | undefined>;
  updateBookingIntent(id: string, updates: Partial<BookingIntent>): Promise<BookingIntent>;
  getBookingIntents(workspaceId: string, filters?: { status?: string; limit?: number }): Promise<BookingIntent[]>;
  confirmBookingIntent(id: string): Promise<BookingIntent>;
  markBookingIntentRedirected(id: string): Promise<BookingIntent>;
  
  // Quick Book v1 - Lead deduplication by phone/email
  findLeadByContact(clientId: string, phone?: string, email?: string): Promise<Lead | undefined>;
  upsertQuickBookLead(clientId: string, botId: string, sessionId: string, data: {
    name: string;
    phone?: string;
    email?: string;
    serviceName?: string;
    intentId?: string;
  }): Promise<Lead>;
  
  // Session-based lead upsert for partial saves (prevents abandoned leads from being lost)
  upsertLeadBySession(clientId: string, botId: string, sessionId: string, patch: {
    name?: string;
    phone?: string;
    email?: string;
    bookingIntent?: boolean;
    bookingStatus?: string;
    serviceRequested?: string;
    tags?: string[];
    metadata?: Record<string, unknown>;
    conversationPreview?: string;
    messageCount?: number;
    priority?: string;
    source?: string;
  }): Promise<Lead>;
  
  // Inbox - conversation messages (overloaded - clientId optional for admin access)
  getSessionMessages(sessionId: string, clientId?: string): Promise<ChatAnalyticsEvent[]>;
  
  // Workspace membership validation
  getUserWorkspaceMemberships(userId: string): Promise<WorkspaceMembership[]>;
  checkWorkspaceMembership(userId: string, workspaceId: string): Promise<WorkspaceMembership | undefined>;
  getWorkspaceByClientId(clientId: string): Promise<Workspace | undefined>;
  
  // Conversation notes
  createConversationNote(note: InsertConversationNote): Promise<ConversationNote>;
  getConversationNotes(sessionId: string, clientId: string): Promise<ConversationNote[]>;
  updateConversationNote(id: string, clientId: string, updates: Partial<ConversationNote>): Promise<ConversationNote>;
  deleteConversationNote(id: string, clientId: string): Promise<void>;
  
  // Session states
  getOrCreateSessionState(sessionId: string, clientId: string, botId: string): Promise<SessionState>;
  updateSessionState(sessionId: string, clientId: string, updates: Partial<SessionState>): Promise<SessionState>;
  getSessionStates(clientId: string, filters?: {
    status?: string;
    isRead?: boolean;
    assignedToUserId?: string;
  }): Promise<SessionState[]>;
  
  // Health check
  healthCheck?(): Promise<{ status: string; latencyMs?: number }>;
  
  // Knowledge Base (Phase 2A)
  createKnowledgeSource(source: InsertKnowledgeSource): Promise<KnowledgeSource>;
  getKnowledgeSources(workspaceId: string, botId?: string): Promise<KnowledgeSource[]>;
  getKnowledgeSourceById(id: string): Promise<KnowledgeSource | undefined>;
  updateKnowledgeSource(id: string, updates: Partial<KnowledgeSource>): Promise<KnowledgeSource>;
  deleteKnowledgeSource(id: string): Promise<void>;
  
  createKnowledgeDocument(document: InsertKnowledgeDocument): Promise<KnowledgeDocument>;
  getKnowledgeDocuments(sourceId: string): Promise<KnowledgeDocument[]>;
  getKnowledgeDocumentById(id: string): Promise<KnowledgeDocument | undefined>;
  updateKnowledgeDocument(id: string, updates: Partial<KnowledgeDocument>): Promise<KnowledgeDocument>;
  deleteKnowledgeDocument(id: string): Promise<void>;
  
  createKnowledgeChunk(chunk: InsertKnowledgeChunk): Promise<KnowledgeChunk>;
  getKnowledgeChunks(documentId: string): Promise<KnowledgeChunk[]>;
  getKnowledgeChunksBySource(sourceId: string): Promise<KnowledgeChunk[]>;
  deleteKnowledgeChunks(documentId: string): Promise<void>;
  searchKnowledgeChunks(workspaceId: string, query: string, limit?: number): Promise<KnowledgeChunk[]>;
  
  // System logs (Super Admin)
  createSystemLog(log: InsertSystemLog): Promise<SystemLog>;
  getSystemLogs(filters?: {
    level?: string;
    source?: string;
    workspaceId?: string;
    clientId?: string;
    isResolved?: boolean;
    search?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }): Promise<{ logs: SystemLog[]; total: number }>;
  getSystemLogById(id: string): Promise<SystemLog | undefined>;
  updateSystemLog(id: string, updates: Partial<SystemLog>): Promise<SystemLog>;
  resolveSystemLog(id: string, resolvedBy: string, notes?: string): Promise<SystemLog>;
  getRecentErrorCount(minutes?: number): Promise<number>;
  getSystemStatus(): Promise<{ status: 'operational' | 'degraded' | 'incident'; errorCount: number; lastError?: SystemLog }>;
  
  // Website Scraper (Phase 3)
  createScrapedWebsite(scrape: InsertScrapedWebsite): Promise<ScrapedWebsite>;
  getScrapedWebsites(workspaceId: string, botId?: string): Promise<ScrapedWebsite[]>;
  getScrapedWebsiteById(id: string): Promise<ScrapedWebsite | undefined>;
  updateScrapedWebsite(id: string, updates: Partial<ScrapedWebsite>): Promise<ScrapedWebsite>;
  deleteScrapedWebsite(id: string): Promise<void>;
  
  // Flagged Conversations / Needs Review (Admin Tools)
  getFlaggedConversations(filters?: { clientId?: string; status?: string; limit?: number }): Promise<ChatSession[]>;
  getFlaggedConversationsCount(): Promise<number>;
  markConversationReviewed(sessionId: string, data: { reviewedBy: string; adminNotes?: string; action?: string }): Promise<void>;
  dismissFlaggedConversation(sessionId: string, reviewedBy: string): Promise<void>;
  getSessionMessages(sessionId: string): Promise<ChatAnalyticsEvent[]>;
  getSessionById(sessionId: string): Promise<ChatSession | undefined>;
  
  // Client Admin Notes
  getClientNotes(clientId: string): Promise<AdminNote[]>;
  addClientNote(note: { clientId: string; content: string; category?: string; createdBy: string }): Promise<AdminNote>;
  deleteClientNote(noteId: string): Promise<void>;
  
  // Notification Logs
  createNotificationLog(log: InsertNotificationLog): Promise<NotificationLog>;
  getNotificationLogs(clientId: string, filters?: {
    type?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ logs: NotificationLog[]; total: number }>;
}

// Admin Notes type (stored in clients metadata or separate table)
export interface AdminNote {
  id: string;
  clientId: string;
  content: string;
  category?: string;
  createdBy: string;
  createdAt: Date;
}

export class DbStorage implements IStorage {
  async createAppointment(clientId: string, insertAppointment: InsertAppointment): Promise<Appointment> {
    const [appointment] = await db
      .insert(appointments)
      .values({
        ...insertAppointment,
        clientId,
        notes: insertAppointment.notes ?? null,
      })
      .returning();
    return appointment;
  }

  async getAllAppointments(clientId: string): Promise<Appointment[]> {
    return await db.select().from(appointments).where(eq(appointments.clientId, clientId)).orderBy(desc(appointments.createdAt));
  }

  async getFilteredAppointments(clientId: string, filters: { 
    status?: string; 
    startDate?: Date; 
    endDate?: Date; 
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ appointments: Appointment[]; total: number }> {
    const conditions = [eq(appointments.clientId, clientId)];
    
    if (filters.status) {
      conditions.push(eq(appointments.status, filters.status));
    }
    
    if (filters.startDate) {
      conditions.push(gte(appointments.createdAt, filters.startDate));
    }
    
    if (filters.endDate) {
      conditions.push(lte(appointments.createdAt, filters.endDate));
    }
    
    if (filters.search) {
      const searchTerm = `%${filters.search}%`;
      conditions.push(
        or(
          like(appointments.name, searchTerm),
          like(appointments.contact, searchTerm),
          like(appointments.email, searchTerm)
        )!
      );
    }
    
    const whereClause = and(...conditions);
    
    const [total] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(appointments)
      .where(whereClause);
    
    const results = await db
      .select()
      .from(appointments)
      .where(whereClause)
      .orderBy(desc(appointments.createdAt))
      .limit(filters.limit || 25)
      .offset(filters.offset || 0);
    
    return { appointments: results, total: total?.count || 0 };
  }

  async getAppointmentById(clientId: string, id: string): Promise<Appointment | undefined> {
    const [appointment] = await db
      .select()
      .from(appointments)
      .where(and(eq(appointments.id, id), eq(appointments.clientId, clientId)))
      .limit(1);
    return appointment;
  }

  async getAppointmentBySessionId(sessionId: string, clientId: string): Promise<Appointment | undefined> {
    const [appointment] = await db
      .select()
      .from(appointments)
      .where(and(eq(appointments.sessionId, sessionId), eq(appointments.clientId, clientId)))
      .limit(1);
    return appointment;
  }

  async updateAppointment(clientId: string, id: string, updates: Partial<Appointment>): Promise<Appointment> {
    const [updated] = await db
      .update(appointments)
      .set(updates)
      .where(and(eq(appointments.id, id), eq(appointments.clientId, clientId)))
      .returning();
    return updated;
  }

  async updateAppointmentStatus(clientId: string, id: string, status: string): Promise<void> {
    await db
      .update(appointments)
      .set({ status })
      .where(and(eq(appointments.id, id), eq(appointments.clientId, clientId)));
  }

  async deleteAppointment(clientId: string, id: string): Promise<void> {
    await db.delete(appointments).where(and(eq(appointments.id, id), eq(appointments.clientId, clientId)));
  }

  async getSettings(clientId: string): Promise<ClientSettings | undefined> {
    const [settings] = await db.select().from(clientSettings).where(eq(clientSettings.clientId, clientId)).limit(1);
    
    if (!settings) {
      const [created] = await db
        .insert(clientSettings)
        .values({
          clientId,
          businessName: "The Faith House",
          tagline: "Here to support your next step",
          businessType: "Sober Living",
          timezone: "America/New_York",
          defaultContactMethod: "phone",
          status: "active",
          knowledgeBase: {
            about: "The Faith House is a structured sober-living environment designed to support individuals in their recovery journey. We provide safe, structured housing with accountability, mandatory attendance at recovery meetings, established curfews and house rules, chore responsibilities and community living, job search support and employment expectations, and a respectful, supportive community environment.",
            requirements: "Requirements for residents: Maintain complete sobriety (no alcohol or drugs), attend required recovery meetings regularly, respect curfew times, respect all staff and fellow residents, maintain cleanliness in personal and common areas, work or actively seek employment, and follow all house rules and guidelines.",
            pricing: "Pricing covers housing, utilities, and support services. Exact pricing varies and should be confirmed with staff during the application process.",
            application: "Application process typically involves providing personal information, background details, emergency contact, and agreement to follow all house rules and expectations."
          },
          faqEntries: [],
          longFormKnowledge: { aboutProgram: '', houseRules: '', whoItsFor: '', paymentInfo: '' },
          appointmentTypesConfig: [
            { id: 'tour', label: 'Schedule a Tour', description: 'Visit our facility in person', durationMinutes: 30, category: 'lead', active: true },
            { id: 'phone', label: 'Phone Call', description: 'Speak with our team', durationMinutes: 15, category: 'lead', active: true },
            { id: 'family', label: 'Family Info Call', description: 'Information for family members', durationMinutes: 20, category: 'lead', active: true },
          ],
          preIntakeConfig: [
            { id: 'forWho', label: 'Who is this for?', internalKey: 'lookingFor', type: 'single_choice' as const, options: [{ value: 'self', label: 'Myself' }, { value: 'loved_one', label: 'A loved one' }], required: true, order: 1, active: true },
            { id: 'sobriety', label: 'What is your current sobriety status?', internalKey: 'sobrietyStatus', type: 'single_choice' as const, options: [{ value: 'sober', label: 'Currently sober' }, { value: 'in_treatment', label: 'In treatment' }, { value: 'seeking', label: 'Seeking help' }], required: true, order: 2, active: true },
            { id: 'support', label: 'Do you have financial support?', internalKey: 'hasSupport', type: 'single_choice' as const, options: [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }, { value: 'partial', label: 'Partial' }], required: true, order: 3, active: true },
            { id: 'timeline', label: 'When are you looking to move in?', internalKey: 'timeline', type: 'single_choice' as const, options: [{ value: 'immediately', label: 'Immediately' }, { value: 'this_week', label: 'This week' }, { value: 'this_month', label: 'This month' }, { value: 'exploring', label: 'Just exploring' }], required: true, order: 4, active: true },
          ],
          operatingHours: {
            enabled: false,
            timezone: "America/New_York",
            schedule: {
              monday: { open: "09:00", close: "17:00", enabled: true },
              tuesday: { open: "09:00", close: "17:00", enabled: true },
              wednesday: { open: "09:00", close: "17:00", enabled: true },
              thursday: { open: "09:00", close: "17:00", enabled: true },
              friday: { open: "09:00", close: "17:00", enabled: true },
              saturday: { open: "10:00", close: "14:00", enabled: false },
              sunday: { open: "10:00", close: "14:00", enabled: false }
            },
            afterHoursMessage: "Thank you for reaching out! Our staff will respond first thing during our next business hours."
          },
          notificationSettings: {
            staffEmails: [],
            staffPhones: [],
            staffChannelPreference: 'email_only' as const,
            eventToggles: {
              newAppointmentEmail: true,
              newAppointmentSms: false,
              newPreIntakeEmail: false,
              sameDayReminder: false,
            },
            templates: {
              staffEmailSubject: 'New Appointment Request from {{leadName}}',
              staffEmailBody: 'A new {{appointmentType}} appointment has been requested by {{leadName}} for {{preferredTime}}.',
            },
          },
          primaryColor: "#1FA2A8",
          accentColor: "#F59E0B",
          enableEmailNotifications: false,
          enableSmsNotifications: false
        })
        .returning();
      return created;
    }
    
    return settings;
  }

  async updateSettings(clientId: string, updates: Partial<InsertClientSettings>): Promise<ClientSettings> {
    const existing = await this.getSettings(clientId);
    
    if (!existing) {
      const defaultValues = await this.getSettings(clientId);
      return defaultValues!;
    }
    
    const [updated] = await db
      .update(clientSettings)
      .set({ ...updates, updatedAt: new Date() } as any)
      .where(eq(clientSettings.id, existing.id))
      .returning();
    
    return updated;
  }

  async logConversation(clientId: string, analytics: InsertConversationAnalytics): Promise<void> {
    await db.insert(conversationAnalytics).values({ ...analytics, clientId });
  }

  async getAnalytics(clientId: string, startDate?: Date, endDate?: Date): Promise<ConversationAnalytics[]> {
    const results = await db.select().from(conversationAnalytics).where(eq(conversationAnalytics.clientId, clientId));
    return results;
  }

  async getAnalyticsSummary(clientId: string, startDate?: Date, endDate?: Date): Promise<{
    totalConversations: number;
    totalAppointments: number;
    conversionRate: number;
    crisisRedirects: number;
    messagesByCategory: { category: string; count: number }[];
    dailyActivity: { date: string; conversations: number; appointments: number }[];
  }> {
    const conditions = [eq(conversationAnalytics.clientId, clientId)];
    const appointmentConditions = [eq(appointments.clientId, clientId)];
    
    if (startDate) {
      conditions.push(gte(conversationAnalytics.createdAt, startDate));
      appointmentConditions.push(gte(appointments.createdAt, startDate));
    }
    
    if (endDate) {
      conditions.push(lte(conversationAnalytics.createdAt, endDate));
      appointmentConditions.push(lte(appointments.createdAt, endDate));
    }
    
    const uniqueSessions = await db
      .select({ sessionId: conversationAnalytics.sessionId })
      .from(conversationAnalytics)
      .where(and(...conditions))
      .groupBy(conversationAnalytics.sessionId);
    
    const totalConversations = uniqueSessions.length;
    
    const appointmentResults = await db
      .select()
      .from(appointments)
      .where(and(...appointmentConditions));
    
    const totalAppointments = appointmentResults.length;
    
    const conversionRate = totalConversations > 0 
      ? (totalAppointments / totalConversations) * 100 
      : 0;
    
    const crisisMessages = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(conversationAnalytics)
      .where(and(...conditions, eq(conversationAnalytics.category, 'crisis_redirect')));
    
    const crisisRedirects = crisisMessages[0]?.count || 0;
    
    const categoryResults = await db
      .select({
        category: conversationAnalytics.category,
        count: sql<number>`count(*)::int`
      })
      .from(conversationAnalytics)
      .where(and(...conditions, sql`category IS NOT NULL`))
      .groupBy(conversationAnalytics.category);
    
    const messagesByCategory = categoryResults.map(r => ({
      category: r.category || 'other',
      count: r.count
    }));
    
    const conversationsByDay = await db
      .select({
        date: sql<string>`DATE(${conversationAnalytics.createdAt})`,
        count: sql<number>`count(DISTINCT ${conversationAnalytics.sessionId})::int`
      })
      .from(conversationAnalytics)
      .where(and(...conditions))
      .groupBy(sql`DATE(${conversationAnalytics.createdAt})`);
    
    const appointmentsByDay = await db
      .select({
        date: sql<string>`DATE(${appointments.createdAt})`,
        count: sql<number>`count(*)::int`
      })
      .from(appointments)
      .where(and(...appointmentConditions))
      .groupBy(sql`DATE(${appointments.createdAt})`);
    
    const dailyActivityMap = new Map<string, { conversations: number; appointments: number }>();
    
    conversationsByDay.forEach(row => {
      dailyActivityMap.set(row.date, { conversations: row.count, appointments: 0 });
    });
    
    appointmentsByDay.forEach(row => {
      const existing = dailyActivityMap.get(row.date) || { conversations: 0, appointments: 0 };
      dailyActivityMap.set(row.date, { ...existing, appointments: row.count });
    });
    
    const dailyActivity = Array.from(dailyActivityMap.entries())
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date));
    
    return {
      totalConversations,
      totalAppointments,
      conversionRate: Math.round(conversionRate * 10) / 10,
      crisisRedirects,
      messagesByCategory,
      dailyActivity
    };
  }

  async findAdminByUsername(username: string): Promise<AdminUser | undefined> {
    const [user] = await db
      .select()
      .from(adminUsers)
      .where(eq(adminUsers.username, username))
      .limit(1);
    return user;
  }

  // Multi-tenant chat analytics implementation
  async createOrUpdateChatSession(session: InsertChatSession): Promise<ChatSession> {
    const existing = await this.getChatSession(session.sessionId, session.clientId, session.botId);
    
    if (existing) {
      const topicsArray = Array.isArray(session.topics) ? session.topics : (existing.topics as string[] || []);
      
      // Merge metadata instead of overwriting
      const mergedMetadata = {
        ...(existing.metadata as Record<string, unknown> || {}),
        ...(session.metadata as Record<string, unknown> || {})
      };
      
      const [updated] = await db
        .update(chatSessions)
        .set({
          userMessageCount: session.userMessageCount ?? existing.userMessageCount,
          botMessageCount: session.botMessageCount ?? existing.botMessageCount,
          totalResponseTimeMs: session.totalResponseTimeMs ?? existing.totalResponseTimeMs,
          crisisDetected: session.crisisDetected ?? existing.crisisDetected,
          appointmentRequested: session.appointmentRequested ?? existing.appointmentRequested,
          topics: topicsArray as any,
          endedAt: session.endedAt ?? existing.endedAt,
          metadata: mergedMetadata as any,
          needsReview: session.needsReview ?? existing.needsReview,
          reviewReason: session.reviewReason ?? existing.reviewReason,
        })
        .where(eq(chatSessions.id, existing.id))
        .returning();
      return updated;
    }
    
    const insertData = {
      ...session,
      topics: Array.isArray(session.topics) ? session.topics : [],
    };
    const [created] = await db
      .insert(chatSessions)
      .values(insertData as any)
      .returning();
    return created;
  }

  async getChatSession(sessionId: string, clientId: string, botId: string): Promise<ChatSession | undefined> {
    const [session] = await db
      .select()
      .from(chatSessions)
      .where(and(
        eq(chatSessions.sessionId, sessionId),
        eq(chatSessions.clientId, clientId),
        eq(chatSessions.botId, botId)
      ))
      .limit(1);
    return session;
  }

  async updateChatSession(sessionId: string, clientId: string, botId: string, updates: Partial<ChatSession>): Promise<void> {
    await db
      .update(chatSessions)
      .set(updates)
      .where(and(
        eq(chatSessions.sessionId, sessionId),
        eq(chatSessions.clientId, clientId),
        eq(chatSessions.botId, botId)
      ));
  }

  async logAnalyticsEvent(event: InsertChatAnalyticsEvent): Promise<void> {
    await db.insert(chatAnalyticsEvents).values(event);
  }

  async getClientAnalyticsSummary(clientId: string, botId?: string, startDate?: Date, endDate?: Date): Promise<{
    totalConversations: number;
    totalMessages: number;
    userMessages: number;
    botMessages: number;
    avgResponseTimeMs: number;
    crisisEvents: number;
    appointmentRequests: number;
    topicBreakdown: Record<string, number>;
  }> {
    const conditions = [eq(chatSessions.clientId, clientId)];
    if (botId) conditions.push(eq(chatSessions.botId, botId));
    if (startDate) conditions.push(gte(chatSessions.startedAt, startDate));
    if (endDate) conditions.push(lte(chatSessions.startedAt, endDate));

    const sessions = await db
      .select()
      .from(chatSessions)
      .where(and(...conditions));

    const totalConversations = sessions.length;
    let totalMessages = 0;
    let userMessages = 0;
    let botMessages = 0;
    let totalResponseTime = 0;
    let crisisEvents = 0;
    let appointmentRequests = 0;
    const topicCounts: Record<string, number> = {};

    sessions.forEach(session => {
      userMessages += session.userMessageCount;
      botMessages += session.botMessageCount;
      totalMessages += session.userMessageCount + session.botMessageCount;
      totalResponseTime += session.totalResponseTimeMs;
      if (session.crisisDetected) crisisEvents++;
      if (session.appointmentRequested) appointmentRequests++;
      
      const topics = session.topics as string[] || [];
      topics.forEach(topic => {
        topicCounts[topic] = (topicCounts[topic] || 0) + 1;
      });
    });

    const avgResponseTimeMs = totalConversations > 0 
      ? Math.round(totalResponseTime / totalConversations) 
      : 0;

    return {
      totalConversations,
      totalMessages,
      userMessages,
      botMessages,
      avgResponseTimeMs,
      crisisEvents,
      appointmentRequests,
      topicBreakdown: topicCounts,
    };
  }

  async getClientDailyTrends(clientId: string, botId?: string, days: number = 30): Promise<DailyAnalytics[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateStr = startDate.toISOString().split('T')[0];

    const conditions = [
      eq(dailyAnalytics.clientId, clientId),
      gte(dailyAnalytics.date, startDateStr)
    ];
    if (botId) conditions.push(eq(dailyAnalytics.botId, botId));

    const results = await db
      .select()
      .from(dailyAnalytics)
      .where(and(...conditions))
      .orderBy(dailyAnalytics.date);

    return results;
  }

  async getClientRecentSessions(clientId: string, botId?: string, limit: number = 50): Promise<ChatSession[]> {
    const conditions = [eq(chatSessions.clientId, clientId)];
    if (botId) conditions.push(eq(chatSessions.botId, botId));

    const results = await db
      .select()
      .from(chatSessions)
      .where(and(...conditions))
      .orderBy(desc(chatSessions.startedAt))
      .limit(limit);

    return results;
  }

  async updateOrCreateDailyAnalytics(analytics: InsertDailyAnalytics): Promise<void> {
    const existing = await db
      .select()
      .from(dailyAnalytics)
      .where(and(
        eq(dailyAnalytics.date, analytics.date),
        eq(dailyAnalytics.clientId, analytics.clientId),
        eq(dailyAnalytics.botId, analytics.botId)
      ))
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(dailyAnalytics)
        .set({
          totalConversations: (existing[0].totalConversations || 0) + (analytics.totalConversations || 0),
          totalMessages: (existing[0].totalMessages || 0) + (analytics.totalMessages || 0),
          userMessages: (existing[0].userMessages || 0) + (analytics.userMessages || 0),
          botMessages: (existing[0].botMessages || 0) + (analytics.botMessages || 0),
          crisisEvents: (existing[0].crisisEvents || 0) + (analytics.crisisEvents || 0),
          appointmentRequests: (existing[0].appointmentRequests || 0) + (analytics.appointmentRequests || 0),
        })
        .where(eq(dailyAnalytics.id, existing[0].id));
    } else {
      await db.insert(dailyAnalytics).values(analytics);
    }
  }

  async getOrCreateMonthlyUsage(clientId: string, month: string): Promise<MonthlyUsage> {
    const [result] = await db
      .insert(monthlyUsage)
      .values({
        clientId,
        month,
        messagesUsed: 0,
        leadsCapture: 0,
        automationsTriggered: 0,
      })
      .onConflictDoUpdate({
        target: [monthlyUsage.clientId, monthlyUsage.month],
        set: {
          lastUpdated: new Date(),
        },
      })
      .returning();
    
    return result;
  }

  async incrementMonthlyUsage(
    clientId: string, 
    month: string, 
    field: 'messages' | 'leads' | 'automations'
  ): Promise<MonthlyUsage> {
    const usage = await this.getOrCreateMonthlyUsage(clientId, month);
    
    const updates: Partial<MonthlyUsage> = {
      lastUpdated: new Date(),
    };
    
    if (field === 'messages') {
      updates.messagesUsed = usage.messagesUsed + 1;
    } else if (field === 'leads') {
      updates.leadsCapture = usage.leadsCapture + 1;
    } else if (field === 'automations') {
      updates.automationsTriggered = usage.automationsTriggered + 1;
    }
    
    const [updated] = await db
      .update(monthlyUsage)
      .set(updates)
      .where(eq(monthlyUsage.id, usage.id))
      .returning();
    
    return updated;
  }

  async getMonthlyUsageHistory(clientId: string, months: number = 6): Promise<MonthlyUsage[]> {
    const results = await db
      .select()
      .from(monthlyUsage)
      .where(eq(monthlyUsage.clientId, clientId))
      .orderBy(desc(monthlyUsage.month))
      .limit(months);
    
    return results;
  }

  // Leads management
  async createLead(lead: InsertLead): Promise<Lead> {
    const [created] = await db
      .insert(leads)
      .values(lead as any)
      .returning();
    return created;
  }

  async getLeads(clientId: string, filters?: {
    status?: string;
    priority?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ leads: Lead[]; total: number }> {
    const conditions = [eq(leads.clientId, clientId)];
    
    if (filters?.status) {
      conditions.push(eq(leads.status, filters.status));
    }
    
    if (filters?.priority) {
      conditions.push(eq(leads.priority, filters.priority));
    }
    
    if (filters?.search) {
      const searchTerm = `%${filters.search}%`;
      conditions.push(
        or(
          like(leads.name, searchTerm),
          like(leads.email, searchTerm),
          like(leads.phone, searchTerm)
        )!
      );
    }
    
    const whereClause = and(...conditions);
    
    // Get total count
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(leads)
      .where(whereClause);
    
    const total = Number(countResult[0]?.count || 0);
    
    // Get paginated results
    let query = db
      .select()
      .from(leads)
      .where(whereClause)
      .orderBy(desc(leads.createdAt));
    
    if (filters?.limit) {
      query = query.limit(filters.limit) as typeof query;
    }
    
    if (filters?.offset) {
      query = query.offset(filters.offset) as typeof query;
    }
    
    const results = await query;
    
    return { leads: results, total };
  }

  async getLeadById(clientId: string, id: string): Promise<Lead | undefined> {
    const [lead] = await db
      .select()
      .from(leads)
      .where(and(
        eq(leads.id, id),
        eq(leads.clientId, clientId)
      ))
      .limit(1);
    return lead;
  }

  async updateLead(clientId: string, id: string, updates: Partial<Lead>): Promise<Lead> {
    const [updated] = await db
      .update(leads)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(and(
        eq(leads.id, id),
        eq(leads.clientId, clientId)
      ))
      .returning();
    return updated;
  }

  async deleteLead(clientId: string, id: string): Promise<void> {
    await db.delete(leads).where(and(
      eq(leads.id, id),
      eq(leads.clientId, clientId)
    ));
  }

  async getLeadBySessionId(sessionId: string, clientId: string): Promise<Lead | undefined> {
    const [lead] = await db
      .select()
      .from(leads)
      .where(and(
        eq(leads.sessionId, sessionId),
        eq(leads.clientId, clientId)
      ))
      .limit(1);
    return lead;
  }

  // Booking leads and analytics
  async getBookingLeads(clientId: string, filters?: {
    status?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ leads: Lead[]; total: number }> {
    const conditions = [
      eq(leads.clientId, clientId),
      eq(leads.bookingIntent, true)
    ];
    
    if (filters?.status) {
      conditions.push(eq(leads.bookingStatus, filters.status));
    }
    
    if (filters?.search) {
      const searchTerm = `%${filters.search}%`;
      conditions.push(
        or(
          like(leads.name, searchTerm),
          like(leads.email, searchTerm),
          like(leads.phone, searchTerm),
          like(leads.serviceRequested, searchTerm)
        )!
      );
    }
    
    const whereClause = and(...conditions);
    
    // Get total count
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(leads)
      .where(whereClause);
    
    const total = Number(countResult[0]?.count || 0);
    
    // Get paginated results
    let query = db
      .select()
      .from(leads)
      .where(whereClause)
      .orderBy(desc(leads.createdAt));
    
    if (filters?.limit) {
      query = query.limit(filters.limit) as typeof query;
    }
    
    if (filters?.offset) {
      query = query.offset(filters.offset) as typeof query;
    }
    
    const results = await query;
    
    return { leads: results, total };
  }

  async getBookingAnalytics(clientId: string, startDate?: Date, endDate?: Date): Promise<{
    totalBookingIntents: number;
    totalLeadCaptured: number;
    totalLinkClicks: number;
    pendingBookings: number;
    completedBookings: number;
    funnelMode: 'handoff' | 'confirmable' | 'internal';
    dailyTrends: { date: string; intents: number; clicks: number }[];
  }> {
    const now = new Date();
    const defaultStartDate = startDate || new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const defaultEndDate = endDate || now;
    
    // Determine funnelMode from client settings AND workspace status (config-driven)
    // Must align with handling logic in quickbook.ts:
    // - 'demo' when quickBookDemoMode === true OR workspace.status === 'demo' -> ALWAYS confirmable (override)
    // - 'external' when bookingMode === 'external' AND (externalBookingUrl OR service-specific URLs) -> handoff
    // - 'internal' otherwise (default) -> internal (staff can confirm)
    const settings = await this.getSettings(clientId);
    const workspace = await this.getWorkspaceByClientId(clientId);
    const isWorkspaceDemoStatus = workspace?.status === 'demo';
    
    // Check if external booking is configured:
    // Either global externalBookingUrl OR at least one ACTIVE service with a bookingUrl
    const hasGlobalExternalUrl = !!settings?.externalBookingUrl;
    const hasServiceSpecificUrls = Array.isArray(settings?.servicesCatalog) && 
      (settings.servicesCatalog as any[]).some(s => s?.active !== false && !!s.bookingUrl);
    
    const externalConfigured = settings?.bookingMode === 'external' && 
      (hasGlobalExternalUrl || hasServiceSpecificUrls);
    
    // funnelMode determines which funnel UI to show:
    // - 'confirmable': demo mode only (4 steps with Confirmed)
    // - 'handoff': external booking configured (3 steps, "redirected to external")
    // - 'internal': no external config (3 steps, "we'll follow up to confirm")
    const funnelMode: 'handoff' | 'confirmable' | 'internal' = 
      (settings?.quickBookDemoMode === true || isWorkspaceDemoStatus)
        ? 'confirmable'
        : (externalConfigured ? 'handoff' : 'internal');
    
    // Count booking intents from the booking_intents table (source of truth)
    const intentCountResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(bookingIntents)
      .where(and(
        eq(bookingIntents.workspaceId, clientId),
        gte(bookingIntents.createdAt, defaultStartDate),
        lte(bookingIntents.createdAt, defaultEndDate)
      ));
    
    const totalBookingIntents = Number(intentCountResult[0]?.count || 0);
    
    // Count leads captured - cohort-aligned with totalBookingIntents
    // Filter by createdAt (same as intents) + leadCapturedAt IS NOT NULL
    // This ensures funnel stages are from the same cohort of intents
    const leadCapturedResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(bookingIntents)
      .where(and(
        eq(bookingIntents.workspaceId, clientId),
        sql`${bookingIntents.leadCapturedAt} IS NOT NULL`,
        gte(bookingIntents.createdAt, defaultStartDate),
        lte(bookingIntents.createdAt, defaultEndDate)
      ));
    
    const totalLeadCaptured = Number(leadCapturedResult[0]?.count || 0);
    
    // Count booking link clicks from analytics events
    const clickConditions = [
      eq(chatAnalyticsEvents.clientId, clientId),
      eq(chatAnalyticsEvents.eventType, 'booking_link_click'),
      gte(chatAnalyticsEvents.createdAt, defaultStartDate),
      lte(chatAnalyticsEvents.createdAt, defaultEndDate)
    ];
    
    const clickCountResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(chatAnalyticsEvents)
      .where(and(...clickConditions));
    
    const totalLinkClicks = Number(clickCountResult[0]?.count || 0);
    
    // Pending bookings: started, lead_captured only (active in-progress states)
    // clicked_to_book is terminal for handoff mode, not pending
    const pendingCountResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(bookingIntents)
      .where(and(
        eq(bookingIntents.workspaceId, clientId),
        sql`${bookingIntents.status} IN ('started', 'lead_captured')`,
        gte(bookingIntents.createdAt, defaultStartDate),
        lte(bookingIntents.createdAt, defaultEndDate)
      ));
    
    const pendingBookings = Number(pendingCountResult[0]?.count || 0);
    
    // Completed bookings: ONLY when funnelMode='confirmable', else always 0
    // For handoff mode, we CANNOT claim confirmed - external provider handles that
    let completedBookings = 0;
    if (funnelMode === 'confirmable') {
      const completedCountResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(bookingIntents)
        .where(and(
          eq(bookingIntents.workspaceId, clientId),
          sql`${bookingIntents.status} IN ('demo_confirmed', 'confirmed')`,
          gte(bookingIntents.createdAt, defaultStartDate),
          lte(bookingIntents.createdAt, defaultEndDate)
        ));
      
      completedBookings = Number(completedCountResult[0]?.count || 0);
    }
    // For handoff mode, completedBookings stays 0 (honest about what we don't know)
    
    // Get daily trends for the date range
    const dailyTrends: { date: string; intents: number; clicks: number }[] = [];
    
    // Generate dates for the range
    const currentDate = new Date(defaultStartDate);
    while (currentDate <= defaultEndDate) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const nextDate = new Date(currentDate);
      nextDate.setDate(nextDate.getDate() + 1);
      
      // Count intents for this day from booking_intents table
      // Use gte for start, lt for end to prevent midnight double-counting
      const dayIntentResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(bookingIntents)
        .where(and(
          eq(bookingIntents.workspaceId, clientId),
          gte(bookingIntents.createdAt, currentDate),
          lt(bookingIntents.createdAt, nextDate)
        ));
      
      const dayClickResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(chatAnalyticsEvents)
        .where(and(
          eq(chatAnalyticsEvents.clientId, clientId),
          eq(chatAnalyticsEvents.eventType, 'booking_link_click'),
          gte(chatAnalyticsEvents.createdAt, currentDate),
          lt(chatAnalyticsEvents.createdAt, nextDate)
        ));
      
      dailyTrends.push({
        date: dateStr,
        intents: Number(dayIntentResult[0]?.count || 0),
        clicks: Number(dayClickResult[0]?.count || 0)
      });
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return {
      totalBookingIntents,
      totalLeadCaptured,
      totalLinkClicks,
      pendingBookings,
      completedBookings,
      funnelMode,
      dailyTrends
    };
  }

  async logBookingIntentEvent(data: { clientId: string; botId: string; sessionId: string; leadId?: string }): Promise<void> {
    await db.insert(chatAnalyticsEvents).values({
      clientId: data.clientId,
      botId: data.botId,
      sessionId: data.sessionId,
      eventType: 'booking_intent',
      actor: 'user',
      metadata: { leadId: data.leadId, timestamp: new Date().toISOString() }
    });
  }

  async logBookingLinkClickEvent(data: { clientId: string; botId: string; sessionId: string; leadId?: string; bookingUrl: string }): Promise<void> {
    await db.insert(chatAnalyticsEvents).values({
      clientId: data.clientId,
      botId: data.botId,
      sessionId: data.sessionId,
      eventType: 'booking_link_click',
      actor: 'user',
      metadata: { 
        leadId: data.leadId, 
        bookingUrl: data.bookingUrl,
        timestamp: new Date().toISOString() 
      }
    });
  }

  // Booking intent CRUD operations
  async createBookingIntent(intent: InsertBookingIntent): Promise<BookingIntent> {
    const [created] = await db
      .insert(bookingIntents)
      .values(intent as any)
      .returning();
    return created;
  }

  async getBookingIntentById(id: string): Promise<BookingIntent | undefined> {
    const [intent] = await db
      .select()
      .from(bookingIntents)
      .where(eq(bookingIntents.id, id))
      .limit(1);
    return intent;
  }

  async getBookingIntentBySessionId(sessionId: string, workspaceId: string): Promise<BookingIntent | undefined> {
    const [intent] = await db
      .select()
      .from(bookingIntents)
      .where(and(
        eq(bookingIntents.sessionId, sessionId),
        eq(bookingIntents.workspaceId, workspaceId)
      ))
      .orderBy(desc(bookingIntents.createdAt))
      .limit(1);
    return intent;
  }

  async updateBookingIntent(id: string, updates: Partial<BookingIntent>): Promise<BookingIntent> {
    const [updated] = await db
      .update(bookingIntents)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(bookingIntents.id, id))
      .returning();
    return updated;
  }

  async getBookingIntents(workspaceId: string, filters?: { status?: string; limit?: number }): Promise<BookingIntent[]> {
    const conditions = [eq(bookingIntents.workspaceId, workspaceId)];
    if (filters?.status) {
      conditions.push(eq(bookingIntents.status, filters.status));
    }
    
    let query = db.select().from(bookingIntents).where(and(...conditions)).orderBy(desc(bookingIntents.createdAt));
    
    if (filters?.limit) {
      query = query.limit(filters.limit) as any;
    }
    
    return query;
  }

  async confirmBookingIntent(id: string): Promise<BookingIntent> {
    const [updated] = await db
      .update(bookingIntents)
      .set({ 
        status: 'confirmed', 
        confirmedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(bookingIntents.id, id))
      .returning();
    return updated;
  }

  async markBookingIntentRedirected(id: string): Promise<BookingIntent> {
    const [updated] = await db
      .update(bookingIntents)
      .set({ 
        status: 'redirected', 
        redirectedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(bookingIntents.id, id))
      .returning();
    return updated;
  }

  // Quick Book v1 - Lead deduplication by phone/email (guardrail #2)
  async findLeadByContact(clientId: string, phone?: string, email?: string): Promise<Lead | undefined> {
    if (!phone && !email) return undefined;
    
    const conditions = [eq(leads.clientId, clientId)];
    
    // Match by phone first (preferred), then email
    if (phone) {
      const [lead] = await db
        .select()
        .from(leads)
        .where(and(
          eq(leads.clientId, clientId),
          eq(leads.phone, phone)
        ))
        .limit(1);
      if (lead) return lead;
    }
    
    if (email) {
      const [lead] = await db
        .select()
        .from(leads)
        .where(and(
          eq(leads.clientId, clientId),
          eq(leads.email, email)
        ))
        .limit(1);
      if (lead) return lead;
    }
    
    return undefined;
  }

  // Quick Book v1 - Upsert lead with dedupe logic (guardrail #2)
  async upsertQuickBookLead(clientId: string, botId: string, sessionId: string, data: {
    name: string;
    phone?: string;
    email?: string;
    serviceName?: string;
    intentId?: string;
  }): Promise<Lead> {
    // Try to find existing lead by phone/email
    const existingLead = await this.findLeadByContact(clientId, data.phone, data.email);
    
    if (existingLead) {
      // Update existing lead with new info
      const updates: Partial<Lead> = {
        name: data.name,
        status: 'booking_in_progress',
        bookingIntent: true,
        serviceRequested: data.serviceName,
        metadata: {
          ...(existingLead.metadata || {}),
          quickBookIntentId: data.intentId,
          lastQuickBookActivity: new Date().toISOString(),
        }
      };
      
      // Only update phone/email if provided and different
      if (data.phone && data.phone !== existingLead.phone) updates.phone = data.phone;
      if (data.email && data.email !== existingLead.email) updates.email = data.email;
      
      return this.updateLead(clientId, existingLead.id, updates);
    }
    
    // Create new lead
    const leadData: any = {
      clientId,
      botId,
      sessionId,
      name: data.name,
      phone: data.phone || null,
      email: data.email || null,
      source: 'quick_book',
      status: 'booking_in_progress',
      bookingIntent: true,
      serviceRequested: data.serviceName || null,
    };
    
    // Only add metadata if we have intent ID
    if (data.intentId) {
      leadData.metadata = {
        quickBookIntentId: data.intentId,
        createdVia: 'quick_book_v1',
      };
    }
    
    const newLead = await this.createLead(leadData);
    
    return newLead;
  }

  /**
   * Session-based lead upsert for partial saves.
   * Unique key: (clientId, botId, sessionId)
   * If exists: merge patch fields into existing lead
   * This ensures abandoned flows become visible leads.
   */
  async upsertLeadBySession(clientId: string, botId: string, sessionId: string, patch: {
    name?: string;
    phone?: string;
    email?: string;
    bookingIntent?: boolean;
    bookingStatus?: string;
    serviceRequested?: string;
    tags?: string[];
    metadata?: Record<string, unknown>;
    conversationPreview?: string;
    messageCount?: number;
    priority?: string;
    source?: string;
  }): Promise<Lead> {
    // Check if lead already exists for this session
    const existingLead = await this.getLeadBySessionId(sessionId, clientId);
    
    if (existingLead) {
      // Merge updates - don't overwrite existing data with nulls
      const updates: Partial<Lead> = {
        updatedAt: new Date(),
      };
      
      // Only update fields if provided in patch AND not already set
      if (patch.name && patch.name.trim() && !existingLead.name) updates.name = patch.name.trim();
      if (patch.phone && patch.phone.trim() && !existingLead.phone) updates.phone = patch.phone.trim();
      if (patch.email && patch.email.trim() && !existingLead.email) updates.email = patch.email.trim();
      if (patch.bookingIntent !== undefined && patch.bookingIntent && !existingLead.bookingIntent) {
        updates.bookingIntent = patch.bookingIntent;
      }
      if (patch.bookingStatus && !existingLead.bookingStatus) updates.bookingStatus = patch.bookingStatus;
      if (patch.serviceRequested && !existingLead.serviceRequested) updates.serviceRequested = patch.serviceRequested;
      
      // Priority: Only elevate priority, never downgrade
      if (patch.priority) {
        const priorityOrder: Record<string, number> = { 'low': 1, 'medium': 2, 'high': 3 };
        const currentPriority = priorityOrder[existingLead.priority || 'medium'] || 2;
        const newPriority = priorityOrder[patch.priority] || 2;
        if (newPriority > currentPriority) {
          updates.priority = patch.priority;
        }
      }
      if (patch.conversationPreview) {
        // Truncate to prevent bloat (max 500 chars)
        updates.conversationPreview = patch.conversationPreview.slice(0, 500);
      }
      if (typeof patch.messageCount === 'number') updates.messageCount = patch.messageCount;
      
      // Merge tags (union, no duplicates)
      if (patch.tags && patch.tags.length > 0) {
        const existingTags = (existingLead.tags as string[]) || [];
        const mergedTags = [...new Set([...existingTags, ...patch.tags])];
        updates.tags = mergedTags;
      }
      
      // Merge metadata (shallow merge)
      if (patch.metadata && Object.keys(patch.metadata).length > 0) {
        const existingMetadata = (existingLead.metadata as Record<string, unknown>) || {};
        updates.metadata = { ...existingMetadata, ...patch.metadata };
      }
      
      return this.updateLead(clientId, existingLead.id, updates);
    }
    
    // Create new lead with patch data
    const newLeadData: any = {
      clientId,
      botId,
      sessionId,
      name: patch.name?.trim() || null,
      phone: patch.phone?.trim() || null,
      email: patch.email?.trim() || null,
      source: patch.source || 'chat',
      status: 'new',
      priority: patch.priority || 'medium',
      bookingIntent: patch.bookingIntent || false,
      bookingStatus: patch.bookingStatus || null,
      serviceRequested: patch.serviceRequested || null,
      conversationPreview: patch.conversationPreview?.slice(0, 500) || null,
      messageCount: patch.messageCount || 1,
      tags: patch.tags || [],
      metadata: patch.metadata || {},
    };
    
    return this.createLead(newLeadData);
  }

  async getSessionMessages(sessionId: string, clientId?: string): Promise<ChatAnalyticsEvent[]> {
    const conditions = [eq(chatAnalyticsEvents.sessionId, sessionId)];
    if (clientId) {
      conditions.push(eq(chatAnalyticsEvents.clientId, clientId));
    }
    const results = await db
      .select()
      .from(chatAnalyticsEvents)
      .where(and(...conditions))
      .orderBy(chatAnalyticsEvents.createdAt);
    return results;
  }
  
  async healthCheck(): Promise<{ status: string; latencyMs?: number }> {
    const start = Date.now();
    try {
      await db.execute(sql`SELECT 1`);
      return { status: 'ok', latencyMs: Date.now() - start };
    } catch (error) {
      return { status: 'error', latencyMs: Date.now() - start };
    }
  }

  // Workspace membership methods for Phase 2.3
  async getUserWorkspaceMemberships(userId: string): Promise<WorkspaceMembership[]> {
    const results = await db
      .select()
      .from(workspaceMemberships)
      .where(and(
        eq(workspaceMemberships.userId, userId),
        eq(workspaceMemberships.status, 'active')
      ));
    return results;
  }

  async checkWorkspaceMembership(userId: string, workspaceId: string): Promise<WorkspaceMembership | undefined> {
    const [membership] = await db
      .select()
      .from(workspaceMemberships)
      .where(and(
        eq(workspaceMemberships.userId, userId),
        eq(workspaceMemberships.workspaceId, workspaceId),
        eq(workspaceMemberships.status, 'active')
      ))
      .limit(1);
    return membership;
  }

  async getWorkspaceByClientId(clientId: string): Promise<Workspace | undefined> {
    // The clientId typically IS the workspace slug (e.g., "faith_house")
    // Directly match workspace slug to clientId for reliable lookup
    const [workspace] = await db
      .select()
      .from(workspaces)
      .where(eq(workspaces.slug, clientId))
      .limit(1);
    
    return workspace;
  }

  // Get bot by botId (the human-readable ID like 'faith_house_main')
  async getBotByBotId(botId: string): Promise<(Bot & { clientId?: string }) | undefined> {
    const [bot] = await db
      .select()
      .from(bots)
      .where(eq(bots.botId, botId))
      .limit(1);
    
    if (!bot) return undefined;
    
    // Get the workspace to determine clientId (workspace slug)
    const [workspace] = await db
      .select()
      .from(workspaces)
      .where(eq(workspaces.id, bot.workspaceId))
      .limit(1);
    
    return {
      ...bot,
      clientId: workspace?.slug
    };
  }

  // Get all bots for a workspace by workspace ID (UUID)
  async getBotsByWorkspaceId(workspaceId: string): Promise<Bot[]> {
    return db
      .select()
      .from(bots)
      .where(eq(bots.workspaceId, workspaceId));
  }

  // =============================================
  // PHASE 4: AUTOMATION WORKFLOW METHODS
  // =============================================

  async createAutomationWorkflow(workflow: InsertAutomationWorkflow): Promise<AutomationWorkflow> {
    const [created] = await db
      .insert(automationWorkflows)
      .values(workflow as any)
      .returning();
    return created;
  }

  async getAutomationWorkflow(id: string): Promise<AutomationWorkflow | undefined> {
    const [workflow] = await db
      .select()
      .from(automationWorkflows)
      .where(eq(automationWorkflows.id, id))
      .limit(1);
    return workflow;
  }

  async getAutomationWorkflowsByBot(botId: string): Promise<AutomationWorkflow[]> {
    return db
      .select()
      .from(automationWorkflows)
      .where(eq(automationWorkflows.botId, botId))
      .orderBy(desc(automationWorkflows.priority));
  }

  async getActiveAutomationWorkflowsByBot(botId: string): Promise<AutomationWorkflow[]> {
    return db
      .select()
      .from(automationWorkflows)
      .where(and(
        eq(automationWorkflows.botId, botId),
        eq(automationWorkflows.status, 'active')
      ))
      .orderBy(desc(automationWorkflows.priority));
  }

  async updateAutomationWorkflow(id: string, updates: Partial<AutomationWorkflow>): Promise<AutomationWorkflow> {
    const [updated] = await db
      .update(automationWorkflows)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(automationWorkflows.id, id))
      .returning();
    return updated;
  }

  async deleteAutomationWorkflow(id: string): Promise<void> {
    await db
      .delete(automationWorkflows)
      .where(eq(automationWorkflows.id, id));
  }

  // Automation runs (execution logs)
  async createAutomationRun(run: InsertAutomationRun): Promise<AutomationRun> {
    const [created] = await db
      .insert(automationRuns)
      .values(run as any)
      .returning();
    return created;
  }

  async updateAutomationRun(id: string, updates: Partial<AutomationRun>): Promise<AutomationRun> {
    const [updated] = await db
      .update(automationRuns)
      .set(updates)
      .where(eq(automationRuns.id, id))
      .returning();
    return updated;
  }

  async getAutomationRunsByWorkflow(workflowId: string, limit: number = 50): Promise<AutomationRun[]> {
    return db
      .select()
      .from(automationRuns)
      .where(eq(automationRuns.workflowId, workflowId))
      .orderBy(desc(automationRuns.triggeredAt))
      .limit(limit);
  }

  async getAutomationRunsByBot(botId: string, limit: number = 100): Promise<AutomationRun[]> {
    return db
      .select()
      .from(automationRuns)
      .where(eq(automationRuns.botId, botId))
      .orderBy(desc(automationRuns.triggeredAt))
      .limit(limit);
  }

  async getAutomationRunsBySession(sessionId: string): Promise<AutomationRun[]> {
    return db
      .select()
      .from(automationRuns)
      .where(eq(automationRuns.sessionId, sessionId))
      .orderBy(desc(automationRuns.triggeredAt));
  }

  async getRecentAutomationRuns(botId: string, hours: number = 24): Promise<AutomationRun[]> {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);
    return db
      .select()
      .from(automationRuns)
      .where(and(
        eq(automationRuns.botId, botId),
        gte(automationRuns.triggeredAt, since)
      ))
      .orderBy(desc(automationRuns.triggeredAt));
  }

  async countAutomationRunsForSession(workflowId: string, sessionId: string): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(automationRuns)
      .where(and(
        eq(automationRuns.workflowId, workflowId),
        eq(automationRuns.sessionId, sessionId)
      ));
    return result[0]?.count || 0;
  }

  // =============================================
  // WIDGET SETTINGS
  // =============================================

  async getWidgetSettings(botId: string): Promise<WidgetSettings | undefined> {
    const result = await db
      .select()
      .from(widgetSettings)
      .where(eq(widgetSettings.botId, botId))
      .limit(1);
    return result[0];
  }

  async createWidgetSettings(settings: InsertWidgetSettings): Promise<WidgetSettings> {
    const result = await db
      .insert(widgetSettings)
      .values(settings as any)
      .returning();
    return result[0];
  }

  async updateWidgetSettings(botId: string, updates: Partial<InsertWidgetSettings>): Promise<WidgetSettings | undefined> {
    const updateData = { ...updates, updatedAt: new Date() };
    const result = await db
      .update(widgetSettings)
      .set(updateData as any)
      .where(eq(widgetSettings.botId, botId))
      .returning();
    return result[0];
  }

  async upsertWidgetSettings(botId: string, settings: Partial<InsertWidgetSettings>): Promise<WidgetSettings> {
    const existing = await this.getWidgetSettings(botId);
    if (existing) {
      const updated = await this.updateWidgetSettings(botId, settings);
      return updated!;
    } else {
      return this.createWidgetSettings({ botId, ...settings } as InsertWidgetSettings);
    }
  }

  async deleteWidgetSettings(botId: string): Promise<void> {
    await db
      .delete(widgetSettings)
      .where(eq(widgetSettings.botId, botId));
  }

  async getWidgetSettingsWithDefaults(botId: string): Promise<WidgetSettings> {
    const settings = await this.getWidgetSettings(botId);
    if (settings) return settings;
    
    // Return default settings without persisting
    return {
      id: '',
      botId,
      position: 'bottom-right',
      theme: 'dark',
      primaryColor: '#00E5CC',
      secondaryColor: '#A855F7',
      accentColor: null,
      backgroundColor: '#0A0A0F',
      headerBackgroundColor: null,
      textColor: '#F8FAFC',
      textMutedColor: '#94A3B8',
      userMessageColor: '#00E5CC',
      userMessageTextColor: '#FFFFFF',
      botMessageColor: '#151B28',
      botMessageTextColor: '#F8FAFC',
      inputBackgroundColor: '#0F1520',
      inputTextColor: '#F8FAFC',
      inputBorderColor: null,
      avatarUrl: null,
      showAvatar: true,
      bubbleSize: 'medium',
      windowWidth: 380,
      windowHeight: 560,
      borderRadius: 16,
      shadowIntensity: 'medium',
      launcherIconStyle: 'chat-bubble',
      showLauncherLabel: false,
      launcherLabel: 'Chat with us',
      fontFamily: 'system',
      fontSize: 'md',
      showPoweredBy: true,
      headerTitle: null,
      headerSubtitle: 'Online',
      welcomeMessage: null,
      placeholderText: 'Type your message...',
      offlineMessage: "We're currently offline. Leave a message!",
      autoOpen: false,
      autoOpenDelay: 5,
      autoOpenOnce: true,
      soundEnabled: false,
      soundUrl: null,
      mobileFullscreen: true,
      mobileBreakpoint: 480,
      customCss: null,
      advanced: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  // =============================================
  // CONVERSATION NOTES
  // =============================================

  async createConversationNote(note: InsertConversationNote): Promise<ConversationNote> {
    const result = await db
      .insert(conversationNotes)
      .values(note as any)
      .returning();
    return result[0];
  }

  async getConversationNotes(sessionId: string, clientId: string): Promise<ConversationNote[]> {
    return db
      .select()
      .from(conversationNotes)
      .where(and(
        eq(conversationNotes.sessionId, sessionId),
        eq(conversationNotes.clientId, clientId)
      ))
      .orderBy(desc(conversationNotes.createdAt));
  }

  async updateConversationNote(id: string, clientId: string, updates: Partial<ConversationNote>): Promise<ConversationNote> {
    // Verify note belongs to client before updating
    const existing = await db
      .select()
      .from(conversationNotes)
      .where(and(eq(conversationNotes.id, id), eq(conversationNotes.clientId, clientId)))
      .limit(1);
    
    if (existing.length === 0) {
      throw new Error('Note not found or access denied');
    }
    
    const updateData = { ...updates, updatedAt: new Date() };
    const result = await db
      .update(conversationNotes)
      .set(updateData as any)
      .where(and(eq(conversationNotes.id, id), eq(conversationNotes.clientId, clientId)))
      .returning();
    return result[0];
  }

  async deleteConversationNote(id: string, clientId: string): Promise<void> {
    // Verify note belongs to client before deleting
    const existing = await db
      .select()
      .from(conversationNotes)
      .where(and(eq(conversationNotes.id, id), eq(conversationNotes.clientId, clientId)))
      .limit(1);
    
    if (existing.length === 0) {
      throw new Error('Note not found or access denied');
    }
    
    await db
      .delete(conversationNotes)
      .where(and(eq(conversationNotes.id, id), eq(conversationNotes.clientId, clientId)));
  }

  // =============================================
  // SESSION STATES
  // =============================================

  async getOrCreateSessionState(sessionId: string, clientId: string, botId: string): Promise<SessionState> {
    // Try to find existing
    const existing = await db
      .select()
      .from(sessionStates)
      .where(eq(sessionStates.sessionId, sessionId))
      .limit(1);
    
    if (existing.length > 0) return existing[0];
    
    // Create new
    const result = await db
      .insert(sessionStates)
      .values({
        sessionId,
        clientId,
        botId,
        status: 'open',
        isRead: false,
        priority: 'normal',
        tags: [],
      } as any)
      .returning();
    return result[0];
  }

  async updateSessionState(sessionId: string, clientId: string, updates: Partial<SessionState>): Promise<SessionState> {
    // Verify session state belongs to client before updating
    const existing = await db
      .select()
      .from(sessionStates)
      .where(and(eq(sessionStates.sessionId, sessionId), eq(sessionStates.clientId, clientId)))
      .limit(1);
    
    if (existing.length === 0) {
      throw new Error('Session state not found or access denied');
    }
    
    const updateData = { ...updates, updatedAt: new Date() };
    const result = await db
      .update(sessionStates)
      .set(updateData as any)
      .where(and(eq(sessionStates.sessionId, sessionId), eq(sessionStates.clientId, clientId)))
      .returning();
    return result[0];
  }

  async getSessionStates(clientId: string, filters?: {
    status?: string;
    isRead?: boolean;
    assignedToUserId?: string;
  }): Promise<SessionState[]> {
    const conditions = [eq(sessionStates.clientId, clientId)];
    
    if (filters?.status) {
      conditions.push(eq(sessionStates.status, filters.status));
    }
    
    if (filters?.isRead !== undefined) {
      conditions.push(eq(sessionStates.isRead, filters.isRead));
    }
    
    if (filters?.assignedToUserId) {
      conditions.push(eq(sessionStates.assignedToUserId, filters.assignedToUserId));
    }
    
    return db
      .select()
      .from(sessionStates)
      .where(and(...conditions))
      .orderBy(desc(sessionStates.lastActivityAt));
  }

  // =============================================
  // SYSTEM LOGS (Super Admin)
  // =============================================

  async createSystemLog(log: InsertSystemLog): Promise<SystemLog> {
    const result = await db
      .insert(systemLogs)
      .values(log as any)
      .returning();
    return result[0];
  }

  async getSystemLogs(filters?: {
    level?: string;
    source?: string;
    workspaceId?: string;
    clientId?: string;
    isResolved?: boolean;
    search?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }): Promise<{ logs: SystemLog[]; total: number }> {
    const conditions: any[] = [];
    
    if (filters?.level) {
      conditions.push(eq(systemLogs.level, filters.level));
    }
    
    if (filters?.source) {
      conditions.push(eq(systemLogs.source, filters.source));
    }
    
    if (filters?.workspaceId) {
      conditions.push(eq(systemLogs.workspaceId, filters.workspaceId));
    }
    
    if (filters?.clientId) {
      conditions.push(eq(systemLogs.clientId, filters.clientId));
    }
    
    if (filters?.isResolved !== undefined) {
      conditions.push(eq(systemLogs.isResolved, filters.isResolved));
    }
    
    if (filters?.search) {
      const searchTerm = `%${filters.search}%`;
      conditions.push(like(systemLogs.message, searchTerm));
    }
    
    if (filters?.startDate) {
      conditions.push(gte(systemLogs.createdAt, filters.startDate));
    }
    
    if (filters?.endDate) {
      conditions.push(lte(systemLogs.createdAt, filters.endDate));
    }
    
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    
    const [totalResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(systemLogs)
      .where(whereClause);
    
    const logs = await db
      .select()
      .from(systemLogs)
      .where(whereClause)
      .orderBy(desc(systemLogs.createdAt))
      .limit(filters?.limit || 50)
      .offset(filters?.offset || 0);
    
    return { logs, total: totalResult?.count || 0 };
  }

  async getSystemLogById(id: string): Promise<SystemLog | undefined> {
    const result = await db
      .select()
      .from(systemLogs)
      .where(eq(systemLogs.id, id))
      .limit(1);
    return result[0];
  }

  async updateSystemLog(id: string, updates: Partial<SystemLog>): Promise<SystemLog> {
    const result = await db
      .update(systemLogs)
      .set(updates as any)
      .where(eq(systemLogs.id, id))
      .returning();
    return result[0];
  }

  async resolveSystemLog(id: string, resolvedBy: string, notes?: string): Promise<SystemLog> {
    const result = await db
      .update(systemLogs)
      .set({
        isResolved: true,
        resolvedAt: new Date(),
        resolvedBy,
        resolutionNotes: notes || null,
      } as any)
      .where(eq(systemLogs.id, id))
      .returning();
    return result[0];
  }

  async getRecentErrorCount(minutes: number = 15): Promise<number> {
    const since = new Date(Date.now() - minutes * 60 * 1000);
    const result = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(systemLogs)
      .where(and(
        or(eq(systemLogs.level, 'error'), eq(systemLogs.level, 'critical')),
        gte(systemLogs.createdAt, since),
        eq(systemLogs.isResolved, false)
      ));
    return result[0]?.count || 0;
  }

  async getSystemStatus(): Promise<{ status: 'operational' | 'degraded' | 'incident'; errorCount: number; lastError?: SystemLog }> {
    const errorCount = await this.getRecentErrorCount(15);
    
    // Get most recent unresolved error
    const [lastError] = await db
      .select()
      .from(systemLogs)
      .where(and(
        or(eq(systemLogs.level, 'error'), eq(systemLogs.level, 'critical')),
        eq(systemLogs.isResolved, false)
      ))
      .orderBy(desc(systemLogs.createdAt))
      .limit(1);
    
    let status: 'operational' | 'degraded' | 'incident' = 'operational';
    if (errorCount >= 10) {
      status = 'incident';
    } else if (errorCount >= 3) {
      status = 'degraded';
    }
    
    return { status, errorCount, lastError };
  }

  // =============================================
  // KNOWLEDGE BASE (Phase 2A)
  // =============================================

  async createKnowledgeSource(source: InsertKnowledgeSource): Promise<KnowledgeSource> {
    const result = await db
      .insert(knowledgeSources)
      .values(source as any)
      .returning();
    return result[0];
  }

  async getKnowledgeSources(workspaceId: string, botId?: string): Promise<KnowledgeSource[]> {
    const conditions = [eq(knowledgeSources.workspaceId, workspaceId)];
    if (botId) {
      conditions.push(eq(knowledgeSources.botId, botId));
    }
    return db
      .select()
      .from(knowledgeSources)
      .where(and(...conditions))
      .orderBy(desc(knowledgeSources.createdAt));
  }

  async getKnowledgeSourceById(id: string): Promise<KnowledgeSource | undefined> {
    const result = await db
      .select()
      .from(knowledgeSources)
      .where(eq(knowledgeSources.id, id))
      .limit(1);
    return result[0];
  }

  async updateKnowledgeSource(id: string, updates: Partial<KnowledgeSource>): Promise<KnowledgeSource> {
    const result = await db
      .update(knowledgeSources)
      .set({ ...updates, updatedAt: new Date() } as any)
      .where(eq(knowledgeSources.id, id))
      .returning();
    return result[0];
  }

  async deleteKnowledgeSource(id: string): Promise<void> {
    await db.delete(knowledgeChunks).where(eq(knowledgeChunks.sourceId, id));
    await db.delete(knowledgeDocuments).where(eq(knowledgeDocuments.sourceId, id));
    await db.delete(knowledgeSources).where(eq(knowledgeSources.id, id));
  }

  async createKnowledgeDocument(document: InsertKnowledgeDocument): Promise<KnowledgeDocument> {
    const result = await db
      .insert(knowledgeDocuments)
      .values(document as any)
      .returning();
    
    await db
      .update(knowledgeSources)
      .set({ 
        documentCount: sql`${knowledgeSources.documentCount} + 1`,
        updatedAt: new Date() 
      } as any)
      .where(eq(knowledgeSources.id, document.sourceId));
    
    return result[0];
  }

  async getKnowledgeDocuments(sourceId: string): Promise<KnowledgeDocument[]> {
    return db
      .select()
      .from(knowledgeDocuments)
      .where(eq(knowledgeDocuments.sourceId, sourceId))
      .orderBy(desc(knowledgeDocuments.createdAt));
  }

  async getKnowledgeDocumentById(id: string): Promise<KnowledgeDocument | undefined> {
    const result = await db
      .select()
      .from(knowledgeDocuments)
      .where(eq(knowledgeDocuments.id, id))
      .limit(1);
    return result[0];
  }

  async updateKnowledgeDocument(id: string, updates: Partial<KnowledgeDocument>): Promise<KnowledgeDocument> {
    const result = await db
      .update(knowledgeDocuments)
      .set({ ...updates, updatedAt: new Date() } as any)
      .where(eq(knowledgeDocuments.id, id))
      .returning();
    return result[0];
  }

  async deleteKnowledgeDocument(id: string): Promise<void> {
    const doc = await this.getKnowledgeDocumentById(id);
    if (!doc) return;
    
    await db.delete(knowledgeChunks).where(eq(knowledgeChunks.documentId, id));
    await db.delete(knowledgeDocuments).where(eq(knowledgeDocuments.id, id));
    
    await db
      .update(knowledgeSources)
      .set({ 
        documentCount: sql`GREATEST(${knowledgeSources.documentCount} - 1, 0)`,
        chunkCount: sql`GREATEST(${knowledgeSources.chunkCount} - ${doc.chunkCount}, 0)`,
        updatedAt: new Date() 
      } as any)
      .where(eq(knowledgeSources.id, doc.sourceId));
  }

  async createKnowledgeChunk(chunk: InsertKnowledgeChunk): Promise<KnowledgeChunk> {
    const result = await db
      .insert(knowledgeChunks)
      .values(chunk as any)
      .returning();
    
    await db
      .update(knowledgeDocuments)
      .set({ 
        chunkCount: sql`${knowledgeDocuments.chunkCount} + 1`,
        updatedAt: new Date() 
      } as any)
      .where(eq(knowledgeDocuments.id, chunk.documentId));
    
    await db
      .update(knowledgeSources)
      .set({ 
        chunkCount: sql`${knowledgeSources.chunkCount} + 1`,
        updatedAt: new Date() 
      } as any)
      .where(eq(knowledgeSources.id, chunk.sourceId));
    
    return result[0];
  }

  async getKnowledgeChunks(documentId: string): Promise<KnowledgeChunk[]> {
    return db
      .select()
      .from(knowledgeChunks)
      .where(eq(knowledgeChunks.documentId, documentId))
      .orderBy(knowledgeChunks.chunkIndex);
  }

  async getKnowledgeChunksBySource(sourceId: string): Promise<KnowledgeChunk[]> {
    return db
      .select()
      .from(knowledgeChunks)
      .where(eq(knowledgeChunks.sourceId, sourceId))
      .orderBy(knowledgeChunks.chunkIndex);
  }

  async deleteKnowledgeChunks(documentId: string): Promise<void> {
    const doc = await this.getKnowledgeDocumentById(documentId);
    if (!doc) return;
    
    const chunkCount = doc.chunkCount;
    await db.delete(knowledgeChunks).where(eq(knowledgeChunks.documentId, documentId));
    
    await db
      .update(knowledgeDocuments)
      .set({ chunkCount: 0, updatedAt: new Date() } as any)
      .where(eq(knowledgeDocuments.id, documentId));
    
    await db
      .update(knowledgeSources)
      .set({ 
        chunkCount: sql`GREATEST(${knowledgeSources.chunkCount} - ${chunkCount}, 0)`,
        updatedAt: new Date() 
      } as any)
      .where(eq(knowledgeSources.id, doc.sourceId));
  }

  async searchKnowledgeChunks(workspaceId: string, query: string, limit: number = 10): Promise<KnowledgeChunk[]> {
    const searchTerm = `%${query}%`;
    return db
      .select()
      .from(knowledgeChunks)
      .where(and(
        eq(knowledgeChunks.workspaceId, workspaceId),
        like(knowledgeChunks.content, searchTerm)
      ))
      .limit(limit);
  }

  // Website Scraper (Phase 3)
  async createScrapedWebsite(scrape: InsertScrapedWebsite): Promise<ScrapedWebsite> {
    const [result] = await db
      .insert(scrapedWebsites)
      .values(scrape as any)
      .returning();
    return result;
  }

  async getScrapedWebsites(workspaceId: string, botId?: string): Promise<ScrapedWebsite[]> {
    const conditions = [eq(scrapedWebsites.workspaceId, workspaceId)];
    if (botId) {
      conditions.push(eq(scrapedWebsites.botId, botId));
    }
    return db
      .select()
      .from(scrapedWebsites)
      .where(and(...conditions))
      .orderBy(desc(scrapedWebsites.createdAt));
  }

  async getScrapedWebsiteById(id: string): Promise<ScrapedWebsite | undefined> {
    const [result] = await db
      .select()
      .from(scrapedWebsites)
      .where(eq(scrapedWebsites.id, id));
    return result;
  }

  async updateScrapedWebsite(id: string, updates: Partial<ScrapedWebsite>): Promise<ScrapedWebsite> {
    const [result] = await db
      .update(scrapedWebsites)
      .set({ ...updates, updatedAt: new Date() } as any)
      .where(eq(scrapedWebsites.id, id))
      .returning();
    return result;
  }

  async deleteScrapedWebsite(id: string): Promise<void> {
    await db.delete(scrapedWebsites).where(eq(scrapedWebsites.id, id));
  }

  // =========================================
  // FLAGGED CONVERSATIONS / NEEDS REVIEW
  // =========================================

  async getFlaggedConversations(filters?: { clientId?: string; status?: string; limit?: number }): Promise<ChatSession[]> {
    const conditions = [eq(chatSessions.needsReview, true)];
    
    if (filters?.clientId) {
      conditions.push(eq(chatSessions.clientId, filters.clientId));
    }
    
    // If status is 'pending', only show unreviewed. If 'resolved', show reviewed.
    if (filters?.status === 'pending') {
      conditions.push(sql`${chatSessions.reviewedAt} IS NULL`);
    } else if (filters?.status === 'resolved') {
      conditions.push(sql`${chatSessions.reviewedAt} IS NOT NULL`);
    }
    
    return db
      .select()
      .from(chatSessions)
      .where(and(...conditions))
      .orderBy(desc(chatSessions.startedAt))
      .limit(filters?.limit || 50);
  }

  async getFlaggedConversationsCount(): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(chatSessions)
      .where(and(
        eq(chatSessions.needsReview, true),
        sql`${chatSessions.reviewedAt} IS NULL`
      ));
    return Number(result[0]?.count || 0);
  }

  async markConversationReviewed(sessionId: string, data: { reviewedBy: string; adminNotes?: string; action?: string }): Promise<void> {
    await db
      .update(chatSessions)
      .set({
        reviewedAt: new Date(),
        reviewedBy: data.reviewedBy,
        adminNotes: data.adminNotes || null,
        needsReview: false,
      } as any)
      .where(eq(chatSessions.sessionId, sessionId));
  }

  async dismissFlaggedConversation(sessionId: string, reviewedBy: string): Promise<void> {
    await db
      .update(chatSessions)
      .set({
        needsReview: false,
        reviewedAt: new Date(),
        reviewedBy,
        reviewReason: 'dismissed',
      } as any)
      .where(eq(chatSessions.sessionId, sessionId));
  }

  async getSessionById(sessionId: string): Promise<ChatSession | undefined> {
    const [result] = await db
      .select()
      .from(chatSessions)
      .where(eq(chatSessions.sessionId, sessionId));
    return result;
  }

  // =========================================
  // CLIENT ADMIN NOTES
  // =========================================
  
  // Notes stored in client metadata for simplicity
  async getClientNotes(clientId: string): Promise<AdminNote[]> {
    const [client] = await db
      .select()
      .from(schema.clients)
      .where(eq(schema.clients.id, clientId));
    
    if (!client) return [];
    
    // Notes stored in a separate lightweight approach using clientSettings
    const [settings] = await db
      .select()
      .from(clientSettings)
      .where(eq(clientSettings.clientId, clientId));
    
    const metadata = settings?.metadata as Record<string, any> || {};
    return (metadata.adminNotes || []) as AdminNote[];
  }

  async addClientNote(note: { clientId: string; content: string; category?: string; createdBy: string }): Promise<AdminNote> {
    const newNote: AdminNote = {
      id: `note_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      clientId: note.clientId,
      content: note.content,
      category: note.category,
      createdBy: note.createdBy,
      createdAt: new Date(),
    };
    
    const [settings] = await db
      .select()
      .from(clientSettings)
      .where(eq(clientSettings.clientId, note.clientId));
    
    const metadata = (settings?.metadata as Record<string, any>) || {};
    const existingNotes = (metadata.adminNotes || []) as AdminNote[];
    existingNotes.unshift(newNote);
    
    if (settings) {
      await db
        .update(clientSettings)
        .set({ 
          metadata: { ...metadata, adminNotes: existingNotes } as any,
          updatedAt: new Date() 
        } as any)
        .where(eq(clientSettings.clientId, note.clientId));
    }
    
    return newNote;
  }

  async deleteClientNote(noteId: string): Promise<void> {
    // Get all client settings and find the note
    const allSettings = await db.select().from(clientSettings);
    
    for (const settings of allSettings) {
      const metadata = (settings.metadata as Record<string, any>) || {};
      const notes = (metadata.adminNotes || []) as AdminNote[];
      const noteIndex = notes.findIndex(n => n.id === noteId);
      
      if (noteIndex !== -1) {
        notes.splice(noteIndex, 1);
        await db
          .update(clientSettings)
          .set({ 
            metadata: { ...metadata, adminNotes: notes } as any,
            updatedAt: new Date() 
          } as any)
          .where(eq(clientSettings.id, settings.id));
        return;
      }
    }
  }

  // =========================================
  // NOTIFICATION LOGS
  // =========================================
  
  async createNotificationLog(log: InsertNotificationLog): Promise<NotificationLog> {
    const [created] = await db
      .insert(notificationLogs)
      .values(log as any)
      .returning();
    return created;
  }

  async getNotificationLogs(clientId: string, filters?: {
    type?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ logs: NotificationLog[]; total: number }> {
    const conditions = [eq(notificationLogs.clientId, clientId)];
    
    if (filters?.type) {
      conditions.push(eq(notificationLogs.type, filters.type));
    }
    if (filters?.status) {
      conditions.push(eq(notificationLogs.status, filters.status));
    }

    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(notificationLogs)
      .where(and(...conditions));

    const logs = await db
      .select()
      .from(notificationLogs)
      .where(and(...conditions))
      .orderBy(desc(notificationLogs.createdAt))
      .limit(filters?.limit || 50)
      .offset(filters?.offset || 0);

    return { logs, total: Number(countResult?.count || 0) };
  }
}

export const storage = new DbStorage();

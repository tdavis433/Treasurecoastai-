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
  appointments,
  clientSettings,
  conversationAnalytics,
  adminUsers,
  chatSessions,
  chatAnalyticsEvents,
  dailyAnalytics,
  monthlyUsage,
  leads
} from "@shared/schema";
import { drizzle } from "drizzle-orm/neon-serverless";
import { neonConfig, Pool } from "@neondatabase/serverless";
import { eq, and, gte, lte, or, like, sql, desc } from "drizzle-orm";
import ws from "ws";

neonConfig.webSocketConstructor = ws;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool);

export interface IStorage {
  createAppointment(appointment: InsertAppointment): Promise<Appointment>;
  getAllAppointments(): Promise<Appointment[]>;
  getFilteredAppointments(filters: { 
    status?: string; 
    startDate?: Date; 
    endDate?: Date; 
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ appointments: Appointment[]; total: number }>;
  getAppointmentById(id: string): Promise<Appointment | undefined>;
  updateAppointment(id: string, updates: Partial<Appointment>): Promise<Appointment>;
  updateAppointmentStatus(id: string, status: string): Promise<void>;
  deleteAppointment(id: string): Promise<void>;
  
  getSettings(): Promise<ClientSettings | undefined>;
  updateSettings(settings: Partial<InsertClientSettings>): Promise<ClientSettings>;
  
  logConversation(analytics: InsertConversationAnalytics): Promise<void>;
  getAnalytics(startDate?: Date, endDate?: Date): Promise<ConversationAnalytics[]>;
  getAnalyticsSummary(startDate?: Date, endDate?: Date): Promise<{
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
  getLeadById(id: string): Promise<Lead | undefined>;
  updateLead(id: string, updates: Partial<Lead>): Promise<Lead>;
  deleteLead(id: string): Promise<void>;
  getLeadBySessionId(sessionId: string, clientId: string): Promise<Lead | undefined>;
  
  // Inbox - conversation messages
  getSessionMessages(sessionId: string, clientId: string): Promise<ChatAnalyticsEvent[]>;
  
  // Health check
  healthCheck?(): Promise<{ status: string; latencyMs?: number }>;
}

export class DbStorage implements IStorage {
  async createAppointment(insertAppointment: InsertAppointment): Promise<Appointment> {
    const [appointment] = await db
      .insert(appointments)
      .values({
        ...insertAppointment,
        clientId: 'default-client',
        notes: insertAppointment.notes ?? null,
      })
      .returning();
    return appointment;
  }

  async getAllAppointments(): Promise<Appointment[]> {
    return await db.select().from(appointments).where(eq(appointments.clientId, 'default-client')).orderBy(desc(appointments.createdAt));
  }

  async getFilteredAppointments(filters: { 
    status?: string; 
    startDate?: Date; 
    endDate?: Date; 
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ appointments: Appointment[]; total: number }> {
    const conditions = [eq(appointments.clientId, 'default-client')];
    
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

  async getAppointmentById(id: string): Promise<Appointment | undefined> {
    const [appointment] = await db
      .select()
      .from(appointments)
      .where(and(eq(appointments.id, id), eq(appointments.clientId, 'default-client')))
      .limit(1);
    return appointment;
  }

  async updateAppointment(id: string, updates: Partial<Appointment>): Promise<Appointment> {
    const [updated] = await db
      .update(appointments)
      .set(updates)
      .where(and(eq(appointments.id, id), eq(appointments.clientId, 'default-client')))
      .returning();
    return updated;
  }

  async updateAppointmentStatus(id: string, status: string): Promise<void> {
    await db
      .update(appointments)
      .set({ status })
      .where(and(eq(appointments.id, id), eq(appointments.clientId, 'default-client')));
  }

  async deleteAppointment(id: string): Promise<void> {
    await db.delete(appointments).where(and(eq(appointments.id, id), eq(appointments.clientId, 'default-client')));
  }

  async getSettings(): Promise<ClientSettings | undefined> {
    const [settings] = await db.select().from(clientSettings).where(eq(clientSettings.clientId, 'default-client')).limit(1);
    
    if (!settings) {
      const [created] = await db
        .insert(clientSettings)
        .values({
          clientId: 'default-client',
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

  async updateSettings(updates: Partial<InsertClientSettings>): Promise<ClientSettings> {
    const existing = await this.getSettings();
    
    if (!existing) {
      const defaultValues = await this.getSettings();
      return defaultValues!;
    }
    
    const [updated] = await db
      .update(clientSettings)
      .set({ ...updates, updatedAt: new Date() } as any)
      .where(eq(clientSettings.id, existing.id))
      .returning();
    
    return updated;
  }

  async logConversation(analytics: InsertConversationAnalytics): Promise<void> {
    await db.insert(conversationAnalytics).values({ ...analytics, clientId: 'default-client' });
  }

  async getAnalytics(startDate?: Date, endDate?: Date): Promise<ConversationAnalytics[]> {
    const results = await db.select().from(conversationAnalytics).where(eq(conversationAnalytics.clientId, 'default-client'));
    return results;
  }

  async getAnalyticsSummary(startDate?: Date, endDate?: Date): Promise<{
    totalConversations: number;
    totalAppointments: number;
    conversionRate: number;
    crisisRedirects: number;
    messagesByCategory: { category: string; count: number }[];
    dailyActivity: { date: string; conversations: number; appointments: number }[];
  }> {
    const conditions = [eq(conversationAnalytics.clientId, 'default-client')];
    const appointmentConditions = [eq(appointments.clientId, 'default-client')];
    
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
    const [existing] = await db
      .select()
      .from(monthlyUsage)
      .where(and(
        eq(monthlyUsage.clientId, clientId),
        eq(monthlyUsage.month, month)
      ))
      .limit(1);
    
    if (existing) {
      return existing;
    }
    
    const [created] = await db
      .insert(monthlyUsage)
      .values({
        clientId,
        month,
        messagesUsed: 0,
        leadsCapture: 0,
        automationsTriggered: 0,
      })
      .returning();
    
    return created;
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
      .values(lead)
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

  async getLeadById(id: string): Promise<Lead | undefined> {
    const [lead] = await db
      .select()
      .from(leads)
      .where(eq(leads.id, id))
      .limit(1);
    return lead;
  }

  async updateLead(id: string, updates: Partial<Lead>): Promise<Lead> {
    const [updated] = await db
      .update(leads)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(leads.id, id))
      .returning();
    return updated;
  }

  async deleteLead(id: string): Promise<void> {
    await db.delete(leads).where(eq(leads.id, id));
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

  async getSessionMessages(sessionId: string, clientId: string): Promise<ChatAnalyticsEvent[]> {
    const results = await db
      .select()
      .from(chatAnalyticsEvents)
      .where(and(
        eq(chatAnalyticsEvents.sessionId, sessionId),
        eq(chatAnalyticsEvents.clientId, clientId)
      ))
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
}

export const storage = new DbStorage();

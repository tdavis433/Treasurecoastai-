import { 
  type Appointment, 
  type InsertAppointment, 
  type ClientSettings,
  type InsertClientSettings,
  type ConversationAnalytics,
  type InsertConversationAnalytics,
  type AdminUser,
  appointments,
  clientSettings,
  conversationAnalytics,
  adminUsers
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
      const defaultSettings: InsertClientSettings = {
        businessName: "The Faith House",
        tagline: "Here to support your next step",
        knowledgeBase: {
          about: "The Faith House is a structured sober-living environment designed to support individuals in their recovery journey. We provide safe, structured housing with accountability, mandatory attendance at recovery meetings, established curfews and house rules, chore responsibilities and community living, job search support and employment expectations, and a respectful, supportive community environment.",
          requirements: "Requirements for residents: Maintain complete sobriety (no alcohol or drugs), attend required recovery meetings regularly, respect curfew times, respect all staff and fellow residents, maintain cleanliness in personal and common areas, work or actively seek employment, and follow all house rules and guidelines.",
          pricing: "Pricing covers housing, utilities, and support services. Exact pricing varies and should be confirmed with staff during the application process.",
          application: "Application process typically involves providing personal information, background details, emergency contact, and agreement to follow all house rules and expectations."
        },
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
        primaryColor: "#1FA2A8",
        enableEmailNotifications: false,
        enableSmsNotifications: false
      };
      
      const [created] = await db
        .insert(clientSettings)
        .values({ ...defaultSettings, clientId: 'default-client' })
        .returning();
      return created;
    }
    
    return settings;
  }

  async updateSettings(updates: Partial<InsertClientSettings>): Promise<ClientSettings> {
    const existing = await this.getSettings();
    
    if (!existing) {
      const [created] = await db
        .insert(clientSettings)
        .values({ ...updates, clientId: 'default-client' } as InsertClientSettings)
        .returning();
      return created;
    }
    
    const [updated] = await db
      .update(clientSettings)
      .set({ ...updates, updatedAt: new Date() })
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
}

export const storage = new DbStorage();

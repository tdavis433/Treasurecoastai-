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
import { eq } from "drizzle-orm";
import ws from "ws";

neonConfig.webSocketConstructor = ws;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

export interface IStorage {
  createAppointment(appointment: InsertAppointment): Promise<Appointment>;
  getAllAppointments(): Promise<Appointment[]>;
  updateAppointmentStatus(id: string, status: string): Promise<void>;
  deleteAppointment(id: string): Promise<void>;
  
  getSettings(): Promise<ClientSettings | undefined>;
  updateSettings(settings: Partial<InsertClientSettings>): Promise<ClientSettings>;
  
  logConversation(analytics: InsertConversationAnalytics): Promise<void>;
  getAnalytics(startDate?: Date, endDate?: Date): Promise<ConversationAnalytics[]>;
  
  findAdminByUsername(username: string): Promise<AdminUser | undefined>;
}

export class DbStorage implements IStorage {
  async createAppointment(insertAppointment: InsertAppointment): Promise<Appointment> {
    const [appointment] = await db
      .insert(appointments)
      .values({
        ...insertAppointment,
        notes: insertAppointment.notes ?? null,
      })
      .returning();
    return appointment;
  }

  async getAllAppointments(): Promise<Appointment[]> {
    return await db.select().from(appointments);
  }

  async updateAppointmentStatus(id: string, status: string): Promise<void> {
    await db
      .update(appointments)
      .set({ status })
      .where(eq(appointments.id, id));
  }

  async deleteAppointment(id: string): Promise<void> {
    await db.delete(appointments).where(eq(appointments.id, id));
  }

  async getSettings(): Promise<ClientSettings | undefined> {
    const [settings] = await db.select().from(clientSettings).limit(1);
    
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
        .values(defaultSettings)
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
        .values(updates as InsertClientSettings)
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
    await db.insert(conversationAnalytics).values(analytics);
  }

  async getAnalytics(startDate?: Date, endDate?: Date): Promise<ConversationAnalytics[]> {
    const results = await db.select().from(conversationAnalytics);
    return results;
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

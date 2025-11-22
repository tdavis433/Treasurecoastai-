import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean, integer, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const appointments = pgTable("appointments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar("client_id").notNull().default('default-client'),
  name: text("name").notNull(),
  contact: text("contact").notNull(),
  email: text("email"),
  contactPreference: text("contact_preference").notNull().default("phone"),
  preferredTime: text("preferred_time").notNull(),
  notes: text("notes"),
  status: text("status").notNull().default("new"),
  appointmentType: text("appointment_type").notNull().default("tour"),
  lookingFor: text("looking_for"),
  sobrietyStatus: text("sobriety_status"),
  hasSupport: text("has_support"),
  timeline: text("timeline"),
  conversationSummary: text("conversation_summary"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertAppointmentSchema = createInsertSchema(appointments).omit({
  id: true,
  createdAt: true,
  status: true,
  conversationSummary: true,
  clientId: true,
});

export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;
export type Appointment = typeof appointments.$inferSelect;

export const clientSettings = pgTable("client_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar("client_id").notNull().default('default-client').unique(),
  businessName: text("business_name").notNull().default("The Faith House"),
  tagline: text("tagline").notNull().default("Here to support your next step"),
  
  knowledgeBase: json("knowledge_base").$type<{
    about: string;
    requirements: string;
    pricing: string;
    application: string;
  }>().notNull(),
  
  operatingHours: json("operating_hours").$type<{
    enabled: boolean;
    timezone: string;
    schedule: {
      monday: { open: string; close: string; enabled: boolean };
      tuesday: { open: string; close: string; enabled: boolean };
      wednesday: { open: string; close: string; enabled: boolean };
      thursday: { open: string; close: string; enabled: boolean };
      friday: { open: string; close: string; enabled: boolean };
      saturday: { open: string; close: string; enabled: boolean };
      sunday: { open: string; close: string; enabled: boolean };
    };
    afterHoursMessage: string;
  }>().notNull(),
  
  notificationEmail: text("notification_email"),
  notificationPhone: text("notification_phone"),
  enableEmailNotifications: boolean("enable_email_notifications").notNull().default(false),
  enableSmsNotifications: boolean("enable_sms_notifications").notNull().default(false),
  
  primaryColor: text("primary_color").notNull().default("#1FA2A8"),
  
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertClientSettingsSchema = createInsertSchema(clientSettings).omit({
  id: true,
  updatedAt: true,
  clientId: true,
});

export type InsertClientSettings = z.infer<typeof insertClientSettingsSchema>;
export type ClientSettings = typeof clientSettings.$inferSelect;

export const conversationAnalytics = pgTable("conversation_analytics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar("client_id").notNull().default('default-client'),
  sessionId: varchar("session_id").notNull(),
  role: text("role").notNull(),
  content: text("content").notNull(),
  category: text("category"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertConversationAnalyticsSchema = createInsertSchema(conversationAnalytics).omit({
  id: true,
  createdAt: true,
  clientId: true,
});

export type InsertConversationAnalytics = z.infer<typeof insertConversationAnalyticsSchema>;
export type ConversationAnalytics = typeof conversationAnalytics.$inferSelect;

export const adminUsers = pgTable("admin_users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertAdminUserSchema = createInsertSchema(adminUsers).omit({
  id: true,
  createdAt: true,
});

export type InsertAdminUser = z.infer<typeof insertAdminUserSchema>;
export type AdminUser = typeof adminUsers.$inferSelect;

export const clients = pgTable("clients", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  domain: text("domain"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertClientSchema = createInsertSchema(clients).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertClient = z.infer<typeof insertClientSchema>;
export type Client = typeof clients.$inferSelect;

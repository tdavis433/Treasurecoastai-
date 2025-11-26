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
  
  businessType: text("business_type").default("Sober Living"),
  primaryPhone: text("primary_phone"),
  primaryEmail: text("primary_email"),
  websiteUrl: text("website_url"),
  city: text("city"),
  state: text("state"),
  timezone: text("timezone").default("America/New_York"),
  defaultContactMethod: text("default_contact_method").default("phone"),
  internalNotes: text("internal_notes"),
  status: text("status").notNull().default("active"),
  
  knowledgeBase: json("knowledge_base").$type<{
    about: string;
    requirements: string;
    pricing: string;
    application: string;
  }>().notNull(),
  
  faqEntries: json("faq_entries").$type<Array<{
    id: string;
    category: string;
    question: string;
    answer: string;
    active: boolean;
  }>>().default([]),
  
  longFormKnowledge: json("long_form_knowledge").$type<{
    aboutProgram: string;
    houseRules: string;
    whoItsFor: string;
    paymentInfo: string;
  }>().default({ aboutProgram: '', houseRules: '', whoItsFor: '', paymentInfo: '' }),
  
  appointmentTypesConfig: json("appointment_types_config").$type<Array<{
    id: string;
    label: string;
    description: string;
    durationMinutes: number;
    category: string;
    active: boolean;
  }>>().default([
    { id: 'tour', label: 'Schedule a Tour', description: 'Visit our facility in person', durationMinutes: 30, category: 'lead', active: true },
    { id: 'phone', label: 'Phone Call', description: 'Speak with our team', durationMinutes: 15, category: 'lead', active: true },
    { id: 'family', label: 'Family Info Call', description: 'Information for family members', durationMinutes: 20, category: 'lead', active: true },
  ]),
  
  preIntakeConfig: json("pre_intake_config").$type<Array<{
    id: string;
    label: string;
    internalKey: string;
    type: 'single_choice' | 'multi_choice' | 'text';
    options: Array<{ value: string; label: string }>;
    required: boolean;
    order: number;
    active: boolean;
  }>>().default([
    { id: 'forWho', label: 'Who is this for?', internalKey: 'lookingFor', type: 'single_choice', options: [{ value: 'self', label: 'Myself' }, { value: 'loved_one', label: 'A loved one' }], required: true, order: 1, active: true },
    { id: 'sobriety', label: 'What is your current sobriety status?', internalKey: 'sobrietyStatus', type: 'single_choice', options: [{ value: 'sober', label: 'Currently sober' }, { value: 'in_treatment', label: 'In treatment' }, { value: 'seeking', label: 'Seeking help' }], required: true, order: 2, active: true },
    { id: 'support', label: 'Do you have financial support?', internalKey: 'hasSupport', type: 'single_choice', options: [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }, { value: 'partial', label: 'Partial' }], required: true, order: 3, active: true },
    { id: 'timeline', label: 'When are you looking to move in?', internalKey: 'timeline', type: 'single_choice', options: [{ value: 'immediately', label: 'Immediately' }, { value: 'this_week', label: 'This week' }, { value: 'this_month', label: 'This month' }, { value: 'exploring', label: 'Just exploring' }], required: true, order: 4, active: true },
  ]),
  
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
  
  notificationSettings: json("notification_settings").$type<{
    staffEmails: string[];
    staffPhones: string[];
    staffChannelPreference: 'email_only' | 'sms_only' | 'email_and_sms';
    eventToggles: {
      newAppointmentEmail: boolean;
      newAppointmentSms: boolean;
      newPreIntakeEmail: boolean;
      sameDayReminder: boolean;
    };
    templates: {
      staffEmailSubject: string;
      staffEmailBody: string;
    };
  }>().default({
    staffEmails: [],
    staffPhones: [],
    staffChannelPreference: 'email_only',
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
  }),
  
  logoUrl: text("logo_url"),
  primaryColor: text("primary_color").notNull().default("#1FA2A8"),
  accentColor: text("accent_color").notNull().default("#F59E0B"),
  
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

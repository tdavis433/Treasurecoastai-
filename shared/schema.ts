import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean, integer, json, index } from "drizzle-orm/pg-core";
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
}, (table) => ({
  clientIdIdx: index("appointments_client_id_idx").on(table.clientId),
  statusIdx: index("appointments_status_idx").on(table.status),
  createdAtIdx: index("appointments_created_at_idx").on(table.createdAt),
}));

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
  role: text("role").notNull().default("client_admin"),
  clientId: varchar("client_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertAdminUserSchema = createInsertSchema(adminUsers).omit({
  id: true,
  createdAt: true,
});

export type InsertAdminUser = z.infer<typeof insertAdminUserSchema>;
export type AdminUser = typeof adminUsers.$inferSelect;
export type AdminRole = 'super_admin' | 'client_admin';

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

// Analytics tables for multi-tenant tracking
export const chatSessions = pgTable("chat_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").notNull(),
  clientId: varchar("client_id").notNull(),
  botId: varchar("bot_id").notNull(),
  startedAt: timestamp("started_at").defaultNow().notNull(),
  endedAt: timestamp("ended_at"),
  userMessageCount: integer("user_message_count").notNull().default(0),
  botMessageCount: integer("bot_message_count").notNull().default(0),
  totalResponseTimeMs: integer("total_response_time_ms").notNull().default(0),
  crisisDetected: boolean("crisis_detected").notNull().default(false),
  appointmentRequested: boolean("appointment_requested").notNull().default(false),
  topics: json("topics").$type<string[]>().default([]),
  metadata: json("metadata").$type<Record<string, any>>().default({}),
}, (table) => ({
  sessionIdIdx: index("chat_sessions_session_id_idx").on(table.sessionId),
  clientIdIdx: index("chat_sessions_client_id_idx").on(table.clientId),
  botIdIdx: index("chat_sessions_bot_id_idx").on(table.botId),
  startedAtIdx: index("chat_sessions_started_at_idx").on(table.startedAt),
}));

export const insertChatSessionSchema = createInsertSchema(chatSessions).omit({
  id: true,
});

export type InsertChatSession = z.infer<typeof insertChatSessionSchema>;
export type ChatSession = typeof chatSessions.$inferSelect;

export const chatAnalyticsEvents = pgTable("chat_analytics_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar("client_id").notNull(),
  botId: varchar("bot_id").notNull(),
  sessionId: varchar("session_id").notNull(),
  eventType: text("event_type").notNull(), // 'message', 'crisis', 'appointment', 'error'
  actor: text("actor").notNull(), // 'user' or 'bot'
  messageContent: text("message_content"),
  category: text("category"), // topic category
  responseTimeMs: integer("response_time_ms"),
  metadata: json("metadata").$type<Record<string, any>>().default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  clientIdIdx: index("chat_events_client_id_idx").on(table.clientId),
  sessionIdIdx: index("chat_events_session_id_idx").on(table.sessionId),
  eventTypeIdx: index("chat_events_event_type_idx").on(table.eventType),
  createdAtIdx: index("chat_events_created_at_idx").on(table.createdAt),
}));

export const insertChatAnalyticsEventSchema = createInsertSchema(chatAnalyticsEvents).omit({
  id: true,
  createdAt: true,
});

export type InsertChatAnalyticsEvent = z.infer<typeof insertChatAnalyticsEventSchema>;
export type ChatAnalyticsEvent = typeof chatAnalyticsEvents.$inferSelect;

export const dailyAnalytics = pgTable("daily_analytics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  date: text("date").notNull(), // YYYY-MM-DD format
  clientId: varchar("client_id").notNull(),
  botId: varchar("bot_id").notNull(),
  totalConversations: integer("total_conversations").notNull().default(0),
  totalMessages: integer("total_messages").notNull().default(0),
  userMessages: integer("user_messages").notNull().default(0),
  botMessages: integer("bot_messages").notNull().default(0),
  avgResponseTimeMs: integer("avg_response_time_ms").notNull().default(0),
  avgConversationLength: integer("avg_conversation_length").notNull().default(0),
  crisisEvents: integer("crisis_events").notNull().default(0),
  appointmentRequests: integer("appointment_requests").notNull().default(0),
  topicBreakdown: json("topic_breakdown").$type<Record<string, number>>().default({}),
  peakHour: integer("peak_hour"), // 0-23
  uniqueUsers: integer("unique_users").notNull().default(0),
});

export const insertDailyAnalyticsSchema = createInsertSchema(dailyAnalytics).omit({
  id: true,
});

export type InsertDailyAnalytics = z.infer<typeof insertDailyAnalyticsSchema>;
export type DailyAnalytics = typeof dailyAnalytics.$inferSelect;

// Monthly usage tracking for plan limits
export const monthlyUsage = pgTable("monthly_usage", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar("client_id").notNull(),
  month: text("month").notNull(), // YYYY-MM format
  messagesUsed: integer("messages_used").notNull().default(0),
  leadsCapture: integer("leads_captured").notNull().default(0),
  automationsTriggered: integer("automations_triggered").notNull().default(0),
  lastUpdated: timestamp("last_updated").defaultNow().notNull(),
}, (table) => ({
  clientIdMonthIdx: index("monthly_usage_client_month_idx").on(table.clientId, table.month),
}));

export const insertMonthlyUsageSchema = createInsertSchema(monthlyUsage).omit({
  id: true,
  lastUpdated: true,
});

export type InsertMonthlyUsage = z.infer<typeof insertMonthlyUsageSchema>;
export type MonthlyUsage = typeof monthlyUsage.$inferSelect;

// Plan tier definitions
export const PLAN_TIERS = {
  free: {
    name: 'Free',
    messagesPerMonth: 100,
    leadsPerMonth: 10,
    automationsEnabled: false,
    widgetEnabled: true,
    analyticsRetentionDays: 7,
    price: 0,
  },
  starter: {
    name: 'Starter',
    messagesPerMonth: 1000,
    leadsPerMonth: 50,
    automationsEnabled: true,
    widgetEnabled: true,
    analyticsRetentionDays: 30,
    price: 29,
  },
  pro: {
    name: 'Pro',
    messagesPerMonth: 10000,
    leadsPerMonth: 500,
    automationsEnabled: true,
    widgetEnabled: true,
    analyticsRetentionDays: 90,
    price: 99,
  },
  enterprise: {
    name: 'Enterprise',
    messagesPerMonth: -1, // Unlimited
    leadsPerMonth: -1,
    automationsEnabled: true,
    widgetEnabled: true,
    analyticsRetentionDays: 365,
    price: 299,
  },
} as const;

export type PlanTier = keyof typeof PLAN_TIERS;

// Leads table for capturing and managing leads from chat
export const leads = pgTable("leads", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar("client_id").notNull(),
  botId: varchar("bot_id").notNull(),
  sessionId: varchar("session_id"),
  
  // Contact info
  name: text("name"),
  email: text("email"),
  phone: text("phone"),
  
  // Lead details
  source: text("source").notNull().default("chat"), // chat, widget, manual
  status: text("status").notNull().default("new"), // new, contacted, qualified, converted, lost
  priority: text("priority").notNull().default("medium"), // low, medium, high
  
  // Additional context
  notes: text("notes"),
  tags: json("tags").$type<string[]>().default([]),
  metadata: json("metadata").$type<Record<string, any>>().default({}),
  
  // Chat context
  conversationPreview: text("conversation_preview"),
  messageCount: integer("message_count").default(0),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  lastContactedAt: timestamp("last_contacted_at"),
}, (table) => ({
  clientIdIdx: index("leads_client_id_idx").on(table.clientId),
  statusIdx: index("leads_status_idx").on(table.status),
  priorityIdx: index("leads_priority_idx").on(table.priority),
  createdAtIdx: index("leads_created_at_idx").on(table.createdAt),
}));

export const insertLeadSchema = createInsertSchema(leads).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertLead = z.infer<typeof insertLeadSchema>;
export type Lead = typeof leads.$inferSelect;

// Audit logs for tracking admin actions
export const auditLogs = pgTable("audit_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  username: text("username").notNull(),
  action: text("action").notNull(), // 'create', 'update', 'delete', 'login', 'logout'
  resourceType: text("resource_type").notNull(), // 'bot', 'client', 'appointment', 'lead', 'settings'
  resourceId: varchar("resource_id"),
  clientId: varchar("client_id"),
  details: json("details").$type<Record<string, any>>().default({}),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("audit_logs_user_id_idx").on(table.userId),
  actionIdx: index("audit_logs_action_idx").on(table.action),
  resourceTypeIdx: index("audit_logs_resource_type_idx").on(table.resourceType),
  clientIdIdx: index("audit_logs_client_id_idx").on(table.clientId),
  createdAtIdx: index("audit_logs_created_at_idx").on(table.createdAt),
}));

export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({
  id: true,
  createdAt: true,
});

export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type AuditLog = typeof auditLogs.$inferSelect;

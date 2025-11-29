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

// ============================================================================
// WORKSPACE & MULTI-TENANT TABLES
// ============================================================================

// Industry/Bot types for feature scoping
export const BOT_TYPES = [
  'sober_living',
  'restaurant', 
  'barber',
  'gym',
  'auto_shop',
  'home_services',
  'tattoo_studio',
  'real_estate',
  'med_spa',
  'generic'
] as const;

export type BotType = typeof BOT_TYPES[number];

// Workspace roles
export const WORKSPACE_ROLES = ['owner', 'manager', 'staff', 'agent'] as const;
export type WorkspaceRole = typeof WORKSPACE_ROLES[number];

// Workspaces table - Each business is a workspace
export const workspaces = pgTable("workspaces", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  ownerId: varchar("owner_id").notNull(), // References adminUsers.id
  
  // Plan & billing
  plan: text("plan").notNull().default("free"), // free, starter, pro, enterprise
  stripeCustomerId: varchar("stripe_customer_id"),
  stripeSubscriptionId: varchar("stripe_subscription_id"),
  
  // Status
  status: text("status").notNull().default("active"), // active, paused, suspended, cancelled
  
  // Settings (JSONB for flexibility)
  settings: json("settings").$type<{
    timezone?: string;
    defaultLanguage?: string;
    brandColor?: string;
    logoUrl?: string;
    notificationEmail?: string;
    notificationPhone?: string;
  }>().default({}),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  slugIdx: index("workspaces_slug_idx").on(table.slug),
  ownerIdx: index("workspaces_owner_id_idx").on(table.ownerId),
  statusIdx: index("workspaces_status_idx").on(table.status),
}));

export const insertWorkspaceSchema = createInsertSchema(workspaces).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertWorkspace = z.infer<typeof insertWorkspaceSchema>;
export type Workspace = typeof workspaces.$inferSelect;

// Workspace memberships - Links users to workspaces with roles
export const workspaceMemberships = pgTable("workspace_memberships", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  workspaceId: varchar("workspace_id").notNull(),
  userId: varchar("user_id").notNull(), // References adminUsers.id
  role: text("role").notNull().default("staff"), // owner, manager, staff, agent
  
  // Invitation tracking
  invitedBy: varchar("invited_by"),
  invitedAt: timestamp("invited_at").defaultNow().notNull(),
  acceptedAt: timestamp("accepted_at"),
  
  // Status
  status: text("status").notNull().default("active"), // active, pending, revoked
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  workspaceUserIdx: index("memberships_workspace_user_idx").on(table.workspaceId, table.userId),
  userIdx: index("memberships_user_id_idx").on(table.userId),
}));

export const insertWorkspaceMembershipSchema = createInsertSchema(workspaceMemberships).omit({
  id: true,
  createdAt: true,
  invitedAt: true,
});

export type InsertWorkspaceMembership = z.infer<typeof insertWorkspaceMembershipSchema>;
export type WorkspaceMembership = typeof workspaceMemberships.$inferSelect;

// Bots table - Full bot configuration (replaces JSON files)
export const bots = pgTable("bots", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  workspaceId: varchar("workspace_id").notNull(),
  botId: varchar("bot_id").notNull().unique(), // Human-readable ID like 'faith_house_main'
  
  // Basic info
  name: text("name").notNull(),
  description: text("description"),
  botType: text("bot_type").notNull().default("generic"), // Industry type for feature scoping
  
  // Business profile (JSONB)
  businessProfile: json("business_profile").$type<{
    businessName: string;
    type: string;
    location?: string;
    phone?: string;
    email?: string;
    website?: string;
    hours?: Record<string, string>;
    services?: string[];
    amenities?: string[];
    cuisine?: string; // Restaurant-specific
    [key: string]: any;
  }>().notNull(),
  
  // AI configuration
  systemPrompt: text("system_prompt").notNull(),
  
  // Theme/appearance
  theme: json("theme").$type<{
    primaryColor?: string;
    accentColor?: string;
    headerGradient?: string;
    fontFamily?: string;
    avatarUrl?: string;
    welcomeMessage?: string;
  }>().default({}),
  
  // Status
  status: text("status").notNull().default("active"), // active, paused, draft
  isDemo: boolean("is_demo").notNull().default(false),
  
  // Metadata
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  workspaceIdx: index("bots_workspace_id_idx").on(table.workspaceId),
  botIdIdx: index("bots_bot_id_idx").on(table.botId),
  botTypeIdx: index("bots_bot_type_idx").on(table.botType),
  statusIdx: index("bots_status_idx").on(table.status),
}));

export const insertBotSchema = createInsertSchema(bots).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertBot = z.infer<typeof insertBotSchema>;
export type Bot = typeof bots.$inferSelect;

// Bot settings - FAQs, rules, automations (separate for easier updates)
export const botSettings = pgTable("bot_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  botId: varchar("bot_id").notNull().unique(), // References bots.botId
  
  // FAQs
  faqs: json("faqs").$type<Array<{
    id?: string;
    question: string;
    answer: string;
    category?: string;
    active?: boolean;
  }>>().default([]),
  
  // Rules
  rules: json("rules").$type<{
    allowedTopics?: string[];
    forbiddenTopics?: string[];
    specialInstructions?: string[];
    crisisHandling?: {
      onCrisisKeywords?: string[];
      responseTemplate?: string;
    };
  }>().default({}),
  
  // Automations V1 config
  automations: json("automations").$type<{
    officeHours?: {
      schedule?: Record<string, { open: string; close: string }>;
      timezone?: string;
      afterHoursMessage?: string;
      enableAfterHoursMode?: boolean;
    };
    leadCapture?: {
      enabled?: boolean;
      triggerKeywords?: string[];
      captureFields?: string[];
      successMessage?: string;
    };
    keywordTriggers?: Array<{
      id?: string;
      type?: string;
      enabled?: boolean;
      keywords?: string[];
      response?: string;
    }>;
  }>().default({}),
  
  // Tone & personality settings
  personality: json("personality").$type<{
    tone?: 'professional' | 'friendly' | 'casual' | 'compassionate' | 'informative';
    responseLength?: 'brief' | 'medium' | 'detailed';
    formality?: number; // 0-100 slider
    enthusiasm?: number;
    humor?: number;
    warmth?: number;
  }>().default({}),
  
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  botIdIdx: index("bot_settings_bot_id_idx").on(table.botId),
}));

export const insertBotSettingsSchema = createInsertSchema(botSettings).omit({
  id: true,
  updatedAt: true,
});

export type InsertBotSettings = z.infer<typeof insertBotSettingsSchema>;
export type BotSettings = typeof botSettings.$inferSelect;

// Bot templates - Industry templates for bot creation wizard
export const botTemplates = pgTable("bot_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Template identification
  templateId: varchar("template_id").notNull().unique(), // e.g., 'restaurant_template'
  name: text("name").notNull(),
  description: text("description"),
  botType: text("bot_type").notNull(), // Industry type
  
  // Icon/visual
  icon: text("icon"), // Lucide icon name
  previewImage: text("preview_image"),
  
  // Default configuration (JSONB)
  defaultConfig: json("default_config").$type<{
    businessProfile: Record<string, any>;
    systemPrompt: string;
    faqs: Array<{ question: string; answer: string }>;
    rules: Record<string, any>;
    automations: Record<string, any>;
    theme: Record<string, any>;
    personality: Record<string, any>;
  }>().notNull(),
  
  // Template metadata
  isActive: boolean("is_active").notNull().default(true),
  displayOrder: integer("display_order").notNull().default(0),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  botTypeIdx: index("bot_templates_bot_type_idx").on(table.botType),
  activeIdx: index("bot_templates_active_idx").on(table.isActive),
}));

export const insertBotTemplateSchema = createInsertSchema(botTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertBotTemplate = z.infer<typeof insertBotTemplateSchema>;
export type BotTemplate = typeof botTemplates.$inferSelect;

// =============================================
// PHASE 4: AUTOMATIONS V2 TABLES
// =============================================

// Automation workflows - Main automation definitions
export const automationWorkflows = pgTable("automation_workflows", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  botId: varchar("bot_id").notNull(), // References bots.botId
  
  // Workflow identification
  name: text("name").notNull(),
  description: text("description"),
  
  // Trigger configuration
  triggerType: text("trigger_type").notNull(), // keyword, schedule, inactivity, message_count, lead_captured, appointment_booked
  triggerConfig: json("trigger_config").$type<{
    keywords?: string[];
    matchType?: 'exact' | 'contains' | 'regex';
    schedule?: string; // cron expression
    inactivityMinutes?: number;
    messageCountThreshold?: number;
    eventType?: string;
  }>().default({}),
  
  // Entry conditions (all must match for workflow to trigger)
  conditions: json("conditions").$type<Array<{
    id: string;
    field: string; // e.g., 'session.messageCount', 'time.hour', 'message.content'
    operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'matches_regex' | 'in_list';
    value: string | number | string[];
    groupId?: string; // For OR grouping within conditions
  }>>().default([]),
  
  // Actions to execute (in order)
  actions: json("actions").$type<Array<{
    id: string;
    type: 'send_message' | 'capture_lead' | 'tag_session' | 'notify_staff' | 'send_email' | 'delay' | 'set_variable';
    order: number;
    config: {
      message?: string;
      delay?: number; // seconds
      template?: string;
      channel?: 'chat' | 'email' | 'sms';
      tags?: string[];
      variable?: { name: string; value: string };
    };
  }>>().default([]),
  
  // Execution controls
  status: text("status").notNull().default("active"), // active, paused, draft
  priority: integer("priority").notNull().default(10), // Higher = evaluated first
  throttleSeconds: integer("throttle_seconds").default(0), // Min seconds between triggers
  maxExecutionsPerSession: integer("max_executions_per_session"), // Null = unlimited
  
  // Schedule-specific settings
  scheduleTimezone: text("schedule_timezone").default("America/New_York"),
  nextScheduledRun: timestamp("next_scheduled_run"),
  lastScheduledRun: timestamp("last_scheduled_run"),
  
  // Metadata
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  botIdIdx: index("automation_workflows_bot_id_idx").on(table.botId),
  statusIdx: index("automation_workflows_status_idx").on(table.status),
  triggerTypeIdx: index("automation_workflows_trigger_type_idx").on(table.triggerType),
}));

export const insertAutomationWorkflowSchema = createInsertSchema(automationWorkflows).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertAutomationWorkflow = z.infer<typeof insertAutomationWorkflowSchema>;
export type AutomationWorkflow = typeof automationWorkflows.$inferSelect;

// Automation execution logs - Track workflow runs
export const automationRuns = pgTable("automation_runs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  workflowId: varchar("workflow_id").notNull(), // References automationWorkflows.id
  botId: varchar("bot_id").notNull(),
  sessionId: varchar("session_id"),
  
  // Execution details
  triggeredAt: timestamp("triggered_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
  status: text("status").notNull().default("running"), // running, completed, failed, skipped
  
  // Context that triggered the workflow
  triggerContext: json("trigger_context").$type<{
    message?: string;
    messageCount?: number;
    triggerType?: string;
    matchedKeywords?: string[];
    scheduledTime?: string;
  }>().default({}),
  
  // Results
  actionsExecuted: integer("actions_executed").default(0),
  result: json("result").$type<{
    success: boolean;
    response?: string;
    error?: string;
    actionsResults?: Array<{
      actionId: string;
      success: boolean;
      output?: any;
    }>;
  }>().default({ success: false }),
  
  // Error tracking
  errorMessage: text("error_message"),
}, (table) => ({
  workflowIdIdx: index("automation_runs_workflow_id_idx").on(table.workflowId),
  botIdIdx: index("automation_runs_bot_id_idx").on(table.botId),
  sessionIdIdx: index("automation_runs_session_id_idx").on(table.sessionId),
  triggeredAtIdx: index("automation_runs_triggered_at_idx").on(table.triggeredAt),
  statusIdx: index("automation_runs_status_idx").on(table.status),
}));

export const insertAutomationRunSchema = createInsertSchema(automationRuns).omit({
  id: true,
});

export type InsertAutomationRun = z.infer<typeof insertAutomationRunSchema>;
export type AutomationRun = typeof automationRuns.$inferSelect;

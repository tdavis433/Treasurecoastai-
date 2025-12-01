import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean, integer, json, index, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const appointments = pgTable("appointments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar("client_id").notNull(),
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
  clientId: varchar("client_id").notNull().unique(),
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
  
  // External integrations - allow clients to link their existing systems
  externalBookingUrl: text("external_booking_url"), // Client's existing booking system (Calendly, Acuity, etc.)
  externalPaymentUrl: text("external_payment_url"), // Client's existing payment page (Square, PayPal, etc.)
  
  // Webhook configuration for real-time event delivery to client's systems
  webhookUrl: text("webhook_url"), // Endpoint to receive webhook events
  webhookSecret: text("webhook_secret"), // HMAC secret for verifying webhook signatures
  webhookEvents: json("webhook_events").$type<{
    newLead: boolean;
    newAppointment: boolean;
    chatSessionStart: boolean;
    chatSessionEnd: boolean;
    leadStatusChange: boolean;
  }>().default({
    newLead: true,
    newAppointment: true,
    chatSessionStart: false,
    chatSessionEnd: false,
    leadStatusChange: false,
  }),
  webhookEnabled: boolean("webhook_enabled").notNull().default(false),
  
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
  clientId: varchar("client_id").notNull(),
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
  clientIdMonthUnique: unique("monthly_usage_client_month_unique").on(table.clientId, table.month),
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
  
  // Quick action buttons for chat widget
  quickActions: json("quick_actions").$type<Array<{
    id: string;
    label: string;
    labelEs?: string;
    prompt?: string;
  }>>().default([]),
  
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

// =============================================
// PHASE 5: WIDGET SETTINGS
// =============================================

// Widget settings - Customizable widget appearance and behavior per bot
export const widgetSettings = pgTable("widget_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  botId: varchar("bot_id").notNull().unique(), // One widget config per bot
  
  // Appearance
  position: text("position").notNull().default("bottom-right"), // bottom-left, bottom-right
  theme: text("theme").notNull().default("dark"), // light, dark, auto
  primaryColor: text("primary_color").notNull().default("#2563eb"),
  accentColor: text("accent_color"),
  avatarUrl: text("avatar_url"), // Custom avatar image URL
  bubbleSize: text("bubble_size").notNull().default("medium"), // small, medium, large
  windowWidth: integer("window_width").default(360), // Widget window width in pixels
  windowHeight: integer("window_height").default(520), // Widget window height in pixels
  borderRadius: integer("border_radius").default(16), // Corner radius
  
  // Branding
  showPoweredBy: boolean("show_powered_by").notNull().default(true),
  headerTitle: text("header_title"), // Custom header title (defaults to bot name)
  headerSubtitle: text("header_subtitle").default("Online"), // Status text
  
  // Welcome & Messages
  welcomeMessage: text("welcome_message"), // Custom welcome message
  placeholderText: text("placeholder_text").default("Type your message..."),
  offlineMessage: text("offline_message").default("We're currently offline. Leave a message!"),
  
  // Behavior
  autoOpen: boolean("auto_open").notNull().default(false),
  autoOpenDelay: integer("auto_open_delay").default(5), // Seconds before auto-open
  autoOpenOnce: boolean("auto_open_once").notNull().default(true), // Only auto-open once per session
  soundEnabled: boolean("sound_enabled").notNull().default(false),
  soundUrl: text("sound_url"), // Custom notification sound URL
  
  // Mobile settings
  mobileFullscreen: boolean("mobile_fullscreen").notNull().default(true),
  mobileBreakpoint: integer("mobile_breakpoint").default(480), // Pixels
  
  // Advanced
  customCss: text("custom_css"), // Custom CSS overrides
  advanced: json("advanced").$type<{
    hideOnPages?: string[];
    showOnPages?: string[];
    triggerSelector?: string;
    zIndex?: number;
  }>().default({}),
  
  // Metadata
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  botIdIdx: index("widget_settings_bot_id_idx").on(table.botId),
}));

export const insertWidgetSettingsSchema = createInsertSchema(widgetSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertWidgetSettings = z.infer<typeof insertWidgetSettingsSchema>;
export type WidgetSettings = typeof widgetSettings.$inferSelect;

// =============================================
// PHASE 6: CONVERSATION NOTES & SESSION STATES
// =============================================

// Conversation notes - Internal notes on chat sessions for agent collaboration
export const conversationNotes = pgTable("conversation_notes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").notNull(),
  clientId: varchar("client_id").notNull(),
  botId: varchar("bot_id").notNull(),
  
  // Note content
  content: text("content").notNull(),
  
  // Author tracking
  authorId: varchar("author_id").notNull(), // User ID who created the note
  authorName: varchar("author_name"), // Display name for convenience
  
  // Metadata
  isPinned: boolean("is_pinned").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  sessionIdIdx: index("conversation_notes_session_id_idx").on(table.sessionId),
  clientIdIdx: index("conversation_notes_client_id_idx").on(table.clientId),
  botIdIdx: index("conversation_notes_bot_id_idx").on(table.botId),
  authorIdIdx: index("conversation_notes_author_id_idx").on(table.authorId),
}));

export const insertConversationNoteSchema = createInsertSchema(conversationNotes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertConversationNote = z.infer<typeof insertConversationNoteSchema>;
export type ConversationNote = typeof conversationNotes.$inferSelect;

// Session states - Track read/unread status and workflow state for inbox
export const sessionStates = pgTable("session_states", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").notNull().unique(),
  clientId: varchar("client_id").notNull(),
  botId: varchar("bot_id").notNull(),
  
  // Status tracking
  status: text("status").notNull().default("open"), // open, in_progress, resolved, closed
  isRead: boolean("is_read").notNull().default(false),
  readAt: timestamp("read_at"),
  readByUserId: varchar("read_by_user_id"),
  
  // Assignment
  assignedToUserId: varchar("assigned_to_user_id"),
  assignedAt: timestamp("assigned_at"),
  
  // Priority and tags
  priority: text("priority").default("normal"), // low, normal, high, urgent
  tags: text("tags").array().default(sql`ARRAY[]::text[]`),
  
  // Metadata
  lastActivityAt: timestamp("last_activity_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  sessionIdIdx: index("session_states_session_id_idx").on(table.sessionId),
  clientIdIdx: index("session_states_client_id_idx").on(table.clientId),
  botIdIdx: index("session_states_bot_id_idx").on(table.botId),
  statusIdx: index("session_states_status_idx").on(table.status),
  isReadIdx: index("session_states_is_read_idx").on(table.isRead),
  assignedToIdx: index("session_states_assigned_to_idx").on(table.assignedToUserId),
}));

export const insertSessionStateSchema = createInsertSchema(sessionStates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertSessionState = z.infer<typeof insertSessionStateSchema>;
export type SessionState = typeof sessionStates.$inferSelect;

// =============================================
// SUPER ADMIN: SYSTEM LOGS
// =============================================

// System logs - Platform-wide event and error logging for super admin
export const systemLogs = pgTable("system_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Log classification
  level: text("level").notNull().default("info"), // debug, info, warn, error, critical
  source: text("source").notNull(), // Route or component: api/chat, stripe/webhook, auth, system, etc.
  
  // Context
  workspaceId: varchar("workspace_id"), // Nullable - for workspace-specific logs
  clientId: varchar("client_id"), // Nullable - for client-specific logs
  userId: varchar("user_id"), // Nullable - for user-specific logs
  sessionId: varchar("session_id"), // Nullable - for session-specific logs
  
  // Log content
  message: text("message").notNull(),
  details: json("details").$type<Record<string, any>>().default({}),
  
  // Error tracking
  errorCode: varchar("error_code"),
  stackTrace: text("stack_trace"),
  
  // Request context
  requestMethod: varchar("request_method"), // GET, POST, etc.
  requestPath: varchar("request_path"),
  ipAddress: varchar("ip_address"),
  userAgent: text("user_agent"),
  
  // Resolution tracking
  isResolved: boolean("is_resolved").notNull().default(false),
  resolvedAt: timestamp("resolved_at"),
  resolvedBy: varchar("resolved_by"),
  resolutionNotes: text("resolution_notes"),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  levelIdx: index("system_logs_level_idx").on(table.level),
  sourceIdx: index("system_logs_source_idx").on(table.source),
  workspaceIdIdx: index("system_logs_workspace_id_idx").on(table.workspaceId),
  clientIdIdx: index("system_logs_client_id_idx").on(table.clientId),
  createdAtIdx: index("system_logs_created_at_idx").on(table.createdAt),
  isResolvedIdx: index("system_logs_is_resolved_idx").on(table.isResolved),
}));

export const insertSystemLogSchema = createInsertSchema(systemLogs).omit({
  id: true,
  createdAt: true,
});

export type InsertSystemLog = z.infer<typeof insertSystemLogSchema>;
export type SystemLog = typeof systemLogs.$inferSelect;

// =============================================
// UNIFIED CONVERSATION MODEL (Phase 1A)
// =============================================

// Channels - Define communication channel types
export const channels = pgTable("channels", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  workspaceId: varchar("workspace_id").notNull(),
  
  // Channel type: chat, email, facebook, instagram, whatsapp, sms
  type: text("type").notNull(),
  name: text("name").notNull(),
  
  // Connection config (OAuth tokens, API keys, etc.)
  config: json("config").$type<{
    provider?: string;
    credentials?: Record<string, string>;
    webhookUrl?: string;
    pageId?: string;
    phoneNumber?: string;
    emailAddress?: string;
    [key: string]: any;
  }>().default({}),
  
  // Status: active, paused, disconnected, error
  status: text("status").notNull().default("active"),
  lastSyncAt: timestamp("last_sync_at"),
  errorMessage: text("error_message"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  workspaceIdx: index("channels_workspace_id_idx").on(table.workspaceId),
  typeIdx: index("channels_type_idx").on(table.type),
  statusIdx: index("channels_status_idx").on(table.status),
}));

export const insertChannelSchema = createInsertSchema(channels).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertChannel = z.infer<typeof insertChannelSchema>;
export type Channel = typeof channels.$inferSelect;

// Conversations - Unified conversation model
export const conversations = pgTable("conversations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  workspaceId: varchar("workspace_id").notNull(),
  botId: varchar("bot_id"),
  channelId: varchar("channel_id").notNull(),
  
  // External IDs for channel-specific tracking
  externalId: varchar("external_id"),
  
  // Contact info (visitor/customer)
  contactId: varchar("contact_id"),
  contactName: text("contact_name"),
  contactEmail: text("contact_email"),
  contactPhone: text("contact_phone"),
  contactAvatar: text("contact_avatar"),
  
  // Conversation metadata
  subject: text("subject"),
  tags: text("tags").array().default([]),
  priority: text("priority").notNull().default("normal"), // low, normal, high, urgent
  
  // Status: open, pending, resolved, closed
  status: text("status").notNull().default("open"),
  
  // Assignment
  assignedAgentId: varchar("assigned_agent_id"),
  assignedTeam: text("assigned_team"),
  
  // AI/Bot handling
  isHandledByBot: boolean("is_handled_by_bot").notNull().default(true),
  botHandoffReason: text("bot_handoff_reason"),
  
  // Metrics
  messageCount: integer("message_count").notNull().default(0),
  firstResponseAt: timestamp("first_response_at"),
  resolvedAt: timestamp("resolved_at"),
  
  // CSAT
  csatScore: integer("csat_score"),
  csatFeedback: text("csat_feedback"),
  
  // Context for AI
  aiContext: json("ai_context").$type<{
    summary?: string;
    sentiment?: string;
    topics?: string[];
    userIntent?: string;
    previousInteractions?: number;
    [key: string]: any;
  }>().default({}),
  
  // Custom fields
  customFields: json("custom_fields").$type<Record<string, any>>().default({}),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  lastMessageAt: timestamp("last_message_at"),
}, (table) => ({
  workspaceIdx: index("conversations_workspace_id_idx").on(table.workspaceId),
  botIdx: index("conversations_bot_id_idx").on(table.botId),
  channelIdx: index("conversations_channel_id_idx").on(table.channelId),
  statusIdx: index("conversations_status_idx").on(table.status),
  assignedIdx: index("conversations_assigned_agent_id_idx").on(table.assignedAgentId),
  contactIdx: index("conversations_contact_id_idx").on(table.contactId),
  lastMessageIdx: index("conversations_last_message_at_idx").on(table.lastMessageAt),
}));

export const insertConversationSchema = createInsertSchema(conversations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  messageCount: true,
});

export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type Conversation = typeof conversations.$inferSelect;

// Conversation Messages - Individual messages
export const conversationMessages = pgTable("conversation_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  conversationId: varchar("conversation_id").notNull(),
  
  // Sender info
  senderType: text("sender_type").notNull(), // user, bot, agent, system
  senderId: varchar("sender_id"),
  senderName: text("sender_name"),
  senderAvatar: text("sender_avatar"),
  
  // Message content
  content: text("content").notNull(),
  contentType: text("content_type").notNull().default("text"), // text, html, markdown, rich
  
  // Rich content (cards, buttons, etc.)
  richContent: json("rich_content").$type<{
    type?: string;
    buttons?: Array<{ label: string; action: string; url?: string }>;
    cards?: Array<{ title: string; description: string; image?: string; buttons?: any[] }>;
    quickReplies?: string[];
    form?: { fields: any[] };
    [key: string]: any;
  }>(),
  
  // Attachments reference
  hasAttachments: boolean("has_attachments").notNull().default(false),
  
  // Status: sent, delivered, read, failed
  status: text("status").notNull().default("sent"),
  
  // AI metadata
  isAiGenerated: boolean("is_ai_generated").notNull().default(false),
  aiConfidence: integer("ai_confidence"),
  aiSourceIds: text("ai_source_ids").array(),
  
  // Channel-specific metadata
  externalMessageId: varchar("external_message_id"),
  metadata: json("metadata").$type<Record<string, any>>().default({}),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  editedAt: timestamp("edited_at"),
  deletedAt: timestamp("deleted_at"),
}, (table) => ({
  conversationIdx: index("conversation_messages_conversation_id_idx").on(table.conversationId),
  senderTypeIdx: index("conversation_messages_sender_type_idx").on(table.senderType),
  createdAtIdx: index("conversation_messages_created_at_idx").on(table.createdAt),
}));

export const insertConversationMessageSchema = createInsertSchema(conversationMessages).omit({
  id: true,
  createdAt: true,
});

export type InsertConversationMessage = z.infer<typeof insertConversationMessageSchema>;
export type ConversationMessage = typeof conversationMessages.$inferSelect;

// Message Attachments
export const messageAttachments = pgTable("message_attachments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  messageId: varchar("message_id").notNull().references(() => conversationMessages.id),
  workspaceId: varchar("workspace_id").notNull(), // Workspace scoping for tenant isolation
  
  // File info
  fileName: text("file_name").notNull(),
  fileType: text("file_type").notNull(), // image, video, audio, document, other
  mimeType: text("mime_type"),
  fileSize: integer("file_size"),
  
  // Storage
  url: text("url").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  
  // Metadata
  metadata: json("metadata").$type<{
    width?: number;
    height?: number;
    duration?: number;
    [key: string]: any;
  }>().default({}),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  messageIdx: index("message_attachments_message_id_idx").on(table.messageId),
  workspaceIdx: index("message_attachments_workspace_id_idx").on(table.workspaceId),
}));

export const insertMessageAttachmentSchema = createInsertSchema(messageAttachments).omit({
  id: true,
  createdAt: true,
  workspaceId: true, // Auto-populated from message context
});

export type InsertMessageAttachment = z.infer<typeof insertMessageAttachmentSchema>;
export type MessageAttachment = typeof messageAttachments.$inferSelect;

// Conversation Activities - Activity log
export const conversationActivities = pgTable("conversation_activities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  conversationId: varchar("conversation_id").notNull(),
  
  // Activity type: assigned, status_changed, tag_added, note_added, etc.
  activityType: text("activity_type").notNull(),
  
  // Actor
  actorId: varchar("actor_id"),
  actorType: text("actor_type").notNull(), // agent, bot, system
  actorName: text("actor_name"),
  
  // Activity details
  description: text("description"),
  oldValue: text("old_value"),
  newValue: text("new_value"),
  metadata: json("metadata").$type<Record<string, any>>().default({}),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  conversationIdx: index("conversation_activities_conversation_id_idx").on(table.conversationId),
  activityTypeIdx: index("conversation_activities_activity_type_idx").on(table.activityType),
  createdAtIdx: index("conversation_activities_created_at_idx").on(table.createdAt),
}));

export const insertConversationActivitySchema = createInsertSchema(conversationActivities).omit({
  id: true,
  createdAt: true,
});

export type InsertConversationActivity = z.infer<typeof insertConversationActivitySchema>;
export type ConversationActivity = typeof conversationActivities.$inferSelect;

// Conversation Participants - Track who is in each conversation
export const conversationParticipants = pgTable("conversation_participants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  conversationId: varchar("conversation_id").notNull().references(() => conversations.id),
  workspaceId: varchar("workspace_id").notNull().references(() => workspaces.id),
  
  // Participant info
  participantType: text("participant_type").notNull(), // customer, agent, bot
  participantId: varchar("participant_id"), // References adminUsers.id for agents, or contact_id for customers
  
  // Display info
  name: text("name"),
  email: text("email"),
  avatar: text("avatar"),
  
  // Role and status
  role: text("role").default("member"), // owner, agent, participant, member
  status: text("status").default("active"), // active, left, removed
  
  // Activity tracking
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
  leftAt: timestamp("left_at"),
  lastSeenAt: timestamp("last_seen_at"),
  lastReadAt: timestamp("last_read_at"),
  unreadCount: integer("unread_count").default(0),
  
  // Metadata
  metadata: json("metadata").$type<Record<string, any>>().default({}),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  conversationIdx: index("conversation_participants_conversation_id_idx").on(table.conversationId),
  workspaceIdx: index("conversation_participants_workspace_id_idx").on(table.workspaceId),
  participantIdx: index("conversation_participants_participant_id_idx").on(table.participantId),
  statusIdx: index("conversation_participants_status_idx").on(table.status),
  uniqueParticipant: unique("conversation_participants_unique").on(table.conversationId, table.participantId, table.participantType),
}));

export const insertConversationParticipantSchema = createInsertSchema(conversationParticipants).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertConversationParticipant = z.infer<typeof insertConversationParticipantSchema>;
export type ConversationParticipant = typeof conversationParticipants.$inferSelect;

// =============================================
// BOT FLOW ENGINE (Phase 1C)
// =============================================

// Bot Flow Definitions
export const botFlows = pgTable("bot_flows", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  workspaceId: varchar("workspace_id").notNull(),
  botId: varchar("bot_id").notNull(),
  
  // Flow metadata
  name: text("name").notNull(),
  description: text("description"),
  flowType: text("flow_type").notNull().default("conversation"), // conversation, welcome, fallback, handoff
  
  // Version tracking
  currentVersionId: varchar("current_version_id"),
  isPublished: boolean("is_published").notNull().default(false),
  
  // Trigger config
  triggers: json("triggers").$type<Array<{
    type: string; // keyword, intent, page_url, event, schedule, fallback
    conditions: Record<string, any>;
    priority?: number;
  }>>().default([]),
  
  // Status
  status: text("status").notNull().default("draft"), // draft, active, paused, archived
  
  // Stats
  totalRuns: integer("total_runs").notNull().default(0),
  successfulRuns: integer("successful_runs").notNull().default(0),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  publishedAt: timestamp("published_at"),
}, (table) => ({
  workspaceIdx: index("bot_flows_workspace_id_idx").on(table.workspaceId),
  botIdx: index("bot_flows_bot_id_idx").on(table.botId),
  statusIdx: index("bot_flows_status_idx").on(table.status),
  flowTypeIdx: index("bot_flows_flow_type_idx").on(table.flowType),
}));

export const insertBotFlowSchema = createInsertSchema(botFlows).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  totalRuns: true,
  successfulRuns: true,
});

export type InsertBotFlow = z.infer<typeof insertBotFlowSchema>;
export type BotFlow = typeof botFlows.$inferSelect;

// Bot Flow Versions - Version history
export const botFlowVersions = pgTable("bot_flow_versions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  flowId: varchar("flow_id").notNull(),
  
  // Version metadata
  version: integer("version").notNull(),
  name: text("name"),
  description: text("description"),
  
  // Flow definition (nodes and edges)
  nodes: json("nodes").$type<Array<{
    id: string;
    type: string; // start, message, question, condition, action, ai_answer, handoff, end
    position: { x: number; y: number };
    data: {
      label?: string;
      content?: string;
      options?: any[];
      conditions?: any[];
      actions?: any[];
      aiConfig?: Record<string, any>;
      [key: string]: any;
    };
  }>>().notNull().default([]),
  
  edges: json("edges").$type<Array<{
    id: string;
    source: string;
    target: string;
    sourceHandle?: string;
    label?: string;
    condition?: Record<string, any>;
  }>>().notNull().default([]),
  
  // Variables and settings
  variables: json("variables").$type<Array<{
    name: string;
    type: string;
    defaultValue?: any;
  }>>().default([]),
  
  settings: json("settings").$type<{
    timeout?: number;
    fallbackFlowId?: string;
    aiEnabled?: boolean;
    [key: string]: any;
  }>().default({}),
  
  // Author
  createdBy: varchar("created_by"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  flowIdx: index("bot_flow_versions_flow_id_idx").on(table.flowId),
  versionIdx: index("bot_flow_versions_version_idx").on(table.version),
}));

export const insertBotFlowVersionSchema = createInsertSchema(botFlowVersions).omit({
  id: true,
  createdAt: true,
});

export type InsertBotFlowVersion = z.infer<typeof insertBotFlowVersionSchema>;
export type BotFlowVersion = typeof botFlowVersions.$inferSelect;

// Flow Sessions - Active flow execution state
export const flowSessions = pgTable("flow_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  conversationId: varchar("conversation_id").notNull().unique(),
  workspaceId: varchar("workspace_id").notNull(),
  botId: varchar("bot_id").notNull(),
  flowId: varchar("flow_id").notNull(),
  versionId: varchar("version_id").notNull(),
  
  currentNodeId: varchar("current_node_id").notNull(),
  variables: json("variables").$type<Record<string, any>>().notNull().default({}),
  messageHistory: json("message_history").$type<Array<{
    role: string;
    content: string;
    timestamp: string;
    nodeId?: string;
  }>>().notNull().default([]),
  
  contactId: varchar("contact_id"),
  contactName: varchar("contact_name"),
  contactEmail: varchar("contact_email"),
  
  status: text("status").notNull().default("active"),
  startedAt: timestamp("started_at").defaultNow().notNull(),
  lastActivityAt: timestamp("last_activity_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at"),
}, (table) => ({
  conversationIdx: index("flow_sessions_conversation_id_idx").on(table.conversationId),
  workspaceIdx: index("flow_sessions_workspace_id_idx").on(table.workspaceId),
  flowIdx: index("flow_sessions_flow_id_idx").on(table.flowId),
  statusIdx: index("flow_sessions_status_idx").on(table.status),
}));

export const insertFlowSessionSchema = createInsertSchema(flowSessions).omit({
  id: true,
  startedAt: true,
});

export type InsertFlowSession = z.infer<typeof insertFlowSessionSchema>;
export type FlowSession = typeof flowSessions.$inferSelect;

// =============================================
// KNOWLEDGE BASE (Phase 2A)
// =============================================

// Knowledge Sources - Source definitions
export const knowledgeSources = pgTable("knowledge_sources", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  workspaceId: varchar("workspace_id").notNull(),
  botId: varchar("bot_id"),
  
  // Source type: url, file, text, api, sitemap
  sourceType: text("source_type").notNull(),
  name: text("name").notNull(),
  
  // Source config
  config: json("config").$type<{
    url?: string;
    fileKey?: string;
    content?: string;
    refreshInterval?: number;
    selectors?: string[];
    excludePatterns?: string[];
    [key: string]: any;
  }>().notNull(),
  
  // Status: pending, processing, ready, error
  status: text("status").notNull().default("pending"),
  statusMessage: text("status_message"),
  
  // Stats
  documentCount: integer("document_count").notNull().default(0),
  chunkCount: integer("chunk_count").notNull().default(0),
  lastSyncAt: timestamp("last_sync_at"),
  nextSyncAt: timestamp("next_sync_at"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  workspaceIdx: index("knowledge_sources_workspace_id_idx").on(table.workspaceId),
  botIdx: index("knowledge_sources_bot_id_idx").on(table.botId),
  statusIdx: index("knowledge_sources_status_idx").on(table.status),
}));

export const insertKnowledgeSourceSchema = createInsertSchema(knowledgeSources).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  documentCount: true,
  chunkCount: true,
});

export type InsertKnowledgeSource = z.infer<typeof insertKnowledgeSourceSchema>;
export type KnowledgeSource = typeof knowledgeSources.$inferSelect;

// Knowledge Documents - Processed documents
export const knowledgeDocuments = pgTable("knowledge_documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sourceId: varchar("source_id").notNull(),
  workspaceId: varchar("workspace_id").notNull(),
  
  // Document info
  title: text("title").notNull(),
  url: text("url"),
  content: text("content").notNull(),
  
  // Metadata
  metadata: json("metadata").$type<{
    author?: string;
    publishedAt?: string;
    category?: string;
    tags?: string[];
    language?: string;
    [key: string]: any;
  }>().default({}),
  
  // Stats
  chunkCount: integer("chunk_count").notNull().default(0),
  contentHash: text("content_hash"),
  
  // Visibility
  isPublic: boolean("is_public").notNull().default(true),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  sourceIdx: index("knowledge_documents_source_id_idx").on(table.sourceId),
  workspaceIdx: index("knowledge_documents_workspace_id_idx").on(table.workspaceId),
}));

export const insertKnowledgeDocumentSchema = createInsertSchema(knowledgeDocuments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  chunkCount: true,
});

export type InsertKnowledgeDocument = z.infer<typeof insertKnowledgeDocumentSchema>;
export type KnowledgeDocument = typeof knowledgeDocuments.$inferSelect;

// Knowledge Chunks - Chunked text for vector search
export const knowledgeChunks = pgTable("knowledge_chunks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  documentId: varchar("document_id").notNull(),
  sourceId: varchar("source_id").notNull(),
  workspaceId: varchar("workspace_id").notNull(),
  
  // Chunk content
  content: text("content").notNull(),
  chunkIndex: integer("chunk_index").notNull(),
  
  // Token count for context window management
  tokenCount: integer("token_count"),
  
  // Metadata
  metadata: json("metadata").$type<{
    heading?: string;
    section?: string;
    pageNumber?: number;
    [key: string]: any;
  }>().default({}),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  documentIdx: index("knowledge_chunks_document_id_idx").on(table.documentId),
  sourceIdx: index("knowledge_chunks_source_id_idx").on(table.sourceId),
  workspaceIdx: index("knowledge_chunks_workspace_id_idx").on(table.workspaceId),
}));

export const insertKnowledgeChunkSchema = createInsertSchema(knowledgeChunks).omit({
  id: true,
  createdAt: true,
});

export type InsertKnowledgeChunk = z.infer<typeof insertKnowledgeChunkSchema>;
export type KnowledgeChunk = typeof knowledgeChunks.$inferSelect;

// =============================================
// ENTERPRISE FEATURES (Phase 3D)
// =============================================

// NOTE: auditLogs table is already defined above (line ~443)
// Use existing auditLogs for audit trail functionality

// Integration Registry - Marketplace integrations
export const integrations = pgTable("integrations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  workspaceId: varchar("workspace_id").notNull(),
  
  // Integration type: crm, email, slack, zapier, custom
  type: text("type").notNull(),
  name: text("name").notNull(),
  provider: text("provider").notNull(), // hubspot, salesforce, slack, etc.
  
  // Auth and config
  authType: text("auth_type").notNull(), // oauth, api_key, webhook
  config: json("config").$type<{
    apiKey?: string;
    accessToken?: string;
    refreshToken?: string;
    webhookUrl?: string;
    expiresAt?: string;
    [key: string]: any;
  }>().default({}),
  
  // Settings
  settings: json("settings").$type<{
    syncInterval?: number;
    eventMappings?: Record<string, string>;
    fieldMappings?: Record<string, string>;
    [key: string]: any;
  }>().default({}),
  
  // Status
  status: text("status").notNull().default("active"), // active, paused, error, disconnected
  lastSyncAt: timestamp("last_sync_at"),
  errorMessage: text("error_message"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  workspaceIdx: index("integrations_workspace_id_idx").on(table.workspaceId),
  typeIdx: index("integrations_type_idx").on(table.type),
  providerIdx: index("integrations_provider_idx").on(table.provider),
  statusIdx: index("integrations_status_idx").on(table.status),
}));

export const insertIntegrationSchema = createInsertSchema(integrations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertIntegration = z.infer<typeof insertIntegrationSchema>;
export type Integration = typeof integrations.$inferSelect;

// Agent Performance Metrics (Phase 3A)
export const agentMetrics = pgTable("agent_metrics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  workspaceId: varchar("workspace_id").notNull(),
  agentId: varchar("agent_id").notNull(),
  
  // Time period
  date: timestamp("date").notNull(),
  
  // Metrics
  conversationsHandled: integer("conversations_handled").notNull().default(0),
  messagesReceived: integer("messages_received").notNull().default(0),
  messagesSent: integer("messages_sent").notNull().default(0),
  avgFirstResponseTime: integer("avg_first_response_time"), // seconds
  avgResolutionTime: integer("avg_resolution_time"), // seconds
  csatTotal: integer("csat_total").notNull().default(0),
  csatCount: integer("csat_count").notNull().default(0),
  transfersIn: integer("transfers_in").notNull().default(0),
  transfersOut: integer("transfers_out").notNull().default(0),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  workspaceIdx: index("agent_metrics_workspace_id_idx").on(table.workspaceId),
  agentIdx: index("agent_metrics_agent_id_idx").on(table.agentId),
  dateIdx: index("agent_metrics_date_idx").on(table.date),
  unique: unique("agent_metrics_agent_date").on(table.agentId, table.date),
}));

export const insertAgentMetricSchema = createInsertSchema(agentMetrics).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertAgentMetric = z.infer<typeof insertAgentMetricSchema>;
export type AgentMetric = typeof agentMetrics.$inferSelect;

// =============================================
// DRIZZLE RELATIONS
// =============================================

// Workspace relations
export const workspacesRelations = relations(workspaces, ({ one, many }) => ({
  owner: one(adminUsers, {
    fields: [workspaces.ownerId],
    references: [adminUsers.id],
  }),
  memberships: many(workspaceMemberships),
  bots: many(bots),
}));

// Workspace membership relations
export const workspaceMembershipsRelations = relations(workspaceMemberships, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [workspaceMemberships.workspaceId],
    references: [workspaces.id],
  }),
  user: one(adminUsers, {
    fields: [workspaceMemberships.userId],
    references: [adminUsers.id],
  }),
  inviter: one(adminUsers, {
    fields: [workspaceMemberships.invitedBy],
    references: [adminUsers.id],
    relationName: 'inviter',
  }),
}));

// Admin users relations
export const adminUsersRelations = relations(adminUsers, ({ many }) => ({
  workspaceMemberships: many(workspaceMemberships),
  ownedWorkspaces: many(workspaces),
}));

// Bots relations
export const botsRelations = relations(bots, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [bots.workspaceId],
    references: [workspaces.id],
  }),
  settings: one(botSettings, {
    fields: [bots.botId],
    references: [botSettings.botId],
  }),
  widgetSettings: one(widgetSettings, {
    fields: [bots.botId],
    references: [widgetSettings.botId],
  }),
  leads: many(leads),
  sessions: many(chatSessions),
  analyticsEvents: many(chatAnalyticsEvents),
  dailyAnalytics: many(dailyAnalytics),
  automationWorkflows: many(automationWorkflows),
  automationRuns: many(automationRuns),
}));

// Bot settings relations
export const botSettingsRelations = relations(botSettings, ({ one }) => ({
  bot: one(bots, {
    fields: [botSettings.botId],
    references: [bots.botId],
  }),
}));

// Widget settings relations
export const widgetSettingsRelations = relations(widgetSettings, ({ one }) => ({
  bot: one(bots, {
    fields: [widgetSettings.botId],
    references: [bots.botId],
  }),
}));

// Leads relations
export const leadsRelations = relations(leads, ({ one }) => ({
  bot: one(bots, {
    fields: [leads.botId],
    references: [bots.botId],
  }),
  session: one(chatSessions, {
    fields: [leads.sessionId],
    references: [chatSessions.sessionId],
  }),
}));

// Chat sessions relations
export const chatSessionsRelations = relations(chatSessions, ({ one, many }) => ({
  bot: one(bots, {
    fields: [chatSessions.botId],
    references: [bots.botId],
  }),
  analyticsEvents: many(chatAnalyticsEvents),
  leads: many(leads),
}));

// Chat analytics events relations
export const chatAnalyticsEventsRelations = relations(chatAnalyticsEvents, ({ one }) => ({
  bot: one(bots, {
    fields: [chatAnalyticsEvents.botId],
    references: [bots.botId],
  }),
  session: one(chatSessions, {
    fields: [chatAnalyticsEvents.sessionId],
    references: [chatSessions.sessionId],
  }),
}));

// Daily analytics relations
export const dailyAnalyticsRelations = relations(dailyAnalytics, ({ one }) => ({
  bot: one(bots, {
    fields: [dailyAnalytics.botId],
    references: [bots.botId],
  }),
}));

// Automation workflows relations
export const automationWorkflowsRelations = relations(automationWorkflows, ({ one, many }) => ({
  bot: one(bots, {
    fields: [automationWorkflows.botId],
    references: [bots.botId],
  }),
  runs: many(automationRuns),
}));

// Automation runs relations
export const automationRunsRelations = relations(automationRuns, ({ one }) => ({
  workflow: one(automationWorkflows, {
    fields: [automationRuns.workflowId],
    references: [automationWorkflows.id],
  }),
  bot: one(bots, {
    fields: [automationRuns.botId],
    references: [bots.botId],
  }),
}));

// =============================================
// NEW FEATURE RELATIONS (Phase 1-3)
// =============================================

// Channel relations
export const channelsRelations = relations(channels, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [channels.workspaceId],
    references: [workspaces.id],
  }),
  conversations: many(conversations),
}));

// Conversation relations
export const conversationsRelations = relations(conversations, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [conversations.workspaceId],
    references: [workspaces.id],
  }),
  channel: one(channels, {
    fields: [conversations.channelId],
    references: [channels.id],
  }),
  bot: one(bots, {
    fields: [conversations.botId],
    references: [bots.botId],
  }),
  assignedAgent: one(adminUsers, {
    fields: [conversations.assignedAgentId],
    references: [adminUsers.id],
  }),
  messages: many(conversationMessages),
  activities: many(conversationActivities),
  participants: many(conversationParticipants),
}));

// Conversation messages relations
export const conversationMessagesRelations = relations(conversationMessages, ({ one, many }) => ({
  conversation: one(conversations, {
    fields: [conversationMessages.conversationId],
    references: [conversations.id],
  }),
  attachments: many(messageAttachments),
}));

// Message attachments relations
export const messageAttachmentsRelations = relations(messageAttachments, ({ one }) => ({
  message: one(conversationMessages, {
    fields: [messageAttachments.messageId],
    references: [conversationMessages.id],
  }),
}));

// Conversation participants relations
export const conversationParticipantsRelations = relations(conversationParticipants, ({ one }) => ({
  conversation: one(conversations, {
    fields: [conversationParticipants.conversationId],
    references: [conversations.id],
  }),
  workspace: one(workspaces, {
    fields: [conversationParticipants.workspaceId],
    references: [workspaces.id],
  }),
}));

// Conversation activities relations
export const conversationActivitiesRelations = relations(conversationActivities, ({ one }) => ({
  conversation: one(conversations, {
    fields: [conversationActivities.conversationId],
    references: [conversations.id],
  }),
}));

// Bot flows relations
export const botFlowsRelations = relations(botFlows, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [botFlows.workspaceId],
    references: [workspaces.id],
  }),
  bot: one(bots, {
    fields: [botFlows.botId],
    references: [bots.botId],
  }),
  versions: many(botFlowVersions),
  currentVersion: one(botFlowVersions, {
    fields: [botFlows.currentVersionId],
    references: [botFlowVersions.id],
  }),
  sessions: many(flowSessions),
}));

export const flowSessionsRelations = relations(flowSessions, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [flowSessions.workspaceId],
    references: [workspaces.id],
  }),
  bot: one(bots, {
    fields: [flowSessions.botId],
    references: [bots.botId],
  }),
  flow: one(botFlows, {
    fields: [flowSessions.flowId],
    references: [botFlows.id],
  }),
  version: one(botFlowVersions, {
    fields: [flowSessions.versionId],
    references: [botFlowVersions.id],
  }),
}));

// Bot flow versions relations
export const botFlowVersionsRelations = relations(botFlowVersions, ({ one }) => ({
  flow: one(botFlows, {
    fields: [botFlowVersions.flowId],
    references: [botFlows.id],
  }),
}));

// Knowledge sources relations
export const knowledgeSourcesRelations = relations(knowledgeSources, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [knowledgeSources.workspaceId],
    references: [workspaces.id],
  }),
  bot: one(bots, {
    fields: [knowledgeSources.botId],
    references: [bots.botId],
  }),
  documents: many(knowledgeDocuments),
}));

// Knowledge documents relations
export const knowledgeDocumentsRelations = relations(knowledgeDocuments, ({ one, many }) => ({
  source: one(knowledgeSources, {
    fields: [knowledgeDocuments.sourceId],
    references: [knowledgeSources.id],
  }),
  workspace: one(workspaces, {
    fields: [knowledgeDocuments.workspaceId],
    references: [workspaces.id],
  }),
  chunks: many(knowledgeChunks),
}));

// Knowledge chunks relations
export const knowledgeChunksRelations = relations(knowledgeChunks, ({ one }) => ({
  document: one(knowledgeDocuments, {
    fields: [knowledgeChunks.documentId],
    references: [knowledgeDocuments.id],
  }),
  source: one(knowledgeSources, {
    fields: [knowledgeChunks.sourceId],
    references: [knowledgeSources.id],
  }),
}));

// =============================================
// WEBSITE SCRAPER - Scraped website data
// =============================================

export const scrapedWebsites = pgTable("scraped_websites", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  workspaceId: varchar("workspace_id").notNull(),
  botId: varchar("bot_id"),
  
  // Source URL
  url: text("url").notNull(),
  domain: text("domain").notNull(),
  
  // Scraping status
  status: text("status").notNull().default("pending"), // pending, processing, completed, failed
  errorMessage: text("error_message"),
  
  // Raw scraped content
  rawHtml: text("raw_html"),
  rawText: text("raw_text"),
  pageTitle: text("page_title"),
  metaDescription: text("meta_description"),
  
  // AI-extracted structured data
  extractedData: json("extracted_data").$type<{
    businessName?: string;
    tagline?: string;
    description?: string;
    services?: Array<{ name: string; description?: string; price?: string }>;
    products?: Array<{ name: string; description?: string; price?: string }>;
    faqs?: Array<{ question: string; answer: string }>;
    contactInfo?: {
      phone?: string;
      email?: string;
      address?: string;
      hours?: Record<string, string>;
    };
    socialLinks?: Record<string, string>;
    teamMembers?: Array<{ name: string; role?: string; bio?: string }>;
    testimonials?: Array<{ text: string; author?: string; rating?: number }>;
    keyFeatures?: string[];
    pricing?: Array<{ plan: string; price: string; features?: string[] }>;
    aboutContent?: string;
    missionStatement?: string;
  }>().default({}),
  
  // Processing metadata
  pagesScraped: integer("pages_scraped").default(1),
  tokensUsed: integer("tokens_used").default(0),
  processingTimeMs: integer("processing_time_ms"),
  
  // Applied to bot
  appliedToBotAt: timestamp("applied_to_bot_at"),
  appliedByUserId: varchar("applied_by_user_id"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  workspaceIdx: index("scraped_websites_workspace_id_idx").on(table.workspaceId),
  botIdx: index("scraped_websites_bot_id_idx").on(table.botId),
  statusIdx: index("scraped_websites_status_idx").on(table.status),
  domainIdx: index("scraped_websites_domain_idx").on(table.domain),
}));

export const insertScrapedWebsiteSchema = createInsertSchema(scrapedWebsites).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertScrapedWebsite = z.infer<typeof insertScrapedWebsiteSchema>;
export type ScrapedWebsite = typeof scrapedWebsites.$inferSelect;

// Scraped websites relations
export const scrapedWebsitesRelations = relations(scrapedWebsites, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [scrapedWebsites.workspaceId],
    references: [workspaces.id],
  }),
  bot: one(bots, {
    fields: [scrapedWebsites.botId],
    references: [bots.botId],
  }),
}));

// Audit logs relations (uses existing auditLogs table)
export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(adminUsers, {
    fields: [auditLogs.userId],
    references: [adminUsers.id],
  }),
}));

// Integrations relations
export const integrationsRelations = relations(integrations, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [integrations.workspaceId],
    references: [workspaces.id],
  }),
}));

// Agent metrics relations
export const agentMetricsRelations = relations(agentMetrics, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [agentMetrics.workspaceId],
    references: [workspaces.id],
  }),
  agent: one(adminUsers, {
    fields: [agentMetrics.agentId],
    references: [adminUsers.id],
  }),
}));

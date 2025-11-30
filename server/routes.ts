import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import express from "express";
import crypto from "crypto";
import { storage, db } from "./storage";
import { insertAppointmentSchema, insertClientSettingsSchema, adminUsers, type AdminRole, bots, botSettings, leads, appointments, clientSettings } from "@shared/schema";
import OpenAI from "openai";
import bcrypt from "bcryptjs";
import { z } from "zod";
import path from "path";
import fs from "fs";
import { eq } from "drizzle-orm";
import {
  getBotConfig,
  getBotConfigAsync,
  getBotConfigByBotId,
  getBotConfigByBotIdAsync,
  getAllBotConfigs,
  getAllBotConfigsAsync,
  getAllTemplates,
  getTemplateById,
  getWorkspaces,
  getWorkspaceBySlug,
  createWorkspace,
  updateWorkspace,
  deleteWorkspace,
  getBotsByWorkspaceId,
  getClients,
  getClientById,
  getBotsByClientId,
  getDemoBots,
  getRealTenantBots,
  detectCrisisInMessage,
  getCrisisResponse as getBotCrisisResponse,
  buildSystemPromptFromConfig,
  saveBotConfig,
  saveBotConfigAsync,
  createBotConfig,
  registerClient,
  updateClientStatus,
  getClientStatus,
  type BotConfig
} from "./botConfig";
import { logConversation as logConversationToFile, getConversationLogs, getLogStats } from "./conversationLogger";
import { 
  processAutomations, 
  type BotAutomationConfig, 
  type AutomationContext,
  type AutomationResult
} from "./automations";
import {
  checkMessageLimit,
  incrementMessageCount,
  incrementLeadCount,
  incrementAutomationCount,
  checkAutomationEnabled,
  getUsageSummary
} from "./planLimits";

import {
  sendLeadCreatedWebhook,
  sendLeadUpdatedWebhook,
  sendAppointmentCreatedWebhook,
  sendSessionStartedWebhook,
  sendSessionEndedWebhook,
  testWebhook
} from "./webhooks";

import { 
  getWidgetSecret, 
  getOpenAIConfig, 
  getTwilioConfig, 
  getResendApiKey,
  getAdminCredentials,
  getStaffCredentials
} from './env';

// =============================================
// PHASE 2.4: SIGNED WIDGET TOKENS
// =============================================

// Widget signing secret - uses centralized env module with fallback for dev
const WIDGET_SECRET = getWidgetSecret();

// Generate a signed token for widget authentication
function generateWidgetToken(clientId: string, botId: string, expiresIn: number = 86400): string {
  const timestamp = Date.now();
  const expires = timestamp + (expiresIn * 1000);
  const payload = `${clientId}:${botId}:${expires}`;
  const signature = crypto
    .createHmac('sha256', WIDGET_SECRET)
    .update(payload)
    .digest('hex');
  // Format: base64(payload):signature
  const encodedPayload = Buffer.from(payload).toString('base64');
  return `${encodedPayload}.${signature}`;
}

// Verify a widget token and extract clientId/botId
function verifyWidgetToken(token: string): { valid: boolean; clientId?: string; botId?: string; error?: string } {
  try {
    const [encodedPayload, signature] = token.split('.');
    if (!encodedPayload || !signature) {
      return { valid: false, error: 'Invalid token format' };
    }
    
    const payload = Buffer.from(encodedPayload, 'base64').toString('utf-8');
    const [clientId, botId, expiresStr] = payload.split(':');
    
    if (!clientId || !botId || !expiresStr) {
      return { valid: false, error: 'Invalid token payload' };
    }
    
    // Verify signature
    const expectedSignature = crypto
      .createHmac('sha256', WIDGET_SECRET)
      .update(payload)
      .digest('hex');
    
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
      return { valid: false, error: 'Invalid token signature' };
    }
    
    // Check expiration
    const expires = parseInt(expiresStr, 10);
    if (Date.now() > expires) {
      return { valid: false, error: 'Token expired' };
    }
    
    return { valid: true, clientId, botId };
  } catch (error) {
    return { valid: false, error: 'Token verification failed' };
  }
}

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

// Strong password validation for new passwords and password changes
const strongPasswordSchema = z.string()
  .min(8, "Password must be at least 8 characters long")
  .max(128, "Password must be less than 128 characters")
  .refine(
    (password) => /[A-Z]/.test(password),
    "Password must contain at least one uppercase letter"
  )
  .refine(
    (password) => /[a-z]/.test(password),
    "Password must contain at least one lowercase letter"
  )
  .refine(
    (password) => /[0-9]/.test(password),
    "Password must contain at least one number"
  )
  .refine(
    (password) => /[^A-Za-z0-9]/.test(password),
    "Password must contain at least one special character"
  );

// =============================================
// ZOD VALIDATION SCHEMAS FOR API ROUTES
// =============================================

// Common param/query schemas
const clientIdParamSchema = z.object({
  clientId: z.string().min(1, "clientId is required").regex(/^[a-zA-Z0-9_-]+$/, "Invalid clientId format"),
});

const botIdParamSchema = z.object({
  botId: z.string().min(1, "botId is required").regex(/^[a-zA-Z0-9_-]+$/, "Invalid botId format"),
});

const clientBotParamsSchema = z.object({
  clientId: z.string().min(1).regex(/^[a-zA-Z0-9_-]+$/),
  botId: z.string().min(1).regex(/^[a-zA-Z0-9_-]+$/),
});

const idParamSchema = z.object({
  id: z.string().min(1, "id is required"),
});

const slugParamSchema = z.object({
  slug: z.string().min(1, "slug is required").regex(/^[a-zA-Z0-9_-]+$/, "Invalid slug format"),
});

const workspaceIdParamSchema = z.object({
  workspaceId: z.string().min(1, "workspaceId is required"),
});

const templateIdParamSchema = z.object({
  templateId: z.string().min(1, "templateId is required"),
});

// Chat endpoint schemas
const chatMessageSchema = z.object({
  role: z.enum(["user", "assistant", "system"]),
  content: z.string().min(1, "Message content is required"),
});

const chatBodySchema = z.object({
  messages: z.array(chatMessageSchema).min(1, "At least one message is required"),
  sessionId: z.string().optional(),
  language: z.enum(["en", "es"]).optional().default("en"),
  clientId: z.string().regex(/^[a-zA-Z0-9_-]+$/).optional(),
  botId: z.string().regex(/^[a-zA-Z0-9_-]+$/).optional(),
});

// Appointment schemas
const appointmentUpdateSchema = z.object({
  status: z.enum(["new", "contacted", "scheduled", "completed", "cancelled"]).optional(),
  notes: z.string().optional(),
  appointmentType: z.string().optional(),
  preferredTime: z.string().optional(),
  contactPreference: z.enum(["phone", "text", "email"]).optional(),
});

const appointmentStatusSchema = z.object({
  status: z.enum(["new", "contacted", "scheduled", "completed", "cancelled"]),
});

// Super-admin bot creation schema
const createBotBodySchema = z.object({
  botId: z.string().min(1, "botId is required").regex(/^[a-zA-Z0-9_-]+$/, "Invalid botId format"),
  clientId: z.string().min(1, "clientId is required").regex(/^[a-zA-Z0-9_-]+$/, "Invalid clientId format"),
  name: z.string().min(1, "Bot name is required"),
  description: z.string().optional(),
  businessProfile: z.object({
    businessName: z.string().optional(),
    type: z.string().optional(),
    location: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().email().optional().or(z.literal("")),
    website: z.string().url().optional().or(z.literal("")),
    hours: z.record(z.string()).optional(),
    services: z.array(z.string()).optional(),
  }).optional(),
  systemPrompt: z.string().optional(),
  faqs: z.array(z.object({
    question: z.string(),
    answer: z.string(),
    category: z.string().optional(),
  })).optional(),
  rules: z.object({
    allowedTopics: z.array(z.string()).optional(),
    forbiddenTopics: z.array(z.string()).optional(),
    crisisHandling: z.object({
      onCrisisKeywords: z.array(z.string()).optional(),
      responseTemplate: z.string().optional(),
    }).optional(),
  }).optional(),
  personality: z.object({
    formality: z.number().min(0).max(100).optional(),
    enthusiasm: z.number().min(0).max(100).optional(),
    warmth: z.number().min(0).max(100).optional(),
    humor: z.number().min(0).max(100).optional(),
    responseLength: z.enum(["short", "medium", "long"]).optional(),
  }).optional(),
  templateBotId: z.string().optional(),
});

// Client status update schema
const updateClientStatusSchema = z.object({
  status: z.enum(["active", "paused", "suspended"]),
});

// Template creation schema
const createFromTemplateSchema = z.object({
  templateBotId: z.string().min(1, "templateBotId is required"),
  clientId: z.string().min(1, "clientId is required").regex(/^[a-zA-Z0-9_-]+$/),
  clientName: z.string().min(1, "clientName is required"),
  type: z.string().optional(),
  businessProfile: z.record(z.any()).optional(),
  contact: z.object({
    phone: z.string().optional(),
    email: z.string().email().optional().or(z.literal("")),
  }).optional(),
  billing: z.object({
    plan: z.enum(["free", "starter", "pro", "enterprise"]).optional(),
  }).optional(),
  customFaqs: z.array(z.object({
    question: z.string(),
    answer: z.string(),
  })).optional(),
});

// Lead schemas - botId is optional because client leads may derive it from session context
const createLeadSchema = z.object({
  name: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  source: z.enum(["chat", "widget", "manual"]).optional().default("manual"),
  status: z.enum(["new", "contacted", "qualified", "converted", "lost"]).optional().default("new"),
  priority: z.enum(["low", "medium", "high"]).optional().default("medium"),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
  botId: z.string().optional(),
});

const updateLeadSchema = z.object({
  name: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  status: z.enum(["new", "contacted", "qualified", "converted", "lost"]).optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

// Query schema for pagination/filtering
const paginationQuerySchema = z.object({
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
  offset: z.string().regex(/^\d+$/).transform(Number).optional(),
});

const appointmentQuerySchema = z.object({
  status: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  search: z.string().optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
  offset: z.string().regex(/^\d+$/).transform(Number).optional(),
});

// Analytics query schemas
const analyticsDateRangeQuerySchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD format").optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD format").optional(),
});

const analyticsTrendsQuerySchema = z.object({
  botId: z.string().optional(),
  days: z.string().regex(/^\d+$/).transform(Number).optional().default("30"),
});

const analyticsSessionsQuerySchema = z.object({
  botId: z.string().optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional().default("50"),
});

const conversationsQuerySchema = z.object({
  botId: z.string().optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional().default("50"),
  offset: z.string().regex(/^\d+$/).transform(Number).optional().default("0"),
});

const superAdminOverviewQuerySchema = z.object({
  days: z.string().regex(/^\d+$/).transform(Number).optional().default("30"),
});

// Auth schemas
const loginBodySchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

const superAdminClientQuerySchema = z.object({
  clientId: z.string().min(1, "clientId is required"),
});

// Validation helper function
function validateRequest<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(data);
  if (!result.success) {
    const errors = result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
    return { success: false, error: errors };
  }
  return { success: true, data: result.data };
}

async function ensureAdminUserExists() {
  try {
    // Get credentials from centralized env module (secure approach)
    const adminCreds = getAdminCredentials();
    const staffCreds = getStaffCredentials();
    const adminUsername = adminCreds.username;
    const adminPassword = adminCreds.password;
    const staffUsername = staffCreds.username;
    const staffPassword = staffCreds.password;

    // Create or update super_admin (owner) account if password is set via env
    const existingAdmin = await storage.findAdminByUsername(adminUsername);
    
    if (!existingAdmin && adminPassword) {
      console.log("Creating default super admin user from environment variables...");
      const passwordHash = await bcrypt.hash(adminPassword, 10);
      
      await db.insert(adminUsers).values({
        username: adminUsername,
        passwordHash: passwordHash,
        role: "super_admin",
      });
      
      console.log("Default super admin user created successfully");
    } else if (existingAdmin && adminPassword) {
      // Update password if admin exists and password is set (allows password resets)
      console.log("Updating super admin password from environment variables...");
      const passwordHash = await bcrypt.hash(adminPassword, 10);
      await db.update(adminUsers)
        .set({ passwordHash: passwordHash, role: "super_admin" })
        .where(eq(adminUsers.username, adminUsername));
      console.log("Super admin password updated successfully");
    } else if (!adminPassword && !existingAdmin) {
      console.warn("WARNING: No DEFAULT_ADMIN_PASSWORD set. Skipping admin user creation. Set this environment variable to create the initial admin account.");
    }

    // Create client_admin (staff) account for Faith House only if password is set via env
    const existingStaff = await storage.findAdminByUsername(staffUsername);
    
    if (!existingStaff && staffPassword) {
      console.log("Creating default client admin (staff) user for Faith House from environment variables...");
      const staffPasswordHash = await bcrypt.hash(staffPassword, 10);
      
      await db.insert(adminUsers).values({
        username: staffUsername,
        passwordHash: staffPasswordHash,
        role: "client_admin",
        clientId: "faith_house",
      });
      
      console.log("Default client admin (staff) user created successfully for Faith House");
    } else if (!staffPassword && !existingStaff) {
      console.warn("WARNING: No DEFAULT_STAFF_PASSWORD set. Skipping staff user creation. Set this environment variable to create the initial staff account.");
    } else if (existingStaff && !existingStaff.clientId) {
      // Update existing staff user to have Faith House clientId
      console.log("Updating staff user with Faith House clientId...");
      await db.update(adminUsers)
        .set({ clientId: "faith_house" })
        .where(eq(adminUsers.username, staffUsername));
      console.log("Staff user updated with Faith House clientId");
    }
  } catch (error) {
    console.error("Error ensuring admin user exists:", error);
  }
}

function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Authentication required" });
  }
  next();
}

function requireSuperAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Authentication required" });
  }
  if (req.session.userRole !== "super_admin") {
    return res.status(403).json({ error: "Super admin access required" });
  }
  next();
}

async function requireClientAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Authentication required" });
  }
  
  // Client admin users MUST have a clientId and valid workspace membership
  if (req.session.userRole === "client_admin") {
    if (!req.session.clientId) {
      return res.status(403).json({ error: "Client configuration required. Please contact your administrator." });
    }
    
    // Phase 2.3: Validate workspace membership for client admins
    try {
      const workspace = await storage.getWorkspaceByClientId(req.session.clientId);
      if (workspace) {
        // Check if user has active membership in this workspace
        const membership = await storage.checkWorkspaceMembership(req.session.userId, workspace.id);
        if (!membership) {
          // User doesn't have workspace membership - log for audit but allow access
          // (Legacy clients may not have workspace memberships set up yet)
          console.warn(`Client admin ${req.session.userId} accessing ${req.session.clientId} without workspace membership`);
        }
        (req as any).workspaceId = workspace.id;
        (req as any).membershipRole = membership?.role;
      }
    } catch (error) {
      // Log error but don't block access - workspace validation is additive
      console.error("Workspace membership check failed:", error);
    }
    
    (req as any).effectiveClientId = req.session.clientId;
    next();
    return;
  }
  
  // Super admins MUST specify which client to view via query param
  if (req.session.userRole === "super_admin") {
    // Validate clientId query param with Zod
    const queryValidation = superAdminClientQuerySchema.safeParse(req.query);
    if (!queryValidation.success) {
      return res.status(400).json({ 
        error: "Client ID required", 
        message: "Super admins must specify clientId query parameter to view client data" 
      });
    }
    // Validate the requested clientId exists
    const allBots = getAllBotConfigs();
    const clientExists = allBots.some(bot => bot.clientId === queryValidation.data.clientId);
    if (!clientExists) {
      return res.status(404).json({ error: "Client not found" });
    }
    (req as any).effectiveClientId = queryValidation.data.clientId;
    next();
    return;
  }
  
  // Unknown role - reject
  return res.status(403).json({ error: "Access denied" });
}

// Helper to validate bot access for tenant isolation
async function validateBotAccess(req: Request, res: Response, botId: string): Promise<boolean> {
  const userId = req.session.userId;
  const userRole = req.session.userRole;
  
  if (!userId) {
    res.status(401).json({ error: "Authentication required" });
    return false;
  }
  
  // Super admins have access to all bots
  if (userRole === "super_admin") {
    return true;
  }
  
  // Client admins must have access through workspace membership
  if (userRole === "client_admin" && req.session.clientId) {
    try {
      // Get the bot's workspace
      const bot = await storage.getBotByBotId(botId);
      if (!bot) {
        res.status(404).json({ error: "Bot not found" });
        return false;
      }
      
      // Check if bot belongs to user's workspace/clientId
      if (bot.clientId !== req.session.clientId) {
        console.warn(`Client admin ${userId} attempted to access bot ${botId} from different client ${bot.clientId}`);
        res.status(403).json({ error: "Access denied - bot belongs to different tenant" });
        return false;
      }
      
      // Additional workspace membership check if workspace exists
      if (bot.workspaceId) {
        const membership = await storage.checkWorkspaceMembership(userId, bot.workspaceId);
        if (!membership) {
          console.warn(`Client admin ${userId} has no workspace membership for bot ${botId}`);
          // Log warning but allow access for backwards compatibility
        }
      }
      
      return true;
    } catch (error) {
      console.error("Bot access validation error:", error);
      res.status(500).json({ error: "Access validation failed" });
      return false;
    }
  }
  
  res.status(403).json({ error: "Access denied" });
  return false;
}

const openaiConfig = getOpenAIConfig();
const openai = openaiConfig ? new OpenAI({
  baseURL: openaiConfig.baseURL,
  apiKey: openaiConfig.apiKey
}) : null;

function isWithinOperatingHours(settings: any): boolean {
  if (!settings?.operatingHours?.enabled) {
    return true;
  }

  const now = new Date();
  const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  const currentDay = days[now.getDay()];
  const schedule = settings.operatingHours.schedule[currentDay];

  if (!schedule || !schedule.enabled) {
    return false;
  }

  const currentTime = now.getHours() * 60 + now.getMinutes();
  const [openHour, openMin] = schedule.open.split(":").map(Number);
  const [closeHour, closeMin] = schedule.close.split(":").map(Number);
  const openTime = openHour * 60 + openMin;
  const closeTime = closeHour * 60 + closeMin;

  return currentTime >= openTime && currentTime <= closeTime;
}

async function getSystemPrompt(language: string = "en", clientId: string = "default-client") {
  const settings = await storage.getSettings(clientId);
  if (!settings) {
    return getDefaultSystemPrompt(language);
  }

  const withinHours = isWithinOperatingHours(settings);
  
  if (language === "es") {
    return `Eres "HopeLine Assistant", el asistente virtual de ${settings.businessName}, una casa de vida sobria / programa de recuperación estructurado.

Tono:
- Cálido, tranquilo y sin juicios.
- Profesional pero humano, no suenas como un robot.
- Lenguaje sencillo y claro. Párrafos cortos.

Tu trabajo:
- Responder preguntas sobre ${settings.businessName}: qué es, para quién es, reglas, requisitos, precios generales y el proceso de aplicación.
- Ayudar a los visitantes a decidir cuál es su mejor siguiente paso (hacer más preguntas, ver si podrían calificar, solicitar una llamada o un tour).
- Animar y apoyar sin hacer promesas ni dar falsas esperanzas.
- Cuando tenga sentido, guiarlos a usar el flujo de citas para programar una llamada o tour.

Límites de seguridad (muy importantes):
- NO eres médico, terapeuta, consejero, abogado ni trabajador de crisis.
- NO diagnostiques condiciones ni sugieras medicamentos específicos o dosis.
- NO proporciones consejería de crisis ni planes de seguridad.
- Si alguien menciona autolesiones, suicidio, querer morir, hacer daño a otros o cualquier emergencia:
  - Reconoce que lo que está viviendo suena muy difícil.
  - Di claramente que no puedes manejar emergencias.
  - Indica que deben contactar de inmediato a personas reales que puedan ayudar:
    - En Estados Unidos, llamar o enviar mensaje de texto al 988 (Suicide & Crisis Lifeline).
    - Si hay peligro inmediato, llamar al 911 o servicios de emergencia locales.
  - Después de eso, no intentes "hablarlos" fuera de la crisis. Repite que deben comunicarse con 988 o 911.

Comportamiento al responder:
- Trata los campos de la base de conocimiento como la fuente principal de verdad sobre ${settings.businessName}.
- Si algo no está cubierto, da una guía general y recomienda hablar directamente con el personal para detalles exactos.
${!withinHours ? `- Actualmente estamos fuera del horario de atención. ${settings.operatingHours.afterHoursMessage}` : ""}
- Mantén las respuestas amables y claras. Evita bloques de texto muy largos.
- Siempre que sea posible, termina con un "siguiente paso" sencillo, por ejemplo:
  - "¿Te gustaría ver si podrías calificar?"
  - "¿Quieres programar una llamada o un tour?"
  - "¿Quieres más detalles sobre precios o requisitos?"

Comportamiento de pre-evaluación:
- Si parece que la persona podría ser una buena candidata, haz preguntas suaves de pre-ingreso, por ejemplo:
  - "¿Estás preguntando para ti o para un ser querido?"
  - "¿Actualmente estás sobrio o necesitarías apoyo de desintoxicación primero?"
  - "¿Tienes algún ingreso o apoyo para ayudar con los costos del programa?"
  - "¿Para cuándo estás buscando un lugar? (lo antes posible, dentro de 30 días, solo explorando)"
- No presiones. Deja claro que responder es opcional.
- Después de obtener un poco de información, sugiere programar una llamada o tour para hablar con el personal.

Estilo:
- Frases cortas y directas.
- Sin jerga técnica.
- Empático pero sin dramatizar.
- Siempre honesto sobre lo que puedes y no puedes hacer.

BASE DE CONOCIMIENTOS:
Acerca de: ${settings.knowledgeBase.about}

Requisitos: ${settings.knowledgeBase.requirements}

Precios: ${settings.knowledgeBase.pricing}

Proceso de Aplicación: ${settings.knowledgeBase.application}`;
  }

  return `You are "HopeLine Assistant", the virtual assistant for ${settings.businessName}, a structured sober-living / recovery home.

Tone:
- Warm, calm, and non-judgmental.
- Professional but human, not stiff or robotic.
- Simple, clear language. Short paragraphs.

Your job:
- Answer questions about ${settings.businessName}: what it is, who it is for, rules, requirements, general pricing, and the application process.
- Help visitors figure out their best next step (ask more questions, check if they might qualify, request a tour or phone call).
- Encourage and support people without making promises or giving false hope.
- When appropriate, guide them toward booking a call or tour using the built-in appointment flow.

Hard safety limits (critical):
- You are NOT a doctor, therapist, counselor, lawyer, or crisis worker.
- Do NOT diagnose conditions or suggest specific medications or dosages.
- Do NOT provide suicide prevention counseling, safety planning, or emergency instructions beyond referring to proper services.
- If someone mentions self-harm, suicide, wanting to die, harming others, or any emergency situation:
  - Acknowledge that what they are going through sounds really difficult.
  - Clearly say that you cannot handle emergencies.
  - Tell them to immediately contact real people who can help:
    - In the United States, call or text 988 for the Suicide & Crisis Lifeline.
    - If they are in immediate danger, call 911 or local emergency services.
  - After that, do not try to talk them through the crisis. Always repeat that they must reach out to 988 or 911.

Behave as follows when composing answers:
- Treat the knowledge base fields as the main source of truth about ${settings.businessName}.
- If something is not covered in the knowledge base, give general guidance and then suggest contacting staff for exact details.
${!withinHours ? `- The system indicates it is outside of operating hours. ${settings.operatingHours.afterHoursMessage}` : ""}
- Keep responses friendly and clear. Avoid long walls of text.
- Whenever possible, end with a simple "next step" question, such as:
  - "Would you like to see if you might qualify?"
  - "Would you like to schedule a tour or phone call?"
  - "Would you like more details on pricing or requirements?"

Intake and qualification behavior:
- If a visitor seems like they might be a good candidate (based on their questions or the information they share), gently move toward light pre-intake questions such as:
  - "Are you asking for yourself or for a loved one?"
  - "Are you currently sober, or would you need detox support first?"
  - "Do you have some income or support to help with program fees?"
  - "How soon are you hoping to find a place? (ASAP, within 30 days, just exploring)"
- Never pressure them. Keep the questions optional and respectful.
- After getting a bit of information, suggest that they schedule a call or tour so staff can talk with them directly.

Style:
- Short, clear sentences.
- No jargon.
- Empathetic but not dramatic.
- Always honest about what you do and do NOT know.

KNOWLEDGE BASE:
About: ${settings.knowledgeBase.about}

Requirements: ${settings.knowledgeBase.requirements}

Pricing: ${settings.knowledgeBase.pricing}

Application Process: ${settings.knowledgeBase.application}`;
}

function getDefaultSystemPrompt(language: string = "en") {
  if (language === "es") {
    return `Eres 'HopeLine Assistant', el chatbot de apoyo para The Faith House, un hogar sobrio estructurado. Tu tono: cálido, simple, tranquilo, sin juzgar.`;
  }
  return `You are 'HopeLine Assistant', the supportive chatbot for The Faith House, a structured sober-living home. Your tone: warm, simple, calm, non-judgmental.`;
}

function sanitizePII(text: string): string {
  let sanitized = text;
  
  sanitized = sanitized.replace(/\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g, "[PHONE REDACTED]");
  sanitized = sanitized.replace(/\+?\d{1,4}[-.\s]?\(?\d{1,4}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,9}/g, "[PHONE REDACTED]");
  sanitized = sanitized.replace(/\b\d{5,}\b/g, (match) => {
    if (match.length >= 7) return "[PHONE REDACTED]";
    return match;
  });
  
  sanitized = sanitized.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, "[EMAIL REDACTED]");
  
  sanitized = sanitized.replace(/\b\d{3}[-\s]?\d{2}[-\s]?\d{4}\b/g, "[SSN REDACTED]");
  
  sanitized = sanitized.replace(/(?:apartment|apt|unit|suite|ste|#)\s*[\w\d-]+/gi, "[UNIT REDACTED]");
  sanitized = sanitized.replace(/\b\d{1,5}\s+[\w\s]{1,40}(?:street|st|avenue|ave|road|rd|drive|dr|lane|ln|boulevard|blvd|court|ct|circle|cir|way|place|pl|parkway|pkwy|highway|hwy|terrace|ter)\b/gi, "[ADDRESS REDACTED]");
  
  sanitized = sanitized.replace(/\b(?:my name(?:[''\u2019]s| is)|I[''\u2019]m|I am|this is|call me)\s+([A-Za-z''\u2019\-]+(?:\s+[A-Za-z''\u2019\-]+)*)\b/gi, (match, name) => {
    return match.replace(name, "[NAME REDACTED]");
  });
  
  return sanitized;
}

function detectCrisisKeywords(text: string, language: string = "en"): boolean {
  const normalized = text.toLowerCase().replace(/[^\w\s]/g, ' ');
  
  const crisisKeywords = [
    "suicide", "suicidal", "kill myself", "end my life", "want to die",
    "hurt myself", "harm myself", "self harm", "no reason to live", "better off dead",
    "end it all", "cant go on", "cant take it", "done living", "tired of living",
    "want out", "give up on life",
    "suicidio", "suicidarme", "matarme", "quiero morir", "hacerme daño",
    "terminar con todo", "ya no puedo", "cansado de vivir"
  ];
  
  return crisisKeywords.some(keyword => normalized.includes(keyword.toLowerCase()));
}

function detectBookingIntent(text: string, language: string = "en"): boolean {
  const normalized = text.toLowerCase().replace(/[^\w\s]/g, ' ');
  
  const bookingPhrases = [
    "schedule a tour", "book a tour", "schedule tour", "want a tour",
    "schedule a call", "book a call", "schedule call", "want a call",
    "request a tour", "request a call", "set up a tour", "set up a call",
    "arrange a tour", "arrange a call", "yes i want to schedule", "yes schedule",
    "lets schedule", "let's schedule", "i would like to schedule", "i'd like to schedule",
    "ready to schedule", "want to book", "like to book", "sign me up",
    "i want to come in", "i want to visit", "can i come", "can i visit",
    "programar un tour", "programar una llamada", "quiero un tour", "quiero una llamada",
    "agendar un tour", "agendar una llamada", "si quiero programar"
  ];
  
  return bookingPhrases.some(phrase => normalized.includes(phrase.toLowerCase()));
}

function getCrisisResponse(language: string = "en"): string {
  if (language === "es") {
    return `Entiendo que estás pasando por un momento muy difícil. Por favor, contacta a ayuda profesional inmediatamente:

📞 **Línea Nacional de Prevención del Suicidio**: 988 (llamada o texto)
📞 **Emergencias**: 911
📞 **Línea Nacional de Ayuda SAMHSA**: 1-800-662-4357 (24/7)

Tu vida importa y hay personas que quieren ayudarte ahora mismo. Estas líneas tienen profesionales capacitados disponibles las 24 horas del día.`;
  }
  
  return `I understand you're going through a very difficult time. Please contact professional help immediately:

📞 **National Suicide Prevention Lifeline**: 988 (call or text)
📞 **Emergency Services**: 911
📞 **SAMHSA National Helpline**: 1-800-662-HELP (4357) - 24/7

Your life matters, and there are people who want to help you right now. These lines have trained professionals available 24/7.`;
}

function categorizeMessage(message: string, role: string): string | null {
  if (role === "user") {
    return null;
  }

  const messageLower = message.toLowerCase();

  const patterns = {
    crisis_redirect: [
      /988/, /crisis/, /emergency/, /suicide/, /harm/, 
      /1-800-662-help/, /national helpline/
    ],
    pricing: [
      /cost/, /price/, /payment/, /afford/, /financial/, /fee/, /rate/
    ],
    availability: [
      /available/, /bed/, /space/, /capacity/, /openings/, /room/
    ],
    requirements: [
      /requirement/, /rule/, /policy/, /must/, /needed/, /necessary/
    ],
    application_process: [
      /apply/, /application/, /process/, /submit/, /intake/
    ],
    pre_intake: [
      /looking for/, /sobriety/, /support/, /timeline/, /ready/
    ],
    contact_info: [
      /contact/, /phone/, /email/, /address/, /reach/, /call/
    ],
    faq_general: [
      /about/, /mission/, /program/, /services/, /amenities/
    ]
  };

  for (const [category, regexList] of Object.entries(patterns)) {
    if (regexList.some(regex => regex.test(messageLower))) {
      return category;
    }
  }

  return "other";
}

async function generateConversationSummary(sessionId: string, clientId: string = "default-client"): Promise<string> {
  try {
    const analytics = await storage.getAnalytics(clientId);
    const sessionMessages = analytics
      .filter(a => a.sessionId === sessionId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      .slice(-10);
    
    if (sessionMessages.length === 0) {
      return "No conversation history available.";
    }

    const conversationText = sessionMessages
      .map(msg => `${msg.role}: ${sanitizePII(msg.content)}`)
      .join("\n");

    if (!openai) {
      return "AI service not configured - unable to generate summary.";
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that summarizes conversations between users and the HopeLine Assistant chatbot for a sober-living facility. Create a brief, professional summary (3-4 sentences) focusing on: their general situation, what they're seeking, their urgency level, and relevant context. DO NOT include specific personal details like names, phone numbers, or addresses in the summary."
        },
        {
          role: "user",
          content: `Summarize this conversation:\n\n${conversationText}`
        }
      ],
      max_completion_tokens: 200,
    });

    return completion.choices[0]?.message?.content || "Unable to generate summary.";
  } catch (error) {
    console.error("Conversation summary error:", error);
    return "Error generating conversation summary.";
  }
}

async function sendSmsNotification(
  phoneNumber: string,
  message: string,
  isClientConfirmation: boolean = false
): Promise<{ success: boolean; error?: string }> {
  try {
    const twilioConfig = getTwilioConfig();
    
    if (!twilioConfig) {
      console.log("📱 Twilio credentials not configured - skipping SMS notification");
      return { success: false, error: "Twilio not configured" };
    }
    
    const { accountSid: twilioAccountSid, authToken: twilioAuthToken, phoneNumber: twilioPhoneNumber } = twilioConfig;

    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`,
      {
        method: "POST",
        headers: {
          "Authorization": `Basic ${Buffer.from(`${twilioAccountSid}:${twilioAuthToken}`).toString('base64')}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          From: twilioPhoneNumber,
          To: phoneNumber,
          Body: message,
        }).toString(),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Twilio API error:", errorData);
      return { success: false, error: `Twilio API error: ${response.statusText}` };
    }

    console.log(`✅ SMS ${isClientConfirmation ? 'confirmation' : 'notification'} sent successfully to ${phoneNumber}`);
    return { success: true };
  } catch (error) {
    console.error("SMS notification error:", error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

async function sendEmailNotification(
  recipientEmails: string,
  appointment: any,
  conversationSummary: string,
  settings: any
): Promise<{ success: boolean; error?: string; sentTo?: string[] }> {
  try {
    const resendApiKey = getResendApiKey();
    
    if (!resendApiKey) {
      console.log("📧 Resend API key not configured - skipping email notification");
      return { success: false, error: "API key not configured" };
    }

    // Parse comma-separated emails into array
    const emailList = recipientEmails
      .split(",")
      .map(email => email.trim())
      .filter(email => email.length > 0);
    
    if (emailList.length === 0) {
      return { success: false, error: "No valid email addresses provided" };
    }

    const preIntakeInfo = appointment.lookingFor 
      ? `\n\nPre-Qualification Answers:
- Looking for: ${appointment.lookingFor === 'self' ? 'Themselves' : 'A loved one'}
- Sobriety status: ${appointment.sobrietyStatus || 'Not provided'}
- Financial support: ${appointment.hasSupport || 'Not provided'}
- Timeline: ${appointment.timeline || 'Not provided'}`
      : '';

    const appointmentTypeText = appointment.appointmentType === 'tour' 
      ? 'Tour' 
      : appointment.appointmentType === 'call' 
      ? 'Phone Call' 
      : 'Family Info Call';
    
    const contactPreferenceText = appointment.contactPreference === 'phone'
      ? 'Phone call'
      : appointment.contactPreference === 'text'
      ? 'Text message'
      : 'Email';

    const emailBody = `
<h2>New ${appointmentTypeText} Request</h2>

<h3>Contact Information:</h3>
<ul>
  <li><strong>Name:</strong> ${appointment.name}</li>
  <li><strong>Phone:</strong> ${appointment.contact}</li>
  ${appointment.email ? `<li><strong>Email:</strong> ${appointment.email}</li>` : ''}
  <li><strong>Contact Preference:</strong> ${contactPreferenceText}</li>
  <li><strong>Appointment Type:</strong> ${appointmentTypeText}</li>
  <li><strong>Preferred Time:</strong> ${appointment.preferredTime}</li>
  ${appointment.notes ? `<li><strong>Notes:</strong> ${appointment.notes}</li>` : ''}
</ul>

${preIntakeInfo}

<h3>Conversation Summary:</h3>
<p>${conversationSummary}</p>

<hr>
<p><small>This request was submitted through ${settings.businessName} HopeLine Assistant on ${new Date().toLocaleString()}</small></p>
    `.trim();

    // Send to all recipients using Resend's array support
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "HopeLine Assistant <onboarding@resend.dev>",
        to: emailList,
        subject: `New ${appointment.appointmentType} Request from ${appointment.name}`,
        html: emailBody,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Resend API error:", errorData);
      return { success: false, error: `Resend API error: ${response.statusText}` };
    }

    console.log(`✅ Email notification sent successfully to ${emailList.length} recipient(s): ${emailList.join(", ")}`);
    return { success: true, sentTo: emailList };
  } catch (error) {
    console.error("Email notification error:", error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

async function initStripe() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.log('Stripe: DATABASE_URL not set, skipping Stripe initialization');
    return;
  }

  try {
    console.log('Initializing Stripe schema...');
    const { runMigrations } = await import('stripe-replit-sync');
    await runMigrations({ databaseUrl });
    console.log('Stripe schema ready');

    const { getStripeSync } = await import('./stripeClient');
    const stripeSync = await getStripeSync();

    console.log('Setting up managed webhook...');
    const webhookBaseUrl = `https://${process.env.REPLIT_DOMAINS?.split(',')[0]}`;
    const { webhook, uuid } = await stripeSync.findOrCreateManagedWebhook(
      `${webhookBaseUrl}/api/stripe/webhook`,
      {
        enabled_events: ['*'],
        description: 'Managed webhook for Stripe sync',
      }
    );
    console.log(`Stripe webhook configured: ${webhook.url} (UUID: ${uuid})`);

    console.log('Syncing Stripe data in background...');
    stripeSync.syncBackfill()
      .then(() => {
        console.log('Stripe data synced');
      })
      .catch((err: Error) => {
        console.error('Error syncing Stripe data:', err);
      });
  } catch (error) {
    console.error('Failed to initialize Stripe:', error);
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  await ensureAdminUserExists();
  
  initStripe().catch(console.error);
  
  // =============================================
  // HEALTH CHECK ENDPOINT
  // =============================================
  
  app.get('/api/health', async (_req, res) => {
    try {
      // Check database connectivity
      const dbCheck = await storage.healthCheck?.() ?? { status: 'ok' };
      
      res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0',
        uptime: process.uptime(),
        database: dbCheck,
        environment: process.env.NODE_ENV || 'development',
      });
    } catch (error) {
      res.status(503).json({
        status: 'error',
        timestamp: new Date().toISOString(),
        error: 'Health check failed',
      });
    }
  });
  
  // =============================================
  // EMBEDDABLE CHAT WIDGET - Static Files & CORS
  // =============================================
  
  // CORS middleware for widget endpoints
  const widgetCors = (req: Request, res: Response, next: NextFunction) => {
    // Allow any origin to access widget resources (for embedding on client sites)
    const origin = req.headers.origin;
    if (origin) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    } else {
      res.setHeader('Access-Control-Allow-Origin', '*');
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Max-Age', '86400');
    
    if (req.method === 'OPTIONS') {
      return res.status(204).end();
    }
    next();
  };
  
  // Apply CORS to widget chat endpoint
  app.options('/api/chat/:clientId/:botId', widgetCors);
  app.use('/api/chat/:clientId/:botId', widgetCors);
  
  // Serve widget static files with proper headers
  const widgetPath = path.join(process.cwd(), 'public', 'widget');
  app.use('/widget', (req: Request, res: Response, next: NextFunction) => {
    // Set CORS headers for widget files
    const origin = req.headers.origin;
    if (origin) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    } else {
      res.setHeader('Access-Control-Allow-Origin', '*');
    }
    
    // Set appropriate content types
    const ext = path.extname(req.path).toLowerCase();
    if (ext === '.js') {
      res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
    } else if (ext === '.css') {
      res.setHeader('Content-Type', 'text/css; charset=utf-8');
    } else if (ext === '.html') {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
    }
    
    // Cache control for production
    if (process.env.NODE_ENV === 'production') {
      res.setHeader('Cache-Control', 'public, max-age=3600');
    }
    
    next();
  }, express.static(widgetPath));
  
  // Generate default quick actions based on bot type
  function getDefaultQuickActions(botType?: string, businessName?: string): Array<{id: string; label: string; labelEs?: string}> {
    const defaults: Record<string, Array<{id: string; label: string; labelEs?: string}>> = {
      'restaurant': [
        { id: 'menu', label: 'View Menu', labelEs: 'Ver Menú' },
        { id: 'hours', label: 'Hours & Location', labelEs: 'Horario y Ubicación' },
        { id: 'reservation', label: 'Make Reservation', labelEs: 'Hacer Reservación' },
        { id: 'specials', label: "Today's Specials", labelEs: 'Especiales del Día' },
        { id: 'delivery', label: 'Delivery Options', labelEs: 'Opciones de Entrega' },
        { id: 'contact', label: 'Contact Us', labelEs: 'Contáctenos' },
      ],
      'barber': [
        { id: 'services', label: 'Our Services', labelEs: 'Nuestros Servicios' },
        { id: 'pricing', label: 'Pricing', labelEs: 'Precios' },
        { id: 'appointment', label: 'Book Appointment', labelEs: 'Reservar Cita' },
        { id: 'hours', label: 'Hours & Location', labelEs: 'Horario y Ubicación' },
        { id: 'barbers', label: 'Our Barbers', labelEs: 'Nuestros Barberos' },
        { id: 'contact', label: 'Contact Us', labelEs: 'Contáctenos' },
      ],
      'gym': [
        { id: 'memberships', label: 'Membership Options', labelEs: 'Opciones de Membresía' },
        { id: 'classes', label: 'Class Schedule', labelEs: 'Horario de Clases' },
        { id: 'tour', label: 'Schedule Tour', labelEs: 'Agendar Tour' },
        { id: 'hours', label: 'Hours & Location', labelEs: 'Horario y Ubicación' },
        { id: 'trainers', label: 'Personal Trainers', labelEs: 'Entrenadores' },
        { id: 'contact', label: 'Contact Us', labelEs: 'Contáctenos' },
      ],
      'auto_shop': [
        { id: 'services', label: 'Our Services', labelEs: 'Nuestros Servicios' },
        { id: 'estimate', label: 'Get Estimate', labelEs: 'Obtener Cotización' },
        { id: 'appointment', label: 'Book Appointment', labelEs: 'Reservar Cita' },
        { id: 'hours', label: 'Hours & Location', labelEs: 'Horario y Ubicación' },
        { id: 'specials', label: 'Current Specials', labelEs: 'Especiales Actuales' },
        { id: 'contact', label: 'Contact Us', labelEs: 'Contáctenos' },
      ],
      'sober_living': [
        { id: 'about', label: `About ${businessName || 'Us'}`, labelEs: `Sobre ${businessName || 'Nosotros'}` },
        { id: 'requirements', label: 'Requirements', labelEs: 'Requisitos' },
        { id: 'availability', label: 'Availability', labelEs: 'Disponibilidad' },
        { id: 'pricing', label: 'Pricing', labelEs: 'Precios' },
        { id: 'tour', label: 'Request Tour', labelEs: 'Solicitar Tour' },
        { id: 'contact', label: 'Contact Info', labelEs: 'Información de Contacto' },
      ],
      'med_spa': [
        { id: 'treatments', label: 'Our Treatments', labelEs: 'Nuestros Tratamientos' },
        { id: 'pricing', label: 'Pricing', labelEs: 'Precios' },
        { id: 'consultation', label: 'Book Consultation', labelEs: 'Reservar Consulta' },
        { id: 'specials', label: 'Current Specials', labelEs: 'Especiales Actuales' },
        { id: 'hours', label: 'Hours & Location', labelEs: 'Horario y Ubicación' },
        { id: 'contact', label: 'Contact Us', labelEs: 'Contáctenos' },
      ],
      'real_estate': [
        { id: 'listings', label: 'View Listings', labelEs: 'Ver Propiedades' },
        { id: 'buying', label: 'Buying Help', labelEs: 'Ayuda para Comprar' },
        { id: 'selling', label: 'Selling Help', labelEs: 'Ayuda para Vender' },
        { id: 'schedule', label: 'Schedule Viewing', labelEs: 'Agendar Visita' },
        { id: 'valuation', label: 'Home Valuation', labelEs: 'Valuación de Casa' },
        { id: 'contact', label: 'Contact Agent', labelEs: 'Contactar Agente' },
      ],
      'home_services': [
        { id: 'services', label: 'Our Services', labelEs: 'Nuestros Servicios' },
        { id: 'quote', label: 'Get Free Quote', labelEs: 'Cotización Gratis' },
        { id: 'schedule', label: 'Schedule Service', labelEs: 'Agendar Servicio' },
        { id: 'areas', label: 'Service Areas', labelEs: 'Áreas de Servicio' },
        { id: 'reviews', label: 'Customer Reviews', labelEs: 'Reseñas de Clientes' },
        { id: 'contact', label: 'Contact Us', labelEs: 'Contáctenos' },
      ],
      'tattoo': [
        { id: 'portfolio', label: 'View Portfolio', labelEs: 'Ver Portafolio' },
        { id: 'artists', label: 'Our Artists', labelEs: 'Nuestros Artistas' },
        { id: 'consultation', label: 'Book Consultation', labelEs: 'Reservar Consulta' },
        { id: 'pricing', label: 'Pricing Info', labelEs: 'Información de Precios' },
        { id: 'aftercare', label: 'Aftercare Tips', labelEs: 'Consejos de Cuidado' },
        { id: 'contact', label: 'Contact Us', labelEs: 'Contáctenos' },
      ],
    };
    
    return defaults[botType || 'generic'] || [
      { id: 'services', label: 'Our Services', labelEs: 'Nuestros Servicios' },
      { id: 'pricing', label: 'Pricing', labelEs: 'Precios' },
      { id: 'hours', label: 'Hours & Location', labelEs: 'Horario y Ubicación' },
      { id: 'contact', label: 'Contact Us', labelEs: 'Contáctenos' },
      { id: 'appointment', label: 'Book Appointment', labelEs: 'Reservar Cita' },
      { id: 'faq', label: 'FAQs', labelEs: 'Preguntas Frecuentes' },
    ];
  }

  // Widget configuration endpoint
  app.get('/api/widget/config/:clientId/:botId', widgetCors, async (req, res) => {
    try {
      const { clientId, botId } = req.params;
      
      const botConfig = await getBotConfigAsync(clientId, botId);
      if (!botConfig) {
        return res.status(404).json({ error: 'Bot not found' });
      }
      
      const clientStatus = getClientStatus(clientId);
      if (clientStatus === 'paused') {
        return res.json({
          status: 'paused',
          message: 'This service is currently paused.'
        });
      }
      
      // Phase 2.4: Generate signed widget token (expires in 24 hours)
      const widgetToken = generateWidgetToken(clientId, botId, 86400);
      
      // Get quick actions - use bot config if set, otherwise use defaults based on bot type
      const quickActions = botConfig.quickActions && botConfig.quickActions.length > 0
        ? botConfig.quickActions
        : getDefaultQuickActions(botConfig.botType, botConfig.businessProfile?.businessName);
      
      // Return safe widget configuration (no sensitive data)
      res.json({
        status: 'active',
        botName: botConfig.name,
        businessName: botConfig.businessProfile?.businessName || botConfig.name,
        botTagline: `${botConfig.businessProfile?.businessName || 'AI'} Assistant`,
        welcomeMessage: `Hi! I'm the ${botConfig.businessProfile?.businessName || 'AI'} assistant. How can I help you today?`,
        primaryColor: '#2563eb',
        theme: 'dark',
        token: widgetToken,
        quickActions,
        enableHumanHandoff: true
      });
    } catch (error) {
      console.error('Widget config error:', error);
      res.status(500).json({ error: 'Failed to load widget configuration' });
    }
  });
  
  app.post("/api/chat", async (req, res) => {
    try {
      const validation = validateRequest(chatBodySchema, req.body);
      if (!validation.success) {
        return res.status(400).json({ error: validation.error });
      }
      const { messages, sessionId, language, clientId: bodyClientId, botId: bodyBotId } = validation.data;
      
      // Use clientId from body if provided, otherwise use default for backwards compatibility
      const effectiveClientId = bodyClientId || "default-client";

      if (sessionId && messages.length > 0) {
        const lastUserMessage = messages[messages.length - 1];
        if (lastUserMessage.role === "user") {
          await storage.logConversation(effectiveClientId, {
            sessionId,
            role: "user",
            content: sanitizePII(lastUserMessage.content),
            category: null
          });
          
          if (detectCrisisKeywords(lastUserMessage.content, language)) {
            const crisisReply = getCrisisResponse(language);
            
            await storage.logConversation(effectiveClientId, {
              sessionId,
              role: "assistant",
              content: sanitizePII(crisisReply),
              category: "crisis_redirect"
            });
            
            return res.json({ reply: crisisReply });
          }
        }
      }

      const systemPrompt = await getSystemPrompt(language, effectiveClientId);
      
      if (!openai) {
        return res.status(503).json({ error: "AI service not configured" });
      }

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages
        ],
        max_completion_tokens: 500,
      });

      const defaultReply = language === "es" 
        ? "Estoy aquí para ayudar. ¿Cómo puedo asistirte hoy?"
        : "I'm here to help. How can I assist you today?";
      const reply = completion.choices[0]?.message?.content || defaultReply;
      
      if (sessionId) {
        const category = categorizeMessage(reply, "assistant");
        await storage.logConversation(effectiveClientId, {
          sessionId,
          role: "assistant",
          content: sanitizePII(reply),
          category
        });
      }
      
      const lastUserMessage = messages[messages.length - 1];
      const userWantsToBook = lastUserMessage?.role === "user" && detectBookingIntent(lastUserMessage.content, language);
      
      res.json({ 
        reply,
        showAppointmentFlow: userWantsToBook
      });
    } catch (error) {
      console.error("Chat error:", error);
      res.status(500).json({ error: "Failed to process chat message" });
    }
  });

  // =============================================
  // MULTI-TENANT CHAT ENDPOINTS
  // =============================================

  // Multi-tenant chat endpoint: POST /api/chat/:clientId/:botId
  app.post("/api/chat/:clientId/:botId", async (req, res) => {
    const startTime = Date.now();
    
    try {
      // Validate params
      const paramsValidation = validateRequest(clientBotParamsSchema, req.params);
      if (!paramsValidation.success) {
        return res.status(400).json({ error: paramsValidation.error });
      }
      const { clientId, botId } = paramsValidation.data;
      
      // Phase 2.4: Validate widget token if provided (optional for backwards compatibility)
      const authHeader = req.headers.authorization;
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        const tokenResult = verifyWidgetToken(token);
        
        if (!tokenResult.valid) {
          return res.status(401).json({ error: 'Invalid widget token', details: tokenResult.error });
        }
        
        // Verify token matches URL params (prevent spoofing)
        if (tokenResult.clientId !== clientId || tokenResult.botId !== botId) {
          return res.status(403).json({ error: 'Token mismatch - clientId/botId does not match token' });
        }
      }
      // Note: Token validation is currently optional to maintain backwards compatibility
      // Enable strict mode by checking if token is required for each client via settings
      
      // Validate body
      const bodyValidation = validateRequest(chatBodySchema, req.body);
      if (!bodyValidation.success) {
        return res.status(400).json({ error: bodyValidation.error });
      }
      const { messages, sessionId, language } = bodyValidation.data;

      // Load bot configuration (try database first, then JSON fallback)
      const botConfig = await getBotConfigAsync(clientId, botId);
      if (!botConfig) {
        return res.status(404).json({ error: `Bot not found: ${clientId}/${botId}` });
      }

      // Check client status - only allow active clients to use the bot
      const clientStatus = getClientStatus(clientId);
      if (clientStatus === 'paused') {
        return res.status(503).json({ 
          error: "Service temporarily unavailable",
          message: "This service is currently paused. Please contact the business for more information.",
          status: 'paused'
        });
      }

      // Check plan limits before processing
      const limitCheck = await checkMessageLimit(clientId);
      if (!limitCheck.allowed) {
        return res.status(429).json({
          error: "Usage limit reached",
          message: limitCheck.reason,
          usage: limitCheck.usage
        });
      }

      const lastUserMessage = messages[messages.length - 1];
      const actualSessionId = sessionId || `session_${Date.now()}`;
      
      // Categorize the message topic
      const messageCategory = categorizeMessageTopic(lastUserMessage?.content || "");
      
      // Track session analytics
      const existingSession = await storage.getChatSession(actualSessionId, clientId, botId);
      const sessionData = {
        sessionId: actualSessionId,
        clientId,
        botId,
        startedAt: existingSession?.startedAt || new Date(),
        userMessageCount: (existingSession?.userMessageCount || 0) + 1,
        botMessageCount: existingSession?.botMessageCount || 0,
        totalResponseTimeMs: existingSession?.totalResponseTimeMs || 0,
        crisisDetected: existingSession?.crisisDetected || false,
        appointmentRequested: existingSession?.appointmentRequested || false,
        topics: [...(existingSession?.topics as string[] || [])],
      };
      
      // Add topic if not already tracked
      if (messageCategory && !sessionData.topics.includes(messageCategory)) {
        sessionData.topics.push(messageCategory);
      }
      
      // Check for crisis keywords using bot-specific configuration
      if (lastUserMessage?.role === "user" && detectCrisisInMessage(lastUserMessage.content, botConfig)) {
        const crisisReply = getBotCrisisResponse(botConfig);
        const responseTime = Date.now() - startTime;
        
        // Update session with crisis flag
        sessionData.crisisDetected = true;
        sessionData.botMessageCount += 1;
        sessionData.totalResponseTimeMs += responseTime;
        
        // Log analytics event for crisis
        await storage.logAnalyticsEvent({
          clientId,
          botId,
          sessionId: actualSessionId,
          eventType: 'crisis',
          actor: 'user',
          messageContent: lastUserMessage.content,
          category: 'crisis',
          responseTimeMs: responseTime,
          metadata: { language: language ?? "en" } as any,
        });
        
        await storage.createOrUpdateChatSession(sessionData);
        
        // Update daily analytics
        await storage.updateOrCreateDailyAnalytics({
          date: new Date().toISOString().split('T')[0],
          clientId,
          botId,
          totalConversations: existingSession ? 0 : 1,
          totalMessages: 2,
          userMessages: 1,
          botMessages: 1,
          crisisEvents: 1,
        });
        
        // Log to file
        logConversationToFile({
          timestamp: new Date().toISOString(),
          clientId,
          botId,
          sessionId: actualSessionId,
          userMessage: lastUserMessage.content,
          botReply: crisisReply
        });

        return res.json({ 
          reply: crisisReply,
          meta: { clientId, botId, crisis: true, sessionId: actualSessionId }
        });
      }

      // Process automations (keyword triggers, office hours, lead capture)
      const automationContext: AutomationContext = {
        clientId,
        botId,
        sessionId: actualSessionId,
        message: lastUserMessage?.content || "",
        messageCount: sessionData.userMessageCount,
        language,
        officeHours: botConfig.automations?.officeHours
      };
      
      const automationResult = processAutomations(
        automationContext, 
        botConfig.automations as BotAutomationConfig
      );
      
      // If automation triggered with a response and should not continue to AI
      if (automationResult.triggered && automationResult.response && !automationResult.shouldContinue) {
        const responseTime = Date.now() - startTime;
        
        // Update session data
        sessionData.botMessageCount += 1;
        sessionData.totalResponseTimeMs += responseTime;
        
        // Log automation-triggered response
        await storage.logAnalyticsEvent({
          clientId,
          botId,
          sessionId: actualSessionId,
          eventType: 'automation',
          actor: 'bot',
          messageContent: automationResult.response,
          responseTimeMs: responseTime,
          metadata: { 
            language,
            automationRuleId: automationResult.ruleId,
            automationType: automationResult.metadata?.type
          } as Record<string, any>,
        });
        
        await storage.createOrUpdateChatSession(sessionData);
        
        // Increment usage counters
        await incrementMessageCount(clientId);
        await incrementAutomationCount(clientId);
        
        // Log to file
        logConversationToFile({
          timestamp: new Date().toISOString(),
          clientId,
          botId,
          sessionId: actualSessionId,
          userMessage: lastUserMessage?.content || "",
          botReply: automationResult.response
        });

        return res.json({ 
          reply: automationResult.response,
          meta: { 
            clientId, 
            botId, 
            sessionId: actualSessionId,
            automation: true,
            ruleId: automationResult.ruleId
          }
        });
      }
      
      // Handle lead capture action (continue to AI but track the lead)
      if (automationResult.action?.type === 'capture_lead' && automationResult.action.payload) {
        await storage.logAnalyticsEvent({
          clientId,
          botId,
          sessionId: actualSessionId,
          eventType: 'lead_capture',
          actor: 'system',
          messageContent: lastUserMessage?.content || "",
          metadata: { 
            ...automationResult.action.payload,
            language
          } as any,
        });
        
        // Increment lead counter
        await incrementLeadCount(clientId);
      }

      // Build system prompt from bot config
      const systemPrompt = buildSystemPromptFromConfig(botConfig);

      if (!openai) {
        return res.status(503).json({ error: "AI service not configured" });
      }

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages
        ],
        max_completion_tokens: 500,
      });

      const defaultReply = language === "es" 
        ? "Estoy aquí para ayudar. ¿Cómo puedo asistirte hoy?"
        : "I'm here to help. How can I assist you today?";
      const reply = completion.choices[0]?.message?.content || defaultReply;
      const responseTime = Date.now() - startTime;
      
      // Update session data
      sessionData.botMessageCount += 1;
      sessionData.totalResponseTimeMs += responseTime;
      
      // Check if message mentions appointment
      const mentionsAppointment = /appointment|schedule|book|reserve|meeting/i.test(lastUserMessage?.content || "");
      if (mentionsAppointment) {
        sessionData.appointmentRequested = true;
      }

      // Log analytics events
      if (lastUserMessage?.role === "user") {
        await storage.logAnalyticsEvent({
          clientId,
          botId,
          sessionId: actualSessionId,
          eventType: 'message',
          actor: 'user',
          messageContent: lastUserMessage.content,
          category: messageCategory,
          metadata: { language: language ?? "en" } as any,
        });
      }
      
      await storage.logAnalyticsEvent({
        clientId,
        botId,
        sessionId: actualSessionId,
        eventType: 'message',
        actor: 'bot',
        messageContent: reply,
        responseTimeMs: responseTime,
        metadata: { language } as any,
      });
      
      await storage.createOrUpdateChatSession(sessionData);
      
      // Increment usage counter
      await incrementMessageCount(clientId);
      
      // Update daily analytics
      await storage.updateOrCreateDailyAnalytics({
        date: new Date().toISOString().split('T')[0],
        clientId,
        botId,
        totalConversations: existingSession ? 0 : 1,
        totalMessages: 2,
        userMessages: 1,
        botMessages: 1,
        appointmentRequests: mentionsAppointment ? 1 : 0,
      });

      // Log conversation to file
      if (lastUserMessage?.role === "user") {
        logConversationToFile({
          timestamp: new Date().toISOString(),
          clientId,
          botId,
          sessionId: actualSessionId,
          userMessage: lastUserMessage.content,
          botReply: reply
        });
      }

      // Auto-capture leads from qualifying chat sessions
      const contactInfo = extractContactInfo(messages);
      const conversationPreview = lastUserMessage?.content?.slice(0, 200) || '';
      
      // Run lead capture asynchronously to not slow down chat response
      autoCaptureLead(
        clientId,
        botId,
        actualSessionId,
        contactInfo,
        conversationPreview,
        sessionData.appointmentRequested || false
      ).catch(err => console.error('[Auto-Lead] Background capture failed:', err));

      // Check for external booking URL if booking intent detected
      let externalBookingUrl: string | null = null;
      if (mentionsAppointment) {
        const settings = await storage.getClientSettings(clientId);
        if (settings?.externalBookingUrl) {
          externalBookingUrl = settings.externalBookingUrl;
        }
      }

      res.json({ 
        reply,
        meta: { 
          clientId, 
          botId, 
          sessionId: actualSessionId, 
          responseTimeMs: responseTime,
          showBooking: mentionsAppointment,
          externalBookingUrl
        }
      });
    } catch (error) {
      console.error("Multi-tenant chat error:", error);
      res.status(500).json({ error: "Failed to process chat message" });
    }
  });

  // Streaming chat endpoint with SSE
  app.post("/api/chat/:clientId/:botId/stream", widgetCors, async (req, res) => {
    const startTime = Date.now();
    
    try {
      // Validate params
      const paramsValidation = validateRequest(clientBotParamsSchema, req.params);
      if (!paramsValidation.success) {
        return res.status(400).json({ error: paramsValidation.error });
      }
      const { clientId, botId } = paramsValidation.data;
      
      // Validate body
      const bodyValidation = validateRequest(chatBodySchema, req.body);
      if (!bodyValidation.success) {
        return res.status(400).json({ error: bodyValidation.error });
      }
      const { messages, sessionId, language } = bodyValidation.data;

      // Load bot configuration
      const botConfig = await getBotConfigAsync(clientId, botId);
      if (!botConfig) {
        return res.status(404).json({ error: `Bot not found: ${clientId}/${botId}` });
      }

      // Check client status
      const clientStatus = getClientStatus(clientId);
      if (clientStatus === 'paused') {
        return res.status(503).json({ 
          error: "Service temporarily unavailable",
          message: "This service is currently paused."
        });
      }

      // Check plan limits
      const limitCheck = await checkMessageLimit(clientId);
      if (!limitCheck.allowed) {
        return res.status(429).json({
          error: "Usage limit reached",
          message: limitCheck.reason
        });
      }

      const lastUserMessage = messages[messages.length - 1];
      const actualSessionId = sessionId || `session_${Date.now()}`;
      
      // Crisis detection (non-streamed response)
      if (lastUserMessage?.role === "user" && detectCrisisInMessage(lastUserMessage.content, botConfig)) {
        const crisisReply = getBotCrisisResponse(botConfig);
        return res.json({ 
          reply: crisisReply,
          meta: { clientId, botId, crisis: true, sessionId: actualSessionId }
        });
      }

      // Set up SSE headers
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.flushHeaders();

      // Build system prompt with suggested replies instruction
      const systemPrompt = buildSystemPromptFromConfig(botConfig);
      const enhancedPrompt = `${systemPrompt}

IMPORTANT: After your response, always include 2-3 suggested follow-up questions the user might want to ask. Format them as JSON at the very end of your response on a new line like this:
[SUGGESTIONS]{"replies":["Question 1?","Question 2?","Question 3?"]}[/SUGGESTIONS]
These suggestions should be relevant to what was just discussed and help guide the conversation.`;

      if (!openai) {
        res.write(`data: ${JSON.stringify({ type: 'error', error: 'AI service not configured' })}\n\n`);
        res.end();
        return;
      }

      let fullReply = '';
      
      // Create streaming completion
      const stream = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: enhancedPrompt },
          ...messages
        ],
        max_completion_tokens: 500,
        stream: true,
      });

      // Stream the response
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          fullReply += content;
          
          // Don't stream the suggestions metadata
          if (!content.includes('[SUGGESTIONS]') && !fullReply.includes('[SUGGESTIONS]')) {
            res.write(`data: ${JSON.stringify({ type: 'chunk', content })}\n\n`);
          }
        }
      }

      const responseTime = Date.now() - startTime;
      
      // Extract suggested replies from the response
      let suggestedReplies: string[] = [];
      let cleanReply = fullReply;
      
      const suggestionsMatch = fullReply.match(/\[SUGGESTIONS\](.*?)\[\/SUGGESTIONS\]/s);
      if (suggestionsMatch) {
        try {
          const suggestionsData = JSON.parse(suggestionsMatch[1]);
          suggestedReplies = suggestionsData.replies || [];
          cleanReply = fullReply.replace(/\[SUGGESTIONS\].*?\[\/SUGGESTIONS\]/s, '').trim();
        } catch (e) {
          console.error('Failed to parse suggestions:', e);
        }
      }

      // Send final message with metadata
      res.write(`data: ${JSON.stringify({ 
        type: 'done', 
        suggestedReplies,
        meta: { 
          clientId, 
          botId, 
          sessionId: actualSessionId, 
          responseTimeMs: responseTime 
        }
      })}\n\n`);
      
      res.end();

      // Async analytics and logging (after response is sent)
      const messageCategory = categorizeMessageTopic(lastUserMessage?.content || "");
      const existingSession = await storage.getChatSession(actualSessionId, clientId, botId);
      
      const sessionData = {
        sessionId: actualSessionId,
        clientId,
        botId,
        startedAt: existingSession?.startedAt || new Date(),
        userMessageCount: (existingSession?.userMessageCount || 0) + 1,
        botMessageCount: (existingSession?.botMessageCount || 0) + 1,
        totalResponseTimeMs: (existingSession?.totalResponseTimeMs || 0) + responseTime,
        crisisDetected: existingSession?.crisisDetected || false,
        appointmentRequested: existingSession?.appointmentRequested || false,
        topics: [...(existingSession?.topics as string[] || [])],
      };
      
      if (messageCategory && !sessionData.topics.includes(messageCategory)) {
        sessionData.topics.push(messageCategory);
      }

      await storage.createOrUpdateChatSession(sessionData);
      await incrementMessageCount(clientId);
      
      await storage.updateOrCreateDailyAnalytics({
        date: new Date().toISOString().split('T')[0],
        clientId,
        botId,
        totalConversations: existingSession ? 0 : 1,
        totalMessages: 2,
        userMessages: 1,
        botMessages: 1,
      });

      // Log to file
      logConversationToFile({
        timestamp: new Date().toISOString(),
        clientId,
        botId,
        sessionId: actualSessionId,
        userMessage: lastUserMessage?.content || "",
        botReply: cleanReply
      });

    } catch (error) {
      console.error("Streaming chat error:", error);
      if (!res.headersSent) {
        res.status(500).json({ error: "Failed to process chat message" });
      } else {
        res.write(`data: ${JSON.stringify({ type: 'error', message: 'Stream interrupted' })}\n\n`);
        res.end();
      }
    }
  });

  // Human handoff endpoint - marks session for human review
  app.post("/api/chat/:clientId/:botId/handoff", widgetCors, async (req, res) => {
    try {
      const paramsValidation = validateRequest(clientBotParamsSchema, req.params);
      if (!paramsValidation.success) {
        return res.status(400).json({ error: paramsValidation.error });
      }
      const { clientId, botId } = paramsValidation.data;
      
      const { sessionId, messages, contactInfo, reason, language } = req.body;
      
      if (!sessionId) {
        return res.status(400).json({ error: "Session ID is required" });
      }

      // Get bot configuration
      const botConfig = await getBotConfigAsync(clientId, botId);
      if (!botConfig) {
        return res.status(404).json({ error: "Bot not found" });
      }

      // Log analytics event for handoff request
      await storage.logAnalyticsEvent({
        clientId,
        botId,
        sessionId,
        eventType: 'human_handoff',
        actor: 'user',
        messageContent: reason || 'User requested to speak with a person',
        metadata: { 
          language,
          contactInfo: contactInfo || null,
          messageCount: messages?.length || 0
        } as any,
      });

      // Update session state to flag for human review
      await storage.updateSessionState(sessionId, {
        status: 'needs_attention',
        priority: 'high'
      });

      // Generate conversation summary for quick handoff context
      const lastMessages = (messages || []).slice(-5).map((m: any) => 
        `${m.role === 'user' ? 'User' : 'Bot'}: ${m.content.slice(0, 100)}...`
      ).join('\n');

      // Add note to session for staff
      await storage.createConversationNote({
        sessionId,
        clientId,
        botId,
        content: `Human handoff requested\nReason: ${reason || 'User clicked "Talk to a person"'}\nContact: ${contactInfo?.email || contactInfo?.phone || 'Not provided'}\n\nRecent conversation:\n${lastMessages}`,
        authorId: 'system',
        authorName: 'System',
        isPinned: true
      });

      // Get business contact info to show user
      const businessPhone = botConfig.businessProfile?.phone || null;
      const businessEmail = botConfig.businessProfile?.email || null;

      // Generate a ticket ID for tracking
      const ticketId = `HO-${Date.now().toString(36).toUpperCase()}`;

      res.json({
        success: true,
        ticketId,
        message: language === 'es' 
          ? 'Su solicitud ha sido recibida. Nuestro equipo se pondrá en contacto pronto.'
          : 'Your request has been received. Our team will reach out to you soon.',
        businessContact: {
          phone: businessPhone,
          email: businessEmail
        }
      });
    } catch (error) {
      console.error("Human handoff error:", error);
      res.status(500).json({ error: "Failed to process handoff request" });
    }
  });
  
  // Helper function to categorize messages by topic for analytics
  function categorizeMessageTopic(content: string): string {
    const lower = content.toLowerCase();
    
    if (/pric|cost|fee|pay|afford|money|\$/i.test(lower)) return 'pricing';
    if (/hour|open|close|time|when|schedule/i.test(lower)) return 'hours';
    if (/locat|address|where|direct|find/i.test(lower)) return 'location';
    if (/service|offer|provide|do you|can you/i.test(lower)) return 'services';
    if (/appointment|book|reserve|schedule|meet/i.test(lower)) return 'appointments';
    if (/help|support|assist|question/i.test(lower)) return 'support';
    if (/contact|call|email|phone|reach/i.test(lower)) return 'contact';
    if (/thank|great|good|awesome/i.test(lower)) return 'feedback';
    
    return 'general';
  }

  // Helper function to extract contact info from messages for auto-lead capture
  interface ExtractedContactInfo {
    email: string | null;
    phone: string | null;
    name: string | null;
  }

  function extractContactInfo(messages: Array<{ role: string; content: string }>): ExtractedContactInfo {
    const result: ExtractedContactInfo = { email: null, phone: null, name: null };
    
    // Combine all user messages
    const userText = messages
      .filter(m => m.role === 'user')
      .map(m => m.content)
      .join(' ');
    
    // Email pattern
    const emailMatch = userText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    if (emailMatch) {
      result.email = emailMatch[0].toLowerCase();
    }
    
    // Phone pattern (various formats)
    const phoneMatch = userText.match(/(?:\+1[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}/);
    if (phoneMatch) {
      // Clean up phone number
      result.phone = phoneMatch[0].replace(/[^\d+]/g, '');
    }
    
    // Try to extract name patterns like "my name is X", "I'm X", "I am X", "this is X"
    const namePatterns = [
      /(?:my name is|i'm|i am|this is|call me)\s+([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)?)/i,
      /^([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)?)\s+(?:here|speaking)/i,
    ];
    
    for (const pattern of namePatterns) {
      const nameMatch = userText.match(pattern);
      if (nameMatch && nameMatch[1]) {
        result.name = nameMatch[1].trim();
        break;
      }
    }
    
    return result;
  }

  // Auto-create or update lead from chat session
  async function autoCaptureLead(
    clientId: string,
    botId: string,
    sessionId: string,
    contactInfo: ExtractedContactInfo,
    conversationPreview: string,
    appointmentRequested: boolean
  ): Promise<void> {
    try {
      // Check if we have any qualifying info
      if (!contactInfo.email && !contactInfo.phone && !appointmentRequested) {
        return; // No qualifying info to create lead
      }
      
      // Check if lead already exists for this session or email/phone
      // SECURITY: Always scope by clientId to prevent cross-tenant data access
      const existingLeads = await storage.getLeads(clientId, { limit: 100 });
      
      // Look for existing lead by session, email, or phone - ONLY within this client's leads
      const existingLead = existingLeads.leads.find(lead => 
        // SECURITY: Double-check clientId matches to enforce tenant isolation
        lead.clientId === clientId && (
          lead.sessionId === sessionId ||
          (contactInfo.email && lead.email === contactInfo.email) ||
          (contactInfo.phone && lead.phone === contactInfo.phone)
        )
      );
      
      if (existingLead) {
        // SECURITY: Verify lead belongs to this client before updating
        if (existingLead.clientId !== clientId) {
          console.error(`[Auto-Lead] Security: Attempted to update lead ${existingLead.id} belonging to different client`);
          return;
        }
        
        // Update existing lead with new info
        const updates: Partial<typeof existingLead> = {
          sessionId, // Link to latest session
          conversationPreview,
        };
        
        if (contactInfo.name && !existingLead.name) updates.name = contactInfo.name;
        if (contactInfo.email && !existingLead.email) updates.email = contactInfo.email;
        if (contactInfo.phone && !existingLead.phone) updates.phone = contactInfo.phone;
        
        // Bump priority if appointment requested
        if (appointmentRequested && existingLead.priority !== 'high') {
          updates.priority = 'high';
        }
        
        await storage.updateLead(existingLead.id, updates);
        console.log(`[Auto-Lead] Updated existing lead ${existingLead.id} for session ${sessionId}`);
      } else {
        // Create new lead - always use the provided clientId/botId
        const newLead = await storage.createLead({
          clientId,
          botId,
          sessionId,
          name: contactInfo.name,
          email: contactInfo.email,
          phone: contactInfo.phone,
          source: 'chat',
          status: 'new',
          priority: appointmentRequested ? 'high' : 'medium',
          notes: null,
          tags: appointmentRequested ? ['appointment_request'] : [],
          metadata: {},
          conversationPreview,
          messageCount: null,
          lastContactedAt: null,
        });
        
        console.log(`[Auto-Lead] Created new lead ${newLead.id} for session ${sessionId}`);
        
        // Increment lead counter
        await incrementLeadCount(clientId);
        
        // Fire webhook for new lead (async, non-blocking)
        sendLeadCreatedWebhook(clientId, {
          id: newLead.id,
          name: newLead.name || 'Unknown',
          email: newLead.email,
          phone: newLead.phone,
          source: newLead.source,
          status: newLead.status,
          createdAt: newLead.createdAt,
        }).catch(err => console.error('[Webhook] Error sending lead webhook:', err));
      }
    } catch (error) {
      // Don't fail the chat request if lead capture fails
      console.error('[Auto-Lead] Error capturing lead:', error);
    }
  }

  // =============================================
  // DEMO BOT ENDPOINTS
  // =============================================

  // Get all demo bots
  app.get("/api/demos", (req, res) => {
    try {
      const demoBots = getDemoBots();
      const faithHouseBot = getBotConfig("faith_house", "faith_house_main");
      
      const allBots = faithHouseBot ? [faithHouseBot, ...demoBots] : demoBots;
      
      const botList = allBots.map(bot => ({
        botId: bot.botId,
        clientId: bot.clientId,
        name: bot.name,
        description: bot.description,
        businessType: bot.businessProfile.type,
        businessName: bot.businessProfile.businessName,
        isDemo: bot.metadata?.isDemo ?? (bot.clientId === 'demo')
      }));
      
      res.json({ bots: botList });
    } catch (error) {
      console.error("Get demos error:", error);
      res.status(500).json({ error: "Failed to fetch demo bots" });
    }
  });

  // Get specific bot config for demo UI
  app.get("/api/demo/:botId", (req, res) => {
    try {
      const { botId } = req.params;
      
      const botConfig = getBotConfigByBotId(botId);
      
      if (!botConfig) {
        return res.status(404).json({ error: `Bot not found: ${botId}` });
      }
      
      // Return config without sensitive system prompt details
      res.json({
        botId: botConfig.botId,
        clientId: botConfig.clientId,
        name: botConfig.name,
        description: botConfig.description,
        businessProfile: botConfig.businessProfile,
        faqs: botConfig.faqs,
        isDemo: botConfig.metadata?.isDemo ?? (botConfig.clientId === 'demo')
      });
    } catch (error) {
      console.error("Get demo bot error:", error);
      res.status(500).json({ error: "Failed to fetch demo bot" });
    }
  });

  // Get all clients and their bots (for admin panel)
  app.get("/api/platform/clients", (req, res) => {
    try {
      const clientsData = getClients();
      const allBots = getAllBotConfigs();
      
      const clientsWithBots = clientsData.clients.map(client => ({
        ...client,
        bots: allBots
          .filter(bot => bot.clientId === client.id)
          .map(bot => ({
            botId: bot.botId,
            name: bot.name,
            description: bot.description,
            businessType: bot.businessProfile.type,
            isDemo: bot.metadata?.isDemo ?? false
          }))
      }));
      
      res.json({ clients: clientsWithBots });
    } catch (error) {
      console.error("Get platform clients error:", error);
      res.status(500).json({ error: "Failed to fetch clients" });
    }
  });

  // Get bot config (pretty-printed for admin view)
  app.get("/api/platform/bots/:clientId/:botId", (req, res) => {
    try {
      const { clientId, botId } = req.params;
      
      const botConfig = getBotConfig(clientId, botId);
      
      if (!botConfig) {
        return res.status(404).json({ error: `Bot not found: ${clientId}/${botId}` });
      }
      
      res.json(botConfig);
    } catch (error) {
      console.error("Get bot config error:", error);
      res.status(500).json({ error: "Failed to fetch bot config" });
    }
  });

  // Get conversation logs for a client
  app.get("/api/platform/logs/:clientId", requireAuth, (req, res) => {
    try {
      const { clientId } = req.params;
      const { botId, date } = req.query;
      
      const logs = getConversationLogs(clientId, botId as string, date as string);
      const stats = getLogStats(clientId);
      
      res.json({ logs, stats });
    } catch (error) {
      console.error("Get logs error:", error);
      res.status(500).json({ error: "Failed to fetch logs" });
    }
  });

  app.post("/api/appointment", async (req, res) => {
    try {
      const { sessionId, conversationHistory, clientId: bodyClientId, ...appointmentData } = req.body;
      const validatedData = insertAppointmentSchema.parse(appointmentData);
      
      // Use clientId from body if provided, otherwise use default for backwards compatibility
      const effectiveClientId = bodyClientId || "default-client";
      
      let conversationSummary = "No conversation history available.";
      
      // First try to get summary from logged analytics (actual chat messages)
      if (sessionId) {
        conversationSummary = await generateConversationSummary(sessionId, effectiveClientId);
      }
      
      // If no analytics found, try to generate summary from frontend conversation history
      if (conversationSummary === "No conversation history available." && 
          conversationHistory && Array.isArray(conversationHistory) && conversationHistory.length > 0 && openai) {
        try {
          const conversationText = conversationHistory
            .map((msg: { role: string; content: string }) => `${msg.role}: ${sanitizePII(msg.content)}`)
            .join("\n");
          
          const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
              {
                role: "system",
                content: "You are a helpful assistant that summarizes conversations between users and the HopeLine Assistant chatbot for a sober-living facility. Create a brief, professional summary (3-4 sentences) focusing on: their general situation, what they're seeking, their urgency level, and relevant context. DO NOT include specific personal details like names, phone numbers, or addresses in the summary."
              },
              {
                role: "user",
                content: `Summarize this conversation:\n\n${conversationText}`
              }
            ],
            max_completion_tokens: 200,
          });
          
          conversationSummary = completion.choices[0]?.message?.content || "Unable to generate summary.";
        } catch (error) {
          console.error("Error generating summary from conversation history:", error);
        }
      }
      
      const appointment = await storage.createAppointment(effectiveClientId, {
        ...validatedData,
        conversationSummary
      } as any);
      
      const settings = await storage.getSettings(effectiveClientId);
      
      if (settings?.enableEmailNotifications && settings.notificationEmail) {
        const emailResult = await sendEmailNotification(
          settings.notificationEmail,
          appointment,
          conversationSummary,
          settings
        );
        if (!emailResult.success && emailResult.error !== "API key not configured") {
          console.warn(`Email notification failed: ${emailResult.error}`);
        }
      } else if (settings) {
        console.log("📧 Email notifications not enabled or no recipient configured");
      }
      
      if (settings?.enableSmsNotifications && settings.notificationPhone) {
        const appointmentTypeText = appointment.appointmentType === 'tour' 
          ? 'tour'
          : appointment.appointmentType === 'call'
          ? 'phone call'
          : 'family info call';
        
        const staffMessage = `New ${appointmentTypeText} request from ${appointment.name}. Contact: ${appointment.contact}. Preferred time: ${appointment.preferredTime}. Check admin dashboard for details.`;
        
        const smsResult = await sendSmsNotification(
          settings.notificationPhone,
          staffMessage,
          false
        );
        
        if (!smsResult.success && smsResult.error !== "Twilio not configured") {
          console.warn(`SMS staff notification failed: ${smsResult.error}`);
        }
        
        if (appointment.contactPreference === 'text' && appointment.contact) {
          const clientMessage = `Thank you for your ${appointmentTypeText} request at ${settings.businessName}. We'll reach out to you soon at your preferred time: ${appointment.preferredTime}. If you need immediate assistance, please call us.`;
          
          const clientSmsResult = await sendSmsNotification(
            appointment.contact,
            clientMessage,
            true
          );
          
          if (!clientSmsResult.success && clientSmsResult.error !== "Twilio not configured") {
            console.warn(`SMS client confirmation failed: ${clientSmsResult.error}`);
          }
        }
      }
      
      // Fire webhook for new appointment (async, non-blocking)
      sendAppointmentCreatedWebhook(effectiveClientId, {
        id: appointment.id,
        name: appointment.name,
        email: null, // appointment table doesn't have email column
        phone: appointment.contact,
        preferredDate: null,
        preferredTime: appointment.preferredTime,
        appointmentType: appointment.appointmentType,
        notes: appointment.notes,
        createdAt: appointment.createdAt,
      }).catch(err => console.error('[Webhook] Error sending appointment webhook:', err));
      
      res.json({ success: true, appointment });
    } catch (error) {
      console.error("Appointment error:", error);
      res.status(400).json({ error: "Failed to create appointment" });
    }
  });

  app.get("/api/appointments", requireAuth, async (req, res) => {
    try {
      const { status, startDate, endDate, search, limit, offset, clientId: queryClientId } = req.query;
      
      // Derive clientId: use session clientId for client_admin, query param for super_admin, fallback to default
      const clientId = req.session.clientId || (queryClientId as string) || "default-client";
      
      const filters: any = {};
      if (status) filters.status = status as string;
      if (startDate) filters.startDate = new Date(startDate as string);
      if (endDate) filters.endDate = new Date(endDate as string);
      if (search) filters.search = search as string;
      if (limit) filters.limit = parseInt(limit as string);
      if (offset) filters.offset = parseInt(offset as string);
      
      const result = await storage.getFilteredAppointments(clientId, filters);
      res.json(result);
    } catch (error) {
      console.error("Get appointments error:", error);
      res.status(500).json({ error: "Failed to fetch appointments" });
    }
  });

  app.get("/api/appointments/:id", requireAuth, async (req, res) => {
    try {
      const queryClientId = req.query.clientId as string | undefined;
      const clientId = req.session.clientId || queryClientId || "default-client";
      
      const appointment = await storage.getAppointmentById(clientId, req.params.id);
      if (!appointment) {
        return res.status(404).json({ error: "Appointment not found" });
      }
      res.json(appointment);
    } catch (error) {
      console.error("Get appointment error:", error);
      res.status(500).json({ error: "Failed to fetch appointment" });
    }
  });

  app.patch("/api/appointments/:id", requireAuth, async (req, res) => {
    try {
      // Validate params
      const paramsValidation = validateRequest(idParamSchema, req.params);
      if (!paramsValidation.success) {
        return res.status(400).json({ error: paramsValidation.error });
      }
      
      // Validate body
      const bodyValidation = validateRequest(appointmentUpdateSchema, req.body);
      if (!bodyValidation.success) {
        return res.status(400).json({ error: bodyValidation.error });
      }
      
      const updates = bodyValidation.data;
      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ error: "No valid fields to update" });
      }
      
      const queryClientId = req.query.clientId as string | undefined;
      const clientId = req.session.clientId || queryClientId || "default-client";
      
      const appointment = await storage.updateAppointment(clientId, paramsValidation.data.id, updates);
      res.json(appointment);
    } catch (error) {
      console.error("Update appointment error:", error);
      res.status(500).json({ error: "Failed to update appointment" });
    }
  });

  app.patch("/api/appointments/:id/status", requireAuth, async (req, res) => {
    try {
      // Validate params and body
      const paramsValidation = validateRequest(idParamSchema, req.params);
      if (!paramsValidation.success) {
        return res.status(400).json({ error: paramsValidation.error });
      }
      
      const bodyValidation = validateRequest(appointmentStatusSchema, req.body);
      if (!bodyValidation.success) {
        return res.status(400).json({ error: bodyValidation.error });
      }
      
      const queryClientId = req.query.clientId as string | undefined;
      const clientId = req.session.clientId || queryClientId || "default-client";
      
      await storage.updateAppointmentStatus(clientId, paramsValidation.data.id, bodyValidation.data.status);
      res.json({ success: true });
    } catch (error) {
      console.error("Update appointment status error:", error);
      res.status(500).json({ error: "Failed to update status" });
    }
  });

  app.delete("/api/appointments/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const queryClientId = req.query.clientId as string | undefined;
      const clientId = req.session.clientId || queryClientId || "default-client";
      
      await storage.deleteAppointment(clientId, id);
      res.json({ success: true });
    } catch (error) {
      console.error("Delete appointment error:", error);
      res.status(500).json({ error: "Failed to delete appointment" });
    }
  });

  app.get("/api/settings", requireSuperAdmin, async (req, res) => {
    try {
      const settings = await storage.getSettings("default-client");
      res.json(settings);
    } catch (error) {
      console.error("Get settings error:", error);
      res.status(500).json({ error: "Failed to fetch settings" });
    }
  });

  app.patch("/api/settings", requireSuperAdmin, async (req, res) => {
    try {
      const validatedData = insertClientSettingsSchema.partial().parse(req.body);
      const settings = await storage.updateSettings("default-client", validatedData);
      res.json(settings);
    } catch (error) {
      console.error("Update settings error:", error);
      res.status(400).json({ error: "Failed to update settings" });
    }
  });

  app.get("/api/analytics", requireAuth, async (req, res) => {
    try {
      const analytics = await storage.getAnalytics("default-client");
      res.json(analytics);
    } catch (error) {
      console.error("Get analytics error:", error);
      res.status(500).json({ error: "Failed to fetch analytics" });
    }
  });

  app.get("/api/analytics/summary", requireAuth, async (req, res) => {
    try {
      // Validate query params
      const queryValidation = validateRequest(analyticsDateRangeQuerySchema, req.query);
      if (!queryValidation.success) {
        return res.status(400).json({ error: queryValidation.error });
      }
      
      const { startDate, endDate } = queryValidation.data;
      const start = startDate ? new Date(startDate) : undefined;
      const end = endDate ? new Date(endDate) : undefined;
      
      const summary = await storage.getAnalyticsSummary("default-client", start, end);
      res.json(summary);
    } catch (error) {
      console.error("Get analytics summary error:", error);
      res.status(500).json({ error: "Failed to fetch analytics summary" });
    }
  });

  // CSV Export endpoint for analytics
  app.get("/api/analytics/export", requireAuth, async (req, res) => {
    try {
      const queryValidation = validateRequest(analyticsDateRangeQuerySchema, req.query);
      if (!queryValidation.success) {
        return res.status(400).json({ error: queryValidation.error });
      }
      
      const { startDate, endDate } = queryValidation.data;
      const start = startDate ? new Date(startDate) : undefined;
      const end = endDate ? new Date(endDate) : undefined;
      
      const summary = await storage.getAnalyticsSummary(start, end);
      
      // Build CSV content
      const headers = ['Date', 'Conversations', 'Appointments'];
      const rows = summary.dailyActivity.map(day => [
        day.date,
        day.conversations.toString(),
        day.appointments.toString()
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
      ].join('\n');

      // Add summary row
      const summaryRow = `\n\nSummary\nTotal Conversations,${summary.totalConversations}\nTotal Appointments,${summary.totalAppointments}\nConversion Rate,${summary.conversionRate.toFixed(1)}%\nCrisis Redirects,${summary.crisisRedirects}`;

      const fileName = `analytics_${startDate || 'all'}_to_${endDate || 'now'}.csv`;
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.send(csvContent + summaryRow);
    } catch (error) {
      console.error("Export analytics error:", error);
      res.status(500).json({ error: "Failed to export analytics" });
    }
  });

  app.post("/api/test-notification", requireSuperAdmin, async (req, res) => {
    try {
      const settings = await storage.getSettings();
      
      if (!settings) {
        return res.status(400).json({ error: "Settings not found" });
      }

      const testAppointment = {
        name: "Test User",
        contact: "test@example.com",
        preferredTime: new Date().toLocaleDateString(),
        appointmentType: "tour",
        notes: "This is a test notification",
        lookingFor: "self",
        sobrietyStatus: "30+ days sober",
        hasSupport: "Yes, family support",
        timeline: "Immediately"
      };

      const testSummary = "This is a test notification to verify your email configuration is working correctly.";

      if (settings.enableEmailNotifications && settings.notificationEmail) {
        const emailResult = await sendEmailNotification(
          settings.notificationEmail,
          testAppointment,
          testSummary,
          settings
        );
        
        if (emailResult.success) {
          return res.json({ 
            success: true, 
            message: `Test email sent successfully to ${settings.notificationEmail}` 
          });
        } else {
          return res.status(400).json({ 
            error: `Email failed: ${emailResult.error}` 
          });
        }
      } else {
        return res.status(400).json({ 
          error: "Email notifications are not enabled or no recipient email configured" 
        });
      }
    } catch (error) {
      console.error("Test notification error:", error);
      res.status(500).json({ error: "Failed to send test notification" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const validatedData = loginSchema.parse(req.body);
      const { username, password } = validatedData;

      const user = await storage.findAdminByUsername(username);
      
      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const isValid = await bcrypt.compare(password, user.passwordHash);
      
      if (!isValid) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      req.session.regenerate((err) => {
        if (err) {
          console.error("Session regeneration error:", err);
          return res.status(500).json({ error: "Session creation failed" });
        }
        req.session.userId = user.id;
        req.session.userRole = (user.role as AdminRole) || "client_admin";
        req.session.clientId = user.clientId || null;
        req.session.save((saveErr) => {
          if (saveErr) {
            console.error("Session save error:", saveErr);
            return res.status(500).json({ error: "Session save failed" });
          }
          res.json({ success: true, user: { id: user.id, username: user.username, role: user.role, clientId: user.clientId } });
        });
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid username or password format" });
      }
      console.error("Login error:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: "Logout failed" });
      }
      res.json({ success: true });
    });
  });

  app.get("/api/auth/check", (req, res) => {
    if (req.session.userId) {
      res.json({ authenticated: true });
    } else {
      res.json({ authenticated: false });
    }
  });

  app.get("/api/auth/me", requireAuth, async (req, res) => {
    try {
      const user = await db.select({
        id: adminUsers.id,
        username: adminUsers.username,
        role: adminUsers.role,
      }).from(adminUsers).where(eq(adminUsers.id, req.session.userId!)).limit(1);
      
      if (!user[0]) {
        return res.status(404).json({ error: "User not found" });
      }
      
      res.json(user[0]);
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  // =============================================
  // TEMPLATES API ENDPOINTS (Database-backed)
  // =============================================

  // Get all available bot templates
  app.get("/api/templates", async (req, res) => {
    try {
      const templates = await getAllTemplates();
      res.json(templates.map(t => ({
        id: t.id,
        templateId: t.templateId,
        name: t.name,
        description: t.description,
        botType: t.botType,
        icon: t.icon,
        previewImage: t.previewImage,
        isActive: t.isActive,
        displayOrder: t.displayOrder,
      })));
    } catch (error) {
      console.error("Get templates error:", error);
      res.status(500).json({ error: "Failed to fetch templates" });
    }
  });

  // Get a specific template by ID
  app.get("/api/templates/:templateId", async (req, res) => {
    try {
      const { templateId } = req.params;
      const template = await getTemplateById(templateId);
      
      if (!template) {
        return res.status(404).json({ error: `Template not found: ${templateId}` });
      }
      
      res.json(template);
    } catch (error) {
      console.error("Get template error:", error);
      res.status(500).json({ error: "Failed to fetch template" });
    }
  });

  // =============================================
  // WORKSPACES API ENDPOINTS (Database-backed)
  // =============================================

  // Get all workspaces (admin only)
  app.get("/api/workspaces", requireSuperAdmin, async (req, res) => {
    try {
      const workspaceList = await getWorkspaces();
      res.json(workspaceList);
    } catch (error) {
      console.error("Get workspaces error:", error);
      res.status(500).json({ error: "Failed to fetch workspaces" });
    }
  });

  // Get workspace by slug (super admin only until workspace membership is implemented)
  app.get("/api/workspaces/:slug", requireSuperAdmin, async (req, res) => {
    try {
      const { slug } = req.params;
      const workspace = await getWorkspaceBySlug(slug);
      
      if (!workspace) {
        return res.status(404).json({ error: `Workspace not found: ${slug}` });
      }
      
      res.json(workspace);
    } catch (error) {
      console.error("Get workspace error:", error);
      res.status(500).json({ error: "Failed to fetch workspace" });
    }
  });

  // Get bots for a workspace (super admin only until workspace membership is implemented)
  app.get("/api/workspaces/:workspaceId/bots", requireSuperAdmin, async (req, res) => {
    try {
      const { workspaceId } = req.params;
      const botConfigs = await getBotsByWorkspaceId(workspaceId);
      
      res.json(botConfigs.map(bot => ({
        botId: bot.botId,
        name: bot.name,
        description: bot.description,
        botType: bot.botType,
        businessName: bot.businessProfile.businessName,
        status: bot.metadata?.isDemo ? 'demo' : 'active',
      })));
    } catch (error) {
      console.error("Get workspace bots error:", error);
      res.status(500).json({ error: "Failed to fetch workspace bots" });
    }
  });

  // =============================================
  // SUPER ADMIN API ENDPOINTS
  // =============================================

  // Get list of clients with their bots (includes all from JSON configs)
  app.get("/api/super-admin/clients", requireSuperAdmin, async (req, res) => {
    try {
      // Get clients from JSON config
      const clientsData = getClients();
      const allBots = getAllBotConfigs();
      
      // Build client list with bots
      const clientsWithBots = clientsData.clients.map(client => ({
        id: client.id,
        name: client.name,
        status: client.status || 'active',
        type: client.type,
        bots: allBots
          .filter(bot => bot.clientId === client.id)
          .map(bot => ({
            botId: bot.botId,
            name: bot.name,
            description: bot.description,
            businessType: bot.businessProfile.type,
            businessName: bot.businessProfile.businessName,
            isDemo: bot.metadata?.isDemo ?? false
          }))
      }));
      
      res.json(clientsWithBots);
    } catch (error) {
      console.error("Get clients error:", error);
      res.status(500).json({ error: "Failed to fetch clients" });
    }
  });

  // Update client status (Active / Paused / Demo)
  app.put("/api/super-admin/clients/:clientId/status", requireSuperAdmin, async (req, res) => {
    try {
      const { clientId } = req.params;
      const { status } = req.body;
      
      if (!['active', 'paused', 'demo'].includes(status)) {
        return res.status(400).json({ error: "Status must be 'active', 'paused', or 'demo'" });
      }
      
      const result = updateClientStatus(clientId, status);
      
      if (result.success) {
        res.json({ 
          success: true, 
          client: result.client,
          message: `Client status updated to ${status}`
        });
      } else {
        res.status(404).json({ error: result.error || "Failed to update client status" });
      }
    } catch (error) {
      console.error("Update client status error:", error);
      res.status(500).json({ error: "Failed to update client status" });
    }
  });

  // Get all bots as a flat list for individual editing (includes full config with FAQs)
  app.get("/api/super-admin/bots", requireSuperAdmin, (req, res) => {
    try {
      const allBots = getAllBotConfigs();
      
      // Return full bot configs including FAQs, rules, etc.
      const botList = allBots.map(bot => ({
        botId: bot.botId,
        clientId: bot.clientId,
        name: bot.name,
        description: bot.description,
        businessProfile: bot.businessProfile,
        businessType: bot.businessProfile?.type,
        businessName: bot.businessProfile?.businessName,
        isDemo: bot.metadata?.isDemo ?? false,
        systemPrompt: bot.systemPrompt,
        faqs: bot.faqs || [],
        rules: bot.rules || {},
        automations: bot.automations || {},
        personality: bot.personality || {},
        quickActions: bot.quickActions || [],
        metadata: bot.metadata
      }));
      
      res.json(botList);
    } catch (error) {
      console.error("Get bots error:", error);
      res.status(500).json({ error: "Failed to fetch bots" });
    }
  });

  // Get individual bot config for editing
  app.get("/api/super-admin/bots/:botId", requireSuperAdmin, (req, res) => {
    try {
      const { botId } = req.params;
      const botConfig = getBotConfigByBotId(botId);
      
      if (!botConfig) {
        return res.status(404).json({ error: `Bot not found: ${botId}` });
      }
      
      res.json(botConfig);
    } catch (error) {
      console.error("Get bot config error:", error);
      res.status(500).json({ error: "Failed to fetch bot config" });
    }
  });

  // Update individual bot config
  app.put("/api/super-admin/bots/:botId", requireSuperAdmin, (req, res) => {
    try {
      const { botId } = req.params;
      const updates = req.body;
      
      const existingConfig = getBotConfigByBotId(botId);
      if (!existingConfig) {
        return res.status(404).json({ error: `Bot not found: ${botId}` });
      }
      
      const updatedConfig: BotConfig = {
        ...existingConfig,
        ...updates,
        botId: existingConfig.botId,
        clientId: existingConfig.clientId,
      };
      
      const success = saveBotConfig(botId, updatedConfig);
      
      if (success) {
        res.json({ success: true, config: updatedConfig });
      } else {
        res.status(500).json({ error: "Failed to save bot config" });
      }
    } catch (error) {
      console.error("Update bot config error:", error);
      res.status(500).json({ error: "Failed to update bot config" });
    }
  });

  // Create a new bot
  app.post("/api/super-admin/bots", requireSuperAdmin, async (req, res) => {
    try {
      // Validate request body
      const validation = validateRequest(createBotBodySchema, req.body);
      if (!validation.success) {
        return res.status(400).json({ error: validation.error });
      }
      const { 
        botId, 
        clientId, 
        name, 
        description, 
        businessProfile, 
        systemPrompt, 
        faqs, 
        rules,
        templateBotId 
      } = validation.data;
      
      // Check if botId already exists
      const existingBot = getBotConfigByBotId(botId);
      if (existingBot) {
        return res.status(409).json({ error: `Bot with ID '${botId}' already exists` });
      }
      
      // If cloning from a template, get the template config from database
      let newConfig: BotConfig;
      
      if (templateBotId) {
        // First try to get template from database (bot_templates table)
        const dbTemplate = await getTemplateById(templateBotId);
        
        // Fall back to bot config file if not in database
        const templateConfig = dbTemplate?.defaultConfig || getBotConfigByBotId(templateBotId);
        
        if (!templateConfig && !dbTemplate) {
          return res.status(404).json({ error: `Template bot not found: ${templateBotId}` });
        }
        
        // Use template data from database or config file
        const templateBusinessProfile = dbTemplate?.defaultConfig?.businessProfile || templateConfig?.businessProfile || {};
        const templateSystemPrompt = dbTemplate?.defaultConfig?.systemPrompt || templateConfig?.systemPrompt;
        const templateFaqs = dbTemplate?.defaultConfig?.faqs || templateConfig?.faqs;
        const templateRules = dbTemplate?.defaultConfig?.rules || templateConfig?.rules;
        const templateName = dbTemplate?.name || templateConfig?.name;
        
        // Clone template - merge businessProfile, inherit systemPrompt/FAQs/rules unless explicitly provided
        const mergedBusinessProfile = {
          ...templateBusinessProfile,
          ...businessProfile,
          businessName: businessProfile?.businessName || name || templateBusinessProfile?.businessName,
          type: businessProfile?.type || dbTemplate?.botType || templateBusinessProfile?.type,
          hours: businessProfile?.hours || templateBusinessProfile?.hours,
          services: (businessProfile?.services?.length ?? 0) > 0 ? businessProfile!.services : templateBusinessProfile?.services,
        };
        
        newConfig = {
          botId,
          clientId,
          name: name || templateName || 'New Bot',
          description: description || `AI assistant based on ${templateName}`,
          businessProfile: mergedBusinessProfile,
          systemPrompt: systemPrompt || templateSystemPrompt || `You are a helpful assistant for ${name}.`,
          faqs: faqs || templateFaqs || [],
          rules: (rules || templateRules || {}) as any,
        };
      } else {
        // Create from scratch with provided values
        const defaultBusinessProfile = {
          businessName: name,
          type: businessProfile?.type || "general",
          location: businessProfile?.location || "",
          phone: businessProfile?.phone || "",
          email: businessProfile?.email || "",
          website: businessProfile?.website || "",
          hours: businessProfile?.hours || { officeHours: "Mon-Fri 9am-5pm" },
          services: businessProfile?.services || [],
        };
        
        const defaultRules = {
          allowedTopics: ["general information", "services", "pricing", "contact methods", "hours of operation"],
          forbiddenTopics: ["medical advice", "legal advice", "financial advice"],
          crisisHandling: {
            onCrisisKeywords: ["emergency", "help me", "urgent"],
            responseTemplate: "If this is an emergency, please call 911 or your local emergency services immediately."
          }
        };
        
        const defaultSystemPrompt = `You are a helpful assistant for ${name}. Provide clear, friendly information about the business, its services, and how customers can get in touch. Be professional and helpful.`;
        
        newConfig = {
          botId,
          clientId,
          name,
          description: description || `AI assistant for ${name}`,
          businessProfile: { ...defaultBusinessProfile, ...businessProfile },
          systemPrompt: systemPrompt || defaultSystemPrompt,
          faqs: faqs || [],
          rules: (rules || defaultRules) as any,
        };
      }
      
      // Create the new bot config (use createBotConfig for new bots)
      const success = createBotConfig(newConfig);
      
      if (success) {
        // Create log directory for the new client
        const logDir = path.join(process.cwd(), 'logs', clientId);
        if (!fs.existsSync(logDir)) {
          fs.mkdirSync(logDir, { recursive: true });
        }
        
        // Automatically register the client if they don't exist
        const clientName = newConfig.businessProfile?.businessName || name;
        const businessType = newConfig.businessProfile?.type || 'general';
        const clientResult = registerClient(clientId, clientName, businessType, botId, 'active');
        
        if (!clientResult.success) {
          console.warn(`Warning: Bot created but client registration failed: ${clientResult.error}`);
        }
        
        res.status(201).json({ 
          success: true, 
          config: newConfig,
          client: clientResult.client || null,
          clientRegistered: clientResult.success
        });
      } else {
        res.status(500).json({ error: "Failed to save bot config" });
      }
    } catch (error) {
      console.error("Create bot error:", error);
      res.status(500).json({ error: "Failed to create bot" });
    }
  });

  // Get templates (demo bots with isTemplate flag or isDemo flag)
  app.get("/api/super-admin/templates", requireSuperAdmin, (req, res) => {
    try {
      const allBots = getAllBotConfigs();
      
      // Templates are bots with isTemplate or isDemo metadata flag
      const templates = allBots
        .filter(bot => bot.metadata?.isTemplate || bot.metadata?.isDemo || bot.clientId === 'demo')
        .map(bot => ({
          botId: bot.botId,
          clientId: bot.clientId,
          metadata: {
            name: bot.name,
            description: bot.description,
            businessType: bot.businessProfile?.type,
            isTemplate: true,
            templateCategory: bot.businessProfile?.type || bot.metadata?.templateCategory
          },
          businessProfile: bot.businessProfile,
          faqs: bot.faqs,
          safetyRules: bot.rules,
        }));
      
      res.json(templates);
    } catch (error) {
      console.error("Get templates error:", error);
      res.status(500).json({ error: "Failed to fetch templates" });
    }
  });

  // Create client from template (full workflow)
  app.post("/api/super-admin/clients/from-template", requireSuperAdmin, async (req, res) => {
    try {
      const { templateBotId, clientId, clientName, type, businessProfile, contact, billing, customFaqs } = req.body;
      
      // Validate required fields
      if (!templateBotId || !clientId || !clientName) {
        return res.status(400).json({ error: "templateBotId, clientId, and clientName are required" });
      }
      
      // Check if clientId already exists
      const existingClient = getClientById(clientId);
      if (existingClient) {
        return res.status(409).json({ error: `Client with ID '${clientId}' already exists` });
      }
      
      // Get template config
      const templateConfig = getBotConfigByBotId(templateBotId);
      if (!templateConfig) {
        return res.status(404).json({ error: `Template bot not found: ${templateBotId}` });
      }
      
      // Create new bot ID based on client ID
      const newBotId = `${clientId}_main`;
      
      // Check if bot already exists
      const existingBot = getBotConfigByBotId(newBotId);
      if (existingBot) {
        return res.status(409).json({ error: `Bot with ID '${newBotId}' already exists` });
      }
      
      // Clone template and apply overrides
      const mergedBusinessProfile = {
        ...templateConfig.businessProfile,
        ...(businessProfile || {}),
        businessName: clientName,
        type: type || templateConfig.businessProfile?.type,
      };
      
      // Merge FAQs if customFaqs provided
      const mergedFaqs = customFaqs && customFaqs.length > 0
        ? [...(templateConfig.faqs || []), ...customFaqs]
        : templateConfig.faqs;
      
      const newConfig: BotConfig = {
        ...templateConfig,
        botId: newBotId,
        clientId: clientId,
        name: clientName,
        description: `AI assistant for ${clientName}`,
        businessProfile: mergedBusinessProfile,
        faqs: mergedFaqs,
        metadata: {
          isDemo: false,
          isTemplate: false,
          clonedFrom: templateBotId,
          createdAt: new Date().toISOString().split('T')[0],
          version: '1.0',
        },
      };
      
      // Save the new bot config
      const saveSuccess = saveBotConfig(newBotId, newConfig);
      
      if (!saveSuccess) {
        return res.status(500).json({ error: "Failed to save bot config" });
      }
      
      // Create log directory
      const logDir = path.join(process.cwd(), 'logs', clientId);
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }
      
      // Register the new client
      const clientResult = registerClient(
        clientId, 
        clientName, 
        type || templateConfig.businessProfile?.type || 'general', 
        newBotId, 
        'active'
      );
      
      if (!clientResult.success) {
        return res.status(500).json({ error: clientResult.error || "Failed to register client" });
      }
      
      // Generate Stripe checkout URL for the new client (PDF requirement: "Stripe link generated")
      let checkoutUrl = null;
      try {
        const { stripeService } = await import('./stripeService');
        const email = businessProfile?.email || contact?.email || `${clientId}@placeholder.com`;
        
        // Create Stripe customer
        const customer = await stripeService.createCustomer(email, clientId, clientName);
        
        // Get default product/price for billing plan
        const products = await stripeService.listProductsWithPrices(true, 10, 0);
        if (products && products.length > 0) {
          const defaultProduct = products[0];
          const priceId = defaultProduct.price_id as string;
          
          if (priceId && typeof priceId === 'string') {
            const baseUrl = process.env.REPLIT_DEV_DOMAIN 
              ? `https://${process.env.REPLIT_DEV_DOMAIN}`
              : 'http://localhost:5000';
            
            const session = await stripeService.createCheckoutSession(
              customer.id,
              priceId,
              clientId,
              `${baseUrl}/super-admin/control-center?checkout=success&clientId=${clientId}`,
              `${baseUrl}/super-admin/control-center?checkout=canceled&clientId=${clientId}`
            );
            
            checkoutUrl = session.url;
          }
        }
      } catch (stripeError) {
        console.log("Stripe checkout generation skipped (not configured or no products):", stripeError);
        // Continue without Stripe - not a failure condition
      }
      
      res.status(201).json({ 
        success: true,
        clientId: clientId,
        client: clientResult.client,
        botId: newBotId,
        config: newConfig,
        checkoutUrl: checkoutUrl, // PDF: "Stripe link generated"
      });
    } catch (error) {
      console.error("Create client from template error:", error);
      res.status(500).json({ error: "Failed to create client from template" });
    }
  });

  // Get client general settings
  app.get("/api/super-admin/clients/:clientId/general", requireSuperAdmin, async (req, res) => {
    try {
      const { clientId } = req.params;
      const settings = await storage.getSettings(clientId);
      res.json({
        businessName: settings?.businessName || '',
        tagline: settings?.tagline || '',
        businessType: settings?.businessType || 'Sober Living',
        primaryPhone: settings?.primaryPhone || '',
        primaryEmail: settings?.primaryEmail || '',
        websiteUrl: settings?.websiteUrl || '',
        city: settings?.city || '',
        state: settings?.state || '',
        timezone: settings?.timezone || 'America/New_York',
        defaultContactMethod: settings?.defaultContactMethod || 'phone',
        internalNotes: settings?.internalNotes || '',
        status: settings?.status || 'active'
      });
    } catch (error) {
      console.error("Get general settings error:", error);
      res.status(500).json({ error: "Failed to fetch general settings" });
    }
  });

  // Update client general settings
  app.put("/api/super-admin/clients/:clientId/general", requireSuperAdmin, async (req, res) => {
    try {
      const { clientId } = req.params;
      const { businessName, tagline, businessType, primaryPhone, primaryEmail, 
              websiteUrl, city, state, timezone, defaultContactMethod, internalNotes, status } = req.body;
      
      const settings = await storage.updateSettings(clientId, {
        businessName,
        tagline,
        businessType,
        primaryPhone,
        primaryEmail,
        websiteUrl,
        city,
        state,
        timezone,
        defaultContactMethod,
        internalNotes,
        status
      });
      res.json(settings);
    } catch (error) {
      console.error("Update general settings error:", error);
      res.status(400).json({ error: "Failed to update general settings" });
    }
  });

  // Get client knowledge (FAQ entries + long-form sections)
  app.get("/api/super-admin/clients/:clientId/knowledge", requireSuperAdmin, async (req, res) => {
    try {
      const { clientId } = req.params;
      const settings = await storage.getSettings(clientId);
      res.json({
        faqEntries: settings?.faqEntries || [],
        longFormKnowledge: settings?.longFormKnowledge || {
          aboutProgram: '',
          houseRules: '',
          whoItsFor: '',
          paymentInfo: ''
        }
      });
    } catch (error) {
      console.error("Get knowledge error:", error);
      res.status(500).json({ error: "Failed to fetch knowledge" });
    }
  });

  // Add FAQ entry
  app.post("/api/super-admin/clients/:clientId/knowledge", requireSuperAdmin, async (req, res) => {
    try {
      const { clientId } = req.params;
      const { category, question, answer, active = true } = req.body;
      
      if (!category || !question || !answer) {
        return res.status(400).json({ error: "Category, question, and answer are required" });
      }
      
      const settings = await storage.getSettings(clientId);
      const faqEntries = settings?.faqEntries || [];
      
      const newEntry = {
        id: `faq-${Date.now()}`,
        category,
        question,
        answer,
        active
      };
      
      const updatedEntries = [...faqEntries, newEntry];
      await storage.updateSettings(clientId, { faqEntries: updatedEntries });
      
      res.json(newEntry);
    } catch (error) {
      console.error("Add FAQ error:", error);
      res.status(400).json({ error: "Failed to add FAQ" });
    }
  });

  // Update FAQ entry
  app.put("/api/super-admin/clients/:clientId/knowledge/:faqId", requireSuperAdmin, async (req, res) => {
    try {
      const { clientId } = req.params;
      const settings = await storage.getSettings(clientId);
      const faqEntries = settings?.faqEntries || [];
      
      const faqIndex = faqEntries.findIndex((f: any) => f.id === req.params.faqId);
      if (faqIndex === -1) {
        return res.status(404).json({ error: "FAQ not found" });
      }
      
      const updatedEntry = { ...faqEntries[faqIndex], ...req.body, id: req.params.faqId };
      faqEntries[faqIndex] = updatedEntry;
      
      await storage.updateSettings(clientId, { faqEntries });
      res.json(updatedEntry);
    } catch (error) {
      console.error("Update FAQ error:", error);
      res.status(400).json({ error: "Failed to update FAQ" });
    }
  });

  // Delete FAQ entry
  app.delete("/api/super-admin/clients/:clientId/knowledge/:faqId", requireSuperAdmin, async (req, res) => {
    try {
      const { clientId } = req.params;
      const settings = await storage.getSettings(clientId);
      const faqEntries = settings?.faqEntries || [];
      
      const updatedEntries = faqEntries.filter((f: any) => f.id !== req.params.faqId);
      await storage.updateSettings(clientId, { faqEntries: updatedEntries });
      
      res.json({ success: true });
    } catch (error) {
      console.error("Delete FAQ error:", error);
      res.status(400).json({ error: "Failed to delete FAQ" });
    }
  });

  // Update long-form knowledge
  app.put("/api/super-admin/clients/:clientId/knowledge/long-form", requireSuperAdmin, async (req, res) => {
    try {
      const { clientId } = req.params;
      const { aboutProgram, houseRules, whoItsFor, paymentInfo } = req.body;
      const settings = await storage.getSettings(clientId);
      
      const longFormKnowledge = {
        aboutProgram: aboutProgram ?? settings?.longFormKnowledge?.aboutProgram ?? '',
        houseRules: houseRules ?? settings?.longFormKnowledge?.houseRules ?? '',
        whoItsFor: whoItsFor ?? settings?.longFormKnowledge?.whoItsFor ?? '',
        paymentInfo: paymentInfo ?? settings?.longFormKnowledge?.paymentInfo ?? ''
      };
      
      await storage.updateSettings(clientId, { longFormKnowledge });
      res.json(longFormKnowledge);
    } catch (error) {
      console.error("Update long-form knowledge error:", error);
      res.status(400).json({ error: "Failed to update long-form knowledge" });
    }
  });

  // Get appointment types config
  app.get("/api/super-admin/clients/:clientId/appointment-types", requireSuperAdmin, async (req, res) => {
    try {
      const { clientId } = req.params;
      const settings = await storage.getSettings(clientId);
      res.json(settings?.appointmentTypesConfig || []);
    } catch (error) {
      console.error("Get appointment types error:", error);
      res.status(500).json({ error: "Failed to fetch appointment types" });
    }
  });

  // Update appointment types config (batch)
  app.put("/api/super-admin/clients/:clientId/appointment-types", requireSuperAdmin, async (req, res) => {
    try {
      const { clientId } = req.params;
      const appointmentTypesConfig = req.body;
      
      if (!Array.isArray(appointmentTypesConfig)) {
        return res.status(400).json({ error: "Appointment types must be an array" });
      }
      
      await storage.updateSettings(req.params.clientId, { appointmentTypesConfig });
      res.json(appointmentTypesConfig);
    } catch (error) {
      console.error("Update appointment types error:", error);
      res.status(400).json({ error: "Failed to update appointment types" });
    }
  });

  // Get pre-intake config
  app.get("/api/super-admin/clients/:clientId/pre-intake", requireSuperAdmin, async (req, res) => {
    try {
      const { clientId } = req.params;
      const settings = await storage.getSettings(clientId);
      res.json(settings?.preIntakeConfig || []);
    } catch (error) {
      console.error("Get pre-intake config error:", error);
      res.status(500).json({ error: "Failed to fetch pre-intake config" });
    }
  });

  // Update pre-intake config
  app.put("/api/super-admin/clients/:clientId/pre-intake", requireSuperAdmin, async (req, res) => {
    try {
      const { clientId } = req.params;
      const preIntakeConfig = req.body;
      
      if (!Array.isArray(preIntakeConfig)) {
        return res.status(400).json({ error: "Pre-intake config must be an array" });
      }
      
      await storage.updateSettings(clientId, { preIntakeConfig });
      res.json(preIntakeConfig);
    } catch (error) {
      console.error("Update pre-intake config error:", error);
      res.status(400).json({ error: "Failed to update pre-intake config" });
    }
  });

  // Get notification settings
  app.get("/api/super-admin/clients/:clientId/notifications", requireSuperAdmin, async (req, res) => {
    try {
      const { clientId } = req.params;
      const settings = await storage.getSettings(clientId);
      res.json(settings?.notificationSettings || {
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
      });
    } catch (error) {
      console.error("Get notification settings error:", error);
      res.status(500).json({ error: "Failed to fetch notification settings" });
    }
  });

  // Update notification settings
  app.put("/api/super-admin/clients/:clientId/notifications", requireSuperAdmin, async (req, res) => {
    try {
      const { clientId } = req.params;
      const notificationSettings = req.body;
      await storage.updateSettings(clientId, { notificationSettings });
      res.json(notificationSettings);
    } catch (error) {
      console.error("Update notification settings error:", error);
      res.status(400).json({ error: "Failed to update notification settings" });
    }
  });

  // ============================================
  // CLIENT DASHBOARD ENDPOINTS
  // ============================================

  // Get current client user's profile and business info
  app.get("/api/client/me", requireClientAuth, async (req, res) => {
    try {
      const user = await db.select({
        id: adminUsers.id,
        username: adminUsers.username,
        role: adminUsers.role,
        clientId: adminUsers.clientId,
      }).from(adminUsers).where(eq(adminUsers.id, req.session.userId!)).limit(1);
      
      if (!user[0]) {
        return res.status(404).json({ error: "User not found" });
      }

      const clientId = (req as any).effectiveClientId;
      let botConfig = null;
      let businessInfo = null;

      if (clientId) {
        // Try to find bot config for this client
        const allBots = getAllBotConfigs();
        botConfig = allBots.find(bot => bot.clientId === clientId);
        
        if (botConfig) {
          businessInfo = {
            name: botConfig.businessProfile?.businessName,
            type: botConfig.businessProfile?.type,
            location: botConfig.businessProfile?.location,
            phone: botConfig.businessProfile?.phone,
            hours: botConfig.businessProfile?.hours,
          };
        }
      }

      res.json({
        user: user[0],
        clientId,
        businessInfo,
        botId: botConfig?.botId,
      });
    } catch (error) {
      console.error("Get client profile error:", error);
      res.status(500).json({ error: "Failed to fetch profile" });
    }
  });

  // Update client settings (limited fields: phone, hours, location)
  app.patch("/api/client/settings", requireClientAuth, async (req, res) => {
    try {
      const clientId = (req as any).effectiveClientId;
      const { phone, hours, location } = req.body;
      
      // For now, we just log and acknowledge - actual bot config updates would require file writes
      // In a production system, this would update the database or config storage
      console.log(`Client ${clientId} settings update request:`, { phone, hours, location });
      
      // Return success - in production this would persist the changes
      res.json({
        success: true,
        message: "Settings update request received",
        updates: { phone, hours, location },
      });
    } catch (error) {
      console.error("Update client settings error:", error);
      res.status(500).json({ error: "Failed to update settings" });
    }
  });

  // =============================================
  // WEBHOOK SETTINGS ENDPOINTS
  // =============================================

  const webhookSettingsSchema = z.object({
    webhookUrl: z.string().url().nullable().optional(),
    webhookSecret: z.string().min(16).nullable().optional(),
    webhookEnabled: z.boolean().optional(),
    webhookEvents: z.object({
      newLead: z.boolean().optional(),
      newAppointment: z.boolean().optional(),
      chatSessionStart: z.boolean().optional(),
      chatSessionEnd: z.boolean().optional(),
      leadStatusChange: z.boolean().optional(),
    }).optional(),
    externalBookingUrl: z.string().url().nullable().optional(),
    externalPaymentUrl: z.string().url().nullable().optional(),
  });

  // Get webhook settings
  app.get("/api/client/webhooks", requireClientAuth, async (req, res) => {
    try {
      const clientId = (req as any).effectiveClientId;
      const settings = await storage.getSettings(clientId);
      
      if (!settings) {
        return res.json({
          webhookUrl: null,
          webhookSecret: null,
          webhookEnabled: false,
          webhookEvents: {
            newLead: true,
            newAppointment: true,
            chatSessionStart: false,
            chatSessionEnd: false,
            leadStatusChange: false,
          },
          externalBookingUrl: null,
          externalPaymentUrl: null,
        });
      }
      
      res.json({
        webhookUrl: settings.webhookUrl,
        webhookSecret: settings.webhookSecret ? '********' : null, // Mask the secret
        webhookEnabled: settings.webhookEnabled,
        webhookEvents: settings.webhookEvents ?? {
          newLead: true,
          newAppointment: true,
          chatSessionStart: false,
          chatSessionEnd: false,
          leadStatusChange: false,
        },
        externalBookingUrl: settings.externalBookingUrl,
        externalPaymentUrl: settings.externalPaymentUrl,
      });
    } catch (error) {
      console.error("Get webhook settings error:", error);
      res.status(500).json({ error: "Failed to fetch webhook settings" });
    }
  });

  // Update webhook settings
  app.patch("/api/client/webhooks", requireClientAuth, async (req, res) => {
    try {
      const clientId = (req as any).effectiveClientId;
      
      const validation = validateRequest(webhookSettingsSchema, req.body);
      if (!validation.success) {
        return res.status(400).json({ error: validation.error });
      }
      
      const updates: Record<string, any> = {};
      
      if (validation.data.webhookUrl !== undefined) {
        updates.webhookUrl = validation.data.webhookUrl;
      }
      if (validation.data.webhookSecret !== undefined) {
        updates.webhookSecret = validation.data.webhookSecret;
      }
      if (validation.data.webhookEnabled !== undefined) {
        updates.webhookEnabled = validation.data.webhookEnabled;
      }
      if (validation.data.webhookEvents !== undefined) {
        // Merge with existing events
        const currentSettings = await storage.getSettings(clientId);
        const currentEvents = currentSettings?.webhookEvents ?? {
          newLead: true,
          newAppointment: true,
          chatSessionStart: false,
          chatSessionEnd: false,
          leadStatusChange: false,
        };
        updates.webhookEvents = { ...currentEvents, ...validation.data.webhookEvents };
      }
      if (validation.data.externalBookingUrl !== undefined) {
        updates.externalBookingUrl = validation.data.externalBookingUrl;
      }
      if (validation.data.externalPaymentUrl !== undefined) {
        updates.externalPaymentUrl = validation.data.externalPaymentUrl;
      }
      
      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ error: "No valid updates provided" });
      }
      
      // Ensure client_settings record exists
      let settings = await storage.getSettings(clientId);
      if (!settings) {
        // Create default settings first
        await db.insert(clientSettings).values({
          clientId,
          businessName: 'My Business',
          tagline: 'Welcome!',
          knowledgeBase: { about: '', requirements: '', pricing: '', application: '' },
          operatingHours: {
            enabled: false,
            timezone: 'America/New_York',
            schedule: {
              monday: { open: '09:00', close: '17:00', enabled: true },
              tuesday: { open: '09:00', close: '17:00', enabled: true },
              wednesday: { open: '09:00', close: '17:00', enabled: true },
              thursday: { open: '09:00', close: '17:00', enabled: true },
              friday: { open: '09:00', close: '17:00', enabled: true },
              saturday: { open: '10:00', close: '14:00', enabled: false },
              sunday: { open: '10:00', close: '14:00', enabled: false },
            },
            afterHoursMessage: 'We are currently closed. Please leave a message.'
          },
        });
      }
      
      const updated = await storage.updateSettings(clientId, updates as any);
      
      res.json({
        success: true,
        webhookUrl: updated.webhookUrl,
        webhookSecret: updated.webhookSecret ? '********' : null,
        webhookEnabled: updated.webhookEnabled,
        webhookEvents: updated.webhookEvents,
        externalBookingUrl: updated.externalBookingUrl,
        externalPaymentUrl: updated.externalPaymentUrl,
      });
    } catch (error) {
      console.error("Update webhook settings error:", error);
      res.status(500).json({ error: "Failed to update webhook settings" });
    }
  });

  // Test webhook endpoint
  app.post("/api/client/webhooks/test", requireClientAuth, async (req, res) => {
    try {
      const clientId = (req as any).effectiveClientId;
      const result = await testWebhook(clientId);
      
      if (result.success) {
        res.json({
          success: true,
          message: `Test webhook delivered successfully (HTTP ${result.statusCode})`,
          statusCode: result.statusCode,
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error,
          statusCode: result.statusCode,
        });
      }
    } catch (error) {
      console.error("Test webhook error:", error);
      res.status(500).json({ error: "Failed to test webhook" });
    }
  });

  // Generate new webhook secret
  app.post("/api/client/webhooks/generate-secret", requireClientAuth, async (req, res) => {
    try {
      const clientId = (req as any).effectiveClientId;
      const newSecret = crypto.randomBytes(32).toString('hex');
      
      await storage.updateSettings(clientId, { webhookSecret: newSecret } as any);
      
      res.json({
        success: true,
        webhookSecret: newSecret,
        message: "New webhook secret generated. Save this value - it will only be shown once.",
      });
    } catch (error) {
      console.error("Generate webhook secret error:", error);
      res.status(500).json({ error: "Failed to generate webhook secret" });
    }
  });

  // Get client dashboard stats
  app.get("/api/client/stats", requireClientAuth, async (req, res) => {
    try {
      const clientId = (req as any).effectiveClientId;
      
      // Get bot config for this client
      const allBots = getAllBotConfigs();
      const botConfig = allBots.find(bot => bot.clientId === clientId);
      
      if (!botConfig) {
        return res.status(404).json({ error: "No bot found for this client" });
      }

      // Get conversation stats from file-based logs
      const logStats = getLogStats(clientId);
      
      // Get database stats for any valid client
      const appointments = await storage.getAllAppointments(clientId);
      const analytics = await storage.getAnalytics(clientId);
      
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(todayStart.getTime() - 7 * 24 * 60 * 60 * 1000);
      
      const dbStats = {
        totalAppointments: appointments.length,
        pendingAppointments: appointments.filter((a: any) => a.status === "new" || a.status === "pending").length,
        completedAppointments: appointments.filter((a: any) => a.status === "confirmed" || a.status === "completed").length,
        totalConversations: new Set(analytics.map((a: any) => a.sessionId)).size,
        totalMessages: analytics.length,
        weeklyConversations: new Set(analytics.filter((a: any) => new Date(a.createdAt) > weekAgo).map((a: any) => a.sessionId)).size,
      };

      res.json({
        clientId,
        botId: botConfig.botId,
        businessName: botConfig.businessProfile?.businessName,
        businessType: botConfig.businessProfile?.type,
        logStats,
        dbStats,
      });
    } catch (error) {
      console.error("Get client stats error:", error);
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  // Get client's conversation logs
  app.get("/api/client/conversations", requireClientAuth, async (req, res) => {
    try {
      // Validate query params
      const queryValidation = validateRequest(conversationsQuerySchema, req.query);
      if (!queryValidation.success) {
        return res.status(400).json({ error: queryValidation.error });
      }
      
      const clientId = (req as any).effectiveClientId;
      const { limit, offset } = queryValidation.data;
      
      // Get bot config for this client
      const allBots = getAllBotConfigs();
      const botConfig = allBots.find(bot => bot.clientId === clientId);
      
      if (!botConfig) {
        return res.status(404).json({ error: "No bot found for this client" });
      }

      // Get conversations from file-based logs
      const logs = getConversationLogs(clientId, botConfig.botId);
      
      // Get database analytics for any valid client
      const analytics = await storage.getAnalytics(clientId);
      
      // Group by sessionId to create conversation threads
      const sessionMap = new Map<string, any[]>();
      analytics.forEach(msg => {
        if (!sessionMap.has(msg.sessionId)) {
          sessionMap.set(msg.sessionId, []);
        }
        sessionMap.get(msg.sessionId)!.push(msg);
      });
      
      const dbConversations = Array.from(sessionMap.entries())
        .map(([sessionId, messages]) => ({
          sessionId,
          messageCount: messages.length,
          firstMessage: messages[0]?.createdAt,
          lastMessage: messages[messages.length - 1]?.createdAt,
          preview: messages[0]?.content?.substring(0, 100),
        }))
        .sort((a, b) => new Date(b.lastMessage).getTime() - new Date(a.lastMessage).getTime())
        .slice(offset, offset + limit);

      res.json({
        clientId,
        botId: botConfig.botId,
        fileLogs: logs,
        dbConversations,
      });
    } catch (error) {
      console.error("Get client conversations error:", error);
      res.status(500).json({ error: "Failed to fetch conversations" });
    }
  });

  // Get client's appointments (for business types that support them)
  app.get("/api/client/appointments", requireClientAuth, async (req, res) => {
    try {
      const clientId = (req as any).effectiveClientId;
      
      // Get appointments for any valid client
      const appointments = await storage.getAllAppointments(clientId);
      
      // Sort by creation date, most recent first
      const sortedAppointments = appointments.sort(
        (a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      res.json({
        clientId,
        appointments: sortedAppointments,
        total: appointments.length,
      });
    } catch (error) {
      console.error("Get client appointments error:", error);
      res.status(500).json({ error: "Failed to fetch appointments" });
    }
  });

  // Get bot configuration for the client (read-only view)
  app.get("/api/client/bot-config", requireClientAuth, async (req, res) => {
    try {
      const clientId = (req as any).effectiveClientId;
      
      const allBots = getAllBotConfigs();
      const botConfig = allBots.find(bot => bot.clientId === clientId);
      
      if (!botConfig) {
        return res.status(404).json({ error: "No bot found for this client" });
      }

      // Return a safe subset of the config (no internal prompts)
      res.json({
        botId: botConfig.botId,
        clientId: botConfig.clientId,
        businessName: botConfig.businessProfile?.businessName,
        businessType: botConfig.businessProfile?.type,
        businessProfile: botConfig.businessProfile,
        metadata: botConfig.metadata,
        faqs: botConfig.faqs,
      });
    } catch (error) {
      console.error("Get client bot config error:", error);
      res.status(500).json({ error: "Failed to fetch bot configuration" });
    }
  });

  // =============================================
  // CLIENT ANALYTICS ENDPOINTS
  // =============================================

  // Get analytics summary for client's bot
  app.get("/api/client/analytics/summary", requireClientAuth, async (req, res) => {
    try {
      // Validate query params
      const querySchema = z.object({
        botId: z.string().optional(),
        startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD format").optional(),
        endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD format").optional(),
      });
      const queryValidation = validateRequest(querySchema, req.query);
      if (!queryValidation.success) {
        return res.status(400).json({ error: queryValidation.error });
      }
      
      const clientId = (req as any).effectiveClientId;
      const { botId, startDate, endDate } = queryValidation.data;
      const start = startDate ? new Date(startDate) : undefined;
      const end = endDate ? new Date(endDate) : undefined;
      
      const summary = await storage.getClientAnalyticsSummary(clientId, botId, start, end);
      
      res.json({
        clientId,
        botId: botId || 'all',
        ...summary,
      });
    } catch (error) {
      console.error("Get client analytics summary error:", error);
      res.status(500).json({ error: "Failed to fetch analytics summary" });
    }
  });

  // Get daily analytics trends for client
  app.get("/api/client/analytics/trends", requireClientAuth, async (req, res) => {
    try {
      // Validate query params
      const queryValidation = validateRequest(analyticsTrendsQuerySchema, req.query);
      if (!queryValidation.success) {
        return res.status(400).json({ error: queryValidation.error });
      }
      
      const clientId = (req as any).effectiveClientId;
      const { botId, days } = queryValidation.data;
      
      const trends = await storage.getClientDailyTrends(clientId, botId, days);
      
      // Fill in missing days with zeros
      const now = new Date();
      const filledTrends: any[] = [];
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        const existing = trends.find(t => t.date === dateStr);
        if (existing) {
          filledTrends.push(existing);
        } else {
          filledTrends.push({
            date: dateStr,
            clientId,
            botId: botId || 'all',
            totalConversations: 0,
            totalMessages: 0,
            userMessages: 0,
            botMessages: 0,
            avgResponseTimeMs: 0,
            crisisEvents: 0,
            appointmentRequests: 0,
          });
        }
      }
      
      res.json({
        clientId,
        botId: botId || 'all',
        days,
        trends: filledTrends,
      });
    } catch (error) {
      console.error("Get client analytics trends error:", error);
      res.status(500).json({ error: "Failed to fetch analytics trends" });
    }
  });

  // Get recent chat sessions for client
  app.get("/api/client/analytics/sessions", requireClientAuth, async (req, res) => {
    try {
      // Validate query params
      const queryValidation = validateRequest(analyticsSessionsQuerySchema, req.query);
      if (!queryValidation.success) {
        return res.status(400).json({ error: queryValidation.error });
      }
      
      const clientId = (req as any).effectiveClientId;
      const { botId, limit } = queryValidation.data;
      
      const sessions = await storage.getClientRecentSessions(clientId, botId, limit);
      
      res.json({
        clientId,
        botId: botId || 'all',
        sessions,
        total: sessions.length,
      });
    } catch (error) {
      console.error("Get client analytics sessions error:", error);
      res.status(500).json({ error: "Failed to fetch chat sessions" });
    }
  });

  // =============================================
  // CLIENT ANALYTICS EXPORT ENDPOINTS
  // =============================================

  // Export client analytics trends to CSV
  app.get("/api/client/analytics/export", requireClientAuth, async (req, res) => {
    try {
      const queryValidation = validateRequest(analyticsTrendsQuerySchema, req.query);
      if (!queryValidation.success) {
        return res.status(400).json({ error: queryValidation.error });
      }
      
      const clientId = (req as any).effectiveClientId;
      const { botId, days } = queryValidation.data;
      
      const trends = await storage.getClientDailyTrends(clientId, botId, days);
      const summary = await storage.getClientAnalyticsSummary(clientId, botId);
      
      // Build CSV content
      const headers = ['Date', 'Conversations', 'Messages', 'User Messages', 'Bot Messages', 'Crisis Events', 'Appointments'];
      const rows = trends.map(day => [
        day.date,
        day.totalConversations.toString(),
        day.totalMessages.toString(),
        day.userMessages.toString(),
        day.botMessages.toString(),
        day.crisisEvents.toString(),
        day.appointmentRequests.toString()
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
      ].join('\n');

      // Add summary
      const summarySection = `\n\nSummary\nTotal Conversations,${summary.totalConversations}\nTotal Messages,${summary.totalMessages}\nUser Messages,${summary.userMessages}\nBot Messages,${summary.botMessages}\nAvg Response Time (ms),${summary.avgResponseTimeMs}\nCrisis Events,${summary.crisisEvents}\nAppointment Requests,${summary.appointmentRequests}`;

      const fileName = `analytics_${clientId}_last${days}days.csv`;
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.send(csvContent + summarySection);
    } catch (error) {
      console.error("Export client analytics error:", error);
      res.status(500).json({ error: "Failed to export analytics" });
    }
  });

  // Export leads to CSV
  app.get("/api/client/leads/export", requireClientAuth, async (req, res) => {
    try {
      const clientId = (req as any).effectiveClientId;
      const { leads } = await storage.getLeads(clientId, { limit: 10000 });
      
      // Build CSV content
      const headers = ['Name', 'Email', 'Phone', 'Status', 'Priority', 'Source', 'Created At', 'Last Contacted'];
      const rows = leads.map(lead => [
        `"${(lead.name || '').replace(/"/g, '""')}"`,
        lead.email || '',
        lead.phone || '',
        lead.status,
        lead.priority,
        lead.source,
        lead.createdAt ? new Date(lead.createdAt).toISOString() : '',
        lead.lastContactedAt ? new Date(lead.lastContactedAt).toISOString() : ''
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
      ].join('\n');

      const fileName = `leads_${clientId}_${new Date().toISOString().split('T')[0]}.csv`;
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.send(csvContent);
    } catch (error) {
      console.error("Export leads error:", error);
      res.status(500).json({ error: "Failed to export leads" });
    }
  });

  // Export sessions to CSV
  app.get("/api/client/analytics/sessions/export", requireClientAuth, async (req, res) => {
    try {
      const clientId = (req as any).effectiveClientId;
      const queryValidation = validateRequest(analyticsSessionsQuerySchema, req.query);
      if (!queryValidation.success) {
        return res.status(400).json({ error: queryValidation.error });
      }
      
      const { botId, limit } = queryValidation.data;
      const sessions = await storage.getClientRecentSessions(clientId, botId, limit);
      
      // Build CSV content
      const headers = ['Session ID', 'Bot ID', 'Started At', 'User Messages', 'Bot Messages', 'Crisis Detected', 'Appointment Requested', 'Topics'];
      const rows = sessions.map(session => [
        session.sessionId,
        session.botId,
        session.startedAt ? new Date(session.startedAt).toISOString() : '',
        session.userMessageCount.toString(),
        session.botMessageCount.toString(),
        session.crisisDetected ? 'Yes' : 'No',
        session.appointmentRequested ? 'Yes' : 'No',
        `"${(session.topics as string[] || []).join(', ')}"`
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
      ].join('\n');

      const fileName = `sessions_${clientId}_${new Date().toISOString().split('T')[0]}.csv`;
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.send(csvContent);
    } catch (error) {
      console.error("Export sessions error:", error);
      res.status(500).json({ error: "Failed to export sessions" });
    }
  });

  // =============================================
  // CLIENT INBOX ENDPOINTS
  // =============================================

  // Get messages for a specific session
  app.get("/api/client/inbox/sessions/:sessionId", requireClientAuth, async (req, res) => {
    try {
      const clientId = (req as any).effectiveClientId;
      const { sessionId } = req.params;
      
      const messages = await storage.getSessionMessages(sessionId, clientId);
      
      res.json({
        clientId,
        sessionId,
        messages,
        total: messages.length,
      });
    } catch (error) {
      console.error("Get session messages error:", error);
      res.status(500).json({ error: "Failed to fetch session messages" });
    }
  });

  // =============================================
  // CONVERSATION NOTES ENDPOINTS
  // =============================================

  const createNoteSchema = z.object({
    sessionId: z.string().min(1),
    botId: z.string().min(1),
    content: z.string().min(1),
    isPinned: z.boolean().optional(),
  });

  // Get notes for a session
  app.get("/api/client/inbox/sessions/:sessionId/notes", requireClientAuth, async (req, res) => {
    try {
      const clientId = (req as any).effectiveClientId;
      const { sessionId } = req.params;
      
      const notes = await storage.getConversationNotes(sessionId, clientId);
      res.json({ notes });
    } catch (error) {
      console.error("Get notes error:", error);
      res.status(500).json({ error: "Failed to fetch notes" });
    }
  });

  // Create a note
  app.post("/api/client/inbox/sessions/:sessionId/notes", requireClientAuth, async (req, res) => {
    try {
      const clientId = (req as any).effectiveClientId;
      const { sessionId } = req.params;
      const user = (req as any).user;
      
      const bodyValidation = validateRequest(createNoteSchema, { ...req.body, sessionId });
      if (!bodyValidation.success) {
        return res.status(400).json({ error: bodyValidation.error });
      }
      
      const note = await storage.createConversationNote({
        sessionId,
        clientId,
        botId: bodyValidation.data.botId,
        content: bodyValidation.data.content,
        authorId: user?.id || 'unknown',
        authorName: user?.username || 'Unknown User',
        isPinned: bodyValidation.data.isPinned || false,
      });
      
      res.status(201).json(note);
    } catch (error) {
      console.error("Create note error:", error);
      res.status(500).json({ error: "Failed to create note" });
    }
  });

  // Update a note
  app.patch("/api/client/inbox/notes/:noteId", requireClientAuth, async (req, res) => {
    try {
      const { noteId } = req.params;
      const { content, isPinned } = req.body;
      
      const updates: any = {};
      if (content !== undefined) updates.content = content;
      if (isPinned !== undefined) updates.isPinned = isPinned;
      
      const note = await storage.updateConversationNote(noteId, updates);
      res.json(note);
    } catch (error) {
      console.error("Update note error:", error);
      res.status(500).json({ error: "Failed to update note" });
    }
  });

  // Delete a note
  app.delete("/api/client/inbox/notes/:noteId", requireClientAuth, async (req, res) => {
    try {
      await storage.deleteConversationNote(req.params.noteId);
      res.status(204).send();
    } catch (error) {
      console.error("Delete note error:", error);
      res.status(500).json({ error: "Failed to delete note" });
    }
  });

  // =============================================
  // SESSION STATE ENDPOINTS
  // =============================================

  // Get or create session state
  app.get("/api/client/inbox/sessions/:sessionId/state", requireClientAuth, async (req, res) => {
    try {
      const clientId = (req as any).effectiveClientId;
      const { sessionId } = req.params;
      const { botId } = req.query;
      
      const state = await storage.getOrCreateSessionState(
        sessionId, 
        clientId, 
        (botId as string) || 'unknown'
      );
      res.json(state);
    } catch (error) {
      console.error("Get session state error:", error);
      res.status(500).json({ error: "Failed to fetch session state" });
    }
  });

  // Update session state (mark as read, change status, etc.)
  app.patch("/api/client/inbox/sessions/:sessionId/state", requireClientAuth, async (req, res) => {
    try {
      const clientId = (req as any).effectiveClientId;
      const { sessionId } = req.params;
      const user = (req as any).user;
      const { status, isRead, priority, assignedToUserId, tags } = req.body;
      
      const updates: any = {};
      if (status !== undefined) updates.status = status;
      if (isRead !== undefined) {
        updates.isRead = isRead;
        if (isRead) {
          updates.readAt = new Date();
          updates.readByUserId = user?.id;
        }
      }
      if (priority !== undefined) updates.priority = priority;
      if (assignedToUserId !== undefined) {
        updates.assignedToUserId = assignedToUserId;
        updates.assignedAt = new Date();
      }
      if (tags !== undefined) updates.tags = tags;
      
      const state = await storage.updateSessionState(sessionId, updates);
      res.json(state);
    } catch (error) {
      console.error("Update session state error:", error);
      res.status(500).json({ error: "Failed to update session state" });
    }
  });

  // Get all session states for filtering
  app.get("/api/client/inbox/states", requireClientAuth, async (req, res) => {
    try {
      const clientId = (req as any).effectiveClientId;
      const { status, isRead, assignedToUserId } = req.query;
      
      const states = await storage.getSessionStates(clientId, {
        status: status as string | undefined,
        isRead: isRead === 'true' ? true : isRead === 'false' ? false : undefined,
        assignedToUserId: assignedToUserId as string | undefined,
      });
      
      res.json({ states });
    } catch (error) {
      console.error("Get session states error:", error);
      res.status(500).json({ error: "Failed to fetch session states" });
    }
  });

  // Get client usage summary (plan limits and current usage)
  app.get("/api/client/usage", requireClientAuth, async (req, res) => {
    try {
      const clientId = (req as any).effectiveClientId;
      const usageSummary = await getUsageSummary(clientId);
      
      res.json({
        clientId,
        ...usageSummary,
      });
    } catch (error) {
      console.error("Get client usage error:", error);
      res.status(500).json({ error: "Failed to fetch usage summary" });
    }
  });

  // =============================================
  // CLIENT BILLING ENDPOINTS
  // =============================================

  // Get client subscription info
  app.get("/api/client/billing", requireClientAuth, async (req, res) => {
    try {
      const clientId = (req as any).effectiveClientId;
      
      const { stripeService } = await import('./stripeService');
      const subscription = await stripeService.getSubscriptionByClientId(clientId);
      const customer = await stripeService.getCustomerByClientId(clientId);
      
      // Get workspace info for plan name
      const workspace = await storage.getWorkspaceByClientId(clientId);
      
      res.json({
        clientId,
        hasSubscription: !!subscription,
        subscription: subscription ? {
          id: (subscription as any).id,
          status: (subscription as any).status,
          currentPeriodEnd: (subscription as any).currentPeriodEnd,
          cancelAtPeriodEnd: (subscription as any).cancelAtPeriodEnd,
        } : null,
        customer: customer ? {
          id: (customer as any).id,
          email: (customer as any).email,
        } : null,
        plan: workspace?.plan || 'starter',
        planName: workspace?.plan === 'pro' ? 'Pro Plan' : workspace?.plan === 'enterprise' ? 'Enterprise Plan' : 'Starter Plan',
      });
    } catch (error) {
      console.error("Get client billing error:", error);
      res.status(500).json({ error: "Failed to fetch billing info" });
    }
  });

  // Create customer portal session for client
  app.post("/api/client/billing/portal", requireClientAuth, async (req, res) => {
    try {
      const clientId = (req as any).effectiveClientId;
      
      const { stripeService } = await import('./stripeService');
      const customer = await stripeService.getCustomerByClientId(clientId);
      
      if (!customer) {
        return res.status(404).json({ error: "No billing account found. Please contact support." });
      }

      const protocol = req.headers['x-forwarded-proto'] || 'https';
      const host = req.headers.host;
      const returnUrl = `${protocol}://${host}/client/dashboard`;

      const session = await stripeService.createCustomerPortalSession(
        (customer as any).id,
        returnUrl
      );

      res.json({ url: session.url });
    } catch (error) {
      console.error("Create client portal session error:", error);
      res.status(500).json({ error: "Failed to open billing portal" });
    }
  });

  // =============================================
  // CLIENT ACCOUNT SETTINGS ENDPOINTS
  // =============================================

  // Zod schemas for account settings
  const passwordChangeSchema = z.object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: strongPasswordSchema,
  });

  const notificationUpdateSchema = z.object({
    notificationEmail: z.string().email().nullable().optional(),
    notificationPhone: z.string().nullable().optional(),
    enableEmailNotifications: z.boolean().optional(),
    enableSmsNotifications: z.boolean().optional(),
    notificationSettings: z.object({
      staffEmails: z.array(z.string().email()).optional(),
      staffPhones: z.array(z.string()).optional(),
      staffChannelPreference: z.enum(['email_only', 'sms_only', 'email_and_sms']).optional(),
      eventToggles: z.object({
        newAppointmentEmail: z.boolean().optional(),
        newAppointmentSms: z.boolean().optional(),
        newPreIntakeEmail: z.boolean().optional(),
        sameDayReminder: z.boolean().optional(),
      }).optional(),
    }).optional(),
  });

  // Change password (self-service)
  app.post("/api/client/account/password", requireClientAuth, async (req, res) => {
    try {
      const userId = req.session.userId;
      
      // Validate request body
      const bodyValidation = validateRequest(passwordChangeSchema, req.body);
      if (!bodyValidation.success) {
        return res.status(400).json({ error: bodyValidation.error });
      }
      
      const { currentPassword, newPassword } = bodyValidation.data;

      // Get current user
      const [user] = await db.select().from(adminUsers).where(eq(adminUsers.id, userId!)).limit(1);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Verify current password
      const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isValid) {
        return res.status(401).json({ error: "Current password is incorrect" });
      }

      // Hash and update new password
      const newPasswordHash = await bcrypt.hash(newPassword, 10);
      await db.update(adminUsers)
        .set({ passwordHash: newPasswordHash })
        .where(eq(adminUsers.id, userId!));

      res.json({ success: true, message: "Password updated successfully" });
    } catch (error) {
      console.error("Change password error:", error);
      res.status(500).json({ error: "Failed to change password" });
    }
  });

  // Get notification preferences
  app.get("/api/client/notifications", requireClientAuth, async (req, res) => {
    try {
      const clientId = (req as any).effectiveClientId;

      const [settings] = await db.select().from(clientSettings).where(eq(clientSettings.clientId, clientId)).limit(1);
      if (!settings) {
        return res.json({
          clientId,
          notificationEmail: null,
          notificationPhone: null,
          enableEmailNotifications: false,
          enableSmsNotifications: false,
          notificationSettings: {
            staffEmails: [],
            staffPhones: [],
            staffChannelPreference: 'email_only',
            eventToggles: {
              newAppointmentEmail: true,
              newAppointmentSms: false,
              newPreIntakeEmail: false,
              sameDayReminder: false,
            },
          },
        });
      }

      res.json({
        clientId,
        notificationEmail: settings.notificationEmail,
        notificationPhone: settings.notificationPhone,
        enableEmailNotifications: settings.enableEmailNotifications,
        enableSmsNotifications: settings.enableSmsNotifications,
        notificationSettings: settings.notificationSettings,
      });
    } catch (error) {
      console.error("Get notification preferences error:", error);
      res.status(500).json({ error: "Failed to fetch notification preferences" });
    }
  });

  // Update notification preferences
  app.patch("/api/client/notifications", requireClientAuth, async (req, res) => {
    try {
      const clientId = (req as any).effectiveClientId;
      
      // Validate request body
      const bodyValidation = validateRequest(notificationUpdateSchema, req.body);
      if (!bodyValidation.success) {
        return res.status(400).json({ error: bodyValidation.error });
      }
      
      const { 
        notificationEmail, 
        notificationPhone, 
        enableEmailNotifications, 
        enableSmsNotifications,
        notificationSettings
      } = bodyValidation.data;

      // First get existing settings to merge with
      const [existingSettings] = await db.select().from(clientSettings).where(eq(clientSettings.clientId, clientId)).limit(1);
      if (!existingSettings) {
        return res.status(404).json({ error: "Client settings not found" });
      }

      const updateData: Record<string, any> = {};

      if (notificationEmail !== undefined) updateData.notificationEmail = notificationEmail;
      if (notificationPhone !== undefined) updateData.notificationPhone = notificationPhone;
      if (enableEmailNotifications !== undefined) updateData.enableEmailNotifications = enableEmailNotifications;
      if (enableSmsNotifications !== undefined) updateData.enableSmsNotifications = enableSmsNotifications;
      
      // Merge notificationSettings to preserve existing values
      if (notificationSettings !== undefined) {
        const existingNotifSettings = existingSettings.notificationSettings || {
          staffEmails: [],
          staffPhones: [],
          staffChannelPreference: 'email_only',
          eventToggles: {
            newAppointmentEmail: true,
            newAppointmentSms: false,
            newPreIntakeEmail: false,
            sameDayReminder: false,
          },
        };
        
        updateData.notificationSettings = {
          ...existingNotifSettings,
          ...notificationSettings,
          eventToggles: notificationSettings.eventToggles 
            ? { ...existingNotifSettings.eventToggles, ...notificationSettings.eventToggles }
            : existingNotifSettings.eventToggles,
        };
      }

      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ error: "No valid fields to update" });
      }

      updateData.updatedAt = new Date();

      const [updated] = await db.update(clientSettings)
        .set(updateData)
        .where(eq(clientSettings.clientId, clientId))
        .returning();

      res.json({
        success: true,
        notificationEmail: updated.notificationEmail,
        notificationPhone: updated.notificationPhone,
        enableEmailNotifications: updated.enableEmailNotifications,
        enableSmsNotifications: updated.enableSmsNotifications,
        notificationSettings: updated.notificationSettings,
      });
    } catch (error) {
      console.error("Update notification preferences error:", error);
      res.status(500).json({ error: "Failed to update notification preferences" });
    }
  });

  // =============================================
  // CLIENT LEADS ENDPOINTS
  // =============================================

  // Get all leads for client
  app.get("/api/client/leads", requireClientAuth, async (req, res) => {
    try {
      const clientId = (req as any).effectiveClientId;
      const { status, priority, search, limit, offset } = req.query;
      
      const result = await storage.getLeads(clientId, {
        status: status as string | undefined,
        priority: priority as string | undefined,
        search: search as string | undefined,
        limit: limit ? parseInt(limit as string) : 50,
        offset: offset ? parseInt(offset as string) : 0,
      });
      
      res.json({
        clientId,
        ...result,
      });
    } catch (error) {
      console.error("Get client leads error:", error);
      res.status(500).json({ error: "Failed to fetch leads" });
    }
  });

  // Get single lead by ID
  app.get("/api/client/leads/:id", requireClientAuth, async (req, res) => {
    try {
      const lead = await storage.getLeadById(req.params.id);
      
      if (!lead) {
        return res.status(404).json({ error: "Lead not found" });
      }
      
      // Verify the lead belongs to the client
      const clientId = (req as any).effectiveClientId;
      if (lead.clientId !== clientId) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      res.json(lead);
    } catch (error) {
      console.error("Get lead error:", error);
      res.status(500).json({ error: "Failed to fetch lead" });
    }
  });

  // Create a new lead
  app.post("/api/client/leads", requireClientAuth, async (req, res) => {
    try {
      // Validate body
      const bodyValidation = validateRequest(createLeadSchema, req.body);
      if (!bodyValidation.success) {
        return res.status(400).json({ error: bodyValidation.error });
      }
      
      const clientId = (req as any).effectiveClientId;
      
      // If botId not provided, try to get default bot for this client
      let botId = bodyValidation.data.botId;
      if (!botId) {
        const clientBots = getBotsByClientId(clientId);
        if (clientBots.length > 0) {
          botId = clientBots[0].botId;
        } else {
          botId = `${clientId}_default`;
        }
      }
      
      const leadData = {
        ...bodyValidation.data,
        clientId,
        botId,
        source: bodyValidation.data.source || 'manual',
      };
      
      const lead = await storage.createLead(leadData as any);
      
      // Increment monthly leads count
      const currentMonth = new Date().toISOString().slice(0, 7);
      await storage.incrementMonthlyUsage(clientId, currentMonth, 'leads');
      
      // Fire webhook for new lead (async, non-blocking)
      sendLeadCreatedWebhook(clientId, {
        id: lead.id,
        name: lead.name || 'Unknown',
        email: lead.email,
        phone: lead.phone,
        source: lead.source,
        status: lead.status,
        createdAt: lead.createdAt,
      }).catch(err => console.error('[Webhook] Error sending lead webhook:', err));
      
      res.status(201).json(lead);
    } catch (error) {
      console.error("Create lead error:", error);
      res.status(500).json({ error: "Failed to create lead" });
    }
  });

  // Update a lead
  app.patch("/api/client/leads/:id", requireClientAuth, async (req, res) => {
    try {
      // Validate params
      const paramsValidation = validateRequest(idParamSchema, req.params);
      if (!paramsValidation.success) {
        return res.status(400).json({ error: paramsValidation.error });
      }
      
      // Validate body
      const bodyValidation = validateRequest(updateLeadSchema, req.body);
      if (!bodyValidation.success) {
        return res.status(400).json({ error: bodyValidation.error });
      }
      
      const lead = await storage.getLeadById(paramsValidation.data.id);
      
      if (!lead) {
        return res.status(404).json({ error: "Lead not found" });
      }
      
      // Verify the lead belongs to the client
      const clientId = (req as any).effectiveClientId;
      if (lead.clientId !== clientId) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      const previousStatus = lead.status;
      const updated = await storage.updateLead(paramsValidation.data.id, bodyValidation.data as any);
      
      // Fire webhook if status changed (async, non-blocking)
      if (updated && bodyValidation.data.status && bodyValidation.data.status !== previousStatus) {
        sendLeadUpdatedWebhook(clientId, {
          id: updated.id,
          name: updated.name || 'Unknown',
          status: updated.status,
          previousStatus,
        }).catch(err => console.error('[Webhook] Error sending lead update webhook:', err));
      }
      
      res.json(updated);
    } catch (error) {
      console.error("Update lead error:", error);
      res.status(500).json({ error: "Failed to update lead" });
    }
  });

  // Delete a lead
  app.delete("/api/client/leads/:id", requireClientAuth, async (req, res) => {
    try {
      // Validate params
      const paramsValidation = validateRequest(idParamSchema, req.params);
      if (!paramsValidation.success) {
        return res.status(400).json({ error: paramsValidation.error });
      }
      
      const lead = await storage.getLeadById(paramsValidation.data.id);
      
      if (!lead) {
        return res.status(404).json({ error: "Lead not found" });
      }
      
      // Verify the lead belongs to the client
      const clientId = (req as any).effectiveClientId;
      if (lead.clientId !== clientId) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      await storage.deleteLead(paramsValidation.data.id);
      res.status(204).send();
    } catch (error) {
      console.error("Delete lead error:", error);
      res.status(500).json({ error: "Failed to delete lead" });
    }
  });

  // =============================================
  // BULK LEAD ACTIONS
  // =============================================

  const bulkLeadActionSchema = z.object({
    leadIds: z.array(z.string()).min(1, "At least one lead ID required"),
    action: z.enum(['update_status', 'delete']),
    status: z.string().optional(),
    priority: z.string().optional(),
  });

  // Bulk update leads
  app.post("/api/client/leads/bulk", requireClientAuth, async (req, res) => {
    try {
      const bodyValidation = validateRequest(bulkLeadActionSchema, req.body);
      if (!bodyValidation.success) {
        return res.status(400).json({ error: bodyValidation.error });
      }
      
      const { leadIds, action, status, priority } = bodyValidation.data;
      const clientId = (req as any).effectiveClientId;
      
      // SECURITY: Pre-validate ALL leads belong to this client before processing any
      const validationErrors: string[] = [];
      const validatedLeads: Array<{ id: string }> = [];
      
      for (const leadId of leadIds) {
        const lead = await storage.getLeadById(leadId);
        
        if (!lead) {
          validationErrors.push(`Lead ${leadId} not found`);
          continue;
        }
        
        // SECURITY: Strict client authorization check
        if (lead.clientId !== clientId) {
          console.error(`[Bulk-Lead] Security: Client ${clientId} attempted to access lead ${leadId} belonging to ${lead.clientId}`);
          return res.status(403).json({ 
            error: "Access denied: One or more leads do not belong to your account",
            success: false,
            successCount: 0,
            errorCount: leadIds.length
          });
        }
        
        validatedLeads.push({ id: leadId });
      }
      
      // If any leads not found, report but continue with valid ones
      if (validationErrors.length > 0 && validatedLeads.length === 0) {
        return res.status(404).json({
          error: "No valid leads found",
          success: false,
          successCount: 0,
          errorCount: validationErrors.length,
          errors: validationErrors.slice(0, 10)
        });
      }
      
      // Process validated leads
      let successCount = 0;
      let errorCount = validationErrors.length;
      const errors: string[] = [...validationErrors];
      
      for (const lead of validatedLeads) {
        try {
          if (action === 'delete') {
            await storage.deleteLead(lead.id);
          } else if (action === 'update_status') {
            const updates: any = {};
            if (status) updates.status = status;
            if (priority) updates.priority = priority;
            await storage.updateLead(lead.id, updates);
          }
          
          successCount++;
        } catch (err) {
          errorCount++;
          errors.push(`Failed to process lead ${lead.id}`);
        }
      }
      
      res.json({
        success: errorCount === 0,
        successCount,
        errorCount,
        errors: errors.slice(0, 10), // Limit error messages
      });
    } catch (error) {
      console.error("Bulk lead action error:", error);
      res.status(500).json({ error: "Failed to perform bulk action" });
    }
  });

  // =============================================
  // SUPER-ADMIN ANALYTICS OVERVIEW
  // =============================================

  // Get platform-wide analytics overview
  app.get("/api/super-admin/analytics/overview", requireSuperAdmin, async (req, res) => {
    try {
      // Validate query params
      const queryValidation = validateRequest(superAdminOverviewQuerySchema, req.query);
      if (!queryValidation.success) {
        return res.status(400).json({ error: queryValidation.error });
      }
      
      const { days } = queryValidation.data;
      const allBots = getAllBotConfigs();
      
      const overview: any[] = [];
      
      for (const bot of allBots) {
        const summary = await storage.getClientAnalyticsSummary(bot.clientId, bot.botId);
        overview.push({
          clientId: bot.clientId,
          botId: bot.botId,
          businessName: bot.businessProfile?.businessName || bot.name,
          businessType: bot.businessProfile?.type || 'general',
          ...summary,
        });
      }
      
      // Calculate totals
      const totals = overview.reduce((acc, curr) => ({
        totalConversations: acc.totalConversations + curr.totalConversations,
        totalMessages: acc.totalMessages + curr.totalMessages,
        userMessages: acc.userMessages + curr.userMessages,
        botMessages: acc.botMessages + curr.botMessages,
        crisisEvents: acc.crisisEvents + curr.crisisEvents,
        appointmentRequests: acc.appointmentRequests + curr.appointmentRequests,
      }), {
        totalConversations: 0,
        totalMessages: 0,
        userMessages: 0,
        botMessages: 0,
        crisisEvents: 0,
        appointmentRequests: 0,
      });
      
      res.json({
        totals,
        bots: overview,
        totalBots: allBots.length,
      });
    } catch (error) {
      console.error("Get super-admin analytics overview error:", error);
      res.status(500).json({ error: "Failed to fetch analytics overview" });
    }
  });

  // =============================================
  // SUPER-ADMIN: SYSTEM LOGS & STATUS
  // =============================================

  // Get system status (operational, degraded, incident)
  app.get("/api/super-admin/system/status", requireSuperAdmin, async (req, res) => {
    try {
      const status = await storage.getSystemStatus();
      res.json(status);
    } catch (error) {
      console.error("Get system status error:", error);
      res.status(500).json({ error: "Failed to fetch system status" });
    }
  });

  // Get system logs with filters
  app.get("/api/super-admin/system/logs", requireSuperAdmin, async (req, res) => {
    try {
      const { level, source, workspaceId, clientId, isResolved, search, startDate, endDate, limit, offset } = req.query;
      
      const filters: any = {};
      if (level) filters.level = String(level);
      if (source) filters.source = String(source);
      if (workspaceId) filters.workspaceId = String(workspaceId);
      if (clientId) filters.clientId = String(clientId);
      if (isResolved !== undefined) filters.isResolved = isResolved === 'true';
      if (search) filters.search = String(search);
      if (startDate) filters.startDate = new Date(String(startDate));
      if (endDate) filters.endDate = new Date(String(endDate));
      if (limit) filters.limit = parseInt(String(limit), 10);
      if (offset) filters.offset = parseInt(String(offset), 10);
      
      const result = await storage.getSystemLogs(filters);
      res.json(result);
    } catch (error) {
      console.error("Get system logs error:", error);
      res.status(500).json({ error: "Failed to fetch system logs" });
    }
  });

  // Get single system log
  app.get("/api/super-admin/system/logs/:id", requireSuperAdmin, async (req, res) => {
    try {
      const log = await storage.getSystemLogById(req.params.id);
      if (!log) {
        return res.status(404).json({ error: "Log not found" });
      }
      res.json(log);
    } catch (error) {
      console.error("Get system log error:", error);
      res.status(500).json({ error: "Failed to fetch system log" });
    }
  });

  // Resolve a system log
  app.post("/api/super-admin/system/logs/:id/resolve", requireSuperAdmin, async (req, res) => {
    try {
      const { notes } = req.body;
      const user = (req as any).user;
      
      const resolved = await storage.resolveSystemLog(req.params.id, user?.username || 'super-admin', notes);
      res.json(resolved);
    } catch (error) {
      console.error("Resolve system log error:", error);
      res.status(500).json({ error: "Failed to resolve log" });
    }
  });

  // Create a system log (for testing or manual logging)
  app.post("/api/super-admin/system/logs", requireSuperAdmin, async (req, res) => {
    try {
      const logSchema = z.object({
        level: z.enum(['debug', 'info', 'warn', 'error', 'critical']).default('info'),
        source: z.string().min(1),
        message: z.string().min(1),
        workspaceId: z.string().optional(),
        clientId: z.string().optional(),
        details: z.record(z.any()).optional(),
      });
      
      const validation = logSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: validation.error.message });
      }
      
      const log = await storage.createSystemLog(validation.data);
      res.status(201).json(log);
    } catch (error) {
      console.error("Create system log error:", error);
      res.status(500).json({ error: "Failed to create system log" });
    }
  });

  // =============================================
  // SUPER-ADMIN: USER MANAGEMENT
  // =============================================

  // List all admin users
  app.get("/api/super-admin/users", requireSuperAdmin, async (req, res) => {
    try {
      const users = await db.select({
        id: adminUsers.id,
        username: adminUsers.username,
        role: adminUsers.role,
        clientId: adminUsers.clientId,
        createdAt: adminUsers.createdAt,
      }).from(adminUsers).orderBy(adminUsers.username);
      res.json(users);
    } catch (error) {
      console.error("Get admin users error:", error);
      res.status(500).json({ error: "Failed to fetch admin users" });
    }
  });

  // Create new admin user schema with strong password
  const createUserSchema = z.object({
    username: z.string().min(3, "Username must be at least 3 characters").max(50),
    password: strongPasswordSchema,
    role: z.enum(['super_admin', 'client_admin']),
    clientId: z.string().optional(),
  });

  // Create new admin user
  app.post("/api/super-admin/users", requireSuperAdmin, async (req, res) => {
    try {
      const validation = createUserSchema.safeParse(req.body);
      if (!validation.success) {
        const errorMessage = validation.error.errors.map(e => e.message).join(', ');
        return res.status(400).json({ error: errorMessage });
      }
      
      const { username, password, role, clientId } = validation.data;
      
      // Check if username already exists
      const existing = await db.select().from(adminUsers).where(eq(adminUsers.username, username)).limit(1);
      if (existing.length > 0) {
        return res.status(409).json({ error: "Username already exists" });
      }
      
      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Create user
      const [newUser] = await db.insert(adminUsers).values({
        username,
        passwordHash: hashedPassword,
        role,
        clientId: role === 'client_admin' ? clientId : null,
      }).returning({
        id: adminUsers.id,
        username: adminUsers.username,
        role: adminUsers.role,
        clientId: adminUsers.clientId,
        createdAt: adminUsers.createdAt,
      });
      
      // Log the creation
      await storage.createSystemLog({
        level: 'info',
        source: 'super-admin',
        message: `New admin user created: ${username} (${role})`,
      });
      
      res.status(201).json(newUser);
    } catch (error) {
      console.error("Create admin user error:", error);
      res.status(500).json({ error: "Failed to create admin user" });
    }
  });

  // Update admin user schema (password is optional but must be strong if provided)
  const updateUserSchema = z.object({
    role: z.enum(['super_admin', 'client_admin']).optional(),
    clientId: z.string().optional(),
    password: strongPasswordSchema.optional(),
  });

  // Update admin user
  app.patch("/api/super-admin/users/:id", requireSuperAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      
      const validation = updateUserSchema.safeParse(req.body);
      if (!validation.success) {
        const errorMessage = validation.error.errors.map(e => e.message).join(', ');
        return res.status(400).json({ error: errorMessage });
      }
      
      const { role, clientId, password } = validation.data;
      
      // Find the user
      const existing = await db.select().from(adminUsers).where(eq(adminUsers.id, id)).limit(1);
      if (existing.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }
      
      const updateData: Record<string, any> = {};
      
      if (role && ['super_admin', 'client_admin'].includes(role)) {
        updateData.role = role;
        updateData.clientId = role === 'client_admin' ? (clientId || existing[0].clientId) : null;
      }
      
      if (password) {
        updateData.passwordHash = await bcrypt.hash(password, 10);
      }
      
      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ error: "No valid fields to update" });
      }
      
      const [updated] = await db.update(adminUsers)
        .set(updateData)
        .where(eq(adminUsers.id, id))
        .returning({
          id: adminUsers.id,
          username: adminUsers.username,
          role: adminUsers.role,
          clientId: adminUsers.clientId,
          createdAt: adminUsers.createdAt,
        });
      
      res.json(updated);
    } catch (error) {
      console.error("Update admin user error:", error);
      res.status(500).json({ error: "Failed to update admin user" });
    }
  });

  // Delete admin user
  app.delete("/api/super-admin/users/:id", requireSuperAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const currentUserId = (req.session as any)?.passport?.user;
      
      // Prevent self-deletion
      if (currentUserId === id) {
        return res.status(400).json({ error: "Cannot delete your own account" });
      }
      
      // Find the user
      const existing = await db.select().from(adminUsers).where(eq(adminUsers.id, id)).limit(1);
      if (existing.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }
      
      const username = existing[0].username;
      
      // Delete the user
      await db.delete(adminUsers).where(eq(adminUsers.id, id));
      
      // Log the deletion
      await storage.createSystemLog({
        level: 'info',
        source: 'super-admin',
        message: `Admin user deleted: ${username}`,
      });
      
      res.json({ success: true, message: `User ${username} deleted successfully` });
    } catch (error) {
      console.error("Delete admin user error:", error);
      res.status(500).json({ error: "Failed to delete admin user" });
    }
  });

  // =============================================
  // SUPER-ADMIN: DELETE BOT
  // =============================================

  // Delete a bot and its associated client
  app.delete("/api/super-admin/bots/:botId", requireSuperAdmin, async (req, res) => {
    try {
      const { botId } = req.params;
      
      // Find the bot config to get clientId
      const botConfig = getAllBotConfigs().find(b => b.botId === botId);
      if (!botConfig) {
        return res.status(404).json({ error: "Bot not found" });
      }
      
      // Delete from database if exists
      const existingBot = await storage.getBotByBotId(botId);
      if (existingBot) {
        // Delete bot settings first
        await db.delete(botSettings).where(eq(botSettings.botId, existingBot.id));
        // Delete bot
        await db.delete(bots).where(eq(bots.id, existingBot.id));
      }
      
      // Delete related data directly from database
      await db.delete(leads).where(eq(leads.clientId, botConfig.clientId));
      await db.delete(appointments).where(eq(appointments.clientId, botConfig.clientId));
      await db.delete(clientSettings).where(eq(clientSettings.clientId, botConfig.clientId));
      
      // Log the deletion
      await storage.createSystemLog({
        level: 'info',
        source: 'super-admin',
        message: `Bot deleted: ${botId} (client: ${botConfig.clientId})`,
        clientId: botConfig.clientId,
      });
      
      res.json({ success: true, message: `Bot ${botId} deleted successfully` });
    } catch (error) {
      console.error("Delete bot error:", error);
      res.status(500).json({ error: "Failed to delete bot" });
    }
  });

  // =============================================
  // SUPER-ADMIN: GLOBAL ANALYTICS (Enhanced)
  // =============================================

  // Get global analytics with daily trends
  app.get("/api/super-admin/analytics/global", requireSuperAdmin, async (req, res) => {
    try {
      const { days: daysParam } = req.query;
      const days = daysParam ? parseInt(String(daysParam), 10) : 7;
      
      const allBots = getAllBotConfigs();
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      
      // Get aggregated stats across all bots
      let totalConversations = 0;
      let totalMessages = 0;
      let totalLeads = 0;
      let totalAppointments = 0;
      let activeWorkspaces = new Set<string>();
      
      const dailyData: Record<string, { conversations: number; leads: number; appointments: number }> = {};
      
      // Initialize daily data for the date range
      for (let i = 0; i < days; i++) {
        const date = new Date(Date.now() - (days - 1 - i) * 24 * 60 * 60 * 1000);
        const dateStr = date.toISOString().split('T')[0];
        dailyData[dateStr] = { conversations: 0, leads: 0, appointments: 0 };
      }
      
      for (const bot of allBots) {
        const summary = await storage.getClientAnalyticsSummary(bot.clientId, bot.botId, startDate);
        totalConversations += summary.totalConversations;
        totalMessages += summary.totalMessages;
        totalAppointments += summary.appointmentRequests;
        
        if (summary.totalConversations > 0) {
          activeWorkspaces.add(bot.clientId);
        }
        
        // Get daily trends for this bot
        const trends = await storage.getClientDailyTrends(bot.clientId, bot.botId, days);
        trends.forEach(trend => {
          if (dailyData[trend.date]) {
            dailyData[trend.date].conversations += trend.totalConversations;
            dailyData[trend.date].appointments += trend.appointmentRequests;
          }
        });
        
        // Get leads for this bot
        const { leads } = await storage.getLeads(bot.clientId, { limit: 1000 });
        const recentLeads = leads.filter(l => l.createdAt >= startDate);
        totalLeads += recentLeads.length;
        
        // Add leads to daily data
        recentLeads.forEach(lead => {
          const dateStr = lead.createdAt.toISOString().split('T')[0];
          if (dailyData[dateStr]) {
            dailyData[dateStr].leads += 1;
          }
        });
      }
      
      // Convert daily data to array sorted by date
      const dailyTrends = Object.entries(dailyData)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([date, data]) => ({ date, ...data }));
      
      res.json({
        summary: {
          totalConversations,
          totalMessages,
          totalLeads,
          totalAppointments,
          activeWorkspaces: activeWorkspaces.size,
          totalBots: allBots.length,
        },
        dailyTrends,
        dateRange: {
          start: startDate.toISOString(),
          end: new Date().toISOString(),
          days,
        },
      });
    } catch (error) {
      console.error("Get global analytics error:", error);
      res.status(500).json({ error: "Failed to fetch global analytics" });
    }
  });
  
  // Get recent activity across all bots
  app.get("/api/super-admin/analytics/recent-activity", requireSuperAdmin, async (req, res) => {
    try {
      const { limit: limitParam } = req.query;
      const limit = limitParam ? parseInt(String(limitParam), 10) : 20;
      
      const allBots = getAllBotConfigs();
      const activities: Array<{
        type: 'conversation' | 'lead' | 'session';
        clientId: string;
        botId: string;
        botName: string;
        details: any;
        timestamp: Date;
      }> = [];
      
      // Get recent leads and sessions from all bots
      for (const bot of allBots) {
        // Get recent leads
        const { leads } = await storage.getLeads(bot.clientId, { limit: 10 });
        leads.forEach(lead => {
          activities.push({
            type: 'lead',
            clientId: bot.clientId,
            botId: bot.botId,
            botName: bot.name || bot.botId,
            details: {
              id: lead.id,
              name: lead.name || 'Anonymous',
              email: lead.email,
              phone: lead.phone,
              source: lead.source,
              status: lead.status,
            },
            timestamp: lead.createdAt,
          });
        });
        
        // Get recent sessions
        const sessions = await storage.getClientRecentSessions(bot.clientId, bot.botId, 10);
        sessions.forEach(session => {
          activities.push({
            type: 'session',
            clientId: bot.clientId,
            botId: bot.botId,
            botName: bot.name || bot.botId,
            details: {
              sessionId: session.sessionId,
              messageCount: session.userMessageCount + session.botMessageCount,
              topics: session.topics || [],
            },
            timestamp: session.startedAt,
          });
        });
      }
      
      // Sort by timestamp descending and limit
      activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      const recentActivities = activities.slice(0, limit);
      
      res.json({
        activities: recentActivities,
        total: recentActivities.length,
      });
    } catch (error) {
      console.error("Get recent activity error:", error);
      res.status(500).json({ error: "Failed to fetch recent activity" });
    }
  });

  // =============================================
  // SUPER-ADMIN: WORKSPACES MANAGEMENT
  // =============================================

  // List all workspaces with stats
  app.get("/api/super-admin/workspaces", requireSuperAdmin, async (req, res) => {
    try {
      const workspaceList = await getWorkspaces();
      const allBots = getAllBotConfigs();
      
      // Enrich workspace data with stats
      const enrichedWorkspaces = await Promise.all(workspaceList.map(async (ws: any) => {
        const wsBots = allBots.filter(b => b.clientId === ws.slug || b.clientId === ws.id);
        
        let totalConversations = 0;
        let lastActive: Date | null = null;
        
        for (const bot of wsBots) {
          const recentSessions = await storage.getClientRecentSessions(bot.clientId, bot.botId, 10);
          totalConversations += recentSessions.length;
          
          if (recentSessions.length > 0 && recentSessions[0].startedAt) {
            if (!lastActive || recentSessions[0].startedAt > lastActive) {
              lastActive = recentSessions[0].startedAt;
            }
          }
        }
        
        return {
          id: ws.id,
          name: ws.name,
          slug: ws.slug,
          status: ws.status || 'active',
          plan: ws.plan || 'starter',
          botsCount: wsBots.length,
          totalConversations,
          lastActive: lastActive?.toISOString() || null,
          createdAt: ws.createdAt,
          settings: ws.settings || {},
        };
      }));
      
      res.json({
        workspaces: enrichedWorkspaces,
        total: enrichedWorkspaces.length,
      });
    } catch (error) {
      console.error("Get workspaces error:", error);
      res.status(500).json({ error: "Failed to fetch workspaces" });
    }
  });

  // Get single workspace with detailed stats
  app.get("/api/super-admin/workspaces/:slug", requireSuperAdmin, async (req, res) => {
    try {
      const { slug } = req.params;
      const workspace = await getWorkspaceBySlug(slug);
      
      if (!workspace) {
        return res.status(404).json({ error: "Workspace not found" });
      }
      
      const allBots = getAllBotConfigs();
      const wsBots = allBots.filter(b => b.clientId === workspace.slug || b.clientId === (workspace as any).id);
      
      // Get 30-day stats
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      let totalConversations30d = 0;
      let totalLeads30d = 0;
      let totalAppointments30d = 0;
      
      const botDetails = await Promise.all(wsBots.map(async (bot) => {
        const summary = await storage.getClientAnalyticsSummary(bot.clientId, bot.botId, thirtyDaysAgo);
        const recentSessions = await storage.getClientRecentSessions(bot.clientId, bot.botId, 5);
        const { leads } = await storage.getLeads(bot.clientId, { limit: 100 });
        const recentLeads = leads.filter(l => l.createdAt >= thirtyDaysAgo);
        
        totalConversations30d += summary.totalConversations;
        totalLeads30d += recentLeads.length;
        totalAppointments30d += summary.appointmentRequests;
        
        return {
          botId: bot.botId,
          name: bot.name,
          status: (bot as any).status || 'active',
          lastActive: recentSessions[0]?.startedAt?.toISOString() || null,
          conversations30d: summary.totalConversations,
          leads30d: recentLeads.length,
        };
      }));
      
      res.json({
        workspace: {
          id: (workspace as any).id,
          name: workspace.name,
          slug: workspace.slug,
          status: (workspace as any).status || 'active',
          plan: (workspace as any).plan || 'starter',
          settings: (workspace as any).settings || {},
          createdAt: (workspace as any).createdAt,
        },
        stats: {
          conversations30d: totalConversations30d,
          leads30d: totalLeads30d,
          appointments30d: totalAppointments30d,
        },
        bots: botDetails,
      });
    } catch (error) {
      console.error("Get workspace error:", error);
      res.status(500).json({ error: "Failed to fetch workspace" });
    }
  });

  // Update workspace status (suspend/reactivate)
  app.patch("/api/super-admin/workspaces/:slug/status", requireSuperAdmin, async (req, res) => {
    try {
      const { slug } = req.params;
      const { status } = req.body;
      
      if (!['active', 'paused', 'suspended', 'cancelled'].includes(status)) {
        return res.status(400).json({ error: "Invalid status. Must be one of: active, paused, suspended, cancelled" });
      }
      
      const workspace = await getWorkspaceBySlug(slug);
      if (!workspace) {
        return res.status(404).json({ error: "Workspace not found" });
      }
      
      // Log this action
      await storage.createSystemLog({
        level: 'info',
        source: 'super-admin',
        message: `Workspace ${slug} status changed to ${status}`,
        workspaceId: (workspace as any).id,
        details: { previousStatus: (workspace as any).status || 'active', newStatus: status },
      });
      
      // Update client status through existing mechanism
      updateClientStatus(slug, status);
      
      res.json({ success: true, slug, status });
    } catch (error) {
      console.error("Update workspace status error:", error);
      res.status(500).json({ error: "Failed to update workspace status" });
    }
  });

  // Create new workspace
  app.post("/api/super-admin/workspaces", requireSuperAdmin, async (req, res) => {
    try {
      const { name, slug, ownerId, plan, settings } = req.body;
      
      // Validate required fields
      if (!name || !slug || !ownerId) {
        return res.status(400).json({ error: "name, slug, and ownerId are required" });
      }
      
      // Validate slug format (alphanumeric and underscores only)
      if (!/^[a-z0-9_]+$/.test(slug)) {
        return res.status(400).json({ error: "Slug must be lowercase alphanumeric with underscores only" });
      }
      
      // Check if slug already exists
      const existing = await getWorkspaceBySlug(slug);
      if (existing) {
        return res.status(409).json({ error: `Workspace with slug '${slug}' already exists` });
      }
      
      // Validate owner exists
      const [owner] = await db.select().from(adminUsers).where(eq(adminUsers.id, ownerId)).limit(1);
      if (!owner) {
        return res.status(400).json({ error: "Invalid ownerId - user not found" });
      }
      
      const workspace = await createWorkspace({
        name,
        slug,
        ownerId,
        plan: plan || 'starter',
        settings: settings || {},
      });
      
      // Log this action
      await storage.createSystemLog({
        level: 'info',
        source: 'super-admin',
        message: `Workspace ${slug} created`,
        workspaceId: workspace.id,
        details: { name, plan: plan || 'starter', ownerId },
      });
      
      res.status(201).json(workspace);
    } catch (error) {
      console.error("Create workspace error:", error);
      res.status(500).json({ error: "Failed to create workspace" });
    }
  });

  // Update workspace (name, plan, settings, owner)
  app.patch("/api/super-admin/workspaces/:slug", requireSuperAdmin, async (req, res) => {
    try {
      const { slug } = req.params;
      const { name, ownerId, plan, settings } = req.body;
      
      const existing = await getWorkspaceBySlug(slug);
      if (!existing) {
        return res.status(404).json({ error: "Workspace not found" });
      }
      
      // Validate owner if provided
      if (ownerId) {
        const [owner] = await db.select().from(adminUsers).where(eq(adminUsers.id, ownerId)).limit(1);
        if (!owner) {
          return res.status(400).json({ error: "Invalid ownerId - user not found" });
        }
      }
      
      const workspace = await updateWorkspace(slug, { name, ownerId, plan, settings });
      
      // Log this action
      await storage.createSystemLog({
        level: 'info',
        source: 'super-admin',
        message: `Workspace ${slug} updated`,
        workspaceId: workspace.id,
        details: { name, plan, ownerId },
      });
      
      res.json(workspace);
    } catch (error) {
      console.error("Update workspace error:", error);
      res.status(500).json({ error: "Failed to update workspace" });
    }
  });

  // Delete workspace
  app.delete("/api/super-admin/workspaces/:slug", requireSuperAdmin, async (req, res) => {
    try {
      const { slug } = req.params;
      
      const existing = await getWorkspaceBySlug(slug);
      if (!existing) {
        return res.status(404).json({ error: "Workspace not found" });
      }
      
      // Get bots associated with this workspace to cascade delete
      const allBots = getAllBotConfigs();
      const workspaceBots = allBots.filter(b => b.clientId === slug);
      
      // Delete associated bots (from file system and database)
      for (const bot of workspaceBots) {
        try {
          // Delete from database
          await db.delete(bots).where(eq(bots.botId, bot.botId));
          await db.delete(botSettings).where(eq(botSettings.botId, bot.botId));
          
          // Delete config file if exists
          const configPath = path.join(process.cwd(), 'data', 'bot-configs', `${bot.botId}.json`);
          if (fs.existsSync(configPath)) {
            fs.unlinkSync(configPath);
          }
        } catch (e) {
          console.error(`Error deleting bot ${bot.botId}:`, e);
        }
      }
      
      // Log before delete
      await storage.createSystemLog({
        level: 'warning',
        source: 'super-admin',
        message: `Workspace ${slug} deleted`,
        workspaceId: (existing as any).id,
        details: { deletedBots: workspaceBots.length },
      });
      
      await deleteWorkspace(slug);
      
      res.json({ success: true, slug, deletedBots: workspaceBots.length });
    } catch (error) {
      console.error("Delete workspace error:", error);
      res.status(500).json({ error: "Failed to delete workspace" });
    }
  });

  // =============================================
  // SUPER-ADMIN: ENHANCED BOT STATS
  // =============================================

  // Get bot with enriched stats (for control center)
  app.get("/api/super-admin/bots/:botId/stats", requireSuperAdmin, async (req, res) => {
    try {
      const { botId } = req.params;
      const { days: daysParam } = req.query;
      const days = daysParam ? parseInt(String(daysParam), 10) : 7;
      
      const bot = getBotConfigByBotId(botId);
      if (!bot) {
        return res.status(404).json({ error: "Bot not found" });
      }
      
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      const summary = await storage.getClientAnalyticsSummary(bot.clientId, bot.botId, startDate);
      const { leads } = await storage.getLeads(bot.clientId, { limit: 1000 });
      const recentLeads = leads.filter(l => l.createdAt >= startDate);
      const recentSessions = await storage.getClientRecentSessions(bot.clientId, bot.botId, 5);
      
      res.json({
        botId,
        clientId: bot.clientId,
        name: bot.name,
        businessName: bot.businessProfile?.businessName,
        stats: {
          conversations: summary.totalConversations,
          leads: recentLeads.length,
          appointments: summary.appointmentRequests,
          messages: summary.totalMessages,
          avgResponseTimeMs: summary.avgResponseTimeMs,
        },
        lastActive: recentSessions[0]?.startedAt?.toISOString() || null,
        dateRange: { days, startDate: startDate.toISOString() },
      });
    } catch (error) {
      console.error("Get bot stats error:", error);
      res.status(500).json({ error: "Failed to fetch bot stats" });
    }
  });

  // =============================================
  // STRIPE BILLING ENDPOINTS
  // =============================================

  // Get Stripe publishable key
  app.get("/api/stripe/publishable-key", async (req, res) => {
    try {
      const { getStripePublishableKey } = await import('./stripeClient');
      const key = await getStripePublishableKey();
      res.json({ publishableKey: key });
    } catch (error) {
      console.error("Get Stripe publishable key error:", error);
      res.status(500).json({ error: "Stripe not configured" });
    }
  });

  // List available products and prices for subscription
  app.get("/api/stripe/products", async (req, res) => {
    try {
      const { stripeService } = await import('./stripeService');
      const rows = await stripeService.listProductsWithPrices();

      const productsMap = new Map();
      for (const row of rows as any[]) {
        if (!productsMap.has(row.product_id)) {
          productsMap.set(row.product_id, {
            id: row.product_id,
            name: row.product_name,
            description: row.product_description,
            active: row.product_active,
            metadata: row.product_metadata,
            prices: []
          });
        }
        if (row.price_id) {
          productsMap.get(row.product_id).prices.push({
            id: row.price_id,
            unit_amount: row.unit_amount,
            currency: row.currency,
            recurring: row.recurring,
            active: row.price_active,
            metadata: row.price_metadata,
          });
        }
      }

      res.json({ products: Array.from(productsMap.values()) });
    } catch (error) {
      console.error("List Stripe products error:", error);
      res.status(500).json({ error: "Failed to list products" });
    }
  });

  // Create checkout session for client subscription
  app.post("/api/stripe/checkout", requireSuperAdmin, async (req, res) => {
    try {
      const { clientId, priceId, email, businessName } = req.body;

      if (!clientId || !priceId) {
        return res.status(400).json({ error: "clientId and priceId are required" });
      }

      const { stripeService } = await import('./stripeService');
      
      let customer = await stripeService.getCustomerByClientId(clientId);
      let customerId: string;
      
      if (!customer) {
        const newCustomer = await stripeService.createCustomer(
          email || `${clientId}@treasurecoast.ai`,
          clientId,
          businessName || clientId
        );
        customerId = newCustomer.id;
      } else {
        customerId = (customer as any).id;
      }

      const protocol = req.headers['x-forwarded-proto'] || 'https';
      const host = req.headers.host;
      const baseUrl = `${protocol}://${host}`;

      const session = await stripeService.createCheckoutSession(
        customerId,
        priceId,
        clientId,
        `${baseUrl}/super-admin?checkout=success&clientId=${clientId}`,
        `${baseUrl}/super-admin?checkout=canceled&clientId=${clientId}`
      );

      res.json({ url: session.url, sessionId: session.id });
    } catch (error) {
      console.error("Create checkout session error:", error);
      res.status(500).json({ error: "Failed to create checkout session" });
    }
  });

  // Get client subscription status
  app.get("/api/stripe/subscription/:clientId", requireSuperAdmin, async (req, res) => {
    try {
      const { clientId } = req.params;
      const { stripeService } = await import('./stripeService');
      
      const subscription = await stripeService.getSubscriptionByClientId(clientId);
      const customer = await stripeService.getCustomerByClientId(clientId);
      
      res.json({ 
        subscription: subscription || null,
        customer: customer || null,
        hasActiveSubscription: !!subscription 
      });
    } catch (error) {
      console.error("Get subscription error:", error);
      res.status(500).json({ error: "Failed to get subscription" });
    }
  });

  // Create customer portal session for managing subscription
  app.post("/api/stripe/portal", requireSuperAdmin, async (req, res) => {
    try {
      const { clientId } = req.body;

      if (!clientId) {
        return res.status(400).json({ error: "clientId is required" });
      }

      const { stripeService } = await import('./stripeService');
      const customer = await stripeService.getCustomerByClientId(clientId);
      
      if (!customer) {
        return res.status(404).json({ error: "No Stripe customer found for this client" });
      }

      const protocol = req.headers['x-forwarded-proto'] || 'https';
      const host = req.headers.host;
      const returnUrl = `${protocol}://${host}/super-admin`;

      const session = await stripeService.createCustomerPortalSession(
        (customer as any).id,
        returnUrl
      );

      res.json({ url: session.url });
    } catch (error) {
      console.error("Create portal session error:", error);
      res.status(500).json({ error: "Failed to create portal session" });
    }
  });

  // Get billing overview for super admin dashboard
  app.get("/api/super-admin/billing/overview", requireSuperAdmin, async (req, res) => {
    try {
      const { stripeService } = await import('./stripeService');
      const overview = await stripeService.getBillingOverview();
      res.json(overview);
    } catch (error) {
      console.error("Get billing overview error:", error);
      res.status(500).json({ error: "Failed to get billing overview" });
    }
  });

  // Get recent invoices for super admin dashboard
  app.get("/api/super-admin/billing/invoices", requireSuperAdmin, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const { stripeService } = await import('./stripeService');
      const invoices = await stripeService.getRecentInvoices(limit);
      res.json({ invoices });
    } catch (error) {
      console.error("Get recent invoices error:", error);
      res.status(500).json({ error: "Failed to get recent invoices" });
    }
  });

  // =============================================
  // PHASE 4: AUTOMATION V2 API ENDPOINTS
  // =============================================

  // Automation workflow Zod schemas
  const automationWorkflowSchema = z.object({
    name: z.string().min(1).max(100),
    description: z.string().optional().nullable(),
    botId: z.string().min(1),
    triggerType: z.enum(['keyword', 'schedule', 'inactivity', 'message_count', 'lead_captured', 'appointment_booked']),
    triggerConfig: z.object({
      keywords: z.array(z.string()).optional(),
      matchType: z.enum(['exact', 'contains', 'regex']).optional(),
      schedule: z.string().optional(),
      inactivityMinutes: z.number().optional(),
      messageCountThreshold: z.number().optional(),
      eventType: z.string().optional(),
    }).optional(),
    conditions: z.array(z.object({
      id: z.string(),
      field: z.string(),
      operator: z.enum(['equals', 'contains', 'greater_than', 'less_than', 'matches_regex', 'in_list']),
      value: z.union([z.string(), z.number(), z.array(z.string())]),
      groupId: z.string().optional(),
    })).optional(),
    actions: z.array(z.object({
      id: z.string(),
      type: z.enum(['send_message', 'capture_lead', 'tag_session', 'notify_staff', 'send_email', 'delay', 'set_variable']),
      order: z.number(),
      config: z.object({
        message: z.string().optional(),
        delay: z.number().optional(),
        template: z.string().optional(),
        channel: z.enum(['chat', 'email', 'sms']).optional(),
        tags: z.array(z.string()).optional(),
        variable: z.object({ name: z.string(), value: z.string() }).optional(),
      }),
    })).optional(),
    status: z.enum(['active', 'paused', 'draft']).optional(),
    priority: z.number().optional(),
    throttleSeconds: z.number().optional(),
    maxExecutionsPerSession: z.number().optional().nullable(),
    scheduleTimezone: z.string().optional(),
  });

  // List automation workflows for a bot
  app.get("/api/bots/:botId/automations", requireAuth, async (req, res) => {
    try {
      const { botId } = req.params;
      
      // Validate tenant access
      if (!await validateBotAccess(req, res, botId)) return;
      
      const workflows = await storage.getAutomationWorkflowsByBot(botId);
      res.json({ workflows });
    } catch (error) {
      console.error("Get automations error:", error);
      res.status(500).json({ error: "Failed to get automation workflows" });
    }
  });

  // Get a single automation workflow
  app.get("/api/bots/:botId/automations/:workflowId", requireAuth, async (req, res) => {
    try {
      const { botId, workflowId } = req.params;
      
      // Validate tenant access
      if (!await validateBotAccess(req, res, botId)) return;
      
      const workflow = await storage.getAutomationWorkflow(workflowId);
      
      if (!workflow || workflow.botId !== botId) {
        return res.status(404).json({ error: "Automation workflow not found" });
      }
      
      res.json({ workflow });
    } catch (error) {
      console.error("Get automation error:", error);
      res.status(500).json({ error: "Failed to get automation workflow" });
    }
  });

  // Create a new automation workflow
  app.post("/api/bots/:botId/automations", requireAuth, async (req, res) => {
    try {
      const { botId } = req.params;
      
      // Validate tenant access
      if (!await validateBotAccess(req, res, botId)) return;
      
      const validation = automationWorkflowSchema.safeParse({ ...req.body, botId });
      
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid automation data", details: validation.error.format() });
      }
      
      const workflow = await storage.createAutomationWorkflow(validation.data as any);
      res.status(201).json({ workflow });
    } catch (error) {
      console.error("Create automation error:", error);
      res.status(500).json({ error: "Failed to create automation workflow" });
    }
  });

  // Update an automation workflow
  app.patch("/api/bots/:botId/automations/:workflowId", requireAuth, async (req, res) => {
    try {
      const { botId, workflowId } = req.params;
      
      // Validate tenant access
      if (!await validateBotAccess(req, res, botId)) return;
      
      const existing = await storage.getAutomationWorkflow(workflowId);
      
      if (!existing || existing.botId !== botId) {
        return res.status(404).json({ error: "Automation workflow not found" });
      }
      
      const partialSchema = automationWorkflowSchema.partial();
      const validation = partialSchema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid update data", details: validation.error.format() });
      }
      
      const updated = await storage.updateAutomationWorkflow(workflowId, validation.data as any);
      res.json({ workflow: updated });
    } catch (error) {
      console.error("Update automation error:", error);
      res.status(500).json({ error: "Failed to update automation workflow" });
    }
  });

  // Delete an automation workflow
  app.delete("/api/bots/:botId/automations/:workflowId", requireAuth, async (req, res) => {
    try {
      const { botId, workflowId } = req.params;
      
      // Validate tenant access
      if (!await validateBotAccess(req, res, botId)) return;
      
      const existing = await storage.getAutomationWorkflow(workflowId);
      
      if (!existing || existing.botId !== botId) {
        return res.status(404).json({ error: "Automation workflow not found" });
      }
      
      await storage.deleteAutomationWorkflow(workflowId);
      res.json({ success: true });
    } catch (error) {
      console.error("Delete automation error:", error);
      res.status(500).json({ error: "Failed to delete automation workflow" });
    }
  });

  // Toggle automation status (quick action)
  app.post("/api/bots/:botId/automations/:workflowId/toggle", requireAuth, async (req, res) => {
    try {
      const { botId, workflowId } = req.params;
      
      // Validate tenant access
      if (!await validateBotAccess(req, res, botId)) return;
      
      const existing = await storage.getAutomationWorkflow(workflowId);
      
      if (!existing || existing.botId !== botId) {
        return res.status(404).json({ error: "Automation workflow not found" });
      }
      
      const newStatus = existing.status === 'active' ? 'paused' : 'active';
      const updated = await storage.updateAutomationWorkflow(workflowId, { status: newStatus });
      res.json({ workflow: updated });
    } catch (error) {
      console.error("Toggle automation error:", error);
      res.status(500).json({ error: "Failed to toggle automation status" });
    }
  });

  // Get automation run history for a workflow
  app.get("/api/bots/:botId/automations/:workflowId/runs", requireAuth, async (req, res) => {
    try {
      const { botId, workflowId } = req.params;
      const limit = parseInt(req.query.limit as string) || 50;
      
      // Validate tenant access
      if (!await validateBotAccess(req, res, botId)) return;
      
      const existing = await storage.getAutomationWorkflow(workflowId);
      if (!existing || existing.botId !== botId) {
        return res.status(404).json({ error: "Automation workflow not found" });
      }
      
      const runs = await storage.getAutomationRunsByWorkflow(workflowId, limit);
      res.json({ runs });
    } catch (error) {
      console.error("Get automation runs error:", error);
      res.status(500).json({ error: "Failed to get automation runs" });
    }
  });

  // Get all automation runs for a bot (recent 24h by default)
  app.get("/api/bots/:botId/automation-runs", requireAuth, async (req, res) => {
    try {
      const { botId } = req.params;
      const hours = parseInt(req.query.hours as string) || 24;
      
      // Validate tenant access
      if (!await validateBotAccess(req, res, botId)) return;
      
      const runs = await storage.getRecentAutomationRuns(botId, hours);
      res.json({ runs });
    } catch (error) {
      console.error("Get bot automation runs error:", error);
      res.status(500).json({ error: "Failed to get automation runs" });
    }
  });

  // Test an automation workflow (dry run)
  app.post("/api/bots/:botId/automations/:workflowId/test", requireAuth, async (req, res) => {
    try {
      const { botId, workflowId } = req.params;
      const { testMessage, testContext } = req.body;
      
      // Validate tenant access
      if (!await validateBotAccess(req, res, botId)) return;
      
      const workflow = await storage.getAutomationWorkflow(workflowId);
      if (!workflow || workflow.botId !== botId) {
        return res.status(404).json({ error: "Automation workflow not found" });
      }
      
      // Simulate workflow execution
      const testResult = {
        wouldTrigger: false,
        matchedConditions: [] as string[],
        actionsToExecute: workflow.actions || [],
        testMessage,
        workflow: {
          name: workflow.name,
          triggerType: workflow.triggerType,
        }
      };
      
      // Check trigger conditions based on type
      if (workflow.triggerType === 'keyword' && workflow.triggerConfig) {
        const keywords = (workflow.triggerConfig as any).keywords || [];
        const matchType = (workflow.triggerConfig as any).matchType || 'contains';
        const message = (testMessage || '').toLowerCase();
        
        for (const keyword of keywords) {
          const kw = keyword.toLowerCase();
          let matched = false;
          
          if (matchType === 'exact') {
            matched = message === kw;
          } else if (matchType === 'contains') {
            matched = message.includes(kw);
          } else if (matchType === 'regex') {
            try {
              matched = new RegExp(keyword, 'i').test(message);
            } catch { matched = false; }
          }
          
          if (matched) {
            testResult.wouldTrigger = true;
            testResult.matchedConditions.push(`Keyword: "${keyword}"`);
          }
        }
      } else if (workflow.triggerType === 'message_count' && workflow.triggerConfig) {
        const threshold = (workflow.triggerConfig as any).messageCountThreshold || 1;
        const currentCount = testContext?.messageCount || 0;
        if (currentCount >= threshold) {
          testResult.wouldTrigger = true;
          testResult.matchedConditions.push(`Message count: ${currentCount} >= ${threshold}`);
        }
      }
      
      res.json({ testResult });
    } catch (error) {
      console.error("Test automation error:", error);
      res.status(500).json({ error: "Failed to test automation" });
    }
  });

  // =============================================
  // PHASE 5: WIDGET SETTINGS ENDPOINTS
  // =============================================

  // Widget settings validation schema
  const widgetSettingsSchema = z.object({
    position: z.enum(['bottom-left', 'bottom-right']).optional(),
    theme: z.enum(['light', 'dark', 'auto']).optional(),
    primaryColor: z.string().regex(/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/, 'Invalid hex color').optional(),
    accentColor: z.string().regex(/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/, 'Invalid hex color').optional().nullable(),
    avatarUrl: z.string().url().optional().nullable(),
    bubbleSize: z.enum(['small', 'medium', 'large']).optional(),
    windowWidth: z.number().min(280).max(600).optional(),
    windowHeight: z.number().min(400).max(800).optional(),
    borderRadius: z.number().min(0).max(32).optional(),
    showPoweredBy: z.boolean().optional(),
    headerTitle: z.string().max(50).optional().nullable(),
    headerSubtitle: z.string().max(30).optional().nullable(),
    welcomeMessage: z.string().max(500).optional().nullable(),
    placeholderText: z.string().max(100).optional().nullable(),
    offlineMessage: z.string().max(500).optional().nullable(),
    autoOpen: z.boolean().optional(),
    autoOpenDelay: z.number().min(0).max(60).optional(),
    autoOpenOnce: z.boolean().optional(),
    soundEnabled: z.boolean().optional(),
    soundUrl: z.string().url().optional().nullable(),
    mobileFullscreen: z.boolean().optional(),
    mobileBreakpoint: z.number().min(320).max(768).optional(),
    customCss: z.string().max(10000).optional().nullable(),
    advanced: z.object({
      hideOnPages: z.array(z.string()).optional(),
      showOnPages: z.array(z.string()).optional(),
      triggerSelector: z.string().optional(),
      zIndex: z.number().optional(),
    }).optional(),
  });

  // Get widget settings for a bot
  app.get("/api/bots/:botId/widget-settings", requireAuth, async (req, res) => {
    try {
      const { botId } = req.params;
      
      // Validate tenant access
      if (!await validateBotAccess(req, res, botId)) return;
      
      const settings = await storage.getWidgetSettingsWithDefaults(botId);
      res.json({ settings });
    } catch (error) {
      console.error("Get widget settings error:", error);
      res.status(500).json({ error: "Failed to get widget settings" });
    }
  });

  // Update widget settings for a bot (upsert)
  app.put("/api/bots/:botId/widget-settings", requireAuth, async (req, res) => {
    try {
      const { botId } = req.params;
      
      // Validate tenant access
      if (!await validateBotAccess(req, res, botId)) return;
      
      const validation = widgetSettingsSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid widget settings", details: validation.error.format() });
      }
      
      const settings = await storage.upsertWidgetSettings(botId, validation.data as any);
      res.json({ settings });
    } catch (error) {
      console.error("Update widget settings error:", error);
      res.status(500).json({ error: "Failed to update widget settings" });
    }
  });

  // Delete widget settings for a bot (reset to defaults)
  app.delete("/api/bots/:botId/widget-settings", requireAuth, async (req, res) => {
    try {
      const { botId } = req.params;
      
      // Validate tenant access
      if (!await validateBotAccess(req, res, botId)) return;
      
      await storage.deleteWidgetSettings(botId);
      res.json({ success: true, message: "Widget settings reset to defaults" });
    } catch (error) {
      console.error("Delete widget settings error:", error);
      res.status(500).json({ error: "Failed to reset widget settings" });
    }
  });

  // Update the widget config endpoint to return full settings
  app.get('/api/widget/full-config/:clientId/:botId', widgetCors, async (req, res) => {
    try {
      const { clientId, botId } = req.params;
      
      const botConfig = getBotConfig(clientId, botId);
      if (!botConfig) {
        return res.status(404).json({ error: 'Bot not found' });
      }
      
      const clientStatus = getClientStatus(clientId);
      if (clientStatus === 'paused') {
        return res.json({
          status: 'paused',
          message: 'This service is currently paused.'
        });
      }
      
      // Get widget settings from database
      const widgetConfig = await storage.getWidgetSettingsWithDefaults(botId);
      
      // Generate signed widget token (expires in 24 hours)
      const widgetToken = generateWidgetToken(clientId, botId, 86400);
      
      // Return full widget configuration
      res.json({
        status: 'active',
        token: widgetToken,
        bot: {
          name: botConfig.name,
          businessName: botConfig.businessProfile?.businessName || botConfig.name,
        },
        widget: {
          position: widgetConfig.position,
          theme: widgetConfig.theme,
          primaryColor: widgetConfig.primaryColor,
          accentColor: widgetConfig.accentColor,
          avatarUrl: widgetConfig.avatarUrl,
          bubbleSize: widgetConfig.bubbleSize,
          windowWidth: widgetConfig.windowWidth,
          windowHeight: widgetConfig.windowHeight,
          borderRadius: widgetConfig.borderRadius,
          showPoweredBy: widgetConfig.showPoweredBy,
          headerTitle: widgetConfig.headerTitle || botConfig.businessProfile?.businessName || 'Chat Assistant',
          headerSubtitle: widgetConfig.headerSubtitle,
          welcomeMessage: widgetConfig.welcomeMessage || `Hi! I'm the ${botConfig.businessProfile?.businessName || 'AI'} assistant. How can I help you today?`,
          placeholderText: widgetConfig.placeholderText,
          offlineMessage: widgetConfig.offlineMessage,
          autoOpen: widgetConfig.autoOpen,
          autoOpenDelay: widgetConfig.autoOpenDelay,
          autoOpenOnce: widgetConfig.autoOpenOnce,
          soundEnabled: widgetConfig.soundEnabled,
          soundUrl: widgetConfig.soundUrl,
          mobileFullscreen: widgetConfig.mobileFullscreen,
          mobileBreakpoint: widgetConfig.mobileBreakpoint,
          customCss: widgetConfig.customCss,
          advanced: widgetConfig.advanced,
        }
      });
    } catch (error) {
      console.error('Widget full config error:', error);
      res.status(500).json({ error: 'Failed to load widget configuration' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

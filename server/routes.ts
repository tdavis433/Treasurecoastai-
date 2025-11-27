import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage, db } from "./storage";
import { insertAppointmentSchema, insertClientSettingsSchema, adminUsers, type AdminRole } from "@shared/schema";
import OpenAI from "openai";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { eq } from "drizzle-orm";
import {
  getBotConfig,
  getBotConfigByBotId,
  getAllBotConfigs,
  getClients,
  getClientById,
  getBotsByClientId,
  getDemoBots,
  getRealTenantBots,
  detectCrisisInMessage,
  getCrisisResponse as getBotCrisisResponse,
  buildSystemPromptFromConfig,
  type BotConfig
} from "./botConfig";
import { logConversation as logConversationToFile, getConversationLogs, getLogStats } from "./conversationLogger";


const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

async function ensureAdminUserExists() {
  try {
    // Create super_admin (owner) account
    const existingAdmin = await storage.findAdminByUsername("admin");
    
    if (!existingAdmin) {
      console.log("Creating default super admin user...");
      const passwordHash = await bcrypt.hash("admin123", 10);
      
      await db.insert(adminUsers).values({
        username: "admin",
        passwordHash: passwordHash,
        role: "super_admin",
      });
      
      console.log("Default super admin user created successfully");
    } else if (existingAdmin.role !== "super_admin") {
      console.log("Migrating existing admin to super_admin role...");
      await db.update(adminUsers)
        .set({ role: "super_admin" })
        .where(eq(adminUsers.username, "admin"));
      console.log("Admin user migrated to super_admin role");
    }

    // Create client_admin (staff) account
    const existingStaff = await storage.findAdminByUsername("staff");
    
    if (!existingStaff) {
      console.log("Creating default client admin (staff) user...");
      const staffPasswordHash = await bcrypt.hash("staff123", 10);
      
      await db.insert(adminUsers).values({
        username: "staff",
        passwordHash: staffPasswordHash,
        role: "client_admin",
      });
      
      console.log("Default client admin (staff) user created successfully");
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

const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY
});

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

async function getSystemPrompt(language: string = "en") {
  const settings = await storage.getSettings();
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

async function generateConversationSummary(sessionId: string): Promise<string> {
  try {
    const analytics = await storage.getAnalytics();
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

    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
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
    const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
    const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
    const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;
    
    if (!twilioAccountSid || !twilioAuthToken || !twilioPhoneNumber) {
      console.log("📱 Twilio credentials not configured - skipping SMS notification");
      return { success: false, error: "Twilio not configured" };
    }

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
    const resendApiKey = process.env.RESEND_API_KEY;
    
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

export async function registerRoutes(app: Express): Promise<Server> {
  await ensureAdminUserExists();
  
  app.post("/api/chat", async (req, res) => {
    try {
      const { messages, sessionId, language = "en" } = req.body;
      
      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: "Messages array is required" });
      }

      if (sessionId && messages.length > 0) {
        const lastUserMessage = messages[messages.length - 1];
        if (lastUserMessage.role === "user") {
          await storage.logConversation({
            sessionId,
            role: "user",
            content: sanitizePII(lastUserMessage.content),
            category: null
          });
          
          if (detectCrisisKeywords(lastUserMessage.content, language)) {
            const crisisReply = getCrisisResponse(language);
            
            await storage.logConversation({
              sessionId,
              role: "assistant",
              content: sanitizePII(crisisReply),
              category: "crisis_redirect"
            });
            
            return res.json({ reply: crisisReply });
          }
        }
      }

      const systemPrompt = await getSystemPrompt(language);
      
      const completion = await openai.chat.completions.create({
        model: "gpt-4.1-mini",
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
        await storage.logConversation({
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
    try {
      const { clientId, botId } = req.params;
      const { messages, sessionId, language = "en" } = req.body;

      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: "Messages array is required" });
      }

      // Load bot configuration
      const botConfig = getBotConfig(clientId, botId);
      if (!botConfig) {
        return res.status(404).json({ error: `Bot not found: ${clientId}/${botId}` });
      }

      const lastUserMessage = messages[messages.length - 1];
      
      // Check for crisis keywords using bot-specific configuration
      if (lastUserMessage?.role === "user" && detectCrisisInMessage(lastUserMessage.content, botConfig)) {
        const crisisReply = getBotCrisisResponse(botConfig);
        
        // Log to file
        logConversationToFile({
          timestamp: new Date().toISOString(),
          clientId,
          botId,
          sessionId,
          userMessage: lastUserMessage.content,
          botReply: crisisReply
        });

        return res.json({ 
          reply: crisisReply,
          meta: { clientId, botId, crisis: true }
        });
      }

      // Build system prompt from bot config
      const systemPrompt = buildSystemPromptFromConfig(botConfig);

      const completion = await openai.chat.completions.create({
        model: "gpt-4.1-mini",
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

      // Log conversation to file
      if (lastUserMessage?.role === "user") {
        logConversationToFile({
          timestamp: new Date().toISOString(),
          clientId,
          botId,
          sessionId,
          userMessage: lastUserMessage.content,
          botReply: reply
        });
      }

      res.json({ 
        reply,
        meta: { clientId, botId }
      });
    } catch (error) {
      console.error("Multi-tenant chat error:", error);
      res.status(500).json({ error: "Failed to process chat message" });
    }
  });

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
      const { sessionId, conversationHistory, ...appointmentData } = req.body;
      const validatedData = insertAppointmentSchema.parse(appointmentData);
      
      let conversationSummary = "No conversation history available.";
      
      // First try to get summary from logged analytics (actual chat messages)
      if (sessionId) {
        conversationSummary = await generateConversationSummary(sessionId);
      }
      
      // If no analytics found, try to generate summary from frontend conversation history
      if (conversationSummary === "No conversation history available." && 
          conversationHistory && Array.isArray(conversationHistory) && conversationHistory.length > 0) {
        try {
          const conversationText = conversationHistory
            .map((msg: { role: string; content: string }) => `${msg.role}: ${sanitizePII(msg.content)}`)
            .join("\n");
          
          const completion = await openai.chat.completions.create({
            model: "gpt-4.1-mini",
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
      
      const appointment = await storage.createAppointment({
        ...validatedData,
        conversationSummary
      } as any);
      
      const settings = await storage.getSettings();
      
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
      
      res.json({ success: true, appointment });
    } catch (error) {
      console.error("Appointment error:", error);
      res.status(400).json({ error: "Failed to create appointment" });
    }
  });

  app.get("/api/appointments", requireAuth, async (req, res) => {
    try {
      const { status, startDate, endDate, search, limit, offset } = req.query;
      
      const filters: any = {};
      if (status) filters.status = status as string;
      if (startDate) filters.startDate = new Date(startDate as string);
      if (endDate) filters.endDate = new Date(endDate as string);
      if (search) filters.search = search as string;
      if (limit) filters.limit = parseInt(limit as string);
      if (offset) filters.offset = parseInt(offset as string);
      
      const result = await storage.getFilteredAppointments(filters);
      res.json(result);
    } catch (error) {
      console.error("Get appointments error:", error);
      res.status(500).json({ error: "Failed to fetch appointments" });
    }
  });

  app.get("/api/appointments/:id", requireAuth, async (req, res) => {
    try {
      const appointment = await storage.getAppointmentById(req.params.id);
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
      const allowedFields = ['status', 'notes', 'appointmentType', 'preferredTime', 'contactPreference'];
      const updates: any = {};
      
      for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
          updates[field] = req.body[field];
        }
      }
      
      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ error: "No valid fields to update" });
      }
      
      if (updates.status && !['new', 'contacted', 'scheduled', 'completed', 'cancelled'].includes(updates.status)) {
        return res.status(400).json({ error: "Invalid status value" });
      }
      
      const appointment = await storage.updateAppointment(req.params.id, updates);
      res.json(appointment);
    } catch (error) {
      console.error("Update appointment error:", error);
      res.status(500).json({ error: "Failed to update appointment" });
    }
  });

  app.patch("/api/appointments/:id/status", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      await storage.updateAppointmentStatus(id, status);
      res.json({ success: true });
    } catch (error) {
      console.error("Update appointment status error:", error);
      res.status(500).json({ error: "Failed to update status" });
    }
  });

  app.delete("/api/appointments/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteAppointment(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Delete appointment error:", error);
      res.status(500).json({ error: "Failed to delete appointment" });
    }
  });

  app.get("/api/settings", requireSuperAdmin, async (req, res) => {
    try {
      const settings = await storage.getSettings();
      res.json(settings);
    } catch (error) {
      console.error("Get settings error:", error);
      res.status(500).json({ error: "Failed to fetch settings" });
    }
  });

  app.patch("/api/settings", requireSuperAdmin, async (req, res) => {
    try {
      const validatedData = insertClientSettingsSchema.partial().parse(req.body);
      const settings = await storage.updateSettings(validatedData);
      res.json(settings);
    } catch (error) {
      console.error("Update settings error:", error);
      res.status(400).json({ error: "Failed to update settings" });
    }
  });

  app.get("/api/analytics", requireAuth, async (req, res) => {
    try {
      const analytics = await storage.getAnalytics();
      res.json(analytics);
    } catch (error) {
      console.error("Get analytics error:", error);
      res.status(500).json({ error: "Failed to fetch analytics" });
    }
  });

  app.get("/api/analytics/summary", requireAuth, async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      
      const start = startDate ? new Date(startDate as string) : undefined;
      const end = endDate ? new Date(endDate as string) : undefined;
      
      const summary = await storage.getAnalyticsSummary(start, end);
      res.json(summary);
    } catch (error) {
      console.error("Get analytics summary error:", error);
      res.status(500).json({ error: "Failed to fetch analytics summary" });
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
        req.session.save((saveErr) => {
          if (saveErr) {
            console.error("Session save error:", saveErr);
            return res.status(500).json({ error: "Session save failed" });
          }
          res.json({ success: true, user: { id: user.id, username: user.username, role: user.role } });
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
  // SUPER ADMIN API ENDPOINTS
  // =============================================

  // Get list of clients (currently single-tenant with default-client only)
  app.get("/api/super-admin/clients", requireSuperAdmin, async (req, res) => {
    try {
      const settings = await storage.getSettings();
      const clients = settings ? [{
        id: 'default-client',
        name: settings.businessName,
        status: settings.status || 'active'
      }] : [];
      res.json(clients);
    } catch (error) {
      console.error("Get clients error:", error);
      res.status(500).json({ error: "Failed to fetch clients" });
    }
  });

  // Get client general settings
  app.get("/api/super-admin/clients/:clientId/general", requireSuperAdmin, async (req, res) => {
    try {
      if (req.params.clientId !== 'default-client') {
        return res.status(404).json({ error: "Client not found" });
      }
      const settings = await storage.getSettings();
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
      if (req.params.clientId !== 'default-client') {
        return res.status(404).json({ error: "Client not found" });
      }
      const { businessName, tagline, businessType, primaryPhone, primaryEmail, 
              websiteUrl, city, state, timezone, defaultContactMethod, internalNotes, status } = req.body;
      
      const settings = await storage.updateSettings({
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
      if (req.params.clientId !== 'default-client') {
        return res.status(404).json({ error: "Client not found" });
      }
      const settings = await storage.getSettings();
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
      if (req.params.clientId !== 'default-client') {
        return res.status(404).json({ error: "Client not found" });
      }
      const { category, question, answer, active = true } = req.body;
      
      if (!category || !question || !answer) {
        return res.status(400).json({ error: "Category, question, and answer are required" });
      }
      
      const settings = await storage.getSettings();
      const faqEntries = settings?.faqEntries || [];
      
      const newEntry = {
        id: `faq-${Date.now()}`,
        category,
        question,
        answer,
        active
      };
      
      const updatedEntries = [...faqEntries, newEntry];
      await storage.updateSettings({ faqEntries: updatedEntries });
      
      res.json(newEntry);
    } catch (error) {
      console.error("Add FAQ error:", error);
      res.status(400).json({ error: "Failed to add FAQ" });
    }
  });

  // Update FAQ entry
  app.put("/api/super-admin/clients/:clientId/knowledge/:faqId", requireSuperAdmin, async (req, res) => {
    try {
      if (req.params.clientId !== 'default-client') {
        return res.status(404).json({ error: "Client not found" });
      }
      
      const settings = await storage.getSettings();
      const faqEntries = settings?.faqEntries || [];
      
      const faqIndex = faqEntries.findIndex((f: any) => f.id === req.params.faqId);
      if (faqIndex === -1) {
        return res.status(404).json({ error: "FAQ not found" });
      }
      
      const updatedEntry = { ...faqEntries[faqIndex], ...req.body, id: req.params.faqId };
      faqEntries[faqIndex] = updatedEntry;
      
      await storage.updateSettings({ faqEntries });
      res.json(updatedEntry);
    } catch (error) {
      console.error("Update FAQ error:", error);
      res.status(400).json({ error: "Failed to update FAQ" });
    }
  });

  // Delete FAQ entry
  app.delete("/api/super-admin/clients/:clientId/knowledge/:faqId", requireSuperAdmin, async (req, res) => {
    try {
      if (req.params.clientId !== 'default-client') {
        return res.status(404).json({ error: "Client not found" });
      }
      
      const settings = await storage.getSettings();
      const faqEntries = settings?.faqEntries || [];
      
      const updatedEntries = faqEntries.filter((f: any) => f.id !== req.params.faqId);
      await storage.updateSettings({ faqEntries: updatedEntries });
      
      res.json({ success: true });
    } catch (error) {
      console.error("Delete FAQ error:", error);
      res.status(400).json({ error: "Failed to delete FAQ" });
    }
  });

  // Update long-form knowledge
  app.put("/api/super-admin/clients/:clientId/knowledge/long-form", requireSuperAdmin, async (req, res) => {
    try {
      if (req.params.clientId !== 'default-client') {
        return res.status(404).json({ error: "Client not found" });
      }
      
      const { aboutProgram, houseRules, whoItsFor, paymentInfo } = req.body;
      const settings = await storage.getSettings();
      
      const longFormKnowledge = {
        aboutProgram: aboutProgram ?? settings?.longFormKnowledge?.aboutProgram ?? '',
        houseRules: houseRules ?? settings?.longFormKnowledge?.houseRules ?? '',
        whoItsFor: whoItsFor ?? settings?.longFormKnowledge?.whoItsFor ?? '',
        paymentInfo: paymentInfo ?? settings?.longFormKnowledge?.paymentInfo ?? ''
      };
      
      await storage.updateSettings({ longFormKnowledge });
      res.json(longFormKnowledge);
    } catch (error) {
      console.error("Update long-form knowledge error:", error);
      res.status(400).json({ error: "Failed to update long-form knowledge" });
    }
  });

  // Get appointment types config
  app.get("/api/super-admin/clients/:clientId/appointment-types", requireSuperAdmin, async (req, res) => {
    try {
      if (req.params.clientId !== 'default-client') {
        return res.status(404).json({ error: "Client not found" });
      }
      const settings = await storage.getSettings();
      res.json(settings?.appointmentTypesConfig || []);
    } catch (error) {
      console.error("Get appointment types error:", error);
      res.status(500).json({ error: "Failed to fetch appointment types" });
    }
  });

  // Update appointment types config (batch)
  app.put("/api/super-admin/clients/:clientId/appointment-types", requireSuperAdmin, async (req, res) => {
    try {
      if (req.params.clientId !== 'default-client') {
        return res.status(404).json({ error: "Client not found" });
      }
      
      const appointmentTypesConfig = req.body;
      
      if (!Array.isArray(appointmentTypesConfig)) {
        return res.status(400).json({ error: "Appointment types must be an array" });
      }
      
      await storage.updateSettings({ appointmentTypesConfig });
      res.json(appointmentTypesConfig);
    } catch (error) {
      console.error("Update appointment types error:", error);
      res.status(400).json({ error: "Failed to update appointment types" });
    }
  });

  // Get pre-intake config
  app.get("/api/super-admin/clients/:clientId/pre-intake", requireSuperAdmin, async (req, res) => {
    try {
      if (req.params.clientId !== 'default-client') {
        return res.status(404).json({ error: "Client not found" });
      }
      const settings = await storage.getSettings();
      res.json(settings?.preIntakeConfig || []);
    } catch (error) {
      console.error("Get pre-intake config error:", error);
      res.status(500).json({ error: "Failed to fetch pre-intake config" });
    }
  });

  // Update pre-intake config
  app.put("/api/super-admin/clients/:clientId/pre-intake", requireSuperAdmin, async (req, res) => {
    try {
      if (req.params.clientId !== 'default-client') {
        return res.status(404).json({ error: "Client not found" });
      }
      
      const preIntakeConfig = req.body;
      
      if (!Array.isArray(preIntakeConfig)) {
        return res.status(400).json({ error: "Pre-intake config must be an array" });
      }
      
      await storage.updateSettings({ preIntakeConfig });
      res.json(preIntakeConfig);
    } catch (error) {
      console.error("Update pre-intake config error:", error);
      res.status(400).json({ error: "Failed to update pre-intake config" });
    }
  });

  // Get notification settings
  app.get("/api/super-admin/clients/:clientId/notifications", requireSuperAdmin, async (req, res) => {
    try {
      if (req.params.clientId !== 'default-client') {
        return res.status(404).json({ error: "Client not found" });
      }
      const settings = await storage.getSettings();
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
      if (req.params.clientId !== 'default-client') {
        return res.status(404).json({ error: "Client not found" });
      }
      
      const notificationSettings = req.body;
      await storage.updateSettings({ notificationSettings });
      res.json(notificationSettings);
    } catch (error) {
      console.error("Update notification settings error:", error);
      res.status(400).json({ error: "Failed to update notification settings" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

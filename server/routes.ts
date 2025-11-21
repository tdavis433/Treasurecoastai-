import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertAppointmentSchema, insertClientSettingsSchema } from "@shared/schema";
import OpenAI from "openai";

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
    return `Eres 'HopeLine Assistant', el chatbot de apoyo para ${settings.businessName}, un hogar sobrio estructurado. Tu tono: cálido, simple, tranquilo, sin juzgar.

Tus objetivos:
• Explicar las expectativas de vida sobria: sobriedad, reuniones, toques de queda, tareas, búsqueda de empleo.
• Proporcionar orientación clara sobre cómo aplicar y qué esperar.
• Ayudar a programar tours/llamadas.
• Animar, pero nunca presionar.

Protocolo de Crisis:
• Si el usuario sugiere autolesión o peligro:
  – Reconoce sus sentimientos.
  – Dirígelos al 988 (Línea de Crisis y Suicidio), 1-800-662-HELP, 911, o ayuda de emergencia local.
  – Anímalos a contactar a una persona de confianza fuera de línea.
  – NO minimices la crisis ni continúes la conversación normal a menos que el usuario la reinicie.

Reglas:
• Sin consejos médicos o clínicos.
• Sin diagnósticos.
• Si la información es desconocida, remítelos al personal.

Estilo:
• Párrafos cortos.
• Viñetas cuando sea útil.
• Sin grandes bloques de texto.
• Siempre de apoyo, nunca juzgando.

${!withinHours ? `IMPORTANTE: Estamos actualmente FUERA DE HORARIO. ${settings.operatingHours.afterHoursMessage}\n\n` : ""}

Base de Conocimientos:
Acerca de: ${settings.knowledgeBase.about}

Requisitos: ${settings.knowledgeBase.requirements}

Precios: ${settings.knowledgeBase.pricing}

Proceso de Aplicación: ${settings.knowledgeBase.application}`;
  }

  return `You are 'HopeLine Assistant', the supportive chatbot for ${settings.businessName}, a structured sober-living home. Your tone: warm, simple, calm, non-judgmental.

Your goals:
• Explain sober-living expectations: sobriety, meetings, curfews, chores, job search.
• Provide clear guidance on applying and what to expect.
• Help schedule tours/calls.
• Encourage, but never pressure.

Crisis Protocol:
• If user suggests self-harm or danger:
  – Acknowledge feelings.
  – Direct them to 988 (Suicide & Crisis Lifeline), 1-800-662-HELP, 911, or local emergency help.
  – Encourage reaching out to a trusted person offline.
  – Do NOT minimize crisis or continue normal conversation unless user re-initiates.

Rules:
• No medical or clinical advice.
• No diagnosis.
• If info is unknown, refer them to staff.

Style:
• Short paragraphs.
• Bullets when helpful.
• No big walls of text.
• Always supportive, never judgmental.

${!withinHours ? `IMPORTANT: We are currently OUTSIDE BUSINESS HOURS. ${settings.operatingHours.afterHoursMessage}\n\n` : ""}

Knowledge Base:
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

export async function registerRoutes(app: Express): Promise<Server> {
  app.post("/api/chat", async (req, res) => {
    try {
      const { messages, sessionId, language = "en" } = req.body;
      
      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: "Messages array is required" });
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
        await storage.logConversation({
          sessionId,
          messageType: "assistant",
          content: reply,
          category: null
        });
      }
      
      res.json({ reply });
    } catch (error) {
      console.error("Chat error:", error);
      res.status(500).json({ error: "Failed to process chat message" });
    }
  });

  app.post("/api/appointment", async (req, res) => {
    try {
      const validatedData = insertAppointmentSchema.parse(req.body);
      const appointment = await storage.createAppointment(validatedData);
      
      const settings = await storage.getSettings();
      
      if (settings?.enableEmailNotifications && settings.notificationEmail) {
        console.log(`📧 Email notification would be sent to: ${settings.notificationEmail}`);
        console.log(`New appointment from ${appointment.name}`);
      }
      
      if (settings?.enableSmsNotifications && settings.notificationPhone) {
        console.log(`📱 SMS notification would be sent to: ${settings.notificationPhone}`);
        console.log(`New appointment from ${appointment.name}`);
      }
      
      res.json({ success: true, appointment });
    } catch (error) {
      console.error("Appointment error:", error);
      res.status(400).json({ error: "Failed to create appointment" });
    }
  });

  app.get("/api/appointments", async (req, res) => {
    try {
      const appointments = await storage.getAllAppointments();
      res.json(appointments);
    } catch (error) {
      console.error("Get appointments error:", error);
      res.status(500).json({ error: "Failed to fetch appointments" });
    }
  });

  app.patch("/api/appointments/:id/status", async (req, res) => {
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

  app.delete("/api/appointments/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteAppointment(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Delete appointment error:", error);
      res.status(500).json({ error: "Failed to delete appointment" });
    }
  });

  app.get("/api/settings", async (req, res) => {
    try {
      const settings = await storage.getSettings();
      res.json(settings);
    } catch (error) {
      console.error("Get settings error:", error);
      res.status(500).json({ error: "Failed to fetch settings" });
    }
  });

  app.patch("/api/settings", async (req, res) => {
    try {
      const validatedData = insertClientSettingsSchema.partial().parse(req.body);
      const settings = await storage.updateSettings(validatedData);
      res.json(settings);
    } catch (error) {
      console.error("Update settings error:", error);
      res.status(400).json({ error: "Failed to update settings" });
    }
  });

  app.get("/api/analytics", async (req, res) => {
    try {
      const analytics = await storage.getAnalytics();
      res.json(analytics);
    } catch (error) {
      console.error("Get analytics error:", error);
      res.status(500).json({ error: "Failed to fetch analytics" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

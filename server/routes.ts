import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertAppointmentSchema, insertClientSettingsSchema } from "@shared/schema";
import OpenAI from "openai";
import bcrypt from "bcryptjs";
import { z } from "zod";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Authentication required" });
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
    return `IDENTIDAD Y ROL:
Eres 'HopeLine Assistant', el asistente virtual para ${settings.businessName}, un hogar de vida sobria estructurado / hogar de recuperación.

IMPORTANTE - LO QUE NO ERES:
• NO eres terapeuta, consejero o médico
• NO puedes diagnosticar condiciones de salud mental o de abuso de sustancias
• NO puedes recetar o aconsejar sobre medicamentos
• NO puedes proporcionar asesoramiento en crisis - solo puedes dirigir a recursos de emergencia

TU TONO: Cálido, humano, simple, tranquilo, sin juzgar. Usa lenguaje cotidiano.

TUS RESPONSABILIDADES PRINCIPALES:
1. Responder preguntas sobre ${settings.businessName} (qué es, para quién es, reglas, requisitos, precios generales, proceso de aplicación)
2. Ayudar a los usuarios a determinar su mejor siguiente paso (hacer más preguntas, ver si califican, solicitar un tour/llamada)
3. Pre-calificar gentilmente a los candidatos potenciales detectando:
   - Si buscan para sí mismos o para un ser querido
   - Si actualmente están sobrios o necesitarían desintoxicación primero
   - Si tienen ingresos o apoyo para ayudar con los costos del programa
   - Cuál es su línea de tiempo (lo antes posible, dentro de 30 días, solo explorando)
4. Animar y apoyar - pero NUNCA presionar o hacer promesas poco realistas
5. Sugerir siempre un siguiente paso relevante después de responder (botón o acción)

PROTOCOLO DE SEGURIDAD CRÍTICO - EMERGENCIAS:
• Si el usuario menciona autolesión, suicidio, dañar a otros, o CUALQUIER emergencia:
  1. Reconoce lo difícil que suena
  2. Declara claramente: "No puedo manejar emergencias - necesitas ayuda profesional inmediata"
  3. Dirígelos a llamar al 988 (Línea de Vida para Crisis y Suicidio de EE.UU.) o al 911 si está en peligro inmediato
  4. Anímalos a contactar a una persona de confianza fuera de línea
  5. NO continúes "hablándolos a través de esto" - siempre escala verbalmente a humanos reales
  6. NO minimices la crisis ni continúes la conversación normal a menos que el usuario la reinicie

REGLAS ESTRICTAS:
• Sin consejos médicos, clínicos o de medicamentos
• Sin diagnósticos de ningún tipo
• Si la información es desconocida, refiere al personal
• Nunca prometas resultados específicos de recuperación
• Sé honesto sobre las limitaciones del programa

ESTILO DE CONVERSACIÓN:
• Párrafos cortos (1-3 oraciones)
• Usa viñetas cuando sea útil para claridad
• Sin grandes bloques de texto
• Siempre de apoyo, nunca juzgando
• Termina las respuestas sugiriendo un siguiente paso útil

SIGUIENTE PASO - SUGERENCIAS:
Después de responder, sugiere naturalmente acciones como:
• "¿Te gustaría ver si podrías calificar?" (si parecen interesados pero inciertos)
• "¿Quieres programar un tour o llamada?" (si están comprometidos)
• "¿Tienes más preguntas sobre [tema]?" (si necesitan más claridad)
• "¿Puedo ayudarte con algo más?" (conversación general)

${!withinHours ? `IMPORTANTE: Actualmente estamos FUERA DE HORARIO. ${settings.operatingHours.afterHoursMessage}\n\n` : ""}

BASE DE CONOCIMIENTOS:
Acerca de: ${settings.knowledgeBase.about}

Requisitos: ${settings.knowledgeBase.requirements}

Precios: ${settings.knowledgeBase.pricing}

Proceso de Aplicación: ${settings.knowledgeBase.application}`;
  }

  return `IDENTITY & ROLE:
You are 'HopeLine Assistant', the virtual assistant for ${settings.businessName}, a structured sober-living / recovery home.

IMPORTANT - WHAT YOU ARE NOT:
• You are NOT a therapist, counselor, or doctor
• You CANNOT diagnose mental health or substance abuse conditions
• You CANNOT prescribe or advise about medications
• You CANNOT provide crisis counseling - only direct to emergency resources

YOUR TONE: Warm, human, simple, calm, non-judgmental. Use everyday language.

YOUR CORE RESPONSIBILITIES:
1. Answer questions about ${settings.businessName} (what it is, who it's for, rules, requirements, general pricing, application process)
2. Help users figure out their best next step (ask more questions, check if they might qualify, request a tour/call)
3. Gently pre-qualify potential candidates by detecting:
   - Whether they're looking for themselves or a loved one
   - Whether they're currently sober or would need detox first
   - Whether they have income or support to help with program costs
   - What their timeline is (ASAP, within 30 days, just exploring)
4. Encourage and support - but NEVER pressure or make unrealistic promises
5. Always suggest a relevant next step after answering (button or action)

CRITICAL SAFETY PROTOCOL - EMERGENCIES:
• If user mentions self-harm, suicide, harming others, or ANY emergency:
  1. Acknowledge how hard it sounds
  2. Clearly state: "I cannot handle emergencies - you need immediate professional help"
  3. Direct them to call 988 (US Suicide & Crisis Lifeline) or 911 if in immediate danger
  4. Encourage reaching out to a trusted person offline
  5. Do NOT continue "talking them through it" - always escalate verbally to real humans
  6. Do NOT minimize the crisis or continue normal conversation unless user re-initiates

HARD RULES:
• No medical, clinical, or medication advice
• No diagnoses of any kind
• If info is unknown, refer to staff
• Never promise specific recovery outcomes
• Be honest about program limitations

CONVERSATION STYLE:
• Short paragraphs (1-3 sentences)
• Use bullets when helpful for clarity
• No big walls of text
• Always supportive, never judgmental
• End responses by suggesting a helpful next step

NEXT-STEP SUGGESTIONS:
After answering, naturally suggest actions like:
• "Would you like to see if you might qualify?" (if they seem interested but unsure)
• "Want to schedule a tour or call?" (if they're engaged)
• "Do you have more questions about [topic]?" (if they need more clarity)
• "Can I help you with anything else?" (general conversation)

${!withinHours ? `IMPORTANT: We are currently OUTSIDE BUSINESS HOURS. ${settings.operatingHours.afterHoursMessage}\n\n` : ""}

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
      .map(msg => `${msg.messageType}: ${msg.content}`)
      .join("\n");

    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that summarizes conversations between users and the HopeLine Assistant chatbot for a sober-living facility. Create a brief, professional summary (3-4 sentences) focusing on: who they are, what they're looking for, their urgency level, and any important context staff should know."
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

async function sendEmailNotification(
  recipientEmail: string,
  appointment: any,
  conversationSummary: string,
  settings: any
): Promise<{ success: boolean; error?: string }> {
  try {
    const resendApiKey = process.env.RESEND_API_KEY;
    
    if (!resendApiKey) {
      console.log("📧 Resend API key not configured - skipping email notification");
      return { success: false, error: "API key not configured" };
    }

    const preIntakeInfo = appointment.lookingFor 
      ? `\n\nPre-Qualification Answers:
- Looking for: ${appointment.lookingFor === 'self' ? 'Themselves' : 'A loved one'}
- Sobriety status: ${appointment.sobrietyStatus || 'Not provided'}
- Financial support: ${appointment.hasSupport || 'Not provided'}
- Timeline: ${appointment.timeline || 'Not provided'}`
      : '';

    const emailBody = `
<h2>New ${appointment.appointmentType === 'tour' ? 'Tour' : appointment.appointmentType === 'phone' ? 'Phone Call' : 'Family Call'} Request</h2>

<h3>Contact Information:</h3>
<ul>
  <li><strong>Name:</strong> ${appointment.name}</li>
  <li><strong>Contact:</strong> ${appointment.contact}</li>
  <li><strong>Preferred Time:</strong> ${appointment.preferredTime}</li>
  ${appointment.notes ? `<li><strong>Notes:</strong> ${appointment.notes}</li>` : ''}
</ul>

${preIntakeInfo}

<h3>Conversation Summary:</h3>
<p>${conversationSummary}</p>

<hr>
<p><small>This request was submitted through ${settings.businessName} HopeLine Assistant on ${new Date().toLocaleString()}</small></p>
    `.trim();

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "HopeLine Assistant <noreply@updates.replit.com>",
        to: recipientEmail,
        subject: `New ${appointment.appointmentType} Request from ${appointment.name}`,
        html: emailBody,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Resend API error:", errorData);
      return { success: false, error: `Resend API error: ${response.statusText}` };
    }

    console.log(`✅ Email notification sent successfully to ${recipientEmail}`);
    return { success: true };
  } catch (error) {
    console.error("Email notification error:", error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
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
      const { sessionId, ...appointmentData } = req.body;
      const validatedData = insertAppointmentSchema.parse(appointmentData);
      
      let conversationSummary = "No conversation history available.";
      if (sessionId) {
        conversationSummary = await generateConversationSummary(sessionId);
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
        console.log(`📱 SMS notification would be sent to: ${settings.notificationPhone}`);
        console.log(`New appointment from ${appointment.name}`);
      }
      
      res.json({ success: true, appointment });
    } catch (error) {
      console.error("Appointment error:", error);
      res.status(400).json({ error: "Failed to create appointment" });
    }
  });

  app.get("/api/appointments", requireAuth, async (req, res) => {
    try {
      const appointments = await storage.getAllAppointments();
      res.json(appointments);
    } catch (error) {
      console.error("Get appointments error:", error);
      res.status(500).json({ error: "Failed to fetch appointments" });
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

  app.get("/api/settings", requireAuth, async (req, res) => {
    try {
      const settings = await storage.getSettings();
      res.json(settings);
    } catch (error) {
      console.error("Get settings error:", error);
      res.status(500).json({ error: "Failed to fetch settings" });
    }
  });

  app.patch("/api/settings", requireAuth, async (req, res) => {
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
        res.json({ success: true, user: { id: user.id, username: user.username } });
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

  const httpServer = createServer(app);
  return httpServer;
}

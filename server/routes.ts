import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertAppointmentSchema } from "@shared/schema";
import OpenAI from "openai";

const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY
});

const SYSTEM_PROMPT = `You are 'HopeLine Assistant', the supportive chatbot for The Faith House, a structured sober-living home. Your tone: warm, simple, calm, non-judgmental.

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
• If info is unknown (prices, exact policy), say: "Pricing varies; staff can confirm exact details."

Style:
• Short paragraphs.
• Bullets when helpful.
• No big walls of text.
• Always supportive, never judgmental.

Knowledge Base:
The Faith House is a structured sober-living environment designed to support individuals in their recovery journey. The program provides:
- Safe, structured housing with accountability
- Mandatory attendance at recovery meetings
- Established curfews and house rules
- Chore responsibilities and community living
- Job search support and employment expectations
- Respectful, supportive community environment

Requirements for residents:
- Maintain complete sobriety (no alcohol or drugs)
- Attend required recovery meetings regularly
- Respect curfew times
- Respect all staff and fellow residents
- Maintain cleanliness in personal and common areas
- Work or actively seek employment
- Follow all house rules and guidelines

Pricing: Covers housing, utilities, and support services. Exact pricing varies and should be confirmed with staff during the application process.

Application Process: Typically involves providing personal information, background details, emergency contact, and agreement to follow all house rules and expectations.`;

export async function registerRoutes(app: Express): Promise<Server> {
  app.post("/api/chat", async (req, res) => {
    try {
      const { messages } = req.body;
      
      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: "Messages array is required" });
      }

      const completion = await openai.chat.completions.create({
        model: "gpt-4.1-mini",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...messages
        ],
        max_completion_tokens: 500,
      });

      const reply = completion.choices[0]?.message?.content || "I'm here to help. How can I assist you today?";
      
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
      
      console.log("New appointment request:", appointment);
      
      res.json({ success: true, appointment });
    } catch (error) {
      console.error("Appointment error:", error);
      res.status(400).json({ error: "Failed to create appointment" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

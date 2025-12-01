import type { Express, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { channelService } from "./channels/ChannelService";
import { db } from "./storage";
import { workspaceMemberships, channels, conversations } from "@shared/schema";
import type { ChannelType, WebhookPayload } from "./channels/types";

const createChannelSchema = z.object({
  workspaceId: z.string(),
  type: z.enum(["chat_widget", "email", "facebook", "instagram", "whatsapp", "twitter", "sms", "api"]),
  name: z.string().min(1),
  config: z.record(z.any()).optional(),
});

const updateChannelSchema = z.object({
  name: z.string().min(1).optional(),
  config: z.record(z.any()).optional(),
  status: z.enum(["active", "paused", "error"]).optional(),
});

const sendMessageSchema = z.object({
  conversationId: z.string(),
  content: z.string().min(1),
  contentType: z.enum(["text", "image", "file", "audio", "video", "rich"]).optional(),
  richContent: z.record(z.any()).optional(),
  senderName: z.string().optional(),
  isAiGenerated: z.boolean().optional(),
});

async function verifyWorkspaceAccess(userId: string, workspaceId: string, userRole: string): Promise<boolean> {
  if (userRole === "super_admin") {
    return true;
  }
  
  const membership = await db.query.workspaceMemberships.findFirst({
    where: and(
      eq(workspaceMemberships.userId, userId),
      eq(workspaceMemberships.workspaceId, workspaceId)
    ),
  });
  
  return !!membership;
}

async function getChannelWorkspaceId(channelId: string): Promise<string | null> {
  const channel = await db.query.channels.findFirst({
    where: eq(channels.id, channelId),
  });
  return channel?.workspaceId || null;
}

async function getConversationWorkspaceId(conversationId: string): Promise<string | null> {
  const conversation = await db.query.conversations.findFirst({
    where: eq(conversations.id, conversationId),
  });
  return conversation?.workspaceId || null;
}

export function registerChannelRoutes(app: Express, requireAuth: any) {
  app.get("/api/channels/types", requireAuth, async (req: Request, res: Response) => {
    res.json([
      { type: "chat_widget", name: "Chat Widget", description: "Website chat widget", icon: "message-circle" },
      { type: "email", name: "Email", description: "Email channel for support", icon: "mail" },
      { type: "facebook", name: "Facebook Messenger", description: "Facebook Messenger integration", icon: "facebook", comingSoon: true },
      { type: "instagram", name: "Instagram DM", description: "Instagram Direct Messages", icon: "instagram", comingSoon: true },
      { type: "whatsapp", name: "WhatsApp", description: "WhatsApp Business API", icon: "phone", comingSoon: true },
      { type: "twitter", name: "Twitter/X", description: "Twitter/X Direct Messages", icon: "twitter", comingSoon: true },
      { type: "sms", name: "SMS", description: "SMS messaging via Twilio", icon: "smartphone", comingSoon: true },
      { type: "api", name: "API", description: "Custom API integration", icon: "code", comingSoon: true },
    ]);
  });

  app.get("/api/channels", requireAuth, async (req: Request, res: Response) => {
    try {
      const workspaceId = req.query.workspaceId as string;
      if (!workspaceId) {
        return res.status(400).json({ error: "workspaceId is required" });
      }
      
      const userId = (req.session as any).userId;
      const userRole = (req.session as any).userRole;
      
      if (!await verifyWorkspaceAccess(userId, workspaceId, userRole)) {
        return res.status(403).json({ error: "Access denied to this workspace" });
      }
      
      const channelsList = await channelService.getWorkspaceChannels(workspaceId);
      res.json(channelsList);
    } catch (error) {
      console.error("Error fetching channels:", error);
      res.status(500).json({ error: "Failed to fetch channels" });
    }
  });
  
  app.post("/api/channels", requireAuth, async (req: Request, res: Response) => {
    try {
      const validatedData = createChannelSchema.parse(req.body);
      
      const userId = (req.session as any).userId;
      const userRole = (req.session as any).userRole;
      
      if (!await verifyWorkspaceAccess(userId, validatedData.workspaceId, userRole)) {
        return res.status(403).json({ error: "Access denied to this workspace" });
      }
      
      const channel = await channelService.createChannel(validatedData);
      res.status(201).json(channel);
    } catch (error: any) {
      console.error("Error creating channel:", error);
      if (error.name === "ZodError") {
        return res.status(400).json({ error: "Invalid request data", details: error.errors });
      }
      res.status(500).json({ error: error.message || "Failed to create channel" });
    }
  });
  
  app.get("/api/channels/:channelId", requireAuth, async (req: Request, res: Response) => {
    try {
      const channelId = req.params.channelId;
      const workspaceId = await getChannelWorkspaceId(channelId);
      
      if (!workspaceId) {
        return res.status(404).json({ error: "Channel not found" });
      }
      
      const userId = (req.session as any).userId;
      const userRole = (req.session as any).userRole;
      
      if (!await verifyWorkspaceAccess(userId, workspaceId, userRole)) {
        return res.status(403).json({ error: "Access denied to this channel" });
      }
      
      const channel = await channelService.getChannel(channelId);
      res.json(channel);
    } catch (error) {
      console.error("Error fetching channel:", error);
      res.status(500).json({ error: "Failed to fetch channel" });
    }
  });
  
  app.patch("/api/channels/:channelId", requireAuth, async (req: Request, res: Response) => {
    try {
      const channelId = req.params.channelId;
      const workspaceId = await getChannelWorkspaceId(channelId);
      
      if (!workspaceId) {
        return res.status(404).json({ error: "Channel not found" });
      }
      
      const userId = (req.session as any).userId;
      const userRole = (req.session as any).userRole;
      
      if (!await verifyWorkspaceAccess(userId, workspaceId, userRole)) {
        return res.status(403).json({ error: "Access denied to this channel" });
      }
      
      const validatedData = updateChannelSchema.parse(req.body);
      const channel = await channelService.updateChannel(channelId, validatedData);
      res.json(channel);
    } catch (error: any) {
      console.error("Error updating channel:", error);
      if (error.name === "ZodError") {
        return res.status(400).json({ error: "Invalid request data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update channel" });
    }
  });
  
  app.delete("/api/channels/:channelId", requireAuth, async (req: Request, res: Response) => {
    try {
      const channelId = req.params.channelId;
      const workspaceId = await getChannelWorkspaceId(channelId);
      
      if (!workspaceId) {
        return res.status(404).json({ error: "Channel not found" });
      }
      
      const userId = (req.session as any).userId;
      const userRole = (req.session as any).userRole;
      
      if (!await verifyWorkspaceAccess(userId, workspaceId, userRole)) {
        return res.status(403).json({ error: "Access denied to this channel" });
      }
      
      await channelService.deleteChannel(channelId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting channel:", error);
      res.status(500).json({ error: "Failed to delete channel" });
    }
  });
  
  app.get("/api/conversations", requireAuth, async (req: Request, res: Response) => {
    try {
      const workspaceId = req.query.workspaceId as string;
      if (!workspaceId) {
        return res.status(400).json({ error: "workspaceId is required" });
      }
      
      const userId = (req.session as any).userId;
      const userRole = (req.session as any).userRole;
      
      if (!await verifyWorkspaceAccess(userId, workspaceId, userRole)) {
        return res.status(403).json({ error: "Access denied to this workspace" });
      }
      
      const filters = {
        status: req.query.status as string | undefined,
        channelId: req.query.channelId as string | undefined,
        assignedAgentId: req.query.assignedAgentId as string | undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        offset: req.query.offset ? parseInt(req.query.offset as string) : undefined,
      };
      
      const result = await channelService.getWorkspaceConversations(workspaceId, filters);
      res.json(result);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ error: "Failed to fetch conversations" });
    }
  });
  
  app.get("/api/conversations/:conversationId", requireAuth, async (req: Request, res: Response) => {
    try {
      const conversationId = req.params.conversationId;
      const workspaceId = await getConversationWorkspaceId(conversationId);
      
      if (!workspaceId) {
        return res.status(404).json({ error: "Conversation not found" });
      }
      
      const userId = (req.session as any).userId;
      const userRole = (req.session as any).userRole;
      
      if (!await verifyWorkspaceAccess(userId, workspaceId, userRole)) {
        return res.status(403).json({ error: "Access denied to this conversation" });
      }
      
      const result = await channelService.getConversationWithMessages(conversationId);
      res.json(result);
    } catch (error) {
      console.error("Error fetching conversation:", error);
      res.status(500).json({ error: "Failed to fetch conversation" });
    }
  });
  
  app.patch("/api/conversations/:conversationId", requireAuth, async (req: Request, res: Response) => {
    try {
      const conversationId = req.params.conversationId;
      const workspaceId = await getConversationWorkspaceId(conversationId);
      
      if (!workspaceId) {
        return res.status(404).json({ error: "Conversation not found" });
      }
      
      const userId = (req.session as any).userId;
      const userRole = (req.session as any).userRole;
      
      if (!await verifyWorkspaceAccess(userId, workspaceId, userRole)) {
        return res.status(403).json({ error: "Access denied to this conversation" });
      }
      
      const conversation = await channelService.updateConversation(conversationId, req.body);
      res.json(conversation);
    } catch (error) {
      console.error("Error updating conversation:", error);
      res.status(500).json({ error: "Failed to update conversation" });
    }
  });
  
  app.post("/api/conversations/:conversationId/assign", requireAuth, async (req: Request, res: Response) => {
    try {
      const conversationId = req.params.conversationId;
      const workspaceId = await getConversationWorkspaceId(conversationId);
      
      if (!workspaceId) {
        return res.status(404).json({ error: "Conversation not found" });
      }
      
      const userId = (req.session as any).userId;
      const userRole = (req.session as any).userRole;
      
      if (!await verifyWorkspaceAccess(userId, workspaceId, userRole)) {
        return res.status(403).json({ error: "Access denied to this conversation" });
      }
      
      const { agentId } = req.body;
      const conversation = await channelService.assignConversation(conversationId, agentId || null);
      res.json(conversation);
    } catch (error) {
      console.error("Error assigning conversation:", error);
      res.status(500).json({ error: "Failed to assign conversation" });
    }
  });
  
  app.post("/api/conversations/:conversationId/resolve", requireAuth, async (req: Request, res: Response) => {
    try {
      const conversationId = req.params.conversationId;
      const workspaceId = await getConversationWorkspaceId(conversationId);
      
      if (!workspaceId) {
        return res.status(404).json({ error: "Conversation not found" });
      }
      
      const userId = (req.session as any).userId;
      const userRole = (req.session as any).userRole;
      
      if (!await verifyWorkspaceAccess(userId, workspaceId, userRole)) {
        return res.status(403).json({ error: "Access denied to this conversation" });
      }
      
      const conversation = await channelService.resolveConversation(conversationId);
      res.json(conversation);
    } catch (error) {
      console.error("Error resolving conversation:", error);
      res.status(500).json({ error: "Failed to resolve conversation" });
    }
  });
  
  app.post("/api/conversations/:conversationId/messages", requireAuth, async (req: Request, res: Response) => {
    try {
      const conversationId = req.params.conversationId;
      const workspaceId = await getConversationWorkspaceId(conversationId);
      
      if (!workspaceId) {
        return res.status(404).json({ error: "Conversation not found" });
      }
      
      const userId = (req.session as any).userId;
      const userRole = (req.session as any).userRole;
      
      if (!await verifyWorkspaceAccess(userId, workspaceId, userRole)) {
        return res.status(403).json({ error: "Access denied to this conversation" });
      }
      
      const validatedData = sendMessageSchema.parse(req.body);
      
      const conversation = await channelService.getConversation(conversationId);
      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }
      
      await channelService.sendMessage(conversation.channelId, {
        ...validatedData,
        conversationId,
      });
      
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error sending message:", error);
      if (error.name === "ZodError") {
        return res.status(400).json({ error: "Invalid request data", details: error.errors });
      }
      res.status(500).json({ error: error.message || "Failed to send message" });
    }
  });
  
  app.post("/api/channels/:channelId/webhook", async (req: Request, res: Response) => {
    try {
      const channelId = req.params.channelId;
      const channel = await channelService.getChannel(channelId);
      
      if (!channel) {
        return res.status(404).json({ error: "Channel not found" });
      }
      
      const payload: WebhookPayload = {
        channelType: channel.type as ChannelType,
        channelId,
        workspaceId: channel.workspaceId,
        eventType: req.body.event || 'message',
        payload: req.body,
        signature: req.headers['x-webhook-signature'] as string,
        timestamp: new Date(),
      };
      
      const result = await channelService.handleWebhook(channelId, payload);
      
      if (result) {
        res.json({ 
          success: true, 
          conversationId: result.conversation.id,
          messageId: result.message.id,
        });
      } else {
        res.json({ success: true, message: "Event processed" });
      }
    } catch (error: any) {
      console.error("Error handling webhook:", error);
      res.status(500).json({ error: error.message || "Webhook processing failed" });
    }
  });
}

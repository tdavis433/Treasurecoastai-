import { eq, and, desc } from "drizzle-orm";
import {
  channels,
  conversations,
  conversationMessages,
  type Channel,
  type InsertChannel,
  type Conversation,
  type ConversationMessage,
} from "@shared/schema";
import { db } from "../storage";
import type {
  ChannelType,
  IncomingMessage,
  OutgoingMessage,
  ChannelConfig,
  BaseChannelConnector,
  WebhookPayload,
} from "./types";
import { ChatWidgetConnector } from "./ChatWidgetConnector";
import { EmailConnector } from "./EmailConnector";

type DatabaseType = typeof db;

class ChannelService {
  private database: DatabaseType;
  private connectors: Map<ChannelType, BaseChannelConnector>;
  
  constructor(database: DatabaseType = db) {
    this.database = database;
    this.connectors = new Map();
    this.registerConnectors();
  }
  
  private registerConnectors(): void {
    const chatWidget = new ChatWidgetConnector(this.database);
    const email = new EmailConnector(this.database);
    
    this.connectors.set('chat_widget', chatWidget);
    this.connectors.set('email', email);
  }
  
  getConnector(channelType: ChannelType): BaseChannelConnector | undefined {
    return this.connectors.get(channelType);
  }
  
  async createChannel(data: {
    workspaceId: string;
    type: string;
    name: string;
    config?: Record<string, any>;
    status?: string;
  }): Promise<Channel> {
    const connector = this.getConnector(data.type as ChannelType);
    
    if (!connector) {
      throw new Error(`Unknown channel type: ${data.type}`);
    }
    
    const validation = connector.validateConfig(data.config as ChannelConfig);
    if (!validation.valid) {
      throw new Error(`Invalid channel config: ${validation.errors?.join(', ')}`);
    }
    
    const [channel] = await this.database.insert(channels).values({
      workspaceId: data.workspaceId,
      type: data.type,
      name: data.name,
      config: data.config || {},
      status: data.status || 'active',
    }).returning();
    
    const connectionResult = await connector.connect(channel);
    if (!connectionResult.success) {
      await this.database.delete(channels).where(eq(channels.id, channel.id));
      throw new Error(`Failed to connect channel: ${connectionResult.error}`);
    }
    
    return channel;
  }
  
  async getChannel(channelId: string): Promise<Channel | undefined> {
    return await this.database.query.channels.findFirst({
      where: eq(channels.id, channelId),
    });
  }
  
  async getWorkspaceChannels(workspaceId: string): Promise<Channel[]> {
    return await this.database.query.channels.findMany({
      where: eq(channels.workspaceId, workspaceId),
      orderBy: desc(channels.createdAt),
    });
  }
  
  async updateChannel(channelId: string, updates: Partial<Channel>): Promise<Channel> {
    const [channel] = await this.database.update(channels)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(channels.id, channelId))
      .returning();
    
    return channel;
  }
  
  async deleteChannel(channelId: string): Promise<void> {
    const channel = await this.getChannel(channelId);
    if (!channel) return;
    
    const connector = this.getConnector(channel.type as ChannelType);
    if (connector) {
      await connector.disconnect(channel);
    }
    
    await this.database.delete(channels).where(eq(channels.id, channelId));
  }
  
  async processIncomingMessage(message: IncomingMessage): Promise<{
    conversation: Conversation;
    message: ConversationMessage;
  }> {
    const connector = this.getConnector(message.channelType);
    if (!connector) {
      throw new Error(`Unknown channel type: ${message.channelType}`);
    }
    
    return await connector.processIncoming(message);
  }
  
  async sendMessage(channelId: string, message: OutgoingMessage): Promise<void> {
    const channel = await this.getChannel(channelId);
    if (!channel) {
      throw new Error(`Channel not found: ${channelId}`);
    }
    
    const connector = this.getConnector(channel.type as ChannelType);
    if (!connector) {
      throw new Error(`Unknown channel type: ${channel.type}`);
    }
    
    const result = await connector.sendMessage(channel, message);
    if (!result.success) {
      throw new Error(`Failed to send message: ${result.error}`);
    }
    
    const conversation = await this.database.query.conversations.findFirst({
      where: eq(conversations.id, message.conversationId),
    });
    
    if (conversation) {
      await this.database.insert(conversationMessages).values({
        conversationId: message.conversationId,
        senderType: message.isAiGenerated ? 'bot' : 'agent',
        senderName: message.senderName || (message.isAiGenerated ? 'AI Assistant' : 'Support Agent'),
        senderAvatar: message.senderAvatar,
        content: message.content,
        contentType: message.contentType || 'text',
        richContent: message.richContent,
        isAiGenerated: message.isAiGenerated || false,
        externalMessageId: result.externalMessageId,
        status: 'sent',
      });
      
      await this.database.update(conversations)
        .set({
          messageCount: (conversation.messageCount || 0) + 1,
          lastMessageAt: new Date(),
          updatedAt: new Date(),
          firstResponseAt: conversation.firstResponseAt || new Date(),
        })
        .where(eq(conversations.id, message.conversationId));
    }
  }
  
  async handleWebhook(channelId: string, payload: WebhookPayload): Promise<{
    conversation: Conversation;
    message: ConversationMessage;
  } | null> {
    const channel = await this.getChannel(channelId);
    if (!channel) {
      throw new Error(`Channel not found: ${channelId}`);
    }
    
    const connector = this.getConnector(channel.type as ChannelType);
    if (!connector) {
      throw new Error(`Unknown channel type: ${channel.type}`);
    }
    
    const incomingMessage = await connector.handleWebhook(channel, payload);
    if (!incomingMessage) {
      return null;
    }
    
    return await connector.processIncoming(incomingMessage);
  }
  
  async getConversation(conversationId: string): Promise<Conversation | undefined> {
    return await this.database.query.conversations.findFirst({
      where: eq(conversations.id, conversationId),
    });
  }
  
  async getConversationWithMessages(conversationId: string): Promise<{
    conversation: Conversation;
    messages: ConversationMessage[];
  } | null> {
    const conversation = await this.database.query.conversations.findFirst({
      where: eq(conversations.id, conversationId),
      with: {
        messages: {
          orderBy: (messages: any, { asc }: any) => [asc(messages.createdAt)],
        },
      },
    });
    
    if (!conversation) return null;
    
    return {
      conversation,
      messages: (conversation as any).messages || [],
    };
  }
  
  async getWorkspaceConversations(
    workspaceId: string,
    filters: {
      status?: string;
      channelId?: string;
      assignedAgentId?: string;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<{ conversations: Conversation[]; total: number }> {
    const conditions = [eq(conversations.workspaceId, workspaceId)];
    
    if (filters.status) {
      conditions.push(eq(conversations.status, filters.status));
    }
    
    if (filters.channelId) {
      conditions.push(eq(conversations.channelId, filters.channelId));
    }
    
    if (filters.assignedAgentId) {
      conditions.push(eq(conversations.assignedAgentId, filters.assignedAgentId));
    }
    
    const result = await this.database.query.conversations.findMany({
      where: and(...conditions),
      orderBy: desc(conversations.lastMessageAt),
      limit: filters.limit || 50,
      offset: filters.offset || 0,
    });
    
    return {
      conversations: result,
      total: result.length,
    };
  }
  
  async updateConversation(
    conversationId: string,
    updates: Partial<Conversation>
  ): Promise<Conversation> {
    const [conversation] = await this.database.update(conversations)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(conversations.id, conversationId))
      .returning();
    
    return conversation;
  }
  
  async assignConversation(
    conversationId: string,
    agentId: string | null
  ): Promise<Conversation> {
    return await this.updateConversation(conversationId, {
      assignedAgentId: agentId,
      isHandledByBot: agentId === null,
    });
  }
  
  async resolveConversation(conversationId: string): Promise<Conversation> {
    return await this.updateConversation(conversationId, {
      status: 'resolved',
      resolvedAt: new Date(),
    });
  }
  
  async getDefaultChannel(workspaceId: string): Promise<Channel | undefined> {
    return await this.database.query.channels.findFirst({
      where: and(
        eq(channels.workspaceId, workspaceId),
        eq(channels.type, 'chat_widget'),
        eq(channels.status, 'active')
      ),
    });
  }
  
  async createDefaultChatWidgetChannel(workspaceId: string, botId: string): Promise<Channel> {
    const [channel] = await this.database.insert(channels).values({
      workspaceId,
      type: 'chat_widget',
      name: 'Website Chat Widget',
      config: { botId },
      status: 'active',
    }).returning();
    
    return channel;
  }
}

export const channelService = new ChannelService();

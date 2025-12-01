import { eq, and, desc } from "drizzle-orm";
import {
  channels,
  conversations,
  conversationMessages,
  conversationParticipants,
  conversationActivities,
  messageAttachments,
  type Channel,
  type Conversation,
  type ConversationMessage,
} from "@shared/schema";
import type {
  ChannelType,
  IncomingMessage,
  OutgoingMessage,
  ChannelConfig,
  ChannelConnectionResult,
  SendMessageResult,
  ChannelStatus,
  WebhookPayload,
  BaseChannelConnector,
} from "./types";
import { db } from "../storage";

type DatabaseType = typeof db;

export abstract class AbstractChannelConnector implements BaseChannelConnector {
  abstract readonly channelType: ChannelType;
  abstract readonly channelName: string;
  
  protected db: DatabaseType;
  
  constructor(database: DatabaseType = db) {
    this.db = database;
  }
  
  abstract connect(channel: Channel): Promise<ChannelConnectionResult>;
  abstract disconnect(channel: Channel): Promise<void>;
  abstract validateConfig(config: ChannelConfig): { valid: boolean; errors?: string[] };
  abstract getStatus(channel: Channel): Promise<ChannelStatus>;
  abstract sendMessage(channel: Channel, message: OutgoingMessage): Promise<SendMessageResult>;
  abstract handleWebhook(channel: Channel, payload: WebhookPayload): Promise<IncomingMessage | null>;
  
  async processIncoming(message: IncomingMessage): Promise<{
    conversation: Conversation;
    message: ConversationMessage;
  }> {
    const existingConversation = await this.findOrCreateConversation(message);
    const savedMessage = await this.saveMessage(existingConversation, message);
    
    await this.updateConversationActivity(existingConversation.id, savedMessage);
    
    if (message.attachments && message.attachments.length > 0) {
      await this.saveAttachments(savedMessage.id, existingConversation.workspaceId, message.attachments);
    }
    
    return {
      conversation: existingConversation,
      message: savedMessage,
    };
  }
  
  protected async findOrCreateConversation(message: IncomingMessage): Promise<Conversation> {
    const existingConversation = await this.db.query.conversations.findFirst({
      where: and(
        eq(conversations.channelId, message.channelId),
        eq(conversations.contactId, message.contactId || ''),
        eq(conversations.status, 'open')
      ),
      orderBy: desc(conversations.lastMessageAt),
    });
    
    if (existingConversation) {
      return existingConversation;
    }
    
    const [newConversation] = await this.db.insert(conversations).values({
      workspaceId: message.workspaceId,
      channelId: message.channelId,
      externalId: message.externalId,
      contactId: message.contactId,
      contactName: message.contactName,
      contactEmail: message.contactEmail,
      contactPhone: message.contactPhone,
      contactAvatar: message.contactAvatar,
      status: 'open',
      isHandledByBot: true,
      messageCount: 0,
    }).returning();
    
    if (message.contactId) {
      await this.db.insert(conversationParticipants).values({
        conversationId: newConversation.id,
        workspaceId: message.workspaceId,
        participantType: 'customer',
        participantId: message.contactId,
        name: message.contactName,
        email: message.contactEmail,
        avatar: message.contactAvatar,
        role: 'owner',
        status: 'active',
      });
    }
    
    await this.db.insert(conversationActivities).values({
      conversationId: newConversation.id,
      activityType: 'conversation_started',
      actorType: 'system',
      description: `Conversation started via ${this.channelName}`,
    });
    
    return newConversation;
  }
  
  protected async saveMessage(
    conversation: Conversation,
    message: IncomingMessage
  ): Promise<ConversationMessage> {
    const [savedMessage] = await this.db.insert(conversationMessages).values({
      conversationId: conversation.id,
      senderType: 'customer',
      senderId: message.contactId,
      senderName: message.contactName,
      senderAvatar: message.contactAvatar,
      content: message.content,
      contentType: message.contentType,
      richContent: message.richContent,
      hasAttachments: (message.attachments?.length || 0) > 0,
      externalMessageId: message.externalId,
      metadata: message.metadata || {},
    }).returning();
    
    await this.db.update(conversations)
      .set({
        messageCount: (conversation.messageCount || 0) + 1,
        lastMessageAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(conversations.id, conversation.id));
    
    return savedMessage;
  }
  
  protected async saveAttachments(
    messageId: string,
    workspaceId: string,
    attachments: IncomingMessage['attachments']
  ): Promise<void> {
    if (!attachments || attachments.length === 0) return;
    
    const attachmentRecords = attachments.map(att => ({
      messageId,
      workspaceId,
      fileName: att.fileName,
      fileType: att.fileType,
      mimeType: att.mimeType,
      fileSize: att.fileSize,
      url: att.url,
      thumbnailUrl: att.thumbnailUrl,
    }));
    
    await this.db.insert(messageAttachments).values(attachmentRecords);
  }
  
  protected async updateConversationActivity(
    conversationId: string,
    message: ConversationMessage
  ): Promise<void> {
    await this.db.insert(conversationActivities).values({
      conversationId,
      activityType: 'message_received',
      actorId: message.senderId || undefined,
      actorType: message.senderType === 'customer' ? 'customer' : 'system',
      actorName: message.senderName || undefined,
      description: `Message received: ${message.content.substring(0, 100)}...`,
    });
  }
  
  async createAgentMessage(
    channel: Channel,
    conversation: Conversation,
    content: string,
    options: {
      senderName?: string;
      senderAvatar?: string;
      isAiGenerated?: boolean;
      aiConfidence?: number;
    } = {}
  ): Promise<ConversationMessage> {
    const [savedMessage] = await this.db.insert(conversationMessages).values({
      conversationId: conversation.id,
      senderType: options.isAiGenerated ? 'bot' : 'agent',
      senderName: options.senderName || (options.isAiGenerated ? 'AI Assistant' : 'Support Agent'),
      senderAvatar: options.senderAvatar,
      content,
      contentType: 'text',
      isAiGenerated: options.isAiGenerated || false,
      aiConfidence: options.aiConfidence,
      metadata: {},
    }).returning();
    
    await this.db.update(conversations)
      .set({
        messageCount: (conversation.messageCount || 0) + 1,
        lastMessageAt: new Date(),
        updatedAt: new Date(),
        firstResponseAt: conversation.firstResponseAt || new Date(),
      })
      .where(eq(conversations.id, conversation.id));
    
    return savedMessage;
  }
}

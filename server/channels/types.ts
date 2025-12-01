import type { Channel, Conversation, ConversationMessage, ConversationParticipant } from "@shared/schema";

export type ChannelType = "chat_widget" | "email" | "facebook" | "instagram" | "whatsapp" | "twitter" | "sms" | "api";

export interface IncomingMessage {
  externalId?: string;
  channelType: ChannelType;
  channelId: string;
  workspaceId: string;
  contactId?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  contactAvatar?: string;
  content: string;
  contentType: "text" | "image" | "file" | "audio" | "video" | "rich";
  richContent?: Record<string, any>;
  attachments?: Array<{
    fileName: string;
    fileType: string;
    mimeType?: string;
    fileSize?: number;
    url: string;
    thumbnailUrl?: string;
  }>;
  metadata?: Record<string, any>;
  timestamp?: Date;
}

export interface OutgoingMessage {
  conversationId: string;
  content: string;
  contentType?: "text" | "image" | "file" | "audio" | "video" | "rich";
  richContent?: Record<string, any>;
  attachments?: Array<{
    fileName: string;
    url: string;
    mimeType?: string;
  }>;
  senderName?: string;
  senderAvatar?: string;
  isAiGenerated?: boolean;
  metadata?: Record<string, any>;
}

export interface ChannelConfig {
  apiKey?: string;
  accessToken?: string;
  refreshToken?: string;
  webhookSecret?: string;
  webhookUrl?: string;
  emailFrom?: string;
  emailDomain?: string;
  pageId?: string;
  appId?: string;
  phoneNumberId?: string;
  [key: string]: any;
}

export interface ChannelConnectionResult {
  success: boolean;
  error?: string;
  externalChannelId?: string;
  webhookUrl?: string;
}

export interface SendMessageResult {
  success: boolean;
  externalMessageId?: string;
  error?: string;
  deliveredAt?: Date;
}

export interface ChannelStatus {
  connected: boolean;
  lastSync?: Date;
  error?: string;
  quota?: {
    used: number;
    limit: number;
    resetsAt?: Date;
  };
}

export interface WebhookPayload {
  channelType: ChannelType;
  channelId: string;
  workspaceId: string;
  eventType: string;
  payload: Record<string, any>;
  signature?: string;
  timestamp: Date;
}

export interface ChannelMetrics {
  channelId: string;
  messagesReceived: number;
  messagesSent: number;
  conversationsCreated: number;
  averageResponseTime?: number;
  lastActivityAt?: Date;
}

export interface BaseChannelConnector {
  readonly channelType: ChannelType;
  readonly channelName: string;
  
  connect(channel: Channel): Promise<ChannelConnectionResult>;
  disconnect(channel: Channel): Promise<void>;
  validateConfig(config: ChannelConfig): { valid: boolean; errors?: string[] };
  
  getStatus(channel: Channel): Promise<ChannelStatus>;
  
  sendMessage(channel: Channel, message: OutgoingMessage): Promise<SendMessageResult>;
  
  handleWebhook(channel: Channel, payload: WebhookPayload): Promise<IncomingMessage | null>;
  
  processIncoming(message: IncomingMessage): Promise<{
    conversation: Conversation;
    message: ConversationMessage;
  }>;
}

export type ConnectorConstructor = new (db: any, channelService: any) => BaseChannelConnector;

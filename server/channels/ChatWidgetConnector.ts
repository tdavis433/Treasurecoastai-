import { AbstractChannelConnector } from "./BaseConnector";
import type {
  ChannelType,
  ChannelConfig,
  ChannelConnectionResult,
  SendMessageResult,
  ChannelStatus,
  WebhookPayload,
  IncomingMessage,
  OutgoingMessage,
} from "./types";
import type { Channel } from "@shared/schema";

export class ChatWidgetConnector extends AbstractChannelConnector {
  readonly channelType: ChannelType = "chat_widget";
  readonly channelName = "Chat Widget";
  
  validateConfig(config: ChannelConfig): { valid: boolean; errors?: string[] } {
    return { valid: true };
  }
  
  async connect(channel: Channel): Promise<ChannelConnectionResult> {
    return {
      success: true,
      webhookUrl: `/api/widget/chat/${channel.id}`,
    };
  }
  
  async disconnect(channel: Channel): Promise<void> {
  }
  
  async getStatus(channel: Channel): Promise<ChannelStatus> {
    return {
      connected: channel.status === 'active',
      lastSync: channel.lastSyncAt || undefined,
    };
  }
  
  async sendMessage(channel: Channel, message: OutgoingMessage): Promise<SendMessageResult> {
    return {
      success: true,
      deliveredAt: new Date(),
    };
  }
  
  async handleWebhook(channel: Channel, payload: WebhookPayload): Promise<IncomingMessage | null> {
    if (payload.eventType !== 'message') {
      return null;
    }
    
    const { message, sessionId, contactInfo } = payload.payload;
    
    return {
      externalId: sessionId,
      channelType: this.channelType,
      channelId: channel.id,
      workspaceId: channel.workspaceId,
      contactId: sessionId,
      contactName: contactInfo?.name,
      contactEmail: contactInfo?.email,
      contactPhone: contactInfo?.phone,
      content: message,
      contentType: 'text',
      timestamp: new Date(),
    };
  }
}

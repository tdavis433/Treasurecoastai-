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

export class EmailConnector extends AbstractChannelConnector {
  readonly channelType: ChannelType = "email";
  readonly channelName = "Email";
  
  validateConfig(config: ChannelConfig): { valid: boolean; errors?: string[] } {
    const errors: string[] = [];
    
    if (!config.emailFrom) {
      errors.push("Email 'from' address is required");
    }
    
    if (!config.emailDomain) {
      errors.push("Email domain is required");
    }
    
    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
    };
  }
  
  async connect(channel: Channel): Promise<ChannelConnectionResult> {
    const config = channel.config as ChannelConfig;
    
    if (!config.emailDomain) {
      return { success: false, error: "Email domain not configured" };
    }
    
    return {
      success: true,
      webhookUrl: `/api/channels/email/${channel.id}/webhook`,
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
    const config = channel.config as ChannelConfig;
    
    console.log(`[EmailConnector] Would send email from ${config.emailFrom}:`, {
      conversationId: message.conversationId,
      content: message.content.substring(0, 100),
    });
    
    return {
      success: true,
      externalMessageId: `email-${Date.now()}`,
      deliveredAt: new Date(),
    };
  }
  
  async handleWebhook(channel: Channel, payload: WebhookPayload): Promise<IncomingMessage | null> {
    if (payload.eventType !== 'inbound_email') {
      return null;
    }
    
    const { from, subject, textBody, htmlBody, attachments, messageId } = payload.payload;
    
    const emailContent = textBody || this.stripHtml(htmlBody || '');
    
    return {
      externalId: messageId,
      channelType: this.channelType,
      channelId: channel.id,
      workspaceId: channel.workspaceId,
      contactEmail: from?.email || from,
      contactName: from?.name,
      content: emailContent,
      contentType: 'text',
      attachments: attachments?.map((att: any) => ({
        fileName: att.filename || att.name,
        fileType: this.getFileType(att.contentType),
        mimeType: att.contentType,
        fileSize: att.size,
        url: att.url,
      })),
      metadata: { subject },
      timestamp: new Date(),
    };
  }
  
  private stripHtml(html: string): string {
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .trim();
  }
  
  private getFileType(mimeType: string): string {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    if (mimeType.includes('pdf') || mimeType.includes('document')) return 'document';
    return 'other';
  }
}

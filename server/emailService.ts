/**
 * Email Service Abstraction
 * 
 * Supports:
 * - SMTP email sending in production (via environment variables)
 * - Console logging fallback for development/QA when SMTP not configured
 * 
 * Environment variables for production:
 * - SMTP_HOST: SMTP server hostname
 * - SMTP_PORT: SMTP server port (default: 587)
 * - SMTP_USER: SMTP username
 * - SMTP_PASS: SMTP password
 * - EMAIL_FROM: From email address (default: noreply@treasurecoastai.com)
 */

import nodemailer from 'nodemailer';

export interface EmailConfig {
  host?: string;
  port?: number;
  user?: string;
  pass?: string;
  from?: string;
}

export interface EmailMessage {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

// Store pending reset tokens for dev debug page access
interface PendingResetToken {
  email: string;
  resetUrl: string;
  expiresAt: Date;
  createdAt: Date;
}

// In-memory store for dev debugging (only stores last 50 tokens)
const pendingResetTokens: PendingResetToken[] = [];

export function addPendingResetToken(token: PendingResetToken): void {
  pendingResetTokens.unshift(token);
  // Keep only last 50 tokens
  if (pendingResetTokens.length > 50) {
    pendingResetTokens.pop();
  }
}

export function getPendingResetTokens(): PendingResetToken[] {
  return pendingResetTokens.filter(t => t.expiresAt > new Date());
}

export function clearPendingResetTokens(): void {
  pendingResetTokens.length = 0;
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private config: EmailConfig;
  private isConfigured: boolean = false;

  constructor() {
    this.config = {
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
      from: process.env.EMAIL_FROM || 'noreply@treasurecoastai.com',
    };

    this.isConfigured = !!(this.config.host && this.config.user && this.config.pass);

    if (this.isConfigured) {
      this.transporter = nodemailer.createTransport({
        host: this.config.host,
        port: this.config.port,
        secure: this.config.port === 465,
        auth: {
          user: this.config.user,
          pass: this.config.pass,
        },
      });
      console.log('[EmailService] SMTP configured, emails will be sent');
    } else {
      console.log('[EmailService] SMTP not configured, emails will be logged to console');
      console.log('[EmailService] To enable email, set SMTP_HOST, SMTP_USER, SMTP_PASS environment variables');
    }
  }

  async sendEmail(message: EmailMessage): Promise<{ success: boolean; error?: string }> {
    if (!this.isConfigured || !this.transporter) {
      // Log email to console in dev mode
      console.log('\n' + '='.repeat(60));
      console.log('[EmailService] DEV MODE - Email would be sent:');
      console.log('='.repeat(60));
      console.log(`To: ${message.to}`);
      console.log(`Subject: ${message.subject}`);
      console.log('-'.repeat(60));
      if (message.text) {
        console.log('Text Body:');
        console.log(message.text);
      }
      if (message.html) {
        console.log('HTML Body:');
        console.log(message.html);
      }
      console.log('='.repeat(60) + '\n');
      
      return { success: true };
    }

    try {
      await this.transporter.sendMail({
        from: this.config.from,
        to: message.to,
        subject: message.subject,
        text: message.text,
        html: message.html,
      });
      return { success: true };
    } catch (error) {
      console.error('[EmailService] Failed to send email:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown email error' 
      };
    }
  }

  async sendPasswordResetEmail(
    to: string, 
    resetUrl: string,
    userName?: string
  ): Promise<{ success: boolean; error?: string }> {
    const expirationMinutes = 60;
    
    const subject = 'Reset Your Treasure Coast AI Password';
    
    const text = `
Hello${userName ? ` ${userName}` : ''},

You requested a password reset for your Treasure Coast AI account.

Click the link below to reset your password. This link will expire in ${expirationMinutes} minutes.

${resetUrl}

If you did not request this reset, please ignore this email. Your password will remain unchanged.

Best regards,
Treasure Coast AI Team
`.trim();

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0d0d12; color: #ffffff; padding: 40px 20px;">
  <div style="max-width: 480px; margin: 0 auto; background: linear-gradient(135deg, rgba(26, 29, 36, 0.95), rgba(20, 22, 28, 0.9)); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 16px; padding: 40px;">
    <h1 style="margin: 0 0 24px; font-size: 24px; background: linear-gradient(135deg, #00E5CC, #8B5CF6); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">
      Treasure Coast AI
    </h1>
    
    <p style="margin: 0 0 16px; color: rgba(255, 255, 255, 0.9);">
      Hello${userName ? ` <strong>${userName}</strong>` : ''},
    </p>
    
    <p style="margin: 0 0 24px; color: rgba(255, 255, 255, 0.7);">
      You requested a password reset for your account. Click the button below to set a new password.
    </p>
    
    <a href="${resetUrl}" style="display: inline-block; padding: 14px 28px; background: linear-gradient(135deg, #00E5CC, #8B5CF6); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 0 0 24px;">
      Reset Password
    </a>
    
    <p style="margin: 0 0 8px; color: rgba(255, 255, 255, 0.5); font-size: 14px;">
      This link will expire in <strong>${expirationMinutes} minutes</strong>.
    </p>
    
    <p style="margin: 0; color: rgba(255, 255, 255, 0.5); font-size: 14px;">
      If you didn't request this reset, you can safely ignore this email.
    </p>
    
    <hr style="margin: 32px 0; border: none; border-top: 1px solid rgba(255, 255, 255, 0.1);">
    
    <p style="margin: 0; color: rgba(255, 255, 255, 0.4); font-size: 12px;">
      If the button doesn't work, copy and paste this link into your browser:<br>
      <a href="${resetUrl}" style="color: #00E5CC; word-break: break-all;">${resetUrl}</a>
    </p>
  </div>
</body>
</html>
`.trim();

    // Store for dev debug page access
    addPendingResetToken({
      email: to,
      resetUrl,
      expiresAt: new Date(Date.now() + expirationMinutes * 60 * 1000),
      createdAt: new Date(),
    });

    return this.sendEmail({ to, subject, text, html });
  }

  isEmailConfigured(): boolean {
    return this.isConfigured;
  }
}

// Singleton instance
export const emailService = new EmailService();

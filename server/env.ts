import { z } from 'zod';
import crypto from 'crypto';

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required for database operations'),
  
  SESSION_SECRET: z.string().min(1, 'SESSION_SECRET is required for session management'),
  
  WIDGET_TOKEN_SECRET: z.string().optional(),
  
  AI_INTEGRATIONS_OPENAI_API_KEY: z.string().optional(),
  AI_INTEGRATIONS_OPENAI_BASE_URL: z.string().optional(),
  
  DEFAULT_ADMIN_USERNAME: z.string().optional().default('admin'),
  DEFAULT_ADMIN_PASSWORD: z.string().optional(),
  DEFAULT_STAFF_USERNAME: z.string().optional().default('staff'),
  DEFAULT_STAFF_PASSWORD: z.string().optional(),
  
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_PHONE_NUMBER: z.string().optional(),
  
  RESEND_API_KEY: z.string().optional(),
  
  PORT: z.string().optional().default('5000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).optional().default('development'),
  
  REPLIT_DOMAINS: z.string().optional(),
  REPLIT_DEV_DOMAIN: z.string().optional(),
  REPLIT_DEPLOYMENT: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

let validatedEnv: Env | null = null;

export function validateEnv(): Env {
  if (validatedEnv) {
    return validatedEnv;
  }

  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const missingVars = result.error.issues.map(issue => {
      const path = issue.path.join('.');
      return `  - ${path}: ${issue.message}`;
    });

    console.error('\n========================================');
    console.error('ENVIRONMENT VALIDATION FAILED');
    console.error('========================================');
    console.error('The following environment variables are missing or invalid:\n');
    console.error(missingVars.join('\n'));
    console.error('\nPlease check your .env file or Replit secrets.');
    console.error('See env.example for required variables.');
    console.error('========================================\n');

    throw new Error(`Environment validation failed: ${missingVars.length} issue(s) found`);
  }

  validatedEnv = result.data;
  return validatedEnv;
}

export function getEnv(): Env {
  if (!validatedEnv) {
    return validateEnv();
  }
  return validatedEnv;
}

export function isProduction(): boolean {
  return getEnv().NODE_ENV === 'production';
}

export function isDevelopment(): boolean {
  return getEnv().NODE_ENV === 'development';
}

let _widgetSecretWarned = false;
let _generatedWidgetSecret: string | null = null;

export function getWidgetSecret(): string {
  const env = getEnv();
  if (env.WIDGET_TOKEN_SECRET) {
    return env.WIDGET_TOKEN_SECRET;
  }
  
  if (!_widgetSecretWarned) {
    console.warn(
      'WARNING: WIDGET_TOKEN_SECRET not set - generating random secret. ' +
      'Widget tokens will not persist across server restarts. ' +
      'Set WIDGET_TOKEN_SECRET environment variable for production.'
    );
    _widgetSecretWarned = true;
  }
  
  if (!_generatedWidgetSecret) {
    _generatedWidgetSecret = crypto.randomBytes(32).toString('hex');
  }
  
  return _generatedWidgetSecret;
}

export function getOpenAIConfig(): { apiKey: string; baseURL: string } | null {
  const env = getEnv();
  if (!env.AI_INTEGRATIONS_OPENAI_API_KEY) {
    return null;
  }
  return {
    apiKey: env.AI_INTEGRATIONS_OPENAI_API_KEY,
    baseURL: env.AI_INTEGRATIONS_OPENAI_BASE_URL || 'https://api.openai.com/v1'
  };
}

export function getTwilioConfig(): { accountSid: string; authToken: string; phoneNumber: string } | null {
  const env = getEnv();
  if (!env.TWILIO_ACCOUNT_SID || !env.TWILIO_AUTH_TOKEN || !env.TWILIO_PHONE_NUMBER) {
    return null;
  }
  return {
    accountSid: env.TWILIO_ACCOUNT_SID,
    authToken: env.TWILIO_AUTH_TOKEN,
    phoneNumber: env.TWILIO_PHONE_NUMBER
  };
}

export function getResendApiKey(): string | null {
  return getEnv().RESEND_API_KEY || null;
}

export function getAdminCredentials(): { username: string; password: string | undefined } {
  const env = getEnv();
  return {
    username: env.DEFAULT_ADMIN_USERNAME,
    password: env.DEFAULT_ADMIN_PASSWORD
  };
}

export function getStaffCredentials(): { username: string; password: string | undefined } {
  const env = getEnv();
  return {
    username: env.DEFAULT_STAFF_USERNAME,
    password: env.DEFAULT_STAFF_PASSWORD
  };
}

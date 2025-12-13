import crypto from 'crypto';
import { getWidgetSecret } from './env';

const TOKEN_TYPE = 'preview';
const DEFAULT_TTL = 86400; // 24 hours in seconds

export interface PreviewTokenPayload {
  type: 'preview';
  workspaceSlug: string;
  botId: string;
  exp: number;
  iat: number;
}

export interface PreviewTokenResult {
  valid: boolean;
  payload?: PreviewTokenPayload;
  error?: string;
}

export interface GeneratedPreviewToken {
  token: string;
  expiresAt: Date;
  expiresIn: number;
}

function getPreviewSecret(): string {
  const baseSecret = getWidgetSecret();
  return crypto.createHash('sha256').update(`${baseSecret}:preview`).digest('hex');
}

export function generatePreviewToken(
  workspaceSlug: string,
  botId: string,
  ttl: number = DEFAULT_TTL
): GeneratedPreviewToken {
  const secret = getPreviewSecret();
  const now = Math.floor(Date.now() / 1000);
  const exp = now + ttl;
  
  const payload: PreviewTokenPayload = {
    type: TOKEN_TYPE,
    workspaceSlug,
    botId,
    iat: now,
    exp,
  };
  
  const payloadJson = JSON.stringify(payload);
  const encodedPayload = Buffer.from(payloadJson).toString('base64url');
  
  const signature = crypto
    .createHmac('sha256', secret)
    .update(encodedPayload)
    .digest('base64url');
  
  const token = `${encodedPayload}.${signature}`;
  
  return {
    token,
    expiresAt: new Date(exp * 1000),
    expiresIn: ttl,
  };
}

export function verifyPreviewToken(
  token: string,
  expectedWorkspaceSlug?: string,
  expectedBotId?: string
): PreviewTokenResult {
  try {
    if (!token || typeof token !== 'string') {
      return { valid: false, error: 'Token is required' };
    }
    
    const parts = token.split('.');
    if (parts.length !== 2) {
      return { valid: false, error: 'Invalid token format' };
    }
    
    const [encodedPayload, signature] = parts;
    
    if (!encodedPayload || !signature) {
      return { valid: false, error: 'Invalid token structure' };
    }
    
    const secret = getPreviewSecret();
    const expectedSignatureBytes = crypto
      .createHmac('sha256', secret)
      .update(encodedPayload)
      .digest();
    
    let providedSignatureBytes: Buffer;
    try {
      providedSignatureBytes = Buffer.from(signature, 'base64url');
    } catch {
      return { valid: false, error: 'Invalid token signature' };
    }
    
    if (providedSignatureBytes.length !== expectedSignatureBytes.length) {
      return { valid: false, error: 'Invalid token signature' };
    }
    
    if (!crypto.timingSafeEqual(providedSignatureBytes, expectedSignatureBytes)) {
      return { valid: false, error: 'Invalid token signature' };
    }
    
    let payload: PreviewTokenPayload;
    try {
      const payloadJson = Buffer.from(encodedPayload, 'base64url').toString('utf-8');
      payload = JSON.parse(payloadJson);
    } catch {
      return { valid: false, error: 'Invalid token payload' };
    }
    
    if (payload.type !== TOKEN_TYPE) {
      return { valid: false, error: 'Invalid token type' };
    }
    
    if (!payload.workspaceSlug || !payload.botId || !payload.exp) {
      return { valid: false, error: 'Missing required token fields' };
    }
    
    const now = Math.floor(Date.now() / 1000);
    if (now > payload.exp) {
      return { valid: false, error: 'Token expired' };
    }
    
    if (expectedWorkspaceSlug && payload.workspaceSlug !== expectedWorkspaceSlug) {
      return { valid: false, error: 'Token workspace mismatch' };
    }
    
    if (expectedBotId && payload.botId !== expectedBotId) {
      return { valid: false, error: 'Token bot mismatch' };
    }
    
    return { valid: true, payload };
  } catch (error) {
    console.error('Preview token verification error:', error);
    return { valid: false, error: 'Token verification failed' };
  }
}

export function getTokenTimeRemaining(payload: PreviewTokenPayload): {
  expired: boolean;
  secondsRemaining: number;
  hoursRemaining: number;
  humanReadable: string;
} {
  const now = Math.floor(Date.now() / 1000);
  const secondsRemaining = Math.max(0, payload.exp - now);
  const hoursRemaining = Math.floor(secondsRemaining / 3600);
  const minutesRemaining = Math.floor((secondsRemaining % 3600) / 60);
  
  let humanReadable: string;
  if (secondsRemaining <= 0) {
    humanReadable = 'Expired';
  } else if (hoursRemaining > 0) {
    humanReadable = `${hoursRemaining}h ${minutesRemaining}m remaining`;
  } else if (minutesRemaining > 0) {
    humanReadable = `${minutesRemaining}m remaining`;
  } else {
    humanReadable = `${secondsRemaining}s remaining`;
  }
  
  return {
    expired: secondsRemaining <= 0,
    secondsRemaining,
    hoursRemaining,
    humanReadable,
  };
}

export default {
  generatePreviewToken,
  verifyPreviewToken,
  getTokenTimeRemaining,
};

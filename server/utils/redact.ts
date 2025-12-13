/**
 * PII Redaction Utilities
 * Used by error logging to prevent sensitive data from being stored
 */

export function redactEmail(email: string | null | undefined): string {
  if (!email) return '[no email]';
  const [local, domain] = email.split('@');
  if (!domain) return '[invalid email]';
  const redactedLocal = local.length > 2 
    ? `${local[0]}***${local[local.length - 1]}`
    : '***';
  return `${redactedLocal}@${domain}`;
}

export function redactPhone(phone: string | null | undefined): string {
  if (!phone) return '[no phone]';
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 4) return '[invalid phone]';
  return `***-***-${digits.slice(-4)}`;
}

export function redactToken(token: string | null | undefined): string {
  return '[REDACTED]';
}

export function redactPassword(password: string | null | undefined): string {
  return '[REDACTED]';
}

export function redactSensitiveFields(obj: Record<string, any>): Record<string, any> {
  const result = { ...obj };
  
  const emailFields = ['email', 'userEmail', 'contactEmail', 'notificationEmail'];
  const phoneFields = ['phone', 'userPhone', 'contactPhone', 'primaryPhone'];
  const tokenFields = ['token', 'widgetToken', 'resetToken', 'sessionId', 'apiKey', 'secret'];
  const passwordFields = ['password', 'passwordHash', 'currentPassword', 'newPassword'];
  
  for (const key of Object.keys(result)) {
    const lowerKey = key.toLowerCase();
    
    if (emailFields.some(f => lowerKey.includes(f.toLowerCase()))) {
      result[key] = redactEmail(result[key]);
    } else if (phoneFields.some(f => lowerKey.includes(f.toLowerCase()))) {
      result[key] = redactPhone(result[key]);
    } else if (tokenFields.some(f => lowerKey.includes(f.toLowerCase()))) {
      result[key] = redactToken(result[key]);
    } else if (passwordFields.some(f => lowerKey.includes(f.toLowerCase()))) {
      result[key] = redactPassword(result[key]);
    }
  }
  
  return result;
}

export function redactMessage(message: string): string {
  let result = message;
  
  const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  result = result.replace(emailPattern, (match) => redactEmail(match));
  
  const phonePattern = /(\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
  result = result.replace(phonePattern, (match) => redactPhone(match));
  
  const tokenPattern = /token[=:]["']?[a-zA-Z0-9._-]{20,}["']?/gi;
  result = result.replace(tokenPattern, 'token=[REDACTED]');
  
  return result;
}

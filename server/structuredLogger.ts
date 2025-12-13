type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  requestId?: string;
  userId?: number;
  clientId?: string;
  botId?: string;
  action?: string;
  duration?: number;
  [key: string]: unknown;
}

interface StructuredLog {
  timestamp: string;
  level: LogLevel;
  message: string;
  requestId?: string;
  context?: Record<string, unknown>;
}

const PII_PATTERNS: Array<{ pattern: RegExp; replacement: string }> = [
  { pattern: /([a-zA-Z0-9._%+-]+)@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g, replacement: '[EMAIL_REDACTED]' },
  { pattern: /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/g, replacement: '[PHONE_REDACTED]' },
  { pattern: /\b\d{3}[-.\s]?\d{2}[-.\s]?\d{4}\b/g, replacement: '[SSN_REDACTED]' },
  { pattern: /\b(?:\d{4}[-\s]?){3}\d{4}\b/g, replacement: '[CARD_REDACTED]' },
  { pattern: /"password"\s*:\s*"[^"]*"/gi, replacement: '"password":"[REDACTED]"' },
  { pattern: /"passwordHash"\s*:\s*"[^"]*"/gi, replacement: '"passwordHash":"[REDACTED]"' },
  { pattern: /"token"\s*:\s*"[^"]*"/gi, replacement: '"token":"[REDACTED]"' },
  { pattern: /"secret"\s*:\s*"[^"]*"/gi, replacement: '"secret":"[REDACTED]"' },
  { pattern: /"apiKey"\s*:\s*"[^"]*"/gi, replacement: '"apiKey":"[REDACTED]"' },
  { pattern: /"api_key"\s*:\s*"[^"]*"/gi, replacement: '"api_key":"[REDACTED]"' },
  { pattern: /Bearer\s+[A-Za-z0-9\-._~+\/]+=*/g, replacement: 'Bearer [REDACTED]' },
];

export function redactPII(input: string): string {
  let result = input;
  for (const { pattern, replacement } of PII_PATTERNS) {
    result = result.replace(pattern, replacement);
  }
  return result;
}

export function redactObject(obj: unknown): unknown {
  if (obj === null || obj === undefined) return obj;
  
  if (typeof obj === 'string') {
    return redactPII(obj);
  }
  
  if (Array.isArray(obj)) {
    return obj.map(redactObject);
  }
  
  if (typeof obj === 'object') {
    const sensitiveKeys = ['password', 'passwordHash', 'token', 'secret', 'apiKey', 'api_key', 'authorization'];
    const result: Record<string, unknown> = {};
    
    for (const [key, value] of Object.entries(obj)) {
      if (sensitiveKeys.some(k => key.toLowerCase().includes(k.toLowerCase()))) {
        result[key] = '[REDACTED]';
      } else if (typeof value === 'string') {
        result[key] = redactPII(value);
      } else if (typeof value === 'object') {
        result[key] = redactObject(value);
      } else {
        result[key] = value;
      }
    }
    return result;
  }
  
  return obj;
}

function formatLog(level: LogLevel, message: string, context?: LogContext): string {
  const log: StructuredLog = {
    timestamp: new Date().toISOString(),
    level,
    message: redactPII(message),
    requestId: context?.requestId,
    context: context ? redactObject(context) as Record<string, unknown> : undefined,
  };
  
  if (!log.requestId) delete log.requestId;
  if (!log.context || Object.keys(log.context).length === 0) delete log.context;
  
  return JSON.stringify(log);
}

export const structuredLogger = {
  debug(message: string, context?: LogContext) {
    if (process.env.LOG_LEVEL === 'debug') {
      console.log(formatLog('debug', message, context));
    }
  },
  
  info(message: string, context?: LogContext) {
    console.log(formatLog('info', message, context));
  },
  
  warn(message: string, context?: LogContext) {
    console.warn(formatLog('warn', message, context));
  },
  
  error(message: string, context?: LogContext) {
    console.error(formatLog('error', message, context));
  },
};

export default structuredLogger;

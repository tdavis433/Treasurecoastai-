import { db } from "./storage";
import { auditLogs, type AuditAction, type AuditResourceType } from "@shared/schema";
import type { Request } from "express";

interface AuditLogEntry {
  userId: string;
  username: string;
  userRole?: string;
  action: AuditAction | string;
  resourceType: AuditResourceType | string;
  resourceId?: string;
  clientId?: string;
  workspaceId?: string;
  beforeData?: Record<string, any>;
  afterData?: Record<string, any>;
  details?: Record<string, any>;
  requestId?: string;
  ipAddress?: string;
  userAgent?: string;
}

const SENSITIVE_KEYS = [
  'password', 'passwordHash', 'token', 'secret', 'apiKey', 'api_key',
  'sessionId', 'session_id', 'creditCard', 'credit_card', 'ssn',
  'socialSecurity', 'social_security', 'pin', 'cvv', 'stripe',
  'webhook_secret', 'webhookSecret', 'resetToken', 'reset_token'
];

function redactSensitiveData(obj: Record<string, any> | null | undefined): Record<string, any> | null {
  if (!obj) return null;
  
  const redacted: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();
    
    if (SENSITIVE_KEYS.some(sensitive => lowerKey.includes(sensitive.toLowerCase()))) {
      redacted[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      redacted[key] = redactSensitiveData(value);
    } else if (Array.isArray(value)) {
      redacted[key] = value.map(item => 
        typeof item === 'object' && item !== null ? redactSensitiveData(item) : item
      );
    } else {
      redacted[key] = value;
    }
  }
  
  return redacted;
}

export async function logAuditEvent(entry: AuditLogEntry): Promise<void> {
  try {
    await db.insert(auditLogs).values({
      userId: entry.userId,
      username: entry.username,
      userRole: entry.userRole,
      action: entry.action,
      resourceType: entry.resourceType,
      resourceId: entry.resourceId,
      clientId: entry.clientId,
      workspaceId: entry.workspaceId,
      beforeData: redactSensitiveData(entry.beforeData),
      afterData: redactSensitiveData(entry.afterData),
      details: redactSensitiveData(entry.details) || {},
      requestId: entry.requestId,
      ipAddress: entry.ipAddress,
      userAgent: entry.userAgent,
    });
  } catch (error) {
    console.error('[AUDIT] Failed to log audit event:', error);
  }
}

export function extractRequestInfo(req: Request): { ipAddress: string; userAgent: string; requestId?: string } {
  const ipAddress = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() 
    || req.socket?.remoteAddress 
    || 'unknown';
  const userAgent = (req.headers['user-agent'] as string) || 'unknown';
  const requestId = (req.headers['x-request-id'] as string) || (req as any).requestId;
  
  return { ipAddress, userAgent, requestId };
}

export function createAuditHelper(req: Request) {
  const { ipAddress, userAgent, requestId } = extractRequestInfo(req);
  const session = (req as any).session;
  
  return {
    log: async (
      action: AuditAction | string,
      resourceType: AuditResourceType | string,
      options: {
        resourceId?: string;
        clientId?: string;
        workspaceId?: string;
        beforeData?: Record<string, any>;
        afterData?: Record<string, any>;
        details?: Record<string, any>;
      } = {}
    ) => {
      await logAuditEvent({
        userId: session?.userId || 'system',
        username: session?.username || 'system',
        userRole: session?.role,
        action,
        resourceType,
        resourceId: options.resourceId,
        clientId: options.clientId || session?.clientId,
        workspaceId: options.workspaceId,
        beforeData: options.beforeData,
        afterData: options.afterData,
        details: options.details,
        requestId,
        ipAddress,
        userAgent,
      });
    }
  };
}

export async function getAuditLogs(filters: {
  clientId?: string;
  workspaceId?: string;
  userId?: string;
  action?: string;
  resourceType?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}): Promise<{ logs: any[]; total: number }> {
  const { and, eq, gte, lte, desc, sql, count } = await import("drizzle-orm");
  
  const conditions = [];
  
  if (filters.clientId) {
    conditions.push(eq(auditLogs.clientId, filters.clientId));
  }
  if (filters.workspaceId) {
    conditions.push(eq(auditLogs.workspaceId, filters.workspaceId));
  }
  if (filters.userId) {
    conditions.push(eq(auditLogs.userId, filters.userId));
  }
  if (filters.action) {
    conditions.push(eq(auditLogs.action, filters.action));
  }
  if (filters.resourceType) {
    conditions.push(eq(auditLogs.resourceType, filters.resourceType));
  }
  if (filters.startDate) {
    conditions.push(gte(auditLogs.createdAt, filters.startDate));
  }
  if (filters.endDate) {
    conditions.push(lte(auditLogs.createdAt, filters.endDate));
  }
  
  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
  
  const [logs, totalResult] = await Promise.all([
    db
      .select()
      .from(auditLogs)
      .where(whereClause)
      .orderBy(desc(auditLogs.createdAt))
      .limit(filters.limit || 100)
      .offset(filters.offset || 0),
    db
      .select({ count: count() })
      .from(auditLogs)
      .where(whereClause)
  ]);
  
  return {
    logs,
    total: totalResult[0]?.count || 0
  };
}

/**
 * Demo Safe Mode
 * ============================================================================
 * When DEMO_SAFE_MODE=true, this module prevents destructive operations on
 * demo workspaces and their associated data.
 * 
 * This protects demo environments from accidental deletion while allowing
 * full functionality in production workspaces.
 * 
 * Controlled by environment variable: DEMO_SAFE_MODE
 * ============================================================================
 */

import { Request, Response, NextFunction } from 'express';

// Environment flag
const DEMO_SAFE_MODE = process.env.DEMO_SAFE_MODE === 'true';

// Demo workspace identifiers (slugs that should be protected)
const DEMO_WORKSPACE_SLUGS = ['demo', 'demo-workspace', 'sample', 'test-demo'];

// Demo workspace numeric IDs (populated at runtime from DB lookup or config)
const DEMO_WORKSPACE_IDS: Set<string> = new Set();

// Demo bot ID patterns
const DEMO_BOT_PATTERNS = [
  /^demo-/i,
  /^sample-/i,
  /-demo$/i,
  /^test-/i
];

/**
 * Check if demo safe mode is enabled
 */
export function isDemoSafeModeEnabled(): boolean {
  return DEMO_SAFE_MODE;
}

/**
 * Register a workspace ID as a demo workspace (call during app init or on workspace load)
 */
export function registerDemoWorkspaceId(workspaceId: string): void {
  DEMO_WORKSPACE_IDS.add(workspaceId);
}

/**
 * Check if a workspace slug is a demo workspace
 */
export function isDemoWorkspace(slug: string | undefined | null): boolean {
  if (!slug) return false;
  const normalized = slug.toLowerCase().trim();
  return DEMO_WORKSPACE_SLUGS.includes(normalized) || normalized.includes('demo');
}

/**
 * Check if a workspace ID is a demo workspace
 */
export function isDemoWorkspaceById(workspaceId: string | number | undefined | null): boolean {
  if (!workspaceId) return false;
  const idStr = String(workspaceId);
  return DEMO_WORKSPACE_IDS.has(idStr);
}

/**
 * Check if a bot ID appears to be a demo bot
 */
export function isDemoBot(botId: string | undefined | null): boolean {
  if (!botId) return false;
  const normalized = botId.toLowerCase().trim();
  return DEMO_BOT_PATTERNS.some(pattern => pattern.test(normalized));
}

/**
 * Check if a clientId is a demo client
 */
export function isDemoClient(clientId: string | undefined | null): boolean {
  if (!clientId) return false;
  return clientId.toLowerCase() === 'demo' || clientId.toLowerCase().includes('demo');
}

/**
 * Types of operations that can be protected
 */
export type ProtectedOperation = 
  | 'delete_workspace'
  | 'delete_bot'
  | 'delete_leads'
  | 'delete_appointments'
  | 'delete_conversations'
  | 'bulk_delete'
  | 'purge_data'
  | 'retention_purge';

/**
 * Check if an operation is allowed on demo data
 * Returns an error message if blocked, null if allowed
 */
export function checkDemoProtection(
  operation: ProtectedOperation,
  target: {
    workspaceSlug?: string;
    workspaceId?: string | number;
    botId?: string;
    clientId?: string;
  }
): string | null {
  // If demo safe mode is disabled, allow everything
  if (!DEMO_SAFE_MODE) {
    return null;
  }

  // Check if the target is demo data (by slug, ID, or bot pattern)
  const isDemo = 
    isDemoWorkspace(target.workspaceSlug) ||
    isDemoWorkspaceById(target.workspaceId) ||
    isDemoBot(target.botId) ||
    isDemoClient(target.clientId);

  if (!isDemo) {
    return null; // Not demo data, allow the operation
  }

  // Demo data - block destructive operations
  const blockedOperations: ProtectedOperation[] = [
    'delete_workspace',
    'delete_bot',
    'delete_leads',
    'delete_appointments',
    'delete_conversations',
    'bulk_delete',
    'purge_data',
    'retention_purge'
  ];

  if (blockedOperations.includes(operation)) {
    logDemoProtectionBlock(operation, target);
    return `Operation '${operation}' is blocked: Demo data is protected when DEMO_SAFE_MODE is enabled. To proceed, either disable DEMO_SAFE_MODE or use non-demo data.`;
  }

  return null;
}

/**
 * Express middleware to protect demo data from DELETE operations
 * Should be applied to routes that perform destructive operations
 */
export function demoSafeMiddleware(
  req: Request, 
  res: Response, 
  next: NextFunction
): void {
  // Only intercept destructive operations
  const isDestructive = 
    req.method === 'DELETE' || 
    req.path.includes('/purge') || 
    req.path.includes('/bulk-delete') ||
    req.path.includes('/retention/purge');
    
  if (!isDestructive) {
    return next();
  }

  // Check if demo safe mode is even enabled
  if (!DEMO_SAFE_MODE) {
    return next();
  }

  // Extract identifiers from request (params, body, and query)
  const workspaceSlug = req.params.workspaceSlug || req.params.slug || req.body?.workspaceSlug;
  const workspaceId = req.params.workspaceId || req.params.id || req.body?.workspaceId;
  const botId = req.params.botId || req.body?.botId;
  const clientId = req.params.clientId || req.body?.clientId;

  // Determine operation type based on path
  let operation: ProtectedOperation = 'bulk_delete';
  if (req.path.includes('/retention/purge')) operation = 'retention_purge';
  else if (req.path.includes('/workspace')) operation = 'delete_workspace';
  else if (req.path.includes('/bot')) operation = 'delete_bot';
  else if (req.path.includes('/lead')) operation = 'delete_leads';
  else if (req.path.includes('/appointment')) operation = 'delete_appointments';
  else if (req.path.includes('/conversation')) operation = 'delete_conversations';
  else if (req.path.includes('/purge')) operation = 'purge_data';

  const error = checkDemoProtection(operation, {
    workspaceSlug,
    workspaceId,
    botId,
    clientId
  });

  if (error) {
    res.status(403).json({
      error: 'Demo Protection Active',
      message: error,
      code: 'DEMO_SAFE_MODE_BLOCKED'
    });
    return;
  }

  next();
}

/**
 * Wrapper for route handlers that need demo protection
 * Use this for routes that don't fit the middleware pattern
 */
export function withDemoProtection(
  operation: ProtectedOperation,
  target: {
    workspaceSlug?: string;
    workspaceId?: string | number;
    botId?: string;
    clientId?: string;
  },
  res: Response
): boolean {
  const error = checkDemoProtection(operation, target);
  if (error) {
    res.status(403).json({
      error: 'Demo Protection Active',
      message: error,
      code: 'DEMO_SAFE_MODE_BLOCKED'
    });
    return false; // Operation blocked
  }
  return true; // Operation allowed
}

/**
 * Log when demo protection blocks an operation
 */
export function logDemoProtectionBlock(
  operation: string,
  target: Record<string, unknown>
): void {
  console.warn('[DEMO_SAFE_MODE] Blocked operation:', {
    operation,
    target: {
      ...target,
      // Redact any sensitive fields
      password: target.password ? '[REDACTED]' : undefined,
      token: target.token ? '[REDACTED]' : undefined
    },
    timestamp: new Date().toISOString()
  });
}

/**
 * Get demo safe mode status for health checks / admin displays
 */
export function getDemoSafeModeStatus(): {
  enabled: boolean;
  protectedWorkspaceSlugs: string[];
  protectedWorkspaceIds: string[];
  protectedOperations: string[];
} {
  return {
    enabled: DEMO_SAFE_MODE,
    protectedWorkspaceSlugs: DEMO_WORKSPACE_SLUGS,
    protectedWorkspaceIds: Array.from(DEMO_WORKSPACE_IDS),
    protectedOperations: [
      'delete_workspace',
      'delete_bot',
      'delete_leads',
      'delete_appointments',
      'delete_conversations',
      'bulk_delete',
      'purge_data',
      'retention_purge'
    ]
  };
}

/**
 * Initialize demo workspace IDs from database
 * Call this during app startup
 */
export async function initializeDemoWorkspaceIds(
  getWorkspacesByPattern: (pattern: string) => Promise<{ id: string | number }[]>
): Promise<void> {
  try {
    for (const slug of DEMO_WORKSPACE_SLUGS) {
      const workspaces = await getWorkspacesByPattern(slug);
      for (const ws of workspaces) {
        DEMO_WORKSPACE_IDS.add(String(ws.id));
      }
    }
    console.log(`[DEMO_SAFE_MODE] Initialized with ${DEMO_WORKSPACE_IDS.size} protected workspace IDs`);
  } catch (error) {
    console.error('[DEMO_SAFE_MODE] Failed to initialize workspace IDs:', error);
  }
}

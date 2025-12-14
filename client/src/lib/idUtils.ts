/**
 * Utility functions for generating unique, collision-resistant IDs
 * Uses crypto.randomUUID() for reliable uniqueness
 */

/**
 * Generate a unique bot ID with an optional prefix
 */
export function generateBotId(businessName?: string): string {
  const uuid = crypto.randomUUID().slice(0, 8);
  if (businessName) {
    const slug = businessName.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "").slice(0, 20);
    return `bot_${slug}_${uuid}`;
  }
  return `bot_${uuid}`;
}

/**
 * Generate a unique client ID
 */
export function generateClientId(businessName?: string): string {
  const uuid = crypto.randomUUID().slice(0, 8);
  if (businessName) {
    const slug = businessName.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "").slice(0, 20);
    return `client_${slug}_${uuid}`;
  }
  return `client_${uuid}`;
}

/**
 * Generate a unique session/conversation ID
 */
export function generateSessionId(): string {
  return `session_${crypto.randomUUID()}`;
}

/**
 * Get the widget base URL - configurable via environment variable
 * Falls back to window.location.origin for development
 */
export function getWidgetBaseUrl(): string {
  // Check for environment variable first (Vite requires VITE_ prefix)
  const envUrl = import.meta.env.VITE_WIDGET_BASE_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.trim()) {
    return envUrl.trim().replace(/\/$/, ''); // Remove trailing slash
  }
  // Fall back to current origin
  return window.location.origin;
}

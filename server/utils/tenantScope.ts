/**
 * Tenant Scope Helpers
 * 
 * Pure functions for determining tenant context from session data.
 * Used by API routes to enforce multi-tenant isolation.
 */

/**
 * Returns the clientId to use for analytics export.
 * SECURITY: Always use session clientId - never allow query param override.
 * 
 * @param sessionClientId - The clientId from the user's session
 * @returns The clientId to use, or undefined if not available
 */
export function getExportClientId(
  sessionClientId: string | undefined | null
): string | undefined {
  return sessionClientId ?? undefined;
}

/**
 * Validates that a clientId is present and returns it, or throws.
 * 
 * @param sessionClientId - The clientId from the user's session
 * @throws Error if clientId is missing
 * @returns The validated clientId
 */
export function requireExportClientId(
  sessionClientId: string | undefined | null
): string {
  const clientId = getExportClientId(sessionClientId);
  if (!clientId || clientId.trim() === "") {
    throw new Error("Client ID required");
  }
  return clientId;
}

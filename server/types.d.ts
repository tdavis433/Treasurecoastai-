import "express-session";

declare module "express-session" {
  interface SessionData {
    userId?: string;
    username?: string;
    userRole?: 'super_admin' | 'client_admin' | 'agency_user' | 'client_owner' | 'client_user' | 'workspace_admin' | 'workspace_viewer';
    clientId?: string | null;
    // Impersonation fields
    isImpersonating?: boolean;
    originalUserId?: string;
    originalRole?: 'super_admin' | 'client_admin' | 'agency_user' | 'client_owner' | 'client_user' | 'workspace_admin' | 'workspace_viewer';
  }
}

import "express-session";

declare module "express-session" {
  interface SessionData {
    userId?: string;
    userRole?: 'super_admin' | 'client_admin' | 'agency_user' | 'client_owner' | 'client_user';
    clientId?: string | null;
    // Impersonation fields
    isImpersonating?: boolean;
    originalUserId?: string;
    originalRole?: 'super_admin' | 'client_admin' | 'agency_user' | 'client_owner' | 'client_user';
  }
}

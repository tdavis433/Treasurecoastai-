import { Switch, Route, Redirect, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Home from "@/pages/home";
import AdminDashboard from "@/pages/admin-dashboard";
import AdminAppointments from "@/pages/admin-appointments";
import AdminAnalytics from "@/pages/admin-analytics";
import SuperAdmin from "@/pages/super-admin-refactored";
import SuperAdminAuditLogs from "@/pages/super-admin-audit-logs";
import AdminNotifications from "@/pages/admin-notifications";
import ClientDetailAdmin from "@/pages/client-detail-admin";
import BotDashboard from "@/pages/bot-dashboard";
import ClientDashboard from "@/pages/client-dashboard";
import LeadsPage from "@/pages/leads";
import InboxPage from "@/pages/inbox";
import CreateBot from "@/pages/create-bot";
import BotWizard from "@/pages/bot-wizard";
import AutomationsPage from "@/pages/automations";
import WidgetSettingsPage from "@/pages/widget-settings";
import Login from "@/pages/login";
import Signup from "@/pages/signup";
import ChangePassword from "@/pages/change-password";
import ForgotPassword from "@/pages/forgot-password";
import ResetPassword from "@/pages/reset-password";
import NotFound from "@/pages/not-found";
import DemosPage from "@/pages/demos";
import DemoBotPage from "@/pages/demo-bot";
import DemoFaithHouse from "@/pages/demo-faith-house";
import DemoPawsSuds from "@/pages/demo-paws-suds";
import DemoAutoCare from "@/pages/demo-auto-care";
import DemoBarbershop from "@/pages/demo-barbershop";
import DemoSalon from "@/pages/demo-salon";
import DemoNails from "@/pages/demo-nails";
import DemoFitness from "@/pages/demo-fitness";
import DemoHandyman from "@/pages/demo-handyman";
import DemoBookingConfirmation from "@/pages/demo-booking-confirmation";
import DemoMedSpa from "@/pages/demo-med-spa";
import DemoRealEstate from "@/pages/demo-real-estate";
import DemoRestaurant from "@/pages/demo-restaurant";
import DemoTattoo from "@/pages/demo-tattoo";
import DemoRecoveryHouse from "@/pages/demo-recovery-house";
import DemoLawFirm from "@/pages/demo-law-firm";
import DemoDental from "@/pages/demo-dental";
import DemoHotel from "@/pages/demo-hotel";
import DemoRoofing from "@/pages/demo-roofing";
import DemoWedding from "@/pages/demo-wedding";
import DevEmbedTest from "@/pages/dev-embed-test";
import AgencyOnboardingConsole from "@/pages/agency-onboarding-console";
import SimpleOnboarding from "@/pages/simple-onboarding";
import PreviewPage from "@/pages/preview-page";
import { useEffect } from "react";

interface User {
  id: string;
  username: string;
  role: string;
  mustChangePassword: boolean;
  isImpersonating?: boolean;
  effectiveClientId?: string | null;
}

function PasswordChangeGuard({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  
  const { data: user, isLoading } = useQuery<User>({
    queryKey: ["/api/auth/me"],
    retry: false,
  });

  useEffect(() => {
    if (!isLoading && user?.mustChangePassword && location !== "/change-password") {
      setLocation("/change-password");
    }
  }, [user, isLoading, location, setLocation]);

  if (isLoading) {
    return null;
  }

  return <>{children}</>;
}

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { data: user, isLoading, error } = useQuery<User>({
    queryKey: ["/api/auth/me"],
    retry: false,
  });

  console.log('[AuthGuard] State:', { user, isLoading, error: error?.message });

  if (isLoading) {
    return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <div className="text-white">Loading...</div>
    </div>;
  }

  // Redirect if no user or if there's an auth error
  if (!user || error) {
    console.log('[AuthGuard] Redirecting to login - no user or error');
    return <Redirect to="/login" />;
  }

  return <>{children}</>;
}

function SuperAdminGuard({ children }: { children: React.ReactNode }) {
  const { data: user, isLoading, error } = useQuery<User>({
    queryKey: ["/api/auth/me"],
    retry: false,
  });

  console.log('[SuperAdminGuard] State:', { user, isLoading, error: error?.message });

  if (isLoading) {
    return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <div className="text-white">Loading...</div>
    </div>;
  }

  // Redirect if no user or if there's an auth error
  if (!user || error) {
    console.log('[SuperAdminGuard] Redirecting to login - no user or error');
    return <Redirect to="/login" />;
  }

  if (user.role !== "super_admin") {
    if (user.role === "client_admin") {
      return <Redirect to="/client/dashboard" />;
    } else if (user.role === "admin") {
      return <Redirect to="/admin/dashboard" />;
    }
    return <Redirect to="/login" />;
  }

  return <>{children}</>;
}

function AdminGuard({ children }: { children: React.ReactNode }) {
  const { data: user, isLoading, error } = useQuery<User>({
    queryKey: ["/api/auth/me"],
    retry: false,
  });

  if (isLoading) {
    return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <div className="text-white">Loading...</div>
    </div>;
  }

  // Redirect if no user or if there's an auth error
  if (!user || error) {
    return <Redirect to="/login" />;
  }

  if (user.role !== "admin" && user.role !== "super_admin") {
    if (user.role === "client_admin") {
      return <Redirect to="/client/dashboard" />;
    }
    return <Redirect to="/login" />;
  }

  return <>{children}</>;
}

function ClientGuard({ children }: { children: React.ReactNode }) {
  const { data: user, isLoading, error } = useQuery<User>({
    queryKey: ["/api/auth/me"],
    retry: false,
    staleTime: 0, // Always refetch to get fresh impersonation state
  });

  useEffect(() => {
    console.log('[ClientGuard] State:', { user, isLoading, error });
  }, [user, isLoading, error]);

  if (isLoading) {
    return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <div className="text-white">Loading...</div>
    </div>;
  }

  if (!user) {
    console.log('[ClientGuard] No user, redirecting to login');
    return <Redirect to="/login" />;
  }

  // Allow super_admins who are impersonating a client to view client pages
  if (user.role === "super_admin") {
    console.log('[ClientGuard] Super admin detected, isImpersonating:', user.isImpersonating, 'effectiveClientId:', user.effectiveClientId);
    if (user.isImpersonating && user.effectiveClientId) {
      console.log('[ClientGuard] Allowing impersonation access');
      return <>{children}</>;
    }
    console.log('[ClientGuard] Redirecting super admin to /super-admin');
    return <Redirect to="/super-admin" />;
  }

  if (user.role === "admin") {
    return <Redirect to="/admin/dashboard" />;
  }

  return <>{children}</>;
}

function Router() {
  return (
    <Switch>
      {/* ===== PUBLIC ROUTES ===== */}
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/signup" component={Signup} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/reset-password" component={ResetPassword} />
      
      {/* ===== DEMO ROUTES (PUBLIC) ===== */}
      <Route path="/demos" component={DemosPage} />
      <Route path="/demo/faith-house" component={DemoFaithHouse} />
      <Route path="/demo/paws-suds" component={DemoPawsSuds} />
      <Route path="/demo/auto-care" component={DemoAutoCare} />
      <Route path="/demo/barbershop" component={DemoBarbershop} />
      <Route path="/demo/salon" component={DemoSalon} />
      <Route path="/demo/nails" component={DemoNails} />
      <Route path="/demo/fitness" component={DemoFitness} />
      <Route path="/demo/handyman" component={DemoHandyman} />
      <Route path="/demo-booking-confirmation" component={DemoBookingConfirmation} />
      <Route path="/demo/med-spa" component={DemoMedSpa} />
      <Route path="/demo/real-estate" component={DemoRealEstate} />
      <Route path="/demo/restaurant" component={DemoRestaurant} />
      <Route path="/demo/tattoo" component={DemoTattoo} />
      <Route path="/demo/recovery-house" component={DemoRecoveryHouse} />
      <Route path="/demo/law-firm" component={DemoLawFirm} />
      <Route path="/demo/dental" component={DemoDental} />
      <Route path="/demo/hotel" component={DemoHotel} />
      <Route path="/demo/roofing" component={DemoRoofing} />
      <Route path="/demo/wedding" component={DemoWedding} />
      <Route path="/demo/:botId" component={DemoBotPage} />
      <Route path="/preview/:workspaceSlug" component={PreviewPage} />
      <Route path="/dev/embed-test" component={DevEmbedTest} />

      {/* ===== SHARED AUTH ROUTES ===== */}
      <Route path="/change-password">
        <AuthGuard>
          <ChangePassword />
        </AuthGuard>
      </Route>

      {/* ===== CLIENT ROUTES (CLIENTS ONLY) ===== */}
      <Route path="/client/dashboard">
        <AuthGuard>
          <ClientGuard>
            <ClientDashboard />
          </ClientGuard>
        </AuthGuard>
      </Route>
      
      {/* Legacy client routes - redirect to main dashboard */}
      <Route path="/client/leads">
        <Redirect to="/client/dashboard" />
      </Route>
      <Route path="/client/inbox">
        <Redirect to="/client/dashboard" />
      </Route>

      {/* ===== ADMIN ROUTES (TYLER / ADMIN ROLE - BOT MANAGEMENT) ===== */}
      <Route path="/admin/dashboard">
        <AuthGuard>
          <AdminGuard>
            <AdminDashboard />
          </AdminGuard>
        </AuthGuard>
      </Route>
      
      <Route path="/admin/appointments">
        <AuthGuard>
          <AdminGuard>
            <AdminAppointments />
          </AdminGuard>
        </AuthGuard>
      </Route>
      
      <Route path="/admin/analytics">
        <AuthGuard>
          <AdminGuard>
            <AdminAnalytics />
          </AdminGuard>
        </AuthGuard>
      </Route>
      
      <Route path="/admin/notifications">
        <AuthGuard>
          <AdminGuard>
            <AdminNotifications />
          </AdminGuard>
        </AuthGuard>
      </Route>
      
      <Route path="/admin/bot/new">
        <AuthGuard>
          <AdminGuard>
            <CreateBot />
          </AdminGuard>
        </AuthGuard>
      </Route>
      
      <Route path="/admin/bot/wizard">
        <AuthGuard>
          <AdminGuard>
            <BotWizard />
          </AdminGuard>
        </AuthGuard>
      </Route>
      
      <Route path="/admin/bot/:botId/automations">
        <AuthGuard>
          <AdminGuard>
            <AutomationsPage />
          </AdminGuard>
        </AuthGuard>
      </Route>
      
      <Route path="/admin/bot/:botId/widget-settings">
        <AuthGuard>
          <AdminGuard>
            <WidgetSettingsPage />
          </AdminGuard>
        </AuthGuard>
      </Route>
      
      <Route path="/admin/bot/:botId">
        <AuthGuard>
          <AdminGuard>
            <BotDashboard />
          </AdminGuard>
        </AuthGuard>
      </Route>
      
      <Route path="/admin">
        <Redirect to="/admin/dashboard" />
      </Route>

      {/* ===== SUPER ADMIN ROUTES (TYLER ONLY - SYSTEM MANAGEMENT) ===== */}
      <Route path="/super-admin">
        <AuthGuard>
          <SuperAdminGuard>
            <SuperAdmin />
          </SuperAdminGuard>
        </AuthGuard>
      </Route>
      
      <Route path="/super-admin/clients/:slug">
        <AuthGuard>
          <SuperAdminGuard>
            <ClientDetailAdmin />
          </SuperAdminGuard>
        </AuthGuard>
      </Route>
      
      <Route path="/super-admin/audit-logs">
        <AuthGuard>
          <SuperAdminGuard>
            <SuperAdminAuditLogs />
          </SuperAdminGuard>
        </AuthGuard>
      </Route>
      
      <Route path="/super-admin/agency-onboarding">
        <AuthGuard>
          <SuperAdminGuard>
            <AgencyOnboardingConsole />
          </SuperAdminGuard>
        </AuthGuard>
      </Route>
      
      <Route path="/super-admin/onboard">
        <AuthGuard>
          <SuperAdminGuard>
            <SimpleOnboarding />
          </SuperAdminGuard>
        </AuthGuard>
      </Route>

      {/* ===== 404 NOT FOUND ===== */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <PasswordChangeGuard>
          <Router />
        </PasswordChangeGuard>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

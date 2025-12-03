import { Switch, Route, Redirect, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Home from "@/pages/home";
import AdminDashboard from "@/pages/admin-dashboard";
import AdminAppointments from "@/pages/admin-appointments";
import AdminAnalytics from "@/pages/admin-analytics";
import ControlCenter from "@/pages/control-center";
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
import NotFound from "@/pages/not-found";
import DemosPage from "@/pages/demos";
import DemoBotPage from "@/pages/demo-bot";
import { useEffect } from "react";

function PasswordChangeGuard({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  
  const { data: user, isLoading } = useQuery<{ 
    id: string; 
    username: string; 
    role: string; 
    mustChangePassword: boolean 
  }>({
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

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/demos" component={DemosPage} />
      <Route path="/demo/:botId" component={DemoBotPage} />
      <Route path="/login" component={Login} />
      <Route path="/signup" component={Signup} />
      <Route path="/change-password" component={ChangePassword} />
      <Route path="/admin/dashboard" component={AdminDashboard} />
      <Route path="/admin/appointments" component={AdminAppointments} />
      <Route path="/admin/analytics" component={AdminAnalytics} />
      <Route path="/admin/bot/new" component={CreateBot} />
      <Route path="/admin/bot/wizard" component={BotWizard} />
      <Route path="/admin/bot/:botId/automations" component={AutomationsPage} />
      <Route path="/admin/bot/:botId/widget-settings" component={WidgetSettingsPage} />
      <Route path="/admin/bot/:botId" component={BotDashboard} />
      <Route path="/admin">
        <Redirect to="/admin/dashboard" />
      </Route>
      <Route path="/client/dashboard" component={ClientDashboard} />
      <Route path="/client/leads" component={LeadsPage} />
      <Route path="/client/inbox" component={InboxPage} />
      <Route path="/super-admin/clients/:slug" component={ClientDetailAdmin} />
      <Route path="/super-admin" component={ControlCenter} />
      <Route path="/super-admin/control-center">
        <Redirect to="/super-admin" />
      </Route>
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

import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Home from "@/pages/home";
import AdminDashboard from "@/pages/admin-dashboard";
import AdminAppointments from "@/pages/admin-appointments";
import AdminAnalytics from "@/pages/admin-analytics";
import SuperAdmin from "@/pages/super-admin";
import ControlCenter from "@/pages/control-center";
import BotDashboard from "@/pages/bot-dashboard";
import ClientDashboard from "@/pages/client-dashboard";
import LeadsPage from "@/pages/leads";
import InboxPage from "@/pages/inbox";
import CreateBot from "@/pages/create-bot";
import BotWizard from "@/pages/bot-wizard";
import AutomationsPage from "@/pages/automations";
import Login from "@/pages/login";
import NotFound from "@/pages/not-found";
import DemosPage from "@/pages/demos";
import DemoBotPage from "@/pages/demo-bot";

function Router() {
  return (
    <Switch>
      <Route path="/" component={DemosPage} />
      <Route path="/demos" component={DemosPage} />
      <Route path="/faith-house" component={Home} />
      <Route path="/demo/:botId" component={DemoBotPage} />
      <Route path="/admin/dashboard" component={AdminDashboard} />
      <Route path="/admin/appointments" component={AdminAppointments} />
      <Route path="/admin/analytics" component={AdminAnalytics} />
      <Route path="/admin/bot/new" component={CreateBot} />
      <Route path="/admin/bot/wizard" component={BotWizard} />
      <Route path="/admin/bot/:botId/automations" component={AutomationsPage} />
      <Route path="/admin/bot/:botId" component={BotDashboard} />
      <Route path="/admin">
        <Redirect to="/admin/dashboard" />
      </Route>
      <Route path="/client/dashboard" component={ClientDashboard} />
      <Route path="/client/leads" component={LeadsPage} />
      <Route path="/client/inbox" component={InboxPage} />
      <Route path="/login" component={Login} />
      <Route path="/super-admin" component={SuperAdmin} />
      <Route path="/super-admin/control-center" component={ControlCenter} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

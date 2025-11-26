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
import Login from "@/pages/login";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/admin/dashboard" component={AdminDashboard} />
      <Route path="/admin/appointments" component={AdminAppointments} />
      <Route path="/admin/analytics" component={AdminAnalytics} />
      <Route path="/admin">
        <Redirect to="/admin/dashboard" />
      </Route>
      <Route path="/login" component={Login} />
      <Route path="/super-admin" component={SuperAdmin} />
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

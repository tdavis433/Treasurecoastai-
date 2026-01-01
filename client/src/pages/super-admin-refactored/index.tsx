import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { TreasureCoastLogo } from "@/components/treasure-coast-logo";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from "@/components/ui/dropdown-menu";
import { LogOut, Crown, Settings, ChevronDown } from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import { ClientOnboardingWizard } from "@/components/client-onboarding-wizard";

import ClientsSection from "./components/sections/ClientsSection";
import TemplatesSection from "./components/sections/TemplatesSection";
import AnalyticsSection from "./components/sections/AnalyticsSection";
import UsersSection from "./components/sections/UsersSection";
import BillingSection from "./components/sections/BillingSection";
import LogsSection from "./components/sections/LogsSection";
import BotRequestsSection from "./components/sections/BotRequestsSection";
import { SaveLockProvider } from "./hooks/useSaveLock";

interface User {
  id: string;
  username: string;
  role: string;
}

export default function SuperAdmin() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("clients");
  const [showOnboardingWizard, setShowOnboardingWizard] = useState(false);

  const { data: user } = useQuery<User>({
    queryKey: ["/api/auth/me"],
  });

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    queryClient.clear();
    setLocation("/login");
  };

  return (
    <SaveLockProvider>
      <div className="min-h-screen bg-[#0a0a0a]">
        <div className="border-b border-white/10 bg-black/40 backdrop-blur-xl sticky top-0 z-50">
          <div className="max-w-[1800px] mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <TreasureCoastLogo className="h-8" />
                <div className="flex items-center gap-2">
                  <Crown className="w-4 h-4 text-[#00e5ff]" />
                  <span className="text-white font-semibold">Super Admin</span>
                </div>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10"
                    data-testid="button-user-menu"
                  >
                    <div className="h-6 w-6 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-xs font-bold text-white">
                      {user?.username?.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm text-white/70">{user?.username}</span>
                    <ChevronDown className="h-4 w-4 text-white/50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 bg-[#1a1d24] border-white/10">
                  <DropdownMenuLabel className="text-white/50">My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-white/10" />
                  <DropdownMenuItem 
                    className="text-white hover:bg-white/10 cursor-pointer"
                    onClick={() => setLocation('/change-password')}
                    data-testid="menu-item-account-settings"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Account Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-white/10" />
                  <DropdownMenuItem 
                    className="text-red-400 hover:bg-white/10 cursor-pointer"
                    onClick={handleLogout}
                    data-testid="menu-item-logout"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        <div className="max-w-[1800px] mx-auto px-6 py-8">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-8 bg-white/5 border border-white/10">
              <TabsTrigger value="clients" data-testid="tab-clients">Clients</TabsTrigger>
              <TabsTrigger value="requests" data-testid="tab-requests">Bot Requests</TabsTrigger>
              <TabsTrigger value="templates" data-testid="tab-templates">Templates</TabsTrigger>
              <TabsTrigger value="analytics" data-testid="tab-analytics">Analytics</TabsTrigger>
              <TabsTrigger value="users" data-testid="tab-users">Users</TabsTrigger>
              <TabsTrigger value="billing" data-testid="tab-billing">Billing</TabsTrigger>
              <TabsTrigger value="logs" data-testid="tab-logs">System Logs</TabsTrigger>
            </TabsList>

            <TabsContent value="clients">
              <ClientsSection onNewClient={() => setShowOnboardingWizard(true)} />
            </TabsContent>

            <TabsContent value="requests">
              <BotRequestsSection />
            </TabsContent>

            <TabsContent value="templates">
              <TemplatesSection />
            </TabsContent>

            <TabsContent value="analytics">
              <AnalyticsSection />
            </TabsContent>

            <TabsContent value="users">
              <UsersSection />
            </TabsContent>

            <TabsContent value="billing">
              <BillingSection />
            </TabsContent>

            <TabsContent value="logs">
              <LogsSection />
            </TabsContent>
          </Tabs>
        </div>
        
        <ClientOnboardingWizard 
          open={showOnboardingWizard}
          onOpenChange={setShowOnboardingWizard}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ["/api/super-admin/clients"] });
          }}
        />
      </div>
    </SaveLockProvider>
  );
}

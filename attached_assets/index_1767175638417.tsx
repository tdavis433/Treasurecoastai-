import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { TreasureCoastLogo } from "@/components/treasure-coast-logo";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LogOut, Crown } from "lucide-react";

import ClientsSection from "./components/sections/ClientsSection";
import TemplatesSection from "./components/sections/TemplatesSection";
import AnalyticsSection from "./components/sections/AnalyticsSection";
import UsersSection from "./components/sections/UsersSection";
import BillingSection from "./components/sections/BillingSection";
import LogsSection from "./components/sections/LogsSection";
import { SaveLockProvider } from "./hooks/useSaveLock";


interface User {
  id: string;
  username: string;
  role: string;
}

export default function SuperAdmin() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("clients");

  const { data: user } = useQuery<User>({
    queryKey: ["/api/auth/me"],
  });

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setLocation("/login");
  };

  return (
    <SaveLockProvider>
      <div className="min-h-screen bg-[#0a0a0a]">
        {/* Header */}
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

              <div className="flex items-center gap-4">
                <span className="text-white/60 text-sm">{user?.username}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="text-white/60 hover:text-white"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-[1800px] mx-auto px-6 py-8">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-8 bg-white/5 border border-white/10">
              <TabsTrigger value="clients">Clients</TabsTrigger>
              <TabsTrigger value="templates">Templates</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="billing">Billing</TabsTrigger>
              <TabsTrigger value="logs">System Logs</TabsTrigger>
            </TabsList>

            <TabsContent value="clients">
              <ClientsSection />
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
      </div>
    </SaveLockProvider>
  );
}


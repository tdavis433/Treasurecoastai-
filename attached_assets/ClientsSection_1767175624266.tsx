import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Eye, Search, Plus } from "lucide-react";
import { useLocation } from "wouter";
import type { Client } from "../../types";


export default function ClientsSection() {
  const [searchQuery, setSearchQuery] = useState("");
  const [, setLocation] = useLocation();
  
  const { data: clients = [], isLoading } = useQuery<Client[]>({
    queryKey: ["/api/super-admin/clients"],
  });

  const filteredClients = clients.filter(client => 
    client.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Client Management</h2>
        <Button 
          onClick={() => setLocation("/super-admin/agency-onboarding")}
          className="bg-[#00e5ff] text-black hover:bg-[#00b8cc]"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Client
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
        <Input
          placeholder="Search clients..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-white/5 border-white/10 text-white"
        />
      </div>

      {isLoading ? (
        <div className="text-white/60 text-center py-12">Loading clients...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClients.map((client) => (
            <GlassCard key={client.id} className="hover:border-[#00e5ff]/30 transition-colors cursor-pointer">
              <GlassCardHeader>
                <div className="flex items-center justify-between">
                  <GlassCardTitle className="text-lg">{client.name}</GlassCardTitle>
                  <Badge variant={client.status === 'active' ? 'default' : 'outline'}>
                    {client.status}
                  </Badge>
                </div>
              </GlassCardHeader>
              <GlassCardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-white/60">
                    <span>Bots:</span>
                    <span className="text-white">{client.botsCount || 0}</span>
                  </div>
                  <div className="flex justify-between text-white/60">
                    <span>Conversations:</span>
                    <span className="text-white">{client.totalConversations || 0}</span>
                  </div>
                  <div className="flex justify-between text-white/60">
                    <span>Plan:</span>
                    <span className="text-[#00e5ff]">{client.plan || 'Free'}</span>
                  </div>
                </div>
                
                <div className="mt-4 flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 border-[#00e5ff]/30 text-[#00e5ff] hover:bg-[#00e5ff]/10"
                    onClick={() => setLocation(`/super-admin/clients/${client.slug}`)}
                  >
                    Manage
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-[#00e5ff]/30 text-[#00e5ff] hover:bg-[#00e5ff]/10"
                    onClick={() => {
                      // Impersonate client
                      fetch(`/api/super-admin/impersonate/${client.id}`, { method: 'POST' })
                        .then(() => setLocation('/client/dashboard'));
                    }}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                </div>
              </GlassCardContent>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}


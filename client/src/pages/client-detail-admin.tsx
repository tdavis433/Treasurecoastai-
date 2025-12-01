import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { useLocation, useRoute } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { GlassCard, GlassCardHeader, GlassCardTitle, GlassCardDescription, GlassCardContent } from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Bot, Users, Settings, BarChart3, MessageSquare, 
  Eye, Edit2, Trash2, Clock, CreditCard, Building2,
  ChevronLeft, UserPlus, Shield
} from "lucide-react";

interface AuthUser {
  id: number;
  username: string;
  role: 'super_admin' | 'client_admin';
  clientId?: string;
}

interface WorkspaceData {
  id: string;
  name: string;
  slug: string;
  status: string;
  plan: string;
  botsCount: number;
  totalConversations: number;
  lastActive: string | null;
  clientId?: string;
}

interface BotConfig {
  botId: string;
  clientId: string;
  name: string;
  description: string;
  businessProfile?: {
    businessName?: string;
    type?: string;
  };
}

export default function ClientDetailAdmin() {
  const [, params] = useRoute("/super-admin/clients/:slug");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const slug = params?.slug;
  
  const [activeTab, setActiveTab] = useState<'overview' | 'assistants' | 'conversations' | 'leads' | 'billing' | 'users' | 'settings'>('overview');

  const { data: currentUser, isLoading: authLoading } = useQuery<AuthUser>({
    queryKey: ["/api/auth/me"],
    queryFn: async () => {
      const response = await fetch("/api/auth/me", { credentials: "include" });
      if (!response.ok) throw new Error("Not authenticated");
      return response.json();
    },
  });

  const { data: workspaceResponse, isLoading: workspaceLoading } = useQuery<{
    workspace: WorkspaceData;
    stats: {
      conversations30d: number;
      leads30d: number;
      appointments30d: number;
    };
    bots: Array<{
      botId: string;
      name: string;
      status: string;
      lastActive: string | null;
      conversations30d: number;
      leads30d: number;
    }>;
  }>({
    queryKey: ["/api/super-admin/workspaces", slug],
    queryFn: async () => {
      const response = await fetch(`/api/super-admin/workspaces/${slug}`, { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch workspace");
      return response.json();
    },
    enabled: !!slug && currentUser?.role === "super_admin",
  });

  const workspaceData = workspaceResponse?.workspace;
  const clientBots = workspaceResponse?.bots || [];

  const { data: clientConversations, isLoading: clientConvLoading } = useQuery<{
    conversations: Array<{
      id: string;
      sessionId: string;
      botId: string;
      visitorName?: string;
      visitorEmail?: string;
      visitorPhone?: string;
      messageCount: number;
      sentiment?: string;
      summary?: string;
      createdAt: string;
    }>;
    total: number;
  }>({
    queryKey: ["/api/super-admin/workspaces", slug, "conversations"],
    queryFn: async () => {
      const response = await fetch(`/api/super-admin/workspaces/${slug}/conversations`, { credentials: "include" });
      if (!response.ok) return { conversations: [], total: 0 };
      return response.json();
    },
    enabled: !!slug && activeTab === 'conversations',
  });

  const { data: clientLeads, isLoading: clientLeadsLoading } = useQuery<{
    leads: Array<{
      id: string;
      name: string;
      email?: string;
      phone?: string;
      context?: string;
      status: string;
      createdAt: string;
    }>;
    total: number;
  }>({
    queryKey: ["/api/super-admin/workspaces", slug, "leads"],
    queryFn: async () => {
      const response = await fetch(`/api/super-admin/workspaces/${slug}/leads`, { credentials: "include" });
      if (!response.ok) return { leads: [], total: 0 };
      return response.json();
    },
    enabled: !!slug && activeTab === 'leads',
  });

  const { data: workspaceUsers, isLoading: usersLoading } = useQuery<Array<{
    id: number;
    username: string;
    role: string;
    createdAt?: string;
  }>>({
    queryKey: ["/api/super-admin/workspaces", slug, "users"],
    queryFn: async () => {
      const response = await fetch(`/api/super-admin/workspaces/${slug}/users`, { credentials: "include" });
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!slug && activeTab === 'users',
  });

  const updateWorkspaceMutation = useMutation({
    mutationFn: async (data: { plan?: string; status?: string }) => {
      const response = await apiRequest("PATCH", `/api/super-admin/workspaces/${slug}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/super-admin/workspaces", slug] });
      queryClient.invalidateQueries({ queryKey: ["/api/super-admin/workspaces"] });
      toast({ title: "Updated", description: "Workspace updated successfully." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update workspace.", variant: "destructive" });
    },
  });

  const deleteWorkspaceMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("DELETE", `/api/super-admin/workspaces/${slug}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/super-admin/workspaces"] });
      toast({ title: "Deleted", description: "Workspace deleted successfully." });
      setLocation("/super-admin");
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete workspace.", variant: "destructive" });
    },
  });

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="h-8 w-8 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin" />
      </div>
    );
  }

  if (!currentUser || currentUser.role !== "super_admin") {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-white/55">Unauthorized</div>
      </div>
    );
  }

  if (workspaceLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="h-8 w-8 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin" />
      </div>
    );
  }

  if (!workspaceData) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex flex-col items-center justify-center gap-4">
        <div className="text-white/55">Workspace not found</div>
        <Button variant="outline" onClick={() => setLocation("/super-admin")} className="border-white/10 text-white/70">
          <ChevronLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
      </div>
    );
  }

  const tabs = [
    { value: 'overview', label: 'Overview', icon: BarChart3 },
    { value: 'assistants', label: 'Assistants', icon: Bot },
    { value: 'conversations', label: 'Conversations', icon: MessageSquare },
    { value: 'leads', label: 'Leads', icon: Users },
    { value: 'billing', label: 'Billing', icon: CreditCard },
    { value: 'users', label: 'Users', icon: Shield },
    { value: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => setLocation("/super-admin")}
              className="text-white/55 hover:text-white hover:bg-white/10"
              data-testid="button-back"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 flex items-center justify-center">
                <Building2 className="h-6 w-6 text-cyan-400" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-white">{workspaceData.name}</h1>
                <p className="text-sm text-white/55">{workspaceData.slug} • {workspaceData.plan.charAt(0).toUpperCase() + workspaceData.plan.slice(1)} Plan</p>
              </div>
            </div>
          </div>
          <Badge className={`${
            workspaceData.status === 'active' ? "bg-green-500/20 text-green-400" :
            workspaceData.status === 'paused' ? "bg-amber-500/20 text-amber-400" :
            "bg-red-500/20 text-red-400"
          }`}>
            {workspaceData.status.charAt(0).toUpperCase() + workspaceData.status.slice(1)}
          </Badge>
        </div>

        {/* Tabs */}
        <div className="border-b border-white/10 mb-6">
          <div className="flex gap-1">
            {tabs.map(tab => (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value as typeof activeTab)}
                data-testid={`tab-${tab.value}`}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
                  activeTab === tab.value
                    ? 'border-cyan-400 text-cyan-400'
                    : 'border-transparent text-white/55 hover:text-white'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <GlassCard>
                  <GlassCardContent className="py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                        <Bot className="h-5 w-5 text-cyan-400" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-white">{workspaceData.botsCount}</p>
                        <p className="text-xs text-white/55">Assistants</p>
                      </div>
                    </div>
                  </GlassCardContent>
                </GlassCard>
                <GlassCard>
                  <GlassCardContent className="py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                        <MessageSquare className="h-5 w-5 text-purple-400" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-white">{workspaceData.totalConversations}</p>
                        <p className="text-xs text-white/55">Conversations</p>
                      </div>
                    </div>
                  </GlassCardContent>
                </GlassCard>
                <GlassCard>
                  <GlassCardContent className="py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                        <Users className="h-5 w-5 text-green-400" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-white">{clientLeads?.total || 0}</p>
                        <p className="text-xs text-white/55">Total Leads</p>
                      </div>
                    </div>
                  </GlassCardContent>
                </GlassCard>
                <GlassCard>
                  <GlassCardContent className="py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                        <Clock className="h-5 w-5 text-amber-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">
                          {workspaceData.lastActive 
                            ? new Date(workspaceData.lastActive).toLocaleDateString() 
                            : 'Never'}
                        </p>
                        <p className="text-xs text-white/55">Last Active</p>
                      </div>
                    </div>
                  </GlassCardContent>
                </GlassCard>
              </div>

              <GlassCard>
                <GlassCardHeader>
                  <GlassCardTitle className="text-sm">Client Information</GlassCardTitle>
                </GlassCardHeader>
                <GlassCardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-white/55">Workspace ID</span>
                      <p className="text-white font-mono">{workspaceData.id}</p>
                    </div>
                    <div>
                      <span className="text-white/55">Slug</span>
                      <p className="text-white">{workspaceData.slug}</p>
                    </div>
                    <div>
                      <span className="text-white/55">Plan</span>
                      <p className="text-white capitalize">{workspaceData.plan}</p>
                    </div>
                    <div>
                      <span className="text-white/55">Status</span>
                      <p className="text-white capitalize">{workspaceData.status}</p>
                    </div>
                  </div>
                </GlassCardContent>
              </GlassCard>
            </div>
          )}

          {/* Assistants Tab */}
          {activeTab === 'assistants' && (
            <div className="space-y-4">
              {clientBots.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {clientBots.map(bot => (
                    <GlassCard key={bot.botId} hover>
                      <GlassCardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <GlassCardTitle className="text-sm">{bot.name}</GlassCardTitle>
                            <GlassCardDescription className="text-xs">
                              {bot.conversations30d} conversations · {bot.leads30d} leads (30d)
                            </GlassCardDescription>
                          </div>
                          <Badge className={`text-xs ${bot.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-amber-500/20 text-amber-400'}`}>
                            {bot.status.charAt(0).toUpperCase() + bot.status.slice(1)}
                          </Badge>
                        </div>
                      </GlassCardHeader>
                      <GlassCardContent>
                        <p className="text-xs text-white/55">
                          Last active: {bot.lastActive ? new Date(bot.lastActive).toLocaleDateString() : 'Never'}
                        </p>
                        <div className="flex gap-2 mt-3">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs border-white/10 text-white/70 hover:bg-white/10"
                            onClick={() => setLocation(`/admin/bot/${bot.botId}`)}
                          >
                            <Settings className="h-3 w-3 mr-1" />
                            Configure
                          </Button>
                        </div>
                      </GlassCardContent>
                    </GlassCard>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Bot className="h-12 w-12 text-white/20 mx-auto mb-3" />
                  <p className="text-white/55">No assistants found for this client</p>
                </div>
              )}
            </div>
          )}

          {/* Conversations Tab */}
          {activeTab === 'conversations' && (
            <div className="space-y-4">
              {clientConvLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="h-8 w-8 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin" />
                </div>
              ) : (clientConversations?.conversations?.length || 0) > 0 ? (
                <div className="space-y-3">
                  {clientConversations?.conversations.map(conv => (
                    <GlassCard key={conv.id} className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-white font-medium text-sm truncate">
                              {conv.visitorName || 'Anonymous Visitor'}
                            </p>
                            <Badge className="bg-white/10 text-white/70 text-xs">{conv.messageCount} msgs</Badge>
                          </div>
                          <p className="text-xs text-white/55">{conv.visitorEmail || conv.visitorPhone || 'No contact info'}</p>
                          {conv.summary && <p className="text-xs text-white/40 mt-1 line-clamp-2">{conv.summary}</p>}
                        </div>
                        <span className="text-xs text-white/40">{new Date(conv.createdAt).toLocaleDateString()}</span>
                      </div>
                    </GlassCard>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <MessageSquare className="h-12 w-12 text-white/20 mx-auto mb-3" />
                  <p className="text-white/55">No conversations yet</p>
                </div>
              )}
            </div>
          )}

          {/* Leads Tab */}
          {activeTab === 'leads' && (
            <div className="space-y-4">
              {clientLeadsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="h-8 w-8 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin" />
                </div>
              ) : (clientLeads?.leads?.length || 0) > 0 ? (
                <div className="space-y-3">
                  {clientLeads?.leads.map(lead => (
                    <GlassCard key={lead.id} className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-medium text-sm">{lead.name}</p>
                          <div className="flex items-center gap-3 text-xs text-white/55 mt-1">
                            {lead.email && <span>{lead.email}</span>}
                            {lead.phone && <span>{lead.phone}</span>}
                          </div>
                          {lead.context && <p className="text-xs text-white/40 mt-2">{lead.context}</p>}
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <Badge className={`text-xs ${
                            lead.status === 'new' ? 'bg-cyan-500/20 text-cyan-400' :
                            lead.status === 'contacted' ? 'bg-amber-500/20 text-amber-400' :
                            lead.status === 'qualified' ? 'bg-green-500/20 text-green-400' :
                            'bg-white/10 text-white/55'
                          }`}>
                            {lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
                          </Badge>
                          <span className="text-xs text-white/40">{new Date(lead.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </GlassCard>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 text-white/20 mx-auto mb-3" />
                  <p className="text-white/55">No leads captured yet</p>
                </div>
              )}
            </div>
          )}

          {/* Billing Tab */}
          {activeTab === 'billing' && (
            <div className="space-y-6">
              <GlassCard>
                <GlassCardHeader>
                  <GlassCardTitle className="text-sm">Current Plan</GlassCardTitle>
                </GlassCardHeader>
                <GlassCardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-white capitalize">{workspaceData.plan}</p>
                      <p className="text-sm text-white/55">
                        {workspaceData.plan === 'free' ? '$0/month' :
                         workspaceData.plan === 'starter' ? '$49/month' :
                         workspaceData.plan === 'pro' ? '$149/month' :
                         '$299/month'}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      className="border-white/10 text-white/70 hover:bg-white/10"
                      onClick={() => {
                        const newPlan = prompt('Enter new plan (free, starter, pro, enterprise):', workspaceData.plan);
                        if (newPlan && ['free', 'starter', 'pro', 'enterprise'].includes(newPlan)) {
                          updateWorkspaceMutation.mutate({ plan: newPlan });
                        }
                      }}
                    >
                      Change Plan
                    </Button>
                  </div>
                </GlassCardContent>
              </GlassCard>

              <GlassCard>
                <GlassCardHeader>
                  <GlassCardTitle className="text-sm">Usage This Month</GlassCardTitle>
                </GlassCardHeader>
                <GlassCardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-white/55">Conversations</span>
                        <span className="text-white">{workspaceData.totalConversations} / unlimited</span>
                      </div>
                      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-cyan-500 rounded-full" style={{ width: '30%' }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-white/55">AI Assistants</span>
                        <span className="text-white">{workspaceData.botsCount} / {workspaceData.plan === 'free' ? 1 : workspaceData.plan === 'starter' ? 3 : 10}</span>
                      </div>
                      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-purple-500 rounded-full" 
                          style={{ width: `${Math.min(100, (workspaceData.botsCount / (workspaceData.plan === 'free' ? 1 : workspaceData.plan === 'starter' ? 3 : 10)) * 100)}%` }} 
                        />
                      </div>
                    </div>
                  </div>
                </GlassCardContent>
              </GlassCard>
            </div>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-white">Workspace Users</h3>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-white/10 text-white/70 hover:bg-white/10"
                  onClick={() => toast({ title: "Coming Soon", description: "User invitation flow will be added." })}
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Invite User
                </Button>
              </div>

              {usersLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="h-8 w-8 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin" />
                </div>
              ) : (workspaceUsers?.length || 0) > 0 ? (
                <div className="space-y-3">
                  {workspaceUsers?.map(user => (
                    <GlassCard key={user.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-cyan-500/20 to-purple-500/20 flex items-center justify-center">
                            <span className="text-cyan-400 font-medium text-sm">
                              {user.username.slice(0, 2).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="text-white font-medium text-sm">{user.username}</p>
                            <p className="text-xs text-white/55">
                              {user.createdAt ? `Joined ${new Date(user.createdAt).toLocaleDateString()}` : 'Member'}
                            </p>
                          </div>
                        </div>
                        <Badge className={`text-xs ${
                          user.role === 'super_admin' ? 'bg-purple-500/20 text-purple-400' :
                          user.role === 'client_admin' ? 'bg-cyan-500/20 text-cyan-400' :
                          'bg-white/10 text-white/55'
                        }`}>
                          {user.role === 'super_admin' ? 'Super Admin' :
                           user.role === 'client_admin' ? 'Admin' : 'User'}
                        </Badge>
                      </div>
                    </GlassCard>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Shield className="h-12 w-12 text-white/20 mx-auto mb-3" />
                  <p className="text-white/55">No users assigned to this workspace</p>
                  <p className="text-white/40 text-xs mt-1">Invite users to give them access</p>
                </div>
              )}
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <GlassCard>
                <GlassCardHeader>
                  <GlassCardTitle className="text-sm">Workspace Settings</GlassCardTitle>
                </GlassCardHeader>
                <GlassCardContent>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm text-white/55">Business Name</label>
                      <p className="text-white">{workspaceData.name}</p>
                    </div>
                    <div>
                      <label className="text-sm text-white/55">Workspace Slug</label>
                      <p className="text-white font-mono">{workspaceData.slug}</p>
                    </div>
                  </div>
                </GlassCardContent>
              </GlassCard>

              <GlassCard>
                <GlassCardHeader>
                  <GlassCardTitle className="text-sm">Quick Actions</GlassCardTitle>
                </GlassCardHeader>
                <GlassCardContent>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-white/10 text-white/70 hover:bg-white/10"
                      onClick={() => window.open(`/client/dashboard?impersonate=${workspaceData.slug}`, '_blank')}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View as Client
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-white/10 text-white/70 hover:bg-white/10"
                      onClick={() => {
                        const newName = prompt('Enter new business name:', workspaceData.name);
                        if (newName) {
                          toast({ title: "Coming Soon", description: "Name editing will be added." });
                        }
                      }}
                    >
                      <Edit2 className="h-4 w-4 mr-2" />
                      Edit Workspace
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                      onClick={() => {
                        if (confirm(`Are you sure you want to delete "${workspaceData.name}"?`)) {
                          deleteWorkspaceMutation.mutate();
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Workspace
                    </Button>
                  </div>
                </GlassCardContent>
              </GlassCard>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

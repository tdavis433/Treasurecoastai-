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
  ChevronLeft, UserPlus, Shield, Plus, RefreshCw,
  TestTube2, ExternalLink
} from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
  isDemo?: boolean;
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

// Helper to format appointment time - prefer scheduledAt if available
function formatAppointmentTime(apt: { preferredTime: string; scheduledAt?: string | null }): string {
  if (apt.scheduledAt) {
    try {
      const date = new Date(apt.scheduledAt);
      return date.toLocaleString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return apt.preferredTime;
    }
  }
  return apt.preferredTime;
}

export default function ClientDetailAdmin() {
  const [, params] = useRoute("/super-admin/clients/:slug");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const slug = params?.slug;
  
  const [activeTab, setActiveTab] = useState<'overview' | 'assistants' | 'conversations' | 'leads' | 'bookings' | 'billing' | 'users' | 'settings'>('overview');
  const [showCreateAssistantModal, setShowCreateAssistantModal] = useState(false);
  const [showInviteUserModal, setShowInviteUserModal] = useState(false);
  const [newAssistantForm, setNewAssistantForm] = useState({
    botId: '',
    name: '',
    businessType: 'auto_repair',
  });
  const [newUserForm, setNewUserForm] = useState({
    email: '',
    password: '',
  });
  const [userFormTouched, setUserFormTouched] = useState({ email: false, password: false });
  const [userFormErrors, setUserFormErrors] = useState<{ email?: string; password?: string }>({});
  
  // Workspace editing state
  const [showEditNameModal, setShowEditNameModal] = useState(false);
  const [editNameValue, setEditNameValue] = useState('');

  // Validation helpers for user form
  const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isValidPassword = (password: string) => {
    // At least 8 chars, 1 letter, 1 number
    return password.length >= 8 && /[a-zA-Z]/.test(password) && /[0-9]/.test(password);
  };

  const validateUserForm = () => {
    const errors: { email?: string; password?: string } = {};
    if (!newUserForm.email.trim()) {
      errors.email = 'Email is required';
    } else if (!isValidEmail(newUserForm.email)) {
      errors.email = 'Please enter a valid email address';
    }
    if (!newUserForm.password) {
      errors.password = 'Password is required';
    } else if (!isValidPassword(newUserForm.password)) {
      errors.password = 'Password must be at least 8 characters with letters and numbers';
    }
    return errors;
  };

  const businessTypes = [
    { value: 'auto_repair', label: 'Auto Repair' },
    { value: 'restaurant', label: 'Restaurant' },
    { value: 'cafe', label: 'Cafe' },
    { value: 'fitness_center', label: 'Fitness Center' },
    { value: 'dental_practice', label: 'Dental Practice' },
    { value: 'salon', label: 'Salon & Spa' },
    { value: 'real_estate', label: 'Real Estate' },
    { value: 'sober_living', label: 'Sober Living' },
    { value: 'medical_practice', label: 'Medical Practice' },
    { value: 'home_services', label: 'Home Services' },
    { value: 'other', label: 'Other' },
  ];

  const createAssistantMutation = useMutation({
    mutationFn: async (data: { botId: string; clientId: string; name: string; businessType: string }) => {
      const response = await apiRequest("POST", "/api/super-admin/bots", {
        botId: data.botId,
        clientId: data.clientId,
        name: data.name,
        description: `AI assistant for ${data.name}`,
        businessProfile: {
          businessName: data.name,
          type: data.businessType,
        },
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create assistant");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Assistant Created", description: "The new assistant has been created successfully." });
      setShowCreateAssistantModal(false);
      setNewAssistantForm({ botId: '', name: '', businessType: 'auto_repair' });
      queryClient.invalidateQueries({ queryKey: ["/api/super-admin/workspaces", slug] });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const createUserMutation = useMutation({
    mutationFn: async (data: { workspaceId: string; email: string; password: string }) => {
      const response = await apiRequest("POST", `/api/super-admin/workspaces/${data.workspaceId}/users`, {
        email: data.email,
        password: data.password,
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create user");
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast({ 
        title: "Login Created", 
        description: `Login created for ${data.user?.email || 'the user'}. They will be prompted to change their password on first login.` 
      });
      setShowInviteUserModal(false);
      setNewUserForm({ email: '', password: '' });
      setUserFormTouched({ email: false, password: false });
      setUserFormErrors({});
      // Invalidate the users query to refresh the list
      queryClient.invalidateQueries({ queryKey: ["/api/super-admin/workspaces", slug, "users"] });
    },
    onError: (error: Error) => {
      toast({ title: "Could not create login", description: error.message, variant: "destructive" });
    },
  });

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

  const { data: clientAppointments, isLoading: clientAppointmentsLoading } = useQuery<{
    appointments: Array<{
      id: string;
      name: string;
      contact?: string;
      email?: string;
      appointmentType: string;
      preferredTime: string;
      scheduledAt?: string | null;
      status: string;
      notes?: string;
      createdAt: string;
    }>;
    total: number;
  }>({
    queryKey: ["/api/super-admin/workspaces", slug, "appointments"],
    queryFn: async () => {
      const response = await fetch(`/api/super-admin/workspaces/${slug}/appointments`, { credentials: "include" });
      if (!response.ok) return { appointments: [], total: 0 };
      return response.json();
    },
    enabled: !!slug && activeTab === 'bookings',
  });

  const { data: workspaceUsers, isLoading: usersLoading } = useQuery<Array<{
    id: number;
    email: string;
    role: string;
    createdAt?: string;
  }>>({
    queryKey: ["/api/super-admin/workspaces", slug, "users"],
    queryFn: async () => {
      const response = await fetch(`/api/super-admin/workspaces/${slug}/users`, { credentials: "include" });
      if (!response.ok) return [];
      const data = await response.json();
      return data.users || [];
    },
    enabled: !!slug && activeTab === 'users',
  });

  const updateWorkspaceMutation = useMutation({
    mutationFn: async (data: { plan?: string; status?: string; name?: string }) => {
      const response = await apiRequest("PATCH", `/api/super-admin/workspaces/${slug}`, data);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update workspace");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/super-admin/workspaces", slug] });
      queryClient.invalidateQueries({ queryKey: ["/api/super-admin/workspaces"] });
      toast({ title: "Updated", description: "Workspace updated successfully." });
      setShowEditNameModal(false);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message || "Failed to update workspace.", variant: "destructive" });
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

  const resetDemoMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/admin/demo/faith-house/reset");
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to reset demo data");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Demo Reset", description: "Faith House demo data has been reset successfully." });
      queryClient.invalidateQueries({ queryKey: ["/api/super-admin/workspaces", slug] });
      queryClient.invalidateQueries({ queryKey: ["/api/super-admin/workspaces", slug, "leads"] });
      queryClient.invalidateQueries({ queryKey: ["/api/super-admin/workspaces", slug, "conversations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/super-admin/workspaces", slug, "appointments"] });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
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
    { value: 'bookings', label: 'Bookings', icon: Clock },
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
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-semibold text-white">{workspaceData.name}</h1>
                  {workspaceData.isDemo && (
                    <Badge className="text-[10px] px-1.5 bg-amber-500/20 text-amber-400 border-amber-500/30" data-testid="badge-demo-workspace-detail">
                      <TestTube2 className="h-2.5 w-2.5 mr-1" />
                      DEMO
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-white/55">{workspaceData.slug} • {workspaceData.plan.charAt(0).toUpperCase() + workspaceData.plan.slice(1)} Plan</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {workspaceData.isDemo && (
              <Button
                variant="outline"
                size="sm"
                className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
                data-testid="button-open-demo-dashboard"
                onClick={() => window.open(`/client/dashboard?impersonate=${workspaceData.slug}`, '_blank')}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Open Demo Dashboard
              </Button>
            )}
            <Badge className={`${
              workspaceData.status === 'active' ? "bg-green-500/20 text-green-400" :
              workspaceData.status === 'paused' ? "bg-amber-500/20 text-amber-400" :
              "bg-red-500/20 text-red-400"
            }`}>
              {workspaceData.status.charAt(0).toUpperCase() + workspaceData.status.slice(1)}
            </Badge>
          </div>
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
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">Assistants</h3>
                <Button 
                  onClick={() => setShowCreateAssistantModal(true)}
                  className="bg-cyan-500 hover:bg-cyan-600 text-white"
                  data-testid="button-create-assistant"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New Assistant
                </Button>
              </div>
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

          {/* Bookings Tab */}
          {activeTab === 'bookings' && (
            <div className="space-y-4">
              {clientAppointmentsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="h-8 w-8 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin" />
                </div>
              ) : (clientAppointments?.appointments?.length || 0) > 0 ? (
                <div className="space-y-3">
                  {clientAppointments?.appointments.map(apt => (
                    <GlassCard key={apt.id} className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-white font-medium text-sm">{apt.name}</p>
                            <Badge className={`text-xs ${
                              apt.appointmentType === 'tour' ? 'bg-purple-500/20 text-purple-400' :
                              apt.appointmentType === 'phone_call' ? 'bg-blue-500/20 text-blue-400' :
                              'bg-white/10 text-white/55'
                            }`}>
                              {apt.appointmentType === 'phone_call' ? 'Phone Call' : apt.appointmentType.charAt(0).toUpperCase() + apt.appointmentType.slice(1)}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-white/55 mt-1">
                            {apt.contact && <span>{apt.contact}</span>}
                            {apt.email && <span>{apt.email}</span>}
                          </div>
                          <p className="text-xs text-white/70 mt-2">
                            <Clock className="h-3 w-3 inline mr-1" />
                            {formatAppointmentTime(apt)}
                          </p>
                          {apt.notes && <p className="text-xs text-white/40 mt-1">{apt.notes}</p>}
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <Badge className={`text-xs ${
                            apt.status === 'new' ? 'bg-cyan-500/20 text-cyan-400' :
                            apt.status === 'contacted' ? 'bg-amber-500/20 text-amber-400' :
                            apt.status === 'scheduled' ? 'bg-purple-500/20 text-purple-400' :
                            apt.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                            'bg-white/10 text-white/55'
                          }`}>
                            {apt.status.charAt(0).toUpperCase() + apt.status.slice(1)}
                          </Badge>
                          <span className="text-xs text-white/40">{new Date(apt.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </GlassCard>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Clock className="h-12 w-12 text-white/20 mx-auto mb-3" />
                  <p className="text-white/55">No bookings yet</p>
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
                  onClick={() => setShowInviteUserModal(true)}
                  data-testid="button-invite-user"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Create Login
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
                              {user.email?.slice(0, 2).toUpperCase() || '??'}
                            </span>
                          </div>
                          <div>
                            <p className="text-white font-medium text-sm">{user.email}</p>
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
                      onClick={() => window.open(`/client/dashboard?clientId=${workspaceData.slug}`, '_blank')}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View as Client
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-white/10 text-white/70 hover:bg-white/10"
                      onClick={() => {
                        setEditNameValue(workspaceData.name);
                        setShowEditNameModal(true);
                      }}
                      data-testid="button-edit-workspace-name"
                    >
                      <Edit2 className="h-4 w-4 mr-2" />
                      Edit Name
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
                    {/* Reset Demo Data - Only for faith_house_demo workspace */}
                    {workspaceData.isDemo && workspaceData.slug === 'faith_house_demo' && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
                        disabled={resetDemoMutation.isPending}
                        onClick={() => {
                          if (confirm("This will reset all conversations, leads, bookings, and analytics for the Faith House DEMO workspace. Live data is NOT affected. Continue?")) {
                            resetDemoMutation.mutate();
                          }
                        }}
                        data-testid="button-reset-demo-data"
                      >
                        <RefreshCw className={`h-4 w-4 mr-2 ${resetDemoMutation.isPending ? 'animate-spin' : ''}`} />
                        {resetDemoMutation.isPending ? 'Resetting...' : 'Reset Demo Data'}
                      </Button>
                    )}
                  </div>
                </GlassCardContent>
              </GlassCard>
            </div>
          )}
        </div>
      </div>

      {/* Create Assistant Modal */}
      <Dialog open={showCreateAssistantModal} onOpenChange={setShowCreateAssistantModal}>
        <DialogContent className="bg-[#1a1d24] border-white/10 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Bot className="h-5 w-5 text-cyan-400" />
              Create New Assistant
            </DialogTitle>
            <DialogDescription className="text-white/55">
              Create a new AI assistant for {workspaceData?.name || 'this client'}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="assistant-id" className="text-white/70">Assistant ID</Label>
              <Input
                id="assistant-id"
                value={newAssistantForm.botId}
                onChange={(e) => setNewAssistantForm(prev => ({ 
                  ...prev, 
                  botId: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_')
                }))}
                placeholder="e.g., sunset_coffee_bot"
                className="bg-white/5 border-white/10 text-white"
                data-testid="input-assistant-id"
              />
              <p className="text-xs text-white/40">Unique identifier (lowercase, underscores allowed)</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="assistant-name" className="text-white/70">Display Name</Label>
              <Input
                id="assistant-name"
                value={newAssistantForm.name}
                onChange={(e) => setNewAssistantForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Sunset Coffee Assistant"
                className="bg-white/5 border-white/10 text-white"
                data-testid="input-assistant-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="business-type" className="text-white/70">Business Type</Label>
              <Select 
                value={newAssistantForm.businessType} 
                onValueChange={(value) => setNewAssistantForm(prev => ({ ...prev, businessType: value }))}
              >
                <SelectTrigger className="bg-white/5 border-white/10 text-white" data-testid="select-business-type">
                  <SelectValue placeholder="Select business type" />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1d24] border-white/10">
                  {businessTypes.map(type => (
                    <SelectItem key={type.value} value={type.value} className="text-white hover:bg-white/10">
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="ghost" 
              onClick={() => setShowCreateAssistantModal(false)}
              className="text-white/70"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!newAssistantForm.botId || !newAssistantForm.name || !workspaceData?.slug) {
                  toast({ title: "Error", description: "Please fill in all fields.", variant: "destructive" });
                  return;
                }
                createAssistantMutation.mutate({
                  botId: newAssistantForm.botId,
                  clientId: workspaceData.slug,
                  name: newAssistantForm.name,
                  businessType: newAssistantForm.businessType,
                });
              }}
              disabled={!newAssistantForm.botId || !newAssistantForm.name || createAssistantMutation.isPending}
              className="bg-cyan-500 hover:bg-cyan-600 text-white"
              data-testid="button-confirm-create-assistant"
            >
              {createAssistantMutation.isPending ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Assistant
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create User Login Modal */}
      <Dialog open={showInviteUserModal} onOpenChange={setShowInviteUserModal}>
        <DialogContent className="bg-[#1a1d24] border-white/10 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-cyan-400" />
              Create Client Login
            </DialogTitle>
            <DialogDescription className="text-white/55">
              Create login credentials for {workspaceData?.name || 'this client'} to access their dashboard.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="user-email" className="text-white/70">Email Address *</Label>
              <Input
                id="user-email"
                type="email"
                value={newUserForm.email}
                onChange={(e) => {
                  const email = e.target.value;
                  setNewUserForm(prev => ({ ...prev, email }));
                  if (userFormTouched.email) {
                    let error: string | undefined;
                    if (!email.trim()) {
                      error = 'Email is required';
                    } else if (!isValidEmail(email)) {
                      error = 'Please enter a valid email address';
                    }
                    setUserFormErrors(prev => ({ ...prev, email: error }));
                  }
                }}
                onBlur={() => {
                  setUserFormTouched(prev => ({ ...prev, email: true }));
                  let error: string | undefined;
                  if (!newUserForm.email.trim()) {
                    error = 'Email is required';
                  } else if (!isValidEmail(newUserForm.email)) {
                    error = 'Please enter a valid email address';
                  }
                  setUserFormErrors(prev => ({ ...prev, email: error }));
                }}
                placeholder="client@example.com"
                className={`bg-white/5 text-white ${userFormTouched.email && userFormErrors.email ? 'border-red-500/50' : 'border-white/10'}`}
                data-testid="input-user-email"
              />
              {userFormTouched.email && userFormErrors.email && (
                <p className="text-xs text-red-400">{userFormErrors.email}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="user-password" className="text-white/70">Password *</Label>
              <Input
                id="user-password"
                type="password"
                value={newUserForm.password}
                onChange={(e) => {
                  const password = e.target.value;
                  setNewUserForm(prev => ({ ...prev, password }));
                  if (userFormTouched.password) {
                    let error: string | undefined;
                    if (!password) {
                      error = 'Password is required';
                    } else if (!isValidPassword(password)) {
                      error = 'Password must be at least 8 characters with letters and numbers';
                    }
                    setUserFormErrors(prev => ({ ...prev, password: error }));
                  }
                }}
                onBlur={() => {
                  setUserFormTouched(prev => ({ ...prev, password: true }));
                  let error: string | undefined;
                  if (!newUserForm.password) {
                    error = 'Password is required';
                  } else if (!isValidPassword(newUserForm.password)) {
                    error = 'Password must be at least 8 characters with letters and numbers';
                  }
                  setUserFormErrors(prev => ({ ...prev, password: error }));
                }}
                placeholder="Min 8 chars with letters and numbers"
                className={`bg-white/5 text-white ${userFormTouched.password && userFormErrors.password ? 'border-red-500/50' : 'border-white/10'}`}
                data-testid="input-user-password"
              />
              {userFormTouched.password && userFormErrors.password && (
                <p className="text-xs text-red-400">{userFormErrors.password}</p>
              )}
              {!userFormErrors.password && (
                <p className="text-xs text-white/40">Password must be at least 8 characters with letters and numbers</p>
              )}
            </div>
          </div>

          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 mb-4">
            <p className="text-amber-200/80 text-sm">
              <strong className="text-amber-400">Note:</strong> The client will be able to log in at <code className="bg-black/30 px-1 rounded">/login</code> and view their dashboard with conversations and leads.
            </p>
          </div>

          <DialogFooter>
            <Button 
              variant="ghost" 
              onClick={() => {
                setShowInviteUserModal(false);
                setNewUserForm({ email: '', password: '' });
                setUserFormTouched({ email: false, password: false });
                setUserFormErrors({});
              }}
              className="text-white/70"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                // Validate all fields on submit
                const errors = validateUserForm();
                setUserFormErrors(errors);
                setUserFormTouched({ email: true, password: true });
                
                if (Object.keys(errors).length > 0) {
                  return; // Don't submit if there are errors
                }
                
                if (!workspaceData?.id) {
                  toast({ title: "Error", description: "Workspace not found.", variant: "destructive" });
                  return;
                }
                
                createUserMutation.mutate({
                  workspaceId: workspaceData.id,
                  email: newUserForm.email,
                  password: newUserForm.password,
                });
              }}
              disabled={createUserMutation.isPending}
              className="bg-cyan-500 hover:bg-cyan-600 text-white"
              data-testid="button-confirm-create-user"
            >
              {createUserMutation.isPending ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Create Login
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Workspace Name Modal */}
      <Dialog open={showEditNameModal} onOpenChange={setShowEditNameModal}>
        <DialogContent className="bg-[#1a1d24] border-white/10 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Edit2 className="h-5 w-5 text-cyan-400" />
              Edit Workspace Name
            </DialogTitle>
            <DialogDescription className="text-white/55">
              Update the business name for this workspace.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="workspace-name" className="text-white/70">Business Name *</Label>
              <Input
                id="workspace-name"
                value={editNameValue}
                onChange={(e) => setEditNameValue(e.target.value)}
                placeholder="Enter business name"
                className="bg-white/5 border-white/10 text-white"
                data-testid="input-edit-workspace-name"
              />
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="ghost" 
              onClick={() => setShowEditNameModal(false)}
              className="text-white/70"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!editNameValue.trim()) {
                  toast({ title: "Error", description: "Business name is required.", variant: "destructive" });
                  return;
                }
                updateWorkspaceMutation.mutate({ name: editNameValue.trim() });
              }}
              disabled={!editNameValue.trim() || updateWorkspaceMutation.isPending}
              className="bg-cyan-500 hover:bg-cyan-600 text-white"
              data-testid="button-save-workspace-name"
            >
              {updateWorkspaceMutation.isPending ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { GlassCard, GlassCardHeader, GlassCardTitle, GlassCardDescription, GlassCardContent } from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  Bot, Users, FileText, Settings, BarChart3, MessageSquare, 
  Plus, Play, Pause, Eye, Edit2, Save, X, LogOut, Zap, 
  AlertTriangle, Phone, Mail, Globe, MapPin, Clock, Trash2,
  ChevronRight, Search, CreditCard, ExternalLink, Building2, Code, Copy, Check,
  TrendingUp, Users2, AlertCircle, Activity, RefreshCw, Download, Layers,
  Shield, FileWarning, CheckCircle2, XCircle, Filter, Calendar, UserPlus,
  MoreVertical, Workflow, Palette, ChevronDown
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface Client {
  id: string;
  name: string;
  type?: string;
  status: 'active' | 'paused' | 'demo';
  bots: string[];
}

interface BotConfig {
  botId: string;
  clientId: string;
  name: string;
  description: string;
  metadata?: {
    isDemo?: boolean;
    isTemplate?: boolean;
    templateCategory?: string;
    clonedFrom?: string;
    createdAt?: string;
    version?: string;
  };
  businessProfile: {
    businessName: string;
    type: string;
    phone?: string;
    email?: string;
    website?: string;
    location?: string;
    hours?: Record<string, string>;
    services?: string[];
    amenities?: string[];
    serviceArea?: string;
    cuisine?: string;
    membershipOptions?: string[];
    booking?: {
      onlineBookingUrl?: string;
      walkInsWelcome?: boolean;
      walkInsNote?: string;
    };
  };
  rules?: {
    allowedTopics?: string[];
    forbiddenTopics?: string[];
    specialInstructions?: string[];
    crisisHandling?: {
      onCrisisKeywords?: string[];
      responseTemplate?: string;
    };
  };
  systemPrompt?: string;
  faqs?: Array<{ question: string; answer: string }>;
}

interface Template extends BotConfig {
  metadata: NonNullable<BotConfig['metadata']> & {
    isTemplate: true;
    templateCategory: string;
  };
}

interface AuthUser {
  id: string;
  username: string;
  role: 'super_admin' | 'client_admin';
  clientId?: string;
}

function formatHoursForDisplay(hours?: Record<string, string>): string {
  if (!hours) return '';
  return Object.entries(hours)
    .map(([day, time]) => `${day.charAt(0).toUpperCase() + day.slice(1)}: ${time}`)
    .join('\n');
}

function parseHoursFromString(hoursStr: string): Record<string, string> {
  const result: Record<string, string> = {};
  if (!hoursStr) return result;
  const lines = hoursStr.split('\n').map(s => s.trim()).filter(Boolean);
  for (const line of lines) {
    const colonIdx = line.indexOf(':');
    if (colonIdx > 0) {
      const day = line.substring(0, colonIdx).trim().toLowerCase();
      const time = line.substring(colonIdx + 1).trim();
      if (day && time) result[day] = time;
    }
  }
  return result;
}

const BUSINESS_TYPES = [
  { value: 'restaurant', label: 'Restaurant' },
  { value: 'barber', label: 'Barber / Salon' },
  { value: 'auto', label: 'Auto Shop' },
  { value: 'home_services', label: 'Home Services' },
  { value: 'gym', label: 'Gym / Fitness' },
  { value: 'sober_living', label: 'Sober Living' },
  { value: 'real_estate', label: 'Real Estate' },
  { value: 'med_spa', label: 'Med Spa' },
  { value: 'tattoo', label: 'Tattoo Studio' },
];

export default function ControlCenter() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [selectedBotId, setSelectedBotId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [dashboardSection, setDashboardSection] = useState<'overview' | 'workspaces' | 'analytics' | 'logs' | 'users'>('overview');
  const [logFilters, setLogFilters] = useState({ level: 'all', source: '', isResolved: 'all' });
  const [analyticsRange, setAnalyticsRange] = useState<number>(7);
  const [selectedBots, setSelectedBots] = useState<Set<string>>(new Set());
  const [workspaceSearch, setWorkspaceSearch] = useState('');
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [newUserForm, setNewUserForm] = useState({ username: '', password: '', role: 'client_admin' as 'super_admin' | 'client_admin', clientId: '' });
  const [editingUser, setEditingUser] = useState<{ id: string; username: string; role: string } | null>(null);
  const [showCreateWorkspaceModal, setShowCreateWorkspaceModal] = useState(false);
  const [newWorkspaceForm, setNewWorkspaceForm] = useState({ name: '', slug: '', ownerId: '', plan: 'starter' });
  const [editingWorkspace, setEditingWorkspace] = useState<{ slug: string; name: string; plan: string; ownerId?: string } | null>(null);

  const { data: currentUser, isLoading: authLoading } = useQuery<AuthUser>({
    queryKey: ["/api/auth/me"],
    queryFn: async () => {
      const response = await fetch("/api/auth/me", { credentials: "include" });
      if (!response.ok) throw new Error("Not authenticated");
      return response.json();
    },
    retry: false,
  });

  useEffect(() => {
    if (!authLoading && !currentUser) {
      setLocation("/login");
    } else if (currentUser && currentUser.role !== "super_admin") {
      toast({
        title: "Access Denied",
        description: "You don't have permission to access this page.",
        variant: "destructive",
      });
      setLocation("/admin/dashboard");
    }
  }, [currentUser, authLoading, setLocation, toast]);

  // Fetch ALL bots
  const { data: allBots = [] } = useQuery<BotConfig[]>({
    queryKey: ["/api/super-admin/bots"],
    enabled: currentUser?.role === "super_admin",
  });

  // Fetch clients for reference
  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ["/api/super-admin/clients"],
    enabled: currentUser?.role === "super_admin",
  });

  // Fetch templates
  const { data: templates = [] } = useQuery<Template[]>({
    queryKey: ["/api/super-admin/templates"],
    enabled: currentUser?.role === "super_admin",
  });

  // Global Analytics
  const { data: globalAnalytics, isLoading: analyticsLoading } = useQuery<{
    summary: {
      totalConversations: number;
      totalMessages: number;
      totalLeads: number;
      totalAppointments: number;
      activeWorkspaces: number;
      totalBots: number;
    };
    dailyTrends: Array<{ date: string; conversations: number; leads: number; appointments: number }>;
    dateRange: { start: string; end: string; days: number };
  }>({
    queryKey: ["/api/super-admin/analytics/global", { days: analyticsRange }],
    queryFn: async () => {
      const response = await fetch(`/api/super-admin/analytics/global?days=${analyticsRange}`, { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch analytics");
      return response.json();
    },
    enabled: currentUser?.role === "super_admin",
    refetchInterval: 60000,
  });

  // System Status
  const { data: systemStatus, isLoading: statusLoading } = useQuery<{
    status: 'operational' | 'degraded' | 'incident';
    errorCount: number;
    lastError?: { message: string; createdAt: string };
  }>({
    queryKey: ["/api/super-admin/system/status"],
    enabled: currentUser?.role === "super_admin",
    refetchInterval: 30000,
  });

  // Workspaces List  
  const { data: workspacesData, isLoading: workspacesLoading } = useQuery<{
    workspaces: Array<{
      id: string;
      name: string;
      slug: string;
      status: string;
      plan: string;
      botsCount: number;
      totalConversations: number;
      lastActive: string | null;
    }>;
    total: number;
  }>({
    queryKey: ["/api/super-admin/workspaces"],
    enabled: currentUser?.role === "super_admin",
  });

  // System Logs
  const { data: systemLogs, isLoading: logsLoading, refetch: refetchLogs } = useQuery<{
    logs: Array<{
      id: string;
      level: string;
      source: string;
      message: string;
      metadata?: any;
      stack?: string;
      workspaceId?: string;
      clientId?: string;
      isResolved: boolean;
      resolvedAt?: string;
      resolvedBy?: string;
      resolutionNotes?: string;
      createdAt: string;
    }>;
    total: number;
    unresolved: number;
  }>({
    queryKey: ["/api/super-admin/system/logs", logFilters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (logFilters.level && logFilters.level !== 'all') params.append('level', logFilters.level);
      if (logFilters.source) params.append('source', logFilters.source);
      if (logFilters.isResolved && logFilters.isResolved !== 'all') params.append('isResolved', logFilters.isResolved);
      params.append('limit', '50');
      const response = await fetch(`/api/super-admin/system/logs?${params}`, { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch logs");
      return response.json();
    },
    enabled: currentUser?.role === "super_admin" && dashboardSection === 'logs',
  });

  // Admin Users (needed for both users section and workspace owner selection)
  const { data: adminUsers, isLoading: usersLoading } = useQuery<Array<{
    id: number;
    username: string;
    role: string;
    clientId?: string;
    createdAt?: string;
  }>>({
    queryKey: ["/api/super-admin/users"],
    enabled: currentUser?.role === "super_admin" && (dashboardSection === 'users' || dashboardSection === 'workspaces'),
  });
  
  // Recent Activity Feed
  const { data: recentActivity, isLoading: activityLoading } = useQuery<{
    activities: Array<{
      type: 'conversation' | 'lead' | 'session';
      clientId: string;
      botId: string;
      botName: string;
      details: any;
      timestamp: string;
    }>;
    total: number;
  }>({
    queryKey: ["/api/super-admin/analytics/recent-activity"],
    enabled: currentUser?.role === "super_admin" && dashboardSection === 'analytics',
    refetchInterval: 30000,
  });

  // Filter out pure template bots - show real client bots AND demo bots
  // Demo bots have isDemo=true and should be visible for preview/management
  const clientBots = allBots.filter(bot => !bot.metadata?.isTemplate || bot.metadata?.isDemo);

  // Get selected bot
  const selectedBot = clientBots.find(b => b.botId === selectedBotId);
  const selectedClient = selectedBot ? clients.find(c => c.id === selectedBot.clientId) : null;

  // Filter bots by search
  const filteredBots = clientBots.filter(bot => 
    bot.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    bot.botId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    bot.businessProfile?.businessName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const updateStatusMutation = useMutation({
    mutationFn: async ({ clientId, status }: { clientId: string; status: string }) => {
      const response = await apiRequest("PUT", `/api/super-admin/clients/${clientId}/status`, { status });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/super-admin/clients"] });
      toast({ title: "Status Updated", description: "Client status has been updated." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update status.", variant: "destructive" });
    },
  });

  // Resolve system log mutation
  const resolveLogMutation = useMutation({
    mutationFn: async ({ logId, notes }: { logId: string; notes?: string }) => {
      const response = await apiRequest("POST", `/api/super-admin/system/logs/${logId}/resolve`, { notes });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/super-admin/system/logs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/super-admin/system/status"] });
      toast({ title: "Log Resolved", description: "The log entry has been marked as resolved." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to resolve log.", variant: "destructive" });
    },
  });

  // Delete bot mutation
  const deleteBotMutation = useMutation({
    mutationFn: async (botId: string) => {
      const response = await apiRequest("DELETE", `/api/super-admin/bots/${botId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/super-admin/bots"] });
      queryClient.invalidateQueries({ queryKey: ["/api/super-admin/clients"] });
      setSelectedBotId(null);
      toast({ title: "Bot Deleted", description: "The chatbot has been permanently deleted." });
    },
  });
  
  // Update workspace status
  const updateWorkspaceStatusMutation = useMutation({
    mutationFn: async ({ slug, status }: { slug: string; status: string }) => {
      const response = await apiRequest("PATCH", `/api/super-admin/workspaces/${slug}/status`, { status });
      return response.json();
    },
    onSuccess: async () => {
      await queryClient.refetchQueries({ queryKey: ["/api/super-admin/workspaces"] });
      toast({ title: "Workspace Updated", description: "Workspace status has been updated." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update workspace status.", variant: "destructive" });
    },
  });

  // Bulk status update mutation
  const bulkStatusMutation = useMutation({
    mutationFn: async ({ botIds, status }: { botIds: string[]; status: string }) => {
      const promises = botIds.map(async (botId) => {
        const bot = clientBots.find(b => b.botId === botId);
        if (bot) {
          return apiRequest("PUT", `/api/super-admin/clients/${bot.clientId}/status`, { status });
        }
      });
      await Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/super-admin/clients"] });
      setSelectedBots(new Set());
      toast({ title: "Bulk Update Complete", description: "Selected bots have been updated." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update some bots.", variant: "destructive" });
    },
  });

  // User CRUD mutations
  const createUserMutation = useMutation({
    mutationFn: async (data: { username: string; password: string; role: string; clientId?: string }) => {
      const response = await apiRequest("POST", "/api/super-admin/users", data);
      return response.json();
    },
    onSuccess: async () => {
      await queryClient.refetchQueries({ queryKey: ["/api/super-admin/users"] });
      setShowCreateUserModal(false);
      setNewUserForm({ username: '', password: '', role: 'client_admin', clientId: '' });
      toast({ title: "User Created", description: "New admin user has been created successfully." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to create user.", variant: "destructive" });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id: string; role?: string; password?: string }) => {
      const response = await apiRequest("PATCH", `/api/super-admin/users/${id}`, data);
      return response.json();
    },
    onSuccess: async () => {
      await queryClient.refetchQueries({ queryKey: ["/api/super-admin/users"] });
      setEditingUser(null);
      toast({ title: "User Updated", description: "User has been updated successfully." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update user.", variant: "destructive" });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await apiRequest("DELETE", `/api/super-admin/users/${userId}`);
      return response.json();
    },
    onSuccess: async () => {
      await queryClient.refetchQueries({ queryKey: ["/api/super-admin/users"] });
      toast({ title: "User Deleted", description: "Admin user has been deleted successfully." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to delete user.", variant: "destructive" });
    },
  });

  // Workspace CRUD mutations
  const createWorkspaceMutation = useMutation({
    mutationFn: async (data: { name: string; slug: string; ownerId: string; plan?: string }) => {
      const response = await apiRequest("POST", "/api/super-admin/workspaces", data);
      return response.json();
    },
    onSuccess: async () => {
      await queryClient.refetchQueries({ queryKey: ["/api/super-admin/workspaces"] });
      setShowCreateWorkspaceModal(false);
      setNewWorkspaceForm({ name: '', slug: '', ownerId: '', plan: 'starter' });
      toast({ title: "Workspace Created", description: "New workspace has been created successfully." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to create workspace.", variant: "destructive" });
    },
  });

  const updateWorkspaceMutation = useMutation({
    mutationFn: async ({ slug, ...data }: { slug: string; name?: string; ownerId?: string; plan?: string }) => {
      const response = await apiRequest("PATCH", `/api/super-admin/workspaces/${slug}`, data);
      return response.json();
    },
    onSuccess: async () => {
      await queryClient.refetchQueries({ queryKey: ["/api/super-admin/workspaces"] });
      setEditingWorkspace(null);
      toast({ title: "Workspace Updated", description: "Workspace has been updated successfully." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update workspace.", variant: "destructive" });
    },
  });

  const deleteWorkspaceMutation = useMutation({
    mutationFn: async (slug: string) => {
      const response = await apiRequest("DELETE", `/api/super-admin/workspaces/${slug}`);
      return response.json();
    },
    onSuccess: async () => {
      await queryClient.refetchQueries({ queryKey: ["/api/super-admin/workspaces"] });
      toast({ title: "Workspace Deleted", description: "Workspace and its bots have been deleted." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to delete workspace.", variant: "destructive" });
    },
  });

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    setLocation("/login");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge data-testid="badge-status-active" className="bg-green-500/20 text-green-400 border-green-500/30">ACTIVE</Badge>;
      case 'paused':
        return <Badge data-testid="badge-status-paused" className="bg-red-500/20 text-red-400 border-red-500/30">PAUSED</Badge>;
      case 'demo':
        return <Badge data-testid="badge-status-demo" className="bg-blue-500/20 text-blue-400 border-blue-500/30">DEMO</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getBusinessTypeLabel = (type?: string) => {
    return BUSINESS_TYPES.find(t => t.value === type)?.label || type || 'Unknown';
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0B0E13] flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin mx-auto mb-3" />
          <div className="text-white/55">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-[#0B0E13] text-white flex flex-col overflow-hidden">
      {/* Header */}
      <header className="h-14 border-b border-white/10 bg-white/5 backdrop-blur-md flex items-center justify-between px-6 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center">
            <Zap className="h-4 w-4 text-white" />
          </div>
          <span className="font-semibold text-lg text-white">Treasure Coast AI – Control Center</span>
        </div>
        <div className="flex items-center gap-4">
          <Badge 
            data-testid="badge-system-status"
            className={
              systemStatus?.status === 'operational' ? "bg-green-500/20 text-green-400 border border-green-500/30" :
              systemStatus?.status === 'degraded' ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" :
              "bg-red-500/20 text-red-400 border border-red-500/30"
            }
          >
            {statusLoading ? 'Checking...' : 
             systemStatus?.status === 'operational' ? 'All Systems Operational' :
             systemStatus?.status === 'degraded' ? `${systemStatus.errorCount} Warnings` :
             `System Incident (${systemStatus?.errorCount || 0} Errors)`}
          </Badge>
          <span className="text-sm text-white/55">{currentUser?.username}</span>
          <Button data-testid="button-logout" variant="ghost" size="icon" onClick={handleLogout} className="text-white/85 hover:bg-white/10 hover:text-white">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Left Sidebar - Bot Navigation */}
        <aside className="w-72 border-r border-white/10 bg-white/5 flex flex-col flex-shrink-0">
          <div className="p-4 border-b border-white/10">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
              <Input
                data-testid="input-search-bots"
                placeholder="Search bots..."
                className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-white/40"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-3">
              <p className="text-xs font-medium text-white/55 uppercase tracking-wide px-2 mb-2">
                Chatbots ({filteredBots.length}{searchQuery ? ` of ${clientBots.length}` : ''})
              </p>
              {filteredBots.length === 0 ? (
                <div className="text-center py-8">
                  <Bot className="h-8 w-8 mx-auto mb-2 text-white/30" />
                  <p className="text-sm text-white/40">No bots found</p>
                </div>
              ) : (
                filteredBots.map(bot => {
                  const client = clients.find(c => c.id === bot.clientId);
                  const isSelected = selectedBotId === bot.botId;
                  return (
                    <button
                      key={bot.botId}
                      data-testid={`button-bot-${bot.botId}`}
                      onClick={() => {
                        setSelectedBotId(bot.botId);
                        setActiveTab('overview');
                      }}
                      className={`w-full text-left p-3 rounded-lg mb-1 transition-colors ${
                        isSelected 
                          ? 'bg-cyan-500/10 border border-cyan-400/30' 
                          : 'hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          isSelected ? 'bg-cyan-500/20' : 'bg-white/10'
                        }`}>
                          <Building2 className={`h-4 w-4 ${isSelected ? 'text-cyan-400' : 'text-white/55'}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm text-white leading-tight">
                            {bot.name || bot.businessProfile?.businessName}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-white/55">
                              {getBusinessTypeLabel(bot.businessProfile?.type)}
                            </span>
                            {client && (
                              <span className={`text-xs px-1.5 py-0.5 rounded ${
                                client.status === 'active' ? 'bg-green-500/20 text-green-400' :
                                client.status === 'demo' ? 'bg-blue-500/20 text-blue-400' :
                                'bg-amber-500/20 text-amber-400'
                              }`}>
                                {client.status}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </ScrollArea>

          <Separator className="bg-white/10" />

          {/* Quick Actions */}
          <div className="p-3">
            <Button 
              data-testid="button-add-bot"
              variant="outline"
              className="w-full justify-start border-white/10 text-white/85 hover:bg-white/10 hover:text-white"
              onClick={() => setShowCreateModal(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add New Bot
            </Button>
          </div>
        </aside>

        {/* Main Content Area - Split pane: Dashboard Grid + Detail Panel */}
        <div className="flex-1 flex overflow-hidden h-full">
          {/* Dashboard Grid - Always visible with independent scroll */}
          <main className={`flex-1 overflow-y-auto transition-all duration-300 h-full ${selectedBot ? 'lg:min-w-[50%] lg:max-w-[60%]' : 'w-full'}`}>
            <div className="p-6">
              {/* Dashboard Header */}
              <div className="mb-8">
                <h1 className="text-2xl font-bold text-white">Dashboard Overview</h1>
                <p className="text-white/55 mt-1">
                  {searchQuery 
                    ? `Showing ${filteredBots.length} of ${clientBots.length} bots matching "${searchQuery}"`
                    : 'Select a chatbot to manage it, or view platform statistics below.'}
                </p>
              </div>

              {/* Quick Actions Bar */}
              <div className="flex items-center gap-3 mb-6 flex-wrap">
                <Button
                  data-testid="button-section-overview"
                  variant={dashboardSection === 'overview' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setDashboardSection('overview')}
                  className={dashboardSection === 'overview' ? 'bg-cyan-500/20 text-cyan-400 border-cyan-400/30' : 'border-white/10 text-white/85 hover:bg-white/10'}
                >
                  <Layers className="h-4 w-4 mr-2" />
                  Overview
                </Button>
                <Button
                  data-testid="button-section-workspaces"
                  variant={dashboardSection === 'workspaces' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setDashboardSection('workspaces')}
                  className={dashboardSection === 'workspaces' ? 'bg-cyan-500/20 text-cyan-400 border-cyan-400/30' : 'border-white/10 text-white/85 hover:bg-white/10'}
                >
                  <Users2 className="h-4 w-4 mr-2" />
                  Workspaces ({workspacesData?.total || 0})
                </Button>
                <Button
                  data-testid="button-section-analytics"
                  variant={dashboardSection === 'analytics' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setDashboardSection('analytics')}
                  className={dashboardSection === 'analytics' ? 'bg-cyan-500/20 text-cyan-400 border-cyan-400/30' : 'border-white/10 text-white/85 hover:bg-white/10'}
                >
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Analytics
                </Button>
                <Button
                  data-testid="button-section-logs"
                  variant={dashboardSection === 'logs' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setDashboardSection('logs')}
                  className={dashboardSection === 'logs' ? 'bg-cyan-500/20 text-cyan-400 border-cyan-400/30' : 'border-white/10 text-white/85 hover:bg-white/10'}
                >
                  <FileWarning className="h-4 w-4 mr-2" />
                  Logs {systemStatus?.errorCount ? `(${systemStatus.errorCount})` : ''}
                </Button>
                <Button
                  data-testid="button-section-users"
                  variant={dashboardSection === 'users' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setDashboardSection('users')}
                  className={dashboardSection === 'users' ? 'bg-cyan-500/20 text-cyan-400 border-cyan-400/30' : 'border-white/10 text-white/85 hover:bg-white/10'}
                >
                  <Shield className="h-4 w-4 mr-2" />
                  Users
                </Button>
                <div className="flex-1" />
                <Button
                  data-testid="button-refresh-data"
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    queryClient.invalidateQueries({ queryKey: ["/api/super-admin/analytics/global"] });
                    queryClient.invalidateQueries({ queryKey: ["/api/super-admin/system/status"] });
                    queryClient.invalidateQueries({ queryKey: ["/api/super-admin/workspaces"] });
                  }}
                  className="text-white/55 hover:text-white hover:bg-white/10"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>

              {dashboardSection === 'overview' && (
              <>
              {/* Stats Overview - Shows filtered counts when search is active */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <GlassCard hover>
                  <GlassCardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-cyan-400/10 flex items-center justify-center">
                        <Bot className="h-5 w-5 text-cyan-400" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-white">{searchQuery ? filteredBots.length : clientBots.length}</p>
                        <p className="text-sm text-white/55">{searchQuery ? 'Matching' : 'Total Bots'}</p>
                      </div>
                    </div>
                  </GlassCardContent>
                </GlassCard>
                <GlassCard hover>
                  <GlassCardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                        <Play className="h-5 w-5 text-green-400" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-white">
                          {searchQuery 
                            ? filteredBots.filter(b => clients.find(c => c.id === b.clientId)?.status === 'active').length
                            : clients.filter(c => c.status === 'active').length}
                        </p>
                        <p className="text-sm text-white/55">Active</p>
                      </div>
                    </div>
                  </GlassCardContent>
                </GlassCard>
                <GlassCard hover>
                  <GlassCardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                        <Eye className="h-5 w-5 text-blue-400" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-white">
                          {searchQuery 
                            ? filteredBots.filter(b => b.metadata?.isDemo).length
                            : clientBots.filter(b => b.metadata?.isDemo).length}
                        </p>
                        <p className="text-sm text-white/55">Demo</p>
                      </div>
                    </div>
                  </GlassCardContent>
                </GlassCard>
                <GlassCard hover>
                  <GlassCardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                        <Pause className="h-5 w-5 text-amber-400" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-white">
                          {searchQuery 
                            ? filteredBots.filter(b => clients.find(c => c.id === b.clientId)?.status === 'paused').length
                            : clients.filter(c => c.status === 'paused').length}
                        </p>
                        <p className="text-sm text-white/55">Paused</p>
                      </div>
                    </div>
                  </GlassCardContent>
                </GlassCard>
              </div>

              {/* Bot Cards Grid with Bulk Actions */}
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white">All Chatbots</h2>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (selectedBots.size === filteredBots.length) {
                        setSelectedBots(new Set());
                      } else {
                        setSelectedBots(new Set(filteredBots.map(b => b.botId)));
                      }
                    }}
                    className="text-white/55 hover:text-white hover:bg-white/10"
                    data-testid="button-select-all"
                  >
                    {selectedBots.size === filteredBots.length && filteredBots.length > 0 ? 'Deselect All' : 'Select All'}
                  </Button>
                </div>
              </div>
              
              {/* Bulk Actions Toolbar - appears when bots are selected */}
              {selectedBots.size > 0 && (
                <div 
                  className="flex items-center gap-3 mb-4 p-3 rounded-lg bg-cyan-500/10 border border-cyan-400/30"
                  data-testid="toolbar-bulk-actions"
                >
                  <span className="text-sm text-white font-medium" data-testid="text-selected-count">{selectedBots.size} bot{selectedBots.size > 1 ? 's' : ''} selected</span>
                  <div className="flex items-center gap-2 ml-auto">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => bulkStatusMutation.mutate({ botIds: Array.from(selectedBots), status: 'active' })}
                      disabled={bulkStatusMutation.isPending}
                      className="border-green-500/30 text-green-400 hover:bg-green-500/10"
                      data-testid="button-bulk-activate"
                    >
                      <Check className="h-3 w-3 mr-1" />
                      Activate
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => bulkStatusMutation.mutate({ botIds: Array.from(selectedBots), status: 'paused' })}
                      disabled={bulkStatusMutation.isPending}
                      className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
                      data-testid="button-bulk-pause"
                    >
                      <Pause className="h-3 w-3 mr-1" />
                      Pause
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedBots(new Set())}
                      className="text-white/55 hover:text-white"
                      data-testid="button-bulk-clear"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
              
              <div className={`grid gap-4 ${selectedBot ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3'}`}>
                {filteredBots.map(bot => {
                  const client = clients.find(c => c.id === bot.clientId);
                  const isSelected = selectedBotId === bot.botId;
                  const isChecked = selectedBots.has(bot.botId);
                  return (
                    <GlassCard 
                      key={bot.botId}
                      data-testid={`card-bot-${bot.botId}`}
                      hover
                      className={`cursor-pointer transition-all ${
                        isSelected ? 'ring-2 ring-cyan-400 shadow-[0px_4px_30px_rgba(79,195,247,0.15)]' : ''
                      } ${isChecked ? 'bg-cyan-500/5' : ''}`}
                    >
                      <div className="relative">
                        {/* Checkbox for bulk selection */}
                        <div 
                          className="absolute top-3 left-3 z-10"
                          data-testid={`checkbox-bot-${bot.botId}`}
                          role="checkbox"
                          aria-checked={isChecked}
                          tabIndex={0}
                          onClick={(e) => {
                            e.stopPropagation();
                            const newSet = new Set(selectedBots);
                            if (isChecked) {
                              newSet.delete(bot.botId);
                            } else {
                              newSet.add(bot.botId);
                            }
                            setSelectedBots(newSet);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              e.stopPropagation();
                              const newSet = new Set(selectedBots);
                              if (isChecked) {
                                newSet.delete(bot.botId);
                              } else {
                                newSet.add(bot.botId);
                              }
                              setSelectedBots(newSet);
                            }
                          }}
                        >
                          <div className={`h-5 w-5 rounded border-2 flex items-center justify-center transition-colors ${
                            isChecked ? 'bg-cyan-500 border-cyan-500' : 'border-white/30 hover:border-white/50'
                          }`}>
                            {isChecked && <Check className="h-3 w-3 text-white" />}
                          </div>
                        </div>
                        <div 
                          onClick={() => {
                            setSelectedBotId(bot.botId);
                            setActiveTab('overview');
                          }}
                        >
                          <GlassCardHeader className="pb-3 pl-10">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-3">
                                <div className={`h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                  isSelected ? 'bg-cyan-500 text-white' : 'bg-cyan-400/10'
                                }`}>
                                  <Building2 className={`h-5 w-5 ${isSelected ? '' : 'text-cyan-400'}`} />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <GlassCardTitle className="text-sm leading-tight break-words">
                                    {bot.name || bot.businessProfile?.businessName}
                                  </GlassCardTitle>
                                  <GlassCardDescription className="text-xs">
                                    {getBusinessTypeLabel(bot.businessProfile?.type)}
                                  </GlassCardDescription>
                                </div>
                              </div>
                              {client && getStatusBadge(client.status)}
                            </div>
                          </GlassCardHeader>
                          <GlassCardContent className="pb-4 space-y-2">
                            <div className="flex items-center justify-between text-xs text-white/55">
                              <span className="flex items-center gap-1">
                                <MessageSquare className="h-3 w-3" />
                                {bot.faqs?.length || 0} FAQs
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {bot.metadata?.createdAt ? new Date(bot.metadata.createdAt).toLocaleDateString() : 'N/A'}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              {bot.metadata?.isDemo && (
                                <Badge variant="outline" className="text-[10px] h-5 border-blue-500/30 text-blue-400 bg-blue-500/10">Demo</Badge>
                              )}
                              {bot.businessProfile?.email && (
                                <Badge variant="outline" className="text-[10px] h-5 border-white/10 text-white/40">Email Set</Badge>
                              )}
                              {bot.businessProfile?.phone && (
                                <Badge variant="outline" className="text-[10px] h-5 border-white/10 text-white/40">Phone Set</Badge>
                              )}
                            </div>
                          </GlassCardContent>
                        </div>
                      </div>
                    </GlassCard>
                  );
                })}

                {/* Add New Bot Card */}
                <div
                  data-testid="card-add-new-bot"
                  className="border-2 border-dashed border-white/20 hover:border-cyan-400/50 bg-transparent rounded-2xl cursor-pointer transition-all group flex items-center justify-center min-h-[140px]"
                  onClick={() => setShowCreateModal(true)}
                >
                  <div className="text-center p-4">
                    <div className="h-10 w-10 rounded-lg bg-white/5 flex items-center justify-center mx-auto mb-2 group-hover:bg-cyan-400/10 transition-colors">
                      <Plus className="h-5 w-5 text-white/55 group-hover:text-cyan-400 transition-colors" />
                    </div>
                    <p className="font-medium text-sm text-white/85 group-hover:text-cyan-400 transition-colors">Add New Bot</p>
                    <p className="text-xs text-white/40 mt-0.5">Create from template</p>
                  </div>
                </div>
              </div>
              </>
              )}

              {dashboardSection === 'workspaces' && (
                <div className="space-y-6">
                  {/* Workspaces Header with Search and Export */}
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <h2 className="text-lg font-semibold text-white">All Workspaces</h2>
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/40" />
                        <Input
                          data-testid="input-workspace-search"
                          placeholder="Search workspaces..."
                          value={workspaceSearch}
                          onChange={(e) => setWorkspaceSearch(e.target.value)}
                          className="pl-9 w-56 bg-white/5 border-white/10 text-white placeholder:text-white/40"
                        />
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const csv = `Name,Slug,Status,Plan,Bots,Conversations,Last Active\n${
                            (workspacesData?.workspaces || []).map(w => 
                              `"${w.name}",${w.slug},${w.status},${w.plan},${w.botsCount},${w.totalConversations},${w.lastActive || 'Never'}`
                            ).join('\n')
                          }`;
                          const blob = new Blob([csv], { type: 'text/csv' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `workspaces-${new Date().toISOString().split('T')[0]}.csv`;
                          a.click();
                          toast({ title: "Export Complete", description: "Workspaces data exported to CSV." });
                        }}
                        className="border-white/10 text-white/85 hover:bg-white/10"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Export
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowCreateWorkspaceModal(true)}
                        className="border-white/10 text-white/85 hover:bg-white/10"
                        data-testid="button-add-workspace"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Workspace
                      </Button>
                    </div>
                  </div>

                  {/* Create Workspace Modal */}
                  <AlertDialog open={showCreateWorkspaceModal} onOpenChange={setShowCreateWorkspaceModal}>
                    <AlertDialogContent className="bg-[#1a1d24] border-white/10">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="text-white">Create New Workspace</AlertDialogTitle>
                        <AlertDialogDescription className="text-white/55">
                          Add a new business workspace to the platform.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <label className="text-sm text-white/85">Business Name</label>
                          <input
                            type="text"
                            value={newWorkspaceForm.name}
                            onChange={(e) => {
                              const name = e.target.value;
                              const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
                              setNewWorkspaceForm(f => ({ ...f, name, slug }));
                            }}
                            className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-cyan-400/50"
                            placeholder="e.g. Acme Restaurant"
                            data-testid="input-new-workspace-name"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm text-white/85">Slug (auto-generated)</label>
                          <input
                            type="text"
                            value={newWorkspaceForm.slug}
                            onChange={(e) => setNewWorkspaceForm(f => ({ ...f, slug: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') }))}
                            className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-cyan-400/50"
                            placeholder="e.g. acme_restaurant"
                            data-testid="input-new-workspace-slug"
                          />
                          <p className="text-xs text-white/40">Lowercase letters, numbers, and underscores only</p>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm text-white/85">Plan</label>
                          <Select
                            value={newWorkspaceForm.plan}
                            onValueChange={(value) => setNewWorkspaceForm(f => ({ ...f, plan: value }))}
                          >
                            <SelectTrigger className="w-full bg-white/5 border-white/10 text-white" data-testid="select-new-workspace-plan">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-[#1a1d24] border-white/10">
                              <SelectItem value="free" className="text-white">Free</SelectItem>
                              <SelectItem value="starter" className="text-white">Starter</SelectItem>
                              <SelectItem value="pro" className="text-white">Pro</SelectItem>
                              <SelectItem value="enterprise" className="text-white">Enterprise</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm text-white/85">Owner</label>
                          <Select
                            value={newWorkspaceForm.ownerId}
                            onValueChange={(value) => setNewWorkspaceForm(f => ({ ...f, ownerId: value }))}
                          >
                            <SelectTrigger className="w-full bg-white/5 border-white/10 text-white" data-testid="select-new-workspace-owner">
                              <SelectValue placeholder="Select owner..." />
                            </SelectTrigger>
                            <SelectContent className="bg-[#1a1d24] border-white/10">
                              {adminUsers?.map(user => (
                                <SelectItem key={user.id} value={String(user.id)} className="text-white">
                                  {user.username} ({user.role === 'super_admin' ? 'Super Admin' : 'Client Admin'})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="bg-transparent border-white/10 text-white hover:bg-white/10">
                          Cancel
                        </AlertDialogCancel>
                        <Button
                          onClick={() => createWorkspaceMutation.mutate(newWorkspaceForm)}
                          disabled={!newWorkspaceForm.name || !newWorkspaceForm.slug || !newWorkspaceForm.ownerId || createWorkspaceMutation.isPending}
                          className="bg-cyan-500 hover:bg-cyan-600 text-white"
                          data-testid="button-create-workspace-confirm"
                        >
                          {createWorkspaceMutation.isPending ? "Creating..." : "Create Workspace"}
                        </Button>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>

                  {/* Edit Workspace Modal */}
                  <AlertDialog open={!!editingWorkspace} onOpenChange={(open) => !open && setEditingWorkspace(null)}>
                    <AlertDialogContent className="bg-[#1a1d24] border-white/10">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="text-white">Edit Workspace</AlertDialogTitle>
                        <AlertDialogDescription className="text-white/55">
                          Update workspace settings for {editingWorkspace?.slug}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <label className="text-sm text-white/85">Business Name</label>
                          <input
                            type="text"
                            value={editingWorkspace?.name || ''}
                            onChange={(e) => setEditingWorkspace(w => w ? { ...w, name: e.target.value } : null)}
                            className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-cyan-400/50"
                            data-testid="input-edit-workspace-name"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm text-white/85">Plan</label>
                          <Select
                            value={editingWorkspace?.plan || 'starter'}
                            onValueChange={(value) => setEditingWorkspace(w => w ? { ...w, plan: value } : null)}
                          >
                            <SelectTrigger className="w-full bg-white/5 border-white/10 text-white" data-testid="select-edit-workspace-plan">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-[#1a1d24] border-white/10">
                              <SelectItem value="free" className="text-white">Free</SelectItem>
                              <SelectItem value="starter" className="text-white">Starter</SelectItem>
                              <SelectItem value="pro" className="text-white">Pro</SelectItem>
                              <SelectItem value="enterprise" className="text-white">Enterprise</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="bg-transparent border-white/10 text-white hover:bg-white/10">
                          Cancel
                        </AlertDialogCancel>
                        <Button
                          onClick={() => editingWorkspace && updateWorkspaceMutation.mutate({ 
                            slug: editingWorkspace.slug, 
                            name: editingWorkspace.name,
                            plan: editingWorkspace.plan 
                          })}
                          disabled={updateWorkspaceMutation.isPending}
                          className="bg-cyan-500 hover:bg-cyan-600 text-white"
                          data-testid="button-edit-workspace-confirm"
                        >
                          {updateWorkspaceMutation.isPending ? "Saving..." : "Save Changes"}
                        </Button>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                  {workspacesLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="h-8 w-8 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin" />
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                      {workspacesData?.workspaces.filter(workspace =>
                        !workspaceSearch || 
                        workspace.name.toLowerCase().includes(workspaceSearch.toLowerCase()) ||
                        workspace.slug.toLowerCase().includes(workspaceSearch.toLowerCase())
                      ).map(workspace => (
                        <GlassCard key={workspace.id} hover data-testid={`card-workspace-${workspace.slug}`}>
                          <GlassCardHeader className="pb-3">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0 flex-1">
                                <GlassCardTitle className="text-sm truncate">{workspace.name}</GlassCardTitle>
                                <GlassCardDescription className="text-xs">{workspace.slug}</GlassCardDescription>
                              </div>
                              <div className="flex items-center gap-1">
                                <Select
                                  value={workspace.status}
                                  onValueChange={(value) => updateWorkspaceStatusMutation.mutate({ slug: workspace.slug, status: value })}
                                >
                                  <SelectTrigger 
                                    data-testid={`select-workspace-status-${workspace.slug}`}
                                    className={`w-[90px] h-7 text-xs ${
                                      workspace.status === 'active' ? "bg-green-500/20 text-green-400 border-green-500/30" :
                                      workspace.status === 'suspended' ? "bg-red-500/20 text-red-400 border-red-500/30" :
                                      workspace.status === 'cancelled' ? "bg-gray-500/20 text-gray-400 border-gray-500/30" :
                                      "bg-amber-500/20 text-amber-400 border-amber-500/30"
                                    }`}
                                  >
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent className="bg-[#1a1f2e] border-white/10">
                                    <SelectItem value="active" className="text-green-400 focus:bg-white/10 focus:text-green-400">Active</SelectItem>
                                    <SelectItem value="paused" className="text-amber-400 focus:bg-white/10 focus:text-amber-400">Paused</SelectItem>
                                    <SelectItem value="suspended" className="text-red-400 focus:bg-white/10 focus:text-red-400">Suspended</SelectItem>
                                    <SelectItem value="cancelled" className="text-gray-400 focus:bg-white/10 focus:text-gray-400">Cancelled</SelectItem>
                                  </SelectContent>
                                </Select>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-white/55 hover:text-white hover:bg-white/10" data-testid={`button-workspace-menu-${workspace.slug}`}>
                                      <MoreVertical className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="bg-[#1a1d24] border-white/10">
                                    <DropdownMenuItem 
                                      className="text-white hover:bg-white/10"
                                      onClick={() => setEditingWorkspace({ slug: workspace.slug, name: workspace.name, plan: workspace.plan })}
                                      data-testid={`button-edit-workspace-${workspace.slug}`}
                                    >
                                      Edit Workspace
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator className="bg-white/10" />
                                    <DropdownMenuItem 
                                      className="text-red-400 hover:bg-red-500/10"
                                      onClick={() => {
                                        if (confirm(`Are you sure you want to delete "${workspace.name}"? This will also delete all ${workspace.botsCount} bots in this workspace.`)) {
                                          deleteWorkspaceMutation.mutate(workspace.slug);
                                        }
                                      }}
                                      data-testid={`button-delete-workspace-${workspace.slug}`}
                                    >
                                      Delete Workspace
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>
                          </GlassCardHeader>
                          <GlassCardContent className="pb-4">
                            <div className="grid grid-cols-2 gap-3 text-xs">
                              <div>
                                <span className="text-white/55">Bots</span>
                                <p className="text-white font-medium">{workspace.botsCount}</p>
                              </div>
                              <div>
                                <span className="text-white/55">Conversations</span>
                                <p className="text-white font-medium">{workspace.totalConversations}</p>
                              </div>
                              <div>
                                <span className="text-white/55">Plan</span>
                                <p className="text-white font-medium capitalize">{workspace.plan}</p>
                              </div>
                              <div>
                                <span className="text-white/55">Last Active</span>
                                <p className="text-white font-medium">{workspace.lastActive ? new Date(workspace.lastActive).toLocaleDateString() : 'Never'}</p>
                              </div>
                            </div>
                          </GlassCardContent>
                        </GlassCard>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {dashboardSection === 'analytics' && (
                <div className="space-y-6">
                  {/* Analytics Header with Date Range */}
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-white">Global Analytics</h2>
                    <div className="flex items-center gap-2">
                      <div className="flex rounded-lg bg-white/5 border border-white/10 p-0.5">
                        {[7, 14, 30, 90].map((days) => (
                          <Button
                            key={days}
                            variant="ghost"
                            size="sm"
                            data-testid={`button-range-${days}d`}
                            onClick={() => setAnalyticsRange(days)}
                            className={`text-xs px-3 ${analyticsRange === days ? 'bg-cyan-500/20 text-cyan-400' : 'text-white/55 hover:text-white hover:bg-white/10'}`}
                          >
                            {days}d
                          </Button>
                        ))}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const csv = `Date,Conversations,Leads,Appointments\n${
                            (globalAnalytics?.dailyTrends || []).map(t => `${t.date},${t.conversations},${t.leads},${t.appointments}`).join('\n')
                          }`;
                          const blob = new Blob([csv], { type: 'text/csv' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `analytics-${new Date().toISOString().split('T')[0]}.csv`;
                          a.click();
                          toast({ title: "Export Complete", description: "Analytics data exported to CSV." });
                        }}
                        className="border-white/10 text-white/85 hover:bg-white/10"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Export CSV
                      </Button>
                    </div>
                  </div>

                  {/* Global Stats Cards */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <GlassCard>
                      <GlassCardContent className="pt-6">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-cyan-400/10 flex items-center justify-center">
                            <MessageSquare className="h-5 w-5 text-cyan-400" />
                          </div>
                          <div>
                            <p className="text-2xl font-bold text-white">{globalAnalytics?.summary?.totalConversations || 0}</p>
                            <p className="text-sm text-white/55">Conversations ({analyticsRange}d)</p>
                          </div>
                        </div>
                      </GlassCardContent>
                    </GlassCard>
                    <GlassCard>
                      <GlassCardContent className="pt-6">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                            <Users className="h-5 w-5 text-green-400" />
                          </div>
                          <div>
                            <p className="text-2xl font-bold text-white">{globalAnalytics?.summary?.totalLeads || 0}</p>
                            <p className="text-sm text-white/55">Leads Captured</p>
                          </div>
                        </div>
                      </GlassCardContent>
                    </GlassCard>
                    <GlassCard>
                      <GlassCardContent className="pt-6">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                            <Activity className="h-5 w-5 text-purple-400" />
                          </div>
                          <div>
                            <p className="text-2xl font-bold text-white">{globalAnalytics?.summary?.activeWorkspaces || 0}</p>
                            <p className="text-sm text-white/55">Active Workspaces</p>
                          </div>
                        </div>
                      </GlassCardContent>
                    </GlassCard>
                    <GlassCard>
                      <GlassCardContent className="pt-6">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                            <Bot className="h-5 w-5 text-amber-400" />
                          </div>
                          <div>
                            <p className="text-2xl font-bold text-white">{globalAnalytics?.summary?.totalBots || 0}</p>
                            <p className="text-sm text-white/55">Total Bots</p>
                          </div>
                        </div>
                      </GlassCardContent>
                    </GlassCard>
                  </div>

                  {/* Trends Chart */}
                  <GlassCard>
                    <GlassCardHeader>
                      <GlassCardTitle>Platform Activity (Last {analyticsRange} Days)</GlassCardTitle>
                      <GlassCardDescription>Conversations, leads, and appointments across all bots</GlassCardDescription>
                    </GlassCardHeader>
                    <GlassCardContent>
                      {analyticsLoading ? (
                        <div className="h-64 flex items-center justify-center">
                          <div className="h-8 w-8 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin" />
                        </div>
                      ) : (
                        <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={globalAnalytics?.dailyTrends || []}>
                              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                              <XAxis dataKey="date" stroke="rgba(255,255,255,0.5)" fontSize={12} tickFormatter={(d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} />
                              <YAxis stroke="rgba(255,255,255,0.5)" fontSize={12} />
                              <Tooltip 
                                contentStyle={{ backgroundColor: '#1a1d24', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                                labelStyle={{ color: 'white' }}
                              />
                              <Line type="monotone" dataKey="conversations" stroke="#4FC3F7" strokeWidth={2} dot={false} name="Conversations" />
                              <Line type="monotone" dataKey="leads" stroke="#10B981" strokeWidth={2} dot={false} name="Leads" />
                              <Line type="monotone" dataKey="appointments" stroke="#F59E0B" strokeWidth={2} dot={false} name="Appointments" />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      )}
                    </GlassCardContent>
                  </GlassCard>
                  
                  {/* Recent Activity Feed */}
                  <GlassCard>
                    <GlassCardHeader>
                      <GlassCardTitle>Recent Activity</GlassCardTitle>
                      <GlassCardDescription>Latest leads and sessions across all bots</GlassCardDescription>
                    </GlassCardHeader>
                    <GlassCardContent>
                      {activityLoading ? (
                        <div className="flex items-center justify-center py-8">
                          <div className="h-8 w-8 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin" />
                        </div>
                      ) : (recentActivity?.activities || []).length === 0 ? (
                        <div className="text-center py-8 text-white/55">
                          <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p>No recent activity</p>
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-80 overflow-y-auto">
                          {(recentActivity?.activities || []).slice(0, 15).map((activity, idx) => (
                            <div 
                              key={`${activity.type}-${idx}`}
                              className="flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/8 transition-colors"
                              data-testid={`activity-item-${idx}`}
                            >
                              <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${
                                activity.type === 'lead' ? 'bg-green-500/20' : 'bg-cyan-500/20'
                              }`}>
                                {activity.type === 'lead' ? (
                                  <Users className="h-4 w-4 text-green-400" />
                                ) : (
                                  <MessageSquare className="h-4 w-4 text-cyan-400" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium text-white truncate">
                                    {activity.type === 'lead' 
                                      ? `New Lead: ${activity.details?.name || 'Anonymous'}`
                                      : `Chat Session (${activity.details?.messageCount || 0} msgs)`
                                    }
                                  </span>
                                  <Badge variant="outline" className="shrink-0 text-xs border-white/10 text-white/55">
                                    {activity.botName}
                                  </Badge>
                                </div>
                                <p className="text-xs text-white/40 truncate">
                                  {activity.type === 'lead' && activity.details?.email && (
                                    <span>{activity.details.email}</span>
                                  )}
                                  {activity.type === 'session' && activity.details?.topics?.length > 0 && (
                                    <span>Topics: {activity.details.topics.slice(0, 2).join(', ')}</span>
                                  )}
                                  {activity.type === 'session' && (!activity.details?.topics || activity.details.topics.length === 0) && (
                                    <span>Session ID: {activity.details?.sessionId?.substring(0, 8)}...</span>
                                  )}
                                </p>
                              </div>
                              <div className="text-xs text-white/40 shrink-0">
                                {new Date(activity.timestamp).toLocaleString('en-US', { 
                                  month: 'short', 
                                  day: 'numeric', 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </GlassCardContent>
                  </GlassCard>
                </div>
              )}

              {/* System Logs Section */}
              {dashboardSection === 'logs' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-white">System Logs</h2>
                    <div className="flex items-center gap-2">
                      <Select value={logFilters.level} onValueChange={(v) => setLogFilters({...logFilters, level: v})}>
                        <SelectTrigger className="w-32 bg-white/5 border-white/10 text-white text-sm">
                          <SelectValue placeholder="All Levels" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#1a1d24] border-white/10">
                          <SelectItem value="all" className="text-white">All Levels</SelectItem>
                          <SelectItem value="debug" className="text-white">Debug</SelectItem>
                          <SelectItem value="info" className="text-white">Info</SelectItem>
                          <SelectItem value="warn" className="text-white">Warning</SelectItem>
                          <SelectItem value="error" className="text-white">Error</SelectItem>
                          <SelectItem value="critical" className="text-white">Critical</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select value={logFilters.isResolved} onValueChange={(v) => setLogFilters({...logFilters, isResolved: v})}>
                        <SelectTrigger className="w-32 bg-white/5 border-white/10 text-white text-sm">
                          <SelectValue placeholder="All Status" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#1a1d24] border-white/10">
                          <SelectItem value="all" className="text-white">All Status</SelectItem>
                          <SelectItem value="false" className="text-white">Unresolved</SelectItem>
                          <SelectItem value="true" className="text-white">Resolved</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button variant="ghost" size="icon" onClick={() => refetchLogs()} className="text-white/55 hover:text-white hover:bg-white/10">
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Stats Summary */}
                  <div className="grid grid-cols-3 gap-4">
                    <GlassCard>
                      <GlassCardContent className="pt-4 pb-4">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                            <FileText className="h-4 w-4 text-blue-400" />
                          </div>
                          <div>
                            <p className="text-xl font-bold text-white">{systemLogs?.total || 0}</p>
                            <p className="text-xs text-white/55">Total Logs</p>
                          </div>
                        </div>
                      </GlassCardContent>
                    </GlassCard>
                    <GlassCard>
                      <GlassCardContent className="pt-4 pb-4">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                            <AlertTriangle className="h-4 w-4 text-amber-400" />
                          </div>
                          <div>
                            <p className="text-xl font-bold text-white">{systemLogs?.unresolved || 0}</p>
                            <p className="text-xs text-white/55">Unresolved</p>
                          </div>
                        </div>
                      </GlassCardContent>
                    </GlassCard>
                    <GlassCard>
                      <GlassCardContent className="pt-4 pb-4">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                            <CheckCircle2 className="h-4 w-4 text-green-400" />
                          </div>
                          <div>
                            <p className="text-xl font-bold text-white">{(systemLogs?.total || 0) - (systemLogs?.unresolved || 0)}</p>
                            <p className="text-xs text-white/55">Resolved</p>
                          </div>
                        </div>
                      </GlassCardContent>
                    </GlassCard>
                  </div>

                  {/* Logs List */}
                  {logsLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="h-8 w-8 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin" />
                    </div>
                  ) : !systemLogs?.logs?.length ? (
                    <GlassCard>
                      <GlassCardContent className="py-12 text-center">
                        <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-green-400/50" />
                        <p className="text-white/55">No logs found matching your filters</p>
                      </GlassCardContent>
                    </GlassCard>
                  ) : (
                    <div className="space-y-2">
                      {systemLogs.logs.map((log) => (
                        <GlassCard key={log.id} className={log.isResolved ? 'opacity-60' : ''}>
                          <GlassCardContent className="py-3">
                            <div className="flex items-start gap-3">
                              <div className={`h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                log.level === 'error' || log.level === 'critical' ? 'bg-red-500/10' :
                                log.level === 'warn' ? 'bg-amber-500/10' :
                                log.level === 'info' ? 'bg-blue-500/10' : 'bg-white/10'
                              }`}>
                                {log.level === 'error' || log.level === 'critical' ? <XCircle className="h-4 w-4 text-red-400" /> :
                                 log.level === 'warn' ? <AlertTriangle className="h-4 w-4 text-amber-400" /> :
                                 <FileText className="h-4 w-4 text-blue-400" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <Badge className={`text-xs ${
                                    log.level === 'error' || log.level === 'critical' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                                    log.level === 'warn' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' :
                                    'bg-blue-500/20 text-blue-400 border-blue-500/30'
                                  }`}>{log.level.toUpperCase()}</Badge>
                                  <span className="text-xs text-white/40">{log.source}</span>
                                  <span className="text-xs text-white/40">•</span>
                                  <span className="text-xs text-white/40">{new Date(log.createdAt).toLocaleString()}</span>
                                  {log.isResolved && <Badge className="text-xs bg-green-500/20 text-green-400 border-green-500/30">Resolved</Badge>}
                                </div>
                                <p className="text-sm text-white break-words">{log.message}</p>
                                {log.stack && (
                                  <pre className="mt-2 text-xs text-white/40 bg-black/20 p-2 rounded overflow-x-auto max-h-24">{log.stack}</pre>
                                )}
                                {log.isResolved && log.resolutionNotes && (
                                  <p className="mt-2 text-xs text-green-400/70">Resolution: {log.resolutionNotes}</p>
                                )}
                              </div>
                              {!log.isResolved && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => resolveLogMutation.mutate({ logId: log.id })}
                                  disabled={resolveLogMutation.isPending}
                                  className="text-green-400 hover:bg-green-500/10"
                                >
                                  <CheckCircle2 className="h-4 w-4 mr-1" />
                                  Resolve
                                </Button>
                              )}
                            </div>
                          </GlassCardContent>
                        </GlassCard>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Users Section */}
              {dashboardSection === 'users' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-white">Admin Users</h2>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="border-white/10 text-white/85 hover:bg-white/10"
                      onClick={() => setShowCreateUserModal(true)}
                      data-testid="button-add-user"
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Add User
                    </Button>
                  </div>

                  {/* Create User Modal */}
                  <AlertDialog open={showCreateUserModal} onOpenChange={setShowCreateUserModal}>
                    <AlertDialogContent className="bg-[#1a1d24] border-white/10">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="text-white">Create New User</AlertDialogTitle>
                        <AlertDialogDescription className="text-white/55">
                          Add a new admin user to the platform.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <label className="text-sm text-white/85">Username</label>
                          <input
                            type="text"
                            value={newUserForm.username}
                            onChange={(e) => setNewUserForm(f => ({ ...f, username: e.target.value }))}
                            className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-cyan-400/50"
                            placeholder="Enter username"
                            data-testid="input-new-username"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm text-white/85">Password</label>
                          <input
                            type="password"
                            value={newUserForm.password}
                            onChange={(e) => setNewUserForm(f => ({ ...f, password: e.target.value }))}
                            className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-cyan-400/50"
                            placeholder="Enter password"
                            data-testid="input-new-password"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm text-white/85">Role</label>
                          <Select
                            value={newUserForm.role}
                            onValueChange={(value) => setNewUserForm(f => ({ ...f, role: value as 'super_admin' | 'client_admin' }))}
                          >
                            <SelectTrigger className="w-full bg-white/5 border-white/10 text-white" data-testid="select-new-role">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-[#1a1d24] border-white/10">
                              <SelectItem value="client_admin" className="text-white">Client Admin</SelectItem>
                              <SelectItem value="super_admin" className="text-white">Super Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        {newUserForm.role === 'client_admin' && (
                          <div className="space-y-2">
                            <label className="text-sm text-white/85">Client ID (optional)</label>
                            <input
                              type="text"
                              value={newUserForm.clientId}
                              onChange={(e) => setNewUserForm(f => ({ ...f, clientId: e.target.value }))}
                              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-cyan-400/50"
                              placeholder="e.g. faith_house"
                              data-testid="input-new-clientid"
                            />
                          </div>
                        )}
                      </div>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="bg-transparent border-white/10 text-white hover:bg-white/10">
                          Cancel
                        </AlertDialogCancel>
                        <Button
                          onClick={() => createUserMutation.mutate(newUserForm)}
                          disabled={!newUserForm.username || !newUserForm.password || createUserMutation.isPending}
                          className="bg-cyan-500 hover:bg-cyan-600 text-white"
                          data-testid="button-create-user-confirm"
                        >
                          {createUserMutation.isPending ? "Creating..." : "Create User"}
                        </Button>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>

                  {usersLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="h-8 w-8 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin" />
                    </div>
                  ) : !adminUsers?.length ? (
                    <GlassCard>
                      <GlassCardContent className="py-12 text-center">
                        <Shield className="h-12 w-12 mx-auto mb-3 text-white/30" />
                        <p className="text-white/55">No admin users found</p>
                      </GlassCardContent>
                    </GlassCard>
                  ) : (
                    <div className="grid gap-4">
                      {adminUsers.map((user) => (
                        <GlassCard key={user.id} data-testid={`card-user-${user.id}`}>
                          <GlassCardContent className="py-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                                  user.role === 'super_admin' ? 'bg-purple-500/10' : 'bg-cyan-500/10'
                                }`}>
                                  <Shield className={`h-5 w-5 ${user.role === 'super_admin' ? 'text-purple-400' : 'text-cyan-400'}`} />
                                </div>
                                <div>
                                  <p className="font-medium text-white">{user.username}</p>
                                  <div className="flex items-center gap-2">
                                    <Badge className={user.role === 'super_admin' ? 'bg-purple-500/20 text-purple-400 border-purple-500/30' : 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30'}>
                                      {user.role === 'super_admin' ? 'Super Admin' : 'Client Admin'}
                                    </Badge>
                                    {user.clientId && <span className="text-xs text-white/40">Client: {user.clientId}</span>}
                                  </div>
                                </div>
                              </div>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="text-white/55 hover:text-white hover:bg-white/10" data-testid={`button-user-menu-${user.id}`}>
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="bg-[#1a1d24] border-white/10">
                                  <DropdownMenuItem 
                                    className="text-white hover:bg-white/10"
                                    onClick={() => {
                                      const newRole = user.role === 'super_admin' ? 'client_admin' : 'super_admin';
                                      updateUserMutation.mutate({ id: String(user.id), role: newRole });
                                    }}
                                    data-testid={`button-toggle-role-${user.id}`}
                                  >
                                    {user.role === 'super_admin' ? 'Demote to Client Admin' : 'Promote to Super Admin'}
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator className="bg-white/10" />
                                  <DropdownMenuItem 
                                    className="text-red-400 hover:bg-red-500/10"
                                    onClick={() => {
                                      if (confirm(`Are you sure you want to delete user "${user.username}"?`)) {
                                        deleteUserMutation.mutate(String(user.id));
                                      }
                                    }}
                                    data-testid={`button-delete-user-${user.id}`}
                                  >
                                    Delete User
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </GlassCardContent>
                        </GlassCard>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </main>

          {/* Bot Details Panel - Inline split pane with independent scroll */}
          {selectedBot && selectedClient && (
            <aside className="lg:min-w-[40%] lg:max-w-[50%] border-l border-white/10 bg-white/5 overflow-y-auto h-full">
              <div className="p-6">
                {/* Panel Header with Close */}
                <div className="flex items-start justify-between gap-2 mb-6">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="h-12 w-12 flex-shrink-0 rounded-xl bg-cyan-400/10 flex items-center justify-center">
                      <Building2 className="h-6 w-6 text-cyan-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h2 className="text-xl font-bold text-white truncate">{selectedBot.name || selectedBot.businessProfile?.businessName}</h2>
                      <p className="text-sm text-white/55 truncate">
                        {getBusinessTypeLabel(selectedBot.businessProfile?.type)} • {selectedBot.botId}
                      </p>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => setSelectedBotId(null)}
                    data-testid="button-close-detail"
                    className="text-white/85 hover:bg-white/10 hover:text-white flex-shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {/* Status and Actions */}
                <div className="flex items-center gap-2 mb-6 flex-wrap">
                  {getStatusBadge(selectedClient.status)}
                  <Button
                    data-testid="button-preview-bot"
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(`/demo/${selectedBot.botId}`, '_blank')}
                    className="border-white/10 text-white/85 hover:bg-white/10 hover:text-white"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Preview
                  </Button>
                  <Select
                    value={selectedClient.status}
                    onValueChange={(value) => updateStatusMutation.mutate({ 
                      clientId: selectedClient.id, 
                      status: value 
                    })}
                  >
                    <SelectTrigger data-testid="select-status" className="w-28 bg-white/5 border-white/10 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a1d24] border-white/10">
                      <SelectItem value="active" className="text-white hover:bg-white/10">Active</SelectItem>
                      <SelectItem value="paused" className="text-white hover:bg-white/10">Paused</SelectItem>
                      <SelectItem value="demo" className="text-white hover:bg-white/10">Demo</SelectItem>
                    </SelectContent>
                  </Select>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        data-testid="button-delete-bot"
                        variant="outline"
                        size="sm"
                        className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-[#1a1d24] border-white/10">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="text-white">Delete Bot Permanently?</AlertDialogTitle>
                        <AlertDialogDescription className="text-white/55">
                          This action cannot be undone. This will permanently delete the bot "{selectedBot.name}", 
                          all associated leads, appointments, and conversation history.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="bg-white/5 border-white/10 text-white hover:bg-white/10">Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteBotMutation.mutate(selectedBot.botId)}
                          className="bg-red-500 text-white hover:bg-red-600"
                        >
                          {deleteBotMutation.isPending ? 'Deleting...' : 'Delete Forever'}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>

                {/* Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="mb-6 w-full justify-start flex-wrap h-auto gap-1 bg-white/5 border border-white/10 rounded-xl p-1">
                    <TabsTrigger data-testid="tab-overview" value="overview" className="text-xs data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/55">
                      <Eye className="h-4 w-4 mr-1" />
                      Overview
                    </TabsTrigger>
                    <TabsTrigger data-testid="tab-settings" value="settings" className="text-xs data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/55">
                      <Settings className="h-4 w-4 mr-1" />
                      Settings
                    </TabsTrigger>
                    <TabsTrigger data-testid="tab-billing" value="billing" className="text-xs data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/55">
                      <CreditCard className="h-4 w-4 mr-1" />
                      Billing
                    </TabsTrigger>
                    <TabsTrigger data-testid="tab-analytics" value="analytics" className="text-xs data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/55">
                      <BarChart3 className="h-4 w-4 mr-1" />
                      Analytics
                    </TabsTrigger>
                    <TabsTrigger data-testid="tab-logs" value="logs" className="text-xs data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/55">
                      <MessageSquare className="h-4 w-4 mr-1" />
                      Logs
                    </TabsTrigger>
                    <TabsTrigger data-testid="tab-automations" value="automations" className="text-xs data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/55">
                      <Workflow className="h-4 w-4 mr-1" />
                      Automations
                    </TabsTrigger>
                    <TabsTrigger data-testid="tab-widget" value="widget" className="text-xs data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/55">
                      <Palette className="h-4 w-4 mr-1" />
                      Widget
                    </TabsTrigger>
                    <TabsTrigger data-testid="tab-install" value="install" className="text-xs data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/55">
                      <Code className="h-4 w-4 mr-1" />
                      Install
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview">
                    <OverviewPanel bot={selectedBot} client={selectedClient} />
                  </TabsContent>

                  <TabsContent value="settings">
                    <BotSettingsPanel bot={selectedBot} clientType={selectedClient.type} />
                  </TabsContent>

                  <TabsContent value="billing">
                    <BillingPanel clientId={selectedClient.id} clientName={selectedClient.name} status={selectedClient.status} />
                  </TabsContent>

                  <TabsContent value="analytics">
                    <AnalyticsPanel clientId={selectedClient.id} />
                  </TabsContent>

                  <TabsContent value="logs">
                    <LogsPanel clientId={selectedClient.id} botId={selectedBot.botId} />
                  </TabsContent>

                  <TabsContent value="automations">
                    <AutomationsPanel botId={selectedBot.botId} clientId={selectedClient.id} />
                  </TabsContent>

                  <TabsContent value="widget">
                    <WidgetSettingsPanel botId={selectedBot.botId} clientId={selectedClient.id} />
                  </TabsContent>

                  <TabsContent value="install">
                    <InstallPanel bot={selectedBot} client={selectedClient} />
                  </TabsContent>
                </Tabs>
              </div>
            </aside>
          )}
        </div>
      </div>

      {/* Create from Template Modal */}
      <CreateFromTemplateModal
        open={showCreateModal}
        onOpenChange={(open) => {
          setShowCreateModal(open);
          // Only reset template when explicitly closing after success
          // The modal handles its own state internally
        }}
        template={selectedTemplate}
        templates={templates}
        onSelectTemplate={setSelectedTemplate}
        onSuccess={(botId) => {
          setShowCreateModal(false);
          setSelectedTemplate(null); // Only reset after successful creation
          setSelectedBotId(botId);
          queryClient.invalidateQueries({ queryKey: ["/api/super-admin/bots"] });
          queryClient.invalidateQueries({ queryKey: ["/api/super-admin/clients"] });
        }}
      />
    </div>
  );
}

// Overview Panel - Quick summary of bot and client
function OverviewPanel({ bot, client }: { bot: BotConfig; client: Client }) {
  const { data: analytics, isLoading } = useQuery({
    queryKey: ["/api/client/analytics/summary", client.id],
    queryFn: async () => {
      const response = await fetch(`/api/client/analytics/summary?clientId=${client.id}`, { credentials: "include" });
      if (!response.ok) return null;
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <GlassCard key={i}>
              <div className="p-6 animate-pulse">
                <div className="h-4 bg-white/10 rounded w-24 mb-2" />
                <div className="h-8 bg-white/10 rounded w-16" />
              </div>
            </GlassCard>
          ))}
        </div>
        <GlassCard>
          <div className="p-6 animate-pulse">
            <div className="h-5 bg-white/10 rounded w-32 mb-4" />
            <div className="grid grid-cols-2 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i}>
                  <div className="h-3 bg-white/10 rounded w-20 mb-2" />
                  <div className="h-4 bg-white/10 rounded w-28" />
                </div>
              ))}
            </div>
          </div>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <GlassCard>
          <GlassCardHeader className="pb-2">
            <GlassCardTitle className="text-sm font-medium text-white/55">Messages (7d)</GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent>
            <div className="text-3xl font-bold text-white">{analytics?.messagesLast7d || 0}</div>
          </GlassCardContent>
        </GlassCard>
        <GlassCard>
          <GlassCardHeader className="pb-2">
            <GlassCardTitle className="text-sm font-medium text-white/55">Conversations</GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent>
            <div className="text-3xl font-bold text-white">{analytics?.conversations || 0}</div>
          </GlassCardContent>
        </GlassCard>
        <GlassCard>
          <GlassCardHeader className="pb-2">
            <GlassCardTitle className="text-sm font-medium text-white/55">Leads (7d)</GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent>
            <div className="text-3xl font-bold text-white">{analytics?.leadsLast7d || 0}</div>
          </GlassCardContent>
        </GlassCard>
        <GlassCard>
          <GlassCardHeader className="pb-2">
            <GlassCardTitle className="text-sm font-medium text-white/55">Bookings (7d)</GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent>
            <div className="text-3xl font-bold text-white">{analytics?.bookingsLast7d || 0}</div>
          </GlassCardContent>
        </GlassCard>
      </div>

      {/* Bot Info Card */}
      <GlassCard>
        <GlassCardHeader>
          <GlassCardTitle>Bot Information</GlassCardTitle>
          <GlassCardDescription>Quick overview of this chatbot</GlassCardDescription>
        </GlassCardHeader>
        <GlassCardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-white/55">Business Name</Label>
              <p className="font-medium text-white">{bot.businessProfile?.businessName || '-'}</p>
            </div>
            <div>
              <Label className="text-white/55">Business Type</Label>
              <p className="font-medium text-white">{BUSINESS_TYPES.find(t => t.value === bot.businessProfile?.type)?.label || bot.businessProfile?.type || '-'}</p>
            </div>
            <div>
              <Label className="text-white/55">Phone</Label>
              <p className="font-medium text-white">{bot.businessProfile?.phone || '-'}</p>
            </div>
            <div>
              <Label className="text-white/55">Email</Label>
              <p className="font-medium text-white">{bot.businessProfile?.email || '-'}</p>
            </div>
            <div>
              <Label className="text-white/55">Location</Label>
              <p className="font-medium text-white">{bot.businessProfile?.location || '-'}</p>
            </div>
            <div>
              <Label className="text-white/55">Website</Label>
              <p className="font-medium text-white">{bot.businessProfile?.website || '-'}</p>
            </div>
          </div>
        </GlassCardContent>
      </GlassCard>

      {/* Services */}
      {bot.businessProfile?.services && bot.businessProfile.services.length > 0 && (
        <GlassCard>
          <GlassCardHeader>
            <GlassCardTitle>Services</GlassCardTitle>
            <GlassCardDescription>What this business offers</GlassCardDescription>
          </GlassCardHeader>
          <GlassCardContent>
            <div className="flex flex-wrap gap-2">
              {bot.businessProfile.services.map((service, i) => (
                <Badge key={i} className="bg-cyan-400/10 text-cyan-400 border-cyan-400/30">{service}</Badge>
              ))}
            </div>
          </GlassCardContent>
        </GlassCard>
      )}

      {/* FAQs Count */}
      <GlassCard>
        <GlassCardHeader>
          <GlassCardTitle>Knowledge Base</GlassCardTitle>
          <GlassCardDescription>FAQs and training data</GlassCardDescription>
        </GlassCardHeader>
        <GlassCardContent>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{bot.faqs?.length || 0}</div>
              <div className="text-sm text-white/55">FAQs</div>
            </div>
            <Separator orientation="vertical" className="h-12 bg-white/10" />
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{bot.rules?.specialInstructions?.length || 0}</div>
              <div className="text-sm text-white/55">Special Instructions</div>
            </div>
          </div>
        </GlassCardContent>
      </GlassCard>
    </div>
  );
}

// Billing Panel - Stripe subscription management
function BillingPanel({ clientId, clientName, status }: { clientId: string; clientName: string; status: string }) {
  const { toast } = useToast();

  const { data: subscription, isLoading } = useQuery({
    queryKey: ["/api/stripe/subscription", clientId],
    queryFn: async () => {
      const response = await fetch(`/api/stripe/subscription/${clientId}`, { credentials: "include" });
      if (!response.ok) return null;
      return response.json();
    },
  });

  const createCheckoutMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/stripe/checkout", { clientId });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.url) {
        window.open(data.url, '_blank');
      }
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create checkout session.", variant: "destructive" });
    },
  });

  const openPortalMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/stripe/portal", { clientId });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.url) {
        window.open(data.url, '_blank');
      }
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to open billing portal.", variant: "destructive" });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map(i => (
          <GlassCard key={i}>
            <div className="p-6 animate-pulse">
              <div className="h-5 bg-white/10 rounded w-32 mb-4" />
              <div className="h-4 bg-white/10 rounded w-48" />
            </div>
          </GlassCard>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Status */}
      <GlassCard>
        <GlassCardHeader>
          <GlassCardTitle>Subscription Status</GlassCardTitle>
          <GlassCardDescription>Current billing status for {clientName}</GlassCardDescription>
        </GlassCardHeader>
        <GlassCardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white/55">Current Status</p>
              <div className="flex items-center gap-2 mt-1">
                {status === 'active' && <Badge className="bg-green-500/20 text-green-400 border border-green-500/30">ACTIVE</Badge>}
                {status === 'paused' && <Badge className="bg-red-500/20 text-red-400 border border-red-500/30">PAUSED</Badge>}
                {status === 'demo' && <Badge className="bg-blue-500/20 text-blue-400 border border-blue-500/30">DEMO</Badge>}
              </div>
            </div>
            {subscription?.plan && (
              <div className="text-right">
                <p className="text-sm text-white/55">Plan</p>
                <p className="font-medium text-white">{subscription.plan}</p>
              </div>
            )}
          </div>

          {subscription?.currentPeriodEnd && (
            <div>
              <p className="text-sm text-white/55">Next Billing Date</p>
              <p className="font-medium text-white">{new Date(subscription.currentPeriodEnd).toLocaleDateString()}</p>
            </div>
          )}
        </GlassCardContent>
      </GlassCard>

      {/* Actions */}
      <GlassCard>
        <GlassCardHeader>
          <GlassCardTitle>Billing Actions</GlassCardTitle>
          <GlassCardDescription>Manage subscription and payments</GlassCardDescription>
        </GlassCardHeader>
        <GlassCardContent className="space-y-3">
          {!subscription ? (
            <Button 
              data-testid="button-create-subscription"
              onClick={() => createCheckoutMutation.mutate()}
              disabled={createCheckoutMutation.isPending}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
            >
              <CreditCard className="h-4 w-4 mr-2" />
              {createCheckoutMutation.isPending ? 'Creating...' : 'Set Up Subscription'}
            </Button>
          ) : (
            <Button 
              data-testid="button-manage-billing"
              variant="outline"
              onClick={() => openPortalMutation.mutate()}
              disabled={openPortalMutation.isPending}
              className="w-full border-white/10 text-white/85 hover:bg-white/10 hover:text-white"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              {openPortalMutation.isPending ? 'Opening...' : 'Manage Billing in Stripe'}
            </Button>
          )}
        </GlassCardContent>
      </GlassCard>

      {/* Billing History Note */}
      <GlassCard>
        <GlassCardHeader>
          <GlassCardTitle>Billing Notes</GlassCardTitle>
        </GlassCardHeader>
        <GlassCardContent>
          <ul className="text-sm text-white/55 space-y-2">
            <li>• Subscription status is synced automatically via Stripe webhooks</li>
            <li>• Failed payments will automatically pause the account</li>
            <li>• Use the Stripe portal to update payment methods or cancel</li>
          </ul>
        </GlassCardContent>
      </GlassCard>
    </div>
  );
}

// Tone/Voice options
const TONE_OPTIONS = [
  { value: 'professional', label: 'Professional', description: 'Formal and business-like communication' },
  { value: 'friendly', label: 'Friendly', description: 'Warm and approachable tone' },
  { value: 'casual', label: 'Casual', description: 'Relaxed and conversational' },
  { value: 'compassionate', label: 'Compassionate', description: 'Empathetic and understanding' },
  { value: 'informative', label: 'Informative', description: 'Educational and detailed' },
];

// Bot Settings Panel - Full editing capabilities
function BotSettingsPanel({ bot, clientType }: { bot: BotConfig; clientType?: string }) {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [faqs, setFaqs] = useState<Array<{ question: string; answer: string }>>(bot.faqs || []);
  const [editingFaqIndex, setEditingFaqIndex] = useState<number | null>(null);
  const [newFaq, setNewFaq] = useState({ question: '', answer: '' });
  const [showAddFaq, setShowAddFaq] = useState(false);
  const [formData, setFormData] = useState({
    name: bot.name || '',
    description: bot.description || '',
    businessName: bot.businessProfile?.businessName || '',
    type: bot.businessProfile?.type || '',
    phone: bot.businessProfile?.phone || '',
    email: bot.businessProfile?.email || '',
    website: bot.businessProfile?.website || '',
    location: bot.businessProfile?.location || '',
    hours: formatHoursForDisplay(bot.businessProfile?.hours),
    services: bot.businessProfile?.services?.join(', ') || '',
    systemPrompt: bot.systemPrompt || '',
    tone: (bot as any).tone || 'professional',
    responseLength: (bot as any).responseLength || 'medium',
  });

  useEffect(() => {
    setFormData({
      name: bot.name || '',
      description: bot.description || '',
      businessName: bot.businessProfile?.businessName || '',
      type: bot.businessProfile?.type || '',
      phone: bot.businessProfile?.phone || '',
      email: bot.businessProfile?.email || '',
      website: bot.businessProfile?.website || '',
      location: bot.businessProfile?.location || '',
      hours: formatHoursForDisplay(bot.businessProfile?.hours),
      services: bot.businessProfile?.services?.join(', ') || '',
      systemPrompt: bot.systemPrompt || '',
      tone: (bot as any).tone || 'professional',
      responseLength: (bot as any).responseLength || 'medium',
    });
    setFaqs(bot.faqs || []);
    setIsEditing(false);
    setEditingFaqIndex(null);
    setShowAddFaq(false);
  }, [bot.botId]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const updatedBot = {
        ...bot,
        name: formData.name,
        description: formData.description,
        businessProfile: {
          ...bot.businessProfile,
          businessName: formData.businessName,
          type: formData.type,
          phone: formData.phone,
          email: formData.email,
          website: formData.website,
          location: formData.location,
          hours: parseHoursFromString(formData.hours),
          services: formData.services.split(',').map(s => s.trim()).filter(Boolean),
        },
        systemPrompt: formData.systemPrompt,
        tone: formData.tone,
        responseLength: formData.responseLength,
        faqs: faqs,
      };
      const response = await apiRequest("PUT", `/api/super-admin/bots/${bot.botId}`, updatedBot);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Saved", description: "Bot settings have been updated." });
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ["/api/super-admin/bots"] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to save settings.", variant: "destructive" });
    },
  });

  // FAQ management functions
  const handleAddFaq = () => {
    if (newFaq.question.trim() && newFaq.answer.trim()) {
      setFaqs([...faqs, { question: newFaq.question.trim(), answer: newFaq.answer.trim() }]);
      setNewFaq({ question: '', answer: '' });
      setShowAddFaq(false);
    }
  };

  const handleUpdateFaq = (index: number, field: 'question' | 'answer', value: string) => {
    const updated = [...faqs];
    updated[index] = { ...updated[index], [field]: value };
    setFaqs(updated);
  };

  const handleDeleteFaq = (index: number) => {
    setFaqs(faqs.filter((_, i) => i !== index));
    setEditingFaqIndex(null);
  };

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <div className="flex justify-end gap-2">
        {isEditing ? (
          <>
            <Button 
              data-testid="button-cancel-edit"
              variant="outline" 
              size="sm"
              onClick={() => setIsEditing(false)}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button 
              data-testid="button-save-settings"
              size="sm"
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
            >
              <Save className="h-4 w-4 mr-2" />
              {saveMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </>
        ) : (
          <Button 
            data-testid="button-edit-settings"
            variant="outline" 
            size="sm"
            onClick={() => setIsEditing(true)}
          >
            <Edit2 className="h-4 w-4 mr-2" />
            Edit Settings
          </Button>
        )}
      </div>

      {/* Basic Info */}
      <GlassCard>
        <GlassCardHeader>
          <GlassCardTitle className="text-lg">Bot Information</GlassCardTitle>
          <GlassCardDescription>Basic details about this chatbot</GlassCardDescription>
        </GlassCardHeader>
        <GlassCardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="min-w-0">
              <Label>Bot Name</Label>
              {isEditing ? (
                <Input
                  data-testid="input-bot-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/60"
                />
              ) : (
                <p className="text-sm mt-1 truncate">{formData.name || '-'}</p>
              )}
            </div>
            <div>
              <Label>Business Type</Label>
              {isEditing ? (
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger data-testid="select-business-type" className="bg-white/5 border-white/10 text-white">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1f2e] border-white/10 text-white">
                    {BUSINESS_TYPES.map(type => (
                      <SelectItem key={type.value} value={type.value} className="text-white focus:bg-white/10 focus:text-white">{type.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-sm mt-1">{BUSINESS_TYPES.find(t => t.value === formData.type)?.label || formData.type || '-'}</p>
              )}
            </div>
          </div>
          <div className="min-w-0">
            <Label>Description</Label>
            {isEditing ? (
              <Textarea
                data-testid="input-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
                className="bg-white/5 border-white/10 text-white placeholder:text-white/60"
              />
            ) : (
              <p className="text-sm mt-1 text-white line-clamp-2">{formData.description || '-'}</p>
            )}
          </div>
        </GlassCardContent>
      </GlassCard>

      {/* Business Profile */}
      <GlassCard>
        <GlassCardHeader>
          <GlassCardTitle className="text-lg">Business Profile</GlassCardTitle>
          <GlassCardDescription>Contact and location information</GlassCardDescription>
        </GlassCardHeader>
        <GlassCardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="min-w-0">
              <Label className="flex items-center gap-2">
                <Building2 className="h-4 w-4 flex-shrink-0" />
                Business Name
              </Label>
              {isEditing ? (
                <Input
                  data-testid="input-business-name"
                  value={formData.businessName}
                  onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/60"
                />
              ) : (
                <p className="text-sm mt-1 truncate">{formData.businessName || '-'}</p>
              )}
            </div>
            <div className="min-w-0">
              <Label className="flex items-center gap-2">
                <Phone className="h-4 w-4 flex-shrink-0" />
                Phone
              </Label>
              {isEditing ? (
                <Input
                  data-testid="input-phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/60"
                />
              ) : (
                <p className="text-sm mt-1 truncate">{formData.phone || '-'}</p>
              )}
            </div>
            <div className="min-w-0">
              <Label className="flex items-center gap-2">
                <Mail className="h-4 w-4 flex-shrink-0" />
                Email
              </Label>
              {isEditing ? (
                <Input
                  data-testid="input-email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/60"
                />
              ) : (
                <p className="text-sm mt-1 truncate">{formData.email || '-'}</p>
              )}
            </div>
            <div className="min-w-0">
              <Label className="flex items-center gap-2">
                <Globe className="h-4 w-4 flex-shrink-0" />
                Website
              </Label>
              {isEditing ? (
                <Input
                  data-testid="input-website"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/60"
                />
              ) : (
                <p className="text-sm mt-1 truncate">{formData.website || '-'}</p>
              )}
            </div>
          </div>
          <div>
            <Label className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Location
            </Label>
            {isEditing ? (
              <Input
                data-testid="input-location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="bg-white/5 border-white/10 text-white placeholder:text-white/60"
              />
            ) : (
              <p className="text-sm mt-1">{formData.location || '-'}</p>
            )}
          </div>
          <div>
            <Label className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Business Hours
            </Label>
            {isEditing ? (
              <Textarea
                data-testid="input-hours"
                value={formData.hours}
                onChange={(e) => setFormData({ ...formData, hours: e.target.value })}
                placeholder="Monday: 9am-5pm&#10;Tuesday: 9am-5pm&#10;..."
                rows={4}
                className="bg-white/5 border-white/10 text-white placeholder:text-white/60"
              />
            ) : (
              <pre className="text-sm mt-1 whitespace-pre-wrap">{formData.hours || '-'}</pre>
            )}
          </div>
          <div>
            <Label>Services</Label>
            {isEditing ? (
              <Textarea
                data-testid="input-services"
                value={formData.services}
                onChange={(e) => setFormData({ ...formData, services: e.target.value })}
                placeholder="Service 1, Service 2, Service 3"
                rows={2}
                className="bg-white/5 border-white/10 text-white placeholder:text-white/60"
              />
            ) : (
              <p className="text-sm mt-1 text-white">{formData.services || '-'}</p>
            )}
          </div>
        </GlassCardContent>
      </GlassCard>

      {/* AI Settings */}
      <GlassCard>
        <GlassCardHeader>
          <GlassCardTitle className="text-lg">AI Behavior</GlassCardTitle>
          <GlassCardDescription>Configure how your bot communicates</GlassCardDescription>
        </GlassCardHeader>
        <GlassCardContent className="space-y-4">
          {/* Tone & Voice Controls */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Tone / Voice</Label>
              {isEditing ? (
                <Select
                  value={formData.tone}
                  onValueChange={(value) => setFormData({ ...formData, tone: value })}
                >
                  <SelectTrigger data-testid="select-tone" className="bg-white/5 border-white/10 text-white">
                    <SelectValue placeholder="Select tone" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1f2e] border-white/10 text-white">
                    {TONE_OPTIONS.map(option => (
                      <SelectItem key={option.value} value={option.value} className="text-white focus:bg-white/10 focus:text-white">
                        <span>{option.label}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-sm mt-1">{TONE_OPTIONS.find(t => t.value === formData.tone)?.label || 'Professional'}</p>
              )}
              <p className="text-xs text-white/40 mt-1">
                {TONE_OPTIONS.find(t => t.value === formData.tone)?.description}
              </p>
            </div>
            <div>
              <Label>Response Length</Label>
              {isEditing ? (
                <Select
                  value={formData.responseLength}
                  onValueChange={(value) => setFormData({ ...formData, responseLength: value })}
                >
                  <SelectTrigger data-testid="select-response-length" className="bg-white/5 border-white/10 text-white">
                    <SelectValue placeholder="Select length" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1f2e] border-white/10 text-white">
                    <SelectItem value="brief" className="text-white focus:bg-white/10 focus:text-white">Brief (1-2 sentences)</SelectItem>
                    <SelectItem value="medium" className="text-white focus:bg-white/10 focus:text-white">Medium (3-4 sentences)</SelectItem>
                    <SelectItem value="detailed" className="text-white focus:bg-white/10 focus:text-white">Detailed (5+ sentences)</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-sm mt-1 capitalize">{formData.responseLength}</p>
              )}
            </div>
          </div>

          <div>
            <Label>System Prompt</Label>
            {isEditing ? (
              <Textarea
                data-testid="input-system-prompt"
                value={formData.systemPrompt}
                onChange={(e) => setFormData({ ...formData, systemPrompt: e.target.value })}
                rows={8}
                className="font-mono text-sm bg-white/5 border-white/10 text-white placeholder:text-white/60"
              />
            ) : (
              <pre className="text-sm mt-1 whitespace-pre-wrap bg-white/5 p-3 rounded-lg max-h-48 overflow-auto text-white/85">
                {formData.systemPrompt || 'No system prompt configured'}
              </pre>
            )}
          </div>
        </GlassCardContent>
      </GlassCard>

      {/* FAQs - Editable */}
      <GlassCard>
        <GlassCardHeader>
          <div className="flex items-center justify-between">
            <div>
              <GlassCardTitle className="text-lg">FAQs ({faqs.length})</GlassCardTitle>
              <GlassCardDescription>Common questions and answers</GlassCardDescription>
            </div>
            {isEditing && (
              <Button
                data-testid="button-add-faq"
                variant="outline"
                size="sm"
                onClick={() => setShowAddFaq(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add FAQ
              </Button>
            )}
          </div>
        </GlassCardHeader>
        <GlassCardContent>
          {/* Add New FAQ Form */}
          {showAddFaq && (
            <div className="bg-white/5 border border-white/10 p-4 rounded-lg mb-4 space-y-3">
              <div>
                <Label>Question</Label>
                <Input
                  data-testid="input-new-faq-question"
                  value={newFaq.question}
                  onChange={(e) => setNewFaq({ ...newFaq, question: e.target.value })}
                  placeholder="Enter the question..."
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/60"
                />
              </div>
              <div>
                <Label>Answer</Label>
                <Textarea
                  data-testid="input-new-faq-answer"
                  value={newFaq.answer}
                  onChange={(e) => setNewFaq({ ...newFaq, answer: e.target.value })}
                  placeholder="Enter the answer..."
                  rows={3}
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/60"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  data-testid="button-save-new-faq"
                  size="sm"
                  onClick={handleAddFaq}
                  disabled={!newFaq.question.trim() || !newFaq.answer.trim()}
                >
                  Add
                </Button>
                <Button
                  data-testid="button-cancel-new-faq"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowAddFaq(false);
                    setNewFaq({ question: '', answer: '' });
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {faqs.length === 0 ? (
            <div className="text-center py-6">
              <FileText className="h-8 w-8 mx-auto mb-2 text-white/30" />
              <p className="text-sm text-white/40">
                No FAQs configured. {isEditing && 'Click "Add FAQ" to create one.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-80 overflow-auto">
              {faqs.map((faq, i) => (
                <div key={i} className="bg-white/5 border border-white/10 p-3 rounded-lg">
                  {editingFaqIndex === i && isEditing ? (
                    <div className="space-y-2">
                      <Input
                        data-testid={`input-faq-question-${i}`}
                        value={faq.question}
                        onChange={(e) => handleUpdateFaq(i, 'question', e.target.value)}
                        placeholder="Question"
                        className="bg-white/5 border-white/10 text-white placeholder:text-white/60"
                      />
                      <Textarea
                        data-testid={`input-faq-answer-${i}`}
                        value={faq.answer}
                        onChange={(e) => handleUpdateFaq(i, 'answer', e.target.value)}
                        placeholder="Answer"
                        rows={3}
                        className="bg-white/5 border-white/10 text-white placeholder:text-white/60"
                      />
                      <div className="flex gap-2">
                        <Button
                          data-testid={`button-done-faq-${i}`}
                          size="sm"
                          onClick={() => setEditingFaqIndex(null)}
                        >
                          Done
                        </Button>
                        <Button
                          data-testid={`button-delete-faq-${i}`}
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteFaq(i)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1">
                        <p className="font-medium text-sm text-white">{faq.question}</p>
                        <p className="text-sm text-white/55 mt-1">{faq.answer}</p>
                      </div>
                      {isEditing && (
                        <Button
                          data-testid={`button-edit-faq-${i}`}
                          variant="ghost"
                          size="icon"
                          onClick={() => setEditingFaqIndex(i)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </GlassCardContent>
      </GlassCard>

      {/* Faith House Feature Gating - Only for sober_living clients */}
      {clientType === 'sober_living' && (
        <GlassCard className="border-cyan-400/30">
          <GlassCardHeader>
            <GlassCardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-cyan-400" />
              Faith House Features
            </GlassCardTitle>
            <GlassCardDescription>Special features for sober living facilities</GlassCardDescription>
          </GlassCardHeader>
          <GlassCardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <GlassCard>
                <GlassCardHeader className="pb-2">
                  <GlassCardTitle className="text-sm">Crisis Detection</GlassCardTitle>
                </GlassCardHeader>
                <GlassCardContent>
                  <p className="text-sm text-white/55">
                    Automatic detection and response for crisis situations with 988 Suicide & Crisis Lifeline integration.
                  </p>
                  <Badge className="mt-2 bg-green-500/20 text-green-400 border border-green-500/30">Enabled</Badge>
                </GlassCardContent>
              </GlassCard>
              <GlassCard>
                <GlassCardHeader className="pb-2">
                  <GlassCardTitle className="text-sm">Pre-Intake Forms</GlassCardTitle>
                </GlassCardHeader>
                <GlassCardContent>
                  <p className="text-sm text-white/55">
                    Collect sobriety status, support network, and timeline before booking tours.
                  </p>
                  <Badge className="mt-2 bg-green-500/20 text-green-400 border border-green-500/30">Enabled</Badge>
                </GlassCardContent>
              </GlassCard>
              <GlassCard>
                <GlassCardHeader className="pb-2">
                  <GlassCardTitle className="text-sm">Appointment Booking</GlassCardTitle>
                </GlassCardHeader>
                <GlassCardContent>
                  <p className="text-sm text-white/55">
                    Allow visitors to schedule tours and intake appointments directly through chat.
                  </p>
                  <Badge className="mt-2 bg-green-500/20 text-green-400 border border-green-500/30">Enabled</Badge>
                </GlassCardContent>
              </GlassCard>
              <GlassCard>
                <GlassCardHeader className="pb-2">
                  <GlassCardTitle className="text-sm">Privacy Protection</GlassCardTitle>
                </GlassCardHeader>
                <GlassCardContent>
                  <p className="text-sm text-white/55">
                    Automatic PII redaction from conversation logs and analytics.
                  </p>
                  <Badge className="mt-2 bg-green-500/20 text-green-400 border border-green-500/30">Enabled</Badge>
                </GlassCardContent>
              </GlassCard>
            </div>

            {/* Crisis Keywords */}
            {bot.rules?.crisisHandling?.onCrisisKeywords && bot.rules.crisisHandling.onCrisisKeywords.length > 0 && (
              <div>
                <Label className="text-white/55">Crisis Detection Keywords</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {bot.rules.crisisHandling.onCrisisKeywords.map((keyword, i) => (
                    <Badge key={i} className="bg-red-500/10 text-red-400 border border-red-500/30">{keyword}</Badge>
                  ))}
                </div>
              </div>
            )}
          </GlassCardContent>
        </GlassCard>
      )}
    </div>
  );
}

// Analytics Panel
function AnalyticsPanel({ clientId }: { clientId: string }) {
  const { data: analytics, isLoading } = useQuery({
    queryKey: ["/api/client/analytics/summary", clientId],
    queryFn: async () => {
      const response = await fetch(`/api/client/analytics/summary?clientId=${clientId}`, { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch analytics");
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <GlassCard key={i}>
              <div className="p-6 animate-pulse">
                <div className="h-4 bg-white/10 rounded w-24 mb-2" />
                <div className="h-6 bg-white/10 rounded w-16" />
              </div>
            </GlassCard>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <GlassCard>
          <GlassCardHeader className="pb-2">
            <GlassCardTitle className="text-sm font-medium text-white/55">Messages (7d)</GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent>
            <div className="text-2xl font-bold text-white">{analytics?.messagesLast7d || 0}</div>
          </GlassCardContent>
        </GlassCard>
        <GlassCard>
          <GlassCardHeader className="pb-2">
            <GlassCardTitle className="text-sm font-medium text-white/55">Conversations</GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent>
            <div className="text-2xl font-bold text-white">{analytics?.conversations || 0}</div>
          </GlassCardContent>
        </GlassCard>
        <GlassCard>
          <GlassCardHeader className="pb-2">
            <GlassCardTitle className="text-sm font-medium text-white/55">Leads (7d)</GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent>
            <div className="text-2xl font-bold text-white">{analytics?.leadsLast7d || 0}</div>
          </GlassCardContent>
        </GlassCard>
        <GlassCard>
          <GlassCardHeader className="pb-2">
            <GlassCardTitle className="text-sm font-medium text-white/55">Bookings (7d)</GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent>
            <div className="text-2xl font-bold text-white">{analytics?.bookingsLast7d || 0}</div>
          </GlassCardContent>
        </GlassCard>
      </div>

      <GlassCard>
        <GlassCardHeader>
          <GlassCardTitle>Analytics Dashboard</GlassCardTitle>
          <GlassCardDescription>View detailed analytics in the client dashboard</GlassCardDescription>
        </GlassCardHeader>
        <GlassCardContent>
          <Button variant="outline" onClick={() => window.open(`/client/dashboard?clientId=${clientId}`, '_blank')} className="border-white/10 text-white/85 hover:bg-white/10 hover:text-white">
            <ExternalLink className="h-4 w-4 mr-2" />
            Open Full Analytics
          </Button>
        </GlassCardContent>
      </GlassCard>
    </div>
  );
}

// Automations Panel - Quick access to bot automations
function AutomationsPanel({ botId, clientId }: { botId: string; clientId: string }) {
  const [, setLocation] = useLocation();
  
  // Get the bot's database ID first
  const { data: botData } = useQuery<{ id: number }>({
    queryKey: ["/api/bots", botId],
    queryFn: async () => {
      const response = await fetch(`/api/bots/${botId}`, { credentials: "include" });
      if (!response.ok) throw new Error("Bot not found");
      return response.json();
    },
  });

  // Fetch automations for this bot
  const { data: automations, isLoading } = useQuery<Array<{
    id: number;
    name: string;
    isEnabled: boolean;
    triggerType: string;
    runCount: number;
    lastRunAt?: string;
  }>>({
    queryKey: ["/api/automations", botData?.id],
    queryFn: async () => {
      if (!botData?.id) return [];
      const response = await fetch(`/api/automations?botId=${botData.id}`, { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch automations");
      return response.json();
    },
    enabled: !!botData?.id,
  });

  const getTriggerLabel = (type: string) => {
    const labels: Record<string, string> = {
      keyword: 'Keyword Match',
      schedule: 'Scheduled',
      inactivity: 'Inactivity',
      message_count: 'Message Count',
      lead_captured: 'Lead Captured',
      appointment_booked: 'Appointment Booked',
    };
    return labels[type] || type;
  };

  if (isLoading) {
    return (
      <GlassCard>
        <div className="p-6 animate-pulse">
          <div className="h-5 bg-white/10 rounded w-32 mb-4" />
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-12 bg-white/10 rounded" />
            ))}
          </div>
        </div>
      </GlassCard>
    );
  }

  return (
    <div className="space-y-4">
      <GlassCard>
        <GlassCardHeader>
          <GlassCardTitle>Automation Workflows</GlassCardTitle>
          <GlassCardDescription>Configure automated responses and actions</GlassCardDescription>
        </GlassCardHeader>
        <GlassCardContent>
          {automations && automations.length > 0 ? (
            <div className="space-y-3">
              {automations.map((automation) => (
                <div key={automation.id} className="flex items-center justify-between p-3 border border-white/10 rounded-lg bg-white/5">
                  <div className="flex items-center gap-3">
                    <div className={`h-2 w-2 rounded-full ${automation.isEnabled ? 'bg-green-400' : 'bg-white/30'}`} />
                    <div>
                      <p className="font-medium text-white">{automation.name}</p>
                      <div className="flex items-center gap-2 text-xs text-white/55">
                        <Badge className="text-xs bg-white/10 text-white/70 border-white/20">{getTriggerLabel(automation.triggerType)}</Badge>
                        <span>{automation.runCount} runs</span>
                      </div>
                    </div>
                  </div>
                  <Badge className={automation.isEnabled ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-white/10 text-white/50 border-white/20'}>
                    {automation.isEnabled ? 'Active' : 'Paused'}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Workflow className="h-8 w-8 mx-auto mb-2 text-white/30" />
              <p className="text-white/40">No automations configured</p>
            </div>
          )}
        </GlassCardContent>
      </GlassCard>

      <Button 
        variant="outline" 
        onClick={() => setLocation(`/admin/bot/${botId}/automations`)}
        className="w-full border-white/10 text-white/85 hover:bg-white/10 hover:text-white"
        data-testid="button-open-automations"
      >
        <Workflow className="h-4 w-4 mr-2" />
        Open Automations Manager
        <ExternalLink className="h-4 w-4 ml-2" />
      </Button>
    </div>
  );
}

// Widget Settings Panel - Quick access to widget customization
function WidgetSettingsPanel({ botId, clientId }: { botId: string; clientId: string }) {
  const [, setLocation] = useLocation();
  
  // Get the bot's database ID first
  const { data: botData } = useQuery<{ id: number }>({
    queryKey: ["/api/bots", botId],
    queryFn: async () => {
      const response = await fetch(`/api/bots/${botId}`, { credentials: "include" });
      if (!response.ok) throw new Error("Bot not found");
      return response.json();
    },
  });

  // Fetch widget settings for this bot
  const { data: widgetSettings, isLoading } = useQuery<{
    themeMode: string;
    primaryColor: string;
    position: string;
    bubbleSize: string;
    soundEnabled: boolean;
    autoOpenDelay?: number;
  }>({
    queryKey: ["/api/widget-settings", botData?.id],
    queryFn: async () => {
      if (!botData?.id) return null;
      const response = await fetch(`/api/widget-settings/${botData.id}`, { credentials: "include" });
      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error("Failed to fetch widget settings");
      }
      return response.json();
    },
    enabled: !!botData?.id,
  });

  if (isLoading) {
    return (
      <GlassCard>
        <div className="p-6 animate-pulse">
          <div className="h-5 bg-white/10 rounded w-32 mb-4" />
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-12 bg-white/10 rounded" />
            ))}
          </div>
        </div>
      </GlassCard>
    );
  }

  return (
    <div className="space-y-4">
      <GlassCard>
        <GlassCardHeader>
          <GlassCardTitle>Widget Appearance</GlassCardTitle>
          <GlassCardDescription>Customize how the chat widget looks and behaves</GlassCardDescription>
        </GlassCardHeader>
        <GlassCardContent>
          {widgetSettings ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 border border-white/10 rounded-lg bg-white/5">
                  <p className="text-xs text-white/55 mb-1">Theme</p>
                  <p className="font-medium text-white capitalize">{widgetSettings.themeMode || 'Auto'}</p>
                </div>
                <div className="p-3 border border-white/10 rounded-lg bg-white/5">
                  <p className="text-xs text-white/55 mb-1">Position</p>
                  <p className="font-medium text-white capitalize">{widgetSettings.position?.replace('-', ' ') || 'Bottom Right'}</p>
                </div>
                <div className="p-3 border border-white/10 rounded-lg bg-white/5">
                  <p className="text-xs text-white/55 mb-1">Bubble Size</p>
                  <p className="font-medium text-white capitalize">{widgetSettings.bubbleSize || 'Medium'}</p>
                </div>
                <div className="p-3 border border-white/10 rounded-lg bg-white/5">
                  <p className="text-xs text-white/55 mb-1">Primary Color</p>
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 rounded-full border border-white/20" style={{ backgroundColor: widgetSettings.primaryColor || '#4FC3F7' }} />
                    <span className="font-medium text-white">{widgetSettings.primaryColor || '#4FC3F7'}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm text-white/70">
                <div className="flex items-center gap-2">
                  <div className={`h-2 w-2 rounded-full ${widgetSettings.soundEnabled ? 'bg-green-400' : 'bg-white/30'}`} />
                  Sound {widgetSettings.soundEnabled ? 'On' : 'Off'}
                </div>
                {widgetSettings.autoOpenDelay && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-3 w-3" />
                    Auto-open after {widgetSettings.autoOpenDelay}s
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Palette className="h-8 w-8 mx-auto mb-2 text-white/30" />
              <p className="text-white/40">Using default widget settings</p>
            </div>
          )}
        </GlassCardContent>
      </GlassCard>

      <Button 
        variant="outline" 
        onClick={() => setLocation(`/admin/bot/${botId}/widget-settings`)}
        className="w-full border-white/10 text-white/85 hover:bg-white/10 hover:text-white"
        data-testid="button-open-widget-customizer"
      >
        <Palette className="h-4 w-4 mr-2" />
        Open Widget Customizer
        <ExternalLink className="h-4 w-4 ml-2" />
      </Button>
    </div>
  );
}

// Logs Panel
function LogsPanel({ clientId, botId }: { clientId: string; botId: string }) {
  const { data: logs, isLoading } = useQuery({
    queryKey: ["/api/platform/logs", clientId],
    queryFn: async () => {
      const response = await fetch(`/api/platform/logs/${clientId}`, { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch logs");
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <GlassCard>
        <div className="p-6 animate-pulse">
          <div className="h-5 bg-white/10 rounded w-32 mb-4" />
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-12 bg-white/10 rounded" />
            ))}
          </div>
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard>
      <GlassCardHeader>
        <GlassCardTitle>Conversation Logs</GlassCardTitle>
        <GlassCardDescription>Recent conversation activity for {botId}</GlassCardDescription>
      </GlassCardHeader>
      <GlassCardContent>
        {logs?.files && logs.files.length > 0 ? (
          <div className="space-y-2">
            {logs.files.map((file: string, i: number) => (
              <div key={i} className="flex items-center justify-between p-3 border border-white/10 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                <span className="font-mono text-sm text-white/85">{file}</span>
                <Button variant="ghost" size="sm" className="text-white/55 hover:text-white hover:bg-white/10">
                  <Eye className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <MessageSquare className="h-8 w-8 mx-auto mb-2 text-white/30" />
            <p className="text-white/40">No log files found</p>
          </div>
        )}
      </GlassCardContent>
    </GlassCard>
  );
}

// Create from Template Modal
function CreateFromTemplateModal({
  open,
  onOpenChange,
  template: initialTemplate,
  templates,
  onSelectTemplate,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: Template | null;
  templates?: Template[];
  onSelectTemplate?: (template: Template) => void;
  onSuccess: (botId: string) => void;
}) {
  const { toast } = useToast();
  const [step, setStep] = useState(0); // 0 = template selection, 1-3 = form steps
  const [localTemplate, setLocalTemplate] = useState<Template | null>(null);
  const [formData, setFormData] = useState({
    clientId: '',
    clientName: '',
    businessName: '',
    phone: '',
    email: '',
    website: '',
    location: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    hours: '',
    services: '',
    customFaq: { question: '', answer: '' },
    serviceTier: 'standard',
    billingPlan: 'monthly',
  });

  // Track if this is the first open or a reopen to preserve progress
  const [wasOpened, setWasOpened] = useState(false);
  
  // Initialize state only on first open, preserve progress on reopen
  useEffect(() => {
    if (open && !wasOpened) {
      // First time opening: initialize with pre-selected template if provided
      setLocalTemplate(initialTemplate);
      setStep(initialTemplate ? 1 : 0);
      setFormData({
        clientId: '',
        clientName: '',
        businessName: '',
        phone: '',
        email: '',
        website: '',
        location: '',
        address: '',
        city: '',
        state: '',
        zip: '',
        contactName: '',
        contactEmail: '',
        contactPhone: '',
        hours: '',
        services: '',
        customFaq: { question: '', answer: '' },
        serviceTier: 'standard',
        billingPlan: 'monthly',
      });
      setWasOpened(true);
    }
  }, [open, wasOpened, initialTemplate]);
  
  // Reset wasOpened flag after success so next open is fresh
  const resetWizard = useCallback(() => {
    setWasOpened(false);
    setLocalTemplate(null);
    setStep(0);
    setFormData({
      clientId: '',
      clientName: '',
      businessName: '',
      phone: '',
      email: '',
      website: '',
      location: '',
      address: '',
      city: '',
      state: '',
      zip: '',
      contactName: '',
      contactEmail: '',
      contactPhone: '',
      hours: '',
      services: '',
      customFaq: { question: '', answer: '' },
      serviceTier: 'standard',
      billingPlan: 'monthly',
    });
  }, []);
  
  // Use local template for the wizard (doesn't reset on parent re-renders)
  const template = localTemplate;

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const fullLocation = [data.address, data.city, data.state, data.zip].filter(Boolean).join(', ') || data.location;
      const customFaqs = data.customFaq.question && data.customFaq.answer 
        ? [{ question: data.customFaq.question, answer: data.customFaq.answer }]
        : [];
      const response = await apiRequest("POST", "/api/super-admin/clients/from-template", {
        templateBotId: template?.botId,
        clientId: data.clientId,
        clientName: data.clientName,
        type: template?.businessProfile?.type || template?.metadata?.templateCategory,
        businessProfile: {
          businessName: data.businessName || data.clientName,
          type: template?.businessProfile?.type || template?.metadata?.templateCategory,
          phone: data.phone,
          email: data.email,
          website: data.website,
          location: fullLocation,
          address: data.address,
          city: data.city,
          state: data.state,
          zip: data.zip,
          hours: data.hours ? parseHoursFromString(data.hours) : undefined,
          services: data.services ? data.services.split(',').map(s => s.trim()).filter(Boolean) : undefined,
        },
        contact: {
          name: data.contactName,
          email: data.contactEmail,
          phone: data.contactPhone,
        },
        billing: {
          serviceTier: data.serviceTier,
          billingPlan: data.billingPlan,
        },
        customFaqs,
      });
      return response.json();
    },
    onSuccess: (data) => {
      toast({ title: "Bot Created", description: `Successfully created: ${formData.clientName}` });
      resetWizard(); // Reset wizard state for next use
      onSuccess(data.botId || `${formData.clientId}_bot`);
      
      // PDF requirement: "Stripe link generated" - redirect to checkout if available
      if (data.checkoutUrl) {
        toast({ 
          title: "Billing Setup", 
          description: "Redirecting to Stripe checkout...",
        });
        setTimeout(() => {
          window.open(data.checkoutUrl, '_blank');
        }, 1000);
      }
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to create bot.", 
        variant: "destructive" 
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1) {
      if (!formData.clientId || !formData.clientName) {
        toast({ title: "Error", description: "Client ID and Business Name are required.", variant: "destructive" });
        return;
      }
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleBack = () => {
    if (step === 1 && templates && templates.length > 0) {
      setStep(0); // Go back to template selection
    } else if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSelectTemplate = (t: Template) => {
    // When user selects template from the grid, update local state and advance to step 1
    setLocalTemplate(t);
    setStep(1);
    // Also notify parent for any external tracking
    onSelectTemplate?.(t);
  };

  const generateClientId = () => {
    const id = formData.clientName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_|_$/g, '');
    setFormData({ ...formData, clientId: id });
  };

  // Show nothing if closed and no templates available
  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-[#1a1f2e] border-white/10 text-white">
        {step === 0 ? (
          /* Template Selection Step */
          <>
            <DialogHeader>
              <DialogTitle className="text-white">Choose a Template</DialogTitle>
              <DialogDescription className="text-white/60">
                Select a business type to start with pre-configured settings
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-3 mt-4 max-h-[400px] overflow-y-auto">
              {templates?.map((t) => (
                <div
                  key={t.botId}
                  className="cursor-pointer bg-white/5 border border-white/10 rounded-lg p-4 text-center hover:bg-white/10 transition-all"
                  onClick={() => handleSelectTemplate(t)}
                  data-testid={`template-select-${t.botId}`}
                >
                  <Building2 className="h-8 w-8 mx-auto mb-2 text-cyan-400" />
                  <p className="font-medium text-sm text-white capitalize">
                    {(t.metadata?.templateCategory || t.businessProfile?.type || t.name || '').replace(/_/g, ' ')}
                  </p>
                </div>
              ))}
            </div>
          </>
        ) : (
          /* Form Steps */
          <>
            <DialogHeader>
              <DialogTitle className="text-white">
                Create New Bot - Step {step} of 3
                {template && (
                  <Badge variant="outline" className="ml-2 text-xs border-white/20 text-white/80">
                    {(template.metadata?.templateCategory || template.businessProfile?.type || '').replace(/_/g, ' ')}
                  </Badge>
                )}
              </DialogTitle>
              <DialogDescription className="text-white/60">
                {step === 1 && "Basic business information"}
                {step === 2 && "Contact and location details"}
                {step === 3 && "Service tier and billing"}
              </DialogDescription>
            </DialogHeader>

            {/* Progress Indicator */}
            <div className="flex gap-2 mb-4">
              {[1, 2, 3].map((s) => (
                <div
                  key={s}
                  className={`h-2 flex-1 rounded-full ${s <= step ? 'bg-cyan-400' : 'bg-white/10'}`}
                />
              ))}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Step 1: Basic Info */}
              {step === 1 && (
                <div className="space-y-4">
                  <div>
                    <Label className="text-white/80">Business Name *</Label>
                    <Input
                      data-testid="input-new-client-name"
                      value={formData.clientName}
                      onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                      placeholder="My Business Name"
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
                    />
                  </div>
                  <div>
                    <Label className="text-white/80">Client ID *</Label>
                    <div className="flex gap-2">
                      <Input
                        data-testid="input-new-client-id"
                        value={formData.clientId}
                        onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                        placeholder="my_business"
                        className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
                      />
                      <Button type="button" variant="outline" onClick={generateClientId} className="border-white/20 text-white hover:bg-white/10">
                        Generate
                      </Button>
                    </div>
                    <p className="text-xs text-white/40 mt-1">Unique identifier (lowercase, underscores only)</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-white/80">Business Phone</Label>
                      <Input
                        data-testid="input-new-phone"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="(555) 123-4567"
                        className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
                      />
                    </div>
                    <div>
                      <Label className="text-white/80">Business Email</Label>
                      <Input
                        data-testid="input-new-email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="contact@business.com"
                        className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-white/80">Website</Label>
                    <Input
                      data-testid="input-new-website"
                      value={formData.website}
                      onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                      placeholder="https://mybusiness.com"
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
                    />
                  </div>
                </div>
              )}

              {/* Step 2: Address & Contact */}
              {step === 2 && (
                <div className="space-y-4">
                  <div>
                    <Label className="text-white/80">Street Address</Label>
                    <Input
                      data-testid="input-new-address"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="123 Main Street"
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label className="text-white/80">City</Label>
                      <Input
                        data-testid="input-new-city"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        placeholder="City"
                        className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
                      />
                    </div>
                    <div>
                      <Label className="text-white/80">State</Label>
                      <Input
                        data-testid="input-new-state"
                        value={formData.state}
                        onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                        placeholder="FL"
                        className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
                      />
                    </div>
                    <div>
                      <Label className="text-white/80">ZIP</Label>
                      <Input
                        data-testid="input-new-zip"
                        value={formData.zip}
                        onChange={(e) => setFormData({ ...formData, zip: e.target.value })}
                        placeholder="34990"
                        className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
                      />
                    </div>
                  </div>
                  <Separator className="bg-white/10" />
                  <p className="text-sm font-medium text-white/80">Primary Contact</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <Label className="text-white/80">Contact Name</Label>
                      <Input
                        data-testid="input-new-contact-name"
                        value={formData.contactName}
                        onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                        placeholder="John Smith"
                        className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
                      />
                    </div>
                    <div>
                      <Label className="text-white/80">Contact Email</Label>
                      <Input
                        data-testid="input-new-contact-email"
                        value={formData.contactEmail}
                        onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                        placeholder="john@business.com"
                        className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
                      />
                    </div>
                    <div>
                      <Label className="text-white/80">Contact Phone</Label>
                      <Input
                        data-testid="input-new-contact-phone"
                        value={formData.contactPhone}
                        onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                        placeholder="(555) 123-4567"
                        className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
                      />
                    </div>
                  </div>
                  <Separator className="bg-white/10" />
                  <p className="text-sm font-medium text-white/80">Business Details</p>
                  <div>
                    <Label className="text-white/80">Business Hours</Label>
                    <Textarea
                      data-testid="input-new-hours"
                      value={formData.hours}
                      onChange={(e) => setFormData({ ...formData, hours: e.target.value })}
                      placeholder="Monday-Friday: 9am-5pm&#10;Saturday: 10am-2pm&#10;Sunday: Closed"
                      rows={3}
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
                    />
                    <p className="text-xs text-white/40 mt-1">One schedule per line</p>
                  </div>
                  <div>
                    <Label className="text-white/80">Services Offered</Label>
                    <Textarea
                      data-testid="input-new-services"
                      value={formData.services}
                      onChange={(e) => setFormData({ ...formData, services: e.target.value })}
                      placeholder="Service 1, Service 2, Service 3"
                      rows={2}
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
                    />
                    <p className="text-xs text-white/40 mt-1">Comma-separated list</p>
                  </div>
                  <div>
                    <Label className="text-white/80">Custom FAQ (Optional)</Label>
                    <Input
                      data-testid="input-new-faq-q"
                      value={formData.customFaq.question}
                      onChange={(e) => setFormData({ ...formData, customFaq: { ...formData.customFaq, question: e.target.value } })}
                      placeholder="Question"
                      className="mb-2 bg-white/5 border-white/10 text-white placeholder:text-white/40"
                    />
                    <Textarea
                      data-testid="input-new-faq-a"
                      value={formData.customFaq.answer}
                      onChange={(e) => setFormData({ ...formData, customFaq: { ...formData.customFaq, answer: e.target.value } })}
                      placeholder="Answer"
                      rows={2}
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
                    />
                  </div>
                </div>
              )}

              {/* Step 3: Service & Billing */}
              {step === 3 && (
                <div className="space-y-4">
                  <div>
                    <Label className="text-white/80">Service Tier</Label>
                    <Select
                      value={formData.serviceTier}
                      onValueChange={(value) => setFormData({ ...formData, serviceTier: value })}
                    >
                      <SelectTrigger data-testid="select-service-tier" className="bg-white/5 border-white/10 text-white">
                        <SelectValue placeholder="Select tier" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1a1f2e] border-white/10">
                        <SelectItem value="starter" className="text-white focus:bg-white/10 focus:text-white">Starter - Basic chatbot features</SelectItem>
                        <SelectItem value="standard" className="text-white focus:bg-white/10 focus:text-white">Standard - Full features + analytics</SelectItem>
                        <SelectItem value="premium" className="text-white focus:bg-white/10 focus:text-white">Premium - Everything + priority support</SelectItem>
                        <SelectItem value="enterprise" className="text-white focus:bg-white/10 focus:text-white">Enterprise - Custom solutions</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-white/80">Billing Plan</Label>
                    <Select
                      value={formData.billingPlan}
                      onValueChange={(value) => setFormData({ ...formData, billingPlan: value })}
                    >
                      <SelectTrigger data-testid="select-billing-plan" className="bg-white/5 border-white/10 text-white">
                        <SelectValue placeholder="Select plan" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1a1f2e] border-white/10">
                        <SelectItem value="monthly" className="text-white focus:bg-white/10 focus:text-white">Monthly - Billed each month</SelectItem>
                        <SelectItem value="annual" className="text-white focus:bg-white/10 focus:text-white">Annual - 2 months free</SelectItem>
                        <SelectItem value="trial" className="text-white focus:bg-white/10 focus:text-white">Free Trial - 14 days</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                    <p className="text-sm font-medium mb-2 text-white">Summary</p>
                    <ul className="text-sm text-white/55 space-y-1">
                      <li>Business: {formData.clientName || '-'}</li>
                      <li>Type: {(template?.metadata?.templateCategory || template?.businessProfile?.type || 'Custom').replace(/_/g, ' ')}</li>
                      <li>Tier: {formData.serviceTier}</li>
                      <li>Billing: {formData.billingPlan}</li>
                    </ul>
                  </div>
                </div>
              )}

              <DialogFooter className="flex justify-between">
                <div>
                  {step > 1 && (
                    <Button type="button" variant="outline" onClick={handleBack} className="border-white/20 text-white hover:bg-white/10">
                      Back
                    </Button>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="border-white/20 text-white hover:bg-white/10">
                    Cancel
                  </Button>
                  <Button 
                    data-testid="button-next-step"
                    type="submit" 
                    disabled={createMutation.isPending || !template}
                    className="bg-cyan-500 text-white hover:bg-cyan-600"
                  >
                    {step < 3 ? 'Next' : (createMutation.isPending ? 'Creating...' : 'Create Bot')}
                  </Button>
                </div>
              </DialogFooter>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

// Install Panel - Embed code generator for widget installation
function InstallPanel({ bot, client }: { bot: BotConfig; client: Client }) {
  const [copied, setCopied] = useState(false);
  const [position, setPosition] = useState("bottom-right");
  const [primaryColor, setPrimaryColor] = useState("#2563eb");
  const [greeting, setGreeting] = useState(`Hi! How can I help you today?`);
  
  const baseUrl = window.location.origin;
  
  const embedCode = `<script
  src="${baseUrl}/widget/embed.js"
  data-client-id="${client.id}"
  data-bot-id="${bot.botId}"
  data-primary-color="${primaryColor}"
  data-position="${position}"
  data-greeting="${greeting}"
></script>`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(embedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <div className="space-y-6">
      <GlassCard>
        <GlassCardHeader>
          <GlassCardTitle className="flex items-center gap-2">
            <Code className="h-5 w-5" />
            Widget Installation
          </GlassCardTitle>
          <GlassCardDescription>
            Add the chatbot to your website by copying this code snippet
          </GlassCardDescription>
        </GlassCardHeader>
        <GlassCardContent className="space-y-6">
          {/* Customization Options */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label className="text-sm text-white/70">Position</Label>
              <Select value={position} onValueChange={setPosition}>
                <SelectTrigger 
                  data-testid="select-widget-position"
                  className="bg-white/5 border-white/10 text-white hover:bg-white/10 focus:ring-emerald-500/30"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-white/10">
                  <SelectItem value="bottom-right">Bottom Right</SelectItem>
                  <SelectItem value="bottom-left">Bottom Left</SelectItem>
                  <SelectItem value="top-right">Top Right</SelectItem>
                  <SelectItem value="top-left">Top Left</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm text-white/70">Primary Color</Label>
              <div className="flex gap-2 items-center">
                <div className="relative">
                  <Input
                    data-testid="input-widget-color"
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-12 h-10 p-1 cursor-pointer bg-transparent border-white/10 rounded-md"
                  />
                </div>
                <Input
                  data-testid="input-widget-color-text"
                  type="text"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="flex-1 bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:ring-emerald-500/30"
                  placeholder="#2563eb"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm text-white/70">Greeting Message</Label>
              <Input
                data-testid="input-widget-greeting"
                value={greeting}
                onChange={(e) => setGreeting(e.target.value)}
                placeholder="Hi! How can I help you today?"
                className="bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:ring-emerald-500/30"
              />
            </div>
          </div>

          <Separator className="bg-white/10" />

          {/* Embed Code */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm text-white/70">Embed Code</Label>
              <Button
                data-testid="button-copy-embed"
                variant="outline"
                size="sm"
                onClick={handleCopy}
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Code
                  </>
                )}
              </Button>
            </div>
            <div className="relative">
              <pre className="bg-white/5 border border-white/10 p-4 rounded-md overflow-x-auto text-sm font-mono text-white/85">
                <code data-testid="code-embed-snippet">{embedCode}</code>
              </pre>
            </div>
          </div>

          <Separator className="bg-white/10" />

          {/* Instructions */}
          <div className="space-y-3">
            <Label className="text-sm text-white/70">Installation Steps</Label>
            <ol className="list-decimal list-inside space-y-2 text-sm text-white/60">
              <li>Copy the embed code above</li>
              <li>Paste it just before the closing <code className="bg-white/10 px-1 rounded text-white/85">&lt;/body&gt;</code> tag on your website</li>
              <li>The chat widget will appear automatically in the selected position</li>
              <li>Visitors can click the bubble to start chatting with your AI assistant</li>
            </ol>
          </div>

          {/* Preview Button */}
          <div className="flex gap-2">
            <Button
              data-testid="button-preview-widget"
              variant="outline"
              onClick={() => window.open(`/widget/preview.html?clientId=${client.id}&botId=${bot.botId}`, '_blank')}
            >
              <Eye className="h-4 w-4 mr-2" />
              Preview Widget
            </Button>
            <Button
              data-testid="button-test-widget"
              variant="outline"
              onClick={() => window.open(`/demo/${bot.botId}`, '_blank')}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Test in Demo Mode
            </Button>
          </div>
        </GlassCardContent>
      </GlassCard>

      {/* Widget Configuration Details */}
      <GlassCard>
        <GlassCardHeader className="pb-4">
          <GlassCardTitle className="text-base flex items-center gap-2">
            <Settings className="h-4 w-4 text-white/70" />
            Configuration Details
          </GlassCardTitle>
        </GlassCardHeader>
        <GlassCardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
              <span className="text-sm text-white/60">Client ID</span>
              <code className="text-sm font-mono bg-slate-800/80 px-3 py-1 rounded border border-white/10 text-emerald-400">{client.id}</code>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
              <span className="text-sm text-white/60">Bot ID</span>
              <code className="text-sm font-mono bg-slate-800/80 px-3 py-1 rounded border border-white/10 text-emerald-400">{bot.botId}</code>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
              <span className="text-sm text-white/60">Business</span>
              <span className="text-sm text-white font-medium">{bot.businessProfile?.businessName || client.name}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
              <span className="text-sm text-white/60">Status</span>
              <Badge className={`${client.status === 'active' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-white/10 text-white/55 border border-white/20'}`}>
                {client.status}
              </Badge>
            </div>
          </div>
        </GlassCardContent>
      </GlassCard>
    </div>
  );
}

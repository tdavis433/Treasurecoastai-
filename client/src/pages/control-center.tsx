import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useEffect, useCallback, createContext, useContext, useRef } from "react";
import { useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Save lock context to prevent concurrent saves across panels
interface SaveLockContextType {
  acquireLock: () => Promise<void>;
  releaseLock: () => void;
  isLocked: boolean;
}

const SaveLockContext = createContext<SaveLockContextType | null>(null);

function SaveLockProvider({ children }: { children: React.ReactNode }) {
  const [isLocked, setIsLocked] = useState(false);
  const lockPromiseRef = useRef<Promise<void> | null>(null);
  const resolveRef = useRef<(() => void) | null>(null);

  const acquireLock = async () => {
    while (lockPromiseRef.current) {
      await lockPromiseRef.current;
    }
    lockPromiseRef.current = new Promise((resolve) => {
      resolveRef.current = resolve;
    });
    setIsLocked(true);
  };

  const releaseLock = () => {
    setIsLocked(false);
    if (resolveRef.current) {
      resolveRef.current();
      resolveRef.current = null;
    }
    lockPromiseRef.current = null;
  };

  return (
    <SaveLockContext.Provider value={{ acquireLock, releaseLock, isLocked }}>
      {children}
    </SaveLockContext.Provider>
  );
}

function useSaveLock() {
  const context = useContext(SaveLockContext);
  if (!context) {
    return { acquireLock: async () => {}, releaseLock: () => {}, isLocked: false };
  }
  return context;
}
import { Button } from "@/components/ui/button";
import { GlassCard, GlassCardHeader, GlassCardTitle, GlassCardDescription, GlassCardContent } from "@/components/ui/glass-card";
import { TreasureCoastLogo } from "@/components/treasure-coast-logo";
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
  MoreVertical, MoreHorizontal, Workflow, Palette, ChevronDown, SendHorizontal, MessageCircle,
  CheckCircle, PauseCircle, LayoutGrid, List, Crown, User, HelpCircle
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface Client {
  id: string;
  name: string;
  type?: string;
  status: string;
  bots?: string[];
  slug?: string;
  plan?: string;
  botsCount?: number;
  totalConversations?: number;
  lastActive?: string | null;
}

interface BotConfig {
  botId: string;
  clientId: string;
  name: string;
  description: string;
  status?: 'active' | 'paused' | 'demo';
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
  const [dashboardSection, setDashboardSection] = useState<'overview' | 'workspaces' | 'assistants' | 'templates' | 'knowledge' | 'integrations' | 'billing' | 'analytics' | 'logs' | 'users'>('overview');
  const [logFilters, setLogFilters] = useState({ level: 'all', source: 'all', isResolved: 'all', clientId: 'all' });
  const [analyticsRange, setAnalyticsRange] = useState<number>(7);
  const [selectedBots, setSelectedBots] = useState<Set<string>>(new Set());
  const [workspaceSearch, setWorkspaceSearch] = useState('');
  const [workspaceStatusFilter, setWorkspaceStatusFilter] = useState<'all' | 'active' | 'paused' | 'suspended'>('all');
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [newUserForm, setNewUserForm] = useState({ username: '', password: '', role: 'client_admin' as 'super_admin' | 'client_admin', clientId: '' });
  const [editingUser, setEditingUser] = useState<{ id: string; username: string; role: string } | null>(null);
  const [showCreateWorkspaceModal, setShowCreateWorkspaceModal] = useState(false);
  const [newWorkspaceForm, setNewWorkspaceForm] = useState({ name: '', slug: '', clientEmail: '', plan: 'starter' });
  const [editingWorkspace, setEditingWorkspace] = useState<{ slug: string; name: string; plan: string; ownerId?: string } | null>(null);
  const [generatedCredentials, setGeneratedCredentials] = useState<{ email: string; temporaryPassword: string; dashboardUrl: string } | null>(null);
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);

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

  // Per-bot analytics for ranking top performers
  const { data: botAnalyticsData } = useQuery<{
    totals: {
      totalConversations: number;
      totalMessages: number;
      appointmentRequests: number;
    };
    bots: Array<{
      clientId: string;
      botId: string;
      businessName: string;
      businessType: string;
      totalConversations: number;
      totalMessages: number;
      appointmentRequests: number;
    }>;
    totalBots: number;
  }>({
    queryKey: ["/api/super-admin/analytics/overview", { days: analyticsRange }],
    queryFn: async () => {
      const response = await fetch(`/api/super-admin/analytics/overview?days=${analyticsRange}`, { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch bot analytics");
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
      if (logFilters.source && logFilters.source !== 'all') params.append('source', logFilters.source);
      if (logFilters.isResolved && logFilters.isResolved !== 'all') params.append('isResolved', logFilters.isResolved);
      if (logFilters.clientId && logFilters.clientId !== 'all') params.append('clientId', logFilters.clientId);
      params.append('limit', '100');
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

  // Sort bots by performance (conversations + appointments weighted)
  // Reconcile analytics data with bot configs for complete info
  const topPerformingBots = (botAnalyticsData?.bots || [])
    .map(bot => {
      const botConfig = clientBots.find(b => b.botId === bot.botId);
      const client = clients.find(c => c.id === bot.clientId);
      return {
        ...bot,
        // Use botConfig data as fallback for missing fields
        businessName: bot.businessName || botConfig?.businessProfile?.businessName || botConfig?.name || 'Unknown Bot',
        businessType: bot.businessType || botConfig?.businessProfile?.type || 'general',
        clientName: client?.name || 'Client',
        performanceScore: (bot.totalConversations || 0) + (bot.appointmentRequests || 0) * 2,
        hasValidConfig: !!botConfig
      };
    })
    .filter(bot => bot.totalConversations > 0 || bot.appointmentRequests > 0) // Only show bots with activity
    .sort((a, b) => b.performanceScore - a.performanceScore)
    .slice(0, 5);

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
    mutationFn: async (data: { name: string; slug: string; clientEmail?: string; plan?: string }) => {
      const response = await apiRequest("POST", "/api/super-admin/workspaces", data);
      return response.json();
    },
    onSuccess: async (data) => {
      await queryClient.refetchQueries({ queryKey: ["/api/super-admin/workspaces"] });
      setShowCreateWorkspaceModal(false);
      setNewWorkspaceForm({ name: '', slug: '', clientEmail: '', plan: 'starter' });
      
      // If credentials were generated, show them in a modal
      if (data.clientCredentials) {
        setGeneratedCredentials({
          email: data.clientCredentials.email,
          temporaryPassword: data.clientCredentials.temporaryPassword,
          dashboardUrl: data.clientCredentials.dashboardUrl,
        });
        setShowCredentialsModal(true);
      } else {
        toast({ title: "Client Created", description: "New client has been created successfully." });
      }
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to create client.", variant: "destructive" });
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
    // Clear auth cache to prevent back-button access after logout
    queryClient.clear();
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
    <SaveLockProvider>
    <div className="h-screen bg-[#0B0E13] text-white flex flex-col overflow-hidden">
      {/* Header */}
      <header className="h-14 border-b border-white/10 bg-[#0d1117]/80 backdrop-blur-md flex items-center justify-between px-6 flex-shrink-0">
        <div className="flex items-center">
          <TreasureCoastLogo size="md" showSubtitle subtitle="Agency Dashboard" />
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
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
            <div className="h-6 w-6 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-xs font-bold text-white">
              {currentUser?.username?.charAt(0).toUpperCase()}
            </div>
            <span className="text-sm text-white/70">{currentUser?.username}</span>
          </div>
          <Button data-testid="button-logout" variant="ghost" size="icon" onClick={handleLogout} className="text-white/70 hover:bg-white/10 hover:text-white">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Left Sidebar - Bot Navigation */}
        <aside className="w-72 border-r border-white/10 bg-[#0d1117] flex flex-col flex-shrink-0">
          <div className="p-4 border-b border-white/10">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Bot className="h-4 w-4 text-cyan-400" />
                Client Assistants
              </h3>
              <Badge className="bg-cyan-500/10 text-cyan-400 text-xs">{clientBots.length}</Badge>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
              <Input
                data-testid="input-search-bots"
                placeholder="Search assistants..."
                className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-white/40 h-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-2">
              <p className="text-xs font-medium text-white/40 uppercase tracking-wide px-2 mb-2">
                {searchQuery ? `Showing ${filteredBots.length} of ${clientBots.length}` : 'All Assistants'}
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
              {/* Command Center Header */}
              <div className="mb-6">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                      Command Center
                      <Badge className="bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-cyan-400 border-cyan-400/30">
                        Super Admin
                      </Badge>
                    </h1>
                    <p className="text-white/55 mt-1">
                      {searchQuery 
                        ? `Showing ${filteredBots.length} of ${clientBots.length} bots matching "${searchQuery}"`
                        : 'Manage all client assistants, view platform performance, and configure settings.'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      data-testid="button-create-client"
                      onClick={() => setShowCreateWorkspaceModal(true)}
                      className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white"
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      New Client
                    </Button>
                    <Button
                      data-testid="button-create-bot"
                      variant="outline"
                      onClick={() => setShowCreateModal(true)}
                      className="border-white/20 text-white hover:bg-white/10"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      New Bot
                    </Button>
                  </div>
                </div>
              </div>

              {/* Navigation Tabs - Organized: Overview, Clients, Assistants, Templates, Knowledge, Integrations, Analytics, Users, System */}
              <div className="flex items-center gap-1 mb-6 p-1 bg-white/5 rounded-lg border border-white/10 overflow-x-auto">
                <Button
                  data-testid="button-section-overview"
                  variant="ghost"
                  size="sm"
                  onClick={() => setDashboardSection('overview')}
                  className={dashboardSection === 'overview' ? 'bg-cyan-500/20 text-cyan-400' : 'text-white/70 hover:text-white hover:bg-white/10'}
                >
                  <Layers className="h-4 w-4 mr-2" />
                  Overview
                </Button>
                <Button
                  data-testid="button-section-workspaces"
                  variant="ghost"
                  size="sm"
                  onClick={() => setDashboardSection('workspaces')}
                  className={dashboardSection === 'workspaces' ? 'bg-cyan-500/20 text-cyan-400' : 'text-white/70 hover:text-white hover:bg-white/10'}
                >
                  <Users2 className="h-4 w-4 mr-2" />
                  Clients
                  {(workspacesData?.total || 0) > 0 && (
                    <Badge className="ml-1.5 bg-white/10 text-white/70 text-xs px-1.5">{workspacesData?.total}</Badge>
                  )}
                </Button>
                <Button
                  data-testid="button-section-assistants"
                  variant="ghost"
                  size="sm"
                  onClick={() => setDashboardSection('assistants')}
                  className={dashboardSection === 'assistants' ? 'bg-cyan-500/20 text-cyan-400' : 'text-white/70 hover:text-white hover:bg-white/10'}
                >
                  <Bot className="h-4 w-4 mr-2" />
                  Assistants
                  {clientBots.length > 0 && (
                    <Badge className="ml-1.5 bg-white/10 text-white/70 text-xs px-1.5">{clientBots.length}</Badge>
                  )}
                </Button>
                <Button
                  data-testid="button-section-templates"
                  variant="ghost"
                  size="sm"
                  onClick={() => setDashboardSection('templates')}
                  className={dashboardSection === 'templates' ? 'bg-cyan-500/20 text-cyan-400' : 'text-white/70 hover:text-white hover:bg-white/10'}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Templates
                  {templates.length > 0 && (
                    <Badge className="ml-1.5 bg-white/10 text-white/70 text-xs px-1.5">{templates.length}</Badge>
                  )}
                </Button>
                <Button
                  data-testid="button-section-knowledge"
                  variant="ghost"
                  size="sm"
                  onClick={() => setDashboardSection('knowledge')}
                  className={dashboardSection === 'knowledge' ? 'bg-cyan-500/20 text-cyan-400' : 'text-white/70 hover:text-white hover:bg-white/10'}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Knowledge
                </Button>
                <Button
                  data-testid="button-section-integrations"
                  variant="ghost"
                  size="sm"
                  onClick={() => setDashboardSection('integrations')}
                  className={dashboardSection === 'integrations' ? 'bg-cyan-500/20 text-cyan-400' : 'text-white/70 hover:text-white hover:bg-white/10'}
                >
                  <Zap className="h-4 w-4 mr-2" />
                  Integrations
                </Button>
                <Button
                  data-testid="button-section-requests"
                  variant="ghost"
                  size="sm"
                  onClick={() => setDashboardSection('requests')}
                  className={dashboardSection === 'requests' ? 'bg-cyan-500/20 text-cyan-400' : 'text-white/70 hover:text-white hover:bg-white/10'}
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Requests
                </Button>
                <Button
                  data-testid="button-section-billing"
                  variant="ghost"
                  size="sm"
                  onClick={() => setDashboardSection('billing')}
                  className={dashboardSection === 'billing' ? 'bg-cyan-500/20 text-cyan-400' : 'text-white/70 hover:text-white hover:bg-white/10'}
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  Billing
                </Button>
                <Separator orientation="vertical" className="h-6 bg-white/20 mx-1" />
                <Button
                  data-testid="button-section-analytics"
                  variant="ghost"
                  size="sm"
                  onClick={() => setDashboardSection('analytics')}
                  className={dashboardSection === 'analytics' ? 'bg-cyan-500/20 text-cyan-400' : 'text-white/70 hover:text-white hover:bg-white/10'}
                >
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Analytics
                </Button>
                <Button
                  data-testid="button-section-users"
                  variant="ghost"
                  size="sm"
                  onClick={() => setDashboardSection('users')}
                  className={dashboardSection === 'users' ? 'bg-cyan-500/20 text-cyan-400' : 'text-white/70 hover:text-white hover:bg-white/10'}
                >
                  <Shield className="h-4 w-4 mr-2" />
                  Users
                </Button>
                <Button
                  data-testid="button-section-logs"
                  variant="ghost"
                  size="sm"
                  onClick={() => setDashboardSection('logs')}
                  className={dashboardSection === 'logs' ? 'bg-cyan-500/20 text-cyan-400' : 'text-white/70 hover:text-white hover:bg-white/10'}
                >
                  <FileWarning className="h-4 w-4 mr-2" />
                  System
                  {systemStatus?.errorCount ? (
                    <Badge className="ml-1.5 bg-red-500/20 text-red-400 text-xs px-1.5">{systemStatus.errorCount}</Badge>
                  ) : null}
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
                    toast({ title: "Refreshed", description: "Dashboard data updated" });
                  }}
                  className="text-white/55 hover:text-white hover:bg-white/10"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>

              {dashboardSection === 'overview' && (
              <>
              {/* Time Range Toggle & Quick Actions */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2 p-1 bg-white/5 rounded-lg border border-white/10">
                  <Button
                    data-testid="button-range-7d"
                    variant="ghost"
                    size="sm"
                    onClick={() => setAnalyticsRange(7)}
                    className={analyticsRange === 7 ? 'bg-cyan-500/20 text-cyan-400' : 'text-white/70 hover:text-white hover:bg-white/10'}
                  >
                    7 Days
                  </Button>
                  <Button
                    data-testid="button-range-30d"
                    variant="ghost"
                    size="sm"
                    onClick={() => setAnalyticsRange(30)}
                    className={analyticsRange === 30 ? 'bg-cyan-500/20 text-cyan-400' : 'text-white/70 hover:text-white hover:bg-white/10'}
                  >
                    30 Days
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    data-testid="button-quick-new-client"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowCreateWorkspaceModal(true)}
                    className="border-white/20 text-white hover:bg-white/10"
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    New Client
                  </Button>
                  <Button
                    data-testid="button-quick-new-bot"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowCreateModal(true)}
                    className="border-white/20 text-white hover:bg-white/10"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    New Bot
                  </Button>
                </div>
              </div>

              {/* Platform Stats - Key Metrics with Time Range */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <GlassCard hover data-testid="card-stat-conversations">
                  <GlassCardContent className="pt-6">
                    <div className="flex items-center justify-between mb-3">
                      <div className="h-10 w-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                        <MessageSquare className="h-5 w-5 text-cyan-400" />
                      </div>
                      <Badge className="bg-cyan-500/10 text-cyan-400 text-xs">Last {analyticsRange} days</Badge>
                    </div>
                    <p className="text-3xl font-bold text-white">{globalAnalytics?.summary?.totalConversations || 0}</p>
                    <p className="text-sm text-white/55 mt-1">Total Conversations</p>
                  </GlassCardContent>
                </GlassCard>
                <GlassCard hover data-testid="card-stat-leads">
                  <GlassCardContent className="pt-6">
                    <div className="flex items-center justify-between mb-3">
                      <div className="h-10 w-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                        <Users className="h-5 w-5 text-green-400" />
                      </div>
                      <Badge className="bg-green-500/10 text-green-400 text-xs">Captured</Badge>
                    </div>
                    <p className="text-3xl font-bold text-white">{globalAnalytics?.summary?.totalLeads || 0}</p>
                    <p className="text-sm text-white/55 mt-1">Leads Generated</p>
                  </GlassCardContent>
                </GlassCard>
                <GlassCard hover data-testid="card-stat-bookings">
                  <GlassCardContent className="pt-6">
                    <div className="flex items-center justify-between mb-3">
                      <div className="h-10 w-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                        <Calendar className="h-5 w-5 text-purple-400" />
                      </div>
                      <Badge className="bg-purple-500/10 text-purple-400 text-xs">Scheduled</Badge>
                    </div>
                    <p className="text-3xl font-bold text-white">{globalAnalytics?.summary?.totalAppointments || 0}</p>
                    <p className="text-sm text-white/55 mt-1">Bookings Made</p>
                  </GlassCardContent>
                </GlassCard>
                <GlassCard hover data-testid="card-stat-bots">
                  <GlassCardContent className="pt-6">
                    <div className="flex items-center justify-between mb-3">
                      <div className="h-10 w-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                        <Bot className="h-5 w-5 text-blue-400" />
                      </div>
                      <Badge className="bg-blue-500/10 text-blue-400 text-xs">
                        {clients.filter(c => c.status === 'active').length} active
                      </Badge>
                    </div>
                    <p className="text-3xl font-bold text-white">{clientBots.length}</p>
                    <p className="text-sm text-white/55 mt-1">Total Assistants</p>
                  </GlassCardContent>
                </GlassCard>
              </div>

              {/* Activity Trends Chart */}
              <GlassCard className="mb-6" data-testid="card-trends-chart">
                <GlassCardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <GlassCardTitle>Activity Trends</GlassCardTitle>
                      <GlassCardDescription>Conversations, Leads & Bookings over time</GlassCardDescription>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const csvContent = "Date,Conversations,Leads,Bookings\n" + 
                          (globalAnalytics?.dailyTrends || []).map(t => `${t.date},${t.conversations},${t.leads},${t.appointments}`).join('\n');
                        const blob = new Blob([csvContent], { type: 'text/csv' });
                        const url = window.URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `activity-trends-${analyticsRange}d.csv`;
                        a.click();
                      }}
                      className="text-white/55 hover:text-white hover:bg-white/10"
                      data-testid="button-export-trends"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export CSV
                    </Button>
                  </div>
                </GlassCardHeader>
                <GlassCardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={globalAnalytics?.dailyTrends || []}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                        <XAxis 
                          dataKey="date" 
                          stroke="#666"
                          tick={{ fill: '#999', fontSize: 11 }}
                          tickFormatter={(value) => {
                            const d = new Date(value);
                            return `${d.getMonth()+1}/${d.getDate()}`;
                          }}
                        />
                        <YAxis stroke="#666" tick={{ fill: '#999', fontSize: 11 }} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'rgba(0,0,0,0.9)', 
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '8px'
                          }}
                          labelStyle={{ color: '#fff' }}
                        />
                        <Line type="monotone" dataKey="conversations" stroke="#00E5CC" strokeWidth={2} dot={false} name="Conversations" />
                        <Line type="monotone" dataKey="leads" stroke="#22c55e" strokeWidth={2} dot={false} name="Leads" />
                        <Line type="monotone" dataKey="appointments" stroke="#A855F7" strokeWidth={2} dot={false} name="Bookings" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex items-center justify-center gap-6 mt-4">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-cyan-400" />
                      <span className="text-sm text-white/70">Conversations</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-green-500" />
                      <span className="text-sm text-white/70">Leads</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-purple-500" />
                      <span className="text-sm text-white/70">Bookings</span>
                    </div>
                  </div>
                </GlassCardContent>
              </GlassCard>

              {/* Two Column Layout: Top Performers & Quick Status */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Top Performing Assistants - Using Real Analytics */}
                <GlassCard data-testid="card-top-performers">
                  <GlassCardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <GlassCardTitle>Top Performing Assistants</GlassCardTitle>
                        <GlassCardDescription>Ranked by activity (last {analyticsRange} days)</GlassCardDescription>
                      </div>
                      {topPerformingBots.length > 0 && (
                        <Badge className="bg-green-500/10 text-green-400 text-xs">
                          <Activity className="h-3 w-3 mr-1" />
                          Live
                        </Badge>
                      )}
                    </div>
                  </GlassCardHeader>
                  <GlassCardContent>
                    <div className="space-y-3">
                      {topPerformingBots.map((bot, idx) => (
                        <div 
                          key={bot.botId}
                          className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
                          onClick={() => {
                            if (bot.hasValidConfig) {
                              setSelectedBotId(bot.botId);
                              setActiveTab('overview');
                            }
                          }}
                          data-testid={`row-top-bot-${bot.botId}`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                              idx === 0 ? 'bg-amber-500/20 text-amber-400' :
                              idx === 1 ? 'bg-gray-300/20 text-gray-300' :
                              idx === 2 ? 'bg-orange-700/20 text-orange-600' :
                              'bg-white/10 text-white/50'
                            }`}>
                              <span className="text-sm font-bold">#{idx + 1}</span>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-white">{bot.businessName}</p>
                              <p className="text-xs text-white/50">{bot.clientName}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className="bg-cyan-500/10 text-cyan-400 text-xs" title="Conversations">
                              <MessageSquare className="h-3 w-3 mr-1" />
                              {bot.totalConversations}
                            </Badge>
                            {bot.appointmentRequests > 0 && (
                              <Badge className="bg-purple-500/10 text-purple-400 text-xs" title="Appointment Requests">
                                <Calendar className="h-3 w-3 mr-1" />
                                {bot.appointmentRequests}
                              </Badge>
                            )}
                            {bot.hasValidConfig && <ChevronRight className="h-4 w-4 text-white/30" />}
                          </div>
                        </div>
                      ))}
                      {topPerformingBots.length === 0 && clientBots.length > 0 && (
                        <div className="text-center py-6">
                          <Activity className="h-8 w-8 text-white/30 mx-auto mb-2" />
                          <p className="text-sm text-white/50">No activity in this period</p>
                          <p className="text-xs text-white/40 mt-1">Bots with conversations will appear here</p>
                        </div>
                      )}
                      {clientBots.length === 0 && (
                        <div className="text-center py-6">
                          <Bot className="h-8 w-8 text-white/30 mx-auto mb-2" />
                          <p className="text-sm text-white/50">No assistants yet</p>
                        </div>
                      )}
                    </div>
                  </GlassCardContent>
                </GlassCard>

                {/* Quick Status & Recent Activity */}
                <GlassCard data-testid="card-quick-status">
                  <GlassCardHeader>
                    <GlassCardTitle>Platform Status</GlassCardTitle>
                    <GlassCardDescription>Current system health and activity</GlassCardDescription>
                  </GlassCardHeader>
                  <GlassCardContent>
                    <div className="space-y-3">
                      <div className="p-3 rounded-lg bg-green-500/10 border border-green-400/20 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-green-500/20 flex items-center justify-center">
                            <Play className="h-4 w-4 text-green-400" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white">Active Clients</p>
                            <p className="text-xs text-white/50">Currently running</p>
                          </div>
                        </div>
                        <span className="text-2xl font-bold text-green-400">{clients.filter(c => c.status === 'active').length}</span>
                      </div>
                      <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-400/20 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                            <Eye className="h-4 w-4 text-blue-400" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white">Demo Bots</p>
                            <p className="text-xs text-white/50">Showcase assistants</p>
                          </div>
                        </div>
                        <span className="text-2xl font-bold text-blue-400">{clientBots.filter(b => b.metadata?.isDemo).length}</span>
                      </div>
                      <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-400/20 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-amber-500/20 flex items-center justify-center">
                            <Pause className="h-4 w-4 text-amber-400" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white">Paused Clients</p>
                            <p className="text-xs text-white/50">Temporarily inactive</p>
                          </div>
                        </div>
                        <span className="text-2xl font-bold text-amber-400">{clients.filter(c => c.status === 'paused').length}</span>
                      </div>
                      <div className={`p-3 rounded-lg flex items-center justify-between ${
                        systemStatus?.status === 'operational' ? 'bg-green-500/10 border border-green-400/20' :
                        systemStatus?.status === 'degraded' ? 'bg-amber-500/10 border border-amber-400/20' :
                        'bg-red-500/10 border border-red-400/20'
                      }`}>
                        <div className="flex items-center gap-3">
                          <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                            systemStatus?.status === 'operational' ? 'bg-green-500/20' :
                            systemStatus?.status === 'degraded' ? 'bg-amber-500/20' : 'bg-red-500/20'
                          }`}>
                            {systemStatus?.status === 'operational' ? (
                              <CheckCircle2 className="h-4 w-4 text-green-400" />
                            ) : systemStatus?.status === 'degraded' ? (
                              <AlertTriangle className="h-4 w-4 text-amber-400" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-400" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white">System Status</p>
                            <p className="text-xs text-white/50 capitalize">{systemStatus?.status || 'Checking...'}</p>
                          </div>
                        </div>
                        {systemStatus?.errorCount ? (
                          <Badge className="bg-red-500/20 text-red-400">{systemStatus.errorCount} errors</Badge>
                        ) : (
                          <Badge className="bg-green-500/20 text-green-400">All Clear</Badge>
                        )}
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

              {dashboardSection === 'workspaces' && (() => {
                // Helper to normalize workspace status to filter categories
                // API returns: active, paused, trial, suspended, cancelled
                // Filter pills: all, active, paused, suspended
                const normalizeStatus = (status: string): 'active' | 'paused' | 'suspended' => {
                  if (status === 'active' || status === 'trial') return 'active'; // Trial is still an active client
                  if (status === 'paused') return 'paused';
                  return 'suspended'; // suspended, cancelled, or any other status
                };

                // Count workspaces by normalized status
                const statusCounts = {
                  all: workspacesData?.workspaces?.length || 0,
                  active: workspacesData?.workspaces?.filter(w => normalizeStatus(w.status) === 'active').length || 0,
                  paused: workspacesData?.workspaces?.filter(w => normalizeStatus(w.status) === 'paused').length || 0,
                  suspended: workspacesData?.workspaces?.filter(w => normalizeStatus(w.status) === 'suspended').length || 0,
                };

                // Filter workspaces by status and search
                const filteredWorkspaces = (workspacesData?.workspaces || []).filter(workspace => {
                  // Apply status filter
                  if (workspaceStatusFilter !== 'all') {
                    if (normalizeStatus(workspace.status) !== workspaceStatusFilter) return false;
                  }
                  // Apply search filter
                  if (workspaceSearch) {
                    return workspace.name.toLowerCase().includes(workspaceSearch.toLowerCase()) ||
                      workspace.slug.toLowerCase().includes(workspaceSearch.toLowerCase());
                  }
                  return true;
                });

                return (
                <div className="space-y-6">
                  {/* Clients Header with Search, Filters and Actions */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                      <div>
                        <h2 className="text-lg font-semibold text-white">Client Management</h2>
                        <p className="text-sm text-white/50 mt-0.5">Manage all your business clients and their AI assistants</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => setShowCreateWorkspaceModal(true)}
                          className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white"
                          data-testid="button-add-workspace"
                        >
                          <UserPlus className="h-4 w-4 mr-2" />
                          Add Client
                        </Button>
                      </div>
                    </div>

                    {/* Search and Filters Row */}
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      {/* Status Filter Pills */}
                      <div className="flex items-center gap-1 p-1 rounded-lg bg-white/5 border border-white/10">
                        {[
                          { value: 'all', label: 'All', count: statusCounts.all },
                          { value: 'active', label: 'Active', count: statusCounts.active },
                          { value: 'paused', label: 'Paused', count: statusCounts.paused },
                          { value: 'suspended', label: 'Suspended', count: statusCounts.suspended },
                        ].map(filter => (
                          <Button
                            key={filter.value}
                            variant="ghost"
                            size="sm"
                            data-testid={`button-filter-${filter.value}`}
                            onClick={() => setWorkspaceStatusFilter(filter.value as typeof workspaceStatusFilter)}
                            className={`text-xs px-3 gap-1.5 ${workspaceStatusFilter === filter.value 
                              ? 'bg-cyan-500/20 text-cyan-400' 
                              : 'text-white/55 hover:text-white hover:bg-white/10'}`}
                          >
                            {filter.label}
                            <Badge className={`text-[10px] px-1.5 ${workspaceStatusFilter === filter.value 
                              ? 'bg-cyan-400/20 text-cyan-400' 
                              : 'bg-white/10 text-white/55'}`}>
                              {filter.count}
                            </Badge>
                          </Button>
                        ))}
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/40" />
                          <Input
                            data-testid="input-workspace-search"
                            placeholder="Search clients..."
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
                            a.download = `clients-${new Date().toISOString().split('T')[0]}.csv`;
                            a.click();
                            toast({ title: "Export Complete", description: "Clients data exported to CSV." });
                          }}
                          className="border-white/10 text-white/85 hover:bg-white/10"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Export
                        </Button>
                      </div>
                    </div>
                  </div>

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
                      {filteredWorkspaces.map(workspace => (
                        <GlassCard 
                          key={workspace.id} 
                          hover 
                          data-testid={`card-workspace-${workspace.slug}`}
                          className="cursor-pointer"
                          onClick={() => setLocation(`/super-admin/clients/${workspace.slug}`)}
                        >
                          <GlassCardHeader className="pb-3">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <GlassCardTitle className="text-sm truncate">{workspace.name}</GlassCardTitle>
                                  {/* Status Badge */}
                                  <Badge className={`text-[10px] px-1.5 ${
                                    workspace.status === 'active' ? "bg-green-500/20 text-green-400 border-green-500/30" :
                                    workspace.status === 'suspended' ? "bg-red-500/20 text-red-400 border-red-500/30" :
                                    workspace.status === 'cancelled' ? "bg-gray-500/20 text-gray-400 border-gray-500/30" :
                                    "bg-amber-500/20 text-amber-400 border-amber-500/30"
                                  }`}>
                                    {workspace.status.charAt(0).toUpperCase() + workspace.status.slice(1)}
                                  </Badge>
                                </div>
                                <GlassCardDescription className="text-xs">{workspace.slug}</GlassCardDescription>
                              </div>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                  <Button variant="ghost" size="icon" className="h-7 w-7 text-white/55 hover:text-white hover:bg-white/10" data-testid={`button-workspace-menu-${workspace.slug}`}>
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="bg-[#1a1d24] border-white/10 min-w-[160px]" onClick={(e) => e.stopPropagation()}>
                                  <DropdownMenuItem 
                                    className="text-cyan-400 hover:bg-cyan-500/10 gap-2"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      window.open(`/client/dashboard?impersonate=${workspace.slug}`, '_blank');
                                    }}
                                    data-testid={`button-view-as-client-${workspace.slug}`}
                                  >
                                    <Eye className="h-4 w-4" />
                                    View as Client
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    className="text-white hover:bg-white/10 gap-2"
                                    onClick={(e) => { e.stopPropagation(); setEditingWorkspace({ slug: workspace.slug, name: workspace.name, plan: workspace.plan }); }}
                                    data-testid={`button-edit-workspace-${workspace.slug}`}
                                  >
                                    <Settings className="h-4 w-4" />
                                    Edit Client
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator className="bg-white/10" />
                                  {/* Quick Status Changes */}
                                  <DropdownMenuLabel className="text-white/40 text-xs">Change Status</DropdownMenuLabel>
                                  {workspace.status !== 'active' && (
                                    <DropdownMenuItem 
                                      className="text-green-400 hover:bg-green-500/10 gap-2"
                                      onClick={(e) => { e.stopPropagation(); updateWorkspaceStatusMutation.mutate({ slug: workspace.slug, status: 'active' }); }}
                                    >
                                      <CheckCircle className="h-4 w-4" />
                                      Activate
                                    </DropdownMenuItem>
                                  )}
                                  {workspace.status !== 'paused' && (
                                    <DropdownMenuItem 
                                      className="text-amber-400 hover:bg-amber-500/10 gap-2"
                                      onClick={(e) => { e.stopPropagation(); updateWorkspaceStatusMutation.mutate({ slug: workspace.slug, status: 'paused' }); }}
                                    >
                                      <PauseCircle className="h-4 w-4" />
                                      Pause
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuSeparator className="bg-white/10" />
                                  <DropdownMenuItem 
                                    className="text-red-400 hover:bg-red-500/10 gap-2"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (confirm(`Are you sure you want to delete "${workspace.name}"? This will also delete all ${workspace.botsCount} bots in this workspace.`)) {
                                        deleteWorkspaceMutation.mutate(workspace.slug);
                                      }
                                    }}
                                    data-testid={`button-delete-workspace-${workspace.slug}`}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                    Delete Client
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </GlassCardHeader>
                          <GlassCardContent className="pb-4">
                            {/* Plan Badge Row */}
                            <div className="flex items-center gap-2 mb-3">
                              <Badge className={`text-xs ${
                                workspace.plan === 'enterprise' ? 'bg-purple-500/20 text-purple-400 border-purple-500/30' :
                                workspace.plan === 'pro' ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' :
                                workspace.plan === 'starter' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' :
                                'bg-gray-500/20 text-gray-400 border-gray-500/30'
                              }`}>
                                {workspace.plan.charAt(0).toUpperCase() + workspace.plan.slice(1)} Plan
                              </Badge>
                              <Badge className="bg-white/10 text-white/70 text-xs">
                                <Bot className="h-3 w-3 mr-1" />
                                {workspace.botsCount} {workspace.botsCount === 1 ? 'Assistant' : 'Assistants'}
                              </Badge>
                            </div>
                            {/* Stats Grid */}
                            <div className="grid grid-cols-2 gap-3 text-xs">
                              <div className="bg-white/5 rounded-lg p-2.5">
                                <div className="flex items-center gap-1.5 text-white/55 mb-1">
                                  <MessageSquare className="h-3 w-3" />
                                  <span>Conversations</span>
                                </div>
                                <p className="text-white font-semibold text-lg">{workspace.totalConversations}</p>
                              </div>
                              <div className="bg-white/5 rounded-lg p-2.5">
                                <div className="flex items-center gap-1.5 text-white/55 mb-1">
                                  <Clock className="h-3 w-3" />
                                  <span>Last Active</span>
                                </div>
                                <p className="text-white font-medium">{workspace.lastActive ? new Date(workspace.lastActive).toLocaleDateString() : 'Never'}</p>
                              </div>
                            </div>
                          </GlassCardContent>
                        </GlassCard>
                      ))}

                      {/* Empty State */}
                      {filteredWorkspaces.length === 0 && (
                        <div className="col-span-full py-12 text-center">
                          <div className="h-12 w-12 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-3">
                            <Users2 className="h-6 w-6 text-white/40" />
                          </div>
                          <p className="text-white/55 text-sm">No clients found</p>
                          <p className="text-white/40 text-xs mt-1">
                            {workspaceSearch ? 'Try a different search term' : workspaceStatusFilter !== 'all' ? 'No clients with this status' : 'Add your first client to get started'}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
              })()}

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
                  {/* Header */}
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div>
                      <h2 className="text-xl font-semibold text-white">System Health & Logs</h2>
                      <p className="text-sm text-white/55">Monitor platform activity and resolve issues</p>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => refetchLogs()} 
                      className="text-white/70 hover:text-white hover:bg-white/10"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Refresh
                    </Button>
                  </div>

                  {/* Critical Issues Alert */}
                  {systemLogs?.logs?.some(log => log.level === 'critical' && !log.isResolved) && (
                    <GlassCard className="border-red-500/30 bg-red-500/5">
                      <GlassCardContent className="py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-red-500/20 flex items-center justify-center animate-pulse">
                            <AlertCircle className="h-5 w-5 text-red-400" />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-red-400">Critical Issues Detected</p>
                            <p className="text-sm text-white/70">
                              {systemLogs.logs.filter(l => l.level === 'critical' && !l.isResolved).length} critical issue(s) require immediate attention
                            </p>
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setLogFilters({...logFilters, level: 'critical', isResolved: 'false'})}
                            className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                          >
                            View Critical
                          </Button>
                        </div>
                      </GlassCardContent>
                    </GlassCard>
                  )}

                  {/* Filters Row */}
                  <div className="flex items-center gap-3 flex-wrap">
                    <Select value={logFilters.level} onValueChange={(v) => setLogFilters({...logFilters, level: v})}>
                      <SelectTrigger className="w-[130px] bg-white/5 border-white/10 text-white text-sm" data-testid="select-log-level">
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
                      <SelectTrigger className="w-[130px] bg-white/5 border-white/10 text-white text-sm" data-testid="select-log-status">
                        <SelectValue placeholder="All Status" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1a1d24] border-white/10">
                        <SelectItem value="all" className="text-white">All Status</SelectItem>
                        <SelectItem value="false" className="text-white">Unresolved</SelectItem>
                        <SelectItem value="true" className="text-white">Resolved</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={logFilters.source} onValueChange={(v) => setLogFilters({...logFilters, source: v})}>
                      <SelectTrigger className="w-[140px] bg-white/5 border-white/10 text-white text-sm" data-testid="select-log-source">
                        <SelectValue placeholder="All Sources" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1a1d24] border-white/10">
                        <SelectItem value="all" className="text-white">All Sources</SelectItem>
                        <SelectItem value="api" className="text-white">API</SelectItem>
                        <SelectItem value="chat" className="text-white">Chat</SelectItem>
                        <SelectItem value="webhook" className="text-white">Webhook</SelectItem>
                        <SelectItem value="scraper" className="text-white">Scraper</SelectItem>
                        <SelectItem value="stripe" className="text-white">Stripe</SelectItem>
                        <SelectItem value="auth" className="text-white">Auth</SelectItem>
                        <SelectItem value="system" className="text-white">System</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={logFilters.clientId} onValueChange={(v) => setLogFilters({...logFilters, clientId: v})}>
                      <SelectTrigger className="w-[160px] bg-white/5 border-white/10 text-white text-sm" data-testid="select-log-client">
                        <SelectValue placeholder="All Clients" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1a1d24] border-white/10">
                        <SelectItem value="all" className="text-white">All Clients</SelectItem>
                        {(workspacesData?.workspaces || []).map(ws => (
                          <SelectItem key={ws.slug} value={ws.slug} className="text-white">
                            {ws.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {(logFilters.level !== 'all' || logFilters.isResolved !== 'all' || logFilters.source !== 'all' || logFilters.clientId !== 'all') && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setLogFilters({ level: 'all', source: 'all', isResolved: 'all', clientId: 'all' })}
                        className="text-white/55 hover:text-white"
                      >
                        <X className="h-4 w-4 mr-1" />
                        Clear Filters
                      </Button>
                    )}
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
                <UsersSectionPanel 
                  users={adminUsers || []}
                  isLoading={usersLoading}
                  workspaces={workspacesData?.workspaces || []}
                  onCreateUser={(data) => createUserMutation.mutate(data)}
                  onUpdateRole={(userId, newRole) => updateUserMutation.mutate({ id: userId, role: newRole })}
                  onDeleteUser={(userId) => deleteUserMutation.mutate(userId)}
                  isCreating={createUserMutation.isPending}
                />
              )}

              {/* Assistants Section - Global bot management */}
              {dashboardSection === 'assistants' && (
                <AssistantsSectionPanel 
                  bots={clientBots} 
                  templates={templates}
                  clients={clients}
                  workspaces={workspacesData?.workspaces || []}
                  botAnalytics={botAnalyticsData?.bots || []}
                  onSelectBot={(botId) => {
                    setSelectedBotId(botId);
                    setActiveTab('overview');
                  }}
                  onCreateBot={() => setShowCreateModal(true)}
                  onDuplicateBot={async (botId) => {
                    const bot = clientBots.find(b => b.botId === botId);
                    if (!bot) return;
                    try {
                      const response = await apiRequest("POST", `/api/super-admin/bots/${botId}/duplicate`);
                      const newBot = await response.json();
                      queryClient.invalidateQueries({ queryKey: ["/api/super-admin/bots"] });
                      toast({ title: "Bot Duplicated", description: `Created "${newBot.name || 'New Bot'}" as a copy.` });
                    } catch (e) {
                      toast({ title: "Error", description: "Failed to duplicate bot.", variant: "destructive" });
                    }
                  }}
                  onToggleBotStatus={async (botId, newStatus) => {
                    try {
                      await apiRequest("PATCH", `/api/super-admin/bots/${botId}/status`, { status: newStatus });
                      queryClient.invalidateQueries({ queryKey: ["/api/super-admin/bots"] });
                      toast({ title: "Status Updated", description: `Bot is now ${newStatus}.` });
                    } catch (e) {
                      toast({ title: "Error", description: "Failed to update bot status.", variant: "destructive" });
                    }
                  }}
                />
              )}

              {/* Templates Section - Template management */}
              {dashboardSection === 'templates' && (
                <TemplatesSectionPanel 
                  templates={templates}
                  clients={workspacesData?.workspaces || []}
                  onCreateFromTemplate={(template) => {
                    setSelectedTemplate(template);
                    setShowCreateModal(true);
                  }}
                />
              )}

              {/* Knowledge Section - Global knowledge base */}
              {dashboardSection === 'knowledge' && (
                <KnowledgeSectionPanel bots={clientBots} clients={workspacesData?.workspaces || []} />
              )}

              {/* Integrations Section - API keys and connections */}
              {dashboardSection === 'integrations' && (
                <IntegrationsSectionPanel />
              )}

              {/* Bot Requests Section - Contact form submissions */}
              {dashboardSection === 'requests' && (
                <BotRequestsSectionPanel />
              )}

              {/* Billing & Plans Section */}
              {dashboardSection === 'billing' && (
                <BillingSectionPanel 
                  workspaces={workspacesData?.workspaces || []}
                />
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

                {/* God Mode Tab Navigation */}
                <div className="mb-6">
                  {/* Primary Tabs - Core Editing */}
                  <div className="flex items-center gap-1 flex-wrap mb-2">
                    <span className="text-xs text-white/40 mr-2 uppercase tracking-wider">Edit</span>
                    {[
                      { value: 'overview', icon: Eye, label: 'Overview' },
                      { value: 'persona', icon: MessageCircle, label: 'Persona & AI' },
                      { value: 'knowledge', icon: FileText, label: 'Knowledge' },
                      { value: 'automations', icon: Workflow, label: 'Automations' },
                    ].map(tab => (
                      <Button
                        key={tab.value}
                        variant="ghost"
                        size="sm"
                        onClick={() => setActiveTab(tab.value)}
                        className={activeTab === tab.value 
                          ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' 
                          : 'text-white/55 hover:text-white hover:bg-white/10'}
                        data-testid={`tab-${tab.value}`}
                      >
                        <tab.icon className="h-4 w-4 mr-1" />
                        {tab.label}
                      </Button>
                    ))}
                  </div>
                  
                  {/* Secondary Tabs - Deployment & Testing */}
                  <div className="flex items-center gap-1 flex-wrap mb-2">
                    <span className="text-xs text-white/40 mr-2 uppercase tracking-wider">Deploy</span>
                    {[
                      { value: 'channels', icon: Palette, label: 'Channels & Widget' },
                      { value: 'test-chat', icon: Play, label: 'Test Sandbox', highlight: true },
                    ].map(tab => (
                      <Button
                        key={tab.value}
                        variant="ghost"
                        size="sm"
                        onClick={() => setActiveTab(tab.value)}
                        className={activeTab === tab.value 
                          ? (tab.highlight ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30')
                          : 'text-white/55 hover:text-white hover:bg-white/10'}
                        data-testid={`tab-${tab.value}`}
                      >
                        <tab.icon className="h-4 w-4 mr-1" />
                        {tab.label}
                      </Button>
                    ))}
                  </div>
                  
                  {/* Tertiary Tabs - Monitoring & Admin */}
                  <div className="flex items-center gap-1 flex-wrap">
                    <span className="text-xs text-white/40 mr-2 uppercase tracking-wider">Monitor</span>
                    {[
                      { value: 'analytics', icon: BarChart3, label: 'Analytics' },
                      { value: 'logs', icon: MessageSquare, label: 'Logs' },
                      { value: 'billing', icon: CreditCard, label: 'Billing' },
                    ].map(tab => (
                      <Button
                        key={tab.value}
                        variant="ghost"
                        size="sm"
                        onClick={() => setActiveTab(tab.value)}
                        className={activeTab === tab.value 
                          ? 'bg-white/10 text-white border border-white/20' 
                          : 'text-white/55 hover:text-white hover:bg-white/10'}
                        data-testid={`tab-${tab.value}`}
                      >
                        <tab.icon className="h-4 w-4 mr-1" />
                        {tab.label}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Tab Content */}
                <div className="space-y-6">
                  {activeTab === 'overview' && (
                    <OverviewPanel bot={selectedBot} client={selectedClient} />
                  )}

                  {activeTab === 'persona' && (
                    <PersonaPanel bot={selectedBot} clientType={selectedClient.type} />
                  )}

                  {activeTab === 'knowledge' && (
                    <KnowledgePanel bot={selectedBot} clientType={selectedClient.type} />
                  )}

                  {activeTab === 'test-chat' && (
                    <TestChatPanel clientId={selectedClient.id} botId={selectedBot.botId} botName={selectedBot.name} />
                  )}

                  {activeTab === 'channels' && (
                    <ChannelsPanel bot={selectedBot} client={selectedClient} />
                  )}

                  {activeTab === 'billing' && (
                    <BillingPanel clientId={selectedClient.id} clientName={selectedClient.name} status={selectedClient.status} />
                  )}

                  {activeTab === 'analytics' && (
                    <AnalyticsPanel clientId={selectedClient.id} />
                  )}

                  {activeTab === 'logs' && (
                    <LogsPanel clientId={selectedClient.id} botId={selectedBot.botId} />
                  )}

                  {activeTab === 'automations' && (
                    <AutomationsPanel botId={selectedBot.botId} clientId={selectedClient.id} />
                  )}
                </div>
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

      {/* Create Client Modal - Globally accessible */}
      <AlertDialog open={showCreateWorkspaceModal} onOpenChange={setShowCreateWorkspaceModal}>
        <AlertDialogContent className="bg-[#1a1d24] border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Add New Client</AlertDialogTitle>
            <AlertDialogDescription className="text-white/55">
              Create a new business client. Login credentials will be auto-generated for them to access their dashboard.
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
              <label className="text-sm text-white/85">Client Email</label>
              <input
                type="email"
                value={newWorkspaceForm.clientEmail}
                onChange={(e) => setNewWorkspaceForm(f => ({ ...f, clientEmail: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-cyan-400/50"
                placeholder="client@business.com"
                data-testid="input-new-workspace-email"
              />
              <p className="text-xs text-white/40">Client will use this email to log in to their dashboard</p>
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
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-transparent border-white/10 text-white hover:bg-white/10">
              Cancel
            </AlertDialogCancel>
            <Button
              onClick={() => createWorkspaceMutation.mutate(newWorkspaceForm)}
              disabled={!newWorkspaceForm.name || !newWorkspaceForm.slug || !newWorkspaceForm.clientEmail || createWorkspaceMutation.isPending}
              className="bg-cyan-500 hover:bg-cyan-600 text-white"
              data-testid="button-create-workspace-confirm"
            >
              {createWorkspaceMutation.isPending ? "Creating..." : "Create Client"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Generated Credentials Modal */}
      <AlertDialog open={showCredentialsModal} onOpenChange={setShowCredentialsModal}>
        <AlertDialogContent className="bg-[#1a1d24] border-white/10 max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-400" />
              Client Created Successfully
            </AlertDialogTitle>
            <AlertDialogDescription className="text-white/55">
              Share these login credentials with your client. They can use them to access their dashboard.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {generatedCredentials && (
            <div className="space-y-4 py-4">
              <div className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-3">
                <div className="space-y-1">
                  <label className="text-xs text-white/55 uppercase tracking-wide">Login Email</label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-cyan-400 bg-black/30 px-3 py-2 rounded text-sm font-mono">
                      {generatedCredentials.email}
                    </code>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-white/55 hover:text-white"
                      onClick={() => {
                        navigator.clipboard.writeText(generatedCredentials.email);
                        toast({ title: "Copied", description: "Email copied to clipboard" });
                      }}
                      data-testid="button-copy-email"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-white/55 uppercase tracking-wide">Temporary Password</label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-cyan-400 bg-black/30 px-3 py-2 rounded text-sm font-mono">
                      {generatedCredentials.temporaryPassword}
                    </code>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-white/55 hover:text-white"
                      onClick={() => {
                        navigator.clipboard.writeText(generatedCredentials.temporaryPassword);
                        toast({ title: "Copied", description: "Password copied to clipboard" });
                      }}
                      data-testid="button-copy-password"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-white/55 uppercase tracking-wide">Dashboard URL</label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-cyan-400 bg-black/30 px-3 py-2 rounded text-sm font-mono truncate">
                      {window.location.origin}{generatedCredentials.dashboardUrl}
                    </code>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-white/55 hover:text-white"
                      onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}${generatedCredentials.dashboardUrl}`);
                        toast({ title: "Copied", description: "Dashboard URL copied to clipboard" });
                      }}
                      data-testid="button-copy-dashboard-url"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
                <p className="text-amber-400 text-sm flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  Save these credentials now. The password cannot be retrieved later.
                </p>
              </div>
              <Button
                variant="outline"
                className="w-full border-white/10 text-white hover:bg-white/10"
                onClick={() => {
                  const text = `Login Credentials for ${newWorkspaceForm.name || 'Client'}\n\nEmail: ${generatedCredentials.email}\nPassword: ${generatedCredentials.temporaryPassword}\nDashboard: ${window.location.origin}${generatedCredentials.dashboardUrl}`;
                  navigator.clipboard.writeText(text);
                  toast({ title: "All Copied", description: "All credentials copied to clipboard" });
                }}
                data-testid="button-copy-all-credentials"
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy All Credentials
              </Button>
            </div>
          )}
          <AlertDialogFooter>
            <Button
              onClick={() => {
                setShowCredentialsModal(false);
                setGeneratedCredentials(null);
              }}
              className="bg-cyan-500 hover:bg-cyan-600 text-white"
              data-testid="button-close-credentials-modal"
            >
              Done
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
    </SaveLockProvider>
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

const RESPONSE_LENGTH_OPTIONS = [
  { value: 'brief', label: 'Brief', description: 'Short, concise responses' },
  { value: 'medium', label: 'Medium', description: 'Balanced response length' },
  { value: 'detailed', label: 'Detailed', description: 'Comprehensive explanations' },
];

// Persona Panel - System prompt, tone, personality settings
function PersonaPanel({ bot, clientType }: { bot: BotConfig; clientType?: string }) {
  const { toast } = useToast();
  const { acquireLock, releaseLock, isLocked } = useSaveLock();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    systemPrompt: bot.systemPrompt || '',
    tone: (bot as any).tone || 'professional',
    responseLength: (bot as any).responseLength || 'medium',
    personality: {
      formality: (bot as any).personality?.formality || 50,
      warmth: (bot as any).personality?.warmth || 70,
      enthusiasm: (bot as any).personality?.enthusiasm || 60,
    },
  });

  // Re-sync form data when bot changes (including after other panel saves)
  useEffect(() => {
    if (!isEditing) {
      setFormData({
        systemPrompt: bot.systemPrompt || '',
        tone: (bot as any).tone || 'professional',
        responseLength: (bot as any).responseLength || 'medium',
        personality: {
          formality: (bot as any).personality?.formality || 50,
          warmth: (bot as any).personality?.warmth || 70,
          enthusiasm: (bot as any).personality?.enthusiasm || 60,
        },
      });
    }
  }, [bot, isEditing]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      // Acquire lock to prevent concurrent saves
      await acquireLock();
      try {
        // Fetch latest bot data first to avoid overwriting other panels' changes
        const response = await fetch('/api/super-admin/bots');
        const allBots = await response.json() as BotConfig[];
        const latestBot = allBots.find(b => b.botId === bot.botId) || bot;
        
        // Merge our fields with the latest data
        const updatedBot = {
          ...latestBot,
          systemPrompt: formData.systemPrompt,
          tone: formData.tone,
          responseLength: formData.responseLength,
          personality: formData.personality,
        };
        const saveResponse = await apiRequest("PUT", `/api/super-admin/bots/${bot.botId}`, updatedBot);
        return saveResponse.json();
      } finally {
        releaseLock();
      }
    },
    onSuccess: () => {
      toast({ title: "Saved", description: "Persona settings have been updated." });
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ["/api/super-admin/bots"] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to save persona settings.", variant: "destructive" });
    },
  });

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <div className="flex justify-end gap-2">
        {isEditing ? (
          <>
            <Button variant="outline" size="sm" onClick={() => setIsEditing(false)} data-testid="button-cancel-persona">
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button size="sm" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} data-testid="button-save-persona">
              <Save className="h-4 w-4 mr-2" />
              {saveMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </>
        ) : (
          <Button variant="outline" size="sm" onClick={() => setIsEditing(true)} data-testid="button-edit-persona">
            <Edit2 className="h-4 w-4 mr-2" />
            Edit Persona
          </Button>
        )}
      </div>

      {/* System Prompt */}
      <GlassCard>
        <GlassCardHeader>
          <GlassCardTitle className="text-lg flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-cyan-400" />
            System Prompt
          </GlassCardTitle>
          <GlassCardDescription>Define how the AI assistant should behave and respond</GlassCardDescription>
        </GlassCardHeader>
        <GlassCardContent>
          {isEditing ? (
            <Textarea
              data-testid="input-system-prompt"
              value={formData.systemPrompt}
              onChange={(e) => setFormData({ ...formData, systemPrompt: e.target.value })}
              rows={8}
              placeholder="You are a helpful assistant for [Business Name]. Your role is to..."
              className="bg-white/5 border-white/10 text-white placeholder:text-white/40 font-mono text-sm"
            />
          ) : (
            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
              <pre className="text-sm text-white/80 whitespace-pre-wrap font-mono">{formData.systemPrompt || 'No system prompt configured'}</pre>
            </div>
          )}
        </GlassCardContent>
      </GlassCard>

      {/* Tone & Style */}
      <GlassCard>
        <GlassCardHeader>
          <GlassCardTitle className="text-lg flex items-center gap-2">
            <Palette className="h-5 w-5 text-purple-400" />
            Tone & Response Style
          </GlassCardTitle>
          <GlassCardDescription>Configure how the assistant communicates</GlassCardDescription>
        </GlassCardHeader>
        <GlassCardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-white/70">Conversation Tone</Label>
              {isEditing ? (
                <Select value={formData.tone} onValueChange={(v) => setFormData({ ...formData, tone: v })}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white mt-1" data-testid="select-tone">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1d24] border-white/10">
                    {TONE_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value} className="text-white">
                        <div>
                          <span>{opt.label}</span>
                          <span className="text-white/40 text-xs ml-2">{opt.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-sm mt-1 text-white">{TONE_OPTIONS.find(t => t.value === formData.tone)?.label || 'Professional'}</p>
              )}
            </div>
            <div>
              <Label className="text-white/70">Response Length</Label>
              {isEditing ? (
                <Select value={formData.responseLength} onValueChange={(v) => setFormData({ ...formData, responseLength: v })}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white mt-1" data-testid="select-response-length">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1d24] border-white/10">
                    {RESPONSE_LENGTH_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value} className="text-white">
                        <div>
                          <span>{opt.label}</span>
                          <span className="text-white/40 text-xs ml-2">{opt.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-sm mt-1 text-white">{RESPONSE_LENGTH_OPTIONS.find(r => r.value === formData.responseLength)?.label || 'Medium'}</p>
              )}
            </div>
          </div>

          {/* Personality Sliders */}
          {isEditing && (
            <div className="space-y-4 pt-4 border-t border-white/10">
              <h4 className="text-sm font-medium text-white/70">Personality Settings</h4>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs text-white/55 mb-1">
                    <span>Casual</span>
                    <span>Formality: {formData.personality.formality}%</span>
                    <span>Formal</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={formData.personality.formality}
                    onChange={(e) => setFormData({
                      ...formData,
                      personality: { ...formData.personality, formality: Number(e.target.value) }
                    })}
                    className="w-full accent-cyan-500"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-xs text-white/55 mb-1">
                    <span>Reserved</span>
                    <span>Warmth: {formData.personality.warmth}%</span>
                    <span>Warm</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={formData.personality.warmth}
                    onChange={(e) => setFormData({
                      ...formData,
                      personality: { ...formData.personality, warmth: Number(e.target.value) }
                    })}
                    className="w-full accent-purple-500"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-xs text-white/55 mb-1">
                    <span>Calm</span>
                    <span>Enthusiasm: {formData.personality.enthusiasm}%</span>
                    <span>Energetic</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={formData.personality.enthusiasm}
                    onChange={(e) => setFormData({
                      ...formData,
                      personality: { ...formData.personality, enthusiasm: Number(e.target.value) }
                    })}
                    className="w-full accent-amber-500"
                  />
                </div>
              </div>
            </div>
          )}
        </GlassCardContent>
      </GlassCard>

      {/* Preview Card */}
      <GlassCard>
        <GlassCardHeader>
          <GlassCardTitle className="text-lg">Response Preview</GlassCardTitle>
          <GlassCardDescription>Example of how the bot might respond</GlassCardDescription>
        </GlassCardHeader>
        <GlassCardContent>
          <div className="bg-white/5 rounded-lg p-4 border border-white/10">
            <p className="text-sm text-white/80 italic">
              {formData.tone === 'professional' && "Thank you for reaching out. I'd be happy to assist you with your inquiry today."}
              {formData.tone === 'friendly' && "Hey there! Great to hear from you! Let me help you out with that."}
              {formData.tone === 'casual' && "Hey! What can I do for you today?"}
              {formData.tone === 'compassionate' && "I understand, and I'm here to help. Let's work through this together."}
              {formData.tone === 'informative' && "Based on your inquiry, I can provide detailed information about our services."}
            </p>
          </div>
        </GlassCardContent>
      </GlassCard>
    </div>
  );
}

// Knowledge Panel - FAQs, business info, scraped content
function KnowledgePanel({ bot, clientType }: { bot: BotConfig; clientType?: string }) {
  const { toast } = useToast();
  const { acquireLock, releaseLock, isLocked } = useSaveLock();
  const [isEditing, setIsEditing] = useState(false);
  const [faqs, setFaqs] = useState<Array<{ question: string; answer: string }>>(bot.faqs || []);
  const [editingFaqIndex, setEditingFaqIndex] = useState<number | null>(null);
  const [newFaq, setNewFaq] = useState({ question: '', answer: '' });
  const [showAddFaq, setShowAddFaq] = useState(false);
  const [formData, setFormData] = useState({
    businessName: bot.businessProfile?.businessName || '',
    type: bot.businessProfile?.type || '',
    phone: bot.businessProfile?.phone || '',
    email: bot.businessProfile?.email || '',
    website: bot.businessProfile?.website || '',
    location: bot.businessProfile?.location || '',
    hours: formatHoursForDisplay(bot.businessProfile?.hours),
    services: bot.businessProfile?.services?.join(', ') || '',
    onlineBookingUrl: bot.businessProfile?.booking?.onlineBookingUrl || '',
  });

  // Re-sync form data when bot changes (including after other panel saves)
  useEffect(() => {
    if (!isEditing) {
      setFormData({
        businessName: bot.businessProfile?.businessName || '',
        type: bot.businessProfile?.type || '',
        phone: bot.businessProfile?.phone || '',
        email: bot.businessProfile?.email || '',
        website: bot.businessProfile?.website || '',
        location: bot.businessProfile?.location || '',
        hours: formatHoursForDisplay(bot.businessProfile?.hours),
        services: bot.businessProfile?.services?.join(', ') || '',
        onlineBookingUrl: bot.businessProfile?.booking?.onlineBookingUrl || '',
      });
      setFaqs(bot.faqs || []);
      setEditingFaqIndex(null);
      setShowAddFaq(false);
    }
  }, [bot, isEditing]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      // Acquire lock to prevent concurrent saves
      await acquireLock();
      try {
        // Fetch latest bot data first to avoid overwriting other panels' changes
        const response = await fetch('/api/super-admin/bots');
        const allBots = await response.json() as BotConfig[];
        const latestBot = allBots.find(b => b.botId === bot.botId) || bot;
        
        // Merge our fields with the latest data
        const updatedBot = {
          ...latestBot,
          businessProfile: {
            ...latestBot.businessProfile,
            businessName: formData.businessName,
            type: formData.type,
            phone: formData.phone,
            email: formData.email,
            website: formData.website,
            location: formData.location,
            hours: parseHoursFromString(formData.hours),
            services: formData.services.split(',').map(s => s.trim()).filter(Boolean),
            booking: {
              ...latestBot.businessProfile?.booking,
              onlineBookingUrl: formData.onlineBookingUrl || undefined,
            },
          },
          faqs: faqs,
        };
        const saveResponse = await apiRequest("PUT", `/api/super-admin/bots/${bot.botId}`, updatedBot);
        return saveResponse.json();
      } finally {
        releaseLock();
      }
    },
    onSuccess: () => {
      toast({ title: "Saved", description: "Knowledge base has been updated." });
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ["/api/super-admin/bots"] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to save knowledge.", variant: "destructive" });
    },
  });

  const handleAddFaq = () => {
    if (newFaq.question.trim() && newFaq.answer.trim()) {
      setFaqs([...faqs, { question: newFaq.question.trim(), answer: newFaq.answer.trim() }]);
      setNewFaq({ question: '', answer: '' });
      setShowAddFaq(false);
    }
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
            <Button variant="outline" size="sm" onClick={() => setIsEditing(false)} data-testid="button-cancel-knowledge">
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button size="sm" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} data-testid="button-save-knowledge">
              <Save className="h-4 w-4 mr-2" />
              {saveMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </>
        ) : (
          <Button variant="outline" size="sm" onClick={() => setIsEditing(true)} data-testid="button-edit-knowledge">
            <Edit2 className="h-4 w-4 mr-2" />
            Edit Knowledge
          </Button>
        )}
      </div>

      {/* FAQs Section */}
      <GlassCard>
        <GlassCardHeader>
          <div className="flex items-center justify-between">
            <div>
              <GlassCardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5 text-cyan-400" />
                FAQs ({faqs.length})
              </GlassCardTitle>
              <GlassCardDescription>Common questions and answers the bot knows</GlassCardDescription>
            </div>
            {isEditing && (
              <Button size="sm" onClick={() => setShowAddFaq(true)} className="bg-cyan-500 hover:bg-cyan-600" data-testid="button-add-faq">
                <Plus className="h-4 w-4 mr-1" />
                Add FAQ
              </Button>
            )}
          </div>
        </GlassCardHeader>
        <GlassCardContent>
          {showAddFaq && (
            <div className="mb-4 p-4 bg-white/5 rounded-lg border border-cyan-500/30 space-y-3">
              <Input
                placeholder="Question..."
                value={newFaq.question}
                onChange={(e) => setNewFaq({ ...newFaq, question: e.target.value })}
                className="bg-white/5 border-white/10 text-white"
                data-testid="input-new-faq-question"
              />
              <Textarea
                placeholder="Answer..."
                value={newFaq.answer}
                onChange={(e) => setNewFaq({ ...newFaq, answer: e.target.value })}
                className="bg-white/5 border-white/10 text-white"
                rows={3}
                data-testid="input-new-faq-answer"
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleAddFaq} data-testid="button-confirm-add-faq">
                  <Check className="h-4 w-4 mr-1" />
                  Add
                </Button>
                <Button size="sm" variant="ghost" onClick={() => { setShowAddFaq(false); setNewFaq({ question: '', answer: '' }); }}>
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {faqs.length === 0 ? (
            <div className="text-center py-8 text-white/40">
              <FileText className="h-8 w-8 mx-auto mb-2" />
              <p>No FAQs configured yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {faqs.map((faq, index) => (
                <div key={index} className="p-3 bg-white/5 rounded-lg border border-white/10" data-testid={`faq-item-${index}`}>
                  {editingFaqIndex === index && isEditing ? (
                    <div className="space-y-2">
                      <Input
                        value={faq.question}
                        onChange={(e) => {
                          const updated = [...faqs];
                          updated[index] = { ...faq, question: e.target.value };
                          setFaqs(updated);
                        }}
                        className="bg-white/5 border-white/10 text-white"
                      />
                      <Textarea
                        value={faq.answer}
                        onChange={(e) => {
                          const updated = [...faqs];
                          updated[index] = { ...faq, answer: e.target.value };
                          setFaqs(updated);
                        }}
                        className="bg-white/5 border-white/10 text-white"
                        rows={2}
                      />
                      <Button size="sm" onClick={() => setEditingFaqIndex(null)}>Done</Button>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-white text-sm">{faq.question}</p>
                        <p className="text-white/55 text-xs mt-1 line-clamp-2">{faq.answer}</p>
                      </div>
                      {isEditing && (
                        <div className="flex gap-1">
                          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setEditingFaqIndex(index)}>
                            <Edit2 className="h-3 w-3" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-6 w-6 text-red-400 hover:text-red-300" onClick={() => handleDeleteFaq(index)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </GlassCardContent>
      </GlassCard>

      {/* Business Information */}
      <GlassCard>
        <GlassCardHeader>
          <GlassCardTitle className="text-lg flex items-center gap-2">
            <Building2 className="h-5 w-5 text-purple-400" />
            Business Information
          </GlassCardTitle>
          <GlassCardDescription>Details the bot uses to answer questions about the business</GlassCardDescription>
        </GlassCardHeader>
        <GlassCardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-white/70 flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Business Name
              </Label>
              {isEditing ? (
                <Input value={formData.businessName} onChange={(e) => setFormData({ ...formData, businessName: e.target.value })} className="bg-white/5 border-white/10 text-white mt-1" />
              ) : (
                <p className="text-sm mt-1 text-white">{formData.businessName || '-'}</p>
              )}
            </div>
            <div>
              <Label className="text-white/70 flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Phone
              </Label>
              {isEditing ? (
                <Input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="bg-white/5 border-white/10 text-white mt-1" />
              ) : (
                <p className="text-sm mt-1 text-white">{formData.phone || '-'}</p>
              )}
            </div>
            <div>
              <Label className="text-white/70 flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email
              </Label>
              {isEditing ? (
                <Input value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="bg-white/5 border-white/10 text-white mt-1" />
              ) : (
                <p className="text-sm mt-1 text-white">{formData.email || '-'}</p>
              )}
            </div>
            <div>
              <Label className="text-white/70 flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Website
              </Label>
              {isEditing ? (
                <Input value={formData.website} onChange={(e) => setFormData({ ...formData, website: e.target.value })} className="bg-white/5 border-white/10 text-white mt-1" />
              ) : (
                <p className="text-sm mt-1 text-white">{formData.website || '-'}</p>
              )}
            </div>
          </div>
          <div>
            <Label className="text-white/70 flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Location
            </Label>
            {isEditing ? (
              <Input value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} className="bg-white/5 border-white/10 text-white mt-1" />
            ) : (
              <p className="text-sm mt-1 text-white">{formData.location || '-'}</p>
            )}
          </div>
          <div>
            <Label className="text-white/70 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Hours of Operation
            </Label>
            {isEditing ? (
              <Textarea value={formData.hours} onChange={(e) => setFormData({ ...formData, hours: e.target.value })} className="bg-white/5 border-white/10 text-white mt-1" rows={3} placeholder="Mon-Fri: 9am-5pm&#10;Sat: 10am-2pm" />
            ) : (
              <pre className="text-sm mt-1 text-white whitespace-pre-wrap">{formData.hours || '-'}</pre>
            )}
          </div>
          <div>
            <Label className="text-white/70">Services (comma-separated)</Label>
            {isEditing ? (
              <Input value={formData.services} onChange={(e) => setFormData({ ...formData, services: e.target.value })} className="bg-white/5 border-white/10 text-white mt-1" placeholder="Haircuts, Coloring, Styling" />
            ) : (
              <p className="text-sm mt-1 text-white">{formData.services || '-'}</p>
            )}
          </div>
          <div>
            <Label className="text-white/70 flex items-center gap-2">
              <ExternalLink className="h-4 w-4" />
              Online Booking URL
            </Label>
            {isEditing ? (
              <Input 
                value={formData.onlineBookingUrl} 
                onChange={(e) => setFormData({ ...formData, onlineBookingUrl: e.target.value })} 
                className="bg-white/5 border-white/10 text-white mt-1" 
                placeholder="https://calendly.com/your-booking-link"
                data-testid="input-booking-url"
              />
            ) : (
              <p className="text-sm mt-1 text-white">
                {formData.onlineBookingUrl ? (
                  <a href={formData.onlineBookingUrl} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">
                    {formData.onlineBookingUrl}
                  </a>
                ) : '-'}
              </p>
            )}
          </div>
        </GlassCardContent>
      </GlassCard>
    </div>
  );
}

// Channels Panel - Widget styling + embed code (combined)
function ChannelsPanel({ bot, client }: { bot: BotConfig; client: Client }) {
  const { toast } = useToast();
  const { acquireLock, releaseLock, isLocked } = useSaveLock();
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [widgetSettings, setWidgetSettings] = useState({
    primaryColor: (bot as any).widgetSettings?.primaryColor || '#00E5CC',
    position: (bot as any).widgetSettings?.position || 'bottom-right',
    greeting: (bot as any).widgetSettings?.greeting || 'Hi! How can I help you today?',
    showAvatar: (bot as any).widgetSettings?.showAvatar !== false,
  });

  useEffect(() => {
    if (!isEditing) {
      setWidgetSettings({
        primaryColor: (bot as any).widgetSettings?.primaryColor || '#00E5CC',
        position: (bot as any).widgetSettings?.position || 'bottom-right',
        greeting: (bot as any).widgetSettings?.greeting || 'Hi! How can I help you today?',
        showAvatar: (bot as any).widgetSettings?.showAvatar !== false,
      });
    }
  }, [bot, isEditing]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      // Acquire lock to prevent concurrent saves
      await acquireLock();
      try {
        const response = await fetch('/api/super-admin/bots');
        const allBots = await response.json() as BotConfig[];
        const latestBot = allBots.find(b => b.botId === bot.botId) || bot;
        
        const updatedBot = {
          ...latestBot,
          widgetSettings: widgetSettings,
        };
        const saveResponse = await apiRequest("PUT", `/api/super-admin/bots/${bot.botId}`, updatedBot);
        return saveResponse.json();
      } finally {
        releaseLock();
      }
    },
    onSuccess: () => {
      toast({ title: "Saved", description: "Widget settings have been updated." });
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ["/api/super-admin/bots"] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to save widget settings.", variant: "destructive" });
    },
  });

  const embedCode = `<script src="${window.location.origin}/widget/embed.js" data-bot-id="${bot.botId}"></script>`;

  const handleCopy = () => {
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    toast({ title: "Copied!", description: "Embed code copied to clipboard." });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <div className="flex justify-end gap-2">
        {isEditing ? (
          <>
            <Button variant="outline" size="sm" onClick={() => setIsEditing(false)} data-testid="button-cancel-widget">
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button size="sm" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} data-testid="button-save-widget">
              <Save className="h-4 w-4 mr-2" />
              {saveMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </>
        ) : (
          <Button variant="outline" size="sm" onClick={() => setIsEditing(true)} data-testid="button-edit-widget">
            <Edit2 className="h-4 w-4 mr-2" />
            Edit Widget
          </Button>
        )}
      </div>

      {/* Widget Configuration */}
      <GlassCard>
        <GlassCardHeader>
          <GlassCardTitle className="text-lg flex items-center gap-2">
            <Palette className="h-5 w-5 text-cyan-400" />
            Widget Appearance
          </GlassCardTitle>
          <GlassCardDescription>Customize how the chat widget looks</GlassCardDescription>
        </GlassCardHeader>
        <GlassCardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-white/70">Primary Color</Label>
              {isEditing ? (
                <div className="flex gap-2 mt-1">
                  <input
                    type="color"
                    value={widgetSettings.primaryColor}
                    onChange={(e) => setWidgetSettings({ ...widgetSettings, primaryColor: e.target.value })}
                    className="h-9 w-12 rounded border border-white/10 cursor-pointer"
                  />
                  <Input
                    value={widgetSettings.primaryColor}
                    onChange={(e) => setWidgetSettings({ ...widgetSettings, primaryColor: e.target.value })}
                    className="bg-white/5 border-white/10 text-white flex-1"
                  />
                </div>
              ) : (
                <div className="flex items-center gap-2 mt-1">
                  <div className="h-6 w-6 rounded" style={{ backgroundColor: widgetSettings.primaryColor }} />
                  <span className="text-sm text-white">{widgetSettings.primaryColor}</span>
                </div>
              )}
            </div>
            <div>
              <Label className="text-white/70">Position</Label>
              {isEditing ? (
                <Select value={widgetSettings.position} onValueChange={(v) => setWidgetSettings({ ...widgetSettings, position: v })}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white mt-1" data-testid="select-widget-position">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1d24] border-white/10">
                    <SelectItem value="bottom-right" className="text-white">Bottom Right</SelectItem>
                    <SelectItem value="bottom-left" className="text-white">Bottom Left</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-sm mt-1 text-white">{widgetSettings.position === 'bottom-right' ? 'Bottom Right' : 'Bottom Left'}</p>
              )}
            </div>
          </div>
          <div>
            <Label className="text-white/70">Greeting Message</Label>
            {isEditing ? (
              <Input
                value={widgetSettings.greeting}
                onChange={(e) => setWidgetSettings({ ...widgetSettings, greeting: e.target.value })}
                className="bg-white/5 border-white/10 text-white mt-1"
                placeholder="Hi! How can I help you today?"
              />
            ) : (
              <p className="text-sm mt-1 text-white">{widgetSettings.greeting}</p>
            )}
          </div>
        </GlassCardContent>
      </GlassCard>

      {/* Widget Preview */}
      <GlassCard>
        <GlassCardHeader>
          <GlassCardTitle className="text-lg flex items-center gap-2">
            <Eye className="h-5 w-5 text-purple-400" />
            Preview
          </GlassCardTitle>
          <GlassCardDescription>How the chat widget appears on client websites</GlassCardDescription>
        </GlassCardHeader>
        <GlassCardContent>
          <div className="flex justify-center py-8">
            <div className="relative">
              <div 
                className="h-14 w-14 rounded-full flex items-center justify-center shadow-lg cursor-pointer hover:scale-105 transition-transform"
                style={{ backgroundColor: widgetSettings.primaryColor }}
              >
                <MessageCircle className="h-6 w-6 text-white" />
              </div>
              <div 
                className="absolute inset-0 rounded-full animate-ping opacity-30"
                style={{ backgroundColor: widgetSettings.primaryColor }}
              />
            </div>
          </div>
          <div className="text-center mt-4">
            <Button variant="outline" size="sm" onClick={() => window.open(`/demo/${bot.botId}`, '_blank')} className="border-white/10 text-white/70" data-testid="button-preview-widget">
              <ExternalLink className="h-4 w-4 mr-2" />
              Open Full Preview
            </Button>
          </div>
        </GlassCardContent>
      </GlassCard>

      {/* Embed Code */}
      <GlassCard>
        <GlassCardHeader>
          <GlassCardTitle className="text-lg flex items-center gap-2">
            <Code className="h-5 w-5 text-cyan-400" />
            Embed Code
          </GlassCardTitle>
          <GlassCardDescription>Add this code to your client's website to enable the chat widget</GlassCardDescription>
        </GlassCardHeader>
        <GlassCardContent>
          <div className="relative">
            <pre className="bg-[#0d0d12] text-cyan-400 p-4 rounded-lg overflow-x-auto text-sm font-mono border border-white/10">
              {embedCode}
            </pre>
            <Button
              size="sm"
              onClick={handleCopy}
              className="absolute top-2 right-2 bg-white/10 hover:bg-white/20 text-white"
              data-testid="button-copy-embed"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
          <div className="mt-4 space-y-2">
            <h4 className="text-sm font-medium text-white/70">Installation Instructions:</h4>
            <ol className="text-sm text-white/55 space-y-1 list-decimal list-inside">
              <li>Copy the embed code above</li>
              <li>Paste it before the closing <code className="text-cyan-400">&lt;/body&gt;</code> tag on your website</li>
              <li>The widget will appear in the {widgetSettings.position === 'bottom-right' ? 'bottom-right' : 'bottom-left'} corner</li>
              <li>Test it by clicking the chat bubble</li>
            </ol>
          </div>
        </GlassCardContent>
      </GlassCard>

      {/* Channel Status */}
      <GlassCard>
        <GlassCardHeader>
          <GlassCardTitle className="text-lg">Available Channels</GlassCardTitle>
          <GlassCardDescription>Where this assistant can be deployed</GlassCardDescription>
        </GlassCardHeader>
        <GlassCardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-white/5 rounded-lg border border-green-500/30">
              <div className="flex items-center gap-2 mb-2">
                <Globe className="h-5 w-5 text-green-400" />
                <span className="font-medium text-white">Website Widget</span>
              </div>
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Connected</Badge>
            </div>
            <div className="p-4 bg-white/5 rounded-lg border border-white/10">
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare className="h-5 w-5 text-white/40" />
                <span className="font-medium text-white/40">SMS</span>
              </div>
              <Badge className="bg-white/10 text-white/40 border-white/10">Coming Soon</Badge>
            </div>
            <div className="p-4 bg-white/5 rounded-lg border border-white/10">
              <div className="flex items-center gap-2 mb-2">
                <Mail className="h-5 w-5 text-white/40" />
                <span className="font-medium text-white/40">Email</span>
              </div>
              <Badge className="bg-white/10 text-white/40 border-white/10">Coming Soon</Badge>
            </div>
            <div className="p-4 bg-white/5 rounded-lg border border-white/10">
              <div className="flex items-center gap-2 mb-2">
                <Phone className="h-5 w-5 text-white/40" />
                <span className="font-medium text-white/40">WhatsApp</span>
              </div>
              <Badge className="bg-white/10 text-white/40 border-white/10">Coming Soon</Badge>
            </div>
          </div>
        </GlassCardContent>
      </GlassCard>
    </div>
  );
}

// Bot Settings Panel - Full editing capabilities (legacy, kept for compatibility)
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
                <button
                  key={t.botId}
                  type="button"
                  className="cursor-pointer bg-white/5 border border-white/10 rounded-lg p-4 text-center hover:bg-white/10 transition-all"
                  onClick={() => handleSelectTemplate(t)}
                  data-testid={`template-select-${t.botId}`}
                >
                  <Building2 className="h-8 w-8 mx-auto mb-2 text-cyan-400" />
                  <p className="font-medium text-sm text-white capitalize">
                    {(t.metadata?.templateCategory || t.businessProfile?.type || t.name || '').replace(/_/g, ' ')}
                  </p>
                </button>
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

// Test Chat Panel - Interactive AI chat testing with debugging
interface DebugInfo {
  request: {
    endpoint: string;
    method: string;
    body: any;
    timestamp: string;
  };
  response: {
    status: number;
    data: any;
    latency: number;
    timestamp: string;
  } | null;
}

function TestChatPanel({ clientId, botId, botName }: { clientId: string; botId: string; botName: string }) {
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(() => `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const [showDebug, setShowDebug] = useState(false);
  const [debugLogs, setDebugLogs] = useState<DebugInfo[]>([]);
  const [selectedDebugIndex, setSelectedDebugIndex] = useState<number | null>(null);
  // Use a ref to always have current message history for API calls
  const messagesRef = useRef<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const { toast } = useToast();
  
  // Keep ref in sync with state
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage = inputValue.trim();
    setInputValue('');
    
    // Build the full message history using the ref (always current)
    const newUserMessage = { role: 'user' as const, content: userMessage };
    const fullHistory = [...messagesRef.current, newUserMessage];
    
    // Update both state and ref
    messagesRef.current = fullHistory;
    setMessages(fullHistory);
    setIsLoading(true);

    const requestBody = {
      messages: fullHistory,
      sessionId
    };
    
    const debugRequest: DebugInfo = {
      request: {
        endpoint: `/api/chat/${clientId}/${botId}`,
        method: 'POST',
        body: requestBody,
        timestamp: new Date().toISOString(),
      },
      response: null,
    };
    
    const startTime = Date.now();

    try {
      const response = await fetch(`/api/chat/${clientId}/${botId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(requestBody)
      });

      const latency = Date.now() - startTime;
      const data = await response.json();
      
      debugRequest.response = {
        status: response.status,
        data: data,
        latency,
        timestamp: new Date().toISOString(),
      };

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}: Failed to get response`);
      }
      
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
      setDebugLogs(prev => {
        const newLogs = [...prev, debugRequest];
        // Auto-select the latest log entry
        setSelectedDebugIndex(newLogs.length - 1);
        return newLogs;
      });
    } catch (error) {
      console.error('Chat error:', error);
      const latency = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Failed to get AI response';
      
      debugRequest.response = {
        status: debugRequest.response?.status || 500,
        data: { error: errorMessage },
        latency,
        timestamp: new Date().toISOString(),
      };
      
      // Add error message to chat so user sees it
      setMessages(prev => [...prev, { role: 'assistant', content: `Sorry, I encountered an error: ${errorMessage}. Please try again.` }]);
      setDebugLogs(prev => {
        const newLogs = [...prev, debugRequest];
        setSelectedDebugIndex(newLogs.length - 1);
        return newLogs;
      });
      
      toast({
        title: "Chat Error",
        description: `Request failed: ${errorMessage}`,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
    messagesRef.current = [];
    setDebugLogs([]);
    setSelectedDebugIndex(null);
    toast({ title: "Chat Cleared", description: "Conversation and debug logs have been reset." });
  };

  // Safe access to selected debug log with bounds checking
  const selectedDebug = selectedDebugIndex !== null && 
    selectedDebugIndex >= 0 && 
    selectedDebugIndex < debugLogs.length 
      ? debugLogs[selectedDebugIndex] 
      : null;

  return (
    <div className="space-y-4">
      {/* Debug Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
            Session: {sessionId.slice(0, 12)}...
          </Badge>
          <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30">
            {messages.length} messages
          </Badge>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setShowDebug(!showDebug)}
          className={showDebug ? "bg-purple-500/20 border-purple-500/30 text-purple-400" : "border-white/20 text-white/70"}
          data-testid="button-toggle-debug"
        >
          <Code className="h-4 w-4 mr-2" />
          {showDebug ? 'Hide Debug' : 'Show Debug'}
        </Button>
      </div>

      <div className={showDebug ? "grid grid-cols-2 gap-4" : ""}>
        {/* Chat Panel */}
        <GlassCard className="h-[500px] flex flex-col">
          <GlassCardHeader className="flex-shrink-0 flex flex-row items-center justify-between">
            <div>
              <GlassCardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-cyan-400" />
                Test Chat
              </GlassCardTitle>
              <GlassCardDescription>
                Test {botName} with real AI responses
              </GlassCardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={clearChat} className="border-white/20 text-white/70 hover:bg-white/10">
              <X className="h-4 w-4 mr-1" />
              Clear
            </Button>
          </GlassCardHeader>
          
          <GlassCardContent className="flex-1 flex flex-col min-h-0">
            <ScrollArea className="flex-1 pr-4 mb-4">
              <div className="space-y-4">
                {messages.length === 0 && (
                  <div className="text-center text-white/40 py-8">
                    <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>Start a conversation to test the AI</p>
                    <p className="text-sm mt-1">Try asking about services, hours, or booking</p>
                  </div>
                )}
                {messages.map((message, i) => (
                  <div
                    key={i}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                        message.role === 'user'
                          ? 'bg-cyan-500 text-white'
                          : 'bg-white/10 text-white/90'
                      }`}
                    >
                      {message.content}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-white/10 rounded-2xl px-4 py-2">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
            
            <div className="flex gap-2 flex-shrink-0">
              <Input
                data-testid="input-test-chat"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                placeholder="Type a message..."
                className="flex-1 bg-white/5 border-white/10 text-white placeholder:text-white/40"
                disabled={isLoading}
              />
              <Button 
                data-testid="button-send-message"
                onClick={sendMessage}
                disabled={isLoading || !inputValue.trim()}
                className="bg-cyan-500 hover:bg-cyan-600 text-white"
              >
                <SendHorizontal className="h-4 w-4" />
              </Button>
            </div>
          </GlassCardContent>
        </GlassCard>

        {/* Debug Panel */}
        {showDebug && (
          <GlassCard className="h-[500px] flex flex-col">
            <GlassCardHeader className="flex-shrink-0">
              <GlassCardTitle className="flex items-center gap-2">
                <Code className="h-5 w-5 text-purple-400" />
                Debug Console
              </GlassCardTitle>
              <GlassCardDescription>
                Raw API request/response data
              </GlassCardDescription>
            </GlassCardHeader>
            
            <GlassCardContent className="flex-1 flex flex-col min-h-0">
              {debugLogs.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-white/40 text-center">
                  <div>
                    <Code className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No API calls yet</p>
                    <p className="text-sm mt-1">Send a message to see debug data</p>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col min-h-0">
                  {/* Request History */}
                  <div className="flex gap-1 mb-3 overflow-x-auto pb-2">
                    {debugLogs.map((log, i) => (
                      <Button
                        key={i}
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedDebugIndex(i)}
                        className={`flex-shrink-0 ${selectedDebugIndex === i 
                          ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' 
                          : 'text-white/55 hover:text-white'}`}
                        data-testid={`button-debug-log-${i}`}
                      >
                        #{i + 1}
                        <Badge 
                          className={`ml-1 text-xs ${log.response?.status === 200 
                            ? 'bg-green-500/20 text-green-400' 
                            : 'bg-red-500/20 text-red-400'}`}
                        >
                          {log.response?.latency || '...'}ms
                        </Badge>
                      </Button>
                    ))}
                  </div>

                  {/* Selected Log Details */}
                  {selectedDebug && (
                    <ScrollArea className="flex-1">
                      <div className="space-y-4">
                        {/* Request */}
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30">REQUEST</Badge>
                            <span className="text-xs text-white/40">{selectedDebug.request.timestamp}</span>
                          </div>
                          <pre className="bg-black/30 rounded-lg p-3 text-xs text-white/80 overflow-x-auto font-mono">
                            <div className="text-cyan-400 mb-1">{selectedDebug.request.method} {selectedDebug.request.endpoint}</div>
                            {JSON.stringify(selectedDebug.request.body, null, 2)}
                          </pre>
                        </div>

                        {/* Response */}
                        {selectedDebug.response && (
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <Badge className={selectedDebug.response.status === 200 
                                ? 'bg-green-500/20 text-green-400 border-green-500/30'
                                : 'bg-red-500/20 text-red-400 border-red-500/30'
                              }>
                                RESPONSE {selectedDebug.response.status}
                              </Badge>
                              <span className="text-xs text-white/40">{selectedDebug.response.latency}ms</span>
                            </div>
                            <pre className="bg-black/30 rounded-lg p-3 text-xs text-white/80 overflow-x-auto font-mono">
                              {JSON.stringify(selectedDebug.response.data, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  )}
                </div>
              )}
            </GlassCardContent>
          </GlassCard>
        )}
      </div>

      {/* Quick Test Prompts */}
      <GlassCard>
        <GlassCardHeader>
          <GlassCardTitle className="text-sm">Quick Test Prompts</GlassCardTitle>
          <GlassCardDescription>Click to test common scenarios</GlassCardDescription>
        </GlassCardHeader>
        <GlassCardContent>
          <div className="flex flex-wrap gap-2">
            {[
              "What services do you offer?",
              "What are your hours?",
              "How can I book an appointment?",
              "How much do you charge?",
              "Where are you located?",
              "Do you have any specials?",
            ].map((prompt, i) => (
              <Button
                key={i}
                variant="outline"
                size="sm"
                onClick={() => {
                  setInputValue(prompt);
                }}
                className="border-white/10 text-white/70 hover:bg-white/10 hover:text-white"
                data-testid={`button-quick-prompt-${i}`}
              >
                {prompt}
              </Button>
            ))}
          </div>
        </GlassCardContent>
      </GlassCard>
    </div>
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

// Assistants Section Panel - Global bot management with filters, metrics, and actions
function AssistantsSectionPanel({ 
  bots, 
  templates,
  clients,
  workspaces,
  botAnalytics,
  onSelectBot,
  onCreateBot,
  onDuplicateBot,
  onToggleBotStatus
}: { 
  bots: BotConfig[]; 
  templates: Template[];
  clients: Client[];
  workspaces: Array<{ id: string; name: string; slug: string; status: string }>;
  botAnalytics: Array<{ botId: string; totalConversations: number; appointmentRequests: number }>;
  onSelectBot: (botId: string) => void;
  onCreateBot: () => void;
  onDuplicateBot: (botId: string) => void;
  onToggleBotStatus: (botId: string, newStatus: 'active' | 'paused') => void;
}) {
  const [filter, setFilter] = useState<{
    status: 'all' | 'active' | 'paused' | 'demo';
    type: string;
    clientId: string;
    search: string;
  }>({ status: 'all', type: 'all', clientId: 'all', search: '' });
  const [sortBy, setSortBy] = useState<'name' | 'type' | 'conversations' | 'leads'>('name');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  const getBotMetrics = (botId: string) => {
    const analytics = botAnalytics.find(a => a.botId === botId);
    return {
      conversations: analytics?.totalConversations || 0,
      leads: analytics?.appointmentRequests || 0
    };
  };

  const filteredBots = bots.filter(bot => {
    const client = clients.find(c => c.id === bot.clientId);
    const matchesStatus = filter.status === 'all' || client?.status === filter.status;
    const matchesType = filter.type === 'all' || bot.businessProfile?.type === filter.type;
    const matchesClient = filter.clientId === 'all' || bot.clientId === filter.clientId;
    const matchesSearch = !filter.search || 
      bot.name?.toLowerCase().includes(filter.search.toLowerCase()) ||
      bot.businessProfile?.businessName?.toLowerCase().includes(filter.search.toLowerCase()) ||
      client?.name?.toLowerCase().includes(filter.search.toLowerCase());
    return matchesStatus && matchesType && matchesClient && matchesSearch;
  }).sort((a, b) => {
    if (sortBy === 'name') return (a.name || '').localeCompare(b.name || '');
    if (sortBy === 'type') return (a.businessProfile?.type || '').localeCompare(b.businessProfile?.type || '');
    if (sortBy === 'conversations') {
      const aMetrics = getBotMetrics(a.botId);
      const bMetrics = getBotMetrics(b.botId);
      return bMetrics.conversations - aMetrics.conversations;
    }
    if (sortBy === 'leads') {
      const aMetrics = getBotMetrics(a.botId);
      const bMetrics = getBotMetrics(b.botId);
      return bMetrics.leads - aMetrics.leads;
    }
    return 0;
  });

  const activeCount = bots.filter(b => clients.find(c => c.id === b.clientId)?.status === 'active').length;
  const pausedCount = bots.filter(b => clients.find(c => c.id === b.clientId)?.status === 'paused').length;
  const demoCount = bots.filter(b => clients.find(c => c.id === b.clientId)?.status === 'demo').length;
  const totalConversations = botAnalytics.reduce((sum, a) => sum + (a.totalConversations || 0), 0);
  const totalLeads = botAnalytics.reduce((sum, a) => sum + (a.appointmentRequests || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-lg font-semibold text-white">All Assistants</h2>
          <p className="text-sm text-white/55">Manage all AI assistants across your platform</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex border border-white/10 rounded-lg overflow-hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode('grid')}
              className={viewMode === 'grid' ? 'bg-white/10 text-white' : 'text-white/55'}
              data-testid="button-view-grid"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode('table')}
              className={viewMode === 'table' ? 'bg-white/10 text-white' : 'text-white/55'}
              data-testid="button-view-table"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
          <Button onClick={onCreateBot} className="bg-cyan-500 hover:bg-cyan-600 text-white" data-testid="button-create-assistant">
            <Plus className="h-4 w-4 mr-2" />
            Create Assistant
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <GlassCard hover onClick={() => setFilter(f => ({ ...f, status: 'all' }))} className={filter.status === 'all' ? 'ring-1 ring-cyan-400/50' : ''}>
          <GlassCardContent className="py-4 text-center">
            <p className="text-2xl font-bold text-white">{bots.length}</p>
            <p className="text-xs text-white/55">Total Bots</p>
          </GlassCardContent>
        </GlassCard>
        <GlassCard hover onClick={() => setFilter(f => ({ ...f, status: 'active' }))} className={filter.status === 'active' ? 'ring-1 ring-green-400/50' : ''}>
          <GlassCardContent className="py-4 text-center">
            <p className="text-2xl font-bold text-green-400">{activeCount}</p>
            <p className="text-xs text-white/55">Active</p>
          </GlassCardContent>
        </GlassCard>
        <GlassCard hover onClick={() => setFilter(f => ({ ...f, status: 'paused' }))} className={filter.status === 'paused' ? 'ring-1 ring-amber-400/50' : ''}>
          <GlassCardContent className="py-4 text-center">
            <p className="text-2xl font-bold text-amber-400">{pausedCount}</p>
            <p className="text-xs text-white/55">Paused</p>
          </GlassCardContent>
        </GlassCard>
        <GlassCard hover onClick={() => setFilter(f => ({ ...f, status: 'demo' }))} className={filter.status === 'demo' ? 'ring-1 ring-blue-400/50' : ''}>
          <GlassCardContent className="py-4 text-center">
            <p className="text-2xl font-bold text-blue-400">{demoCount}</p>
            <p className="text-xs text-white/55">Demo</p>
          </GlassCardContent>
        </GlassCard>
        <GlassCard>
          <GlassCardContent className="py-4 text-center">
            <p className="text-2xl font-bold text-cyan-400">{totalConversations}</p>
            <p className="text-xs text-white/55">Conversations</p>
          </GlassCardContent>
        </GlassCard>
        <GlassCard>
          <GlassCardContent className="py-4 text-center">
            <p className="text-2xl font-bold text-purple-400">{totalLeads}</p>
            <p className="text-xs text-white/55">Leads</p>
          </GlassCardContent>
        </GlassCard>
      </div>

      {/* Filters Bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
          <Input
            placeholder="Search assistants or clients..."
            value={filter.search}
            onChange={(e) => setFilter(f => ({ ...f, search: e.target.value }))}
            className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-white/40"
            data-testid="input-filter-search"
          />
        </div>
        <Select value={filter.clientId} onValueChange={(v) => setFilter(f => ({ ...f, clientId: v }))}>
          <SelectTrigger className="w-[180px] bg-white/5 border-white/10 text-white" data-testid="select-filter-client">
            <Building2 className="h-4 w-4 mr-2 text-white/40" />
            <SelectValue placeholder="All Clients" />
          </SelectTrigger>
          <SelectContent className="bg-[#1a1d24] border-white/10">
            <SelectItem value="all" className="text-white">All Clients</SelectItem>
            {clients.map(client => (
              <SelectItem key={client.id} value={client.id} className="text-white">{client.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filter.type} onValueChange={(v) => setFilter(f => ({ ...f, type: v }))}>
          <SelectTrigger className="w-[150px] bg-white/5 border-white/10 text-white" data-testid="select-filter-type">
            <SelectValue placeholder="Business Type" />
          </SelectTrigger>
          <SelectContent className="bg-[#1a1d24] border-white/10">
            <SelectItem value="all" className="text-white">All Types</SelectItem>
            {BUSINESS_TYPES.map(type => (
              <SelectItem key={type.value} value={type.value} className="text-white">{type.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
          <SelectTrigger className="w-[150px] bg-white/5 border-white/10 text-white" data-testid="select-sort-by">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent className="bg-[#1a1d24] border-white/10">
            <SelectItem value="name" className="text-white">Name</SelectItem>
            <SelectItem value="type" className="text-white">Type</SelectItem>
            <SelectItem value="conversations" className="text-white">Conversations</SelectItem>
            <SelectItem value="leads" className="text-white">Leads</SelectItem>
          </SelectContent>
        </Select>
        {(filter.status !== 'all' || filter.type !== 'all' || filter.clientId !== 'all' || filter.search) && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setFilter({ status: 'all', type: 'all', clientId: 'all', search: '' })}
            className="text-white/55 hover:text-white"
          >
            <X className="h-4 w-4 mr-1" />
            Clear
          </Button>
        )}
      </div>

      {/* Assistants Display */}
      {filteredBots.length === 0 ? (
        <GlassCard>
          <GlassCardContent className="py-12 text-center">
            <Bot className="h-12 w-12 mx-auto mb-3 text-white/30" />
            <p className="text-white/55">No assistants match your filters</p>
            <Button variant="outline" className="mt-4 border-white/10 text-white/70" onClick={() => setFilter({ status: 'all', type: 'all', clientId: 'all', search: '' })}>
              Clear Filters
            </Button>
          </GlassCardContent>
        </GlassCard>
      ) : viewMode === 'table' ? (
        /* Table View */
        <GlassCard>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left p-4 text-xs font-medium text-white/55 uppercase">Assistant</th>
                  <th className="text-left p-4 text-xs font-medium text-white/55 uppercase">Client</th>
                  <th className="text-left p-4 text-xs font-medium text-white/55 uppercase">Type</th>
                  <th className="text-center p-4 text-xs font-medium text-white/55 uppercase">Status</th>
                  <th className="text-center p-4 text-xs font-medium text-white/55 uppercase">Conversations</th>
                  <th className="text-center p-4 text-xs font-medium text-white/55 uppercase">Leads</th>
                  <th className="text-right p-4 text-xs font-medium text-white/55 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBots.map(bot => {
                  const client = clients.find(c => c.id === bot.clientId);
                  const metrics = getBotMetrics(bot.botId);
                  const botStatus = bot.status || (client?.status === 'active' ? 'active' : 'paused');
                  return (
                    <tr 
                      key={bot.botId} 
                      className="border-b border-white/5 hover:bg-white/5 cursor-pointer"
                      onClick={() => onSelectBot(bot.botId)}
                      data-testid={`row-assistant-${bot.botId}`}
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-lg bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
                            <Bot className="h-4 w-4 text-cyan-400" />
                          </div>
                          <span className="text-white font-medium">{bot.name || bot.businessProfile?.businessName}</span>
                        </div>
                      </td>
                      <td className="p-4 text-white/70">{client?.name || 'Unknown'}</td>
                      <td className="p-4 text-white/55 text-sm">{BUSINESS_TYPES.find(t => t.value === bot.businessProfile?.type)?.label || 'Custom'}</td>
                      <td className="p-4 text-center">
                        <Badge className={`text-xs ${
                          botStatus === 'active' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                          botStatus === 'demo' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' :
                          'bg-amber-500/20 text-amber-400 border-amber-500/30'
                        }`}>
                          {botStatus}
                        </Badge>
                      </td>
                      <td className="p-4 text-center">
                        <span className="text-cyan-400 font-medium">{metrics.conversations}</span>
                      </td>
                      <td className="p-4 text-center">
                        <span className="text-purple-400 font-medium">{metrics.leads}</span>
                      </td>
                      <td className="p-4 text-right" onClick={e => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-white/55 hover:text-white" data-testid={`button-actions-${bot.botId}`}>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-[#1a1d24] border-white/10">
                            <DropdownMenuItem onClick={() => onSelectBot(bot.botId)} className="text-white hover:bg-white/10">
                              <Edit2 className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onDuplicateBot(bot.botId)} className="text-white hover:bg-white/10" data-testid={`button-duplicate-${bot.botId}`}>
                              <Copy className="h-4 w-4 mr-2" />
                              Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-white/10" />
                            <DropdownMenuItem 
                              onClick={() => onToggleBotStatus(bot.botId, botStatus === 'active' ? 'paused' : 'active')}
                              className={botStatus === 'active' ? 'text-amber-400 hover:bg-amber-500/10' : 'text-green-400 hover:bg-green-500/10'}
                              data-testid={`button-toggle-status-${bot.botId}`}
                            >
                              {botStatus === 'active' ? (
                                <>
                                  <Pause className="h-4 w-4 mr-2" />
                                  Pause
                                </>
                              ) : (
                                <>
                                  <Play className="h-4 w-4 mr-2" />
                                  Activate
                                </>
                              )}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </GlassCard>
      ) : (
        /* Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBots.map(bot => {
            const client = clients.find(c => c.id === bot.clientId);
            const metrics = getBotMetrics(bot.botId);
            const botStatus = bot.status || (client?.status === 'active' ? 'active' : 'paused');
            return (
              <GlassCard key={bot.botId} hover data-testid={`card-assistant-${bot.botId}`} className="cursor-pointer group">
                <GlassCardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-lg bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
                      <Building2 className="h-5 w-5 text-cyan-400" />
                    </div>
                    <div className="flex-1 min-w-0" onClick={() => onSelectBot(bot.botId)}>
                      <h3 className="font-medium text-white truncate">{bot.name || bot.businessProfile?.businessName}</h3>
                      <p className="text-xs text-white/55">{client?.name}</p>
                      <p className="text-xs text-white/40">{BUSINESS_TYPES.find(t => t.value === bot.businessProfile?.type)?.label || 'Custom'}</p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-white/40 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                          data-testid={`button-menu-${bot.botId}`}
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-[#1a1d24] border-white/10">
                        <DropdownMenuItem onClick={() => onSelectBot(bot.botId)} className="text-white hover:bg-white/10">
                          <Edit2 className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onDuplicateBot(bot.botId)} className="text-white hover:bg-white/10" data-testid={`button-duplicate-${bot.botId}`}>
                          <Copy className="h-4 w-4 mr-2" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-white/10" />
                        <DropdownMenuItem 
                          onClick={() => onToggleBotStatus(bot.botId, botStatus === 'active' ? 'paused' : 'active')}
                          className={botStatus === 'active' ? 'text-amber-400 hover:bg-amber-500/10' : 'text-green-400 hover:bg-green-500/10'}
                          data-testid={`button-toggle-status-${bot.botId}`}
                        >
                          {botStatus === 'active' ? (
                            <>
                              <Pause className="h-4 w-4 mr-2" />
                              Pause
                            </>
                          ) : (
                            <>
                              <Play className="h-4 w-4 mr-2" />
                              Activate
                            </>
                          )}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  
                  {/* Metrics Row */}
                  <div className="flex items-center gap-4 mt-3 pt-3 border-t border-white/10">
                    <Badge className={`text-xs ${
                      botStatus === 'active' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                      botStatus === 'demo' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' :
                      'bg-amber-500/20 text-amber-400 border-amber-500/30'
                    }`}>
                      {botStatus}
                    </Badge>
                    <div className="flex items-center gap-1 text-xs text-white/55">
                      <MessageSquare className="h-3 w-3" />
                      <span className="text-cyan-400 font-medium">{metrics.conversations}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-white/55">
                      <Users className="h-3 w-3" />
                      <span className="text-purple-400 font-medium">{metrics.leads}</span>
                    </div>
                    <span className="text-xs text-white/40 ml-auto">{bot.faqs?.length || 0} FAQs</span>
                  </div>
                </GlassCardContent>
              </GlassCard>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Template categories with icons and descriptions
const TEMPLATE_CATEGORIES = [
  { id: 'all', label: 'All Templates', icon: LayoutGrid, color: 'text-white' },
  { id: 'sober_living', label: 'Sober Living', icon: Shield, color: 'text-emerald-400' },
  { id: 'barber', label: 'Barber & Salon', icon: Users2, color: 'text-amber-400' },
  { id: 'gym', label: 'Gym & Fitness', icon: Activity, color: 'text-rose-400' },
  { id: 'restaurant', label: 'Restaurant', icon: Building2, color: 'text-orange-400' },
  { id: 'auto', label: 'Auto Shop', icon: Settings, color: 'text-blue-400' },
  { id: 'home_services', label: 'Home Services', icon: Building2, color: 'text-teal-400' },
  { id: 'medical', label: 'Medical & Dental', icon: Shield, color: 'text-cyan-400' },
  { id: 'real_estate', label: 'Real Estate', icon: Building2, color: 'text-purple-400' },
  { id: 'retail', label: 'Retail', icon: CreditCard, color: 'text-pink-400' },
  { id: 'other', label: 'Other', icon: FileText, color: 'text-white/70' },
];

// Built-in starter templates for when no templates exist
const STARTER_TEMPLATES: Template[] = [
  {
    botId: 'starter-sober-living',
    clientId: 'system',
    name: 'Sober Living Home Assistant',
    description: 'Compassionate AI assistant for sober living facilities. Handles admissions inquiries, insurance questions, facility tours, and provides 24/7 support information.',
    metadata: { isTemplate: true, templateCategory: 'sober_living', version: '1.0' },
    businessProfile: {
      businessName: 'Serenity House',
      type: 'sober_living',
      services: ['Structured Living', 'Group Therapy', 'Job Placement', 'Alumni Support', 'Family Programs'],
    },
    systemPrompt: 'You are a compassionate admissions counselor for a sober living facility. Be warm, non-judgmental, and supportive. Focus on helping callers understand options and next steps.',
    faqs: [
      { question: 'What insurance do you accept?', answer: 'We work with most major insurance providers including PPO plans. Contact us for a free verification.' },
      { question: 'How long is the typical stay?', answer: 'Most residents stay 90 days to 6 months, depending on individual needs and recovery goals.' },
      { question: 'Can family visit?', answer: 'Yes! We encourage family involvement. Visiting hours are Saturday and Sunday afternoons.' },
    ],
  },
  {
    botId: 'starter-barber',
    clientId: 'system',
    name: 'Barber Shop Assistant',
    description: 'Friendly assistant for barber shops and salons. Books appointments, shares service menus, answers pricing questions, and showcases work portfolios.',
    metadata: { isTemplate: true, templateCategory: 'barber', version: '1.0' },
    businessProfile: {
      businessName: 'The Gentleman\'s Cut',
      type: 'barber',
      services: ['Classic Cuts', 'Fades', 'Beard Trims', 'Hot Towel Shave', 'Kids Cuts'],
    },
    systemPrompt: 'You are a friendly front-desk assistant for an upscale barber shop. Be casual but professional. Help customers book appointments and learn about services.',
    faqs: [
      { question: 'Do you take walk-ins?', answer: 'Yes! Walk-ins are welcome, but appointments guarantee your spot. Book online for the best experience.' },
      { question: 'How much is a haircut?', answer: 'Classic cuts start at $25. Fades are $35, and beard trims are $15. Check our full menu online!' },
      { question: 'What are your hours?', answer: 'We\'re open Tuesday-Saturday 9am-7pm, closed Sunday and Monday.' },
    ],
  },
  {
    botId: 'starter-gym',
    clientId: 'system',
    name: 'Fitness Center Assistant',
    description: 'Energetic AI for gyms and fitness studios. Handles membership inquiries, class schedules, personal training info, and facility questions.',
    metadata: { isTemplate: true, templateCategory: 'gym', version: '1.0' },
    businessProfile: {
      businessName: 'Peak Performance Fitness',
      type: 'gym',
      services: ['24/7 Gym Access', 'Personal Training', 'Group Classes', 'Nutrition Coaching', 'Recovery Zone'],
    },
    systemPrompt: 'You are an enthusiastic fitness consultant. Be motivating and helpful. Guide potential members through options and help them take the first step in their fitness journey.',
    faqs: [
      { question: 'How much is a membership?', answer: 'Memberships start at $29/month for basic access. Premium memberships with classes are $49/month. We have no signup fees this month!' },
      { question: 'Do you offer personal training?', answer: 'Absolutely! We have certified trainers available. Your first session is complimentary with any membership.' },
      { question: 'What classes do you offer?', answer: 'We offer 50+ weekly classes including yoga, HIIT, spin, boxing, and more. Check our app for the full schedule.' },
    ],
  },
  {
    botId: 'starter-restaurant',
    clientId: 'system',
    name: 'Restaurant Concierge',
    description: 'Welcoming assistant for restaurants. Handles reservations, menu inquiries, dietary accommodations, catering requests, and special event bookings.',
    metadata: { isTemplate: true, templateCategory: 'restaurant', version: '1.0' },
    businessProfile: {
      businessName: 'The Local Table',
      type: 'restaurant',
      services: ['Dine-In', 'Takeout', 'Private Events', 'Catering', 'Happy Hour'],
    },
    systemPrompt: 'You are a warm, professional restaurant host. Help guests with reservations, answer menu questions, and accommodate special requests with hospitality.',
    faqs: [
      { question: 'Do you take reservations?', answer: 'Yes! You can book online or call us. We recommend reservations for parties of 4 or more, especially on weekends.' },
      { question: 'Do you have vegetarian options?', answer: 'Absolutely! About a third of our menu is vegetarian, and we can modify many dishes. Let your server know about any dietary needs.' },
      { question: 'Do you have a private room?', answer: 'Yes! Our Garden Room seats up to 25 guests for private events. Contact us for custom menus and availability.' },
    ],
  },
  {
    botId: 'starter-auto',
    clientId: 'system',
    name: 'Auto Shop Service Advisor',
    description: 'Knowledgeable assistant for auto repair shops. Schedules service appointments, provides estimates, explains repairs, and handles warranty questions.',
    metadata: { isTemplate: true, templateCategory: 'auto', version: '1.0' },
    businessProfile: {
      businessName: 'Precision Auto Care',
      type: 'auto',
      services: ['Oil Changes', 'Brake Service', 'Engine Diagnostics', 'Tire Service', 'A/C Repair'],
    },
    systemPrompt: 'You are a friendly, trustworthy auto service advisor. Explain repairs in simple terms, be transparent about pricing, and help customers schedule service.',
    faqs: [
      { question: 'How much is an oil change?', answer: 'Conventional oil changes start at $39.99, synthetic at $69.99. We\'ll also do a free multi-point inspection.' },
      { question: 'Do you offer loaner cars?', answer: 'We provide free shuttle service within 10 miles. For longer repairs, we have rental car partnerships.' },
      { question: 'Do you work on all makes?', answer: 'Yes! We service all makes and models. Our techs are ASE certified with specialized training.' },
    ],
  },
  {
    botId: 'starter-home',
    clientId: 'system',
    name: 'Home Services Assistant',
    description: 'Professional assistant for contractors and home service providers. Handles quote requests, scheduling, service areas, and emergency availability.',
    metadata: { isTemplate: true, templateCategory: 'home_services', version: '1.0' },
    businessProfile: {
      businessName: 'Reliable Home Pros',
      type: 'home_services',
      services: ['Plumbing', 'HVAC', 'Electrical', 'Handyman', 'Appliance Repair'],
    },
    systemPrompt: 'You are a professional service coordinator. Be helpful and efficient. Gather job details, check service availability, and help homeowners get the help they need.',
    faqs: [
      { question: 'Do you offer free estimates?', answer: 'Yes! We provide free estimates for most jobs. There\'s a small diagnostic fee for complex issues, applied to your repair if you proceed.' },
      { question: 'What areas do you serve?', answer: 'We serve a 25-mile radius from downtown. Enter your zip code and we\'ll confirm coverage.' },
      { question: 'Do you offer emergency service?', answer: 'Yes! We have 24/7 emergency service for plumbing and HVAC. Call our emergency line for immediate dispatch.' },
    ],
  },
];

// Templates Section Panel - Template gallery with categories
function TemplatesSectionPanel({ 
  templates,
  onCreateFromTemplate,
  clients
}: { 
  templates: Template[];
  onCreateFromTemplate: (template: Template) => void;
  clients: Client[];
}) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);
  const [createFromTemplate, setCreateFromTemplate] = useState<Template | null>(null);
  const [newBotName, setNewBotName] = useState('');
  const [selectedClientId, setSelectedClientId] = useState('');
  const { toast } = useToast();
  
  // Combine saved templates with starter templates if none exist
  const allTemplates = templates.length > 0 ? templates : STARTER_TEMPLATES;
  
  // Get unique categories from templates
  const existingCategories = new Set(allTemplates.map(t => t.metadata?.templateCategory || 'other'));
  const categories = TEMPLATE_CATEGORIES.filter(c => c.id === 'all' || existingCategories.has(c.id));
  
  // Filter templates
  const filteredTemplates = allTemplates.filter(t => {
    const matchesCategory = selectedCategory === 'all' || t.metadata?.templateCategory === selectedCategory;
    const matchesSearch = !searchQuery || 
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const createBotMutation = useMutation({
    mutationFn: async ({ template, clientId, name }: { template: Template; clientId: string; name: string }) => {
      return apiRequest('POST', '/api/super-admin/bots/from-template', {
        templateBotId: template.botId,
        clientId,
        name,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/super-admin'] });
      setCreateFromTemplate(null);
      setNewBotName('');
      setSelectedClientId('');
      toast({ title: 'Success', description: 'Bot created from template successfully!' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: 'Failed to create bot from template', variant: 'destructive' });
    }
  });

  const handleCreateFromTemplate = () => {
    if (!createFromTemplate || !selectedClientId || !newBotName.trim()) return;
    createBotMutation.mutate({
      template: createFromTemplate,
      clientId: selectedClientId,
      name: newBotName.trim(),
    });
  };

  const getCategoryInfo = (categoryId: string) => {
    return TEMPLATE_CATEGORIES.find(c => c.id === categoryId) || TEMPLATE_CATEGORIES[0];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-lg font-semibold text-white">Bot Templates</h2>
          <p className="text-sm text-white/55">Pre-configured playbooks for quick client deployment</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
            {allTemplates.length} Templates
          </Badge>
          <Button
            variant="outline"
            size="sm"
            className="border-white/20 text-white/70 hover:text-white hover:bg-white/10"
            data-testid="button-create-template"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Template
          </Button>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/40" />
          <Input
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-white/40"
            data-testid="input-search-templates"
          />
        </div>
      </div>

      {/* Category Tabs */}
      <ScrollArea className="w-full">
        <div className="flex items-center gap-2 pb-2">
          {categories.map(cat => {
            const Icon = cat.icon;
            const count = cat.id === 'all' 
              ? allTemplates.length 
              : allTemplates.filter(t => t.metadata?.templateCategory === cat.id).length;
            return (
              <Button
                key={cat.id}
                variant="ghost"
                size="sm"
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-2 whitespace-nowrap ${
                  selectedCategory === cat.id 
                    ? 'bg-purple-500/20 text-purple-400' 
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
                data-testid={`button-category-${cat.id}`}
              >
                <Icon className={`h-4 w-4 ${selectedCategory === cat.id ? cat.color : ''}`} />
                {cat.label}
                <Badge className="bg-white/10 text-white/60 text-xs px-1.5 ml-1">{count}</Badge>
              </Button>
            );
          })}
        </div>
      </ScrollArea>

      {/* Templates Grid */}
      {filteredTemplates.length === 0 ? (
        <GlassCard>
          <GlassCardContent className="py-12 text-center">
            <FileText className="h-12 w-12 mx-auto mb-3 text-white/30" />
            <p className="text-white/55">No templates match your search</p>
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                className="mt-2 text-cyan-400"
                onClick={() => setSearchQuery('')}
              >
                Clear search
              </Button>
            )}
          </GlassCardContent>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTemplates.map(template => {
            const catInfo = getCategoryInfo(template.metadata?.templateCategory || 'other');
            const CatIcon = catInfo.icon;
            return (
              <GlassCard key={template.botId} hover data-testid={`card-template-${template.botId}`}>
                <GlassCardContent className="p-4">
                  {/* Header */}
                  <div className="flex items-start gap-3 mb-3">
                    <div className={`h-10 w-10 rounded-lg bg-gradient-to-br from-purple-500/20 to-cyan-500/20 flex items-center justify-center flex-shrink-0`}>
                      <CatIcon className={`h-5 w-5 ${catInfo.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-white truncate">{template.name}</h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge className="bg-white/10 text-white/60 text-xs">
                          {template.metadata?.templateCategory?.replace(/_/g, ' ')}
                        </Badge>
                        {template.metadata?.version && (
                          <span className="text-xs text-white/40">v{template.metadata.version}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Description */}
                  <p className="text-sm text-white/55 line-clamp-2 mb-4">{template.description}</p>
                  
                  {/* Stats Row */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex items-center gap-1 text-xs text-white/50">
                      <MessageSquare className="h-3 w-3" />
                      <span className="text-cyan-400">{template.faqs?.length || 0}</span>
                      <span>FAQs</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-white/50">
                      <Layers className="h-3 w-3" />
                      <span className="text-purple-400">{template.businessProfile?.services?.length || 0}</span>
                      <span>Services</span>
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setPreviewTemplate(template)}
                      className="flex-1 text-white/70 hover:text-white hover:bg-white/10"
                      data-testid={`button-preview-template-${template.botId}`}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Preview
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => {
                        setCreateFromTemplate(template);
                        setNewBotName(template.name);
                      }}
                      className="flex-1 bg-purple-500 hover:bg-purple-600 text-white"
                      data-testid={`button-use-template-${template.botId}`}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Use Template
                    </Button>
                  </div>
                </GlassCardContent>
              </GlassCard>
            );
          })}
        </div>
      )}

      {/* Template Features Info */}
      <GlassCard>
        <GlassCardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-lg bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
                <Bot className="h-4 w-4 text-cyan-400" />
              </div>
              <div>
                <h4 className="font-medium text-white text-sm">Pre-Built AI Persona</h4>
                <p className="text-xs text-white/55 mt-1">Industry-tuned personality, tone, and conversation style</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-lg bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                <MessageSquare className="h-4 w-4 text-purple-400" />
              </div>
              <div>
                <h4 className="font-medium text-white text-sm">Starter FAQs</h4>
                <p className="text-xs text-white/55 mt-1">Common questions and answers ready to customize</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-lg bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                <Palette className="h-4 w-4 text-amber-400" />
              </div>
              <div>
                <h4 className="font-medium text-white text-sm">Industry Styling</h4>
                <p className="text-xs text-white/55 mt-1">Widget colors and design matched to the niche</p>
              </div>
            </div>
          </div>
        </GlassCardContent>
      </GlassCard>

      {/* Preview Template Dialog */}
      <Dialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)}>
        <DialogContent className="bg-[#0a0a0f] border-white/10 text-white max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              {previewTemplate && (() => {
                const catInfo = getCategoryInfo(previewTemplate.metadata?.templateCategory || 'other');
                const CatIcon = catInfo.icon;
                return (
                  <>
                    <div className="h-10 w-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                      <CatIcon className={`h-5 w-5 ${catInfo.color}`} />
                    </div>
                    <div>
                      <span>{previewTemplate.name}</span>
                      <Badge className="ml-2 bg-white/10 text-white/60 text-xs">
                        {previewTemplate.metadata?.templateCategory?.replace(/_/g, ' ')}
                      </Badge>
                    </div>
                  </>
                );
              })()}
            </DialogTitle>
            <DialogDescription className="text-white/55">
              {previewTemplate?.description}
            </DialogDescription>
          </DialogHeader>
          
          {previewTemplate && (
            <div className="space-y-6 mt-4">
              {/* Services */}
              {previewTemplate.businessProfile?.services && previewTemplate.businessProfile.services.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-white mb-2">Included Services</h4>
                  <div className="flex flex-wrap gap-2">
                    {previewTemplate.businessProfile.services.map((service, idx) => (
                      <Badge key={idx} className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30">{service}</Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Sample FAQs */}
              {previewTemplate.faqs && previewTemplate.faqs.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-white mb-2">Sample FAQs ({previewTemplate.faqs.length})</h4>
                  <div className="space-y-2">
                    {previewTemplate.faqs.slice(0, 3).map((faq, idx) => (
                      <div key={idx} className="bg-white/5 rounded-lg p-3 border border-white/10">
                        <p className="text-sm text-white font-medium">Q: {faq.question}</p>
                        <p className="text-sm text-white/55 mt-1">A: {faq.answer}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* System Prompt Preview */}
              {previewTemplate.systemPrompt && (
                <div>
                  <h4 className="text-sm font-medium text-white mb-2">AI Personality</h4>
                  <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                    <p className="text-sm text-white/70">{previewTemplate.systemPrompt}</p>
                  </div>
                </div>
              )}
            </div>
          )}
          
          <DialogFooter className="mt-6">
            <Button variant="ghost" onClick={() => setPreviewTemplate(null)} className="text-white/70">
              Close
            </Button>
            <Button 
              onClick={() => {
                setPreviewTemplate(null);
                if (previewTemplate) {
                  setCreateFromTemplate(previewTemplate);
                  setNewBotName(previewTemplate.name);
                }
              }}
              className="bg-purple-500 hover:bg-purple-600 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Use This Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create from Template Dialog */}
      <Dialog open={!!createFromTemplate} onOpenChange={() => setCreateFromTemplate(null)}>
        <DialogContent className="bg-[#0a0a0f] border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-purple-400" />
              Create Bot from Template
            </DialogTitle>
            <DialogDescription className="text-white/55">
              Creating a new bot based on "{createFromTemplate?.name}"
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            <div>
              <Label className="text-white/70">Bot Name</Label>
              <Input
                value={newBotName}
                onChange={(e) => setNewBotName(e.target.value)}
                placeholder="Enter bot name..."
                className="mt-1.5 bg-white/5 border-white/10 text-white"
                data-testid="input-new-bot-name"
              />
            </div>
            
            <div>
              <Label className="text-white/70">Assign to Client</Label>
              <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                <SelectTrigger className="mt-1.5 bg-white/5 border-white/10 text-white" data-testid="select-client-for-template">
                  <SelectValue placeholder="Select a client..." />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1d24] border-white/10">
                  {clients.map(client => (
                    <SelectItem key={client.id} value={client.id} className="text-white">
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter className="mt-6">
            <Button variant="ghost" onClick={() => setCreateFromTemplate(null)} className="text-white/70">
              Cancel
            </Button>
            <Button 
              onClick={handleCreateFromTemplate}
              disabled={!selectedClientId || !newBotName.trim() || createBotMutation.isPending}
              className="bg-purple-500 hover:bg-purple-600 text-white"
              data-testid="button-confirm-create-from-template"
            >
              {createBotMutation.isPending ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Create Bot
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Knowledge Section Panel - Global knowledge management
function KnowledgeSectionPanel({ bots, clients }: { bots: BotConfig[]; clients: Client[] }) {
  const [selectedBotId, setSelectedBotId] = useState<string | null>(null);
  const [selectedClientFilter, setSelectedClientFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'overview' | 'detail'>('overview');
  const [selectedFaqIds, setSelectedFaqIds] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  
  // Filter bots by client
  const filteredBots = selectedClientFilter === 'all' 
    ? bots 
    : bots.filter(b => b.clientId === selectedClientFilter);
  
  // Compute stats
  const totalFaqs = filteredBots.reduce((sum, bot) => sum + (bot.faqs?.length || 0), 0);
  const totalServices = filteredBots.reduce((sum, bot) => sum + (bot.businessProfile?.services?.length || 0), 0);
  const botsWithRules = filteredBots.filter(b => b.rules?.specialInstructions?.length).length;
  const botsWithSystemPrompt = filteredBots.filter(b => b.systemPrompt).length;

  const selectedBot = bots.find(b => b.botId === selectedBotId);
  
  // All FAQs across all filtered bots (filtered by search when in detail mode)
  const displayFaqs = filteredBots.flatMap(bot => 
    (bot.faqs || []).map((faq, idx) => ({
      ...faq,
      botId: bot.botId,
      botName: bot.name || bot.businessProfile?.businessName || 'Unknown Bot',
      faqId: `${bot.botId}_faq_${idx}`,
    }))
  ).filter(faq => 
    !searchQuery || 
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Create a Set of visible FAQ IDs for quick lookup
  const visibleFaqIds = new Set(displayFaqs.map(f => f.faqId));
  
  // Only count selections that are currently visible
  const validSelectionCount = Array.from(selectedFaqIds).filter(id => visibleFaqIds.has(id)).length;
  
  // Clear selections when filters change or view mode changes
  useEffect(() => {
    if (selectedFaqIds.size > 0) {
      setSelectedFaqIds(new Set());
    }
  }, [selectedClientFilter, searchQuery, viewMode]);
  
  // Get client name helper
  const getClientName = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    return client?.name || clientId;
  };

  // Sort bots by FAQ count (most first)
  const botsByFaqCount = [...filteredBots].sort((a, b) => 
    (b.faqs?.length || 0) - (a.faqs?.length || 0)
  );

  const handleSelectAllFaqs = () => {
    const allSelected = displayFaqs.every(f => selectedFaqIds.has(f.faqId));
    if (allSelected && displayFaqs.length > 0) {
      setSelectedFaqIds(new Set());
    } else {
      setSelectedFaqIds(new Set(displayFaqs.map(f => f.faqId)));
    }
  };

  const handleBulkExport = () => {
    // Only export FAQs that are currently visible AND selected
    const faqsToExport = displayFaqs.filter(f => selectedFaqIds.has(f.faqId));
    if (faqsToExport.length === 0) {
      toast({ title: 'No FAQs Selected', description: 'Please select FAQs to export', variant: 'destructive' });
      return;
    }
    
    const csvContent = [
      ['Bot', 'Question', 'Answer'],
      ...faqsToExport.map(f => [f.botName, f.question, f.answer])
    ].map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `faqs_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast({ title: 'Exported', description: `${faqsToExport.length} FAQs exported to CSV` });
    setSelectedFaqIds(new Set());
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-lg font-semibold text-white">Knowledge Base</h2>
          <p className="text-sm text-white/55">Manage FAQs, services, and training data across all assistants</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setViewMode('overview')}
            className={viewMode === 'overview' ? 'bg-cyan-500/20 text-cyan-400' : 'text-white/70 hover:text-white'}
            data-testid="button-view-overview"
          >
            <LayoutGrid className="h-4 w-4 mr-2" />
            Overview
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setViewMode('detail')}
            className={viewMode === 'detail' ? 'bg-cyan-500/20 text-cyan-400' : 'text-white/70 hover:text-white'}
            data-testid="button-view-detail"
          >
            <List className="h-4 w-4 mr-2" />
            All FAQs
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 flex-wrap">
        <Select value={selectedClientFilter} onValueChange={setSelectedClientFilter}>
          <SelectTrigger className="w-[200px] bg-white/5 border-white/10 text-white" data-testid="select-client-filter">
            <SelectValue placeholder="Filter by client..." />
          </SelectTrigger>
          <SelectContent className="bg-[#1a1d24] border-white/10 max-h-[300px]">
            <SelectItem value="all" className="text-white">All Clients</SelectItem>
            {clients.map(client => (
              <SelectItem key={client.id} value={client.id} className="text-white">
                {client.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/40" />
          <Input
            placeholder="Search FAQs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-white/40"
            data-testid="input-search-faqs"
          />
        </div>
        
        {validSelectionCount > 0 && (
          <Button
            size="sm"
            onClick={handleBulkExport}
            className="bg-cyan-500 hover:bg-cyan-600 text-white"
            data-testid="button-export-faqs"
          >
            <Download className="h-4 w-4 mr-2" />
            Export {validSelectionCount} FAQs
          </Button>
        )}
      </div>

      {/* Knowledge Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <GlassCard>
          <GlassCardContent className="py-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <MessageSquare className="h-4 w-4 text-cyan-400" />
              <p className="text-2xl font-bold text-white">{totalFaqs}</p>
            </div>
            <p className="text-xs text-white/55">Total FAQs</p>
          </GlassCardContent>
        </GlassCard>
        <GlassCard>
          <GlassCardContent className="py-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Layers className="h-4 w-4 text-purple-400" />
              <p className="text-2xl font-bold text-white">{totalServices}</p>
            </div>
            <p className="text-xs text-white/55">Services Defined</p>
          </GlassCardContent>
        </GlassCard>
        <GlassCard>
          <GlassCardContent className="py-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Shield className="h-4 w-4 text-amber-400" />
              <p className="text-2xl font-bold text-white">{botsWithRules}</p>
            </div>
            <p className="text-xs text-white/55">Bots with Rules</p>
          </GlassCardContent>
        </GlassCard>
        <GlassCard>
          <GlassCardContent className="py-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Bot className="h-4 w-4 text-green-400" />
              <p className="text-2xl font-bold text-white">{botsWithSystemPrompt}</p>
            </div>
            <p className="text-xs text-white/55">Custom Prompts</p>
          </GlassCardContent>
        </GlassCard>
      </div>

      {viewMode === 'overview' ? (
        <>
          {/* Bot Knowledge Cards - Overview Mode */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {botsByFaqCount.map(bot => {
              const faqCount = bot.faqs?.length || 0;
              const serviceCount = bot.businessProfile?.services?.length || 0;
              const hasRules = !!(bot.rules?.specialInstructions?.length);
              
              return (
                <GlassCard 
                  key={bot.botId} 
                  hover 
                  className={`cursor-pointer ${selectedBotId === bot.botId ? 'ring-2 ring-cyan-500/50' : ''}`}
                  onClick={() => {
                    setSelectedBotId(bot.botId);
                    setViewMode('detail');
                  }}
                  data-testid={`card-knowledge-bot-${bot.botId}`}
                >
                  <GlassCardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="min-w-0 flex-1">
                        <h3 className="font-medium text-white truncate">{bot.name || bot.businessProfile?.businessName}</h3>
                        <p className="text-xs text-white/50 truncate">{getClientName(bot.clientId)}</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-white/40 flex-shrink-0" />
                    </div>
                    
                    {/* Knowledge Bar */}
                    <div className="h-2 rounded-full bg-white/10 overflow-hidden mb-3">
                      <div 
                        className="h-full bg-gradient-to-r from-cyan-500 to-purple-500" 
                        style={{ width: `${Math.min(faqCount * 10, 100)}%` }}
                      />
                    </div>
                    
                    <div className="flex items-center gap-3 text-xs">
                      <div className="flex items-center gap-1 text-white/60">
                        <MessageSquare className="h-3 w-3 text-cyan-400" />
                        <span className="text-cyan-400 font-medium">{faqCount}</span>
                        <span>FAQs</span>
                      </div>
                      <div className="flex items-center gap-1 text-white/60">
                        <Layers className="h-3 w-3 text-purple-400" />
                        <span className="text-purple-400 font-medium">{serviceCount}</span>
                        <span>Services</span>
                      </div>
                      {hasRules && (
                        <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-xs">Rules</Badge>
                      )}
                    </div>
                  </GlassCardContent>
                </GlassCard>
              );
            })}
          </div>
          
          {filteredBots.length === 0 && (
            <GlassCard>
              <GlassCardContent className="py-12 text-center">
                <Layers className="h-12 w-12 mx-auto mb-3 text-white/30" />
                <p className="text-white/55">No assistants found for this filter</p>
              </GlassCardContent>
            </GlassCard>
          )}
        </>
      ) : (
        <>
          {/* All FAQs Table - Detail Mode */}
          <GlassCard>
            <GlassCardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <GlassCardTitle className="text-base">All FAQs</GlassCardTitle>
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSelectAllFaqs}
                    className="text-white/70 hover:text-white text-xs"
                    data-testid="button-select-all-faqs"
                  >
                    {displayFaqs.every(f => selectedFaqIds.has(f.faqId)) && displayFaqs.length > 0 ? 'Deselect All' : 'Select All'}
                  </Button>
                  <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30">
                    {displayFaqs.length} FAQs
                  </Badge>
                </div>
              </div>
            </GlassCardHeader>
            <GlassCardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {displayFaqs.length === 0 ? (
                    <div className="text-center py-8">
                      <Search className="h-8 w-8 mx-auto mb-2 text-white/30" />
                      <p className="text-white/55">No FAQs found matching your search</p>
                    </div>
                  ) : (
                    displayFaqs.map((faq) => (
                      <div 
                        key={faq.faqId} 
                        className={`p-3 rounded-lg border transition-colors ${
                          selectedFaqIds.has(faq.faqId) 
                            ? 'bg-cyan-500/10 border-cyan-500/30' 
                            : 'bg-white/5 border-white/10 hover:bg-white/10'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            checked={selectedFaqIds.has(faq.faqId)}
                            onChange={(e) => {
                              const newSet = new Set(selectedFaqIds);
                              if (e.target.checked) {
                                newSet.add(faq.faqId);
                              } else {
                                newSet.delete(faq.faqId);
                              }
                              setSelectedFaqIds(newSet);
                            }}
                            className="mt-1 h-4 w-4 rounded border-white/30 bg-white/10 text-cyan-500"
                            data-testid={`checkbox-faq-${faq.faqId}`}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge className="bg-white/10 text-white/60 text-xs">{faq.botName}</Badge>
                            </div>
                            <p className="font-medium text-white text-sm">{faq.question}</p>
                            <p className="text-xs text-white/55 mt-1 line-clamp-2">{faq.answer}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </GlassCardContent>
          </GlassCard>

          {/* Selected Bot Detail Panel */}
          {selectedBot && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <GlassCard>
                <GlassCardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <GlassCardTitle className="text-base">{selectedBot.name || selectedBot.businessProfile?.businessName}</GlassCardTitle>
                      <GlassCardDescription>Services & Business Info</GlassCardDescription>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedBotId(null)}
                      className="text-white/50 hover:text-white"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </GlassCardHeader>
                <GlassCardContent>
                  <div className="flex flex-wrap gap-2">
                    {selectedBot.businessProfile?.services?.map((service, i) => (
                      <Badge key={i} className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30">{service}</Badge>
                    )) || <p className="text-white/40 text-sm">No services defined</p>}
                  </div>
                </GlassCardContent>
              </GlassCard>

              <GlassCard>
                <GlassCardHeader>
                  <GlassCardTitle className="text-base">Special Instructions</GlassCardTitle>
                </GlassCardHeader>
                <GlassCardContent>
                  <ScrollArea className="h-[150px]">
                    <ul className="space-y-2">
                      {selectedBot.rules?.specialInstructions?.map((instruction, i) => (
                        <li key={i} className="text-sm text-white/70 flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-green-400 flex-shrink-0 mt-0.5" />
                          {instruction}
                        </li>
                      )) || <p className="text-white/40 text-sm">No special instructions</p>}
                    </ul>
                  </ScrollArea>
                </GlassCardContent>
              </GlassCard>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// Bot Requests Section Panel - Contact form submissions from landing page
function BotRequestsSectionPanel() {
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  interface BotRequest {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    message: string;
    businessName: string | null;
    businessType: string | null;
    website: string | null;
    status: string;
    priority: string | null;
    adminNotes: string | null;
    source: string | null;
    createdAt: string;
    updatedAt: string;
    contactedAt: string | null;
    convertedAt: string | null;
  }
  
  const { data, isLoading, refetch } = useQuery<{ requests: BotRequest[]; counts: Record<string, number>; total: number }>({
    queryKey: ["/api/bot-requests", statusFilter],
    queryFn: async () => {
      const response = await fetch(`/api/bot-requests?status=${statusFilter}`, { credentials: "include" });
      if (!response.ok) throw new Error('Failed to fetch');
      return response.json();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<BotRequest> }) => {
      const response = await apiRequest("PATCH", `/api/bot-requests/${id}`, updates);
      return response.json();
    },
    onSuccess: () => {
      refetch();
      toast({ title: "Updated", description: "Request status has been updated." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update request.", variant: "destructive" });
    },
  });

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      new: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
      contacted: "bg-amber-500/20 text-amber-400 border-amber-500/30",
      qualified: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      converted: "bg-green-500/20 text-green-400 border-green-500/30",
      declined: "bg-red-500/20 text-red-400 border-red-500/30",
    };
    return <Badge className={styles[status] || styles.new}>{status.charAt(0).toUpperCase() + status.slice(1)}</Badge>;
  };

  const getPriorityBadge = (priority: string | null) => {
    if (!priority || priority === 'normal') return null;
    const styles: Record<string, string> = {
      high: "bg-orange-500/20 text-orange-400 border-orange-500/30",
      urgent: "bg-red-500/20 text-red-400 border-red-500/30",
      low: "bg-white/10 text-white/50 border-white/20",
    };
    return <Badge className={styles[priority] || ""}>{priority.toUpperCase()}</Badge>;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Mail className="h-6 w-6 text-cyan-400" />
            Bot Requests
          </h2>
          <p className="text-white/55 mt-1">Contact form submissions from the landing page</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36 bg-white/5 border-white/10 text-white" data-testid="select-status-filter">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent className="bg-[#1a1d24] border-white/10">
              <SelectItem value="all" className="text-white hover:bg-white/10">All Requests</SelectItem>
              <SelectItem value="new" className="text-white hover:bg-white/10">New</SelectItem>
              <SelectItem value="contacted" className="text-white hover:bg-white/10">Contacted</SelectItem>
              <SelectItem value="qualified" className="text-white hover:bg-white/10">Qualified</SelectItem>
              <SelectItem value="converted" className="text-white hover:bg-white/10">Converted</SelectItem>
              <SelectItem value="declined" className="text-white hover:bg-white/10">Declined</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => refetch()} 
            className="border-white/20 text-white hover:bg-white/10"
            data-testid="button-refresh-requests"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      {data?.counts && (
        <div className="grid grid-cols-5 gap-3">
          {[
            { key: 'new', label: 'New', color: 'cyan' },
            { key: 'contacted', label: 'Contacted', color: 'amber' },
            { key: 'qualified', label: 'Qualified', color: 'blue' },
            { key: 'converted', label: 'Converted', color: 'green' },
            { key: 'declined', label: 'Declined', color: 'red' },
          ].map(({ key, label, color }) => (
            <GlassCard key={key} className="cursor-pointer hover:border-white/20" onClick={() => setStatusFilter(key)}>
              <GlassCardContent className="p-4 text-center">
                <div className={`text-2xl font-bold text-${color}-400`}>{data.counts[key] || 0}</div>
                <div className="text-sm text-white/55">{label}</div>
              </GlassCardContent>
            </GlassCard>
          ))}
        </div>
      )}

      {/* Requests List */}
      <GlassCard>
        <GlassCardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-white/55">Loading requests...</div>
          ) : !data?.requests?.length ? (
            <div className="p-8 text-center">
              <Mail className="h-12 w-12 mx-auto text-white/20 mb-3" />
              <p className="text-white/55">No requests yet</p>
              <p className="text-white/40 text-sm mt-1">When visitors submit the contact form, their requests will appear here.</p>
            </div>
          ) : (
            <div className="divide-y divide-white/10">
              {data.requests.map((request) => (
                <div key={request.id} className="p-4 hover:bg-white/5 transition-colors" data-testid={`request-${request.id}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-white">{request.name}</span>
                        {getStatusBadge(request.status)}
                        {getPriorityBadge(request.priority)}
                      </div>
                      <div className="flex items-center gap-3 text-sm text-white/55 mb-2">
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {request.email}
                        </span>
                        {request.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {request.phone}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-white/70 line-clamp-2">{request.message}</p>
                      <div className="flex items-center gap-2 mt-2 text-xs text-white/40">
                        <span>Submitted {formatDate(request.createdAt)}</span>
                        {request.contactedAt && <span>• Contacted {formatDate(request.contactedAt)}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Select
                        value={request.status}
                        onValueChange={(newStatus) => updateMutation.mutate({ id: request.id, updates: { status: newStatus } })}
                      >
                        <SelectTrigger className="w-32 bg-white/5 border-white/10 text-white text-sm" data-testid={`select-request-status-${request.id}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[#1a1d24] border-white/10">
                          <SelectItem value="new" className="text-white hover:bg-white/10">New</SelectItem>
                          <SelectItem value="contacted" className="text-white hover:bg-white/10">Contacted</SelectItem>
                          <SelectItem value="qualified" className="text-white hover:bg-white/10">Qualified</SelectItem>
                          <SelectItem value="converted" className="text-white hover:bg-white/10">Converted</SelectItem>
                          <SelectItem value="declined" className="text-white hover:bg-white/10">Declined</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </GlassCardContent>
      </GlassCard>
    </div>
  );
}

// Integrations Section Panel - API keys and external connections
function IntegrationsSectionPanel() {
  const { toast } = useToast();
  const [testingIntegration, setTestingIntegration] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, { success: boolean; latencyMs: number; error?: string }>>({});
  
  interface IntegrationStatus {
    openai: { configured: boolean; status: string; baseUrl: string | null };
    stripe: { configured: boolean; status: string };
    database: { configured: boolean; status: string; latencyMs?: number };
    email: { configured: boolean; status: string };
    sms: { configured: boolean; status: string };
    timestamp: string;
  }
  
  const { data: status, isLoading, refetch } = useQuery<IntegrationStatus>({
    queryKey: ["/api/super-admin/integrations/status"],
    queryFn: async () => {
      const response = await fetch("/api/super-admin/integrations/status", { credentials: "include" });
      if (!response.ok) throw new Error('Failed to fetch');
      return response.json();
    },
  });

  const handleTestIntegration = async (integrationId: string) => {
    setTestingIntegration(integrationId);
    try {
      const response = await fetch(`/api/super-admin/integrations/test/${integrationId}`, {
        method: 'POST',
        credentials: 'include',
      });
      const result = await response.json();
      setTestResults(prev => ({ ...prev, [integrationId]: result }));
      
      if (result.success) {
        toast({
          title: 'Connection Successful',
          description: `${integrationId.toUpperCase()} responded in ${result.latencyMs}ms`,
        });
      } else {
        toast({
          title: 'Connection Failed',
          description: result.error || 'Unable to connect',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Test Failed',
        description: 'Unable to test integration',
        variant: 'destructive',
      });
    } finally {
      setTestingIntegration(null);
    }
  };

  const getStatusBadge = (integrationStatus: string | undefined) => {
    switch (integrationStatus) {
      case 'connected':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Connected</Badge>;
      case 'error':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Error</Badge>;
      default:
        return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">Not Configured</Badge>;
    }
  };

  const integrations = [
    {
      id: 'openai',
      name: 'OpenAI',
      description: 'GPT-4 powered AI conversations',
      icon: Zap,
      status: status?.openai?.status,
      configured: status?.openai?.configured,
      colorClass: 'bg-cyan-500/20 text-cyan-400',
      details: status?.openai?.baseUrl ? `Using ${new URL(status.openai.baseUrl).hostname}` : null,
      canTest: true,
    },
    {
      id: 'stripe',
      name: 'Stripe',
      description: 'Payment processing and billing',
      icon: CreditCard,
      status: status?.stripe?.status,
      configured: status?.stripe?.configured,
      colorClass: 'bg-purple-500/20 text-purple-400',
      details: null,
      canTest: true,
    },
    {
      id: 'database',
      name: 'PostgreSQL',
      description: 'Data persistence and storage',
      icon: Layers,
      status: status?.database?.status,
      configured: status?.database?.configured,
      colorClass: 'bg-green-500/20 text-green-400',
      details: status?.database?.latencyMs ? `Latency: ${status.database.latencyMs}ms` : null,
      canTest: true,
    },
    {
      id: 'email',
      name: 'Email (Coming Soon)',
      description: 'SendGrid / Mailgun notifications',
      icon: Mail,
      status: status?.email?.status,
      configured: status?.email?.configured,
      colorClass: 'bg-blue-500/20 text-blue-400',
      details: null,
      canTest: false,
    },
    {
      id: 'sms',
      name: 'SMS (Coming Soon)',
      description: 'Twilio text messaging',
      icon: MessageSquare,
      status: status?.sms?.status,
      configured: status?.sms?.configured,
      colorClass: 'bg-orange-500/20 text-orange-400',
      details: null,
      canTest: false,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Integrations Hub</h2>
          <p className="text-sm text-white/55">Manage API connections, credentials, and external services</p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => refetch()}
          className="border-white/20 text-white/70"
          data-testid="button-refresh-integrations"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh Status
        </Button>
      </div>

      {/* Core Integrations */}
      <div>
        <h3 className="text-sm font-medium text-white/70 mb-3">Core Services</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {integrations.slice(0, 3).map(integration => (
            <GlassCard key={integration.id} data-testid={`card-integration-${integration.id}`}>
              <GlassCardContent className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className={`h-10 w-10 rounded-lg ${integration.colorClass.split(' ')[0]} flex items-center justify-center`}>
                    <integration.icon className={`h-5 w-5 ${integration.colorClass.split(' ')[1]}`} />
                  </div>
                  {getStatusBadge(integration.status)}
                </div>
                <h3 className="font-medium text-white">{integration.name}</h3>
                <p className="text-sm text-white/55 mt-1">{integration.description}</p>
                {integration.details && (
                  <p className="text-xs text-white/40 mt-2">{integration.details}</p>
                )}
                {testResults[integration.id] && (
                  <div className={`mt-3 p-2 rounded text-xs ${testResults[integration.id].success ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                    {testResults[integration.id].success 
                      ? `Connected (${testResults[integration.id].latencyMs}ms)` 
                      : `Failed: ${testResults[integration.id].error}`}
                  </div>
                )}
                {integration.canTest && integration.configured && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleTestIntegration(integration.id)}
                    disabled={testingIntegration === integration.id}
                    className="mt-3 w-full text-white/70 hover:text-white border border-white/10"
                    data-testid={`button-test-${integration.id}`}
                  >
                    {testingIntegration === integration.id ? (
                      <><RefreshCw className="h-3 w-3 mr-2 animate-spin" /> Testing...</>
                    ) : (
                      <><Activity className="h-3 w-3 mr-2" /> Test Connection</>
                    )}
                  </Button>
                )}
              </GlassCardContent>
            </GlassCard>
          ))}
        </div>
      </div>

      {/* Future Integrations */}
      <div>
        <h3 className="text-sm font-medium text-white/70 mb-3">Future Integrations</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {integrations.slice(3).map(integration => (
            <GlassCard key={integration.id} className="opacity-60" data-testid={`card-integration-${integration.id}`}>
              <GlassCardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className={`h-10 w-10 rounded-lg ${integration.colorClass.split(' ')[0]} flex items-center justify-center`}>
                    <integration.icon className={`h-5 w-5 ${integration.colorClass.split(' ')[1]}`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-white">{integration.name}</h3>
                    <p className="text-sm text-white/55">{integration.description}</p>
                  </div>
                  <Badge className="bg-white/10 text-white/50 border-white/20">Coming Soon</Badge>
                </div>
              </GlassCardContent>
            </GlassCard>
          ))}
        </div>
      </div>

      {/* API Configuration Details */}
      <GlassCard>
        <GlassCardHeader>
          <div className="flex items-center justify-between">
            <div>
              <GlassCardTitle>Environment Variables</GlassCardTitle>
              <GlassCardDescription>Required secrets and configuration</GlassCardDescription>
            </div>
            <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30">
              {[status?.openai?.configured, status?.stripe?.configured, status?.database?.configured].filter(Boolean).length}/3 Configured
            </Badge>
          </div>
        </GlassCardHeader>
        <GlassCardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10">
              <div className="flex items-center gap-3">
                <Zap className="h-4 w-4 text-cyan-400" />
                <div>
                  <span className="text-sm text-white block">OPENAI_API_KEY</span>
                  <span className="text-xs text-white/40">Powers AI conversations</span>
                </div>
              </div>
              <Badge className={status?.openai?.configured ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}>
                {status?.openai?.configured ? 'Configured' : 'Missing'}
              </Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10">
              <div className="flex items-center gap-3">
                <CreditCard className="h-4 w-4 text-purple-400" />
                <div>
                  <span className="text-sm text-white block">STRIPE_SECRET_KEY</span>
                  <span className="text-xs text-white/40">Payment processing</span>
                </div>
              </div>
              <Badge className={status?.stripe?.configured ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}>
                {status?.stripe?.configured ? 'Configured' : 'Missing'}
              </Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10">
              <div className="flex items-center gap-3">
                <Layers className="h-4 w-4 text-green-400" />
                <div>
                  <span className="text-sm text-white block">DATABASE_URL</span>
                  <span className="text-xs text-white/40">PostgreSQL connection</span>
                </div>
              </div>
              <Badge className={status?.database?.configured ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}>
                {status?.database?.configured ? 'Connected' : 'Not Connected'}
              </Badge>
            </div>
          </div>
        </GlassCardContent>
      </GlassCard>

      {/* Active Webhooks */}
      <GlassCard>
        <GlassCardHeader>
          <GlassCardTitle>Active Webhooks & Endpoints</GlassCardTitle>
          <GlassCardDescription>External service callbacks and embed endpoints</GlassCardDescription>
        </GlassCardHeader>
        <GlassCardContent>
          <div className="space-y-3">
            <div className="p-3 bg-white/5 rounded-lg border border-white/10">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-purple-400" />
                  <span className="text-sm font-medium text-white">Stripe Webhook</span>
                </div>
                <Badge className="bg-green-500/20 text-green-400">Active</Badge>
              </div>
              <div className="flex items-center gap-2">
                <code className="text-xs text-white/60 bg-white/5 px-2 py-1 rounded flex-1">/api/stripe/webhook</code>
                <Button variant="ghost" size="sm" className="h-7 px-2 text-white/50" onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/api/stripe/webhook`);
                  toast({ title: 'Copied', description: 'Webhook URL copied to clipboard' });
                }}>
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>
            <div className="p-3 bg-white/5 rounded-lg border border-white/10">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Code className="h-4 w-4 text-cyan-400" />
                  <span className="text-sm font-medium text-white">Widget Embed Script</span>
                </div>
                <Badge className="bg-green-500/20 text-green-400">Active</Badge>
              </div>
              <div className="flex items-center gap-2">
                <code className="text-xs text-white/60 bg-white/5 px-2 py-1 rounded flex-1">/widget/embed.js</code>
                <Button variant="ghost" size="sm" className="h-7 px-2 text-white/50" onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/widget/embed.js`);
                  toast({ title: 'Copied', description: 'Embed URL copied to clipboard' });
                }}>
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>
            <div className="p-3 bg-white/5 rounded-lg border border-white/10">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-green-400" />
                  <span className="text-sm font-medium text-white">Chat API Endpoint</span>
                </div>
                <Badge className="bg-green-500/20 text-green-400">Active</Badge>
              </div>
              <div className="flex items-center gap-2">
                <code className="text-xs text-white/60 bg-white/5 px-2 py-1 rounded flex-1">/api/chat/:clientId/:botId</code>
                <Button variant="ghost" size="sm" className="h-7 px-2 text-white/50" onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/api/chat/{clientId}/{botId}`);
                  toast({ title: 'Copied', description: 'Chat API URL copied to clipboard' });
                }}>
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        </GlassCardContent>
      </GlassCard>

      {/* Last Updated */}
      {status?.timestamp && (
        <p className="text-xs text-white/30 text-center">
          Last updated: {new Date(status.timestamp).toLocaleString()}
        </p>
      )}
    </div>
  );
}

// Billing & Plans Section Panel
interface Workspace {
  id: number | string;
  name: string;
  slug: string;
  status: string;
  plan?: string;
  billingEmail?: string;
  createdAt?: string;
  botsCount?: number;
  totalConversations?: number;
  lastActive?: string | null;
}

interface PlanDefinition {
  id: string;
  name: string;
  price: number;
  interval: 'monthly' | 'yearly';
  features: string[];
  limits: {
    conversations: number;
    leads: number;
    bots: number;
  };
  isDefault?: boolean;
}

const DEFAULT_PLANS: PlanDefinition[] = [
  {
    id: 'starter',
    name: 'Starter',
    price: 99,
    interval: 'monthly',
    features: ['1 AI Assistant', 'Up to 500 conversations/mo', 'Email support'],
    limits: { conversations: 500, leads: 100, bots: 1 },
    isDefault: true,
  },
  {
    id: 'professional',
    name: 'Professional',
    price: 249,
    interval: 'monthly',
    features: ['3 AI Assistants', 'Up to 2,000 conversations/mo', 'Priority support', 'Custom branding'],
    limits: { conversations: 2000, leads: 500, bots: 3 },
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 599,
    interval: 'monthly',
    features: ['Unlimited AI Assistants', 'Unlimited conversations', 'Dedicated support', 'API access', 'White-label'],
    limits: { conversations: -1, leads: -1, bots: -1 },
  },
];

function BillingSectionPanel({ workspaces }: { workspaces: Workspace[] }) {
  const { toast } = useToast();
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [showAssignPlanModal, setShowAssignPlanModal] = useState(false);
  const [assignToWorkspace, setAssignToWorkspace] = useState<string | null>(null);
  const [isUpdatingPlan, setIsUpdatingPlan] = useState(false);

  // Usage data - would be from real API in production
  const getUsageForWorkspace = (workspaceId: number | string) => {
    // Use consistent seed based on workspace ID for demo purposes
    const numericId = typeof workspaceId === 'string' ? parseInt(workspaceId, 10) || 0 : workspaceId;
    const seed = numericId * 123;
    return {
      conversations: (seed % 800) + 50,
      leads: (seed % 150) + 10,
      bots: (seed % 3) + 1,
    };
  };

  const getPlanForWorkspace = (workspace: Workspace): PlanDefinition => {
    return DEFAULT_PLANS.find(p => p.id === workspace.plan) || DEFAULT_PLANS[0];
  };

  const handleAssignPlan = (workspaceSlug: string) => {
    setAssignToWorkspace(workspaceSlug);
    setShowAssignPlanModal(true);
  };

  const confirmAssignPlan = async () => {
    if (!assignToWorkspace || !selectedPlanId) return;
    
    setIsUpdatingPlan(true);
    try {
      const response = await apiRequest('PATCH', `/api/super-admin/workspaces/${assignToWorkspace}/plan`, {
        plan: selectedPlanId,
      });
      
      if (response.ok) {
        queryClient.invalidateQueries({ queryKey: ['/api/super-admin/workspaces'] });
        toast({
          title: 'Plan Updated',
          description: `Successfully assigned ${DEFAULT_PLANS.find(p => p.id === selectedPlanId)?.name} plan.`,
        });
        setShowAssignPlanModal(false);
        setAssignToWorkspace(null);
        setSelectedPlanId(null);
      } else {
        const error = await response.json();
        toast({
          title: 'Error',
          description: error.error || 'Failed to update plan',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update plan',
        variant: 'destructive',
      });
    } finally {
      setIsUpdatingPlan(false);
    }
  };

  // Calculate totals
  const totalMRR = workspaces.reduce((sum, w) => {
    const plan = getPlanForWorkspace(w);
    return sum + plan.price;
  }, 0);

  const activeClients = workspaces.filter(w => w.status === 'active').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Billing & Plans</h2>
          <p className="text-sm text-white/55">Manage subscription plans and client billing</p>
        </div>
      </div>

      {/* Revenue Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <GlassCard data-testid="card-mrr">
          <GlassCardContent className="pt-5 pb-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-green-400" />
              </div>
            </div>
            <p className="text-2xl font-bold text-white">${totalMRR.toLocaleString()}</p>
            <p className="text-sm text-white/55">Monthly Recurring Revenue</p>
          </GlassCardContent>
        </GlassCard>
        <GlassCard data-testid="card-active-subscriptions">
          <GlassCardContent className="pt-5 pb-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                <Users2 className="h-5 w-5 text-cyan-400" />
              </div>
            </div>
            <p className="text-2xl font-bold text-white">{activeClients}</p>
            <p className="text-sm text-white/55">Active Subscriptions</p>
          </GlassCardContent>
        </GlassCard>
        <GlassCard data-testid="card-avg-revenue">
          <GlassCardContent className="pt-5 pb-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-purple-400" />
              </div>
            </div>
            <p className="text-2xl font-bold text-white">${activeClients > 0 ? Math.round(totalMRR / activeClients) : 0}</p>
            <p className="text-sm text-white/55">Avg. Revenue per Client</p>
          </GlassCardContent>
        </GlassCard>
        <GlassCard data-testid="card-plan-distribution">
          <GlassCardContent className="pt-5 pb-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                <Layers className="h-5 w-5 text-amber-400" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              {DEFAULT_PLANS.map(plan => {
                const count = workspaces.filter(w => (w.plan || 'starter') === plan.id).length;
                return (
                  <Badge key={plan.id} className="bg-white/10 text-white/70 text-xs">
                    {plan.name}: {count}
                  </Badge>
                );
              })}
            </div>
            <p className="text-sm text-white/55 mt-2">Plan Distribution</p>
          </GlassCardContent>
        </GlassCard>
      </div>

      {/* Available Plans */}
      <div>
        <h3 className="text-sm font-medium text-white/70 mb-3">Available Plans</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {DEFAULT_PLANS.map(plan => (
            <GlassCard key={plan.id} className={plan.id === 'professional' ? 'ring-1 ring-cyan-500/50' : ''} data-testid={`card-plan-${plan.id}`}>
              <GlassCardContent className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-white">{plan.name}</h3>
                  {plan.id === 'professional' && (
                    <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30">Popular</Badge>
                  )}
                </div>
                <div className="mb-4">
                  <span className="text-3xl font-bold text-white">${plan.price}</span>
                  <span className="text-white/55">/mo</span>
                </div>
                <ul className="space-y-2 mb-4">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-white/70">
                      <CheckCircle className="h-4 w-4 text-green-400 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <div className="pt-4 border-t border-white/10">
                  <p className="text-xs text-white/40 mb-1">Limits</p>
                  <div className="flex flex-wrap gap-2">
                    <Badge className="bg-white/5 text-white/60 text-xs">
                      {plan.limits.conversations === -1 ? 'Unlimited' : plan.limits.conversations} convos
                    </Badge>
                    <Badge className="bg-white/5 text-white/60 text-xs">
                      {plan.limits.leads === -1 ? 'Unlimited' : plan.limits.leads} leads
                    </Badge>
                    <Badge className="bg-white/5 text-white/60 text-xs">
                      {plan.limits.bots === -1 ? 'Unlimited' : plan.limits.bots} bots
                    </Badge>
                  </div>
                </div>
              </GlassCardContent>
            </GlassCard>
          ))}
        </div>
      </div>

      {/* Client Subscriptions */}
      <GlassCard>
        <GlassCardHeader>
          <div className="flex items-center justify-between">
            <div>
              <GlassCardTitle>Client Subscriptions</GlassCardTitle>
              <GlassCardDescription>Manage plans and view usage for each client</GlassCardDescription>
            </div>
          </div>
        </GlassCardHeader>
        <GlassCardContent>
          {workspaces.length === 0 ? (
            <div className="text-center py-8">
              <Users2 className="h-8 w-8 mx-auto mb-2 text-white/30" />
              <p className="text-white/55">No clients yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {workspaces.slice(0, 10).map(workspace => {
                const plan = getPlanForWorkspace(workspace);
                const usage = getUsageForWorkspace(workspace.id);
                const conversationPct = plan.limits.conversations > 0 
                  ? Math.min(100, (usage.conversations / plan.limits.conversations) * 100) 
                  : 0;
                const leadPct = plan.limits.leads > 0 
                  ? Math.min(100, (usage.leads / plan.limits.leads) * 100) 
                  : 0;

                return (
                  <div 
                    key={workspace.id} 
                    className="p-4 bg-white/5 rounded-lg border border-white/10"
                    data-testid={`row-subscription-${workspace.id}`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                          <Building2 className="h-4 w-4 text-purple-400" />
                        </div>
                        <div>
                          <p className="font-medium text-white">{workspace.name}</p>
                          <p className="text-xs text-white/40">{workspace.billingEmail || 'No billing email'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={
                          workspace.status === 'active' 
                            ? 'bg-green-500/20 text-green-400 border-green-500/30' 
                            : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                        }>
                          {workspace.status}
                        </Badge>
                        <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30">
                          {plan.name} - ${plan.price}/mo
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleAssignPlan(workspace.slug)}
                          className="text-white/60 hover:text-white"
                          data-testid={`button-change-plan-${workspace.id}`}
                        >
                          <Edit2 className="h-3 w-3 mr-1" />
                          Change Plan
                        </Button>
                      </div>
                    </div>
                    
                    {/* Usage Bars */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-white/50">Conversations</span>
                          <span className="text-xs text-white/70">
                            {usage.conversations} / {plan.limits.conversations === -1 ? '∞' : plan.limits.conversations}
                          </span>
                        </div>
                        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${conversationPct > 80 ? 'bg-amber-500' : 'bg-cyan-500'}`}
                            style={{ width: `${conversationPct}%` }}
                          />
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-white/50">Leads</span>
                          <span className="text-xs text-white/70">
                            {usage.leads} / {plan.limits.leads === -1 ? '∞' : plan.limits.leads}
                          </span>
                        </div>
                        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${leadPct > 80 ? 'bg-amber-500' : 'bg-green-500'}`}
                            style={{ width: `${leadPct}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </GlassCardContent>
      </GlassCard>

      {/* Assign Plan Modal */}
      <Dialog open={showAssignPlanModal} onOpenChange={setShowAssignPlanModal}>
        <DialogContent className="bg-[#1a1d24] border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white">Change Plan</DialogTitle>
            <DialogDescription className="text-white/55">
              Select a new plan for this client.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            {DEFAULT_PLANS.map(plan => (
              <div
                key={plan.id}
                onClick={() => setSelectedPlanId(plan.id)}
                className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                  selectedPlanId === plan.id 
                    ? 'bg-cyan-500/10 border-cyan-500/50' 
                    : 'bg-white/5 border-white/10 hover:border-white/20'
                }`}
                data-testid={`select-plan-${plan.id}`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-white">{plan.name}</p>
                    <p className="text-sm text-white/55">${plan.price}/mo</p>
                  </div>
                  {selectedPlanId === plan.id && (
                    <CheckCircle className="h-5 w-5 text-cyan-400" />
                  )}
                </div>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowAssignPlanModal(false)} className="text-white/70" disabled={isUpdatingPlan}>
              Cancel
            </Button>
            <Button 
              onClick={confirmAssignPlan}
              disabled={!selectedPlanId || isUpdatingPlan}
              className="bg-cyan-500 hover:bg-cyan-600 text-white"
              data-testid="button-confirm-plan-change"
            >
              {isUpdatingPlan ? (
                <><RefreshCw className="h-4 w-4 mr-2 animate-spin" /> Updating...</>
              ) : (
                'Confirm Change'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Role definitions for the enhanced Users & Roles section
const ROLE_DEFINITIONS = [
  {
    id: 'super_admin',
    name: 'Super Admin',
    description: 'Full platform access. Can manage all clients, users, billing, and system settings.',
    permissions: ['All permissions', 'Manage billing', 'Create super admins', 'System configuration'],
    color: 'purple',
    icon: Crown,
  },
  {
    id: 'agency_user',
    name: 'Agency User',
    description: 'Agency team member. Can manage clients and assistants but cannot access billing or system settings.',
    permissions: ['Manage clients', 'Create assistants', 'View analytics', 'Template management'],
    color: 'cyan',
    icon: Users,
  },
  {
    id: 'client_owner',
    name: 'Client Owner',
    description: 'Business owner. Has full access to their own dashboard, conversations, leads, and settings.',
    permissions: ['View dashboard', 'Manage leads', 'View conversations', 'Update business info'],
    color: 'green',
    icon: Building2,
  },
  {
    id: 'client_user',
    name: 'Client User',
    description: 'Team member at a client business. Read-only access to dashboard and conversations.',
    permissions: ['View dashboard', 'View conversations', 'View leads'],
    color: 'blue',
    icon: User,
  },
];

interface UsersSectionPanelProps {
  users: Array<{
    id: number;
    username: string;
    role: string;
    clientId?: string | null;
    email?: string | null;
    lastLogin?: string | null;
    createdAt?: string | null;
  }>;
  isLoading: boolean;
  workspaces: Workspace[];
  onCreateUser: (data: { username: string; password: string; role: string; clientId?: string; email?: string }) => void;
  onUpdateRole: (userId: string, newRole: string) => void;
  onDeleteUser: (userId: string) => void;
  isCreating: boolean;
}

function UsersSectionPanel({ 
  users, 
  isLoading, 
  workspaces,
  onCreateUser,
  onUpdateRole,
  onDeleteUser,
  isCreating
}: UsersSectionPanelProps) {
  const { toast } = useToast();
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showRolesInfo, setShowRolesInfo] = useState(false);
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [inviteForm, setInviteForm] = useState({
    email: '',
    username: '',
    password: '',
    role: 'client_owner',
    clientId: '',
  });

  const filteredUsers = users?.filter(user => {
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesSearch = !searchQuery || 
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesRole && matchesSearch;
  }) || [];

  const getRoleInfo = (roleId: string) => {
    return ROLE_DEFINITIONS.find(r => r.id === roleId) || ROLE_DEFINITIONS[3];
  };

  const handleInvite = () => {
    if (!inviteForm.username || !inviteForm.password) {
      toast({ title: 'Error', description: 'Username and password are required', variant: 'destructive' });
      return;
    }
    onCreateUser({
      username: inviteForm.username,
      password: inviteForm.password,
      role: inviteForm.role,
      clientId: inviteForm.clientId || undefined,
      email: inviteForm.email || undefined,
    });
    setShowInviteModal(false);
    setInviteForm({ email: '', username: '', password: '', role: 'client_owner', clientId: '' });
  };

  const usersByRole = {
    super_admin: users?.filter(u => u.role === 'super_admin').length || 0,
    agency_user: users?.filter(u => u.role === 'agency_user').length || 0,
    client_owner: users?.filter(u => u.role === 'client_owner' || u.role === 'client_admin').length || 0,
    client_user: users?.filter(u => u.role === 'client_user').length || 0,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-semibold text-white">Users & Roles</h2>
          <p className="text-sm text-white/55">Manage platform users and their permissions</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowRolesInfo(true)}
            className="text-white/70 hover:text-white hover:bg-white/10"
            data-testid="button-view-roles"
          >
            <HelpCircle className="h-4 w-4 mr-2" />
            Role Guide
          </Button>
          <Button
            onClick={() => setShowInviteModal(true)}
            className="bg-cyan-500 hover:bg-cyan-600 text-white"
            data-testid="button-invite-user"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Invite User
          </Button>
        </div>
      </div>

      {/* Role Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {ROLE_DEFINITIONS.map(role => {
          const count = role.id === 'client_owner' 
            ? usersByRole.client_owner 
            : usersByRole[role.id as keyof typeof usersByRole] || 0;
          const Icon = role.icon;
          const colorClasses: Record<string, string> = {
            purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
            cyan: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
            green: 'bg-green-500/10 text-green-400 border-green-500/20',
            blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
          };
          return (
            <GlassCard 
              key={role.id} 
              className={`cursor-pointer transition-all ${roleFilter === role.id ? 'ring-1 ring-cyan-500/50' : ''}`}
              onClick={() => setRoleFilter(roleFilter === role.id ? 'all' : role.id)}
            >
              <GlassCardContent className="py-4">
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-lg flex items-center justify-center border ${colorClasses[role.color]}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{count}</p>
                    <p className="text-xs text-white/55">{role.name}s</p>
                  </div>
                </div>
              </GlassCardContent>
            </GlassCard>
          );
        })}
      </div>

      {/* Search and Filter */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
          <input
            type="text"
            placeholder="Search by username or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/40 focus:outline-none focus:border-cyan-400/50"
            data-testid="input-search-users"
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-[180px] bg-white/5 border-white/10 text-white" data-testid="select-role-filter">
            <SelectValue placeholder="Filter by role" />
          </SelectTrigger>
          <SelectContent className="bg-[#1a1d24] border-white/10">
            <SelectItem value="all" className="text-white">All Roles</SelectItem>
            {ROLE_DEFINITIONS.map(role => (
              <SelectItem key={role.id} value={role.id} className="text-white">
                {role.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {roleFilter !== 'all' && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setRoleFilter('all')}
            className="text-white/55 hover:text-white"
          >
            <X className="h-4 w-4 mr-1" />
            Clear Filter
          </Button>
        )}
      </div>

      {/* Users List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin" />
        </div>
      ) : filteredUsers.length === 0 ? (
        <GlassCard>
          <GlassCardContent className="py-12 text-center">
            <Users className="h-12 w-12 mx-auto mb-3 text-white/30" />
            <p className="text-white/55">
              {searchQuery || roleFilter !== 'all' ? 'No users match your filters' : 'No users found'}
            </p>
          </GlassCardContent>
        </GlassCard>
      ) : (
        <div className="space-y-3">
          {filteredUsers.map(user => {
            const roleInfo = getRoleInfo(user.role === 'client_admin' ? 'client_owner' : user.role);
            const Icon = roleInfo.icon;
            const colorClasses: Record<string, { bg: string; text: string; badge: string }> = {
              purple: { bg: 'bg-purple-500/10', text: 'text-purple-400', badge: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
              cyan: { bg: 'bg-cyan-500/10', text: 'text-cyan-400', badge: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' },
              green: { bg: 'bg-green-500/10', text: 'text-green-400', badge: 'bg-green-500/20 text-green-400 border-green-500/30' },
              blue: { bg: 'bg-blue-500/10', text: 'text-blue-400', badge: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
            };
            const colors = colorClasses[roleInfo.color];

            return (
              <GlassCard key={user.id} data-testid={`card-user-${user.id}`}>
                <GlassCardContent className="py-4">
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-3">
                      <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${colors.bg}`}>
                        <Icon className={`h-6 w-6 ${colors.text}`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium text-white">{user.username}</p>
                          <Badge className={colors.badge}>
                            {roleInfo.name}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-white/50 mt-1">
                          {user.email && (
                            <span className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {user.email}
                            </span>
                          )}
                          {user.clientId && (
                            <span className="flex items-center gap-1">
                              <Building2 className="h-3 w-3" />
                              {user.clientId}
                            </span>
                          )}
                          {user.lastLogin && (
                            <span>Last login: {new Date(user.lastLogin).toLocaleDateString()}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-white/55 hover:text-white hover:bg-white/10" data-testid={`button-user-actions-${user.id}`}>
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-[#1a1d24] border-white/10 min-w-[180px]">
                        <DropdownMenuLabel className="text-white/55">Change Role</DropdownMenuLabel>
                        {ROLE_DEFINITIONS.filter(r => r.id !== user.role && r.id !== 'client_owner' || user.role === 'client_admin').map(role => (
                          <DropdownMenuItem
                            key={role.id}
                            className="text-white hover:bg-white/10"
                            onClick={() => onUpdateRole(String(user.id), role.id)}
                            data-testid={`button-set-role-${role.id}-${user.id}`}
                          >
                            <role.icon className="h-4 w-4 mr-2 text-white/50" />
                            Set as {role.name}
                          </DropdownMenuItem>
                        ))}
                        <DropdownMenuSeparator className="bg-white/10" />
                        <DropdownMenuItem
                          className="text-red-400 hover:bg-red-500/10"
                          onClick={() => {
                            if (confirm(`Delete user "${user.username}"? This cannot be undone.`)) {
                              onDeleteUser(String(user.id));
                            }
                          }}
                          data-testid={`button-delete-user-${user.id}`}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete User
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </GlassCardContent>
              </GlassCard>
            );
          })}
        </div>
      )}

      {/* Invite User Modal */}
      <Dialog open={showInviteModal} onOpenChange={setShowInviteModal}>
        <DialogContent className="bg-[#1a1d24] border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-cyan-400" />
              Invite User
            </DialogTitle>
            <DialogDescription className="text-white/55">
              Create a new user account or send an invitation.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm text-white/85">Username *</label>
                <input
                  type="text"
                  value={inviteForm.username}
                  onChange={(e) => setInviteForm(f => ({ ...f, username: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-cyan-400/50"
                  placeholder="Enter username"
                  data-testid="input-invite-username"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-white/85">Email (optional)</label>
                <input
                  type="email"
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm(f => ({ ...f, email: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-cyan-400/50"
                  placeholder="user@example.com"
                  data-testid="input-invite-email"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm text-white/85">Temporary Password *</label>
              <input
                type="password"
                value={inviteForm.password}
                onChange={(e) => setInviteForm(f => ({ ...f, password: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-cyan-400/50"
                placeholder="Set a temporary password"
                data-testid="input-invite-password"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-white/85">Role</label>
              <Select
                value={inviteForm.role}
                onValueChange={(value) => setInviteForm(f => ({ ...f, role: value }))}
              >
                <SelectTrigger className="w-full bg-white/5 border-white/10 text-white" data-testid="select-invite-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1d24] border-white/10">
                  {ROLE_DEFINITIONS.map(role => (
                    <SelectItem key={role.id} value={role.id} className="text-white">
                      <div className="flex items-center gap-2">
                        <role.icon className="h-4 w-4 text-white/50" />
                        {role.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-white/40 mt-1">
                {getRoleInfo(inviteForm.role).description}
              </p>
            </div>
            {(inviteForm.role === 'client_owner' || inviteForm.role === 'client_user') && (
              <div className="space-y-2">
                <label className="text-sm text-white/85">Assign to Client</label>
                <Select
                  value={inviteForm.clientId}
                  onValueChange={(value) => setInviteForm(f => ({ ...f, clientId: value }))}
                >
                  <SelectTrigger className="w-full bg-white/5 border-white/10 text-white" data-testid="select-invite-client">
                    <SelectValue placeholder="Select a client..." />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1d24] border-white/10">
                    {workspaces.map(ws => (
                      <SelectItem key={ws.slug} value={ws.slug} className="text-white">
                        {ws.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowInviteModal(false)} className="text-white/70">
              Cancel
            </Button>
            <Button
              onClick={handleInvite}
              disabled={!inviteForm.username || !inviteForm.password || isCreating}
              className="bg-cyan-500 hover:bg-cyan-600 text-white"
              data-testid="button-confirm-invite"
            >
              {isCreating ? (
                <><RefreshCw className="h-4 w-4 mr-2 animate-spin" /> Creating...</>
              ) : (
                <>Create User</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Role Guide Modal */}
      <Dialog open={showRolesInfo} onOpenChange={setShowRolesInfo}>
        <DialogContent className="bg-[#1a1d24] border-white/10 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Shield className="h-5 w-5 text-cyan-400" />
              Role Hierarchy & Permissions
            </DialogTitle>
            <DialogDescription className="text-white/55">
              Understanding the different user roles and their capabilities.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            {ROLE_DEFINITIONS.map((role, index) => {
              const Icon = role.icon;
              const colorClasses: Record<string, string> = {
                purple: 'border-purple-500/30 bg-purple-500/5',
                cyan: 'border-cyan-500/30 bg-cyan-500/5',
                green: 'border-green-500/30 bg-green-500/5',
                blue: 'border-blue-500/30 bg-blue-500/5',
              };
              const textColors: Record<string, string> = {
                purple: 'text-purple-400',
                cyan: 'text-cyan-400',
                green: 'text-green-400',
                blue: 'text-blue-400',
              };
              return (
                <div key={role.id} className={`p-4 rounded-lg border ${colorClasses[role.color]}`}>
                  <div className="flex items-start gap-3">
                    <div className={`h-10 w-10 rounded-lg flex items-center justify-center bg-white/5`}>
                      <Icon className={`h-5 w-5 ${textColors[role.color]}`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className={`font-semibold ${textColors[role.color]}`}>{role.name}</h3>
                        {index === 0 && <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs">Highest</Badge>}
                      </div>
                      <p className="text-sm text-white/70 mt-1">{role.description}</p>
                      <div className="flex flex-wrap gap-2 mt-3">
                        {role.permissions.map(perm => (
                          <Badge key={perm} variant="outline" className="text-xs text-white/60 border-white/20 bg-white/5">
                            {perm}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <DialogFooter>
            <Button onClick={() => setShowRolesInfo(false)} className="bg-cyan-500 hover:bg-cyan-600 text-white">
              Got it
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

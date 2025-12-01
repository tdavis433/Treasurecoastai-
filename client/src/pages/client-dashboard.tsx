import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { GlassCard, GlassCardHeader, GlassCardTitle, GlassCardDescription, GlassCardContent } from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarHeader,
  SidebarFooter,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import {
  MessageSquare,
  Calendar,
  Users,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Building2,
  Phone,
  MapPin,
  RefreshCw,
  FileText,
  Bot,
  BarChart3,
  Activity,
  Zap,
  AlertTriangle,
  LayoutDashboard,
  Mail,
  Code,
  Settings,
  Copy,
  Check,
  Download,
  ExternalLink,
  Save,
  LogOut,
  HelpCircle,
  Headphones,
  Webhook,
  Link,
  TestTube2,
  Key,
  RefreshCcw,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { format } from "date-fns";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

interface ClientStats {
  clientId: string;
  botId: string;
  businessName: string;
  businessType: string;
  logStats: {
    totalConversations: number;
    messageCount: number;
    botIds: string[];
    dateRange: { first: string; last: string } | null;
  };
  dbStats: {
    totalAppointments: number;
    pendingAppointments: number;
    completedAppointments: number;
    totalConversations: number;
    totalMessages: number;
    weeklyConversations: number;
  } | null;
}

interface ClientProfile {
  user: {
    id: string;
    username: string;
    role: string;
    clientId: string | null;
  };
  clientId: string;
  businessInfo: {
    name: string;
    type: string;
    location: string;
    phone: string;
    hours: string;
  } | null;
  botId: string;
}

interface Appointment {
  id: string;
  name: string;
  contact: string;
  email: string | null;
  preferredTime: string;
  appointmentType: string;
  status: string;
  createdAt: string;
  notes: string | null;
}

interface Conversation {
  sessionId: string;
  messageCount: number;
  firstMessage: string;
  lastMessage: string;
  preview: string;
}

interface AnalyticsSummary {
  clientId: string;
  botId: string;
  totalConversations: number;
  totalMessages: number;
  userMessages: number;
  botMessages: number;
  avgResponseTimeMs: number;
  crisisEvents: number;
  appointmentRequests: number;
  topicBreakdown: Record<string, number>;
}

interface DailyTrend {
  date: string;
  totalConversations: number;
  totalMessages: number;
  userMessages: number;
  botMessages: number;
  crisisEvents: number;
  appointmentRequests: number;
}

interface ChatSession {
  id: string;
  sessionId: string;
  clientId: string;
  botId: string;
  startedAt: string;
  endedAt: string | null;
  userMessageCount: number;
  botMessageCount: number;
  totalResponseTimeMs: number;
  crisisDetected: boolean;
  appointmentRequested: boolean;
  topics: string[];
}

interface UsageSummary {
  clientId: string;
  plan: string;
  planName: string;
  limits: {
    name: string;
    monthlyMessages: number;
    monthlyLeads: number;
    features: string[];
  };
  usage: {
    clientId: string;
    month: string;
    messageCount: number;
    leadCount: number;
    createdAt: string;
    updatedAt: string;
  };
  percentages: {
    messages: number;
    leads: number;
  };
}

type SectionType = 'dashboard' | 'analytics' | 'leads' | 'inbox' | 'appointments' | 'widget' | 'integrations' | 'settings';

interface WebhookSettings {
  webhookUrl: string | null;
  webhookSecret: string | null;
  webhookEnabled: boolean;
  webhookEvents: {
    newLead: boolean;
    newAppointment: boolean;
    chatSessionStart: boolean;
    chatSessionEnd: boolean;
    leadStatusChange: boolean;
  };
  externalBookingUrl: string | null;
  externalPaymentUrl: string | null;
}

const TOPIC_COLORS = [
  "#4FC3F7",
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#8b5cf6",
  "#06b6d4",
  "#f97316",
  "#ec4899",
];

const chartTooltipStyle = {
  backgroundColor: 'rgba(11, 14, 19, 0.9)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '8px',
  color: 'white'
};

const SIDEBAR_ITEMS = [
  { id: 'dashboard' as SectionType, label: 'Dashboard', icon: LayoutDashboard },
  { id: 'analytics' as SectionType, label: 'Analytics', icon: BarChart3 },
  { id: 'leads' as SectionType, label: 'Leads', icon: Users },
  { id: 'inbox' as SectionType, label: 'Inbox', icon: Mail },
  { id: 'appointments' as SectionType, label: 'Appointments', icon: Calendar },
  { id: 'widget' as SectionType, label: 'Widget Code', icon: Code },
  { id: 'integrations' as SectionType, label: 'Integrations', icon: Webhook },
  { id: 'settings' as SectionType, label: 'Settings', icon: Settings },
];

interface AuthUser {
  id: string;
  username: string;
  role: 'super_admin' | 'client_admin';
}

export default function ClientDashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [activeSection, setActiveSection] = useState<SectionType>('dashboard');
  const [dateRange, setDateRange] = useState<number>(14);
  const [copied, setCopied] = useState(false);
  const [editingSettings, setEditingSettings] = useState(false);
  const [settingsForm, setSettingsForm] = useState({
    phone: '',
    location: ''
  });

  const { data: currentUser, isLoading: authLoading } = useQuery<AuthUser>({
    queryKey: ["/api/auth/me"],
    queryFn: async () => {
      const response = await fetch("/api/auth/me", { credentials: "include" });
      if (!response.ok) {
        throw new Error("Not authenticated");
      }
      return response.json();
    },
    retry: false,
  });

  useEffect(() => {
    if (!authLoading && !currentUser) {
      setLocation("/login");
    }
  }, [currentUser, authLoading, setLocation]);

  const { data: profile, isLoading: profileLoading } = useQuery<ClientProfile>({
    queryKey: ["/api/client/me"],
    enabled: !!currentUser,
  });

  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useQuery<ClientStats>({
    queryKey: ["/api/client/stats"],
    enabled: !!currentUser,
  });

  const { data: appointmentsData, isLoading: appointmentsLoading } = useQuery<{
    clientId: string;
    appointments: Appointment[];
    total: number;
  }>({
    queryKey: ["/api/client/appointments"],
    enabled: !!currentUser,
  });

  const { data: conversationsData, isLoading: conversationsLoading } = useQuery<{
    clientId: string;
    botId: string;
    fileLogs: any[];
    dbConversations: Conversation[];
  }>({
    queryKey: ["/api/client/conversations"],
    enabled: !!currentUser,
  });

  const { data: analyticsData, isLoading: analyticsLoading } = useQuery<AnalyticsSummary>({
    queryKey: ["/api/client/analytics/summary"],
    enabled: !!currentUser,
  });

  const { data: trendsData, isLoading: trendsLoading } = useQuery<{
    clientId: string;
    botId: string;
    days: number;
    trends: DailyTrend[];
  }>({
    queryKey: ["/api/client/analytics/trends", { days: dateRange }],
    enabled: !!currentUser,
  });

  const { data: sessionsData, isLoading: sessionsLoading } = useQuery<{
    clientId: string;
    botId: string;
    sessions: ChatSession[];
    total: number;
  }>({
    queryKey: ["/api/client/analytics/sessions"],
    enabled: !!currentUser,
  });

  const { data: usageData, isLoading: usageLoading } = useQuery<UsageSummary>({
    queryKey: ["/api/client/usage"],
    enabled: !!currentUser,
  });

  const { data: leadsData } = useQuery<{
    clientId: string;
    leads: any[];
    total: number;
  }>({
    queryKey: ["/api/client/leads"],
    enabled: !!currentUser,
  });

  const { data: inboxStatesData } = useQuery<{
    clientId: string;
    states: { sessionId: string; isRead: boolean; status: string }[];
  }>({
    queryKey: ["/api/client/inbox/states"],
    enabled: !!currentUser,
  });

  const { data: webhookSettings, isLoading: webhooksLoading, refetch: refetchWebhooks } = useQuery<WebhookSettings>({
    queryKey: ["/api/client/webhooks"],
    enabled: !!currentUser,
  });

  const [webhookForm, setWebhookForm] = useState<Partial<WebhookSettings>>({});
  const [editingWebhooks, setEditingWebhooks] = useState(false);
  const [showWebhookSecret, setShowWebhookSecret] = useState(false);
  const [testingWebhook, setTestingWebhook] = useState(false);
  const [generatingSecret, setGeneratingSecret] = useState(false);

  const newLeadsCount = leadsData?.leads?.filter((lead: any) => lead.status === 'new').length || 0;
  const unreadInboxCount = inboxStatesData?.states?.filter(state => !state.isRead).length || 0;

  const updateSettingsMutation = useMutation({
    mutationFn: async (data: { phone?: string; location?: string }) => {
      const response = await apiRequest("PATCH", "/api/client/settings", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/client/me"] });
      queryClient.invalidateQueries({ queryKey: ["/api/client/stats"] });
      setEditingSettings(false);
      toast({ title: "Settings Updated", description: "Your business information has been saved." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update settings.", variant: "destructive" });
    },
  });

  const updateWebhooksMutation = useMutation({
    mutationFn: async (data: Partial<WebhookSettings>) => {
      const response = await apiRequest("PATCH", "/api/client/webhooks", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/client/webhooks"] });
      setEditingWebhooks(false);
      toast({ title: "Integrations Updated", description: "Your webhook settings have been saved." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update webhook settings.", variant: "destructive" });
    },
  });

  const handleTestWebhook = async () => {
    setTestingWebhook(true);
    try {
      const response = await apiRequest("POST", "/api/client/webhooks/test", {});
      const result = await response.json();
      if (result.success) {
        toast({ title: "Webhook Test Successful", description: result.message });
      } else {
        toast({ title: "Webhook Test Failed", description: result.error || "Failed to deliver test webhook", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to test webhook", variant: "destructive" });
    } finally {
      setTestingWebhook(false);
    }
  };

  const handleGenerateSecret = async () => {
    setGeneratingSecret(true);
    try {
      const response = await apiRequest("POST", "/api/client/webhooks/generate-secret", {});
      const result = await response.json();
      if (result.success) {
        setWebhookForm(prev => ({ ...prev, webhookSecret: result.webhookSecret }));
        setShowWebhookSecret(true);
        queryClient.invalidateQueries({ queryKey: ["/api/client/webhooks"] });
        toast({ 
          title: "New Secret Generated", 
          description: "Save this secret - it will only be shown once." 
        });
      } else {
        toast({ title: "Error", description: "Failed to generate secret", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to generate secret", variant: "destructive" });
    } finally {
      setGeneratingSecret(false);
    }
  };

  const startEditingWebhooks = () => {
    setWebhookForm({
      webhookUrl: webhookSettings?.webhookUrl || null,
      webhookSecret: null, // Don't pre-fill secret for security
      webhookEnabled: webhookSettings?.webhookEnabled ?? false,
      webhookEvents: webhookSettings?.webhookEvents ?? {
        newLead: true,
        newAppointment: true,
        chatSessionStart: false,
        chatSessionEnd: false,
        leadStatusChange: false,
      },
      externalBookingUrl: webhookSettings?.externalBookingUrl || null,
      externalPaymentUrl: webhookSettings?.externalPaymentUrl || null,
    });
    setEditingWebhooks(true);
    setShowWebhookSecret(false);
  };

  const handleSaveWebhooks = () => {
    const updates: Partial<WebhookSettings> = {};
    if (webhookForm.webhookUrl !== undefined) updates.webhookUrl = webhookForm.webhookUrl || null;
    if (webhookForm.webhookSecret) updates.webhookSecret = webhookForm.webhookSecret;
    if (webhookForm.webhookEnabled !== undefined) updates.webhookEnabled = webhookForm.webhookEnabled;
    if (webhookForm.webhookEvents) updates.webhookEvents = webhookForm.webhookEvents;
    if (webhookForm.externalBookingUrl !== undefined) updates.externalBookingUrl = webhookForm.externalBookingUrl || null;
    if (webhookForm.externalPaymentUrl !== undefined) updates.externalPaymentUrl = webhookForm.externalPaymentUrl || null;
    
    updateWebhooksMutation.mutate(updates);
  };

  const handleCopyWidgetCode = () => {
    const botId = profile?.botId || stats?.botId || '';
    const embedCode = `<!-- Treasure Coast AI Widget -->
<script>
  (function(w,d,s,o,f,js,fjs){
    w['TCAIWidget']=o;w[o]=w[o]||function(){(w[o].q=w[o].q||[]).push(arguments)};
    js=d.createElement(s),fjs=d.getElementsByTagName(s)[0];
    js.id=o;js.src=f;js.async=1;fjs.parentNode.insertBefore(js,fjs);
  }(window,document,'script','tcai','${window.location.origin}/widget/embed.js'));
  tcai('init', { botId: '${botId}' });
</script>`;
    
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    toast({ title: "Copied!", description: "Widget code copied to clipboard." });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportAnalytics = () => {
    const data = {
      summary: analyticsData,
      trends: trendsData?.trends,
      exportDate: new Date().toISOString(),
      dateRange: `${dateRange} days`
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-export-${format(new Date(), 'yyyy-MM-dd')}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Export Complete", description: "Analytics data has been downloaded." });
  };

  const handleSaveSettings = () => {
    updateSettingsMutation.mutate(settingsForm);
  };

  const startEditingSettings = () => {
    setSettingsForm({
      phone: profile?.businessInfo?.phone || '',
      location: profile?.businessInfo?.location || ''
    });
    setEditingSettings(true);
  };

  const formatHoursValue = (hours: unknown): string => {
    if (!hours) return "Not configured";
    if (typeof hours === 'string') return hours;
    if (typeof hours !== 'object') return String(hours);
    
    const formatObject = (obj: Record<string, unknown>, prefix = ''): string[] => {
      const parts: string[] = [];
      for (const [key, val] of Object.entries(obj)) {
        const label = prefix ? `${prefix} ${key}` : key;
        if (typeof val === 'string') {
          parts.push(`${label}: ${val}`);
        } else if (typeof val === 'object' && val !== null) {
          parts.push(...formatObject(val as Record<string, unknown>, label));
        } else if (val !== undefined && val !== null) {
          parts.push(`${label}: ${String(val)}`);
        }
      }
      return parts;
    };
    
    const formatted = formatObject(hours as Record<string, unknown>);
    return formatted.length > 0 ? formatted.join(' | ') : "Not configured";
  };

  const handleLogout = async () => {
    try {
      const response = await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
      if (response.ok) {
        queryClient.clear();
        setLocation("/login");
      } else {
        toast({ title: "Error", description: "Failed to logout. Please try again.", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Network error during logout.", variant: "destructive" });
    }
  };

  if (authLoading || !currentUser) {
    return (
      <div className="min-h-screen bg-[#0B0E13] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
      </div>
    );
  }

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-[#0B0E13] text-white p-6 space-y-6">
        <div className="h-10 w-64 bg-white/10 rounded-lg animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-32 bg-white/10 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const businessName = profile?.businessInfo?.name || stats?.businessName || "Your Business";
  const businessType = profile?.businessInfo?.type || stats?.businessType || "business";
  const botId = profile?.botId || stats?.botId || '';

  const sidebarStyle = {
    "--sidebar-width": "18rem",
    "--sidebar-width-icon": "3rem",
  };

  const renderDashboardSection = () => (
    <div className="space-y-6">
      {statsLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-32 bg-white/10 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <GlassCard data-testid="card-total-conversations">
            <GlassCardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <GlassCardTitle className="text-sm font-medium">Total Conversations</GlassCardTitle>
              <MessageSquare className="h-4 w-4 text-white/55" />
            </GlassCardHeader>
            <GlassCardContent>
              <div className="text-2xl font-bold text-white">
                {stats?.dbStats?.totalConversations || stats?.logStats?.totalConversations || 0}
              </div>
              <p className="text-xs text-white/55">
                {stats?.dbStats?.totalMessages || stats?.logStats?.messageCount || 0} total messages
              </p>
            </GlassCardContent>
          </GlassCard>

          <GlassCard data-testid="card-weekly-activity">
            <GlassCardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <GlassCardTitle className="text-sm font-medium">This Week</GlassCardTitle>
              <TrendingUp className="h-4 w-4 text-white/55" />
            </GlassCardHeader>
            <GlassCardContent>
              <div className="text-2xl font-bold text-white">
                {stats?.dbStats?.weeklyConversations || 0}
              </div>
              <p className="text-xs text-white/55">
                New conversations
              </p>
            </GlassCardContent>
          </GlassCard>

          {stats?.dbStats && (
            <>
              <GlassCard data-testid="card-pending-appointments">
                <GlassCardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                  <GlassCardTitle className="text-sm font-medium">Pending</GlassCardTitle>
                  <Clock className="h-4 w-4 text-white/55" />
                </GlassCardHeader>
                <GlassCardContent>
                  <div className="text-2xl font-bold text-amber-400">
                    {stats.dbStats.pendingAppointments}
                  </div>
                  <p className="text-xs text-white/55">
                    Appointments awaiting action
                  </p>
                </GlassCardContent>
              </GlassCard>

              <GlassCard data-testid="card-completed-appointments">
                <GlassCardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                  <GlassCardTitle className="text-sm font-medium">Completed</GlassCardTitle>
                  <CheckCircle className="h-4 w-4 text-white/55" />
                </GlassCardHeader>
                <GlassCardContent>
                  <div className="text-2xl font-bold text-green-400">
                    {stats.dbStats.completedAppointments}
                  </div>
                  <p className="text-xs text-white/55">
                    Total confirmed/completed
                  </p>
                </GlassCardContent>
              </GlassCard>
            </>
          )}

          {!stats?.dbStats && (
            <>
              <GlassCard data-testid="card-message-count">
                <GlassCardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                  <GlassCardTitle className="text-sm font-medium">Messages</GlassCardTitle>
                  <FileText className="h-4 w-4 text-white/55" />
                </GlassCardHeader>
                <GlassCardContent>
                  <div className="text-2xl font-bold text-white">
                    {stats?.logStats?.messageCount || 0}
                  </div>
                  <p className="text-xs text-white/55">
                    Total logged messages
                  </p>
                </GlassCardContent>
              </GlassCard>

              <GlassCard data-testid="card-last-activity">
                <GlassCardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                  <GlassCardTitle className="text-sm font-medium">Last Activity</GlassCardTitle>
                  <Clock className="h-4 w-4 text-white/55" />
                </GlassCardHeader>
                <GlassCardContent>
                  <div className="text-sm font-medium text-white">
                    {stats?.logStats?.dateRange?.last
                      ? format(new Date(stats.logStats.dateRange.last), "MMM d, h:mm a")
                      : "No activity yet"}
                  </div>
                  <p className="text-xs text-white/55">
                    Most recent conversation
                  </p>
                </GlassCardContent>
              </GlassCard>
            </>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GlassCard data-testid="card-quick-overview">
          <GlassCardHeader>
            <GlassCardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-cyan-400" />
              Quick Overview
            </GlassCardTitle>
            <GlassCardDescription>
              Recent activity summary
            </GlassCardDescription>
          </GlassCardHeader>
          <GlassCardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10">
              <div className="flex items-center gap-3">
                <MessageSquare className="h-5 w-5 text-cyan-400" />
                <span className="text-sm text-white/85">Recent Conversations</span>
              </div>
              <Badge className="bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                {conversationsData?.dbConversations?.length || 0}
              </Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-blue-400" />
                <span className="text-sm text-white/85">Pending Bookings</span>
              </div>
              <Badge className="bg-blue-500/20 text-blue-400 border border-blue-500/30">
                {stats?.dbStats?.pendingAppointments || 0}
              </Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10">
              <div className="flex items-center gap-3">
                <Zap className="h-5 w-5 text-green-400" />
                <span className="text-sm text-white/85">Avg Response Time</span>
              </div>
              <Badge className="bg-green-500/20 text-green-400 border border-green-500/30">
                {analyticsData?.avgResponseTimeMs 
                  ? `${(analyticsData.avgResponseTimeMs / 1000).toFixed(1)}s` 
                  : "—"}
              </Badge>
            </div>
          </GlassCardContent>
        </GlassCard>

        <GlassCard data-testid="card-recent-sessions-overview">
          <GlassCardHeader>
            <GlassCardTitle>Recent Sessions</GlassCardTitle>
            <GlassCardDescription>
              Latest chat sessions
            </GlassCardDescription>
          </GlassCardHeader>
          <GlassCardContent>
            {sessionsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-12 bg-white/10 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : sessionsData?.sessions && sessionsData.sessions.length > 0 ? (
              <div className="space-y-3">
                {sessionsData.sessions.slice(0, 3).map((session) => (
                  <div
                    key={session.id}
                    className="p-3 border border-white/10 rounded-lg bg-white/5 flex items-center justify-between gap-2"
                    data-testid={`session-overview-${session.id}`}
                  >
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-white/55" />
                      <span className="text-sm text-white">#{session.sessionId.slice(0, 8)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-white/10 text-white/85 border border-white/20 text-xs">
                        {session.userMessageCount + session.botMessageCount} msgs
                      </Badge>
                      <span className="text-xs text-white/55">
                        {format(new Date(session.startedAt), "MMM d")}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-white/40">
                <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No sessions yet</p>
              </div>
            )}
          </GlassCardContent>
        </GlassCard>
      </div>

      <GlassCard data-testid="card-usage-billing">
        <GlassCardHeader>
          <GlassCardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-cyan-400" />
            Usage & Plan
          </GlassCardTitle>
          <GlassCardDescription>
            Your current plan usage and limits
          </GlassCardDescription>
        </GlassCardHeader>
        <GlassCardContent>
          {usageLoading ? (
            <div className="space-y-4">
              <div className="h-8 bg-white/10 rounded animate-pulse" />
              <div className="h-4 bg-white/10 rounded animate-pulse" />
              <div className="h-4 bg-white/10 rounded animate-pulse" />
            </div>
          ) : usageData ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg font-semibold text-white">{usageData.planName}</p>
                  <p className="text-sm text-white/55">Current plan</p>
                </div>
                <Badge className="bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-400 border border-cyan-400/30">
                  {usageData.plan.toUpperCase()}
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white/70">Messages this month</span>
                    <span className="text-white font-medium">
                      {usageData.usage?.messageCount || 0} / {usageData.limits.monthlyMessages === -1 ? 'Unlimited' : usageData.limits.monthlyMessages}
                    </span>
                  </div>
                  <Progress 
                    value={usageData.limits.monthlyMessages === -1 ? 5 : Math.min(usageData.percentages.messages, 100)} 
                    className="h-2 bg-white/10"
                  />
                  <p className="text-xs text-white/40">
                    {usageData.limits.monthlyMessages === -1 
                      ? 'Unlimited messages' 
                      : `${usageData.percentages.messages.toFixed(0)}% used`}
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white/70">Leads captured</span>
                    <span className="text-white font-medium">
                      {usageData.usage?.leadCount || 0} / {usageData.limits.monthlyLeads === -1 ? 'Unlimited' : usageData.limits.monthlyLeads}
                    </span>
                  </div>
                  <Progress 
                    value={usageData.limits.monthlyLeads === -1 ? 5 : Math.min(usageData.percentages.leads, 100)} 
                    className="h-2 bg-white/10"
                  />
                  <p className="text-xs text-white/40">
                    {usageData.limits.monthlyLeads === -1 
                      ? 'Unlimited leads' 
                      : `${usageData.percentages.leads.toFixed(0)}% used`}
                  </p>
                </div>
              </div>

              {usageData.limits.features && usageData.limits.features.length > 0 && (
                <div className="pt-4 border-t border-white/10">
                  <p className="text-sm font-medium text-white/70 mb-2">Plan Features</p>
                  <div className="flex flex-wrap gap-2">
                    {usageData.limits.features.map((feature, idx) => (
                      <Badge key={idx} className="bg-white/10 text-white/70 border border-white/20 text-xs">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        {feature}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-white/55 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-white/55">
                    Need more capacity? Contact our team to upgrade your plan for increased limits.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-6 text-white/40">
              <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Usage data not available</p>
            </div>
          )}
        </GlassCardContent>
      </GlassCard>
    </div>
  );

  const renderAnalyticsSection = () => (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Analytics</h2>
          <p className="text-sm text-white/55">See how your AI assistant is performing</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={String(dateRange)} onValueChange={(v) => setDateRange(Number(v))}>
            <SelectTrigger className="w-[140px] bg-white/5 border-white/10 text-white" data-testid="select-date-range">
              <SelectValue placeholder="Date range" />
            </SelectTrigger>
            <SelectContent className="bg-[#0B0E13] border-white/10">
              <SelectItem value="7" className="text-white hover:bg-white/10">Last 7 days</SelectItem>
              <SelectItem value="14" className="text-white hover:bg-white/10">Last 14 days</SelectItem>
              <SelectItem value="30" className="text-white hover:bg-white/10">Last 30 days</SelectItem>
              <SelectItem value="90" className="text-white hover:bg-white/10">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportAnalytics}
            className="border-white/10 text-white/85 hover:bg-white/10 hover:text-white"
            data-testid="button-export-analytics"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <GlassCard data-testid="card-analytics-messages">
          <GlassCardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <GlassCardTitle className="text-sm font-medium">Total Messages</GlassCardTitle>
            <MessageSquare className="h-4 w-4 text-white/55" />
          </GlassCardHeader>
          <GlassCardContent>
            {analyticsLoading ? (
              <div className="h-8 w-20 bg-white/10 rounded animate-pulse" />
            ) : (
              <>
                <div className="text-2xl font-bold text-white">{analyticsData?.totalMessages || 0}</div>
                <p className="text-xs text-white/55">
                  {analyticsData?.userMessages || 0} user / {analyticsData?.botMessages || 0} bot
                </p>
              </>
            )}
          </GlassCardContent>
        </GlassCard>

        <GlassCard data-testid="card-analytics-response-time">
          <GlassCardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <GlassCardTitle className="text-sm font-medium">Avg Response Time</GlassCardTitle>
            <Zap className="h-4 w-4 text-white/55" />
          </GlassCardHeader>
          <GlassCardContent>
            {analyticsLoading ? (
              <div className="h-8 w-20 bg-white/10 rounded animate-pulse" />
            ) : (
              <>
                <div className="text-2xl font-bold text-white">
                  {analyticsData?.avgResponseTimeMs 
                    ? `${(analyticsData.avgResponseTimeMs / 1000).toFixed(1)}s` 
                    : "—"}
                </div>
                <p className="text-xs text-white/55">
                  Per conversation
                </p>
              </>
            )}
          </GlassCardContent>
        </GlassCard>

        <GlassCard data-testid="card-analytics-appointments">
          <GlassCardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <GlassCardTitle className="text-sm font-medium">Booking Requests</GlassCardTitle>
            <Calendar className="h-4 w-4 text-white/55" />
          </GlassCardHeader>
          <GlassCardContent>
            {analyticsLoading ? (
              <div className="h-8 w-20 bg-white/10 rounded animate-pulse" />
            ) : (
              <>
                <div className="text-2xl font-bold text-white">{analyticsData?.appointmentRequests || 0}</div>
                <p className="text-xs text-white/55">
                  From chat conversations
                </p>
              </>
            )}
          </GlassCardContent>
        </GlassCard>

        <GlassCard data-testid="card-analytics-crisis">
          <GlassCardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <GlassCardTitle className="text-sm font-medium">Crisis Events</GlassCardTitle>
            <AlertTriangle className="h-4 w-4 text-white/55" />
          </GlassCardHeader>
          <GlassCardContent>
            {analyticsLoading ? (
              <div className="h-8 w-20 bg-white/10 rounded animate-pulse" />
            ) : (
              <>
                <div className="text-2xl font-bold text-amber-400">{analyticsData?.crisisEvents || 0}</div>
                <p className="text-xs text-white/55">
                  Safety redirects triggered
                </p>
              </>
            )}
          </GlassCardContent>
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GlassCard data-testid="card-daily-trends">
          <GlassCardHeader>
            <GlassCardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-cyan-400" />
              Daily Activity (Last {dateRange} Days)
            </GlassCardTitle>
            <GlassCardDescription>
              Conversations and messages over time
            </GlassCardDescription>
          </GlassCardHeader>
          <GlassCardContent>
            {trendsLoading ? (
              <div className="h-[300px] w-full bg-white/10 rounded-lg animate-pulse" />
            ) : trendsData?.trends && trendsData.trends.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={trendsData.trends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff15" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(date) => format(new Date(date), "MM/dd")}
                    stroke="#ffffff55"
                    tick={{ fill: '#ffffff55', fontSize: 12 }}
                  />
                  <YAxis stroke="#ffffff55" tick={{ fill: '#ffffff55', fontSize: 12 }} />
                  <Tooltip 
                    labelFormatter={(date) => format(new Date(date), "MMM d, yyyy")}
                    contentStyle={chartTooltipStyle}
                    labelStyle={{ color: 'white' }}
                  />
                  <Legend wrapperStyle={{ color: '#ffffff85' }} />
                  <Line 
                    type="monotone" 
                    dataKey="totalConversations" 
                    stroke="#4FC3F7" 
                    strokeWidth={2}
                    name="Conversations"
                    dot={false}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="totalMessages" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    name="Messages"
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-white/40">
                <div className="text-center">
                  <Activity className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No activity data yet</p>
                  <p className="text-sm">Start chatting to see trends</p>
                </div>
              </div>
            )}
          </GlassCardContent>
        </GlassCard>

        <GlassCard data-testid="card-topic-breakdown">
          <GlassCardHeader>
            <GlassCardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-cyan-400" />
              Topic Breakdown
            </GlassCardTitle>
            <GlassCardDescription>
              What visitors are asking about
            </GlassCardDescription>
          </GlassCardHeader>
          <GlassCardContent>
            {analyticsLoading ? (
              <div className="h-[300px] w-full bg-white/10 rounded-lg animate-pulse" />
            ) : analyticsData?.topicBreakdown && Object.keys(analyticsData.topicBreakdown).length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={Object.entries(analyticsData.topicBreakdown).map(([name, value], idx) => ({
                      name: name.charAt(0).toUpperCase() + name.slice(1),
                      value,
                      fill: TOPIC_COLORS[idx % TOPIC_COLORS.length]
                    }))}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {Object.entries(analyticsData.topicBreakdown).map((_, idx) => (
                      <Cell key={idx} fill={TOPIC_COLORS[idx % TOPIC_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={chartTooltipStyle} />
                  <Legend wrapperStyle={{ color: '#ffffff85' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-white/40">
                <div className="text-center">
                  <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No topics tracked yet</p>
                  <p className="text-sm">Topics will appear as visitors chat</p>
                </div>
              </div>
            )}
          </GlassCardContent>
        </GlassCard>
      </div>

      <GlassCard data-testid="card-recent-sessions">
        <GlassCardHeader>
          <GlassCardTitle>Recent Chat Sessions</GlassCardTitle>
          <GlassCardDescription>
            Conversations your AI assistant has handled for you
          </GlassCardDescription>
        </GlassCardHeader>
        <GlassCardContent>
          {sessionsLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-20 bg-white/10 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : sessionsData?.sessions && sessionsData.sessions.length > 0 ? (
            <ScrollArea className="h-[300px]">
              <div className="space-y-3">
                {sessionsData.sessions.map((session) => (
                  <div
                    key={session.id}
                    className="p-4 border border-white/10 rounded-lg space-y-2 bg-white/5"
                    data-testid={`session-${session.id}`}
                  >
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4 text-white/55" />
                        <span className="font-medium text-sm text-white">
                          Session #{session.sessionId.slice(0, 12)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        {session.crisisDetected && (
                          <Badge className="bg-red-500/20 text-red-400 border border-red-500/30 text-xs">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Crisis
                          </Badge>
                        )}
                        {session.appointmentRequested && (
                          <Badge className="bg-blue-500/20 text-blue-400 border border-blue-500/30 text-xs">
                            <Calendar className="h-3 w-3 mr-1" />
                            Booking
                          </Badge>
                        )}
                        <Badge className="bg-white/10 text-white/85 border border-white/20 text-xs">
                          {session.userMessageCount + session.botMessageCount} msgs
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-white/55 flex-wrap">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {format(new Date(session.startedAt), "MMM d, h:mm a")}
                      </span>
                      {session.totalResponseTimeMs > 0 && (
                        <span className="flex items-center gap-1">
                          <Zap className="h-3 w-3" />
                          Avg: {(session.totalResponseTimeMs / Math.max(session.botMessageCount, 1) / 1000).toFixed(1)}s
                        </span>
                      )}
                    </div>
                    {session.topics && session.topics.length > 0 && (
                      <div className="flex gap-1 flex-wrap">
                        {session.topics.slice(0, 5).map((topic, idx) => (
                          <Badge key={idx} className="bg-white/10 text-white/70 border border-white/20 text-xs">
                            {topic}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <div className="text-center py-8 text-white/40">
              <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No sessions recorded yet</p>
              <p className="text-sm">Chat sessions will appear here once visitors start chatting</p>
            </div>
          )}
        </GlassCardContent>
      </GlassCard>
    </div>
  );

  const renderLeadsSection = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-white">Leads</h2>
        <p className="text-sm text-white/55">View leads your AI assistant has captured</p>
      </div>
      
      <GlassCard data-testid="card-leads-navigation">
        <GlassCardHeader>
          <GlassCardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-cyan-400" />
            Lead Management
          </GlassCardTitle>
          <GlassCardDescription>
            View leads captured by your AI assistant
          </GlassCardDescription>
        </GlassCardHeader>
        <GlassCardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10">
            <div>
              <p className="text-white font-medium">View All Leads</p>
              <p className="text-sm text-white/55">Access your complete lead database</p>
            </div>
            <Button
              onClick={() => setLocation('/client/leads')}
              className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white"
              data-testid="button-view-leads"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Open Leads
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-white/5 rounded-lg border border-white/10 text-center">
              <Users className="h-8 w-8 mx-auto mb-2 text-cyan-400" />
              <p className="text-2xl font-bold text-white">{analyticsData?.totalConversations || 0}</p>
              <p className="text-xs text-white/55">Total Contacts</p>
            </div>
            <div className="p-4 bg-white/5 rounded-lg border border-white/10 text-center">
              <TrendingUp className="h-8 w-8 mx-auto mb-2 text-green-400" />
              <p className="text-2xl font-bold text-white">{stats?.dbStats?.weeklyConversations || 0}</p>
              <p className="text-xs text-white/55">This Week</p>
            </div>
          </div>
        </GlassCardContent>
      </GlassCard>
    </div>
  );

  const renderInboxSection = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-white">Inbox</h2>
        <p className="text-sm text-white/55">See what your AI assistant has been talking about</p>
      </div>
      
      <GlassCard data-testid="card-inbox-navigation">
        <GlassCardHeader>
          <GlassCardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-cyan-400" />
            Message Center
          </GlassCardTitle>
          <GlassCardDescription>
            Access your conversation inbox and message history
          </GlassCardDescription>
        </GlassCardHeader>
        <GlassCardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10">
            <div>
              <p className="text-white font-medium">View Inbox</p>
              <p className="text-sm text-white/55">Access all messages and conversations</p>
            </div>
            <Button
              onClick={() => setLocation('/client/inbox')}
              className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white"
              data-testid="button-view-inbox"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Open Inbox
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-white/5 rounded-lg border border-white/10 text-center">
              <MessageSquare className="h-8 w-8 mx-auto mb-2 text-cyan-400" />
              <p className="text-2xl font-bold text-white">{conversationsData?.dbConversations?.length || 0}</p>
              <p className="text-xs text-white/55">Conversations</p>
            </div>
            <div className="p-4 bg-white/5 rounded-lg border border-white/10 text-center">
              <FileText className="h-8 w-8 mx-auto mb-2 text-blue-400" />
              <p className="text-2xl font-bold text-white">{stats?.dbStats?.totalMessages || 0}</p>
              <p className="text-xs text-white/55">Total Messages</p>
            </div>
          </div>
        </GlassCardContent>
      </GlassCard>
    </div>
  );

  const renderAppointmentsSection = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-white">Appointments</h2>
        <p className="text-sm text-white/55">Manage booking requests from visitors</p>
      </div>
      
      <GlassCard data-testid="card-appointments">
        <GlassCardHeader>
          <GlassCardTitle>Booking Requests</GlassCardTitle>
          <GlassCardDescription>
            Booking requests your AI assistant has collected
          </GlassCardDescription>
        </GlassCardHeader>
        <GlassCardContent>
          {appointmentsLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-20 bg-white/10 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : (appointmentsData?.appointments?.length || 0) > 0 ? (
            <ScrollArea className="h-[500px]">
              <div className="space-y-4">
                {appointmentsData?.appointments?.map((apt) => (
                  <div
                    key={apt.id}
                    className="p-4 border border-white/10 rounded-lg space-y-2 bg-white/5"
                    data-testid={`appointment-${apt.id}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-white/55" />
                        <span className="font-medium text-white">{apt.name}</span>
                      </div>
                      <Badge
                        className={
                          apt.status === "confirmed" || apt.status === "completed"
                            ? "bg-green-500/20 text-green-400 border border-green-500/30"
                            : apt.status === "cancelled"
                            ? "bg-red-500/20 text-red-400 border border-red-500/30"
                            : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                        }
                      >
                        {apt.status}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm text-white/55">
                      <div className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {apt.contact}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {apt.preferredTime}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-white/55">
                      <Badge className="bg-white/10 text-white/70 border border-white/20">{apt.appointmentType}</Badge>
                      <span>
                        Requested: {format(new Date(apt.createdAt), "MMM d, yyyy")}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <div className="text-center py-8 text-white/40">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No appointments yet</p>
              <p className="text-sm">Booking requests will appear here</p>
            </div>
          )}
        </GlassCardContent>
      </GlassCard>
    </div>
  );

  const renderWidgetSection = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-white">Widget Code</h2>
        <p className="text-sm text-white/55">Add your AI assistant to your website</p>
      </div>
      
      <GlassCard data-testid="card-widget-code">
        <GlassCardHeader>
          <GlassCardTitle className="flex items-center gap-2">
            <Code className="h-5 w-5 text-cyan-400" />
            Embed Code
          </GlassCardTitle>
          <GlassCardDescription>
            Add this code to your website — or let us handle it for you
          </GlassCardDescription>
        </GlassCardHeader>
        <GlassCardContent className="space-y-4">
          <div className="relative">
            <pre className="p-4 bg-[#1a1f29] border border-white/10 rounded-lg overflow-x-auto text-sm font-mono text-white/85">
{`<!-- Treasure Coast AI Widget -->
<script>
  (function(w,d,s,o,f,js,fjs){
    w['TCAIWidget']=o;w[o]=w[o]||function(){
      (w[o].q=w[o].q||[]).push(arguments)
    };
    js=d.createElement(s);
    fjs=d.getElementsByTagName(s)[0];
    js.id=o;js.src=f;js.async=1;
    fjs.parentNode.insertBefore(js,fjs);
  }(window,document,'script','tcai',
    '${window.location.origin}/widget/embed.js'));
  tcai('init', { botId: '${botId}' });
</script>`}
            </pre>
            <Button
              onClick={handleCopyWidgetCode}
              size="sm"
              className="absolute top-2 right-2 bg-white/10 border border-white/20 text-white hover:bg-white/20"
              data-testid="button-copy-widget-code"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 mr-1" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-1" />
                  Copy
                </>
              )}
            </Button>
          </div>
          
          <div className="p-4 bg-white/5 border border-white/10 rounded-lg">
            <h4 className="font-medium text-white mb-2">Installation Instructions</h4>
            <ol className="list-decimal list-inside space-y-2 text-sm text-white/70">
              <li>Copy the embed code above</li>
              <li>Paste it just before the closing <code className="text-cyan-400">&lt;/body&gt;</code> tag on your website</li>
              <li>The chatbot widget will appear in the bottom-right corner</li>
              <li>Test the widget by clicking on it and sending a message</li>
            </ol>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex-1 p-4 bg-white/5 rounded-lg border border-white/10">
              <Label className="text-white/55 text-sm">Bot ID</Label>
              <p className="font-mono text-sm text-white" data-testid="text-widget-bot-id">{botId || 'N/A'}</p>
            </div>
            <Button
              variant="outline"
              onClick={() => setLocation(`/demo/${botId}`)}
              className="border-white/10 text-white/85 hover:bg-white/10 hover:text-white"
              data-testid="button-preview-widget"
            >
              <Bot className="h-4 w-4 mr-2" />
              Preview Widget
            </Button>
          </div>
        </GlassCardContent>
      </GlassCard>
    </div>
  );

  const renderIntegrationsSection = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-white">Integrations</h2>
        <p className="text-sm text-white/55">Connect your external systems and receive real-time webhook notifications</p>
      </div>

      <GlassCard data-testid="card-external-links">
        <GlassCardHeader>
          <GlassCardTitle className="flex items-center gap-2">
            <Link className="h-5 w-5 text-cyan-400" />
            External Links
          </GlassCardTitle>
          <GlassCardDescription>
            Connect your existing booking and payment systems
          </GlassCardDescription>
        </GlassCardHeader>
        <GlassCardContent className="space-y-4">
          {editingWebhooks ? (
            <>
              <div>
                <Label className="text-sm font-medium text-white/55">Booking System URL</Label>
                <Input
                  type="url"
                  value={webhookForm.externalBookingUrl || ''}
                  onChange={(e) => setWebhookForm(prev => ({ ...prev, externalBookingUrl: e.target.value || null }))}
                  placeholder="https://calendly.com/your-business"
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
                  data-testid="input-external-booking-url"
                />
                <p className="text-xs text-white/40 mt-1">Your Calendly, Acuity, or other booking system link</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-white/55">Payment Page URL</Label>
                <Input
                  type="url"
                  value={webhookForm.externalPaymentUrl || ''}
                  onChange={(e) => setWebhookForm(prev => ({ ...prev, externalPaymentUrl: e.target.value || null }))}
                  placeholder="https://square.link/your-payment"
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
                  data-testid="input-external-payment-url"
                />
                <p className="text-xs text-white/40 mt-1">Your Square, PayPal, or other payment page link</p>
              </div>
            </>
          ) : (
            <>
              <div>
                <Label className="text-sm font-medium text-white/55">Booking System</Label>
                <p className="text-sm text-white flex items-center gap-2">
                  <ExternalLink className="h-4 w-4 text-white/55" />
                  {webhookSettings?.externalBookingUrl || 'Not configured'}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium text-white/55">Payment Page</Label>
                <p className="text-sm text-white flex items-center gap-2">
                  <ExternalLink className="h-4 w-4 text-white/55" />
                  {webhookSettings?.externalPaymentUrl || 'Not configured'}
                </p>
              </div>
            </>
          )}
        </GlassCardContent>
      </GlassCard>

      <GlassCard data-testid="card-webhooks">
        <GlassCardHeader>
          <GlassCardTitle className="flex items-center gap-2">
            <Webhook className="h-5 w-5 text-cyan-400" />
            Webhook Configuration
          </GlassCardTitle>
          <GlassCardDescription>
            Receive real-time notifications when events occur in your chatbot
          </GlassCardDescription>
        </GlassCardHeader>
        <GlassCardContent className="space-y-6">
          {editingWebhooks ? (
            <>
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10">
                <div>
                  <Label className="text-sm font-medium text-white">Enable Webhooks</Label>
                  <p className="text-xs text-white/40">Send notifications to your endpoint when events occur</p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setWebhookForm(prev => ({ ...prev, webhookEnabled: !prev.webhookEnabled }))}
                  className="text-white"
                  data-testid="button-toggle-webhooks"
                >
                  {webhookForm.webhookEnabled ? (
                    <ToggleRight className="h-8 w-8 text-cyan-400" />
                  ) : (
                    <ToggleLeft className="h-8 w-8 text-white/40" />
                  )}
                </Button>
              </div>

              <div>
                <Label className="text-sm font-medium text-white/55">Webhook URL</Label>
                <Input
                  type="url"
                  value={webhookForm.webhookUrl || ''}
                  onChange={(e) => setWebhookForm(prev => ({ ...prev, webhookUrl: e.target.value || null }))}
                  placeholder="https://your-server.com/webhooks/tcai"
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
                  data-testid="input-webhook-url"
                />
                <p className="text-xs text-white/40 mt-1">Your server endpoint that will receive webhook events</p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-sm font-medium text-white/55">Webhook Secret</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleGenerateSecret}
                    disabled={generatingSecret}
                    className="text-xs text-cyan-400 hover:text-cyan-300"
                    data-testid="button-generate-secret"
                  >
                    <RefreshCcw className={`h-3 w-3 mr-1 ${generatingSecret ? 'animate-spin' : ''}`} />
                    Generate New
                  </Button>
                </div>
                <div className="relative">
                  <Input
                    type={showWebhookSecret ? 'text' : 'password'}
                    value={webhookForm.webhookSecret || ''}
                    onChange={(e) => setWebhookForm(prev => ({ ...prev, webhookSecret: e.target.value || null }))}
                    placeholder="Enter secret or generate one"
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/40 pr-10"
                    data-testid="input-webhook-secret"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowWebhookSecret(!showWebhookSecret)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 text-white/40 hover:text-white"
                  >
                    <Key className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-white/40 mt-1">Used to sign webhooks (min 16 characters). Check X-Webhook-Signature header.</p>
              </div>

              <div>
                <Label className="text-sm font-medium text-white/55 mb-3 block">Events to Send</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    { key: 'newLead', label: 'New Lead Captured', desc: 'When a visitor shares contact info' },
                    { key: 'newAppointment', label: 'Appointment Requested', desc: 'When someone books an appointment' },
                    { key: 'leadStatusChange', label: 'Lead Status Changed', desc: 'When you update a lead status' },
                    { key: 'chatSessionStart', label: 'Chat Session Started', desc: 'When a new conversation begins' },
                    { key: 'chatSessionEnd', label: 'Chat Session Ended', desc: 'When a conversation ends' },
                  ].map(event => (
                    <div
                      key={event.key}
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${
                        webhookForm.webhookEvents?.[event.key as keyof typeof webhookForm.webhookEvents]
                          ? 'bg-cyan-500/10 border-cyan-400/40'
                          : 'bg-white/5 border-white/10 hover:border-white/20'
                      }`}
                      onClick={() => setWebhookForm(prev => ({
                        ...prev,
                        webhookEvents: {
                          ...prev.webhookEvents!,
                          [event.key]: !prev.webhookEvents?.[event.key as keyof typeof prev.webhookEvents]
                        }
                      }))}
                      data-testid={`toggle-event-${event.key}`}
                    >
                      <div className="flex items-center gap-2">
                        {webhookForm.webhookEvents?.[event.key as keyof typeof webhookForm.webhookEvents] ? (
                          <CheckCircle className="h-4 w-4 text-cyan-400" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-white/30" />
                        )}
                        <span className="text-sm font-medium text-white">{event.label}</span>
                      </div>
                      <p className="text-xs text-white/40 mt-1 ml-6">{event.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10">
                <div>
                  <Label className="text-sm font-medium text-white">Status</Label>
                </div>
                <Badge className={webhookSettings?.webhookEnabled 
                  ? 'bg-green-500/20 text-green-400 border-green-400/30' 
                  : 'bg-white/10 text-white/50 border-white/20'
                }>
                  {webhookSettings?.webhookEnabled ? 'Enabled' : 'Disabled'}
                </Badge>
              </div>

              <div>
                <Label className="text-sm font-medium text-white/55">Webhook URL</Label>
                <p className="text-sm text-white font-mono">{webhookSettings?.webhookUrl || 'Not configured'}</p>
              </div>

              <div>
                <Label className="text-sm font-medium text-white/55">Secret</Label>
                <p className="text-sm text-white">{webhookSettings?.webhookSecret ? '••••••••' : 'Not set'}</p>
              </div>

              <div>
                <Label className="text-sm font-medium text-white/55 mb-2 block">Enabled Events</Label>
                <div className="flex flex-wrap gap-2">
                  {webhookSettings?.webhookEvents?.newLead && (
                    <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-400/30">New Lead</Badge>
                  )}
                  {webhookSettings?.webhookEvents?.newAppointment && (
                    <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-400/30">Appointment</Badge>
                  )}
                  {webhookSettings?.webhookEvents?.leadStatusChange && (
                    <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-400/30">Lead Update</Badge>
                  )}
                  {webhookSettings?.webhookEvents?.chatSessionStart && (
                    <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-400/30">Session Start</Badge>
                  )}
                  {webhookSettings?.webhookEvents?.chatSessionEnd && (
                    <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-400/30">Session End</Badge>
                  )}
                  {!Object.values(webhookSettings?.webhookEvents || {}).some(Boolean) && (
                    <span className="text-sm text-white/40">No events enabled</span>
                  )}
                </div>
              </div>
            </>
          )}

          <div className="flex items-center gap-3 pt-4 border-t border-white/10">
            {editingWebhooks ? (
              <>
                <Button
                  onClick={handleSaveWebhooks}
                  disabled={updateWebhooksMutation.isPending}
                  className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white"
                  data-testid="button-save-webhooks"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {updateWebhooksMutation.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setEditingWebhooks(false)}
                  className="border-white/10 text-white/85 hover:bg-white/10"
                  data-testid="button-cancel-webhooks"
                >
                  Cancel
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={startEditingWebhooks}
                  className="border-white/10 text-white/85 hover:bg-white/10"
                  data-testid="button-edit-webhooks"
                >
                  Configure
                </Button>
                {webhookSettings?.webhookUrl && webhookSettings?.webhookEnabled && (
                  <Button
                    variant="outline"
                    onClick={handleTestWebhook}
                    disabled={testingWebhook}
                    className="border-white/10 text-white/85 hover:bg-white/10"
                    data-testid="button-test-webhook"
                  >
                    <TestTube2 className={`h-4 w-4 mr-2 ${testingWebhook ? 'animate-pulse' : ''}`} />
                    {testingWebhook ? 'Testing...' : 'Send Test'}
                  </Button>
                )}
              </>
            )}
          </div>
        </GlassCardContent>
      </GlassCard>

      <GlassCard data-testid="card-webhook-docs">
        <GlassCardHeader>
          <GlassCardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-cyan-400" />
            Webhook Documentation
          </GlassCardTitle>
        </GlassCardHeader>
        <GlassCardContent>
          <div className="space-y-4 text-sm">
            <div>
              <h4 className="font-medium text-white mb-2">Payload Format</h4>
              <pre className="p-3 bg-black/40 rounded-lg text-xs text-white/80 overflow-x-auto">
{`{
  "event": "lead.created",
  "timestamp": "2024-01-15T10:30:00Z",
  "clientId": "your_client_id",
  "data": {
    "leadId": "abc123",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "(555) 123-4567",
    "source": "chat",
    "status": "new"
  }
}`}
              </pre>
            </div>

            <div>
              <h4 className="font-medium text-white mb-2">Verifying Signatures</h4>
              <p className="text-white/60 mb-2">
                All webhooks include an <code className="text-cyan-400">X-Webhook-Signature</code> header with format <code className="text-cyan-400">sha256=HASH</code>.
                Verify by computing HMAC-SHA256 of the raw request body using your webhook secret.
              </p>
            </div>

            <div>
              <h4 className="font-medium text-white mb-2">Event Types</h4>
              <ul className="space-y-1 text-white/60">
                <li><code className="text-cyan-400">lead.created</code> - New lead captured from chat</li>
                <li><code className="text-cyan-400">lead.updated</code> - Lead status changed</li>
                <li><code className="text-cyan-400">appointment.created</code> - New appointment requested</li>
                <li><code className="text-cyan-400">session.started</code> - Chat session began</li>
                <li><code className="text-cyan-400">session.ended</code> - Chat session ended</li>
              </ul>
            </div>
          </div>
        </GlassCardContent>
      </GlassCard>
    </div>
  );

  const renderSettingsSection = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-white">Settings</h2>
        <p className="text-sm text-white/55">View your business information — contact us for changes</p>
      </div>
      
      <GlassCard data-testid="card-settings">
        <GlassCardHeader>
          <GlassCardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-cyan-400" />
            Business Information
          </GlassCardTitle>
          <GlassCardDescription>
            Update your contact details and business hours
          </GlassCardDescription>
        </GlassCardHeader>
        <GlassCardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-white/55">Business Name</Label>
                <p className="text-lg font-medium text-white" data-testid="text-settings-business-name">
                  {profile?.businessInfo?.name || stats?.businessName || "Not configured"}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium text-white/55">Business Type</Label>
                <p className="text-lg text-white" data-testid="text-settings-business-type">
                  {profile?.businessInfo?.type || stats?.businessType || "Not configured"}
                </p>
              </div>
              
              {editingSettings ? (
                <div className="space-y-3">
                  <div>
                    <Label className="text-sm font-medium text-white/55">Phone</Label>
                    <Input
                      value={settingsForm.phone}
                      onChange={(e) => setSettingsForm(prev => ({ ...prev, phone: e.target.value }))}
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
                      placeholder="(555) 123-4567"
                      data-testid="input-settings-phone"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <Label className="text-sm font-medium text-white/55">Phone</Label>
                  <p className="text-lg flex items-center gap-2 text-white">
                    <Phone className="h-4 w-4 text-white/55" />
                    {profile?.businessInfo?.phone || "Not configured"}
                  </p>
                </div>
              )}
            </div>
            
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-white/55">Hours</Label>
                <p className="text-lg flex items-center gap-2 text-white">
                  <Clock className="h-4 w-4 text-white/55" />
                  {formatHoursValue(profile?.businessInfo?.hours)}
                </p>
                <p className="text-xs text-white/40 mt-1">Contact us to update hours</p>
              </div>
              {editingSettings ? (
                <div>
                  <Label className="text-sm font-medium text-white/55">Location</Label>
                  <Input
                    value={settingsForm.location}
                    onChange={(e) => setSettingsForm(prev => ({ ...prev, location: e.target.value }))}
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
                    placeholder="123 Main St, City, State"
                    data-testid="input-settings-location"
                  />
                </div>
              ) : (
                <div>
                  <Label className="text-sm font-medium text-white/55">Location</Label>
                  <p className="text-lg flex items-center gap-2 text-white">
                    <MapPin className="h-4 w-4 text-white/55" />
                    {profile?.businessInfo?.location || "Not configured"}
                  </p>
                </div>
              )}
              <div>
                <Label className="text-sm font-medium text-white/55">Bot ID</Label>
                <p className="text-sm font-mono text-white/55" data-testid="text-settings-bot-id">
                  {profile?.botId || stats?.botId || "N/A"}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 flex items-center gap-3">
            {editingSettings ? (
              <>
                <Button
                  onClick={handleSaveSettings}
                  disabled={updateSettingsMutation.isPending}
                  className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white"
                  data-testid="button-save-settings"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {updateSettingsMutation.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setEditingSettings(false)}
                  className="border-white/10 text-white/85 hover:bg-white/10"
                  data-testid="button-cancel-settings"
                >
                  Cancel
                </Button>
              </>
            ) : (
              <Button
                variant="outline"
                onClick={startEditingSettings}
                className="border-white/10 text-white/85 hover:bg-white/10"
                data-testid="button-edit-settings"
              >
                Edit Settings
              </Button>
            )}
          </div>

          <div className="mt-6 p-4 bg-white/5 border border-white/10 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-white/55 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-white">Need changes to your AI assistant?</p>
                <p className="text-sm text-white/55">
                  Contact our team and we'll update your bot's personality, FAQs, or settings for you.
                </p>
              </div>
            </div>
          </div>
        </GlassCardContent>
      </GlassCard>
    </div>
  );

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return renderDashboardSection();
      case 'analytics':
        return renderAnalyticsSection();
      case 'leads':
        return renderLeadsSection();
      case 'inbox':
        return renderInboxSection();
      case 'appointments':
        return renderAppointmentsSection();
      case 'widget':
        return renderWidgetSection();
      case 'integrations':
        return renderIntegrationsSection();
      case 'settings':
        return renderSettingsSection();
      default:
        return renderDashboardSection();
    }
  };

  return (
    <SidebarProvider style={sidebarStyle as React.CSSProperties}>
      <div className="flex h-screen w-full bg-[#0B0E13]">
        <Sidebar className="border-r border-white/10 bg-[#0d1117]">
          <SidebarHeader className="p-4 border-b border-white/10 bg-white/5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                <Bot className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-sm font-semibold text-white truncate" data-testid="text-sidebar-business-name">
                  {businessName}
                </h2>
                <Badge className="bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-400 border border-cyan-400/30 text-xs" data-testid="badge-sidebar-business-type">
                  {businessType}
                </Badge>
              </div>
            </div>
          </SidebarHeader>

          <SidebarContent className="p-3 bg-[#0d1117]">
            <SidebarGroup>
              <SidebarGroupLabel className="text-white/50 text-xs font-semibold uppercase tracking-wider px-3 mb-3">
                Navigation
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="space-y-1">
                  {SIDEBAR_ITEMS.map((item) => {
                    const badgeCount = item.id === 'leads' ? newLeadsCount : 
                                       item.id === 'inbox' ? unreadInboxCount : 0;
                    return (
                      <SidebarMenuItem key={item.id}>
                        <SidebarMenuButton
                          isActive={activeSection === item.id}
                          onClick={() => setActiveSection(item.id)}
                          className={`
                            transition-all duration-200 rounded-lg
                            ${activeSection === item.id 
                              ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-400/40 shadow-sm shadow-cyan-500/10' 
                              : 'text-white/70 hover:text-white hover:bg-white/10 border border-transparent'
                            }
                          `}
                          data-testid={`sidebar-item-${item.id}`}
                        >
                          <item.icon className={`h-4 w-4 ${activeSection === item.id ? 'text-cyan-400' : ''}`} />
                          <span className="font-medium flex-1">{item.label}</span>
                          {badgeCount > 0 && (
                            <Badge 
                              className="bg-cyan-500/20 text-cyan-400 border border-cyan-400/30 text-xs px-1.5 py-0 min-w-[20px] h-5 flex items-center justify-center"
                              data-testid={`badge-${item.id}-count`}
                            >
                              {badgeCount > 99 ? '99+' : badgeCount}
                            </Badge>
                          )}
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className="p-3 border-t border-white/10 bg-[#0d1117]">
            <Button
              variant="ghost"
              className="w-full justify-start text-white/60 hover:text-white hover:bg-white/10"
              onClick={() => window.open('mailto:support@treasurecoastai.com', '_blank')}
              data-testid="button-get-help"
            >
              <Headphones className="h-4 w-4 mr-2" />
              Get Help
            </Button>
            <div className="px-3 py-2 text-xs text-white/40">
              <div className="flex items-center gap-1">
                <HelpCircle className="h-3 w-3" />
                <span>Need assistance? Contact support.</span>
              </div>
            </div>
          </SidebarFooter>
        </Sidebar>

        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="h-14 border-b border-white/10 bg-white/5 backdrop-blur-md flex items-center justify-between px-6 flex-shrink-0">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="text-white/70 hover:text-white hover:bg-white/10" data-testid="button-sidebar-toggle" />
              <h1 className="text-lg font-semibold text-white" data-testid="text-dashboard-title">
                {SIDEBAR_ITEMS.find(item => item.id === activeSection)?.label || 'Dashboard'}
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetchStats()}
                className="border-white/10 text-white/85 hover:bg-white/10 hover:text-white"
                data-testid="button-refresh-stats"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              {botId && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setLocation(`/demo/${botId}`)}
                  className="border-white/10 text-white/85 hover:bg-white/10 hover:text-white"
                  data-testid="button-preview-bot"
                >
                  <Bot className="h-4 w-4 mr-2" />
                  Preview Bot
                </Button>
              )}
              <Separator orientation="vertical" className="h-6 bg-white/10" />
              <span className="text-sm text-white/55" data-testid="text-username">
                {profile?.user?.username || 'User'}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                className="text-white/70 hover:text-white hover:bg-white/10"
                data-testid="button-logout"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </header>

          <main className="flex-1 overflow-auto p-6">
            {renderContent()}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

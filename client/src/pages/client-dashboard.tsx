import { useState } from "react";
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

type SectionType = 'dashboard' | 'analytics' | 'leads' | 'inbox' | 'appointments' | 'widget' | 'settings';

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
  { id: 'settings' as SectionType, label: 'Settings', icon: Settings },
];

export default function ClientDashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [activeSection, setActiveSection] = useState<SectionType>('dashboard');
  const [dateRange, setDateRange] = useState<number>(14);
  const [copied, setCopied] = useState(false);
  const [editingSettings, setEditingSettings] = useState(false);
  const [settingsForm, setSettingsForm] = useState({
    phone: '',
    hours: '',
    location: ''
  });

  const { data: profile, isLoading: profileLoading } = useQuery<ClientProfile>({
    queryKey: ["/api/client/me"],
  });

  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useQuery<ClientStats>({
    queryKey: ["/api/client/stats"],
  });

  const { data: appointmentsData, isLoading: appointmentsLoading } = useQuery<{
    clientId: string;
    appointments: Appointment[];
    total: number;
  }>({
    queryKey: ["/api/client/appointments"],
  });

  const { data: conversationsData, isLoading: conversationsLoading } = useQuery<{
    clientId: string;
    botId: string;
    fileLogs: any[];
    dbConversations: Conversation[];
  }>({
    queryKey: ["/api/client/conversations"],
  });

  const { data: analyticsData, isLoading: analyticsLoading } = useQuery<AnalyticsSummary>({
    queryKey: ["/api/client/analytics/summary"],
  });

  const { data: trendsData, isLoading: trendsLoading } = useQuery<{
    clientId: string;
    botId: string;
    days: number;
    trends: DailyTrend[];
  }>({
    queryKey: ["/api/client/analytics/trends", { days: dateRange }],
  });

  const { data: sessionsData, isLoading: sessionsLoading } = useQuery<{
    clientId: string;
    botId: string;
    sessions: ChatSession[];
    total: number;
  }>({
    queryKey: ["/api/client/analytics/sessions"],
  });

  const { data: usageData, isLoading: usageLoading } = useQuery<UsageSummary>({
    queryKey: ["/api/client/usage"],
  });

  const { data: leadsData } = useQuery<{
    clientId: string;
    leads: any[];
    total: number;
  }>({
    queryKey: ["/api/client/leads"],
  });

  const { data: inboxStatesData } = useQuery<{
    clientId: string;
    states: { sessionId: string; isRead: boolean; status: string }[];
  }>({
    queryKey: ["/api/client/inbox/states"],
  });

  const newLeadsCount = leadsData?.leads?.filter((lead: any) => lead.status === 'new').length || 0;
  const unreadInboxCount = inboxStatesData?.states?.filter(state => !state.isRead).length || 0;

  const updateSettingsMutation = useMutation({
    mutationFn: async (data: { phone?: string; hours?: string; location?: string }) => {
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
      hours: profile?.businessInfo?.hours || '',
      location: profile?.businessInfo?.location || ''
    });
    setEditingSettings(true);
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
                    Need more capacity? Contact your platform administrator to upgrade your plan.
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
          <p className="text-sm text-white/55">Detailed insights into your chatbot performance</p>
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
            Individual conversation sessions with your AI assistant
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
        <p className="text-sm text-white/55">Manage your captured leads from chatbot conversations</p>
      </div>
      
      <GlassCard data-testid="card-leads-navigation">
        <GlassCardHeader>
          <GlassCardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-cyan-400" />
            Lead Management
          </GlassCardTitle>
          <GlassCardDescription>
            View and manage leads captured by your AI assistant
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
        <p className="text-sm text-white/55">View and manage messages from your chatbot</p>
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
            All appointment requests from chatbot visitors
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
        <p className="text-sm text-white/55">Embed your AI chatbot on your website</p>
      </div>
      
      <GlassCard data-testid="card-widget-code">
        <GlassCardHeader>
          <GlassCardTitle className="flex items-center gap-2">
            <Code className="h-5 w-5 text-cyan-400" />
            Embed Code
          </GlassCardTitle>
          <GlassCardDescription>
            Copy and paste this code into your website to add the chatbot widget
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

  const renderSettingsSection = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-white">Settings</h2>
        <p className="text-sm text-white/55">Manage your business information</p>
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
              {editingSettings ? (
                <>
                  <div>
                    <Label className="text-sm font-medium text-white/55">Hours</Label>
                    <Input
                      value={settingsForm.hours}
                      onChange={(e) => setSettingsForm(prev => ({ ...prev, hours: e.target.value }))}
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
                      placeholder="Mon-Fri 9AM-5PM"
                      data-testid="input-settings-hours"
                    />
                  </div>
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
                </>
              ) : (
                <>
                  <div>
                    <Label className="text-sm font-medium text-white/55">Hours</Label>
                    <p className="text-lg flex items-center gap-2 text-white">
                      <Clock className="h-4 w-4 text-white/55" />
                      {profile?.businessInfo?.hours || "Not configured"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-white/55">Location</Label>
                    <p className="text-lg flex items-center gap-2 text-white">
                      <MapPin className="h-4 w-4 text-white/55" />
                      {profile?.businessInfo?.location || "Not configured"}
                    </p>
                  </div>
                </>
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
                <p className="text-sm font-medium text-white">Need to update other information?</p>
                <p className="text-sm text-white/55">
                  Contact your platform administrator to update your business name, type, or chatbot configuration.
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

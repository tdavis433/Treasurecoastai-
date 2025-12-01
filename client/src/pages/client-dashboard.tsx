import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { GlassCard, GlassCardHeader, GlassCardTitle, GlassCardDescription, GlassCardContent } from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Building2,
  Phone,
  MapPin,
  RefreshCw,
  Bot,
  LayoutDashboard,
  Mail,
  Code,
  Settings,
  Copy,
  Check,
  LogOut,
  Headphones,
  Power,
  Sparkles,
  ArrowUpRight,
  Eye,
  Search,
} from "lucide-react";
import { format } from "date-fns";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

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

type SectionType = 'overview' | 'conversations' | 'leads' | 'bookings' | 'settings';

interface AuthUser {
  id: string;
  username: string;
  role: 'super_admin' | 'client_admin';
}

const SIDEBAR_ITEMS = [
  { id: 'overview' as SectionType, label: 'Overview', icon: LayoutDashboard, description: 'Your dashboard' },
  { id: 'conversations' as SectionType, label: 'Conversations', icon: MessageSquare, description: 'Chat history' },
  { id: 'leads' as SectionType, label: 'Leads', icon: Users, description: 'Captured contacts' },
  { id: 'bookings' as SectionType, label: 'Bookings', icon: Calendar, description: 'Appointments' },
  { id: 'settings' as SectionType, label: 'Settings', icon: Settings, description: 'Your preferences' },
];

export default function ClientDashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [activeSection, setActiveSection] = useState<SectionType>('overview');
  const [copied, setCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

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

  const { data: sessionsData, isLoading: sessionsLoading } = useQuery<{
    clientId: string;
    botId: string;
    sessions: ChatSession[];
    total: number;
  }>({
    queryKey: ["/api/client/analytics/sessions"],
    enabled: !!currentUser,
  });

  const { data: leadsData, isLoading: leadsLoading } = useQuery<{
    clientId: string;
    leads: any[];
    total: number;
  }>({
    queryKey: ["/api/client/leads"],
    enabled: !!currentUser,
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

  const handleLogout = async () => {
    try {
      const response = await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
      if (response.ok) {
        queryClient.clear();
        setLocation("/login");
      } else {
        toast({ title: "Error", description: "Failed to logout.", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Network error during logout.", variant: "destructive" });
    }
  };

  if (authLoading || !currentUser) {
    return (
      <div className="min-h-screen bg-[#0B0E13] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <p className="text-white/60">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-[#0B0E13] text-white p-6 space-y-6">
        <div className="h-10 w-64 bg-white/10 rounded-lg animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 bg-white/10 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const businessName = profile?.businessInfo?.name || stats?.businessName || "Your Business";
  const businessType = profile?.businessInfo?.type || stats?.businessType || "business";
  const botId = profile?.botId || stats?.botId || '';

  const totalConversations = stats?.dbStats?.totalConversations || stats?.logStats?.totalConversations || 0;
  const weeklyConversations = stats?.dbStats?.weeklyConversations || 0;
  const totalLeads = leadsData?.total || 0;
  const newLeads = leadsData?.leads?.filter((l: any) => l.status === 'new').length || 0;
  const pendingBookings = stats?.dbStats?.pendingAppointments || 0;
  const completedBookings = stats?.dbStats?.completedAppointments || 0;

  const sidebarStyle = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  const renderOverviewSection = () => (
    <div className="space-y-6">
      <div className="p-6 rounded-2xl bg-gradient-to-br from-cyan-500/10 via-blue-500/10 to-purple-500/10 border border-white/10">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2" data-testid="text-welcome">
              Welcome back! <Sparkles className="inline h-5 w-5 text-cyan-400" />
            </h2>
            <p className="text-white/70 max-w-md">
              Here's how your AI assistant has been helping your business. Everything is running smoothly.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/20 border border-green-400/40">
              <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-sm font-medium text-green-400">
                Assistant Active
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <GlassCard className="hover-elevate cursor-pointer" onClick={() => setActiveSection('conversations')} data-testid="card-stat-conversations">
          <GlassCardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="h-12 w-12 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                <MessageSquare className="h-6 w-6 text-cyan-400" />
              </div>
              <ArrowUpRight className="h-4 w-4 text-white/40" />
            </div>
            <div className="text-3xl font-bold text-white mb-1">{totalConversations}</div>
            <p className="text-sm text-white/60">Total Conversations</p>
            <p className="text-xs text-cyan-400 mt-2">+{weeklyConversations} this week</p>
          </GlassCardContent>
        </GlassCard>

        <GlassCard className="hover-elevate cursor-pointer" onClick={() => setActiveSection('leads')} data-testid="card-stat-leads">
          <GlassCardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="h-12 w-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                <Users className="h-6 w-6 text-green-400" />
              </div>
              {newLeads > 0 && (
                <Badge className="bg-green-500/20 text-green-400 border-green-400/40">{newLeads} new</Badge>
              )}
            </div>
            <div className="text-3xl font-bold text-white mb-1">{totalLeads}</div>
            <p className="text-sm text-white/60">Leads Captured</p>
            <p className="text-xs text-green-400 mt-2">People who shared their info</p>
          </GlassCardContent>
        </GlassCard>

        <GlassCard className="hover-elevate cursor-pointer" onClick={() => setActiveSection('bookings')} data-testid="card-stat-bookings">
          <GlassCardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="h-12 w-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                <Calendar className="h-6 w-6 text-purple-400" />
              </div>
              {pendingBookings > 0 && (
                <Badge className="bg-amber-500/20 text-amber-400 border-amber-400/40">{pendingBookings} pending</Badge>
              )}
            </div>
            <div className="text-3xl font-bold text-white mb-1">{pendingBookings + completedBookings}</div>
            <p className="text-sm text-white/60">Booking Requests</p>
            <p className="text-xs text-purple-400 mt-2">{completedBookings} confirmed</p>
          </GlassCardContent>
        </GlassCard>

        <GlassCard data-testid="card-stat-activity">
          <GlassCardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="h-12 w-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-blue-400" />
              </div>
            </div>
            <div className="text-3xl font-bold text-white mb-1">{weeklyConversations}</div>
            <p className="text-sm text-white/60">This Week</p>
            <p className="text-xs text-blue-400 mt-2">New conversations</p>
          </GlassCardContent>
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GlassCard data-testid="card-recent-conversations">
          <GlassCardHeader>
            <GlassCardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-cyan-400" />
              Recent Conversations
            </GlassCardTitle>
            <GlassCardDescription>
              Latest chats your assistant has handled
            </GlassCardDescription>
          </GlassCardHeader>
          <GlassCardContent>
            {sessionsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-16 bg-white/10 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : sessionsData?.sessions && sessionsData.sessions.length > 0 ? (
              <div className="space-y-3">
                {sessionsData.sessions.slice(0, 4).map((session) => (
                  <div
                    key={session.id}
                    className="p-4 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                    data-testid={`conversation-item-${session.id}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-cyan-500/20 flex items-center justify-center">
                          <MessageSquare className="h-4 w-4 text-cyan-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">
                            Visitor Chat
                          </p>
                          <p className="text-xs text-white/50">
                            {session.userMessageCount + session.botMessageCount} messages
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-white/50">
                          {format(new Date(session.startedAt), "MMM d")}
                        </p>
                        {session.appointmentRequested && (
                          <Badge className="bg-purple-500/20 text-purple-400 border-purple-400/40 text-xs mt-1">
                            Booking
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                <Button
                  variant="ghost"
                  className="w-full text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10"
                  onClick={() => setActiveSection('conversations')}
                  data-testid="button-view-all-conversations"
                >
                  View All Conversations
                  <ArrowUpRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            ) : (
              <div className="text-center py-8 text-white/40">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="font-medium">No conversations yet</p>
                <p className="text-sm">Chats will appear here when visitors message your assistant</p>
              </div>
            )}
          </GlassCardContent>
        </GlassCard>

        <GlassCard data-testid="card-recent-leads">
          <GlassCardHeader>
            <GlassCardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-green-400" />
              Recent Leads
            </GlassCardTitle>
            <GlassCardDescription>
              People who shared their contact info
            </GlassCardDescription>
          </GlassCardHeader>
          <GlassCardContent>
            {leadsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-16 bg-white/10 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : leadsData?.leads && leadsData.leads.length > 0 ? (
              <div className="space-y-3">
                {leadsData.leads.slice(0, 4).map((lead: any, idx: number) => (
                  <div
                    key={lead.id || idx}
                    className="p-4 rounded-lg bg-white/5 border border-white/10"
                    data-testid={`lead-item-${lead.id || idx}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-green-500/20 flex items-center justify-center">
                          <span className="text-sm font-medium text-green-400">
                            {(lead.name || 'V')[0].toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">
                            {lead.name || 'Visitor'}
                          </p>
                          <p className="text-xs text-white/50">
                            {lead.email || lead.phone || 'No contact info'}
                          </p>
                        </div>
                      </div>
                      <Badge className={`text-xs ${lead.status === 'new' ? 'bg-green-500/20 text-green-400 border-green-400/40' : 'bg-white/10 text-white/60 border-white/20'}`}>
                        {lead.status || 'new'}
                      </Badge>
                    </div>
                  </div>
                ))}
                <Button
                  variant="ghost"
                  className="w-full text-green-400 hover:text-green-300 hover:bg-green-500/10"
                  onClick={() => setActiveSection('leads')}
                  data-testid="button-view-all-leads"
                >
                  View All Leads
                  <ArrowUpRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            ) : (
              <div className="text-center py-8 text-white/40">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="font-medium">No leads yet</p>
                <p className="text-sm">When visitors share their info, they'll appear here</p>
              </div>
            )}
          </GlassCardContent>
        </GlassCard>
      </div>

      <GlassCard data-testid="card-quick-actions">
        <GlassCardHeader>
          <GlassCardTitle>Quick Actions</GlassCardTitle>
          <GlassCardDescription>Common tasks you might need</GlassCardDescription>
        </GlassCardHeader>
        <GlassCardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col items-center gap-2 border-white/10 hover:bg-white/10 text-white"
              onClick={() => setLocation(`/demo/${botId}`)}
              data-testid="button-preview-assistant"
            >
              <Bot className="h-5 w-5 text-cyan-400" />
              <span>Preview Assistant</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col items-center gap-2 border-white/10 hover:bg-white/10 text-white"
              onClick={handleCopyWidgetCode}
              data-testid="button-copy-widget"
            >
              <Code className="h-5 w-5 text-purple-400" />
              <span>{copied ? 'Copied!' : 'Copy Widget Code'}</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col items-center gap-2 border-white/10 hover:bg-white/10 text-white"
              onClick={() => setActiveSection('leads')}
              data-testid="button-view-leads-action"
            >
              <Users className="h-5 w-5 text-green-400" />
              <span>View All Leads</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col items-center gap-2 border-white/10 hover:bg-white/10 text-white"
              onClick={() => window.open('mailto:support@treasurecoastai.com', '_blank')}
              data-testid="button-contact-support"
            >
              <Headphones className="h-5 w-5 text-amber-400" />
              <span>Contact Support</span>
            </Button>
          </div>
        </GlassCardContent>
      </GlassCard>
    </div>
  );

  const renderConversationsSection = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Conversations</h2>
        <p className="text-white/60">See what your AI assistant has been discussing with visitors</p>
      </div>

      <GlassCard data-testid="card-conversations-list">
        <GlassCardHeader>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <GlassCardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-cyan-400" />
              All Conversations
            </GlassCardTitle>
            <div className="flex items-center gap-2">
              <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-400/40">
                {sessionsData?.total || 0} total
              </Badge>
            </div>
          </div>
        </GlassCardHeader>
        <GlassCardContent>
          {sessionsLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-20 bg-white/10 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : sessionsData?.sessions && sessionsData.sessions.length > 0 ? (
            <ScrollArea className="h-[500px]">
              <div className="space-y-3">
                {sessionsData.sessions.map((session) => (
                  <div
                    key={session.id}
                    className="p-4 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer"
                    data-testid={`conversation-${session.id}`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-cyan-500/30 to-blue-500/30 flex items-center justify-center mt-1">
                          <MessageSquare className="h-5 w-5 text-cyan-400" />
                        </div>
                        <div>
                          <p className="text-white font-medium">Visitor Conversation</p>
                          <p className="text-sm text-white/50 mt-1">
                            {session.userMessageCount} visitor messages, {session.botMessageCount} assistant replies
                          </p>
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            {session.appointmentRequested && (
                              <Badge className="bg-purple-500/20 text-purple-400 border-purple-400/40 text-xs">
                                <Calendar className="h-3 w-3 mr-1" />
                                Requested Booking
                              </Badge>
                            )}
                            {session.topics && session.topics.slice(0, 2).map((topic, idx) => (
                              <Badge key={idx} className="bg-white/10 text-white/60 border-white/20 text-xs">
                                {topic}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs text-white/50">
                          {format(new Date(session.startedAt), "MMM d, yyyy")}
                        </p>
                        <p className="text-xs text-white/40 mt-1">
                          {format(new Date(session.startedAt), "h:mm a")}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <div className="text-center py-12 text-white/40">
              <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No conversations yet</p>
              <p className="text-sm mt-2">When visitors chat with your assistant, conversations will appear here</p>
            </div>
          )}
        </GlassCardContent>
      </GlassCard>
    </div>
  );

  const renderLeadsSection = () => {
    const filteredLeads = leadsData?.leads?.filter((lead: any) => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return (
        lead.name?.toLowerCase().includes(query) ||
        lead.email?.toLowerCase().includes(query) ||
        lead.phone?.includes(query)
      );
    }) || [];

    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Leads</h2>
          <p className="text-white/60">People who shared their contact information with your assistant</p>
        </div>

        <GlassCard data-testid="card-leads-list">
          <GlassCardHeader>
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <GlassCardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-green-400" />
                All Leads
              </GlassCardTitle>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                  <Input
                    placeholder="Search by name, email, or phone..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 w-64 bg-white/5 border-white/10 text-white placeholder:text-white/40"
                    data-testid="input-search-leads"
                  />
                </div>
                <Badge className="bg-green-500/20 text-green-400 border-green-400/40">
                  {leadsData?.total || 0} total
                </Badge>
              </div>
            </div>
          </GlassCardHeader>
          <GlassCardContent>
            {leadsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="h-20 bg-white/10 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : filteredLeads.length > 0 ? (
              <ScrollArea className="h-[500px]">
                <div className="space-y-3">
                  {filteredLeads.map((lead: any, idx: number) => (
                    <div
                      key={lead.id || idx}
                      className="p-4 rounded-lg bg-white/5 border border-white/10"
                      data-testid={`lead-row-${lead.id || idx}`}
                    >
                      <div className="flex items-center justify-between gap-4 flex-wrap">
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-green-500/30 to-emerald-500/30 flex items-center justify-center">
                            <span className="text-lg font-medium text-green-400">
                              {(lead.name || 'V')[0].toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="text-white font-medium">{lead.name || 'Visitor'}</p>
                            <div className="flex items-center gap-4 mt-1 text-sm text-white/50">
                              {lead.email && (
                                <span className="flex items-center gap-1">
                                  <Mail className="h-3 w-3" />
                                  {lead.email}
                                </span>
                              )}
                              {lead.phone && (
                                <span className="flex items-center gap-1">
                                  <Phone className="h-3 w-3" />
                                  {lead.phone}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge className={`${lead.status === 'new' ? 'bg-green-500/20 text-green-400 border-green-400/40' : lead.status === 'contacted' ? 'bg-blue-500/20 text-blue-400 border-blue-400/40' : 'bg-white/10 text-white/60 border-white/20'}`}>
                            {lead.status || 'new'}
                          </Badge>
                          <span className="text-xs text-white/40">
                            {lead.createdAt ? format(new Date(lead.createdAt), "MMM d, yyyy") : '—'}
                          </span>
                        </div>
                      </div>
                      {lead.notes && (
                        <p className="text-sm text-white/50 mt-3 pl-16">{lead.notes}</p>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="text-center py-12 text-white/40">
                <Users className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">
                  {searchQuery ? 'No leads match your search' : 'No leads captured yet'}
                </p>
                <p className="text-sm mt-2">
                  {searchQuery ? 'Try a different search term' : 'When visitors share their contact info, they will appear here'}
                </p>
              </div>
            )}
          </GlassCardContent>
        </GlassCard>
      </div>
    );
  };

  const renderBookingsSection = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Bookings</h2>
        <p className="text-white/60">Appointment requests your assistant has collected from visitors</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <GlassCard data-testid="card-pending-bookings">
          <GlassCardContent className="pt-6 text-center">
            <div className="h-12 w-12 rounded-xl bg-amber-500/20 flex items-center justify-center mx-auto mb-3">
              <Clock className="h-6 w-6 text-amber-400" />
            </div>
            <div className="text-3xl font-bold text-amber-400">{pendingBookings}</div>
            <p className="text-sm text-white/60 mt-1">Pending</p>
          </GlassCardContent>
        </GlassCard>
        <GlassCard data-testid="card-confirmed-bookings">
          <GlassCardContent className="pt-6 text-center">
            <div className="h-12 w-12 rounded-xl bg-green-500/20 flex items-center justify-center mx-auto mb-3">
              <CheckCircle className="h-6 w-6 text-green-400" />
            </div>
            <div className="text-3xl font-bold text-green-400">{completedBookings}</div>
            <p className="text-sm text-white/60 mt-1">Confirmed</p>
          </GlassCardContent>
        </GlassCard>
        <GlassCard data-testid="card-total-bookings">
          <GlassCardContent className="pt-6 text-center">
            <div className="h-12 w-12 rounded-xl bg-purple-500/20 flex items-center justify-center mx-auto mb-3">
              <Calendar className="h-6 w-6 text-purple-400" />
            </div>
            <div className="text-3xl font-bold text-white">{pendingBookings + completedBookings}</div>
            <p className="text-sm text-white/60 mt-1">Total Requests</p>
          </GlassCardContent>
        </GlassCard>
      </div>

      <GlassCard data-testid="card-bookings-list">
        <GlassCardHeader>
          <GlassCardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-purple-400" />
            All Booking Requests
          </GlassCardTitle>
        </GlassCardHeader>
        <GlassCardContent>
          {appointmentsLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-24 bg-white/10 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : (appointmentsData?.appointments?.length || 0) > 0 ? (
            <ScrollArea className="h-[400px]">
              <div className="space-y-4">
                {appointmentsData?.appointments?.map((apt) => (
                  <div
                    key={apt.id}
                    className="p-4 rounded-lg bg-white/5 border border-white/10"
                    data-testid={`booking-${apt.id}`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-purple-500/30 to-pink-500/30 flex items-center justify-center">
                          <Calendar className="h-5 w-5 text-purple-400" />
                        </div>
                        <div>
                          <p className="text-white font-medium">{apt.name}</p>
                          <div className="flex items-center gap-4 mt-1 text-sm text-white/50">
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {apt.contact}
                            </span>
                            {apt.email && (
                              <span className="flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {apt.email}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge className="bg-white/10 text-white/70 border-white/20 text-xs">
                              {apt.appointmentType}
                            </Badge>
                            <span className="text-xs text-white/50">
                              Preferred: {apt.preferredTime}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className={`${
                          apt.status === 'confirmed' || apt.status === 'completed'
                            ? 'bg-green-500/20 text-green-400 border-green-400/40'
                            : apt.status === 'cancelled'
                            ? 'bg-red-500/20 text-red-400 border-red-400/40'
                            : 'bg-amber-500/20 text-amber-400 border-amber-400/40'
                        }`}>
                          {apt.status}
                        </Badge>
                        <p className="text-xs text-white/40 mt-2">
                          {format(new Date(apt.createdAt), "MMM d, yyyy")}
                        </p>
                      </div>
                    </div>
                    {apt.notes && (
                      <p className="text-sm text-white/50 mt-3 pl-16">{apt.notes}</p>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <div className="text-center py-12 text-white/40">
              <Calendar className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No booking requests yet</p>
              <p className="text-sm mt-2">When visitors request appointments, they will appear here</p>
            </div>
          )}
        </GlassCardContent>
      </GlassCard>
    </div>
  );

  const renderSettingsSection = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Settings</h2>
        <p className="text-white/60">View your information and get your widget code</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GlassCard data-testid="card-assistant-status">
          <GlassCardHeader>
            <GlassCardTitle className="flex items-center gap-2">
              <Power className="h-5 w-5 text-cyan-400" />
              Assistant Status
            </GlassCardTitle>
            <GlassCardDescription>
              Your AI assistant is managed by our team
            </GlassCardDescription>
          </GlassCardHeader>
          <GlassCardContent>
            <div className="flex items-center justify-between p-4 rounded-lg bg-green-500/10 border border-green-400/30">
              <div className="flex items-center gap-3">
                <div className="h-3 w-3 rounded-full bg-green-400 animate-pulse" />
                <div>
                  <p className="text-white font-medium">Assistant is Active</p>
                  <p className="text-sm text-white/50">
                    Responding to visitors on your website 24/7
                  </p>
                </div>
              </div>
              <Badge className="bg-green-500/20 text-green-400 border-green-400/40">Live</Badge>
            </div>
            <p className="text-xs text-white/40 mt-3">
              Need to pause your assistant? Contact our team.
            </p>
          </GlassCardContent>
        </GlassCard>

        <GlassCard data-testid="card-support">
          <GlassCardHeader>
            <GlassCardTitle className="flex items-center gap-2">
              <Headphones className="h-5 w-5 text-purple-400" />
              Need Changes?
            </GlassCardTitle>
            <GlassCardDescription>
              We're here to help
            </GlassCardDescription>
          </GlassCardHeader>
          <GlassCardContent>
            <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-400/30">
              <p className="text-white font-medium mb-2">Contact Our Team</p>
              <p className="text-sm text-white/60 mb-4">
                Want to update your assistant, change responses, or adjust settings? We handle everything for you.
              </p>
              <Button
                onClick={() => window.open('mailto:support@treasurecoastai.com', '_blank')}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white"
                data-testid="button-contact-team"
              >
                <Mail className="h-4 w-4 mr-2" />
                Email Support
              </Button>
            </div>
          </GlassCardContent>
        </GlassCard>
      </div>

      <GlassCard data-testid="card-business-info">
        <GlassCardHeader>
          <GlassCardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-blue-400" />
            Your Business
          </GlassCardTitle>
          <GlassCardDescription>
            Information about your business on file
          </GlassCardDescription>
        </GlassCardHeader>
        <GlassCardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-white/50">Business Name</Label>
                <p className="text-lg font-medium text-white mt-1" data-testid="text-business-name">
                  {profile?.businessInfo?.name || businessName}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium text-white/50">Business Type</Label>
                <p className="text-lg text-white mt-1 capitalize" data-testid="text-business-type">
                  {profile?.businessInfo?.type || businessType}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium text-white/50">Phone</Label>
                <p className="text-lg text-white mt-1 flex items-center gap-2" data-testid="text-phone">
                  <Phone className="h-4 w-4 text-white/50" />
                  {profile?.businessInfo?.phone || 'Not configured'}
                </p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-white/50">Location</Label>
                <p className="text-lg text-white mt-1 flex items-center gap-2" data-testid="text-location">
                  <MapPin className="h-4 w-4 text-white/50" />
                  {profile?.businessInfo?.location || 'Not configured'}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium text-white/50">Hours</Label>
                <p className="text-lg text-white mt-1 flex items-center gap-2" data-testid="text-hours">
                  <Clock className="h-4 w-4 text-white/50" />
                  {typeof profile?.businessInfo?.hours === 'string' 
                    ? profile.businessInfo.hours 
                    : 'Not configured'}
                </p>
              </div>
            </div>
          </div>
        </GlassCardContent>
      </GlassCard>

      <GlassCard data-testid="card-widget-code">
        <GlassCardHeader>
          <GlassCardTitle className="flex items-center gap-2">
            <Code className="h-5 w-5 text-cyan-400" />
            Widget Code
          </GlassCardTitle>
          <GlassCardDescription>
            Add your AI assistant to your website
          </GlassCardDescription>
        </GlassCardHeader>
        <GlassCardContent className="space-y-4">
          <div className="relative">
            <pre className="p-4 bg-black/40 border border-white/10 rounded-lg overflow-x-auto text-sm font-mono text-white/80">
{`<!-- Treasure Coast AI Widget -->
<script src="${window.location.origin}/widget/embed.js"></script>
<script>tcai('init', { botId: '${botId}' });</script>`}
            </pre>
            <Button
              onClick={handleCopyWidgetCode}
              size="sm"
              className="absolute top-2 right-2 bg-white/10 border border-white/20 text-white hover:bg-white/20"
              data-testid="button-copy-embed-code"
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
          
          <p className="text-sm text-white/50">
            Paste this code just before the closing <code className="text-cyan-400">&lt;/body&gt;</code> tag on your website. 
            Or let our team install it for you.
          </p>

          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => setLocation(`/demo/${botId}`)}
              className="border-white/10 text-white hover:bg-white/10"
              data-testid="button-preview-widget"
            >
              <Eye className="h-4 w-4 mr-2" />
              Preview Widget
            </Button>
          </div>
        </GlassCardContent>
      </GlassCard>
    </div>
  );

  const renderContent = () => {
    switch (activeSection) {
      case 'overview':
        return renderOverviewSection();
      case 'conversations':
        return renderConversationsSection();
      case 'leads':
        return renderLeadsSection();
      case 'bookings':
        return renderBookingsSection();
      case 'settings':
        return renderSettingsSection();
      default:
        return renderOverviewSection();
    }
  };

  return (
    <SidebarProvider style={sidebarStyle as React.CSSProperties}>
      <div className="flex h-screen w-full bg-[#0B0E13]">
        <Sidebar className="border-r border-white/10 bg-[#0d1117]">
          <SidebarHeader className="p-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                <Bot className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-sm font-semibold text-white truncate" data-testid="text-sidebar-business-name">
                  {businessName}
                </h2>
                <p className="text-xs text-white/50 truncate capitalize">{businessType}</p>
              </div>
            </div>
          </SidebarHeader>

          <SidebarContent className="p-3">
            <SidebarGroup>
              <SidebarGroupLabel className="text-white/40 text-xs font-medium uppercase tracking-wider px-3 mb-2">
                Menu
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="space-y-1">
                  {SIDEBAR_ITEMS.map((item) => {
                    const badgeCount = item.id === 'leads' ? newLeads : 
                                       item.id === 'bookings' ? pendingBookings : 0;
                    return (
                      <SidebarMenuItem key={item.id}>
                        <SidebarMenuButton
                          isActive={activeSection === item.id}
                          onClick={() => setActiveSection(item.id)}
                          className={`
                            transition-all duration-200 rounded-lg py-3
                            ${activeSection === item.id 
                              ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-400/30' 
                              : 'text-white/70 hover:text-white hover:bg-white/10 border border-transparent'
                            }
                          `}
                          data-testid={`sidebar-item-${item.id}`}
                        >
                          <item.icon className={`h-5 w-5 ${activeSection === item.id ? 'text-cyan-400' : ''}`} />
                          <span className="font-medium">{item.label}</span>
                          {badgeCount > 0 && (
                            <Badge 
                              className="bg-cyan-500/20 text-cyan-400 border border-cyan-400/30 text-xs ml-auto"
                              data-testid={`badge-${item.id}-count`}
                            >
                              {badgeCount}
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

          <SidebarFooter className="p-3 border-t border-white/10">
            <Button
              variant="ghost"
              className="w-full justify-start text-white/60 hover:text-white hover:bg-white/10"
              onClick={() => window.open('mailto:support@treasurecoastai.com', '_blank')}
              data-testid="button-get-help"
            >
              <Headphones className="h-4 w-4 mr-2" />
              Need Help?
            </Button>
          </SidebarFooter>
        </Sidebar>

        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="h-16 border-b border-white/10 bg-white/5 backdrop-blur-md flex items-center justify-between px-6 flex-shrink-0">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="text-white/70 hover:text-white hover:bg-white/10" data-testid="button-sidebar-toggle" />
              <div>
                <h1 className="text-lg font-semibold text-white" data-testid="text-page-title">
                  {SIDEBAR_ITEMS.find(item => item.id === activeSection)?.label || 'Dashboard'}
                </h1>
                <p className="text-xs text-white/50">
                  {SIDEBAR_ITEMS.find(item => item.id === activeSection)?.description}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => refetchStats()}
                className="text-white/60 hover:text-white hover:bg-white/10"
                data-testid="button-refresh"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Separator orientation="vertical" className="h-6 bg-white/10" />
              <span className="text-sm text-white/50" data-testid="text-username">
                {profile?.user?.username || 'User'}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                className="text-white/60 hover:text-white hover:bg-white/10"
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

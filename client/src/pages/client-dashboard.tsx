import { useState, useEffect, useMemo } from "react";
import { getWidgetBaseUrl } from "@/lib/idUtils";
import { useQuery, useMutation } from "@tanstack/react-query";
import { GlassCard, GlassCardHeader, GlassCardTitle, GlassCardDescription, GlassCardContent } from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TreasureCoastLogo } from "@/components/treasure-coast-logo";
import { PlatformHelpBot } from "@/components/platform-help-bot";
import { TenantBadge, DemoInfoBanner } from "@/components/tenant-badge";
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
  TrendingDown,
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
  ArrowDownRight,
  Eye,
  Search,
  Download,
  BarChart3,
  Bell,
  Activity,
  Filter,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  PhoneCall,
  User,
  Loader2,
  Palette,
  ExternalLink,
  Tag,
  Zap,
  Lock,
  Shield,
  KeyRound,
  Trash2,
  UserPlus,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { useLocation } from "wouter";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from "recharts";
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
    totalLeads: number;
    newLeads: number;
    avgResponseTimeMs: number;
  } | null;
  rangeStats: {
    days: number;
    conversations: number;
    leads: number;
    newLeads: number;
    bookings: number;
    pendingBookings: number;
    completedBookings: number;
    conversationsTrend: number;
    leadsTrend: number;
    bookingsTrend: number;
  } | null;
  peakHours: { hour: number; count: number }[];
  leadStatusBreakdown: {
    new: number;
    contacted: number;
    qualified: number;
    converted: number;
    lost: number;
  };
  lastActivity: string | null;
  notificationEmail: string | null;
  workspace?: {
    id: string;
    name: string;
    isDemo: boolean;
    status: string;
  } | null;
  overview?: {
    conversations7Days: number;
    conversations30Days: number;
    leads7Days: number;
    leads30Days: number;
    bookings7Days: number;
    bookings30Days: number;
    newLeads7Days: number;
    pendingBookings7Days: number;
  };
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
  scheduledAt?: string | null; // Parsed datetime from preferredTime
  appointmentType: string;
  status: string;
  createdAt: string;
  notes: string | null;
  botId?: string | null;
  sessionId?: string | null;
}

// Helper to format appointment time - prefer scheduledAt if available
function formatAppointmentTime(apt: Appointment): string {
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
  metadata?: {
    aiSummary?: string;
    userIntent?: string;
    sentiment?: 'positive' | 'neutral' | 'negative';
    keyTopics?: string[];
  };
}

interface ChatMessage {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface SessionState {
  id: string;
  sessionId: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  isRead: boolean;
}

interface MessageTrend {
  date: string;
  totalConversations: number;
  totalMessages: number;
  userMessages: number;
  botMessages: number;
  crisisEvents: number;
  appointmentRequests: number;
}

interface TopQuestion {
  topic: string;
  count: number;
  percentage: number;
}

interface BookingAnalytics {
  totalBookingIntents: number;
  totalLeadCaptured: number;
  totalLinkClicks: number;
  pendingBookings: number;
  completedBookings: number;
  funnelMode: 'handoff' | 'confirmable' | 'internal';
  dailyTrends: { date: string; intents: number; clicks: number }[];
}

type SectionType = 'overview' | 'conversations' | 'leads' | 'bookings' | 'settings';

const LEAD_STATUS_OPTIONS = [
  { value: 'new', label: 'New', color: 'bg-green-500/20 text-green-400 border-green-400/40' },
  { value: 'contacted', label: 'Contacted', color: 'bg-blue-500/20 text-blue-400 border-blue-400/40' },
  { value: 'qualified', label: 'Qualified', color: 'bg-purple-500/20 text-purple-400 border-purple-400/40' },
  { value: 'converted', label: 'Converted', color: 'bg-cyan-500/20 text-cyan-400 border-cyan-400/40' },
  { value: 'lost', label: 'Lost', color: 'bg-red-500/20 text-red-400 border-red-400/40' },
];

const BOOKING_STATUS_OPTIONS = [
  { value: 'new', label: 'New', color: 'bg-amber-500/20 text-amber-400 border-amber-400/40' },
  { value: 'contacted', label: 'Contacted', color: 'bg-blue-500/20 text-blue-400 border-blue-400/40' },
  { value: 'scheduled', label: 'Scheduled', color: 'bg-purple-500/20 text-purple-400 border-purple-400/40' },
  { value: 'completed', label: 'Completed', color: 'bg-green-500/20 text-green-400 border-green-400/40' },
  { value: 'cancelled', label: 'Cancelled', color: 'bg-red-500/20 text-red-400 border-red-400/40' },
];

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
  { id: 'settings' as SectionType, label: 'Settings', icon: Settings, description: 'View your info' },
];

export default function ClientDashboard() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const [activeSection, setActiveSection] = useState<SectionType>('overview');
  const [copied, setCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [conversationsDateRange, setConversationsDateRange] = useState<'all' | '7' | '30'>('all');
  const [statsRange, setStatsRange] = useState<'all' | '7' | '30'>('7');
  const [bookingsDateRange, setBookingsDateRange] = useState<'all' | '7' | '30'>('all');
  const [bookingsSearch, setBookingsSearch] = useState('');
  const [expandedSession, setExpandedSession] = useState<string | null>(null);
  const [sessionMessages, setSessionMessages] = useState<Record<string, ChatMessage[]>>({});
  const [sessionStates, setSessionStates] = useState<Record<string, SessionState>>({});
  const [loadingSession, setLoadingSession] = useState<string | null>(null);
  const [updatingLeadId, setUpdatingLeadId] = useState<string | null>(null);
  const [updatingBookingId, setUpdatingBookingId] = useState<string | null>(null);
  const [selectedLead, setSelectedLead] = useState<any | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [leadsPage, setLeadsPage] = useState(1);
  const LEADS_PER_PAGE = 25;
  
  // Password change state
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  
  // Team management state
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [invitePassword, setInvitePassword] = useState('');
  const [inviteRole, setInviteRole] = useState<'manager' | 'staff' | 'agent'>('staff');
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [invitingMember, setInvitingMember] = useState(false);
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);

  const { data: currentUser, isLoading: authLoading } = useQuery<AuthUser>({
    queryKey: ["/api/auth/me"],
    queryFn: async () => {
      const response = await fetch("/api/auth/me", { credentials: "include" });
      if (!response.ok) throw new Error("Not authenticated");
      return response.json();
    },
    retry: false,
  });

  // Allow both super_admin and client_admin to edit lead/booking statuses
  // Client admins are workspace owners/managers who need to manage their data
  const canEditStatus = currentUser?.role === 'super_admin' || currentUser?.role === 'client_admin';

  useEffect(() => {
    if (!authLoading && !currentUser) {
      setLocation("/login");
    }
  }, [currentUser, authLoading, setLocation]);

  // Get clientId from URL query params (for super_admin viewing specific client)
  // Re-compute when location changes (both pushState and popState)
  const urlClientId = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('clientId');
  }, [location]);

  // Redirect super_admin to super-admin panel if no clientId specified
  useEffect(() => {
    if (!authLoading && currentUser?.role === 'super_admin' && !urlClientId) {
      toast({
        title: "Client Selection Required",
        description: "Please select a client from the admin panel to view their dashboard.",
      });
      setLocation("/super-admin");
    }
  }, [authLoading, currentUser, urlClientId, setLocation, toast]);

  // Reset leads page when search query changes
  useEffect(() => {
    setLeadsPage(1);
  }, [searchQuery]);

  // Helper to append clientId to API URLs for super_admin users
  const appendClientId = (url: string) => {
    if (currentUser?.role === 'super_admin' && urlClientId) {
      const separator = url.includes('?') ? '&' : '?';
      return `${url}${separator}clientId=${urlClientId}`;
    }
    return url;
  };

  const { data: profile, isLoading: profileLoading } = useQuery<ClientProfile>({
    queryKey: ["/api/client/me", urlClientId],
    queryFn: async () => {
      const response = await fetch(appendClientId("/api/client/me"), { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch profile");
      return response.json();
    },
    enabled: !!currentUser,
  });

  const { data: stats, isLoading: statsLoading, isFetching: statsFetching, refetch: refetchStats } = useQuery<ClientStats>({
    queryKey: ["/api/client/stats", statsRange, urlClientId],
    queryFn: async () => {
      const baseUrl = statsRange !== 'all' 
        ? `/api/client/stats?days=${statsRange}` 
        : '/api/client/stats';
      const response = await fetch(appendClientId(baseUrl), { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch stats");
      return response.json();
    },
    enabled: !!currentUser,
    placeholderData: undefined,
  });

  const { data: appointmentsData, isLoading: appointmentsLoading } = useQuery<{
    clientId: string;
    appointments: Appointment[];
    total: number;
  }>({
    queryKey: ["/api/client/appointments", urlClientId],
    queryFn: async () => {
      const response = await fetch(appendClientId("/api/client/appointments"), { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch appointments");
      return response.json();
    },
    enabled: !!currentUser,
  });

  const { data: sessionsData, isLoading: sessionsLoading } = useQuery<{
    clientId: string;
    botId: string;
    sessions: ChatSession[];
    total: number;
  }>({
    queryKey: ["/api/client/analytics/sessions", urlClientId],
    queryFn: async () => {
      const response = await fetch(appendClientId("/api/client/analytics/sessions"), { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch sessions");
      return response.json();
    },
    enabled: !!currentUser,
  });

  const { data: leadsData, isLoading: leadsLoading } = useQuery<{
    clientId: string;
    leads: any[];
    total: number;
  }>({
    queryKey: ["/api/client/leads", urlClientId, leadsPage, searchQuery],
    queryFn: async () => {
      const offset = (leadsPage - 1) * LEADS_PER_PAGE;
      const searchParam = searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : '';
      const url = appendClientId(`/api/client/leads?limit=${LEADS_PER_PAGE}&offset=${offset}${searchParam}`);
      const response = await fetch(url, { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch leads");
      return response.json();
    },
    enabled: !!currentUser,
  });

  // Message trends data for chart
  const { data: trendsData, isLoading: trendsLoading } = useQuery<{
    clientId: string;
    days: number;
    trends: MessageTrend[];
  }>({
    queryKey: ["/api/client/analytics/trends", statsRange, urlClientId],
    queryFn: async () => {
      const days = statsRange === '7' ? 7 : statsRange === '30' ? 30 : 30;
      const response = await fetch(appendClientId(`/api/client/analytics/trends?days=${days}`), { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch trends");
      return response.json();
    },
    enabled: !!currentUser,
  });

  // Top questions/topics data
  const { data: topQuestionsData, isLoading: topQuestionsLoading } = useQuery<{
    clientId: string;
    days: number;
    totalSessions: number;
    topQuestions: TopQuestion[];
  }>({
    queryKey: ["/api/client/analytics/top-questions", urlClientId],
    queryFn: async () => {
      const response = await fetch(appendClientId(`/api/client/analytics/top-questions?days=30&limit=8`), { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch top questions");
      return response.json();
    },
    enabled: !!currentUser,
  });

  // Booking analytics data (booking intents, link clicks, redirects)
  const { data: bookingAnalytics, isLoading: bookingAnalyticsLoading } = useQuery<BookingAnalytics>({
    queryKey: ["/api/client/bookings/analytics", bookingsDateRange, urlClientId],
    queryFn: async () => {
      const days = bookingsDateRange === '7' ? 7 : bookingsDateRange === '30' ? 30 : 90;
      const endDate = new Date().toISOString();
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
      const baseUrl = bookingsDateRange === 'all' 
        ? `/api/client/bookings/analytics`
        : `/api/client/bookings/analytics?startDate=${startDate}&endDate=${endDate}`;
      const response = await fetch(appendClientId(baseUrl), { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch booking analytics");
      return response.json();
    },
    enabled: !!currentUser,
  });

  // Team members data
  interface TeamMember {
    id: string;
    username: string;
    email: string;
    role: string;
    membershipRole: string;
    disabled: boolean;
    createdAt: string;
    lastLoginAt: string | null;
  }

  const { data: teamData, isLoading: teamLoading, refetch: refetchTeam } = useQuery<{
    members: TeamMember[];
  }>({
    queryKey: ["/api/client/team/members", urlClientId],
    queryFn: async () => {
      const response = await fetch(appendClientId("/api/client/team/members"), { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch team members");
      return response.json();
    },
    enabled: !!currentUser,
  });

  // Handle inviting a team member
  const handleInviteMember = async () => {
    setInviteError(null);
    
    if (!inviteEmail || !invitePassword) {
      setInviteError("Email and password are required");
      return;
    }
    
    // Basic password validation
    if (invitePassword.length < 8) {
      setInviteError("Password must be at least 8 characters");
      return;
    }
    if (!/[A-Z]/.test(invitePassword)) {
      setInviteError("Password must contain an uppercase letter");
      return;
    }
    if (!/[a-z]/.test(invitePassword)) {
      setInviteError("Password must contain a lowercase letter");
      return;
    }
    if (!/[0-9]/.test(invitePassword)) {
      setInviteError("Password must contain a number");
      return;
    }
    
    setInvitingMember(true);
    try {
      const response = await fetch(appendClientId("/api/client/team/members"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email: inviteEmail,
          password: invitePassword,
          membershipRole: inviteRole,
        }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        setInviteError(data.error || "Failed to invite member");
        return;
      }
      
      toast({ title: "Team member invited", description: `${inviteEmail} has been added to your team.` });
      setInviteDialogOpen(false);
      setInviteEmail('');
      setInvitePassword('');
      setInviteRole('staff');
      refetchTeam();
    } catch (error) {
      setInviteError("Failed to invite team member");
    } finally {
      setInvitingMember(false);
    }
  };

  // Handle removing a team member
  const handleRemoveMember = async (memberId: string, memberEmail: string) => {
    if (!confirm(`Are you sure you want to remove ${memberEmail} from your team?`)) {
      return;
    }
    
    setRemovingMemberId(memberId);
    try {
      const response = await fetch(appendClientId(`/api/client/team/members/${memberId}`), {
        method: "DELETE",
        credentials: "include",
      });
      
      if (response.ok) {
        toast({ title: "Team member removed", description: `${memberEmail} has been removed from your team.` });
        refetchTeam();
      } else {
        const data = await response.json();
        toast({ title: "Error", description: data.error || "Failed to remove team member", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to remove team member", variant: "destructive" });
    } finally {
      setRemovingMemberId(null);
    }
  };

  const handleCopyWidgetCode = () => {
    const botId = profile?.botId || stats?.botId || '';
    const clientId = profile?.clientId || stats?.clientId || urlClientId || '';
    const widgetBaseUrl = getWidgetBaseUrl();
    // Use simple script tag format with data attributes for proper widget identification
    const embedCode = `<!-- Treasure Coast AI Widget -->
<script src="${widgetBaseUrl}/widget/embed.js" data-client-id="${clientId}" data-bot-id="${botId}"></script>`;
    
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
        // Use hard redirect to ensure all state is cleared
        window.location.href = "/login";
      } else {
        toast({ title: "Error", description: "Failed to logout.", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Network error during logout.", variant: "destructive" });
    }
  };

  // Fetch session messages when expanding a conversation
  const fetchSessionMessages = async (sessionId: string, sessionBotId: string) => {
    if (sessionMessages[sessionId]) return; // Already loaded
    
    // Use session's botId, or fallback to profile/stats botId
    const effectiveBotId = sessionBotId || profile?.botId || stats?.botId || '';
    if (!effectiveBotId) {
      toast({ 
        title: "Unable to load messages", 
        description: "Please try again in a moment.", 
        variant: "destructive" 
      });
      return;
    }
    
    setLoadingSession(sessionId);
    try {
      const response = await fetch(appendClientId(`/api/client/inbox/sessions/${sessionId}?botId=${effectiveBotId}`), { credentials: "include" });
      if (response.ok) {
        const data = await response.json();
        setSessionMessages(prev => ({ ...prev, [sessionId]: data.messages || [] }));
      } else {
        // API returned error - show toast
        toast({ title: "Error", description: "Failed to load conversation messages.", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Network error loading conversation.", variant: "destructive" });
    } finally {
      setLoadingSession(null);
    }
  };

  // Fetch session state
  const fetchSessionState = async (sessionId: string, sessionBotId: string) => {
    if (sessionStates[sessionId]) return sessionStates[sessionId];
    
    // Use session's botId, or fallback to profile/stats botId
    const effectiveBotId = sessionBotId || profile?.botId || stats?.botId || '';
    if (!effectiveBotId) {
      // botId missing - fetchSessionMessages will show the error toast
      return null;
    }
    
    try {
      const response = await fetch(appendClientId(`/api/client/inbox/sessions/${sessionId}/state?botId=${effectiveBotId}`), { credentials: "include" });
      if (response.ok) {
        const state = await response.json();
        setSessionStates(prev => ({ ...prev, [sessionId]: state }));
        return state;
      } else {
        // API returned error - show toast
        toast({ title: "Error", description: "Failed to load conversation status.", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Network error loading status.", variant: "destructive" });
    }
    return null;
  };

  // Toggle session expansion
  const handleToggleSession = async (session: ChatSession) => {
    if (expandedSession === session.sessionId) {
      setExpandedSession(null);
    } else {
      setExpandedSession(session.sessionId);
      await Promise.all([
        fetchSessionMessages(session.sessionId, session.botId),
        fetchSessionState(session.sessionId, session.botId)
      ]);
    }
  };

  // Mark session as resolved
  const handleMarkResolved = async (sessionId: string, sessionBotId?: string) => {
    // Use session's botId, or fallback to profile/stats botId
    const effectiveBotId = sessionBotId || profile?.botId || stats?.botId || '';
    
    // Require a valid botId before making the request
    if (!effectiveBotId) {
      toast({ 
        title: "Unable to update", 
        description: "Please try again in a moment.", 
        variant: "destructive" 
      });
      return;
    }
    
    try {
      const response = await fetch(appendClientId(`/api/client/inbox/sessions/${sessionId}/state?botId=${effectiveBotId}`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: "resolved", isRead: true })
      });
      
      if (response.ok) {
        const updatedState = await response.json();
        setSessionStates(prev => ({ ...prev, [sessionId]: updatedState }));
        toast({ title: "Marked as resolved", description: "Conversation has been marked as resolved." });
      } else {
        throw new Error("Failed to update");
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to mark as resolved.", variant: "destructive" });
    }
  };

  // Delete conversation
  const [deletingSessionId, setDeletingSessionId] = useState<string | null>(null);
  
  const handleDeleteConversation = async (sessionId: string) => {
    if (!confirm("Are you sure you want to delete this conversation? This action cannot be undone.")) {
      return;
    }
    
    setDeletingSessionId(sessionId);
    try {
      const response = await fetch(appendClientId(`/api/client/sessions/${sessionId}`), {
        method: "DELETE",
        credentials: "include",
      });
      
      if (response.ok) {
        // Collapse the session if it's expanded
        if (expandedSession === sessionId) {
          setExpandedSession(null);
        }
        // Invalidate sessions cache
        queryClient.invalidateQueries({ queryKey: ["/api/client/analytics/sessions", urlClientId] });
        queryClient.invalidateQueries({ queryKey: ["/api/client/stats", statsRange, urlClientId] });
        toast({ title: "Deleted", description: "Conversation has been deleted." });
      } else {
        throw new Error("Failed to delete");
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete conversation.", variant: "destructive" });
    } finally {
      setDeletingSessionId(null);
    }
  };

  // Update lead status
  const handleUpdateLeadStatus = async (leadId: string, newStatus: string) => {
    setUpdatingLeadId(leadId);
    try {
      await apiRequest("PATCH", appendClientId(`/api/client/leads/${leadId}`), { status: newStatus });
      queryClient.invalidateQueries({ queryKey: ["/api/client/leads"], exact: false });
      queryClient.invalidateQueries({ queryKey: ["/api/client/stats", statsRange, urlClientId] });
      toast({ title: "Status updated", description: `Lead status changed to ${newStatus}.` });
    } catch (error) {
      toast({ title: "Error", description: "Failed to update lead status.", variant: "destructive" });
    } finally {
      setUpdatingLeadId(null);
    }
  };

  // Update booking status
  const handleUpdateBookingStatus = async (bookingId: string, newStatus: string) => {
    setUpdatingBookingId(bookingId);
    try {
      await apiRequest("PATCH", appendClientId(`/api/client/bookings/${bookingId}`), { status: newStatus });
      queryClient.invalidateQueries({ queryKey: ["/api/client/appointments", urlClientId] });
      queryClient.invalidateQueries({ queryKey: ["/api/client/stats", statsRange, urlClientId] });
      toast({ title: "Status updated", description: `Booking status changed to ${newStatus}.` });
    } catch (error) {
      toast({ title: "Error", description: "Failed to update booking status.", variant: "destructive" });
    } finally {
      setUpdatingBookingId(null);
    }
  };

  // Click to call
  const handleClickToCall = (phone: string) => {
    window.location.href = `tel:${phone}`;
  };

  // Password change handler
  const handleChangePassword = async () => {
    setPasswordError(null);
    
    // Validate passwords match
    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match");
      return;
    }
    
    // Validate password strength
    if (newPassword.length < 8) {
      setPasswordError("Password must be at least 8 characters");
      return;
    }
    if (!/[A-Z]/.test(newPassword)) {
      setPasswordError("Password must contain at least one uppercase letter");
      return;
    }
    if (!/[a-z]/.test(newPassword)) {
      setPasswordError("Password must contain at least one lowercase letter");
      return;
    }
    if (!/[0-9]/.test(newPassword)) {
      setPasswordError("Password must contain at least one number");
      return;
    }
    if (!/[^A-Za-z0-9]/.test(newPassword)) {
      setPasswordError("Password must contain at least one special character");
      return;
    }
    
    try {
      const response = await fetch("/api/client/account/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        setPasswordError(data.error || "Failed to change password");
        return;
      }
      
      toast({
        title: "Password updated",
        description: "Your password has been changed successfully.",
      });
      
      // Reset form and close dialog
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordDialogOpen(false);
    } catch (error) {
      setPasswordError("An error occurred. Please try again.");
    }
  };

  // Password requirements check
  const passwordRequirements = [
    { met: newPassword.length >= 8, text: "At least 8 characters" },
    { met: /[A-Z]/.test(newPassword), text: "One uppercase letter" },
    { met: /[a-z]/.test(newPassword), text: "One lowercase letter" },
    { met: /[0-9]/.test(newPassword), text: "One number" },
    { met: /[^A-Za-z0-9]/.test(newPassword), text: "One special character" },
  ];
  const allPasswordRequirementsMet = passwordRequirements.every(req => req.met);
  const passwordsMatch = newPassword === confirmPassword && confirmPassword.length > 0;

  // Helper to normalize appointment types for consistent display and counting
  // Handles legacy data, NULL values, and various spellings
  const normalizeAppointmentType = (type: string | null | undefined): 'tour' | 'phone_call' | 'other' => {
    if (!type) return 'other';
    const lower = type.toLowerCase().trim();
    if (lower === 'tour') return 'tour';
    if (lower === 'phone_call' || lower === 'phone call' || lower === 'call' || lower === 'phone') return 'phone_call';
    return 'other';
  };

  // Get display label for appointment type
  const getAppointmentTypeLabel = (type: string | null | undefined): string => {
    const normalized = normalizeAppointmentType(type);
    if (normalized === 'tour') return 'Tour';
    if (normalized === 'phone_call') return 'Phone Call';
    return 'Appointment';
  };

  // Get badge styling for appointment type
  const getAppointmentTypeBadgeClass = (type: string | null | undefined): string => {
    const normalized = normalizeAppointmentType(type);
    if (normalized === 'tour') return 'bg-cyan-500/20 text-cyan-400 border-cyan-400/40';
    if (normalized === 'phone_call') return 'bg-purple-500/20 text-purple-400 border-purple-400/40';
    return 'bg-white/10 text-white/70 border-white/20';
  };

  // Booking type breakdown (tours vs phone calls) from appointments
  // These useMemo hooks must be called before any early returns to satisfy React's rules of hooks
  const tourBookings = useMemo(() => {
    if (!appointmentsData?.appointments) return 0;
    return appointmentsData.appointments.filter((apt: Appointment) => 
      normalizeAppointmentType(apt.appointmentType) === 'tour'
    ).length;
  }, [appointmentsData]);
  
  const phoneCallBookings = useMemo(() => {
    if (!appointmentsData?.appointments) return 0;
    return appointmentsData.appointments.filter((apt: Appointment) => 
      normalizeAppointmentType(apt.appointmentType) === 'phone_call'
    ).length;
  }, [appointmentsData]);

  if (authLoading || !currentUser) {
    return (
      <div className="min-h-screen bg-[#0B0E13] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 spin-gradient mx-auto mb-5" />
          <h3 className="text-base font-medium text-white mb-1">Loading Dashboard</h3>
          <p className="text-white/45 text-sm">Preparing your analytics...</p>
        </div>
      </div>
    );
  }

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-[#0B0E13] text-white p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex items-center justify-between">
            <div className="h-8 w-64 bg-white/10 rounded-lg animate-pulse" />
            <div className="h-10 w-10 bg-white/10 rounded-full animate-pulse" />
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <div className="h-6 w-48 bg-white/10 rounded animate-pulse mb-4" />
            <div className="h-4 w-full max-w-md bg-white/10 rounded animate-pulse" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="h-12 w-12 bg-white/10 rounded-xl animate-pulse" />
                  <div className="h-4 w-12 bg-white/10 rounded animate-pulse" />
                </div>
                <div className="h-8 w-20 bg-white/10 rounded animate-pulse" />
                <div className="h-3 w-24 bg-white/10 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const businessName = profile?.businessInfo?.name || stats?.businessName || "Your Business";
  const businessType = profile?.businessInfo?.type || stats?.businessType || "business";
  const botId = profile?.botId || stats?.botId || '';
  const clientId = profile?.clientId || stats?.clientId || urlClientId || '';

  // Use rangeStats when a specific range is selected, otherwise use all-time stats
  const useRangeStats = statsRange !== 'all' && stats?.rangeStats;
  const displayConversations = useRangeStats 
    ? stats.rangeStats!.conversations 
    : (stats?.dbStats?.totalConversations || stats?.logStats?.totalConversations || 0);
  const displayLeads = useRangeStats 
    ? stats.rangeStats!.leads 
    : (stats?.dbStats?.totalLeads || leadsData?.total || 0);
  const displayNewLeads = useRangeStats 
    ? stats.rangeStats!.newLeads 
    : (stats?.dbStats?.newLeads || leadsData?.leads?.filter((l: any) => l.status === 'new').length || 0);
  const displayBookings = useRangeStats 
    ? stats.rangeStats!.bookings 
    : (stats?.dbStats?.totalAppointments || 0);
  const displayPendingBookings = useRangeStats 
    ? stats.rangeStats!.pendingBookings 
    : (stats?.dbStats?.pendingAppointments || 0);
  const displayCompletedBookings = useRangeStats 
    ? stats.rangeStats!.completedBookings 
    : (stats?.dbStats?.completedAppointments || 0);
  
  // All-time stats (for comparison or "all time" mode)
  const totalConversations = stats?.dbStats?.totalConversations || stats?.logStats?.totalConversations || 0;
  const weeklyConversations = stats?.dbStats?.weeklyConversations || 0;
  const totalLeads = leadsData?.total || 0;
  const newLeads = leadsData?.leads?.filter((l: any) => l.status === 'new').length || 0;
  const pendingBookings = stats?.dbStats?.pendingAppointments || 0;
  const completedBookings = stats?.dbStats?.completedAppointments || 0;
  
  // Range label for display
  const rangeLabel = statsRange === '7' ? 'last 7 days' : statsRange === '30' ? 'last 30 days' : 'all time';

  // Helper to find lead associated with a session
  const getLeadForSession = (sessionId: string) => {
    if (!leadsData?.leads) return null;
    return leadsData.leads.find((lead: any) => lead.sessionId === sessionId) || null;
  };

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
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1 p-1 rounded-lg bg-white/5 border border-white/10">
              <Button
                size="sm"
                variant={statsRange === '7' ? "default" : "ghost"}
                className={statsRange === '7' ? "bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30" : "text-white/60 hover:text-white hover:bg-white/10"}
                onClick={() => setStatsRange('7')}
                data-testid="button-stats-7days"
              >
                7 Days
              </Button>
              <Button
                size="sm"
                variant={statsRange === '30' ? "default" : "ghost"}
                className={statsRange === '30' ? "bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30" : "text-white/60 hover:text-white hover:bg-white/10"}
                onClick={() => setStatsRange('30')}
                data-testid="button-stats-30days"
              >
                30 Days
              </Button>
              <Button
                size="sm"
                variant={statsRange === 'all' ? "default" : "ghost"}
                className={statsRange === 'all' ? "bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30" : "text-white/60 hover:text-white hover:bg-white/10"}
                onClick={() => setStatsRange('all')}
                data-testid="button-stats-all"
              >
                All Time
              </Button>
            </div>
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
              {!statsFetching && statsRange !== 'all' && typeof stats?.rangeStats?.conversationsTrend === 'number' && (
                <div className={`flex items-center gap-1 text-xs font-medium ${stats.rangeStats.conversationsTrend >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {stats.rangeStats.conversationsTrend >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {stats.rangeStats.conversationsTrend >= 0 ? '+' : ''}{stats.rangeStats.conversationsTrend}%
                </div>
              )}
            </div>
            {statsFetching ? (
              <div className="h-8 w-16 bg-white/10 rounded animate-pulse mb-1" />
            ) : (
              <div className="text-3xl font-bold text-white mb-1">{displayConversations}</div>
            )}
            <p className="text-sm text-white/60">Conversations</p>
            <p className="text-xs text-cyan-400 mt-2">{rangeLabel}</p>
          </GlassCardContent>
        </GlassCard>

        <GlassCard className="hover-elevate cursor-pointer" onClick={() => setActiveSection('leads')} data-testid="card-stat-leads">
          <GlassCardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="h-12 w-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                <Users className="h-6 w-6 text-green-400" />
              </div>
              {!statsFetching && statsRange !== 'all' && typeof stats?.rangeStats?.leadsTrend === 'number' ? (
                <div className={`flex items-center gap-1 text-xs font-medium ${stats.rangeStats.leadsTrend >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {stats.rangeStats.leadsTrend >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {stats.rangeStats.leadsTrend >= 0 ? '+' : ''}{stats.rangeStats.leadsTrend}%
                </div>
              ) : !statsFetching && displayNewLeads > 0 && (
                <Badge className="bg-green-500/20 text-green-400 border-green-400/40">{displayNewLeads} new</Badge>
              )}
            </div>
            {statsFetching ? (
              <div className="h-8 w-16 bg-white/10 rounded animate-pulse mb-1" />
            ) : (
              <div className="text-3xl font-bold text-white mb-1">{displayLeads}</div>
            )}
            <p className="text-sm text-white/60">Leads Captured</p>
            <p className="text-xs text-green-400 mt-2">{rangeLabel}</p>
          </GlassCardContent>
        </GlassCard>

        <GlassCard className="hover-elevate cursor-pointer" onClick={() => setActiveSection('bookings')} data-testid="card-stat-bookings">
          <GlassCardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="h-12 w-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                <Calendar className="h-6 w-6 text-purple-400" />
              </div>
              {!statsFetching && statsRange !== 'all' && typeof stats?.rangeStats?.bookingsTrend === 'number' ? (
                <div className={`flex items-center gap-1 text-xs font-medium ${stats.rangeStats.bookingsTrend >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {stats.rangeStats.bookingsTrend >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {stats.rangeStats.bookingsTrend >= 0 ? '+' : ''}{stats.rangeStats.bookingsTrend}%
                </div>
              ) : !statsFetching && displayPendingBookings > 0 && (
                <Badge className="bg-amber-500/20 text-amber-400 border-amber-400/40">{displayPendingBookings} pending</Badge>
              )}
            </div>
            {statsFetching ? (
              <div className="h-8 w-16 bg-white/10 rounded animate-pulse mb-1" />
            ) : (
              <div className="text-3xl font-bold text-white mb-1">{displayBookings}</div>
            )}
            <p className="text-sm text-white/60">Booking Requests</p>
            {statsFetching ? (
              <div className="h-4 w-24 bg-white/10 rounded animate-pulse mt-2" />
            ) : (
              <p className="text-xs text-purple-400 mt-2">{displayCompletedBookings} confirmed · {rangeLabel}</p>
            )}
          </GlassCardContent>
        </GlassCard>

        <GlassCard data-testid="card-stat-response-time">
          <GlassCardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="h-12 w-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <Clock className="h-6 w-6 text-blue-400" />
              </div>
              {stats?.lastActivity && (
                <span className="text-xs text-white/40">
                  Last: {format(new Date(stats.lastActivity), "MMM d")}
                </span>
              )}
            </div>
            {statsFetching ? (
              <div className="h-8 w-16 bg-white/10 rounded animate-pulse mb-1" />
            ) : (
              <div className="text-3xl font-bold text-white mb-1">
                {stats?.dbStats?.avgResponseTimeMs 
                  ? stats.dbStats.avgResponseTimeMs < 1000 
                    ? `${Math.round(stats.dbStats.avgResponseTimeMs)}ms`
                    : `${(stats.dbStats.avgResponseTimeMs / 1000).toFixed(1)}s`
                  : '—'}
              </div>
            )}
            <p className="text-sm text-white/60">Avg Response Time</p>
            <p className="text-xs text-blue-400 mt-2">AI assistant speed</p>
          </GlassCardContent>
        </GlassCard>
      </div>

      {/* Quick 7d/30d Comparison Strip */}
      {stats?.overview && (
        <div className="flex flex-wrap items-center justify-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10" data-testid="overview-comparison-strip">
          <div className="text-xs text-white/50 uppercase tracking-wider font-medium">7d / 30d</div>
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-cyan-400" />
            <span className="text-sm text-white font-medium" data-testid="overview-conversations">
              {stats.overview.conversations7Days} / {stats.overview.conversations30Days}
            </span>
            <span className="text-xs text-white/40">chats</span>
          </div>
          <div className="h-4 w-px bg-white/20" />
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-green-400" />
            <span className="text-sm text-white font-medium" data-testid="overview-leads">
              {stats.overview.leads7Days} / {stats.overview.leads30Days}
            </span>
            <span className="text-xs text-white/40">leads</span>
          </div>
          <div className="h-4 w-px bg-white/20" />
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-purple-400" />
            <span className="text-sm text-white font-medium" data-testid="overview-bookings">
              {stats.overview.bookings7Days} / {stats.overview.bookings30Days}
            </span>
            <span className="text-xs text-white/40">bookings</span>
          </div>
        </div>
      )}

      {(tourBookings > 0 || phoneCallBookings > 0) && (
        <GlassCard className="bg-gradient-to-br from-purple-500/10 via-pink-500/5 to-cyan-500/10" data-testid="card-executive-summary">
          <GlassCardHeader>
            <GlassCardTitle className="flex items-center gap-2 text-lg">
              <BarChart3 className="h-5 w-5 text-purple-400" />
              Booking Breakdown
            </GlassCardTitle>
            <GlassCardDescription>
              Tour visits vs phone call requests
            </GlassCardDescription>
          </GlassCardHeader>
          <GlassCardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-cyan-500/10 border border-cyan-400/30">
                <div className="flex items-center gap-2 mb-2">
                  <Eye className="h-4 w-4 text-cyan-400" />
                  <span className="text-xs text-cyan-400 font-medium">Tours</span>
                </div>
                <div className="text-2xl font-bold text-white">{tourBookings}</div>
                <p className="text-xs text-white/40 mt-1">In-person visits</p>
              </div>
              
              <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-400/30">
                <div className="flex items-center gap-2 mb-2">
                  <PhoneCall className="h-4 w-4 text-purple-400" />
                  <span className="text-xs text-purple-400 font-medium">Phone Calls</span>
                </div>
                <div className="text-2xl font-bold text-white">{phoneCallBookings}</div>
                <p className="text-xs text-white/40 mt-1">Staff call requests</p>
              </div>
              
              <div className="p-4 rounded-xl bg-green-500/10 border border-green-400/30">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="h-4 w-4 text-green-400" />
                  <span className="text-xs text-green-400 font-medium">Confirmed</span>
                </div>
                <div className="text-2xl font-bold text-white">{displayCompletedBookings}</div>
                <p className="text-xs text-white/40 mt-1">Follow-ups completed</p>
              </div>
              
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-400/30">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-4 w-4 text-amber-400" />
                  <span className="text-xs text-amber-400 font-medium">Pending</span>
                </div>
                <div className="text-2xl font-bold text-white">{displayPendingBookings}</div>
                <p className="text-xs text-white/40 mt-1">Awaiting follow-up</p>
              </div>
            </div>
          </GlassCardContent>
        </GlassCard>
      )}

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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GlassCard data-testid="card-lead-funnel">
          <GlassCardHeader>
            <GlassCardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-green-400" />
              Lead Funnel
            </GlassCardTitle>
            <GlassCardDescription>
              Track leads through your pipeline
            </GlassCardDescription>
          </GlassCardHeader>
          <GlassCardContent>
            {stats?.leadStatusBreakdown && (stats.leadStatusBreakdown.new > 0 || stats.leadStatusBreakdown.contacted > 0 || stats.leadStatusBreakdown.qualified > 0 || stats.leadStatusBreakdown.converted > 0) ? (
              <div className="space-y-4">
                {[
                  { label: 'New', value: stats.leadStatusBreakdown?.new ?? 0, color: 'bg-green-500' },
                  { label: 'Contacted', value: stats.leadStatusBreakdown?.contacted ?? 0, color: 'bg-blue-500' },
                  { label: 'Qualified', value: stats.leadStatusBreakdown?.qualified ?? 0, color: 'bg-purple-500' },
                  { label: 'Converted', value: stats.leadStatusBreakdown?.converted ?? 0, color: 'bg-cyan-500' },
                ].map((stage) => {
                  const breakdown = stats.leadStatusBreakdown || { new: 0, contacted: 0, qualified: 0, converted: 0, lost: 0 };
                  const total = (breakdown.new || 0) + (breakdown.contacted || 0) + (breakdown.qualified || 0) + (breakdown.converted || 0);
                  const percentage = total > 0 ? (stage.value / total) * 100 : 0;
                  return (
                    <div key={stage.label} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-white/70">{stage.label}</span>
                        <span className="text-white font-medium">{stage.value}</span>
                      </div>
                      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${stage.color} rounded-full transition-all duration-500`}
                          style={{ width: `${Math.max(percentage, stage.value > 0 ? 5 : 0)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
                {(stats.leadStatusBreakdown?.lost ?? 0) > 0 && (
                  <p className="text-xs text-white/40 mt-2">
                    {stats.leadStatusBreakdown?.lost ?? 0} lost leads not shown
                  </p>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-white/40">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No lead data available</p>
              </div>
            )}
          </GlassCardContent>
        </GlassCard>

        <GlassCard data-testid="card-peak-hours">
          <GlassCardHeader>
            <GlassCardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-cyan-400" />
              Peak Activity Hours
            </GlassCardTitle>
            <GlassCardDescription>
              When visitors chat most often
            </GlassCardDescription>
          </GlassCardHeader>
          <GlassCardContent>
            {Array.isArray(stats?.peakHours) && stats.peakHours.length > 0 ? (
              <div className="space-y-3">
                {stats.peakHours.slice(0, 5).map((peak) => {
                  const peakCount = peak?.count ?? 0;
                  const peakHour = peak?.hour ?? 0;
                  const maxCount = stats.peakHours?.[0]?.count || 1;
                  const percentage = maxCount > 0 ? (peakCount / maxCount) * 100 : 0;
                  const hourLabel = peakHour === 0 ? '12 AM' : 
                                    peakHour < 12 ? `${peakHour} AM` : 
                                    peakHour === 12 ? '12 PM' : 
                                    `${peakHour - 12} PM`;
                  return (
                    <div key={peakHour} className="flex items-center gap-3">
                      <span className="text-sm text-white/60 w-16">{hourLabel}</span>
                      <div className="flex-1 h-6 bg-white/10 rounded overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded transition-all duration-500 flex items-center justify-end pr-2"
                          style={{ width: `${Math.max(percentage, 10)}%` }}
                        >
                          <span className="text-xs text-white font-medium">{peakCount}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-white/40">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No activity data yet</p>
              </div>
            )}
          </GlassCardContent>
        </GlassCard>
      </div>

      {/* Message Trends Chart - Full Width */}
      <GlassCard data-testid="card-message-trends">
        <GlassCardHeader>
          <GlassCardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-cyan-400" />
            Message Trends
          </GlassCardTitle>
          <GlassCardDescription>
            Conversation activity over time
          </GlassCardDescription>
        </GlassCardHeader>
        <GlassCardContent>
          {trendsLoading ? (
            <div className="h-64 bg-white/5 rounded-lg animate-pulse" />
          ) : trendsData?.trends && trendsData.trends.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendsData.trends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis 
                    dataKey="date" 
                    stroke="rgba(255,255,255,0.4)"
                    tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 11 }}
                    tickFormatter={(value) => format(new Date(value), 'MMM d')}
                  />
                  <YAxis 
                    stroke="rgba(255,255,255,0.4)"
                    tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 11 }}
                    allowDecimals={false}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1a1d24', 
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px',
                      color: '#fff'
                    }}
                    labelFormatter={(value) => format(new Date(value), 'MMMM d, yyyy')}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="totalConversations" 
                    name="Conversations"
                    stroke="#00d4ff" 
                    strokeWidth={2}
                    dot={{ fill: '#00d4ff', r: 3 }}
                    activeDot={{ r: 5, fill: '#00d4ff' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="totalMessages" 
                    name="Messages"
                    stroke="#a855f7" 
                    strokeWidth={2}
                    dot={{ fill: '#a855f7', r: 3 }}
                    activeDot={{ r: 5, fill: '#a855f7' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="text-center py-12 text-white/40">
              <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="font-medium">No trend data available</p>
              <p className="text-sm">As conversations happen, trends will appear here</p>
            </div>
          )}
        </GlassCardContent>
      </GlassCard>

      {/* Top Questions Section */}
      <GlassCard data-testid="card-top-questions">
        <GlassCardHeader>
          <GlassCardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-purple-400" />
            Popular Topics
          </GlassCardTitle>
          <GlassCardDescription>
            What visitors ask about most
          </GlassCardDescription>
        </GlassCardHeader>
        <GlassCardContent>
          {topQuestionsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-10 bg-white/5 rounded animate-pulse" />
              ))}
            </div>
          ) : topQuestionsData?.topQuestions && topQuestionsData.topQuestions.length > 0 ? (
            <div className="space-y-3">
              {topQuestionsData.topQuestions.map((question, index) => {
                const colors = [
                  'from-cyan-500 to-blue-500',
                  'from-purple-500 to-pink-500',
                  'from-green-500 to-emerald-500',
                  'from-amber-500 to-orange-500',
                  'from-blue-500 to-indigo-500',
                  'from-rose-500 to-red-500',
                  'from-teal-500 to-cyan-500',
                  'from-violet-500 to-purple-500',
                ];
                const colorClass = colors[index % colors.length];
                const maxCount = topQuestionsData.topQuestions[0]?.count || 1;
                const percentage = (question.count / maxCount) * 100;
                
                return (
                  <div key={question.topic} className="group">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-white/80 font-medium truncate pr-4">
                        {question.topic}
                      </span>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge className="bg-white/10 text-white/60 text-xs border-0">
                          {question.count} mentions
                        </Badge>
                      </div>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className={`h-full bg-gradient-to-r ${colorClass} rounded-full transition-all duration-500`}
                        style={{ width: `${Math.max(percentage, 5)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-white/40">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="font-medium">No topic data yet</p>
              <p className="text-sm">As conversations happen, popular topics will appear here</p>
            </div>
          )}
        </GlassCardContent>
      </GlassCard>

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

  const renderConversationsSection = () => {
    const filterSessionsByDate = (sessions: ChatSession[] | undefined) => {
      if (!sessions || conversationsDateRange === 'all') return sessions || [];
      const daysAgo = conversationsDateRange === '7' ? 7 : 30;
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysAgo);
      return sessions.filter(s => new Date(s.startedAt) >= cutoffDate);
    };
    
    const filteredSessions = filterSessionsByDate(sessionsData?.sessions);
    
    const handleExportCSV = () => {
      if (!filteredSessions || filteredSessions.length === 0) {
        toast({ title: "No data to export", description: "No conversations available for export" });
        return;
      }
      
      const headers = ['Date', 'Time', 'Visitor Messages', 'Bot Replies', 'Total Messages', 'Topics', 'Booking Requested'];
      const rows = filteredSessions.map(session => [
        format(new Date(session.startedAt), "yyyy-MM-dd"),
        format(new Date(session.startedAt), "HH:mm"),
        session.userMessageCount,
        session.botMessageCount,
        session.userMessageCount + session.botMessageCount,
        session.topics?.join('; ') || '',
        session.appointmentRequested ? 'Yes' : 'No'
      ]);
      
      const csvContent = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `conversations-${format(new Date(), "yyyy-MM-dd")}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      toast({ title: "Export complete", description: `Exported ${filteredSessions.length} conversations to CSV` });
    };
    
    return (
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
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-1 p-1 rounded-lg bg-white/5 border border-white/10">
                <Button
                  size="sm"
                  variant={conversationsDateRange === 'all' ? "default" : "ghost"}
                  className={conversationsDateRange === 'all' ? "bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30" : "text-white/60 hover:text-white hover:bg-white/10"}
                  onClick={() => setConversationsDateRange('all')}
                  data-testid="button-filter-all"
                >
                  All
                </Button>
                <Button
                  size="sm"
                  variant={conversationsDateRange === '7' ? "default" : "ghost"}
                  className={conversationsDateRange === '7' ? "bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30" : "text-white/60 hover:text-white hover:bg-white/10"}
                  onClick={() => setConversationsDateRange('7')}
                  data-testid="button-filter-7days"
                >
                  7 Days
                </Button>
                <Button
                  size="sm"
                  variant={conversationsDateRange === '30' ? "default" : "ghost"}
                  className={conversationsDateRange === '30' ? "bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30" : "text-white/60 hover:text-white hover:bg-white/10"}
                  onClick={() => setConversationsDateRange('30')}
                  data-testid="button-filter-30days"
                >
                  30 Days
                </Button>
              </div>
              <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-400/40">
                {filteredSessions.length} {conversationsDateRange === 'all' ? 'total' : `in ${conversationsDateRange} days`}
              </Badge>
              <Button
                size="sm"
                variant="outline"
                className="border-white/20 text-white/70 hover:text-white hover:bg-white/10"
                onClick={handleExportCSV}
                disabled={!filteredSessions || filteredSessions.length === 0}
                data-testid="button-export-conversations-csv"
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
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
          ) : filteredSessions && filteredSessions.length > 0 ? (
            <ScrollArea className="h-[600px]">
              <div className="space-y-3">
                {filteredSessions.map((session) => {
                  const isExpanded = expandedSession === session.sessionId;
                  const messages = sessionMessages[session.sessionId] || [];
                  const state = sessionStates[session.sessionId];
                  const isResolved = state?.status === 'resolved';
                  const isLoadingMessages = loadingSession === session.sessionId;
                  
                  return (
                    <Collapsible
                      key={session.id}
                      open={isExpanded}
                      onOpenChange={() => handleToggleSession(session)}
                    >
                      <div
                        className={`rounded-lg bg-white/5 border transition-colors ${
                          isExpanded ? 'border-cyan-400/40' : 'border-white/10 hover:bg-white/10'
                        }`}
                        data-testid={`conversation-${session.id}`}
                      >
                        <CollapsibleTrigger asChild>
                          <div className="p-4 cursor-pointer">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex items-start gap-3">
                                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-cyan-500/30 to-blue-500/30 flex items-center justify-center mt-1">
                                  <MessageSquare className="h-5 w-5 text-cyan-400" />
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <p className="text-white font-medium">Visitor Conversation</p>
                                    {isResolved && (
                                      <Badge className="bg-green-500/20 text-green-400 border-green-400/40 text-xs">
                                        <CheckCircle2 className="h-3 w-3 mr-1" />
                                        Resolved
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-sm text-white/50 mt-1">
                                    {session.userMessageCount} visitor messages, {session.botMessageCount} assistant replies
                                  </p>
                                  {session.metadata?.aiSummary && (
                                    <p className="text-sm text-white/70 mt-2 italic" data-testid={`text-ai-summary-${session.id}`}>
                                      "{session.metadata.aiSummary}"
                                    </p>
                                  )}
                                  {session.metadata?.userIntent && (
                                    <div className="flex items-center gap-2 mt-2">
                                      <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-400/40 text-xs" data-testid={`badge-intent-${session.id}`}>
                                        <Sparkles className="h-3 w-3 mr-1" />
                                        Intent: {session.metadata.userIntent}
                                      </Badge>
                                    </div>
                                  )}
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
                              <div className="flex items-center gap-3">
                                <div className="text-right flex-shrink-0">
                                  <p className="text-xs text-white/50">
                                    {format(new Date(session.startedAt), "MMM d, yyyy")}
                                  </p>
                                  <p className="text-xs text-white/40 mt-1">
                                    {format(new Date(session.startedAt), "h:mm a")}
                                  </p>
                                </div>
                                <div className="text-white/40">
                                  {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                                </div>
                              </div>
                            </div>
                          </div>
                        </CollapsibleTrigger>
                        
                        <CollapsibleContent>
                          <div className="px-4 pb-4 border-t border-white/10">
                            {isLoadingMessages ? (
                              <div className="py-8 flex items-center justify-center">
                                <Loader2 className="h-6 w-6 animate-spin text-cyan-400" />
                                <span className="ml-2 text-white/60">Loading conversation...</span>
                              </div>
                            ) : messages.length > 0 ? (
                              <>
                                {/* Lead Contact Info - if lead is associated with this session */}
                                {(() => {
                                  const lead = getLeadForSession(session.sessionId);
                                  if (lead && (lead.name || lead.email || lead.phone)) {
                                    return (
                                      <div className="mt-4 p-3 rounded-lg bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-400/30">
                                        <div className="flex items-center gap-2 mb-2">
                                          <Users className="h-4 w-4 text-cyan-400" />
                                          <span className="text-sm font-medium text-cyan-400">Visitor Contact Info</span>
                                        </div>
                                        <div className="flex flex-wrap gap-4 text-sm">
                                          {lead.name && (
                                            <div className="flex items-center gap-2">
                                              <User className="h-3 w-3 text-white/40" />
                                              <span className="text-white" data-testid={`text-lead-name-${session.id}`}>{lead.name}</span>
                                            </div>
                                          )}
                                          {lead.email && (
                                            <a 
                                              href={`mailto:${lead.email}`} 
                                              className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors"
                                              onClick={(e) => e.stopPropagation()}
                                              data-testid={`link-lead-email-${session.id}`}
                                            >
                                              <Mail className="h-3 w-3" />
                                              <span>{lead.email}</span>
                                            </a>
                                          )}
                                          {lead.phone && (
                                            <a 
                                              href={`tel:${lead.phone}`} 
                                              className="flex items-center gap-2 text-green-400 hover:text-green-300 transition-colors"
                                              onClick={(e) => e.stopPropagation()}
                                              data-testid={`link-lead-phone-${session.id}`}
                                            >
                                              <Phone className="h-3 w-3" />
                                              <span>{lead.phone}</span>
                                            </a>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  }
                                  return null;
                                })()}
                                <div className="mt-4 space-y-3 max-h-[300px] overflow-y-auto">
                                  {messages.map((msg, idx) => (
                                    <div
                                      key={msg.id || idx}
                                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                    >
                                      <div
                                        className={`max-w-[80%] p-3 rounded-lg ${
                                          msg.role === 'user'
                                            ? 'bg-cyan-500/20 text-white border border-cyan-400/30'
                                            : 'bg-white/10 text-white/90 border border-white/20'
                                        }`}
                                      >
                                        <div className="flex items-center gap-2 mb-1">
                                          {msg.role === 'user' ? (
                                            <User className="h-3 w-3 text-cyan-400" />
                                          ) : (
                                            <Bot className="h-3 w-3 text-purple-400" />
                                          )}
                                          <span className="text-xs text-white/50">
                                            {msg.role === 'user' ? 'Visitor' : 'Assistant'}
                                          </span>
                                          {msg.timestamp && (
                                            <span className="text-xs text-white/30">
                                              {format(new Date(msg.timestamp), "h:mm a")}
                                            </span>
                                          )}
                                        </div>
                                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                                
                                <div className="mt-4 pt-4 border-t border-white/10 flex justify-between gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteConversation(session.sessionId);
                                    }}
                                    disabled={deletingSessionId === session.sessionId}
                                    className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                                    data-testid={`button-delete-conversation-${session.id}`}
                                  >
                                    {deletingSessionId === session.sessionId ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <Trash2 className="h-4 w-4 mr-2" />
                                    )}
                                    Delete
                                  </Button>
                                  {!isResolved && (
                                    <Button
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleMarkResolved(session.sessionId, session.botId);
                                      }}
                                      className="bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-400/40"
                                      data-testid={`button-mark-resolved-${session.id}`}
                                    >
                                      <CheckCircle2 className="h-4 w-4 mr-2" />
                                      Mark as Resolved
                                    </Button>
                                  )}
                                </div>
                              </>
                            ) : (
                              <div className="py-6 text-center text-white/40">
                                <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                <p className="text-sm">No messages found for this conversation</p>
                              </div>
                            )}
                          </div>
                        </CollapsibleContent>
                      </div>
                    </Collapsible>
                  );
                })}
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
  };

  const renderLeadsSection = () => {
    // Server-side filtering is now used via searchQuery parameter in API call
    const filteredLeads = leadsData?.leads || [];

    const exportLeadsToCSV = () => {
      if (!filteredLeads || filteredLeads.length === 0) {
        toast({
          title: "No leads to export",
          description: "There are no leads matching your current filter.",
          variant: "destructive"
        });
        return;
      }

      const escapeCSVField = (field: string | null | undefined): string => {
        const str = String(field ?? '');
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      };

      const formatDate = (dateStr: string | null | undefined): string => {
        if (!dateStr) return '';
        try {
          return format(new Date(dateStr), 'yyyy-MM-dd HH:mm');
        } catch {
          return '';
        }
      };

      const headers = ['Name', 'Email', 'Phone', 'Status', 'Captured Date'];
      const csvData = filteredLeads.map((lead: any) => [
        escapeCSVField(lead.name),
        escapeCSVField(lead.email),
        escapeCSVField(lead.phone),
        escapeCSVField(lead.status ?? 'new'),
        escapeCSVField(formatDate(lead.createdAt))
      ]);

      const csvContent = [
        headers.join(','),
        ...csvData.map((row: string[]) => row.join(','))
      ].join('\n');

      try {
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `leads-export-${format(new Date(), 'yyyy-MM-dd')}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        toast({
          title: "Export complete",
          description: `${filteredLeads.length} leads exported to CSV.`
        });
      } catch (error) {
        toast({
          title: "Export failed",
          description: "There was an error exporting the leads. Please try again.",
          variant: "destructive"
        });
      }
    };

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
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportLeadsToCSV}
                  className="border-white/10 text-white/70 hover:text-white hover:bg-white/10"
                  data-testid="button-export-leads"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
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
              <>
              <ScrollArea className="h-[500px]">
                <div className="space-y-3">
                  {filteredLeads.map((lead: any, idx: number) => {
                    const statusOption = LEAD_STATUS_OPTIONS.find(s => s.value === (lead.status || 'new'));
                    const isUpdating = updatingLeadId === lead.id;
                    
                    return (
                      <div
                        key={lead.id || idx}
                        className="p-4 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:border-cyan-500/30 transition-colors cursor-pointer"
                        onClick={() => setSelectedLead(lead)}
                        data-testid={`lead-row-${lead.id || idx}`}
                      >
                        <div className="flex items-start justify-between gap-4 flex-wrap">
                          <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-green-500/30 to-emerald-500/30 flex items-center justify-center">
                              <span className="text-lg font-medium text-green-400">
                                {(lead.name || 'V')[0].toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <p className="text-white font-medium">{lead.name || 'Anonymous Visitor'}</p>
                              <div className="flex items-center gap-3 mt-1 text-sm text-white/50 flex-wrap">
                                {lead.email ? (
                                  <a 
                                    href={`mailto:${lead.email}`}
                                    className="flex items-center gap-1 hover:text-cyan-400 transition-colors"
                                    onClick={(e) => e.stopPropagation()}
                                    data-testid={`link-email-${lead.id}`}
                                  >
                                    <Mail className="h-3 w-3" />
                                    {lead.email}
                                  </a>
                                ) : (
                                  <span className="flex items-center gap-1 text-white/30 italic">
                                    <Mail className="h-3 w-3" />
                                    No email
                                  </span>
                                )}
                                {lead.phone ? (
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handleClickToCall(lead.phone); }}
                                    className="flex items-center gap-1 hover:text-green-400 transition-colors group"
                                    data-testid={`button-call-${lead.id}`}
                                  >
                                    <PhoneCall className="h-3 w-3 group-hover:animate-pulse" />
                                    {lead.phone}
                                  </button>
                                ) : (
                                  <span className="flex items-center gap-1 text-white/30 italic">
                                    <PhoneCall className="h-3 w-3" />
                                    No phone
                                  </span>
                                )}
                              </div>
                              {/* Display tags if present */}
                              {lead.tags && lead.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {lead.tags.map((tag: string, tagIdx: number) => (
                                    <Badge 
                                      key={tagIdx}
                                      variant="outline" 
                                      className="text-xs py-0 px-1.5 bg-purple-500/10 text-purple-400 border-purple-500/30"
                                      data-testid={`badge-tag-${lead.id}-${tagIdx}`}
                                    >
                                      {tag}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                            {canEditStatus ? (
                              <Select
                                value={lead.status || 'new'}
                                onValueChange={(value) => handleUpdateLeadStatus(lead.id, value)}
                                disabled={isUpdating}
                              >
                                <SelectTrigger 
                                  className={`w-28 h-8 text-xs border ${statusOption?.color || 'bg-white/10 text-white/60 border-white/20'}`}
                                  data-testid={`select-lead-status-${lead.id}`}
                                >
                                  {isUpdating ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : (
                                    <SelectValue />
                                  )}
                                </SelectTrigger>
                                <SelectContent className="bg-[#1a1d24] border-white/10">
                                  {LEAD_STATUS_OPTIONS.map(opt => (
                                    <SelectItem key={opt.value} value={opt.value} className="text-white">
                                      {opt.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : (
                              <Badge 
                                className={`${statusOption?.color || 'bg-white/10 text-white/60 border-white/20'} border`}
                                data-testid={`badge-lead-status-${lead.id}`}
                              >
                                {statusOption?.label || lead.status || 'New'}
                              </Badge>
                            )}
                            <span className="text-xs text-white/40">
                              {lead.createdAt ? format(new Date(lead.createdAt), "MMM d, yyyy") : '—'}
                            </span>
                          </div>
                        </div>
                        {(lead.conversationPreview || lead.notes) && (
                          <div className="mt-3 pl-16 space-y-2">
                            {lead.conversationPreview && (
                              <div className="flex items-start gap-2">
                                <Sparkles className="h-3 w-3 text-cyan-400 mt-1 flex-shrink-0" />
                                <div>
                                  <p className="text-xs text-cyan-400 font-medium">What they wanted:</p>
                                  <p className="text-sm text-white/60">{lead.conversationPreview}</p>
                                </div>
                              </div>
                            )}
                            {lead.notes && (
                              <p className="text-sm text-white/50">{lead.notes}</p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
              {/* Pagination Controls */}
              {(leadsData?.total || 0) > LEADS_PER_PAGE && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-white/10 mt-2">
                  <p className="text-sm text-white/50">
                    Showing {((leadsPage - 1) * LEADS_PER_PAGE) + 1} - {Math.min(leadsPage * LEADS_PER_PAGE, leadsData?.total || 0)} of {leadsData?.total || 0}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setLeadsPage(p => Math.max(1, p - 1))}
                      disabled={leadsPage <= 1}
                      className="border-white/10 text-white/70 hover:text-white disabled:opacity-30"
                      data-testid="button-leads-prev"
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Previous
                    </Button>
                    <span className="text-sm text-white/60 px-2">
                      Page {leadsPage} of {Math.ceil((leadsData?.total || 0) / LEADS_PER_PAGE)}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setLeadsPage(p => p + 1)}
                      disabled={leadsPage >= Math.ceil((leadsData?.total || 0) / LEADS_PER_PAGE)}
                      className="border-white/10 text-white/70 hover:text-white disabled:opacity-30"
                      data-testid="button-leads-next"
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
              </>
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

  const renderBookingsSection = () => {
    const filterBookingsByDate = (appointments: Appointment[] | undefined) => {
      if (!appointments || bookingsDateRange === 'all') return appointments || [];
      const daysAgo = bookingsDateRange === '7' ? 7 : 30;
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysAgo);
      return appointments.filter(a => new Date(a.createdAt) >= cutoffDate);
    };
    
    const filteredBookings = filterBookingsByDate(appointmentsData?.appointments)?.filter((apt: Appointment) => {
      if (!bookingsSearch) return true;
      const query = bookingsSearch.toLowerCase();
      return (
        apt.name?.toLowerCase().includes(query) ||
        apt.contact?.toLowerCase().includes(query) ||
        apt.email?.toLowerCase().includes(query) ||
        apt.appointmentType?.toLowerCase().includes(query)
      );
    }) || [];
    
    return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Bookings</h2>
        <p className="text-white/60">Booking activity and appointment requests from your AI assistant</p>
      </div>

      {/* Booking Flow Analytics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <GlassCard data-testid="card-booking-intents">
          <GlassCardContent className="pt-6 text-center">
            <div className="h-12 w-12 rounded-xl bg-cyan-500/20 flex items-center justify-center mx-auto mb-3">
              <MessageSquare className="h-6 w-6 text-cyan-400" />
            </div>
            <div className="text-3xl font-bold text-cyan-400">
              {bookingAnalyticsLoading ? '...' : bookingAnalytics?.totalBookingIntents || 0}
            </div>
            <p className="text-sm text-white/60 mt-1">Booking Intents</p>
            <p className="text-xs text-white/40 mt-1">AI detected interest</p>
          </GlassCardContent>
        </GlassCard>
        <GlassCard data-testid="card-link-clicks">
          <GlassCardContent className="pt-6 text-center">
            <div className="h-12 w-12 rounded-xl bg-purple-500/20 flex items-center justify-center mx-auto mb-3">
              <ExternalLink className="h-6 w-6 text-purple-400" />
            </div>
            <div className="text-3xl font-bold text-purple-400">
              {bookingAnalyticsLoading ? '...' : bookingAnalytics?.totalLinkClicks || 0}
            </div>
            <p className="text-sm text-white/60 mt-1">Link Clicks</p>
            <p className="text-xs text-white/40 mt-1">Redirected to book</p>
          </GlassCardContent>
        </GlassCard>
        <GlassCard data-testid="card-pending-bookings">
          <GlassCardContent className="pt-6 text-center">
            <div className="h-12 w-12 rounded-xl bg-amber-500/20 flex items-center justify-center mx-auto mb-3">
              <Clock className="h-6 w-6 text-amber-400" />
            </div>
            <div className="text-3xl font-bold text-amber-400">{pendingBookings}</div>
            <p className="text-sm text-white/60 mt-1">Pending</p>
            <p className="text-xs text-white/40 mt-1">Awaiting action</p>
          </GlassCardContent>
        </GlassCard>
        <GlassCard data-testid="card-confirmed-bookings">
          <GlassCardContent className="pt-6 text-center">
            <div className="h-12 w-12 rounded-xl bg-green-500/20 flex items-center justify-center mx-auto mb-3">
              <CheckCircle className="h-6 w-6 text-green-400" />
            </div>
            <div className="text-3xl font-bold text-green-400">{completedBookings}</div>
            <p className="text-sm text-white/60 mt-1">Confirmed</p>
            <p className="text-xs text-white/40 mt-1">Completed bookings</p>
          </GlassCardContent>
        </GlassCard>
        <GlassCard data-testid="card-total-bookings">
          <GlassCardContent className="pt-6 text-center">
            <div className="h-12 w-12 rounded-xl bg-white/10 flex items-center justify-center mx-auto mb-3">
              <Calendar className="h-6 w-6 text-white/70" />
            </div>
            <div className="text-3xl font-bold text-white">{pendingBookings + completedBookings}</div>
            <p className="text-sm text-white/60 mt-1">Total Requests</p>
            <p className="text-xs text-white/40 mt-1">All bookings</p>
          </GlassCardContent>
        </GlassCard>
      </div>

      {/* Conversion funnel info - dynamic based on funnelMode */}
      {bookingAnalytics && bookingAnalytics.totalBookingIntents > 0 && (
        <GlassCard data-testid="card-booking-funnel">
          <GlassCardHeader>
            <GlassCardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-cyan-400" />
              Booking Funnel
            </GlassCardTitle>
            <GlassCardDescription>
              {bookingAnalytics.funnelMode === 'handoff' 
                ? 'Visitors are redirected to your external booking system'
                : bookingAnalytics.funnelMode === 'internal'
                  ? 'We capture leads and follow up to confirm bookings'
                  : 'How visitors progress through the booking flow'}
            </GlassCardDescription>
          </GlassCardHeader>
          <GlassCardContent>
            <div className="flex items-center justify-between gap-4 text-sm">
              {/* Step 1: Intent Detection (always shown) */}
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white/70">Intent Detection</span>
                  <span className="text-cyan-400 font-medium">{bookingAnalytics.totalBookingIntents}</span>
                </div>
                <Progress value={100} className="h-2 bg-white/10" />
              </div>
              <ChevronRight className="h-4 w-4 text-white/30" />
              
              {/* Step 2: Lead Captured (always shown) */}
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white/70">Lead Captured</span>
                  <span className="text-amber-400 font-medium">{bookingAnalytics.totalLeadCaptured}</span>
                </div>
                <Progress 
                  value={bookingAnalytics.totalBookingIntents > 0 
                    ? Math.min(100, (bookingAnalytics.totalLeadCaptured / bookingAnalytics.totalBookingIntents) * 100)
                    : 0} 
                  className="h-2 bg-white/10" 
                />
              </div>
              <ChevronRight className="h-4 w-4 text-white/30" />
              
              {/* Step 3: Clicked to Book (always shown) */}
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white/70">Clicked to Book</span>
                  <span className="text-purple-400 font-medium">{bookingAnalytics.totalLinkClicks}</span>
                </div>
                <Progress 
                  value={bookingAnalytics.totalBookingIntents > 0 
                    ? Math.min(100, (bookingAnalytics.totalLinkClicks / bookingAnalytics.totalBookingIntents) * 100)
                    : 0} 
                  className="h-2 bg-white/10" 
                />
              </div>
              
              {/* Step 4: Confirmed (ONLY shown for confirmable mode) */}
              {bookingAnalytics.funnelMode === 'confirmable' && (
                <>
                  <ChevronRight className="h-4 w-4 text-white/30" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white/70">Confirmed</span>
                      <span className="text-green-400 font-medium">{bookingAnalytics.completedBookings}</span>
                    </div>
                    <Progress 
                      value={bookingAnalytics.totalBookingIntents > 0 
                        ? Math.min(100, (bookingAnalytics.completedBookings / bookingAnalytics.totalBookingIntents) * 100)
                        : 0} 
                      className="h-2 bg-white/10" 
                    />
                  </div>
                </>
              )}
            </div>
          </GlassCardContent>
        </GlassCard>
      )}

      <GlassCard data-testid="card-bookings-list">
        <GlassCardHeader>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <GlassCardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-purple-400" />
              All Booking Requests
            </GlassCardTitle>
            <div className="flex items-center gap-3 flex-wrap">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                <Input
                  placeholder="Search bookings..."
                  value={bookingsSearch}
                  onChange={(e) => setBookingsSearch(e.target.value)}
                  className="pl-9 w-48 bg-white/5 border-white/10 text-white placeholder:text-white/40"
                  data-testid="input-search-bookings"
                />
              </div>
              <div className="flex items-center gap-1 p-1 rounded-lg bg-white/5 border border-white/10">
                <Button
                  size="sm"
                  variant={bookingsDateRange === 'all' ? "default" : "ghost"}
                  className={bookingsDateRange === 'all' ? "bg-purple-500/20 text-purple-400 hover:bg-purple-500/30" : "text-white/60 hover:text-white hover:bg-white/10"}
                  onClick={() => setBookingsDateRange('all')}
                  data-testid="button-bookings-all"
                >
                  All
                </Button>
                <Button
                  size="sm"
                  variant={bookingsDateRange === '7' ? "default" : "ghost"}
                  className={bookingsDateRange === '7' ? "bg-purple-500/20 text-purple-400 hover:bg-purple-500/30" : "text-white/60 hover:text-white hover:bg-white/10"}
                  onClick={() => setBookingsDateRange('7')}
                  data-testid="button-bookings-7days"
                >
                  7 Days
                </Button>
                <Button
                  size="sm"
                  variant={bookingsDateRange === '30' ? "default" : "ghost"}
                  className={bookingsDateRange === '30' ? "bg-purple-500/20 text-purple-400 hover:bg-purple-500/30" : "text-white/60 hover:text-white hover:bg-white/10"}
                  onClick={() => setBookingsDateRange('30')}
                  data-testid="button-bookings-30days"
                >
                  30 Days
                </Button>
              </div>
              <Badge className="bg-purple-500/20 text-purple-400 border-purple-400/40">
                {filteredBookings.length} {bookingsDateRange === 'all' ? 'total' : `in ${bookingsDateRange} days`}
              </Badge>
            </div>
          </div>
        </GlassCardHeader>
        <GlassCardContent>
          {appointmentsLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-24 bg-white/10 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : filteredBookings.length > 0 ? (
            <ScrollArea className="h-[400px]">
              <div className="space-y-4">
                {filteredBookings.map((apt) => (
                  <div
                    key={apt.id}
                    className="p-4 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:border-purple-500/30 transition-colors cursor-pointer"
                    onClick={() => setSelectedAppointment(apt)}
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
                            <Badge 
                              className={`text-xs ${getAppointmentTypeBadgeClass(apt.appointmentType)}`}
                              data-testid={`badge-type-${apt.id}`}
                            >
                              {getAppointmentTypeLabel(apt.appointmentType)}
                            </Badge>
                            <span className="text-xs text-white/50">
                              Preferred: {formatAppointmentTime(apt)}
                            </span>
                            {apt.sessionId && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 px-2 text-xs text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveSection('conversations');
                                  setTimeout(() => setExpandedSession(apt.sessionId!), 100);
                                }}
                                data-testid={`button-view-conversation-${apt.id}`}
                              >
                                <MessageSquare className="h-3 w-3 mr-1" />
                                View Chat
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2" onClick={(e) => e.stopPropagation()}>
                        {(() => {
                          const statusOption = BOOKING_STATUS_OPTIONS.find(s => s.value === (apt.status || 'new'));
                          const isUpdating = updatingBookingId === apt.id;
                          return canEditStatus ? (
                            <Select
                              value={apt.status || 'new'}
                              onValueChange={(value) => handleUpdateBookingStatus(apt.id, value)}
                              disabled={isUpdating}
                            >
                              <SelectTrigger 
                                className={`w-32 h-8 text-xs border ${statusOption?.color || 'bg-amber-500/20 text-amber-400 border-amber-400/40'}`}
                                data-testid={`select-booking-status-${apt.id}`}
                              >
                                {isUpdating ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <SelectValue />
                                )}
                              </SelectTrigger>
                              <SelectContent className="bg-[#1a1d23] border-white/20 z-[60]">
                                {BOOKING_STATUS_OPTIONS.map((option) => (
                                  <SelectItem 
                                    key={option.value} 
                                    value={option.value}
                                    className="text-white hover:bg-white/10"
                                    data-testid={`option-booking-status-${option.value}-${apt.id}`}
                                  >
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <Badge 
                              className={`${statusOption?.color || 'bg-amber-500/20 text-amber-400 border-amber-400/40'} border`}
                              data-testid={`badge-booking-status-${apt.id}`}
                            >
                              {statusOption?.label || apt.status || 'New'}
                            </Badge>
                          );
                        })()}
                        <span className="text-xs text-white/40">
                          {format(new Date(apt.createdAt), "MMM d, yyyy")}
                        </span>
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
              <p className="text-lg font-medium">
                {bookingsSearch || bookingsDateRange !== 'all' ? 'No matching bookings' : 'No bookings yet'}
              </p>
              <p className="text-sm mt-2 max-w-md mx-auto">
                {bookingsSearch || bookingsDateRange !== 'all' 
                  ? 'Try adjusting your filters' 
                  : 'Once your assistant starts capturing tours and phone calls, they will appear here'}
              </p>
            </div>
          )}
        </GlassCardContent>
      </GlassCard>
    </div>
  );
  };

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
              <div>
                <Label className="text-sm font-medium text-white/50">Notification Email</Label>
                <p className="text-lg text-white mt-1 flex items-center gap-2" data-testid="text-notification-email">
                  <Bell className="h-4 w-4 text-white/50" />
                  {stats?.notificationEmail || 'Not configured'}
                </p>
              </div>
            </div>
          </div>
        </GlassCardContent>
      </GlassCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GlassCard data-testid="card-widget-appearance">
          <GlassCardHeader>
            <GlassCardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5 text-pink-400" />
              Widget Appearance
            </GlassCardTitle>
            <GlassCardDescription>
              Your chat widget's current style (managed by our team)
            </GlassCardDescription>
          </GlassCardHeader>
          <GlassCardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                <div>
                  <p className="text-sm text-white/60">Theme</p>
                  <p className="text-white font-medium">Treasure Coast Default</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 border border-white/20" data-testid="color-preview-primary" />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                <div>
                  <p className="text-sm text-white/60">Position</p>
                  <p className="text-white font-medium">Bottom Right</p>
                </div>
                <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-400/40">Active</Badge>
              </div>
              <p className="text-xs text-white/40 mt-2">
                Your widget is configured with our premium theme. Contact our team to request custom branding.
              </p>
            </div>
          </GlassCardContent>
        </GlassCard>

        <GlassCard data-testid="card-notifications">
          <GlassCardHeader>
            <GlassCardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-amber-400" />
              Notification Settings
            </GlassCardTitle>
            <GlassCardDescription>
              How you receive alerts (managed by our team)
            </GlassCardDescription>
          </GlassCardHeader>
          <GlassCardContent>
            <div className="space-y-4">
              <div className={`flex items-center justify-between p-3 rounded-lg ${
                stats?.notificationEmail 
                  ? 'bg-green-500/10 border border-green-400/30' 
                  : 'bg-white/5 border border-white/10'
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`h-2 w-2 rounded-full ${stats?.notificationEmail ? 'bg-green-400' : 'bg-white/30'}`} />
                  <div>
                    <p className="text-white font-medium">Email Notifications</p>
                    <p className="text-sm text-white/50">
                      {stats?.notificationEmail || 'No email configured'}
                    </p>
                  </div>
                </div>
                <Badge 
                  className={stats?.notificationEmail 
                    ? 'bg-green-500/20 text-green-400 border-green-400/40' 
                    : 'bg-white/10 text-white/50 border-white/20'
                  }
                  data-testid="badge-notifications-enabled"
                >
                  {stats?.notificationEmail ? 'Enabled' : 'Not Set'}
                </Badge>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-white/30" />
                  <div>
                    <p className="text-white font-medium">Daily Summary</p>
                    <p className="text-sm text-white/50">Coming soon</p>
                  </div>
                </div>
                <Badge className="bg-white/10 text-white/50 border-white/20">Planned</Badge>
              </div>
              <p className="text-xs text-white/40 mt-2">
                Need to update notification preferences? Contact our team.
              </p>
            </div>
          </GlassCardContent>
        </GlassCard>
      </div>

      {/* Account Security Card */}
      <GlassCard data-testid="card-account-security">
        <GlassCardHeader>
          <GlassCardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-green-400" />
            Account Security
          </GlassCardTitle>
          <GlassCardDescription>
            Manage your password and security settings
          </GlassCardDescription>
        </GlassCardHeader>
        <GlassCardContent>
          <div className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/10">
            <div className="flex items-center gap-3">
              <Lock className="h-5 w-5 text-white/50" />
              <div>
                <p className="text-white font-medium">Password</p>
                <p className="text-sm text-white/50">Change your account password</p>
              </div>
            </div>
            <Button
              onClick={() => {
                setPasswordError(null);
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
                setPasswordDialogOpen(true);
              }}
              className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-white"
              data-testid="button-change-password"
            >
              <KeyRound className="h-4 w-4 mr-2" />
              Change Password
            </Button>
          </div>
        </GlassCardContent>
      </GlassCard>

      {/* Password Change Dialog */}
      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogContent className="bg-[#0d1117] border border-white/10 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-green-400" />
              Change Password
            </DialogTitle>
            <DialogDescription className="text-white/60">
              Enter your current password and choose a new secure password.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {passwordError && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-400/30 text-red-400 text-sm">
                {passwordError}
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="currentPassword" className="text-white/80">Current Password</Label>
              <Input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter your current password"
                className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
                data-testid="input-current-password"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="newPassword" className="text-white/80">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter your new password"
                className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
                data-testid="input-new-password"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirmNewPassword" className="text-white/80">Confirm New Password</Label>
              <Input
                id="confirmNewPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your new password"
                className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
                data-testid="input-confirm-new-password"
              />
            </div>
            
            <div className="bg-white/5 rounded-lg p-3 space-y-2">
              <p className="text-white/60 text-xs font-medium mb-2">Password Requirements:</p>
              {passwordRequirements.map((req, index) => (
                <div key={index} className="flex items-center gap-2 text-xs">
                  <CheckCircle className={`w-3 h-3 ${req.met ? 'text-green-400' : 'text-white/20'}`} />
                  <span className={req.met ? 'text-green-400' : 'text-white/40'}>{req.text}</span>
                </div>
              ))}
              <div className="flex items-center gap-2 text-xs pt-2 border-t border-white/10 mt-2">
                <CheckCircle className={`w-3 h-3 ${passwordsMatch ? 'text-green-400' : 'text-white/20'}`} />
                <span className={passwordsMatch ? 'text-green-400' : 'text-white/40'}>Passwords match</span>
              </div>
            </div>
          </div>
          
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setPasswordDialogOpen(false)}
              className="flex-1 border-white/10 text-white hover:bg-white/10"
              data-testid="button-cancel-password"
            >
              Cancel
            </Button>
            <Button
              onClick={handleChangePassword}
              disabled={!currentPassword || !allPasswordRequirementsMet || !passwordsMatch}
              className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-white disabled:opacity-50"
              data-testid="button-submit-password"
            >
              Update Password
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Team Management Card */}
      <GlassCard data-testid="card-team-management">
        <GlassCardHeader>
          <GlassCardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-400" />
            Team Members
          </GlassCardTitle>
          <GlassCardDescription>
            Manage who can access your dashboard
          </GlassCardDescription>
        </GlassCardHeader>
        <GlassCardContent className="space-y-4">
          {/* Invite button */}
          <div className="flex justify-end">
            <Button
              onClick={() => {
                setInviteError(null);
                setInviteEmail('');
                setInvitePassword('');
                setInviteRole('staff');
                setInviteDialogOpen(true);
              }}
              className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-400 hover:to-cyan-400 text-white"
              data-testid="button-invite-member"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Invite Team Member
            </Button>
          </div>
          
          {/* Team members list */}
          {teamLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-white/50" />
            </div>
          ) : teamData?.members && teamData.members.length > 0 ? (
            <div className="space-y-3">
              {teamData.members.filter(m => !m.disabled).map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10"
                  data-testid={`team-member-${member.id}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                      <span className="text-white font-medium text-sm">
                        {member.email?.charAt(0).toUpperCase() || 'U'}
                      </span>
                    </div>
                    <div>
                      <p className="text-white font-medium">{member.email}</p>
                      <p className="text-sm text-white/50 capitalize">
                        {member.membershipRole}
                        {member.lastLoginAt && (
                          <span className="ml-2">
                            Last active: {format(new Date(member.lastLoginAt), 'MMM d')}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={
                      member.membershipRole === 'owner' ? 'bg-purple-500/20 text-purple-400 border-purple-400/40' :
                      member.membershipRole === 'manager' ? 'bg-blue-500/20 text-blue-400 border-blue-400/40' :
                      member.membershipRole === 'staff' ? 'bg-cyan-500/20 text-cyan-400 border-cyan-400/40' :
                      'bg-gray-500/20 text-gray-400 border-gray-400/40'
                    }>
                      {member.membershipRole}
                    </Badge>
                    {member.id !== currentUser?.id?.toString() && member.membershipRole !== 'owner' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRemoveMember(member.id, member.email)}
                        disabled={removingMemberId === member.id}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        data-testid={`button-remove-member-${member.id}`}
                      >
                        {removingMemberId === member.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-white/40">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No team members yet</p>
              <p className="text-xs mt-1">Invite someone to help manage your dashboard</p>
            </div>
          )}
        </GlassCardContent>
      </GlassCard>

      {/* Invite Team Member Dialog */}
      <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
        <DialogContent className="bg-[#0d1117] border border-white/10 text-white max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-blue-400" />
              Invite Team Member
            </DialogTitle>
            <DialogDescription className="text-white/60">
              Add a new member to access your dashboard. They'll need to change their password on first login.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {inviteError && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-400/30 text-red-400 text-sm">
                {inviteError}
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="inviteEmail" className="text-white/80">Email Address</Label>
              <Input
                id="inviteEmail"
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="team@example.com"
                className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
                data-testid="input-invite-email"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="invitePassword" className="text-white/80">Temporary Password</Label>
              <Input
                id="invitePassword"
                type="password"
                value={invitePassword}
                onChange={(e) => setInvitePassword(e.target.value)}
                placeholder="Temporary password for first login"
                className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
                data-testid="input-invite-password"
              />
              <p className="text-xs text-white/40">Min 8 chars, 1 uppercase, 1 lowercase, 1 number</p>
            </div>
            
            <div className="space-y-2">
              <Label className="text-white/80">Role</Label>
              <Select value={inviteRole} onValueChange={(v: 'manager' | 'staff' | 'agent') => setInviteRole(v)}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white" data-testid="select-invite-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1f2e] border-white/10">
                  <SelectItem value="manager" className="text-white hover:bg-white/10">Manager - Full access</SelectItem>
                  <SelectItem value="staff" className="text-white hover:bg-white/10">Staff - Can edit leads & bookings</SelectItem>
                  <SelectItem value="agent" className="text-white hover:bg-white/10">Agent - View & update only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setInviteDialogOpen(false)}
              className="flex-1 border-white/10 text-white hover:bg-white/10"
              data-testid="button-cancel-invite"
            >
              Cancel
            </Button>
            <Button
              onClick={handleInviteMember}
              disabled={!inviteEmail || !invitePassword || invitingMember}
              className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-400 hover:to-cyan-400 text-white disabled:opacity-50"
              data-testid="button-submit-invite"
            >
              {invitingMember ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <UserPlus className="h-4 w-4 mr-2" />
              )}
              Invite Member
            </Button>
          </div>
        </DialogContent>
      </Dialog>

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
<script src="${getWidgetBaseUrl()}/widget/embed.js" data-client-id="${clientId}" data-bot-id="${botId}"></script>`}
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
              <TreasureCoastLogo variant="icon" size="md" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-semibold text-white truncate" data-testid="text-sidebar-business-name">
                    {businessName}
                  </h2>
                  {stats?.workspace && (
                    <TenantBadge isDemo={stats.workspace.isDemo} size="sm" showLabel={false} />
                  )}
                </div>
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
            {stats?.workspace?.isDemo && (
              <DemoInfoBanner className="mb-6" />
            )}
            {renderContent()}
          </main>
        </div>

        {/* Platform Help Bot */}
        <PlatformHelpBot variant="dashboard" />
      </div>

      {/* Lead Details Dialog */}
      <Dialog open={!!selectedLead} onOpenChange={(open) => !open && setSelectedLead(null)}>
        <DialogContent className="bg-[#1a1f2e] border-white/10 text-white max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-white">
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-green-500/30 to-emerald-500/30 flex items-center justify-center">
                <span className="text-lg font-medium text-green-400">
                  {(selectedLead?.name || 'V')[0].toUpperCase()}
                </span>
              </div>
              <div>
                <span>{selectedLead?.name || 'Anonymous Visitor'}</span>
              </div>
            </DialogTitle>
            <DialogDescription className="text-white/50">
              Lead captured on {selectedLead?.createdAt ? format(new Date(selectedLead.createdAt), "MMMM d, yyyy 'at' h:mm a") : 'Unknown date'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            {/* Status Section */}
            <div className="bg-white/5 rounded-lg p-4 space-y-3">
              <h4 className="text-sm font-medium text-white/70 uppercase tracking-wide">Status</h4>
              {canEditStatus ? (
                <Select
                  value={selectedLead?.status || 'new'}
                  onValueChange={(value) => {
                    if (selectedLead?.id) {
                      handleUpdateLeadStatus(selectedLead.id, value);
                      setSelectedLead((prev: any) => prev ? { ...prev, status: value } : null);
                    }
                  }}
                  disabled={updatingLeadId === selectedLead?.id}
                >
                  <SelectTrigger 
                    className={`w-full h-10 ${LEAD_STATUS_OPTIONS.find(s => s.value === (selectedLead?.status || 'new'))?.color || 'bg-amber-500/20 text-amber-400 border-amber-400/40'}`}
                    data-testid="select-lead-status-popup"
                  >
                    {updatingLeadId === selectedLead?.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <SelectValue />
                    )}
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1d23] border-white/20 z-[60]">
                    {LEAD_STATUS_OPTIONS.map((option) => (
                      <SelectItem 
                        key={option.value} 
                        value={option.value}
                        className="text-white hover:bg-white/10"
                        data-testid={`option-lead-status-${option.value}`}
                      >
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Badge 
                  className={`${LEAD_STATUS_OPTIONS.find(s => s.value === (selectedLead?.status || 'new'))?.color || 'bg-green-500/20 text-green-400 border-green-400/40'} border text-sm py-2 px-4`}
                  data-testid="badge-lead-status-popup"
                >
                  {LEAD_STATUS_OPTIONS.find(s => s.value === (selectedLead?.status || 'new'))?.label || selectedLead?.status || 'New'}
                </Badge>
              )}
            </div>

            {/* Contact Information */}
            <div className="bg-white/5 rounded-lg p-4 space-y-3">
              <h4 className="text-sm font-medium text-white/70 uppercase tracking-wide">Contact Information</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-cyan-400" />
                  {selectedLead?.email ? (
                    <a href={`mailto:${selectedLead.email}`} className="text-cyan-400 hover:underline">
                      {selectedLead.email}
                    </a>
                  ) : (
                    <span className="text-white/40 italic">No email provided</span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <PhoneCall className="h-4 w-4 text-green-400" />
                  {selectedLead?.phone ? (
                    <a href={`tel:${selectedLead.phone}`} className="text-green-400 hover:underline">
                      {selectedLead.phone}
                    </a>
                  ) : (
                    <span className="text-white/40 italic">No phone provided</span>
                  )}
                </div>
              </div>
            </div>

            {/* Conversation Preview */}
            {selectedLead?.conversationPreview && (
              <div className="bg-white/5 rounded-lg p-4 space-y-2">
                <h4 className="text-sm font-medium text-white/70 uppercase tracking-wide flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-cyan-400" />
                  What They Wanted
                </h4>
                <p className="text-white/80">{selectedLead.conversationPreview}</p>
              </div>
            )}

            {/* Notes */}
            {selectedLead?.notes && (
              <div className="bg-white/5 rounded-lg p-4 space-y-2">
                <h4 className="text-sm font-medium text-white/70 uppercase tracking-wide">Notes</h4>
                <p className="text-white/70">{selectedLead.notes}</p>
              </div>
            )}

            {/* Tags */}
            {selectedLead?.tags && selectedLead.tags.length > 0 && (
              <div className="bg-white/5 rounded-lg p-4 space-y-2">
                <h4 className="text-sm font-medium text-white/70 uppercase tracking-wide flex items-center gap-2">
                  <Tag className="h-4 w-4 text-purple-400" />
                  Tags
                </h4>
                <div className="flex flex-wrap gap-2">
                  {selectedLead.tags.map((tag: string, idx: number) => (
                    <Badge 
                      key={idx}
                      variant="outline" 
                      className="bg-purple-500/10 text-purple-400 border-purple-500/30"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Automation Activity */}
            <div className="bg-white/5 rounded-lg p-4 space-y-2">
              <h4 className="text-sm font-medium text-white/70 uppercase tracking-wide flex items-center gap-2">
                <Zap className="h-4 w-4 text-amber-400" />
                Activity
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-white/60">
                  <div className="h-2 w-2 rounded-full bg-green-400" />
                  <span>Lead captured via chat widget</span>
                  <span className="text-white/40 text-xs ml-auto">
                    {selectedLead?.createdAt ? format(new Date(selectedLead.createdAt), "h:mm a") : ''}
                  </span>
                </div>
                {selectedLead?.status !== 'new' && (
                  <div className="flex items-center gap-2 text-white/60">
                    <div className="h-2 w-2 rounded-full bg-blue-400" />
                    <span>Status changed to {selectedLead?.status}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              {selectedLead?.email && (
                <Button
                  variant="outline"
                  className="flex-1 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
                  onClick={() => window.location.href = `mailto:${selectedLead.email}`}
                  data-testid="button-email-lead"
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Send Email
                </Button>
              )}
              {selectedLead?.phone && (
                <Button
                  variant="outline"
                  className="flex-1 border-green-500/30 text-green-400 hover:bg-green-500/10"
                  onClick={() => window.location.href = `tel:${selectedLead.phone}`}
                  data-testid="button-call-lead"
                >
                  <PhoneCall className="h-4 w-4 mr-2" />
                  Call Now
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Appointment Details Dialog */}
      <Dialog open={!!selectedAppointment} onOpenChange={(open) => !open && setSelectedAppointment(null)}>
        <DialogContent className="bg-[#1a1f2e] border-white/10 text-white max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-white">
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-purple-500/30 to-pink-500/30 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <span>{selectedAppointment?.name || 'Appointment'}</span>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className={getAppointmentTypeBadgeClass(selectedAppointment?.appointmentType)}>
                    {getAppointmentTypeLabel(selectedAppointment?.appointmentType)}
                  </Badge>
                </div>
              </div>
            </DialogTitle>
            <DialogDescription className="text-white/50">
              Requested on {selectedAppointment?.createdAt ? format(new Date(selectedAppointment.createdAt), "MMMM d, yyyy 'at' h:mm a") : 'Unknown date'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            {/* Status Section */}
            <div className="bg-white/5 rounded-lg p-4 space-y-3">
              <h4 className="text-sm font-medium text-white/70 uppercase tracking-wide">Status</h4>
              {canEditStatus ? (
                <Select
                  value={selectedAppointment?.status || 'new'}
                  onValueChange={(value) => {
                    if (selectedAppointment?.id) {
                      handleUpdateBookingStatus(selectedAppointment.id, value);
                      setSelectedAppointment((prev) => prev ? { ...prev, status: value } : null);
                    }
                  }}
                  disabled={updatingBookingId === selectedAppointment?.id}
                >
                  <SelectTrigger 
                    className={`w-full h-10 ${BOOKING_STATUS_OPTIONS.find(s => s.value === (selectedAppointment?.status || 'new'))?.color || 'bg-amber-500/20 text-amber-400 border-amber-400/40'}`}
                    data-testid="select-booking-status-popup"
                  >
                    {updatingBookingId === selectedAppointment?.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <SelectValue />
                    )}
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1d23] border-white/20 z-[60]">
                    {BOOKING_STATUS_OPTIONS.map((option) => (
                      <SelectItem 
                        key={option.value} 
                        value={option.value}
                        className="text-white hover:bg-white/10"
                        data-testid={`option-booking-status-${option.value}`}
                      >
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Badge 
                  className={`${BOOKING_STATUS_OPTIONS.find(s => s.value === (selectedAppointment?.status || 'new'))?.color || 'bg-amber-500/20 text-amber-400 border-amber-400/40'} border text-sm py-2 px-4`}
                  data-testid="badge-booking-status-popup"
                >
                  {BOOKING_STATUS_OPTIONS.find(s => s.value === (selectedAppointment?.status || 'new'))?.label || selectedAppointment?.status || 'New'}
                </Badge>
              )}
            </div>

            {/* Contact Information */}
            <div className="bg-white/5 rounded-lg p-4 space-y-3">
              <h4 className="text-sm font-medium text-white/70 uppercase tracking-wide">Contact Information</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-white/60" />
                  <span className="text-white">{selectedAppointment?.name || 'Unknown'}</span>
                </div>
                <div className="flex items-center gap-3">
                  <PhoneCall className="h-4 w-4 text-green-400" />
                  {selectedAppointment?.contact ? (
                    <a href={`tel:${selectedAppointment.contact}`} className="text-green-400 hover:underline">
                      {selectedAppointment.contact}
                    </a>
                  ) : (
                    <span className="text-white/40 italic">No phone provided</span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-cyan-400" />
                  {selectedAppointment?.email ? (
                    <a href={`mailto:${selectedAppointment.email}`} className="text-cyan-400 hover:underline">
                      {selectedAppointment.email}
                    </a>
                  ) : (
                    <span className="text-white/40 italic">No email provided</span>
                  )}
                </div>
              </div>
            </div>

            {/* Preferred Time */}
            <div className="bg-white/5 rounded-lg p-4 space-y-2">
              <h4 className="text-sm font-medium text-white/70 uppercase tracking-wide flex items-center gap-2">
                <Clock className="h-4 w-4 text-purple-400" />
                Preferred Time
              </h4>
              <p className="text-white/80">{selectedAppointment ? formatAppointmentTime(selectedAppointment) : 'Not specified'}</p>
            </div>

            {/* Notes */}
            {selectedAppointment?.notes && (
              <div className="bg-white/5 rounded-lg p-4 space-y-2">
                <h4 className="text-sm font-medium text-white/70 uppercase tracking-wide">Notes</h4>
                <p className="text-white/70">{selectedAppointment.notes}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              {selectedAppointment?.contact && (
                <Button
                  variant="outline"
                  className="flex-1 border-green-500/30 text-green-400 hover:bg-green-500/10"
                  onClick={() => window.location.href = `tel:${selectedAppointment.contact}`}
                  data-testid="button-call-appointment"
                >
                  <PhoneCall className="h-4 w-4 mr-2" />
                  Call Now
                </Button>
              )}
              {selectedAppointment?.email && (
                <Button
                  variant="outline"
                  className="flex-1 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
                  onClick={() => window.location.href = `mailto:${selectedAppointment.email}`}
                  data-testid="button-email-appointment"
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Send Email
                </Button>
              )}
              {selectedAppointment?.sessionId && (
                <Button
                  variant="outline"
                  className="flex-1 border-purple-500/30 text-purple-400 hover:bg-purple-500/10"
                  onClick={() => {
                    setSelectedAppointment(null);
                    setActiveSection('conversations');
                    setTimeout(() => setExpandedSession(selectedAppointment.sessionId!), 100);
                  }}
                  data-testid="button-view-chat-appointment"
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  View Chat
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
}

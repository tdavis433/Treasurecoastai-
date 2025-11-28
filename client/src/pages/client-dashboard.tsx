import { useQuery } from "@tanstack/react-query";
import { GlassCard, GlassCardHeader, GlassCardTitle, GlassCardDescription, GlassCardContent } from "@/components/ui/glass-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
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
} from "lucide-react";
import { format } from "date-fns";
import { useLocation } from "wouter";
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

export default function ClientDashboard() {
  const [, setLocation] = useLocation();

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
    queryKey: ["/api/client/analytics/trends", { days: 14 }],
  });

  const { data: sessionsData, isLoading: sessionsLoading } = useQuery<{
    clientId: string;
    botId: string;
    sessions: ChatSession[];
    total: number;
  }>({
    queryKey: ["/api/client/analytics/sessions"],
  });

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

  return (
    <div className="min-h-screen bg-[#0B0E13] text-white p-6 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white" data-testid="text-dashboard-title">{businessName}</h1>
          <p className="text-white/55 flex items-center gap-2">
            <Badge className="bg-cyan-500/20 text-cyan-400 border border-cyan-500/30" data-testid="badge-business-type">{businessType}</Badge>
            {profile?.businessInfo?.location && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3 text-white/55" />
                {profile.businessInfo.location}
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
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
          {profile?.botId && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLocation(`/demo/${profile.botId}`)}
              className="border-white/10 text-white/85 hover:bg-white/10 hover:text-white"
              data-testid="button-preview-bot"
            >
              <Bot className="h-4 w-4 mr-2" />
              Preview Bot
            </Button>
          )}
        </div>
      </div>

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

      <Tabs defaultValue="analytics" className="w-full">
        <TabsList className="bg-white/5 border border-white/10 rounded-xl" data-testid="tabs-dashboard">
          <TabsTrigger 
            value="analytics" 
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500/20 data-[state=active]:to-blue-500/20 data-[state=active]:text-cyan-400 data-[state=active]:border data-[state=active]:border-cyan-400/30 data-[state=inactive]:text-white/55 data-[state=inactive]:hover:text-white"
            data-testid="tab-analytics"
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            Analytics
          </TabsTrigger>
          <TabsTrigger 
            value="conversations"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500/20 data-[state=active]:to-blue-500/20 data-[state=active]:text-cyan-400 data-[state=active]:border data-[state=active]:border-cyan-400/30 data-[state=inactive]:text-white/55 data-[state=inactive]:hover:text-white"
            data-testid="tab-conversations"
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            Conversations
          </TabsTrigger>
          {stats?.dbStats && (
            <TabsTrigger 
              value="appointments"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500/20 data-[state=active]:to-blue-500/20 data-[state=active]:text-cyan-400 data-[state=active]:border data-[state=active]:border-cyan-400/30 data-[state=inactive]:text-white/55 data-[state=inactive]:hover:text-white"
              data-testid="tab-appointments"
            >
              <Calendar className="h-4 w-4 mr-2" />
              Appointments
            </TabsTrigger>
          )}
          <TabsTrigger 
            value="business"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500/20 data-[state=active]:to-blue-500/20 data-[state=active]:text-cyan-400 data-[state=active]:border data-[state=active]:border-cyan-400/30 data-[state=inactive]:text-white/55 data-[state=inactive]:hover:text-white"
            data-testid="tab-business"
          >
            <Building2 className="h-4 w-4 mr-2" />
            Business Info
          </TabsTrigger>
        </TabsList>

        <TabsContent value="analytics" className="mt-4 space-y-6">
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
                  Daily Activity (Last 14 Days)
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
        </TabsContent>

        <TabsContent value="conversations" className="mt-4">
          <GlassCard>
            <GlassCardHeader>
              <GlassCardTitle>Recent Conversations</GlassCardTitle>
              <GlassCardDescription>
                Chat sessions from your AI assistant
              </GlassCardDescription>
            </GlassCardHeader>
            <GlassCardContent>
              {conversationsLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-16 bg-white/10 rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : (conversationsData?.dbConversations?.length || 0) > 0 ? (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-4">
                    {conversationsData?.dbConversations?.map((conv) => (
                      <div
                        key={conv.sessionId}
                        className="p-4 border border-white/10 rounded-lg space-y-2 bg-white/5"
                        data-testid={`conversation-${conv.sessionId}`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <MessageSquare className="h-4 w-4 text-white/55" />
                            <span className="font-medium text-sm text-white">
                              Session #{conv.sessionId.slice(0, 8)}
                            </span>
                          </div>
                          <Badge className="bg-white/10 text-white/85 border border-white/20">
                            {conv.messageCount} messages
                          </Badge>
                        </div>
                        <p className="text-sm text-white/55 line-clamp-2">
                          {conv.preview}...
                        </p>
                        <div className="flex items-center gap-4 text-xs text-white/55">
                          <span>
                            Started: {format(new Date(conv.firstMessage), "MMM d, h:mm a")}
                          </span>
                          <span>
                            Last: {format(new Date(conv.lastMessage), "MMM d, h:mm a")}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="text-center py-8 text-white/40">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No conversations yet</p>
                  <p className="text-sm">Chat sessions will appear here once visitors start talking to your bot</p>
                </div>
              )}
            </GlassCardContent>
          </GlassCard>
        </TabsContent>

        <TabsContent value="appointments" className="mt-4">
          <GlassCard>
            <GlassCardHeader>
              <GlassCardTitle>Appointments</GlassCardTitle>
              <GlassCardDescription>
                Booking requests from visitors
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
                <ScrollArea className="h-[400px]">
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
        </TabsContent>

        <TabsContent value="business" className="mt-4">
          <GlassCard>
            <GlassCardHeader>
              <GlassCardTitle>Business Information</GlassCardTitle>
              <GlassCardDescription>
                Your business details as configured in the chatbot
              </GlassCardDescription>
            </GlassCardHeader>
            <GlassCardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-white/55">Business Name</label>
                    <p className="text-lg font-medium text-white" data-testid="text-business-name">
                      {profile?.businessInfo?.name || stats?.businessName || "Not configured"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-white/55">Business Type</label>
                    <p className="text-lg text-white" data-testid="text-business-type-detail">
                      {profile?.businessInfo?.type || stats?.businessType || "Not configured"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-white/55">Location</label>
                    <p className="text-lg flex items-center gap-2 text-white">
                      <MapPin className="h-4 w-4 text-white/55" />
                      {profile?.businessInfo?.location || "Not configured"}
                    </p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-white/55">Phone</label>
                    <p className="text-lg flex items-center gap-2 text-white">
                      <Phone className="h-4 w-4 text-white/55" />
                      {profile?.businessInfo?.phone || "Not configured"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-white/55">Hours</label>
                    <p className="text-lg flex items-center gap-2 text-white">
                      <Clock className="h-4 w-4 text-white/55" />
                      {profile?.businessInfo?.hours || "Not configured"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-white/55">Bot ID</label>
                    <p className="text-sm font-mono text-white/55" data-testid="text-bot-id">
                      {profile?.botId || stats?.botId || "N/A"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-white/5 border border-white/10 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-white/55 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-white">Need to update your information?</p>
                    <p className="text-sm text-white/55">
                      Contact your platform administrator to update your business details or chatbot configuration.
                    </p>
                  </div>
                </div>
              </div>
            </GlassCardContent>
          </GlassCard>
        </TabsContent>
      </Tabs>
    </div>
  );
}

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
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
  BarChart,
  Bar,
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
  "#3b82f6", // blue
  "#10b981", // green
  "#f59e0b", // amber
  "#ef4444", // red
  "#8b5cf6", // purple
  "#06b6d4", // cyan
  "#f97316", // orange
  "#ec4899", // pink
];

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

  // Analytics queries
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
      <div className="p-6 space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  const businessName = profile?.businessInfo?.name || stats?.businessName || "Your Business";
  const businessType = profile?.businessInfo?.type || stats?.businessType || "business";

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-dashboard-title">{businessName}</h1>
          <p className="text-muted-foreground flex items-center gap-2">
            <Badge variant="secondary" data-testid="badge-business-type">{businessType}</Badge>
            {profile?.businessInfo?.location && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
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
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card data-testid="card-total-conversations">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Conversations</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats?.dbStats?.totalConversations || stats?.logStats?.totalConversations || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats?.dbStats?.totalMessages || stats?.logStats?.messageCount || 0} total messages
              </p>
            </CardContent>
          </Card>

          <Card data-testid="card-weekly-activity">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Week</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats?.dbStats?.weeklyConversations || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                New conversations
              </p>
            </CardContent>
          </Card>

          {stats?.dbStats && (
            <>
              <Card data-testid="card-pending-appointments">
                <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pending</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-amber-600">
                    {stats.dbStats.pendingAppointments}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Appointments awaiting action
                  </p>
                </CardContent>
              </Card>

              <Card data-testid="card-completed-appointments">
                <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Completed</CardTitle>
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {stats.dbStats.completedAppointments}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Total confirmed/completed
                  </p>
                </CardContent>
              </Card>
            </>
          )}

          {!stats?.dbStats && (
            <>
              <Card data-testid="card-message-count">
                <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Messages</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {stats?.logStats?.messageCount || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Total logged messages
                  </p>
                </CardContent>
              </Card>

              <Card data-testid="card-last-activity">
                <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Last Activity</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-sm font-medium">
                    {stats?.logStats?.dateRange?.last
                      ? format(new Date(stats.logStats.dateRange.last), "MMM d, h:mm a")
                      : "No activity yet"}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Most recent conversation
                  </p>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      )}

      <Tabs defaultValue="analytics" className="w-full">
        <TabsList data-testid="tabs-dashboard">
          <TabsTrigger value="analytics" data-testid="tab-analytics">
            <BarChart3 className="h-4 w-4 mr-2" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="conversations" data-testid="tab-conversations">
            <MessageSquare className="h-4 w-4 mr-2" />
            Conversations
          </TabsTrigger>
          {stats?.dbStats && (
            <TabsTrigger value="appointments" data-testid="tab-appointments">
              <Calendar className="h-4 w-4 mr-2" />
              Appointments
            </TabsTrigger>
          )}
          <TabsTrigger value="business" data-testid="tab-business">
            <Building2 className="h-4 w-4 mr-2" />
            Business Info
          </TabsTrigger>
        </TabsList>

        <TabsContent value="analytics" className="mt-4 space-y-6">
          {/* Analytics Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card data-testid="card-analytics-messages">
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Messages</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {analyticsLoading ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <>
                    <div className="text-2xl font-bold">{analyticsData?.totalMessages || 0}</div>
                    <p className="text-xs text-muted-foreground">
                      {analyticsData?.userMessages || 0} user / {analyticsData?.botMessages || 0} bot
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card data-testid="card-analytics-response-time">
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {analyticsLoading ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <>
                    <div className="text-2xl font-bold">
                      {analyticsData?.avgResponseTimeMs 
                        ? `${(analyticsData.avgResponseTimeMs / 1000).toFixed(1)}s` 
                        : "—"}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Per conversation
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card data-testid="card-analytics-appointments">
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Booking Requests</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {analyticsLoading ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <>
                    <div className="text-2xl font-bold">{analyticsData?.appointmentRequests || 0}</div>
                    <p className="text-xs text-muted-foreground">
                      From chat conversations
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card data-testid="card-analytics-crisis">
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Crisis Events</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {analyticsLoading ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <>
                    <div className="text-2xl font-bold text-amber-600">{analyticsData?.crisisEvents || 0}</div>
                    <p className="text-xs text-muted-foreground">
                      Safety redirects triggered
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Daily Trends Chart */}
            <Card data-testid="card-daily-trends">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Daily Activity (Last 14 Days)
                </CardTitle>
                <CardDescription>
                  Conversations and messages over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                {trendsLoading ? (
                  <Skeleton className="h-[300px] w-full" />
                ) : trendsData?.trends && trendsData.trends.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={trendsData.trends}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(date) => format(new Date(date), "MM/dd")}
                        className="text-xs"
                      />
                      <YAxis className="text-xs" />
                      <Tooltip 
                        labelFormatter={(date) => format(new Date(date), "MMM d, yyyy")}
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '6px'
                        }}
                      />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="totalConversations" 
                        stroke="#3b82f6" 
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
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <Activity className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No activity data yet</p>
                      <p className="text-sm">Start chatting to see trends</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Topic Breakdown Chart */}
            <Card data-testid="card-topic-breakdown">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Topic Breakdown
                </CardTitle>
                <CardDescription>
                  What visitors are asking about
                </CardDescription>
              </CardHeader>
              <CardContent>
                {analyticsLoading ? (
                  <Skeleton className="h-[300px] w-full" />
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
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No topics tracked yet</p>
                      <p className="text-sm">Topics will appear as visitors chat</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent Sessions */}
          <Card data-testid="card-recent-sessions">
            <CardHeader>
              <CardTitle>Recent Chat Sessions</CardTitle>
              <CardDescription>
                Individual conversation sessions with your AI assistant
              </CardDescription>
            </CardHeader>
            <CardContent>
              {sessionsLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <Skeleton key={i} className="h-20" />
                  ))}
                </div>
              ) : sessionsData?.sessions && sessionsData.sessions.length > 0 ? (
                <ScrollArea className="h-[300px]">
                  <div className="space-y-3">
                    {sessionsData.sessions.map((session) => (
                      <div
                        key={session.id}
                        className="p-4 border rounded-lg space-y-2"
                        data-testid={`session-${session.id}`}
                      >
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-2">
                            <MessageSquare className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium text-sm">
                              Session #{session.sessionId.slice(0, 12)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            {session.crisisDetected && (
                              <Badge variant="destructive" className="text-xs">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                Crisis
                              </Badge>
                            )}
                            {session.appointmentRequested && (
                              <Badge variant="secondary" className="text-xs">
                                <Calendar className="h-3 w-3 mr-1" />
                                Booking
                              </Badge>
                            )}
                            <Badge variant="outline" className="text-xs">
                              {session.userMessageCount + session.botMessageCount} msgs
                            </Badge>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
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
                              <Badge key={idx} variant="outline" className="text-xs">
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
                <div className="text-center py-8 text-muted-foreground">
                  <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No sessions recorded yet</p>
                  <p className="text-sm">Chat sessions will appear here once visitors start chatting</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="conversations" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Conversations</CardTitle>
              <CardDescription>
                Chat sessions from your AI assistant
              </CardDescription>
            </CardHeader>
            <CardContent>
              {conversationsLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <Skeleton key={i} className="h-16" />
                  ))}
                </div>
              ) : (conversationsData?.dbConversations?.length || 0) > 0 ? (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-4">
                    {conversationsData?.dbConversations?.map((conv) => (
                      <div
                        key={conv.sessionId}
                        className="p-4 border rounded-lg space-y-2"
                        data-testid={`conversation-${conv.sessionId}`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <MessageSquare className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium text-sm">
                              Session #{conv.sessionId.slice(0, 8)}
                            </span>
                          </div>
                          <Badge variant="outline">
                            {conv.messageCount} messages
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {conv.preview}...
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
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
                <div className="text-center py-8 text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No conversations yet</p>
                  <p className="text-sm">Chat sessions will appear here once visitors start talking to your bot</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appointments" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Appointments</CardTitle>
              <CardDescription>
                Booking requests from visitors
              </CardDescription>
            </CardHeader>
            <CardContent>
              {appointmentsLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <Skeleton key={i} className="h-20" />
                  ))}
                </div>
              ) : (appointmentsData?.appointments?.length || 0) > 0 ? (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-4">
                    {appointmentsData?.appointments?.map((apt) => (
                      <div
                        key={apt.id}
                        className="p-4 border rounded-lg space-y-2"
                        data-testid={`appointment-${apt.id}`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{apt.name}</span>
                          </div>
                          <Badge
                            variant={
                              apt.status === "confirmed" || apt.status === "completed"
                                ? "default"
                                : apt.status === "cancelled"
                                ? "destructive"
                                : "secondary"
                            }
                          >
                            {apt.status}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {apt.contact}
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {apt.preferredTime}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Badge variant="outline">{apt.appointmentType}</Badge>
                          <span>
                            Requested: {format(new Date(apt.createdAt), "MMM d, yyyy")}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No appointments yet</p>
                  <p className="text-sm">Booking requests will appear here</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="business" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Business Information</CardTitle>
              <CardDescription>
                Your business details as configured in the chatbot
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Business Name</label>
                    <p className="text-lg font-medium" data-testid="text-business-name">
                      {profile?.businessInfo?.name || stats?.businessName || "Not configured"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Business Type</label>
                    <p className="text-lg" data-testid="text-business-type-detail">
                      {profile?.businessInfo?.type || stats?.businessType || "Not configured"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Location</label>
                    <p className="text-lg flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      {profile?.businessInfo?.location || "Not configured"}
                    </p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Phone</label>
                    <p className="text-lg flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      {profile?.businessInfo?.phone || "Not configured"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Hours</label>
                    <p className="text-lg flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      {profile?.businessInfo?.hours || "Not configured"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Bot ID</label>
                    <p className="text-sm font-mono text-muted-foreground" data-testid="text-bot-id">
                      {profile?.botId || stats?.botId || "N/A"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Need to update your information?</p>
                    <p className="text-sm text-muted-foreground">
                      Contact your platform administrator to update your business details or chatbot configuration.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

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
} from "lucide-react";
import { format } from "date-fns";
import { useLocation } from "wouter";

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

      <Tabs defaultValue="conversations" className="w-full">
        <TabsList data-testid="tabs-dashboard">
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

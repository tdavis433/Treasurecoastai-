import { useQuery } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { BarChart, MessageSquare, Phone, Calendar, TrendingUp, AlertCircle, Clock, Tag, Shield, Activity } from "lucide-react";
import { format } from "date-fns";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from "recharts";

interface AnalyticsSummary {
  totalConversations: number;
  totalAppointments: number;
  conversionRate: number;
  crisisRedirects: number;
  categoryCounts: Record<string, number>;
  dailyActivity: Array<{
    date: string;
    conversations: number;
    appointments: number;
  }>;
}

interface Appointment {
  id: string;
  status: string;
  createdAt: string;
  appointmentType?: string;
  lookingFor?: string;
  sobrietyStatus?: string;
}

interface Analytics {
  id: string;
  sessionId: string;
  role: string;
  category: string | null;
  content: string;
  createdAt: string;
}

export default function AdminAnalytics() {
  const { data: summary, isLoading: loadingSummary } = useQuery<AnalyticsSummary>({
    queryKey: ["/api/analytics/summary"],
  });

  const { data: appointments = [], isLoading: loadingAppointments } = useQuery<Appointment[]>({
    queryKey: ["/api/appointments"],
  });

  const { data: analyticsData = [], isLoading: loadingAnalytics } = useQuery<Analytics[]>({
    queryKey: ["/api/analytics"],
  });

  const totalMessages = analyticsData.length;

  const statusCounts = appointments.reduce(
    (acc, apt) => {
      acc[apt.status] = (acc[apt.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const appointmentTypeCounts = appointments.reduce(
    (acc, apt) => {
      const type = apt.appointmentType || 'unknown';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const lookingForCounts = appointments.reduce(
    (acc, apt) => {
      if (apt.lookingFor) {
        acc[apt.lookingFor] = (acc[apt.lookingFor] || 0) + 1;
      }
      return acc;
    },
    {} as Record<string, number>
  );

  const hourlyData = analyticsData.reduce((acc, item) => {
    const hour = new Date(item.createdAt).getHours();
    acc[hour] = (acc[hour] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);

  const peakHour = Object.entries(hourlyData).sort((a, b) => b[1] - a[1])[0];
  const peakHourLabel = peakHour
    ? (() => {
        const startHour = parseInt(peakHour[0]);
        const endHour = (startHour + 1) % 24;
        return `${startHour.toString().padStart(2, "0")}:00 - ${endHour.toString().padStart(2, "0")}:00`;
      })()
    : "N/A";

  const questionThemes: { theme: string; count: number }[] = [];
  const assistantMessages = analyticsData.filter((a) => a.role === "assistant" && a.content);

  const themeKeywords = {
    pricing: ["cost", "price", "fee", "payment", "afford", "expensive", "cheap"],
    requirements: ["requirement", "qualify", "eligible", "need", "accept", "rules"],
    location: ["where", "location", "address", "area", "city"],
    availability: ["available", "vacancy", "room", "space", "full", "open"],
    programs: ["program", "service", "counseling", "therapy", "support", "treatment"],
  };

  Object.entries(themeKeywords).forEach(([theme, keywords]) => {
    const count = assistantMessages.filter((msg) =>
      keywords.some((keyword) => msg.content.toLowerCase().includes(keyword))
    ).length;
    if (count > 0) {
      questionThemes.push({ theme, count });
    }
  });

  questionThemes.sort((a, b) => b.count - a.count);

  const categoryLabels: Record<string, string> = {
    faq_general: "General FAQ",
    pricing: "Pricing",
    availability: "Availability",
    requirements: "Requirements",
    application_process: "Application",
    pre_intake: "Pre-Intake",
    crisis_redirect: "Crisis Support",
    contact_info: "Contact Info",
    other: "Other"
  };

  const sortedCategories = summary?.categoryCounts
    ? Object.entries(summary.categoryCounts).sort((a, b) => b[1] - a[1])
    : [];

  const isLoading = loadingSummary || loadingAppointments || loadingAnalytics;

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading analytics...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight" data-testid="text-analytics-title">
            Analytics
          </h2>
          <p className="text-muted-foreground">
            Track chatbot performance and visitor engagement
          </p>
        </div>

        <Alert className="border-primary/20 bg-primary/5">
          <Shield className="h-4 w-4" />
          <AlertDescription>
            <strong>Privacy Notice:</strong> Analytics data includes conversation metadata and AI assistant responses only. 
            User messages are not logged. Phone numbers, emails, and addresses are automatically redacted from conversation summaries.
          </AlertDescription>
        </Alert>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-primary/10 bg-card/50 backdrop-blur-sm" data-testid="stat-card-conversations">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Conversations</CardTitle>
              <div className="p-2 rounded-lg bg-primary/10">
                <MessageSquare className="h-4 w-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold" data-testid="stat-total-chats">
                {summary?.totalConversations || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                {totalMessages} total messages
              </p>
            </CardContent>
          </Card>

          <Card className="border-primary/10 bg-card/50 backdrop-blur-sm" data-testid="stat-card-appointments">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Appointment Requests</CardTitle>
              <div className="p-2 rounded-lg bg-primary/10">
                <Calendar className="h-4 w-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold" data-testid="stat-total-appointments">
                {summary?.totalAppointments || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                {statusCounts.completed || 0} completed
              </p>
            </CardContent>
          </Card>

          <Card className="border-primary/10 bg-card/50 backdrop-blur-sm" data-testid="stat-card-conversion">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
              <div className="p-2 rounded-lg bg-primary/10">
                <TrendingUp className="h-4 w-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold" data-testid="stat-conversion-rate">
                {summary?.conversionRate?.toFixed(1) || 0}%
              </div>
              <p className="text-xs text-muted-foreground">
                Visitors to appointments
              </p>
            </CardContent>
          </Card>

          <Card className="border-primary/10 bg-card/50 backdrop-blur-sm" data-testid="stat-card-crisis">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Crisis Support</CardTitle>
              <div className="p-2 rounded-lg bg-destructive/10">
                <AlertCircle className="h-4 w-4 text-destructive" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold" data-testid="stat-crisis-support">
                {summary?.crisisRedirects || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Emergency resource views
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="border-primary/10 bg-card/50 backdrop-blur-sm" data-testid="card-activity-chart">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Activity Over Time
            </CardTitle>
            <CardDescription>
              Conversations and appointments over the last 30 days
            </CardDescription>
          </CardHeader>
          <CardContent>
            {summary?.dailyActivity && summary.dailyActivity.length > 0 ? (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={summary.dailyActivity.slice(-30)}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="colorConversations" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorAppointments" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--accent-foreground))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--accent-foreground))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => {
                        const date = new Date(value);
                        return format(date, 'MMM d');
                      }}
                      className="text-muted-foreground"
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }}
                      className="text-muted-foreground"
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                      }}
                      labelFormatter={(value) => format(new Date(value), 'MMMM d, yyyy')}
                    />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="conversations"
                      stroke="hsl(var(--primary))"
                      fillOpacity={1}
                      fill="url(#colorConversations)"
                      name="Conversations"
                    />
                    <Area
                      type="monotone"
                      dataKey="appointments"
                      stroke="hsl(var(--accent-foreground))"
                      fillOpacity={1}
                      fill="url(#colorAppointments)"
                      name="Appointments"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-80 flex items-center justify-center bg-muted/20 rounded-lg">
                <div className="text-center space-y-2">
                  <p className="text-sm text-muted-foreground">
                    No activity data available yet
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Chart will appear once conversations start
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-primary/10 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Appointment Status</CardTitle>
              <CardDescription>Current pipeline of requests</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm text-muted-foreground">New</span>
                  <Badge variant="secondary" data-testid="badge-new-count">
                    {statusCounts.new || 0}
                  </Badge>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm text-muted-foreground">Contacted</span>
                  <Badge variant="secondary" data-testid="badge-contacted-count">
                    {statusCounts.contacted || 0}
                  </Badge>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm text-muted-foreground">Scheduled</span>
                  <Badge variant="secondary" data-testid="badge-scheduled-count">
                    {statusCounts.scheduled || 0}
                  </Badge>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm text-muted-foreground">Completed</span>
                  <Badge variant="secondary" data-testid="badge-completed-count">
                    {statusCounts.completed || 0}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/10 bg-card/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <div>
                <CardTitle>Question Themes</CardTitle>
                <CardDescription>Top topics discussed</CardDescription>
              </div>
              <Tag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {questionThemes.length > 0 ? (
                <div className="space-y-2">
                  {questionThemes.slice(0, 5).map((theme) => (
                    <div key={theme.theme} className="flex items-center justify-between gap-2">
                      <span className="text-sm text-muted-foreground capitalize">
                        {theme.theme}
                      </span>
                      <Badge variant="secondary" data-testid={`badge-theme-${theme.theme}`}>
                        {theme.count}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">No conversation data yet</p>
              )}
            </CardContent>
          </Card>

          <Card className="border-primary/10 bg-card/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <div>
                <CardTitle>Message Categories</CardTitle>
                <CardDescription>Topics discussed</CardDescription>
              </div>
              <Tag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {sortedCategories.length > 0 ? (
                <div className="space-y-2">
                  {sortedCategories.slice(0, 5).map(([category, count]) => (
                    <div key={category} className="flex items-center justify-between gap-2">
                      <span className="text-sm text-muted-foreground text-xs">
                        {categoryLabels[category] || category}
                      </span>
                      <Badge variant="secondary" data-testid={`badge-category-${category}`}>
                        {count}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">No categorized data yet</p>
              )}
            </CardContent>
          </Card>

          <Card className="border-primary/10 bg-card/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <div>
                <CardTitle>Engagement Time</CardTitle>
                <CardDescription>Peak activity hours</CardDescription>
              </div>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <p className="text-sm font-medium">Peak hour</p>
                    <p className="text-xs text-muted-foreground" data-testid="text-peak-hour">
                      {peakHourLabel}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <p className="text-sm font-medium">Messages this hour</p>
                    <p className="text-xs text-muted-foreground">
                      {peakHour ? peakHour[1] : 0} interactions
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="border-primary/10 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Appointment Types</CardTitle>
              <CardDescription>Breakdown by request type</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm text-muted-foreground">Tour Requests</span>
                  <Badge variant="secondary" data-testid="badge-type-tour">
                    {appointmentTypeCounts.tour || 0}
                  </Badge>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm text-muted-foreground">Phone Calls</span>
                  <Badge variant="secondary" data-testid="badge-type-phone">
                    {appointmentTypeCounts.phone || 0}
                  </Badge>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm text-muted-foreground">Family Calls</span>
                  <Badge variant="secondary" data-testid="badge-type-family">
                    {appointmentTypeCounts.family || 0}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/10 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Pre-Qualification Insights</CardTitle>
              <CardDescription>Who is seeking help</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <BarChart className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Seeking for self</p>
                    <p className="text-xs text-muted-foreground">
                      {lookingForCounts.self || 0} individuals
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Seeking for loved one</p>
                    <p className="text-xs text-muted-foreground">
                      {lookingForCounts.loved_one || 0} family members
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Avg messages per chat</p>
                    <p className="text-xs text-muted-foreground">
                      {summary?.totalConversations && totalMessages > 0 
                        ? (totalMessages / summary.totalConversations).toFixed(1) 
                        : "0"}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}

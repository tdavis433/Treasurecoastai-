import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { BarChart, MessageSquare, Phone, Calendar, TrendingUp, AlertCircle, Clock, Tag, Shield } from "lucide-react";

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
  messageType: string;
  category: string | null;
  content: string;
  createdAt: string;
}

export default function Analytics() {
  const { data: appointments = [], isLoading: loadingAppointments } = useQuery<Appointment[]>({
    queryKey: ["/api/appointments"],
  });

  const { data: analyticsData = [], isLoading: loadingAnalytics } = useQuery<Analytics[]>({
    queryKey: ["/api/analytics"],
  });

  const totalChats = new Set(analyticsData.map((a) => a.sessionId)).size;
  const totalMessages = analyticsData.length;
  const totalAppointments = appointments.length;
  
  const statusCounts = appointments.reduce(
    (acc, apt) => {
      acc[apt.status] = (acc[apt.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const conversionRate = totalChats > 0 ? ((totalAppointments / totalChats) * 100).toFixed(1) : "0";

  const crisisCategories = analyticsData.filter(
    (a) => a.category && a.category.toLowerCase().includes("crisis")
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
  const assistantMessages = analyticsData.filter((a) => a.messageType === "assistant" && a.content);

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

  if (loadingAppointments || loadingAnalytics) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="container mx-auto max-w-6xl">
          <h1 className="text-3xl font-bold text-foreground mb-8">Loading...</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="container mx-auto max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2" data-testid="text-analytics-title">
            Analytics Dashboard
          </h1>
          <p className="text-muted-foreground">
            Track chatbot performance and visitor engagement
          </p>
        </div>

        <Alert className="mb-6">
          <Shield className="h-4 w-4" />
          <AlertDescription>
            <strong>Privacy Notice:</strong> Analytics data includes conversation metadata and AI assistant responses only. 
            User messages are not logged. Phone numbers, emails, and addresses are automatically redacted from conversation summaries. 
            Appointment data is stored separately with appropriate access controls and contains full contact information for follow-up.
          </AlertDescription>
        </Alert>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Conversations</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="stat-total-chats">
                {totalChats}
              </div>
              <p className="text-xs text-muted-foreground">
                {totalMessages} total messages
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Appointment Requests</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="stat-total-appointments">
                {totalAppointments}
              </div>
              <p className="text-xs text-muted-foreground">
                {statusCounts.completed || 0} completed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="stat-conversion-rate">
                {conversionRate}%
              </div>
              <p className="text-xs text-muted-foreground">
                Visitors to appointments
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Crisis Support Used</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="stat-crisis-support">
                {crisisCategories.length}
              </div>
              <p className="text-xs text-muted-foreground">
                Emergency resource views
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-6">
          <Card>
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

          <Card>
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

          <Card>
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

        <div className="grid gap-6 md:grid-cols-2 mb-6">
          <Card>
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
                {appointmentTypeCounts.unknown ? (
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm text-muted-foreground">Unknown Type</span>
                    <Badge variant="secondary" data-testid="badge-type-unknown">
                      {appointmentTypeCounts.unknown}
                    </Badge>
                  </div>
                ) : null}
              </div>
            </CardContent>
          </Card>

          <Card>
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
                    <p className="text-sm font-medium">Average messages per chat</p>
                    <p className="text-xs text-muted-foreground">
                      {totalChats > 0 ? (totalMessages / totalChats).toFixed(1) : "0"}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

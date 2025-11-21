import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart, MessageSquare, Phone, Calendar, TrendingUp, AlertCircle } from "lucide-react";

interface Appointment {
  id: string;
  status: string;
  createdAt: string;
}

interface Analytics {
  id: string;
  messageType: string;
  category: string | null;
  createdAt: string;
}

export default function Analytics() {
  const { data: appointments = [], isLoading: loadingAppointments } = useQuery<Appointment[]>({
    queryKey: ["/api/appointments"],
  });

  const { data: analyticsData = [], isLoading: loadingAnalytics } = useQuery<Analytics[]>({
    queryKey: ["/api/analytics"],
  });

  const totalChats = new Set(analyticsData.map((a) => a.id)).size;
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

        <div className="grid gap-6 md:grid-cols-2 mb-6">
          <Card>
            <CardHeader>
              <CardTitle>Appointment Status</CardTitle>
              <CardDescription>Current pipeline of requests</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">New</span>
                  <Badge variant="secondary" data-testid="badge-new-count">
                    {statusCounts.new || 0}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Contacted</span>
                  <Badge variant="secondary" data-testid="badge-contacted-count">
                    {statusCounts.contacted || 0}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Scheduled</span>
                  <Badge variant="secondary" data-testid="badge-scheduled-count">
                    {statusCounts.scheduled || 0}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Completed</span>
                  <Badge variant="secondary" data-testid="badge-completed-count">
                    {statusCounts.completed || 0}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Insights</CardTitle>
              <CardDescription>Key performance metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <BarChart className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Average messages per chat</p>
                    <p className="text-xs text-muted-foreground">
                      {totalChats > 0 ? (totalMessages / totalChats).toFixed(1) : "0"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Active pipeline</p>
                    <p className="text-xs text-muted-foreground">
                      {(statusCounts.new || 0) + (statusCounts.contacted || 0) + (statusCounts.scheduled || 0)} appointments pending
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

import { useQuery } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin-layout";
import { StatCard } from "@/components/stat-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  MessageSquare, 
  Calendar, 
  TrendingUp, 
  AlertCircle,
  ArrowRight
} from "lucide-react";
import { useLocation } from "wouter";
import { format } from "date-fns";
import { useAdminContext } from "@/contexts/admin-context";

interface AnalyticsSummary {
  totalConversations: number;
  totalAppointments: number;
  conversionRate: number;
  crisisRedirects: number;
  messagesByCategory: { category: string; count: number }[];
  dailyActivity: { date: string; conversations: number; appointments: number }[];
}

interface Appointment {
  id: string;
  name: string;
  contact: string;
  email: string | null;
  appointmentType: string;
  status: string;
  createdAt: string;
  preferredTime: string;
}

const statusColors = {
  new: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  contacted: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  scheduled: "bg-purple-500/10 text-purple-700 dark:text-purple-400",
  completed: "bg-green-500/10 text-green-700 dark:text-green-400",
  cancelled: "bg-gray-500/10 text-gray-700 dark:text-gray-400",
};

const categoryLabels: Record<string, string> = {
  pricing: "Pricing Questions",
  availability: "Availability",
  requirements: "Requirements",
  application_process: "Application Process",
  pre_intake: "Pre-Intake",
  crisis_redirect: "Crisis Redirects",
  contact_info: "Contact Info",
  other: "Other",
};

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const { dateRange, getDateRangeDates } = useAdminContext();
  const { startDate } = getDateRangeDates();

  const { data: summary, isLoading: summaryLoading} = useQuery<AnalyticsSummary>({
    queryKey: ["/api/analytics/summary", { startDate: startDate.toISOString() }],
    queryFn: async () => {
      const params = new URLSearchParams({ startDate: startDate.toISOString() });
      const response = await fetch(`/api/analytics/summary?${params}`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch analytics summary");
      return response.json();
    },
  });

  const { data: recentAppointments, isLoading: appointmentsLoading } = useQuery<{
    appointments: Appointment[];
    total: number;
  }>({
    queryKey: ["/api/appointments", { limit: 5 }],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: "5" });
      const response = await fetch(`/api/appointments?${params}`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch appointments");
      return response.json();
    },
  });

  if (summaryLoading || appointmentsLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-lg text-muted-foreground">Loading dashboard...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight" data-testid="text-dashboard-title">
            Dashboard
          </h2>
          <p className="text-muted-foreground">
            Overview of your chatbot's performance and leads
          </p>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Conversations"
            value={summary?.totalConversations || 0}
            subtitle={`Last ${dateRange} days`}
            icon={MessageSquare}
          />
          <StatCard
            title="Total Appointments"
            value={summary?.totalAppointments || 0}
            subtitle={`Last ${dateRange} days`}
            icon={Calendar}
          />
          <StatCard
            title="Conversion Rate"
            value={`${summary?.conversionRate || 0}%`}
            subtitle="Appointments / Conversations"
            icon={TrendingUp}
          />
          <StatCard
            title="Crisis Redirects"
            value={summary?.crisisRedirects || 0}
            subtitle="Emergency situations handled"
            icon={AlertCircle}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {/* Top Topics */}
          <Card data-testid="card-top-topics">
            <CardHeader>
              <CardTitle>Top Topics</CardTitle>
              <CardDescription>
                Most common conversation categories
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {summary?.messagesByCategory
                  .sort((a, b) => b.count - a.count)
                  .slice(0, 6)
                  .map((category) => (
                    <div key={category.category} className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        {categoryLabels[category.category] || category.category}
                      </span>
                      <Badge variant="secondary">{category.count}</Badge>
                    </div>
                  ))}
                {!summary?.messagesByCategory.length && (
                  <p className="text-sm text-muted-foreground">No conversation data yet</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Leads */}
          <Card data-testid="card-recent-leads">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle>Recent Leads</CardTitle>
                <CardDescription>
                  Latest appointment requests
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocation("/admin/appointments")}
                data-testid="button-view-all-appointments"
              >
                View all <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentAppointments?.appointments.map((appointment) => (
                  <div
                    key={appointment.id}
                    className="flex items-center justify-between border-b last:border-0 pb-3 last:pb-0 cursor-pointer hover-elevate rounded p-2"
                    onClick={() => setLocation("/admin/appointments")}
                    data-testid={`lead-item-${appointment.id}`}
                  >
                    <div className="space-y-1">
                      <p className="text-sm font-medium">{appointment.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {appointment.appointmentType} • {format(new Date(appointment.createdAt), "MMM d, yyyy")}
                      </p>
                    </div>
                    <Badge 
                      className={statusColors[appointment.status as keyof typeof statusColors] || statusColors.new}
                      data-testid={`badge-status-${appointment.status}`}
                    >
                      {appointment.status}
                    </Badge>
                  </div>
                ))}
                {!recentAppointments?.appointments.length && (
                  <p className="text-sm text-muted-foreground">No appointments yet</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Activity Chart Placeholder */}
        <Card data-testid="card-activity-chart">
          <CardHeader>
            <CardTitle>Activity Over Time</CardTitle>
            <CardDescription>
              Conversations and appointments in the last {dateRange} days
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80 flex items-center justify-center bg-muted/20 rounded-lg">
              <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground">
                  Chart visualization will be added in the next iteration
                </p>
                <p className="text-xs text-muted-foreground">
                  {summary?.dailyActivity.length || 0} days of data available
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}

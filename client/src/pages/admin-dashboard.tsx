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
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from "recharts";

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

  const { data: summary, isLoading: summaryLoading} = useQuery<AnalyticsSummary>({
    queryKey: ["/api/analytics/summary"],
    queryFn: async () => {
      const response = await fetch(`/api/analytics/summary`, {
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
            subtitle="All time"
            icon={MessageSquare}
          />
          <StatCard
            title="Total Appointments"
            value={summary?.totalAppointments || 0}
            subtitle="All time"
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

        {/* Activity Chart */}
        <Card data-testid="card-activity-chart">
          <CardHeader>
            <CardTitle>Activity Over Time</CardTitle>
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
      </div>
    </AdminLayout>
  );
}

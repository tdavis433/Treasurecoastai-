import { useQuery } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin-layout";
import { FuturisticStatCard } from "@/components/ui/futuristic-stat-card";
import { GlassCard, GlassCardHeader, GlassCardTitle, GlassCardDescription, GlassCardContent } from "@/components/ui/glass-card";
import { NeonBadge, StatusBadge } from "@/components/ui/neon-badge";
import { 
  MessageSquare, 
  Calendar, 
  TrendingUp, 
  AlertCircle,
  ArrowRight,
  Sparkles
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
          <div className="flex items-center gap-3 text-white/55">
            <Sparkles className="h-5 w-5 animate-pulse text-cyan-400" />
            <span>Loading dashboard...</span>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Page Header */}
        <div>
          <h2 className="text-3xl font-bold text-white" data-testid="text-dashboard-title">
            Dashboard
          </h2>
          <p className="text-white/55 mt-1">
            Overview of your chatbot's performance and leads
          </p>
        </div>

        {/* KPI Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <FuturisticStatCard
            title="Total Conversations"
            value={summary?.totalConversations || 0}
            subtitle="All time"
            icon={MessageSquare}
          />
          <FuturisticStatCard
            title="Total Appointments"
            value={summary?.totalAppointments || 0}
            subtitle="All time"
            icon={Calendar}
          />
          <FuturisticStatCard
            title="Conversion Rate"
            value={`${summary?.conversionRate || 0}%`}
            subtitle="Appointments / Conversations"
            icon={TrendingUp}
          />
          <FuturisticStatCard
            title="Crisis Redirects"
            value={summary?.crisisRedirects || 0}
            subtitle="Emergency situations handled"
            icon={AlertCircle}
          />
        </div>

        {/* Topics & Recent Leads */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Top Topics Panel */}
          <GlassCard hover data-testid="card-top-topics">
            <GlassCardHeader>
              <GlassCardTitle>Top Topics</GlassCardTitle>
              <GlassCardDescription>
                Most common conversation categories
              </GlassCardDescription>
            </GlassCardHeader>
            <GlassCardContent>
              <div className="space-y-3">
                {summary?.messagesByCategory
                  .sort((a, b) => b.count - a.count)
                  .slice(0, 6)
                  .map((category, index) => (
                    <div 
                      key={category.category} 
                      className="flex items-center justify-between py-2 border-b border-white/5 last:border-0 group hover:bg-white/5 rounded-lg px-2 -mx-2 transition-colors"
                    >
                      <span className="text-sm font-medium text-white/85">
                        {categoryLabels[category.category] || category.category}
                      </span>
                      <NeonBadge 
                        variant={index === 0 ? "new" : "default"}
                        data-testid={`badge-topic-${category.category}`}
                      >
                        {category.count}
                      </NeonBadge>
                    </div>
                  ))}
                {!summary?.messagesByCategory.length && (
                  <p className="text-sm text-white/40">No conversation data yet</p>
                )}
              </div>
            </GlassCardContent>
          </GlassCard>

          {/* Recent Leads Panel */}
          <GlassCard hover data-testid="card-recent-leads">
            <GlassCardHeader className="flex flex-row items-start justify-between">
              <div>
                <GlassCardTitle>Recent Leads</GlassCardTitle>
                <GlassCardDescription>
                  Latest appointment requests
                </GlassCardDescription>
              </div>
              <button
                onClick={() => setLocation("/admin/appointments")}
                className="flex items-center gap-2 text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
                data-testid="button-view-all-appointments"
              >
                View all <ArrowRight className="h-4 w-4" />
              </button>
            </GlassCardHeader>
            <GlassCardContent>
              <div className="space-y-3">
                {recentAppointments?.appointments.map((appointment) => (
                  <div
                    key={appointment.id}
                    className="flex items-center justify-between py-3 px-3 -mx-3 border-b border-white/5 last:border-0 cursor-pointer hover:bg-white/5 rounded-lg transition-colors group"
                    onClick={() => setLocation("/admin/appointments")}
                    data-testid={`lead-item-${appointment.id}`}
                  >
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-white/85 group-hover:text-white transition-colors">
                        {appointment.name}
                      </p>
                      <p className="text-xs text-white/40">
                        {appointment.appointmentType} • {format(new Date(appointment.createdAt), "MMM d, yyyy")}
                      </p>
                    </div>
                    <StatusBadge 
                      status={appointment.status}
                      data-testid={`badge-status-${appointment.status}`}
                    />
                  </div>
                ))}
                {!recentAppointments?.appointments.length && (
                  <p className="text-sm text-white/40">No appointments yet</p>
                )}
              </div>
            </GlassCardContent>
          </GlassCard>
        </div>

        {/* Activity Chart */}
        <GlassCard data-testid="card-activity-chart">
          <GlassCardHeader>
            <GlassCardTitle>Activity Over Time</GlassCardTitle>
            <GlassCardDescription>
              Conversations and appointments over the last 30 days
            </GlassCardDescription>
          </GlassCardHeader>
          <GlassCardContent>
            {summary?.dailyActivity && summary.dailyActivity.length > 0 ? (
              <div className="h-80 chart-container p-4 rounded-xl">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={summary.dailyActivity.slice(-30)}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="colorConversations" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4FC3F7" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#4FC3F7" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorAppointments" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2FE2FF" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#2FE2FF" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid 
                      strokeDasharray="3 3" 
                      stroke="rgba(255,255,255,0.08)" 
                      vertical={false}
                    />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.55)' }}
                      tickFormatter={(value) => {
                        const date = new Date(value);
                        return format(date, 'MMM d');
                      }}
                      axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                      tickLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                    />
                    <YAxis 
                      tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.55)' }}
                      axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                      tickLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(17, 20, 26, 0.95)',
                        border: '1px solid rgba(255,255,255,0.15)',
                        borderRadius: '12px',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                        backdropFilter: 'blur(12px)',
                        color: '#FFFFFF'
                      }}
                      labelStyle={{ color: 'rgba(255,255,255,0.85)' }}
                      itemStyle={{ color: 'rgba(255,255,255,0.85)' }}
                      labelFormatter={(value) => format(new Date(value), 'MMMM d, yyyy')}
                    />
                    <Legend 
                      wrapperStyle={{ color: 'rgba(255,255,255,0.85)' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="conversations"
                      stroke="#4FC3F7"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorConversations)"
                      name="Conversations"
                    />
                    <Area
                      type="monotone"
                      dataKey="appointments"
                      stroke="#2FE2FF"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorAppointments)"
                      name="Appointments"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-80 flex items-center justify-center bg-white/5 rounded-xl border border-white/10">
                <div className="text-center space-y-2">
                  <Sparkles className="h-8 w-8 text-cyan-400/50 mx-auto" />
                  <p className="text-sm text-white/55">
                    No activity data available yet
                  </p>
                  <p className="text-xs text-white/40">
                    Chart will appear once conversations start
                  </p>
                </div>
              </div>
            )}
          </GlassCardContent>
        </GlassCard>
      </div>
    </AdminLayout>
  );
}

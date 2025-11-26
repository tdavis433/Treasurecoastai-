import { useQuery } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin-layout";
import { FuturisticStatCard } from "@/components/ui/futuristic-stat-card";
import { GlassCard, GlassCardHeader, GlassCardTitle, GlassCardDescription, GlassCardContent } from "@/components/ui/glass-card";
import { NeonBadge } from "@/components/ui/neon-badge";
import { MessageSquare, Calendar, TrendingUp, AlertCircle, Clock, Tag, Shield, Activity, BarChart, Phone, Sparkles } from "lucide-react";
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

interface AppointmentsResponse {
  appointments: Appointment[];
  total: number;
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

  const { data: appointmentsResponse, isLoading: loadingAppointments } = useQuery<AppointmentsResponse>({
    queryKey: ["/api/appointments"],
  });

  const { data: analyticsData = [], isLoading: loadingAnalytics } = useQuery<Analytics[]>({
    queryKey: ["/api/analytics"],
  });

  const appointments = appointmentsResponse?.appointments || [];
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
          <div className="flex items-center gap-3 text-white/55">
            <Sparkles className="h-5 w-5 animate-pulse text-cyan-400" />
            <span>Loading analytics...</span>
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
          <h2 className="text-3xl font-bold text-white" data-testid="text-analytics-title">
            Analytics
          </h2>
          <p className="text-white/55 mt-1">
            Track chatbot performance and visitor engagement
          </p>
        </div>

        {/* Privacy Notice */}
        <div className="flex items-start gap-3 p-4 rounded-xl bg-cyan-500/10 border border-cyan-400/20">
          <Shield className="h-5 w-5 text-cyan-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-white/85">
              <strong className="text-cyan-400">Privacy Notice:</strong> Analytics data includes conversation metadata and AI assistant responses only. 
              User messages are not logged. Phone numbers, emails, and addresses are automatically redacted from conversation summaries.
            </p>
          </div>
        </div>

        {/* KPI Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <FuturisticStatCard
            title="Total Conversations"
            value={summary?.totalConversations || 0}
            subtitle={`${totalMessages} total messages`}
            icon={MessageSquare}
            data-testid="stat-card-conversations"
          />
          <FuturisticStatCard
            title="Appointment Requests"
            value={summary?.totalAppointments || 0}
            subtitle={`${statusCounts.completed || 0} completed`}
            icon={Calendar}
            data-testid="stat-card-appointments"
          />
          <FuturisticStatCard
            title="Conversion Rate"
            value={`${summary?.conversionRate?.toFixed(1) || 0}%`}
            subtitle="Visitors to appointments"
            icon={TrendingUp}
            data-testid="stat-card-conversion"
          />
          <FuturisticStatCard
            title="Crisis Support"
            value={summary?.crisisRedirects || 0}
            subtitle="Emergency resource views"
            icon={AlertCircle}
            data-testid="stat-card-crisis"
          />
        </div>

        {/* Activity Chart */}
        <GlassCard data-testid="card-activity-chart">
          <GlassCardHeader>
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-cyan-400" />
              <GlassCardTitle>Activity Over Time</GlassCardTitle>
            </div>
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
                      <linearGradient id="colorConversationsAnalytics" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4FC3F7" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#4FC3F7" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorAppointmentsAnalytics" x1="0" y1="0" x2="0" y2="1">
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
                      fill="url(#colorConversationsAnalytics)"
                      name="Conversations"
                    />
                    <Area
                      type="monotone"
                      dataKey="appointments"
                      stroke="#2FE2FF"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorAppointmentsAnalytics)"
                      name="Appointments"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-80 flex items-center justify-center bg-white/5 rounded-xl border border-white/10">
                <div className="text-center space-y-2">
                  <Sparkles className="h-8 w-8 text-cyan-400/50 mx-auto" />
                  <p className="text-sm text-white/55">No activity data available yet</p>
                  <p className="text-xs text-white/40">Chart will appear once conversations start</p>
                </div>
              </div>
            )}
          </GlassCardContent>
        </GlassCard>

        {/* Stats Breakdown Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {/* Appointment Status */}
          <GlassCard hover>
            <GlassCardHeader>
              <GlassCardTitle>Appointment Status</GlassCardTitle>
              <GlassCardDescription>Current pipeline of requests</GlassCardDescription>
            </GlassCardHeader>
            <GlassCardContent>
              <div className="space-y-3">
                {[
                  { label: "New", key: "new", variant: "new" as const },
                  { label: "Contacted", key: "contacted", variant: "warning" as const },
                  { label: "Scheduled", key: "scheduled", variant: "info" as const },
                  { label: "Completed", key: "completed", variant: "success" as const },
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between py-1">
                    <span className="text-sm text-white/70">{item.label}</span>
                    <NeonBadge variant={item.variant} data-testid={`badge-${item.key}-count`}>
                      {statusCounts[item.key] || 0}
                    </NeonBadge>
                  </div>
                ))}
              </div>
            </GlassCardContent>
          </GlassCard>

          {/* Question Themes */}
          <GlassCard hover>
            <GlassCardHeader className="flex flex-row items-start justify-between gap-2">
              <div>
                <GlassCardTitle>Question Themes</GlassCardTitle>
                <GlassCardDescription>Top topics discussed</GlassCardDescription>
              </div>
              <Tag className="h-4 w-4 text-cyan-400" />
            </GlassCardHeader>
            <GlassCardContent>
              {questionThemes.length > 0 ? (
                <div className="space-y-2">
                  {questionThemes.slice(0, 5).map((theme, idx) => (
                    <div key={theme.theme} className="flex items-center justify-between py-1">
                      <span className="text-sm text-white/70 capitalize">{theme.theme}</span>
                      <NeonBadge variant={idx === 0 ? "new" : "default"} data-testid={`badge-theme-${theme.theme}`}>
                        {theme.count}
                      </NeonBadge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-white/40">No conversation data yet</p>
              )}
            </GlassCardContent>
          </GlassCard>

          {/* Message Categories */}
          <GlassCard hover>
            <GlassCardHeader className="flex flex-row items-start justify-between gap-2">
              <div>
                <GlassCardTitle>Message Categories</GlassCardTitle>
                <GlassCardDescription>Topics discussed</GlassCardDescription>
              </div>
              <Tag className="h-4 w-4 text-cyan-400" />
            </GlassCardHeader>
            <GlassCardContent>
              {sortedCategories.length > 0 ? (
                <div className="space-y-2">
                  {sortedCategories.slice(0, 5).map(([category, count], idx) => (
                    <div key={category} className="flex items-center justify-between py-1">
                      <span className="text-xs text-white/70">{categoryLabels[category] || category}</span>
                      <NeonBadge variant={idx === 0 ? "new" : "default"} data-testid={`badge-category-${category}`}>
                        {count}
                      </NeonBadge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-white/40">No categorized data yet</p>
              )}
            </GlassCardContent>
          </GlassCard>

          {/* Engagement Time */}
          <GlassCard hover>
            <GlassCardHeader className="flex flex-row items-start justify-between gap-2">
              <div>
                <GlassCardTitle>Engagement Time</GlassCardTitle>
                <GlassCardDescription>Peak activity hours</GlassCardDescription>
              </div>
              <Clock className="h-4 w-4 text-cyan-400" />
            </GlassCardHeader>
            <GlassCardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-white/85">Peak hour</p>
                  <p className="text-xs text-white/55" data-testid="text-peak-hour">{peakHourLabel}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-white/85">Messages this hour</p>
                  <p className="text-xs text-white/55">{peakHour ? peakHour[1] : 0} interactions</p>
                </div>
              </div>
            </GlassCardContent>
          </GlassCard>
        </div>

        {/* Additional Insights Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Appointment Types */}
          <GlassCard hover>
            <GlassCardHeader>
              <GlassCardTitle>Appointment Types</GlassCardTitle>
              <GlassCardDescription>Breakdown by request type</GlassCardDescription>
            </GlassCardHeader>
            <GlassCardContent>
              <div className="space-y-3">
                {[
                  { label: "Tour Requests", key: "tour", icon: Calendar },
                  { label: "Phone Calls", key: "phone", icon: Phone },
                  { label: "Family Calls", key: "family", icon: MessageSquare },
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                    <div className="flex items-center gap-3">
                      <item.icon className="h-4 w-4 text-cyan-400/70" />
                      <span className="text-sm text-white/70">{item.label}</span>
                    </div>
                    <NeonBadge variant="default" data-testid={`badge-type-${item.key}`}>
                      {appointmentTypeCounts[item.key] || 0}
                    </NeonBadge>
                  </div>
                ))}
              </div>
            </GlassCardContent>
          </GlassCard>

          {/* Pre-Qualification Insights */}
          <GlassCard hover>
            <GlassCardHeader>
              <GlassCardTitle>Pre-Qualification Insights</GlassCardTitle>
              <GlassCardDescription>Who is seeking help</GlassCardDescription>
            </GlassCardHeader>
            <GlassCardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                  <BarChart className="h-5 w-5 text-cyan-400" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white/85">Seeking for self</p>
                    <p className="text-xs text-white/55">{lookingForCounts.self || 0} individuals</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                  <Phone className="h-5 w-5 text-cyan-400" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white/85">Seeking for loved one</p>
                    <p className="text-xs text-white/55">{lookingForCounts.loved_one || 0} family members</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-cyan-400" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white/85">Avg messages per chat</p>
                    <p className="text-xs text-white/55">
                      {summary?.totalConversations && totalMessages > 0 
                        ? (totalMessages / summary.totalConversations).toFixed(1) 
                        : "0"}
                    </p>
                  </div>
                </div>
              </div>
            </GlassCardContent>
          </GlassCard>
        </div>
      </div>
    </AdminLayout>
  );
}

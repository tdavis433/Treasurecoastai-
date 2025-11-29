import { useQuery, useMutation } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin-layout";
import { FuturisticStatCard } from "@/components/ui/futuristic-stat-card";
import { GlassCard, GlassCardHeader, GlassCardTitle, GlassCardDescription, GlassCardContent } from "@/components/ui/glass-card";
import { NeonBadge, StatusBadge } from "@/components/ui/neon-badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  MessageSquare, 
  Calendar, 
  TrendingUp, 
  AlertCircle,
  ArrowRight,
  Sparkles,
  CreditCard,
  Gauge,
  HelpCircle,
  ExternalLink,
  FileText,
  Headphones,
  Mail,
  Zap
} from "lucide-react";
import { useLocation } from "wouter";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
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

interface UsageSummary {
  clientId: string;
  plan: string;
  planName: string;
  limits: {
    name: string;
    monthlyMessages: number;
    monthlyLeads: number;
    features: string[];
  };
  usage: {
    messageCount: number;
    leadCount: number;
  };
  percentages: {
    messages: number;
    leads: number;
  };
}

interface BillingInfo {
  clientId: string;
  hasSubscription: boolean;
  subscription: {
    id: string;
    status: string;
    currentPeriodEnd: string;
    cancelAtPeriodEnd: boolean;
  } | null;
  plan: string;
  planName: string;
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
  const { toast } = useToast();

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

  const { data: usageData, isLoading: usageLoading } = useQuery<UsageSummary>({
    queryKey: ["/api/client/usage"],
  });

  const { data: billingData, isLoading: billingLoading } = useQuery<BillingInfo>({
    queryKey: ["/api/client/billing"],
  });

  const billingPortalMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/client/billing/portal");
      return response.json();
    },
    onSuccess: (data) => {
      if (data.url) {
        window.open(data.url, '_blank');
      }
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Unable to open billing portal. Please contact support.",
        variant: "destructive",
      });
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

        {/* Usage, Billing & Help Section */}
        <div className="grid gap-6 md:grid-cols-3">
          {/* Usage & Limits */}
          <GlassCard data-testid="card-usage-limits">
            <GlassCardHeader>
              <GlassCardTitle className="flex items-center gap-2">
                <Gauge className="h-5 w-5 text-cyan-400" />
                Usage & Limits
              </GlassCardTitle>
              <GlassCardDescription>
                {usageLoading ? 'Loading...' : (usageData?.planName || 'Starter Plan')}
              </GlassCardDescription>
            </GlassCardHeader>
            <GlassCardContent className="space-y-4">
              {usageLoading ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="h-4 bg-white/10 rounded animate-pulse w-full" />
                    <div className="h-2 bg-white/10 rounded animate-pulse w-full" />
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 bg-white/10 rounded animate-pulse w-full" />
                    <div className="h-2 bg-white/10 rounded animate-pulse w-full" />
                  </div>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-white/70">Messages</span>
                      <span className="text-white/90 font-medium" data-testid="text-usage-messages">
                        {usageData?.usage?.messageCount ?? 0} / {usageData?.limits?.monthlyMessages ?? 500}
                      </span>
                    </div>
                    <Progress 
                      value={usageData?.percentages?.messages ?? 0} 
                      className="h-2 bg-white/10"
                      data-testid="progress-messages"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-white/70">Leads</span>
                      <span className="text-white/90 font-medium" data-testid="text-usage-leads">
                        {usageData?.usage?.leadCount ?? 0} / {usageData?.limits?.monthlyLeads ?? 50}
                      </span>
                    </div>
                    <Progress 
                      value={usageData?.percentages?.leads ?? 0} 
                      className="h-2 bg-white/10"
                      data-testid="progress-leads"
                    />
                  </div>
                  {usageData && (usageData.percentages?.messages ?? 0) > 80 && (
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20" data-testid="alert-usage-warning">
                      <Zap className="h-4 w-4 text-amber-400" />
                      <span className="text-xs text-amber-400">Approaching limit - consider upgrading</span>
                    </div>
                  )}
                </>
              )}
            </GlassCardContent>
          </GlassCard>

          {/* Billing */}
          <GlassCard data-testid="card-billing">
            <GlassCardHeader>
              <GlassCardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-emerald-400" />
                Billing
              </GlassCardTitle>
              <GlassCardDescription>
                Manage your subscription
              </GlassCardDescription>
            </GlassCardHeader>
            <GlassCardContent className="space-y-4">
              {billingLoading ? (
                <div className="space-y-4">
                  <div className="h-16 bg-white/10 rounded-lg animate-pulse w-full" />
                  <div className="h-9 bg-white/10 rounded animate-pulse w-full" />
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
                    <div>
                      <p className="text-sm font-medium text-white/90" data-testid="text-billing-plan">{billingData?.planName || 'Starter Plan'}</p>
                      <p className="text-xs text-white/50">Current plan</p>
                    </div>
                    <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" data-testid="badge-billing-status">
                      {billingData?.subscription?.status || 'active'}
                    </Badge>
                  </div>
                  {billingData?.subscription?.currentPeriodEnd && (
                    <p className="text-xs text-white/50" data-testid="text-next-billing">
                      Next billing: {format(new Date(billingData.subscription.currentPeriodEnd), 'MMM d, yyyy')}
                    </p>
                  )}
                  <Button
                    onClick={() => billingPortalMutation.mutate()}
                    disabled={billingPortalMutation.isPending}
                    className="w-full bg-white/10 hover:bg-white/15 text-white border border-white/10"
                    data-testid="button-billing-portal"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    {billingPortalMutation.isPending ? 'Opening...' : 'Manage Subscription'}
                  </Button>
                </>
              )}
            </GlassCardContent>
          </GlassCard>

          {/* Help & Support */}
          <GlassCard data-testid="card-help-support">
            <GlassCardHeader>
              <GlassCardTitle className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-blue-400" />
                Help & Support
              </GlassCardTitle>
              <GlassCardDescription>
                Get assistance when you need it
              </GlassCardDescription>
            </GlassCardHeader>
            <GlassCardContent className="space-y-3">
              <button
                className="w-full flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-left"
                onClick={() => window.open('https://docs.treasurecoastai.com', '_blank')}
                data-testid="button-documentation"
              >
                <FileText className="h-5 w-5 text-white/60" />
                <div>
                  <p className="text-sm font-medium text-white/90">Documentation</p>
                  <p className="text-xs text-white/50">Browse guides & tutorials</p>
                </div>
              </button>
              <button
                className="w-full flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-left"
                onClick={() => window.location.href = 'mailto:support@treasurecoastai.com'}
                data-testid="button-email-support"
              >
                <Mail className="h-5 w-5 text-white/60" />
                <div>
                  <p className="text-sm font-medium text-white/90">Email Support</p>
                  <p className="text-xs text-white/50">support@treasurecoastai.com</p>
                </div>
              </button>
              <button
                className="w-full flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-left"
                data-testid="button-live-chat"
              >
                <Headphones className="h-5 w-5 text-white/60" />
                <div>
                  <p className="text-sm font-medium text-white/90">Live Chat</p>
                  <p className="text-xs text-white/50">Available Mon-Fri 9am-5pm</p>
                </div>
              </button>
            </GlassCardContent>
          </GlassCard>
        </div>
      </div>
    </AdminLayout>
  );
}

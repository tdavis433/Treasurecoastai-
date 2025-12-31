import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle, GlassCardDescription } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { 
  MessageSquare, Users, Calendar, Building2, Bot, TrendingUp, Download, RefreshCw
} from "lucide-react";

interface GlobalAnalytics {
  summary: {
    totalConversations: number;
    totalLeads: number;
    totalAppointments: number;
    activeWorkspaces: number;
    totalBots: number;
  };
  dailyTrends: Array<{
    date: string;
    conversations: number;
    leads: number;
    appointments: number;
  }>;
  topBots: Array<{
    botId: string;
    name: string;
    conversations: number;
    workspaceName: string;
  }>;
}

export default function AnalyticsSection() {
  const [analyticsRange, setAnalyticsRange] = useState<number>(7);

  const { data: globalAnalytics, isLoading } = useQuery<GlobalAnalytics>({
    queryKey: ["/api/super-admin/analytics/global", { days: analyticsRange }],
    queryFn: async () => {
      const response = await fetch(`/api/super-admin/analytics/global?days=${analyticsRange}`, { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch analytics");
      return response.json();
    },
  });

  const handleExportCSV = () => {
    if (!globalAnalytics?.dailyTrends) return;
    const csvContent = 'data:text/csv;charset=utf-8,Date,Conversations,Leads,Appointments\n' +
      globalAnalytics.dailyTrends.map(t => `${t.date},${t.conversations},${t.leads},${t.appointments}`).join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `analytics_${analyticsRange}days.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-6 w-6 animate-spin text-white/40" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-lg font-semibold text-white">Platform Analytics</h2>
          <p className="text-sm text-white/55">Overview of platform-wide metrics and trends</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={String(analyticsRange)} onValueChange={(v) => setAnalyticsRange(Number(v))}>
            <SelectTrigger className="w-[140px] bg-white/5 border-white/10 text-white" data-testid="select-analytics-range">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#1a1d24] border-white/10">
              <SelectItem value="7" className="text-white">Last 7 days</SelectItem>
              <SelectItem value="14" className="text-white">Last 14 days</SelectItem>
              <SelectItem value="30" className="text-white">Last 30 days</SelectItem>
              <SelectItem value="90" className="text-white">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            className="border-white/20 text-white/70 hover:text-white hover:bg-white/10"
            data-testid="button-export-analytics"
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <GlassCard data-testid="card-total-conversations">
          <GlassCardContent className="pt-5 pb-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                <MessageSquare className="h-5 w-5 text-cyan-400" />
              </div>
            </div>
            <p className="text-2xl font-bold text-white">{globalAnalytics?.summary?.totalConversations || 0}</p>
            <p className="text-sm text-white/55">Total Conversations</p>
          </GlassCardContent>
        </GlassCard>

        <GlassCard data-testid="card-total-leads">
          <GlassCardContent className="pt-5 pb-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                <Users className="h-5 w-5 text-green-400" />
              </div>
            </div>
            <p className="text-2xl font-bold text-white">{globalAnalytics?.summary?.totalLeads || 0}</p>
            <p className="text-sm text-white/55">Total Leads</p>
          </GlassCardContent>
        </GlassCard>

        <GlassCard data-testid="card-total-appointments">
          <GlassCardContent className="pt-5 pb-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-purple-400" />
              </div>
            </div>
            <p className="text-2xl font-bold text-white">{globalAnalytics?.summary?.totalAppointments || 0}</p>
            <p className="text-sm text-white/55">Total Appointments</p>
          </GlassCardContent>
        </GlassCard>

        <GlassCard data-testid="card-active-workspaces">
          <GlassCardContent className="pt-5 pb-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                <Building2 className="h-5 w-5 text-amber-400" />
              </div>
            </div>
            <p className="text-2xl font-bold text-white">{globalAnalytics?.summary?.activeWorkspaces || 0}</p>
            <p className="text-sm text-white/55">Active Workspaces</p>
          </GlassCardContent>
        </GlassCard>

        <GlassCard data-testid="card-total-bots">
          <GlassCardContent className="pt-5 pb-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-lg bg-rose-500/20 flex items-center justify-center">
                <Bot className="h-5 w-5 text-rose-400" />
              </div>
            </div>
            <p className="text-2xl font-bold text-white">{globalAnalytics?.summary?.totalBots || 0}</p>
            <p className="text-sm text-white/55">Total Bots</p>
          </GlassCardContent>
        </GlassCard>
      </div>

      <GlassCard>
        <GlassCardHeader>
          <div className="flex items-center justify-between">
            <div>
              <GlassCardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-cyan-400" />
                Daily Trends
              </GlassCardTitle>
              <GlassCardDescription>Conversations, leads, and appointments over time</GlassCardDescription>
            </div>
          </div>
        </GlassCardHeader>
        <GlassCardContent>
          {globalAnalytics?.dailyTrends && globalAnalytics.dailyTrends.length > 0 ? (
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={globalAnalytics.dailyTrends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis 
                    dataKey="date" 
                    stroke="#666"
                    tick={{ fill: '#999', fontSize: 12 }}
                    tickFormatter={(value) => {
                      const date = new Date(value);
                      return `${date.getMonth() + 1}/${date.getDate()}`;
                    }}
                  />
                  <YAxis stroke="#666" tick={{ fill: '#999', fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1a1d24', border: '1px solid #333', borderRadius: '8px' }}
                    labelStyle={{ color: '#999' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="conversations" 
                    stroke="#00e5ff" 
                    strokeWidth={2}
                    dot={{ fill: '#00e5ff', strokeWidth: 2 }}
                    name="Conversations"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="leads" 
                    stroke="#22c55e" 
                    strokeWidth={2}
                    dot={{ fill: '#22c55e', strokeWidth: 2 }}
                    name="Leads"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="appointments" 
                    stroke="#a855f7" 
                    strokeWidth={2}
                    dot={{ fill: '#a855f7', strokeWidth: 2 }}
                    name="Appointments"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="text-center py-12">
              <TrendingUp className="h-12 w-12 mx-auto mb-3 text-white/30" />
              <p className="text-white/55">No trend data available for this period</p>
            </div>
          )}
        </GlassCardContent>
      </GlassCard>

      <GlassCard>
        <GlassCardHeader>
          <GlassCardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-purple-400" />
            Top Performing Bots
          </GlassCardTitle>
          <GlassCardDescription>Bots with the most conversations</GlassCardDescription>
        </GlassCardHeader>
        <GlassCardContent>
          {globalAnalytics?.topBots && globalAnalytics.topBots.length > 0 ? (
            <div className="space-y-3">
              {globalAnalytics.topBots.slice(0, 5).map((bot, index) => (
                <div 
                  key={bot.botId} 
                  className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10"
                  data-testid={`row-top-bot-${bot.botId}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-purple-500/20 flex items-center justify-center text-sm font-bold text-purple-400">
                      #{index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-white">{bot.name}</p>
                      <p className="text-xs text-white/50">{bot.workspaceName}</p>
                    </div>
                  </div>
                  <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30">
                    {bot.conversations} conversations
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Bot className="h-8 w-8 mx-auto mb-2 text-white/30" />
              <p className="text-white/55">No bot activity data available</p>
            </div>
          )}
        </GlassCardContent>
      </GlassCard>
    </div>
  );
}

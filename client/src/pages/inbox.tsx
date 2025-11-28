import { useState, useMemo } from "react";
import { useLocation, useSearch } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { 
  MessageSquare, 
  Search, 
  Calendar, 
  Clock, 
  User, 
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  Filter,
  ArrowUpRight,
  Bot
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { GlassCard } from "@/components/ui/glass-card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import type { ChatSession, ChatAnalyticsEvent } from "@shared/schema";

interface UserProfile {
  user: {
    id: string;
    username: string;
    role: string;
    clientId: string | null;
  };
  clientId: string;
}

export default function InboxPage() {
  const [, setLocation] = useLocation();
  const searchParams = useSearch();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null);

  const urlClientId = useMemo(() => {
    const params = new URLSearchParams(searchParams);
    return params.get('clientId');
  }, [searchParams]);

  const { data: profile } = useQuery<UserProfile>({
    queryKey: ["/api/client/me"],
    enabled: !urlClientId,
  });

  const effectiveClientId = urlClientId || profile?.clientId || 'faith_house';
  const isSuperAdmin = profile?.user?.role === 'super_admin';

  const buildQueryUrl = (base: string, params?: Record<string, string | undefined>) => {
    const queryParams: string[] = [];
    if (isSuperAdmin || urlClientId) {
      queryParams.push(`clientId=${encodeURIComponent(effectiveClientId)}`);
    }
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value) queryParams.push(`${key}=${encodeURIComponent(value)}`);
      });
    }
    return queryParams.length > 0 ? `${base}?${queryParams.join('&')}` : base;
  };

  const { data: sessionsData, isLoading: sessionsLoading } = useQuery<{
    clientId: string;
    sessions: ChatSession[];
    total: number;
  }>({
    queryKey: [buildQueryUrl("/api/client/analytics/sessions", { limit: "100" })],
  });

  const { data: messagesData, isLoading: messagesLoading } = useQuery<{
    clientId: string;
    sessionId: string;
    messages: ChatAnalyticsEvent[];
    total: number;
  }>({
    queryKey: [buildQueryUrl(`/api/client/inbox/sessions/${selectedSession?.sessionId}`)],
    enabled: !!selectedSession,
  });

  const filteredSessions = useMemo(() => {
    if (!sessionsData?.sessions) return [];
    
    let filtered = sessionsData.sessions;
    
    if (statusFilter === "crisis") {
      filtered = filtered.filter(s => s.crisisDetected);
    } else if (statusFilter === "appointment") {
      filtered = filtered.filter(s => s.appointmentRequested);
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(s => 
        s.sessionId.toLowerCase().includes(query) ||
        s.botId.toLowerCase().includes(query) ||
        (s.topics as string[] || []).some(t => t.toLowerCase().includes(query))
      );
    }
    
    return filtered;
  }, [sessionsData, statusFilter, searchQuery]);

  const formatTimeAgo = (date: Date | string) => {
    const now = new Date();
    const then = new Date(date);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return format(then, "MMM d");
  };

  const renderSessionList = () => {
    if (sessionsLoading) {
      return (
        <div className="space-y-2">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-20 w-full bg-white/5" />
          ))}
        </div>
      );
    }

    if (filteredSessions.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-16 text-white/55">
          <MessageSquare className="h-12 w-12 mb-4 opacity-50" />
          <p className="text-lg font-medium">No conversations yet</p>
          <p className="text-sm">Conversations will appear here once users start chatting</p>
        </div>
      );
    }

    return (
      <div className="space-y-2" data-testid="session-list">
        {filteredSessions.map((session) => (
          <button
            key={session.id}
            onClick={() => setSelectedSession(session)}
            className={`w-full text-left p-4 rounded-lg border transition-all ${
              selectedSession?.id === session.id
                ? "bg-cyan-500/10 border-cyan-500/30"
                : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20"
            }`}
            data-testid={`session-item-${session.sessionId}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-white/85 font-medium truncate">
                    {session.botId}
                  </span>
                  {session.crisisDetected && (
                    <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-xs">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Crisis
                    </Badge>
                  )}
                  {session.appointmentRequested && (
                    <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs">
                      <Calendar className="h-3 w-3 mr-1" />
                      Appt
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-3 text-white/55 text-sm">
                  <span className="flex items-center gap-1">
                    <MessageSquare className="h-3.5 w-3.5" />
                    {session.userMessageCount + session.botMessageCount}
                  </span>
                  <span>Session: {session.sessionId.slice(0, 8)}...</span>
                </div>
                {(session.topics as string[] || []).length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {(session.topics as string[] || []).slice(0, 3).map((topic, i) => (
                      <Badge 
                        key={i} 
                        variant="outline" 
                        className="text-xs bg-white/5 text-white/55 border-white/10"
                      >
                        {topic}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              <div className="text-white/40 text-xs text-right">
                {formatTimeAgo(session.startedAt)}
              </div>
            </div>
          </button>
        ))}
      </div>
    );
  };

  const renderMessageThread = () => {
    if (!selectedSession) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-white/55">
          <MessageSquare className="h-16 w-16 mb-4 opacity-30" />
          <p className="text-lg font-medium">Select a conversation</p>
          <p className="text-sm">Choose a conversation from the list to view messages</p>
        </div>
      );
    }

    if (messagesLoading) {
      return (
        <div className="p-6 space-y-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className={`flex ${i % 2 === 0 ? "justify-start" : "justify-end"}`}>
              <Skeleton className={`h-16 ${i % 2 === 0 ? "w-2/3" : "w-1/2"} bg-white/5`} />
            </div>
          ))}
        </div>
      );
    }

    const messages = messagesData?.messages || [];

    return (
      <div className="flex flex-col h-full">
        <div className="px-6 py-4 border-b border-white/10 bg-white/5">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-white font-semibold">{selectedSession.botId}</h3>
                {selectedSession.crisisDetected && (
                  <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                    Crisis Detected
                  </Badge>
                )}
              </div>
              <p className="text-white/55 text-sm">
                Session: {selectedSession.sessionId}
              </p>
            </div>
            <div className="flex items-center gap-2 text-white/55 text-sm">
              <Clock className="h-4 w-4" />
              {format(new Date(selectedSession.startedAt), "MMM d, yyyy h:mm a")}
            </div>
          </div>
        </div>

        <ScrollArea className="flex-1 p-6">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-white/55">
              <MessageSquare className="h-12 w-12 mb-4 opacity-50" />
              <p>No messages in this conversation</p>
            </div>
          ) : (
            <div className="space-y-4" data-testid="message-thread">
              {messages.map((msg, i) => (
                <div
                  key={msg.id || i}
                  className={`flex ${msg.actor === "user" ? "justify-start" : "justify-end"}`}
                  data-testid={`message-${msg.actor}-${i}`}
                >
                  <div
                    className={`max-w-[75%] rounded-lg px-4 py-3 ${
                      msg.actor === "user"
                        ? "bg-white/10 border border-white/10"
                        : "bg-cyan-500/20 border border-cyan-500/30"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {msg.actor === "user" ? (
                        <User className="h-3.5 w-3.5 text-white/55" />
                      ) : (
                        <Bot className="h-3.5 w-3.5 text-cyan-400" />
                      )}
                      <span className={`text-xs ${msg.actor === "user" ? "text-white/55" : "text-cyan-400"}`}>
                        {msg.actor === "user" ? "Visitor" : "Bot"}
                      </span>
                      <span className="text-white/40 text-xs">
                        {format(new Date(msg.createdAt), "h:mm a")}
                      </span>
                    </div>
                    <p className="text-white/85 text-sm whitespace-pre-wrap">
                      {msg.messageContent || "(No content)"}
                    </p>
                    {msg.category && (
                      <Badge 
                        variant="outline" 
                        className="mt-2 text-xs bg-white/5 text-white/55 border-white/10"
                      >
                        {msg.category}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        <div className="px-6 py-4 border-t border-white/10 bg-white/5">
          <div className="flex items-center justify-between text-white/55 text-sm">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <User className="h-4 w-4" />
                {selectedSession.userMessageCount} user messages
              </span>
              <span className="flex items-center gap-1">
                <Bot className="h-4 w-4" />
                {selectedSession.botMessageCount} bot messages
              </span>
            </div>
            {selectedSession.endedAt && (
              <span className="flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4" />
                Ended: {format(new Date(selectedSession.endedAt), "h:mm a")}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#0B0E13]">
      <div className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation(isSuperAdmin ? "/super-admin/control-center" : "/client/dashboard")}
            className="text-white/55 hover:text-white hover:bg-white/10"
            data-testid="button-back"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <MessageSquare className="h-7 w-7 text-cyan-400" />
              Inbox
            </h1>
            <p className="text-white/55 text-sm">
              View and manage chat conversations
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" style={{ height: "calc(100vh - 160px)" }}>
          <GlassCard className="lg:col-span-1 flex flex-col overflow-hidden">
            <div className="p-4 border-b border-white/10 space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                <Input
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/40"
                  data-testid="input-search"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white/85" data-testid="select-filter">
                  <Filter className="h-4 w-4 mr-2 text-white/40" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1f2e] border-white/10">
                  <SelectItem value="all" className="text-white/85">All Conversations</SelectItem>
                  <SelectItem value="crisis" className="text-white/85">Crisis Detected</SelectItem>
                  <SelectItem value="appointment" className="text-white/85">Appointment Requests</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <ScrollArea className="flex-1 p-4">
              {renderSessionList()}
            </ScrollArea>
            <div className="px-4 py-3 border-t border-white/10 bg-white/5">
              <p className="text-white/40 text-sm text-center">
                {filteredSessions.length} of {sessionsData?.total || 0} conversations
              </p>
            </div>
          </GlassCard>

          <GlassCard className="lg:col-span-2 flex flex-col overflow-hidden">
            {renderMessageThread()}
          </GlassCard>
        </div>
      </div>
    </div>
  );
}

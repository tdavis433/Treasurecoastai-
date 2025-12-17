import { useState, useMemo, useEffect, useRef } from "react";
import { useLocation, useSearch } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
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
  Bot,
  StickyNote,
  Plus,
  Trash2,
  Pin,
  Eye,
  EyeOff,
  Send
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { GlassCard } from "@/components/ui/glass-card";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import type { ChatSession, ChatAnalyticsEvent, ConversationNote, SessionState } from "@shared/schema";

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
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null);
  const [newNoteContent, setNewNoteContent] = useState("");
  const [activeTab, setActiveTab] = useState("messages");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const urlClientId = useMemo(() => {
    const params = new URLSearchParams(searchParams);
    return params.get('clientId');
  }, [searchParams]);

  const urlSessionId = useMemo(() => {
    const params = new URLSearchParams(searchParams);
    return params.get('session');
  }, [searchParams]);

  const urlBotId = useMemo(() => {
    const params = new URLSearchParams(searchParams);
    return params.get('botId');
  }, [searchParams]);

  // Always fetch auth/me to determine user role (needed for super admin endpoint selection)
  const { data: authData, isLoading: authLoading } = useQuery<{ id: number; username: string; role: string }>({
    queryKey: ["/api/auth/me"],
  });

  const { data: profile } = useQuery<UserProfile>({
    queryKey: ["/api/client/me"],
    enabled: !urlClientId,
  });

  const isSuperAdmin = authData?.role === 'super_admin';
  const effectiveClientId = urlClientId || profile?.clientId || 'faith_house';
  const useSuperAdminEndpoints = isSuperAdmin && !!urlClientId;
  const authReady = !authLoading && !!authData;

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

  const buildSessionMessagesUrl = (sessionId: string) => {
    if (useSuperAdminEndpoints) {
      return `/api/super-admin/clients/${effectiveClientId}/sessions/${sessionId}/messages`;
    }
    return buildQueryUrl(`/api/client/inbox/sessions/${sessionId}`);
  };

  const buildSessionStateUrl = (sessionId: string) => {
    if (useSuperAdminEndpoints) {
      return `/api/super-admin/clients/${effectiveClientId}/sessions/${sessionId}/state`;
    }
    return buildQueryUrl(`/api/client/inbox/sessions/${sessionId}/state`);
  };

  const buildSessionsListUrl = () => {
    if (useSuperAdminEndpoints) {
      return `/api/super-admin/clients/${effectiveClientId}/sessions?limit=100`;
    }
    return buildQueryUrl("/api/client/analytics/sessions", { limit: "100" });
  };

  const { data: sessionsData, isLoading: sessionsLoading } = useQuery<{
    clientId: string;
    sessions: ChatSession[];
    total: number;
  }>({
    queryKey: [buildSessionsListUrl()],
    enabled: authReady,
  });

  // Auto-select session from URL parameter
  useEffect(() => {
    if (urlSessionId && sessionsData?.sessions && !selectedSession) {
      const session = sessionsData.sessions.find(s => s.sessionId === urlSessionId);
      if (session) {
        setSelectedSession(session);
      }
    }
  }, [urlSessionId, sessionsData, selectedSession]);

  const { data: messagesData, isLoading: messagesLoading } = useQuery<{
    clientId: string;
    sessionId: string;
    messages: ChatAnalyticsEvent[];
    total: number;
  }>({
    queryKey: [selectedSession ? buildSessionMessagesUrl(selectedSession.sessionId) : null],
    enabled: !!selectedSession,
  });

  // Fetch notes for the selected session (only for client endpoints - super admin has read-only view)
  const { data: notesData } = useQuery<{ notes: ConversationNote[] }>({
    queryKey: [buildQueryUrl(`/api/client/inbox/sessions/${selectedSession?.sessionId}/notes`)],
    enabled: !!selectedSession && !useSuperAdminEndpoints,
  });

  // Fetch session state
  const { data: sessionStateData, refetch: refetchSessionState } = useQuery<SessionState>({
    queryKey: [selectedSession ? buildSessionStateUrl(selectedSession.sessionId) : null],
    enabled: !!selectedSession,
  });

  // Mutations for notes
  const createNoteMutation = useMutation({
    mutationFn: async (data: { content: string; botId: string }) => {
      const url = buildQueryUrl(`/api/client/inbox/sessions/${selectedSession?.sessionId}/notes`);
      return apiRequest("POST", url, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: [buildQueryUrl(`/api/client/inbox/sessions/${selectedSession?.sessionId}/notes`)] 
      });
      setNewNoteContent("");
      toast({ title: "Note added" });
    },
    onError: () => {
      toast({ title: "Failed to add note", variant: "destructive" });
    },
  });

  const deleteNoteMutation = useMutation({
    mutationFn: async (noteId: string) => {
      const url = buildQueryUrl(`/api/client/inbox/notes/${noteId}`);
      return apiRequest("DELETE", url);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: [buildQueryUrl(`/api/client/inbox/sessions/${selectedSession?.sessionId}/notes`)] 
      });
      toast({ title: "Note deleted" });
    },
  });

  // Mutations for session state
  const updateSessionStateMutation = useMutation({
    mutationFn: async (updates: Partial<SessionState>) => {
      const url = buildQueryUrl(`/api/client/inbox/sessions/${selectedSession?.sessionId}/state`);
      return apiRequest("PATCH", url, updates);
    },
    onSuccess: () => {
      refetchSessionState();
      toast({ title: "Session updated" });
    },
    onError: () => {
      toast({ title: "Failed to update session", variant: "destructive" });
    },
  });

  // Auto-scroll to bottom when messages load or change
  useEffect(() => {
    if (messagesEndRef.current && messagesData?.messages?.length) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messagesData?.messages]);

  const handleAddNote = () => {
    if (!newNoteContent.trim() || !selectedSession) return;
    createNoteMutation.mutate({
      content: newNoteContent,
      botId: selectedSession.botId,
    });
  };

  const handleToggleRead = () => {
    const newIsRead = !sessionStateData?.isRead;
    updateSessionStateMutation.mutate({ isRead: newIsRead });
  };

  const handleStatusChange = (status: string) => {
    updateSessionStateMutation.mutate({ status });
  };

  const filteredSessions = useMemo(() => {
    if (!sessionsData?.sessions) return [];
    
    let filtered = sessionsData.sessions;
    
    // Hide sessions with 0 messages (empty/abandoned sessions)
    filtered = filtered.filter(s => (s.userMessageCount || 0) + (s.botMessageCount || 0) > 0);
    
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
  
  // Helper to get a meaningful session preview snippet
  const getSessionSnippet = (session: ChatSession): string => {
    const metadata = session.metadata as { aiSummary?: string; userIntent?: string } | null;
    if (metadata?.aiSummary) {
      return metadata.aiSummary.slice(0, 80) + (metadata.aiSummary.length > 80 ? '...' : '');
    }
    if (metadata?.userIntent) {
      return metadata.userIntent;
    }
    const topics = session.topics as string[] || [];
    if (topics.length > 0) {
      return topics.slice(0, 2).join(', ');
    }
    if (session.appointmentRequested) {
      return 'Requested appointment';
    }
    return 'Conversation started';
  };

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
                <p className="text-white/55 text-sm line-clamp-1 mb-1">
                  {getSessionSnippet(session)}
                </p>
                <div className="flex items-center gap-3 text-white/45 text-xs">
                  <span className="flex items-center gap-1">
                    <MessageSquare className="h-3 w-3" />
                    {session.userMessageCount + session.botMessageCount} msgs
                  </span>
                  <span>ID: {session.sessionId.slice(0, 8)}</span>
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

    const notes = notesData?.notes || [];
    const sessionState = sessionStateData;

    return (
      <div className="flex flex-col h-full">
        <div className="px-6 py-4 border-b border-white/10 bg-white/5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-white font-semibold">{selectedSession.botId}</h3>
                {selectedSession.crisisDetected && (
                  <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                    Crisis Detected
                  </Badge>
                )}
                {sessionState && !sessionState.isRead && (
                  <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30">
                    Unread
                  </Badge>
                )}
              </div>
              <p className="text-white/55 text-sm">
                Session: {selectedSession.sessionId}
              </p>
            </div>
            <div className="flex items-center gap-2 text-white/55 text-sm">
              <Clock className="h-4 w-4" />
              {selectedSession.startedAt ? format(new Date(selectedSession.startedAt), "MMM d, yyyy h:mm a") : "N/A"}
            </div>
          </div>
          
          {/* Session State Controls - hidden for super admin read-only view */}
          {!useSuperAdminEndpoints && (
            <div className="flex items-center gap-3 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={handleToggleRead}
                disabled={updateSessionStateMutation.isPending}
                className="border-white/20 text-white/85 hover:bg-white/10"
                data-testid="button-toggle-read"
              >
                {sessionState?.isRead ? (
                  <>
                    <EyeOff className="h-3.5 w-3.5 mr-1.5" />
                    Mark Unread
                  </>
                ) : (
                  <>
                    <Eye className="h-3.5 w-3.5 mr-1.5" />
                    Mark Read
                  </>
                )}
              </Button>
              
              <Select 
                value={sessionState?.status || "open"} 
                onValueChange={handleStatusChange}
              >
                <SelectTrigger 
                  className="w-[140px] bg-white/5 border-white/20 text-white/85"
                  data-testid="select-session-status"
                >
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1f2e] border-white/10">
                  <SelectItem value="open" className="text-white/85">Open</SelectItem>
                  <SelectItem value="closed" className="text-white/85">Closed</SelectItem>
                  <SelectItem value="pending" className="text-white/85">Pending</SelectItem>
                  <SelectItem value="archived" className="text-white/85">Archived</SelectItem>
                </SelectContent>
              </Select>

              <Select 
                value={sessionState?.priority || "normal"} 
                onValueChange={(priority) => updateSessionStateMutation.mutate({ priority })}
              >
                <SelectTrigger 
                  className="w-[120px] bg-white/5 border-white/20 text-white/85"
                  data-testid="select-session-priority"
                >
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1f2e] border-white/10">
                  <SelectItem value="low" className="text-white/85">Low</SelectItem>
                  <SelectItem value="normal" className="text-white/85">Normal</SelectItem>
                  <SelectItem value="high" className="text-white/85">High</SelectItem>
                  <SelectItem value="urgent" className="text-white/85">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          {useSuperAdminEndpoints && (
            <div className="flex items-center gap-2 text-white/55 text-sm">
              <Badge variant="outline" className="border-white/20">Read-Only View</Badge>
            </div>
          )}
        </div>

        {/* Tabs for Messages and Notes */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <TabsList className="mx-6 mt-3 bg-white/5 border border-white/10">
            <TabsTrigger 
              value="messages" 
              className="data-[state=active]:bg-white/10 data-[state=active]:text-white"
              data-testid="tab-messages"
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Messages ({messages.length})
            </TabsTrigger>
            {!useSuperAdminEndpoints && (
              <TabsTrigger 
                value="notes" 
                className="data-[state=active]:bg-white/10 data-[state=active]:text-white"
                data-testid="tab-notes"
              >
                <StickyNote className="h-4 w-4 mr-2" />
                Notes ({notes.length})
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="messages" className="flex-1 m-0 flex flex-col">
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
                            {msg.createdAt ? format(new Date(msg.createdAt), "h:mm a") : ""}
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
                  <div ref={messagesEndRef} />
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          {!useSuperAdminEndpoints && (
            <TabsContent value="notes" className="flex-1 m-0 flex flex-col">
              <ScrollArea className="flex-1 p-6">
                {notes.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-white/55">
                    <StickyNote className="h-12 w-12 mb-4 opacity-50" />
                    <p>No notes yet</p>
                    <p className="text-sm">Add notes to track important details</p>
                  </div>
                ) : (
                  <div className="space-y-3" data-testid="notes-list">
                    {notes.map((note) => (
                      <div
                        key={note.id}
                        className="bg-white/5 border border-white/10 rounded-lg p-4"
                        data-testid={`note-${note.id}`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2 text-white/55 text-xs">
                            <User className="h-3.5 w-3.5" />
                            <span>{note.authorName}</span>
                            <span>|</span>
                            <span>{note.createdAt ? format(new Date(note.createdAt), "MMM d, h:mm a") : ""}</span>
                            {note.isPinned && (
                              <Pin className="h-3.5 w-3.5 text-yellow-400" />
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-white/40 hover:text-red-400 hover:bg-red-500/10"
                            onClick={() => deleteNoteMutation.mutate(note.id)}
                            data-testid={`button-delete-note-${note.id}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                        <p className="text-white/85 text-sm whitespace-pre-wrap">{note.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>

              {/* Add Note Input */}
              <div className="p-4 border-t border-white/10 bg-white/5">
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Add a note..."
                    value={newNoteContent}
                    onChange={(e) => setNewNoteContent(e.target.value)}
                    className="flex-1 min-h-[60px] bg-white/5 border-white/10 text-white placeholder:text-white/40 resize-none"
                    data-testid="input-new-note"
                  />
                  <Button
                    onClick={handleAddNote}
                    disabled={!newNoteContent.trim() || createNoteMutation.isPending}
                    className="bg-cyan-500 hover:bg-cyan-600 text-white"
                    data-testid="button-add-note"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </TabsContent>
          )}
        </Tabs>

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
                Ended: {selectedSession.endedAt ? format(new Date(selectedSession.endedAt), "h:mm a") : ""}
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
            onClick={() => setLocation(isSuperAdmin ? "/super-admin" : "/client/dashboard")}
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-160px)]">
          <GlassCard className="lg:col-span-1 flex flex-col h-full overflow-hidden">
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

          <GlassCard className="lg:col-span-2 flex flex-col h-full overflow-hidden">
            {renderMessageThread()}
          </GlassCard>
        </div>
      </div>
    </div>
  );
}

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle, GlassCardDescription } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  AlertCircle, Info, AlertTriangle, CheckCircle, ChevronDown, RefreshCw, FileText, Filter
} from "lucide-react";
import type { Workspace } from "../../types";

interface SystemLog {
  id: string;
  level: 'info' | 'warn' | 'error';
  source: string;
  message: string;
  metadata?: Record<string, unknown>;
  stack?: string;
  workspaceId?: string;
  clientId?: string;
  isResolved: boolean;
  resolvedAt?: string;
  resolvedBy?: string;
  resolutionNotes?: string;
  createdAt: string;
}

interface LogsResponse {
  logs: SystemLog[];
  total: number;
  unresolved: number;
}

export default function LogsSection() {
  const { toast } = useToast();
  const [logFilters, setLogFilters] = useState({
    level: 'all',
    source: 'all',
    isResolved: 'all',
    clientId: 'all',
  });
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const { data: workspacesData } = useQuery<{ workspaces: Workspace[]; total: number }>({
    queryKey: ['/api/super-admin/workspaces'],
  });
  const workspaces = workspacesData?.workspaces || [];

  const { data: logsData, isLoading, refetch } = useQuery<LogsResponse>({
    queryKey: ['/api/super-admin/logs', logFilters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (logFilters.level !== 'all') params.append('level', logFilters.level);
      if (logFilters.source !== 'all') params.append('source', logFilters.source);
      if (logFilters.isResolved !== 'all') params.append('isResolved', logFilters.isResolved);
      if (logFilters.clientId !== 'all') params.append('clientId', logFilters.clientId);
      const response = await fetch(`/api/super-admin/logs?${params.toString()}`, { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch logs");
      return response.json();
    },
  });

  const resolveLogMutation = useMutation({
    mutationFn: async (logId: string) => {
      return apiRequest('PATCH', `/api/super-admin/logs/${logId}/resolve`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/super-admin/logs'] });
      toast({ title: 'Success', description: 'Log marked as resolved' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to resolve log', variant: 'destructive' });
    }
  });

  const logs = logsData?.logs || [];
  const total = logsData?.total || 0;
  const unresolved = logsData?.unresolved || 0;

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'error': return <AlertCircle className="h-4 w-4 text-red-400" />;
      case 'warn': return <AlertTriangle className="h-4 w-4 text-amber-400" />;
      default: return <Info className="h-4 w-4 text-cyan-400" />;
    }
  };

  const getLevelBadge = (level: string) => {
    switch (level) {
      case 'error': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'warn': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      default: return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30';
    }
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
          <h2 className="text-lg font-semibold text-white">System Logs</h2>
          <p className="text-sm text-white/55">Monitor platform activity and troubleshoot issues</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge className="bg-white/10 text-white/70">{total} total logs</Badge>
          {unresolved > 0 && (
            <Badge className="bg-red-500/20 text-red-400 border-red-500/30">{unresolved} unresolved</Badge>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="border-white/20 text-white/70 hover:text-white hover:bg-white/10"
            data-testid="button-refresh-logs"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-white/40" />
          <span className="text-sm text-white/55">Filters:</span>
        </div>
        <Select value={logFilters.level} onValueChange={(v) => setLogFilters(f => ({ ...f, level: v }))}>
          <SelectTrigger className="w-[130px] bg-white/5 border-white/10 text-white" data-testid="select-log-level">
            <SelectValue placeholder="Level" />
          </SelectTrigger>
          <SelectContent className="bg-[#1a1d24] border-white/10">
            <SelectItem value="all" className="text-white">All Levels</SelectItem>
            <SelectItem value="info" className="text-white">Info</SelectItem>
            <SelectItem value="warn" className="text-white">Warning</SelectItem>
            <SelectItem value="error" className="text-white">Error</SelectItem>
          </SelectContent>
        </Select>
        <Select value={logFilters.source} onValueChange={(v) => setLogFilters(f => ({ ...f, source: v }))}>
          <SelectTrigger className="w-[130px] bg-white/5 border-white/10 text-white" data-testid="select-log-source">
            <SelectValue placeholder="Source" />
          </SelectTrigger>
          <SelectContent className="bg-[#1a1d24] border-white/10">
            <SelectItem value="all" className="text-white">All Sources</SelectItem>
            <SelectItem value="api" className="text-white">API</SelectItem>
            <SelectItem value="bot" className="text-white">Bot</SelectItem>
            <SelectItem value="auth" className="text-white">Auth</SelectItem>
            <SelectItem value="system" className="text-white">System</SelectItem>
          </SelectContent>
        </Select>
        <Select value={logFilters.isResolved} onValueChange={(v) => setLogFilters(f => ({ ...f, isResolved: v }))}>
          <SelectTrigger className="w-[140px] bg-white/5 border-white/10 text-white" data-testid="select-log-status">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="bg-[#1a1d24] border-white/10">
            <SelectItem value="all" className="text-white">All Status</SelectItem>
            <SelectItem value="false" className="text-white">Unresolved</SelectItem>
            <SelectItem value="true" className="text-white">Resolved</SelectItem>
          </SelectContent>
        </Select>
        <Select value={logFilters.clientId} onValueChange={(v) => setLogFilters(f => ({ ...f, clientId: v }))}>
          <SelectTrigger className="w-[160px] bg-white/5 border-white/10 text-white" data-testid="select-log-client">
            <SelectValue placeholder="Client" />
          </SelectTrigger>
          <SelectContent className="bg-[#1a1d24] border-white/10">
            <SelectItem value="all" className="text-white">All Clients</SelectItem>
            {workspaces.map(ws => (
              <SelectItem key={ws.slug} value={ws.slug} className="text-white">
                {ws.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {logs.length === 0 ? (
        <GlassCard>
          <GlassCardContent className="py-12 text-center">
            <FileText className="h-12 w-12 mx-auto mb-3 text-white/30" />
            <p className="text-white/55">No logs match your filters</p>
          </GlassCardContent>
        </GlassCard>
      ) : (
        <div className="space-y-3">
          {logs.map(log => (
            <Collapsible
              key={log.id}
              open={expandedLogId === log.id}
              onOpenChange={(open) => setExpandedLogId(open ? log.id : null)}
            >
              <GlassCard data-testid={`card-log-${log.id}`}>
                <GlassCardContent className="py-3">
                  <CollapsibleTrigger asChild>
                    <div className="flex items-center justify-between cursor-pointer">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {getLevelIcon(log.level)}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge className={getLevelBadge(log.level)}>{log.level}</Badge>
                            <Badge className="bg-white/10 text-white/60 text-xs">{log.source}</Badge>
                            {log.isResolved && (
                              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Resolved
                              </Badge>
                            )}
                            <span className="text-xs text-white/40">
                              {new Date(log.createdAt).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-sm text-white mt-1 truncate">{log.message}</p>
                        </div>
                      </div>
                      <ChevronDown className={`h-4 w-4 text-white/40 transition-transform ${expandedLogId === log.id ? 'rotate-180' : ''}`} />
                    </div>
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent>
                    <div className="mt-4 pt-4 border-t border-white/10 space-y-3">
                      <div>
                        <p className="text-xs text-white/50 mb-1">Full Message</p>
                        <p className="text-sm text-white bg-white/5 p-2 rounded">{log.message}</p>
                      </div>
                      
                      {log.metadata && Object.keys(log.metadata).length > 0 && (
                        <div>
                          <p className="text-xs text-white/50 mb-1">Metadata</p>
                          <pre className="text-xs text-white/70 bg-white/5 p-2 rounded overflow-x-auto">
                            {JSON.stringify(log.metadata, null, 2)}
                          </pre>
                        </div>
                      )}
                      
                      {log.stack && (
                        <div>
                          <p className="text-xs text-white/50 mb-1">Stack Trace</p>
                          <pre className="text-xs text-red-400/70 bg-red-500/5 p-2 rounded overflow-x-auto max-h-[200px]">
                            {log.stack}
                          </pre>
                        </div>
                      )}
                      
                      {log.clientId && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-white/50">Client:</span>
                          <Badge className="bg-white/10 text-white/60 text-xs">{log.clientId}</Badge>
                        </div>
                      )}
                      
                      {!log.isResolved && (
                        <Button
                          size="sm"
                          onClick={() => resolveLogMutation.mutate(log.id)}
                          disabled={resolveLogMutation.isPending}
                          className="bg-green-500 hover:bg-green-600 text-white"
                          data-testid={`button-resolve-log-${log.id}`}
                        >
                          {resolveLogMutation.isPending ? (
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <CheckCircle className="h-4 w-4 mr-2" />
                          )}
                          Mark as Resolved
                        </Button>
                      )}
                      
                      {log.isResolved && log.resolvedAt && (
                        <div className="text-xs text-white/40">
                          Resolved on {new Date(log.resolvedAt).toLocaleString()}
                          {log.resolvedBy && ` by ${log.resolvedBy}`}
                        </div>
                      )}
                    </div>
                  </CollapsibleContent>
                </GlassCardContent>
              </GlassCard>
            </Collapsible>
          ))}
        </div>
      )}
    </div>
  );
}

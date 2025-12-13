import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { GlassCard, GlassCardHeader, GlassCardTitle, GlassCardContent } from "@/components/ui/glass-card";
import { TreasureCoastLogo } from "@/components/treasure-coast-logo";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  Shield, ArrowLeft, Search, Filter, Calendar, User, Activity,
  LogOut, RefreshCw, ChevronLeft, ChevronRight, Clock, FileText
} from "lucide-react";
import { format } from "date-fns";

interface AuditLog {
  id: string;
  userId: string;
  username: string;
  userRole?: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  clientId?: string;
  workspaceId?: string;
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

interface AuditLogsResponse {
  logs: AuditLog[];
  total: number;
}

interface ActionTypesResponse {
  actions: string[];
  resourceTypes: string[];
}

export default function SuperAdminAuditLogs() {
  const [, setLocation] = useLocation();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [resourceFilter, setResourceFilter] = useState<string>("all");
  const limit = 50;

  const { data: user } = useQuery<{ id: string; username: string; role: string }>({
    queryKey: ["/api/auth/me"],
    retry: false,
  });

  const { data: actionTypes } = useQuery<ActionTypesResponse>({
    queryKey: ["/api/admin/audit-logs/actions"],
    enabled: user?.role === "super_admin",
  });

  const queryParams = new URLSearchParams();
  queryParams.set("limit", String(limit));
  queryParams.set("offset", String((page - 1) * limit));
  if (actionFilter && actionFilter !== "all") queryParams.set("action", actionFilter);
  if (resourceFilter && resourceFilter !== "all") queryParams.set("resourceType", resourceFilter);

  const { data: auditData, isLoading, refetch } = useQuery<AuditLogsResponse>({
    queryKey: ["/api/admin/audit-logs", page, actionFilter, resourceFilter],
    queryFn: async () => {
      const res = await fetch(`/api/admin/audit-logs?${queryParams.toString()}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch audit logs");
      return res.json();
    },
    enabled: user?.role === "super_admin",
  });

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    setLocation("/login");
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (user.role !== "super_admin") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <GlassCard className="max-w-md">
          <GlassCardContent className="p-6 text-center">
            <Shield className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-muted-foreground mb-4">
              Super admin access required to view audit logs.
            </p>
            <Button onClick={() => setLocation("/login")} variant="outline">
              Return to Login
            </Button>
          </GlassCardContent>
        </GlassCard>
      </div>
    );
  }

  const totalPages = auditData ? Math.ceil(auditData.total / limit) : 0;

  const getActionBadgeVariant = (action: string): "default" | "secondary" | "destructive" | "outline" => {
    if (action.includes("delete") || action.includes("reset")) return "destructive";
    if (action.includes("create") || action.includes("login")) return "default";
    if (action.includes("update") || action.includes("change")) return "secondary";
    return "outline";
  };

  const formatDetails = (details: Record<string, any>): string => {
    if (!details || Object.keys(details).length === 0) return "-";
    try {
      return JSON.stringify(details, null, 2).slice(0, 200);
    } catch {
      return "-";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setLocation("/super-admin")}
              data-testid="button-back"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <TreasureCoastLogo size="sm" />
            <Separator orientation="vertical" className="h-6" />
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <span className="font-semibold">Audit Logs</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="gap-1">
              <User className="h-3 w-3" />
              {user.username}
            </Badge>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleLogout}
              data-testid="button-logout"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container px-4 py-6">
        <GlassCard>
          <GlassCardHeader className="flex flex-row items-center justify-between gap-4 flex-wrap">
            <GlassCardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              System Audit Logs
            </GlassCardTitle>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => refetch()}
                data-testid="button-refresh"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </GlassCardHeader>

          <GlassCardContent>
            <div className="flex flex-wrap gap-4 mb-6">
              <div className="flex-1 min-w-[200px]">
                <Label className="text-sm text-muted-foreground mb-1.5 block">Filter by Action</Label>
                <Select value={actionFilter} onValueChange={(v) => { setActionFilter(v); setPage(1); }}>
                  <SelectTrigger data-testid="select-action-filter">
                    <SelectValue placeholder="All actions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Actions</SelectItem>
                    {actionTypes?.actions.map((action) => (
                      <SelectItem key={action} value={action}>{action}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1 min-w-[200px]">
                <Label className="text-sm text-muted-foreground mb-1.5 block">Filter by Resource</Label>
                <Select value={resourceFilter} onValueChange={(v) => { setResourceFilter(v); setPage(1); }}>
                  <SelectTrigger data-testid="select-resource-filter">
                    <SelectValue placeholder="All resources" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Resources</SelectItem>
                    {actionTypes?.resourceTypes.map((type) => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : auditData?.logs.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No audit logs found</p>
              </div>
            ) : (
              <ScrollArea className="h-[600px]">
                <div className="space-y-3">
                  {auditData?.logs.map((log) => (
                    <div 
                      key={log.id} 
                      className="p-4 rounded-lg border border-border/50 bg-card/50 hover-elevate"
                      data-testid={`audit-log-${log.id}`}
                    >
                      <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-2">
                            <Badge variant={getActionBadgeVariant(log.action)}>
                              {log.action}
                            </Badge>
                            <Badge variant="outline">{log.resourceType}</Badge>
                            {log.resourceId && (
                              <span className="text-xs text-muted-foreground font-mono">
                                {log.resourceId}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {log.username}
                              {log.userRole && (
                                <span className="text-xs">({log.userRole})</span>
                              )}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {format(new Date(log.createdAt), "MMM d, yyyy HH:mm:ss")}
                            </span>
                            {log.ipAddress && log.ipAddress !== "unknown" && (
                              <span className="text-xs font-mono">{log.ipAddress}</span>
                            )}
                          </div>
                          {log.details && Object.keys(log.details).length > 0 && (
                            <details className="mt-2">
                              <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                                View Details
                              </summary>
                              <pre className="mt-2 p-2 bg-muted/50 rounded text-xs overflow-x-auto max-h-32">
                                {JSON.stringify(log.details, null, 2)}
                              </pre>
                            </details>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}

            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-border/50">
                <div className="text-sm text-muted-foreground">
                  Showing {((page - 1) * limit) + 1} - {Math.min(page * limit, auditData?.total || 0)} of {auditData?.total || 0}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    data-testid="button-prev-page"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <span className="text-sm px-2">
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    data-testid="button-next-page"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </GlassCardContent>
        </GlassCard>
      </main>
    </div>
  );
}

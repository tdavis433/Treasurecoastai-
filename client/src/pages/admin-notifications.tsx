import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin-layout";
import { GlassCard, GlassCardHeader, GlassCardTitle, GlassCardDescription, GlassCardContent } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Mail, 
  MessageSquare, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  RefreshCw,
  Send,
  Filter,
  Loader2,
  Bell,
  Shield,
  Wifi,
  WifiOff
} from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface NotificationLog {
  id: string;
  clientId: string;
  botId: string | null;
  type: 'email' | 'sms';
  recipient: string;
  status: 'sent' | 'failed' | 'skipped';
  errorMessage: string | null;
  metadata: {
    subject?: string;
    appointmentId?: string;
    leadId?: string;
    isTest?: boolean;
    responseData?: any;
  };
  createdAt: string;
}

interface NotificationStatus {
  email: {
    serviceConfigured: boolean;
    recipientsConfigured: boolean;
    enabled: boolean;
    ready: boolean;
  };
  sms: {
    serviceConfigured: boolean;
    recipientsConfigured: boolean;
    enabled: boolean;
    ready: boolean;
  };
}

interface NotificationLogsResponse {
  logs: NotificationLog[];
  total: number;
  limit: number;
  offset: number;
}

export default function AdminNotifications() {
  const { toast } = useToast();
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = 20;

  const { data: status, isLoading: statusLoading } = useQuery<NotificationStatus>({
    queryKey: ["/api/notification-status"],
  });

  const { data: logsData, isLoading: logsLoading, refetch: refetchLogs } = useQuery<NotificationLogsResponse>({
    queryKey: ["/api/notification-logs", typeFilter, statusFilter, currentPage],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (typeFilter !== "all") params.set("type", typeFilter);
      if (statusFilter !== "all") params.set("status", statusFilter);
      params.set("limit", String(pageSize));
      params.set("offset", String(currentPage * pageSize));
      
      const response = await fetch(`/api/notification-logs?${params.toString()}`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch notification logs");
      return response.json();
    },
  });

  const testEmailMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/test-notification", {
        type: "email",
      });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Test Email Sent",
        description: data.message || "Test email notification was sent successfully.",
      });
      refetchLogs();
    },
    onError: (error: Error) => {
      toast({
        title: "Test Failed",
        description: error.message,
        variant: "destructive",
      });
      refetchLogs();
    },
  });

  const testSmsMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/test-notification", {
        type: "sms",
      });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Test SMS Sent",
        description: data.message || "Test SMS notification was sent successfully.",
      });
      refetchLogs();
    },
    onError: (error: Error) => {
      toast({
        title: "Test Failed",
        description: error.message,
        variant: "destructive",
      });
      refetchLogs();
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "sent":
        return (
          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Sent
          </Badge>
        );
      case "failed":
        return (
          <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
            <XCircle className="w-3 h-3 mr-1" />
            Failed
          </Badge>
        );
      case "skipped":
        return (
          <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
            <AlertCircle className="w-3 h-3 mr-1" />
            Skipped
          </Badge>
        );
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    if (type === "email") {
      return (
        <Badge variant="outline" className="border-cyan-500/30 text-cyan-400">
          <Mail className="w-3 h-3 mr-1" />
          Email
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="border-purple-500/30 text-purple-400">
        <MessageSquare className="w-3 h-3 mr-1" />
        SMS
      </Badge>
    );
  };

  const ServiceStatusCard = ({ 
    title, 
    icon: Icon, 
    data,
    testFn,
    isTestPending,
  }: { 
    title: string; 
    icon: any;
    data?: { serviceConfigured: boolean; recipientsConfigured: boolean; enabled: boolean; ready: boolean };
    testFn: () => void;
    isTestPending: boolean;
  }) => {
    const isReady = data?.ready ?? false;
    const issues = [];
    if (!data?.serviceConfigured) issues.push("API not configured");
    if (!data?.recipientsConfigured) issues.push("No recipients");
    if (!data?.enabled) issues.push("Disabled");

    return (
      <GlassCard className="flex-1">
        <GlassCardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Icon className="w-5 h-5 text-cyan-400" />
              <h3 className="font-medium">{title}</h3>
            </div>
            {isReady ? (
              <Wifi className="w-5 h-5 text-green-400" />
            ) : (
              <WifiOff className="w-5 h-5 text-red-400" />
            )}
          </div>
          
          <div className="space-y-2 mb-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Service</span>
              {data?.serviceConfigured ? (
                <Badge variant="outline" className="text-green-400 border-green-500/30">Configured</Badge>
              ) : (
                <Badge variant="outline" className="text-red-400 border-red-500/30">Not Set</Badge>
              )}
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Recipients</span>
              {data?.recipientsConfigured ? (
                <Badge variant="outline" className="text-green-400 border-green-500/30">Configured</Badge>
              ) : (
                <Badge variant="outline" className="text-red-400 border-red-500/30">Not Set</Badge>
              )}
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Status</span>
              {data?.enabled ? (
                <Badge variant="outline" className="text-green-400 border-green-500/30">Enabled</Badge>
              ) : (
                <Badge variant="outline" className="text-yellow-400 border-yellow-500/30">Disabled</Badge>
              )}
            </div>
          </div>

          {issues.length > 0 && (
            <div className="text-xs text-yellow-400 mb-3">
              Issues: {issues.join(", ")}
            </div>
          )}

          <Button 
            size="sm" 
            className="w-full"
            onClick={testFn}
            disabled={!isReady || isTestPending}
            data-testid={`button-test-${title.toLowerCase()}`}
          >
            {isTestPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Send className="w-4 h-4 mr-2" />
            )}
            Send Test
          </Button>
        </GlassCardContent>
      </GlassCard>
    );
  };

  const totalPages = Math.ceil((logsData?.total ?? 0) / pageSize);

  return (
    <AdminLayout>
      <div className="space-y-6" data-testid="admin-notifications-page">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
              Notification Center
            </h1>
            <p className="text-muted-foreground mt-1">
              Monitor and test email and SMS notification delivery
            </p>
          </div>
          <Button 
            variant="outline" 
            onClick={() => refetchLogs()}
            data-testid="button-refresh-logs"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>

        <div className="flex gap-4">
          <ServiceStatusCard
            title="Email"
            icon={Mail}
            data={status?.email}
            testFn={() => testEmailMutation.mutate()}
            isTestPending={testEmailMutation.isPending}
          />
          <ServiceStatusCard
            title="SMS"
            icon={MessageSquare}
            data={status?.sms}
            testFn={() => testSmsMutation.mutate()}
            isTestPending={testSmsMutation.isPending}
          />
        </div>

        <GlassCard>
          <GlassCardHeader>
            <GlassCardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-cyan-400" />
              Notification History
            </GlassCardTitle>
            <GlassCardDescription>
              Recent notification delivery attempts with status and details
            </GlassCardDescription>
          </GlassCardHeader>
          <GlassCardContent>
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <Label className="text-sm">Filters:</Label>
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-32" data-testid="select-type-filter">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="sms">SMS</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32" data-testid="select-status-filter">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="skipped">Skipped</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {logsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
              </div>
            ) : (logsData?.logs?.length ?? 0) === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Bell className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No notification logs found</p>
                <p className="text-sm mt-1">Send a test notification to see delivery history</p>
              </div>
            ) : (
              <>
                <div className="rounded-md border border-white/10 overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-white/10 hover:bg-white/5">
                        <TableHead>Time</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Recipient</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Details</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {logsData?.logs.map((log) => (
                        <TableRow 
                          key={log.id} 
                          className="border-white/10 hover:bg-white/5"
                          data-testid={`row-notification-${log.id}`}
                        >
                          <TableCell className="text-sm text-muted-foreground">
                            {format(new Date(log.createdAt), "MMM d, HH:mm:ss")}
                          </TableCell>
                          <TableCell>{getTypeBadge(log.type)}</TableCell>
                          <TableCell className="font-mono text-sm max-w-[200px] truncate">
                            {log.recipient}
                          </TableCell>
                          <TableCell>{getStatusBadge(log.status)}</TableCell>
                          <TableCell className="text-sm max-w-[250px]">
                            {log.metadata?.isTest && (
                              <Badge variant="outline" className="mr-2 text-xs">Test</Badge>
                            )}
                            {log.errorMessage && (
                              <span className="text-red-400 truncate block" title={log.errorMessage}>
                                {log.errorMessage}
                              </span>
                            )}
                            {log.metadata?.subject && (
                              <span className="text-muted-foreground truncate block" title={log.metadata.subject}>
                                {log.metadata.subject}
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <p className="text-sm text-muted-foreground">
                      Showing {currentPage * pageSize + 1} - {Math.min((currentPage + 1) * pageSize, logsData?.total ?? 0)} of {logsData?.total} logs
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                        disabled={currentPage === 0}
                        data-testid="button-prev-page"
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(p => p + 1)}
                        disabled={currentPage >= totalPages - 1}
                        data-testid="button-next-page"
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </GlassCardContent>
        </GlassCard>
      </div>
    </AdminLayout>
  );
}

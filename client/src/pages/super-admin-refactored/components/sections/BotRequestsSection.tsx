import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { GlassCard, GlassCardContent } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Mail, Phone, RefreshCw, FileText, Save, Loader2 } from "lucide-react";

interface BotRequest {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  businessName: string | null;
  businessType: string | null;
  website: string | null;
  status: string;
  priority: string | null;
  adminNotes: string | null;
  source: string | null;
  createdAt: string;
  updatedAt: string;
  contactedAt: string | null;
  convertedAt: string | null;
}

export default function BotRequestsSection() {
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [expandedNotes, setExpandedNotes] = useState<string | null>(null);
  const [editingNotes, setEditingNotes] = useState<Record<string, string>>({});

  const { data, isLoading, refetch } = useQuery<{ requests: BotRequest[]; counts: Record<string, number>; total: number }>({
    queryKey: [`/api/bot-requests?status=${statusFilter}`],
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<BotRequest> }) => {
      const response = await apiRequest("PATCH", `/api/bot-requests/${id}`, updates);
      return response.json();
    },
    onSuccess: () => {
      refetch();
      queryClient.invalidateQueries({ queryKey: ["/api/bot-requests"] });
      toast({ title: "Updated", description: "Request status has been updated." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update request.", variant: "destructive" });
    },
  });

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      new: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
      contacted: "bg-amber-500/20 text-amber-400 border-amber-500/30",
      qualified: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      converted: "bg-green-500/20 text-green-400 border-green-500/30",
      declined: "bg-red-500/20 text-red-400 border-red-500/30",
    };
    return <Badge className={styles[status] || styles.new}>{status.charAt(0).toUpperCase() + status.slice(1)}</Badge>;
  };

  const getPriorityBadge = (priority: string | null) => {
    if (!priority || priority === 'normal') return null;
    const styles: Record<string, string> = {
      high: "bg-orange-500/20 text-orange-400 border-orange-500/30",
      urgent: "bg-red-500/20 text-red-400 border-red-500/30",
      low: "bg-white/10 text-white/50 border-white/20",
    };
    return <Badge className={styles[priority] || ""}>{priority.toUpperCase()}</Badge>;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Mail className="h-6 w-6 text-cyan-400" />
            Bot Requests
          </h2>
          <p className="text-white/55 mt-1">Contact form submissions from the landing page</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36 bg-white/5 border-white/10 text-white" data-testid="select-status-filter">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent className="bg-[#1a1d24] border-white/10">
              <SelectItem value="all" className="text-white hover:bg-white/10">All Requests</SelectItem>
              <SelectItem value="new" className="text-white hover:bg-white/10">New</SelectItem>
              <SelectItem value="contacted" className="text-white hover:bg-white/10">Contacted</SelectItem>
              <SelectItem value="qualified" className="text-white hover:bg-white/10">Qualified</SelectItem>
              <SelectItem value="converted" className="text-white hover:bg-white/10">Converted</SelectItem>
              <SelectItem value="declined" className="text-white hover:bg-white/10">Declined</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => refetch()} 
            className="border-white/20 text-white hover:bg-white/10"
            data-testid="button-refresh-requests"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {data?.counts && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { key: 'new', label: 'New', color: 'cyan' },
            { key: 'contacted', label: 'Contacted', color: 'amber' },
            { key: 'qualified', label: 'Qualified', color: 'blue' },
            { key: 'converted', label: 'Converted', color: 'green' },
            { key: 'declined', label: 'Declined', color: 'red' },
          ].map(({ key, label, color }) => (
            <GlassCard 
              key={key} 
              className="cursor-pointer hover:border-white/20" 
              onClick={() => setStatusFilter(key)}
              data-testid={`filter-status-${key}`}
            >
              <GlassCardContent className="p-4 text-center">
                <div className={`text-2xl font-bold ${color === 'cyan' ? 'text-cyan-400' : color === 'amber' ? 'text-amber-400' : color === 'blue' ? 'text-blue-400' : color === 'green' ? 'text-green-400' : 'text-red-400'}`}>
                  {data.counts[key] || 0}
                </div>
                <div className="text-sm text-white/55">{label}</div>
              </GlassCardContent>
            </GlassCard>
          ))}
        </div>
      )}

      <GlassCard>
        <GlassCardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-white/55">Loading requests...</div>
          ) : !data?.requests?.length ? (
            <div className="p-8 text-center">
              <Mail className="h-12 w-12 mx-auto text-white/20 mb-3" />
              <p className="text-white/55">No requests yet</p>
              <p className="text-white/40 text-sm mt-1">When visitors submit the contact form, their requests will appear here.</p>
            </div>
          ) : (
            <div className="divide-y divide-white/10">
              {data.requests.map((request) => (
                <div key={request.id} className="p-4 hover:bg-white/5 transition-colors" data-testid={`request-${request.id}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-medium text-white">{request.name}</span>
                        {getStatusBadge(request.status)}
                        {getPriorityBadge(request.priority)}
                        {request.businessName && (
                          <span className="text-white/50 text-sm">• {request.businessName}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-sm text-white/55 mb-2 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {request.email}
                        </span>
                        {request.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {request.phone}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-white/70 line-clamp-2">{request.message}</p>
                      <div className="flex items-center gap-2 mt-2 text-xs text-white/40 flex-wrap">
                        <span>Submitted {formatDate(request.createdAt)}</span>
                        {request.contactedAt && <span>• Contacted {formatDate(request.contactedAt)}</span>}
                        {request.businessType && <span>• {request.businessType}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (expandedNotes === request.id) {
                            setExpandedNotes(null);
                          } else {
                            setExpandedNotes(request.id);
                            setEditingNotes(prev => ({ ...prev, [request.id]: request.adminNotes || '' }));
                          }
                        }}
                        className="text-white/60 hover:text-white hover:bg-white/10"
                        data-testid={`button-toggle-notes-${request.id}`}
                      >
                        <FileText className="h-4 w-4 mr-1" />
                        Notes
                        {request.adminNotes && <span className="ml-1 w-2 h-2 rounded-full bg-cyan-400" />}
                      </Button>
                      <Select
                        value={request.status}
                        onValueChange={(newStatus) => updateMutation.mutate({ id: request.id, updates: { status: newStatus } })}
                      >
                        <SelectTrigger className="w-32 bg-white/5 border-white/10 text-white text-sm" data-testid={`select-request-status-${request.id}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[#1a1d24] border-white/10">
                          <SelectItem value="new" className="text-white hover:bg-white/10">New</SelectItem>
                          <SelectItem value="contacted" className="text-white hover:bg-white/10">Contacted</SelectItem>
                          <SelectItem value="qualified" className="text-white hover:bg-white/10">Qualified</SelectItem>
                          <SelectItem value="converted" className="text-white hover:bg-white/10">Converted</SelectItem>
                          <SelectItem value="declined" className="text-white hover:bg-white/10">Declined</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  {expandedNotes === request.id && (
                    <div className="mt-4 pt-4 border-t border-white/10">
                      <Label className="text-white/70 text-sm mb-2 block">Internal Admin Notes</Label>
                      <Textarea
                        value={editingNotes[request.id] || ''}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value.length <= 10000) {
                            setEditingNotes(prev => ({ ...prev, [request.id]: value }));
                          }
                        }}
                        placeholder="Add internal notes about this request..."
                        className="bg-white/5 border-white/10 text-white placeholder:text-white/40 min-h-[100px] resize-y"
                        data-testid={`textarea-admin-notes-${request.id}`}
                      />
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-white/50" data-testid={`text-notes-char-count-${request.id}`}>
                          {(editingNotes[request.id] || '').length.toLocaleString()} / 10,000
                        </span>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setExpandedNotes(null);
                              setEditingNotes(prev => {
                                const updated = { ...prev };
                                delete updated[request.id];
                                return updated;
                              });
                            }}
                            className="text-white/60 hover:text-white hover:bg-white/10"
                            data-testid={`button-cancel-notes-${request.id}`}
                          >
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => {
                              updateMutation.mutate({ 
                                id: request.id, 
                                updates: { adminNotes: editingNotes[request.id] || null } 
                              });
                              setExpandedNotes(null);
                            }}
                            disabled={updateMutation.isPending}
                            className="bg-cyan-500 hover:bg-cyan-600 text-white"
                            data-testid={`button-save-notes-${request.id}`}
                          >
                            {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
                            Save Notes
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </GlassCardContent>
      </GlassCard>
    </div>
  );
}

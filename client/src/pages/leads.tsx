import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useMemo, useCallback, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { GlassCard, GlassCardHeader, GlassCardTitle, GlassCardDescription, GlassCardContent } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { format } from "date-fns";
import {
  Users, Plus, Search, Phone, Mail, MessageSquare,
  Calendar, Tag, ChevronRight, ArrowLeft, Edit2, Trash2,
  Save, X, Filter, User, Clock, Star, Building2, RefreshCw,
  CheckSquare, Square, Download
} from "lucide-react";

interface Lead {
  id: string;
  clientId: string;
  botId: string;
  sessionId: string | null;
  name: string | null;
  email: string | null;
  phone: string | null;
  source: string;
  status: string;
  priority: string;
  notes: string | null;
  tags: string[];
  metadata: Record<string, any>;
  conversationPreview: string | null;
  messageCount: number | null;
  createdAt: string;
  updatedAt: string;
  lastContactedAt: string | null;
}

const STATUS_OPTIONS = [
  { value: 'new', label: 'New', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  { value: 'contacted', label: 'Contacted', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  { value: 'qualified', label: 'Qualified', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  { value: 'converted', label: 'Converted', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
  { value: 'lost', label: 'Lost', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
];

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low', color: 'bg-white/10 text-white/55 border-white/20' },
  { value: 'medium', label: 'Medium', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  { value: 'high', label: 'High', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
];

interface UserProfile {
  user: {
    id: string;
    username: string;
    role: string;
    clientId: string | null;
  };
  clientId: string;
}

export default function LeadsPage() {
  const [, setLocation] = useLocation();
  const searchParams = useSearch();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [priorityFilter, setPriorityFilter] = useState<string>("");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [selectedLeadIds, setSelectedLeadIds] = useState<Set<string>>(new Set());
  const [bulkActionStatus, setBulkActionStatus] = useState<string>("");

  // Get clientId from URL query params (for super_admin) or from profile (for client_admin)
  const urlClientId = useMemo(() => {
    const params = new URLSearchParams(searchParams);
    return params.get('clientId');
  }, [searchParams]);

  // Get current user profile to determine role and clientId
  const { data: profile } = useQuery<UserProfile>({
    queryKey: ["/api/client/me"],
    enabled: !urlClientId, // Only fetch if no clientId in URL
  });

  const effectiveClientId = urlClientId || profile?.clientId || 'faith_house';
  const isSuperAdmin = profile?.user?.role === 'super_admin';

  // Build query URL with clientId for super_admin
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

  const { data: leadsData, isLoading, refetch } = useQuery<{
    clientId: string;
    leads: Lead[];
    total: number;
  }>({
    queryKey: [buildQueryUrl("/api/client/leads", { 
      status: statusFilter || undefined, 
      priority: priorityFilter || undefined, 
      search: searchQuery || undefined 
    })],
  });

  const createLeadMutation = useMutation({
    mutationFn: async (data: Partial<Lead>) => {
      const url = buildQueryUrl("/api/client/leads");
      return apiRequest("POST", url, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/client/leads"] });
      setShowCreateModal(false);
      toast({ title: "Lead created successfully" });
    },
    onError: () => {
      toast({ title: "Failed to create lead", variant: "destructive" });
    },
  });

  const updateLeadMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Lead> }) => {
      const url = buildQueryUrl(`/api/client/leads/${id}`);
      return apiRequest("PATCH", url, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/client/leads"] });
      setEditingLead(null);
      toast({ title: "Lead updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update lead", variant: "destructive" });
    },
  });

  const deleteLeadMutation = useMutation({
    mutationFn: async (id: string) => {
      const url = buildQueryUrl(`/api/client/leads/${id}`);
      return apiRequest("DELETE", url);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/client/leads"] });
      setSelectedLead(null);
      toast({ title: "Lead deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete lead", variant: "destructive" });
    },
  });

  const bulkActionMutation = useMutation({
    mutationFn: async (data: { leadIds: string[]; action: 'update_status' | 'delete'; status?: string; priority?: string }) => {
      const url = buildQueryUrl("/api/client/leads/bulk");
      return apiRequest("POST", url, data);
    },
    onSuccess: (result: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/client/leads"] });
      setSelectedLeadIds(new Set());
      setBulkActionStatus("");
      if (result.errorCount > 0) {
        toast({ 
          title: `Processed ${result.successCount} leads with ${result.errorCount} errors`,
          variant: "destructive"
        });
      } else {
        toast({ title: `Successfully processed ${result.successCount} leads` });
      }
    },
    onError: () => {
      toast({ title: "Failed to perform bulk action", variant: "destructive" });
    },
  });

  const leads = leadsData?.leads || [];

  const toggleLeadSelection = useCallback((leadId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedLeadIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(leadId)) {
        newSet.delete(leadId);
      } else {
        newSet.add(leadId);
      }
      return newSet;
    });
  }, []);

  const toggleAllLeads = useCallback(() => {
    if (selectedLeadIds.size === leads.length) {
      setSelectedLeadIds(new Set());
    } else {
      setSelectedLeadIds(new Set(leads.map(l => l.id)));
    }
  }, [leads, selectedLeadIds.size]);

  const handleBulkStatusUpdate = () => {
    if (!bulkActionStatus || selectedLeadIds.size === 0) return;
    bulkActionMutation.mutate({
      leadIds: Array.from(selectedLeadIds),
      action: 'update_status',
      status: bulkActionStatus
    });
  };

  const handleBulkDelete = () => {
    if (selectedLeadIds.size === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedLeadIds.size} leads? This cannot be undone.`)) return;
    bulkActionMutation.mutate({
      leadIds: Array.from(selectedLeadIds),
      action: 'delete'
    });
  };

  const handleExportCSV = () => {
    if (leads.length === 0) {
      toast({ title: "No leads to export", description: "There are no leads to export.", variant: "destructive" });
      return;
    }
    
    const headers = ['Name', 'Email', 'Phone', 'Status', 'Priority', 'Source', 'Created At', 'Notes'];
    const rows = leads.map(lead => [
      lead.name || '',
      lead.email || '',
      lead.phone || '',
      lead.status,
      lead.priority,
      lead.source,
      format(new Date(lead.createdAt), 'yyyy-MM-dd HH:mm:ss'),
      lead.notes || ''
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leads-export-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({ title: "Export Complete", description: `Exported ${leads.length} leads to CSV.` });
  };

  const getStatusBadge = (status: string) => {
    const option = STATUS_OPTIONS.find(o => o.value === status);
    return option ? (
      <Badge className={`${option.color} border`}>{option.label}</Badge>
    ) : (
      <Badge className="bg-white/10 text-white/55 border border-white/20">{status}</Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const option = PRIORITY_OPTIONS.find(o => o.value === priority);
    return option ? (
      <Badge className={`${option.color} border`}>
        <Star className="h-3 w-3 mr-1" />
        {option.label}
      </Badge>
    ) : (
      <Badge className="bg-white/10 text-white/55 border border-white/20">{priority}</Badge>
    );
  };

  return (
    <div className="min-h-screen bg-[#0B0E13] text-white flex flex-col">
      <header className="h-14 border-b border-white/10 bg-white/5 backdrop-blur-md flex items-center justify-between px-6 flex-shrink-0">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/client/dashboard")}
            className="text-white/85 hover:bg-white/10"
            data-testid="button-back"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="h-8 w-8 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center">
            <Users className="h-4 w-4 text-white" />
          </div>
          <span className="font-semibold text-lg text-white">Leads</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => refetch()}
            className="text-white/85 hover:bg-white/10"
            data-testid="button-refresh"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            onClick={handleExportCSV}
            disabled={leads.length === 0}
            className="bg-white/5 border-white/10 text-white/85 hover:bg-white/10"
            data-testid="button-export-csv"
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="bg-cyan-500 hover:bg-cyan-600 text-white"
            data-testid="button-create-lead"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Lead
          </Button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <div className={`flex-1 flex flex-col ${selectedLead ? 'lg:w-1/2' : 'w-full'}`}>
          <div className="p-4 border-b border-white/10 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
              <Input
                placeholder="Search leads..."
                className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-white/40"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                data-testid="input-search-leads"
              />
            </div>
            <div className="flex flex-wrap gap-2 items-center overflow-x-auto">
              <Select value={statusFilter || "all"} onValueChange={(v) => setStatusFilter(v === "all" ? "" : v)}>
                <SelectTrigger className="w-[130px] sm:w-[160px] bg-white/5 border-white/10 text-white flex-shrink-0" data-testid="select-status-filter">
                  <Filter className="h-4 w-4 mr-2 text-white/55" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1f2e] border-white/10">
                  <SelectItem value="all" className="text-white/85">All Statuses</SelectItem>
                  {STATUS_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value} className="text-white/85">
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={priorityFilter || "all"} onValueChange={(v) => setPriorityFilter(v === "all" ? "" : v)}>
                <SelectTrigger className="w-[130px] sm:w-[160px] bg-white/5 border-white/10 text-white flex-shrink-0" data-testid="select-priority-filter">
                  <Star className="h-4 w-4 mr-2 text-white/55" />
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1f2e] border-white/10">
                  <SelectItem value="all" className="text-white/85">All Priorities</SelectItem>
                  {PRIORITY_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value} className="text-white/85">
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {leads.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleAllLeads}
                  className="ml-auto bg-white/5 border-white/10 text-white/85 hover:bg-white/10 flex-shrink-0"
                  data-testid="button-select-all"
                >
                  {selectedLeadIds.size === leads.length ? (
                    <><CheckSquare className="h-4 w-4 mr-2" />Deselect All</>
                  ) : (
                    <><Square className="h-4 w-4 mr-2" />Select All ({leads.length})</>
                  )}
                </Button>
              )}
            </div>
            
            {selectedLeadIds.size > 0 && (
              <div className="flex flex-wrap items-center gap-2 p-3 bg-cyan-500/10 border border-cyan-400/30 rounded-lg">
                <span className="text-cyan-400 font-medium text-sm">
                  {selectedLeadIds.size} lead{selectedLeadIds.size !== 1 ? 's' : ''} selected
                </span>
                <div className="flex items-center gap-2 ml-auto">
                  <Select value={bulkActionStatus || "select"} onValueChange={setBulkActionStatus}>
                    <SelectTrigger className="w-[140px] h-8 bg-white/5 border-white/10 text-white text-sm" data-testid="select-bulk-status">
                      <SelectValue placeholder="Set Status" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a1f2e] border-white/10">
                      <SelectItem value="select" className="text-white/55">Set Status...</SelectItem>
                      {STATUS_OPTIONS.map(opt => (
                        <SelectItem key={opt.value} value={opt.value} className="text-white/85">
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    size="sm"
                    onClick={handleBulkStatusUpdate}
                    disabled={!bulkActionStatus || bulkActionStatus === "select" || bulkActionMutation.isPending}
                    className="bg-cyan-500 hover:bg-cyan-600 text-white h-8"
                    data-testid="button-bulk-update"
                  >
                    Update
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleBulkDelete}
                    disabled={bulkActionMutation.isPending}
                    className="text-red-400 hover:bg-red-500/10 h-8"
                    data-testid="button-bulk-delete"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedLeadIds(new Set())}
                    className="text-white/55 hover:bg-white/10 h-8"
                    data-testid="button-clear-selection"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>

          <ScrollArea className="flex-1">
            <div className="p-4 space-y-2">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="p-4 bg-white/5 rounded-xl border border-white/10 animate-pulse">
                    <div className="h-5 bg-white/10 rounded w-1/3 mb-2" />
                    <div className="h-4 bg-white/10 rounded w-1/2" />
                  </div>
                ))
              ) : leads.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 mx-auto mb-4 text-white/30" />
                  <h3 className="text-lg font-medium text-white/85 mb-2">No leads yet</h3>
                  <p className="text-white/55 mb-4">Start capturing leads from your chat widget</p>
                  <Button
                    onClick={() => setShowCreateModal(true)}
                    className="bg-cyan-500 hover:bg-cyan-600 text-white"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Lead Manually
                  </Button>
                </div>
              ) : (
                leads.map((lead) => (
                  <div
                    key={lead.id}
                    className={`flex items-start gap-3 p-4 rounded-xl border transition-colors ${
                      selectedLead?.id === lead.id
                        ? 'bg-cyan-500/10 border-cyan-400/30'
                        : selectedLeadIds.has(lead.id)
                        ? 'bg-cyan-500/5 border-cyan-400/20'
                        : 'bg-white/5 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    <div 
                      className="pt-1 flex-shrink-0"
                      onClick={(e) => toggleLeadSelection(lead.id, e)}
                    >
                      <Checkbox
                        checked={selectedLeadIds.has(lead.id)}
                        onCheckedChange={() => toggleLeadSelection(lead.id)}
                        className="border-white/30 data-[state=checked]:bg-cyan-500 data-[state=checked]:border-cyan-500"
                        data-testid={`checkbox-lead-${lead.id}`}
                      />
                    </div>
                    <button
                      onClick={() => setSelectedLead(lead)}
                      className="flex-1 text-left"
                      data-testid={`button-lead-${lead.id}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                            selectedLead?.id === lead.id ? 'bg-cyan-500/20' : 'bg-white/10'
                          }`}>
                            <User className={`h-5 w-5 ${
                              selectedLead?.id === lead.id ? 'text-cyan-400' : 'text-white/55'
                            }`} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="font-medium text-white truncate max-w-[200px]">
                                  {lead.name || 'Unknown'}
                                </div>
                              </TooltipTrigger>
                              {lead.name && lead.name.length > 25 && (
                                <TooltipContent side="bottom">
                                  {lead.name}
                                </TooltipContent>
                              )}
                            </Tooltip>
                            <div className="flex items-center gap-2 mt-1 max-w-[280px]">
                              {lead.email && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className="text-xs text-white/55 flex items-center gap-1 truncate max-w-[160px]">
                                      <Mail className="h-3 w-3 flex-shrink-0" />
                                      <span className="truncate">{lead.email}</span>
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent side="bottom" className="max-w-[300px] break-all">
                                    {lead.email}
                                  </TooltipContent>
                                </Tooltip>
                              )}
                              {lead.phone && (
                                <span className="text-xs text-white/55 flex items-center gap-1 flex-shrink-0">
                                  <Phone className="h-3 w-3" />
                                  {lead.phone}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          {getStatusBadge(lead.status)}
                          <span className="text-xs text-white/40">
                            {format(new Date(lead.createdAt), 'MMM d, h:mm a')}
                          </span>
                        </div>
                      </div>
                      {lead.conversationPreview && (
                        <div className="mt-3 p-2 bg-white/5 rounded-lg">
                          <p className="text-xs text-white/55 line-clamp-2">
                            <MessageSquare className="h-3 w-3 inline mr-1" />
                            {lead.conversationPreview}
                          </p>
                        </div>
                      )}
                    </button>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        {selectedLead && (
          <div className="w-full lg:w-1/2 border-l border-white/10 bg-white/[0.02] flex flex-col">
            <div className="h-14 border-b border-white/10 flex items-center justify-between px-4">
              <h2 className="font-semibold text-white">Lead Details</h2>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setEditingLead(selectedLead)}
                  className="text-white/85 hover:bg-white/10"
                  data-testid="button-edit-lead"
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    if (confirm('Are you sure you want to delete this lead?')) {
                      deleteLeadMutation.mutate(selectedLead.id);
                    }
                  }}
                  className="text-red-400 hover:bg-red-500/10"
                  data-testid="button-delete-lead"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedLead(null)}
                  className="text-white/85 hover:bg-white/10 lg:hidden"
                  data-testid="button-close-detail"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <ScrollArea className="flex-1">
              <div className="p-6 space-y-6">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center">
                    <User className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white">
                      {selectedLead.name || 'Unknown'}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      {getStatusBadge(selectedLead.status)}
                      {getPriorityBadge(selectedLead.priority)}
                    </div>
                  </div>
                </div>

                <GlassCard>
                  <GlassCardHeader className="pb-3">
                    <GlassCardTitle className="text-sm">Contact Information</GlassCardTitle>
                  </GlassCardHeader>
                  <GlassCardContent className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4 text-white/55" />
                      <span className="text-white/85">{selectedLead.email || 'Not provided'}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 text-white/55" />
                      <span className="text-white/85">{selectedLead.phone || 'Not provided'}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Calendar className="h-4 w-4 text-white/55" />
                      <span className="text-white/85">
                        Added {format(new Date(selectedLead.createdAt), 'MMM d, yyyy')}
                      </span>
                    </div>
                  </GlassCardContent>
                </GlassCard>

                <GlassCard>
                  <GlassCardHeader className="pb-3">
                    <GlassCardTitle className="text-sm">Source & Activity</GlassCardTitle>
                  </GlassCardHeader>
                  <GlassCardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-white/55">Source</span>
                      <Badge className="bg-white/10 text-white/85 border border-white/20">
                        {selectedLead.source}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-white/55">Messages</span>
                      <span className="text-white/85">{selectedLead.messageCount || 0}</span>
                    </div>
                    {selectedLead.lastContactedAt && (
                      <div className="flex items-center justify-between">
                        <span className="text-white/55">Last Contacted</span>
                        <span className="text-white/85">
                          {format(new Date(selectedLead.lastContactedAt), 'MMM d, h:mm a')}
                        </span>
                      </div>
                    )}
                  </GlassCardContent>
                </GlassCard>

                {selectedLead.notes && (
                  <GlassCard>
                    <GlassCardHeader className="pb-3">
                      <GlassCardTitle className="text-sm">Notes</GlassCardTitle>
                    </GlassCardHeader>
                    <GlassCardContent>
                      <p className="text-white/85 whitespace-pre-wrap">{selectedLead.notes}</p>
                    </GlassCardContent>
                  </GlassCard>
                )}

                {selectedLead.tags && selectedLead.tags.length > 0 && (
                  <GlassCard>
                    <GlassCardHeader className="pb-3">
                      <GlassCardTitle className="text-sm">Tags</GlassCardTitle>
                    </GlassCardHeader>
                    <GlassCardContent>
                      <div className="flex flex-wrap gap-2">
                        {selectedLead.tags.map((tag, i) => (
                          <Badge key={i} className="bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                            <Tag className="h-3 w-3 mr-1" />
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </GlassCardContent>
                  </GlassCard>
                )}

                {selectedLead.conversationPreview && (
                  <GlassCard>
                    <GlassCardHeader className="pb-3">
                      <GlassCardTitle className="text-sm">Conversation Preview</GlassCardTitle>
                    </GlassCardHeader>
                    <GlassCardContent>
                      <p className="text-white/85">{selectedLead.conversationPreview}</p>
                    </GlassCardContent>
                  </GlassCard>
                )}

                <div className="flex gap-2">
                  <Button
                    className="flex-1 bg-cyan-500 hover:bg-cyan-600 text-white"
                    onClick={() => {
                      updateLeadMutation.mutate({
                        id: selectedLead.id,
                        data: { status: 'contacted', lastContactedAt: new Date().toISOString() }
                      });
                    }}
                    data-testid="button-mark-contacted"
                  >
                    Mark as Contacted
                  </Button>
                </div>
              </div>
            </ScrollArea>
          </div>
        )}
      </div>

      <CreateLeadModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={(data) => createLeadMutation.mutate(data)}
        isPending={createLeadMutation.isPending}
      />

      <EditLeadModal
        lead={editingLead}
        onClose={() => setEditingLead(null)}
        onSubmit={(data) => {
          if (editingLead) {
            updateLeadMutation.mutate({ id: editingLead.id, data });
          }
        }}
        isPending={updateLeadMutation.isPending}
      />
    </div>
  );
}

function CreateLeadModal({
  open,
  onClose,
  onSubmit,
  isPending,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Lead>) => void;
  isPending: boolean;
}) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    priority: 'medium',
    status: 'new',
    notes: '',
    botId: 'manual',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[#1a1f2e] border-white/10 text-white">
        <DialogHeader>
          <DialogTitle className="text-white">Add New Lead</DialogTitle>
          <DialogDescription className="text-white/55">
            Manually add a new lead to your pipeline
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label className="text-white/85">Name</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="John Doe"
              className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
              data-testid="input-lead-name"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-white/85">Email</Label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="john@example.com"
              className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
              data-testid="input-lead-email"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-white/85">Phone</Label>
            <Input
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="(555) 123-4567"
              className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
              data-testid="input-lead-phone"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-white/85">Status</Label>
              <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1f2e] border-white/10">
                  {STATUS_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value} className="text-white/85">
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-white/85">Priority</Label>
              <Select value={formData.priority} onValueChange={(v) => setFormData({ ...formData, priority: v })}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1f2e] border-white/10">
                  {PRIORITY_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value} className="text-white/85">
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-white/85">Notes</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Add notes about this lead..."
              className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
              data-testid="input-lead-notes"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose} className="text-white/85">
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="bg-cyan-500 hover:bg-cyan-600 text-white"
              data-testid="button-submit-lead"
            >
              {isPending ? 'Creating...' : 'Create Lead'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EditLeadModal({
  lead,
  onClose,
  onSubmit,
  isPending,
}: {
  lead: Lead | null;
  onClose: () => void;
  onSubmit: (data: Partial<Lead>) => void;
  isPending: boolean;
}) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    priority: 'medium',
    status: 'new',
    notes: '',
  });

  useEffect(() => {
    if (lead) {
      setFormData({
        name: lead.name || '',
        email: lead.email || '',
        phone: lead.phone || '',
        priority: lead.priority,
        status: lead.status,
        notes: lead.notes || '',
      });
    }
  }, [lead]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  if (!lead) return null;

  return (
    <Dialog open={!!lead} onOpenChange={() => onClose()}>
      <DialogContent className="bg-[#1a1f2e] border-white/10 text-white">
        <DialogHeader>
          <DialogTitle className="text-white">Edit Lead</DialogTitle>
          <DialogDescription className="text-white/55">
            Update lead information
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label className="text-white/85">Name</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="John Doe"
              className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-white/85">Email</Label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="john@example.com"
              className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-white/85">Phone</Label>
            <Input
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="(555) 123-4567"
              className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-white/85">Status</Label>
              <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1f2e] border-white/10">
                  {STATUS_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value} className="text-white/85">
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-white/85">Priority</Label>
              <Select value={formData.priority} onValueChange={(v) => setFormData({ ...formData, priority: v })}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1f2e] border-white/10">
                  {PRIORITY_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value} className="text-white/85">
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-white/85">Notes</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Add notes about this lead..."
              className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose} className="text-white/85">
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="bg-cyan-500 hover:bg-cyan-600 text-white"
            >
              {isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  Bot, Users, FileText, Settings, BarChart3, MessageSquare, 
  Plus, Play, Pause, Eye, Edit2, Save, X, LogOut, Zap, 
  AlertTriangle, Phone, Mail, Globe, MapPin, Clock, Trash2,
  ChevronRight, Search, CreditCard, ExternalLink, Building2, Code, Copy, Check
} from "lucide-react";

interface Client {
  id: string;
  name: string;
  type?: string;
  status: 'active' | 'paused' | 'demo';
  bots: string[];
}

interface BotConfig {
  botId: string;
  clientId: string;
  name: string;
  description: string;
  metadata?: {
    isDemo?: boolean;
    isTemplate?: boolean;
    templateCategory?: string;
    clonedFrom?: string;
    createdAt?: string;
    version?: string;
  };
  businessProfile: {
    businessName: string;
    type: string;
    phone?: string;
    email?: string;
    website?: string;
    location?: string;
    hours?: Record<string, string>;
    services?: string[];
    amenities?: string[];
    serviceArea?: string;
    cuisine?: string;
    membershipOptions?: string[];
    booking?: {
      onlineBookingUrl?: string;
      walkInsWelcome?: boolean;
      walkInsNote?: string;
    };
  };
  rules?: {
    allowedTopics?: string[];
    forbiddenTopics?: string[];
    specialInstructions?: string[];
    crisisHandling?: {
      onCrisisKeywords?: string[];
      responseTemplate?: string;
    };
  };
  systemPrompt?: string;
  faqs?: Array<{ question: string; answer: string }>;
}

interface Template extends BotConfig {
  metadata: NonNullable<BotConfig['metadata']> & {
    isTemplate: true;
    templateCategory: string;
  };
}

interface AuthUser {
  id: string;
  username: string;
  role: 'super_admin' | 'client_admin';
  clientId?: string;
}

function formatHoursForDisplay(hours?: Record<string, string>): string {
  if (!hours) return '';
  return Object.entries(hours)
    .map(([day, time]) => `${day.charAt(0).toUpperCase() + day.slice(1)}: ${time}`)
    .join('\n');
}

function parseHoursFromString(hoursStr: string): Record<string, string> {
  const result: Record<string, string> = {};
  if (!hoursStr) return result;
  const lines = hoursStr.split('\n').map(s => s.trim()).filter(Boolean);
  for (const line of lines) {
    const colonIdx = line.indexOf(':');
    if (colonIdx > 0) {
      const day = line.substring(0, colonIdx).trim().toLowerCase();
      const time = line.substring(colonIdx + 1).trim();
      if (day && time) result[day] = time;
    }
  }
  return result;
}

const BUSINESS_TYPES = [
  { value: 'restaurant', label: 'Restaurant' },
  { value: 'barber', label: 'Barber / Salon' },
  { value: 'auto', label: 'Auto Shop' },
  { value: 'home_services', label: 'Home Services' },
  { value: 'gym', label: 'Gym / Fitness' },
  { value: 'sober_living', label: 'Sober Living' },
  { value: 'real_estate', label: 'Real Estate' },
  { value: 'med_spa', label: 'Med Spa' },
  { value: 'tattoo', label: 'Tattoo Studio' },
];

export default function ControlCenter() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [selectedBotId, setSelectedBotId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  const { data: currentUser, isLoading: authLoading } = useQuery<AuthUser>({
    queryKey: ["/api/auth/me"],
    queryFn: async () => {
      const response = await fetch("/api/auth/me", { credentials: "include" });
      if (!response.ok) throw new Error("Not authenticated");
      return response.json();
    },
    retry: false,
  });

  useEffect(() => {
    if (!authLoading && !currentUser) {
      setLocation("/login");
    } else if (currentUser && currentUser.role !== "super_admin") {
      toast({
        title: "Access Denied",
        description: "You don't have permission to access this page.",
        variant: "destructive",
      });
      setLocation("/admin/dashboard");
    }
  }, [currentUser, authLoading, setLocation, toast]);

  // Fetch ALL bots
  const { data: allBots = [] } = useQuery<BotConfig[]>({
    queryKey: ["/api/super-admin/bots"],
    enabled: currentUser?.role === "super_admin",
  });

  // Fetch clients for reference
  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ["/api/super-admin/clients"],
    enabled: currentUser?.role === "super_admin",
  });

  // Fetch templates
  const { data: templates = [] } = useQuery<Template[]>({
    queryKey: ["/api/super-admin/templates"],
    enabled: currentUser?.role === "super_admin",
  });

  // Filter out template bots - only show real client bots
  const clientBots = allBots.filter(bot => !bot.metadata?.isTemplate);

  // Get selected bot
  const selectedBot = clientBots.find(b => b.botId === selectedBotId);
  const selectedClient = selectedBot ? clients.find(c => c.id === selectedBot.clientId) : null;

  // Filter bots by search
  const filteredBots = clientBots.filter(bot => 
    bot.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    bot.botId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    bot.businessProfile?.businessName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const updateStatusMutation = useMutation({
    mutationFn: async ({ clientId, status }: { clientId: string; status: string }) => {
      const response = await apiRequest("PUT", `/api/super-admin/clients/${clientId}/status`, { status });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/super-admin/clients"] });
      toast({ title: "Status Updated", description: "Client status has been updated." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update status.", variant: "destructive" });
    },
  });

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    setLocation("/login");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge data-testid="badge-status-active" className="bg-green-500/20 text-green-400 border-green-500/30">ACTIVE</Badge>;
      case 'paused':
        return <Badge data-testid="badge-status-paused" className="bg-red-500/20 text-red-400 border-red-500/30">PAUSED</Badge>;
      case 'demo':
        return <Badge data-testid="badge-status-demo" className="bg-blue-500/20 text-blue-400 border-blue-500/30">DEMO</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getBusinessTypeLabel = (type?: string) => {
    return BUSINESS_TYPES.find(t => t.value === type)?.label || type || 'Unknown';
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      {/* Header */}
      <header className="h-14 border-b bg-card flex items-center justify-between px-6 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <Zap className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-semibold text-lg">Treasure Coast AI – Control Center</span>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="status-active">
            All Systems Operational
          </Badge>
          <span className="text-sm text-muted-foreground">{currentUser?.username}</span>
          <Button data-testid="button-logout" variant="ghost" size="icon" onClick={handleLogout}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Left Sidebar - Bot Navigation */}
        <aside className="w-72 border-r bg-card flex flex-col flex-shrink-0">
          <div className="p-4 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                data-testid="input-search-bots"
                placeholder="Search bots..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide px-2 mb-2">
                Chatbots ({filteredBots.length}{searchQuery ? ` of ${clientBots.length}` : ''})
              </p>
              {filteredBots.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No bots found</p>
              ) : (
                filteredBots.map(bot => {
                  const client = clients.find(c => c.id === bot.clientId);
                  const isSelected = selectedBotId === bot.botId;
                  return (
                    <button
                      key={bot.botId}
                      data-testid={`button-bot-${bot.botId}`}
                      onClick={() => {
                        setSelectedBotId(bot.botId);
                        setActiveTab('overview');
                      }}
                      className={`w-full text-left p-3 rounded-lg mb-1 transition-colors ${
                        isSelected 
                          ? 'bg-primary/10 border border-primary/30' 
                          : 'hover:bg-muted'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          isSelected ? 'bg-primary/20' : 'bg-muted'
                        }`}>
                          <Building2 className={`h-4 w-4 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">
                            {bot.name || bot.businessProfile?.businessName}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-muted-foreground truncate">
                              {getBusinessTypeLabel(bot.businessProfile?.type)}
                            </span>
                            {client && (
                              <span className={`text-xs px-1.5 py-0.5 rounded ${
                                client.status === 'active' ? 'bg-green-500/20 text-green-500' :
                                client.status === 'demo' ? 'bg-blue-500/20 text-blue-500' :
                                'bg-amber-500/20 text-amber-500'
                              }`}>
                                {client.status}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </ScrollArea>

          <Separator />

          {/* Quick Actions */}
          <div className="p-3">
            <Button 
              data-testid="button-add-bot"
              variant="outline"
              className="w-full justify-start"
              onClick={() => setShowCreateModal(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add New Bot
            </Button>
            <Button 
              data-testid="button-settings-legacy"
              variant="ghost" 
              className="w-full justify-start mt-1"
              onClick={() => setLocation('/super-admin')}
            >
              <Settings className="h-4 w-4 mr-2" />
              Legacy Admin
            </Button>
          </div>
        </aside>

        {/* Main Content Area - Split pane: Dashboard Grid + Detail Panel */}
        <div className="flex-1 flex overflow-hidden h-full">
          {/* Dashboard Grid - Always visible with independent scroll */}
          <main className={`flex-1 overflow-y-auto transition-all duration-300 h-full ${selectedBot ? 'lg:min-w-[50%] lg:max-w-[60%]' : 'w-full'}`}>
            <div className="p-6">
              {/* Dashboard Header */}
              <div className="mb-8">
                <h1 className="text-2xl font-bold">Dashboard Overview</h1>
                <p className="text-muted-foreground mt-1">
                  {searchQuery 
                    ? `Showing ${filteredBots.length} of ${clientBots.length} bots matching "${searchQuery}"`
                    : 'Select a chatbot to manage it, or view platform statistics below.'}
                </p>
              </div>

              {/* Stats Overview - Shows filtered counts when search is active */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <Card className="hover-elevate">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Bot className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{searchQuery ? filteredBots.length : clientBots.length}</p>
                        <p className="text-sm text-muted-foreground">{searchQuery ? 'Matching' : 'Total Bots'}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="hover-elevate">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                        <Play className="h-5 w-5 text-green-500" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">
                          {searchQuery 
                            ? filteredBots.filter(b => clients.find(c => c.id === b.clientId)?.status === 'active').length
                            : clients.filter(c => c.status === 'active').length}
                        </p>
                        <p className="text-sm text-muted-foreground">Active</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="hover-elevate">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                        <Eye className="h-5 w-5 text-blue-500" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">
                          {searchQuery 
                            ? filteredBots.filter(b => clients.find(c => c.id === b.clientId)?.status === 'demo').length
                            : clients.filter(c => c.status === 'demo').length}
                        </p>
                        <p className="text-sm text-muted-foreground">Demo</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="hover-elevate">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                        <Pause className="h-5 w-5 text-amber-500" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">
                          {searchQuery 
                            ? filteredBots.filter(b => clients.find(c => c.id === b.clientId)?.status === 'paused').length
                            : clients.filter(c => c.status === 'paused').length}
                        </p>
                        <p className="text-sm text-muted-foreground">Paused</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Bot Cards Grid */}
              <h2 className="text-lg font-semibold mb-4">All Chatbots</h2>
              <div className={`grid gap-4 ${selectedBot ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3'}`}>
                {filteredBots.map(bot => {
                  const client = clients.find(c => c.id === bot.clientId);
                  const isSelected = selectedBotId === bot.botId;
                  return (
                    <Card 
                      key={bot.botId}
                      data-testid={`card-bot-${bot.botId}`}
                      className={`hover-elevate cursor-pointer transition-all group ${
                        isSelected ? 'ring-2 ring-primary shadow-lg' : ''
                      }`}
                      onClick={() => {
                        setSelectedBotId(bot.botId);
                        setActiveTab('overview');
                      }}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-3">
                            <div className={`h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                              isSelected ? 'bg-primary text-primary-foreground' : 'bg-primary/10'
                            }`}>
                              <Building2 className={`h-5 w-5 ${isSelected ? '' : 'text-primary'}`} />
                            </div>
                            <div className="min-w-0">
                              <CardTitle className="text-sm truncate">
                                {bot.name || bot.businessProfile?.businessName}
                              </CardTitle>
                              <CardDescription className="text-xs">
                                {getBusinessTypeLabel(bot.businessProfile?.type)}
                              </CardDescription>
                            </div>
                          </div>
                          {client && getStatusBadge(client.status)}
                        </div>
                      </CardHeader>
                      <CardContent className="pb-4">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <MessageSquare className="h-3 w-3" />
                            {bot.faqs?.length || 0} FAQs
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {bot.metadata?.createdAt || 'N/A'}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}

                {/* Add New Bot Card */}
                <Card 
                  data-testid="card-add-new-bot"
                  className="border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 bg-transparent cursor-pointer transition-all group flex items-center justify-center min-h-[140px]"
                  onClick={() => setShowCreateModal(true)}
                >
                  <div className="text-center p-4">
                    <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center mx-auto mb-2 group-hover:bg-primary/10 transition-colors">
                      <Plus className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <p className="font-medium text-sm group-hover:text-primary transition-colors">Add New Bot</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Create from template</p>
                  </div>
                </Card>
              </div>
            </div>
          </main>

          {/* Bot Details Panel - Inline split pane with independent scroll */}
          {selectedBot && selectedClient && (
            <aside className="lg:min-w-[40%] lg:max-w-[50%] border-l bg-card overflow-y-auto h-full">
              <div className="p-6">
                {/* Panel Header with Close */}
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Building2 className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">{selectedBot.name || selectedBot.businessProfile?.businessName}</h2>
                      <p className="text-sm text-muted-foreground">
                        {getBusinessTypeLabel(selectedBot.businessProfile?.type)} • {selectedBot.botId}
                      </p>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => setSelectedBotId(null)}
                    data-testid="button-close-detail"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {/* Status and Actions */}
                <div className="flex items-center gap-2 mb-6 flex-wrap">
                  {getStatusBadge(selectedClient.status)}
                  <Button
                    data-testid="button-preview-bot"
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(`/demo/${selectedBot.botId}`, '_blank')}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Preview
                  </Button>
                  <Select
                    value={selectedClient.status}
                    onValueChange={(value) => updateStatusMutation.mutate({ 
                      clientId: selectedClient.id, 
                      status: value 
                    })}
                  >
                    <SelectTrigger data-testid="select-status" className="w-28">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="paused">Paused</SelectItem>
                      <SelectItem value="demo">Demo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="mb-6 w-full justify-start flex-wrap h-auto gap-1">
                    <TabsTrigger data-testid="tab-overview" value="overview" className="text-xs">
                      <Eye className="h-4 w-4 mr-1" />
                      Overview
                    </TabsTrigger>
                    <TabsTrigger data-testid="tab-settings" value="settings" className="text-xs">
                      <Settings className="h-4 w-4 mr-1" />
                      Settings
                    </TabsTrigger>
                    <TabsTrigger data-testid="tab-billing" value="billing" className="text-xs">
                      <CreditCard className="h-4 w-4 mr-1" />
                      Billing
                    </TabsTrigger>
                    <TabsTrigger data-testid="tab-analytics" value="analytics" className="text-xs">
                      <BarChart3 className="h-4 w-4 mr-1" />
                      Analytics
                    </TabsTrigger>
                    <TabsTrigger data-testid="tab-logs" value="logs" className="text-xs">
                      <MessageSquare className="h-4 w-4 mr-1" />
                      Logs
                    </TabsTrigger>
                    <TabsTrigger data-testid="tab-install" value="install" className="text-xs">
                      <Code className="h-4 w-4 mr-1" />
                      Install
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview">
                    <OverviewPanel bot={selectedBot} client={selectedClient} />
                  </TabsContent>

                  <TabsContent value="settings">
                    <BotSettingsPanel bot={selectedBot} clientType={selectedClient.type} />
                  </TabsContent>

                  <TabsContent value="billing">
                    <BillingPanel clientId={selectedClient.id} clientName={selectedClient.name} status={selectedClient.status} />
                  </TabsContent>

                  <TabsContent value="analytics">
                    <AnalyticsPanel clientId={selectedClient.id} />
                  </TabsContent>

                  <TabsContent value="logs">
                    <LogsPanel clientId={selectedClient.id} botId={selectedBot.botId} />
                  </TabsContent>

                  <TabsContent value="install">
                    <InstallPanel bot={selectedBot} client={selectedClient} />
                  </TabsContent>
                </Tabs>
              </div>
            </aside>
          )}
        </div>
      </div>

      {/* Create from Template Modal */}
      <CreateFromTemplateModal
        open={showCreateModal}
        onOpenChange={(open) => {
          setShowCreateModal(open);
          // Only reset template when explicitly closing after success
          // The modal handles its own state internally
        }}
        template={selectedTemplate}
        templates={templates}
        onSelectTemplate={setSelectedTemplate}
        onSuccess={(botId) => {
          setShowCreateModal(false);
          setSelectedTemplate(null); // Only reset after successful creation
          setSelectedBotId(botId);
          queryClient.invalidateQueries({ queryKey: ["/api/super-admin/bots"] });
          queryClient.invalidateQueries({ queryKey: ["/api/super-admin/clients"] });
        }}
      />
    </div>
  );
}

// Overview Panel - Quick summary of bot and client
function OverviewPanel({ bot, client }: { bot: BotConfig; client: Client }) {
  const { data: analytics } = useQuery({
    queryKey: ["/api/client/analytics/summary", client.id],
    queryFn: async () => {
      const response = await fetch(`/api/client/analytics/summary?clientId=${client.id}`, { credentials: "include" });
      if (!response.ok) return null;
      return response.json();
    },
  });

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Messages (7d)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{analytics?.messagesLast7d || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Conversations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{analytics?.conversations || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Leads (7d)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{analytics?.leadsLast7d || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Bookings (7d)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{analytics?.bookingsLast7d || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Bot Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>Bot Information</CardTitle>
          <CardDescription>Quick overview of this chatbot</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground">Business Name</Label>
              <p className="font-medium">{bot.businessProfile?.businessName || '-'}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Business Type</Label>
              <p className="font-medium">{BUSINESS_TYPES.find(t => t.value === bot.businessProfile?.type)?.label || bot.businessProfile?.type || '-'}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Phone</Label>
              <p className="font-medium">{bot.businessProfile?.phone || '-'}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Email</Label>
              <p className="font-medium">{bot.businessProfile?.email || '-'}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Location</Label>
              <p className="font-medium">{bot.businessProfile?.location || '-'}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Website</Label>
              <p className="font-medium">{bot.businessProfile?.website || '-'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Services */}
      {bot.businessProfile?.services && bot.businessProfile.services.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Services</CardTitle>
            <CardDescription>What this business offers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {bot.businessProfile.services.map((service, i) => (
                <Badge key={i} variant="secondary">{service}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* FAQs Count */}
      <Card>
        <CardHeader>
          <CardTitle>Knowledge Base</CardTitle>
          <CardDescription>FAQs and training data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{bot.faqs?.length || 0}</div>
              <div className="text-sm text-muted-foreground">FAQs</div>
            </div>
            <Separator orientation="vertical" className="h-12" />
            <div className="text-center">
              <div className="text-2xl font-bold">{bot.rules?.specialInstructions?.length || 0}</div>
              <div className="text-sm text-muted-foreground">Special Instructions</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Billing Panel - Stripe subscription management
function BillingPanel({ clientId, clientName, status }: { clientId: string; clientName: string; status: string }) {
  const { toast } = useToast();

  const { data: subscription, isLoading } = useQuery({
    queryKey: ["/api/stripe/subscription", clientId],
    queryFn: async () => {
      const response = await fetch(`/api/stripe/subscription/${clientId}`, { credentials: "include" });
      if (!response.ok) return null;
      return response.json();
    },
  });

  const createCheckoutMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/stripe/checkout", { clientId });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.url) {
        window.open(data.url, '_blank');
      }
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create checkout session.", variant: "destructive" });
    },
  });

  const openPortalMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/stripe/portal", { clientId });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.url) {
        window.open(data.url, '_blank');
      }
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to open billing portal.", variant: "destructive" });
    },
  });

  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground">Loading billing information...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Current Status */}
      <Card>
        <CardHeader>
          <CardTitle>Subscription Status</CardTitle>
          <CardDescription>Current billing status for {clientName}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Current Status</p>
              <div className="flex items-center gap-2 mt-1">
                {status === 'active' && <Badge className="bg-green-500/20 text-green-500 border-green-500/30">ACTIVE</Badge>}
                {status === 'paused' && <Badge className="bg-red-500/20 text-red-500 border-red-500/30">PAUSED</Badge>}
                {status === 'demo' && <Badge className="bg-blue-500/20 text-blue-500 border-blue-500/30">DEMO</Badge>}
              </div>
            </div>
            {subscription?.plan && (
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Plan</p>
                <p className="font-medium">{subscription.plan}</p>
              </div>
            )}
          </div>

          {subscription?.currentPeriodEnd && (
            <div>
              <p className="text-sm text-muted-foreground">Next Billing Date</p>
              <p className="font-medium">{new Date(subscription.currentPeriodEnd).toLocaleDateString()}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Billing Actions</CardTitle>
          <CardDescription>Manage subscription and payments</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {!subscription ? (
            <Button 
              data-testid="button-create-subscription"
              onClick={() => createCheckoutMutation.mutate()}
              disabled={createCheckoutMutation.isPending}
              className="w-full"
            >
              <CreditCard className="h-4 w-4 mr-2" />
              {createCheckoutMutation.isPending ? 'Creating...' : 'Set Up Subscription'}
            </Button>
          ) : (
            <Button 
              data-testid="button-manage-billing"
              variant="outline"
              onClick={() => openPortalMutation.mutate()}
              disabled={openPortalMutation.isPending}
              className="w-full"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              {openPortalMutation.isPending ? 'Opening...' : 'Manage Billing in Stripe'}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Billing History Note */}
      <Card>
        <CardHeader>
          <CardTitle>Billing Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="text-sm text-muted-foreground space-y-2">
            <li>• Subscription status is synced automatically via Stripe webhooks</li>
            <li>• Failed payments will automatically pause the account</li>
            <li>• Use the Stripe portal to update payment methods or cancel</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

// Tone/Voice options
const TONE_OPTIONS = [
  { value: 'professional', label: 'Professional', description: 'Formal and business-like communication' },
  { value: 'friendly', label: 'Friendly', description: 'Warm and approachable tone' },
  { value: 'casual', label: 'Casual', description: 'Relaxed and conversational' },
  { value: 'compassionate', label: 'Compassionate', description: 'Empathetic and understanding' },
  { value: 'informative', label: 'Informative', description: 'Educational and detailed' },
];

// Bot Settings Panel - Full editing capabilities
function BotSettingsPanel({ bot, clientType }: { bot: BotConfig; clientType?: string }) {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [faqs, setFaqs] = useState<Array<{ question: string; answer: string }>>(bot.faqs || []);
  const [editingFaqIndex, setEditingFaqIndex] = useState<number | null>(null);
  const [newFaq, setNewFaq] = useState({ question: '', answer: '' });
  const [showAddFaq, setShowAddFaq] = useState(false);
  const [formData, setFormData] = useState({
    name: bot.name || '',
    description: bot.description || '',
    businessName: bot.businessProfile?.businessName || '',
    type: bot.businessProfile?.type || '',
    phone: bot.businessProfile?.phone || '',
    email: bot.businessProfile?.email || '',
    website: bot.businessProfile?.website || '',
    location: bot.businessProfile?.location || '',
    hours: formatHoursForDisplay(bot.businessProfile?.hours),
    services: bot.businessProfile?.services?.join(', ') || '',
    systemPrompt: bot.systemPrompt || '',
    tone: (bot as any).tone || 'professional',
    responseLength: (bot as any).responseLength || 'medium',
  });

  useEffect(() => {
    setFormData({
      name: bot.name || '',
      description: bot.description || '',
      businessName: bot.businessProfile?.businessName || '',
      type: bot.businessProfile?.type || '',
      phone: bot.businessProfile?.phone || '',
      email: bot.businessProfile?.email || '',
      website: bot.businessProfile?.website || '',
      location: bot.businessProfile?.location || '',
      hours: formatHoursForDisplay(bot.businessProfile?.hours),
      services: bot.businessProfile?.services?.join(', ') || '',
      systemPrompt: bot.systemPrompt || '',
      tone: (bot as any).tone || 'professional',
      responseLength: (bot as any).responseLength || 'medium',
    });
    setFaqs(bot.faqs || []);
    setIsEditing(false);
    setEditingFaqIndex(null);
    setShowAddFaq(false);
  }, [bot.botId]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const updatedBot = {
        ...bot,
        name: formData.name,
        description: formData.description,
        businessProfile: {
          ...bot.businessProfile,
          businessName: formData.businessName,
          type: formData.type,
          phone: formData.phone,
          email: formData.email,
          website: formData.website,
          location: formData.location,
          hours: parseHoursFromString(formData.hours),
          services: formData.services.split(',').map(s => s.trim()).filter(Boolean),
        },
        systemPrompt: formData.systemPrompt,
        tone: formData.tone,
        responseLength: formData.responseLength,
        faqs: faqs,
      };
      const response = await apiRequest("PUT", `/api/super-admin/bots/${bot.botId}`, updatedBot);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Saved", description: "Bot settings have been updated." });
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ["/api/super-admin/bots"] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to save settings.", variant: "destructive" });
    },
  });

  // FAQ management functions
  const handleAddFaq = () => {
    if (newFaq.question.trim() && newFaq.answer.trim()) {
      setFaqs([...faqs, { question: newFaq.question.trim(), answer: newFaq.answer.trim() }]);
      setNewFaq({ question: '', answer: '' });
      setShowAddFaq(false);
    }
  };

  const handleUpdateFaq = (index: number, field: 'question' | 'answer', value: string) => {
    const updated = [...faqs];
    updated[index] = { ...updated[index], [field]: value };
    setFaqs(updated);
  };

  const handleDeleteFaq = (index: number) => {
    setFaqs(faqs.filter((_, i) => i !== index));
    setEditingFaqIndex(null);
  };

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <div className="flex justify-end gap-2">
        {isEditing ? (
          <>
            <Button 
              data-testid="button-cancel-edit"
              variant="outline" 
              size="sm"
              onClick={() => setIsEditing(false)}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button 
              data-testid="button-save-settings"
              size="sm"
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
            >
              <Save className="h-4 w-4 mr-2" />
              {saveMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </>
        ) : (
          <Button 
            data-testid="button-edit-settings"
            variant="outline" 
            size="sm"
            onClick={() => setIsEditing(true)}
          >
            <Edit2 className="h-4 w-4 mr-2" />
            Edit Settings
          </Button>
        )}
      </div>

      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Bot Information</CardTitle>
          <CardDescription>Basic details about this chatbot</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Bot Name</Label>
              {isEditing ? (
                <Input
                  data-testid="input-bot-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              ) : (
                <p className="text-sm mt-1">{formData.name || '-'}</p>
              )}
            </div>
            <div>
              <Label>Business Type</Label>
              {isEditing ? (
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger data-testid="select-business-type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {BUSINESS_TYPES.map(type => (
                      <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-sm mt-1">{BUSINESS_TYPES.find(t => t.value === formData.type)?.label || formData.type || '-'}</p>
              )}
            </div>
          </div>
          <div>
            <Label>Description</Label>
            {isEditing ? (
              <Textarea
                data-testid="input-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
              />
            ) : (
              <p className="text-sm mt-1">{formData.description || '-'}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Business Profile */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Business Profile</CardTitle>
          <CardDescription>Contact and location information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Business Name
              </Label>
              {isEditing ? (
                <Input
                  data-testid="input-business-name"
                  value={formData.businessName}
                  onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                />
              ) : (
                <p className="text-sm mt-1">{formData.businessName || '-'}</p>
              )}
            </div>
            <div>
              <Label className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Phone
              </Label>
              {isEditing ? (
                <Input
                  data-testid="input-phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              ) : (
                <p className="text-sm mt-1">{formData.phone || '-'}</p>
              )}
            </div>
            <div>
              <Label className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email
              </Label>
              {isEditing ? (
                <Input
                  data-testid="input-email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              ) : (
                <p className="text-sm mt-1">{formData.email || '-'}</p>
              )}
            </div>
            <div>
              <Label className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Website
              </Label>
              {isEditing ? (
                <Input
                  data-testid="input-website"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                />
              ) : (
                <p className="text-sm mt-1">{formData.website || '-'}</p>
              )}
            </div>
          </div>
          <div>
            <Label className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Location
            </Label>
            {isEditing ? (
              <Input
                data-testid="input-location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              />
            ) : (
              <p className="text-sm mt-1">{formData.location || '-'}</p>
            )}
          </div>
          <div>
            <Label className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Business Hours
            </Label>
            {isEditing ? (
              <Textarea
                data-testid="input-hours"
                value={formData.hours}
                onChange={(e) => setFormData({ ...formData, hours: e.target.value })}
                placeholder="Monday: 9am-5pm&#10;Tuesday: 9am-5pm&#10;..."
                rows={4}
              />
            ) : (
              <pre className="text-sm mt-1 whitespace-pre-wrap">{formData.hours || '-'}</pre>
            )}
          </div>
          <div>
            <Label>Services</Label>
            {isEditing ? (
              <Textarea
                data-testid="input-services"
                value={formData.services}
                onChange={(e) => setFormData({ ...formData, services: e.target.value })}
                placeholder="Service 1, Service 2, Service 3"
                rows={2}
              />
            ) : (
              <p className="text-sm mt-1">{formData.services || '-'}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* AI Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">AI Behavior</CardTitle>
          <CardDescription>Configure how your bot communicates</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Tone & Voice Controls */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Tone / Voice</Label>
              {isEditing ? (
                <Select
                  value={formData.tone}
                  onValueChange={(value) => setFormData({ ...formData, tone: value })}
                >
                  <SelectTrigger data-testid="select-tone">
                    <SelectValue placeholder="Select tone" />
                  </SelectTrigger>
                  <SelectContent>
                    {TONE_OPTIONS.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex flex-col">
                          <span>{option.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-sm mt-1">{TONE_OPTIONS.find(t => t.value === formData.tone)?.label || 'Professional'}</p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                {TONE_OPTIONS.find(t => t.value === formData.tone)?.description}
              </p>
            </div>
            <div>
              <Label>Response Length</Label>
              {isEditing ? (
                <Select
                  value={formData.responseLength}
                  onValueChange={(value) => setFormData({ ...formData, responseLength: value })}
                >
                  <SelectTrigger data-testid="select-response-length">
                    <SelectValue placeholder="Select length" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="brief">Brief (1-2 sentences)</SelectItem>
                    <SelectItem value="medium">Medium (3-4 sentences)</SelectItem>
                    <SelectItem value="detailed">Detailed (5+ sentences)</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-sm mt-1 capitalize">{formData.responseLength}</p>
              )}
            </div>
          </div>

          <div>
            <Label>System Prompt</Label>
            {isEditing ? (
              <Textarea
                data-testid="input-system-prompt"
                value={formData.systemPrompt}
                onChange={(e) => setFormData({ ...formData, systemPrompt: e.target.value })}
                rows={8}
                className="font-mono text-sm"
              />
            ) : (
              <pre className="text-sm mt-1 whitespace-pre-wrap bg-muted p-3 rounded-lg max-h-48 overflow-auto">
                {formData.systemPrompt || 'No system prompt configured'}
              </pre>
            )}
          </div>
        </CardContent>
      </Card>

      {/* FAQs - Editable */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">FAQs ({faqs.length})</CardTitle>
              <CardDescription>Common questions and answers</CardDescription>
            </div>
            {isEditing && (
              <Button
                data-testid="button-add-faq"
                variant="outline"
                size="sm"
                onClick={() => setShowAddFaq(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add FAQ
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {/* Add New FAQ Form */}
          {showAddFaq && (
            <div className="bg-muted p-4 rounded-lg mb-4 space-y-3">
              <div>
                <Label>Question</Label>
                <Input
                  data-testid="input-new-faq-question"
                  value={newFaq.question}
                  onChange={(e) => setNewFaq({ ...newFaq, question: e.target.value })}
                  placeholder="Enter the question..."
                />
              </div>
              <div>
                <Label>Answer</Label>
                <Textarea
                  data-testid="input-new-faq-answer"
                  value={newFaq.answer}
                  onChange={(e) => setNewFaq({ ...newFaq, answer: e.target.value })}
                  placeholder="Enter the answer..."
                  rows={3}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  data-testid="button-save-new-faq"
                  size="sm"
                  onClick={handleAddFaq}
                  disabled={!newFaq.question.trim() || !newFaq.answer.trim()}
                >
                  Add
                </Button>
                <Button
                  data-testid="button-cancel-new-faq"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowAddFaq(false);
                    setNewFaq({ question: '', answer: '' });
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {faqs.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No FAQs configured. {isEditing && 'Click "Add FAQ" to create one.'}
            </p>
          ) : (
            <div className="space-y-3 max-h-80 overflow-auto">
              {faqs.map((faq, i) => (
                <div key={i} className="bg-muted p-3 rounded-lg">
                  {editingFaqIndex === i && isEditing ? (
                    <div className="space-y-2">
                      <Input
                        data-testid={`input-faq-question-${i}`}
                        value={faq.question}
                        onChange={(e) => handleUpdateFaq(i, 'question', e.target.value)}
                        placeholder="Question"
                      />
                      <Textarea
                        data-testid={`input-faq-answer-${i}`}
                        value={faq.answer}
                        onChange={(e) => handleUpdateFaq(i, 'answer', e.target.value)}
                        placeholder="Answer"
                        rows={3}
                      />
                      <div className="flex gap-2">
                        <Button
                          data-testid={`button-done-faq-${i}`}
                          size="sm"
                          onClick={() => setEditingFaqIndex(null)}
                        >
                          Done
                        </Button>
                        <Button
                          data-testid={`button-delete-faq-${i}`}
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteFaq(i)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{faq.question}</p>
                        <p className="text-sm text-muted-foreground mt-1">{faq.answer}</p>
                      </div>
                      {isEditing && (
                        <Button
                          data-testid={`button-edit-faq-${i}`}
                          variant="ghost"
                          size="icon"
                          onClick={() => setEditingFaqIndex(i)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Faith House Feature Gating - Only for sober_living clients */}
      {clientType === 'sober_living' && (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-primary" />
              Faith House Features
            </CardTitle>
            <CardDescription>Special features for sober living facilities</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Crisis Detection</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Automatic detection and response for crisis situations with 988 Suicide & Crisis Lifeline integration.
                  </p>
                  <Badge className="mt-2 bg-green-500/20 text-green-500">Enabled</Badge>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Pre-Intake Forms</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Collect sobriety status, support network, and timeline before booking tours.
                  </p>
                  <Badge className="mt-2 bg-green-500/20 text-green-500">Enabled</Badge>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Appointment Booking</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Allow visitors to schedule tours and intake appointments directly through chat.
                  </p>
                  <Badge className="mt-2 bg-green-500/20 text-green-500">Enabled</Badge>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Privacy Protection</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Automatic PII redaction from conversation logs and analytics.
                  </p>
                  <Badge className="mt-2 bg-green-500/20 text-green-500">Enabled</Badge>
                </CardContent>
              </Card>
            </div>

            {/* Crisis Keywords */}
            {bot.rules?.crisisHandling?.onCrisisKeywords && bot.rules.crisisHandling.onCrisisKeywords.length > 0 && (
              <div>
                <Label>Crisis Detection Keywords</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {bot.rules.crisisHandling.onCrisisKeywords.map((keyword, i) => (
                    <Badge key={i} variant="outline" className="bg-red-500/10 text-red-500 border-red-500/30">{keyword}</Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Analytics Panel
function AnalyticsPanel({ clientId }: { clientId: string }) {
  const { data: analytics, isLoading } = useQuery({
    queryKey: ["/api/client/analytics/summary", clientId],
    queryFn: async () => {
      const response = await fetch(`/api/client/analytics/summary?clientId=${clientId}`, { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch analytics");
      return response.json();
    },
  });

  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground">Loading analytics...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Messages (7d)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.messagesLast7d || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Conversations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.conversations || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Leads (7d)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.leadsLast7d || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Bookings (7d)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.bookingsLast7d || 0}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Analytics Dashboard</CardTitle>
          <CardDescription>View detailed analytics in the client dashboard</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={() => window.open(`/client/dashboard?clientId=${clientId}`, '_blank')}>
            <ExternalLink className="h-4 w-4 mr-2" />
            Open Full Analytics
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// Logs Panel
function LogsPanel({ clientId, botId }: { clientId: string; botId: string }) {
  const { data: logs, isLoading } = useQuery({
    queryKey: ["/api/platform/logs", clientId],
    queryFn: async () => {
      const response = await fetch(`/api/platform/logs/${clientId}`, { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch logs");
      return response.json();
    },
  });

  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground">Loading logs...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Conversation Logs</CardTitle>
        <CardDescription>Recent conversation activity for {botId}</CardDescription>
      </CardHeader>
      <CardContent>
        {logs?.files && logs.files.length > 0 ? (
          <div className="space-y-2">
            {logs.files.map((file: string, i: number) => (
              <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                <span className="font-mono text-sm">{file}</span>
                <Button variant="ghost" size="sm">
                  <Eye className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-8">No log files found</p>
        )}
      </CardContent>
    </Card>
  );
}

// Create from Template Modal
function CreateFromTemplateModal({
  open,
  onOpenChange,
  template: initialTemplate,
  templates,
  onSelectTemplate,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: Template | null;
  templates?: Template[];
  onSelectTemplate?: (template: Template) => void;
  onSuccess: (botId: string) => void;
}) {
  const { toast } = useToast();
  const [step, setStep] = useState(0); // 0 = template selection, 1-3 = form steps
  const [localTemplate, setLocalTemplate] = useState<Template | null>(null);
  const [formData, setFormData] = useState({
    clientId: '',
    clientName: '',
    businessName: '',
    phone: '',
    email: '',
    website: '',
    location: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    hours: '',
    services: '',
    customFaq: { question: '', answer: '' },
    serviceTier: 'standard',
    billingPlan: 'monthly',
  });

  // Track if this is the first open or a reopen to preserve progress
  const [wasOpened, setWasOpened] = useState(false);
  
  // Initialize state only on first open, preserve progress on reopen
  useEffect(() => {
    if (open && !wasOpened) {
      // First time opening: initialize with pre-selected template if provided
      setLocalTemplate(initialTemplate);
      setStep(initialTemplate ? 1 : 0);
      setFormData({
        clientId: '',
        clientName: '',
        businessName: '',
        phone: '',
        email: '',
        website: '',
        location: '',
        address: '',
        city: '',
        state: '',
        zip: '',
        contactName: '',
        contactEmail: '',
        contactPhone: '',
        hours: '',
        services: '',
        customFaq: { question: '', answer: '' },
        serviceTier: 'standard',
        billingPlan: 'monthly',
      });
      setWasOpened(true);
    }
  }, [open, wasOpened, initialTemplate]);
  
  // Reset wasOpened flag after success so next open is fresh
  const resetWizard = useCallback(() => {
    setWasOpened(false);
    setLocalTemplate(null);
    setStep(0);
    setFormData({
      clientId: '',
      clientName: '',
      businessName: '',
      phone: '',
      email: '',
      website: '',
      location: '',
      address: '',
      city: '',
      state: '',
      zip: '',
      contactName: '',
      contactEmail: '',
      contactPhone: '',
      hours: '',
      services: '',
      customFaq: { question: '', answer: '' },
      serviceTier: 'standard',
      billingPlan: 'monthly',
    });
  }, []);
  
  // Use local template for the wizard (doesn't reset on parent re-renders)
  const template = localTemplate;

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const fullLocation = [data.address, data.city, data.state, data.zip].filter(Boolean).join(', ') || data.location;
      const customFaqs = data.customFaq.question && data.customFaq.answer 
        ? [{ question: data.customFaq.question, answer: data.customFaq.answer }]
        : [];
      const response = await apiRequest("POST", "/api/super-admin/clients/from-template", {
        templateBotId: template?.botId,
        clientId: data.clientId,
        clientName: data.clientName,
        type: template?.businessProfile?.type || template?.metadata?.templateCategory,
        businessProfile: {
          businessName: data.businessName || data.clientName,
          type: template?.businessProfile?.type || template?.metadata?.templateCategory,
          phone: data.phone,
          email: data.email,
          website: data.website,
          location: fullLocation,
          address: data.address,
          city: data.city,
          state: data.state,
          zip: data.zip,
          hours: data.hours ? parseHoursFromString(data.hours) : undefined,
          services: data.services ? data.services.split(',').map(s => s.trim()).filter(Boolean) : undefined,
        },
        contact: {
          name: data.contactName,
          email: data.contactEmail,
          phone: data.contactPhone,
        },
        billing: {
          serviceTier: data.serviceTier,
          billingPlan: data.billingPlan,
        },
        customFaqs,
      });
      return response.json();
    },
    onSuccess: (data) => {
      toast({ title: "Bot Created", description: `Successfully created: ${formData.clientName}` });
      resetWizard(); // Reset wizard state for next use
      onSuccess(data.botId || `${formData.clientId}_bot`);
      
      // PDF requirement: "Stripe link generated" - redirect to checkout if available
      if (data.checkoutUrl) {
        toast({ 
          title: "Billing Setup", 
          description: "Redirecting to Stripe checkout...",
        });
        setTimeout(() => {
          window.open(data.checkoutUrl, '_blank');
        }, 1000);
      }
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to create bot.", 
        variant: "destructive" 
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1) {
      if (!formData.clientId || !formData.clientName) {
        toast({ title: "Error", description: "Client ID and Business Name are required.", variant: "destructive" });
        return;
      }
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleBack = () => {
    if (step === 1 && templates && templates.length > 0) {
      setStep(0); // Go back to template selection
    } else if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSelectTemplate = (t: Template) => {
    // When user selects template from the grid, update local state and advance to step 1
    setLocalTemplate(t);
    setStep(1);
    // Also notify parent for any external tracking
    onSelectTemplate?.(t);
  };

  const generateClientId = () => {
    const id = formData.clientName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_|_$/g, '');
    setFormData({ ...formData, clientId: id });
  };

  // Show nothing if closed and no templates available
  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        {step === 0 ? (
          /* Template Selection Step */
          <>
            <DialogHeader>
              <DialogTitle>Choose a Template</DialogTitle>
              <DialogDescription>
                Select a business type to start with pre-configured settings
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-3 mt-4 max-h-[400px] overflow-y-auto">
              {templates?.map((t) => (
                <Card
                  key={t.botId}
                  className="cursor-pointer hover-elevate transition-all"
                  onClick={() => handleSelectTemplate(t)}
                  data-testid={`template-select-${t.botId}`}
                >
                  <CardContent className="p-4 text-center">
                    <Building2 className="h-8 w-8 mx-auto mb-2 text-primary" />
                    <p className="font-medium text-sm">
                      {t.metadata?.templateCategory || t.businessProfile?.type || t.name}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        ) : (
          /* Form Steps */
          <>
            <DialogHeader>
              <DialogTitle>
                Create New Bot - Step {step} of 3
                {template && (
                  <Badge variant="outline" className="ml-2 text-xs">
                    {template.metadata?.templateCategory || template.businessProfile?.type}
                  </Badge>
                )}
              </DialogTitle>
              <DialogDescription>
                {step === 1 && "Basic business information"}
                {step === 2 && "Contact and location details"}
                {step === 3 && "Service tier and billing"}
              </DialogDescription>
            </DialogHeader>

            {/* Progress Indicator */}
            <div className="flex gap-2 mb-4">
              {[1, 2, 3].map((s) => (
                <div
                  key={s}
                  className={`h-2 flex-1 rounded-full ${s <= step ? 'bg-primary' : 'bg-muted'}`}
                />
              ))}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Step 1: Basic Info */}
              {step === 1 && (
                <div className="space-y-4">
                  <div>
                    <Label>Business Name *</Label>
                    <Input
                      data-testid="input-new-client-name"
                      value={formData.clientName}
                      onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                      placeholder="My Business Name"
                    />
                  </div>
                  <div>
                    <Label>Client ID *</Label>
                    <div className="flex gap-2">
                      <Input
                        data-testid="input-new-client-id"
                        value={formData.clientId}
                        onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                        placeholder="my_business"
                      />
                      <Button type="button" variant="outline" onClick={generateClientId}>
                        Generate
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Unique identifier (lowercase, underscores only)</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Business Phone</Label>
                      <Input
                        data-testid="input-new-phone"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="(555) 123-4567"
                      />
                    </div>
                    <div>
                      <Label>Business Email</Label>
                      <Input
                        data-testid="input-new-email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="contact@business.com"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Website</Label>
                    <Input
                      data-testid="input-new-website"
                      value={formData.website}
                      onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                      placeholder="https://mybusiness.com"
                    />
                  </div>
                </div>
              )}

              {/* Step 2: Address & Contact */}
              {step === 2 && (
                <div className="space-y-4">
                  <div>
                    <Label>Street Address</Label>
                    <Input
                      data-testid="input-new-address"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="123 Main Street"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label>City</Label>
                      <Input
                        data-testid="input-new-city"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        placeholder="City"
                      />
                    </div>
                    <div>
                      <Label>State</Label>
                      <Input
                        data-testid="input-new-state"
                        value={formData.state}
                        onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                        placeholder="FL"
                      />
                    </div>
                    <div>
                      <Label>ZIP</Label>
                      <Input
                        data-testid="input-new-zip"
                        value={formData.zip}
                        onChange={(e) => setFormData({ ...formData, zip: e.target.value })}
                        placeholder="34990"
                      />
                    </div>
                  </div>
                  <Separator />
                  <p className="text-sm font-medium">Primary Contact</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <Label>Contact Name</Label>
                      <Input
                        data-testid="input-new-contact-name"
                        value={formData.contactName}
                        onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                        placeholder="John Smith"
                      />
                    </div>
                    <div>
                      <Label>Contact Email</Label>
                      <Input
                        data-testid="input-new-contact-email"
                        value={formData.contactEmail}
                        onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                        placeholder="john@business.com"
                      />
                    </div>
                    <div>
                      <Label>Contact Phone</Label>
                      <Input
                        data-testid="input-new-contact-phone"
                        value={formData.contactPhone}
                        onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                        placeholder="(555) 123-4567"
                      />
                    </div>
                  </div>
                  <Separator />
                  <p className="text-sm font-medium">Business Details</p>
                  <div>
                    <Label>Business Hours</Label>
                    <Textarea
                      data-testid="input-new-hours"
                      value={formData.hours}
                      onChange={(e) => setFormData({ ...formData, hours: e.target.value })}
                      placeholder="Monday-Friday: 9am-5pm&#10;Saturday: 10am-2pm&#10;Sunday: Closed"
                      rows={3}
                    />
                    <p className="text-xs text-muted-foreground mt-1">One schedule per line</p>
                  </div>
                  <div>
                    <Label>Services Offered</Label>
                    <Textarea
                      data-testid="input-new-services"
                      value={formData.services}
                      onChange={(e) => setFormData({ ...formData, services: e.target.value })}
                      placeholder="Service 1, Service 2, Service 3"
                      rows={2}
                    />
                    <p className="text-xs text-muted-foreground mt-1">Comma-separated list</p>
                  </div>
                  <div>
                    <Label>Custom FAQ (Optional)</Label>
                    <Input
                      data-testid="input-new-faq-q"
                      value={formData.customFaq.question}
                      onChange={(e) => setFormData({ ...formData, customFaq: { ...formData.customFaq, question: e.target.value } })}
                      placeholder="Question"
                      className="mb-2"
                    />
                    <Textarea
                      data-testid="input-new-faq-a"
                      value={formData.customFaq.answer}
                      onChange={(e) => setFormData({ ...formData, customFaq: { ...formData.customFaq, answer: e.target.value } })}
                      placeholder="Answer"
                      rows={2}
                    />
                  </div>
                </div>
              )}

              {/* Step 3: Service & Billing */}
              {step === 3 && (
                <div className="space-y-4">
                  <div>
                    <Label>Service Tier</Label>
                    <Select
                      value={formData.serviceTier}
                      onValueChange={(value) => setFormData({ ...formData, serviceTier: value })}
                    >
                      <SelectTrigger data-testid="select-service-tier">
                        <SelectValue placeholder="Select tier" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="starter">Starter - Basic chatbot features</SelectItem>
                        <SelectItem value="standard">Standard - Full features + analytics</SelectItem>
                        <SelectItem value="premium">Premium - Everything + priority support</SelectItem>
                        <SelectItem value="enterprise">Enterprise - Custom solutions</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Billing Plan</Label>
                    <Select
                      value={formData.billingPlan}
                      onValueChange={(value) => setFormData({ ...formData, billingPlan: value })}
                    >
                      <SelectTrigger data-testid="select-billing-plan">
                        <SelectValue placeholder="Select plan" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monthly">Monthly - Billed each month</SelectItem>
                        <SelectItem value="annual">Annual - 2 months free</SelectItem>
                        <SelectItem value="trial">Free Trial - 14 days</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Card className="bg-muted/50">
                    <CardContent className="pt-4">
                      <p className="text-sm font-medium mb-2">Summary</p>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>Business: {formData.clientName || '-'}</li>
                        <li>Type: {template?.metadata?.templateCategory || template?.businessProfile?.type || 'Custom'}</li>
                        <li>Tier: {formData.serviceTier}</li>
                        <li>Billing: {formData.billingPlan}</li>
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              )}

              <DialogFooter className="flex justify-between">
                <div>
                  {step > 1 && (
                    <Button type="button" variant="outline" onClick={handleBack}>
                      Back
                    </Button>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                    Cancel
                  </Button>
                  <Button 
                    data-testid="button-next-step"
                    type="submit" 
                    disabled={createMutation.isPending || !template}
                  >
                    {step < 3 ? 'Next' : (createMutation.isPending ? 'Creating...' : 'Create Bot')}
                  </Button>
                </div>
              </DialogFooter>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

// Install Panel - Embed code generator for widget installation
function InstallPanel({ bot, client }: { bot: BotConfig; client: Client }) {
  const [copied, setCopied] = useState(false);
  const [position, setPosition] = useState("bottom-right");
  const [primaryColor, setPrimaryColor] = useState("#2563eb");
  const [greeting, setGreeting] = useState(`Hi! How can I help you today?`);
  
  const baseUrl = window.location.origin;
  
  const embedCode = `<script
  src="${baseUrl}/widget/embed.js"
  data-client-id="${client.id}"
  data-bot-id="${bot.botId}"
  data-primary-color="${primaryColor}"
  data-position="${position}"
  data-greeting="${greeting}"
></script>`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(embedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="h-5 w-5" />
            Widget Installation
          </CardTitle>
          <CardDescription>
            Add the chatbot to your website by copying this code snippet
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Customization Options */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Position</Label>
              <Select value={position} onValueChange={setPosition}>
                <SelectTrigger data-testid="select-widget-position">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bottom-right">Bottom Right</SelectItem>
                  <SelectItem value="bottom-left">Bottom Left</SelectItem>
                  <SelectItem value="top-right">Top Right</SelectItem>
                  <SelectItem value="top-left">Top Left</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Primary Color</Label>
              <div className="flex gap-2">
                <Input
                  data-testid="input-widget-color"
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-12 h-10 p-1 cursor-pointer"
                />
                <Input
                  data-testid="input-widget-color-text"
                  type="text"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="flex-1"
                  placeholder="#2563eb"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Greeting Message</Label>
              <Input
                data-testid="input-widget-greeting"
                value={greeting}
                onChange={(e) => setGreeting(e.target.value)}
                placeholder="Hi! How can I help you today?"
              />
            </div>
          </div>

          <Separator />

          {/* Embed Code */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Embed Code</Label>
              <Button
                data-testid="button-copy-embed"
                variant="outline"
                size="sm"
                onClick={handleCopy}
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Code
                  </>
                )}
              </Button>
            </div>
            <div className="relative">
              <pre className="bg-muted p-4 rounded-md overflow-x-auto text-sm font-mono">
                <code data-testid="code-embed-snippet">{embedCode}</code>
              </pre>
            </div>
          </div>

          <Separator />

          {/* Instructions */}
          <div className="space-y-3">
            <Label>Installation Steps</Label>
            <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
              <li>Copy the embed code above</li>
              <li>Paste it just before the closing <code className="bg-muted px-1 rounded">&lt;/body&gt;</code> tag on your website</li>
              <li>The chat widget will appear automatically in the selected position</li>
              <li>Visitors can click the bubble to start chatting with your AI assistant</li>
            </ol>
          </div>

          {/* Preview Button */}
          <div className="flex gap-2">
            <Button
              data-testid="button-preview-widget"
              variant="outline"
              onClick={() => window.open(`/widget/preview.html?clientId=${client.id}&botId=${bot.botId}`, '_blank')}
            >
              <Eye className="h-4 w-4 mr-2" />
              Preview Widget
            </Button>
            <Button
              data-testid="button-test-widget"
              variant="outline"
              onClick={() => window.open(`/demo/${bot.botId}`, '_blank')}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Test in Demo Mode
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Widget Configuration Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Configuration Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Client ID:</span>
              <code className="ml-2 bg-muted px-2 py-1 rounded">{client.id}</code>
            </div>
            <div>
              <span className="text-muted-foreground">Bot ID:</span>
              <code className="ml-2 bg-muted px-2 py-1 rounded">{bot.botId}</code>
            </div>
            <div>
              <span className="text-muted-foreground">Business:</span>
              <span className="ml-2">{bot.businessProfile?.businessName || client.name}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Status:</span>
              <Badge variant={client.status === 'active' ? 'default' : 'secondary'} className="ml-2">
                {client.status}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

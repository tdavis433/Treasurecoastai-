import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useEffect } from "react";
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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Building2, Users, FileText, Settings, BarChart3, MessageSquare, 
  Plus, Play, Pause, Eye, Edit2, Save, X, LogOut, Zap, 
  AlertTriangle, Phone, Mail, Globe, MapPin, Clock, Trash2,
  ChevronRight, Search, CreditCard, ExternalLink
} from "lucide-react";

interface Client {
  id: string;
  name: string;
  type?: string;
  status: 'active' | 'paused' | 'demo';
  bots: string[];
  createdAt?: string;
}

interface BotConfig {
  botId: string;
  clientId: string;
  metadata: {
    name: string;
    description: string;
    businessType: string;
    isTemplate?: boolean;
    templateCategory?: string;
  };
  businessProfile: {
    businessName: string;
    phone?: string;
    email?: string;
    website?: string;
    location?: string;
    hours?: string;
    tagline?: string;
    services?: string[];
    tone?: string;
  };
  faqs?: Array<{ question: string; answer: string }>;
  safetyRules?: any;
  integrations?: {
    bookingUrl?: string;
    facebook?: string;
    instagram?: string;
  };
}

interface Template extends BotConfig {
  metadata: BotConfig['metadata'] & {
    isTemplate: true;
    templateCategory: string;
  };
}

interface AnalyticsSummary {
  messagesLast7d: number;
  leadsLast7d: number;
  bookingsLast7d: number;
  conversations: number;
  crisisEvents: number;
}

interface AuthUser {
  id: string;
  username: string;
  role: 'super_admin' | 'client_admin';
  clientId?: string;
}

const BUSINESS_TYPES = [
  { value: 'restaurant', label: 'Restaurant' },
  { value: 'barber', label: 'Barber / Salon' },
  { value: 'auto', label: 'Auto Shop' },
  { value: 'home_services', label: 'Home Services' },
  { value: 'gym', label: 'Gym / Fitness' },
  { value: 'sober_living', label: 'Sober Living' },
];

const TONE_OPTIONS = [
  { value: 'friendly', label: 'Friendly & Casual' },
  { value: 'professional', label: 'Professional & Concise' },
  { value: 'supportive', label: 'Supportive & Reassuring' },
  { value: 'energetic', label: 'High-Energy & Enthusiastic' },
];

export default function ControlCenter() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
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

  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ["/api/super-admin/clients"],
    enabled: currentUser?.role === "super_admin",
  });

  const { data: templates = [] } = useQuery<Template[]>({
    queryKey: ["/api/super-admin/templates"],
    enabled: currentUser?.role === "super_admin",
  });

  const selectedClient = clients.find(c => c.id === selectedClientId);

  const { data: clientBots = [] } = useQuery<BotConfig[]>({
    queryKey: ["/api/super-admin/bots", { clientId: selectedClientId }],
    queryFn: async () => {
      const response = await fetch(`/api/super-admin/bots?clientId=${selectedClientId}`, { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch bots");
      return response.json();
    },
    enabled: !!selectedClientId && currentUser?.role === "super_admin",
  });

  const selectedBot = clientBots.find(b => b.botId === selectedBotId) || clientBots[0];

  const { data: analytics } = useQuery<AnalyticsSummary>({
    queryKey: ["/api/super-admin/analytics", selectedClientId],
    queryFn: async () => {
      const response = await fetch(`/api/client/analytics/summary?clientId=${selectedClientId}`, { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch analytics");
      return response.json();
    },
    enabled: !!selectedClientId && currentUser?.role === "super_admin",
  });

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

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="h-14 border-b bg-card flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <Zap className="h-6 w-6 text-primary" />
          <span className="font-semibold text-lg">Treasure Coast AI – Control Center</span>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="text-green-500 border-green-500/30">
            All Systems Operational
          </Badge>
          <span className="text-sm text-muted-foreground">{currentUser?.username}</span>
          <Button data-testid="button-logout" variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-72 border-r bg-card flex flex-col">
          <div className="p-4 border-b">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3">Clients</h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                data-testid="input-search-clients"
                placeholder="Search clients..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-2">
              {filteredClients.map(client => (
                <button
                  key={client.id}
                  data-testid={`button-client-${client.id}`}
                  onClick={() => {
                    setSelectedClientId(client.id);
                    setSelectedBotId(null);
                    setActiveTab('overview');
                  }}
                  className={`w-full text-left p-3 rounded-lg mb-1 transition-colors ${
                    selectedClientId === client.id 
                      ? 'bg-primary/10 border border-primary/30' 
                      : 'hover:bg-muted'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium truncate">{client.name}</span>
                    {getStatusBadge(client.status)}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {client.type || 'No type'} • {client.bots?.length || 0} bot(s)
                  </div>
                </button>
              ))}
            </div>
          </ScrollArea>

          <Separator />

          <div className="p-4">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3">Templates</h3>
            <div className="space-y-1">
              {templates.map(template => (
                <button
                  key={template.botId}
                  data-testid={`button-template-${template.botId}`}
                  onClick={() => {
                    setSelectedTemplate(template);
                    setShowCreateModal(true);
                  }}
                  className="w-full text-left p-2 rounded-lg hover:bg-muted transition-colors flex items-center justify-between group"
                >
                  <span className="text-sm">{template.metadata.templateCategory || template.metadata.businessType}</span>
                  <Plus className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              ))}
              {templates.length === 0 && (
                <p className="text-xs text-muted-foreground">No templates available</p>
              )}
            </div>
          </div>

          <Separator />

          <div className="p-4">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3">System</h3>
            <div className="space-y-1">
              <Button 
                data-testid="button-settings-legacy"
                variant="ghost" 
                size="sm" 
                className="w-full justify-start"
                onClick={() => setLocation('/super-admin')}
              >
                <Settings className="h-4 w-4 mr-2" />
                Legacy Settings
              </Button>
              <Button 
                data-testid="button-stripe-portal"
                variant="ghost" 
                size="sm" 
                className="w-full justify-start"
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Stripe Settings
              </Button>
            </div>
          </div>
        </aside>

        <main className="flex-1 overflow-auto">
          {selectedClient ? (
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-2xl font-bold">{selectedClient.name}</h1>
                  <p className="text-muted-foreground">
                    {selectedClient.id} • {selectedClient.type || 'No type set'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Select
                    value={selectedClient.status}
                    onValueChange={(value) => updateStatusMutation.mutate({ 
                      clientId: selectedClient.id, 
                      status: value 
                    })}
                  >
                    <SelectTrigger data-testid="select-status" className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="paused">Paused</SelectItem>
                      <SelectItem value="demo">Demo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="mb-6">
                  <TabsTrigger data-testid="tab-overview" value="overview">Overview</TabsTrigger>
                  <TabsTrigger data-testid="tab-bot-settings" value="bot-settings">Bot Settings</TabsTrigger>
                  <TabsTrigger data-testid="tab-subscription" value="subscription">Status & Subscription</TabsTrigger>
                  <TabsTrigger data-testid="tab-analytics" value="analytics">Analytics</TabsTrigger>
                  <TabsTrigger data-testid="tab-logs" value="logs">Logs</TabsTrigger>
                </TabsList>

                <TabsContent value="overview">
                  <OverviewTab 
                    client={selectedClient} 
                    bots={clientBots}
                    analytics={analytics}
                    onSelectBot={(botId) => {
                      setSelectedBotId(botId);
                      setActiveTab('bot-settings');
                    }}
                  />
                </TabsContent>

                <TabsContent value="bot-settings">
                  <BotSettingsTab 
                    client={selectedClient}
                    bots={clientBots}
                    selectedBotId={selectedBotId}
                    onSelectBot={setSelectedBotId}
                  />
                </TabsContent>

                <TabsContent value="subscription">
                  <SubscriptionTab client={selectedClient} />
                </TabsContent>

                <TabsContent value="analytics">
                  <AnalyticsTab clientId={selectedClient.id} />
                </TabsContent>

                <TabsContent value="logs">
                  <LogsTab clientId={selectedClient.id} />
                </TabsContent>
              </Tabs>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Select a client from the sidebar to view details</p>
                <p className="text-sm mt-2">Or use a template to create a new client</p>
              </div>
            </div>
          )}
        </main>

        {selectedClient && (
          <aside className="w-64 border-l bg-card p-4">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <Button 
                data-testid="button-open-demo"
                variant="outline" 
                size="sm" 
                className="w-full justify-start"
                onClick={() => window.open(`/demo/${clientBots[0]?.botId || selectedClient.bots[0]}`, '_blank')}
              >
                <Eye className="h-4 w-4 mr-2" />
                Open Client Demo
              </Button>
              <Button 
                data-testid="button-client-dashboard"
                variant="outline" 
                size="sm" 
                className="w-full justify-start"
                onClick={() => setLocation(`/client/dashboard?clientId=${selectedClient.id}`)}
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Client Dashboard
              </Button>
              <Button 
                data-testid="button-edit-bot"
                variant="outline" 
                size="sm" 
                className="w-full justify-start"
                onClick={() => setLocation(`/admin/bot/${clientBots[0]?.botId || selectedClient.bots[0]}`)}
              >
                <Edit2 className="h-4 w-4 mr-2" />
                Advanced Bot Editor
              </Button>
            </div>

            {selectedClient.type === 'sober_living' && (
              <>
                <Separator className="my-4" />
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-4">Faith House Features</h3>
                <div className="space-y-2">
                  <Button 
                    data-testid="button-crisis-settings"
                    variant="outline" 
                    size="sm" 
                    className="w-full justify-start"
                  >
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Crisis Settings
                  </Button>
                  <Button 
                    data-testid="button-intake-settings"
                    variant="outline" 
                    size="sm" 
                    className="w-full justify-start"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Intake Settings
                  </Button>
                </div>
              </>
            )}
          </aside>
        )}
      </div>

      <CreateClientFromTemplateModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        template={selectedTemplate}
        onSuccess={(newClientId) => {
          setShowCreateModal(false);
          setSelectedTemplate(null);
          setSelectedClientId(newClientId);
          queryClient.invalidateQueries({ queryKey: ["/api/super-admin/clients"] });
        }}
      />
    </div>
  );
}

function OverviewTab({ 
  client, 
  bots, 
  analytics,
  onSelectBot 
}: { 
  client: Client; 
  bots: BotConfig[];
  analytics?: AnalyticsSummary;
  onSelectBot: (botId: string) => void;
}) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            <CardTitle className="text-sm font-medium text-muted-foreground">Leads Captured (7d)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.leadsLast7d || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Booking Requests (7d)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.bookingsLast7d || 0}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Bots</CardTitle>
          <CardDescription>All bots configured for this client</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {bots.map(bot => (
              <div 
                key={bot.botId}
                className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
              >
                <div>
                  <div className="font-medium">{bot.metadata.name || bot.botId}</div>
                  <div className="text-sm text-muted-foreground">
                    {bot.metadata.businessType} • {bot.businessProfile?.businessName || 'No business name'}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    data-testid={`button-edit-bot-${bot.botId}`}
                    variant="ghost" 
                    size="sm"
                    onClick={() => onSelectBot(bot.botId)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button 
                    data-testid={`button-preview-bot-${bot.botId}`}
                    variant="ghost" 
                    size="sm"
                    onClick={() => window.open(`/demo/${bot.botId}`, '_blank')}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            {bots.length === 0 && (
              <p className="text-muted-foreground text-center py-4">No bots configured</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function BotSettingsTab({ 
  client, 
  bots, 
  selectedBotId,
  onSelectBot 
}: { 
  client: Client; 
  bots: BotConfig[];
  selectedBotId: string | null;
  onSelectBot: (botId: string) => void;
}) {
  const { toast } = useToast();
  const bot = bots.find(b => b.botId === selectedBotId) || bots[0];
  
  const [formData, setFormData] = useState<Partial<BotConfig['businessProfile']>>({});
  const [faqs, setFaqs] = useState<Array<{ question: string; answer: string }>>([]);
  const [services, setServices] = useState<string[]>([]);
  const [newService, setNewService] = useState('');
  const [newFaq, setNewFaq] = useState({ question: '', answer: '' });

  useEffect(() => {
    if (bot) {
      setFormData(bot.businessProfile || {});
      setFaqs(bot.faqs || []);
      setServices(bot.businessProfile?.services || []);
    }
  }, [bot]);

  const updateBotMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("PUT", `/api/super-admin/bots/${bot.botId}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/super-admin/bots"] });
      toast({ title: "Bot Updated", description: "Bot settings have been saved." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update bot settings.", variant: "destructive" });
    },
  });

  const handleSave = () => {
    updateBotMutation.mutate({
      businessProfile: {
        ...formData,
        services,
      },
      faqs,
    });
  };

  const addService = () => {
    if (newService.trim()) {
      setServices([...services, newService.trim()]);
      setNewService('');
    }
  };

  const removeService = (index: number) => {
    setServices(services.filter((_, i) => i !== index));
  };

  const addFaq = () => {
    if (newFaq.question.trim() && newFaq.answer.trim()) {
      setFaqs([...faqs, newFaq]);
      setNewFaq({ question: '', answer: '' });
    }
  };

  const removeFaq = (index: number) => {
    setFaqs(faqs.filter((_, i) => i !== index));
  };

  if (!bot) {
    return <p className="text-muted-foreground">No bot selected</p>;
  }

  return (
    <div className="space-y-6">
      {bots.length > 1 && (
        <div className="flex items-center gap-2">
          <Label>Select Bot:</Label>
          <Select value={bot.botId} onValueChange={onSelectBot}>
            <SelectTrigger data-testid="select-bot" className="w-64">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {bots.map(b => (
                <SelectItem key={b.botId} value={b.botId}>
                  {b.metadata.name || b.botId}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
          <CardDescription>Core business details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="businessName">Business Name</Label>
              <Input
                id="businessName"
                data-testid="input-business-name"
                value={formData.businessName || ''}
                onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tone">Tone</Label>
              <Select 
                value={formData.tone || 'friendly'} 
                onValueChange={(value) => setFormData({ ...formData, tone: value })}
              >
                <SelectTrigger data-testid="select-tone">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TONE_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tagline">Tagline / Description</Label>
            <Textarea
              id="tagline"
              data-testid="input-tagline"
              value={formData.tagline || ''}
              onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="phone"
                  data-testid="input-phone"
                  className="pl-9"
                  value={formData.phone || ''}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  data-testid="input-email"
                  className="pl-9"
                  value={formData.email || ''}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="website"
                  data-testid="input-website"
                  className="pl-9"
                  value={formData.website || ''}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="location"
                  data-testid="input-location"
                  className="pl-9"
                  value={formData.location || ''}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="hours">Hours</Label>
            <div className="relative">
              <Clock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Textarea
                id="hours"
                data-testid="input-hours"
                className="pl-9"
                value={formData.hours || ''}
                onChange={(e) => setFormData({ ...formData, hours: e.target.value })}
                rows={2}
                placeholder="e.g., Mon-Fri: 9am-5pm, Sat: 10am-2pm"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Services</CardTitle>
          <CardDescription>List of services offered</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              data-testid="input-new-service"
              placeholder="Add a service..."
              value={newService}
              onChange={(e) => setNewService(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addService()}
            />
            <Button data-testid="button-add-service" onClick={addService} size="sm">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {services.map((service, index) => (
              <Badge key={index} variant="secondary" className="pr-1">
                {service}
                <button 
                  data-testid={`button-remove-service-${index}`}
                  onClick={() => removeService(index)}
                  className="ml-2 hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>FAQs</CardTitle>
          <CardDescription>Frequently asked questions for the bot to reference</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3 border rounded-lg p-4">
            <Input
              data-testid="input-new-faq-question"
              placeholder="Question..."
              value={newFaq.question}
              onChange={(e) => setNewFaq({ ...newFaq, question: e.target.value })}
            />
            <Textarea
              data-testid="input-new-faq-answer"
              placeholder="Answer..."
              value={newFaq.answer}
              onChange={(e) => setNewFaq({ ...newFaq, answer: e.target.value })}
              rows={2}
            />
            <Button data-testid="button-add-faq" onClick={addFaq} size="sm">
              <Plus className="h-4 w-4 mr-2" /> Add FAQ
            </Button>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="font-medium">{faq.question}</p>
                    <p className="text-sm text-muted-foreground mt-1">{faq.answer}</p>
                  </div>
                  <Button 
                    data-testid={`button-remove-faq-${index}`}
                    variant="ghost" 
                    size="sm"
                    onClick={() => removeFaq(index)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button 
          data-testid="button-save-bot-settings"
          onClick={handleSave}
          disabled={updateBotMutation.isPending}
        >
          <Save className="h-4 w-4 mr-2" />
          {updateBotMutation.isPending ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
}

function SubscriptionTab({ client }: { client: Client }) {
  const { toast } = useToast();

  const { data: subscriptionData } = useQuery({
    queryKey: ["/api/stripe/subscription", client.id],
    queryFn: async () => {
      const response = await fetch(`/api/stripe/subscription/${client.id}`, { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch subscription");
      return response.json();
    },
  });

  const createCheckoutMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/stripe/checkout", {
        clientId: client.id,
        priceId: 'default', 
        businessName: client.name,
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create checkout session.", variant: "destructive" });
    },
  });

  const openPortalMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/stripe/portal", { clientId: client.id });
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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Client Status</CardTitle>
          <CardDescription>Current status and subscription information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <span className="text-muted-foreground">Current Status:</span>
            <Badge 
              className={
                client.status === 'active' ? 'bg-green-500/20 text-green-400' :
                client.status === 'paused' ? 'bg-red-500/20 text-red-400' :
                'bg-blue-500/20 text-blue-400'
              }
            >
              {client.status.toUpperCase()}
            </Badge>
          </div>

          {subscriptionData?.hasActiveSubscription ? (
            <div className="space-y-4">
              <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                <div className="flex items-center gap-2 text-green-500">
                  <Zap className="h-5 w-5" />
                  <span className="font-medium">Active Subscription</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Subscription ID: {subscriptionData.subscription?.id}
                </p>
              </div>
              <Button 
                data-testid="button-manage-billing"
                variant="outline" 
                onClick={() => openPortalMutation.mutate()}
                disabled={openPortalMutation.isPending}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Manage Billing
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-muted-foreground">No active subscription</p>
              </div>
              <Button 
                data-testid="button-start-subscription"
                onClick={() => createCheckoutMutation.mutate()}
                disabled={createCheckoutMutation.isPending}
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Start Subscription
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function AnalyticsTab({ clientId }: { clientId: string }) {
  const { data: trends } = useQuery({
    queryKey: ["/api/client/analytics/trends", clientId],
    queryFn: async () => {
      const response = await fetch(`/api/client/analytics/trends?clientId=${clientId}&days=30`, { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch trends");
      return response.json();
    },
  });

  const { data: summary } = useQuery<AnalyticsSummary>({
    queryKey: ["/api/client/analytics/summary", clientId],
    queryFn: async () => {
      const response = await fetch(`/api/client/analytics/summary?clientId=${clientId}`, { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch summary");
      return response.json();
    },
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Conversations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.conversations || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Messages (7d)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.messagesLast7d || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Leads (7d)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.leadsLast7d || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Crisis Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.crisisEvents || 0}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Message Trend (30 days)</CardTitle>
        </CardHeader>
        <CardContent>
          {trends?.trends && trends.trends.length > 0 ? (
            <div className="h-48 flex items-end gap-1">
              {trends.trends.slice(-30).map((day: any, i: number) => (
                <div 
                  key={i}
                  className="flex-1 bg-primary/80 rounded-t"
                  style={{ height: `${Math.max(4, (day.messages / Math.max(...trends.trends.map((t: any) => t.messages), 1)) * 100)}%` }}
                  title={`${day.date}: ${day.messages} messages`}
                />
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">No trend data available</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function LogsTab({ clientId }: { clientId: string }) {
  const { data: logs } = useQuery({
    queryKey: ["/api/platform/logs", clientId],
    queryFn: async () => {
      const response = await fetch(`/api/platform/logs/${clientId}`, { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch logs");
      return response.json();
    },
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Conversation Logs</CardTitle>
          <CardDescription>Recent conversation activity</CardDescription>
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
    </div>
  );
}

function CreateClientFromTemplateModal({
  open,
  onOpenChange,
  template,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: Template | null;
  onSuccess: (clientId: string) => void;
}) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    clientId: '',
    clientName: '',
    type: '',
    phone: '',
    email: '',
    website: '',
    location: '',
    hours: '',
  });

  useEffect(() => {
    if (template) {
      setFormData(prev => ({
        ...prev,
        type: template.metadata.templateCategory || template.metadata.businessType || '',
      }));
    }
  }, [template]);

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await apiRequest("POST", "/api/super-admin/clients/from-template", {
        templateBotId: template?.botId,
        clientId: data.clientId,
        clientName: data.clientName,
        type: data.type,
        businessProfile: {
          phone: data.phone,
          email: data.email,
          website: data.website,
          location: data.location,
          hours: data.hours,
        },
      });
      return response.json();
    },
    onSuccess: (data) => {
      toast({ title: "Client Created", description: `Successfully created client: ${formData.clientName}` });
      onSuccess(data.clientId || formData.clientId);
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to create client.", 
        variant: "destructive" 
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.clientId || !formData.clientName) {
      toast({ title: "Error", description: "Client ID and Name are required.", variant: "destructive" });
      return;
    }
    createMutation.mutate(formData);
  };

  const generateClientId = () => {
    const id = formData.clientName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_|_$/g, '');
    setFormData({ ...formData, clientId: id });
  };

  if (!template) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Create New Client from Template</DialogTitle>
          <DialogDescription>
            Creating from: {template.metadata.templateCategory || template.metadata.businessType} template
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="clientName">Client Name *</Label>
              <Input
                id="clientName"
                data-testid="input-modal-client-name"
                value={formData.clientName}
                onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                placeholder="Blue Harbor Grill"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="clientId">Client ID *</Label>
              <div className="flex gap-2">
                <Input
                  id="clientId"
                  data-testid="input-modal-client-id"
                  value={formData.clientId}
                  onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                  placeholder="blue_harbor_grill"
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={generateClientId}
                >
                  Auto
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Business Type</Label>
            <Select 
              value={formData.type} 
              onValueChange={(value) => setFormData({ ...formData, type: value })}
            >
              <SelectTrigger data-testid="select-modal-type">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {BUSINESS_TYPES.map(type => (
                  <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                data-testid="input-modal-phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                data-testid="input-modal-email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                data-testid="input-modal-website"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                data-testid="input-modal-location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="hours">Hours</Label>
            <Textarea
              id="hours"
              data-testid="input-modal-hours"
              value={formData.hours}
              onChange={(e) => setFormData({ ...formData, hours: e.target.value })}
              rows={2}
              placeholder="Mon-Fri: 9am-5pm"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              data-testid="button-modal-create"
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? 'Creating...' : 'Create Client'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

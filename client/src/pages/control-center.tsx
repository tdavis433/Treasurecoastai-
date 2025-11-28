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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  Bot, Users, FileText, Settings, BarChart3, MessageSquare, 
  Plus, Play, Pause, Eye, Edit2, Save, X, LogOut, Zap, 
  AlertTriangle, Phone, Mail, Globe, MapPin, Clock, Trash2,
  ChevronRight, Search, CreditCard, ExternalLink, Building2
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
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
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
        {/* Left Sidebar - Bot List */}
        <aside className="w-80 border-r bg-card flex flex-col">
          <div className="p-4 border-b">
            <h3 className="font-semibold text-base text-muted-foreground uppercase tracking-wide mb-3">
              Chatbots ({clientBots.length})
            </h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                data-testid="input-search-bots"
                placeholder="Search bots..."
                className="pl-9 text-base"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-3">
              {filteredBots.length === 0 ? (
                <p className="text-base text-muted-foreground text-center py-4">No bots found</p>
              ) : (
                filteredBots.map(bot => {
                  const client = clients.find(c => c.id === bot.clientId);
                  return (
                    <button
                      key={bot.botId}
                      data-testid={`button-bot-${bot.botId}`}
                      onClick={() => {
                        setSelectedBotId(bot.botId);
                        setActiveTab('settings');
                      }}
                      className={`w-full text-left p-4 rounded-lg mb-2 transition-colors ${
                        selectedBotId === bot.botId 
                          ? 'bg-primary/10 border border-primary/30' 
                          : 'hover:bg-muted'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <Bot className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-base leading-tight">
                            {bot.name || bot.businessProfile?.businessName}
                          </div>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-sm text-muted-foreground">
                              {getBusinessTypeLabel(bot.businessProfile?.type)}
                            </span>
                            {client && getStatusBadge(client.status)}
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

          {/* Templates Section */}
          <div className="p-4">
            <h3 className="font-semibold text-base text-muted-foreground uppercase tracking-wide mb-3">
              Create New Bot
            </h3>
            <div className="space-y-1">
              {templates.slice(0, 4).map(template => (
                <button
                  key={template.botId}
                  data-testid={`button-template-${template.botId}`}
                  onClick={() => {
                    setSelectedTemplate(template);
                    setShowCreateModal(true);
                  }}
                  className="w-full text-left p-3 rounded-lg hover:bg-muted transition-colors flex items-center justify-between group"
                >
                  <span className="text-base">{template.metadata?.templateCategory || template.businessProfile?.type}</span>
                  <Plus className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              ))}
              {templates.length > 4 && (
                <p className="text-sm text-muted-foreground text-center pt-2">
                  +{templates.length - 4} more templates
                </p>
              )}
            </div>
          </div>

          <Separator />

          {/* System Links */}
          <div className="p-4">
            <Button 
              data-testid="button-settings-legacy"
              variant="ghost" 
              size="default" 
              className="w-full justify-start text-base"
              onClick={() => setLocation('/super-admin')}
            >
              <Settings className="h-5 w-5 mr-2" />
              Legacy Admin
            </Button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          {selectedBot && selectedClient ? (
            <div className="p-6 max-w-5xl">
              {/* Bot Header */}
              <div className="flex items-start justify-between mb-6">
                <div>
                  <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold">{selectedBot.name || selectedBot.businessProfile?.businessName}</h1>
                    {getStatusBadge(selectedClient.status)}
                  </div>
                  <p className="text-muted-foreground mt-1">
                    {selectedBot.description || `${getBusinessTypeLabel(selectedBot.businessProfile?.type)} chatbot`}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Client: {selectedClient.name} • ID: {selectedBot.botId}
                  </p>
                </div>
                <div className="flex items-center gap-2">
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

              {/* Tabs - Per PDF: Overview, Bot Settings, Billing, Analytics, Logs */}
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="mb-6">
                  <TabsTrigger data-testid="tab-overview" value="overview">
                    <Eye className="h-4 w-4 mr-2" />
                    Overview
                  </TabsTrigger>
                  <TabsTrigger data-testid="tab-settings" value="settings">
                    <Settings className="h-4 w-4 mr-2" />
                    Bot Settings
                  </TabsTrigger>
                  <TabsTrigger data-testid="tab-billing" value="billing">
                    <CreditCard className="h-4 w-4 mr-2" />
                    Billing
                  </TabsTrigger>
                  <TabsTrigger data-testid="tab-analytics" value="analytics">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Analytics
                  </TabsTrigger>
                  <TabsTrigger data-testid="tab-logs" value="logs">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Logs
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
              </Tabs>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <Bot className="h-16 w-16 mx-auto mb-4 opacity-30" />
                <h2 className="text-xl font-medium mb-2">Select a Chatbot</h2>
                <p className="text-sm">Choose a bot from the sidebar to view and edit its settings</p>
                <p className="text-sm mt-1">Or create a new bot from a template</p>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Create from Template Modal */}
      <CreateFromTemplateModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        template={selectedTemplate}
        onSuccess={(botId) => {
          setShowCreateModal(false);
          setSelectedTemplate(null);
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
  template,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: Template | null;
  onSuccess: (botId: string) => void;
}) {
  const { toast } = useToast();
  const [step, setStep] = useState(1);
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
    serviceTier: 'standard',
    billingPlan: 'monthly',
  });

  useEffect(() => {
    if (open) {
      setStep(1);
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
        serviceTier: 'standard',
        billingPlan: 'monthly',
      });
    }
  }, [open]);

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const fullLocation = [data.address, data.city, data.state, data.zip].filter(Boolean).join(', ') || data.location;
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
      });
      return response.json();
    },
    onSuccess: (data) => {
      toast({ title: "Bot Created", description: `Successfully created: ${formData.clientName}` });
      onSuccess(data.botId || `${formData.clientId}_bot`);
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
    if (step > 1) setStep(step - 1);
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
          <DialogTitle>Create New Bot - Step {step} of 3</DialogTitle>
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
                    <li>Type: {template.metadata?.templateCategory || template.businessProfile?.type}</li>
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
                disabled={createMutation.isPending}
              >
                {step < 3 ? 'Next' : (createMutation.isPending ? 'Creating...' : 'Create Bot')}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

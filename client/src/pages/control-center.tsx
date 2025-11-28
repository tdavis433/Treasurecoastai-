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
];

export default function ControlCenter() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [selectedBotId, setSelectedBotId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [activeTab, setActiveTab] = useState('settings');

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
        <aside className="w-72 border-r bg-card flex flex-col">
          <div className="p-4 border-b">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3">
              Chatbots ({clientBots.length})
            </h3>
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
            <div className="p-2">
              {filteredBots.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No bots found</p>
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
                      className={`w-full text-left p-3 rounded-lg mb-1 transition-colors ${
                        selectedBotId === bot.botId 
                          ? 'bg-primary/10 border border-primary/30' 
                          : 'hover:bg-muted'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Bot className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <span className="font-medium truncate">{bot.name || bot.businessProfile?.businessName}</span>
                      </div>
                      <div className="flex items-center justify-between mt-1.5">
                        <span className="text-xs text-muted-foreground">
                          {getBusinessTypeLabel(bot.businessProfile?.type)}
                        </span>
                        {client && getStatusBadge(client.status)}
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
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3">
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
                  className="w-full text-left p-2 rounded-lg hover:bg-muted transition-colors flex items-center justify-between group"
                >
                  <span className="text-sm">{template.metadata?.templateCategory || template.businessProfile?.type}</span>
                  <Plus className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              ))}
              {templates.length > 4 && (
                <p className="text-xs text-muted-foreground text-center pt-1">
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
              size="sm" 
              className="w-full justify-start"
              onClick={() => setLocation('/super-admin')}
            >
              <Settings className="h-4 w-4 mr-2" />
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

              {/* Tabs */}
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="mb-6">
                  <TabsTrigger data-testid="tab-settings" value="settings">
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
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

                <TabsContent value="settings">
                  <BotSettingsPanel bot={selectedBot} />
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

// Bot Settings Panel
function BotSettingsPanel({ bot }: { bot: BotConfig }) {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
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
    });
    setIsEditing(false);
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
          <CardDescription>System prompt that defines how the bot responds</CardDescription>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>

      {/* FAQs */}
      {bot.faqs && bot.faqs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">FAQs ({bot.faqs.length})</CardTitle>
            <CardDescription>Common questions and answers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-64 overflow-auto">
              {bot.faqs.map((faq, i) => (
                <div key={i} className="bg-muted p-3 rounded-lg">
                  <p className="font-medium text-sm">{faq.question}</p>
                  <p className="text-sm text-muted-foreground mt-1">{faq.answer}</p>
                </div>
              ))}
            </div>
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
  const [formData, setFormData] = useState({
    clientId: '',
    clientName: '',
    businessName: '',
    phone: '',
    email: '',
    website: '',
    location: '',
  });

  useEffect(() => {
    if (open) {
      setFormData({
        clientId: '',
        clientName: '',
        businessName: '',
        phone: '',
        email: '',
        website: '',
        location: '',
      });
    }
  }, [open]);

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
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
          location: data.location,
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
          <DialogTitle>Create New Bot</DialogTitle>
          <DialogDescription>
            Create a new {template.metadata?.templateCategory || template.businessProfile?.type} chatbot from template
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label>Business Name *</Label>
              <Input
                data-testid="input-new-client-name"
                value={formData.clientName}
                onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                placeholder="My Business Name"
              />
            </div>
            <div className="col-span-2">
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
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Phone</Label>
              <Input
                data-testid="input-new-phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="(555) 123-4567"
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input
                data-testid="input-new-email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="contact@business.com"
              />
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
            <div>
              <Label>Location</Label>
              <Input
                data-testid="input-new-location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="123 Main St, City"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              data-testid="button-create-client"
              type="submit" 
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? 'Creating...' : 'Create Bot'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

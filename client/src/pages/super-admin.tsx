import { useQuery, useMutation } from "@tanstack/react-query";
import { GlassCard, GlassCardHeader, GlassCardTitle, GlassCardDescription, GlassCardContent } from "@/components/ui/glass-card";
import { NeonBadge } from "@/components/ui/neon-badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { 
  Settings, Palette, Clock, Bell, BookOpen, LogOut, Send, AlertCircle, Shield, 
  Trash2, Plus, X, Sparkles, Building2, Calendar, ClipboardList, Edit2, 
  GripVertical, ChevronDown, ChevronUp, Save, Phone, Mail, Globe, MapPin,
  BarChart3, MessageSquare, Users, Zap, AlertTriangle, DollarSign, CreditCard,
  TrendingUp, TrendingDown, ExternalLink
} from "lucide-react";
import { AdminLayout } from "@/components/admin-layout";
import { Button } from "@/components/ui/button";

interface BotInfo {
  botId: string;
  name: string;
  description: string;
  businessType: string;
  businessName: string;
  isDemo: boolean;
  clientId?: string;
  phone?: string;
  email?: string;
  website?: string;
  location?: string;
}

interface Client {
  id: string;
  name: string;
  status: string;
  type?: string;
  bots?: BotInfo[];
}

interface PlatformAnalytics {
  totals: {
    totalConversations: number;
    totalMessages: number;
    userMessages: number;
    botMessages: number;
    crisisEvents: number;
    appointmentRequests: number;
  };
  bots: Array<{
    clientId: string;
    botId: string;
    businessName: string;
    businessType: string;
    totalConversations: number;
    totalMessages: number;
    crisisEvents: number;
    appointmentRequests: number;
  }>;
  totalBots: number;
}

interface BillingSubscription {
  id: string;
  status: string;
  clientId: string | null;
  customerName: string | null;
  customerEmail: string | null;
  productName: string | null;
  amount: number;
  currency: string;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  canceledAt: string | null;
}

interface BillingOverview {
  mrr: number;
  activeCount: number;
  pastDueCount: number;
  canceledCount: number;
  incompleteCount: number;
  totalSubscriptions: number;
  subscriptions: BillingSubscription[];
}

interface GeneralSettings {
  businessName: string;
  tagline: string;
  businessType: string;
  primaryPhone: string;
  primaryEmail: string;
  websiteUrl: string;
  city: string;
  state: string;
  timezone: string;
  defaultContactMethod: string;
  internalNotes: string;
  status: string;
}

interface FaqEntry {
  id: string;
  category: string;
  question: string;
  answer: string;
  active: boolean;
}

interface LongFormKnowledge {
  aboutProgram: string;
  houseRules: string;
  whoItsFor: string;
  paymentInfo: string;
}

interface KnowledgeData {
  faqEntries: FaqEntry[];
  longFormKnowledge: LongFormKnowledge;
}

interface AppointmentType {
  id: string;
  label: string;
  description: string;
  durationMinutes: number;
  category: string;
  active: boolean;
}

interface PreIntakeQuestion {
  id: string;
  label: string;
  internalKey: string;
  type: 'single_choice' | 'multi_choice' | 'text';
  options: Array<{ value: string; label: string }>;
  required: boolean;
  order: number;
  active: boolean;
}

interface NotificationSettings {
  staffEmails: string[];
  staffPhones: string[];
  staffChannelPreference: 'email_only' | 'sms_only' | 'email_and_sms';
  eventToggles: {
    newAppointmentEmail: boolean;
    newAppointmentSms: boolean;
    newPreIntakeEmail: boolean;
    sameDayReminder: boolean;
  };
  templates: {
    staffEmailSubject: string;
    staffEmailBody: string;
  };
}

interface ClientSettings {
  id: string;
  businessName: string;
  tagline: string;
  knowledgeBase: {
    about: string;
    requirements: string;
    pricing: string;
    application: string;
  };
  operatingHours: {
    enabled: boolean;
    timezone: string;
    schedule: Record<string, { open: string; close: string; enabled: boolean }>;
    afterHoursMessage: string;
  };
  notificationEmail: string | null;
  notificationPhone: string | null;
  enableEmailNotifications: boolean;
  enableSmsNotifications: boolean;
  primaryColor: string;
}

const TIMEZONES = [
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'America/Anchorage', label: 'Alaska Time (AKT)' },
  { value: 'Pacific/Honolulu', label: 'Hawaii Time (HT)' },
];

const BUSINESS_TYPES = [
  'Sober Living',
  'Rehabilitation Center',
  'Detox Center',
  'Outpatient Treatment',
  'Counseling Center',
  'Barbershop',
  'Gym',
  'Healthcare',
  'Other',
];

const FAQ_CATEGORIES = [
  'Pricing',
  'Requirements',
  'Program',
  'Contact Info',
  'Application',
  'General',
];

interface AuthUser {
  id: string;
  username: string;
  role: 'super_admin' | 'client_admin';
}

export default function SuperAdmin() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [activeClientId, setActiveClientId] = useState<string>('faith_house');
  
  const { data: currentUser, isLoading: authLoading, isError: authError } = useQuery<AuthUser>({
    queryKey: ["/api/auth/me"],
    queryFn: async () => {
      const response = await fetch("/api/auth/me", { credentials: "include" });
      if (!response.ok) {
        throw new Error("Not authenticated");
      }
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

  const { data: clients } = useQuery<Client[]>({
    queryKey: ["/api/super-admin/clients"],
    enabled: currentUser?.role === "super_admin",
  });

  const { data: allBots } = useQuery<BotInfo[]>({
    queryKey: ["/api/super-admin/bots"],
    enabled: currentUser?.role === "super_admin",
  });

  const { data: generalSettings, isLoading: generalLoading } = useQuery<GeneralSettings>({
    queryKey: ["/api/super-admin/clients", activeClientId, "general"],
    enabled: currentUser?.role === "super_admin" && !!activeClientId,
  });

  const { data: knowledgeData, isLoading: knowledgeLoading } = useQuery<KnowledgeData>({
    queryKey: ["/api/super-admin/clients", activeClientId, "knowledge"],
    enabled: currentUser?.role === "super_admin" && !!activeClientId,
  });

  const { data: appointmentTypes } = useQuery<AppointmentType[]>({
    queryKey: ["/api/super-admin/clients", activeClientId, "appointment-types"],
    enabled: currentUser?.role === "super_admin" && !!activeClientId,
  });

  const { data: preIntakeConfig } = useQuery<PreIntakeQuestion[]>({
    queryKey: ["/api/super-admin/clients", activeClientId, "pre-intake"],
    enabled: currentUser?.role === "super_admin" && !!activeClientId,
  });

  const { data: notificationSettings } = useQuery<NotificationSettings>({
    queryKey: ["/api/super-admin/clients", activeClientId, "notifications"],
    enabled: currentUser?.role === "super_admin" && !!activeClientId,
  });

  const { data: settings, isLoading } = useQuery<ClientSettings>({
    queryKey: ["/api/settings"],
    enabled: currentUser?.role === "super_admin",
  });

  // Platform-wide analytics
  const { data: platformAnalytics, isLoading: analyticsLoading } = useQuery<PlatformAnalytics>({
    queryKey: ["/api/super-admin/analytics/overview"],
    enabled: currentUser?.role === "super_admin",
  });

  // Billing overview
  const { data: billingOverview, isLoading: billingLoading } = useQuery<BillingOverview>({
    queryKey: ["/api/super-admin/billing/overview"],
    enabled: currentUser?.role === "super_admin",
  });

  const [generalForm, setGeneralForm] = useState<Partial<GeneralSettings>>({});
  const [knowledgeForm, setKnowledgeForm] = useState<Partial<KnowledgeData>>({});
  const [appointmentTypesForm, setAppointmentTypesForm] = useState<AppointmentType[]>([]);
  const [preIntakeForm, setPreIntakeForm] = useState<PreIntakeQuestion[]>([]);
  const [notificationsForm, setNotificationsForm] = useState<Partial<NotificationSettings>>({});
  const [newEmailInput, setNewEmailInput] = useState("");
  const [newPhoneInput, setNewPhoneInput] = useState("");
  const [newFaq, setNewFaq] = useState({ category: '', question: '', answer: '' });
  const [editingFaqId, setEditingFaqId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<ClientSettings>>(settings || {});

  useEffect(() => {
    if (generalSettings) {
      setGeneralForm(generalSettings);
    }
  }, [generalSettings]);

  useEffect(() => {
    if (knowledgeData) {
      setKnowledgeForm(knowledgeData);
    }
  }, [knowledgeData]);

  useEffect(() => {
    if (appointmentTypes) {
      setAppointmentTypesForm(appointmentTypes);
    }
  }, [appointmentTypes]);

  useEffect(() => {
    if (preIntakeConfig) {
      setPreIntakeForm(preIntakeConfig);
    }
  }, [preIntakeConfig]);

  useEffect(() => {
    if (notificationSettings) {
      setNotificationsForm(notificationSettings);
    }
  }, [notificationSettings]);

  const updateGeneralMutation = useMutation({
    mutationFn: async (data: Partial<GeneralSettings>) => {
      const response = await apiRequest("PUT", `/api/super-admin/clients/${activeClientId}/general`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/super-admin/clients", activeClientId, "general"] });
      toast({ title: "Settings Saved", description: "General settings have been updated." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update settings.", variant: "destructive" });
    },
  });

  const updateKnowledgeMutation = useMutation({
    mutationFn: async (data: { longFormKnowledge: LongFormKnowledge }) => {
      const response = await apiRequest("PUT", `/api/super-admin/clients/${activeClientId}/knowledge/long-form`, data.longFormKnowledge);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/super-admin/clients", activeClientId, "knowledge"] });
      toast({ title: "Knowledge Updated", description: "Long-form knowledge sections have been saved." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update knowledge.", variant: "destructive" });
    },
  });

  const addFaqMutation = useMutation({
    mutationFn: async (faq: { category: string; question: string; answer: string }) => {
      const response = await apiRequest("POST", `/api/super-admin/clients/${activeClientId}/knowledge`, faq);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/super-admin/clients", activeClientId, "knowledge"] });
      setNewFaq({ category: '', question: '', answer: '' });
      toast({ title: "FAQ Added", description: "New FAQ entry has been created." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to add FAQ.", variant: "destructive" });
    },
  });

  const updateFaqMutation = useMutation({
    mutationFn: async ({ faqId, data }: { faqId: string; data: Partial<FaqEntry> }) => {
      const response = await apiRequest("PUT", `/api/super-admin/clients/${activeClientId}/knowledge/${faqId}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/super-admin/clients", activeClientId, "knowledge"] });
      setEditingFaqId(null);
      toast({ title: "FAQ Updated", description: "FAQ entry has been updated." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update FAQ.", variant: "destructive" });
    },
  });

  const deleteFaqMutation = useMutation({
    mutationFn: async (faqId: string) => {
      const response = await apiRequest("DELETE", `/api/super-admin/clients/${activeClientId}/knowledge/${faqId}`, {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/super-admin/clients", activeClientId, "knowledge"] });
      toast({ title: "FAQ Deleted", description: "FAQ entry has been removed." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete FAQ.", variant: "destructive" });
    },
  });

  const updateAppointmentTypesMutation = useMutation({
    mutationFn: async (types: AppointmentType[]) => {
      const response = await apiRequest("PUT", `/api/super-admin/clients/${activeClientId}/appointment-types`, types);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/super-admin/clients", activeClientId, "appointment-types"] });
      toast({ title: "Appointment Types Saved", description: "Configuration has been updated." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update appointment types.", variant: "destructive" });
    },
  });

  const updatePreIntakeMutation = useMutation({
    mutationFn: async (config: PreIntakeQuestion[]) => {
      const response = await apiRequest("PUT", `/api/super-admin/clients/${activeClientId}/pre-intake`, config);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/super-admin/clients", activeClientId, "pre-intake"] });
      toast({ title: "Pre-Intake Config Saved", description: "Configuration has been updated." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update pre-intake config.", variant: "destructive" });
    },
  });

  const updateNotificationsMutation = useMutation({
    mutationFn: async (data: NotificationSettings) => {
      const response = await apiRequest("PUT", `/api/super-admin/clients/${activeClientId}/notifications`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/super-admin/clients", activeClientId, "notifications"] });
      toast({ title: "Notifications Saved", description: "Notification settings have been updated." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update notifications.", variant: "destructive" });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/auth/logout", {});
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Logged out", description: "You have been logged out successfully." });
      setLocation("/login");
    },
  });

  const updateClientStatusMutation = useMutation({
    mutationFn: async ({ clientId, status }: { clientId: string; status: string }) => {
      const response = await apiRequest("PUT", `/api/super-admin/clients/${clientId}/status`, { status });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/super-admin/clients"] });
      toast({ 
        title: "Status Updated", 
        description: data.message || "Client status has been updated."
      });
    },
    onError: () => {
      toast({ 
        title: "Error", 
        description: "Failed to update client status.", 
        variant: "destructive" 
      });
    },
  });

  const testNotificationMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/test-notification", {});
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to send test notification");
      return data;
    },
    onSuccess: (data) => {
      toast({ title: "Test Notification Sent", description: data.message || "Check your email inbox!" });
    },
    onError: (error: any) => {
      toast({ title: "Test Failed", description: error.message || "Failed to send test notification.", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<ClientSettings>) => {
      const response = await apiRequest("PATCH", "/api/settings", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({ title: "Settings Updated", description: "Your changes have been saved successfully." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update settings. Please try again.", variant: "destructive" });
    },
  });

  const handleSubmit = () => {
    updateMutation.mutate(formData);
  };

  const handleTestNotification = () => {
    testNotificationMutation.mutate();
  };

  const addStaffEmail = () => {
    const email = newEmailInput.trim().toLowerCase();
    if (!email) return;
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast({ title: "Invalid Email", description: "Please enter a valid email address.", variant: "destructive" });
      return;
    }
    
    const currentEmails = notificationsForm.staffEmails || [];
    if (currentEmails.includes(email)) {
      toast({ title: "Duplicate Email", description: "This email is already in the list.", variant: "destructive" });
      return;
    }
    
    setNotificationsForm({ ...notificationsForm, staffEmails: [...currentEmails, email] });
    setNewEmailInput("");
  };

  const removeStaffEmail = (emailToRemove: string) => {
    const currentEmails = notificationsForm.staffEmails || [];
    setNotificationsForm({ ...notificationsForm, staffEmails: currentEmails.filter(e => e !== emailToRemove) });
  };

  const addStaffPhone = () => {
    const phone = newPhoneInput.trim();
    if (!phone) return;
    
    const currentPhones = notificationsForm.staffPhones || [];
    if (currentPhones.includes(phone)) {
      toast({ title: "Duplicate Phone", description: "This phone is already in the list.", variant: "destructive" });
      return;
    }
    
    setNotificationsForm({ ...notificationsForm, staffPhones: [...currentPhones, phone] });
    setNewPhoneInput("");
  };

  const removeStaffPhone = (phoneToRemove: string) => {
    const currentPhones = notificationsForm.staffPhones || [];
    setNotificationsForm({ ...notificationsForm, staffPhones: currentPhones.filter(p => p !== phoneToRemove) });
  };

  const handleAddAppointmentType = () => {
    const newType: AppointmentType = {
      id: `apt-${Date.now()}`,
      label: 'New Appointment Type',
      description: '',
      durationMinutes: 30,
      category: 'lead',
      active: true,
    };
    setAppointmentTypesForm([...appointmentTypesForm, newType]);
  };

  const handleAddPreIntakeQuestion = () => {
    const newQuestion: PreIntakeQuestion = {
      id: `q-${Date.now()}`,
      label: 'New Question',
      internalKey: `custom_${Date.now()}`,
      type: 'single_choice',
      options: [{ value: 'option1', label: 'Option 1' }],
      required: true,
      order: preIntakeForm.length + 1,
      active: true,
    };
    setPreIntakeForm([...preIntakeForm, newQuestion]);
  };

  useEffect(() => {
    if (settings) {
      setFormData(prev => ({
        ...prev,
        notificationEmail: prev.notificationEmail ?? settings.notificationEmail,
      }));
    }
  }, [settings]);

  if (authLoading || isLoading || generalLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center gap-3 text-white/55">
            <Sparkles className="h-5 w-5 animate-pulse text-cyan-400" />
            <span>Loading settings...</span>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!currentUser || currentUser.role !== "super_admin") {
    return null;
  }

  const activeClient = clients?.find(c => c.id === activeClientId);

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Page Header with Client Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold text-white" data-testid="text-super-admin-title">
              Super Admin
            </h2>
            <p className="text-white/55 mt-1">
              Configure client chatbot settings and behavior
            </p>
          </div>
          
          {/* Client Selector */}
          <div className="flex items-center gap-3">
            <Building2 className="h-5 w-5 text-cyan-400" />
            <Select value={activeClientId} onValueChange={setActiveClientId}>
              <SelectTrigger className="w-[280px] bg-white/5 border-white/10 text-white" data-testid="select-client">
                <SelectValue placeholder="Select client" />
              </SelectTrigger>
              <SelectContent className="bg-[#0B0E13] border-white/10">
                {clients?.map(client => (
                  <SelectItem 
                    key={client.id} 
                    value={client.id}
                    className="text-white hover:bg-white/10"
                  >
                    <span className="flex items-center gap-2">
                      {client.name}
                      <NeonBadge variant={client.status === 'active' ? 'success' : 'default'} className="text-xs">
                        {client.status}
                      </NeonBadge>
                      {client.bots && client.bots.length > 0 && (
                        <span className="text-white/40 text-xs">({client.bots.length} bots)</span>
                      )}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* All Chatbots - Individual Listing */}
        <GlassCard>
          <GlassCardHeader className="flex flex-row items-start justify-between gap-4">
            <div>
              <GlassCardTitle>All Chatbots</GlassCardTitle>
              <GlassCardDescription>Select a bot to edit or view its dashboard</GlassCardDescription>
            </div>
            <Button
              onClick={() => setLocation("/admin/bot/new")}
              className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white"
              data-testid="button-create-bot"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create New Bot
            </Button>
          </GlassCardHeader>
          <GlassCardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {allBots && allBots.length > 0 ? allBots.map(bot => (
                  <div 
                    key={bot.botId}
                    className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3 hover:border-cyan-400/30 transition-colors"
                    data-testid={`bot-card-${bot.botId}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-medium text-white leading-tight">{bot.businessName}</h4>
                      <NeonBadge variant={bot.isDemo ? 'default' : 'success'} className="text-xs flex-shrink-0">
                        {bot.isDemo ? 'Demo' : 'Live'}
                      </NeonBadge>
                    </div>
                    <p className="text-sm text-white/55 line-clamp-2">{bot.description}</p>
                    <div className="flex items-center gap-2 text-xs text-white/40">
                      <span className="capitalize">{bot.businessType.replace('_', ' ')}</span>
                      <span>|</span>
                      <span>ID: {bot.botId}</span>
                    </div>
                    <div className="flex items-center gap-2 pt-2 border-t border-white/10">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setLocation(`/admin/bot/${bot.botId}`)}
                        className="flex-1 text-cyan-400 border-cyan-400/30 hover:bg-cyan-400/10"
                        data-testid={`button-dashboard-${bot.botId}`}
                      >
                        <Settings className="h-3 w-3 mr-1" />
                        Dashboard
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setLocation(`/demo/${bot.botId}`)}
                        className="flex-1"
                        data-testid={`button-preview-${bot.botId}`}
                      >
                        <Sparkles className="h-3 w-3 mr-1" />
                        Preview
                      </Button>
                    </div>
                  </div>
              )) : (
                <div className="col-span-full text-center py-8 text-white/50">
                  No bots created yet. Click "Create New Bot" to get started.
                </div>
              )}
            </div>
          </GlassCardContent>
        </GlassCard>

        {/* Client Management Section */}
        <GlassCard>
          <GlassCardHeader>
            <GlassCardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-cyan-400" />
              Client Management
            </GlassCardTitle>
            <GlassCardDescription>Manage client accounts and service status</GlassCardDescription>
          </GlassCardHeader>
          <GlassCardContent>
            <div className="space-y-4">
              {clients && clients.length > 0 ? clients.map(client => (
                <div 
                  key={client.id}
                  className="p-4 rounded-xl bg-white/5 border border-white/10 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
                  data-testid={`client-row-${client.id}`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-white">{client.name}</h4>
                      <NeonBadge 
                        variant={
                          client.status === 'active' ? 'success' : 
                          client.status === 'paused' ? 'danger' : 
                          'default'
                        } 
                        className="text-xs"
                      >
                        {client.status}
                      </NeonBadge>
                    </div>
                    <div className="text-sm text-white/55">
                      {client.bots?.length || 0} bot{(client.bots?.length || 0) !== 1 ? 's' : ''} configured
                      {client.type && <span className="ml-2">| {client.type}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Select
                      value={client.status}
                      onValueChange={(newStatus) => {
                        updateClientStatusMutation.mutate({ 
                          clientId: client.id, 
                          status: newStatus 
                        });
                      }}
                    >
                      <SelectTrigger 
                        className="w-[130px] bg-white/5 border-white/10 text-white"
                        data-testid={`select-status-${client.id}`}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#0B0E13] border-white/10">
                        <SelectItem value="active" className="text-white hover:bg-white/10">
                          <span className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-green-500" />
                            Active
                          </span>
                        </SelectItem>
                        <SelectItem value="paused" className="text-white hover:bg-white/10">
                          <span className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-red-500" />
                            Paused
                          </span>
                        </SelectItem>
                        <SelectItem value="demo" className="text-white hover:bg-white/10">
                          <span className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-blue-500" />
                            Demo
                          </span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setLocation(`/client/dashboard?clientId=${client.id}`)}
                      className="text-cyan-400 border-cyan-400/30 hover:bg-cyan-400/10"
                      data-testid={`button-view-client-${client.id}`}
                    >
                      View Dashboard
                    </Button>
                  </div>
                </div>
              )) : (
                <div className="text-center py-8 text-white/50">
                  No clients registered yet.
                </div>
              )}
            </div>
          </GlassCardContent>
        </GlassCard>

        {/* Billing Overview Section */}
        <GlassCard>
          <GlassCardHeader>
            <GlassCardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-400" />
              Billing Overview
            </GlassCardTitle>
            <GlassCardDescription>Revenue metrics and subscription status across all clients</GlassCardDescription>
          </GlassCardHeader>
          <GlassCardContent>
            {billingLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="flex items-center gap-3 text-white/55">
                  <Sparkles className="h-5 w-5 animate-pulse text-cyan-400" />
                  <span>Loading billing data...</span>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 rounded-xl bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20 text-center">
                    <div className="flex items-center justify-center mb-2">
                      <TrendingUp className="h-5 w-5 text-green-400" />
                    </div>
                    <div className="text-2xl font-bold text-white" data-testid="stat-mrr">
                      ${billingOverview?.mrr?.toFixed(2) || '0.00'}
                    </div>
                    <div className="text-xs text-white/55">Monthly Recurring Revenue</div>
                  </div>
                  
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center">
                    <div className="flex items-center justify-center mb-2">
                      <CreditCard className="h-5 w-5 text-blue-400" />
                    </div>
                    <div className="text-2xl font-bold text-white" data-testid="stat-active-subs">
                      {billingOverview?.activeCount || 0}
                    </div>
                    <div className="text-xs text-white/55">Active Subscriptions</div>
                  </div>
                  
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center">
                    <div className="flex items-center justify-center mb-2">
                      <AlertCircle className="h-5 w-5 text-amber-400" />
                    </div>
                    <div className={`text-2xl font-bold ${(billingOverview?.pastDueCount || 0) > 0 ? 'text-amber-500' : 'text-white'}`} data-testid="stat-past-due">
                      {billingOverview?.pastDueCount || 0}
                    </div>
                    <div className="text-xs text-white/55">Past Due</div>
                  </div>
                  
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center">
                    <div className="flex items-center justify-center mb-2">
                      <TrendingDown className="h-5 w-5 text-red-400" />
                    </div>
                    <div className="text-2xl font-bold text-white" data-testid="stat-canceled">
                      {billingOverview?.canceledCount || 0}
                    </div>
                    <div className="text-xs text-white/55">Canceled</div>
                  </div>
                </div>

                {billingOverview?.subscriptions && billingOverview.subscriptions.length > 0 && (
                  <div className="pt-4 border-t border-white/10">
                    <h4 className="text-sm font-medium text-white/70 mb-4">Subscription Details</h4>
                    <div className="space-y-2">
                      {billingOverview.subscriptions.slice(0, 10).map((sub) => (
                        <div 
                          key={sub.id}
                          className="p-3 rounded-lg bg-white/5 border border-white/10 flex flex-col md:flex-row md:items-center md:justify-between gap-2"
                          data-testid={`subscription-row-${sub.id}`}
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-white">{sub.customerName || sub.customerEmail || 'Unknown'}</span>
                              <NeonBadge 
                                variant={
                                  sub.status === 'active' || sub.status === 'trialing' ? 'success' : 
                                  sub.status === 'past_due' ? 'danger' : 
                                  'default'
                                } 
                                className="text-xs"
                              >
                                {sub.status}
                              </NeonBadge>
                            </div>
                            <div className="text-xs text-white/55 mt-1">
                              {sub.productName || 'Unknown Plan'} • ${sub.amount}/{sub.currency.toUpperCase()}
                              {sub.clientId && <span className="ml-2">• Client: {sub.clientId}</span>}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {sub.currentPeriodEnd && (
                              <span className="text-xs text-white/40">
                                Renews: {new Date(sub.currentPeriodEnd).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    {billingOverview.subscriptions.length > 10 && (
                      <p className="text-xs text-white/40 mt-3 text-center">
                        Showing 10 of {billingOverview.subscriptions.length} subscriptions
                      </p>
                    )}
                  </div>
                )}

                {(!billingOverview?.subscriptions || billingOverview.subscriptions.length === 0) && (
                  <div className="text-center py-4 text-white/50">
                    No active subscriptions yet.
                  </div>
                )}
              </div>
            )}
          </GlassCardContent>
        </GlassCard>

        {/* Platform Analytics Overview */}
        <GlassCard>
          <GlassCardHeader>
            <GlassCardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-cyan-400" />
              Platform Analytics
            </GlassCardTitle>
            <GlassCardDescription>Real-time performance metrics across all chatbots</GlassCardDescription>
          </GlassCardHeader>
          <GlassCardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center">
                <div className="flex items-center justify-center mb-2">
                  <Users className="h-5 w-5 text-blue-400" />
                </div>
                <div className="text-2xl font-bold text-white" data-testid="stat-total-conversations">
                  {analyticsLoading ? '—' : (platformAnalytics?.totals?.totalConversations || 0)}
                </div>
                <div className="text-xs text-white/55">Conversations</div>
              </div>
              
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center">
                <div className="flex items-center justify-center mb-2">
                  <MessageSquare className="h-5 w-5 text-green-400" />
                </div>
                <div className="text-2xl font-bold text-white" data-testid="stat-total-messages">
                  {analyticsLoading ? '—' : (platformAnalytics?.totals?.totalMessages || 0)}
                </div>
                <div className="text-xs text-white/55">Total Messages</div>
              </div>
              
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center">
                <div className="flex items-center justify-center mb-2">
                  <Zap className="h-5 w-5 text-purple-400" />
                </div>
                <div className="text-2xl font-bold text-white" data-testid="stat-user-messages">
                  {analyticsLoading ? '—' : (platformAnalytics?.totals?.userMessages || 0)}
                </div>
                <div className="text-xs text-white/55">User Messages</div>
              </div>
              
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center">
                <div className="flex items-center justify-center mb-2">
                  <Sparkles className="h-5 w-5 text-cyan-400" />
                </div>
                <div className="text-2xl font-bold text-white" data-testid="stat-bot-messages">
                  {analyticsLoading ? '—' : (platformAnalytics?.totals?.botMessages || 0)}
                </div>
                <div className="text-xs text-white/55">Bot Messages</div>
              </div>
              
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center">
                <div className="flex items-center justify-center mb-2">
                  <Calendar className="h-5 w-5 text-amber-400" />
                </div>
                <div className="text-2xl font-bold text-white" data-testid="stat-appointments">
                  {analyticsLoading ? '—' : (platformAnalytics?.totals?.appointmentRequests || 0)}
                </div>
                <div className="text-xs text-white/55">Booking Requests</div>
              </div>
              
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center">
                <div className="flex items-center justify-center mb-2">
                  <AlertTriangle className="h-5 w-5 text-red-400" />
                </div>
                <div className="text-2xl font-bold text-amber-500" data-testid="stat-crisis-events">
                  {analyticsLoading ? '—' : (platformAnalytics?.totals?.crisisEvents || 0)}
                </div>
                <div className="text-xs text-white/55">Crisis Events</div>
              </div>
            </div>

            {/* Per-Bot Stats */}
            {platformAnalytics?.bots && platformAnalytics.bots.length > 0 && (
              <div className="mt-6 pt-6 border-t border-white/10">
                <h4 className="text-sm font-medium text-white/70 mb-4">Per-Bot Performance</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {platformAnalytics.bots.map((bot) => (
                    <div 
                      key={bot.botId}
                      className="p-3 rounded-lg bg-white/5 border border-white/10 flex items-center justify-between"
                      data-testid={`analytics-bot-${bot.botId}`}
                    >
                      <div>
                        <p className="font-medium text-white text-sm">{bot.businessName}</p>
                        <p className="text-xs text-white/40">{bot.businessType}</p>
                      </div>
                      <div className="flex items-center gap-4 text-xs">
                        <div className="text-center">
                          <span className="block font-bold text-cyan-400">{bot.totalConversations}</span>
                          <span className="text-white/40">chats</span>
                        </div>
                        <div className="text-center">
                          <span className="block font-bold text-green-400">{bot.totalMessages}</span>
                          <span className="text-white/40">msgs</span>
                        </div>
                        {bot.crisisEvents > 0 && (
                          <div className="text-center">
                            <span className="block font-bold text-amber-400">{bot.crisisEvents}</span>
                            <span className="text-white/40">crisis</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </GlassCardContent>
        </GlassCard>

        <Tabs defaultValue="general" className="space-y-6">
          {/* Tabs Navigation */}
          <TabsList className="flex flex-wrap gap-2 h-auto p-1 bg-white/5 rounded-xl border border-white/10">
            <TabsTrigger 
              value="general" 
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500/20 data-[state=active]:to-blue-500/20 data-[state=active]:text-cyan-400 data-[state=active]:border data-[state=active]:border-cyan-400/30 data-[state=inactive]:text-white/55 data-[state=inactive]:hover:text-white data-[state=inactive]:hover:bg-white/5 transition-all"
              data-testid="tab-general"
            >
              <Settings className="h-4 w-4" />
              General
            </TabsTrigger>
            <TabsTrigger 
              value="knowledge" 
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500/20 data-[state=active]:to-blue-500/20 data-[state=active]:text-cyan-400 data-[state=active]:border data-[state=active]:border-cyan-400/30 data-[state=inactive]:text-white/55 data-[state=inactive]:hover:text-white data-[state=inactive]:hover:bg-white/5 transition-all"
              data-testid="tab-knowledge"
            >
              <BookOpen className="h-4 w-4" />
              Knowledge
            </TabsTrigger>
            <TabsTrigger 
              value="flows" 
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500/20 data-[state=active]:to-blue-500/20 data-[state=active]:text-cyan-400 data-[state=active]:border data-[state=active]:border-cyan-400/30 data-[state=inactive]:text-white/55 data-[state=inactive]:hover:text-white data-[state=inactive]:hover:bg-white/5 transition-all"
              data-testid="tab-flows"
            >
              <ClipboardList className="h-4 w-4" />
              Flows
            </TabsTrigger>
            <TabsTrigger 
              value="hours" 
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500/20 data-[state=active]:to-blue-500/20 data-[state=active]:text-cyan-400 data-[state=active]:border data-[state=active]:border-cyan-400/30 data-[state=inactive]:text-white/55 data-[state=inactive]:hover:text-white data-[state=inactive]:hover:bg-white/5 transition-all"
              data-testid="tab-hours"
            >
              <Clock className="h-4 w-4" />
              Hours
            </TabsTrigger>
            <TabsTrigger 
              value="notifications" 
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500/20 data-[state=active]:to-blue-500/20 data-[state=active]:text-cyan-400 data-[state=active]:border data-[state=active]:border-cyan-400/30 data-[state=inactive]:text-white/55 data-[state=inactive]:hover:text-white data-[state=inactive]:hover:bg-white/5 transition-all"
              data-testid="tab-notifications"
            >
              <Bell className="h-4 w-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger 
              value="branding" 
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500/20 data-[state=active]:to-blue-500/20 data-[state=active]:text-cyan-400 data-[state=active]:border data-[state=active]:border-cyan-400/30 data-[state=inactive]:text-white/55 data-[state=inactive]:hover:text-white data-[state=inactive]:hover:bg-white/5 transition-all"
              data-testid="tab-branding"
            >
              <Palette className="h-4 w-4" />
              Branding
            </TabsTrigger>
            <TabsTrigger 
              value="privacy" 
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500/20 data-[state=active]:to-blue-500/20 data-[state=active]:text-cyan-400 data-[state=active]:border data-[state=active]:border-cyan-400/30 data-[state=inactive]:text-white/55 data-[state=inactive]:hover:text-white data-[state=inactive]:hover:bg-white/5 transition-all"
              data-testid="tab-privacy"
            >
              <Shield className="h-4 w-4" />
              Privacy
            </TabsTrigger>
          </TabsList>

          {/* General Tab - Expanded */}
          <TabsContent value="general" className="space-y-6">
            <GlassCard>
              <GlassCardHeader>
                <GlassCardTitle>Business Profile</GlassCardTitle>
                <GlassCardDescription>Configure the client's business information</GlassCardDescription>
              </GlassCardHeader>
              <GlassCardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-white/55">Business Name</label>
                    <input
                      type="text"
                      className="w-full px-4 py-2.5 rounded-xl glass-input"
                      data-testid="input-business-name"
                      value={generalForm.businessName || ''}
                      onChange={(e) => setGeneralForm({ ...generalForm, businessName: e.target.value })}
                      placeholder="The Faith House"
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-white/55">Tagline</label>
                    <input
                      type="text"
                      className="w-full px-4 py-2.5 rounded-xl glass-input"
                      data-testid="input-tagline"
                      value={generalForm.tagline || ''}
                      onChange={(e) => setGeneralForm({ ...generalForm, tagline: e.target.value })}
                      placeholder="Here to support your next step"
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-white/55">Business Type</label>
                    <Select 
                      value={generalForm.businessType || 'Sober Living'} 
                      onValueChange={(value) => setGeneralForm({ ...generalForm, businessType: value })}
                    >
                      <SelectTrigger className="w-full bg-white/5 border-white/10 text-white" data-testid="select-business-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#0B0E13] border-white/10">
                        {BUSINESS_TYPES.map(type => (
                          <SelectItem key={type} value={type} className="text-white hover:bg-white/10">{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-white/55">Status</label>
                    <Select 
                      value={generalForm.status || 'active'} 
                      onValueChange={(value) => setGeneralForm({ ...generalForm, status: value })}
                    >
                      <SelectTrigger className="w-full bg-white/5 border-white/10 text-white" data-testid="select-status">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#0B0E13] border-white/10">
                        <SelectItem value="active" className="text-white hover:bg-white/10">Active</SelectItem>
                        <SelectItem value="paused" className="text-white hover:bg-white/10">Paused</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="border-t border-white/10 pt-6">
                  <h4 className="text-sm font-medium text-white/85 mb-4 flex items-center gap-2">
                    <Phone className="h-4 w-4 text-cyan-400" />
                    Contact Information
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <label className="text-sm font-medium text-white/55">Primary Phone</label>
                      <input
                        type="tel"
                        className="w-full px-4 py-2.5 rounded-xl glass-input"
                        data-testid="input-primary-phone"
                        value={generalForm.primaryPhone || ''}
                        onChange={(e) => setGeneralForm({ ...generalForm, primaryPhone: e.target.value })}
                        placeholder="(555) 123-4567"
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-sm font-medium text-white/55">Primary Email</label>
                      <input
                        type="email"
                        className="w-full px-4 py-2.5 rounded-xl glass-input"
                        data-testid="input-primary-email"
                        value={generalForm.primaryEmail || ''}
                        onChange={(e) => setGeneralForm({ ...generalForm, primaryEmail: e.target.value })}
                        placeholder="info@example.com"
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-sm font-medium text-white/55">Website URL</label>
                      <input
                        type="url"
                        className="w-full px-4 py-2.5 rounded-xl glass-input"
                        data-testid="input-website-url"
                        value={generalForm.websiteUrl || ''}
                        onChange={(e) => setGeneralForm({ ...generalForm, websiteUrl: e.target.value })}
                        placeholder="https://example.com"
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-sm font-medium text-white/55">Default Contact Method</label>
                      <Select 
                        value={generalForm.defaultContactMethod || 'phone'} 
                        onValueChange={(value) => setGeneralForm({ ...generalForm, defaultContactMethod: value })}
                      >
                        <SelectTrigger className="w-full bg-white/5 border-white/10 text-white" data-testid="select-contact-method">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[#0B0E13] border-white/10">
                          <SelectItem value="phone" className="text-white hover:bg-white/10">Phone</SelectItem>
                          <SelectItem value="text" className="text-white hover:bg-white/10">Text</SelectItem>
                          <SelectItem value="email" className="text-white hover:bg-white/10">Email</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="border-t border-white/10 pt-6">
                  <h4 className="text-sm font-medium text-white/85 mb-4 flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-cyan-400" />
                    Location
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-3">
                      <label className="text-sm font-medium text-white/55">City</label>
                      <input
                        type="text"
                        className="w-full px-4 py-2.5 rounded-xl glass-input"
                        data-testid="input-city"
                        value={generalForm.city || ''}
                        onChange={(e) => setGeneralForm({ ...generalForm, city: e.target.value })}
                        placeholder="City"
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-sm font-medium text-white/55">State</label>
                      <input
                        type="text"
                        className="w-full px-4 py-2.5 rounded-xl glass-input"
                        data-testid="input-state"
                        value={generalForm.state || ''}
                        onChange={(e) => setGeneralForm({ ...generalForm, state: e.target.value })}
                        placeholder="State"
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-sm font-medium text-white/55">Timezone</label>
                      <Select 
                        value={generalForm.timezone || 'America/New_York'} 
                        onValueChange={(value) => setGeneralForm({ ...generalForm, timezone: value })}
                      >
                        <SelectTrigger className="w-full bg-white/5 border-white/10 text-white" data-testid="select-timezone">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[#0B0E13] border-white/10">
                          {TIMEZONES.map(tz => (
                            <SelectItem key={tz.value} value={tz.value} className="text-white hover:bg-white/10">{tz.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="border-t border-white/10 pt-6">
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-white/55">Internal Notes (Super Admin Only)</label>
                    <textarea
                      className="w-full px-4 py-3 rounded-xl glass-input min-h-24 resize-none"
                      data-testid="input-internal-notes"
                      value={generalForm.internalNotes || ''}
                      onChange={(e) => setGeneralForm({ ...generalForm, internalNotes: e.target.value })}
                      placeholder="Private notes about this client (not visible to client admin)..."
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <Button
                    onClick={() => updateGeneralMutation.mutate(generalForm)}
                    disabled={updateGeneralMutation.isPending}
                    className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white"
                    data-testid="button-save-general"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {updateGeneralMutation.isPending ? 'Saving...' : 'Save All Changes'}
                  </Button>
                </div>
              </GlassCardContent>
            </GlassCard>
          </TabsContent>

          {/* Knowledge Tab - Expanded with FAQ Management */}
          <TabsContent value="knowledge" className="space-y-6">
            {/* FAQ Entries */}
            <GlassCard>
              <GlassCardHeader>
                <GlassCardTitle>FAQ Entries</GlassCardTitle>
                <GlassCardDescription>Manage frequently asked questions and answers</GlassCardDescription>
              </GlassCardHeader>
              <GlassCardContent className="space-y-6">
                {/* Add New FAQ */}
                <div className="p-4 bg-white/5 rounded-xl border border-white/10 space-y-4">
                  <h4 className="text-sm font-medium text-white/85">Add New FAQ</h4>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Select 
                      value={newFaq.category} 
                      onValueChange={(value) => setNewFaq({ ...newFaq, category: value })}
                    >
                      <SelectTrigger className="bg-white/5 border-white/10 text-white" data-testid="select-faq-category">
                        <SelectValue placeholder="Category" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#0B0E13] border-white/10">
                        {FAQ_CATEGORIES.map(cat => (
                          <SelectItem key={cat} value={cat} className="text-white hover:bg-white/10">{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <input
                      type="text"
                      className="md:col-span-3 px-4 py-2.5 rounded-xl glass-input"
                      data-testid="input-faq-question"
                      value={newFaq.question}
                      onChange={(e) => setNewFaq({ ...newFaq, question: e.target.value })}
                      placeholder="Question"
                    />
                  </div>
                  <textarea
                    className="w-full px-4 py-3 rounded-xl glass-input min-h-20 resize-none"
                    data-testid="input-faq-answer"
                    value={newFaq.answer}
                    onChange={(e) => setNewFaq({ ...newFaq, answer: e.target.value })}
                    placeholder="Answer"
                  />
                  <div className="flex justify-end">
                    <Button
                      onClick={() => addFaqMutation.mutate(newFaq)}
                      disabled={addFaqMutation.isPending || !newFaq.category || !newFaq.question || !newFaq.answer}
                      className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white"
                      data-testid="button-add-faq"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add FAQ
                    </Button>
                  </div>
                </div>

                {/* FAQ List */}
                <div className="space-y-3">
                  {knowledgeForm.faqEntries?.map((faq, index) => (
                    <div 
                      key={faq.id} 
                      className="p-4 bg-white/5 rounded-xl border border-white/10 space-y-3"
                      data-testid={`faq-entry-${index}`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <NeonBadge variant="new" className="text-xs">{faq.category}</NeonBadge>
                            <NeonBadge variant={faq.active ? 'success' : 'default'} className="text-xs">
                              {faq.active ? 'Active' : 'Inactive'}
                            </NeonBadge>
                          </div>
                          <p className="text-sm font-medium text-white/85">{faq.question}</p>
                          <p className="text-sm text-white/55 mt-1">{faq.answer}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => updateFaqMutation.mutate({ faqId: faq.id, data: { active: !faq.active } })}
                            className="h-8 w-8 text-white/55 hover:text-white"
                            data-testid={`button-toggle-faq-${index}`}
                          >
                            {faq.active ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => deleteFaqMutation.mutate(faq.id)}
                            className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-400/10"
                            data-testid={`button-delete-faq-${index}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {(!knowledgeForm.faqEntries || knowledgeForm.faqEntries.length === 0) && (
                    <p className="text-center text-white/40 py-8">No FAQ entries yet. Add your first FAQ above.</p>
                  )}
                </div>
              </GlassCardContent>
            </GlassCard>

            {/* Long-form Knowledge Sections */}
            <GlassCard>
              <GlassCardHeader>
                <GlassCardTitle>Long-form Knowledge Sections</GlassCardTitle>
                <GlassCardDescription>Detailed content sections for the chatbot knowledge base</GlassCardDescription>
              </GlassCardHeader>
              <GlassCardContent className="space-y-6">
                <div className="space-y-3">
                  <label className="text-sm font-medium text-white/55">About the Program</label>
                  <textarea
                    className="w-full px-4 py-3 rounded-xl glass-input min-h-32 resize-none"
                    data-testid="input-about-program"
                    value={knowledgeForm.longFormKnowledge?.aboutProgram || ''}
                    onChange={(e) => setKnowledgeForm({
                      ...knowledgeForm,
                      longFormKnowledge: { ...knowledgeForm.longFormKnowledge!, aboutProgram: e.target.value }
                    })}
                    placeholder="Describe the program in detail..."
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-sm font-medium text-white/55">House Rules & Expectations</label>
                  <textarea
                    className="w-full px-4 py-3 rounded-xl glass-input min-h-32 resize-none"
                    data-testid="input-house-rules"
                    value={knowledgeForm.longFormKnowledge?.houseRules || ''}
                    onChange={(e) => setKnowledgeForm({
                      ...knowledgeForm,
                      longFormKnowledge: { ...knowledgeForm.longFormKnowledge!, houseRules: e.target.value }
                    })}
                    placeholder="List house rules and expectations..."
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-sm font-medium text-white/55">Who This Is For / Not For</label>
                  <textarea
                    className="w-full px-4 py-3 rounded-xl glass-input min-h-32 resize-none"
                    data-testid="input-who-its-for"
                    value={knowledgeForm.longFormKnowledge?.whoItsFor || ''}
                    onChange={(e) => setKnowledgeForm({
                      ...knowledgeForm,
                      longFormKnowledge: { ...knowledgeForm.longFormKnowledge!, whoItsFor: e.target.value }
                    })}
                    placeholder="Describe the ideal candidate and who may not be a fit..."
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-sm font-medium text-white/55">Payment & Insurance Info</label>
                  <textarea
                    className="w-full px-4 py-3 rounded-xl glass-input min-h-24 resize-none"
                    data-testid="input-payment-info"
                    value={knowledgeForm.longFormKnowledge?.paymentInfo || ''}
                    onChange={(e) => setKnowledgeForm({
                      ...knowledgeForm,
                      longFormKnowledge: { ...knowledgeForm.longFormKnowledge!, paymentInfo: e.target.value }
                    })}
                    placeholder="Payment options, insurance acceptance, financial assistance..."
                  />
                </div>
                <div className="flex justify-end pt-4">
                  <Button
                    onClick={() => updateKnowledgeMutation.mutate({ longFormKnowledge: knowledgeForm.longFormKnowledge! })}
                    disabled={updateKnowledgeMutation.isPending}
                    className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white"
                    data-testid="button-save-knowledge"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {updateKnowledgeMutation.isPending ? 'Saving...' : 'Save Knowledge'}
                  </Button>
                </div>
              </GlassCardContent>
            </GlassCard>
          </TabsContent>

          {/* Flows Tab - Appointment Types & Pre-Intake */}
          <TabsContent value="flows" className="space-y-6">
            {/* Appointment Types */}
            <GlassCard>
              <GlassCardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <GlassCardTitle>Appointment Types</GlassCardTitle>
                    <GlassCardDescription>Configure the types of appointments the chatbot can offer</GlassCardDescription>
                  </div>
                  <Button
                    onClick={handleAddAppointmentType}
                    className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white"
                    data-testid="button-add-appointment-type"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Type
                  </Button>
                </div>
              </GlassCardHeader>
              <GlassCardContent className="space-y-4">
                {appointmentTypesForm.map((type, index) => (
                  <div 
                    key={type.id} 
                    className="p-4 bg-white/5 rounded-xl border border-white/10"
                    data-testid={`appointment-type-${index}`}
                  >
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs text-white/55">Label</label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 rounded-lg glass-input text-sm"
                          value={type.label}
                          onChange={(e) => {
                            const updated = [...appointmentTypesForm];
                            updated[index] = { ...type, label: e.target.value };
                            setAppointmentTypesForm(updated);
                          }}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs text-white/55">Duration (minutes)</label>
                        <input
                          type="number"
                          className="w-full px-3 py-2 rounded-lg glass-input text-sm"
                          value={type.durationMinutes}
                          onChange={(e) => {
                            const updated = [...appointmentTypesForm];
                            updated[index] = { ...type, durationMinutes: parseInt(e.target.value) || 30 };
                            setAppointmentTypesForm(updated);
                          }}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs text-white/55">Category</label>
                        <Select 
                          value={type.category} 
                          onValueChange={(value) => {
                            const updated = [...appointmentTypesForm];
                            updated[index] = { ...type, category: value };
                            setAppointmentTypesForm(updated);
                          }}
                        >
                          <SelectTrigger className="bg-white/5 border-white/10 text-white text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-[#0B0E13] border-white/10">
                            <SelectItem value="lead" className="text-white hover:bg-white/10">Lead</SelectItem>
                            <SelectItem value="existing_client" className="text-white hover:bg-white/10">Existing Client</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-end gap-2">
                        <Switch
                          checked={type.active}
                          onCheckedChange={(checked) => {
                            const updated = [...appointmentTypesForm];
                            updated[index] = { ...type, active: checked };
                            setAppointmentTypesForm(updated);
                          }}
                          className="neon-switch"
                        />
                        <span className="text-xs text-white/55">{type.active ? 'Active' : 'Inactive'}</span>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => setAppointmentTypesForm(appointmentTypesForm.filter((_, i) => i !== index))}
                          className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-400/10 ml-auto"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="mt-3">
                      <label className="text-xs text-white/55">Description</label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 rounded-lg glass-input text-sm mt-1"
                        value={type.description}
                        onChange={(e) => {
                          const updated = [...appointmentTypesForm];
                          updated[index] = { ...type, description: e.target.value };
                          setAppointmentTypesForm(updated);
                        }}
                        placeholder="Brief description of this appointment type"
                      />
                    </div>
                  </div>
                ))}
                <div className="flex justify-end pt-4">
                  <Button
                    onClick={() => updateAppointmentTypesMutation.mutate(appointmentTypesForm)}
                    disabled={updateAppointmentTypesMutation.isPending}
                    className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white"
                    data-testid="button-save-appointment-types"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {updateAppointmentTypesMutation.isPending ? 'Saving...' : 'Save Appointment Types'}
                  </Button>
                </div>
              </GlassCardContent>
            </GlassCard>

            {/* Pre-Intake Questions */}
            <GlassCard>
              <GlassCardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <GlassCardTitle>Pre-Intake Questions</GlassCardTitle>
                    <GlassCardDescription>Configure the qualification questions asked before booking</GlassCardDescription>
                  </div>
                  <Button
                    onClick={handleAddPreIntakeQuestion}
                    className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white"
                    data-testid="button-add-pre-intake"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Question
                  </Button>
                </div>
              </GlassCardHeader>
              <GlassCardContent className="space-y-4">
                {preIntakeForm.sort((a, b) => a.order - b.order).map((question, index) => (
                  <div 
                    key={question.id} 
                    className="p-4 bg-white/5 rounded-xl border border-white/10"
                    data-testid={`pre-intake-question-${index}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex flex-col items-center gap-1 pt-2">
                        <GripVertical className="h-4 w-4 text-white/30" />
                        <span className="text-xs text-white/40">#{question.order}</span>
                      </div>
                      <div className="flex-1 space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="md:col-span-2 space-y-2">
                            <label className="text-xs text-white/55">Question Label</label>
                            <input
                              type="text"
                              className="w-full px-3 py-2 rounded-lg glass-input text-sm"
                              value={question.label}
                              onChange={(e) => {
                                const updated = [...preIntakeForm];
                                updated[index] = { ...question, label: e.target.value };
                                setPreIntakeForm(updated);
                              }}
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs text-white/55">Type</label>
                            <Select 
                              value={question.type} 
                              onValueChange={(value: any) => {
                                const updated = [...preIntakeForm];
                                updated[index] = { ...question, type: value };
                                setPreIntakeForm(updated);
                              }}
                            >
                              <SelectTrigger className="bg-white/5 border-white/10 text-white text-sm">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-[#0B0E13] border-white/10">
                                <SelectItem value="single_choice" className="text-white hover:bg-white/10">Single Choice</SelectItem>
                                <SelectItem value="multi_choice" className="text-white hover:bg-white/10">Multiple Choice</SelectItem>
                                <SelectItem value="text" className="text-white hover:bg-white/10">Text Input</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        {(question.type === 'single_choice' || question.type === 'multi_choice') && (
                          <div className="space-y-2">
                            <label className="text-xs text-white/55">Options (one per line, format: value|label)</label>
                            <textarea
                              className="w-full px-3 py-2 rounded-lg glass-input text-sm min-h-16 resize-none"
                              value={question.options.map(o => `${o.value}|${o.label}`).join('\n')}
                              onChange={(e) => {
                                const lines = e.target.value.split('\n');
                                const options = lines.map(line => {
                                  const [value, label] = line.split('|');
                                  return { value: value || '', label: label || value || '' };
                                }).filter(o => o.value);
                                const updated = [...preIntakeForm];
                                updated[index] = { ...question, options };
                                setPreIntakeForm(updated);
                              }}
                              placeholder="yes|Yes&#10;no|No"
                            />
                          </div>
                        )}
                        <div className="flex items-center gap-4">
                          <label className="flex items-center gap-2 text-sm text-white/55">
                            <Switch
                              checked={question.required}
                              onCheckedChange={(checked) => {
                                const updated = [...preIntakeForm];
                                updated[index] = { ...question, required: checked };
                                setPreIntakeForm(updated);
                              }}
                              className="neon-switch"
                            />
                            Required
                          </label>
                          <label className="flex items-center gap-2 text-sm text-white/55">
                            <Switch
                              checked={question.active}
                              onCheckedChange={(checked) => {
                                const updated = [...preIntakeForm];
                                updated[index] = { ...question, active: checked };
                                setPreIntakeForm(updated);
                              }}
                              className="neon-switch"
                            />
                            Active
                          </label>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => setPreIntakeForm(preIntakeForm.filter((_, i) => i !== index))}
                            className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-400/10 ml-auto"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                <div className="flex justify-end pt-4">
                  <Button
                    onClick={() => updatePreIntakeMutation.mutate(preIntakeForm)}
                    disabled={updatePreIntakeMutation.isPending}
                    className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white"
                    data-testid="button-save-pre-intake"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {updatePreIntakeMutation.isPending ? 'Saving...' : 'Save Pre-Intake Config'}
                  </Button>
                </div>
              </GlassCardContent>
            </GlassCard>
          </TabsContent>

          {/* Hours Tab */}
          <TabsContent value="hours" className="space-y-6">
            <GlassCard>
              <GlassCardHeader>
                <GlassCardTitle>Operating Hours</GlassCardTitle>
                <GlassCardDescription>
                  Set business hours for automatic after-hours responses
                </GlassCardDescription>
              </GlassCardHeader>
              <GlassCardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
                  <div>
                    <p className="text-sm font-medium text-white/85">Enable Operating Hours</p>
                    <p className="text-xs text-white/55 mt-1">
                      Automatically respond differently outside business hours
                    </p>
                  </div>
                  <Switch
                    data-testid="switch-enable-hours"
                    className="neon-switch"
                    checked={formData.operatingHours?.enabled ?? settings?.operatingHours?.enabled ?? false}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        operatingHours: {
                          ...(formData.operatingHours || settings?.operatingHours || {}),
                          enabled: checked,
                        } as any,
                      })
                    }
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-medium text-white/55">After Hours Message</label>
                  <textarea
                    className="w-full px-4 py-3 rounded-xl glass-input min-h-20 resize-none"
                    data-testid="input-after-hours"
                    value={
                      formData.operatingHours?.afterHoursMessage ||
                      settings?.operatingHours?.afterHoursMessage || ''
                    }
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        operatingHours: {
                          ...(formData.operatingHours || settings?.operatingHours || {}),
                          afterHoursMessage: e.target.value,
                        } as any,
                      })
                    }
                    placeholder="Message shown when outside business hours..."
                  />
                </div>
                <div className="flex justify-end pt-4">
                  <Button
                    onClick={handleSubmit}
                    disabled={updateMutation.isPending}
                    className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white"
                    data-testid="button-save-hours"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {updateMutation.isPending ? 'Saving...' : 'Save Hours'}
                  </Button>
                </div>
              </GlassCardContent>
            </GlassCard>
          </TabsContent>

          {/* Notifications Tab - Enhanced */}
          <TabsContent value="notifications" className="space-y-6">
            <GlassCard>
              <GlassCardHeader>
                <GlassCardTitle>Staff Notification Settings</GlassCardTitle>
                <GlassCardDescription>Configure how staff receives alerts for new appointments</GlassCardDescription>
              </GlassCardHeader>
              <GlassCardContent className="space-y-6">
                {/* Info Alert */}
                <div className="flex items-start gap-3 p-4 rounded-xl bg-cyan-500/10 border border-cyan-400/20">
                  <AlertCircle className="h-5 w-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-white/85">
                    Configure staff notification endpoints. Email requires RESEND_API_KEY and SMS requires Twilio credentials.
                  </p>
                </div>

                {/* Staff Channel Preference */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-white/55">Preferred Staff Channel</label>
                  <Select 
                    value={notificationsForm.staffChannelPreference || 'email_only'} 
                    onValueChange={(value: any) => setNotificationsForm({ ...notificationsForm, staffChannelPreference: value })}
                  >
                    <SelectTrigger className="w-full bg-white/5 border-white/10 text-white" data-testid="select-staff-channel">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0B0E13] border-white/10">
                      <SelectItem value="email_only" className="text-white hover:bg-white/10">Email Only</SelectItem>
                      <SelectItem value="sms_only" className="text-white hover:bg-white/10">SMS Only</SelectItem>
                      <SelectItem value="email_and_sms" className="text-white hover:bg-white/10">Email & SMS</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Staff Emails */}
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-white/55">Staff Emails</label>
                    <p className="text-xs text-white/40 mt-1">Add email addresses for staff notifications</p>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 min-h-[40px] p-3 bg-white/5 rounded-xl border border-white/10" data-testid="staff-email-list">
                    {(notificationsForm.staffEmails || []).map((email, index) => (
                      <NeonBadge 
                        key={email}
                        variant="new"
                        className="pl-3 pr-1 py-1.5 flex items-center gap-2"
                      >
                        <Mail className="h-3 w-3" />
                        <span>{email}</span>
                        <button
                          type="button"
                          className="p-0.5 rounded-full hover:bg-white/20 transition-colors"
                          onClick={() => removeStaffEmail(email)}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </NeonBadge>
                    ))}
                    {(!notificationsForm.staffEmails || notificationsForm.staffEmails.length === 0) && (
                      <p className="text-sm text-white/40 italic">No emails added yet</p>
                    )}
                  </div>
                  
                  <div className="flex gap-3">
                    <input
                      type="email"
                      className="flex-1 px-4 py-2.5 rounded-xl glass-input"
                      data-testid="input-staff-email"
                      value={newEmailInput}
                      onChange={(e) => setNewEmailInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addStaffEmail();
                        }
                      }}
                      placeholder="Enter staff email..."
                    />
                    <Button onClick={addStaffEmail} variant="outline" className="border-white/10" data-testid="button-add-staff-email">
                      <Plus className="h-4 w-4 mr-2" />
                      Add
                    </Button>
                  </div>
                </div>

                {/* Staff Phones */}
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-white/55">Staff SMS Numbers</label>
                    <p className="text-xs text-white/40 mt-1">Add phone numbers for SMS notifications (future use)</p>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 min-h-[40px] p-3 bg-white/5 rounded-xl border border-white/10" data-testid="staff-phone-list">
                    {(notificationsForm.staffPhones || []).map((phone, index) => (
                      <NeonBadge 
                        key={phone}
                        variant="info"
                        className="pl-3 pr-1 py-1.5 flex items-center gap-2"
                      >
                        <Phone className="h-3 w-3" />
                        <span>{phone}</span>
                        <button
                          type="button"
                          className="p-0.5 rounded-full hover:bg-white/20 transition-colors"
                          onClick={() => removeStaffPhone(phone)}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </NeonBadge>
                    ))}
                    {(!notificationsForm.staffPhones || notificationsForm.staffPhones.length === 0) && (
                      <p className="text-sm text-white/40 italic">No phone numbers added yet</p>
                    )}
                  </div>
                  
                  <div className="flex gap-3">
                    <input
                      type="tel"
                      className="flex-1 px-4 py-2.5 rounded-xl glass-input"
                      data-testid="input-staff-phone"
                      value={newPhoneInput}
                      onChange={(e) => setNewPhoneInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addStaffPhone();
                        }
                      }}
                      placeholder="Enter phone number..."
                    />
                    <Button onClick={addStaffPhone} variant="outline" className="border-white/10" data-testid="button-add-staff-phone">
                      <Plus className="h-4 w-4 mr-2" />
                      Add
                    </Button>
                  </div>
                </div>

                {/* Event Toggles */}
                <div className="border-t border-white/10 pt-6 space-y-4">
                  <h4 className="text-sm font-medium text-white/85">Notification Triggers</h4>
                  
                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
                    <div>
                      <p className="text-sm font-medium text-white/85">New Appointment Email</p>
                      <p className="text-xs text-white/55 mt-1">Send email when a new appointment is booked</p>
                    </div>
                    <Switch
                      checked={notificationsForm.eventToggles?.newAppointmentEmail ?? true}
                      onCheckedChange={(checked) => setNotificationsForm({
                        ...notificationsForm,
                        eventToggles: { ...notificationsForm.eventToggles!, newAppointmentEmail: checked }
                      })}
                      className="neon-switch"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
                    <div>
                      <p className="text-sm font-medium text-white/85">New Appointment SMS</p>
                      <p className="text-xs text-white/55 mt-1">Send SMS when a new appointment is booked</p>
                    </div>
                    <Switch
                      checked={notificationsForm.eventToggles?.newAppointmentSms ?? false}
                      onCheckedChange={(checked) => setNotificationsForm({
                        ...notificationsForm,
                        eventToggles: { ...notificationsForm.eventToggles!, newAppointmentSms: checked }
                      })}
                      className="neon-switch"
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10 opacity-60">
                    <div>
                      <p className="text-sm font-medium text-white/85">Pre-Intake Without Booking</p>
                      <p className="text-xs text-white/55 mt-1">Alert when someone completes intake but doesn't book (coming soon)</p>
                    </div>
                    <Switch
                      checked={notificationsForm.eventToggles?.newPreIntakeEmail ?? false}
                      disabled
                      className="neon-switch"
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10 opacity-60">
                    <div>
                      <p className="text-sm font-medium text-white/85">Same-Day Reminder</p>
                      <p className="text-xs text-white/55 mt-1">Send reminder on day of appointment (coming soon)</p>
                    </div>
                    <Switch
                      checked={notificationsForm.eventToggles?.sameDayReminder ?? false}
                      disabled
                      className="neon-switch"
                    />
                  </div>
                </div>

                {/* Email Templates */}
                <div className="border-t border-white/10 pt-6 space-y-4">
                  <h4 className="text-sm font-medium text-white/85">Email Templates</h4>
                  <p className="text-xs text-white/40">Use tokens: {"{{clientName}}"}, {"{{leadName}}"}, {"{{appointmentType}}"}, {"{{preferredTime}}"}</p>
                  
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-white/55">Staff Email Subject</label>
                    <input
                      type="text"
                      className="w-full px-4 py-2.5 rounded-xl glass-input"
                      data-testid="input-email-subject"
                      value={notificationsForm.templates?.staffEmailSubject || ''}
                      onChange={(e) => setNotificationsForm({
                        ...notificationsForm,
                        templates: { ...notificationsForm.templates!, staffEmailSubject: e.target.value }
                      })}
                      placeholder="New Appointment Request from {{leadName}}"
                    />
                  </div>
                  
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-white/55">Staff Email Body</label>
                    <textarea
                      className="w-full px-4 py-3 rounded-xl glass-input min-h-24 resize-none"
                      data-testid="input-email-body"
                      value={notificationsForm.templates?.staffEmailBody || ''}
                      onChange={(e) => setNotificationsForm({
                        ...notificationsForm,
                        templates: { ...notificationsForm.templates!, staffEmailBody: e.target.value }
                      })}
                      placeholder="A new {{appointmentType}} appointment has been requested by {{leadName}} for {{preferredTime}}."
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <Button
                    onClick={() => updateNotificationsMutation.mutate(notificationsForm as NotificationSettings)}
                    disabled={updateNotificationsMutation.isPending}
                    className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white"
                    data-testid="button-save-notifications"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {updateNotificationsMutation.isPending ? 'Saving...' : 'Save Notifications'}
                  </Button>
                </div>
              </GlassCardContent>
            </GlassCard>
          </TabsContent>

          {/* Branding Tab - Placeholder */}
          <TabsContent value="branding" className="space-y-6">
            <GlassCard>
              <GlassCardHeader>
                <GlassCardTitle>Branding Settings</GlassCardTitle>
                <GlassCardDescription>Customize the visual appearance (coming in Phase 2)</GlassCardDescription>
              </GlassCardHeader>
              <GlassCardContent>
                <div className="flex items-center justify-center py-12 text-white/40">
                  <div className="text-center">
                    <Palette className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Branding customization coming soon</p>
                    <p className="text-sm mt-2">Logo upload, colors, and theme settings</p>
                  </div>
                </div>
              </GlassCardContent>
            </GlassCard>
          </TabsContent>

          {/* Privacy Tab - Placeholder */}
          <TabsContent value="privacy" className="space-y-6">
            <GlassCard>
              <GlassCardHeader>
                <GlassCardTitle>Privacy Settings</GlassCardTitle>
                <GlassCardDescription>Configure data handling and privacy options</GlassCardDescription>
              </GlassCardHeader>
              <GlassCardContent>
                <div className="flex items-center justify-center py-12 text-white/40">
                  <div className="text-center">
                    <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Privacy configuration coming soon</p>
                    <p className="text-sm mt-2">Data retention, PII handling, and compliance settings</p>
                  </div>
                </div>
              </GlassCardContent>
            </GlassCard>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}

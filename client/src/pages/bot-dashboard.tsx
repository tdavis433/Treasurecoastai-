import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { useState, useEffect } from "react";
import { GlassCard, GlassCardHeader, GlassCardTitle, GlassCardDescription, GlassCardContent } from "@/components/ui/glass-card";
import { NeonBadge } from "@/components/ui/neon-badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { AdminLayout } from "@/components/admin-layout";
import { 
  ArrowLeft, Settings, BookOpen, MessageSquare, Clock, Save, 
  Phone, Mail, Globe, MapPin, Building2, Sparkles, AlertTriangle,
  Calendar, Utensils, Scissors, Car, Dumbbell, Home, ClipboardList,
  Users, DollarSign, Shield, Search, Loader2, ExternalLink, Check,
  X, RefreshCw, Trash2, Plus, Download, BarChart3, Send, Bot,
  Play, Eye, Code2, Zap, Bell
} from "lucide-react";

interface BotFaq {
  question: string;
  answer: string;
}

interface KeywordAutomation {
  id: string;
  keywords: string[];
  response: string;
  enabled: boolean;
}

interface ScrapedWebsite {
  id: string;
  url: string;
  domain: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  pageTitle?: string;
  metaDescription?: string;
  errorMessage?: string;
  extractedData?: {
    businessName?: string;
    tagline?: string;
    description?: string;
    services?: Array<{ name: string; description?: string; price?: string }>;
    faqs?: Array<{ question: string; answer: string }>;
    contactInfo?: {
      phone?: string;
      email?: string;
      address?: string;
      hours?: Record<string, string>;
    };
    keyFeatures?: string[];
    aboutContent?: string;
  };
  createdAt: string;
  appliedToBotAt?: string;
}

interface BotConfig {
  clientId: string;
  botId: string;
  name: string;
  description: string;
  businessProfile: {
    businessName: string;
    type: string;
    location: string;
    phone: string;
    email: string;
    website: string;
    hours: Record<string, string>;
    services?: string[];
    amenities?: string[];
    serviceArea?: string;
    cuisine?: string;
    booking?: {
      onlineBookingUrl?: string;
      walkInsWelcome?: boolean;
      walkInsNote?: string;
    };
    membershipOptions?: string[];
  };
  rules: {
    allowedTopics: string[];
    forbiddenTopics: string[];
    specialInstructions?: string[];
    crisisHandling: {
      onCrisisKeywords: string[];
      responseTemplate: string;
    };
  };
  automations?: KeywordAutomation[];
  notifications?: {
    enabled: boolean;
    emailNotifications: boolean;
    notifyOnNewLead: boolean;
    notifyOnBooking: boolean;
    notifyOnCrisis: boolean;
    dailySummary: boolean;
    notificationEmail: string;
  };
  systemPrompt: string;
  faqs: BotFaq[];
  metadata?: {
    isDemo: boolean;
    createdAt: string;
    version: string;
  };
}

interface AuthUser {
  id: string;
  username: string;
  role: 'super_admin' | 'client_admin';
}

const BUSINESS_TYPE_ICONS: Record<string, typeof Building2> = {
  sober_living: Home,
  restaurant: Utensils,
  barber: Scissors,
  homeservice: Home,
  autoservice: Car,
  gym: Dumbbell,
};

const BUSINESS_TYPE_LABELS: Record<string, string> = {
  sober_living: "Sober Living",
  restaurant: "Restaurant",
  barber: "Barber/Salon",
  homeservice: "Home Services",
  autoservice: "Auto Shop",
  gym: "Gym/Fitness",
};

export default function BotDashboard() {
  const { botId } = useParams<{ botId: string }>();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [hasChanges, setHasChanges] = useState(false);
  const [editedConfig, setEditedConfig] = useState<BotConfig | null>(null);

  const { data: currentUser, isLoading: authLoading } = useQuery<AuthUser>({
    queryKey: ["/api/auth/me"],
    queryFn: async () => {
      const response = await fetch("/api/auth/me", { credentials: "include" });
      if (!response.ok) throw new Error("Not authenticated");
      return response.json();
    },
    retry: false,
  });

  const { data: botConfig, isLoading: configLoading } = useQuery<BotConfig>({
    queryKey: ["/api/super-admin/bots", botId],
    enabled: currentUser?.role === "super_admin" && !!botId,
  });

  useEffect(() => {
    if (botConfig) {
      setEditedConfig(botConfig);
    }
  }, [botConfig]);

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

  const saveMutation = useMutation({
    mutationFn: async (config: BotConfig) => {
      const response = await apiRequest("PUT", `/api/super-admin/bots/${botId}`, config);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/super-admin/bots", botId] });
      setHasChanges(false);
      toast({ title: "Saved", description: "Bot configuration has been updated." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to save configuration.", variant: "destructive" });
    },
  });

  const handleSave = () => {
    if (editedConfig) {
      saveMutation.mutate(editedConfig);
    }
  };

  const updateConfig = (updates: Partial<BotConfig>) => {
    if (editedConfig) {
      setEditedConfig({ ...editedConfig, ...updates });
      setHasChanges(true);
    }
  };

  const updateBusinessProfile = (updates: Partial<BotConfig['businessProfile']>) => {
    if (editedConfig) {
      setEditedConfig({
        ...editedConfig,
        businessProfile: { ...editedConfig.businessProfile, ...updates }
      });
      setHasChanges(true);
    }
  };

  const updateRules = (updates: Partial<BotConfig['rules']>) => {
    if (editedConfig) {
      setEditedConfig({
        ...editedConfig,
        rules: { ...editedConfig.rules, ...updates }
      });
      setHasChanges(true);
    }
  };

  const updateFaq = (index: number, updates: Partial<BotFaq>) => {
    if (editedConfig) {
      const newFaqs = [...editedConfig.faqs];
      newFaqs[index] = { ...newFaqs[index], ...updates };
      setEditedConfig({ ...editedConfig, faqs: newFaqs });
      setHasChanges(true);
    }
  };

  const addFaq = () => {
    if (editedConfig) {
      setEditedConfig({
        ...editedConfig,
        faqs: [...editedConfig.faqs, { question: '', answer: '' }]
      });
      setHasChanges(true);
    }
  };

  const removeFaq = (index: number) => {
    if (editedConfig) {
      const newFaqs = editedConfig.faqs.filter((_, i) => i !== index);
      setEditedConfig({ ...editedConfig, faqs: newFaqs });
      setHasChanges(true);
    }
  };

  if (authLoading || configLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center gap-3 text-white/55">
            <Sparkles className="h-5 w-5 animate-pulse text-cyan-400" />
            <span>Loading bot configuration...</span>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!currentUser || currentUser.role !== "super_admin" || !editedConfig) {
    return null;
  }

  const businessType = editedConfig.businessProfile.type;
  const BusinessIcon = BUSINESS_TYPE_ICONS[businessType] || Building2;
  const businessLabel = BUSINESS_TYPE_LABELS[businessType] || businessType;

  const renderBusinessTypeTabs = () => {
    switch (businessType) {
      case 'sober_living':
        return (
          <>
            <TabsTrigger value="appointments" className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500/20 data-[state=active]:to-blue-500/20 data-[state=active]:text-cyan-400 data-[state=active]:border data-[state=active]:border-cyan-400/30 data-[state=inactive]:text-white/55 data-[state=inactive]:hover:text-white transition-all" data-testid="tab-appointments">
              <Calendar className="h-4 w-4" />
              Appointments
            </TabsTrigger>
            <TabsTrigger value="intake" className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500/20 data-[state=active]:to-blue-500/20 data-[state=active]:text-cyan-400 data-[state=active]:border data-[state=active]:border-cyan-400/30 data-[state=inactive]:text-white/55 data-[state=inactive]:hover:text-white transition-all" data-testid="tab-intake">
              <ClipboardList className="h-4 w-4" />
              Pre-Intake
            </TabsTrigger>
            <TabsTrigger value="crisis" className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500/20 data-[state=active]:to-blue-500/20 data-[state=active]:text-cyan-400 data-[state=active]:border data-[state=active]:border-cyan-400/30 data-[state=inactive]:text-white/55 data-[state=inactive]:hover:text-white transition-all" data-testid="tab-crisis">
              <Shield className="h-4 w-4" />
              Crisis Handling
            </TabsTrigger>
          </>
        );
      case 'restaurant':
        return (
          <>
            <TabsTrigger value="menu" className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500/20 data-[state=active]:to-blue-500/20 data-[state=active]:text-cyan-400 data-[state=active]:border data-[state=active]:border-cyan-400/30 data-[state=inactive]:text-white/55 data-[state=inactive]:hover:text-white transition-all" data-testid="tab-menu">
              <Utensils className="h-4 w-4" />
              Menu & Cuisine
            </TabsTrigger>
            <TabsTrigger value="reservations" className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500/20 data-[state=active]:to-blue-500/20 data-[state=active]:text-cyan-400 data-[state=active]:border data-[state=active]:border-cyan-400/30 data-[state=inactive]:text-white/55 data-[state=inactive]:hover:text-white transition-all" data-testid="tab-reservations">
              <Calendar className="h-4 w-4" />
              Reservations
            </TabsTrigger>
          </>
        );
      case 'barber':
        return (
          <>
            <TabsTrigger value="services" className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500/20 data-[state=active]:to-blue-500/20 data-[state=active]:text-cyan-400 data-[state=active]:border data-[state=active]:border-cyan-400/30 data-[state=inactive]:text-white/55 data-[state=inactive]:hover:text-white transition-all" data-testid="tab-services">
              <Scissors className="h-4 w-4" />
              Services & Pricing
            </TabsTrigger>
            <TabsTrigger value="appointments" className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500/20 data-[state=active]:to-blue-500/20 data-[state=active]:text-cyan-400 data-[state=active]:border data-[state=active]:border-cyan-400/30 data-[state=inactive]:text-white/55 data-[state=inactive]:hover:text-white transition-all" data-testid="tab-appointments">
              <Calendar className="h-4 w-4" />
              Appointments
            </TabsTrigger>
          </>
        );
      case 'gym':
        return (
          <>
            <TabsTrigger value="memberships" className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500/20 data-[state=active]:to-blue-500/20 data-[state=active]:text-cyan-400 data-[state=active]:border data-[state=active]:border-cyan-400/30 data-[state=inactive]:text-white/55 data-[state=inactive]:hover:text-white transition-all" data-testid="tab-memberships">
              <Users className="h-4 w-4" />
              Memberships
            </TabsTrigger>
            <TabsTrigger value="classes" className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500/20 data-[state=active]:to-blue-500/20 data-[state=active]:text-cyan-400 data-[state=active]:border data-[state=active]:border-cyan-400/30 data-[state=inactive]:text-white/55 data-[state=inactive]:hover:text-white transition-all" data-testid="tab-classes">
              <Dumbbell className="h-4 w-4" />
              Classes & Amenities
            </TabsTrigger>
          </>
        );
      case 'homeservice':
      case 'autoservice':
        return (
          <>
            <TabsTrigger value="services" className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500/20 data-[state=active]:to-blue-500/20 data-[state=active]:text-cyan-400 data-[state=active]:border data-[state=active]:border-cyan-400/30 data-[state=inactive]:text-white/55 data-[state=inactive]:hover:text-white transition-all" data-testid="tab-services">
              <ClipboardList className="h-4 w-4" />
              Services & Pricing
            </TabsTrigger>
            <TabsTrigger value="scheduling" className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500/20 data-[state=active]:to-blue-500/20 data-[state=active]:text-cyan-400 data-[state=active]:border data-[state=active]:border-cyan-400/30 data-[state=inactive]:text-white/55 data-[state=inactive]:hover:text-white transition-all" data-testid="tab-scheduling">
              <Calendar className="h-4 w-4" />
              Scheduling
            </TabsTrigger>
          </>
        );
      default:
        return null;
    }
  };

  const renderBusinessTypeContent = () => {
    switch (businessType) {
      case 'sober_living':
        return (
          <>
            <TabsContent value="appointments">
              <GlassCard>
                <GlassCardHeader>
                  <GlassCardTitle>Appointment Configuration</GlassCardTitle>
                  <GlassCardDescription>Configure appointment types and scheduling for Faith House</GlassCardDescription>
                </GlassCardHeader>
                <GlassCardContent>
                  <div className="text-white/55 text-center py-8">
                    <Calendar className="h-12 w-12 mx-auto mb-4 text-white/30" />
                    <p>Appointment configuration is managed in the main Super Admin panel.</p>
                    <Button 
                      variant="outline" 
                      className="mt-4"
                      onClick={() => setLocation('/super-admin')}
                      data-testid="button-go-super-admin"
                    >
                      Go to Super Admin
                    </Button>
                  </div>
                </GlassCardContent>
              </GlassCard>
            </TabsContent>
            <TabsContent value="intake">
              <GlassCard>
                <GlassCardHeader>
                  <GlassCardTitle>Pre-Intake Questions</GlassCardTitle>
                  <GlassCardDescription>Configure pre-qualification questions for potential residents</GlassCardDescription>
                </GlassCardHeader>
                <GlassCardContent>
                  <div className="text-white/55 text-center py-8">
                    <ClipboardList className="h-12 w-12 mx-auto mb-4 text-white/30" />
                    <p>Pre-intake configuration is managed in the main Super Admin panel.</p>
                    <Button 
                      variant="outline" 
                      className="mt-4"
                      onClick={() => setLocation('/super-admin')}
                      data-testid="button-go-super-admin-intake"
                    >
                      Go to Super Admin
                    </Button>
                  </div>
                </GlassCardContent>
              </GlassCard>
            </TabsContent>
            <TabsContent value="crisis">
              <CrisisHandlingTab 
                config={editedConfig} 
                updateRules={updateRules}
              />
            </TabsContent>
          </>
        );
      case 'restaurant':
        return (
          <>
            <TabsContent value="menu">
              <GlassCard>
                <GlassCardHeader>
                  <GlassCardTitle>Menu & Cuisine</GlassCardTitle>
                  <GlassCardDescription>Configure menu highlights and cuisine type</GlassCardDescription>
                </GlassCardHeader>
                <GlassCardContent>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-white/70">Cuisine Type</Label>
                      <Input
                        value={editedConfig.businessProfile.cuisine || ''}
                        onChange={(e) => updateBusinessProfile({ cuisine: e.target.value })}
                        className="bg-white/5 border-white/10 text-white mt-1"
                        placeholder="e.g., Italian, Mexican, American"
                        data-testid="input-cuisine"
                      />
                    </div>
                    <div>
                      <Label className="text-white/70">Services (one per line)</Label>
                      <Textarea
                        value={editedConfig.businessProfile.services?.join('\n') || ''}
                        onChange={(e) => updateBusinessProfile({ services: e.target.value.split('\n').filter(s => s.trim()) })}
                        className="bg-white/5 border-white/10 text-white mt-1 min-h-[120px]"
                        placeholder="Dine-in&#10;Takeout&#10;Catering"
                        data-testid="input-restaurant-services"
                      />
                    </div>
                  </div>
                </GlassCardContent>
              </GlassCard>
            </TabsContent>
            <TabsContent value="reservations">
              <GlassCard>
                <GlassCardHeader>
                  <GlassCardTitle>Reservation Settings</GlassCardTitle>
                  <GlassCardDescription>Configure online reservation and walk-in policies</GlassCardDescription>
                </GlassCardHeader>
                <GlassCardContent>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-white/70">Online Booking URL</Label>
                      <Input
                        value={editedConfig.businessProfile.booking?.onlineBookingUrl || ''}
                        onChange={(e) => updateBusinessProfile({ 
                          booking: { ...editedConfig.businessProfile.booking, onlineBookingUrl: e.target.value }
                        })}
                        className="bg-white/5 border-white/10 text-white mt-1"
                        placeholder="https://..."
                        data-testid="input-booking-url"
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <Switch
                        checked={editedConfig.businessProfile.booking?.walkInsWelcome || false}
                        onCheckedChange={(checked) => updateBusinessProfile({ 
                          booking: { ...editedConfig.businessProfile.booking, walkInsWelcome: checked }
                        })}
                        data-testid="switch-walkins"
                      />
                      <Label className="text-white/70">Walk-ins Welcome</Label>
                    </div>
                  </div>
                </GlassCardContent>
              </GlassCard>
            </TabsContent>
          </>
        );
      case 'barber':
        return (
          <>
            <TabsContent value="services">
              <ServicesTab 
                config={editedConfig}
                updateBusinessProfile={updateBusinessProfile}
                serviceLabel="Haircut Services"
              />
            </TabsContent>
            <TabsContent value="appointments">
              <GlassCard>
                <GlassCardHeader>
                  <GlassCardTitle>Appointment Settings</GlassCardTitle>
                  <GlassCardDescription>Configure booking and walk-in policies</GlassCardDescription>
                </GlassCardHeader>
                <GlassCardContent>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-white/70">Online Booking URL</Label>
                      <Input
                        value={editedConfig.businessProfile.booking?.onlineBookingUrl || ''}
                        onChange={(e) => updateBusinessProfile({ 
                          booking: { ...editedConfig.businessProfile.booking, onlineBookingUrl: e.target.value }
                        })}
                        className="bg-white/5 border-white/10 text-white mt-1"
                        placeholder="https://..."
                        data-testid="input-barber-booking-url"
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <Switch
                        checked={editedConfig.businessProfile.booking?.walkInsWelcome || false}
                        onCheckedChange={(checked) => updateBusinessProfile({ 
                          booking: { ...editedConfig.businessProfile.booking, walkInsWelcome: checked }
                        })}
                        data-testid="switch-barber-walkins"
                      />
                      <Label className="text-white/70">Walk-ins Welcome</Label>
                    </div>
                    {editedConfig.businessProfile.booking?.walkInsWelcome && (
                      <div>
                        <Label className="text-white/70">Walk-in Note</Label>
                        <Input
                          value={editedConfig.businessProfile.booking?.walkInsNote || ''}
                          onChange={(e) => updateBusinessProfile({ 
                            booking: { ...editedConfig.businessProfile.booking, walkInsNote: e.target.value }
                          })}
                          className="bg-white/5 border-white/10 text-white mt-1"
                          placeholder="e.g., Walk-ins based on availability"
                          data-testid="input-walkin-note"
                        />
                      </div>
                    )}
                  </div>
                </GlassCardContent>
              </GlassCard>
            </TabsContent>
          </>
        );
      case 'gym':
        return (
          <>
            <TabsContent value="memberships">
              <GlassCard>
                <GlassCardHeader>
                  <GlassCardTitle>Membership Options</GlassCardTitle>
                  <GlassCardDescription>Configure available membership plans</GlassCardDescription>
                </GlassCardHeader>
                <GlassCardContent>
                  <div>
                    <Label className="text-white/70">Membership Options (one per line)</Label>
                    <Textarea
                      value={editedConfig.businessProfile.membershipOptions?.join('\n') || ''}
                      onChange={(e) => updateBusinessProfile({ membershipOptions: e.target.value.split('\n').filter(s => s.trim()) })}
                      className="bg-white/5 border-white/10 text-white mt-1 min-h-[150px]"
                      placeholder="Basic - $29/month&#10;Premium - $49/month&#10;Family Plan - $79/month"
                      data-testid="input-memberships"
                    />
                  </div>
                </GlassCardContent>
              </GlassCard>
            </TabsContent>
            <TabsContent value="classes">
              <GlassCard>
                <GlassCardHeader>
                  <GlassCardTitle>Classes & Amenities</GlassCardTitle>
                  <GlassCardDescription>Configure available classes and facility amenities</GlassCardDescription>
                </GlassCardHeader>
                <GlassCardContent>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-white/70">Services/Classes (one per line)</Label>
                      <Textarea
                        value={editedConfig.businessProfile.services?.join('\n') || ''}
                        onChange={(e) => updateBusinessProfile({ services: e.target.value.split('\n').filter(s => s.trim()) })}
                        className="bg-white/5 border-white/10 text-white mt-1 min-h-[120px]"
                        placeholder="Yoga&#10;Spin Class&#10;Personal Training"
                        data-testid="input-gym-services"
                      />
                    </div>
                    <div>
                      <Label className="text-white/70">Amenities (one per line)</Label>
                      <Textarea
                        value={editedConfig.businessProfile.amenities?.join('\n') || ''}
                        onChange={(e) => updateBusinessProfile({ amenities: e.target.value.split('\n').filter(s => s.trim()) })}
                        className="bg-white/5 border-white/10 text-white mt-1 min-h-[120px]"
                        placeholder="Pool&#10;Sauna&#10;Locker Rooms"
                        data-testid="input-amenities"
                      />
                    </div>
                  </div>
                </GlassCardContent>
              </GlassCard>
            </TabsContent>
          </>
        );
      case 'homeservice':
      case 'autoservice':
        return (
          <>
            <TabsContent value="services">
              <ServicesTab 
                config={editedConfig}
                updateBusinessProfile={updateBusinessProfile}
                serviceLabel={businessType === 'homeservice' ? "Home Services" : "Auto Services"}
              />
            </TabsContent>
            <TabsContent value="scheduling">
              <GlassCard>
                <GlassCardHeader>
                  <GlassCardTitle>Scheduling Settings</GlassCardTitle>
                  <GlassCardDescription>Configure service area and booking options</GlassCardDescription>
                </GlassCardHeader>
                <GlassCardContent>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-white/70">Service Area</Label>
                      <Input
                        value={editedConfig.businessProfile.serviceArea || ''}
                        onChange={(e) => updateBusinessProfile({ serviceArea: e.target.value })}
                        className="bg-white/5 border-white/10 text-white mt-1"
                        placeholder="e.g., Treasure Coast, FL within 30 miles"
                        data-testid="input-service-area"
                      />
                    </div>
                    <div>
                      <Label className="text-white/70">Online Booking URL</Label>
                      <Input
                        value={editedConfig.businessProfile.booking?.onlineBookingUrl || ''}
                        onChange={(e) => updateBusinessProfile({ 
                          booking: { ...editedConfig.businessProfile.booking, onlineBookingUrl: e.target.value }
                        })}
                        className="bg-white/5 border-white/10 text-white mt-1"
                        placeholder="https://..."
                        data-testid="input-service-booking-url"
                      />
                    </div>
                  </div>
                </GlassCardContent>
              </GlassCard>
            </TabsContent>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => setLocation('/super-admin')}
              className="text-white/55 hover:text-white"
              data-testid="button-back"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-400/30">
                <BusinessIcon className="h-6 w-6 text-cyan-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white" data-testid="text-bot-name">
                  {editedConfig.businessProfile.businessName}
                </h2>
                <p className="text-white/55 text-sm">{businessLabel} Dashboard</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {editedConfig.metadata?.isDemo && (
              <NeonBadge variant="default">Demo Bot</NeonBadge>
            )}
            <Button
              onClick={handleSave}
              disabled={!hasChanges || saveMutation.isPending}
              className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
              data-testid="button-save-config"
            >
              <Save className="h-4 w-4 mr-2" />
              {saveMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="flex flex-wrap gap-2 h-auto p-1 bg-white/5 rounded-xl border border-white/10">
            <TabsTrigger value="overview" className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500/20 data-[state=active]:to-blue-500/20 data-[state=active]:text-cyan-400 data-[state=active]:border data-[state=active]:border-cyan-400/30 data-[state=inactive]:text-white/55 data-[state=inactive]:hover:text-white transition-all" data-testid="tab-overview">
              <BarChart3 className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="profile" className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500/20 data-[state=active]:to-blue-500/20 data-[state=active]:text-cyan-400 data-[state=active]:border data-[state=active]:border-cyan-400/30 data-[state=inactive]:text-white/55 data-[state=inactive]:hover:text-white transition-all" data-testid="tab-profile">
              <Building2 className="h-4 w-4" />
              Business Profile
            </TabsTrigger>
            <TabsTrigger value="hours" className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500/20 data-[state=active]:to-blue-500/20 data-[state=active]:text-cyan-400 data-[state=active]:border data-[state=active]:border-cyan-400/30 data-[state=inactive]:text-white/55 data-[state=inactive]:hover:text-white transition-all" data-testid="tab-hours">
              <Clock className="h-4 w-4" />
              Hours
            </TabsTrigger>
            <TabsTrigger value="faqs" className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500/20 data-[state=active]:to-blue-500/20 data-[state=active]:text-cyan-400 data-[state=active]:border data-[state=active]:border-cyan-400/30 data-[state=inactive]:text-white/55 data-[state=inactive]:hover:text-white transition-all" data-testid="tab-faqs">
              <BookOpen className="h-4 w-4" />
              FAQs
            </TabsTrigger>
            <TabsTrigger value="prompt" className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500/20 data-[state=active]:to-blue-500/20 data-[state=active]:text-cyan-400 data-[state=active]:border data-[state=active]:border-cyan-400/30 data-[state=inactive]:text-white/55 data-[state=inactive]:hover:text-white transition-all" data-testid="tab-prompt">
              <MessageSquare className="h-4 w-4" />
              System Prompt
            </TabsTrigger>
            <TabsTrigger value="scraper" className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500/20 data-[state=active]:to-pink-500/20 data-[state=active]:text-purple-400 data-[state=active]:border data-[state=active]:border-purple-400/30 data-[state=inactive]:text-white/55 data-[state=inactive]:hover:text-white transition-all" data-testid="tab-scraper">
              <Search className="h-4 w-4" />
              Website Intelligence
            </TabsTrigger>
            <TabsTrigger value="test-chat" className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500/20 data-[state=active]:to-emerald-500/20 data-[state=active]:text-green-400 data-[state=active]:border data-[state=active]:border-green-400/30 data-[state=inactive]:text-white/55 data-[state=inactive]:hover:text-white transition-all" data-testid="tab-test-chat">
              <Play className="h-4 w-4" />
              Test Chat
            </TabsTrigger>
            <TabsTrigger value="automations" className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500/20 data-[state=active]:to-orange-500/20 data-[state=active]:text-amber-400 data-[state=active]:border data-[state=active]:border-amber-400/30 data-[state=inactive]:text-white/55 data-[state=inactive]:hover:text-white transition-all" data-testid="tab-automations">
              <Zap className="h-4 w-4" />
              Automations
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500/20 data-[state=active]:to-rose-500/20 data-[state=active]:text-pink-400 data-[state=active]:border data-[state=active]:border-pink-400/30 data-[state=inactive]:text-white/55 data-[state=inactive]:hover:text-white transition-all" data-testid="tab-notifications">
              <Bell className="h-4 w-4" />
              Notifications
            </TabsTrigger>
            {renderBusinessTypeTabs()}
          </TabsList>

          <TabsContent value="overview">
            <BotOverviewTab botId={botId || ''} botConfig={editedConfig} />
          </TabsContent>

          <TabsContent value="profile">
            <GlassCard>
              <GlassCardHeader>
                <GlassCardTitle>Business Profile</GlassCardTitle>
                <GlassCardDescription>Basic business information displayed to users</GlassCardDescription>
              </GlassCardHeader>
              <GlassCardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label className="text-white/70">Business Name</Label>
                      <Input
                        value={editedConfig.businessProfile.businessName}
                        onChange={(e) => updateBusinessProfile({ businessName: e.target.value })}
                        className="bg-white/5 border-white/10 text-white mt-1"
                        data-testid="input-business-name"
                      />
                    </div>
                    <div>
                      <Label className="text-white/70">Description</Label>
                      <Textarea
                        value={editedConfig.description}
                        onChange={(e) => updateConfig({ description: e.target.value })}
                        className="bg-white/5 border-white/10 text-white mt-1"
                        data-testid="input-description"
                      />
                    </div>
                    <div>
                      <Label className="text-white/70 flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Location
                      </Label>
                      <Input
                        value={editedConfig.businessProfile.location}
                        onChange={(e) => updateBusinessProfile({ location: e.target.value })}
                        className="bg-white/5 border-white/10 text-white mt-1"
                        data-testid="input-location"
                      />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-white/70 flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        Phone
                      </Label>
                      <Input
                        value={editedConfig.businessProfile.phone}
                        onChange={(e) => updateBusinessProfile({ phone: e.target.value })}
                        className="bg-white/5 border-white/10 text-white mt-1"
                        data-testid="input-phone"
                      />
                    </div>
                    <div>
                      <Label className="text-white/70 flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Email
                      </Label>
                      <Input
                        value={editedConfig.businessProfile.email}
                        onChange={(e) => updateBusinessProfile({ email: e.target.value })}
                        className="bg-white/5 border-white/10 text-white mt-1"
                        data-testid="input-email"
                      />
                    </div>
                    <div>
                      <Label className="text-white/70 flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        Website
                      </Label>
                      <Input
                        value={editedConfig.businessProfile.website}
                        onChange={(e) => updateBusinessProfile({ website: e.target.value })}
                        className="bg-white/5 border-white/10 text-white mt-1"
                        data-testid="input-website"
                      />
                    </div>
                  </div>
                </div>
              </GlassCardContent>
            </GlassCard>
          </TabsContent>

          <TabsContent value="hours">
            <HoursTab 
              config={editedConfig}
              updateBusinessProfile={updateBusinessProfile}
            />
          </TabsContent>

          <TabsContent value="faqs">
            <FaqsTab 
              config={editedConfig}
              updateFaq={updateFaq}
              addFaq={addFaq}
              removeFaq={removeFaq}
            />
          </TabsContent>

          <TabsContent value="prompt">
            <GlassCard>
              <GlassCardHeader>
                <GlassCardTitle>System Prompt</GlassCardTitle>
                <GlassCardDescription>The AI's core instructions and personality</GlassCardDescription>
              </GlassCardHeader>
              <GlassCardContent>
                <Textarea
                  value={editedConfig.systemPrompt}
                  onChange={(e) => updateConfig({ systemPrompt: e.target.value })}
                  className="bg-white/5 border-white/10 text-white min-h-[400px] font-mono text-sm"
                  data-testid="input-system-prompt"
                />
              </GlassCardContent>
            </GlassCard>
          </TabsContent>

          <TabsContent value="scraper">
            <WebsiteScraperTab 
              botId={botId || ''} 
              botConfig={editedConfig}
              updateConfig={updateConfig}
              updateBusinessProfile={updateBusinessProfile}
            />
          </TabsContent>

          <TabsContent value="test-chat">
            <TestChatTab botId={botId || ''} botConfig={editedConfig} />
          </TabsContent>

          <TabsContent value="automations">
            <AutomationsTab 
              config={editedConfig}
              updateConfig={updateConfig}
            />
          </TabsContent>

          <TabsContent value="notifications">
            <NotificationsTab 
              config={editedConfig}
              updateConfig={updateConfig}
            />
          </TabsContent>

          {renderBusinessTypeContent()}
        </Tabs>
      </div>
    </AdminLayout>
  );
}

function HoursTab({ config, updateBusinessProfile }: { 
  config: BotConfig; 
  updateBusinessProfile: (updates: Partial<BotConfig['businessProfile']>) => void;
}) {
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  
  const updateHours = (day: string, value: string) => {
    updateBusinessProfile({
      hours: { ...config.businessProfile.hours, [day]: value }
    });
  };

  return (
    <GlassCard>
      <GlassCardHeader>
        <GlassCardTitle>Business Hours</GlassCardTitle>
        <GlassCardDescription>Set your operating hours for each day</GlassCardDescription>
      </GlassCardHeader>
      <GlassCardContent>
        <div className="space-y-4">
          {days.map(day => (
            <div key={day} className="flex items-center gap-4">
              <div className="w-28 text-white/70 capitalize">{day}</div>
              <Input
                value={config.businessProfile.hours[day] || ''}
                onChange={(e) => updateHours(day, e.target.value)}
                className="bg-white/5 border-white/10 text-white flex-1"
                placeholder="e.g., 9:00 AM - 5:00 PM or Closed"
                data-testid={`input-hours-${day}`}
              />
            </div>
          ))}
        </div>
      </GlassCardContent>
    </GlassCard>
  );
}

function FaqsTab({ config, updateFaq, addFaq, removeFaq }: {
  config: BotConfig;
  updateFaq: (index: number, updates: Partial<BotFaq>) => void;
  addFaq: () => void;
  removeFaq: (index: number) => void;
}) {
  return (
    <GlassCard>
      <GlassCardHeader>
        <div className="flex items-center justify-between">
          <div>
            <GlassCardTitle>Frequently Asked Questions</GlassCardTitle>
            <GlassCardDescription>Add Q&A pairs the bot can reference</GlassCardDescription>
          </div>
          <Button onClick={addFaq} variant="outline" data-testid="button-add-faq">
            Add FAQ
          </Button>
        </div>
      </GlassCardHeader>
      <GlassCardContent>
        <div className="space-y-4">
          {config.faqs.map((faq, index) => (
            <div key={index} className="p-4 rounded-lg bg-white/5 border border-white/10 space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-3">
                  <div>
                    <Label className="text-white/70">Question</Label>
                    <Input
                      value={faq.question}
                      onChange={(e) => updateFaq(index, { question: e.target.value })}
                      className="bg-white/5 border-white/10 text-white mt-1"
                      placeholder="e.g., What are your hours?"
                      data-testid={`input-faq-question-${index}`}
                    />
                  </div>
                  <div>
                    <Label className="text-white/70">Answer</Label>
                    <Textarea
                      value={faq.answer}
                      onChange={(e) => updateFaq(index, { answer: e.target.value })}
                      className="bg-white/5 border-white/10 text-white mt-1"
                      placeholder="e.g., We are open Monday-Friday 9am-5pm."
                      data-testid={`input-faq-answer-${index}`}
                    />
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeFaq(index)}
                  className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
                  data-testid={`button-remove-faq-${index}`}
                >
                  <AlertTriangle className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
          {config.faqs.length === 0 && (
            <div className="text-center py-8 text-white/40">
              No FAQs configured. Click "Add FAQ" to create one.
            </div>
          )}
        </div>
      </GlassCardContent>
    </GlassCard>
  );
}

function ServicesTab({ config, updateBusinessProfile, serviceLabel }: {
  config: BotConfig;
  updateBusinessProfile: (updates: Partial<BotConfig['businessProfile']>) => void;
  serviceLabel: string;
}) {
  return (
    <GlassCard>
      <GlassCardHeader>
        <GlassCardTitle>{serviceLabel}</GlassCardTitle>
        <GlassCardDescription>List all services offered</GlassCardDescription>
      </GlassCardHeader>
      <GlassCardContent>
        <div>
          <Label className="text-white/70">Services (one per line)</Label>
          <Textarea
            value={config.businessProfile.services?.join('\n') || ''}
            onChange={(e) => updateBusinessProfile({ services: e.target.value.split('\n').filter(s => s.trim()) })}
            className="bg-white/5 border-white/10 text-white mt-1 min-h-[200px]"
            placeholder="Enter each service on a new line"
            data-testid="input-services"
          />
        </div>
      </GlassCardContent>
    </GlassCard>
  );
}

function CrisisHandlingTab({ config, updateRules }: {
  config: BotConfig;
  updateRules: (updates: Partial<BotConfig['rules']>) => void;
}) {
  return (
    <GlassCard>
      <GlassCardHeader>
        <GlassCardTitle>Crisis Handling</GlassCardTitle>
        <GlassCardDescription>Configure how the bot responds to crisis situations</GlassCardDescription>
      </GlassCardHeader>
      <GlassCardContent>
        <div className="space-y-6">
          <div>
            <Label className="text-white/70">Crisis Keywords (one per line)</Label>
            <Textarea
              value={config.rules.crisisHandling.onCrisisKeywords.join('\n')}
              onChange={(e) => updateRules({ 
                crisisHandling: { 
                  ...config.rules.crisisHandling, 
                  onCrisisKeywords: e.target.value.split('\n').filter(k => k.trim()) 
                }
              })}
              className="bg-white/5 border-white/10 text-white mt-1 min-h-[150px]"
              placeholder="suicide&#10;overdose&#10;self-harm"
              data-testid="input-crisis-keywords"
            />
            <p className="text-white/40 text-xs mt-1">When these keywords are detected, the crisis response will be triggered.</p>
          </div>
          <div>
            <Label className="text-white/70">Crisis Response Template</Label>
            <Textarea
              value={config.rules.crisisHandling.responseTemplate}
              onChange={(e) => updateRules({ 
                crisisHandling: { 
                  ...config.rules.crisisHandling, 
                  responseTemplate: e.target.value 
                }
              })}
              className="bg-white/5 border-white/10 text-white mt-1 min-h-[200px]"
              placeholder="Enter the message that will be shown when crisis keywords are detected..."
              data-testid="input-crisis-response"
            />
          </div>
        </div>
      </GlassCardContent>
    </GlassCard>
  );
}

function WebsiteScraperTab({ botId, botConfig, updateConfig, updateBusinessProfile }: {
  botId: string;
  botConfig: BotConfig;
  updateConfig: (updates: Partial<BotConfig>) => void;
  updateBusinessProfile: (updates: Partial<BotConfig['businessProfile']>) => void;
}) {
  const { toast } = useToast();
  const [scrapeUrl, setScrapeUrl] = useState("");
  const [selectedScrape, setSelectedScrape] = useState<ScrapedWebsite | null>(null);

  const { data: scrapedWebsites, isLoading: scrapesLoading, refetch } = useQuery<ScrapedWebsite[]>({
    queryKey: ["/api/admin/scraped-websites", { botId }],
    queryFn: async () => {
      const response = await fetch(`/api/admin/scraped-websites?botId=${botId}`, { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch scraped websites");
      return response.json();
    },
  });

  const scrapeMutation = useMutation({
    mutationFn: async (url: string) => {
      const response = await apiRequest("POST", "/api/admin/scrape", { url, botId });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({ title: "Success!", description: "Website scraped and analyzed successfully." });
        refetch();
        setSelectedScrape(data.scrape);
        setScrapeUrl("");
      } else {
        toast({ title: "Partial Success", description: data.error || "Scrape completed with issues.", variant: "destructive" });
        refetch();
      }
    },
    onError: (error: Error) => {
      toast({ title: "Scrape Failed", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/admin/scraped-websites/${id}`);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Deleted", description: "Scrape record deleted." });
      refetch();
      setSelectedScrape(null);
    },
  });

  const handleScrape = () => {
    if (!scrapeUrl.trim()) {
      toast({ title: "Error", description: "Please enter a valid URL", variant: "destructive" });
      return;
    }
    scrapeMutation.mutate(scrapeUrl);
  };

  const applyToBot = (scrape: ScrapedWebsite) => {
    if (!scrape.extractedData) return;

    const data = scrape.extractedData;

    if (data.businessName) {
      updateBusinessProfile({ businessName: data.businessName });
    }
    if (data.description) {
      updateConfig({ description: data.description });
    }
    if (data.contactInfo) {
      const updates: Partial<BotConfig['businessProfile']> = {};
      if (data.contactInfo.phone) updates.phone = data.contactInfo.phone;
      if (data.contactInfo.email) updates.email = data.contactInfo.email;
      if (data.contactInfo.address) updates.location = data.contactInfo.address;
      if (data.contactInfo.hours) updates.hours = data.contactInfo.hours;
      updateBusinessProfile(updates);
    }
    if (data.services && data.services.length > 0) {
      updateBusinessProfile({ services: data.services.map(s => s.name) });
    }

    toast({ title: "Applied!", description: "Scraped data has been applied to the bot configuration. Don't forget to save!" });
  };

  return (
    <div className="space-y-6">
      <GlassCard>
        <GlassCardHeader>
          <GlassCardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5 text-purple-400" />
            Website Intelligence
          </GlassCardTitle>
          <GlassCardDescription>
            Scrape client websites to auto-extract business info, services, FAQs, and contact details
          </GlassCardDescription>
        </GlassCardHeader>
        <GlassCardContent>
          <div className="flex gap-3">
            <Input
              value={scrapeUrl}
              onChange={(e) => setScrapeUrl(e.target.value)}
              placeholder="https://example.com"
              className="bg-white/5 border-white/10 text-white flex-1"
              data-testid="input-scrape-url"
              onKeyDown={(e) => e.key === 'Enter' && handleScrape()}
            />
            <Button
              onClick={handleScrape}
              disabled={scrapeMutation.isPending}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 min-w-[140px]"
              data-testid="button-scrape"
            >
              {scrapeMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Scrape & Analyze
                </>
              )}
            </Button>
          </div>
        </GlassCardContent>
      </GlassCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GlassCard>
          <GlassCardHeader>
            <GlassCardTitle>Scraped Websites</GlassCardTitle>
            <GlassCardDescription>Previous scrapes for this bot</GlassCardDescription>
          </GlassCardHeader>
          <GlassCardContent>
            {scrapesLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-purple-400" />
              </div>
            ) : !scrapedWebsites?.length ? (
              <div className="text-center py-8 text-white/40">
                <Globe className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No websites scraped yet</p>
                <p className="text-sm">Enter a URL above to get started</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {scrapedWebsites.map((scrape) => (
                  <div
                    key={scrape.id}
                    onClick={() => setSelectedScrape(scrape)}
                    className={`p-4 rounded-lg border cursor-pointer transition-all ${
                      selectedScrape?.id === scrape.id
                        ? 'bg-purple-500/20 border-purple-400/50'
                        : 'bg-white/5 border-white/10 hover:bg-white/10'
                    }`}
                    data-testid={`scrape-item-${scrape.id}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {scrape.status === 'completed' && <Check className="h-4 w-4 text-green-400" />}
                          {scrape.status === 'processing' && <Loader2 className="h-4 w-4 text-yellow-400 animate-spin" />}
                          {scrape.status === 'failed' && <X className="h-4 w-4 text-red-400" />}
                          <span className="text-white font-medium truncate">
                            {scrape.pageTitle || scrape.domain}
                          </span>
                        </div>
                        <p className="text-white/55 text-sm truncate">{scrape.url}</p>
                        <p className="text-white/40 text-xs mt-1">
                          {new Date(scrape.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteMutation.mutate(scrape.id);
                        }}
                        className="text-white/40 hover:text-red-400"
                        data-testid={`button-delete-scrape-${scrape.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </GlassCardContent>
        </GlassCard>

        <GlassCard>
          <GlassCardHeader>
            <GlassCardTitle>Extracted Data Preview</GlassCardTitle>
            <GlassCardDescription>
              {selectedScrape ? 'Review and apply extracted data' : 'Select a scrape to preview'}
            </GlassCardDescription>
          </GlassCardHeader>
          <GlassCardContent>
            {!selectedScrape ? (
              <div className="text-center py-8 text-white/40">
                <Download className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Select a scraped website to preview</p>
              </div>
            ) : selectedScrape.status === 'failed' ? (
              <div className="text-center py-8 text-red-400">
                <AlertTriangle className="h-12 w-12 mx-auto mb-4" />
                <p className="font-medium">Scrape Failed</p>
                <p className="text-sm text-white/55 mt-2">{selectedScrape.errorMessage}</p>
              </div>
            ) : !selectedScrape.extractedData ? (
              <div className="text-center py-8 text-white/40">
                <Loader2 className="h-12 w-12 mx-auto mb-4 animate-spin" />
                <p>Processing...</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[400px] overflow-y-auto">
                {selectedScrape.extractedData.businessName && (
                  <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                    <Label className="text-white/55 text-xs uppercase">Business Name</Label>
                    <p className="text-white font-medium">{selectedScrape.extractedData.businessName}</p>
                  </div>
                )}
                
                {selectedScrape.extractedData.description && (
                  <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                    <Label className="text-white/55 text-xs uppercase">Description</Label>
                    <p className="text-white/80 text-sm">{selectedScrape.extractedData.description}</p>
                  </div>
                )}

                {selectedScrape.extractedData.services && selectedScrape.extractedData.services.length > 0 && (
                  <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                    <Label className="text-white/55 text-xs uppercase">Services ({selectedScrape.extractedData.services.length})</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedScrape.extractedData.services.slice(0, 6).map((s, i) => (
                        <span key={i} className="px-2 py-1 rounded bg-purple-500/20 text-purple-300 text-xs">
                          {s.name}
                        </span>
                      ))}
                      {selectedScrape.extractedData.services.length > 6 && (
                        <span className="px-2 py-1 text-white/40 text-xs">
                          +{selectedScrape.extractedData.services.length - 6} more
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {selectedScrape.extractedData.contactInfo && (
                  <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                    <Label className="text-white/55 text-xs uppercase">Contact Info</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                      {selectedScrape.extractedData.contactInfo.phone && (
                        <div className="flex items-center gap-2 text-white/80">
                          <Phone className="h-3 w-3" />
                          {selectedScrape.extractedData.contactInfo.phone}
                        </div>
                      )}
                      {selectedScrape.extractedData.contactInfo.email && (
                        <div className="flex items-center gap-2 text-white/80">
                          <Mail className="h-3 w-3" />
                          {selectedScrape.extractedData.contactInfo.email}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {selectedScrape.extractedData.faqs && selectedScrape.extractedData.faqs.length > 0 && (
                  <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                    <Label className="text-white/55 text-xs uppercase">FAQs Found ({selectedScrape.extractedData.faqs.length})</Label>
                    <p className="text-white/60 text-sm mt-1">
                      {selectedScrape.extractedData.faqs[0].question.substring(0, 60)}...
                    </p>
                  </div>
                )}

                <Button
                  onClick={() => applyToBot(selectedScrape)}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                  data-testid="button-apply-scrape"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Apply to Bot Configuration
                </Button>
              </div>
            )}
          </GlassCardContent>
        </GlassCard>
      </div>
    </div>
  );
}

interface BotStats {
  totalConversations: number;
  totalMessages: number;
  leadsCollected: number;
  bookingsInitiated: number;
  avgResponseTime: number;
  satisfactionRate: number;
}

function BotOverviewTab({ botId, botConfig }: { botId: string; botConfig: BotConfig }) {
  const { data: stats, isLoading } = useQuery<BotStats>({
    queryKey: ["/api/admin/bot-stats", botId],
    queryFn: async () => {
      const response = await fetch(`/api/admin/bot-stats?botId=${botId}`, { credentials: "include" });
      if (!response.ok) {
        return {
          totalConversations: 0,
          totalMessages: 0,
          leadsCollected: 0,
          bookingsInitiated: 0,
          avgResponseTime: 0,
          satisfactionRate: 0,
        };
      }
      return response.json();
    },
  });

  const statCards = [
    { 
      label: "Conversations", 
      value: stats?.totalConversations || 0, 
      icon: MessageSquare, 
      color: "cyan",
      gradient: "from-cyan-500/20 to-blue-500/20",
      borderColor: "border-cyan-400/30"
    },
    { 
      label: "Messages", 
      value: stats?.totalMessages || 0, 
      icon: Send, 
      color: "purple",
      gradient: "from-purple-500/20 to-pink-500/20",
      borderColor: "border-purple-400/30"
    },
    { 
      label: "Leads Collected", 
      value: stats?.leadsCollected || 0, 
      icon: Users, 
      color: "green",
      gradient: "from-green-500/20 to-emerald-500/20",
      borderColor: "border-green-400/30"
    },
    { 
      label: "Bookings", 
      value: stats?.bookingsInitiated || 0, 
      icon: Calendar, 
      color: "yellow",
      gradient: "from-yellow-500/20 to-orange-500/20",
      borderColor: "border-yellow-400/30"
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <GlassCard key={stat.label}>
            <GlassCardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/55 text-sm">{stat.label}</p>
                  <p className="text-3xl font-bold text-white mt-1" data-testid={`stat-${stat.label.toLowerCase().replace(' ', '-')}`}>
                    {isLoading ? "-" : stat.value.toLocaleString()}
                  </p>
                </div>
                <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.gradient} border ${stat.borderColor}`}>
                  <stat.icon className={`h-6 w-6 text-${stat.color}-400`} />
                </div>
              </div>
            </GlassCardContent>
          </GlassCard>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GlassCard>
          <GlassCardHeader>
            <GlassCardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-cyan-400" />
              Bot Configuration Summary
            </GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                <span className="text-white/70">Business Name</span>
                <span className="text-white font-medium">{botConfig.businessProfile.businessName}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                <span className="text-white/70">Business Type</span>
                <NeonBadge variant="default" className="capitalize">
                  {botConfig.businessProfile.type.replace('_', ' ')}
                </NeonBadge>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                <span className="text-white/70">FAQs Configured</span>
                <span className="text-white font-medium">{botConfig.faqs?.length || 0}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                <span className="text-white/70">System Prompt Length</span>
                <span className="text-white font-medium">{botConfig.systemPrompt?.length || 0} chars</span>
              </div>
            </div>
          </GlassCardContent>
        </GlassCard>

        <GlassCard>
          <GlassCardHeader>
            <GlassCardTitle className="flex items-center gap-2">
              <Code2 className="h-5 w-5 text-purple-400" />
              Quick Actions
            </GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent>
            <div className="space-y-3">
              <Button 
                variant="outline" 
                className="w-full justify-start text-left"
                onClick={() => window.open(`/demo/${botId}`, '_blank')}
                data-testid="button-preview-widget"
              >
                <Eye className="h-4 w-4 mr-3 text-cyan-400" />
                Preview Widget
                <ExternalLink className="h-3 w-3 ml-auto text-white/40" />
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start text-left"
                data-testid="button-view-conversations"
              >
                <MessageSquare className="h-4 w-4 mr-3 text-green-400" />
                View Conversations
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start text-left"
                data-testid="button-view-leads"
              >
                <Users className="h-4 w-4 mr-3 text-purple-400" />
                View Leads
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start text-left"
                data-testid="button-get-embed-code"
              >
                <Code2 className="h-4 w-4 mr-3 text-yellow-400" />
                Get Embed Code
              </Button>
            </div>
          </GlassCardContent>
        </GlassCard>
      </div>
    </div>
  );
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

function TestChatTab({ botId, botConfig }: { botId: string; botConfig: BotConfig }) {
  const { toast } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId] = useState(`test-session-${Date.now()}`);

  const sendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date(),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputValue("");
    setIsTyping(true);

    try {
      const apiMessages = updatedMessages.map(m => ({
        role: m.role,
        content: m.content,
      }));

      const response = await fetch(`/api/chat/${botConfig.clientId}/${botId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ 
          messages: apiMessages,
          sessionId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to get response');
      }

      const data = await response.json();
      
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.reply || data.response || data.message || "I'm sorry, I couldn't generate a response.",
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error: any) {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to send message. Check API configuration.",
        variant: "destructive" 
      });
    } finally {
      setIsTyping(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <GlassCard className="h-[600px] flex flex-col">
          <GlassCardHeader className="flex-shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <GlassCardTitle className="flex items-center gap-2">
                  <Bot className="h-5 w-5 text-green-400" />
                  Test Chat
                </GlassCardTitle>
                <GlassCardDescription>
                  Preview how your bot responds to user messages
                </GlassCardDescription>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={clearChat}
                data-testid="button-clear-chat"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Clear
              </Button>
            </div>
          </GlassCardHeader>
          <GlassCardContent className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center text-white/40">
                  <Bot className="h-16 w-16 mb-4 opacity-50" />
                  <p className="text-lg font-medium">Start a conversation</p>
                  <p className="text-sm">Type a message below to test your bot</p>
                </div>
              ) : (
                messages.map((msg) => (
                  <div 
                    key={msg.id}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    data-testid={`message-${msg.role}-${msg.id}`}
                  >
                    <div className={`max-w-[80%] p-4 rounded-2xl ${
                      msg.role === 'user'
                        ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white'
                        : 'bg-white/10 border border-white/10 text-white'
                    }`}>
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      <p className={`text-xs mt-2 ${msg.role === 'user' ? 'text-white/70' : 'text-white/40'}`}>
                        {msg.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white/10 border border-white/10 p-4 rounded-2xl">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="flex gap-3 flex-shrink-0">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                placeholder="Type a message..."
                className="bg-white/5 border-white/10 text-white flex-1"
                data-testid="input-test-message"
              />
              <Button 
                onClick={sendMessage}
                disabled={isTyping || !inputValue.trim()}
                className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                data-testid="button-send-test"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </GlassCardContent>
        </GlassCard>
      </div>

      <div className="space-y-6">
        <GlassCard>
          <GlassCardHeader>
            <GlassCardTitle className="text-sm">Bot Context</GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-white/55">Business</p>
                <p className="text-white font-medium">{botConfig.businessProfile.businessName}</p>
              </div>
              <div>
                <p className="text-white/55">Type</p>
                <p className="text-white capitalize">{botConfig.businessProfile.type.replace('_', ' ')}</p>
              </div>
              <div>
                <p className="text-white/55">FAQs Available</p>
                <p className="text-white">{botConfig.faqs?.length || 0} Q&A pairs</p>
              </div>
            </div>
          </GlassCardContent>
        </GlassCard>

        <GlassCard>
          <GlassCardHeader>
            <GlassCardTitle className="text-sm">Test Suggestions</GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent>
            <div className="space-y-2">
              {[
                "What are your hours?",
                "How can I contact you?",
                "What services do you offer?",
                "I'd like to book an appointment",
              ].map((suggestion) => (
                <Button
                  key={suggestion}
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-left text-white/70 hover:text-white"
                  onClick={() => setInputValue(suggestion)}
                  data-testid={`suggestion-${suggestion.replace(/[^a-z0-9]/gi, '-').toLowerCase()}`}
                >
                  {suggestion}
                </Button>
              ))}
            </div>
          </GlassCardContent>
        </GlassCard>
      </div>
    </div>
  );
}

function AutomationsTab({ config, updateConfig }: {
  config: BotConfig;
  updateConfig: (updates: Partial<BotConfig>) => void;
}) {
  const { toast } = useToast();
  const [newKeywords, setNewKeywords] = useState("");
  const [newResponse, setNewResponse] = useState("");

  const automations = config.automations || [];

  const addAutomation = () => {
    if (!newKeywords.trim() || !newResponse.trim()) {
      toast({ 
        title: "Error", 
        description: "Please enter both keywords and a response.", 
        variant: "destructive" 
      });
      return;
    }

    const keywords = newKeywords.split(',').map(k => k.trim()).filter(k => k);
    if (keywords.length === 0) {
      toast({ 
        title: "Error", 
        description: "Please enter at least one keyword.", 
        variant: "destructive" 
      });
      return;
    }

    const newAutomation: KeywordAutomation = {
      id: Date.now().toString(),
      keywords,
      response: newResponse.trim(),
      enabled: true,
    };

    updateConfig({ automations: [...automations, newAutomation] });
    setNewKeywords("");
    setNewResponse("");
    toast({ title: "Success", description: "Automation added. Don't forget to save!" });
  };

  const toggleAutomation = (id: string) => {
    updateConfig({
      automations: automations.map(a => 
        a.id === id ? { ...a, enabled: !a.enabled } : a
      )
    });
  };

  const removeAutomation = (id: string) => {
    updateConfig({
      automations: automations.filter(a => a.id !== id)
    });
    toast({ title: "Removed", description: "Automation removed. Don't forget to save!" });
  };

  return (
    <div className="space-y-6">
      <GlassCard>
        <GlassCardHeader>
          <GlassCardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-amber-400" />
            Keyword Automations
          </GlassCardTitle>
          <GlassCardDescription>
            Create instant responses triggered by specific keywords. When a user message contains any of these keywords, the bot will respond with the configured message.
          </GlassCardDescription>
        </GlassCardHeader>
        <GlassCardContent>
          <div className="space-y-6">
            <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-400/20">
              <h4 className="text-white font-medium mb-4 flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add New Automation
              </h4>
              <div className="space-y-4">
                <div>
                  <Label className="text-white/70">Trigger Keywords</Label>
                  <Input
                    value={newKeywords}
                    onChange={(e) => setNewKeywords(e.target.value)}
                    placeholder="pricing, cost, how much (comma-separated)"
                    className="bg-white/5 border-white/10 text-white mt-1"
                    data-testid="input-automation-keywords"
                  />
                  <p className="text-white/40 text-xs mt-1">Enter keywords separated by commas. Message containing any keyword will trigger this automation.</p>
                </div>
                <div>
                  <Label className="text-white/70">Bot Response</Label>
                  <Textarea
                    value={newResponse}
                    onChange={(e) => setNewResponse(e.target.value)}
                    placeholder="Our pricing starts at $99/month. Would you like more details?"
                    className="bg-white/5 border-white/10 text-white mt-1 min-h-[100px]"
                    data-testid="input-automation-response"
                  />
                </div>
                <Button 
                  onClick={addAutomation}
                  className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                  data-testid="button-add-automation"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Automation
                </Button>
              </div>
            </div>

            <div>
              <h4 className="text-white font-medium mb-4">Active Automations</h4>
              {automations.length === 0 ? (
                <div className="text-center py-8 text-white/40 bg-white/5 rounded-lg border border-white/10">
                  <Zap className="h-12 w-12 mx-auto mb-3 opacity-40" />
                  <p>No automations configured yet.</p>
                  <p className="text-sm">Add keyword triggers above to automate common responses.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {automations.map((automation) => (
                    <div 
                      key={automation.id}
                      className={`p-4 rounded-lg border ${
                        automation.enabled 
                          ? 'bg-white/5 border-white/10' 
                          : 'bg-white/2 border-white/5 opacity-60'
                      }`}
                      data-testid={`automation-${automation.id}`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Switch
                              checked={automation.enabled}
                              onCheckedChange={() => toggleAutomation(automation.id)}
                              data-testid={`switch-automation-${automation.id}`}
                            />
                            <span className={`text-sm ${automation.enabled ? 'text-green-400' : 'text-white/40'}`}>
                              {automation.enabled ? 'Active' : 'Disabled'}
                            </span>
                          </div>
                          <div className="mb-2">
                            <p className="text-white/55 text-xs mb-1">Keywords:</p>
                            <div className="flex flex-wrap gap-1">
                              {automation.keywords.map((keyword, i) => (
                                <span 
                                  key={i}
                                  className="px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-400 text-xs"
                                >
                                  {keyword}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div>
                            <p className="text-white/55 text-xs mb-1">Response:</p>
                            <p className="text-white text-sm">{automation.response}</p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeAutomation(automation.id)}
                          className="text-red-400 hover:text-red-300 hover:bg-red-400/10 flex-shrink-0"
                          data-testid={`button-remove-automation-${automation.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </GlassCardContent>
      </GlassCard>

      <GlassCard>
        <GlassCardHeader>
          <GlassCardTitle className="text-sm">How Automations Work</GlassCardTitle>
        </GlassCardHeader>
        <GlassCardContent>
          <div className="space-y-3 text-sm text-white/70">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-amber-400/20 flex items-center justify-center flex-shrink-0">
                <span className="text-amber-400 text-xs font-bold">1</span>
              </div>
              <p>User sends a message containing one of your trigger keywords</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-amber-400/20 flex items-center justify-center flex-shrink-0">
                <span className="text-amber-400 text-xs font-bold">2</span>
              </div>
              <p>Bot immediately responds with your configured response</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-amber-400/20 flex items-center justify-center flex-shrink-0">
                <span className="text-amber-400 text-xs font-bold">3</span>
              </div>
              <p>Conversation continues naturally with AI handling follow-ups</p>
            </div>
          </div>
        </GlassCardContent>
      </GlassCard>
    </div>
  );
}

function NotificationsTab({ config, updateConfig }: {
  config: BotConfig;
  updateConfig: (updates: Partial<BotConfig>) => void;
}) {
  const { toast } = useToast();
  
  const notifications = config.notifications || {
    enabled: true,
    emailNotifications: true,
    notifyOnNewLead: true,
    notifyOnBooking: true,
    notifyOnCrisis: true,
    dailySummary: false,
    notificationEmail: config.businessProfile.email || '',
  };

  const updateNotifications = (updates: Partial<typeof notifications>) => {
    updateConfig({ 
      notifications: { ...notifications, ...updates } 
    });
    toast({ title: "Updated", description: "Notification settings updated. Don't forget to save!" });
  };

  return (
    <div className="space-y-6">
      <GlassCard>
        <GlassCardHeader>
          <GlassCardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-pink-400" />
            Notification Settings
          </GlassCardTitle>
          <GlassCardDescription>
            Configure how and when you receive alerts about this bot's activity
          </GlassCardDescription>
        </GlassCardHeader>
        <GlassCardContent>
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/10">
              <div className="flex items-center gap-3">
                <Bell className="h-5 w-5 text-white/60" />
                <div>
                  <p className="text-white font-medium">Enable Notifications</p>
                  <p className="text-sm text-white/50">Master switch for all notifications</p>
                </div>
              </div>
              <Switch
                checked={notifications.enabled}
                onCheckedChange={(checked) => updateNotifications({ enabled: checked })}
                data-testid="switch-notifications-master"
              />
            </div>

            <div className="space-y-4 opacity-100" style={{ opacity: notifications.enabled ? 1 : 0.5 }}>
              <div>
                <Label className="text-white/70">Notification Email</Label>
                <Input
                  value={notifications.notificationEmail}
                  onChange={(e) => updateNotifications({ notificationEmail: e.target.value })}
                  placeholder="alerts@business.com"
                  className="bg-white/5 border-white/10 text-white mt-1"
                  disabled={!notifications.enabled}
                  data-testid="input-notification-email"
                />
                <p className="text-white/40 text-xs mt-1">Email address to receive notifications</p>
              </div>

              <div className="space-y-3">
                <p className="text-white/70 font-medium">Alert Types</p>
                
                <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
                  <div className="flex items-center gap-3">
                    <Users className="h-4 w-4 text-green-400" />
                    <div>
                      <p className="text-white text-sm">New Lead Captured</p>
                      <p className="text-xs text-white/40">When someone shares contact info</p>
                    </div>
                  </div>
                  <Switch
                    checked={notifications.notifyOnNewLead}
                    onCheckedChange={(checked) => updateNotifications({ notifyOnNewLead: checked })}
                    disabled={!notifications.enabled}
                    data-testid="switch-notify-lead"
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-purple-400" />
                    <div>
                      <p className="text-white text-sm">Booking Request</p>
                      <p className="text-xs text-white/40">When someone requests an appointment</p>
                    </div>
                  </div>
                  <Switch
                    checked={notifications.notifyOnBooking}
                    onCheckedChange={(checked) => updateNotifications({ notifyOnBooking: checked })}
                    disabled={!notifications.enabled}
                    data-testid="switch-notify-booking"
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="h-4 w-4 text-red-400" />
                    <div>
                      <p className="text-white text-sm">Crisis Detected</p>
                      <p className="text-xs text-white/40">When urgent/sensitive issues are flagged</p>
                    </div>
                  </div>
                  <Switch
                    checked={notifications.notifyOnCrisis}
                    onCheckedChange={(checked) => updateNotifications({ notifyOnCrisis: checked })}
                    disabled={!notifications.enabled}
                    data-testid="switch-notify-crisis"
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
                  <div className="flex items-center gap-3">
                    <BarChart3 className="h-4 w-4 text-cyan-400" />
                    <div>
                      <p className="text-white text-sm">Daily Summary</p>
                      <p className="text-xs text-white/40">Daily report of bot activity</p>
                    </div>
                  </div>
                  <Switch
                    checked={notifications.dailySummary}
                    onCheckedChange={(checked) => updateNotifications({ dailySummary: checked })}
                    disabled={!notifications.enabled}
                    data-testid="switch-daily-summary"
                  />
                </div>
              </div>
            </div>
          </div>
        </GlassCardContent>
      </GlassCard>

      <GlassCard>
        <GlassCardHeader>
          <GlassCardTitle className="text-sm">About Notifications</GlassCardTitle>
        </GlassCardHeader>
        <GlassCardContent>
          <div className="space-y-3 text-sm text-white/70">
            <p>Notifications help you stay on top of important bot activity without constantly checking the dashboard.</p>
            <ul className="list-disc list-inside space-y-1 text-white/60">
              <li>New Lead: Get alerted when a visitor shares their contact info</li>
              <li>Booking: Know immediately when someone wants to schedule</li>
              <li>Crisis: Be notified of urgent issues requiring human attention</li>
              <li>Daily Summary: Get a quick overview of the day's conversations</li>
            </ul>
          </div>
        </GlassCardContent>
      </GlassCard>
    </div>
  );
}

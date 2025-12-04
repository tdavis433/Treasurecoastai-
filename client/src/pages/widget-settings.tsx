import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save, Eye, Paintbrush, Layout, Bell, Settings2, Code } from "lucide-react";

interface WidgetSettings {
  id?: string;
  botId: string;
  themeMode: 'light' | 'dark' | 'auto';
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  headerBackgroundColor: string;
  textColor: string;
  textMutedColor: string;
  userMessageColor: string;
  userMessageTextColor: string;
  botMessageColor: string;
  botMessageTextColor: string;
  inputBackgroundColor: string;
  inputTextColor: string;
  position: 'bottom-right' | 'bottom-left';
  avatarUrl: string | null;
  showAvatar: boolean;
  greeting: string | null;
  placeholder: string | null;
  headerTitle: string | null;
  headerSubtitle: string | null;
  showPoweredBy: boolean;
  autoOpenEnabled: boolean;
  autoOpenDelay: number;
  notificationSoundEnabled: boolean;
  notificationSoundType: string | null;
  mobileEnabled: boolean;
  mobileFullscreen: boolean;
  keyboardNavEnabled: boolean;
  ariaLabelsEnabled: boolean;
  borderRadius: number;
  shadowIntensity: 'none' | 'soft' | 'medium' | 'strong';
  fontFamily: 'system' | 'Inter' | 'Roboto' | 'Nunito';
  fontSize: 'sm' | 'md' | 'lg';
  launcherIconStyle: 'chat-bubble' | 'robot' | 'message';
  showLauncherLabel: boolean;
  launcherLabel: string | null;
}

const defaultSettings: Omit<WidgetSettings, 'id' | 'botId'> = {
  themeMode: 'dark',
  primaryColor: '#00E5CC',
  secondaryColor: '#A855F7',
  backgroundColor: '#0A0A0F',
  headerBackgroundColor: '#0F1520',
  textColor: '#F8FAFC',
  textMutedColor: '#94A3B8',
  userMessageColor: '#00E5CC',
  userMessageTextColor: '#FFFFFF',
  botMessageColor: '#151B28',
  botMessageTextColor: '#F8FAFC',
  inputBackgroundColor: '#0F1520',
  inputTextColor: '#F8FAFC',
  position: 'bottom-right',
  avatarUrl: null,
  showAvatar: true,
  greeting: 'Hi! How can I help you today?',
  placeholder: 'Type your message...',
  headerTitle: null,
  headerSubtitle: 'Online',
  showPoweredBy: true,
  autoOpenEnabled: false,
  autoOpenDelay: 5,
  notificationSoundEnabled: false,
  notificationSoundType: 'default',
  mobileEnabled: true,
  mobileFullscreen: true,
  keyboardNavEnabled: true,
  ariaLabelsEnabled: true,
  borderRadius: 16,
  shadowIntensity: 'medium',
  fontFamily: 'system',
  fontSize: 'md',
  launcherIconStyle: 'chat-bubble',
  showLauncherLabel: false,
  launcherLabel: 'Chat with us',
};

const colorPresets = [
  {
    name: 'Midnight Cyan',
    colors: {
      primaryColor: '#00E5CC',
      secondaryColor: '#A855F7',
      backgroundColor: '#0A0A0F',
      headerBackgroundColor: '#0F1520',
      textColor: '#F8FAFC',
      textMutedColor: '#94A3B8',
      userMessageColor: '#00E5CC',
      userMessageTextColor: '#FFFFFF',
      botMessageColor: '#151B28',
      botMessageTextColor: '#F8FAFC',
      inputBackgroundColor: '#0F1520',
      inputTextColor: '#F8FAFC',
    }
  },
  {
    name: 'Royal Purple',
    colors: {
      primaryColor: '#8B5CF6',
      secondaryColor: '#EC4899',
      backgroundColor: '#0F0A1E',
      headerBackgroundColor: '#1A1333',
      textColor: '#F8FAFC',
      textMutedColor: '#A1A1AA',
      userMessageColor: '#8B5CF6',
      userMessageTextColor: '#FFFFFF',
      botMessageColor: '#1E1433',
      botMessageTextColor: '#F8FAFC',
      inputBackgroundColor: '#1A1333',
      inputTextColor: '#F8FAFC',
    }
  },
  {
    name: 'Ocean Blue',
    colors: {
      primaryColor: '#3B82F6',
      secondaryColor: '#06B6D4',
      backgroundColor: '#0A1628',
      headerBackgroundColor: '#0F2140',
      textColor: '#F8FAFC',
      textMutedColor: '#94A3B8',
      userMessageColor: '#3B82F6',
      userMessageTextColor: '#FFFFFF',
      botMessageColor: '#122444',
      botMessageTextColor: '#F8FAFC',
      inputBackgroundColor: '#0F2140',
      inputTextColor: '#F8FAFC',
    }
  },
  {
    name: 'Clean Light',
    colors: {
      primaryColor: '#3B82F6',
      secondaryColor: '#10B981',
      backgroundColor: '#FFFFFF',
      headerBackgroundColor: '#F8FAFC',
      textColor: '#1E293B',
      textMutedColor: '#64748B',
      userMessageColor: '#3B82F6',
      userMessageTextColor: '#FFFFFF',
      botMessageColor: '#F1F5F9',
      botMessageTextColor: '#1E293B',
      inputBackgroundColor: '#FFFFFF',
      inputTextColor: '#1E293B',
    }
  },
  {
    name: 'Forest Green',
    colors: {
      primaryColor: '#10B981',
      secondaryColor: '#84CC16',
      backgroundColor: '#0A1410',
      headerBackgroundColor: '#0F1D18',
      textColor: '#F8FAFC',
      textMutedColor: '#94A3B8',
      userMessageColor: '#10B981',
      userMessageTextColor: '#FFFFFF',
      botMessageColor: '#132820',
      botMessageTextColor: '#F8FAFC',
      inputBackgroundColor: '#0F1D18',
      inputTextColor: '#F8FAFC',
    }
  },
  {
    name: 'Rose Gold',
    colors: {
      primaryColor: '#F43F5E',
      secondaryColor: '#F59E0B',
      backgroundColor: '#1A0A0F',
      headerBackgroundColor: '#2A0F18',
      textColor: '#F8FAFC',
      textMutedColor: '#A1A1AA',
      userMessageColor: '#F43F5E',
      userMessageTextColor: '#FFFFFF',
      botMessageColor: '#2A1420',
      botMessageTextColor: '#F8FAFC',
      inputBackgroundColor: '#2A0F18',
      inputTextColor: '#F8FAFC',
    }
  },
];

const fontFamilies = [
  { value: 'system', label: 'System Default' },
  { value: 'Inter', label: 'Inter' },
  { value: 'Roboto', label: 'Roboto' },
  { value: 'Nunito', label: 'Nunito' },
];

const fontSizes = [
  { value: 'sm', label: 'Small' },
  { value: 'md', label: 'Medium' },
  { value: 'lg', label: 'Large' },
];

const launcherIcons = [
  { value: 'chat-bubble', label: 'Chat Bubble' },
  { value: 'robot', label: 'Robot' },
  { value: 'message', label: 'Message' },
];

const shadowIntensities = [
  { value: 'none', label: 'None' },
  { value: 'soft', label: 'Soft' },
  { value: 'medium', label: 'Medium' },
  { value: 'strong', label: 'Strong' },
];

interface CurrentUser {
  id: string;
  username: string;
  role: 'super_admin' | 'client_admin';
}

export default function WidgetSettingsPage() {
  const { botId } = useParams<{ botId: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [settings, setSettings] = useState<Omit<WidgetSettings, 'id' | 'botId'>>(defaultSettings);
  const [activeTab, setActiveTab] = useState('appearance');
  const [colorSection, setColorSection] = useState<'presets' | 'custom'>('presets');
  const [previewKey, setPreviewKey] = useState(0);
  const [hasShownAccessDenied, setHasShownAccessDenied] = useState(false);

  const { data: currentUser, isLoading: authLoading } = useQuery<CurrentUser>({
    queryKey: ['/api/auth/me'],
  });

  const isAuthorized = currentUser?.role === 'super_admin';

  useEffect(() => {
    if (authLoading) return;
    
    if (!currentUser) {
      setLocation('/login');
    } else if (!isAuthorized && !hasShownAccessDenied) {
      setHasShownAccessDenied(true);
      toast({
        title: "Access Denied",
        description: "You don't have permission to access this page.",
        variant: "destructive",
      });
      setLocation('/client/dashboard');
    }
  }, [currentUser, authLoading, isAuthorized, hasShownAccessDenied, setLocation, toast]);

  const { data, isLoading } = useQuery<{ settings: WidgetSettings }>({
    queryKey: ['/api/bots', botId, 'widget-settings'],
    enabled: !!botId && isAuthorized,
  });

  const { data: botData } = useQuery<{ bot: { name: string; businessProfile?: { businessName?: string } } }>({
    queryKey: ['/api/bots', botId],
    enabled: !!botId && isAuthorized,
  });

  useEffect(() => {
    if (data?.settings) {
      const { id, botId: _, theme, ...rest } = data.settings as any;
      setSettings({ 
        ...defaultSettings, 
        ...rest,
        themeMode: theme || defaultSettings.themeMode,
      });
    }
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: (settingsData: Omit<WidgetSettings, 'id' | 'botId'>) => {
      const { themeMode, ...rest } = settingsData;
      const apiData = {
        ...rest,
        theme: themeMode,
      };
      return apiRequest('PUT', `/api/bots/${botId}/widget-settings`, apiData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bots', botId, 'widget-settings'] });
      toast({ title: "Settings saved", description: "Widget settings have been updated." });
      setPreviewKey(prev => prev + 1);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to save widget settings.", variant: "destructive" });
    },
  });

  const handleSave = () => {
    saveMutation.mutate(settings);
  };

  const updateSetting = <K extends keyof typeof settings>(key: K, value: typeof settings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const applyPreset = (preset: typeof colorPresets[0]) => {
    setSettings(prev => ({ ...prev, ...preset.colors }));
    toast({ title: "Preset applied", description: `Applied "${preset.name}" color scheme.` });
  };

  const getEmbedCode = () => {
    const baseUrl = window.location.origin;
    return `<script
  src="${baseUrl}/widget/embed.js"
  data-client-id="YOUR_CLIENT_ID"
  data-bot-id="${botId}"
  data-token="YOUR_WIDGET_TOKEN"
  async>
</script>`;
  };

  const copyEmbedCode = () => {
    navigator.clipboard.writeText(getEmbedCode());
    toast({ title: "Copied!", description: "Embed code copied to clipboard." });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const businessName = botData?.bot?.businessProfile?.businessName || botData?.bot?.name || 'Chat Assistant';

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between gap-4 px-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation(`/admin/bot/${botId}`)}
              data-testid="button-back"
              aria-label="Go back"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-lg font-semibold">Widget Settings</h1>
              <p className="text-sm text-muted-foreground">{businessName}</p>
            </div>
          </div>
          <Button onClick={handleSave} disabled={saveMutation.isPending} data-testid="button-save">
            <Save className="h-4 w-4 mr-2" />
            {saveMutation.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </header>

      <main className="container py-6 px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="appearance" data-testid="tab-appearance">
                  <Paintbrush className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Appearance</span>
                </TabsTrigger>
                <TabsTrigger value="behavior" data-testid="tab-behavior">
                  <Settings2 className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Behavior</span>
                </TabsTrigger>
                <TabsTrigger value="sounds" data-testid="tab-sounds">
                  <Bell className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Sounds</span>
                </TabsTrigger>
                <TabsTrigger value="embed" data-testid="tab-embed">
                  <Code className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Embed</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="appearance" className="mt-6 space-y-6">
                {/* Color Scheme Section */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2">
                      <Paintbrush className="h-4 w-4" />
                      Color Scheme
                    </CardTitle>
                    <CardDescription>Choose a preset or customize colors</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Preset/Custom Toggle */}
                    <div className="flex gap-2 mb-4">
                      <Button
                        variant={colorSection === 'presets' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setColorSection('presets')}
                        data-testid="button-presets"
                      >
                        Color Presets
                      </Button>
                      <Button
                        variant={colorSection === 'custom' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setColorSection('custom')}
                        data-testid="button-custom-colors"
                      >
                        Custom Colors
                      </Button>
                    </div>

                    {colorSection === 'presets' && (
                      <div className="grid grid-cols-2 gap-3">
                        {colorPresets.map((preset) => (
                          <button
                            key={preset.name}
                            onClick={() => applyPreset(preset)}
                            className="p-3 rounded-lg border hover:border-primary transition-colors text-left"
                            style={{ backgroundColor: preset.colors.backgroundColor }}
                            data-testid={`preset-${preset.name.toLowerCase().replace(' ', '-')}`}
                          >
                            <div className="flex items-center gap-2 mb-2">
                              <div
                                className="w-4 h-4 rounded-full"
                                style={{ backgroundColor: preset.colors.primaryColor }}
                              />
                              <div
                                className="w-4 h-4 rounded-full"
                                style={{ backgroundColor: preset.colors.secondaryColor }}
                              />
                            </div>
                            <span
                              className="text-sm font-medium"
                              style={{ color: preset.colors.textColor }}
                            >
                              {preset.name}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}

                    {colorSection === 'custom' && (
                      <div className="space-y-4">
                        {/* Primary & Secondary Colors */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Primary Color</Label>
                            <div className="flex gap-2">
                              <Input
                                type="color"
                                value={settings.primaryColor}
                                onChange={(e) => updateSetting('primaryColor', e.target.value)}
                                className="w-12 h-9 p-1 cursor-pointer"
                                data-testid="input-primary-color"
                              />
                              <Input
                                value={settings.primaryColor}
                                onChange={(e) => updateSetting('primaryColor', e.target.value)}
                                className="flex-1 font-mono text-xs"
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Secondary Color</Label>
                            <div className="flex gap-2">
                              <Input
                                type="color"
                                value={settings.secondaryColor}
                                onChange={(e) => updateSetting('secondaryColor', e.target.value)}
                                className="w-12 h-9 p-1 cursor-pointer"
                                data-testid="input-secondary-color"
                              />
                              <Input
                                value={settings.secondaryColor}
                                onChange={(e) => updateSetting('secondaryColor', e.target.value)}
                                className="flex-1 font-mono text-xs"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Background Colors */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Background</Label>
                            <div className="flex gap-2">
                              <Input
                                type="color"
                                value={settings.backgroundColor}
                                onChange={(e) => updateSetting('backgroundColor', e.target.value)}
                                className="w-12 h-9 p-1 cursor-pointer"
                                data-testid="input-background-color"
                              />
                              <Input
                                value={settings.backgroundColor}
                                onChange={(e) => updateSetting('backgroundColor', e.target.value)}
                                className="flex-1 font-mono text-xs"
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Header Background</Label>
                            <div className="flex gap-2">
                              <Input
                                type="color"
                                value={settings.headerBackgroundColor}
                                onChange={(e) => updateSetting('headerBackgroundColor', e.target.value)}
                                className="w-12 h-9 p-1 cursor-pointer"
                                data-testid="input-header-bg-color"
                              />
                              <Input
                                value={settings.headerBackgroundColor}
                                onChange={(e) => updateSetting('headerBackgroundColor', e.target.value)}
                                className="flex-1 font-mono text-xs"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Text Colors */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Text Color</Label>
                            <div className="flex gap-2">
                              <Input
                                type="color"
                                value={settings.textColor}
                                onChange={(e) => updateSetting('textColor', e.target.value)}
                                className="w-12 h-9 p-1 cursor-pointer"
                                data-testid="input-text-color"
                              />
                              <Input
                                value={settings.textColor}
                                onChange={(e) => updateSetting('textColor', e.target.value)}
                                className="flex-1 font-mono text-xs"
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Muted Text</Label>
                            <div className="flex gap-2">
                              <Input
                                type="color"
                                value={settings.textMutedColor}
                                onChange={(e) => updateSetting('textMutedColor', e.target.value)}
                                className="w-12 h-9 p-1 cursor-pointer"
                                data-testid="input-muted-color"
                              />
                              <Input
                                value={settings.textMutedColor}
                                onChange={(e) => updateSetting('textMutedColor', e.target.value)}
                                className="flex-1 font-mono text-xs"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Message Bubble Colors */}
                        <div className="pt-2 border-t">
                          <Label className="text-xs text-muted-foreground mb-3 block">Message Bubbles</Label>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label className="text-xs">User Message</Label>
                              <div className="flex gap-2">
                                <Input
                                  type="color"
                                  value={settings.userMessageColor}
                                  onChange={(e) => updateSetting('userMessageColor', e.target.value)}
                                  className="w-10 h-8 p-0.5 cursor-pointer"
                                  data-testid="input-user-msg-color"
                                />
                                <Input
                                  type="color"
                                  value={settings.userMessageTextColor}
                                  onChange={(e) => updateSetting('userMessageTextColor', e.target.value)}
                                  className="w-10 h-8 p-0.5 cursor-pointer"
                                  data-testid="input-user-msg-text-color"
                                  title="Text color"
                                />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label className="text-xs">Bot Message</Label>
                              <div className="flex gap-2">
                                <Input
                                  type="color"
                                  value={settings.botMessageColor}
                                  onChange={(e) => updateSetting('botMessageColor', e.target.value)}
                                  className="w-10 h-8 p-0.5 cursor-pointer"
                                  data-testid="input-bot-msg-color"
                                />
                                <Input
                                  type="color"
                                  value={settings.botMessageTextColor}
                                  onChange={(e) => updateSetting('botMessageTextColor', e.target.value)}
                                  className="w-10 h-8 p-0.5 cursor-pointer"
                                  data-testid="input-bot-msg-text-color"
                                  title="Text color"
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Input Colors */}
                        <div className="pt-2 border-t">
                          <Label className="text-xs text-muted-foreground mb-3 block">Input Area</Label>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label className="text-xs">Input Background</Label>
                              <div className="flex gap-2">
                                <Input
                                  type="color"
                                  value={settings.inputBackgroundColor}
                                  onChange={(e) => updateSetting('inputBackgroundColor', e.target.value)}
                                  className="w-12 h-9 p-1 cursor-pointer"
                                  data-testid="input-input-bg-color"
                                />
                                <Input
                                  value={settings.inputBackgroundColor}
                                  onChange={(e) => updateSetting('inputBackgroundColor', e.target.value)}
                                  className="flex-1 font-mono text-xs"
                                />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label className="text-xs">Input Text</Label>
                              <div className="flex gap-2">
                                <Input
                                  type="color"
                                  value={settings.inputTextColor}
                                  onChange={(e) => updateSetting('inputTextColor', e.target.value)}
                                  className="w-12 h-9 p-1 cursor-pointer"
                                  data-testid="input-input-text-color"
                                />
                                <Input
                                  value={settings.inputTextColor}
                                  onChange={(e) => updateSetting('inputTextColor', e.target.value)}
                                  className="flex-1 font-mono text-xs"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Layout & Style Section */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2">
                      <Layout className="h-4 w-4" />
                      Layout & Style
                    </CardTitle>
                    <CardDescription>Configure widget dimensions and styling</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="position">Position</Label>
                        <Select
                          value={settings.position}
                          onValueChange={(value: 'bottom-right' | 'bottom-left') => updateSetting('position', value)}
                        >
                          <SelectTrigger id="position" data-testid="select-position">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="bottom-right">Bottom Right</SelectItem>
                            <SelectItem value="bottom-left">Bottom Left</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="shadowIntensity">Shadow</Label>
                        <Select
                          value={settings.shadowIntensity}
                          onValueChange={(value: 'none' | 'soft' | 'medium' | 'strong') => updateSetting('shadowIntensity', value)}
                        >
                          <SelectTrigger id="shadowIntensity" data-testid="select-shadow">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {shadowIntensities.map(s => (
                              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label>Border Radius: {settings.borderRadius}px</Label>
                      </div>
                      <Slider
                        value={[settings.borderRadius]}
                        onValueChange={([value]) => updateSetting('borderRadius', value)}
                        min={0}
                        max={24}
                        step={2}
                        data-testid="slider-border-radius"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="fontFamily">Font Family</Label>
                        <Select
                          value={settings.fontFamily}
                          onValueChange={(value: 'system' | 'Inter' | 'Roboto' | 'Nunito') => updateSetting('fontFamily', value)}
                        >
                          <SelectTrigger id="fontFamily" data-testid="select-font-family">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {fontFamilies.map(f => (
                              <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="fontSize">Font Size</Label>
                        <Select
                          value={settings.fontSize}
                          onValueChange={(value: 'sm' | 'md' | 'lg') => updateSetting('fontSize', value)}
                        >
                          <SelectTrigger id="fontSize" data-testid="select-font-size">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {fontSizes.map(f => (
                              <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Launcher Bubble Section */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle>Launcher Bubble</CardTitle>
                    <CardDescription>Customize the chat launcher button</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="launcherIconStyle">Icon Style</Label>
                      <Select
                        value={settings.launcherIconStyle}
                        onValueChange={(value: 'chat-bubble' | 'robot' | 'message') => updateSetting('launcherIconStyle', value)}
                      >
                        <SelectTrigger id="launcherIconStyle" data-testid="select-launcher-icon">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {launcherIcons.map(icon => (
                            <SelectItem key={icon.value} value={icon.value}>{icon.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="showLauncherLabel">Show Label</Label>
                        <p className="text-xs text-muted-foreground">Display text next to the launcher</p>
                      </div>
                      <Switch
                        id="showLauncherLabel"
                        checked={settings.showLauncherLabel}
                        onCheckedChange={(checked) => updateSetting('showLauncherLabel', checked)}
                        data-testid="switch-launcher-label"
                      />
                    </div>

                    {settings.showLauncherLabel && (
                      <div className="space-y-2">
                        <Label htmlFor="launcherLabel">Label Text</Label>
                        <Input
                          id="launcherLabel"
                          value={settings.launcherLabel || ''}
                          onChange={(e) => updateSetting('launcherLabel', e.target.value || null)}
                          placeholder="Chat with us"
                          data-testid="input-launcher-label"
                        />
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="avatarUrl">Avatar Image URL</Label>
                      <Input
                        id="avatarUrl"
                        type="url"
                        value={settings.avatarUrl || ''}
                        onChange={(e) => updateSetting('avatarUrl', e.target.value || null)}
                        placeholder="https://example.com/avatar.png"
                        data-testid="input-avatar-url"
                      />
                      <p className="text-xs text-muted-foreground">Leave empty to use the default icon</p>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="showAvatar">Show Avatar</Label>
                        <p className="text-xs text-muted-foreground">Display avatar in chat header</p>
                      </div>
                      <Switch
                        id="showAvatar"
                        checked={settings.showAvatar}
                        onCheckedChange={(checked) => updateSetting('showAvatar', checked)}
                        data-testid="switch-show-avatar"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Identity & Messages Section */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle>Identity & Messages</CardTitle>
                    <CardDescription>Customize header info and messages</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="headerTitle">Header Title</Label>
                        <Input
                          id="headerTitle"
                          value={settings.headerTitle || ''}
                          onChange={(e) => updateSetting('headerTitle', e.target.value || null)}
                          placeholder={businessName}
                          data-testid="input-header-title"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="headerSubtitle">Header Subtitle</Label>
                        <Input
                          id="headerSubtitle"
                          value={settings.headerSubtitle || ''}
                          onChange={(e) => updateSetting('headerSubtitle', e.target.value || null)}
                          placeholder="Online"
                          data-testid="input-header-subtitle"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="greeting">Welcome Message</Label>
                      <Input
                        id="greeting"
                        value={settings.greeting || ''}
                        onChange={(e) => updateSetting('greeting', e.target.value || null)}
                        placeholder="Hi! How can I help you today?"
                        data-testid="input-greeting"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="placeholder">Input Placeholder</Label>
                      <Input
                        id="placeholder"
                        value={settings.placeholder || ''}
                        onChange={(e) => updateSetting('placeholder', e.target.value || null)}
                        placeholder="Type your message..."
                        data-testid="input-placeholder"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="showPoweredBy">Show "Powered by" Footer</Label>
                        <p className="text-xs text-muted-foreground">Display attribution in widget footer</p>
                      </div>
                      <Switch
                        id="showPoweredBy"
                        checked={settings.showPoweredBy}
                        onCheckedChange={(checked) => updateSetting('showPoweredBy', checked)}
                        data-testid="switch-powered-by"
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="behavior" className="mt-6 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Auto-Open</CardTitle>
                    <CardDescription>Automatically open the widget for visitors</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="autoOpenEnabled">Enable Auto-Open</Label>
                        <p className="text-xs text-muted-foreground">Widget will open after a delay</p>
                      </div>
                      <Switch
                        id="autoOpenEnabled"
                        checked={settings.autoOpenEnabled}
                        onCheckedChange={(checked) => updateSetting('autoOpenEnabled', checked)}
                        data-testid="switch-auto-open"
                      />
                    </div>

                    {settings.autoOpenEnabled && (
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <Label>Delay: {settings.autoOpenDelay} seconds</Label>
                        </div>
                        <Slider
                          value={[settings.autoOpenDelay]}
                          onValueChange={([value]) => updateSetting('autoOpenDelay', value)}
                          min={1}
                          max={30}
                          step={1}
                          data-testid="slider-auto-open-delay"
                        />
                        <p className="text-xs text-muted-foreground">
                          Widget will open {settings.autoOpenDelay} seconds after the page loads
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Accessibility</CardTitle>
                    <CardDescription>Make the widget accessible to all users</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="keyboardNavEnabled">Keyboard Navigation</Label>
                        <p className="text-xs text-muted-foreground">Allow navigation with keyboard</p>
                      </div>
                      <Switch
                        id="keyboardNavEnabled"
                        checked={settings.keyboardNavEnabled}
                        onCheckedChange={(checked) => updateSetting('keyboardNavEnabled', checked)}
                        data-testid="switch-keyboard-nav"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="ariaLabelsEnabled">ARIA Labels</Label>
                        <p className="text-xs text-muted-foreground">Include screen reader labels</p>
                      </div>
                      <Switch
                        id="ariaLabelsEnabled"
                        checked={settings.ariaLabelsEnabled}
                        onCheckedChange={(checked) => updateSetting('ariaLabelsEnabled', checked)}
                        data-testid="switch-aria-labels"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="mobileFullscreen">Mobile Fullscreen</Label>
                        <p className="text-xs text-muted-foreground">Open widget fullscreen on mobile</p>
                      </div>
                      <Switch
                        id="mobileFullscreen"
                        checked={settings.mobileFullscreen}
                        onCheckedChange={(checked) => updateSetting('mobileFullscreen', checked)}
                        data-testid="switch-mobile-fullscreen"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="mobileEnabled">Mobile Support</Label>
                        <p className="text-xs text-muted-foreground">Show widget on mobile devices</p>
                      </div>
                      <Switch
                        id="mobileEnabled"
                        checked={settings.mobileEnabled}
                        onCheckedChange={(checked) => updateSetting('mobileEnabled', checked)}
                        data-testid="switch-mobile"
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="sounds" className="mt-6 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Notification Sounds</CardTitle>
                    <CardDescription>Audio feedback for messages</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="notificationSoundEnabled">Enable Sounds</Label>
                        <p className="text-xs text-muted-foreground">Play sounds for new messages</p>
                      </div>
                      <Switch
                        id="notificationSoundEnabled"
                        checked={settings.notificationSoundEnabled}
                        onCheckedChange={(checked) => updateSetting('notificationSoundEnabled', checked)}
                        data-testid="switch-notification-sound"
                      />
                    </div>

                    {settings.notificationSoundEnabled && (
                      <div className="space-y-2">
                        <Label htmlFor="notificationSoundType">Sound Type</Label>
                        <Select
                          value={settings.notificationSoundType || 'default'}
                          onValueChange={(value) => updateSetting('notificationSoundType', value)}
                        >
                          <SelectTrigger id="notificationSoundType" data-testid="select-sound-type">
                            <SelectValue placeholder="Select sound" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="default">Default</SelectItem>
                            <SelectItem value="chime">Chime</SelectItem>
                            <SelectItem value="pop">Pop</SelectItem>
                            <SelectItem value="subtle">Subtle</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="embed" className="mt-6 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Embed Code</CardTitle>
                    <CardDescription>Add this code to your website to display the chat widget</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="bg-muted rounded-lg p-4 overflow-x-auto">
                      <pre className="text-sm whitespace-pre-wrap break-all">
                        {getEmbedCode()}
                      </pre>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={copyEmbedCode} variant="outline" data-testid="button-copy-embed">
                        <Code className="h-4 w-4 mr-2" />
                        Copy Code
                      </Button>
                    </div>
                    <div className="text-sm text-muted-foreground space-y-2">
                      <p><strong>Note:</strong> Replace <code className="bg-muted px-1 rounded">YOUR_CLIENT_ID</code> with your workspace slug and <code className="bg-muted px-1 rounded">YOUR_WIDGET_TOKEN</code> with a valid widget token.</p>
                      <p>Generate a widget token using the API or contact your administrator.</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          <div className="lg:sticky lg:top-24 lg:h-fit">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    Live Preview
                  </CardTitle>
                  <CardDescription>See how your widget will look</CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPreviewKey(prev => prev + 1)}
                  data-testid="button-refresh-preview"
                >
                  Refresh
                </Button>
              </CardHeader>
              <CardContent>
                <div
                  className="relative bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden"
                  style={{ height: '500px' }}
                >
                  <WidgetPreview
                    key={previewKey}
                    settings={settings}
                    businessName={businessName}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

interface WidgetPreviewProps {
  settings: Omit<WidgetSettings, 'id' | 'botId'>;
  businessName: string;
}

function WidgetPreview({ settings, businessName }: WidgetPreviewProps) {
  const [isOpen, setIsOpen] = useState(true);
  
  const getShadow = () => {
    switch (settings.shadowIntensity) {
      case 'none': return 'none';
      case 'soft': return '0 4px 12px rgba(0,0,0,0.1)';
      case 'medium': return '0 8px 24px rgba(0,0,0,0.2)';
      case 'strong': return '0 12px 40px rgba(0,0,0,0.35)';
      default: return '0 8px 24px rgba(0,0,0,0.2)';
    }
  };

  const getFontSize = () => {
    switch (settings.fontSize) {
      case 'sm': return { base: 12, header: 13, message: 12 };
      case 'lg': return { base: 15, header: 16, message: 14 };
      default: return { base: 13, header: 14, message: 13 };
    }
  };

  const getFontFamily = () => {
    switch (settings.fontFamily) {
      case 'Inter': return "'Inter', sans-serif";
      case 'Roboto': return "'Roboto', sans-serif";
      case 'Nunito': return "'Nunito', sans-serif";
      default: return "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
    }
  };

  const getLauncherIcon = () => {
    switch (settings.launcherIconStyle) {
      case 'robot':
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
            <rect x="3" y="11" width="18" height="10" rx="2" ry="2"/>
            <circle cx="12" cy="5" r="2"/>
            <path d="M12 7v4"/>
            <circle cx="8" cy="16" r="1"/>
            <circle cx="16" cy="16" r="1"/>
          </svg>
        );
      case 'message':
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
        );
      default:
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
          </svg>
        );
    }
  };

  const fontSizes = getFontSize();
  const displayTitle = settings.headerTitle || businessName;
  const displaySubtitle = settings.headerSubtitle || 'Online';

  if (!isOpen) {
    return (
      <div
        className="absolute cursor-pointer flex items-center gap-2"
        style={{
          ...(settings.showLauncherLabel ? {
            paddingLeft: 16,
            paddingRight: 6,
            height: 50,
            borderRadius: 25,
          } : {
            width: 50,
            height: 50,
            borderRadius: '50%',
          }),
          background: settings.primaryColor,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: getShadow(),
          ...(settings.position === 'bottom-right'
            ? { bottom: 16, right: 16 }
            : { bottom: 16, left: 16 }),
        }}
        onClick={() => setIsOpen(true)}
        data-testid="preview-bubble"
      >
        {settings.showLauncherLabel && (
          <span style={{ color: 'white', fontSize: 14, fontWeight: 500 }}>
            {settings.launcherLabel || 'Chat with us'}
          </span>
        )}
        <div style={{ 
          width: settings.showLauncherLabel ? 38 : 'auto',
          height: settings.showLauncherLabel ? 38 : 'auto',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          {getLauncherIcon()}
        </div>
      </div>
    );
  }

  return (
    <div
      className="absolute overflow-hidden flex flex-col"
      style={{
        width: 340,
        height: 460,
        background: settings.backgroundColor,
        boxShadow: getShadow(),
        borderRadius: settings.borderRadius,
        fontFamily: getFontFamily(),
        ...(settings.position === 'bottom-right'
          ? { bottom: 16, right: 16 }
          : { bottom: 16, left: 16 }),
      }}
      data-testid="preview-widget"
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 16px',
          background: settings.headerBackgroundColor,
          borderBottom: `1px solid ${settings.backgroundColor}20`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {settings.showAvatar && (
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                background: settings.avatarUrl ? 'transparent' : settings.primaryColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                flexShrink: 0,
              }}
            >
              {settings.avatarUrl ? (
                <img
                  src={settings.avatarUrl}
                  alt={displayTitle}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
                </svg>
              )}
            </div>
          )}
          <div>
            <div style={{ fontSize: fontSizes.header, fontWeight: 600, color: settings.textColor }}>
              {displayTitle}
            </div>
            <div style={{ fontSize: fontSizes.base - 2, color: settings.textMutedColor, display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22C55E' }} />
              {displaySubtitle}
            </div>
          </div>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            border: 'none',
            background: 'transparent',
            color: settings.textMutedColor,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          data-testid="preview-close"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      {/* Messages Area */}
      <div style={{ flex: 1, padding: 16, overflowY: 'auto', background: settings.backgroundColor }}>
        {/* Bot Message */}
        <div style={{ marginBottom: 16 }}>
          <div
            style={{
              maxWidth: '85%',
              padding: '12px 16px',
              background: settings.botMessageColor,
              color: settings.botMessageTextColor,
              borderRadius: settings.borderRadius > 12 ? 16 : settings.borderRadius,
              borderBottomLeftRadius: 4,
              fontSize: fontSizes.message,
              lineHeight: 1.5,
            }}
          >
            {settings.greeting || 'Hi! How can I help you today?'}
          </div>
        </div>
        
        {/* User Message Example */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
          <div
            style={{
              maxWidth: '85%',
              padding: '12px 16px',
              background: settings.userMessageColor,
              color: settings.userMessageTextColor,
              borderRadius: settings.borderRadius > 12 ? 16 : settings.borderRadius,
              borderBottomRightRadius: 4,
              fontSize: fontSizes.message,
              lineHeight: 1.5,
            }}
          >
            What are your hours?
          </div>
        </div>
      </div>

      {/* Input Area */}
      <div
        style={{
          padding: 12,
          background: settings.headerBackgroundColor,
          borderTop: `1px solid ${settings.backgroundColor}20`,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: settings.inputBackgroundColor,
            border: `1px solid ${settings.textMutedColor}30`,
            borderRadius: settings.borderRadius > 12 ? 24 : settings.borderRadius,
            padding: '8px 8px 8px 16px',
          }}
        >
          <input
            type="text"
            placeholder={settings.placeholder || 'Type your message...'}
            disabled
            style={{
              flex: 1,
              border: 'none',
              background: 'transparent',
              color: settings.inputTextColor,
              fontSize: fontSizes.base,
              outline: 'none',
            }}
          />
          <button
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              border: 'none',
              background: settings.primaryColor,
              color: 'white',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Powered By Footer */}
      {settings.showPoweredBy && (
        <div
          style={{
            padding: '8px 12px',
            textAlign: 'center',
            fontSize: 10,
            color: settings.textMutedColor,
            background: settings.headerBackgroundColor,
            borderTop: `1px solid ${settings.backgroundColor}15`,
          }}
        >
          Powered by <span style={{ color: settings.primaryColor, fontWeight: 500 }}>Treasure Coast AI</span>
        </div>
      )}
    </div>
  );
}

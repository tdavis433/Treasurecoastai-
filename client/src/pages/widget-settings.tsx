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
  position: 'bottom-right' | 'bottom-left';
  avatarUrl: string | null;
  greeting: string | null;
  placeholder: string | null;
  showPoweredBy: boolean;
  autoOpenEnabled: boolean;
  autoOpenDelay: number;
  notificationSoundEnabled: boolean;
  notificationSoundType: string | null;
  mobileEnabled: boolean;
  keyboardNavEnabled: boolean;
  ariaLabelsEnabled: boolean;
}

const defaultSettings: Omit<WidgetSettings, 'id' | 'botId'> = {
  themeMode: 'dark',
  primaryColor: '#2563eb',
  position: 'bottom-right',
  avatarUrl: null,
  greeting: 'Hi! How can I help you today?',
  placeholder: 'Type your message...',
  showPoweredBy: true,
  autoOpenEnabled: false,
  autoOpenDelay: 5,
  notificationSoundEnabled: false,
  notificationSoundType: 'default',
  mobileEnabled: true,
  keyboardNavEnabled: true,
  ariaLabelsEnabled: true,
};

export default function WidgetSettingsPage() {
  const { botId } = useParams<{ botId: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [settings, setSettings] = useState<Omit<WidgetSettings, 'id' | 'botId'>>(defaultSettings);
  const [activeTab, setActiveTab] = useState('appearance');
  const [previewKey, setPreviewKey] = useState(0);

  const { data, isLoading } = useQuery<{ settings: WidgetSettings }>({
    queryKey: ['/api/bots', botId, 'widget-settings'],
    enabled: !!botId,
  });

  const { data: botData } = useQuery<{ bot: { name: string; businessProfile?: { businessName?: string } } }>({
    queryKey: ['/api/bots', botId],
    enabled: !!botId,
  });

  useEffect(() => {
    if (data?.settings) {
      const { id, botId: _, ...rest } = data.settings;
      setSettings({ ...defaultSettings, ...rest });
    }
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: (settingsData: Omit<WidgetSettings, 'id' | 'botId'>) =>
      apiRequest('PUT', `/api/bots/${botId}/widget-settings`, settingsData),
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
                <Card>
                  <CardHeader>
                    <CardTitle>Theme</CardTitle>
                    <CardDescription>Customize the widget's visual appearance</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="themeMode">Theme Mode</Label>
                      <Select
                        value={settings.themeMode}
                        onValueChange={(value: 'light' | 'dark' | 'auto') => updateSetting('themeMode', value)}
                      >
                        <SelectTrigger id="themeMode" data-testid="select-theme-mode">
                          <SelectValue placeholder="Select theme" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="dark">Dark</SelectItem>
                          <SelectItem value="light">Light</SelectItem>
                          <SelectItem value="auto">Auto (System)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="primaryColor">Primary Color</Label>
                      <div className="flex gap-2">
                        <Input
                          id="primaryColor"
                          type="color"
                          value={settings.primaryColor}
                          onChange={(e) => updateSetting('primaryColor', e.target.value)}
                          className="w-16 h-10 p-1 cursor-pointer"
                          data-testid="input-primary-color"
                        />
                        <Input
                          value={settings.primaryColor}
                          onChange={(e) => updateSetting('primaryColor', e.target.value)}
                          placeholder="#2563eb"
                          className="flex-1"
                          data-testid="input-primary-color-hex"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="position">Widget Position</Label>
                      <Select
                        value={settings.position}
                        onValueChange={(value: 'bottom-right' | 'bottom-left') => updateSetting('position', value)}
                      >
                        <SelectTrigger id="position" data-testid="select-position">
                          <SelectValue placeholder="Select position" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="bottom-right">Bottom Right</SelectItem>
                          <SelectItem value="bottom-left">Bottom Left</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="avatarUrl">Avatar URL</Label>
                      <Input
                        id="avatarUrl"
                        type="url"
                        value={settings.avatarUrl || ''}
                        onChange={(e) => updateSetting('avatarUrl', e.target.value || null)}
                        placeholder="https://example.com/avatar.png"
                        data-testid="input-avatar-url"
                      />
                      <p className="text-xs text-muted-foreground">Leave empty to use the default chat icon</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Text & Messages</CardTitle>
                    <CardDescription>Customize the widget text content</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="greeting">Greeting Message</Label>
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
  
  const resolveTheme = () => {
    if (settings.themeMode === 'auto') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return settings.themeMode;
  };
  
  const theme = resolveTheme();
  const isDark = theme === 'dark';
  
  const bgColor = isDark ? '#1a1a2e' : '#ffffff';
  const bgSecondary = isDark ? '#16213e' : '#f8fafc';
  const textColor = isDark ? '#e8e8e8' : '#1e293b';
  const textMuted = isDark ? '#9ca3af' : '#64748b';
  const borderColor = isDark ? '#2a2a4a' : '#e2e8f0';
  const botBg = isDark ? '#252545' : '#f1f5f9';

  if (!isOpen) {
    return (
      <div
        className="absolute cursor-pointer"
        style={{
          width: 50,
          height: 50,
          borderRadius: '50%',
          background: settings.primaryColor,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
          ...(settings.position === 'bottom-right'
            ? { bottom: 16, right: 16 }
            : { bottom: 16, left: 16 }),
        }}
        onClick={() => setIsOpen(true)}
        data-testid="preview-bubble"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
        </svg>
      </div>
    );
  }

  return (
    <div
      className="absolute rounded-2xl overflow-hidden flex flex-col"
      style={{
        width: 320,
        height: 440,
        background: bgColor,
        boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
        ...(settings.position === 'bottom-right'
          ? { bottom: 16, right: 16 }
          : { bottom: 16, left: 16 }),
      }}
      data-testid="preview-widget"
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: 12,
          background: bgSecondary,
          borderBottom: `1px solid ${borderColor}`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: settings.avatarUrl ? 'transparent' : settings.primaryColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
            }}
          >
            {settings.avatarUrl ? (
              <img
                src={settings.avatarUrl}
                alt={businessName}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
              </svg>
            )}
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: textColor }}>{businessName}</div>
            <div style={{ fontSize: 11, color: textMuted }}>Online</div>
          </div>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          style={{
            width: 28,
            height: 28,
            borderRadius: 6,
            border: 'none',
            background: 'transparent',
            color: textMuted,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          data-testid="preview-close"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      <div style={{ flex: 1, padding: 12, overflowY: 'auto' }}>
        <div
          style={{
            maxWidth: '85%',
            padding: '10px 14px',
            background: botBg,
            color: textColor,
            borderRadius: '14px',
            borderBottomLeftRadius: 4,
            fontSize: 13,
          }}
        >
          {settings.greeting || 'Hi! How can I help you today?'}
        </div>
      </div>

      <div
        style={{
          padding: 12,
          background: bgSecondary,
          borderTop: `1px solid ${borderColor}`,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: bgColor,
            border: `1px solid ${borderColor}`,
            borderRadius: 20,
            padding: '6px 6px 6px 14px',
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
              color: textColor,
              fontSize: 13,
              outline: 'none',
            }}
          />
          <button
            style={{
              width: 30,
              height: 30,
              borderRadius: '50%',
              border: 'none',
              background: settings.primaryColor,
              color: 'white',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          </button>
        </div>
      </div>

      {settings.showPoweredBy && (
        <div
          style={{
            padding: '6px 12px',
            textAlign: 'center',
            fontSize: 10,
            color: textMuted,
            background: bgSecondary,
            borderTop: `1px solid ${borderColor}`,
          }}
        >
          Powered by <span style={{ color: textColor, fontWeight: 500 }}>Treasure Coast AI</span>
        </div>
      )}
    </div>
  );
}

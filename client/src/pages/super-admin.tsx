import { useQuery, useMutation } from "@tanstack/react-query";
import { GlassCard, GlassCardHeader, GlassCardTitle, GlassCardDescription, GlassCardContent } from "@/components/ui/glass-card";
import { NeonBadge } from "@/components/ui/neon-badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Settings, Palette, Clock, Bell, BookOpen, LogOut, Send, AlertCircle, Shield, Trash2, Plus, X, Sparkles } from "lucide-react";
import { AdminLayout } from "@/components/admin-layout";

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

export default function SuperAdmin() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  
  const { data: authCheck, isLoading: authLoading } = useQuery<{ authenticated: boolean }>({
    queryKey: ["/api/auth/check"],
    retry: false,
  });

  const { data: settings, isLoading } = useQuery<ClientSettings>({
    queryKey: ["/api/settings"],
    enabled: authCheck?.authenticated === true,
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/auth/logout", {});
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Logged out",
        description: "You have been logged out successfully.",
      });
      setLocation("/login");
    },
  });

  const [formData, setFormData] = useState<Partial<ClientSettings>>(settings || {});
  const [newEmailInput, setNewEmailInput] = useState("");
  
  const getEmailList = (): string[] => {
    const emails = formData.notificationEmail || settings?.notificationEmail || "";
    return emails.split(",").map(e => e.trim()).filter(e => e.length > 0);
  };
  
  const addEmail = () => {
    const email = newEmailInput.trim().toLowerCase();
    if (!email) return;
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }
    
    const currentEmails = getEmailList();
    if (currentEmails.includes(email)) {
      toast({
        title: "Duplicate Email",
        description: "This email is already in the list.",
        variant: "destructive",
      });
      return;
    }
    
    const updatedEmails = [...currentEmails, email].join(", ");
    setFormData({ ...formData, notificationEmail: updatedEmails });
    setNewEmailInput("");
  };
  
  const removeEmail = (emailToRemove: string) => {
    const currentEmails = getEmailList();
    const updatedEmails = currentEmails.filter(e => e !== emailToRemove).join(", ");
    setFormData({ ...formData, notificationEmail: updatedEmails || null });
  };

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<ClientSettings>) => {
      const response = await apiRequest("PATCH", "/api/settings", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({
        title: "Settings Updated",
        description: "Your changes have been saved successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update settings. Please try again.",
        variant: "destructive",
      });
    },
  });

  const testNotificationMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/test-notification", {});
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to send test notification");
      }
      
      return data;
    },
    onSuccess: (data) => {
      toast({
        title: "Test Notification Sent",
        description: data.message || "Check your email inbox!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Test Failed",
        description: error.message || "Failed to send test notification. Check your settings.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    updateMutation.mutate(formData);
  };

  const handleTestNotification = () => {
    testNotificationMutation.mutate();
  };

  useEffect(() => {
    if (settings) {
      setFormData(prev => ({
        ...prev,
        notificationEmail: prev.notificationEmail ?? settings.notificationEmail,
      }));
    }
  }, [settings]);

  useEffect(() => {
    if (!authLoading && !authCheck?.authenticated) {
      setLocation("/login");
    }
  }, [authCheck, authLoading, setLocation]);

  if (authLoading || isLoading || !settings) {
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

  if (!authCheck?.authenticated) {
    return null;
  }

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Page Header */}
        <div>
          <h2 className="text-3xl font-bold text-white" data-testid="text-super-admin-title">
            Settings
          </h2>
          <p className="text-white/55 mt-1">
            Configure chatbot settings for your clients
          </p>
        </div>

        <Tabs defaultValue="general" className="space-y-6">
          {/* Tabs Navigation - using shadcn Tabs for full accessibility */}
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

          {/* General Tab */}
          <TabsContent value="general" className="space-y-6">
            <GlassCard>
              <GlassCardHeader>
                <GlassCardTitle>General Settings</GlassCardTitle>
                <GlassCardDescription>Configure basic business information</GlassCardDescription>
              </GlassCardHeader>
              <GlassCardContent className="space-y-6">
                <div className="space-y-3">
                  <label className="text-sm font-medium text-white/55">Business Name</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2.5 rounded-xl glass-input"
                    data-testid="input-business-name"
                    value={formData.businessName || settings.businessName}
                    onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                    placeholder="The Faith House"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-sm font-medium text-white/55">Tagline</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2.5 rounded-xl glass-input"
                    data-testid="input-tagline"
                    value={formData.tagline || settings.tagline}
                    onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                    placeholder="Here to support your next step"
                  />
                </div>
              </GlassCardContent>
            </GlassCard>
          </TabsContent>

          {/* Knowledge Tab */}
          <TabsContent value="knowledge" className="space-y-6">
            <GlassCard>
              <GlassCardHeader>
                <GlassCardTitle>Knowledge Base</GlassCardTitle>
                <GlassCardDescription>
                  Customize what the chatbot tells visitors about your facility
                </GlassCardDescription>
              </GlassCardHeader>
              <GlassCardContent className="space-y-6">
                <div className="space-y-3">
                  <label className="text-sm font-medium text-white/55">About Section</label>
                  <textarea
                    className="w-full px-4 py-3 rounded-xl glass-input min-h-32 resize-none"
                    data-testid="input-about"
                    value={formData.knowledgeBase?.about || settings.knowledgeBase.about}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        knowledgeBase: {
                          ...(formData.knowledgeBase || settings.knowledgeBase),
                          about: e.target.value,
                        },
                      })
                    }
                    placeholder="Describe your facility and program..."
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-medium text-white/55">Requirements</label>
                  <textarea
                    className="w-full px-4 py-3 rounded-xl glass-input min-h-32 resize-none"
                    data-testid="input-requirements"
                    value={formData.knowledgeBase?.requirements || settings.knowledgeBase.requirements}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        knowledgeBase: {
                          ...(formData.knowledgeBase || settings.knowledgeBase),
                          requirements: e.target.value,
                        },
                      })
                    }
                    placeholder="List requirements for residents..."
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-medium text-white/55">Pricing Information</label>
                  <textarea
                    className="w-full px-4 py-3 rounded-xl glass-input min-h-24 resize-none"
                    data-testid="input-pricing"
                    value={formData.knowledgeBase?.pricing || settings.knowledgeBase.pricing}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        knowledgeBase: {
                          ...(formData.knowledgeBase || settings.knowledgeBase),
                          pricing: e.target.value,
                        },
                      })
                    }
                    placeholder="Pricing details..."
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-medium text-white/55">Application Process</label>
                  <textarea
                    className="w-full px-4 py-3 rounded-xl glass-input min-h-24 resize-none"
                    data-testid="input-application"
                    value={formData.knowledgeBase?.application || settings.knowledgeBase.application}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        knowledgeBase: {
                          ...(formData.knowledgeBase || settings.knowledgeBase),
                          application: e.target.value,
                        },
                      })
                    }
                    placeholder="Describe the application process..."
                  />
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
                    checked={formData.operatingHours?.enabled ?? settings.operatingHours.enabled}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        operatingHours: {
                          ...(formData.operatingHours || settings.operatingHours),
                          enabled: checked,
                        },
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
                      settings.operatingHours.afterHoursMessage
                    }
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        operatingHours: {
                          ...(formData.operatingHours || settings.operatingHours),
                          afterHoursMessage: e.target.value,
                        },
                      })
                    }
                    placeholder="Message shown when outside business hours..."
                  />
                </div>
              </GlassCardContent>
            </GlassCard>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6">
            <GlassCard>
              <GlassCardHeader>
                <GlassCardTitle>Notification Settings</GlassCardTitle>
                <GlassCardDescription>
                  Get instant alerts when appointments are submitted
                </GlassCardDescription>
              </GlassCardHeader>
              <GlassCardContent className="space-y-6">
                {/* Info Alert */}
                <div className="flex items-start gap-3 p-4 rounded-xl bg-cyan-500/10 border border-cyan-400/20">
                  <AlertCircle className="h-5 w-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-white/85">
                    To enable email notifications, you need to configure the RESEND_API_KEY environment variable.
                    Contact support for assistance setting up your Resend account.
                  </p>
                </div>

                {/* Email Notifications Toggle */}
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
                  <div>
                    <p className="text-sm font-medium text-white/85">Email Notifications</p>
                    <p className="text-xs text-white/55 mt-1">
                      Receive email alerts for new appointments
                    </p>
                  </div>
                  <Switch
                    data-testid="switch-email-notifications"
                    className="neon-switch"
                    checked={formData.enableEmailNotifications ?? settings.enableEmailNotifications}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, enableEmailNotifications: checked })
                    }
                  />
                </div>

                {/* Email List */}
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-white/55">Notification Emails</label>
                    <p className="text-xs text-white/40 mt-1">
                      Add multiple email addresses to receive appointment notifications
                    </p>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 min-h-[40px] p-3 bg-white/5 rounded-xl border border-white/10" data-testid="email-list-container">
                    {getEmailList().map((email, index) => (
                      <NeonBadge 
                        key={email}
                        variant="new"
                        className="pl-3 pr-1 py-1.5 flex items-center gap-2"
                        data-testid={`badge-email-${index}`}
                      >
                        <span data-testid={`text-email-${index}`}>{email}</span>
                        <button
                          type="button"
                          className="p-0.5 rounded-full hover:bg-white/20 transition-colors"
                          onClick={() => removeEmail(email)}
                          data-testid={`button-remove-email-${index}`}
                          aria-label={`Remove ${email}`}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </NeonBadge>
                    ))}
                    {getEmailList().length === 0 && (
                      <p className="text-sm text-white/40 italic" data-testid="text-no-emails">No emails added yet</p>
                    )}
                  </div>
                  
                  <div className="flex gap-3">
                    <input
                      type="email"
                      className="flex-1 px-4 py-2.5 rounded-xl glass-input"
                      data-testid="input-notification-email"
                      value={newEmailInput}
                      onChange={(e) => setNewEmailInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addEmail();
                        }
                      }}
                      placeholder="Enter email address..."
                    />
                    <button
                      type="button"
                      onClick={addEmail}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                      data-testid="button-add-email"
                    >
                      <Plus className="h-4 w-4" />
                      Add
                    </button>
                  </div>

                  <button
                    onClick={handleTestNotification}
                    disabled={
                      testNotificationMutation.isPending || 
                      !(formData.enableEmailNotifications ?? settings.enableEmailNotifications) || 
                      getEmailList().length === 0
                    }
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-400/30 text-cyan-400 hover:from-cyan-500/30 hover:to-blue-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    data-testid="button-test-notification"
                  >
                    <Send className="h-4 w-4" />
                    {testNotificationMutation.isPending ? "Sending..." : "Send Test Email"}
                  </button>
                </div>

                {/* SMS Section */}
                <div className="pt-6 border-t border-white/10 space-y-4">
                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
                    <div>
                      <p className="text-sm font-medium text-white/85">SMS Notifications</p>
                      <p className="text-xs text-white/55 mt-1">
                        Receive text alerts for new appointments
                      </p>
                    </div>
                    <Switch
                      data-testid="switch-sms-notifications"
                      className="neon-switch"
                      checked={formData.enableSmsNotifications ?? settings.enableSmsNotifications}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, enableSmsNotifications: checked })
                      }
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="text-sm font-medium text-white/55">Notification Phone</label>
                    <input
                      type="tel"
                      className="w-full px-4 py-2.5 rounded-xl glass-input"
                      data-testid="input-notification-phone"
                      value={formData.notificationPhone || settings.notificationPhone || ""}
                      onChange={(e) => setFormData({ ...formData, notificationPhone: e.target.value })}
                      placeholder="+1 (555) 123-4567"
                    />
                    <p className="text-xs text-white/40">
                      SMS notifications require Twilio integration (not yet configured)
                    </p>
                  </div>
                </div>
              </GlassCardContent>
            </GlassCard>
          </TabsContent>

          {/* Branding Tab */}
          <TabsContent value="branding" className="space-y-6">
            <GlassCard>
              <GlassCardHeader>
                <GlassCardTitle>Branding</GlassCardTitle>
                <GlassCardDescription>Customize the look and feel of the chatbot</GlassCardDescription>
              </GlassCardHeader>
              <GlassCardContent className="space-y-6">
                <div className="space-y-3">
                  <label className="text-sm font-medium text-white/55">Primary Color</label>
                  <div className="flex gap-3">
                    <input
                      type="color"
                      className="w-16 h-12 rounded-xl border border-white/10 cursor-pointer bg-transparent"
                      data-testid="input-primary-color"
                      value={formData.primaryColor || settings.primaryColor}
                      onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                    />
                    <input
                      type="text"
                      className="flex-1 px-4 py-2.5 rounded-xl glass-input"
                      value={formData.primaryColor || settings.primaryColor}
                      onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                      placeholder="#1FA2A8"
                    />
                  </div>
                </div>
              </GlassCardContent>
            </GlassCard>
          </TabsContent>

          {/* Privacy Tab */}
          <TabsContent value="privacy" className="space-y-6">
            <div className="space-y-6">
              <GlassCard>
                <GlassCardHeader>
                  <GlassCardTitle>Data Sanitization</GlassCardTitle>
                  <GlassCardDescription>
                    Protect visitor privacy by removing personally identifiable information from analytics logs
                  </GlassCardDescription>
                </GlassCardHeader>
                <GlassCardContent className="space-y-4">
                  <div className="flex items-start gap-3 p-4 rounded-xl bg-cyan-500/10 border border-cyan-400/20">
                    <Shield className="h-5 w-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-white/85">
                      <strong className="text-cyan-400">PII Protection:</strong> The system automatically redacts phone numbers, emails, and addresses 
                      from all NEW analytics data. Use this button to sanitize historical conversation logs.
                    </p>
                  </div>
                  
                  <button
                    disabled
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-white/5 border border-white/10 text-white/40 cursor-not-allowed"
                    data-testid="button-sanitize-analytics"
                  >
                    <Shield className="h-4 w-4" />
                    Sanitize Historical Analytics
                  </button>
                  <p className="text-xs text-white/40">
                    This feature scans all existing analytics records and applies PII redaction patterns. Coming soon.
                  </p>
                </GlassCardContent>
              </GlassCard>

              <GlassCard>
                <GlassCardHeader>
                  <GlassCardTitle>Data Retention</GlassCardTitle>
                  <GlassCardDescription>
                    Manage analytics data retention and compliance
                  </GlassCardDescription>
                </GlassCardHeader>
                <GlassCardContent className="space-y-4">
                  <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-400/20">
                    <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-white/85">
                      <strong className="text-red-400">Warning:</strong> Purging analytics will permanently delete all conversation logs. 
                      This action cannot be undone. Appointment data will not be affected.
                    </p>
                  </div>

                  <button
                    disabled
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-red-500/10 border border-red-400/20 text-red-400/40 cursor-not-allowed"
                    data-testid="button-purge-analytics"
                  >
                    <Trash2 className="h-4 w-4" />
                    Purge All Analytics
                  </button>
                  <p className="text-xs text-white/40">
                    Automated retention policies coming soon. For now, contact support for data deletion requests.
                  </p>
                </GlassCardContent>
              </GlassCard>
            </div>
          </TabsContent>
        </Tabs>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={handleSubmit}
            disabled={updateMutation.isPending}
            className="px-8 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50 shadow-[0_0_20px_rgba(79,195,247,0.3)]"
            data-testid="button-save-settings"
          >
            {updateMutation.isPending ? "Saving..." : "Save All Changes"}
          </button>
        </div>
      </div>
    </AdminLayout>
  );
}

import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Settings, Palette, Clock, Bell, BookOpen, LogOut, Send, AlertCircle, Shield, Trash2 } from "lucide-react";

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

  useEffect(() => {
    if (!authLoading && authCheck && !authCheck.authenticated) {
      console.log("Not authenticated, redirecting to login");
      setLocation("/login");
    }
  }, [authCheck, authLoading, setLocation]);
  
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg text-muted-foreground">Loading...</div>
        </div>
      </div>
    );
  }
  
  if (!authCheck?.authenticated) {
    return null;
  }

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

  if (isLoading || !settings) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="container mx-auto max-w-6xl">
          <h1 className="text-3xl font-bold text-foreground mb-8">Loading...</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="container mx-auto max-w-6xl">
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2" data-testid="text-super-admin-title">
              Super Admin Settings
            </h1>
            <p className="text-muted-foreground">
              Configure chatbot settings for your clients
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => logoutMutation.mutate()}
            disabled={logoutMutation.isPending}
            data-testid="button-logout"
          >
            <LogOut className="h-4 w-4 mr-2" />
            {logoutMutation.isPending ? "Logging out..." : "Logout"}
          </Button>
        </div>

        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="general" data-testid="tab-general">
              <Settings className="h-4 w-4 mr-2" />
              General
            </TabsTrigger>
            <TabsTrigger value="knowledge" data-testid="tab-knowledge">
              <BookOpen className="h-4 w-4 mr-2" />
              Knowledge Base
            </TabsTrigger>
            <TabsTrigger value="hours" data-testid="tab-hours">
              <Clock className="h-4 w-4 mr-2" />
              Hours
            </TabsTrigger>
            <TabsTrigger value="notifications" data-testid="tab-notifications">
              <Bell className="h-4 w-4 mr-2" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="branding" data-testid="tab-branding">
              <Palette className="h-4 w-4 mr-2" />
              Branding
            </TabsTrigger>
            <TabsTrigger value="privacy" data-testid="tab-privacy">
              <Shield className="h-4 w-4 mr-2" />
              Privacy
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general">
            <Card>
              <CardHeader>
                <CardTitle>General Settings</CardTitle>
                <CardDescription>Configure basic business information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="businessName">Business Name</Label>
                  <Input
                    id="businessName"
                    data-testid="input-business-name"
                    value={formData.businessName || settings.businessName}
                    onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                    placeholder="The Faith House"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tagline">Tagline</Label>
                  <Input
                    id="tagline"
                    data-testid="input-tagline"
                    value={formData.tagline || settings.tagline}
                    onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                    placeholder="Here to support your next step"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="knowledge">
            <Card>
              <CardHeader>
                <CardTitle>Knowledge Base</CardTitle>
                <CardDescription>
                  Customize what the chatbot tells visitors about your facility
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="about">About Section</Label>
                  <Textarea
                    id="about"
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
                    className="min-h-32"
                    placeholder="Describe your facility and program..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="requirements">Requirements</Label>
                  <Textarea
                    id="requirements"
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
                    className="min-h-32"
                    placeholder="List requirements for residents..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pricing">Pricing Information</Label>
                  <Textarea
                    id="pricing"
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
                    className="min-h-24"
                    placeholder="Pricing details..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="application">Application Process</Label>
                  <Textarea
                    id="application"
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
                    className="min-h-24"
                    placeholder="Describe the application process..."
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="hours">
            <Card>
              <CardHeader>
                <CardTitle>Operating Hours</CardTitle>
                <CardDescription>
                  Set business hours for automatic after-hours responses
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Enable Operating Hours</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically respond differently outside business hours
                    </p>
                  </div>
                  <Switch
                    data-testid="switch-enable-hours"
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

                <div className="space-y-2">
                  <Label htmlFor="afterHours">After Hours Message</Label>
                  <Textarea
                    id="afterHours"
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
                    className="min-h-20"
                    placeholder="Message shown when outside business hours..."
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Notification Settings</CardTitle>
                <CardDescription>
                  Get instant alerts when appointments are submitted
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    To enable email notifications, you need to configure the RESEND_API_KEY environment variable.
                    Contact support for assistance setting up your Resend account.
                  </AlertDescription>
                </Alert>

                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <Label>Email Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive email alerts for new appointments
                      </p>
                    </div>
                    <Switch
                      data-testid="switch-email-notifications"
                      checked={formData.enableEmailNotifications ?? settings.enableEmailNotifications}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, enableEmailNotifications: checked })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notificationEmail">Notification Email</Label>
                    <Input
                      id="notificationEmail"
                      data-testid="input-notification-email"
                      type="email"
                      value={formData.notificationEmail || settings.notificationEmail || ""}
                      onChange={(e) => setFormData({ ...formData, notificationEmail: e.target.value })}
                      placeholder="staff@faithhouse.org"
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={handleTestNotification}
                      disabled={
                        testNotificationMutation.isPending || 
                        !(formData.enableEmailNotifications ?? settings.enableEmailNotifications) || 
                        !(formData.notificationEmail || settings.notificationEmail)
                      }
                      data-testid="button-test-notification"
                    >
                      <Send className="mr-2 h-4 w-4" />
                      {testNotificationMutation.isPending ? "Sending..." : "Send Test Email"}
                    </Button>
                    {!(formData.enableEmailNotifications ?? settings.enableEmailNotifications) || 
                     !(formData.notificationEmail || settings.notificationEmail) ? (
                      <p className="text-xs text-muted-foreground self-center">
                        Enable email notifications and enter an email to test
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <Label>SMS Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive text alerts for new appointments
                      </p>
                    </div>
                    <Switch
                      data-testid="switch-sms-notifications"
                      checked={formData.enableSmsNotifications ?? settings.enableSmsNotifications}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, enableSmsNotifications: checked })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notificationPhone">Notification Phone</Label>
                    <Input
                      id="notificationPhone"
                      data-testid="input-notification-phone"
                      type="tel"
                      value={formData.notificationPhone || settings.notificationPhone || ""}
                      onChange={(e) => setFormData({ ...formData, notificationPhone: e.target.value })}
                      placeholder="+1 (555) 123-4567"
                    />
                    <p className="text-xs text-muted-foreground">
                      SMS notifications require Twilio integration (not yet configured)
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="branding">
            <Card>
              <CardHeader>
                <CardTitle>Branding</CardTitle>
                <CardDescription>Customize the look and feel of the chatbot</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="primaryColor">Primary Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="primaryColor"
                      data-testid="input-primary-color"
                      type="color"
                      value={formData.primaryColor || settings.primaryColor}
                      onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                      className="w-20 h-10"
                    />
                    <Input
                      value={formData.primaryColor || settings.primaryColor}
                      onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                      placeholder="#1FA2A8"
                      className="flex-1"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="privacy">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Data Sanitization</CardTitle>
                  <CardDescription>
                    Protect visitor privacy by removing personally identifiable information from analytics logs
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Alert>
                    <Shield className="h-4 w-4" />
                    <AlertDescription>
                      <strong>PII Protection:</strong> The system automatically redacts phone numbers, emails, and addresses 
                      from all NEW analytics data. Use this button to sanitize historical conversation logs.
                    </AlertDescription>
                  </Alert>
                  
                  <div className="flex flex-col gap-2">
                    <Button
                      data-testid="button-sanitize-analytics"
                      variant="outline"
                      className="w-full"
                      disabled
                    >
                      <Shield className="h-4 w-4 mr-2" />
                      Sanitize Historical Analytics
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      This feature scans all existing analytics records and applies PII redaction patterns. Coming soon.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Data Retention</CardTitle>
                  <CardDescription>
                    Manage analytics data retention and compliance
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Warning:</strong> Purging analytics will permanently delete all conversation logs. 
                      This action cannot be undone. Appointment data will not be affected.
                    </AlertDescription>
                  </Alert>

                  <div className="flex flex-col gap-2">
                    <Button
                      data-testid="button-purge-analytics"
                      variant="destructive"
                      className="w-full"
                      disabled
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Purge All Analytics
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      Automated retention policies coming soon. For now, contact support for data deletion requests.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        <div className="mt-6 flex justify-end">
          <Button
            data-testid="button-save-settings"
            onClick={handleSubmit}
            disabled={updateMutation.isPending}
            size="lg"
          >
            {updateMutation.isPending ? "Saving..." : "Save All Changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}

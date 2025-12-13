import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { AdminLayout } from "@/components/admin-layout";
import {
  AlertCircle,
  ArrowLeft,
  Bot,
  Building2,
  Calendar,
  Check,
  CheckCircle,
  ChevronRight,
  Clock,
  Code,
  Copy,
  ExternalLink,
  Eye,
  Globe,
  HelpCircle,
  Layers,
  Loader2,
  Mail,
  MapPin,
  MessageSquare,
  Palette,
  Phone,
  PlayCircle,
  Plus,
  Rocket,
  Send,
  Settings,
  Shield,
  Sparkles,
  Trash2,
  Upload,
  Wrench,
  X,
  Bell,
  FileText,
  Link2,
  Zap,
  AlertTriangle,
} from "lucide-react";

interface IndustryTemplate {
  id: string;
  name: string;
  botType: string;
  icon: string;
  description: string;
  bookingProfile: {
    mode: 'internal' | 'external';
    primaryCTA: string;
    secondaryCTA?: string;
    externalProviders?: string[];
    failsafeEnabled: boolean;
  };
  ctaButtons: Array<{
    id: string;
    label: string;
    prompt: string;
    isPrimary?: boolean;
  }>;
  disclaimer: string;
  defaultConfig: {
    businessProfile: {
      type: string;
      services: string[];
    };
    systemPromptIntro: string;
    faqs: Array<{ question: string; answer: string }>;
    personality: {
      tone: string;
      formality: number;
    };
    theme: {
      primaryColor: string;
      welcomeMessage: string;
    };
  };
}

interface WebsiteSuggestion {
  field: string;
  value: string;
  sourceUrl: string;
  confidence: number;
  selected: boolean;
}

interface DraftState {
  clientId: string;
  botId: string;
  status: 'draft' | 'qa_pending' | 'qa_passed' | 'live';
  qaResults?: {
    passed: boolean;
    warnings: string[];
    errors: string[];
    report: string;
  };
  embedCode?: string;
}

const intakeFormSchema = z.object({
  businessName: z.string().min(1, "Business name is required"),
  industryTemplateId: z.string().min(1, "Please select an industry"),
  websiteUrl: z.string().url().optional().or(z.literal("")),
  primaryPhone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  serviceArea: z.string().optional(),
  primaryCTA: z.enum(["tour", "consult", "book", "reserve", "estimate", "call"]),
  bookingPreference: z.enum(["internal", "external"]),
  externalBookingUrl: z.string().url().optional().or(z.literal("")),
  notes: z.string().optional(),
  doNotSay: z.string().optional(),
}).refine(
  (data) => data.primaryPhone || data.email,
  { message: "At least one contact method (phone or email) is required", path: ["email"] }
);

type IntakeFormData = z.infer<typeof intakeFormSchema>;

const kbDraftSchema = z.object({
  services: z.array(z.object({
    name: z.string(),
    description: z.string().optional(),
  })),
  faqs: z.array(z.object({
    question: z.string(),
    answer: z.string(),
  })),
  policies: z.string().optional(),
  hours: z.record(z.string()).optional(),
});

type KBDraftData = z.infer<typeof kbDraftSchema>;

const CTA_OPTIONS = [
  { value: "tour", label: "Schedule Tour", icon: Eye },
  { value: "consult", label: "Book Consultation", icon: Calendar },
  { value: "book", label: "Book Appointment", icon: Calendar },
  { value: "reserve", label: "Make Reservation", icon: Clock },
  { value: "estimate", label: "Get Estimate", icon: FileText },
  { value: "call", label: "Request Callback", icon: Phone },
];

export default function AgencyOnboardingConsole() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState("suggestions");
  const [draftState, setDraftState] = useState<DraftState | null>(null);
  const [websiteSuggestions, setWebsiteSuggestions] = useState<WebsiteSuggestion[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [notificationEnabled, setNotificationEnabled] = useState(true);
  const [notificationRecipient, setNotificationRecipient] = useState("");
  const [testNotificationStatus, setTestNotificationStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  
  const [kbServices, setKbServices] = useState<Array<{ name: string; description: string }>>([]);
  const [kbFaqs, setKbFaqs] = useState<Array<{ question: string; answer: string }>>([]);
  const [kbPolicies, setKbPolicies] = useState("");
  const [kbHours, setKbHours] = useState<Record<string, string>>({
    Monday: "9:00 AM - 5:00 PM",
    Tuesday: "9:00 AM - 5:00 PM",
    Wednesday: "9:00 AM - 5:00 PM",
    Thursday: "9:00 AM - 5:00 PM",
    Friday: "9:00 AM - 5:00 PM",
    Saturday: "Closed",
    Sunday: "Closed",
  });

  const { data: templates, isLoading: templatesLoading } = useQuery<IndustryTemplate[]>({
    queryKey: ["/api/agency-onboarding/templates"],
  });

  const form = useForm<IntakeFormData>({
    resolver: zodResolver(intakeFormSchema),
    defaultValues: {
      businessName: "",
      industryTemplateId: "",
      websiteUrl: "",
      primaryPhone: "",
      email: "",
      serviceArea: "",
      primaryCTA: "consult",
      bookingPreference: "internal",
      externalBookingUrl: "",
      notes: "",
      doNotSay: "",
    },
  });

  const selectedTemplateId = form.watch("industryTemplateId");
  const selectedTemplate = templates?.find(t => t.id === selectedTemplateId);
  const bookingPreference = form.watch("bookingPreference");

  useEffect(() => {
    if (selectedTemplate) {
      form.setValue("primaryCTA", selectedTemplate.bookingProfile?.primaryCTA as any || "consult");
      form.setValue("bookingPreference", selectedTemplate.bookingProfile?.mode || "internal");
      
      const services = selectedTemplate.defaultConfig?.businessProfile?.services || [];
      setKbServices(services.map(s => ({ name: s, description: "" })));
      setKbFaqs(selectedTemplate.defaultConfig?.faqs || []);
    }
  }, [selectedTemplate, form]);

  interface DraftSetupPayload {
    intakeData: IntakeFormData;
    kbDraft: {
      services: Array<{ name: string; description: string }>;
      faqs: Array<{ question: string; answer: string }>;
      policies: string;
      hours: Record<string, string>;
    };
    websiteSuggestions: WebsiteSuggestion[];
    notification: { recipient: string } | null;
  }

  const generateDraftMutation = useMutation({
    mutationFn: async (payload: DraftSetupPayload) => {
      const response = await apiRequest("POST", "/api/agency-onboarding/generate-draft-setup", {
        ...payload.intakeData,
        kbDraft: payload.kbDraft,
        websiteSuggestions: payload.websiteSuggestions,
        notification: payload.notification,
      });
      return response;
    },
    onSuccess: (result: any) => {
      setDraftState({
        clientId: result.clientId,
        botId: result.botId,
        status: 'draft',
      });
      toast({
        title: "Draft Setup Created",
        description: "Workspace and bot created in DRAFT mode. Run QA Gate when ready.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create draft setup",
        variant: "destructive",
      });
    },
  });

  const handleGenerateDraft = async () => {
    const isValid = await form.trigger();
    
    if (!isValid) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const intakeData = form.getValues();
    const payload: DraftSetupPayload = {
      intakeData,
      kbDraft: {
        services: kbServices,
        faqs: kbFaqs,
        policies: kbPolicies,
        hours: kbHours,
      },
      websiteSuggestions: websiteSuggestions.filter(s => s.selected),
      notification: notificationEnabled 
        ? { recipient: notificationRecipient || intakeData.email || "" } 
        : null,
    };

    generateDraftMutation.mutate(payload);
  };

  const runQAGateMutation = useMutation({
    mutationFn: async () => {
      if (!draftState) throw new Error("No draft to validate");
      const response = await apiRequest("POST", "/api/agency-onboarding/run-qa-gate", {
        clientId: draftState.clientId,
        botId: draftState.botId,
      });
      return response;
    },
    onSuccess: (result: any) => {
      setDraftState(prev => prev ? {
        ...prev,
        status: result.passed ? 'qa_passed' : 'qa_pending',
        qaResults: result,
      } : null);
      
      if (result.passed) {
        toast({
          title: "QA Gate Passed",
          description: "Bot is ready to go live!",
        });
      } else {
        toast({
          title: "QA Gate Issues Found",
          description: `${result.errors?.length || 0} errors, ${result.warnings?.length || 0} warnings`,
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "QA Gate Failed",
        description: error.message || "Failed to run QA gate",
        variant: "destructive",
      });
    },
  });

  const goLiveMutation = useMutation({
    mutationFn: async () => {
      if (!draftState) throw new Error("No draft to activate");
      const response = await apiRequest("POST", "/api/agency-onboarding/go-live", {
        clientId: draftState.clientId,
        botId: draftState.botId,
      });
      return response;
    },
    onSuccess: (result: any) => {
      setDraftState(prev => prev ? {
        ...prev,
        status: 'live',
        embedCode: result.embedCode,
      } : null);
      toast({
        title: "Bot is LIVE!",
        description: "Widget embed code is ready to copy.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Go Live Failed",
        description: error.message || "Failed to activate bot",
        variant: "destructive",
      });
    },
  });

  const handleScanWebsite = async () => {
    const websiteUrl = form.getValues("websiteUrl");
    if (!websiteUrl) {
      toast({
        title: "Enter Website URL",
        description: "Please enter a website URL to scan.",
        variant: "destructive",
      });
      return;
    }
    
    setIsScanning(true);
    try {
      const response = await apiRequest("POST", "/api/scraper/analyze", { url: websiteUrl }) as {
        businessName?: string;
        phone?: string;
        email?: string;
        services?: string[];
        faqs?: Array<{ question: string; answer: string }>;
      };
      const suggestions: WebsiteSuggestion[] = [];
      
      if (response.businessName) {
        suggestions.push({ field: "businessName", value: response.businessName, sourceUrl: websiteUrl, confidence: 0.9, selected: true });
      }
      if (response.phone) {
        suggestions.push({ field: "phone", value: response.phone, sourceUrl: websiteUrl, confidence: 0.85, selected: true });
      }
      if (response.email) {
        suggestions.push({ field: "email", value: response.email, sourceUrl: websiteUrl, confidence: 0.85, selected: true });
      }
      if (response.services?.length) {
        response.services.forEach((s: string) => {
          suggestions.push({ field: "service", value: s, sourceUrl: websiteUrl, confidence: 0.75, selected: true });
        });
      }
      if (response.faqs?.length) {
        response.faqs.forEach((faq: { question: string; answer: string }) => {
          suggestions.push({ field: "faq", value: JSON.stringify(faq), sourceUrl: websiteUrl, confidence: 0.7, selected: true });
        });
      }
      
      setWebsiteSuggestions(suggestions);
      setActiveTab("suggestions");
      
      toast({
        title: "Website Scanned",
        description: `Found ${suggestions.length} suggestions to review.`,
      });
    } catch (error: any) {
      toast({
        title: "Scan Failed",
        description: error.message || "Could not scan website",
        variant: "destructive",
      });
    } finally {
      setIsScanning(false);
    }
  };

  const handleApplySuggestions = () => {
    const selected = websiteSuggestions.filter(s => s.selected);
    
    selected.forEach(suggestion => {
      switch (suggestion.field) {
        case "businessName":
          form.setValue("businessName", suggestion.value);
          break;
        case "phone":
          form.setValue("primaryPhone", suggestion.value);
          break;
        case "email":
          form.setValue("email", suggestion.value);
          break;
        case "service":
          setKbServices(prev => [...prev, { name: suggestion.value, description: "" }]);
          break;
        case "faq":
          try {
            const faq = JSON.parse(suggestion.value);
            setKbFaqs(prev => [...prev, faq]);
          } catch {}
          break;
      }
    });
    
    toast({
      title: "Suggestions Applied",
      description: `Applied ${selected.length} suggestions to the form.`,
    });
  };

  const handleSendTestNotification = async () => {
    setTestNotificationStatus('sending');
    try {
      await apiRequest("POST", "/api/notifications/test", {
        recipient: notificationRecipient || form.getValues("email"),
        type: "lead_notification",
      });
      setTestNotificationStatus('sent');
      toast({
        title: "Test Sent",
        description: "Check your inbox for the test notification.",
      });
    } catch (error) {
      setTestNotificationStatus('error');
      toast({
        title: "Test Failed",
        description: "Could not send test notification.",
        variant: "destructive",
      });
    }
  };

  const copyEmbedCode = () => {
    if (draftState?.embedCode) {
      navigator.clipboard.writeText(draftState.embedCode);
      toast({
        title: "Copied!",
        description: "Embed code copied to clipboard.",
      });
    }
  };

  const addService = () => {
    setKbServices(prev => [...prev, { name: "", description: "" }]);
  };

  const removeService = (index: number) => {
    setKbServices(prev => prev.filter((_, i) => i !== index));
  };

  const addFaq = () => {
    setKbFaqs(prev => [...prev, { question: "", answer: "" }]);
  };

  const removeFaq = (index: number) => {
    setKbFaqs(prev => prev.filter((_, i) => i !== index));
  };

  const getFailsafeStatus = () => {
    const externalUrl = form.getValues("externalBookingUrl");
    const isExternal = bookingPreference === "external";
    
    if (!isExternal) return { status: "internal", message: "Using internal request capture" };
    if (!externalUrl) return { status: "failsafe", message: "No URL set - will use internal fallback" };
    try {
      new URL(externalUrl);
      if (!externalUrl.startsWith("https://")) {
        return { status: "warning", message: "URL must be HTTPS for security" };
      }
      return { status: "ok", message: "External booking configured" };
    } catch {
      return { status: "failsafe", message: "Invalid URL - will use internal fallback" };
    }
  };

  const failsafeStatus = getFailsafeStatus();

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setLocation("/super-admin")}
            data-testid="button-back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Rocket className="h-6 w-6 text-cyan-400" />
              Agency Onboarding Console
            </h1>
            <p className="text-muted-foreground">
              Done-for-you client setup in minutes
            </p>
          </div>
          
          {draftState && (
            <Badge 
              variant="outline" 
              className={
                draftState.status === 'live' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40' :
                draftState.status === 'qa_passed' ? 'bg-cyan-500/15 text-cyan-400 border-cyan-500/40' :
                'bg-amber-500/15 text-amber-400 border-amber-500/40'
              }
              data-testid="badge-draft-status"
            >
              {draftState.status === 'live' ? 'LIVE' : 
               draftState.status === 'qa_passed' ? 'QA PASSED' : 
               draftState.status === 'qa_pending' ? 'QA PENDING' : 'DRAFT'}
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-1 bg-white/3 border-white/10" data-testid="card-intake-form">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-cyan-400" />
                Client Intake
              </CardTitle>
              <CardDescription>
                Basic business information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form className="space-y-4">
                  <FormField
                    control={form.control}
                    name="businessName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Business Name *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="e.g., Joe's Auto Shop" 
                            {...field} 
                            data-testid="input-business-name"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="industryTemplateId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Industry *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-industry">
                              <SelectValue placeholder="Select industry..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {templates?.map((template) => (
                              <SelectItem key={template.id} value={template.id}>
                                {template.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="p-3 rounded-lg border border-dashed border-cyan-400/30 bg-cyan-500/5">
                    <FormField
                      control={form.control}
                      name="websiteUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Globe className="h-4 w-4" />
                            Website URL
                            <Badge variant="secondary" className="text-xs">Auto-fill</Badge>
                          </FormLabel>
                          <div className="flex gap-2">
                            <FormControl>
                              <Input 
                                placeholder="https://..." 
                                {...field} 
                                data-testid="input-website-url"
                              />
                            </FormControl>
                            <Button
                              type="button"
                              size="icon"
                              variant="outline"
                              onClick={handleScanWebsite}
                              disabled={isScanning}
                              data-testid="button-scan-website"
                            >
                              {isScanning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                            </Button>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>

                  <Separator />

                  <div className="grid grid-cols-1 gap-4">
                    <FormField
                      control={form.control}
                      name="primaryPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-1">
                            <Phone className="h-3 w-3" /> Phone
                          </FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="(555) 123-4567" 
                              {...field} 
                              data-testid="input-phone"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-1">
                            <Mail className="h-3 w-3" /> Email
                          </FormLabel>
                          <FormControl>
                            <Input 
                              type="email"
                              placeholder="info@business.com" 
                              {...field} 
                              data-testid="input-email"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="serviceArea"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" /> Service Area
                          </FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="e.g., Treasure Coast, FL" 
                              {...field} 
                              data-testid="input-service-area"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <Separator />

                  <FormField
                    control={form.control}
                    name="primaryCTA"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Primary Call-to-Action</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-primary-cta">
                              <SelectValue placeholder="Select CTA..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {CTA_OPTIONS.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="bookingPreference"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Booking Preference</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-booking-preference">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="internal">Internal (Request Capture)</SelectItem>
                            <SelectItem value="external">External (Redirect to URL)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          {field.value === "internal" 
                            ? "Leads captured in-chat, no redirect" 
                            : "Redirect to external booking system"}
                        </FormDescription>
                      </FormItem>
                    )}
                  />

                  {bookingPreference === "external" && (
                    <FormField
                      control={form.control}
                      name="externalBookingUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-1">
                            <Link2 className="h-3 w-3" /> External Booking URL
                          </FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="https://booking.example.com" 
                              {...field} 
                              data-testid="input-external-booking-url"
                            />
                          </FormControl>
                          <FormDescription>Must be HTTPS</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <div className={`p-3 rounded-lg border ${
                    failsafeStatus.status === 'ok' ? 'border-emerald-500/40 bg-emerald-500/10' :
                    failsafeStatus.status === 'warning' ? 'border-amber-500/40 bg-amber-500/10' :
                    failsafeStatus.status === 'failsafe' ? 'border-rose-500/40 bg-rose-500/10' :
                    'border-cyan-500/40 bg-cyan-500/10'
                  }`}>
                    <div className="flex items-center gap-2 text-sm">
                      {failsafeStatus.status === 'ok' && <CheckCircle className="h-4 w-4 text-emerald-400" />}
                      {failsafeStatus.status === 'warning' && <AlertTriangle className="h-4 w-4 text-amber-400" />}
                      {failsafeStatus.status === 'failsafe' && <Shield className="h-4 w-4 text-rose-400" />}
                      {failsafeStatus.status === 'internal' && <Zap className="h-4 w-4 text-cyan-400" />}
                      <span className="text-white/80">{failsafeStatus.message}</span>
                    </div>
                  </div>

                  <Separator />

                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Internal Notes</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Notes for agency use only..." 
                            rows={2}
                            {...field} 
                            data-testid="input-notes"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="doNotSay"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1">
                          <AlertCircle className="h-3 w-3 text-amber-400" /> Do Not Say
                        </FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Topics/phrases the bot should avoid..." 
                            rows={2}
                            {...field} 
                            data-testid="input-do-not-say"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </form>
              </Form>
            </CardContent>
            <CardFooter className="flex flex-col gap-2">
              <Button
                className="w-full gap-2"
                onClick={handleGenerateDraft}
                disabled={generateDraftMutation.isPending || !!draftState}
                data-testid="button-generate-draft"
              >
                {generateDraftMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                Generate Draft Setup
              </Button>
              
              {draftState && draftState.status !== 'live' && (
                <>
                  <Button
                    variant="outline"
                    className="w-full gap-2"
                    onClick={() => runQAGateMutation.mutate()}
                    disabled={runQAGateMutation.isPending}
                    data-testid="button-run-qa"
                  >
                    {runQAGateMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Shield className="h-4 w-4" />
                    )}
                    Run QA Gate
                  </Button>
                  
                  {draftState.status === 'qa_passed' && (
                    <Button
                      className="w-full gap-2 bg-gradient-to-r from-cyan-500 to-teal-500"
                      onClick={() => goLiveMutation.mutate()}
                      disabled={goLiveMutation.isPending}
                      data-testid="button-go-live"
                    >
                      {goLiveMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Rocket className="h-4 w-4" />
                      )}
                      Go Live + Copy Embed
                    </Button>
                  )}
                </>
              )}
              
              {draftState?.status === 'live' && draftState.embedCode && (
                <Button
                  variant="outline"
                  className="w-full gap-2"
                  onClick={copyEmbedCode}
                  data-testid="button-copy-embed"
                >
                  <Copy className="h-4 w-4" />
                  Copy Embed Code
                </Button>
              )}
            </CardFooter>
          </Card>

          <Card className="lg:col-span-2 bg-white/3 border-white/10" data-testid="card-configuration-tabs">
            <CardHeader className="pb-2">
              <CardTitle>Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid grid-cols-5 mb-4">
                  <TabsTrigger value="suggestions" className="gap-1" data-testid="tab-suggestions">
                    <Globe className="h-3 w-3" />
                    <span className="hidden sm:inline">Suggestions</span>
                  </TabsTrigger>
                  <TabsTrigger value="kb" className="gap-1" data-testid="tab-kb">
                    <Layers className="h-3 w-3" />
                    <span className="hidden sm:inline">KB Draft</span>
                  </TabsTrigger>
                  <TabsTrigger value="ctas" className="gap-1" data-testid="tab-ctas">
                    <Zap className="h-3 w-3" />
                    <span className="hidden sm:inline">CTAs</span>
                  </TabsTrigger>
                  <TabsTrigger value="notifications" className="gap-1" data-testid="tab-notifications">
                    <Bell className="h-3 w-3" />
                    <span className="hidden sm:inline">Notify</span>
                  </TabsTrigger>
                  <TabsTrigger value="preview" className="gap-1" data-testid="tab-preview">
                    <Eye className="h-3 w-3" />
                    <span className="hidden sm:inline">Preview</span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="suggestions" className="space-y-4" data-testid="content-suggestions">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">Website Suggestions</h3>
                      <p className="text-sm text-muted-foreground">
                        Review AI-extracted data from the business website
                      </p>
                    </div>
                    {websiteSuggestions.length > 0 && (
                      <Button
                        size="sm"
                        onClick={handleApplySuggestions}
                        data-testid="button-apply-suggestions"
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Apply Selected
                      </Button>
                    )}
                  </div>

                  {websiteSuggestions.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Globe className="h-12 w-12 mx-auto mb-4 opacity-40" />
                      <p>No website scanned yet</p>
                      <p className="text-sm">Enter a URL and click scan to extract business info</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {websiteSuggestions.map((suggestion, index) => (
                        <div 
                          key={index}
                          className="flex items-start gap-3 p-3 rounded-lg border border-white/10 bg-white/3"
                        >
                          <Checkbox
                            checked={suggestion.selected}
                            onCheckedChange={(checked) => {
                              setWebsiteSuggestions(prev => 
                                prev.map((s, i) => i === index ? { ...s, selected: !!checked } : s)
                              );
                            }}
                            data-testid={`checkbox-suggestion-${index}`}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {suggestion.field}
                              </Badge>
                              <Badge 
                                variant="secondary" 
                                className={
                                  suggestion.confidence >= 0.8 ? 'bg-emerald-500/20 text-emerald-400' :
                                  suggestion.confidence >= 0.6 ? 'bg-amber-500/20 text-amber-400' :
                                  'bg-rose-500/20 text-rose-400'
                                }
                              >
                                {Math.round(suggestion.confidence * 100)}%
                              </Badge>
                            </div>
                            <p className="text-sm mt-1 truncate">
                              {suggestion.field === 'faq' 
                                ? JSON.parse(suggestion.value).question 
                                : suggestion.value}
                            </p>
                            <a 
                              href={suggestion.sourceUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-xs text-cyan-400 hover:underline flex items-center gap-1 mt-1"
                            >
                              <ExternalLink className="h-3 w-3" />
                              Source
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="kb" className="space-y-6" data-testid="content-kb">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold flex items-center gap-2">
                        <Wrench className="h-4 w-4" /> Services
                      </h3>
                      <Button size="sm" variant="outline" onClick={addService} data-testid="button-add-service">
                        <Plus className="h-3 w-3 mr-1" /> Add
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {kbServices.map((service, index) => (
                        <div key={index} className="flex gap-2">
                          <Input
                            value={service.name}
                            onChange={(e) => {
                              setKbServices(prev => prev.map((s, i) => 
                                i === index ? { ...s, name: e.target.value } : s
                              ));
                            }}
                            placeholder="Service name"
                            className="flex-1"
                            data-testid={`input-service-name-${index}`}
                          />
                          <Button 
                            size="icon" 
                            variant="ghost"
                            onClick={() => removeService(index)}
                            data-testid={`button-remove-service-${index}`}
                          >
                            <Trash2 className="h-4 w-4 text-rose-400" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold flex items-center gap-2">
                        <HelpCircle className="h-4 w-4" /> FAQs
                      </h3>
                      <Button size="sm" variant="outline" onClick={addFaq} data-testid="button-add-faq">
                        <Plus className="h-3 w-3 mr-1" /> Add
                      </Button>
                    </div>
                    <div className="space-y-3">
                      {kbFaqs.map((faq, index) => (
                        <div key={index} className="p-3 rounded-lg border border-white/10 bg-white/3 space-y-2">
                          <div className="flex gap-2">
                            <Input
                              value={faq.question}
                              onChange={(e) => {
                                setKbFaqs(prev => prev.map((f, i) => 
                                  i === index ? { ...f, question: e.target.value } : f
                                ));
                              }}
                              placeholder="Question"
                              data-testid={`input-faq-question-${index}`}
                            />
                            <Button 
                              size="icon" 
                              variant="ghost"
                              onClick={() => removeFaq(index)}
                              data-testid={`button-remove-faq-${index}`}
                            >
                              <Trash2 className="h-4 w-4 text-rose-400" />
                            </Button>
                          </div>
                          <Textarea
                            value={faq.answer}
                            onChange={(e) => {
                              setKbFaqs(prev => prev.map((f, i) => 
                                i === index ? { ...f, answer: e.target.value } : f
                              ));
                            }}
                            placeholder="Answer"
                            rows={2}
                            data-testid={`input-faq-answer-${index}`}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="font-semibold flex items-center gap-2 mb-3">
                      <Clock className="h-4 w-4" /> Business Hours
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(kbHours).map(([day, hours]) => (
                        <div key={day} className="flex items-center gap-2">
                          <Label className="w-24 text-sm">{day}</Label>
                          <Input
                            value={hours}
                            onChange={(e) => {
                              setKbHours(prev => ({ ...prev, [day]: e.target.value }));
                            }}
                            placeholder="9 AM - 5 PM"
                            className="flex-1"
                            data-testid={`input-hours-${day.toLowerCase()}`}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="font-semibold flex items-center gap-2 mb-3">
                      <FileText className="h-4 w-4" /> Policies & Disclaimers
                    </h3>
                    <Textarea
                      value={kbPolicies}
                      onChange={(e) => setKbPolicies(e.target.value)}
                      placeholder="Cancellation policy, payment terms, legal disclaimers..."
                      rows={4}
                      data-testid="input-policies"
                    />
                    {selectedTemplate?.disclaimer && (
                      <div className="mt-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
                        <p className="text-xs text-amber-400 font-medium mb-1">Industry Default Disclaimer:</p>
                        <p className="text-xs text-white/60 whitespace-pre-line">{selectedTemplate.disclaimer}</p>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="ctas" className="space-y-4" data-testid="content-ctas">
                  <div>
                    <h3 className="font-semibold mb-3">Widget CTA Buttons</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {selectedTemplate?.ctaButtons?.map((cta) => (
                        <div 
                          key={cta.id}
                          className={`p-4 rounded-lg border ${
                            cta.isPrimary 
                              ? 'border-cyan-500/40 bg-cyan-500/10' 
                              : 'border-white/10 bg-white/3'
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <MessageSquare className="h-4 w-4" />
                            <span className="font-medium">{cta.label}</span>
                            {cta.isPrimary && (
                              <Badge className="bg-cyan-500/20 text-cyan-400">Primary</Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">{cta.prompt}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="font-semibold mb-3">Booking Flow Preview</h3>
                    <div className={`p-4 rounded-lg border ${
                      failsafeStatus.status === 'ok' ? 'border-emerald-500/40 bg-emerald-500/10' :
                      failsafeStatus.status === 'warning' ? 'border-amber-500/40 bg-amber-500/10' :
                      failsafeStatus.status === 'failsafe' ? 'border-rose-500/40 bg-rose-500/10' :
                      'border-cyan-500/40 bg-cyan-500/10'
                    }`}>
                      <div className="flex items-center gap-3">
                        {failsafeStatus.status === 'ok' && <CheckCircle className="h-6 w-6 text-emerald-400" />}
                        {failsafeStatus.status === 'warning' && <AlertTriangle className="h-6 w-6 text-amber-400" />}
                        {failsafeStatus.status === 'failsafe' && <Shield className="h-6 w-6 text-rose-400" />}
                        {failsafeStatus.status === 'internal' && <Zap className="h-6 w-6 text-cyan-400" />}
                        <div>
                          <p className="font-medium">{failsafeStatus.message}</p>
                          <p className="text-sm text-muted-foreground">
                            {bookingPreference === 'internal' 
                              ? 'AI will collect contact info and create a lead/booking request' 
                              : failsafeStatus.status === 'ok'
                                ? 'Users will be redirected to external booking system'
                                : 'Failsafe active: Will capture info internally instead'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {selectedTemplate?.bookingProfile.externalProviders && (
                      <div className="mt-4">
                        <p className="text-sm text-muted-foreground mb-2">Compatible providers:</p>
                        <div className="flex flex-wrap gap-2">
                          {selectedTemplate.bookingProfile.externalProviders.map((provider) => (
                            <Badge key={provider} variant="outline">{provider}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="notifications" className="space-y-4" data-testid="content-notifications">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">Lead Notifications</h3>
                      <p className="text-sm text-muted-foreground">
                        Get notified when new leads come in
                      </p>
                    </div>
                    <Switch
                      checked={notificationEnabled}
                      onCheckedChange={setNotificationEnabled}
                      data-testid="switch-notifications"
                    />
                  </div>

                  {notificationEnabled && (
                    <>
                      <div>
                        <Label>Notification Recipient</Label>
                        <Input
                          type="email"
                          value={notificationRecipient}
                          onChange={(e) => setNotificationRecipient(e.target.value)}
                          placeholder={form.getValues("email") || "email@example.com"}
                          className="mt-1"
                          data-testid="input-notification-recipient"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Leave blank to use the business email
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleSendTestNotification}
                          disabled={testNotificationStatus === 'sending'}
                          data-testid="button-send-test-notification"
                        >
                          {testNotificationStatus === 'sending' ? (
                            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                          ) : (
                            <Send className="h-4 w-4 mr-1" />
                          )}
                          Send Test
                        </Button>
                        
                        {testNotificationStatus === 'sent' && (
                          <Badge className="bg-emerald-500/20 text-emerald-400">
                            <Check className="h-3 w-3 mr-1" /> Sent
                          </Badge>
                        )}
                        {testNotificationStatus === 'error' && (
                          <Badge className="bg-rose-500/20 text-rose-400">
                            <X className="h-3 w-3 mr-1" /> Failed
                          </Badge>
                        )}
                      </div>
                    </>
                  )}
                </TabsContent>

                <TabsContent value="preview" className="space-y-4" data-testid="content-preview">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">Widget Preview</h3>
                      <p className="text-sm text-muted-foreground">
                        See how the chat widget will appear
                      </p>
                    </div>
                  </div>

                  <div className="relative bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl p-6 min-h-[400px] flex items-end justify-end">
                    <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10 rounded-xl" />
                    
                    <div className="relative w-80 bg-slate-950 rounded-2xl shadow-2xl border border-white/10 overflow-hidden">
                      <div 
                        className="p-4 text-white"
                        style={{ 
                          background: `linear-gradient(135deg, ${selectedTemplate?.defaultConfig?.theme?.primaryColor || '#00E5CC'} 0%, ${selectedTemplate?.defaultConfig?.theme?.primaryColor || '#00E5CC'}88 100%)` 
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                            <Bot className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-semibold">{form.getValues("businessName") || "Business Name"}</p>
                            <p className="text-xs opacity-80">AI Assistant</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="p-4 space-y-3 bg-slate-950">
                        <div className="bg-white/10 rounded-2xl rounded-tl-md p-3 max-w-[80%]">
                          <p className="text-sm text-white/90">
                            {selectedTemplate?.defaultConfig?.theme?.welcomeMessage || "Hello! How can I help you today?"}
                          </p>
                        </div>
                        
                        <div className="flex flex-wrap gap-2">
                          {selectedTemplate?.ctaButtons?.slice(0, 3).map((cta) => (
                            <button
                              key={cta.id}
                              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                                cta.isPrimary 
                                  ? 'text-white' 
                                  : 'bg-white/10 text-white/80 hover:bg-white/20'
                              }`}
                              style={cta.isPrimary ? { 
                                background: selectedTemplate?.defaultConfig?.theme?.primaryColor || '#00E5CC' 
                              } : undefined}
                            >
                              {cta.label}
                            </button>
                          ))}
                        </div>
                      </div>
                      
                      <div className="p-3 border-t border-white/10">
                        <div className="flex items-center gap-2 bg-white/5 rounded-full px-4 py-2">
                          <input 
                            type="text" 
                            placeholder="Type a message..." 
                            className="flex-1 bg-transparent text-sm text-white/80 outline-none"
                            disabled
                          />
                          <button 
                            className="w-8 h-8 rounded-full flex items-center justify-center"
                            style={{ background: selectedTemplate?.defaultConfig?.theme?.primaryColor || '#00E5CC' }}
                          >
                            <Send className="h-4 w-4 text-white" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {draftState?.embedCode && (
                    <div className="mt-4">
                      <Label className="mb-2 block">Embed Code</Label>
                      <div className="relative">
                        <pre className="p-4 rounded-lg bg-slate-900 border border-white/10 text-xs text-white/70 overflow-x-auto">
                          {draftState.embedCode}
                        </pre>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="absolute top-2 right-2"
                          onClick={copyEmbedCode}
                          data-testid="button-copy-embed-preview"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {draftState?.qaResults && (
          <Card className="mt-6 bg-white/3 border-white/10" data-testid="card-qa-results">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className={draftState.qaResults.passed ? "text-emerald-400" : "text-rose-400"} />
                QA Gate Results
                <Badge className={draftState.qaResults.passed ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400"}>
                  {draftState.qaResults.passed ? "PASSED" : "FAILED"}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {draftState.qaResults.errors?.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-medium text-rose-400 mb-2">Errors ({draftState.qaResults.errors.length})</h4>
                  <ul className="space-y-1">
                    {draftState.qaResults.errors.map((error, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <X className="h-4 w-4 text-rose-400 mt-0.5" />
                        <span>{error}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {draftState.qaResults.warnings?.length > 0 && (
                <div>
                  <h4 className="font-medium text-amber-400 mb-2">Warnings ({draftState.qaResults.warnings.length})</h4>
                  <ul className="space-y-1">
                    {draftState.qaResults.warnings.map((warning, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <AlertTriangle className="h-4 w-4 text-amber-400 mt-0.5" />
                        <span>{warning}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}

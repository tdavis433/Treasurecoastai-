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

interface ServiceSuggestion {
  name: string;
  description?: string;
  price?: string;
  sourcePageUrl: string;
  confidence: number;
  selected: boolean;
}

interface FaqSuggestion {
  question: string;
  answer: string;
  sourcePageUrl: string;
  confidence: number;
  selected: boolean;
}

interface ContactSuggestion {
  type: 'phone' | 'email' | 'address' | 'hours';
  value: string;
  sourcePageUrl: string;
  confidence: number;
  selected: boolean;
}

interface BookingLinkSuggestion {
  url: string;
  provider?: string;
  sourcePageUrl: string;
  confidence: number;
  selected: boolean;
}

interface SocialLinkSuggestion {
  platform: string;
  url: string;
  sourcePageUrl: string;
  confidence: number;
  selected: boolean;
}

interface PolicySuggestion {
  value: string;
  category: string;
  sourcePageUrl: string;
  confidence: number;
  selected: boolean;
}

interface WebsiteImportData {
  businessName?: string;
  tagline?: string;
  description?: string;
  services: ServiceSuggestion[];
  faqs: FaqSuggestion[];
  contact: ContactSuggestion[];
  bookingLinks: BookingLinkSuggestion[];
  socialLinks: SocialLinkSuggestion[];
  policies: PolicySuggestion[];
  pagesScanned: number;
  scanDuration: number;
  sourceUrls: string[];
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
  websiteUrl: z.string().url("Please enter a valid URL").min(1, "Website URL is required"),
  primaryPhone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  primaryCTA: z.enum(["tour", "consult", "book", "reserve", "estimate", "call"]),
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
  const [importData, setImportData] = useState<WebsiteImportData | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  
  const [kbServices, setKbServices] = useState<Array<{ name: string; description: string }>>([]);
  const [kbFaqs, setKbFaqs] = useState<Array<{ question: string; answer: string }>>([]);
  const [kbPolicies, setKbPolicies] = useState("");
  const [previewLink, setPreviewLink] = useState<{ url: string; expiresAt: string } | null>(null);
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
  const [kbHours, setKbHours] = useState<Record<string, string>>({
    Monday: "9:00 AM - 5:00 PM",
    Tuesday: "9:00 AM - 5:00 PM",
    Wednesday: "9:00 AM - 5:00 PM",
    Thursday: "9:00 AM - 5:00 PM",
    Friday: "9:00 AM - 5:00 PM",
    Saturday: "Closed",
    Sunday: "Closed",
  });

  // Style state for widget customization
  const [styleConfig, setStyleConfig] = useState({
    primaryColor: "#00CFFF",
    accentColor: "#9D5CFF",
    theme: "dark" as "dark" | "light",
    logoUrl: "",
  });
  const [isMatchingTheme, setIsMatchingTheme] = useState(false);

  const { data: templates, isLoading: templatesLoading } = useQuery<IndustryTemplate[]>({
    queryKey: ["/api/agency-onboarding/templates"],
  });

  const form = useForm<IntakeFormData>({
    resolver: zodResolver(intakeFormSchema),
    defaultValues: {
      businessName: "",
      websiteUrl: "",
      primaryPhone: "",
      email: "",
      primaryCTA: "consult",
      externalBookingUrl: "",
      notes: "",
      doNotSay: "",
    },
  });

  // Match Website Theme handler
  const handleMatchWebsiteTheme = async () => {
    const websiteUrl = form.getValues("websiteUrl");
    if (!websiteUrl) {
      toast({
        title: "Enter Website URL",
        description: "Please enter a website URL first to extract theme colors.",
        variant: "destructive",
      });
      return;
    }
    
    setIsMatchingTheme(true);
    try {
      const response = await apiRequest("POST", "/api/admin/extract-theme", { url: websiteUrl }) as {
        primaryColor?: string;
        accentColor?: string;
        logoUrl?: string;
        theme?: "dark" | "light";
      };
      
      setStyleConfig(prev => ({
        ...prev,
        primaryColor: response.primaryColor || prev.primaryColor,
        accentColor: response.accentColor || prev.accentColor,
        logoUrl: response.logoUrl || prev.logoUrl,
        theme: response.theme || prev.theme,
      }));
      
      toast({
        title: "Theme Matched",
        description: "Widget colors updated to match website theme.",
      });
    } catch (error) {
      toast({
        title: "Theme Extraction Failed",
        description: "Could not extract colors from website. Using defaults.",
        variant: "destructive",
      });
    } finally {
      setIsMatchingTheme(false);
    }
  };

  // Launch checklist items
  const getLaunchChecklist = () => {
    const checks = [
      { 
        id: "business", 
        label: "Business Info", 
        status: form.getValues("businessName") ? "pass" : "fail" as "pass" | "warn" | "fail"
      },
      { 
        id: "website", 
        label: "Website Scanned", 
        status: importData ? "pass" : "warn" as "pass" | "warn" | "fail"
      },
      { 
        id: "kb", 
        label: "KB Content", 
        status: (kbServices.length >= 3 || kbFaqs.length >= 5) ? "pass" : (kbServices.length > 0 || kbFaqs.length > 0) ? "warn" : "fail" as "pass" | "warn" | "fail"
      },
      { 
        id: "contact", 
        label: "Contact Info", 
        status: (form.getValues("primaryPhone") || form.getValues("email")) ? "pass" : "fail" as "pass" | "warn" | "fail"
      },
      { 
        id: "draft", 
        label: "Draft Created", 
        status: draftState ? "pass" : "warn" as "pass" | "warn" | "fail"
      },
      { 
        id: "qa", 
        label: "QA Passed", 
        status: draftState?.status === "qa_passed" || draftState?.status === "live" ? "pass" : draftState?.qaResults ? "fail" : "warn" as "pass" | "warn" | "fail"
      },
    ];
    return checks;
  };

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
      notification: null,
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
      const response = await apiRequest("POST", "/api/admin/website-import", { url: websiteUrl }) as {
        businessName?: string;
        tagline?: string;
        description?: string;
        services: Array<{ name: string; description?: string; price?: string; sourcePageUrl: string; confidence: number }>;
        faqs: Array<{ question: string; answer: string; sourcePageUrl: string; confidence: number }>;
        contact: Array<{ type: 'phone' | 'email' | 'address' | 'hours'; value: string; sourcePageUrl: string; confidence: number }>;
        bookingLinks: Array<{ url: string; provider?: string; sourcePageUrl: string; confidence: number }>;
        socialLinks: Array<{ platform: string; url: string; sourcePageUrl: string; confidence: number }>;
        policies: Array<{ value: string; category: string; sourcePageUrl: string; confidence: number }>;
        pagesScanned: number;
        scanDuration: number;
        sourceUrls: string[];
      };
      
      // Transform response into structured import data with selection state
      const importResult: WebsiteImportData = {
        businessName: response.businessName,
        tagline: response.tagline,
        description: response.description,
        services: (response.services || []).map(s => ({ ...s, selected: true })),
        faqs: (response.faqs || []).map(f => ({ ...f, selected: true })),
        contact: (response.contact || []).map(c => ({ ...c, selected: true })),
        bookingLinks: (response.bookingLinks || []).map(b => ({ ...b, selected: true })),
        socialLinks: (response.socialLinks || []).map(s => ({ ...s, selected: false })),
        policies: (response.policies || []).map(p => ({ ...p, selected: true })),
        pagesScanned: response.pagesScanned || 0,
        scanDuration: response.scanDuration || 0,
        sourceUrls: response.sourceUrls || [],
      };
      
      setImportData(importResult);
      
      // Also populate legacy websiteSuggestions for backwards compatibility
      const legacySuggestions: WebsiteSuggestion[] = [];
      if (response.businessName) {
        legacySuggestions.push({ field: "businessName", value: response.businessName, sourceUrl: websiteUrl, confidence: 0.9, selected: true });
      }
      response.contact?.forEach(c => {
        if (c.type === 'phone') {
          legacySuggestions.push({ field: "phone", value: c.value, sourceUrl: c.sourcePageUrl, confidence: c.confidence, selected: true });
        } else if (c.type === 'email') {
          legacySuggestions.push({ field: "email", value: c.value, sourceUrl: c.sourcePageUrl, confidence: c.confidence, selected: true });
        }
      });
      setWebsiteSuggestions(legacySuggestions);
      
      setActiveTab("suggestions");
      
      const totalItems = importResult.services.length + importResult.faqs.length + 
        importResult.contact.length + importResult.bookingLinks.length + importResult.policies.length;
      
      toast({
        title: "Website Scanned",
        description: `Scanned ${response.pagesScanned} pages, found ${totalItems} suggestions to review.`,
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
    if (!importData) {
      // Legacy path for backwards compatibility
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
        }
      });
      toast({
        title: "Suggestions Applied",
        description: `Applied ${selected.length} suggestions to the form.`,
      });
      return;
    }

    let appliedCount = 0;

    // Apply business name
    if (importData.businessName) {
      form.setValue("businessName", importData.businessName);
      appliedCount++;
    }

    // Apply contact info
    importData.contact.filter(c => c.selected).forEach(c => {
      switch (c.type) {
        case 'phone':
          form.setValue("primaryPhone", c.value);
          appliedCount++;
          break;
        case 'email':
          form.setValue("email", c.value);
          appliedCount++;
          break;
      }
    });

    // Apply services (merge with existing, avoid duplicates)
    const selectedServices = importData.services.filter(s => s.selected);
    if (selectedServices.length > 0) {
      setKbServices(prev => {
        const existingNames = new Set(prev.map(s => s.name.toLowerCase()));
        const newServices = selectedServices
          .filter(s => !existingNames.has(s.name.toLowerCase()))
          .map(s => ({ name: s.name, description: s.description || "" }));
        return [...prev, ...newServices];
      });
      appliedCount += selectedServices.length;
    }

    // Apply FAQs (merge with existing, avoid duplicates)
    const selectedFaqs = importData.faqs.filter(f => f.selected);
    if (selectedFaqs.length > 0) {
      setKbFaqs(prev => {
        const existingQuestions = new Set(prev.map(f => f.question.toLowerCase().trim()));
        const newFaqs = selectedFaqs
          .filter(f => !existingQuestions.has(f.question.toLowerCase().trim()))
          .map(f => ({ question: f.question, answer: f.answer }));
        return [...prev, ...newFaqs];
      });
      appliedCount += selectedFaqs.length;
    }

    // Apply policies
    const selectedPolicies = importData.policies.filter(p => p.selected);
    if (selectedPolicies.length > 0) {
      const policyText = selectedPolicies.map(p => p.value).join("\n\n");
      setKbPolicies(prev => prev ? `${prev}\n\n${policyText}` : policyText);
      appliedCount += selectedPolicies.length;
    }

    // Apply external booking URL if available
    const selectedBooking = importData.bookingLinks.find(b => b.selected);
    if (selectedBooking) {
      form.setValue("externalBookingUrl", selectedBooking.url);
      appliedCount++;
    }

    toast({
      title: "Suggestions Applied",
      description: `Applied ${appliedCount} items to the form and knowledge base.`,
    });
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

  const generatePreviewLink = async () => {
    if (!draftState?.clientId || !draftState?.botId) {
      toast({
        title: "Draft Required",
        description: "Please create a draft setup first.",
        variant: "destructive",
      });
      return;
    }
    
    setIsGeneratingPreview(true);
    try {
      const response = await apiRequest("POST", "/api/admin/preview-link", {
        workspaceSlug: draftState.clientId,
        botId: draftState.botId,
      });
      
      setPreviewLink({
        url: response.previewUrl,
        expiresAt: response.expiresAt,
      });
      
      navigator.clipboard.writeText(response.previewUrl);
      toast({
        title: "Preview Link Generated!",
        description: "Link copied to clipboard. Valid for 24 hours.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate preview link.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingPreview(false);
    }
  };

  const copyPreviewLink = () => {
    if (previewLink?.url) {
      navigator.clipboard.writeText(previewLink.url);
      toast({
        title: "Copied!",
        description: "Preview link copied to clipboard.",
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
    
    // No external URL = using internal request capture (this is fine)
    if (!externalUrl || externalUrl.trim() === "") {
      return { status: "internal", message: "Using internal request capture" };
    }
    
    // Validate the external URL
    try {
      const parsed = new URL(externalUrl);
      if (parsed.protocol !== "https:") {
        return { status: "warning", message: "URL should be HTTPS for security" };
      }
      return { status: "ok", message: "External booking configured" };
    } catch {
      // Invalid URL format - will fall back to internal
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

        {/* Launch Checklist */}
        <div className="mb-6 p-4 rounded-lg border border-white/10 bg-white/3" data-testid="launch-checklist">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle className="h-5 w-5 text-cyan-400" />
            <span className="font-medium">Launch Checklist</span>
          </div>
          <div className="flex flex-wrap gap-3">
            {getLaunchChecklist().map((item) => (
              <div 
                key={item.id}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm ${
                  item.status === 'pass' 
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/40' 
                    : item.status === 'warn'
                    ? 'bg-amber-500/15 text-amber-400 border border-amber-500/40'
                    : 'bg-rose-500/15 text-rose-400 border border-rose-500/40'
                }`}
                data-testid={`checklist-item-${item.id}`}
              >
                {item.status === 'pass' && <Check className="h-3 w-3" />}
                {item.status === 'warn' && <AlertTriangle className="h-3 w-3" />}
                {item.status === 'fail' && <X className="h-3 w-3" />}
                <span>{item.label}</span>
              </div>
            ))}
          </div>
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

                  <div className="p-3 rounded-lg border border-dashed border-cyan-400/30 bg-cyan-500/5">
                    <FormField
                      control={form.control}
                      name="websiteUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Globe className="h-4 w-4" />
                            Website URL *
                            <Badge variant="secondary" className="text-xs">Scan to auto-fill</Badge>
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
                          <FormMessage />
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

                  </div>

                  <Separator />

                  <FormField
                    control={form.control}
                    name="primaryCTA"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Primary Call-to-Action *</FormLabel>
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
                        <FormDescription>What action should the AI guide users toward?</FormDescription>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="externalBookingUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1">
                          <Link2 className="h-3 w-3" /> External Booking URL (Optional)
                        </FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="https://booking.example.com" 
                            {...field} 
                            data-testid="input-external-booking-url"
                          />
                        </FormControl>
                        <FormDescription>Leave empty to use internal request capture</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

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
                  
                  <Button
                    variant="outline"
                    className="w-full gap-2 border-purple-500/30 text-purple-400 hover:bg-purple-500/10"
                    onClick={generatePreviewLink}
                    disabled={isGeneratingPreview}
                    data-testid="button-generate-preview"
                  >
                    {isGeneratingPreview ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Link2 className="h-4 w-4" />
                    )}
                    Generate Preview Link (24h)
                  </Button>
                  
                  {previewLink && (
                    <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/30 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-purple-400">Preview Link</span>
                        <span className="text-xs text-muted-foreground">
                          Expires: {new Date(previewLink.expiresAt).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <Input 
                          value={previewLink.url} 
                          readOnly 
                          className="text-xs bg-black/30 border-purple-500/20"
                          data-testid="input-preview-link"
                        />
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={copyPreviewLink}
                          data-testid="button-copy-preview"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                  
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
                <TabsList className="grid grid-cols-4 mb-4">
                  <TabsTrigger value="suggestions" className="gap-1" data-testid="tab-suggestions">
                    <Globe className="h-3 w-3" />
                    <span className="hidden sm:inline">Suggestions</span>
                  </TabsTrigger>
                  <TabsTrigger value="kb" className="gap-1" data-testid="tab-kb">
                    <Layers className="h-3 w-3" />
                    <span className="hidden sm:inline">KB Draft</span>
                  </TabsTrigger>
                  <TabsTrigger value="style" className="gap-1" data-testid="tab-style">
                    <Palette className="h-3 w-3" />
                    <span className="hidden sm:inline">Style</span>
                  </TabsTrigger>
                  <TabsTrigger value="preview" className="gap-1" data-testid="tab-preview">
                    <Eye className="h-3 w-3" />
                    <span className="hidden sm:inline">Preview</span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="suggestions" className="space-y-4" data-testid="content-suggestions">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <h3 className="font-semibold">Website Suggestions</h3>
                      <p className="text-sm text-muted-foreground">
                        Review AI-extracted data from the business website
                      </p>
                    </div>
                    {importData && (
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

                  {!importData ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Globe className="h-12 w-12 mx-auto mb-4 opacity-40" />
                      <p>No website scanned yet</p>
                      <p className="text-sm">Enter a URL and click scan to extract business info</p>
                    </div>
                  ) : (
                    <div className="space-y-6 max-h-[500px] overflow-y-auto pr-2">
                      {/* Scan Summary */}
                      <div className="p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/30">
                        <div className="flex items-center gap-2 text-sm">
                          <CheckCircle className="h-4 w-4 text-cyan-400" />
                          <span>Scanned {importData.pagesScanned} pages in {(importData.scanDuration / 1000).toFixed(1)}s</span>
                        </div>
                        {importData.businessName && (
                          <p className="mt-1 font-medium">{importData.businessName}</p>
                        )}
                        {importData.tagline && (
                          <p className="text-sm text-muted-foreground">{importData.tagline}</p>
                        )}
                      </div>

                      {/* Services Section */}
                      {importData.services.length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <Wrench className="h-4 w-4 text-cyan-400" />
                            <h4 className="font-medium">Services ({importData.services.length})</h4>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="ml-auto text-xs h-6"
                              onClick={() => setImportData(prev => prev ? {
                                ...prev,
                                services: prev.services.map(s => ({ ...s, selected: !prev.services.every(x => x.selected) }))
                              } : null)}
                              data-testid="button-toggle-all-services"
                            >
                              Toggle All
                            </Button>
                          </div>
                          <div className="space-y-2">
                            {importData.services.map((service, index) => (
                              <div key={index} className="flex items-start gap-3 p-2 rounded-lg border border-white/10 bg-white/3">
                                <Checkbox
                                  checked={service.selected}
                                  onCheckedChange={(checked) => {
                                    setImportData(prev => prev ? {
                                      ...prev,
                                      services: prev.services.map((s, i) => i === index ? { ...s, selected: !!checked } : s)
                                    } : null);
                                  }}
                                  data-testid={`checkbox-service-${index}`}
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-medium text-sm">{service.name}</span>
                                    {service.price && <Badge variant="secondary" className="text-xs">{service.price}</Badge>}
                                    <Badge variant="outline" className={`text-xs ${service.confidence >= 0.8 ? 'text-emerald-400' : 'text-amber-400'}`}>
                                      {Math.round(service.confidence * 100)}%
                                    </Badge>
                                  </div>
                                  {service.description && (
                                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{service.description}</p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* FAQs Section */}
                      {importData.faqs.length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <HelpCircle className="h-4 w-4 text-cyan-400" />
                            <h4 className="font-medium">FAQs ({importData.faqs.length})</h4>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="ml-auto text-xs h-6"
                              onClick={() => setImportData(prev => prev ? {
                                ...prev,
                                faqs: prev.faqs.map(f => ({ ...f, selected: !prev.faqs.every(x => x.selected) }))
                              } : null)}
                              data-testid="button-toggle-all-faqs"
                            >
                              Toggle All
                            </Button>
                          </div>
                          <div className="space-y-2">
                            {importData.faqs.map((faq, index) => (
                              <div key={index} className="flex items-start gap-3 p-2 rounded-lg border border-white/10 bg-white/3">
                                <Checkbox
                                  checked={faq.selected}
                                  onCheckedChange={(checked) => {
                                    setImportData(prev => prev ? {
                                      ...prev,
                                      faqs: prev.faqs.map((f, i) => i === index ? { ...f, selected: !!checked } : f)
                                    } : null);
                                  }}
                                  data-testid={`checkbox-faq-${index}`}
                                />
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-sm">{faq.question}</p>
                                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{faq.answer}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Contact Info Section */}
                      {importData.contact.length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <Phone className="h-4 w-4 text-cyan-400" />
                            <h4 className="font-medium">Contact Info ({importData.contact.length})</h4>
                          </div>
                          <div className="space-y-2">
                            {importData.contact.map((contact, index) => (
                              <div key={index} className="flex items-center gap-3 p-2 rounded-lg border border-white/10 bg-white/3">
                                <Checkbox
                                  checked={contact.selected}
                                  onCheckedChange={(checked) => {
                                    setImportData(prev => prev ? {
                                      ...prev,
                                      contact: prev.contact.map((c, i) => i === index ? { ...c, selected: !!checked } : c)
                                    } : null);
                                  }}
                                  data-testid={`checkbox-contact-${index}`}
                                />
                                <Badge variant="outline" className="text-xs capitalize">{contact.type}</Badge>
                                <span className="text-sm flex-1 truncate">{contact.value}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Booking Links Section */}
                      {importData.bookingLinks.length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <Calendar className="h-4 w-4 text-cyan-400" />
                            <h4 className="font-medium">Booking Links ({importData.bookingLinks.length})</h4>
                          </div>
                          <div className="space-y-2">
                            {importData.bookingLinks.map((booking, index) => (
                              <div key={index} className="flex items-center gap-3 p-2 rounded-lg border border-white/10 bg-white/3">
                                <Checkbox
                                  checked={booking.selected}
                                  onCheckedChange={(checked) => {
                                    setImportData(prev => prev ? {
                                      ...prev,
                                      bookingLinks: prev.bookingLinks.map((b, i) => i === index ? { ...b, selected: !!checked } : b)
                                    } : null);
                                  }}
                                  data-testid={`checkbox-booking-${index}`}
                                />
                                {booking.provider && <Badge variant="secondary" className="text-xs">{booking.provider}</Badge>}
                                <a 
                                  href={booking.url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-sm text-cyan-400 hover:underline flex items-center gap-1 truncate flex-1"
                                >
                                  <Link2 className="h-3 w-3" />
                                  {booking.url}
                                </a>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Policies Section */}
                      {importData.policies.length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <FileText className="h-4 w-4 text-cyan-400" />
                            <h4 className="font-medium">Policies ({importData.policies.length})</h4>
                          </div>
                          <div className="space-y-2">
                            {importData.policies.map((policy, index) => (
                              <div key={index} className="flex items-start gap-3 p-2 rounded-lg border border-white/10 bg-white/3">
                                <Checkbox
                                  checked={policy.selected}
                                  onCheckedChange={(checked) => {
                                    setImportData(prev => prev ? {
                                      ...prev,
                                      policies: prev.policies.map((p, i) => i === index ? { ...p, selected: !!checked } : p)
                                    } : null);
                                  }}
                                  data-testid={`checkbox-policy-${index}`}
                                />
                                <div className="flex-1 min-w-0">
                                  <Badge variant="outline" className="text-xs capitalize mb-1">{policy.category}</Badge>
                                  <p className="text-sm line-clamp-3">{policy.value}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Social Links (collapsed by default) */}
                      {importData.socialLinks.length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <Globe className="h-4 w-4 text-cyan-400" />
                            <h4 className="font-medium text-muted-foreground">Social Links ({importData.socialLinks.length})</h4>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {importData.socialLinks.map((social, index) => (
                              <a
                                key={index}
                                href={social.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-cyan-400 hover:underline flex items-center gap-1 px-2 py-1 rounded bg-white/5"
                              >
                                <ExternalLink className="h-3 w-3" />
                                {social.platform}
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
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

                <TabsContent value="style" className="space-y-4" data-testid="content-style">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">Widget Style</h3>
                      <p className="text-sm text-muted-foreground">
                        Customize the chat widget appearance
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleMatchWebsiteTheme}
                      disabled={isMatchingTheme || !form.getValues("websiteUrl")}
                      className="gap-2"
                      data-testid="button-match-theme"
                    >
                      {isMatchingTheme ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Sparkles className="h-4 w-4" />
                      )}
                      Match Website Theme
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="mb-2 block">Primary Color</Label>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-10 h-10 rounded-lg border border-white/20 cursor-pointer"
                          style={{ backgroundColor: styleConfig.primaryColor }}
                        />
                        <Input
                          type="text"
                          value={styleConfig.primaryColor}
                          onChange={(e) => setStyleConfig(prev => ({ ...prev, primaryColor: e.target.value }))}
                          placeholder="#00CFFF"
                          className="flex-1"
                          data-testid="input-primary-color"
                        />
                      </div>
                    </div>

                    <div>
                      <Label className="mb-2 block">Accent Color</Label>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-10 h-10 rounded-lg border border-white/20 cursor-pointer"
                          style={{ backgroundColor: styleConfig.accentColor }}
                        />
                        <Input
                          type="text"
                          value={styleConfig.accentColor}
                          onChange={(e) => setStyleConfig(prev => ({ ...prev, accentColor: e.target.value }))}
                          placeholder="#9D5CFF"
                          className="flex-1"
                          data-testid="input-accent-color"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label className="mb-2 block">Theme Mode</Label>
                    <div className="flex gap-3">
                      <Button
                        variant={styleConfig.theme === "dark" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setStyleConfig(prev => ({ ...prev, theme: "dark" }))}
                        className="flex-1"
                        data-testid="button-theme-dark"
                      >
                        Dark
                      </Button>
                      <Button
                        variant={styleConfig.theme === "light" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setStyleConfig(prev => ({ ...prev, theme: "light" }))}
                        className="flex-1"
                        data-testid="button-theme-light"
                      >
                        Light
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label className="mb-2 block">Logo URL (Optional)</Label>
                    <Input
                      type="text"
                      value={styleConfig.logoUrl}
                      onChange={(e) => setStyleConfig(prev => ({ ...prev, logoUrl: e.target.value }))}
                      placeholder="https://example.com/logo.png"
                      data-testid="input-logo-url"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Leave blank to use default bot icon
                    </p>
                  </div>

                  {styleConfig.logoUrl && (
                    <div className="p-4 rounded-lg border border-white/10 bg-white/3">
                      <p className="text-xs text-muted-foreground mb-2">Logo Preview</p>
                      <img 
                        src={styleConfig.logoUrl} 
                        alt="Logo preview" 
                        className="h-12 w-auto rounded"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                  )}

                  <div className="p-4 rounded-lg border border-white/10 bg-white/3">
                    <p className="text-xs text-muted-foreground mb-3">Color Preview</p>
                    <div className="flex items-center gap-4">
                      <div 
                        className="px-4 py-2 rounded-full text-white text-sm font-medium"
                        style={{ backgroundColor: styleConfig.primaryColor }}
                      >
                        Primary Button
                      </div>
                      <div 
                        className="px-4 py-2 rounded-full text-white text-sm font-medium"
                        style={{ backgroundColor: styleConfig.accentColor }}
                      >
                        Accent Button
                      </div>
                    </div>
                  </div>
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
                          background: `linear-gradient(135deg, ${styleConfig.primaryColor} 0%, ${styleConfig.primaryColor}88 100%)` 
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

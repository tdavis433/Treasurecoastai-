import { useState, useEffect, useCallback } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from "@/components/ui/glass-card";
import { 
  ChevronRight, ChevronLeft, Check, X, Plus, Loader2, Copy, ExternalLink,
  Building2, MapPin, Clock, FileText, Calendar, Bell, Sparkles, ClipboardCheck,
  AlertCircle, CheckCircle2, Globe, Phone, Mail, Store, Utensils, Scissors, Car,
  Home, Dumbbell, Heart, Building, Palette, Briefcase
} from "lucide-react";

// Industry icons mapping
const INDUSTRY_ICONS: Record<string, typeof Building2> = {
  restaurant: Utensils,
  barber: Scissors,
  auto_shop: Car,
  home_services: Home,
  gym: Dumbbell,
  sober_living: Heart,
  real_estate: Building,
  med_spa: Sparkles,
  tattoo_studio: Palette,
  generic: Briefcase,
};

// Template interface matching what comes from the API
interface Template {
  id: string;
  templateId: string;
  name: string;
  description?: string;
  botType: string;
  icon?: string;
  defaultConfig: {
    businessProfile: Record<string, any>;
    systemPrompt: string;
    faqs: Array<{ question: string; answer: string }>;
    rules: Record<string, any>;
    automations: Record<string, any>;
    theme: Record<string, any>;
    personality: Record<string, any>;
    bookingProfile?: {
      defaultMode: 'internal' | 'external';
      ctas: Array<{ id: string; label: string; kind: string }>;
      appointmentTypes: Array<{
        id: string;
        label: string;
        mode: 'internal' | 'external';
        externalUrlOverride?: string;
        intakeFields: Array<{ key: string; label: string; required: boolean; type: string }>;
        confirmationMessage: string;
      }>;
      failsafe: { externalMissingUrlBehavior: string; pivotAppointmentTypeId: string };
    };
  };
  isActive: boolean;
  displayOrder: number;
}

// Step definitions
const WIZARD_STEPS = [
  { id: 1, label: 'Template', icon: Store, description: 'Choose industry template' },
  { id: 2, label: 'Business', icon: Building2, description: 'Business name & basics' },
  { id: 3, label: 'Contact', icon: MapPin, description: 'Contact & location' },
  { id: 4, label: 'Hours', icon: Clock, description: 'Operating hours' },
  { id: 5, label: 'Knowledge', icon: FileText, description: 'Services, FAQs, About' },
  { id: 6, label: 'Booking', icon: Calendar, description: 'Booking behavior' },
  { id: 7, label: 'Add-ons', icon: Sparkles, description: 'Industry-specific fields' },
  { id: 8, label: 'Notifications', icon: Bell, description: 'Staff alerts' },
  { id: 9, label: 'Review', icon: ClipboardCheck, description: 'Review & launch' },
];

// Default operating hours schedule
const DEFAULT_HOURS = {
  monday: { open: '09:00', close: '17:00', enabled: true },
  tuesday: { open: '09:00', close: '17:00', enabled: true },
  wednesday: { open: '09:00', close: '17:00', enabled: true },
  thursday: { open: '09:00', close: '17:00', enabled: true },
  friday: { open: '09:00', close: '17:00', enabled: true },
  saturday: { open: '10:00', close: '14:00', enabled: false },
  sunday: { open: '', close: '', enabled: false },
};

// Wizard data state interface
export interface WizardData {
  // Step 1: Template
  selectedTemplateId: string;
  
  // Step 2: Business Basics
  businessName: string;
  slug: string;
  plan: string;
  
  // Step 3: Contact/Location
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  websiteUrl: string;
  city: string;
  state: string;
  timezone: string;
  
  // Step 4: Hours
  operatingHours: typeof DEFAULT_HOURS;
  afterHoursMessage: string;
  
  // Step 5: Services/FAQs/About
  aboutBusiness: string;
  services: string[];
  faqs: Array<{ question: string; answer: string }>;
  
  // Step 6: Booking Behavior
  bookingMode: 'internal' | 'external';
  externalBookingUrl: string;
  externalBookingProviderName: string;
  appointmentTypeModes: Record<string, { mode: 'internal' | 'external'; externalUrlOverride?: string }>;
  enableBookingFailsafe: boolean;
  
  // Step 7: Industry Add-ons (dynamic based on template)
  industryAddons: Record<string, any>;
  
  // Step 8: Notifications
  staffEmails: string[];
  staffPhones: string[];
  staffChannelPreference: 'email_only' | 'sms_only' | 'email_and_sms';
  eventToggles: {
    newAppointmentEmail: boolean;
    newAppointmentSms: boolean;
    newPreIntakeEmail: boolean;
    sameDayReminder: boolean;
  };
}

// Initial wizard data
const INITIAL_WIZARD_DATA: WizardData = {
  selectedTemplateId: '',
  businessName: '',
  slug: '',
  plan: 'starter',
  contactName: '',
  contactEmail: '',
  contactPhone: '',
  websiteUrl: '',
  city: '',
  state: '',
  timezone: 'America/New_York',
  operatingHours: DEFAULT_HOURS,
  afterHoursMessage: "Thanks for reaching out! We're currently closed but will respond as soon as we open.",
  aboutBusiness: '',
  services: [],
  faqs: [],
  bookingMode: 'internal',
  externalBookingUrl: '',
  externalBookingProviderName: '',
  appointmentTypeModes: {},
  enableBookingFailsafe: true,
  industryAddons: {},
  staffEmails: [],
  staffPhones: [],
  staffChannelPreference: 'email_only',
  eventToggles: {
    newAppointmentEmail: true,
    newAppointmentSms: false,
    newPreIntakeEmail: false,
    sameDayReminder: false,
  },
};

// Validation errors interface
interface WizardErrors {
  businessName?: string;
  slug?: string;
  contactEmail?: string;
  externalBookingUrl?: string;
}

// Readiness score calculation
function calculateReadinessScore(data: WizardData, selectedTemplate: Template | null): {
  score: number;
  status: 'green' | 'yellow' | 'red';
  checks: Array<{ label: string; passed: boolean; weight: number; required: boolean }>;
} {
  const checks: Array<{ label: string; passed: boolean; weight: number; required: boolean }> = [];
  
  // Required checks (blockers)
  checks.push({ label: 'Business name set', passed: !!data.businessName.trim(), weight: 15, required: true });
  checks.push({ label: 'Contact method available', passed: !!(data.contactEmail || data.contactPhone), weight: 15, required: true });
  checks.push({ label: 'Template selected', passed: !!data.selectedTemplateId, weight: 10, required: true });
  
  // Check hours - at least one day enabled
  const hasHours = Object.values(data.operatingHours).some(day => day.enabled);
  checks.push({ label: 'Operating hours configured', passed: hasHours, weight: 10, required: true });
  
  // Booking mode validation
  const bookingValid = data.bookingMode === 'internal' || 
    (data.bookingMode === 'external' && data.externalBookingUrl.startsWith('https://'));
  checks.push({ label: 'Booking configuration valid', passed: bookingValid, weight: 10, required: true });
  
  // Failsafe check
  checks.push({ label: 'Failsafe enabled', passed: data.enableBookingFailsafe, weight: 5, required: true });
  
  // Optional checks
  checks.push({ label: 'Website URL provided', passed: !!data.websiteUrl, weight: 5, required: false });
  checks.push({ label: 'About section filled', passed: data.aboutBusiness.length > 20, weight: 5, required: false });
  checks.push({ label: 'At least 1 FAQ added', passed: data.faqs.length > 0, weight: 5, required: false });
  checks.push({ label: 'Services listed', passed: data.services.length > 0, weight: 5, required: false });
  checks.push({ label: 'Staff notifications configured', passed: data.staffEmails.length > 0 || data.staffPhones.length > 0, weight: 5, required: false });
  checks.push({ label: 'City/State set', passed: !!(data.city && data.state), weight: 5, required: false });
  
  // Calculate score
  const totalWeight = checks.reduce((sum, c) => sum + c.weight, 0);
  const earnedWeight = checks.filter(c => c.passed).reduce((sum, c) => sum + c.weight, 0);
  const score = Math.round((earnedWeight / totalWeight) * 100);
  
  // Determine status
  const hasRequiredMissing = checks.some(c => c.required && !c.passed);
  let status: 'green' | 'yellow' | 'red';
  if (hasRequiredMissing || score < 70) {
    status = 'red';
  } else if (score < 100) {
    status = 'yellow';
  } else {
    status = 'green';
  }
  
  return { score, status, checks };
}

interface ClientOnboardingWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (result: WizardResult) => void;
}

interface WizardResult {
  success: boolean;
  workspace?: { slug: string; name: string };
  bot?: { botId: string; name: string };
  clientCredentials?: { email: string; temporaryPassword: string; dashboardUrl: string };
  widgetEmbedCode?: string;
  viewAsClientUrl?: string;
}

export function ClientOnboardingWizard({ open, onOpenChange, onSuccess }: ClientOnboardingWizardProps) {
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [data, setData] = useState<WizardData>(INITIAL_WIZARD_DATA);
  const [errors, setErrors] = useState<WizardErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [result, setResult] = useState<WizardResult | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  
  // Autosave state
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // Fetch templates
  const { data: templates = [], isLoading: templatesLoading } = useQuery<Template[]>({
    queryKey: ["/api/super-admin/templates"],
    enabled: open,
  });
  
  // Get selected template
  const selectedTemplate = templates.find(t => t.templateId === data.selectedTemplateId) || null;
  
  // Calculate readiness score
  const readiness = calculateReadinessScore(data, selectedTemplate);
  
  // Validation helpers
  const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isValidHttpsUrl = (url: string) => url.startsWith('https://');
  
  // Validate current step
  const validateStep = useCallback((stepNum: number): boolean => {
    const newErrors: WizardErrors = {};
    
    switch (stepNum) {
      case 1:
        if (!data.selectedTemplateId) {
          toast({ title: "Select a template", description: "Please choose an industry template to continue.", variant: "destructive" });
          return false;
        }
        break;
      case 2:
        if (!data.businessName.trim()) {
          newErrors.businessName = 'Business name is required';
        }
        if (!data.slug.trim()) {
          newErrors.slug = 'Slug is required';
        } else if (!/^[a-z0-9_]+$/.test(data.slug)) {
          newErrors.slug = 'Slug must be lowercase letters, numbers, and underscores only';
        }
        break;
      case 3:
        if (!data.contactEmail.trim()) {
          newErrors.contactEmail = 'Contact email is required';
        } else if (!isValidEmail(data.contactEmail)) {
          newErrors.contactEmail = 'Please enter a valid email address';
        }
        break;
      case 6:
        if (data.bookingMode === 'external' && data.externalBookingUrl && !isValidHttpsUrl(data.externalBookingUrl)) {
          newErrors.externalBookingUrl = 'External booking URL must start with https://';
        }
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [data, toast]);
  
  // Handle next step
  const handleNext = () => {
    if (validateStep(step)) {
      if (step < 9) {
        setStep(s => s + 1);
      }
    } else {
      // Mark all fields as touched for current step
      const touchedFields: Record<string, boolean> = { ...touched };
      if (step === 2) {
        touchedFields.businessName = true;
        touchedFields.slug = true;
      } else if (step === 3) {
        touchedFields.contactEmail = true;
      } else if (step === 6) {
        touchedFields.externalBookingUrl = true;
      }
      setTouched(touchedFields);
    }
  };
  
  // Handle previous step
  const handlePrev = () => {
    if (step > 1) {
      setStep(s => s - 1);
    }
  };
  
  // Reset wizard
  const resetWizard = useCallback(() => {
    setStep(1);
    setData(INITIAL_WIZARD_DATA);
    setErrors({});
    setTouched({});
    setResult(null);
    setLastSaved(null);
  }, []);
  
  // Handle close
  const handleClose = () => {
    if (step === 9 && result?.success) {
      resetWizard();
      onOpenChange(false);
    }
  };
  
  // Handle cancel
  const handleCancel = () => {
    resetWizard();
    onOpenChange(false);
  };
  
  // Update data helper
  const updateData = useCallback((updates: Partial<WizardData>) => {
    setData(d => ({ ...d, ...updates }));
  }, []);
  
  // Auto-generate slug from business name
  useEffect(() => {
    if (data.businessName && !touched.slug) {
      const slug = data.businessName.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
      updateData({ slug });
    }
  }, [data.businessName, touched.slug, updateData]);
  
  // Apply template defaults when selected
  useEffect(() => {
    if (selectedTemplate && data.selectedTemplateId) {
      const defaults = selectedTemplate.defaultConfig;
      const bookingProfile = defaults.bookingProfile;
      
      updateData({
        bookingMode: bookingProfile?.defaultMode || 'internal',
        enableBookingFailsafe: true,
        // Apply template FAQs if user hasn't added any
        faqs: data.faqs.length === 0 ? (defaults.faqs || []) : data.faqs,
      });
    }
  }, [data.selectedTemplateId]); // eslint-disable-line react-hooks/exhaustive-deps
  
  // Create client mutation
  const createClientMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        businessName: data.businessName,
        slug: data.slug,
        industry: selectedTemplate?.botType || 'generic',
        plan: data.plan,
        contactName: data.contactName,
        contactEmail: data.contactEmail,
        contactPhone: data.contactPhone,
        websiteUrl: data.websiteUrl,
        city: data.city,
        state: data.state,
        timezone: data.timezone,
        operatingHours: {
          enabled: true,
          timezone: data.timezone,
          schedule: data.operatingHours,
          afterHoursMessage: data.afterHoursMessage,
        },
        aboutBusiness: data.aboutBusiness,
        services: data.services,
        faqs: data.faqs,
        bookingMode: data.bookingMode,
        externalBookingUrl: data.externalBookingUrl,
        externalBookingProviderName: data.externalBookingProviderName,
        appointmentTypeModes: data.appointmentTypeModes,
        enableBookingFailsafe: data.enableBookingFailsafe,
        industryAddons: data.industryAddons,
        notificationSettings: {
          staffEmails: data.staffEmails,
          staffPhones: data.staffPhones,
          staffChannelPreference: data.staffChannelPreference,
          eventToggles: data.eventToggles,
          templates: {
            staffEmailSubject: 'New Appointment Request from {{leadName}}',
            staffEmailBody: 'A new {{appointmentType}} appointment has been requested by {{leadName}} for {{preferredTime}}.',
          },
        },
        templateId: data.selectedTemplateId,
      };
      
      const response = await apiRequest("POST", "/api/super-admin/clients/from-template", payload);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to create client');
      }
      return response.json();
    },
    onSuccess: (resultData) => {
      const wizardResult: WizardResult = {
        success: true,
        workspace: resultData.workspace,
        bot: resultData.bot,
        clientCredentials: resultData.clientCredentials,
        widgetEmbedCode: resultData.widgetEmbedCode,
        viewAsClientUrl: resultData.viewAsClientUrl,
      };
      setResult(wizardResult);
      queryClient.invalidateQueries({ queryKey: ["/api/super-admin/clients"] });
      queryClient.invalidateQueries({ queryKey: ["/api/super-admin/workspaces"] });
      queryClient.invalidateQueries({ queryKey: ["/api/super-admin/bots"] });
      toast({ title: "Success!", description: `${data.businessName} has been created successfully.` });
      onSuccess?.(wizardResult);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
  
  // Handle launch
  const handleLaunch = () => {
    if (readiness.status === 'red') {
      toast({ 
        title: "Missing required fields", 
        description: "Please complete all required fields before launching.", 
        variant: "destructive" 
      });
      return;
    }
    createClientMutation.mutate();
  };
  
  // Copy helper
  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };
  
  // Get industry-specific addon fields
  const getIndustryAddonFields = (): Array<{ key: string; label: string; type: 'text' | 'textarea' | 'select' | 'switch'; options?: string[] }> => {
    const botType = selectedTemplate?.botType || '';
    
    switch (botType) {
      case 'restaurant':
        return [
          { key: 'cuisine', label: 'Cuisine Type', type: 'text' },
          { key: 'priceRange', label: 'Price Range', type: 'select', options: ['$', '$$', '$$$', '$$$$'] },
          { key: 'takeoutAvailable', label: 'Takeout Available', type: 'switch' },
          { key: 'reservationsRequired', label: 'Reservations Required', type: 'switch' },
          { key: 'specialDiets', label: 'Special Diet Options', type: 'text' },
        ];
      case 'barber':
        return [
          { key: 'walkInsWelcome', label: 'Walk-ins Welcome', type: 'switch' },
          { key: 'appointmentOnly', label: 'Appointment Only', type: 'switch' },
          { key: 'stylistCount', label: 'Number of Stylists', type: 'text' },
          { key: 'specialties', label: 'Specialties (e.g., fades, color)', type: 'text' },
        ];
      case 'auto_shop':
        return [
          { key: 'servicesOffered', label: 'Main Services', type: 'textarea' },
          { key: 'brandsServiced', label: 'Brands/Makes Serviced', type: 'text' },
          { key: 'warrantyOffered', label: 'Warranty on Repairs', type: 'switch' },
          { key: 'loaner_vehicles', label: 'Loaner Vehicles Available', type: 'switch' },
        ];
      case 'gym':
        return [
          { key: 'membershipTypes', label: 'Membership Types', type: 'textarea' },
          { key: 'classesOffered', label: 'Classes Offered', type: 'textarea' },
          { key: 'personalTraining', label: 'Personal Training Available', type: 'switch' },
          { key: 'openHours', label: '24/7 Access', type: 'switch' },
        ];
      case 'sober_living':
        return [
          { key: 'capacity', label: 'Bed Capacity', type: 'text' },
          { key: 'genderSpecific', label: 'Gender-Specific', type: 'select', options: ['Co-ed', 'Men Only', 'Women Only'] },
          { key: 'insuranceAccepted', label: 'Insurance Accepted', type: 'switch' },
          { key: 'petFriendly', label: 'Pet Friendly', type: 'switch' },
          { key: 'programLength', label: 'Typical Program Length', type: 'text' },
        ];
      case 'real_estate':
        return [
          { key: 'specialization', label: 'Specialization', type: 'select', options: ['Residential', 'Commercial', 'Both'] },
          { key: 'serviceAreas', label: 'Service Areas', type: 'textarea' },
          { key: 'virtualTours', label: 'Virtual Tours Available', type: 'switch' },
        ];
      case 'med_spa':
        return [
          { key: 'treatmentsOffered', label: 'Treatments Offered', type: 'textarea' },
          { key: 'consultationFree', label: 'Free Consultations', type: 'switch' },
          { key: 'licensedProviders', label: 'Licensed Medical Providers', type: 'switch' },
        ];
      case 'tattoo_studio':
        return [
          { key: 'styles', label: 'Tattoo Styles', type: 'textarea' },
          { key: 'artistCount', label: 'Number of Artists', type: 'text' },
          { key: 'walkInsWelcome', label: 'Walk-ins Welcome', type: 'switch' },
          { key: 'ageRequirement', label: 'Minimum Age', type: 'text' },
        ];
      case 'home_services':
        return [
          { key: 'servicesOffered', label: 'Services Offered', type: 'textarea' },
          { key: 'serviceRadius', label: 'Service Radius (miles)', type: 'text' },
          { key: 'licensedInsured', label: 'Licensed & Insured', type: 'switch' },
          { key: 'freeEstimates', label: 'Free Estimates', type: 'switch' },
        ];
      default:
        return [
          { key: 'customField1', label: 'Additional Info', type: 'textarea' },
        ];
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen && step === 9 && result?.success) {
        handleClose();
      }
    }}>
      <DialogContent 
        className="bg-[#0a0a0f] border-white/10 max-w-4xl max-h-[90vh] flex flex-col p-0 gap-0"
        onInteractOutside={(e) => { if (step < 9 || !result?.success) e.preventDefault(); }}
        onEscapeKeyDown={(e) => { if (step < 9 || !result?.success) e.preventDefault(); }}
      >
        {/* Header with stepper */}
        <DialogHeader className="px-6 pt-6 pb-4 flex-shrink-0 border-b border-white/5">
          <DialogTitle className="text-white text-xl font-semibold">
            {result?.success ? 'Client Created Successfully!' : 'New Client Onboarding'}
          </DialogTitle>
          
          {!result?.success && (
            <>
              <DialogDescription className="text-white/55 mt-1">
                {WIZARD_STEPS[step - 1]?.description}
              </DialogDescription>
              
              {/* Step indicators */}
              <div className="flex items-center gap-1 mt-4 overflow-x-auto pb-2">
                {WIZARD_STEPS.map((s, idx) => {
                  const isComplete = step > s.id;
                  const isCurrent = step === s.id;
                  const StepIcon = s.icon;
                  
                  return (
                    <div key={s.id} className="flex items-center">
                      <button
                        onClick={() => isComplete && setStep(s.id)}
                        disabled={!isComplete}
                        className={`flex items-center gap-1.5 px-2 py-1 rounded-lg transition-all ${
                          isCurrent 
                            ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40' 
                            : isComplete 
                              ? 'bg-white/5 text-white/70 hover:bg-white/10 cursor-pointer' 
                              : 'bg-white/3 text-white/30'
                        }`}
                        data-testid={`wizard-step-${s.id}`}
                      >
                        {isComplete ? (
                          <Check className="h-3.5 w-3.5 text-green-400" />
                        ) : (
                          <StepIcon className="h-3.5 w-3.5" />
                        )}
                        <span className="text-xs font-medium whitespace-nowrap hidden sm:inline">{s.label}</span>
                        <span className="text-xs font-medium sm:hidden">{s.id}</span>
                      </button>
                      {idx < WIZARD_STEPS.length - 1 && (
                        <ChevronRight className="h-3 w-3 text-white/20 mx-0.5 flex-shrink-0" />
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </DialogHeader>
        
        {/* Scrollable content */}
        <ScrollArea className="flex-1 px-6">
          <div className="py-6">
            {/* Step 1: Template Selection */}
            {step === 1 && (
              <div className="space-y-4">
                <p className="text-white/60 text-sm">Select an industry template to get started with pre-configured settings.</p>
                
                {templatesLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {templates.filter(t => t.isActive).map((template) => {
                      const Icon = INDUSTRY_ICONS[template.botType] || Building2;
                      const isSelected = data.selectedTemplateId === template.templateId;
                      
                      return (
                        <GlassCard
                          key={template.templateId}
                          hover
                          glow={isSelected}
                          onClick={() => updateData({ selectedTemplateId: template.templateId })}
                          className={`cursor-pointer transition-all ${
                            isSelected ? 'ring-2 ring-cyan-500/50 bg-cyan-500/10' : ''
                          }`}
                          data-testid={`template-${template.templateId}`}
                        >
                          <GlassCardContent className="p-4">
                            <div className="flex items-start gap-3">
                              <div className={`p-2 rounded-lg ${isSelected ? 'bg-cyan-500/20' : 'bg-white/5'}`}>
                                <Icon className={`h-5 w-5 ${isSelected ? 'text-cyan-400' : 'text-white/60'}`} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="text-white font-medium text-sm truncate">{template.name}</h4>
                                <p className="text-white/50 text-xs mt-0.5 line-clamp-2">{template.description}</p>
                              </div>
                              {isSelected && (
                                <Check className="h-4 w-4 text-cyan-400 flex-shrink-0" />
                              )}
                            </div>
                          </GlassCardContent>
                        </GlassCard>
                      );
                    })}
                  </div>
                )}
                
                {/* Template preview */}
                {selectedTemplate && (
                  <GlassCard className="mt-6">
                    <GlassCardHeader>
                      <GlassCardTitle className="text-sm">Template Preview</GlassCardTitle>
                    </GlassCardHeader>
                    <GlassCardContent>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-white/50">Default Booking Mode:</span>
                          <Badge className="ml-2 bg-white/10 text-white/70">
                            {selectedTemplate.defaultConfig.bookingProfile?.defaultMode || 'internal'}
                          </Badge>
                        </div>
                        <div>
                          <span className="text-white/50">Appointment Types:</span>
                          <span className="text-white ml-2">
                            {selectedTemplate.defaultConfig.bookingProfile?.appointmentTypes?.length || 0}
                          </span>
                        </div>
                        <div>
                          <span className="text-white/50">FAQs Included:</span>
                          <span className="text-white ml-2">{selectedTemplate.defaultConfig.faqs?.length || 0}</span>
                        </div>
                        <div>
                          <span className="text-white/50">Failsafe:</span>
                          <Badge className="ml-2 bg-green-500/20 text-green-400">Enabled</Badge>
                        </div>
                      </div>
                    </GlassCardContent>
                  </GlassCard>
                )}
              </div>
            )}
            
            {/* Step 2: Business Basics */}
            {step === 2 && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2 md:col-span-2">
                    <Label className="text-white/85">Business Name *</Label>
                    <Input
                      value={data.businessName}
                      onChange={(e) => {
                        updateData({ businessName: e.target.value });
                        if (touched.businessName) {
                          setErrors(prev => ({ ...prev, businessName: e.target.value.trim() ? undefined : 'Business name is required' }));
                        }
                      }}
                      onBlur={() => setTouched(t => ({ ...t, businessName: true }))}
                      className={`bg-white/5 text-white ${touched.businessName && errors.businessName ? 'border-red-500/50' : 'border-white/10'}`}
                      placeholder="e.g. Coastal Auto Repair"
                      data-testid="wizard-input-business-name"
                    />
                    {touched.businessName && errors.businessName && (
                      <p className="text-xs text-red-400">{errors.businessName}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-white/85">Slug (URL identifier) *</Label>
                    <Input
                      value={data.slug}
                      onChange={(e) => {
                        const slug = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '');
                        updateData({ slug });
                        setTouched(t => ({ ...t, slug: true }));
                      }}
                      className={`bg-white/5 text-white ${touched.slug && errors.slug ? 'border-red-500/50' : 'border-white/10'}`}
                      placeholder="e.g. coastal_auto_repair"
                      data-testid="wizard-input-slug"
                    />
                    {touched.slug && errors.slug ? (
                      <p className="text-xs text-red-400">{errors.slug}</p>
                    ) : (
                      <p className="text-xs text-white/40">Lowercase letters, numbers, underscores only</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-white/85">Plan</Label>
                    <Select value={data.plan} onValueChange={(v) => updateData({ plan: v })}>
                      <SelectTrigger className="bg-white/5 border-white/10 text-white" data-testid="wizard-select-plan">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1a1d24] border-white/10">
                        <SelectItem value="starter" className="text-white">Starter</SelectItem>
                        <SelectItem value="pro" className="text-white">Pro</SelectItem>
                        <SelectItem value="enterprise" className="text-white">Enterprise</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}
            
            {/* Step 3: Contact/Location */}
            {step === 3 && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-white/85">Contact Name</Label>
                    <Input
                      value={data.contactName}
                      onChange={(e) => updateData({ contactName: e.target.value })}
                      className="bg-white/5 border-white/10 text-white"
                      placeholder="John Smith"
                      data-testid="wizard-input-contact-name"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-white/85">Contact Email *</Label>
                    <Input
                      type="email"
                      value={data.contactEmail}
                      onChange={(e) => {
                        updateData({ contactEmail: e.target.value });
                        if (touched.contactEmail) {
                          let error: string | undefined;
                          if (!e.target.value.trim()) error = 'Contact email is required';
                          else if (!isValidEmail(e.target.value)) error = 'Please enter a valid email';
                          setErrors(prev => ({ ...prev, contactEmail: error }));
                        }
                      }}
                      onBlur={() => setTouched(t => ({ ...t, contactEmail: true }))}
                      className={`bg-white/5 text-white ${touched.contactEmail && errors.contactEmail ? 'border-red-500/50' : 'border-white/10'}`}
                      placeholder="client@business.com"
                      data-testid="wizard-input-email"
                    />
                    {touched.contactEmail && errors.contactEmail && (
                      <p className="text-xs text-red-400">{errors.contactEmail}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-white/85">Contact Phone</Label>
                    <Input
                      value={data.contactPhone}
                      onChange={(e) => updateData({ contactPhone: e.target.value })}
                      className="bg-white/5 border-white/10 text-white"
                      placeholder="(555) 123-4567"
                      data-testid="wizard-input-phone"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-white/85">Website</Label>
                    <Input
                      value={data.websiteUrl}
                      onChange={(e) => updateData({ websiteUrl: e.target.value })}
                      className="bg-white/5 border-white/10 text-white"
                      placeholder="https://example.com"
                      data-testid="wizard-input-website"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-white/85">City</Label>
                    <Input
                      value={data.city}
                      onChange={(e) => updateData({ city: e.target.value })}
                      className="bg-white/5 border-white/10 text-white"
                      placeholder="Stuart"
                      data-testid="wizard-input-city"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-white/85">State</Label>
                    <Input
                      value={data.state}
                      onChange={(e) => updateData({ state: e.target.value })}
                      className="bg-white/5 border-white/10 text-white"
                      placeholder="FL"
                      data-testid="wizard-input-state"
                    />
                  </div>
                  
                  <div className="space-y-2 md:col-span-2">
                    <Label className="text-white/85">Timezone</Label>
                    <Select value={data.timezone} onValueChange={(v) => updateData({ timezone: v })}>
                      <SelectTrigger className="bg-white/5 border-white/10 text-white" data-testid="wizard-select-timezone">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1a1d24] border-white/10">
                        <SelectItem value="America/New_York" className="text-white">Eastern (ET)</SelectItem>
                        <SelectItem value="America/Chicago" className="text-white">Central (CT)</SelectItem>
                        <SelectItem value="America/Denver" className="text-white">Mountain (MT)</SelectItem>
                        <SelectItem value="America/Los_Angeles" className="text-white">Pacific (PT)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}
            
            {/* Step 4: Hours */}
            {step === 4 && (
              <div className="space-y-4">
                <p className="text-white/60 text-sm">Set the operating hours for this business.</p>
                
                <div className="space-y-3">
                  {Object.entries(data.operatingHours).map(([day, hours]) => (
                    <div key={day} className="flex items-center gap-4 bg-white/3 rounded-lg p-3">
                      <div className="w-24">
                        <span className="text-white/80 capitalize font-medium">{day}</span>
                      </div>
                      <Switch
                        checked={hours.enabled}
                        onCheckedChange={(checked) => {
                          updateData({
                            operatingHours: {
                              ...data.operatingHours,
                              [day]: { ...hours, enabled: checked },
                            },
                          });
                        }}
                        data-testid={`wizard-hours-${day}-toggle`}
                      />
                      {hours.enabled ? (
                        <div className="flex items-center gap-2 flex-1">
                          <Input
                            type="time"
                            value={hours.open}
                            onChange={(e) => {
                              updateData({
                                operatingHours: {
                                  ...data.operatingHours,
                                  [day]: { ...hours, open: e.target.value },
                                },
                              });
                            }}
                            className="bg-white/5 border-white/10 text-white w-32"
                            data-testid={`wizard-hours-${day}-open`}
                          />
                          <span className="text-white/50">to</span>
                          <Input
                            type="time"
                            value={hours.close}
                            onChange={(e) => {
                              updateData({
                                operatingHours: {
                                  ...data.operatingHours,
                                  [day]: { ...hours, close: e.target.value },
                                },
                              });
                            }}
                            className="bg-white/5 border-white/10 text-white w-32"
                            data-testid={`wizard-hours-${day}-close`}
                          />
                        </div>
                      ) : (
                        <span className="text-white/40 text-sm">Closed</span>
                      )}
                    </div>
                  ))}
                </div>
                
                <div className="space-y-2">
                  <Label className="text-white/85">After Hours Message</Label>
                  <Textarea
                    value={data.afterHoursMessage}
                    onChange={(e) => updateData({ afterHoursMessage: e.target.value })}
                    className="bg-white/5 border-white/10 text-white min-h-[80px]"
                    placeholder="Message shown when customer contacts outside business hours..."
                    data-testid="wizard-input-after-hours"
                  />
                </div>
              </div>
            )}
            
            {/* Step 5: Services/FAQs/About */}
            {step === 5 && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-white/85">About the Business</Label>
                  <Textarea
                    value={data.aboutBusiness}
                    onChange={(e) => updateData({ aboutBusiness: e.target.value })}
                    className="bg-white/5 border-white/10 text-white min-h-[100px]"
                    placeholder="Describe what makes this business special..."
                    data-testid="wizard-input-about"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="text-white/85">Services (one per line)</Label>
                  <Textarea
                    value={data.services.join('\n')}
                    onChange={(e) => updateData({ services: e.target.value.split('\n').filter(s => s.trim()) })}
                    className="bg-white/5 border-white/10 text-white min-h-[100px]"
                    placeholder="Oil changes&#10;Brake repair&#10;Tire rotation"
                    data-testid="wizard-input-services"
                  />
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-white/85">FAQs</Label>
                    <Badge className="bg-white/10 text-white/60">{data.faqs.length} added</Badge>
                  </div>
                  
                  {data.faqs.map((faq, index) => (
                    <div key={index} className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-white/50 text-sm">FAQ #{index + 1}</span>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6 text-white/40 hover:text-red-400"
                          onClick={() => updateData({ faqs: data.faqs.filter((_, i) => i !== index) })}
                          data-testid={`wizard-remove-faq-${index}`}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <Input
                        value={faq.question}
                        onChange={(e) => updateData({
                          faqs: data.faqs.map((f, i) => i === index ? { ...f, question: e.target.value } : f),
                        })}
                        className="bg-white/5 border-white/10 text-white"
                        placeholder="Question..."
                        data-testid={`wizard-faq-question-${index}`}
                      />
                      <Textarea
                        value={faq.answer}
                        onChange={(e) => updateData({
                          faqs: data.faqs.map((f, i) => i === index ? { ...f, answer: e.target.value } : f),
                        })}
                        className="bg-white/5 border-white/10 text-white min-h-[60px]"
                        placeholder="Answer..."
                        data-testid={`wizard-faq-answer-${index}`}
                      />
                    </div>
                  ))}
                  
                  <Button
                    variant="outline"
                    className="w-full border-dashed border-white/20 text-white/60 hover:bg-white/5"
                    onClick={() => updateData({ faqs: [...data.faqs, { question: '', answer: '' }] })}
                    data-testid="wizard-add-faq"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add FAQ
                  </Button>
                </div>
              </div>
            )}
            
            {/* Step 6: Booking Behavior */}
            {step === 6 && (
              <div className="space-y-6">
                <GlassCard>
                  <GlassCardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-white font-medium">Global Booking Mode</h4>
                        <p className="text-white/50 text-sm mt-1">
                          {data.bookingMode === 'internal' 
                            ? 'Capture booking requests in-chat' 
                            : 'Redirect to external booking system'}
                        </p>
                      </div>
                      <Select value={data.bookingMode} onValueChange={(v: 'internal' | 'external') => updateData({ bookingMode: v })}>
                        <SelectTrigger className="w-40 bg-white/5 border-white/10 text-white" data-testid="wizard-select-booking-mode">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[#1a1d24] border-white/10">
                          <SelectItem value="internal" className="text-white">Internal</SelectItem>
                          <SelectItem value="external" className="text-white">External</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </GlassCardContent>
                </GlassCard>
                
                {data.bookingMode === 'external' && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-white/85">External Booking URL</Label>
                      <Input
                        value={data.externalBookingUrl}
                        onChange={(e) => {
                          updateData({ externalBookingUrl: e.target.value });
                          if (e.target.value && !isValidHttpsUrl(e.target.value)) {
                            setErrors(prev => ({ ...prev, externalBookingUrl: 'URL must start with https://' }));
                          } else {
                            setErrors(prev => ({ ...prev, externalBookingUrl: undefined }));
                          }
                        }}
                        className={`bg-white/5 text-white ${errors.externalBookingUrl ? 'border-red-500/50' : 'border-white/10'}`}
                        placeholder="https://calendly.com/mybusiness"
                        data-testid="wizard-input-booking-url"
                      />
                      {errors.externalBookingUrl && (
                        <p className="text-xs text-red-400">{errors.externalBookingUrl}</p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-white/85">Provider Name (optional)</Label>
                      <Input
                        value={data.externalBookingProviderName}
                        onChange={(e) => updateData({ externalBookingProviderName: e.target.value })}
                        className="bg-white/5 border-white/10 text-white"
                        placeholder="e.g. Calendly, Acuity, Square"
                        data-testid="wizard-input-provider-name"
                      />
                    </div>
                  </div>
                )}
                
                <GlassCard>
                  <GlassCardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-white font-medium">Booking Failsafe</h4>
                        <p className="text-white/50 text-sm mt-1">
                          Auto-pivot to internal capture if external URL fails
                        </p>
                      </div>
                      <Switch
                        checked={data.enableBookingFailsafe}
                        onCheckedChange={(checked) => updateData({ enableBookingFailsafe: checked })}
                        data-testid="wizard-toggle-failsafe"
                      />
                    </div>
                    {!data.enableBookingFailsafe && (
                      <div className="mt-3 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-amber-400 flex-shrink-0 mt-0.5" />
                        <p className="text-amber-400 text-sm">
                          Disabling failsafe may result in lost bookings if external URL is unavailable.
                        </p>
                      </div>
                    )}
                  </GlassCardContent>
                </GlassCard>
                
                {/* Per-appointment-type overrides */}
                {selectedTemplate?.defaultConfig.bookingProfile?.appointmentTypes && (
                  <div className="space-y-3">
                    <Label className="text-white/85">Per-Appointment-Type Overrides</Label>
                    <p className="text-white/50 text-sm">Override booking mode for specific appointment types.</p>
                    
                    {selectedTemplate.defaultConfig.bookingProfile.appointmentTypes.map((apt) => (
                      <div key={apt.id} className="bg-white/3 rounded-lg p-3 flex items-center justify-between">
                        <div>
                          <span className="text-white/80 text-sm">{apt.label}</span>
                          <Badge className="ml-2 bg-white/10 text-white/50 text-xs">
                            Default: {apt.mode}
                          </Badge>
                        </div>
                        <Select
                          value={data.appointmentTypeModes[apt.id]?.mode || 'default'}
                          onValueChange={(v) => {
                            if (v === 'default') {
                              const updated = { ...data.appointmentTypeModes };
                              delete updated[apt.id];
                              updateData({ appointmentTypeModes: updated });
                            } else {
                              updateData({
                                appointmentTypeModes: {
                                  ...data.appointmentTypeModes,
                                  [apt.id]: { mode: v as 'internal' | 'external' },
                                },
                              });
                            }
                          }}
                        >
                          <SelectTrigger className="w-32 bg-white/5 border-white/10 text-white" data-testid={`wizard-apt-mode-${apt.id}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-[#1a1d24] border-white/10">
                            <SelectItem value="default" className="text-white">Default</SelectItem>
                            <SelectItem value="internal" className="text-white">Internal</SelectItem>
                            <SelectItem value="external" className="text-white">External</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            {/* Step 7: Industry Add-ons */}
            {step === 7 && (
              <div className="space-y-4">
                <p className="text-white/60 text-sm">
                  Configure industry-specific fields for {selectedTemplate?.name || 'this template'}.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {getIndustryAddonFields().map((field) => (
                    <div key={field.key} className={`space-y-2 ${field.type === 'textarea' ? 'md:col-span-2' : ''}`}>
                      <Label className="text-white/85">{field.label}</Label>
                      
                      {field.type === 'text' && (
                        <Input
                          value={data.industryAddons[field.key] || ''}
                          onChange={(e) => updateData({
                            industryAddons: { ...data.industryAddons, [field.key]: e.target.value },
                          })}
                          className="bg-white/5 border-white/10 text-white"
                          data-testid={`wizard-addon-${field.key}`}
                        />
                      )}
                      
                      {field.type === 'textarea' && (
                        <Textarea
                          value={data.industryAddons[field.key] || ''}
                          onChange={(e) => updateData({
                            industryAddons: { ...data.industryAddons, [field.key]: e.target.value },
                          })}
                          className="bg-white/5 border-white/10 text-white min-h-[80px]"
                          data-testid={`wizard-addon-${field.key}`}
                        />
                      )}
                      
                      {field.type === 'select' && (
                        <Select
                          value={data.industryAddons[field.key] || ''}
                          onValueChange={(v) => updateData({
                            industryAddons: { ...data.industryAddons, [field.key]: v },
                          })}
                        >
                          <SelectTrigger className="bg-white/5 border-white/10 text-white" data-testid={`wizard-addon-${field.key}`}>
                            <SelectValue placeholder="Select..." />
                          </SelectTrigger>
                          <SelectContent className="bg-[#1a1d24] border-white/10">
                            {field.options?.map((opt) => (
                              <SelectItem key={opt} value={opt} className="text-white">{opt}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                      
                      {field.type === 'switch' && (
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={data.industryAddons[field.key] || false}
                            onCheckedChange={(checked) => updateData({
                              industryAddons: { ...data.industryAddons, [field.key]: checked },
                            })}
                            data-testid={`wizard-addon-${field.key}`}
                          />
                          <span className="text-white/60 text-sm">
                            {data.industryAddons[field.key] ? 'Yes' : 'No'}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Step 8: Notifications */}
            {step === 8 && (
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-white/85">Staff Email Addresses</Label>
                    <p className="text-white/50 text-sm">Add email addresses to receive notifications (one per line)</p>
                    <Textarea
                      value={data.staffEmails.join('\n')}
                      onChange={(e) => updateData({
                        staffEmails: e.target.value.split('\n').map(s => s.trim()).filter(Boolean),
                      })}
                      className="bg-white/5 border-white/10 text-white min-h-[80px]"
                      placeholder="staff@business.com&#10;manager@business.com"
                      data-testid="wizard-input-staff-emails"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-white/85">Staff Phone Numbers (SMS)</Label>
                    <p className="text-white/50 text-sm">Add phone numbers for SMS alerts (one per line)</p>
                    <Textarea
                      value={data.staffPhones.join('\n')}
                      onChange={(e) => updateData({
                        staffPhones: e.target.value.split('\n').map(s => s.trim()).filter(Boolean),
                      })}
                      className="bg-white/5 border-white/10 text-white min-h-[80px]"
                      placeholder="+15551234567&#10;+15559876543"
                      data-testid="wizard-input-staff-phones"
                    />
                  </div>
                </div>
                
                <GlassCard>
                  <GlassCardHeader>
                    <GlassCardTitle className="text-sm">Notification Events</GlassCardTitle>
                  </GlassCardHeader>
                  <GlassCardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-white/80">New Appointment (Email)</span>
                        <Switch
                          checked={data.eventToggles.newAppointmentEmail}
                          onCheckedChange={(checked) => updateData({
                            eventToggles: { ...data.eventToggles, newAppointmentEmail: checked },
                          })}
                          data-testid="wizard-toggle-apt-email"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-white/80">New Appointment (SMS)</span>
                        <Switch
                          checked={data.eventToggles.newAppointmentSms}
                          onCheckedChange={(checked) => updateData({
                            eventToggles: { ...data.eventToggles, newAppointmentSms: checked },
                          })}
                          data-testid="wizard-toggle-apt-sms"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-white/80">New Pre-Intake (Email)</span>
                        <Switch
                          checked={data.eventToggles.newPreIntakeEmail}
                          onCheckedChange={(checked) => updateData({
                            eventToggles: { ...data.eventToggles, newPreIntakeEmail: checked },
                          })}
                          data-testid="wizard-toggle-intake-email"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-white/80">Same-Day Reminder</span>
                        <Switch
                          checked={data.eventToggles.sameDayReminder}
                          onCheckedChange={(checked) => updateData({
                            eventToggles: { ...data.eventToggles, sameDayReminder: checked },
                          })}
                          data-testid="wizard-toggle-reminder"
                        />
                      </div>
                    </div>
                  </GlassCardContent>
                </GlassCard>
              </div>
            )}
            
            {/* Step 9: Review + Readiness */}
            {step === 9 && !result?.success && (
              <div className="space-y-6">
                {/* Readiness Score */}
                <GlassCard className={`${
                  readiness.status === 'green' ? 'border-green-500/30' :
                  readiness.status === 'yellow' ? 'border-amber-500/30' :
                  'border-red-500/30'
                }`}>
                  <GlassCardContent className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-white font-medium">Readiness Score</h4>
                      <div className={`text-2xl font-bold ${
                        readiness.status === 'green' ? 'text-green-400' :
                        readiness.status === 'yellow' ? 'text-amber-400' :
                        'text-red-400'
                      }`}>
                        {readiness.score}%
                      </div>
                    </div>
                    
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all ${
                          readiness.status === 'green' ? 'bg-green-500' :
                          readiness.status === 'yellow' ? 'bg-amber-500' :
                          'bg-red-500'
                        }`}
                        style={{ width: `${readiness.score}%` }}
                      />
                    </div>
                    
                    <div className="mt-4 space-y-2">
                      {readiness.checks.map((check, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm">
                          {check.passed ? (
                            <CheckCircle2 className="h-4 w-4 text-green-400" />
                          ) : (
                            <AlertCircle className={`h-4 w-4 ${check.required ? 'text-red-400' : 'text-amber-400'}`} />
                          )}
                          <span className={check.passed ? 'text-white/70' : 'text-white/90'}>
                            {check.label}
                            {check.required && !check.passed && <span className="text-red-400 ml-1">*</span>}
                          </span>
                        </div>
                      ))}
                    </div>
                  </GlassCardContent>
                </GlassCard>
                
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <GlassCard>
                    <GlassCardContent className="p-4">
                      <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-cyan-400" />
                        Business
                      </h4>
                      <div className="space-y-1 text-sm">
                        <div><span className="text-white/50">Name:</span> <span className="text-white">{data.businessName}</span></div>
                        <div><span className="text-white/50">Slug:</span> <span className="text-cyan-400">{data.slug}</span></div>
                        <div><span className="text-white/50">Template:</span> <span className="text-white">{selectedTemplate?.name}</span></div>
                        <div><span className="text-white/50">Plan:</span> <span className="text-white capitalize">{data.plan}</span></div>
                      </div>
                    </GlassCardContent>
                  </GlassCard>
                  
                  <GlassCard>
                    <GlassCardContent className="p-4">
                      <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-cyan-400" />
                        Contact
                      </h4>
                      <div className="space-y-1 text-sm">
                        <div><span className="text-white/50">Email:</span> <span className="text-white">{data.contactEmail}</span></div>
                        <div><span className="text-white/50">Phone:</span> <span className="text-white">{data.contactPhone || '-'}</span></div>
                        <div><span className="text-white/50">Location:</span> <span className="text-white">{data.city && data.state ? `${data.city}, ${data.state}` : '-'}</span></div>
                      </div>
                    </GlassCardContent>
                  </GlassCard>
                  
                  <GlassCard>
                    <GlassCardContent className="p-4">
                      <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-cyan-400" />
                        Booking
                      </h4>
                      <div className="space-y-1 text-sm">
                        <div><span className="text-white/50">Mode:</span> <span className="text-white capitalize">{data.bookingMode}</span></div>
                        <div><span className="text-white/50">Failsafe:</span> <Badge className={`ml-1 ${data.enableBookingFailsafe ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>{data.enableBookingFailsafe ? 'Enabled' : 'Disabled'}</Badge></div>
                        {data.bookingMode === 'external' && data.externalBookingUrl && (
                          <div><span className="text-white/50">URL:</span> <span className="text-cyan-400 text-xs break-all">{data.externalBookingUrl}</span></div>
                        )}
                      </div>
                    </GlassCardContent>
                  </GlassCard>
                  
                  <GlassCard>
                    <GlassCardContent className="p-4">
                      <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                        <Bell className="h-4 w-4 text-cyan-400" />
                        Notifications
                      </h4>
                      <div className="space-y-1 text-sm">
                        <div><span className="text-white/50">Staff Emails:</span> <span className="text-white">{data.staffEmails.length}</span></div>
                        <div><span className="text-white/50">Staff Phones:</span> <span className="text-white">{data.staffPhones.length}</span></div>
                        <div><span className="text-white/50">FAQs:</span> <span className="text-white">{data.faqs.length}</span></div>
                        <div><span className="text-white/50">Services:</span> <span className="text-white">{data.services.length}</span></div>
                      </div>
                    </GlassCardContent>
                  </GlassCard>
                </div>
              </div>
            )}
            
            {/* Success State */}
            {step === 9 && result?.success && (
              <div className="space-y-6">
                <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-6 text-center">
                  <CheckCircle2 className="h-16 w-16 text-green-400 mx-auto mb-4" />
                  <h3 className="text-white text-xl font-semibold">{result.workspace?.name} Created!</h3>
                  <p className="text-white/60 mt-2">The client account, bot, and settings have been configured.</p>
                </div>
                
                {result.clientCredentials && (
                  <GlassCard>
                    <GlassCardHeader>
                      <GlassCardTitle className="text-sm">Client Login Credentials</GlassCardTitle>
                    </GlassCardHeader>
                    <GlassCardContent>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between bg-white/5 rounded-lg p-3">
                          <div>
                            <span className="text-white/50 text-sm">Email:</span>
                            <span className="text-white ml-2">{result.clientCredentials.email}</span>
                          </div>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => copyToClipboard(result.clientCredentials!.email, 'email')}
                            data-testid="wizard-copy-email"
                          >
                            {copiedField === 'email' ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4 text-white/60" />}
                          </Button>
                        </div>
                        <div className="flex items-center justify-between bg-white/5 rounded-lg p-3">
                          <div>
                            <span className="text-white/50 text-sm">Temp Password:</span>
                            <span className="text-cyan-400 ml-2 font-mono">{result.clientCredentials.temporaryPassword}</span>
                          </div>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => copyToClipboard(result.clientCredentials!.temporaryPassword, 'password')}
                            data-testid="wizard-copy-password"
                          >
                            {copiedField === 'password' ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4 text-white/60" />}
                          </Button>
                        </div>
                        <div className="flex items-center justify-between bg-white/5 rounded-lg p-3">
                          <div className="flex-1 min-w-0">
                            <span className="text-white/50 text-sm">Dashboard:</span>
                            <span className="text-cyan-400 ml-2 text-sm truncate block">{result.clientCredentials.dashboardUrl}</span>
                          </div>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => window.open(result.clientCredentials!.dashboardUrl, '_blank')}
                            data-testid="wizard-open-dashboard"
                          >
                            <ExternalLink className="h-4 w-4 text-white/60" />
                          </Button>
                        </div>
                      </div>
                    </GlassCardContent>
                  </GlassCard>
                )}
                
                {result.widgetEmbedCode && (
                  <GlassCard>
                    <GlassCardHeader>
                      <GlassCardTitle className="text-sm">Widget Embed Code</GlassCardTitle>
                    </GlassCardHeader>
                    <GlassCardContent>
                      <div className="relative">
                        <pre className="bg-white/5 rounded-lg p-3 text-xs text-white/70 overflow-x-auto">
                          {result.widgetEmbedCode}
                        </pre>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="absolute top-2 right-2"
                          onClick={() => copyToClipboard(result.widgetEmbedCode!, 'embed')}
                          data-testid="wizard-copy-embed"
                        >
                          {copiedField === 'embed' ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4 text-white/60" />}
                        </Button>
                      </div>
                    </GlassCardContent>
                  </GlassCard>
                )}
              </div>
            )}
          </div>
        </ScrollArea>
        
        {/* Footer with navigation */}
        <DialogFooter className="px-6 py-4 border-t border-white/5 flex-shrink-0">
          {result?.success ? (
            <Button
              onClick={handleClose}
              className="bg-cyan-500 hover:bg-cyan-600 text-white"
              data-testid="wizard-done"
            >
              Done
            </Button>
          ) : (
            <div className="flex items-center justify-between w-full">
              <Button
                variant="ghost"
                onClick={handleCancel}
                className="text-white/60 hover:text-white hover:bg-white/5"
                data-testid="wizard-cancel"
              >
                Cancel
              </Button>
              
              <div className="flex items-center gap-2">
                {step > 1 && (
                  <Button
                    variant="outline"
                    onClick={handlePrev}
                    className="border-white/10 text-white hover:bg-white/5"
                    data-testid="wizard-prev"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Back
                  </Button>
                )}
                
                {step < 9 ? (
                  <Button
                    onClick={handleNext}
                    className="bg-cyan-500 hover:bg-cyan-600 text-white"
                    data-testid="wizard-next"
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                ) : (
                  <Button
                    onClick={handleLaunch}
                    disabled={createClientMutation.isPending}
                    className={`${
                      readiness.status === 'green' 
                        ? 'bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600' 
                        : readiness.status === 'yellow'
                          ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600'
                          : 'bg-white/10 text-white/50 cursor-not-allowed'
                    } text-white`}
                    data-testid="wizard-launch"
                  >
                    {createClientMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Launch Client
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

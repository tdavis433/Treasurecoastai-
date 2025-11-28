import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { AdminLayout } from "@/components/admin-layout";
import {
  ArrowLeft,
  ArrowRight,
  Bot,
  Building2,
  Check,
  Clock,
  Code,
  Copy,
  Globe,
  HelpCircle,
  Mail,
  MapPin,
  MessageSquare,
  Palette,
  Phone,
  Plus,
  Sparkles,
  Trash2,
  Wrench,
  X,
} from "lucide-react";

interface BotTemplate {
  id: string;
  templateId: string;
  name: string;
  description: string;
  botType: string;
  icon: string;
  isActive: boolean;
  displayOrder: number;
  defaultConfig?: {
    businessProfile: any;
    systemPrompt: string;
    faqs: any[];
    rules: any;
    personality: any;
  };
}

const WIZARD_STEPS = [
  { id: 1, title: "Business Info", icon: Building2, description: "Basic business details" },
  { id: 2, title: "Services", icon: Wrench, description: "What you offer" },
  { id: 3, title: "FAQs", icon: HelpCircle, description: "Common questions" },
  { id: 4, title: "Tone", icon: Palette, description: "Personality settings" },
  { id: 5, title: "Install", icon: Code, description: "Get your widget" },
];

const wizardSchema = z.object({
  templateId: z.string().optional(),
  businessName: z.string().min(1, "Business name is required"),
  botName: z.string().optional(),
  businessType: z.string().optional(),
  location: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  website: z.string().url().optional().or(z.literal("")),
  hours: z.string().optional(),
  services: z.array(z.string()).default([]),
  faqs: z.array(z.object({
    question: z.string(),
    answer: z.string(),
  })).default([]),
  personality: z.object({
    formality: z.number().min(0).max(100).default(50),
    enthusiasm: z.number().min(0).max(100).default(60),
    warmth: z.number().min(0).max(100).default(70),
    humor: z.number().min(0).max(100).default(30),
    responseLength: z.enum(["short", "medium", "long"]).default("medium"),
  }).default({
    formality: 50,
    enthusiasm: 60,
    warmth: 70,
    humor: 30,
    responseLength: "medium",
  }),
});

type WizardFormData = z.infer<typeof wizardSchema>;

export default function BotWizard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedTemplate, setSelectedTemplate] = useState<BotTemplate | null>(null);
  const [newService, setNewService] = useState("");
  const [newFaq, setNewFaq] = useState({ question: "", answer: "" });
  const [createdBotId, setCreatedBotId] = useState<string | null>(null);
  const [widgetCode, setWidgetCode] = useState<string>("");

  const { data: templates, isLoading: templatesLoading } = useQuery<BotTemplate[]>({
    queryKey: ["/api/templates"],
  });

  const form = useForm<WizardFormData>({
    resolver: zodResolver(wizardSchema),
    defaultValues: {
      templateId: "",
      businessName: "",
      botName: "",
      businessType: "",
      location: "",
      phone: "",
      email: "",
      website: "",
      hours: "Mon-Fri 9am-5pm",
      services: [],
      faqs: [],
      personality: {
        formality: 50,
        enthusiasm: 60,
        warmth: 70,
        humor: 30,
        responseLength: "medium",
      },
    },
  });

  const createBotMutation = useMutation({
    mutationFn: async (data: WizardFormData) => {
      const botId = `bot_${data.businessName.toLowerCase().replace(/[^a-z0-9]+/g, "_")}_${Date.now().toString(36)}`;
      const clientId = `client_${Date.now().toString(36)}`;
      
      const payload = {
        botId,
        clientId,
        name: data.botName || `${data.businessName} Assistant`,
        description: `AI assistant for ${data.businessName}`,
        businessProfile: {
          businessName: data.businessName,
          type: data.businessType || selectedTemplate?.botType || "general",
          location: data.location || "",
          phone: data.phone || "",
          email: data.email || "",
          website: data.website || "",
          hours: { officeHours: data.hours || "Mon-Fri 9am-5pm" },
          services: data.services,
        },
        faqs: data.faqs,
        personality: data.personality,
        templateBotId: selectedTemplate?.templateId,
      };

      const response = await apiRequest("POST", "/api/super-admin/bots", payload);
      return { ...response, botId, clientId };
    },
    onSuccess: (result: any) => {
      setCreatedBotId(result.botId);
      const code = generateWidgetCode(result.clientId, result.botId);
      setWidgetCode(code);
      toast({
        title: "Bot Created!",
        description: "Your AI chatbot is ready to install.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/templates"] });
      queryClient.invalidateQueries({ queryKey: ["/api/super-admin/bots"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create bot",
        variant: "destructive",
      });
    },
  });

  const generateWidgetCode = (clientId: string, botId: string) => {
    return `<!-- Treasure Coast AI Chat Widget -->
<script>
  (function() {
    var w = document.createElement('script');
    w.type = 'text/javascript';
    w.async = true;
    w.src = '${window.location.origin}/widget/widget.js';
    w.setAttribute('data-client-id', '${clientId}');
    w.setAttribute('data-bot-id', '${botId}');
    var s = document.getElementsByTagName('script')[0];
    s.parentNode.insertBefore(w, s);
  })();
</script>`;
  };

  const handleSelectTemplate = (template: BotTemplate) => {
    setSelectedTemplate(template);
    form.setValue("templateId", template.templateId);
    form.setValue("businessType", template.botType);
    
    if (template.defaultConfig) {
      const bp = template.defaultConfig.businessProfile;
      if (bp) {
        if (bp.businessName) form.setValue("businessName", bp.businessName);
        if (bp.location) form.setValue("location", bp.location);
        if (bp.phone) form.setValue("phone", bp.phone);
        if (bp.email) form.setValue("email", bp.email);
        if (bp.website) form.setValue("website", bp.website);
        if (bp.hours?.officeHours) form.setValue("hours", bp.hours.officeHours);
        if (bp.services?.length > 0) form.setValue("services", bp.services);
      }
      if (template.defaultConfig.faqs?.length > 0) {
        form.setValue("faqs", template.defaultConfig.faqs);
      }
      if (template.defaultConfig.personality) {
        form.setValue("personality", {
          formality: template.defaultConfig.personality.formality || 50,
          enthusiasm: template.defaultConfig.personality.enthusiasm || 60,
          warmth: template.defaultConfig.personality.warmth || 70,
          humor: template.defaultConfig.personality.humor || 30,
          responseLength: template.defaultConfig.personality.responseLength || "medium",
        });
      }
    }
  };

  const addService = () => {
    if (newService.trim()) {
      const current = form.getValues("services");
      form.setValue("services", [...current, newService.trim()]);
      setNewService("");
    }
  };

  const removeService = (index: number) => {
    const current = form.getValues("services");
    form.setValue("services", current.filter((_, i) => i !== index));
  };

  const addFaq = () => {
    if (newFaq.question.trim() && newFaq.answer.trim()) {
      const current = form.getValues("faqs");
      form.setValue("faqs", [...current, { ...newFaq }]);
      setNewFaq({ question: "", answer: "" });
    }
  };

  const removeFaq = (index: number) => {
    const current = form.getValues("faqs");
    form.setValue("faqs", current.filter((_, i) => i !== index));
  };

  const handleNext = async () => {
    if (currentStep === 1) {
      const isValid = await form.trigger(["businessName"]);
      if (!isValid) {
        toast({
          title: "Required Fields",
          description: "Please fill in the business name before continuing.",
          variant: "destructive",
        });
        return;
      }
    }
    
    if (currentStep === 4) {
      const isValid = await form.trigger();
      if (!isValid) {
        toast({
          title: "Validation Error",
          description: "Please check all fields are filled correctly.",
          variant: "destructive",
        });
        return;
      }
      const data = form.getValues();
      createBotMutation.mutate(data);
      setCurrentStep(5);
    } else if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const copyWidgetCode = () => {
    navigator.clipboard.writeText(widgetCode);
    toast({
      title: "Copied!",
      description: "Widget code copied to clipboard.",
    });
  };

  const isStepValid = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!form.getValues("businessName");
      case 2:
      case 3:
      case 4:
        return true;
      default:
        return true;
    }
  };

  const progress = (currentStep / 5) * 100;

  return (
    <AdminLayout>
      <div className="p-6 max-w-4xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setLocation("/super-admin")}
              data-testid="button-back-to-admin"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Bot className="h-6 w-6" />
                Create New Bot
              </h1>
              <p className="text-muted-foreground">
                Step {currentStep} of 5: {WIZARD_STEPS[currentStep - 1]?.title}
              </p>
            </div>
          </div>
          
          <Progress value={progress} className="h-2" data-testid="progress-wizard" />
          
          <div className="flex justify-between mt-4">
            {WIZARD_STEPS.map((step) => {
              const StepIcon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;
              
              return (
                <div 
                  key={step.id}
                  className={`flex flex-col items-center gap-1 ${
                    isActive ? "text-primary" : isCompleted ? "text-green-500" : "text-muted-foreground"
                  }`}
                  data-testid={`step-indicator-${step.id}`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                    isActive ? "border-primary bg-primary/10" : 
                    isCompleted ? "border-green-500 bg-green-500/10" : 
                    "border-muted"
                  }`}>
                    {isCompleted ? <Check className="h-5 w-5" /> : <StepIcon className="h-5 w-5" />}
                  </div>
                  <span className="text-xs hidden sm:block">{step.title}</span>
                </div>
              );
            })}
          </div>
        </div>

        <Form {...form}>
          <form className="space-y-6">
            {currentStep === 1 && (
              <Card data-testid="step-business-info">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Business Information
                  </CardTitle>
                  <CardDescription>
                    Select a template and enter your business details
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label className="text-base font-semibold mb-3 block">Choose a Template</Label>
                    {templatesLoading ? (
                      <div className="text-muted-foreground">Loading templates...</div>
                    ) : (
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {templates?.map((template) => (
                          <div
                            key={template.id}
                            onClick={() => handleSelectTemplate(template)}
                            className={`p-4 rounded-lg border-2 cursor-pointer transition-all hover-elevate ${
                              selectedTemplate?.id === template.id
                                ? "border-primary bg-primary/5"
                                : "border-border"
                            }`}
                            data-testid={`template-${template.templateId}`}
                          >
                            <div className="text-center">
                              <Sparkles className="h-8 w-8 mx-auto mb-2 text-primary" />
                              <div className="font-medium text-sm">{template.name}</div>
                              <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                {template.description}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <Separator />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="businessName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Business Name *</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="e.g., Joe's Pizza" 
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
                      name="botName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bot Name (optional)</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="e.g., Pizza Bot" 
                              {...field} 
                              data-testid="input-bot-name"
                            />
                          </FormControl>
                          <FormDescription>Leave blank to auto-generate</FormDescription>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="location"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" /> Location
                          </FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="City, State" 
                              {...field} 
                              data-testid="input-location"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="phone"
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
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="website"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-1">
                            <Globe className="h-3 w-3" /> Website
                          </FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="https://www.example.com" 
                              {...field} 
                              data-testid="input-website"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="hours"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1">
                          <Clock className="h-3 w-3" /> Business Hours
                        </FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Mon-Fri 9am-5pm, Sat 10am-3pm" 
                            {...field} 
                            data-testid="input-hours"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            )}

            {currentStep === 2 && (
              <Card data-testid="step-services">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wrench className="h-5 w-5" />
                    Services
                  </CardTitle>
                  <CardDescription>
                    What services or products does your business offer?
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      value={newService}
                      onChange={(e) => setNewService(e.target.value)}
                      placeholder="Add a service (e.g., Haircut, Oil Change, Pizza Delivery)"
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addService())}
                      data-testid="input-new-service"
                    />
                    <Button type="button" onClick={addService} size="icon" data-testid="button-add-service">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 min-h-[100px] p-4 border rounded-lg bg-muted/30">
                    {form.watch("services")?.length === 0 ? (
                      <p className="text-muted-foreground text-sm">No services added yet. Add some above!</p>
                    ) : (
                      form.watch("services")?.map((service, index) => (
                        <Badge 
                          key={index} 
                          variant="secondary" 
                          className="pl-3 pr-1 py-1 gap-1"
                          data-testid={`badge-service-${index}`}
                        >
                          {service}
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-4 w-4 ml-1 hover:bg-destructive/20"
                            onClick={() => removeService(index)}
                            data-testid={`button-remove-service-${index}`}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </Badge>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {currentStep === 3 && (
              <Card data-testid="step-faqs">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <HelpCircle className="h-5 w-5" />
                    Frequently Asked Questions
                  </CardTitle>
                  <CardDescription>
                    Add common questions and answers your bot should know
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
                    <Input
                      value={newFaq.question}
                      onChange={(e) => setNewFaq({ ...newFaq, question: e.target.value })}
                      placeholder="Question (e.g., What are your hours?)"
                      data-testid="input-faq-question"
                    />
                    <Textarea
                      value={newFaq.answer}
                      onChange={(e) => setNewFaq({ ...newFaq, answer: e.target.value })}
                      placeholder="Answer..."
                      rows={3}
                      data-testid="input-faq-answer"
                    />
                    <Button 
                      type="button" 
                      onClick={addFaq} 
                      disabled={!newFaq.question.trim() || !newFaq.answer.trim()}
                      data-testid="button-add-faq"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add FAQ
                    </Button>
                  </div>
                  
                  <div className="space-y-3">
                    {form.watch("faqs")?.length === 0 ? (
                      <p className="text-muted-foreground text-sm p-4 text-center">
                        No FAQs added yet. Add some common questions above!
                      </p>
                    ) : (
                      form.watch("faqs")?.map((faq, index) => (
                        <div 
                          key={index} 
                          className="p-4 border rounded-lg bg-card"
                          data-testid={`faq-item-${index}`}
                        >
                          <div className="flex justify-between items-start gap-2">
                            <div className="flex-1">
                              <div className="font-medium text-sm flex items-center gap-2">
                                <MessageSquare className="h-4 w-4 text-primary" />
                                Q: {faq.question}
                              </div>
                              <div className="text-sm text-muted-foreground mt-2 pl-6">
                                A: {faq.answer}
                              </div>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:bg-destructive/10"
                              onClick={() => removeFaq(index)}
                              data-testid={`button-remove-faq-${index}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {currentStep === 4 && (
              <Card data-testid="step-tone">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="h-5 w-5" />
                    Bot Personality
                  </CardTitle>
                  <CardDescription>
                    Customize how your AI assistant communicates
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-2">
                        <Label>Formality</Label>
                        <span className="text-sm text-muted-foreground">
                          {form.watch("personality.formality")}%
                        </span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-xs text-muted-foreground">Casual</span>
                        <Slider
                          value={[form.watch("personality.formality")]}
                          onValueChange={([value]) => form.setValue("personality.formality", value)}
                          min={0}
                          max={100}
                          step={5}
                          className="flex-1"
                          data-testid="slider-formality"
                        />
                        <span className="text-xs text-muted-foreground">Formal</span>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between mb-2">
                        <Label>Enthusiasm</Label>
                        <span className="text-sm text-muted-foreground">
                          {form.watch("personality.enthusiasm")}%
                        </span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-xs text-muted-foreground">Calm</span>
                        <Slider
                          value={[form.watch("personality.enthusiasm")]}
                          onValueChange={([value]) => form.setValue("personality.enthusiasm", value)}
                          min={0}
                          max={100}
                          step={5}
                          className="flex-1"
                          data-testid="slider-enthusiasm"
                        />
                        <span className="text-xs text-muted-foreground">Excited</span>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between mb-2">
                        <Label>Warmth</Label>
                        <span className="text-sm text-muted-foreground">
                          {form.watch("personality.warmth")}%
                        </span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-xs text-muted-foreground">Professional</span>
                        <Slider
                          value={[form.watch("personality.warmth")]}
                          onValueChange={([value]) => form.setValue("personality.warmth", value)}
                          min={0}
                          max={100}
                          step={5}
                          className="flex-1"
                          data-testid="slider-warmth"
                        />
                        <span className="text-xs text-muted-foreground">Friendly</span>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between mb-2">
                        <Label>Humor</Label>
                        <span className="text-sm text-muted-foreground">
                          {form.watch("personality.humor")}%
                        </span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-xs text-muted-foreground">Serious</span>
                        <Slider
                          value={[form.watch("personality.humor")]}
                          onValueChange={([value]) => form.setValue("personality.humor", value)}
                          min={0}
                          max={100}
                          step={5}
                          className="flex-1"
                          data-testid="slider-humor"
                        />
                        <span className="text-xs text-muted-foreground">Playful</span>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <Label className="mb-3 block">Response Length</Label>
                    <div className="flex gap-3">
                      {(["short", "medium", "long"] as const).map((length) => (
                        <Button
                          key={length}
                          type="button"
                          variant={form.watch("personality.responseLength") === length ? "default" : "outline"}
                          onClick={() => form.setValue("personality.responseLength", length)}
                          className="flex-1 capitalize"
                          data-testid={`button-response-${length}`}
                        >
                          {length}
                        </Button>
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      {form.watch("personality.responseLength") === "short" && "Brief, to-the-point answers"}
                      {form.watch("personality.responseLength") === "medium" && "Balanced responses with helpful details"}
                      {form.watch("personality.responseLength") === "long" && "Detailed, comprehensive explanations"}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {currentStep === 5 && (
              <Card data-testid="step-install">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Code className="h-5 w-5" />
                    Install Your Bot
                  </CardTitle>
                  <CardDescription>
                    {createdBotId 
                      ? "Your bot is ready! Copy the code below to add it to your website."
                      : "Creating your bot..."}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {createBotMutation.isPending ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      <span className="ml-3">Creating your bot...</span>
                    </div>
                  ) : createdBotId ? (
                    <>
                      <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                        <Check className="h-6 w-6 text-green-500" />
                        <div>
                          <div className="font-medium text-green-600">Bot Created Successfully!</div>
                          <div className="text-sm text-muted-foreground">Bot ID: {createdBotId}</div>
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <Label>Widget Installation Code</Label>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={copyWidgetCode}
                            data-testid="button-copy-widget"
                          >
                            <Copy className="h-4 w-4 mr-2" />
                            Copy Code
                          </Button>
                        </div>
                        <pre className="p-4 bg-muted rounded-lg overflow-x-auto text-sm">
                          <code data-testid="widget-code">{widgetCode}</code>
                        </pre>
                      </div>

                      <div className="p-4 bg-muted/50 rounded-lg">
                        <h4 className="font-medium mb-2">Installation Instructions:</h4>
                        <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                          <li>Copy the widget code above</li>
                          <li>Paste it before the closing <code>&lt;/body&gt;</code> tag on your website</li>
                          <li>The chat widget will appear in the bottom-right corner</li>
                          <li>Test it out by sending a message!</li>
                        </ol>
                      </div>

                      <div className="flex gap-3">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setLocation("/super-admin")}
                          className="flex-1"
                          data-testid="button-go-to-dashboard"
                        >
                          Go to Dashboard
                        </Button>
                        <Button
                          type="button"
                          onClick={() => setLocation(`/admin/bot/${createdBotId}`)}
                          className="flex-1"
                          data-testid="button-configure-bot"
                        >
                          Configure Bot
                        </Button>
                      </div>
                    </>
                  ) : createBotMutation.isError ? (
                    <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
                      <div className="font-medium text-destructive">Failed to create bot</div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {(createBotMutation.error as any)?.message || "An error occurred"}
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        className="mt-3"
                        onClick={() => handleNext()}
                        data-testid="button-retry"
                      >
                        Try Again
                      </Button>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            )}

            <div className="flex justify-between pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                disabled={currentStep === 1 || currentStep === 5}
                data-testid="button-previous"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>
              
              {currentStep < 5 && (
                <Button
                  type="button"
                  onClick={handleNext}
                  disabled={!isStepValid(currentStep) || createBotMutation.isPending}
                  data-testid="button-next"
                >
                  {currentStep === 4 ? (
                    <>
                      Create Bot
                      <Sparkles className="h-4 w-4 ml-2" />
                    </>
                  ) : (
                    <>
                      Next
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              )}
            </div>
          </form>
        </Form>
      </div>
    </AdminLayout>
  );
}

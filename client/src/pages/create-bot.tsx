import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { AdminLayout } from "@/components/admin-layout";
import {
  ArrowLeft,
  Bot,
  Building2,
  Copy,
  Plus,
  Sparkles,
  Phone,
  Mail,
  Globe,
  MapPin,
  Clock,
  FileText,
  Check,
} from "lucide-react";

interface BotTemplate {
  botId: string;
  name: string;
  description: string;
  businessType: string;
  businessName: string;
  isDemo: boolean;
}

const BUSINESS_TYPES = [
  { value: "sober_living", label: "Sober Living / Recovery" },
  { value: "restaurant", label: "Restaurant / Food Service" },
  { value: "barber", label: "Barber / Salon" },
  { value: "home_services", label: "Home Services" },
  { value: "auto_shop", label: "Auto Shop / Repair" },
  { value: "gym", label: "Gym / Fitness" },
  { value: "general", label: "General Business" },
];

const createBotSchema = z.object({
  botId: z.string().min(1, "Bot ID is required").regex(/^[a-z0-9_]+$/, "Only lowercase letters, numbers, and underscores"),
  clientId: z.string().min(1, "Client ID is required").regex(/^[a-z0-9_]+$/, "Only lowercase letters, numbers, and underscores"),
  name: z.string().min(1, "Bot name is required"),
  description: z.string().optional(),
  businessName: z.string().min(1, "Business name is required"),
  businessType: z.string().min(1, "Business type is required"),
  location: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  website: z.string().url().optional().or(z.literal("")),
  officeHours: z.string().optional(),
  services: z.string().optional(),
});

type CreateBotFormData = z.infer<typeof createBotSchema>;

export default function CreateBot() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [creationMode, setCreationMode] = useState<"template" | "scratch">("template");

  const { data: templates, isLoading: templatesLoading } = useQuery<BotTemplate[]>({
    queryKey: ["/api/super-admin/bots"],
  });

  const form = useForm<CreateBotFormData>({
    resolver: zodResolver(createBotSchema),
    defaultValues: {
      botId: "",
      clientId: "",
      name: "",
      description: "",
      businessName: "",
      businessType: "general",
      location: "",
      phone: "",
      email: "",
      website: "",
      officeHours: "Mon-Fri 9am-5pm",
      services: "",
    },
  });

  const createBotMutation = useMutation({
    mutationFn: async (data: CreateBotFormData) => {
      const payload: any = {
        botId: data.botId,
        clientId: data.clientId,
        name: data.name,
        description: data.description || `AI assistant for ${data.businessName}`,
        businessProfile: {
          businessName: data.businessName,
          type: data.businessType,
          location: data.location || "",
          phone: data.phone || "",
          email: data.email || "",
          website: data.website || "",
          hours: { officeHours: data.officeHours || "Mon-Fri 9am-5pm" },
          services: data.services ? data.services.split("\n").filter(s => s.trim()) : [],
        },
      };

      if (creationMode === "template" && selectedTemplate) {
        payload.templateBotId = selectedTemplate;
      }

      return apiRequest("POST", "/api/super-admin/bots", payload);
    },
    onSuccess: () => {
      toast({
        title: "Bot Created",
        description: "The new bot has been created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/super-admin/bots"] });
      setLocation("/super-admin");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create bot",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CreateBotFormData) => {
    createBotMutation.mutate(data);
  };

  const selectTemplate = (template: BotTemplate) => {
    setSelectedTemplate(template.botId);
    
    const suggestedBotId = `${template.businessType}_new_${Date.now().toString(36)}`;
    const suggestedClientId = `client_${Date.now().toString(36)}`;
    
    form.setValue("botId", suggestedBotId);
    form.setValue("clientId", suggestedClientId);
    form.setValue("businessType", template.businessType);
    form.setValue("description", `AI assistant based on ${template.name} template`);
  };

  const generateIds = () => {
    const businessName = form.getValues("businessName");
    const timestamp = Date.now().toString(36);
    
    if (businessName) {
      const slug = businessName.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
      form.setValue("botId", `${slug}_bot_${timestamp}`);
      form.setValue("clientId", `${slug}_${timestamp}`);
    } else {
      form.setValue("botId", `new_bot_${timestamp}`);
      form.setValue("clientId", `new_client_${timestamp}`);
    }
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-6 max-w-4xl mx-auto">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setLocation("/super-admin")}
            data-testid="button-back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Bot className="h-6 w-6" />
              Create New Bot
            </h1>
            <p className="text-muted-foreground">
              Set up a new AI chatbot for a client
            </p>
          </div>
        </div>

        <Tabs value={creationMode} onValueChange={(v) => setCreationMode(v as "template" | "scratch")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="template" className="flex items-center gap-2" data-testid="tab-template">
              <Copy className="h-4 w-4" />
              Start from Template
            </TabsTrigger>
            <TabsTrigger value="scratch" className="flex items-center gap-2" data-testid="tab-scratch">
              <Plus className="h-4 w-4" />
              Start from Scratch
            </TabsTrigger>
          </TabsList>

          <TabsContent value="template" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Choose a Template</CardTitle>
                <CardDescription>
                  Select an existing bot to use as a starting point. Your new bot will automatically inherit:
                </CardDescription>
                <div className="flex flex-wrap gap-2 mt-2">
                  <Badge variant="outline" className="text-xs">System Prompt</Badge>
                  <Badge variant="outline" className="text-xs">FAQs</Badge>
                  <Badge variant="outline" className="text-xs">Safety Rules</Badge>
                  <Badge variant="outline" className="text-xs">Crisis Handling</Badge>
                  <Badge variant="outline" className="text-xs">Service Structure</Badge>
                </div>
              </CardHeader>
              <CardContent>
                {templatesLoading ? (
                  <div className="text-center py-8 text-muted-foreground">Loading templates...</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {templates?.map((template) => (
                      <button
                        key={template.botId}
                        type="button"
                        onClick={() => selectTemplate(template)}
                        className={`p-4 rounded-lg border text-left transition-all hover-elevate ${
                          selectedTemplate === template.botId
                            ? "border-primary bg-primary/5 ring-2 ring-primary"
                            : "border-border"
                        }`}
                        data-testid={`template-${template.botId}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">{template.businessName}</div>
                            <div className="text-sm text-muted-foreground truncate">{template.name}</div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {template.isDemo && (
                              <Badge variant="secondary">Demo</Badge>
                            )}
                            {selectedTemplate === template.botId && (
                              <Check className="h-4 w-4 text-primary" />
                            )}
                          </div>
                        </div>
                        <Badge variant="outline" className="mt-2">
                          {BUSINESS_TYPES.find(t => t.value === template.businessType)?.label || template.businessType}
                        </Badge>
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="scratch" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Start Fresh</CardTitle>
                <CardDescription>
                  Create a new bot from scratch. The bot will be created with:
                </CardDescription>
                <ul className="text-sm text-muted-foreground mt-2 space-y-1 list-disc list-inside">
                  <li>A basic system prompt tailored to your business name</li>
                  <li>Default safety rules and crisis handling</li>
                  <li>Empty FAQs (you can add them later)</li>
                </ul>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  After creating the bot, you can fully customize its behavior, FAQs, and safety rules from the bot dashboard.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Business Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="businessName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Business Name *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g., Joe's Pizza Shop" 
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
                  name="businessType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Business Type *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-business-type">
                            <SelectValue placeholder="Select business type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {BUSINESS_TYPES.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        <FormMessage />
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                            placeholder="https://www.business.com" 
                            {...field} 
                            data-testid="input-website"
                          />
                        </FormControl>
                        <FormMessage />
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
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="officeHours"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-1">
                        <Clock className="h-3 w-3" /> Hours of Operation
                      </FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Mon-Fri 9am-5pm" 
                          {...field} 
                          data-testid="input-hours"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="services"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-1">
                        <FileText className="h-3 w-3" /> Services (one per line)
                      </FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Haircuts&#10;Styling&#10;Color treatments" 
                          className="min-h-[100px]"
                          {...field} 
                          data-testid="input-services"
                        />
                      </FormControl>
                      <FormDescription>
                        List the main services this business offers
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  Bot Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bot Name *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g., Joe's Pizza Assistant" 
                          {...field} 
                          data-testid="input-bot-name"
                        />
                      </FormControl>
                      <FormDescription>
                        The friendly name for this AI assistant
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="A helpful AI assistant that answers questions about our menu, hours, and takes reservations." 
                          {...field} 
                          data-testid="input-description"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Separator />

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>System Identifiers</Label>
                      <p className="text-sm text-muted-foreground">
                        Unique IDs used internally to identify this bot and client
                      </p>
                    </div>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={generateIds}
                      data-testid="button-generate-ids"
                    >
                      Auto-generate
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="botId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bot ID *</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="joes_pizza_bot" 
                              {...field} 
                              data-testid="input-bot-id"
                            />
                          </FormControl>
                          <FormDescription>
                            Lowercase letters, numbers, underscores only
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="clientId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Client ID *</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="joes_pizza" 
                              {...field} 
                              data-testid="input-client-id"
                            />
                          </FormControl>
                          <FormDescription>
                            Unique identifier for this client/business
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex items-center justify-between pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setLocation("/super-admin")}
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createBotMutation.isPending}
                className="min-w-[150px]"
                data-testid="button-create-bot"
              >
                {createBotMutation.isPending ? (
                  "Creating..."
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Bot
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </AdminLayout>
  );
}

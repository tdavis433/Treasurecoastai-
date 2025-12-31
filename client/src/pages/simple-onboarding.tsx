import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from "@/components/ui/glass-card";
import { ArrowRight, ArrowLeft, Check, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Template {
  templateId: string;
  name: string;
  description: string;
  category: string;
  preview: string;
}

const TEMPLATES: Template[] = [
  {
    templateId: "barber",
    name: "Barbershop",
    description: "Perfect for salons and barbershops",
    category: "Beauty",
    preview: "Handles appointments, services, hours"
  },
  {
    templateId: "restaurant",
    name: "Restaurant",
    description: "Great for cafes and restaurants",
    category: "Food & Beverage",
    preview: "Menu, reservations, delivery info"
  },
  {
    templateId: "gym",
    name: "Fitness Center",
    description: "Ideal for gyms and studios",
    category: "Fitness",
    preview: "Memberships, classes, trainers"
  },
  {
    templateId: "sober_living",
    name: "Recovery House",
    description: "For sober living facilities",
    category: "Healthcare",
    preview: "Admissions, programs, support"
  },
  {
    templateId: "real_estate",
    name: "Real Estate",
    description: "For realtors and agencies",
    category: "Real Estate",
    preview: "Listings, tours, contact"
  },
  {
    templateId: "med_spa",
    name: "Med Spa",
    description: "Medical spas and aesthetics",
    category: "Beauty & Wellness",
    preview: "Services, bookings, consultations"
  },
];

export default function SimpleOnboarding() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [businessName, setBusinessName] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [notes, setNotes] = useState("");

  const createClient = useMutation({
    mutationFn: async (data: {
      businessName: string;
      contactName: string;
      contactEmail: string;
      contactPhone: string;
      notes: string;
      templateId: string;
    }) => {
      const response = await apiRequest("POST", "/api/super-admin/clients", data);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/super-admin/clients"] });
      toast({
        title: "Client Created!",
        description: `${businessName} is ready to go.`,
      });
      setLocation(`/super-admin/clients/${data.slug}`);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create client. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    if (!selectedTemplate || !businessName || !contactEmail) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    createClient.mutate({
      businessName,
      contactName,
      contactEmail,
      contactPhone,
      notes,
      templateId: selectedTemplate.templateId,
    });
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] py-12 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4" data-testid="text-onboarding-title">
            New Client Onboarding
          </h1>
          <p className="text-white/60 text-lg">
            3 simple steps to get your client up and running
          </p>
        </div>

        <div className="flex items-center justify-center gap-4 mb-12">
          {[1, 2, 3].map((num) => (
            <div key={num} className="flex items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-colors ${
                  step >= num
                    ? "bg-[#00e5ff] text-black"
                    : "bg-white/10 text-white/40"
                }`}
                data-testid={`step-indicator-${num}`}
              >
                {step > num ? <Check className="w-5 h-5" /> : num}
              </div>
              {num < 3 && (
                <div
                  className={`w-16 h-1 mx-2 transition-colors ${
                    step > num ? "bg-[#00e5ff]" : "bg-white/10"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {step === 1 && (
          <GlassCard>
            <GlassCardHeader>
              <GlassCardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#00e5ff]" />
                Step 1: Choose Industry Template
              </GlassCardTitle>
            </GlassCardHeader>
            <GlassCardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {TEMPLATES.map((template) => (
                  <button
                    key={template.templateId}
                    onClick={() => setSelectedTemplate(template)}
                    data-testid={`template-${template.templateId}`}
                    className={`p-6 rounded-lg border-2 transition-all text-left ${
                      selectedTemplate?.templateId === template.templateId
                        ? "border-[#00e5ff] bg-[#00e5ff]/10"
                        : "border-white/10 hover:border-white/20 bg-white/5"
                    }`}
                  >
                    <div className="font-semibold text-white text-lg mb-2">
                      {template.name}
                    </div>
                    <div className="text-white/60 text-sm mb-3">
                      {template.description}
                    </div>
                    <div className="text-[#00e5ff] text-xs">
                      {template.preview}
                    </div>
                  </button>
                ))}
              </div>

              <div className="mt-8 flex justify-end">
                <Button
                  onClick={() => setStep(2)}
                  disabled={!selectedTemplate}
                  className="bg-[#00e5ff] text-black hover:bg-[#00b8cc]"
                  data-testid="button-next-step-1"
                >
                  Next: Business Info
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </GlassCardContent>
          </GlassCard>
        )}

        {step === 2 && (
          <GlassCard>
            <GlassCardHeader>
              <GlassCardTitle>Step 2: Business Information</GlassCardTitle>
            </GlassCardHeader>
            <GlassCardContent>
              <div className="space-y-6">
                <div>
                  <Label htmlFor="businessName" className="text-white">
                    Business Name *
                  </Label>
                  <Input
                    id="businessName"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="e.g., Classic Cuts Barbershop"
                    className="bg-white/5 border-white/10 text-white"
                    data-testid="input-business-name"
                  />
                </div>

                <div>
                  <Label htmlFor="contactName" className="text-white">
                    Contact Person
                  </Label>
                  <Input
                    id="contactName"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="e.g., John Smith"
                    className="bg-white/5 border-white/10 text-white"
                    data-testid="input-contact-name"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="contactEmail" className="text-white">
                      Email *
                    </Label>
                    <Input
                      id="contactEmail"
                      type="email"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      placeholder="john@business.com"
                      className="bg-white/5 border-white/10 text-white"
                      data-testid="input-contact-email"
                    />
                  </div>

                  <div>
                    <Label htmlFor="contactPhone" className="text-white">
                      Phone
                    </Label>
                    <Input
                      id="contactPhone"
                      type="tel"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      placeholder="(555) 123-4567"
                      className="bg-white/5 border-white/10 text-white"
                      data-testid="input-contact-phone"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="notes" className="text-white">
                    Notes (Optional)
                  </Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Any special requirements or notes..."
                    className="bg-white/5 border-white/10 text-white"
                    rows={3}
                    data-testid="input-notes"
                  />
                </div>
              </div>

              <div className="mt-8 flex justify-between">
                <Button
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="border-white/10 text-white"
                  data-testid="button-back-step-2"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <Button
                  onClick={() => setStep(3)}
                  disabled={!businessName || !contactEmail}
                  className="bg-[#00e5ff] text-black hover:bg-[#00b8cc]"
                  data-testid="button-next-step-2"
                >
                  Next: Review
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </GlassCardContent>
          </GlassCard>
        )}

        {step === 3 && (
          <GlassCard>
            <GlassCardHeader>
              <GlassCardTitle>Step 3: Review & Create</GlassCardTitle>
            </GlassCardHeader>
            <GlassCardContent>
              <div className="space-y-6">
                <div className="bg-white/5 rounded-lg p-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-white/60 text-sm mb-1">Template</div>
                      <div className="text-white font-semibold" data-testid="review-template">
                        {selectedTemplate?.name}
                      </div>
                    </div>
                    <div>
                      <div className="text-white/60 text-sm mb-1">Business</div>
                      <div className="text-white font-semibold" data-testid="review-business">{businessName}</div>
                    </div>
                    <div>
                      <div className="text-white/60 text-sm mb-1">Contact</div>
                      <div className="text-white font-semibold" data-testid="review-contact">
                        {contactName || "Not provided"}
                      </div>
                    </div>
                    <div>
                      <div className="text-white/60 text-sm mb-1">Email</div>
                      <div className="text-white font-semibold" data-testid="review-email">{contactEmail}</div>
                    </div>
                    {contactPhone && (
                      <div>
                        <div className="text-white/60 text-sm mb-1">Phone</div>
                        <div className="text-white font-semibold" data-testid="review-phone">{contactPhone}</div>
                      </div>
                    )}
                    {notes && (
                      <div className="col-span-2">
                        <div className="text-white/60 text-sm mb-1">Notes</div>
                        <div className="text-white" data-testid="review-notes">{notes}</div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-[#00e5ff]/10 border border-[#00e5ff]/30 rounded-lg p-4">
                  <div className="text-white/80 text-sm">
                    <strong className="text-[#00e5ff]">What happens next:</strong>
                    <ul className="mt-2 space-y-1 ml-4">
                      <li>Client workspace created</li>
                      <li>Bot configured with {selectedTemplate?.name} template</li>
                      <li>Login credentials emailed to {contactEmail}</li>
                      <li>Widget embed code generated</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex justify-between">
                <Button
                  variant="outline"
                  onClick={() => setStep(2)}
                  className="border-white/10 text-white"
                  disabled={createClient.isPending}
                  data-testid="button-back-step-3"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={createClient.isPending}
                  className="bg-[#00e5ff] text-black hover:bg-[#00b8cc]"
                  data-testid="button-create-client"
                >
                  {createClient.isPending ? (
                    "Creating..."
                  ) : (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Create Client
                    </>
                  )}
                </Button>
              </div>
            </GlassCardContent>
          </GlassCard>
        )}
      </div>
    </div>
  );
}

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface AppointmentData {
  name: string;
  contact: string;
  email?: string;
  contactPreference: string;
  appointmentType: string;
  preferredTime: string;
  notes: string;
}

interface AppointmentFlowProps {
  onComplete: (data: AppointmentData) => void;
  onCancel: () => void;
  language: string;
}

export default function AppointmentFlow({ onComplete, onCancel, language }: AppointmentFlowProps) {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<AppointmentData>({
    name: "",
    contact: "",
    email: "",
    contactPreference: "phone",
    appointmentType: "tour",
    preferredTime: "",
    notes: "",
  });

  const handleNext = () => {
    if (step === 6) {
      onComplete(data);
    } else {
      setStep(step + 1);
    }
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return data.name.trim().length > 0;
      case 2:
        return data.contact.trim().length > 0;
      case 3:
        return true;
      case 4:
        return data.contactPreference.trim().length > 0;
      case 5:
        return data.preferredTime.trim().length > 0;
      case 6:
        return true;
      default:
        return false;
    }
  };

  return (
    <div className="space-y-4 p-4 bg-card rounded-xl border border-card-border" data-testid="appointment-flow">
      <div className="space-y-2">
        {step === 1 && (
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium">
              {language === "es" ? "¿Cuál es tu nombre?" : "What's your name?"}
            </Label>
            <Input
              id="name"
              data-testid="input-appointment-name"
              value={data.name}
              onChange={(e) => setData({ ...data, name: e.target.value })}
              placeholder={language === "es" ? "Ingresa tu nombre completo" : "Enter your full name"}
              className="w-full"
              autoFocus
            />
          </div>
        )}

        {step === 2 && (
          <div className="space-y-2">
            <Label htmlFor="contact" className="text-sm font-medium">
              {language === "es" ? "¿Cuál es tu número de teléfono?" : "What's your phone number?"}
            </Label>
            <Input
              id="contact"
              data-testid="input-appointment-contact"
              value={data.contact}
              onChange={(e) => setData({ ...data, contact: e.target.value })}
              placeholder={language === "es" ? "Número de teléfono" : "Phone number"}
              className="w-full"
              autoFocus
            />
          </div>
        )}

        {step === 3 && (
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium">
              {language === "es" ? "¿Cuál es tu correo electrónico? (Opcional)" : "What's your email? (Optional)"}
            </Label>
            <Input
              id="email"
              data-testid="input-appointment-email"
              type="email"
              value={data.email}
              onChange={(e) => setData({ ...data, email: e.target.value })}
              placeholder={language === "es" ? "Correo electrónico" : "Email address"}
              className="w-full"
              autoFocus
            />
          </div>
        )}

        {step === 4 && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              {language === "es" ? "¿Cómo prefieres que te contactemos?" : "How should we contact you?"}
            </Label>
            <div className="space-y-2">
              {["phone", "text", "email"].map((pref) => (
                <button
                  key={pref}
                  type="button"
                  data-testid={`button-contact-pref-${pref}`}
                  onClick={() => setData({ ...data, contactPreference: pref })}
                  className={`w-full p-3 text-left rounded-lg border ${
                    data.contactPreference === pref
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background border-border hover-elevate"
                  }`}
                >
                  {pref === "phone" && (language === "es" ? "Llamada telefónica" : "Phone call")}
                  {pref === "text" && (language === "es" ? "Mensaje de texto" : "Text message")}
                  {pref === "email" && (language === "es" ? "Correo electrónico" : "Email")}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              {language === "es" ? "¿Qué tipo de cita prefieres?" : "What type of appointment would you like?"}
            </Label>
            <div className="space-y-2">
              {[
                { id: "tour", label: language === "es" ? "Tour de las instalaciones" : "Facility tour" },
                { id: "call", label: language === "es" ? "Llamada telefónica" : "Phone call" },
                { id: "family", label: language === "es" ? "Llamada de información familiar" : "Family info call" },
              ].map((type) => (
                <button
                  key={type.id}
                  type="button"
                  data-testid={`button-appt-type-${type.id}`}
                  onClick={() => setData({ ...data, appointmentType: type.id })}
                  className={`w-full p-3 text-left rounded-lg border ${
                    data.appointmentType === type.id
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background border-border hover-elevate"
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>
            <Input
              data-testid="input-appointment-time"
              value={data.preferredTime}
              onChange={(e) => setData({ ...data, preferredTime: e.target.value })}
              placeholder={language === "es" ? "Ej: Mañana por la tarde" : "e.g., Tomorrow afternoon"}
              className="w-full mt-3"
            />
          </div>
        )}

        {step === 6 && (
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-sm font-medium">
              {language === "es" ? "¿Información adicional? (Opcional)" : "Any additional information? (Optional)"}
            </Label>
            <Textarea
              id="notes"
              data-testid="input-appointment-notes"
              value={data.notes}
              onChange={(e) => setData({ ...data, notes: e.target.value })}
              placeholder={language === "es" ? "Cualquier otra cosa que quieras que sepamos..." : "Anything else you'd like us to know..."}
              className="w-full min-h-20"
              autoFocus
            />
          </div>
        )}
      </div>

      <div className="flex gap-2 justify-end">
        <Button
          data-testid="button-appointment-cancel"
          variant="outline"
          onClick={onCancel}
          size="sm"
        >
          {language === "es" ? "Cancelar" : "Cancel"}
        </Button>
        <Button
          data-testid="button-appointment-next"
          onClick={handleNext}
          disabled={!canProceed()}
          size="sm"
        >
          {step === 6 ? (language === "es" ? "Enviar" : "Submit") : (language === "es" ? "Siguiente" : "Next")}
        </Button>
      </div>

      <div className="text-xs text-muted-foreground text-center">
        {language === "es" ? `Paso ${step} de 6` : `Step ${step} of 6`}
      </div>
    </div>
  );
}

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface AppointmentData {
  name: string;
  contact: string;
  preferredTime: string;
  notes: string;
}

interface AppointmentFlowProps {
  onComplete: (data: AppointmentData) => void;
  onCancel: () => void;
}

export default function AppointmentFlow({ onComplete, onCancel }: AppointmentFlowProps) {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<AppointmentData>({
    name: "",
    contact: "",
    preferredTime: "",
    notes: "",
  });

  const handleNext = () => {
    if (step === 4) {
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
        return data.preferredTime.trim().length > 0;
      case 4:
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
              What's your name?
            </Label>
            <Input
              id="name"
              data-testid="input-appointment-name"
              value={data.name}
              onChange={(e) => setData({ ...data, name: e.target.value })}
              placeholder="Enter your full name"
              className="w-full"
              autoFocus
            />
          </div>
        )}

        {step === 2 && (
          <div className="space-y-2">
            <Label htmlFor="contact" className="text-sm font-medium">
              How can we reach you?
            </Label>
            <Input
              id="contact"
              data-testid="input-appointment-contact"
              value={data.contact}
              onChange={(e) => setData({ ...data, contact: e.target.value })}
              placeholder="Phone number or email"
              className="w-full"
              autoFocus
            />
          </div>
        )}

        {step === 3 && (
          <div className="space-y-2">
            <Label htmlFor="time" className="text-sm font-medium">
              When would you prefer to connect?
            </Label>
            <Input
              id="time"
              data-testid="input-appointment-time"
              value={data.preferredTime}
              onChange={(e) => setData({ ...data, preferredTime: e.target.value })}
              placeholder="e.g., Tomorrow afternoon, This week"
              className="w-full"
              autoFocus
            />
          </div>
        )}

        {step === 4 && (
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-sm font-medium">
              Any additional information? (Optional)
            </Label>
            <Textarea
              id="notes"
              data-testid="input-appointment-notes"
              value={data.notes}
              onChange={(e) => setData({ ...data, notes: e.target.value })}
              placeholder="Anything else you'd like us to know..."
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
          Cancel
        </Button>
        <Button
          data-testid="button-appointment-next"
          onClick={handleNext}
          disabled={!canProceed()}
          size="sm"
        >
          {step === 4 ? "Submit" : "Next"}
        </Button>
      </div>

      <div className="text-xs text-muted-foreground text-center">
        Step {step} of 4
      </div>
    </div>
  );
}

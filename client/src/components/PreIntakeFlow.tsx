import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export interface PreIntakeData {
  lookingFor: string;
  sobrietyStatus: string;
  hasSupport: string;
  timeline: string;
}

interface PreIntakeFlowProps {
  onComplete: (data: PreIntakeData) => void;
  onCancel: () => void;
  language: string;
}

export default function PreIntakeFlow({ onComplete, onCancel, language }: PreIntakeFlowProps) {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<PreIntakeData>({
    lookingFor: "",
    sobrietyStatus: "",
    hasSupport: "",
    timeline: "",
  });

  const questions = language === "es" ? {
    lookingFor: {
      question: "¿Estás buscando ayuda para ti o para un ser querido?",
      options: [
        { value: "self", label: "Para mí" },
        { value: "loved-one", label: "Para un ser querido" }
      ]
    },
    sobrietyStatus: {
      question: "¿Actualmente estás sobrio/a o necesitarías desintoxicación primero?",
      options: [
        { value: "currently-sober", label: "Actualmente sobrio/a" },
        { value: "need-detox", label: "Necesitaría desintoxicación" },
        { value: "not-sure", label: "No estoy seguro/a" }
      ]
    },
    hasSupport: {
      question: "¿Tienes ingresos o apoyo que pueda ayudar con los costos del programa?",
      options: [
        { value: "yes-income", label: "Sí, tengo ingresos" },
        { value: "yes-family-support", label: "Sí, apoyo familiar" },
        { value: "limited", label: "Limitado" },
        { value: "need-assistance", label: "Necesitaría asistencia" }
      ]
    },
    timeline: {
      question: "¿Cuál es tu línea de tiempo ideal?",
      options: [
        { value: "asap", label: "Lo antes posible" },
        { value: "within-30-days", label: "Dentro de 30 días" },
        { value: "1-3-months", label: "1-3 meses" },
        { value: "just-exploring", label: "Solo explorando" }
      ]
    }
  } : {
    lookingFor: {
      question: "Are you looking for yourself or for a loved one?",
      options: [
        { value: "self", label: "For myself" },
        { value: "loved-one", label: "For a loved one" }
      ]
    },
    sobrietyStatus: {
      question: "Are you currently sober, or would you need detox first?",
      options: [
        { value: "currently-sober", label: "Currently sober" },
        { value: "need-detox", label: "Would need detox" },
        { value: "not-sure", label: "Not sure" }
      ]
    },
    hasSupport: {
      question: "Do you have income or support to help with program costs?",
      options: [
        { value: "yes-income", label: "Yes, I have income" },
        { value: "yes-family-support", label: "Yes, family support" },
        { value: "limited", label: "Limited" },
        { value: "need-assistance", label: "Would need assistance" }
      ]
    },
    timeline: {
      question: "What's your ideal timeline?",
      options: [
        { value: "asap", label: "As soon as possible" },
        { value: "within-30-days", label: "Within 30 days" },
        { value: "1-3-months", label: "1-3 months" },
        { value: "just-exploring", label: "Just exploring" }
      ]
    }
  };

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
        return data.lookingFor !== "";
      case 2:
        return data.sobrietyStatus !== "";
      case 3:
        return data.hasSupport !== "";
      case 4:
        return data.timeline !== "";
      default:
        return false;
    }
  };

  const currentQuestion = 
    step === 1 ? questions.lookingFor :
    step === 2 ? questions.sobrietyStatus :
    step === 3 ? questions.hasSupport :
    questions.timeline;

  const currentField = 
    step === 1 ? "lookingFor" :
    step === 2 ? "sobrietyStatus" :
    step === 3 ? "hasSupport" :
    "timeline";

  return (
    <div className="space-y-4 p-4 bg-card rounded-xl border border-card-border" data-testid="pre-intake-flow">
      <div className="space-y-4">
        <Label className="text-sm font-medium">
          {currentQuestion.question}
        </Label>
        <RadioGroup
          value={data[currentField as keyof PreIntakeData]}
          onValueChange={(value) => setData({ ...data, [currentField]: value })}
        >
          {currentQuestion.options.map((option) => (
            <div key={option.value} className="flex items-center space-x-2">
              <RadioGroupItem
                value={option.value}
                id={option.value}
                data-testid={`radio-${currentField}-${option.value}`}
              />
              <Label htmlFor={option.value} className="cursor-pointer font-normal">
                {option.label}
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>

      <div className="flex gap-2 pt-2">
        <Button
          data-testid="button-pre-intake-cancel"
          variant="outline"
          onClick={onCancel}
          className="flex-1"
        >
          {language === "es" ? "Cancelar" : "Cancel"}
        </Button>
        <Button
          data-testid="button-pre-intake-next"
          onClick={handleNext}
          disabled={!canProceed()}
          className="flex-1"
        >
          {step === 4 
            ? (language === "es" ? "Enviar" : "Submit")
            : (language === "es" ? "Siguiente" : "Next")}
        </Button>
      </div>

      <div className="text-xs text-muted-foreground text-center">
        {language === "es" ? "Paso" : "Step"} {step} {language === "es" ? "de" : "of"} 4
      </div>
    </div>
  );
}

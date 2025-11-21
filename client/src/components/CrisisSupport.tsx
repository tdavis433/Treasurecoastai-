import { AlertCircle, Phone } from "lucide-react";

export default function CrisisSupport() {
  return (
    <div className="space-y-4 p-4 bg-destructive/10 rounded-xl border border-destructive/20" data-testid="crisis-support">
      <div className="flex items-start gap-3">
        <AlertCircle className="h-6 w-6 text-destructive flex-shrink-0 mt-0.5" />
        <div className="space-y-3 flex-1">
          <h3 className="font-semibold text-destructive text-base">
            Crisis Support Resources
          </h3>
          <p className="text-sm text-foreground">
            If you're in crisis or experiencing thoughts of self-harm, please reach out for immediate help:
          </p>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4 text-destructive" />
              <div>
                <div className="font-semibold text-foreground">988 - Suicide & Crisis Lifeline</div>
                <div className="text-muted-foreground">24/7 support for mental health crises</div>
              </div>
            </div>
            
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4 text-destructive" />
              <div>
                <div className="font-semibold text-foreground">1-800-662-HELP (4357)</div>
                <div className="text-muted-foreground">Substance abuse helpline</div>
              </div>
            </div>
            
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4 text-destructive" />
              <div>
                <div className="font-semibold text-foreground">911</div>
                <div className="text-muted-foreground">Emergency services</div>
              </div>
            </div>
          </div>

          <p className="text-sm text-muted-foreground italic">
            You're not alone. Please reach out to someone you trust or call one of these resources.
          </p>
        </div>
      </div>
    </div>
  );
}

import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle, GlassCardDescription } from "@/components/ui/glass-card";

export default function BillingSection() {
  return (
    <GlassCard>
      <GlassCardHeader>
        <GlassCardTitle>Billing</GlassCardTitle>
        <GlassCardDescription>Billing overview</GlassCardDescription>
      </GlassCardHeader>
      <GlassCardContent>
        <p className="text-white/60">Billing management coming soon. Track subscriptions, invoices, and payment status for all clients.</p>
      </GlassCardContent>
    </GlassCard>
  );
}

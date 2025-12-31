import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle, GlassCardDescription } from "@/components/ui/glass-card";

export default function TemplatesSection() {
  return (
    <GlassCard>
      <GlassCardHeader>
        <GlassCardTitle>Templates</GlassCardTitle>
        <GlassCardDescription>Template management interface</GlassCardDescription>
      </GlassCardHeader>
      <GlassCardContent>
        <p className="text-white/60">Template gallery and management coming soon. Templates provide pre-configured bot personalities for different business types.</p>
      </GlassCardContent>
    </GlassCard>
  );
}

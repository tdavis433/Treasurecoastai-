import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle, GlassCardDescription } from "@/components/ui/glass-card";

export default function AnalyticsSection() {
  return (
    <GlassCard>
      <GlassCardHeader>
        <GlassCardTitle>Analytics</GlassCardTitle>
        <GlassCardDescription>Global analytics dashboard</GlassCardDescription>
      </GlassCardHeader>
      <GlassCardContent>
        <p className="text-white/60">Platform-wide analytics and insights coming soon. View aggregate metrics across all clients and bots.</p>
      </GlassCardContent>
    </GlassCard>
  );
}

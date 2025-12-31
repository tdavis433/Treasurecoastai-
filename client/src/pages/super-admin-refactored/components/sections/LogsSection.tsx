import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle, GlassCardDescription } from "@/components/ui/glass-card";

export default function LogsSection() {
  return (
    <GlassCard>
      <GlassCardHeader>
        <GlassCardTitle>System Logs</GlassCardTitle>
        <GlassCardDescription>System logs viewer</GlassCardDescription>
      </GlassCardHeader>
      <GlassCardContent>
        <p className="text-white/60">System logs and audit trail coming soon. Monitor platform activity and troubleshoot issues.</p>
      </GlassCardContent>
    </GlassCard>
  );
}

import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle, GlassCardDescription } from "@/components/ui/glass-card";

export default function UsersSection() {
  return (
    <GlassCard>
      <GlassCardHeader>
        <GlassCardTitle>Users</GlassCardTitle>
        <GlassCardDescription>User management interface</GlassCardDescription>
      </GlassCardHeader>
      <GlassCardContent>
        <p className="text-white/60">User management coming soon. Create and manage admin and client user accounts.</p>
      </GlassCardContent>
    </GlassCard>
  );
}

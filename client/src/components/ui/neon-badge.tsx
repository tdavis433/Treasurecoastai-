import { cn } from "@/lib/utils";

type NeonBadgeVariant = "default" | "new" | "success" | "warning" | "danger" | "info";

interface NeonBadgeProps {
  children: React.ReactNode;
  variant?: NeonBadgeVariant;
  className?: string;
  glow?: boolean;
  "data-testid"?: string;
}

const variantStyles: Record<NeonBadgeVariant, string> = {
  default: "bg-white/10 text-white/85 border-white/20",
  new: "bg-cyan-500/15 text-cyan-400 border-cyan-400/30 shadow-[0_0_10px_rgba(47,226,255,0.2)]",
  success: "bg-emerald-500/15 text-emerald-400 border-emerald-400/30 shadow-[0_0_10px_rgba(52,211,153,0.2)]",
  warning: "bg-amber-500/15 text-amber-400 border-amber-400/30 shadow-[0_0_10px_rgba(251,191,36,0.2)]",
  danger: "bg-red-500/15 text-red-400 border-red-400/30 shadow-[0_0_10px_rgba(248,113,113,0.2)]",
  info: "bg-blue-500/15 text-blue-400 border-blue-400/30 shadow-[0_0_10px_rgba(96,165,250,0.2)]",
};

export function NeonBadge({ 
  children, 
  variant = "default",
  className,
  glow = true,
  "data-testid": testId
}: NeonBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
        "transition-all duration-200",
        variantStyles[variant],
        glow && "hover:brightness-110",
        className
      )}
      data-testid={testId}
    >
      {children}
    </span>
  );
}

export function StatusBadge({ 
  status,
  className,
  "data-testid": testId
}: { 
  status: string;
  className?: string;
  "data-testid"?: string;
}) {
  const statusVariants: Record<string, NeonBadgeVariant> = {
    new: "new",
    contacted: "warning",
    scheduled: "info",
    completed: "success",
    cancelled: "default",
  };

  return (
    <NeonBadge 
      variant={statusVariants[status] || "default"}
      className={className}
      data-testid={testId}
    >
      {status}
    </NeonBadge>
  );
}

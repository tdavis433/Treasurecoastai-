import { cn } from "@/lib/utils";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  glow?: boolean;
  onClick?: () => void;
  "data-testid"?: string;
}

export function GlassCard({ 
  children, 
  className, 
  hover = false,
  glow = false,
  onClick,
  "data-testid": testId 
}: GlassCardProps) {
  return (
    <div
      className={cn(
        "bg-white/[0.03] border border-white/10 rounded-xl backdrop-blur-md overflow-hidden",
        "shadow-[0px_4px_24px_rgba(0,0,0,0.5)]",
        "transition-all duration-200",
        hover && "hover:bg-white/[0.06] hover:border-white/15 cursor-pointer",
        glow && "hover:shadow-[0px_4px_30px_rgba(0,212,255,0.12)]",
        className
      )}
      onClick={onClick}
      data-testid={testId}
    >
      {children}
    </div>
  );
}

export function GlassCardHeader({ 
  children, 
  className 
}: { 
  children: React.ReactNode; 
  className?: string;
}) {
  return (
    <div className={cn("p-6 pb-4", className)}>
      {children}
    </div>
  );
}

export function GlassCardTitle({ 
  children, 
  className 
}: { 
  children: React.ReactNode; 
  className?: string;
}) {
  return (
    <h3 className={cn("text-lg font-semibold text-white", className)}>
      {children}
    </h3>
  );
}

export function GlassCardDescription({ 
  children, 
  className 
}: { 
  children: React.ReactNode; 
  className?: string;
}) {
  return (
    <p className={cn("text-sm text-white/55 mt-1", className)}>
      {children}
    </p>
  );
}

export function GlassCardContent({ 
  children, 
  className 
}: { 
  children: React.ReactNode; 
  className?: string;
}) {
  return (
    <div className={cn("p-6 pt-0 overflow-hidden", className)}>
      {children}
    </div>
  );
}

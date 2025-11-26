import { cn } from "@/lib/utils";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  glow?: boolean;
  "data-testid"?: string;
}

export function GlassCard({ 
  children, 
  className, 
  hover = false,
  glow = false,
  "data-testid": testId 
}: GlassCardProps) {
  return (
    <div
      className={cn(
        "bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md",
        "shadow-[0px_4px_20px_rgba(0,0,0,0.45)]",
        hover && "transition-all duration-300 hover:bg-white/10 hover:border-white/20",
        glow && "hover:shadow-[0px_4px_30px_rgba(79,195,247,0.15)]",
        className
      )}
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
    <div className={cn("p-6 pt-0", className)}>
      {children}
    </div>
  );
}

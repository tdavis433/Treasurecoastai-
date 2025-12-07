import { Badge } from "@/components/ui/badge";
import { TestTube2, Radio } from "lucide-react";

interface TenantBadgeProps {
  isDemo: boolean;
  size?: "sm" | "default" | "lg";
  showLabel?: boolean;
  className?: string;
}

export function TenantBadge({ 
  isDemo, 
  size = "default", 
  showLabel = true,
  className = "" 
}: TenantBadgeProps) {
  const sizeClasses = {
    sm: "text-xs px-1.5 py-0.5",
    default: "text-sm px-2 py-1",
    lg: "text-base px-3 py-1.5"
  };

  const iconSizes = {
    sm: "h-3 w-3",
    default: "h-4 w-4",
    lg: "h-5 w-5"
  };

  if (isDemo) {
    return (
      <Badge 
        className={`bg-amber-500/20 text-amber-400 border-amber-400/40 ${sizeClasses[size]} ${className}`}
        data-testid="badge-tenant-demo"
      >
        <TestTube2 className={`${iconSizes[size]} ${showLabel ? 'mr-1' : ''}`} />
        {showLabel && "DEMO"}
      </Badge>
    );
  }

  return (
    <Badge 
      className={`bg-green-500/20 text-green-400 border-green-400/40 ${sizeClasses[size]} ${className}`}
      data-testid="badge-tenant-live"
    >
      <Radio className={`${iconSizes[size]} ${showLabel ? 'mr-1' : ''}`} />
      {showLabel && "LIVE"}
    </Badge>
  );
}

interface DemoInfoBannerProps {
  className?: string;
}

export function DemoInfoBanner({ className = "" }: DemoInfoBannerProps) {
  return (
    <div 
      className={`flex items-center gap-3 p-3 rounded-lg bg-amber-500/10 border border-amber-400/30 ${className}`}
      data-testid="banner-demo-info"
    >
      <TestTube2 className="h-5 w-5 text-amber-400 flex-shrink-0" />
      <div>
        <p className="text-sm font-medium text-amber-400">Demo Environment</p>
        <p className="text-xs text-white/60">
          This dashboard shows sample demo data only. Demo data can be reset at any time.
        </p>
      </div>
    </div>
  );
}

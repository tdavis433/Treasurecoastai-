import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface FuturisticStatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  trend?: {
    value: number;
    positive: boolean;
  };
  className?: string;
  "data-testid"?: string;
}

export function FuturisticStatCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  trend,
  className,
  "data-testid": testId
}: FuturisticStatCardProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl p-6",
        "bg-white/5 border border-white/12 backdrop-blur-[12px]",
        "shadow-[0px_4px_20px_rgba(0,0,0,0.45)]",
        "transition-all duration-300 hover:bg-white/8 hover:border-white/20",
        "group",
        className
      )}
      data-testid={testId || `stat-card-${title.toLowerCase().replace(/\s+/g, '-')}`}
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-cyan-500/5 to-transparent rounded-bl-full opacity-50 group-hover:opacity-100 transition-opacity" />
      
      <div className="flex items-start justify-between relative">
        <div className="space-y-1">
          <p className="text-sm font-medium text-white/55">
            {title}
          </p>
          <div 
            className="text-3xl font-bold text-white"
            data-testid={`stat-value-${title.toLowerCase().replace(/\s+/g, '-')}`}
          >
            {value}
          </div>
          {subtitle && (
            <p className="text-xs text-white/40 mt-1">
              {subtitle}
            </p>
          )}
          {trend && (
            <p className={cn(
              "text-xs mt-2 font-medium",
              trend.positive ? "text-emerald-400" : "text-red-400"
            )}>
              {trend.positive ? '↑' : '↓'} {Math.abs(trend.value)}% from last period
            </p>
          )}
        </div>
        
        {Icon && (
          <div className="p-3 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/10 border border-cyan-400/20 group-hover:border-cyan-400/40 transition-colors">
            <Icon className="h-5 w-5 text-cyan-400" />
          </div>
        )}
      </div>
    </div>
  );
}

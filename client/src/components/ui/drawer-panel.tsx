import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { X } from "lucide-react";

interface DrawerPanelProps {
  children: React.ReactNode;
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  className?: string;
  "data-testid"?: string;
}

export function DrawerPanel({ 
  children, 
  isOpen, 
  onClose, 
  title,
  subtitle,
  className,
  "data-testid": testId
}: DrawerPanelProps) {
  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent 
        className={cn(
          "sm:max-w-[500px] overflow-y-auto border-l border-white/10",
          "bg-[#11141A] text-white",
          className
        )}
        data-testid={testId}
      >
        <SheetHeader className="sticky top-0 z-10 bg-white/5 backdrop-blur-md border-b border-white/10 -mx-6 -mt-6 px-6 py-5 mb-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              {title && (
                <SheetTitle className="text-xl font-semibold text-white">{title}</SheetTitle>
              )}
              {subtitle && (
                <SheetDescription className="text-sm text-white/55 mt-1">{subtitle}</SheetDescription>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 transition-colors"
              data-testid="button-close-drawer"
              aria-label="Close panel"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </SheetHeader>
        
        <div>
          {children}
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function DrawerSection({ 
  children, 
  title,
  className 
}: { 
  children: React.ReactNode; 
  title?: string;
  className?: string;
}) {
  return (
    <div className={cn("mb-6", className)}>
      {title && (
        <h3 className="text-sm font-medium text-white/55 uppercase tracking-wider mb-3">
          {title}
        </h3>
      )}
      <div className="bg-white/5 rounded-xl border border-white/10 p-4">
        {children}
      </div>
    </div>
  );
}

export function DrawerField({ 
  label, 
  value,
  className 
}: { 
  label: string; 
  value: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex justify-between items-start py-2 border-b border-white/5 last:border-0", className)}>
      <span className="text-sm text-white/55">{label}</span>
      <span className="text-sm text-white/85 text-right">{value || "—"}</span>
    </div>
  );
}

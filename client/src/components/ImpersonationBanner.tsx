import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Eye, LogOut } from "lucide-react";
import { useLocation } from "wouter";

interface ImpersonationStatus {
  isImpersonating: boolean;
  impersonatedBy?: string;
  impersonatedByUsername?: string;
  currentUsername: string;
  currentRole: string;
}

export function ImpersonationBanner() {
  const [, setLocation] = useLocation();

  const { data: status } = useQuery<ImpersonationStatus>({
    queryKey: ["/api/super-admin/impersonation-status"],
    refetchInterval: 30000,
  });

  const handleExitImpersonation = async () => {
    try {
      const response = await fetch("/api/super-admin/exit-impersonation", {
        method: "POST",
      });

      if (response.ok) {
        setLocation("/super-admin");
      }
    } catch (error) {
      console.error("Failed to exit impersonation:", error);
    }
  };

  if (!status?.isImpersonating) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-[#00e5ff] to-[#00b8cc] text-black px-6 py-3 flex items-center justify-between" data-testid="impersonation-banner">
      <div className="flex items-center gap-3">
        <Eye className="w-5 h-5" />
        <div>
          <span className="font-semibold">
            Viewing as {status.currentUsername}
          </span>
          <span className="ml-2 text-sm opacity-80">
            (Super-admin: {status.impersonatedByUsername})
          </span>
        </div>
      </div>

      <Button
        onClick={handleExitImpersonation}
        variant="outline"
        size="sm"
        className="bg-black/20 border-black/30 text-black hover:bg-black/30"
        data-testid="button-exit-impersonation"
      >
        <LogOut className="w-4 h-4 mr-2" />
        Exit Impersonation
      </Button>
    </div>
  );
}

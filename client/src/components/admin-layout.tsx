import { useLocation } from "wouter";
import { Link } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  LayoutDashboard, 
  Calendar, 
  Settings, 
  LogOut,
  Menu,
  BarChart3,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { useState } from "react";
import { AdminProvider, useAdminContext } from "@/contexts/admin-context";
import { cn } from "@/lib/utils";

interface AdminLayoutProps {
  children: React.ReactNode;
}

const navigationItems = [
  { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { name: "Appointments", href: "/admin/appointments", icon: Calendar },
  { name: "Analytics", href: "/admin/analytics", icon: BarChart3 },
  { name: "Settings", href: "/admin/settings", icon: Settings },
];

function AdminLayoutInner({ children }: AdminLayoutProps) {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const { dateRange, setDateRange } = useAdminContext();

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/auth/logout", {});
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Logged out",
        description: "You have been logged out successfully.",
      });
      setLocation("/login");
    },
  });

  return (
    <div className="admin-futuristic flex h-screen">
      {/* Sidebar - 72px minimalistic (expandable) */}
      <aside 
        className={cn(
          "admin-sidebar flex flex-col transition-all duration-300",
          sidebarExpanded && "expanded"
        )}
        data-testid="admin-sidebar"
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-center border-b border-white/10">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-400/30 flex items-center justify-center">
            <span className="text-cyan-400 font-bold text-lg">H</span>
          </div>
          {sidebarExpanded && (
            <span className="ml-3 text-white font-semibold">HopeLine</span>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-6 px-3 space-y-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href || location.startsWith(item.href + "/");
            
            return (
              <Link key={item.href} href={item.href}>
                <div
                  className={cn(
                    "sidebar-item flex items-center gap-3 cursor-pointer",
                    isActive && "active"
                  )}
                  data-testid={`link-${item.name.toLowerCase()}`}
                  title={!sidebarExpanded ? item.name : undefined}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  {sidebarExpanded && (
                    <span className="text-sm font-medium">{item.name}</span>
                  )}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Expand/Collapse & Logout */}
        <div className="p-3 space-y-2 border-t border-white/10">
          <button
            onClick={() => setSidebarExpanded(!sidebarExpanded)}
            className="sidebar-item flex items-center gap-3 w-full cursor-pointer"
            data-testid="button-sidebar-toggle"
          >
            {sidebarExpanded ? (
              <>
                <ChevronLeft className="h-5 w-5" />
                <span className="text-sm">Collapse</span>
              </>
            ) : (
              <ChevronRight className="h-5 w-5" />
            )}
          </button>
          
          <button
            onClick={() => logoutMutation.mutate()}
            disabled={logoutMutation.isPending}
            className="sidebar-item flex items-center gap-3 w-full cursor-pointer text-red-400/70 hover:text-red-400 hover:bg-red-500/10"
            data-testid="button-logout"
            title={!sidebarExpanded ? "Logout" : undefined}
          >
            <LogOut className="h-5 w-5" />
            {sidebarExpanded && (
              <span className="text-sm">
                {logoutMutation.isPending ? "Logging out..." : "Logout"}
              </span>
            )}
          </button>
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar - transparent with blur */}
        <header className="admin-topbar flex items-center justify-between px-6">
          <button
            onClick={() => setSidebarExpanded(!sidebarExpanded)}
            className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors md:hidden"
            data-testid="button-mobile-menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="flex items-center gap-4 ml-auto">
            <div className="flex items-center gap-3">
              <span className="text-sm text-white/55">Date Range:</span>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger 
                  className="w-36 bg-white/5 border-white/10 text-white/85 hover:bg-white/10 focus:ring-cyan-500/30"
                  data-testid="select-global-date-range"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1d24] border-white/10">
                  <SelectItem value="1" className="text-white/85 focus:bg-white/10 focus:text-white">Today</SelectItem>
                  <SelectItem value="7" className="text-white/85 focus:bg-white/10 focus:text-white">Last 7 days</SelectItem>
                  <SelectItem value="30" className="text-white/85 focus:bg-white/10 focus:text-white">Last 30 days</SelectItem>
                  <SelectItem value="90" className="text-white/85 focus:bg-white/10 focus:text-white">Last 90 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

export function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <AdminProvider>
      <AdminLayoutInner>{children}</AdminLayoutInner>
    </AdminProvider>
  );
}

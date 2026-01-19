import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building2, Check, ChevronsUpDown } from "lucide-react";

interface UserWorkspace {
  id: string;
  name: string;
  slug: string;
  role: string;
  membershipId: string;
}

const ROLE_COLORS: Record<string, string> = {
  owner: "bg-purple-500/20 text-purple-400",
  manager: "bg-blue-500/20 text-blue-400",
  staff: "bg-green-500/20 text-green-400",
  agent: "bg-gray-500/20 text-gray-400",
};

export function WorkspaceSwitcher() {
  const [, navigate] = useLocation();
  const [currentWorkspaceSlug, setCurrentWorkspaceSlug] = useState<string | null>(
    localStorage.getItem("currentWorkspaceSlug")
  );

  const { data: workspaces = [], isLoading } = useQuery<UserWorkspace[]>({
    queryKey: ["/api/user/workspaces"],
  });

  const currentWorkspace = workspaces.find((w) => w.slug === currentWorkspaceSlug) || workspaces[0];

  const handleSwitchWorkspace = (workspace: UserWorkspace) => {
    localStorage.setItem("currentWorkspaceSlug", workspace.slug);
    setCurrentWorkspaceSlug(workspace.slug);
    // Refresh the page to load the new workspace context
    window.location.href = "/admin";
  };

  if (isLoading || workspaces.length === 0) {
    return null;
  }

  if (workspaces.length === 1) {
    // Don't show switcher if user only belongs to one workspace
    return (
      <div className="flex items-center gap-2 px-3 py-2">
        <Building2 className="h-4 w-4 text-gray-400" />
        <div className="flex flex-col">
          <span className="text-sm font-medium text-gray-100">{workspaces[0].name}</span>
          <span className="text-xs text-gray-500 capitalize">{workspaces[0].role}</span>
        </div>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          className="w-full justify-between bg-[#151B28] border-gray-700 hover:bg-[#1A2030] hover:border-gray-600"
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Building2 className="h-4 w-4 text-gray-400 flex-shrink-0" />
            <div className="flex flex-col items-start min-w-0 flex-1">
              <span className="text-sm font-medium text-gray-100 truncate w-full">
                {currentWorkspace?.name || "Select workspace"}
              </span>
              {currentWorkspace && (
                <span className="text-xs text-gray-500 capitalize">
                  {currentWorkspace.role}
                </span>
              )}
            </div>
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="w-[280px] bg-[#151B28] border-gray-700"
      >
        <DropdownMenuLabel className="text-gray-400">Switch Workspace</DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-gray-700" />
        {workspaces.map((workspace) => (
          <DropdownMenuItem
            key={workspace.id}
            onClick={() => handleSwitchWorkspace(workspace)}
            className="flex items-center justify-between cursor-pointer hover:bg-[#1A2030] focus:bg-[#1A2030]"
          >
            <div className="flex items-center gap-3 flex-1">
              <div className="h-8 w-8 rounded bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center text-white text-xs font-semibold">
                {workspace.name[0]?.toUpperCase()}
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-sm font-medium text-gray-100 truncate">
                  {workspace.name}
                </span>
                <Badge
                  className={`text-xs w-fit ${ROLE_COLORS[workspace.role] || 'bg-gray-500/20 text-gray-400'}`}
                  variant="outline"
                >
                  {workspace.role}
                </Badge>
              </div>
            </div>
            {currentWorkspace?.id === workspace.id && (
              <Check className="h-4 w-4 text-cyan-400 flex-shrink-0" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

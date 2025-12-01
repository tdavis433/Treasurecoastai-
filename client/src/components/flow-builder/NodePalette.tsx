import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Play,
  MessageSquare,
  HelpCircle,
  GitBranch,
  Sparkles,
  Zap,
  Variable,
  Clock,
  Globe,
  UserPlus,
  Square,
} from "lucide-react";
import type { FlowNodeType } from "./types";
import { NODE_PALETTE } from "./types";
import { cn } from "@/lib/utils";

const iconMap: Record<string, typeof Play> = {
  Play,
  MessageSquare,
  HelpCircle,
  GitBranch,
  Sparkles,
  Zap,
  Variable,
  Clock,
  Globe,
  UserPlus,
  Square,
};

interface NodePaletteProps {
  onDragStart: (type: FlowNodeType) => void;
}

export function NodePalette({ onDragStart }: NodePaletteProps) {
  const handleDragStart = (e: React.DragEvent, type: FlowNodeType) => {
    e.dataTransfer.setData("application/reactflow", type);
    e.dataTransfer.effectAllowed = "move";
    onDragStart(type);
  };

  return (
    <Card className="w-64 h-full border-r rounded-none" data-testid="node-palette">
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-sm font-medium">Node Palette</CardTitle>
      </CardHeader>
      <CardContent className="p-2">
        <ScrollArea className="h-[calc(100vh-12rem)]">
          <div className="space-y-2 p-2">
            {NODE_PALETTE.map((item) => {
              const Icon = iconMap[item.icon];
              return (
                <div
                  key={item.type}
                  draggable
                  onDragStart={(e) => handleDragStart(e, item.type)}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg cursor-grab",
                    "border border-border/50 bg-card",
                    "hover-elevate transition-all duration-200",
                    "active:cursor-grabbing"
                  )}
                  data-testid={`palette-node-${item.type}`}
                >
                  <div className={cn("p-2 rounded-md", item.color)}>
                    {Icon && <Icon className="w-4 h-4 text-white" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.label}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {item.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

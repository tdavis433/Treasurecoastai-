import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FlowBuilder } from "@/components/flow-builder";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { FlowNode, FlowEdge } from "@/components/flow-builder/types";

interface BotFlow {
  id: string;
  name: string;
  workspaceId: string;
  botId: string;
  currentVersionId: string | null;
}

interface BotFlowVersion {
  id: string;
  flowId: string;
  version: number;
  nodes: FlowNode[];
  edges: FlowEdge[];
}

export default function FlowBuilderPage() {
  const [, adminParams] = useRoute("/admin/flows/:flowId");
  const [standaloneMatch] = useRoute("/flow-builder");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const flowId = adminParams?.flowId;
  const isNew = !flowId || flowId === "new" || standaloneMatch;

  const { data: flow, isLoading: flowLoading } = useQuery<BotFlow>({
    queryKey: ["/api/flows", flowId],
    enabled: !isNew && !!flowId,
  });

  const { data: version, isLoading: versionLoading } = useQuery<BotFlowVersion>({
    queryKey: ["/api/flows", flowId, "version"],
    enabled: !isNew && !!flow?.currentVersionId,
  });

  const saveMutation = useMutation({
    mutationFn: async ({ nodes, edges }: { nodes: FlowNode[]; edges: FlowEdge[] }) => {
      if (isNew) {
        const res = await apiRequest("POST", "/api/flows", {
          name: "New Flow",
          nodes,
          edges,
        });
        return res.json();
      } else {
        const res = await apiRequest("POST", `/api/flows/${flowId}/version`, { nodes, edges });
        return res.json();
      }
    },
    onSuccess: (data) => {
      if (isNew && data?.id) {
        setLocation(`/admin/flows/${data.id}`);
      }
      queryClient.invalidateQueries({ queryKey: ["/api/flows"] });
      toast({
        title: "Flow saved",
        description: "Your changes have been saved successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save flow. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSave = (nodes: FlowNode[], edges: FlowEdge[]) => {
    saveMutation.mutate({ nodes, edges });
  };

  const handleTest = () => {
    toast({
      title: "Test Mode",
      description: "Flow testing will open in a new window.",
    });
  };

  const isLoading = !isNew && (flowLoading || versionLoading);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen" data-testid="flow-builder-page">
      <header className="flex items-center justify-between px-4 py-3 border-b bg-card">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/admin/flows")}
            data-testid="button-back"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-lg font-semibold">
              {isNew ? "Create New Flow" : flow?.name || "Flow Builder"}
            </h1>
            <p className="text-sm text-muted-foreground">
              Visual flow editor for chatbot conversations
            </p>
          </div>
        </div>
      </header>
      <div className="flex-1 overflow-hidden">
        <FlowBuilder
          flowId={flowId}
          flowName={flow?.name}
          initialNodes={version?.nodes || []}
          initialEdges={version?.edges || []}
          onSave={handleSave}
          onTest={handleTest}
        />
      </div>
    </div>
  );
}

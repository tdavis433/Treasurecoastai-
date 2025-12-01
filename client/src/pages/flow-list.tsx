import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Plus, Edit, Trash2, Play, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

interface BotFlow {
  id: string;
  name: string;
  description: string | null;
  workspaceId: string;
  botId: string;
  status: string;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function FlowListPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [deleteFlowId, setDeleteFlowId] = useState<string | null>(null);

  const { data: flows, isLoading, error } = useQuery<BotFlow[]>({
    queryKey: ["/api/flows"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (flowId: string) => {
      await apiRequest("DELETE", `/api/flows/${flowId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/flows"] });
      toast({
        title: "Flow deleted",
        description: "The flow has been deleted successfully.",
      });
      setDeleteFlowId(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete flow. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleCreateFlow = () => {
    setLocation("/flow-builder");
  };

  const handleEditFlow = (flowId: string) => {
    setLocation(`/admin/flows/${flowId}`);
  };

  const handleDeleteFlow = () => {
    if (deleteFlowId) {
      deleteMutation.mutate(deleteFlowId);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <p className="text-muted-foreground">Failed to load flows. Please sign in first.</p>
        <Button onClick={() => setLocation("/login")} data-testid="button-login">
          Sign In
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4" data-testid="flow-list-page">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Bot Flows</h1>
          <p className="text-muted-foreground">
            Create and manage your chatbot conversation flows
          </p>
        </div>
        <Button onClick={handleCreateFlow} data-testid="button-create-flow">
          <Plus className="w-4 h-4 mr-2" />
          Create Flow
        </Button>
      </div>

      {flows && flows.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Play className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No flows yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first flow to get started with automated conversations.
            </p>
            <Button onClick={handleCreateFlow} data-testid="button-create-first-flow">
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Flow
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {flows?.map((flow) => (
            <Card key={flow.id} className="hover-elevate" data-testid={`card-flow-${flow.id}`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base truncate">{flow.name}</CardTitle>
                    <CardDescription className="text-xs truncate mt-1">
                      {flow.description || "No description"}
                    </CardDescription>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Badge variant={flow.isPublished ? "default" : "secondary"}>
                      {flow.isPublished ? "Published" : "Draft"}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    Updated {new Date(flow.updatedAt).toLocaleDateString()}
                  </span>
                  <div className="flex gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleEditFlow(flow.id)}
                      data-testid={`button-edit-flow-${flow.id}`}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <AlertDialog open={deleteFlowId === flow.id} onOpenChange={(open) => !open && setDeleteFlowId(null)}>
                      <AlertDialogTrigger asChild>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => setDeleteFlowId(flow.id)}
                          data-testid={`button-delete-flow-${flow.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Flow</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{flow.name}"? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={handleDeleteFlow}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            data-testid="button-confirm-delete"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

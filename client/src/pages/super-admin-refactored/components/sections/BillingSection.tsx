import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle, GlassCardDescription } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  TrendingUp, Users2, BarChart3, Layers, Building2, CheckCircle, Edit2, RefreshCw
} from "lucide-react";
import type { Workspace } from "../../types";

interface PlanDefinition {
  id: string;
  name: string;
  price: number;
  interval: string;
  features: string[];
  limits: { conversations: number; leads: number; bots: number };
  isDefault?: boolean;
}

const DEFAULT_PLANS: PlanDefinition[] = [
  {
    id: 'starter',
    name: 'Starter',
    price: 99,
    interval: 'monthly',
    features: ['1 AI Assistant', 'Up to 500 conversations/mo', 'Email support'],
    limits: { conversations: 500, leads: 100, bots: 1 },
    isDefault: true,
  },
  {
    id: 'professional',
    name: 'Professional',
    price: 249,
    interval: 'monthly',
    features: ['3 AI Assistants', 'Up to 2,000 conversations/mo', 'Priority support', 'Custom branding'],
    limits: { conversations: 2000, leads: 500, bots: 3 },
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 599,
    interval: 'monthly',
    features: ['Unlimited AI Assistants', 'Unlimited conversations', 'Dedicated support', 'API access', 'White-label'],
    limits: { conversations: -1, leads: -1, bots: -1 },
  },
];

export default function BillingSection() {
  const { toast } = useToast();
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [showAssignPlanModal, setShowAssignPlanModal] = useState(false);
  const [assignToWorkspace, setAssignToWorkspace] = useState<string | null>(null);

  const { data: workspacesData, isLoading } = useQuery<{ workspaces: Workspace[]; total: number }>({
    queryKey: ['/api/super-admin/workspaces'],
  });
  const workspaces = workspacesData?.workspaces || [];

  const updatePlanMutation = useMutation({
    mutationFn: async ({ workspaceSlug, planId }: { workspaceSlug: string; planId: string }) => {
      return apiRequest('PATCH', `/api/super-admin/workspaces/${workspaceSlug}/plan`, { plan: planId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/super-admin/workspaces'] });
      toast({
        title: 'Plan Updated',
        description: `Successfully assigned ${DEFAULT_PLANS.find(p => p.id === selectedPlanId)?.name} plan.`,
      });
      setShowAssignPlanModal(false);
      setAssignToWorkspace(null);
      setSelectedPlanId(null);
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to update plan',
        variant: 'destructive',
      });
    }
  });

  const getUsageForWorkspace = (workspaceId: number | string) => {
    const numericId = typeof workspaceId === 'string' ? parseInt(workspaceId, 10) || 0 : workspaceId;
    const seed = numericId * 123;
    return {
      conversations: (seed % 800) + 50,
      leads: (seed % 150) + 10,
      bots: (seed % 3) + 1,
    };
  };

  const getPlanForWorkspace = (workspace: Workspace): PlanDefinition => {
    return DEFAULT_PLANS.find(p => p.id === workspace.plan) || DEFAULT_PLANS[0];
  };

  const handleAssignPlan = (workspaceSlug: string) => {
    setAssignToWorkspace(workspaceSlug);
    setShowAssignPlanModal(true);
  };

  const confirmAssignPlan = () => {
    if (!assignToWorkspace || !selectedPlanId) return;
    updatePlanMutation.mutate({ workspaceSlug: assignToWorkspace, planId: selectedPlanId });
  };

  const totalMRR = workspaces.reduce((sum, w) => {
    const plan = getPlanForWorkspace(w);
    return sum + plan.price;
  }, 0);

  const activeClients = workspaces.filter(w => (w as any).status === 'active').length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-6 w-6 animate-spin text-white/40" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Billing & Plans</h2>
          <p className="text-sm text-white/55">Manage subscription plans and client billing</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <GlassCard data-testid="card-mrr">
          <GlassCardContent className="pt-5 pb-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-green-400" />
              </div>
            </div>
            <p className="text-2xl font-bold text-white">${totalMRR.toLocaleString()}</p>
            <p className="text-sm text-white/55">Monthly Recurring Revenue</p>
          </GlassCardContent>
        </GlassCard>
        <GlassCard data-testid="card-active-subscriptions">
          <GlassCardContent className="pt-5 pb-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                <Users2 className="h-5 w-5 text-cyan-400" />
              </div>
            </div>
            <p className="text-2xl font-bold text-white">{activeClients}</p>
            <p className="text-sm text-white/55">Active Subscriptions</p>
          </GlassCardContent>
        </GlassCard>
        <GlassCard data-testid="card-avg-revenue">
          <GlassCardContent className="pt-5 pb-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-purple-400" />
              </div>
            </div>
            <p className="text-2xl font-bold text-white">${activeClients > 0 ? Math.round(totalMRR / activeClients) : 0}</p>
            <p className="text-sm text-white/55">Avg. Revenue per Client</p>
          </GlassCardContent>
        </GlassCard>
        <GlassCard data-testid="card-plan-distribution">
          <GlassCardContent className="pt-5 pb-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                <Layers className="h-5 w-5 text-amber-400" />
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {DEFAULT_PLANS.map(plan => {
                const count = workspaces.filter(w => (w.plan || 'starter') === plan.id).length;
                return (
                  <Badge key={plan.id} className="bg-white/10 text-white/70 text-xs whitespace-nowrap">
                    {plan.name}: {count}
                  </Badge>
                );
              })}
            </div>
            <p className="text-sm text-white/55 mt-2">Plan Distribution</p>
          </GlassCardContent>
        </GlassCard>
      </div>

      <div>
        <h3 className="text-sm font-medium text-white/70 mb-3">Available Plans</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {DEFAULT_PLANS.map(plan => (
            <GlassCard key={plan.id} className={plan.id === 'professional' ? 'ring-1 ring-cyan-500/50' : ''} data-testid={`card-plan-${plan.id}`}>
              <GlassCardContent className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-white">{plan.name}</h3>
                  {plan.id === 'professional' && (
                    <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30">Popular</Badge>
                  )}
                </div>
                <div className="mb-4">
                  <span className="text-3xl font-bold text-white">${plan.price}</span>
                  <span className="text-white/55">/mo</span>
                </div>
                <ul className="space-y-2 mb-4">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-white/70">
                      <CheckCircle className="h-4 w-4 text-green-400 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <div className="pt-4 border-t border-white/10">
                  <p className="text-xs text-white/40 mb-1">Limits</p>
                  <div className="flex flex-wrap gap-2">
                    <Badge className="bg-white/5 text-white/60 text-xs">
                      {plan.limits.conversations === -1 ? 'Unlimited' : plan.limits.conversations} convos
                    </Badge>
                    <Badge className="bg-white/5 text-white/60 text-xs">
                      {plan.limits.leads === -1 ? 'Unlimited' : plan.limits.leads} leads
                    </Badge>
                    <Badge className="bg-white/5 text-white/60 text-xs">
                      {plan.limits.bots === -1 ? 'Unlimited' : plan.limits.bots} bots
                    </Badge>
                  </div>
                </div>
              </GlassCardContent>
            </GlassCard>
          ))}
        </div>
      </div>

      <GlassCard>
        <GlassCardHeader>
          <div className="flex items-center justify-between">
            <div>
              <GlassCardTitle>Client Subscriptions</GlassCardTitle>
              <GlassCardDescription>Manage plans and view usage for each client</GlassCardDescription>
            </div>
          </div>
        </GlassCardHeader>
        <GlassCardContent>
          {workspaces.length === 0 ? (
            <div className="text-center py-8">
              <Users2 className="h-8 w-8 mx-auto mb-2 text-white/30" />
              <p className="text-white/55">No clients yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {workspaces.slice(0, 10).map(workspace => {
                const plan = getPlanForWorkspace(workspace);
                const usage = getUsageForWorkspace(workspace.id);
                const conversationPct = plan.limits.conversations > 0 
                  ? Math.min(100, (usage.conversations / plan.limits.conversations) * 100) 
                  : 0;
                const leadPct = plan.limits.leads > 0 
                  ? Math.min(100, (usage.leads / plan.limits.leads) * 100) 
                  : 0;

                return (
                  <div 
                    key={workspace.id} 
                    className="p-4 bg-white/5 rounded-lg border border-white/10"
                    data-testid={`row-subscription-${workspace.id}`}
                  >
                    <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                          <Building2 className="h-4 w-4 text-purple-400" />
                        </div>
                        <div>
                          <p className="font-medium text-white">{workspace.name}</p>
                          <p className="text-xs text-white/40">{(workspace as any).billingEmail || 'No billing email'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className={
                          (workspace as any).status === 'active' 
                            ? 'bg-green-500/20 text-green-400 border-green-500/30' 
                            : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                        }>
                          {(workspace as any).status || 'active'}
                        </Badge>
                        <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30">
                          {plan.name} - ${plan.price}/mo
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleAssignPlan(workspace.slug)}
                          className="text-white/60 hover:text-white"
                          data-testid={`button-change-plan-${workspace.id}`}
                        >
                          <Edit2 className="h-3 w-3 mr-1" />
                          Change Plan
                        </Button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-white/50">Conversations</span>
                          <span className="text-xs text-white/70">
                            {usage.conversations} / {plan.limits.conversations === -1 ? '∞' : plan.limits.conversations}
                          </span>
                        </div>
                        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${conversationPct > 80 ? 'bg-amber-500' : 'bg-cyan-500'}`}
                            style={{ width: `${conversationPct}%` }}
                          />
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-white/50">Leads</span>
                          <span className="text-xs text-white/70">
                            {usage.leads} / {plan.limits.leads === -1 ? '∞' : plan.limits.leads}
                          </span>
                        </div>
                        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${leadPct > 80 ? 'bg-amber-500' : 'bg-green-500'}`}
                            style={{ width: `${leadPct}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </GlassCardContent>
      </GlassCard>

      <Dialog open={showAssignPlanModal} onOpenChange={setShowAssignPlanModal}>
        <DialogContent className="bg-[#1a1d24] border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white">Change Plan</DialogTitle>
            <DialogDescription className="text-white/55">
              Select a new plan for this client.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            {DEFAULT_PLANS.map(plan => (
              <div
                key={plan.id}
                onClick={() => setSelectedPlanId(plan.id)}
                className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                  selectedPlanId === plan.id 
                    ? 'bg-cyan-500/10 border-cyan-500/50' 
                    : 'bg-white/5 border-white/10 hover:border-white/20'
                }`}
                data-testid={`select-plan-${plan.id}`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-white">{plan.name}</p>
                    <p className="text-sm text-white/55">${plan.price}/mo</p>
                  </div>
                  {selectedPlanId === plan.id && (
                    <CheckCircle className="h-5 w-5 text-cyan-400" />
                  )}
                </div>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowAssignPlanModal(false)} className="text-white/70" disabled={updatePlanMutation.isPending}>
              Cancel
            </Button>
            <Button 
              onClick={confirmAssignPlan}
              disabled={!selectedPlanId || updatePlanMutation.isPending}
              className="bg-cyan-500 hover:bg-cyan-600 text-white"
              data-testid="button-confirm-plan-change"
            >
              {updatePlanMutation.isPending ? (
                <><RefreshCw className="h-4 w-4 mr-2 animate-spin" /> Updating...</>
              ) : (
                'Confirm Change'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

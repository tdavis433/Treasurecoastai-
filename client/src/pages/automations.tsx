import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, Play, Pause, Trash2, Edit, Zap, Clock, MessageSquare, Users, Calendar, History, TestTube } from "lucide-react";

interface CurrentUser {
  id: string;
  username: string;
  role: 'super_admin' | 'client_admin';
}

interface AutomationWorkflow {
  id: string;
  botId: string;
  name: string;
  description: string | null;
  triggerType: string;
  triggerConfig: {
    keywords?: string[];
    matchType?: string;
    schedule?: string;
    inactivityMinutes?: number;
    messageCountThreshold?: number;
  };
  conditions: Array<{
    id: string;
    field: string;
    operator: string;
    value: string | number | string[];
  }>;
  actions: Array<{
    id: string;
    type: string;
    order: number;
    config: {
      message?: string;
      delay?: number;
      template?: string;
      channel?: string;
      tags?: string[];
    };
  }>;
  status: string;
  priority: number;
  createdAt: string;
  updatedAt: string;
}

interface AutomationRun {
  id: string;
  workflowId: string;
  botId: string;
  sessionId: string | null;
  triggeredAt: string;
  completedAt: string | null;
  status: string;
  triggerContext: {
    message?: string;
    matchedKeywords?: string[];
  };
  result: {
    success: boolean;
    response?: string;
    error?: string;
  };
}

const TRIGGER_TYPES = [
  { value: 'keyword', label: 'Keyword Match', icon: MessageSquare, description: 'Trigger when message contains specific keywords' },
  { value: 'message_count', label: 'Message Count', icon: Zap, description: 'Trigger after N messages in a session' },
  { value: 'inactivity', label: 'Inactivity', icon: Clock, description: 'Trigger after user is inactive for a period' },
  { value: 'lead_captured', label: 'Lead Captured', icon: Users, description: 'Trigger when a lead is captured' },
  { value: 'appointment_booked', label: 'Appointment Booked', icon: Calendar, description: 'Trigger when an appointment is booked' },
];

const ACTION_TYPES = [
  { value: 'send_message', label: 'Send Message' },
  { value: 'capture_lead', label: 'Capture Lead' },
  { value: 'tag_session', label: 'Tag Session' },
  { value: 'notify_staff', label: 'Notify Staff' },
  { value: 'delay', label: 'Add Delay' },
];

export default function AutomationsPage() {
  const { botId } = useParams<{ botId: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState<AutomationWorkflow | null>(null);
  const [testingWorkflow, setTestingWorkflow] = useState<AutomationWorkflow | null>(null);
  const [testMessage, setTestMessage] = useState('');
  const [activeTab, setActiveTab] = useState('workflows');

  const [hasShownAccessDenied, setHasShownAccessDenied] = useState(false);

  const { data: currentUser, isLoading: authLoading } = useQuery<CurrentUser>({
    queryKey: ['/api/auth/me'],
  });

  const isAuthorized = currentUser?.role === 'super_admin';

  useEffect(() => {
    if (authLoading) return;
    
    if (!currentUser) {
      setLocation('/login');
    } else if (!isAuthorized && !hasShownAccessDenied) {
      setHasShownAccessDenied(true);
      toast({
        title: "Access Denied",
        description: "You don't have permission to access this page.",
        variant: "destructive",
      });
      setLocation('/client/dashboard');
    }
  }, [currentUser, authLoading, isAuthorized, hasShownAccessDenied, setLocation, toast]);

  const { data: workflowsData, isLoading: workflowsLoading } = useQuery<{ workflows: AutomationWorkflow[] }>({
    queryKey: ['/api/bots', botId, 'automations'],
    enabled: !!botId && isAuthorized,
  });

  const { data: runsData, isLoading: runsLoading } = useQuery<{ runs: AutomationRun[] }>({
    queryKey: ['/api/bots', botId, 'automation-runs'],
    enabled: !!botId && activeTab === 'history' && isAuthorized,
  });

  const createMutation = useMutation({
    mutationFn: (data: Partial<AutomationWorkflow>) => 
      apiRequest('POST', `/api/bots/${botId}/automations`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bots', botId, 'automations'] });
      setIsCreateOpen(false);
      toast({ title: "Automation created", description: "Your automation workflow has been created." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create automation.", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<AutomationWorkflow> }) =>
      apiRequest('PATCH', `/api/bots/${botId}/automations/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bots', botId, 'automations'] });
      setEditingWorkflow(null);
      toast({ title: "Automation updated", description: "Your automation workflow has been updated." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update automation.", variant: "destructive" });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest('POST', `/api/bots/${botId}/automations/${id}/toggle`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bots', botId, 'automations'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest('DELETE', `/api/bots/${botId}/automations/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bots', botId, 'automations'] });
      toast({ title: "Automation deleted", description: "The automation has been deleted." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete automation.", variant: "destructive" });
    },
  });

  const testMutation = useMutation({
    mutationFn: ({ id, testMessage }: { id: string; testMessage: string }) =>
      apiRequest('POST', `/api/bots/${botId}/automations/${id}/test`, { testMessage }),
    onSuccess: (data) => {
      const result = (data as any).testResult;
      toast({
        title: result.wouldTrigger ? "Automation would trigger" : "Automation would not trigger",
        description: result.wouldTrigger 
          ? `Matched: ${result.matchedConditions.join(', ')}` 
          : "No conditions matched for this test message.",
      });
    },
  });

  const workflows = workflowsData?.workflows || [];
  const runs = runsData?.runs || [];

  const getTriggerIcon = (type: string) => {
    const trigger = TRIGGER_TYPES.find(t => t.value === type);
    return trigger?.icon || Zap;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'paused': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'draft': return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setLocation(`/admin/bot/${botId}`)}
            data-testid="button-back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold" data-testid="text-page-title">Automations</h1>
            <p className="text-muted-foreground">Configure automated responses and workflows for your bot</p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-create-automation">
                <Plus className="h-4 w-4 mr-2" />
                New Automation
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <AutomationForm
                onSubmit={(data) => createMutation.mutate(data)}
                onCancel={() => setIsCreateOpen(false)}
                isSubmitting={createMutation.isPending}
              />
            </DialogContent>
          </Dialog>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="workflows" data-testid="tab-workflows">
              <Zap className="h-4 w-4 mr-2" />
              Workflows ({workflows.length})
            </TabsTrigger>
            <TabsTrigger value="history" data-testid="tab-history">
              <History className="h-4 w-4 mr-2" />
              Run History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="workflows" className="space-y-4">
            {workflowsLoading ? (
              <Card><CardContent className="p-6 text-center">Loading automations...</CardContent></Card>
            ) : workflows.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Zap className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Automations Yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Create your first automation to respond to keywords, capture leads, or send scheduled messages.
                  </p>
                  <Button onClick={() => setIsCreateOpen(true)} data-testid="button-create-first">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Automation
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {workflows.map((workflow) => {
                  const TriggerIcon = getTriggerIcon(workflow.triggerType);
                  return (
                    <Card key={workflow.id} data-testid={`card-workflow-${workflow.id}`}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          <div className="p-2 rounded-lg bg-primary/10">
                            <TriggerIcon className="h-5 w-5 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-medium truncate" data-testid={`text-workflow-name-${workflow.id}`}>
                                {workflow.name}
                              </h3>
                              <Badge className={getStatusColor(workflow.status)} data-testid={`badge-status-${workflow.id}`}>
                                {workflow.status}
                              </Badge>
                            </div>
                            {workflow.description && (
                              <p className="text-sm text-muted-foreground mb-2 truncate">
                                {workflow.description}
                              </p>
                            )}
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span>Trigger: {TRIGGER_TYPES.find(t => t.value === workflow.triggerType)?.label}</span>
                              <span>Actions: {workflow.actions?.length || 0}</span>
                              <span>Priority: {workflow.priority}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={workflow.status === 'active'}
                              onCheckedChange={() => toggleMutation.mutate(workflow.id)}
                              data-testid={`switch-toggle-${workflow.id}`}
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setTestingWorkflow(workflow)}
                              data-testid={`button-test-${workflow.id}`}
                            >
                              <TestTube className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setEditingWorkflow(workflow)}
                              data-testid={`button-edit-${workflow.id}`}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                if (confirm('Are you sure you want to delete this automation?')) {
                                  deleteMutation.mutate(workflow.id);
                                }
                              }}
                              data-testid={`button-delete-${workflow.id}`}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            {runsLoading ? (
              <Card><CardContent className="p-6 text-center">Loading run history...</CardContent></Card>
            ) : runs.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <History className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Run History</h3>
                  <p className="text-muted-foreground">
                    When your automations trigger, their execution history will appear here.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Recent Automation Runs (Last 24h)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {runs.map((run) => {
                      const workflow = workflows.find(w => w.id === run.workflowId);
                      return (
                        <div 
                          key={run.id} 
                          className="flex items-center gap-4 p-3 rounded-lg bg-muted/50"
                          data-testid={`run-${run.id}`}
                        >
                          <Badge className={run.result.success ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}>
                            {run.status}
                          </Badge>
                          <div className="flex-1">
                            <p className="text-sm font-medium">{workflow?.name || 'Unknown Workflow'}</p>
                            {run.triggerContext.message && (
                              <p className="text-xs text-muted-foreground truncate">
                                Message: "{run.triggerContext.message}"
                              </p>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {new Date(run.triggeredAt).toLocaleString()}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        <Dialog open={!!editingWorkflow} onOpenChange={(open) => !open && setEditingWorkflow(null)}>
          <DialogContent className="max-w-2xl">
            {editingWorkflow && (
              <AutomationForm
                workflow={editingWorkflow}
                onSubmit={(data) => updateMutation.mutate({ id: editingWorkflow.id, data })}
                onCancel={() => setEditingWorkflow(null)}
                isSubmitting={updateMutation.isPending}
              />
            )}
          </DialogContent>
        </Dialog>

        <Dialog open={!!testingWorkflow} onOpenChange={(open) => !open && setTestingWorkflow(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Test Automation: {testingWorkflow?.name}</DialogTitle>
              <DialogDescription>
                Enter a test message to see if this automation would trigger.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Test Message</Label>
                <Textarea
                  placeholder="Enter a sample user message..."
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                  data-testid="input-test-message"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setTestingWorkflow(null)}>Cancel</Button>
              <Button 
                onClick={() => {
                  if (testingWorkflow) {
                    testMutation.mutate({ id: testingWorkflow.id, testMessage });
                  }
                }}
                disabled={testMutation.isPending}
                data-testid="button-run-test"
              >
                <TestTube className="h-4 w-4 mr-2" />
                Run Test
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

interface AutomationFormProps {
  workflow?: AutomationWorkflow;
  onSubmit: (data: Partial<AutomationWorkflow>) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

function AutomationForm({ workflow, onSubmit, onCancel, isSubmitting }: AutomationFormProps) {
  const [name, setName] = useState(workflow?.name || '');
  const [description, setDescription] = useState(workflow?.description || '');
  const [triggerType, setTriggerType] = useState(workflow?.triggerType || 'keyword');
  const [keywords, setKeywords] = useState((workflow?.triggerConfig?.keywords || []).join(', '));
  const [matchType, setMatchType] = useState(workflow?.triggerConfig?.matchType || 'contains');
  const [messageThreshold, setMessageThreshold] = useState(workflow?.triggerConfig?.messageCountThreshold?.toString() || '5');
  const [inactivityMinutes, setInactivityMinutes] = useState(workflow?.triggerConfig?.inactivityMinutes?.toString() || '10');
  const [responseMessage, setResponseMessage] = useState(workflow?.actions?.[0]?.config?.message || '');
  const [priority, setPriority] = useState(workflow?.priority?.toString() || '10');
  const [status, setStatus] = useState(workflow?.status || 'active');

  const handleSubmit = () => {
    const actions: AutomationWorkflow['actions'] = [];
    if (responseMessage) {
      actions.push({
        id: `action_${Date.now()}`,
        type: 'send_message',
        order: 0,
        config: { message: responseMessage },
      });
    }

    const triggerConfig: AutomationWorkflow['triggerConfig'] = {};
    if (triggerType === 'keyword') {
      triggerConfig.keywords = keywords.split(',').map(k => k.trim()).filter(Boolean);
      triggerConfig.matchType = matchType;
    } else if (triggerType === 'message_count') {
      triggerConfig.messageCountThreshold = parseInt(messageThreshold);
    } else if (triggerType === 'inactivity') {
      triggerConfig.inactivityMinutes = parseInt(inactivityMinutes);
    }

    onSubmit({
      name,
      description: description || null,
      triggerType,
      triggerConfig,
      actions,
      priority: parseInt(priority),
      status,
    });
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>{workflow ? 'Edit Automation' : 'Create New Automation'}</DialogTitle>
        <DialogDescription>
          Configure when this automation triggers and what actions it takes.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <Label>Name *</Label>
            <Input
              placeholder="e.g., Pricing Inquiry Response"
              value={name}
              onChange={(e) => setName(e.target.value)}
              data-testid="input-workflow-name"
            />
          </div>

          <div className="col-span-2">
            <Label>Description</Label>
            <Textarea
              placeholder="Describe what this automation does..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              data-testid="input-workflow-description"
            />
          </div>

          <div>
            <Label>Trigger Type *</Label>
            <Select value={triggerType} onValueChange={setTriggerType}>
              <SelectTrigger data-testid="select-trigger-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TRIGGER_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger data-testid="select-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {triggerType === 'keyword' && (
            <>
              <div className="col-span-2">
                <Label>Keywords (comma-separated)</Label>
                <Input
                  placeholder="pricing, cost, how much, price"
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  data-testid="input-keywords"
                />
              </div>
              <div>
                <Label>Match Type</Label>
                <Select value={matchType} onValueChange={setMatchType}>
                  <SelectTrigger data-testid="select-match-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="contains">Contains</SelectItem>
                    <SelectItem value="exact">Exact Match</SelectItem>
                    <SelectItem value="regex">Regex</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          {triggerType === 'message_count' && (
            <div>
              <Label>Message Count Threshold</Label>
              <Input
                type="number"
                min="1"
                value={messageThreshold}
                onChange={(e) => setMessageThreshold(e.target.value)}
                data-testid="input-message-threshold"
              />
            </div>
          )}

          {triggerType === 'inactivity' && (
            <div>
              <Label>Inactivity Minutes</Label>
              <Input
                type="number"
                min="1"
                value={inactivityMinutes}
                onChange={(e) => setInactivityMinutes(e.target.value)}
                data-testid="input-inactivity-minutes"
              />
            </div>
          )}

          <div>
            <Label>Priority (higher = evaluated first)</Label>
            <Input
              type="number"
              min="1"
              max="100"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              data-testid="input-priority"
            />
          </div>

          <div className="col-span-2">
            <Label>Response Message</Label>
            <Textarea
              placeholder="The message to send when this automation triggers..."
              value={responseMessage}
              onChange={(e) => setResponseMessage(e.target.value)}
              rows={4}
              data-testid="input-response-message"
            />
          </div>
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={isSubmitting || !name} data-testid="button-save-automation">
          {isSubmitting ? 'Saving...' : workflow ? 'Update Automation' : 'Create Automation'}
        </Button>
      </DialogFooter>
    </>
  );
}

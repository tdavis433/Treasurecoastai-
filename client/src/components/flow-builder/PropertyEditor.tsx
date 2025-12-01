import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, X } from "lucide-react";
import type { FlowNode, FlowNodeData } from "./types";

interface PropertyEditorProps {
  node: FlowNode | null;
  onUpdate: (nodeId: string, data: Partial<FlowNodeData>) => void;
  onClose: () => void;
}

export function PropertyEditor({ node, onUpdate, onClose }: PropertyEditorProps) {
  if (!node) {
    return (
      <Card className="w-80 h-full border-l rounded-none" data-testid="property-editor-empty">
        <CardHeader className="p-4">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Select a node to edit
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }

  const updateData = (updates: Partial<FlowNodeData>) => {
    onUpdate(node.id, { ...node.data, ...updates });
  };

  return (
    <Card className="w-80 h-full border-l rounded-none" data-testid="property-editor">
      <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-medium capitalize">
          {node.type.replace("_", " ")} Properties
        </CardTitle>
        <Button size="icon" variant="ghost" onClick={onClose} data-testid="button-close-editor">
          <X className="w-4 h-4" />
        </Button>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <ScrollArea className="h-[calc(100vh-12rem)]">
          <div className="space-y-4 pr-4">
            <div className="space-y-2">
              <Label htmlFor="node-label">Label</Label>
              <Input
                id="node-label"
                value={node.data.label || ""}
                onChange={(e) => updateData({ label: e.target.value })}
                placeholder="Node label"
                data-testid="input-node-label"
              />
            </div>

            {renderNodeProperties(node, updateData)}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

function renderNodeProperties(
  node: FlowNode,
  updateData: (updates: Partial<FlowNodeData>) => void
) {
  switch (node.type) {
    case "start":
      return <StartProperties data={node.data} onUpdate={updateData} />;
    case "message":
      return <MessageProperties data={node.data} onUpdate={updateData} />;
    case "question":
      return <QuestionProperties data={node.data} onUpdate={updateData} />;
    case "condition":
      return <ConditionProperties data={node.data} onUpdate={updateData} />;
    case "ai_answer":
      return <AIAnswerProperties data={node.data} onUpdate={updateData} />;
    case "action":
      return <ActionProperties data={node.data} onUpdate={updateData} />;
    case "set_variable":
      return <SetVariableProperties data={node.data} onUpdate={updateData} />;
    case "delay":
      return <DelayProperties data={node.data} onUpdate={updateData} />;
    case "api_call":
      return <APICallProperties data={node.data} onUpdate={updateData} />;
    case "handoff":
      return <HandoffProperties data={node.data} onUpdate={updateData} />;
    case "end":
      return <EndProperties data={node.data} onUpdate={updateData} />;
    default:
      return null;
  }
}

interface PropertyProps {
  data: FlowNodeData;
  onUpdate: (updates: Partial<FlowNodeData>) => void;
}

function StartProperties({ data, onUpdate }: PropertyProps) {
  const triggers = data.triggers || [];

  const addTrigger = () => {
    onUpdate({
      triggers: [...triggers, { type: "message", pattern: "" }],
    });
  };

  const updateTrigger = (index: number, updates: Partial<(typeof triggers)[0]>) => {
    const newTriggers = [...triggers];
    newTriggers[index] = { ...newTriggers[index], ...updates };
    onUpdate({ triggers: newTriggers });
  };

  const removeTrigger = (index: number) => {
    onUpdate({ triggers: triggers.filter((_, i) => i !== index) });
  };

  return (
    <>
      <div className="p-3 rounded-lg border bg-muted/30">
        <p className="text-sm text-muted-foreground">
          This is the entry point for your bot flow. Configure triggers to determine when this flow should start.
        </p>
      </div>
      <Separator />
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Triggers</Label>
          <Button size="sm" variant="outline" onClick={addTrigger} data-testid="button-add-trigger">
            <Plus className="w-3 h-3 mr-1" /> Add
          </Button>
        </div>
        {triggers.length === 0 && (
          <p className="text-xs text-muted-foreground">
            No triggers configured. Flow will start on any incoming message.
          </p>
        )}
        {triggers.map((trigger, i) => (
          <div key={i} className="space-y-2 p-3 rounded-lg border bg-muted/30">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium">Trigger {i + 1}</span>
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6"
                onClick={() => removeTrigger(i)}
                data-testid={`button-remove-trigger-${i}`}
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
            <Select
              value={trigger.type || "message"}
              onValueChange={(v) => updateTrigger(i, { type: v })}
            >
              <SelectTrigger data-testid={`select-trigger-type-${i}`}>
                <SelectValue placeholder="Trigger type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="message">Message contains</SelectItem>
                <SelectItem value="intent">Intent detected</SelectItem>
                <SelectItem value="page_visit">Page visit</SelectItem>
                <SelectItem value="event">Custom event</SelectItem>
                <SelectItem value="schedule">Scheduled</SelectItem>
              </SelectContent>
            </Select>
            <Input
              value={trigger.pattern || ""}
              onChange={(e) => updateTrigger(i, { pattern: e.target.value })}
              placeholder={
                trigger.type === "message" ? "Enter keyword or phrase..." :
                trigger.type === "intent" ? "Intent name..." :
                trigger.type === "page_visit" ? "URL pattern..." :
                trigger.type === "event" ? "Event name..." :
                "Cron expression..."
              }
              data-testid={`input-trigger-pattern-${i}`}
            />
          </div>
        ))}
      </div>
      <Separator />
      <div className="space-y-2">
        <Label htmlFor="greeting">Initial Greeting</Label>
        <Textarea
          id="greeting"
          value={data.content || ""}
          onChange={(e) => onUpdate({ content: e.target.value })}
          placeholder="Optional greeting message..."
          data-testid="input-start-greeting"
        />
      </div>
    </>
  );
}

function MessageProperties({ data, onUpdate }: PropertyProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="message-content">Message Content</Label>
      <Textarea
        id="message-content"
        value={data.content || ""}
        onChange={(e) => onUpdate({ content: e.target.value })}
        placeholder="Enter your message..."
        className="min-h-[100px]"
        data-testid="input-message-content"
      />
      <p className="text-xs text-muted-foreground">
        Use {"{{variable}}"} to insert variables
      </p>
    </div>
  );
}

function QuestionProperties({ data, onUpdate }: PropertyProps) {
  const options = data.options || [];

  const addOption = () => {
    onUpdate({
      options: [...options, { label: "", value: "" }],
    });
  };

  const updateOption = (index: number, field: "label" | "value", value: string) => {
    const newOptions = [...options];
    newOptions[index] = { ...newOptions[index], [field]: value };
    onUpdate({ options: newOptions });
  };

  const removeOption = (index: number) => {
    onUpdate({ options: options.filter((_, i) => i !== index) });
  };

  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="question-content">Question</Label>
        <Textarea
          id="question-content"
          value={data.content || ""}
          onChange={(e) => onUpdate({ content: e.target.value })}
          placeholder="Enter your question..."
          data-testid="input-question-content"
        />
      </div>
      <div className="space-y-2">
        <Label>Store answer in</Label>
        <Input
          value={data.variable || ""}
          onChange={(e) => onUpdate({ variable: e.target.value })}
          placeholder="variable_name"
          data-testid="input-question-variable"
        />
      </div>
      <Separator />
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Options</Label>
          <Button size="sm" variant="outline" onClick={addOption} data-testid="button-add-option">
            <Plus className="w-3 h-3 mr-1" /> Add
          </Button>
        </div>
        {options.map((opt, i) => (
          <div key={i} className="flex gap-2">
            <Input
              value={opt.label}
              onChange={(e) => updateOption(i, "label", e.target.value)}
              placeholder="Label"
              className="flex-1"
              data-testid={`input-option-label-${i}`}
            />
            <Input
              value={opt.value}
              onChange={(e) => updateOption(i, "value", e.target.value)}
              placeholder="Value"
              className="flex-1"
              data-testid={`input-option-value-${i}`}
            />
            <Button
              size="icon"
              variant="ghost"
              onClick={() => removeOption(i)}
              data-testid={`button-remove-option-${i}`}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        ))}
      </div>
    </>
  );
}

function ConditionProperties({ data, onUpdate }: PropertyProps) {
  const conditions = data.conditions || [];

  const addCondition = () => {
    onUpdate({
      conditions: [...conditions, { variable: "", operator: "equals", value: "" }],
    });
  };

  const updateCondition = (
    index: number,
    field: "variable" | "operator" | "value",
    value: string
  ) => {
    const newConditions = [...conditions];
    newConditions[index] = { ...newConditions[index], [field]: value };
    onUpdate({ conditions: newConditions });
  };

  const removeCondition = (index: number) => {
    onUpdate({ conditions: conditions.filter((_, i) => i !== index) });
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>Conditions</Label>
        <Button size="sm" variant="outline" onClick={addCondition} data-testid="button-add-condition">
          <Plus className="w-3 h-3 mr-1" /> Add
        </Button>
      </div>
      {conditions.map((cond, i) => (
        <div key={i} className="space-y-2 p-3 rounded-lg border bg-muted/30">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium">Condition {i + 1}</span>
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6"
              onClick={() => removeCondition(i)}
              data-testid={`button-remove-condition-${i}`}
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
          <Input
            value={cond.variable}
            onChange={(e) => updateCondition(i, "variable", e.target.value)}
            placeholder="Variable name"
            data-testid={`input-condition-variable-${i}`}
          />
          <Select
            value={cond.operator}
            onValueChange={(v) => updateCondition(i, "operator", v)}
          >
            <SelectTrigger data-testid={`select-condition-operator-${i}`}>
              <SelectValue placeholder="Operator" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="equals">Equals</SelectItem>
              <SelectItem value="not_equals">Not equals</SelectItem>
              <SelectItem value="contains">Contains</SelectItem>
              <SelectItem value="not_contains">Not contains</SelectItem>
              <SelectItem value="greater_than">Greater than</SelectItem>
              <SelectItem value="less_than">Less than</SelectItem>
              <SelectItem value="is_empty">Is empty</SelectItem>
              <SelectItem value="is_not_empty">Is not empty</SelectItem>
            </SelectContent>
          </Select>
          <Input
            value={cond.value}
            onChange={(e) => updateCondition(i, "value", e.target.value)}
            placeholder="Compare value"
            data-testid={`input-condition-value-${i}`}
          />
        </div>
      ))}
    </div>
  );
}

function AIAnswerProperties({ data, onUpdate }: PropertyProps) {
  const aiConfig = data.aiConfig || {};

  const updateConfig = (updates: Partial<typeof aiConfig>) => {
    onUpdate({ aiConfig: { ...aiConfig, ...updates } });
  };

  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="ai-prompt">System Prompt</Label>
        <Textarea
          id="ai-prompt"
          value={aiConfig.systemPrompt || ""}
          onChange={(e) => updateConfig({ systemPrompt: e.target.value })}
          placeholder="You are a helpful assistant..."
          className="min-h-[100px]"
          data-testid="input-ai-prompt"
        />
      </div>
      <div className="space-y-2">
        <Label>Model</Label>
        <Select
          value={aiConfig.model || "gpt-4o"}
          onValueChange={(v) => updateConfig({ model: v })}
        >
          <SelectTrigger data-testid="select-ai-model">
            <SelectValue placeholder="Select model" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="gpt-4o">GPT-4o</SelectItem>
            <SelectItem value="gpt-4o-mini">GPT-4o Mini</SelectItem>
            <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="ai-temp">Temperature: {aiConfig.temperature ?? 0.7}</Label>
        <Input
          id="ai-temp"
          type="range"
          min="0"
          max="2"
          step="0.1"
          value={aiConfig.temperature ?? 0.7}
          onChange={(e) => updateConfig({ temperature: parseFloat(e.target.value) })}
          data-testid="input-ai-temperature"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="ai-fallback">Fallback Message</Label>
        <Textarea
          id="ai-fallback"
          value={aiConfig.fallbackMessage || ""}
          onChange={(e) => updateConfig({ fallbackMessage: e.target.value })}
          placeholder="Sorry, I couldn't process that..."
          data-testid="input-ai-fallback"
        />
      </div>
    </>
  );
}

function ActionProperties({ data, onUpdate }: PropertyProps) {
  const actions = data.actions || [];

  const addAction = () => {
    onUpdate({
      actions: [...actions, { type: "set_variable", config: {} }],
    });
  };

  const updateAction = (index: number, updates: Partial<(typeof actions)[0]>) => {
    const newActions = [...actions];
    newActions[index] = { ...newActions[index], ...updates };
    onUpdate({ actions: newActions });
  };

  const removeAction = (index: number) => {
    onUpdate({ actions: actions.filter((_, i) => i !== index) });
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>Actions</Label>
        <Button size="sm" variant="outline" onClick={addAction} data-testid="button-add-action">
          <Plus className="w-3 h-3 mr-1" /> Add
        </Button>
      </div>
      {actions.map((action, i) => (
        <div key={i} className="space-y-2 p-3 rounded-lg border bg-muted/30">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium">Action {i + 1}</span>
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6"
              onClick={() => removeAction(i)}
              data-testid={`button-remove-action-${i}`}
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
          <Select
            value={action.type}
            onValueChange={(v) => updateAction(i, { type: v })}
          >
            <SelectTrigger data-testid={`select-action-type-${i}`}>
              <SelectValue placeholder="Action type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="set_variable">Set Variable</SelectItem>
              <SelectItem value="create_lead">Create Lead</SelectItem>
              <SelectItem value="trigger_webhook">Trigger Webhook</SelectItem>
              <SelectItem value="send_email">Send Email</SelectItem>
              <SelectItem value="add_tag">Add Tag</SelectItem>
            </SelectContent>
          </Select>
        </div>
      ))}
    </div>
  );
}

function SetVariableProperties({ data, onUpdate }: PropertyProps) {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="var-name">Variable Name</Label>
        <Input
          id="var-name"
          value={data.variable || ""}
          onChange={(e) => onUpdate({ variable: e.target.value })}
          placeholder="my_variable"
          data-testid="input-variable-name"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="var-value">Value</Label>
        <Textarea
          id="var-value"
          value={data.content || ""}
          onChange={(e) => onUpdate({ content: e.target.value })}
          placeholder="Enter value or {{variable}}"
          data-testid="input-variable-value"
        />
      </div>
    </>
  );
}

function DelayProperties({ data, onUpdate }: PropertyProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="delay-seconds">Delay (seconds)</Label>
      <Input
        id="delay-seconds"
        type="number"
        min="0"
        max="3600"
        value={data.delaySeconds || 0}
        onChange={(e) => onUpdate({ delaySeconds: parseInt(e.target.value) || 0 })}
        data-testid="input-delay-seconds"
      />
    </div>
  );
}

function APICallProperties({ data, onUpdate }: PropertyProps) {
  const apiConfig = data.apiConfig || {};

  const updateConfig = (updates: Partial<typeof apiConfig>) => {
    onUpdate({ apiConfig: { ...apiConfig, ...updates } });
  };

  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="api-url">URL</Label>
        <Input
          id="api-url"
          value={apiConfig.url || ""}
          onChange={(e) => updateConfig({ url: e.target.value })}
          placeholder="https://api.example.com/endpoint"
          data-testid="input-api-url"
        />
      </div>
      <div className="space-y-2">
        <Label>Method</Label>
        <Select
          value={apiConfig.method || "GET"}
          onValueChange={(v) => updateConfig({ method: v })}
        >
          <SelectTrigger data-testid="select-api-method">
            <SelectValue placeholder="Method" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="GET">GET</SelectItem>
            <SelectItem value="POST">POST</SelectItem>
            <SelectItem value="PUT">PUT</SelectItem>
            <SelectItem value="DELETE">DELETE</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="api-body">Request Body (JSON)</Label>
        <Textarea
          id="api-body"
          value={apiConfig.body || ""}
          onChange={(e) => updateConfig({ body: e.target.value })}
          placeholder='{"key": "{{value}}"}'
          data-testid="input-api-body"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="api-response-var">Store response in</Label>
        <Input
          id="api-response-var"
          value={apiConfig.responseVariable || ""}
          onChange={(e) => updateConfig({ responseVariable: e.target.value })}
          placeholder="api_response"
          data-testid="input-api-response-variable"
        />
      </div>
    </>
  );
}

function HandoffProperties({ data, onUpdate }: PropertyProps) {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="handoff-reason">Handoff Reason</Label>
        <Textarea
          id="handoff-reason"
          value={data.reason || ""}
          onChange={(e) => onUpdate({ reason: e.target.value })}
          placeholder="User requested human assistance"
          data-testid="input-handoff-reason"
        />
      </div>
      <div className="space-y-2">
        <Label>Priority</Label>
        <Select
          value={data.priority || "normal"}
          onValueChange={(v) => onUpdate({ priority: v })}
        >
          <SelectTrigger data-testid="select-handoff-priority">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="normal">Normal</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="urgent">Urgent</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="handoff-message">Message to User</Label>
        <Textarea
          id="handoff-message"
          value={data.content || ""}
          onChange={(e) => onUpdate({ content: e.target.value })}
          placeholder="Connecting you with a human agent..."
          data-testid="input-handoff-message"
        />
      </div>
    </>
  );
}

function EndProperties({ data, onUpdate }: PropertyProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="end-message">Closing Message</Label>
      <Textarea
        id="end-message"
        value={data.content || ""}
        onChange={(e) => onUpdate({ content: e.target.value })}
        placeholder="Thank you for chatting with us!"
        data-testid="input-end-message"
      />
    </div>
  );
}

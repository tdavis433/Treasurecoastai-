import { Handle, Position, type NodeProps, type Node } from "@xyflow/react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import type { FlowNodeData, FlowNodeType } from "./types";
import { cn } from "@/lib/utils";

type CustomNode = Node<FlowNodeData, FlowNodeType>;

const nodeIcons: Record<FlowNodeType, typeof Play> = {
  start: Play,
  message: MessageSquare,
  question: HelpCircle,
  condition: GitBranch,
  ai_answer: Sparkles,
  action: Zap,
  set_variable: Variable,
  delay: Clock,
  api_call: Globe,
  handoff: UserPlus,
  end: Square,
};

const nodeColors: Record<FlowNodeType, string> = {
  start: "border-emerald-500 bg-emerald-500/10",
  message: "border-blue-500 bg-blue-500/10",
  question: "border-purple-500 bg-purple-500/10",
  condition: "border-amber-500 bg-amber-500/10",
  ai_answer: "border-pink-500 bg-pink-500/10",
  action: "border-orange-500 bg-orange-500/10",
  set_variable: "border-cyan-500 bg-cyan-500/10",
  delay: "border-slate-500 bg-slate-500/10",
  api_call: "border-indigo-500 bg-indigo-500/10",
  handoff: "border-rose-500 bg-rose-500/10",
  end: "border-red-500 bg-red-500/10",
};

const iconColors: Record<FlowNodeType, string> = {
  start: "text-emerald-500",
  message: "text-blue-500",
  question: "text-purple-500",
  condition: "text-amber-500",
  ai_answer: "text-pink-500",
  action: "text-orange-500",
  set_variable: "text-cyan-500",
  delay: "text-slate-500",
  api_call: "text-indigo-500",
  handoff: "text-rose-500",
  end: "text-red-500",
};

interface BaseNodeProps {
  type: FlowNodeType;
  data: FlowNodeData;
  selected?: boolean;
}

function BaseNode({ type, data, selected }: BaseNodeProps) {
  const Icon = nodeIcons[type];
  const hasInput = type !== "start";
  const hasOutput = type !== "end";

  return (
    <Card
      className={cn(
        "w-64 border-2 transition-all duration-200",
        nodeColors[type],
        selected && "ring-2 ring-primary ring-offset-2"
      )}
      data-testid={`flow-node-${type}`}
    >
      {hasInput && (
        <Handle
          type="target"
          position={Position.Top}
          className="!w-3 !h-3 !bg-muted-foreground !border-2 !border-background"
        />
      )}
      <CardHeader className="p-3 pb-2">
        <div className="flex items-center gap-2">
          <div className={cn("p-1.5 rounded-md", nodeColors[type])}>
            <Icon className={cn("w-4 h-4", iconColors[type])} />
          </div>
          <span className="font-medium text-sm capitalize">{data.label || type}</span>
        </div>
      </CardHeader>
      <CardContent className="p-3 pt-0">
        <p className="text-xs text-muted-foreground line-clamp-2">
          {getNodeDescription(type, data)}
        </p>
      </CardContent>
      {hasOutput && (
        <Handle
          type="source"
          position={Position.Bottom}
          className="!w-3 !h-3 !bg-muted-foreground !border-2 !border-background"
        />
      )}
    </Card>
  );
}

function getNodeDescription(type: FlowNodeType, data: FlowNodeData): string {
  switch (type) {
    case "start":
      return "Flow entry point";
    case "message":
      return data.content?.substring(0, 60) || "Send a message";
    case "question":
      const optCount = data.options?.length || 0;
      return `Ask with ${optCount} option${optCount !== 1 ? "s" : ""}`;
    case "condition":
      const condCount = data.conditions?.length || 0;
      return `${condCount} condition${condCount !== 1 ? "s" : ""} to evaluate`;
    case "ai_answer":
      return data.aiConfig?.systemPrompt?.substring(0, 40) || "Generate AI response";
    case "action":
      const actionCount = data.actions?.length || 0;
      return `${actionCount} action${actionCount !== 1 ? "s" : ""} to execute`;
    case "set_variable":
      return data.variable ? `Set ${data.variable}` : "Set a variable";
    case "delay":
      return data.delaySeconds ? `Wait ${data.delaySeconds}s` : "Wait before continuing";
    case "api_call":
      return data.apiConfig?.url?.substring(0, 40) || "Make HTTP request";
    case "handoff":
      return data.reason || "Transfer to human agent";
    case "end":
      return data.content || "End the conversation";
    default:
      return "";
  }
}

export function StartNode({ data, selected }: NodeProps<CustomNode>) {
  return <BaseNode type="start" data={data as FlowNodeData} selected={selected} />;
}

export function MessageNode({ data, selected }: NodeProps<CustomNode>) {
  return <BaseNode type="message" data={data as FlowNodeData} selected={selected} />;
}

export function QuestionNode({ data, selected }: NodeProps<CustomNode>) {
  const nodeData = data as FlowNodeData;
  const options = nodeData.options || [];

  return (
    <Card
      className={cn(
        "w-64 border-2 transition-all duration-200",
        nodeColors.question,
        selected && "ring-2 ring-primary ring-offset-2"
      )}
      data-testid="flow-node-question"
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-muted-foreground !border-2 !border-background"
      />
      <CardHeader className="p-3 pb-2">
        <div className="flex items-center gap-2">
          <div className={cn("p-1.5 rounded-md", nodeColors.question)}>
            <HelpCircle className="w-4 h-4 text-purple-500" />
          </div>
          <span className="font-medium text-sm">{nodeData.label || "Question"}</span>
        </div>
      </CardHeader>
      <CardContent className="p-3 pt-0 space-y-2">
        <p className="text-xs text-muted-foreground line-clamp-2">
          {nodeData.content || "Ask a question"}
        </p>
        {options.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {options.slice(0, 3).map((opt: { label: string; value: string }, i: number) => (
              <Badge key={i} variant="secondary" className="text-xs">
                {opt.label}
              </Badge>
            ))}
            {options.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{options.length - 3}
              </Badge>
            )}
          </div>
        )}
      </CardContent>
      {options.map((_: unknown, i: number) => (
        <Handle
          key={i}
          type="source"
          position={Position.Bottom}
          id={`option-${i}`}
          className="!w-3 !h-3 !bg-purple-500 !border-2 !border-background"
          style={{ left: `${((i + 1) / (options.length + 1)) * 100}%` }}
        />
      ))}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-muted-foreground !border-2 !border-background"
      />
    </Card>
  );
}

export function ConditionNode({ data, selected }: NodeProps<CustomNode>) {
  const nodeData = data as FlowNodeData;
  const conditions = nodeData.conditions || [];

  return (
    <Card
      className={cn(
        "w-64 border-2 transition-all duration-200",
        nodeColors.condition,
        selected && "ring-2 ring-primary ring-offset-2"
      )}
      data-testid="flow-node-condition"
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-muted-foreground !border-2 !border-background"
      />
      <CardHeader className="p-3 pb-2">
        <div className="flex items-center gap-2">
          <div className={cn("p-1.5 rounded-md", nodeColors.condition)}>
            <GitBranch className="w-4 h-4 text-amber-500" />
          </div>
          <span className="font-medium text-sm">{nodeData.label || "Condition"}</span>
        </div>
      </CardHeader>
      <CardContent className="p-3 pt-0 space-y-2">
        <p className="text-xs text-muted-foreground">
          {conditions.length} condition{conditions.length !== 1 ? "s" : ""}
        </p>
      </CardContent>
      {conditions.map((_: unknown, i: number) => (
        <Handle
          key={i}
          type="source"
          position={Position.Bottom}
          id={`condition-${i}`}
          className="!w-3 !h-3 !bg-amber-500 !border-2 !border-background"
          style={{ left: `${((i + 1) / (conditions.length + 2)) * 100}%` }}
        />
      ))}
      <Handle
        type="source"
        position={Position.Bottom}
        id="default"
        className="!w-3 !h-3 !bg-muted-foreground !border-2 !border-background"
      />
    </Card>
  );
}

export function AIAnswerNode({ data, selected }: NodeProps<CustomNode>) {
  return <BaseNode type="ai_answer" data={data as FlowNodeData} selected={selected} />;
}

export function ActionNode({ data, selected }: NodeProps<CustomNode>) {
  return <BaseNode type="action" data={data as FlowNodeData} selected={selected} />;
}

export function SetVariableNode({ data, selected }: NodeProps<CustomNode>) {
  return <BaseNode type="set_variable" data={data as FlowNodeData} selected={selected} />;
}

export function DelayNode({ data, selected }: NodeProps<CustomNode>) {
  return <BaseNode type="delay" data={data as FlowNodeData} selected={selected} />;
}

export function APICallNode({ data, selected }: NodeProps<CustomNode>) {
  return <BaseNode type="api_call" data={data as FlowNodeData} selected={selected} />;
}

export function HandoffNode({ data, selected }: NodeProps<CustomNode>) {
  return <BaseNode type="handoff" data={data as FlowNodeData} selected={selected} />;
}

export function EndNode({ data, selected }: NodeProps<CustomNode>) {
  return <BaseNode type="end" data={data as FlowNodeData} selected={selected} />;
}

export const nodeTypes = {
  start: StartNode,
  message: MessageNode,
  question: QuestionNode,
  condition: ConditionNode,
  ai_answer: AIAnswerNode,
  action: ActionNode,
  set_variable: SetVariableNode,
  delay: DelayNode,
  api_call: APICallNode,
  handoff: HandoffNode,
  end: EndNode,
};

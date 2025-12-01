import type { Node, Edge } from "@xyflow/react";

export type FlowNodeType = 
  | "start"
  | "message"
  | "question"
  | "condition"
  | "ai_answer"
  | "action"
  | "set_variable"
  | "delay"
  | "api_call"
  | "handoff"
  | "end";

export interface FlowNodeData extends Record<string, unknown> {
  label?: string;
  content?: string;
  variable?: string;
  options?: Array<{ label: string; value: string; nextNodeId?: string }>;
  conditions?: Array<{
    variable: string;
    operator: string;
    value: string;
    nextNodeId?: string;
  }>;
  defaultNextNodeId?: string;
  aiConfig?: {
    systemPrompt?: string;
    model?: string;
    temperature?: number;
    maxTokens?: number;
    fallbackMessage?: string;
  };
  actions?: Array<{
    type: string;
    config: Record<string, unknown>;
  }>;
  delaySeconds?: number;
  apiConfig?: {
    url?: string;
    method?: string;
    headers?: Record<string, string>;
    body?: string;
    responseVariable?: string;
  };
  reason?: string;
  priority?: string;
  triggers?: Array<{
    type: string;
    pattern?: string;
    config?: Record<string, unknown>;
  }>;
}

export type FlowNode = Node<FlowNodeData, FlowNodeType>;
export type FlowEdge = Edge;

export interface NodePaletteItem {
  type: FlowNodeType;
  label: string;
  icon: string;
  description: string;
  color: string;
}

export const NODE_PALETTE: NodePaletteItem[] = [
  {
    type: "start",
    label: "Start",
    icon: "Play",
    description: "Entry point of the flow",
    color: "bg-emerald-500",
  },
  {
    type: "message",
    label: "Message",
    icon: "MessageSquare",
    description: "Send a message to the user",
    color: "bg-blue-500",
  },
  {
    type: "question",
    label: "Question",
    icon: "HelpCircle",
    description: "Ask a question with options",
    color: "bg-purple-500",
  },
  {
    type: "condition",
    label: "Condition",
    icon: "GitBranch",
    description: "Branch based on conditions",
    color: "bg-amber-500",
  },
  {
    type: "ai_answer",
    label: "AI Answer",
    icon: "Sparkles",
    description: "Generate AI response",
    color: "bg-pink-500",
  },
  {
    type: "action",
    label: "Action",
    icon: "Zap",
    description: "Execute an action",
    color: "bg-orange-500",
  },
  {
    type: "set_variable",
    label: "Set Variable",
    icon: "Variable",
    description: "Set a variable value",
    color: "bg-cyan-500",
  },
  {
    type: "delay",
    label: "Delay",
    icon: "Clock",
    description: "Wait before continuing",
    color: "bg-slate-500",
  },
  {
    type: "api_call",
    label: "API Call",
    icon: "Globe",
    description: "Make an HTTP request",
    color: "bg-indigo-500",
  },
  {
    type: "handoff",
    label: "Handoff",
    icon: "UserPlus",
    description: "Transfer to human agent",
    color: "bg-rose-500",
  },
  {
    type: "end",
    label: "End",
    icon: "Square",
    description: "End the conversation",
    color: "bg-red-500",
  },
];

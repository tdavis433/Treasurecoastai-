import type { BotFlow, BotFlowVersion } from "@shared/schema";

export type NodeType = 
  | "start" 
  | "message" 
  | "question" 
  | "condition" 
  | "action" 
  | "ai_answer" 
  | "handoff" 
  | "delay"
  | "set_variable"
  | "api_call"
  | "end";

export interface FlowNode {
  id: string;
  type: NodeType;
  position: { x: number; y: number };
  data: {
    label?: string;
    content?: string;
    options?: QuestionOption[];
    conditions?: ConditionRule[];
    actions?: ActionConfig[];
    aiConfig?: AIConfig;
    delay?: number;
    variable?: VariableConfig;
    apiConfig?: APIConfig;
    [key: string]: any;
  };
}

export interface FlowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  label?: string;
  condition?: ConditionRule;
}

export interface QuestionOption {
  id: string;
  label: string;
  value: string;
  nextNodeId?: string;
}

export interface ConditionRule {
  id: string;
  variable: string;
  operator: "equals" | "not_equals" | "contains" | "not_contains" | "greater_than" | "less_than" | "is_empty" | "is_not_empty" | "matches_regex";
  value: any;
  nextNodeId?: string;
}

export interface ActionConfig {
  type: "send_email" | "create_lead" | "update_contact" | "trigger_webhook" | "add_tag" | "set_variable";
  config: Record<string, any>;
}

export interface AIConfig {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  useKnowledgeBase?: boolean;
  knowledgeSourceIds?: string[];
  fallbackMessage?: string;
}

export interface VariableConfig {
  name: string;
  value: any;
  type: "string" | "number" | "boolean" | "array" | "object";
}

export interface APIConfig {
  url: string;
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  headers?: Record<string, string>;
  body?: Record<string, any>;
  responseVariable?: string;
}

export interface FlowContext {
  flowId: string;
  versionId: string;
  conversationId: string;
  workspaceId: string;
  botId: string;
  contactId?: string;
  contactName?: string;
  contactEmail?: string;
  variables: Record<string, any>;
  messageHistory: FlowMessage[];
  currentNodeId: string;
  startedAt: Date;
  lastActivityAt: Date;
}

export interface FlowMessage {
  role: "user" | "bot" | "system";
  content: string;
  timestamp: Date;
  nodeId?: string;
  metadata?: Record<string, any>;
}

export interface FlowExecutionResult {
  success: boolean;
  messages: FlowMessage[];
  nextNodeId?: string;
  completed: boolean;
  handoff?: {
    reason: string;
    priority?: string;
    metadata?: Record<string, any>;
  };
  error?: string;
  variables?: Record<string, any>;
  waitingForInput?: boolean;
}

export interface NodeExecutor {
  execute(
    node: FlowNode,
    context: FlowContext,
    userInput?: string
  ): Promise<FlowExecutionResult>;
}

export interface FlowDefinition {
  flow: BotFlow;
  version: BotFlowVersion;
  nodes: FlowNode[];
  edges: FlowEdge[];
}

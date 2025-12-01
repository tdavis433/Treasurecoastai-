import type {
  FlowNode,
  FlowContext,
  FlowExecutionResult,
  FlowMessage,
  NodeExecutor,
  ConditionRule,
} from "./types";
import OpenAI from "openai";

const openai = new OpenAI();

function createMessage(role: "user" | "bot" | "system", content: string, nodeId?: string): FlowMessage {
  return {
    role,
    content,
    timestamp: new Date(),
    nodeId,
  };
}

function getNestedValue(obj: Record<string, any>, path: string): any {
  const parts = path.split('.');
  let current: any = obj;
  
  for (const part of parts) {
    if (current === null || current === undefined) return undefined;
    
    const arrayMatch = part.match(/^([^[]+)\[(\d+)\]$/);
    if (arrayMatch) {
      current = current[arrayMatch[1]];
      if (Array.isArray(current)) {
        current = current[parseInt(arrayMatch[2], 10)];
      } else {
        return undefined;
      }
    } else {
      current = current[part];
    }
  }
  
  return current;
}

function interpolateVariables(text: string, variables: Record<string, any>): string {
  return text.replace(/\{\{([^}]+)\}\}/g, (match, varPath) => {
    try {
      const value = getNestedValue(variables, varPath.trim());
      if (value === undefined || value === null) return "";
      if (typeof value === "object") return JSON.stringify(value);
      return String(value);
    } catch {
      return "";
    }
  });
}

export class StartNodeExecutor implements NodeExecutor {
  async execute(node: FlowNode, context: FlowContext): Promise<FlowExecutionResult> {
    return {
      success: true,
      messages: [],
      completed: false,
    };
  }
}

export class MessageNodeExecutor implements NodeExecutor {
  async execute(node: FlowNode, context: FlowContext): Promise<FlowExecutionResult> {
    const content = interpolateVariables(node.data.content || "", context.variables);
    
    return {
      success: true,
      messages: [createMessage("bot", content, node.id)],
      completed: false,
    };
  }
}

export class QuestionNodeExecutor implements NodeExecutor {
  async execute(
    node: FlowNode,
    context: FlowContext,
    userInput?: string
  ): Promise<FlowExecutionResult> {
    const options = node.data.options || [];
    
    if (!userInput) {
      const content = interpolateVariables(node.data.content || "", context.variables);
      const optionsText = options
        .map((opt: any, i: number) => `${i + 1}. ${opt.label}`)
        .join("\n");
      
      return {
        success: true,
        messages: [createMessage("bot", `${content}\n\n${optionsText}`, node.id)],
        completed: false,
        waitingForInput: true,
      };
    }
    
    const normalizedInput = userInput.toLowerCase().trim();
    const inputNumber = parseInt(normalizedInput);
    
    let selectedOption = null;
    
    if (!isNaN(inputNumber) && inputNumber > 0 && inputNumber <= options.length) {
      selectedOption = options[inputNumber - 1];
    } else {
      selectedOption = options.find((opt: any) => 
        opt.label.toLowerCase().includes(normalizedInput) ||
        opt.value.toLowerCase() === normalizedInput
      );
    }
    
    if (selectedOption) {
      const variableName = String(node.data.variable || "last_answer");
      return {
        success: true,
        messages: [],
        completed: false,
        variables: { [variableName]: selectedOption.value },
        nextNodeId: selectedOption.nextNodeId,
      };
    }
    
    return {
      success: true,
      messages: [createMessage("bot", "I didn't understand that. Please select one of the options.", node.id)],
      completed: false,
      waitingForInput: true,
    };
  }
}

export class ConditionNodeExecutor implements NodeExecutor {
  async execute(node: FlowNode, context: FlowContext): Promise<FlowExecutionResult> {
    const conditions = node.data.conditions || [];
    
    for (const condition of conditions) {
      if (this.evaluateCondition(condition, context.variables)) {
        return {
          success: true,
          messages: [],
          completed: false,
          nextNodeId: condition.nextNodeId,
        };
      }
    }
    
    const defaultEdge = node.data.defaultNextNodeId;
    return {
      success: true,
      messages: [],
      completed: false,
      nextNodeId: defaultEdge,
    };
  }
  
  private evaluateCondition(condition: ConditionRule, variables: Record<string, any>): boolean {
    const value = getNestedValue(variables, condition.variable);
    const compareValue = condition.value;
    
    try {
      switch (condition.operator) {
        case "equals":
          if (value === undefined || value === null) {
            return compareValue === undefined || compareValue === null || compareValue === "";
          }
          return String(value) === String(compareValue);
          
        case "not_equals":
          if (value === undefined || value === null) {
            return compareValue !== undefined && compareValue !== null && compareValue !== "";
          }
          return String(value) !== String(compareValue);
          
        case "contains":
          if (value === undefined || value === null) return false;
          if (compareValue === undefined || compareValue === null) return false;
          return String(value).toLowerCase().includes(String(compareValue).toLowerCase());
          
        case "not_contains":
          if (value === undefined || value === null) return true;
          if (compareValue === undefined || compareValue === null) return true;
          return !String(value).toLowerCase().includes(String(compareValue).toLowerCase());
          
        case "greater_than":
          if (value === undefined || value === null) return false;
          const numVal = Number(value);
          const numCompare = Number(compareValue);
          if (isNaN(numVal) || isNaN(numCompare)) return false;
          return numVal > numCompare;
          
        case "less_than":
          if (value === undefined || value === null) return false;
          const numVal2 = Number(value);
          const numCompare2 = Number(compareValue);
          if (isNaN(numVal2) || isNaN(numCompare2)) return false;
          return numVal2 < numCompare2;
          
        case "is_empty":
          return value === undefined || value === null || value === "" || 
                 (Array.isArray(value) && value.length === 0);
                 
        case "is_not_empty":
          return value !== undefined && value !== null && value !== "" &&
                 !(Array.isArray(value) && value.length === 0);
                 
        case "matches_regex":
          if (value === undefined || value === null) return false;
          if (!compareValue) return false;
          return new RegExp(compareValue).test(String(value));
          
        default:
          console.warn(`Unknown condition operator: ${condition.operator}`);
          return false;
      }
    } catch (error) {
      console.error(`Error evaluating condition: ${condition.variable} ${condition.operator}`, error);
      return false;
    }
  }
}

export class AIAnswerNodeExecutor implements NodeExecutor {
  async execute(
    node: FlowNode,
    context: FlowContext,
    userInput?: string
  ): Promise<FlowExecutionResult> {
    if (!userInput) {
      const prompt = interpolateVariables(
        node.data.content || "How can I help you?",
        context.variables
      );
      
      return {
        success: true,
        messages: [createMessage("bot", prompt, node.id)],
        completed: false,
        waitingForInput: true,
      };
    }
    
    try {
      const aiConfig = node.data.aiConfig || {};
      const systemPrompt = aiConfig.systemPrompt || 
        "You are a helpful customer service assistant. Be concise and helpful.";
      
      const messageHistory = context.messageHistory.slice(-10).map(m => ({
        role: m.role === "user" ? "user" as const : "assistant" as const,
        content: m.content,
      }));
      
      const response = await openai.chat.completions.create({
        model: aiConfig.model || "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          ...messageHistory,
          { role: "user", content: userInput },
        ],
        temperature: aiConfig.temperature ?? 0.7,
        max_tokens: aiConfig.maxTokens ?? 500,
      });
      
      const aiResponse = response.choices[0]?.message?.content || 
        aiConfig.fallbackMessage || 
        "I apologize, but I couldn't generate a response. Please try again.";
      
      return {
        success: true,
        messages: [createMessage("bot", aiResponse, node.id)],
        completed: false,
        variables: { last_ai_response: aiResponse },
      };
    } catch (error) {
      console.error("AI answer error:", error);
      const fallback = node.data.aiConfig?.fallbackMessage || 
        "I'm having trouble processing your request right now. Please try again later.";
      
      return {
        success: false,
        messages: [createMessage("bot", fallback, node.id)],
        completed: false,
        error: "AI processing failed",
      };
    }
  }
}

export class ActionNodeExecutor implements NodeExecutor {
  async execute(node: FlowNode, context: FlowContext): Promise<FlowExecutionResult> {
    const actions = node.data.actions || [];
    const messages: FlowMessage[] = [];
    const newVariables: Record<string, any> = {};
    
    for (const action of actions) {
      try {
        switch (action.type) {
          case "set_variable":
            const varValue = interpolateVariables(
              String(action.config.value || ""),
              context.variables
            );
            newVariables[action.config.name] = varValue;
            break;
            
          case "create_lead":
            const leadResult = await this.createLead(context, action.config);
            if (leadResult.success) {
              newVariables["lead_created"] = true;
              newVariables["lead_id"] = leadResult.leadId;
            }
            break;
            
          case "trigger_webhook":
            await this.triggerWebhook(context, action.config);
            newVariables["webhook_triggered"] = true;
            break;
            
          case "send_email":
            await this.sendEmail(context, action.config);
            newVariables["email_sent"] = true;
            break;
            
          case "add_tag":
            const tags = context.variables.tags || [];
            newVariables["tags"] = [...tags, action.config.tag];
            break;
            
          case "update_contact":
            newVariables["contact_updated"] = true;
            break;
            
          case "schedule_appointment":
            newVariables["appointment_scheduled"] = true;
            break;
            
          default:
            console.log("[FlowAction] Unknown action type:", action.type);
        }
      } catch (error) {
        console.error(`[FlowAction] Error executing ${action.type}:`, error);
      }
    }
    
    return {
      success: true,
      messages,
      completed: false,
      variables: newVariables,
    };
  }
  
  private async createLead(
    context: FlowContext, 
    config: Record<string, any>
  ): Promise<{ success: boolean; leadId?: string }> {
    try {
      const { db } = await import("../storage");
      const schema = await import("@shared/schema");
      
      const leadId = `lead_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      await db.insert(schema.leads).values({
        id: leadId,
        workspaceId: context.workspaceId,
        botId: context.botId,
        name: context.contactName || config.name || "Unknown",
        email: context.contactEmail || config.email || null,
        phone: config.phone || null,
        status: "new",
        source: "flow",
        metadata: {
          flowId: context.flowId,
          conversationId: context.conversationId,
          variables: context.variables,
        },
      });
      
      console.log("[FlowAction] Lead created:", leadId);
      return { success: true, leadId };
    } catch (error) {
      console.error("[FlowAction] Failed to create lead:", error);
      return { success: false };
    }
  }
  
  private async triggerWebhook(
    context: FlowContext,
    config: Record<string, any>
  ): Promise<void> {
    if (!config.url) {
      console.warn("[FlowAction] No webhook URL provided");
      return;
    }
    
    try {
      const payload = {
        event: "flow.action",
        timestamp: new Date().toISOString(),
        flowId: context.flowId,
        conversationId: context.conversationId,
        workspaceId: context.workspaceId,
        botId: context.botId,
        contact: {
          id: context.contactId,
          name: context.contactName,
          email: context.contactEmail,
        },
        variables: context.variables,
        ...config.payload,
      };
      
      const response = await fetch(config.url, {
        method: config.method || "POST",
        headers: {
          "Content-Type": "application/json",
          ...config.headers,
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(10000),
      });
      
      if (!response.ok) {
        console.warn(`[FlowAction] Webhook returned ${response.status}`);
      } else {
        console.log("[FlowAction] Webhook triggered successfully");
      }
    } catch (error) {
      console.error("[FlowAction] Failed to trigger webhook:", error);
    }
  }
  
  private async sendEmail(
    context: FlowContext,
    config: Record<string, any>
  ): Promise<void> {
    const toEmail = config.to || context.contactEmail;
    if (!toEmail) {
      console.warn("[FlowAction] No email recipient");
      return;
    }
    
    console.log("[FlowAction] Email queued:", {
      to: toEmail,
      subject: interpolateVariables(config.subject || "", context.variables),
      template: config.template,
    });
  }
}

export class SetVariableNodeExecutor implements NodeExecutor {
  async execute(node: FlowNode, context: FlowContext): Promise<FlowExecutionResult> {
    const varConfig = node.data.variable;
    if (!varConfig) {
      return { success: true, messages: [], completed: false };
    }
    
    let value = varConfig.value;
    if (typeof value === "string") {
      value = interpolateVariables(value, context.variables);
    }
    
    switch (varConfig.type) {
      case "number":
        value = Number(value);
        break;
      case "boolean":
        value = value === "true" || value === true;
        break;
      case "array":
        if (typeof value === "string") {
          try { value = JSON.parse(value); } catch { value = [value]; }
        }
        break;
      case "object":
        if (typeof value === "string") {
          try { value = JSON.parse(value); } catch { value = {}; }
        }
        break;
    }
    
    return {
      success: true,
      messages: [],
      completed: false,
      variables: { [varConfig.name]: value },
    };
  }
}

export class DelayNodeExecutor implements NodeExecutor {
  async execute(node: FlowNode, context: FlowContext): Promise<FlowExecutionResult> {
    const delayMs = (node.data.delay || 0) * 1000;
    
    if (delayMs > 0) {
      await new Promise(resolve => setTimeout(resolve, Math.min(delayMs, 5000)));
    }
    
    return {
      success: true,
      messages: [],
      completed: false,
    };
  }
}

export class APICallNodeExecutor implements NodeExecutor {
  async execute(node: FlowNode, context: FlowContext): Promise<FlowExecutionResult> {
    const apiConfig = node.data.apiConfig;
    if (!apiConfig) {
      return { success: false, messages: [], completed: false, error: "No API config" };
    }
    
    try {
      const url = interpolateVariables(apiConfig.url, context.variables);
      const headers = Object.fromEntries(
        Object.entries(apiConfig.headers || {}).map(([k, v]) => [
          k,
          interpolateVariables(String(v), context.variables),
        ])
      );
      
      let body = apiConfig.body;
      if (body && typeof body === "object") {
        body = JSON.parse(interpolateVariables(JSON.stringify(body), context.variables));
      }
      
      const response = await fetch(url, {
        method: apiConfig.method,
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
        body: apiConfig.method !== "GET" ? JSON.stringify(body) : undefined,
      });
      
      const responseData = await response.json().catch(() => ({}));
      const variableName = apiConfig.responseVariable || "api_response";
      
      return {
        success: response.ok,
        messages: [],
        completed: false,
        variables: { [variableName]: responseData },
        error: response.ok ? undefined : `API call failed with status ${response.status}`,
      };
    } catch (error: any) {
      return {
        success: false,
        messages: [],
        completed: false,
        error: error.message,
      };
    }
  }
}

export class HandoffNodeExecutor implements NodeExecutor {
  async execute(node: FlowNode, context: FlowContext): Promise<FlowExecutionResult> {
    const handoffMessage = interpolateVariables(
      node.data.content || "Connecting you with a human agent...",
      context.variables
    );
    
    return {
      success: true,
      messages: [createMessage("bot", handoffMessage, node.id)],
      completed: true,
      handoff: {
        reason: node.data.reason || "User requested human agent",
        priority: node.data.priority || "normal",
        metadata: {
          nodeId: node.id,
          flowId: context.flowId,
          variables: context.variables,
        },
      },
    };
  }
}

export class EndNodeExecutor implements NodeExecutor {
  async execute(node: FlowNode, context: FlowContext): Promise<FlowExecutionResult> {
    const endMessage = node.data.content 
      ? interpolateVariables(node.data.content, context.variables)
      : null;
    
    return {
      success: true,
      messages: endMessage ? [createMessage("bot", endMessage, node.id)] : [],
      completed: true,
    };
  }
}

export function getNodeExecutor(nodeType: string): NodeExecutor {
  switch (nodeType) {
    case "start":
      return new StartNodeExecutor();
    case "message":
      return new MessageNodeExecutor();
    case "question":
      return new QuestionNodeExecutor();
    case "condition":
      return new ConditionNodeExecutor();
    case "ai_answer":
      return new AIAnswerNodeExecutor();
    case "action":
      return new ActionNodeExecutor();
    case "set_variable":
      return new SetVariableNodeExecutor();
    case "delay":
      return new DelayNodeExecutor();
    case "api_call":
      return new APICallNodeExecutor();
    case "handoff":
      return new HandoffNodeExecutor();
    case "end":
      return new EndNodeExecutor();
    default:
      console.warn(`Unknown node type: ${nodeType}, using message executor`);
      return new MessageNodeExecutor();
  }
}

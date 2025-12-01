import { eq, and, desc } from "drizzle-orm";
import { db } from "../storage";
import {
  botFlows,
  botFlowVersions,
  flowSessions,
  type BotFlow,
  type BotFlowVersion,
} from "@shared/schema";
import type {
  FlowNode,
  FlowEdge,
  FlowContext,
  FlowExecutionResult,
  FlowMessage,
  FlowDefinition,
} from "./types";
import { getNodeExecutor } from "./NodeExecutors";

export class FlowInterpreter {
  private flowCache: Map<string, FlowDefinition> = new Map();
  
  async loadFlow(flowId: string, versionId?: string): Promise<FlowDefinition | null> {
    const cacheKey = `${flowId}:${versionId || 'current'}`;
    
    if (this.flowCache.has(cacheKey)) {
      return this.flowCache.get(cacheKey)!;
    }
    
    const flow = await db.query.botFlows.findFirst({
      where: eq(botFlows.id, flowId),
    });
    
    if (!flow) return null;
    
    let version: BotFlowVersion | undefined;
    
    if (versionId) {
      version = await db.query.botFlowVersions.findFirst({
        where: eq(botFlowVersions.id, versionId),
      });
    } else if (flow.currentVersionId) {
      version = await db.query.botFlowVersions.findFirst({
        where: eq(botFlowVersions.id, flow.currentVersionId),
      });
    } else {
      version = await db.query.botFlowVersions.findFirst({
        where: eq(botFlowVersions.flowId, flowId),
        orderBy: desc(botFlowVersions.version),
      });
    }
    
    if (!version) return null;
    
    const definition: FlowDefinition = {
      flow,
      version,
      nodes: (version.nodes as FlowNode[]) || [],
      edges: (version.edges as FlowEdge[]) || [],
    };
    
    this.flowCache.set(cacheKey, definition);
    return definition;
  }
  
  async findFlowByTrigger(
    workspaceId: string,
    botId: string,
    triggerContext: {
      type: "keyword" | "intent" | "page_url" | "event" | "fallback";
      value?: string;
      metadata?: Record<string, any>;
    },
    attemptedFallback = false
  ): Promise<FlowDefinition | null> {
    const flows = await db.query.botFlows.findMany({
      where: and(
        eq(botFlows.workspaceId, workspaceId),
        eq(botFlows.botId, botId),
        eq(botFlows.status, "active"),
        eq(botFlows.isPublished, true)
      ),
    });
    
    const matchedFlows: { flow: BotFlow; priority: number }[] = [];
    
    for (const flow of flows) {
      const triggers = (flow.triggers as any[]) || [];
      
      for (const trigger of triggers) {
        if (this.matchesTrigger(trigger, triggerContext)) {
          matchedFlows.push({
            flow,
            priority: trigger.priority ?? 0,
          });
          break;
        }
      }
    }
    
    if (matchedFlows.length > 0) {
      matchedFlows.sort((a, b) => b.priority - a.priority);
      return this.loadFlow(matchedFlows[0].flow.id);
    }
    
    if (triggerContext.type !== "fallback" && !attemptedFallback) {
      return this.findFlowByTrigger(workspaceId, botId, { type: "fallback" }, true);
    }
    
    return null;
  }
  
  private matchesTrigger(
    trigger: { type: string; conditions: Record<string, any>; priority?: number },
    context: { type: string; value?: string; metadata?: Record<string, any> }
  ): boolean {
    if (trigger.type !== context.type) return false;
    
    switch (trigger.type) {
      case "keyword":
        const keywords = trigger.conditions.keywords || [];
        if (!context.value) return false;
        return keywords.some((kw: string) => 
          context.value!.toLowerCase().includes(kw.toLowerCase())
        );
        
      case "intent":
        if (!trigger.conditions.intent || !context.value) return false;
        return trigger.conditions.intent === context.value;
        
      case "page_url":
        const urlPattern = trigger.conditions.pattern;
        if (!urlPattern || !context.value) return false;
        try {
          return new RegExp(urlPattern).test(context.value);
        } catch {
          return context.value.includes(urlPattern);
        }
        
      case "event":
        if (!trigger.conditions.eventName || !context.value) return false;
        return trigger.conditions.eventName === context.value;
        
      case "fallback":
        return true;
        
      default:
        return false;
    }
  }
  
  async createContext(
    flowDefinition: FlowDefinition,
    conversationId: string,
    contactInfo?: {
      contactId?: string;
      contactName?: string;
      contactEmail?: string;
    }
  ): Promise<FlowContext> {
    const startNode = flowDefinition.nodes.find(n => n.type === "start");
    
    const context: FlowContext = {
      flowId: flowDefinition.flow.id,
      versionId: flowDefinition.version.id,
      conversationId,
      workspaceId: flowDefinition.flow.workspaceId,
      botId: flowDefinition.flow.botId,
      contactId: contactInfo?.contactId,
      contactName: contactInfo?.contactName,
      contactEmail: contactInfo?.contactEmail,
      variables: this.initializeVariables(flowDefinition),
      messageHistory: [],
      currentNodeId: startNode?.id || flowDefinition.nodes[0]?.id || "",
      startedAt: new Date(),
      lastActivityAt: new Date(),
    };
    
    return context;
  }
  
  private initializeVariables(flowDefinition: FlowDefinition): Record<string, any> {
    const variables: Record<string, any> = {};
    const declaredVariables = (flowDefinition.version.variables as any[]) || [];
    
    for (const v of declaredVariables) {
      variables[v.name] = v.defaultValue;
    }
    
    return variables;
  }
  
  async executeStep(
    context: FlowContext,
    flowDefinition: FlowDefinition,
    userInput?: string
  ): Promise<FlowExecutionResult> {
    const currentNode = flowDefinition.nodes.find(n => n.id === context.currentNodeId);
    
    if (!currentNode) {
      return {
        success: false,
        messages: [{
          role: "bot",
          content: "I'm sorry, something went wrong. Please try again.",
          timestamp: new Date(),
        }],
        completed: true,
        error: "Current node not found",
      };
    }
    
    let result: FlowExecutionResult;
    
    try {
      const executor = getNodeExecutor(currentNode.type);
      result = await executor.execute(currentNode, context, userInput);
    } catch (error: any) {
      console.error(`[FlowInterpreter] Error executing node ${currentNode.id}:`, error);
      return {
        success: false,
        messages: [{
          role: "bot",
          content: "I'm sorry, I encountered an error. Please try again.",
          timestamp: new Date(),
        }],
        completed: false,
        error: error.message || "Node execution failed",
      };
    }
    
    if (result.variables) {
      Object.assign(context.variables, result.variables);
    }
    
    for (const msg of result.messages) {
      context.messageHistory.push(msg);
    }
    
    if (userInput) {
      context.messageHistory.push({
        role: "user",
        content: userInput,
        timestamp: new Date(),
        nodeId: currentNode.id,
      });
    }
    
    context.lastActivityAt = new Date();
    
    if (!result.waitingForInput && !result.completed) {
      let nextNodeId = result.nextNodeId;
      
      if (!nextNodeId) {
        const outgoingEdge = flowDefinition.edges.find(e => e.source === currentNode.id);
        nextNodeId = outgoingEdge?.target;
      }
      
      if (nextNodeId) {
        context.currentNodeId = nextNodeId;
        return this.executeStep(context, flowDefinition);
      }
      
      return {
        ...result,
        completed: true,
      };
    }
    
    if (result.nextNodeId) {
      context.currentNodeId = result.nextNodeId;
    }
    
    return result;
  }
  
  async processUserMessage(
    workspaceId: string,
    botId: string,
    conversationId: string,
    userMessage: string,
    contactInfo?: {
      contactId?: string;
      contactName?: string;
      contactEmail?: string;
    }
  ): Promise<FlowExecutionResult> {
    let context: FlowContext | null = null;
    let flowDefinition: FlowDefinition | null = null;
    
    try {
      context = await this.loadContext(conversationId);
      
      if (context) {
        flowDefinition = await this.loadFlow(context.flowId, context.versionId);
        
        if (!flowDefinition) {
          await this.clearContext(conversationId);
          context = null;
        }
      }
      
      if (!context || !flowDefinition) {
        flowDefinition = await this.findFlowByTrigger(workspaceId, botId, {
          type: "keyword",
          value: userMessage,
        });
        
        if (!flowDefinition) {
          return {
            success: false,
            messages: [{
              role: "bot",
              content: "I'm sorry, I don't have a response configured for that. How else can I help you?",
              timestamp: new Date(),
            }],
            completed: true,
            error: "No matching flow found",
          };
        }
        
        context = await this.createContext(flowDefinition, conversationId, contactInfo);
        
        const initResult = await this.executeStep(context, flowDefinition);
        
        if (initResult.completed || initResult.handoff) {
          await this.clearContext(conversationId);
          await this.updateFlowStats(context.flowId, initResult.success);
          return initResult;
        }
        
        if (initResult.waitingForInput) {
          await this.saveContext(context);
          return initResult;
        }
      }
      
      const result = await this.executeStep(context, flowDefinition, userMessage);
      
      if (result.completed || result.handoff) {
        await this.clearContext(conversationId);
        await this.updateFlowStats(context.flowId, result.success);
      } else if (result.error) {
        await this.clearContext(conversationId);
      } else {
        await this.saveContext(context);
      }
      
      return result;
    } catch (error: any) {
      console.error("[FlowInterpreter] Error processing message:", error);
      
      if (conversationId) {
        await this.clearContext(conversationId).catch(() => {});
      }
      
      return {
        success: false,
        messages: [{
          role: "bot",
          content: "I'm sorry, something went wrong. Please try again.",
          timestamp: new Date(),
        }],
        completed: true,
        error: error.message || "Processing failed",
      };
    }
  }
  
  async loadContext(conversationId: string): Promise<FlowContext | null> {
    try {
      const session = await db.query.flowSessions.findFirst({
        where: eq(flowSessions.conversationId, conversationId),
      });
      
      if (!session) return null;
      
      const messageHistory = (session.messageHistory || []).map((m: any) => ({
        role: m.role as "user" | "bot" | "system",
        content: m.content,
        timestamp: new Date(m.timestamp),
        nodeId: m.nodeId,
      }));
      
      return {
        flowId: session.flowId,
        versionId: session.versionId,
        conversationId: session.conversationId,
        workspaceId: session.workspaceId,
        botId: session.botId,
        contactId: session.contactId || undefined,
        contactName: session.contactName || undefined,
        contactEmail: session.contactEmail || undefined,
        variables: (session.variables as Record<string, any>) || {},
        messageHistory,
        currentNodeId: session.currentNodeId,
        startedAt: new Date(session.startedAt),
        lastActivityAt: new Date(session.lastActivityAt),
      };
    } catch (error) {
      console.error("[FlowInterpreter] Error loading context:", error);
      return null;
    }
  }
  
  async saveContext(context: FlowContext): Promise<void> {
    try {
      const messageHistory = context.messageHistory.map(m => ({
        role: m.role,
        content: m.content,
        timestamp: m.timestamp.toISOString(),
        nodeId: m.nodeId,
      }));
      
      const existing = await db.query.flowSessions.findFirst({
        where: eq(flowSessions.conversationId, context.conversationId),
      });
      
      if (existing) {
        await db.update(flowSessions)
          .set({
            currentNodeId: context.currentNodeId,
            variables: context.variables,
            messageHistory,
            status: "active",
            lastActivityAt: new Date(),
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          })
          .where(eq(flowSessions.conversationId, context.conversationId));
      } else {
        await db.insert(flowSessions).values({
          conversationId: context.conversationId,
          workspaceId: context.workspaceId,
          botId: context.botId,
          flowId: context.flowId,
          versionId: context.versionId,
          currentNodeId: context.currentNodeId,
          variables: context.variables,
          messageHistory,
          contactId: context.contactId,
          contactName: context.contactName,
          contactEmail: context.contactEmail,
          status: "active",
          lastActivityAt: new Date(),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        });
      }
    } catch (error) {
      console.error("[FlowInterpreter] Error saving context:", error);
    }
  }
  
  async clearContext(conversationId: string): Promise<void> {
    try {
      await db.update(flowSessions)
        .set({ status: "completed" })
        .where(eq(flowSessions.conversationId, conversationId));
      
      await db.delete(flowSessions).where(
        eq(flowSessions.conversationId, conversationId)
      );
    } catch (error) {
      console.error("[FlowInterpreter] Error clearing context:", error);
    }
  }
  
  private async updateFlowStats(flowId: string, success: boolean): Promise<void> {
    try {
      const flow = await db.query.botFlows.findFirst({
        where: eq(botFlows.id, flowId),
      });
      
      if (flow) {
        await db.update(botFlows)
          .set({
            totalRuns: (flow.totalRuns || 0) + 1,
            successfulRuns: (flow.successfulRuns || 0) + (success ? 1 : 0),
            updatedAt: new Date(),
          })
          .where(eq(botFlows.id, flowId));
      }
    } catch (error) {
      console.error("[FlowInterpreter] Error updating flow stats:", error);
    }
  }
  
  clearCache(): void {
    this.flowCache.clear();
  }
  
  invalidateCache(flowId: string): void {
    const keysToDelete: string[] = [];
    this.flowCache.forEach((_, key) => {
      if (key.startsWith(flowId)) {
        keysToDelete.push(key);
      }
    });
    keysToDelete.forEach(key => this.flowCache.delete(key));
  }
}

export const flowInterpreter = new FlowInterpreter();

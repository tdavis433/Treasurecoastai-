import { Router, Request, Response, NextFunction } from "express";
import { eq, and, desc, inArray } from "drizzle-orm";
import { db } from "./storage";
import { botFlows, botFlowVersions, workspaces, workspaceMemberships, bots } from "@shared/schema";
import { z } from "zod";

const router = Router();

declare module "express-session" {
  interface SessionData {
    userId?: string;
    userRole?: string;
    clientId?: string;
    workspaceId?: string;
  }
}

const flowNodeSchema = z.object({
  id: z.string(),
  type: z.enum([
    "start", "message", "question", "condition", "ai_answer",
    "action", "set_variable", "delay", "api_call", "handoff", "end"
  ]),
  position: z.object({
    x: z.number(),
    y: z.number(),
  }),
  data: z.object({
    label: z.string().optional(),
    content: z.string().optional(),
    variableName: z.string().optional(),
    variable: z.string().optional(),
    expression: z.string().optional(),
    actionType: z.string().optional(),
    seconds: z.number().optional(),
    delaySeconds: z.number().optional(),
    url: z.string().optional(),
    method: z.string().optional(),
    targetAgent: z.string().optional(),
    prompt: z.string().optional(),
    systemPrompt: z.string().optional(),
    successMessage: z.string().optional(),
    reason: z.string().optional(),
    priority: z.string().optional(),
    options: z.array(z.object({
      label: z.string(),
      value: z.string(),
      nextNodeId: z.string().optional(),
    })).optional(),
    conditions: z.array(z.object({
      variable: z.string(),
      operator: z.string(),
      value: z.string(),
      targetNodeId: z.string().optional(),
      nextNodeId: z.string().optional(),
    })).optional(),
    triggers: z.array(z.object({
      type: z.string(),
      pattern: z.string().optional(),
      config: z.record(z.unknown()).optional(),
    })).optional(),
    aiConfig: z.object({
      systemPrompt: z.string().optional(),
      model: z.string().optional(),
      temperature: z.number().optional(),
      maxTokens: z.number().optional(),
      fallbackMessage: z.string().optional(),
    }).optional(),
    apiConfig: z.object({
      url: z.string().optional(),
      method: z.string().optional(),
      headers: z.record(z.string()).optional(),
      body: z.string().optional(),
      responseVariable: z.string().optional(),
    }).optional(),
    actions: z.array(z.object({
      type: z.string(),
      config: z.record(z.unknown()).optional(),
    })).optional(),
    headers: z.record(z.string()).optional(),
    body: z.any().optional(),
    config: z.any().optional(),
  }).passthrough(),
});

const flowEdgeSchema = z.object({
  id: z.string(),
  source: z.string(),
  target: z.string(),
  sourceHandle: z.string().optional().nullable(),
  targetHandle: z.string().optional().nullable(),
  label: z.string().optional(),
});

const createFlowSchema = z.object({
  name: z.string().min(1),
  workspaceId: z.string().optional(),
  botId: z.string().optional(),
  nodes: z.array(flowNodeSchema).default([]),
  edges: z.array(flowEdgeSchema).default([]),
  triggers: z.array(z.object({
    type: z.string(),
    config: z.any().optional(),
  })).default([]),
});

const createVersionSchema = z.object({
  nodes: z.array(flowNodeSchema),
  edges: z.array(flowEdgeSchema),
  variables: z.array(z.object({
    name: z.string(),
    type: z.string(),
    defaultValue: z.any().optional(),
  })).optional(),
});

function requireFlowAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session?.userId) {
    return res.status(401).json({ error: "Authentication required" });
  }
  next();
}

async function getUserWorkspaceIds(userId: string, userRole?: string): Promise<string[]> {
  if (userRole === "super_admin") {
    const allWorkspaces = await db.query.workspaces.findMany();
    return allWorkspaces.map(w => w.id);
  }
  
  const memberships = await db.query.workspaceMemberships.findMany({
    where: eq(workspaceMemberships.userId, userId),
  });
  
  return memberships.map(m => m.workspaceId);
}

async function canAccessWorkspace(userId: string, workspaceId: string, userRole?: string): Promise<boolean> {
  if (userRole === "super_admin") {
    return true;
  }
  
  const membership = await db.query.workspaceMemberships.findFirst({
    where: and(
      eq(workspaceMemberships.userId, userId),
      eq(workspaceMemberships.workspaceId, workspaceId)
    ),
  });
  
  return !!membership;
}

async function canAccessFlow(userId: string, flowId: string, userRole?: string): Promise<typeof botFlows.$inferSelect | null> {
  const flow = await db.query.botFlows.findFirst({
    where: eq(botFlows.id, flowId),
  });
  
  if (!flow) {
    return null;
  }
  
  if (userRole === "super_admin") {
    return flow;
  }
  
  if (flow.workspaceId) {
    const hasAccess = await canAccessWorkspace(userId, flow.workspaceId, userRole);
    if (!hasAccess) {
      return null;
    }
  }
  
  return flow;
}

router.get("/api/flows", requireFlowAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.session.userId!;
    const userRole = req.session.userRole;
    const workspaceId = req.query.workspaceId as string | undefined;
    
    if (workspaceId) {
      const hasAccess = await canAccessWorkspace(userId, workspaceId, userRole);
      if (!hasAccess) {
        return res.status(403).json({ error: "Access denied to this workspace" });
      }
      
      const flows = await db.query.botFlows.findMany({
        where: eq(botFlows.workspaceId, workspaceId),
        orderBy: desc(botFlows.updatedAt),
      });
      return res.json(flows);
    }
    
    const accessibleWorkspaceIds = await getUserWorkspaceIds(userId, userRole);
    
    if (accessibleWorkspaceIds.length === 0) {
      return res.json([]);
    }
    
    const flows = await db.query.botFlows.findMany({
      where: inArray(botFlows.workspaceId, accessibleWorkspaceIds),
      orderBy: desc(botFlows.updatedAt),
    });
    
    res.json(flows);
  } catch (error) {
    console.error("[FlowRoutes] Error fetching flows:", error);
    res.status(500).json({ error: "Failed to fetch flows" });
  }
});

router.get("/api/flows/:flowId", requireFlowAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.session.userId!;
    const userRole = req.session.userRole;
    
    const flow = await canAccessFlow(userId, req.params.flowId, userRole);
    
    if (!flow) {
      return res.status(404).json({ error: "Flow not found or access denied" });
    }
    
    res.json(flow);
  } catch (error) {
    console.error("[FlowRoutes] Error fetching flow:", error);
    res.status(500).json({ error: "Failed to fetch flow" });
  }
});

router.get("/api/flows/:flowId/version", requireFlowAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.session.userId!;
    const userRole = req.session.userRole;
    
    const flow = await canAccessFlow(userId, req.params.flowId, userRole);
    
    if (!flow) {
      return res.status(404).json({ error: "Flow not found or access denied" });
    }
    
    let version;
    if (flow.currentVersionId) {
      version = await db.query.botFlowVersions.findFirst({
        where: eq(botFlowVersions.id, flow.currentVersionId),
      });
    }
    
    if (!version) {
      version = await db.query.botFlowVersions.findFirst({
        where: eq(botFlowVersions.flowId, req.params.flowId),
        orderBy: desc(botFlowVersions.version),
      });
    }
    
    if (!version) {
      return res.status(404).json({ error: "No version found" });
    }
    
    res.json(version);
  } catch (error) {
    console.error("[FlowRoutes] Error fetching flow version:", error);
    res.status(500).json({ error: "Failed to fetch flow version" });
  }
});

router.post("/api/flows", requireFlowAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.session.userId!;
    const userRole = req.session.userRole;
    
    const parseResult = createFlowSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ 
        error: "Invalid flow data", 
        details: parseResult.error.errors 
      });
    }
    
    const data = parseResult.data;
    
    let workspaceId = data.workspaceId;
    
    if (!workspaceId) {
      if (req.session.workspaceId) {
        workspaceId = req.session.workspaceId;
      } else {
        const accessibleWorkspaces = await getUserWorkspaceIds(userId, userRole);
        if (accessibleWorkspaces.length === 0) {
          return res.status(400).json({ error: "No workspace available. Please specify a workspaceId." });
        }
        workspaceId = accessibleWorkspaces[0];
      }
    }
    
    const hasAccess = await canAccessWorkspace(userId, workspaceId, userRole);
    if (!hasAccess) {
      return res.status(403).json({ error: "Access denied to this workspace" });
    }
    
    let botId = data.botId;
    if (botId && botId !== "default") {
      const bot = await db.query.bots.findFirst({
        where: eq(bots.id, botId),
      });
      if (bot && bot.workspaceId !== workspaceId) {
        return res.status(400).json({ error: "Bot does not belong to this workspace" });
      }
    }
    
    const flowId = `flow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    let nodes = data.nodes;
    if (nodes.length === 0) {
      nodes = [
        {
          id: "start_node",
          type: "start" as const,
          position: { x: 250, y: 50 },
          data: { label: "Start" },
        },
      ];
    }
    
    await db.insert(botFlows).values({
      id: flowId,
      workspaceId,
      botId: botId || "default",
      name: data.name,
      description: "",
      triggers: data.triggers,
      status: "draft",
      isPublished: false,
    });
    
    const [insertedVersion] = await db.insert(botFlowVersions).values({
      flowId,
      version: 1,
      nodes: nodes,
      edges: data.edges,
      variables: [],
    }).returning();
    
    await db.update(botFlows)
      .set({ currentVersionId: insertedVersion.id })
      .where(eq(botFlows.id, flowId));
    
    const flow = await db.query.botFlows.findFirst({
      where: eq(botFlows.id, flowId),
    });
    
    res.status(201).json(flow);
  } catch (error) {
    console.error("[FlowRoutes] Error creating flow:", error);
    res.status(500).json({ error: "Failed to create flow" });
  }
});

router.post("/api/flows/:flowId/version", requireFlowAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.session.userId!;
    const userRole = req.session.userRole;
    
    const flow = await canAccessFlow(userId, req.params.flowId, userRole);
    
    if (!flow) {
      return res.status(404).json({ error: "Flow not found or access denied" });
    }
    
    const parseResult = createVersionSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ 
        error: "Invalid version data", 
        details: parseResult.error.errors 
      });
    }
    
    const data = parseResult.data;
    const flowId = req.params.flowId;
    
    const latestVersion = await db.query.botFlowVersions.findFirst({
      where: eq(botFlowVersions.flowId, flowId),
      orderBy: desc(botFlowVersions.version),
    });
    
    const newVersionNumber = (latestVersion?.version || 0) + 1;
    
    const [insertedVersion] = await db.insert(botFlowVersions).values({
      flowId,
      version: newVersionNumber,
      nodes: data.nodes,
      edges: data.edges,
      variables: data.variables || [],
    }).returning();
    
    const versionId = insertedVersion.id;
    
    await db.update(botFlows)
      .set({
        currentVersionId: versionId,
        updatedAt: new Date(),
      })
      .where(eq(botFlows.id, flowId));
    
    const version = await db.query.botFlowVersions.findFirst({
      where: eq(botFlowVersions.id, versionId),
    });
    
    res.status(201).json(version);
  } catch (error) {
    console.error("[FlowRoutes] Error creating flow version:", error);
    res.status(500).json({ error: "Failed to create flow version" });
  }
});

router.patch("/api/flows/:flowId", requireFlowAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.session.userId!;
    const userRole = req.session.userRole;
    
    const flow = await canAccessFlow(userId, req.params.flowId, userRole);
    
    if (!flow) {
      return res.status(404).json({ error: "Flow not found or access denied" });
    }
    
    const flowId = req.params.flowId;
    const { name, description, triggers, status, isPublished } = req.body;
    
    await db.update(botFlows)
      .set({
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(triggers !== undefined && { triggers }),
        ...(status !== undefined && { status }),
        ...(isPublished !== undefined && { isPublished }),
        updatedAt: new Date(),
      })
      .where(eq(botFlows.id, flowId));
    
    const updatedFlow = await db.query.botFlows.findFirst({
      where: eq(botFlows.id, flowId),
    });
    
    res.json(updatedFlow);
  } catch (error) {
    console.error("[FlowRoutes] Error updating flow:", error);
    res.status(500).json({ error: "Failed to update flow" });
  }
});

router.delete("/api/flows/:flowId", requireFlowAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.session.userId!;
    const userRole = req.session.userRole;
    
    const flow = await canAccessFlow(userId, req.params.flowId, userRole);
    
    if (!flow) {
      return res.status(404).json({ error: "Flow not found or access denied" });
    }
    
    const flowId = req.params.flowId;
    
    await db.delete(botFlowVersions).where(eq(botFlowVersions.flowId, flowId));
    await db.delete(botFlows).where(eq(botFlows.id, flowId));
    
    res.status(204).send();
  } catch (error) {
    console.error("[FlowRoutes] Error deleting flow:", error);
    res.status(500).json({ error: "Failed to delete flow" });
  }
});

router.post("/api/flows/:flowId/publish", requireFlowAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.session.userId!;
    const userRole = req.session.userRole;
    
    const flow = await canAccessFlow(userId, req.params.flowId, userRole);
    
    if (!flow) {
      return res.status(404).json({ error: "Flow not found or access denied" });
    }
    
    const flowId = req.params.flowId;
    
    await db.update(botFlows)
      .set({
        isPublished: true,
        status: "active",
        updatedAt: new Date(),
      })
      .where(eq(botFlows.id, flowId));
    
    const updatedFlow = await db.query.botFlows.findFirst({
      where: eq(botFlows.id, flowId),
    });
    
    res.json(updatedFlow);
  } catch (error) {
    console.error("[FlowRoutes] Error publishing flow:", error);
    res.status(500).json({ error: "Failed to publish flow" });
  }
});

export default router;

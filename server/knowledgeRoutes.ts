import type { Express, Request, Response, NextFunction } from "express";
import { storage } from "./storage";
import { z } from "zod";
import { 
  insertKnowledgeSourceSchema, 
  insertKnowledgeDocumentSchema, 
  insertKnowledgeChunkSchema 
} from "@shared/schema";

const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!(req as any).session?.user?.id) {
    return res.status(401).json({ error: "Authentication required" });
  }
  next();
};

async function canAccessWorkspace(userId: string, workspaceId: string): Promise<boolean> {
  const membership = await storage.checkWorkspaceMembership(userId, workspaceId);
  return !!membership;
}

async function canAccessSource(userId: string, sourceId: string): Promise<boolean> {
  const source = await storage.getKnowledgeSourceById(sourceId);
  if (!source) return false;
  return canAccessWorkspace(userId, source.workspaceId);
}

const createSourceSchema = z.object({
  workspaceId: z.string().min(1),
  botId: z.string().optional().nullable(),
  sourceType: z.enum(["url", "file", "text", "api", "sitemap"]),
  name: z.string().min(1).max(200),
  config: z.object({
    url: z.string().url().optional(),
    fileKey: z.string().optional(),
    content: z.string().optional(),
    refreshInterval: z.number().optional(),
    selectors: z.array(z.string()).optional(),
    excludePatterns: z.array(z.string()).optional(),
  }).passthrough(),
  status: z.enum(["pending", "processing", "ready", "error"]).optional(),
});

const updateSourceSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  config: z.object({}).passthrough().optional(),
  status: z.enum(["pending", "processing", "ready", "error"]).optional(),
  statusMessage: z.string().nullable().optional(),
});

const createDocumentSchema = z.object({
  sourceId: z.string().min(1),
  workspaceId: z.string().min(1),
  title: z.string().min(1).max(500),
  url: z.string().url().optional().nullable(),
  content: z.string().min(1),
  metadata: z.object({
    author: z.string().optional(),
    publishedAt: z.string().optional(),
    category: z.string().optional(),
    tags: z.array(z.string()).optional(),
    language: z.string().optional(),
  }).passthrough().optional(),
  isPublic: z.boolean().optional(),
});

const updateDocumentSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  url: z.string().url().nullable().optional(),
  content: z.string().min(1).optional(),
  metadata: z.object({}).passthrough().optional(),
  isPublic: z.boolean().optional(),
});

const createChunkSchema = z.object({
  documentId: z.string().min(1),
  sourceId: z.string().min(1),
  workspaceId: z.string().min(1),
  content: z.string().min(1),
  chunkIndex: z.number().int().min(0),
  tokenCount: z.number().int().optional(),
  metadata: z.object({
    heading: z.string().optional(),
    section: z.string().optional(),
    pageNumber: z.number().optional(),
  }).passthrough().optional(),
});

const searchQuerySchema = z.object({
  query: z.string().min(1).max(500),
  workspaceId: z.string().min(1),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export function registerKnowledgeRoutes(app: Express): void {
  
  app.get("/api/knowledge/sources", requireAuth, async (req, res) => {
    try {
      const userId = (req as any).session.user.id;
      const { workspaceId, botId } = req.query;
      
      if (!workspaceId || typeof workspaceId !== "string") {
        return res.status(400).json({ error: "workspaceId is required" });
      }
      
      if (!(await canAccessWorkspace(userId, workspaceId))) {
        return res.status(403).json({ error: "Access denied to this workspace" });
      }
      
      const sources = await storage.getKnowledgeSources(
        workspaceId, 
        typeof botId === "string" ? botId : undefined
      );
      res.json(sources);
    } catch (error) {
      console.error("Get knowledge sources error:", error);
      res.status(500).json({ error: "Failed to fetch knowledge sources" });
    }
  });

  app.post("/api/knowledge/sources", requireAuth, async (req, res) => {
    try {
      const userId = (req as any).session.user.id;
      const parsed = createSourceSchema.safeParse(req.body);
      
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid source data", details: parsed.error.errors });
      }
      
      if (!(await canAccessWorkspace(userId, parsed.data.workspaceId))) {
        return res.status(403).json({ error: "Access denied to this workspace" });
      }
      
      const source = await storage.createKnowledgeSource(parsed.data as any);
      res.status(201).json(source);
    } catch (error) {
      console.error("Create knowledge source error:", error);
      res.status(500).json({ error: "Failed to create knowledge source" });
    }
  });

  app.get("/api/knowledge/sources/:sourceId", requireAuth, async (req, res) => {
    try {
      const userId = (req as any).session.user.id;
      const { sourceId } = req.params;
      
      const source = await storage.getKnowledgeSourceById(sourceId);
      if (!source) {
        return res.status(404).json({ error: "Source not found" });
      }
      
      if (!(await canAccessWorkspace(userId, source.workspaceId))) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      res.json(source);
    } catch (error) {
      console.error("Get knowledge source error:", error);
      res.status(500).json({ error: "Failed to fetch knowledge source" });
    }
  });

  app.put("/api/knowledge/sources/:sourceId", requireAuth, async (req, res) => {
    try {
      const userId = (req as any).session.user.id;
      const { sourceId } = req.params;
      
      if (!(await canAccessSource(userId, sourceId))) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      const parsed = updateSourceSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid update data", details: parsed.error.errors });
      }
      
      const updated = await storage.updateKnowledgeSource(sourceId, parsed.data as any);
      res.json(updated);
    } catch (error) {
      console.error("Update knowledge source error:", error);
      res.status(500).json({ error: "Failed to update knowledge source" });
    }
  });

  app.delete("/api/knowledge/sources/:sourceId", requireAuth, async (req, res) => {
    try {
      const userId = (req as any).session.user.id;
      const { sourceId } = req.params;
      
      if (!(await canAccessSource(userId, sourceId))) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      await storage.deleteKnowledgeSource(sourceId);
      res.status(204).send();
    } catch (error) {
      console.error("Delete knowledge source error:", error);
      res.status(500).json({ error: "Failed to delete knowledge source" });
    }
  });

  app.get("/api/knowledge/sources/:sourceId/documents", requireAuth, async (req, res) => {
    try {
      const userId = (req as any).session.user.id;
      const { sourceId } = req.params;
      
      if (!(await canAccessSource(userId, sourceId))) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      const documents = await storage.getKnowledgeDocuments(sourceId);
      res.json(documents);
    } catch (error) {
      console.error("Get knowledge documents error:", error);
      res.status(500).json({ error: "Failed to fetch documents" });
    }
  });

  app.post("/api/knowledge/documents", requireAuth, async (req, res) => {
    try {
      const userId = (req as any).session.user.id;
      const parsed = createDocumentSchema.safeParse(req.body);
      
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid document data", details: parsed.error.errors });
      }
      
      if (!(await canAccessWorkspace(userId, parsed.data.workspaceId))) {
        return res.status(403).json({ error: "Access denied to this workspace" });
      }
      
      const document = await storage.createKnowledgeDocument(parsed.data as any);
      res.status(201).json(document);
    } catch (error) {
      console.error("Create knowledge document error:", error);
      res.status(500).json({ error: "Failed to create document" });
    }
  });

  app.get("/api/knowledge/documents/:documentId", requireAuth, async (req, res) => {
    try {
      const userId = (req as any).session.user.id;
      const { documentId } = req.params;
      
      const document = await storage.getKnowledgeDocumentById(documentId);
      if (!document) {
        return res.status(404).json({ error: "Document not found" });
      }
      
      if (!(await canAccessWorkspace(userId, document.workspaceId))) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      res.json(document);
    } catch (error) {
      console.error("Get knowledge document error:", error);
      res.status(500).json({ error: "Failed to fetch document" });
    }
  });

  app.put("/api/knowledge/documents/:documentId", requireAuth, async (req, res) => {
    try {
      const userId = (req as any).session.user.id;
      const { documentId } = req.params;
      
      const document = await storage.getKnowledgeDocumentById(documentId);
      if (!document) {
        return res.status(404).json({ error: "Document not found" });
      }
      
      if (!(await canAccessWorkspace(userId, document.workspaceId))) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      const parsed = updateDocumentSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid update data", details: parsed.error.errors });
      }
      
      const updated = await storage.updateKnowledgeDocument(documentId, parsed.data as any);
      res.json(updated);
    } catch (error) {
      console.error("Update knowledge document error:", error);
      res.status(500).json({ error: "Failed to update document" });
    }
  });

  app.delete("/api/knowledge/documents/:documentId", requireAuth, async (req, res) => {
    try {
      const userId = (req as any).session.user.id;
      const { documentId } = req.params;
      
      const document = await storage.getKnowledgeDocumentById(documentId);
      if (!document) {
        return res.status(404).json({ error: "Document not found" });
      }
      
      if (!(await canAccessWorkspace(userId, document.workspaceId))) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      await storage.deleteKnowledgeDocument(documentId);
      res.status(204).send();
    } catch (error) {
      console.error("Delete knowledge document error:", error);
      res.status(500).json({ error: "Failed to delete document" });
    }
  });

  app.get("/api/knowledge/documents/:documentId/chunks", requireAuth, async (req, res) => {
    try {
      const userId = (req as any).session.user.id;
      const { documentId } = req.params;
      
      const document = await storage.getKnowledgeDocumentById(documentId);
      if (!document) {
        return res.status(404).json({ error: "Document not found" });
      }
      
      if (!(await canAccessWorkspace(userId, document.workspaceId))) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      const chunks = await storage.getKnowledgeChunks(documentId);
      res.json(chunks);
    } catch (error) {
      console.error("Get knowledge chunks error:", error);
      res.status(500).json({ error: "Failed to fetch chunks" });
    }
  });

  app.post("/api/knowledge/chunks", requireAuth, async (req, res) => {
    try {
      const userId = (req as any).session.user.id;
      const parsed = createChunkSchema.safeParse(req.body);
      
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid chunk data", details: parsed.error.errors });
      }
      
      if (!(await canAccessWorkspace(userId, parsed.data.workspaceId))) {
        return res.status(403).json({ error: "Access denied to this workspace" });
      }
      
      const chunk = await storage.createKnowledgeChunk(parsed.data as any);
      res.status(201).json(chunk);
    } catch (error) {
      console.error("Create knowledge chunk error:", error);
      res.status(500).json({ error: "Failed to create chunk" });
    }
  });

  app.post("/api/knowledge/chunks/batch", requireAuth, async (req, res) => {
    try {
      const userId = (req as any).session.user.id;
      const { chunks } = req.body;
      
      if (!Array.isArray(chunks) || chunks.length === 0) {
        return res.status(400).json({ error: "chunks array is required" });
      }
      
      if (chunks.length > 100) {
        return res.status(400).json({ error: "Maximum 100 chunks per batch" });
      }
      
      const firstChunk = chunks[0];
      if (!(await canAccessWorkspace(userId, firstChunk.workspaceId))) {
        return res.status(403).json({ error: "Access denied to this workspace" });
      }
      
      const results = [];
      for (const chunkData of chunks) {
        const parsed = createChunkSchema.safeParse(chunkData);
        if (!parsed.success) {
          results.push({ error: parsed.error.errors, data: chunkData });
          continue;
        }
        const chunk = await storage.createKnowledgeChunk(parsed.data as any);
        results.push({ success: true, chunk });
      }
      
      res.status(201).json({ created: results.filter(r => r.success).length, results });
    } catch (error) {
      console.error("Batch create chunks error:", error);
      res.status(500).json({ error: "Failed to create chunks" });
    }
  });

  app.delete("/api/knowledge/documents/:documentId/chunks", requireAuth, async (req, res) => {
    try {
      const userId = (req as any).session.user.id;
      const { documentId } = req.params;
      
      const document = await storage.getKnowledgeDocumentById(documentId);
      if (!document) {
        return res.status(404).json({ error: "Document not found" });
      }
      
      if (!(await canAccessWorkspace(userId, document.workspaceId))) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      await storage.deleteKnowledgeChunks(documentId);
      res.status(204).send();
    } catch (error) {
      console.error("Delete knowledge chunks error:", error);
      res.status(500).json({ error: "Failed to delete chunks" });
    }
  });

  app.get("/api/knowledge/search", requireAuth, async (req, res) => {
    try {
      const userId = (req as any).session.user.id;
      const parsed = searchQuerySchema.safeParse(req.query);
      
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid search query", details: parsed.error.errors });
      }
      
      const { workspaceId, query, limit } = parsed.data;
      
      if (!(await canAccessWorkspace(userId, workspaceId))) {
        return res.status(403).json({ error: "Access denied to this workspace" });
      }
      
      const chunks = await storage.searchKnowledgeChunks(workspaceId, query, limit);
      res.json({ query, results: chunks, count: chunks.length });
    } catch (error) {
      console.error("Search knowledge error:", error);
      res.status(500).json({ error: "Failed to search knowledge base" });
    }
  });
}

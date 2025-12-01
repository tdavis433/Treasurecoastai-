import OpenAI from "openai";
import { db } from "./storage";
import { knowledgeChunks, knowledgeSources, knowledgeDocuments } from "@shared/schema";
import { eq, and, sql } from "drizzle-orm";

const EMBEDDING_MODEL = "text-embedding-ada-002";
const EMBEDDING_DIMENSIONS = 1536;

let openai: OpenAI | null = null;

export class MissingApiKeyError extends Error {
  constructor() {
    super("OPENAI_API_KEY is not configured. Please add your OpenAI API key to use embedding features.");
    this.name = "MissingApiKeyError";
  }
}

export function isOpenAIConfigured(): boolean {
  return !!process.env.OPENAI_API_KEY;
}

function getOpenAI(): OpenAI {
  if (!openai) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new MissingApiKeyError();
    }
    openai = new OpenAI({ apiKey });
  }
  return openai;
}

export async function generateEmbedding(text: string): Promise<number[]> {
  const client = getOpenAI();
  
  const cleanedText = text.replace(/\n/g, " ").trim();
  if (!cleanedText) {
    throw new Error("Cannot generate embedding for empty text");
  }
  
  const response = await client.embeddings.create({
    model: EMBEDDING_MODEL,
    input: cleanedText,
  });
  
  return response.data[0].embedding;
}

export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const client = getOpenAI();
  
  const cleanedTexts = texts.map(t => t.replace(/\n/g, " ").trim()).filter(t => t.length > 0);
  if (cleanedTexts.length === 0) {
    return [];
  }
  
  const response = await client.embeddings.create({
    model: EMBEDDING_MODEL,
    input: cleanedTexts,
  });
  
  return response.data.map(d => d.embedding);
}

export async function updateChunkEmbedding(chunkId: string, embedding: number[]): Promise<void> {
  const vectorString = `[${embedding.join(",")}]`;
  await db.execute(
    sql`UPDATE knowledge_chunks SET embedding = ${vectorString}::vector WHERE id = ${chunkId}`
  );
}

export async function createChunkWithEmbedding(chunkData: {
  documentId: string;
  sourceId: string;
  workspaceId: string;
  content: string;
  chunkIndex: number;
  tokenCount?: number;
  metadata?: Record<string, any>;
}): Promise<string> {
  const embedding = await generateEmbedding(chunkData.content);
  const vectorString = `[${embedding.join(",")}]`;
  
  const result = await db.execute(
    sql`INSERT INTO knowledge_chunks (
      id, document_id, source_id, workspace_id, content, chunk_index, token_count, metadata, embedding, created_at
    ) VALUES (
      gen_random_uuid(),
      ${chunkData.documentId},
      ${chunkData.sourceId},
      ${chunkData.workspaceId},
      ${chunkData.content},
      ${chunkData.chunkIndex},
      ${chunkData.tokenCount || null},
      ${JSON.stringify(chunkData.metadata || {})}::jsonb,
      ${vectorString}::vector,
      NOW()
    ) RETURNING id`
  );
  
  await db.execute(
    sql`UPDATE knowledge_documents SET chunk_count = chunk_count + 1, updated_at = NOW() WHERE id = ${chunkData.documentId}`
  );
  await db.execute(
    sql`UPDATE knowledge_sources SET chunk_count = chunk_count + 1, updated_at = NOW() WHERE id = ${chunkData.sourceId}`
  );
  
  return (result.rows[0] as { id: string }).id;
}

export interface SemanticSearchResult {
  id: string;
  documentId: string;
  sourceId: string;
  workspaceId: string;
  content: string;
  chunkIndex: number;
  metadata: Record<string, any>;
  similarity: number;
}

export async function semanticSearch(
  workspaceId: string,
  query: string,
  options: {
    limit?: number;
    threshold?: number;
    sourceId?: string;
    documentId?: string;
  } = {}
): Promise<SemanticSearchResult[]> {
  const { limit = 10, threshold = 0.7, sourceId, documentId } = options;
  
  const queryEmbedding = await generateEmbedding(query);
  const vectorString = `[${queryEmbedding.join(",")}]`;
  
  let whereClause = sql`workspace_id = ${workspaceId} AND embedding IS NOT NULL`;
  
  if (sourceId) {
    whereClause = sql`${whereClause} AND source_id = ${sourceId}`;
  }
  
  if (documentId) {
    whereClause = sql`${whereClause} AND document_id = ${documentId}`;
  }
  
  const result = await db.execute(
    sql`SELECT 
      id, 
      document_id, 
      source_id, 
      workspace_id, 
      content, 
      chunk_index, 
      metadata,
      1 - (embedding <=> ${vectorString}::vector) as similarity
    FROM knowledge_chunks
    WHERE ${whereClause}
    AND 1 - (embedding <=> ${vectorString}::vector) >= ${threshold}
    ORDER BY embedding <=> ${vectorString}::vector
    LIMIT ${limit}`
  );
  
  return result.rows.map((row: any) => ({
    id: row.id,
    documentId: row.document_id,
    sourceId: row.source_id,
    workspaceId: row.workspace_id,
    content: row.content,
    chunkIndex: row.chunk_index,
    metadata: row.metadata || {},
    similarity: parseFloat(row.similarity),
  }));
}

export async function processDocumentChunks(
  documentId: string,
  options: {
    chunkSize?: number;
    overlap?: number;
  } = {}
): Promise<number> {
  const { chunkSize = 1000, overlap = 200 } = options;
  
  const [document] = await db
    .select()
    .from(knowledgeDocuments)
    .where(eq(knowledgeDocuments.id, documentId))
    .limit(1);
  
  if (!document) {
    throw new Error("Document not found");
  }
  
  await db.execute(
    sql`DELETE FROM knowledge_chunks WHERE document_id = ${documentId}`
  );
  
  const content = document.content;
  const chunks: string[] = [];
  
  let start = 0;
  while (start < content.length) {
    const end = Math.min(start + chunkSize, content.length);
    chunks.push(content.slice(start, end));
    start = end - overlap;
    if (start >= content.length - overlap) break;
  }
  
  let createdCount = 0;
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i].trim();
    if (!chunk) continue;
    
    try {
      await createChunkWithEmbedding({
        documentId,
        sourceId: document.sourceId,
        workspaceId: document.workspaceId,
        content: chunk,
        chunkIndex: i,
        tokenCount: Math.ceil(chunk.length / 4),
      });
      createdCount++;
    } catch (error) {
      console.error(`Error creating chunk ${i} for document ${documentId}:`, error);
    }
  }
  
  await db
    .update(knowledgeDocuments)
    .set({ chunkCount: createdCount, updatedAt: new Date() })
    .where(eq(knowledgeDocuments.id, documentId));
  
  const [source] = await db
    .select()
    .from(knowledgeSources)
    .where(eq(knowledgeSources.id, document.sourceId))
    .limit(1);
  
  if (source) {
    const totalChunks = await db.execute(
      sql`SELECT COUNT(*) as count FROM knowledge_chunks WHERE source_id = ${source.id}`
    );
    await db
      .update(knowledgeSources)
      .set({ 
        chunkCount: parseInt((totalChunks.rows[0] as any).count, 10),
        status: "ready",
        lastSyncAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(knowledgeSources.id, source.id));
  }
  
  return createdCount;
}

export async function reindexSource(sourceId: string): Promise<{ documentsProcessed: number; chunksCreated: number }> {
  const documents = await db
    .select()
    .from(knowledgeDocuments)
    .where(eq(knowledgeDocuments.sourceId, sourceId));
  
  let totalChunks = 0;
  for (const doc of documents) {
    const chunks = await processDocumentChunks(doc.id);
    totalChunks += chunks;
  }
  
  return { documentsProcessed: documents.length, chunksCreated: totalChunks };
}

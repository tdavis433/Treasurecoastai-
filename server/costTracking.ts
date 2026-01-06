import { db } from './storage';
import { sql, eq, and } from 'drizzle-orm';
import { pgTable, varchar, integer, timestamp, date } from 'drizzle-orm/pg-core';

// Define the workspace_daily_usage table
export const workspaceDailyUsage = pgTable("workspace_daily_usage", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  workspaceId: varchar("workspace_id").notNull(),
  date: date("date", { mode: 'string' }).notNull(),
  aiSpendCents: integer("ai_spend_cents").default(0).notNull(),
  tokensUsed: integer("tokens_used").default(0).notNull(),
  messagesCount: integer("messages_count").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// OpenAI pricing (as of Jan 2026)
const MODEL_PRICING = {
  'gpt-4': { input: 0.03, output: 0.06 },
  'gpt-4-turbo': { input: 0.01, output: 0.03 },
  'gpt-3.5-turbo': { input: 0.0005, output: 0.0015 },
} as const;

export async function trackOpenAIUsage(
  workspaceId: string,
  tokensUsed: number,
  model: string = 'gpt-4-turbo'
) {
  const pricing = MODEL_PRICING[model as keyof typeof MODEL_PRICING] || MODEL_PRICING['gpt-4-turbo'];
  const costPerToken = (pricing.input + pricing.output) / 2000;
  const costCents = Math.ceil(tokensUsed * costPerToken);
  
  const today = new Date().toISOString().split('T')[0];
  
  try {
    // Use raw SQL for upsert to avoid TypeScript inference issues with Drizzle
    await db.execute(sql`
      INSERT INTO workspace_daily_usage (workspace_id, date, ai_spend_cents, tokens_used, messages_count)
      VALUES (${workspaceId}, ${today}::date, ${costCents}, ${tokensUsed}, 1)
      ON CONFLICT (workspace_id, date) 
      DO UPDATE SET 
        ai_spend_cents = workspace_daily_usage.ai_spend_cents + ${costCents},
        tokens_used = workspace_daily_usage.tokens_used + ${tokensUsed},
        messages_count = workspace_daily_usage.messages_count + 1,
        updated_at = NOW()
    `);
    
    console.log(`💰 Tracked: ${tokensUsed} tokens, $${(costCents/100).toFixed(4)}, workspace: ${workspaceId}`);
  } catch (error) {
    console.error('Failed to track OpenAI usage:', error);
  }
}

export async function checkDailySpendingLimit(
  workspaceId: string
): Promise<{ allowed: boolean; spent: number; limit: number; remaining: number }> {
  const today = new Date().toISOString().split('T')[0];
  const DAILY_LIMIT_CENTS = 5000; // $50 per day
  
  const usage = await db.select()
    .from(workspaceDailyUsage)
    .where(and(
      eq(workspaceDailyUsage.workspaceId, workspaceId),
      eq(workspaceDailyUsage.date, today)
    ))
    .limit(1);
  
  const spent = usage[0]?.aiSpendCents || 0;
  const remaining = DAILY_LIMIT_CENTS - spent;
  
  return {
    allowed: spent < DAILY_LIMIT_CENTS,
    spent,
    limit: DAILY_LIMIT_CENTS,
    remaining: Math.max(0, remaining),
  };
}

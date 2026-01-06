-- OpenAI cost tracking
ALTER TABLE chat_sessions 
  ADD COLUMN IF NOT EXISTS tokens_used INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS estimated_cost_cents INTEGER DEFAULT 0;

-- Daily usage tracking per workspace
CREATE TABLE IF NOT EXISTS workspace_daily_usage (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id VARCHAR NOT NULL,
  date DATE NOT NULL,
  ai_spend_cents INTEGER DEFAULT 0,
  tokens_used INTEGER DEFAULT 0,
  messages_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(workspace_id, date)
);

CREATE INDEX IF NOT EXISTS workspace_daily_usage_workspace_date_idx 
  ON workspace_daily_usage(workspace_id, date);

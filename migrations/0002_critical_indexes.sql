-- CRITICAL performance indexes for production readiness
-- Created: 2026-01-06
-- Purpose: Optimize common query patterns to prevent timeouts at scale

-- Leads: queries by client + status (dashboard filtering)
CREATE INDEX IF NOT EXISTS leads_client_status_idx ON leads(client_id, status);

-- Leads: queries by client + created_at (chronological listing)
CREATE INDEX IF NOT EXISTS leads_client_created_idx ON leads(client_id, created_at DESC);

-- Chat sessions: queries by client + bot + time (dashboard views)
CREATE INDEX IF NOT EXISTS chat_sessions_client_bot_idx ON chat_sessions(client_id, bot_id, started_at DESC);

-- Booking intents: queries by workspace + status + time (booking management)
CREATE INDEX IF NOT EXISTS booking_intents_workspace_status_idx ON booking_intents(workspace_id, status, created_at DESC);

-- Note: conversation_messages uses conversation_id (not session_id) and already has an index
-- Note: workspace_memberships already has adequate indexes (memberships_workspace_user_idx, memberships_user_id_idx)

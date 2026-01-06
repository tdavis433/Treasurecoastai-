-- CRITICAL PERFORMANCE INDEXES
-- These prevent slow queries and timeouts at scale

-- Leads table - most queried table
CREATE INDEX CONCURRENTLY IF NOT EXISTS leads_client_status_idx 
  ON leads(client_id, status);

CREATE INDEX CONCURRENTLY IF NOT EXISTS leads_client_created_idx 
  ON leads(client_id, created_at DESC);

-- Chat sessions - conversation queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS chat_sessions_client_bot_idx 
  ON chat_sessions(client_id, bot_id, started_at DESC);

-- Booking intents - booking flow queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS booking_intents_workspace_status_idx 
  ON booking_intents(workspace_id, status, created_at DESC);

-- Conversation messages - inbox queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS conversation_messages_session_idx 
  ON conversation_messages(session_id, created_at);

-- Workspace memberships - auth queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS workspace_memberships_workspace_idx 
  ON workspace_memberships(workspace_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS workspace_memberships_user_idx 
  ON workspace_memberships(user_id);

-- Audit logs - admin dashboard queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS audit_logs_workspace_action_idx 
  ON audit_logs(workspace_id, action, created_at DESC);

-- Treasure Coast AI - Database Schema Verification Script
-- Run with: psql "$DATABASE_URL" -f scripts/verify-db-schema.sql
-- All checks should pass before deployment

\echo '============================================'
\echo 'DATABASE SCHEMA VERIFICATION'
\echo '============================================'

-- Check 1: client_settings.metadata column
\echo ''
\echo '1. Checking client_settings.metadata column...'
SELECT 
    CASE 
        WHEN data_type = 'jsonb' AND is_nullable = 'NO' THEN 'PASS: metadata is jsonb NOT NULL'
        ELSE 'FAIL: metadata should be jsonb NOT NULL'
    END AS check_result
FROM information_schema.columns
WHERE table_name = 'client_settings' AND column_name = 'metadata';

-- Check 2: Required unique constraints exist
\echo ''
\echo '2. Checking required unique constraints...'

SELECT 
    CASE WHEN COUNT(*) > 0 THEN 'PASS: bot_templates_template_id_unique exists' 
    ELSE 'FAIL: bot_templates_template_id_unique missing' END AS check_result
FROM pg_constraint c JOIN pg_class t ON c.conrelid = t.oid
WHERE c.conname = 'bot_templates_template_id_unique';

SELECT 
    CASE WHEN COUNT(*) > 0 THEN 'PASS: session_states_session_id_unique exists' 
    ELSE 'FAIL: session_states_session_id_unique missing' END AS check_result
FROM pg_constraint c JOIN pg_class t ON c.conrelid = t.oid
WHERE c.conname = 'session_states_session_id_unique';

SELECT 
    CASE WHEN COUNT(*) > 0 THEN 'PASS: widget_settings_bot_id_unique exists' 
    ELSE 'FAIL: widget_settings_bot_id_unique missing' END AS check_result
FROM pg_constraint c JOIN pg_class t ON c.conrelid = t.oid
WHERE c.conname = 'widget_settings_bot_id_unique';

SELECT 
    CASE WHEN COUNT(*) > 0 THEN 'PASS: flow_sessions_conversation_id_unique exists' 
    ELSE 'FAIL: flow_sessions_conversation_id_unique missing' END AS check_result
FROM pg_constraint c JOIN pg_class t ON c.conrelid = t.oid
WHERE c.conname = 'flow_sessions_conversation_id_unique';

SELECT 
    CASE WHEN COUNT(*) > 0 THEN 'PASS: bot_requests_dedupe_hash_unique exists' 
    ELSE 'FAIL: bot_requests_dedupe_hash_unique missing' END AS check_result
FROM pg_constraint c JOIN pg_class t ON c.conrelid = t.oid
WHERE c.conname = 'bot_requests_dedupe_hash_unique';

-- Check 3: No old-style _key constraints remain (should be renamed to _unique)
\echo ''
\echo '3. Checking for legacy _key constraints (should be 0)...'
SELECT 
    CASE WHEN COUNT(*) = 0 THEN 'PASS: No legacy _key constraints found'
    ELSE 'WARNING: Found ' || COUNT(*) || ' legacy _key constraints that may need renaming'
    END AS check_result
FROM pg_constraint c JOIN pg_class t ON c.conrelid = t.oid
WHERE c.conname LIKE '%_key' 
  AND c.contype = 'u'
  AND t.relname NOT LIKE '\_%';

-- Check 4: Core tables exist
\echo ''
\echo '4. Checking core tables exist...'
SELECT 
    CASE WHEN COUNT(*) >= 10 THEN 'PASS: ' || COUNT(*) || ' tables found'
    ELSE 'WARNING: Only ' || COUNT(*) || ' tables found'
    END AS check_result
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_type = 'BASE TABLE';

\echo ''
\echo '============================================'
\echo 'VERIFICATION COMPLETE'
\echo '============================================'

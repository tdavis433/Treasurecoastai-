#!/bin/bash
echo "🔍 Verifying all critical fixes..."

# 1. Check indexes
echo "1. Checking database indexes..."
psql $DATABASE_URL -c "\di" 2>/dev/null | grep -E "leads_client|chat_sessions_client" > /dev/null && echo "✅ Indexes created" || echo "❌ Indexes missing"

# 2. Check cost tracking table
echo "2. Checking cost tracking..."
psql $DATABASE_URL -c "\d workspace_daily_usage" > /dev/null 2>&1 && echo "✅ Cost tracking table exists" || echo "❌ Table missing"

# 3. Check health endpoint
echo "3. Checking health endpoint..."
curl -s http://localhost:5000/health | grep -q "ok" && echo "✅ Health check works" || echo "❌ Health check failed"

# 4. Check TypeScript compiles
echo "4. Checking TypeScript..."
npm run check > /dev/null 2>&1 && echo "✅ TypeScript compiles" || echo "❌ TypeScript errors"

# 5. Check if files exist
echo "5. Checking created files..."
[ -f "server/costTracking.ts" ] && echo "✅ costTracking.ts exists" || echo "❌ costTracking.ts missing"
[ -f "migrations/0002_critical_indexes.sql" ] && echo "✅ Migration 0002 exists" || echo "❌ Migration missing"
[ -f "migrations/0003_cost_tracking.sql" ] && echo "✅ Migration 0003 exists" || echo "❌ Migration missing"

echo ""
echo "✅ Verification complete!"

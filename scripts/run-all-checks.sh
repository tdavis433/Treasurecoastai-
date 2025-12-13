#!/bin/bash
# Treasure Coast AI - Pre-deployment Hardening Checks
# Run this before every deployment to verify system readiness

set -e

echo "==========================================="
echo "  TREASURE COAST AI - HARDENING CHECKS"
echo "==========================================="
echo ""

ERRORS=0
WARNINGS=0

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

pass() { echo -e "${GREEN}[PASS]${NC} $1"; }
fail() { echo -e "${RED}[FAIL]${NC} $1"; ((ERRORS++)); }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; ((WARNINGS++)); }

echo "1. Checking Environment Variables..."
echo "-----------------------------------"

# Required secrets
if [ -n "$DATABASE_URL" ]; then pass "DATABASE_URL is set"; else fail "DATABASE_URL not set"; fi
if [ -n "$SESSION_SECRET" ]; then pass "SESSION_SECRET is set"; else fail "SESSION_SECRET not set"; fi
if [ -n "$OPENAI_API_KEY" ]; then pass "OPENAI_API_KEY is set"; else fail "OPENAI_API_KEY not set"; fi
if [ -n "$WIDGET_TOKEN_SECRET" ]; then pass "WIDGET_TOKEN_SECRET is set"; else fail "WIDGET_TOKEN_SECRET not set"; fi

# Optional but recommended
if [ -n "$DEFAULT_ADMIN_PASSWORD" ]; then 
  if [ "$DEFAULT_ADMIN_PASSWORD" != "admin123" ]; then
    pass "DEFAULT_ADMIN_PASSWORD is set (not default)"
  else
    warn "DEFAULT_ADMIN_PASSWORD is still set to default 'admin123'"
  fi
else 
  warn "DEFAULT_ADMIN_PASSWORD not set (using default)"
fi

echo ""
echo "2. Checking TypeScript Compilation..."
echo "--------------------------------------"

if npx tsc --noEmit 2>/dev/null; then
  pass "TypeScript compiles without errors"
else
  fail "TypeScript compilation failed"
fi

echo ""
echo "3. Checking Required Files..."
echo "-----------------------------"

# Widget files
if [ -f "public/widget/embed.js" ]; then pass "Widget embed.js exists"; else fail "Widget embed.js missing"; fi
if [ -f "public/widget/frame.html" ]; then pass "Widget frame.html exists"; else fail "Widget frame.html missing"; fi

# Docs
if [ -f "docs/WIDGET_EMBED_TROUBLESHOOTING.md" ]; then pass "Widget troubleshooting docs exist"; else warn "Widget troubleshooting docs missing"; fi
if [ -f "docs/DEMO_RESET_RUNBOOK.md" ]; then pass "Demo reset runbook exists"; else warn "Demo reset runbook missing"; fi

# Config
if [ -f "package.json" ]; then pass "package.json exists"; else fail "package.json missing"; fi
if [ -f "drizzle.config.ts" ]; then pass "drizzle.config.ts exists"; else fail "drizzle.config.ts missing"; fi

echo ""
echo "4. Checking Database Connection..."
echo "-----------------------------------"

# Try to run a simple query to verify database connectivity using psql or curl
if [ -n "$DATABASE_URL" ]; then
  # Use tsx to run a quick ESM check
  if npx tsx -e "
import { Pool } from '@neondatabase/serverless';
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
await pool.query('SELECT 1');
console.log('OK');
process.exit(0);
" 2>/dev/null; then
    pass "Database connection successful"
  else
    warn "Database connection check failed (may be network issue)"
  fi
else
  fail "DATABASE_URL not set, cannot check database connection"
fi

echo ""
echo "5. Checking Widget Version..."
echo "-----------------------------"

WIDGET_VERSION=$(grep -o "TCAI_VERSION = '[^']*'" public/widget/embed.js 2>/dev/null | head -1 | cut -d"'" -f2)
if [ -n "$WIDGET_VERSION" ]; then
  pass "Widget version: $WIDGET_VERSION"
else
  warn "Widget version not found in embed.js"
fi

echo ""
echo "6. Checking Rate Limiting Configuration..."
echo "------------------------------------------"

if grep -q "tenantChatLimiter" server/app.ts 2>/dev/null; then
  pass "Tenant-level rate limiting configured"
else
  warn "Tenant-level rate limiting not found"
fi

if grep -q "dailyMessageLimiter" server/app.ts 2>/dev/null; then
  pass "Daily message cap configured"
else
  warn "Daily message cap not found"
fi

if grep -q "limit: '100kb'" server/app.ts 2>/dev/null; then
  pass "Payload size limits configured"
else
  warn "Payload size limits not found"
fi

echo ""
echo "7. Checking Security Headers..."
echo "-------------------------------"

if grep -q "helmet" server/app.ts 2>/dev/null; then
  pass "Helmet security headers enabled"
else
  fail "Helmet security headers not found"
fi

echo ""
echo "==========================================="
echo "  SUMMARY"
echo "==========================================="
echo ""

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
  echo -e "${GREEN}All checks passed! Ready for deployment.${NC}"
  exit 0
elif [ $ERRORS -eq 0 ]; then
  echo -e "${YELLOW}Passed with $WARNINGS warning(s). Review before deployment.${NC}"
  exit 0
else
  echo -e "${RED}Failed with $ERRORS error(s) and $WARNINGS warning(s).${NC}"
  echo "Fix the errors before deploying."
  exit 1
fi

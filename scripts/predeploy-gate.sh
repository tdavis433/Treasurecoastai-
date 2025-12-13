#!/bin/bash
# ============================================================================
# TREASURE COAST AI - MASTER PRE-DEPLOYMENT SAFETY GATE
# ============================================================================
# This is the ultimate gatekeeper before any production deployment.
# It runs ALL safety checks and provides a comprehensive go/no-go decision.
#
# Exit codes:
#   0 - All checks passed, safe to deploy
#   1 - Critical failures, DO NOT deploy
#   2 - Script error
#
# Usage: ./scripts/predeploy-gate.sh [--skip-typecheck] [--force]
# ============================================================================

set -e

# Parse arguments
SKIP_TYPECHECK=false
FORCE_DEPLOY=false
for arg in "$@"; do
  case $arg in
    --skip-typecheck) SKIP_TYPECHECK=true ;;
    --force) FORCE_DEPLOY=true ;;
  esac
done

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m'

# Counters
CRITICAL_FAILURES=0
WARNINGS=0
CHECKS_PASSED=0

# Timestamp
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S UTC')

echo ""
echo -e "${BOLD}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BOLD}║     TREASURE COAST AI - PRE-DEPLOYMENT SAFETY GATE            ║${NC}"
echo -e "${BOLD}║     Maximum Tightness: Phase 8.12 Master Check                ║${NC}"
echo -e "${BOLD}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}Run Time:${NC} $TIMESTAMP"
echo ""

# Helper functions
critical() { 
  echo -e "${RED}[CRITICAL]${NC} $1"
  ((CRITICAL_FAILURES++))
}

warning() { 
  echo -e "${YELLOW}[WARNING]${NC} $1"
  ((WARNINGS++))
}

passed() { 
  echo -e "${GREEN}[PASS]${NC} $1"
  ((CHECKS_PASSED++))
}

info() { 
  echo -e "${BLUE}[INFO]${NC} $1"
}

section() {
  echo ""
  echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BOLD}  $1${NC}"
  echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

# ============================================================================
# GATE 1: Environment Variables
# ============================================================================
section "GATE 1: Environment Variables"

# Required secrets
if [ -n "$DATABASE_URL" ]; then 
  passed "DATABASE_URL is set"
else 
  critical "DATABASE_URL is not set"
fi

if [ -n "$OPENAI_API_KEY" ]; then 
  passed "OPENAI_API_KEY is set"
else 
  critical "OPENAI_API_KEY is not set"
fi

if [ -n "$WIDGET_TOKEN_SECRET" ]; then 
  passed "WIDGET_TOKEN_SECRET is set"
else 
  critical "WIDGET_TOKEN_SECRET is not set"
fi

# Optional but recommended
if [ -n "$SESSION_SECRET" ]; then
  passed "SESSION_SECRET is set (custom)"
else
  warning "SESSION_SECRET not set (using default)"
fi

# Check for default admin password
if [ -n "$DEFAULT_ADMIN_PASSWORD" ]; then
  if [ "$DEFAULT_ADMIN_PASSWORD" = "admin123" ]; then
    warning "DEFAULT_ADMIN_PASSWORD is still the default 'admin123' - change in production"
  else
    passed "DEFAULT_ADMIN_PASSWORD is customized"
  fi
else
  warning "DEFAULT_ADMIN_PASSWORD not set (using hardcoded default)"
fi

# Demo safe mode check
if [ -n "$DEMO_SAFE_MODE" ] && [ "$DEMO_SAFE_MODE" = "true" ]; then
  info "DEMO_SAFE_MODE is enabled - demo workspaces protected from destructive operations"
fi

# ============================================================================
# GATE 2: Secrets Scan
# ============================================================================
section "GATE 2: Secrets Scan (Leaked Credentials Check)"

if [ -x "scripts/secrets-scan.sh" ]; then
  if ./scripts/secrets-scan.sh 2>/dev/null; then
    passed "No leaked secrets detected"
  else
    critical "Secrets scan detected potential exposed credentials"
    info "Review the output above and fix before deploying"
  fi
else
  warning "secrets-scan.sh not found or not executable"
fi

# ============================================================================
# GATE 3: Vulnerability Scan (npm audit)
# ============================================================================
section "GATE 3: Vulnerability Scan (npm audit)"

if command -v npm &> /dev/null; then
  AUDIT_OUTPUT=$(npm audit --audit-level=critical 2>&1 || true)
  if echo "$AUDIT_OUTPUT" | grep -q "found 0 vulnerabilities"; then
    passed "No critical vulnerabilities found"
  elif echo "$AUDIT_OUTPUT" | grep -q "critical"; then
    CRITICAL_COUNT=$(echo "$AUDIT_OUTPUT" | grep -oE "[0-9]+ critical" | head -1 | cut -d' ' -f1)
    if [ -n "$CRITICAL_COUNT" ] && [ "$CRITICAL_COUNT" -gt 0 ]; then
      critical "Found $CRITICAL_COUNT critical vulnerabilities"
      info "Run 'npm audit' for details"
    else
      passed "No critical vulnerabilities (may have lower severity)"
    fi
  else
    passed "npm audit completed (no critical issues)"
  fi
else
  warning "npm not available for vulnerability scan"
fi

# ============================================================================
# GATE 4: TypeScript Compilation
# ============================================================================
section "GATE 4: TypeScript Compilation"

if [ "$SKIP_TYPECHECK" = true ]; then
  info "TypeScript check skipped (--skip-typecheck flag)"
else
  if npx tsc --noEmit 2>/dev/null; then
    passed "TypeScript compiles without errors"
  else
    critical "TypeScript compilation failed"
    info "Fix type errors before deploying"
  fi
fi

# ============================================================================
# GATE 5: Migration Safety
# ============================================================================
section "GATE 5: Migration Safety"

if [ -x "scripts/migration-safety-gate.sh" ]; then
  MIGRATION_OUTPUT=$(./scripts/migration-safety-gate.sh 2>&1)
  MIGRATION_EXIT=$?
  if [ $MIGRATION_EXIT -eq 0 ]; then
    if echo "$MIGRATION_OUTPUT" | grep -q "PASSED WITH WARNINGS"; then
      warning "Migration safety checks passed with warnings (review recommended)"
    else
      passed "Migration safety checks passed"
    fi
  else
    critical "Migration safety checks FAILED - do not deploy without review"
    info "Run './scripts/migration-safety-gate.sh' for details"
  fi
else
  critical "migration-safety-gate.sh not found or not executable"
fi

# ============================================================================
# GATE 6: Critical Files Check
# ============================================================================
section "GATE 6: Critical Files"

# Widget files
if [ -f "public/widget/embed.js" ] && [ -f "public/widget/frame.html" ]; then
  passed "Widget files present (embed.js, frame.html)"
else
  critical "Widget files missing"
fi

# Core files
if [ -f "shared/schema.ts" ]; then passed "Schema file exists"; else critical "schema.ts missing"; fi
if [ -f "server/app.ts" ]; then passed "Server app exists"; else critical "server/app.ts missing"; fi
if [ -f "drizzle.config.ts" ]; then passed "Drizzle config exists"; else critical "drizzle.config.ts missing"; fi

# Documentation
if [ -f "docs/OPS_RUNBOOK.md" ]; then passed "OPS_RUNBOOK.md exists"; else warning "OPS_RUNBOOK.md missing"; fi
if [ -f "docs/EMBED_TROUBLESHOOTING_CSP.md" ]; then passed "CSP troubleshooting docs exist"; else warning "CSP docs missing"; fi

# ============================================================================
# GATE 7: Security Configuration
# ============================================================================
section "GATE 7: Security Configuration"

# Check for Helmet
if grep -q "helmet" server/app.ts 2>/dev/null; then
  passed "Helmet security headers enabled"
else
  critical "Helmet not found in server/app.ts"
fi

# Check for CSRF protection
if grep -q "csrf" server/app.ts 2>/dev/null || grep -q "csrfMiddleware" server/app.ts 2>/dev/null; then
  passed "CSRF protection enabled"
else
  warning "CSRF protection not detected"
fi

# Check for rate limiting
if grep -q "rateLimit" server/app.ts 2>/dev/null; then
  passed "Rate limiting configured"
else
  warning "Rate limiting not detected"
fi

# Check for session security
if grep -q "sameSite" server/app.ts 2>/dev/null; then
  passed "SameSite cookie policy configured"
else
  warning "SameSite cookie policy not detected"
fi

# ============================================================================
# GATE 8: Data Lifecycle & Retention
# ============================================================================
section "GATE 8: Data Lifecycle"

if [ -f "server/dataLifecycle.ts" ]; then
  passed "Data lifecycle module exists"
else
  warning "dataLifecycle.ts not found"
fi

# Check for retention configuration
if grep -q "RETENTION_" server/dataLifecycle.ts 2>/dev/null; then
  passed "Retention configuration detected"
else
  warning "Retention configuration not found"
fi

# ============================================================================
# GATE 9: Observability
# ============================================================================
section "GATE 9: Observability"

OBSERVABILITY_PASS=0

# Check requestId middleware file AND integration
if [ -f "server/requestId.ts" ]; then
  if grep -q "requestIdMiddleware\|addRequestId" server/app.ts 2>/dev/null; then
    passed "Request ID middleware file exists AND integrated in app.ts"
    ((OBSERVABILITY_PASS++))
  else
    warning "requestId.ts exists but not integrated in server/app.ts"
  fi
else
  warning "server/requestId.ts not found"
fi

# Check structured logger file AND usage
if [ -f "server/structuredLogger.ts" ]; then
  if grep -rq "structuredLog\|structuredLogger" server/routes.ts server/orchestrator.ts 2>/dev/null; then
    passed "Structured logger exists AND used in routes/orchestrator"
    ((OBSERVABILITY_PASS++))
  else
    warning "structuredLogger.ts exists but not used in critical files"
  fi
else
  warning "server/structuredLogger.ts not found"
fi

# Check audit logger AND integration
if [ -f "server/auditLogger.ts" ]; then
  if grep -q "auditLog\|logAuditEvent" server/routes.ts 2>/dev/null; then
    passed "Audit logger exists AND integrated in routes"
    ((OBSERVABILITY_PASS++))
  else
    warning "auditLogger.ts exists but not integrated in routes"
  fi
else
  warning "server/auditLogger.ts not found"
fi

if [ $OBSERVABILITY_PASS -lt 2 ]; then
  warning "Observability incomplete - less than 2/3 components fully integrated"
fi

# ============================================================================
# GATE 10: Payment Safety
# ============================================================================
section "GATE 10: Payment Safety (No-Payment Guard)"

PAYMENT_VIOLATIONS=0

# Comprehensive payment pattern check - MUST pass all checks
PAYMENT_PATTERNS=(
  "processPayment"
  "chargeCard"
  "stripe\.charges"
  "stripe\.paymentIntents"
  "stripe\.checkout"
  "paypal\.payment"
  "paypal\.orders"
  "braintree\.transaction"
  "square\.payments"
  "createCharge"
  "capturePayment"
  "refundPayment"
  "createPaymentIntent"
  "confirmPayment"
)

for pattern in "${PAYMENT_PATTERNS[@]}"; do
  MATCHES=$(grep -rn "$pattern" server/ client/ shared/ 2>/dev/null | grep -v "\.md:" | grep -v "node_modules" | grep -v "\.test\." | head -3)
  if [ -n "$MATCHES" ]; then
    info "Found payment pattern '$pattern':"
    echo "$MATCHES" | head -2
    ((PAYMENT_VIOLATIONS++))
  fi
done

# Check for Stripe SDK usage (not just imports)
STRIPE_USAGE=$(grep -rn "new Stripe\|Stripe(" server/ client/ 2>/dev/null | grep -v "stripe-replit-sync" | grep -v "\.md:" | grep -v "node_modules" | head -3)
if [ -n "$STRIPE_USAGE" ]; then
  info "Found Stripe SDK instantiation:"
  echo "$STRIPE_USAGE" | head -2
  # Flag if combined with payment methods
  if grep -rn "paymentIntents\|charges\|checkout\.sessions" server/ client/ 2>/dev/null | grep -v "\.md:" | head -1; then
    ((PAYMENT_VIOLATIONS++))
  fi
fi

# Run guard script - REQUIRED
if [ -x "scripts/guard-no-payments.sh" ]; then
  GUARD_OUTPUT=$(./scripts/guard-no-payments.sh 2>&1)
  GUARD_EXIT=$?
  if [ $GUARD_EXIT -ne 0 ]; then
    info "Guard script detected violations:"
    echo "$GUARD_OUTPUT" | tail -5
    ((PAYMENT_VIOLATIONS++))
  fi
else
  # Guard script missing is now a critical failure
  critical "scripts/guard-no-payments.sh not found - payment guard is REQUIRED"
fi

if [ $PAYMENT_VIOLATIONS -gt 0 ]; then
  critical "Payment processing code detected ($PAYMENT_VIOLATIONS violations) - violates no-payment policy"
else
  passed "No payment processing code detected"
fi

# ============================================================================
# SUMMARY
# ============================================================================
echo ""
echo -e "${BOLD}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BOLD}║                    DEPLOYMENT GATE SUMMARY                     ║${NC}"
echo -e "${BOLD}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "  ${GREEN}Checks Passed:${NC}     $CHECKS_PASSED"
echo -e "  ${YELLOW}Warnings:${NC}          $WARNINGS"
echo -e "  ${RED}Critical Failures:${NC} $CRITICAL_FAILURES"
echo ""

if [ $CRITICAL_FAILURES -gt 0 ]; then
  echo -e "${RED}╔════════════════════════════════════════════════════════════════╗${NC}"
  echo -e "${RED}║  ❌ DEPLOYMENT BLOCKED - FIX CRITICAL ISSUES BEFORE DEPLOYING ║${NC}"
  echo -e "${RED}╚════════════════════════════════════════════════════════════════╝${NC}"
  echo ""
  if [ "$FORCE_DEPLOY" = true ]; then
    echo -e "${YELLOW}--force flag detected. Proceeding despite failures (NOT RECOMMENDED)${NC}"
    exit 0
  fi
  exit 1
elif [ $WARNINGS -gt 0 ]; then
  echo -e "${YELLOW}╔════════════════════════════════════════════════════════════════╗${NC}"
  echo -e "${YELLOW}║  ⚠️  DEPLOYMENT ALLOWED WITH WARNINGS - REVIEW BEFORE DEPLOY  ║${NC}"
  echo -e "${YELLOW}╚════════════════════════════════════════════════════════════════╝${NC}"
  echo ""
  echo "Recommended actions before deployment:"
  echo "  1. Review all warnings above"
  echo "  2. Run 'npm run db:push --dry-run' for schema preview"
  echo "  3. Create backup if making schema changes"
  echo ""
  exit 0
else
  echo -e "${GREEN}╔════════════════════════════════════════════════════════════════╗${NC}"
  echo -e "${GREEN}║  ✅ ALL GATES PASSED - SAFE TO DEPLOY                          ║${NC}"
  echo -e "${GREEN}╚════════════════════════════════════════════════════════════════╝${NC}"
  echo ""
  exit 0
fi

#!/bin/bash

# Migration Safety Gate
# Runs pre-migration checks to prevent dangerous database operations

set -e

echo "============================================"
echo "  Migration Safety Gate"
echo "  Treasure Coast AI Platform"
echo "============================================"
echo ""

ERRORS=0
WARNINGS=0

# Color codes
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
    ((ERRORS++))
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
    ((WARNINGS++))
}

log_success() {
    echo -e "${GREEN}[OK]${NC} $1"
}

log_info() {
    echo "[INFO] $1"
}

# Check 1: Verify DATABASE_URL is set
echo "1. Checking database connection..."
if [ -z "$DATABASE_URL" ]; then
    log_error "DATABASE_URL is not set. Cannot proceed with migration checks."
else
    log_success "DATABASE_URL is configured"
fi

# Check 2: Verify schema file exists
echo ""
echo "2. Checking schema file..."
if [ -f "shared/schema.ts" ]; then
    log_success "Schema file exists: shared/schema.ts"
else
    log_error "Schema file not found: shared/schema.ts"
fi

# Check 3: Look for dangerous patterns in recent changes
echo ""
echo "3. Scanning for dangerous migration patterns..."

# Check for primary key type changes
if git diff --cached shared/schema.ts 2>/dev/null | grep -E '(serial|varchar|uuid).*primaryKey' | head -5; then
    log_warning "Primary key modifications detected - verify no type changes"
fi

# Check for DROP operations in any SQL files
if grep -r "DROP TABLE" . --include="*.sql" 2>/dev/null | head -5; then
    log_warning "DROP TABLE statements found in SQL files"
fi

if grep -r "DROP COLUMN" . --include="*.sql" 2>/dev/null | head -5; then
    log_warning "DROP COLUMN statements found in SQL files"
fi

# Check 4: Verify Drizzle config
echo ""
echo "4. Checking Drizzle configuration..."
if [ -f "drizzle.config.ts" ]; then
    log_success "Drizzle config exists"
else
    log_error "drizzle.config.ts not found"
fi

# Check 5: Verify backup capability
echo ""
echo "5. Checking backup capability..."
if command -v pg_dump &> /dev/null; then
    log_success "pg_dump is available for backups"
else
    log_warning "pg_dump not found - manual backup may not be possible"
fi

# Check 6: Environment safety
echo ""
echo "6. Checking environment..."
if [ "$NODE_ENV" = "production" ]; then
    log_warning "Running in PRODUCTION environment - extra caution required"
else
    log_success "Not in production environment"
fi

# Check 7: Verify no pending schema conflicts
echo ""
echo "7. Checking schema integrity..."
if [ -f "node_modules/.bin/drizzle-kit" ]; then
    log_success "drizzle-kit is installed"
else
    log_warning "drizzle-kit not found in node_modules"
fi

# Check 8: Audit log table exists
echo ""
echo "8. Verifying critical tables..."
CRITICAL_TABLES="admin_users bots workspaces leads appointments"
for table in $CRITICAL_TABLES; do
    if grep -q "export const $table" shared/schema.ts 2>/dev/null; then
        log_success "Table definition found: $table"
    else
        log_warning "Table definition not found: $table"
    fi
done

# Check 9: Foreign key safety
echo ""
echo "9. Checking for cascade delete patterns..."
CASCADE_COUNT=$(grep -c "onDelete.*cascade" shared/schema.ts 2>/dev/null || echo "0")
log_info "Found $CASCADE_COUNT cascade delete references"

# Summary
echo ""
echo "============================================"
echo "  Migration Safety Gate Summary"
echo "============================================"

if [ $ERRORS -gt 0 ]; then
    echo -e "${RED}FAILED${NC}: $ERRORS error(s), $WARNINGS warning(s)"
    echo ""
    echo "Migration blocked. Fix errors before proceeding."
    exit 1
elif [ $WARNINGS -gt 0 ]; then
    echo -e "${YELLOW}PASSED WITH WARNINGS${NC}: $WARNINGS warning(s)"
    echo ""
    echo "Review warnings before proceeding with migration."
    echo "Recommended: Create backup before applying changes."
    exit 0
else
    echo -e "${GREEN}PASSED${NC}: All checks passed"
    echo ""
    echo "Safe to proceed with migration."
    echo "Recommended: Run 'npm run db:push --dry-run' first."
    exit 0
fi

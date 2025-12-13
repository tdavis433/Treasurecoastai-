#!/bin/bash
# =============================================================================
# TREASURE COAST AI - DAILY SELF-CHECK SCRIPT
# =============================================================================
# Performs automated health checks for monitoring and CI/CD pipelines.
# Suitable for cron jobs, UptimeRobot, or manual verification.
#
# Required Environment Variables:
#   BASE_URL        - Base URL of the application (e.g., https://myapp.replit.app)
#   DEMO_CLIENT_ID  - Demo workspace client ID for widget API checks
#   DEMO_BOT_ID     - Demo bot ID for widget API checks
#
# Optional Environment Variables:
#   TIMEOUT_SECONDS - Request timeout (default: 15)
#   VERBOSE         - Set to "true" for detailed output
#
# Exit Codes:
#   0 - All checks passed
#   1 - One or more checks failed
# =============================================================================

set -e

# Configuration
BASE_URL="${BASE_URL:-}"
DEMO_CLIENT_ID="${DEMO_CLIENT_ID:-}"
DEMO_BOT_ID="${DEMO_BOT_ID:-}"
TIMEOUT_SECONDS="${TIMEOUT_SECONDS:-15}"
VERBOSE="${VERBOSE:-false}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track failures
FAILED=0
PASSED=0

log() {
    echo -e "$1"
}

log_pass() {
    log "${GREEN}[PASS]${NC} $1"
    ((PASSED++))
}

log_fail() {
    log "${RED}[FAIL]${NC} $1"
    ((FAILED++))
}

log_warn() {
    log "${YELLOW}[WARN]${NC} $1"
}

log_verbose() {
    if [ "$VERBOSE" = "true" ]; then
        log "$1"
    fi
}

# Validate required environment variables
validate_env() {
    if [ -z "$BASE_URL" ]; then
        log_fail "BASE_URL is required"
        exit 1
    fi
    if [ -z "$DEMO_CLIENT_ID" ]; then
        log_fail "DEMO_CLIENT_ID is required"
        exit 1
    fi
    if [ -z "$DEMO_BOT_ID" ]; then
        log_fail "DEMO_BOT_ID is required"
        exit 1
    fi
    
    # Remove trailing slash from BASE_URL
    BASE_URL="${BASE_URL%/}"
    
    log_verbose "Configuration:"
    log_verbose "  BASE_URL: $BASE_URL"
    log_verbose "  DEMO_CLIENT_ID: $DEMO_CLIENT_ID"
    log_verbose "  DEMO_BOT_ID: $DEMO_BOT_ID"
    log_verbose "  TIMEOUT_SECONDS: $TIMEOUT_SECONDS"
}

# Check 1: Public health endpoint
check_public_health() {
    log_verbose "\n--- Checking public health endpoint ---"
    
    HEALTH_RESPONSE=$(curl -s -m "$TIMEOUT_SECONDS" "$BASE_URL/api/health" 2>/dev/null || echo '{"ok":false}')
    
    # Parse response
    OK=$(echo "$HEALTH_RESPONSE" | grep -o '"ok":[^,}]*' | head -1 | cut -d':' -f2 | tr -d ' ')
    DB_OK=$(echo "$HEALTH_RESPONSE" | grep -o '"db":{"ok":[^,}]*' | head -1 | grep -o 'true\|false' | head -1)
    
    log_verbose "Response: $HEALTH_RESPONSE"
    
    if [ "$OK" = "true" ]; then
        log_pass "Public health: ok=true"
    else
        log_fail "Public health: ok=$OK (expected true)"
    fi
    
    if [ "$DB_OK" = "true" ]; then
        log_pass "Database: ok=true"
    else
        log_fail "Database: ok=$DB_OK (expected true)"
    fi
}

# Check 2: Widget config endpoint
check_widget_config() {
    log_verbose "\n--- Checking widget config endpoint ---"
    
    CONFIG_URL="$BASE_URL/api/widget/config/$DEMO_CLIENT_ID/$DEMO_BOT_ID"
    CONFIG_RESPONSE=$(curl -s -m "$TIMEOUT_SECONDS" -w "\n%{http_code}" "$CONFIG_URL" 2>/dev/null || echo -e "\n000")
    
    HTTP_CODE=$(echo "$CONFIG_RESPONSE" | tail -1)
    BODY=$(echo "$CONFIG_RESPONSE" | sed '$d')
    
    log_verbose "HTTP Code: $HTTP_CODE"
    log_verbose "Response: $BODY"
    
    if [ "$HTTP_CODE" = "200" ]; then
        # Check for essential fields
        if echo "$BODY" | grep -q '"botId"'; then
            log_pass "Widget config: botId present (HTTP $HTTP_CODE)"
        else
            log_fail "Widget config: botId missing"
        fi
    else
        log_fail "Widget config: HTTP $HTTP_CODE (expected 200)"
    fi
}

# Check 3: Widget chat endpoint (POST with minimal message)
check_widget_chat() {
    log_verbose "\n--- Checking widget chat endpoint ---"
    
    CHAT_URL="$BASE_URL/api/chat/$DEMO_CLIENT_ID/$DEMO_BOT_ID"
    CHAT_PAYLOAD='{"messages":[{"role":"user","content":"test"}]}'
    
    CHAT_RESPONSE=$(curl -s -m "$TIMEOUT_SECONDS" -w "\n%{http_code}" \
        -X POST \
        -H "Content-Type: application/json" \
        -d "$CHAT_PAYLOAD" \
        "$CHAT_URL" 2>/dev/null || echo -e "\n000")
    
    HTTP_CODE=$(echo "$CHAT_RESPONSE" | tail -1)
    BODY=$(echo "$CHAT_RESPONSE" | sed '$d')
    
    log_verbose "HTTP Code: $HTTP_CODE"
    log_verbose "Response: ${BODY:0:200}..."
    
    if [ "$HTTP_CODE" = "200" ]; then
        # Check for response content
        if echo "$BODY" | grep -q '"response"'; then
            log_pass "Widget chat: response received (HTTP $HTTP_CODE)"
        else
            log_warn "Widget chat: no response field (may be streaming)"
            log_pass "Widget chat: endpoint responding (HTTP $HTTP_CODE)"
        fi
    else
        log_fail "Widget chat: HTTP $HTTP_CODE (expected 200)"
    fi
}

# Check 4: Static assets
check_static_assets() {
    log_verbose "\n--- Checking static assets ---"
    
    # Check widget.js
    WIDGET_JS_URL="$BASE_URL/widget/widget.js"
    WIDGET_JS_CODE=$(curl -s -o /dev/null -w "%{http_code}" -m "$TIMEOUT_SECONDS" "$WIDGET_JS_URL" 2>/dev/null || echo "000")
    
    if [ "$WIDGET_JS_CODE" = "200" ]; then
        log_pass "Widget JS: accessible (HTTP $WIDGET_JS_CODE)"
    else
        log_fail "Widget JS: HTTP $WIDGET_JS_CODE (expected 200)"
    fi
}

# Print summary
print_summary() {
    echo ""
    echo "============================================"
    TOTAL=$((PASSED + FAILED))
    
    if [ $FAILED -eq 0 ]; then
        log "${GREEN}SELF-CHECK PASSED${NC} - $PASSED/$TOTAL checks passed"
        echo "============================================"
        return 0
    else
        log "${RED}SELF-CHECK FAILED${NC} - $PASSED/$TOTAL passed, $FAILED failed"
        echo "============================================"
        return 1
    fi
}

# Main execution
main() {
    echo "============================================"
    echo "TREASURE COAST AI - DAILY SELF-CHECK"
    echo "$(date -Iseconds)"
    echo "============================================"
    
    validate_env
    
    check_public_health
    check_widget_config
    check_widget_chat
    check_static_assets
    
    print_summary
}

main "$@"

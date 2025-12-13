#!/bin/bash
# ============================================================================
# NPM AUDIT GATE SCRIPT
# ============================================================================
# Runs npm audit and blocks deployment if critical/high vulnerabilities exist
# Should be run as part of CI/CD pipeline or pre-deploy checks
#
# Exit codes:
#   0 - No critical/high vulnerabilities
#   1 - Critical or high vulnerabilities found (blocking)
#   2 - Script error
# ============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo "=============================================="
echo "  NPM AUDIT GATE - Security Vulnerability Check"
echo "=============================================="
echo ""

# Configuration
BLOCK_ON_CRITICAL=true
BLOCK_ON_HIGH=true
BLOCK_ON_MODERATE=false  # Set to true for stricter policy
SHOW_FULL_REPORT=true

# Track vulnerabilities by severity
CRITICAL=0
HIGH=0
MODERATE=0
LOW=0

# ============================================================================
# RUN NPM AUDIT
# ============================================================================

echo "Running npm audit..."
echo ""

# Create temp file for audit output (safer than variable interpolation)
AUDIT_FILE=$(mktemp)
trap "rm -f $AUDIT_FILE" EXIT

# Run audit and capture to file
if ! npm audit --json > "$AUDIT_FILE" 2>/dev/null; then
  # npm audit exits with non-zero when vulnerabilities found, that's expected
  :
fi

# Check if audit ran successfully
if [ ! -s "$AUDIT_FILE" ]; then
  echo -e "${RED}[ERROR]${NC} Failed to run npm audit or empty output"
  exit 2
fi

# Parse vulnerability counts using node with file (safe from injection)
VULN_COUNTS=$(AUDIT_FILE="$AUDIT_FILE" node - <<'PARSE_SCRIPT'
const fs = require('fs');
try {
  const auditFile = process.env.AUDIT_FILE;
  if (!auditFile) throw new Error('AUDIT_FILE not set');
  const data = fs.readFileSync(auditFile, 'utf8');
  const audit = JSON.parse(data);
  const meta = audit.metadata?.vulnerabilities || {};
  console.log(JSON.stringify({
    critical: meta.critical || 0,
    high: meta.high || 0,
    moderate: meta.moderate || 0,
    low: meta.low || 0,
    total: meta.total || 0,
    parse_success: true
  }));
} catch (err) {
  // Output error marker so shell knows parsing failed
  console.log(JSON.stringify({
    critical: -1,
    high: -1,
    moderate: -1,
    low: -1,
    total: -1,
    parse_success: false,
    error: err.message
  }));
}
PARSE_SCRIPT
2>/dev/null)

# Check if parsing succeeded
PARSE_SUCCESS=$(echo "$VULN_COUNTS" | node -p "JSON.parse(require('fs').readFileSync('/dev/stdin', 'utf8')).parse_success" 2>/dev/null || echo "false")

if [ "$PARSE_SUCCESS" != "true" ]; then
  echo -e "${RED}[ERROR]${NC} Failed to parse npm audit JSON output"
  echo "This is treated as a blocking error - please investigate manually."
  exit 2
fi

# Extract counts safely using node with stdin
CRITICAL=$(echo "$VULN_COUNTS" | node -p "JSON.parse(require('fs').readFileSync('/dev/stdin', 'utf8')).critical" 2>/dev/null)
HIGH=$(echo "$VULN_COUNTS" | node -p "JSON.parse(require('fs').readFileSync('/dev/stdin', 'utf8')).high" 2>/dev/null)
MODERATE=$(echo "$VULN_COUNTS" | node -p "JSON.parse(require('fs').readFileSync('/dev/stdin', 'utf8')).moderate" 2>/dev/null)
LOW=$(echo "$VULN_COUNTS" | node -p "JSON.parse(require('fs').readFileSync('/dev/stdin', 'utf8')).low" 2>/dev/null)
TOTAL=$(echo "$VULN_COUNTS" | node -p "JSON.parse(require('fs').readFileSync('/dev/stdin', 'utf8')).total" 2>/dev/null)

# Validate we got actual numbers (not empty/undefined)
if ! [[ "$CRITICAL" =~ ^[0-9]+$ ]] || ! [[ "$HIGH" =~ ^[0-9]+$ ]]; then
  echo -e "${RED}[ERROR]${NC} Invalid vulnerability count values parsed"
  exit 2
fi

# ============================================================================
# DISPLAY RESULTS
# ============================================================================

echo "Vulnerability Summary:"
echo "----------------------"

if [ "$CRITICAL" -gt 0 ]; then
  echo -e "  ${RED}Critical:${NC}  $CRITICAL"
else
  echo -e "  ${GREEN}Critical:${NC}  $CRITICAL"
fi

if [ "$HIGH" -gt 0 ]; then
  echo -e "  ${RED}High:${NC}      $HIGH"
else
  echo -e "  ${GREEN}High:${NC}      $HIGH"
fi

if [ "$MODERATE" -gt 0 ]; then
  echo -e "  ${YELLOW}Moderate:${NC}  $MODERATE"
else
  echo -e "  ${GREEN}Moderate:${NC}  $MODERATE"
fi

if [ "$LOW" -gt 0 ]; then
  echo -e "  ${CYAN}Low:${NC}       $LOW"
else
  echo -e "  ${GREEN}Low:${NC}       $LOW"
fi

echo ""
echo "Total: $TOTAL vulnerability/vulnerabilities"
echo ""

# ============================================================================
# SHOW DETAILED REPORT IF REQUESTED
# ============================================================================

if [ "$SHOW_FULL_REPORT" = true ] && [ "$TOTAL" -gt 0 ]; then
  echo "Detailed Report:"
  echo "----------------"
  npm audit 2>/dev/null || true
  echo ""
fi

# ============================================================================
# DETERMINE BLOCKING DECISION
# ============================================================================

BLOCK=false
BLOCK_REASON=""

if [ "$BLOCK_ON_CRITICAL" = true ] && [ "$CRITICAL" -gt 0 ]; then
  BLOCK=true
  BLOCK_REASON="$CRITICAL critical vulnerability/vulnerabilities"
fi

if [ "$BLOCK_ON_HIGH" = true ] && [ "$HIGH" -gt 0 ]; then
  BLOCK=true
  if [ -n "$BLOCK_REASON" ]; then
    BLOCK_REASON="$BLOCK_REASON and $HIGH high vulnerability/vulnerabilities"
  else
    BLOCK_REASON="$HIGH high vulnerability/vulnerabilities"
  fi
fi

if [ "$BLOCK_ON_MODERATE" = true ] && [ "$MODERATE" -gt 0 ]; then
  BLOCK=true
  if [ -n "$BLOCK_REASON" ]; then
    BLOCK_REASON="$BLOCK_REASON and $MODERATE moderate vulnerability/vulnerabilities"
  else
    BLOCK_REASON="$MODERATE moderate vulnerability/vulnerabilities"
  fi
fi

# ============================================================================
# REMEDIATION SUGGESTIONS
# ============================================================================

if [ "$TOTAL" -gt 0 ]; then
  echo "=============================================="
  echo "  REMEDIATION OPTIONS"
  echo "=============================================="
  echo ""
  echo "1. Try automatic fixes:"
  echo "   npm audit fix"
  echo ""
  echo "2. For breaking changes (use with caution):"
  echo "   npm audit fix --force"
  echo ""
  echo "3. For specific packages, update manually:"
  echo "   npm update <package-name>"
  echo ""
  echo "4. If a vulnerability is in a dev dependency and"
  echo "   doesn't affect production, you may choose to"
  echo "   document and accept the risk."
  echo ""
fi

# ============================================================================
# FINAL DECISION
# ============================================================================

echo "=============================================="
echo "  AUDIT GATE DECISION"
echo "=============================================="
echo ""

if [ "$BLOCK" = true ]; then
  echo -e "${RED}[BLOCKED]${NC} Deployment blocked due to $BLOCK_REASON"
  echo ""
  echo "You must fix these vulnerabilities before deploying."
  echo "Run 'npm audit fix' or update affected packages manually."
  echo ""
  exit 1
else
  if [ "$TOTAL" -gt 0 ]; then
    echo -e "${YELLOW}[PASS WITH WARNINGS]${NC} No blocking vulnerabilities"
    echo "  (Found $TOTAL low/moderate vulnerabilities - consider fixing)"
  else
    echo -e "${GREEN}[PASS]${NC} No known vulnerabilities"
  fi
  echo ""
  exit 0
fi

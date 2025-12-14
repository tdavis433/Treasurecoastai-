#!/bin/bash
# Treasure Coast AI - Zero Stripe Guard Script (Option A)
# STRICT: Fails on Stripe runtime code (NOT security filters or DB columns)
# Exit code 0 = PASS, Exit code 1 = FAIL

echo "============================================"
echo "ZERO-STRIPE GUARD CHECK (Option A)"
echo "============================================"
echo ""

# Only scan runtime code dirs - not scripts (which contain guard patterns)
SCAN_DIRS="server client shared"
EXCLUDE_PATTERNS="node_modules|\.git|dist|\.md$"

# Patterns that indicate ACTIVE Stripe usage (not just mentions)
STRIPE_PATTERNS="js\.stripe\.com|api\.stripe\.com|stripe-signature|stripeClient|stripeService|stripeSync|webhookHandlers|new Stripe\(|stripe\.customers\.|stripe\.subscriptions\.|stripe\.checkout\."

# Files that are ALLOWED to mention stripe for security/audit purposes
ALLOWED_FILES="auditLogger\.ts|urlValidator\.ts|secrets-scan\.sh|predeploy-gate\.sh|guard-no-payments\.sh"

FOUND_CRITICAL=0

echo "Scanning for ACTIVE Stripe integration code..."
echo "(Security filters and guard scripts are excluded)"
echo ""

for dir in $SCAN_DIRS; do
    if [ -d "$dir" ]; then
        MATCHES=$(grep -r -n -i -E "$STRIPE_PATTERNS" "$dir" 2>/dev/null | grep -v -E "$EXCLUDE_PATTERNS" | grep -v -E "$ALLOWED_FILES")
        
        if [ -n "$MATCHES" ]; then
            echo "CRITICAL: Found active Stripe code in $dir:"
            echo "$MATCHES"
            echo ""
            FOUND_CRITICAL=1
        fi
    fi
done

echo ""

if [ $FOUND_CRITICAL -eq 0 ]; then
    echo "PASS: Zero Stripe enforcement verified."
    echo ""
    echo "This platform has NO payment processing code."
    echo "Booking uses redirect-only to external providers."
    echo ""
    echo "============================================"
    exit 0
else
    echo ""
    echo "FAIL: Stripe/payment code detected in runtime!"
    echo "Option A requires ZERO Stripe references."
    echo ""
    echo "============================================"
    exit 1
fi

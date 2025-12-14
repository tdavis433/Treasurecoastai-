#!/bin/bash
# Treasure Coast AI - Zero Stripe Guard Script (Option A)
# STRICT: Fails on Stripe runtime code (NOT security filters or DB columns)
# Exit code 0 = PASS, Exit code 1 = FAIL

echo "============================================"
echo "ZERO-STRIPE GUARD CHECK (Option A)"
echo "============================================"
echo ""

# Scan all runtime code directories
SCAN_DIRS="server client shared"
EXCLUDE_PATTERNS="node_modules|\.git|dist|\.md$"

# Comprehensive patterns that indicate ACTIVE Stripe usage
# This catches: SDK imports, API calls, webhook handlers, client instantiation
STRIPE_PATTERNS="from ['\"]stripe['\"]|require\(['\"]stripe['\"]\)|new Stripe\(|stripe\.customers\.|stripe\.subscriptions\.|stripe\.checkout\.|stripe\.paymentIntents\.|stripe\.invoices\.|stripe\.charges\.|stripe\.webhooks\.|js\.stripe\.com|api\.stripe\.com|stripe-signature|stripeClient|stripeService|stripeSync|webhookHandlers|/api/stripe/|createCheckoutSession|handleStripeWebhook"

# Files that are ALLOWED to mention stripe for security/audit purposes
# These files block/filter Stripe as a security measure, not enable it
ALLOWED_FILES="auditLogger\.ts|urlValidator\.ts"

FOUND_CRITICAL=0

echo "Scanning for ACTIVE Stripe integration code..."
echo "(Security filters are excluded: auditLogger.ts, urlValidator.ts)"
echo ""

for dir in $SCAN_DIRS; do
    if [ -d "$dir" ]; then
        MATCHES=$(grep -r -n -E "$STRIPE_PATTERNS" "$dir" 2>/dev/null | grep -v -E "$EXCLUDE_PATTERNS" | grep -v -E "$ALLOWED_FILES")
        
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

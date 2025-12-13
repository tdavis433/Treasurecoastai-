#!/bin/bash
# Treasure Coast AI - No Payments Guard Script
# Scans codebase for ACTIVE payment processing code
# Exit code 0 = PASS, Exit code 1 = FAIL

echo "============================================"
echo "NO-PAYMENTS GUARD CHECK"
echo "============================================"
echo ""

# Focus on actual payment processing patterns (not provider names or CSS)
# These patterns indicate ACTIVE payment processing:
CRITICAL_PATTERNS="createPaymentIntent|processPayment|chargeCustomer|createCharge|capturePayment|confirmPayment|handlePayment|submitPayment"

# Directories to scan
SCAN_DIRS="server client shared"

FOUND_CRITICAL=0

echo "Checking for CRITICAL payment processing patterns..."
echo "(Note: References to external providers like 'Square' are allowed for redirect-only booking)"
echo ""

for dir in $SCAN_DIRS; do
    if [ -d "$dir" ]; then
        MATCHES=$(grep -r -n -E "$CRITICAL_PATTERNS" "$dir" 2>/dev/null | grep -v "node_modules" | grep -v ".git" | grep -v "\.md$")
        
        if [ -n "$MATCHES" ]; then
            echo "CRITICAL: Found payment processing code:"
            echo "$MATCHES"
            FOUND_CRITICAL=1
        fi
    fi
done

echo ""

if [ $FOUND_CRITICAL -eq 0 ]; then
    echo "PASS: No active payment processing code found."
    echo ""
    echo "Note: This platform uses redirect-only booking."
    echo "Stripe integration exists but is DISABLED by design."
    echo "External provider names (Square, Calendly, etc.) are allowed."
    echo ""
    echo "============================================"
    exit 0
else
    echo ""
    echo "FAIL: Active payment processing code detected!"
    echo "This platform must NOT process payments."
    echo ""
    echo "============================================"
    exit 1
fi

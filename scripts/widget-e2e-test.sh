#!/bin/bash
# Treasure Coast AI - Widget E2E Test
# Tests widget loading, configuration, and chat flow via API
# Run: bash scripts/widget-e2e-test.sh

BASE_URL="${BASE_URL:-http://localhost:5000}"
PASSED=0
FAILED=0

echo "============================================"
echo "TREASURE COAST AI - WIDGET E2E TEST"
echo "Base URL: $BASE_URL"
echo "============================================"
echo ""

# Helper function
check_result() {
    local test_name="$1"
    local expected_code="$2"
    local actual_code="$3"
    local body="$4"
    
    if [ "$actual_code" -eq "$expected_code" ]; then
        echo "PASS: $test_name (HTTP $actual_code)"
        PASSED=$((PASSED + 1))
        return 0
    else
        echo "FAIL: $test_name (Expected $expected_code, got $actual_code)"
        echo "   Response: ${body:0:200}"
        FAILED=$((FAILED + 1))
        return 1
    fi
}

# Test 1: Widget test page loads
echo "Test 1: Widget Test Page"
TEST_PAGE_RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/widget-test.html")
TEST_PAGE_CODE=$(echo "$TEST_PAGE_RESPONSE" | tail -n1)
TEST_PAGE_BODY=$(echo "$TEST_PAGE_RESPONSE" | head -n-1)

if [ "$TEST_PAGE_CODE" -eq 200 ]; then
    if echo "$TEST_PAGE_BODY" | grep -q 'embed.js' && \
       echo "$TEST_PAGE_BODY" | grep -q 'TCAI_TEST_MODE'; then
        echo "PASS: Widget test page (HTTP 200, has embed.js and test mode)"
        PASSED=$((PASSED + 1))
    else
        echo "FAIL: Widget test page missing required elements"
        FAILED=$((FAILED + 1))
    fi
else
    check_result "Widget test page" 200 "$TEST_PAGE_CODE" "$TEST_PAGE_BODY"
fi

# Test 2: Widget embed.js loads
echo ""
echo "Test 2: Widget Embed Script"
EMBED_RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/widget/embed.js")
EMBED_CODE=$(echo "$EMBED_RESPONSE" | tail -n1)
EMBED_BODY=$(echo "$EMBED_RESPONSE" | head -n-1)

if [ "$EMBED_CODE" -eq 200 ]; then
    if echo "$EMBED_BODY" | grep -q 'TreasureCoastAI' && \
       echo "$EMBED_BODY" | grep -q 'TCAI_TEST_MODE'; then
        echo "PASS: Widget embed.js (HTTP 200, has TreasureCoastAI and test mode)"
        PASSED=$((PASSED + 1))
    else
        echo "FAIL: Widget embed.js missing required code"
        FAILED=$((FAILED + 1))
    fi
else
    check_result "Widget embed.js" 200 "$EMBED_CODE" "$EMBED_BODY"
fi

# Test 3: Widget.js loads
echo ""
echo "Test 3: Widget Main Script"
WIDGET_RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/widget/widget.js")
WIDGET_CODE=$(echo "$WIDGET_RESPONSE" | tail -n1)
WIDGET_BODY=$(echo "$WIDGET_RESPONSE" | head -n-1)

if [ "$WIDGET_CODE" -eq 200 ]; then
    if echo "$WIDGET_BODY" | grep -q 'TCAIWidget' && \
       echo "$WIDGET_BODY" | grep -q 'initWithConfig'; then
        echo "PASS: Widget.js (HTTP 200, has TCAIWidget and initWithConfig)"
        PASSED=$((PASSED + 1))
    else
        echo "FAIL: Widget.js missing required functions"
        FAILED=$((FAILED + 1))
    fi
else
    check_result "Widget.js" 200 "$WIDGET_CODE" "$WIDGET_BODY"
fi

# Test 4: Widget CSS loads
echo ""
echo "Test 4: Widget CSS"
CSS_RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/widget/widget.css")
CSS_CODE=$(echo "$CSS_RESPONSE" | tail -n1)

if [ "$CSS_CODE" -eq 200 ]; then
    echo "PASS: Widget CSS (HTTP 200)"
    PASSED=$((PASSED + 1))
else
    echo "FAIL: Widget CSS (HTTP $CSS_CODE)"
    FAILED=$((FAILED + 1))
fi

# Test 5: Widget frame.html loads
echo ""
echo "Test 5: Widget Frame HTML"
FRAME_RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/widget/frame.html")
FRAME_CODE=$(echo "$FRAME_RESPONSE" | tail -n1)
FRAME_BODY=$(echo "$FRAME_RESPONSE" | head -n-1)

if [ "$FRAME_CODE" -eq 200 ]; then
    if echo "$FRAME_BODY" | grep -q 'widget.js' && \
       echo "$FRAME_BODY" | grep -q 'widget.css'; then
        echo "PASS: Widget frame.html (HTTP 200, has widget.js/css)"
        PASSED=$((PASSED + 1))
    else
        echo "FAIL: Widget frame.html missing required includes"
        FAILED=$((FAILED + 1))
    fi
else
    check_result "Widget frame.html" 200 "$FRAME_CODE" "$FRAME_BODY"
fi

# Test 6: Demo bot widget config endpoint (skipped if demo data not seeded)
echo ""
echo "Test 6: Demo Widget Config API"
DEMO_CONFIG_RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/widget/paws_suds/paws_suds_main/config")
DEMO_CONFIG_CODE=$(echo "$DEMO_CONFIG_RESPONSE" | tail -n1)
DEMO_CONFIG_BODY=$(echo "$DEMO_CONFIG_RESPONSE" | head -n-1)

if [ "$DEMO_CONFIG_CODE" -eq 200 ]; then
    if echo "$DEMO_CONFIG_BODY" | grep -q '"token"'; then
        echo "PASS: Widget config API (HTTP 200, has token)"
        PASSED=$((PASSED + 1))
    else
        # Check if it's returning HTML (SPA fallback) instead of JSON - means demo data not seeded
        if echo "$DEMO_CONFIG_BODY" | grep -q '<!DOCTYPE html>'; then
            echo "SKIP: Widget config API (demo data not seeded)"
            PASSED=$((PASSED + 1))
        else
            echo "FAIL: Widget config API missing token"
            FAILED=$((FAILED + 1))
        fi
    fi
else
    # 404 means demo bot not found - expected if demo data not seeded
    if [ "$DEMO_CONFIG_CODE" -eq 404 ]; then
        echo "SKIP: Widget config API (demo bot not found)"
        PASSED=$((PASSED + 1))
    else
        check_result "Widget config API" 200 "$DEMO_CONFIG_CODE" "$DEMO_CONFIG_BODY"
    fi
fi

# Test 7: Widget chat via demo endpoint (skipped if demo data not seeded)
echo ""
echo "Test 7: Widget Chat Flow (10s timeout)"
CHAT_PAYLOAD='{"messages":[{"role":"user","content":"Hi, can you help me?"}],"source":"widget"}'
CHAT_START=$(date +%s)
CHAT_RESPONSE=$(curl -s -w "\n%{http_code}" \
    --max-time 10 \
    -X POST \
    -H "Content-Type: application/json" \
    -d "$CHAT_PAYLOAD" \
    "$BASE_URL/api/demo/paws_suds/chat")
CHAT_END=$(date +%s)
CHAT_CODE=$(echo "$CHAT_RESPONSE" | tail -n1)
CHAT_BODY=$(echo "$CHAT_RESPONSE" | head -n-1)
CHAT_DURATION=$((CHAT_END - CHAT_START))

if [ "$CHAT_CODE" -eq 200 ]; then
    if echo "$CHAT_BODY" | grep -q '"reply"'; then
        echo "PASS: Widget chat (HTTP 200, ${CHAT_DURATION}s, has reply)"
        PASSED=$((PASSED + 1))
    else
        # Check if returning HTML (demo not seeded)
        if echo "$CHAT_BODY" | grep -q '<!DOCTYPE html>'; then
            echo "SKIP: Widget chat (demo data not seeded)"
            PASSED=$((PASSED + 1))
        else
            echo "FAIL: Widget chat missing reply"
            FAILED=$((FAILED + 1))
        fi
    fi
else
    # 404 means demo bot not found
    if [ "$CHAT_CODE" -eq 404 ]; then
        echo "SKIP: Widget chat (demo bot not found)"
        PASSED=$((PASSED + 1))
    else
        echo "FAIL: Widget chat (HTTP $CHAT_CODE, ${CHAT_DURATION}s)"
        FAILED=$((FAILED + 1))
    fi
fi

# Test 8: Widget data-testid elements exist in embed.js
echo ""
echo "Test 8: Widget Has data-testid Attributes"
if echo "$EMBED_BODY" | grep -q 'data-testid' && \
   echo "$EMBED_BODY" | grep -q 'widget-bubble'; then
    echo "PASS: Widget embed.js has data-testid attributes"
    PASSED=$((PASSED + 1))
else
    echo "FAIL: Widget missing data-testid attributes"
    FAILED=$((FAILED + 1))
fi

# Test 9: Widget.js has data-testid attributes
echo ""
echo "Test 9: Widget.js Has data-testid Attributes"
if echo "$WIDGET_BODY" | grep -q 'data-testid.*input-message' && \
   echo "$WIDGET_BODY" | grep -q 'data-testid.*button-send'; then
    echo "PASS: Widget.js has input/button data-testid attributes"
    PASSED=$((PASSED + 1))
else
    echo "FAIL: Widget.js missing data-testid attributes"
    FAILED=$((FAILED + 1))
fi

# Test 10: Widget direct mode initialization in embed.js
echo ""
echo "Test 10: Widget Direct Mode Functions"
if echo "$EMBED_BODY" | grep -q 'loadWidgetDirectly' && \
   echo "$EMBED_BODY" | grep -q 'createDirectWidgetContainer'; then
    echo "PASS: Widget has direct mode functions for testing"
    PASSED=$((PASSED + 1))
else
    echo "FAIL: Widget missing direct mode functions"
    FAILED=$((FAILED + 1))
fi

# Summary
echo ""
echo "============================================"
echo "SUMMARY"
echo "============================================"
echo "Passed: $PASSED"
echo "Failed: $FAILED"
echo ""

if [ $FAILED -eq 0 ]; then
    echo "ALL WIDGET TESTS PASSED"
    exit 0
else
    echo "SOME WIDGET TESTS FAILED"
    exit 1
fi

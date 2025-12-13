# Widget Embed CSP & Security Troubleshooting Guide

## Overview

This guide covers Content Security Policy (CSP) issues and other security-related embedding problems that may prevent the Treasure Coast AI chat widget from functioning correctly on customer websites.

## Table of Contents

1. [Content Security Policy (CSP) Issues](#content-security-policy-csp-issues)
2. [CORS Configuration](#cors-configuration)
3. [Mixed Content Errors](#mixed-content-errors)
4. [iframe Restrictions](#iframe-restrictions)
5. [Offline Handling](#offline-handling)
6. [Network Error Recovery](#network-error-recovery)

---

## Content Security Policy (CSP) Issues

### Understanding CSP

Content Security Policy is a security header that restricts what resources a page can load. Many enterprise websites implement strict CSP policies that may block our widget.

### Common CSP Error Messages

```
Refused to load the script 'https://app.treasurecoastai.com/widget/embed.js'
because it violates the following Content Security Policy directive: "script-src 'self'"
```

```
Refused to connect to 'https://app.treasurecoastai.com/api/widget-chat'
because it violates the following Content Security Policy directive: "connect-src 'self'"
```

### Required CSP Directives

For the widget to function correctly, the hosting website's CSP must allow:

```
script-src: https://app.treasurecoastai.com
connect-src: https://app.treasurecoastai.com
style-src: 'unsafe-inline' https://app.treasurecoastai.com
frame-src: https://app.treasurecoastai.com
img-src: https://app.treasurecoastai.com data:
```

### Customer Instructions for CSP Updates

Provide this to customers with CSP-restricted sites:

```
Add the following to your Content-Security-Policy header:

script-src 'self' https://app.treasurecoastai.com;
connect-src 'self' https://app.treasurecoastai.com;
style-src 'self' 'unsafe-inline' https://app.treasurecoastai.com;
frame-src 'self' https://app.treasurecoastai.com;
img-src 'self' https://app.treasurecoastai.com data:;
```

### Diagnosing CSP Issues

1. Open browser Developer Tools (F12)
2. Go to Console tab
3. Look for errors containing "Content-Security-Policy" or "CSP"
4. Check Network tab → click on failed requests → Headers tab → look for CSP header

### CSP Report-Only Mode

Some sites use `Content-Security-Policy-Report-Only` which logs violations but doesn't block. The widget will work but violations will appear in console.

---

## CORS Configuration

### What is CORS?

Cross-Origin Resource Sharing controls which domains can make API requests. Our API must allow requests from customer domains.

### CORS Error Message

```
Access to XMLHttpRequest at 'https://app.treasurecoastai.com/api/widget-chat'
from origin 'https://customer-site.com' has been blocked by CORS policy
```

### Server-Side CORS Headers

Our API returns these headers:

```
Access-Control-Allow-Origin: * (or specific domain)
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization, X-Widget-Token
Access-Control-Allow-Credentials: false
```

### Debugging CORS

1. Check Network tab for preflight `OPTIONS` request
2. Verify response includes proper CORS headers
3. Ensure `Access-Control-Allow-Origin` matches the customer's domain

### Credential Mode

The widget uses `credentials: 'omit'` to avoid CORS credential complications:

```javascript
fetch(apiUrl, {
  credentials: 'omit', // No cookies sent cross-origin
  headers: {
    'X-Widget-Token': token
  }
});
```

---

## Mixed Content Errors

### Understanding Mixed Content

Browsers block HTTP requests from HTTPS pages (mixed content).

### Error Message

```
Mixed Content: The page at 'https://customer-site.com' was loaded over HTTPS,
but requested an insecure resource 'http://...'. This request has been blocked.
```

### Solution

- Widget URLs must always use HTTPS
- API endpoints must always use HTTPS
- Customer embed code must reference HTTPS URLs

### Verification Checklist

- [ ] Widget script URL starts with `https://`
- [ ] API base URL is `https://`
- [ ] No HTTP URLs in widget configuration
- [ ] Customer site is served over HTTPS

---

## iframe Restrictions

### X-Frame-Options

Some sites block iframe embedding. Our widget uses a floating div, not an iframe, so this typically doesn't affect us. However, if using iframe-based fallback:

```
Refused to display 'https://app.treasurecoastai.com' in a frame
because it set 'X-Frame-Options' to 'sameorigin'
```

### frame-ancestors CSP

Modern alternative to X-Frame-Options:

```
Content-Security-Policy: frame-ancestors 'self' https://customer-site.com;
```

### Widget Architecture

The Treasure Coast AI widget uses:
- Direct DOM injection (no iframe for main UI)
- Shadow DOM for style isolation
- Floating bubble positioned with fixed CSS

---

## Offline Handling

### Offline Detection

The widget detects network status using:

```javascript
window.addEventListener('online', handleOnline);
window.addEventListener('offline', handleOffline);
```

### Offline UI States

When offline, the widget displays:

1. **Offline Banner**: "You appear to be offline. Messages will be sent when connection is restored."
2. **Queued Messages**: User messages are stored locally and sent when online
3. **Disabled Send**: Visual indication that sending is temporarily unavailable

### Message Queue

Messages typed while offline are queued:

```javascript
// Messages stored in sessionStorage
const queue = JSON.parse(sessionStorage.getItem('tcai_message_queue') || '[]');
queue.push({ content, timestamp: Date.now() });
sessionStorage.setItem('tcai_message_queue', JSON.stringify(queue));
```

### Reconnection Behavior

When connection restored:
1. Offline banner dismissed
2. Queued messages sent in order
3. Success/failure feedback shown for each

---

## Network Error Recovery

### Retry Strategy

The widget uses exponential backoff for failed requests:

| Attempt | Delay |
|---------|-------|
| 1 | 1 second |
| 2 | 2 seconds |
| 3 | 4 seconds |
| 4 | 8 seconds |
| 5 | Give up, show error |

### Error States

| Error | User Message | Recovery Action |
|-------|--------------|-----------------|
| Network timeout | "Connection timed out. Retrying..." | Auto-retry |
| Server error (5xx) | "Service temporarily unavailable" | Auto-retry |
| Rate limited (429) | "Too many messages. Please wait." | Show countdown |
| Auth error (401) | "Session expired. Please refresh." | Prompt refresh |
| Invalid token (403) | "Widget configuration error" | Contact support |

### User Actions

Users can:
- Click "Retry" to manually retry failed messages
- Refresh the page to reset session
- Contact business via alternative methods shown in error state

---

## Diagnostic Tools

### Console Diagnostics

```javascript
// Full diagnostic output
window.TreasureCoastAI.getDiagnostics();

// Returns:
{
  version: "1.0.0",
  clientId: "...",
  botId: "...",
  online: true,
  sessionActive: true,
  queuedMessages: 0,
  lastError: null,
  cspViolations: []
}
```

### Network Health Check

```javascript
// Test API connectivity
window.TreasureCoastAI.testConnection().then(result => {
  console.log('API reachable:', result.success);
  console.log('Latency:', result.latency + 'ms');
});
```

### CSP Violation Listener

```javascript
// Monitor CSP violations
document.addEventListener('securitypolicyviolation', (e) => {
  console.log('CSP Violation:', {
    blockedURI: e.blockedURI,
    violatedDirective: e.violatedDirective,
    originalPolicy: e.originalPolicy
  });
});
```

---

## Troubleshooting Flowchart

```
Widget not loading?
├── Check Console for errors
│   ├── CSP error? → Update CSP headers
│   ├── CORS error? → Check domain whitelist
│   ├── Mixed content? → Use HTTPS URLs
│   └── 404 error? → Verify embed URL
│
├── Widget loads but won't send messages?
│   ├── Check Network tab for API calls
│   ├── 401/403? → Token issue, regenerate
│   ├── 429? → Rate limited, wait
│   └── 5xx? → Server issue, retry later
│
└── Messages send but no response?
    ├── Check AI bot configuration
    ├── Verify OpenAI API key is valid
    └── Check bot is not paused
```

---

## Customer Support Template

When helping customers with embed issues, gather:

```
1. Website URL where widget is embedded: _______________
2. Browser and version: _______________
3. Error messages from Console (screenshot): _______________
4. Network request failures (screenshot): _______________
5. CSP header value (if applicable): _______________
6. Widget version (run TreasureCoastAI.version): _______________
7. Diagnostics output (run TreasureCoastAI.getDiagnostics()): _______________
```

---

## Quick Reference

### CSP Header to Add
```
script-src https://app.treasurecoastai.com; connect-src https://app.treasurecoastai.com;
```

### Test Connection Command
```javascript
window.TreasureCoastAI.testConnection()
```

### Force Retry Queued Messages
```javascript
window.TreasureCoastAI.retryQueue()
```

### Clear Local Session
```javascript
window.TreasureCoastAI.resetSession()
```

---

*Last Updated: December 2025*
*Version: 1.0*

# Widget Embed Troubleshooting Guide

## Quick Checklist

Before troubleshooting, verify:
- [ ] Widget token is valid and not expired
- [ ] Client ID and Bot ID are correct
- [ ] Domain is in the allowed domains list (if domain validation is enabled)
- [ ] No JavaScript errors in browser console

## Common Issues

### 1. Widget Not Appearing

**Symptoms:** Chat bubble doesn't show on the page

**Possible Causes:**
- Embed code not added correctly
- JavaScript errors blocking execution
- Z-index conflicts with other elements
- CSS hiding the widget

**Solutions:**
1. Check browser console for errors (F12 → Console tab)
2. Verify embed code is placed before closing `</body>` tag
3. Ensure `data-client-id` and `data-bot-id` are correct
4. Check if another element has higher z-index (widget uses 2147483646)

### 2. Widget Shows But Won't Open

**Symptoms:** Bubble appears but clicking does nothing

**Possible Causes:**
- Token authentication failure
- API endpoint unreachable
- Cross-origin (CORS) issues

**Solutions:**
1. Check Network tab for failed requests
2. Verify token is valid using the diagnostics panel
3. Ensure API URL is accessible from the client's domain

### 3. Messages Not Sending

**Symptoms:** Widget opens but messages fail to send

**Possible Causes:**
- Invalid or expired session
- Bot not configured properly
- Rate limiting activated

**Solutions:**
1. Check for 429 (rate limit) or 401 (auth) errors in Network tab
2. Verify bot is active and has valid configuration
3. Try clearing session and refreshing

### 4. Styling Issues

**Symptoms:** Widget looks broken or doesn't match preview

**Possible Causes:**
- CSS conflicts with host page
- Theme settings not loading
- Custom CSS overrides

**Solutions:**
1. Widget uses iframe isolation - check if iframe loads correctly
2. Verify widget settings are saved
3. Check if `!important` CSS rules on host page affect the bubble

## Diagnostics

### Browser Console Commands

Run these in the browser console to get diagnostic info:

```javascript
// Check if widget loaded
console.log(window.TreasureCoastAI);

// Get full diagnostics
console.log(window.TreasureCoastAI.getDiagnostics());

// Check widget version
console.log(window.TreasureCoastAI.version);

// Manually open/close widget
window.TreasureCoastAI.open();
window.TreasureCoastAI.close();
```

### Network Requests to Check

| Endpoint | Purpose | Common Issues |
|----------|---------|---------------|
| `/widget/embed.js` | Widget script | 404 = wrong URL |
| `/api/widget/full-config/:token` | Configuration | 401 = bad token |
| `/api/widget-chat` | Chat messages | 429 = rate limited |

## Embed Code Reference

### Minimal Embed

```html
<script
  src="https://your-domain.com/widget/embed.js"
  data-client-id="YOUR_CLIENT_ID"
  data-bot-id="YOUR_BOT_ID"
  data-token="YOUR_WIDGET_TOKEN">
</script>
```

### Full Configuration

```html
<script
  src="https://your-domain.com/widget/embed.js"
  data-client-id="YOUR_CLIENT_ID"
  data-bot-id="YOUR_BOT_ID"
  data-token="YOUR_WIDGET_TOKEN"
  data-primary-color="#00E5CC"
  data-position="bottom-right"
  data-theme="dark"
  data-greeting="Hi! How can I help you?"
  data-business-name="Your Business"
  data-business-type="general"
  data-show-greeting-popup="true"
  data-greeting-delay="3">
</script>
```

### Data Attributes

| Attribute | Required | Default | Description |
|-----------|----------|---------|-------------|
| `data-client-id` | Yes | - | Workspace/client slug |
| `data-bot-id` | Yes | - | Bot identifier |
| `data-token` | Yes* | - | HMAC-signed widget token |
| `data-primary-color` | No | #2563eb | Accent color (hex) |
| `data-position` | No | bottom-right | bottom-right or bottom-left |
| `data-theme` | No | dark | light, dark, or auto |
| `data-greeting` | No | Hi! How can I help? | Initial bot message |
| `data-business-name` | No | - | Business display name |
| `data-business-type` | No | general | Icon style hint |

*Token required if bot has `requireEmbedAuth` enabled

## Domain Validation

If domain validation is enabled for the bot:

1. The widget will only load on whitelisted domains
2. Add domains in Bot Settings → Security → Allowed Domains
3. Include both `www` and non-www versions if needed
4. Localhost is typically allowed for development

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2025-12-13 | Initial versioned release with diagnostics |

## Getting Help

1. Check browser console for specific error messages
2. Use `getDiagnostics()` to gather system info
3. Include version number when reporting issues
4. Provide: client ID, browser, URL where widget is embedded

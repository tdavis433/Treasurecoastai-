# AI Behavior Presets

This document describes the behavior presets available for configuring AI assistant behavior in Treasure Coast AI.

## Overview

Behavior presets control how the AI assistant interacts with visitors, particularly around lead capture, sales behavior, and support focus. These settings are configured per-client in the Super Admin dashboard under the Settings tab.

## Available Presets

### 1. Support + Lead Focused (Default)
**Key:** `support_lead_focused`

The balanced default preset. Provides helpful support while proactively capturing leads.

**Behavior:**
- Answers questions directly and helpfully
- Maximum 1 clarifying question before providing value
- Proactively offers callback/contact when uncertain
- Gentle lead capture prompts after providing value

### 2. Sales Focused (Soft)
**Key:** `sales_focused_soft`

Gently guides conversations toward booking or contact without pressure.

**Behavior:**
- Provides value first, then suggests next steps
- Soft CTAs woven naturally into responses
- Emphasizes benefits and scheduling opportunities
- Non-aggressive approach to contact collection

### 3. Support Only
**Key:** `support_only`

Pure support mode with no lead collection prompts.

**Behavior:**
- Focuses entirely on answering questions
- No proactive lead capture attempts
- No sales language or booking suggestions
- Best for information-only use cases

### 4. Compliance Strict
**Key:** `compliance_strict`

Strict compliance mode with minimal deviation from configured knowledge.

**Behavior:**
- Sticks strictly to provided FAQs and knowledge base
- Minimal creative responses
- Disclaimers when uncertain
- Best for regulated industries

### 5. Sales Heavy
**Key:** `sales_heavy`

Aggressive sales focus for maximum conversion.

**Behavior:**
- Strong CTAs in every response
- Persistent booking/contact suggestions
- Urgency and scarcity language
- Best for sales-focused campaigns

## Additional Settings

### Lead Capture Enabled
Toggle to enable/disable automatic lead detection and collection. When disabled, the AI will not attempt to collect contact information.

### Lead Detection Sensitivity
Controls how aggressively the AI detects lead intent in conversations:

- **Low:** Only explicit requests like "I want to schedule" or "Can someone call me?"
- **Medium (Default):** Balanced detection including implied intent
- **High:** Proactive detection of any potential interest

## Configuration

Settings are managed via the Super Admin dashboard:

1. Navigate to `/super-admin/clients/:slug`
2. Click the "Settings" tab
3. Find the "AI Behavior Settings" card
4. Adjust preset and toggles as needed
5. Changes save automatically on each selection change

**Note:** Controls are disabled while a save is in progress to prevent double-clicks.

## API Reference

**Authentication Required:** All endpoints require super_admin role authentication.

### Get Behavior Settings
```
GET /api/super-admin/clients/:clientId/behavior
Authorization: session cookie with super_admin role

Response 200:
{
  "behaviorPreset": "support_lead_focused",
  "leadCaptureEnabled": true,
  "leadDetectionSensitivity": "medium",
  "fallbackLeadCaptureEnabled": true
}
```

### Update Behavior Settings
```
PATCH /api/super-admin/clients/:clientId/behavior
Authorization: session cookie with super_admin role

Body (all fields optional):
{
  "behaviorPreset": "support_lead_focused",
  "leadCaptureEnabled": true,
  "leadDetectionSensitivity": "medium"
}

Response 200:
{
  "success": true,
  "behaviorPreset": "...",
  "leadCaptureEnabled": true,
  "leadDetectionSensitivity": "..."
}

Response 400: Invalid preset or sensitivity value
Response 401: Unauthorized (not super_admin)
Response 404: Client not found
```

### Widget Config
The widget config endpoint includes behavior settings (public endpoint, no auth required):
```
GET /api/widget/config/:clientId/:botId

Response includes:
- behaviorPreset (default: 'support_lead_focused')
- leadCaptureEnabled (default: true)
- leadDetectionSensitivity (default: 'medium')
```

**Failsafe Behavior:** If client settings cannot be loaded, defaults are used to ensure the widget always functions.

## Technical Implementation

- Schema: `shared/schema.ts` - BehaviorPreset type and BEHAVIOR_PRESETS constant
- Orchestrator: `server/botConfig.ts` - buildBehaviorPresetRules()
- Settings API: `server/routes.ts` - GET/PATCH endpoints
- Admin UI: `client/src/pages/client-detail-admin.tsx` - Settings tab

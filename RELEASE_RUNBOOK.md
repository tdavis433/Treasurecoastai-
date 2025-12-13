# Treasure Coast AI - Release Runbook

**Version:** 1.2  
**Last Updated:** December 13, 2025  
**Policy:** NO PAYMENT PROCESSING (redirect-only booking)

---

## PRE-DEMO / PRE-DEPLOY QUICK VERIFY (REPLIT)

```bash
bash ./scripts/guard-no-payments.sh
npx tsc --noEmit
npx vitest run
npm run build

# Optional DB schema check (if psql available)
psql "$DATABASE_URL" -f scripts/verify-db-schema.sql
```

---

## Safe Demo Path (Quick Smoke Test)

Before any demo or deployment, run this 5-step verification:

1. **Login Check:** `/login` → admin / [password] → Dashboard loads
2. **Widget Check:** Assistants → Any bot → Preview → Widget loads
3. **Chat Check:** Ask "What services do you offer?" → AI responds
4. **Lead Check:** Leads section shows existing leads
5. **Redirect Check:** Trigger booking → "Book Now" redirects EXTERNALLY (not our domain)

**If any step fails, do not proceed with demo/deploy.**

---

## Pre-Release Checklist

### 1. Environment Configuration

**Required Environment Variables:**

```bash
DATABASE_URL=            # PostgreSQL connection string (Neon)
OPENAI_API_KEY=          # OpenAI API key
DEFAULT_ADMIN_PASSWORD=  # Super admin initial password
WIDGET_TOKEN_SECRET=     # Secret for signing widget tokens (must be strong)
```

**Optional Environment Variables:**

```bash
SMTP_HOST=               # Email server host
SMTP_USER=               # Email server username
SMTP_PASS=               # Email server password
```

**IMPORTANT:** Payments are NOT supported by design.  
Do NOT add payment provider keys or payment processing logic.

**Security notes:**
- Rotate DEFAULT_ADMIN_PASSWORD + demo passwords before any public demo.
- Never log tokens/passwords. Redact secrets in logs.

---

### 2. Database Setup (Drizzle)

**Primary sync command:**

```bash
npm run db:push
```

**Expected:**
- db:push completes cleanly and does not require destructive changes.

**If db:push becomes interactive:**
- STOP and inspect what it wants to change.
- Do NOT accept destructive operations unless you confirm:
  1. No data loss
  2. No dropping critical constraints/indexes
  3. No cross-tenant risk

---

### 3. CRITICAL: NO --force on Production Database

**⚠️ HARD RULE: `db:push --force` is ONLY allowed on disposable dev databases.**

**Before ANY destructive database operation:**
1. [ ] Confirm you are NOT on production database
2. [ ] Take a full database backup
3. [ ] Document rollback plan
4. [ ] Get explicit approval if production-adjacent

**If you must use --force:**
```bash
# ONLY on development/disposable DBs
# Verify DATABASE_URL is NOT production first!
echo $DATABASE_URL  # Confirm it's dev
npm run db:push --force
```

---

### 4. Database Drift Prevention (IMPORTANT)

#### A) Schema Verification Script

Run before every deployment:

```bash
# Verify database schema matches expectations
psql "$DATABASE_URL" -f scripts/verify-db-schema.sql
```

Or run individual checks:

```sql
-- Check client_settings.metadata column
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'client_settings'
  AND column_name = 'metadata';
-- Expected: data_type = jsonb, is_nullable = NO, default contains {}
```

#### B) Required Constraint Names (Drizzle alignment)

These constraints must exist with exact names:

| Table | Constraint Name |
|-------|-----------------|
| bot_templates | bot_templates_template_id_unique |
| session_states | session_states_session_id_unique |
| widget_settings | widget_settings_bot_id_unique |
| flow_sessions | flow_sessions_conversation_id_unique |
| bot_requests | bot_requests_dedupe_hash_unique |

#### C) Verification Commands

```sql
-- Check all unique constraints
SELECT conname, pg_get_constraintdef(c.oid) AS def, t.relname AS table_name
FROM pg_constraint c
JOIN pg_class t ON c.conrelid = t.oid
WHERE t.relnamespace = 'public'::regnamespace
  AND c.contype = 'u'
ORDER BY table_name, conname;

-- Check all indexes
SELECT indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
```

---

### 5. No-Payments Guard

**Automated Check (run before deploy):**

```bash
npm run guard:no-payments
```

This script scans for forbidden payment keywords:
- stripe, square, paypal
- checkout, payment_intent, client_secret
- chargeback, refund, subscription, billing

**E2E Redirect Assertion:**

The test suite verifies:
- "Book Now" redirect target is EXTERNAL (not our domain)
- No checkout/payment UI exists on our domain

```bash
npm run test:e2e
```

---

### 6. Build Verification

```bash
# TypeScript compilation check
npx tsc --noEmit
# Expected: 0 errors

# Full verification suite
bash ./scripts/guard-no-payments.sh   # No payment keywords
npx vitest run                        # Unit + integration tests (68 tests)
npm run build                         # Production build

# Optional: Database schema verification (requires psql)
# psql "$DATABASE_URL" -f scripts/verify-db-schema.sql
```

**Note:** E2E testing uses the Replit Agent `run_test` tool (Playwright-based). E2E may not be runnable via `npm run test:e2e` unless Playwright is configured locally.

---

## Replit Environment Note: Verification Commands

In this Replit environment, `package.json` scripts may be restricted/immutable.
For consistent verification, use the direct commands below (source of truth), even if `npm run check` exists.

```bash
# TypeScript compilation check (source of truth)
npx tsc --noEmit

# Unit + integration tests
npx vitest run

# No-payments guard
bash ./scripts/guard-no-payments.sh

# Production build
npm run build

# Optional: Database schema verification (requires psql)
psql "$DATABASE_URL" -f scripts/verify-db-schema.sql
```

---

## Deployment Steps

### Step 1: Pre-Deployment Verification

- [ ] All required environment variables configured
- [ ] Database connection verified
- [ ] `npm run db:push` completes cleanly (NO --force on prod!)
- [ ] `npm run guard:no-payments` passes
- [ ] TypeScript builds with 0 errors
- [ ] E2E tests passing (see TEST_REPORT.md)

### Step 2: Deploy Application

1. Click "Deploy" / "Publish" in Replit
2. Wait for deployment to complete
3. Verify deployment URL is accessible

### Step 3: Post-Deployment Smoke Test (DEMO-CRITICAL)

Run this exact flow after deploy:

**1) Public landing page loads**
- [ ] No console errors
- [ ] Widget button visible

**2) Widget chat works**
- [ ] Ask: "What services do you offer?"
- [ ] Ask typo: "wht time yall close?"
- [ ] Confirm assistant responds

**3) Lead capture**
- [ ] Trigger contact flow and submit a test lead
- [ ] Confirm lead appears in dashboards

**4) Booking redirect (redirect-only, NO PAYMENTS)**
- [ ] Trigger booking intent
- [ ] Click "Book Now"
- [ ] Confirm redirect goes to the client's EXTERNAL booking/payment platform
- [ ] Confirm there is NO checkout/payment UI on our domain

**5) Dashboard parity**
- [ ] Admin sees the same lead/convo/booking intent counts as client for that workspace

---

## Default Accounts

| Account Type | Username | Default Password | Notes |
|--------------|----------|------------------|-------|
| Super Admin | admin | Set via DEFAULT_ADMIN_PASSWORD | Full platform access |
| Demo Client | demo_faith_house | demo123 (rotate before public demos) | Demo-only |

**Recommendation:** Rotate demo credentials before public demos to prevent reuse.

---

## Critical Paths to Verify

### 1. Authentication Flow
- Navigate to /login
- Login as admin
- Verify dashboard loads
- Logout then back-button test (no protected pages should load)

### 2. Client Dashboard
- Login as demo client
- Verify:
  - Overview metrics
  - Conversations transcript viewer shows full messages
  - Leads/Bookings visible and correctly tenant-scoped

### 3. Widget Integration
- Generate widget embed code from admin
- Verify widget loads on demo page
- Test conversation + lead + booking redirect

### 4. Preview Link (Sales Demo)
- Navigate to Agency Console → Onboarding
- Click "Generate Preview Link (24h)" for a workspace
- Verify link is generated with expiry time
- Open link in new browser → Preview page loads
- Verify expiry banner displays countdown
- Click wow buttons → Widget opens with message
- Test that expired tokens show "Preview Link Expired" message

---

## Preview Link Feature

### Overview

The Preview Link feature allows agencies to generate time-limited (24-hour) branded preview pages for sales prospects. Prospects can test the AI assistant without full account onboarding.

### How It Works

1. **Token Generation:** HMAC-SHA256 signed tokens with 24h TTL
2. **Public Route:** `/preview/:workspaceSlug?t=<token>`
3. **Branded Page:** Shows business name, logo, primary color
4. **Wow Buttons:** Pre-configured prompts to demo AI capabilities
5. **Expiry Banner:** Live countdown showing time remaining
6. **Widget Integration:** Fully functional chat widget on preview page

### Security

- Tokens are HMAC-signed using derived secret from `WIDGET_TOKEN_SECRET`
- Tokens include workspace/bot binding (cannot be reused across workspaces)
- Expired tokens show friendly "Preview Link Expired" message
- No authentication required for preview (by design - it's for prospects)

### API Endpoints

**Generate Preview Token (Admin Only):**
```
POST /api/admin/preview-link
Authorization: Super Admin required

Request:
{
  "workspaceSlug": "demo_workspace",
  "botId": "bot_123"
}

Response:
{
  "success": true,
  "previewUrl": "https://domain.com/preview/demo_workspace?t=...",
  "expiresAt": "2025-12-14T10:00:00.000Z",
  "expiresIn": 86400
}
```

**Fetch Preview Data (Public):**
```
GET /api/preview/:workspaceSlug?t=<token>

Response:
{
  "success": true,
  "preview": { ... },
  "widget": { ... },
  "wowButtons": [ ... ],
  "expiry": { ... }
}
```

### Testing

Unit tests in `tests/unit/previewToken.test.ts` cover:
- Token generation and structure
- Signature verification
- Expiry handling
- Workspace/bot mismatch rejection

---

## NO PAYMENTS POLICY (HARD GUARDRAIL)

**This platform must NOT process payments.**

**Allowed:**
- Track booking intent and booking redirect events internally
- Redirect users externally to the client's booking/payment provider
- Store external booking URL in client settings

**Not allowed:**
- Any payment provider integrations (Stripe/Square/PayPal/etc)
- Checkout UI on our domain
- Payment intents/tokens
- Refunds/chargebacks/subscriptions/invoices
- Payment-related webhooks

---

## Rollback Procedure

### Option 1: Replit Checkpoint
1. Go to "Version Control" in Replit
2. Select previous working checkpoint
3. Click "Restore"

### Option 2: Git Rollback
```bash
git log --oneline -10
git checkout [commit-hash]
```

---

## Troubleshooting

### Issue: Login not working
1. Check DEFAULT_ADMIN_PASSWORD is set
2. Verify DATABASE_URL connectivity
3. Check server logs for auth errors

### Issue: Widget not loading
1. Verify WIDGET_TOKEN_SECRET is set
2. Confirm embed config / allowlist settings
3. Inspect browser console + network calls

### Issue: AI not responding / "high demand"
1. Verify OPENAI_API_KEY is set and valid
2. Check server logs for upstream errors
3. Confirm fallback behavior is friendly and does not break lead/booking flows

### Issue: Booking not redirecting
1. Verify external booking URL is configured for the client/workspace
2. Confirm Book Now logs intent + redirect event
3. Confirm redirect destination is external (not your domain)

### Issue: Database errors / schema drift
1. Run `npm run db:push` (NOT --force on prod!)
2. If interactive prompts appear, inspect carefully and confirm no destructive changes
3. Run `psql "$DATABASE_URL" -f scripts/verify-db-schema.sql`
4. Verify DB constraints and column parity (see Drift Prevention section)

### Issue: guard:no-payments fails
1. Search codebase for flagged keyword
2. Remove payment-related code
3. Re-run guard script

---

## Client Website Embed Instructions

### Quick Start

1. **Get your embed snippet** from the Admin Dashboard → Assistants → Your Bot → Integration Panel
2. **Paste the snippet** in your website HTML, just before the closing `</body>` tag:

```html
<script
  src="https://your-domain.com/widget/embed.js"
  data-client-id="your_client_id"
  data-bot-id="your_bot_id"
  data-primary-color="#00E5CC"
  data-business-name="Your Business"
></script>
</body>
```

### Verification Steps

1. **Open in Incognito/Private window** (clears cache and cookies)
2. **Check for the chat bubble** in the bottom-right corner
3. **Click the bubble** and send a test message
4. **Verify AI responds** with relevant information

### Common Troubleshooting

| Issue | Solution |
|-------|----------|
| Widget not appearing | Hard refresh (Ctrl+Shift+R / Cmd+Shift+R), check for JavaScript errors in browser console (F12) |
| Widget blocked | Disable ad blockers temporarily; check if your site's CSP allows the widget origin |
| "Something went wrong" error | Check internet connection, try clicking Retry button, verify bot is not paused |
| Booking button not working | Verify external booking URL is configured and uses HTTPS. If URL is invalid, widget shows fallback CTA with contact info. |

### Security Notes

- The embed snippet contains **no secrets** - only public identifiers (clientId, botId) and styling
- Widget uses **token-based auth** - no third-party cookies required
- All assets served over **HTTPS only**
- Booking links validated to **HTTPS only** (blocks javascript:, data:, file: schemes)
- **Fallback CTA:** If booking URL is invalid/missing, widget shows a friendly fallback message with business contact info (phone/email) or a prompt to share contact info

---

## Uptime Monitoring Setup (UptimeRobot / Pingdom)

### Public Health Endpoint

For external uptime monitoring services like UptimeRobot or Pingdom, use the **public** health endpoint:

```
GET /api/health
```

**Response (healthy):**
```json
{
  "ok": true,
  "timestamp": "2025-12-13T10:00:00.000Z",
  "db": { "ok": true, "latencyMs": 15 },
  "ai": { "configured": true },
  "testModeAllowed": false,
  "build": { "env": "production", "version": "1.0.0", "uptime": 86400 }
}
```

**UptimeRobot Configuration:**
- Monitor Type: HTTP(s)
- URL: `https://your-domain.replit.app/api/health`
- Keyword Monitoring: Check for `"ok":true`
- Interval: 5 minutes (recommended)
- Alert Contacts: Configure as needed

**Alerting on Degraded State:**
- The endpoint returns `ok: false` if database is down OR >50 errors in last 15 minutes
- UptimeRobot should alert when keyword `"ok":true` is NOT found

### Daily Self-Check Script

For CI/CD pipelines or cron jobs, use the daily self-check script:

```bash
# Required environment variables
export BASE_URL="https://your-domain.replit.app"
export DEMO_CLIENT_ID="demo_faith_house"
export DEMO_BOT_ID="faith_house_bot"

# Run self-check
bash ./scripts/daily-self-check.sh
```

**Exit codes:**
- `0` = All checks passed
- `1` = One or more checks failed

**Optional env vars:**
- `TIMEOUT_SECONDS` - Request timeout (default: 15)
- `VERBOSE=true` - Enable detailed output

### Super Admin Internal Health Check

For detailed diagnostics (requires super admin login), use the internal endpoint:

```
GET /api/health/internal
```

This includes:
- Error breakdown by category (chat, widget, lead, booking, auth, db)
- Last error timestamps
- Demo workspace readiness status

Access via: Super Admin Dashboard → System Logs → "Run Self-Check" button

---

## Website Import Feature (Admin Only)

### Overview

The Website Import feature allows admins to automatically extract business information from a client's website, including:
- **Services** - Business services with descriptions and pricing
- **FAQs** - Frequently asked questions and answers
- **Contact Info** - Phone, email, address, business hours
- **Booking Links** - External booking platform URLs (Calendly, Acuity, OpenTable, etc.)
- **Social Links** - Social media profile URLs
- **Policies** - Privacy policy, terms of service, cancellation policy

### How to Use

1. Navigate to **Agency Console** → **Onboarding** or **Clients** → **Edit Client**
2. Enter the client's website URL in the "Website URL" field
3. Click **"Scan Website"** to initiate the import
4. Review the extracted suggestions organized by category
5. Select desired items and click **"Apply Selected"** to merge into client settings

### Security Features

- **HTTPS-only booking links** - Blocks javascript:, data:, file: protocols
- **Payment URL blocking** - Booking links to payment processors (Stripe, PayPal, etc.) are blocked
- **Same-domain crawling** - Multi-page crawl stays within the target domain
- **Rate limiting** - API endpoint is rate-limited to prevent abuse

### Merge Behavior

- **Services/FAQs:** Deduplicated against existing data (Jaccard similarity threshold: 0.7 for services, 0.6 for FAQs)
- **Contact Info:** Fill-only mode - existing values are never overwritten
- **Policies:** Categorized and deduplicated by type
- **Provenance Tracking:** All imported data is tracked in `client_settings.metadata.sources.websiteScan`

### Booking Provider Detection

The following booking platforms are automatically detected:
- Calendly, Acuity Scheduling, Booksy, Vagaro
- Square Appointments, OpenTable, Resy
- ZocDoc, Schedulicity, Mindbody
- Fresha, GlossGenius, Jane App, and more

### Social Platform Detection

Detected platforms: Facebook, Instagram, Twitter/X, LinkedIn, YouTube, TikTok, Pinterest, Yelp, Google Maps, TripAdvisor, Nextdoor

### API Endpoint

```
POST /api/admin/website-import
Authorization: Super Admin required

Request:
{
  "url": "https://example.com",
  "maxPages": 5  // optional, default 5, max 10
}

Response:
{
  "success": true,
  "data": {
    "services": [...],
    "faqs": [...],
    "contact": [...],
    "bookingLinks": [...],
    "socialLinks": [...],
    "policies": [...],
    "sourceUrls": [...]
  }
}
```

### Test Coverage

- **URL Validation Tests:** 34 tests covering security, protocol validation, provider detection
- **Merge Engine Tests:** 22 tests covering deduplication, normalization, merge behavior

---

## AI Behavior Presets

### Overview

Behavior presets control how the AI assistant interacts with visitors around lead capture, sales behavior, and support focus. Settings are configured per-client in the Super Admin dashboard.

### Available Presets

| Preset | Key | Description |
|--------|-----|-------------|
| Support + Lead Focused | `support_lead_focused` | Balanced default - helpful support with proactive lead capture |
| Sales Focused (Soft) | `sales_focused_soft` | Gently guides toward booking/contact without pressure |
| Support Only | `support_only` | Pure support mode - no lead collection prompts |
| Compliance Strict | `compliance_strict` | Strict compliance with minimal deviation from knowledge base |
| Sales Heavy | `sales_heavy` | Aggressive sales focus for maximum conversion |

### Configuration

1. Navigate to `/super-admin/clients/:slug`
2. Click "Settings" tab
3. Adjust in "AI Behavior Settings" card

### API Endpoints

```bash
# Get behavior settings (requires super_admin auth)
GET /api/super-admin/clients/:clientId/behavior

# Update behavior settings (requires super_admin auth)
PATCH /api/super-admin/clients/:clientId/behavior
```

**Widget Failsafe:** Widget config endpoint includes behavior settings with safe defaults if client settings unavailable.

See `BEHAVIOR_PRESETS.md` for full documentation.

---

## Release Notes

### Version 1.2 (December 2025)

**Features:**
- Agency-first AI assistant platform
- Multi-tenant client management
- AI-powered conversations
- Lead capture + booking intent tracking
- Redirect-only external booking (no payment processing)
- Customizable chat widgets
- Real-time analytics
- **AI Behavior Presets** - Configurable AI personality per client

**Known Limitations:**
- Email features require SMTP setup
- Widget embedding may require domain configuration depending on allowlist/security settings
- Payments are not supported by design

---

*END OF RUNBOOK*

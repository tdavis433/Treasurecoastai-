# Treasure Coast AI - Release Runbook

**Version:** 1.2  
**Last Updated:** December 13, 2025  
**Policy:** NO PAYMENT PROCESSING (redirect-only booking)

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
npm run guard:no-payments  # No payment keywords
npm test                   # Unit tests
npm run test:e2e           # E2E tests (includes redirect check)
npm run build              # Production build
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

**Known Limitations:**
- Email features require SMTP setup
- Widget embedding may require domain configuration depending on allowlist/security settings
- Payments are not supported by design

---

*END OF RUNBOOK*

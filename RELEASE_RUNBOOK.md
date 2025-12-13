# Treasure Coast AI - Release Runbook

**Version:** 1.1  
**Last Updated:** December 13, 2025  
**Policy:** NO PAYMENT PROCESSING (redirect-only booking)

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
Do NOT add Stripe/Square/PayPal keys or payment processing logic.

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

**NOTE:** Use `--force` ONLY if you fully understand the operation and have a rollback plan.  
(Prefer avoiding force in production.)

---

### 3. Database Drift Prevention Notes (IMPORTANT)

#### A) client_settings.metadata must exist and match schema

**Expected in DB:**
```
client_settings.metadata is jsonb NOT NULL DEFAULT '{}'::jsonb
```

**Verification query:**
```sql
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'client_settings'
  AND column_name = 'metadata';
```

**Expected:**
- data_type = jsonb
- is_nullable = NO
- default contains {} / '{}'

#### B) Constraint naming alignment (Drizzle expected names)

**Constraint fixes applied to match Drizzle naming conventions:**
- `bot_templates_template_id_key` → `bot_templates_template_id_unique`
- `session_states_session_id_key` → `session_states_session_id_unique`
- `widget_settings_bot_id_key` → `widget_settings_bot_id_unique`
- `flow_sessions_conversation_id_key` → `flow_sessions_conversation_id_unique`

**Additional DB fix:**
- Fixed duplicate/null values in `bot_requests.dedupe_hash`
- Converted index to a proper constraint (to prevent drift and ensure consistent uniqueness behavior)

**Verification (indexes/constraints):**
```sql
SELECT indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

SELECT conname, pg_get_constraintdef(c.oid) AS def, t.relname AS table_name
FROM pg_constraint c
JOIN pg_class t ON c.conrelid = t.oid
WHERE t.relnamespace = 'public'::regnamespace
ORDER BY table_name, conname;
```

---

### 4. Build Verification

```bash
# TypeScript compilation check
npx tsc --noEmit
# Expected: 0 errors

# Recommended full verification
npm test
npm run test:e2e
npm run build
```

---

## Deployment Steps

### Step 1: Pre-Deployment Verification

- [ ] All required environment variables configured
- [ ] Database connection verified
- [ ] `npm run db:push` completes cleanly
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

**Not allowed:**
- Stripe/Square/PayPal integrations
- Checkout UI
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
1. Run `npm run db:push`
2. If interactive prompts appear, inspect carefully and confirm no destructive changes
3. Verify DB constraints and column parity (see Drift Prevention section)

---

## Release Notes

### Version 1.1 (December 2025)

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

---

*END OF RUNBOOK*

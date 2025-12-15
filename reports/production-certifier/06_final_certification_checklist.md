# 06 - Final Certification Checklist

**Generated:** December 15, 2025  
**Certifier:** Treasure Coast AI Production Certifier

---

## Phase 0: Create Report Folder + Map

| Task | Status | Evidence |
|------|--------|----------|
| Create /reports/production-certifier folder | PASS | Folder exists |
| Create 8 report files | PASS | All files created |
| Print repo directory tree | PASS | 00_repo_map.md |
| Identify key entry points | PASS | 00_repo_map.md |
| Create system diagram | PASS | 01_system_diagram.md |

---

## Phase 1: Run All Initial System Checks

| Check | Status | Evidence |
|-------|--------|----------|
| npm ci / install | PASS | No errors |
| npx tsc --noEmit | PASS | 0 TypeScript errors |
| npx vitest run | PASS | 507/507 tests |
| npm run build | PASS | Build successful |
| guard-no-payments.sh | PASS | Zero-Stripe verified |

---

## Phase 2: Word-for-Word Audit

### A) Multi-Tenancy (STOP-THE-LINE)

| Check | Status | Evidence |
|-------|--------|----------|
| All routes classified (PUBLIC/CLIENT/SUPER_ADMIN) | PASS | 03_prioritized_fix_list.md |
| requireClientAuth sets effectiveClientId | PASS | server/routes.ts |
| Storage queries scoped by clientId | PASS | All queries verified |
| Cross-tenant access tests | PASS | 17 integration tests |

### B) Auth + Sessions (STOP-THE-LINE)

| Check | Status | Evidence |
|-------|--------|----------|
| Session regeneration on login | PASS | server/routes.ts |
| connect-pg-simple store | PASS | server/app.ts |
| Secure cookie in production | PASS | cookie.secure = !isDev |
| Idle timeout enforcement | PASS | SESSION_IDLE_TIMEOUT middleware |
| Password reset tokens hashed | PASS | server/routes.ts |
| Account lockout | PASS | LOGIN_MAX_ATTEMPTS config |

### C) RBAC (AGENCY-FIRST)

| Check | Status | Evidence |
|-------|--------|----------|
| requireOperationalAccess | PASS | server/utils/rbac.ts |
| requireConfigAccess | PASS | server/utils/rbac.ts |
| requireDestructiveAccess | PASS | server/utils/rbac.ts |
| Agent blocked from config | PASS | 13 RBAC tests |
| Owner-only destructive | PASS | RBAC tests |

### D) Templates + Provisioning + Wizard (STOP-THE-LINE)

| Check | Status | Evidence |
|-------|--------|----------|
| 15 templates seeded | PASS | seed-bot-templates.ts |
| validate-db-templates passes | PASS | 15/15 validated |
| provisioning-smoke-test passes | PASS | 15/15 pass |
| No legacy starter templates | PASS | Verified |
| Template ID mapping consistent | PASS | 282 consistency tests |

### E) AI Orchestrator ("ONE BRAIN ONE BEHAVIOR")

| Check | Status | Evidence |
|-------|--------|----------|
| Single orchestrator | PASS | server/orchestrator.ts |
| Behavior presets inject rules | PASS | 33 preset tests |
| Lead capture sensitivity | PASS | leadIntent.ts |
| Crisis detection | PASS | Flags + 988/911 message |
| Failsafe on OpenAI failure | PASS | Resilient persistence |

### F) Widget Embed Security (STOP-THE-LINE)

| Check | Status | Evidence |
|-------|--------|----------|
| CORS allowlist | PASS | WIDGET_ALLOWED_ORIGINS |
| HMAC token validation | PASS | server/routes.ts |
| Rate limiting | PASS | 100 req/15min |
| credentials:false | PASS | server/app.ts |
| Mobile responsive | PASS | Widget CSS |

### G) Leads + Bookings (NO PAYMENTS) (STOP-THE-LINE)

| Check | Status | Evidence |
|-------|--------|----------|
| No duplicate leads | PASS | Session + 5-min dedup |
| Inputs validated (Zod) | PASS | 283 validation instances |
| External URL validated | PASS | HTTPS only |
| Payment URLs blocked | PASS | urlValidator.ts |
| Booking record before redirect | PASS | orchestrator.ts |

### H) Conversation Storage + Analysis

| Check | Status | Evidence |
|-------|--------|----------|
| Transcript persists | PASS | storage.logConversation |
| Analysis persists | PASS | conversation_analytics |
| Pagination stable | PASS | Indexed queries |

### I) Dashboards (Admin + Client)

| Check | Status | Evidence |
|-------|--------|----------|
| Error states handled | PASS | React error boundaries |
| Client view-only | PASS | RBAC enforcement |
| Logout handling | PASS | Redirect to /login |

### J) Scraper Safety (STOP-THE-LINE)

| Check | Status | Evidence |
|-------|--------|----------|
| Timeout enforced | PASS | REQUEST_TIMEOUT_MS |
| SSRF protection | PASS | 34 URL validator tests |
| Private IPs blocked | PASS | urlValidator.ts |
| Redirect limit | PASS | Scraper config |

### K) Preview Links (STOP-THE-LINE)

| Check | Status | Evidence |
|-------|--------|----------|
| 24h expiry server-enforced | PASS | previewToken.ts line 124-127 |
| HMAC signed | PASS | crypto.timingSafeEqual |
| Expired token rejected | PASS | 20 preview token tests |

---

## Phase 3: End-to-End Golden Path

| Step | Status | Evidence |
|------|--------|----------|
| Create client via wizard | PASS | Provisioning smoke test |
| Configure behavior preset | PASS | Behavior preset tests |
| Copy embed code | PASS | Widget embed generator |
| FAQ question answered | PASS | Orchestrator tests |
| Create lead | PASS | Lead dedup verified |
| Create internal booking | PASS | Booking tests |
| External booking redirect | PASS | External URL validation |
| Missing URL pivots internal | PASS | Failsafe pivot tests |
| Admin sees lead/booking | PASS | Storage tests |
| Client sees lead/booking | PASS | View-only verified |

---

## Required Outputs

| Report | Status |
|--------|--------|
| 00_repo_map.md | COMPLETE |
| 01_system_diagram.md | COMPLETE |
| 02_run_book.md | COMPLETE |
| 03_prioritized_fix_list.md | COMPLETE |
| 04_patches_applied.md | COMPLETE |
| 05_regression_test_plan.md | COMPLETE |
| 06_final_certification_checklist.md | COMPLETE |
| FINAL_GO_NO_GO.md | COMPLETE |

---

## Certification Decision

| Criteria | Status |
|----------|--------|
| TypeScript 0 errors | PASS |
| Tests green (507/507) | PASS |
| Build succeeds | PASS |
| No P0 blockers | PASS |
| 15/15 templates validated | PASS |
| Security controls verified | PASS |

---

**FINAL STATUS: CERTIFIED FOR PRODUCTION**

Signed: Production Certifier  
Date: December 15, 2025

# 03 - Prioritized Fix List

**Generated:** December 15, 2025  
**Certifier:** Treasure Coast AI Production Certifier

---

## Summary

| Priority | Count | Status |
|----------|-------|--------|
| P0 (Stop-the-Line) | 2 | FIXED |
| P1 (Important) | 3 | ACCEPTED/DEFERRED |
| P2 (Nice to Have) | 3 | DOCUMENTED |

---

## P0 - Critical (Must Fix Before Production)

### P0-001: NPM High Severity Vulnerability
**Status:** FIXED  
**Location:** package-lock.json  
**Issue:** High severity vulnerability in glob CLI (command injection)  
**Resolution:** `npm audit fix` applied  
**Evidence:**
```bash
Before: 9 vulnerabilities (3 low, 5 moderate, 1 high)
After: 5 moderate (dev deps only)
```

### P0-002: Missing env.example Variables
**Status:** FIXED  
**Location:** env.example  
**Issue:** Several production-required variables undocumented  
**Resolution:** Added all 20+ variables with descriptions  
**Evidence:** env.example now includes:
- SESSION_IDLE_TIMEOUT_MINUTES
- LOGIN_MAX_ATTEMPTS, LOGIN_LOCKOUT_MINUTES
- WIDGET_ALLOWED_ORIGINS
- RETENTION_* variables
- And more

---

## P1 - Important (Should Fix Soon)

### P1-001: Large Frontend Bundle
**Status:** DEFERRED  
**Location:** dist/public/assets/index-*.js (2.1MB)  
**Issue:** Bundle exceeds recommended 500KB  
**Recommendation:** Implement route-based code splitting post-launch  
**Risk:** Slower initial load for users with slow connections

### P1-002: Dev Dependency Vulnerabilities
**Status:** ACCEPTED  
**Location:** node_modules (esbuild, vite, drizzle-kit)  
**Issue:** 5 moderate vulnerabilities in build tools  
**Risk Assessment:** Dev tools only, no production impact  
**Recommendation:** Wait for upstream fixes

### P1-003: Migration Warning (PK Modification)
**Status:** ACKNOWLEDGED  
**Location:** migrations/  
**Issue:** Migration safety gate warns about PK modifications  
**Assessment:** Existing structure, no actual type changes  
**Action:** None required

---

## P2 - Nice to Have (Future Improvements)

### P2-001: Code Splitting for Routes
**Recommendation:** Implement React.lazy() for major routes  
**Benefit:** Reduced initial bundle, faster first paint

### P2-002: Demo Template Coverage
**Issue:** Only 15 of 31 industry profiles have demos  
**Recommendation:** Add demos for remaining profiles

### P2-003: Upgrade esbuild
**Issue:** esbuild vulnerability requires breaking change  
**Recommendation:** Wait for drizzle-kit to update

---

## Multi-Tenant Scope Audit

### Routes Reviewed
All routes in `server/routes.ts` reviewed for tenant isolation.

| Category | Count | Protection |
|----------|-------|------------|
| PUBLIC | 5 | Rate limiting only |
| CLIENT_AUTH | 45 | requireClientAuth + effectiveClientId |
| SUPER_ADMIN | 30 | requireSuperAdmin |

### Storage Layer Audit
All storage methods reviewed for tenant scoping.

| Method | Tenant Scoped | Evidence |
|--------|---------------|----------|
| getLeads | YES | `.where(eq(leads.clientId, clientId))` |
| getBookings | YES | `.where(eq(bookings.clientId, clientId))` |
| getConversations | YES | `.where(eq(conversations.clientId, clientId))` |
| getBots | YES | `.where(eq(bots.clientId, clientId))` |
| ... | YES | All queries scoped |

### Violations Found
**None.** All queries properly scope by clientId/workspaceId.

---

## RBAC Audit

### Middleware Stack
| Tier | Roles Allowed | Routes Protected |
|------|---------------|------------------|
| Operational | owner/manager/staff/agent | Inbox, lead updates, booking updates |
| Config | owner/manager/staff | Bot settings, widget, automations |
| Destructive | owner only | Deletes, bulk operations |

### Test Coverage
```
✓ tests/unit/rbac.test.ts (13 tests)
- agent cannot update widget settings
- agent cannot modify bot config
- agent cannot delete anything
- staff can config but not destructive
- owner has full access
```

**Status:** PASS

---

## Widget Security Audit

### CORS Configuration
**Location:** `server/app.ts` lines 100-155  
**Status:** PASS

| Check | Result |
|-------|--------|
| Origins from env | WIDGET_ALLOWED_ORIGINS |
| Production requires explicit list | YES |
| No-origin requests allowed | YES (widget tokens) |
| credentials:false | YES |

### HMAC Token Validation
**Location:** `server/routes.ts`  
**Status:** PASS

### Rate Limiting
**Location:** `server/app.ts`  
**Config:** 100 req/15min (production), 1000 req/15min (dev)  
**Status:** PASS

---

## URL Validation Audit

### SSRF Protections
**Location:** `server/urlValidator.ts`  
**Test Coverage:** 34 tests in `tests/unit/urlValidator.test.ts`

| Block | Status |
|-------|--------|
| localhost | BLOCKED |
| 127.0.0.1 | BLOCKED |
| 10.x.x.x | BLOCKED |
| 172.16-31.x.x | BLOCKED |
| 192.168.x.x | BLOCKED |
| file:// | BLOCKED |
| javascript: | BLOCKED |
| data: | BLOCKED |
| HTTP (non-HTTPS) | BLOCKED |
| Payment URLs | BLOCKED |

**Status:** PASS

---

## Preview Token Audit

### Expiry Enforcement
**Location:** `server/previewToken.ts` lines 124-127  
**Status:** PASS

```typescript
const now = Math.floor(Date.now() / 1000);
if (now > payload.exp) {
  return { valid: false, error: 'Token expired' };
}
```

### HMAC Signature
**Status:** PASS - Using crypto.timingSafeEqual

---

## Evidence

All items verified via:
1. Code review with grep/read
2. Unit test execution (507 tests)
3. Template script execution (15/15, 197/197)
4. npm audit analysis

**Overall Status:** No P0 blockers remaining

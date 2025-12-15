# Treasure Coast AI - Patch Log

**Generated:** December 15, 2025  
**Purpose:** Track all fixes made during Production Certification

---

## Patch 001: NPM Audit Fixes
**Date:** 2025-12-15  
**Phase:** 1 - Baseline  
**Severity:** Medium  

### What
Fixed 4 npm vulnerabilities via `npm audit fix`:
- brace-expansion 2.0.0 - 2.0.1 (RegEx DoS)
- glob 10.2.0 - 10.4.5 (Command injection via CLI)
- on-headers <1.1.0 (HTTP response header manipulation)
- express-session dependency update

### Where
- package-lock.json (auto-updated by npm)

### Why
High severity vulnerability in glob CLI, medium vulnerabilities in other packages.

### Verification
```bash
npm audit
# Before: 9 vulnerabilities (3 low, 5 moderate, 1 high)
# After: 5 moderate (all in dev deps: esbuild/vite/drizzle-kit)
```

### Remaining (Accepted Risk)
5 moderate vulnerabilities remain in development dependencies:
- esbuild <=0.24.2 (dev server vulnerability - dev only)
- These are in build tools, NOT production code
- Fix requires breaking change to drizzle-kit

---

## Patch 002: env.example Update
**Date:** 2025-12-15  
**Phase:** 1 - Baseline  
**Severity:** Low  

### What
Updated env.example with:
1. Complete list of all environment variables used by the platform
2. Removed Stripe configuration section
3. Added NO_PAYMENTS_COMPLIANCE reference
4. Added missing variables:
   - SESSION_IDLE_TIMEOUT_MINUTES
   - LOGIN_MAX_ATTEMPTS, LOGIN_LOCKOUT_MINUTES, LOGIN_WINDOW_MINUTES
   - DEFAULT_STAFF_CLIENT_ID
   - DEMO_ACCOUNT_PASSWORD
   - WIDGET_ALLOWED_ORIGINS
   - RETENTION_* variables
   - DEMO_SAFE_MODE
   - LOG_LEVEL
   - REQUEST_TIMEOUT_MS

### Where
- env.example

### Why
Ensure operators have complete reference for production deployment.

### Verification
```bash
grep -c "^#\|^[A-Z]" env.example
# Comprehensive documentation of all variables
```

---

## Patches to be added as issues are found in Phases 2-7

(This log will be updated as fixes are made)

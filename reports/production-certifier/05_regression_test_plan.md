# 05 - Regression Test Plan

**Generated:** December 15, 2025  
**Certifier:** Treasure Coast AI Production Certifier

---

## Summary

| Test Category | Test Count | Status |
|---------------|------------|--------|
| Unit Tests | 507 | PASS |
| Integration Tests | 17 | PASS |
| Template Tests | 197 | PASS |
| Provisioning Tests | 15 | PASS |
| Demo Validation | 16 | PASS |

---

## Test Suite Overview

### Unit Tests (507 tests)

| Test File | Tests | Focus Area |
|-----------|-------|------------|
| templateIndexConsistency.test.ts | 282 | Template ID mapping |
| rbac.test.ts | 13 | Role-based access control |
| templateProvisioning.test.ts | 29 | Client provisioning |
| previewToken.test.ts | 20 | Preview link tokens |
| automations.test.ts | 21 | Automation rules |
| behaviorPreset.test.ts | 33 | AI behavior presets |
| urlValidator.test.ts | 34 | URL validation (SSRF) |
| mergeEngine.test.ts | 22 | Knowledge merge |
| conversationLogger.test.ts | 8 | Conversation logging |
| tenantScope.test.ts | 9 | Multi-tenant isolation |
| utils.test.ts | 13 | Utility functions |
| planLimits.test.ts | 6 | Plan-based limits |

### Integration Tests (17 tests)

| Test File | Tests | Focus Area |
|-----------|-------|------------|
| multitenancy.test.ts | 17 | Cross-tenant isolation |

---

## Critical Path Tests

### 1. Multi-Tenant Isolation (CRITICAL)
```typescript
// tests/integration/multitenancy.test.ts
describe('Multi-Tenant Isolation', () => {
  it('prevents cross-tenant lead access')
  it('prevents cross-tenant booking access')
  it('prevents cross-tenant conversation access')
  it('prevents cross-tenant bot access')
  it('scopes all queries by clientId')
  // ... 17 tests total
})
```

### 2. RBAC Access Control (CRITICAL)
```typescript
// tests/unit/rbac.test.ts
describe('RBAC', () => {
  it('owner has full access')
  it('manager has full access')
  it('staff has operational + config access')
  it('agent has operational access only')
  it('agent cannot modify bot config')
  it('agent cannot delete anything')
  it('agent cannot update widget settings')
  // ... 13 tests total
})
```

### 3. Preview Token Security (CRITICAL)
```typescript
// tests/unit/previewToken.test.ts
describe('Preview Tokens', () => {
  it('generates valid tokens')
  it('verifies valid tokens')
  it('rejects expired tokens')
  it('rejects tampered tokens')
  it('rejects wrong workspace')
  it('uses timing-safe comparison')
  // ... 20 tests total
})
```

### 4. URL Validation / SSRF Protection (CRITICAL)
```typescript
// tests/unit/urlValidator.test.ts
describe('URL Validator', () => {
  it('accepts valid HTTPS URLs')
  it('blocks HTTP URLs')
  it('blocks localhost')
  it('blocks 127.0.0.1')
  it('blocks private IP ranges')
  it('blocks file:// protocol')
  it('blocks javascript: protocol')
  it('blocks payment URLs')
  // ... 34 tests total
})
```

---

## Template Validation Scripts

### seed-bot-templates.ts
```bash
$ npx tsx scripts/seed-bot-templates.ts
✓ sober_living -> sober_living_template
✓ restaurant -> restaurant_template
✓ barber -> barber_template
✓ auto -> auto_shop_template
✓ home_services -> home_services_template
✓ gym -> gym_template
✓ real_estate -> real_estate_template
✓ med_spa -> med_spa_template
✓ tattoo -> tattoo_template
✓ law_firm -> law_firm_template
✓ dental -> dental_template
✓ hotel -> hotel_template
✓ roofing -> roofing_template
✓ wedding -> wedding_template
✓ pet_grooming -> pet_grooming_template

Total: 15/15 seeded
```

### validate-db-templates.ts
```bash
$ npx tsx scripts/validate-db-templates.ts
All 15 templates:
✓ Exist in DB
✓ Are active
✓ Have valid configs
```

### provisioning-smoke-test.ts
```bash
$ npx tsx scripts/provisioning-smoke-test.ts
All 15 templates:
✓ Can be validated
✓ Can provision client
✓ Client has expected structure
```

### industry-template-sweep.ts
```bash
$ npx tsx scripts/industry-template-sweep.ts
197 tests covering:
- URL validation
- Failsafe pivot modes
- No-payments rule
- CTA appointment types
- Profile lookups
- Internal appointment fields
```

---

## Regression Test Commands

### Before Each Deploy
```bash
# Full regression suite
npx tsc --noEmit && npx vitest run && npm run build

# Template validation
npx tsx scripts/validate-db-templates.ts

# Security checks
bash scripts/secrets-scan.sh
bash scripts/guard-no-payments.sh
```

### Quick Smoke Test
```bash
# Core functionality
npx vitest run tests/unit/rbac.test.ts
npx vitest run tests/integration/multitenancy.test.ts
npx vitest run tests/unit/previewToken.test.ts
```

---

## Test Coverage by Feature

| Feature | Unit Tests | Integration | Scripts |
|---------|------------|-------------|---------|
| Multi-Tenancy | tenantScope (9) | multitenancy (17) | - |
| RBAC | rbac (13) | - | - |
| Templates | templateIdx (282), templateProv (29) | - | 4 scripts |
| Preview Links | previewToken (20) | - | - |
| URL Security | urlValidator (34) | - | sweep |
| Automations | automations (21) | - | - |
| AI Behavior | behaviorPreset (33) | - | - |
| Knowledge Merge | mergeEngine (22) | - | - |
| Logging | conversationLogger (8) | - | - |
| Plan Limits | planLimits (6) | - | - |

---

## Adding New Tests

### For Multi-Tenant Features
```typescript
// Add to tests/integration/multitenancy.test.ts
it('new feature scopes by clientId', async () => {
  // Create data for client A
  // Attempt access from client B
  // Verify 403/404
})
```

### For RBAC Features
```typescript
// Add to tests/unit/rbac.test.ts
it('agent cannot access new feature', () => {
  const canAccess = checkAccess('agent', 'newFeature')
  expect(canAccess).toBe(false)
})
```

### For URL Validation
```typescript
// Add to tests/unit/urlValidator.test.ts
it('blocks new dangerous pattern', () => {
  const result = validateBookingUrl('dangerous://url')
  expect(result.valid).toBe(false)
})
```

---

## Evidence

All tests executed on December 15, 2025:
- 507 unit tests: PASS
- 17 integration tests: PASS
- 197 sweep tests: PASS
- 15 provisioning tests: PASS
- 16 demo validation tests: PASS

**Status:** PASS - Full regression coverage

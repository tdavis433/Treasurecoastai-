/**
 * Industry Template Sweep - Automated Test Script
 * 
 * Comprehensive validation of all industry booking profiles and failsafe logic.
 * Tests URL validation, failsafe pivoting, and profile integrity.
 * 
 * Usage:
 *   npx tsx scripts/industry-template-sweep.ts
 */

import {
  getBookingProfileForBotType,
  validateBookingProfile,
  INDUSTRY_BOOKING_PROFILES,
} from '../shared/industry-booking-profiles';
import { isValidExternalBookingUrl } from '../server/orchestrator';

interface TestResult {
  name: string;
  passed: boolean;
  message: string;
}

const results: TestResult[] = [];

function test(name: string, fn: () => boolean | string): void {
  try {
    const result = fn();
    if (result === true) {
      results.push({ name, passed: true, message: 'OK' });
    } else {
      results.push({ name, passed: false, message: typeof result === 'string' ? result : 'Failed' });
    }
  } catch (err: any) {
    results.push({ name, passed: false, message: err.message || 'Exception thrown' });
  }
}

console.log('\n==============================================');
console.log('  INDUSTRY TEMPLATE SWEEP - AUTOMATED TESTS');
console.log('==============================================\n');

// ============================================================================
// SECTION 1: URL VALIDATION TESTS
// ============================================================================

console.log('--- URL VALIDATION TESTS ---\n');

test('Valid HTTPS URL passes', () => {
  return isValidExternalBookingUrl('https://booking.example.com/schedule') === true;
});

test('Valid HTTPS URL with path and query passes', () => {
  return isValidExternalBookingUrl('https://calendly.com/mycompany/30min?month=2024-01') === true;
});

test('HTTP URL is blocked (insecure)', () => {
  return isValidExternalBookingUrl('http://booking.example.com') === false;
});

test('javascript: URL is blocked', () => {
  return isValidExternalBookingUrl('javascript:alert(1)') === false;
});

test('data: URL is blocked', () => {
  return isValidExternalBookingUrl('data:text/html,<script>alert(1)</script>') === false;
});

test('file: URL is blocked', () => {
  return isValidExternalBookingUrl('file:///etc/passwd') === false;
});

test('vbscript: URL is blocked', () => {
  return isValidExternalBookingUrl('vbscript:msgbox(1)') === false;
});

test('about: URL is blocked', () => {
  return isValidExternalBookingUrl('about:blank') === false;
});

test('Empty string is invalid', () => {
  return isValidExternalBookingUrl('') === false;
});

test('Null is invalid', () => {
  return isValidExternalBookingUrl(null) === false;
});

test('Undefined is invalid', () => {
  return isValidExternalBookingUrl(undefined as any) === false;
});

test('Whitespace-only string is invalid', () => {
  return isValidExternalBookingUrl('   ') === false;
});

test('URL without scheme is invalid', () => {
  return isValidExternalBookingUrl('booking.example.com') === false;
});

test('URL with short hostname is invalid', () => {
  return isValidExternalBookingUrl('https://ab') === false;
});

// ============================================================================
// SECTION 2: ALL INDUSTRY PROFILES HAVE VALID FAILSAFE
// ============================================================================

console.log('\n--- INDUSTRY PROFILE FAILSAFE TESTS ---\n');

const industryKeys = Object.keys(INDUSTRY_BOOKING_PROFILES);

for (const key of industryKeys) {
  const profile = INDUSTRY_BOOKING_PROFILES[key];
  
  test(`${key}: has valid failsafe configuration`, () => {
    const validation = validateBookingProfile(profile);
    if (!validation.valid) {
      return validation.errors.join('; ');
    }
    return true;
  });
}

// ============================================================================
// SECTION 3: FAILSAFE PIVOT APPOINTMENTS ARE INTERNAL
// ============================================================================

console.log('\n--- FAILSAFE PIVOT MODE TESTS ---\n');

for (const key of industryKeys) {
  const profile = INDUSTRY_BOOKING_PROFILES[key];
  const pivotId = profile.failsafe?.pivotAppointmentTypeId;
  
  if (pivotId) {
    test(`${key}: pivot appointment "${pivotId}" is internal mode`, () => {
      const pivotType = profile.appointmentTypes.find(t => t.id === pivotId);
      if (!pivotType) {
        return `Pivot appointment type "${pivotId}" not found`;
      }
      if (pivotType.mode !== 'internal') {
        return `Pivot mode is "${pivotType.mode}", expected "internal"`;
      }
      return true;
    });
  }
}

// ============================================================================
// SECTION 4: EXTERNAL MODE PROFILES HAVE NO PAYMENTS
// ============================================================================

console.log('\n--- NO PAYMENTS RULE TESTS ---\n');

for (const key of industryKeys) {
  const profile = INDUSTRY_BOOKING_PROFILES[key];
  
  if (profile.defaultMode === 'external') {
    test(`${key}: external profile has no payment fields`, () => {
      for (const apt of profile.appointmentTypes) {
        if (apt.mode === 'external') {
          // Check for any payment-related fields
          for (const field of apt.intakeFields || []) {
            const fieldKey = field.key.toLowerCase();
            if (fieldKey.includes('payment') || fieldKey.includes('card') || fieldKey.includes('credit')) {
              return `External appointment "${apt.id}" has payment field: ${field.key}`;
            }
          }
        }
      }
      return true;
    });
  }
}

// ============================================================================
// SECTION 5: ALL CTAs REFERENCE VALID APPOINTMENT TYPES
// ============================================================================

console.log('\n--- CTA APPOINTMENT TYPE REFERENCE TESTS ---\n');

for (const key of industryKeys) {
  const profile = INDUSTRY_BOOKING_PROFILES[key];
  
  test(`${key}: all CTAs reference valid appointment types`, () => {
    const aptIds = new Set(profile.appointmentTypes.map(a => a.id));
    for (const cta of profile.ctas) {
      if (!aptIds.has(cta.appointmentTypeId)) {
        return `CTA "${cta.id}" references missing appointment type "${cta.appointmentTypeId}"`;
      }
    }
    return true;
  });
}

// ============================================================================
// SECTION 6: PROFILE LOOKUP WORKS CORRECTLY
// ============================================================================

console.log('\n--- PROFILE LOOKUP TESTS ---\n');

const lookupTests = [
  { input: 'barber', expectedDefault: 'external' },
  { input: 'barbershop', expectedDefault: 'external' },
  { input: 'BARBER', expectedDefault: 'external' },  // Case insensitive
  { input: 'med_spa', expectedDefault: 'external' },
  { input: 'medspa', expectedDefault: 'external' },
  { input: 'sober_living', expectedDefault: 'internal' },
  { input: 'recovery_housing', expectedDefault: 'internal' },
  { input: 'law_firm', expectedDefault: 'internal' },
  { input: 'restaurant', expectedDefault: 'internal' },
  { input: 'unknown_industry', expectedDefault: 'internal' },  // Falls back to generic
];

for (const { input, expectedDefault } of lookupTests) {
  test(`Lookup "${input}" returns ${expectedDefault} mode`, () => {
    const profile = getBookingProfileForBotType(input);
    if (profile.defaultMode !== expectedDefault) {
      return `Got "${profile.defaultMode}", expected "${expectedDefault}"`;
    }
    return true;
  });
}

// ============================================================================
// SECTION 7: REQUIRED FIELDS FOR INTERNAL APPOINTMENTS
// ============================================================================

console.log('\n--- INTERNAL APPOINTMENT REQUIRED FIELDS TESTS ---\n');

for (const key of industryKeys) {
  const profile = INDUSTRY_BOOKING_PROFILES[key];
  
  for (const apt of profile.appointmentTypes) {
    if (apt.mode === 'internal' && apt.intakeFields && apt.intakeFields.length > 0) {
      test(`${key}/${apt.id}: has name or phone required field`, () => {
        const hasName = apt.intakeFields!.some(f => f.key === 'name' && f.required);
        const hasPhone = apt.intakeFields!.some(f => f.key === 'phone' && f.required);
        if (!hasName && !hasPhone) {
          return 'Internal appointment should require at least name or phone';
        }
        return true;
      });
    }
  }
}

// ============================================================================
// PRINT RESULTS
// ============================================================================

console.log('\n==============================================');
console.log('  TEST RESULTS');
console.log('==============================================\n');

const passed = results.filter(r => r.passed);
const failed = results.filter(r => !r.passed);

console.log(`Total tests: ${results.length}`);
console.log(`Passed: ${passed.length}`);
console.log(`Failed: ${failed.length}`);
console.log('');

if (failed.length > 0) {
  console.log('--- FAILURES ---\n');
  for (const f of failed) {
    console.log(`✗ ${f.name}`);
    console.log(`  ${f.message}\n`);
  }
}

console.log('==============================================');
if (failed.length === 0) {
  console.log('  ✓ ALL TESTS PASSED');
} else {
  console.log(`  ✗ ${failed.length} TEST(S) FAILED`);
}
console.log('==============================================\n');

process.exit(failed.length > 0 ? 1 : 0);

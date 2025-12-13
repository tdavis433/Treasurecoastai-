/**
 * Demo Bot Template Validation Script
 * 
 * Validates that all demo page configs map to valid industry booking profiles
 * and have proper failsafe configurations.
 * 
 * Usage:
 *   npx tsx scripts/validate-demo-templates.ts
 */

import {
  getBookingProfileForBotType,
  validateBookingProfile,
  INDUSTRY_BOOKING_PROFILES,
} from '../shared/industry-booking-profiles';

interface DemoConfigInfo {
  slug: string;
  businessName: string;
  businessType: string;
  clientId: string;
  botId: string;
}

const DEMO_CONFIGS: DemoConfigInfo[] = [
  { slug: 'faith-house', businessName: 'Faith House', businessType: 'sober_living', clientId: 'faith_house_demo', botId: 'bot_demo_faith_house' },
  { slug: 'paws-suds', businessName: 'Paws & Suds', businessType: 'grooming', clientId: 'demo_paws_suds_grooming_demo', botId: 'bot_demo_paws_suds' },
  { slug: 'harper-law', businessName: 'Harper Law Firm', businessType: 'law_firm', clientId: 'demo_harper_law', botId: 'bot_demo_law' },
  { slug: 'coastal-smiles', businessName: 'Coastal Smiles Dental', businessType: 'dental', clientId: 'demo_coastal_smiles', botId: 'bot_demo_dental' },
  { slug: 'palm-resort', businessName: 'Palm Resort', businessType: 'boutique_hotel', clientId: 'demo_palm_resort', botId: 'bot_demo_hotel' },
  { slug: 'tc-roofing', businessName: 'TC Roofing', businessType: 'roofing', clientId: 'demo_tc_roofing', botId: 'bot_demo_roofing' },
  { slug: 'oceanview-gardens', businessName: 'Oceanview Gardens', businessType: 'wedding_venue', clientId: 'demo_oceanview_gardens', botId: 'bot_demo_wedding' },
  { slug: 'sunrise-auto', businessName: 'Sunrise Auto', businessType: 'auto', clientId: 'demo_coastline_auto', botId: 'bot_demo_auto' },
  { slug: 'classic-cuts', businessName: 'Classic Cuts Barbershop', businessType: 'barber', clientId: 'demo_fade_factory', botId: 'bot_demo_barbershop' },
  { slug: 'neon-harbor-fitness', businessName: 'Neon Harbor Fitness', businessType: 'fitness', clientId: 'demo_iron_coast_fitness', botId: 'bot_demo_fitness' },
  { slug: 'blue-harbor-medspa', businessName: 'Blue Harbor MedSpa', businessType: 'medspa', clientId: 'demo_radiance_medspa', botId: 'bot_demo_medspa' },
  { slug: 'coastal-realty', businessName: 'Coastal Realty', businessType: 'real_estate', clientId: 'demo_premier_properties', botId: 'bot_demo_realty' },
  { slug: 'sunset-bistro', businessName: 'Sunset Bistro', businessType: 'restaurant', clientId: 'demo_coastal_breeze', botId: 'bot_demo_restaurant' },
  { slug: 'inkwell-tattoo', businessName: 'Inkwell Tattoo', businessType: 'tattoo', clientId: 'demo_ink_soul', botId: 'bot_demo_tattoo' },
  { slug: 'handy-helpers', businessName: 'Handy Helpers', businessType: 'handyman', clientId: 'demo_tc_handyman', botId: 'bot_demo_handyman' },
  { slug: 'new-horizons', businessName: 'New Horizons Recovery House', businessType: 'sober_living', clientId: 'demo_new_horizons', botId: 'bot_demo_recovery' },
];

interface ValidationResult {
  slug: string;
  businessName: string;
  businessType: string;
  profileFound: boolean;
  profileMode: 'internal' | 'external' | 'unknown';
  failsafeValid: boolean;
  errors: string[];
}

function validateDemoTemplates(): ValidationResult[] {
  const results: ValidationResult[] = [];

  for (const demo of DEMO_CONFIGS) {
    const profile = getBookingProfileForBotType(demo.businessType);
    const validation = validateBookingProfile(profile);

    results.push({
      slug: demo.slug,
      businessName: demo.businessName,
      businessType: demo.businessType,
      profileFound: !!profile,
      profileMode: profile?.defaultMode || 'unknown',
      failsafeValid: validation.valid,
      errors: validation.errors,
    });
  }

  return results;
}

function printReport(results: ValidationResult[]): void {
  console.log('\n========================================');
  console.log('  DEMO BOT TEMPLATE VALIDATION REPORT');
  console.log('========================================\n');

  const passed = results.filter(r => r.profileFound && r.failsafeValid);
  const failed = results.filter(r => !r.profileFound || !r.failsafeValid);

  console.log(`Total demos: ${results.length}`);
  console.log(`Passed: ${passed.length}`);
  console.log(`Failed: ${failed.length}`);
  console.log('');

  // Print details by mode
  const external = results.filter(r => r.profileMode === 'external');
  const internal = results.filter(r => r.profileMode === 'internal');

  console.log('--- EXTERNAL DEFAULT MODE ---');
  for (const r of external) {
    const status = r.failsafeValid ? '✓' : '✗';
    console.log(`  ${status} ${r.businessName} (${r.businessType})`);
    if (r.errors.length > 0) {
      for (const err of r.errors) {
        console.log(`      ERROR: ${err}`);
      }
    }
  }

  console.log('\n--- INTERNAL DEFAULT MODE ---');
  for (const r of internal) {
    const status = r.failsafeValid ? '✓' : '✗';
    console.log(`  ${status} ${r.businessName} (${r.businessType})`);
    if (r.errors.length > 0) {
      for (const err of r.errors) {
        console.log(`      ERROR: ${err}`);
      }
    }
  }

  console.log('\n========================================');
  console.log('  INDUSTRY PROFILE COVERAGE');
  console.log('========================================\n');

  const knownIndustries = Object.keys(INDUSTRY_BOOKING_PROFILES);
  const usedIndustries = new Set(results.map(r => r.businessType));

  console.log(`Defined profiles: ${knownIndustries.length}`);
  console.log(`Used in demos: ${usedIndustries.size}`);
  console.log('');

  const unusedProfiles = knownIndustries.filter(k => !usedIndustries.has(k));
  if (unusedProfiles.length > 0) {
    console.log('Profiles not used in demos:');
    for (const p of unusedProfiles) {
      console.log(`  - ${p}`);
    }
  }

  console.log('\n========================================');
  console.log('  FAILSAFE VERIFICATION');
  console.log('========================================\n');

  for (const r of results) {
    const profile = getBookingProfileForBotType(r.businessType);
    const pivotId = profile.failsafe?.pivotAppointmentTypeId;
    const pivotType = profile.appointmentTypes.find(t => t.id === pivotId);

    console.log(`${r.businessName}:`);
    console.log(`  Default mode: ${r.profileMode}`);
    console.log(`  Failsafe pivot: ${pivotId || 'NONE'}`);
    if (pivotType) {
      console.log(`  Pivot mode: ${pivotType.mode}`);
      console.log(`  Pivot label: ${pivotType.label}`);
    }
    console.log('');
  }

  // Summary
  console.log('========================================');
  if (failed.length === 0) {
    console.log('  ✓ ALL DEMOS VALIDATED SUCCESSFULLY');
  } else {
    console.log('  ✗ VALIDATION FAILURES DETECTED');
    console.log('');
    for (const f of failed) {
      console.log(`  - ${f.businessName}: ${f.errors.join(', ')}`);
    }
  }
  console.log('========================================\n');
}

function main(): void {
  console.log('Running demo bot template validation...\n');
  const results = validateDemoTemplates();
  printReport(results);

  const failed = results.filter(r => !r.profileFound || !r.failsafeValid);
  process.exit(failed.length > 0 ? 1 : 0);
}

main();

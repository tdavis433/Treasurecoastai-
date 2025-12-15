/**
 * Bot Templates Seed Script
 * 
 * Idempotent upsert of all INDUSTRY_TEMPLATES into the bot_templates database table.
 * Safe to run multiple times - will update existing records and insert missing ones.
 * 
 * Usage:
 *   npx tsx scripts/seed-bot-templates.ts
 */

import { seedAllTemplates, INDUSTRY_TEMPLATE_COUNT, type SeedResult } from '../server/templates/ensureTemplatesSeeded';

function printSummary(results: SeedResult[]): void {
  console.log('\n========================================');
  console.log('  BOT TEMPLATES SEED SUMMARY');
  console.log('========================================\n');
  
  const inserted = results.filter(r => r.action === 'inserted');
  const updated = results.filter(r => r.action === 'updated');
  const errors = results.filter(r => r.action === 'error');
  
  console.log(`  Total templates:   ${INDUSTRY_TEMPLATE_COUNT}`);
  console.log(`  Inserted:          ${inserted.length}`);
  console.log(`  Updated:           ${updated.length}`);
  console.log(`  Errors:            ${errors.length}`);
  console.log('');
  
  if (errors.length > 0) {
    console.log('Errors:');
    for (const e of errors) {
      console.log(`  - ${e.industryKey}: ${e.error}`);
    }
    console.log('');
  }
  
  console.log('========================================');
  if (errors.length === 0) {
    console.log(`  ✓ ALL ${INDUSTRY_TEMPLATE_COUNT} TEMPLATES SEEDED`);
  } else {
    console.log(`  ✗ SEED INCOMPLETE (${errors.length} errors)`);
  }
  console.log('========================================\n');
}

async function main(): Promise<void> {
  console.log('========================================');
  console.log('  BOT TEMPLATES SEED SCRIPT');
  console.log('========================================');
  console.log(`\nSeeding ${INDUSTRY_TEMPLATE_COUNT} templates...\n`);
  
  const results = await seedAllTemplates(true);
  printSummary(results);
  
  const errors = results.filter(r => r.action === 'error');
  process.exit(errors.length > 0 ? 1 : 0);
}

main().catch(err => {
  console.error('Script error:', err);
  process.exit(1);
});

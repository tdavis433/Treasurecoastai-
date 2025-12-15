/**
 * Database Template Validation Script
 * 
 * Validates that all required templates exist in the bot_templates database table
 * and have valid configurations for client provisioning.
 * 
 * This is a critical gate for production deployment - ensures no template
 * creation endpoints will fail due to missing DB templates.
 * 
 * Usage:
 *   npx tsx scripts/validate-db-templates.ts
 */

import { db } from '../server/storage';
import { botTemplates } from '../shared/schema';
import { validateTemplateForProvisioning } from '../server/templates';

interface TemplateValidationResult {
  templateId: string;
  dbTemplateId: string | null;
  existsInDb: boolean;
  isActive: boolean;
  hasValidConfig: boolean;
  configErrors: string[];
}

/**
 * Mapping from INDUSTRY_TEMPLATES keys to actual database template_id values.
 * 
 * The DB uses `_template` suffix convention, while INDUSTRY_TEMPLATES uses
 * shorter keys. This mapping bridges the two naming conventions.
 * 
 * IMPORTANT: This is the source of truth for which templates are REQUIRED
 * for client provisioning. Only templates listed here will be gated.
 */
const INDUSTRY_TO_DB_TEMPLATE_MAP: Record<string, string> = {
  sober_living: 'sober_living_template',
  restaurant: 'restaurant_template',
  barber: 'barber_template',
  auto: 'auto_shop_template',
  home_services: 'home_services_template',
  gym: 'gym_template',
  real_estate: 'real_estate_template',
  med_spa: 'med_spa_template',
  tattoo: 'tattoo_template',
};

const REQUIRED_INDUSTRY_IDS = Object.keys(INDUSTRY_TO_DB_TEMPLATE_MAP);
const REQUIRED_DB_TEMPLATE_IDS = Object.values(INDUSTRY_TO_DB_TEMPLATE_MAP);

async function validateDatabaseTemplates(): Promise<TemplateValidationResult[]> {
  const results: TemplateValidationResult[] = [];
  
  try {
    const dbTemplates = await db.select().from(botTemplates);
    const dbTemplateMap = new Map(dbTemplates.map(t => [t.templateId, t]));
    
    for (const industryId of REQUIRED_INDUSTRY_IDS) {
      const dbTemplateId = INDUSTRY_TO_DB_TEMPLATE_MAP[industryId];
      const dbTemplate = dbTemplateMap.get(dbTemplateId);
      
      if (!dbTemplate) {
        results.push({
          templateId: industryId,
          dbTemplateId,
          existsInDb: false,
          isActive: false,
          hasValidConfig: false,
          configErrors: [`Template '${dbTemplateId}' not found in database`],
        });
        continue;
      }
      
      const validation = validateTemplateForProvisioning(dbTemplate as any);
      
      results.push({
        templateId: industryId,
        dbTemplateId,
        existsInDb: true,
        isActive: dbTemplate.isActive ?? false,
        hasValidConfig: validation.valid,
        configErrors: validation.errors,
      });
    }
    
    for (const dbTemplate of dbTemplates) {
      if (!REQUIRED_DB_TEMPLATE_IDS.includes(dbTemplate.templateId)) {
        const validation = validateTemplateForProvisioning(dbTemplate as any);
        results.push({
          templateId: dbTemplate.templateId,
          dbTemplateId: dbTemplate.templateId,
          existsInDb: true,
          isActive: dbTemplate.isActive ?? false,
          hasValidConfig: validation.valid,
          configErrors: validation.errors,
        });
      }
    }
    
  } catch (error: any) {
    console.error('Database connection error:', error.message);
    process.exit(1);
  }
  
  return results;
}

function printReport(results: TemplateValidationResult[]): void {
  console.log('\n========================================');
  console.log('  DATABASE TEMPLATE VALIDATION REPORT');
  console.log('========================================\n');
  
  const requiredResults = results.filter(r => REQUIRED_INDUSTRY_IDS.includes(r.templateId));
  const existing = requiredResults.filter(r => r.existsInDb);
  const missing = requiredResults.filter(r => !r.existsInDb);
  const active = requiredResults.filter(r => r.isActive);
  const validConfigs = requiredResults.filter(r => r.hasValidConfig);
  
  console.log('Summary (Required Templates):');
  console.log(`  Total required:    ${REQUIRED_INDUSTRY_IDS.length}`);
  console.log(`  Exist in DB:       ${existing.length}`);
  console.log(`  Missing from DB:   ${missing.length}`);
  console.log(`  Active:            ${active.length}`);
  console.log(`  Valid configs:     ${validConfigs.length}`);
  console.log('');
  
  console.log('--- REQUIRED TEMPLATES ---\n');
  for (const industryId of REQUIRED_INDUSTRY_IDS) {
    const result = results.find(r => r.templateId === industryId);
    if (!result) continue;
    
    const dbStatus = result.existsInDb ? '✓ DB' : '✗ MISSING';
    const activeStatus = result.isActive ? '✓ Active' : '○ Inactive';
    const configStatus = result.hasValidConfig ? '✓ Valid' : '✗ Invalid';
    
    console.log(`  ${industryId} -> ${result.dbTemplateId}:`);
    console.log(`    ${dbStatus} | ${activeStatus} | ${configStatus}`);
    
    if (result.configErrors.length > 0) {
      for (const err of result.configErrors) {
        console.log(`      ERROR: ${err}`);
      }
    }
  }
  
  const extras = results.filter(r => !REQUIRED_INDUSTRY_IDS.includes(r.templateId));
  if (extras.length > 0) {
    console.log('\n--- ADDITIONAL TEMPLATES IN DB ---\n');
    for (const result of extras) {
      const activeStatus = result.isActive ? '✓ Active' : '○ Inactive';
      const configStatus = result.hasValidConfig ? '✓ Valid' : '✗ Invalid';
      console.log(`  ${result.templateId}: ${activeStatus} | ${configStatus}`);
    }
  }
  
  console.log('\n========================================');
  
  if (missing.length === 0 && validConfigs.length === existing.length) {
    console.log('  ✓ ALL REQUIRED TEMPLATES VALIDATED');
    console.log('========================================\n');
  } else {
    console.log('  ✗ VALIDATION FAILURES DETECTED');
    console.log('========================================\n');
    
    if (missing.length > 0) {
      console.log('Missing required templates:');
      for (const r of missing) {
        console.log(`  - ${r.templateId} (DB: ${r.dbTemplateId})`);
      }
      console.log('');
      console.log('To fix: Run template seeding or manually insert missing templates.');
    }
    
    const invalidConfigs = requiredResults.filter(r => r.existsInDb && !r.hasValidConfig);
    if (invalidConfigs.length > 0) {
      console.log('\nTemplates with invalid configs:');
      for (const r of invalidConfigs) {
        console.log(`  - ${r.templateId}: ${r.configErrors.join(', ')}`);
      }
    }
  }
}

async function main(): Promise<void> {
  console.log('Validating database templates...\n');
  
  const results = await validateDatabaseTemplates();
  printReport(results);
  
  const requiredResults = results.filter(r => REQUIRED_INDUSTRY_IDS.includes(r.templateId));
  const missing = requiredResults.filter(r => !r.existsInDb);
  const invalidConfigs = requiredResults.filter(r => r.existsInDb && !r.hasValidConfig);
  
  process.exit(missing.length > 0 || invalidConfigs.length > 0 ? 1 : 0);
}

main().catch(err => {
  console.error('Script error:', err);
  process.exit(1);
});

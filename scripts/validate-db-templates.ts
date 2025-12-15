/**
 * Database Template Validation Script
 * 
 * Validates that ALL INDUSTRY_TEMPLATES (15/15) exist in the bot_templates database table
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
import { 
  getDbTemplateId, 
  getAllIndustryKeys, 
  INDUSTRY_TEMPLATE_COUNT 
} from '../server/templates/templateIdMap';

interface TemplateValidationResult {
  industryKey: string;
  dbTemplateId: string;
  existsInDb: boolean;
  isActive: boolean;
  hasValidConfig: boolean;
  configErrors: string[];
}

async function validateDatabaseTemplates(): Promise<TemplateValidationResult[]> {
  const results: TemplateValidationResult[] = [];
  const industryKeys = getAllIndustryKeys();
  
  try {
    const dbTemplates = await db.select().from(botTemplates);
    const dbTemplateMap = new Map(dbTemplates.map(t => [t.templateId, t]));
    
    // Validate all required templates from INDUSTRY_TEMPLATES
    for (const industryKey of industryKeys) {
      const dbTemplateId = getDbTemplateId(industryKey);
      const dbTemplate = dbTemplateMap.get(dbTemplateId);
      
      if (!dbTemplate) {
        results.push({
          industryKey,
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
        industryKey,
        dbTemplateId,
        existsInDb: true,
        isActive: dbTemplate.isActive ?? false,
        hasValidConfig: validation.valid,
        configErrors: validation.errors,
      });
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
  
  const existing = results.filter(r => r.existsInDb);
  const missing = results.filter(r => !r.existsInDb);
  const active = results.filter(r => r.isActive);
  const validConfigs = results.filter(r => r.hasValidConfig);
  
  console.log('Summary:');
  console.log(`  Required (INDUSTRY_TEMPLATES): ${INDUSTRY_TEMPLATE_COUNT}`);
  console.log(`  Exist in DB:                   ${existing.length}/${INDUSTRY_TEMPLATE_COUNT}`);
  console.log(`  Missing from DB:               ${missing.length}`);
  console.log(`  Active:                        ${active.length}/${INDUSTRY_TEMPLATE_COUNT}`);
  console.log(`  Valid configs:                 ${validConfigs.length}/${INDUSTRY_TEMPLATE_COUNT}`);
  console.log('');
  
  console.log('--- ALL REQUIRED TEMPLATES ---\n');
  for (const result of results) {
    const dbStatus = result.existsInDb ? '✓ DB' : '✗ MISSING';
    const activeStatus = result.isActive ? '✓ Active' : '○ Inactive';
    const configStatus = result.hasValidConfig ? '✓ Valid' : '✗ Invalid';
    
    console.log(`  ${result.industryKey} -> ${result.dbTemplateId}:`);
    console.log(`    ${dbStatus} | ${activeStatus} | ${configStatus}`);
    
    if (result.configErrors.length > 0) {
      for (const err of result.configErrors) {
        console.log(`      ERROR: ${err}`);
      }
    }
  }
  
  console.log('\n========================================');
  
  if (missing.length === 0 && validConfigs.length === existing.length && existing.length === INDUSTRY_TEMPLATE_COUNT) {
    console.log(`  ✓ ALL ${INDUSTRY_TEMPLATE_COUNT}/${INDUSTRY_TEMPLATE_COUNT} TEMPLATES VALIDATED`);
    console.log('========================================\n');
  } else {
    console.log('  ✗ VALIDATION FAILURES DETECTED');
    console.log('========================================\n');
    
    if (missing.length > 0) {
      console.log('Missing required templates:');
      for (const r of missing) {
        console.log(`  - ${r.industryKey} (DB: ${r.dbTemplateId})`);
      }
      console.log('');
      console.log('To fix: Run `npx tsx scripts/seed-bot-templates.ts`');
    }
    
    const invalidConfigs = results.filter(r => r.existsInDb && !r.hasValidConfig);
    if (invalidConfigs.length > 0) {
      console.log('\nTemplates with invalid configs:');
      for (const r of invalidConfigs) {
        console.log(`  - ${r.industryKey}: ${r.configErrors.join(', ')}`);
      }
    }
  }
}

async function main(): Promise<void> {
  console.log('Validating database templates...\n');
  
  const results = await validateDatabaseTemplates();
  printReport(results);
  
  const missing = results.filter(r => !r.existsInDb);
  const invalidConfigs = results.filter(r => r.existsInDb && !r.hasValidConfig);
  
  // Exit code 1 if ANY required template is missing or invalid
  process.exit(missing.length > 0 || invalidConfigs.length > 0 ? 1 : 0);
}

main().catch(err => {
  console.error('Script error:', err);
  process.exit(1);
});

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
import { INDUSTRY_TEMPLATES } from '../server/industryTemplates';
import { validateTemplateForProvisioning } from '../server/templates';

interface TemplateValidationResult {
  templateId: string;
  existsInDb: boolean;
  isActive: boolean;
  hasValidConfig: boolean;
  configErrors: string[];
  expectedFromIndustry: boolean;
}

/**
 * REQUIRED_TEMPLATE_IDS is derived programmatically from INDUSTRY_TEMPLATES
 * to ensure consistency between validation and runtime expectations.
 * 
 * This is the single source of truth for required templates because:
 * 1. INDUSTRY_TEMPLATES defines all templates available for NEW client provisioning
 * 2. The buildClientFromTemplate helper only works with DB templates
 * 3. Legacy templates not in INDUSTRY_TEMPLATES won't be used for new client creation
 * 
 * Note: Additional templates may exist in the DB (legacy or custom). These are
 * reported in the "ADDITIONAL TEMPLATES" section but are not gated as required.
 */
const REQUIRED_TEMPLATE_IDS = Object.keys(INDUSTRY_TEMPLATES);

async function validateDatabaseTemplates(): Promise<TemplateValidationResult[]> {
  const results: TemplateValidationResult[] = [];
  
  try {
    const dbTemplates = await db.select().from(botTemplates);
    const dbTemplateMap = new Map(dbTemplates.map(t => [t.templateId, t]));
    
    for (const templateId of REQUIRED_TEMPLATE_IDS) {
      const dbTemplate = dbTemplateMap.get(templateId);
      const industryTemplate = INDUSTRY_TEMPLATES[templateId];
      
      if (!dbTemplate) {
        results.push({
          templateId,
          existsInDb: false,
          isActive: false,
          hasValidConfig: false,
          configErrors: ['Template not found in database'],
          expectedFromIndustry: !!industryTemplate,
        });
        continue;
      }
      
      const validation = validateTemplateForProvisioning(dbTemplate as any);
      
      results.push({
        templateId,
        existsInDb: true,
        isActive: dbTemplate.isActive ?? false,
        hasValidConfig: validation.valid,
        configErrors: validation.errors,
        expectedFromIndustry: !!industryTemplate,
      });
    }
    
    for (const dbTemplate of dbTemplates) {
      if (!REQUIRED_TEMPLATE_IDS.includes(dbTemplate.templateId)) {
        const validation = validateTemplateForProvisioning(dbTemplate as any);
        results.push({
          templateId: dbTemplate.templateId,
          existsInDb: true,
          isActive: dbTemplate.isActive ?? false,
          hasValidConfig: validation.valid,
          configErrors: validation.errors,
          expectedFromIndustry: !!INDUSTRY_TEMPLATES[dbTemplate.templateId],
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
  
  const existing = results.filter(r => r.existsInDb);
  const missing = results.filter(r => !r.existsInDb);
  const active = results.filter(r => r.isActive);
  const validConfigs = results.filter(r => r.hasValidConfig);
  const requiredMissing = missing.filter(r => REQUIRED_TEMPLATE_IDS.includes(r.templateId));
  
  console.log('Summary:');
  console.log(`  Total checked:     ${results.length}`);
  console.log(`  Exist in DB:       ${existing.length}`);
  console.log(`  Missing from DB:   ${missing.length}`);
  console.log(`  Active:            ${active.length}`);
  console.log(`  Valid configs:     ${validConfigs.length}`);
  console.log(`  Required missing:  ${requiredMissing.length}`);
  console.log('');
  
  console.log('--- REQUIRED TEMPLATES ---\n');
  for (const templateId of REQUIRED_TEMPLATE_IDS) {
    const result = results.find(r => r.templateId === templateId);
    if (!result) continue;
    
    const dbStatus = result.existsInDb ? '✓ DB' : '✗ MISSING';
    const activeStatus = result.isActive ? '✓ Active' : '○ Inactive';
    const configStatus = result.hasValidConfig ? '✓ Valid' : '✗ Invalid';
    
    console.log(`  ${templateId}:`);
    console.log(`    ${dbStatus} | ${activeStatus} | ${configStatus}`);
    
    if (result.configErrors.length > 0) {
      for (const err of result.configErrors) {
        console.log(`      ERROR: ${err}`);
      }
    }
  }
  
  const extras = results.filter(r => !REQUIRED_TEMPLATE_IDS.includes(r.templateId));
  if (extras.length > 0) {
    console.log('\n--- ADDITIONAL TEMPLATES IN DB ---\n');
    for (const result of extras) {
      const activeStatus = result.isActive ? '✓ Active' : '○ Inactive';
      const configStatus = result.hasValidConfig ? '✓ Valid' : '✗ Invalid';
      console.log(`  ${result.templateId}: ${activeStatus} | ${configStatus}`);
    }
  }
  
  console.log('\n========================================');
  
  if (requiredMissing.length === 0 && validConfigs.length === existing.length) {
    console.log('  ✓ ALL REQUIRED TEMPLATES VALIDATED');
    console.log('========================================\n');
  } else {
    console.log('  ✗ VALIDATION FAILURES DETECTED');
    console.log('========================================\n');
    
    if (requiredMissing.length > 0) {
      console.log('Missing required templates:');
      for (const r of requiredMissing) {
        console.log(`  - ${r.templateId}`);
      }
      console.log('');
      console.log('To fix: Run template seeding or manually insert missing templates.');
    }
    
    const invalidConfigs = results.filter(r => r.existsInDb && !r.hasValidConfig);
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
  
  const requiredMissing = results.filter(
    r => REQUIRED_TEMPLATE_IDS.includes(r.templateId) && !r.existsInDb
  );
  const invalidConfigs = results.filter(r => r.existsInDb && !r.hasValidConfig);
  
  process.exit(requiredMissing.length > 0 || invalidConfigs.length > 0 ? 1 : 0);
}

main().catch(err => {
  console.error('Script error:', err);
  process.exit(1);
});

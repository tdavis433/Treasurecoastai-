/**
 * Provisioning Smoke Test
 * 
 * Validates that all DB templates can be used for client provisioning.
 * Performs dry-run validation of buildClientFromTemplate for each template.
 * 
 * Usage:
 *   npx tsx scripts/provisioning-smoke-test.ts
 */

import { db } from '../server/storage';
import { botTemplates } from '../shared/schema';
import { buildClientFromTemplate, validateTemplateForProvisioning } from '../server/templates';
import { 
  getDbTemplateId, 
  getAllIndustryKeys, 
  INDUSTRY_TEMPLATE_COUNT 
} from '../server/templates/templateIdMap';

interface SmokeTestResult {
  industryKey: string;
  dbTemplateId: string;
  validationPassed: boolean;
  provisioningPassed: boolean;
  errors: string[];
}

async function runSmokeTests(): Promise<SmokeTestResult[]> {
  const results: SmokeTestResult[] = [];
  const industryKeys = getAllIndustryKeys();
  
  console.log(`\nRunning smoke tests for ${industryKeys.length} templates...\n`);
  
  try {
    const dbTemplates = await db.select().from(botTemplates);
    const dbTemplateMap = new Map(dbTemplates.map(t => [t.templateId, t]));
    
    for (const industryKey of industryKeys) {
      const dbTemplateId = getDbTemplateId(industryKey);
      const dbTemplate = dbTemplateMap.get(dbTemplateId);
      const errors: string[] = [];
      
      if (!dbTemplate) {
        results.push({
          industryKey,
          dbTemplateId,
          validationPassed: false,
          provisioningPassed: false,
          errors: [`Template '${dbTemplateId}' not found in database`],
        });
        console.log(`  ✗ ${industryKey}: Template not found in DB`);
        continue;
      }
      
      // Test 1: Validation
      const validation = validateTemplateForProvisioning(dbTemplate as any);
      if (!validation.valid) {
        errors.push(...validation.errors);
      }
      
      // Test 2: Dry-run provisioning
      let provisioningPassed = false;
      try {
        const result = buildClientFromTemplate(dbTemplate as any, {
          clientId: `smoketest_${industryKey}`,
          clientName: `SmokeTest_${industryKey}`,
          contact: {
            phone: '555-TEST-000',
            email: `smoketest-${industryKey}@test.local`,
          },
          timezone: 'America/New_York',
        });
        
        // Check if provisioning succeeded
        if (!result.success) {
          errors.push(`Provisioning failed: ${result.error}`);
        } else {
          const data = result.data;
          
          // Validate result has required fields
          if (!data.botConfig) {
            errors.push('Missing botConfig in provisioning result');
          } else {
            // Check critical botConfig fields
            if (!data.botConfig.name) errors.push('Missing botConfig.name');
            if (!data.botConfig.systemPrompt) errors.push('Missing botConfig.systemPrompt');
            if (!data.botConfig.botType) errors.push('Missing botConfig.botType');
          }
          
          if (!data.clientSettingsSeed) {
            errors.push('Missing clientSettingsSeed');
          }
          
          if (!data.bookingProfileSeed) {
            errors.push('Missing bookingProfileSeed');
          } else {
            // Validate booking profile has required mode
            const bp = data.bookingProfileSeed;
            if (!bp.mode) errors.push('Missing bookingProfileSeed.mode');
          }
        }
        
        provisioningPassed = errors.length === 0;
      } catch (err: any) {
        errors.push(`Provisioning error: ${err.message}`);
        provisioningPassed = false;
      }
      
      results.push({
        industryKey,
        dbTemplateId,
        validationPassed: validation.valid,
        provisioningPassed,
        errors,
      });
      
      const status = validation.valid && provisioningPassed ? '✓' : '✗';
      console.log(`  ${status} ${industryKey} -> ${dbTemplateId}`);
      if (errors.length > 0) {
        for (const e of errors) {
          console.log(`      - ${e}`);
        }
      }
    }
    
  } catch (error: any) {
    console.error('Database connection error:', error.message);
    process.exit(1);
  }
  
  return results;
}

function printSummary(results: SmokeTestResult[]): void {
  console.log('\n========================================');
  console.log('  PROVISIONING SMOKE TEST SUMMARY');
  console.log('========================================\n');
  
  const validationPassed = results.filter(r => r.validationPassed);
  const provisioningPassed = results.filter(r => r.provisioningPassed);
  const fullyPassed = results.filter(r => r.validationPassed && r.provisioningPassed);
  const failed = results.filter(r => !r.validationPassed || !r.provisioningPassed);
  
  console.log(`  Total templates:        ${INDUSTRY_TEMPLATE_COUNT}`);
  console.log(`  Validation passed:      ${validationPassed.length}/${INDUSTRY_TEMPLATE_COUNT}`);
  console.log(`  Provisioning passed:    ${provisioningPassed.length}/${INDUSTRY_TEMPLATE_COUNT}`);
  console.log(`  Fully passed:           ${fullyPassed.length}/${INDUSTRY_TEMPLATE_COUNT}`);
  console.log(`  Failed:                 ${failed.length}`);
  console.log('');
  
  if (failed.length > 0) {
    console.log('Failed templates:');
    for (const r of failed) {
      console.log(`  - ${r.industryKey}:`);
      for (const e of r.errors) {
        console.log(`      ${e}`);
      }
    }
    console.log('');
  }
  
  console.log('========================================');
  if (failed.length === 0) {
    console.log(`  ✓ ALL ${INDUSTRY_TEMPLATE_COUNT} TEMPLATES PASSED SMOKE TEST`);
  } else {
    console.log(`  ✗ ${failed.length} TEMPLATE(S) FAILED`);
  }
  console.log('========================================\n');
}

async function main(): Promise<void> {
  console.log('========================================');
  console.log('  PROVISIONING SMOKE TEST');
  console.log('========================================');
  
  const results = await runSmokeTests();
  printSummary(results);
  
  const failed = results.filter(r => !r.validationPassed || !r.provisioningPassed);
  process.exit(failed.length > 0 ? 1 : 0);
}

main().catch(err => {
  console.error('Script error:', err);
  process.exit(1);
});

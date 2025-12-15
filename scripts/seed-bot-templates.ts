/**
 * Bot Templates Seed Script
 * 
 * Idempotent upsert of all INDUSTRY_TEMPLATES into the bot_templates database table.
 * Safe to run multiple times - will update existing records and insert missing ones.
 * 
 * Usage:
 *   npx tsx scripts/seed-bot-templates.ts
 */

import { db } from '../server/storage';
import { botTemplates } from '../shared/schema';
import { INDUSTRY_TEMPLATES, type IndustryTemplate } from '../server/industryTemplates';
import { getDbTemplateId, getAllIndustryKeys, INDUSTRY_TEMPLATE_COUNT } from '../server/templates/templateIdMap';
import { sql } from 'drizzle-orm';

interface SeedResult {
  industryKey: string;
  templateId: string;
  action: 'inserted' | 'updated' | 'error';
  error?: string;
}

function buildDefaultConfig(template: IndustryTemplate): Record<string, any> {
  return {
    businessProfile: template.defaultConfig.businessProfile,
    systemPrompt: template.defaultConfig.systemPromptIntro,
    faqs: template.defaultConfig.faqs,
    rules: {},
    automations: {},
    theme: template.defaultConfig.theme,
    personality: template.defaultConfig.personality,
    bookingProfile: template.bookingProfile,
    ctaButtons: template.ctaButtons,
    disclaimer: template.disclaimer,
  };
}

async function seedBotTemplates(): Promise<SeedResult[]> {
  const results: SeedResult[] = [];
  const industryKeys = getAllIndustryKeys();
  
  console.log(`\nSeeding ${industryKeys.length} templates...\n`);
  
  for (const industryKey of industryKeys) {
    const templateId = getDbTemplateId(industryKey);
    const template = INDUSTRY_TEMPLATES[industryKey];
    
    if (!template) {
      results.push({
        industryKey,
        templateId,
        action: 'error',
        error: 'Template not found in INDUSTRY_TEMPLATES',
      });
      continue;
    }
    
    try {
      // Check if template exists
      const existing = await db
        .select({ id: botTemplates.id })
        .from(botTemplates)
        .where(sql`${botTemplates.templateId} = ${templateId}`)
        .limit(1);
      
      const defaultConfig = buildDefaultConfig(template);
      
      if (existing.length > 0) {
        // Update existing template
        await db
          .update(botTemplates)
          .set({
            name: template.name,
            description: template.description,
            botType: template.botType,
            icon: template.icon,
            defaultConfig: defaultConfig as any,
            isActive: true,
            updatedAt: new Date(),
          })
          .where(sql`${botTemplates.templateId} = ${templateId}`);
        
        results.push({
          industryKey,
          templateId,
          action: 'updated',
        });
        console.log(`  ✓ Updated: ${industryKey} -> ${templateId}`);
      } else {
        // Insert new template
        await db.insert(botTemplates).values({
          templateId,
          name: template.name,
          description: template.description,
          botType: template.botType,
          icon: template.icon,
          defaultConfig: defaultConfig as any,
          isActive: true,
          displayOrder: industryKeys.indexOf(industryKey),
        });
        
        results.push({
          industryKey,
          templateId,
          action: 'inserted',
        });
        console.log(`  + Inserted: ${industryKey} -> ${templateId}`);
      }
    } catch (error: any) {
      results.push({
        industryKey,
        templateId,
        action: 'error',
        error: error.message,
      });
      console.error(`  ✗ Error: ${industryKey} -> ${error.message}`);
    }
  }
  
  return results;
}

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
  
  const results = await seedBotTemplates();
  printSummary(results);
  
  const errors = results.filter(r => r.action === 'error');
  process.exit(errors.length > 0 ? 1 : 0);
}

main().catch(err => {
  console.error('Script error:', err);
  process.exit(1);
});

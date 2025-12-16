/**
 * Template Seeding Library
 * 
 * Provides idempotent template seeding for boot-time initialization.
 * Ensures all INDUSTRY_TEMPLATES are present in the bot_templates database table.
 * 
 * Used by:
 * - Server startup (routes.ts)
 * - Manual seed script (scripts/seed-bot-templates.ts)
 */

import { db } from '../storage';
import { botTemplates } from '../../shared/schema';
import { INDUSTRY_TEMPLATES, type IndustryTemplate } from '../industryTemplates';
import { getDbTemplateId, getAllIndustryKeys, INDUSTRY_TEMPLATE_COUNT } from './templateIdMap';
import { sql } from 'drizzle-orm';
import { structuredLogger } from '../structuredLogger';

export interface SeedResult {
  industryKey: string;
  templateId: string;
  action: 'inserted' | 'updated' | 'error';
  error?: string;
}

export interface EnsureTemplatesResult {
  seeded: number;
  updated: number;
  skipped: boolean;
  error?: string;
  results: SeedResult[];
}

/**
 * Build default config object from an IndustryTemplate.
 */
export function buildDefaultConfig(template: IndustryTemplate): Record<string, any> {
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
    servicesCatalog: template.servicesCatalog || [],
  };
}

/**
 * Seed all INDUSTRY_TEMPLATES to the database.
 * 
 * @param verbose - If true, logs each template action (for CLI use)
 * @returns Array of SeedResult for each template
 */
export async function seedAllTemplates(verbose: boolean = false): Promise<SeedResult[]> {
  const results: SeedResult[] = [];
  const industryKeys = getAllIndustryKeys();
  
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
      const existing = await db
        .select({ id: botTemplates.id })
        .from(botTemplates)
        .where(sql`${botTemplates.templateId} = ${templateId}`)
        .limit(1);
      
      const defaultConfig = buildDefaultConfig(template);
      
      if (existing.length > 0) {
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
        
        results.push({ industryKey, templateId, action: 'updated' });
        if (verbose) {
          console.log(`  ✓ Updated: ${industryKey} -> ${templateId}`);
        }
      } else {
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
        
        results.push({ industryKey, templateId, action: 'inserted' });
        if (verbose) {
          console.log(`  + Inserted: ${industryKey} -> ${templateId}`);
        }
      }
    } catch (error: any) {
      results.push({
        industryKey,
        templateId,
        action: 'error',
        error: error.message,
      });
      if (verbose) {
        console.error(`  ✗ Error: ${industryKey} -> ${error.message}`);
      }
    }
  }
  
  return results;
}

/**
 * Ensure all templates are seeded in the database.
 * 
 * Boot-time safe: checks current count first, only seeds if needed.
 * Non-blocking: logs result, catches errors, never crashes.
 * 
 * @returns Summary of seeding operation
 */
export async function ensureTemplatesSeeded(): Promise<EnsureTemplatesResult> {
  try {
    // Check current active template count
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(botTemplates)
      .where(sql`${botTemplates.isActive} = true`);
    
    const currentCount = Number(countResult[0]?.count ?? 0);
    
    // Always update templates to ensure they have latest config (including servicesCatalog)
    // This ensures template changes are propagated to the database
    if (currentCount >= INDUSTRY_TEMPLATE_COUNT) {
      structuredLogger.info(`[templates] updating existing templates (count=${currentCount})`);
      const results = await seedAllTemplates(false);
      const updatedCount = results.filter(r => r.action === 'updated').length;
      structuredLogger.info(`[templates] updated ${updatedCount} templates with latest config`);
      return {
        seeded: updatedCount,
        updated: 0,
        skipped: true,
        results: [],
      };
    }
    
    // Seed missing templates
    const results = await seedAllTemplates(false);
    
    const inserted = results.filter(r => r.action === 'inserted');
    const updated = results.filter(r => r.action === 'updated');
    const errors = results.filter(r => r.action === 'error');
    
    if (errors.length > 0) {
      const errorMsg = errors.map(e => `${e.industryKey}: ${e.error}`).join('; ');
      structuredLogger.error(`[templates] seeding errors: ${errorMsg}`);
      return {
        seeded: inserted.length,
        updated: updated.length,
        skipped: false,
        error: errorMsg,
        results,
      };
    }
    
    structuredLogger.info(`[templates] seeded ${inserted.length} templates, updated ${updated.length}`);
    return {
      seeded: inserted.length,
      updated: updated.length,
      skipped: false,
      results,
    };
  } catch (error: any) {
    structuredLogger.error(`[templates] seeding failed: ${error.message}`);
    return {
      seeded: 0,
      updated: 0,
      skipped: false,
      error: error.message,
      results: [],
    };
  }
}

/**
 * Get the expected template count.
 */
export { INDUSTRY_TEMPLATE_COUNT };

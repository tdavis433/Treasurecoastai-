/**
 * Template System - Centralized exports
 * 
 * The bot_templates database table is the ONLY runtime source of truth.
 * INDUSTRY_TEMPLATES in industryTemplates.ts is for seeding only.
 */

export {
  buildClientFromTemplate,
  validateTemplateForProvisioning,
  type TemplateOverrides,
  type ClientSettingsSeed,
  type WidgetSettingsSeed,
  type BookingProfileSeed,
  type BuildResult,
  type BuildClientResult,
} from './buildClientFromTemplate';

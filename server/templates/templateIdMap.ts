/**
 * Template ID Mapping Utility
 * 
 * Provides a canonical mapping between INDUSTRY_TEMPLATES keys and database template_id values.
 * This is the SINGLE SOURCE OF TRUTH for template ID resolution across:
 * - Seed scripts
 * - Validation scripts
 * - Provisioning helpers
 * 
 * Rule: All DB template_id values end with "_template" suffix for consistency.
 */

import { INDUSTRY_TEMPLATES } from '../industryTemplates';

/**
 * Maps an INDUSTRY_TEMPLATES key to its corresponding database template_id.
 * 
 * @param industryKey - Key from INDUSTRY_TEMPLATES (e.g., "restaurant", "sober_living")
 * @returns Database template_id with "_template" suffix (e.g., "restaurant_template")
 */
export function getDbTemplateId(industryKey: string): string {
  // Special case: "auto" maps to "auto_shop_template" (legacy DB naming)
  if (industryKey === 'auto') {
    return 'auto_shop_template';
  }
  return `${industryKey}_template`;
}

/**
 * Maps a database template_id back to its INDUSTRY_TEMPLATES key.
 * 
 * @param dbTemplateId - Database template_id (e.g., "restaurant_template")
 * @returns INDUSTRY_TEMPLATES key (e.g., "restaurant") or null if not found
 */
export function getIndustryKey(dbTemplateId: string): string | null {
  // Special case: "auto_shop_template" maps back to "auto"
  if (dbTemplateId === 'auto_shop_template') {
    return 'auto';
  }
  
  // Remove "_template" suffix
  const key = dbTemplateId.replace(/_template$/, '');
  
  // Verify it exists in INDUSTRY_TEMPLATES
  if (key in INDUSTRY_TEMPLATES) {
    return key;
  }
  
  return null;
}

/**
 * Get all industry keys from INDUSTRY_TEMPLATES.
 */
export function getAllIndustryKeys(): string[] {
  return Object.keys(INDUSTRY_TEMPLATES);
}

/**
 * Get the full mapping of industry keys to DB template IDs.
 */
export function getTemplateIdMap(): Record<string, string> {
  const map: Record<string, string> = {};
  for (const key of getAllIndustryKeys()) {
    map[key] = getDbTemplateId(key);
  }
  return map;
}

/**
 * Total count of INDUSTRY_TEMPLATES.
 */
export const INDUSTRY_TEMPLATE_COUNT = Object.keys(INDUSTRY_TEMPLATES).length;

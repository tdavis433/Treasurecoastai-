/**
 * buildClientFromTemplate - Centralized helper for creating clients from database templates
 * 
 * This is the ONLY source of truth for template-to-client provisioning.
 * All template creation endpoints MUST use this helper.
 * 
 * GUARDRAILS:
 * - NO payment processing
 * - External booking = redirect only
 * - Fail loudly on missing required fields
 * - businessName ALWAYS synced to clientName
 */

import { BotTemplate, BookingProfile, BehaviorPreset, BEHAVIOR_PRESETS } from '@shared/schema';
import type { BotConfig, BotFaq, BotPersonality, BotBusinessProfile, BotAutomationConfig } from '../botConfig';

// ============================================================================
// TYPES
// ============================================================================

export interface TemplateOverrides {
  clientId: string;
  clientName: string;
  botId?: string; // If not provided, generated as `${clientId}_main`
  businessProfile?: Partial<BotBusinessProfile>;
  customFaqs?: BotFaq[];
  contact?: {
    phone?: string;
    email?: string;
  };
  plan?: 'free' | 'starter' | 'pro' | 'enterprise';
  externalBookingUrl?: string;
  behaviorPreset?: BehaviorPreset;
  timezone?: string;
}

export interface ClientSettingsSeed {
  clientId: string;
  businessName: string;
  businessType: string;
  primaryPhone: string;
  primaryEmail: string;
  websiteUrl: string;
  timezone: string;
  externalBookingUrl?: string;
  behaviorPreset: BehaviorPreset;
  leadDetectionSensitivity: 'low' | 'medium' | 'high';
  status: 'active' | 'pending' | 'suspended';
}

export interface WidgetSettingsSeed {
  primaryColor: string;
  position: 'bottom-right' | 'bottom-left';
  theme: 'light' | 'dark' | 'auto';
  welcomeMessage: string;
  ctaButtons: Array<{
    id: string;
    label: string;
    prompt: string;
    isPrimary?: boolean;
  }>;
  disclaimer?: string;
}

export interface BookingProfileSeed {
  mode: 'internal' | 'external';
  externalUrl?: string;
  failsafeEnabled: boolean;
  appointmentTypes?: Array<{
    id: string;
    label: string;
    mode: 'internal' | 'external';
  }>;
}

export interface BuildResult {
  botConfig: BotConfig;
  clientSettingsSeed: ClientSettingsSeed;
  widgetSettingsSeed: WidgetSettingsSeed;
  bookingProfileSeed: BookingProfileSeed;
  faqSeed: BotFaq[];
}

export interface BuildError {
  success: false;
  error: string;
  code: 'MISSING_TEMPLATE' | 'MISSING_REQUIRED_FIELD' | 'INVALID_TEMPLATE_CONFIG';
}

export type BuildClientResult = 
  | { success: true; data: BuildResult }
  | BuildError;

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Normalize FAQ question for deduplication
 */
function normalizeFaqQuestion(question: string): string {
  return question
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Merge FAQs with deduplication by normalized question
 * Template FAQs come first, custom FAQs override matching ones
 */
function mergeFaqs(templateFaqs: BotFaq[], customFaqs: BotFaq[]): BotFaq[] {
  const faqMap = new Map<string, BotFaq>();
  
  // Add template FAQs first
  for (const faq of templateFaqs) {
    const key = normalizeFaqQuestion(faq.question);
    faqMap.set(key, faq);
  }
  
  // Custom FAQs override matching template FAQs
  for (const faq of customFaqs) {
    const key = normalizeFaqQuestion(faq.question);
    faqMap.set(key, faq);
  }
  
  return Array.from(faqMap.values());
}

/**
 * Get behavior preset defaults
 * Maps preset to appropriate lead detection sensitivity
 */
function getBehaviorPresetDefaults(preset: BehaviorPreset): {
  leadDetectionSensitivity: 'low' | 'medium' | 'high';
} {
  // Map presets to lead detection sensitivity
  const sensitivityMap: Record<BehaviorPreset, 'low' | 'medium' | 'high'> = {
    'support_lead_focused': 'medium',
    'sales_focused_soft': 'high',
    'support_only': 'low',
    'compliance_strict': 'low',
    'sales_heavy': 'high',
  };
  
  return {
    leadDetectionSensitivity: sensitivityMap[preset] || 'medium',
  };
}

/**
 * Extract booking profile from template config
 */
function extractBookingProfile(templateConfig: BotTemplate['defaultConfig'], externalUrl?: string): BookingProfileSeed {
  const bookingProfile = templateConfig.bookingProfile;
  
  if (!bookingProfile) {
    // Default to internal mode with failsafe enabled
    return {
      mode: 'internal',
      failsafeEnabled: true,
    };
  }
  
  return {
    mode: bookingProfile.defaultMode || 'internal',
    externalUrl: externalUrl,
    failsafeEnabled: bookingProfile.failsafe?.externalMissingUrlBehavior === 'pivot_to_internal',
    appointmentTypes: bookingProfile.appointmentTypes?.map(apt => ({
      id: apt.id,
      label: apt.label,
      mode: apt.mode,
    })),
  };
}

/**
 * Extract widget settings from template
 */
function extractWidgetSettings(templateConfig: BotTemplate['defaultConfig'], disclaimer?: string): WidgetSettingsSeed {
  const theme = templateConfig.theme || {};
  
  return {
    primaryColor: theme.primaryColor || '#00E5CC',
    position: 'bottom-right',
    theme: 'auto',
    welcomeMessage: theme.welcomeMessage || 'Hi! How can I help you today?',
    ctaButtons: templateConfig.bookingProfile?.ctas?.map(cta => ({
      id: cta.id,
      label: cta.label,
      prompt: cta.appointmentTypeId ? `I'd like to ${cta.label.toLowerCase()}` : '',
      isPrimary: cta.kind === 'primary',
    })) || [],
    disclaimer: disclaimer,
  };
}

// ============================================================================
// MAIN BUILDER
// ============================================================================

/**
 * Build a complete client configuration from a database template
 * 
 * @param templateRow - The bot_templates row from the database
 * @param overrides - Client-specific overrides
 * @returns BuildClientResult with all seeds needed for client provisioning
 */
export function buildClientFromTemplate(
  templateRow: BotTemplate | null,
  overrides: TemplateOverrides
): BuildClientResult {
  // Validate template exists
  if (!templateRow) {
    return {
      success: false,
      error: 'Template not found in database',
      code: 'MISSING_TEMPLATE',
    };
  }
  
  // Validate required overrides
  if (!overrides.clientId) {
    return {
      success: false,
      error: 'clientId is required',
      code: 'MISSING_REQUIRED_FIELD',
    };
  }
  
  if (!overrides.clientName) {
    return {
      success: false,
      error: 'clientName is required',
      code: 'MISSING_REQUIRED_FIELD',
    };
  }
  
  // Validate template config exists
  const templateConfig = templateRow.defaultConfig;
  if (!templateConfig) {
    return {
      success: false,
      error: 'Template has no default configuration',
      code: 'INVALID_TEMPLATE_CONFIG',
    };
  }
  
  // Generate bot ID if not provided
  const botId = overrides.botId || `${overrides.clientId}_main`;
  
  // Merge business profile - ALWAYS enforce businessName = clientName
  const mergedBusinessProfile: BotBusinessProfile = {
    businessName: overrides.clientName, // ALWAYS sync to clientName
    type: templateConfig.businessProfile?.type || 'general',
    location: overrides.businessProfile?.location || '',
    phone: overrides.contact?.phone || overrides.businessProfile?.phone || '',
    email: overrides.contact?.email || overrides.businessProfile?.email || '',
    website: overrides.businessProfile?.website || '',
    hours: overrides.businessProfile?.hours || {},
    services: templateConfig.businessProfile?.services || [],
    ...overrides.businessProfile,
    // Re-apply businessName to ensure it's always clientName
    // (in case overrides.businessProfile had a different businessName)
  };
  // Explicitly re-set businessName to prevent accidental override
  mergedBusinessProfile.businessName = overrides.clientName;
  
  // Merge FAQs with deduplication
  const templateFaqs = templateConfig.faqs || [];
  const customFaqs = overrides.customFaqs || [];
  const mergedFaqs = mergeFaqs(templateFaqs, customFaqs);
  
  // Get behavior preset (default to support_lead_focused)
  const behaviorPreset = overrides.behaviorPreset || 'support_lead_focused';
  const presetDefaults = getBehaviorPresetDefaults(behaviorPreset);
  
  // Build personality from template
  const personality: BotPersonality = {
    tone: templateConfig.personality?.tone || 'friendly',
    formality: templateConfig.personality?.formality ?? 50,
  };
  
  // Build automations from template
  const automations: BotAutomationConfig = {
    ...templateConfig.automations,
    bookingCapture: {
      enabled: true,
      mode: templateConfig.bookingProfile?.defaultMode || 'internal',
      externalUrl: overrides.externalBookingUrl,
      failsafeEnabled: true,
    },
  };
  
  // Build the bot config
  const botConfig: BotConfig = {
    clientId: overrides.clientId,
    botId: botId,
    name: overrides.clientName,
    description: `AI assistant for ${overrides.clientName}`,
    businessProfile: mergedBusinessProfile,
    rules: {
      allowedTopics: templateConfig.rules?.allowedTopics || [],
      forbiddenTopics: templateConfig.rules?.forbiddenTopics || [],
      crisisHandling: templateConfig.rules?.crisisHandling || {
        onCrisisKeywords: [],
        responseTemplate: 'If you are in crisis, please call 911 or your local emergency number.',
      },
    },
    systemPrompt: templateConfig.systemPrompt || '',
    faqs: mergedFaqs,
    automations,
    personality,
    quickActions: [],
    externalBookingUrl: overrides.externalBookingUrl,
    botType: templateRow.botType,
    metadata: {
      isDemo: false,
      isTemplate: false,
      clonedFrom: templateRow.templateId,
      createdAt: new Date().toISOString().split('T')[0],
      version: '2.0',
      industryTemplate: templateRow.templateId,
      onboardingStatus: 'draft',
    },
  };
  
  // Build client settings seed
  const clientSettingsSeed: ClientSettingsSeed = {
    clientId: overrides.clientId,
    businessName: overrides.clientName,
    businessType: templateConfig.businessProfile?.type || 'general',
    primaryPhone: overrides.contact?.phone || '',
    primaryEmail: overrides.contact?.email || '',
    websiteUrl: overrides.businessProfile?.website || '',
    timezone: overrides.timezone || 'America/New_York',
    externalBookingUrl: overrides.externalBookingUrl,
    behaviorPreset: behaviorPreset,
    leadDetectionSensitivity: presetDefaults.leadDetectionSensitivity,
    status: 'active',
  };
  
  // Extract widget settings
  const widgetSettingsSeed = extractWidgetSettings(
    templateConfig,
    templateConfig.bookingProfile?.disclaimers?.text
  );
  
  // Extract booking profile
  const bookingProfileSeed = extractBookingProfile(
    templateConfig,
    overrides.externalBookingUrl
  );
  
  return {
    success: true,
    data: {
      botConfig,
      clientSettingsSeed,
      widgetSettingsSeed,
      bookingProfileSeed,
      faqSeed: mergedFaqs,
    },
  };
}

/**
 * Validate a template row has all required fields for provisioning
 */
export function validateTemplateForProvisioning(templateRow: BotTemplate | null): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (!templateRow) {
    return { valid: false, errors: ['Template not found'] };
  }
  
  if (!templateRow.templateId) {
    errors.push('Template missing templateId');
  }
  
  if (!templateRow.defaultConfig) {
    errors.push('Template missing defaultConfig');
  } else {
    if (!templateRow.defaultConfig.businessProfile) {
      errors.push('Template missing businessProfile in defaultConfig');
    }
    if (!templateRow.defaultConfig.systemPrompt) {
      errors.push('Template missing systemPrompt in defaultConfig');
    }
  }
  
  if (!templateRow.botType) {
    errors.push('Template missing botType');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

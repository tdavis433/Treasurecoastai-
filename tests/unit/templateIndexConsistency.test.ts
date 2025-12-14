/**
 * Template Index Consistency Tests
 * 
 * Verifies that the INDUSTRY_TEMPLATES constant and expected DB templates
 * are properly aligned and have consistent structure.
 */

import { describe, it, expect } from 'vitest';
import { INDUSTRY_TEMPLATES, type IndustryTemplate } from '../../server/industryTemplates';

const EXPECTED_TEMPLATE_IDS = [
  'sober_living',
  'restaurant',
  'dental',
  'law_firm',
  'barber',
  'med_spa',
  'real_estate',
  'gym',
  'auto',
  'roofing',
  'wedding',
  'hotel',
  'pet_grooming',
  'tattoo',
  'home_services',
];

describe('INDUSTRY_TEMPLATES Index', () => {
  describe('Template Coverage', () => {
    it('has all expected core templates defined', () => {
      for (const templateId of EXPECTED_TEMPLATE_IDS) {
        expect(INDUSTRY_TEMPLATES[templateId]).toBeDefined();
      }
    });

    it('each template has matching id and key', () => {
      for (const [key, template] of Object.entries(INDUSTRY_TEMPLATES)) {
        expect(template.id).toBe(key);
      }
    });
  });

  describe('Template Structure Validation', () => {
    const templateEntries = Object.entries(INDUSTRY_TEMPLATES);

    it.each(templateEntries)('%s has required name field', (id, template) => {
      expect(template.name).toBeDefined();
      expect(template.name.length).toBeGreaterThan(0);
    });

    it.each(templateEntries)('%s has valid botType', (id, template) => {
      expect(template.botType).toBeDefined();
      expect(template.botType.length).toBeGreaterThan(0);
    });

    it.each(templateEntries)('%s has valid icon name', (id, template) => {
      expect(template.icon).toBeDefined();
      expect(template.icon.length).toBeGreaterThan(0);
    });

    it.each(templateEntries)('%s has description', (id, template) => {
      expect(template.description).toBeDefined();
      expect(template.description.length).toBeGreaterThan(10);
    });
  });

  describe('Booking Profile Validation', () => {
    const templateEntries = Object.entries(INDUSTRY_TEMPLATES);

    it.each(templateEntries)('%s has valid booking profile mode', (id, template) => {
      expect(['internal', 'external']).toContain(template.bookingProfile.mode);
    });

    it.each(templateEntries)('%s has valid primary CTA', (id, template) => {
      const validCTAs = ['tour', 'consult', 'book', 'reserve', 'estimate', 'call'];
      expect(validCTAs).toContain(template.bookingProfile.primaryCTA);
    });

    it.each(templateEntries)('%s has failsafe enabled', (id, template) => {
      expect(template.bookingProfile.failsafeEnabled).toBe(true);
    });
  });

  describe('CTA Buttons Validation', () => {
    const templateEntries = Object.entries(INDUSTRY_TEMPLATES);

    it.each(templateEntries)('%s has at least one CTA button', (id, template) => {
      expect(template.ctaButtons.length).toBeGreaterThan(0);
    });

    it.each(templateEntries)('%s has a primary CTA button', (id, template) => {
      const hasPrimary = template.ctaButtons.some(cta => cta.isPrimary === true);
      expect(hasPrimary).toBe(true);
    });

    it.each(templateEntries)('%s CTA buttons have valid structure', (id, template) => {
      for (const cta of template.ctaButtons) {
        expect(cta.id).toBeDefined();
        expect(cta.label).toBeDefined();
        expect(cta.prompt).toBeDefined();
        expect(cta.label.length).toBeGreaterThan(0);
        expect(cta.prompt.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Disclaimer Validation', () => {
    const templateEntries = Object.entries(INDUSTRY_TEMPLATES);

    it.each(templateEntries)('%s has a disclaimer', (id, template) => {
      expect(template.disclaimer).toBeDefined();
      expect(template.disclaimer.length).toBeGreaterThan(20);
    });

    it('sober_living has crisis/emergency language in disclaimer', () => {
      const template = INDUSTRY_TEMPLATES['sober_living'];
      const disclaimerLower = template.disclaimer.toLowerCase();
      expect(
        disclaimerLower.includes('crisis') ||
        disclaimerLower.includes('emergency') ||
        disclaimerLower.includes('911')
      ).toBe(true);
    });

    it('law_firm has legal advice disclaimer', () => {
      const template = INDUSTRY_TEMPLATES['law_firm'];
      const disclaimerLower = template.disclaimer.toLowerCase();
      expect(disclaimerLower.includes('legal advice')).toBe(true);
    });

    it('dental has medical/emergency language in disclaimer', () => {
      const template = INDUSTRY_TEMPLATES['dental'];
      const disclaimerLower = template.disclaimer.toLowerCase();
      expect(
        disclaimerLower.includes('medical') ||
        disclaimerLower.includes('emergency') ||
        disclaimerLower.includes('911')
      ).toBe(true);
    });
  });

  describe('Default Config Validation', () => {
    const templateEntries = Object.entries(INDUSTRY_TEMPLATES);

    it.each(templateEntries)('%s has businessProfile in defaultConfig', (id, template) => {
      expect(template.defaultConfig.businessProfile).toBeDefined();
      expect(template.defaultConfig.businessProfile.type).toBeDefined();
    });

    it.each(templateEntries)('%s has services array', (id, template) => {
      expect(Array.isArray(template.defaultConfig.businessProfile.services)).toBe(true);
      expect(template.defaultConfig.businessProfile.services.length).toBeGreaterThan(0);
    });

    it.each(templateEntries)('%s has systemPromptIntro', (id, template) => {
      expect(template.defaultConfig.systemPromptIntro).toBeDefined();
      expect(template.defaultConfig.systemPromptIntro.length).toBeGreaterThan(20);
    });

    it.each(templateEntries)('%s has FAQs array', (id, template) => {
      expect(Array.isArray(template.defaultConfig.faqs)).toBe(true);
    });

    it.each(templateEntries)('%s has valid personality settings', (id, template) => {
      const personality = template.defaultConfig.personality;
      expect(personality.tone).toBeDefined();
      expect(['professional', 'friendly', 'casual', 'compassionate', 'informative']).toContain(personality.tone);
      expect(personality.formality).toBeGreaterThanOrEqual(0);
      expect(personality.formality).toBeLessThanOrEqual(100);
    });

    it.each(templateEntries)('%s has theme with primaryColor', (id, template) => {
      expect(template.defaultConfig.theme.primaryColor).toBeDefined();
      expect(template.defaultConfig.theme.primaryColor).toMatch(/^#[0-9A-Fa-f]{6}$/);
    });

    it.each(templateEntries)('%s has theme with welcomeMessage', (id, template) => {
      expect(template.defaultConfig.theme.welcomeMessage).toBeDefined();
      expect(template.defaultConfig.theme.welcomeMessage.length).toBeGreaterThan(5);
    });
  });

  describe('Template ID Uniqueness', () => {
    it('all template IDs are unique', () => {
      const ids = Object.values(INDUSTRY_TEMPLATES).map(t => t.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('all template botTypes are defined', () => {
      for (const template of Object.values(INDUSTRY_TEMPLATES)) {
        expect(template.botType).toBeDefined();
        expect(typeof template.botType).toBe('string');
      }
    });
  });

  describe('No Payment Fields in Templates', () => {
    it('no template mentions payment processing in system prompt', () => {
      for (const [id, template] of Object.entries(INDUSTRY_TEMPLATES)) {
        const promptLower = template.defaultConfig.systemPromptIntro.toLowerCase();
        expect(promptLower).not.toContain('process payment');
        expect(promptLower).not.toContain('credit card');
        expect(promptLower).not.toContain('collect payment');
      }
    });

    it('no CTA button prompts mention payment processing', () => {
      for (const [id, template] of Object.entries(INDUSTRY_TEMPLATES)) {
        for (const cta of template.ctaButtons) {
          const promptLower = cta.prompt.toLowerCase();
          expect(promptLower).not.toContain('credit card');
          expect(promptLower).not.toContain('process payment');
          expect(promptLower).not.toContain('collect payment');
          expect(promptLower).not.toContain('card number');
        }
      }
    });
  });
});

describe('Template External Mode Consistency', () => {
  const externalModeTemplates = Object.entries(INDUSTRY_TEMPLATES)
    .filter(([_, t]) => t.bookingProfile.mode === 'external');
  
  const internalModeTemplates = Object.entries(INDUSTRY_TEMPLATES)
    .filter(([_, t]) => t.bookingProfile.mode === 'internal');

  it('external mode templates have common booking providers listed', () => {
    for (const [id, template] of externalModeTemplates) {
      if (template.bookingProfile.externalProviders) {
        expect(template.bookingProfile.externalProviders.length).toBeGreaterThan(0);
      }
    }
  });

  it('internal mode templates are appropriate for sensitive industries', () => {
    const sensitiveTypes = ['sober_living', 'law_firm'];
    for (const type of sensitiveTypes) {
      const template = INDUSTRY_TEMPLATES[type];
      if (template) {
        expect(template.bookingProfile.mode).toBe('internal');
      }
    }
  });

  it('all templates have failsafe enabled regardless of mode', () => {
    for (const [id, template] of Object.entries(INDUSTRY_TEMPLATES)) {
      expect(template.bookingProfile.failsafeEnabled).toBe(true);
    }
  });
});

/**
 * Template Provisioning Tests
 * 
 * Tests the buildClientFromTemplate helper to ensure consistent
 * client provisioning from database templates.
 */

import { describe, it, expect } from 'vitest';
import {
  buildClientFromTemplate,
  validateTemplateForProvisioning,
  type TemplateOverrides,
} from '../../server/templates';
import type { BotTemplate } from '../../shared/schema';

const createMockTemplate = (overrides: Partial<BotTemplate> = {}): BotTemplate => ({
  id: 'test-uuid-123',
  templateId: 'test_template',
  name: 'Test Template',
  description: 'A test template',
  botType: 'general',
  icon: 'Building',
  previewImage: null,
  defaultConfig: {
    businessProfile: {
      type: 'general',
      services: ['Service 1', 'Service 2'],
    },
    systemPrompt: 'You are a helpful AI assistant.',
    personality: {
      tone: 'friendly',
      formality: 50,
    },
    faqs: [
      { question: 'What are your hours?', answer: 'We are open 9-5 M-F.' },
      { question: 'Where are you located?', answer: 'Downtown area.' },
    ],
    rules: {
      allowedTopics: ['general inquiries'],
      forbiddenTopics: ['competitor information'],
    },
    theme: {
      primaryColor: '#00E5CC',
      welcomeMessage: 'Hello! How can I help?',
    },
    bookingProfile: {
      defaultMode: 'internal',
      appointmentTypes: [
        { id: 'consult', label: 'Consultation', mode: 'internal', intakeFields: [], confirmationMessage: 'Thank you for booking.' },
      ],
      ctas: [
        { id: 'book', label: 'Book Now', kind: 'primary', appointmentTypeId: 'consult' },
      ],
      failsafe: {
        externalMissingUrlBehavior: 'pivot_to_internal',
        pivotAppointmentTypeId: 'consult',
      },
    },
    automations: {},
  },
  isActive: true,
  displayOrder: 1,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

const createMockOverrides = (overrides: Partial<TemplateOverrides> = {}): TemplateOverrides => ({
  clientId: 'test_client',
  clientName: 'Test Client Business',
  ...overrides,
});

describe('buildClientFromTemplate', () => {
  describe('Validation', () => {
    it('fails when template is null', () => {
      const result = buildClientFromTemplate(null, createMockOverrides());
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.code).toBe('MISSING_TEMPLATE');
        expect(result.error).toContain('not found');
      }
    });

    it('fails when clientId is missing', () => {
      const template = createMockTemplate();
      const result = buildClientFromTemplate(template, { clientId: '', clientName: 'Test' });
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.code).toBe('MISSING_REQUIRED_FIELD');
        expect(result.error).toContain('clientId');
      }
    });

    it('fails when clientName is missing', () => {
      const template = createMockTemplate();
      const result = buildClientFromTemplate(template, { clientId: 'test', clientName: '' });
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.code).toBe('MISSING_REQUIRED_FIELD');
        expect(result.error).toContain('clientName');
      }
    });

    it('fails when template has no defaultConfig', () => {
      const template = createMockTemplate({ defaultConfig: null as any });
      const result = buildClientFromTemplate(template, createMockOverrides());
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.code).toBe('INVALID_TEMPLATE_CONFIG');
      }
    });
  });

  describe('Bot Config Generation', () => {
    it('generates valid botConfig with correct IDs', () => {
      const template = createMockTemplate();
      const overrides = createMockOverrides();
      const result = buildClientFromTemplate(template, overrides);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.botConfig.clientId).toBe('test_client');
        expect(result.data.botConfig.botId).toBe('test_client_main');
        expect(result.data.botConfig.name).toBe('Test Client Business');
      }
    });

    it('uses custom botId when provided', () => {
      const template = createMockTemplate();
      const overrides = createMockOverrides({ botId: 'custom_bot_id' });
      const result = buildClientFromTemplate(template, overrides);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.botConfig.botId).toBe('custom_bot_id');
      }
    });

    it('always syncs businessName to clientName (guardrail)', () => {
      const template = createMockTemplate();
      const overrides = createMockOverrides({
        businessProfile: {
          businessName: 'Different Name', // This should be overwritten
        },
      });
      const result = buildClientFromTemplate(template, overrides);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.botConfig.businessProfile.businessName).toBe('Test Client Business');
        expect(result.data.clientSettingsSeed.businessName).toBe('Test Client Business');
      }
    });

    it('includes template metadata with clonedFrom reference', () => {
      const template = createMockTemplate({ templateId: 'law_firm' });
      const result = buildClientFromTemplate(template, createMockOverrides());
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.botConfig.metadata?.clonedFrom).toBe('law_firm');
        expect(result.data.botConfig.metadata?.industryTemplate).toBe('law_firm');
        expect(result.data.botConfig.metadata?.isDemo).toBe(false);
        expect(result.data.botConfig.metadata?.isTemplate).toBe(false);
      }
    });
  });

  describe('FAQ Merging', () => {
    it('includes template FAQs in output', () => {
      const template = createMockTemplate();
      const result = buildClientFromTemplate(template, createMockOverrides());
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.faqSeed.length).toBeGreaterThanOrEqual(2);
        expect(result.data.faqSeed.some(f => f.question.includes('hours'))).toBe(true);
      }
    });

    it('merges custom FAQs with template FAQs', () => {
      const template = createMockTemplate();
      const overrides = createMockOverrides({
        customFaqs: [
          { question: 'Do you accept credit cards?', answer: 'Yes, all major cards.' },
        ],
      });
      const result = buildClientFromTemplate(template, overrides);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.faqSeed.length).toBeGreaterThanOrEqual(3);
        expect(result.data.faqSeed.some(f => f.question.includes('credit cards'))).toBe(true);
      }
    });

    it('deduplicates FAQs by normalized question', () => {
      const template = createMockTemplate();
      const overrides = createMockOverrides({
        customFaqs: [
          { question: 'What are your hours?', answer: 'We are open 24/7!' }, // Override template FAQ
        ],
      });
      const result = buildClientFromTemplate(template, overrides);
      
      expect(result.success).toBe(true);
      if (result.success) {
        const hoursFaqs = result.data.faqSeed.filter(f => 
          f.question.toLowerCase().includes('hours')
        );
        expect(hoursFaqs.length).toBe(1);
        expect(hoursFaqs[0].answer).toBe('We are open 24/7!'); // Custom overrides template
      }
    });
  });

  describe('Behavior Preset Mapping', () => {
    it('defaults to support_lead_focused preset', () => {
      const template = createMockTemplate();
      const result = buildClientFromTemplate(template, createMockOverrides());
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.clientSettingsSeed.behaviorPreset).toBe('support_lead_focused');
        expect(result.data.clientSettingsSeed.leadDetectionSensitivity).toBe('medium');
      }
    });

    it('maps sales_focused_soft to high sensitivity', () => {
      const template = createMockTemplate();
      const overrides = createMockOverrides({ behaviorPreset: 'sales_focused_soft' });
      const result = buildClientFromTemplate(template, overrides);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.clientSettingsSeed.behaviorPreset).toBe('sales_focused_soft');
        expect(result.data.clientSettingsSeed.leadDetectionSensitivity).toBe('high');
      }
    });

    it('maps support_only to low sensitivity', () => {
      const template = createMockTemplate();
      const overrides = createMockOverrides({ behaviorPreset: 'support_only' });
      const result = buildClientFromTemplate(template, overrides);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.clientSettingsSeed.leadDetectionSensitivity).toBe('low');
      }
    });
  });

  describe('Booking Profile Extraction', () => {
    it('extracts booking profile with correct mode', () => {
      const template = createMockTemplate();
      const result = buildClientFromTemplate(template, createMockOverrides());
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.bookingProfileSeed.mode).toBe('internal');
        expect(result.data.bookingProfileSeed.failsafeEnabled).toBe(true);
      }
    });

    it('includes external booking URL when provided', () => {
      const template = createMockTemplate();
      const overrides = createMockOverrides({
        externalBookingUrl: 'https://calendly.com/mybusiness',
      });
      const result = buildClientFromTemplate(template, overrides);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.bookingProfileSeed.externalUrl).toBe('https://calendly.com/mybusiness');
        expect(result.data.botConfig.externalBookingUrl).toBe('https://calendly.com/mybusiness');
      }
    });

    it('extracts appointment types from template', () => {
      const template = createMockTemplate();
      const result = buildClientFromTemplate(template, createMockOverrides());
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.bookingProfileSeed.appointmentTypes).toBeDefined();
        expect(result.data.bookingProfileSeed.appointmentTypes?.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Widget Settings Extraction', () => {
    it('extracts widget settings from template theme', () => {
      const template = createMockTemplate();
      const result = buildClientFromTemplate(template, createMockOverrides());
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.widgetSettingsSeed.primaryColor).toBe('#00E5CC');
        expect(result.data.widgetSettingsSeed.welcomeMessage).toBe('Hello! How can I help?');
        expect(result.data.widgetSettingsSeed.position).toBe('bottom-right');
        expect(result.data.widgetSettingsSeed.theme).toBe('auto');
      }
    });

    it('extracts CTA buttons from booking profile', () => {
      const template = createMockTemplate();
      const result = buildClientFromTemplate(template, createMockOverrides());
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.widgetSettingsSeed.ctaButtons.length).toBeGreaterThan(0);
        expect(result.data.widgetSettingsSeed.ctaButtons[0].label).toBe('Book Now');
      }
    });
  });

  describe('Contact Information', () => {
    it('includes contact info in output', () => {
      const template = createMockTemplate();
      const overrides = createMockOverrides({
        contact: {
          phone: '555-1234',
          email: 'test@example.com',
        },
      });
      const result = buildClientFromTemplate(template, overrides);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.clientSettingsSeed.primaryPhone).toBe('555-1234');
        expect(result.data.clientSettingsSeed.primaryEmail).toBe('test@example.com');
        expect(result.data.botConfig.businessProfile.phone).toBe('555-1234');
        expect(result.data.botConfig.businessProfile.email).toBe('test@example.com');
      }
    });
  });

  describe('Timezone Handling', () => {
    it('defaults to America/New_York timezone', () => {
      const template = createMockTemplate();
      const result = buildClientFromTemplate(template, createMockOverrides());
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.clientSettingsSeed.timezone).toBe('America/New_York');
      }
    });

    it('uses custom timezone when provided', () => {
      const template = createMockTemplate();
      const overrides = createMockOverrides({ timezone: 'America/Los_Angeles' });
      const result = buildClientFromTemplate(template, overrides);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.clientSettingsSeed.timezone).toBe('America/Los_Angeles');
      }
    });
  });
});

describe('validateTemplateForProvisioning', () => {
  it('returns valid for complete template', () => {
    const template = createMockTemplate();
    const result = validateTemplateForProvisioning(template);
    
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('returns invalid for null template', () => {
    const result = validateTemplateForProvisioning(null);
    
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Template not found');
  });

  it('returns error for missing templateId', () => {
    const template = createMockTemplate({ templateId: '' });
    const result = validateTemplateForProvisioning(template);
    
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('templateId'))).toBe(true);
  });

  it('returns error for missing defaultConfig', () => {
    const template = createMockTemplate({ defaultConfig: null as any });
    const result = validateTemplateForProvisioning(template);
    
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('defaultConfig'))).toBe(true);
  });

  it('returns error for missing botType', () => {
    const template = createMockTemplate({ botType: '' });
    const result = validateTemplateForProvisioning(template);
    
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('botType'))).toBe(true);
  });

  it('returns error for missing businessProfile in config', () => {
    const template = createMockTemplate();
    template.defaultConfig = {
      ...template.defaultConfig,
      businessProfile: undefined as any,
    };
    const result = validateTemplateForProvisioning(template);
    
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('businessProfile'))).toBe(true);
  });

  it('returns error for missing systemPrompt in config', () => {
    const template = createMockTemplate();
    template.defaultConfig = {
      ...template.defaultConfig,
      systemPrompt: '',
    };
    const result = validateTemplateForProvisioning(template);
    
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('systemPrompt'))).toBe(true);
  });
});

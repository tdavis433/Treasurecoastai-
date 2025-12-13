import { describe, it, expect } from 'vitest';
import { buildBehaviorPresetRules } from '../../server/botConfig';
import { 
  detectLeadIntent, 
  hasExplicitBookingIntent, 
  hasPricingIntent,
  isAffirmativeResponse,
  isDeclineResponse
} from '../../server/utils/leadIntent';

describe('buildBehaviorPresetRules', () => {
  it('returns empty string for undefined preset', () => {
    expect(buildBehaviorPresetRules(undefined)).toBe('');
  });

  it('returns empty string for invalid preset', () => {
    expect(buildBehaviorPresetRules('invalid' as any)).toBe('');
  });

  describe('support_lead_focused preset', () => {
    const rules = buildBehaviorPresetRules('support_lead_focused');

    it('includes SUPPORT + LEAD FOCUSED header', () => {
      expect(rules).toContain('BEHAVIOR PRESET: SUPPORT + LEAD FOCUSED');
    });

    it('includes answer first guideline', () => {
      expect(rules).toContain('ANSWER FIRST');
    });

    it('includes one question max guideline', () => {
      expect(rules).toContain('ONE QUESTION MAX');
    });

    it('includes callback offer guideline', () => {
      expect(rules).toContain('OFFER CALLBACK ON UNCERTAINTY');
    });

    it('includes high-intent triggers section', () => {
      expect(rules).toContain('High-Intent Triggers');
      expect(rules).toContain('Pricing questions');
      expect(rules).toContain('Availability questions');
    });
  });

  describe('compliance_strict preset', () => {
    const rules = buildBehaviorPresetRules('compliance_strict');

    it('includes COMPLIANCE STRICT header', () => {
      expect(rules).toContain('BEHAVIOR PRESET: COMPLIANCE STRICT');
    });

    it('includes knowledge base only guideline', () => {
      expect(rules).toContain('KNOWLEDGE BASE ONLY');
    });

    it('includes no assumptions guideline', () => {
      expect(rules).toContain('NO ASSUMPTIONS');
    });

    it('includes what to avoid section', () => {
      expect(rules).toContain('What to AVOID');
      expect(rules).toContain('Making assumptions');
    });
  });

  describe('sales_heavy preset', () => {
    const rules = buildBehaviorPresetRules('sales_heavy');

    it('includes SALES HEAVY header', () => {
      expect(rules).toContain('BEHAVIOR PRESET: SALES HEAVY');
    });

    it('includes guide to action guideline', () => {
      expect(rules).toContain('ALWAYS GUIDE TO ACTION');
    });

    it('includes proactive contact collection', () => {
      expect(rules).toContain('PROACTIVE CONTACT COLLECTION');
    });

    it('includes conversion triggers section', () => {
      expect(rules).toContain('Conversion Triggers');
    });

    it('includes lead capture priority', () => {
      expect(rules).toContain('Lead Capture Priority');
      expect(rules).toContain('Phone number is priority');
    });
  });
});

describe('detectLeadIntent', () => {
  describe('with low sensitivity', () => {
    it('detects explicit booking keywords', () => {
      const result = detectLeadIntent('I want to book an appointment', 'low');
      expect(result.detected).toBe(true);
      expect(result.category).toBe('booking');
    });

    it('does not detect general interest phrases', () => {
      const result = detectLeadIntent('I am interested in your services', 'low');
      expect(result.detected).toBe(false);
    });

    it('detects quote request', () => {
      const result = detectLeadIntent('Can I get a quote?', 'low');
      expect(result.detected).toBe(true);
      expect(result.category).toBe('quote');
    });
  });

  describe('with medium sensitivity', () => {
    it('detects pricing questions', () => {
      const result = detectLeadIntent('How much does it cost?', 'medium');
      expect(result.detected).toBe(true);
      expect(result.category).toBe('pricing');
    });

    it('detects tour interest', () => {
      const result = detectLeadIntent('Can I come see the place?', 'medium');
      expect(result.detected).toBe(true);
      expect(result.category).toBe('tour');
    });
  });

  describe('with high sensitivity', () => {
    it('detects general interest phrases', () => {
      const result = detectLeadIntent('I am interested in your services', 'high');
      expect(result.detected).toBe(true);
      expect(result.category).toBe('general');
    });

    it('detects wanting more info', () => {
      const result = detectLeadIntent('Can you tell me more?', 'high');
      expect(result.detected).toBe(true);
    });
  });

  it('returns false for empty or invalid input', () => {
    expect(detectLeadIntent('', 'medium').detected).toBe(false);
    expect(detectLeadIntent(null as any, 'medium').detected).toBe(false);
  });
});

describe('hasExplicitBookingIntent', () => {
  it('returns true for booking keywords', () => {
    expect(hasExplicitBookingIntent('I want to book a tour')).toBe(true);
    expect(hasExplicitBookingIntent('Can I schedule an appointment?')).toBe(true);
    expect(hasExplicitBookingIntent('I need to make a reservation')).toBe(true);
  });

  it('returns false for non-booking messages', () => {
    expect(hasExplicitBookingIntent('What are your hours?')).toBe(false);
    expect(hasExplicitBookingIntent('How much does it cost?')).toBe(false);
  });

  it('handles null/undefined input', () => {
    expect(hasExplicitBookingIntent(null as any)).toBe(false);
    expect(hasExplicitBookingIntent(undefined as any)).toBe(false);
  });
});

describe('hasPricingIntent', () => {
  it('returns true for pricing keywords', () => {
    expect(hasPricingIntent('What is the price?')).toBe(true);
    expect(hasPricingIntent('How much do you charge?')).toBe(true);
    expect(hasPricingIntent('What are the rates?')).toBe(true);
  });

  it('returns false for non-pricing messages', () => {
    expect(hasPricingIntent('Where are you located?')).toBe(false);
  });
});

describe('isAffirmativeResponse', () => {
  it('returns true for yes variations', () => {
    expect(isAffirmativeResponse('yes')).toBe(true);
    expect(isAffirmativeResponse('Yeah, that sounds good')).toBe(true);
    expect(isAffirmativeResponse('Sure, please do')).toBe(true);
    expect(isAffirmativeResponse('Sounds good!')).toBe(true);
  });

  it('returns false for non-affirmative messages', () => {
    expect(isAffirmativeResponse('I have a question')).toBe(false);
    expect(isAffirmativeResponse('What time?')).toBe(false);
  });
});

describe('isDeclineResponse', () => {
  it('returns true for decline phrases', () => {
    expect(isDeclineResponse('No thanks')).toBe(true);
    expect(isDeclineResponse('Not interested')).toBe(true);
    expect(isDeclineResponse('Maybe later')).toBe(true);
    expect(isDeclineResponse("I'm just browsing")).toBe(true);
  });

  it('returns false for non-decline messages', () => {
    expect(isDeclineResponse('Tell me more')).toBe(false);
    expect(isDeclineResponse('Yes please')).toBe(false);
  });
});

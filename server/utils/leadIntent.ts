/**
 * Lead Intent Detection Utility
 * 
 * Detects high-intent phrases in user messages that indicate lead capture opportunity.
 * Supports configurable sensitivity levels to balance helpfulness vs. aggressive capture.
 */

export type LeadDetectionSensitivity = 'low' | 'medium' | 'high';

export type LeadCategory = 'pricing' | 'booking' | 'availability' | 'quote' | 'consultation' | 'tour' | 'contact' | 'general';

interface PatternEntry {
  pattern: RegExp;
  category: LeadCategory;
}

export interface LeadIntentResult {
  detected: boolean;
  confidence: 'low' | 'medium' | 'high';
  triggers: string[];
  category?: LeadCategory;
  suggestedAction?: string;
}

const LOW_SENSITIVITY_PATTERNS: PatternEntry[] = [
  { pattern: /\b(book|booking)\b/i, category: 'booking' as const },
  { pattern: /\b(schedule|scheduling)\b/i, category: 'booking' as const },
  { pattern: /\b(appointment|appointments)\b/i, category: 'booking' as const },
  { pattern: /\b(quote|quotes|estimate|estimates)\b/i, category: 'quote' as const },
  { pattern: /\b(call me|give me a call|call you)\b/i, category: 'contact' as const },
  { pattern: /\b(consultation|consult)\b/i, category: 'consultation' as const },
];

const MEDIUM_SENSITIVITY_PATTERNS: PatternEntry[] = [
  ...LOW_SENSITIVITY_PATTERNS,
  { pattern: /\b(price|prices|pricing|cost|costs)\b/i, category: 'pricing' as const },
  { pattern: /\bhow much\b/i, category: 'pricing' as const },
  { pattern: /\b(tour|tours|visit|come see)\b/i, category: 'tour' as const },
  { pattern: /\b(availability|available)\b/i, category: 'availability' as const },
  { pattern: /\b(free consult|free consultation|free estimate)\b/i, category: 'consultation' as const },
  { pattern: /\b(come out|stop by|come by)\b/i, category: 'tour' as const },
];

const HIGH_SENSITIVITY_PATTERNS: PatternEntry[] = [
  ...MEDIUM_SENSITIVITY_PATTERNS,
  { pattern: /\b(interested|interest|looking for|considering)\b/i, category: 'general' as const },
  { pattern: /\b(want to|would like to|thinking about)\b/i, category: 'general' as const },
  { pattern: /\b(more info|more information|tell me more)\b/i, category: 'general' as const },
  { pattern: /\b(how do i|how can i|can i)\b/i, category: 'general' as const },
  { pattern: /\b(sign up|signup|register|get started)\b/i, category: 'contact' as const },
  { pattern: /\b(rates|rate|fee|fees)\b/i, category: 'pricing' as const },
  { pattern: /\b(compare|comparison|vs|versus)\b/i, category: 'general' as const },
  { pattern: /\b(when can|when do|what time)\b/i, category: 'availability' as const },
];

const CATEGORY_ACTIONS: Record<string, string> = {
  pricing: "Would you like someone to discuss pricing options with you?",
  booking: "I can help you get scheduled. What's your name and best contact number?",
  availability: "I can have our team reach out with current availability - what's your preferred contact?",
  quote: "Our team can put together a quote for you. What's the best way to reach you?",
  consultation: "I'd be happy to set up a consultation. Can I get your name and phone number?",
  tour: "We'd love to have you visit! Can I get your contact info to arrange a tour?",
  contact: "I can have someone reach out to you. What's the best number to call?",
  general: "Would you like me to have someone follow up with more details?",
};

/**
 * Detect lead intent in a user message based on sensitivity level.
 * 
 * @param message - The user's message text
 * @param sensitivity - Detection sensitivity: 'low', 'medium', or 'high'
 * @returns LeadIntentResult with detection details
 */
export function detectLeadIntent(
  message: string,
  sensitivity: LeadDetectionSensitivity = 'medium'
): LeadIntentResult {
  if (!message || typeof message !== 'string') {
    return { detected: false, confidence: 'low', triggers: [] };
  }

  const normalizedMessage = message.trim();
  if (normalizedMessage.length === 0) {
    return { detected: false, confidence: 'low', triggers: [] };
  }

  let patterns: typeof LOW_SENSITIVITY_PATTERNS;
  switch (sensitivity) {
    case 'low':
      patterns = LOW_SENSITIVITY_PATTERNS;
      break;
    case 'high':
      patterns = HIGH_SENSITIVITY_PATTERNS;
      break;
    case 'medium':
    default:
      patterns = MEDIUM_SENSITIVITY_PATTERNS;
      break;
  }

  const triggers: string[] = [];
  let detectedCategory: LeadIntentResult['category'] | undefined;
  let highestConfidence: 'low' | 'medium' | 'high' = 'low';

  for (const { pattern, category } of patterns) {
    const match = normalizedMessage.match(pattern);
    if (match) {
      triggers.push(match[0]);
      if (!detectedCategory) {
        detectedCategory = category;
      }
      
      if (category === 'booking' || category === 'contact' || category === 'consultation') {
        highestConfidence = 'high';
      } else if (category === 'pricing' || category === 'quote' || category === 'tour') {
        if (highestConfidence !== 'high') {
          highestConfidence = 'medium';
        }
      }
    }
  }

  if (triggers.length === 0) {
    return { detected: false, confidence: 'low', triggers: [] };
  }

  return {
    detected: true,
    confidence: highestConfidence,
    triggers,
    category: detectedCategory,
    suggestedAction: detectedCategory ? CATEGORY_ACTIONS[detectedCategory] : undefined,
  };
}

/**
 * Check if a message contains explicit booking/scheduling intent.
 * More strict than general lead detection - only triggers on clear booking language.
 */
export function hasExplicitBookingIntent(message: string): boolean {
  if (!message) return false;
  
  const bookingPatterns = [
    /\b(book|booking|schedule|scheduling|appointment|reserve|reservation)\b/i,
    /\bset up (a |an )?(appointment|meeting|visit|consultation)\b/i,
    /\bwant to (come in|visit|see you|make an appointment)\b/i,
    /\bcan (i|we) (book|schedule|make an appointment)\b/i,
  ];
  
  return bookingPatterns.some(pattern => pattern.test(message));
}

/**
 * Check if a message contains pricing/cost questions.
 */
export function hasPricingIntent(message: string): boolean {
  if (!message) return false;
  
  const pricingPatterns = [
    /\b(price|prices|pricing|cost|costs|rate|rates|fee|fees)\b/i,
    /\bhow much\b/i,
    /\bwhat do you charge\b/i,
    /\baffordable|expensive|cheap\b/i,
    /\bquote|estimate\b/i,
  ];
  
  return pricingPatterns.some(pattern => pattern.test(message));
}

/**
 * Check if a message is an affirmative response (yes, sure, ok, etc.)
 * Useful for detecting when a user agrees to provide contact info.
 */
export function isAffirmativeResponse(message: string): boolean {
  if (!message) return false;
  
  const affirmativePatterns = [
    /\b(yes|yeah|yep|yup|sure|ok|okay|alright|absolutely|definitely)\b/i,
    /\b(sounds good|that works|let's do|perfect|great|please)\b/i,
    /\b(go ahead|do it|yes please)\b/i,
  ];
  
  return affirmativePatterns.some(pattern => pattern.test(message));
}

/**
 * Check if a message declines or refuses something.
 * Useful for respecting user's choice not to share contact info.
 */
export function isDeclineResponse(message: string): boolean {
  if (!message) return false;
  
  const declinePatterns = [
    /\b(no|nope|nah|not now|not interested|maybe later|no thanks|not yet)\b/i,
    /\b(i'm good|i'm okay|just browsing|just looking)\b/i,
    /\b(don't want|rather not|prefer not)\b/i,
  ];
  
  return declinePatterns.some(pattern => pattern.test(message));
}

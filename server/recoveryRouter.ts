/**
 * Recovery Router - Deterministic intent classification for Sober Living / Recovery House
 * 
 * This module provides code-driven routing for recovery house conversations.
 * The AI only writes the tone; the code decides the intent and appropriate action.
 */

import { structuredLogger } from './structuredLogger';

export type RecoveryIntent =
  | 'crisis'                    // Immediate crisis: suicide, self-harm, overdose
  | 'admissions_intake'         // Tour, intake call, "can someone call me"
  | 'faq_or_info'               // General questions about the program
  | 'services_pricing'          // Cost, fees, weekly rate questions
  | 'insurance_payment'         // Insurance acceptance, payment plans
  | 'availability'              // Bed availability, openings, space
  | 'rules_eligibility'         // Court/probation, requirements, eligibility
  | 'contact_hours_location'    // Address, phone, hours, directions
  | 'human_handoff'             // User wants to speak to a person
  | 'general';                  // Default fallback

export interface RecoveryRouteResult {
  intent: RecoveryIntent;
  confidence: 'high' | 'medium' | 'low';
  shouldCaptureContact: boolean;
  suggestedAction?: 'schedule_tour' | 'request_callback' | 'provide_crisis_resources' | 'defer_to_staff';
  callPreference?: 'tour' | 'callback' | null;
  reason: string;
}

// Crisis keywords - HIGHEST PRIORITY
const CRISIS_PATTERNS = [
  /\b(suicid|kill\s*(myself|me)|end\s*(my\s*life|it\s*all)|hurt\s*myself|self[\s-]?harm)\b/i,
  /\b(overdos|od'?ing|dying|want\s*to\s*die|don'?t\s*want\s*to\s*live)\b/i,
  /\b(emergency|crisis|in\s*danger|unsafe)\b/i,
];

// Admissions/Tour intent
const ADMISSIONS_PATTERNS = [
  /\b(tour|visit|see\s*the\s*(place|facility|house)|come\s*(by|in|visit))\b/i,
  /\b(intake|admissions?|apply|application|get\s*in|move\s*in|enroll)\b/i,
  /\b(call\s*me|call\s*back|have\s*someone\s*call|someone\s*to\s*call)\b/i,
  /\b(schedule|book|set\s*up)\s*(a\s*)?(tour|call|consultation|meeting|visit)\b/i,
  /\b(my\s*(brother|son|husband|friend|loved\s*one|family\s*member)\s*needs?\s*help)\b/i,
  /\b(looking\s*for\s*(a\s*)?(place|help|sober\s*living|recovery))\b/i,
  /\b(need\s*help|seeking\s*help|getting\s*help)\b/i,
];

// Services/Pricing intent
const PRICING_PATTERNS = [
  /\b(cost|price|pricing|how\s*much|fee|fees|rate|rates|afford|expensive|cheap)\b/i,
  /\b(weekly|monthly)\s*(rate|cost|fee|rent|payment)\b/i,
  /\b(\$|dollar|money|budget)\b/i,
];

// Insurance/Payment intent
const INSURANCE_PATTERNS = [
  /\b(insurance|insured|coverage|covered|medicaid|medicare|blue\s*cross|aetna|cigna|united)\b/i,
  /\b(pay(ment)?\s*(plan|option|arrangement)|financing|scholarship|sliding\s*scale)\b/i,
  /\b(accept|take)\s*(insurance|medicaid|medicare)\b/i,
];

// Availability intent
const AVAILABILITY_PATTERNS = [
  /\b(availab|opening|open\s*bed|bed\s*available|vacancy|vacancies|space|room\s*available)\b/i,
  /\b(wait\s*list|waiting\s*list|how\s*long|when\s*can\s*I)\b/i,
  /\b(spot|spots)\s*(open|available)\b/i,
];

// Rules/Eligibility intent
const ELIGIBILITY_PATTERNS = [
  /\b(probation|parole|court[\s-]?order|court\s*mandate|legal\s*issue|felony|criminal|arrest)\b/i,
  /\b(requirement|eligible|eligibility|qualify|can\s*I\s*(come|stay|live))\b/i,
  /\b(rule|policy|policies|house\s*rules|allow|allowed|prohibited)\b/i,
  /\b(drug\s*test|ua|urinalysis|breathalyzer|curfew|visitors?)\b/i,
  /\b(mat|medication[\s-]?assisted|suboxone|methadone|vivitrol)\b/i,
];

// Contact/Hours/Location intent
const CONTACT_PATTERNS = [
  /\b(address|location|where\s*(are\s*you|is\s*it)|directions|find\s*you|drive|how\s*to\s*get)\b/i,
  /\b(phone\s*number|call\s*you|contact|reach\s*(you|out))\b/i,
  /\b(hour|open|close|when\s*are\s*you|office\s*hours)\b/i,
  /\b(email|website|online)\b/i,
];

// Human handoff intent
const HANDOFF_PATTERNS = [
  /\b(speak\s*(to|with)\s*(a\s*)?(person|human|someone|staff|manager|real\s*person))\b/i,
  /\b(talk\s*to\s*(a\s*)?(person|human|someone))\b/i,
  /\b(real\s*person|live\s*person|not\s*a\s*bot)\b/i,
  /\b(manager|supervisor|owner)\b/i,
];

// Callback-specific patterns (subset of admissions - for callPreference detection)
const CALLBACK_PATTERNS = [
  /\b(call\s*me|call\s*back|have\s*someone\s*call|someone\s*to\s*call|phone\s*call)\b/i,
  /\b(reach\s*out|contact\s*me|get\s*back\s*to\s*me)\b/i,
  /\b(callback|call[\s-]?back)\b/i,
];

// Tour-specific patterns (for callPreference detection)
const TOUR_PATTERNS = [
  /\b(tour|visit|see\s*the\s*(place|facility|house)|come\s*(by|in|visit))\b/i,
  /\b(schedule|book|set\s*up)\s*(a\s*)?(tour|visit)\b/i,
  /\b(look\s*around|check\s*out\s*the\s*(place|facility|house))\b/i,
];

// FAQ/Info patterns (general questions)
const FAQ_PATTERNS = [
  /\b(what\s*(is|are|do)|how\s*(does|do)|tell\s*me\s*about|explain)\b/i,
  /\b(program|structure|daily|routine|schedule|activities)\b/i,
  /\b(12[\s-]?step|aa|na|meeting|recovery\s*pathway)\b/i,
  /\b(family|visit|visitors?|contact\s*with\s*family)\b/i,
  /\b(treatment|outpatient|iop|therapy|counseling)\b/i,
];

/**
 * Check if any pattern in the array matches the message
 */
function matchesAny(message: string, patterns: RegExp[]): boolean {
  return patterns.some(pattern => pattern.test(message));
}

/**
 * Route a message to the appropriate intent for recovery house conversations.
 * This is deterministic - code decides, model writes.
 */
export function routeRecoveryMessage(message: string): RecoveryRouteResult {
  const normalizedMessage = message.trim();
  
  // 1. CRISIS - HIGHEST PRIORITY (always check first)
  if (matchesAny(normalizedMessage, CRISIS_PATTERNS)) {
    structuredLogger.info('[RecoveryRouter] Crisis intent detected', { 
      message: '[REDACTED]', // Don't log crisis content
      intent: 'crisis' 
    });
    return {
      intent: 'crisis',
      confidence: 'high',
      shouldCaptureContact: false, // Don't push for contact during crisis
      suggestedAction: 'provide_crisis_resources',
      reason: 'Crisis keywords detected - provide resources immediately'
    };
  }
  
  // 2. HUMAN HANDOFF (always callback preference)
  if (matchesAny(normalizedMessage, HANDOFF_PATTERNS)) {
    return {
      intent: 'human_handoff',
      confidence: 'high',
      shouldCaptureContact: true,
      suggestedAction: 'request_callback',
      callPreference: 'callback',
      reason: 'User explicitly requested human contact'
    };
  }
  
  // 3. ADMISSIONS/TOUR (primary CTA) - detect tour vs callback preference
  if (matchesAny(normalizedMessage, ADMISSIONS_PATTERNS)) {
    // Check if it's specifically a callback request vs tour
    const isCallback = matchesAny(normalizedMessage, CALLBACK_PATTERNS);
    const isTour = matchesAny(normalizedMessage, TOUR_PATTERNS);
    
    return {
      intent: 'admissions_intake',
      confidence: 'high',
      shouldCaptureContact: true,
      suggestedAction: isCallback ? 'request_callback' : 'schedule_tour',
      callPreference: isCallback ? 'callback' : (isTour ? 'tour' : null),
      reason: isCallback ? 'Callback request detected' : 'Tour or admissions intent detected'
    };
  }
  
  // 4. INSURANCE/PAYMENT (defer to staff)
  if (matchesAny(normalizedMessage, INSURANCE_PATTERNS)) {
    return {
      intent: 'insurance_payment',
      confidence: 'high',
      shouldCaptureContact: true,
      suggestedAction: 'defer_to_staff',
      reason: 'Insurance question - staff follow-up needed'
    };
  }
  
  // 5. AVAILABILITY (defer to staff)
  if (matchesAny(normalizedMessage, AVAILABILITY_PATTERNS)) {
    return {
      intent: 'availability',
      confidence: 'high',
      shouldCaptureContact: true,
      suggestedAction: 'defer_to_staff',
      reason: 'Availability question - staff verification needed'
    };
  }
  
  // 6. RULES/ELIGIBILITY (cautious + callback option)
  if (matchesAny(normalizedMessage, ELIGIBILITY_PATTERNS)) {
    return {
      intent: 'rules_eligibility',
      confidence: 'high',
      shouldCaptureContact: true,
      suggestedAction: 'request_callback',
      reason: 'Eligibility question - cautious response + staff follow-up'
    };
  }
  
  // 7. PRICING (answer from FAQ if available, but offer staff follow-up)
  if (matchesAny(normalizedMessage, PRICING_PATTERNS)) {
    return {
      intent: 'services_pricing',
      confidence: 'high',
      shouldCaptureContact: true,
      suggestedAction: 'request_callback',
      reason: 'Pricing question - provide info + offer follow-up'
    };
  }
  
  // 8. CONTACT/HOURS/LOCATION
  if (matchesAny(normalizedMessage, CONTACT_PATTERNS)) {
    return {
      intent: 'contact_hours_location',
      confidence: 'high',
      shouldCaptureContact: false, // Just providing info
      reason: 'Contact/location information request'
    };
  }
  
  // 9. FAQ/GENERAL INFO
  if (matchesAny(normalizedMessage, FAQ_PATTERNS)) {
    return {
      intent: 'faq_or_info',
      confidence: 'medium',
      shouldCaptureContact: false,
      reason: 'General FAQ or information question'
    };
  }
  
  // 10. DEFAULT - General conversation
  return {
    intent: 'general',
    confidence: 'low',
    shouldCaptureContact: false,
    reason: 'No specific intent detected'
  };
}

/**
 * Check if a business type is a sober living / recovery house
 */
export function isSoberLivingBusiness(businessType?: string): boolean {
  if (!businessType) return false;
  const type = businessType.toLowerCase();
  return type.includes('sober') || 
         type.includes('recovery') || 
         type.includes('sober_living') ||
         type.includes('halfway') ||
         type.includes('transitional');
}

/**
 * Get appropriate response guidance based on routed intent
 */
export function getIntentGuidance(result: RecoveryRouteResult): string {
  switch (result.intent) {
    case 'crisis':
      return 'CRISIS DETECTED: Provide 988/911 resources FIRST. Offer optional callback ONLY if not in immediate danger.';
    
    case 'admissions_intake':
      return 'TOUR/CALLBACK REQUEST: Collect ONLY name + phone OR email + preferred time (morning/afternoon/evening). NO intake questions. Confirm: "Staff will reach out. If urgent, call {phone}."';
    
    case 'insurance_payment':
      return 'INSURANCE QUESTION: Do NOT guess. Say "Our team can discuss payment options during your call." Offer to arrange staff callback.';
    
    case 'availability':
      return 'AVAILABILITY QUESTION: Do NOT confirm beds. Say "Availability changes daily." Offer to arrange staff callback.';
    
    case 'rules_eligibility':
      return 'ELIGIBILITY QUESTION: Be cautious. Say "We work with various situations." Offer to arrange staff callback.';
    
    case 'services_pricing':
      return 'PRICING QUESTION: Share FAQ info if available, then offer staff follow-up for detailed questions.';
    
    case 'contact_hours_location':
      return 'CONTACT INFO: Provide location, phone, hours from business profile.';
    
    case 'human_handoff':
      return 'HUMAN HANDOFF: Collect name + phone OR email + preferred time. Confirm: "Staff will reach out. If urgent, call {phone}."';
    
    case 'faq_or_info':
      return 'FAQ/INFO: Answer from knowledge base. If uncertain, offer staff follow-up.';
    
    default:
      return 'GENERAL: Be helpful and answer from knowledge base. Offer assistance if needed.';
  }
}

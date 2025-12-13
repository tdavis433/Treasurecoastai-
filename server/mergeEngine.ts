/**
 * Merge Engine for Website Import Feature
 * 
 * Handles deduplication and merging of extracted data:
 * - Services: normalize names, dedupe by similarity
 * - FAQs: dedupe by question similarity
 * - Contact: fill missing only (don't overwrite)
 * - Policies: dedupe by category
 * 
 * Tracks provenance in client_settings.metadata.sources.websiteScan
 */

import type { 
  ServiceSuggestion, 
  FaqSuggestion, 
  ContactSuggestion, 
  WebsiteImportSuggestions 
} from './scraper';

export interface ExistingService {
  name: string;
  description?: string;
  price?: string;
  id?: string;
}

export interface ExistingFaq {
  question: string;
  answer: string;
  id?: string;
}

export interface ExistingContact {
  phone?: string;
  email?: string;
  address?: string;
  hours?: Record<string, string>;
}

export interface MergeResult<T> {
  toAdd: T[];
  duplicates: Array<{ item: T; existingMatch: string }>;
  unchanged: T[];
}

/**
 * Normalize a string for comparison (lowercase, trim, remove extra spaces)
 */
function normalizeString(str: string): string {
  return str.toLowerCase().trim().replace(/\s+/g, ' ');
}

/**
 * Calculate similarity between two strings (Jaccard similarity on words)
 */
function stringSimilarity(a: string, b: string): number {
  const wordsA = new Set(normalizeString(a).split(' ').filter(w => w.length > 2));
  const wordsB = new Set(normalizeString(b).split(' ').filter(w => w.length > 2));
  
  if (wordsA.size === 0 || wordsB.size === 0) return 0;
  
  const intersection = new Set([...wordsA].filter(x => wordsB.has(x)));
  const union = new Set([...wordsA, ...wordsB]);
  
  return intersection.size / union.size;
}

/**
 * Normalize service name for comparison
 */
export function normalizeServiceName(name: string): string {
  return normalizeString(name)
    .replace(/[^\w\s]/g, '') // Remove punctuation
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Check if two services are duplicates based on name similarity
 */
function isServiceDuplicate(a: string, b: string, threshold = 0.7): boolean {
  const normA = normalizeServiceName(a);
  const normB = normalizeServiceName(b);
  
  // Exact match after normalization
  if (normA === normB) return true;
  
  // Check similarity
  return stringSimilarity(normA, normB) >= threshold;
}

/**
 * Deduplicate services against existing list
 */
export function dedupeServices(
  suggestions: ServiceSuggestion[],
  existing: ExistingService[]
): MergeResult<ServiceSuggestion> {
  const result: MergeResult<ServiceSuggestion> = {
    toAdd: [],
    duplicates: [],
    unchanged: [],
  };

  const existingNames = existing.map(s => normalizeServiceName(s.name));

  for (const suggestion of suggestions) {
    const normName = normalizeServiceName(suggestion.name);
    
    // Skip empty names
    if (!normName) continue;
    
    // Check for duplicate in existing
    let isDupe = false;
    for (let i = 0; i < existingNames.length; i++) {
      if (isServiceDuplicate(normName, existingNames[i])) {
        result.duplicates.push({
          item: suggestion,
          existingMatch: existing[i].name,
        });
        isDupe = true;
        break;
      }
    }
    
    if (!isDupe) {
      // Also check within toAdd to avoid self-duplicates
      const alreadyAdding = result.toAdd.some(s => 
        isServiceDuplicate(normalizeServiceName(s.name), normName)
      );
      
      if (!alreadyAdding) {
        result.toAdd.push(suggestion);
      }
    }
  }

  return result;
}

/**
 * Normalize FAQ question for comparison
 */
export function normalizeFaqQuestion(question: string): string {
  return normalizeString(question)
    .replace(/[?!.]/g, '') // Remove question marks and periods
    .replace(/^(what|how|when|where|why|do|does|is|are|can|will)\s+/i, '') // Remove common question words
    .trim();
}

/**
 * Check if two FAQ questions are duplicates
 */
function isFaqDuplicate(a: string, b: string, threshold = 0.6): boolean {
  const normA = normalizeFaqQuestion(a);
  const normB = normalizeFaqQuestion(b);
  
  // Exact match after normalization
  if (normA === normB) return true;
  
  // Check similarity
  return stringSimilarity(normA, normB) >= threshold;
}

/**
 * Deduplicate FAQs against existing list
 */
export function dedupeFaqs(
  suggestions: FaqSuggestion[],
  existing: ExistingFaq[]
): MergeResult<FaqSuggestion> {
  const result: MergeResult<FaqSuggestion> = {
    toAdd: [],
    duplicates: [],
    unchanged: [],
  };

  const existingQuestions = existing.map(f => normalizeFaqQuestion(f.question));

  for (const suggestion of suggestions) {
    const normQuestion = normalizeFaqQuestion(suggestion.question);
    
    // Skip empty questions
    if (!normQuestion) continue;
    
    // Check for duplicate in existing
    let isDupe = false;
    for (let i = 0; i < existingQuestions.length; i++) {
      if (isFaqDuplicate(normQuestion, existingQuestions[i])) {
        result.duplicates.push({
          item: suggestion,
          existingMatch: existing[i].question,
        });
        isDupe = true;
        break;
      }
    }
    
    if (!isDupe) {
      // Also check within toAdd to avoid self-duplicates
      const alreadyAdding = result.toAdd.some(f => 
        isFaqDuplicate(normalizeFaqQuestion(f.question), normQuestion)
      );
      
      if (!alreadyAdding) {
        result.toAdd.push(suggestion);
      }
    }
  }

  return result;
}

/**
 * Merge contact information - only fill in missing fields
 */
export function mergeContactInfo(
  suggestions: ContactSuggestion[],
  existing: ExistingContact
): { updates: Partial<ExistingContact>; filled: string[]; skipped: string[] } {
  const updates: Partial<ExistingContact> = {};
  const filled: string[] = [];
  const skipped: string[] = [];

  for (const suggestion of suggestions) {
    const { type, value } = suggestion;
    
    if (!value || !value.trim()) continue;
    
    switch (type) {
      case 'phone':
        if (!existing.phone) {
          updates.phone = value;
          filled.push('phone');
        } else {
          skipped.push('phone');
        }
        break;
      case 'email':
        if (!existing.email) {
          updates.email = value;
          filled.push('email');
        } else {
          skipped.push('email');
        }
        break;
      case 'address':
        if (!existing.address) {
          updates.address = value;
          filled.push('address');
        } else {
          skipped.push('address');
        }
        break;
      case 'hours':
        // Hours is more complex - could be parsed from value
        // For now, skip if any hours exist
        if (!existing.hours || Object.keys(existing.hours).length === 0) {
          // Try to parse hours from value
          const parsedHours = parseHoursString(value);
          if (parsedHours) {
            updates.hours = parsedHours;
            filled.push('hours');
          }
        } else {
          skipped.push('hours');
        }
        break;
    }
  }

  return { updates, filled, skipped };
}

/**
 * Parse a hours string into a structured object
 */
function parseHoursString(hoursStr: string): Record<string, string> | null {
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const result: Record<string, string> = {};
  
  const lowerStr = hoursStr.toLowerCase();
  
  for (const day of days) {
    const dayShort = day.substring(0, 3);
    const patterns = [
      new RegExp(`${day}[:\\s]+([^,;\\n]+)`, 'i'),
      new RegExp(`${dayShort}[:\\s]+([^,;\\n]+)`, 'i'),
    ];
    
    for (const pattern of patterns) {
      const match = lowerStr.match(pattern);
      if (match) {
        result[day.charAt(0).toUpperCase() + day.slice(1)] = match[1].trim();
        break;
      }
    }
  }
  
  // If we found at least one day, return result
  return Object.keys(result).length > 0 ? result : null;
}

export interface ProvenanceRecord {
  source: 'websiteScan';
  scanDate: string;
  sourceUrls: string[];
  itemsAdded: {
    services: number;
    faqs: number;
    contact: string[];
    policies: number;
    bookingLinks: number;
    socialLinks: number;
  };
}

/**
 * Create a provenance record for tracking data sources
 */
export function createProvenanceRecord(
  suggestions: WebsiteImportSuggestions,
  itemsAdded: { services: number; faqs: number; contact: string[]; policies: number }
): ProvenanceRecord {
  return {
    source: 'websiteScan',
    scanDate: new Date().toISOString(),
    sourceUrls: suggestions.sourceUrls,
    itemsAdded: {
      services: itemsAdded.services,
      faqs: itemsAdded.faqs,
      contact: itemsAdded.contact,
      policies: itemsAdded.policies,
      bookingLinks: suggestions.bookingLinks.length,
      socialLinks: suggestions.socialLinks.length,
    },
  };
}

/**
 * Batch process all suggestion categories against existing data
 */
export function processSuggestionsForMerge(
  suggestions: WebsiteImportSuggestions,
  existingServices: ExistingService[],
  existingFaqs: ExistingFaq[],
  existingContact: ExistingContact
): {
  services: MergeResult<ServiceSuggestion>;
  faqs: MergeResult<FaqSuggestion>;
  contact: ReturnType<typeof mergeContactInfo>;
} {
  return {
    services: dedupeServices(suggestions.services, existingServices),
    faqs: dedupeFaqs(suggestions.faqs, existingFaqs),
    contact: mergeContactInfo(suggestions.contact, existingContact),
  };
}

export default {
  normalizeServiceName,
  dedupeServices,
  normalizeFaqQuestion,
  dedupeFaqs,
  mergeContactInfo,
  createProvenanceRecord,
  processSuggestionsForMerge,
};

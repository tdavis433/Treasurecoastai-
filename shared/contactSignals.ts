/**
 * CONTACT SIGNALS EXTRACTION UTILITY
 * 
 * Extracts contact information (email, phone) from any chat message.
 * Designed to be careful with regex to avoid false positives.
 * 
 * Used by the orchestrator BEFORE message persistence to capture
 * contact info from any message (not just booking forms).
 */

export interface ContactSignals {
  email?: string;
  phone?: string;
}

/**
 * Extract email from a chat message.
 * Uses a careful regex to avoid false positives:
 * - Must have valid local part (letters, numbers, dots, underscores, hyphens, plus)
 * - Must have @ symbol
 * - Must have valid domain with at least 2-character TLD
 * - Excludes common false positives like @example.com placeholders
 */
export function extractEmail(message: string): string | undefined {
  if (!message || typeof message !== 'string') {
    return undefined;
  }

  // RFC 5322 inspired but simplified for practical use
  // Captures most valid emails while avoiding edge cases that cause false positives
  const emailRegex = /\b([a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,})\b/g;
  
  const matches = message.match(emailRegex);
  if (!matches || matches.length === 0) {
    return undefined;
  }

  // Filter out common placeholder/example emails
  const excludePatterns = [
    /example\.com$/i,
    /test\.com$/i,
    /placeholder/i,
    /your.*email/i,
    /you@/i,
    /user@/i,
    /email@/i,
    /name@/i,
    /xxx/i,
    /sample/i,
    /fake/i,
    /demo@/i,
  ];

  for (const match of matches) {
    const isPlaceholder = excludePatterns.some(pattern => pattern.test(match));
    if (!isPlaceholder) {
      // Additional validation: domain should have at least one dot
      const atIndex = match.indexOf('@');
      const domain = match.slice(atIndex + 1);
      if (domain.includes('.') && domain.length >= 4) {
        return match.toLowerCase();
      }
    }
  }

  return undefined;
}

/**
 * Extract phone number from a chat message.
 * Uses a careful regex to handle common US phone formats.
 * Avoids false positives like random number sequences.
 */
export function extractPhone(message: string): string | undefined {
  if (!message || typeof message !== 'string') {
    return undefined;
  }

  // Common US phone formats:
  // (555) 123-4567, 555-123-4567, 555.123.4567, 5551234567
  // Also handles optional +1 or 1 prefix
  const phonePatterns = [
    /\+?1?[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g,
  ];

  for (const pattern of phonePatterns) {
    const matches = message.match(pattern);
    if (matches && matches.length > 0) {
      // Return first match that looks like a real phone number
      const phone = matches[0];
      // Extract just digits to validate length
      const digits = phone.replace(/\D/g, '');
      // US phone should be 10 or 11 digits (with country code)
      if (digits.length === 10 || (digits.length === 11 && digits.startsWith('1'))) {
        return phone;
      }
    }
  }

  return undefined;
}

/**
 * Extract all contact signals from a chat message.
 * Returns an object with email and phone if found.
 * 
 * This function is designed to be called on EVERY incoming user message
 * to capture contact info that might be mentioned casually in conversation.
 */
export function extractContactSignals(message: string): ContactSignals {
  const signals: ContactSignals = {};
  
  const email = extractEmail(message);
  if (email) {
    signals.email = email;
  }
  
  const phone = extractPhone(message);
  if (phone) {
    signals.phone = phone;
  }
  
  return signals;
}

/**
 * Merge contact signals into existing session data.
 * Only overwrites if new signal has a value and existing is empty.
 * Returns true if any new signals were captured.
 */
export function mergeContactSignals(
  existing: { email?: string | null; phone?: string | null },
  newSignals: ContactSignals
): { updated: boolean; merged: ContactSignals } {
  let updated = false;
  const merged: ContactSignals = {};

  if (newSignals.email && !existing.email) {
    merged.email = newSignals.email;
    updated = true;
  }

  if (newSignals.phone && !existing.phone) {
    merged.phone = newSignals.phone;
    updated = true;
  }

  return { updated, merged };
}

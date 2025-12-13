/**
 * URL Validation Utilities for Website Import Feature
 * 
 * Security rules:
 * - Only HTTPS URLs allowed for booking links
 * - Block unsafe protocols: javascript:, data:, file:, http:
 * - Block payment-related URLs (security concern)
 * - Validate known booking providers
 */

export interface URLValidationResult {
  valid: boolean;
  url?: string;
  error?: string;
  isBookingProvider?: boolean;
  providerName?: string;
}

// Known booking provider domains
const BOOKING_PROVIDERS: Record<string, string> = {
  'calendly.com': 'Calendly',
  'acuityscheduling.com': 'Acuity Scheduling',
  'acuity.com': 'Acuity Scheduling',
  'booksy.com': 'Booksy',
  'vagaro.com': 'Vagaro',
  'squareup.com': 'Square Appointments',
  'square.site': 'Square Appointments',
  'opentable.com': 'OpenTable',
  'resy.com': 'Resy',
  'yelp.com/reservations': 'Yelp Reservations',
  'zocdoc.com': 'ZocDoc',
  'schedulicity.com': 'Schedulicity',
  'genbook.com': 'Genbook',
  'mindbodyonline.com': 'Mindbody',
  'appointy.com': 'Appointy',
  'setmore.com': 'Setmore',
  'simplepractice.com': 'SimplePractice',
  'booker.com': 'Booker',
  'fresha.com': 'Fresha',
  'glossgenius.com': 'GlossGenius',
  'jane.app': 'Jane App',
  'cliniko.com': 'Cliniko',
  'hubspot.com': 'HubSpot',
  'typeform.com': 'Typeform',
  'jotform.com': 'JotForm',
};

// Blocked URL patterns for security
const BLOCKED_PROTOCOLS = ['javascript:', 'data:', 'file:', 'vbscript:', 'blob:'];
const BLOCKED_KEYWORDS = ['payment', 'pay.', 'checkout', 'stripe.com', 'paypal.com', 'venmo.com'];

/**
 * Validates a booking URL for security and correctness
 */
export function validateBookingUrl(urlString: string): URLValidationResult {
  if (!urlString || typeof urlString !== 'string') {
    return { valid: false, error: 'URL is required' };
  }

  const trimmedUrl = urlString.trim();
  
  if (!trimmedUrl) {
    return { valid: false, error: 'URL cannot be empty' };
  }

  // Check for blocked protocols
  const lowerUrl = trimmedUrl.toLowerCase();
  for (const protocol of BLOCKED_PROTOCOLS) {
    if (lowerUrl.startsWith(protocol)) {
      return { valid: false, error: `Unsafe protocol "${protocol}" is not allowed` };
    }
  }

  // Block http:// (require HTTPS)
  if (lowerUrl.startsWith('http://')) {
    return { valid: false, error: 'Only HTTPS URLs are allowed for security' };
  }

  // Ensure URL starts with https://
  let normalizedUrl = trimmedUrl;
  if (!lowerUrl.startsWith('https://')) {
    // If no protocol, assume https://
    if (!lowerUrl.includes('://')) {
      normalizedUrl = `https://${trimmedUrl}`;
    } else {
      return { valid: false, error: 'Invalid URL protocol. Only HTTPS is allowed.' };
    }
  }

  // Parse and validate URL structure
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(normalizedUrl);
  } catch {
    return { valid: false, error: 'Invalid URL format' };
  }

  // Verify protocol is HTTPS after parsing
  if (parsedUrl.protocol !== 'https:') {
    return { valid: false, error: 'Only HTTPS URLs are allowed' };
  }

  // Block payment URLs (security concern - no payment collection through bot)
  for (const keyword of BLOCKED_KEYWORDS) {
    if (lowerUrl.includes(keyword)) {
      return { valid: false, error: 'Payment URLs are not allowed for security reasons' };
    }
  }

  // Check if it's a known booking provider
  const hostname = parsedUrl.hostname.toLowerCase();
  let providerName: string | undefined;
  let isBookingProvider = false;

  for (const [domain, name] of Object.entries(BOOKING_PROVIDERS)) {
    if (hostname.includes(domain) || parsedUrl.href.toLowerCase().includes(domain)) {
      providerName = name;
      isBookingProvider = true;
      break;
    }
  }

  return {
    valid: true,
    url: parsedUrl.href,
    isBookingProvider,
    providerName,
  };
}

/**
 * Validates a general URL (for website scraping, social links, etc.)
 */
export function validateWebsiteUrl(urlString: string): URLValidationResult {
  if (!urlString || typeof urlString !== 'string') {
    return { valid: false, error: 'URL is required' };
  }

  const trimmedUrl = urlString.trim();
  
  if (!trimmedUrl) {
    return { valid: false, error: 'URL cannot be empty' };
  }

  // Check for blocked protocols
  const lowerUrl = trimmedUrl.toLowerCase();
  for (const protocol of BLOCKED_PROTOCOLS) {
    if (lowerUrl.startsWith(protocol)) {
      return { valid: false, error: `Unsafe protocol "${protocol}" is not allowed` };
    }
  }

  // Normalize URL - add protocol if missing
  let normalizedUrl = trimmedUrl;
  if (!lowerUrl.startsWith('http://') && !lowerUrl.startsWith('https://')) {
    normalizedUrl = `https://${trimmedUrl}`;
  }

  // Parse and validate URL structure
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(normalizedUrl);
  } catch {
    return { valid: false, error: 'Invalid URL format' };
  }

  // Only allow http and https
  if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
    return { valid: false, error: 'Only HTTP/HTTPS URLs are allowed' };
  }

  return {
    valid: true,
    url: parsedUrl.href,
  };
}

/**
 * Extracts the domain from a URL for same-domain crawling validation
 */
export function extractDomain(urlString: string): string | null {
  try {
    const url = new URL(urlString.startsWith('http') ? urlString : `https://${urlString}`);
    return url.hostname.toLowerCase();
  } catch {
    return null;
  }
}

/**
 * Checks if a URL belongs to the same domain (for crawl scope limiting)
 */
export function isSameDomain(baseUrl: string, targetUrl: string): boolean {
  const baseDomain = extractDomain(baseUrl);
  const targetDomain = extractDomain(targetUrl);
  
  if (!baseDomain || !targetDomain) {
    return false;
  }

  // Handle www variants
  const normalizeBaseDomain = baseDomain.replace(/^www\./, '');
  const normalizeTargetDomain = targetDomain.replace(/^www\./, '');
  
  return normalizeBaseDomain === normalizeTargetDomain;
}

/**
 * Detect booking links from a list of URLs found on a page
 */
export function detectBookingLinks(urls: string[]): Array<{
  url: string;
  provider: string;
  confidence: number;
}> {
  const bookingLinks: Array<{
    url: string;
    provider: string;
    confidence: number;
  }> = [];

  for (const url of urls) {
    const validation = validateBookingUrl(url);
    if (validation.valid && validation.isBookingProvider && validation.providerName) {
      bookingLinks.push({
        url: validation.url!,
        provider: validation.providerName,
        confidence: 0.95, // High confidence for known providers
      });
    }
  }

  return bookingLinks;
}

/**
 * Social media platform detection
 */
const SOCIAL_PLATFORMS: Record<string, string> = {
  'facebook.com': 'Facebook',
  'fb.com': 'Facebook',
  'instagram.com': 'Instagram',
  'twitter.com': 'Twitter',
  'x.com': 'Twitter',
  'linkedin.com': 'LinkedIn',
  'youtube.com': 'YouTube',
  'youtu.be': 'YouTube',
  'tiktok.com': 'TikTok',
  'pinterest.com': 'Pinterest',
  'yelp.com': 'Yelp',
  'google.com/maps': 'Google Maps',
  'maps.google.com': 'Google Maps',
  'tripadvisor.com': 'TripAdvisor',
  'nextdoor.com': 'Nextdoor',
};

/**
 * Detect social media links from a list of URLs
 */
export function detectSocialLinks(urls: string[]): Array<{
  url: string;
  platform: string;
  confidence: number;
}> {
  const socialLinks: Array<{
    url: string;
    platform: string;
    confidence: number;
  }> = [];

  for (const url of urls) {
    try {
      const parsedUrl = new URL(url.startsWith('http') ? url : `https://${url}`);
      const hostname = parsedUrl.hostname.toLowerCase();

      for (const [domain, platform] of Object.entries(SOCIAL_PLATFORMS)) {
        if (hostname.includes(domain) || parsedUrl.href.toLowerCase().includes(domain)) {
          socialLinks.push({
            url: parsedUrl.href,
            platform,
            confidence: 0.9,
          });
          break;
        }
      }
    } catch {
      // Skip invalid URLs
    }
  }

  return socialLinks;
}

export default {
  validateBookingUrl,
  validateWebsiteUrl,
  extractDomain,
  isSameDomain,
  detectBookingLinks,
  detectSocialLinks,
  BOOKING_PROVIDERS,
  SOCIAL_PLATFORMS,
};

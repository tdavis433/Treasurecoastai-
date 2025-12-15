import OpenAI from "openai";
import { storage } from "./storage";
import type { ScrapedWebsite, InsertScrapedWebsite } from "@shared/schema";
import { validateBookingUrl, validateWebsiteUrl, isSameDomain, detectBookingLinks, detectSocialLinks } from "./urlValidator";

// Initialize OpenAI client - prefer Replit AI integration (with baseURL), fallback to direct API key
const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY || process.env.OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL || undefined,
});

// Configuration for multi-page crawling
const CRAWL_CONFIG = {
  maxPages: 15,          // Maximum pages to crawl
  maxDepth: 2,           // Maximum link depth from homepage
  pageTimeoutMs: 15000,  // Timeout per page
  totalTimeoutMs: 120000, // Total crawl timeout (2 minutes)
  delayBetweenRequestsMs: 500, // Delay between requests
};

interface ExtractedData {
  businessName?: string;
  tagline?: string;
  description?: string;
  services?: Array<{ name: string; description?: string; price?: string }>;
  products?: Array<{ name: string; description?: string; price?: string }>;
  faqs?: Array<{ question: string; answer: string }>;
  contactInfo?: {
    phone?: string;
    email?: string;
    address?: string;
    hours?: Record<string, string>;
  };
  socialLinks?: Record<string, string>;
  teamMembers?: Array<{ name: string; role?: string; bio?: string }>;
  testimonials?: Array<{ text: string; author?: string; rating?: number }>;
  keyFeatures?: string[];
  pricing?: Array<{ plan: string; price: string; features?: string[] }>;
  aboutContent?: string;
  missionStatement?: string;
}

export async function fetchWebpage(url: string): Promise<{ html: string; title: string; metaDescription: string }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
    }

    const html = await response.text();
    
    const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : "";
    
    const metaMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i);
    const metaDescription = metaMatch ? metaMatch[1].trim() : "";

    return { html, title, metaDescription };
  } finally {
    clearTimeout(timeout);
  }
}

export function extractTextFromHtml(html: string): string {
  let text = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, "")
    .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, "")
    .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, " [FOOTER] ")
    .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<(h[1-6])[^>]*>/gi, "\n\n### ")
    .replace(/<\/(h[1-6])>/gi, "\n\n")
    .replace(/<li[^>]*>/gi, "\n• ")
    .replace(/<\/li>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<p[^>]*>/gi, "\n\n")
    .replace(/<\/p>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .replace(/\n\s*\n/g, "\n\n")
    .trim();

  const maxLength = 15000;
  if (text.length > maxLength) {
    text = text.substring(0, maxLength) + "... [truncated]";
  }

  return text;
}

export function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch {
    return url;
  }
}

export async function extractBusinessDataWithAI(text: string, url: string, pageTitle: string): Promise<ExtractedData> {
  const prompt = `You are an expert at extracting business information from website content. Analyze the following website content and extract structured business data.

Website URL: ${url}
Page Title: ${pageTitle}

Website Content:
${text}

Extract and return a JSON object with the following structure (include only fields that have data):
{
  "businessName": "The business name",
  "tagline": "Short tagline or slogan",
  "description": "Brief business description (1-2 sentences)",
  "services": [{"name": "Service name", "description": "Brief description", "price": "Price if available"}],
  "products": [{"name": "Product name", "description": "Brief description", "price": "Price if available"}],
  "faqs": [{"question": "FAQ question", "answer": "FAQ answer"}],
  "contactInfo": {
    "phone": "Phone number",
    "email": "Email address",
    "address": "Physical address",
    "hours": {"Monday": "9am-5pm", "Tuesday": "9am-5pm", ...}
  },
  "socialLinks": {"facebook": "url", "instagram": "url", ...},
  "teamMembers": [{"name": "Name", "role": "Role/Title", "bio": "Brief bio"}],
  "testimonials": [{"text": "Testimonial text", "author": "Author name", "rating": 5}],
  "keyFeatures": ["Feature 1", "Feature 2"],
  "pricing": [{"plan": "Plan name", "price": "$X/month", "features": ["feature1", "feature2"]}],
  "aboutContent": "About us content summary",
  "missionStatement": "Mission or vision statement"
}

Be thorough but accurate. Only include information that is clearly stated on the website.
Return ONLY the JSON object, no other text.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a precise data extraction assistant. Extract structured business information from website content. Return only valid JSON.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 4000,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response from AI");
    }

    const extracted = JSON.parse(content) as ExtractedData;
    return extracted;
  } catch (error) {
    console.error("AI extraction error:", error);
    return {
      businessName: pageTitle || extractDomain(url),
      description: "Failed to extract business information automatically.",
    };
  }
}

export interface ScrapeResult {
  success: boolean;
  scrapeId: string;
  error?: string;
}

export async function scrapeWebsite(
  url: string,
  workspaceId: string,
  botId?: string
): Promise<ScrapeResult> {
  const startTime = Date.now();
  const domain = extractDomain(url);

  const scrapeRecord = await storage.createScrapedWebsite({
    workspaceId,
    botId: botId || null,
    url,
    domain,
    status: "processing",
  });

  try {
    const { html, title, metaDescription } = await fetchWebpage(url);
    const rawText = extractTextFromHtml(html);

    await storage.updateScrapedWebsite(scrapeRecord.id, {
      rawHtml: html.substring(0, 500000),
      rawText,
      pageTitle: title,
      metaDescription,
    });

    const extractedData = await extractBusinessDataWithAI(rawText, url, title);
    const processingTimeMs = Date.now() - startTime;

    await storage.updateScrapedWebsite(scrapeRecord.id, {
      extractedData: extractedData as any,
      status: "completed",
      processingTimeMs,
      pagesScraped: 1,
    });

    return {
      success: true,
      scrapeId: scrapeRecord.id,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    const processingTimeMs = Date.now() - startTime;

    await storage.updateScrapedWebsite(scrapeRecord.id, {
      status: "failed",
      errorMessage,
      processingTimeMs,
    });

    return {
      success: false,
      scrapeId: scrapeRecord.id,
      error: errorMessage,
    };
  }
}

export async function applyScrapedDataToBot(
  scrapeId: string,
  botId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const scrape = await storage.getScrapedWebsiteById(scrapeId);
    if (!scrape) {
      return { success: false, error: "Scrape record not found" };
    }

    if (scrape.status !== "completed") {
      return { success: false, error: "Scrape is not completed yet" };
    }

    await storage.updateScrapedWebsite(scrapeId, {
      botId,
      appliedToBotAt: new Date(),
      appliedByUserId: userId,
    });

    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return { success: false, error: errorMessage };
  }
}

// =====================================================
// Multi-Page Crawling & Website Import Feature
// =====================================================

export interface PageData {
  url: string;
  title: string;
  text: string;
  links: string[];
  depth: number;
}

export interface SuggestionItem {
  value: string;
  sourcePageUrl: string;
  confidence: number;
  category: string;
}

export interface ServiceSuggestion {
  name: string;
  description?: string;
  price?: string;
  sourcePageUrl: string;
  confidence: number;
}

export interface FaqSuggestion {
  question: string;
  answer: string;
  sourcePageUrl: string;
  confidence: number;
}

export interface ContactSuggestion {
  type: 'phone' | 'email' | 'address' | 'hours';
  value: string;
  sourcePageUrl: string;
  confidence: number;
}

export interface BookingLinkSuggestion {
  url: string;
  provider?: string;
  sourcePageUrl: string;
  confidence: number;
}

export interface SocialLinkSuggestion {
  platform: string;
  url: string;
  sourcePageUrl: string;
  confidence: number;
}

export interface WebsiteImportSuggestions {
  businessName?: string;
  tagline?: string;
  description?: string;
  services: ServiceSuggestion[];
  faqs: FaqSuggestion[];
  contact: ContactSuggestion[];
  bookingLinks: BookingLinkSuggestion[];
  socialLinks: SocialLinkSuggestion[];
  policies: SuggestionItem[];
  pagesScanned: number;
  scanDuration: number;
  sourceUrls: string[];
}

/**
 * Extract all links from HTML content
 */
export function extractLinksFromHtml(html: string, baseUrl: string): string[] {
  const links: string[] = [];
  const linkRegex = /<a[^>]+href=["']([^"'#]+)["']/gi;
  let match;

  while ((match = linkRegex.exec(html)) !== null) {
    let href = match[1].trim();
    
    // Skip empty, javascript, mailto, tel links
    if (!href || href.startsWith('javascript:') || href.startsWith('mailto:') || 
        href.startsWith('tel:') || href.startsWith('#') || href.startsWith('data:')) {
      continue;
    }

    try {
      // Resolve relative URLs
      const absoluteUrl = new URL(href, baseUrl).href;
      
      // Only include http/https URLs
      if (absoluteUrl.startsWith('http://') || absoluteUrl.startsWith('https://')) {
        links.push(absoluteUrl);
      }
    } catch {
      // Skip invalid URLs
    }
  }

  return [...new Set(links)]; // Deduplicate
}

/**
 * Prioritize links for crawling (services, about, contact, faq pages first)
 */
function prioritizeLinks(links: string[], baseUrl: string): string[] {
  const priorityKeywords = [
    'services', 'service', 'what-we-do', 'our-work',
    'about', 'about-us', 'who-we-are', 'team', 'our-team',
    'contact', 'contact-us', 'get-in-touch', 'location',
    'faq', 'faqs', 'questions', 'help', 'support',
    'pricing', 'prices', 'rates', 'packages',
    'hours', 'schedule', 'availability', 'book', 'booking', 'appointment',
    'menu', 'treatments', 'products', 'offerings',
    'policy', 'policies', 'terms', 'privacy', 'cancellation',
  ];

  const sameDomainLinks = links.filter(link => isSameDomain(baseUrl, link));
  
  const prioritized = sameDomainLinks.sort((a, b) => {
    const aLower = a.toLowerCase();
    const bLower = b.toLowerCase();
    
    const aScore = priorityKeywords.reduce((score, keyword) => 
      aLower.includes(keyword) ? score + 1 : score, 0);
    const bScore = priorityKeywords.reduce((score, keyword) => 
      bLower.includes(keyword) ? score + 1 : score, 0);
    
    return bScore - aScore;
  });

  return prioritized;
}

/**
 * Delay helper for rate limiting
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Crawl multiple pages of a website
 */
export async function crawlWebsiteMultiPage(
  startUrl: string,
  options: Partial<typeof CRAWL_CONFIG> = {}
): Promise<PageData[]> {
  const config = { ...CRAWL_CONFIG, ...options };
  const visited = new Set<string>();
  const pages: PageData[] = [];
  const queue: Array<{ url: string; depth: number }> = [{ url: startUrl, depth: 0 }];
  const startTime = Date.now();

  // Normalize the start URL
  const validation = validateWebsiteUrl(startUrl);
  if (!validation.valid || !validation.url) {
    throw new Error(validation.error || 'Invalid start URL');
  }
  const normalizedStartUrl = validation.url;
  visited.add(normalizedStartUrl);

  while (queue.length > 0 && pages.length < config.maxPages) {
    // Check total timeout
    if (Date.now() - startTime > config.totalTimeoutMs) {
      console.log(`Website import: Total timeout reached after ${pages.length} pages`);
      break;
    }

    const { url, depth } = queue.shift()!;

    try {
      // Rate limiting delay
      if (pages.length > 0) {
        await delay(config.delayBetweenRequestsMs);
      }

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), config.pageTimeoutMs);

      try {
        const response = await fetch(url, {
          signal: controller.signal,
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          },
        });

        if (!response.ok) {
          continue;
        }

        const contentType = response.headers.get('content-type') || '';
        if (!contentType.includes('text/html')) {
          continue; // Skip non-HTML content
        }

        const html = await response.text();
        const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
        const title = titleMatch ? titleMatch[1].trim() : '';
        const text = extractTextFromHtml(html);
        const links = extractLinksFromHtml(html, url);

        pages.push({ url, title, text, links, depth });

        // Add new links to queue if within depth limit
        if (depth < config.maxDepth) {
          const prioritizedLinks = prioritizeLinks(links, normalizedStartUrl);
          
          for (const link of prioritizedLinks) {
            if (!visited.has(link) && isSameDomain(normalizedStartUrl, link)) {
              visited.add(link);
              queue.push({ url: link, depth: depth + 1 });
            }
          }
        }
      } finally {
        clearTimeout(timeout);
      }
    } catch (error) {
      console.log(`Website import: Failed to fetch ${url}: ${error}`);
      // Continue with other pages
    }
  }

  return pages;
}

/**
 * Extract structured suggestions from crawled pages using AI
 */
export async function extractWebsiteImportSuggestions(
  pages: PageData[],
  baseUrl: string
): Promise<WebsiteImportSuggestions> {
  const startTime = Date.now();
  const suggestions: WebsiteImportSuggestions = {
    services: [],
    faqs: [],
    contact: [],
    bookingLinks: [],
    socialLinks: [],
    policies: [],
    pagesScanned: pages.length,
    scanDuration: 0,
    sourceUrls: pages.map(p => p.url),
  };

  // Collect all links for booking/social detection
  const allLinks: string[] = [];
  pages.forEach(page => {
    allLinks.push(...page.links);
  });

  // Detect booking links
  const bookingLinks = detectBookingLinks(allLinks);
  suggestions.bookingLinks = bookingLinks.map(link => ({
    ...link,
    sourcePageUrl: pages.find(p => p.links.includes(link.url))?.url || baseUrl,
  }));

  // Detect social links
  const socialLinks = detectSocialLinks(allLinks);
  suggestions.socialLinks = socialLinks.map(link => ({
    ...link,
    sourcePageUrl: pages.find(p => p.links.includes(link.url))?.url || baseUrl,
  }));

  // Combine page content for AI extraction (limit total size)
  const combinedContent = pages
    .map(p => `\n--- PAGE: ${p.url} ---\nTitle: ${p.title}\n${p.text.substring(0, 5000)}`)
    .join('\n\n')
    .substring(0, 30000);

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an expert at extracting business information from website content. 
Extract structured data with high accuracy. For each item, include the source page URL where you found it.
Return valid JSON only.`,
        },
        {
          role: "user",
          content: `Analyze this website content from ${baseUrl} and extract business information.

${combinedContent}

Return a JSON object with:
{
  "businessName": "Name of the business",
  "tagline": "Business tagline or slogan",
  "description": "Brief business description (1-2 sentences)",
  "services": [{"name": "Service name", "description": "Description", "price": "Price if found", "sourcePageUrl": "URL where found", "confidence": 0.0-1.0}],
  "faqs": [{"question": "Question", "answer": "Answer", "sourcePageUrl": "URL where found", "confidence": 0.0-1.0}],
  "contact": [{"type": "phone|email|address|hours", "value": "Value", "sourcePageUrl": "URL where found", "confidence": 0.0-1.0}],
  "policies": [{"value": "Policy text (cancellation, refund, etc.)", "category": "cancellation|refund|privacy|terms", "sourcePageUrl": "URL where found", "confidence": 0.0-1.0}]
}

Be thorough and extract all services, FAQs, and contact information found. Use confidence scores (0.0-1.0) based on how clearly the information was stated.`,
        },
      ],
      temperature: 0.2,
      max_tokens: 4000,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content;
    if (content) {
      const extracted = JSON.parse(content);
      
      if (extracted.businessName) suggestions.businessName = extracted.businessName;
      if (extracted.tagline) suggestions.tagline = extracted.tagline;
      if (extracted.description) suggestions.description = extracted.description;
      
      if (Array.isArray(extracted.services)) {
        suggestions.services = extracted.services.map((s: any) => ({
          name: s.name,
          description: s.description,
          price: s.price,
          sourcePageUrl: s.sourcePageUrl || baseUrl,
          confidence: s.confidence || 0.8,
        }));
      }
      
      if (Array.isArray(extracted.faqs)) {
        suggestions.faqs = extracted.faqs.map((f: any) => ({
          question: f.question,
          answer: f.answer,
          sourcePageUrl: f.sourcePageUrl || baseUrl,
          confidence: f.confidence || 0.8,
        }));
      }
      
      if (Array.isArray(extracted.contact)) {
        suggestions.contact = extracted.contact.map((c: any) => ({
          type: c.type,
          value: c.value,
          sourcePageUrl: c.sourcePageUrl || baseUrl,
          confidence: c.confidence || 0.9,
        }));
      }
      
      if (Array.isArray(extracted.policies)) {
        suggestions.policies = extracted.policies.map((p: any) => ({
          value: p.value,
          category: p.category || 'general',
          sourcePageUrl: p.sourcePageUrl || baseUrl,
          confidence: p.confidence || 0.7,
        }));
      }
    }
  } catch (error) {
    console.error("AI extraction error for website import:", error);
  }

  suggestions.scanDuration = Date.now() - startTime;
  return suggestions;
}

/**
 * Full website import function - crawl and extract suggestions
 */
export async function importWebsite(
  url: string,
  options?: Partial<typeof CRAWL_CONFIG>
): Promise<WebsiteImportSuggestions> {
  const pages = await crawlWebsiteMultiPage(url, options);
  
  if (pages.length === 0) {
    throw new Error('No pages could be crawled from the provided URL');
  }

  return extractWebsiteImportSuggestions(pages, url);
}

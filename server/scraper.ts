import OpenAI from "openai";
import { storage } from "./storage";
import type { ScrapedWebsite, InsertScrapedWebsite } from "@shared/schema";
import { validateBookingUrl, validateWebsiteUrl, isSameDomain, detectBookingLinks, detectSocialLinks } from "./urlValidator";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
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

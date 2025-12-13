import { describe, it, expect } from "vitest";
import {
  validateBookingUrl,
  validateWebsiteUrl,
  extractDomain,
  isSameDomain,
  detectBookingLinks,
  detectSocialLinks,
} from "../../server/urlValidator";

describe("validateBookingUrl", () => {
  it("should accept valid HTTPS URLs", () => {
    const result = validateBookingUrl("https://example.com/book");
    expect(result.valid).toBe(true);
    expect(result.url).toBe("https://example.com/book");
  });

  it("should add https:// when no protocol is provided", () => {
    const result = validateBookingUrl("calendly.com/myuser");
    expect(result.valid).toBe(true);
    expect(result.url).toBe("https://calendly.com/myuser");
  });

  it("should reject HTTP URLs", () => {
    const result = validateBookingUrl("http://example.com/book");
    expect(result.valid).toBe(false);
    expect(result.error).toContain("HTTPS");
  });

  it("should reject javascript: protocol", () => {
    const result = validateBookingUrl("javascript:alert(1)");
    expect(result.valid).toBe(false);
    expect(result.error).toContain("Unsafe protocol");
  });

  it("should reject data: protocol", () => {
    const result = validateBookingUrl("data:text/html,<script>alert(1)</script>");
    expect(result.valid).toBe(false);
    expect(result.error).toContain("Unsafe protocol");
  });

  it("should reject payment URLs", () => {
    const result = validateBookingUrl("https://stripe.com/pay");
    expect(result.valid).toBe(false);
    expect(result.error).toContain("Payment URLs are not allowed");
  });

  it("should reject PayPal URLs", () => {
    const result = validateBookingUrl("https://paypal.com/checkout");
    expect(result.valid).toBe(false);
    expect(result.error).toContain("Payment URLs are not allowed");
  });

  it("should identify Calendly as a booking provider", () => {
    const result = validateBookingUrl("https://calendly.com/myuser/30min");
    expect(result.valid).toBe(true);
    expect(result.isBookingProvider).toBe(true);
    expect(result.providerName).toBe("Calendly");
  });

  it("should identify Acuity Scheduling as a booking provider", () => {
    const result = validateBookingUrl("https://acuityscheduling.com/schedule.php?owner=123");
    expect(result.valid).toBe(true);
    expect(result.isBookingProvider).toBe(true);
    expect(result.providerName).toBe("Acuity Scheduling");
  });

  it("should identify OpenTable as a booking provider", () => {
    const result = validateBookingUrl("https://opentable.com/r/restaurant-name");
    expect(result.valid).toBe(true);
    expect(result.isBookingProvider).toBe(true);
    expect(result.providerName).toBe("OpenTable");
  });

  it("should handle empty string", () => {
    const result = validateBookingUrl("");
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });

  it("should handle null and undefined", () => {
    expect(validateBookingUrl(null as any).valid).toBe(false);
    expect(validateBookingUrl(undefined as any).valid).toBe(false);
  });

  it("should reject invalid URL format", () => {
    const result = validateBookingUrl("not a valid url at all");
    expect(result.valid).toBe(false);
    expect(result.error).toContain("Invalid URL format");
  });
});

describe("validateWebsiteUrl", () => {
  it("should accept valid HTTPS URLs", () => {
    const result = validateWebsiteUrl("https://example.com");
    expect(result.valid).toBe(true);
    expect(result.url).toBe("https://example.com/");
  });

  it("should accept HTTP URLs for general websites", () => {
    const result = validateWebsiteUrl("http://example.com");
    expect(result.valid).toBe(true);
  });

  it("should add https:// when no protocol is provided", () => {
    const result = validateWebsiteUrl("example.com");
    expect(result.valid).toBe(true);
    expect(result.url).toBe("https://example.com/");
  });

  it("should reject javascript: protocol", () => {
    const result = validateWebsiteUrl("javascript:alert(1)");
    expect(result.valid).toBe(false);
    expect(result.error).toContain("Unsafe protocol");
  });

  it("should handle empty string", () => {
    const result = validateWebsiteUrl("");
    expect(result.valid).toBe(false);
  });
});

describe("extractDomain", () => {
  it("should extract domain from HTTPS URL", () => {
    expect(extractDomain("https://www.example.com/page")).toBe("www.example.com");
  });

  it("should extract domain from HTTP URL", () => {
    expect(extractDomain("http://example.com/page")).toBe("example.com");
  });

  it("should handle URL without protocol", () => {
    expect(extractDomain("example.com/page")).toBe("example.com");
  });

  it("should return null for invalid URL", () => {
    expect(extractDomain("not a url")).toBe(null);
  });
});

describe("isSameDomain", () => {
  it("should return true for same domain", () => {
    expect(isSameDomain("https://example.com", "https://example.com/page")).toBe(true);
  });

  it("should handle www variants", () => {
    expect(isSameDomain("https://www.example.com", "https://example.com")).toBe(true);
    expect(isSameDomain("https://example.com", "https://www.example.com")).toBe(true);
  });

  it("should return false for different domains", () => {
    expect(isSameDomain("https://example.com", "https://other.com")).toBe(false);
  });

  it("should return false for subdomains", () => {
    expect(isSameDomain("https://example.com", "https://blog.example.com")).toBe(false);
  });
});

describe("detectBookingLinks", () => {
  it("should detect Calendly links", () => {
    const urls = ["https://calendly.com/user/30min", "https://example.com"];
    const result = detectBookingLinks(urls);
    expect(result).toHaveLength(1);
    expect(result[0].provider).toBe("Calendly");
    expect(result[0].confidence).toBeGreaterThan(0.9);
  });

  it("should detect multiple booking providers", () => {
    const urls = [
      "https://calendly.com/user",
      "https://acuityscheduling.com/schedule.php",
      "https://example.com",
    ];
    const result = detectBookingLinks(urls);
    expect(result).toHaveLength(2);
  });

  it("should return empty array for non-booking URLs", () => {
    const urls = ["https://example.com", "https://google.com"];
    const result = detectBookingLinks(urls);
    expect(result).toHaveLength(0);
  });
});

describe("detectSocialLinks", () => {
  it("should detect Facebook links", () => {
    const urls = ["https://facebook.com/mybusiness", "https://example.com"];
    const result = detectSocialLinks(urls);
    expect(result).toHaveLength(1);
    expect(result[0].platform).toBe("Facebook");
  });

  it("should detect Instagram links", () => {
    const urls = ["https://instagram.com/mybusiness"];
    const result = detectSocialLinks(urls);
    expect(result).toHaveLength(1);
    expect(result[0].platform).toBe("Instagram");
  });

  it("should detect Twitter/X links", () => {
    const urls = ["https://twitter.com/myhandle", "https://x.com/myhandle"];
    const result = detectSocialLinks(urls);
    expect(result).toHaveLength(2);
    result.forEach((link) => expect(link.platform).toBe("Twitter"));
  });

  it("should detect multiple platforms", () => {
    const urls = [
      "https://facebook.com/page",
      "https://instagram.com/page",
      "https://youtube.com/channel",
    ];
    const result = detectSocialLinks(urls);
    expect(result).toHaveLength(3);
  });

  it("should skip invalid URLs", () => {
    const urls = ["not a url", "https://facebook.com/page"];
    const result = detectSocialLinks(urls);
    expect(result).toHaveLength(1);
  });
});

import { describe, it, expect } from "vitest";
import {
  normalizeServiceName,
  dedupeServices,
  normalizeFaqQuestion,
  dedupeFaqs,
  mergeContactInfo,
} from "../../server/mergeEngine";
import type { ServiceSuggestion, FaqSuggestion, ContactSuggestion } from "../../server/scraper";

const testUrl = "https://example.com/test";

describe("normalizeServiceName", () => {
  it("should lowercase and trim", () => {
    expect(normalizeServiceName("  Hair Cut  ")).toBe("hair cut");
  });

  it("should remove punctuation", () => {
    expect(normalizeServiceName("Men's Haircut!")).toBe("mens haircut");
  });

  it("should collapse multiple spaces", () => {
    expect(normalizeServiceName("Hair   Styling   Service")).toBe("hair styling service");
  });
});

describe("dedupeServices", () => {
  const existingServices = [
    { name: "Haircut", description: "Basic haircut" },
    { name: "Hair Coloring", description: "Full color service" },
  ];

  it("should identify exact duplicates", () => {
    const suggestions: ServiceSuggestion[] = [
      { name: "Haircut", description: "Another haircut", confidence: 0.9, sourcePageUrl: testUrl },
    ];
    const result = dedupeServices(suggestions, existingServices);
    expect(result.duplicates).toHaveLength(1);
    expect(result.toAdd).toHaveLength(0);
  });

  it("should treat normalized variants as duplicates", () => {
    const suggestions: ServiceSuggestion[] = [
      { name: "HAIRCUT", description: "Same but uppercase", confidence: 0.9, sourcePageUrl: testUrl },
    ];
    const result = dedupeServices(suggestions, existingServices);
    expect(result.duplicates).toHaveLength(1);
    expect(result.duplicates[0].existingMatch).toBe("Haircut");
  });

  it("should add new unique services", () => {
    const suggestions: ServiceSuggestion[] = [
      { name: "Beard Trim", description: "Beard trimming", confidence: 0.9, sourcePageUrl: testUrl },
      { name: "Manicure", description: "Nail care", confidence: 0.85, sourcePageUrl: testUrl },
    ];
    const result = dedupeServices(suggestions, existingServices);
    expect(result.toAdd).toHaveLength(2);
    expect(result.duplicates).toHaveLength(0);
  });

  it("should avoid exact self-duplicates in suggestions", () => {
    const suggestions: ServiceSuggestion[] = [
      { name: "Beard Trim", description: "V1", confidence: 0.9, sourcePageUrl: testUrl },
      { name: "Beard Trim", description: "V2", confidence: 0.85, sourcePageUrl: testUrl },
    ];
    const result = dedupeServices(suggestions, []);
    expect(result.toAdd).toHaveLength(1);
  });

  it("should skip empty names", () => {
    const suggestions: ServiceSuggestion[] = [
      { name: "", description: "No name", confidence: 0.9, sourcePageUrl: testUrl },
      { name: "Valid Service", description: "Has name", confidence: 0.9, sourcePageUrl: testUrl },
    ];
    const result = dedupeServices(suggestions, []);
    expect(result.toAdd).toHaveLength(1);
    expect(result.toAdd[0].name).toBe("Valid Service");
  });
});

describe("normalizeFaqQuestion", () => {
  it("should lowercase and trim", () => {
    expect(normalizeFaqQuestion("  What Are Your Hours?  ")).toContain("your hours");
  });

  it("should remove question marks", () => {
    expect(normalizeFaqQuestion("What time do you open?")).not.toContain("?");
  });

  it("should remove common question words", () => {
    const normalized = normalizeFaqQuestion("What are your business hours?");
    expect(normalized).not.toMatch(/^what\s/i);
  });
});

describe("dedupeFaqs", () => {
  const existingFaqs = [
    { question: "What are your hours?", answer: "9am-5pm" },
    { question: "Do you accept walk-ins?", answer: "Yes" },
  ];

  it("should identify exact duplicate questions", () => {
    const suggestions: FaqSuggestion[] = [
      { question: "What are your hours?", answer: "Different answer", confidence: 0.9, sourcePageUrl: testUrl },
    ];
    const result = dedupeFaqs(suggestions, existingFaqs);
    expect(result.duplicates).toHaveLength(1);
    expect(result.toAdd).toHaveLength(0);
  });

  it("should identify similar questions", () => {
    const suggestions: FaqSuggestion[] = [
      { question: "What are your business hours?", answer: "Same thing", confidence: 0.9, sourcePageUrl: testUrl },
    ];
    const result = dedupeFaqs(suggestions, existingFaqs);
    expect(result.duplicates).toHaveLength(1);
  });

  it("should add new unique FAQs", () => {
    const suggestions: FaqSuggestion[] = [
      { question: "Do you offer gift cards?", answer: "Yes we do", confidence: 0.9, sourcePageUrl: testUrl },
    ];
    const result = dedupeFaqs(suggestions, existingFaqs);
    expect(result.toAdd).toHaveLength(1);
    expect(result.duplicates).toHaveLength(0);
  });

  it("should avoid exact self-duplicates in suggestions", () => {
    const suggestions: FaqSuggestion[] = [
      { question: "Do you have parking?", answer: "Yes", confidence: 0.9, sourcePageUrl: testUrl },
      { question: "Do you have parking?", answer: "Also yes", confidence: 0.85, sourcePageUrl: testUrl },
    ];
    const result = dedupeFaqs(suggestions, []);
    expect(result.toAdd).toHaveLength(1);
  });
});

describe("mergeContactInfo", () => {
  it("should fill missing phone", () => {
    const suggestions: ContactSuggestion[] = [
      { type: "phone", value: "555-1234", confidence: 0.9, sourcePageUrl: testUrl },
    ];
    const existing = { email: "test@example.com" };
    const result = mergeContactInfo(suggestions, existing);
    expect(result.updates.phone).toBe("555-1234");
    expect(result.filled).toContain("phone");
  });

  it("should not overwrite existing phone", () => {
    const suggestions: ContactSuggestion[] = [
      { type: "phone", value: "555-9999", confidence: 0.9, sourcePageUrl: testUrl },
    ];
    const existing = { phone: "555-1234" };
    const result = mergeContactInfo(suggestions, existing);
    expect(result.updates.phone).toBeUndefined();
    expect(result.skipped).toContain("phone");
  });

  it("should fill missing email", () => {
    const suggestions: ContactSuggestion[] = [
      { type: "email", value: "contact@business.com", confidence: 0.9, sourcePageUrl: testUrl },
    ];
    const existing = {};
    const result = mergeContactInfo(suggestions, existing);
    expect(result.updates.email).toBe("contact@business.com");
    expect(result.filled).toContain("email");
  });

  it("should fill missing address", () => {
    const suggestions: ContactSuggestion[] = [
      { type: "address", value: "123 Main St", confidence: 0.9, sourcePageUrl: testUrl },
    ];
    const existing = {};
    const result = mergeContactInfo(suggestions, existing);
    expect(result.updates.address).toBe("123 Main St");
    expect(result.filled).toContain("address");
  });

  it("should fill multiple missing fields", () => {
    const suggestions: ContactSuggestion[] = [
      { type: "phone", value: "555-1234", confidence: 0.9, sourcePageUrl: testUrl },
      { type: "email", value: "test@example.com", confidence: 0.9, sourcePageUrl: testUrl },
      { type: "address", value: "123 Main St", confidence: 0.9, sourcePageUrl: testUrl },
    ];
    const existing = {};
    const result = mergeContactInfo(suggestions, existing);
    expect(result.filled).toHaveLength(3);
    expect(result.updates.phone).toBe("555-1234");
    expect(result.updates.email).toBe("test@example.com");
    expect(result.updates.address).toBe("123 Main St");
  });

  it("should skip empty values", () => {
    const suggestions: ContactSuggestion[] = [
      { type: "phone", value: "", confidence: 0.9, sourcePageUrl: testUrl },
      { type: "email", value: "   ", confidence: 0.9, sourcePageUrl: testUrl },
    ];
    const existing = {};
    const result = mergeContactInfo(suggestions, existing);
    expect(result.filled).toHaveLength(0);
  });

  it("should parse hours string into structured format", () => {
    const suggestions: ContactSuggestion[] = [
      { type: "hours", value: "Monday: 9am-5pm, Tuesday: 10am-6pm", confidence: 0.9, sourcePageUrl: testUrl },
    ];
    const existing = {};
    const result = mergeContactInfo(suggestions, existing);
    expect(result.updates.hours).toBeDefined();
    expect(result.updates.hours?.Monday).toContain("9am");
  });
});

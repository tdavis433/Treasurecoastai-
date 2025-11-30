import { describe, it, expect } from "vitest";
import { 
  validateHexColor, 
  sanitizeHexColor, 
  sanitizeInput 
} from "../../server/utils";

describe("validateHexColor", () => {
  it("should accept valid 6-character hex colors", () => {
    expect(validateHexColor("#ffffff")).toBe(true);
    expect(validateHexColor("#000000")).toBe(true);
    expect(validateHexColor("#2563eb")).toBe(true);
    expect(validateHexColor("#AABBCC")).toBe(true);
  });

  it("should accept valid 3-character hex colors", () => {
    expect(validateHexColor("#fff")).toBe(true);
    expect(validateHexColor("#000")).toBe(true);
    expect(validateHexColor("#abc")).toBe(true);
    expect(validateHexColor("#ABC")).toBe(true);
  });

  it("should reject invalid hex colors", () => {
    expect(validateHexColor("ffffff")).toBe(false);
    expect(validateHexColor("#gggggg")).toBe(false);
    expect(validateHexColor("#12345")).toBe(false);
    expect(validateHexColor("#1234567")).toBe(false);
    expect(validateHexColor("red")).toBe(false);
    expect(validateHexColor("")).toBe(false);
  });

  it("should handle null and undefined", () => {
    expect(validateHexColor(null as any)).toBe(false);
    expect(validateHexColor(undefined as any)).toBe(false);
  });
});

describe("sanitizeHexColor", () => {
  it("should return valid hex color unchanged", () => {
    expect(sanitizeHexColor("#2563eb")).toBe("#2563eb");
    expect(sanitizeHexColor("#fff")).toBe("#fff");
  });

  it("should return default color for invalid input", () => {
    expect(sanitizeHexColor("invalid")).toBe("#2563eb");
    expect(sanitizeHexColor("")).toBe("#2563eb");
  });

  it("should use custom default color when provided", () => {
    expect(sanitizeHexColor("invalid", "#000000")).toBe("#000000");
  });
});

describe("sanitizeInput", () => {
  it("should remove angle brackets", () => {
    expect(sanitizeInput("<script>alert('xss')</script>")).toBe("scriptalert('xss')/script");
  });

  it("should trim whitespace", () => {
    expect(sanitizeInput("  hello world  ")).toBe("hello world");
  });

  it("should handle empty strings", () => {
    expect(sanitizeInput("")).toBe("");
  });

  it("should handle null and undefined", () => {
    expect(sanitizeInput(null as any)).toBe("");
    expect(sanitizeInput(undefined as any)).toBe("");
  });

  it("should limit string length to 10000 characters", () => {
    const longString = "a".repeat(20000);
    expect(sanitizeInput(longString).length).toBe(10000);
  });

  it("should preserve normal text", () => {
    expect(sanitizeInput("Hello, how can I help you?")).toBe("Hello, how can I help you?");
  });
});

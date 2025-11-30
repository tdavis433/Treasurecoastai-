import { describe, it, expect } from "vitest";
import { 
  isWithinOfficeHours, 
  evaluateKeywordTrigger,
  detectLeadCaptureOpportunity,
  extractContactInfo,
  processAutomations,
  type BotAutomationConfig,
  type AutomationContext,
  type AutomationRule
} from "../../server/automations";

describe("isWithinOfficeHours", () => {
  it("should return true when no office hours configured", () => {
    expect(isWithinOfficeHours(undefined)).toBe(true);
  });

  it("should return true when enableAfterHoursMode is false", () => {
    const config = {
      schedule: {
        monday: { open: "09:00", close: "17:00" }
      },
      timezone: "America/New_York",
      enableAfterHoursMode: false
    };
    expect(isWithinOfficeHours(config)).toBe(true);
  });

  it("should return false when schedule is empty and afterHoursMode is enabled", () => {
    const config = {
      schedule: {} as Record<string, { open: string; close: string } | null>,
      timezone: "America/New_York",
      enableAfterHoursMode: true
    };
    expect(isWithinOfficeHours(config)).toBe(false);
  });

  it("should handle closed days (null schedule entry)", () => {
    const config = {
      schedule: {
        sunday: null
      },
      timezone: "America/New_York",
      enableAfterHoursMode: true
    };
    const sunday = new Date("2024-01-07T14:00:00Z");
    expect(isWithinOfficeHours(config, sunday)).toBe(false);
  });
});

describe("evaluateKeywordTrigger", () => {
  const createRule = (keywords: string[], match?: 'exact' | 'contains' | 'starts_with' | 'ends_with'): AutomationRule => ({
    id: "test-rule",
    type: "keyword_trigger",
    enabled: true,
    priority: 1,
    conditions: [
      {
        type: "keyword",
        value: keywords,
        match: match ?? "contains"
      }
    ]
  });

  it("should match contains keywords", () => {
    const rule = createRule(["help", "pricing"]);
    expect(evaluateKeywordTrigger("I need help with pricing", rule)).toBe(true);
    expect(evaluateKeywordTrigger("hello world", rule)).toBe(false);
  });

  it("should match exact keywords", () => {
    const rule = createRule(["hello"], "exact");
    expect(evaluateKeywordTrigger("hello", rule)).toBe(true);
    expect(evaluateKeywordTrigger("hello world", rule)).toBe(false);
  });

  it("should match starts_with", () => {
    const rule = createRule(["hi"], "starts_with");
    expect(evaluateKeywordTrigger("hi there", rule)).toBe(true);
    expect(evaluateKeywordTrigger("say hi", rule)).toBe(false);
  });

  it("should match ends_with", () => {
    const rule = createRule(["please"], "ends_with");
    expect(evaluateKeywordTrigger("help me please", rule)).toBe(true);
    expect(evaluateKeywordTrigger("please help me", rule)).toBe(false);
  });

  it("should be case insensitive by default", () => {
    const rule = createRule(["hello"]);
    expect(evaluateKeywordTrigger("HELLO world", rule)).toBe(true);
  });

  it("should handle empty message", () => {
    const rule = createRule(["hello"]);
    expect(evaluateKeywordTrigger("", rule)).toBe(false);
  });
});

describe("extractContactInfo", () => {
  it("should extract email addresses", () => {
    const result = extractContactInfo("My email is test@example.com");
    expect(result.email).toBe("test@example.com");
  });

  it("should extract phone numbers", () => {
    const result = extractContactInfo("Call me at 555-123-4567");
    expect(result.phone).toBe("555-123-4567");
  });

  it("should extract both email and phone", () => {
    const result = extractContactInfo(
      "Email me at user@test.com or call 555-987-6543"
    );
    expect(result.email).toBe("user@test.com");
    expect(result.phone).toBe("555-987-6543");
  });

  it("should return empty object when no contact info found", () => {
    const result = extractContactInfo("Just browsing around");
    expect(result.email).toBeUndefined();
    expect(result.phone).toBeUndefined();
  });
});

describe("detectLeadCaptureOpportunity", () => {
  it("should return false when lead capture is disabled", () => {
    expect(detectLeadCaptureOpportunity("I want an appointment")).toBe(false);
    expect(detectLeadCaptureOpportunity("I want an appointment", { enabled: false })).toBe(false);
  });

  it("should detect default trigger keywords when enabled", () => {
    const config = { enabled: true };
    expect(detectLeadCaptureOpportunity("I want to schedule a demo", config)).toBe(true);
    expect(detectLeadCaptureOpportunity("please contact me", config)).toBe(true);
    expect(detectLeadCaptureOpportunity("just browsing", config)).toBe(false);
  });

  it("should use custom trigger keywords", () => {
    const config = {
      enabled: true,
      triggerKeywords: ["custom", "special"]
    };
    expect(detectLeadCaptureOpportunity("I have a custom request", config)).toBe(true);
    expect(detectLeadCaptureOpportunity("schedule a demo", config)).toBe(false);
  });
});

describe("processAutomations", () => {
  const baseContext: AutomationContext = {
    clientId: "test-client",
    botId: "test-bot",
    sessionId: "test-session",
    message: "Hello",
    messageCount: 1
  };

  it("should return default result with no automations", async () => {
    const config: BotAutomationConfig = {};
    const result = await processAutomations(baseContext, config);
    
    expect(result.triggered).toBe(false);
    expect(result.shouldContinue).toBe(true);
  });

  it("should trigger keyword automation", async () => {
    const config: BotAutomationConfig = {
      automations: [
        {
          id: "price-inquiry",
          type: "keyword_trigger",
          enabled: true,
          priority: 1,
          conditions: [
            {
              type: "keyword",
              value: ["pricing", "cost", "price"],
              match: "contains"
            }
          ],
          response: "Our pricing starts at $99/month."
        }
      ]
    };

    const result = await processAutomations(
      { ...baseContext, message: "What is your pricing?" },
      config
    );

    expect(result.triggered).toBe(true);
    expect(result.ruleId).toBe("price-inquiry");
    expect(result.response).toBe("Our pricing starts at $99/month.");
  });

  it("should skip disabled automations", async () => {
    const config: BotAutomationConfig = {
      automations: [
        {
          id: "disabled-rule",
          type: "keyword_trigger",
          enabled: false,
          priority: 1,
          conditions: [
            {
              type: "keyword",
              value: ["test"],
              match: "contains"
            }
          ],
          response: "Should not see this"
        }
      ]
    };

    const result = await processAutomations(
      { ...baseContext, message: "test message" },
      config
    );

    expect(result.triggered).toBe(false);
  });

  it("should respect automation priority (higher number = higher priority)", async () => {
    const config: BotAutomationConfig = {
      automations: [
        {
          id: "low-priority",
          type: "keyword_trigger",
          enabled: true,
          priority: 1,
          conditions: [{ type: "keyword", value: ["hello"], match: "contains" }],
          response: "Low priority response"
        },
        {
          id: "high-priority",
          type: "keyword_trigger",
          enabled: true,
          priority: 100,
          conditions: [{ type: "keyword", value: ["hello"], match: "contains" }],
          response: "High priority response"
        }
      ]
    };

    const result = await processAutomations(
      { ...baseContext, message: "hello there" },
      config
    );

    expect(result.triggered).toBe(true);
    expect(result.ruleId).toBe("high-priority");
    expect(result.response).toBe("High priority response");
  });
});

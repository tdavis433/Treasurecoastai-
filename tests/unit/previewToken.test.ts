import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { 
  generatePreviewToken, 
  verifyPreviewToken, 
  getTokenTimeRemaining,
  PreviewTokenPayload
} from "../../server/previewToken";

describe("generatePreviewToken", () => {
  it("should generate a valid token with expected structure", () => {
    const result = generatePreviewToken("test-workspace", "bot-123");
    
    expect(result.token).toBeDefined();
    expect(typeof result.token).toBe("string");
    expect(result.token.split(".").length).toBe(2);
    expect(result.expiresAt).toBeInstanceOf(Date);
    expect(result.expiresIn).toBe(86400);
  });

  it("should generate a token with custom TTL", () => {
    const customTTL = 3600;
    const result = generatePreviewToken("test-workspace", "bot-123", customTTL);
    
    expect(result.expiresIn).toBe(customTTL);
  });

  it("should include workspace and bot in token", () => {
    const { token } = generatePreviewToken("my-workspace", "my-bot");
    const result = verifyPreviewToken(token);
    
    expect(result.valid).toBe(true);
    expect(result.payload?.workspaceSlug).toBe("my-workspace");
    expect(result.payload?.botId).toBe("my-bot");
  });
});

describe("verifyPreviewToken", () => {
  it("should verify a valid token successfully", () => {
    const { token } = generatePreviewToken("test-workspace", "bot-123");
    const result = verifyPreviewToken(token);
    
    expect(result.valid).toBe(true);
    expect(result.payload).toBeDefined();
    expect(result.payload?.workspaceSlug).toBe("test-workspace");
    expect(result.payload?.botId).toBe("bot-123");
    expect(result.payload?.type).toBe("preview");
  });

  it("should reject empty token", () => {
    const result = verifyPreviewToken("");
    
    expect(result.valid).toBe(false);
    expect(result.error).toBe("Token is required");
  });

  it("should reject null/undefined token", () => {
    const result1 = verifyPreviewToken(null as any);
    const result2 = verifyPreviewToken(undefined as any);
    
    expect(result1.valid).toBe(false);
    expect(result2.valid).toBe(false);
  });

  it("should reject token with invalid format", () => {
    const result = verifyPreviewToken("invalid-token-without-dot");
    
    expect(result.valid).toBe(false);
    expect(result.error).toBe("Invalid token format");
  });

  it("should reject token with tampered signature", () => {
    const { token } = generatePreviewToken("test-workspace", "bot-123");
    const [payload, sig] = token.split(".");
    const tamperedSig = sig.slice(0, -2) + "XX";
    const tamperedToken = `${payload}.${tamperedSig}`;
    
    const result = verifyPreviewToken(tamperedToken);
    
    expect(result.valid).toBe(false);
    expect(["Invalid token signature", "Token verification failed"]).toContain(result.error);
  });

  it("should reject token with tampered payload", () => {
    const { token } = generatePreviewToken("test-workspace", "bot-123");
    const [, signature] = token.split(".");
    const tamperedPayload = Buffer.from(JSON.stringify({
      type: "preview",
      workspaceSlug: "hacked-workspace",
      botId: "bot-123",
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 86400
    })).toString("base64url");
    
    const result = verifyPreviewToken(`${tamperedPayload}.${signature}`);
    
    expect(result.valid).toBe(false);
    expect(result.error).toBe("Invalid token signature");
  });

  describe("workspace mismatch rejection", () => {
    it("should reject token for wrong workspace", () => {
      const { token } = generatePreviewToken("workspace-a", "bot-123");
      const result = verifyPreviewToken(token, "workspace-b");
      
      expect(result.valid).toBe(false);
      expect(result.error).toBe("Token workspace mismatch");
    });

    it("should accept token for correct workspace", () => {
      const { token } = generatePreviewToken("workspace-a", "bot-123");
      const result = verifyPreviewToken(token, "workspace-a");
      
      expect(result.valid).toBe(true);
    });
  });

  describe("bot mismatch rejection", () => {
    it("should reject token for wrong bot", () => {
      const { token } = generatePreviewToken("workspace", "bot-a");
      const result = verifyPreviewToken(token, undefined, "bot-b");
      
      expect(result.valid).toBe(false);
      expect(result.error).toBe("Token bot mismatch");
    });

    it("should accept token for correct bot", () => {
      const { token } = generatePreviewToken("workspace", "bot-a");
      const result = verifyPreviewToken(token, undefined, "bot-a");
      
      expect(result.valid).toBe(true);
    });
  });

  describe("token expiry handling", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("should reject expired token", () => {
      const { token } = generatePreviewToken("workspace", "bot", 60);
      
      vi.advanceTimersByTime(61 * 1000);
      
      const result = verifyPreviewToken(token);
      
      expect(result.valid).toBe(false);
      expect(result.error).toBe("Token expired");
    });

    it("should accept token that has not expired", () => {
      const { token } = generatePreviewToken("workspace", "bot", 3600);
      
      vi.advanceTimersByTime(1800 * 1000);
      
      const result = verifyPreviewToken(token);
      
      expect(result.valid).toBe(true);
    });

    it("should reject token well past expiry boundary", () => {
      const { token } = generatePreviewToken("workspace", "bot", 60);
      
      vi.advanceTimersByTime(120 * 1000);
      
      const result = verifyPreviewToken(token);
      
      expect(result.valid).toBe(false);
      expect(result.error).toBe("Token expired");
    });
  });
});

describe("getTokenTimeRemaining", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-01-01T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should return correct time for hours remaining", () => {
    const payload: PreviewTokenPayload = {
      type: "preview",
      workspaceSlug: "test",
      botId: "bot",
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 7200 + 1800
    };
    
    const result = getTokenTimeRemaining(payload);
    
    expect(result.expired).toBe(false);
    expect(result.hoursRemaining).toBe(2);
    expect(result.humanReadable).toBe("2h 30m remaining");
  });

  it("should return correct time for minutes remaining", () => {
    const payload: PreviewTokenPayload = {
      type: "preview",
      workspaceSlug: "test",
      botId: "bot",
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 1800
    };
    
    const result = getTokenTimeRemaining(payload);
    
    expect(result.expired).toBe(false);
    expect(result.hoursRemaining).toBe(0);
    expect(result.humanReadable).toBe("30m remaining");
  });

  it("should return correct time for seconds remaining", () => {
    const payload: PreviewTokenPayload = {
      type: "preview",
      workspaceSlug: "test",
      botId: "bot",
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 45
    };
    
    const result = getTokenTimeRemaining(payload);
    
    expect(result.expired).toBe(false);
    expect(result.secondsRemaining).toBe(45);
    expect(result.humanReadable).toBe("45s remaining");
  });

  it("should indicate expired for past expiry", () => {
    const payload: PreviewTokenPayload = {
      type: "preview",
      workspaceSlug: "test",
      botId: "bot",
      iat: Math.floor(Date.now() / 1000) - 7200,
      exp: Math.floor(Date.now() / 1000) - 3600
    };
    
    const result = getTokenTimeRemaining(payload);
    
    expect(result.expired).toBe(true);
    expect(result.secondsRemaining).toBe(0);
    expect(result.humanReadable).toBe("Expired");
  });
});

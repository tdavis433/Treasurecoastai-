import { describe, it, expect } from "vitest";
import { getExportClientId, requireExportClientId } from "../../server/utils/tenantScope";

describe("tenantScope", () => {
  describe("getExportClientId", () => {
    it("returns sessionClientId when present", () => {
      const result = getExportClientId("faith_house");
      expect(result).toBe("faith_house");
    });

    it("returns undefined when sessionClientId is undefined", () => {
      const result = getExportClientId(undefined);
      expect(result).toBeUndefined();
    });

    it("returns undefined when sessionClientId is null", () => {
      const result = getExportClientId(null);
      expect(result).toBeUndefined();
    });

    it("returns empty string if sessionClientId is empty string", () => {
      const result = getExportClientId("");
      expect(result).toBe("");
    });
  });

  describe("requireExportClientId", () => {
    it("returns clientId when present", () => {
      const result = requireExportClientId("demo_workspace");
      expect(result).toBe("demo_workspace");
    });

    it("throws Error when sessionClientId is undefined", () => {
      expect(() => requireExportClientId(undefined)).toThrow("Client ID required");
    });

    it("throws Error when sessionClientId is empty string", () => {
      expect(() => requireExportClientId("")).toThrow("Client ID required");
    });

    it("throws Error when sessionClientId is whitespace only", () => {
      expect(() => requireExportClientId("   ")).toThrow("Client ID required");
    });

    it("throws Error when sessionClientId is null", () => {
      expect(() => requireExportClientId(null)).toThrow("Client ID required");
    });
  });
});

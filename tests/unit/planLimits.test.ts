import { describe, it, expect, vi, beforeEach } from "vitest";
import { getCurrentMonth } from "../../server/planLimits";
import { PLAN_TIERS } from "../../shared/schema";

describe("getCurrentMonth", () => {
  it("should return current month in YYYY-MM format", () => {
    const result = getCurrentMonth();
    expect(result).toMatch(/^\d{4}-\d{2}$/);
  });

  it("should pad single digit months", () => {
    const result = getCurrentMonth();
    const month = result.split("-")[1];
    expect(month).toHaveLength(2);
  });
});

describe("PLAN_TIERS", () => {
  it("should have correct tier definitions", () => {
    expect(PLAN_TIERS.free).toBeDefined();
    expect(PLAN_TIERS.starter).toBeDefined();
    expect(PLAN_TIERS.pro).toBeDefined();
    expect(PLAN_TIERS.enterprise).toBeDefined();
  });

  it("should have increasing limits for higher tiers", () => {
    expect(PLAN_TIERS.free.messagesPerMonth).toBeLessThan(PLAN_TIERS.starter.messagesPerMonth);
    expect(PLAN_TIERS.starter.messagesPerMonth).toBeLessThan(PLAN_TIERS.pro.messagesPerMonth);
  });

  it("should have enterprise tier with unlimited messages", () => {
    expect(PLAN_TIERS.enterprise.messagesPerMonth).toBe(-1);
  });

  it("should have correct tier names", () => {
    expect(PLAN_TIERS.free.name).toBe("Free");
    expect(PLAN_TIERS.starter.name).toBe("Starter");
    expect(PLAN_TIERS.pro.name).toBe("Pro");
    expect(PLAN_TIERS.enterprise.name).toBe("Enterprise");
  });
});

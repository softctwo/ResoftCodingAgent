import { describe, it, expect } from "vitest";
import { CostCalculator, DEFAULT_PRICING } from "./cost-calculator.ts";

describe("CostCalculator", () => {
  const calc = new CostCalculator();

  it("calculates cost for deepseek-v4-pro", () => {
    // $0.001 input + $0.002 output per 1K tokens
    expect(calc.calculate("deepseek", "deepseek-v4-pro", 1000, 1000)).toBeCloseTo(0.003, 5);
  });

  it("zero tokens yields zero cost", () => {
    expect(calc.calculate("deepseek", "deepseek-v4-pro", 0, 0)).toBe(0);
  });

  it("unknown model uses default pricing", () => {
    const cost = calc.calculate("unknown", "unknown", 1000, 1000);
    expect(cost).toBeCloseTo(0.003, 5);
  });

  it("projects monthly cost", () => {
    const monthly = calc.projectMonthly(100000, "deepseek", "deepseek-v4-pro");
    expect(monthly).toBeGreaterThan(0);
    expect(monthly).toBeLessThan(20);
  });

  it("lists all pricing entries", () => {
    expect(calc.listPricing()).toHaveLength(DEFAULT_PRICING.length);
  });
});

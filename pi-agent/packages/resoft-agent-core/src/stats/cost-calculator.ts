export interface ModelPricing {
  provider: string;
  model: string;
  inputPricePer1K: number; // USD per 1000 tokens
  outputPricePer1K: number;
}

// Current pricing as of mid-2025
export const DEFAULT_PRICING: ModelPricing[] = [
  { provider: "deepseek", model: "deepseek-v4-pro", inputPricePer1K: 0.001, outputPricePer1K: 0.002 },
  { provider: "deepseek", model: "deepseek-chat", inputPricePer1K: 0.00014, outputPricePer1K: 0.00028 },
  { provider: "anthropic", model: "claude-sonnet-4-20250514", inputPricePer1K: 0.003, outputPricePer1K: 0.015 },
  { provider: "anthropic", model: "claude-opus-4-20250514", inputPricePer1K: 0.015, outputPricePer1K: 0.075 },
  { provider: "openai", model: "gpt-4o", inputPricePer1K: 0.0025, outputPricePer1K: 0.01 },
  { provider: "openai", model: "gpt-4o-mini", inputPricePer1K: 0.00015, outputPricePer1K: 0.0006 },
];

export class CostCalculator {
  private pricing: ModelPricing[];

  constructor(customPricing?: ModelPricing[]) {
    this.pricing = customPricing ?? DEFAULT_PRICING;
  }

  /** Calculate cost for given token usage */
  calculate(provider: string, model: string, promptTokens: number, completionTokens: number): number {
    const price = this.pricing.find(
      (p) => p.provider === provider && (p.model === model || model.startsWith(p.model)),
    );
    if (!price) {
      // Default pricing
      return (promptTokens / 1000) * 0.001 + (completionTokens / 1000) * 0.002;
    }
    return (promptTokens / 1000) * price.inputPricePer1K + (completionTokens / 1000) * price.outputPricePer1K;
  }

  /** Get pricing for a model */
  getPricing(provider: string, model: string): ModelPricing | undefined {
    return this.pricing.find((p) => p.provider === provider && (p.model === model || model.startsWith(p.model)));
  }

  /** List all pricing */
  listPricing(): ModelPricing[] {
    return [...this.pricing];
  }

  /** Project monthly cost based on current usage rate */
  projectMonthly(dailyTokens: number, provider: string, model: string): number {
    const price = this.pricing.find((p) => p.provider === provider && model.startsWith(p.model));
    const inputRate = price?.inputPricePer1K ?? 0.001;
    const outputRate = price?.outputPricePer1K ?? 0.002;
    // Assume 70/30 input/output split
    const inputTokens = dailyTokens * 0.7;
    const outputTokens = dailyTokens * 0.3;
    return 30 * ((inputTokens / 1000) * inputRate + (outputTokens / 1000) * outputRate);
  }
}

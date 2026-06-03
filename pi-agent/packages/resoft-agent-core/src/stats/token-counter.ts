/**
 * Token counter — estimates token count from text content.
 * Uses rough heuristic: ~4 chars per token for English text.
 * For precise counting, integrate with tiktoken or model-specific tokenizers.
 */

export interface TokenUsage {
  provider: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  cost: number;
  timestamp: number;
  sessionId: string;
  platform: string;
}

export class TokenCounter {
  private sessions: Map<string, TokenUsage[]> = new Map();

  /** Estimate tokens from text length */
  estimateTokens(text: string): number {
    // Rough heuristic: ~4 chars per token
    return Math.ceil(text.length / 4);
  }

  /** Record usage for a session */
  recordUsage(usage: TokenUsage): void {
    if (!this.sessions.has(usage.sessionId)) {
      this.sessions.set(usage.sessionId, []);
    }
    this.sessions.get(usage.sessionId)!.push(usage);
  }

  /** Get usage for a session */
  getSessionUsage(sessionId: string): TokenUsage[] {
    return this.sessions.get(sessionId) ?? [];
  }

  /** Get total usage across all sessions */
  getTotalUsage(): {
    totalPromptTokens: number;
    totalCompletionTokens: number;
    totalTokens: number;
    totalCost: number;
    sessionCount: number;
  } {
    let prompt = 0, completion = 0, tokens = 0, cost = 0;
    for (const usages of this.sessions.values()) {
      for (const u of usages) {
        prompt += u.promptTokens;
        completion += u.completionTokens;
        tokens += u.totalTokens;
        cost += u.cost;
      }
    }
    return {
      totalPromptTokens: prompt,
      totalCompletionTokens: completion,
      totalTokens: tokens,
      totalCost: cost,
      sessionCount: this.sessions.size,
    };
  }

  /** Aggregate usage by day */
  getDailyUsage(days = 7): Array<{
    date: string;
    sessions: number;
    totalTokens: number;
    totalCost: number;
  }> {
    const now = Date.now();
    const startDate = new Date(now - days * 86400000);
    const daily: Record<string, { sessions: Set<string>; tokens: number; cost: number }> = {};

    for (let d = new Date(startDate); d <= new Date(now); d.setDate(d.getDate() + 1)) {
      daily[d.toISOString().split("T")[0]] = { sessions: new Set(), tokens: 0, cost: 0 };
    }

    for (const [sessionId, usages] of this.sessions) {
      for (const u of usages) {
        const date = new Date(u.timestamp).toISOString().split("T")[0];
        if (daily[date]) {
          daily[date].sessions.add(sessionId);
          daily[date].tokens += u.totalTokens;
          daily[date].cost += u.cost;
        }
      }
    }

    return Object.entries(daily).map(([date, d]) => ({
      date,
      sessions: d.sessions.size,
      totalTokens: d.tokens,
      totalCost: d.cost,
    }));
  }

  /** Export all data as JSON */
  exportJSON(): string {
    const data: Record<string, TokenUsage[]> = {};
    for (const [id, usages] of this.sessions) {
      data[id] = usages;
    }
    return JSON.stringify(data, null, 2);
  }

  /** Clear all data */
  clear(): void {
    this.sessions.clear();
  }
}

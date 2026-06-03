import { TokenCounter, CostCalculator } from "@resoft/agent-core";
import type { TokenUsage } from "@resoft/agent-core";
import { readFileSync, existsSync, writeFileSync, mkdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { homedir } from "node:os";

export interface StatsModeConfig {
  action: "summary" | "daily" | "export" | "pricing";
  days?: number;
  output?: string;
  dataDir?: string;
}

const DEFAULT_DATA_DIR = join(homedir(), ".resoft", "stats");

export function runStatsMode(config: StatsModeConfig) {
  const dataDir = config.dataDir ?? DEFAULT_DATA_DIR;
  const counter = new TokenCounter();
  const calculator = new CostCalculator();

  // Load existing data
  const dataFile = join(dataDir, "usage.json");
  if (existsSync(dataFile)) {
    try {
      const raw = JSON.parse(readFileSync(dataFile, "utf-8"));
      for (const [, usages] of Object.entries(raw)) {
        for (const u of usages as TokenUsage[]) {
          counter.recordUsage(u);
        }
      }
    } catch {
      /* ignore corrupt data */
    }
  }

  switch (config.action) {
    case "summary": {
      const total = counter.getTotalUsage();
      console.log(`\n══════ Usage Summary ══════\n`);
      console.log(`  Sessions:     ${total.sessionCount}`);
      console.log(`  Total Tokens: ${total.totalTokens.toLocaleString()}`);
      console.log(`  Prompt:       ${total.totalPromptTokens.toLocaleString()}`);
      console.log(`  Completion:   ${total.totalCompletionTokens.toLocaleString()}`);
      console.log(`  Total Cost:   $${total.totalCost.toFixed(4)}`);
      console.log(``);
      break;
    }

    case "daily": {
      const days = config.days ?? 7;
      const daily = counter.getDailyUsage(days);
      console.log(`\n══════ Daily Usage (${days}d) ══════\n`);
      console.log(`  ${"Date".padEnd(12)} ${"Sessions".padEnd(10)} ${"Tokens".padEnd(14)} ${"Cost"}`);
      console.log(`  ${"─".repeat(45)}`);
      for (const d of daily) {
        console.log(
          `  ${d.date.padEnd(12)} ${String(d.sessions).padEnd(10)} ${d.totalTokens.toLocaleString().padEnd(14)} $${d.totalCost.toFixed(4)}`,
        );
      }
      console.log(``);
      break;
    }

    case "export": {
      const json = counter.exportJSON();
      if (config.output) {
        const outDir = resolve(config.output, "..");
        mkdirSync(outDir, { recursive: true });
        writeFileSync(resolve(config.output), json, "utf-8");
        console.log(`Exported to ${config.output}`);
      } else {
        console.log(json);
      }
      break;
    }

    case "pricing": {
      console.log(`\n══════ Model Pricing (per 1K tokens) ══════\n`);
      console.log(
        `  ${"Provider".padEnd(15)} ${"Model".padEnd(28)} ${"Input".padEnd(10)} ${"Output".padEnd(10)} ${"Monthly*"}`,
      );
      console.log(`  ${"─".repeat(75)}`);
      for (const p of calculator.listPricing()) {
        const monthly = calculator.projectMonthly(100000, p.provider, p.model);
        console.log(
          `  ${p.provider.padEnd(15)} ${p.model.padEnd(28)} $${String(p.inputPricePer1K).padEnd(9)} $${String(p.outputPricePer1K).padEnd(9)} $${monthly.toFixed(2)}`,
        );
      }
      console.log(`\n  * Estimated monthly cost at 100K tokens/day`);
      console.log(``);
      break;
    }
  }
}

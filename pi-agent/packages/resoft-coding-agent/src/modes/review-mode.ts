import type { TeamConfig } from "../config/team-config.ts";
import { IncrementalRuleEngine } from "@resoft/agent-core";
import type { CodingRule, ETLPlatform } from "@resoft/agent-core";
import { printReviewSummary, printIssues } from "../utils/format-output.ts";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

export interface ReviewModeConfig {
  file?: string;
  platform?: string;
  projectRoot?: string;
  incremental?: boolean;
}

export async function runReviewMode(config: ReviewModeConfig, teamConfig: TeamConfig) {
  const platform: ETLPlatform = (config.platform ?? "sql") as ETLPlatform;
  const incremental = config.incremental ?? false;

  // Collect rules from team config
  const allRules: CodingRule[] = [];
  for (const ruleSet of teamConfig.rules) {
    for (const rule of ruleSet.rules) {
      allRules.push(rule as CodingRule);
    }
  }

  // Build rule engine
  const engine = new IncrementalRuleEngine(platform, allRules);

  console.log(`
╔══════════════════════════════════════════════════╗
║        Resoft Coding Agent — Review Mode         ║
╠══════════════════════════════════════════════════╣
║  Mode       : ${(incremental ? "INCREMENTAL 🔍" : "FULL 📋").padEnd(35)}║
║  Platform   : ${platform.padEnd(35)}║
║  Rules      : ${String(allRules.length).padEnd(35)}║
╚══════════════════════════════════════════════════╝
`);

  // If file provided, review it
  if (config.file) {
    const filePath = resolve(config.file);
    if (!existsSync(filePath)) {
      console.error(`\n❌ File not found: ${filePath}`);
      process.exit(1);
    }

    const content = readFileSync(filePath, "utf-8");
    console.log(
      `\n📄 Reviewing: ${filePath} (${content.split("\n").length} lines, ${(content.length / 1024).toFixed(1)} KB)`
    );

    const result = incremental
      ? engine.reviewFile(filePath, content)
      : engine.reviewFileFull(filePath, content);

    printReviewSummary(result);
    printIssues(result.issues);

    // Show stats for all tracked files
    if (incremental) {
      const stats = engine.getStats();
      console.log(
        `📊 Session: ${stats.trackedFiles} files tracked, ${stats.totalIssues} total issues\n`
      );
    }
  } else {
    // No file — show usage
    console.log(`
Usage: resoft review [options] <file>

Options:
  --incremental     Incremental review (only changed lines)
  -p, --platform    Target platform (spark, flink, dbt, sql)
  --team-config     Path to team config directory

Examples:
  resoft review orders.sql
  resoft review --incremental etl_job.py -p spark
`);
  }
}

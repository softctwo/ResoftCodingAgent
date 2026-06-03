import type { TeamConfig } from "../config/team-config.ts";
import { IncrementalRuleEngine } from "@resoft/agent-core";
import type { CodingRule, ETLPlatform } from "@resoft/agent-core";
import { printReviewSummary, printIssues } from "../utils/format-output.ts";
import { readdirSync, statSync, existsSync, readFileSync } from "node:fs";
import { resolve, join, extname } from "node:path";

export interface ReviewModeConfig {
  file?: string;
  platform?: string;
  projectRoot?: string;
  incremental?: boolean;
}

function collectFiles(target: string, platform: string): string[] {
  const absPath = resolve(target);
  if (!existsSync(absPath)) return [];

  const st = statSync(absPath);
  if (st.isFile()) return [absPath];

  if (st.isDirectory()) {
    const extMap: Record<string, string[]> = {
      sql: [".sql", ".ddl", ".dml", ".dql"],
      spark: [".py", ".scala", ".java", ".sql"],
      flink: [".java", ".scala", ".sql"],
      dbt: [".sql", ".yml", ".yaml", ".md"],
    };
    const validExts = extMap[platform] ?? [".sql"];

    const files: string[] = [];
    const walk = (dir: string, depth: number) => {
      if (depth > 5) return;
      try {
        for (const entry of readdirSync(dir)) {
          if (entry.startsWith(".") || entry === "node_modules" || entry === "dist") continue;
          const fullPath = join(dir, entry);
          try {
            const s = statSync(fullPath);
            if (s.isDirectory()) walk(fullPath, depth + 1);
            else if (s.isFile() && validExts.includes(extname(entry).toLowerCase())) {
              files.push(fullPath);
            }
          } catch { /* skip unreadable */ }
        }
      } catch { /* skip unreadable dir */ }
    };
    walk(absPath, 0);
    return files.sort();
  }

  return [];
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

  // Collect files
  const files = config.file ? collectFiles(config.file, platform) : [];

  if (files.length === 0) {
    console.log(`
Usage: resoft review [options] <file|directory>

Options:
  --incremental     Incremental review (only changed lines)
  -p, --platform    Target platform (spark, flink, dbt, sql)
  --staged          Review staged files in git
  --team-config     Path to team config directory

Examples:
  resoft review orders.sql
  resoft review src/etl/ --incremental -p spark
  resoft review --staged -p sql
`);
    return;
  }

  console.log(`\n📄 Reviewing ${files.length} file(s)...\n`);

  for (const filePath of files) {
    try {
      const content = readFileSync(filePath, "utf-8");
      const lines = content.split("\n").length;
      const kb = (content.length / 1024).toFixed(1);
      console.log(`  ${filePath} (${lines} lines, ${kb} KB)`);

      const result = incremental
        ? engine.reviewFile(filePath, content)
        : engine.reviewFileFull(filePath, content);

      printReviewSummary(result);
      printIssues(result.issues);
    } catch (err: any) {
      console.error(`  ❌ Error reading ${filePath}: ${err.message}`);
    }
  }

  // Stats for all tracked files
  if (incremental) {
    const stats = engine.getStats();
    console.log(`\n📊 Session: ${stats.trackedFiles} files tracked, ${stats.totalIssues} total issues\n`);
  }
}

import { IncrementalRuleEngine, CIReporter } from "@resoft/agent-core";
import type { CodingRule, ETLPlatform } from "@resoft/agent-core";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

export interface CIModeConfig {
  files?: string[];
  platform?: string;
  format?: string;
  minSeverity?: string;
  failOnError?: boolean;
  failOnWarning?: boolean;
}

export async function runCIMode(config: CIModeConfig, rules: CodingRule[]) {
  const platform = (config.platform ?? "sql") as ETLPlatform;
  const format = (config.format ?? "text") as "text" | "json" | "sarif" | "checkstyle";

  if (!config.files || config.files.length === 0) {
    console.error("No files provided for CI review.");
    process.exit(2);
  }

  const engine = new IncrementalRuleEngine(platform, rules);
  const reporter = new CIReporter();

  for (const file of config.files) {
    const filePath = resolve(file);
    if (!existsSync(filePath)) {
      console.warn(`Skipping missing file: ${filePath}`);
      continue;
    }
    const content = readFileSync(filePath, "utf-8");
    const result = engine.reviewFileFull(filePath, content);
    reporter.addResult(result);
  }

  const report = reporter.generate({
    format,
    minSeverity: (config.minSeverity ?? "warning") as "error" | "warning" | "info",
    failOnError: config.failOnError ?? true,
    failOnWarning: config.failOnWarning ?? false,
  });

  console.log(report.output);
  process.exit(report.exitCode);
}

import type { TeamConfig } from "../config/team-config.ts";

export interface ReviewModeConfig {
  file?: string;
  platform?: string;
  projectRoot?: string;
}

export async function runReviewMode(config: ReviewModeConfig, teamConfig: TeamConfig) {
  const file = config.file ?? "(current session)";
  const platform = config.platform ?? "sql";

  const allRules = teamConfig.rules.reduce(
    (sum, rs) => sum + rs.rules.length,
    0
  );

  console.log(`
╔══════════════════════════════════════════════════╗
║        Resoft Coding Agent — Review Mode         ║
╠══════════════════════════════════════════════════╣
║  File       : ${file.padEnd(35)}║
║  Platform   : ${platform.padEnd(35)}║
║  Rules Loaded: ${String(allRules).padEnd(35)}║
${teamConfig.rules
  .map(
    (rs) => `║  Rule Set   : ${rs.name.padEnd(35)}║`
  )
  .join("\n")}
╚══════════════════════════════════════════════════╝
`);

  console.log("\nReview mode initialized. Analysis starting...\n");

  // TODO: Read file content, apply rules, print issues
  console.log("(Review functionality coming soon)");
}

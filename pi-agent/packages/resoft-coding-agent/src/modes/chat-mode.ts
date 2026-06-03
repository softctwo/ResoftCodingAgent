import { ResoftAgent } from "@resoft/agent-core";
import type { TeamConfig } from "../config/team-config.ts";

export interface ChatModeConfig {
  platform?: string;
  projectName?: string;
  projectRoot?: string;
  autoReview?: boolean;
  model?: unknown;
}

export async function runChatMode(config: ChatModeConfig, teamConfig: TeamConfig) {
  const platform = (config.platform ?? "sql") as "spark" | "flink" | "dbt" | "sql" | "custom";
  const projectName = config.projectName ?? "etl-project";

  console.log(`
╔══════════════════════════════════════════════════╗
║         Resoft Coding Agent — Chat Mode          ║
╠══════════════════════════════════════════════════╣
║  Platform   : ${platform.padEnd(35)}║
║  Project    : ${projectName.padEnd(35)}║
║  Rules      : ${String(teamConfig.rules.reduce((sum, rs) => sum + rs.rules.length, 0)).padEnd(35)}║
║  Skills     : ${String(Object.keys(teamConfig.skills.skills).length).padEnd(35)}║
║  AutoReview : ${String(config.autoReview ?? true).padEnd(35)}║
╚══════════════════════════════════════════════════╝
`);

  const agent = new ResoftAgent({
    projectName,
    projectRoot: config.projectRoot ?? process.cwd(),
    platform,
    autoReview: config.autoReview ?? true,
    model: config.model,
  });

  await agent.initialize();

  const ctx = agent.getProjectContext();
  console.log(`Project context: ${ctx?.projectName} (${ctx?.platform})`);

  // TODO: Full REPL loop with readline
  console.log("\nChat mode initialized. REPL coming soon...\n");

  // Subscribe to agent events for streaming output
  agent.subscribe((event) => {
    console.log("[agent event]", event);
  });

  return agent;
}

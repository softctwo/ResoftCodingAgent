import { ResoftAgent } from "@resoft/agent-core";
import type { TeamConfig } from "../config/team-config.ts";
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";

export interface ChatModeConfig {
  platform?: string;
  projectName?: string;
  projectRoot?: string;
  autoReview?: boolean;
  model?: { provider: string; model: string; apiKey: string };
  sessionId?: string;
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

  // Start REPL loop
  const readline = await import("node:readline/promises");
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: `\n${platform} > `,
  });

  // Subscribe to agent events for streaming output
  agent.subscribe((event: any) => {
    if (event.type === "tool_call") {
      console.log(`\n🔧 Tool: ${event.tool}`);
    } else if (event.type === "text" && event.content) {
      process.stdout.write(event.content);
    } else if (event.type === "done") {
      console.log("\n✅ Done.");
    } else if (event.type === "error") {
      console.error(`\n❌ Error: ${event.error}`);
    }
  });

  const sessionId = config.sessionId ?? `session-${Date.now()}`;
  const history: unknown[] = [];

  // Load existing session if available
  const existingMessages = loadSession(sessionId);
  if (existingMessages.length > 0) {
    console.log(`  Loaded ${existingMessages.length} messages from session "${sessionId}"`);
    history.push(...existingMessages);
  }

  console.log(`\n💡 Commands: /quit to exit, /review to trigger review, /help for more`);
  rl.prompt();

  for await (const line of rl) {
    const input = line.trim();
    if (!input) {
      rl.prompt();
      continue;
    }

    // Handle special commands
    if (input === "/quit" || input === "/exit") {
      console.log("Goodbye! 👋");
      rl.close();
      process.exit(0);
    }

    if (input === "/help") {
      console.log(`\nCommands:\n  /quit, /exit    Exit the chat\n  /review         Trigger code review\n  /save           Save current session\n  /sessions       List saved sessions\n  /load <id>      Load a saved session (requires restart)\n  /help           Show this help\n`);
      rl.prompt();
      continue;
    }

    if (input === "/review") {
      console.log("Review mode requested. (Run 'resoft review <file>' in another terminal)");
      rl.prompt();
      continue;
    }

    if (input === "/save") {
      saveSession(sessionId, history);
      console.log(`Session saved: ${sessionId}`);
      rl.prompt();
      continue;
    }

    if (input === "/sessions") {
      const sessions = listSessions();
      if (sessions.length === 0) {
        console.log("No saved sessions.");
      } else {
        console.log(`Saved sessions (${sessions.length}):`);
        for (const s of sessions) {
          console.log(`  ${s}${s === sessionId ? " ← current" : ""}`);
        }
      }
      rl.prompt();
      continue;
    }

    if (input.startsWith("/load ")) {
      const targetId = input.slice(6).trim();
      console.log(`To load session "${targetId}", restart with: resoft chat --session ${targetId}`);
      rl.prompt();
      continue;
    }

    // Send to agent
    try {
      history.push({ role: "user", content: input });
      const result = await agent.prompt(input);
      history.push({ role: "assistant", content: typeof result === "string" ? result : JSON.stringify(result) });
      // Auto-save after each prompt
      saveSession(sessionId, history);
    } catch (err: any) {
      console.error(`\n❌ Error: ${err.message}`);
    }

    rl.prompt();
  }

  return agent;
}

function getSessionDir(): string {
  const dir = join(homedir(), ".resoft", "sessions");
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  return dir;
}

function saveSession(sessionId: string, messages: unknown[]): void {
  try {
    const dir = getSessionDir();
    writeFileSync(join(dir, `${sessionId}.json`), JSON.stringify(messages, null, 2), "utf-8");
  } catch { /* ignore */ }
}

function loadSession(sessionId: string): unknown[] {
  try {
    const dir = getSessionDir();
    const path = join(dir, `${sessionId}.json`);
    if (existsSync(path)) {
      return JSON.parse(readFileSync(path, "utf-8"));
    }
  } catch { /* ignore */ }
  return [];
}

function listSessions(): string[] {
  try {
    const { readdirSync } = require("node:fs");
    const dir = getSessionDir();
    return readdirSync(dir).filter((f: string) => f.endsWith(".json")).map((f: string) => f.replace(".json", ""));
  } catch {
    return [];
  }
}

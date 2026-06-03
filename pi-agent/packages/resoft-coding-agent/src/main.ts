import { loadTeamConfig, type TeamConfig } from "./config/team-config.ts";
import { runChatMode, type ChatModeConfig } from "./modes/chat-mode.ts";
import { runReviewMode, type ReviewModeConfig } from "./modes/review-mode.ts";
import { runInitMode, type InitModeConfig } from "./modes/init-mode.ts";
import { runTemplateMode, type TemplateModeConfig } from "./modes/template-mode.ts";

export type AgentMode = "chat" | "review" | "init" | "skill" | "template";

export interface MainConfig {
  mode: AgentMode;
  chat?: ChatModeConfig;
  review?: ReviewModeConfig;
  init?: InitModeConfig;
  skill?: { action: "list" | "enable" | "disable"; name?: string };
  template?: TemplateModeConfig;
  teamConfigPath?: string;
}

const VERSION = "0.1.0";

export async function main(config: MainConfig) {
  console.log(`\n🔧 Resoft Coding Agent v${VERSION} — Data ETL Development Assistant\n`);

  // Load team configuration
  const teamConfig = await loadTeamConfig(config.teamConfigPath);
  console.log(
    `Loaded ${teamConfig.rules.length} rule set(s), ` +
      `${Object.keys(teamConfig.skills.skills).length} skill(s).\n`
  );

  switch (config.mode) {
    case "chat": {
      if (!config.chat) {
        console.error("Chat mode requires chat config.");
        process.exit(1);
      }
      await runChatMode(config.chat, teamConfig);
      break;
    }

    case "review": {
      await runReviewMode(config.review ?? {}, teamConfig);
      break;
    }

    case "init": {
      if (!config.init) {
        console.error("Init mode requires a template name.");
        process.exit(1);
      }
      await runInitMode(config.init, teamConfig);
      break;
    }

    case "skill": {
      const skills = teamConfig.skills.skills;
      const action = config.skill?.action ?? "list";

      switch (action) {
        case "list": {
          console.log("Available skills:\n");
          for (const [name, meta] of Object.entries(skills) as [string, any][]) {
            console.log(
              `  ${meta.enabled ? "✅" : "❌"} ${name.padEnd(20)} ${meta.description.slice(0, 50)}`
            );
          }
          break;
        }

        case "enable": {
          const name = config.skill?.name;
          if (!name) {
            console.error("Provide a skill name to enable.");
            process.exit(1);
          }
          if (skills[name]) {
            skills[name].enabled = true;
            console.log(`Skill "${name}" enabled.`);
          } else {
            console.error(`Skill "${name}" not found.`);
          }
          break;
        }

        case "disable": {
          const name = config.skill?.name;
          if (!name) {
            console.error("Provide a skill name to disable.");
            process.exit(1);
          }
          if (skills[name]) {
            skills[name].enabled = false;
            console.log(`Skill "${name}" disabled.`);
          } else {
            console.error(`Skill "${name}" not found.`);
          }
          break;
        }
      }
      break;
    }

    case "template": {
      if (!config.template) {
        console.error("Template mode requires template config.");
        process.exit(1);
      }
      runTemplateMode(config.template);
      break;
    }
  }
}

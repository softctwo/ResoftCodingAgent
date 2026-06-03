import type { CLIConfig } from "@resoft/agent-core";

export const defaultConfig: CLIConfig = {
  defaultPlatform: "sql",
  autoSkillDetection: true,
  maxContextTokens: 128000,
};

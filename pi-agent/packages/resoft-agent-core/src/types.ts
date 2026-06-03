import type { AgentTool, AgentMessage } from "@earendil-works/pi-agent-core";

// ─── Platform & Severity ───────────────────────────────────────────

export type ETLPlatform = "spark" | "flink" | "dbt" | "sql" | "custom";

export type IssueSeverity = "error" | "warning" | "info";

// ─── Rules & Issues ────────────────────────────────────────────────

export interface Issue {
  id: string;
  description: string;
  severity: IssueSeverity;
  line?: number;
  suggestion?: string;
  ruleId?: string;
}

export interface CodingRule {
  id: string;
  description: string;
  pattern?: string;
  severity: IssueSeverity;
  platforms?: ETLPlatform[];
  suggestion?: string;
}

export interface RuleSet {
  name: string;
  description?: string;
  rules: CodingRule[];
}

// ─── Hook Contexts & Results ───────────────────────────────────────

export interface BeforeToolCallContext {
  toolCall: { name: string; args: Record<string, unknown> };
  args: Record<string, unknown>;
  context: {
    platform?: ETLPlatform;
    projectRoot?: string;
    messages: AgentMessage[];
  };
}

export interface BeforeToolCallResult {
  block?: boolean;
  reason?: string;
  warnings?: string[];
}

export interface AfterToolCallContext {
  toolCall: { name: string; args: Record<string, unknown> };
  result: { content: string; details?: unknown };
  isError: boolean;
  context: {
    platform?: ETLPlatform;
    projectRoot?: string;
    messages: AgentMessage[];
  };
}

export interface AfterToolCallResult {
  terminate?: boolean;
  issues?: Issue[];
  details?: string;
  suggestion?: string;
}

// ─── Hook Types ────────────────────────────────────────────────────

export type BeforeToolCallHook = (
  ctx: BeforeToolCallContext
) => BeforeToolCallResult | Promise<BeforeToolCallResult>;

export type AfterToolCallHook = (
  ctx: AfterToolCallContext
) => AfterToolCallResult | Promise<AfterToolCallResult>;

// ─── Agent & Project Config ────────────────────────────────────────

export interface ResoftAgentConfig {
  projectName: string;
  projectRoot?: string;
  platform?: ETLPlatform;
  systemPrompt?: string;
  model?: unknown;
  tools?: AgentTool[];
  rules?: CodingRule[];
  securityRules?: CodingRule[];
  sqlRules?: CodingRule[];
  formatRules?: CodingRule[];
  enabledSkills?: string[];
  autoReview?: boolean;
  teamConfigPath?: string;
}

// ─── Skills ────────────────────────────────────────────────────────

export interface SkillMeta {
  name: string;
  description: string;
  path: string;
  enabled: boolean;
  autoTrigger?: boolean;
  platform?: ETLPlatform;
}

export interface SkillRegistry {
  skills: Record<string, SkillMeta>;
}

// ─── ETL Project Context ───────────────────────────────────────────

export interface ETLProjectContext {
  projectName: string;
  projectRoot: string;
  platform: ETLPlatform;
  branch?: string;
  recentFiles?: string[];
  dependencies?: string[];
  rulesSummary?: string;
}

// ─── CLI Config ────────────────────────────────────────────────────

export interface CLIConfig {
  defaultPlatform?: ETLPlatform;
  autoSkillDetection?: boolean;
  maxContextTokens?: number;
}

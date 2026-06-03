// ─── Resoft Agent Core — public API ────────────────────────────────

export { ResoftAgent, DEFAULT_SECURITY_RULES, DEFAULT_SQL_RULES, DEFAULT_FORMAT_RULES, buildETLSystemPrompt } from "./agent.ts";
export {
  composeBeforeHooks,
  composeAfterHooks,
  createSqlReviewHook,
  createSecurityCheckHook,
  createFormatCheckHook,
} from "./hooks/index.ts";
export {
  PLATFORM_SYSTEM_PROMPTS,
  createETLContextTransform,
  buildProjectContext,
  detectPlatform,
} from "./context/index.ts";
export { etlTools } from "./tools/index.ts";
export type {
  ETLPlatform,
  IssueSeverity,
  Issue,
  CodingRule,
  RuleSet,
  BeforeToolCallContext,
  BeforeToolCallResult,
  AfterToolCallContext,
  AfterToolCallResult,
  BeforeToolCallHook,
  AfterToolCallHook,
  ResoftAgentConfig,
  SkillMeta,
  SkillRegistry,
  ETLProjectContext,
  CLIConfig,
} from "./types.ts";

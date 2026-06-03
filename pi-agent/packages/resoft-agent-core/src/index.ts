// ─── Resoft Agent Core — public API ────────────────────────────────

export { ResoftAgent, DEFAULT_SECURITY_RULES, DEFAULT_SQL_RULES, DEFAULT_FORMAT_RULES, buildETLSystemPrompt } from "./agent";
export {
  composeBeforeHooks,
  composeAfterHooks,
  createSqlReviewHook,
  createSecurityCheckHook,
  createFormatCheckHook,
} from "./hooks/index";
export {
  PLATFORM_SYSTEM_PROMPTS,
  createETLContextTransform,
  buildProjectContext,
  detectPlatform,
} from "./context/index";
export { etlTools } from "./tools/index";
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
} from "./types";

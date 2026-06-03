// ─── Resoft Agent Core — public API ────────────────────────────────

export { ResoftAgent, DEFAULT_SECURITY_RULES, DEFAULT_SQL_RULES, DEFAULT_FORMAT_RULES, buildETLSystemPrompt } from "./agent.ts";
export {
  composeBeforeHooks,
  composeAfterHooks,
  createSqlReviewHook,
  createSecurityCheckHook,
  createFormatCheckHook,
  createDbtRefCheckHook,
  createFlinkCheckpointHook,
  createDefaultHooks,
} from "./hooks/index.ts";
export type { HooksCollection } from "./hooks/index.ts";
export {
  PLATFORM_SYSTEM_PROMPTS,
  createETLContextTransform,
  buildProjectContext,
  detectPlatform,
} from "./context/index.ts";
export { etlTools } from "./tools/index.ts";
export { DiffTracker, IncrementalRuleEngine } from "./rules/index.ts";
export type { IncrementalReviewResult } from "./rules/index.ts";
export { AutoSkillTrigger, SkillRegistry } from "./skills/index.ts";
export type { TriggerResult } from "./skills/index.ts";
export { TemplateEngine, BUILTIN_TEMPLATES } from "./templates/index.ts";
export type { CodeTemplate as TemplateCodeTemplate } from "./templates/index.ts";
export { CIReporter } from "./pipeline/index.ts";
export type { CIReportResult } from "./pipeline/index.ts";
export { TokenCounter, CostCalculator, DEFAULT_PRICING } from "./stats/index.ts";
export type { TokenUsage, ModelPricing } from "./stats/index.ts";
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
  SkillRegistryConfig,
  ETLProjectContext,
  CLIConfig,
} from "./types.ts";
export { Logger, logger } from "./utils/index.ts";

import type {
  BeforeToolCallHook,
  BeforeToolCallContext,
  BeforeToolCallResult,
  AfterToolCallHook,
  AfterToolCallContext,
  AfterToolCallResult,
  CodingRule,
  ETLPlatform,
} from "../types.ts";

// ─── dbt Reference Check (after hook) ──────────────────────────────

export function createDbtRefCheckHook(_projectRoot?: string): AfterToolCallHook {
  return async (ctx: AfterToolCallContext): Promise<AfterToolCallResult> => {
    const messages: string[] = [];
    const refPattern = /\{\{\s*ref\s*\(\s*['\"]([^'\"]+)['\"]\s*\)\s*\}\}/g;
    const configPattern = /\{\{\s*config\s*\([^)]*materialized\s*=\s*['\"]([^'\"]+)['\"][^)]*\)\s*\}\}/gi;

    const checkContent = (text: string) => {
      let match;
      while ((match = refPattern.exec(text)) !== null) {
        const modelName = match[1];
        if (!/^[a-z][a-z0-9_]*$/.test(modelName)) {
          messages.push(`dbt ref "${modelName}": model names should be snake_case`);
        }
        if (modelName.length > 50) {
          messages.push(`dbt ref "${modelName}": model name too long`);
        }
      }
    };

    const content = ctx.result.content ?? "";
    checkContent(content);

    const validMaterializations = ["table", "view", "incremental", "ephemeral", "snapshot"];
    let match;
    while ((match = configPattern.exec(content)) !== null) {
      if (!validMaterializations.includes(match[1].toLowerCase())) {
        messages.push(`dbt config: unknown materialization "${match[1]}"`);
      }
    }

    return messages.length > 0 ? { details: messages.join("\n") } : {};
  };
}

// ─── Flink Checkpoint Hook (after hook) ────────────────────────────

export function createFlinkCheckpointHook(): AfterToolCallHook {
  return async (ctx: AfterToolCallContext): Promise<AfterToolCallResult> => {
    const messages: string[] = [];
    const content = ctx.result.content ?? "";

    if (/CREATE\s+TABLE\s+/i.test(content) && !/checkpoint/i.test(content)) {
      messages.push("Flink: CREATE TABLE detected but no checkpoint config found");
    }
    const hasStreaming = /STREAM\s+TABLE|streaming\b|TableEnvironment|StreamExecutionEnvironment/gi.test(content);
    const hasWatermark = /watermark|WATERMARK\s+FOR/gi.test(content);
    if (hasStreaming && !hasWatermark) {
      messages.push("Flink: streaming detected but no watermark defined");
    }
    const hasCDC = /cdc|debezium|canal/gi.test(content);
    if (hasCDC && !/checkpoint/i.test(content)) {
      messages.push("Flink CDC: checkpoint configuration is required for fault tolerance");
    }

    return messages.length > 0 ? { details: messages.join("\n") } : {};
  };
}

export interface HooksCollection {
  sqlReview?: boolean;
  securityCheck?: boolean;
  formatCheck?: boolean;
  dbtRefCheck?: boolean;
  flinkCheckpoint?: boolean;
}

export function createDefaultHooks(
  hooks: HooksCollection,
  platform: ETLPlatform,
  sqlRules: CodingRule[],
  securityRules: CodingRule[],
  formatRules: CodingRule[],
): { before: BeforeToolCallHook[]; after: AfterToolCallHook[] } {
  const before: BeforeToolCallHook[] = [];
  const after: AfterToolCallHook[] = [];

  if (hooks.securityCheck !== false) {
    before.push(createSecurityCheckHook(securityRules));
  }
  if (hooks.sqlReview !== false) {
    after.push(createSqlReviewHook(sqlRules));
  }
  if (hooks.formatCheck !== false) {
    after.push(createFormatCheckHook(formatRules));
  }
  if (hooks.dbtRefCheck !== false && platform === "dbt") {
    after.push(createDbtRefCheckHook());
  }
  if (hooks.flinkCheckpoint !== false && platform === "flink") {
    after.push(createFlinkCheckpointHook());
  }

  return { before, after };
}

// ─── Compose Before Hooks ──────────────────────────────────────────
// Chains multiple before-hooks. Short-circuits on the first `block: true`.
// Collects all warnings from hooks that ran.

export function composeBeforeHooks(hooks: BeforeToolCallHook[]): BeforeToolCallHook {
  return async (ctx: BeforeToolCallContext): Promise<BeforeToolCallResult> => {
    const allWarnings: string[] = [];

    for (const hook of hooks) {
      const result = await hook(ctx);
      if (result.warnings) {
        allWarnings.push(...result.warnings);
      }
      if (result.block) {
        return { block: true, reason: result.reason, warnings: allWarnings };
      }
    }

    return allWarnings.length > 0 ? { warnings: allWarnings } : {};
  };
}

// ─── Compose After Hooks ───────────────────────────────────────────
// Chains multiple after-hooks. All execute regardless of results.
// Merges issues, details, and suggestions.

export function composeAfterHooks(hooks: AfterToolCallHook[]): AfterToolCallHook {
  return async (ctx: AfterToolCallContext): Promise<AfterToolCallResult> => {
    const allIssues: AfterToolCallResult["issues"] = [];
    const detailsList: string[] = [];
    const suggestions: string[] = [];
    let shouldTerminate = false;

    for (const hook of hooks) {
      const result = await hook(ctx);
      if (result.issues) allIssues.push(...result.issues);
      if (result.details) detailsList.push(result.details);
      if (result.suggestion) suggestions.push(result.suggestion);
      if (result.terminate) shouldTerminate = true;
    }

    return {
      terminate: shouldTerminate || undefined,
      issues: allIssues.length > 0 ? allIssues : undefined,
      details: detailsList.length > 0 ? detailsList.join("\n") : undefined,
      suggestion: suggestions.length > 0 ? suggestions.join("; ") : undefined,
    };
  };
}

// ─── SQL Review Hook ───────────────────────────────────────────────
// Scans tool result content for SQL anti-patterns using rule regexes.

export function createSqlReviewHook(rules: CodingRule[]): AfterToolCallHook {
  return async (ctx: AfterToolCallContext): Promise<AfterToolCallResult> => {
    const issues: AfterToolCallResult["issues"] = [];
    const content = ctx.result.content ?? "";

    for (const rule of rules) {
      if (!rule.pattern) continue;
      try {
        const regex = new RegExp(rule.pattern, "gim");
        let match: RegExpExecArray | null;
        while ((match = regex.exec(content)) !== null) {
          const line = content.substring(0, match.index).split("\n").length;
          issues.push({
            id: `sql-${rule.id}-${issues.length + 1}`,
            description: rule.description,
            severity: rule.severity,
            line,
            suggestion: rule.suggestion,
            ruleId: rule.id,
          });
          // prevent infinite loops on zero-length matches
          if (match.index === regex.lastIndex) regex.lastIndex++;
        }
      } catch {
        // skip invalid regex patterns
      }
    }

    return issues.length > 0 ? { issues } : {};
  };
}

// ─── Security Check Hook ───────────────────────────────────────────
// Blocks dangerous bash / exec commands. Runs as a before-hook.

export function createSecurityCheckHook(rules: CodingRule[]): BeforeToolCallHook {
  const DANGEROUS_PATTERNS = [
    { pattern: /rm\s+-rf\s+\//i, desc: "rm -rf / is forbidden" },
    { pattern: /\bDROP\s+TABLE\b/i, desc: "DROP TABLE without confirmation" },
    { pattern: /\bTRUNCATE\b/i, desc: "TRUNCATE without confirmation" },
    { pattern: /\bDELETE\s+FROM\b/i, desc: "DELETE FROM without WHERE clause check" },
    { pattern: /sudo\s+/i, desc: "sudo command detected" },
    { pattern: />\s*\/dev\/sd[a-z]/i, desc: "Writing directly to block device" },
  ];

  return async (ctx: BeforeToolCallContext): Promise<BeforeToolCallResult> => {
    const command =
      (ctx.toolCall.name === "bash" || ctx.toolCall.name === "execute")
        ? String(ctx.args.command ?? ctx.args.cmd ?? "")
        : "";

    if (!command) return {};

    const warnings: string[] = [];

    for (const { pattern, desc } of DANGEROUS_PATTERNS) {
      if (pattern.test(command)) {
        // Check if the user has confirmed this explicitly
        if (command.includes("--force") || command.includes("--yes")) {
          warnings.push(`Dangerous operation confirmed: ${desc}`);
          continue;
        }
        return {
          block: true,
          reason: `Blocked dangerous command: ${desc}. Add --force to override.`,
        };
      }
    }

    // Also check custom rules
    for (const rule of rules) {
      if (!rule.pattern) continue;
      try {
        const regex = new RegExp(rule.pattern, "i");
        if (regex.test(command)) {
          return {
            block: true,
            reason: `Blocked by security rule "${rule.id}": ${rule.description}`,
          };
        }
      } catch { /* skip */ }
    }

    return warnings.length > 0 ? { warnings } : {};
  };
}

// ─── Format Check Hook ─────────────────────────────────────────────
// Checks generated code against formatting rules.

export function createFormatCheckHook(rules: CodingRule[]): AfterToolCallHook {
  return async (ctx: AfterToolCallContext): Promise<AfterToolCallResult> => {
    const issues: AfterToolCallResult["issues"] = [];
    const content = ctx.result.content ?? "";

    for (const rule of rules) {
      if (!rule.pattern) continue;
      try {
        const regex = new RegExp(rule.pattern, "gm");
        let match: RegExpExecArray | null;
        while ((match = regex.exec(content)) !== null) {
          const line = content.substring(0, match.index).split("\n").length;
          issues.push({
            id: `fmt-${rule.id}-${issues.length + 1}`,
            description: rule.description,
            severity: rule.severity,
            line,
            suggestion: rule.suggestion,
            ruleId: rule.id,
          });
          if (match.index === regex.lastIndex) regex.lastIndex++;
        }
      } catch { /* skip */ }
    }

    return issues.length > 0 ? { issues } : {};
  };
}

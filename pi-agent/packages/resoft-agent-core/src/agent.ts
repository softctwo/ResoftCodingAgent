/**
 * ResoftAgent — ETL 专用 AI Coding Agent 核心类
 *
 * 基于 @earendil-works/pi-agent-core 的真实 Agent API 进行包装扩展。
 *
 * pi Agent API:
 *   new Agent({
 *     initialState: { systemPrompt, model, tools, messages, thinkingLevel, ... },
 *     beforeToolCall: fn,
 *     afterToolCall: fn,
 *     transformContext: fn,
 *   })
 *   agent.prompt(text) — 发送提示词
 *   agent.subscribe(callback) — 订阅事件
 *   agent.pending — 是否正在处理
 */

import { Agent } from "@earendil-works/pi-agent-core";
import type { AgentMessage } from "@earendil-works/pi-agent-core";
import { etlTools } from "./tools";
import {
  composeBeforeHooks,
  composeAfterHooks,
  createSqlReviewHook,
  createSecurityCheckHook,
  createFormatCheckHook,
} from "./hooks";
import {
  createETLContextTransform,
  buildProjectContext,
  detectPlatform,
} from "./context";
import type {
  ResoftAgentConfig,
  ETLPlatform,
  ETLProjectContext,
  CodingRule,
} from "./types";

// ─── 默认规则 ───────────────────────────────────────────────

const DEFAULT_SECURITY_RULES: CodingRule[] = [
  {
    id: "no-drop-table",
    description: "禁止直接执行 DROP TABLE/DATABASE",
    pattern: "DROP\\s+(TABLE|DATABASE)",
    severity: "error",
    suggestion: "请确认后再操作，或使用 RENAME 先备份",
  },
  {
    id: "no-truncate",
    description: "禁止直接执行 TRUNCATE",
    pattern: "TRUNCATE",
    severity: "error",
    suggestion: "请确认后再操作",
  },
  {
    id: "no-delete-without-where",
    description: "DELETE 必须有 WHERE 条件",
    pattern: "DELETE\\s+FROM\\s+\\w+\\s*$",
    severity: "error",
    suggestion: "DELETE 必须包含 WHERE 条件",
  },
];

const DEFAULT_SQL_RULES: CodingRule[] = [
  {
    id: "keyword-case",
    description: "SQL 关键字应大写",
    pattern: "(?i)\\b(select|from|where|join|group\\s+by|order\\s+by)\\b",
    severity: "warning",
    suggestion: "请使用大写: SELECT, FROM, WHERE, JOIN, GROUP BY, ORDER BY",
  },
  {
    id: "select-star",
    description: "避免使用 SELECT *",
    pattern: "SELECT\\s+\\*",
    severity: "warning",
    suggestion: "请明确列出需要的列名，避免使用 SELECT *",
  },
  {
    id: "implicit-join",
    description: "使用显式 JOIN 语法",
    pattern: "FROM\\s+\\w+\\s*,\\s*\\w+",
    severity: "warning",
    suggestion: "请使用 INNER JOIN / LEFT JOIN 替代隐式连接",
  },
  {
    id: "missing-alias",
    description: "多表查询应使用表别名",
    severity: "info",
    suggestion: "为表添加有意义的别名",
  },
];

const DEFAULT_FORMAT_RULES: CodingRule[] = [
  {
    id: "indent-four-spaces",
    description: "使用4空格缩进",
    severity: "warning",
    suggestion: "请使用4空格（而非Tab）进行缩进",
  },
  {
    id: "line-length",
    description: "单行代码不超过120字符",
    severity: "info",
    suggestion: "请适当换行或使用子查询/CTE改写",
  },
];

// ─── 系统提示词 ─────────────────────────────────────────────

export function buildETLSystemPrompt(config: Partial<ResoftAgentConfig>): string {
  const platform = config.platform ?? "sql";
  const projectName = config.projectName ?? "unnamed";

  const lines = [
    `You are an ETL coding assistant for project "${projectName}".`,
    `Platform: ${platform.toUpperCase()}`,
    `You help write, review, and optimize data pipeline code.`,
    config.autoReview !== false
      ? ""
      : "\nAuto-review mode: every code block will be reviewed automatically.",
    "",
    "Guidelines:",
    "- Write clean, maintainable, production-ready code",
    "- Follow team coding conventions",
    "- Include proper error handling and logging",
    "- Add comments for complex logic",
    "- Consider performance and scalability",
    "- NEVER execute destructive operations without confirmation",
  ];

  return lines.join("\n");
}

// ─── ResoftAgent 类 ────────────────────────────────────────

export class ResoftAgent {
  public agent: Agent;
  private config: ResoftAgentConfig;
  private projectContext: ETLProjectContext | null = null;

  constructor(config: ResoftAgentConfig) {
    this.config = config;

    const securityRules = config.securityRules ?? DEFAULT_SECURITY_RULES;
    const sqlRules = config.sqlRules ?? DEFAULT_SQL_RULES;
    const formatRules = config.formatRules ?? DEFAULT_FORMAT_RULES;

    const systemPrompt = config.systemPrompt ?? buildETLSystemPrompt(config);
    const allTools = [...(config.tools ?? []), ...etlTools];

    // pi Agent 真实 API: 使用 initialState + 顶层 hooks
    this.agent = new Agent({
      initialState: {
        systemPrompt,
        model: config.model as any,
        tools: allTools,
      },
      getApiKey: async (provider: string) => {
        // 支持环境变量中的 API Key
        if (provider === "deepseek") return process.env.DEEPSEEK_API_KEY;
        if (provider === "anthropic") return process.env.ANTHROPIC_API_KEY;
        if (provider === "openai") return process.env.OPENAI_API_KEY;
        return undefined;
      },
      beforeToolCall: composeBeforeHooks([
        createSecurityCheckHook(securityRules),
      ]),
      afterToolCall: composeAfterHooks([
        createSqlReviewHook(sqlRules),
        createFormatCheckHook(formatRules),
      ]),
    });
  }

  // ─── 公共 API ────────────────────────────────────────────

  /** 初始化 Agent，建立项目上下文 */
  async initialize(): Promise<void> {
    const root = this.config.projectRoot ?? process.cwd();
    this.projectContext = await buildProjectContext(
      this.config.projectName,
      root
    );
    if (!this.config.platform) {
      this.projectContext.platform = detectPlatform(root);
    } else {
      this.projectContext.platform = this.config.platform;
    }

    // 设置 context transform（pi Agent 真实 API）
    this.agent.transformContext = createETLContextTransform(this.projectContext);
  }

  /** 向 Agent 发送提示词 */
  async prompt(message: string): Promise<void> {
    if (!this.projectContext) {
      await this.initialize();
    }
    await this.agent.prompt(message);
  }

  /** 订阅事件 */
  subscribe(callback: (event: any) => void): void {
    this.agent.subscribe(callback);
  }

  /** 当前是否正在处理 */
  get pending(): boolean {
    return this.agent.pending;
  }

  /** 获取项目上下文 */
  getProjectContext(): ETLProjectContext | null {
    return this.projectContext;
  }

  /** 获取内部 pi Agent */
  getInternalAgent(): Agent {
    return this.agent;
  }
}

// ─── 导出 ───────────────────────────────────────────────────

export { etlTools } from "./tools";
export {
  composeBeforeHooks,
  composeAfterHooks,
  createSqlReviewHook,
  createSecurityCheckHook,
  createFormatCheckHook,
} from "./hooks";
export {
  createETLContextTransform,
  buildProjectContext,
  detectPlatform,
} from "./context";
export type * from "./types";

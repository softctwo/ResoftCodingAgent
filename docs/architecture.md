# Resoft Coding Agent — Architecture

## Overview

Resoft Coding Agent is a company-level AI coding assistant built on top of **pi-agent**, specialized for **Data ETL development scenarios**. It extends pi-agent's general-purpose agent framework with ETL-specific hooks, rules engines, skills, and a CLI.

## Architecture Layers

```
┌──────────────────────────────────────────────────┐
│           User Interface                          │
│  CLI (resoft chat/review/ci/template/skill/     │
│  stats/dashboard/init)                           │
│  Commander.js + Node.js runtime + Dashboard HTTP │
├──────────────────────────────────────────────────┤
│        resoft-coding-agent                       │
│  Main dispatcher, mode handlers (8 modes)        │
│  Dashboard server (server/route/views), config   │
│  Extensions, format-output utilities             │
├──────────────────────────────────────────────────┤
│         resoft-agent-core                        │
│  ResoftAgent, rules/ (diff+incremental), skills/ │
│  templates/, pipeline/ (CIReporter), stats/      │
│  Hooks, Context, Tools, ContextDetector          │
├──────────────────────────────────────────────────┤
│         pi-agent (foundation)                    │
│  Agent, Tool, Hooks, Context, TUI, LLM adapters  │
├──────────────────────────────────────────────────┤
│            Skills & Rules                        │
│  15 Skills (4 ETL + 10 community + superpowers)  │
│  YAML rule definitions, template library         │
└──────────────────────────────────────────────────┘
```

## Core Modules

### `@resoft/agent-core`（v1.0 扩展）
- **Types** (`types.ts`): ETLPlatform, Issue, CodingRule, hooks, agent config, project context, skill metadata.
- **Rules** (`rules/`): IncrementalRuleEngine (变更块审查), DiffTracker (文件哈希+行级差异), 规则摘要与历史。
- **Skills** (`skills/`): AutoSkillTrigger (平台检测+内容匹配+自动触发), SkillRegistry (注册/启禁/批量管理)。
- **Templates** (`templates/`): TemplateEngine (渲染/搜索/导出), BUILTIN_TEMPLATES (14 个内置 ETL 模板)。
- **Pipeline** (`pipeline/`): CIReporter — 4 种输出格式（text/json/sarif/checkstyle），exit code 控制，CI/CD 集成。
- **Stats** (`stats/`): TokenCounter (会话追踪+日聚合+JSON导出), CostCalculator (6 模型定价+月度预估)。
- **Hooks** (`hooks/`): Before/after tool-call hook chains, security check (bash/exec guard), SQL regex review, format checking.
- **Context** (`context/`): Platform-specific system prompts (Spark, Flink, dbt, SQL), context transform injection, project context builder, platform auto-detection.
- **Tools** (`tools/`): ETL-specific tools — read/write ETL files, SQL format, SQL validate, project analysis, data lineage.
- **Agent** (`agent.ts`): ResoftAgent class wraps pi's Agent with default rules, hooks, and tools.

### `@resoft/coding-agent`（v1.0 扩展）
- **CLI** (`cli.ts`): Commander.js-based CLI with 7 commands — `chat`, `review`, `ci`, `template`, `skill`, `stats`, `dashboard`, `init`.
- **Main** (`main.ts`): Dispatcher that loads config and routes to mode handlers.
- **Modes** (`modes/`): chat-mode, review-mode (增量+美化输出), ci-mode (CI exit codes), template-mode (list/search/render/export), skill-detect, stats-mode (summary/daily/pricing/export), init-mode.
- **Dashboard** (`dashboard/`): server.ts (Node.js http), routes.ts (5 REST API endpoints), views.ts (4 HTML pages: Overview/Issues/Usage/Team).
- **Config** (`config/`): Default config, team config loader with simple YAML parser.
- **Utils** (`utils/`): format-output (ANSI colors, tables, severity badges, diff blocks).
- **Extensions** (`extensions/`): Pi-compatible extensions (ETL review tool, message scanning, commands).

## Data Flow

### Interactive Chat Flow
1. **User invokes** `resoft chat -p spark -n my-project`
2. **CLI** parses args, passes to `main()` dispatcher
3. **Main** loads team config (rules YAML, skills registry)
4. **Chat mode** creates `ResoftAgent` with platform, rules, model
5. **ResoftAgent** initializes by detecting platform, building project context
6. A **context transform** injects the ETL platform prompt + rules summary into messages
7. **Hook chains** run before/after every tool call:
   - **Before**: security check (block dangerous commands)
   - **After**: SQL review (regex patterns), format check
8. **Agent** sends prompts to the LLM, returns tool calls and responses
9. **User** sees streaming output (via TUI in future iterations)

### CI/CD Pipeline Flow (v1.0)
1. **GitHub Actions / Pre-commit hook** trigger `resoft ci --files "*.sql" --format json`
2. **CI mode** loads team rules, creates IncrementalRuleEngine
3. For each file: read content → review → collect issues
4. **CIReporter** formats output (text/json/sarif/checkstyle)
5. **Exit code** determined by `--fail-on-error` / `--fail-on-warning` thresholds
6. Issues optionally posted to Dashboard via `POST /api/record`

### Dashboard Data Flow (v1.0)
1. `resoft dashboard` starts built-in HTTP server on configured port
2. 4 HTML pages served with in-memory DashboardStore
3. `POST /api/record` accepts review results from CI/CD pipeline
4. `GET /api/summary|issues|usage|team` return JSON stats
5. Data stored in-memory (stateless); usage stats persist to `~/.resoft/stats/usage.json`

### Usage Statistics Flow (v1.0)
1. `resoft stats summary|daily|pricing|export`
2. TokenCounter loads `~/.resoft/stats/usage.json`
3. CostCalculator maps model → pricing → cost
4. Output formatted as table/report; `--export` writes JSON

## Extension Mechanisms

Pi-agent supports these extension points:
- **Skills**: SKILL.md files in `pi-agent/skills/`, auto-injected as context
- **Extensions**: TypeScript modules that register tools, event handlers, commands
- **Hooks**: `beforeToolCall` / `afterToolCall` chains for validation and review
- **Context Transforms**: Modify message arrays before sending to LLM
- **Team Config**: YAML rule definitions and skill registries

## Tech Stack

- **Runtime**: Node.js 22, TypeScript
- **Agent Foundation**: @earendil-works/pi-agent-core, @earendil-works/pi-coding-agent
- **AI**: @earendil-works/pi-ai (model abstraction)
- **CLI**: Commander.js 12
- **Build**: tsgo (TypeScript-native Go-based compiler)
- **Test**: vitest
- **Package**: npm workspaces (`packages/*`)

## Dependencies

```
@resoft/coding-agent
  ├── @resoft/agent-core
  │     ├── pipeline/ (CIReporter: text/json/sarif/checkstyle)
  │     ├── stats/ (TokenCounter + CostCalculator)
  │     ├── rules/ (IncrementalRuleEngine + DiffTracker)
  │     ├── skills/ (AutoSkillTrigger + SkillRegistry)
  │     ├── templates/ (TemplateEngine + BUILTIN_TEMPLATES)
  │     ├── @earendil-works/pi-agent-core
  │     └── @earendil-works/pi-ai
  ├── dashboard/ (server + routes + views — zero deps)
  ├── modes/ (chat/review/ci/template/skill-detect/stats/init)
  ├── @earendil-works/pi-coding-agent
  ├── @earendil-works/pi-ai
  └── commander
```

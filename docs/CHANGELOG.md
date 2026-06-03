# 变更日志

本文件遵循 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/) 规范。

## [1.0.0] - 2025-06-01

### 新增
- **CI/CD 流水线集成**：`resoft ci` 命令，支持 `--files`、`--format`（text/json/sarif/checkstyle）、`--min-severity`、`--fail-on-error`、`--fail-on-warning`、`--no-fail-on-error`
- **CIReporter 模块**：4 种标准输出格式（text/json/sarif/checkstyle），适配 GitHub Actions / GitLab CI / Jenkins
- **团队 Dashboard**：`resoft dashboard` 命令，4 个页面（Overview/Issues/Usage/Team），内置 REST API，零外部依赖（Node.js http 模块）
- **Dashboard API**：`GET /api/summary`、`GET /api/issues`、`GET /api/usage`、`GET /api/team`、`POST /api/record`
- **用量统计**：`resoft stats` 命令，支持 summary/daily/pricing/export 子命令，`--days`（默认 7）、`--output` 参数
- **TokenCounter**：基于模型价格的 Token 估算，支持 deepseek-v4-pro、deepseek-chat、claude-sonnet-4、claude-opus-4、gpt-4o、gpt-4o-mini
- **CostCalculator**：按模型/日/用户维度的成本统计，月度费用预估
- **GitHub Actions 工作流**：`.github/workflows/resoft-review.yml`，自动 PR 代码审查
- **Pre-commit 钩子**：`scripts/pre-commit.sh`，提交前自动审查变更文件
- **ci-mode.ts**：CI 模式的独立处理器
- **stats-mode.ts**：统计模式的独立处理器
- **dashboard/**：server.ts、routes.ts、views.ts，完整的 Web Dashboard 实现
- **使用数据存储**：`~/.resoft/stats/usage.json`，每次调用自动记录

### 变更
- 版本号从 v0.1.0 跃升至 v1.0.0
- `resoft-agent-core` 新增 `pipeline/` 和 `stats/` 模块
- `resoft-coding-agent` 新增 `dashboard/`、`modes/ci-mode.ts`、`modes/stats-mode.ts`

---

## [0.3.0] - 2025-04-15

### 新增
- `template-mode`：基于模板的快速代码生成
- `skill-detect`：智能 Skill 自动检测，提升多平台混合场景的匹配准确率
- `format-output`：支持 ANSI 彩色输出，终端阅读体验优化

### 优化
- 审查报告输出格式更清晰，源码行高亮
- Skill 自动触发匹配速度提升

---

## [0.2.0] - 2025-03-01

### 新增
- **IncrementalRuleEngine**：增量审查引擎，仅对变更部分执行审查，大幅提升大文件审查性能
- **AutoSkillTrigger**：增强的自动 Skill 触发机制，支持关键词 + 文件扩展名双重匹配
- **14 个 BUILTIN_TEMPLATES**：内置 ETL 代码模板（Spark/Flink/dbt/SQL 各 3-4 个）
- **10 个社区 Skill**：由社区贡献的 ETL 平台 Skill（DataX、SeaTunnel、Kylin 等）
- `resoft init` 交互式引导模式

### 优化
- 审查性能优化（大文件分片 + 并行审查）
- Token 用量精简 30%+
- 交互模式体验优化（语法高亮、自动补全）

---

## [0.1.0] - 2025-01-15

### 新增
- 基于 pi-agent 框架扩展开发的 ResoftCodingAgent 首个版本
- 支持 4 个 ETL 平台 Skill：
  - `spark-etl` — Spark/PySpark ETL 开发与审查
  - `flink-etl` — Flink SQL 流计算开发与审查
  - `dbt-etl` — dbt 数据建模开发与审查
  - `sql-etl` — 通用 SQL 脚本开发与审查
- `resoft` CLI 命令行工具，提供统一入口
- ETL 代码审查 Hook 链，支持多级审查规则：
  - 正则模式匹配规则
  - 语义分析规则（Spark AST）
  - 自定义规则集
- `resoft chat` 交互式 ETL 开发对话模式
- `resoft review` 代码审查命令，支持 4 级问题输出（error/warning/info/suggestion）
- `resoft init` 项目脚手架初始化，支持 7 个模板
- `resoft skill` Skill 生命周期管理命令
- 团队配置共享机制（`team-config/` 目录）：
  - `rules/` 审查规则集
  - `naming/` 命名规范
  - `skills.yaml` Skill 注册表
  - `review-hooks.yaml` 审查 Hook 链配置
- 支持多 LLM 模型：Anthropic Claude (Sonnet/Opus)、OpenAI GPT-4o/4-Turbo
- 支持自定义 OpenAI 兼容端点（私有化部署）
- 多 API Key 负载均衡
- Skill auto_trigger 自动匹配机制
- 会话上下文管理与持久化

### 依赖
- Node.js >= 20
- Python >= 3.9（Skill 脚本运行时）
- pi-agent >= 1.0.0

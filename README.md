# ResoftCodingAgent

<div align="center">

**公司级 AI Coding Agent — Data ETL 开发场景**

基于 [earendil-works/pi](https://github.com/earendil-works/pi) agent 扩展，专注 SQL/PySpark/Flink/dbt 数据工程

[![Version](https://img.shields.io/badge/version-0.3.0-blue)](docs/CHANGELOG.md)
[![Node](https://img.shields.io/badge/node-%3E%3D20-brightgreen)](https://nodejs.org)
[![License](https://img.shields.io/badge/license-private-red)]()

</div>

---

## 什么是 ResoftCodingAgent

ResoftCodingAgent 是面向数据工程团队的 AI 编程助手，在 pi agent 框架基础上扩展了 ETL 开发场景的专用能力：

- **增量规则引擎** — 只检查变更行，大文件秒级审查，diff 追踪 + 规则历史
- **Skill 自动触发** — 自动检测项目平台（Spark/Flink/dbt/SQL），按需启用 Skill
- **代码模板库** — 14 个内置 ETL 模板，一键生成 Spark 作业、Flink 管道、dbt 模型
- **模板 CLI 集成** — `resoft template list|search|render` 完整命令行支持
- **Skill 自动检测** — `resoft skill detect` 扫描项目，平台检测 + 可视化推荐
- **终端美化输出** — ANSI 颜色、表格、进度条，审查结果结构化展示
- **社区 Skill 集成** — 内置 10 个社区精华 Skill（TDD、前后端工作流、上下文管理等）
- **多平台支持** — SQL、PySpark、Flink SQL、dbt，自动检测并注入平台上下文
- **团队编码规则** — YAML 配置化规则集，Git 版本控制，全团队共享
- **零侵入架构** — 不改动 pi agent 核心代码，通过 npm workspace 扩展

## 快速开始

### 环境要求

| 依赖 | 版本 |
|------|------|
| Node.js | ≥ 20 |
| npm | ≥ 9 |
| Python | ≥ 3.9 (Skill 脚本) |
| Git | ≥ 2.30 |

### 安装

```bash
# 1. 克隆项目
git clone https://github.com/softctwo/ResoftCodingAgent.git
cd ResoftCodingAgent

# 2. 安装依赖
npm install

# 3. 构建（TypeScript → JavaScript）
npm run build

# 4. 配置 LLM API Key
export DEEPSEEK_API_KEY="your-api-key"
# 或
export ANTHROPIC_API_KEY="your-api-key"
export OPENAI_API_KEY="your-api-key"
```

### 全局安装（可选）

```bash
cd pi-agent/packages/resoft-coding-agent
npm link
resoft --help     # ✅ 全局可用
```

### 第一个 ETL 任务

```bash
# 进入交互模式（SQL 平台）
npm run resoft chat -p sql

# 开始对话
> 写一个每日销售额汇总SQL，表是 raw_orders(id,amount,order_date)
```

### 全部命令

```bash
# ─── 交互开发 ───
npm run resoft chat              # SQL 模式
npm run resoft chat -p spark     # Spark 模式
npm run resoft chat -p flink     # Flink 模式
npm run resoft chat -p dbt       # dbt 模式

# ─── 增量代码审查 ───
npm run resoft review orders.sql                     # 全量审查
npm run resoft review --incremental etl.py -p spark  # 增量审查（仅变更行）
npm run resoft review --incremental --team-config ../team-config orders.sql

# ─── 项目初始化 ───
npm run resoft init spark-job    # Spark 作业模板
npm run resoft init flink-job    # Flink 管道模板
npm run resoft init dbt-project  # dbt 项目模板

# ─── 模板引擎 ───
npm run resoft template list                        # 列出所有模板
npm run resoft template list --platform spark        # 按平台筛选
npm run resoft template search -k "jdbc"            # 搜索模板
npm run resoft template render -i spark-read-jdbc \  # 渲染模板
  --vars '{"SOURCE_TABLE":"users","JDBC_URL":"jdbc:mysql://db"}'
npm run resoft template export -o templates.json     # 导出 JSON

# ─── Skill 管理 ───
npm run resoft skill list                    # 查看所有 Skill
npm run resoft skill detect                  # 自动检测当前项目
npm run resoft skill detect ./path/to/project # 检测指定目录
npm run resoft skill enable superpowers
npm run resoft skill disable resoft-dbt
```

## 架构

```
ResoftCodingAgent
│
├── 📦 resoft-coding-agent             CLI 工具层
│   ├── CLI (commander.js)             resoft chat/review/init/skill/template
│   ├── Modes                          模式分发
│   │   ├── chat-mode.ts              交互开发
│   │   ├── review-mode.ts            增量规则审查 + 美化输出
│   │   ├── template-mode.ts          模板列表/搜索/渲染/导出
│   │   ├── skill-detect.ts           项目扫描 + 平台检测 + Skill 推荐
│   │   └── init-mode.ts              项目初始化
│   ├── Extensions                     pi Extension (ETL 代码审查)
│   ├── Config                         YAML 规则集 + Skill 注册表加载
│   └── Utils                          format-output (ANSI 颜色/表格/diff)
│
├── 📦 resoft-agent-core               核心扩展层
│   ├── ResoftAgent                    包装 pi Agent，注入 ETL 能力
│   ├── rules/                         增量规则引擎
│   │   ├── DiffTracker                文件哈希 + 行级差异追踪
│   │   └── IncrementalRuleEngine      变更块审查 + 规则摘要 + 历史
│   ├── skills/                        Skill 管理
│   │   ├── AutoSkillTrigger           平台检测 + 内容匹配 + 自动触发
│   │   └── SkillRegistry              注册/启禁/批量管理
│   ├── templates/                     代码模板库
│   │   ├── TemplateEngine             渲染/搜索/导入导出
│   │   └── BUILTIN_TEMPLATES          14 个内置 ETL 模板
│   ├── Hooks                          审查 Hook 链 (SQL/安全/格式)
│   ├── Context                        平台上下文注入
│   ├── ContextDetector                自动平台检测
│   └── Tools                          ETL 专用工具
│
├── 📦 pi-agent (earendil-works/pi)    基础框架
│   ├── packages/agent                 Agent 运行时
│   ├── packages/ai                    LLM API (DeepSeek/Anthropic/OpenAI)
│   └── packages/coding-agent          SDK + 会话管理
│
├── 🎯 skills/                         Skills（15 个）
│   ├── sql/          SQL 规范 + 优化指南 + 格式化脚本
│   ├── spark/        PySpark 最佳实践 + 验证脚本
│   ├── flink/        Flink SQL + 状态后端 + 窗口模式
│   ├── dbt/          dbt 建模 + Jinja 模板 + 测试
│   ├── superpowers/          TDD + 代码质量检查
│   ├── superclaude/          指令菜单（/analyze /fix /feature）
│   ├── minimax/              前后端/移动端工作流模板
│   ├── anthropic-skills/     官方 Skill 设计参考
│   ├── vercel-skills/        React/Next.js 质量规则
│   ├── planning-files/       Markdown 规划 + 进度追踪
│   ├── context-engineering/  上下文管理 + Token 预算
│   ├── composio/             GitHub/Slack/DB 集成
│   ├── antfu-skills/         进阶 Skill 设计模式
│   └── awesome-skills/       技能导航目录
│
├── ⚙️ team-config/                     团队共享配置
│   ├── rules/      编码规则集 (SQL/Spark/命名/Git)
│   └── registry/   Skill 注册表 (15 个 Skill)
│
└── 📚 docs/                           产品文档
    ├── install-guide.md
    ├── user-manual.md
    ├── quick-start.md
    ├── admin-guide.md
    ├── ops-guide.md
    ├── faq.md
    ├── architecture.md
    ├── skill-development.md
    ├── CHANGELOG.md
    └── deployment.md
```

### 设计原则

> **不修改 pi 核心代码** — 所有 Resoft 扩展通过独立 npm 包实现，与 pi 通过 workspace 协作

```typescript
// resoft-agent-core: 包装 pi Agent，注入 ETL 能力
import { ResoftAgent } from "@resoft/agent-core";
import { IncrementalRuleEngine } from "@resoft/agent-core/rules";
import { TemplateEngine, BUILTIN_TEMPLATES } from "@resoft/agent-core/templates";
import { SkillRegistry } from "@resoft/agent-core/skills";

const agent = new ResoftAgent({
  projectName: "daily-revenue-etl",
  platform: "sql",
  model: getModel("deepseek", "deepseek-v4-pro"),
  autoReview: true,
});

// 增量规则引擎：只检查变更行
const ruleEngine = new IncrementalRuleEngine("sql", sqlRules);
const result = ruleEngine.reviewFile("orders.sql", fileContent);
// → { newIssues: 2, resolvedIssues: 1, blocksChecked: 3, blocksSkipped: 45 }

// Skill 自动触发：检测项目平台
const registry = new SkillRegistry("/path/to/project");
registry.registerFromConfig(allSkills);
const enabled = registry.autoEnable(); // → ['resoft-spark', 'superpowers']

// 代码模板：生成 Spark 作业骨架
const tmpl = new TemplateEngine();
tmpl.register(BUILTIN_TEMPLATES);
const code = tmpl.render("spark-read-jdbc", {
  SOURCE_TABLE: "raw_orders",
  JDBC_URL: "jdbc:mysql://localhost:3306/dw",
});

await agent.prompt("生成每日营收汇总SQL");
```

## 支持的 ETL 平台

| 平台 | 标签 | 能力 |
|------|------|------|
| **SQL** | `sql` | ANSI SQL 生成、优化、审查、数据质量检查 |
| **PySpark** | `spark` | DataFrame API、窗口函数、性能调优、分区策略 |
| **Flink** | `flink` | Flink SQL DDL、窗口聚合、Checkpoint、CDC |
| **dbt** | `dbt` | 分层建模、Jinja 模板、增量模型、测试 |

## 增量规则引擎

只检查文件变更部分，适合大型 ETL 项目的快速审查：

```typescript
const engine = new IncrementalRuleEngine("sql", rules);

// 首次：全量审查
const r1 = engine.reviewFile("etl.sql", content);
// → { totalIssues: 12, newIssues: 12, blocksChecked: 1, blocksSkipped: 0 }

// 修改后：只检查变更行
const r2 = engine.reviewFile("etl.sql", modifiedContent);
// → { totalIssues: 8, newIssues: 2, resolvedIssues: 6, blocksChecked: 3, blocksSkipped: 200 }
```

## 代码模板库

14 个内置 ETL 模板，覆盖常见数据工程场景：

| 分类 | 数量 | 示例 |
|------|------|------|
| **Spark** | 4 | JDBC 读取、Kafka 消费、ETL 清洗、流式聚合 |
| **Flink** | 3 | CDC 管道、窗口聚合、检查点配置 |
| **dbt** | 3 | 增量模型、快照、Seed 数据 |
| **SQL** | 3 | CTE 链、SCD Type 2、数据质量检查 |
| **工具** | 1 | Airflow DAG |

## 团队编码规则

规则集使用 YAML 配置，放在 `team-config/rules/` 目录：

```yaml
# team-config/rules/sql-rules.yaml
- id: "select-star"
  description: "避免使用 SELECT *"
  pattern: "SELECT\\s+\\*"
  severity: warning
  suggestion: "请明确列出需要的列名"
  platforms: ["sql", "spark"]

- id: "no-drop-table"
  description: "禁止 DROP TABLE"
  severity: error
  suggestion: "请确认后再操作"
```

- 规则在 Agent 运行时自动加载
- 增量规则引擎只对变更行应用规则
- 可通过 Git 在团队间同步
- 支持 `error` / `warning` / `info` 三个级别

## Skill 管理（15 个 Skill）

```bash
npm run resoft skill list          # 查看所有 Skill
npm run resoft skill detect        # 自动检测项目推荐 Skill
npm run resoft skill enable <name> # 启用
npm run resoft skill disable <name># 禁用
```

### ETL Skills（4 个）
| Skill | 平台 | 说明 |
|-------|------|------|
| resoft-sql | SQL | ANSI SQL 生成、优化指南、格式校验 |
| resoft-spark | PySpark | DataFrame 最佳实践、分区策略、性能调优 |
| resoft-flink | Flink | Flink SQL、Checkpoint、状态后端、窗口 |
| resoft-dbt | dbt | 分层建模、Jinja 模板、增量模型、测试 |

### 社区 Skills（10 个）
| Skill | 用途 |
|-------|------|
| superpowers | TDD 先测试后代码 + 质量检查 |
| superclaude | 指令菜单：/analyze /fix /feature /optimize |
| minimax | 前后端/移动端/文档工作流模板 |
| anthropic-skills | 官方 Skill 设计参考与最佳实践 |
| vercel-skills | React/Next.js 性能+可访问性+架构检查 |
| planning-files | Markdown 计划/进度/决策记录 |
| context-engineering | 上下文管理、Token 预算、摘要策略 |
| composio | GitHub/Slack/Notion/DB 外部工具集成 |
| antfu-skills | 进阶 Skill 设计模式（组合/懒加载/参数化） |
| awesome-skills | 技能导航目录（按类别/平台/流程浏览） |

## 技术栈

- **Agent 框架**: [earendil-works/pi](https://github.com/earendil-works/pi) (TypeScript)
- **LLM 接入**: DeepSeek V4 / Anthropic Claude / OpenAI GPT
- **构建工具**: tsgo (TypeScript 原生编译器) + npm workspaces
- **运行时**: Node.js ≥ 20 + ESM
- **CLI**: Commander.js
- **配置**: YAML (团队规则 + Skill 注册表)

## 文档

| 文档 | 说明 |
|------|------|
| [安装手册](docs/install-guide.md) | 环境准备、安装步骤、问题排查 |
| [快速入门](docs/quick-start.md) | 5 分钟上手 |
| [用户手册](docs/user-manual.md) | 命令详解、最佳实践、示例 |
| [管理员手册](docs/admin-guide.md) | 团队配置、Skill 管理、推广 |
| [运维手册](docs/ops-guide.md) | 备份、监控、故障排查 |
| [常见问题](docs/faq.md) | 20+ FAQ 覆盖安装/使用/故障 |
| [架构文档](docs/architecture.md) | 设计思路与模块说明 |
| [Skill 开发](docs/skill-development.md) | 自定义 Skill 开发指南 |
| [变更日志](docs/CHANGELOG.md) | 版本历史与路线图 |

## 开发计划

- [x] v0.1.0 — 核心框架、4 个 ETL Skill、Hook 链、CLI
- [x] v0.2.0 — 增量规则引擎、Skill 自动触发、代码模板库、10 个社区 Skill
- [x] v0.3.0 — 模板 CLI 集成、Skill 自动检测命令、终端美化输出
- [ ] v1.0.0 — 流水线集成、团队 Dashboard、用量统计

## License

Private — 公司内部工具，未经授权不得外部分发。

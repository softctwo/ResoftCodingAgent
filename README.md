# ResoftCodingAgent

<div align="center">

**公司级 AI Coding Agent — Data ETL 开发场景**

基于 [earendil-works/pi](https://github.com/earendil-works/pi) agent 扩展，专注 SQL/PySpark/Flink/dbt 数据工程

[![Version](https://img.shields.io/badge/version-0.1.0-blue)](CHANGELOG.md)
[![Node](https://img.shields.io/badge/node-%3E%3D20-brightgreen)](https://nodejs.org)
[![License](https://img.shields.io/badge/license-private-red)]()

</div>

---

##  什么是 ResoftCodingAgent

ResoftCodingAgent 是面向数据工程团队的 AI 编程助手，在 pi agent 框架基础上扩展了 ETL 开发场景的专用能力：

- **多平台支持** — SQL、PySpark、Flink SQL、dbt，自动检测并注入平台上下文
- **代码审查 Hook** — SQL 规范检查、安全拦截（禁止 DROP/TRUNCATE）、格式校验
- **团队编码规则** — YAML 配置化规则集，Git 版本控制，全团队共享
- **企业 Skill 库** — 为每个 ETL 平台预置最佳实践 Skill，支持自定义扩展
- **零侵入架构** — 不改动 pi agent 核心代码，通过 npm workspace 扩展

##  快速开始

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
cd ResoftCodingAgent/pi-agent

# 2. 安装依赖
npm install

# 3. 配置 LLM API Key
export DEEPSEEK_API_KEY="your-api-key"
# 或
export ANTHROPIC_API_KEY="your-api-key"
export OPENAI_API_KEY="your-api-key"
```

### 第一个 ETL 任务

```bash
# 进入交互模式（SQL 平台）
npm run resoft chat -p sql

# 开始对话
> 写一个每日销售额汇总SQL，表是 raw_orders(id,amount,order_date)
```

支持的命令：
```bash
npm run resoft chat              # 交互式 ETL 开发
npm run resoft chat -p spark     # Spark 模式
npm run resoft chat -p flink     # Flink 模式
npm run resoft chat -p dbt       # dbt 模式

npm run resoft review orders.sql # 代码审查

npm run resoft init spark-job    # 初始化 Spark 项目模板
npm run resoft init flink-job    # 初始化 Flink 项目模板
npm run resoft init dbt-project  # 初始化 dbt 项目模板

npm run resoft skill list        # 查看已注册 Skill
```

##  架构

```
ResoftCodingAgent
│
├── 📦 resoft-coding-agent         CLI 工具层
│   ├── CLI (commander.js)         resoft chat/review/init/skill
│   ├── Modes                      模式分发（交互/审查/初始化）
│   ├── Extensions                 pi Extension (代码审查)
│   └── Team Config Loader         YAML 规则集加载
│
├── 📦 resoft-agent-core           核心扩展层
│   ├── ResoftAgent                包装 pi Agent，注入 ETL 能力
│   ├── Hooks                      审查 Hook 链 (SQL/安全/格式)
│   ├── Context                    平台上下文注入
│   └── Tools                      ETL 专用工具
│
├── 📦 pi-agent (earendil-works/pi)  基础框架
│   ├── packages/agent             Agent 运行时
│   ├── packages/ai                LLM API (DeepSeek/Anthropic/OpenAI)
│   └── packages/coding-agent      SDK + 会话管理
│
├── 🎯 skills/                     ETL Skills
│   ├── sql/      SQL 规范 + 优化指南 + 格式化脚本
│   ├── spark/    PySpark 最佳实践 + 验证脚本
│   ├── flink/    Flink SQL + 状态后端 + 窗口模式
│   └── dbt/      dbt 建模 + Jinja 模板 + 测试
│
├── ⚙️ team-config/                 团队共享配置
│   ├── rules/      编码规则集 (SQL/Spark/命名/Git)
│   └── registry/   Skill 注册表
│
└── 📚 docs/                       产品文档
    ├── install-guide.md
    ├── user-manual.md
    ├── quick-start.md
    ├── admin-guide.md
    └── faq.md
```

### 设计原则

> **不修改 pi 核心代码** — 所有 Resoft 扩展通过独立 npm 包实现，与 pi 通过 workspace 协作

```typescript
// resoft-agent-core: 包装 pi Agent，注入 ETL 能力
const agent = new ResoftAgent({
  projectName: "daily-revenue-etl",
  platform: "sql",
  model: getModel("deepseek", "deepseek-v4-pro"),
  autoReview: true,
});
await agent.prompt("生成每日营收汇总SQL");
```

##  支持的 ETL 平台

| 平台 | 标签 | 能力 |
|------|------|------|
| **SQL** | `sql` | ANSI SQL 生成、优化、审查、数据质量检查 |
| **PySpark** | `spark` | DataFrame API、窗口函数、性能调优、分区策略 |
| **Flink** | `flink` | Flink SQL DDL、窗口聚合、Checkpoint、CDC |
| **dbt** | `dbt` | 分层建模、Jinja 模板、增量模型、测试 |

##  团队编码规则

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
- 可通过 Git 在团队间同步
- 支持 `error` / `warning` / `info` 三个级别
- 可指定 `platforms` 限制生效平台

##  Skill 管理

```bash
# 查看已注册 Skill
npm run resoft skill list

# 启用/禁用 Skill
npm run resoft skill enable resoft-spark
npm run resoft skill disable resoft-dbt
```

自定义 Skill 开发：参见 [Skill 开发指南](docs/skill-development.md)

##  技术栈

- **Agent 框架**: [earendil-works/pi](https://github.com/earendil-works/pi) (TypeScript)
- **LLM 接入**: DeepSeek V4 / Anthropic Claude / OpenAI GPT 全系列
- **构建工具**: tsgo (TypeScript 原生编译器)
- **测试**: Vitest
- **CLI**: Commander.js
- **运行时**: Node.js ≥ 20 + ESM

##  文档

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

##  开发计划

- [x] v0.1.0 — 核心框架、4 个 ETL Skill、Hook 链、CLI
- [ ] v0.2.0 — 增量规则引擎、Skill 自动触发、代码模板库
- [ ] v1.0.0 — 流水线集成、团队 Dashboard、用量统计

## License

Private — 公司内部工具，未经授权不得外部分发。

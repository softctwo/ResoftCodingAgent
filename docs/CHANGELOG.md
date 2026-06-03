# 变更日志

本文件遵循 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/) 规范。

## [Unreleased]

### Planned
- 用量统计仪表盘（Token 消耗、Skill 热力图）
- 支持更多 ETL 平台（DataX、SeaTunnel）
- Git 集成（自动识别变更文件，增量审查）
- VSCode / JetBrains IDE 插件
- Web UI 管理界面
- 审查缓存与增量审查
- 多语言支持（中/英）

---

## [0.2.0] - 计划中

### 计划新增
- `resoft init` 交互式引导模式
- 审查规则在线市场（规则共享）
- 更多 SQL 方言支持（ClickHouse、Doris、StarRocks）
- Skill 热加载（无需重启）
- CI/CD 原生集成（GitHub Action、GitLab CI 模板）

### 计划优化
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

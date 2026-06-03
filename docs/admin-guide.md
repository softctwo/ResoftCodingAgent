# ResoftCodingAgent 管理员手册

## 1. 概述

作为 ResoftCodingAgent 的团队管理员，你的核心职责包括：

| 职责 | 说明 |
|------|------|
| 团队配置管理 | 维护 `team-config/` 中的编码规则、审查规则、命名规范 |
| Skill 管理 | 管理 Skill 注册表、启用/禁用、开发自定义 Skill |
| 用量监控 | 跟踪团队 Token 消耗、使用频率 |
| 推广与培训 | 推动团队采用、组织培训、收集反馈 |
| 安全合规 | 管理 API Key、确保代码隐私、对齐审查规则与合规要求 |

---

## 2. 团队配置管理

### 2.1 目录结构

```
team-config/
├── rules/                      # 审查规则集
│   ├── default.yaml            # 默认规则（所有平台通用）
│   ├── spark.yaml              # Spark 专项规则
│   ├── spark-strict.yaml       # Spark 严格规则（生产环境）
│   ├── flink.yaml              # Flink 专项规则
│   ├── dbt.yaml                # dbt 专项规则
│   └── sql.yaml                # SQL 专项规则
├── naming/                     # 命名规范
│   ├── spark-naming.yaml       # Spark 变量/函数命名
│   └── sql-naming.yaml         # 表/列/索引命名
├── skills.yaml                 # Skill 注册表
├── review-hooks.yaml           # 审查 Hook 链配置
└── .gitkeep
```

### 2.2 规则集编写规范

#### YAML 格式

```yaml
# rules/spark.yaml
ruleset: spark
version: "1.0"
description: "Spark/PySpark ETL 编码审查规则"

rules:
  - id: SPARK-E001                    # 唯一 ID，格式: <PLATFORM>-<LEVEL><NUM>
    severity: error                   # error | warning | info | suggestion
    category: performance             # performance | security | style | correctness
    title: "分区键缺失"
    description: "SELECT / JOIN 操作应指定分区过滤条件"
    pattern: "spark\\.(sql|table)\\(['\"](SELECT|select)"
    exclusion: "WHERE.*dt\\s*=|WHERE.*partition"
    suggestion: "添加分区过滤条件，如 WHERE dt = '${date}'，避免全表扫描"
    examples:
      bad: |
        spark.sql("SELECT * FROM ods.orders")
      good: |
        spark.sql("SELECT * FROM ods.orders WHERE dt = '${yesterday}'")

  - id: SPARK-W002
    severity: warning
    category: style
    title: "SparkSession 命名不规范"
    pattern: "SparkSession\\.builder.*\\.getOrCreate\\(\\)"
    check: "variable_name != 'spark'"
    suggestion: "SparkSession 变量应命名为 spark"
    examples:
      bad: "ss = SparkSession.builder.appName('test').getOrCreate()"
      good: "spark = SparkSession.builder.appName('test').getOrCreate()"
```

#### 字段说明

| 字段 | 必填 | 说明 |
|------|------|------|
| `id` | ✅ | 全局唯一 ID，建议格式: `{PLATFORM}-{LEVEL}{NUM}` |
| `severity` | ✅ | 问题级别: `error` / `warning` / `info` / `suggestion` |
| `category` | ✅ | 分类: `performance` / `security` / `style` / `correctness` / `best-practice` |
| `title` | ✅ | 简洁的问题标题（中文） |
| `description` | ✅ | 问题的详细说明 |
| `pattern` | ✅ | 正则或 AST 匹配模式 |
| `exclusion` | ❌ | 排除条件的正则 |
| `suggestion` | ✅ | 修复建议（中文） |
| `examples` | ❌ | 正反示例对 |

### 2.3 新增/修改编码规则

```bash
# 1. 编辑对应的规则文件
vim team-config/rules/spark.yaml

# 2. 验证规则语法
resoft admin validate-rules

# 3. 测试规则效果
resoft review test/spark_test.py --ruleset spark --format json

# 4. 提交到 Git
git add team-config/rules/spark.yaml
git commit -m "feat(rules): 新增 Spark UDF 安全检查规则"
git push
```

### 2.4 定制 SQL 审查规则

```yaml
# rules/sql.yaml 示例
ruleset: sql
rules:
  - id: SQL-E001
    severity: error
    category: correctness
    title: "DELETE/UPDATE 缺少 WHERE 条件"
    pattern: "(DELETE|UPDATE)\\s+\\w+\\s+(?!WHERE)"
    suggestion: "DELETE/UPDATE 必须带 WHERE 条件，防止全表误操作"

  - id: SQL-W002
    severity: warning
    category: performance
    title: "SELECT * 不推荐"
    pattern: "SELECT\\s+\\*"
    suggestion: "显式列出需要的列，减少 IO 和网络传输"

  - id: SQL-W003
    severity: warning
    category: performance
    title: "大表 JOIN 小表未使用 MapJoin Hint"
    pattern: "JOIN"
    context: "fact_|ods_"          # 检查是否有大表
    suggestion: "大表 JOIN 小表时建议使用 /*+ MAPJOIN(small_table) */"

  - id: SQL-I004
    severity: info
    category: best-practice
    title: "DDL 缺少生命周期设置"
    pattern: "CREATE\\s+(EXTERNAL\\s+)?TABLE"
    exclusion: "LIFECYCLE|lifecycle"
    suggestion: "建议设置表生命周期: LIFECYCLE 90"
```

### 2.5 定制 Spark 审查规则

Spark 审查规则支持两类检查：

**1. 正则模式匹配（基于源码文本）**

适用于：命名规范、API 调用检查、危险操作检测

**2. 语义分析（基于 AST）**

适用于：DataFrame 操作链检查、分区裁剪验证、广播变量检测

```yaml
# Spark 语义规则示例
- id: SPARK-E010
  severity: error
  category: correctness
  title: "collect() 调用可能导致 OOM"
  semantic: "find_calls('collect')"       # 语义匹配
  context_check: "result_size > 1000"      # 上下文检查
  suggestion: "collect() 将全量数据拉取到 Driver，建议使用 show()/take()/write"

- id: SPARK-W011
  severity: warning
  category: performance
  title: "未启用的广播 Join"
  semantic: "check_broadcast_hint"
  suggestion: "小表参与 Join 时建议添加 broadcast hint: df.join(broadcast(small_df))"
```

### 2.6 添加命名规范

```yaml
# naming/spark-naming.yaml
platform: spark
version: "1.0"
rules:
  - target: "SparkSession variable"
    pattern: "spark"
    severity: error
    description: "SparkSession 变量必须命名为 spark"

  - target: "DataFrame variable"
    pattern: "^(?!.*_df$).*$"           # 不以 _df 结尾则告警
    severity: warning
    suggestion: "DataFrame 变量建议以 _df 结尾，如 orders_df"

  - target: "UDF function"
    pattern: "^udf_\\w+$"
    severity: info
    suggestion: "UDF 函数建议以 udf_ 为前缀"
```

```yaml
# naming/sql-naming.yaml
platform: sql
rules:
  - target: "table name"
    pattern: "^(ods|dwd|dws|ads|dim)_\\w+$"
    severity: warning
    suggestion: "表名应遵循分层命名: {layer}_{business}_{detail}"

  - target: "column name"
    pattern: "^[a-z][a-z0-9_]*$"
    severity: error
    suggestion: "列名应使用小写蛇形命名（snake_case），不能以数字开头"
```

---

## 3. Skill 管理

### 3.1 skills.yaml 注册表格式

```yaml
# team-config/skills.yaml
version: "1.0"
skills:
  spark-etl:
    enabled: true
    path: skills/spark-etl
    description: "Spark/PySpark ETL 开发与审查"
    auto_trigger:
      - "**/*.py"              # Python 文件触发
      - "**/spark/**"
    requires_python: ">=3.9"
    dependencies:
      - "pyspark>=3.5.0"

  flink-etl:
    enabled: true
    path: skills/flink-etl
    description: "Flink SQL ETL 开发与审查"
    auto_trigger:
      - "**/*.sql"
      - "**/flink/**"

  dbt-etl:
    enabled: true
    path: skills/dbt-etl
    description: "dbt 数据建模"
    auto_trigger:
      - "**/*.sql"
      - "**/*.yml"
      - "**/models/**"

  sql-etl:
    enabled: true
    path: skills/sql-etl
    description: "通用 SQL 脚本开发"
    auto_trigger:
      - "**/*.sql"

  custom-my-team-skill:          # 自定义 Skill
    enabled: false
    path: skills/custom/my-team-skill
    description: "团队自定义数据血缘分析"
    auto_trigger:
      - "**/lineage/**"
    requires_python: ">=3.10"
```

### 3.2 启用/禁用 Skill

```bash
# 通过 CLI
resoft skill enable spark-etl
resoft skill disable custom-old-skill

# 或直接编辑 YAML
vim team-config/skills.yaml
# 修改 enabled: true/false

# 提交改动
git add team-config/skills.yaml
git commit -m "admin: 禁用旧版 custom-old-skill"
git push
```

### 3.3 开发自定义 Skill

#### Step 1: 创建 Skill 骨架

```bash
resoft skill create my-custom-skill
```

这将生成：

```
skills/custom/my-custom-skill/
├── SKILL.md              # Skill 定义文件
├── prompt.md             # 系统提示词
├── scripts/              # Python 辅助脚本
│   └── analyzer.py
├── examples/             # 示例输入/输出
│   └── example.md
└── requirements.txt      # Python 依赖
```

#### Step 2: 编辑 SKILL.md

```markdown
# My Custom Skill

## 描述
我的团队自定义数据血缘分析 Skill

## 触发条件
- 文件匹配: `**/lineage/**` 或 `**/*_dag.py`
- 关键词: "数据血缘" "DAG" "依赖分析" "lineage"

## 适用平台
- SQL
- Spark

## 能力
1. 解析 SQL 脚本的源表和目标表
2. 生成数据血缘 DAG
3. 检测循环依赖
4. 生成 PlantUML / Mermaid 图表

## 限制
- 仅支持 INSERT INTO / CREATE TABLE AS SELECT 模式
- 存储过程的血缘分析不支持

## 示例
（附典型对话示例）
```

#### Step 3: 编写提示词 (prompt.md)

```markdown
你是一个数据血缘分析专家。当用户询问数据血缘相关问题时：

1. 解析所有给定的 SQL 脚本
2. 提取 CREATE TABLE AS SELECT 和 INSERT INTO SELECT 语句
3. 构建源表 → 目标表的映射关系
4. 检测是否有循环依赖
5. 用 Mermaid 格式输出 DAG 图

注意事项：
- 临时表（以 tmp_ 开头）可不纳入血缘
- 如果发现循环依赖，高亮标记并给出解耦建议
```

#### Step 4: 编写辅助脚本

```python
# scripts/analyzer.py
"""数据血缘分析辅助脚本"""
import re
import sys
import json
from typing import List, Dict


def parse_lineage(sql: str) -> List[Dict[str, str]]:
    """解析 SQL 中的表级血缘关系"""
    pattern = re.compile(
        r'(?:INSERT\s+(?:OVERWRITE|INTO)\s+TABLE\s+)?'
        r'(?:CREATE\s+TABLE\s+)?'
        r'(\w+\.\w+)\s+.*?(?:FROM|JOIN)\s+(\w+\.\w+)',
        re.IGNORECASE | re.DOTALL
    )
    edges = []
    for match in pattern.finditer(sql):
        edges.append({
            "source": match.group(2),
            "target": match.group(1)
        })
    return edges


def detect_cycles(edges: List[Dict[str, str]]) -> List[List[str]]:
    """检测循环依赖（拓扑排序）"""
    # ... 实现略
    pass


if __name__ == "__main__":
    sql_text = sys.stdin.read()
    edges = parse_lineage(sql_text)
    cycles = detect_cycles(edges)
    print(json.dumps({"edges": edges, "cycles": cycles}, ensure_ascii=False))
```

#### Step 5: 注册到 skills.yaml

```yaml
custom-lineage-analyzer:
  enabled: true
  path: skills/custom/my-custom-skill
  description: "数据血缘分析"
  auto_trigger:
    - "**/lineage/**"
    - "**/*_dag.py"
```

#### Step 6: 测试与部署

```bash
# 本地测试
resoft skill test custom-lineage-analyzer

# 提交
git add skills/custom/my-custom-skill team-config/skills.yaml
git commit -m "feat(skill): 新增数据血缘分析 Skill"
git push
```

### 3.4 Skill 触发规则

| 触发方式 | 说明 | 示例 |
|----------|------|------|
| `auto_trigger` glob | 文件路径匹配时自动激活 | `**/*.sql` → 自动启用 sql-etl |
| 关键词匹配 | 用户消息中出现关键词 | "Flink" → 激活 flink-etl |
| `--platform` 显式指定 | 命令行参数指定 | `resoft chat --platform spark` |
| `!platform` 交互切换 | 交互模式下手动切换 | `!platform dbt` |

**优先级**: 显式指定 > 交互切换 > 关键词匹配 > auto_trigger

### 3.5 Skill 版本管理

```bash
# team-config/ 应纳入 Git 管理
cd team-config
git init  # 如果尚未初始化
git add -A
git commit -m "v0.1.0: 初始化团队配置"

# 每次修改后打 tag
git tag v0.1.1
git push --tags

# 团队成员拉取最新配置
git pull origin main
```

---

## 4. 团队推广策略

### 4.1 逐步推广计划

| 阶段 | 时长 | 目标 | 活动 |
|------|------|------|------|
| 试点 | 2 周 | 2-3 名资深工程师 | 收集高频场景，调优规则集 |
| 小团队 | 4 周 | 1 个数据小组（5-8 人） | 建立最佳实践，整理 FAQ |
| 全量 | 持续 | 所有数据工程师 | 纳入 CI/CD 流程，设为必备工具 |

### 4.2 培训材料建议

1. **30 分钟上手工作坊** — 现场演示 quick-start 全流程
2. **Prompt 写作指南** — 基于团队实际场景的 Prompt 模板库
3. **审查规则解读** — 每条规则的背景与修复示例
4. **内部 FAQ** — 收集实际使用中的问题

### 4.3 反馈收集机制

```bash
# 1. 在审查报告中嵌入反馈入口
# 2. 定期组织回顾会议（每月）
# 3. 维护 team-config/ 的 CHANGELOG
# 4. 设置 Slack/企业微信反馈频道
```

---

## 5. 安全与合规

### 5.1 API Key 管理

```bash
# ✅ 推荐：环境变量 + 密钥管理服务
export ANTHROPIC_API_KEY=$(vault read -field=key secret/llm/anthropic)

# ✅ 推荐：.env 文件 + .gitignore 保护
# 确保 .env 在 .gitignore 中
echo ".env" >> .gitignore

# ❌ 禁止：硬编码在代码中
# ❌ 禁止：提交到 Git
```

### 5.2 代码隐私注意事项

| 风险 | 缓解措施 |
|------|----------|
| 代码发送到 LLM API | 选择支持零数据保留的 API（Anthropic API 默认不训练） |
| 敏感字段泄露 | 配置脱敏规则，审查前自动扫描 |
| 日志泄露 | 配置日志脱敏，`~/.pi/logs/` 目录权限设为 600 |
| 私有化部署 | 配合 OpenAI 兼容的自部署模型（vLLM/Ollama），数据不出内网 |

### 5.3 审查规则与合规要求对齐

```yaml
# 数据安全合规规则（GDPR / 个人信息保护法）
- id: SEC-E001
  severity: error
  category: security
  title: "SQL 中包含手机号明文输出"
  pattern: "phone|mobile|手机号"
  context: "SELECT|CREATE"
  exclusion: "mask_|encrypt_|sha256|md5"
  suggestion: "敏感字段必须脱敏处理，使用 mask_phone() 或哈希"
```

---

## 6. 用量统计（未来规划）

> **当前版本 (v0.1.0)**: 用量统计功能规划中，预计 v0.3.0 提供。

规划功能：

- **Token 消耗仪表盘** — 按团队/用户/日期的 Token 用量统计
- **Skill 使用热力图** — 各 Skill 的使用频率和场景分布
- **审查覆盖率** — 代码审查执行率与问题修复率
- **成本分析** — 按模型、按团队的 API 费用统计

临时方案：可通过 `~/.pi/logs/` 中的 JSONL 日志手工统计。

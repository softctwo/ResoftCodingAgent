# ResoftCodingAgent 用户手册

## 1. 概述

ResoftCodingAgent 是一款面向数据工程团队的 **AI 驱动的 ETL 开发助手**。它基于 pi-agent 框架扩展，深度集成 Spark、Flink、dbt 和 SQL 等主流 ETL 平台，提供智能代码生成、代码审查、项目初始化等能力。

### 核心能力

| 能力 | 说明 |
|------|------|
| 智能代码生成 | 根据自然语言描述生成 Spark/Flink/dbt/SQL ETL 脚本 |
| 代码审查 | 基于团队编码规范自动审查 ETL 代码，输出分级 Issues |
| 项目初始化 | 快速生成标准化 ETL 项目脚手架 |
| Skill 系统 | 可插拔的平台技能，支持团队自定义扩展 |
| 团队配置共享 | 通过 Git 共享审查规则、命名规范、Skill 注册表 |

### 适用场景

- 数据工程师日常编写 Spark/PySpark ETL 任务
- 实时计算团队开发 Flink SQL 作业
- 分析工程师使用 dbt 进行数据建模
- DBA / 数据开发编写复杂 SQL 脚本
- 团队需要统一代码规范并进行自动化审查
- 新人快速上手 ETL 开发

---

## 2. 快速开始

### 2.1 进入 ETL 交互模式

```bash
resoft chat
```

进入交互式对话界面后，你可以直接描述 ETL 需求：

```
你：帮我写一个 Spark 程序，读取 Kafka 中的用户行为日志，
    解析 JSON，按 user_id 聚合统计每分钟的 PV/UV，
    结果写入 ClickHouse。

ResoftCodingAgent：
好的，我来为你生成 Spark Structured Streaming 程序...

[生成代码 + 解释]
```

### 2.2 代码审查

```bash
# 审查单个文件
resoft review src/etl/user_profile_etl.py

# 审查整个目录
resoft review src/etl/

# 指定审查规则集
resoft review src/etl/ --ruleset spark-strict
```

### 2.3 项目初始化

```bash
# 列出可用模板
resoft init --list

# 使用模板初始化项目
resoft init spark-etl my-new-project
```

---

## 3. 命令详解

### 3.1 `resoft chat` — 交互式 ETL 编程

```
resoft chat [选项]

选项：
  -p, --prompt <text>     直接传入 Prompt（非交互模式）
  -m, --model <name>      指定模型（默认 claude-sonnet-4-20250514）
  --platform <name>       指定 ETL 平台：spark|flink|dbt|sql
  -f, --file <path>       附加文件作为上下文
  --no-review             跳过自动代码审查
  -c, --context <name>    加载已保存的上下文
  -s, --save <name>       保存当前对话上下文
  --max-tokens <n>        最大输出 Token 数（默认 8192）
  -h, --help              显示帮助
```

**交互快捷键：**

| 快捷键 | 功能 |
|--------|------|
| `Ctrl+C` | 中断当前生成 |
| `Ctrl+D` | 退出交互模式 |
| `Ctrl+L` | 清屏 |
| `↑/↓` | 浏览历史命令 |
| `!edit` | 用编辑器打开上次生成的代码 |
| `!save <name>` | 保存会话上下文 |
| `!load <name>` | 加载会话上下文 |
| `!platform <name>` | 切换当前 ETL 平台 |
| `!review` | 审查上次生成的代码 |

**交互示例：**

```
┌─────────────────────────────────────────────────┐
│ ResoftCodingAgent v0.1.0 - ETL 开发模式          │
│ 当前平台: auto  |  模型: claude-sonnet-4         │
│ 输入 !help 查看更多命令                           │
└─────────────────────────────────────────────────┘

you> 创建一个 Flink SQL 任务，从 Kafka topic "orders" 消费数据，
     解析 JSON，过滤出金额 > 100 的订单，写入 MySQL sink 表

agent> [生成 Flink SQL 代码，附说明]
```

### 3.2 `resoft review` — 代码审查

```
resoft review <path> [选项]

选项：
  --ruleset <name>       指定审查规则集
  --platform <name>      指定平台（自动检测或手动指定）
  --format <type>        输出格式：terminal|json|markdown
  --output <path>        输出审查报告到文件
  --severity <level>     最低问题级别：error|warning|info|suggestion
  --max-issues <n>       最大输出问题数（默认 50）
  --context <path>       附加上下文文件
```

**审查输出格式：**

```
📋 代码审查报告: src/etl/user_profile_etl.py
   平台: Spark (PySpark) | 规则集: default
   审查时间: 2025-01-15 14:30:00 | 文件行数: 156

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔴 ERROR (2)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[E001] 行 23: SELECT 语句未指定分区键，可能导致全表扫描
   → 建议: 添加 WHERE partition_date = '${ds}' 条件

[E002] 行 45: 敏感字段 phone 未做脱敏处理
   → 建议: 使用 mask_phone() UDF 或 SHA256 哈希

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🟡 WARNING (5)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[W001] 行 12: SparkSession 变量命名不符合规范 (应为 spark)
   → 期望: spark | 实际: ss

[W002] 行 56: collect() 调用可能导致 Driver OOM
   → 建议: 使用 show() 或 take(n) 替代，或确认数据量可控

...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔵 INFO (3)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[I001] 行 78: 建议为 DataFrame 添加缓存 .cache()
...

🟢 SUGGESTION (1)
...
```

**问题级别说明：**

| 级别 | 图标 | 含义 |
|------|------|------|
| error | 🔴 | 必须修复，会引起线上故障、数据错误或安全漏洞 |
| warning | 🟡 | 建议修复，违反团队规范、性能风险 |
| info | 🔵 | 提示信息，最佳实践建议 |
| suggestion | 🟢 | 可选优化，代码风格建议 |

### 3.3 `resoft init` — 项目初始化

```
resoft init <template> [project-name] [选项]

选项：
  --list                列出所有可用模板
  --dir <path>          指定输出目录（默认当前目录）
  --no-git              不初始化 Git 仓库
  --platform <name>     指定目标平台
```

**可用模板：**

| 模板名 | 平台 | 说明 |
|--------|------|------|
| `spark-etl` | Spark/PySpark | PySpark ETL 项目骨架 |
| `spark-streaming` | Spark Structured Streaming | 流处理项目骨架 |
| `flink-sql` | Flink SQL | Flink SQL 作业项目 |
| `flink-datastream` | Flink DataStream | Flink Java/Scala 项目 |
| `dbt-project` | dbt | dbt 数据建模项目 |
| `sql-pipeline` | SQL | SQL 调度脚本项目 |
| `minimal` | 通用 | 最简项目结构 |

### 3.4 `resoft skill` — Skill 管理

```
resoft skill list                    列出所有 Skill 及状态
resoft skill info <name>             查看 Skill 详细信息
resoft skill enable <name>           启用 Skill
resoft skill disable <name>          禁用 Skill
resoft skill create <name>           创建自定义 Skill 骨架
```

---

## 4. ETL 平台支持说明

### 4.1 Spark / PySpark

**能力边界：**
- PySpark DataFrame API / Spark SQL / RDD API
- Spark Structured Streaming（Kafka、文件源、Delta Lake）
- Spark 配置优化（内存、并行度、Shuffle）
- MLlib 基本用法
- Delta Lake / Iceberg 表操作

**局限性：**
- Scala 代码生成能力弱于 Python
- 复杂 UDAF 需要人工介入
- GPU 调度（RAPIDS）支持有限

### 4.2 Flink SQL

**能力边界：**
- Flink SQL DDL / DML（CREATE TABLE、INSERT INTO）
- 时间窗口（Tumble / Hop / Session）
- Watermark 与延迟处理
- Connector 配置（Kafka、MySQL、HDFS、Elasticsearch）
- Lookup Join、Temporal Join
- Catalog 管理（Hive、JDBC）

**局限性：**
- 复杂 CEP 模式匹配可能需要手动调整
- 状态后端调优仍需人工判断

### 4.3 dbt

**能力边界：**
- dbt 模型（models）编写
- Jinja 模板与宏（macro）
- 增量模型、快照（snapshot）
- 测试（tests）与文档（docs）
- 多数据平台适配（Snowflake、BigQuery、Redshift、Spark）

**局限性：**
- 高度依赖项目现有宏定义
- 跨项目依赖分析需人工确认

### 4.4 SQL

**能力边界：**
- 复杂 SELECT / JOIN / 子查询 / CTE / 窗口函数
- DDL / DML / DCL 语句
- 存储过程与函数（各方言）
- 查询优化建议（索引、分区、执行计划分析）
- Hive / Spark SQL / Presto / ClickHouse 方言识别

**局限性：**
- 执行计划分析依赖 EXPLAIN 输出
- 方言特性覆盖不全面

---

## 5. 最佳实践

### 5.1 如何写好 Prompt

**✅ 好的 Prompt 示例：**

```
我在开发一个 Spark ETL 任务：
- 数据源：Hive 表 dwd.user_behavior_log（分区字段 dt）
- 目标：计算每个用户过去 30 天的活跃天数、总 PV、最常访问类目
- 输出：写入 dws.user_active_summary，分区字段 dt
- 要求：使用 PySpark DataFrame API，处理数据倾斜
```

**❌ 不好的 Prompt：**

```
写一个用户统计
```

**Prompt 编写要点：**

1. **给出明确上下文** — 数据源、目标、字段、分区信息
2. **指定平台** — 说明 Spark / Flink / dbt / SQL
3. **引用文件路径** — 用 `@src/etl/existing_job.py` 让 Agent 参考现有代码
4. **说明约束条件** — 性能要求、编码规范、需要处理的边界情况
5. **分步迭代** — 复杂需求分多次对话，逐层细化

### 5.2 代码审查策略

```bash
# 日常开发中，提交前审查
resoft review src/etl/new_feature.py --severity warning

# CI/CD 集成（严格模式）
resoft review src/ --ruleset production --severity error --format json > review-report.json

# 新人代码辅导
resoft review src/ --severity info --format markdown --output review.md
```

### 5.3 管理项目上下文

```bash
# 保存当前对话上下文
resoft chat
> !save user_profile_context

# 下次加载继续
resoft chat --context user_profile_context
```

### 5.4 Skill 选择策略

| 场景 | 推荐 Skill |
|------|-----------|
| 离线大批量 ETL | spark-etl |
| 实时流处理 | flink-etl |
| 数据建模 / 转换 | dbt-etl |
| 即席查询 / 脚本 | sql-etl |
| 混合场景 | 启用全部，Agent 自动匹配 |

---

## 6. 示例场景

### 6.1 Spark 示例

**输入：**
```
你：写一个 PySpark 程序，从 Hive 表 ods.order_info 读取昨天分区数据，
    关联 dim.product 维度表，计算各品类 GMV Top 10，结果写入 MySQL。

平台: spark
```

**输出（摘要）：**
```python
from pyspark.sql import SparkSession
from pyspark.sql.functions import col, sum as _sum, row_number, desc
from pyspark.sql.window import Window
from datetime import datetime, timedelta

spark = SparkSession.builder \
    .appName("CategoryGMVTop10") \
    .enableHiveSupport() \
    .getOrCreate()

# 计算昨天分区
yesterday = (datetime.now() - timedelta(days=1)).strftime("%Y%m%d")

# 读取订单数据
orders = spark.sql(f"""
    SELECT product_id, category_id, sale_amount
    FROM ods.order_info
    WHERE dt = '{yesterday}'
""")

# 关联维度表
products = spark.table("dim.product").select("product_id", "category_name")

# 计算类目 GMV 并取 Top 10
category_gmv = orders.join(products, "product_id") \
    .groupBy("category_name") \
    .agg(_sum("sale_amount").alias("gmv")) \
    .orderBy(desc("gmv")) \
    .limit(10)

# 写入 MySQL
category_gmv.write \
    .format("jdbc") \
    .option("url", "jdbc:mysql://<host>:3306/report") \
    .option("dbtable", "category_gmv_top10") \
    .option("user", "<user>") \
    .option("password", "<password>") \
    .mode("overwrite") \
    .save()
```

### 6.2 Flink SQL 示例

**输入：**
```
你：Flink SQL 实时计算每分钟各来源渠道的订单量和金额

平台: flink
```

**输出：**
```sql
-- Flink SQL: 分钟级渠道订单统计

CREATE TABLE order_source (
    order_id    STRING,
    channel     STRING,
    amount      DECIMAL(18,2),
    event_time  TIMESTAMP(3),
    WATERMARK FOR event_time AS event_time - INTERVAL '5' SECOND
) WITH (
    'connector' = 'kafka',
    'topic' = 'orders',
    'properties.bootstrap.servers' = 'kafka-broker:9092',
    'format' = 'json'
);

CREATE TABLE channel_stats_sink (
    window_start    TIMESTAMP(3),
    window_end      TIMESTAMP(3),
    channel         STRING,
    order_count     BIGINT,
    total_amount    DECIMAL(18,2),
    PRIMARY KEY (window_start, channel) NOT ENFORCED
) WITH (
    'connector' = 'mysql-cdc',
    'hostname' = 'mysql-host',
    'port' = '3306',
    'username' = 'root',
    'password' = '******',
    'database-name' = 'report',
    'table-name' = 'channel_stats_minute'
);

INSERT INTO channel_stats_sink
SELECT
    TUMBLE_START(event_time, INTERVAL '1' MINUTE) AS window_start,
    TUMBLE_END(event_time, INTERVAL '1' MINUTE)   AS window_end,
    channel,
    COUNT(*)                   AS order_count,
    SUM(amount)                AS total_amount
FROM order_source
GROUP BY TUMBLE(event_time, INTERVAL '1' MINUTE), channel;
```

### 6.3 dbt 示例

**输入：**
```
你：创建 dbt 模型，基于 orders 和 customers 表计算客户 RFM 指标

平台: dbt
```

### 6.4 SQL 示例

**输入：**
```
你：Hive SQL 计算过去 7 天各商品收藏数的日环比增长率

平台: sql
```

---

## 7. 输出格式说明

### 代码块标记

Agent 生成的代码块使用语言标记：

````
```python
# PySpark 代码
```

```sql
-- Flink SQL / Hive SQL / dbt SQL 代码
```

```yaml
# 配置文件
```
````

### Issue 格式

审查输出的每个 Issue 遵循格式：

```
[<CODE>] 行 <N>: <描述>
  → 建议: <具体修复方案>
```

---

## 8. 限制与注意事项

1. **LLM 生成的不确定性** — 同样 Prompt 可能产生不同输出，建议审查后使用
2. **敏感信息** — 避免在 Prompt 中包含真实密码、Token、隐私数据
3. **生产安全检查** — Agent 生成的 SQL 需确认目标表、分区条件正确
4. **Token 限制** — 超长文件（>5000 行）需分段审查或摘要式处理
5. **方言差异** — SQL 方言适配不完美，Hive/Spark SQL/Presto 差异需人工确认
6. **非交互式 CI** — review 命令退出码：0=无 error，1=发现 error，2=工具异常
7. **上下文大小** — 对话轮次建议控制在 50 轮以内，长对话用 `!save` 归档

# ResoftCodingAgent 快速入门指南

> **5 分钟快速上手** — 从安装到生成第一个 ETL 脚本。

---

## Step 1: 安装依赖（60 秒）

```bash
# 确保 Node.js >= 20
node -v

# 克隆项目
git clone https://github.com/ResoftCodingAgent/pi-agent.git
cd pi-agent

# 安装依赖
npm install
npm run build
```

> 遇到网络问题？使用国内镜像：`npm install --registry=https://registry.npmmirror.com`

---

## Step 2: 配置 API Key（30 秒）

```bash
# 设置 Anthropic API Key（推荐）
export ANTHROPIC_API_KEY="sk-ant-api03-your-key-here"

# 或 OpenAI API Key
export OPENAI_API_KEY="sk-your-key-here"

# 验证配置
npm run resoft -- --help
```

---

## Step 3: 进入 ETL 开发模式（10 秒）

```bash
npm run resoft -- chat
```

你将看到欢迎界面：

```
┌─────────────────────────────────────────────────┐
│ ResoftCodingAgent v1.0.0 - ETL 开发模式          │
│ 当前平台: auto  |  模型: claude-sonnet-4         │
│ 输入 !help 查看更多命令                           │
└─────────────────────────────────────────────────┘
```

---

## Step 4: 生成第一个 ETL 脚本（90 秒）

在交互界面中输入你的第一个 Prompt：

```
你：写一个 PySpark 单词计数（WordCount）程序，
    读取文本文件，统计每个单词出现次数，按次数降序输出 Top 100
```

Agent 将生成如下类似代码：

```python
from pyspark.sql import SparkSession
from pyspark.sql.functions import explode, split, col, desc

spark = SparkSession.builder \
    .appName("WordCount") \
    .getOrCreate()

# 读取文本文件
df = spark.read.text("hdfs://path/to/input.txt")

# 分词 + 统计
word_counts = df.select(
    explode(split(col("value"), r"\s+")).alias("word")
).groupBy("word").count().orderBy(desc("count")).limit(100)

# 输出结果
word_counts.show(100, truncate=False)

spark.stop()
```

**💡 试试更复杂的 Prompt：**

```
你：@src/etl/user_profile_etl.py  参考这个文件的代码风格，
    帮我写一个新的 ETL 任务：从 Hive 读取用户行为日志，
    按 user_id + dt 聚合 PV/UV，写入 ClickHouse
```

---

## Step 5: 使用代码审查功能（60 秒）

```bash
# 将上一步的代码保存到文件
cat > /tmp/wordcount.py << 'EOF'
from pyspark.sql import SparkSession
from pyspark.sql.functions import explode, split, col, desc
# ...（粘贴 Agent 生成的代码）
EOF

# 运行代码审查
npm run resoft -- review /tmp/wordcount.py
```

审查输出示例：

```
📋 代码审查报告: /tmp/wordcount.py
   平台: Spark (PySpark) | 规则集: default

🟡 WARNING (1)
[W001] 行 1: 缺少文件头注释（作者、日期、功能说明）

🔵 INFO (2)
[I001] 行 11: 建议添加 try-finally 确保 spark.stop() 被调用
[I002] 行 14: 建议对大输入文件启用自适应查询执行（AQE）

✅ 审查完成：0 Error, 1 Warning, 2 Info
```

---

## Step 6: v1.0 新功能速览（60 秒）

```bash
# CI 模式：自动化代码审查（适用于 CI/CD 流水线）
resoft ci --files "orders.sql" --format json

# 统计总览：查看 Token 用量和成本
resoft stats summary

# 模型价格对比
resoft stats pricing

# 启动 Dashboard（团队可视化面板）
resoft dashboard --port 3456
```

---

## 下一步指引

| 我想…… | 请阅读 |
|--------|--------|
| 深入了解命令和功能 | [用户手册](./user-manual.md) |
| 配置团队规则 | [管理员手册](./admin-guide.md) |
| 部署到生产环境 | [运维手册](./ops-guide.md) |
| 了解安装细节 | [安装手册](./install-guide.md) |
| 解决常见问题 | [FAQ](./faq.md) |
| 查看版本变更 | [变更日志](./CHANGELOG.md) |

---

## 速查卡片

```bash
# 日常高频命令
resoft chat                          # 进入 ETLAI 对话
resoft chat -p "你的需求"            # 单次对话
resoft review src/etl/file.py       # 审查代码
resoft review src/ --severity error # 严格审查
resoft init spark-etl my-project    # 初始化项目
resoft skill list                   # 查看 Skill
resoft skill enable spark-etl       # 启用 Spark Skill

# 交互模式快捷键
!edit       →  编辑上次生成的代码
!save xxx   →  保存上下文
!load xxx   →  加载上下文
!platform spark → 切换到 Spark 平台
!review     →  审查上次代码
Ctrl+C      →  中断
Ctrl+D      →  退出

# v1.0 新命令
resoft ci --files "*.sql" --format json     # CI 流水线审查
resoft stats summary                        # Token 用量总览
resoft stats pricing                        # 模型价格对比
resoft dashboard                            # 启动团队 Dashboard
```

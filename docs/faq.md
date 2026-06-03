# 常见问题 (FAQ)

## 安装类

### Q1: npm install 报网络错误怎么办？

使用国内镜像源：

```bash
npm install --registry=https://registry.npmmirror.com
```

如果配置了企业代理，请确认已正确设置：

```bash
npm config set proxy http://proxy.company.com:8080
npm config set https-proxy http://proxy.company.com:8080
```

---

### Q2: 提示 Node.js 版本不符合要求？

ResoftCodingAgent 要求 Node.js >= 20。检查当前版本：

```bash
node -v
```

如果版本过低：

```bash
# 使用 nvm 升级
nvm install 22
nvm use 22

# 或使用 Homebrew (macOS)
brew install node@22
```

---

### Q3: Python 脚本执行报错？

确认 Python >= 3.9：

```bash
python3 --version
```

某些 Skill 需要额外的 Python 包：

```bash
pip install -r skills/spark-etl/requirements.txt
```

如果同时安装了 Python 2 和 3，确保 `python3` 在 PATH 中，或者设置别名：

```bash
alias python=python3
```

---

## 配置类

### Q4: 如何配置 API Key？支持的模型有哪些？

三种配置方式：

```bash
# 方式 1: 环境变量（推荐）
export ANTHROPIC_API_KEY="sk-ant-api03-..."

# 方式 2: .env 文件
echo 'ANTHROPIC_API_KEY=sk-ant-api03-...' > .env

# 方式 3: 配置文件
# 编辑 ~/.pi/config.yaml
```

支持模型：Claude Sonnet 4（推荐）、Claude Opus 4、GPT-4o、GPT-4 Turbo，以及任何兼容 OpenAI API 的模型。

---

### Q5: 如何配置 HTTP 代理？

```bash
# 环境变量方式
export HTTP_PROXY=http://proxy:8080
export HTTPS_PROXY=http://proxy:8080
export NO_PROXY=localhost,127.0.0.1

# npm 代理
npm config set proxy http://proxy:8080
npm config set https-proxy http://proxy:8080
```

如果代理需要认证：

```bash
export HTTP_PROXY=http://user:pass@proxy:8080
```

---

### Q6: 多个 API Key 如何做负载均衡？

在 `.env` 中配置多个 Key：

```bash
ANTHROPIC_API_KEY=sk-ant-api03-key1
ANTHROPIC_API_KEY_2=sk-ant-api03-key2
ANTHROPIC_API_KEY_3=sk-ant-api03-key3
```

Agent 会自动轮询使用，绕过单 Key 的速率限制。

---

## 使用类

### Q7: 如何选择 ETL 平台？

| 场景 | 推荐平台 |
|------|----------|
| 离线批量 ETL（TB 级数据） | Spark |
| 实时流处理（秒级延迟） | Flink |
| 数据仓库建模与转换 | dbt |
| 即席查询 / 简单脚本 | SQL |

也可以在交互模式中使用 `!platform <name>` 随时切换。

---

### Q8: 怎样写 Prompt 能让 Agent 生成更好的代码？

5 个关键要素：

1. **明确数据源和目标** — 表名、字段、分区信息
2. **指定平台和工具** — Spark/Flink/dbt/SQL
3. **提供参考文件** — `@existing_etl.py` 引用现有代码
4. **说明约束条件** — 性能要求、编码规范、边界情况
5. **分步迭代** — 复杂需求拆成多轮对话

示例：

```
✅ 好:
参考 @src/etl/order_agg.py 的风格，写一个 PySpark ETL：
读取 Hive 表 ods.user_behavior (分区字段 dt)，
计算每个 user_id 的 7 日留存率，写入 dws.user_retention。

❌ 差:
写个留存计算
```

---

### Q9: 代码审查功能怎么用？退出码是什么含义？

```bash
# 基本用法
resoft review file.py

# 仅关注 error 级别
resoft review file.py --severity error

# 输出 JSON 格式（CI 集成）
resoft review file.py --format json

# 退出码：
# 0 — 无 error 级别问题
# 1 — 发现 error 级别问题（CI 阻断）
# 2 — 工具异常（配置问题等）
```

审查结果分为四级：error（必须修复）、warning（建议修复）、info（最佳实践）、suggestion（可选优化）。

---

## Skill 类

### Q10: 如何添加自定义 Skill？

```bash
# 1. 创建骨架
resoft skill create my-skill

# 2. 编辑 Skill 定义
vim skills/custom/my-skill/SKILL.md

# 3. 编写提示词
vim skills/custom/my-skill/prompt.md

# 4. 注册到 skills.yaml
# team-config/skills.yaml:
#   custom-my-skill:
#     enabled: true
#     path: skills/custom/my-skill

# 5. 验证
resoft skill test my-skill

# 6. 提交到团队仓库
git add skills/custom/my-skill team-config/skills.yaml
git commit -m "feat: 添加自定义 Skill"
```

---

### Q11: Skill 不生效怎么办？

逐步排查：

```bash
# 1. 检查 Skill 是否启用
resoft skill list
# 输出应显示 enabled，而非 disabled

# 2. 检查文件是否匹配 auto_trigger 规则
# 例如 spark-etl 的 auto_trigger 是 **/*.py，确认你的文件是 .py 后缀

# 3. 手动指定平台
resoft chat --platform spark

# 4. 查看 Skill 详情和错误信息
resoft skill info spark-etl

# 5. 检查 Python 依赖
pip install -r skills/spark-etl/requirements.txt
```

---

## 安全类

### Q12: 我的代码会不会上传到 LLM 厂商的云端？

这取决于你使用的 API 提供商：

- **Anthropic API**: 截至 2025 年，默认情况下不将 API 数据用于模型训练。具体以 Anthropic 最新隐私政策为准。
- **OpenAI API**: API 数据默认不用于训练（自 2023 年 3 月起）。
- **私有化部署**: 使用 vLLM/Ollama 等自部署模型时，数据完全不出内网。

建议：
- 不要将生产密码、Token 写入 Prompt
- 敏感项目配置私有化模型端点
- 定期审查 `~/.pi/logs/` 中的日志内容

---

### Q13: API Key 如何安全存储？

安全优先级：

1. **环境变量**（推荐） — 不持久化在文件中
2. **`.env` 文件 + `.gitignore`** — 确保不提交到 Git
3. **密钥管理服务** — HashiCorp Vault / AWS Secrets Manager
4. **`~/.pi/config.yaml`** — 设置文件权限 `chmod 600`

**永远不要**将 API Key 硬编码在代码或配置文件中提交到 Git 仓库。

---

## 团队类

### Q14: 多人如何共享配置？

```bash
# 1. 将 team-config/ 建立为独立 Git 仓库
cd team-config
git init
git remote add origin git@gitlab:team/etl-team-config.git
git push -u origin main

# 2. 团队成员克隆后创建符号链接
ln -s /path/to/team-config ./team-config

# 3. 拉取最新配置
cd team-config && git pull
```

---

### Q15: 规则冲突怎么办？

如果团队成员的规则与全局规则冲突：

1. **优先级**: 本地规则 > 团队规则 > 默认规则
2. **显式指定规则集**: `resoft review file.py --ruleset my-rules`
3. **规则 ID 唯一性**: 不同规则集使用不同 ID 前缀避免冲突
4. **团队沟通**: 在规则的 `description` 中说明制定原因，方便讨论

---

## 性能类

### Q16: Agent 响应太慢怎么办？

```bash
# 1. 使用更快的模型
resoft chat --model claude-sonnet-4-20250514   # Sonnet 比 Opus 快

# 2. 减少上下文
!compact            # 压缩会话上下文
!clear              # 清除重新开始

# 3. 降低 max_tokens
# 编辑 ~/.pi/config.yaml: max_tokens: 4096

# 4. 检查网络延迟
curl -w "@curl-format.txt" -o /dev/null -s https://api.anthropic.com
```

---

### Q17: Token 消耗太多怎么办？

```bash
# 1. 简化 Prompt — 去掉不必要的背景描述
# 2. 使用 !compact 压缩长对话
# 3. 审查大文件时分片：resoft review --chunk-size 1000
# 4. 查看 Token 用量统计
grep "total_tokens" ~/.pi/logs/api-calls-*.jsonl | jq .usage.total_tokens
```

---

## 故障类

### Q18: Agent 不响应了？

1. `Ctrl+C` 中断当前请求
2. 检查网络连通性
3. 检查 API Key 是否过期
4. 查看错误日志：`cat ~/.pi/logs/errors-$(date +%Y-%m-%d).jsonl | tail -10`
5. 重启终端会话

---

### Q19: 生成的代码不对怎么办？

1. **补充约束条件** — 更具体地描述需求、提供参考文件
2. **使用代码审查** — `resoft review generated_code.py` 自动发现问题
3. **迭代式改进** — 在对话中告知 Agent 哪里不对，要求修正
4. **换个模型试试** — `resoft chat -m claude-opus-4-20250514` 用更强的模型

Agent 生成的是**辅助代码**，最终需要人工审查确认后才能用于生产。

---

### Q20: 安装后 `resoft` 命令找不到？

```bash
# 方式 1: 使用 npm run 调用
npm run resoft -- --help

# 方式 2: 全局链接
npm link
resoft --help

# 方式 3: 添加别名
echo 'alias resoft="npm run resoft --"' >> ~/.zshrc
source ~/.zshrc
```

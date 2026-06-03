# ResoftCodingAgent 运维手册

## 1. 概述

本文档面向负责 ResoftCodingAgent 日常运维的 SRE / DevOps 工程师，涵盖监控、备份、性能优化、日志管理、故障排查和升级指南。

---

## 2. 日常运维

### 2.1 监控仓库更新

```bash
# 进入部署目录
cd /opt/pi-agent

# 拉取上游更新
git fetch upstream
git log upstream/main --oneline -10   # 查看近期更新

# 合并更新
git merge upstream/main

# 重新安装依赖（如有变更）
npm install

# 重启常驻服务（如有）
pm2 restart pi-agent
```

**建议设置 Cron 定期检查：**

```bash
# crontab -e
# 每天凌晨 3 点检查更新
0 3 * * * cd /opt/pi-agent && git fetch upstream && git log HEAD..upstream/main --oneline | wc -l
```

### 2.2 依赖更新

```bash
# 查看过期依赖
npm outdated

# 安全更新（仅 patch 版本）
npm update

# 检查安全漏洞
npm audit

# 修复安全漏洞
npm audit fix

# 重大版本升级（需在测试环境先行验证）
npm install package@latest
```

**依赖更新 Checklist：**
- [ ] 在测试环境先行验证
- [ ] 运行 `npm test` 确保测试通过
- [ ] 运行 `resoft skill test --all` 验证所有 Skill
- [ ] 更新 CHANGELOG 记录变更
- [ ] 通知团队成员

### 2.3 Skill 更新流程

```bash
# 1. 拉取最新的 team-config（含 Skill 注册表）
cd team-config && git pull origin main && cd ..

# 2. 同步 Skill 脚本
resoft skill sync

# 3. 验证 Skill 可用性
resoft skill test --all

# 4. 如发现异常，回滚
cd team-config && git reset --hard HEAD~1 && cd ..
resoft skill sync
```

---

## 3. 备份与恢复

### 3.1 team-config/ 备份

`team-config/` 目录应纳入 Git 管理，天然具备版本备份能力。

```bash
# 设置自动推送（post-commit hook）
cat > team-config/.git/hooks/post-commit << 'EOF'
#!/bin/sh
git push origin main 2>&1 | logger -t "team-config-backup"
EOF
chmod +x team-config/.git/hooks/post-commit

# 定期全量备份到远程存储
# crontab 示例：每周日凌晨备份
0 0 * * 0 tar -czf /backup/team-config-$(date +\%Y\%m\%d).tar.gz \
  /opt/pi-agent/team-config/ && \
  scp /backup/team-config-*.tar.gz backup-server:/data/backups/
```

### 3.2 会话记录备份

pi-agent 的会话记录以 JSONL 格式存储在 `~/.pi/logs/`。

```bash
# 日志位置
ls ~/.pi/logs/
# conversations-2025-01-15.jsonl
# reviews-2025-01-15.jsonl
# errors-2025-01-15.jsonl

# 备份脚本
#!/bin/bash
LOG_DIR="$HOME/.pi/logs"
BACKUP_DIR="/backup/pi-logs"
mkdir -p "$BACKUP_DIR"
find "$LOG_DIR" -name "*.jsonl" -mtime +30 -exec gzip {} \; \
  -exec mv {}.gz "$BACKUP_DIR/" \;
```

---

## 4. 性能优化

### 4.1 Token 用量控制

| 配置项 | 位置 | 默认值 | 建议 |
|--------|------|--------|------|
| `max_tokens` | `~/.pi/config.yaml` | 8192 | 简单任务 4096，复杂任务 16384 |
| `context_window` | `~/.pi/config.yaml` | 100000 | 根据模型能力调整 |
| `temperature` | `~/.pi/config.yaml` | 0.7 | 代码生成建议 0.3 |
| `max_conversation_turns` | `~/.pi/config.yaml` | 50 | 控制单会话长度 |

```yaml
# ~/.pi/config.yaml 示例
model:
  default: "claude-sonnet-4-20250514"
  max_tokens: 8192
  temperature: 0.3          # 代码生成低温度，减少随机性

limits:
  max_conversation_turns: 50
  max_file_review_lines: 5000
  warn_token_threshold: 50000    # 单会话 Token 警告阈值
```

### 4.2 上下文长度配置

```bash
# 交互模式中手动控制
> !compact          # 压缩当前上下文（保留关键信息）
> !context-size     # 查看当前上下文大小
> !clear            # 清除上下文重新开始

# 审查模式分片处理大文件
resoft review large_file.py --chunk-size 1000
```

### 4.3 并发会话管理

```bash
# 限制同时运行的会话数
# ~/.pi/config.yaml
limits:
  max_concurrent_sessions: 3

# 查看活跃会话
resoft session list

# 终止指定会话
resoft session kill <session-id>
```

---

## 5. 日志管理

### 5.1 日志位置

| 日志类型 | 路径 | 说明 |
|----------|------|------|
| 会话日志 | `~/.pi/logs/conversations-YYYY-MM-DD.jsonl` | 所有对话记录 |
| 审查日志 | `~/.pi/logs/reviews-YYYY-MM-DD.jsonl` | 代码审查记录 |
| 错误日志 | `~/.pi/logs/errors-YYYY-MM-DD.jsonl` | 错误和异常 |
| API 调用日志 | `~/.pi/logs/api-calls-YYYY-MM-DD.jsonl` | LLM API 调用详情 |
| 调试日志 | `~/.pi/logs/debug.log` | 详细调试信息 |
| 用量数据 | `~/.resoft/stats/usage.json` | Token/成本统计数据（v1.0） |

### 5.2 日志轮转配置

```bash
# 配置 logrotate（Linux）
cat > /etc/logrotate.d/pi-agent << EOF
$HOME/.pi/logs/*.jsonl {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    notifempty
    create 0600 $USER $USER
}
EOF
```

```bash
# macOS launchd 定时清理
# ~/Library/LaunchAgents/com.resoft.picleanup.plist
```

### 5.3 关键日志分析

```bash
# 统计今日 API 调用次数
cat ~/.pi/logs/api-calls-$(date +%Y-%m-%d).jsonl | wc -l

# 提取最近的错误
cat ~/.pi/logs/errors-$(date +%Y-%m-%d).jsonl | jq '.error' | tail -20

# 统计 Token 用量
cat ~/.pi/logs/api-calls-$(date +%Y-%m-%d).jsonl | \
  jq -r '.usage.total_tokens' | paste -sd+ | bc

# 查找包含特定 Skill 的会话
grep '"skill":"spark-etl"' ~/.pi/logs/conversations-*.jsonl
```

---

## 6. Dashboard 服务管理（v1.0）

### 6.1 启动与停止

```bash
# 启动（前台）
resoft dashboard --port 3456

# 后台运行
nohup resoft dashboard --port 3456 > /var/log/resoft-dashboard.log 2>&1 &

# 停止
pkill -f "resoft dashboard"
```

### 6.2 进程监控

```bash
# 检查 Dashboard 进程
ps aux | grep "resoft dashboard"

# 检查端口占用
lsof -i :3456

# 健康检查
curl -s http://127.0.0.1:3456/api/summary | jq .
```

### 6.3 端口冲突

```bash
# 如果 3456 端口被占用，更换端口
resoft dashboard --port 3457

# 查找占用进程
lsof -i :3456
```

### 6.4 持久化部署（systemd 示例）

```ini
# /etc/systemd/system/resoft-dashboard.service
[Unit]
Description=Resoft Dashboard
After=network.target

[Service]
Type=simple
User=resoft
WorkingDirectory=/opt/pi-agent
ExecStart=/usr/bin/node packages/resoft-coding-agent/dist/dashboard/server.js --port 3456
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now resoft-dashboard
```

---

## 7. 用量数据管理（v1.0）

### 7.1 数据位置

```
~/.resoft/stats/
└── usage.json        # JSONL 格式，每次调用追加一行
```

### 7.2 备份

```bash
# 定期备份
cp ~/.resoft/stats/usage.json /backup/resoft-usage-$(date +%Y%m%d).json

# 或者通过 export 导出
resoft stats export --output /backup/resoft-usage-$(date +%Y%m%d).json
```

### 7.3 清理/归档

```bash
# 归档 90 天前的数据
# (通过 jq 过滤并写入新文件，保留最近 90 天)
jq 'select(.timestamp >= "'$(date -d '90 days ago' +%Y-%m-%d)'")' \
  ~/.resoft/stats/usage.json > /tmp/usage-recent.json
mv /tmp/usage-recent.json ~/.resoft/stats/usage.json
```

---

## 8. CI 流水线故障排查（v1.0）

### 8.1 GitHub Actions 常见错误

| 错误 | 原因 | 解决方案 |
|------|------|----------|
| `ANTHROPIC_API_KEY not set` | Secret 未配置 | 在仓库 Settings → Secrets 中添加 |
| `resoft: command not found` | 依赖未安装 | 确保 workflow 包含 `npm ci && npm run build` |
| 审查超时 | 审查文件过多或过大 | 减少 `--files` 范围，添加 `--max-issues` |
| SARIF 上传失败 | 输出格式不匹配 | 确保使用 `--format sarif` |

### 8.2 Pre-commit 钩子冲突

```bash
# 如果钩子与 husky 等冲突，临时禁用
git commit --no-verify -m "..."
# 或永久删除
rm .git/hooks/pre-commit
```

### 8.3 CI 退出码诊断

| 退出码 | 含义 |
|--------|------|
| 0 | 无问题或低于 `--min-severity` |
| 1 | 发现 error 级别问题 |
| 2 | 发现 warning 级别问题（`--fail-on-warning`） |
| 3 | 工具异常 |

---

## 9. 故障排查

### 6.1 Agent 无响应

| 症状 | 可能原因 | 解决方案 |
|------|----------|----------|
| 输入后无回复 | LLM API 超时 | 检查网络、API Key 有效性，增加超时配置 |
| 长时间等待 | Token 量过大 | `Ctrl+C` 中断，`!compact` 压缩上下文 |
| 卡在 spinning | 后台进程挂死 | `Ctrl+C`，检查 `~/.pi/logs/debug.log` |

```bash
# 检查 API 连通性
curl -s https://api.anthropic.com/v1/messages \
  -H "x-api-key: $ANTHROPIC_API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -H "content-type: application/json" \
  -d '{"model":"claude-sonnet-4-20250514","max_tokens":10,"messages":[{"role":"user","content":"ping"}]}'
```

### 6.2 LLM API 调用失败

| 错误码 | 含义 | 解决方案 |
|--------|------|----------|
| 401 | API Key 无效 | 检查环境变量，重新生成 Key |
| 429 | 速率限制 | 降低并发，检查 Tier 限额 |
| 500 | 服务端错误 | 等待后重试，检查 Status Page |
| 503 | 服务过载 | 切换模型或等待恢复 |
| timeout | 请求超时 | 增加超时配置，或简化 Prompt |

### 6.3 Skill 加载失败

```bash
# 检查 Skill 状态
resoft skill list --verbose

# 输出示例：
# spark-etl      enabled   ✓ 正常
# flink-etl      enabled   ✓ 正常
# custom-skill   enabled   ✗ 错误: Python 依赖缺失

# 修复：安装缺失依赖
pip install -r skills/custom/custom-skill/requirements.txt

# 或禁用问题 Skill
resoft skill disable custom-skill
```

### 6.4 常见错误码

| 退出码 | 含义 |
|--------|------|
| 0 | 成功 |
| 1 | 审查发现 error 级别问题 |
| 2 | 工具运行时异常 |
| 3 | 配置错误（API Key 缺失等） |
| 4 | Skill 加载失败 |
| 5 | 网络超时 |
| 6 | 文件路径不存在 |

---

## 10. 升级指南

### 7.1 pi-agent 版本升级

```bash
# 1. 备份当前版本
cd /opt
cp -r pi-agent pi-agent-backup-$(date +%Y%m%d)

# 2. 拉取最新代码
cd pi-agent
git fetch origin
git checkout v0.2.0            # 切换到目标版本 tag

# 3. 更新依赖
npm install

# 4. 运行测试
npm test
resoft skill test --all

# 5. 验证关键功能
resoft --version
resoft skill list
resoft chat -p "ping"          # 快速冒烟测试

# 6. 切换流量（如使用负载均衡）
```

### 7.2 Resoft 扩展升级

```bash
# Resoft 扩展独立升级
resoft self-update              # 检查并升级 CLI
resoft extension update resoft  # 升级核心扩展

# 或通过 npm
npm update pi-agent
```

### 7.3 回滚方案

```bash
# 快速回滚：切换到备份
cd /opt
mv pi-agent pi-agent-failed
mv pi-agent-backup-YYYYMMDD pi-agent

# 或 Git 回滚
cd pi-agent
git checkout v0.1.0             # 回退到稳定版本
npm install

# team-config 回滚
cd team-config
git reset --hard <last-stable-commit>
```

---

## 11. 监控检查清单

```bash
#!/bin/bash
# health-check.sh — ResoftCodingAgent 健康检查

echo "=== ResoftCodingAgent 健康检查 ==="

# 1. 进程检查
echo "[1/8] 检查 Node.js 进程..."
pgrep -f "pi-agent" > /dev/null && echo "  ✓ 运行中" || echo "  ✗ 未运行"

# 2. Dashboard 检查（v1.0）
echo "[2/8] 检查 Dashboard..."
curl -s http://127.0.0.1:3456/api/summary > /dev/null 2>&1 && echo "  ✓ 正常" || echo "  - 未启动"

# 3. API Key 检查
echo "[3/8] 检查 API Key..."
[ -n "$ANTHROPIC_API_KEY" ] && echo "  ✓ 已配置" || echo "  ✗ 未配置"

# 4. 磁盘空间
echo "[4/8] 检查磁盘空间..."
df -h ~/.pi/ | awk 'NR==2{print "  " $4 " 可用"}'

# 5. Skill 检查
echo "[5/8] 检查 Skill..."
npm run resoft -- skill list 2>/dev/null | grep "✗" && echo "  ✗ 有 Skill 异常" || echo "  ✓ 正常"

# 6. 日志大小
echo "[6/8] 日志大小..."
du -sh ~/.pi/logs/ 2>/dev/null || echo "  无日志"

# 7. 用量数据大小（v1.0）
echo "[7/8] 用量数据..."
du -sh ~/.resoft/stats/ 2>/dev/null || echo "  无数据"

# 8. Git 版本
echo "[8/8] 版本信息..."
npm run resoft -- --version 2>/dev/null

echo "=== 检查完成 ==="
```

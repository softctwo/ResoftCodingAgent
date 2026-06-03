# Resoft Coding Agent — Deployment Guide（v1.0）

## Requirements

- **Node.js** >= 20
- **npm** >= 9
- **Git** for team config versioning
- **LLM API key** (OpenAI, Anthropic, DeepSeek, or compatible provider)

## Quick Start

```bash
# 1. Clone and install
git clone https://github.com/softctwo/ResoftCodingAgent.git
cd ResoftCodingAgent
npm install
npm run build

# 2. Configure LLM
export DEEPSEEK_API_KEY="sk-..."
# or
export ANTHROPIC_API_KEY="sk-ant-..."

# 3. Set team config path (optional)
export RESOFT_TEAM_CONFIG="/path/to/team-config"

# 4. Run
npm run resoft chat -p sql -n my-project
```

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `OPENAI_API_KEY` | Yes* | — | OpenAI API key |
| `ANTHROPIC_API_KEY` | Yes* | — | Anthropic API key |
| `RESOFT_TEAM_CONFIG` | No | `../../team-config` | Path to team config directory |
| `RESOFT_MODEL` | No | platform default | Model override (e.g., `gpt-4o`) |
| `RESOFT_LOG_LEVEL` | No | `info` | Log verbosity: debug, info, warn, error |

*At least one LLM provider key is required.

## LLM Configuration

Resoft uses pi-ai's model abstraction. Configure models in `pi-agent`'s configuration:

```yaml
# pi-agent/pilotdeck.yaml (or config file)
model:
  provider: openai
  model: gpt-4o
  temperature: 0.3
  maxTokens: 4096
```

Supported providers: OpenAI, Anthropic, and any OpenAI-compatible endpoint.

## Team Collaboration

### Team Config Structure

```
team-config/
├── rules/
│   ├── sql-rules.yaml      # SQL coding rules
│   ├── spark-rules.yaml    # Spark-specific rules
│   ├── naming-rules.yaml   # Naming conventions
│   └── git-rules.yaml      # Git workflow rules
└── registry/
    └── skills.yaml         # Skill registry
```

### Adding New Rules

1. Create a YAML file in `team-config/rules/`.
2. Define rules with `id`, `description`, `pattern` (regex), `severity`, `suggestion`, and `platforms`.
3. Rules are auto-loaded on next `resoft` invocation.

### Adding New Skills

1. Create `skills/<skill-name>/SKILL.md`.
2. Register in `team-config/registry/skills.yaml`.
3. Set `enabled: true` and appropriate `auto_trigger` and `platform`.

## Directory Structure (Deployed v1.0)

```
resoft-coding-agent/
├── .github/workflows/
│   └── resoft-review.yml         # GitHub Actions 自动审查
├── scripts/
│   └── pre-commit.sh             # Git Pre-commit Hook
├── package.json
├── README.md
├── docs/
│   ├── install-guide.md
│   ├── quick-start.md
│   ├── user-manual.md
│   ├── admin-guide.md
│   ├── ops-guide.md
│   ├── faq.md
│   ├── architecture.md
│   ├── skill-development.md
│   ├── deployment.md
│   └── CHANGELOG.md
├── pi-agent/
│   ├── packages/
│   │   ├── resoft-agent-core/        # Core ETL agent library
│   │   │   └── src/
│   │   │       ├── pipeline/         # CI/CD Reporter (text/json/sarif/checkstyle)
│   │   │       └── stats/            # TokenCounter + CostCalculator
│   │   └── resoft-coding-agent/      # CLI and mode handlers
│   │       └── src/
│   │           ├── dashboard/        # Web Dashboard (server/routes/views)
│   │           └── modes/            # chat/review/ci/template/stats/skill/init
│   └── skills/                       # 15 Skills (4 ETL + 10 community + superpowers)
│       ├── sql/
│       ├── spark/
│       ├── flink/
│       ├── dbt/
│       ├── superpowers/
│       ├── superclaude/
│       └── ...
└── team-config/
    ├── rules/                        # 编码规则集 (SQL/Spark/Naming/Git)
    └── registry/                     # Skill 注册表

## Running in Production

```bash
# Build TypeScript
cd pi-agent && npm run build

# Run
node pi-agent/packages/resoft-coding-agent/dist/cli.js chat -p spark -n prod-etl
```

## GitHub Actions CI/CD Setup（v1.0）

ResoftCodingAgent 内置 GitHub Actions 工作流（`.github/workflows/resoft-review.yml`）：

### 配置步骤

1. 在仓库 Settings → Secrets and variables → Actions 中添加：
   - `DEEPSEEK_API_KEY`（或其他 LLM API Key）

2. 工作流自动在以下事件触发：
   - **Pull Request** 针对 `**.sql`、`**.py`、`**.java`、`**.scala` 文件
   - **Push 到 main** 分支的同类型文件

3. 工作流行为：
   - 检出代码 → 安装依赖 → 构建 → 获取变更 ETL 文件 → 运行审查
   - 审查结果以 JSON 格式输出
   - 发现 error 级别问题时 workflow 标记为失败

### GitLab CI 集成

```yaml
# .gitlab-ci.yml
resoft-review:
  image: node:20
  script:
    - npm ci && npm run build
    - npx resoft ci --files "src/**/*.sql" --format checkstyle > resoft-review.xml
  artifacts:
    reports:
      codequality: resoft-review.xml
```

### Jenkins 集成

```groovy
// Jenkinsfile
stage('Resoft Review') {
  steps {
    sh 'npm ci && npm run build'
    sh 'npx resoft ci --files "src/**/*.py" --format checkstyle -o resoft-review.xml'
  }
}
```

## Dashboard Service Management（v1.0）

### 直接启动

```bash
npm run resoft dashboard                   # 默认 http://127.0.0.1:3456
npm run resoft dashboard --port 8080       # 自定义端口
```

### systemd 服务（生产环境）

```ini
# /etc/systemd/system/resoft-dashboard.service
[Unit]
Description=Resoft Team Dashboard
After=network.target

[Service]
Type=simple
User=resoft
WorkingDirectory=/opt/resoft/resoft-coding-agent/pi-agent
ExecStart=/usr/bin/node packages/resoft-coding-agent/dist/cli.js dashboard --port 3456
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable resoft-dashboard
sudo systemctl start resoft-dashboard
```

### Nginx 反向代理

```nginx
server {
    listen 80;
    server_name dashboard.resoft.internal;
    location / {
        proxy_pass http://127.0.0.1:3456;
        proxy_set_header Host $host;
    }
}
```

## Pre-commit Hook Distribution（v1.0）

```bash
# 安装 hook
ln -sf ../../scripts/pre-commit.sh .git/hooks/pre-commit
chmod +x scripts/pre-commit.sh

# 临时跳过
git commit --no-verify -m "WIP: skip pre-commit check"
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Skills not loading | Check `team-config/registry/skills.yaml` paths |
| Rules not applied | Verify YAML syntax; run `resoft` with `--team-config` flag |
| LLM connection error | Set correct API key; check network/firewall |
| Build errors | Ensure `tsgo` is installed; check `tsconfig.json` extends base |

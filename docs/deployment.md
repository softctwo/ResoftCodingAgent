# Resoft Coding Agent — Deployment Guide

## Requirements

- **Node.js** >= 22
- **npm** >= 9
- **Git** for team config versioning
- **LLM API key** (OpenAI, Anthropic, or compatible provider)

## Quick Start

```bash
# 1. Clone and install
git clone <repo-url> resoft-coding-agent
cd resoft-coding-agent
npm install

# 2. Configure LLM
export OPENAI_API_KEY="sk-..."
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

## Directory Structure (Deployed)

```
resoft-coding-agent/
├── package.json
├── docs/
│   ├── architecture.md
│   ├── skill-development.md
│   └── deployment.md
├── pi-agent/
│   ├── packages/
│   │   ├── resoft-agent-core/       # Core ETL agent library
│   │   └── resoft-coding-agent/     # CLI and mode handlers
│   └── skills/                      # Skill definitions
│       ├── sql/
│       ├── spark/
│       ├── flink/
│       └── dbt/
└── team-config/                     # Team-specific configuration
    ├── rules/
    └── registry/
```

## Running in Production

```bash
# Build TypeScript
cd pi-agent && npm run build

# Run
node pi-agent/packages/resoft-coding-agent/dist/cli.js chat -p spark -n prod-etl
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Skills not loading | Check `team-config/registry/skills.yaml` paths |
| Rules not applied | Verify YAML syntax; run `resoft` with `--team-config` flag |
| LLM connection error | Set correct API key; check network/firewall |
| Build errors | Ensure `tsgo` is installed; check `tsconfig.json` extends base |

---
name: awesome-skills
description: "Directory and navigation guide for discovering skills. Use when looking for a specific capability, browsing available skills, or finding inspiration for new skills."
---

# Awesome Agent Skills: Discovery & Navigation

Your guide to finding, evaluating, and contributing skills in the ResoftCodingAgent ecosystem.

## Skills by Category

### ETL & Data Processing
- **resoft-etl-manager** — ETL pipeline orchestration
- **resoft-sql-analyzer** — SQL optimization and analysis
- **resoft-data-quality** — Data validation and quality checks

### Frontend Development
- **vercel-skills** — React, Next.js, and web quality standards
- **minimax** — Frontend workflow templates (design → component → style → test)

### Backend Development
- **resoft-api-builder** — RESTful API construction patterns
- **superclaude** — Structured command system for backend tasks

### DevOps & Infrastructure
- **composio** — External service integration (GitHub, Slack, databases)

### Documentation
- **resoft-doc-generator** — Automated documentation generation
- **minimax** — Documentation workflow (structure → draft → review → publish)

### Testing & Quality
- **superpowers** — Test-first development and code quality checks
- **anthropic-skills** — Testing patterns and skill design templates

### Planning & Process
- **planning-files** — Markdown-based project planning and tracking
- **context-engineering** — AI context management for long-running tasks

### Skill Engineering
- **antfu-skills** — Advanced skill design patterns
- **anthropic-skills** — Skill templates and best practices

---

## Skills by Platform

| Platform | Skills |
|----------|--------|
| **SQL** | resoft-sql-analyzer, resoft-data-quality |
| **Spark** | resoft-etl-manager |
| **Flink** | resoft-etl-manager |
| **dbt** | resoft-sql-analyzer |
| **React** | vercel-skills, minimax |
| **Next.js** | vercel-skills |
| **Node.js** | resoft-api-builder, superclaude |
| **Python** | superpowers |

---

## Skills by Workflow

| Workflow Phase | Recommended Skills |
|---------------|-------------------|
| **Planning** | planning-files, minimax |
| **Design** | minimax, vercel-skills |
| **Coding** | superpowers, superclaude, vercel-skills |
| **Testing** | superpowers |
| **Reviewing** | superclaude (/review), anthropic-skills |
| **Documenting** | minimax |
| **Deploying** | composio |
| **Debugging** | superclaude (/fix), context-engineering |

---

## How to Search

### By Name
If you know the skill name, check the registry at `team-config/registry/skills.yaml`.

### By Tag
Skills are tagged in their descriptions. Search for keywords:
- "test" → superpowers
- "React" / "Next.js" → vercel-skills
- "workflow" → minimax
- "context" → context-engineering, planning-files

### By Platform
Use the platform table above to find skills for your tech stack.

### By Task
Describe your task and the agent will match it against skill descriptions:
- "I need to build a new React component" → vercel-skills + minimax
- "I need to fix a bug" → superclaude + superpowers

---

## Contributing Skills

### Skill Creation Checklist
1. Create a new directory under `pi-agent/skills/<skill-name>/`
2. Write `SKILL.md` with proper frontmatter
3. Register in `team-config/registry/skills.yaml`
4. Set appropriate `auto_trigger` and `enabled` flags
5. Test the skill on a real task
6. Collect feedback and iterate

### Naming Conventions
- Lowercase, kebab-case
- Descriptive: prefer `sql-optimizer` over `sql-util`
- Unique: no two skills should have the same name

---

## Rating & Feedback

Skills are evaluated on:
1. **Trigger accuracy** — Does it activate when it should? Stay quiet when it shouldn't?
2. **Task completion rate** — Do tasks complete faster with the skill?
3. **Error reduction** — Fewer rework cycles?
4. **Clarity** — Clear instructions with examples?

If a skill isn't working well, update its description, narrow its scope, or retire it.

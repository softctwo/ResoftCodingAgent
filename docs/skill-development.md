# Skill Development Guide

## What is a Skill?

A Skill is a markdown file (`SKILL.md`) that provides AI agent context about a specific technology, framework, or domain. When enabled, the skill content is injected into the agent's context, guiding it to follow best practices and conventions.

## Directory Structure

```
skills/
├── <skill-name>/
│   ├── SKILL.md              # Required: main skill definition
│   ├── references/           # Optional: additional reference docs
│   │   ├── guide-1.md
│   │   └── guide-2.md
│   └── scripts/              # Optional: helper scripts
│       └── validator.py
```

## SKILL.md Format

```markdown
---
name: my-skill-name
description: >
  Description that the system uses to decide when to activate this skill.
  Be specific about when this skill is relevant.
---

# Skill Title

## Section 1
Content with code examples, best practices, patterns.

## Section 2
More guidelines.

## References
- Reference 1: `references/guide-1.md`
- Script: `scripts/my-script.py`
```

### Frontmatter Fields

| Field | Required | Description |
|-------|----------|-------------|
| `name` | Yes | Unique skill identifier (kebab-case) |
| `description` | Yes | When to use this skill — used for auto-activation matching |

## Development Workflow

1. **Create directory**: `mkdir -p skills/my-new-skill/references`
2. **Write SKILL.md**: Start with frontmatter, then write comprehensive guidance.
3. **Add references**: Any supplementary documentation goes in `references/`.
4. **Add scripts** (optional): Python/Bash helper scripts go in `scripts/`.
5. **Register in team config**: Add to `team-config/registry/skills.yaml`.
6. **Test**: Run `resoft chat -p <platform>` and verify the skill is activated.

## Loading Mechanism

1. Pi-agent reads `team-config/registry/skills.yaml` on startup.
2. Skills marked `enabled: true` are loaded.
3. When the conversation context matches a skill's description (via embedding or keyword match), the SKILL.md content is injected.
4. The `auto_trigger` flag determines if the skill is auto-loaded or manually invoked.

## Best Practices

1. **Be specific in descriptions**: The description determines when the skill activates.
2. **Use code examples**: Concrete examples are more effective than abstract rules.
3. **Keep focused**: One skill per technology/domain, max ~500 lines.
4. **Layer with references**: Put extended guides in `references/` to keep SKILL.md concise.
5. **Version your skills**: Document changes in comments or commit messages.
6. **Test with real prompts**: Verify that the skill activates for the right queries.
7. **Include anti-patterns**: Show what NOT to do alongside correct patterns.
8. **Cross-reference skills**: Mention related skills where appropriate.

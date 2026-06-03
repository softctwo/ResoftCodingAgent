---
name: antfu-skills
description: "Advanced skill design patterns from expert developers. Use as reference for building high-quality, reusable skills and learning skill engineering best practices."
---

# Antfu Skills: Advanced Skill Design Patterns

Expert-level patterns for building high-quality, reusable skills. Apply these when designing new skills or improving existing ones.

## Skill Design Principles

### Single Responsibility
A skill should do one thing and do it well. If a skill description needs an "and," consider splitting it.

❌ **Too broad:** "Write code, review it, and deploy it"
✅ **Focused:** "Code review with security, performance, and style checks"

### Composable
Skills should work together like Unix pipes. The output of one skill should be usable by another.

Example chain:
```
/analyze → identifies performance issues
/optimize → applies fixes based on analysis
/test → verifies fixes don't break anything
```

### Testable
Every skill should have clear success criteria. After applying a skill, ask:
- Did the output match the expected format?
- Did the task complete faster than without the skill?
- Were there fewer errors or rework steps?

---

## Advanced Patterns

### Conditional Triggers
Skills can trigger based on task characteristics:

```yaml
triggers:
  - files_changed: ["*.tsx", "*.jsx"]
  - keywords: ["component", "React", "UI"]
  - task_type: ["feature", "refactor"]
```

Implementation: Use the description field aggressively. The agent decides whether to activate based on matching the description to the current task.

### Chained Skills
Define explicit handoffs between skills:

```
Planning skill → produces plan.md
Implementation skill → reads plan.md, produces code
Review skill → reads code, produces review comments
```

### Parameterized Workflows
Skills can accept parameters through the task description:

```
/optimize --target bundle-size --budget 200KB
/feature --template fullstack --stack nextjs-prisma
```

The agent extracts parameters from the user's request and applies the relevant template.

---

## Developer Experience Patterns

### Progressive Disclosure
Show the most common path first, then reveal advanced options.

```markdown
## Quick Start
1. Run the analyzer
2. Apply the top suggestion
3. Verify it works

## Advanced Usage
- Custom thresholds
- Ignore patterns
- Baseline comparisons
```

### Sensible Defaults
Skills should work immediately with zero configuration.

```yaml
defaults:
  test_framework: vitest  # but allow jest override
  lint_rules: strict      # but allow relaxed
  coverage_target: 80     # but allow per-project
```

### Clear Error Messages
When a skill can't complete, explain why and suggest next steps.

❌ "Failed"
✅ "Test framework not detected. Run `npm install -D vitest` or specify `framework: jest` in config."

---

## Performance

### Lazy Loading
Only load skill content when triggered. Keep the description short (one line) and the body comprehensive.

### Caching
Cache intermediate results that don't change between runs:
- Project configuration
- Package manager lock files
- Lint/formatter configs

### Incremental Execution
When a skill runs multiple times, only re-run the parts that changed.

---

## Anti-Patterns to Avoid

- **Over-triggering:** A skill that activates on every message is noise, not help
- **Too broad:** "Help with coding" — the agent already does this
- **Context pollution:** Skill bodies loaded into every session bloat the context window
- **Outdated references:** Skills referencing deprecated APIs or old framework versions
- **No exit condition:** Skills that never produce a clear "done" state
- **Duplicate coverage:** Two skills that describe the same workflow differently

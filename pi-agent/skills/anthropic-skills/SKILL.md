---
name: anthropic-skills
description: "Reference examples and patterns from Anthropic's official skill library. Use as templates for creating custom skills, or learn best practices for skill design."
---

# Anthropic Official Skills: Patterns & Templates

Learn skill design from Anthropic's official skill library. Apply these patterns when creating or improving skills.

## What Makes a Good Skill

A good skill is:

1. **Triggered aggressively** — The description should be "pushy" so it activates when relevant. Use phrases like "Use when..." and be specific about conditions.
2. **Self-contained** — The skill should provide everything the agent needs without requiring external lookups.
3. **Action-oriented** — It tells the agent "what to do" not "what to know."
4. **Scoped** — Narrow enough to be reliably useful, broad enough to cover a meaningful task.
5. **Testable** — You should be able to verify whether following the skill produced better results.

## Skill Structure

```yaml
---
name: skill-name            # lowercase, kebab-case, unique
description: "…"            # one line, pushy, with trigger conditions
---

# Title

Brief overview of what the skill does.

## Section 1: Core Workflow

Step-by-step instructions the agent should follow.

## Section 2: Examples

Show input → expected output patterns.

## Section 3: Edge Cases

Common pitfalls and how to handle them.
```

## When to Auto-Trigger vs Manual

| Strategy     | When to Use                                      |
|-------------|--------------------------------------------------|
| Auto-trigger | The skill applies to a broad class of tasks (e.g., "when writing code") |
| Manual       | The skill is specialized and would clutter normal workflow (e.g., "when doing a major version migration") |

Auto-trigger skills should have very clear descriptions so the agent only invokes them when truly relevant.

## Example Patterns

### Code Review Skill
- Check for security issues (SQL injection, XSS, hardcoded secrets)
- Verify error handling coverage
- Review naming conventions and clarity
- Suggest performance improvements
- Output: line-by-line feedback with severity

### Refactoring Skill
- Identify code smells: long functions, deep nesting, duplicate code
- Apply safe refactorings: extract function, rename, simplify conditionals
- Verify tests remain green after each refactoring step
- Commit between each logical change

### Testing Skill
- Determine test strategy: unit, integration, or E2E
- Write failing test first
- Implement minimal code
- Verify all tests pass
- Consider edge cases: null, empty, boundary, concurrent

## Skill Versioning and Maintenance

- **Version in git**, not in the skill file itself
- **Review skills quarterly** — are they still accurate? Still triggering appropriately?
- **Retire, don't patch** — If a skill becomes obsolete, remove it entirely rather than adding "deprecated" notes
- **Measure effectiveness** — Track how often skills trigger and whether tasks complete faster with them

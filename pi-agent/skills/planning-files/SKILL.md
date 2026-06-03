---
name: planning-files
description: "Use Markdown files to track plans, progress, and project context. Use for long-running projects, multi-step tasks, or collaborative work where context matters."
---

# Planning with Files: Persistent Project Context

Use Markdown files to maintain project context across sessions, track multi-step plans, and document decisions.

## File Structure

Create these files in a `plans/` or `.pilotdeck/` directory:

```
project/
├── plan.md        # The master plan: what we're building and why
├── progress.md    # Current status and next steps
├── decisions.md   # Architecture decisions log
└── context.md     # Project context and conventions
```

### plan.md — Master Plan

**When to create:** At project start or when undertaking a major feature.

**Format:**
```markdown
# Project Plan: [Name]

## Goal
One-sentence description of what success looks like.

## Steps
1. [Step 1 description] — [status: todo/in-progress/done]
2. [Step 2 description]
   - Sub-step 2a
   - Sub-step 2b
3. [Step 3 description]

## Dependencies
- [External API / library / team]

## Risks
- [Risk] — Mitigation: [plan]
```

### progress.md — Progress Tracker

**When to update:** After every significant task completion.

**Format:**
```markdown
# Progress: [Project Name]

## Current Status: [Phase N]

### Completed
- [x] Task A — 2025-01-15
- [x] Task B — 2025-01-16

### In Progress
- [ ] Task C — Started 2025-01-17
  - Subtask C1: in progress
  - Subtask C2: blocked by API key

### Next Up
- [ ] Task D
- [ ] Task E

## Blockers
- Blocker 1: [description] — Owner: [name]
```

### decisions.md — Decision Log

**When to update:** Whenever you make a non-obvious choice.

**Format:**
```markdown
# Decision Log

## 2025-01-15: Use PostgreSQL over MongoDB
- **Decision:** PostgreSQL
- **Rationale:** Need ACID transactions for payment processing
- **Alternatives considered:** MongoDB (rejected: no transactions at the time), MySQL (rejected: team preference for Postgres)
- **Impact:** Requires ORM setup, migration strategy

## 2025-01-16: Adopt Vitest over Jest
- **Decision:** Vitest
- **Rationale:** Faster, native ESM, better Vite integration
- **Alternatives:** Jest (rejected: slower config), Mocha (rejected: less ecosystem)
```

### context.md — Project Context

**When to update:** Onboarding new contributors or when conventions change.

**Format:**
```markdown
# Project Context

## Tech Stack
- Frontend: Next.js 14, Tailwind, React Query
- Backend: Node.js, Fastify, Prisma
- Database: PostgreSQL 16

## Conventions
- Commit messages: Conventional Commits
- Branch naming: `feature/`, `fix/`, `chore/`
- Code style: Prettier + ESLint (config in repo)

## Key Patterns
- API routes use service → controller → route pattern
- Components use composition, no inheritance
- State management: server state → React Query, client state → Zustand
```

## Context Management

### What to Keep
- Active decisions and their rationale
- Current blockers and their owners
- Non-obvious conventions
- Architecture diagrams references

### What to Archive
- Completed steps (move to `progress.md` completed section)
- Outdated decisions (strikethrough with date)
- Resolved blockers (remove after verification)

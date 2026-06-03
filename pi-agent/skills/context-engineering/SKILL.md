---
name: context-engineering
description: "Manage AI context effectively: what to remember, what to summarize, when to reset. Use for complex multi-turn conversations and large codebases to prevent context drift."
---

# Context Engineering: AI Context Management

Prevent context drift and maximize effective token usage in long-running tasks and large codebases.

## Context Budget Management

### Token Awareness
- Most models have a context window of 128K–200K tokens
- Your effective context is what fits after system prompts, tool definitions, and conversation history
- A typical code file is 500–2000 tokens; a 30-minute conversation can reach 30K–50K tokens
- **Rule of thumb:** Keep working context under 60% of the model's max to leave room for tool outputs

### Budget Allocation

| Priority | Content Type | Budget |
|----------|-------------|--------|
| Critical | Current task, target file, error messages | 40% |
| Important | Related files, project conventions, recent decisions | 30% |
| Useful | Documentation references, past attempts, examples | 20% |
| Noise | Old conversations, irrelevant files, duplicates | 0% — drop it |

---

## Summarization Strategies

### Progressive Summarization
1. **First pass:** Note key decisions and outcomes (1–2 sentences)
2. **Second pass:** Capture rationale and alternatives considered
3. **Third pass:** Preserve only if foundational to future decisions

### Hierarchical Summary
```markdown
## Session Summary: Payment Integration
- **Goal:** Integrate Stripe checkout
- **Completed:** Webhook handler, checkout session creation, error handling
- **Decisions:** Use Stripe Checkout (not Elements) for faster MVP
- **Key files:** src/payments/stripe.ts, src/webhooks/stripe/route.ts
- **Blockers:** None
```

### Selective Retention
Keep only what a future agent needs to continue the work.

**Keep:**
- Active decisions and their rationale
- Current blockers
- Non-obvious implementation details
- File paths being worked on

**Drop:**
- Debugging dead ends
- Failed approaches (unless instructive)
- Tool call logs and raw outputs
- Conversation about unrelated topics

---

## When to Reset Context

### Reset Indicators
- Agent starts repeating previously rejected approaches
- Task scope has shifted to an entirely new feature
- Conversation exceeds 50+ turns without clear progress
- Token usage approaching model limits

### Reset Procedure
1. Write a summary using the hierarchical format above
2. Save summary to a context file (`.pilotdeck/context/session-N.md`)
3. Start a new session, loading only the summary and target files
4. Verify the agent understands the current state before continuing

---

## File-Level Context Tracking

```markdown
# Active Files
- src/api/users.ts (read, modified line 45–78)
- src/types/user.ts (read, not modified)
- tests/users.test.ts (created, needs review)
```

Update this after every significant file operation. Helps avoid re-reading unchanged files.

---

## Git-Based Context

Use git for efficient context gathering:

```bash
git diff HEAD           # What changed in this session
git log --oneline -5    # Recent history
git blame <file>        # Who to ask about a file
git show <commit>       # Past decision context
```

---

## Relevance Filtering

Ask these questions before including content in a session:

1. **Will this affect the next action?** If no, summarize and archive.
2. **Is this already known?** If yes, don't repeat it.
3. **Is this specific to the task?** Generic advice belongs in skills, not conversation.
4. **Could this be replaced by a file reference?** Point to the file instead of pasting it.

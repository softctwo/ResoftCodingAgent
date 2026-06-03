---
name: composio
description: "Connect to external tools and services: GitHub, Notion, Slack, databases, APIs. Use when the task requires interacting with external systems beyond code generation."
---

# Composio Skills: External Service Integration

Connect to external tools and services for end-to-end development workflows that go beyond code generation.

## GitHub Integration

### Pull Requests
- Create PRs with structured descriptions (what, why, how, testing)
- Review PRs with inline comments and suggestions
- Merge strategies: squash for feature branches, merge commit for releases
- Handle merge conflicts with clear resolution steps

### Issues
- Create issues with reproduction steps and expected behavior
- Link issues to PRs with "Closes #123"
- Search issues by label, assignee, milestone
- Comment with code snippets and screenshots

### Code Review
- Check for: logic errors, security issues, performance concerns, missing tests
- Use suggestion blocks for small fixes
- Approve or request changes with clear reasoning

### Search
- Search code across repositories by pattern
- Find files by name or content
- Trace function usage and dependencies

---

## Notion Integration

### Documentation
- Create and update technical docs in Notion
- Sync code examples with live Notion pages
- Generate API documentation from code comments

### Project Management
- Query task databases for current sprint items
- Update task status based on PR merges
- Create meeting notes with action items

### Wikis & Knowledge Base
- Search internal wikis for architecture decisions
- Link code to design docs
- Maintain a "new hire" onboarding page

---

## Slack Integration

### Notifications
- Post deployment notifications to team channels
- Alert on failed CI builds with links to logs
- Weekly summaries of merged PRs

### Communication
- Fetch thread context for debugging discussions
- Post code snippets with syntax highlighting
- Create polls for technical decisions

### Incident Response
- Create incident channels programmatically
- Post status updates during incidents
- Generate post-mortem summaries

---

## Database Integration

### Query
- Run read-only queries for analysis
- Explain query plans for performance tuning
- Sample data for testing

### Schema Analysis
- Compare schema across environments
- Generate migration scripts
- Detect missing indexes and constraints

### Migration
- Create migration files with up/down methods
- Verify migration safety (no data loss, no locks)
- Rollback plans for each migration

---

## API Integration

### REST APIs
- Generate typed API clients from OpenAPI specs
- Test endpoints with curl/httpie
- Handle pagination, rate limiting, and retries

### GraphQL
- Explore schemas with introspection queries
- Generate typed queries and mutations
- Optimize with fragment colocation and persisted queries

### Webhooks
- Implement webhook handlers with signature verification
- Handle idempotency with idempotency keys
- Queue and retry failed webhook deliveries

---

## Tool Selection Guide

| Task | Tool |
|------|------|
| Review a PR | GitHub |
| Look up an error in internal docs | Notion |
| Notify team of deployment | Slack |
| Analyze slow query | Database |
| Call a third-party service | API integration |
| Search code across org | GitHub search |
| Update sprint board | Notion |
| Debug production issue with team | Slack thread |

# Resoft Coding Agent — Architecture

## Overview

Resoft Coding Agent is a company-level AI coding assistant built on top of **pi-agent**, specialized for **Data ETL development scenarios**. It extends pi-agent's general-purpose agent framework with ETL-specific hooks, rules engines, skills, and a CLI.

## Architecture Layers

```
┌─────────────────────────────────────────┐
│           User Interface                 │
│  CLI (resoft chat/review/init/skill)    │
│  Commander.js + Node.js runtime         │
├─────────────────────────────────────────┤
│        resoft-coding-agent              │
│  Main dispatcher, mode handlers         │
│  Team config loader, extensions         │
├─────────────────────────────────────────┤
│         resoft-agent-core               │
│  ResoftAgent class, hook chains          │
│  ETL context transforms, ETL tools       │
│  Platform-aware system prompts           │
├─────────────────────────────────────────┤
│         pi-agent (foundation)           │
│  Agent, Tool, Hooks, Context, TUI       │
├─────────────────────────────────────────┤
│            Skills & Rules               │
│  SKILL.md files, reference docs,        │
│  scripts, YAML rule definitions         │
└─────────────────────────────────────────┘
```

## Core Modules

### `@resoft/agent-core`
- **Types** (`types.ts`): ETLPlatform, Issue, CodingRule, hooks, agent config, project context, skill metadata.
- **Hooks** (`hooks/`): Before/after tool-call hook chains, security check (bash/exec guard), SQL regex review, format checking.
- **Context** (`context/`): Platform-specific system prompts (Spark, Flink, dbt, SQL), context transform injection, project context builder, platform auto-detection.
- **Tools** (`tools/`): ETL-specific tools — read/write ETL files, SQL format, SQL validate, project analysis, data lineage.
- **Agent** (`agent.ts`): ResoftAgent class wraps pi's Agent with default rules, hooks, and tools.

### `@resoft/coding-agent`
- **CLI** (`cli.ts`): Commander.js-based CLI with `chat`, `review`, `init`, `skill` commands.
- **Main** (`main.ts`): Dispatcher that loads config and routes to mode handlers.
- **Modes** (`modes/`): Chat (interactive REPL), Review (code analysis), Init (project scaffolding).
- **Config** (`config/`): Default config, team config loader with simple YAML parser.
- **Extensions** (`extensions/`): Pi-compatible extensions (ETL review tool, message scanning, commands).

## Data Flow

1. **User invokes** `resoft chat -p spark -n my-project`
2. **CLI** parses args, passes to `main()` dispatcher
3. **Main** loads team config (rules YAML, skills registry)
4. **Chat mode** creates `ResoftAgent` with platform, rules, model
5. **ResoftAgent** initializes by detecting platform, building project context
6. A **context transform** injects the ETL platform prompt + rules summary into messages
7. **Hook chains** run before/after every tool call:
   - **Before**: security check (block dangerous commands)
   - **After**: SQL review (regex patterns), format check
8. **Agent** sends prompts to the LLM, returns tool calls and responses
9. **User** sees streaming output (via TUI in future iterations)

## Extension Mechanisms

Pi-agent supports these extension points:
- **Skills**: SKILL.md files in `pi-agent/skills/`, auto-injected as context
- **Extensions**: TypeScript modules that register tools, event handlers, commands
- **Hooks**: `beforeToolCall` / `afterToolCall` chains for validation and review
- **Context Transforms**: Modify message arrays before sending to LLM
- **Team Config**: YAML rule definitions and skill registries

## Tech Stack

- **Runtime**: Node.js 22, TypeScript
- **Agent Foundation**: @earendil-works/pi-agent-core, @earendil-works/pi-coding-agent
- **AI**: @earendil-works/pi-ai (model abstraction)
- **CLI**: Commander.js 12
- **Build**: tsgo (TypeScript-native Go-based compiler)
- **Test**: vitest
- **Package**: npm workspaces (`packages/*`)

## Dependencies

```
@resoft/coding-agent
  ├── @resoft/agent-core
  │     ├── @earendil-works/pi-agent-core
  │     └── @earendil-works/pi-ai
  ├── @earendil-works/pi-coding-agent
  ├── @earendil-works/pi-ai
  └── commander
```

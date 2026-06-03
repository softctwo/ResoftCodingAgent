---
name: superclaude
description: "Command menu for common development tasks: analyze code, fix bugs, write features, optimize performance, generate docs. Use when you need structured task execution."
---

# SuperClaude Framework: Structured Command System

Execute structured development tasks through a command-based interface. Each command defines a workflow with clear inputs and expected outputs.

## Command Reference

### /analyze — Code Analysis

**Purpose:** Understand existing code, identify patterns, and surface issues.

**Inputs:**
- Target file(s) or directory to analyze
- Focus area: architecture, security, performance, maintainability

**Output:**
- Summary of code structure
- Identified issues with severity
- Suggested improvements
- Dependency graph (when relevant)

**Example:**
```
/analyze src/services/ --focus security
```

### /fix — Bug Resolution

**Purpose:** Diagnose and fix bugs systematically.

**Inputs:**
- Bug description or error message
- Steps to reproduce
- Relevant files (if known)

**Output:**
- Root cause analysis
- Fix with explanation
- Regression test
- Verification steps

**Example:**
```
/fix TypeError in UserService.createUser — null email field
```

### /feature — Feature Development

**Purpose:** Build new features end-to-end.

**Inputs:**
- Feature description and acceptance criteria
- Design mockups or API specs (if available)
- Target files/modules

**Output:**
- Implementation plan
- Code changes with tests
- Integration verification
- Documentation updates

**Example:**
```
/feature Add password reset flow with email verification
```

### /optimize — Performance Optimization

**Purpose:** Improve performance of existing code.

**Inputs:**
- Target function, component, or endpoint
- Performance baseline (metrics, profiling data)
- Optimization goals

**Output:**
- Bottleneck analysis
- Optimized code
- Before/after benchmarks
- Trade-off discussion

**Example:**
```
/optimize ProductList rendering — 2s load time target
```

### /docs — Documentation Generation

**Purpose:** Generate or update documentation.

**Inputs:**
- Target code/module
- Documentation type: API reference, guide, JSDoc, README

**Output:**
- Generated documentation
- Links to related docs
- Suggestions for additional documentation

**Example:**
```
/docs src/api/ — generate API reference
```

### /review — Code Review

**Purpose:** Review code changes against best practices.

**Inputs:**
- Diff or list of changed files
- Review focus: correctness, style, security, performance

**Output:**
- Summary of findings
- Line-level feedback
- Blocking vs. non-blocking issues
- Overall recommendation (approve / request changes)

**Example:**
```
/review diff from feature/payment-integration --focus security
```

## Best Practices

1. **One command at a time.** Complete the current command before starting another.
2. **Provide context.** The more specific the inputs, the better the output.
3. **Review outputs.** Commands produce results; always verify before committing.
4. **Chain thoughtfully.** Use `/analyze` before `/fix` or `/feature` for informed decisions.
5. **Track in planning files** when commands span multiple turns.

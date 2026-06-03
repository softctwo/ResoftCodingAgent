---
name: superpowers
description: "Write tests before code, run code quality checks, and act like a rigorous engineer. Use when writing new features, fixing bugs, or refactoring — always test-first."
---

# Superpowers: Test-First Engineering

Enforce rigorous engineering discipline. Always write tests before implementation, run quality checks continuously, and maintain a high-quality bar.

## TDD Workflow: Red → Green → Refactor

1. **Red** — Write a failing test that defines the expected behavior.
   - Focus on the "what," not the "how."
   - Test edge cases: null, empty, boundary values, errors.
2. **Green** — Write the minimum code to make the test pass.
   - Don't over-engineer; just make it green.
   - Use inline comments if the implementation is non-obvious.
3. **Refactor** — Clean up both test and implementation code.
   - Extract helpers, improve names, reduce duplication.
   - Tests must stay green after refactoring.

## Test Types

### Unit Tests
- Test a single function, method, or component in isolation.
- Mock external dependencies.
- Run on every code change.

### Integration Tests
- Test how multiple units work together.
- Use real databases, filesystems, or APIs where possible.
- Run before merging to main.

### End-to-End (E2E) Tests
- Test the full user flow from start to finish.
- Simulate real user interactions in a browser or CLI.
- Run on CI/CD before deployment.

## Framework Recommendations

| Language   | Framework | Runner      | Notes                         |
|------------|-----------|-------------|-------------------------------|
| JavaScript | Jest      | jest        | Most popular, great ecosystem |
| TypeScript | Vitest    | vitest      | Fast, native ESM, compatible  |
| Python     | pytest    | pytest      | Parametrize, fixtures, plugins |
| React      | Vitest + RTL | vitest   | React Testing Library         |
| Go         | testing   | go test     | Standard library              |

## Code Quality Checks

Run these after every meaningful change:

```bash
# TypeScript
npx tsc --noEmit          # type-check
npx eslint .              # lint
npx prettier --check .    # format

# Python
mypy .                    # type-check
ruff check .              # lint
black --check .           # format
```

## Pre-Commit Checklist

- [ ] All tests pass (`npm test`, `pytest`, etc.)
- [ ] Type checker passes
- [ ] Linter passes
- [ ] Formatter passes
- [ ] No console.log / debug statements
- [ ] No commented-out code
- [ ] Error cases are handled
- [ ] New public APIs have docstrings/JSDoc
- [ ] Commit message follows conventional commits

## Error Handling Patterns

### Fail Fast
Validate inputs at the boundary and throw early if invalid.

```typescript
function process(data: unknown): Result {
  if (!isValid(data)) throw new ValidationError("Invalid input");
  // ... safe to proceed
}
```

### Result Types
Return success/failure instead of throwing when the caller can recover.

```typescript
type Result<T, E = Error> = { ok: true; value: T } | { ok: false; error: E };
```

### Graceful Degradation
When a non-critical dependency fails, continue with reduced functionality rather than crashing entirely.

### Log and Monitor
Every caught error should be logged with enough context to debug.

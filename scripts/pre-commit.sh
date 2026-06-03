#!/bin/bash
# Resoft Pre-commit Hook
# Install: ln -sf ../../scripts/pre-commit.sh .git/hooks/pre-commit
# Skip:    git commit --no-verify

REPO_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || pwd)

# Get staged ETL files
FILES=$(git diff --cached --name-only --diff-filter=ACM 2>/dev/null | grep -E '\.(sql|py|java|scala)$' || true)

if [ -z "$FILES" ]; then
  echo "✅ Resoft: No ETL files to check."
  exit 0
fi

if [ -z "$DEEPSEEK_API_KEY" ] && [ -z "$ANTHROPIC_API_KEY" ] && [ -z "$OPENAI_API_KEY" ]; then
  echo "⚠️  Resoft: No LLM API key set — skipping review."
  echo "   Set DEEPSEEK_API_KEY, ANTHROPIC_API_KEY, or OPENAI_API_KEY."
  exit 0
fi

CLI_PATH="$REPO_ROOT/pi-agent/packages/resoft-coding-agent/dist/cli.js"
if [ ! -f "$CLI_PATH" ]; then
  echo "⚠️  Resoft: dist not built — run 'npm run build' first."
  exit 0
fi

echo "🔍 Resoft Code Review — checking staged ETL files..."
echo "$FILES" | sed 's/^/  /'
echo ""

cd "$REPO_ROOT/pi-agent" || exit 1

# Run resoft in CI mode
node packages/resoft-coding-agent/dist/cli.js ci \
  --files "$(echo $FILES | tr '\n' ' ')" \
  --format text \
  --min-severity warning \
  --fail-on-error

EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
  echo ""
  echo "❌ Resoft review found issues. Fix them before committing."
  echo "   Or commit with: git commit --no-verify"
  exit 1
fi

echo "✅ Resoft: All checks passed!"
exit 0

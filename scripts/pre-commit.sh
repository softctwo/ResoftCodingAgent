#!/bin/bash
# Resoft Pre-commit Hook
# Install: ln -sf ../../scripts/pre-commit.sh .git/hooks/pre-commit

echo "🔍 Resoft Code Review — checking staged ETL files..."

# Get staged ETL files
FILES=$(git diff --cached --name-only --diff-filter=ACM | grep -E '\.(sql|py|java|scala)$')

if [ -z "$FILES" ]; then
  echo "No ETL files to check. ✅"
  exit 0
fi

echo "Files to review:"
echo "$FILES" | sed 's/^/  /'
echo ""

# Run resoft in CI mode
cd pi-agent || exit 1
DEEPSEEK_API_KEY="${DEEPSEEK_API_KEY:-}" \
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

echo "✅ All checks passed!"
exit 0

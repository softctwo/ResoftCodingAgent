#!/bin/bash
set -e

echo "🚀 ResoftCodingAgent Installer"
echo "=============================="
echo ""

# Check prerequisites
command -v node >/dev/null 2>&1 || { echo "❌ Node.js >= 20 required. Install from https://nodejs.org"; exit 1; }
command -v git >/dev/null 2>&1 || { echo "❌ Git required."; exit 1; }

NODE_VERSION=$(node -v | cut -d'.' -f1 | tr -d 'v')
if [ "$NODE_VERSION" -lt 20 ]; then
  echo "❌ Node.js >= 20 required. Current: $(node -v)"
  exit 1
fi

echo "✅ Node.js $(node -v)"
echo "✅ Git $(git --version | cut -d' ' -f3)"
echo ""

# Determine install directory
INSTALL_DIR="${RESOFT_HOME:-$HOME/.resoft/agent}"
REPO_URL="${RESOFT_REPO:-https://github.com/softctwo/ResoftCodingAgent.git}"

if [ -d "$INSTALL_DIR" ]; then
  echo "📦 Updating existing installation at $INSTALL_DIR..."
  cd "$INSTALL_DIR"
  git pull origin main
else
  echo "📦 Cloning to $INSTALL_DIR..."
  git clone "$REPO_URL" "$INSTALL_DIR"
  cd "$INSTALL_DIR"
fi

echo "📦 Installing dependencies..."
npm install

echo "📦 Building..."
npm run build

echo ""
echo "═══════════════════════════════════════"
echo "  ✅ Installation complete!"
echo ""
echo "  Add to your shell profile (~/.bashrc or ~/.zshrc):"
echo "    alias resoft='node $INSTALL_DIR/pi-agent/packages/resoft-coding-agent/dist/cli.js'"
echo ""
echo "  Configure LLM:"
echo "    export DEEPSEEK_API_KEY='your-key'"
echo ""
echo "  Quick start:"
echo "    resoft chat -p sql"
echo "    resoft review orders.sql"
echo "    resoft stats summary"
echo "    resoft dashboard"
echo ""
echo "  Pre-commit hook (optional):"
echo "    ln -sf $INSTALL_DIR/scripts/pre-commit.sh .git/hooks/pre-commit"
echo "═══════════════════════════════════════"

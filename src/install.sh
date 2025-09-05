#!/bin/bash

# pql-ci-cd installation script

set -e

echo "🚀 Installing pql-ci-cd..."

# Check if bun is installed
if ! command -v bun &> /dev/null; then
    echo "❌ Bun is required but not installed. Please install Bun first:"
    echo "   curl -fsSL https://bun.sh/install | bash"
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
bun install

# Build the project
echo "🔨 Building project..."
bun run build

# Make CLI executable
chmod +x dist/cli.js

echo "✅ Installation complete!"
echo ""
echo "Usage:"
echo "  ./dist/cli.js setup              # Complete setup"
echo "  ./dist/cli.js generate-workflow  # Generate workflow only"
echo "  ./dist/cli.js sync               # Sync secrets only"
echo ""
echo "For global installation:"
echo "  npm link"
echo "  # Then use: pql-ci-cd setup"

#!/usr/bin/env bash

# Determine script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR" || exit 1

echo "🚀 Launching Jayraldine's Catering Desktop App..."

# Check that dependencies are actually installed (not just that the folder exists)
if [ ! -x "node_modules/.bin/vite" ]; then
  echo "📦 Installing npm dependencies..."
  npm install
fi

# Ensure all local binaries are executable
chmod +x node_modules/.bin/* 2>/dev/null || true

# Run dev server with Electron
npm run dev

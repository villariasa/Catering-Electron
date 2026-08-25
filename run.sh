#!/usr/bin/env bash

# Determine script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TARGET_DIR="$SCRIPT_DIR/Electron-Catering"

if [ -d "$TARGET_DIR" ]; then
  exec "$TARGET_DIR/run.sh" "$@"
fi

#!/bin/bash
# API Console - 一键启动
DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$DIR/server"
rm -f /tmp/console.db*
echo "Starting server on http://localhost:3001 ..."
npx tsx src/index.ts

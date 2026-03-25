#!/usr/bin/env bash
set -euo pipefail

FORK_URL="https://github.com/koenignicholas/ICP-Tether-.git"
BRANCH="feature/simulator-v2-updates"
DIR="tether-premium"

echo "=== Tether Premium Update ==="

[ -d "$DIR" ] && rm -rf "$DIR"
echo "[1/3] Cloning..."
git clone -b "$BRANCH" "$FORK_URL" "$DIR"

echo "[2/3] Installing + building..."
cd "$DIR/tether-revenue-simulator" && npm install && npm run build

echo "[3/3] Done!"
echo ""
echo "  Run:  cd $DIR/tether-revenue-simulator && npm run dev"
echo "  Open: http://localhost:3000/demo"
echo ""
echo "  Push: cd $DIR && git remote set-url origin YOUR_URL && git push -u origin $BRANCH"

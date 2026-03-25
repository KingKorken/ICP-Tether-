#!/usr/bin/env bash
set -euo pipefail

# ============================================================
# Tether — Timeframe Zoom Fix + Black Box Deploy
#
# Usage:
#   chmod +x fix_tether_zoom.sh
#   ./fix_tether_zoom.sh
# ============================================================

FORK_URL="https://github.com/koenignicholas/ICP-Tether-.git"
BRANCH="feature/simulator-v2-updates"
DIR="tether-zoom-fix"

echo ""
echo "======================================"
echo "  Tether — Zoom Fix + Black Box"
echo "======================================"

if [ -d "$DIR" ]; then rm -rf "$DIR"; fi

echo "[1/3] Cloning..."
git clone -b "$BRANCH" "$FORK_URL" "$DIR"

echo "[2/3] Installing + building..."
cd "$DIR/tether-revenue-simulator"
npm install
npm run build

echo "[3/3] Done!"
echo ""
echo "  Run:  cd $DIR/tether-revenue-simulator && npm run dev"
echo "  Open: http://localhost:3000/demo"
echo ""
echo "  Push to your repo:"
echo "    cd $DIR"
echo "    git remote set-url origin YOUR_REPO_URL"
echo "    git push -u origin $BRANCH"
echo "======================================"

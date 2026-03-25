#!/usr/bin/env bash
set -euo pipefail

# ============================================================
# Tether Revenue Simulator — Multi-Config Black Box Deploy
#
# Usage:
#   chmod +x deploy_tether_final.sh
#   ./deploy_tether_final.sh
#
# After running, set your own origin:
#   cd tether-blackbox-deploy
#   git remote set-url origin YOUR_REPO_URL
#   git push -u origin feature/multi-config-blackbox
# ============================================================

FORK_URL="https://github.com/koenignicholas/ICP-Tether-.git"
BRANCH="feature/simulator-v2-updates"
DIR="tether-blackbox-deploy"

echo ""
echo "======================================"
echo "  Tether — Multi-Config Black Box"
echo "======================================"
echo ""

if [ -d "$DIR" ]; then
  echo "[*] Removing existing '$DIR'..."
  rm -rf "$DIR"
fi

echo "[1/4] Cloning from fork..."
git clone -b "$BRANCH" "$FORK_URL" "$DIR"
cd "$DIR"

echo "[2/4] Installing dependencies..."
cd tether-revenue-simulator
npm install

echo "[3/4] Building..."
npm run build

echo "[4/4] Done!"
echo ""
echo "======================================"
echo "  Run locally:"
echo "    cd $DIR/tether-revenue-simulator"
echo "    npm run dev"
echo "    # Open http://localhost:3000/demo"
echo ""
echo "  Push to your repo:"
echo "    cd $DIR"
echo "    git remote set-url origin YOUR_GITHUB_REPO_URL"
echo "    git push -u origin $BRANCH"
echo "======================================"

#!/usr/bin/env bash
set -euo pipefail

# ============================================================
# Tether Revenue Simulator — Deploy Script
#
# This script:
# 1. Clones the original repo
# 2. Checks out the feature branch with all multi-config changes
# 3. Installs dependencies
# 4. Optionally lets you set a new Git origin for your own repo
#
# Usage:
#   chmod +x deploy_tether.sh
#   ./deploy_tether.sh
# ============================================================

REPO_URL="https://github.com/KingKorken/ICP-Tether-.git"
BRANCH="feature/simulator-v2-updates"
DIR="tether-simulator-deploy"

echo ""
echo "======================================"
echo "  Tether Revenue Simulator — Deploy"
echo "======================================"
echo ""

# Step 1: Clone
if [ -d "$DIR" ]; then
  echo "[*] Directory '$DIR' already exists. Removing..."
  rm -rf "$DIR"
fi

echo "[1/5] Cloning repository..."
git clone "$REPO_URL" "$DIR"
cd "$DIR"

# Step 2: Try to check out the feature branch (may not exist on origin yet)
echo "[2/5] Checking out feature branch..."
if git branch -r | grep -q "origin/$BRANCH"; then
  git checkout "$BRANCH"
  echo "  -> Checked out $BRANCH from origin"
else
  echo "  -> Branch $BRANCH not found on origin."
  echo "  -> The changes may already be merged into main, or you need to"
  echo "     pull from the fork: koenignicholas/ICP-Tether-"
  echo ""
  echo "  To pull from the fork instead, run:"
  echo "    git remote add fork https://github.com/koenignicholas/ICP-Tether-.git"
  echo "    git fetch fork"
  echo "    git checkout -b $BRANCH fork/$BRANCH"
  echo ""
fi

# Step 3: Install dependencies
echo "[3/5] Installing dependencies..."
cd tether-revenue-simulator
npm install

# Step 4: Verify build
echo "[4/5] Building project..."
npm run build

echo ""
echo "[5/5] Setup complete!"
echo ""
echo "======================================"
echo "  To run locally:"
echo "    cd $DIR/tether-revenue-simulator"
echo "    npm run dev"
echo "    # Open http://localhost:3000/demo"
echo ""
echo "  To set your own Git remote:"
echo "    cd $DIR"
echo "    git remote set-url origin YOUR_REPO_URL"
echo "    git push -u origin $BRANCH"
echo ""
echo "  To push to main directly:"
echo "    git checkout main"
echo "    git merge $BRANCH"
echo "    git push origin main"
echo "======================================"

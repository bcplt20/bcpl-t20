#!/bin/bash
# ============================================================
# BCPL T20 — Deployment Script
# Run on EC2 (as bcpl user) every time you want to update:
#   cd /home/bcpl/app && bash deploy/deploy.sh
# ============================================================

set -e
APP_DIR="/home/ubuntu/app"
LOG_DIR="/home/ubuntu/logs"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  BCPL T20 — Deployment Started"
echo "  $(date '+%Y-%m-%d %H:%M:%S')"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

mkdir -p $LOG_DIR

# ── 1. Load env file ─────────────────────────────────────────
if [ -f "$APP_DIR/.env.production" ]; then
  set -o allexport
  source "$APP_DIR/.env.production"
  set +o allexport
  echo "✅ Environment loaded"
else
  echo "❌ Missing .env.production — create it first!"
  exit 1
fi

# ── 2. Install dependencies ──────────────────────────────────
echo "📦 Installing dependencies..."
cd $APP_DIR
pnpm install --frozen-lockfile

# ── 3. Build API server ──────────────────────────────────────
echo "🔨 Building API server..."
cd $APP_DIR/artifacts/api-server
pnpm run build

# ── 4. Build frontend ────────────────────────────────────────
echo "🎨 Building frontend..."
cd $APP_DIR/artifacts/bcpl-website
VITE_API_URL="https://bcplt20.com" pnpm run build

# ── 5. Run DB migrations ─────────────────────────────────────
echo "🗄️  Running database migrations..."
cd $APP_DIR/lib/db
DATABASE_URL=$DATABASE_URL pnpm exec drizzle-kit push --yes 2>/dev/null || true

# ── 6. Reload PM2 ────────────────────────────────────────────
echo "🔄 Reloading PM2..."
cd $APP_DIR
if pm2 list | grep -q "bcpl-api"; then
  pm2 reload ecosystem.config.js --update-env
else
  pm2 start ecosystem.config.js
fi
pm2 save

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  ✅ Deployment Complete!"
echo "  API:     https://bcplt20.com/api/health"
echo "  Website: https://bcplt20.com/bcpl-website/"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

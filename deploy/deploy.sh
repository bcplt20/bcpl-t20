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

# ── 1a2. Ek-baar ka AUTO-SETUP (locked seed file) ────────────
# Replit assistant ne sari nayi keys (MSG91, nayi Brevo key, admin
# password) ek encrypted file me daal di hain. Sirf unlock code
# chahiye — wo Replit chat me diya gaya hai.
SEED="$APP_DIR/deploy/env.seed.enc"
if [ -f "$SEED" ] && ! grep -q '^SEED_APPLIED_V2=1' "$APP_DIR/.env.production"; then
  echo ""
  echo "🔐 Ek-baar ka setup: sari nayi keys ek locked file me taiyar hain."
  read -r -p "👉 Unlock code daalo (Replit chat me mila hai), phir Enter: " SEED_CODE
  TMP_SEED=$(mktemp)
  if [ -n "$SEED_CODE" ] && openssl enc -d -aes-256-cbc -pbkdf2 -iter 100000 -in "$SEED" -pass "pass:$SEED_CODE" -out "$TMP_SEED" 2>/dev/null; then
    cp "$APP_DIR/.env.production" "$APP_DIR/.env.production.backup-$(date +%Y%m%d-%H%M%S)"
    while IFS= read -r line; do
      K="${line%%=*}"
      [ -z "$K" ] && continue
      grep -v "^${K}=" "$APP_DIR/.env.production" > "$APP_DIR/.env.production.tmp" || true
      mv "$APP_DIR/.env.production.tmp" "$APP_DIR/.env.production"
      printf '%s\n' "$line" >> "$APP_DIR/.env.production"
    done < "$TMP_SEED"
    echo "SEED_APPLIED_V2=1" >> "$APP_DIR/.env.production"
    # nayi values isi run me lagoo karo
    set -o allexport
    # shellcheck disable=SC1090
    source "$APP_DIR/.env.production"
    set +o allexport
    echo "✅ Sari keys apne aap set ho gayin (MSG91 + nayi Brevo key + admin password)."
  else
    echo "❌ Code galat hai ya khali — koi baat nahi, ab script keys alag-alag poochhegi."
  fi
  rm -f "$TMP_SEED"
fi

# ── 1b. Zaroori keys check (one-time setup, no nano needed) ──
# In keys ke bina admin-login / OTP-SMS / email kaam nahi karte.
# Jo key .env.production me nahi hogi, script yahin poochh kar
# khud save kar lega — aap bas paste karke Enter dabao.
REQUIRED_KEYS="ADMIN_PANEL_PASSWORD MSG91_AUTH_KEY MSG91_OTP_TEMPLATE_ID MSG91_SENDER_ID BREVO_API_KEY"
for KEY in $REQUIRED_KEYS; do
  if ! grep -q "^${KEY}=..*" "$APP_DIR/.env.production"; then
    case "$KEY" in
      ADMIN_PANEL_PASSWORD) HINT="wahi password jo aap admin login me daalte ho" ;;
      MSG91_*)              HINT="MSG91 dashboard ya Replit ke Secrets pane se copy karo" ;;
      BREVO_API_KEY)        HINT="Brevo ki API key (nayi wali) paste karo" ;;
      *)                    HINT="value paste karo" ;;
    esac
    echo ""
    echo "⚠️  $KEY .env.production me nahi mila."
    read -r -p "👉 $KEY — $HINT, phir Enter: " VAL
    if [ -z "$VAL" ]; then
      echo "❌ Khali value — dobara 'bash deploy/deploy.sh' chalao."
      exit 1
    fi
    printf '%s=%s\n' "$KEY" "$VAL" >> "$APP_DIR/.env.production"
    echo "✅ $KEY save ho gaya (.env.production me)"
  fi
  # (pm2 ko pass karne ke liye export — chahe abhi save hua ho ya pehle se)
  export "$KEY"="$(grep "^${KEY}=" "$APP_DIR/.env.production" | tail -n1 | cut -d= -f2-)"
done

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
BASE_PATH=/bcpl-website/ VITE_API_URL="https://bcplt20.com" pnpm run build

# ── 5. Run DB migrations ─────────────────────────────────────
echo "🗄️  Running database migrations..."
cd $APP_DIR/lib/db
DATABASE_URL=$DATABASE_URL pnpm exec drizzle-kit push --yes 2>/dev/null || true

# ── 6. Reload PM2 ────────────────────────────────────────────
echo "🔄 Reloading PM2..."
cd $APP_DIR
if pm2 list | grep -q "bcpl-api"; then
  pm2 reload deploy/ecosystem.config.js --update-env
else
  pm2 start deploy/ecosystem.config.js
fi
pm2 save

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  ✅ Deployment Complete!"
echo "  API:     https://bcplt20.com/api/health"
echo "  Website: https://bcplt20.com/bcpl-website/"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

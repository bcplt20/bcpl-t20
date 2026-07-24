#!/bin/bash
# ============================================================
# BCPL T20 — Deployment Script
# Run on EC2 (as bcpl user) every time you want to update:
#   cd /home/bcpl/app && bash deploy/deploy.sh
# ============================================================

set -e
APP_DIR="/home/ubuntu/app"
LOG_DIR="/home/ubuntu/logs"

# ── CI / non-interactive mode ────────────────────────────────
# --ci flag (GitHub Actions se), ya koi TTY nahi (SSH-action, cron)
# => saare interactive prompts SKIP. Manual chalane par (TTY hai,
# --ci nahi) sab pehle jaisa hi kaam karta hai.
CI_MODE=0
for arg in "$@"; do
  case "$arg" in
    --ci) CI_MODE=1 ;;
  esac
done
# stdin TTY nahi hai (e.g. ssh-action pipe) => automatically CI mode
if [ ! -t 0 ]; then
  CI_MODE=1
fi
if [ "$CI_MODE" = "1" ]; then
  echo "🤖 CI/non-interactive mode: sabhi prompts skip honge (koi input nahi maanga jayega)."
fi

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
if [ "$CI_MODE" = "1" ]; then
  # CI me koi unlock code nahi maang sakte — seed block chhod do.
  # (Ye one-time setup hai; owner ne pehli baar manual deploy me
  #  ye already apply kar diya hoga — SEED_APPLIED_V4=1 set hai.)
  echo "⏭️  Seed setup skip (CI mode)."
elif [ -f "$SEED" ] && ! grep -q '^SEED_APPLIED_V4=1' "$APP_DIR/.env.production"; then
  echo ""
  echo "🔐 Ek-baar ka setup: sari nayi keys ek locked file me taiyar hain."
  read -r -p "👉 Unlock code daalo (Replit chat me mila hai), phir Enter: " SEED_CODE
  TMP_SEED=$(mktemp)
  if [ -n "$SEED_CODE" ] && openssl enc -d -aes-256-cbc -pbkdf2 -iter 100000 -in "$SEED" -pass "pass:$SEED_CODE" -out "$TMP_SEED" 2>/dev/null; then
    cp "$APP_DIR/.env.production" "$APP_DIR/.env.production.backup-$(date +%Y%m%d-%H%M%S)"
    while IFS= read -r line; do
      K="${line%%=*}"
      [ -z "$K" ] && continue
      V="${line#*=}"
      # KHALI value kabhi apply mat karo — 22 July ko isi se JWT_SECRET
      # ud gaya tha aur poori site 502 ho gayi thi.
      [ -z "$V" ] && continue
      grep -v "^${K}=" "$APP_DIR/.env.production" > "$APP_DIR/.env.production.tmp" || true
      mv "$APP_DIR/.env.production.tmp" "$APP_DIR/.env.production"
      printf '%s\n' "$line" >> "$APP_DIR/.env.production"
    done < "$TMP_SEED"
    echo "SEED_APPLIED_V4=1" >> "$APP_DIR/.env.production"
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
REQUIRED_KEYS="ADMIN_PANEL_PASSWORD MSG91_AUTH_KEY MSG91_OTP_TEMPLATE_ID MSG91_SENDER_ID BREVO_API_KEY ADMIN_ALERT_EMAIL"
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
    if [ "$CI_MODE" = "1" ]; then
      # CI me value maang nahi sakte. Deploy YAHIN rok do — purani
      # app chalti rahegi. Owner ek baar manual deploy chala kar
      # (SSH se) ye key set kare, uske baad auto-deploy chalega.
      echo "❌ CI mode: $KEY missing hai aur prompt nahi kar sakte."
      echo "   Ek baar EC2 par manual chalao aur $KEY set karo:"
      echo "   cd $APP_DIR && bash deploy/deploy.sh"
      exit 1
    fi
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

# ── 1c. CRITICAL keys check — in ke bina app boot HI nahi hoti ──
# (JWT_SECRET missing tha to app crash-loop me chali gayi thi aur
#  poori site 502 ho gayi thi. Ab deploy YAHIN ruk jayega — purani
#  app chalti rahegi, koi downtime nahi.)
for KEY in DATABASE_URL JWT_SECRET SESSION_SECRET ADMIN_SECRET; do
  if [ -z "${!KEY:-}" ]; then
    echo ""
    echo "❌ CRITICAL: $KEY .env.production me missing ya khali hai!"
    echo "   Deploy ROK diya gaya — purani app ko haath nahi lagaya."
    echo "   Pehle .env.production me $KEY set karo, phir dobara:"
    echo "   bash deploy/deploy.sh"
    exit 1
  fi
done
echo "✅ Critical keys OK (DATABASE_URL, JWT_SECRET, SESSION_SECRET, ADMIN_SECRET)"

# ── 2. Install dependencies ──────────────────────────────────
echo "📦 Installing dependencies..."
cd $APP_DIR
pnpm install --frozen-lockfile

# ── 3. Build API server ──────────────────────────────────────
echo "🔨 Building API server..."
cd $APP_DIR/artifacts/api-server
pnpm run build

# ── 3b. DB catch-up SQL (idempotent — har deploy par chalana safe) ──
# deploy/sql/ ki files prod DB ko schema-push ke laayak align karti hain
# (purane constraint-naam, missing tables). Har file IF NOT EXISTS /
# DO-block style me hai — do baar chalne par kuch nahi bigadta.
# NAYI file add karo to WAHI idempotent style rakhna (warna dusra
# deploy usi par fail hoga).
echo "🩹 DB catch-up SQL..."
cd $APP_DIR
if ! command -v psql >/dev/null 2>&1; then
  echo "❌ psql installed nahi hai. Pehle ye chalao, phir dobara deploy:"
  echo "   sudo apt-get install -y postgresql-client"
  exit 1
fi
for SQLF in deploy/sql/*.sql; do
  [ -f "$SQLF" ] || continue
  if psql "$DATABASE_URL" -q -v ON_ERROR_STOP=1 -f "$SQLF" >/dev/null 2>&1; then
    echo "   ✅ $(basename "$SQLF")"
  else
    echo "❌ $(basename "$SQLF") fail hua — DEPLOY ROKA GAYA (purani app chalti rahegi)."
    echo "   Ye output Replit Agent ko bhej dijiye:"
    psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$SQLF" 2>&1 | tail -15
    exit 1
  fi
done

# ── 4. Run DB migrations (build se PEHLE: yahan ruke to purani app
#      bilkul waise hi chalti rehti hai — aadha-naya deploy kabhi nahi) ──
# Pehle ye step chupchaap fail hota tha (2>/dev/null || true) — isi se prod
# par scoring tables kabhi bani hi nahi aur match delete 42P01 se girta tha.
echo "🗄️  Running database migrations..."
cd $APP_DIR/lib/db
# NOTE: is drizzle-kit me `--yes` flag EXIST hi nahi karta — purani line
# "push --yes" pehle din se usage-error se girti thi (aur 2>/dev/null usse
# chhupa deta tha). `push-force` = drizzle-kit push --force (non-interactive,
# destructive statements auto-accept — output neeche poora chhapta hai).
# RDS SSL: node ka 'pg' driver certificate-verify par chupchaap girta hai
# (psql nahi girta — wahi silent exit-1 wala bug). sslmode=no-verify se
# connection encrypted HI rehta hai, sirf cert-check skip hota hai
# (AWS ke andar ka private link hai, ye safe hai).
PUSH_URL="${DATABASE_URL%%\?*}?sslmode=no-verify"
PUSH_OUT=$(DATABASE_URL="$PUSH_URL" pnpm run push-force 2>&1) || true
echo "$PUSH_OUT" | tail -25
if echo "$PUSH_OUT" | grep -qE "Changes applied|No changes"; then
  echo "✅ DB schema up to date"
else
  echo "❌ DB schema push adhura raha — DEPLOY ROKA GAYA (purani app hi chalti rahegi)."
  echo "   Upar ka pura output Replit Agent ko bhej dijiye."
  exit 1
fi

# ── 5. Build frontend ────────────────────────────────────────
echo "🎨 Building frontend..."
cd $APP_DIR/artifacts/bcpl-website
# PROD par site root domain (bcplt20.com) par chalti hai — BASE_PATH=/ hi hona chahiye.
# (/bcpl-website/ sirf Replit dev preview ka path hai — usse assets 404 ho jaate hain)
BASE_PATH=/ VITE_API_URL="https://bcplt20.com" pnpm run build

# ── 6. Reload PM2 ────────────────────────────────────────────
echo "🔄 Reloading PM2..."
cd $APP_DIR
if pm2 list | grep -q "bcpl-api"; then
  pm2 reload deploy/ecosystem.config.js --update-env
else
  pm2 start deploy/ecosystem.config.js
fi
# App healthy hone par HI save karo — warna kharab env dump me
# save ho jata hai (24 July: isi se purani JWT chaabi ud gayi thi)
sleep 6
OK=0
for i in 1 2 3; do
  HTTP=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:4000/api/healthz || echo 000)
  [ "$HTTP" = "200" ] && OK=$((OK+1))
  sleep 2
done
if [ "$OK" = "3" ]; then
  pm2 save
  echo "✅ App healthy (healthz 3/3) — pm2 save ho gaya"
else
  echo "❌ App healthz sirf $OK/3 baar 200 de raha hai — pm2 save NAHI kiya (purana dump surakshit)."
  echo "   Ye chalao aur output Replit chat me bhejo:"
  echo "   pm2 logs bcpl-api --err --lines 40 --nostream"
  exit 1
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  ✅ Deployment Complete!"
echo "  API:     https://bcplt20.com/api/healthz"
echo "  Website: https://bcplt20.com"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

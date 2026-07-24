#!/bin/bash
# ============================================================
# BCPL T20 — .env.production REPAIR (one-time)
#
# Kya karta hai: 22 July ke seed-setup ne kuch keys ki value
# KHALI kar di thi (JWT_SECRET). Ye script purane backup files
# me se sahi value dhoondh kar wapas daalta hai, phir app ko
# sahi env ke saath reload karta hai.
#
# - Nayi keys (MSG91, nayi Brevo key, admin password) ko
#   BILKUL nahi chhuta — sirf khali/gayab keys repair hoti hain.
# - Secret values kabhi screen par print NAHI hoti.
#
# Chalane ka tarika (EC2 par):
#   cd /home/ubuntu/app && git pull && bash deploy/fix-env.sh
# ============================================================
set -e

APP_DIR="${1:-/home/ubuntu/app}"
ENV="$APP_DIR/.env.production"
cd "$APP_DIR"

if [ ! -f "$ENV" ]; then
  echo "❌ $ENV hi nahi mila — ye output Replit chat me bhejo."
  exit 1
fi

# Pehle aaj ki safety copy
cp "$ENV" "$ENV.before-repair-$(date +%Y%m%d-%H%M%S)"
echo "✅ Safety copy ban gayi"

# In keys ko check/repair karna hai
KEYS="JWT_SECRET SESSION_SECRET ADMIN_SECRET DATABASE_URL AWS_ACCESS_KEY_ID AWS_SECRET_ACCESS_KEY CASHFREE_APP_ID CASHFREE_SECRET_KEY CF_VERIFY_APP_ID CF_VERIFY_SECRET MSG91_AUTH_KEY MSG91_OTP_TEMPLATE_ID MSG91_SENDER_ID BREVO_API_KEY ADMIN_PANEL_PASSWORD ADMIN_ALERT_EMAIL"

# Backup files — sabse NAYI pehle (repair ke liye usi kram me dhoondhenge)
BACKUPS=$(ls -1t "$ENV".backup-* 2>/dev/null || true)

FIXED=""
STILL_MISSING=""
for KEY in $KEYS; do
  # Current file me value ke saath maujood hai? (khali line = missing)
  if grep -q "^${KEY}=..*" "$ENV"; then
    continue
  fi
  FOUND=""
  for B in $BACKUPS; do
    LINE=$(grep -m1 "^${KEY}=..*" "$B" 2>/dev/null || true)
    if [ -n "$LINE" ]; then
      # Khali/purani line hatao, backup wali sahi line daalo
      grep -v "^${KEY}=" "$ENV" > "$ENV.tmp" || true
      mv "$ENV.tmp" "$ENV"
      printf '%s\n' "$LINE" >> "$ENV"
      FIXED="$FIXED $KEY"
      FOUND="1"
      break
    fi
  done
  if [ -z "$FOUND" ]; then
    STILL_MISSING="$STILL_MISSING $KEY"
  fi
done

echo ""
if [ -n "$FIXED" ]; then
  echo "✅ Backup se wapas layi gayi keys:$FIXED"
else
  echo "ℹ️  Koi key repair karne ki zaroorat nahi thi"
fi
if [ -n "$STILL_MISSING" ]; then
  echo "⚠️  Ye keys kisi bhi backup me nahi mili:$STILL_MISSING"
fi

# Test mode (Replit par check karne ke liye) — yahin ruk jao
if [ "${SKIP_RELOAD:-0}" = "1" ]; then
  echo "(test mode: pm2 reload skip)"
  exit 0
fi

# Ab sahi env ke saath app reload
set -o allexport
# shellcheck disable=SC1090
source "$ENV"
set +o allexport

if [ -z "${JWT_SECRET:-}" ]; then
  echo ""
  echo "❌ JWT_SECRET ab bhi nahi mila — app reload NAHI kiya (site jaisi hai waisi hai)."
  echo "   Ye poora output Replit chat me bhej do."
  exit 1
fi

pm2 reload deploy/ecosystem.config.js --update-env
sleep 6
pm2 status
OK=0
for i in 1 2 3; do
  HTTP=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:4000/api/healthz || echo 000)
  [ "$HTTP" = "200" ] && OK=$((OK+1))
  sleep 2
done
SITE=$(curl -s -o /dev/null -w "%{http_code}" https://bcplt20.com/ || echo 000)
echo "LOCAL API: $OK/3 healthz OK"
echo "SITE: $SITE"
if [ "$OK" = "3" ]; then
  pm2 save
  echo ""
  echo "✅ Ho gaya! App healthy hai, pm2 save bhi ho gaya (reboot-proof)."
else
  echo ""
  echo "❌ App healthz sirf $OK/3 baar 200 de raha hai — pm2 save NAHI kiya."
  echo "   Ye chalao aur output Replit chat me bhejo:"
  echo "   pm2 logs bcpl-api --err --lines 40 --nostream"
  exit 1
fi

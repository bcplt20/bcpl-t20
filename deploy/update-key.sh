#!/bin/bash
# ============================================================
# BCPL T20 — kisi key ki NAYI value daalne ke liye
# (jaise Brevo ki nayi key, ya MSG91 ki key badalni ho)
#
# Aise chalao (EC2 par):
#   bash deploy/update-key.sh BREVO_API_KEY
#
# Script poochhega, aap nayi value paste karke Enter dabao —
# .env.production update hoga aur server khud reload ho jayega.
# ============================================================
set -e
APP_DIR="/home/ubuntu/app"
ENV_FILE="$APP_DIR/.env.production"
KEY="$1"

if [ -z "$KEY" ]; then
  echo "Aise chalao:   bash deploy/update-key.sh KEY_KA_NAAM"
  echo "Jaise:         bash deploy/update-key.sh BREVO_API_KEY"
  echo "Ya:            bash deploy/update-key.sh MSG91_AUTH_KEY"
  exit 1
fi
if [ ! -f "$ENV_FILE" ]; then
  echo "❌ $ENV_FILE nahi mila."
  exit 1
fi

read -r -p "👉 $KEY ki NAYI value paste karo, phir Enter: " VAL
if [ -z "$VAL" ]; then
  echo "❌ Khali value — kuch nahi badla."
  exit 1
fi

# Backup, purani line hatao, nayi jodo
cp "$ENV_FILE" "$ENV_FILE.backup-$(date +%Y%m%d-%H%M%S)"
grep -v "^${KEY}=" "$ENV_FILE" > "$ENV_FILE.tmp" || true
printf '%s=%s\n' "$KEY" "$VAL" >> "$ENV_FILE.tmp"
mv "$ENV_FILE.tmp" "$ENV_FILE"
echo "✅ $KEY update ho gaya (.env.production me)"

# Server ko nayi value ke saath reload karo
set -o allexport
# shellcheck disable=SC1090
source "$ENV_FILE"
set +o allexport
cd "$APP_DIR"
if command -v pm2 >/dev/null 2>&1 && pm2 list 2>/dev/null | grep -q "bcpl-api"; then
  pm2 reload deploy/ecosystem.config.js --update-env
  echo "🔄 Server reload ho gaya — nayi key ab LIVE hai."
else
  echo "ℹ️  PM2 abhi nahi chal raha — agli baar 'bash deploy/deploy.sh' par live ho jayegi."
fi

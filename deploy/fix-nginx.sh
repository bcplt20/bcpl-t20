#!/bin/bash
# ============================================================
# BCPL T20 — nginx incremental patcher (idempotent)
# Run on EC2:   sudo bash deploy/fix-nginx.sh
#
# Har patch apna marker check karta hai — jo pehle se laga hai
# use skip karta hai, jo naya hai sirf wahi jodta hai:
#   [EDIT 1] try_files → @app        (SEO meta injection)
#   [EDIT 2] "location @app" block
#   [EDIT 3] rate-limit zones        (OTP/payment flood shield)
#   [EDIT 4] /api/auth/ + /api/payment/ limit_req locations
#   [EDIT 5] /assets/ 1-year immutable cache
# Kuch bhi gadbad hui to backup se KHUD wapas kar deta hai —
# site kabhi tooTegi nahi.
# ============================================================
set -e

if [ "$(id -u)" -ne 0 ]; then
  echo "❌ Ise sudo ke saath chalao:   sudo bash deploy/fix-nginx.sh"
  exit 1
fi

# ── 1. Live config file dhundo ───────────────────────────────
CONF=""
for f in $(grep -Rls "bcplt20\.com" /etc/nginx 2>/dev/null || true); do
  rf=$(readlink -f "$f")
  case "$rf" in *.backup-*) continue ;; esac
  if grep -q "location /api" "$rf"; then CONF="$rf"; break; fi
done
if [ -z "$CONF" ]; then
  echo "❌ bcplt20.com wali nginx file nahi mili (/etc/nginx me)."
  echo "── Neeche ka PURA output copy karke Replit chat me bhej do: ──"
  ls -la /etc/nginx /etc/nginx/sites-enabled /etc/nginx/conf.d 2>/dev/null || true
  grep -Rl "server_name" /etc/nginx 2>/dev/null || true
  exit 1
fi
echo "📄 Nginx file mili: $CONF"

# ── 2. Backup (ek hi baar per run) ───────────────────────────
BACKUP="$CONF.backup-$(date +%Y%m%d-%H%M%S)"
cp "$CONF" "$BACKUP"
echo "🗂  Backup: $BACKUP"

restore() {
  cp "$BACKUP" "$CONF"
  echo "↩️  Gadbad hui — file backup se wapas laga di. Site pehle jaisi hi chal rahi hai."
}

CHANGED=0

# ── [EDIT 1] try_files → @app fallback ───────────────────────
if grep -q 'try_files $uri @app;' "$CONF"; then
  echo "⏭  [EDIT 1] pehle se laga hai"
else
  sed -E -i 's#try_files[[:space:]]+\$uri([[:space:]]+\$uri/)?[[:space:]]+/index\.html[[:space:]]*;#try_files $uri @app;#' "$CONF"
  if ! grep -q 'try_files $uri @app;' "$CONF"; then
    restore; echo "❌ try_files wali line expected jaisi nahi mili. Ye bhejo:  cat $CONF"; exit 1
  fi
  echo "✏️  [EDIT 1] ho gaya (try_files → @app)"; CHANGED=1
fi

# ── [EDIT 2] @app block (location /api se pehle) ─────────────
if grep -q "location @app" "$CONF"; then
  echo "⏭  [EDIT 2] pehle se laga hai"
else
  BLOCK=$(mktemp)
  cat > "$BLOCK" <<'NGINXBLOCK'
    # Express fallback — page requests yahan jaate hain taaki
    # SEO meta tags server se inject ho kar aayein
    location @app {
        proxy_pass         http://127.0.0.1:4000;
        proxy_http_version 1.1;
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
    }

NGINXBLOCK
  awk -v bf="$BLOCK" '
    /location[[:space:]]+\/api/ && !done { while ((getline l < bf) > 0) print l; done=1 }
    { print }
  ' "$CONF" > "$CONF.tmp"
  rm -f "$BLOCK"
  if ! grep -q "location @app" "$CONF.tmp"; then
    rm -f "$CONF.tmp"; restore; echo "❌ location /api/ wala block nahi mila. Ye bhejo:  cat $CONF"; exit 1
  fi
  mv "$CONF.tmp" "$CONF"
  echo "✏️  [EDIT 2] ho gaya (@app block)"; CHANGED=1
fi

# ── [EDIT 3] rate-limit zones (file ke sabse upar, server{} se bahar) ──
if grep -q "zone=bcpl_auth" "$CONF"; then
  echo "⏭  [EDIT 3] pehle se laga hai"
else
  ZONES=$(mktemp)
  cat > "$ZONES" <<'NGINXBLOCK'
# BCPL rate-limit zones — flood shield only; per-phone/per-IP precise caps
# live in the API. Generous: carrier NAT = many real users per IP.
limit_req_zone $binary_remote_addr zone=bcpl_auth:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=bcpl_pay:10m  rate=20r/s;
limit_req_log_level warn;

NGINXBLOCK
  awk -v bf="$ZONES" '
    /^[[:space:]]*server[[:space:]]*\{/ && !done { while ((getline l < bf) > 0) print l; done=1 }
    { print }
  ' "$CONF" > "$CONF.tmp"
  rm -f "$ZONES"
  if ! grep -q "zone=bcpl_auth" "$CONF.tmp"; then
    rm -f "$CONF.tmp"; restore; echo "❌ server{ line nahi mili zones ke liye. Ye bhejo:  cat $CONF"; exit 1
  fi
  mv "$CONF.tmp" "$CONF"
  echo "✏️  [EDIT 3] ho gaya (rate-limit zones)"; CHANGED=1
fi

# ── [EDIT 4] /api/auth/ + /api/payment/ limit_req locations ──
if grep -q "location /api/auth/" "$CONF"; then
  echo "⏭  [EDIT 4] pehle se laga hai"
else
  LIMBLK=$(mktemp)
  cat > "$LIMBLK" <<'NGINXBLOCK'
    # OTP/auth flood shield (app-level caps are the precise control)
    location /api/auth/ {
        limit_req          zone=bcpl_auth burst=30 nodelay;
        limit_req_status   429;
        proxy_pass         http://127.0.0.1:4000;
        proxy_http_version 1.1;
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        proxy_read_timeout 60s;
        client_max_body_size 1M;
    }

    # Payment flood shield (Cashfree webhook + order APIs)
    location /api/payment/ {
        limit_req          zone=bcpl_pay burst=40 nodelay;
        limit_req_status   429;
        proxy_pass         http://127.0.0.1:4000;
        proxy_http_version 1.1;
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        proxy_read_timeout 60s;
        client_max_body_size 1M;
    }

NGINXBLOCK
  awk -v bf="$LIMBLK" '
    /location[[:space:]]+\/api\// && !done { while ((getline l < bf) > 0) print l; done=1 }
    { print }
  ' "$CONF" > "$CONF.tmp"
  rm -f "$LIMBLK"
  if ! grep -q "location /api/auth/" "$CONF.tmp"; then
    rm -f "$CONF.tmp"; restore; echo "❌ location /api/ block nahi mila [EDIT 4] ke liye. Ye bhejo:  cat $CONF"; exit 1
  fi
  mv "$CONF.tmp" "$CONF"
  echo "✏️  [EDIT 4] ho gaya (auth/payment rate limits)"; CHANGED=1
fi

# ── [EDIT 5] /assets/ 1-year immutable cache ─────────────────
if grep -q "location /assets/" "$CONF"; then
  echo "⏭  [EDIT 5] pehle se laga hai"
else
  ASSETS=$(mktemp)
  cat > "$ASSETS" <<'NGINXBLOCK'
    # Hashed build assets — filenames change on every deploy, so
    # browsers/CDN can cache these for 1 year safely
    location /assets/ {
        root    /home/ubuntu/app/artifacts/bcpl-website/dist/public;
        try_files $uri =404;
        expires 1y;
        add_header Cache-Control "public, max-age=31536000, immutable";
        access_log off;
    }

NGINXBLOCK
  # "location / {" (sirf root wala) se theek pehle jodo
  awk -v bf="$ASSETS" '
    /location[[:space:]]+\/[[:space:]]*\{/ && !done { while ((getline l < bf) > 0) print l; done=1 }
    { print }
  ' "$CONF" > "$CONF.tmp"
  rm -f "$ASSETS"
  if ! grep -q "location /assets/" "$CONF.tmp"; then
    rm -f "$CONF.tmp"; restore; echo "❌ location / { block nahi mila [EDIT 5] ke liye. Ye bhejo:  cat $CONF"; exit 1
  fi
  mv "$CONF.tmp" "$CONF"
  echo "✏️  [EDIT 5] ho gaya (/assets/ 1-year cache)"; CHANGED=1
fi

# ── Test + reload ────────────────────────────────────────────
if [ "$CHANGED" -eq 0 ]; then
  rm -f "$BACKUP"
  echo "✅ Sab patches pehle se lage hain — kuch nahi badla."
  exit 0
fi

if nginx -t; then
  systemctl reload nginx
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "  ✅ Nginx patches complete!"
  echo "  Check: curl -sI https://bcplt20.com/assets/ | head -3"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
else
  restore
  echo "❌ nginx test fail hua, isliye backup wapas laga diya (site theek hai)."
  echo "   Upar wala pura output mujhe (Replit chat me) bhej do."
  exit 1
fi

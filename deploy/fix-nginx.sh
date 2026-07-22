#!/bin/bash
# ============================================================
# BCPL T20 — nginx one-time patch (SEO meta injection ke liye)
# Run on EC2:   sudo bash deploy/fix-nginx.sh
#
# Ye script khud-ba-khud:
#   1. bcplt20.com wali live nginx file dhundhta hai
#   2. uska backup banata hai
#   3. [EDIT 1] try_files line badalta hai  (→ pages Express se aayenge)
#   4. [EDIT 2] "location @app" block jodta hai
#   5. nginx -t se test karke reload karta hai
# Kuch bhi gadbad hui to backup se KHUD wapas kar deta hai —
# site kabhi tooTegi nahi.
# ============================================================
set -e

if [ "$(id -u)" -ne 0 ]; then
  echo "❌ Ise sudo ke saath chalao:   sudo bash deploy/fix-nginx.sh"
  exit 1
fi

# ── 1. Live config file dhundo ───────────────────────────────
# (-R: symlinks follow karta hai — sites-enabled me symlinks hote hain)
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
  echo "── server_name wali files: ──"
  grep -Rl "server_name" /etc/nginx 2>/dev/null || true
  exit 1
fi
echo "📄 Nginx file mili: $CONF"

# ── 2. Pehle se patched? ─────────────────────────────────────
if grep -q "location @app" "$CONF"; then
  echo "✅ Ye file pehle se patched hai — kuch karne ki zaroorat nahi."
  exit 0
fi

# ── 3. Backup ────────────────────────────────────────────────
BACKUP="$CONF.backup-$(date +%Y%m%d-%H%M%S)"
cp "$CONF" "$BACKUP"
echo "🗂  Backup ban gaya: $BACKUP"

restore() {
  cp "$BACKUP" "$CONF"
  echo "↩️  Gadbad hui — file backup se wapas laga di. Site pehle jaisi hi chal rahi hai."
}

# ── 4. [EDIT 1] try_files → @app fallback ────────────────────
sed -E -i 's#try_files[[:space:]]+\$uri([[:space:]]+\$uri/)?[[:space:]]+/index\.html[[:space:]]*;#try_files $uri @app;#' "$CONF"
if ! grep -q 'try_files $uri @app;' "$CONF"; then
  restore
  echo "❌ try_files wali line expected jaisi nahi mili."
  echo "   Ye chala kar output mujhe bhej do:  cat $CONF"
  exit 1
fi
echo "✏️  [EDIT 1] ho gaya (try_files → @app)"

# ── 5. [EDIT 2] @app block jodo (location /api/ se pehle) ────
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
  rm -f "$CONF.tmp"
  restore
  echo "❌ location /api/ wala block nahi mila."
  echo "   Ye chala kar output mujhe bhej do:  cat $CONF"
  exit 1
fi
mv "$CONF.tmp" "$CONF"
echo "✏️  [EDIT 2] ho gaya (@app block jud gaya)"

# ── 6. Test + reload ─────────────────────────────────────────
if nginx -t; then
  systemctl reload nginx
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "  ✅ Nginx patch complete!"
  echo "  Check karne ke liye:"
  echo "  curl -s https://bcplt20.com | grep -i '<title>'"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
else
  restore
  echo "❌ nginx test fail hua, isliye backup wapas laga diya (site theek hai)."
  echo "   Upar wala pura output mujhe (Replit chat me) bhej do."
  exit 1
fi

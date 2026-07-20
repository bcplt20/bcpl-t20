#!/bin/bash
# ============================================================
# BCPL T20 — EC2 Fresh Server Setup Script
# Run this ONCE on a brand new Ubuntu 22.04 EC2 instance:
#   chmod +x setup-ec2.sh && sudo ./setup-ec2.sh
# ============================================================

set -e
echo "🚀 BCPL T20 — EC2 Setup Starting..."

# ── 1. System update ────────────────────────────────────────
apt-get update -y && apt-get upgrade -y

# ── 2. Install Node.js 20 LTS ───────────────────────────────
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs git nginx certbot python3-certbot-nginx unzip

# ── 3. Install pnpm ─────────────────────────────────────────
npm install -g pnpm pm2

# ── 4. Create app user ──────────────────────────────────────
id -u bcpl &>/dev/null || useradd -m -s /bin/bash bcpl
mkdir -p /home/bcpl/app
chown -R bcpl:bcpl /home/bcpl/app

# ── 5. PM2 startup on reboot ────────────────────────────────
pm2 startup systemd -u bcpl --hp /home/bcpl

# ── 6. Nginx enable ─────────────────────────────────────────
systemctl enable nginx
systemctl start nginx

echo ""
echo "✅ EC2 setup complete!"
echo "Next: Run deploy.sh to deploy the application"

#!/bin/bash
# ============================================================
# BCPL T20 — ONE-COMMAND DEPLOY
#
# Har baar site update karne ke liye bas YE EK command chalao:
#
#     cd /home/ubuntu/app && bash deploy/go.sh
#
# Ye khud: naya code laayega → build karega → server restart
# karega → nginx patch (sirf pehli baar) karega.
# ============================================================
set -e
cd /home/ubuntu/app

echo "⬇️  Naya code laa rahe hain (GitHub se)..."
git pull origin main
echo ""

bash deploy/deploy.sh
echo ""

sudo bash deploy/fix-nginx.sh
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  🎉 SAB HO GAYA!"
echo "  Site dekho:   https://bcplt20.com"
echo "  Admin dekho:  https://bcplt20.com/admin"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

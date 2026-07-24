---
name: BCPL deploy pipeline
description: How code reaches production bcplt20.com — push step, canonical EC2 deploy flow, prerequisites
---

Production (bcplt20.com) = EC2 + nginx + PM2 cluster ×2, pulls from GitHub `origin main` (repo bcplt20/bcpl-t20).

**Rule:** A commit in the Replit workspace is INVISIBLE to production until `git push origin main`. Platform task-merges also land only locally — they need a manual push too.

**Why:** An entire session of fixes ("nothing changed on the site!") turned out to be 5 unpushed commits; user redeployed EC2 twice against a stale GitHub.

**How to apply:** After every commit intended for production, push immediately, then give the owner ONE copy-paste EC2 block. Canonical deploy = `cd /home/ubuntu/app && bash deploy/go.sh` (git pull → deploy.sh: critical-env fail-fast → optional one-time locked seed apply (encrypted `deploy/env.seed.enc`, `SEED_APPLIED_Vn` guard, unlock code given in chat) → pnpm install → build api+website → `drizzle-kit push --yes` (failures silenced — boot-time ensures are the real DDL guarantee) → `pm2 reload ecosystem --update-env` → healthz-3/3-gated `pm2 save` → fix-nginx.sh). Do NOT hand-roll pm2 restart blocks.

API startup runs idempotent ensures/migrations against RDS automatically — no manual SQL on EC2.

**Secret rotation on EC2:** `bash deploy/update-key.sh KEY_NAME` (prompts for value, updates `.env.production`, reloads), or ship via a new encrypted seed + bumped guard version. Guide the owner through the **browser**: AWS Console → EC2 → Connect → EC2 Instance Connect — no .pem/SSH talk; 2-3 copy-paste lines in simple Hindi.

Verify from workspace: `curl https://bcplt20.com/api/healthz`; admin check via `x-bcpl-admin` header → 200 valid / 403 invalid; repeat ~6× to hit both cluster workers. `/api/admin/users` does NOT exist — authenticated-but-404 = route missing, not auth failure.

**EC2 prerequisites:** the video-validation worker needs ffmpeg/ffprobe (`sudo apt-get install -y ffmpeg`); without it validation ticks retry forever (`spawn ffprobe ENOENT`).

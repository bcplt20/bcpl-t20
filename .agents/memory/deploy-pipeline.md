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


## Deploy hardening (24 Jul 2026)
- drizzle push vs RDS: node `pg` needs `?sslmode=no-verify` — psql connects fine but drizzle-kit dies SILENTLY (exit 1, zero output) during "Pulling schema" because the spinner swallows the TLS/no-encryption error. deploy.sh builds PUSH_URL itself; probe recipe: tiny node Client connect with/without `ssl:{rejectUnauthorized:false}`.
- `push --force` is FORBIDDEN against prod: on "add unique constraint to table with N rows" drizzle offers TRUNCATE and --force can pick destructive answers. deploy.sh runs plain `push </dev/null`, gates on "Changes applied|No changes", and on failure re-runs under `script` pseudo-TTY + timeout so the abort output CONTAINS the pending question (owner forwards it — self-diagnosing).
- deploy/sql/*.sql = idempotent catch-up files auto-applied (ON_ERROR_STOP) before every push. Any new interactive push question → ship another catch-up file; never answer prompts by hand, never let the owner answer them.
- Owner-terminal traps: psql pager (less) eats the rest of a multi-line paste — always `export PAGER=cat` / `-P pager=off` in owner blocks. Capture interactive tools via `timeout N script -qec "cmd" /tmp/f` then sed-strip ANSI.

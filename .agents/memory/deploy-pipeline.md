---
name: BCPL deploy pipeline
description: How code reaches production bcplt20.com — and the push step that silently gets skipped
---

Production (bcplt20.com) = EC2 + nginx + PM2, pulls from GitHub `origin main` (repo bcplt20/bcpl-t20).

**Rule:** A commit in the Replit workspace is INVISIBLE to production until `git push origin main`. Platform task-merges also land only locally — they need a manual push too.

**Why:** An entire session of fixes ("nothing changed on the site!") turned out to be 5 unpushed commits; user redeployed EC2 twice against a stale GitHub.

**How to apply:** After every commit or task merge intended for production, immediately `git push origin main`, then give the user the EC2 deploy block:
```
cd /home/ubuntu/app && git pull origin main
pnpm --filter @workspace/bcpl-website run build
pnpm --filter @workspace/api-server run build
pm2 restart all --update-env
```
API startup runs idempotent DB migrations (e.g. reg_number backfill) against RDS automatically — no manual SQL needed on EC2.

**Secret rotation on EC2:** run `bash deploy/update-key.sh KEY_NAME` (prompts for value, updates `.env.production`, pm2 reload --update-env). Guide the user through the **browser**: AWS Console → EC2 → Instances → tick bcpl-server → Connect → EC2 Instance Connect — no .pem/SSH talk; give 2-3 copy-paste lines in simple Hinglish. Verify from workspace with curl against `https://bcplt20.com/api/admin/stats` (`x-bcpl-admin` header): valid secret → 200, anything else → 403. Repeat curls ~6x to cover both PM2 cluster workers. Note: `/api/admin/users` does NOT exist — authenticated-but-404 means route missing, not an auth failure.

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

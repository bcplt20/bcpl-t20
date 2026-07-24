---
name: PM2 env baked at start — JWT crash-loop 502
description: July 2026 prod outage anatomy — missing JWT_SECRET in PM2 env, crash-loop signature, recovery recipe, and the ecosystem.config.js self-load fix
---

- PM2 bakes `process.env.*` from the ecosystem file into each app at start/reload time. A bare `pm2 start|reload ecosystem.config.js` from a fresh SSH shell used to inject `undefined` for every secret → auth fail-fast (`JWT_SECRET must be set in production`) → ESM top-level throw → unhandledRejection → instant exit → PM2 crash-loop → nginx 502 on the whole site.
- **Why:** July 2026 outage. Crash-loop signature: `pm2 status` shows instances "online" with high restart count (↺ 40+) while `curl 127.0.0.1:4000` returns `000`. "online" ≠ listening — an import-time throw dies after PM2's min-uptime window. Always read the *error* logs (`pm2 logs --err`), not the out logs.
- **How to apply (fix shipped):** `deploy/ecosystem.config.js` now parses `/home/ubuntu/app/.env.production` itself (shell env wins; file is fallback), so a bare `pm2 start` can no longer wipe secrets. `deploy/deploy.sh` fail-fasts on DATABASE_URL / JWT_SECRET / SESSION_SECRET / ADMIN_SECRET **before** touching PM2, so a broken env file aborts the deploy while the old app keeps serving.
- **Recovery recipe** (if it ever recurs): `set -o allexport; source .env.production; set +o allexport` → `pm2 reload deploy/ecosystem.config.js --update-env` → verify `curl 127.0.0.1:4000/api/healthz` = 200 → `pm2 save` (so reboot + resurrect restores the GOOD env; never `pm2 save` while crash-looping).
- JWT_SECRET is NOT in Replit workspace secrets — it lives only in EC2 `.env.production` (+ timestamped `.env.production.backup-*` copies the seed step makes). If truly lost, generating a new one logs every player out (JWTs invalidated).

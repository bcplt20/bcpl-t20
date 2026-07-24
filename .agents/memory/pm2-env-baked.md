---
name: PM2 env baked at start — crash-loop 502 anatomy
description: How PM2 env baking + env-file corruption causes site-wide 502s; crash-loop signature; save-gating and recovery rules
---

- PM2 bakes `process.env.*` at start/reload. A reload from a shell missing a secret injects it empty → import-time fail-fast throw → instant-exit crash-loop → nginx 502 site-wide. Corruption and symptom can be DAYS apart: PM2 keeps a stale good value across `--update-env` reloads when the incoming value is undefined, masking a broken env file.
- **Crash-loop signature:** `pm2 status` "online" + high restart count (↺ 40+) while `curl 127.0.0.1:4000` = `000`. "online" ≠ listening — read the *error* logs.
- Env-file writers (seed appliers, repair scripts) must skip empty values and never print secret values (report key names/counts only).
- **`pm2 save` only when healthy:** a save during a crash-loop overwrites `dump.pm2` — the best recovery source for lost env values — with the broken env. deploy.sh/fix-env.sh therefore gate save on healthz 200 ×3 (covers both cluster workers). `dump.pm2.bak` holds the previous save; check it before declaring a key lost.
- **Recovery:** repair `.env.production` → `set -o allexport; source .env.production; set +o allexport` → `pm2 reload deploy/ecosystem.config.js --update-env` → healthz 200 → `pm2 save`. `ecosystem.config.js` self-loads `.env.production` as fallback, so a bare `pm2 start` can't wipe secrets.
- JWT_SECRET lives ONLY on EC2 (`.env.production` + timestamped backups), not in Replit secrets. If truly lost, rotating it logs every player out — owner decision, never automatic.

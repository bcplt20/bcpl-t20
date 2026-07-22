---
name: Stale lib/db dist declarations break typecheck
description: Why tsc reports "no exported member" from @workspace/db/schema after schema changes, and the fix
---

# Stale lib/db dist declarations

**Rule:** After adding/changing anything in `lib/db/src/schema/`, run `pnpm exec tsc --build lib/db --force` before trusting `tsc --noEmit` in api-server.

**Why:** api-server's tsconfig uses project references to `lib/db`. Typecheck resolves `@workspace/db/schema` types from `lib/db/dist/schema/index.d.ts` (untracked build output), NOT from src. If dist is stale, tsc reports phantom `TS2305: no exported member 'usersTable'` errors across every route file — even though runtime is fine (package.json `exports` points to `./src/schema/index.ts`, and api-server dev bundles src via esbuild `build.mjs`).

**How to apply:** Phantom "no exported member" errors from `@workspace/db/schema` ≠ real breakage. Rebuild lib/db first, then re-check. Runtime/dev server never uses lib/db/dist, so the app can work perfectly while typecheck lies.

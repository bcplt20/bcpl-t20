---
name: Express req.params typing quirk
description: In this repo req.params.X resolves to string | string[], breaking drizzle eq() typing — wrap in String()
---

# Express `req.params` typing quirk

**Rule:** In `artifacts/api-server`, `req.params.foo` (and sometimes `req.query.foo`) type-resolves to `string | string[]`, not `string`. Passing it straight into drizzle's `eq(column, req.params.foo)` fails `tsc` with overload errors.

**Why:** The installed Express type definitions in this monorepo resolve the generic params record loosely (observed July 2026 while building the teams routes). Runtime values are plain strings; only the types are loose.

**How to apply:** Wrap the value once at the top of the handler: `const id = String(req.params.id);` and use `id` everywhere. Prefer this over `as string` casts so behavior is safe even if an array ever arrives. When adding new routes, do this from the start — retrofitting via sed/Edit later risks corrupting files that contain `$` sequences (see edit-tool-dollar-quirk.md).

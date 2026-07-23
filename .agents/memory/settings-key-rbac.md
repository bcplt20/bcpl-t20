---
name: Settings key RBAC & payload-only role tokens
description: Per-key role map for site-settings writes; minting role JWTs for tests without admin_users rows
---

# Per-key settings RBAC + role tokens for tests

- Site-settings PUT is gated by a per-key role map in the settings router (`KEY_ROLES`): `sample_videos` → VIDEO_AI_OPERATIONS/CONTENT_TEAM, `homepage_config` → CONTENT_TEAM; keys absent from the map = any admin; SUPER_ADMIN always passes. **When adding a new settings key, decide its entry in this map** — forgetting it silently leaves the key writable by every admin.
- Admin identity is purely token-payload (`requireAdmin` does no DB lookup). `signAdminToken({email,name,role,cities?})` mints a fully valid role token **without any admin_users row**.

**Why:** stage-5 tests that created real admin_users rows raced other suites' table wipes; payload-only tokens made stage-6 RBAC tests parallel-safe.

**How to apply:** in vitest suites needing role-specific auth, import `signAdminToken` and mint tokens directly; never insert admin_users rows for auth purposes. Remember any change here also affects the static `x-bcpl-admin` super-admin path.

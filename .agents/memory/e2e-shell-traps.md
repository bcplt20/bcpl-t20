---
name: E2E shell traps (psql tags, bash UID, /tmp volatility)
description: Shell pitfalls that silently corrupt Phase 1 bash E2E suites after environment recycles
---

# E2E shell traps

1. **psql command tags corrupt captured values.** Some psql builds print the
   command tag (`INSERT 0 1`) even with `-tA`, so
   `X=$(psql -tAc "INSERT ... RETURNING id")` captures `uuid\nINSERT 0 1`.
   Always use `-qtAc` (`-q` suppresses tags).
   **Why:** after an environment recycle the psql build changed behavior and
   every seed helper silently broke (ids became multi-line garbage).
   **How to apply:** any shell that captures `RETURNING`/SELECT output.

2. **`UID` is a readonly bash builtin** (container user id, = 1000). Assigning
   `UID=$(...)` fails; the command substitution still runs (side effects
   happen!) but `$UID` stays 1000, producing absurd downstream SQL. Never name
   a shell variable `UID` (or `EUID`, `PPID`...).

3. **/tmp is wiped on environment recycle.** Throwaway test harnesses, ffmpeg
   clips, and generator scripts vanish. Durable E2E suites live in
   `artifacts/api-server/e2e/*.sh` (committed); they self-provision their
   ffmpeg test clips so a wipe only costs regeneration time.

4. The committed Phase 1 notification suite is
   `artifacts/api-server/e2e/phase1-results-notifications.sh` — reserved
   phones 6000000055-58, wipes them on entry/exit, forces testMode + full
   validity/score overrides so it never calls real Gemini even when
   GEMINI_API_KEY is set.

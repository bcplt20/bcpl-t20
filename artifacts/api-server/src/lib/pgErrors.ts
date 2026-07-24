/**
 * Postgres error introspection.
 *
 * Drizzle wraps the real pg error (code 23503, 23505, …) inside
 * DrizzleQueryError's .cause chain — the top-level message is useless for
 * diagnosis. This walks the chain and returns the first thing that looks
 * like a pg error so routes can react (and logs can say what ACTUALLY broke).
 */

export interface PgErrorInfo {
  code?: string;       // e.g. "23503" (foreign_key_violation), "23505" (unique_violation)
  table?: string;      // table the violation was raised on
  constraint?: string; // constraint name
  detail?: string;     // e.g. `Key (id)=(…) is still referenced from table "x".`
  message?: string;
}

/** Walk err.cause chain (bounded) for a pg-style error; null when none found. */
export function pgCauseOf(err: unknown): PgErrorInfo | null {
  let e = err as (PgErrorInfo & { cause?: unknown }) | null | undefined;
  for (let depth = 0; e && typeof e === "object" && depth < 8; depth++) {
    if (typeof e.code === "string" && /^[0-9A-Z]{5}$/.test(e.code)) {
      return { code: e.code, table: e.table, constraint: e.constraint, detail: e.detail, message: e.message };
    }
    e = e.cause as (PgErrorInfo & { cause?: unknown }) | null | undefined;
  }
  return null;
}

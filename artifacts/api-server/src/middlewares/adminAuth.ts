import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

/**
 * Admin gate — accepts either:
 *  1. x-bcpl-admin-token: <JWT issued by POST /api/admin/session>
 *  2. x-bcpl-admin: <ADMIN_SECRET env var>   (legacy / server-to-server)
 *
 * Sliding session: when a valid panel JWT is past HALF its lifetime, a
 * fresh 24h token is attached to the response as the
 * x-bcpl-admin-token-renewed header. The frontend swaps it in silently,
 * so an active admin is never logged out mid-work; ~24h with no
 * activity ends the session naturally.
 *
 * In development, if ADMIN_SECRET is not set, all admin endpoints
 * are open (dev convenience). In production always set ADMIN_SECRET.
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const sessionSecret = process.env.SESSION_SECRET || "dev-session-secret";

  // 1. Admin panel JWT (issued by /api/admin/session)
  const adminToken = req.headers["x-bcpl-admin-token"] as string | undefined;
  if (adminToken) {
    try {
      const payload = jwt.verify(adminToken, sessionSecret) as { admin?: boolean; iat?: number; exp?: number };
      if (payload?.admin === true) {
        // Sliding renewal: past half-life → re-issue on this response
        if (typeof payload.iat === "number" && typeof payload.exp === "number") {
          const nowSec = Math.floor(Date.now() / 1000);
          if (nowSec - payload.iat > (payload.exp - payload.iat) / 2) {
            const fresh = jwt.sign({ admin: true }, sessionSecret, { expiresIn: "24h" });
            res.setHeader("x-bcpl-admin-token-renewed", fresh);
            res.setHeader("Access-Control-Expose-Headers", "x-bcpl-admin-token-renewed");
          }
        }
        next();
        return;
      }
    } catch {
      // fall through
    }
  }

  // 2. Static secret header
  const secret = process.env.ADMIN_SECRET;
  const provided = req.headers["x-bcpl-admin"] as string | undefined;
  if (secret && provided === secret) { next(); return; }

  // 3. Dev convenience: no secret configured → allow
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      res.status(403).json({ error: "Admin access not configured" });
      return;
    }
    console.warn("[ADMIN] ADMIN_SECRET not set – endpoint is open in dev mode");
    next();
    return;
  }

  res.status(403).json({ error: "Forbidden – admin access denied" });
}

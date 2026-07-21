import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

/**
 * Admin gate — accepts either:
 *  1. x-bcpl-admin-token: <JWT issued by POST /api/admin/session>
 *  2. x-bcpl-admin: <ADMIN_SECRET env var>   (legacy / server-to-server)
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
      const payload = jwt.verify(adminToken, sessionSecret) as any;
      if (payload?.admin === true) { next(); return; }
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

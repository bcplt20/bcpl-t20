import type { Request, Response, NextFunction } from "express";

/**
 * Simple admin gate — checks for the header:
 *   x-bcpl-admin: <ADMIN_SECRET env var>
 *
 * In development, if ADMIN_SECRET is not set, all admin endpoints
 * are open (dev convenience). In production always set ADMIN_SECRET.
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const secret = process.env.ADMIN_SECRET;

  // Dev convenience: no secret configured → allow (log warning)
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      res.status(403).json({ error: "Admin access not configured" });
      return;
    }
    console.warn("[ADMIN] ADMIN_SECRET not set – endpoint is open in dev mode");
    next();
    return;
  }

  const provided = req.headers["x-bcpl-admin"];
  if (!provided || provided !== secret) {
    res.status(403).json({ error: "Forbidden – admin access denied" });
    return;
  }
  next();
}

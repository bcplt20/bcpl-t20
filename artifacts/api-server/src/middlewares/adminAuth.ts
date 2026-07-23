import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

/**
 * Admin gate — accepts either:
 *  1. x-bcpl-admin-token: <JWT issued by POST /api/admin/session>
 *  2. x-bcpl-admin: <ADMIN_SECRET env var>   (server-to-server only)
 *
 * Decision (2026-07-22): the website NEVER sends x-bcpl-admin anymore —
 * the VITE_ADMIN_KEY client fallback was removed so no admin key can be
 * baked into the JS bundle. The x-bcpl-admin header is intentionally kept
 * server-side for server-to-server/ops calls (curl, cron, scripts).
 *
 * Stage 5 RBAC: the session JWT now carries the admin's identity
 * (email/name/role/cities from admin_users). requireAdmin attaches it as
 * req.admin; requireRole() gates role-restricted routers. Legacy tokens
 * ({admin:true} only, issued before Stage 5) and the static secret header
 * are treated as SUPER_ADMIN so the owner is never locked out.
 *
 * Sliding session: when a valid panel JWT is past HALF its lifetime, a
 * fresh 24h token (same identity payload) is attached to the response as
 * the x-bcpl-admin-token-renewed header.
 *
 * In development, if ADMIN_SECRET is not set, all admin endpoints
 * are open (dev convenience). In production always set ADMIN_SECRET.
 */

export type AdminRoleName =
  | "SUPER_ADMIN"
  | "REGISTRATION_TEAM"
  | "PAYMENT_TEAM"
  | "VIDEO_AI_OPERATIONS"
  | "KYC_TEAM"
  | "TRIAL_CITY_MANAGER"
  | "CONTENT_TEAM"
  | "MATCH_OPERATIONS"
  | "SUPPORT_TEAM"
  | "FINANCE_TEAM";

export interface AdminIdentity {
  email: string;
  name: string;
  role: AdminRoleName;
  /** normalized lowercase; only meaningful for TRIAL_CITY_MANAGER */
  cities: string[];
  via: "jwt" | "secret" | "dev-open";
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      admin?: AdminIdentity;
    }
  }
}

interface AdminTokenPayload {
  admin?: boolean;
  email?: string;
  name?: string;
  role?: string;
  cities?: string[];
  iat?: number;
  exp?: number;
}

const ROLE_NAMES: readonly AdminRoleName[] = [
  "SUPER_ADMIN", "REGISTRATION_TEAM", "PAYMENT_TEAM", "VIDEO_AI_OPERATIONS",
  "KYC_TEAM", "TRIAL_CITY_MANAGER", "CONTENT_TEAM", "MATCH_OPERATIONS",
  "SUPPORT_TEAM", "FINANCE_TEAM",
];

function toRole(v: unknown): AdminRoleName {
  return ROLE_NAMES.includes(v as AdminRoleName) ? (v as AdminRoleName) : "SUPER_ADMIN";
}

function identityFromPayload(p: AdminTokenPayload, via: AdminIdentity["via"]): AdminIdentity {
  return {
    email: typeof p.email === "string" && p.email ? p.email : "owner@bcpl",
    name: typeof p.name === "string" && p.name ? p.name : "BCPL Admin",
    role: toRole(p.role),
    cities: Array.isArray(p.cities) ? p.cities.map((c) => String(c).trim().toLowerCase()).filter(Boolean) : [],
    via,
  };
}

const SUPER_IDENTITY = (via: AdminIdentity["via"]): AdminIdentity =>
  ({ email: "owner@bcpl", name: "BCPL Admin", role: "SUPER_ADMIN", cities: [], via });

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const sessionSecret = process.env.SESSION_SECRET || "dev-session-secret";

  // 1. Admin panel JWT (issued by /api/admin/session)
  const adminToken = req.headers["x-bcpl-admin-token"] as string | undefined;
  if (adminToken) {
    try {
      const payload = jwt.verify(adminToken, sessionSecret) as AdminTokenPayload;
      if (payload?.admin === true) {
        req.admin = identityFromPayload(payload, "jwt");
        // Sliding renewal: past half-life → re-issue on this response,
        // carrying the SAME identity payload forward.
        if (typeof payload.iat === "number" && typeof payload.exp === "number") {
          const nowSec = Math.floor(Date.now() / 1000);
          if (nowSec - payload.iat > (payload.exp - payload.iat) / 2) {
            const fresh = jwt.sign({
              admin: true,
              email: req.admin.email, name: req.admin.name,
              role: req.admin.role, cities: req.admin.cities,
            }, sessionSecret, { expiresIn: "24h" });
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

  // 2. Static secret header (server-to-server) → full access
  const secret = process.env.ADMIN_SECRET;
  const provided = req.headers["x-bcpl-admin"] as string | undefined;
  if (secret && provided === secret) {
    req.admin = SUPER_IDENTITY("secret");
    next();
    return;
  }

  // 3. Dev convenience: no secret configured → allow
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      res.status(403).json({ error: "Admin access not configured" });
      return;
    }
    console.warn("[ADMIN] ADMIN_SECRET not set – endpoint is open in dev mode");
    req.admin = SUPER_IDENTITY("dev-open");
    next();
    return;
  }

  res.status(403).json({ error: "Forbidden – admin access denied" });
}

/**
 * Role gate for routers/routes that must not be open to every admin.
 * SUPER_ADMIN always passes. Use AFTER requireAdmin.
 */
export function requireRole(...roles: AdminRoleName[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const role = req.admin?.role;
    if (role === "SUPER_ADMIN" || (role && roles.includes(role))) {
      next();
      return;
    }
    res.status(403).json({ error: "Forbidden — your admin role does not allow this action" });
  };
}

/**
 * City scope for TRIAL_CITY_MANAGER: returns normalized lowercase city
 * list the admin may touch, or null = unrestricted (all other roles).
 * An empty array means "role is city-scoped but no cities assigned" —
 * callers must treat that as no access, not full access.
 */
export function trialCityScope(req: Request): string[] | null {
  const a = req.admin;
  if (!a || a.role !== "TRIAL_CITY_MANAGER") return null;
  return (a.cities ?? []).map((c) => c.trim().toLowerCase()).filter(Boolean);
}

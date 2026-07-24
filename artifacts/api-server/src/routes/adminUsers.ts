/**
 * Stage 5 — server-side RBAC: admin_users CRUD (replaces the old
 * localStorage-only co-admin list in the panel).
 *
 *  - Passwords: scrypt (salt:hash hex), never stored or logged in plain.
 *  - Roles: spec's 10 roles; SUPER_ADMIN sees everything.
 *  - TRIAL_CITY_MANAGER additionally carries a city allow-list that the
 *    trials endpoints enforce server-side (see trialCityScope()).
 *  - Every mutation writes an audit row (password hash never included).
 *  - The last active SUPER_ADMIN cannot be demoted/deactivated/deleted —
 *    combined with the legacy ADMIN_PANEL_PASSWORD fallback this makes
 *    owner lockout impossible.
 */
import { Router } from "express";
import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import { db } from "@workspace/db";
import { adminUsersTable, ADMIN_ROLES } from "@workspace/db/schema";
import type { AdminUserRecord } from "@workspace/db/schema";
import { and, asc, eq, ne, sql } from "drizzle-orm";
import { requireAdmin, requireRole } from "../middlewares/adminAuth";
import type { AdminRoleName } from "../middlewares/adminAuth";
import { writeAudit } from "../lib/audit";
import { logger } from "../lib/logger";

export async function ensureAdminUsersTable(): Promise<void> {
  await db.execute(sql`CREATE TABLE IF NOT EXISTS admin_users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email varchar(160) NOT NULL UNIQUE,
    name varchar(120) NOT NULL,
    password_hash varchar(300) NOT NULL,
    role varchar(40) NOT NULL DEFAULT 'SUPPORT_TEAM',
    cities jsonb NOT NULL DEFAULT '[]'::jsonb,
    active boolean NOT NULL DEFAULT true,
    last_login_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
  )`);
}

/* ── password hashing (scrypt, node:crypto — no plaintext ever) ────── */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  try {
    const test = crypto.scryptSync(password, salt, 64);
    const expected = Buffer.from(hash, "hex");
    return test.length === expected.length && crypto.timingSafeEqual(test, expected);
  } catch {
    return false;
  }
}

/* ── role → panel views (single source of truth; frontend receives this
      via the session response, never invents its own mapping) ───────── */
export const ROLE_VIEWS: Record<AdminRoleName, string[]> = {
  SUPER_ADMIN:        ["all"],
  REGISTRATION_TEAM:  ["dashboard", "phase1_regs", "users", "player_profiles", "support"],
  PAYMENT_TEAM:       ["dashboard", "finance", "phase1_regs", "phase2_kyc", "player_profiles"],
  VIDEO_AI_OPERATIONS:["dashboard", "video_review", "selection", "leaderboard", "player_profiles"],
  KYC_TEAM:           ["dashboard", "phase2_kyc", "player_profiles", "fraud"],
  TRIAL_CITY_MANAGER: ["dashboard", "trial_cities", "player_profiles"],
  CONTENT_TEAM:       ["dashboard", "media", "banners", "cms", "sponsors", "content_cal", "whatsapp_tpl", "seo", "marketing"],
  MATCH_OPERATIONS:   ["dashboard", "matches", "live_scoring", "teams", "auction", "contracts", "leaderboard"],
  SUPPORT_TEAM:       ["dashboard", "support", "users", "player_profiles"],
  FINANCE_TEAM:       ["dashboard", "finance", "forecast", "data_export"],
  /* Trial-day field staff — they work in the mobile staff app (/staff),
     NOT the admin panel. "staff_app" is not an admin panel view, so the
     panel shows them nothing; the /api/staff endpoints gate by role. */
  GATE_SECURITY:      ["staff_app"],
  CHECKIN_STAFF:      ["staff_app"],
  STATION_OPERATOR:   ["staff_app"],
  TRIAL_EVALUATOR:    ["staff_app"],
  VENUE_SUPERVISOR:   ["staff_app"],
  HEAD_ASSESSOR:      ["staff_app"],
};

export function permissionsForRole(role: string): string[] {
  return ROLE_VIEWS[role as AdminRoleName] ?? ["dashboard"];
}

export function publicAdmin(a: AdminUserRecord) {
  return {
    id: a.id, email: a.email, name: a.name, role: a.role,
    cities: a.cities ?? [], active: a.active,
    lastLoginAt: a.lastLoginAt, createdAt: a.createdAt,
    permissions: permissionsForRole(a.role),
  };
}

export function signAdminToken(a: { email: string; name: string; role: string; cities?: string[] | null }): string {
  const sessionSecret = process.env.SESSION_SECRET || "dev-session-secret";
  return jwt.sign(
    { admin: true, email: a.email, name: a.name, role: a.role, cities: a.cities ?? [] },
    sessionSecret,
    { expiresIn: "24h" },
  );
}

function normCities(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return [...new Set(v.map((c) => String(c).trim().toLowerCase()).filter(Boolean))].slice(0, 50);
}

const isRole = (v: unknown): v is AdminRoleName => ADMIN_ROLES.includes(v as never);

/** true when at least one OTHER active SUPER_ADMIN row would remain */
async function otherActiveSuperExists(excludeId: string): Promise<boolean> {
  const [row] = await db.select({ n: sql<number>`count(*)::int` }).from(adminUsersTable)
    .where(and(eq(adminUsersTable.role, "SUPER_ADMIN"), eq(adminUsersTable.active, true), ne(adminUsersTable.id, excludeId)));
  return (row?.n ?? 0) > 0;
}

export const adminUsersRouter = Router();
adminUsersRouter.use(requireAdmin);
adminUsersRouter.use(requireRole()); // SUPER_ADMIN only (requireRole always passes SUPER_ADMIN)

/* GET / — list (never returns password hashes) */
adminUsersRouter.get("/", async (_req, res) => {
  try {
    const rows = await db.select().from(adminUsersTable).orderBy(asc(adminUsersTable.createdAt));
    res.json({ admins: rows.map(publicAdmin), roles: ADMIN_ROLES, roleViews: ROLE_VIEWS });
  } catch (e) {
    logger.error({ err: e }, "admin-users list failed");
    res.status(500).json({ error: "Failed to load admin users" });
  }
});

/* POST / — create */
adminUsersRouter.post("/", async (req, res) => {
  try {
    const b = (req.body ?? {}) as Record<string, unknown>;
    const email = String(b["email"] ?? "").trim().toLowerCase();
    const name = String(b["name"] ?? "").trim();
    const role = b["role"];
    const password = String(b["password"] ?? "");
    if (!email || !email.includes("@") || email.length > 160) { res.status(400).json({ error: "Valid email required" }); return; }
    if (!name) { res.status(400).json({ error: "Name required" }); return; }
    if (!isRole(role)) { res.status(400).json({ error: "Invalid role" }); return; }
    if (password.length < 8) { res.status(400).json({ error: "Password must be at least 8 characters" }); return; }
    const cities = normCities(b["cities"]);
    if (role === "TRIAL_CITY_MANAGER" && cities.length === 0) {
      res.status(400).json({ error: "TRIAL_CITY_MANAGER needs at least one city" }); return;
    }
    const [row] = await db.insert(adminUsersTable).values({
      email, name, role, cities, passwordHash: hashPassword(password),
    }).returning();
    void writeAudit(req, { action: "admin_user.create", entity: "admin_users", entityKey: email, newValue: { email, name, role, cities } });
    res.status(201).json({ admin: publicAdmin(row) });
  } catch (e) {
    const cause = (e as { cause?: { code?: string } })?.cause;
    if (cause?.code === "23505") { res.status(409).json({ error: "An admin with this email already exists" }); return; }
    logger.error({ err: e }, "admin-users create failed");
    res.status(500).json({ error: "Failed to create admin user" });
  }
});

/* PATCH /:id — update name/role/cities/active/password */
adminUsersRouter.patch("/:id", async (req, res) => {
  try {
    const id = String(req.params["id"]);
    const b = (req.body ?? {}) as Record<string, unknown>;
    const [existing] = await db.select().from(adminUsersTable).where(eq(adminUsersTable.id, id)).limit(1);
    if (!existing) { res.status(404).json({ error: "Admin user not found" }); return; }

    const patch: Partial<typeof adminUsersTable.$inferInsert> = { updatedAt: new Date() };
    if (b["name"] !== undefined) {
      const name = String(b["name"]).trim();
      if (!name) { res.status(400).json({ error: "Name cannot be empty" }); return; }
      patch.name = name;
    }
    if (b["role"] !== undefined) {
      if (!isRole(b["role"])) { res.status(400).json({ error: "Invalid role" }); return; }
      patch.role = b["role"];
    }
    if (b["cities"] !== undefined) patch.cities = normCities(b["cities"]);
    if (b["active"] !== undefined) patch.active = b["active"] !== false;
    if (b["password"] !== undefined) {
      const pw = String(b["password"]);
      if (pw.length < 8) { res.status(400).json({ error: "Password must be at least 8 characters" }); return; }
      patch.passwordHash = hashPassword(pw);
    }
    const finalRole = patch.role ?? existing.role;
    const finalCities = patch.cities ?? (existing.cities ?? []);
    if (finalRole === "TRIAL_CITY_MANAGER" && finalCities.length === 0) {
      res.status(400).json({ error: "TRIAL_CITY_MANAGER needs at least one city" }); return;
    }

    /* last-SUPER_ADMIN protection */
    const losesSuper = existing.role === "SUPER_ADMIN" && existing.active &&
      ((patch.role !== undefined && patch.role !== "SUPER_ADMIN") || patch.active === false);
    if (losesSuper && !(await otherActiveSuperExists(id))) {
      res.status(409).json({ error: "Cannot demote/deactivate the last active SUPER_ADMIN" }); return;
    }

    const [row] = await db.update(adminUsersTable).set(patch).where(eq(adminUsersTable.id, id)).returning();
    void writeAudit(req, {
      action: "admin_user.update", entity: "admin_users", entityKey: existing.email,
      oldValue: { name: existing.name, role: existing.role, cities: existing.cities, active: existing.active },
      newValue: { name: row.name, role: row.role, cities: row.cities, active: row.active, passwordChanged: b["password"] !== undefined },
    });
    res.json({ admin: publicAdmin(row) });
  } catch (e) {
    logger.error({ err: e }, "admin-users update failed");
    res.status(500).json({ error: "Failed to update admin user" });
  }
});

/* DELETE /:id */
adminUsersRouter.delete("/:id", async (req, res) => {
  try {
    const id = String(req.params["id"]);
    const [existing] = await db.select().from(adminUsersTable).where(eq(adminUsersTable.id, id)).limit(1);
    if (!existing) { res.status(404).json({ error: "Admin user not found" }); return; }
    if (existing.role === "SUPER_ADMIN" && existing.active && !(await otherActiveSuperExists(id))) {
      res.status(409).json({ error: "Cannot delete the last active SUPER_ADMIN" }); return;
    }
    await db.delete(adminUsersTable).where(eq(adminUsersTable.id, id));
    void writeAudit(req, {
      action: "admin_user.delete", entity: "admin_users", entityKey: existing.email,
      oldValue: { email: existing.email, name: existing.name, role: existing.role },
    });
    res.json({ success: true });
  } catch (e) {
    logger.error({ err: e }, "admin-users delete failed");
    res.status(500).json({ error: "Failed to delete admin user" });
  }
});

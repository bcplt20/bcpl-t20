/**
 * Consent audit persistence (legal overhaul):
 *  - recordConsentKey does an ATOMIC jsonb merge — the phase1 & phase2 keys
 *    never clobber each other, even written concurrently or after stale reads.
 *  - acceptedAt is server-stamped ISO; re-acceptance overwrites only its key.
 * Pure DB behavior — no payment gateway calls, no notifications possible.
 */
import { describe, it, expect, afterAll } from "vitest";
import { eq } from "drizzle-orm";

process.env.SESSION_SECRET = process.env.SESSION_SECRET || "test-session-secret-for-vitest";

const { recordConsentKey } = await import("../src/routes/payment");
const { db } = await import("@workspace/db");
const { usersTable, registrationsTable } = await import("@workspace/db/schema");

const suffix = String(Date.now()).slice(-7);
const phone = "97" + String(Date.now()).slice(-8); // unique per run, never messaged
const email = `consent-${suffix}@test.bcpl`;

let userId = "";
let regId = "";

afterAll(async () => {
  if (regId) await db.delete(registrationsTable).where(eq(registrationsTable.id, regId));
  if (userId) await db.delete(usersTable).where(eq(usersTable.id, userId));
});

async function readConsents(id: string): Promise<any> {
  const [row] = await db.select({ consents: registrationsTable.consents })
    .from(registrationsTable).where(eq(registrationsTable.id, id));
  return row.consents;
}

describe("consent audit — registrations.consents jsonb", () => {
  it("records phase1 consent with versions, opt-in and acceptedAt", async () => {
    [{ id: userId }] = await db.insert(usersTable)
      .values({ name: "Consent Audit Test", phone, email, isVerified: true })
      .returning({ id: usersTable.id });
    [{ id: regId }] = await db.insert(registrationsTable)
      .values({ userId, role: "bat", trialCity: "Delhi" })
      .returning({ id: registrationsTable.id });

    await recordConsentKey(regId, "phase1", {
      documentVersion: "terms-v2.0+privacy-v2.0",
      termsVersion: "2.0",
      privacyVersion: "2.0",
      marketingOptIn: false,
      acceptedAt: new Date().toISOString(),
    });

    const c = await readConsents(regId);
    expect(c.phase1.documentVersion).toBe("terms-v2.0+privacy-v2.0");
    expect(c.phase1.termsVersion).toBe("2.0");
    expect(c.phase1.privacyVersion).toBe("2.0");
    expect(c.phase1.marketingOptIn).toBe(false);
    expect(new Date(c.phase1.acceptedAt).getTime()).toBeGreaterThan(0);
  });

  it("phase2 write merges alongside phase1 — nothing clobbered", async () => {
    await recordConsentKey(regId, "phase2", {
      documentVersion: "phase2-declarations-v2.0",
      items: ["declaration one", "declaration two"],
      acceptedAt: new Date().toISOString(),
    });
    const c = await readConsents(regId);
    expect(c.phase1.termsVersion).toBe("2.0"); // survived
    expect(c.phase2.documentVersion).toBe("phase2-declarations-v2.0");
    expect(c.phase2.items).toHaveLength(2);
  });

  it("re-acceptance overwrites only its own key (marketing opt-in flip)", async () => {
    await recordConsentKey(regId, "phase1", {
      documentVersion: "terms-v2.0+privacy-v2.0",
      termsVersion: "2.0",
      privacyVersion: "2.0",
      marketingOptIn: true,
      acceptedAt: new Date().toISOString(),
    });
    const c = await readConsents(regId);
    expect(c.phase1.marketingOptIn).toBe(true);
    expect(c.phase2.documentVersion).toBe("phase2-declarations-v2.0"); // untouched
  });

  it("concurrent phase1 + phase2 writes both land (atomic merge)", async () => {
    const [reg2] = await db.insert(registrationsTable)
      .values({ userId, role: "ar", trialCity: "Mumbai" })
      .returning({ id: registrationsTable.id });
    try {
      await Promise.all([
        recordConsentKey(reg2.id, "phase1", { termsVersion: "2.0", acceptedAt: new Date().toISOString() }),
        recordConsentKey(reg2.id, "phase2", { items: ["x"], acceptedAt: new Date().toISOString() }),
      ]);
      const c = await readConsents(reg2.id);
      expect(c.phase1?.termsVersion).toBe("2.0");
      expect(c.phase2?.items).toEqual(["x"]);
    } finally {
      await db.delete(registrationsTable).where(eq(registrationsTable.id, reg2.id));
    }
  });
});

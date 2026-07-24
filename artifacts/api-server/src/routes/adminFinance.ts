/**
 * Admin finance read-model — payment-method split + payments on hold, plus the
 * real Cashfree gateway fees / settlements (Task #38).
 *
 * Deliberately a separate router (mounted at /api/admin/finance, BEFORE the
 * catch-all /admin router) so it does not touch routes/admin.ts. The payment
 * split aggregation lives in adminTools.ts alongside the sibling finance tools;
 * this file wires it under /admin/finance and adds the settlements endpoint.
 */
import { Router, type IRouter, type Request, type Response } from "express";
import { db } from "@workspace/db";
import { siteSettingsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { requireAdmin } from "../middlewares/adminAuth";
import { financeSummaryHandler } from "./adminTools";
import { fetchSettlementSummary, hasCashfreeCredentials, type SettlementSummary } from "../lib/cashfree";
import { logger } from "../lib/logger";

const router: IRouter = Router();
router.use(requireAdmin);

// GET /api/admin/finance/summary
router.get("/summary", financeSummaryHandler);

/* ── Cashfree settlements cache (site_settings jsonb, no schema push) ──
 * The Settlements/Recon API is only reachable from whitelisted PROD IPs, so we
 * cache the last good aggregate here and serve it (clearly stamped with its
 * fetch time) between refreshes. In dev/stub the fetch returns configured:false
 * and the frontend falls back to a labelled 2% estimate. */
const SETTLEMENTS_KEY = "cashfree_settlements_cache";
const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6h — settlements post ~T+1, no need to hammer

type CachedSettlements = SettlementSummary & { cachedAt: string };

async function readCache(): Promise<CachedSettlements | null> {
  const rows = await db.select().from(siteSettingsTable)
    .where(eq(siteSettingsTable.key, SETTLEMENTS_KEY)).limit(1);
  const value = rows[0]?.value as unknown as CachedSettlements | undefined;
  return value ?? null;
}

async function writeCache(summary: SettlementSummary): Promise<CachedSettlements> {
  const cached: CachedSettlements = { ...summary, cachedAt: summary.fetchedAt };
  const now = new Date();
  await db.insert(siteSettingsTable)
    .values({ key: SETTLEMENTS_KEY, value: cached as unknown as Record<string, unknown>, updatedAt: now })
    .onConflictDoUpdate({
      target: siteSettingsTable.key,
      set: { value: cached as unknown as Record<string, unknown>, updatedAt: now },
    });
  return cached;
}

/**
 * GET /api/admin/finance/settlements[?refresh=1][&from=YYYY-MM-DD&to=YYYY-MM-DD]
 *
 * Returns real Cashfree gateway fees / settlement totals. Uses the cached
 * aggregate unless it is stale or ?refresh=1 is passed, in which case it hits
 * Cashfree (PROD only) and updates the cache. Never throws to the client — on
 * any provider failure it serves the last cache (if any) with fromCache:true.
 */
router.get("/settlements", async (req: Request, res: Response) => {
  const refresh = String(req.query.refresh ?? "") === "1";
  const from = req.query.from ? String(req.query.from) : undefined;
  const to = req.query.to ? String(req.query.to) : undefined;

  try {
    const cache = await readCache();

    // Dev/stub: no real creds → tell the frontend to use the labelled estimate.
    if (!hasCashfreeCredentials()) {
      return void res.json({
        configured: false,
        fromCache: false,
        settlements: cache ?? null,
        message: "Cashfree not configured on this server — showing 2% estimate.",
      });
    }

    const fresh = cache?.cachedAt
      ? Date.now() - new Date(cache.cachedAt).getTime()
      : Number.POSITIVE_INFINITY;
    const dateFiltered = Boolean(from && to);

    // Serve cache when it is recent and the caller isn't forcing a refresh or a
    // specific date window.
    if (cache && !refresh && !dateFiltered && fresh < CACHE_TTL_MS) {
      return void res.json({ configured: true, fromCache: true, settlements: cache });
    }

    const summary = await fetchSettlementSummary({ from, to });
    if (!summary) {
      // Provider unreachable — fall back to the last good cache if we have one.
      if (cache) {
        return void res.json({
          configured: true, fromCache: true, settlements: cache,
          message: "Cashfree settlements API unreachable — showing last cached values.",
        });
      }
      return void res.json({
        configured: true, fromCache: false, settlements: null,
        message: "Cashfree settlements API unreachable — showing 2% estimate.",
      });
    }

    // Persist only the un-date-filtered, real aggregate as the standing cache.
    const stored = dateFiltered ? { ...summary, cachedAt: summary.fetchedAt } : await writeCache(summary);
    return void res.json({ configured: summary.configured, fromCache: false, settlements: stored });
  } catch (err) {
    logger.error({ err }, "finance/settlements failed");
    return void res.status(500).json({ error: "Failed to load settlements" });
  }
});

export default router;

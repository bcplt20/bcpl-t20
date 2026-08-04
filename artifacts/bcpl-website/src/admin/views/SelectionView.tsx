/**
 * Final 600 Selection Engine — admin view.
 *
 * Workflow (Hindi-friendly microcopy, dark theme, inline styles — matches
 * TrialsOps.tsx): aggregates दिखते हैं पहले → फिर CLOSE PHYSICAL TRIALS →
 * GENERATE (background job, progress polling) → PREVIEW (cursor pagination +
 * constraint-exception panel) → APPROVE → PUBLISH. तीनों actions confirm step
 * के साथ. Millions players को कभी एक screen पर नहीं दिखाते — सिर्फ aggregates
 * और selected 600 का paginated preview.
 */
import { useState, useEffect, useCallback, useRef } from "react";
import {
  adminGetSelectionConfig, adminGetSelectionAggregates, adminCloseSelectionTrials,
  adminReopenSelectionTrials, adminListSelectionBatches, adminGetSelectionBatch,
  adminGetSelectionMembers, adminGenerateSelection, adminRetrySelection,
  adminApproveSelection, adminPublishSelection,
  type SelectionConfigDTO, type SelectionAggregates, type SelectionBatchDTO, type SelectionMemberDTO,
} from "../../lib/api";

const card: React.CSSProperties = {
  background: "linear-gradient(135deg,#0D1526,#0A1020)",
  border: "1px solid #1E293B", borderRadius: 16, padding: 20,
};
const btn = (bg: string, color = "#fff"): React.CSSProperties => ({
  padding: "9px 16px", borderRadius: 9, border: "none", background: bg, color,
  fontSize: 12.5, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap",
});
const ghost: React.CSSProperties = {
  padding: "7px 12px", borderRadius: 8, border: "1px solid #1E293B", background: "transparent",
  color: "#94A3B8", fontSize: 12, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap",
};
const inp: React.CSSProperties = {
  padding: "8px 11px", borderRadius: 9, border: "1px solid #1E293B",
  background: "#060B18", color: "#E2E8F0", fontSize: 13, outline: "none",
};
const th: React.CSSProperties = { textAlign: "left", padding: "8px 10px", fontSize: 10.5, color: "#64748B", letterSpacing: 0.8, textTransform: "uppercase", borderBottom: "1px solid #1E293B", whiteSpace: "nowrap" };
const td: React.CSSProperties = { padding: "9px 10px", fontSize: 12.5, color: "#CBD5E1", borderBottom: "1px solid #131C2E", verticalAlign: "middle" };
const chip = (bg: string, c: string): React.CSSProperties => ({ display: "inline-block", padding: "2px 9px", borderRadius: 99, fontSize: 10.5, fontWeight: 700, background: bg, color: c, whiteSpace: "nowrap" });
const errBox: React.CSSProperties = { background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", color: "#FCA5A5", borderRadius: 10, padding: "10px 14px", fontSize: 12.5, marginBottom: 14 };
const okBox: React.CSSProperties = { background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.25)", color: "#6EE7B7", borderRadius: 10, padding: "10px 14px", fontSize: 12.5, marginBottom: 14 };

const roleLabel = (r: string) => ({ bat: "Batsman", bowl: "Bowler", ar: "All-Rounder", wk: "Wicketkeeper" }[r] ?? r);
const statusChip = (s: string) => {
  const m: Record<string, [string, string]> = {
    draft: ["rgba(100,116,139,0.15)", "#94A3B8"],
    generating: ["rgba(245,158,11,0.12)", "#FBBF24"],
    preview_ready: ["rgba(59,130,246,0.12)", "#60A5FA"],
    approved: ["rgba(168,85,247,0.12)", "#C084FC"],
    published: ["rgba(16,185,129,0.12)", "#6EE7B7"],
    failed: ["rgba(239,68,68,0.12)", "#FCA5A5"],
    invalidated: ["rgba(100,116,139,0.15)", "#64748B"],
  };
  const [bg, c] = m[s] ?? ["rgba(100,116,139,0.15)", "#94A3B8"];
  return chip(bg, c);
};
const PROGRESS_LABELS: Record<string, string> = {
  preparing_population: "Eligible population तैयार हो रही है",
  ranking: "Players को rank किया जा रहा है",
  zonal_allocation: "Zonal allocation लगाई जा रही है",
  wildcards: "National wildcards चुने जा रहे हैं",
  validating: "Constraints validate हो रहे हैं",
  preview_ready: "Preview तैयार",
};

export default function SelectionView() {
  const [config, setConfig] = useState<SelectionConfigDTO | null>(null);
  const [computedTotal, setComputedTotal] = useState(0);
  const [agg, setAgg] = useState<SelectionAggregates | null>(null);
  const [batches, setBatches] = useState<SelectionBatchDTO[]>([]);
  const [activeBatch, setActiveBatch] = useState<SelectionBatchDTO | null>(null);
  const [members, setMembers] = useState<SelectionMemberDTO[]>([]);
  const [cursor, setCursor] = useState<number | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [filters, setFilters] = useState<{ zone: string; role: string; pool: string }>({ zone: "", role: "", pool: "" });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const seasonKey = config?.seasonKey;

  const loadTop = useCallback(async () => {
    setErr("");
    try {
      const c = await adminGetSelectionConfig();
      setConfig(c.config); setComputedTotal(c.computedTargetTotal);
      const [a, b] = await Promise.all([
        adminGetSelectionAggregates(c.config.seasonKey),
        adminListSelectionBatches(c.config.seasonKey),
      ]);
      setAgg(a); setBatches(b.batches);
      // auto-open the newest non-invalidated batch
      const open = b.batches.find(x => x.status !== "invalidated");
      if (open) setActiveBatch(open);
    } catch (e) { setErr(e instanceof Error ? e.message : String(e)); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { loadTop(); }, [loadTop]);

  const loadMembers = useCallback(async (batchId: string, reset: boolean) => {
    const r = await adminGetSelectionMembers(batchId, {
      cursor: reset ? 0 : (cursor ?? 0), limit: 50,
      zone: filters.zone || undefined, role: filters.role || undefined, pool: filters.pool || undefined,
    });
    setMembers(prev => reset ? r.members : [...prev, ...r.members]);
    setCursor(r.nextCursor); setHasMore(r.hasMore);
  }, [cursor, filters]);

  // load members when a preview_ready/approved/published batch is opened or filters change
  useEffect(() => {
    if (activeBatch && ["preview_ready", "approved", "published"].includes(activeBatch.status)) {
      setMembers([]); setCursor(0);
      loadMembers(activeBatch.id, true).catch(e => setErr(String(e)));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeBatch?.id, activeBatch?.status, filters.zone, filters.role, filters.pool]);

  // poll job progress while generating
  useEffect(() => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    if (activeBatch?.status === "generating") {
      pollRef.current = setInterval(async () => {
        try {
          const r = await adminGetSelectionBatch(activeBatch.id);
          setActiveBatch(r.batch);
          if (r.batch.status !== "generating") {
            await loadTop();
          }
        } catch { /* transient */ }
      }, 2000);
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeBatch?.id, activeBatch?.status]);

  const wrap = async (fn: () => Promise<void>, ok: string) => {
    setBusy(true); setErr(""); setMsg("");
    try { await fn(); setMsg(ok); }
    catch (e) { setErr(e instanceof Error ? e.message : String(e)); }
    finally { setBusy(false); }
  };

  const closed = agg?.closure.status === "closed";

  const doClose = () => {
    if (!window.confirm("Physical trials CLOSE करें? इसके बाद नए/देर से आए records इस selection population में नहीं जाएँगे (frozen snapshot)।")) return;
    wrap(async () => { await adminCloseSelectionTrials(seasonKey); await loadTop(); }, "Physical trials closed — population snapshot frozen");
  };
  const doReopen = () => {
    if (!window.confirm("Trials REOPEN करें? सभी unpublished selection batches invalidate हो जाएँगी और नई version बनानी होगी।")) return;
    wrap(async () => { const r = await adminReopenSelectionTrials(seasonKey); await loadTop(); setMsg(`Trials reopened · ${r.invalidatedBatches} batch(es) invalidated`); }, "");
  };
  const doGenerate = () => {
    if (!window.confirm("GENERATE FINAL 600 शुरू करें? Background job चलेगा — browser बंद करने पर भी job चलता रहेगा।")) return;
    wrap(async () => { const r = await adminGenerateSelection(seasonKey); await loadTop(); const b = (await adminGetSelectionBatch(r.batchId)).batch; setActiveBatch(b); }, "Selection job शुरू हो गया");
  };
  const doRetry = (id: string) => {
    if (!window.confirm("इस failed batch को RETRY करें? पुराने partial results हटा कर fresh run होगा (idempotent)।")) return;
    wrap(async () => { await adminRetrySelection(id); const b = (await adminGetSelectionBatch(id)).batch; setActiveBatch(b); await loadTop(); }, "Retry शुरू");
  };
  const doApprove = (id: string) => {
    if (!window.confirm("इस Final 600 को APPROVE करें? एक season में सिर्फ एक approved batch हो सकती है।")) return;
    wrap(async () => { await adminApproveSelection(id); await loadTop(); const b = (await adminGetSelectionBatch(id)).batch; setActiveBatch(b); }, "Batch approved");
  };
  const doPublish = (id: string) => {
    if (!window.confirm("इस approved batch को PUBLISH करें? Status published होगा (players को अभी कोई notification नहीं जाएगा)।")) return;
    wrap(async () => { await adminPublishSelection(id); await loadTop(); const b = (await adminGetSelectionBatch(id)).batch; setActiveBatch(b); }, "Batch published (status only — no notifications)");
  };

  if (loading) return <div style={{ color: "#64748B", padding: 40, textAlign: "center" }}>Loading Final 600 engine…</div>;

  const counts = (activeBatch?.counts ?? {}) as Record<string, any>;
  const exceptions = activeBatch?.exceptionReport ?? [];

  return (
    <div style={{ display: "grid", gap: 18, maxWidth: 1200 }}>
      <div>
        <div style={{ fontSize: 20, fontWeight: 900, color: "#F8FAFC" }}>Final 600 Selection Engine</div>
        <div style={{ fontSize: 12.5, color: "#64748B", marginTop: 4 }}>
          Rank-based · zone + role constrained · deterministic. Season <b style={{ color: "#CBD5E1" }}>{config?.seasonKey}</b> ·
          Target pool <b style={{ color: "#CBD5E1" }}>{computedTotal}</b> (config: {config?.totalPool}).
        </div>
      </div>

      {err && <div style={errBox}>{err}</div>}
      {msg && !err && <div style={okBox}>{msg}</div>}

      {/* ── config summary ── */}
      {config && (
        <div style={card}>
          <div style={{ fontSize: 13, fontWeight: 800, color: "#E2E8F0", marginBottom: 10 }}>⚙️ Selection Configuration (read-only — Admin Settings से बदलें)</div>
          <div style={{ display: "flex", gap: 24, flexWrap: "wrap", fontSize: 12.5, color: "#CBD5E1" }}>
            <div>Per-zone / role: <b>{config.perZoneRoleQuota.bat}/{config.perZoneRoleQuota.bowl}/{config.perZoneRoleQuota.ar}/{config.perZoneRoleQuota.wk}</b> × 5 zones</div>
            <div>Wildcards: <b>{config.wildcardRoleQuota.bat}/{config.wildcardRoleQuota.bowl}/{config.wildcardRoleQuota.ar}/{config.wildcardRoleQuota.wk}</b></div>
            <div>Zone map: <b>{config.zoneMappingVersion}</b></div>
            <div>Tie-breakers: <b>{config.tieBreakers.join(" → ")}</b></div>
          </div>
        </div>
      )}

      {/* ── aggregates ── */}
      {agg && (
        <div style={card}>
          <div style={{ fontSize: 13, fontWeight: 800, color: "#E2E8F0", marginBottom: 12 }}>📊 Aggregate Overview (SQL — कोई player row load नहीं)</div>
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 16 }}>
            {[
              ["Completed", agg.totals.completed, "#CBD5E1"],
              ["Eligible", agg.totals.eligible, "#6EE7B7"],
              ["Not selected", agg.totals.notSelected, "#94A3B8"],
              ["Incomplete", agg.totals.incomplete, "#FBBF24"],
              ["Final pool size", agg.totals.finalPoolSize, "#60A5FA"],
            ].map(([l, v, c]) => (
              <div key={l as string} style={{ background: "#060B18", border: "1px solid #1E293B", borderRadius: 12, padding: "12px 18px", minWidth: 120 }}>
                <div style={{ fontSize: 22, fontWeight: 900, color: c as string }}>{Number(v).toLocaleString("en-IN")}</div>
                <div style={{ fontSize: 11, color: "#64748B", marginTop: 2 }}>{l}</div>
              </div>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
            <div>
              <div style={{ fontSize: 11.5, color: "#64748B", marginBottom: 6 }}>By role (eligible)</div>
              <table style={{ width: "100%", borderCollapse: "collapse" }}><tbody>
                {agg.byRole.map(r => <tr key={r.role}><td style={td}>{roleLabel(r.role)}</td><td style={{ ...td, textAlign: "right", fontWeight: 700 }}>{r.n.toLocaleString("en-IN")}</td></tr>)}
              </tbody></table>
            </div>
            <div>
              <div style={{ fontSize: 11.5, color: "#64748B", marginBottom: 6 }}>By zone (eligible)</div>
              <table style={{ width: "100%", borderCollapse: "collapse" }}><tbody>
                {agg.byZone.map(z => <tr key={z.zone}><td style={{ ...td, color: z.zone === "UNMAPPED" ? "#FCA5A5" : "#CBD5E1" }}>{z.zone}</td><td style={{ ...td, textAlign: "right", fontWeight: 700 }}>{z.n.toLocaleString("en-IN")}</td></tr>)}
              </tbody></table>
            </div>
          </div>
          {/* score distribution */}
          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 11.5, color: "#64748B", marginBottom: 6 }}>Score distribution (0–100, width 5)</div>
            <div style={{ display: "flex", gap: 2, alignItems: "flex-end", height: 60 }}>
              {agg.scoreBuckets.map(b => {
                const max = Math.max(1, ...agg.scoreBuckets.map(x => x.n));
                return <div key={b.bucket} title={`${b.label}: ${b.n}`} style={{ flex: 1, background: "#3B82F6", opacity: 0.5 + 0.5 * (b.n / max), height: `${Math.max(3, (b.n / max) * 100)}%`, borderRadius: 2 }} />;
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── trial closure + generate ── */}
      <div style={card}>
        <div style={{ fontSize: 13, fontWeight: 800, color: "#E2E8F0", marginBottom: 4 }}>🔒 Trial Closure & Generation</div>
        <div style={{ fontSize: 12, color: "#64748B", marginBottom: 12 }}>
          पहले physical trials CLOSE करें (population snapshot freeze) → फिर GENERATE FINAL 600.
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <span style={statusChip(closed ? "published" : "draft")}>{closed ? "TRIALS CLOSED" : "TRIALS OPEN"}</span>
          {agg?.closure.snapshotAt && <span style={{ fontSize: 11.5, color: "#64748B" }}>Snapshot: {new Date(agg.closure.snapshotAt).toLocaleString("en-IN")}</span>}
          {!closed
            ? <button style={btn("#EF4444")} disabled={busy} onClick={doClose}>CLOSE PHYSICAL TRIALS</button>
            : <button style={ghost} disabled={busy} onClick={doReopen}>Reopen trials (invalidate unpublished)</button>}
          <button style={btn(closed ? "#F59E0B" : "#1E293B", closed ? "#0A1020" : "#475569")} disabled={busy || !closed} onClick={doGenerate}>GENERATE FINAL 600</button>
        </div>
      </div>

      {/* ── batches ── */}
      {batches.length > 0 && (
        <div style={{ ...card, padding: 0, overflowX: "auto" }}>
          <div style={{ padding: "14px 16px 4px", fontSize: 13, fontWeight: 800, color: "#E2E8F0" }}>Selection Batches (versions)</div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr><th style={th}>Version</th><th style={th}>Status</th><th style={th}>Selected</th><th style={th}>Exceptions</th><th style={th}>Generated</th><th style={th}></th></tr></thead>
            <tbody>{batches.map(b => {
              const c = (b.counts ?? {}) as Record<string, any>;
              return (
                <tr key={b.id} style={{ background: activeBatch?.id === b.id ? "#0B1424" : undefined, cursor: "pointer" }} onClick={() => setActiveBatch(b)}>
                  <td style={{ ...td, fontWeight: 700, color: "#E2E8F0" }}>V{b.version}</td>
                  <td style={td}><span style={statusChip(b.status)}>{b.status}</span></td>
                  <td style={td}>{c.selected ?? "—"}</td>
                  <td style={{ ...td, color: (b.exceptionReport?.length ?? 0) > 0 ? "#FCA5A5" : "#64748B" }}>{b.exceptionReport?.length ?? 0}</td>
                  <td style={td}>{b.generatedAt ? new Date(b.generatedAt).toLocaleString("en-IN") : "—"}</td>
                  <td style={td}>{b.status === "failed" && <button style={{ ...ghost, color: "#FBBF24" }} onClick={e => { e.stopPropagation(); doRetry(b.id); }}>Retry</button>}</td>
                </tr>
              );
            })}</tbody>
          </table>
        </div>
      )}

      {/* ── active batch detail ── */}
      {activeBatch && (
        <div style={card}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: "#E2E8F0" }}>Batch V{activeBatch.version}</div>
            <span style={statusChip(activeBatch.status)}>{activeBatch.status}</span>
            <span style={{ fontSize: 11, color: "#475569" }}>algo {activeBatch.algorithmVersion}</span>
          </div>

          {/* progress */}
          {activeBatch.status === "generating" && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12.5, color: "#FBBF24", marginBottom: 6 }}>⏳ {PROGRESS_LABELS[activeBatch.jobPhase ?? ""] ?? activeBatch.jobPhase} · {activeBatch.jobProgressPct}%</div>
              <div style={{ height: 8, background: "#131C2E", borderRadius: 99 }}>
                <div style={{ width: `${activeBatch.jobProgressPct}%`, height: "100%", background: "#F59E0B", borderRadius: 99, transition: "width .4s" }} />
              </div>
            </div>
          )}

          {activeBatch.status === "failed" && (
            <div style={{ ...errBox, marginBottom: 16 }}>
              ❌ Job failed: {activeBatch.error ?? "unknown"} — कोई partial result store नहीं हुआ. ऊपर से Retry करें।
            </div>
          )}

          {/* counts */}
          {activeBatch.status !== "generating" && Object.keys(counts).length > 0 && (
            <div style={{ display: "flex", gap: 20, flexWrap: "wrap", fontSize: 12.5, color: "#CBD5E1", marginBottom: 14 }}>
              <div>Population: <b>{Number(counts.populationTotal ?? 0).toLocaleString("en-IN")}</b></div>
              <div>Eligible: <b>{Number(counts.eligible ?? 0).toLocaleString("en-IN")}</b></div>
              <div>Selected: <b style={{ color: "#6EE7B7" }}>{counts.selected ?? 0}</b> / {counts.targetTotal ?? computedTotal}</div>
              {counts.byRole && <div>Roles: {roleLabel("bat")} {counts.byRole.bat} · {roleLabel("bowl")} {counts.byRole.bowl} · AR {counts.byRole.ar} · WK {counts.byRole.wk}</div>}
            </div>
          )}

          {/* SELECTION CONSTRAINT EXCEPTIONS */}
          {exceptions.length > 0 && (
            <div style={{ ...errBox, marginBottom: 16 }}>
              <div style={{ fontWeight: 800, marginBottom: 6 }}>⚠️ SELECTION CONSTRAINT EXCEPTIONS ({exceptions.length}) — कोई role silently substitute नहीं हुआ</div>
              {exceptions.map((x: any, i) => (
                <div key={i} style={{ fontSize: 12, marginBottom: 3 }}>• {x.message ?? `${x.zone} ${x.role}: required ${x.required}, eligible ${x.eligible}, shortfall ${x.shortfall}`}</div>
              ))}
              <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 6 }}>इनके लिए authorised admin decision चाहिए।</div>
            </div>
          )}

          {/* action buttons */}
          {activeBatch.status === "preview_ready" && (
            <button style={btn("#A855F7")} disabled={busy} onClick={() => doApprove(activeBatch.id)}>APPROVE FINAL POOL</button>
          )}
          {activeBatch.status === "approved" && (
            <div style={{ display: "flex", gap: 10 }}>
              <button style={btn("#10B981")} disabled={busy} onClick={() => doPublish(activeBatch.id)}>PUBLISH RESULTS</button>
              <span style={{ fontSize: 11.5, color: "#64748B", alignSelf: "center" }}>Publish सिर्फ status flip करता है — players को notification अभी नहीं।</span>
            </div>
          )}
          {activeBatch.status === "published" && <div style={okBox}>✅ Published on {activeBatch.publishedAt ? new Date(activeBatch.publishedAt).toLocaleString("en-IN") : ""} · {activeBatch.publishedBy}</div>}

          {/* ── FINAL 600 PREVIEW (cursor pagination) ── */}
          {["preview_ready", "approved", "published"].includes(activeBatch.status) && (
            <div style={{ marginTop: 18 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: "#E2E8F0", marginBottom: 10 }}>🏆 FINAL 600 PREVIEW</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
                <select style={inp} value={filters.zone} onChange={e => setFilters(f => ({ ...f, zone: e.target.value }))}>
                  <option value="">All zones</option>{["NORTH", "SOUTH", "EAST", "WEST", "CENTRAL"].map(z => <option key={z} value={z}>{z}</option>)}
                </select>
                <select style={inp} value={filters.role} onChange={e => setFilters(f => ({ ...f, role: e.target.value }))}>
                  <option value="">All roles</option>{["bat", "bowl", "ar", "wk"].map(r => <option key={r} value={r}>{roleLabel(r)}</option>)}
                </select>
                <select style={inp} value={filters.pool} onChange={e => setFilters(f => ({ ...f, pool: e.target.value }))}>
                  <option value="">All pools</option><option value="zonal">Zonal</option><option value="wildcard">Wildcard</option>
                </select>
              </div>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead><tr>
                    <th style={th}>Overall #</th><th style={th}>Role</th><th style={th}>Zone</th><th style={th}>City</th>
                    <th style={th}>Pool</th><th style={th}>Physical score</th><th style={th}>Zone-role #</th><th style={th}>Role %ile</th>
                  </tr></thead>
                  <tbody>{members.map(m => (
                    <tr key={m.id}>
                      <td style={{ ...td, fontWeight: 700, color: "#E2E8F0" }}>{m.overallRank}</td>
                      <td style={td}>{roleLabel(m.role)}</td>
                      <td style={td}>{m.zone}</td>
                      <td style={td}>{m.city ?? "—"}</td>
                      <td style={td}><span style={chip(m.selectionPool === "wildcard" ? "rgba(168,85,247,0.12)" : "rgba(59,130,246,0.12)", m.selectionPool === "wildcard" ? "#C084FC" : "#60A5FA")}>{m.selectionPool}</span></td>
                      <td style={{ ...td, fontWeight: 700, color: "#6EE7B7" }}>{m.rawPhysicalScore}</td>
                      <td style={td}>{m.zoneRoleRank ?? "—"}</td>
                      <td style={td}>{(m.derivedMetrics as any)?.rolePercentile ?? "—"}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
              {members.length === 0 && <div style={{ color: "#64748B", padding: 20, textAlign: "center", fontSize: 12.5 }}>इन filters के लिए कोई member नहीं।</div>}
              {hasMore && <button style={{ ...ghost, marginTop: 12 }} disabled={busy} onClick={() => activeBatch && loadMembers(activeBatch.id, false)}>और load करें →</button>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

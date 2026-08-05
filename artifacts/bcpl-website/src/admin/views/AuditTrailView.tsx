import { useState, useEffect, useCallback } from "react";
import { adminReq } from "../../lib/adminHttp";

/* ─── Audit Trail — SUPER_ADMIN only ────────────────────────────────────────
   Read-only history of admin actions that change player-visible state:
   Phase 1/2 selection status, KYC status, video review, refunds, etc.
   Backed by GET /api/admin/audit-logs (paginated + filterable). */

type AuditLog = {
  id: string;
  actor: string;
  actorIp: string | null;
  action: string;
  entity: string;
  entityKey: string | null;
  oldValue: unknown;
  newValue: unknown;
  createdAt: string;
};

type AuditResponse = {
  logs: AuditLog[];
  total: number;
  page: number;
  pageSize: number;
  pages: number;
  actions: string[];
  entities: string[];
};

const CARD: React.CSSProperties = {
  background: "linear-gradient(135deg,#0D1526,#0A1020)",
  border: "1px solid #1E293B", borderRadius: 16, padding: 20,
};
const INP: React.CSSProperties = {
  padding: "8px 10px", borderRadius: 8,
  border: "1px solid #1E293B", background: "#060B18",
  color: "#E2E8F0", fontSize: 12, outline: "none", boxSizing: "border-box",
};

/* Friendly labels for the canonical action strings written by the API. */
const ACTION_LABEL: Record<string, string> = {
  "registration.phase1_status": "Phase 1 status changed",
  "registration.phase2_status": "Phase 2 status changed",
  "kyc.status": "KYC status changed",
  "kyc.employment_status": "KYC employment status",
  "kyc.reveal": "KYC data revealed",
  "video.review": "Video review",
  "refund.approve": "Refund approved",
  "refund.reject": "Refund rejected",
  "refund.request": "Refund requested",
  "admin_user.create": "Admin user created",
  "admin_user.update": "Admin user updated",
  "admin_user.delete": "Admin user deleted",
  "settings.update": "Settings updated",
};
const actionLabel = (a: string) => ACTION_LABEL[a] ?? a.replace(/[._]/g, " ");

const fmtVal = (v: unknown): string => {
  if (v === null || v === undefined) return "—";
  if (typeof v === "object") {
    const entries = Object.entries(v as Record<string, unknown>);
    return entries.map(([k, val]) => `${k}: ${val === null ? "—" : String(val)}`).join(", ");
  }
  return String(v);
};

const fmtDate = (s: string) =>
  new Date(s).toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

const PAGE_SIZE = 50;

export default function AuditTrailView() {
  const [data, setData] = useState<AuditResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState("");
  const [actorFilter, setActorFilter] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("pageSize", String(PAGE_SIZE));
      if (actionFilter) params.set("action", actionFilter);
      if (actorFilter.trim()) params.set("actor", actorFilter.trim());
      if (from) params.set("from", new Date(from).toISOString());
      if (to) {
        // include the whole "to" day
        const d = new Date(to);
        d.setHours(23, 59, 59, 999);
        params.set("to", d.toISOString());
      }
      const res = await adminReq<AuditResponse>("GET", `/admin/audit-logs?${params.toString()}`);
      setData(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load audit logs");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [page, actionFilter, actorFilter, from, to]);

  useEffect(() => { void load(); }, [load]);

  const resetFilters = () => {
    setActionFilter(""); setActorFilter(""); setFrom(""); setTo(""); setPage(1);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={CARD}>
        <div style={{ fontSize: 15, fontWeight: 800, color: "#E2E8F0", marginBottom: 4 }}>Audit Trail</div>
        <div style={{ fontSize: 12, color: "#64748B", marginBottom: 16 }}>
          Every admin change to a player's selection status, KYC status, video review, refunds and more — who did it, when, and the before → after value.
        </div>

        {/* Filters */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "flex-end" }}>
          <div>
            <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "#475569", letterSpacing: .5, marginBottom: 5 }}>ACTION</label>
            <select value={actionFilter} onChange={e => { setActionFilter(e.target.value); setPage(1); }} style={{ ...INP, minWidth: 200 }}>
              <option value="">All actions</option>
              {(data?.actions ?? []).map(a => <option key={a} value={a}>{actionLabel(a)}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "#475569", letterSpacing: .5, marginBottom: 5 }}>ADMIN (ACTOR)</label>
            <input value={actorFilter} onChange={e => setActorFilter(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") { setPage(1); void load(); } }}
              placeholder="email / name" style={{ ...INP, minWidth: 180 }} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "#475569", letterSpacing: .5, marginBottom: 5 }}>FROM</label>
            <input type="date" value={from} onChange={e => { setFrom(e.target.value); setPage(1); }} style={INP} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "#475569", letterSpacing: .5, marginBottom: 5 }}>TO</label>
            <input type="date" value={to} onChange={e => { setTo(e.target.value); setPage(1); }} style={INP} />
          </div>
          <button onClick={() => { setPage(1); void load(); }}
            style={{ height: 34, padding: "0 16px", borderRadius: 8, border: "none", background: "linear-gradient(135deg,#FF6B00,#FF8C40)", color: "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
            Apply
          </button>
          <button onClick={resetFilters}
            style={{ height: 34, padding: "0 14px", borderRadius: 8, border: "1px solid #1E293B", background: "#0D1526", color: "#64748B", fontWeight: 600, fontSize: 12, cursor: "pointer" }}>
            Reset
          </button>
        </div>
      </div>

      <div style={CARD}>
        {loading && <div style={{ fontSize: 13, color: "#64748B", padding: 20, textAlign: "center" }}>Loading audit logs…</div>}
        {error && !loading && (
          <div style={{ fontSize: 13, color: "#EF4444", padding: 16, background: "#EF444410", borderRadius: 10, border: "1px solid #EF444430" }}>
            ⚠ {error}
          </div>
        )}
        {!loading && !error && data && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div style={{ fontSize: 12, color: "#64748B" }}>
                {data.total.toLocaleString("en-IN")} record{data.total === 1 ? "" : "s"}
                {data.pages > 1 && ` · page ${data.page} of ${data.pages}`}
              </div>
            </div>
            {data.logs.length === 0 ? (
              <div style={{ fontSize: 13, color: "#64748B", padding: 30, textAlign: "center" }}>
                No admin actions recorded for these filters yet.
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                  <thead>
                    <tr style={{ textAlign: "left", color: "#475569", fontSize: 10, letterSpacing: .5 }}>
                      <th style={{ padding: "8px 10px", fontWeight: 700 }}>WHEN</th>
                      <th style={{ padding: "8px 10px", fontWeight: 700 }}>ADMIN</th>
                      <th style={{ padding: "8px 10px", fontWeight: 700 }}>ACTION</th>
                      <th style={{ padding: "8px 10px", fontWeight: 700 }}>TARGET</th>
                      <th style={{ padding: "8px 10px", fontWeight: 700 }}>BEFORE</th>
                      <th style={{ padding: "8px 10px", fontWeight: 700 }}>AFTER</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.logs.map(log => (
                      <tr key={log.id} style={{ borderTop: "1px solid #1E293B", color: "#CBD5E1" }}>
                        <td style={{ padding: "8px 10px", whiteSpace: "nowrap", color: "#94A3B8" }}>{fmtDate(log.createdAt)}</td>
                        <td style={{ padding: "8px 10px" }}>
                          <div style={{ color: "#E2E8F0" }}>{log.actor}</div>
                          {log.actorIp && <div style={{ fontSize: 10, color: "#475569" }}>{log.actorIp}</div>}
                        </td>
                        <td style={{ padding: "8px 10px" }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: "#FF6B00" }}>{actionLabel(log.action)}</span>
                          <div style={{ fontSize: 10, color: "#475569" }}>{log.entity}</div>
                        </td>
                        <td style={{ padding: "8px 10px", fontFamily: "monospace", fontSize: 11, color: "#64748B", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis" }}>
                          {log.entityKey ?? "—"}
                        </td>
                        <td style={{ padding: "8px 10px", color: "#94A3B8", maxWidth: 220 }}>{fmtVal(log.oldValue)}</td>
                        <td style={{ padding: "8px 10px", color: "#10B981", maxWidth: 220 }}>{fmtVal(log.newValue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {data.pages > 1 && (
              <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 10, marginTop: 16 }}>
                <button disabled={data.page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}
                  style={{ padding: "6px 14px", borderRadius: 8, border: "1px solid #1E293B", background: "#0D1526", color: data.page <= 1 ? "#334155" : "#CBD5E1", fontSize: 12, cursor: data.page <= 1 ? "not-allowed" : "pointer" }}>
                  ‹ Prev
                </button>
                <span style={{ fontSize: 12, color: "#64748B" }}>{data.page} / {data.pages}</span>
                <button disabled={data.page >= data.pages} onClick={() => setPage(p => Math.min(data.pages, p + 1))}
                  style={{ padding: "6px 14px", borderRadius: 8, border: "1px solid #1E293B", background: "#0D1526", color: data.page >= data.pages ? "#334155" : "#CBD5E1", fontSize: 12, cursor: data.page >= data.pages ? "not-allowed" : "pointer" }}>
                  Next ›
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

import { useState, useEffect, useCallback } from "react";
import {
  adminGetFraudFlags,
  adminRunFraudScan,
  adminFraudFlagAction,
  type FraudFlagRow,
} from "../../lib/api";

/**
 * Stage 6 — Fraud detection (live).
 * Duplicate-evidence scanner + review queue backed by /api/admin/fraud.
 * KYC_TEAM + SUPER_ADMIN only. Flags never trigger automatic action
 * against a player — review is always a manual decision.
 */

const TYPE_LABEL: Record<string, string> = {
  duplicate_video:   "Duplicate Video",
  duplicate_aadhaar: "Duplicate Aadhaar Ref",
  duplicate_pan:     "Duplicate PAN Ref",
};

const STATUS_COLOR: Record<string, string> = {
  flagged: "#EF4444",
  cleared: "#10B981",
  blocked: "#8B5CF6",
};
const STATUS_LABEL: Record<string, string> = {
  flagged: "Flagged",
  cleared: "Cleared",
  blocked: "Blocked",
};

function Badge({ status }: { status: string }) {
  const color = STATUS_COLOR[status] ?? "#64748B";
  return (
    <span style={{
      display: "inline-block", padding: "3px 9px", borderRadius: 6,
      fontSize: 10, fontWeight: 800, whiteSpace: "nowrap",
      background: color + "22", color, border: "1px solid " + color + "44",
    }}>
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}

export default function FraudView() {
  const [flags, setFlags]     = useState<FraudFlagRow[]>([]);
  const [counts, setCounts]   = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [err, setErr]         = useState("");
  const [statusF, setStatusF] = useState("all");
  const [typeF, setTypeF]     = useState("all");
  const [sel, setSel]         = useState<FraudFlagRow | null>(null);
  const [note, setNote]       = useState("");
  const [acting, setActing]   = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setErr("");
    try {
      const r = await adminGetFraudFlags();
      setFlags(r.flags);
      setCounts(r.counts);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setNote(sel?.note ?? ""); }, [sel?.id]);

  const runScan = async () => {
    if (!confirm("Run a duplicate scan across all registrations now?")) return;
    setScanning(true);
    setErr("");
    try {
      const r = await adminRunFraudScan();
      alert("Scan complete — " + r.created + " new flag" + (r.created === 1 ? "" : "s") + " (from " + r.candidates + " candidate findings).");
      await load();
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setScanning(false);
    }
  };

  const act = async (action: "clear" | "block" | "reflag") => {
    if (!sel) return;
    setActing(true);
    try {
      const r = await adminFraudFlagAction(sel.id, action, note.trim() || undefined);
      setFlags(prev => prev.map(f => f.id === sel.id ? { ...f, ...r.flag } : f));
      setSel(s => s && s.id === sel.id ? { ...s, ...r.flag } : s);
      setCounts(c => {
        const next = { ...c };
        next[sel.status] = Math.max(0, (next[sel.status] ?? 1) - 1);
        next[r.flag.status] = (next[r.flag.status] ?? 0) + 1;
        return next;
      });
    } catch (e: any) {
      alert("Error: " + e.message);
    } finally {
      setActing(false);
    }
  };

  const card: React.CSSProperties = {
    background: "linear-gradient(135deg,#0D1526,#0A1020)",
    border: "1px solid #1E293B", borderRadius: 16, padding: 20,
  };

  const shown = flags.filter(f =>
    (statusF === "all" || f.status === statusF) &&
    (typeF === "all" || f.type === typeF)
  );

  const evidenceOf = (f: FraudFlagRow): { label: string; matched: string[] } => {
    const d = (f.detail ?? {}) as { etag?: string; ref?: string; matchedRegistrations?: string[] };
    return {
      label: d.etag ? "Content hash: " + d.etag : d.ref ? "Shared ref: " + d.ref : "—",
      matched: Array.isArray(d.matchedRegistrations) ? d.matchedRegistrations : [],
    };
  };

  const chip = (active: boolean): React.CSSProperties => ({
    padding: "7px 13px", borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap",
    border: "1px solid " + (active ? "#FF6B00" : "#1E293B"),
    background: active ? "#FF6B0022" : "transparent",
    color: active ? "#FF6B00" : "#64748B",
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#F1F5F9" }}>Fraud Detection</div>
          <div style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}>
            Duplicate video / Aadhaar-ref / PAN-ref findings — every flag needs manual review, nothing is automatic
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => load()} style={{ padding: "9px 16px", borderRadius: 9, border: "1px solid #1E293B", background: "transparent", color: "#64748B", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
            ↺ Refresh
          </button>
          <button onClick={runScan} disabled={scanning}
            style={{ padding: "9px 18px", borderRadius: 9, border: "none", background: "#FF6B00", color: "#fff", fontSize: 12, fontWeight: 800, cursor: "pointer", opacity: scanning ? 0.6 : 1 }}>
            {scanning ? "Scanning…" : "Run Duplicate Scan"}
          </button>
        </div>
      </div>

      {err && (
        <div style={{ padding: 14, borderRadius: 10, background: "#EF444415", border: "1px solid #EF444440", color: "#EF4444", fontSize: 12 }}>
          ⚠ {err} — <button onClick={() => load()} style={{ background: "none", border: "none", color: "#EF4444", cursor: "pointer", fontWeight: 700, fontSize: 12 }}>Retry</button>
        </div>
      )}

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 }}>
        {[
          { label: "Total Findings",  value: flags.length,          color: "#6366F1", f: "all" },
          { label: "Needs Review",    value: counts.flagged ?? 0,   color: "#EF4444", f: "flagged" },
          { label: "Cleared",         value: counts.cleared ?? 0,   color: "#10B981", f: "cleared" },
          { label: "Blocked",         value: counts.blocked ?? 0,   color: "#8B5CF6", f: "blocked" },
        ].map(s => (
          <div key={s.label} style={{ ...card, borderTop: "3px solid " + s.color, padding: 16, cursor: "pointer" }}
            onClick={() => setStatusF(s.f)}>
            <div style={{ fontSize: 26, fontWeight: 900, color: s.color }}>{loading ? "…" : s.value}</div>
            <div style={{ fontSize: 10, color: "#64748B", marginTop: 4, lineHeight: 1.3 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ display: "flex", gap: 4 }}>
          {["all", "flagged", "cleared", "blocked"].map(f => (
            <button key={f} onClick={() => setStatusF(f)} style={chip(statusF === f)}>
              {f === "all" ? "All" : STATUS_LABEL[f] ?? f}
            </button>
          ))}
        </div>
        <div style={{ width: 1, height: 22, background: "#1E293B" }} />
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          {["all", "duplicate_video", "duplicate_aadhaar", "duplicate_pan"].map(t => (
            <button key={t} onClick={() => setTypeF(t)} style={chip(typeF === t)}>
              {t === "all" ? "All Types" : TYPE_LABEL[t] ?? t}
            </button>
          ))}
        </div>
      </div>

      {/* Table + detail */}
      <div style={{ display: "grid", gridTemplateColumns: sel ? "1fr 340px" : "1fr", gap: 12 }}>
        <div style={{ ...card, padding: 0, overflow: "hidden" }}>
          {loading ? (
            <div style={{ padding: 60, textAlign: "center", color: "#334155", fontSize: 14 }}>Loading fraud findings…</div>
          ) : shown.length === 0 ? (
            <div style={{ padding: 60, textAlign: "center", color: "#334155", fontSize: 14 }}>
              {flags.length === 0
                ? "No findings yet — run a duplicate scan to check all registrations."
                : "No findings match the current filters."}
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                  <tr style={{ background: "#080E1C", borderBottom: "1px solid #1E293B" }}>
                    {["Player", "Reg #", "City", "Type", "Matched With", "Status", "Flagged On"].map(h => (
                      <th key={h} style={{ padding: "10px 12px", textAlign: "left", fontSize: 10, fontWeight: 700, color: "#334155", letterSpacing: "0.06em", textTransform: "uppercase", whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {shown.map((f, i) => (
                    <tr key={f.id}
                      onClick={() => setSel(sel?.id === f.id ? null : f)}
                      style={{ borderBottom: "1px solid #0F172A", background: sel?.id === f.id ? "#FF6B0008" : i % 2 === 0 ? "transparent" : "#0A111C", cursor: "pointer" }}>
                      <td style={{ padding: "10px 12px" }}>
                        <div style={{ fontWeight: 700, color: "#F1F5F9" }}>{f.player}</div>
                        <div style={{ fontSize: 10, color: "#475569", marginTop: 1 }}>{f.phone || "—"}</div>
                      </td>
                      <td style={{ padding: "10px 12px", color: "#94A3B8", whiteSpace: "nowrap" }}>{f.regNumber ?? "—"}</td>
                      <td style={{ padding: "10px 12px", color: "#94A3B8", whiteSpace: "nowrap" }}>{f.trialCity || "—"}</td>
                      <td style={{ padding: "10px 12px", color: "#94A3B8", whiteSpace: "nowrap" }}>{TYPE_LABEL[f.type] ?? f.type}</td>
                      <td style={{ padding: "10px 12px", color: "#94A3B8" }}>
                        {evidenceOf(f).matched.length} other registration{evidenceOf(f).matched.length === 1 ? "" : "s"}
                      </td>
                      <td style={{ padding: "10px 12px" }}><Badge status={f.status} /></td>
                      <td style={{ padding: "10px 12px", color: "#475569", whiteSpace: "nowrap" }}>
                        {f.createdAt ? new Date(f.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Detail panel */}
        {sel && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ ...card, padding: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: "#F1F5F9" }}>{sel.player}</div>
                  <div style={{ fontSize: 11, color: "#475569", marginTop: 2 }}>{sel.regNumber ?? "—"} · {sel.trialCity || "—"}</div>
                </div>
                <button onClick={() => setSel(null)} style={{ background: "none", border: "none", color: "#334155", cursor: "pointer", fontSize: 18, padding: 4 }}>×</button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid #0F172A" }}>
                  <span style={{ fontSize: 11, color: "#475569", fontWeight: 600 }}>Type</span>
                  <span style={{ fontSize: 11, color: "#94A3B8" }}>{TYPE_LABEL[sel.type] ?? sel.type}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid #0F172A" }}>
                  <span style={{ fontSize: 11, color: "#475569", fontWeight: 600 }}>Status</span>
                  <Badge status={sel.status} />
                </div>
                <div style={{ padding: "7px 0", borderBottom: "1px solid #0F172A" }}>
                  <div style={{ fontSize: 11, color: "#475569", fontWeight: 600, marginBottom: 4 }}>Evidence</div>
                  <div style={{ fontSize: 11, color: "#94A3B8", wordBreak: "break-all" }}>{evidenceOf(sel).label}</div>
                  {evidenceOf(sel).matched.length > 0 && (
                    <div style={{ fontSize: 10, color: "#475569", marginTop: 4 }}>
                      Matched registrations:
                      {evidenceOf(sel).matched.map(m => (
                        <div key={m} style={{ wordBreak: "break-all", marginTop: 2 }}>{m}</div>
                      ))}
                    </div>
                  )}
                </div>
                {sel.reviewedBy && (
                  <div style={{ fontSize: 10, color: "#475569" }}>
                    Last review: {sel.reviewedBy}{sel.reviewedAt ? " · " + new Date(sel.reviewedAt).toLocaleString("en-IN") : ""}
                  </div>
                )}
              </div>

              <div style={{ marginTop: 14 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 5 }}>Review Note</div>
                <textarea value={note} onChange={e => setNote(e.target.value)} rows={3}
                  placeholder="Why is this being cleared / blocked?"
                  style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #1E293B", background: "#080E1C", color: "#E2E8F0", fontSize: 11, outline: "none", resize: "vertical", boxSizing: "border-box" }} />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginTop: 10 }}>
                <button disabled={acting || sel.status === "cleared"} onClick={() => act("clear")}
                  style={{ padding: "9px 6px", borderRadius: 8, border: "1px solid #10B98140", background: "#10B98115", color: "#10B981", fontWeight: 700, fontSize: 11, cursor: "pointer", opacity: acting || sel.status === "cleared" ? 0.4 : 1 }}>
                  Clear Flag
                </button>
                <button disabled={acting || sel.status === "blocked"} onClick={() => act("block")}
                  style={{ padding: "9px 6px", borderRadius: 8, border: "1px solid #8B5CF640", background: "#8B5CF615", color: "#8B5CF6", fontWeight: 700, fontSize: 11, cursor: "pointer", opacity: acting || sel.status === "blocked" ? 0.4 : 1 }}>
                  Block
                </button>
                <button disabled={acting || sel.status === "flagged"} onClick={() => act("reflag")}
                  style={{ gridColumn: "1 / -1", padding: "9px 6px", borderRadius: 8, border: "1px solid #EF444440", background: "#EF444415", color: "#EF4444", fontWeight: 700, fontSize: 11, cursor: "pointer", opacity: acting || sel.status === "flagged" ? 0.4 : 1 }}>
                  Re-open (Flag Again)
                </button>
              </div>

              <div style={{ fontSize: 10, color: "#334155", marginTop: 10, lineHeight: 1.5 }}>
                Blocking here only records the decision for the ops team — the player is not notified and no automatic action is taken.
              </div>
            </div>
          </div>
        )}
      </div>

      <div style={{ fontSize: 11, color: "#334155", textAlign: "right" }}>
        {!loading && shown.length + " finding" + (shown.length !== 1 ? "s" : "") + " shown"}
      </div>
    </div>
  );
}

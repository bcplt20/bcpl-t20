import { useState, useEffect, useCallback } from "react";
import { adminGetDrafts, type DraftRow } from "../api/incompleteApi";
import { adminGetAbandoned, type AbandonedRow } from "../../lib/marketingApi";

/* ── shared styling (consistent with other admin views) ── */
const card: React.CSSProperties = {
  background: "linear-gradient(135deg,#0D1526 0%,#0A1020 100%)",
  border: "1px solid #1E293B", borderRadius: 16, padding: 20,
};
const th: React.CSSProperties = {
  textAlign: "left", padding: "10px 12px", fontSize: 10, fontWeight: 800,
  color: "#475569", letterSpacing: 1, textTransform: "uppercase",
  borderBottom: "1px solid #1E293B", whiteSpace: "nowrap",
};
const td: React.CSSProperties = {
  padding: "11px 12px", fontSize: 12.5, color: "#E2E8F0",
  borderBottom: "1px solid #14203A", verticalAlign: "middle",
};

const ROLE_LABEL: Record<string, string> = {
  bat: "Batsman", bowl: "Bowler", wk: "Wicketkeeper", ar: "All-rounder",
};

const STAGE_LABEL: Record<string, string> = {
  DRAFT_STARTED: "Started form",
  CONTACT_ENTERED: "Contact entered",
  OTP_PENDING: "OTP requested",
  OTP_VERIFIED: "OTP verified",
  PROFILE_COMPLETE: "Profile complete",
  PAYMENT_PENDING: "Payment pending",
};

const fmtDT = (d?: string | null) =>
  d ? new Date(d).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "—";

/* A unified row shape both tabs render. */
type FunnelRow = {
  key: string;
  name: string;
  phone: string;
  email: string;
  city: string;
  stage: string;
  lastActivity: string;      // ISO
  registered: boolean;       // reached the registrations table
};

function csvEscape(v: string): string {
  return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}

function downloadCsv(filename: string, rows: FunnelRow[], includeRegistered: boolean): void {
  const headers = ["Name", "Phone", "Email", "Trial City", "Stage", "Last Activity"];
  if (includeRegistered) headers.push("Registered");
  const body = rows.map(r => {
    const cols = [r.name, r.phone, r.email, r.city, r.stage, fmtDT(r.lastActivity)];
    if (includeRegistered) cols.push(r.registered ? "Yes" : "No");
    return cols.map(c => csvEscape(String(c ?? ""))).join(",");
  });
  const csv = [headers.join(","), ...body].join("\n");
  const a = document.createElement("a");
  a.href = "data:text/csv;charset=utf-8," + encodeURIComponent(csv);
  a.download = `${filename}_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
}

const draftToRow = (d: DraftRow): FunnelRow => ({
  key: "draft_" + d.id,
  name: d.fullName || "—",
  phone: d.phone || "",
  email: d.email || "",
  city: d.trialCity || "—",
  stage: STAGE_LABEL[d.status] ?? d.status,
  lastActivity: d.lastActivityAt,
  registered: !!d.registrationId,
});

const abandonedToRow = (a: AbandonedRow): FunnelRow => ({
  key: "reg_" + a.registrationId,
  name: a.name || "—",
  phone: a.phone || "",
  email: a.email || "",
  city: a.city || "—",
  stage: "Payment pending",
  lastActivity: a.registeredAt,
  registered: true,
});

function FunnelTable({ rows, includeRegistered, loading, emptyText }: {
  rows: FunnelRow[]; includeRegistered: boolean; loading: boolean; emptyText: string;
}) {
  const cols = ["Name", "Phone", "Email", "Trial City", "Stage", "Last Activity"];
  if (includeRegistered) cols.push("Registered");
  return (
    <div style={{ ...card, padding: 0, overflow: "hidden" }}>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#080E1C" }}>{cols.map(c => <th key={c} style={th}>{c}</th>)}</tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.key} style={{ background: "transparent" }}>
                <td style={{ ...td, fontWeight: 700, color: "#F1F5F9" }}>{r.name}</td>
                <td style={{ ...td, fontFamily: "monospace", color: "#94A3B8" }}>{r.phone || "—"}</td>
                <td style={{ ...td, color: "#94A3B8" }}>{r.email || "—"}</td>
                <td style={td}>{r.city}</td>
                <td style={td}>
                  <span style={{ padding: "3px 9px", borderRadius: 6, fontSize: 10.5, fontWeight: 700, background: "#1E293B", color: "#94A3B8", whiteSpace: "nowrap" }}>{r.stage}</span>
                </td>
                <td style={{ ...td, color: "#64748B", whiteSpace: "nowrap" }}>{fmtDT(r.lastActivity)}</td>
                {includeRegistered && (
                  <td style={td}>
                    {r.registered
                      ? <span style={{ padding: "3px 9px", borderRadius: 6, fontSize: 10.5, fontWeight: 800, background: "#10B98122", color: "#10B981", border: "1px solid #10B98144" }}>Registered</span>
                      : <span style={{ color: "#334155", fontSize: 11 }}>—</span>}
                  </td>
                )}
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={cols.length} style={{ padding: 44, textAlign: "center", color: "#334155", fontSize: 13 }}>
                {loading ? "Loading…" : emptyText}
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function IncompleteRegistrationsView() {
  const [tab, setTab] = useState<"otp_not_taken" | "otp_done">("otp_not_taken");
  const [notTaken, setNotTaken] = useState<FunnelRow[]>([]);
  const [done, setDone] = useState<FunnelRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    setLoading(true); setErr("");
    try {
      const [g1, g2, ab] = await Promise.all([
        adminGetDrafts("otp_not_taken"),
        adminGetDrafts("otp_done"),
        adminGetAbandoned(),
      ]);

      setNotTaken(g1.drafts.map(draftToRow));

      // Tab 2 = OTP-done drafts + abandoned registrations, deduped by phone.
      const merged = new Map<string, FunnelRow>();
      for (const d of g2.drafts) {
        const row = draftToRow(d);
        merged.set(row.phone || row.key, row);
      }
      for (const a of ab.abandoned) {
        const row = abandonedToRow(a);
        const k = row.phone || row.key;
        const existing = merged.get(k);
        // Prefer the row marked Registered; keep the most recent activity time.
        if (!existing) merged.set(k, row);
        else merged.set(k, { ...existing, registered: existing.registered || row.registered });
      }
      const doneRows = [...merged.values()].sort(
        (a, b) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime(),
      );
      setDone(doneRows);
    } catch (e: any) {
      setErr(e?.message ?? "Failed to load incomplete registrations");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const TabBtn = ({ id, label, count }: { id: typeof tab; label: string; count: number }) => (
    <button onClick={() => setTab(id)} style={{
      background: tab === id ? "#FF6B00" : "transparent", color: tab === id ? "#fff" : "#94A3B8",
      border: tab === id ? "none" : "1px solid #1E293B", borderRadius: 9, padding: "9px 16px",
      fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 8,
    }}>
      {label}
      <span style={{ fontSize: 11, fontWeight: 800, background: tab === id ? "#ffffff33" : "#1E293B", color: tab === id ? "#fff" : "#64748B", padding: "1px 8px", borderRadius: 999 }}>{count}</span>
    </button>
  );

  const activeRows = tab === "otp_not_taken" ? notTaken : done;
  const includeRegistered = tab === "otp_done";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <div style={{ fontSize: 20, fontWeight: 800, color: "#F1F5F9" }}>Incomplete Registrations</div>
        <div style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}>
          Registration funnel — visitors who started but did not complete Phase 1. A draft is not a registered player until Phase 1 payment succeeds.
        </div>
      </div>

      {err && (
        <div style={{ padding: "12px 16px", background: "#EF444415", border: "1px solid #EF444444", borderRadius: 12, color: "#EF4444", fontSize: 13 }}>
          {err} — <button onClick={load} style={{ background: "none", border: "none", color: "#EF4444", cursor: "pointer", fontWeight: 700, fontSize: 13 }}>Retry</button>
        </div>
      )}

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <TabBtn id="otp_not_taken" label="OTP not taken" count={notTaken.length} />
        <TabBtn id="otp_done" label="OTP done, payment pending" count={done.length} />
        <div style={{ flex: 1 }} />
        <button
          onClick={() => downloadCsv(
            tab === "otp_not_taken" ? "bcpl_incomplete_otp_not_taken" : "bcpl_incomplete_payment_pending",
            activeRows, includeRegistered,
          )}
          disabled={activeRows.length === 0}
          style={{ padding: "9px 14px", borderRadius: 9, border: "1px solid #10B98144", background: "#10B98112", color: "#10B981", fontSize: 12, fontWeight: 700, cursor: activeRows.length === 0 ? "not-allowed" : "pointer", opacity: activeRows.length === 0 ? 0.5 : 1 }}>
          Download CSV
        </button>
      </div>

      <div style={{ fontSize: 12, color: "#94A3B8" }}>
        {tab === "otp_not_taken"
          ? <>Showing <b style={{ color: "#F1F5F9" }}>{notTaken.length}</b> visitor(s) who entered contact details but have not verified their mobile OTP.</>
          : <>Showing <b style={{ color: "#F1F5F9" }}>{done.length}</b> visitor(s) who verified OTP but have not completed Phase 1 payment.</>}
      </div>

      <FunnelTable
        rows={activeRows}
        includeRegistered={includeRegistered}
        loading={loading}
        emptyText={tab === "otp_not_taken" ? "No incomplete drafts at the OTP stage." : "No pending payments right now."}
      />
    </div>
  );
}

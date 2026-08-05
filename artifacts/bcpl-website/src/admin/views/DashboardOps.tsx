/**
 * Dashboard — Live Operations + Action Required tabs (Stage 3).
 *
 * Both tabs render from ONE payload (adminGetOps): a registration matrix
 * (city × role × phase statuses) that the client slices under any filter
 * combination without refetching, plus AI pipeline stats and a server-computed
 * alert list. Trial capacity / check-in columns arrive with Stage 4 tables.
 */
import { useState, useEffect } from "react";
import { adminGetOps, type OpsData, type OpsAlert } from "../../lib/api";

type NavPayload = { quick?: string; filter?: string; focusId?: string };
type TabProps = { onNavigate?: (tab: string, payload?: NavPayload) => void; refreshTick?: number };

/* Status sets mirror the server's canonical lifecycle */
const P1_PAID = new Set(["payment_done", "video_submitted", "selected", "rejected"]);
const HAS_VIDEO = new Set(["video_submitted", "selected", "rejected"]);
const P2_PAID = new Set(["payment_done", "kyc_done", "selected", "rejected"]);
const KYC_DONE = new Set(["kyc_done", "selected", "rejected"]);

const ROLE_LABELS: Record<string, string> = {
  bat: "Batsman", batsman: "Batsman",
  bowl: "Bowler", bowler: "Bowler",
  ar: "All-Rounder", all_rounder: "All-Rounder", "all-rounder": "All-Rounder", allrounder: "All-Rounder",
  wk: "Wicket-Keeper", wicket_keeper: "Wicket-Keeper", "wicket-keeper": "Wicket-Keeper", wicketkeeper: "Wicket-Keeper",
};
const roleLabel = (r: string) => ROLE_LABELS[r.toLowerCase()] ?? (r.charAt(0).toUpperCase() + r.slice(1));

const card: React.CSSProperties = {
  background: "linear-gradient(135deg,#0D1526 0%,#0A1020 100%)",
  border: "1px solid #1E293B", borderRadius: 16, padding: 20,
};
const selStyle: React.CSSProperties = {
  padding: "8px 12px", background: "#060B18", border: "1px solid #1E293B",
  borderRadius: 9, color: "#F1F5F9", fontSize: 12, outline: "none",
};
const thStyle: React.CSSProperties = {
  textAlign: "right", padding: "8px 10px", color: "#64748B", fontSize: 10.5,
  letterSpacing: ".07em", textTransform: "uppercase", borderBottom: "1px solid #1E293B",
};
const tdStyle: React.CSSProperties = {
  textAlign: "right", padding: "8px 10px", color: "#94A3B8",
  borderBottom: "1px solid #131C2E", fontVariantNumeric: "tabular-nums",
};

function useOps(refreshTick: number) {
  const [data, setData] = useState<OpsData | null>(null);
  const [err, setErr] = useState("");
  useEffect(() => {
    let cancelled = false;
    adminGetOps()
      .then(d => { if (!cancelled) { setData(d); setErr(""); } })
      .catch(e => { if (!cancelled) setErr(e?.message ?? "Failed to load operations data"); });
    return () => { cancelled = true; };
  }, [refreshTick]);
  return { data, err };
}

/* ═══════════════ Live Operations ═══════════════ */
export function OpsTab({ onNavigate, refreshTick = 0 }: TabProps) {
  const { data, err } = useOps(refreshTick);
  const [city, setCity] = useState("all");
  const [role, setRole] = useState("all");

  if (err) return <div style={{ ...card, color: "#FCA5A5", fontSize: 13 }}>Failed to load operations data: {err}</div>;
  if (!data) return <div style={{ ...card, color: "#475569", fontSize: 13 }}>Loading operations…</div>;

  const cities = [...new Set(data.matrix.map(m => m.city || "Unknown"))].sort();
  const roles = [...new Set(data.matrix.map(m => roleLabel(m.role)))].sort();

  const rows = data.matrix.filter(m =>
    (city === "all" || (m.city || "Unknown") === city) &&
    (role === "all" || roleLabel(m.role) === role));
  const sum = (pred: (m: OpsData["matrix"][number]) => boolean) =>
    rows.filter(pred).reduce((a, m) => a + m.n, 0);

  const total = sum(() => true);
  const p1Paid = sum(m => P1_PAID.has(m.p1));
  const p1Pending = sum(m => m.p1 === "pending");
  const videoSubmitted = sum(m => HAS_VIDEO.has(m.p1));
  const videosAwaited = sum(m => m.p1 === "payment_done");
  const qualified = sum(m => m.p1 === "selected");
  const notShortlisted = sum(m => m.p1 === "rejected");
  const p2Paid = sum(m => P2_PAID.has(m.p2 ?? ""));
  const p2Pending = sum(m => m.p1 === "selected" && (!m.p2 || m.p2 === "pending"));
  const kycComplete = sum(m => KYC_DONE.has(m.p2 ?? ""));

  const ev = data.evals.byStatus;
  const aiQueued = (ev["queued"] ?? 0) + (ev["validating"] ?? 0) + (ev["validated"] ?? 0) + (ev["ai_validating"] ?? 0) + (ev["ai_valid"] ?? 0);
  const aiProcessing = ev["scoring"] ?? 0;
  const aiCompleted = (ev["scored"] ?? 0) + (ev["releasing"] ?? 0) + (ev["result_released"] ?? 0);
  const reupload = ev["reupload_required"] ?? 0;
  const integrity = ev["integrity_review"] ?? 0;
  const resSelected = data.results["qualified"] ?? 0;
  const resRejected = data.results["not_shortlisted"] ?? 0;
  const qualRate = resSelected + resRejected > 0 ? Math.round((resSelected / (resSelected + resRejected)) * 100) : null;

  const kpis: { label: string; value: number; color: string; tab: string; payload?: NavPayload }[] = [
    { label: "Total Registrations", value: total, color: "#6366F1", tab: "phase1_regs" },
    { label: "Phase 1 Paid", value: p1Paid, color: "#10B981", tab: "finance" },
    { label: "P1 Payment Pending", value: p1Pending, color: "#EF4444", tab: "marketing" },
    { label: "Videos Awaited", value: videosAwaited, color: "#F59E0B", tab: "phase1_regs", payload: { filter: "payment_done" } },
    { label: "Videos Submitted", value: videoSubmitted, color: "#3B82F6", tab: "video_review" },
    { label: "AI Queue", value: aiQueued, color: "#8B5CF6", tab: "selection" },
    { label: "AI Scoring Now", value: aiProcessing, color: "#EC4899", tab: "selection" },
    { label: "AI Completed", value: aiCompleted, color: "#14B8A6", tab: "selection" },
    { label: "P1 Qualified", value: qualified, color: "#FF6B00", tab: "phase1_regs", payload: { filter: "selected" } },
    { label: "Not Shortlisted", value: notShortlisted, color: "#64748B", tab: "phase1_regs", payload: { filter: "rejected" } },
    { label: "P2 Payment Pending", value: p2Pending, color: "#F59E0B", tab: "finance" },
    { label: "Phase 2 Paid", value: p2Paid, color: "#10B981", tab: "finance" },
    { label: "KYC Complete", value: kycComplete, color: "#22C55E", tab: "phase2_kyc" },
    { label: "Trial Scheduled", value: data.trials?.allocated ?? 0, color: "#E8B23D", tab: "trial_cities" },
    { label: "Trial Checked-In", value: data.trials?.checkedIn ?? 0, color: "#A855F7", tab: "trial_cities" },
    { label: "Re-upload Required", value: reupload, color: "#F97316", tab: "video_review" },
    { label: "Integrity Review", value: integrity, color: "#EF4444", tab: "video_review" },
  ];

  const funnel = [
    { name: "Registered", value: total, color: "#FF6B00" },
    { name: "Phase 1 Paid", value: p1Paid, color: "#F59E0B" },
    { name: "Video Submitted", value: videoSubmitted, color: "#3B82F6" },
    { name: "Phase 1 Qualified", value: qualified, color: "#10B981" },
    { name: "Phase 2 Paid", value: p2Paid, color: "#22C55E" },
    { name: "KYC Complete (Trial Ready)", value: kycComplete, color: "#14B8A6" },
    { name: "Trial Scheduled", value: data.trials?.allocated ?? 0, color: "#E8B23D" },
    { name: "Trial Checked-In", value: data.trials?.checkedIn ?? 0, color: "#A855F7" },
  ];
  const funnelMax = Math.max(1, ...funnel.map(f => f.value));

  /* city table honours the role filter (city filter left off — the table IS the city view) */
  const cityRows = cities.map(c => {
    const cr = data.matrix.filter(m => (m.city || "Unknown") === c && (role === "all" || roleLabel(m.role) === role));
    const s = (pred: (m: OpsData["matrix"][number]) => boolean) => cr.filter(pred).reduce((a, m) => a + m.n, 0);
    return {
      city: c,
      regs: s(() => true),
      paid: s(m => P1_PAID.has(m.p1)),
      video: s(m => HAS_VIDEO.has(m.p1)),
      qualified: s(m => m.p1 === "selected"),
      p2: s(m => P2_PAID.has(m.p2 ?? "")),
      kyc: s(m => KYC_DONE.has(m.p2 ?? "")),
    };
  }).sort((a, b) => b.regs - a.regs);

  const stat = (label: string, value: string) => (
    <div key={label} style={{ flex: "1 1 120px", background: "#060B18", border: "1px solid #1E293B", borderRadius: 10, padding: "10px 14px" }}>
      <div style={{ fontSize: 18, fontWeight: 800, color: "#F1F5F9" }}>{value}</div>
      <div style={{ fontSize: 10.5, color: "#64748B", marginTop: 2 }}>{label}</div>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* filters */}
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <select value={city} onChange={e => setCity(e.target.value)} style={selStyle}>
          <option value="all">All cities</option>
          {cities.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={role} onChange={e => setRole(e.target.value)} style={selStyle}>
          <option value="all">All roles</option>
          {roles.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        <span style={{ fontSize: 11, color: "#475569" }}>Filters apply to KPI cards, funnel and city table instantly.</span>
      </div>

      {/* KPI grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 10 }}>
        {kpis.map(k => (
          <div key={k.label} onClick={() => onNavigate?.(k.tab, k.payload)} title="Open details"
            style={{ ...card, padding: "14px 16px", borderLeft: "3px solid " + k.color, cursor: "pointer" }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: "#F1F5F9", letterSpacing: -0.5 }}>{k.value.toLocaleString()}</div>
            <div style={{ fontSize: 11, color: "#64748B", marginTop: 3 }}>{k.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: 14 }}>
        {/* funnel */}
        <div style={card}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#F1F5F9", marginBottom: 4 }}>Player Funnel</div>
          <div style={{ fontSize: 11, color: "#475569", marginBottom: 14 }}>Registration → trial check-in, end to end.</div>
          {funnel.map((f, i) => (
            <div key={f.name} style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                <span style={{ fontSize: 12, color: "#94A3B8" }}>{f.name}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#F1F5F9" }}>{f.value.toLocaleString()}</span>
              </div>
              <div style={{ height: 7, borderRadius: 4, background: "#1E293B", overflow: "hidden" }}>
                <div style={{ height: "100%", borderRadius: 4, background: f.color, width: ((f.value / funnelMax) * 100) + "%", transition: "width .6s ease" }} />
              </div>
              {i < funnel.length - 1 && f.value > 0 && (
                <div style={{ fontSize: 10, color: "#334155", marginTop: 3 }}>
                  ↓ {Math.round((1 - funnel[i + 1].value / f.value) * 100)}% drop
                </div>
              )}
            </div>
          ))}
        </div>

        {/* AI operations */}
        <div style={card}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#F1F5F9", marginBottom: 4 }}>AI Operations</div>
          <div style={{ fontSize: 11, color: "#475569", marginBottom: 14 }}>All cities — the AI pipeline runs on the full queue.</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
            {stat("In queue", String(aiQueued))}
            {stat("Scoring now", String(aiProcessing))}
            {stat("Completed", String(aiCompleted))}
            {stat("Re-upload asked", String(reupload))}
            {stat("Integrity review", String(integrity))}
            {stat("Skipped (superseded)", String(ev["skipped"] ?? 0))}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {stat("Avg score", data.evals.avgScore != null ? data.evals.avgScore.toFixed(1) : "—")}
            {stat("Avg confidence", data.evals.avgConfidence != null ? Math.round(data.evals.avgConfidence * 100) + "%" : "—")}
            {stat("Avg processing", data.evals.avgProcessingMs != null ? (data.evals.avgProcessingMs / 1000).toFixed(1) + "s" : "—")}
            {stat("Qualification rate", qualRate != null ? qualRate + "%" : "—")}
          </div>
        </div>
      </div>

      {/* city operations table */}
      <div style={card}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#F1F5F9", marginBottom: 12 }}>City Operations</div>
        {cityRows.length === 0 && <div style={{ color: "#475569", fontSize: 13 }}>No registrations yet.</div>}
        {cityRows.length > 0 && (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
              <thead><tr>
                <th style={{ ...thStyle, textAlign: "left" }}>City</th>
                {["Registrations", "P1 Paid", "Video In", "Qualified", "P2 Paid", "KYC Done"].map(h => <th key={h} style={thStyle}>{h}</th>)}
              </tr></thead>
              <tbody>
                {cityRows.map(r => (
                  <tr key={r.city}>
                    <td style={{ ...tdStyle, textAlign: "left", color: "#E2E8F0", fontWeight: 700 }}>{r.city}</td>
                    <td style={tdStyle}>{r.regs.toLocaleString()}</td>
                    <td style={{ ...tdStyle, color: "#10B981" }}>{r.paid.toLocaleString()}</td>
                    <td style={tdStyle}>{r.video.toLocaleString()}</td>
                    <td style={{ ...tdStyle, color: "#FF6B00", fontWeight: 700 }}>{r.qualified.toLocaleString()}</td>
                    <td style={tdStyle}>{r.p2.toLocaleString()}</td>
                    <td style={{ ...tdStyle, color: "#22C55E" }}>{r.kyc.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════ Action Required ═══════════════ */
const SEV_ORDER: Record<OpsAlert["severity"], number> = { critical: 0, warn: 1, info: 2 };
const SEV_COLOR: Record<OpsAlert["severity"], string> = { critical: "#EF4444", warn: "#F59E0B", info: "#3B82F6" };
const SEV_LABEL: Record<OpsAlert["severity"], string> = { critical: "CRITICAL", warn: "ATTENTION", info: "FYI" };

export function AlertsTab({ onNavigate, refreshTick = 0 }: TabProps) {
  const { data, err } = useOps(refreshTick);
  if (err) return <div style={{ ...card, color: "#FCA5A5", fontSize: 13 }}>Failed to load alerts: {err}</div>;
  if (!data) return <div style={{ ...card, color: "#475569", fontSize: 13 }}>Checking for issues…</div>;

  const alerts = [...data.alerts].sort((a, b) => SEV_ORDER[a.severity] - SEV_ORDER[b.severity]);
  if (alerts.length === 0) {
    return (
      <div style={{ ...card, textAlign: "center", padding: "48px 20px" }}>
        <div style={{ fontSize: 17, fontWeight: 800, color: "#10B981" }}>All clear</div>
        <div style={{ fontSize: 12.5, color: "#64748B", marginTop: 6 }}>Nothing needs your attention right now. This panel re-checks automatically.</div>
      </div>
    );
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {alerts.map(a => (
        <div key={a.id} onClick={() => onNavigate?.(a.tab)} title="Open the relevant section"
          style={{ ...card, padding: "14px 18px", borderLeft: "3px solid " + SEV_COLOR[a.severity], cursor: "pointer", display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ minWidth: 44, height: 44, borderRadius: 10, background: SEV_COLOR[a.severity] + "1A", border: "1px solid " + SEV_COLOR[a.severity] + "44", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 16, fontWeight: 900, color: SEV_COLOR[a.severity] }}>{a.count.toLocaleString()}</span>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#E2E8F0" }}>{a.label}</div>
            <div style={{ fontSize: 10.5, fontWeight: 800, color: SEV_COLOR[a.severity], letterSpacing: ".08em", marginTop: 3 }}>{SEV_LABEL[a.severity]}</div>
          </div>
          <span style={{ fontSize: 12, color: "#475569" }}>Open →</span>
        </div>
      ))}
    </div>
  );
}

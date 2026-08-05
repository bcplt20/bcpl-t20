import { useState } from "react";
import { downloadCsv, type ExportDataset } from "../../lib/adminToolsApi";

/* Real CSV export — streams live DB data from /api/admin-tools/export/:dataset */

const DATASETS: { id: ExportDataset; label: string; icon: string; desc: string; fields: string[] }[] = [
  {
    id: "registrations", label: "Registrations", icon: "👥",
    desc: "Every player registration with contact details and phase status",
    fields: ["Reg Number", "Name", "Phone", "Email", "Role", "Trial City", "Phase 1 Status", "Phase 2 Status", "Registered On"],
  },
  {
    id: "payments", label: "Payments", icon: "💰",
    desc: "Phase-1 & Phase-2 payment attempts from Cashfree",
    fields: ["Date", "Player", "Phone", "Reg Number", "Phase", "Amount (Rs)", "Status", "Cashfree Order ID", "Cashfree Payment ID", "Paid At"],
  },
  {
    id: "kyc", label: "KYC Records", icon: "🪪",
    desc: "KYC submissions with PAN / Aadhaar verification flags",
    fields: ["Player", "Phone", "Reg Number", "Profession", "Status", "PAN Verified", "Aadhaar Verified", "Submitted On", "Verified On"],
  },
  {
    id: "videos", label: "Trial Videos", icon: "🎬",
    desc: "Submitted trial videos with review status and S3 link",
    fields: ["Player", "Phone", "Reg Number", "Trial City", "Status", "Submitted On", "Video URL"],
  },
];

const STATUS_OPTIONS: Record<ExportDataset, { value: string; label: string }[]> = {
  registrations: [
    { value: "", label: "All statuses" },
    { value: "pending", label: "Pending (not paid)" },
    { value: "payment_done", label: "Payment done" },
    { value: "video_submitted", label: "Video submitted" },
    { value: "selected", label: "Selected" },
    { value: "rejected", label: "Rejected" },
  ],
  payments: [
    { value: "", label: "All statuses" },
    { value: "paid", label: "Paid only (success)" },
    { value: "pending", label: "Pending" },
    { value: "failed", label: "Failed" },
  ],
  kyc: [
    { value: "", label: "All statuses" },
    { value: "pending", label: "Pending" },
    { value: "verified", label: "Verified" },
    { value: "failed", label: "Failed" },
  ],
  videos: [
    { value: "", label: "All statuses" },
    { value: "submitted", label: "Awaiting review" },
    { value: "reviewed", label: "Reviewed" },
  ],
};

const card: React.CSSProperties = { background: "linear-gradient(135deg,#0D1526,#0A1020)", border: "1px solid #1E293B", borderRadius: 16, padding: 20 };
const inputStyle: React.CSSProperties = { width: "100%", padding: "9px 12px", background: "#060B18", border: "1px solid #1E293B", borderRadius: 10, color: "#F1F5F9", fontSize: 13, outline: "none" };
const labelStyle: React.CSSProperties = { fontSize: 11, fontWeight: 700, color: "#475569", display: "block", marginBottom: 7 };

export default function DataExportView() {
  const [ds, setDs] = useState<ExportDataset>("registrations");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [city, setCity] = useState("");
  const [status, setStatus] = useState("");
  const [role, setRole] = useState("");
  const [phase, setPhase] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<{ name: string; at: string }[]>([]);

  const selDs = DATASETS.find(d => d.id === ds)!;

  function pickDataset(id: ExportDataset) {
    setDs(id);
    setStatus("");
    setRole("");
    setPhase("");
    setError(null);
  }

  async function handleExport() {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string> = { from: dateFrom, to: dateTo };
      if (ds === "registrations") { params.city = city; params.status = status; params.role = role; }
      if (ds === "payments") { params.status = status; params.phase = phase; }
      if (ds === "kyc" || ds === "videos") { params.status = status; }
      const name = await downloadCsv(ds, params);
      setHistory(h => [{ name, at: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) }, ...h].slice(0, 10));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <div style={{ fontSize: 20, fontWeight: 800, color: "#F1F5F9" }}>Data Export</div>
        <div style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}>
          Download live data from the database as CSV — opens in Excel / Google Sheets
        </div>
      </div>

      {error && (
        <div style={{ background: "#EF444422", border: "1px solid #EF4444", borderRadius: 10, padding: "10px 14px", color: "#FCA5A5", fontSize: 13 }}>
          Export failed: {error}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 16 }}>
        {/* Builder */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Dataset picker */}
          <div style={card}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#F1F5F9", marginBottom: 14 }}>1. Choose Dataset</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 8 }}>
              {DATASETS.map(d => (
                <button key={d.id} onClick={() => pickDataset(d.id)}
                  style={{ padding: 12, borderRadius: 10, border: `1px solid ${ds === d.id ? "#FF6B00" : "#1E293B"}`, background: ds === d.id ? "#FF6B0018" : "transparent", cursor: "pointer", textAlign: "left" }}>
                  <div style={{ fontSize: 20, marginBottom: 6 }}>{d.icon}</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: ds === d.id ? "#FF6B00" : "#94A3B8" }}>{d.label}</div>
                  <div style={{ fontSize: 11, color: "#64748B", marginTop: 3 }}>{d.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Filters */}
          <div style={card}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#F1F5F9", marginBottom: 14 }}>2. Apply Filters (optional)</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={labelStyle}>DATE FROM</label>
                <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>DATE TO</label>
                <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>STATUS</label>
                <select value={status} onChange={e => setStatus(e.target.value)} style={inputStyle}>
                  {STATUS_OPTIONS[ds].map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              {ds === "registrations" && (
                <>
                  <div>
                    <label style={labelStyle}>ROLE</label>
                    <select value={role} onChange={e => setRole(e.target.value)} style={inputStyle}>
                      <option value="">All roles</option>
                      <option value="bat">Batsman</option>
                      <option value="bowl">Bowler</option>
                      <option value="wk">Wicket Keeper</option>
                      <option value="ar">All Rounder</option>
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>TRIAL CITY</label>
                    <input value={city} onChange={e => setCity(e.target.value)} placeholder="e.g. Delhi (blank = all)" style={inputStyle} />
                  </div>
                </>
              )}
              {ds === "payments" && (
                <div>
                  <label style={labelStyle}>PHASE</label>
                  <select value={phase} onChange={e => setPhase(e.target.value)} style={inputStyle}>
                    <option value="">Both phases</option>
                    <option value="1">Phase 1 only</option>
                    <option value="2">Phase 2 only</option>
                  </select>
                </div>
              )}
            </div>
            <div style={{ fontSize: 11, color: "#475569", marginTop: 12 }}>
              Dates use Indian time (IST). Leave blank to export everything.
            </div>
          </div>
        </div>

        {/* Summary + download */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={card}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#F1F5F9", marginBottom: 10 }}>{selDs.icon} {selDs.label} — columns included</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {selDs.fields.map(f => (
                <span key={f} style={{ fontSize: 11, color: "#94A3B8", background: "#1E293B66", border: "1px solid #1E293B", borderRadius: 6, padding: "3px 8px" }}>{f}</span>
              ))}
            </div>
            <button onClick={handleExport} disabled={loading}
              style={{ width: "100%", marginTop: 18, padding: "13px 0", borderRadius: 12, border: "none", background: loading ? "#334155" : "linear-gradient(135deg,#FF6B00,#FF8C40)", color: "#fff", fontSize: 14, fontWeight: 800, cursor: loading ? "wait" : "pointer" }}>
              {loading ? "Preparing CSV…" : "⬇ Download CSV"}
            </button>
            <div style={{ fontSize: 11, color: "#475569", marginTop: 10, textAlign: "center" }}>
              UTF-8 CSV with Indian date format — file downloads instantly
            </div>
          </div>

          <div style={card}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#F1F5F9", marginBottom: 10 }}>Downloads (this session)</div>
            {history.length === 0 ? (
              <div style={{ fontSize: 12, color: "#475569" }}>No downloads yet — pick a dataset and click Download.</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {history.map((h, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", gap: 8, fontSize: 12, color: "#94A3B8", borderBottom: i < history.length - 1 ? "1px solid #1E293B55" : "none", paddingBottom: 6 }}>
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>📄 {h.name}</span>
                    <span style={{ color: "#475569", flexShrink: 0 }}>{h.at}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

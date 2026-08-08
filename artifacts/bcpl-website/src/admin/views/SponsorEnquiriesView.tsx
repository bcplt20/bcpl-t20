import { useEffect, useState, useCallback } from "react";
import {
  fetchSponsorEnquiries,
  updateSponsorEnquiry,
  type SponsorEnquiry,
  type EnquiryStatus,
} from "../api/sponsorEnquiriesApi";

const STATUS: Array<{ id: EnquiryStatus; label: string; color: string }> = [
  { id: "new",       label: "New",       color: "#3B82F6" },
  { id: "contacted", label: "Contacted", color: "#F59E0B" },
  { id: "closed",    label: "Closed",    color: "#10B981" },
];
const colorOf = (s: EnquiryStatus) => STATUS.find(x => x.id === s)?.color ?? "#8593B3";

/* Keys match the server's BUDGET_RANGES vocabulary exactly (case-sensitive). */
const BUDGET_LABEL: Record<string, string> = {
  "under-1L": "Under ₹1L",
  "1-5L": "₹1–5L",
  "5-15L": "₹5–15L",
  "15L-plus": "₹15L+",
  "custom": "Prefer not to say",
};

function fmtDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso || "—";
  return d.toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function SponsorEnquiriesView() {
  const [rows, setRows]       = useState<SponsorEnquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr]         = useState("");
  const [filter, setFilter]   = useState<"all" | EnquiryStatus>("all");
  const [savingId, setSavingId] = useState<string | null>(null);
  // Local buffer for the inline note editor (id → text)
  const [noteDraft, setNoteDraft] = useState<Record<string, string>>({});

  const card: React.CSSProperties = { background: "linear-gradient(135deg,#2C3A5E,#1F2B49)", border: "1px solid #33436B", borderRadius: 16, padding: 20 };

  const load = useCallback(async () => {
    setLoading(true); setErr("");
    try {
      const r = await fetchSponsorEnquiries();
      const list = (r.enquiries ?? []).slice().sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
      setRows(list);
    } catch {
      // Endpoint may not be live yet (built in parallel) — degrade gracefully.
      setErr("Couldn't load enquiries. The endpoint may not be available yet.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const setStatus = async (row: SponsorEnquiry, status: EnquiryStatus) => {
    if (row.status === status) return;
    setSavingId(row.id);
    const prev = rows;
    setRows(rs => rs.map(r => r.id === row.id ? { ...r, status } : r));
    try {
      await updateSponsorEnquiry(row.id, { status });
    } catch {
      setRows(prev); // revert on failure
      setErr("Couldn't update status — try again.");
    } finally {
      setSavingId(null);
    }
  };

  const saveNote = async (row: SponsorEnquiry) => {
    const adminNote = noteDraft[row.id] ?? row.adminNote ?? "";
    if (adminNote === (row.adminNote ?? "")) return;
    setSavingId(row.id);
    const prev = rows;
    setRows(rs => rs.map(r => r.id === row.id ? { ...r, adminNote } : r));
    try {
      await updateSponsorEnquiry(row.id, { adminNote });
    } catch {
      setRows(prev);
      setErr("Couldn't save note — try again.");
    } finally {
      setSavingId(null);
    }
  };

  const filtered = filter === "all" ? rows : rows.filter(r => r.status === filter);
  const countOf = (s: EnquiryStatus) => rows.filter(r => r.status === s).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#F1F5F9" }}>Sponsorship Enquiries</div>
          <div style={{ fontSize: 12, color: "#A6B3D0", marginTop: 2 }}>Leads submitted from the Sponsorship Hub — newest first</div>
        </div>
        <button onClick={() => void load()} style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid #33436B", background: "transparent", color: "#A6B3D0", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
          ↻ Refresh
        </button>
      </div>

      {/* Stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
        {[
          { label: "Total", value: rows.length, color: "#6366F1" },
          ...STATUS.map(s => ({ label: s.label, value: countOf(s.id), color: s.color })),
        ].map(s => (
          <div key={s.label} style={{ ...card, borderTop: `3px solid ${s.color}` }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 11, color: "#A6B3D0", marginTop: 5 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {(["all", ...STATUS.map(s => s.id)] as const).map(f => {
          const on = filter === f;
          const label = f === "all" ? "All" : STATUS.find(s => s.id === f)!.label;
          return (
            <button key={f} onClick={() => setFilter(f)} style={{ padding: "6px 14px", borderRadius: 8, border: `1px solid ${on ? "#FF6B00" : "#33436B"}`, background: on ? "#FF6B0022" : "transparent", color: on ? "#FF6B00" : "#A6B3D0", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>{label}</button>
          );
        })}
      </div>

      {err && (
        <div style={{ ...card, borderColor: "#EF444440", color: "#FCA5A5", fontSize: 12 }}>⚠ {err}</div>
      )}

      {loading ? (
        <div style={{ ...card, textAlign: "center", color: "#8593B3", fontSize: 12, padding: "36px 16px" }}>Loading enquiries…</div>
      ) : filtered.length === 0 ? (
        <div style={{ ...card, textAlign: "center", color: "#8593B3", fontSize: 12, padding: "36px 16px" }}>
          No enquiries {filter === "all" ? "yet" : `with status “${filter}”`}. New leads from the Sponsorship Hub will appear here.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {filtered.map(row => {
            const draft = noteDraft[row.id] ?? row.adminNote ?? "";
            const saving = savingId === row.id;
            return (
              <div key={row.id} style={{ ...card, border: `1px solid ${colorOf(row.status)}40` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
                  <div style={{ minWidth: 220 }}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: "#F1F5F9" }}>
                      {row.name} <span style={{ color: "#A6B3D0", fontWeight: 600 }}>· {row.company}</span>
                    </div>
                    <div style={{ fontSize: 12, color: "#A6B3D0", marginTop: 4 }}>
                      {row.designation ? `${row.designation} · ` : ""}{fmtDate(row.createdAt)}
                    </div>
                    <div style={{ fontSize: 12, color: "#CBD5E1", marginTop: 6, display: "flex", gap: 14, flexWrap: "wrap" }}>
                      <a href={`tel:${row.phone}`} style={{ color: "#93C5FD", textDecoration: "none" }}>📞 {row.phone}</a>
                      {row.email && <a href={`mailto:${row.email}`} style={{ color: "#93C5FD", textDecoration: "none" }}>✉ {row.email}</a>}
                      <span style={{ color: "#FFD873" }}>💰 {BUDGET_LABEL[row.budgetRange] ?? row.budgetRange}</span>
                    </div>
                  </div>

                  {/* Status chips */}
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {STATUS.map(s => {
                      const on = row.status === s.id;
                      return (
                        <button key={s.id} onClick={() => void setStatus(row, s.id)} disabled={saving}
                          style={{ fontSize: 10, fontWeight: 800, padding: "5px 10px", borderRadius: 6, cursor: saving ? "wait" : "pointer", border: `1px solid ${on ? s.color : "#33436B"}`, background: on ? `${s.color}22` : "transparent", color: on ? s.color : "#8593B3", letterSpacing: .3, textTransform: "uppercase" }}>
                          {s.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {row.message && (
                  <div style={{ marginTop: 10, fontSize: 13, color: "#CBD5E1", lineHeight: 1.6, background: "#1F2B49", border: "1px solid #33436B", borderRadius: 10, padding: "10px 12px" }}>
                    {row.message}
                  </div>
                )}

                {/* Inline note */}
                <div style={{ marginTop: 10 }}>
                  <label style={{ fontSize: 10, fontWeight: 800, color: "#8593B3", letterSpacing: .5, textTransform: "uppercase" }}>Internal note</label>
                  <div style={{ display: "flex", gap: 8, marginTop: 5, alignItems: "flex-start" }}>
                    <textarea
                      value={draft}
                      onChange={e => setNoteDraft(d => ({ ...d, [row.id]: e.target.value }))}
                      placeholder="Add a note (visible to admins only)…"
                      rows={2}
                      style={{ flex: 1, resize: "vertical", background: "#1F2B49", border: "1px solid #33436B", borderRadius: 10, padding: "8px 10px", color: "#E2E8F0", fontSize: 12.5, fontFamily: "inherit", outline: "none" }}
                    />
                    <button onClick={() => void saveNote(row)} disabled={saving || draft === (row.adminNote ?? "")}
                      style={{ padding: "8px 14px", borderRadius: 8, border: "none", background: draft === (row.adminNote ?? "") ? "#33436B" : "linear-gradient(135deg,#FF6B00,#FF8C40)", color: "#fff", fontSize: 11, fontWeight: 800, cursor: draft === (row.adminNote ?? "") ? "default" : "pointer", opacity: saving ? 0.7 : 1, whiteSpace: "nowrap" }}>
                      {saving ? "Saving…" : "Save note"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

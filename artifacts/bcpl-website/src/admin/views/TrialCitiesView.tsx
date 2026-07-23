import { useState, useEffect, useCallback } from "react";
import {
  adminGetTrialVenues,
  adminCreateTrialVenue,
  adminUpdateTrialVenue,
  adminDeleteTrialVenue,
  adminAnnounceTrialVenue,
} from "../../lib/api";
import { SlotsTab, AllocationsTab, CheckinTab, AssessTab } from "./TrialsOps";

type Venue = {
  id: string;
  city: string;
  venue: string;
  trialDate: string;
  trialTime: string;
  reportingTime: string;
  slots: number;
  notes: string | null;
  status: string;
  announcedAt: string | null;
  createdAt: string;
};

const statusColor = (s: string) =>
  s === "completed" ? "#64748B" : s === "active" ? "#10B981" : "#F59E0B";

const card: React.CSSProperties = {
  background: "linear-gradient(135deg,#0D1526,#0A1020)",
  border: "1px solid #1E293B",
  borderRadius: 16,
  padding: 20,
};

const inp: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 9,
  border: "1px solid #1E293B",
  background: "#060B18",
  color: "#E2E8F0",
  fontSize: 13,
  outline: "none",
  boxSizing: "border-box",
};

const EMPTY_FORM = {
  city: "", venue: "", trialDate: "", trialTime: "8:00 AM – 1:00 PM",
  reportingTime: "7:30 AM", slots: "100", notes: "",
};

export default function TrialCitiesView() {
  const [venues, setVenues]       = useState<Venue[]>([]);
  const [loading, setLoading]     = useState(true);
  const [err, setErr]             = useState("");
  const [addOpen, setAddOpen]     = useState(false);
  const [editVenue, setEditVenue] = useState<Venue | null>(null);
  const [acting, setActing]       = useState<string | null>(null);
  const [form, setForm]           = useState({ ...EMPTY_FORM });
  const [saving, setSaving]       = useState(false);
  const [confirmDel, setConfirmDel] = useState<string | null>(null);
  const [announceResult, setAnnounceResult] = useState<{ id: string; sent: number; total: number } | null>(null);
  const [ttab, setTtab] = useState<"cities" | "slots" | "alloc" | "checkin" | "assess">("cities");

  const load = useCallback(async () => {
    setLoading(true); setErr("");
    try {
      const { venues: v } = await adminGetTrialVenues();
      setVenues(v);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── Computed stats ───────────────────────────────────────────────
  const total    = venues.length;
  const upcoming = venues.filter(v => v.status === "upcoming").length;
  const active   = venues.filter(v => v.status === "active").length;
  const announced = venues.filter(v => v.announcedAt).length;

  // ── Add / Edit helpers ──────────────────────────────────────────
  const openAdd = () => { setForm({ ...EMPTY_FORM }); setEditVenue(null); setAddOpen(true); };
  const openEdit = (v: Venue) => {
    setForm({ city: v.city, venue: v.venue, trialDate: v.trialDate, trialTime: v.trialTime, reportingTime: v.reportingTime, slots: String(v.slots), notes: v.notes ?? "" });
    setEditVenue(v); setAddOpen(true);
  };

  const handleSave = async () => {
    if (!form.city || !form.venue || !form.trialDate || !form.trialTime || !form.reportingTime) {
      alert("Please fill all required fields."); return;
    }
    setSaving(true);
    try {
      const payload = { ...form, slots: parseInt(form.slots) || 100 };
      if (editVenue) {
        const { venue: updated } = await adminUpdateTrialVenue(editVenue.id, payload);
        setVenues(prev => prev.map(v => v.id === updated.id ? updated : v));
      } else {
        const { venue: created } = await adminCreateTrialVenue(payload);
        setVenues(prev => [...prev, created]);
      }
      setAddOpen(false);
    } catch (e: any) {
      alert("Error: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setActing(id);
    try {
      await adminDeleteTrialVenue(id);
      setVenues(prev => prev.filter(v => v.id !== id));
      setConfirmDel(null);
    } catch (e: any) {
      alert("Error: " + e.message);
    } finally {
      setActing(null);
    }
  };

  const handleAnnounce = async (id: string) => {
    setActing(id);
    try {
      const result = await adminAnnounceTrialVenue(id);
      setAnnounceResult({ id, sent: result.sent, total: result.total });
      setVenues(prev => prev.map(v => v.id === id ? { ...v, announcedAt: new Date().toISOString() } : v));
    } catch (e: any) {
      alert("Error announcing: " + e.message);
    } finally {
      setActing(null);
    }
  };

  const handleStatusChange = async (v: Venue, status: string) => {
    setActing(v.id);
    try {
      const { venue: updated } = await adminUpdateTrialVenue(v.id, { status });
      setVenues(prev => prev.map(x => x.id === updated.id ? updated : x));
    } catch (e: any) {
      alert(e.message);
    } finally {
      setActing(null);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* Stage 4 — trial ops tabs */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", borderBottom: "1px solid #1E293B", paddingBottom: 12 }}>
        {([["cities", "\ud83c\udfd9\ufe0f Cities & Venues"], ["slots", "\ud83d\uddd3\ufe0f Slots & Allocation"], ["alloc", "\ud83d\udc65 Allocations"], ["checkin", "\ud83c\udfab Check-In"], ["assess", "\ud83d\udccb Assessments"]] as const).map(([k, label]) => (
          <button key={k} onClick={() => setTtab(k)} style={{ padding: "8px 16px", borderRadius: 9, border: "1px solid " + (ttab === k ? "#F59E0B" : "#1E293B"), background: ttab === k ? "rgba(245,158,11,0.12)" : "transparent", color: ttab === k ? "#FBBF24" : "#94A3B8", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>{label}</button>
        ))}
      </div>
      {ttab === "slots" && <SlotsTab />}
      {ttab === "alloc" && <AllocationsTab />}
      {ttab === "checkin" && <CheckinTab />}
      {ttab === "assess" && <AssessTab />}
      {ttab === "cities" && (<>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#F1F5F9" }}>Trial City Manager</div>
          <div style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}>Add venues, manage slots, and announce trial details to Phase 2 players</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={load} style={{ padding: "9px 16px", borderRadius: 9, border: "1px solid #1E293B", background: "transparent", color: "#64748B", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>↺ Refresh</button>
          <button onClick={openAdd} style={{ padding: "9px 16px", borderRadius: 9, border: "none", background: "linear-gradient(135deg,#FF6B00,#FF8C40)", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>+ Add City</button>
        </div>
      </div>

      {err && (
        <div style={{ padding: 14, borderRadius: 10, background: "#EF444415", border: "1px solid #EF444440", color: "#EF4444", fontSize: 12 }}>
          ⚠ {err} — <button onClick={load} style={{ background: "none", border: "none", color: "#EF4444", cursor: "pointer", fontWeight: 700, fontSize: 12 }}>Retry</button>
        </div>
      )}

      {announceResult && (
        <div style={{ padding: 14, borderRadius: 10, background: "#10B98115", border: "1px solid #10B98140", color: "#10B981", fontSize: 13, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>✅ Announcement sent to <strong>{announceResult.sent}</strong> of {announceResult.total} eligible Phase 2 players</span>
          <button onClick={() => setAnnounceResult(null)} style={{ background: "none", border: "none", color: "#10B981", cursor: "pointer", fontSize: 16 }}>×</button>
        </div>
      )}

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
        {[
          { label: "Total Cities",     value: total,     color: "#6366F1" },
          { label: "Upcoming",         value: upcoming,  color: "#F59E0B" },
          { label: "Active",           value: active,    color: "#10B981" },
          { label: "Announced",        value: announced, color: "#FF6B00" },
        ].map(s => (
          <div key={s.label} style={{ ...card, borderTop: `3px solid ${s.color}` }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: s.color }}>{loading ? "…" : s.value}</div>
            <div style={{ fontSize: 11, color: "#64748B", marginTop: 5 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Venue cards */}
      {loading ? (
        <div style={{ ...card, padding: 60, textAlign: "center", color: "#334155", fontSize: 14 }}>Loading venues…</div>
      ) : venues.length === 0 ? (
        <div style={{ ...card, padding: 80, textAlign: "center" }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🏟️</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#334155" }}>No trial venues added yet</div>
          <div style={{ fontSize: 12, color: "#1E293B", marginTop: 8 }}>Add your first city to get started. Players will be notified when you announce.</div>
          <button onClick={openAdd} style={{ marginTop: 20, padding: "11px 24px", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#FF6B00,#FF8C40)", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>+ Add First City</button>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(340px,1fr))", gap: 16 }}>
          {venues.map(v => (
            <div key={v.id} style={{ ...card, position: "relative" }}>
              {/* Top row */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                <div>
                  <div style={{ fontSize: 17, fontWeight: 800, color: "#F1F5F9" }}>{v.city}</div>
                  <div style={{ fontSize: 12, color: "#64748B", marginTop: 3 }}>🏟 {v.venue}</div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 5 }}>
                  <span style={{ fontSize: 10, fontWeight: 800, padding: "3px 10px", borderRadius: 8, background: `${statusColor(v.status)}22`, color: statusColor(v.status), border: `1px solid ${statusColor(v.status)}40` }}>
                    {v.status.charAt(0).toUpperCase() + v.status.slice(1)}
                  </span>
                  {v.announcedAt && (
                    <span style={{ fontSize: 9, color: "#10B981", fontWeight: 700 }}>📢 Announced</span>
                  )}
                </div>
              </div>

              {/* Details grid */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 14 }}>
                {[
                  { label: "📅 Trial Date", value: v.trialDate },
                  { label: "⏰ Trial Time", value: v.trialTime },
                  { label: "🕐 Reporting", value: v.reportingTime },
                  { label: "🎟 Slots", value: v.slots },
                ].map(d => (
                  <div key={d.label} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 8, padding: "8px 10px" }}>
                    <div style={{ fontSize: 9, color: "#475569", marginBottom: 3, fontWeight: 700, letterSpacing: ".06em" }}>{d.label}</div>
                    <div style={{ fontSize: 12, color: "#E2E8F0", fontWeight: 600 }}>{d.value}</div>
                  </div>
                ))}
              </div>

              {v.notes && (
                <div style={{ fontSize: 11, color: "#475569", background: "rgba(255,255,255,0.03)", borderRadius: 8, padding: "8px 10px", marginBottom: 12 }}>
                  📝 {v.notes}
                </div>
              )}

              {/* Actions */}
              <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
                {/* Announce button */}
                <button
                  disabled={acting === v.id}
                  onClick={() => handleAnnounce(v.id)}
                  style={{ flex: 1, minWidth: 100, padding: "8px 10px", borderRadius: 8, border: "none", background: v.announcedAt ? "rgba(16,185,129,0.12)" : "linear-gradient(135deg,#FF6B00,#FF8C40)", color: v.announcedAt ? "#10B981" : "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer", opacity: acting === v.id ? 0.5 : 1 }}>
                  {acting === v.id ? "Sending…" : v.announcedAt ? "✅ Re-Announce" : "📢 Announce"}
                </button>
                {/* Edit */}
                <button onClick={() => openEdit(v)} style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #1E293B", background: "transparent", color: "#94A3B8", fontSize: 11, cursor: "pointer" }}>✏ Edit</button>
                {/* Status toggle */}
                {v.status !== "completed" && (
                  <button
                    disabled={acting === v.id}
                    onClick={() => handleStatusChange(v, v.status === "upcoming" ? "active" : "completed")}
                    style={{ padding: "8px 12px", borderRadius: 8, border: `1px solid ${statusColor(v.status)}40`, background: `${statusColor(v.status)}12`, color: statusColor(v.status), fontSize: 11, cursor: "pointer", opacity: acting === v.id ? 0.5 : 1 }}>
                    {v.status === "upcoming" ? "▶ Start" : "✓ Done"}
                  </button>
                )}
                {/* Delete */}
                <button onClick={() => setConfirmDel(v.id)} style={{ padding: "8px 10px", borderRadius: 8, border: "1px solid #EF444440", background: "transparent", color: "#EF4444", fontSize: 11, cursor: "pointer" }}>🗑</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {addOpen && (
        <div style={{ position: "fixed", inset: 0, background: "#00000085", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
          onClick={() => setAddOpen(false)}>
          <div style={{ ...card, width: "100%", maxWidth: 520, padding: 28 }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#F1F5F9", marginBottom: 20 }}>
              {editVenue ? "Edit Trial Venue" : "Add New Trial City"}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {[
                { l: "City Name *", k: "city", ph: "e.g. Mumbai" },
                { l: "Venue / Ground *", k: "venue", ph: "e.g. Wankhede Stadium, Marine Lines" },
                { l: "Trial Date *", k: "trialDate", ph: "e.g. 12 August 2025" },
                { l: "Trial Time *", k: "trialTime", ph: "e.g. 8:00 AM – 1:00 PM" },
                { l: "Reporting Time *", k: "reportingTime", ph: "e.g. 7:30 AM" },
                { l: "Total Slots", k: "slots", ph: "100" },
                { l: "Notes (optional)", k: "notes", ph: "Any special instructions…" },
              ].map(f => (
                <div key={f.k}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: "#475569", display: "block", marginBottom: 6, letterSpacing: ".06em", textTransform: "uppercase" }}>{f.l}</label>
                  <input
                    style={inp}
                    placeholder={f.ph}
                    value={(form as any)[f.k]}
                    onChange={e => setForm(prev => ({ ...prev, [f.k]: e.target.value }))}
                  />
                </div>
              ))}
              <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                <button onClick={() => setAddOpen(false)} style={{ flex: 1, padding: "11px", borderRadius: 10, border: "1px solid #1E293B", background: "transparent", color: "#94A3B8", fontSize: 13, cursor: "pointer" }}>Cancel</button>
                <button onClick={handleSave} disabled={saving} style={{ flex: 1, padding: "11px", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#FF6B00,#FF8C40)", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer", opacity: saving ? 0.6 : 1 }}>
                  {saving ? "Saving…" : editVenue ? "Save Changes" : "Add City"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete */}
      {confirmDel && (
        <div style={{ position: "fixed", inset: 0, background: "#00000085", zIndex: 110, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
          onClick={() => setConfirmDel(null)}>
          <div style={{ ...card, width: "100%", maxWidth: 380, padding: 24, textAlign: "center" }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>🗑</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#F1F5F9", marginBottom: 8 }}>Delete this venue?</div>
            <div style={{ fontSize: 12, color: "#64748B", marginBottom: 20 }}>This action cannot be undone. Players who were already notified will not receive a cancellation.</div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setConfirmDel(null)} style={{ flex: 1, padding: "11px", borderRadius: 10, border: "1px solid #1E293B", background: "transparent", color: "#94A3B8", fontSize: 13, cursor: "pointer" }}>Cancel</button>
              <button onClick={() => handleDelete(confirmDel)} disabled={acting === confirmDel} style={{ flex: 1, padding: "11px", borderRadius: 10, border: "none", background: "#EF4444", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer", opacity: acting === confirmDel ? 0.6 : 1 }}>
                {acting === confirmDel ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
      </>)}
    </div>
  );
}

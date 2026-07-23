/**
 * Stage 4 — Physical Trials operations tabs (rendered inside TrialCitiesView).
 *   SlotsTab       — batches/slots per venue + auto-allocation runner + venue address
 *   AllocationsTab — allocated players, manual move / cancel
 *   CheckinTab     — QR / player-ID check-in desk + recent check-ins
 *   AssessTab      — role-specific physical assessment forms + results
 */
import { useState, useEffect, useCallback } from "react";
import {
  adminGetTrialVenues,
  adminGetTrialSlots, adminCreateTrialSlot, adminPatchTrialSlot, adminDeleteTrialSlot,
  adminPatchTrialVenueExtras,
  adminRunTrialAllocation, adminGetTrialAllocations, adminMoveTrialAllocation, adminCancelTrialAllocation,
  adminTrialCheckin, adminGetTrialCheckins,
  adminGetAssessmentConfig, adminSaveAssessment, adminPatchAssessment, adminGetAssessments,
  adminGetTrialsOverview,
  type TrialSlotRow, type TrialAllocRow, type TrialCheckinRow, type AssessmentRow,
  type TrialsOverviewCity, type AllocationRunResult, type AssessmentConfig,
} from "../../lib/api";

/* ── shared styles (match admin design) ─────────────────────────── */
const card: React.CSSProperties = {
  background: "linear-gradient(135deg,#0D1526,#0A1020)",
  border: "1px solid #1E293B", borderRadius: 16, padding: 20,
};
const inp: React.CSSProperties = {
  padding: "9px 12px", borderRadius: 9, border: "1px solid #1E293B",
  background: "#060B18", color: "#E2E8F0", fontSize: 13, outline: "none", boxSizing: "border-box",
};
const btn = (bg: string, color = "#fff"): React.CSSProperties => ({
  padding: "9px 16px", borderRadius: 9, border: "none", background: bg, color,
  fontSize: 12.5, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap",
});
const ghost: React.CSSProperties = {
  padding: "7px 12px", borderRadius: 8, border: "1px solid #1E293B", background: "transparent",
  color: "#94A3B8", fontSize: 12, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap",
};
const th: React.CSSProperties = { textAlign: "left", padding: "8px 10px", fontSize: 10.5, color: "#64748B", letterSpacing: 0.8, textTransform: "uppercase", borderBottom: "1px solid #1E293B", whiteSpace: "nowrap" };
const td: React.CSSProperties = { padding: "9px 10px", fontSize: 12.5, color: "#CBD5E1", borderBottom: "1px solid #131C2E", verticalAlign: "middle" };
const chip = (bg: string, c: string): React.CSSProperties => ({ display: "inline-block", padding: "2px 9px", borderRadius: 99, fontSize: 10.5, fontWeight: 700, background: bg, color: c, whiteSpace: "nowrap" });

const errBox: React.CSSProperties = { background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", color: "#FCA5A5", borderRadius: 10, padding: "10px 14px", fontSize: 12.5, marginBottom: 14 };
const okBox: React.CSSProperties = { background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.25)", color: "#6EE7B7", borderRadius: 10, padding: "10px 14px", fontSize: 12.5, marginBottom: 14 };

type Venue = { id: string; city: string; venue: string; trialDate: string; trialTime: string; reportingTime: string; status: string; address?: string | null; mapsUrl?: string | null };

const roleChip = (role: string) => {
  const r = String(role || "").toLowerCase();
  if (r.startsWith("bowl")) return chip("rgba(59,130,246,0.12)", "#60A5FA");
  if (r.startsWith("all") || r === "ar") return chip("rgba(168,85,247,0.12)", "#C084FC");
  if (r.startsWith("wicket") || r === "wk" || r.startsWith("keep")) return chip("rgba(236,72,153,0.12)", "#F472B6");
  return chip("rgba(245,158,11,0.12)", "#FBBF24");
};
const roleLabel = (role: string) => {
  const r = String(role || "").toLowerCase();
  if (r.startsWith("bowl")) return "Bowler";
  if (r.startsWith("all") || r === "ar") return "All-Rounder";
  if (r.startsWith("wicket") || r === "wk" || r.startsWith("keep")) return "Wicket-Keeper";
  return "Batsman";
};
const normalizeRoleClient = (role: string) => {
  const r = String(role || "").toLowerCase().replace(/[^a-z]/g, "");
  if (r.startsWith("bowl")) return "bowler";
  if (r.startsWith("all") || r === "ar") return "all_rounder";
  if (r.startsWith("wicket") || r === "wk" || r.startsWith("keep")) return "wicket_keeper";
  return "batsman";
};
const fmtTime = (iso: string | null | undefined) => iso ? new Date(iso).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "—";

/* ════════════════════════ SLOTS TAB ═══════════════════════════════ */

export function SlotsTab() {
  const [slots, setSlots] = useState<TrialSlotRow[]>([]);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [overview, setOverview] = useState<TrialsOverviewCity[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  // create form
  const [venueId, setVenueId] = useState("");
  const [batchName, setBatchName] = useState("");
  const [capacity, setCapacity] = useState("100");
  const [creating, setCreating] = useState(false);
  // allocation runner
  const [allocCity, setAllocCity] = useState("");
  const [preview, setPreview] = useState<AllocationRunResult | null>(null);
  const [running, setRunning] = useState(false);
  // venue extras
  const [extraVenueId, setExtraVenueId] = useState("");
  const [address, setAddress] = useState("");
  const [mapsUrl, setMapsUrl] = useState("");
  const [savingExtras, setSavingExtras] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setErr("");
    try {
      const [s, v, o] = await Promise.all([adminGetTrialSlots(), adminGetTrialVenues(), adminGetTrialsOverview()]);
      setSlots(s.slots); setVenues(v.venues as Venue[]); setOverview(o.cities);
    } catch (e) { setErr(e instanceof Error ? e.message : String(e)); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const createSlot = async () => {
    if (!venueId || !batchName.trim()) { setErr("Venue और Batch name चुनें"); return; }
    setCreating(true); setErr(""); setMsg("");
    try {
      await adminCreateTrialSlot({ venueId, batchName: batchName.trim(), capacity: Number(capacity) || 100 });
      setBatchName(""); setMsg("Batch created");
      await load();
    } catch (e) { setErr(e instanceof Error ? e.message : String(e)); }
    finally { setCreating(false); }
  };

  const patchStatus = async (id: string, status: string) => {
    setErr("");
    try { await adminPatchTrialSlot(id, { status }); await load(); }
    catch (e) { setErr(e instanceof Error ? e.message : String(e)); }
  };

  const removeSlot = async (id: string) => {
    if (!window.confirm("Delete this batch?")) return;
    setErr("");
    try { await adminDeleteTrialSlot(id); await load(); }
    catch (e) { setErr(e instanceof Error ? e.message : String(e)); }
  };

  const runAllocation = async (dryRun: boolean) => {
    setRunning(true); setErr(""); if (dryRun) setPreview(null);
    try {
      const r = await adminRunTrialAllocation({ city: allocCity.trim() || undefined, dryRun });
      setPreview(r);
      if (!dryRun) { setMsg(`Allocated ${r.totalAllocated} players` + (r.notificationsEnabled ? " · notifications queued" : " · sends OFF (dev)")); await load(); }
    } catch (e) { setErr(e instanceof Error ? e.message : String(e)); }
    finally { setRunning(false); }
  };

  const saveExtras = async () => {
    if (!extraVenueId) return;
    setSavingExtras(true); setErr("");
    try { await adminPatchTrialVenueExtras(extraVenueId, { address: address.trim() || null, mapsUrl: mapsUrl.trim() || null }); setMsg("Venue address saved"); await load(); }
    catch (e) { setErr(e instanceof Error ? e.message : String(e)); }
    finally { setSavingExtras(false); }
  };

  const pickExtraVenue = (id: string) => {
    setExtraVenueId(id);
    const v = venues.find(x => x.id === id);
    setAddress(v?.address ?? ""); setMapsUrl(v?.mapsUrl ?? "");
  };

  if (loading) return <div style={{ color: "#64748B", padding: 40, textAlign: "center" }}>Loading trials…</div>;

  const cities = [...new Set(slots.map(s => s.slot.city))];

  return (
    <div style={{ display: "grid", gap: 18 }}>
      {err && <div style={errBox}>{err}</div>}
      {msg && !err && <div style={okBox}>{msg}</div>}

      {/* city funnel overview */}
      {overview.length > 0 && (
        <div style={card}>
          <div style={{ fontSize: 13, fontWeight: 800, color: "#E2E8F0", marginBottom: 12 }}>🏙️ Trial Funnel — per City</div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr>
                <th style={th}>City</th><th style={th}>Eligible (KYC done)</th><th style={th}>Allocated</th>
                <th style={th}>Open capacity</th><th style={th}>Checked-in</th><th style={th}>Assessed</th><th style={th}>Final selected</th>
              </tr></thead>
              <tbody>{overview.map(c => (
                <tr key={c.city}>
                  <td style={{ ...td, fontWeight: 700, color: "#E2E8F0" }}>{c.city}</td>
                  <td style={td}>{c.eligible}</td>
                  <td style={td}>{c.allocated}{c.eligible > c.allocated ? <span style={{ color: "#F59E0B", marginLeft: 6, fontSize: 11 }}>({c.eligible - c.allocated} pending)</span> : null}</td>
                  <td style={td}>{c.openCapacity}</td>
                  <td style={td}>{c.checkedIn}</td>
                  <td style={td}>{c.assessed}</td>
                  <td style={{ ...td, color: "#6EE7B7", fontWeight: 700 }}>{c.finalSelected}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      )}

      {/* auto-allocation runner */}
      <div style={card}>
        <div style={{ fontSize: 13, fontWeight: 800, color: "#E2E8F0", marginBottom: 4 }}>⚡ Auto-Allocation</div>
        <div style={{ fontSize: 12, color: "#64748B", marginBottom: 12 }}>KYC-complete players को उनकी trial city के open batches में capacity के हिसाब से allot करता है (पहले Preview, फिर Confirm)।</div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <input style={{ ...inp, width: 180 }} placeholder="City (blank = all)" value={allocCity} onChange={e => setAllocCity(e.target.value)} />
          <button style={btn("#1E293B", "#CBD5E1")} disabled={running} onClick={() => runAllocation(true)}>{running ? "…" : "Preview"}</button>
          {preview && preview.dryRun && preview.totalAllocated > 0 && (
            <button style={btn("#F59E0B", "#0A1020")} disabled={running} onClick={() => runAllocation(false)}>
              Confirm — allocate {preview.totalAllocated} players
            </button>
          )}
        </div>
        {preview && (
          <div style={{ marginTop: 14 }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr><th style={th}>City</th><th style={th}>Eligible</th><th style={th}>{preview.dryRun ? "Will allocate" : "Allocated"}</th><th style={th}>No capacity</th></tr></thead>
              <tbody>{preview.perCity.map(c => (
                <tr key={c.city}>
                  <td style={{ ...td, fontWeight: 700, color: "#E2E8F0" }}>{c.city}</td>
                  <td style={td}>{c.eligible}</td>
                  <td style={{ ...td, color: "#6EE7B7", fontWeight: 700 }}>{c.allocated}</td>
                  <td style={{ ...td, color: c.unallocated > 0 ? "#FCA5A5" : "#64748B" }}>{c.unallocated}</td>
                </tr>
              ))}</tbody>
            </table>
            {preview.perCity.length === 0 && <div style={{ color: "#64748B", fontSize: 12.5, padding: 10 }}>कोई eligible player नहीं मिला।</div>}
            {preview.totalUnallocated > 0 && <div style={{ ...errBox, marginTop: 10, marginBottom: 0 }}>⚠️ {preview.totalUnallocated} players के लिए capacity कम है — नए batches बनाएँ।</div>}
          </div>
        )}
      </div>

      {/* create batch */}
      <div style={card}>
        <div style={{ fontSize: 13, fontWeight: 800, color: "#E2E8F0", marginBottom: 12 }}>➕ New Batch / Slot</div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <select style={{ ...inp, width: 260 }} value={venueId} onChange={e => setVenueId(e.target.value)}>
            <option value="">— venue चुनें —</option>
            {venues.map(v => <option key={v.id} value={v.id}>{v.city} · {v.venue} · {v.trialDate}</option>)}
          </select>
          <input style={{ ...inp, width: 160 }} placeholder="Batch name (Batch A)" value={batchName} onChange={e => setBatchName(e.target.value)} />
          <input style={{ ...inp, width: 100 }} type="number" min={1} placeholder="Capacity" value={capacity} onChange={e => setCapacity(e.target.value)} />
          <button style={btn("#F59E0B", "#0A1020")} disabled={creating} onClick={createSlot}>{creating ? "…" : "Create"}</button>
        </div>
        <div style={{ fontSize: 11.5, color: "#475569", marginTop: 8 }}>Date/reporting/start time venue से आते हैं — बाद में per-batch बदल सकते हैं।</div>
      </div>

      {/* slots list per city */}
      {cities.length === 0 && <div style={{ ...card, color: "#64748B", textAlign: "center" }}>अभी कोई batch नहीं — ऊपर से बनाएँ।</div>}
      {cities.map(city => (
        <div key={city} style={card}>
          <div style={{ fontSize: 13, fontWeight: 800, color: "#E2E8F0", marginBottom: 10 }}>🏟️ {city}</div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr>
                <th style={th}>Batch</th><th style={th}>Venue</th><th style={th}>Date</th><th style={th}>Reporting</th>
                <th style={th}>Filled</th><th style={th}>Checked-in</th><th style={th}>Status</th><th style={th}></th>
              </tr></thead>
              <tbody>{slots.filter(s => s.slot.city === city).map(({ slot, venueName, assigned, checkedIn }) => (
                <tr key={slot.id}>
                  <td style={{ ...td, fontWeight: 700, color: "#E2E8F0" }}>{slot.batchName}</td>
                  <td style={td}>{venueName ?? "—"}</td>
                  <td style={td}>{slot.slotDate}</td>
                  <td style={td}>{slot.reportingTime}</td>
                  <td style={td}>
                    <span style={{ color: assigned >= slot.capacity ? "#FCA5A5" : "#6EE7B7", fontWeight: 700 }}>{assigned}</span>
                    <span style={{ color: "#475569" }}> / {slot.capacity}</span>
                  </td>
                  <td style={td}>{checkedIn}</td>
                  <td style={td}>
                    <select style={{ ...inp, padding: "5px 8px", fontSize: 12 }} value={slot.status} onChange={e => patchStatus(slot.id, e.target.value)}>
                      {["open", "closed", "completed", "cancelled"].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td style={td}>
                    <button style={{ ...ghost, color: assigned > 0 ? "#334155" : "#FCA5A5", cursor: assigned > 0 ? "not-allowed" : "pointer" }}
                      title={assigned > 0 ? "Active allocations exist" : "Delete"}
                      disabled={assigned > 0} onClick={() => removeSlot(slot.id)}>✕</button>
                  </td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      ))}

      {/* venue address (trial pass) */}
      <div style={card}>
        <div style={{ fontSize: 13, fontWeight: 800, color: "#E2E8F0", marginBottom: 4 }}>📍 Venue Address (Trial Pass पर दिखेगा)</div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 10 }}>
          <select style={{ ...inp, width: 260 }} value={extraVenueId} onChange={e => pickExtraVenue(e.target.value)}>
            <option value="">— venue चुनें —</option>
            {venues.map(v => <option key={v.id} value={v.id}>{v.city} · {v.venue}</option>)}
          </select>
          <input style={{ ...inp, flex: 1, minWidth: 240 }} placeholder="Full address" value={address} onChange={e => setAddress(e.target.value)} disabled={!extraVenueId} />
          <input style={{ ...inp, width: 240 }} placeholder="Google Maps link" value={mapsUrl} onChange={e => setMapsUrl(e.target.value)} disabled={!extraVenueId} />
          <button style={btn("#1E293B", "#CBD5E1")} disabled={!extraVenueId || savingExtras} onClick={saveExtras}>{savingExtras ? "…" : "Save"}</button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════ ALLOCATIONS TAB ══════════════════════════ */

export function AllocationsTab() {
  const [rows, setRows] = useState<TrialAllocRow[]>([]);
  const [slots, setSlots] = useState<TrialSlotRow[]>([]);
  const [q, setQ] = useState("");
  const [city, setCity] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [moving, setMoving] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setErr("");
    try {
      const [a, s] = await Promise.all([
        adminGetTrialAllocations({ q: q.trim() || undefined, city: city.trim() || undefined }),
        adminGetTrialSlots(),
      ]);
      setRows(a.allocations); setSlots(s.slots);
    } catch (e) { setErr(e instanceof Error ? e.message : String(e)); }
    finally { setLoading(false); }
  }, [q, city]);
  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const move = async (id: string, slotId: string) => {
    if (!slotId) return;
    setMoving(id); setErr("");
    try { await adminMoveTrialAllocation(id, slotId); await load(); }
    catch (e) { setErr(e instanceof Error ? e.message : String(e)); }
    finally { setMoving(null); }
  };

  const cancel = async (id: string) => {
    if (!window.confirm("Cancel this allocation? Player का pass invalid हो जाएगा।")) return;
    setErr("");
    try { await adminCancelTrialAllocation(id); await load(); }
    catch (e) { setErr(e instanceof Error ? e.message : String(e)); }
  };

  return (
    <div style={{ display: "grid", gap: 16 }}>
      {err && <div style={errBox}>{err}</div>}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <input style={{ ...inp, width: 240 }} placeholder="Search name / BCPL-ID" value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => e.key === "Enter" && load()} />
        <input style={{ ...inp, width: 160 }} placeholder="City" value={city} onChange={e => setCity(e.target.value)} onKeyDown={e => e.key === "Enter" && load()} />
        <button style={btn("#1E293B", "#CBD5E1")} onClick={load}>Search</button>
        <div style={{ marginLeft: "auto", color: "#64748B", fontSize: 12, alignSelf: "center" }}>{rows.length} allocations</div>
      </div>
      <div style={{ ...card, padding: 0, overflowX: "auto" }}>
        {loading ? <div style={{ color: "#64748B", padding: 40, textAlign: "center" }}>Loading…</div> : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr>
              <th style={th}>Player</th><th style={th}>Role</th><th style={th}>Phone</th><th style={th}>City</th>
              <th style={th}>Venue · Batch</th><th style={th}>Progress</th><th style={th}>Move to</th><th style={th}></th>
            </tr></thead>
            <tbody>{rows.map(r => (
              <tr key={r.alloc.id}>
                <td style={{ ...td, fontWeight: 700, color: "#E2E8F0" }}>
                  {r.fullName ?? "—"}<div style={{ fontSize: 10.5, color: "#64748B", fontWeight: 400 }}>{r.regNumber}</div>
                </td>
                <td style={td}><span style={roleChip(r.role)}>{roleLabel(r.role)}</span></td>
                <td style={td}>{r.phone ?? "—"}</td>
                <td style={td}>{r.alloc.city}</td>
                <td style={td}>{r.venueName ?? "—"}<div style={{ fontSize: 10.5, color: "#64748B" }}>{r.batchName} · {r.slotDate}</div></td>
                <td style={td}>
                  {r.alloc.status !== "allocated" ? <span style={chip("rgba(100,116,139,0.15)", "#94A3B8")}>{r.alloc.status}</span>
                    : r.assessResult ? <span style={chip("rgba(168,85,247,0.12)", "#C084FC")}>assessed</span>
                    : r.checkedInAt ? <span style={chip("rgba(16,185,129,0.12)", "#6EE7B7")}>checked-in</span>
                    : <span style={chip("rgba(245,158,11,0.12)", "#FBBF24")}>allocated</span>}
                </td>
                <td style={td}>
                  {r.alloc.status === "allocated" && (
                    <select style={{ ...inp, padding: "5px 8px", fontSize: 11.5, maxWidth: 190 }} value="" disabled={moving === r.alloc.id}
                      onChange={e => move(r.alloc.id, e.target.value)}>
                      <option value="">{moving === r.alloc.id ? "moving…" : "— batch चुनें —"}</option>
                      {slots.filter(s => s.slot.id !== r.alloc.slotId && s.slot.status === "open").map(s => (
                        <option key={s.slot.id} value={s.slot.id}>{s.slot.city} · {s.slot.batchName} ({s.assigned}/{s.slot.capacity})</option>
                      ))}
                    </select>
                  )}
                </td>
                <td style={td}>{r.alloc.status === "allocated" && <button style={{ ...ghost, color: "#FCA5A5" }} onClick={() => cancel(r.alloc.id)}>Cancel</button>}</td>
              </tr>
            ))}</tbody>
          </table>
        )}
        {!loading && rows.length === 0 && <div style={{ color: "#64748B", padding: 30, textAlign: "center", fontSize: 13 }}>कोई allocation नहीं — Slots tab से Auto-Allocation चलाएँ।</div>}
      </div>
    </div>
  );
}

/* ═════════════════════════ CHECK-IN TAB ═══════════════════════════ */

export function CheckinTab() {
  const [input, setInput] = useState("");
  const [staff, setStaff] = useState(() => localStorage.getItem("bcpl_trial_staff") ?? "");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [recent, setRecent] = useState<TrialCheckinRow[]>([]);

  const loadRecent = useCallback(async () => {
    try { const r = await adminGetTrialCheckins({}); setRecent(r.checkins); } catch { /* silent */ }
  }, []);
  useEffect(() => { loadRecent(); }, [loadRecent]);

  const doCheckin = async () => {
    const raw = input.trim();
    if (!raw) return;
    setBusy(true); setResult(null);
    localStorage.setItem("bcpl_trial_staff", staff);
    const isToken = /^bcpl-trial:/i.test(raw) || /^[0-9a-f]{32}$/i.test(raw);
    try {
      const r = await adminTrialCheckin(isToken ? { token: raw, staff: staff || undefined } : { regNumber: raw, staff: staff || undefined });
      setResult({ kind: "ok", text: `✅ ${r.player.name} (${r.player.regNumber ?? "—"}) checked in · ${r.slot ? r.slot.batch + " · " + r.slot.reportingTime : ""}` });
      setInput("");
      await loadRecent();
    } catch (e) {
      setResult({ kind: "err", text: "❌ " + (e instanceof Error ? e.message : String(e)) });
    } finally { setBusy(false); }
  };

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div style={{ ...card, maxWidth: 640 }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: "#E2E8F0", marginBottom: 4 }}>🎫 Gate Check-In</div>
        <div style={{ fontSize: 12, color: "#64748B", marginBottom: 14 }}>QR scanner से scan करें (token अपने-आप paste होगा) या player का BCPL ID टाइप करें।</div>
        <div style={{ display: "grid", gap: 10 }}>
          <input autoFocus style={{ ...inp, fontSize: 15, padding: "13px 14px" }} placeholder="BCPL-TRIAL:token  या  BCPL-DEL-1"
            value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && doCheckin()} />
          <div style={{ display: "flex", gap: 10 }}>
            <input style={{ ...inp, width: 200 }} placeholder="Staff name (optional)" value={staff} onChange={e => setStaff(e.target.value)} />
            <button style={{ ...btn("#10B981"), flex: 1, fontSize: 14 }} disabled={busy || !input.trim()} onClick={doCheckin}>
              {busy ? "Checking…" : "CHECK IN"}
            </button>
          </div>
        </div>
        {result && (
          <div style={{ ...(result.kind === "ok" ? okBox : errBox), marginTop: 14, marginBottom: 0, fontSize: 14, fontWeight: 600 }}>
            {result.text}
          </div>
        )}
      </div>

      <div style={{ ...card, padding: 0, overflowX: "auto" }}>
        <div style={{ padding: "14px 16px 4px", fontSize: 13, fontWeight: 800, color: "#E2E8F0" }}>Recent check-ins</div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr><th style={th}>Time</th><th style={th}>Player</th><th style={th}>Role</th><th style={th}>City</th><th style={th}>Batch</th><th style={th}>Method</th><th style={th}>Staff</th></tr></thead>
          <tbody>{recent.map(r => (
            <tr key={r.checkin.id}>
              <td style={td}>{fmtTime(r.checkin.checkedInAt)}</td>
              <td style={{ ...td, fontWeight: 700, color: "#E2E8F0" }}>{r.fullName ?? "—"}<div style={{ fontSize: 10.5, color: "#64748B", fontWeight: 400 }}>{r.regNumber}</div></td>
              <td style={td}><span style={roleChip(r.role)}>{roleLabel(r.role)}</span></td>
              <td style={td}>{r.city}</td>
              <td style={td}>{r.batchName ?? "—"}</td>
              <td style={td}><span style={chip(r.checkin.method === "qr" ? "rgba(59,130,246,0.12)" : "rgba(245,158,11,0.12)", r.checkin.method === "qr" ? "#60A5FA" : "#FBBF24")}>{r.checkin.method}</span></td>
              <td style={td}>{r.checkin.staff ?? "—"}</td>
            </tr>
          ))}</tbody>
        </table>
        {recent.length === 0 && <div style={{ color: "#64748B", padding: 30, textAlign: "center", fontSize: 13 }}>अभी कोई check-in नहीं।</div>}
      </div>
    </div>
  );
}

/* ═════════════════════════ ASSESS TAB ═════════════════════════════ */

export function AssessTab() {
  const [config, setConfig] = useState<AssessmentConfig | null>(null);
  const [q, setQ] = useState("");
  const [candidates, setCandidates] = useState<TrialAllocRow[]>([]);
  const [picked, setPicked] = useState<TrialAllocRow | null>(null);
  const [scores, setScores] = useState<Record<string, string>>({});
  const [comments, setComments] = useState("");
  const [assessor, setAssessor] = useState(() => localStorage.getItem("bcpl_trial_assessor") ?? "");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const [list, setList] = useState<AssessmentRow[]>([]);

  const loadList = useCallback(async () => {
    try { const r = await adminGetAssessments({}); setList(r.assessments); } catch { /* silent */ }
  }, []);
  useEffect(() => {
    adminGetAssessmentConfig().then(setConfig).catch(() => setErr("Config load failed"));
    loadList();
  }, [loadList]);

  const search = async () => {
    setErr("");
    try { const r = await adminGetTrialAllocations({ q: q.trim() || undefined }); setCandidates(r.allocations.slice(0, 8)); }
    catch (e) { setErr(e instanceof Error ? e.message : String(e)); }
  };

  const pick = (r: TrialAllocRow) => {
    setPicked(r); setScores({}); setComments(""); setMsg("");
  };

  const save = async () => {
    if (!picked || !config) return;
    if (!assessor.trim()) { setErr("Assessor का नाम भरें"); return; }
    const role = normalizeRoleClient(picked.role);
    const criteria = config.criteria[role] ?? [];
    const payload: Record<string, number> = {};
    for (const c of criteria) {
      const v = Number(scores[c]);
      if (scores[c] !== undefined && scores[c] !== "" && Number.isFinite(v)) {
        if (v < 1 || v > 10) { setErr(`"${c.replace(/_/g, " ")}" 1–10 के बीच होना चाहिए`); return; }
        payload[c] = v;
      }
    }
    if (Object.keys(payload).length === 0) { setErr("कम से कम एक score भरें"); return; }
    setSaving(true); setErr(""); setMsg("");
    localStorage.setItem("bcpl_trial_assessor", assessor);
    try {
      const r = await adminSaveAssessment({ registrationId: picked.alloc.registrationId, scores: payload, comments: comments.trim() || undefined, assessor: assessor.trim() });
      setMsg(`Saved — final physical score ${r.assessment.finalScore}/10`);
      setPicked(null); setCandidates([]); setQ("");
      await loadList();
    } catch (e) { setErr(e instanceof Error ? e.message : String(e)); }
    finally { setSaving(false); }
  };

  const setResult = async (id: string, result: string) => {
    setErr("");
    try { await adminPatchAssessment(id, { result }); await loadList(); }
    catch (e) { setErr(e instanceof Error ? e.message : String(e)); }
  };

  const resultChip = (r: string) =>
    r === "FINAL_SELECTED" ? chip("rgba(16,185,129,0.12)", "#6EE7B7")
      : r === "FINAL_NOT_SELECTED" ? chip("rgba(239,68,68,0.12)", "#FCA5A5")
      : chip("rgba(245,158,11,0.12)", "#FBBF24");

  return (
    <div style={{ display: "grid", gap: 16 }}>
      {err && <div style={errBox}>{err}</div>}
      {msg && !err && <div style={okBox}>{msg}</div>}

      {/* pick player */}
      <div style={card}>
        <div style={{ fontSize: 13, fontWeight: 800, color: "#E2E8F0", marginBottom: 12 }}>📋 Physical Assessment — player चुनें</div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <input style={{ ...inp, width: 260 }} placeholder="Name / BCPL-ID खोजें" value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => e.key === "Enter" && search()} />
          <button style={btn("#1E293B", "#CBD5E1")} onClick={search}>Search</button>
        </div>
        {candidates.length > 0 && !picked && (
          <div style={{ display: "grid", gap: 6, marginTop: 12 }}>
            {candidates.map(c => (
              <button key={c.alloc.id} style={{ ...ghost, textAlign: "left", display: "flex", gap: 10, alignItems: "center" }} onClick={() => pick(c)}>
                <span style={{ fontWeight: 700, color: "#E2E8F0" }}>{c.fullName ?? "—"}</span>
                <span style={{ color: "#64748B", fontSize: 11 }}>{c.regNumber}</span>
                <span style={roleChip(c.role)}>{roleLabel(c.role)}</span>
                <span style={{ color: "#64748B", fontSize: 11 }}>{c.alloc.city} · {c.batchName}</span>
                {c.checkedInAt ? <span style={chip("rgba(16,185,129,0.12)", "#6EE7B7")}>checked-in</span> : <span style={chip("rgba(245,158,11,0.12)", "#FBBF24")}>not checked-in</span>}
              </button>
            ))}
          </div>
        )}

        {picked && config && (
          <div style={{ marginTop: 16, borderTop: "1px solid #1E293B", paddingTop: 16 }}>
            <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 14, flexWrap: "wrap" }}>
              <span style={{ fontWeight: 800, color: "#E2E8F0", fontSize: 14 }}>{picked.fullName}</span>
              <span style={{ color: "#64748B", fontSize: 12 }}>{picked.regNumber}</span>
              <span style={roleChip(picked.role)}>{roleLabel(picked.role)}</span>
              <button style={{ ...ghost, marginLeft: "auto" }} onClick={() => setPicked(null)}>बदलें</button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(170px,1fr))", gap: 10 }}>
              {(config.criteria[normalizeRoleClient(picked.role)] ?? []).map(c => (
                <label key={c} style={{ display: "grid", gap: 4 }}>
                  <span style={{ fontSize: 11, color: "#94A3B8", textTransform: "capitalize" }}>{c.replace(/_/g, " ")}</span>
                  <input style={inp} type="number" min={1} max={10} step={0.5} placeholder="1–10"
                    value={scores[c] ?? ""} onChange={e => setScores(s => ({ ...s, [c]: e.target.value }))} />
                </label>
              ))}
            </div>
            <textarea style={{ ...inp, width: "100%", marginTop: 12, minHeight: 60, resize: "vertical" }} placeholder="Comments (optional)"
              value={comments} onChange={e => setComments(e.target.value)} />
            <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
              <input style={{ ...inp, width: 200 }} placeholder="Assessor name *" value={assessor} onChange={e => setAssessor(e.target.value)} />
              <button style={btn("#F59E0B", "#0A1020")} disabled={saving} onClick={save}>{saving ? "Saving…" : "Save Assessment"}</button>
            </div>
            <div style={{ fontSize: 11.5, color: "#475569", marginTop: 8 }}>Final score = भरे गए criteria का simple average (equal weights) · AI score से बिल्कुल अलग रहता है।</div>
          </div>
        )}
      </div>

      {/* assessments list */}
      <div style={{ ...card, padding: 0, overflowX: "auto" }}>
        <div style={{ padding: "14px 16px 4px", fontSize: 13, fontWeight: 800, color: "#E2E8F0" }}>Recorded assessments</div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr>
            <th style={th}>Player</th><th style={th}>Role</th><th style={th}>City · Batch</th><th style={th}>Physical score</th>
            <th style={th}>Assessor</th><th style={th}>Result</th><th style={th}>Updated</th>
          </tr></thead>
          <tbody>{list.map(r => (
            <tr key={r.assessment.id}>
              <td style={{ ...td, fontWeight: 700, color: "#E2E8F0" }}>{r.fullName ?? "—"}<div style={{ fontSize: 10.5, color: "#64748B", fontWeight: 400 }}>{r.regNumber}</div></td>
              <td style={td}><span style={roleChip(r.role)}>{roleLabel(r.role)}</span></td>
              <td style={td}>{r.assessment.city ?? "—"}<div style={{ fontSize: 10.5, color: "#64748B" }}>{r.assessment.batch ?? ""}</div></td>
              <td style={{ ...td, fontWeight: 800, color: "#FBBF24", fontSize: 14 }}>{r.assessment.finalScore}<span style={{ fontSize: 10.5, color: "#475569" }}>/10</span></td>
              <td style={td}>{r.assessment.assessor}</td>
              <td style={td}>
                <select style={{ ...inp, padding: "5px 8px", fontSize: 11.5 }} value={r.assessment.result} onChange={e => setResult(r.assessment.id, e.target.value)}>
                  <option value="FINAL_SELECTION_PENDING">PENDING</option>
                  <option value="FINAL_SELECTED">SELECTED</option>
                  <option value="FINAL_NOT_SELECTED">NOT SELECTED</option>
                </select>{" "}
                <span style={resultChip(r.assessment.result)}>{r.assessment.result.replace("FINAL_", "").replace(/_/g, " ")}</span>
              </td>
              <td style={td}>{fmtTime(r.assessment.updatedAt)}</td>
            </tr>
          ))}</tbody>
        </table>
        {list.length === 0 && <div style={{ color: "#64748B", padding: 30, textAlign: "center", fontSize: 13 }}>अभी कोई assessment record नहीं।</div>}
      </div>
    </div>
  );
}

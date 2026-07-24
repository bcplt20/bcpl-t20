import { useState, useEffect, useRef } from "react";
import { getMatches, createMatch, updateMatchStatus, recordMatchResult } from "../../lib/api";
import { adminDeleteMatch } from "../api/matchesApi";

const TEAMS = ["Rajasthan Scorchers","Punjab Warriors","Kolkata Tigers","Lucknow Nawabs","Mumbai Mavericks","Hyderabad Hawks","Delhi Suryas","Chennai Thalaivas","Ahmedabad Lions","Bengaluru Rockets"];
const VENUES = ["Wankhede, Mumbai","SMS, Jaipur","PCA, Mohali","Ekana, Lucknow","Eden Gardens, Kolkata","Chinnaswamy, Bengaluru","Rajiv Gandhi, Hyderabad","MA Chidambaram, Chennai","Motera, Ahmedabad","Feroz Shah Kotla, Delhi"];
const SEASON = 5;

type ApiMatch = {
  id: string; matchNo: number; season: number;
  team1: string; team2: string; venue: string;
  scheduledAt: string | null;
  tossWinner: string | null; tossDecision: string | null;
  status: string;
  winner: string | null; resultDesc: string | null; playerOfMatch: string | null;
};

type Group = "scheduled" | "live" | "completed";
const grp = (s: string): Group =>
  s === "live" || s === "innings2" ? "live"
  : s === "completed" || s === "abandoned" ? "completed"
  : "scheduled";

const statusLabel = (s: string) =>
  s === "toss_done"   ? "TOSS DONE"
  : s === "xi_selected" ? "XI SET"
  : s === "live"        ? "● LIVE"
  : s === "innings2"    ? "● LIVE · INNS 2"
  : s === "abandoned"   ? "NO RESULT"
  : s.toUpperCase();

const groupColor = (g: Group) => g === "live" ? "#EF4444" : g === "scheduled" ? "#3B82F6" : "#10B981";
const statusColor = (s: string) => s === "abandoned" ? "#94A3B8" : groupColor(grp(s));
const statusBg    = (s: string) => statusColor(s) + "22";

const fmtDate = (iso: string | null) => iso
  ? new Date(iso).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", day: "2-digit", month: "short", year: "numeric" })
  : "Date TBD";
const fmtTime = (iso: string | null) => iso
  ? new Date(iso).toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit", hour12: true })
  : "";

type CsvRow = { team1: string; team2: string; date: string; time: string; venue: string };

const SAMPLE_CSV = `Team 1,Team 2,Date,Time,Venue
Rajasthan Scorchers,Punjab Warriors,2026-08-01,18:00,SMS Jaipur
Mumbai Mavericks,Kolkata Tigers,2026-08-02,16:00,Wankhede Mumbai
Lucknow Nawabs,Delhi Suryas,2026-08-03,18:00,Ekana Lucknow`;

export default function MatchesView({ onOpenScoring }: { onOpenScoring?: () => void }) {
  const [matches,     setMatches]     = useState<ApiMatch[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [loadErr,     setLoadErr]     = useState("");
  const [banner,      setBanner]      = useState("");
  const [filter,      setFilter]      = useState<"all" | Group>("all");

  const [showAdd,     setShowAdd]     = useState(false);
  const [addErr,      setAddErr]      = useState("");
  const [saving,      setSaving]      = useState(false);
  const [form,        setForm]        = useState({ team1: TEAMS[0], team2: TEAMS[1], date: "", time: "18:00", venue: VENUES[0] });

  const [showBulk,    setShowBulk]    = useState(false);
  const [bulkPreview, setBulkPreview] = useState<CsvRow[]>([]);
  const [csvText,     setCsvText]     = useState("");
  const [bulkBusy,    setBulkBusy]    = useState(false);

  const [resultFor,   setResultFor]   = useState<ApiMatch | null>(null);
  const [resultForm,  setResultForm]  = useState({ outcome: "", resultDesc: "", playerOfMatch: "" });
  const [resultErr,   setResultErr]   = useState("");
  const [resultSaving,setResultSaving]= useState(false);

  const [busyId,      setBusyId]      = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const reload = async () => {
    setLoadErr("");
    try {
      const r = await getMatches(SEASON);
      setMatches(r.matches || []);
    } catch (e: any) {
      setLoadErr(e?.message || "Could not load matches from the server");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { reload(); }, []);

  const flash = (msg: string) => { setBanner(msg); setTimeout(() => setBanner(""), 6000); };

  const filtered = filter === "all" ? matches : matches.filter(m => grp(m.status) === filter);
  const nextMatchNo = matches.reduce((mx, m) => Math.max(mx, m.matchNo), 0) + 1;

  /* ── Schedule one match ── */
  const submitAdd = async () => {
    setAddErr("");
    if (!form.date)                    { setAddErr("Match date is required"); return; }
    if (form.team1 === form.team2)     { setAddErr("Team 1 and Team 2 cannot be the same"); return; }
    if (!form.venue.trim())            { setAddErr("Venue is required"); return; }
    setSaving(true);
    try {
      const scheduledAt = new Date(`${form.date}T${form.time || "18:00"}:00+05:30`).toISOString();
      await createMatch({ matchNo: nextMatchNo, season: SEASON, team1: form.team1, team2: form.team2, venue: form.venue.trim(), scheduledAt });
      setShowAdd(false);
      setForm({ team1: TEAMS[0], team2: TEAMS[1], date: "", time: "18:00", venue: VENUES[0] });
      await reload();
      flash(`Match #${nextMatchNo} scheduled — it is now visible on the website`);
    } catch (e: any) {
      setAddErr(e?.message || "Failed to schedule match");
    } finally { setSaving(false); }
  };

  /* ── Bulk CSV ── */
  const parseCsv = (text: string): CsvRow[] =>
    text.trim().split("\n").slice(1).filter(l => l.trim()).map(l => {
      const p = l.split(",").map(s => s.trim());
      return { team1: p[0] || "", team2: p[1] || "", date: p[2] || "", time: p[3] || "18:00", venue: p[4] || "" };
    });

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = e => {
      const text = e.target?.result as string;
      setCsvText(text);
      setBulkPreview(parseCsv(text));
    };
    reader.readAsText(file);
  };

  const importBulk = async () => {
    setBulkBusy(true);
    let ok = 0; let firstErr = "";
    let no = nextMatchNo;
    for (const row of bulkPreview) {
      try {
        if (!row.team1 || !row.team2 || !row.date) throw new Error(`Row "${row.team1} vs ${row.team2}": team names and date are required`);
        if (row.team1 === row.team2) throw new Error(`Row "${row.team1}": both teams are the same`);
        const scheduledAt = new Date(`${row.date}T${row.time || "18:00"}:00+05:30`).toISOString();
        if (isNaN(new Date(scheduledAt).getTime())) throw new Error(`Row "${row.team1} vs ${row.team2}": invalid date/time`);
        await createMatch({ matchNo: no, season: SEASON, team1: row.team1, team2: row.team2, venue: row.venue || "TBD", scheduledAt });
        no++; ok++;
      } catch (e: any) {
        if (!firstErr) firstErr = e?.message || "import failed";
      }
    }
    setBulkBusy(false);
    setShowBulk(false); setBulkPreview([]); setCsvText("");
    await reload();
    if (firstErr) setLoadErr(`Imported ${ok} of ${bulkPreview.length} matches. First error: ${firstErr}`);
    else flash(`Imported ${ok} matches — all are now visible on the website`);
  };

  /* ── Cancel scheduled match ── */
  const cancelMatch = async (m: ApiMatch) => {
    if (!window.confirm(`Cancel Match #${m.matchNo} — ${m.team1} vs ${m.team2}? It will show as "No Result" and cannot be scored.`)) return;
    setBusyId(m.id);
    try {
      await updateMatchStatus(m.id, { status: "abandoned", resultDesc: "Match cancelled" });
      await reload();
      flash(`Match #${m.matchNo} cancelled`);
    } catch (e: any) {
      setLoadErr(e?.message || "Failed to cancel match");
    } finally { setBusyId(null); }
  };

  /* ── Delete match (and all its score data) ── */
  const deleteMatch = async (m: ApiMatch) => {
    if (!window.confirm(`Delete Match #${m.matchNo} — ${m.team1} vs ${m.team2}?\n\nMatch and all its score data will be permanently deleted. This cannot be undone.`)) return;
    setBusyId(m.id);
    try {
      await adminDeleteMatch(m.id, false);
      await reload();
      flash(`Match #${m.matchNo} deleted`);
    } catch (e: any) {
      const msg = e?.message || "Failed to delete match";
      // Server signals (409) that this match has scoring data. Ask again with a
      // clear warning, then retry with force.
      if (/score data|force/i.test(msg)) {
        if (window.confirm(`${msg}\n\nThis will also delete all recorded innings and deliveries for this match. Permanently delete anyway?`)) {
          try {
            await adminDeleteMatch(m.id, true);
            await reload();
            flash(`Match #${m.matchNo} and its score data deleted`);
          } catch (e2: any) {
            setLoadErr(e2?.message || "Failed to delete match");
          }
        }
      } else {
        setLoadErr(msg);
      }
    } finally { setBusyId(null); }
  };

  /* ── Enter result ── */
  const openResult = (m: ApiMatch) => {
    setResultErr("");
    setResultForm({ outcome: "", resultDesc: "", playerOfMatch: "" });
    setResultFor(m);
  };

  const submitResult = async () => {
    if (!resultFor) return;
    const m = resultFor;
    if (!resultForm.outcome) { setResultErr("Select who won (or No Result)"); return; }
    setResultSaving(true);
    setResultErr("");
    try {
      if (resultForm.outcome === "__nr__") {
        await updateMatchStatus(m.id, { status: "abandoned", resultDesc: resultForm.resultDesc.trim() || "No result" });
        await recordMatchResult({ winner: m.team1, loser: m.team2, noResult: true, season: SEASON });
      } else {
        const winner = resultForm.outcome;
        const loser  = winner === m.team1 ? m.team2 : m.team1;
        await updateMatchStatus(m.id, {
          status: "completed",
          winner,
          resultDesc: resultForm.resultDesc.trim() || `${winner} won`,
          playerOfMatch: resultForm.playerOfMatch.trim() || undefined,
        });
        await recordMatchResult({ winner, loser, season: SEASON });
      }
      setResultFor(null);
      await reload();
      flash("Result saved — match card and points table updated on the website");
    } catch (e: any) {
      setResultErr(e?.message || "Failed to save result");
    } finally { setResultSaving(false); }
  };

  const card: React.CSSProperties = { background: "linear-gradient(135deg,#0D1526 0%,#0A1020 100%)", border: "1px solid #1E293B", borderRadius: 16, padding: 20 };
  const inputStyle: React.CSSProperties = { width: "100%", padding: "10px 12px", background: "#060B18", border: "1px solid #1E293B", borderRadius: 9, color: "#F1F5F9", fontSize: 13, outline: "none", boxSizing: "border-box" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#F1F5F9" }}>Match Management</div>
          <div style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}>Schedule, track and manage all BCPL fixtures — changes appear on the website instantly</div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => { setLoading(true); reload(); }} title="Refresh"
            style={{ padding: "10px 14px", borderRadius: 10, border: "1px solid #334155", background: "transparent", color: "#94A3B8", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
            ⟳ Refresh
          </button>
          <button onClick={() => setShowBulk(true)} style={{ padding: "10px 18px", borderRadius: 10, border: "1px solid #334155", background: "transparent", color: "#94A3B8", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
            📊 Bulk Upload via CSV
          </button>
          <button onClick={() => { setAddErr(""); setShowAdd(true); }} style={{ padding: "10px 20px", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#FF6B00,#FF8C40)", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
            🏏 + Add Match
          </button>
        </div>
      </div>

      {/* Banners */}
      {banner  && <div style={{ padding: "10px 16px", borderRadius: 10, background: "#10B98122", border: "1px solid #10B98155", color: "#10B981", fontSize: 13, fontWeight: 600 }}>✓ {banner}</div>}
      {loadErr && <div style={{ padding: "10px 16px", borderRadius: 10, background: "#EF444422", border: "1px solid #EF444455", color: "#F87171", fontSize: 13, fontWeight: 600 }}>⚠ {loadErr}</div>}

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
        {[
          { label: "Total Matches", value: matches.length,                                    color: "#6366F1", icon: "🏏" },
          { label: "Live Now",      value: matches.filter(m => grp(m.status) === "live").length,      color: "#EF4444", icon: "🔴" },
          { label: "Scheduled",     value: matches.filter(m => grp(m.status) === "scheduled").length, color: "#3B82F6", icon: "📅" },
          { label: "Completed",     value: matches.filter(m => grp(m.status) === "completed").length, color: "#10B981", icon: "✅" },
        ].map(s => (
          <div key={s.label} style={{ ...card, borderLeft: `3px solid ${s.color}`, display: "flex", alignItems: "center", gap: 14 }}>
            <span style={{ fontSize: 28 }}>{s.icon}</span>
            <div>
              <div style={{ fontSize: 28, fontWeight: 800, color: "#F1F5F9" }}>{s.value}</div>
              <div style={{ fontSize: 11, color: "#64748B" }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filter Tabs */}
      <div style={{ display: "flex", gap: 6 }}>
        {(["all", "live", "scheduled", "completed"] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: "8px 18px", borderRadius: 8, border: "1px solid",
            borderColor: filter === f ? groupColor(f === "all" ? "scheduled" : f) : "#1E293B",
            background: filter === f ? groupColor(f === "all" ? "scheduled" : f) + "22" : "transparent",
            color: filter === f ? groupColor(f === "all" ? "scheduled" : f) : "#64748B",
            fontSize: 12, fontWeight: 700, cursor: "pointer", textTransform: "capitalize",
          }}>
            {f === "live" && "● "}{f === "all" ? "All Matches" : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Loading / empty */}
      {loading && <div style={{ ...card, textAlign: "center", color: "#64748B", fontSize: 13 }}>Loading matches…</div>}
      {!loading && matches.length === 0 && !loadErr && (
        <div style={{ ...card, textAlign: "center", padding: 40 }}>
          <div style={{ fontSize: 34, marginBottom: 10 }}>🏏</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#F1F5F9" }}>No matches scheduled yet</div>
          <div style={{ fontSize: 12, color: "#64748B", marginTop: 6 }}>Use "+ Add Match" to schedule the first fixture — it will appear on the website's Match Center immediately.</div>
        </div>
      )}

      {/* Match Cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {filtered.map(m => (
          <div key={m.id} style={{ ...card, position: "relative", overflow: "hidden" }}>
            {grp(m.status) === "live" && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg,#EF4444,#FF6B00,#EF4444)" }} />}
            <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
              <div style={{ flex: 1, textAlign: "center" }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: m.winner === m.team1 ? "#10B981" : "#F1F5F9", marginBottom: 6 }}>{m.team1}</div>
              </div>
              <div style={{ textAlign: "center", minWidth: 170 }}>
                <span style={{ display: "block", padding: "4px 14px", borderRadius: 20, fontSize: 10, fontWeight: 800, background: statusBg(m.status), color: statusColor(m.status), marginBottom: 8, textTransform: "uppercase" }}>
                  {statusLabel(m.status)}
                </span>
                <div style={{ fontSize: 20, color: "#334155", fontWeight: 800 }}>VS</div>
                <div style={{ fontSize: 12, color: "#64748B", marginTop: 6 }}>Match #{m.matchNo} · {fmtDate(m.scheduledAt)}{fmtTime(m.scheduledAt) ? ` · ${fmtTime(m.scheduledAt)}` : ""}</div>
                <div style={{ fontSize: 10, color: "#334155", marginTop: 2 }}>📍 {m.venue}</div>
                {m.tossWinner && <div style={{ fontSize: 10, color: "#F59E0B", marginTop: 4 }}>🪙 {m.tossWinner} won toss, chose to {m.tossDecision}</div>}
              </div>
              <div style={{ flex: 1, textAlign: "center" }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: m.winner === m.team2 ? "#10B981" : "#F1F5F9", marginBottom: 6 }}>{m.team2}</div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 7, marginLeft: 8 }}>
                {grp(m.status) !== "completed" && (
                  <button onClick={() => onOpenScoring?.()} style={{ padding: "7px 14px", borderRadius: 7, border: "none", background: "#EF444422", color: "#EF4444", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                    🔴 Score
                  </button>
                )}
                {grp(m.status) !== "completed" && (
                  <button onClick={() => openResult(m)} style={{ padding: "7px 14px", borderRadius: 7, border: "1px solid #1E293B", background: "transparent", color: "#94A3B8", fontSize: 11, cursor: "pointer" }}>
                    🏆 Enter Result
                  </button>
                )}
                {m.status === "scheduled" && (
                  <button disabled={busyId === m.id} onClick={() => cancelMatch(m)} style={{ padding: "7px 14px", borderRadius: 7, border: "none", background: "#EF444415", color: "#EF4444", fontSize: 11, cursor: "pointer", opacity: busyId === m.id ? 0.5 : 1 }}>
                    {busyId === m.id ? "Cancelling…" : "Cancel"}
                  </button>
                )}
                <button disabled={busyId === m.id} onClick={() => deleteMatch(m)} style={{ padding: "7px 14px", borderRadius: 7, border: "1px solid #7F1D1D", background: "transparent", color: "#EF4444", fontSize: 11, cursor: "pointer", opacity: busyId === m.id ? 0.5 : 1 }}>
                  {busyId === m.id ? "Working…" : "Delete"}
                </button>
              </div>
            </div>
            {(m.winner || m.resultDesc) && grp(m.status) === "completed" && (
              <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid #0F1B2D", display: "flex", gap: 18, flexWrap: "wrap" }}>
                {m.winner && <span style={{ fontSize: 12, color: "#10B981", fontWeight: 700 }}>🏆 {m.resultDesc || `Winner: ${m.winner}`}</span>}
                {!m.winner && m.resultDesc && <span style={{ fontSize: 12, color: "#94A3B8", fontWeight: 600 }}>{m.resultDesc}</span>}
                {m.playerOfMatch && <span style={{ fontSize: 12, color: "#F59E0B", fontWeight: 600 }}>⭐ Player of the Match: {m.playerOfMatch}</span>}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add Match Modal */}
      {showAdd && (
        <div style={{ position: "fixed", inset: 0, background: "#00000088", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999 }}>
          <div style={{ background: "#0D1526", border: "1px solid #1E293B", borderRadius: 20, padding: 28, width: 480 }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#F1F5F9", marginBottom: 4 }}>🏏 Schedule New Match</div>
            <div style={{ fontSize: 11, color: "#64748B", marginBottom: 18 }}>Match #{nextMatchNo} · Season {SEASON} · will appear on the website immediately</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              {([{ label: "Team 1", key: "team1", type: "select", opts: TEAMS }, { label: "Team 2", key: "team2", type: "select", opts: TEAMS }, { label: "Match Date", key: "date", type: "date" }, { label: "Time (IST)", key: "time", type: "time" }] as any[]).map(f => (
                <div key={f.key}>
                  <label style={{ fontSize: 11, color: "#64748B", fontWeight: 700, display: "block", marginBottom: 6 }}>{f.label}</label>
                  {f.type === "select"
                    ? <select value={(form as any)[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} style={inputStyle}>{f.opts.map((o: string) => <option key={o}>{o}</option>)}</select>
                    : <input type={f.type} value={(form as any)[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} style={inputStyle} />}
                </div>
              ))}
            </div>
            <div style={{ marginTop: 14 }}>
              <label style={{ fontSize: 11, color: "#64748B", fontWeight: 700, display: "block", marginBottom: 6 }}>Venue (pick from list or type your own)</label>
              <input list="bcpl-venues" value={form.venue} onChange={e => setForm(p => ({ ...p, venue: e.target.value }))} style={inputStyle} placeholder="e.g. Feroz Shah Kotla, Delhi" />
              <datalist id="bcpl-venues">{VENUES.map(v => <option key={v} value={v} />)}</datalist>
            </div>
            {addErr && <div style={{ marginTop: 12, padding: "8px 12px", borderRadius: 8, background: "#EF444422", color: "#F87171", fontSize: 12, fontWeight: 600 }}>⚠ {addErr}</div>}
            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              <button onClick={() => setShowAdd(false)} style={{ flex: 1, padding: "11px 0", borderRadius: 10, border: "1px solid #1E293B", background: "transparent", color: "#64748B", fontSize: 13, cursor: "pointer" }}>Cancel</button>
              <button disabled={saving} onClick={submitAdd} style={{ flex: 1, padding: "11px 0", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#FF6B00,#FF8C40)", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", opacity: saving ? 0.6 : 1 }}>
                {saving ? "Scheduling…" : "Schedule Match"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Enter Result Modal */}
      {resultFor && (
        <div style={{ position: "fixed", inset: 0, background: "#00000088", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999 }}>
          <div style={{ background: "#0D1526", border: "1px solid #1E293B", borderRadius: 20, padding: 28, width: 480 }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#F1F5F9", marginBottom: 4 }}>🏆 Match Result</div>
            <div style={{ fontSize: 12, color: "#64748B", marginBottom: 18 }}>Match #{resultFor.matchNo} — {resultFor.team1} vs {resultFor.team2}<br />Saving the result also updates the points table automatically.</div>

            <label style={{ fontSize: 11, color: "#64748B", fontWeight: 700, display: "block", marginBottom: 6 }}>Winner</label>
            <select value={resultForm.outcome} onChange={e => setResultForm(p => ({ ...p, outcome: e.target.value }))} style={inputStyle}>
              <option value="">— Select —</option>
              <option value={resultFor.team1}>{resultFor.team1}</option>
              <option value={resultFor.team2}>{resultFor.team2}</option>
              <option value="__nr__">No Result (washed out / abandoned)</option>
            </select>

            <label style={{ fontSize: 11, color: "#64748B", fontWeight: 700, display: "block", margin: "14px 0 6px" }}>Result description (shown on website)</label>
            <input value={resultForm.resultDesc} onChange={e => setResultForm(p => ({ ...p, resultDesc: e.target.value }))} style={inputStyle}
              placeholder={resultForm.outcome && resultForm.outcome !== "__nr__" ? `e.g. ${resultForm.outcome} won by 14 runs` : "e.g. Match abandoned due to rain"} />

            {resultForm.outcome !== "__nr__" && (
              <>
                <label style={{ fontSize: 11, color: "#64748B", fontWeight: 700, display: "block", margin: "14px 0 6px" }}>Player of the Match (optional)</label>
                <input value={resultForm.playerOfMatch} onChange={e => setResultForm(p => ({ ...p, playerOfMatch: e.target.value }))} style={inputStyle} placeholder="Player name" />
              </>
            )}

            {resultErr && <div style={{ marginTop: 12, padding: "8px 12px", borderRadius: 8, background: "#EF444422", color: "#F87171", fontSize: 12, fontWeight: 600 }}>⚠ {resultErr}</div>}
            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              <button onClick={() => setResultFor(null)} style={{ flex: 1, padding: "11px 0", borderRadius: 10, border: "1px solid #1E293B", background: "transparent", color: "#64748B", fontSize: 13, cursor: "pointer" }}>Cancel</button>
              <button disabled={resultSaving} onClick={submitResult} style={{ flex: 1, padding: "11px 0", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#10B981,#34D399)", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", opacity: resultSaving ? 0.6 : 1 }}>
                {resultSaving ? "Saving…" : "Save Result"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Upload Modal */}
      {showBulk && (
        <div style={{ position: "fixed", inset: 0, background: "#00000088", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999 }}>
          <div style={{ background: "#0D1526", border: "1px solid #1E293B", borderRadius: 20, padding: 28, width: 640, maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#F1F5F9", marginBottom: 4 }}>📊 Bulk Fixture Upload</div>
            <div style={{ fontSize: 12, color: "#64748B", marginBottom: 20 }}>Upload a CSV file with your complete fixture schedule — every row becomes a real match on the website</div>

            <div style={{ background: "#060B18", borderRadius: 10, padding: "14px 16px", border: "1px solid #1E293B", marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#F59E0B", marginBottom: 8 }}>📋 Required CSV Format (Date as YYYY-MM-DD, Time as HH:MM):</div>
              <pre style={{ fontSize: 11, color: "#64748B", margin: 0, fontFamily: "monospace", lineHeight: 1.6 }}>Team 1,Team 2,Date,Time,Venue{"\n"}Rajasthan Scorchers,Punjab Warriors,2026-08-01,18:00,SMS Jaipur{"\n"}Mumbai Mavericks,Kolkata Tigers,2026-08-02,16:00,Wankhede Mumbai</pre>
              <button onClick={() => { const a = document.createElement("a"); a.href = "data:text/plain," + encodeURIComponent(SAMPLE_CSV); a.download = "bcpl_fixture_template.csv"; a.click(); }} style={{ marginTop: 10, padding: "6px 14px", borderRadius: 7, border: "1px solid #334155", background: "transparent", color: "#64748B", fontSize: 11, cursor: "pointer" }}>
                ⬇ Download Template
              </button>
            </div>

            <div
              onDragOver={e => e.preventDefault()}
              onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
              onClick={() => fileRef.current?.click()}
              style={{ background: "#060B18", borderRadius: 12, border: "2px dashed #334155", padding: "32px", textAlign: "center", cursor: "pointer", marginBottom: 14 }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = "#FF6B00")}
              onMouseLeave={e => (e.currentTarget.style.borderColor = "#334155")}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>📂</div>
              <div style={{ fontSize: 14, color: "#94A3B8", fontWeight: 600 }}>Drag & drop your .CSV file here</div>
              <div style={{ fontSize: 12, color: "#475569", marginTop: 4 }}>or click to browse</div>
              <input ref={fileRef} type="file" accept=".csv,.txt" style={{ display: "none" }} onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }} />
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 11, color: "#64748B", fontWeight: 700, display: "block", marginBottom: 6 }}>OR Paste CSV Text Directly:</label>
              <textarea value={csvText} onChange={e => { setCsvText(e.target.value); setBulkPreview(parseCsv(e.target.value)); }} rows={5}
                placeholder={"Team 1,Team 2,Date,Time,Venue\nRajasthan Scorchers,Punjab Warriors,2026-08-01,18:00,SMS Jaipur"}
                style={{ ...inputStyle, resize: "vertical", fontFamily: "monospace", fontSize: 12 }} />
            </div>

            {bulkPreview.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#10B981", marginBottom: 10 }}>✓ {bulkPreview.length} matches detected — Preview:</div>
                <div style={{ maxHeight: 180, overflowY: "auto", display: "flex", flexDirection: "column", gap: 6 }}>
                  {bulkPreview.map((m, i) => (
                    <div key={i} style={{ display: "flex", gap: 12, padding: "10px 12px", background: "#060B18", borderRadius: 8, border: "1px solid #1E293B", fontSize: 12, color: "#94A3B8" }}>
                      <span style={{ color: "#F1F5F9", fontWeight: 600 }}>{m.team1}</span>
                      <span style={{ color: "#FF6B00", fontWeight: 800 }}>vs</span>
                      <span style={{ color: "#F1F5F9", fontWeight: 600 }}>{m.team2}</span>
                      <span style={{ marginLeft: "auto" }}>{m.date} · {m.time}</span>
                      <span>📍 {m.venue}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => { setShowBulk(false); setBulkPreview([]); setCsvText(""); }} style={{ flex: 1, padding: "11px 0", borderRadius: 10, border: "1px solid #1E293B", background: "transparent", color: "#64748B", fontSize: 13, cursor: "pointer" }}>Cancel</button>
              <button disabled={bulkPreview.length === 0 || bulkBusy} onClick={importBulk}
                style={{ flex: 1, padding: "11px 0", borderRadius: 10, border: "none", background: bulkPreview.length > 0 ? "linear-gradient(135deg,#FF6B00,#FF8C40)" : "#1E293B", color: bulkPreview.length > 0 ? "#fff" : "#475569", fontSize: 13, fontWeight: 700, cursor: bulkPreview.length > 0 && !bulkBusy ? "pointer" : "not-allowed" }}>
                {bulkBusy ? "Importing…" : `Import ${bulkPreview.length > 0 ? `${bulkPreview.length} Matches` : ""}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

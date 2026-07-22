import { useState, useEffect, useRef } from "react";
import {
  getTeams, getTeamDetail, getPointsTable, getMatches,
  adminCreateTeam, adminUpdateTeam, adminDeleteTeam,
  adminAddTeamPlayer, adminUpdateTeamPlayer, adminDeleteTeamPlayer,
  type ApiTeam, type ApiTeamPlayer,
} from "../../lib/api";

/* ─── Helpers ────────────────────────────────────────────────── */
const SEASON = 5;
const num = (v: unknown) => { const n = Number(v); return isNaN(n) ? 0 : n; };
const str = (v: unknown) => (v == null ? "" : String(v));
const asset = (url: string) =>
  !url ? "" : url.startsWith("data:") || url.startsWith("http") ? url : import.meta.env.BASE_URL + url.replace(/^\//, "");

const roleColor = (r: string) => r === "Batsman" ? "#3B82F6" : r === "Bowler" ? "#EF4444" : r === "All-rounder" ? "#FF6B00" : "#10B981";
const roleEmoji = (r: string) => r === "Batsman" ? "🏏" : r === "Bowler" ? "🎳" : r === "All-rounder" ? "⭐" : "🧤";

type PtsRow = { team: string; played: number; won: number; lost: number; noResult: number; points: number; nrr: string | number; form: string[] };
type Match  = { id: string; matchNo: number; team1: string; team2: string; venue: string; scheduledAt: string | null; status: string; winner: string | null; resultDesc: string | null };

const ls = (p: ApiTeamPlayer) => ({
  matches: num(p.stats?.matches), runs: num(p.stats?.runs), avg: num(p.stats?.avg), sr: num(p.stats?.sr),
  wickets: num(p.stats?.wickets), economy: num(p.stats?.economy), fifties: num(p.stats?.fifties), centuries: num(p.stats?.centuries),
  sixes: num(p.stats?.sixes), fours: num(p.stats?.fours), bestBowl: str(p.stats?.bestBowl) || "—", bestBat: str(p.stats?.bestBat) || "—",
});

const EMPTY_NP = {
  name: "", role: "Batsman", age: "", state: "", photoUrl: "", battingStyle: "Right-hand bat",
  bowlingStyle: "Right-arm medium", jerseyNo: "", nationality: "Indian", isCaptain: false, isViceCaptain: false,
  matches: "", runs: "", avg: "", sr: "", wickets: "", economy: "", fifties: "", centuries: "",
  sixes: "", fours: "", bestBowl: "", bestBat: "", auctionPrice: "",
};
type NP = typeof EMPTY_NP;

const npToPayload = (np: NP) => ({
  name: np.name.trim(),
  role: np.role as any,
  age: np.age ? parseInt(np.age) : null,
  state: np.state.trim(),
  photoUrl: np.photoUrl,
  battingStyle: np.battingStyle,
  bowlingStyle: np.bowlingStyle,
  jerseyNo: np.jerseyNo.trim(),
  nationality: np.nationality,
  isCaptain: np.isCaptain,
  isViceCaptain: np.isViceCaptain,
  auctionPrice: np.auctionPrice.trim(),
  stats: {
    matches: num(np.matches), runs: num(np.runs), avg: num(np.avg), sr: num(np.sr),
    wickets: num(np.wickets), economy: num(np.economy), fifties: num(np.fifties), centuries: num(np.centuries),
    sixes: num(np.sixes), fours: num(np.fours), bestBowl: np.bestBowl.trim(), bestBat: np.bestBat.trim(),
  },
});

const playerToNp = (p: ApiTeamPlayer): NP => ({
  name: p.name, role: p.role, age: p.age ? String(p.age) : "", state: p.state, photoUrl: p.photoUrl,
  battingStyle: p.battingStyle || "Right-hand bat", bowlingStyle: p.bowlingStyle || "Right-arm medium",
  jerseyNo: p.jerseyNo, nationality: p.nationality || "Indian", isCaptain: p.isCaptain, isViceCaptain: p.isViceCaptain,
  matches: String(num(p.stats?.matches) || ""), runs: String(num(p.stats?.runs) || ""), avg: String(num(p.stats?.avg) || ""),
  sr: String(num(p.stats?.sr) || ""), wickets: String(num(p.stats?.wickets) || ""), economy: String(num(p.stats?.economy) || ""),
  fifties: String(num(p.stats?.fifties) || ""), centuries: String(num(p.stats?.centuries) || ""),
  sixes: String(num(p.stats?.sixes) || ""), fours: String(num(p.stats?.fours) || ""),
  bestBowl: str(p.stats?.bestBowl), bestBat: str(p.stats?.bestBat), auctionPrice: p.auctionPrice,
});

/* ─── Small components ───────────────────────────────────────── */
function Avatar({ url, name, size = 40, color = "#334155" }: { url: string; name: string; size?: number; color?: string }) {
  const src = asset(url);
  return src
    ? <img src={src} alt={name} style={{ width: size, height: size, borderRadius: size / 4, objectFit: "cover", border: `2px solid ${color}44`, flexShrink: 0 }} />
    : <div style={{ width: size, height: size, borderRadius: size / 4, background: color + "33", border: `2px solid ${color}55`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.38, fontWeight: 900, color, flexShrink: 0 }}>{name?.[0] || "?"}</div>;
}

function TeamLogo({ url, name, size = 40, color = "#334155" }: { url: string; name: string; size?: number; color?: string }) {
  const src = asset(url);
  return src
    ? <img src={src} alt={name} style={{ width: size, height: size, borderRadius: size / 4, objectFit: "contain", background: "rgba(255,255,255,0.94)", padding: 3, flexShrink: 0 }} />
    : <div style={{ width: size, height: size, borderRadius: size / 4, background: `linear-gradient(135deg,${color}44,${color}22)`, border: `2px solid ${color}55`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.45, fontWeight: 900, color, flexShrink: 0 }}>{name?.[0] || "T"}</div>;
}

function ImageUpload({ label, value, onChange, size = 64 }: { label: string; value: string; onChange: (url: string) => void; size?: number }) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div>
      <label style={{ fontSize: 11, color: "#64748B", fontWeight: 700, display: "block", marginBottom: 6 }}>{label}</label>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: size, height: size, borderRadius: 12, background: "#060B18", border: `2px dashed ${value ? "#FF6B00" : "#1E293B"}`, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", cursor: "pointer", flexShrink: 0 }} onClick={() => ref.current?.click()}>
          {value ? <img src={asset(value)} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontSize: 22, opacity: .4 }}>📷</span>}
        </div>
        <div>
          <button onClick={() => ref.current?.click()} style={{ padding: "7px 14px", borderRadius: 8, border: "1px solid #1E293B", background: "transparent", color: "#94A3B8", fontSize: 12, cursor: "pointer", display: "block", marginBottom: 4 }}>{value ? "Change" : "Upload Image"}</button>
          {value && <button onClick={() => onChange("")} style={{ padding: "4px 10px", borderRadius: 6, border: "none", background: "transparent", color: "#EF4444", fontSize: 11, cursor: "pointer" }}>Remove</button>}
          <div style={{ fontSize: 10, color: "#334155", marginTop: 2 }}>JPG, PNG, WebP · max 2MB</div>
        </div>
      </div>
      <input ref={ref} type="file" accept="image/jpeg,image/png,image/webp" onChange={e => {
        const f = e.target.files?.[0]; if (!f) return;
        if (f.size > 2 * 1024 * 1024) { alert("Image must be under 2MB"); return; }
        const r = new FileReader(); r.onload = ev => onChange(ev.target?.result as string); r.readAsDataURL(f);
      }} style={{ display: "none" }} />
    </div>
  );
}

/* ─── Main Component ─────────────────────────────────────────── */
export default function TeamsView() {
  const [teams,    setTeams]    = useState<ApiTeam[]>([]);
  const [ptsMap,   setPtsMap]   = useState<Record<string, PtsRow>>({});
  const [squads,   setSquads]   = useState<Record<string, ApiTeamPlayer[]>>({});
  const [matches,  setMatches]  = useState<Match[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [loadErr,  setLoadErr]  = useState("");
  const [banner,   setBanner]   = useState("");

  const [selTeamId,   setSelTeamId]   = useState<string | null>(null);
  const [detailTab,   setDetailTab]   = useState<"squad" | "stats" | "history">("squad");
  const [squadBusy,   setSquadBusy]   = useState(false);

  const [editTeam,    setEditTeam]    = useState<null | { id: string; name: string; city: string; captain: string; coach: string; owner: string; homeGround: string; color: string; secondColor: string; logoUrl: string; titlesWon: string }>(null);
  const [showAddTeam, setShowAddTeam] = useState(false);
  const [newTeam,     setNewTeam]     = useState({ name: "", city: "", color: "#FF6B00", secondColor: "#F59E0B", logoUrl: "" });
  const [modalErr,    setModalErr]    = useState("");
  const [modalBusy,   setModalBusy]   = useState(false);

  const [playerModal, setPlayerModal] = useState<null | { mode: "add" } | { mode: "edit"; playerId: string }>(null);
  const [np,          setNp]          = useState<NP>(EMPTY_NP);
  const [viewPlayer,  setViewPlayer]  = useState<ApiTeamPlayer | null>(null);

  const [showCompare, setShowCompare] = useState(false);
  const [compareA,    setCompareA]    = useState<string>("");
  const [compareB,    setCompareB]    = useState<string>("");

  const card: React.CSSProperties = { background: "linear-gradient(135deg,#0D1526 0%,#0A1020 100%)", border: "1px solid #1E293B", borderRadius: 16, padding: 20 };
  const inp: React.CSSProperties  = { width: "100%", padding: "9px 12px", background: "#060B18", border: "1px solid #1E293B", borderRadius: 9, color: "#F1F5F9", fontSize: 13, outline: "none", boxSizing: "border-box" };
  const lbl: React.CSSProperties  = { fontSize: 11, color: "#64748B", fontWeight: 700, display: "block", marginBottom: 5 };

  const flash = (m: string) => { setBanner(m); setTimeout(() => setBanner(""), 6000); };

  const reload = async () => {
    setLoadErr("");
    try {
      const [t, p, m] = await Promise.all([getTeams(SEASON), getPointsTable(SEASON), getMatches(SEASON)]);
      setTeams(t.teams || []);
      const pm: Record<string, PtsRow> = {};
      for (const row of ((p as any).table || [])) pm[row.team] = row;
      setPtsMap(pm);
      setMatches(((m as any).matches || []) as Match[]);
    } catch (e: any) {
      setLoadErr(e?.message || "Could not load teams from the server");
    } finally { setLoading(false); }
  };
  useEffect(() => { reload(); }, []);

  const loadSquad = async (team: ApiTeam, force = false) => {
    if (!force && squads[team.id]) return;
    setSquadBusy(true);
    try {
      const d = await getTeamDetail(team.slug);
      setSquads(s => ({ ...s, [team.id]: d.players || [] }));
    } catch (e: any) {
      setLoadErr(e?.message || "Could not load squad");
    } finally { setSquadBusy(false); }
  };

  const selTeam = teams.find(t => t.id === selTeamId) || null;
  const selSquad = selTeam ? (squads[selTeam.id] || []) : [];
  const pts = (name: string): PtsRow => ptsMap[name] || { team: name, played: 0, won: 0, lost: 0, noResult: 0, points: 0, nrr: "0.00", form: [] };

  const sorted = [...teams].sort((a, b) => {
    const pa = pts(a.name), pb = pts(b.name);
    return pb.points - pa.points || num(pb.nrr) - num(pa.nrr) || a.name.localeCompare(b.name);
  });

  /* ── Team CRUD ── */
  const submitAddTeam = async () => {
    if (!newTeam.name.trim()) { setModalErr("Team name is required"); return; }
    setModalBusy(true); setModalErr("");
    try {
      await adminCreateTeam({ ...newTeam, name: newTeam.name.trim(), city: newTeam.city.trim() });
      setShowAddTeam(false);
      setNewTeam({ name: "", city: "", color: "#FF6B00", secondColor: "#F59E0B", logoUrl: "" });
      await reload();
      flash("Team created — it is now visible on the website");
    } catch (e: any) { setModalErr(e?.message || "Failed to create team"); }
    finally { setModalBusy(false); }
  };

  const submitEditTeam = async () => {
    if (!editTeam) return;
    if (!editTeam.name.trim()) { setModalErr("Team name is required"); return; }
    setModalBusy(true); setModalErr("");
    try {
      await adminUpdateTeam(editTeam.id, {
        name: editTeam.name.trim(), city: editTeam.city.trim(), captain: editTeam.captain.trim(),
        coach: editTeam.coach.trim(), owner: editTeam.owner.trim(), homeGround: editTeam.homeGround.trim(),
        color: editTeam.color, secondColor: editTeam.secondColor, logoUrl: editTeam.logoUrl,
        titlesWon: num(editTeam.titlesWon),
      });
      setEditTeam(null);
      await reload();
      flash("Team updated — changes are live on the website");
    } catch (e: any) { setModalErr(e?.message || "Failed to update team"); }
    finally { setModalBusy(false); }
  };

  const submitDeleteTeam = async () => {
    if (!editTeam) return;
    if (!window.confirm(`Delete ${editTeam.name} and its entire squad? This cannot be undone.`)) return;
    setModalBusy(true);
    try {
      await adminDeleteTeam(editTeam.id);
      setEditTeam(null); setSelTeamId(null);
      await reload();
      flash("Team deleted");
    } catch (e: any) { setModalErr(e?.message || "Failed to delete team"); }
    finally { setModalBusy(false); }
  };

  /* ── Player CRUD ── */
  const submitPlayer = async () => {
    if (!selTeam || !playerModal) return;
    if (!np.name.trim()) { setModalErr("Player name is required"); return; }
    setModalBusy(true); setModalErr("");
    try {
      if (playerModal.mode === "add") await adminAddTeamPlayer(selTeam.id, npToPayload(np));
      else await adminUpdateTeamPlayer(playerModal.playerId, npToPayload(np));
      setPlayerModal(null); setNp(EMPTY_NP);
      await loadSquad(selTeam, true);
      await reload();
      flash(playerModal.mode === "add" ? "Player added to squad — visible on the website" : "Player updated");
    } catch (e: any) { setModalErr(e?.message || "Failed to save player"); }
    finally { setModalBusy(false); }
  };

  const removePlayer = async (p: ApiTeamPlayer) => {
    if (!selTeam) return;
    if (!window.confirm(`Remove ${p.name} from ${selTeam.name}?`)) return;
    try {
      await adminDeleteTeamPlayer(p.id);
      await loadSquad(selTeam, true);
      await reload();
      flash("Player removed");
    } catch (e: any) { setLoadErr(e?.message || "Failed to remove player"); }
  };

  /* ── Analytics ── */
  const teamAnalytics = (players: ApiTeamPlayer[]) => {
    if (!players.length) return null;
    const S = players.map(ls);
    const batters = players.filter(p => p.role === "Batsman" || p.role === "All-rounder").map(ls);
    const bowlers = players.filter(p => p.role === "Bowler" || p.role === "All-rounder").map(ls);
    return {
      avgBatAvg:    batters.length ? (batters.reduce((a, s) => a + s.avg, 0) / batters.length).toFixed(1) : "—",
      avgSR:        batters.length ? (batters.reduce((a, s) => a + s.sr, 0) / batters.length).toFixed(1) : "—",
      avgEconomy:   bowlers.length ? (bowlers.reduce((a, s) => a + s.economy, 0) / bowlers.length).toFixed(1) : "—",
      totalWickets: S.reduce((a, s) => a + s.wickets, 0),
      totalRuns:    S.reduce((a, s) => a + s.runs, 0),
      totalSixes:   S.reduce((a, s) => a + s.sixes, 0),
    };
  };

  /* ── Team match history (real, from matches API) ── */
  const teamHistory = (name: string) =>
    matches
      .filter(m => (m.status === "completed" || m.status === "abandoned") && (m.team1 === name || m.team2 === name))
      .sort((a, b) => (b.scheduledAt || "").localeCompare(a.scheduledAt || ""))
      .map(m => ({
        opponent: m.team1 === name ? m.team2 : m.team1,
        result: m.status === "abandoned" ? "NR" : m.winner === name ? "W" : "L",
        desc: m.resultDesc || "",
        date: m.scheduledAt ? new Date(m.scheduledAt).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", day: "2-digit", month: "short" }) : "",
      }));

  const resColor = (r: string) => r === "W" ? "#10B981" : r === "L" ? "#EF4444" : "#94A3B8";

  /* ── Player form fields (add + edit) ── */
  const PlayerFormFields = (
    <>
      <ImageUpload label="Player Photo" value={np.photoUrl} onChange={url => setNp(p => ({ ...p, photoUrl: url }))} size={72} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 14 }}>
        {[{ l: "Full Name", k: "name", span: true }, { l: "State / City", k: "state" }, { l: "Age", k: "age" }, { l: "Jersey No.", k: "jerseyNo" }, { l: "Auction Price (₹, digits only)", k: "auctionPrice" }].map(f => (
          <div key={f.k} style={{ gridColumn: (f as any).span ? "1/-1" : "auto" }}>
            <label style={lbl}>{f.l}</label>
            <input value={(np as any)[f.k]} onChange={e => setNp(p => ({ ...p, [f.k]: e.target.value }))} style={inp} />
          </div>
        ))}
        <div>
          <label style={lbl}>Role</label>
          <select value={np.role} onChange={e => setNp(p => ({ ...p, role: e.target.value }))} style={inp}>
            {["Batsman", "Bowler", "All-rounder", "Wicket-keeper"].map(r => <option key={r}>{r}</option>)}
          </select>
        </div>
        <div>
          <label style={lbl}>Nationality</label>
          <select value={np.nationality} onChange={e => setNp(p => ({ ...p, nationality: e.target.value }))} style={inp}>
            {["Indian", "Overseas"].map(r => <option key={r}>{r}</option>)}
          </select>
        </div>
        <div>
          <label style={lbl}>Batting Style</label>
          <select value={np.battingStyle} onChange={e => setNp(p => ({ ...p, battingStyle: e.target.value }))} style={inp}>
            {["Right-hand bat", "Left-hand bat"].map(r => <option key={r}>{r}</option>)}
          </select>
        </div>
        <div>
          <label style={lbl}>Bowling Style</label>
          <select value={np.bowlingStyle} onChange={e => setNp(p => ({ ...p, bowlingStyle: e.target.value }))} style={inp}>
            {["Right-arm fast", "Right-arm fast-medium", "Right-arm medium", "Right-arm off-break", "Right-arm leg-break", "Left-arm fast", "Left-arm fast-medium", "Left-arm orthodox", "Left-arm chinaman", "Does not bowl"].map(r => <option key={r}>{r}</option>)}
          </select>
        </div>
        <div style={{ gridColumn: "1/-1", display: "flex", gap: 20 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
            <input type="checkbox" checked={np.isCaptain} onChange={e => setNp(p => ({ ...p, isCaptain: e.target.checked }))} style={{ width: 16, height: 16 }} />
            <span style={{ fontSize: 12, color: "#F59E0B", fontWeight: 700 }}>👑 Captain</span>
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
            <input type="checkbox" checked={np.isViceCaptain} onChange={e => setNp(p => ({ ...p, isViceCaptain: e.target.checked }))} style={{ width: 16, height: 16 }} />
            <span style={{ fontSize: 12, color: "#94A3B8", fontWeight: 700 }}>🏅 Vice-Captain</span>
          </label>
        </div>
      </div>
      <div style={{ fontSize: 12, fontWeight: 700, color: "#475569", margin: "16px 0 10px", textTransform: "uppercase", letterSpacing: .5 }}>⚡ Last Season Scorecard (optional)</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 9 }}>
        {[{ l: "Matches", k: "matches" }, { l: "Runs", k: "runs" }, { l: "Bat Avg", k: "avg" }, { l: "Strike Rate", k: "sr" }, { l: "Fours", k: "fours" }, { l: "Sixes", k: "sixes" }, { l: "Fifties", k: "fifties" }, { l: "Centuries", k: "centuries" }, { l: "Wickets", k: "wickets" }, { l: "Economy", k: "economy" }, { l: "Best Bowl", k: "bestBowl" }, { l: "Best Bat", k: "bestBat" }].map(f => (
          <div key={f.k}>
            <label style={{ fontSize: 10, color: "#475569", fontWeight: 700, display: "block", marginBottom: 4 }}>{f.l}</label>
            <input value={(np as any)[f.k]} onChange={e => setNp(p => ({ ...p, [f.k]: e.target.value }))} placeholder="0" style={{ width: "100%", padding: "7px 9px", background: "#060B18", border: "1px solid #1E293B", borderRadius: 8, color: "#F1F5F9", fontSize: 12, outline: "none", boxSizing: "border-box" }} />
          </div>
        ))}
      </div>
    </>
  );

  const modalShell = (width: number, children: React.ReactNode) => (
    <div style={{ position: "fixed", inset: 0, background: "#00000088", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999 }}>
      <div style={{ background: "#0D1526", border: "1px solid #1E293B", borderRadius: 20, padding: 28, width, maxHeight: "92vh", overflowY: "auto" }}>{children}</div>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {banner  && <div style={{ padding: "10px 16px", borderRadius: 10, background: "#10B98122", border: "1px solid #10B98155", color: "#10B981", fontSize: 13, fontWeight: 600 }}>✓ {banner}</div>}
      {loadErr && <div style={{ padding: "10px 16px", borderRadius: 10, background: "#EF444422", border: "1px solid #EF444455", color: "#F87171", fontSize: 13, fontWeight: 600 }}>⚠ {loadErr}</div>}

      <div style={{ display: "flex", gap: 16 }}>
        {/* ── LEFT: Standings ── */}
        <div style={{ flex: "0 0 440px", display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#F1F5F9" }}>BCPL Teams</div>
              <div style={{ fontSize: 11, color: "#64748B", marginTop: 2 }}>{teams.length} franchise teams · Season {SEASON}</div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setShowCompare(true)} style={{ padding: "7px 12px", borderRadius: 9, border: "1px solid #1E293B", background: "transparent", color: "#94A3B8", fontSize: 11, cursor: "pointer" }}>⚔ Compare</button>
              <button onClick={() => { setModalErr(""); setShowAddTeam(true); }} style={{ padding: "8px 16px", borderRadius: 9, border: "none", background: "linear-gradient(135deg,#FF6B00,#FF8C40)", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>+ Add Team</button>
            </div>
          </div>

          {/* Summary stats */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
            {[
              { v: String(teams.length), l: "Teams", c: "#FF6B00" },
              { v: String(teams.reduce((a, t) => a + (t.playerCount || 0), 0)), l: "Players", c: "#10B981" },
              { v: `${teams.filter(t => (t.playerCount || 0) > 0).length}/${teams.length || 0}`, l: "Squads Filled", c: "#F59E0B" },
            ].map(s => (
              <div key={s.l} style={{ ...card, padding: "12px 14px", textAlign: "center", borderTop: `2px solid ${s.c}` }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: s.c }}>{s.v}</div>
                <div style={{ fontSize: 10, color: "#475569", marginTop: 2 }}>{s.l}</div>
              </div>
            ))}
          </div>

          {/* Points Table (live) */}
          <div style={{ ...card, padding: 0, overflow: "hidden" }}>
            <div style={{ padding: "12px 14px", background: "#060E1C", borderBottom: "1px solid #1E293B", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 12, fontWeight: 800, color: "#F1F5F9" }}>Points Table</span>
              <span style={{ fontSize: 10, color: "#475569" }}>Season {SEASON} · auto-updates from match results</span>
            </div>
            {loading ? (
              <div style={{ padding: 24, textAlign: "center", color: "#64748B", fontSize: 12 }}>Loading…</div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#060E1C", borderBottom: "1px solid #1E293B" }}>
                    {["#", "Team", "M", "W", "L", "NRR", "Pts", ""].map(h => (
                      <th key={h} style={{ padding: "8px 8px", textAlign: h === "Team" ? "left" : "center", fontSize: 10, color: "#475569", fontWeight: 700, textTransform: "uppercase" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((t, i) => {
                    const p = pts(t.name);
                    return (
                      <tr key={t.id} onClick={() => { setSelTeamId(t.id); setDetailTab("squad"); loadSquad(t); }} style={{
                        borderBottom: "1px solid #0F1B2D", cursor: "pointer",
                        background: selTeamId === t.id ? `${t.color}18` : "transparent", transition: "background .15s",
                        borderLeft: selTeamId === t.id ? `3px solid ${t.color}` : "3px solid transparent",
                      }}>
                        <td style={{ padding: "10px 8px", textAlign: "center" }}>
                          <span style={{ fontSize: p.played > 0 && i < 3 ? 16 : 13, fontWeight: 800, color: p.played > 0 ? (i === 0 ? "#FFD700" : i === 1 ? "#C0C0C0" : i === 2 ? "#CD7F32" : "#334155") : "#334155" }}>
                            {p.played > 0 ? (i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1) : i + 1}
                          </span>
                        </td>
                        <td style={{ padding: "10px 8px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <TeamLogo url={t.logoUrl} name={t.name} size={26} color={t.color} />
                            <div>
                              <div style={{ fontSize: 12, fontWeight: 700, color: "#F1F5F9", lineHeight: 1.2 }}>{t.name}</div>
                              <div style={{ fontSize: 9, color: "#475569" }}>{t.city}{t.playerCount ? ` · ${t.playerCount}P` : ""}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: "10px 8px", textAlign: "center", fontSize: 12, color: "#94A3B8" }}>{p.played}</td>
                        <td style={{ padding: "10px 8px", textAlign: "center", fontSize: 13, fontWeight: 800, color: "#10B981" }}>{p.won}</td>
                        <td style={{ padding: "10px 8px", textAlign: "center", fontSize: 13, color: "#EF4444", fontWeight: 600 }}>{p.lost}</td>
                        <td style={{ padding: "10px 8px", textAlign: "center", fontSize: 11, color: num(p.nrr) >= 0 ? "#10B981" : "#EF4444", fontWeight: 700 }}>{Number(num(p.nrr)).toFixed(2)}</td>
                        <td style={{ padding: "10px 8px", textAlign: "center", fontSize: 15, fontWeight: 800, color: "#FF6B00" }}>{p.points}</td>
                        <td style={{ padding: "10px 8px", textAlign: "center" }}>
                          <button onClick={e => { e.stopPropagation(); setModalErr(""); setEditTeam({ id: t.id, name: t.name, city: t.city, captain: t.captain, coach: t.coach, owner: t.owner, homeGround: t.homeGround, color: t.color, secondColor: t.secondColor, logoUrl: t.logoUrl, titlesWon: String(t.titlesWon) }); }} style={{ padding: "3px 8px", borderRadius: 6, border: "1px solid #1E293B", background: "transparent", color: "#64748B", fontSize: 10, cursor: "pointer" }}>✏</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
          <div style={{ fontSize: 10, color: "#475569", lineHeight: 1.5 }}>League has not started yet — standings fill in automatically as match results are entered in Match Management.</div>
        </div>

        {/* ── RIGHT: Team Detail ── */}
        {!selTeam && (
          <div style={{ flex: 1, ...card, display: "flex", alignItems: "center", justifyContent: "center", minHeight: 320 }}>
            <div style={{ textAlign: "center", color: "#475569" }}>
              <div style={{ fontSize: 40, marginBottom: 10 }}>🏏</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#64748B" }}>Select a team to manage its squad & info</div>
              <div style={{ fontSize: 12, marginTop: 4 }}>Everything you change here appears on the public website instantly.</div>
            </div>
          </div>
        )}
        {selTeam && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 14, minWidth: 0 }}>
            {/* Team Banner */}
            <div style={{ borderRadius: 16, overflow: "hidden", border: "1px solid #1E293B" }}>
              <div style={{ background: `linear-gradient(135deg,${selTeam.color}44 0%,${selTeam.secondColor}22 100%)`, padding: "20px 22px", borderBottom: "1px solid #1E293B" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <TeamLogo url={selTeam.logoUrl} name={selTeam.name} size={68} color={selTeam.color} />
                    <div>
                      <div style={{ fontSize: 22, fontWeight: 900, color: "#F1F5F9", lineHeight: 1.1 }}>{selTeam.name}</div>
                      <div style={{ fontSize: 12, color: "rgba(255,255,255,.5)", marginTop: 4 }}>
                        📍 {selTeam.city || "City TBD"}{selTeam.homeGround ? <> &nbsp;·&nbsp; 🏟 {selTeam.homeGround}</> : null}
                      </div>
                      {(selTeam.coach || selTeam.owner) && (
                        <div style={{ fontSize: 11, color: "rgba(255,255,255,.4)", marginTop: 3 }}>
                          {selTeam.coach ? <>👤 Coach: {selTeam.coach}</> : null}{selTeam.coach && selTeam.owner ? <> &nbsp;·&nbsp; </> : null}{selTeam.owner ? <>🏢 Owner: {selTeam.owner}</> : null}
                        </div>
                      )}
                      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                        {selTeam.titlesWon > 0 && (
                          <span style={{ fontSize: 10, padding: "2px 10px", borderRadius: 6, background: "#FFD70022", border: "1px solid #FFD70044", color: "#FFD700", fontWeight: 700 }}>🏆 {selTeam.titlesWon} Title{selTeam.titlesWon > 1 ? "s" : ""}</span>
                        )}
                        <span style={{ fontSize: 10, padding: "2px 10px", borderRadius: 6, background: "rgba(255,255,255,.06)", color: "rgba(255,255,255,.4)", fontWeight: 600 }}>{selSquad.length} Players</span>
                      </div>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => { setModalErr(""); setEditTeam({ id: selTeam.id, name: selTeam.name, city: selTeam.city, captain: selTeam.captain, coach: selTeam.coach, owner: selTeam.owner, homeGround: selTeam.homeGround, color: selTeam.color, secondColor: selTeam.secondColor, logoUrl: selTeam.logoUrl, titlesWon: String(selTeam.titlesWon) }); }} style={{ padding: "7px 14px", borderRadius: 8, border: "1px solid rgba(255,255,255,.15)", background: "rgba(255,255,255,.06)", color: "#94A3B8", fontSize: 12, cursor: "pointer" }}>✏️ Edit</button>
                    <button onClick={() => setSelTeamId(null)} style={{ padding: "7px 10px", borderRadius: 8, border: "none", background: "rgba(255,255,255,.06)", color: "#64748B", fontSize: 12, cursor: "pointer" }}>✕</button>
                  </div>
                </div>
              </div>
              {/* Stats row (live from points table) */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", background: "#060B18" }}>
                {(() => {
                  const p = pts(selTeam.name);
                  const rank = sorted.findIndex(t => t.id === selTeam.id) + 1;
                  return [
                    { l: "Wins",   v: p.won,  c: "#10B981" },
                    { l: "Losses", v: p.lost, c: "#EF4444" },
                    { l: "NRR",    v: Number(num(p.nrr)).toFixed(2), c: num(p.nrr) >= 0 ? "#10B981" : "#EF4444" },
                    { l: "Points", v: p.points, c: "#FF6B00" },
                    { l: "Rank",   v: `#${rank}`, c: "#F59E0B" },
                  ].map((s, i) => (
                    <div key={s.l} style={{ textAlign: "center", padding: "14px 8px", borderRight: i < 4 ? "1px solid #1E293B" : "none" }}>
                      <div style={{ fontSize: 22, fontWeight: 900, color: s.c }}>{s.v}</div>
                      <div style={{ fontSize: 10, color: "#475569", marginTop: 3 }}>{s.l}</div>
                    </div>
                  ));
                })()}
              </div>
            </div>

            {/* Sub-tabs */}
            <div style={{ display: "flex", gap: 6 }}>
              {([["squad", "👥 Squad"], ["stats", "📊 Analytics"], ["history", "📋 Match History"]] as const).map(([t, l]) => (
                <button key={t} onClick={() => setDetailTab(t)} style={{ padding: "8px 18px", borderRadius: 10, border: `1px solid ${detailTab === t ? selTeam.color : "#1E293B"}`, background: detailTab === t ? selTeam.color + "22" : "transparent", color: detailTab === t ? selTeam.color : "#64748B", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>{l}</button>
              ))}
            </div>

            {/* ── Squad Tab ── */}
            {detailTab === "squad" && (
              <div style={{ ...card }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#F1F5F9" }}>Squad</div>
                    <div style={{ fontSize: 11, color: "#64748B", marginTop: 2 }}>
                      {selSquad.length} players &nbsp;·&nbsp;
                      {selSquad.filter(p => p.role === "Batsman").length} Bat &nbsp;
                      {selSquad.filter(p => p.role === "Bowler").length} Bowl &nbsp;
                      {selSquad.filter(p => p.role === "All-rounder").length} AR &nbsp;
                      {selSquad.filter(p => p.role === "Wicket-keeper").length} WK
                    </div>
                  </div>
                  <button onClick={() => { setModalErr(""); setNp(EMPTY_NP); setPlayerModal({ mode: "add" }); }} style={{ padding: "9px 18px", borderRadius: 9, border: "none", background: `linear-gradient(135deg,${selTeam.color},${selTeam.secondColor})`, color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>+ Add Player</button>
                </div>

                {squadBusy && selSquad.length === 0
                  ? <div style={{ textAlign: "center", padding: "30px 0", color: "#64748B", fontSize: 12 }}>Loading squad…</div>
                  : selSquad.length === 0
                    ? (
                      <div style={{ textAlign: "center", padding: "48px 0", color: "#334155" }}>
                        <div style={{ fontSize: 44, marginBottom: 12 }}>👥</div>
                        <div style={{ fontSize: 14, color: "#475569", fontWeight: 600 }}>No players in this squad yet</div>
                        <div style={{ fontSize: 12, color: "#334155", marginTop: 4 }}>Squads form after the auction — add players here as they are picked.</div>
                        <button onClick={() => { setModalErr(""); setNp(EMPTY_NP); setPlayerModal({ mode: "add" }); }} style={{ marginTop: 14, padding: "10px 22px", borderRadius: 10, border: "none", background: "#FF6B0022", color: "#FF6B00", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>+ Add First Player</button>
                      </div>
                    )
                    : (
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {selSquad.map(p => {
                          const s = ls(p);
                          return (
                            <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", background: "#060B18", borderRadius: 12, border: "1px solid #1E293B", transition: "border-color .15s" }}
                              onMouseEnter={e => e.currentTarget.style.borderColor = `${selTeam.color}55`}
                              onMouseLeave={e => e.currentTarget.style.borderColor = "#1E293B"}>
                              <Avatar url={p.photoUrl} name={p.name} size={44} color={roleColor(p.role)} />
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                                  <span style={{ fontSize: 13, fontWeight: 700, color: "#F1F5F9" }}>{p.name}</span>
                                  {p.isCaptain && <span style={{ fontSize: 10, background: "#FFD70022", border: "1px solid #FFD70044", color: "#FFD700", fontWeight: 700, padding: "1px 7px", borderRadius: 5 }}>👑 C</span>}
                                  {p.isViceCaptain && <span style={{ fontSize: 10, background: "rgba(255,255,255,.06)", color: "#94A3B8", fontWeight: 700, padding: "1px 7px", borderRadius: 5 }}>VC</span>}
                                  {p.jerseyNo && <span style={{ fontSize: 10, color: "#334155", background: "#1E293B", padding: "1px 6px", borderRadius: 5 }}>#{p.jerseyNo}</span>}
                                  {p.nationality === "Overseas" && <span style={{ fontSize: 9, background: "#3B82F622", color: "#3B82F6", fontWeight: 700, padding: "1px 7px", borderRadius: 5 }}>🌍 OS</span>}
                                </div>
                                <div style={{ display: "flex", gap: 6, marginTop: 4, flexWrap: "wrap" }}>
                                  <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 5, background: roleColor(p.role) + "22", color: roleColor(p.role), fontWeight: 700 }}>{roleEmoji(p.role)} {p.role}</span>
                                  {(p.state || p.age) && <span style={{ fontSize: 10, color: "#475569" }}>{p.state}{p.state && p.age ? " · " : ""}{p.age ? `${p.age}y` : ""}</span>}
                                  {p.auctionPrice && <span style={{ fontSize: 10, color: "#E8B23D", fontWeight: 700 }}>🏷 {p.auctionPrice}</span>}
                                </div>
                              </div>
                              <div style={{ display: "flex", gap: 10, flexShrink: 0 }}>
                                {[{ l: "R", v: s.runs, c: "#FF6B00" }, { l: "W", v: s.wickets, c: "#EF4444" }, { l: "Avg", v: s.avg, c: "#F59E0B" }, { l: "SR", v: s.sr, c: "#3B82F6" }].map(x => (
                                  <div key={x.l} style={{ textAlign: "center", minWidth: 32 }}>
                                    <div style={{ fontSize: 13, fontWeight: 800, color: x.c }}>{x.v || 0}</div>
                                    <div style={{ fontSize: 9, color: "#475569" }}>{x.l}</div>
                                  </div>
                                ))}
                              </div>
                              <div style={{ display: "flex", gap: 6 }}>
                                <button onClick={() => setViewPlayer(p)} style={{ padding: "5px 10px", borderRadius: 7, border: "1px solid #1E293B", background: "transparent", color: "#94A3B8", fontSize: 11, cursor: "pointer" }}>Card</button>
                                <button onClick={() => { setModalErr(""); setNp(playerToNp(p)); setPlayerModal({ mode: "edit", playerId: p.id }); }} style={{ padding: "5px 10px", borderRadius: 7, border: "1px solid #1E293B", background: "transparent", color: "#94A3B8", fontSize: 11, cursor: "pointer" }}>Edit</button>
                                <button onClick={() => removePlayer(p)} style={{ padding: "5px 8px", borderRadius: 7, border: "none", background: "#EF444422", color: "#EF4444", fontSize: 11, cursor: "pointer" }}>✕</button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )
                }
              </div>
            )}

            {/* ── Analytics Tab ── */}
            {detailTab === "stats" && (() => {
              const a = teamAnalytics(selSquad);
              return (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {!a
                    ? <div style={{ ...card, textAlign: "center", padding: "40px 0", color: "#475569" }}>No players yet — add players to see analytics.</div>
                    : (
                      <>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
                          {[
                            { l: "Avg Batting Avg", v: a.avgBatAvg, c: "#FF6B00", icon: "🏏" },
                            { l: "Avg Strike Rate", v: a.avgSR, c: "#3B82F6", icon: "⚡" },
                            { l: "Avg Economy", v: a.avgEconomy, c: "#EF4444", icon: "🎳" },
                            { l: "Total Wickets", v: a.totalWickets, c: "#F59E0B", icon: "💥" },
                            { l: "Total Runs", v: a.totalRuns, c: "#10B981", icon: "🏆" },
                            { l: "Total Sixes", v: a.totalSixes, c: "#6366F1", icon: "6️⃣" },
                          ].map(s => (
                            <div key={s.l} style={{ ...card, borderTop: `3px solid ${s.c}`, padding: "16px" }}>
                              <div style={{ fontSize: 20, marginBottom: 6 }}>{s.icon}</div>
                              <div style={{ fontSize: 24, fontWeight: 800, color: s.c }}>{s.v}</div>
                              <div style={{ fontSize: 11, color: "#64748B", marginTop: 3 }}>{s.l}</div>
                            </div>
                          ))}
                        </div>
                        <div style={card}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: "#F1F5F9", marginBottom: 14 }}>Squad Composition</div>
                          {[
                            { role: "Batsman", count: selSquad.filter(p => p.role === "Batsman").length, color: "#3B82F6", ideal: 4 },
                            { role: "Bowler", count: selSquad.filter(p => p.role === "Bowler").length, color: "#EF4444", ideal: 4 },
                            { role: "All-rounder", count: selSquad.filter(p => p.role === "All-rounder").length, color: "#FF6B00", ideal: 3 },
                            { role: "Wicket-keeper", count: selSquad.filter(p => p.role === "Wicket-keeper").length, color: "#10B981", ideal: 1 },
                          ].map(r => (
                            <div key={r.role} style={{ marginBottom: 12 }}>
                              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                                <span style={{ fontSize: 12, color: "#94A3B8" }}>{roleEmoji(r.role)} {r.role}</span>
                                <span style={{ fontSize: 12, fontWeight: 700, color: r.color }}>{r.count}/{r.ideal} ideal</span>
                              </div>
                              <div style={{ height: 8, borderRadius: 4, background: "#1E293B", overflow: "hidden" }}>
                                <div style={{ height: "100%", width: `${Math.min((r.count / r.ideal) * 100, 100)}%`, background: r.color, borderRadius: 4, transition: "width .5s" }} />
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    )
                  }
                </div>
              );
            })()}

            {/* ── Match History Tab (real results) ── */}
            {detailTab === "history" && (() => {
              const hist = teamHistory(selTeam.name);
              return (
                <div style={card}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#F1F5F9", marginBottom: 16 }}>Match Results</div>
                  {hist.length === 0
                    ? <div style={{ textAlign: "center", padding: "36px 0", color: "#475569", fontSize: 13 }}>No completed matches yet — results will appear here automatically once matches are played.</div>
                    : (
                      <>
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                          {hist.map((m, i) => (
                            <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", background: "#060B18", borderRadius: 12, border: `1px solid ${resColor(m.result)}30` }}>
                              <div style={{ width: 40, height: 40, borderRadius: 10, background: resColor(m.result) + "22", border: `2px solid ${resColor(m.result)}44`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                <span style={{ fontSize: m.result === "NR" ? 12 : 16, fontWeight: 900, color: resColor(m.result) }}>{m.result}</span>
                              </div>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 13, fontWeight: 700, color: "#F1F5F9" }}>vs {m.opponent}</div>
                                {m.desc && <div style={{ fontSize: 11, color: "#475569", marginTop: 2 }}>{m.desc}</div>}
                              </div>
                              <div style={{ textAlign: "right" }}>
                                <div style={{ fontSize: 11, color: "#475569" }}>{m.date}</div>
                                <div style={{ fontSize: 11, fontWeight: 700, color: resColor(m.result), marginTop: 2 }}>{m.result === "W" ? "Victory" : m.result === "L" ? "Defeat" : "No Result"}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div style={{ marginTop: 16, padding: "12px 14px", background: "#060B18", borderRadius: 10, border: "1px solid #1E293B" }}>
                          <div style={{ fontSize: 11, color: "#64748B", marginBottom: 8 }}>Form Guide (Last 5)</div>
                          <div style={{ display: "flex", gap: 6 }}>
                            {hist.slice(0, 5).map((m, i) => (
                              <div key={i} style={{ width: 32, height: 32, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: resColor(m.result) + "30", border: `2px solid ${resColor(m.result)}60` }}>
                                <span style={{ fontSize: 11, fontWeight: 900, color: resColor(m.result) }}>{m.result}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                </div>
              );
            })()}
          </div>
        )}
      </div>

      {/* ── Add Team Modal ── */}
      {showAddTeam && modalShell(440, (
        <>
          <div style={{ fontSize: 18, fontWeight: 800, color: "#F1F5F9", marginBottom: 18 }}>➕ Add New Team</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div><label style={lbl}>Team Name *</label><input value={newTeam.name} onChange={e => setNewTeam(p => ({ ...p, name: e.target.value }))} style={inp} placeholder="e.g. Pune Panthers" /></div>
            <div><label style={lbl}>City</label><input value={newTeam.city} onChange={e => setNewTeam(p => ({ ...p, city: e.target.value }))} style={inp} placeholder="e.g. Pune" /></div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div><label style={lbl}>Primary Color</label><input type="color" value={newTeam.color} onChange={e => setNewTeam(p => ({ ...p, color: e.target.value }))} style={{ ...inp, height: 42, padding: 4 }} /></div>
              <div><label style={lbl}>Secondary Color</label><input type="color" value={newTeam.secondColor} onChange={e => setNewTeam(p => ({ ...p, secondColor: e.target.value }))} style={{ ...inp, height: 42, padding: 4 }} /></div>
            </div>
            <ImageUpload label="Team Logo" value={newTeam.logoUrl} onChange={url => setNewTeam(p => ({ ...p, logoUrl: url }))} />
          </div>
          {modalErr && <div style={{ marginTop: 12, padding: "8px 12px", borderRadius: 8, background: "#EF444422", color: "#F87171", fontSize: 12, fontWeight: 600 }}>⚠ {modalErr}</div>}
          <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
            <button onClick={() => setShowAddTeam(false)} style={{ flex: 1, padding: "11px 0", borderRadius: 10, border: "1px solid #1E293B", background: "transparent", color: "#64748B", fontSize: 13, cursor: "pointer" }}>Cancel</button>
            <button disabled={modalBusy} onClick={submitAddTeam} style={{ flex: 1, padding: "11px 0", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#FF6B00,#FF8C40)", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", opacity: modalBusy ? .6 : 1 }}>{modalBusy ? "Creating…" : "Create Team"}</button>
          </div>
        </>
      ))}

      {/* ── Edit Team Modal ── */}
      {editTeam && modalShell(480, (
        <>
          <div style={{ fontSize: 18, fontWeight: 800, color: "#F1F5F9", marginBottom: 18 }}>✏️ Edit Team — {editTeam.name}</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {[{ l: "Team Name *", k: "name", span: true }, { l: "City", k: "city" }, { l: "Home Ground", k: "homeGround" }, { l: "Captain", k: "captain" }, { l: "Coach", k: "coach" }, { l: "Owner / Sponsor", k: "owner" }, { l: "Titles Won", k: "titlesWon" }].map(f => (
              <div key={f.k} style={{ gridColumn: (f as any).span ? "1/-1" : "auto" }}>
                <label style={lbl}>{f.l}</label>
                <input value={(editTeam as any)[f.k]} onChange={e => setEditTeam(p => p ? { ...p, [f.k]: e.target.value } : p)} style={inp} />
              </div>
            ))}
            <div><label style={lbl}>Primary Color</label><input type="color" value={editTeam.color} onChange={e => setEditTeam(p => p ? { ...p, color: e.target.value } : p)} style={{ ...inp, height: 42, padding: 4 }} /></div>
            <div><label style={lbl}>Secondary Color</label><input type="color" value={editTeam.secondColor} onChange={e => setEditTeam(p => p ? { ...p, secondColor: e.target.value } : p)} style={{ ...inp, height: 42, padding: 4 }} /></div>
            <div style={{ gridColumn: "1/-1" }}>
              <ImageUpload label="Team Logo" value={editTeam.logoUrl} onChange={url => setEditTeam(p => p ? { ...p, logoUrl: url } : p)} />
            </div>
          </div>
          {modalErr && <div style={{ marginTop: 12, padding: "8px 12px", borderRadius: 8, background: "#EF444422", color: "#F87171", fontSize: 12, fontWeight: 600 }}>⚠ {modalErr}</div>}
          <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
            <button onClick={submitDeleteTeam} disabled={modalBusy} style={{ padding: "11px 16px", borderRadius: 10, border: "none", background: "#EF444422", color: "#EF4444", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>🗑 Delete</button>
            <button onClick={() => setEditTeam(null)} style={{ flex: 1, padding: "11px 0", borderRadius: 10, border: "1px solid #1E293B", background: "transparent", color: "#64748B", fontSize: 13, cursor: "pointer" }}>Cancel</button>
            <button disabled={modalBusy} onClick={submitEditTeam} style={{ flex: 1, padding: "11px 0", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#FF6B00,#FF8C40)", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", opacity: modalBusy ? .6 : 1 }}>{modalBusy ? "Saving…" : "Save Changes"}</button>
          </div>
        </>
      ))}

      {/* ── Add / Edit Player Modal ── */}
      {playerModal && selTeam && modalShell(560, (
        <>
          <div style={{ fontSize: 18, fontWeight: 800, color: "#F1F5F9", marginBottom: 4 }}>{playerModal.mode === "add" ? "➕ Add Player" : "✏️ Edit Player"} — {selTeam.name}</div>
          <div style={{ fontSize: 11, color: "#64748B", marginBottom: 16 }}>Player will appear on the team's public page immediately after saving.</div>
          {PlayerFormFields}
          {modalErr && <div style={{ marginTop: 12, padding: "8px 12px", borderRadius: 8, background: "#EF444422", color: "#F87171", fontSize: 12, fontWeight: 600 }}>⚠ {modalErr}</div>}
          <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
            <button onClick={() => { setPlayerModal(null); setNp(EMPTY_NP); }} style={{ flex: 1, padding: "11px 0", borderRadius: 10, border: "1px solid #1E293B", background: "transparent", color: "#64748B", fontSize: 13, cursor: "pointer" }}>Cancel</button>
            <button disabled={modalBusy} onClick={submitPlayer} style={{ flex: 1, padding: "11px 0", borderRadius: 10, border: "none", background: `linear-gradient(135deg,${selTeam.color},${selTeam.secondColor})`, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", opacity: modalBusy ? .6 : 1 }}>{modalBusy ? "Saving…" : playerModal.mode === "add" ? "Add Player" : "Save Changes"}</button>
          </div>
        </>
      ))}

      {/* ── Player Card Modal ── */}
      {viewPlayer && (() => {
        const s = ls(viewPlayer);
        const tColor = selTeam?.color || "#FF6B00";
        return modalShell(420, (
          <>
            <div style={{ textAlign: "center", marginBottom: 16 }}>
              <Avatar url={viewPlayer.photoUrl} name={viewPlayer.name} size={84} color={roleColor(viewPlayer.role)} />
              <div style={{ fontSize: 19, fontWeight: 900, color: "#F1F5F9", marginTop: 10 }}>
                {viewPlayer.name} {viewPlayer.isCaptain && "👑"}{viewPlayer.isViceCaptain && " 🏅"}
              </div>
              <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
                <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 6, background: roleColor(viewPlayer.role) + "22", color: roleColor(viewPlayer.role), fontWeight: 700 }}>{roleEmoji(viewPlayer.role)} {viewPlayer.role}</span>
                {viewPlayer.jerseyNo && <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 6, background: "#1E293B", color: "#94A3B8" }}>#{viewPlayer.jerseyNo}</span>}
                {viewPlayer.auctionPrice && <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 6, background: "#E8B23D22", color: "#E8B23D", fontWeight: 700 }}>🏷 {viewPlayer.auctionPrice}</span>}
              </div>
              <div style={{ fontSize: 11, color: "#475569", marginTop: 6 }}>
                {[viewPlayer.state, viewPlayer.age ? `${viewPlayer.age}y` : "", viewPlayer.battingStyle, viewPlayer.bowlingStyle].filter(Boolean).join(" · ")}
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, marginBottom: 14 }}>
              {[
                { l: "Mat",  v: s.matches, c: "#94A3B8" },
                { l: "Runs", v: s.runs,    c: "#FF6B00" },
                { l: "Avg",  v: s.avg,     c: "#F59E0B" },
                { l: "SR",   v: s.sr,      c: "#3B82F6" },
                { l: "50s",  v: s.fifties, c: "#10B981" },
                { l: "100s", v: s.centuries, c: "#FFD700" },
                { l: "Wkts", v: s.wickets, c: "#EF4444" },
                { l: "Eco",  v: s.economy, c: "#64748B" },
              ].map(x => (
                <div key={x.l} style={{ textAlign: "center", padding: "10px 6px", background: "#060B18", borderRadius: 10, border: "1px solid #1E293B" }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: x.c }}>{x.v || 0}</div>
                  <div style={{ fontSize: 9, color: "#475569", marginTop: 2 }}>{x.l}</div>
                </div>
              ))}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
              {[{ l: "Best Batting", v: s.bestBat, c: "#FF6B00" }, { l: "Best Bowling", v: s.bestBowl, c: "#EF4444" }].map(x => (
                <div key={x.l} style={{ padding: "10px 12px", background: "#060B18", borderRadius: 10, border: `1px solid ${x.c}33` }}>
                  <div style={{ fontSize: 10, color: "#475569", fontWeight: 700, marginBottom: 3 }}>{x.l}</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: x.c }}>{x.v || "—"}</div>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button onClick={() => setViewPlayer(null)} style={{ padding: "8px 18px", borderRadius: 8, border: `1px solid ${tColor}44`, background: tColor + "18", color: tColor, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Close</button>
            </div>
          </>
        ));
      })()}

      {/* ── Compare Modal ── */}
      {showCompare && (() => {
        const tA = teams.find(t => t.id === compareA) || null;
        const tB = teams.find(t => t.id === compareB) || null;
        const aA = tA ? teamAnalytics(squads[tA.id] || []) : null;
        const aB = tB ? teamAnalytics(squads[tB.id] || []) : null;
        const pA = tA ? pts(tA.name) : null;
        const pB = tB ? pts(tB.name) : null;
        return modalShell(560, (
          <>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#F1F5F9", marginBottom: 18 }}>⚔ Compare Teams</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 18 }}>
              {[["A", compareA, setCompareA], ["B", compareB, setCompareB]].map(([tag, val, set]: any) => (
                <div key={tag}>
                  <label style={lbl}>Team {tag}</label>
                  <select value={val} onChange={e => { set(e.target.value); const t = teams.find(x => x.id === e.target.value); if (t) loadSquad(t); }} style={inp}>
                    <option value="">— Select —</option>
                    {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
              ))}
            </div>
            {tA && tB ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 10, alignItems: "center", marginBottom: 8 }}>
                  <div style={{ textAlign: "center" }}><TeamLogo url={tA.logoUrl} name={tA.name} size={48} color={tA.color} /><div style={{ fontSize: 12, fontWeight: 700, color: tA.color, marginTop: 4 }}>{tA.name}</div></div>
                  <div style={{ fontSize: 16, fontWeight: 900, color: "#334155" }}>VS</div>
                  <div style={{ textAlign: "center" }}><TeamLogo url={tB.logoUrl} name={tB.name} size={48} color={tB.color} /><div style={{ fontSize: 12, fontWeight: 700, color: tB.color, marginTop: 4 }}>{tB.name}</div></div>
                </div>
                {[
                  ["Points", pA!.points, pB!.points],
                  ["Wins", pA!.won, pB!.won],
                  ["Squad Size", (squads[tA.id] || []).length, (squads[tB.id] || []).length],
                  ["Total Runs (last szn)", aA?.totalRuns ?? 0, aB?.totalRuns ?? 0],
                  ["Total Wickets (last szn)", aA?.totalWickets ?? 0, aB?.totalWickets ?? 0],
                  ["Total Sixes (last szn)", aA?.totalSixes ?? 0, aB?.totalSixes ?? 0],
                ].map(([l, a, b]: any) => (
                  <div key={l} style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 10, padding: "10px 12px", background: "#060B18", borderRadius: 10, border: "1px solid #1E293B", alignItems: "center" }}>
                    <div style={{ textAlign: "center", fontSize: 16, fontWeight: 800, color: a >= b ? "#10B981" : "#64748B" }}>{a}</div>
                    <div style={{ fontSize: 10, color: "#475569", fontWeight: 700, textTransform: "uppercase", minWidth: 130, textAlign: "center" }}>{l}</div>
                    <div style={{ textAlign: "center", fontSize: 16, fontWeight: 800, color: b >= a ? "#10B981" : "#64748B" }}>{b}</div>
                  </div>
                ))}
              </div>
            ) : <div style={{ textAlign: "center", padding: "24px 0", color: "#475569", fontSize: 12 }}>Select two teams to compare.</div>}
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16 }}>
              <button onClick={() => setShowCompare(false)} style={{ padding: "9px 20px", borderRadius: 8, border: "1px solid #1E293B", background: "transparent", color: "#64748B", fontSize: 12, cursor: "pointer" }}>Close</button>
            </div>
          </>
        ));
      })()}
    </div>
  );
}

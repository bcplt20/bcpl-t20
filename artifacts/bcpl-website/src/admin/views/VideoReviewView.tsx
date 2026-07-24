import { useState, useEffect, useCallback, useRef } from "react";
import { adminGetVideos, adminReviewVideo, adminUpdatePhase1Status, adminSaveScore, adminGetVideoUrl } from "../../lib/api";
import { SampleVideosCard } from "./SampleVideosCard";

type Score = {
  roleSkill: number;
  technique: number;
  execution: number;
  gameAwareness: number;
  movement: number;
  videoEvidence: number;
  total: number;
  selectorNote: string | null;
};

type Video = {
  id: string;
  registrationId: string;
  s3Key: string | null;
  s3Url: string | null;
  durationSeconds: number | null;
  submittedAt: string;
  status: string;
  player: string;
  phone: string;
  role: string;
  trialCity: string;
  phase1Status: string;
  p1Status?: string;
  score: Score | null;
};

/* BCPL 100-point scoring framework (maxima mirror the API) */
const CRITERIA = [
  { key: "roleSkill",     label: "Role Skill",          max: 35 },
  { key: "technique",     label: "Technique & Basics",  max: 25 },
  { key: "execution",     label: "Control & Execution", max: 15 },
  { key: "gameAwareness", label: "Game Awareness",      max: 10 },
  { key: "movement",      label: "Athletic Movement",   max: 10 },
  { key: "videoEvidence", label: "Video Quality",       max: 5  },
] as const;
type CritKey = typeof CRITERIA[number]["key"];

const ROLE_LABEL: Record<string, string> = {
  bat: "Bat", bowl: "Bowl", wk: "WK", ar: "AR",
};

const statusColor = (s: string) =>
  s === "reviewed" ? "#10B981" : "#F59E0B";

function fmtDur(sec: number | null) {
  if (!sec) return "—";
  const m = Math.floor(sec / 60), s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function VideoReviewView({ refreshTick = 0 }: { refreshTick?: number } = {}) {
  const [videos, setVideos]     = useState<Video[]>([]);
  const [filter, setFilter]     = useState("all");
  const [loading, setLoading]   = useState(true);
  const [err, setErr]           = useState("");
  const [sel, setSel]           = useState<Video | null>(null);
  const [acting, setActing]     = useState<string | null>(null);
  // Presigned playback URLs expire (~15 min). Hold a freshly-minted URL for the
  // open video and refetch it on demand (open) and on a <video> load error.
  const [playUrl, setPlayUrl]   = useState<string | null>(null);
  const refreshedRef            = useRef<string | null>(null);

  const refreshPlayUrl = useCallback(async (id: string) => {
    try {
      const { url } = await adminGetVideoUrl(id);
      setPlayUrl(url);
    } catch { /* keep the last URL; the error card will still show */ }
  }, []);

  // Whenever the selected video changes, mint a fresh URL right before playback.
  useEffect(() => {
    if (!sel) { setPlayUrl(null); refreshedRef.current = null; return; }
    if (refreshedRef.current === sel.id) return;
    refreshedRef.current = sel.id;
    setPlayUrl(sel.s3Url ?? null);
    refreshPlayUrl(sel.id);
  }, [sel, refreshPlayUrl]);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setErr("");
    try {
      const { videos: v } = await adminGetVideos(filter === "all" ? undefined : filter);
      setVideos(v);
      // Keep the open detail panel in sync with fresh data (match by id).
      // If the selected video is no longer in the filtered list, keep showing the last snapshot.
      setSel(prev => {
        if (!prev) return prev;
        const fresh = v.find((x: Video) => x.id === prev.id);
        return fresh ?? prev;
      });
    } catch (e: any) {
      setErr(e.message);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  /* Auto-refresh (AdminShell tick): refetch in place — no spinner, no remount */
  const loadRef = useRef(load);
  loadRef.current = load;
  useEffect(() => { if (refreshTick > 0) loadRef.current(true); }, [refreshTick]);

  const markReviewed = async (id: string) => {
    setActing(id);
    try {
      await adminReviewVideo(id, "reviewed");
      setVideos(prev => prev.map(v => v.id === id ? { ...v, status: "reviewed" } : v));
      if (sel?.id === id) setSel(s => s ? { ...s, status: "reviewed" } : s);
    } catch (e: any) {
      alert("Error: " + e.message);
    } finally {
      setActing(null);
    }
  };

  const setP1Status = async (video: Video, status: "selected" | "rejected") => {
    setActing(video.id + "_" + status);
    try {
      await adminUpdatePhase1Status(video.registrationId, status);
      // Also mark reviewed if not already
      if (video.status !== "reviewed") {
        await adminReviewVideo(video.id, "reviewed");
        setVideos(prev => prev.map(v => v.id === video.id ? { ...v, status: "reviewed", p1Status: status } : v));
        if (sel?.id === video.id) setSel(s => s ? { ...s, status: "reviewed", p1Status: status } : s);
      } else {
        setVideos(prev => prev.map(v => v.id === video.id ? { ...v, p1Status: status } : v));
        if (sel?.id === video.id) setSel(s => s ? { ...s, p1Status: status } : s);
      }
      alert(`✅ Player ${status === "selected" ? "SELECTED" : "REJECTED"} — Email & SMS sent automatically.`);
    } catch (e: any) {
      alert("Error: " + e.message);
    } finally {
      setActing(null);
    }
  };

  /* Score saved → update the list + open panel in place */
  const applyScore = (video: Video, score: Score) => {
    setVideos(prev => prev.map(x => x.registrationId === video.registrationId ? { ...x, score } : x));
    setSel(s => s && s.registrationId === video.registrationId ? { ...s, score } : s);
  };

  const pending   = videos.filter(v => v.status === "submitted").length;
  const reviewed  = videos.filter(v => v.status === "reviewed").length;

  const card: React.CSSProperties = {
    background:"linear-gradient(135deg,#0D1526,#0A1020)",
    border:"1px solid #1E293B", borderRadius:16, padding:20,
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:10 }}>
        <div>
          <div style={{ fontSize:20, fontWeight:800, color:"#F1F5F9" }}>Video Review Panel</div>
          <div style={{ fontSize:12, color:"#64748B", marginTop:2 }}>Review Phase 1 trial videos submitted by players</div>
        </div>
        <div style={{ display:"flex", gap:8, alignItems:"center" }}>
          {pending > 0 && (
            <span style={{ fontSize:12, fontWeight:700, color:"#F59E0B", background:"#F59E0B15", padding:"6px 12px", borderRadius:8, border:"1px solid #F59E0B30" }}>
              {pending} Pending
            </span>
          )}
          <button onClick={() => load()} style={{ padding:"9px 16px", borderRadius:9, border:"1px solid #1E293B", background:"transparent", color:"#64748B", fontSize:12, fontWeight:700, cursor:"pointer" }}>
            ↺ Refresh
          </button>
        </div>
      </div>

      {/* Sample videos shown to players (admin-managed) */}
      <SampleVideosCard />

      {err && (
        <div style={{ padding:14, borderRadius:10, background:"#EF444415", border:"1px solid #EF444440", color:"#EF4444", fontSize:12 }}>
          ⚠ {err} — <button onClick={() => load()} style={{ background:"none", border:"none", color:"#EF4444", cursor:"pointer", fontWeight:700, fontSize:12 }}>Retry</button>
        </div>
      )}

      {/* Stats */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12 }}>
        {[
          { label:"Total Videos",   value: videos.length, color:"#6366F1" },
          { label:"Pending Review", value: pending,        color:"#F59E0B" },
          { label:"Reviewed",       value: reviewed,       color:"#10B981" },
        ].map(s => (
          <div key={s.label} style={{ ...card, borderTop:`3px solid ${s.color}` }}>
            <div style={{ fontSize:24, fontWeight:800, color:s.color }}>{loading ? "…" : s.value}</div>
            <div style={{ fontSize:11, color:"#64748B", marginTop:5 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div style={{ display:"flex", gap:6 }}>
        {[
          { id:"all",       label:"All" },
          { id:"submitted", label:"Pending" },
          { id:"reviewed",  label:"Reviewed" },
        ].map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)}
            style={{ padding:"8px 18px", borderRadius:9, border:`1px solid ${filter===f.id?"#FF6B00":"#1E293B"}`, background:filter===f.id?"#FF6B0022":"transparent", color:filter===f.id?"#FF6B00":"#64748B", fontSize:12, fontWeight:700, cursor:"pointer" }}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Main content */}
      {loading ? (
        <div style={{ ...card, padding:60, textAlign:"center", color:"#334155", fontSize:14 }}>Loading videos…</div>
      ) : videos.length === 0 ? (
        <div style={{ ...card, padding:80, textAlign:"center" }}>
          <div style={{ fontSize:32, marginBottom:12 }}>🎬</div>
          <div style={{ fontSize:15, fontWeight:700, color:"#334155" }}>No videos yet</div>
          <div style={{ fontSize:12, color:"#1E293B", marginTop:6 }}>
            Videos appear here once Phase 1 players upload their trial footage.
          </div>
        </div>
      ) : (
        <div style={{ display:"grid", gridTemplateColumns: sel ? "1fr 380px" : "repeat(auto-fill,minmax(260px,1fr))", gap:12 }}>

          {/* Video grid */}
          <div style={{ display:"contents" }}>
            {videos.map(v => (
              <div key={v.id}
                onClick={() => setSel(prev => prev?.id === v.id ? null : v)}
                style={{ ...card, cursor:"pointer", border:`1px solid ${sel?.id===v.id?"#FF6B0060":"#1E293B"}`, padding:16 }}>
                {/* Thumbnail / play area */}
                <div style={{ height:110, background:"linear-gradient(135deg,#1E293B,#0F172A)", borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center", marginBottom:12, position:"relative", overflow:"hidden" }}>
                  <div style={{ width:44, height:44, borderRadius:"50%", background:"#FF6B0060", display:"flex", alignItems:"center", justifyContent:"center", fontSize:20 }}>▶</div>
                  {v.durationSeconds && (
                    <div style={{ position:"absolute", bottom:7, right:8, background:"#00000090", borderRadius:4, padding:"2px 6px", fontSize:10, color:"#fff" }}>
                      {fmtDur(v.durationSeconds)}
                    </div>
                  )}
                  <div style={{ position:"absolute", top:7, left:8, background:`${statusColor(v.status)}22`, borderRadius:4, padding:"2px 7px", fontSize:9, fontWeight:800, color:statusColor(v.status), border:`1px solid ${statusColor(v.status)}44` }}>
                    {v.status === "reviewed" ? "Reviewed" : "Pending"}
                  </div>
                  {v.score && (
                    <div style={{ position:"absolute", top:7, right:8, background:"#E8B23D22", borderRadius:4, padding:"2px 7px", fontSize:9, fontWeight:800, color:"#E8B23D", border:"1px solid #E8B23D44" }}>
                      ★ {v.score.total}/100
                    </div>
                  )}
                </div>
                <div style={{ fontSize:13, fontWeight:700, color:"#F1F5F9" }}>{v.player}</div>
                <div style={{ fontSize:11, color:"#475569", marginTop:2 }}>
                  {ROLE_LABEL[v.role] ?? v.role} · {v.trialCity || "—"}
                </div>
                <div style={{ fontSize:10, color:"#334155", marginTop:4 }}>
                  {v.submittedAt ? new Date(v.submittedAt).toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"numeric" }) : "—"}
                </div>
                {v.status === "submitted" && (
                  <button
                    disabled={acting === v.id}
                    onClick={e => { e.stopPropagation(); markReviewed(v.id); }}
                    style={{ marginTop:10, width:"100%", padding:"8px", borderRadius:8, border:"none", background:"linear-gradient(135deg,#FF6B00,#FF8C40)", color:"#fff", fontSize:11, fontWeight:700, cursor:"pointer", opacity:acting===v.id?0.5:1 }}>
                    Mark Reviewed
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Detail panel */}
          {sel && (
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              <div style={{ ...card }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:16 }}>
                  <div>
                    <div style={{ fontSize:14, fontWeight:700, color:"#F1F5F9" }}>{sel.player}</div>
                    <div style={{ fontSize:11, color:"#475569", marginTop:2 }}>
                      {ROLE_LABEL[sel.role] ?? sel.role} · {sel.trialCity || "—"}
                    </div>
                  </div>
                  <button onClick={() => setSel(null)} style={{ background:"none", border:"none", color:"#334155", cursor:"pointer", fontSize:18, padding:4 }}>×</button>
                </div>

                {/* Video player — presigned URL, refetched on expiry/error */}
                {(playUrl ?? sel.s3Url) ? (
                  <video
                    key={playUrl ?? sel.s3Url ?? ""}
                    src={playUrl ?? sel.s3Url ?? ""}
                    controls
                    onError={() => refreshPlayUrl(sel.id)}
                    style={{ width:"100%", borderRadius:10, background:"#0F172A", marginBottom:16, maxHeight:200 }}
                  />
                ) : (
                  <div style={{ height:140, background:"linear-gradient(135deg,#1E293B,#0F172A)", borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center", marginBottom:16 }}>
                    <div style={{ textAlign:"center" }}>
                      <div style={{ width:52, height:52, borderRadius:"50%", background:"#FF6B0060", display:"flex", alignItems:"center", justifyContent:"center", fontSize:24, margin:"0 auto 8px" }}>▶</div>
                      <div style={{ fontSize:11, color:"#64748B" }}>No video URL available</div>
                    </div>
                  </div>
                )}

                {/* Details */}
                <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:16 }}>
                  {[
                    { label:"Phone",     value: sel.phone || "—" },
                    { label:"Duration",  value: fmtDur(sel.durationSeconds) },
                    { label:"Submitted", value: sel.submittedAt ? new Date(sel.submittedAt).toLocaleString("en-IN") : "—" },
                    { label:"Status",    value: sel.status === "reviewed" ? "✓ Reviewed" : "⏳ Pending" },
                    { label:"Decision",  value: (sel.p1Status ?? sel.phase1Status) === "selected" ? "✓ Selected" : (sel.p1Status ?? sel.phase1Status) === "rejected" ? "✗ Rejected" : "— Not decided" },
                  ].map(item => (
                    <div key={item.label} style={{ display:"flex", justifyContent:"space-between", padding:"6px 0", borderBottom:"1px solid #0F172A" }}>
                      <span style={{ fontSize:11, color:"#475569", fontWeight:600 }}>{item.label}</span>
                      <span style={{ fontSize:11, color:"#94A3B8" }}>{item.value}</span>
                    </div>
                  ))}
                </div>

                {/* Open + Mark Reviewed */}
                <div style={{ display:"flex", gap:8, marginBottom:8 }}>
                  {(playUrl ?? sel.s3Url) && (
                    <a href={(playUrl ?? sel.s3Url)!} target="_blank" rel="noreferrer"
                      style={{ flex:1, padding:10, borderRadius:10, border:"1px solid #6366F140", background:"#6366F120", color:"#6366F1", fontWeight:800, fontSize:12, cursor:"pointer", textAlign:"center", textDecoration:"none" }}>
                      ↗ Open Video
                    </a>
                  )}
                  {sel.status === "submitted" && (
                    <button
                      disabled={!!acting}
                      onClick={() => markReviewed(sel.id)}
                      style={{ flex:1, padding:10, borderRadius:10, border:"1px solid #FF6B0060", background:"#FF6B0020", color:"#FF6B00", fontWeight:800, fontSize:12, cursor:"pointer", opacity:acting?0.5:1 }}>
                      👁 Mark Reviewed
                    </button>
                  )}
                  {sel.status === "reviewed" && (
                    <div style={{ flex:1, padding:10, borderRadius:10, border:"1px solid #10B98140", background:"#10B98120", color:"#10B981", fontWeight:800, fontSize:12, textAlign:"center" }}>
                      ✓ Reviewed
                    </div>
                  )}
                </div>

                {/* 100-point scoring — BCPL Player Journey */}
                <ScoreEditor key={sel.registrationId} video={sel} onSaved={applyScore} />

                {/* Select / Reject — triggers email + SMS */}
                <div style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:10, padding:12 }}>
                  <div style={{ fontSize:10, fontWeight:700, color:"#475569", letterSpacing:".08em", textTransform:"uppercase", marginBottom:8 }}>Scout Decision — sends Email + SMS</div>
                  <div style={{ display:"flex", gap:8 }}>
                    <button
                      disabled={!!acting}
                      onClick={() => setP1Status(sel, "selected")}
                      style={{ flex:1, padding:"10px 8px", borderRadius:9, border:"1px solid #22C55E60", background:"#22C55E18", color:"#22C55E", fontWeight:900, fontSize:13, cursor:"pointer", opacity:acting?0.5:1 }}>
                      ✓ SELECT
                    </button>
                    <button
                      disabled={!!acting}
                      onClick={() => setP1Status(sel, "rejected")}
                      style={{ flex:1, padding:"10px 8px", borderRadius:9, border:"1px solid #EF444460", background:"#EF444418", color:"#EF4444", fontWeight:900, fontSize:13, cursor:"pointer", opacity:acting?0.5:1 }}>
                      ✗ REJECT
                    </button>
                  </div>
                  <div style={{ fontSize:10, color:"#334155", marginTop:7 }}>
                    ⚡ Instant Email + SMS notification to player on decision
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {!loading && videos.length > 0 && (
        <div style={{ fontSize:11, color:"#334155", textAlign:"right" }}>
          {videos.length} video{videos.length !== 1 ? "s" : ""} total
        </div>
      )}
    </div>
  );
}

/* ── 100-point score editor (per selected video) ─────────────────────
   Player sees this breakdown on their result page AFTER the scout
   decision (SELECT / REJECT) is announced. Save score first, then decide. */
function ScoreEditor({ video, onSaved }: { video: Video; onSaved: (v: Video, s: Score) => void }) {
  type Draft = Record<CritKey, number | "">;
  const init = (): Draft => ({
    roleSkill:     video.score ? video.score.roleSkill     : "",
    technique:     video.score ? video.score.technique     : "",
    execution:     video.score ? video.score.execution     : "",
    gameAwareness: video.score ? video.score.gameAwareness : "",
    movement:      video.score ? video.score.movement      : "",
    videoEvidence: video.score ? video.score.videoEvidence : "",
  });
  const [draft, setDraft]   = useState<Draft>(init);
  const [note, setNote]     = useState(video.score?.selectorNote ?? "");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg]       = useState("");

  const total    = CRITERIA.reduce((s, c) => s + (draft[c.key] === "" ? 0 : Number(draft[c.key])), 0);
  const complete = CRITERIA.every(c => draft[c.key] !== "");

  const setVal = (key: CritKey, max: number, raw: string) => {
    if (raw === "") { setDraft(d => ({ ...d, [key]: "" })); return; }
    const n = Math.floor(Number(raw));
    if (Number.isNaN(n)) return;
    setDraft(d => ({ ...d, [key]: Math.max(0, Math.min(max, n)) }));
  };

  const save = async () => {
    if (!complete) { setMsg("⚠ Fill all 6 criteria before saving"); return; }
    setSaving(true); setMsg("");
    try {
      const res = await adminSaveScore(video.registrationId, {
        roleSkill:     Number(draft.roleSkill),
        technique:     Number(draft.technique),
        execution:     Number(draft.execution),
        gameAwareness: Number(draft.gameAwareness),
        movement:      Number(draft.movement),
        videoEvidence: Number(draft.videoEvidence),
        selectorNote:  note.trim() || null,
      });
      onSaved(video, { ...res.score, selectorNote: note.trim() || null });
      setMsg("✓ Score saved — " + res.score.total + "/100");
    } catch (e: any) {
      setMsg("✗ " + e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ background:"rgba(232,178,61,0.04)", border:"1px solid rgba(232,178,61,0.25)", borderRadius:10, padding:12, marginBottom:8 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
        <div style={{ fontSize:10, fontWeight:700, color:"#E8B23D", letterSpacing:".08em", textTransform:"uppercase" }}>
          ★ BCPL Score — 100-point system
        </div>
        <div style={{ fontSize:13, fontWeight:900, color: complete ? "#E8B23D" : "#475569", fontFamily:"Montserrat,sans-serif" }}>
          {total}/100
        </div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:10 }}>
        {CRITERIA.map(c => (
          <div key={c.key}>
            <div style={{ fontSize:9.5, color:"#64748B", fontWeight:700, marginBottom:3 }}>
              {c.label} <span style={{ color:"#334155" }}>/{c.max}</span>
            </div>
            <input
              type="number" min={0} max={c.max} inputMode="numeric"
              value={draft[c.key]}
              onChange={e => setVal(c.key, c.max, e.target.value)}
              placeholder={"0–" + c.max}
              style={{ width:"100%", padding:"8px 10px", borderRadius:8, border:"1px solid #1E293B", background:"#0F172A", color:"#F1F5F9", fontSize:13, fontWeight:700, outline:"none" }}
            />
          </div>
        ))}
      </div>

      <textarea
        value={note}
        onChange={e => setNote(e.target.value.slice(0, 600))}
        placeholder="Selector's note (optional) — the player will read this on their result page. Honest, respectful feedback only."
        rows={2}
        style={{ width:"100%", padding:"9px 10px", borderRadius:8, border:"1px solid #1E293B", background:"#0F172A", color:"#F1F5F9", fontSize:12, outline:"none", resize:"vertical", marginBottom:8, fontFamily:"inherit" }}
      />

      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
        <button
          disabled={saving || !complete}
          onClick={save}
          style={{ padding:"9px 18px", borderRadius:8, border:"none", background: complete ? "linear-gradient(135deg,#E8B23D,#C4901E)" : "#1E293B", color: complete ? "#081020" : "#475569", fontWeight:900, fontSize:12, cursor: complete ? "pointer" : "not-allowed", opacity: saving ? 0.6 : 1 }}>
          {saving ? "Saving…" : video.score ? "Update Score" : "Save Score"}
        </button>
        {msg && <span style={{ fontSize:11, fontWeight:700, color: msg.startsWith("✓") ? "#10B981" : "#F59E0B" }}>{msg}</span>}
      </div>
      <div style={{ fontSize:9.5, color:"#334155", marginTop:7, lineHeight:1.5 }}>
        Player sees this scorecard (with city rank) after you announce the decision below. No cut-off is shown to players.
      </div>
    </div>
  );
}

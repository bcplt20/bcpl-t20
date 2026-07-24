import { useState, useEffect } from "react";
import { Link } from "wouter";
import { BCPLFooter } from '../components/BCPLFooter';
import { SiteHeader } from '../components/SiteHeader';
import { getMatches, getPointsTable, getScorecard, getTeams } from '../lib/api';
import { useLang } from '../lib/i18n';

/* ─── Helpers ─────────────────────────────────────────── */
const initials = (name: string) =>
  (name || "").split(" ").map(w => w[0]).join("").slice(0, 3).toUpperCase();

/* Team logos may be base64 data URLs, absolute http(s) URLs, or repo-relative
   paths (e.g. bcpl-assets/logos/…). Mirror TeamsPage's asset() so relative
   paths resolve under the app's base path. */
const asset = (url: string) =>
  !url ? "" : url.startsWith("data:") || url.startsWith("http") ? url : import.meta.env.BASE_URL + url.replace(/^\//, "");

/* Normalize a team name for case-insensitive, trim-tolerant matching. */
const normTeam = (name: string) => (name || "").trim().toLowerCase();

const fmtDate = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "";

const fmtOv = (overs: number, balls: number) => `${overs ?? 0}.${balls ?? 0}`;

type UiStatus = "live" | "upcoming" | "completed" | "abandoned";
const uiStatus = (s: string): UiStatus =>
  s === "live" || s === "innings2" ? "live"
  : s === "completed" ? "completed"
  : s === "abandoned" ? "abandoned"
  : "upcoming";

const STATUS_META: Record<UiStatus, { label: string; color: string }> = {
  live:      { label: "LIVE",      color: "#EF4444" },
  upcoming:  { label: "UPCOMING",  color: "#60A5FA" },
  completed: { label: "RESULT",    color: "#22C55E" },
  abandoned: { label: "ABANDONED", color: "#9CA3AF" },
};

/* Circular team badge: shows the team logo when available, keeps the colored
   ring, and falls back to initials when there is no logo or the image fails. */
function TeamBadge({ name, color, logo, size, fontSize }: {
  name: string; color: string; logo?: string; size: number; fontSize: number;
}) {
  const [broken, setBroken] = useState(false);
  const showLogo = Boolean(logo) && !broken;
  return (
    <span style={{
      width: size, height: size, borderRadius: "50%",
      background: showLogo ? "rgba(255,255,255,0.96)" : `${color}22`,
      border: `2px solid ${color}`, display: "inline-flex", alignItems: "center",
      justifyContent: "center", overflow: "hidden", flexShrink: 0,
      fontFamily: "Montserrat, sans-serif", fontWeight: 800, fontSize, color,
    }}>
      {showLogo
        ? <img src={logo} alt={name} onError={() => setBroken(true)}
            style={{ width: "82%", height: "82%", objectFit: "contain" }} />
        : initials(name)}
    </span>
  );
}

export function MatchCenter() {
  const { t } = useLang();
  const [matches, setMatches] = useState<any[]>([]);
  const [points,  setPoints]  = useState<any[]>([]);
  const [teamColors, setTeamColors] = useState<Record<string, string>>({});
  const [teamLogos,  setTeamLogos]  = useState<Record<string, string>>({});
  const [openId,  setOpenId]  = useState<string | null>(null);
  const [cards,   setCards]   = useState<Record<string, any>>({});
  const [loadingCard, setLoadingCard] = useState(false);

  /* Matches + points table (refresh every 30 s so live results stay current) */
  useEffect(() => {
    const load = () => {
      getMatches(5).then(d => setMatches(d.matches ?? [])).catch(() => {});
      getPointsTable(5).then(d => setPoints(d.table ?? [])).catch(() => {});
    };
    load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, []);

  /* Team colors + logos for badges / rows (keyed by normalized team name) */
  useEffect(() => {
    getTeams(5).then(d => {
      const colorMap: Record<string, string> = {};
      const logoMap:  Record<string, string> = {};
      (d.teams ?? []).forEach((t: any) => {
        const key = normTeam(t.name);
        colorMap[key] = t.color;
        if (t.logoUrl) logoMap[key] = asset(t.logoUrl);
      });
      setTeamColors(colorMap);
      setTeamLogos(logoMap);
    }).catch(() => {});
  }, []);

  /* Scorecard for the expanded match (poll every 10 s while it is live) */
  const openStatus = openId ? matches.find(x => x.id === openId)?.status : undefined;
  useEffect(() => {
    if (!openId) return;
    const isLive = openStatus === "live" || openStatus === "innings2";
    let cancelled = false;
    const load = () => {
      setLoadingCard(true);
      getScorecard(openId)
        .then(d => { if (!cancelled) setCards(c => ({ ...c, [openId]: d })); })
        .catch(() => {})
        .finally(() => { if (!cancelled) setLoadingCard(false); });
    };
    load();
    if (!isLive) return () => { cancelled = true; };
    const t = setInterval(load, 10000);
    return () => { cancelled = true; clearInterval(t); };
  }, [openId, openStatus]);  // eslint-disable-line react-hooks/exhaustive-deps

  const color  = (team: string) => teamColors[normTeam(team)] || "#64748B";
  const logoOf = (team: string) => teamLogos[normTeam(team)] || "";

  const order = (s: string) => { const u = uiStatus(s); return u === "live" ? 0 : u === "upcoming" ? 1 : 2; };
  const sorted = [...matches].sort((a, b) => order(a.status) - order(b.status) || (a.matchNo ?? 0) - (b.matchNo ?? 0));

  /* ─── Scorecard panel for one match ─────────────────── */
  const renderScorecard = (matchId: string) => {
    const data = cards[matchId];
    if (!data) return (
      <div style={{ padding: "20px 0", textAlign: "center", color: "rgba(255,255,255,0.4)", fontSize: 13 }}>
        {loadingCard ? "Loading scorecard…" : "Scorecard not available yet."}
      </div>
    );
    const scorecards: any[] = data.scorecards ?? [];
    if (scorecards.length === 0) return (
      <div style={{ padding: "20px 0", textAlign: "center", color: "rgba(255,255,255,0.4)", fontSize: 13 }}>
        Scorecard will appear here once the match begins.
      </div>
    );
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 20, paddingTop: 16 }}>
        {scorecards.map((sc: any, idx: number) => {
          const inn = sc.innings ?? {};
          const bat: any[] = sc.scorecard?.batting ?? [];
          const bowl: any[] = sc.scorecard?.bowling ?? [];
          const fow: any[] = sc.scorecard?.fallOfWickets ?? [];
          return (
            <div key={idx} style={{ background: "#060C18", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "16px 16px 12px" }}>
              {/* Innings header */}
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ width: 10, height: 10, borderRadius: "50%", background: color(inn.battingTeam), display: "inline-block" }} />
                  <span style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 800, fontSize: 13, color: "#fff" }}>
                    {inn.inningsNumber === 1 ? "1st Innings" : "2nd Innings"} — {inn.battingTeam}
                  </span>
                  {inn.status === "live" && (
                    <span style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 800, fontSize: 9, letterSpacing: ".1em", color: "#EF4444" }}>● LIVE</span>
                  )}
                </div>
                <div style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 900, fontSize: 18, color: "#FF7A29" }}>
                  {inn.totalRuns}/{inn.totalWickets}
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontWeight: 700 }}> ({fmtOv(inn.overs, inn.balls)} ov)</span>
                  {inn.target ? <span style={{ fontSize: 11, color: "#E8B23D", fontWeight: 700, marginLeft: 8 }}>Target {inn.target}</span> : null}
                </div>
              </div>

              {/* Batting table */}
              {bat.length > 0 ? (
                <div className="pts-table-wrap">
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, minWidth: 440 }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                        {["Batter", "Dismissal", "R", "B", "4s", "6s"].map(h => (
                          <th key={h} style={{ padding: "6px 8px", textAlign: h === "Batter" || h === "Dismissal" ? "left" : "right", color: "rgba(255,255,255,0.35)", fontWeight: 700, fontSize: 10, fontFamily: "Montserrat, sans-serif", letterSpacing: ".06em" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {bat.map((b: any, i: number) => (
                        <tr key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                          <td style={{ padding: "7px 8px", color: b.dismissal ? "rgba(255,255,255,0.55)" : "#fff", fontWeight: b.dismissal ? 400 : 700 }}>{b.name}</td>
                          <td style={{ padding: "7px 8px", color: "rgba(255,255,255,0.35)", fontSize: 11 }}>{b.dismissal || "not out"}</td>
                          <td style={{ padding: "7px 8px", textAlign: "right", color: b.runs >= 50 ? "#E8B23D" : "#fff", fontWeight: 800 }}>{b.runs}</td>
                          <td style={{ padding: "7px 8px", textAlign: "right", color: "rgba(255,255,255,0.5)" }}>{b.balls}</td>
                          <td style={{ padding: "7px 8px", textAlign: "right", color: "#60A5FA" }}>{b.fours}</td>
                          <td style={{ padding: "7px 8px", textAlign: "right", color: "#22C55E" }}>{b.sixes}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", padding: "8px 0" }}>No deliveries bowled yet.</div>
              )}

              {/* Fall of wickets */}
              {fow.length > 0 && (
                <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {fow.map((f: any, i: number) => (
                    <span key={i} style={{ padding: "3px 10px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 20, fontSize: 10, color: "#EF4444" }}>
                      {f.wicket}-{f.runs} ({(f.batter || "").split(" ")[0]}, {f.overStr})
                    </span>
                  ))}
                </div>
              )}

              {/* Bowling table */}
              {bowl.length > 0 && (
                <div className="pts-table-wrap" style={{ marginTop: 14 }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, minWidth: 400 }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                        {["Bowler", "O", "R", "W", "Wd", "NB"].map(h => (
                          <th key={h} style={{ padding: "6px 8px", textAlign: h === "Bowler" ? "left" : "right", color: "rgba(255,255,255,0.35)", fontWeight: 700, fontSize: 10, fontFamily: "Montserrat, sans-serif", letterSpacing: ".06em" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {bowl.map((b: any, i: number) => (
                        <tr key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                          <td style={{ padding: "7px 8px", color: "#fff", fontWeight: 600 }}>{b.name}</td>
                          <td style={{ padding: "7px 8px", textAlign: "right", color: "rgba(255,255,255,0.6)" }}>{fmtOv(b.overs, b.balls)}</td>
                          <td style={{ padding: "7px 8px", textAlign: "right", color: "#fff" }}>{b.runs}</td>
                          <td style={{ padding: "7px 8px", textAlign: "right", color: b.wickets > 0 ? "#EF4444" : "rgba(255,255,255,0.5)", fontWeight: b.wickets > 0 ? 800 : 400 }}>{b.wickets}</td>
                          <td style={{ padding: "7px 8px", textAlign: "right", color: "rgba(255,255,255,0.4)" }}>{b.wides}</td>
                          <td style={{ padding: "7px 8px", textAlign: "right", color: "rgba(255,255,255,0.4)" }}>{b.noBalls}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div style={{ background: "#06101E", minHeight: "100vh", color: "#F0EDE8", fontFamily: "'Inter',sans-serif", overflowX: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@700;800;900&family=Inter:wght@400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }

        @keyframes liveBlip { 0%,100% { opacity:1; } 50% { opacity:0.15; } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }

        .wrap { max-width: 1080px; margin: 0 auto; padding: 0 16px; }
        @media(min-width:640px){ .wrap { padding: 0 24px; } }
        @media(min-width:768px){ .wrap { padding: 0 40px; } }

        .section-label { font-family: Montserrat, sans-serif; font-weight: 800; font-size: 11px; letter-spacing: 0.15em; color: #FF7A29; text-transform: uppercase; display: flex; align-items: center; gap: 10px; margin-bottom: 14px; }
        .section-label::before { content: ''; display: inline-block; width: 24px; height: 2px; background: #FF7A29; }

        .section-title { font-family: Montserrat, sans-serif; font-weight: 900; line-height: 1.05; }

        .match-card { background: #0A1727; border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; transition: border-color 0.2s; }
        .match-card.expandable:hover { border-color: rgba(255,122,41,0.35); }

        /* Points table: scrollable on mobile */
        .pts-table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; scrollbar-width: thin; }
        .pts-table-inner { min-width: 520px; }

        .pts-row { display: grid; grid-template-columns: 28px 1fr 48px 28px 28px 48px 68px; align-items: center; gap: 8px; padding: 12px 16px; border-bottom: 1px solid rgba(255,255,255,0.05); transition: background 0.15s; }
        .pts-row:hover { background: rgba(255,122,41,0.04); }
        .pts-row:last-child { border-bottom: none; }

        .pts-header { display: grid; grid-template-columns: 28px 1fr 48px 28px 28px 48px 68px; align-items: center; gap: 8px; padding: 10px 16px; background: #060C18; }
      `}</style>

      <SiteHeader active="Match Center" />

      {/* HERO — slim */}
      <section style={{ background: "#06101E", padding: "clamp(36px,5vw,52px) 0 clamp(24px,3vw,36px)", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: 0, left: 0, width: "40%", height: "100%", background: "linear-gradient(135deg, rgba(255,122,41,0.04) 0%, transparent 70%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", top: 0, left: 0, width: "3px", height: "100%", background: "linear-gradient(180deg,transparent,#FF7A29 30%,#FF7A29 70%,transparent)", opacity: 0.35 }} />
        <div className="wrap">
          <div style={{ animation: "fadeUp 0.7s ease both" }}>
            <span style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 800, fontSize: 11, letterSpacing: "0.1em", color: "#E8B23D" }}>
              {t("SEASON 5 · 2025–26", "सीज़न 5 · 2025–26")}
            </span>
            <h1 style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 900, fontSize: "clamp(24px, 5vw, 52px)", color: "#fff", textTransform: "uppercase", letterSpacing: "-0.01em", lineHeight: 1.05, margin: "10px 0 12px" }}>
              {t("MATCH", "MATCH")} <span style={{ color: "#FF7A29" }}>{t("CENTER", "CENTER")}</span>
            </h1>
            <p style={{ fontFamily: "Inter, sans-serif", fontSize: "clamp(14px, 1.8vw, 16px)", color: "rgba(255,255,255,0.5)", lineHeight: 1.6, maxWidth: 520 }}>
              {t("Live scores, full match scorecards and the Season 5 points table.", "Live scores, पूरे match scorecards और Season 5 points table।")}
            </p>
          </div>
        </div>
      </section>

      {/* MATCHES */}
      <section style={{ padding: "clamp(32px,5vw,52px) 0", background: "#060C18" }}>
        <div className="wrap">
          <div className="section-label">Matches</div>
          <h2 className="section-title" style={{ fontSize: "clamp(20px, 4vw, 34px)", color: "#fff", marginBottom: 24, textTransform: "uppercase" }}>
            SEASON 5 MATCHES
          </h2>

          {sorted.length === 0 && (
            <div style={{ textAlign: "center", padding: "48px 20px", background: "#0A1727", borderRadius: 16, border: "1px solid rgba(255,255,255,0.07)" }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🏏</div>
              <div style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 900, fontSize: 20, color: "#fff", marginBottom: 8 }}>
                {t("No Matches Scheduled Yet", "अभी कोई matches scheduled नहीं हैं")}
              </div>
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14, fontFamily: "Inter, sans-serif", maxWidth: 360, margin: "0 auto" }}>
                {t("Match fixtures, live scores and results will appear here as soon as they are announced.", "Match fixtures, live scores और results यहाँ दिखेंगे जैसे ही announce होंगे।")}
              </p>
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {sorted.map((m: any) => {
              const st = uiStatus(m.status);
              const meta = STATUS_META[st];
              const expandable = st === "live" || st === "completed";
              const open = openId === m.id;
              return (
                <div key={m.id} className={`match-card${expandable ? " expandable" : ""}`} style={{ padding: "16px 18px", borderColor: st === "live" ? "rgba(239,68,68,0.35)" : undefined }}>
                  {/* Card header row */}
                  <div
                    onClick={() => expandable && setOpenId(open ? null : m.id)}
                    style={{ cursor: expandable ? "pointer" : "default" }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, background: `${meta.color}18`, border: `1px solid ${meta.color}40`, borderRadius: 20, padding: "3px 10px" }}>
                          {st === "live" && <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#EF4444", display: "inline-block", animation: "liveBlip 1.2s infinite" }} />}
                          <span style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 800, fontSize: 9, letterSpacing: ".1em", color: meta.color }}>{meta.label}</span>
                        </span>
                        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>Match {m.matchNo} · Season 5</span>
                      </div>
                      <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>
                        📍 {m.venue}{m.scheduledAt ? ` · ${fmtDate(m.scheduledAt)}` : ""}
                      </span>
                    </div>

                    {/* Teams */}
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 10 }}>
                        <TeamBadge name={m.team1} color={color(m.team1)} logo={logoOf(m.team1)} size={32} fontSize={10} />
                        <span style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 800, fontSize: "clamp(12px,2vw,15px)", color: m.winner === m.team1 ? "#FF7A29" : "#fff" }}>{m.team1}</span>
                      </div>
                      <div style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 900, fontSize: 12, color: "rgba(255,255,255,0.25)", flexShrink: 0 }}>VS</div>
                      <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 10, flexDirection: "row-reverse" }}>
                        <TeamBadge name={m.team2} color={color(m.team2)} logo={logoOf(m.team2)} size={32} fontSize={10} />
                        <span style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 800, fontSize: "clamp(12px,2vw,15px)", color: m.winner === m.team2 ? "#FF7A29" : "#fff", textAlign: "right" }}>{m.team2}</span>
                      </div>
                    </div>

                    {/* Result line / expand hint */}
                    {(m.resultDesc || m.playerOfMatch || expandable) && (
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
                        <div>
                          {m.resultDesc && <span style={{ fontSize: 12, color: "#22C55E", fontFamily: "Inter, sans-serif", fontWeight: 600 }}>{m.resultDesc}</span>}
                          {m.playerOfMatch && <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginLeft: 10 }}>⭐ {m.playerOfMatch}</span>}
                        </div>
                        {expandable && (
                          <span style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 800, fontSize: 10, letterSpacing: ".08em", color: "#FF7A29" }}>
                            {open ? "HIDE SCORECARD ▲" : "VIEW SCORECARD ▼"}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Expanded scorecard */}
                  {open && renderScorecard(m.id)}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* POINTS TABLE */}
      <section style={{ padding: "clamp(32px,5vw,52px) 0", background: "#06101E" }}>
        <div className="wrap">
          <div className="section-label">Standings</div>
          <h2 className="section-title" style={{ fontSize: "clamp(20px, 4vw, 34px)", color: "#fff", marginBottom: 24, textTransform: "uppercase" }}>
            POINTS TABLE — SEASON 5
          </h2>

          {points.length === 0 && (
            <div style={{ textAlign: "center", padding: "48px 20px", background: "#0A1727", borderRadius: 16, border: "1px solid rgba(255,255,255,0.07)" }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🏆</div>
              <div style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 900, fontSize: 20, color: "#fff", marginBottom: 8 }}>
                {t("Standings Coming Soon", "Standings जल्द आएंगे")}
              </div>
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14, fontFamily: "Inter, sans-serif", maxWidth: 360, margin: "0 auto" }}>
                {t("The points table will update in real time once Season 5 matches begin.", "Season 5 के matches शुरू होते ही points table real time में update होगी।")}
              </p>
            </div>
          )}

          {points.length > 0 && (
            <div className="pts-table-wrap" style={{ background: "#0A1727", borderRadius: 16, border: "1px solid rgba(255,255,255,0.07)", overflow: "hidden" }}>
              <div className="pts-table-inner">
                <div className="pts-header">
                  {["#", "Team", "P", "W", "L", "NR", "Pts"].map(h => (
                    <div key={h} style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 700, fontSize: 10, color: "rgba(255,255,255,0.35)", letterSpacing: ".1em", textAlign: h === "Team" ? "left" : "center" }}>{h}</div>
                  ))}
                </div>
                {points.map((row: any, i: number) => (
                  <div key={row.id ?? i} className="pts-row">
                    <div style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 800, fontSize: 13, color: i === 0 ? "#E8B23D" : i === 1 ? "#9CA3AF" : i === 2 ? "#B45309" : "rgba(255,255,255,0.4)", textAlign: "center" }}>{i + 1}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <TeamBadge name={row.team} color={color(row.team)} logo={logoOf(row.team)} size={26} fontSize={8} />
                      <div style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 700, fontSize: 13, color: "#fff" }}>{row.team}</div>
                    </div>
                    <div style={{ textAlign: "center", fontSize: 13, color: "rgba(255,255,255,0.6)" }}>{row.played}</div>
                    <div style={{ textAlign: "center", fontSize: 13, color: "#22C55E", fontWeight: 600 }}>{row.won}</div>
                    <div style={{ textAlign: "center", fontSize: 13, color: "#E8493F" }}>{row.lost}</div>
                    <div style={{ textAlign: "center", fontSize: 13, color: "rgba(255,255,255,0.4)" }}>{row.noResult}</div>
                    <div style={{ textAlign: "center", fontFamily: "Montserrat, sans-serif", fontWeight: 900, fontSize: 16, color: "#FF7A29" }}>{row.points}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      <BCPLFooter />

      {/* Floating register button */}
      <Link href="/register" style={{ position: "fixed", bottom: 28, right: 28, zIndex: 900, background: "linear-gradient(135deg,#FF7A29,#D95E10)", border: "none", borderRadius: 12, color: "#fff", fontFamily: "Montserrat, sans-serif", fontWeight: 900, fontSize: 13, letterSpacing: ".06em", padding: "14px 22px", textTransform: "uppercase", textDecoration: "none", display: "flex", alignItems: "center", gap: 8, boxShadow: "0 8px 32px rgba(255,122,41,0.45)", clipPath: "polygon(0 0,calc(100% - 8px) 0,100% 8px,100% 100%,0 100%)", transition: "opacity .2s, transform .15s" }} onMouseEnter={e => { e.currentTarget.style.opacity = ".9"; e.currentTarget.style.transform = "translateY(-2px)"; }} onMouseLeave={e => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.transform = "translateY(0)"; }}>
        {t("🏏 REGISTER NOW →", "🏏 अभी रजिस्टर करें →")}
      </Link>
    </div>
  );
}

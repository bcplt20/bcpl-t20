import { useState, useEffect, useMemo } from "react";
import { Link } from "wouter";
import { BCPLFooter } from '../components/BCPLFooter';
import { SiteHeader } from '../components/SiteHeader';
import { Skel, SkelRows } from '../components/Skel';
import { getMatches, getPointsTable, getScorecard, getTeams } from '../lib/api';
import { useLang } from '../lib/i18n';
import { IcoBat, IcoTrophy, IcoPin, IcoStar } from '../lib/icons';
import { MatchCountdown, stageMeta } from '../components/MatchCard';
import { LiveMatchBanner } from '../components/LiveMatchBanner';
import { BALL_LOGO, groupOf } from '../lib/teamMeta';

/* ─── Palette (LIGHTENED DARK theme) ─────────────────────────────── */
const PAGE      = "#1B2E52";              // lightened navy page bg
const PANEL     = "#24396B";              // primary panel
const PANEL_2   = "#2C3A5E";              // secondary panel / recessed
const PANEL_3   = "#1F3159";             // inner scorecard block
const LINE      = "rgba(255,255,255,.18)";
const LINE_SOFT = "rgba(255,255,255,.10)";
const TXT       = "rgba(255,255,255,.92)"; // primary text
const TXT2      = "rgba(255,255,255,.80)"; // secondary
const TXT3      = "rgba(255,255,255,.64)"; // muted (still AA on lightened navy)
const ORANGE    = "#FF7A29";
const GOLD      = "#E8B23D";
const GREEN     = "#31C56B";
const RED       = "#F26158";

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

/* Strike rate & economy — derived, purely for display. */
const strikeRate = (runs: number, balls: number) =>
  balls > 0 ? ((runs / balls) * 100).toFixed(1) : "0.0";
const economy = (runs: number, overs: number, balls: number) => {
  const totalBalls = (overs ?? 0) * 6 + (balls ?? 0);
  return totalBalls > 0 ? ((runs / totalBalls) * 6).toFixed(2) : "0.00";
};

type UiStatus = "live" | "upcoming" | "completed" | "abandoned";
const uiStatus = (s: string): UiStatus =>
  s === "live" || s === "innings2" ? "live"
  : s === "completed" ? "completed"
  : s === "abandoned" ? "abandoned"
  : "upcoming";

const STATUS_META: Record<UiStatus, { label: string; color: string }> = {
  live:      { label: "LIVE",      color: RED },
  upcoming:  { label: "UPCOMING",  color: "#6EA8FF" },
  completed: { label: "RESULT",    color: GREEN },
  abandoned: { label: "ABANDONED", color: "#A7B2C6" },
};

/* Team logo: transparent PNG straight on the page (NO backing circle/ring),
   falling back to the BCPL ball logo when there is no team logo or it fails. */
function TeamBadge({ name, color, logo, size, fontSize }: {
  name: string; color: string; logo?: string; size: number; fontSize: number;
}) {
  void color; void fontSize;
  const [broken, setBroken] = useState(false);
  const showLogo = Boolean(logo) && !broken;
  const src = showLogo ? logo : BALL_LOGO;
  // Transparent logo directly on the page — no backing circle/gradient.
  return (
    <span style={{
      width: size, height: size,
      display: "inline-flex", alignItems: "center",
      justifyContent: "center", flexShrink: 0,
    }}>
      <img decoding="async" src={src} alt={name} onError={() => setBroken(true)}
        style={{ width: "100%", height: "100%", objectFit: "contain", filter: "drop-shadow(0 3px 9px rgba(0,0,0,0.45))" }} />
    </span>
  );
}

/* Form-guide dots for the points table (W / L / N). */
function FormGuide({ form }: { form: string[] }) {
  if (!form || form.length === 0) return null;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
      {form.slice(-5).map((r, i) => {
        const res = (r || "").toUpperCase();
        const bg = res === "W" ? GREEN : res === "L" ? RED : "#8A94A8";
        return (
          <span key={i} title={res === "W" ? "Won" : res === "L" ? "Lost" : "No result"} style={{
            width: 17, height: 17, borderRadius: "50%", background: bg,
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            fontFamily: "var(--font-head)", fontWeight: 800, fontSize: 9, color: "#0C1D33", flexShrink: 0,
          }}>{res}</span>
        );
      })}
    </div>
  );
}

export function MatchCenter() {
  const { t } = useLang();
  const [matches, setMatches] = useState<any[]>([]);
  const [points,  setPoints]  = useState<any[]>([]);
  const [teamColors, setTeamColors] = useState<Record<string, string>>({});
  const [teamLogos,  setTeamLogos]  = useState<Record<string, string>>({});
  const [teamNames,  setTeamNames]  = useState<string[]>([]);
  const [openId,  setOpenId]  = useState<string | null>(null);
  const [cards,   setCards]   = useState<Record<string, any>>({});
  const [loadingCard, setLoadingCard] = useState(false);
  const [matchesLoaded, setMatchesLoaded] = useState(false);

  /* Matches + points table (refresh every 30 s so live results stay current) */
  useEffect(() => {
    const load = () => {
      getMatches(5).then(d => setMatches(d.matches ?? [])).catch(() => {}).finally(() => setMatchesLoaded(true));
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
      setTeamNames((d.teams ?? []).map((t: any) => t.name).filter(Boolean));
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

  const color  = (team: string) => teamColors[normTeam(team)] || "#7C8BA5";
  const logoOf = (team: string) => teamLogos[normTeam(team)] || "";

  const order = (s: string) => { const u = uiStatus(s); return u === "live" ? 0 : u === "upcoming" ? 1 : 2; };
  const sorted = [...matches].sort((a, b) => order(a.status) - order(b.status) || (a.matchNo ?? 0) - (b.matchNo ?? 0));

  /* Score line for a team from an already-loaded scorecard (broadcast strip).
     Returns e.g. "186/4 (20.0)" or null when the data has not been fetched. */
  const scoreFor = (matchId: string, teamName: string): string | null => {
    const data = cards[matchId];
    if (!data) return null;
    const inn = (data.scorecards ?? [])
      .map((sc: any) => sc.innings ?? {})
      .find((i: any) => normTeam(i.battingTeam) === normTeam(teamName));
    if (!inn) return null;
    return `${inn.totalRuns ?? 0}/${inn.totalWickets ?? 0} (${fmtOv(inn.overs, inn.balls)})`;
  };

  /* ─── Broadcast-style score strip for one team ──────── */
  const ScoreStrip = ({ team, winner, score, alignEnd }: {
    team: string; winner?: string; score: string | null; alignEnd?: boolean;
  }) => {
    const isWinner = winner === team;
    return (
      <div style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: 12, flexDirection: alignEnd ? "row-reverse" : "row" }}>
        <TeamBadge name={team} color={color(team)} logo={logoOf(team)} size={60} fontSize={12} />
        <div style={{ minWidth: 0, textAlign: alignEnd ? "right" : "left" }}>
          <div style={{ fontFamily: "'Montserrat',Inter,sans-serif", fontWeight: 800, fontSize: "clamp(12px,2.1vw,15px)", letterSpacing: ".02em", color: isWinner ? ORANGE : TXT, lineHeight: 1.25, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{team}</div>
          {score
            ? <div style={{ fontFamily: "var(--font-head)", fontWeight: 900, fontSize: "clamp(18px,3.4vw,24px)", color: "#fff", lineHeight: 1.15, marginTop: 2 }}>{score}</div>
            : <div style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: TXT3, marginTop: 3 }}>{t("Yet to bat", "अभी बल्लेबाज़ी बाकी")}</div>}
        </div>
      </div>
    );
  };

  /* ─── Scorecard panel for one match ─────────────────── */
  const renderScorecard = (matchId: string) => {
    const data = cards[matchId];
    if (!data) return loadingCard ? (
      <div role="status" aria-label={t("Loading…", "लोड हो रहा है…")} style={{ padding: "16px 0" }}>
        <SkelRows n={4} />
      </div>
    ) : (
      <div style={{ padding: "20px 0", textAlign: "center", color: TXT3, fontSize: 14 }}>
        {t("Scorecard not available yet.", "स्कोरकार्ड अभी उपलब्ध नहीं है।")}
      </div>
    );
    const scorecards: any[] = data.scorecards ?? [];
    if (scorecards.length === 0) return (
      <div style={{ padding: "20px 0", textAlign: "center", color: TXT3, fontSize: 14 }}>
        {t("Scorecard will appear here once the match begins.", "मैच शुरू होते ही स्कोरकार्ड यहाँ दिखेगा।")}
      </div>
    );
    const thBase = { padding: "8px 8px", color: GOLD, fontWeight: 700, fontSize: 11, fontFamily: "var(--font-head)", letterSpacing: ".06em", textTransform: "uppercase" as const };
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 18, paddingTop: 16 }}>
        {scorecards.map((sc: any, idx: number) => {
          const inn = sc.innings ?? {};
          const bat: any[] = sc.scorecard?.batting ?? [];
          const bowl: any[] = sc.scorecard?.bowling ?? [];
          const fow: any[] = sc.scorecard?.fallOfWickets ?? [];
          const extras = inn.extras ?? 0;
          return (
            <div key={idx} style={{ background: PANEL_3, border: `1px solid ${LINE_SOFT}`, borderRadius: 14, padding: "16px 16px 14px" }}>
              {/* Innings header */}
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ width: 10, height: 10, borderRadius: "50%", background: color(inn.battingTeam), display: "inline-block" }} />
                  <span style={{ fontFamily: "var(--font-head)", fontWeight: 800, fontSize: 14, color: "#fff" }}>
                    {inn.inningsNumber === 1 ? t("1st Innings", "पहली पारी") : t("2nd Innings", "दूसरी पारी")} — {inn.battingTeam}
                  </span>
                  {inn.status === "live" && (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontFamily: "var(--font-head)", fontWeight: 800, fontSize: 11, letterSpacing: ".1em", color: RED }}>
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: RED, display: "inline-block", animation: "liveBlip 1.2s infinite" }} />LIVE
                    </span>
                  )}
                </div>
                <div style={{ fontFamily: "var(--font-head)", fontWeight: 900, fontSize: 20, color: ORANGE }}>
                  {inn.totalRuns}/{inn.totalWickets}
                  <span style={{ fontSize: 13, color: TXT3, fontWeight: 700 }}> ({fmtOv(inn.overs, inn.balls)} ov)</span>
                  {inn.target ? <span style={{ fontSize: 13, color: GOLD, fontWeight: 700, marginLeft: 8 }}>{t("Target", "लक्ष्य")} {inn.target}</span> : null}
                </div>
              </div>

              {/* Batting table */}
              {bat.length > 0 ? (
                <div className="pts-table-wrap">
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 480 }}>
                    <thead>
                      <tr style={{ borderBottom: `2px solid ${LINE}` }}>
                        {["Batter", "Dismissal", "R", "B", "4s", "6s", "SR"].map(h => (
                          <th key={h} style={{ ...thBase, textAlign: h === "Batter" || h === "Dismissal" ? "left" : "right" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {bat.map((b: any, i: number) => (
                        <tr key={i} style={{ borderBottom: `1px solid ${LINE_SOFT}` }}>
                          <td style={{ padding: "9px 8px", color: b.dismissal ? TXT2 : "#fff", fontWeight: b.dismissal ? 500 : 700 }}>{b.name}</td>
                          <td style={{ padding: "9px 8px", color: TXT3, fontSize: 12 }}>{b.dismissal || t("not out", "नाबाद")}</td>
                          <td style={{ padding: "9px 8px", textAlign: "right", color: b.runs >= 50 ? GOLD : "#fff", fontWeight: 800 }}>{b.runs}</td>
                          <td style={{ padding: "9px 8px", textAlign: "right", color: TXT2 }}>{b.balls}</td>
                          <td style={{ padding: "9px 8px", textAlign: "right", color: "#6EA8FF", fontWeight: 600 }}>{b.fours}</td>
                          <td style={{ padding: "9px 8px", textAlign: "right", color: GREEN, fontWeight: 600 }}>{b.sixes}</td>
                          <td style={{ padding: "9px 8px", textAlign: "right", color: TXT2 }}>{strikeRate(b.runs, b.balls)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ fontSize: 13, color: TXT3, padding: "8px 0" }}>{t("No deliveries bowled yet.", "अभी तक कोई गेंद नहीं फेंकी गई।")}</div>
              )}

              {/* Extras & total */}
              {bat.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 8, marginTop: 10, paddingTop: 10, borderTop: `1px solid ${LINE_SOFT}`, fontSize: 13 }}>
                  <span style={{ color: TXT2 }}>
                    <span style={{ fontFamily: "var(--font-head)", fontWeight: 700, color: GOLD, letterSpacing: ".04em", textTransform: "uppercase", fontSize: 11 }}>{t("Extras", "अतिरिक्त")} </span>
                    <span style={{ fontWeight: 700, color: "#fff" }}>{extras}</span>
                  </span>
                  <span style={{ color: TXT2 }}>
                    <span style={{ fontFamily: "var(--font-head)", fontWeight: 700, color: GOLD, letterSpacing: ".04em", textTransform: "uppercase", fontSize: 11 }}>{t("Total", "कुल")} </span>
                    <span style={{ fontFamily: "var(--font-head)", fontWeight: 900, color: "#fff", fontSize: 15 }}>{inn.totalRuns}/{inn.totalWickets}</span>
                    <span style={{ color: TXT3 }}> ({fmtOv(inn.overs, inn.balls)} ov)</span>
                  </span>
                </div>
              )}

              {/* Fall of wickets */}
              {fow.length > 0 && (
                <div style={{ marginTop: 12 }}>
                  <div style={{ fontFamily: "var(--font-head)", fontWeight: 700, fontSize: 11, letterSpacing: ".06em", textTransform: "uppercase", color: GOLD, marginBottom: 8 }}>{t("Fall of Wickets", "विकेट पतन")}</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {fow.map((f: any, i: number) => (
                      <span key={i} style={{ padding: "4px 10px", background: "rgba(242,97,88,0.14)", border: "1px solid rgba(242,97,88,0.4)", borderRadius: 20, fontSize: 11, color: RED, fontWeight: 600 }}>
                        {f.wicket}-{f.runs} ({(f.batter || "").split(" ")[0]}, {f.overStr})
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Bowling table */}
              {bowl.length > 0 && (
                <div className="pts-table-wrap" style={{ marginTop: 16 }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 460 }}>
                    <thead>
                      <tr style={{ borderBottom: `2px solid ${LINE}` }}>
                        {["Bowler", "O", "M", "R", "W", "Econ"].map(h => (
                          <th key={h} style={{ ...thBase, textAlign: h === "Bowler" ? "left" : "right" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {bowl.map((b: any, i: number) => (
                        <tr key={i} style={{ borderBottom: `1px solid ${LINE_SOFT}` }}>
                          <td style={{ padding: "9px 8px", color: "#fff", fontWeight: 700 }}>{b.name}</td>
                          <td style={{ padding: "9px 8px", textAlign: "right", color: TXT2 }}>{fmtOv(b.overs, b.balls)}</td>
                          <td style={{ padding: "9px 8px", textAlign: "right", color: TXT2 }}>{b.maidens ?? 0}</td>
                          <td style={{ padding: "9px 8px", textAlign: "right", color: "#fff", fontWeight: 600 }}>{b.runs}</td>
                          <td style={{ padding: "9px 8px", textAlign: "right", color: b.wickets > 0 ? RED : TXT3, fontWeight: b.wickets > 0 ? 800 : 400 }}>{b.wickets}</td>
                          <td style={{ padding: "9px 8px", textAlign: "right", color: TXT2 }}>{economy(b.runs, b.overs, b.balls)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {/* Wides / no-balls conceded (kept from API for completeness) */}
                  {bowl.some((b: any) => (b.wides ?? 0) > 0 || (b.noBalls ?? 0) > 0) && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 14, marginTop: 8, fontSize: 12, color: TXT3 }}>
                      <span>{t("Wides", "वाइड")}: <b style={{ color: TXT2 }}>{bowl.reduce((s: number, b: any) => s + (b.wides ?? 0), 0)}</b></span>
                      <span>{t("No-balls", "नो-बॉल")}: <b style={{ color: TXT2 }}>{bowl.reduce((s: number, b: any) => s + (b.noBalls ?? 0), 0)}</b></span>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  /* Group A/B zero-filled standings (mirrors Home teaser & /points-table).
     Canonical site mapping (Teams page / teamMeta groupOf) is the source of
     truth; match `grp` is only a fallback for teams the map doesn't know. */
  const groups = useMemo(() => {
    const normG = (n: string) => (n || "").trim().toLowerCase();
    const grpOf: Record<string, string> = {};   // normalized name -> group
    const nameOf: Record<string, string> = {};  // normalized name -> display name
    const place = (team: string, mGrp?: string) => {
      const k = normG(team);
      if (!k) return;
      const canon = groupOf(team);
      const g = canon ?? (mGrp === "A" || mGrp === "B" ? mGrp : undefined);
      if (!g) return;
      if (!grpOf[k]) { grpOf[k] = g; nameOf[k] = team; }
    };
    teamNames.forEach(n => place(n));
    points.forEach((r: any) => place(r.team));
    matches.forEach((m: any) => {
      if (m.stage && m.stage !== "league") return;
      [m.team1, m.team2].forEach((team: string) => place(team, m.grp));
    });
    const rows: Record<string, any> = {};
    Object.keys(grpOf).forEach(k => { rows[k] = { team: nameOf[k], grp: grpOf[k], played: 0, won: 0, lost: 0, noResult: 0, points: 0, nrr: 0, form: [] }; });
    points.forEach((r: any) => { const k = normG(r.team); if (rows[k]) rows[k] = { ...rows[k], ...r, team: rows[k].team, grp: grpOf[k] }; });
    const sortRows = (a: any, b: any) => (b.points - a.points) || (Number(b.nrr) - Number(a.nrr)) || a.team.localeCompare(b.team);
    const A = Object.values(rows).filter((r: any) => r.grp === "A").sort(sortRows);
    const B = Object.values(rows).filter((r: any) => r.grp === "B").sort(sortRows);
    return (A.length > 0 || B.length > 0) ? { A, B } : null;
  }, [matches, points, teamNames]);

  return (
    <div style={{ background: PAGE, minHeight: "100vh", color: TXT, fontFamily: "'Inter',sans-serif", overflowX: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@700;800;900&family=Inter:wght@400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }

        @keyframes liveBlip { 0%,100% { opacity:1; } 50% { opacity:0.15; } }
        @keyframes livePulse { 0% { box-shadow:0 0 0 0 rgba(242,97,88,.5); } 70% { box-shadow:0 0 0 8px rgba(242,97,88,0); } 100% { box-shadow:0 0 0 0 rgba(242,97,88,0); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }

        .wrap { max-width: 1200px; margin: 0 auto; padding: 0 20px; }
        @media(min-width:768px){ .wrap { padding: 0 32px; } }
        @media(min-width:1280px){ .wrap { padding: 0 48px; } }

        .section-label { font-family: 'Inter', sans-serif; font-weight: 800; font-size: 11px; letter-spacing: 0.15em; color: #FF7A29; text-transform: uppercase; display: flex; align-items: center; gap: 10px; margin-bottom: 14px; }
        .section-label::before { content: ''; display: inline-block; width: 24px; height: 2px; background: #FF7A29; }

        .section-title { font-family: 'Barlow Condensed','Mukta','Montserrat',sans-serif; font-weight: 800; line-height: .95; letter-spacing: .015em; }
        .v3-kicker { font-family: 'Inter', sans-serif; font-weight: 700; font-size: 12px; letter-spacing: .22em; color: #E8B23D; text-transform: uppercase; }

        /* Match card — broadcast card on lightened navy */
        .match-card { background: ${PANEL}; border: 1px solid ${LINE}; border-radius: 16px; box-shadow: 0 12px 34px rgba(0,0,0,.28); transition: border-color .2s, box-shadow .2s, transform .2s; }
        .match-card.expandable:hover { border-color: rgba(255,122,41,0.5); box-shadow: 0 18px 44px rgba(0,0,0,.34); transform: translateY(-2px); }
        .match-card.is-live { border-color: rgba(242,97,88,0.5); }

        /* Tables: scrollable on mobile with sticky team column */
        .pts-table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; scrollbar-width: thin; }
        .pts-inner { min-width: 720px; }

        .pts-grid { display: grid; grid-template-columns: 46px minmax(180px,1fr) 44px 44px 44px 44px 64px 120px 56px; align-items: center; }
        .pts-head { background: ${PANEL_2}; border-bottom: 2px solid ${LINE}; }
        .pts-head > div { padding: 13px 10px; font-family: 'Barlow Condensed','Montserrat',sans-serif; font-weight: 700; font-size: 11px; color: #E8B23D; letter-spacing: .1em; text-transform: uppercase; text-align: center; }
        .pts-head > div.left { text-align: left; }
        .pts-row2 { border-bottom: 1px solid ${LINE_SOFT}; transition: background .15s; }
        .pts-row2:hover { background: rgba(255,122,41,0.08); }
        .pts-row2:last-child { border-bottom: none; }
        .pts-row2 > div { padding: 13px 10px; text-align: center; font-size: 15px; }
        .pts-row2 > div.left { text-align: left; }
        .pts-row2.qualify { background: rgba(49,197,107,0.09); }
        .pts-row2.qualify:hover { background: rgba(49,197,107,0.15); }
        .pts-row2.qualify-last { border-bottom: 2px solid rgba(49,197,107,0.6); }

        /* Sticky pos + team columns for horizontal scroll */
        .pts-head > div.stick, .pts-row2 > div.stick { position: sticky; z-index: 2; background: ${PANEL}; }
        .pts-head > div.stick { background: ${PANEL_2}; }
        .pts-row2:hover > div.stick { background: #2A407A; }
        .pts-row2.qualify > div.stick { background: #274568; }
        .pts-row2.qualify:hover > div.stick { background: #2C4C6E; }
        .pts-head > div.stick-pos, .pts-row2 > div.stick-pos { left: 0; }
        .pts-head > div.stick-team, .pts-row2 > div.stick-team { left: 46px; box-shadow: 6px 0 12px -8px rgba(0,0,0,.45); }
      `}</style>

      <SiteHeader active="Match Center" />

      {/* HERO */}
      <section style={{ background: PAGE, padding: "clamp(80px,12vh,130px) 0 clamp(40px,6vw,64px)", position: "relative", overflow: "hidden", textAlign: "center" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 60% 50% at 50% 0%,rgba(255,122,41,0.10) 0%,transparent 70%)", pointerEvents: "none", zIndex: 0 }} />
        <div className="wrap" style={{ position: "relative", zIndex: 1, animation: "fadeUp 0.7s ease both" }}>
          <div className="v3-kicker" style={{ marginBottom: 16 }}>
            {t("SEASON 4 · 2026–27", "सीज़न 4 · 2026–27")}
          </div>
          <h1 className="section-title" style={{ fontSize: "clamp(40px, 9vw, 88px)", color: "#fff", textTransform: "uppercase", marginBottom: 16 }}>
            {t("MATCH", "MATCH")} <span style={{ color: "#FF7A29" }}>{t("CENTER", "CENTER")}</span>
          </h1>
          <p style={{ fontFamily: "Inter, sans-serif", fontSize: "clamp(16px, 1.8vw, 18px)", color: TXT2, lineHeight: 1.7, maxWidth: 640, margin: "0 auto" }}>
            {t("Live scores, full match scorecards and the Season 4 points table.", "Live scores, पूरे match scorecards और Season 4 points table।")}
          </p>
        </div>
      </section>

      {/* MATCHES — recessed strip */}
      <section style={{ padding: "clamp(56px,9vw,110px) 0", background: PANEL_2 }}>
        <div className="wrap">
          <LiveMatchBanner />
          <div className="section-label">Matches</div>
          <h2 className="section-title" style={{ fontSize: "clamp(22px, 4vw, 36px)", color: "#fff", marginBottom: 24, textTransform: "uppercase" }}>
            SEASON 4 MATCHES
          </h2>

          {!matchesLoaded && sorted.length === 0 && (
            <div role="status" aria-label={t("Loading…", "लोड हो रहा है…")} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="match-card" style={{ padding: "18px 20px", display: "flex", alignItems: "center", gap: 16 }}>
                  <Skel w={44} h={44} r={22} style={{ flexShrink: 0 }} />
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
                    <Skel w="45%" h={14} />
                    <Skel w="70%" h={12} />
                  </div>
                  <Skel w={70} h={22} r={8} style={{ flexShrink: 0 }} />
                </div>
              ))}
            </div>
          )}

          {matchesLoaded && sorted.length === 0 && (
            <div style={{ textAlign: "center", padding: "clamp(48px,8vw,72px) 24px", background: PANEL, borderRadius: 20, border: `1px solid ${LINE}`, boxShadow: "0 12px 34px rgba(0,0,0,.28)" }}>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 18 }}>
                <span style={{ width: 76, height: 76, borderRadius: "50%", background: "rgba(255,122,41,0.14)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                  <IcoBat size={38} style={{ color: ORANGE }} />
                </span>
              </div>
              <div className="section-title" style={{ fontSize: 26, color: "#fff", marginBottom: 8, textTransform: "uppercase" }}>
                {t("No Matches Scheduled Yet", "अभी कोई matches scheduled नहीं हैं")}
              </div>
              <p style={{ color: TXT3, fontSize: 15, fontFamily: "Inter, sans-serif", maxWidth: 380, margin: "0 auto" }}>
                {t("Match fixtures, live scores and results will appear here as soon as they are announced.", "Match fixtures, live scores और results यहाँ दिखेंगे जैसे ही announce होंगे।")}
              </p>
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {sorted.map((m: any) => {
              const st = uiStatus(m.status);
              const meta = STATUS_META[st];
              const expandable = st === "live" || st === "completed";
              const open = openId === m.id;
              const s1 = scoreFor(m.id, m.team1);
              const s2 = scoreFor(m.id, m.team2);
              return (
                <div key={m.id} className={`match-card${expandable ? " expandable" : ""}${st === "live" ? " is-live" : ""}`} style={{ padding: "18px 20px" }}>
                  {/* Card header row */}
                  <div
                    onClick={() => expandable && setOpenId(open ? null : m.id)}
                    style={{ cursor: expandable ? "pointer" : "default" }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, background: `${meta.color}26`, border: `1px solid ${meta.color}66`, borderRadius: 20, padding: "4px 11px", animation: st === "live" ? "livePulse 1.6s infinite" : undefined }}>
                          {st === "live" && <span style={{ width: 6, height: 6, borderRadius: "50%", background: RED, display: "inline-block", animation: "liveBlip 1.2s infinite" }} />}
                          <span style={{ fontFamily: "var(--font-head)", fontWeight: 800, fontSize: 10, letterSpacing: ".1em", color: meta.color }}>{meta.label}</span>
                        </span>
                        <span style={{ fontSize: 12, color: TXT3 }}>Match {m.matchNo}</span>
                        {(() => { const sg = stageMeta(m); return (
                          <span style={{ background: sg.badge.background, padding: "3px 10px", borderRadius: 100, fontSize: 10, fontFamily: "var(--font-head)", fontWeight: 900, color: sg.badge.color, letterSpacing: ".08em", boxShadow: sg.badge.glow, whiteSpace: "nowrap" }}>{sg.label}</span>
                        ); })()}
                      </div>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, color: TXT3 }}>
                        <IcoPin size={12} style={{ color: TXT3 }} /> {m.venue}{m.scheduledAt ? ` · ${fmtDate(m.scheduledAt)}` : ""}
                      </span>
                    </div>

                    {/* Broadcast score strip */}
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <ScoreStrip team={m.team1} winner={m.winner} score={s1} />
                      <div style={{ fontFamily: "var(--font-head)", fontWeight: 900, fontSize: 12, color: "rgba(255,255,255,.32)", flexShrink: 0 }}>VS</div>
                      <ScoreStrip team={m.team2} winner={m.winner} score={s2} alignEnd />
                    </div>

                    {/* Countdown for upcoming matches */}
                    {st === "upcoming" && m.scheduledAt && new Date(m.scheduledAt).getTime() > Date.now() && (
                      <div style={{ display: "flex", justifyContent: "center", marginTop: 14, paddingTop: 12, borderTop: `1px solid ${LINE_SOFT}` }}>
                        <MatchCountdown targetDate={m.scheduledAt} />
                      </div>
                    )}

                    {/* Result line / expand hint */}
                    {(m.resultDesc || m.playerOfMatch || expandable) && (
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8, marginTop: 14, paddingTop: 12, borderTop: `1px solid ${LINE_SOFT}` }}>
                        <div>
                          {m.resultDesc && <span style={{ fontSize: 15, color: GREEN, fontFamily: "Inter, sans-serif", fontWeight: 700 }}>{m.resultDesc}</span>}
                          {m.playerOfMatch && <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, color: TXT3, marginLeft: 10 }}><IcoStar size={12} style={{ color: GOLD }} /> {m.playerOfMatch}</span>}
                        </div>
                        {expandable && (
                          <span style={{ fontFamily: "var(--font-head)", fontWeight: 800, fontSize: 11, letterSpacing: ".08em", color: ORANGE }}>
                            {open ? t("HIDE SCORECARD ▲", "स्कोरकार्ड छिपाएँ ▲") : t("VIEW SCORECARD ▼", "स्कोरकार्ड देखें ▼")}
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

      {/* POINTS TABLE — IPL-style */}
      <section style={{ padding: "clamp(56px,9vw,110px) 0", background: PAGE }}>
        <div className="wrap">
          <div className="section-label">Standings</div>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: 24 }}>
            <h2 className="section-title" style={{ fontSize: "clamp(22px, 4vw, 36px)", color: "#fff", margin: 0, textTransform: "uppercase" }}>
              POINTS TABLE — SEASON 4
            </h2>
            <Link href="/points-table" style={{ display: "inline-flex", alignItems: "center", gap: 6, color: GOLD, fontFamily: "var(--font-head)", fontWeight: 800, fontSize: 13, letterSpacing: ".06em", textTransform: "uppercase", textDecoration: "none", whiteSpace: "nowrap" }}>
              {t("View full standings", "पूरी अंक तालिका देखें")} →
            </Link>
          </div>

          {!groups && (
            <div style={{ textAlign: "center", padding: "clamp(48px,8vw,72px) 24px", background: PANEL, borderRadius: 20, border: `1px solid ${LINE}`, boxShadow: "0 12px 34px rgba(0,0,0,.28)" }}>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 18 }}>
                <span style={{ width: 76, height: 76, borderRadius: "50%", background: "rgba(232,178,61,0.16)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                  <IcoTrophy size={38} style={{ color: GOLD }} />
                </span>
              </div>
              <div className="section-title" style={{ fontSize: 26, color: "#fff", marginBottom: 8, textTransform: "uppercase" }}>
                {t("Standings Coming Soon", "Standings जल्द आएंगे")}
              </div>
              <p style={{ color: TXT3, fontSize: 15, fontFamily: "Inter, sans-serif", maxWidth: 380, margin: "0 auto" }}>
                {t("The points table will update in real time once Season 4 matches begin.", "Season 4 के matches शुरू होते ही points table real time में update होगी।")}
              </p>
            </div>
          )}

          {groups && (["A", "B"] as const).map(g => groups[g].length === 0 ? null : (
            <div key={g} style={{ marginBottom: 30 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 12 }}>
                <span style={{ width: 5, height: 22, borderRadius: 3, background: `linear-gradient(180deg, ${ORANGE}, ${GOLD})`, flexShrink: 0 }} />
                <span style={{ fontFamily: "var(--font-head)", fontWeight: 900, fontSize: 17, letterSpacing: ".12em", color: GOLD, textTransform: "uppercase" }}>
                  {t(`Group ${g}`, `ग्रुप ${g}`)}
                </span>
                <span style={{ fontFamily: "var(--font-head)", fontWeight: 700, fontSize: 11, color: TXT3, letterSpacing: ".06em", textTransform: "uppercase" }}>
                  {groups[g].length} {t("Teams", "टीमें")}
                </span>
              </div>
              <div className="pts-table-wrap" style={{ background: PANEL, borderRadius: 20, border: `1px solid ${LINE}`, overflow: "hidden", boxShadow: "0 12px 34px rgba(0,0,0,.28)" }}>
                <div className="pts-inner">
                  <div className="pts-grid pts-head">
                    <div className="stick stick-pos">#</div>
                    <div className="left stick stick-team">Team</div>
                    <div>P</div>
                    <div>W</div>
                    <div>L</div>
                    <div>NR</div>
                    <div>NRR</div>
                    <div className="left">Form</div>
                    <div>Pts</div>
                  </div>
                  {groups[g].map((row: any, i: number, arr: any[]) => {
                    const pos = i + 1;
                    const inZone = pos <= 2;
                    const isZoneLast = pos === 2 && arr.length > 2;
                    const nrrNum = Number(row.nrr ?? 0);
                    const nrrStr = (nrrNum >= 0 ? "+" : "") + nrrNum.toFixed(3);
                    const posGrad =
                      pos === 1 ? "linear-gradient(135deg,#E8B23D,#FFD873)" :
                      pos === 2 ? "linear-gradient(135deg,#9AA3B0,#CBD2DB)" :
                      "rgba(255,255,255,.10)";
                    return (
                      <div key={row.team} className={`pts-grid pts-row2${inZone ? " qualify" : ""}${isZoneLast ? " qualify-last" : ""}`}>
                        <div className="stick stick-pos">
                          <span style={{ width: 30, height: 30, borderRadius: "50%", background: posGrad, display: "inline-flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-head)", fontWeight: 900, fontSize: 12, color: pos <= 2 ? "#0C1D33" : TXT3, boxShadow: pos <= 2 ? "0 2px 6px rgba(0,0,0,.3)" : "none" }}>{pos}</span>
                        </div>
                        <div className="left stick stick-team">
                          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            <TeamBadge name={row.team} color={color(row.team)} logo={logoOf(row.team)} size={44} fontSize={9} />
                            <div style={{ fontFamily: "var(--font-head)", fontWeight: 800, fontSize: 15, color: "#fff" }}>{row.team}</div>
                          </div>
                        </div>
                        <div style={{ color: TXT2 }}>{row.played}</div>
                        <div style={{ color: GREEN, fontWeight: 700 }}>{row.won}</div>
                        <div style={{ color: RED }}>{row.lost}</div>
                        <div style={{ color: TXT3 }}>{row.noResult}</div>
                        <div style={{ fontFamily: "var(--font-head)", fontWeight: 700, color: nrrStr.startsWith("+") ? GREEN : RED }}>{nrrStr}</div>
                        <div className="left"><FormGuide form={Array.isArray(row.form) ? row.form : []} /></div>
                        <div style={{ fontFamily: "var(--font-head)", fontWeight: 900, fontSize: 18, color: ORANGE }}>{row.points}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}

          {groups && (
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginTop: 2, fontSize: 13, color: TXT3 }}>
              <span style={{ width: 12, height: 12, borderRadius: 3, background: "rgba(49,197,107,0.6)" }} />
              {t("Top 2 of each group reach the semi finals", "हर group की top 2 टीमें semi final में")}
            </div>
          )}
        </div>
      </section>

      <BCPLFooter />

      {/* Floating register button */}
      <Link href="/register" style={{ position: "fixed", bottom: 28, right: 28, zIndex: 900, background: "linear-gradient(135deg,#FF7A29,#D95E10)", border: "none", borderRadius: 12, color: "#fff", fontFamily: "var(--font-head)", fontWeight: 900, fontSize: 13, letterSpacing: ".06em", padding: "14px 22px", textTransform: "uppercase", textDecoration: "none", display: "flex", alignItems: "center", gap: 8, boxShadow: "0 8px 32px rgba(255,122,41,0.45)", clipPath: "polygon(0 0,calc(100% - 8px) 0,100% 8px,100% 100%,0 100%)", transition: "opacity .2s, transform .15s" }} onMouseEnter={e => { e.currentTarget.style.opacity = ".9"; e.currentTarget.style.transform = "translateY(-2px)"; }} onMouseLeave={e => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.transform = "translateY(0)"; }}>
        {t("REGISTER NOW →", "अभी रजिस्टर करें →")}
      </Link>
    </div>
  );
}

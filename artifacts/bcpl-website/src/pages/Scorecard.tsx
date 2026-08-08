import { useState, useEffect } from "react";
import { useRoute, Link } from "wouter";
import { BCPLFooter } from "../components/BCPLFooter";
import { SiteHeader } from "../components/SiteHeader";
import { Skel, SkelRows } from "../components/Skel";
import { getCommunityScorecard, type CommunityScorecard } from "../lib/api";
import { MatchMoments, MatchDayPoll } from "../components/MatchExtras";
import { useLang } from "../lib/i18n";

/* ─── Palette (LIGHTENED DARK theme — mirrors MatchCenter) ─────────── */
const PAGE      = "#1B2E52";
const PANEL     = "#24396B";
const PANEL_2   = "#2C3A5E";
const PANEL_3   = "#1F3159";
const LINE      = "rgba(255,255,255,.18)";
const LINE_SOFT = "rgba(255,255,255,.10)";
const TXT       = "rgba(255,255,255,.92)";
const TXT2      = "rgba(255,255,255,.80)";
const TXT3      = "rgba(255,255,255,.64)";
const ORANGE    = "#FF7A29";
const GOLD      = "#E8B23D";
const GREEN     = "#31C56B";
const VIOLET    = "#9B7CFF";
const AMBER     = "#E8B23D";
const RED       = "#F26158";

const strikeRate = (runs: number, balls: number) =>
  balls > 0 ? ((runs / balls) * 100).toFixed(1) : "0.0";

/* Over display like "7.4 ov" from overs + balls. */
const ovStr = (overs: number, balls: number) => `${overs ?? 0}.${balls ?? 0}`;

type Ball = CommunityScorecard["innings"][number]["recentBalls"][number];

/* A single recent-ball dot: 4 green, 6 violet, W red, wide/no-ball amber. */
function BallDot({ b }: { b: Ball }) {
  let bg = "rgba(255,255,255,.12)";
  let fg = TXT;
  let label = String(b.runs);
  if (b.isWicket) { bg = RED; fg = "#fff"; label = "W"; }
  else if (b.extraType === "wide") { bg = AMBER; fg = "#0C1D33"; label = "wd"; }
  else if (b.extraType === "no_ball") { bg = AMBER; fg = "#0C1D33"; label = "nb"; }
  else if (b.runs === 6) { bg = VIOLET; fg = "#fff"; label = "6"; }
  else if (b.runs === 4) { bg = GREEN; fg = "#0C1D33"; label = "4"; }
  else if (b.runs === 0) { label = "•"; }
  return (
    <span
      title={b.commentary || `${b.over}`}
      style={{
        minWidth: 30, height: 30, padding: "0 6px", borderRadius: "50%",
        background: bg, color: fg, display: "inline-flex", alignItems: "center",
        justifyContent: "center", fontFamily: "var(--font-head)", fontWeight: 800,
        fontSize: 12, flexShrink: 0,
      }}
    >
      {label}
    </span>
  );
}

export function Scorecard() {
  const { t } = useLang();
  const [, params] = useRoute("/scorecard/:id");
  const id = params?.id ?? "";
  const [data, setData] = useState<CommunityScorecard | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const status = data?.match.status;

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    const load = () => {
      getCommunityScorecard(id)
        .then((d) => { if (!cancelled) { setData(d); setNotFound(false); } })
        .catch((e: any) => { if (!cancelled && e?.status === 404) setNotFound(true); })
        .finally(() => { if (!cancelled) setLoaded(true); });
    };
    load();
    // Poll every 10s while the match is not completed. Once status flips to
    // "completed", this effect re-runs (status is a dependency) and the guard
    // below skips scheduling a new interval, so polling stops.
    if (status === "completed") return () => { cancelled = true; };
    const iv = setInterval(load, 10000);
    return () => { cancelled = true; clearInterval(iv); };
  }, [id, status]);

  const thBase = {
    padding: "8px 8px", color: GOLD, fontWeight: 700, fontSize: 11,
    fontFamily: "var(--font-head)", letterSpacing: ".06em", textTransform: "uppercase" as const,
  };

  return (
    <div style={{ background: PAGE, minHeight: "100vh", color: TXT, fontFamily: "'Inter',sans-serif", overflowX: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@700;800;900&family=Inter:wght@400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes liveBlip { 0%,100% { opacity:1; } 50% { opacity:0.15; } }
        .wrap { max-width: 900px; margin: 0 auto; padding: 0 16px; }
        @media(min-width:768px){ .wrap { padding: 0 24px; } }
        .sc-table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; scrollbar-width: thin; }
        .section-label { font-family: 'Inter', sans-serif; font-weight: 800; font-size: 11px; letter-spacing: 0.15em; color: #FF7A29; text-transform: uppercase; display: flex; align-items: center; gap: 10px; margin-bottom: 14px; }
        .section-label::before { content: ''; display: inline-block; width: 24px; height: 2px; background: #FF7A29; }
        .section-title { font-family: 'Barlow Condensed','Mukta','Montserrat',sans-serif; font-weight: 800; line-height: .95; letter-spacing: .015em; }
      `}</style>

      <SiteHeader active="Matches" />

      <section style={{ padding: "clamp(84px,12vh,120px) 0 clamp(40px,6vw,60px)" }}>
        <div className="wrap">
          {/* Loading */}
          {!loaded && (
            <div role="status" aria-label={t("Loading…", "लोड हो रहा है…")}>
              <Skel w="60%" h={28} />
              <div style={{ height: 18 }} />
              <SkelRows n={5} />
            </div>
          )}

          {/* Friendly 404 */}
          {loaded && notFound && (
            <div style={{ textAlign: "center", padding: "clamp(48px,8vw,72px) 24px", background: PANEL, borderRadius: 20, border: `1px solid ${LINE}`, boxShadow: "0 12px 34px rgba(0,0,0,.28)" }}>
              <div style={{ fontSize: 64, fontWeight: 900, color: ORANGE, fontFamily: "'Montserrat',sans-serif", marginBottom: 8 }}>404</div>
              <div className="section-title" style={{ fontSize: 26, color: "#fff", marginBottom: 8, textTransform: "uppercase" }}>
                {t("Match not found", "मैच नहीं मिला")}
              </div>
              <p style={{ color: TXT3, fontSize: 15, maxWidth: 380, margin: "0 auto 20px" }}>
                {t("This scorecard link may be wrong or the match may have been removed.", "यह स्कोरकार्ड लिंक गलत हो सकता है या मैच हटा दिया गया हो सकता है।")}
              </p>
              <Link href="/match-center" style={{ display: "inline-block", background: ORANGE, color: "#fff", padding: "12px 28px", borderRadius: 10, fontWeight: 900, fontSize: 13, letterSpacing: ".06em", textDecoration: "none", fontFamily: "'Montserrat',sans-serif" }}>
                {t("← Match Center", "← मैच सेंटर")}
              </Link>
            </div>
          )}

          {/* Scorecard */}
          {loaded && !notFound && data && (() => {
            const m = data.match;
            const inns = data.innings;
            const latest = inns.length > 0 ? inns[inns.length - 1] : null;
            const isLive = m.status === "live" || m.status === "innings2";
            const isCompleted = m.status === "completed";
            // 2nd-innings chase line: runs needed to reach target.
            const chaseLine = latest && latest.target != null && !isCompleted
              ? Math.max(0, latest.target - latest.totalRuns)
              : null;

            return (
              <>
                {/* Meta line */}
                <div className="section-label">
                  {isLive ? (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, color: RED }}>
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: RED, display: "inline-block", animation: "liveBlip 1.2s infinite" }} />
                      {t("LIVE", "लाइव")}
                    </span>
                  ) : isCompleted ? t("Result", "परिणाम") : t("Scorecard", "स्कोरकार्ड")}
                </div>
                <h1 className="section-title" style={{ fontSize: "clamp(26px,5vw,44px)", color: "#fff", textTransform: "uppercase", marginBottom: 8 }}>
                  {m.team1} <span style={{ color: TXT3, fontWeight: 400 }}>vs</span> {m.team2}
                </h1>
                <div style={{ color: TXT3, fontSize: 14, marginBottom: 24 }}>
                  {m.venue ? <span>{m.venue} · </span> : null}
                  {t(`${m.oversLimit} overs`, `${m.oversLimit} ओवर`)}
                </div>

                {/* Big score header for the latest innings */}
                {latest && (
                  <div style={{ background: PANEL, border: `1px solid ${LINE}`, borderRadius: 16, padding: "20px 20px", marginBottom: 20, boxShadow: "0 12px 34px rgba(0,0,0,.28)" }}>
                    <div style={{ fontFamily: "'Montserrat',sans-serif", fontWeight: 800, fontSize: 14, color: TXT2, marginBottom: 6 }}>
                      {latest.battingTeam}
                    </div>
                    <div style={{ fontFamily: "var(--font-head)", fontWeight: 900, fontSize: "clamp(34px,8vw,56px)", color: "#fff", lineHeight: 1 }}>
                      {latest.totalRuns}/{latest.totalWickets}
                      <span style={{ fontSize: "clamp(16px,3vw,22px)", color: TXT3, fontWeight: 700, marginLeft: 10 }}>
                        ({ovStr(latest.overs, latest.balls)} ov)
                      </span>
                    </div>
                    {chaseLine != null && (
                      <div style={{ marginTop: 10, fontFamily: "'Montserrat',sans-serif", fontWeight: 700, fontSize: 15, color: GOLD }}>
                        {t(`${chaseLine} runs needed`, `${chaseLine} रन चाहिए`)}
                        <span style={{ color: TXT3, fontWeight: 500 }}> · {t("Target", "लक्ष्य")} {latest.target}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Result banner */}
                {isCompleted && m.resultDesc && (
                  <div style={{ background: "rgba(49,197,107,0.12)", border: `1px solid rgba(49,197,107,0.45)`, borderRadius: 14, padding: "14px 18px", marginBottom: 24, color: GREEN, fontFamily: "'Montserrat',sans-serif", fontWeight: 800, fontSize: 16, textAlign: "center" }}>
                    {m.resultDesc}
                  </div>
                )}

                {/* Match moments (highlights + optional clips) */}
                <MatchMoments matchId={id} live={isLive} />

                {/* Inline match-day fan poll (only if an open poll exists) */}
                <MatchDayPoll />

                {/* Recent balls (latest innings) */}
                {latest && latest.recentBalls.length > 0 && (
                  <div style={{ background: PANEL_2, border: `1px solid ${LINE_SOFT}`, borderRadius: 14, padding: "14px 16px", marginBottom: 24 }}>
                    <div style={{ fontFamily: "var(--font-head)", fontWeight: 700, fontSize: 11, letterSpacing: ".06em", textTransform: "uppercase", color: GOLD, marginBottom: 10 }}>
                      {t("Recent Balls", "हाल की गेंदें")}
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {latest.recentBalls.map((b, i) => <BallDot key={i} b={b} />)}
                    </div>
                  </div>
                )}

                {/* Per-innings batting & bowling */}
                <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                  {inns.map((inn, idx) => (
                    <div key={idx} style={{ background: PANEL_3, border: `1px solid ${LINE_SOFT}`, borderRadius: 14, padding: "16px 16px 14px" }}>
                      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
                        <span style={{ fontFamily: "var(--font-head)", fontWeight: 800, fontSize: 14, color: "#fff" }}>
                          {inn.inningsNumber === 1 ? t("1st Innings", "पहली पारी") : t("2nd Innings", "दूसरी पारी")} — {inn.battingTeam}
                        </span>
                        <span style={{ fontFamily: "var(--font-head)", fontWeight: 900, fontSize: 20, color: ORANGE }}>
                          {inn.totalRuns}/{inn.totalWickets}
                          <span style={{ fontSize: 13, color: TXT3, fontWeight: 700 }}> ({ovStr(inn.overs, inn.balls)} ov)</span>
                        </span>
                      </div>

                      {/* Batting */}
                      {inn.batting.length > 0 ? (
                        <div className="sc-table-wrap">
                          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 420 }}>
                            <thead>
                              <tr style={{ borderBottom: `2px solid ${LINE}` }}>
                                {["Batter", "R", "B", "4s", "6s", "SR"].map((h) => (
                                  <th key={h} style={{ ...thBase, textAlign: h === "Batter" ? "left" : "right" }}>{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {inn.batting.map((b, i) => (
                                <tr key={i} style={{ borderBottom: `1px solid ${LINE_SOFT}` }}>
                                  <td style={{ padding: "9px 8px", color: b.out ? TXT2 : "#fff", fontWeight: b.out ? 500 : 700 }}>
                                    {b.name}
                                    <span style={{ color: TXT3, fontSize: 11, fontWeight: 500 }}> {b.out ? `(${b.out})` : t("(not out)", "(नाबाद)")}</span>
                                  </td>
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

                      {/* Extras */}
                      {inn.batting.length > 0 && (
                        <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${LINE_SOFT}`, fontSize: 13, color: TXT2 }}>
                          <span style={{ fontFamily: "var(--font-head)", fontWeight: 700, color: GOLD, letterSpacing: ".04em", textTransform: "uppercase", fontSize: 11 }}>{t("Extras", "अतिरिक्त")} </span>
                          <span style={{ fontWeight: 700, color: "#fff" }}>{inn.extras}</span>
                        </div>
                      )}

                      {/* Bowling */}
                      {inn.bowling.length > 0 && (
                        <div className="sc-table-wrap" style={{ marginTop: 16 }}>
                          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 360 }}>
                            <thead>
                              <tr style={{ borderBottom: `2px solid ${LINE}` }}>
                                {["Bowler", "O", "R", "W"].map((h) => (
                                  <th key={h} style={{ ...thBase, textAlign: h === "Bowler" ? "left" : "right" }}>{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {inn.bowling.map((b, i) => (
                                <tr key={i} style={{ borderBottom: `1px solid ${LINE_SOFT}` }}>
                                  <td style={{ padding: "9px 8px", color: "#fff", fontWeight: 700 }}>{b.name}</td>
                                  <td style={{ padding: "9px 8px", textAlign: "right", color: TXT2 }}>{b.overs}</td>
                                  <td style={{ padding: "9px 8px", textAlign: "right", color: "#fff", fontWeight: 600 }}>{b.runs}</td>
                                  <td style={{ padding: "9px 8px", textAlign: "right", color: b.wickets > 0 ? RED : TXT3, fontWeight: b.wickets > 0 ? 800 : 400 }}>{b.wickets}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            );
          })()}
        </div>
      </section>

      <BCPLFooter />
    </div>
  );
}

export default Scorecard;

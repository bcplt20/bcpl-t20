import React, { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { BCPLFooter } from '../components/BCPLFooter';
import { SiteHeader } from '../components/SiteHeader';
import { StickyRegisterCTA } from '../components/StickyRegisterCTA';
import { getPointsTable, getTeams } from '../lib/api';
import { useLang } from '../lib/i18n';

/* Team logos may be base64 data URLs, absolute http(s) URLs, or repo-relative
   paths (e.g. bcpl-assets/logos/…). Mirror TeamsPage's asset() helper. */
const asset = (url: string) =>
  !url ? "" : url.startsWith("data:") || url.startsWith("http") ? url : import.meta.env.BASE_URL + url.replace(/^\//, "");
const normTeam = (name: string) => (name || "").trim().toLowerCase();
const initials = (name: string) =>
  (name || "").split(" ").map(w => w[0]).join("").slice(0, 3).toUpperCase();

/* Circular team badge: logo when available (keeps the colored ring), initials
   fallback when there is no logo or the image fails to load. */
function TeamBadge({ name, color, logo }: { name: string; color: string; logo?: string }) {
  const [broken, setBroken] = React.useState(false);
  const showLogo = Boolean(logo) && !broken;
  return (
    <span style={{
      width: 30, height: 30, borderRadius: "50%",
      background: showLogo ? "rgba(255,255,255,0.96)" : `${color}22`,
      border: `2px solid ${color}`, display: "inline-flex", alignItems: "center",
      justifyContent: "center", overflow: "hidden", flexShrink: 0,
      fontFamily: "Montserrat,sans-serif", fontWeight: 800, fontSize: 9, color,
    }}>
      {showLogo
        ? <img src={logo} alt={name} onError={() => setBroken(true)} style={{ width: "82%", height: "82%", objectFit: "contain" }} />
        : initials(name)}
    </span>
  );
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Montserrat:wght@700;800;900&display=swap');
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
.wrap { max-width: 1280px; margin: 0 auto; padding: 0 16px; }
@media(min-width:640px) { .wrap { padding: 0 24px; } }
@media(min-width:768px) { .wrap { padding: 0 32px; } }
.slbl { font-family: Montserrat, sans-serif; font-weight: 800; font-size: 11px; letter-spacing: .15em; color: #FF7A29; text-transform: uppercase; display: flex; align-items: center; gap: 10px; margin-bottom: 14px; }
.slbl::before { content: ''; display: inline-block; width: 20px; height: 2px; background: #FF7A29; }
.shimmer-gold { background: linear-gradient(90deg,#E8B23D,#FFD700,#E8B23D); background-size: 200% auto; -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; animation: shimmer 3s linear infinite; }
@keyframes shimmer { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }

/* Desktop: full table */
.pts-table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; scrollbar-width: thin; }
.pts-table { width: 100%; border-collapse: collapse; min-width: 640px; }
.pts-header { background: rgba(255,122,41,0.06); }
.pts-header th { padding: 12px 14px; text-align: left; font-family: Montserrat, sans-serif; font-weight: 700; font-size: 10px; color: rgba(255,255,255,0.35); text-transform: uppercase; letter-spacing: .1em; white-space: nowrap; }
.pts-row { border-bottom: 1px solid rgba(255,255,255,0.05); transition: background 0.15s; }
.pts-row:hover { background: rgba(255,122,41,0.04); }
.pts-row td { padding: 14px; font-family: Inter, sans-serif; font-size: 13px; color: rgba(255,255,255,0.6); }

/* Mobile: collapsed rows (user's explicit direction) */
@media(max-width:767px) {
  .pts-table { display: none; }
  .pts-mobile { display: block; }
}
@media(min-width:768px) {
  .pts-mobile { display: none; }
}
.pts-mobile-row { background: linear-gradient(135deg,rgba(15,34,71,0.9),rgba(10,22,46,0.85)); backdrop-filter: blur(24px); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 16px; margin-bottom: 10px; cursor: pointer; transition: border-color 0.2s, box-shadow 0.2s; }
.pts-mobile-row:hover { border-color: rgba(255,122,41,0.35); }
.pts-mobile-row.expanded { border-color: rgba(255,122,41,0.5); box-shadow: 0 8px 24px rgba(0,0,0,0.3); }

/* Floating register button */
.float-reg-btn { position: fixed; bottom: 28px; right: 28px; z-index: 900; background: linear-gradient(135deg,#FF7A29,#D95E10); border: none; border-radius: 12px; color: #fff; font-family: Montserrat, sans-serif; font-weight: 900; font-size: 13px; letter-spacing: .06em; cursor: pointer; padding: 14px 22px; text-transform: uppercase; text-decoration: none; display: flex; align-items: center; gap: 8px; box-shadow: 0 8px 32px rgba(255,122,41,0.45); clip-path: polygon(0 0,calc(100% - 8px) 0,100% 8px,100% 100%,0 100%); transition: opacity .2s, transform .15s; }
.float-reg-btn:hover { opacity: .9; transform: translateY(-2px); }
@media(max-width:1023px){ .float-reg-btn { display:none; } }
@keyframes floatPulse { 0%,100% { box-shadow: 0 8px 32px rgba(255,122,41,0.45),0 0 0 0 rgba(255,122,41,0.4); } 50% { box-shadow: 0 8px 40px rgba(255,122,41,0.6),0 0 0 8px rgba(255,122,41,0); } }
.float-reg-pulse { animation: floatPulse 2.5s ease-in-out infinite; }
@media(max-width:639px) { .float-reg-btn { bottom: 16px; right: 16px; padding: 12px 16px; font-size: 12px; } }
`;

interface TeamRow {
  pos: number;
  name: string;
  p: number;
  w: number;
  l: number;
  nr: number;
  nrr: string;
  pts: number;
}

export function PointsTable() {
  const { t } = useLang();
  const [tableRows, setTableRows] = useState<TeamRow[]>([]);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [teamColors, setTeamColors] = useState<Record<string, string>>({});
  const [teamLogos,  setTeamLogos]  = useState<Record<string, string>>({});

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

  const color  = (team: string) => teamColors[normTeam(team)] || "#FF7A29";
  const logoOf = (team: string) => teamLogos[normTeam(team)] || "";

  useEffect(() => {
    getPointsTable(5).then(d => {
      const rows: TeamRow[] = (d.table ?? []).map((r: any, i: number) => ({
        pos: i + 1,
        name: r.team,
        p: r.played,
        w: r.won,
        l: r.lost,
        nr: r.noResult,
        nrr: (r.nrr >= 0 ? "+" : "") + Number(r.nrr).toFixed(3),
        pts: r.points,
      }));
      setTableRows(rows);
    }).catch(() => {});
  }, []);

  return (
    <div style={{ background: "#06101E", color: "#F0EDE8", minHeight: "100vh", fontFamily: "Inter,sans-serif", overflowX: "hidden" }}>
      <style>{CSS}</style>
      <SiteHeader active="Points Table" />

      {/* HERO */}
      <section style={{ padding: "clamp(48px,6vw,72px) 0 clamp(32px,4vw,48px)", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 60% 50% at 50% 0%,rgba(255,122,41,0.06) 0%,transparent 70%)", pointerEvents: "none" }} />
        <div className="wrap" style={{ position: "relative", zIndex: 1, textAlign: "center" }}>
          <div className="slbl" style={{ justifyContent: "center" }}>
            {t("Season 5 Standings", "सीज़न 5 स्टैंडिंग")}
          </div>
          <h1 style={{ fontFamily: "Montserrat,sans-serif", fontWeight: 900, fontSize: "clamp(32px,6vw,64px)", lineHeight: 1.05, color: "#fff", textTransform: "uppercase", marginBottom: 12 }}>
            {t("POINTS", "पॉइंट्स")}<br />
            <span className="shimmer-gold">{t("TABLE", "टेबल")}</span>
          </h1>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "clamp(14px,2vw,16px)", lineHeight: 1.7, maxWidth: 480, margin: "0 auto" }}>
            {t("Live standings update as Season 5 matches are played.", "Season 5 के matches के साथ live standings update होते हैं।")}
          </p>
        </div>
      </section>

      <div className="wrap" style={{ paddingBottom: 100 }}>

        {/* EMPTY STATE */}
        {tableRows.length === 0 && (
          <div style={{ textAlign: "center", padding: "clamp(60px,10vw,100px) 20px" }}>
            <div style={{ fontSize: 64, marginBottom: 20 }}>🏆</div>
            <h2 style={{ fontFamily: "Montserrat,sans-serif", fontWeight: 900, fontSize: "clamp(22px,4vw,36px)", color: "#fff", marginBottom: 12 }}>
              {t("Standings Coming Soon", "Standings जल्द आएंगे")}
            </h2>
            <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 15, maxWidth: 440, margin: "0 auto 28px", lineHeight: 1.7 }}>
              {t("Season 5 tournament begins Sep 2026. The points table will update here in real time once the first match is played.", "Season 5 टूर्नामेंट Sep 2026 में शुरू होगा। पहले match के बाद points table यहाँ real time में update होगी।")}
            </p>
            <Link href="/register" className="float-reg-btn" style={{ position: "static", animation: "none", display: "inline-flex", boxShadow: "0 6px 24px rgba(255,122,41,0.35)" }}>
              {t("🏏 Register for Season 5 →", "🏏 Season 5 के लिए रजिस्टर करें →")}
            </Link>
          </div>
        )}

        {/* TABLE — DESKTOP */}
        {tableRows.length > 0 && (
          <>
            <div style={{ background: "linear-gradient(135deg,rgba(15,34,71,0.9),rgba(10,22,46,0.85))", backdropFilter: "blur(24px)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, overflow: "hidden", marginBottom: 32 }}>
              <div className="pts-table-wrap">
                <table className="pts-table">
                  <thead className="pts-header">
                    <tr>
                      <th style={{ textAlign: "center" }}>#</th>
                      <th>{t("Team", "टीम")}</th>
                      <th style={{ textAlign: "center" }}>{t("P", "P")}</th>
                      <th style={{ textAlign: "center" }}>{t("W", "W")}</th>
                      <th style={{ textAlign: "center" }}>{t("L", "L")}</th>
                      <th style={{ textAlign: "center" }}>{t("NR", "NR")}</th>
                      <th style={{ textAlign: "center" }}>{t("NRR", "NRR")}</th>
                      <th style={{ textAlign: "center" }}>{t("Pts", "Pts")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tableRows.map((row, i) => (
                      <tr key={i} className="pts-row">
                        <td style={{ textAlign: "center" }}>
                          <div style={{
                            width: 30, height: 30, borderRadius: "50%",
                            background: row.pos === 1 ? "linear-gradient(135deg,#E8B23D,#FFD700)" : row.pos === 2 ? "linear-gradient(135deg,#9CA3AF,#D1D5DB)" : row.pos === 3 ? "linear-gradient(135deg,#B45309,#D97706)" : "rgba(255,255,255,0.06)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontFamily: "Montserrat,sans-serif", fontWeight: 900, fontSize: 12,
                            color: row.pos <= 3 ? "#060E1C" : "rgba(255,255,255,0.4)",
                            margin: "0 auto"
                          }}>{row.pos}</div>
                        </td>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <TeamBadge name={row.name} color={color(row.name)} logo={logoOf(row.name)} />
                            <div style={{ fontFamily: "Montserrat,sans-serif", fontWeight: 700, fontSize: 14, color: "#fff" }}>{row.name}</div>
                          </div>
                        </td>
                        <td style={{ textAlign: "center", color: "rgba(255,255,255,0.6)" }}>{row.p}</td>
                        <td style={{ textAlign: "center", color: "#22C55E", fontWeight: 600 }}>{row.w}</td>
                        <td style={{ textAlign: "center", color: "#E8493F" }}>{row.l}</td>
                        <td style={{ textAlign: "center", color: "rgba(255,255,255,0.4)" }}>{row.nr}</td>
                        <td style={{ textAlign: "center", fontFamily: "Montserrat,sans-serif", fontWeight: 700, color: row.nrr.startsWith("+") ? "#22C55E" : "#E8493F" }}>{row.nrr}</td>
                        <td style={{ textAlign: "center", fontFamily: "Montserrat,sans-serif", fontWeight: 900, fontSize: 16, color: "#FF7A29" }}>{row.pts}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* MOBILE COLLAPSED ROWS (user's explicit direction: "1 Delhi — 12 pts" expand → P/W/L/NRR) */}
            <div className="pts-mobile">
              {tableRows.map((row, i) => {
                const isExpanded = expanded === i;
                return (
                  <div key={i} className={`pts-mobile-row ${isExpanded ? "expanded" : ""}`} onClick={() => setExpanded(isExpanded ? null : i)}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1 }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: "50%",
                          background: row.pos === 1 ? "linear-gradient(135deg,#E8B23D,#FFD700)" : row.pos === 2 ? "linear-gradient(135deg,#9CA3AF,#D1D5DB)" : row.pos === 3 ? "linear-gradient(135deg,#B45309,#D97706)" : "rgba(255,255,255,0.06)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontFamily: "Montserrat,sans-serif", fontWeight: 900, fontSize: 13,
                          color: row.pos <= 3 ? "#060E1C" : "rgba(255,255,255,0.4)",
                          flexShrink: 0
                        }}>{row.pos}</div>
                        <TeamBadge name={row.name} color={color(row.name)} logo={logoOf(row.name)} />
                        <div style={{ fontFamily: "Montserrat,sans-serif", fontWeight: 800, fontSize: 15, color: "#fff", flex: 1 }}>{row.name}</div>
                      </div>
                      <div style={{ fontFamily: "Montserrat,sans-serif", fontWeight: 900, fontSize: 18, color: "#FF7A29", flexShrink: 0 }}>
                        {row.pts} {t("pts", "pts")}
                      </div>
                    </div>
                    {isExpanded && (
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginTop: 14, paddingTop: 14, borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                        <div style={{ textAlign: "center" }}>
                          <div style={{ fontFamily: "Montserrat,sans-serif", fontWeight: 700, fontSize: 10, color: "rgba(255,255,255,0.35)", letterSpacing: ".1em", marginBottom: 4 }}>{t("P", "P")}</div>
                          <div style={{ fontFamily: "Montserrat,sans-serif", fontWeight: 800, fontSize: 16, color: "rgba(255,255,255,0.6)" }}>{row.p}</div>
                        </div>
                        <div style={{ textAlign: "center" }}>
                          <div style={{ fontFamily: "Montserrat,sans-serif", fontWeight: 700, fontSize: 10, color: "rgba(255,255,255,0.35)", letterSpacing: ".1em", marginBottom: 4 }}>{t("W", "W")}</div>
                          <div style={{ fontFamily: "Montserrat,sans-serif", fontWeight: 800, fontSize: 16, color: "#22C55E" }}>{row.w}</div>
                        </div>
                        <div style={{ textAlign: "center" }}>
                          <div style={{ fontFamily: "Montserrat,sans-serif", fontWeight: 700, fontSize: 10, color: "rgba(255,255,255,0.35)", letterSpacing: ".1em", marginBottom: 4 }}>{t("L", "L")}</div>
                          <div style={{ fontFamily: "Montserrat,sans-serif", fontWeight: 800, fontSize: 16, color: "#E8493F" }}>{row.l}</div>
                        </div>
                        <div style={{ textAlign: "center" }}>
                          <div style={{ fontFamily: "Montserrat,sans-serif", fontWeight: 700, fontSize: 10, color: "rgba(255,255,255,0.35)", letterSpacing: ".1em", marginBottom: 4 }}>{t("NRR", "NRR")}</div>
                          <div style={{ fontFamily: "Montserrat,sans-serif", fontWeight: 800, fontSize: 14, color: row.nrr.startsWith("+") ? "#22C55E" : "#E8493F" }}>{row.nrr}</div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}

      </div>

      <StickyRegisterCTA />
      <BCPLFooter />

      {/* Floating register button */}
      <Link href="/register" className="float-reg-btn float-reg-pulse">
        {t("🏏 REGISTER NOW →", "🏏 अभी रजिस्टर करें →")}
      </Link>
    </div>
  );
}

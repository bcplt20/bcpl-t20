import React, { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { BCPLFooter } from '../components/BCPLFooter';
import { SiteHeader } from '../components/SiteHeader';
import { StickyRegisterCTA } from '../components/StickyRegisterCTA';
import { getPointsTable, getTeams, getMatches } from '../lib/api';
import { useLang } from '../lib/i18n';
import { IcoTrophy } from '../lib/icons';
import { groupOf } from '../lib/teamMeta';

/* ─── Palette (LIGHTENED DARK theme) ─────────────────────────────── */
const PAGE      = "#1B2E52";
const PANEL     = "#24396B";
const PANEL_2   = "#2C3A5E";
const LINE      = "rgba(255,255,255,.18)";
const LINE_SOFT = "rgba(255,255,255,.10)";
const TXT       = "rgba(255,255,255,.92)";
const TXT2      = "rgba(255,255,255,.80)";
const TXT3      = "rgba(255,255,255,.64)";
const ORANGE    = "#FF7A29";
const GOLD      = "#E8B23D";
const GREEN     = "#31C56B";
const RED       = "#F26158";

/* Team logos may be base64 data URLs, absolute http(s) URLs, or repo-relative
   paths (e.g. bcpl-assets/logos/…). Mirror TeamsPage's asset() helper. */
const asset = (url: string) =>
  !url ? "" : url.startsWith("data:") || url.startsWith("http") ? url : import.meta.env.BASE_URL + url.replace(/^\//, "");
const normTeam = (name: string) => (name || "").trim().toLowerCase();
const initials = (name: string) =>
  (name || "").split(" ").map(w => w[0]).join("").slice(0, 3).toUpperCase();

/* Number of teams that make the qualification zone (top 2 per group). */
const QUALIFY_TOP = 2;

/* Circular team badge: logo when available (keeps the colored ring), initials
   fallback when there is no logo or the image fails to load. */
function TeamBadge({ name, color, logo, size = 32 }: { name: string; color: string; logo?: string; size?: number }) {
  const [broken, setBroken] = React.useState(false);
  const showLogo = Boolean(logo) && !broken;
  // With a real logo: transparent PNG straight on the row, NO backing circle.
  // Only the initials fallback keeps a coloured ring so it stays legible.
  return (
    <span style={{
      width: size, height: size,
      borderRadius: showLogo ? 0 : "50%",
      background: showLogo ? "transparent" : `${color}33`,
      border: showLogo ? "none" : `2px solid ${color}`,
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      overflow: "hidden", flexShrink: 0,
      fontFamily: "var(--font-head)", fontWeight: 800, fontSize: size * 0.34, color,
    }}>
      {showLogo
        ? <img loading="lazy" decoding="async" src={logo} alt={name} onError={() => setBroken(true)} style={{ width: "100%", height: "100%", objectFit: "contain", filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.45))" }} />
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
.slbl { font-family: var(--font-head); font-weight: 800; font-size: 11px; letter-spacing: .15em; color: #FF7A29; text-transform: uppercase; display: flex; align-items: center; gap: 10px; margin-bottom: 14px; }
.slbl::before { content: ''; display: inline-block; width: 20px; height: 2px; background: #FF7A29; }
.shimmer-gold { background: linear-gradient(90deg,#E8B23D,#FFD873,#E8B23D); background-size: 200% auto; -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; animation: shimmer 3s linear infinite; }
@keyframes shimmer { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }

/* Fit-to-width table — NO horizontal scroll at any width (owner request).
   Condensed columns (P W L NRR Pts) so the whole table fits 390px screens. */
.pts-table-wrap { overflow-x: hidden; }
.pts-table { width: 100%; border-collapse: collapse; table-layout: fixed; }
.pts-header th { padding: 12px 4px; text-align: center; font-family: var(--font-head); font-weight: 700; font-size: 11px; color: #E8B23D; text-transform: uppercase; letter-spacing: .06em; white-space: nowrap; background: ${PANEL_2}; border-bottom: 2px solid ${LINE}; }
.pts-header th.left { text-align: left; padding-left: 12px; }
.pts-row { border-bottom: 1px solid ${LINE_SOFT}; transition: background 0.15s; }
.pts-row:hover { background: rgba(255,122,41,0.08); }
.pts-row td { padding: 11px 4px; font-family: Inter, sans-serif; font-size: 14px; color: ${TXT2}; text-align: center; white-space: nowrap; }
.pts-row td.left { text-align: left; padding-left: 12px; }
.pts-row.qualify td { background: rgba(49,197,107,0.09); }
.pts-row.qualify:hover td { background: rgba(49,197,107,0.15); }
.pts-row.qualify-last td { border-bottom: 2px solid rgba(49,197,107,0.6); }

/* Column widths: position + team flex, stats are compact fixed cells. */
.pts-table col.c-pos  { width: 30px; }
.pts-table col.c-team { width: auto; }
.pts-table col.c-stat { width: 34px; }
.pts-table col.c-nrr  { width: 58px; }
.pts-table col.c-pts  { width: 42px; }
.pts-teamname { font-family: var(--font-head); font-weight: 800; font-size: 14px; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
@media(min-width:560px){
  .pts-header th { font-size: 12px; letter-spacing: .1em; padding: 13px 8px; }
  .pts-row td { font-size: 15px; padding: 13px 8px; }
  .pts-table col.c-pos  { width: 46px; }
  .pts-table col.c-stat { width: 48px; }
  .pts-table col.c-nrr  { width: 80px; }
  .pts-table col.c-pts  { width: 60px; }
  .pts-teamname { font-size: 16px; }
}

/* Group tabs — V3 pill style, only the active group's table is shown. */
.pts-tabs { display: flex; gap: 10px; margin-bottom: 24px; }
.pts-tab { flex: 1; max-width: 240px; cursor: pointer; font-family: var(--font-head); font-weight: 800; font-size: 15px; letter-spacing: .06em; text-transform: uppercase; color: ${TXT2}; background: ${PANEL}; border: 1px solid ${LINE}; border-radius: 14px; padding: 14px 16px; text-align: center; transition: background .18s, border-color .18s, color .18s; display: flex; align-items: center; justify-content: center; gap: 8px; }
.pts-tab:hover { border-color: rgba(255,122,41,0.5); color: #fff; }
.pts-tab.on { color: #fff; background: linear-gradient(135deg, rgba(255,122,41,0.22), rgba(232,178,61,0.12)); border-color: ${ORANGE}; box-shadow: 0 6px 20px rgba(255,122,41,0.22); }
@media(min-width:560px){ .pts-tab { font-size: 17px; padding: 15px 20px; } }

.qz-note { display: inline-flex; align-items: center; gap: 8px; font-family: Inter, sans-serif; font-size: 13px; color: ${TXT3}; }
.qz-swatch { width: 12px; height: 12px; border-radius: 3px; background: rgba(49,197,107,0.6); }

/* Floating register button (unchanged behaviour) */
.float-reg-btn { position: fixed; bottom: 28px; right: 28px; z-index: 900; background: linear-gradient(135deg,#FF7A29,#D95E10); border: none; border-radius: 12px; color: #fff; font-family: var(--font-head); font-weight: 900; font-size: 13px; letter-spacing: .06em; cursor: pointer; padding: 14px 22px; text-transform: uppercase; text-decoration: none; display: flex; align-items: center; gap: 8px; box-shadow: 0 8px 32px rgba(255,122,41,0.45); clip-path: polygon(0 0,calc(100% - 8px) 0,100% 8px,100% 100%,0 100%); transition: opacity .2s, transform .15s; }
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
  form: string[];
}

/* Position medallion — gold/silver/bronze for the podium, subtle chip below. */
function PosBadge({ pos, size = 32 }: { pos: number; size?: number }) {
  const grad =
    pos === 1 ? "linear-gradient(135deg,#E8B23D,#FFD873)" :
    pos === 2 ? "linear-gradient(135deg,#9AA3B0,#CBD2DB)" :
    "rgba(255,255,255,.10)";
  const ink = pos <= 2 ? "#0C1D33" : TXT3;
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", background: grad,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "var(--font-head)", fontWeight: 900, fontSize: size * 0.4, color: ink,
      margin: "0 auto", flexShrink: 0,
      boxShadow: pos <= 2 ? "0 2px 6px rgba(0,0,0,.3)" : "none",
    }}>{pos}</div>
  );
}

export function PointsTable() {
  const { t } = useLang();
  const [groupA, setGroupA] = useState<TeamRow[]>([]);
  const [groupB, setGroupB] = useState<TeamRow[]>([]);
  const [activeGroup, setActiveGroup] = useState<'A' | 'B'>('A');
  
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
    Promise.all([getPointsTable(5), getMatches(5), getTeams(5)]).then(([ptData, mData, teamData]) => {
      const tableData = ptData.table || [];
      const matchesData = mData.matches || [];
      const allTeams = teamData.teams || [];

      const grpASet = new Set<string>();
      const grpBSet = new Set<string>();

      /* Group each team by the canonical site mapping (Teams page / teamMeta
         groupOf) — the single source of truth. Seed from the full team list so
         every franchise appears in its group even before any match is played. */
      const assign = (name: string) => {
        const g = groupOf(name);
        if (g === 'A') grpASet.add(name);
        else if (g === 'B') grpBSet.add(name);
      };
      allTeams.forEach((tm: any) => assign(tm.name));
      /* Also seed from teams that appear in the points table (in case a team
         is missing from the teams list but has standings). */
      tableData.forEach((r: any) => assign(r.team));

      /* Match-schedule grouping is a secondary source: only used for a team the
         canonical map doesn't know (e.g. a newly-added franchise). */
      matchesData.forEach((m: any) => {
        if (!m.stage || m.stage === 'league') {
          [m.team1, m.team2].forEach((tn: string) => {
            if (!tn || groupOf(tn)) return; // known teams already placed canonically
            if (m.grp === 'A') grpASet.add(tn);
            else if (m.grp === 'B') grpBSet.add(tn);
          });
        }
      });

      const createRow = (name: string) => {
        const existing = tableData.find((r: any) => normTeam(r.team) === normTeam(name));
        if (existing) {
          return {
            name: existing.team,
            p: existing.played, w: existing.won, l: existing.lost, nr: existing.noResult,
            nrr: (existing.nrr >= 0 ? "+" : "") + Number(existing.nrr).toFixed(3),
            pts: existing.points, form: Array.isArray(existing.form) ? existing.form : [],
          };
        }
        return {
          name, p: 0, w: 0, l: 0, nr: 0, nrr: "+0.000", pts: 0, form: []
        };
      };

      const sortFn = (a: any, b: any) => {
        if (a.pts !== b.pts) return b.pts - a.pts;
        return parseFloat(b.nrr) - parseFloat(a.nrr);
      };

      const rowsA = Array.from(grpASet).map(createRow).sort(sortFn).map((r, i) => ({ ...r, pos: i + 1 }));
      const rowsB = Array.from(grpBSet).map(createRow).sort(sortFn).map((r, i) => ({ ...r, pos: i + 1 }));

      setGroupA(rowsA);
      setGroupB(rowsB);
    }).catch(() => {});
  }, []);

  const renderTable = (rows: TeamRow[]) => {
    if (rows.length === 0) {
      return (
        <div style={{ background: PANEL, border: `1px solid ${LINE}`, borderRadius: 20, padding: "40px 24px", textAlign: "center", color: TXT3, fontSize: 15 }}>
          {t("No standings for this group yet.", "इस group के लिए अभी standings नहीं हैं।")}
        </div>
      );
    }

    const showQualifyLine = rows.length > QUALIFY_TOP;

    return (
      <div style={{ background: PANEL, border: `1px solid ${LINE}`, borderRadius: 20, overflow: "hidden", boxShadow: "0 12px 34px rgba(0,0,0,.28)", marginBottom: 16 }}>
        <div className="pts-table-wrap">
          <table className="pts-table">
            <colgroup>
              <col className="c-pos" />
              <col className="c-team" />
              <col className="c-stat" />
              <col className="c-stat" />
              <col className="c-stat" />
              <col className="c-nrr" />
              <col className="c-pts" />
            </colgroup>
            <thead>
              <tr className="pts-header">
                <th>#</th>
                <th className="left">{t("Team", "टीम")}</th>
                <th>{t("P", "P")}</th>
                <th>{t("W", "W")}</th>
                <th>{t("L", "L")}</th>
                <th>{t("NRR", "NRR")}</th>
                <th>{t("Pts", "Pts")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => {
                const inZone = row.pos <= QUALIFY_TOP;
                const isZoneLast = showQualifyLine && row.pos === QUALIFY_TOP;
                return (
                  <tr key={i} className={`pts-row${inZone ? " qualify" : ""}${isZoneLast ? " qualify-last" : ""}`}>
                    <td><PosBadge pos={row.pos} size={26} /></td>
                    <td className="left">
                      <div style={{ display: "flex", alignItems: "center", gap: 9, minWidth: 0 }}>
                        <TeamBadge name={row.name} color={color(row.name)} logo={logoOf(row.name)} size={34} />
                        <div className="pts-teamname">{row.name}</div>
                      </div>
                    </td>
                    <td>{row.p}</td>
                    <td style={{ color: GREEN, fontWeight: 700 }}>{row.w}</td>
                    <td style={{ color: RED }}>{row.l}</td>
                    <td style={{ fontFamily: "var(--font-head)", fontWeight: 700, color: row.nrr.startsWith("+") ? GREEN : RED }}>{row.nrr}</td>
                    <td style={{ fontFamily: "var(--font-head)", fontWeight: 900, fontSize: 17, color: ORANGE }}>{row.pts}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const isEmpty = groupA.length === 0 && groupB.length === 0;

  return (
    <div style={{ background: PAGE, color: TXT, minHeight: "100vh", fontFamily: "Inter,sans-serif", overflowX: "hidden" }}>
      <style>{CSS}</style>
      <SiteHeader active="Points Table" />

      {/* HERO */}
      <section style={{ background: PAGE, padding: "clamp(48px,6vw,72px) 0 clamp(32px,4vw,48px)", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 60% 50% at 50% 0%,rgba(255,122,41,0.10) 0%,transparent 70%)", pointerEvents: "none" }} />
        <div className="wrap" style={{ position: "relative", zIndex: 1, textAlign: "center" }}>
          <div className="slbl" style={{ justifyContent: "center" }}>
            {t("Season 4 Standings", "सीज़न 4 स्टैंडिंग")}
          </div>
          <h1 style={{ fontFamily: "var(--font-head)", fontWeight: 900, fontSize: "clamp(32px,6vw,64px)", lineHeight: 1.05, color: "#fff", textTransform: "uppercase", marginBottom: 12 }}>
            {t("POINTS", "पॉइंट्स")}<br />
            <span className="shimmer-gold">{t("TABLE", "टेबल")}</span>
          </h1>
          <p style={{ color: TXT2, fontSize: "clamp(16px,2vw,18px)", lineHeight: 1.7, maxWidth: 480, margin: "0 auto" }}>
            {t("Live standings update as Season 4 matches are played.", "Season 4 के matches के साथ live standings update होते हैं।")}
          </p>
        </div>
      </section>

      <div className="wrap" style={{ paddingBottom: 100 }}>

        {/* EMPTY STATE */}
        {isEmpty && (
          <div style={{ textAlign: "center", padding: "clamp(48px,8vw,88px) 24px", background: PANEL, border: `1px solid ${LINE}`, borderRadius: 20, boxShadow: "0 12px 34px rgba(0,0,0,.28)" }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
              <span style={{ width: 76, height: 76, borderRadius: "50%", background: "rgba(232,178,61,0.16)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                <IcoTrophy size={38} style={{ color: GOLD }} />
              </span>
            </div>
            <h2 style={{ fontFamily: "var(--font-head)", fontWeight: 900, fontSize: "clamp(24px,4vw,38px)", color: "#fff", textTransform: "uppercase", marginBottom: 12 }}>
              {t("Standings Coming Soon", "Standings जल्द आएंगे")}
            </h2>
            <p style={{ color: TXT3, fontSize: 16, maxWidth: 440, margin: "0 auto 28px", lineHeight: 1.7 }}>
              {t("Season 4 tournament begins Sep 2026. The points table will update here in real time once the first match is played.", "Season 4 टूर्नामेंट Sep 2026 में शुरू होगा। पहले match के बाद points table यहाँ real time में update होगी।")}
            </p>
            <Link href="/register" className="float-reg-btn" style={{ position: "static", animation: "none", display: "inline-flex", boxShadow: "0 6px 24px rgba(255,122,41,0.35)" }}>
              {t("Register for Season 4 →", "Season 4 के लिए रजिस्टर करें →")}
            </Link>
          </div>
        )}

        {/* IPL-STYLE STANDINGS — one group at a time via tabs (no horizontal scroll) */}
        {!isEmpty && (
          <>
            <div className="pts-tabs" role="tablist" aria-label={t("Select group", "Group चुनें")}>
              {(["A", "B"] as const).map(g => {
                const on = activeGroup === g;
                return (
                  <button
                    key={g}
                    role="tab"
                    aria-selected={on}
                    className={`pts-tab${on ? " on" : ""}`}
                    onClick={() => setActiveGroup(g)}
                  >
                    {g === "A" ? t("Group A", "ग्रुप A") : t("Group B", "ग्रुप B")}
                  </button>
                );
              })}
            </div>

            {renderTable(activeGroup === "A" ? groupA : groupB)}
            
            {/* Qualification zone legend */}
            <div className="qz-note" style={{ marginBottom: 8 }}>
              <span className="qz-swatch" />
              {t("Top 2 from each group qualify for the semi finals", "प्रत्येक ग्रुप से टॉप 2 सेमी फाइनल के लिए क्वालिफाई करेंगे")}
            </div>

            {/* NRR / tie-break note — teams level on points are separated by NRR */}
            <div className="qz-note" style={{ marginBottom: 8 }}>
              <span style={{ fontFamily: "var(--font-head)", fontWeight: 800, color: GOLD }}>NRR</span>
              {t(
                "= Net Run Rate. Teams level on points are ranked by higher NRR (green = positive, red = negative).",
                "= नेट रन रेट। समान अंक वाली टीमों को ज़्यादा NRR से रैंक किया जाता है (हरा = धनात्मक, लाल = ऋणात्मक)।",
              )}
              <Link href="/cricket-rulebook" style={{ color: ORANGE, fontWeight: 700, textDecoration: "none" }}>
                {t("How NRR works →", "NRR कैसे काम करता है →")}
              </Link>
            </div>
          </>
        )}

      </div>

      <StickyRegisterCTA />
      <BCPLFooter />

      {/* Floating register button */}
      <Link href="/register" className="float-reg-btn float-reg-pulse">
        {t("REGISTER NOW →", "अभी रजिस्टर करें →")}
      </Link>
    </div>
  );
}

import React, { useEffect, useState } from "react";
import { Link } from "wouter";
import { BCPLFooter } from "../components/BCPLFooter";
import { SiteHeader } from "../components/SiteHeader";
import { getMvpLeaderboard, DEFAULT_MVP_POINTS_CONFIG, type MvpEntry, type MvpPointsConfig } from "../lib/api";
import { useLang } from "../lib/i18n";
import { IcoTrophy } from "../lib/icons";

/* ─── Palette (LIGHTENED DARK theme) ── */
const PAGE   = "#1B2E52";
const PANEL  = "#24396B";
const PANEL2 = "#2C3A5E";
const LINE   = "rgba(255,255,255,.18)";
const TXT    = "rgba(255,255,255,.92)";
const TXT2   = "rgba(255,255,255,.80)";
const TXT3   = "rgba(255,255,255,.64)";
const ORANGE = "#FF7A29";
const GOLD   = "#E8B23D";

const CSS = `
.mvp-wrap { max-width: 1180px; margin: 0 auto; padding: 0 16px; }
@media(min-width:640px){ .mvp-wrap { padding: 0 24px; } }
@media(min-width:768px){ .mvp-wrap { padding: 0 32px; } }
.mvp-table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; }
.mvp-table { width: 100%; border-collapse: collapse; min-width: 640px; }
.mvp-table thead th { padding: 13px 14px; text-align: center; font-family: var(--font-head); font-weight: 700; font-size: 11px; color: ${GOLD}; text-transform: uppercase; letter-spacing: .09em; white-space: nowrap; background: ${PANEL2}; border-bottom: 2px solid ${LINE}; }
.mvp-table thead th.left { text-align: left; }
.mvp-table tbody td { padding: 13px 14px; font-family: Inter, sans-serif; font-size: 15px; color: ${TXT2}; text-align: center; white-space: nowrap; border-bottom: 1px solid rgba(255,255,255,.08); }
.mvp-table tbody td.left { text-align: left; }
.mvp-row.final { background: rgba(232,178,61,.07); }
.mvp-toggle button { font-family: var(--font-head); font-weight: 800; font-size: 12.5px; letter-spacing: .05em; text-transform: uppercase; padding: 9px 16px; border-radius: 100px; border: 1px solid ${LINE}; background: rgba(255,255,255,.04); color: ${TXT2}; cursor: pointer; transition: all .2s; }
.mvp-toggle button.on { background: rgba(255,122,41,.16); border-color: ${ORANGE}; color: ${ORANGE}; }
`;

function RankBadge({ rank }: { rank: number }) {
  const medal = rank === 1 ? "#E8B23D" : rank === 2 ? "#C0C7D1" : rank === 3 ? "#CD7F32" : null;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      width: 30, height: 30, borderRadius: "50%",
      fontFamily: "var(--font-head)", fontWeight: 900, fontSize: 14,
      color: medal ? "#1B2E52" : TXT,
      background: medal ? medal : "rgba(255,255,255,.08)",
      border: medal ? "none" : `1px solid ${LINE}`,
    }}>{rank}</span>
  );
}

/* ── Points infographic: three colourful category cards, each rule a chip
   with the value in a bold badge. Always visible under the leaderboard.
   Values come LIVE from the leaderboard's pointsConfig (admin-editable),
   with a fallback to the shipped defaults so the guide never goes stale. ── */
type PointRule = { en: string; hi: string; section: keyof MvpPointsConfig; key: string };
type PointCat = {
  titleEn: string; titleHi: string; icon: string; accent: string; soft: string;
  rules: PointRule[];
};

const POINT_CATS: PointCat[] = [
  {
    titleEn: "Batting", titleHi: "बैटिंग", icon: "🏏",
    accent: "#FF6B3D", soft: "rgba(255,107,61,",
    rules: [
      { en: "Each run", hi: "हर run", section: "batting", key: "run" },
      { en: "Four (boundary)", hi: "चौका (four)", section: "batting", key: "fourBonus" },
      { en: "Six", hi: "छक्का (six)", section: "batting", key: "sixBonus" },
      { en: "30 runs", hi: "30 run", section: "batting", key: "milestone30" },
      { en: "Fifty (50)", hi: "अर्धशतक (50)", section: "batting", key: "milestone50" },
      { en: "Century (100)", hi: "शतक (100)", section: "batting", key: "milestone100" },
      { en: "Duck (out on 0)", hi: "डक (0 पर out)", section: "batting", key: "duck" },
    ],
  },
  {
    titleEn: "Bowling", titleHi: "बॉलिंग", icon: "🎯",
    accent: "#7B8CFF", soft: "rgba(123,140,255,",
    rules: [
      { en: "Each wicket", hi: "हर wicket", section: "bowling", key: "wicket" },
      { en: "Bowled / LBW bonus", hi: "Bowled / LBW bonus", section: "bowling", key: "bowledLbwBonus" },
      { en: "3 wickets", hi: "3 wicket", section: "bowling", key: "haul3" },
      { en: "4 wickets", hi: "4 wicket", section: "bowling", key: "haul4" },
      { en: "5 wickets", hi: "5 wicket", section: "bowling", key: "haul5" },
      { en: "Maiden over", hi: "Maiden over", section: "bowling", key: "maidenOver" },
    ],
  },
  {
    titleEn: "Fielding", titleHi: "फील्डिंग", icon: "🧤",
    accent: "#3ED6A6", soft: "rgba(62,214,166,",
    rules: [
      { en: "Catch", hi: "कैच (catch)", section: "fielding", key: "catch" },
      { en: "3 catches bonus", hi: "3 catch bonus", section: "fielding", key: "threeCatchBonus" },
      { en: "Stumping", hi: "स्टंपिंग", section: "fielding", key: "stumping" },
      { en: "Run-out (direct)", hi: "रन-आउट (direct)", section: "fielding", key: "directRunout" },
      { en: "Run-out (assist)", hi: "रन-आउट (assist)", section: "fielding", key: "assistedRunout" },
    ],
  },
];

function PointsInfographic({ config }: { config?: MvpPointsConfig }) {
  const { t } = useLang();
  const cfg = config ?? DEFAULT_MVP_POINTS_CONFIG;
  const valueOf = (section: keyof MvpPointsConfig, key: string): number => {
    const live = (cfg[section] as Record<string, number>)?.[key];
    if (typeof live === "number" && Number.isFinite(live)) return live;
    return (DEFAULT_MVP_POINTS_CONFIG[section] as Record<string, number>)[key];
  };
  return (
    <div style={{ marginTop: 40 }}>
      <div style={{ textAlign: "center", marginBottom: 22 }}>
        <div style={{ fontFamily: "var(--font-head)", fontWeight: 800, fontSize: 12, letterSpacing: ".14em", color: ORANGE, textTransform: "uppercase", marginBottom: 8 }}>
          {t("Scoring Guide", "स्कोरिंग गाइड")}
        </div>
        <h2 style={{ fontFamily: "var(--font-head)", fontWeight: 900, fontSize: "clamp(22px,4vw,34px)", color: "#fff" }}>
          {t("Points कैसे मिलते हैं", "Points कैसे मिलते हैं")}
        </h2>
      </div>

      <div style={{ display: "grid", gap: 18, gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
        {POINT_CATS.map(cat => (
          <div key={cat.titleEn} style={{
            background: PANEL, borderRadius: 18, overflow: "hidden",
            border: `1px solid ${cat.soft}.35)`,
            boxShadow: `0 12px 30px rgba(0,0,0,.28)`,
          }}>
            {/* Card header with accent band */}
            <div style={{
              display: "flex", alignItems: "center", gap: 12, padding: "16px 18px",
              background: `linear-gradient(100deg, ${cat.soft}.28) 0%, ${cat.soft}.06) 60%, transparent 100%)`,
              borderBottom: `2px solid ${cat.soft}.5)`,
            }}>
              <span style={{
                width: 42, height: 42, borderRadius: 12, flexShrink: 0,
                display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 22,
                background: `${cat.soft}.16)`, border: `1px solid ${cat.soft}.4)`,
              }}>{cat.icon}</span>
              <span style={{ fontFamily: "var(--font-head)", fontWeight: 900, fontSize: 19, color: "#fff", letterSpacing: ".01em" }}>
                {t(cat.titleEn, cat.titleHi)}
              </span>
            </div>

            {/* Rule chips */}
            <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 9 }}>
              {cat.rules.map(r => {
                const val = valueOf(r.section, r.key);
                const neg = val < 0;
                return (
                  <div key={r.en} style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
                    padding: "10px 12px", borderRadius: 11,
                    background: `${cat.soft}.06)`,
                    border: `1px solid ${cat.soft}.18)`,
                  }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: TXT, lineHeight: 1.3 }}>
                      {t(r.en, r.hi)}
                    </span>
                    <span style={{
                      flexShrink: 0, minWidth: 46, textAlign: "center",
                      fontFamily: "var(--font-head)", fontWeight: 900, fontSize: 15,
                      fontVariantNumeric: "tabular-nums",
                      padding: "5px 10px", borderRadius: 100,
                      color: neg ? "#FF7A7A" : "#0E1A33",
                      background: neg ? "rgba(255,90,90,.16)" : cat.accent,
                      border: neg ? "1px solid rgba(255,90,90,.5)" : "none",
                    }}>
                      {neg ? "−" : "+"}{Math.abs(val)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function MVP() {
  const { t } = useLang();
  const [eligibleOnly, setEligibleOnly] = useState(false);
  const [data, setData] = useState<{ rows: MvpEntry[]; finalists: [string, string] | null; note: string; pointsConfig?: MvpPointsConfig } | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(false);

  useEffect(() => {
    document.body.style.background = PAGE;
  }, []);

  useEffect(() => {
    setLoading(true);
    setErr(false);
    getMvpLeaderboard(eligibleOnly)
      .then(r => setData({ rows: r.leaderboard || [], finalists: r.finalists, note: r.note, pointsConfig: r.pointsConfig }))
      .catch(() => setErr(true))
      .finally(() => setLoading(false));
  }, [eligibleOnly]);

  const hasFinalists = Boolean(data?.finalists);
  const rows = data?.rows ?? [];
  const empty = !loading && !err && rows.length === 0;

  return (
    <div style={{ background: PAGE, minHeight: "100vh" }}>
      <style>{CSS}</style>
      <SiteHeader active="MVP" />

      {/* Hero */}
      <section style={{ padding: "clamp(90px,12vw,130px) 0 clamp(24px,4vw,40px)" }}>
        <div className="mvp-wrap" style={{ textAlign: "center" }}>
          <div style={{ fontFamily: "var(--font-head)", fontWeight: 800, fontSize: 12, letterSpacing: ".14em", color: ORANGE, textTransform: "uppercase", marginBottom: 10 }}>
            {t("MVP Leaderboard", "MVP लीडरबोर्ड")}
          </div>
          <h1 style={{ fontFamily: "var(--font-head)", fontWeight: 900, fontSize: "clamp(28px,5vw,52px)", color: "#fff", textTransform: "uppercase", lineHeight: 1.05, marginBottom: 14 }}>
            {t("Most Valuable Player", "मोस्ट वैल्युएबल प्लेयर")}
          </h1>
          <p style={{ color: TXT2, fontSize: "clamp(14px,2vw,17px)", maxWidth: 600, margin: "0 auto", lineHeight: 1.7 }}>
            {t("Fantasy points from every official match — batting, bowling and fielding combined.",
               "हर ऑफिशियल मैच से फैंटेसी पॉइंट्स — बैटिंग, बॉलिंग और फील्डिंग का मेल।")}
          </p>
        </div>
      </section>

      <div className="mvp-wrap" style={{ paddingBottom: 100 }}>
        {/* Finalist highlight strip */}
        {hasFinalists && data?.finalists && (
          <div style={{ background: "linear-gradient(90deg, rgba(232,178,61,.16), rgba(232,178,61,.04))", border: `1px solid rgba(232,178,61,.4)`, borderRadius: 14, padding: "14px 18px", marginBottom: 20, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <IcoTrophy size={22} style={{ color: GOLD, flexShrink: 0 }} />
            <span style={{ color: TXT, fontSize: 14, lineHeight: 1.5 }}>
              {t(
                `Car race is on! Man of the Series (car prize) is limited to finalists: ${data.finalists[0]} vs ${data.finalists[1]}.`,
                `कार रेस शुरू! मैन ऑफ द सीरीज़ (कार इनाम) सिर्फ फाइनलिस्ट्स के लिए: ${data.finalists[0]} vs ${data.finalists[1]}।`
              )}
            </span>
          </div>
        )}

        {/* Toggle: all players / car race (finalists) */}
        <div className="mvp-toggle" style={{ display: "flex", gap: 10, marginBottom: 18, flexWrap: "wrap" }}>
          <button className={!eligibleOnly ? "on" : ""} onClick={() => setEligibleOnly(false)}>
            {t("All Players", "सभी खिलाड़ी")}
          </button>
          <button className={eligibleOnly ? "on" : ""} onClick={() => setEligibleOnly(true)} disabled={!hasFinalists}
            title={!hasFinalists ? t("Available once a final is scheduled", "फाइनल तय होने पर उपलब्ध") : undefined}
            style={!hasFinalists ? { opacity: .5, cursor: "not-allowed" } : undefined}>
            {t("Car Race (Finalists)", "कार रेस (फाइनलिस्ट्स)")}
          </button>
        </div>

        {/* Null-finalists note */}
        {!hasFinalists && !err && (
          <p style={{ color: TXT3, fontSize: 13.5, marginBottom: 16, lineHeight: 1.6 }}>
            {t("No final scheduled yet — Man of the Series (car race) eligibility is not decided.",
               "अभी कोई फाइनल तय नहीं — मैन ऑफ द सीरीज़ (कार रेस) की पात्रता तय नहीं है।")}
          </p>
        )}

        {err && (
          <div style={{ textAlign: "center", padding: "clamp(48px,8vw,80px) 24px", background: PANEL, border: `1px solid ${LINE}`, borderRadius: 20 }}>
            <p style={{ color: TXT3, fontSize: 16 }}>{t("Could not load the leaderboard. Please try again later.", "लीडरबोर्ड लोड नहीं हो सका। कृपया बाद में प्रयास करें।")}</p>
          </div>
        )}

        {loading && !err && (
          <div style={{ textAlign: "center", padding: 60, color: TXT3 }}>{t("Loading leaderboard…", "लीडरबोर्ड लोड हो रहा है…")}</div>
        )}

        {empty && (
          <div style={{ textAlign: "center", padding: "clamp(48px,8vw,88px) 24px", background: PANEL, border: `1px solid ${LINE}`, borderRadius: 20, boxShadow: "0 12px 34px rgba(0,0,0,.28)" }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
              <span style={{ width: 76, height: 76, borderRadius: "50%", background: "rgba(232,178,61,0.16)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                <IcoTrophy size={38} style={{ color: GOLD }} />
              </span>
            </div>
            <h2 style={{ fontFamily: "var(--font-head)", fontWeight: 900, fontSize: "clamp(22px,4vw,34px)", color: "#fff", textTransform: "uppercase", marginBottom: 12 }}>
              {t("No Rankings Yet", "अभी कोई रैंकिंग नहीं")}
            </h2>
            <p style={{ color: TXT3, fontSize: 16, maxWidth: 440, margin: "0 auto", lineHeight: 1.7 }}>
              {eligibleOnly
                ? t("No finalists to show yet.", "अभी दिखाने के लिए कोई फाइनलिस्ट नहीं।")
                : t("The leaderboard fills up as official matches are played.", "ऑफिशियल मैच खेले जाने के साथ लीडरबोर्ड भरेगा।")}
            </p>
          </div>
        )}

        {!loading && !err && rows.length > 0 && (
          <div style={{ background: PANEL, border: `1px solid ${LINE}`, borderRadius: 20, overflow: "hidden", boxShadow: "0 12px 34px rgba(0,0,0,.28)" }}>
            <div className="mvp-table-wrap">
              <table className="mvp-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th className="left">{t("Player", "खिलाड़ी")}</th>
                    <th className="left">{t("Team", "टीम")}</th>
                    <th title={t("Matches", "मैच")}>{t("M", "M")}</th>
                    <th title={t("Runs", "रन")}>{t("R", "R")}</th>
                    <th title={t("Wickets", "विकेट")}>{t("W", "W")}</th>
                    <th title={t("Catches", "कैच")}>{t("C", "C")}</th>
                    <th>{t("Points", "पॉइंट्स")}</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(r => (
                    <tr key={r.playerId} className={"mvp-row" + (r.finalEligible ? " final" : "")}>
                      <td><RankBadge rank={r.rank} /></td>
                      <td className="left">
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 8, fontFamily: "var(--font-head)", fontWeight: 800, fontSize: 15, color: "#fff" }}>
                          {r.name}
                          {r.finalEligible && <span style={{ fontSize: 10, fontWeight: 800, color: GOLD, background: "rgba(232,178,61,.16)", border: `1px solid rgba(232,178,61,.4)`, borderRadius: 100, padding: "2px 7px", letterSpacing: ".05em" }}>{t("FINALIST", "फाइनलिस्ट")}</span>}
                          {hasFinalists && !r.finalEligible && <span style={{ fontSize: 10, fontWeight: 700, color: TXT3, background: "rgba(255,255,255,.05)", border: `1px solid ${LINE}`, borderRadius: 100, padding: "2px 7px", letterSpacing: ".03em", whiteSpace: "nowrap" }}>{t("Not valid for car", "Car के लिए valid नहीं")}</span>}
                        </span>
                      </td>
                      <td className="left" style={{ color: TXT3 }}>{r.team}</td>
                      <td>{r.matches}</td>
                      <td>{r.runs}</td>
                      <td>{r.wickets}</td>
                      <td>{r.catches}</td>
                      <td style={{ fontFamily: "var(--font-head)", fontWeight: 900, fontSize: 16, color: GOLD, fontVariantNumeric: "tabular-nums" }}>{r.points}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <PointsInfographic config={data?.pointsConfig} />

        <div style={{ textAlign: "center", marginTop: 34 }}>
          <Link href="/vote" style={{ color: ORANGE, textDecoration: "none", fontWeight: 700, fontSize: 14 }}>
            {t("Cast your fan vote", "अपना फैन वोट डालें")} →
          </Link>
        </div>
      </div>

      <BCPLFooter />
    </div>
  );
}

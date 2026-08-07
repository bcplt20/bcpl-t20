import React, { useEffect, useState } from "react";
import { Link } from "wouter";
import { BCPLFooter } from "../components/BCPLFooter";
import { SiteHeader } from "../components/SiteHeader";
import { getMvpLeaderboard, type MvpEntry } from "../lib/api";
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

/* Fantasy scoring rules (owner-provided). */
function PointsRules() {
  const { t } = useLang();
  const [open, setOpen] = useState(false);
  const Row = ({ en, hi }: { en: string; hi: string }) => (
    <li style={{ padding: "5px 0", borderBottom: "1px solid rgba(255,255,255,.07)", fontSize: 13.5, color: TXT2 }}>{t(en, hi)}</li>
  );
  return (
    <div style={{ background: PANEL, border: `1px solid ${LINE}`, borderRadius: 16, marginTop: 24, overflow: "hidden" }}>
      <button type="button" onClick={() => setOpen(o => !o)}
        style={{ width: "100%", textAlign: "left", padding: "16px 20px", background: "transparent", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <span style={{ fontFamily: "var(--font-head)", fontWeight: 900, fontSize: 17, color: "#fff" }}>
          {t("Points कैसे मिलते हैं", "Points कैसे मिलते हैं")}
        </span>
        <span style={{ color: ORANGE, fontSize: 20, fontWeight: 800, transform: open ? "rotate(45deg)" : "none", transition: "transform .2s" }}>+</span>
      </button>
      {open && (
        <div style={{ padding: "4px 20px 18px", display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
          <div>
            <div style={{ fontFamily: "var(--font-head)", fontWeight: 800, fontSize: 12, letterSpacing: ".08em", color: GOLD, textTransform: "uppercase", margin: "8px 0" }}>{t("Batting", "बैटिंग")}</div>
            <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
              <Row en="Each run: +1" hi="प्रत्येक रन: +1" />
              <Row en="Each four: +1 (bonus)" hi="प्रत्येक चौका: +1 (बोनस)" />
              <Row en="Each six: +2 (bonus)" hi="प्रत्येक छक्का: +2 (बोनस)" />
              <Row en="30 runs: +4" hi="30 रन: +4" />
              <Row en="Half-century (50): +8" hi="अर्धशतक (50): +8" />
              <Row en="Century (100): +16" hi="शतक (100): +16" />
              <Row en="Duck (out on 0): −2" hi="डक (0 पर आउट): −2" />
            </ul>
          </div>
          <div>
            <div style={{ fontFamily: "var(--font-head)", fontWeight: 800, fontSize: 12, letterSpacing: ".08em", color: GOLD, textTransform: "uppercase", margin: "8px 0" }}>{t("Bowling", "बॉलिंग")}</div>
            <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
              <Row en="Each wicket: +25" hi="प्रत्येक विकेट: +25" />
              <Row en="Bowled / LBW bonus: +8" hi="बोल्ड / LBW बोनस: +8" />
              <Row en="3 wickets: +4" hi="3 विकेट: +4" />
              <Row en="4 wickets: +8" hi="4 विकेट: +8" />
              <Row en="5 wickets: +16" hi="5 विकेट: +16" />
              <Row en="Maiden over: +12" hi="मेडन ओवर: +12" />
            </ul>
          </div>
          <div>
            <div style={{ fontFamily: "var(--font-head)", fontWeight: 800, fontSize: 12, letterSpacing: ".08em", color: GOLD, textTransform: "uppercase", margin: "8px 0" }}>{t("Fielding", "फील्डिंग")}</div>
            <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
              <Row en="Catch: +8" hi="कैच: +8" />
              <Row en="Stumping: +12" hi="स्टंपिंग: +12" />
              <Row en="Run-out (direct): +12" hi="रन-आउट (डायरेक्ट): +12" />
              <Row en="Run-out (assist): +6" hi="रन-आउट (असिस्ट): +6" />
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

export function MVP() {
  const { t } = useLang();
  const [eligibleOnly, setEligibleOnly] = useState(false);
  const [data, setData] = useState<{ rows: MvpEntry[]; finalists: [string, string] | null; note: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(false);

  useEffect(() => {
    document.body.style.background = PAGE;
  }, []);

  useEffect(() => {
    setLoading(true);
    setErr(false);
    getMvpLeaderboard(eligibleOnly)
      .then(r => setData({ rows: r.leaderboard || [], finalists: r.finalists, note: r.note }))
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

        <PointsRules />

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

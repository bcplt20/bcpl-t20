import React, { useEffect, useState } from "react";
import { Link } from "wouter";
import { BCPLFooter } from "../components/BCPLFooter";
import { SiteHeader } from "../components/SiteHeader";
import { getPolls, castPollVote, type Poll, type PollOption } from "../lib/api";
import { openLoginModal } from "../lib/auth";
import { useLang } from "../lib/i18n";
import { IcoTrophy } from "../lib/icons";

/* ─── Palette (LIGHTENED DARK theme, matches PointsTable/MVP) ── */
const PAGE   = "#1B2E52";
const PANEL  = "#24396B";
const LINE   = "rgba(255,255,255,.18)";
const TXT    = "rgba(255,255,255,.92)";
const TXT2   = "rgba(255,255,255,.80)";
const TXT3   = "rgba(255,255,255,.64)";
const ORANGE = "#FF7A29";
const GOLD   = "#E8B23D";
const GREEN  = "#31C56B";

/* Per-poll UI state kept alongside the fetched poll. */
type PollUI = {
  votedOptionId: string | null;   // this browser session's chosen option
  busyOptionId: string | null;    // in-flight vote
  msg: { kind: "info" | "error"; text: string } | null;
  options: PollOption[];          // may be updated after voting (live results)
  totalVotes: number | null;
};

function catLabel(t: (en: string, hi: string) => string, category: string): string {
  switch (category) {
    case "man_of_series": return t("Man of the Series", "मैन ऑफ द सीरीज़");
    case "best_batsman":  return t("Best Batsman", "बेस्ट बैट्समैन");
    case "best_bowler":   return t("Best Bowler", "बेस्ट बॉलर");
    default:              return t("Fan Poll", "फैन पोल");
  }
}

/* One poll card — IPL-style: title strip, option rows with animated % bars. */
function PollCard({ poll }: { poll: Poll }) {
  const { t, lang } = useLang();
  const [ui, setUi] = useState<PollUI>({
    votedOptionId: null,
    busyOptionId: null,
    msg: null,
    options: poll.options,
    totalVotes: poll.totalVotes,
  });

  const closed = !poll.votingOpen;
  const showResults = ui.options.some(o => typeof o.percent === "number");
  const title = lang === "hi" && poll.titleHi ? poll.titleHi : poll.titleEn;

  async function vote(optionId: string) {
    if (ui.busyOptionId || ui.votedOptionId || closed) return;
    setUi(s => ({ ...s, busyOptionId: optionId, msg: null }));
    try {
      const res = await castPollVote(poll.id, optionId);
      setUi(s => ({
        ...s,
        busyOptionId: null,
        votedOptionId: optionId,
        options: res.options.length ? res.options : s.options,
        totalVotes: res.totalVotes,
        msg: { kind: "info", text: t("Thanks — your vote is counted!", "धन्यवाद — आपका वोट दर्ज हो गया!") },
      }));
    } catch (e) {
      const err = e as Error & { status?: number };
      if (err.status === 401) {
        setUi(s => ({ ...s, busyOptionId: null }));
        openLoginModal();
        return;
      }
      let text = err.message || t("Could not record your vote.", "आपका वोट दर्ज नहीं हो सका।");
      if (err.status === 409) {
        text = t("You've already voted in this poll.", "आप इस पोल में पहले ही वोट कर चुके हैं।");
        setUi(s => ({ ...s, busyOptionId: null, votedOptionId: "__done__", msg: { kind: "info", text } }));
        return;
      }
      if (err.status === 400) {
        text = t("This poll is closed for voting.", "यह पोल वोटिंग के लिए बंद है।");
      }
      setUi(s => ({ ...s, busyOptionId: null, msg: { kind: "error", text } }));
    }
  }

  const alreadyVoted = Boolean(ui.votedOptionId);

  return (
    <div style={{ background: PANEL, border: `1px solid ${LINE}`, borderRadius: 20, overflow: "hidden", boxShadow: "0 12px 34px rgba(0,0,0,.28)" }}>
      {/* Header strip */}
      <div style={{ padding: "16px 20px", borderBottom: `1px solid ${LINE}`, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", background: "linear-gradient(90deg, rgba(255,122,41,.10), transparent)" }}>
        <div>
          <div style={{ fontFamily: "var(--font-head)", fontWeight: 800, fontSize: 11, letterSpacing: ".1em", color: ORANGE, textTransform: "uppercase", marginBottom: 4 }}>
            {catLabel(t, poll.category)}
          </div>
          <h3 style={{ fontFamily: "var(--font-head)", fontWeight: 900, fontSize: "clamp(18px,3vw,24px)", color: "#fff", lineHeight: 1.2 }}>
            {title}
          </h3>
        </div>
        <span style={{
          fontFamily: "var(--font-head)", fontWeight: 800, fontSize: 11, letterSpacing: ".08em",
          textTransform: "uppercase", padding: "5px 12px", borderRadius: 100,
          color: closed ? TXT3 : GREEN,
          background: closed ? "rgba(255,255,255,.08)" : "rgba(49,197,107,.15)",
          border: `1px solid ${closed ? LINE : "rgba(49,197,107,.4)"}`,
          whiteSpace: "nowrap",
        }}>
          {closed ? t("Voting Closed", "वोटिंग बंद") : t("Voting Open", "वोटिंग खुली")}
        </span>
      </div>

      {/* Options */}
      <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
        {ui.options.map(o => {
          const pct = typeof o.percent === "number" ? o.percent : 0;
          const isMine = ui.votedOptionId === o.id;
          const busy = ui.busyOptionId === o.id;
          const interactive = !closed && !alreadyVoted;
          return (
            <button
              key={o.id}
              type="button"
              disabled={!interactive || busy}
              onClick={() => vote(o.id)}
              style={{
                position: "relative", overflow: "hidden", textAlign: "left",
                width: "100%", padding: "13px 16px", borderRadius: 12,
                border: `1px solid ${isMine ? GOLD : LINE}`,
                background: "rgba(255,255,255,.04)",
                cursor: interactive && !busy ? "pointer" : "default",
                transition: "border-color .2s, background .2s",
              }}
            >
              {/* Animated percent bar (results state) */}
              {showResults && (
                <span style={{
                  position: "absolute", inset: 0, width: `${pct}%`,
                  background: isMine
                    ? "linear-gradient(90deg, rgba(232,178,61,.34), rgba(232,178,61,.14))"
                    : "linear-gradient(90deg, rgba(255,122,41,.26), rgba(255,122,41,.08))",
                  transition: "width .7s cubic-bezier(.22,1,.36,1)", pointerEvents: "none",
                }} />
              )}
              <span style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                <span style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                  {o.imageUrl && (
                    <img src={o.imageUrl} alt="" decoding="async"
                      style={{ width: 34, height: 34, borderRadius: "50%", objectFit: "cover", flexShrink: 0, border: `1px solid ${LINE}` }} />
                  )}
                  <span style={{ fontFamily: "var(--font-head)", fontWeight: 800, fontSize: 16, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {o.label}
                    {o.teamName && <span style={{ color: TXT3, fontWeight: 700, fontSize: 12, marginLeft: 8 }}>{o.teamName}</span>}
                  </span>
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                  {isMine && <span style={{ color: GOLD, fontSize: 12, fontWeight: 800 }}>✓</span>}
                  {showResults && (
                    <span style={{ fontFamily: "var(--font-head)", fontWeight: 900, fontSize: 15, color: isMine ? GOLD : TXT, fontVariantNumeric: "tabular-nums" }}>
                      {pct}%
                    </span>
                  )}
                  {busy && <span style={{ color: TXT3, fontSize: 12 }}>…</span>}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      {/* Footer: total votes + message */}
      <div style={{ padding: "0 20px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
        <span style={{ fontSize: 12, color: TXT3 }}>
          {ui.totalVotes != null
            ? t(`${ui.totalVotes} votes`, `${ui.totalVotes} वोट`)
            : !alreadyVoted && !closed ? t("Vote to see results", "परिणाम देखने के लिए वोट करें") : ""}
        </span>
        {ui.msg && (
          <span style={{ fontSize: 12.5, fontWeight: 700, color: ui.msg.kind === "error" ? "#F26158" : GREEN }}>
            {ui.msg.text}
          </span>
        )}
      </div>
    </div>
  );
}

export function Vote() {
  const { t } = useLang();
  const [polls, setPolls] = useState<Poll[] | null>(null);
  const [err, setErr] = useState(false);

  useEffect(() => {
    document.body.style.background = PAGE;
    getPolls()
      .then(r => setPolls(r.polls || []))
      .catch(() => setErr(true));
  }, []);

  const empty = polls != null && polls.length === 0;

  return (
    <div style={{ background: PAGE, minHeight: "100vh" }}>
      <SiteHeader active="Vote" />

      {/* Hero */}
      <section style={{ padding: "clamp(90px,12vw,130px) 0 clamp(28px,5vw,44px)", position: "relative" }}>
        <div className="v3-wrap" style={{ textAlign: "center" }}>
          <div style={{ fontFamily: "var(--font-head)", fontWeight: 800, fontSize: 12, letterSpacing: ".14em", color: ORANGE, textTransform: "uppercase", marginBottom: 10 }}>
            {t("Fan Voting", "फैन वोटिंग")}
          </div>
          <h1 style={{ fontFamily: "var(--font-head)", fontWeight: 900, fontSize: "clamp(28px,5vw,52px)", color: "#fff", textTransform: "uppercase", lineHeight: 1.05, marginBottom: 14 }}>
            {t("Your Vote, Your League", "आपका वोट, आपकी लीग")}
          </h1>
          <p style={{ color: TXT2, fontSize: "clamp(14px,2vw,17px)", maxWidth: 560, margin: "0 auto", lineHeight: 1.7 }}>
            {t("Pick your favourites across the season. One vote per poll — sign in to make it count.",
               "पूरे सीज़न में अपने पसंदीदा चुनें। हर पोल में एक वोट — गिनती के लिए साइन इन करें।")}
          </p>
        </div>
      </section>

      <div className="v3-wrap" style={{ paddingBottom: 100 }}>
        {err && (
          <div style={{ textAlign: "center", padding: "clamp(48px,8vw,80px) 24px", background: PANEL, border: `1px solid ${LINE}`, borderRadius: 20 }}>
            <p style={{ color: TXT3, fontSize: 16 }}>{t("Could not load polls right now. Please try again later.", "अभी पोल लोड नहीं हो सके। कृपया बाद में प्रयास करें।")}</p>
          </div>
        )}

        {empty && !err && (
          <div style={{ textAlign: "center", padding: "clamp(48px,8vw,88px) 24px", background: PANEL, border: `1px solid ${LINE}`, borderRadius: 20, boxShadow: "0 12px 34px rgba(0,0,0,.28)" }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
              <span style={{ width: 76, height: 76, borderRadius: "50%", background: "rgba(232,178,61,0.16)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                <IcoTrophy size={38} style={{ color: GOLD }} />
              </span>
            </div>
            <h2 style={{ fontFamily: "var(--font-head)", fontWeight: 900, fontSize: "clamp(22px,4vw,34px)", color: "#fff", textTransform: "uppercase", marginBottom: 12 }}>
              {t("No Polls Yet", "अभी कोई पोल नहीं")}
            </h2>
            <p style={{ color: TXT3, fontSize: 16, maxWidth: 440, margin: "0 auto", lineHeight: 1.7 }}>
              {t("Fan polls open as the season heats up. Check back soon to cast your vote.",
                 "सीज़न आगे बढ़ने के साथ फैन पोल खुलेंगे। वोट डालने के लिए जल्द वापस आएं।")}
            </p>
          </div>
        )}

        {polls && polls.length > 0 && (
          <div style={{ display: "grid", gap: 20, gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))" }}>
            {polls.map(p => <PollCard key={p.id} poll={p} />)}
          </div>
        )}

        {!polls && !err && (
          <div style={{ textAlign: "center", padding: 60, color: TXT3 }}>{t("Loading polls…", "पोल लोड हो रहे हैं…")}</div>
        )}

        <div style={{ textAlign: "center", marginTop: 34 }}>
          <Link href="/mvp" style={{ color: ORANGE, textDecoration: "none", fontWeight: 700, fontSize: 14 }}>
            {t("See the MVP leaderboard", "MVP लीडरबोर्ड देखें")} →
          </Link>
        </div>
      </div>

      <BCPLFooter />
    </div>
  );
}

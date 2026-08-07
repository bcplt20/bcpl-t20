import { useEffect, useRef, useState } from "react";
import { useLang } from "../lib/i18n";
import { getSession } from "../lib/auth";
import { aiChat, type AiChatMsg } from "../lib/api";

/**
 * BCPL AI — floating assistant, visible to EVERYONE (guests + logged-in
 * players). Guests get general answers (fees/journey/rules); logged-in
 * players get answers grounded in their own status via POST /api/ai/chat.
 * Hidden on /admin & /staff.
 *
 * Z-index: launcher 1000 (CTA band), panel 1900 (above menu 1500, below
 * modals 2000) — see the site z-index scale.
 */

/** Classic "AI sparkle" mark — instantly reads as AI help. */
function SparkleIcon({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="#fff" aria-hidden="true">
      <path d="M12 2.5l1.9 5.6 5.6 1.9-5.6 1.9L12 17.5l-1.9-5.6-5.6-1.9 5.6-1.9L12 2.5z" />
      <path d="M19.5 14.5l.9 2.6 2.6.9-2.6.9-.9 2.6-.9-2.6-2.6-.9 2.6-.9.9-2.6z" opacity="0.9" />
      <path d="M5 15.5l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7.7-2z" opacity="0.75" />
    </svg>
  );
}

/* Positioning lives in CSS so we can raise everything above the mobile
   sticky register bar (.srg-bar, z900, visible <1024px for logged-out users
   — logged-in html gets .bcpl-authed and the bar unmounts). */
const FAB_CSS = `
.bcplai-fab{position:fixed;right:18px;bottom:18px;z-index:1000;width:58px;height:58px;border-radius:50%;border:none;cursor:pointer;padding:0;background:linear-gradient(135deg,#7C5CFF,#FF3DA6,#00DCF5);box-shadow:0 10px 28px rgba(124,92,255,0.5);display:flex;align-items:center;justify-content:center;transition:transform .18s ease, box-shadow .18s ease;}
.bcplai-fab:hover{transform:scale(1.06);box-shadow:0 14px 34px rgba(124,92,255,0.6);}
.bcplai-fab:active{transform:scale(.96);}
.bcplai-badge{position:fixed;right:12px;bottom:60px;z-index:1000;pointer-events:none;background:linear-gradient(135deg,#7C5CFF,#FF3DA6);color:#fff;font-size:10px;font-weight:900;letter-spacing:1px;padding:3px 8px;border-radius:999px;box-shadow:0 4px 12px rgba(0,0,0,0.35);}
.bcplai-panel{position:fixed;right:14px;bottom:88px;z-index:1900;width:min(400px,calc(100vw - 28px));height:min(560px,calc(100vh - 130px));display:flex;flex-direction:column;border-radius:20px;overflow:hidden;background:#16264A;border:1px solid rgba(255,255,255,0.14);box-shadow:0 18px 60px rgba(0,0,0,0.55);animation:bcplaiPop .22s cubic-bezier(.2,.8,.3,1);transform-origin:bottom right;}
@keyframes bcplaiPop{from{opacity:0;transform:translateY(14px) scale(.96);}to{opacity:1;transform:translateY(0) scale(1);}}
.bcplai-msg{animation:bcplaiMsgIn .24s ease;}
@keyframes bcplaiMsgIn{from{opacity:0;transform:translateY(6px);}to{opacity:1;transform:translateY(0);}}
.bcplai-body{scrollbar-width:thin;scrollbar-color:rgba(255,255,255,.22) transparent;}
.bcplai-body::-webkit-scrollbar{width:6px;}
.bcplai-body::-webkit-scrollbar-thumb{background:rgba(255,255,255,.18);border-radius:6px;}
.bcplai-chip{border-radius:999px;border:1px solid rgba(124,92,255,0.42);background:rgba(124,92,255,0.14);color:#D9CCFF;font-size:12px;font-weight:600;padding:7px 12px;cursor:pointer;white-space:nowrap;transition:background .16s, border-color .16s, transform .12s;}
.bcplai-chip:hover{background:rgba(124,92,255,0.26);border-color:rgba(124,92,255,0.7);}
.bcplai-chip:active{transform:scale(.95);}
.bcplai-chip:disabled{opacity:.45;cursor:not-allowed;}
.bcplai-chiprow{display:flex;gap:8px;overflow-x:auto;padding:10px 12px;border-top:1px solid rgba(255,255,255,0.10);background:rgba(0,0,0,0.12);scrollbar-width:none;}
.bcplai-chiprow::-webkit-scrollbar{display:none;}
.bcplai-typing{display:inline-flex;gap:4px;align-items:center;padding:2px 2px;}
.bcplai-typing i{width:7px;height:7px;border-radius:50%;background:rgba(255,255,255,0.7);display:inline-block;animation:bcplaiDot 1.1s infinite ease-in-out;}
.bcplai-typing i:nth-child(2){animation-delay:.18s;}
.bcplai-typing i:nth-child(3){animation-delay:.36s;}
@keyframes bcplaiDot{0%,80%,100%{transform:translateY(0);opacity:.4;}40%{transform:translateY(-4px);opacity:1;}}
@media(prefers-reduced-motion:reduce){.bcplai-panel,.bcplai-msg{animation:none;}.bcplai-typing i{animation:none;}}
@media(max-width:1023.98px){
  html:not(.bcpl-authed) .bcplai-fab{bottom:calc(92px + env(safe-area-inset-bottom,0px));}
  html:not(.bcpl-authed) .bcplai-badge{bottom:calc(134px + env(safe-area-inset-bottom,0px));}
  html:not(.bcpl-authed) .bcplai-panel{bottom:calc(162px + env(safe-area-inset-bottom,0px));height:min(560px,calc(100vh - 200px - env(safe-area-inset-bottom,0px)));}
}
`;

export default function AiHelper() {
  const { t, lang } = useLang();
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<AiChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [gone, setGone] = useState(false); // 503 AI_UNAVAILABLE → hide
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs, busy, open]);

  const path = typeof window !== "undefined" ? window.location.pathname : "";
  if (gone || /\/(admin|staff)(\/|$)/.test(path)) return null;

  const send = async (override?: string) => {
    const text = (override ?? input).trim();
    if (!text || busy) return;
    setErr("");
    setInput("");
    const next: AiChatMsg[] = [...msgs, { role: "user", text }];
    setMsgs(next);
    setBusy(true);
    try {
      const { reply } = await aiChat(next.slice(-10));
      setMsgs((m) => [...m, { role: "assistant", text: reply }]);
    } catch (e) {
      const anyE = e as { status?: number };
      if (anyE.status === 503) { setGone(true); return; }
      setErr(anyE.status === 429
        ? t("Please wait a minute before sending more messages.", "थोड़ी देर रुकें, फिर message भेजें।")
        : t("Could not get an answer — try again.", "जवाब नहीं मिल पाया — दोबारा try करें।"));
    } finally {
      setBusy(false);
    }
  };

  const authed = !!getSession();
  const hello = authed
    ? (lang === "hi"
        ? "नमस्ते! मैं BCPL AI हूँ। Payment, video, result, KYC या trial के बारे में कुछ भी पूछें।"
        : "Hi! I'm BCPL AI. Ask me anything about your payment, video, result, KYC or trial.")
    : (lang === "hi"
        ? "नमस्ते! मैं BCPL AI हूँ। BCPL, registration, fees या trials के बारे में कुछ भी पूछें। अपने payment/result के लिए पहले login करें।"
        : "Hi! I'm BCPL AI. Ask me anything about BCPL, registration, fees or trials. For your own payment/result, please log in first.");

  /* Quick-question chips — always shown above the input, tap to send instantly.
     Bilingual (English label / Hindi label per site language). */
  const commonChips: Array<[string, string]> = [
    ["What is the winning prize?", "Winning prize कितना है?"],
    ["Phase 1 registration fee?", "Phase 1 registration fee?"],
    ["Phase 2 fee?", "Phase 2 fee?"],
    ["What is the trial process?", "Trial process क्या है?"],
    ["Who gets the car?", "Car किसे मिलेगी?"],
    ["How are points earned?", "Points कैसे मिलते हैं?"],
  ];
  const authedChips: Array<[string, string]> = [
    ["What is my current status?", "मेरा अभी का status क्या है?"],
    ["When is my trial?", "मेरा trial कब है?"],
    ["How do I upload my video?", "Video कैसे upload करूँ?"],
  ];
  const chips: Array<[string, string]> = authed
    ? [...authedChips, ...commonChips]
    : commonChips;

  return (
    <>
      <style>{FAB_CSS}</style>
      {/* Launcher — AI sparkle mark on the brand gradient */}
      <button aria-label="BCPL AI" onClick={() => setOpen((o) => !o)} className="bcplai-fab">
        {open ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
        ) : (
          <SparkleIcon size={30} />
        )}
      </button>
      {/* "AI" badge on the launcher */}
      {!open && <span className="bcplai-badge">AI</span>}

      {/* Panel */}
      {open && (
        <div className="bcplai-panel">
          {/* Header */}
          <div style={{ position: "relative", padding: "14px 16px", background: "linear-gradient(120deg,#241a4f 0%,#4a1d62 55%,#7a1653 100%)", borderBottom: "1px solid rgba(255,255,255,0.12)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ width: 40, height: 40, borderRadius: "50%", background: "linear-gradient(135deg,#7C5CFF,#FF3DA6)", border: "1px solid rgba(255,255,255,0.22)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <SparkleIcon size={22} />
              </span>
              <div>
                <div style={{ color: "#fff", fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 19, letterSpacing: ".06em", lineHeight: 1.1 }}>
                  BCPL <span style={{ background: "linear-gradient(90deg,#B7A6FF,#FF8CC8,#7FEBFF)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>AI</span>
                </div>
                <div style={{ fontSize: 11.5, color: "rgba(255,255,255,0.75)" }}>{t("Official BCPL assistant", "BCPL का आधिकारिक सहायक")}</div>
              </div>
              <span style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 5, fontSize: 10, fontWeight: 800, color: "#7FEBFF", letterSpacing: 1 }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#22E39B", boxShadow: "0 0 8px #22E39B" }} />
                ONLINE
              </span>
            </div>
          </div>

          {/* Messages */}
          <div ref={bodyRef} className="bcplai-body" style={{ flex: 1, overflowY: "auto", padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
            <Bubble role="assistant" text={hello} />
            {msgs.map((m, i) => <Bubble key={i} role={m.role} text={m.text} />)}
            {busy && <Bubble role="assistant" typing />}
            {err && <div className="bcplai-msg" style={{ color: "#FF9DB0", fontSize: 12.5, padding: "0 4px" }}>{err}</div>}
          </div>

          {/* Quick-question chips — always visible, tap to send instantly */}
          <div className="bcplai-chiprow">
            {chips.map(([en, hi]) => (
              <button key={en} className="bcplai-chip" disabled={busy} onClick={() => send(t(en, hi))}>
                {t(en, hi)}
              </button>
            ))}
          </div>

          {/* Composer */}
          <div style={{ display: "flex", gap: 8, padding: 12, borderTop: "1px solid rgba(255,255,255,0.12)", background: "rgba(0,0,0,0.15)" }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") send(); }}
              placeholder={t("Ask BCPL AI…", "BCPL AI से पूछें…")}
              maxLength={1200}
              style={{
                flex: 1, borderRadius: 14, border: "1px solid rgba(255,255,255,0.18)",
                background: "rgba(255,255,255,0.08)", color: "#fff", padding: "11px 14px",
                fontSize: 14, outline: "none",
              }}
            />
            <button onClick={() => send()} disabled={busy || !input.trim()} style={{
              borderRadius: 14, border: "none", padding: "0 16px", cursor: "pointer",
              background: "linear-gradient(135deg,#7C5CFF,#FF3DA6)", color: "#fff", fontWeight: 800, fontSize: 13,
              opacity: busy || !input.trim() ? 0.5 : 1,
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
            </button>
          </div>
          <div style={{ padding: "6px 12px 10px", fontSize: 10.5, color: "rgba(255,255,255,0.45)", textAlign: "center", background: "rgba(0,0,0,0.15)" }}>
            {t("BCPL AI can make mistakes — check important details on bcplt20.com", "BCPL AI से गलती हो सकती है — ज़रूरी जानकारी bcplt20.com पर जाँचें")}
          </div>
        </div>
      )}
    </>
  );
}

function Bubble({ role, text, typing }: { role: "user" | "assistant"; text?: string; typing?: boolean }) {
  const user = role === "user";
  return (
    <div className="bcplai-msg" style={{ display: "flex", gap: 8, alignSelf: user ? "flex-end" : "flex-start", maxWidth: "88%" }}>
      {!user && (
        <span style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg,#7C5CFF,#FF3DA6)", border: "1px solid rgba(255,255,255,0.18)", boxShadow: "0 3px 10px rgba(124,92,255,0.4)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, alignSelf: "flex-end" }}>
          <SparkleIcon size={16} />
        </span>
      )}
      <div style={{
        padding: typing ? "11px 14px" : "9px 13px", borderRadius: 16,
        background: user ? "linear-gradient(135deg,#7C5CFF,#9D6BFF)" : "rgba(255,255,255,0.09)",
        color: "#fff", fontSize: 13.5, lineHeight: 1.55, whiteSpace: "pre-wrap",
        border: user ? "none" : "1px solid rgba(255,255,255,0.08)",
        boxShadow: user ? "0 4px 14px rgba(124,92,255,0.35)" : "none",
        borderBottomRightRadius: user ? 5 : 16,
        borderBottomLeftRadius: user ? 16 : 5,
      }}>
        {typing
          ? <span className="bcplai-typing" aria-label="typing"><i /><i /><i /></span>
          : text}
      </div>
      {user && (
        <span style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, alignSelf: "flex-end" }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
        </span>
      )}
    </div>
  );
}

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
.bcplai-fab{position:fixed;right:18px;bottom:18px;z-index:1000;width:58px;height:58px;border-radius:50%;border:none;cursor:pointer;padding:0;background:linear-gradient(135deg,#7C5CFF,#FF3DA6,#00DCF5);box-shadow:0 10px 28px rgba(124,92,255,0.5);display:flex;align-items:center;justify-content:center;}
.bcplai-badge{position:fixed;right:12px;bottom:60px;z-index:1000;pointer-events:none;background:linear-gradient(135deg,#7C5CFF,#FF3DA6);color:#fff;font-size:10px;font-weight:900;letter-spacing:1px;padding:3px 8px;border-radius:999px;box-shadow:0 4px 12px rgba(0,0,0,0.35);}
.bcplai-panel{position:fixed;right:14px;bottom:88px;z-index:1900;width:min(390px,calc(100vw - 28px));height:min(540px,calc(100vh - 130px));display:flex;flex-direction:column;border-radius:20px;overflow:hidden;background:#16264A;border:1px solid rgba(255,255,255,0.14);box-shadow:0 18px 60px rgba(0,0,0,0.55);}
@media(max-width:1023.98px){
  html:not(.bcpl-authed) .bcplai-fab{bottom:calc(92px + env(safe-area-inset-bottom,0px));}
  html:not(.bcpl-authed) .bcplai-badge{bottom:calc(134px + env(safe-area-inset-bottom,0px));}
  html:not(.bcpl-authed) .bcplai-panel{bottom:calc(162px + env(safe-area-inset-bottom,0px));height:min(540px,calc(100vh - 200px - env(safe-area-inset-bottom,0px)));}
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

  const send = async () => {
    const text = input.trim();
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

  const chips: Array<[string, string]> = authed
    ? [["What is my current status?", "मेरा अभी का status क्या है?"], ["When is my trial?", "मेरा trial कब है?"], ["How do I upload my video?", "Video कैसे upload करूँ?"]]
    : [["How do I register?", "Registration कैसे करूँ?"], ["What is the entry fee?", "Entry fee कितनी है?"], ["How do trials work?", "Trials कैसे होते हैं?"]];

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
          <div ref={bodyRef} style={{ flex: 1, overflowY: "auto", padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
            <Bubble role="assistant" text={hello} />
            {msgs.length === 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {chips.map(([en, hi]) => (
                  <button key={en} onClick={() => setInput(t(en, hi))} style={{
                    borderRadius: 999, border: "1px solid rgba(255,255,255,0.2)", background: "rgba(255,255,255,0.06)",
                    color: "rgba(255,255,255,0.85)", fontSize: 12.5, padding: "7px 12px", cursor: "pointer",
                  }}>{t(en, hi)}</button>
                ))}
              </div>
            )}
            {msgs.map((m, i) => <Bubble key={i} role={m.role} text={m.text} />)}
            {busy && <Bubble role="assistant" text={t("Typing…", "लिख रहा है…")} dim />}
            {err && <div style={{ color: "#FF9DB0", fontSize: 12.5, padding: "0 4px" }}>{err}</div>}
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
            <button onClick={send} disabled={busy || !input.trim()} style={{
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

function Bubble({ role, text, dim }: { role: "user" | "assistant"; text: string; dim?: boolean }) {
  const user = role === "user";
  return (
    <div style={{ display: "flex", gap: 8, alignSelf: user ? "flex-end" : "flex-start", maxWidth: "88%", opacity: dim ? 0.7 : 1 }}>
      {!user && (
        <span style={{ width: 26, height: 26, borderRadius: "50%", background: "linear-gradient(135deg,#7C5CFF,#FF3DA6)", border: "1px solid rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, alignSelf: "flex-end" }}>
          <SparkleIcon size={15} />
        </span>
      )}
      <div style={{
        padding: "9px 13px", borderRadius: 14,
        background: user ? "linear-gradient(135deg,#7C5CFF,#9D6BFF)" : "rgba(255,255,255,0.09)",
        color: "#fff", fontSize: 13.5, lineHeight: 1.55, whiteSpace: "pre-wrap",
        borderBottomRightRadius: user ? 4 : 14,
        borderBottomLeftRadius: user ? 14 : 4,
      }}>{text}</div>
    </div>
  );
}

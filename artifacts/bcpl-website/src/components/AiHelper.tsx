import { useEffect, useRef, useState } from "react";
import { useLang } from "../lib/i18n";
import { getSession } from "../lib/auth";
import { aiChat, type AiChatMsg } from "../lib/api";

/**
 * BCPL Helper — floating AI chat for LOGGED-IN players only.
 * Answers journey questions (payment/video/result/KYC/trial) grounded in the
 * player's own status via POST /api/ai/chat. Hidden entirely when logged out
 * (the guest slot belongs to the register CTA) and hidden on /admin & /staff.
 *
 * Z-index: launcher 1000 (CTA band), panel 1900 (above menu 1500, below
 * modals 2000) — see the site z-index scale.
 */
export default function AiHelper() {
  const { t, lang } = useLang();
  const [authed, setAuthed] = useState(!!getSession());
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<AiChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [gone, setGone] = useState(false); // 503 AI_UNAVAILABLE → hide
  const bodyRef = useRef<HTMLDivElement>(null);

  // Track login/logout (html.bcpl-authed toggles + storage events).
  useEffect(() => {
    const check = () => setAuthed(!!getSession());
    const mo = new MutationObserver(check);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    window.addEventListener("storage", check);
    const iv = setInterval(check, 5000);
    return () => { mo.disconnect(); window.removeEventListener("storage", check); clearInterval(iv); };
  }, []);

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs, busy, open]);

  const path = typeof window !== "undefined" ? window.location.pathname : "";
  if (!authed || gone || /\/(admin|staff)(\/|$)/.test(path)) return null;

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
      const anyE = e as { status?: number; message?: string };
      if (anyE.status === 503) { setGone(true); return; }
      setErr(anyE.status === 429
        ? t("Please wait a minute before sending more messages.", "थोड़ी देर रुकें, फिर message भेजें।")
        : t("Could not get an answer — try again.", "जवाब नहीं मिल पाया — दोबारा try करें।"));
    } finally {
      setBusy(false);
    }
  };

  const hello = lang === "hi"
    ? "नमस्ते! मैं BCPL Helper हूँ। Payment, video, result, KYC या trial के बारे में कुछ भी पूछें।"
    : "Hi! I'm BCPL Helper. Ask me anything about your payment, video, result, KYC or trial.";

  return (
    <>
      {/* Launcher */}
      <button
        aria-label={t("BCPL Helper", "BCPL सहायक")}
        onClick={() => setOpen((o) => !o)}
        style={{
          position: "fixed", right: 18, bottom: 18, zIndex: 1000,
          width: 54, height: 54, borderRadius: "50%", border: "none", cursor: "pointer",
          background: "linear-gradient(135deg,#7C5CFF,#FF3DA6)", color: "#fff",
          boxShadow: "0 8px 24px rgba(124,92,255,0.45)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}
      >
        {open ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
        )}
      </button>

      {/* Panel */}
      {open && (
        <div style={{
          position: "fixed", right: 14, bottom: 84, zIndex: 1900,
          width: "min(380px, calc(100vw - 28px))", height: "min(520px, calc(100vh - 120px))",
          display: "flex", flexDirection: "column", borderRadius: 18, overflow: "hidden",
          background: "#1B2E52", border: "1px solid rgba(255,255,255,0.14)",
          boxShadow: "0 18px 60px rgba(0,0,0,0.5)",
        }}>
          <div style={{ padding: "14px 16px", background: "linear-gradient(135deg,#7C5CFF,#FF3DA6)", color: "#fff" }}>
            <div style={{ fontWeight: 800, fontSize: 15 }}>{t("BCPL Helper", "BCPL सहायक")}</div>
            <div style={{ fontSize: 11.5, opacity: 0.9 }}>{t("Answers about your BCPL journey", "आपके BCPL सफर से जुड़े जवाब")}</div>
          </div>

          <div ref={bodyRef} style={{ flex: 1, overflowY: "auto", padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
            <Bubble role="assistant" text={hello} />
            {msgs.map((m, i) => <Bubble key={i} role={m.role} text={m.text} />)}
            {busy && <Bubble role="assistant" text={t("Typing…", "लिख रहा है…")} dim />}
            {err && <div style={{ color: "#FF9DB0", fontSize: 12.5, padding: "0 4px" }}>{err}</div>}
          </div>

          <div style={{ display: "flex", gap: 8, padding: 12, borderTop: "1px solid rgba(255,255,255,0.12)" }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") send(); }}
              placeholder={t("Type your question…", "अपना सवाल लिखें…")}
              maxLength={1200}
              style={{
                flex: 1, borderRadius: 12, border: "1px solid rgba(255,255,255,0.18)",
                background: "rgba(255,255,255,0.08)", color: "#fff", padding: "11px 13px",
                fontSize: 14, outline: "none",
              }}
            />
            <button onClick={send} disabled={busy || !input.trim()} style={{
              borderRadius: 12, border: "none", padding: "0 16px", cursor: "pointer",
              background: "linear-gradient(135deg,#7C5CFF,#FF3DA6)", color: "#fff", fontWeight: 800, fontSize: 13,
              opacity: busy || !input.trim() ? 0.5 : 1,
            }}>{t("Send", "भेजें")}</button>
          </div>
        </div>
      )}
    </>
  );
}

function Bubble({ role, text, dim }: { role: "user" | "assistant"; text: string; dim?: boolean }) {
  const user = role === "user";
  return (
    <div style={{
      alignSelf: user ? "flex-end" : "flex-start",
      maxWidth: "85%", padding: "9px 13px", borderRadius: 14,
      background: user ? "linear-gradient(135deg,#7C5CFF,#9D6BFF)" : "rgba(255,255,255,0.10)",
      color: "#fff", fontSize: 13.5, lineHeight: 1.55, whiteSpace: "pre-wrap",
      opacity: dim ? 0.7 : 1,
      borderBottomRightRadius: user ? 4 : 14,
      borderBottomLeftRadius: user ? 14 : 4,
    }}>{text}</div>
  );
}

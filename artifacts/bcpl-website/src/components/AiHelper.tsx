import { useEffect, useRef, useState } from "react";
import { useLang } from "../lib/i18n";
import { getSession } from "../lib/auth";
import { aiChat, transcribeAudio, type AiChatMsg } from "../lib/api";

/* Minimal ambient typing for the vendor-prefixed Web Speech API (not in TS DOM lib). */
type SpeechRecognitionLike = {
  lang: string; interimResults: boolean; continuous: boolean;
  start: () => void; stop: () => void;
  onresult: ((e: any) => void) | null;
  onerror: ((e: any) => void) | null;
  onend: (() => void) | null;
};
function getSpeechRecognitionCtor(): (new () => SpeechRecognitionLike) | null {
  if (typeof window === "undefined") return null;
  const w = window as any;
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

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
function SparkleIcon({ size = 26, fill = "#fff" }: { size?: number; fill?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} aria-hidden="true">
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
/* Gold→orange launcher: pops against the site's navy so the AI is instantly
   visible. Dark-navy icon inside for strong contrast (passes AA on the light
   gold). A soft pulsing halo (box-shadow ring, no reveal animation) draws the
   eye without moving layout. */
.bcplai-fab{position:fixed;right:18px;bottom:18px;z-index:1000;width:58px;height:58px;border-radius:50%;border:1px solid rgba(255,224,150,0.6);cursor:pointer;padding:0;background:linear-gradient(140deg,#F7C24A 0%,#F5B63F 45%,#EE7A2E 100%);box-shadow:0 10px 28px rgba(238,122,46,0.5),0 0 0 3px rgba(245,182,63,0.22);display:flex;align-items:center;justify-content:center;transition:transform .18s ease, box-shadow .18s ease;animation:bcplaiHalo 2.4s ease-in-out infinite;}
.bcplai-fab:hover{transform:scale(1.06);box-shadow:0 14px 34px rgba(238,122,46,0.6),0 0 0 5px rgba(245,182,63,0.3);}
.bcplai-fab:active{transform:scale(.96);}
@keyframes bcplaiHalo{0%,100%{box-shadow:0 10px 28px rgba(238,122,46,0.5),0 0 0 0 rgba(245,182,63,0.5);}55%{box-shadow:0 12px 32px rgba(238,122,46,0.58),0 0 0 12px rgba(245,182,63,0);}}
.bcplai-badge{position:fixed;right:12px;bottom:60px;z-index:1000;pointer-events:none;background:linear-gradient(135deg,#FFE49A,#F5B63F);color:#3A1D05;font-size:10px;font-weight:900;letter-spacing:1px;padding:3px 8px;border-radius:999px;box-shadow:0 4px 12px rgba(0,0,0,0.35);border:1px solid rgba(255,255,255,0.35);}
.bcplai-panel{position:fixed;right:14px;bottom:88px;z-index:1900;width:min(400px,calc(100vw - 28px));height:min(576px,calc(100vh - 130px));display:flex;flex-direction:column;border-radius:22px;overflow:hidden;background:linear-gradient(180deg,#12244A 0%,#0E1D3D 100%);border:1px solid rgba(245,182,63,0.3);box-shadow:0 22px 66px rgba(4,10,26,0.62);animation:bcplaiPop .22s cubic-bezier(.2,.8,.3,1);transform-origin:bottom right;}
@keyframes bcplaiPop{from{opacity:0;transform:translateY(14px) scale(.96);}to{opacity:1;transform:translateY(0) scale(1);}}
.bcplai-msg{animation:bcplaiMsgIn .24s ease;}
@keyframes bcplaiMsgIn{from{opacity:0;transform:translateY(6px);}to{opacity:1;transform:translateY(0);}}
.bcplai-body{scrollbar-width:thin;scrollbar-color:rgba(126,196,255,.28) transparent;}
.bcplai-body::-webkit-scrollbar{width:6px;}
.bcplai-body::-webkit-scrollbar-thumb{background:rgba(126,196,255,.22);border-radius:6px;}
.bcplai-chip{border-radius:999px;border:1px solid rgba(245,182,63,0.5);background:rgba(245,182,63,0.12);color:#FBDFA0;font-size:12px;font-weight:600;padding:7px 12px;cursor:pointer;white-space:nowrap;transition:background .16s, border-color .16s, transform .12s;}
.bcplai-chip:hover{background:rgba(245,182,63,0.22);border-color:rgba(247,194,74,0.85);}
.bcplai-chip:active{transform:scale(.95);}
.bcplai-chip:disabled{opacity:.45;cursor:not-allowed;}
.bcplai-chiprow{display:flex;gap:8px;overflow-x:auto;padding:10px 12px;border-top:1px solid rgba(255,255,255,0.08);background:rgba(0,0,0,0.16);scrollbar-width:none;}
.bcplai-chiprow::-webkit-scrollbar{display:none;}
.bcplai-typing{display:inline-flex;gap:4px;align-items:center;padding:2px 2px;}
.bcplai-typing i{width:7px;height:7px;border-radius:50%;background:rgba(126,196,255,0.85);display:inline-block;animation:bcplaiDot 1.1s infinite ease-in-out;}
.bcplai-typing i:nth-child(2){animation-delay:.18s;}
.bcplai-typing i:nth-child(3){animation-delay:.36s;}
@keyframes bcplaiDot{0%,80%,100%{transform:translateY(0);opacity:.4;}40%{transform:translateY(-4px);opacity:1;}}
.bcplai-mic{position:relative;flex-shrink:0;width:44px;border-radius:14px;border:1px solid rgba(245,182,63,0.3);background:rgba(255,255,255,0.06);color:#FBDFA0;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:background .16s, border-color .16s, transform .12s;}
.bcplai-mic:hover{background:rgba(245,182,63,0.2);border-color:rgba(247,194,74,0.7);}
.bcplai-mic:active{transform:scale(.94);}
.bcplai-mic:disabled{opacity:.5;cursor:not-allowed;}
.bcplai-mic.rec{background:linear-gradient(135deg,#E23B4E,#FF6A78);border-color:rgba(255,120,132,0.8);color:#fff;animation:bcplaiRec 1.15s ease-in-out infinite;}
@keyframes bcplaiRec{0%,100%{box-shadow:0 0 0 0 rgba(226,59,78,0.55);}50%{box-shadow:0 0 0 8px rgba(226,59,78,0);}}
@media(prefers-reduced-motion:reduce){.bcplai-panel,.bcplai-msg,.bcplai-fab{animation:none;}.bcplai-typing i{animation:none;}.bcplai-mic.rec{animation:none;}}
/* ── GLOBAL FLOATING-BUTTON OVERLAP FIX ──────────────────────────────────────
   The AI FAB sits bottom-right (right:18px; bottom:18px, 58px wide). ~19 pages
   also render a desktop-only floating register button (.float-reg-btn) pinned
   at bottom:28px; right:28px — which lands ON TOP of the AI bubble. Instead of
   editing every page, we reposition .float-reg-btn ONCE here (this stylesheet
   is injected by AiHelper, which mounts on every public page) so the register
   button always stacks ABOVE the AI bubble in the same right-hand column.
   The html prefix raises specificity so this wins over the per-page single-
   class rules regardless of stylesheet order. Desktop only — button is hidden
   below 1024px, where the phone StickyRegisterCTA bar takes over instead. */
@media(min-width:1024px){
  html .float-reg-btn{
    right:18px !important;
    bottom:calc(18px + 58px + 16px) !important; /* AI FAB base + FAB height + gap = 92px */
  }
}
/* Logged-out: clear the mobile sticky register bar. */
@media(max-width:1023.98px){
  html:not(.bcpl-authed) .bcplai-fab{bottom:calc(92px + env(safe-area-inset-bottom,0px));}
  html:not(.bcpl-authed) .bcplai-badge{bottom:calc(134px + env(safe-area-inset-bottom,0px));}
  html:not(.bcpl-authed) .bcplai-panel{bottom:calc(162px + env(safe-area-inset-bottom,0px));height:min(560px,calc(100vh - 200px - env(safe-area-inset-bottom,0px)));}
}
/* Profile page mobile bottom-nav (.mob-bottom-nav, <768px): lift the widget clear of it. */
@media(max-width:767.98px){
  html.bcpl-mobnav .bcplai-fab{bottom:calc(84px + env(safe-area-inset-bottom,0px));}
  html.bcpl-mobnav .bcplai-badge{bottom:calc(126px + env(safe-area-inset-bottom,0px));}
  html.bcpl-mobnav .bcplai-panel{bottom:calc(150px + env(safe-area-inset-bottom,0px));height:min(560px,calc(100vh - 190px - env(safe-area-inset-bottom,0px)));}
  /* When the AI panel is open, hide the bottom-nav so they never overlap. */
  html.bcpl-mobnav.bcpl-ai-open .mob-bottom-nav{display:none;}
  html.bcpl-mobnav.bcpl-ai-open .bcplai-fab{bottom:calc(18px + env(safe-area-inset-bottom,0px));}
  html.bcpl-mobnav.bcpl-ai-open .bcplai-panel{bottom:calc(88px + env(safe-area-inset-bottom,0px));height:min(576px,calc(100vh - 130px - env(safe-area-inset-bottom,0px)));}
}

/* ── PHONE (<=480px): open as a TRUE full-screen sheet ───────────────────────
   Root cause of the owner's "cut" panel: the floating panel used 100vh + a
   fixed bottom offset, so the mobile URL bar ate the bottom (input/disclaimer
   clipped off-screen). Fix: pin the panel to all four edges with 100dvw/100dvh
   (dvh tracks the *visible* viewport, immune to URL-bar resize), zero radius,
   safe-area padding, and let the internal flex column pin the composer above
   the keyboard. Geometry uses !important to defeat the broader <=1023.98 /
   <=767.98 rules above which also match at phone widths. Desktop is untouched. */
@media(max-width:480px){
  .bcplai-panel{
    inset:0 !important; top:0 !important; right:0 !important; bottom:0 !important; left:0 !important;
    width:100vw !important; height:100vh !important;            /* fallback */
    width:100dvw !important; height:100dvh !important;          /* visible viewport — no URL-bar clip */
    max-width:none !important; max-height:none !important;
    border-radius:0 !important; border:none !important;
    box-shadow:none !important; animation:none !important;
  }
  /* Header clears the notch/status bar. */
  .bcplai-header{padding-top:calc(14px + env(safe-area-inset-top,0px)) !important;}
  /* Disclaimer is the last element — pad it down past the home-bar safe area
     so nothing sits under the gesture bar. */
  .bcplai-disclaimer{padding-bottom:calc(10px + env(safe-area-inset-bottom,0px)) !important;}
  /* Full-screen sheet is self-closing via its ✕ — the floating bubble/badge
     would only overlap the sheet, so hide them while open. */
  html.bcpl-ai-open .bcplai-fab,
  html.bcpl-ai-open .bcplai-badge{display:none !important;}
  /* >=16px input prevents iOS Safari's auto-zoom (a common "the panel jumped /
     got cut" trigger when the field focuses). */
  .bcplai-composer input{font-size:16px !important;}
  /* Lock horizontal overflow inside the sheet. */
  .bcplai-panel{overflow-x:hidden;}
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
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);
  const recogRef = useRef<SpeechRecognitionLike | null>(null);
  const mediaRecRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const baseInputRef = useRef("");   // text present before dictation started

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs, busy, open, transcribing]);

  /* Keep the mobile profile bottom-nav (.mob-bottom-nav) from overlapping the
     widget: mirror its presence to <html>, and mark <html> while the panel is
     open so we can hide the nav (they never share the bottom-right corner). */
  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    const sync = () => root.classList.toggle("bcpl-mobnav", !!document.querySelector(".mob-bottom-nav"));
    sync();
    const mo = new MutationObserver(sync);
    mo.observe(document.body, { childList: true, subtree: true });
    return () => { mo.disconnect(); root.classList.remove("bcpl-mobnav"); };
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.classList.toggle("bcpl-ai-open", open);
    return () => document.documentElement.classList.remove("bcpl-ai-open");
  }, [open]);

  /* Cleanup any live recognition / recorder when the panel closes/unmounts. */
  useEffect(() => {
    if (!open) stopRecording();
    return () => stopRecording();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

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

  const speechLang = lang === "hi" ? "hi-IN" : "en-IN";

  /* Stop whichever capture is active — safe to call multiple times. */
  function stopRecording() {
    const r = recogRef.current;
    if (r) { try { r.stop(); } catch { /* ignore */ } recogRef.current = null; }
    const mr = mediaRecRef.current;
    if (mr && mr.state !== "inactive") { try { mr.stop(); } catch { /* ignore */ } }
    setRecording(false);
  }

  const permissionDeniedMsg = () =>
    t("Microphone access denied. Please allow mic permission in your browser.",
      "माइक की अनुमति नहीं मिली। कृपया browser में mic permission allow करें।");

  /* Primary path: on-device Web Speech API → interim results stream into input. */
  const startSpeechRecognition = (Ctor: new () => SpeechRecognitionLike) => {
    setErr("");
    baseInputRef.current = input ? input.trim() + " " : "";
    const rec = new Ctor();
    rec.lang = speechLang;
    rec.interimResults = true;
    rec.continuous = true;
    rec.onresult = (e: any) => {
      let out = "";
      for (let i = 0; i < e.results.length; i++) out += e.results[i][0]?.transcript ?? "";
      setInput((baseInputRef.current + out).slice(0, 1200));
    };
    rec.onerror = (e: any) => {
      const code = e?.error;
      if (code === "not-allowed" || code === "service-not-allowed") setErr(permissionDeniedMsg());
      else if (code !== "aborted" && code !== "no-speech") setErr(t("Voice input failed — please type instead.", "आवाज़ input नहीं हो पाई — कृपया type करें।"));
      stopRecording();
    };
    rec.onend = () => { recogRef.current = null; setRecording(false); };
    recogRef.current = rec;
    try { rec.start(); setRecording(true); }
    catch { setRecording(false); setErr(t("Voice input failed — please type instead.", "आवाज़ input नहीं हो पाई — कृपया type करें।")); }
  };

  /* Fallback path: record audio → POST to /api/ai/transcribe (null-safe). */
  const startMediaRecorderFallback = async () => {
    setErr("");
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setErr(t("Voice input isn't supported on this browser.", "इस browser पर voice input support नहीं है।"));
      return;
    }
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setErr(permissionDeniedMsg());
      return;
    }
    chunksRef.current = [];
    const mime = ["audio/webm", "audio/mp4", "audio/ogg"].find(m => MediaRecorder.isTypeSupported?.(m));
    const mr = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
    mediaRecRef.current = mr;
    mr.ondataavailable = (ev) => { if (ev.data.size > 0) chunksRef.current.push(ev.data); };
    mr.onstop = async () => {
      stream.getTracks().forEach(tr => tr.stop());
      mediaRecRef.current = null;
      const blob = new Blob(chunksRef.current, { type: mr.mimeType || "audio/webm" });
      chunksRef.current = [];
      if (!blob.size) return;
      setTranscribing(true);
      try {
        const { text } = await transcribeAudio(blob, speechLang);
        if (text) setInput(prev => (prev ? prev.trim() + " " : "") + text.trim());
        else setErr(t("Couldn't understand the audio — please try again.", "आवाज़ समझ नहीं आई — दोबारा try करें।"));
      } catch (e) {
        const st = (e as { status?: number }).status;
        setErr(st === 404
          ? t("Voice transcription isn't available yet — please type.", "Voice transcription अभी available नहीं है — कृपया type करें।")
          : t("Voice transcription failed — please type instead.", "Voice transcription fail हुआ — कृपया type करें।"));
      } finally {
        setTranscribing(false);
      }
    };
    try { mr.start(); setRecording(true); }
    catch { stream.getTracks().forEach(tr => tr.stop()); setRecording(false); setErr(t("Voice input failed — please type instead.", "आवाज़ input नहीं हो पाई — कृपया type करें।")); }
  };

  const toggleMic = () => {
    if (recording) { stopRecording(); return; }
    if (busy || transcribing) return;
    const Ctor = getSpeechRecognitionCtor();
    if (Ctor) startSpeechRecognition(Ctor);
    else void startMediaRecorderFallback();
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
    ["How do I register?", "Registration कैसे करूँ?"],
    ["Which cities have trials?", "Trials किन शहरों में हैं?"],
    ["What is the KYC process?", "KYC process क्या है?"],
    ["How does the points table work?", "Points table कैसे काम करता है?"],
    ["Explain the rain rule (DLS)", "बारिश का नियम (DLS) समझाइए"],
    ["Phase 1 registration fee?", "Phase 1 registration fee?"],
    ["What is the winning prize?", "Winning prize कितना है?"],
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
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1B2E52" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
        ) : (
          <SparkleIcon size={30} fill="#1B2E52" />
        )}
      </button>
      {/* "AI" badge on the launcher */}
      {!open && <span className="bcplai-badge">AI</span>}

      {/* Panel */}
      {open && (
        <div className="bcplai-panel">
          {/* Header */}
          <div className="bcplai-header" style={{ position: "relative", padding: "14px 16px", background: "linear-gradient(120deg,#F7C24A 0%,#F5B63F 45%,#EE7A2E 100%)", borderBottom: "1px solid rgba(120,60,10,0.22)", flexShrink: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ width: 40, height: 40, borderRadius: "50%", background: "linear-gradient(135deg,#1B2E52,#24396B)", border: "1px solid rgba(255,255,255,0.4)", boxShadow: "0 4px 14px rgba(27,46,82,0.4)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <SparkleIcon size={22} fill="#F7C24A" />
              </span>
              <div>
                <div style={{ color: "#231204", fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 19, letterSpacing: ".06em", lineHeight: 1.1 }}>
                  BCPL <span style={{ color: "#1B2E52" }}>AI</span>
                </div>
                <div style={{ fontSize: 11.5, color: "rgba(45,24,4,0.82)", fontWeight: 600 }}>{t("Official BCPL assistant — ask by voice or text", "BCPL का आधिकारिक सहायक — बोलकर या लिखकर पूछें")}</div>
              </div>
              <span style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 5, fontSize: 10, fontWeight: 900, color: "#12401F", letterSpacing: 1 }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#0E7A3A", boxShadow: "0 0 8px rgba(14,122,58,0.8)" }} />
                {t("ONLINE", "ऑनलाइन")}
              </span>
              {/* Prominent close */}
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label={t("Close", "बंद करें")}
                title={t("Close", "बंद करें")}
                style={{ width: 32, height: 32, flexShrink: 0, borderRadius: 10, border: "1px solid rgba(35,18,4,0.35)", background: "rgba(35,18,4,0.14)", color: "#231204", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
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
          <div className="bcplai-composer" style={{ display: "flex", gap: 8, padding: 12, borderTop: "1px solid rgba(255,255,255,0.10)", background: "rgba(0,0,0,0.18)", alignItems: "stretch", flexShrink: 0 }}>
            {/* Mic — Web Speech API primary, MediaRecorder→/ai/transcribe fallback */}
            <button
              type="button"
              onClick={toggleMic}
              disabled={busy || transcribing}
              className={`bcplai-mic${recording ? " rec" : ""}`}
              aria-pressed={recording}
              aria-label={recording ? t("Stop recording", "रिकॉर्डिंग रोकें") : t("Speak your question", "बोलकर पूछें")}
              title={recording ? t("Stop recording", "रिकॉर्डिंग रोकें") : t("Speak your question", "बोलकर पूछें")}
            >
              {recording ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6" y="6" width="12" height="12" rx="2" /></svg>
              ) : transcribing ? (
                <span className="bcplai-typing" style={{ transform: "scale(.8)" }}><i /><i /><i /></span>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" /></svg>
              )}
            </button>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") send(); }}
              placeholder={recording ? t("Listening…", "सुन रहा हूँ…") : t("Ask BCPL AI…", "BCPL AI से पूछें…")}
              maxLength={1200}
              style={{
                flex: 1, borderRadius: 14, border: "1px solid rgba(245,182,63,0.28)",
                background: "rgba(255,255,255,0.07)", color: "#fff", padding: "11px 14px",
                fontSize: 14, outline: "none",
              }}
            />
            <button onClick={() => send()} disabled={busy || !input.trim()} aria-label={t("Send", "भेजें")} style={{
              borderRadius: 14, border: "none", padding: "0 16px", cursor: "pointer",
              background: "linear-gradient(135deg,#F7C24A,#EE7A2E)", color: "#231204", fontWeight: 900, fontSize: 13,
              opacity: busy || !input.trim() ? 0.5 : 1,
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
            </button>
          </div>
          <div className="bcplai-disclaimer" style={{ padding: "6px 12px 10px", fontSize: 10.5, color: "rgba(255,255,255,0.45)", textAlign: "center", background: "rgba(0,0,0,0.15)", flexShrink: 0 }}>
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
        <span style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg,#F7C24A,#EE7A2E)", border: "1px solid rgba(255,255,255,0.22)", boxShadow: "0 3px 10px rgba(238,122,46,0.4)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, alignSelf: "flex-end" }}>
          <SparkleIcon size={16} fill="#1B2E52" />
        </span>
      )}
      <div style={{
        padding: typing ? "11px 14px" : "9px 13px", borderRadius: 16,
        background: user ? "linear-gradient(135deg,#F7C24A,#EE7A2E)" : "rgba(255,255,255,0.08)",
        color: user ? "#231204" : "#fff", fontSize: 13.5, lineHeight: 1.55, whiteSpace: "pre-wrap",
        fontWeight: user ? 600 : 400,
        border: user ? "none" : "1px solid rgba(245,182,63,0.16)",
        boxShadow: user ? "0 4px 14px rgba(238,122,46,0.32)" : "none",
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

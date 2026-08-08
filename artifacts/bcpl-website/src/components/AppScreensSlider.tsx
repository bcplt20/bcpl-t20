import { useCallback, useEffect, useRef, useState } from "react";
import { useLang } from "../lib/i18n";

const BASE = import.meta.env.BASE_URL;

/* ------------------------------------------------------------------ *
 * App-screen slider for the /download hero.
 * 10 REAL screenshots captured from the actual BCPL app —
 * 5 in light (daylight) theme, 5 in dark (stadium) theme.
 * - Desktop: arrows + dots + auto-advance (~4s, pause on hover).
 * - Mobile: horizontal scroll-snap swipe with a peek of the next slide.
 * - Fully keyboard accessible; NO scroll-reveal/fade-in animations.
 * ------------------------------------------------------------------ */

const CSS = `
.aps { position:relative; width:min(400px,100%); }
@media (max-width:899px){ .aps{ width:100%; } }

/* ---- viewport / track ---- */
.aps-vp { position:relative; }
.aps-track { display:flex; gap:0; overflow-x:auto; scroll-snap-type:x mandatory; -webkit-overflow-scrolling:touch; scrollbar-width:none; padding:6px 0 12px; }
.aps-track::-webkit-scrollbar{ display:none; }
.aps-slide { flex:0 0 100%; scroll-snap-align:center; display:flex; justify-content:center; }
@media (max-width:899px){ .aps-slide{ flex:0 0 82%; } }

/* ---- phone frame ---- */
.aps-phone { position:relative; width:min(288px,72vw); border-radius:42px; padding:10px; background:linear-gradient(160deg,#05070f,#191d3a); border:2px solid rgba(255,255,255,.14); box-shadow:0 34px 80px rgba(0,0,0,.55), inset 0 1px 0 rgba(255,255,255,.14); }
.aps-phone::before{ content:''; position:absolute; top:11px; left:50%; transform:translateX(-50%); width:104px; height:20px; border-radius:0 0 14px 14px; background:#04060d; z-index:6; }
.aps-shot { display:block; width:100%; aspect-ratio:402/874; object-fit:cover; border-radius:32px; background:#101433; }

/* ---- controls ---- */
.aps-ctrls { display:flex; align-items:center; justify-content:center; gap:14px; margin-top:14px; }
.aps-arrow { display:inline-flex; align-items:center; justify-content:center; width:38px; height:38px; border-radius:50%; border:1px solid rgba(255,255,255,.22); background:rgba(255,255,255,.07); color:#fff; cursor:pointer; transition:background .15s ease, border-color .15s ease; }
.aps-arrow:hover { background:rgba(255,255,255,.15); border-color:rgba(255,255,255,.4); }
.aps-arrow:focus-visible { outline:2px solid #00DCF5; outline-offset:2px; }
.aps-dots { display:flex; gap:7px; align-items:center; }
.aps-dot { width:8px; height:8px; border-radius:100px; border:none; padding:0; background:rgba(255,255,255,.28); cursor:pointer; transition:width .2s ease, background .2s ease; }
.aps-dot.on { width:22px; background:linear-gradient(90deg,#7C5CFF,#FF3DA6); }
.aps-dot:focus-visible { outline:2px solid #00DCF5; outline-offset:2px; }
@media (max-width:899px){ .aps-arrow{ display:none; } }

/* ---- caption ---- */
.aps-cap { text-align:center; margin-top:10px; min-height:44px; }
.aps-cap .k { font-family:'Barlow Condensed','Montserrat',sans-serif; font-weight:800; text-transform:uppercase; letter-spacing:.04em; font-size:17px; color:#fff; }
.aps-cap .d { font-size:12.5px; color:rgba(255,255,255,.72); margin-top:2px; }
.aps-cap .th { display:inline-block; margin-left:8px; vertical-align:2px; font-size:8.5px; font-weight:800; letter-spacing:.1em; text-transform:uppercase; border-radius:100px; padding:2px 8px; }
.aps-cap .th.light { background:rgba(255,255,255,.9); color:#3a2b73; }
.aps-cap .th.dark { background:rgba(124,92,255,.35); border:1px solid rgba(124,92,255,.6); color:#fff; }
`;

type Shot = { img: string; theme: "light" | "dark"; kEn: string; kHi: string; dEn: string; dHi: string };

const SHOTS: Shot[] = [
  { img: "home-light.jpg", theme: "light", kEn: "Home", kHi: "होम", dEn: "Everything BCPL on one home screen", dHi: "पूरा BCPL एक होम स्क्रीन पर" },
  { img: "match-dark.jpg", theme: "dark", kEn: "Match Center", kHi: "मैच सेंटर", dEn: "Live score, scorecard and moments", dHi: "लाइव स्कोर, स्कोरकार्ड और मोमेंट्स" },
  { img: "playercard-light.jpg", theme: "light", kEn: "Player Card", kHi: "प्लेयर कार्ड", dEn: "Your shareable BCPL player card", dHi: "आपका शेयर-योग्य BCPL प्लेयर कार्ड" },
  { img: "points-dark.jpg", theme: "dark", kEn: "Points Table", kHi: "पॉइंट्स टेबल", dEn: "Group-wise standings and NRR", dHi: "ग्रुप-वार स्टैंडिंग और NRR" },
  { img: "journey-light.jpg", theme: "light", kEn: "My Journey", kHi: "मेरी यात्रा", dEn: "Track your journey step by step", dHi: "अपनी यात्रा कदम-दर-कदम देखें" },
  { img: "mvp-dark.jpg", theme: "dark", kEn: "MVP Race", kHi: "MVP रेस", dEn: "Leaderboard and points system", dHi: "लीडरबोर्ड और पॉइंट्स सिस्टम" },
  { img: "trialpass-light.jpg", theme: "light", kEn: "Trial Pass", kHi: "ट्रायल पास", dEn: "Your digital trial pass with QR", dHi: "QR वाला आपका डिजिटल ट्रायल पास" },
  { img: "vote-dark.jpg", theme: "dark", kEn: "Fan Voting", kHi: "फैन वोटिंग", dEn: "Vote in live fan polls", dHi: "लाइव फैन पोल में वोट करें" },
  { img: "matches-light.jpg", theme: "light", kEn: "Matches", kHi: "मैच", dEn: "Fixtures and countdowns", dHi: "फिक्स्चर और काउंटडाउन" },
  { img: "notifications-dark.jpg", theme: "dark", kEn: "Updates", kHi: "अपडेट", dEn: "Trial, result and match alerts", dHi: "ट्रायल, रिज़ल्ट और मैच अलर्ट" },
];

export function AppScreensSlider() {
  const { t } = useLang();
  const trackRef = useRef<HTMLDivElement>(null);
  const [idx, setIdx] = useState(0);
  const [hover, setHover] = useState(false);
  const programmatic = useRef(false);
  const N = SHOTS.length;

  const goTo = useCallback((i: number) => {
    const track = trackRef.current;
    if (!track) return;
    const clamped = ((i % N) + N) % N;
    const slide = track.children[clamped] as HTMLElement | undefined;
    if (!slide) return;
    programmatic.current = true;
    track.scrollTo({ left: slide.offsetLeft - (track.offsetWidth - slide.offsetWidth) / 2, behavior: "smooth" });
    setIdx(clamped);
    window.setTimeout(() => { programmatic.current = false; }, 500);
  }, [N]);

  // keep idx in sync when the user swipes/scrolls manually
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    let raf = 0;
    const onScroll = () => {
      if (programmatic.current) return;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const center = track.scrollLeft + track.offsetWidth / 2;
        let best = 0, bestD = Infinity;
        for (let i = 0; i < track.children.length; i++) {
          const c = track.children[i] as HTMLElement;
          const cc = c.offsetLeft + c.offsetWidth / 2;
          const d = Math.abs(cc - center);
          if (d < bestD) { bestD = d; best = i; }
        }
        setIdx(best);
      });
    };
    track.addEventListener("scroll", onScroll, { passive: true });
    return () => { track.removeEventListener("scroll", onScroll); cancelAnimationFrame(raf); };
  }, []);

  // auto-advance (~4s), paused on hover/focus
  useEffect(() => {
    if (hover) return;
    const id = window.setInterval(() => goTo(idx + 1), 4000);
    return () => window.clearInterval(id);
  }, [idx, hover, goTo]);

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") { e.preventDefault(); goTo(idx + 1); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); goTo(idx - 1); }
  };

  const cur = SHOTS[idx];

  return (
    <div
      className="aps"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onFocus={() => setHover(true)}
      onBlur={() => setHover(false)}
    >
      <style>{CSS}</style>
      <div
        className="aps-vp"
        role="region"
        aria-roledescription="carousel"
        aria-label={t("BCPL app screens", "BCPL app स्क्रीन")}
        tabIndex={0}
        onKeyDown={onKey}
      >
        <div className="aps-track" ref={trackRef}>
          {SHOTS.map((s, i) => (
            <div
              className="aps-slide"
              key={s.img}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} / ${N} — ${t(s.kEn, s.kHi)}`}
              aria-hidden={i !== idx}
            >
              <div className="aps-phone">
                <img
                  className="aps-shot"
                  src={`${BASE}app-screens/${s.img}`}
                  alt={t(s.kEn, s.kHi)}
                  loading={i === 0 ? "eager" : "lazy"}
                  decoding="async"
                  width={402}
                  height={874}
                  draggable={false}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="aps-ctrls">
        <button type="button" className="aps-arrow" aria-label={t("Previous screen", "पिछली स्क्रीन")} onClick={() => goTo(idx - 1)}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
        </button>
        <div className="aps-dots" role="tablist" aria-label={t("Choose app screen", "स्क्रीन चुनें")}>
          {SHOTS.map((s, i) => (
            <button
              key={s.img}
              type="button"
              className={"aps-dot" + (i === idx ? " on" : "")}
              role="tab"
              aria-selected={i === idx}
              aria-label={t(s.kEn, s.kHi)}
              onClick={() => goTo(i)}
            />
          ))}
        </div>
        <button type="button" className="aps-arrow" aria-label={t("Next screen", "अगली स्क्रीन")} onClick={() => goTo(idx + 1)}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
        </button>
      </div>

      <div className="aps-cap" aria-live="polite">
        <div className="k">
          {t(cur.kEn, cur.kHi)}
          <span className={"th " + cur.theme}>{cur.theme === "light" ? t("Light", "लाइट") : t("Dark", "डार्क")}</span>
        </div>
        <div className="d">{t(cur.dEn, cur.dHi)}</div>
      </div>
    </div>
  );
}

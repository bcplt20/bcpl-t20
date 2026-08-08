import { useCallback, useEffect, useRef, useState } from "react";
import { useLang } from "../lib/i18n";

const BASE = import.meta.env.BASE_URL;

/* ------------------------------------------------------------------ *
 * App-screen slider for the /download hero.
 * Shows the 10 official store-listing panels (the same premium artwork
 * prepared for the App Store / Play Store listing) at their full
 * 1290x2796 aspect ratio — nothing cropped.
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

/* ---- store panel ---- */
.aps-shot { display:block; width:min(320px,78vw); aspect-ratio:1290/2796; height:auto; object-fit:contain; border-radius:26px; background:#101433; border:1px solid rgba(255,255,255,.14); box-shadow:0 34px 80px rgba(0,0,0,.55); }

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
`;

type Shot = { img: string; kEn: string; kHi: string; dEn: string; dHi: string };

const SHOTS: Shot[] = [
  { img: "store-1.webp", kEn: "From Office to Stadium", kHi: "Office से Stadium तक", dEn: "Start your cricket dream with BCPL", dHi: "अपने cricket सपने की शुरुआत करें" },
  { img: "store-2.webp", kEn: "Register in Minutes", kHi: "मिनटों में Register", dEn: "Complete your registration in about 2 minutes", dHi: "करीब 2 मिनट में registration पूरा" },
  { img: "store-3.webp", kEn: "Show Your Skills", kHi: "अपना हुनर दिखाएँ", dEn: "Upload a 30–90 second video — trial from home", dHi: "30–90 second का video upload करें — घर बैठे trial" },
  { img: "store-4.webp", kEn: "Your Official Scorecard", kHi: "आपका official scorecard", dEn: "See your score and rank in every category", dHi: "हर category का score और अपनी rank देखें" },
  { img: "store-5.webp", kEn: "On to Phase 2", kHi: "अब Phase 2 की ओर", dEn: "Clear Phase 1 and move ahead", dHi: "Phase 1 पास — अब Phase 2 का रास्ता" },
  { img: "store-6.webp", kEn: "Your Trial Pass", kHi: "आपका Trial Pass", dEn: "Show the QR at the gate — venue, batch and time included", dHi: "QR गेट पर दिखाएँ — venue, batch और reporting time साथ" },
  { img: "store-7.webp", kEn: "The Road to Auction", kHi: "Auction तक का सफर", dEn: "From physical trials to the auction table", dHi: "Physical trial के बाद auction तक का सफर" },
  { img: "store-8.webp", kEn: "Live Matches & Scores", kHi: "Live matches और scores", dEn: "Every match, every score — in one place", dHi: "हर match, हर score — एक जगह" },
  { img: "store-9.webp", kEn: "10 Franchises. One Dream.", kHi: "10 franchises, एक सपना", dEn: "Pick your team and follow it all season", dHi: "अपनी team चुनिए" },
  { img: "store-10.webp", kEn: "Real Stakes. Real Rewards.", kHi: "असली मुकाबला, असली इनाम", dEn: "Winning team prize ₹6 crore · Auction ₹2–20 lakh", dHi: "Winning prize ₹6 करोड़ · Auction में ₹2–20 लाख" },
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
              <img
                className="aps-shot"
                src={`${BASE}store-shots/${s.img}`}
                alt={t(s.kEn, s.kHi)}
                loading={i === 0 ? "eager" : "lazy"}
                decoding="async"
                width={645}
                height={1398}
                draggable={false}
              />
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
        <div className="k">{t(cur.kEn, cur.kHi)}</div>
        <div className="d">{t(cur.dEn, cur.dHi)}</div>
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { NavUser, useAuthUser } from "./NavUser";
import { getNextAction } from "../lib/api";
import { useLang } from "../lib/i18n";

/**
 * SiteHeader V4 — the one shared header on every page (spec Part 4).
 *
 * Desktop:  [BCPL logo, SEASON 5 centered under it]   Teams Players Trials Matches Auction Media About   [EN|हिंदी · Login · REGISTER NOW]
 * Mobile:   [same stacked lockup]                       [profile] [REGISTER] [☰]
 *
 * Behaviour: fully transparent over the hero, premium dark glass + blur +
 * hairline border once scrolled. Height = var(--sh-h): 64px mobile, 68px
 * desktop — pages offset sticky elements with var(--sh-h) instead of a magic
 * number. Mobile menu is a full-height premium sheet (z-index 1500; header
 * stays at 200 per the project z-index scale).
 *
 * Self-contained (sh- CSS) so it renders identically on all pages.
 * Usage: <SiteHeader active="Teams" />  (legacy active names still work)
 */

type NavItem = { key: string; en: string; hi: string; href: string };

const LINKS: NavItem[] = [
  { key: "Teams",     en: "Teams",     hi: "टीमें",      href: "/teams" },
  { key: "Players",   en: "Players",   hi: "खिलाड़ी",    href: "/players" },
  { key: "Trials",    en: "Trials",    hi: "ट्रायल्स",   href: "/trust" },
  { key: "Matches",   en: "Matches",   hi: "मैच",        href: "/match-center" },
  { key: "Auction",   en: "Auction",   hi: "ऑक्शन",      href: "/auction/live" },
  { key: "Media",     en: "Media",     hi: "मीडिया",     href: "/photos" },
  { key: "About",     en: "About",     hi: "परिचय",      href: "/about" },
];

/* Mobile menu lists the fuller map — the top bar stays minimal. */
const MOB_LINKS: NavItem[] = [
  { key: "Home",      en: "Home",         hi: "होम",           href: "/" },
  { key: "Teams",     en: "Teams",        hi: "टीमें",          href: "/teams" },
  { key: "Players",   en: "Players",      hi: "खिलाड़ी",        href: "/players" },
  { key: "Trials",    en: "Trials",       hi: "ट्रायल्स",       href: "/trust" },
  { key: "Matches",   en: "Match Centre", hi: "मैच सेंटर",      href: "/match-center" },
  { key: "Standings", en: "Standings",    hi: "अंक तालिका",     href: "/points-table" },
  { key: "Auction",   en: "Auction",      hi: "ऑक्शन",          href: "/auction/live" },
  { key: "Photos",    en: "Photos",       hi: "फ़ोटो",          href: "/photos" },
  { key: "Videos",    en: "Videos",       hi: "वीडियो",         href: "/videos" },
  { key: "About",     en: "About BCPL",   hi: "BCPL परिचय",     href: "/about" },
  { key: "Contact",   en: "Contact",      hi: "संपर्क",         href: "/contact" },
];

/* Pages pass legacy `active` names — map them onto V4 nav keys. */
const ACTIVE_MAP: Record<string, string> = {
  "Home": "Home", "Teams": "Teams", "Players": "Players",
  "Match Center": "Matches", "Schedule": "Matches", "Points Table": "Standings",
  "Photos": "Media", "Videos": "Media", "Media": "Media",
  "Trust": "Trials", "Trials": "Trials",
  "About": "About", "Contact": "Contact", "Auction": "Auction",
};

const WHATSAPP_URL = "https://wa.me/919151346555";

/* getPlayerNextAction() → header CTA. The server computes the action from
   REAL registration state; we only map it to a label + path here. MY_BCPL or
   unknown → no extra CTA (the MY BCPL button is always there when logged in). */
const NEXT_CTA: Record<string, { en: string; hi: string; href: string }> = {
  REGISTER:         { en: "Register for Phase 1",  hi: "Phase 1 रजिस्टर करें",    href: "/register" },
  COMPLETE_PAYMENT: { en: "Complete Registration", hi: "Registration पूरा करें",  href: "/register" },
  UPLOAD_VIDEO:     { en: "Upload Video",          hi: "Video Upload करें",       href: "/register/upload-video" },
  WAIT_FOR_RESULT:  { en: "Track Result",          hi: "Result Track करें",       href: "/register/result" },
  VIEW_RESULT:      { en: "View Result",           hi: "Result देखें",            href: "/register/result" },
  CONTINUE_PHASE2:  { en: "Continue to Phase 2",   hi: "Phase 2 जारी रखें",       href: "/register/phase2" },
  COMPLETE_KYC:     { en: "Complete KYC",          hi: "KYC पूरा करें",           href: "/register/phase2/kyc" },
  VIEW_TRIAL:       { en: "Trial Details",         hi: "Trial Details",           href: "/register/phase2/kyc-approved" },
  VIEW_TRIAL_PASS:  { en: "View Trial Pass",       hi: "Trial Pass देखें",         href: "/trial-pass" },
};

const CSS = `
  :root{--sh-h:64px;}
  @media(min-width:1024px){:root{--sh-h:68px;}}

  .sh-W{max-width:var(--container,1240px);margin:0 auto;padding:0 16px;}
  @media(min-width:768px){.sh-W{padding:0 32px;}}
  @media(min-width:1280px){.sh-W{padding:0 48px;}}

  .sh-link{font-family:'Barlow Condensed','Mukta',sans-serif;font-weight:700;font-size:15.5px;letter-spacing:.09em;color:rgba(255,255,255,.62);text-decoration:none;text-transform:uppercase;transition:color .2s;white-space:nowrap;padding:6px 2px;}
  .sh-link:hover{color:#fff;}
  .sh-link-active{color:#FF7A29;}
  .sh-link-active:hover{color:#FF7A29;}

  .sh-desk{display:none;}
  .sh-deskbar{display:none;}
  .sh-mobbar{display:flex;align-items:center;justify-content:space-between;gap:8px;height:var(--sh-h);}
  .sh-mobright{display:flex;align-items:center;gap:6px;flex-shrink:0;}
  /* Wings are content-sized (flex:0 0 auto in JSX) so the centre nav gets ALL
     leftover space — the old symmetric flex:1 wings starved the links and
     "About" slid under the language toggle at 1024–1366px. Link size steps
     down at 1024 so every label fits without overlap. */
  @media(min-width:1024px){
    .sh-deskbar{display:flex;align-items:center;height:var(--sh-h);gap:14px;}
    .sh-desk{display:flex;gap:10px;align-items:center;justify-content:center;flex:1 1 0;min-width:0;}
    .sh-link{font-size:14px;letter-spacing:.075em;}
    .sh-mobbar{display:none;}
  }
  @media(min-width:1280px){.sh-deskbar{gap:16px;}.sh-desk{gap:20px;}.sh-link{font-size:15.5px;letter-spacing:.09em;}}
  @media(min-width:1440px){.sh-desk{gap:26px;}}

  /* SEASON 5 sits centered UNDER the logo (stacked lockup — fits every phone).
     padding-left mirrors the letter-spacing so the text is optically centered
     (tracking adds a trailing gap that would otherwise pull it left). */
  /* Refined lockup: Inter at tiny size + wide tracking reads premium (Barlow
     Condensed 800 at 9px rendered chunky/cheap — owner feedback Jul 2026). */
  .sh-s5{font-family:'Inter','Mukta',sans-serif;font-weight:700;font-size:8px;color:#E8B23D;letter-spacing:.46em;padding-left:.46em;line-height:1;white-space:nowrap;text-transform:uppercase;text-shadow:0 1px 6px rgba(0,0,0,.55);padding-bottom:3px;background:linear-gradient(90deg,transparent 8%,rgba(232,178,61,.55) 50%,transparent 92%) bottom/100% 1px no-repeat;animation:s5in .9s ease .15s both;}
  @keyframes s5in{from{opacity:0;letter-spacing:.6em}to{opacity:.95;letter-spacing:.46em}}
  @media(prefers-reduced-motion:reduce){.sh-s5{animation:none;opacity:.95;}}

  .sh-cta{display:inline-flex;align-items:center;justify-content:center;gap:8px;background:linear-gradient(135deg,#FF7A29,#D95E10);border:none;border-radius:var(--r,14px);color:#fff;font-family:'Barlow Condensed','Mukta',sans-serif;font-weight:800;letter-spacing:.07em;cursor:pointer;text-transform:uppercase;text-decoration:none;white-space:nowrap;transition:opacity .2s,transform .15s;box-shadow:0 4px 18px rgba(255,122,41,.3);}
  .sh-cta:hover{opacity:.92;transform:translateY(-1px);}

  .sh-ghost{display:inline-flex;align-items:center;justify-content:center;gap:6px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.18);border-radius:var(--r,14px);color:#fff;font-family:'Barlow Condensed','Mukta',sans-serif;font-weight:800;letter-spacing:.07em;cursor:pointer;text-transform:uppercase;text-decoration:none;white-space:nowrap;transition:border-color .2s,background .2s;}
  .sh-ghost:hover{border-color:rgba(255,255,255,.4);background:rgba(255,255,255,.09);}
  /* When a contextual CTA is present, MY BCPL only fits from 1280px up
     (the avatar still links to the profile below that width). */
  .sh-mybcpl{display:none;}
  @media(min-width:1280px){.sh-mybcpl{display:inline-flex;}}

  .sh-lang{display:inline-flex;align-items:center;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.12);border-radius:9px;padding:2px;gap:2px;flex-shrink:0;}
  .sh-lang button{border:none;background:transparent;color:rgba(255,255,255,.5);font-family:'Inter','Mukta',sans-serif;font-weight:700;font-size:11px;letter-spacing:.04em;padding:6px 10px;border-radius:7px;cursor:pointer;transition:background .2s,color .2s;line-height:1;}
  .sh-lang button.on{background:rgba(255,122,41,.16);color:#FF7A29;}

  .sh-mob{position:fixed;inset:0;background:rgba(4,10,20,.97);backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);z-index:1500;display:flex;flex-direction:column;padding:16px 28px calc(28px + env(safe-area-inset-bottom,0px));overflow-y:auto;animation:shMobIn .22s ease;}
  @keyframes shMobIn{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}
  .sh-moblink{padding:13px 0;border-bottom:1px solid rgba(255,255,255,.06);font-family:'Barlow Condensed','Mukta',sans-serif;font-weight:800;font-size:24px;letter-spacing:.05em;color:rgba(255,255,255,.85);text-transform:uppercase;cursor:pointer;text-decoration:none;display:block;}
  .sh-moblink:active,.sh-moblink:hover{color:#FF7A29;}
  .sh-mobsupport{display:flex;gap:12px;margin-top:18px;}
  .sh-mobsupport a{flex:1;display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:12px;border:1px solid rgba(255,255,255,.14);border-radius:12px;color:rgba(255,255,255,.75);font-family:'Inter','Mukta',sans-serif;font-weight:600;font-size:14px;text-decoration:none;background:rgba(255,255,255,.03);}

  .sh-ham{display:flex;flex-direction:column;justify-content:center;align-items:center;gap:5px;background:none;border:none;cursor:pointer;width:44px;height:44px;padding:10px;flex-shrink:0;}
  .sh-ham span{width:22px;height:2px;background:#fff;display:block;border-radius:2px;}

  /* Logged-in players never see register nudges — hides the per-page floating CTA too. */
  html.bcpl-authed .float-reg-btn{display:none!important;}
`;

function LangToggle({ big }: { big?: boolean }) {
  const { lang, setLang } = useLang();
  return (
    <div className="sh-lang" style={big ? { alignSelf: "flex-start", transform: "scale(1.2)", transformOrigin: "left center", margin: "4px 0 2px" } : undefined}>
      <button className={lang === "en" ? "on" : ""} onClick={() => setLang("en")} aria-label="English">EN</button>
      <button className={lang === "hi" ? "on" : ""} onClick={() => setLang("hi")} aria-label="Hindi">हिंदी</button>
    </div>
  );
}

function Logo() {
  return (
    <Link href="/" style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", gap: 3, flexShrink: 0, textDecoration: "none" }}>
      <img
        src={import.meta.env.BASE_URL + "bcpl-assets/bcpl-logo-white.png"}
        alt="BCPL"
        style={{ height: 34, width: "auto", objectFit: "contain", display: "block", filter: "brightness(1.3) drop-shadow(0 2px 8px rgba(0,0,0,.7))" }}
      />
      <span className="sh-s5">SEASON 5</span>
    </Link>
  );
}

export function SiteHeader({ active }: { active?: string }) {
  const [, navigate] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { t } = useLang();
  const user = useAuthUser();
  const activeKey = ACTIVE_MAP[active ?? ""] ?? active ?? "";

  /* Status-aware CTA (spec #17) — server-computed getPlayerNextAction(). */
  const [nextCta, setNextCta] = useState<{ en: string; hi: string; href: string } | null>(null);
  useEffect(() => {
    if (!user) { setNextCta(null); return; }
    let on = true;
    getNextAction()
      .then(r => { if (on) setNextCta(NEXT_CTA[r.action] ?? null); })
      .catch(() => { if (on) setNextCta(null); });
    return () => { on = false; };
  }, [user?.id]);

  /* Flag logged-in state on <html> so page-level register CTAs (.float-reg-btn) hide too */
  useEffect(() => {
    document.documentElement.classList.toggle("bcpl-authed", !!user);
  }, [user]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* lock page scroll while the mobile menu is open */
  useEffect(() => {
    if (!menuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [menuOpen]);

  const go = (href: string) => { setMenuOpen(false); navigate(href); };

  return (
    <>
      <style>{CSS}</style>

      <nav style={{
        position: "sticky", top: 0, zIndex: 200,
        background: scrolled ? "rgba(4,11,22,.88)" : "transparent",
        backdropFilter: scrolled ? "blur(18px) saturate(1.5)" : "none",
        WebkitBackdropFilter: scrolled ? "blur(18px) saturate(1.5)" : "none",
        borderBottom: scrolled ? "1px solid rgba(255,255,255,.08)" : "1px solid transparent",
        boxShadow: scrolled ? "0 8px 32px rgba(0,0,0,.35)" : "none",
        transition: "background .3s, border-color .3s, box-shadow .3s",
      }}>
        <div className="sh-W">

          {/* ── DESKTOP: logo | centered links | lang · login · CTA ── */}
          <div className="sh-deskbar">
            <div style={{ flex: "0 0 auto", display: "flex", justifyContent: "flex-start" }}>
              <Logo />
            </div>
            <div className="sh-desk">
              {LINKS.map(l => (
                <Link key={l.key} href={l.href} className={"sh-link" + (activeKey === l.key ? " sh-link-active" : "")}>
                  {t(l.en, l.hi)}
                </Link>
              ))}
            </div>
            <div style={{ flex: "0 0 auto", display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 14 }}>
              <LangToggle />
              <NavUser variant="desktop" />
              {user ? (
                <>
                  <button className={"sh-ghost" + (nextCta ? " sh-mybcpl" : "")} style={{ fontSize: 14.5, padding: "9px 16px" }} onClick={() => navigate("/profile")}>
                    MY BCPL
                  </button>
                  {nextCta && (
                    <button className="sh-cta" style={{ fontSize: 15, padding: "10px 18px" }} onClick={() => navigate(nextCta.href)}>
                      {t(nextCta.en, nextCta.hi)} →
                    </button>
                  )}
                </>
              ) : (
                <button className="sh-cta" style={{ fontSize: 15, padding: "10px 20px" }} onClick={() => navigate("/register")}>
                  {t("Register Now", "रजिस्टर करें")} →
                </button>
              )}
            </div>
          </div>

          {/* ── MOBILE: logo | profile · register · ☰ ── */}
          <div className="sh-mobbar">
            <Logo />
            <div className="sh-mobright">
              <NavUser variant="icon" />
              {user ? (
                <button
                  className="sh-cta"
                  style={{ fontSize: 12.5, padding: "9px 12px", minHeight: 40, maxWidth: "44vw", overflow: "hidden", textOverflow: "ellipsis" }}
                  onClick={() => navigate(nextCta ? nextCta.href : "/profile")}
                  aria-label={nextCta ? t(nextCta.en, nextCta.hi) : "MY BCPL"}
                >
                  {nextCta ? t(nextCta.en, nextCta.hi) : "MY BCPL"}
                </button>
              ) : (
                <button
                  className="sh-cta"
                  style={{ fontSize: 12.5, padding: "9px 12px", minHeight: 40 }}
                  onClick={() => navigate("/register")}
                  aria-label={t("Register", "रजिस्टर")}
                >
                  {t("Register", "रजिस्टर")}
                </button>
              )}
              <button className="sh-ham" onClick={() => setMenuOpen(true)} aria-label="Open menu">
                <span /><span /><span />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* ── MOBILE MENU (full-height premium sheet) ── */}
      {menuOpen && (
        <div className="sh-mob">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <Logo />
            <button onClick={() => setMenuOpen(false)} aria-label="Close menu" style={{ background: "none", border: "none", color: "#fff", fontSize: 30, cursor: "pointer", lineHeight: 1, width: 44, height: 44 }}>✕</button>
          </div>

          {MOB_LINKS.map(l => (
            <Link key={l.key} href={l.href} className="sh-moblink" onClick={() => setMenuOpen(false)} style={{ color: activeKey === l.key ? "#FF7A29" : undefined }}>
              {t(l.en, l.hi)}
            </Link>
          ))}

          <div style={{ padding: "14px 0", borderBottom: "1px solid rgba(255,255,255,.06)" }}>
            <NavUser variant="mobile" onNavigate={() => setMenuOpen(false)} />
          </div>

          {user ? (
            <>
              {nextCta && (
                <button className="sh-cta" style={{ marginTop: 22, width: "100%", fontSize: 18, padding: 15, minHeight: 52 }} onClick={() => go(nextCta.href)}>
                  {t(nextCta.en, nextCta.hi)} →
                </button>
              )}
              <button className="sh-ghost" style={{ marginTop: nextCta ? 10 : 22, width: "100%", fontSize: 17, padding: 14, minHeight: 50 }} onClick={() => go("/profile")}>
                MY BCPL
              </button>
            </>
          ) : (
            <button className="sh-cta" style={{ marginTop: 22, width: "100%", fontSize: 18, padding: 15, minHeight: 52 }} onClick={() => go("/register")}>
              {t("Register for Phase 1", "Phase 1 के लिए रजिस्टर करें")} →
            </button>
          )}

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 22 }}>
            <LangToggle big />
          </div>

          <div className="sh-mobsupport">
            <Link href="/faq" onClick={() => setMenuOpen(false)}>{t("Help & FAQ", "मदद और FAQ")}</Link>
            <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">WhatsApp</a>
          </div>
        </div>
      )}
    </>
  );
}

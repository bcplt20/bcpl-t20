import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { NavUser } from "./NavUser";
import { useLang } from "../lib/i18n";

/**
 * SiteHeader V3 — the one shared glass header on every page.
 *
 * Desktop:  LOGO · SEASON 5 | Teams Matches Media About | EN|हिंदी · Login · REGISTER NOW
 * Mobile:   ☰ | LOGO (centered) | REGISTER          — exactly three things.
 *
 * Glass behaviour: translucent blur at the top of the page, deepens with a
 * hairline border once scrolled. Height stays 60px (pages offset stickies
 * against it). The old gold news ticker is gone — V3 keeps the chrome calm;
 * the league ticker strip lives on the homepage below the hero instead.
 *
 * Self-contained (sh- CSS) so it renders identically on all 33 pages.
 * Usage: <SiteHeader active="Teams" />  (legacy active names still work)
 */

type NavItem = { key: string; en: string; hi: string; href: string };

const LINKS: NavItem[] = [
  { key: "Teams",   en: "Teams",   hi: "टीमें",   href: "/teams" },
  { key: "Matches", en: "Matches", hi: "मैच",     href: "/match-center" },
  { key: "Media",   en: "Media",   hi: "मीडिया",  href: "/photos" },
  { key: "About",   en: "About",   hi: "परिचय",   href: "/about" },
];

/* Mobile menu lists the fuller map — the top bar stays minimal. */
const MOB_LINKS: NavItem[] = [
  { key: "Home",    en: "Home",    hi: "होम",     href: "/" },
  { key: "Teams",   en: "Teams",   hi: "टीमें",   href: "/teams" },
  { key: "Matches", en: "Matches", hi: "मैच",     href: "/match-center" },
  { key: "Photos",  en: "Photos",  hi: "फ़ोटो",   href: "/photos" },
  { key: "Videos",  en: "Videos",  hi: "वीडियो",  href: "/videos" },
  { key: "About",   en: "About",   hi: "परिचय",   href: "/about" },
  { key: "Contact", en: "Contact", hi: "संपर्क",  href: "/contact" },
];

/* 32 pages pass legacy `active` names — map them onto V3 nav keys. */
const ACTIVE_MAP: Record<string, string> = {
  "Home": "Home", "Teams": "Teams", "Match Center": "Matches",
  "Photos": "Media", "Videos": "Media", "About": "About", "Contact": "Contact",
};

const CSS = `
  .sh-W{max-width:var(--container,1200px);margin:0 auto;padding:0 16px;}
  @media(min-width:768px){.sh-W{padding:0 32px;}}
  @media(min-width:1280px){.sh-W{padding:0 48px;}}

  .sh-link{font-family:'Barlow Condensed','Mukta',sans-serif;font-weight:700;font-size:15.5px;letter-spacing:.09em;color:rgba(255,255,255,.62);text-decoration:none;text-transform:uppercase;transition:color .2s;white-space:nowrap;padding:6px 2px;}
  .sh-link:hover{color:#fff;}
  .sh-link-active{color:#FF7A29;}
  .sh-link-active:hover{color:#FF7A29;}

  .sh-desk{display:none;}
  .sh-deskbar{display:none;}
  .sh-mobbar{display:grid;grid-template-columns:44px 1fr 44px;align-items:center;height:60px;}
  @media(min-width:1024px){
    .sh-deskbar{display:flex;align-items:center;height:60px;gap:28px;}
    .sh-desk{display:flex;gap:26px;align-items:center;}
    .sh-mobbar{display:none;}
  }

  .sh-cta{display:inline-flex;align-items:center;justify-content:center;gap:8px;background:linear-gradient(135deg,#FF7A29,#D95E10);border:none;border-radius:var(--r,14px);color:#fff;font-family:'Barlow Condensed','Mukta',sans-serif;font-weight:800;letter-spacing:.07em;cursor:pointer;text-transform:uppercase;text-decoration:none;transition:opacity .2s,transform .15s;box-shadow:0 4px 18px rgba(255,122,41,.3);}
  .sh-cta:hover{opacity:.92;transform:translateY(-1px);}

  .sh-lang{display:inline-flex;align-items:center;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.12);border-radius:9px;padding:2px;gap:2px;flex-shrink:0;}
  .sh-lang button{border:none;background:transparent;color:rgba(255,255,255,.5);font-family:'Inter','Mukta',sans-serif;font-weight:700;font-size:11px;letter-spacing:.04em;padding:6px 10px;border-radius:7px;cursor:pointer;transition:background .2s,color .2s;line-height:1;}
  .sh-lang button.on{background:rgba(255,122,41,.16);color:#FF7A29;}

  .sh-mob{position:fixed;inset:0;background:rgba(4,10,20,.97);backdrop-filter:blur(24px);z-index:1500;display:flex;flex-direction:column;padding:20px 28px 32px;overflow-y:auto;animation:shMobIn .22s ease;}
  @keyframes shMobIn{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}
  .sh-moblink{padding:15px 0;border-bottom:1px solid rgba(255,255,255,.06);font-family:'Barlow Condensed','Mukta',sans-serif;font-weight:800;font-size:27px;letter-spacing:.05em;color:rgba(255,255,255,.85);text-transform:uppercase;cursor:pointer;text-decoration:none;display:block;}
  .sh-moblink:active,.sh-moblink:hover{color:#FF7A29;}

  .sh-ham{display:flex;flex-direction:column;justify-content:center;gap:5px;background:none;border:none;cursor:pointer;width:44px;height:44px;padding:10px;}
  .sh-ham span{width:22px;height:2px;background:#fff;display:block;border-radius:2px;}
`;

function LangToggle({ big }: { big?: boolean }) {
  const { lang, setLang } = useLang();
  return (
    <div className="sh-lang" style={big ? { alignSelf: "flex-start", transform: "scale(1.2)", transformOrigin: "left center", margin: "6px 0 14px" } : undefined}>
      <button className={lang === "en" ? "on" : ""} onClick={() => setLang("en")} aria-label="English">EN</button>
      <button className={lang === "hi" ? "on" : ""} onClick={() => setLang("hi")} aria-label="Hindi">हिंदी</button>
    </div>
  );
}

function Logo({ center }: { center?: boolean }) {
  return (
    <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0, textDecoration: "none", justifyContent: center ? "center" : "flex-start" }}>
      <img
        src={import.meta.env.BASE_URL + "bcpl-assets/bcpl-logo-white.png"}
        alt="BCPL"
        style={{ height: 40, width: "auto", objectFit: "contain", display: "block", filter: "brightness(1.3) drop-shadow(0 2px 8px rgba(0,0,0,.7))" }}
      />
      <span style={{ display: "inline-flex", alignItems: "center", background: "rgba(232,178,61,.1)", border: "1px solid rgba(232,178,61,.45)", borderRadius: 6, padding: "3px 9px", fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 800, fontSize: 11, color: "#E8B23D", letterSpacing: ".14em", whiteSpace: "nowrap" }}>
        SEASON 5
      </span>
    </Link>
  );
}

export function SiteHeader({ active }: { active?: string }) {
  const [, navigate] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { t } = useLang();
  const activeKey = ACTIVE_MAP[active ?? ""] ?? active ?? "";

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
        background: scrolled ? "rgba(4,11,22,.9)" : "rgba(4,11,22,.55)",
        backdropFilter: "blur(18px) saturate(1.5)",
        WebkitBackdropFilter: "blur(18px) saturate(1.5)",
        borderBottom: scrolled ? "1px solid rgba(255,255,255,.08)" : "1px solid transparent",
        boxShadow: scrolled ? "0 8px 32px rgba(0,0,0,.35)" : "none",
        transition: "background .3s, border-color .3s, box-shadow .3s",
      }}>
        <div className="sh-W">

          {/* ── DESKTOP ── */}
          <div className="sh-deskbar">
            <Logo />
            <div className="sh-desk" style={{ marginLeft: 8 }}>
              {LINKS.map(l => (
                <Link key={l.key} href={l.href} className={"sh-link" + (activeKey === l.key ? " sh-link-active" : "")}>
                  {t(l.en, l.hi)}
                </Link>
              ))}
            </div>
            <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 14, flexShrink: 0 }}>
              <LangToggle />
              <NavUser variant="desktop" />
              <button className="sh-cta" style={{ fontSize: 15, padding: "10px 20px" }} onClick={() => navigate("/register")}>
                {t("Register Now", "रजिस्टर करें")} →
              </button>
            </div>
          </div>

          {/* ── MOBILE: ☰ | logo | register ── */}
          <div className="sh-mobbar">
            <button className="sh-ham" onClick={() => setMenuOpen(true)} aria-label="Open menu">
              <span /><span /><span />
            </button>
            <Logo center />
            <button
              className="sh-cta"
              style={{ fontSize: 13, padding: "9px 12px", justifySelf: "end", width: "auto", minHeight: 40 }}
              onClick={() => navigate("/register")}
              aria-label={t("Register", "रजिस्टर")}
            >
              {t("Register", "रजिस्टर")}
            </button>
          </div>
        </div>
      </nav>

      {/* ── MOBILE MENU ── */}
      {menuOpen && (
        <div className="sh-mob">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
            <Logo />
            <button onClick={() => setMenuOpen(false)} aria-label="Close menu" style={{ background: "none", border: "none", color: "#fff", fontSize: 30, cursor: "pointer", lineHeight: 1, width: 44, height: 44 }}>✕</button>
          </div>
          <LangToggle big />
          {MOB_LINKS.map(l => (
            <Link key={l.key} href={l.href} className="sh-moblink" onClick={() => setMenuOpen(false)} style={{ color: activeKey === l.key ? "#FF7A29" : undefined }}>
              {t(l.en, l.hi)}
            </Link>
          ))}
          <div style={{ padding: "16px 0", borderBottom: "1px solid rgba(255,255,255,.06)" }}>
            <NavUser variant="mobile" onNavigate={() => setMenuOpen(false)} />
          </div>
          <button className="sh-cta" style={{ marginTop: 26, width: "100%", fontSize: 19, padding: 15, minHeight: 52 }} onClick={() => go("/register")}>
            {t("Register Now — ₹299", "रजिस्टर करें — ₹299")} →
          </button>
        </div>
      )}
    </>
  );
}

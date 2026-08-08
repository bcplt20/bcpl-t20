import { useEffect, useState } from "react";
import { SiteHeader } from "../components/SiteHeader";
import { BCPLFooter } from "../components/BCPLFooter";
import { getSiteSetting } from "../lib/api";
import { useLang } from "../lib/i18n";
import { SEASON } from "../lib/season";

const BASE = import.meta.env.BASE_URL;
const GOLD = "#E8B23D";
const ORANGE = "#FF7A29";
const PAGE = "#1B2E52";
const PANEL = "#24396B";
const LINE = "rgba(255,255,255,.16)";
const TXT2 = "rgba(255,255,255,.80)";

type AppLinks = { playStore?: string; appStore?: string; apk?: string };

const CSS = `
.dl-wrap { max-width:1080px; margin:0 auto; padding:0 20px; }
@media(min-width:768px){ .dl-wrap{padding:0 32px} }
.dl-hero { display:grid; grid-template-columns:1fr; gap:36px; align-items:center; }
@media(min-width:900px){ .dl-hero{grid-template-columns:1.1fr 0.9fr;} }
.dl-h1 { font-family:'Barlow Condensed','Montserrat',sans-serif; font-weight:800; text-transform:uppercase; line-height:.98; letter-spacing:.015em; color:#fff; font-size:clamp(38px,6.6vw,72px); margin:12px 0 0; }
.dl-lead { max-width:520px; margin:18px 0 0; font-size:15.5px; line-height:1.75; color:rgba(255,255,255,0.82); font-family:Inter,sans-serif; }
.dl-kicker { font-family:Inter,sans-serif; font-weight:700; font-size:12px; letter-spacing:.22em; color:${GOLD}; text-transform:uppercase; }
.dl-btns { display:flex; flex-direction:column; gap:12px; margin-top:26px; max-width:360px; }
.dl-btn { display:flex; align-items:center; gap:14px; border-radius:14px; padding:13px 20px; text-decoration:none; border:1px solid ${LINE}; background:linear-gradient(135deg,#0C1020,#14203C); color:#fff; box-shadow:0 10px 28px rgba(0,0,0,0.3); transition:transform .15s, border-color .18s; }
.dl-btn:hover { transform:translateY(-2px); border-color:${ORANGE}; }
.dl-btn.disabled { opacity:.55; pointer-events:none; box-shadow:none; }
.dl-btn .ic { flex:0 0 auto; width:30px; height:30px; display:flex; align-items:center; justify-content:center; }
.dl-btn .tx { display:flex; flex-direction:column; line-height:1.15; }
.dl-btn .tx small { font-family:Inter,sans-serif; font-size:10.5px; letter-spacing:.06em; color:rgba(255,255,255,0.7); text-transform:uppercase; }
.dl-btn .tx b { font-family:'Montserrat',Inter,sans-serif; font-weight:800; font-size:16px; }
.dl-btn .soon { margin-left:auto; font-family:Inter,sans-serif; font-size:10px; font-weight:800; letter-spacing:.08em; text-transform:uppercase; color:${GOLD}; border:1px solid rgba(232,178,61,0.45); border-radius:100px; padding:3px 9px; }
/* phone mockup */
.dl-phone-wrap { display:flex; justify-content:center; }
.dl-phone { position:relative; width:min(280px,74vw); aspect-ratio:9/19; border-radius:38px; background:linear-gradient(160deg,#0A1327,#182a4d); border:2px solid rgba(255,255,255,0.14); box-shadow:0 30px 70px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.12); padding:12px; }
.dl-phone::before { content:''; position:absolute; top:14px; left:50%; transform:translateX(-50%); width:120px; height:20px; border-radius:0 0 14px 14px; background:#060B18; z-index:3; }
.dl-screen { width:100%; height:100%; border-radius:28px; overflow:hidden; position:relative; background:radial-gradient(120% 80% at 50% 0%,rgba(255,122,41,0.28),transparent 60%),linear-gradient(180deg,#12233F,#1B2E52 55%,#24396B); display:flex; flex-direction:column; align-items:center; justify-content:center; gap:14px; padding:24px 18px; }
.dl-screen img { width:82px; height:82px; object-fit:contain; filter:drop-shadow(0 8px 18px rgba(0,0,0,0.4)); }
.dl-screen .stitle { font-family:'Barlow Condensed','Montserrat',sans-serif; font-weight:800; font-size:26px; color:#fff; letter-spacing:.03em; text-transform:uppercase; }
.dl-screen .ssub { font-family:Inter,sans-serif; font-size:11px; letter-spacing:.18em; color:${GOLD}; text-transform:uppercase; }
.dl-screen .schips { display:flex; flex-wrap:wrap; gap:7px; justify-content:center; margin-top:6px; }
.dl-screen .schip { font-family:Inter,sans-serif; font-size:10px; font-weight:700; color:#fff; background:rgba(255,255,255,0.10); border:1px solid rgba(255,255,255,0.16); border-radius:100px; padding:5px 10px; }
/* features */
.dl-feat { display:grid; grid-template-columns:1fr; gap:16px; }
@media(min-width:620px){ .dl-feat{grid-template-columns:1fr 1fr;} }
@media(min-width:900px){ .dl-feat{grid-template-columns:repeat(4,1fr);} }
.dl-fcard { background:linear-gradient(135deg,rgba(36,57,107,0.92),rgba(27,46,82,0.88)); border:1px solid ${LINE}; border-radius:16px; padding:22px 18px; box-shadow:0 12px 34px rgba(0,0,0,0.28); }
.dl-fcard .fi { font-size:24px; margin-bottom:10px; }
.dl-fcard h4 { font-family:'Montserrat',Inter,sans-serif; font-weight:800; font-size:15.5px; color:#fff; margin:0 0 6px; }
.dl-fcard p { font-family:Inter,sans-serif; font-size:13.5px; line-height:1.6; color:${TXT2}; margin:0; }
.dl-sec-kick { font-family:Inter,sans-serif; font-weight:700; font-size:12px; letter-spacing:.2em; color:${GOLD}; text-transform:uppercase; }
.dl-sec-h { font-family:'Barlow Condensed','Montserrat',sans-serif; font-weight:800; font-size:clamp(24px,3.6vw,34px); color:#fff; text-transform:uppercase; letter-spacing:.03em; margin:8px 0 20px; }
`;

function GooglePlayIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3.6 2.3c-.25.26-.4.66-.4 1.18v17.04c0 .52.15.92.4 1.18l.06.05L13 12.6v-.2L3.66 2.25l-.06.05Z" fill="#00D0FF"/>
      <path d="M16.4 15.7 13 12.3v-.2l3.4-3.4.08.05 4.03 2.29c1.15.65 1.15 1.72 0 2.38l-4.03 2.29-.08.04Z" fill="#FFD400"/>
      <path d="m16.48 15.65-3.48-3.4L3.6 21.7c.38.4 1 .45 1.72.05l11.16-6.1Z" fill="#FF3D44"/>
      <path d="M16.48 8.75 5.32 2.66C4.6 2.25 3.98 2.3 3.6 2.7l9.4 9.4 3.48-3.35Z" fill="#00E676"/>
    </svg>
  );
}
function AppleIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="#fff" aria-hidden="true">
      <path d="M16.36 12.9c-.02-2.3 1.88-3.4 1.96-3.46-1.07-1.56-2.73-1.78-3.32-1.8-1.41-.14-2.76.83-3.48.83-.72 0-1.82-.81-2.99-.79-1.54.02-2.96.9-3.75 2.28-1.6 2.78-.41 6.9 1.15 9.16.76 1.1 1.66 2.34 2.85 2.29 1.14-.05 1.57-.74 2.95-.74 1.38 0 1.77.74 2.98.72 1.23-.02 2.01-1.12 2.76-2.23.87-1.28 1.23-2.52 1.25-2.58-.03-.01-2.4-.92-2.42-3.65ZM14.1 6.06c.63-.77 1.06-1.83.94-2.9-.91.04-2.01.61-2.67 1.37-.59.68-1.1 1.76-.96 2.8 1.01.08 2.05-.51 2.69-1.27Z"/>
    </svg>
  );
}

export function Download() {
  const { t } = useLang();
  const [links, setLinks] = useState<AppLinks | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    getSiteSetting<AppLinks>("app_download_links")
      .then((r) => setLinks(r.value ?? {}))
      .catch(() => setLinks({}))
      .finally(() => setLoaded(true));
  }, []);

  const playStore = links?.playStore?.trim() || "";
  const appStore = links?.appStore?.trim() || "";
  const apk = links?.apk?.trim() || "";

  const btn = (
    href: string,
    icon: React.ReactNode,
    smallEn: string, smallHi: string,
    bigEn: string, bigHi: string,
  ) => {
    const ready = !!href && loaded;
    return (
      <a
        className={"dl-btn" + (ready ? "" : " disabled")}
        href={ready ? href : undefined}
        {...(ready ? { target: "_blank", rel: "noopener noreferrer" } : { "aria-disabled": true })}
      >
        <span className="ic">{icon}</span>
        <span className="tx">
          <small>{t(smallEn, smallHi)}</small>
          <b>{t(bigEn, bigHi)}</b>
        </span>
        {!ready && <span className="soon">{t("Coming soon", "जल्द आ रहा है")}</span>}
      </a>
    );
  };

  const FEATURES: Array<[string, string, string, string, string]> = [
    ["\uD83C\uDFCF", "Your player journey", "आपकी player journey", "Track registration, trials and results in one place.", "Registration, trials और results एक ही जगह देखें।"],
    ["\uD83D\uDCCA", "Live scores & MVP", "Live scores और MVP", "Follow match centre, points table and the MVP leaderboard.", "Match centre, points table और MVP leaderboard follow करें।"],
    ["\uD83C\uDFAB", "Digital trial pass", "Digital trial pass", "Your venue, slot and pass — always in your pocket.", "आपका venue, slot और pass — हमेशा आपकी जेब में।"],
    ["\uD83D\uDD14", "Instant updates", "तुरंत updates", "Get notified about trials, auction and your team.", "Trials, auction और अपनी team की जानकारी तुरंत पाएँ।"],
  ];

  return (
    <div style={{ minHeight: "100vh", background: PAGE, color: "#fff" }}>
      <style>{CSS}</style>
      <SiteHeader active="Download" />

      {/* Hero */}
      <section
        style={{
          padding: "calc(var(--sh-h, 68px) + clamp(40px,6vw,72px)) 0 clamp(48px,6vw,80px)",
          position: "relative",
          background: `radial-gradient(ellipse 70% 55% at 20% 0%, rgba(255,122,41,0.12), transparent 65%)`,
        }}
      >
        <div className="dl-wrap dl-hero">
          <div>
            <div className="dl-kicker">{t("BCPL · SEASON " + SEASON.number, "BCPL · सीज़न " + SEASON.number)}</div>
            <h1 className="dl-h1">
              {t("EVERYTHING BCPL,", "पूरा BCPL,")}<br />
              <span style={{ color: ORANGE }}>{t("IN YOUR POCKET.", "आपकी जेब में।")}</span>
            </h1>
            <p className="dl-lead">
              {t("Download the BCPL app to register, follow live scores, carry your digital trial pass and get updates — all in one place.",
                 "BCPL app डाउनलोड करें — register करें, live scores follow करें, अपना digital trial pass रखें और updates पाएँ — सब एक जगह।")}
            </p>
            <div className="dl-btns">
              {btn(playStore, <GooglePlayIcon />, "Get it on", "इस पर पाएँ", "Google Play", "Google Play")}
              {btn(appStore, <AppleIcon />, "Download on the", "इस पर पाएँ", "App Store", "App Store")}
              {btn(apk, (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 4v11" /><path d="m7 11 5 5 5-5" /><path d="M5 20h14" /></svg>
              ), "Android", "Android", "Direct APK download", "सीधे APK डाउनलोड")}
            </div>
          </div>

          {/* CSS phone mockup */}
          <div className="dl-phone-wrap">
            <div className="dl-phone">
              <div className="dl-screen">
                <img src={BASE + "bcpl-assets/bcpl-logo-white.png"} alt="BCPL" loading="lazy" />
                <div className="ssub">{t("SEASON " + SEASON.number, "सीज़न " + SEASON.number)}</div>
                <div className="stitle">BCPL T20</div>
                <div className="schips">
                  <span className="schip">{t("Live Scores", "Live Scores")}</span>
                  <span className="schip">{t("Trial Pass", "Trial Pass")}</span>
                  <span className="schip">{t("MVP", "MVP")}</span>
                  <span className="schip">{t("My Card", "My Card")}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: "0 0 clamp(60px,8vw,100px)" }}>
        <div className="dl-wrap">
          <div className="dl-sec-kick">{t("Why the app", "App क्यों")}</div>
          <h2 className="dl-sec-h">{t("EVERYTHING IN ONE APP", "सब कुछ एक app में")}</h2>
          <div className="dl-feat">
            {FEATURES.map(([ic, en, hi, pEn, pHi]) => (
              <div key={en} className="dl-fcard">
                <div className="fi">{ic}</div>
                <h4>{t(en, hi)}</h4>
                <p>{t(pEn, pHi)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <BCPLFooter />
    </div>
  );
}

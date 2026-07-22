import { useState } from "react";
import AdminSettingsView, { loadCoAdmins, ALL_SECTIONS } from "./views/AdminSettingsView";
import type { CoAdmin } from "./views/AdminSettingsView";
import DashboardView        from "./views/DashboardView";
import UsersView            from "./views/UsersView";
import FinanceView          from "./views/FinanceView";
import MarketingView        from "./views/MarketingView";
import SEOView              from "./views/SEOView";
import MatchesView          from "./views/MatchesView";
import TeamsView            from "./views/TeamsView";
import SelectionView        from "./views/SelectionView";
import MediaView            from "./views/MediaView";
import SponsorsView         from "./views/SponsorsView";
import BannersView          from "./views/BannersView";
import CMSView              from "./views/CMSView";
import RolesView            from "./views/RolesView";
import LiveScoringView      from "./views/LiveScoringView";
// 15 New Views
import PlayerProfilesView   from "./views/PlayerProfilesView";
import TrialCitiesView      from "./views/TrialCitiesView";
import AuctionView          from "./views/AuctionView";
import ContractsView        from "./views/ContractsView";
import SupportView          from "./views/SupportView";
import ContentCalendarView  from "./views/ContentCalendarView";
import PushNotificationsView from "./views/PushNotificationsView";
import LeaderboardView      from "./views/LeaderboardView";
import WhatsAppTemplatesView from "./views/WhatsAppTemplatesView";
import DataExportView       from "./views/DataExportView";
import AffiliatesView       from "./views/AffiliatesView";
import VideoReviewView         from "./views/VideoReviewView";
import Phase1RegistrationsView from "./views/Phase1RegistrationsView";
import Phase2KYCView           from "./views/Phase2KYCView";
import FraudView            from "./views/FraudView";
import ForecastView         from "./views/ForecastView";
import SponsorROIView       from "./views/SponsorROIView";
import { adminLogin, saveAdminToken, clearAdminToken, hasLegacyAdminKey } from "../lib/api";

type NavItem  = { id: string; label: string; icon: string; badge?: string; badgeColor?: string };
type NavGroup = { title: string; items: NavItem[] };

const NAV: NavGroup[] = [
  { title: "OVERVIEW", items: [
    { id:"dashboard",    label:"Analytics",        icon:"▣", badge:"Live", badgeColor:"#10B981" },
    { id:"users",        label:"Users",             icon:"⊞" },
    { id:"finance",      label:"Finance & GST",     icon:"◈" },
    { id:"forecast",     label:"Forecasting",       icon:"↗", badge:"New", badgeColor:"#6366F1" },
  ]},
  { title: "GROWTH", items: [
    { id:"marketing",    label:"Marketing",         icon:"◎", badge:"New", badgeColor:"#FF6B00" },
    { id:"seo",          label:"SEO Manager",       icon:"⌖" },
    { id:"affiliates",   label:"Agents & Affiliates",icon:"⊟" },
    { id:"push",         label:"Push Notifications",icon:"●" },
    { id:"content_cal",  label:"Content Calendar",  icon:"▤" },
  ]},
  { title: "LEAGUE", items: [
    { id:"matches",      label:"Matches",           icon:"◐" },
    { id:"live_scoring", label:"Live Scoring",      icon:"●" },
    { id:"teams",        label:"Teams",             icon:"▨" },
    { id:"selection",    label:"Selection",         icon:"✓", badge:"Phase 1", badgeColor:"#F59E0B" },
    { id:"auction",      label:"Live Auction",      icon:"⊕", badge:"New", badgeColor:"#FF6B00" },
    { id:"leaderboard",  label:"Leaderboard",       icon:"≡" },
    { id:"contracts",    label:"Contracts",         icon:"◈" },
  ]},
  { title: "REGISTRATIONS", items: [
    { id:"phase1_regs",  label:"Phase 1 Registrations", icon:"①", badge:"Live", badgeColor:"#3B82F6" },
    { id:"video_review", label:"Video Review",           icon:"▣", badgeColor:"#F59E0B" },
    { id:"phase2_kyc",   label:"Phase 2 · KYC",         icon:"②", badgeColor:"#A855F7" },
  ]},
  { title: "PLAYERS", items: [
    { id:"player_profiles",label:"Player Profiles", icon:"⊞" },
    { id:"whatsapp_tpl", label:"WhatsApp Templates",icon:"◎" },
    { id:"fraud",        label:"Fraud Detection",   icon:"⌖" },
  ]},
  { title: "TRIALS", items: [
    { id:"trial_cities", label:"Trial Cities",      icon:"◐" },
    { id:"support",      label:"Support Tickets",   icon:"●" },
  ]},
  { title: "CONTENT", items: [
    { id:"media",        label:"Photos & Videos",   icon:"▨" },
    { id:"banners",      label:"Banners",           icon:"▤" },
    { id:"cms",          label:"CMS / Pages",       icon:"≡" },
  ]},
  { title: "SPONSORS", items: [
    { id:"sponsors",     label:"Sponsors",          icon:"⊟" },
    { id:"sponsor_roi",  label:"Sponsor ROI",       icon:"↗" },
  ]},
  { title: "TOOLS", items: [
    { id:"data_export",     label:"Data Export",        icon:"⊕" },
    { id:"roles",           label:"Roles & Access",     icon:"◈" },
  ]},
  { title: "SETTINGS", items: [
    { id:"admin_settings",  label:"Admin Management",   icon:"⚙" },
  ]},
];

function Icon({ ch }: { ch: string }) {
  return (
    <span style={{
      width:18, height:18,
      display:"inline-flex", alignItems:"center", justifyContent:"center",
      fontSize:14, lineHeight:1, flexShrink:0, color:"inherit",
    }}>{ch}</span>
  );
}

export type AdminNavPayload = { quick?: string; filter?: string; focusId?: string };

function renderView(id: string, navigate: (viewId: string, payload?: AdminNavPayload) => void, payload: AdminNavPayload | null) {
  const pk = JSON.stringify(payload ?? {});
  switch (id) {
    case "dashboard":      return <DashboardView onNavigate={navigate} />;
    case "users":          return <UsersView key={"u"+pk} onNavigate={navigate} initialQuick={payload?.quick} />;
    case "finance":        return <FinanceView key={"fin"+pk} onNavigate={navigate} />;
    case "forecast":       return <ForecastView />;
    case "marketing":      return <MarketingView />;
    case "seo":            return <SEOView />;
    case "affiliates":     return <AffiliatesView />;
    case "push":           return <PushNotificationsView />;
    case "content_cal":    return <ContentCalendarView />;
    case "matches":        return <MatchesView onOpenScoring={() => navigate("live_scoring")} />;
    case "live_scoring":   return <LiveScoringView />;
    case "teams":          return <TeamsView />;
    case "selection":      return <SelectionView />;
    case "auction":        return <AuctionView />;
    case "leaderboard":    return <LeaderboardView />;
    case "contracts":      return <ContractsView />;
    case "phase1_regs":    return <Phase1RegistrationsView key={"p1"+pk} onNavigate={navigate} focusId={payload?.focusId} initialFilter={payload?.filter} />;
    case "video_review":   return <VideoReviewView />;
    case "phase2_kyc":     return <Phase2KYCView />;
    case "player_profiles":return <PlayerProfilesView />;
    case "whatsapp_tpl":   return <WhatsAppTemplatesView />;
    case "fraud":          return <FraudView />;
    case "trial_cities":   return <TrialCitiesView />;
    case "support":        return <SupportView />;
    case "media":          return <MediaView />;
    case "banners":        return <BannersView />;
    case "cms":            return <CMSView />;
    case "sponsors":       return <SponsorsView />;
    case "sponsor_roi":    return <SponsorROIView />;
    case "data_export":    return <DataExportView />;
    case "roles":          return <RolesView />;
    case "admin_settings": return <AdminSettingsView />;
    default:               return <DashboardView onNavigate={navigate} />;
  }
}

const ALL_ITEMS = NAV.flatMap(g => g.items);

/* ── Super Admin (hardcoded, always available) ── */
const SUPER_ADMIN = {
  id:"SA-ROOT", name:"Saurabh Jha", email:"saurabhjha@bcplt20.com",
  role:"Super Admin", permissions:["all"] as string[],
};

export default function AdminShell() {
  const [active,        setActive]       = useState("dashboard");
  const [navPayload,    setNavPayload]   = useState<AdminNavPayload | null>(null);
  const [loggedIn,      setLoggedIn]     = useState(false);
  const [loggedInAdmin, setLoggedInAdmin]= useState<typeof SUPER_ADMIN & { password?:string } | null>(null);
  const [collapsed,     setCollapsed]    = useState(false);
  const [loginForm,     setLoginForm]    = useState({ email:"", password:"" });
  const [loginBusy,     setLoginBusy]    = useState(false);
  const [loginErr,      setLoginErr]     = useState("");
  const [notifOpen,     setNotifOpen]    = useState(false);
  const [searchOpen,    setSearchOpen]   = useState(false);
  const [searchQ,       setSearchQ]      = useState("");

  const NOTIFS: { icon:string; text:string; time:string; unread:boolean }[] = [];
  const unreadCount = NOTIFS.filter(n => n.unread).length;

  /* ── Cross-view navigation: switch tab + optional payload (focusId / filter / quick) ── */
  const navigate = (viewId: string, payload?: AdminNavPayload) => {
    setNavPayload(payload ?? null);
    setActive(viewId);
  };

  /* ── Super Admin password (only this needs changing in code) ── */
  const SUPER_ADMIN_PASSWORD = "BCPL@S5#2026!";

  /* ── Nav filtering by permission ── */
  const isSuperAdmin = loggedInAdmin?.permissions?.includes("all") ?? false;
  const visibleNAV = NAV.map(group => ({
    ...group,
    items: group.items.filter(item => {
      if (item.id === "admin_settings") return isSuperAdmin;
      if (isSuperAdmin) return true;
      return loggedInAdmin?.permissions?.includes(item.id);
    }),
  })).filter(g => g.items.length > 0);

  const VISIBLE_ITEMS = visibleNAV.flatMap(g => g.items);
  const SEARCH_ITEMS = VISIBLE_ITEMS.filter(i =>
    !searchQ || i.label.toLowerCase().includes(searchQ.toLowerCase())
  );
  const activeLabel = ALL_ITEMS.find(i => i.id === active)?.label || "Dashboard";

  /* ── Login ── */
  if (!loggedIn) {
    const handleLogin = async () => {
      if(loginBusy) return;
      if(!loginForm.email){ setLoginErr("Email address is required"); return; }
      if(!loginForm.password){ setLoginErr("Password is required"); return; }
      const emailL = loginForm.email.toLowerCase().trim();
      // Check Super Admin first
      if (emailL === SUPER_ADMIN.email && loginForm.password === SUPER_ADMIN_PASSWORD) {
        // Get the admin API token BEFORE showing the panel, so the first
        // view's API calls don't fire without it (they'd 403 and render empty).
        setLoginBusy(true);
        try {
          const r = await adminLogin(loginForm.password);
          saveAdminToken(r.token);
          setLoggedIn(true);
          setLoggedInAdmin(SUPER_ADMIN);
        } catch (e) {
          if (hasLegacyAdminKey()) {
            // Legacy header auth is configured in this build — panel still works without the JWT.
            setLoggedIn(true);
            setLoggedInAdmin(SUPER_ADMIN);
          } else {
            const msg = e instanceof Error ? e.message : "";
            setLoginErr(msg === "Invalid admin password"
              ? "The server rejected the admin password — server settings are out of date."
              : "Could not verify with the server. Check that the site is online, then try again.");
          }
        } finally {
          setLoginBusy(false);
        }
        return;
      }
      // Check co-admins from localStorage
      const coAdmins: CoAdmin[] = loadCoAdmins();
      const co = coAdmins.find(a => a.email.toLowerCase() === emailL && a.password === loginForm.password);
      if (co) {
        setLoggedIn(true);
        setLoggedInAdmin({ id:co.id, name:co.name, email:co.email, role:co.role, permissions:co.permissions });
        return;
      }
      setLoginErr("Incorrect email or password. Contact the Super Admin.");
    };
    return (
      <div style={{ minHeight:"100vh", background:"radial-gradient(ellipse at 20% 50%,#0D1526 0%,#060B18 60%)", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Inter',sans-serif" }}>
        <div style={{ position:"fixed", top:-100, left:-100, width:400, height:400, borderRadius:"50%", background:"#FF6B0008", filter:"blur(80px)", pointerEvents:"none" }}/>
        <div style={{ position:"fixed", bottom:-100, right:-100, width:500, height:500, borderRadius:"50%", background:"#3B82F605", filter:"blur(100px)", pointerEvents:"none" }}/>
        <div style={{ width:420, padding:40, background:"#0D1526", border:"1px solid #1E293B", borderRadius:24, boxShadow:"0 40px 80px #00000060" }}>
          <div style={{ textAlign:"center", marginBottom:36 }}>
            <div style={{ width:72, height:72, borderRadius:"50%", overflow:"hidden", border:"3px solid rgba(255,107,0,0.5)", boxShadow:"0 0 24px rgba(255,107,0,0.3)", display:"inline-flex", alignItems:"center", justifyContent:"center", marginBottom:14 }}>
              <img src={import.meta.env.BASE_URL + "bcpl-assets/bcpl-ball-color.jpg"} alt="BCPL" style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
            </div>
            <div style={{ fontSize:9, fontWeight:800, letterSpacing:".18em", color:"rgba(255,107,0,.5)", textTransform:"uppercase", marginBottom:4 }}>Bhartiya Corporate Premier League</div>
            <div style={{ fontSize:22, fontWeight:900, color:"#FF6B00", letterSpacing:1, lineHeight:1 }}>BCPL Admin</div>
            <div style={{ fontSize:13, color:"#475569", marginTop:6 }}>Season 5 · Secure Access</div>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
            <div>
              <label style={{ display:"block", fontSize:11, fontWeight:700, color:"#475569", letterSpacing:1, marginBottom:8 }}>EMAIL ADDRESS</label>
              <input value={loginForm.email} onChange={e=>setLoginForm(f=>({...f,email:e.target.value}))}
                onKeyDown={e=>e.key==="Enter"&&handleLogin()}
                placeholder="your@email.com"
                style={{ width:"100%", padding:"12px 14px", borderRadius:10, border:"1px solid #1E293B", background:"#080E1C", color:"#E2E8F0", fontSize:14, outline:"none", boxSizing:"border-box", lineHeight:1 }}/>
            </div>
            <div>
              <label style={{ display:"block", fontSize:11, fontWeight:700, color:"#475569", letterSpacing:1, marginBottom:8 }}>PASSWORD</label>
              <input type="password" value={loginForm.password} onChange={e=>{ setLoginForm(f=>({...f,password:e.target.value})); setLoginErr(""); }}
                onKeyDown={e=>e.key==="Enter"&&handleLogin()}
                placeholder="••••••••"
                style={{ width:"100%", padding:"12px 14px", borderRadius:10, border:`1px solid ${loginErr?"#EF4444":"#1E293B"}`, background:"#080E1C", color:"#E2E8F0", fontSize:14, outline:"none", boxSizing:"border-box", lineHeight:1 }}/>
              {loginErr&&<div style={{ fontSize:11, color:"#EF4444", marginTop:6 }}>⚠ {loginErr}</div>}
            </div>
            <button onClick={handleLogin} disabled={loginBusy}
              style={{ marginTop:4, width:"100%", padding:14, borderRadius:12, border:"none", background:"linear-gradient(135deg,#FF6B00,#FF8C40)", color:"#fff", fontWeight:800, fontSize:15, cursor:loginBusy?"wait":"pointer", opacity:loginBusy?0.7:1, letterSpacing:.5, lineHeight:1 }}>
              {loginBusy ? "Signing in…" : "Sign In →"}
            </button>
          </div>
          <div style={{ textAlign:"center", marginTop:20 }}>
            <div style={{ fontSize:11, color:"#334155", padding:"8px 16px", background:"#080E1C", borderRadius:8, display:"inline-block", border:"1px solid #1E293B" }}>
              Contact the Super Admin for your login credentials
            </div>
          </div>
        </div>
      </div>
    );
  }

  const W = collapsed ? 64 : 224;

  return (
    <div style={{ display:"flex", height:"100vh", background:"#060B18", fontFamily:"'Inter',sans-serif", overflow:"hidden" }}>

      {/* ══ SIDEBAR ══ */}
      <aside style={{ width:W, flexShrink:0, background:"#080E1C", borderRight:"1px solid #0F172A", display:"flex", flexDirection:"column", transition:"width .22s cubic-bezier(.4,0,.2,1)", overflow:"hidden" }}>

        {/* Brand */}
        <div style={{ height:60, paddingLeft:collapsed?0:12, paddingRight:collapsed?0:10, borderBottom:"1px solid #0F172A", display:"flex", alignItems:"center", justifyContent:collapsed?"center":"flex-start", gap:10, flexShrink:0 }}>
          <div style={{ width:32, height:32, borderRadius:"50%", overflow:"hidden", border:"2px solid rgba(255,107,0,0.55)", boxShadow:"0 0 10px rgba(255,107,0,0.3)", flexShrink:0 }}>
            <img src={import.meta.env.BASE_URL + "bcpl-assets/bcpl-ball-color.jpg"} alt="BCPL" style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
          </div>
          {!collapsed&&(
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontWeight:900, fontSize:13, color:"#FF6B00", letterSpacing:.5, lineHeight:1, whiteSpace:"nowrap" }}>BCPL Admin</div>
              <div style={{ fontSize:10, color:"#334155", marginTop:3, lineHeight:1, whiteSpace:"nowrap" }}>Season 5 · 2026–27</div>
            </div>
          )}
          <button onClick={()=>setCollapsed(c=>!c)} style={{ width:24, height:24, display:"flex", alignItems:"center", justifyContent:"center", background:"none", border:"none", color:"#334155", cursor:"pointer", fontSize:16, flexShrink:0, lineHeight:1, padding:0 }}>
            {collapsed?"›":"‹"}
          </button>
        </div>

        {/* Nav */}
        <nav style={{ flex:1, padding:"10px 8px", overflowY:"auto", overflowX:"hidden" }}>
          {visibleNAV.map(group=>(
            <div key={group.title} style={{ marginBottom:14 }}>
              {!collapsed&&(
                <div style={{ height:26, display:"flex", alignItems:"center", paddingLeft:8 }}>
                  <span style={{ fontSize:9, fontWeight:800, color:"#1E3A5F", letterSpacing:1.5, textTransform:"uppercase", lineHeight:1 }}>{group.title}</span>
                </div>
              )}
              {group.items.map(item=>{
                const on = active===item.id;
                return (
                  <button key={item.id} onClick={()=>navigate(item.id)} title={collapsed?item.label:undefined}
                    style={{ width:"100%", height:36, padding:collapsed?"0":"0 10px", marginBottom:2, borderRadius:9, border:"none", borderLeft:`2px solid ${on?"#FF6B00":"transparent"}`, background:on?"#FF6B0018":"transparent", color:on?"#FF6B00":"#4B5775", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:collapsed?"center":"flex-start", gap:10, transition:"background .12s,color .12s" }}>
                    <Icon ch={item.icon}/>
                    {!collapsed&&(
                      <>
                        <span style={{ flex:1, fontSize:12.5, fontWeight:on?600:400, textAlign:"left", whiteSpace:"nowrap", lineHeight:1, letterSpacing:.1 }}>{item.label}</span>
                        {item.badge&&(
                          <span style={{ fontSize:9, fontWeight:800, background:`${item.badgeColor}22`, color:item.badgeColor, padding:"2px 6px", borderRadius:6, letterSpacing:.3, lineHeight:1, whiteSpace:"nowrap" }}>{item.badge}</span>
                        )}
                      </>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Profile footer */}
        <div style={{ height:56, paddingLeft:collapsed?0:12, paddingRight:collapsed?0:10, borderTop:"1px solid #0F172A", display:"flex", alignItems:"center", justifyContent:collapsed?"center":"flex-start", gap:10, flexShrink:0 }}>
          <div style={{ width:30, height:30, borderRadius:8, background:"#FF6B0020", border:"2px solid #FF6B0040", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:800, color:"#FF6B00", flexShrink:0, lineHeight:1 }}>
            {(loggedInAdmin?.name||"A").charAt(0).toUpperCase()}
          </div>
          {!collapsed&&(
            <>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:12, fontWeight:700, color:"#CBD5E1", lineHeight:1, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{loggedInAdmin?.name||"Admin"}</div>
                <div style={{ fontSize:10, color:"#334155", marginTop:4, lineHeight:1 }}>{loggedInAdmin?.role||"Super Admin"}</div>
              </div>
              <button onClick={()=>{ clearAdminToken(); setLoggedIn(false); setLoggedInAdmin(null); setLoginForm({email:"",password:""}); setLoginErr(""); }}
                style={{ width:28, height:28, display:"flex", alignItems:"center", justifyContent:"center", background:"none", border:"none", color:"#334155", cursor:"pointer", fontSize:14, flexShrink:0, lineHeight:1, borderRadius:6 }} title="Sign out">⎋</button>
            </>
          )}
        </div>
      </aside>

      {/* ══ MAIN ══ */}
      <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>

        {/* Top bar */}
        <header style={{ height:60, background:"#080E1C", borderBottom:"1px solid #0F172A", display:"flex", alignItems:"center", padding:"0 24px", gap:14, flexShrink:0 }}>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:14, fontWeight:700, color:"#E2E8F0", lineHeight:1 }}>{activeLabel}</div>
            <div style={{ fontSize:11, color:"#334155", marginTop:5, lineHeight:1 }}>BCPL Season 5 · {new Date().toLocaleDateString("en-US",{ month:"long", day:"numeric", year:"numeric" })}</div>
          </div>

          {/* Search */}
          <div style={{ position:"relative" }}>
            <button onClick={()=>setSearchOpen(s=>!s)} style={{ height:34, display:"flex", alignItems:"center", gap:8, padding:"0 12px", borderRadius:9, border:"1px solid #1E293B", background:"#0D1526", color:"#475569", cursor:"pointer", fontSize:12, lineHeight:1 }}>
              <span style={{ fontSize:13, lineHeight:1 }}>⌖</span>
              <span>Search…</span>
              <span style={{ fontSize:9, background:"#1E293B", padding:"2px 6px", borderRadius:5, marginLeft:2, lineHeight:1.4 }}>⌘K</span>
            </button>
            {searchOpen&&(
              <div style={{ position:"absolute", top:"calc(100% + 8px)", right:0, width:320, background:"#0D1526", border:"1px solid #1E293B", borderRadius:14, overflow:"hidden", zIndex:50, boxShadow:"0 20px 40px #00000060" }}>
                <div style={{ padding:"10px 14px", borderBottom:"1px solid #1E293B" }}>
                  <input autoFocus value={searchQ} onChange={e=>setSearchQ(e.target.value)} placeholder="Search all pages & features…"
                    style={{ width:"100%", padding:0, background:"transparent", border:"none", outline:"none", color:"#E2E8F0", fontSize:13, lineHeight:1, boxSizing:"border-box" }}/>
                </div>
                <div style={{ maxHeight:360, overflowY:"auto" }}>
                  {SEARCH_ITEMS.map(item=>(
                    <button key={item.id} onClick={()=>{ navigate(item.id); setSearchOpen(false); setSearchQ(""); }}
                      style={{ width:"100%", height:40, padding:"0 14px", border:"none", background:"transparent", color:"#CBD5E1", cursor:"pointer", display:"flex", alignItems:"center", gap:10, textAlign:"left" }}>
                      <Icon ch={item.icon}/>
                      <span style={{ fontSize:13, lineHeight:1 }}>{item.label}</span>
                    </button>
                  ))}
                  {SEARCH_ITEMS.length===0&&<div style={{ padding:"20px 14px", color:"#475569", fontSize:13, textAlign:"center" }}>No results</div>}
                </div>
              </div>
            )}
          </div>

          {/* Live pill */}
          <div style={{ height:30, display:"flex", alignItems:"center", gap:7, background:"#47556910", border:"1px solid #47556930", borderRadius:20, padding:"0 12px", flexShrink:0 }}>
            <div style={{ width:7, height:7, borderRadius:"50%", background:"#475569", flexShrink:0 }}/>
            <span style={{ fontSize:12, fontWeight:700, color:"#475569", lineHeight:1, whiteSpace:"nowrap" }}>0 Live</span>
          </div>

          {/* Notifications */}
          <div style={{ position:"relative" }}>
            <button onClick={()=>setNotifOpen(o=>!o)} style={{ width:36, height:36, borderRadius:9, border:"1px solid #1E293B", background:"#0D1526", color:"#64748B", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", fontSize:15, position:"relative", lineHeight:1 }}>
              🔔
              {unreadCount>0&&(
                <div style={{ position:"absolute", top:4, right:4, width:16, height:16, borderRadius:"50%", background:"#FF6B00", color:"#fff", fontSize:9, fontWeight:800, display:"flex", alignItems:"center", justifyContent:"center", lineHeight:1 }}>{unreadCount}</div>
              )}
            </button>
            {notifOpen&&(
              <div style={{ position:"absolute", top:"calc(100% + 8px)", right:0, width:320, background:"#0D1526", border:"1px solid #1E293B", borderRadius:16, overflow:"hidden", zIndex:50, boxShadow:"0 20px 40px #00000060" }}>
                <div style={{ height:48, padding:"0 18px", borderBottom:"1px solid #1E293B", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                  <span style={{ fontWeight:700, fontSize:13, lineHeight:1, color:"#F1F5F9" }}>Notifications</span>
                  {NOTIFS.length>0&&<span style={{ fontSize:11, color:"#FF6B00", cursor:"pointer", fontWeight:600, lineHeight:1 }}>Mark all read</span>}
                </div>
                {NOTIFS.map((n,i)=>(
                  <div key={i} style={{ padding:"12px 18px", borderBottom:"1px solid #0F172A", display:"flex", gap:12, alignItems:"center", background:n.unread?"#FF6B0005":"transparent" }}>
                    <span style={{ fontSize:18, lineHeight:1, flexShrink:0 }}>{n.icon}</span>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:12, color:"#CBD5E1", lineHeight:1.4 }}>{n.text}</div>
                      <div style={{ fontSize:10, color:"#334155", marginTop:4, lineHeight:1 }}>{n.time}</div>
                    </div>
                    {n.unread&&<div style={{ width:7, height:7, borderRadius:"50%", background:"#FF6B00", flexShrink:0 }}/>}
                  </div>
                ))}
                {NOTIFS.length===0&&<div style={{ padding:"24px 18px", color:"#475569", fontSize:12, textAlign:"center" }}>No notifications yet</div>}
              </div>
            )}
          </div>

          {(searchOpen||notifOpen)&&<div style={{ position:"fixed", inset:0, zIndex:40 }} onClick={()=>{ setSearchOpen(false); setNotifOpen(false); }}/>}
        </header>

        {/* Content */}
        <main style={{ flex:1, overflowY:"auto", background:"#060B18", padding:24 }}>
          {renderView(active, navigate, navPayload)}
        </main>
      </div>
    </div>
  );
}

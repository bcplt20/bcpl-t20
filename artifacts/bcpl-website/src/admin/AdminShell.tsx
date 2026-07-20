import { useState } from "react";
import DashboardView from "./views/DashboardView";
import UsersView from "./views/UsersView";
import FinanceView from "./views/FinanceView";
import MarketingView from "./views/MarketingView";
import SEOView from "./views/SEOView";
import MatchesView from "./views/MatchesView";
import TeamsView from "./views/TeamsView";
import SelectionView from "./views/SelectionView";
import MediaView from "./views/MediaView";
import SponsorsView from "./views/SponsorsView";
import BannersView from "./views/BannersView";
import CMSView from "./views/CMSView";
import RolesView from "./views/RolesView";
import LiveScoringView from "./views/LiveScoringView";

type NavItem = {
  id: string;
  label: string;
  icon: string;
  badge?: string;
  badgeColor?: string;
};

type NavGroup = {
  title: string;
  items: NavItem[];
};

const NAV: NavGroup[] = [
  {
    title: "OVERVIEW",
    items: [
      { id: "dashboard", label: "Analytics", icon: "📊", badge: "Live", badgeColor: "#10B981" },
      { id: "users", label: "Users", icon: "👥" },
      { id: "finance", label: "Finance", icon: "💰" },
    ],
  },
  {
    title: "GROWTH",
    items: [
      { id: "marketing", label: "Marketing", icon: "📈", badge: "New", badgeColor: "#FF6B00" },
      { id: "seo", label: "SEO", icon: "🔍" },
      { id: "sponsors", label: "Sponsors", icon: "🤝" },
    ],
  },
  {
    title: "LEAGUE",
    items: [
      { id: "matches", label: "Matches", icon: "🏏" },
      { id: "live_scoring", label: "Live Scoring", icon: "🔴", badge: "1 Live", badgeColor: "#EF4444" },
      { id: "teams", label: "Teams", icon: "👕" },
      { id: "selection", label: "Selection", icon: "✅", badge: "Phase 1", badgeColor: "#F59E0B" },
    ],
  },
  {
    title: "CONTENT",
    items: [
      { id: "media", label: "Photos & Videos", icon: "📸" },
      { id: "banners", label: "Banners", icon: "🖼" },
      { id: "cms", label: "CMS / Pages", icon: "📝" },
    ],
  },
  {
    title: "SETTINGS",
    items: [
      { id: "roles", label: "Roles & Access", icon: "🔐" },
    ],
  },
];

function renderView(id: string, setActive: (id: string) => void) {
  switch (id) {
    case "dashboard": return <DashboardView />;
    case "users": return <UsersView />;
    case "finance": return <FinanceView />;
    case "marketing": return <MarketingView />;
    case "seo": return <SEOView />;
    case "sponsors": return <SponsorsView />;
    case "matches": return <MatchesView />;
    case "live_scoring": return <LiveScoringView />;
    case "teams": return <TeamsView />;
    case "selection": return <SelectionView />;
    case "media": return <MediaView />;
    case "banners": return <BannersView />;
    case "cms": return <CMSView />;
    case "roles": return <RolesView />;
    default: return <DashboardView />;
  }
}

export default function AdminShell() {
  const [active, setActive] = useState("dashboard");
  const [loggedIn, setLoggedIn] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: "admin@bcplt20.com", password: "" });
  const [loginErr, setLoginErr] = useState("");
  const [notifOpen, setNotifOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQ, setSearchQ] = useState("");

  const NOTIFS = [
    { icon: "💳", text: "Arjun Sharma paid Phase 2", time: "12s ago", unread: true },
    { icon: "🪪", text: "Rahul Patel completed KYC", time: "1m ago", unread: true },
    { icon: "🔴", text: "Pune Panthers vs BB match started", time: "5m ago", unread: true },
    { icon: "⚠️", text: "3 KYC verifications failed", time: "12m ago", unread: false },
    { icon: "💰", text: "Daily revenue target reached ₹1L+", time: "1h ago", unread: false },
  ];
  const unreadCount = NOTIFS.filter(n => n.unread).length;

  const SEARCH_ITEMS = [
    { label: "Analytics Dashboard", id: "dashboard", icon: "📊" },
    { label: "Users & Players", id: "users", icon: "👥" },
    { label: "Finance & Invoices", id: "finance", icon: "💰" },
    { label: "Marketing & Referrals", id: "marketing", icon: "📈" },
    { label: "Match Schedule", id: "matches", icon: "🏏" },
    { label: "Live Scoring", id: "live_scoring", icon: "🔴" },
    { label: "Teams", id: "teams", icon: "👕" },
    { label: "Player Selection", id: "selection", icon: "✅" },
    { label: "Sponsors", id: "sponsors", icon: "🤝" },
    { label: "Banners", id: "banners", icon: "🖼" },
    { label: "CMS / Pages", id: "cms", icon: "📝" },
    { label: "Roles & Access", id: "roles", icon: "🔐" },
    { label: "SEO Settings", id: "seo", icon: "🔍" },
    { label: "Photos & Videos", id: "media", icon: "📸" },
  ].filter(i => !searchQ || i.label.toLowerCase().includes(searchQ.toLowerCase()));

  if (!loggedIn) {
    return (
      <div style={{ minHeight: "100vh", background: "radial-gradient(ellipse at 20% 50%, #0D1526 0%, #060B18 60%)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Inter', sans-serif" }}>
        <div style={{ position: "fixed", top: -100, left: -100, width: 400, height: 400, borderRadius: "50%", background: "#FF6B0008", filter: "blur(80px)", pointerEvents: "none" }} />
        <div style={{ position: "fixed", bottom: -100, right: -100, width: 500, height: 500, borderRadius: "50%", background: "#3B82F605", filter: "blur(100px)", pointerEvents: "none" }} />
        <div style={{ width: 420, padding: "40px 40px", background: "#0D1526", border: "1px solid #1E293B", borderRadius: 24, boxShadow: "0 40px 80px #00000060" }}>
          <div style={{ textAlign: "center", marginBottom: 36 }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: "#FF6B0020", border: "2px solid #FF6B0050", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 28, marginBottom: 14 }}>🏏</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: "#FF6B00", letterSpacing: 1 }}>BCPL T20</div>
            <div style={{ fontSize: 13, color: "#475569", marginTop: 4 }}>Admin Panel · Season 5</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: "#475569", letterSpacing: 0.5 }}>EMAIL ADDRESS</label>
              <input value={loginForm.email} onChange={e => setLoginForm(f => ({ ...f, email: e.target.value }))} style={{ width: "100%", marginTop: 6, padding: "12px 14px", borderRadius: 10, border: "1px solid #1E293B", background: "#080E1C", color: "#E2E8F0", fontSize: 14, outline: "none", boxSizing: "border-box" }} />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: "#475569", letterSpacing: 0.5 }}>PASSWORD</label>
              <input type="password" value={loginForm.password} onChange={e => { setLoginForm(f => ({ ...f, password: e.target.value })); setLoginErr(""); }} placeholder="••••••••" style={{ width: "100%", marginTop: 6, padding: "12px 14px", borderRadius: 10, border: `1px solid ${loginErr ? "#EF4444" : "#1E293B"}`, background: "#080E1C", color: "#E2E8F0", fontSize: 14, outline: "none", boxSizing: "border-box" }} />
              {loginErr && <div style={{ fontSize: 11, color: "#EF4444", marginTop: 6 }}>{loginErr}</div>}
            </div>
            <button onClick={() => { if (!loginForm.password) { setLoginErr("Password is required"); return; } if (loginForm.password !== "admin123") { setLoginErr("Incorrect password. Try: admin123"); return; } setLoggedIn(true); }} style={{ marginTop: 6, width: "100%", padding: "14px", borderRadius: 12, border: "none", background: "linear-gradient(135deg, #FF6B00, #FF8C40)", color: "#fff", fontWeight: 800, fontSize: 15, cursor: "pointer", letterSpacing: 0.5 }}>
              Sign In →
            </button>
          </div>
          <div style={{ textAlign: "center", marginTop: 20 }}>
            <div style={{ fontSize: 11, color: "#334155", padding: "8px 16px", background: "#080E1C", borderRadius: 8, display: "inline-block", border: "1px solid #1E293B" }}>
              Demo: <span style={{ color: "#FF6B00" }}>admin@bcplt20.com</span> / <span style={{ color: "#FF6B00" }}>admin123</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const activeLabel = NAV.flatMap(g => g.items).find(i => i.id === active)?.label || "Dashboard";

  return (
    <div style={{ display: "flex", height: "100vh", background: "#060B18", fontFamily: "'Inter', sans-serif", overflow: "hidden" }}>
      <aside style={{ width: collapsed ? 64 : 220, background: "#080E1C", borderRight: "1px solid #0F172A", display: "flex", flexDirection: "column", flexShrink: 0, transition: "width 0.25s ease", overflow: "hidden" }}>
        <div style={{ padding: collapsed ? "20px 14px" : "20px 18px", borderBottom: "1px solid #0F172A", display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: "#FF6B0020", border: "1.5px solid #FF6B0060", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>🏏</div>
          {!collapsed && (<div style={{ minWidth: 0 }}><div style={{ fontWeight: 900, fontSize: 14, color: "#FF6B00", letterSpacing: 0.5 }}>BCPL Admin</div><div style={{ fontSize: 10, color: "#334155" }}>Season 5 · 2024-25</div></div>)}
          <button onClick={() => setCollapsed(c => !c)} style={{ marginLeft: "auto", background: "none", border: "none", color: "#334155", cursor: "pointer", fontSize: 14, flexShrink: 0, padding: 0, lineHeight: 1 }}>{collapsed ? "›" : "‹"}</button>
        </div>
        <nav style={{ flex: 1, padding: "12px 8px", overflowY: "auto", overflowX: "hidden" }}>
          {NAV.map(group => (
            <div key={group.title} style={{ marginBottom: 20 }}>
              {!collapsed && (<div style={{ fontSize: 9, fontWeight: 800, color: "#1E3A5F", letterSpacing: 1.5, padding: "0 8px 6px", textTransform: "uppercase" }}>{group.title}</div>)}
              {group.items.map(item => {
                const isActive = active === item.id;
                return (
                  <button key={item.id} onClick={() => setActive(item.id)} title={collapsed ? item.label : undefined} style={{ width: "100%", padding: collapsed ? "10px 0" : "9px 10px", borderRadius: 10, border: "none", background: isActive ? "#FF6B0015" : "transparent", color: isActive ? "#FF6B00" : "#475569", cursor: "pointer", display: "flex", alignItems: "center", gap: 10, justifyContent: collapsed ? "center" : "flex-start", marginBottom: 2, transition: "all 0.15s", borderLeft: isActive ? "2px solid #FF6B00" : "2px solid transparent" }}>
                    <span style={{ fontSize: 16, flexShrink: 0 }}>{item.icon}</span>
                    {!collapsed && (<><span style={{ fontSize: 13, fontWeight: isActive ? 700 : 500, flex: 1, textAlign: "left", whiteSpace: "nowrap" }}>{item.label}</span>{item.badge && (<span style={{ fontSize: 9, fontWeight: 800, background: `${item.badgeColor}20`, color: item.badgeColor, padding: "2px 6px", borderRadius: 8, letterSpacing: 0.3 }}>{item.badge}</span>)}</>)}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>
        <div style={{ padding: collapsed ? "14px 8px" : "14px 12px", borderTop: "1px solid #0F172A", display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: "#FF6B0020", border: "2px solid #FF6B0040", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, color: "#FF6B00", flexShrink: 0 }}>A</div>
          {!collapsed && (<div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 12, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Admin</div><div style={{ fontSize: 10, color: "#334155" }}>Super Admin</div></div>)}
          {!collapsed && (<button onClick={() => setLoggedIn(false)} style={{ background: "none", border: "none", color: "#334155", cursor: "pointer", fontSize: 13, flexShrink: 0 }} title="Sign out">⎋</button>)}
        </div>
      </aside>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <header style={{ height: 60, background: "#080E1C", borderBottom: "1px solid #0F172A", display: "flex", alignItems: "center", padding: "0 24px", gap: 16, flexShrink: 0 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#E2E8F0" }}>{activeLabel}</div>
            <div style={{ fontSize: 11, color: "#334155" }}>BCPL Season 5 · July 20, 2025</div>
          </div>
          <div style={{ position: "relative" }}>
            <button onClick={() => setSearchOpen(s => !s)} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 14px", borderRadius: 10, border: "1px solid #1E293B", background: "#0D1526", color: "#475569", cursor: "pointer", fontSize: 12 }}>
              🔍 <span>Search...</span>
              <span style={{ fontSize: 10, background: "#1E293B", padding: "2px 6px", borderRadius: 6, marginLeft: 4 }}>⌘K</span>
            </button>
            {searchOpen && (
              <div style={{ position: "absolute", top: "calc(100% + 8px)", right: 0, width: 300, background: "#0D1526", border: "1px solid #1E293B", borderRadius: 14, overflow: "hidden", zIndex: 50, boxShadow: "0 20px 40px #00000060" }}>
                <div style={{ padding: "10px 14px", borderBottom: "1px solid #1E293B" }}>
                  <input autoFocus value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="Search pages & features..." style={{ width: "100%", padding: 0, background: "transparent", border: "none", outline: "none", color: "#E2E8F0", fontSize: 13, boxSizing: "border-box" }} />
                </div>
                <div style={{ maxHeight: 280, overflowY: "auto" }}>
                  {SEARCH_ITEMS.map(item => (<button key={item.id} onClick={() => { setActive(item.id); setSearchOpen(false); setSearchQ(""); }} style={{ width: "100%", padding: "10px 14px", border: "none", background: "transparent", color: "#CBD5E1", cursor: "pointer", display: "flex", alignItems: "center", gap: 10, textAlign: "left" }}><span style={{ fontSize: 16 }}>{item.icon}</span><span style={{ fontSize: 13 }}>{item.label}</span></button>))}
                  {SEARCH_ITEMS.length === 0 && <div style={{ padding: "20px 14px", color: "#475569", fontSize: 13, textAlign: "center" }}>No results</div>}
                </div>
              </div>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 7, background: "#10B98115", border: "1px solid #10B98130", borderRadius: 20, padding: "6px 12px" }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#10B981" }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: "#10B981" }}>247 Live</span>
          </div>
          <div style={{ position: "relative" }}>
            <button onClick={() => setNotifOpen(o => !o)} style={{ width: 38, height: 38, borderRadius: 10, border: "1px solid #1E293B", background: "#0D1526", color: "#64748B", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, position: "relative" }}>
              🔔
              {unreadCount > 0 && (<div style={{ position: "absolute", top: 4, right: 4, width: 16, height: 16, borderRadius: "50%", background: "#FF6B00", color: "#fff", fontSize: 9, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" }}>{unreadCount}</div>)}
            </button>
            {notifOpen && (
              <div style={{ position: "absolute", top: "calc(100% + 8px)", right: 0, width: 320, background: "#0D1526", border: "1px solid #1E293B", borderRadius: 16, overflow: "hidden", zIndex: 50, boxShadow: "0 20px 40px #00000060" }}>
                <div style={{ padding: "14px 18px", borderBottom: "1px solid #1E293B", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontWeight: 700, fontSize: 14 }}>Notifications</span>
                  <span style={{ fontSize: 11, color: "#FF6B00", cursor: "pointer", fontWeight: 600 }}>Mark all read</span>
                </div>
                {NOTIFS.map((n, i) => (<div key={i} style={{ padding: "12px 18px", borderBottom: "1px solid #0F172A", display: "flex", gap: 12, alignItems: "flex-start", background: n.unread ? "#FF6B0005" : "transparent" }}><span style={{ fontSize: 18 }}>{n.icon}</span><div style={{ flex: 1 }}><div style={{ fontSize: 12, color: "#CBD5E1", lineHeight: 1.4 }}>{n.text}</div><div style={{ fontSize: 10, color: "#334155", marginTop: 3 }}>{n.time}</div></div>{n.unread && <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#FF6B00", flexShrink: 0, marginTop: 4 }} />}</div>))}
              </div>
            )}
          </div>
          {(searchOpen || notifOpen) && (<div style={{ position: "fixed", inset: 0, zIndex: 40 }} onClick={() => { setSearchOpen(false); setNotifOpen(false); }} />)}
        </header>
        <main style={{ flex: 1, overflowY: "auto", background: "#060B18" }}>
          {renderView(active, setActive)}
        </main>
      </div>
    </div>
  );
}

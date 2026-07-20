import { useState } from "react";
import DashboardView  from "./views/DashboardView";
import UsersView      from "./views/UsersView";
import FinanceView    from "./views/FinanceView";
import TeamsView      from "./views/TeamsView";
import MatchesView    from "./views/MatchesView";
import SelectionView  from "./views/SelectionView";
import LiveScoringView from "./views/LiveScoringView";
import MarketingView  from "./views/MarketingView";
import SEOView        from "./views/SEOView";
import SponsorsView   from "./views/SponsorsView";
import BannersView    from "./views/BannersView";
import CMSView        from "./views/CMSView";
import RolesView      from "./views/RolesView";
import MediaView      from "./views/MediaView";

/* ─── Types ─────────────────────────────────────────────── */
type ViewKey =
  | "dashboard" | "users" | "finance" | "teams" | "matches"
  | "selection" | "live-scoring" | "marketing" | "seo"
  | "sponsors" | "banners" | "cms" | "roles" | "media";

interface NavItem {
  key: ViewKey;
  label: string;
  icon: string;
  group: string;
}

/* ─── Nav config ─────────────────────────────────────────── */
const NAV: NavItem[] = [
  { key: "dashboard",    label: "Dashboard",     icon: "📊", group: "Overview" },
  { key: "users",        label: "Users",         icon: "👥", group: "Players" },
  { key: "finance",      label: "Finance",       icon: "💰", group: "Players" },
  { key: "selection",    label: "Selection",     icon: "🏏", group: "Players" },
  { key: "teams",        label: "Teams",         icon: "🛡️",  group: "Tournament" },
  { key: "matches",      label: "Matches",       icon: "📅", group: "Tournament" },
  { key: "live-scoring", label: "Live Scoring",  icon: "🔴", group: "Tournament" },
  { key: "marketing",    label: "Marketing",     icon: "📣", group: "Growth" },
  { key: "seo",          label: "SEO",           icon: "🔍", group: "Growth" },
  { key: "sponsors",     label: "Sponsors",      icon: "🤝", group: "Content" },
  { key: "banners",      label: "Banners",       icon: "🖼️",  group: "Content" },
  { key: "cms",          label: "CMS",           icon: "✏️",  group: "Content" },
  { key: "media",        label: "Media",         icon: "🎬", group: "Content" },
  { key: "roles",        label: "Roles",         icon: "🔐", group: "Settings" },
];

const VIEWS: Record<ViewKey, React.ComponentType> = {
  dashboard:    DashboardView,
  users:        UsersView,
  finance:      FinanceView,
  teams:        TeamsView,
  matches:      MatchesView,
  selection:    SelectionView,
  "live-scoring": LiveScoringView,
  marketing:    MarketingView,
  seo:          SEOView,
  sponsors:     SponsorsView,
  banners:      BannersView,
  cms:          CMSView,
  roles:        RolesView,
  media:        MediaView,
};

const ADMIN_EMAIL = "admin@bcplt20.com";
const ADMIN_PASS  = "admin123";

/* ─── Login Screen ───────────────────────────────────────── */
function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail]   = useState("");
  const [pass, setPass]     = useState("");
  const [error, setError]   = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      if (email === ADMIN_EMAIL && pass === ADMIN_PASS) {
        onLogin();
      } else {
        setError("Invalid email or password.");
        setLoading(false);
      }
    }, 600);
  };

  return (
    <div style={{
      minHeight: "100vh", background: "#06101E",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'Montserrat', sans-serif",
    }}>
      <div style={{
        background: "#0D1B2E", borderRadius: 16, padding: "48px 40px",
        width: 380, boxShadow: "0 8px 48px rgba(0,0,0,.5)",
        border: "1px solid rgba(255,255,255,.07)",
      }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>🏏</div>
          <div style={{ color: "#FF7A29", fontWeight: 900, fontSize: 22, letterSpacing: ".06em" }}>
            BCPL T20
          </div>
          <div style={{ color: "#7A8EA8", fontSize: 13, marginTop: 4 }}>Admin Panel</div>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ color: "#7A8EA8", fontSize: 12, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase" }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="admin@bcplt20.com"
              style={inputStyle}
            />
          </div>
          <div style={{ marginBottom: 24 }}>
            <label style={{ color: "#7A8EA8", fontSize: 12, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase" }}>
              Password
            </label>
            <input
              type="password"
              value={pass}
              onChange={e => setPass(e.target.value)}
              required
              placeholder="••••••••"
              style={inputStyle}
            />
          </div>
          {error && (
            <div style={{ color: "#FF4444", fontSize: 13, marginBottom: 16, textAlign: "center" }}>
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%", padding: "14px", background: "linear-gradient(135deg,#FF7A29,#FF4500)",
              color: "#fff", border: "none", borderRadius: 10, fontWeight: 900,
              fontSize: 15, letterSpacing: ".06em", cursor: "pointer",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  display: "block", width: "100%", marginTop: 8,
  background: "#06101E", border: "1px solid rgba(255,255,255,.12)",
  borderRadius: 8, padding: "12px 14px", color: "#fff",
  fontSize: 14, outline: "none", boxSizing: "border-box",
  fontFamily: "'Montserrat', sans-serif",
};

/* ─── Shell ──────────────────────────────────────────────── */
export default function AdminShell() {
  const [authed, setAuthed]     = useState(() => sessionStorage.getItem("bcpl_admin") === "1");
  const [active, setActive]     = useState<ViewKey>("dashboard");
  const [sidebarOpen, setSidebar] = useState(true);

  if (!authed) {
    return (
      <LoginScreen
        onLogin={() => {
          sessionStorage.setItem("bcpl_admin", "1");
          setAuthed(true);
        }}
      />
    );
  }

  const ActiveView = VIEWS[active];

  // Group nav items
  const groups = Array.from(new Set(NAV.map(n => n.group)));

  return (
    <div style={{
      display: "flex", minHeight: "100vh",
      fontFamily: "'Montserrat', sans-serif",
      background: "#06101E", color: "#E8F0FE",
    }}>
      {/* ── Sidebar ── */}
      <aside style={{
        width: sidebarOpen ? 220 : 64,
        background: "#0D1B2E",
        borderRight: "1px solid rgba(255,255,255,.07)",
        display: "flex", flexDirection: "column",
        transition: "width .2s",
        flexShrink: 0,
        overflowY: "auto",
        overflowX: "hidden",
      }}>
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "20px 16px", borderBottom: "1px solid rgba(255,255,255,.07)",
        }}>
          <span style={{ fontSize: 22, flexShrink: 0 }}>🏏</span>
          {sidebarOpen && (
            <span style={{ fontWeight: 900, color: "#FF7A29", fontSize: 14, letterSpacing: ".06em", whiteSpace: "nowrap" }}>
              BCPL Admin
            </span>
          )}
          <button
            onClick={() => setSidebar(v => !v)}
            style={{
              marginLeft: "auto", background: "none", border: "none",
              color: "#7A8EA8", cursor: "pointer", fontSize: 18, padding: 4,
            }}
          >
            {sidebarOpen ? "◀" : "▶"}
          </button>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "12px 0" }}>
          {groups.map(group => (
            <div key={group}>
              {sidebarOpen && (
                <div style={{
                  color: "#3A5068", fontSize: 10, fontWeight: 700,
                  letterSpacing: ".1em", textTransform: "uppercase",
                  padding: "12px 18px 4px",
                }}>
                  {group}
                </div>
              )}
              {NAV.filter(n => n.group === group).map(item => (
                <button
                  key={item.key}
                  onClick={() => setActive(item.key)}
                  style={{
                    display: "flex", alignItems: "center", gap: 12,
                    width: "100%", padding: sidebarOpen ? "10px 18px" : "10px 20px",
                    background: active === item.key
                      ? "linear-gradient(90deg,rgba(255,122,41,.18),transparent)"
                      : "none",
                    border: "none",
                    borderLeft: active === item.key ? "3px solid #FF7A29" : "3px solid transparent",
                    color: active === item.key ? "#FF7A29" : "#7A8EA8",
                    cursor: "pointer",
                    fontFamily: "'Montserrat', sans-serif",
                    fontSize: 13, fontWeight: 700,
                    textAlign: "left", whiteSpace: "nowrap",
                    transition: "all .15s",
                  }}
                  title={!sidebarOpen ? item.label : undefined}
                >
                  <span style={{ fontSize: 16, flexShrink: 0 }}>{item.icon}</span>
                  {sidebarOpen && item.label}
                </button>
              ))}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div style={{ padding: "16px", borderTop: "1px solid rgba(255,255,255,.07)" }}>
          <button
            onClick={() => {
              sessionStorage.removeItem("bcpl_admin");
              setAuthed(false);
            }}
            style={{
              display: "flex", alignItems: "center", gap: 10,
              width: "100%", background: "none", border: "none",
              color: "#7A8EA8", cursor: "pointer", padding: "8px 4px",
              fontSize: 13, fontWeight: 700, fontFamily: "'Montserrat', sans-serif",
            }}
          >
            <span style={{ fontSize: 16 }}>🚪</span>
            {sidebarOpen && "Logout"}
          </button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main style={{ flex: 1, overflowY: "auto", minWidth: 0 }}>
        {/* Top bar */}
        <div style={{
          background: "#0D1B2E",
          borderBottom: "1px solid rgba(255,255,255,.07)",
          padding: "16px 28px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div>
            <div style={{ fontWeight: 900, fontSize: 18, color: "#fff" }}>
              {NAV.find(n => n.key === active)?.icon} {NAV.find(n => n.key === active)?.label}
            </div>
            <div style={{ color: "#7A8EA8", fontSize: 12, marginTop: 2 }}>
              BCPL T20 Admin · {new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            </div>
          </div>
          <div style={{
            background: "rgba(255,122,41,.15)", border: "1px solid rgba(255,122,41,.3)",
            borderRadius: 8, padding: "6px 14px", color: "#FF7A29",
            fontSize: 12, fontWeight: 700,
          }}>
            👤 Admin
          </div>
        </div>

        {/* View content */}
        <div style={{ padding: "28px" }}>
          <ActiveView />
        </div>
      </main>
    </div>
  );
}

import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'wouter';
import { SiteHeader } from '../components/SiteHeader';
import { StickyRegisterCTA } from '../components/StickyRegisterCTA';
import { BCPLFooter } from '../components/BCPLFooter';
import { getTeams, getTeamDetail, type ApiTeam, type ApiTeamPlayer } from '../lib/api';
import { useLang } from '../lib/i18n';

const asset = (url: string) =>
  !url ? "" : url.startsWith("data:") || url.startsWith("http") ? url : import.meta.env.BASE_URL + url.replace(/^\//, "");

/* Role normalization: API returns "bat"/"Batsman"/"bowler"/"Bowler" etc. */
const normalizeRole = (role: string): string => {
  const r = role.toLowerCase().trim();
  if (r === "bat" || r === "batsman") return "Batsman";
  if (r === "bowl" || r === "bowler") return "Bowler";
  if (r === "wk" || r === "wicket-keeper" || r === "wicketkeeper") return "Wicket-keeper";
  if (r === "ar" || r === "all-rounder" || r === "allrounder") return "All-rounder";
  return role;
};

const ROLE_COLORS: Record<string, string> = {
  "Batsman": "#3B82F6",
  "Bowler": "#EF4444",
  "Wicket-keeper": "#F59E0B",
  "All-rounder": "#10B981",
};

export function Players() {
  const { t } = useLang();
  const [teams, setTeams] = useState<ApiTeam[]>([]);
  const [allPlayers, setAllPlayers] = useState<(ApiTeamPlayer & { teamName: string; teamColor: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadErr, setLoadErr] = useState("");

  const [search, setSearch] = useState("");
  const [filterTeam, setFilterTeam] = useState("All Teams");
  const [filterRole, setFilterRole] = useState("All Roles");

  useEffect(() => {
    getTeams(5)
      .then(d => {
        const tms = d.teams || [];
        setTeams(tms);
        /* Fetch all squads in parallel */
        return Promise.all(
          tms.map(t => getTeamDetail(t.slug).then(r => ({ team: t, players: r.players || [] })))
        );
      })
      .then(results => {
        const flat = results.flatMap(({ team, players }) =>
          players.map(p => ({ ...p, teamName: team.name, teamColor: team.color || "#64748B" }))
        );
        setAllPlayers(flat);
      })
      .catch(e => setLoadErr(e?.message || "Could not load players"))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let arr = allPlayers;
    if (search.trim()) {
      const q = search.toLowerCase();
      arr = arr.filter(p => p.name.toLowerCase().includes(q));
    }
    if (filterTeam !== "All Teams") {
      arr = arr.filter(p => p.teamName === filterTeam);
    }
    if (filterRole !== "All Roles") {
      arr = arr.filter(p => normalizeRole(p.role) === filterRole);
    }
    return arr;
  }, [allPlayers, search, filterTeam, filterRole]);

  const uniqueRoles = useMemo(() => {
    const roles = new Set(allPlayers.map(p => normalizeRole(p.role)));
    return ["All Roles", ...Array.from(roles).sort()];
  }, [allPlayers]);

  const squadEmpty = !loading && !loadErr && allPlayers.length === 0;

  return (
    <div style={{ background: "#06101E", color: "#F0EDE8", minHeight: "100vh", fontFamily: "Inter,sans-serif", overflowX: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@700;800;900&family=Inter:wght@400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        .wrap { max-width: 1280px; margin: 0 auto; padding: 0 16px; }
        @media(min-width:640px) { .wrap { padding: 0 24px; } }
        @media(min-width:1024px) { .wrap { padding: 0 40px; } }
        .slbl { font-family: var(--font-head); font-weight: 800; font-size: 11px; letter-spacing: .15em; color: #FF7A29; text-transform: uppercase; display: flex; align-items: center; gap: 10px; margin-bottom: 14px; }
        .slbl::before { content: ''; display: inline-block; width: 20px; height: 2px; background: #FF7A29; }
        .shimmer-gold { background: linear-gradient(90deg,#E8B23D,#FFD700,#E8B23D); background-size: 200% auto; -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; animation: shimmer 3s linear infinite; }
        @keyframes shimmer { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
        @keyframes fadeSlide { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: translateY(0); } }
        .player-card { background: linear-gradient(135deg,rgba(15,34,71,0.9),rgba(10,22,46,0.85)); backdrop-filter: blur(24px); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 18px 16px; transition: transform 0.2s, border-color 0.2s, box-shadow 0.2s; animation: fadeSlide 0.4s ease both; }
        .player-card:hover { transform: translateY(-4px); border-color: rgba(255,122,41,0.35); box-shadow: 0 14px 40px rgba(0,0,0,0.5); }
        .filter-input { background: rgba(255,255,255,0.04); border: 1.5px solid rgba(255,255,255,0.1); border-radius: 12px; color: #F8F4EE; padding: 10px 16px; font-family: Inter, sans-serif; font-size: 14px; outline: none; transition: border-color 0.2s; width: 100%; }
        .filter-input:focus { border-color: #FF7A29; }
        .filter-select { background: rgba(255,255,255,0.04); border: 1.5px solid rgba(255,255,255,0.1); border-radius: 12px; color: #F8F4EE; padding: 10px 16px; font-family: Inter, sans-serif; font-size: 14px; outline: none; cursor: pointer; appearance: none; -webkit-appearance: none; transition: border-color 0.2s; }
        .filter-select:hover { border-color: rgba(255,122,41,0.5); }
        .player-grid { display: grid; grid-template-columns: 1fr; gap: 14px; }
        @media(min-width:640px) { .player-grid { grid-template-columns: repeat(2,1fr); } }
        @media(min-width:1024px) { .player-grid { grid-template-columns: repeat(3,1fr); } }
        /* Floating register button */
        .float-reg-btn { position: fixed; bottom: 28px; right: 28px; z-index: 900; background: linear-gradient(135deg,#FF7A29,#D95E10); border: none; border-radius: 12px; color: #fff; font-family: var(--font-head); font-weight: 900; font-size: 13px; letter-spacing: .06em; cursor: pointer; padding: 14px 22px; text-transform: uppercase; text-decoration: none; display: flex; align-items: center; gap: 8px; box-shadow: 0 8px 32px rgba(255,122,41,0.45); clip-path: polygon(0 0,calc(100% - 8px) 0,100% 8px,100% 100%,0 100%); transition: opacity .2s, transform .15s; }
        .float-reg-btn:hover { opacity: .9; transform: translateY(-2px); }
@media(max-width:1023px){ .float-reg-btn { display:none; } }
        @keyframes floatPulse { 0%,100% { box-shadow: 0 8px 32px rgba(255,122,41,0.45),0 0 0 0 rgba(255,122,41,0.4); } 50% { box-shadow: 0 8px 40px rgba(255,122,41,0.6),0 0 0 8px rgba(255,122,41,0); } }
        .float-reg-pulse { animation: floatPulse 2.5s ease-in-out infinite; }
        @media(max-width:639px) { .float-reg-btn { bottom: 16px; right: 16px; padding: 12px 16px; font-size: 12px; } }
      `}</style>

      <SiteHeader active="Players" />

      {/* HERO */}
      <section style={{ padding: "clamp(48px,6vw,72px) 0 clamp(32px,4vw,48px)", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 60% 50% at 50% 0%,rgba(255,122,41,0.06) 0%,transparent 70%)", pointerEvents: "none" }} />
        <div className="wrap" style={{ position: "relative", zIndex: 1, textAlign: "center" }}>
          <div className="slbl" style={{ justifyContent: "center" }}>
            {t("The Players", "खिलाड़ी")}
          </div>
          <h1 style={{ fontFamily: "var(--font-head)", fontWeight: 900, fontSize: "clamp(32px,6vw,64px)", lineHeight: 1.05, color: "#fff", textTransform: "uppercase", marginBottom: 12 }}>
            {t("SEASON 5", "सीज़न 5")}<br />
            <span className="shimmer-gold">{t("PLAYERS", "खिलाड़ी")}</span>
          </h1>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "clamp(14px,2vw,16px)", lineHeight: 1.7, maxWidth: 480, margin: "0 auto" }}>
            {t("Every player, every role, every team — the complete BCPL Season 5 players database.", "हर खिलाड़ी, हर role, हर team — पूरा BCPL Season 5 players database।")}
          </p>
        </div>
      </section>

      <div className="wrap" style={{ paddingBottom: 100 }}>

        {/* FILTERS */}
        {!squadEmpty && (
          <div style={{ background: "linear-gradient(135deg,rgba(15,34,71,0.9),rgba(10,22,46,0.85))", backdropFilter: "blur(24px)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: "24px 20px", marginBottom: 32 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 14 }}>
              <input
                type="text"
                className="filter-input"
                placeholder={t("Search player name...", "खिलाड़ी का नाम खोजें...")}
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <select
                  className="filter-select"
                  value={filterTeam}
                  onChange={e => setFilterTeam(e.target.value)}
                >
                  <option value="All Teams" style={{ background: "#0A1727" }}>{t("All Teams", "सभी टीम")}</option>
                  {teams.map(t => (
                    <option key={t.id} value={t.name} style={{ background: "#0A1727" }}>{t.name}</option>
                  ))}
                </select>
                <select
                  className="filter-select"
                  value={filterRole}
                  onChange={e => setFilterRole(e.target.value)}
                >
                  {uniqueRoles.map(r => (
                    <option key={r} value={r} style={{ background: "#0A1727" }}>{r}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* LOADING */}
        {loading && (
          <div style={{ textAlign: "center", padding: "60px 0", color: "rgba(255,255,255,0.4)", fontFamily: "Inter,sans-serif", fontSize: 15 }}>
            {t("Loading players…", "खिलाड़ी लोड हो रहे हैं…")}
          </div>
        )}

        {/* ERROR */}
        {loadErr && (
          <div style={{ background: "rgba(232,73,63,0.08)", border: "1px solid rgba(232,73,63,0.3)", borderRadius: 12, padding: "18px 20px", textAlign: "center", color: "#F87171", fontFamily: "Inter,sans-serif", fontSize: 14, marginBottom: 24 }}>
            {t("Could not load players right now — please refresh the page to try again.", "अभी खिलाड़ी लोड नहीं हो सके — पेज refresh करके फिर से कोशिश करें।")}
          </div>
        )}

        {/* EMPTY STATE — squads not announced yet */}
        {squadEmpty && (
          <div style={{ textAlign: "center", padding: "clamp(60px,10vw,100px) 20px" }}>
            <div style={{ fontSize: 64, marginBottom: 20 }}>🏏</div>
            <h2 style={{ fontFamily: "var(--font-head)", fontWeight: 900, fontSize: "clamp(22px,4vw,36px)", color: "#fff", marginBottom: 12 }}>
              {t("Squads Announced After Auction", "Auction के बाद squad announce होंगे")}
            </h2>
            <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 15, maxWidth: 440, margin: "0 auto 28px", lineHeight: 1.7 }}>
              {t("Season 5 squad rosters will be announced after the players' auction in August 2026. All registered players will appear here once teams are finalised.", "Season 5 की squad lists players' auction के बाद (Aug 2026) announce होंगी। सभी registered players यहाँ दिखेंगे जब teams finalize होंगी।")}
            </p>
            <Link href="/register" className="float-reg-btn" style={{ position: "static", animation: "none", display: "inline-flex", boxShadow: "0 6px 24px rgba(255,122,41,0.35)" }}>
              {t("🏏 Register for Season 5 →", "🏏 Season 5 के लिए रजिस्टर करें →")}
            </Link>
          </div>
        )}

        {/* NO RESULTS after filter */}
        {!loading && !loadErr && allPlayers.length > 0 && filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: "60px 0", color: "rgba(255,255,255,0.35)", fontFamily: "Inter,sans-serif", fontSize: 15 }}>
            {t("No players match your filters.", "कोई खिलाड़ी आपके filter से match नहीं करता।")}
          </div>
        )}

        {/* PLAYER CARDS */}
        {filtered.length > 0 && (
          <>
            <div style={{ marginBottom: 20, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
              <span style={{ fontFamily: "var(--font-head)", fontWeight: 800, fontSize: 13, color: "rgba(255,255,255,0.6)" }}>
                {filtered.length} {t(filtered.length === 1 ? "PLAYER" : "PLAYERS", filtered.length === 1 ? "खिलाड़ी" : "खिलाड़ी")}
              </span>
            </div>
            <div className="player-grid">
              {filtered.map((p, i) => {
                const roleNorm = normalizeRole(p.role);
                const roleColor = ROLE_COLORS[roleNorm] || "#64748B";
                return (
                  <div key={p.id} className="player-card" style={{ animationDelay: `${(i % 9) * 0.05}s` }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
                      {p.photoUrl ? (
                        <img src={asset(p.photoUrl)} alt={p.name} style={{ width: 56, height: 56, borderRadius: "50%", objectFit: "cover", border: `2px solid ${p.teamColor}`, flexShrink: 0 }} />
                      ) : (
                        <div style={{ width: 56, height: 56, borderRadius: "50%", background: `linear-gradient(135deg,${p.teamColor}33,${p.teamColor}11)`, border: `2px solid ${p.teamColor}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-head)", fontWeight: 900, fontSize: 18, color: p.teamColor, flexShrink: 0 }}>
                          {p.jerseyNo || p.name[0]}
                        </div>
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontFamily: "var(--font-head)", fontWeight: 800, fontSize: 15, color: "#F8F4EE", marginBottom: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name}</div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                          <span style={{ background: `${roleColor}22`, border: `1px solid ${roleColor}55`, color: roleColor, fontSize: 10, fontWeight: 800, padding: "2px 8px", borderRadius: 6, fontFamily: "var(--font-head)", letterSpacing: ".06em" }}>{roleNorm.toUpperCase()}</span>
                          {p.isCaptain && <span style={{ background: "rgba(232,178,61,0.2)", border: "1px solid rgba(232,178,61,0.5)", color: "#E8B23D", fontSize: 9, fontWeight: 800, padding: "2px 7px", borderRadius: 100, fontFamily: "var(--font-head)", letterSpacing: ".06em" }}>C</span>}
                          {p.isViceCaptain && <span style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.25)", color: "rgba(255,255,255,0.75)", fontSize: 9, fontWeight: 800, padding: "2px 7px", borderRadius: 100, fontFamily: "var(--font-head)", letterSpacing: ".06em" }}>VC</span>}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                      <div style={{ width: 20, height: 20, borderRadius: "50%", background: `${p.teamColor}22`, border: `2px solid ${p.teamColor}`, flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontFamily: "var(--font-head)", fontWeight: 700, fontSize: 12, color: p.teamColor, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.teamName}</div>
                      </div>
                      {p.jerseyNo && <span style={{ fontFamily: "var(--font-head)", fontWeight: 900, fontSize: 18, color: "rgba(255,255,255,0.25)" }}>#{p.jerseyNo}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

      </div>

      <StickyRegisterCTA />
      <BCPLFooter />

      {/* Floating register button */}
      <Link href="/register" className="float-reg-btn float-reg-pulse">
        {t("🏏 REGISTER NOW →", "🏏 अभी रजिस्टर करें →")}
      </Link>
    </div>
  );
}

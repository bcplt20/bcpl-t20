/**
 * BCPL Staff App shell — mobile-first PWA-style tools for trial day.
 * Field staff log in with the same admin_users accounts (new field roles);
 * the server enforces every permission — tiles here are convenience only.
 */
import { useEffect, useState } from "react";
import { staffLogin, staffMe, hasAdminToken, clearAdminToken, type StaffMe } from "./staffApi";
import { GateScan } from "./GateScan";
import { CheckinScan } from "./CheckinScan";
import { EvalScore } from "./EvalScore";
import { SupervisorPanel } from "./SupervisorPanel";

type Tool = "home" | "gate" | "checkin" | "score" | "supervisor";

const TOOL_TILES: { id: Tool; label: string; sub: string; icon: string; roles: string[] }[] = [
  { id: "gate", label: "Gate Scan", sub: "Entry check — GREEN / YELLOW / RED", icon: "🛂", roles: ["GATE_SECURITY", "CHECKIN_STAFF", "VENUE_SUPERVISOR", "HEAD_ASSESSOR", "TRIAL_CITY_MANAGER", "SUPER_ADMIN"] },
  { id: "checkin", label: "Check-In Desk", sub: "Identity verify + wristband", icon: "🎫", roles: ["CHECKIN_STAFF", "VENUE_SUPERVISOR", "HEAD_ASSESSOR", "TRIAL_CITY_MANAGER", "SUPER_ADMIN"] },
  { id: "score", label: "Skill Scoring", sub: "Attempts + 100-point assessment", icon: "🏏", roles: ["STATION_OPERATOR", "TRIAL_EVALUATOR", "HEAD_ASSESSOR", "SUPER_ADMIN"] },
  { id: "supervisor", label: "Supervisor", sub: "Corrections + venue counters", icon: "📋", roles: ["VENUE_SUPERVISOR", "HEAD_ASSESSOR", "TRIAL_CITY_MANAGER", "SUPER_ADMIN"] },
];

export default function StaffApp() {
  const [me, setMe] = useState<StaffMe | null>(null);
  const [booting, setBooting] = useState(true);
  const [tool, setTool] = useState<Tool>("home");

  useEffect(() => {
    document.title = "BCPL Staff App";
    if (!hasAdminToken()) { setBooting(false); return; }
    staffMe().then(setMe).catch(() => clearAdminToken()).finally(() => setBooting(false));
  }, []);

  const logout = () => { clearAdminToken(); setMe(null); setTool("home"); };
  const tiles = me ? TOOL_TILES.filter((t) => t.roles.includes(me.role)) : [];

  return (
    <div className="stf-root">
      <style>{STAFF_CSS}</style>
      {booting ? (
        <div className="stf-center"><div className="stf-spin" /></div>
      ) : !me ? (
        <StaffLogin onDone={setMe} />
      ) : (
        <>
          <header className="stf-head">
            <button type="button" className="stf-head-back" onClick={() => setTool("home")} aria-label="Home">
              {tool === "home" ? "🏏" : "‹"}
            </button>
            <div className="stf-head-mid">
              <div className="stf-head-title">
                {tool === "home" ? "BCPL STAFF" : TOOL_TILES.find((t) => t.id === tool)?.label.toUpperCase()}
              </div>
              <div className="stf-head-sub">{me.name} · {me.role.replaceAll("_", " ")}</div>
            </div>
            <button type="button" className="stf-head-out" onClick={logout}>Logout</button>
          </header>

          {tool === "home" && (
            <main className="stf-main">
              <div className="stf-welcome">
                <div className="stf-welcome-big">Trial Day Tools</div>
                <div className="stf-welcome-sub">
                  {me.cities.length > 0 ? `City: ${me.cities.map((c) => c.toUpperCase()).join(", ")}` : "All cities"} · Every action is logged.
                </div>
              </div>
              {tiles.length === 0 && (
                <div className="stf-note">Your role ({me.role}) has no trial-day tools. Contact the admin.</div>
              )}
              <div className="stf-tiles">
                {tiles.map((t) => (
                  <button type="button" key={t.id} className="stf-tile" onClick={() => setTool(t.id)}>
                    <span className="stf-tile-icon">{t.icon}</span>
                    <span className="stf-tile-label">{t.label}</span>
                    <span className="stf-tile-sub">{t.sub}</span>
                  </button>
                ))}
              </div>
            </main>
          )}
          {tool === "gate" && <GateScan />}
          {tool === "checkin" && <CheckinScan />}
          {tool === "score" && <EvalScore role={me.role} />}
          {tool === "supervisor" && <SupervisorPanel />}
        </>
      )}
    </div>
  );
}

function StaffLogin({ onDone }: { onDone: (me: StaffMe) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true); setErr(null);
    try {
      await staffLogin(email, password);
      onDone(await staffMe());
    } catch (ex) {
      setErr((ex as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="stf-center">
      <form className="stf-login" onSubmit={submit}>
        <div className="stf-login-logo">BCPL <span>T20</span></div>
        <div className="stf-login-title">Staff App Login</div>
        <div className="stf-login-sub">Authorised trial-day staff only. Every action is recorded in the audit log.</div>
        <label className="stf-field">
          <span>Email</span>
          <input type="email" inputMode="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@bcplt20.com" />
        </label>
        <label className="stf-field">
          <span>Password</span>
          <input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" />
        </label>
        {err && <div className="stf-err">{err}</div>}
        <button type="submit" className="stf-btn stf-btn-primary" disabled={busy}>{busy ? "Signing in…" : "SIGN IN"}</button>
      </form>
    </div>
  );
}

const STAFF_CSS = `
.stf-root{min-height:100vh;background:#06101E;color:#EAF2FF;font-family:Montserrat,system-ui,sans-serif;-webkit-tap-highlight-color:transparent;padding-bottom:env(safe-area-inset-bottom)}
.stf-root *{box-sizing:border-box}
.stf-center{min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px}
.stf-spin{width:42px;height:42px;border:4px solid rgba(255,255,255,.15);border-top-color:#FF7A29;border-radius:50%;animation:stfspin .8s linear infinite}
@keyframes stfspin{to{transform:rotate(360deg)}}
.stf-head{position:sticky;top:0;z-index:50;display:flex;align-items:center;gap:10px;padding:12px 14px;background:rgba(6,16,30,.94);backdrop-filter:blur(10px);border-bottom:1px solid rgba(255,255,255,.08)}
.stf-head-back{width:44px;height:44px;border-radius:12px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.05);color:#fff;font-size:22px;font-weight:900;display:flex;align-items:center;justify-content:center;cursor:pointer}
.stf-head-mid{flex:1;min-width:0}
.stf-head-title{font-size:15px;font-weight:900;letter-spacing:.08em}
.stf-head-sub{font-size:11px;color:#8FA3BF;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.stf-head-out{height:40px;padding:0 14px;border-radius:10px;border:1px solid rgba(255,255,255,.12);background:transparent;color:#8FA3BF;font-weight:800;font-size:12px;cursor:pointer}
.stf-main{padding:18px 16px 40px;max-width:520px;margin:0 auto}
.stf-welcome{margin-bottom:16px}
.stf-welcome-big{font-size:24px;font-weight:900}
.stf-welcome-sub{font-size:12px;color:#8FA3BF;font-weight:600;margin-top:4px}
.stf-tiles{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.stf-tile{display:flex;flex-direction:column;align-items:flex-start;gap:6px;padding:18px 14px;border-radius:16px;border:1px solid rgba(255,255,255,.09);background:linear-gradient(160deg,rgba(17,32,55,.95),rgba(10,20,40,.95));color:#EAF2FF;cursor:pointer;min-height:132px;text-align:left}
.stf-tile:active{transform:scale(.97)}
.stf-tile-icon{font-size:28px}
.stf-tile-label{font-size:15px;font-weight:900}
.stf-tile-sub{font-size:11px;color:#8FA3BF;font-weight:600;line-height:1.35}
.stf-note{padding:14px;border-radius:12px;background:rgba(250,204,21,.08);border:1px solid rgba(250,204,21,.25);color:#FACC15;font-size:13px;font-weight:700;margin-bottom:14px}
.stf-login{width:100%;max-width:380px;background:linear-gradient(160deg,rgba(17,32,55,.95),rgba(10,20,40,.95));border:1px solid rgba(255,255,255,.09);border-radius:20px;padding:28px 22px;display:flex;flex-direction:column;gap:14px}
.stf-login-logo{font-size:26px;font-weight:900;letter-spacing:.04em}
.stf-login-logo span{color:#FF7A29}
.stf-login-title{font-size:17px;font-weight:900}
.stf-login-sub{font-size:12px;color:#8FA3BF;font-weight:600;line-height:1.5;margin-top:-8px}
.stf-field{display:flex;flex-direction:column;gap:6px}
.stf-field span{font-size:11px;font-weight:800;letter-spacing:.06em;color:#8FA3BF;text-transform:uppercase}
.stf-field input,.stf-input{height:52px;border-radius:12px;border:1px solid rgba(255,255,255,.14);background:rgba(6,16,30,.7);color:#fff;padding:0 14px;font-size:16px;font-weight:600;outline:none;width:100%}
.stf-field input:focus,.stf-input:focus{border-color:#FF7A29}
.stf-err{padding:10px 12px;border-radius:10px;background:rgba(239,68,68,.12);border:1px solid rgba(239,68,68,.4);color:#FCA5A5;font-size:13px;font-weight:700}
.stf-btn{height:56px;border-radius:14px;border:none;font-size:15px;font-weight:900;letter-spacing:.06em;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;width:100%}
.stf-btn:disabled{opacity:.55}
.stf-btn-primary{background:#FF7A29;color:#fff}
.stf-btn-ghost{background:transparent;border:1px solid rgba(255,255,255,.16);color:#EAF2FF}
.stf-screen{padding:16px 16px 48px;max-width:520px;margin:0 auto;display:flex;flex-direction:column;gap:14px}
.stf-card{background:linear-gradient(160deg,rgba(17,32,55,.95),rgba(10,20,40,.95));border:1px solid rgba(255,255,255,.09);border-radius:16px;padding:16px}
.stf-manual{display:flex;gap:8px}
.stf-manual .stf-input{flex:1;text-transform:uppercase}
.stf-manual button{width:110px;flex:none}
.stf-result{position:fixed;inset:0;z-index:80;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:24px;text-align:center;gap:10px}
.stf-result.green{background:linear-gradient(180deg,#052e16,#14532d)}
.stf-result.yellow{background:linear-gradient(180deg,#422006,#713f12)}
.stf-result.red{background:linear-gradient(180deg,#450a0a,#7f1d1d)}
.stf-result-icon{font-size:74px;line-height:1}
.stf-result-label{font-size:26px;font-weight:900;letter-spacing:.02em}
.stf-result-sub{font-size:15px;font-weight:700;opacity:.92;max-width:340px;line-height:1.5}
.stf-result-trial{margin-top:8px;font-size:34px;font-weight:900;letter-spacing:.04em}
.stf-result-meta{font-size:14px;font-weight:800;opacity:.9}
.stf-result .stf-btn{max-width:340px;margin-top:18px}
.stf-chip{display:inline-flex;align-items:center;gap:6px;padding:6px 12px;border-radius:999px;background:rgba(255,122,41,.15);border:1px solid rgba(255,122,41,.4);color:#FFB380;font-size:12px;font-weight:900;letter-spacing:.05em;text-transform:uppercase}
.stf-kv{display:flex;justify-content:space-between;padding:9px 0;border-bottom:1px dashed rgba(255,255,255,.09);font-size:14px}
.stf-kv:last-child{border-bottom:none}
.stf-kv b{font-weight:900}
.stf-kv span{color:#8FA3BF;font-weight:700}
.stf-h2{font-size:16px;font-weight:900;letter-spacing:.02em}
.stf-sub{font-size:12px;color:#8FA3BF;font-weight:600;line-height:1.5}
.stf-dots{display:flex;gap:8px;flex-wrap:wrap}
.stf-dot{width:44px;height:44px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:900;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);color:#5B7089}
.stf-dot.done{background:rgba(34,197,94,.15);border-color:rgba(34,197,94,.5);color:#4ADE80}
.stf-dot.zero{background:rgba(239,68,68,.12);border-color:rgba(239,68,68,.45);color:#FCA5A5}
.stf-outcomes{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.stf-outcome{min-height:60px;border-radius:14px;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.05);color:#EAF2FF;font-size:14px;font-weight:900;letter-spacing:.03em;cursor:pointer;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;padding:8px}
.stf-outcome small{font-size:10px;font-weight:700;color:#8FA3BF;letter-spacing:.05em}
.stf-outcome:active{transform:scale(.96)}
.stf-outcome.hit{border-color:rgba(34,197,94,.55)}
.stf-outcome.near{border-color:rgba(250,204,21,.55)}
.stf-outcome.miss{border-color:rgba(239,68,68,.5)}
.stf-outcome.feeder{grid-column:1/-1;background:rgba(148,163,184,.08);border-style:dashed;min-height:50px}
.stf-row{display:flex;gap:10px;align-items:center}
.stf-dim{padding:12px 0;border-bottom:1px dashed rgba(255,255,255,.09)}
.stf-dim:last-child{border-bottom:none}
.stf-dim-top{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:8px}
.stf-dim-name{font-size:14px;font-weight:900}
.stf-dim-w{font-size:11px;color:#8FA3BF;font-weight:700}
.stf-step{display:flex;align-items:center;gap:12px}
.stf-step button{width:56px;height:52px;border-radius:12px;border:1px solid rgba(255,255,255,.16);background:rgba(255,255,255,.06);color:#fff;font-size:24px;font-weight:900;cursor:pointer;flex:none}
.stf-step button:active{transform:scale(.94)}
.stf-step-val{flex:1;text-align:center}
.stf-step-num{font-size:26px;font-weight:900}
.stf-step-anchor{font-size:10.5px;color:#8FA3BF;font-weight:700;line-height:1.3;margin-top:2px}
.stf-total{position:sticky;bottom:0;background:rgba(6,16,30,.96);backdrop-filter:blur(8px);border-top:1px solid rgba(255,255,255,.1);padding:12px 0 4px;display:flex;flex-direction:column;gap:10px}
.stf-total-row{display:flex;justify-content:space-between;align-items:center;font-size:14px;font-weight:800}
.stf-total-big{font-size:26px;font-weight:900;color:#FF7A29}
.stf-modal{position:fixed;inset:0;z-index:90;background:rgba(2,8,18,.88);display:flex;align-items:center;justify-content:center;padding:22px}
.stf-modal-card{width:100%;max-width:380px;background:linear-gradient(160deg,#122037,#0A1428);border:1px solid rgba(255,255,255,.12);border-radius:18px;padding:24px 20px;display:flex;flex-direction:column;gap:14px}
.stf-modal-title{font-size:17px;font-weight:900}
.stf-modal-body{font-size:14px;font-weight:600;line-height:1.65;color:#D7E3F4}
.stf-list-item{display:flex;flex-direction:column;gap:8px;padding:14px;border-radius:14px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.09)}
.stf-counters{display:grid;grid-template-columns:repeat(2,1fr);gap:10px}
.stf-counter{padding:14px;border-radius:14px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.09);display:flex;flex-direction:column;gap:4px}
.stf-counter b{font-size:24px;font-weight:900;color:#FF7A29}
.stf-counter span{font-size:11px;color:#8FA3BF;font-weight:700;letter-spacing:.03em}
.stf-textarea{width:100%;min-height:96px;border-radius:12px;border:1px solid rgba(255,255,255,.14);background:rgba(6,16,30,.7);color:#fff;padding:12px 14px;font-size:15px;font-weight:600;outline:none;font-family:inherit;resize:vertical}
.stf-textarea:focus{border-color:#FF7A29}
@media (min-width:560px){.stf-outcomes{grid-template-columns:repeat(4,1fr)}.stf-outcome.feeder{grid-column:1/-1}}
`;

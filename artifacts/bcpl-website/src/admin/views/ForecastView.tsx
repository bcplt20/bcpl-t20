import { useEffect, useMemo, useState } from "react";
import { getForecast, saveForecastSettings, monthLabel, type ForecastData } from "../../lib/adminToolsApi";

/* Registration forecast — actuals come straight from the database
 * (registrations + successful payments). The admin sets the goal, season
 * start date and monthly targets; projections simply carry the current
 * 14-day pace forward. It's math, not a promise. */

const card: React.CSSProperties = { background: "linear-gradient(135deg,#0D1526,#0A1020)", border: "1px solid #1E293B", borderRadius: 16, padding: 20 };
const inputStyle: React.CSSProperties = { width: "100%", padding: "9px 12px", background: "#060B18", border: "1px solid #1E293B", borderRadius: 10, color: "#F1F5F9", fontSize: 13, outline: "none" };
const labelStyle: React.CSSProperties = { fontSize: 11, fontWeight: 700, color: "#64748B", display: "block", marginBottom: 6 };
const btnPrimary: React.CSSProperties = { padding: "10px 18px", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#FF6B00,#FF8C40)", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" };

const fmtINR = (n: number) => "₹" + Math.round(n).toLocaleString("en-IN");

export default function ForecastView() {
  const [data, setData] = useState<ForecastData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [goal, setGoal] = useState("500");
  const [seasonStart, setSeasonStart] = useState("");
  const [targets, setTargets] = useState<Record<string, string>>({});
  const [newMonth, setNewMonth] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState(false);

  async function load() {
    try {
      const d = await getForecast();
      setData(d);
      setGoal(String(d.settings.goal));
      setSeasonStart(d.settings.seasonStart ?? "");
      setTargets(Object.fromEntries(Object.entries(d.settings.targets).map(([k, v]) => [k, String(v)])));
    } catch (e) {
      setError((e as Error).message);
    }
  }
  useEffect(() => { void load(); }, []);

  async function save() {
    if (saving) return;
    const goalNum = parseInt(goal, 10);
    if (!goalNum || goalNum < 1) {
      setError("Goal must be at least 1");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const cleanTargets: Record<string, number> = {};
      for (const [k, v] of Object.entries(targets)) {
        const n = parseInt(v, 10);
        if (/^\d{4}-\d{2}$/.test(k) && Number.isFinite(n) && n > 0) cleanTargets[k] = n;
      }
      await saveForecastSettings({ goal: goalNum, seasonStart: seasonStart || null, targets: cleanTargets });
      await load();
      setSavedMsg(true);
      setTimeout(() => setSavedMsg(false), 2500);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  const rows = useMemo(() => {
    if (!data) return [];
    const map = new Map(data.monthly.map(m => [m.month, m]));
    for (const k of Object.keys(targets)) {
      if (!map.has(k) && /^\d{4}-\d{2}$/.test(k)) {
        map.set(k, { month: k, registrations: 0, paidRegistrations: 0, revenue: 0 });
      }
    }
    return [...map.values()].sort((a, b) => a.month.localeCompare(b.month));
  }, [data, targets]);

  const maxBar = useMemo(() => {
    let m = 1;
    for (const r of rows) {
      m = Math.max(m, r.registrations, parseInt(targets[r.month] ?? "0", 10) || 0);
    }
    return m;
  }, [rows, targets]);

  const projection = useMemo(() => {
    if (!data) return null;
    const dailyPace = data.pace14d.registrations / 14;
    const dailyRevenue = data.pace14d.revenue / 14;
    let horizonDays = 30;
    let horizonLabel = "in the next 30 days";
    if (seasonStart) {
      const days = Math.ceil((new Date(seasonStart + "T00:00:00").getTime() - Date.now()) / 86_400_000);
      if (days > 0) {
        horizonDays = days;
        horizonLabel = `by season start (${days} days left)`;
      }
    }
    const goalNum = parseInt(goal, 10) || data.settings.goal;
    const scenarios = [
      { name: "Slower (×0.7)", mult: 0.7, color: "#94A3B8" },
      { name: "Current pace", mult: 1, color: "#FF8C40" },
      { name: "Faster (×1.3)", mult: 1.3, color: "#22C55E" },
    ].map(s => {
      const projected = Math.round(data.totals.registrations + dailyPace * horizonDays * s.mult);
      return { ...s, projected, gap: projected - goalNum, revenue: data.totals.revenue + dailyRevenue * horizonDays * s.mult };
    });
    return { dailyPace, horizonDays, horizonLabel, goalNum, scenarios };
  }, [data, seasonStart, goal]);

  if (!data) {
    return (
      <div style={{ ...card, textAlign: "center", color: "#64748B", fontSize: 13 }}>
        {error ? `Could not load forecast: ${error}` : "Loading live numbers…"}
      </div>
    );
  }

  const goalNum = parseInt(goal, 10) || data.settings.goal;
  const progressPct = Math.min(100, (data.totals.registrations / goalNum) * 100);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#F1F5F9" }}>Registration Forecast</div>
          <div style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}>
            Actuals are live from the database. Projections carry your current 14-day pace forward — math, not a promise.
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {savedMsg && <span style={{ fontSize: 12, color: "#22C55E", fontWeight: 700 }}>✓ Saved</span>}
          <button onClick={() => void save()} disabled={saving} style={{ ...btnPrimary, opacity: saving ? 0.6 : 1 }}>
            {saving ? "Saving…" : "Save Goal & Targets"}
          </button>
        </div>
      </div>

      {error && (
        <div style={{ background: "#EF444422", border: "1px solid #EF4444", borderRadius: 10, padding: "10px 14px", color: "#FCA5A5", fontSize: 13, display: "flex", justifyContent: "space-between", gap: 10 }}>
          <span>{error}</span>
          <button onClick={() => setError(null)} style={{ background: "none", border: "none", color: "#FCA5A5", cursor: "pointer" }}>✕</button>
        </div>
      )}

      {/* Live stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
        {[
          { label: "Total registrations", value: String(data.totals.registrations), sub: "all time", color: "#F1F5F9" },
          { label: "Paid registrations", value: String(data.totals.paidRegistrations), sub: "successful Phase-1 payments", color: "#22C55E" },
          { label: "Revenue collected", value: fmtINR(data.totals.revenue), sub: "Phase 1 + Phase 2", color: "#FF8C40" },
          { label: "Last 14 days", value: String(data.pace14d.registrations), sub: `new registrations · ${fmtINR(data.pace14d.revenue)}`, color: "#3B82F6" },
        ].map(s => (
          <div key={s.label} style={{ ...card, padding: 16 }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 4, fontWeight: 700 }}>{s.label}</div>
            <div style={{ fontSize: 10, color: "#475569", marginTop: 2 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Goal + progress */}
      <div style={card}>
        <div style={{ display: "grid", gridTemplateColumns: "160px 200px 1fr", gap: 16, alignItems: "end" }}>
          <div>
            <label style={labelStyle}>SEASON GOAL (registrations)</label>
            <input type="number" min={1} value={goal} onChange={e => setGoal(e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>SEASON START DATE (optional)</label>
            <input type="date" value={seasonStart} onChange={e => setSeasonStart(e.target.value)} style={inputStyle} />
          </div>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#94A3B8", marginBottom: 6 }}>
              <span style={{ fontWeight: 700 }}>Progress to goal</span>
              <span>{data.totals.registrations} / {goalNum} ({progressPct.toFixed(1)}%)</span>
            </div>
            <div style={{ height: 10, borderRadius: 5, background: "#1E293B", overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${progressPct}%`, background: "linear-gradient(90deg,#FF6B00,#FF8C40)", transition: "width .3s" }} />
            </div>
          </div>
        </div>
      </div>

      {/* Monthly actuals + targets */}
      <div style={card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, gap: 10, flexWrap: "wrap" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#F1F5F9" }}>Month by month — actual vs your target</div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input type="month" value={newMonth} onChange={e => setNewMonth(e.target.value)} style={{ ...inputStyle, width: 160, padding: "7px 10px" }} />
            <button
              onClick={() => {
                if (/^\d{4}-\d{2}$/.test(newMonth) && !(newMonth in targets)) {
                  setTargets(t => ({ ...t, [newMonth]: "" }));
                  setNewMonth("");
                }
              }}
              style={{ ...btnPrimary, padding: "8px 14px", fontSize: 12 }}>
              + Add target month
            </button>
          </div>
        </div>
        {rows.length === 0 ? (
          <div style={{ fontSize: 12, color: "#475569" }}>No registrations yet — data appears here as players sign up.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "grid", gridTemplateColumns: "90px 1fr 70px 70px 110px 90px", gap: 10, fontSize: 10, fontWeight: 800, color: "#475569" }}>
              <span>MONTH</span><span>REGISTRATIONS</span><span style={{ textAlign: "right" }}>TOTAL</span>
              <span style={{ textAlign: "right" }}>PAID</span><span style={{ textAlign: "right" }}>REVENUE</span><span style={{ textAlign: "right" }}>TARGET</span>
            </div>
            {rows.map(r => {
              const t = parseInt(targets[r.month] ?? "0", 10) || 0;
              const hit = t > 0 && r.registrations >= t;
              return (
                <div key={r.month} style={{ display: "grid", gridTemplateColumns: "90px 1fr 70px 70px 110px 90px", gap: 10, alignItems: "center" }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#94A3B8" }}>{monthLabel(r.month)}</span>
                  <div style={{ height: 14, borderRadius: 7, background: "#1E293B", overflow: "hidden", position: "relative" }}>
                    <div style={{ height: "100%", width: `${(r.registrations / maxBar) * 100}%`, background: hit ? "linear-gradient(90deg,#16A34A,#22C55E)" : "linear-gradient(90deg,#FF6B00,#FF8C40)" }} />
                    {t > 0 && (
                      <div title={`Target: ${t}`} style={{ position: "absolute", top: 0, bottom: 0, left: `${Math.min(100, (t / maxBar) * 100)}%`, width: 2, background: "#F1F5F9AA" }} />
                    )}
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 800, color: "#F1F5F9", textAlign: "right" }}>{r.registrations}</span>
                  <span style={{ fontSize: 12, color: "#22C55E", textAlign: "right" }}>{r.paidRegistrations}</span>
                  <span style={{ fontSize: 12, color: "#FF8C40", textAlign: "right" }}>{fmtINR(r.revenue)}</span>
                  <input type="number" min={0} placeholder="—" value={targets[r.month] ?? ""}
                    onChange={e => setTargets(prev => ({ ...prev, [r.month]: e.target.value }))}
                    style={{ ...inputStyle, padding: "6px 8px", fontSize: 12, textAlign: "right" }} />
                </div>
              );
            })}
          </div>
        )}
        <div style={{ fontSize: 11, color: "#475569", marginTop: 12 }}>
          Total = all registrations that month · Paid = successful Phase-1 payments · targets are saved with the button above.
        </div>
      </div>

      {/* Projections */}
      {projection && (
        <div style={card}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#F1F5F9", marginBottom: 4 }}>
            If the current pace continues — projected total {projection.horizonLabel}
          </div>
          <div style={{ fontSize: 11, color: "#475569", marginBottom: 14 }}>
            Current pace: {projection.dailyPace.toFixed(1)} registrations/day (14-day average).
            {!seasonStart && " Set a season start date above to project until the season."}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
            {projection.scenarios.map(s => (
              <div key={s.name} style={{ border: `1px solid ${s.color}44`, borderRadius: 12, padding: 16, background: `${s.color}0A` }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: s.color, marginBottom: 8 }}>{s.name}</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: "#F1F5F9" }}>{s.projected}</div>
                <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 2 }}>registrations · {fmtINR(s.revenue)} revenue</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: s.gap >= 0 ? "#22C55E" : "#FCA5A5", marginTop: 8 }}>
                  {s.gap >= 0 ? `✓ Goal +${s.gap}` : `${Math.abs(s.gap)} short of the ${projection.goalNum} goal`}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

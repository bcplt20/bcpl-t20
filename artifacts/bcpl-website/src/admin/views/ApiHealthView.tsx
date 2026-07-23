/**
 * API Health — Stage 5 (SUPER_ADMIN "api_health" view).
 * Shows every third-party integration (configured? last activity? live
 * probe result), background job heartbeats and the AI evaluation queue.
 */
import { useState, useEffect, useCallback } from "react";
import { adminGetApiHealth } from "../../lib/api";
import type { HealthIntegration, HealthJob } from "../../lib/api";

type Health = {
  checkedAt: string; probed: boolean; uptimeSec: number;
  integrations: HealthIntegration[]; jobs: HealthJob[]; queues: Record<string, number>;
};

const card: React.CSSProperties = { background:"linear-gradient(135deg,#0D1526 0%,#0A1020 100%)", border:"1px solid #1E293B", borderRadius:16, padding:20 };

function ago(iso: string | null | undefined): string {
  if (!iso) return "no activity recorded";
  const ms = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(ms)) return String(iso);
  if (ms < 0) return "just now";
  const m = Math.floor(ms / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 48) return `${h} hr ago`;
  return `${Math.floor(h / 24)} days ago`;
}

function fmtUptime(sec: number): string {
  if (sec < 3600) return `${Math.floor(sec / 60)} min`;
  if (sec < 86400) return `${Math.floor(sec / 3600)} hr ${Math.floor((sec % 3600) / 60)} min`;
  return `${Math.floor(sec / 86400)} d ${Math.floor((sec % 86400) / 3600)} hr`;
}

function fmtInterval(ms: number | null): string {
  if (!ms) return "on demand";
  if (ms >= 3600_000) return `every ${Math.round(ms / 3600_000)} hr`;
  if (ms >= 60_000) return `every ${Math.round(ms / 60_000)} min`;
  return `every ${Math.round(ms / 1000)} s`;
}

/** Tolerate either a {status: count} object or an array of rows. */
function normQueues(q: unknown): { label: string; count: number }[] {
  if (Array.isArray(q)) {
    return q.map((r) => ({ label: String((r as any)?.status ?? "?"), count: Number((r as any)?.count ?? 0) }));
  }
  if (q && typeof q === "object") {
    return Object.entries(q as Record<string, unknown>).map(([k, v]) => ({ label: k, count: Number(v ?? 0) }));
  }
  return [];
}

export default function ApiHealthView() {
  const [data,     setData]    = useState<Health | null>(null);
  const [err,      setErr]     = useState("");
  const [loading,  setLoading] = useState(true);
  const [probing,  setProbing] = useState(false);

  const load = useCallback(async (probe: boolean) => {
    if (probe) setProbing(true); else setLoading(true);
    try {
      const d = await adminGetApiHealth(probe);
      setData(d as unknown as Health);
      setErr("");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not load health data");
    } finally {
      setLoading(false); setProbing(false);
    }
  }, []);

  useEffect(() => { load(false); }, [load]);

  const queues = normQueues(data?.queues);
  const jobStale = (j: HealthJob) =>
    j.intervalMs && j.lastRunAt ? (Date.now() - new Date(j.lastRunAt).getTime()) > 2 * j.intervalMs : false;

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:18 }}>

      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:12 }}>
        <div>
          <div style={{ fontSize:20, fontWeight:800, color:"#F1F5F9" }}>API Health</div>
          <div style={{ fontSize:12, color:"#64748B", marginTop:3 }}>
            Third-party integrations, background jobs and the AI evaluation queue
            {data ? <> · server up {fmtUptime(data.uptimeSec)} · checked {ago(data.checkedAt)}</> : null}
          </div>
        </div>
        <div style={{ display:"flex", gap:8 }}>
          <button onClick={()=>load(false)} disabled={loading||probing}
            style={{ padding:"9px 16px", borderRadius:10, border:"1px solid #1E293B", background:"transparent", color:"#94A3B8", fontSize:12, fontWeight:700, cursor:"pointer" }}>
            ↻ Refresh
          </button>
          <button onClick={()=>load(true)} disabled={loading||probing}
            title="Sends one tiny live request to Brevo and Gemini to confirm the keys really work"
            style={{ padding:"9px 16px", borderRadius:10, border:"none", background:"linear-gradient(135deg,#FF6B00,#FF8C40)", color:"#fff", fontSize:12, fontWeight:800, cursor:probing?"wait":"pointer", opacity:probing?0.7:1 }}>
            {probing ? "Probing…" : "Run Live Probe"}
          </button>
        </div>
      </div>

      {err && (
        <div style={{ padding:"10px 14px", borderRadius:10, background:"#EF444418", border:"1px solid #EF444440", color:"#EF4444", fontSize:12 }}>
          {err}
        </div>
      )}
      {loading && !data && (
        <div style={{ ...card, textAlign:"center", color:"#475569", fontSize:12, padding:40 }}>Loading health data…</div>
      )}

      {data && (
        <>
          {/* Integrations */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))", gap:12 }}>
            {data.integrations.map(it => {
              const probeOk = it.probe ? it.probe.ok : null;
              const border = it.configured ? (probeOk === false ? "#EF4444" : "#10B981") : "#EF4444";
              return (
                <div key={it.id} style={{ ...card, borderTop:`3px solid ${border}`, display:"flex", flexDirection:"column", gap:8 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", gap:8 }}>
                    <div style={{ fontSize:13, fontWeight:800, color:"#F1F5F9" }}>{it.name}</div>
                    <span style={{ fontSize:10, fontWeight:800, padding:"3px 9px", borderRadius:6,
                      background: it.configured ? "#10B98120" : "#EF444420",
                      color: it.configured ? "#10B981" : "#EF4444" }}>
                      {it.configured ? "● Configured" : "○ Not configured"}
                    </span>
                  </div>
                  <div style={{ fontSize:11, color:"#64748B" }}>Last activity: <span style={{ color:"#94A3B8" }}>{ago(it.lastActivityAt)}</span></div>
                  {it.probe && (
                    <div style={{ fontSize:11, padding:"6px 10px", borderRadius:8,
                      background: it.probe.ok ? "#10B98112" : "#EF444412",
                      border:`1px solid ${it.probe.ok ? "#10B98130" : "#EF444430"}`,
                      color: it.probe.ok ? "#10B981" : "#EF4444" }}>
                      Live probe: {it.probe.ok ? "OK" : "FAILED"} — {it.probe.note}
                    </div>
                  )}
                  <div style={{ fontSize:10, color:"#334155" }}>{it.note}</div>
                </div>
              );
            })}
          </div>

          {/* Background jobs */}
          <div style={card}>
            <div style={{ fontSize:14, fontWeight:800, color:"#F1F5F9", marginBottom:12 }}>Background Jobs</div>
            {data.jobs.length === 0 && (
              <div style={{ fontSize:12, color:"#475569", padding:"18px 0" }}>
                No job runs recorded yet since the server started ({fmtUptime(data.uptimeSec)} ago). Heartbeats appear after the first tick.
              </div>
            )}
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {data.jobs.map(j => {
                const bad = Boolean(j.lastError) || jobStale(j);
                return (
                  <div key={j.id} style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 14px", background:"#060B18", borderRadius:10, border:`1px solid ${bad ? "#EF444440" : "#1E293B"}`, flexWrap:"wrap" }}>
                    <span style={{ width:8, height:8, borderRadius:"50%", background: bad ? "#EF4444" : "#10B981", flexShrink:0 }}/>
                    <span style={{ fontSize:12, fontWeight:700, color:"#E2E8F0", minWidth:150 }}>{j.id}</span>
                    <span style={{ fontSize:11, color:"#64748B" }}>{fmtInterval(j.intervalMs)}</span>
                    <span style={{ fontSize:11, color:"#64748B" }}>last run: <span style={{ color:"#94A3B8" }}>{ago(j.lastRunAt)}</span></span>
                    <span style={{ fontSize:11, color:"#64748B" }}>runs: {j.runs} · fails: {j.fails}</span>
                    {jobStale(j) && <span style={{ fontSize:10, fontWeight:800, color:"#F59E0B" }}>STALE — overdue</span>}
                    {j.lastError && <span style={{ fontSize:10, color:"#EF4444", flexBasis:"100%" }}>Last error: {j.lastError}</span>}
                  </div>
                );
              })}
            </div>
          </div>

          {/* AI evaluation queue */}
          <div style={card}>
            <div style={{ fontSize:14, fontWeight:800, color:"#F1F5F9", marginBottom:12 }}>AI Evaluation Queue</div>
            {queues.length === 0 ? (
              <div style={{ fontSize:12, color:"#475569" }}>No evaluations in the pipeline.</div>
            ) : (
              <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
                {queues.map(q => (
                  <div key={q.label} style={{ padding:"10px 18px", background:"#060B18", borderRadius:10, border:"1px solid #1E293B", textAlign:"center" }}>
                    <div style={{ fontSize:20, fontWeight:800, color:"#E2E8F0", lineHeight:1 }}>{q.count}</div>
                    <div style={{ fontSize:10, color:"#64748B", marginTop:5, textTransform:"capitalize" }}>{q.label.replace(/_/g," ")}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

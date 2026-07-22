import { useState, useEffect, useCallback } from "react";
import {
  adminGetRegistrations,
  adminUpdatePhase1Status,
  adminGetStats,
} from "../../lib/api";

type Reg = {
  id: string;
  role: string;
  trialCity: string;
  phase1Status: string;
  phase2Status: string | null;
  createdAt: string;
  user: { id: string; name: string; phone: string; email: string } | null;
  payment: { status: string; amount: string; paidAt: string | null } | null;
  video: { status: string; submittedAt: string; s3Url: string | null } | null;
};

const ROLE_LABEL: Record<string, string> = {
  bat: "Batsman", bowl: "Bowler", wk: "Wicketkeeper", ar: "All-rounder",
};

const P1_STATUS_COLOR: Record<string, string> = {
  pending: "#64748B",
  payment_done: "#3B82F6",
  video_submitted: "#A855F7",
  selected: "#10B981",
  rejected: "#EF4444",
};

const P1_STATUS_LABEL: Record<string, string> = {
  pending: "Pending",
  payment_done: "Payment Done",
  video_submitted: "Video Submitted",
  selected: "Selected",
  rejected: "Rejected",
};

function Badge({ status, map, colorMap }: { status: string; map: Record<string,string>; colorMap: Record<string,string> }) {
  const color = colorMap[status] ?? "#64748B";
  return (
    <span style={{
      display:"inline-block", padding:"3px 9px", borderRadius:6,
      fontSize:10, fontWeight:800, letterSpacing:"0.03em",
      background:`${color}22`, color, border:`1px solid ${color}44`,
      whiteSpace:"nowrap",
    }}>
      {map[status] ?? status}
    </span>
  );
}

export default function Phase1RegistrationsView() {
  const [rows, setRows]         = useState<Reg[]>([]);
  const [stats, setStats]       = useState<any>(null);
  const [filter, setFilter]     = useState("all");
  const [roleF, setRoleF]       = useState("all");
  const [cityQ, setCityQ]       = useState("");
  const [search, setSearch]     = useState("");
  const [loading, setLoading]   = useState(true);
  const [err, setErr]           = useState("");
  const [acting, setActing]     = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setErr("");
    try {
      const params: Record<string, string> = {};
      if (filter !== "all") params.phase1Status = filter;
      if (roleF !== "all") params.role = roleF;
      if (cityQ.trim()) params.trialCity = cityQ.trim();
      const [{ registrations }, s] = await Promise.all([
        adminGetRegistrations(params),
        adminGetStats(),
      ]);
      setRows(registrations);
      setStats(s);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }, [filter, roleF, cityQ]);

  useEffect(() => { load(); }, [load]);

  const setPhase1Status = async (id: string, status: string) => {
    setActing(id);
    try {
      await adminUpdatePhase1Status(id, status);
      setRows(prev => prev.map(r => r.id === id ? { ...r, phase1Status: status } : r));
      if (stats) {
        // Refresh stats silently
        adminGetStats().then(setStats).catch(() => {});
      }
    } catch (e: any) {
      alert("Error: " + e.message);
    } finally {
      setActing(null);
    }
  };

  const card: React.CSSProperties = {
    background:"linear-gradient(135deg,#0D1526,#0A1020)",
    border:"1px solid #1E293B", borderRadius:16, padding:20,
  };

  const displayed = rows.filter(r => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      r.user?.name?.toLowerCase().includes(q) ||
      r.user?.phone?.includes(q) ||
      r.user?.email?.toLowerCase().includes(q) ||
      r.trialCity?.toLowerCase().includes(q)
    );
  });

  const statCards = stats?.registrations ? [
    { label:"Total Registrations", value: stats.registrations.total,         color:"#6366F1" },
    { label:"Payment Done",        value: stats.registrations.paymentDone,   color:"#3B82F6" },
    { label:"Video Submitted",     value: stats.registrations.videoSubmitted, color:"#A855F7" },
    { label:"Selected",            value: stats.registrations.selected,       color:"#10B981" },
    { label:"Rejected",            value: stats.registrations.rejected,       color:"#EF4444" },
  ] : [];

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:10 }}>
        <div>
          <div style={{ fontSize:20, fontWeight:800, color:"#F1F5F9" }}>Phase 1 Registrations</div>
          <div style={{ fontSize:12, color:"#64748B", marginTop:2 }}>
            Manage all Phase 1 registrations — review payments, videos and selection decisions
          </div>
        </div>
        <button onClick={load} style={{ padding:"9px 16px", borderRadius:9, border:"1px solid #1E293B", background:"transparent", color:"#64748B", fontSize:12, fontWeight:700, cursor:"pointer" }}>
          ↺ Refresh
        </button>
      </div>

      {/* Error */}
      {err && (
        <div style={{ padding:14, borderRadius:10, background:"#EF444415", border:"1px solid #EF444440", color:"#EF4444", fontSize:12 }}>
          ⚠ {err} — <button onClick={load} style={{ background:"none", border:"none", color:"#EF4444", cursor:"pointer", fontWeight:700, fontSize:12 }}>Retry</button>
        </div>
      )}

      {/* Stats cards */}
      {statCards.length > 0 && (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:10 }}>
          {statCards.map(s => (
            <div key={s.label} style={{ ...card, borderTop:`3px solid ${s.color}`, padding:16, cursor:"pointer" }}
              onClick={() => setFilter(
                s.label === "Total Registrations" ? "all" :
                s.label === "Payment Done" ? "payment_done" :
                s.label === "Video Submitted" ? "video_submitted" :
                s.label.toLowerCase()
              )}>
              <div style={{ fontSize:26, fontWeight:900, color:s.color }}>{loading ? "…" : s.value}</div>
              <div style={{ fontSize:10, color:"#64748B", marginTop:4, lineHeight:1.3 }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div style={{ display:"flex", gap:8, flexWrap:"wrap", alignItems:"center" }}>
        {/* Status filter */}
        <div style={{ display:"flex", gap:4 }}>
          {["all", "pending", "payment_done", "video_submitted", "selected", "rejected"].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              style={{ padding:"7px 13px", borderRadius:8, border:`1px solid ${filter===f?"#FF6B00":"#1E293B"}`, background:filter===f?"#FF6B0022":"transparent", color:filter===f?"#FF6B00":"#64748B", fontSize:11, fontWeight:700, cursor:"pointer", whiteSpace:"nowrap" }}>
              {f === "all" ? "All" : P1_STATUS_LABEL[f] ?? f}
            </button>
          ))}
        </div>
        <div style={{ flex:1 }} />
        {/* Role filter */}
        <select value={roleF} onChange={e => setRoleF(e.target.value)}
          style={{ padding:"8px 10px", borderRadius:8, border:"1px solid #1E293B", background:"#080E1C", color:"#94A3B8", fontSize:12, cursor:"pointer", outline:"none" }}>
          <option value="all">All Roles</option>
          <option value="bat">Batsman</option>
          <option value="bowl">Bowler</option>
          <option value="wk">Wicketkeeper</option>
          <option value="ar">All-rounder</option>
        </select>
        {/* City search */}
        <input value={cityQ} onChange={e => setCityQ(e.target.value)} onKeyDown={e => e.key === "Enter" && load()} placeholder="Filter by city…"
          style={{ padding:"8px 12px", borderRadius:8, border:"1px solid #1E293B", background:"#080E1C", color:"#E2E8F0", fontSize:12, outline:"none", width:140 }} />
        {/* Name/phone search */}
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name / phone…"
          style={{ padding:"8px 12px", borderRadius:8, border:"1px solid #1E293B", background:"#080E1C", color:"#E2E8F0", fontSize:12, outline:"none", width:180 }} />
      </div>

      {/* Table */}
      <div style={{ ...card, padding:0, overflow:"hidden" }}>
        {loading ? (
          <div style={{ padding:60, textAlign:"center", color:"#334155", fontSize:14 }}>Loading registrations…</div>
        ) : displayed.length === 0 ? (
          <div style={{ padding:60, textAlign:"center", color:"#334155", fontSize:14 }}>
            No registrations found{filter !== "all" ? ` with status "${P1_STATUS_LABEL[filter] ?? filter}"` : ""}
          </div>
        ) : (
          <div style={{ overflowX:"auto" }}>
            <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
              <thead>
                <tr style={{ background:"#080E1C", borderBottom:"1px solid #1E293B" }}>
                  {["Player","Contact","City","Role","Reg Date","Payment","Video","Phase 1 Status","Actions"].map(h => (
                    <th key={h} style={{ padding:"10px 12px", textAlign:"left", fontSize:10, fontWeight:700, color:"#334155", letterSpacing:"0.06em", textTransform:"uppercase", whiteSpace:"nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {displayed.map((r, i) => (
                  <tr key={r.id} style={{ borderBottom:"1px solid #0F172A", background:i%2===0?"transparent":"#0A111C" }}>
                    {/* Player */}
                    <td style={{ padding:"10px 12px" }}>
                      <div style={{ fontWeight:700, color:"#F1F5F9" }}>{r.user?.name ?? "—"}</div>
                      <div style={{ fontSize:10, color:"#475569", marginTop:1 }}>{r.id.slice(0, 8)}…</div>
                    </td>
                    {/* Contact */}
                    <td style={{ padding:"10px 12px" }}>
                      <div style={{ color:"#94A3B8" }}>{r.user?.phone ?? "—"}</div>
                      <div style={{ fontSize:10, color:"#475569" }}>{r.user?.email ?? "—"}</div>
                    </td>
                    {/* City */}
                    <td style={{ padding:"10px 12px", color:"#94A3B8", whiteSpace:"nowrap" }}>{r.trialCity ?? "—"}</td>
                    {/* Role */}
                    <td style={{ padding:"10px 12px", color:"#94A3B8", whiteSpace:"nowrap" }}>{ROLE_LABEL[r.role] ?? r.role}</td>
                    {/* Reg Date */}
                    <td style={{ padding:"10px 12px", color:"#475569", whiteSpace:"nowrap" }}>{r.createdAt ? new Date(r.createdAt).toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"numeric" }) : "—"}</td>
                    {/* Payment */}
                    <td style={{ padding:"10px 12px" }}>
                      {r.payment ? (
                        <div>
                          <Badge status={r.payment.status} map={{ pending:"Pending", success:"Paid", failed:"Failed" }} colorMap={{ pending:"#F59E0B", success:"#10B981", failed:"#EF4444" }} />
                          {r.payment.status === "success" && <div style={{ fontSize:10, color:"#475569", marginTop:2 }}>₹{r.payment.amount}</div>}
                        </div>
                      ) : <span style={{ color:"#334155", fontSize:11 }}>No payment</span>}
                    </td>
                    {/* Video */}
                    <td style={{ padding:"10px 12px" }}>
                      {r.video ? (
                        <div style={{ display:"flex", flexDirection:"column", gap:3 }}>
                          <Badge status={r.video.status} map={{ submitted:"Submitted", reviewed:"Reviewed" }} colorMap={{ submitted:"#A855F7", reviewed:"#10B981" }} />
                          {r.video.s3Url && (
                            <a href={r.video.s3Url} target="_blank" rel="noreferrer" title="Watch video in new tab"
                              style={{ fontSize:10, fontWeight:700, color:"#6366F1", textDecoration:"none", padding:"3px 8px", borderRadius:5, background:"#6366F118", border:"1px solid #6366F140", display:"inline-block", width:"fit-content" }}>▶ Watch</a>
                          )}
                        </div>
                      ) : <span style={{ color:"#334155", fontSize:11 }}>No video</span>}
                    </td>
                    {/* Phase 1 Status */}
                    <td style={{ padding:"10px 12px" }}>
                      <Badge status={r.phase1Status} map={P1_STATUS_LABEL} colorMap={P1_STATUS_COLOR} />
                    </td>
                    {/* Actions */}
                    <td style={{ padding:"10px 12px" }}>
                      <div style={{ display:"flex", gap:5 }}>
                        {r.phase1Status !== "selected" && (
                          <button
                            disabled={acting === r.id}
                            onClick={() => setPhase1Status(r.id, "selected")}
                            style={{ padding:"5px 10px", borderRadius:6, border:"1px solid #10B98140", background:"#10B98115", color:"#10B981", fontSize:10, fontWeight:700, cursor:"pointer", whiteSpace:"nowrap", opacity:acting===r.id?0.5:1 }}>
                            ✓ Select
                          </button>
                        )}
                        {r.phase1Status !== "rejected" && (
                          <button
                            disabled={acting === r.id}
                            onClick={() => setPhase1Status(r.id, "rejected")}
                            style={{ padding:"5px 10px", borderRadius:6, border:"1px solid #EF444440", background:"#EF444415", color:"#EF4444", fontSize:10, fontWeight:700, cursor:"pointer", whiteSpace:"nowrap", opacity:acting===r.id?0.5:1 }}>
                            ✗ Reject
                          </button>
                        )}
                        {(r.phase1Status === "selected" || r.phase1Status === "rejected") && (
                          <button
                            disabled={acting === r.id}
                            onClick={() => setPhase1Status(r.id, "pending")}
                            style={{ padding:"5px 10px", borderRadius:6, border:"1px solid #64748B40", background:"#64748B15", color:"#64748B", fontSize:10, fontWeight:700, cursor:"pointer", whiteSpace:"nowrap", opacity:acting===r.id?0.5:1 }}>
                            ↺ Reset
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div style={{ fontSize:11, color:"#334155", textAlign:"right" }}>
        {!loading && `${displayed.length} registration${displayed.length !== 1 ? "s" : ""} shown`}
      </div>
    </div>
  );
}

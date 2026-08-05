import { useState, useEffect, useCallback, useRef } from "react";
import {
  adminGetRegistrations,
  adminUpdatePhase1Status,
  adminGetStats,
} from "../../lib/api";

type Reg = {
  id: string;
  regNumber?: string | null;
  role: string;
  trialCity: string;
  phase1Status: string;
  phase2Status: string | null;
  createdAt: string;
  user: { id: string; name: string; phone: string; email: string } | null;
  payment: { status: string; amount: string; paidAt: string | null } | null;
  video: { status: string; submittedAt: string; s3Url: string | null } | null;
  kyc?: { id: string; status: string; panVerified: boolean; verifiedAt: string | null } | null;
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

function RegIdBadge({ regNumber }: { regNumber?: string | null }) {
  if (regNumber) {
    return (
      <span style={{ display:"inline-block", padding:"3px 9px", borderRadius:6, fontSize:11, fontWeight:800, fontFamily:"monospace", background:"#FF6B0018", color:"#FF9A57", border:"1px solid #FF6B0040", whiteSpace:"nowrap" }}>
        {regNumber}
      </span>
    );
  }
  return (
    <span title="Registration ID is assigned after Phase 1 payment" style={{ display:"inline-block", padding:"3px 9px", borderRadius:6, fontSize:10, fontWeight:700, background:"#1E293B", color:"#64748B", border:"1px solid #23324A", whiteSpace:"nowrap" }}>
      Payment pending
    </span>
  );
}

const P1_FILTERS = ["all", "pending", "payment_done", "video_submitted", "selected", "rejected"];

type NavPayload = { quick?: string; filter?: string; focusId?: string };

export default function Phase1RegistrationsView({ onNavigate, focusId, initialFilter, refreshTick = 0 }: { onNavigate?: (tab: string, payload?: NavPayload) => void; focusId?: string; initialFilter?: string; refreshTick?: number }) {
  const [rows, setRows]         = useState<Reg[]>([]);
  const [stats, setStats]       = useState<any>(null);
  const [filter, setFilter]     = useState(initialFilter && P1_FILTERS.includes(initialFilter) ? initialFilter : "all");
  const [roleF, setRoleF]       = useState("all");
  const [cityQ, setCityQ]       = useState("");
  const [search, setSearch]     = useState("");
  const [loading, setLoading]   = useState(true);
  const [err, setErr]           = useState("");
  const [acting, setActing]     = useState<string | null>(null);
  const [detail, setDetail]     = useState<Reg | null>(null);
  const [focusDone, setFocusDone] = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setErr("");
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
      if (!silent) setLoading(false);
    }
  }, [filter, roleF, cityQ]);

  useEffect(() => { load(); }, [load]);

  /* Auto-refresh (AdminShell tick): refetch in place — no spinner, no remount */
  const loadRef = useRef(load);
  loadRef.current = load;
  useEffect(() => { if (refreshTick > 0) loadRef.current(true); }, [refreshTick]);

  /* Auto-open the record another view asked us to focus (tapped reg ID) */
  useEffect(() => {
    if (focusId && !focusDone && rows.length > 0) {
      const r = rows.find(x => x.id === focusId);
      if (r) setDetail(r);
      setFocusDone(true);
    }
  }, [rows, focusId, focusDone]);

  const setPhase1Status = async (id: string, status: string) => {
    setActing(id);
    try {
      await adminUpdatePhase1Status(id, status);
      setRows(prev => prev.map(r => r.id === id ? { ...r, phase1Status: status } : r));
      setDetail(d => d && d.id === id ? { ...d, phase1Status: status } : d);
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
    <div style={{ display:"flex", gap:16, alignItems:"flex-start" }}>
    <div style={{ flex:1, minWidth:0, display:"flex", flexDirection:"column", gap:16 }}>

      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:10 }}>
        <div>
          <div style={{ fontSize:20, fontWeight:800, color:"#F1F5F9" }}>Phase 1 Registrations</div>
          <div style={{ fontSize:12, color:"#64748B", marginTop:2 }}>
            Manage all Phase 1 registrations — review payments, videos and selection decisions
          </div>
        </div>
        <button onClick={() => load()} style={{ padding:"9px 16px", borderRadius:9, border:"1px solid #1E293B", background:"transparent", color:"#64748B", fontSize:12, fontWeight:700, cursor:"pointer" }}>
          ↺ Refresh
        </button>
      </div>

      {/* Error */}
      {err && (
        <div style={{ padding:14, borderRadius:10, background:"#EF444415", border:"1px solid #EF444440", color:"#EF4444", fontSize:12 }}>
          ⚠ {err} — <button onClick={() => load()} style={{ background:"none", border:"none", color:"#EF4444", cursor:"pointer", fontWeight:700, fontSize:12 }}>Retry</button>
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
                  {["Reg ID","Player","Contact","City","Role","Reg Date","Payment","Video","Phase 1 Status","Actions"].map(h => (
                    <th key={h} style={{ padding:"10px 12px", textAlign:"left", fontSize:10, fontWeight:700, color:"#334155", letterSpacing:"0.06em", textTransform:"uppercase", whiteSpace:"nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {displayed.map((r, i) => (
                  <tr key={r.id} onClick={() => setDetail(r)} title="Tap for full details"
                    style={{ borderBottom:"1px solid #0F172A", cursor:"pointer", background:detail?.id===r.id?"#FF6B0012":(i%2===0?"transparent":"#0A111C") }}>
                    {/* Reg ID */}
                    <td style={{ padding:"10px 12px" }}>
                      <RegIdBadge regNumber={r.regNumber} />
                    </td>
                    {/* Player */}
                    <td style={{ padding:"10px 12px" }}>
                      <div style={{ fontWeight:700, color:"#F1F5F9" }}>{r.user?.name ?? "—"}</div>
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
                            <a href={r.video.s3Url} target="_blank" rel="noreferrer" title="Watch video in new tab" onClick={e => e.stopPropagation()}
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
                            onClick={e => { e.stopPropagation(); setPhase1Status(r.id, "selected"); }}
                            style={{ padding:"5px 10px", borderRadius:6, border:"1px solid #10B98140", background:"#10B98115", color:"#10B981", fontSize:10, fontWeight:700, cursor:"pointer", whiteSpace:"nowrap", opacity:acting===r.id?0.5:1 }}>
                            ✓ Select
                          </button>
                        )}
                        {r.phase1Status !== "rejected" && (
                          <button
                            disabled={acting === r.id}
                            onClick={e => { e.stopPropagation(); setPhase1Status(r.id, "rejected"); }}
                            style={{ padding:"5px 10px", borderRadius:6, border:"1px solid #EF444440", background:"#EF444415", color:"#EF4444", fontSize:10, fontWeight:700, cursor:"pointer", whiteSpace:"nowrap", opacity:acting===r.id?0.5:1 }}>
                            ✗ Reject
                          </button>
                        )}
                        {(r.phase1Status === "selected" || r.phase1Status === "rejected") && (
                          <button
                            disabled={acting === r.id}
                            onClick={e => { e.stopPropagation(); setPhase1Status(r.id, "pending"); }}
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

    {/* ── Detail drawer ── */}
    {detail && (() => {
      const fmtDT = (d?: string | null) => d ? new Date(d).toLocaleString("en-IN", { day:"2-digit", month:"short", year:"numeric", hour:"2-digit", minute:"2-digit" }) : null;
      const paid = detail.payment?.status === "success" || ["payment_done","video_submitted","selected","rejected"].includes(detail.phase1Status);
      const journey = [
        { label:"Registered", time:fmtDT(detail.createdAt), done:true },
        { label:"Phase 1 payment", time:fmtDT(detail.payment?.paidAt), done:paid },
        { label:"Video submitted", time:fmtDT(detail.video?.submittedAt), done:!!detail.video },
        { label:detail.phase1Status==="selected"?"Selected":detail.phase1Status==="rejected"?"Rejected":"Selection decision", time:null as string | null, done:["selected","rejected"].includes(detail.phase1Status) },
      ];
      const row = (label: string, value: React.ReactNode) => (
        <div key={label} style={{ display:"flex", justifyContent:"space-between", gap:10, padding:"7px 0", borderBottom:"1px solid #0F172A" }}>
          <span style={{ fontSize:11, color:"#475569", flexShrink:0 }}>{label}</span>
          <span style={{ fontSize:12, color:"#CBD5E1", textAlign:"right", wordBreak:"break-word" }}>{value}</span>
        </div>
      );
      return (
        <aside style={{ width:320, flexShrink:0, display:"flex", flexDirection:"column", gap:12 }}>
          <div style={{ ...card, position:"relative" }}>
            <button onClick={() => setDetail(null)} title="Close"
              style={{ position:"absolute", top:14, right:14, background:"none", border:"none", color:"#475569", cursor:"pointer", fontSize:17, lineHeight:1 }}>✕</button>
            <div style={{ fontSize:16, fontWeight:800, color:"#F1F5F9", paddingRight:24 }}>{detail.user?.name ?? "Unknown player"}</div>
            <div style={{ fontSize:11, color:"#64748B", marginTop:4 }}>{ROLE_LABEL[detail.role] ?? detail.role} · {detail.trialCity || "—"}</div>
            <div style={{ marginTop:10, padding:"8px 10px", background:"#080E1C", border:"1px solid #1E293B", borderRadius:8 }}>
              <div style={{ fontSize:9, fontWeight:800, color:"#475569", letterSpacing:1, marginBottom:6 }}>REGISTRATION ID</div>
              <RegIdBadge regNumber={detail.regNumber} />
              <div style={{ fontSize:9, color:"#334155", fontFamily:"monospace", wordBreak:"break-all", marginTop:6 }}>Internal: {detail.id}</div>
            </div>
            <div style={{ marginTop:10 }}>
              {row("Phone", detail.user?.phone ?? "—")}
              {row("Email", detail.user?.email ? <a href={`mailto:${detail.user.email}`} style={{ color:"#6366F1" }}>{detail.user.email}</a> : "—")}
              {row("Phase 1", <Badge status={detail.phase1Status} map={P1_STATUS_LABEL} colorMap={P1_STATUS_COLOR} />)}
              {row("Phase 2", detail.phase2Status ? <Badge status={detail.phase2Status} map={{ payment_done:"Payment Done", kyc_done:"KYC Done", selected:"Selected", rejected:"Rejected" }} colorMap={{ payment_done:"#3B82F6", kyc_done:"#A855F7", selected:"#10B981", rejected:"#EF4444" }} /> : <span style={{ color:"#334155" }}>Not started</span>)}
              {row("Payment", detail.payment ? `${detail.payment.status === "success" ? "Paid" : detail.payment.status} · ₹${detail.payment.amount}` : "No payment")}
              {row("Paid at", fmtDT(detail.payment?.paidAt) ?? "—")}
              {row("Video", detail.video ? (detail.video.s3Url ? <a href={detail.video.s3Url} target="_blank" rel="noreferrer" style={{ color:"#6366F1" }}>▶ Watch</a> : detail.video.status) : "No video")}
              {row("KYC", detail.kyc ? <Badge status={detail.kyc.status} map={{ pending:"Pending", verified:"Verified", failed:"Failed" }} colorMap={{ pending:"#F59E0B", verified:"#10B981", failed:"#EF4444" }} /> : <span style={{ color:"#334155" }}>Not submitted</span>)}
            </div>
            {detail.kyc && (
              <button onClick={() => onNavigate?.("phase2_kyc")}
                style={{ width:"100%", marginTop:12, padding:"8px 0", borderRadius:8, border:"1px solid #A855F744", background:"#A855F715", color:"#A855F7", fontSize:11, fontWeight:700, cursor:"pointer" }}>
                Open in Phase 2 · KYC
              </button>
            )}
          </div>

          <div style={{ ...card, padding:16 }}>
            <div style={{ fontSize:11, fontWeight:700, color:"#475569", marginBottom:12, textTransform:"uppercase", letterSpacing:.5 }}>Journey</div>
            {journey.map((s, i) => (
              <div key={s.label} style={{ display:"flex", gap:10, alignItems:"stretch" }}>
                <div style={{ display:"flex", flexDirection:"column", alignItems:"center", flexShrink:0 }}>
                  <div style={{ width:10, height:10, borderRadius:"50%", background:s.done?"#10B981":"#1E293B", border:`2px solid ${s.done?"#10B981":"#334155"}`, marginTop:2 }}/>
                  {i<journey.length-1 && <div style={{ width:2, flex:1, minHeight:14, background:s.done?"#10B98144":"#1E293B", marginTop:2, marginBottom:2 }}/>}
                </div>
                <div style={{ paddingBottom:i<journey.length-1?12:0 }}>
                  <div style={{ fontSize:12, fontWeight:600, color:s.done?"#CBD5E1":"#475569" }}>{s.label}</div>
                  {s.time && <div style={{ fontSize:10, color:"#475569", marginTop:2 }}>{s.time}</div>}
                </div>
              </div>
            ))}
          </div>

          <div style={{ ...card, padding:16 }}>
            <div style={{ fontSize:11, fontWeight:700, color:"#475569", marginBottom:10, textTransform:"uppercase", letterSpacing:.5 }}>Actions</div>
            <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
              {detail.phase1Status !== "selected" && (
                <button disabled={acting===detail.id} onClick={() => setPhase1Status(detail.id, "selected")}
                  style={{ flex:1, padding:"8px 0", borderRadius:8, border:"1px solid #10B98140", background:"#10B98115", color:"#10B981", fontSize:11, fontWeight:700, cursor:"pointer", opacity:acting===detail.id?0.5:1 }}>✓ Select</button>
              )}
              {detail.phase1Status !== "rejected" && (
                <button disabled={acting===detail.id} onClick={() => setPhase1Status(detail.id, "rejected")}
                  style={{ flex:1, padding:"8px 0", borderRadius:8, border:"1px solid #EF444440", background:"#EF444415", color:"#EF4444", fontSize:11, fontWeight:700, cursor:"pointer", opacity:acting===detail.id?0.5:1 }}>✗ Reject</button>
              )}
              {(detail.phase1Status === "selected" || detail.phase1Status === "rejected") && (
                <button disabled={acting===detail.id} onClick={() => setPhase1Status(detail.id, "pending")}
                  style={{ flex:1, padding:"8px 0", borderRadius:8, border:"1px solid #64748B40", background:"#64748B15", color:"#64748B", fontSize:11, fontWeight:700, cursor:"pointer", opacity:acting===detail.id?0.5:1 }}>↺ Reset</button>
              )}
            </div>
          </div>
        </aside>
      );
    })()}
    </div>
  );
}

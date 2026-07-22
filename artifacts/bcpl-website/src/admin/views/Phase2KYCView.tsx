import { useState, useEffect, useCallback } from "react";
import {
  adminGetKyc,
  adminUpdateKycStatus,
  adminGetStats,
} from "../../lib/api";

type KycRow = {
  id: string;
  registrationId: string;
  profession: string | null;
  aadhaarRef: string | null;
  panRef: string | null;
  cashfreeKycId: string | null;
  status: string;
  panVerified?: boolean;
  aadhaarVerified?: boolean;
  verifiedAt: string | null;
  createdAt: string;
  player: string;
  phone: string;
  email: string;
  role: string;
  trialCity: string;
  phase2Status: string | null;
  // Employment + emergency contact (collected on the KYC page)
  company?: string | null;
  jobTitle?: string | null;
  experience?: string | null;
  linkedin?: string | null;
  tshirtSize?: string | null;
  emergencyName?: string | null;
  emergencyRelation?: string | null;
  emergencyPhone?: string | null;
  bloodGroup?: string | null;
};

const KYC_STATUS_COLOR: Record<string, string> = {
  pending:  "#F59E0B",
  verified: "#10B981",
  failed:   "#EF4444",
};

const KYC_STATUS_LABEL: Record<string, string> = {
  pending:  "Pending",
  verified: "Verified",
  failed:   "Failed",
};

const ROLE_LABEL: Record<string, string> = {
  bat: "Batsman", bowl: "Bowler", wk: "Wicketkeeper", ar: "All-rounder",
};

function StatusBadge({ status }: { status: string }) {
  const color = KYC_STATUS_COLOR[status] ?? "#64748B";
  return (
    <span style={{
      display:"inline-block", padding:"3px 9px", borderRadius:6,
      fontSize:10, fontWeight:800,
      background:`${color}22`, color, border:`1px solid ${color}44`,
      whiteSpace:"nowrap",
    }}>
      {KYC_STATUS_LABEL[status] ?? status}
    </span>
  );
}

export default function Phase2KYCView() {
  const [rows, setRows]       = useState<KycRow[]>([]);
  const [stats, setStats]     = useState<any>(null);
  const [filter, setFilter]   = useState("all");
  const [search, setSearch]   = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr]         = useState("");
  const [acting, setActing]   = useState<string | null>(null);
  const [detail, setDetail]   = useState<KycRow | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setErr("");
    try {
      const [kycRes, s] = await Promise.all([
        adminGetKyc(filter === "all" ? undefined : filter),
        adminGetStats(),
      ]);
      setRows(kycRes.kyc);
      setStats(s);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const updateStatus = async (id: string, status: string) => {
    setActing(id);
    try {
      await adminUpdateKycStatus(id, status);
      setRows(prev => prev.map(r => r.id === id ? { ...r, status, verifiedAt: status === "verified" ? new Date().toISOString() : r.verifiedAt } : r));
      if (detail?.id === id) setDetail(d => d ? { ...d, status } : d);
      adminGetStats().then(setStats).catch(() => {});
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
    return r.player.toLowerCase().includes(q) || r.phone.includes(q) || r.email.toLowerCase().includes(q) || r.trialCity.toLowerCase().includes(q);
  });

  const kycStats = stats?.kyc;

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:10 }}>
        <div>
          <div style={{ fontSize:20, fontWeight:800, color:"#F1F5F9" }}>Phase 2 · KYC Management</div>
          <div style={{ fontSize:12, color:"#64748B", marginTop:2 }}>
            Review and approve KYC submissions from Phase 2 selected players
          </div>
        </div>
        <button onClick={load} style={{ padding:"9px 16px", borderRadius:9, border:"1px solid #1E293B", background:"transparent", color:"#64748B", fontSize:12, fontWeight:700, cursor:"pointer" }}>
          ↺ Refresh
        </button>
      </div>

      {err && (
        <div style={{ padding:14, borderRadius:10, background:"#EF444415", border:"1px solid #EF444440", color:"#EF4444", fontSize:12 }}>
          ⚠ {err} — <button onClick={load} style={{ background:"none", border:"none", color:"#EF4444", cursor:"pointer", fontWeight:700, fontSize:12 }}>Retry</button>
        </div>
      )}

      {/* Stats */}
      {kycStats && (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10 }}>
          {[
            { label:"Total KYC Records", value: kycStats.total,    color:"#6366F1" },
            { label:"Pending Review",    value: kycStats.pending,   color:"#F59E0B" },
            { label:"Verified",          value: kycStats.verified,  color:"#10B981" },
            { label:"Failed / Rejected", value: kycStats.failed,    color:"#EF4444" },
          ].map(s => (
            <div key={s.label} style={{ ...card, borderTop:`3px solid ${s.color}`, padding:16, cursor:"pointer" }}
              onClick={() => setFilter(
                s.label === "Total KYC Records" ? "all" :
                s.label === "Pending Review" ? "pending" :
                s.label === "Verified" ? "verified" : "failed"
              )}>
              <div style={{ fontSize:26, fontWeight:900, color:s.color }}>{loading ? "…" : s.value}</div>
              <div style={{ fontSize:10, color:"#64748B", marginTop:4, lineHeight:1.3 }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Filters + search */}
      <div style={{ display:"flex", gap:8, flexWrap:"wrap", alignItems:"center" }}>
        <div style={{ display:"flex", gap:4 }}>
          {["all", "pending", "verified", "failed"].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              style={{ padding:"7px 13px", borderRadius:8, border:`1px solid ${filter===f?"#FF6B00":"#1E293B"}`, background:filter===f?"#FF6B0022":"transparent", color:filter===f?"#FF6B00":"#64748B", fontSize:11, fontWeight:700, cursor:"pointer", whiteSpace:"nowrap", textTransform:"capitalize" }}>
              {f === "all" ? "All" : KYC_STATUS_LABEL[f] ?? f}
            </button>
          ))}
        </div>
        <div style={{ flex:1 }} />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search player / phone…"
          style={{ padding:"8px 12px", borderRadius:8, border:"1px solid #1E293B", background:"#080E1C", color:"#E2E8F0", fontSize:12, outline:"none", width:200 }} />
      </div>

      {/* Main content: table + detail panel */}
      <div style={{ display:"grid", gridTemplateColumns: detail ? "1fr 320px" : "1fr", gap:12 }}>

        {/* Table */}
        <div style={{ ...card, padding:0, overflow:"hidden" }}>
          {loading ? (
            <div style={{ padding:60, textAlign:"center", color:"#334155", fontSize:14 }}>Loading KYC records…</div>
          ) : displayed.length === 0 ? (
            <div style={{ padding:60, textAlign:"center", color:"#334155", fontSize:14 }}>
              No KYC records found{filter !== "all" ? ` with status "${KYC_STATUS_LABEL[filter] ?? filter}"` : ""}
            </div>
          ) : (
            <div style={{ overflowX:"auto" }}>
              <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
                <thead>
                  <tr style={{ background:"#080E1C", borderBottom:"1px solid #1E293B" }}>
                    {["Player","Phone / Email","City","Role","Profession","KYC Status","Submitted","Actions"].map(h => (
                      <th key={h} style={{ padding:"10px 12px", textAlign:"left", fontSize:10, fontWeight:700, color:"#334155", letterSpacing:"0.06em", textTransform:"uppercase", whiteSpace:"nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {displayed.map((r, i) => (
                    <tr key={r.id}
                      onClick={() => setDetail(detail?.id === r.id ? null : r)}
                      style={{ borderBottom:"1px solid #0F172A", background: detail?.id === r.id ? "#FF6B0008" : i%2===0?"transparent":"#0A111C", cursor:"pointer" }}>
                      {/* Player */}
                      <td style={{ padding:"10px 12px" }}>
                        <div style={{ fontWeight:700, color:"#F1F5F9" }}>{r.player}</div>
                        <div style={{ fontSize:10, color:"#475569", marginTop:1 }}>{r.id.slice(0,8)}…</div>
                      </td>
                      {/* Contact */}
                      <td style={{ padding:"10px 12px" }}>
                        <div style={{ color:"#94A3B8" }}>{r.phone}</div>
                        <div style={{ fontSize:10, color:"#475569" }}>{r.email}</div>
                      </td>
                      {/* City */}
                      <td style={{ padding:"10px 12px", color:"#94A3B8", whiteSpace:"nowrap" }}>{r.trialCity || "—"}</td>
                      {/* Role */}
                      <td style={{ padding:"10px 12px", color:"#94A3B8", whiteSpace:"nowrap" }}>{ROLE_LABEL[r.role] ?? r.role}</td>
                      {/* Profession */}
                      <td style={{ padding:"10px 12px", color:"#94A3B8" }}>{r.profession ?? "—"}</td>
                      {/* KYC Status */}
                      <td style={{ padding:"10px 12px" }}>
                        <StatusBadge status={r.status} />
                        {r.panVerified === false && (
                          <div style={{ fontSize:9, color:"#F59E0B", marginTop:3, fontWeight:700, whiteSpace:"nowrap" }}>
                            ⚠ PAN: manual check
                          </div>
                        )}
                      </td>
                      {/* Submitted */}
                      <td style={{ padding:"10px 12px", color:"#475569", whiteSpace:"nowrap" }}>
                        {r.createdAt ? new Date(r.createdAt).toLocaleDateString("en-IN", { day:"2-digit", month:"short" }) : "—"}
                      </td>
                      {/* Actions */}
                      <td style={{ padding:"10px 12px" }}>
                        <div style={{ display:"flex", gap:5 }}>
                          {r.status !== "verified" && (
                            <button disabled={acting===r.id} onClick={e=>{e.stopPropagation();updateStatus(r.id,"verified");}}
                              style={{ padding:"5px 10px", borderRadius:6, border:"1px solid #10B98140", background:"#10B98115", color:"#10B981", fontSize:10, fontWeight:700, cursor:"pointer", opacity:acting===r.id?0.5:1 }}>
                              ✓ Verify
                            </button>
                          )}
                          {r.status !== "failed" && (
                            <button disabled={acting===r.id} onClick={e=>{e.stopPropagation();updateStatus(r.id,"failed");}}
                              style={{ padding:"5px 10px", borderRadius:6, border:"1px solid #EF444440", background:"#EF444415", color:"#EF4444", fontSize:10, fontWeight:700, cursor:"pointer", opacity:acting===r.id?0.5:1 }}>
                              ✗ Fail
                            </button>
                          )}
                          {r.status !== "pending" && (
                            <button disabled={acting===r.id} onClick={e=>{e.stopPropagation();updateStatus(r.id,"pending");}}
                              style={{ padding:"5px 10px", borderRadius:6, border:"1px solid #64748B40", background:"#64748B15", color:"#64748B", fontSize:10, fontWeight:700, cursor:"pointer", opacity:acting===r.id?0.5:1 }}>
                              ↺
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

        {/* Detail panel */}
        {detail && (
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            <div style={{ ...card, padding:20 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:16 }}>
                <div>
                  <div style={{ fontSize:15, fontWeight:800, color:"#F1F5F9" }}>{detail.player}</div>
                  <div style={{ fontSize:11, color:"#475569", marginTop:2 }}>{ROLE_LABEL[detail.role] ?? detail.role} · {detail.trialCity || "—"}</div>
                </div>
                <button onClick={() => setDetail(null)} style={{ background:"none", border:"none", color:"#334155", cursor:"pointer", fontSize:18, padding:4 }}>×</button>
              </div>

              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                {[
                  { label:"Phone",       value: detail.phone },
                  { label:"Email",       value: detail.email },
                  { label:"Profession",  value: detail.profession ?? "Not provided" },
                  { label:"Company",     value: detail.company ?? "Not provided" },
                  { label:"Job Title",   value: detail.jobTitle ?? "Not provided" },
                  { label:"Experience",  value: detail.experience ?? "Not provided" },
                  { label:"LinkedIn",    value: detail.linkedin ?? "Not provided" },
                  { label:"T-Shirt Size", value: detail.tshirtSize ?? "Not provided" },
                  { label:"Emergency Contact", value: detail.emergencyName ? detail.emergencyName + (detail.emergencyRelation ? " (" + detail.emergencyRelation + ")" : "") : "Not provided" },
                  { label:"Emergency Phone", value: detail.emergencyPhone ?? "Not provided" },
                  { label:"Blood Group", value: detail.bloodGroup ?? "Not provided" },
                  { label:"Aadhaar Ref", value: detail.aadhaarRef ?? "Not provided" },
                  { label:"PAN Ref",     value: detail.panRef ?? "Not provided" },
                  { label:"PAN Auto-Verify", value: detail.panVerified === false ? "⚠ Needs manual check" : "✓ Verified via Cashfree" },
                  { label:"Aadhaar OTP", value: detail.aadhaarVerified ? "✓ Completed by player" : "Not completed" },
                  { label:"Cashfree ID", value: detail.cashfreeKycId ?? "Not linked" },
                  { label:"Phase 2",     value: detail.phase2Status ?? "—" },
                ].map(item => (
                  <div key={item.label} style={{ display:"flex", justifyContent:"space-between", padding:"8px 0", borderBottom:"1px solid #0F172A" }}>
                    <span style={{ fontSize:11, color:"#475569", fontWeight:600 }}>{item.label}</span>
                    <span style={{ fontSize:11, color:"#94A3B8", maxWidth:160, textAlign:"right", wordBreak:"break-all" }}>{item.value}</span>
                  </div>
                ))}
                <div style={{ display:"flex", justifyContent:"space-between", padding:"8px 0" }}>
                  <span style={{ fontSize:11, color:"#475569", fontWeight:600 }}>KYC Status</span>
                  <StatusBadge status={detail.status} />
                </div>
                {detail.verifiedAt && (
                  <div style={{ fontSize:10, color:"#475569" }}>
                    Verified: {new Date(detail.verifiedAt).toLocaleString("en-IN")}
                  </div>
                )}
              </div>

              <div style={{ display:"flex", gap:8, marginTop:20 }}>
                <button disabled={acting===detail.id || detail.status==="verified"} onClick={() => updateStatus(detail.id, "verified")}
                  style={{ flex:1, padding:11, borderRadius:10, border:"1px solid #10B98140", background:"#10B98120", color:"#10B981", fontWeight:800, fontSize:13, cursor:"pointer", opacity:(acting===detail.id||detail.status==="verified")?0.4:1 }}>
                  ✓ Verify
                </button>
                <button disabled={acting===detail.id || detail.status==="failed"} onClick={() => updateStatus(detail.id, "failed")}
                  style={{ flex:1, padding:11, borderRadius:10, border:"1px solid #EF444440", background:"#EF444420", color:"#EF4444", fontWeight:800, fontSize:13, cursor:"pointer", opacity:(acting===detail.id||detail.status==="failed")?0.4:1 }}>
                  ✗ Fail
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div style={{ fontSize:11, color:"#334155", textAlign:"right" }}>
        {!loading && `${displayed.length} KYC record${displayed.length !== 1 ? "s" : ""} shown`}
      </div>
    </div>
  );
}

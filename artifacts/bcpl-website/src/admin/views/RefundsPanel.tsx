/**
 * Refunds — Stage 5 (Finance view tab).
 * Server-backed manual refund workflow: create (never automatic) →
 * approve/reject → process (with a bank/gateway reference). Duplicate
 * successful payments are surfaced as refund candidates.
 */
import { useState, useEffect, useCallback } from "react";
import {
  adminGetRefunds, adminGetRefundCandidates, adminCreateRefund, adminRefundAction,
} from "../../lib/api";
import type { RefundRow, RefundCandidate } from "../../lib/api";

const card: React.CSSProperties = { background:"linear-gradient(135deg,#FFFFFF 0%,#FFFFFF 100%)", border:"1px solid #E2E8F0", borderRadius:16, padding:20 };
const INP: React.CSSProperties = { width:"100%", padding:"9px 12px", borderRadius:9, border:"1px solid #E2E8F0", background:"#F5F6F8", color:"#1E293B", fontSize:12, outline:"none", boxSizing:"border-box" };

const REASON_LABELS: Record<string, string> = {
  duplicate_payment:   "Duplicate payment",
  technical_issue:     "Technical issue",
  event_cancellation:  "Event cancellation",
  player_cancellation: "Player cancellation (approved)",
  other_approved:      "Other (approved by owner)",
};
const STATUS_META: Record<string, { label: string; color: string }> = {
  requested: { label:"Requested", color:"#B45309" },
  approved:  { label:"Approved",  color:"#1D4ED8" },
  processed: { label:"Processed", color:"#047857" },
  rejected:  { label:"Rejected",  color:"#DC2626" },
};

const rupees = (v: string | number) => `₹${Number(v).toLocaleString("en-IN")}`;
const when = (iso: string | null) => iso ? new Date(iso).toLocaleString("en-IN", { day:"2-digit", month:"short", hour:"2-digit", minute:"2-digit" }) : "—";

export default function RefundsPanel({ refreshTick = 0 }: { refreshTick?: number }) {
  const [rows,       setRows]       = useState<RefundRow[]>([]);
  const [reasons,    setReasons]    = useState<string[]>(Object.keys(REASON_LABELS));
  const [candidates, setCandidates] = useState<RefundCandidate[]>([]);
  const [err,        setErr]        = useState("");
  const [loading,    setLoading]    = useState(true);
  const [busyId,     setBusyId]     = useState<string | null>(null);
  const [filter,     setFilter]     = useState("all");
  const [formOpen,   setFormOpen]   = useState(false);
  const [formErr,    setFormErr]    = useState("");
  const [creating,   setCreating]   = useState(false);
  const [form,       setForm]       = useState({ regNumber:"", phase:"1", reason:"duplicate_payment", amount:"", note:"" });

  const load = useCallback(async () => {
    try {
      const [r, c] = await Promise.all([adminGetRefunds(), adminGetRefundCandidates()]);
      setRows(r.refunds);
      if (r.reasons?.length) setReasons(r.reasons);
      setCandidates(c.candidates);
      setErr("");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not load refunds");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load, refreshTick]);

  const act = async (id: string, action: "approve" | "reject" | "process") => {
    if (busyId) return;
    let refundRef: string | undefined;
    if (action === "process") {
      const v = window.prompt("Refund reference (bank UTR / Cashfree refund ID) — required:");
      if (!v || !v.trim()) return;
      refundRef = v.trim();
    }
    if (action === "reject" && !window.confirm("Reject this refund request?")) return;
    if (action === "approve" && !window.confirm("Approve this refund? It still needs processing afterwards.")) return;
    setBusyId(id);
    try {
      await adminRefundAction(id, { action, ...(refundRef ? { refundRef } : {}) });
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Action failed");
    } finally {
      setBusyId(null);
    }
  };

  const create = async () => {
    if (creating) return;
    if (!form.regNumber.trim()) { setFormErr("Registration number required (e.g. BCPL-DEL-1)"); return; }
    const amt = form.amount.trim() ? Number(form.amount) : undefined;
    if (form.amount.trim() && (!Number.isFinite(amt) || (amt as number) <= 0)) { setFormErr("Amount must be a positive number"); return; }
    setCreating(true); setFormErr("");
    try {
      await adminCreateRefund({
        regNumber: form.regNumber.trim(),
        phase: Number(form.phase),
        reason: form.reason,
        ...(amt !== undefined ? { amount: amt } : {}),
        ...(form.note.trim() ? { reasonNote: form.note.trim() } : {}),
      });
      setForm({ regNumber:"", phase:"1", reason:"duplicate_payment", amount:"", note:"" });
      setFormOpen(false);
      await load();
    } catch (e) {
      setFormErr(e instanceof Error ? e.message : "Could not create refund");
    } finally {
      setCreating(false);
    }
  };

  const filtered = filter === "all" ? rows : rows.filter(r => r.refund.status === filter);
  const totProcessed = rows.filter(r => r.refund.status === "processed").reduce((a, r) => a + Number(r.refund.amount), 0);

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:14 }}>

      {/* Stats */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12 }}>
        {[
          { l:"Total Requests",   v: rows.length,                                                c:"#F59E0B" },
          { l:"Awaiting Review",  v: rows.filter(r=>r.refund.status==="requested").length,       c:"#EF4444" },
          { l:"Processed",        v: rows.filter(r=>r.refund.status==="processed").length,       c:"#10B981" },
          { l:"Amount Refunded",  v: rupees(totProcessed),                                       c:"#6366F1" },
        ].map(s=>(
          <div key={s.l} style={{ ...card, borderTop:`3px solid ${s.c}`, padding:16 }}>
            <div style={{ fontSize:22, fontWeight:800, color:s.c }}>{s.v}</div>
            <div style={{ fontSize:11, color:"#64748B", marginTop:4 }}>{s.l}</div>
          </div>
        ))}
      </div>

      {err && (
        <div style={{ padding:"10px 14px", borderRadius:10, background:"#EF444418", border:"1px solid #EF444440", color:"#DC2626", fontSize:12 }}>{err}</div>
      )}

      {/* Duplicate-payment candidates */}
      {candidates.length > 0 && (
        <div style={{ ...card, borderLeft:"4px solid #F59E0B" }}>
          <div style={{ fontSize:13, fontWeight:800, color:"#B45309", marginBottom:4 }}>Possible duplicate payments</div>
          <div style={{ fontSize:11, color:"#64748B", marginBottom:12 }}>
            These registrations have more than one successful payment for the same phase. Refunds are never created automatically — review and raise one if genuine.
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {candidates.map(c => (
              <div key={`${c.registrationId}-${c.phase}`} style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 14px", background:"#F5F6F8", borderRadius:10, border:"1px solid #E2E8F0", flexWrap:"wrap" }}>
                <span style={{ fontFamily:"monospace", fontSize:12, color:"#1E293B", fontWeight:700 }}>{c.regNumber ?? c.registrationId.slice(0,8)}</span>
                <span style={{ fontSize:12, color:"#64748B" }}>{c.playerName ?? "—"}</span>
                <span style={{ fontSize:11, color:"#64748B" }}>Phase {c.phase} · {c.payments} payments · {rupees(c.total)}</span>
                {c.hasRefund
                  ? <span style={{ fontSize:10, fontWeight:800, color:"#047857" }}>Refund already raised</span>
                  : <button onClick={()=>{ setForm(f=>({ ...f, regNumber: c.regNumber ?? "", phase: String(c.phase), reason:"duplicate_payment" })); setFormOpen(true); }}
                      style={{ marginLeft:"auto", padding:"6px 12px", borderRadius:8, border:"1px solid #F59E0B60", background:"#F59E0B18", color:"#B45309", fontSize:11, fontWeight:700, cursor:"pointer" }}>
                      Raise refund
                    </button>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* List + create */}
      <div style={card}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14, flexWrap:"wrap", gap:10 }}>
          <div style={{ fontSize:14, fontWeight:700, color:"#1E293B" }}>Refund Requests</div>
          <div style={{ display:"flex", gap:8, alignItems:"center" }}>
            <select value={filter} onChange={e=>setFilter(e.target.value)} style={{ ...INP, width:"auto", padding:"7px 10px" } as React.CSSProperties}>
              <option value="all">All statuses</option>
              {Object.entries(STATUS_META).map(([k,v])=> <option key={k} value={k}>{v.label}</option>)}
            </select>
            <button onClick={()=>{ setFormOpen(o=>!o); setFormErr(""); }}
              style={{ padding:"8px 16px", borderRadius:9, border:"none", background:"linear-gradient(135deg,#FF6B00,#FF8C40)", color:"#fff", fontSize:12, fontWeight:800, cursor:"pointer" }}>
              {formOpen ? "Close" : "+ New Refund"}
            </button>
          </div>
        </div>

        {/* Create form */}
        {formOpen && (
          <div style={{ background:"#F5F6F8", border:"1px solid #E2E8F0", borderRadius:12, padding:16, marginBottom:14 }}>
            <div style={{ display:"grid", gridTemplateColumns:"1.2fr .6fr 1.2fr .8fr", gap:10, marginBottom:10 }}>
              <div>
                <label style={{ fontSize:10, color:"#64748B", fontWeight:700, display:"block", marginBottom:5 }}>PLAYER ID</label>
                <input value={form.regNumber} onChange={e=>{ setForm(f=>({...f,regNumber:e.target.value})); setFormErr(""); }} placeholder="BCPL-DEL-1" style={INP}/>
              </div>
              <div>
                <label style={{ fontSize:10, color:"#64748B", fontWeight:700, display:"block", marginBottom:5 }}>PHASE</label>
                <select value={form.phase} onChange={e=>setForm(f=>({...f,phase:e.target.value}))} style={INP as React.CSSProperties}>
                  <option value="1">Phase 1</option><option value="2">Phase 2</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize:10, color:"#64748B", fontWeight:700, display:"block", marginBottom:5 }}>REASON</label>
                <select value={form.reason} onChange={e=>setForm(f=>({...f,reason:e.target.value}))} style={INP as React.CSSProperties}>
                  {reasons.map(r=> <option key={r} value={r}>{REASON_LABELS[r] ?? r}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize:10, color:"#64748B", fontWeight:700, display:"block", marginBottom:5 }}>AMOUNT (₹, blank = full)</label>
                <input value={form.amount} onChange={e=>{ setForm(f=>({...f,amount:e.target.value})); setFormErr(""); }} placeholder="auto" style={INP}/>
              </div>
            </div>
            <div style={{ marginBottom:10 }}>
              <label style={{ fontSize:10, color:"#64748B", fontWeight:700, display:"block", marginBottom:5 }}>NOTE (optional)</label>
              <input value={form.note} onChange={e=>setForm(f=>({...f,note:e.target.value}))} placeholder="Why is this refund being raised?" style={INP}/>
            </div>
            {formErr && <div style={{ fontSize:11, color:"#DC2626", marginBottom:10 }}>{formErr}</div>}
            <button onClick={create} disabled={creating}
              style={{ padding:"9px 20px", borderRadius:9, border:"none", background:"linear-gradient(135deg,#FF6B00,#FF8C40)", color:"#fff", fontSize:12, fontWeight:800, cursor:creating?"wait":"pointer", opacity:creating?0.7:1 }}>
              {creating ? "Creating…" : "Create Refund Request"}
            </button>
          </div>
        )}

        {/* Rows */}
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {loading && rows.length===0 && (
            <div style={{ padding:"28px 16px", textAlign:"center", color:"#64748B", fontSize:12 }}>Loading…</div>
          )}
          {!loading && filtered.length===0 && (
            <div style={{ padding:"36px 16px", textAlign:"center", color:"#64748B", fontSize:12, background:"#F5F6F8", borderRadius:12, border:"1px dashed #E2E8F0" }}>
              No refund requests{filter!=="all" ? ` with status "${STATUS_META[filter]?.label ?? filter}"` : " yet"}.
            </div>
          )}
          {filtered.map(({ refund: r, regNumber, playerName, phone }) => {
            const meta = STATUS_META[r.status] ?? { label:r.status, color:"#64748B" };
            const busy = busyId === r.id;
            return (
              <div key={r.id} style={{ padding:16, background:"#F5F6F8", borderRadius:12, border:`1px solid ${r.status==="requested" ? "#F59E0B30" : "#E2E8F0"}` }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:10, flexWrap:"wrap" }}>
                  <div style={{ minWidth:0 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:10, flexWrap:"wrap" }}>
                      <span style={{ fontSize:13, fontWeight:700, color:"#1E293B" }}>{playerName ?? "Unknown player"}</span>
                      <span style={{ fontFamily:"monospace", fontSize:11, color:"#475569" }}>{regNumber ?? r.registrationId.slice(0,8)}</span>
                      <span style={{ fontSize:10, color:"#64748B" }}>{phone ?? ""}</span>
                    </div>
                    <div style={{ fontSize:11, color:"#64748B", marginTop:6 }}>
                      Phase {r.phase} · {REASON_LABELS[r.reason] ?? r.reason}
                      {r.reasonNote ? <> · “{r.reasonNote}”</> : null}
                    </div>
                    <div style={{ fontSize:10, color:"#64748B", marginTop:4 }}>
                      Raised {when(r.createdAt)}{r.requestedBy ? ` by ${r.requestedBy}` : ""}
                      {r.decidedAt ? <> · decided {when(r.decidedAt)}{r.decidedBy ? ` by ${r.decidedBy}` : ""}</> : null}
                      {r.processedAt ? <> · processed {when(r.processedAt)}{r.refundRef ? ` · ref ${r.refundRef}` : ""}</> : null}
                    </div>
                  </div>
                  <div style={{ display:"flex", alignItems:"center", gap:10, flexShrink:0 }}>
                    <span style={{ fontSize:15, fontWeight:800, color:"#1E293B" }}>{rupees(r.amount)}</span>
                    <span style={{ fontSize:10, fontWeight:800, padding:"3px 10px", borderRadius:6, background:`${meta.color}20`, color:meta.color }}>{meta.label}</span>
                  </div>
                </div>
                {(r.status==="requested" || r.status==="approved") && (
                  <div style={{ display:"flex", gap:8, marginTop:12 }}>
                    {r.status==="requested" && (
                      <>
                        <button disabled={busy} onClick={()=>act(r.id,"approve")}
                          style={{ padding:"7px 14px", borderRadius:8, border:"1px solid #3B82F660", background:"#3B82F618", color:"#1D4ED8", fontSize:11, fontWeight:700, cursor:"pointer" }}>
                          {busy ? "…" : "Approve"}
                        </button>
                        <button disabled={busy} onClick={()=>act(r.id,"reject")}
                          style={{ padding:"7px 14px", borderRadius:8, border:"1px solid #EF444460", background:"#EF444418", color:"#DC2626", fontSize:11, fontWeight:700, cursor:"pointer" }}>
                          Reject
                        </button>
                      </>
                    )}
                    {r.status==="approved" && (
                      <button disabled={busy} onClick={()=>act(r.id,"process")}
                        style={{ padding:"7px 14px", borderRadius:8, border:"1px solid #10B98160", background:"#10B98118", color:"#047857", fontSize:11, fontWeight:700, cursor:"pointer" }}>
                        {busy ? "…" : "Mark Processed (enter reference)"}
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect, useCallback } from "react";
import {
  listReferrals, createReferral, updateReferral, deleteReferral, referralLink,
  type ReferralStat,
} from "@/lib/marketingApi";
import { PlayerReferralsPanel } from "./PlayerReferralsView";

/* ── Shared UI helpers (match admin styling) ── */
function Modal({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "#00000088", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999 }} onClick={onClose}>
      <div style={{ background: "#0D1526", border: "1px solid #1E293B", borderRadius: 20, padding: 28, width: 520, maxHeight: "90vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ fontSize: 11, fontWeight: 700, color: "#475569", display: "block", marginBottom: 7, letterSpacing: .5, textTransform: "uppercase" }}>{label}</label>
      {children}
    </div>
  );
}
const inp: React.CSSProperties = { width: "100%", padding: "10px 12px", background: "#060B18", border: "1px solid #1E293B", borderRadius: 9, color: "#F1F5F9", fontSize: 13, outline: "none", boxSizing: "border-box" };
const card: React.CSSProperties = { background: "#0D1526", border: "1px solid #1E293B", borderRadius: 16, padding: 20 };
const btnPrimary: React.CSSProperties = { background: "#FF6B00", color: "#fff", border: "none", borderRadius: 9, padding: "10px 18px", fontSize: 13, fontWeight: 800, cursor: "pointer" };
const btnGhost: React.CSSProperties = { background: "#1E293B", color: "#CBD5E1", border: "none", borderRadius: 9, padding: "10px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer" };
const th: React.CSSProperties = { textAlign: "left", padding: "10px 12px", fontSize: 10, fontWeight: 800, color: "#475569", letterSpacing: 1, textTransform: "uppercase", borderBottom: "1px solid #1E293B", whiteSpace: "nowrap" };
const td: React.CSSProperties = { padding: "12px", fontSize: 13, color: "#E2E8F0", borderBottom: "1px solid #14203A", verticalAlign: "middle" };
const inr = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;

const blankAgent = { name: "", code: "", city: "", phone: "", email: "", commissionRate: "10", paidOut: "0" };

function CopyLink({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard?.writeText(referralLink(code)).catch(() => {});
        setCopied(true); setTimeout(() => setCopied(false), 1500);
      }}
      title={referralLink(code)}
      style={{ background: copied ? "#14532D" : "#1E293B", color: copied ? "#4ADE80" : "#93C5FD", border: "none", borderRadius: 7, padding: "5px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>
      {copied ? "✓ Copied" : "🔗 Copy"}
    </button>
  );
}

/* ═══════════════════════════════════════════════════
   Agents & Affiliates — two referral programs share this section:
   · Ground Agents (kind='agent'): added manually, commission-based.
   · Player Referrals (kind='player'): automatic personal links for every
     Phase-1-paid player, milestone rewards instead of commission. */
export default function AffiliatesView() {
  const [tab, setTab] = useState<"agents" | "players">("agents");
  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
        {([["agents", "🤝 Ground Agents"], ["players", "🏏 Player Referrals"]] as const).map(([k, label]) => (
          <button key={k} onClick={() => setTab(k)}
            style={{
              background: tab === k ? "#FF6B00" : "#0D1526",
              color: tab === k ? "#fff" : "#94A3B8",
              border: tab === k ? "1px solid #FF6B00" : "1px solid #1E293B",
              borderRadius: 9, padding: "9px 18px", fontSize: 13, fontWeight: 800, cursor: "pointer",
            }}>
            {label}
          </button>
        ))}
      </div>
      {tab === "agents" ? <AgentsPanel /> : <PlayerReferralsPanel />}
    </div>
  );
}

/* Ground agents with referral codes (kind='agent').
   Commission = attributed revenue × rate%; payouts recorded manually. */
function AgentsPanel() {
  const [agents, setAgents] = useState<ReferralStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const r = await listReferrals();
      setAgents(r.referrals.filter(x => x.kind === "agent"));
    } catch (e: any) { setError(e.message ?? "Failed to load agents"); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const [modal, setModal] = useState<null | { id?: string; form: typeof blankAgent }>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const save = async () => {
    if (!modal) return;
    const f = modal.form;
    if (!f.name.trim()) { setErr("Name is required"); return; }
    setBusy(true); setErr("");
    try {
      if (modal.id) {
        await updateReferral(modal.id, {
          name: f.name, city: f.city, phone: f.phone, email: f.email,
          commissionRate: Number(f.commissionRate) || 0,
          paidOut: Number(f.paidOut) || 0,
        });
      } else {
        await createReferral({
          name: f.name, code: f.code.trim() || undefined, kind: "agent", platform: "Offline",
          city: f.city || undefined, phone: f.phone || undefined, email: f.email || undefined,
          commissionRate: Number(f.commissionRate) || 0,
        });
      }
      setModal(null); load();
    } catch (e: any) { setErr(e.message ?? "Save failed"); }
    finally { setBusy(false); }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this agent? (Agents with signups can only be deactivated)")) return;
    try { await deleteReferral(id); setModal(null); load(); }
    catch (e: any) { setErr(e.message ?? "Delete failed"); }
  };

  if (loading) return <div style={{ color: "#64748B", padding: 40, fontSize: 14 }}>Loading agents…</div>;
  if (error) return (
    <div style={{ padding: 40 }}>
      <div style={{ color: "#FCA5A5", fontSize: 14, marginBottom: 14 }}>⚠ {error}</div>
      <button style={btnGhost} onClick={load}>Retry</button>
    </div>
  );

  const totals = agents.reduce(
    (a, r) => ({
      signups: a.signups + r.signups,
      paid: a.paid + r.paid,
      revenue: a.revenue + r.revenue,
      commission: a.commission + r.commission,
      paidOut: a.paidOut + r.paidOut,
    }),
    { signups: 0, paid: 0, revenue: 0, commission: 0, paidOut: 0 },
  );
  const outstanding = Math.max(0, totals.commission - totals.paidOut);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ fontSize: 12, color: "#64748B" }}>
          Ground agents get a personal link <span style={{ color: "#93C5FD", fontFamily: "monospace" }}>bcplt20.com/r/CODE</span>. Signups, payments and commission are tracked from real registrations.
        </div>
        <button style={btnPrimary} onClick={() => { setErr(""); setModal({ form: { ...blankAgent } }); }}>+ New Agent</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 14, marginBottom: 20 }}>
        {[
          { label: "Agents", value: `${agents.filter(a => a.active).length} active`, sub: `${agents.length} total` },
          { label: "Signups", value: String(totals.signups), sub: `${totals.paid} paid` },
          { label: "Attributed Revenue", value: inr(totals.revenue), sub: "from agent links" },
          { label: "Commission Earned", value: inr(totals.commission), sub: "as per each agent's rate" },
          { label: "Outstanding", value: inr(outstanding), sub: `${inr(totals.paidOut)} already paid out` },
        ].map(k => (
          <div key={k.label} style={card}>
            <div style={{ fontSize: 10, fontWeight: 800, color: "#475569", letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>{k.label}</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: "#F1F5F9" }}>{k.value}</div>
            <div style={{ fontSize: 11, color: "#64748B", marginTop: 4 }}>{k.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ ...card, padding: 0, overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr>
            <th style={th}>Agent</th><th style={th}>Code</th><th style={th}>Link</th><th style={th}>City</th>
            <th style={th}>Rate</th><th style={th}>Clicks</th><th style={th}>Signups</th><th style={th}>Paid</th>
            <th style={th}>Revenue</th><th style={th}>Commission</th><th style={th}>Paid Out</th><th style={th}>Due</th>
            <th style={th}>Status</th><th style={th}></th>
          </tr></thead>
          <tbody>
            {agents.length === 0 && (
              <tr><td style={{ ...td, color: "#475569", textAlign: "center", padding: 30 }} colSpan={14}>
                No agents yet — add your first ground agent.
              </td></tr>
            )}
            {agents.map(a => {
              const due = Math.max(0, a.commission - a.paidOut);
              return (
                <tr key={a.id}>
                  <td style={{ ...td, fontWeight: 700 }}>
                    {a.name}
                    <div style={{ fontSize: 11, color: "#64748B", fontWeight: 400, marginTop: 2 }}>{[a.phone, a.email].filter(Boolean).join(" · ") || "—"}</div>
                  </td>
                  <td style={{ ...td, fontFamily: "monospace", fontWeight: 800, color: "#FF9A57" }}>{a.code}</td>
                  <td style={td}><CopyLink code={a.code} /></td>
                  <td style={td}>{a.city || "—"}</td>
                  <td style={td}>{a.commissionRate}%</td>
                  <td style={td}>{a.clicks}</td>
                  <td style={{ ...td, fontWeight: 800 }}>{a.signups}</td>
                  <td style={{ ...td, color: "#4ADE80", fontWeight: 800 }}>{a.paid}</td>
                  <td style={td}>{inr(a.revenue)}</td>
                  <td style={{ ...td, fontWeight: 700 }}>{inr(a.commission)}</td>
                  <td style={td}>{inr(a.paidOut)}</td>
                  <td style={{ ...td, color: due > 0 ? "#FBBF24" : "#475569", fontWeight: 800 }}>{inr(due)}</td>
                  <td style={td}>
                    <button onClick={() => updateReferral(a.id, { active: !a.active }).then(load).catch(() => {})}
                      style={{ background: a.active ? "#14532D" : "#1E293B", color: a.active ? "#4ADE80" : "#64748B", border: "none", borderRadius: 20, padding: "4px 12px", fontSize: 11, fontWeight: 800, cursor: "pointer" }}>
                      {a.active ? "ACTIVE" : "PAUSED"}
                    </button>
                  </td>
                  <td style={td}>
                    <button onClick={() => { setErr(""); setModal({ id: a.id, form: { name: a.name, code: a.code, city: a.city ?? "", phone: a.phone ?? "", email: a.email ?? "", commissionRate: String(a.commissionRate), paidOut: String(a.paidOut) } }); }}
                      style={{ background: "transparent", color: "#64748B", border: "none", cursor: "pointer", fontSize: 15 }}>✎</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {modal && (
        <Modal onClose={() => setModal(null)}>
          <div style={{ fontSize: 16, fontWeight: 800, color: "#F1F5F9", marginBottom: 18 }}>{modal.id ? "Edit Agent" : "New Agent"}</div>
          <Field label="Name *"><input style={inp} value={modal.form.name} onChange={e => setModal({ ...modal, form: { ...modal.form, name: e.target.value } })} placeholder="e.g. Suresh Kumar" /></Field>
          {!modal.id ? (
            <Field label="Code (optional — auto-generated from name)">
              <input style={{ ...inp, fontFamily: "monospace", textTransform: "uppercase" }} value={modal.form.code} onChange={e => setModal({ ...modal, form: { ...modal.form, code: e.target.value.toUpperCase() } })} placeholder="SURESH" />
            </Field>
          ) : (
            <Field label="Code (locked — link may already be shared)">
              <input style={{ ...inp, fontFamily: "monospace", opacity: .5 }} value={modal.form.code} disabled />
            </Field>
          )}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="City"><input style={inp} value={modal.form.city} onChange={e => setModal({ ...modal, form: { ...modal.form, city: e.target.value } })} /></Field>
            <Field label="Phone"><input style={inp} value={modal.form.phone} onChange={e => setModal({ ...modal, form: { ...modal.form, phone: e.target.value } })} /></Field>
          </div>
          <Field label="Email"><input style={inp} value={modal.form.email} onChange={e => setModal({ ...modal, form: { ...modal.form, email: e.target.value } })} /></Field>
          <Field label="Commission % (of attributed revenue)"><input style={inp} type="number" min={0} max={100} value={modal.form.commissionRate} onChange={e => setModal({ ...modal, form: { ...modal.form, commissionRate: e.target.value } })} /></Field>
          {modal.id && (
            <Field label="Total Paid Out (₹) — update after each payout">
              <input style={inp} type="number" min={0} value={modal.form.paidOut} onChange={e => setModal({ ...modal, form: { ...modal.form, paidOut: e.target.value } })} />
            </Field>
          )}
          {err && <div style={{ fontSize: 12, color: "#FCA5A5", marginBottom: 10 }}>⚠ {err}</div>}
          <div style={{ display: "flex", gap: 10, justifyContent: "space-between", marginTop: 6 }}>
            <div>{modal.id && <button style={{ ...btnGhost, color: "#FCA5A5" }} onClick={() => remove(modal.id!)}>Delete</button>}</div>
            <div style={{ display: "flex", gap: 10 }}>
              <button style={btnGhost} onClick={() => setModal(null)}>Cancel</button>
              <button style={btnPrimary} onClick={save} disabled={busy}>{busy ? "Saving…" : "Save"}</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

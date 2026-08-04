import { useState, useEffect, useCallback } from "react";
import { referralLink } from "@/lib/marketingApi";
import {
  adminReferralOverview, adminListTiers, adminCreateTier, adminUpdateTier,
  adminDeleteTier, adminMarkRewardGiven, adminUnmarkRewardGiven,
  type ReferralOverview, type RewardTier,
} from "@/lib/referralProgramApi";

/* ── Local UI helpers (match admin styling; duplicated to stay self-contained) ── */
function Modal({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "#00000088", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999 }} onClick={onClose}>
      <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 20, padding: 28, width: 520, maxHeight: "90vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
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
const inp: React.CSSProperties = { width: "100%", padding: "10px 12px", background: "#F5F6F8", border: "1px solid #E2E8F0", borderRadius: 9, color: "#1E293B", fontSize: 13, outline: "none", boxSizing: "border-box" };
const card: React.CSSProperties = { background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 16, padding: 20 };
const btnPrimary: React.CSSProperties = { background: "#FF6B00", color: "#fff", border: "none", borderRadius: 9, padding: "10px 18px", fontSize: 13, fontWeight: 800, cursor: "pointer" };
const btnGhost: React.CSSProperties = { background: "#FFFFFF", color: "#1E293B", border: "none", borderRadius: 9, padding: "10px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer" };
const th: React.CSSProperties = { textAlign: "left", padding: "10px 12px", fontSize: 10, fontWeight: 800, color: "#475569", letterSpacing: 1, textTransform: "uppercase", borderBottom: "1px solid #E2E8F0", whiteSpace: "nowrap" };
const td: React.CSSProperties = { padding: "12px", fontSize: 13, color: "#1E293B", borderBottom: "1px solid #E2E8F0", verticalAlign: "middle" };

function CopyLink({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard?.writeText(referralLink(code)).catch(() => {});
        setCopied(true); setTimeout(() => setCopied(false), 1500);
      }}
      title={referralLink(code)}
      style={{ background: copied ? "#14532D" : "#E2E8F0", color: copied ? "#15803D" : "#93C5FD", border: "none", borderRadius: 7, padding: "5px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>
      {copied ? "✓ Copied" : "🔗 Copy"}
    </button>
  );
}

/* ═══════════════════════════════════════════════════
   Player referral program: every Phase-1-paid player automatically gets a
   personal link. Admin sets the milestone reward ladder and records which
   rewards were physically handed out. "Paid" is computed from real Phase-1
   payments — no manual counting. */
export function PlayerReferralsPanel() {
  const [overview, setOverview] = useState<ReferralOverview | null>(null);
  const [tiers, setTiers] = useState<RewardTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const [ov, tr] = await Promise.all([adminReferralOverview(), adminListTiers()]);
      setOverview(ov);
      setTiers(tr.tiers);
    } catch (e: any) { setError(e.message ?? "Failed to load referral program"); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  /* Tier editor modal */
  const [modal, setModal] = useState<null | { id?: string; threshold: string; reward: string }>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const saveTier = async () => {
    if (!modal) return;
    const threshold = Number(modal.threshold);
    if (!Number.isInteger(threshold) || threshold < 1) { setErr("Referral count must be a whole number ≥ 1"); return; }
    if (!modal.reward.trim()) { setErr("Reward description is required"); return; }
    setBusy(true); setErr("");
    try {
      if (modal.id) await adminUpdateTier(modal.id, { threshold, reward: modal.reward.trim() });
      else await adminCreateTier({ threshold, reward: modal.reward.trim() });
      setModal(null); load();
    } catch (e: any) { setErr(e.message ?? "Save failed"); }
    finally { setBusy(false); }
  };

  const removeTier = async (id: string) => {
    if (!confirm("Delete this reward tier? Already-given rewards stay recorded.")) return;
    try { await adminDeleteTier(id); setModal(null); load(); }
    catch (e: any) { setErr(e.message ?? "Delete failed"); }
  };

  /* Reward given/not-given toggle */
  const [togglingKey, setTogglingKey] = useState("");
  const toggleGrant = async (code: string, name: string, threshold: number, reward: string, given: boolean) => {
    const q = given
      ? `Un-mark "${reward}" for ${name}? (Use this only if it was recorded by mistake)`
      : `Mark "${reward}" as GIVEN to ${name}?`;
    if (!confirm(q)) return;
    setTogglingKey(`${code}:${threshold}`);
    try {
      if (given) await adminUnmarkRewardGiven(code, threshold);
      else await adminMarkRewardGiven(code, threshold);
      await load();
    } catch (e: any) { alert(e.message ?? "Update failed"); }
    finally { setTogglingKey(""); }
  };

  if (loading) return <div style={{ color: "#64748B", padding: 40, fontSize: 14 }}>Loading player referrals…</div>;
  if (error || !overview) return (
    <div style={{ padding: 40 }}>
      <div style={{ color: "#DC2626", fontSize: 14, marginBottom: 14 }}>⚠ {error || "Failed to load"}</div>
      <button style={btnGhost} onClick={load}>Retry</button>
    </div>
  );

  const t = overview.totals;

  return (
    <div>
      <div style={{ fontSize: 12, color: "#64748B", marginBottom: 16 }}>
        Every player who completes Phase 1 registration automatically gets a personal link (<span style={{ color: "#1D4ED8", fontFamily: "monospace" }}>bcplt20.com/r/CODE</span>) on their dashboard &amp; payment receipt. Only <b style={{ color: "#64748B" }}>paid</b> friend registrations count toward milestones — free signups can't be farmed.
      </div>

      {/* Stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 14, marginBottom: 20 }}>
        {[
          { label: "Player Referrers", value: String(t.referrers), sub: `${t.activeReferrers} with ≥1 paid referral` },
          { label: "Friends Joined", value: String(t.joined), sub: "registrations via player links" },
          { label: "Paid Referrals", value: String(t.paid), sub: "completed Phase 1 registration" },
          { label: "Rewards Given", value: String(t.rewardsGiven), sub: `${t.rewardsDue} due — hand out & mark below` },
        ].map(k => (
          <div key={k.label} style={card}>
            <div style={{ fontSize: 10, fontWeight: 800, color: "#475569", letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>{k.label}</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: "#1E293B" }}>{k.value}</div>
            <div style={{ fontSize: 11, color: "#64748B", marginTop: 4 }}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Reward ladder editor */}
      <div style={{ ...card, marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: "#1E293B" }}>🎁 Reward Ladder</div>
            <div style={{ fontSize: 11, color: "#64748B", marginTop: 3 }}>Players see this ladder on their dashboard. Edits apply instantly to everyone.</div>
          </div>
          <button style={btnPrimary} onClick={() => { setErr(""); setModal({ threshold: "", reward: "" }); }}>+ New Tier</button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {tiers.length === 0 && <div style={{ fontSize: 13, color: "#475569", padding: "14px 0" }}>No tiers yet — add the first milestone (e.g. 5 paid referrals → BCPL cap).</div>}
          {tiers.map(tier => (
            <div key={tier.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "9px 12px", borderRadius: 9, background: "#F5F6F8", border: "1px solid #E2E8F0" }}>
              <div style={{ minWidth: 64, fontFamily: "monospace", fontWeight: 800, fontSize: 13, color: "#C2410C" }}>{tier.threshold} paid</div>
              <div style={{ flex: 1, fontSize: 13, color: "#1E293B" }}>{tier.reward}</div>
              <button onClick={() => { setErr(""); setModal({ id: tier.id, threshold: String(tier.threshold), reward: tier.reward }); }}
                style={{ background: "transparent", color: "#64748B", border: "none", cursor: "pointer", fontSize: 15 }}>✎</button>
            </div>
          ))}
        </div>
      </div>

      {/* Referrer leaderboard */}
      <div style={{ ...card, padding: 0, overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr>
            <th style={th}>#</th><th style={th}>Player</th><th style={th}>Code</th><th style={th}>Link</th>
            <th style={th}>Clicks</th><th style={th}>Joined</th><th style={th}>Paid</th>
            <th style={th}>Milestones (click to mark given)</th>
          </tr></thead>
          <tbody>
            {overview.players.length === 0 && (
              <tr><td style={{ ...td, color: "#475569", textAlign: "center", padding: 30 }} colSpan={8}>
                No player referrers yet — links are created automatically when players open their dashboard after paying Phase 1.
              </td></tr>
            )}
            {overview.players.map((p, i) => (
              <tr key={p.code}>
                <td style={{ ...td, fontWeight: 900, color: i < 3 && p.paid > 0 ? "#B45309" : "#475569" }}>{i + 1}</td>
                <td style={{ ...td, fontWeight: 700 }}>
                  {p.name}
                  <div style={{ fontSize: 11, color: "#64748B", fontWeight: 400, marginTop: 2 }}>{p.phone || "—"}</div>
                </td>
                <td style={{ ...td, fontFamily: "monospace", fontWeight: 800, color: "#C2410C" }}>{p.code}</td>
                <td style={td}><CopyLink code={p.code} /></td>
                <td style={td}>{p.clicks}</td>
                <td style={{ ...td, fontWeight: 800 }}>{p.joined}</td>
                <td style={{ ...td, color: "#15803D", fontWeight: 800 }}>{p.paid}</td>
                <td style={td}>
                  {p.milestones.length === 0 ? (
                    <span style={{ fontSize: 11, color: "#475569" }}>none yet</span>
                  ) : (
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {p.milestones.map(m => {
                        const busy = togglingKey === `${p.code}:${m.threshold}`;
                        return (
                          <button key={m.threshold} title={m.reward} disabled={busy}
                            onClick={() => toggleGrant(p.code, p.name, m.threshold, m.reward, m.given)}
                            style={{
                              background: m.given ? "#14532D" : "#3F2A08",
                              color: m.given ? "#15803D" : "#FBBF24",
                              border: m.given ? "1px solid #166534" : "1px solid #92600E",
                              borderRadius: 20, padding: "4px 10px", fontSize: 11, fontWeight: 800,
                              cursor: "pointer", opacity: busy ? .5 : 1, whiteSpace: "nowrap",
                            }}>
                            {m.given ? `✓ ${m.threshold} given` : `⏳ ${m.threshold} due`}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <Modal onClose={() => setModal(null)}>
          <div style={{ fontSize: 16, fontWeight: 800, color: "#1E293B", marginBottom: 18 }}>{modal.id ? "Edit Reward Tier" : "New Reward Tier"}</div>
          <Field label="Paid referrals needed *">
            <input style={inp} type="number" min={1} value={modal.threshold}
              onChange={e => setModal({ ...modal, threshold: e.target.value })} placeholder="e.g. 5" />
          </Field>
          <Field label="Reward *">
            <input style={inp} value={modal.reward} maxLength={200}
              onChange={e => setModal({ ...modal, reward: e.target.value })} placeholder="e.g. 🧢 Official BCPL Season 5 cap" />
          </Field>
          {err && <div style={{ fontSize: 12, color: "#DC2626", marginBottom: 10 }}>⚠ {err}</div>}
          <div style={{ display: "flex", gap: 10, justifyContent: "space-between", marginTop: 6 }}>
            <div>{modal.id && <button style={{ ...btnGhost, color: "#DC2626" }} onClick={() => removeTier(modal.id!)}>Delete</button>}</div>
            <div style={{ display: "flex", gap: 10 }}>
              <button style={btnGhost} onClick={() => setModal(null)}>Cancel</button>
              <button style={btnPrimary} onClick={saveTier} disabled={busy}>{busy ? "Saving…" : "Save"}</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

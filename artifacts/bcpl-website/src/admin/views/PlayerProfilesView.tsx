import { useEffect, useState } from "react";
import { adminGetRegistrations } from "../../lib/api";

type Reg = {
  id: string;
  regNumber: string | null;
  role: string;
  trialCity: string | null;
  phase1Status: string;
  phase2Status: string | null;
  createdAt: string;
  user: { id: string; name: string; phone: string; email: string } | null;
};

const ROLE_LABEL: Record<string, string> = { bat: "Batsman", bowl: "Bowler", wk: "Wicket-keeper", ar: "All-rounder" };

const STATUS_LABEL: Record<string, string> = {
  pending: "Pending", payment_done: "Payment done", video_submitted: "Video submitted",
  selected: "Selected", rejected: "Rejected", kyc_done: "KYC done",
};

function stageOf(r: Reg): { label: string; color: string } {
  if (r.phase2Status) {
    const l = STATUS_LABEL[r.phase2Status] || r.phase2Status;
    const color = r.phase2Status === "selected" || r.phase2Status === "kyc_done" ? "#10B981"
      : r.phase2Status === "rejected" ? "#EF4444" : "#F59E0B";
    return { label: `Phase 2 · ${l}`, color };
  }
  const l = STATUS_LABEL[r.phase1Status] || r.phase1Status;
  const color = r.phase1Status === "selected" ? "#10B981"
    : r.phase1Status === "rejected" ? "#EF4444"
    : r.phase1Status === "pending" ? "#64748B" : "#F59E0B";
  return { label: `Phase 1 · ${l}`, color };
}

export default function PlayerProfilesView() {
  const [regs, setRegs]       = useState<Reg[] | null>(null);
  const [loadErr, setLoadErr] = useState("");
  const [sel, setSel]         = useState<Reg | null>(null);
  const [search, setSearch]   = useState("");

  const card: React.CSSProperties = { background: "linear-gradient(135deg,#0D1526,#0A1020)", border: "1px solid #1E293B", borderRadius: 16, padding: 20 };

  useEffect(() => {
    adminGetRegistrations()
      .then(d => setRegs((d.registrations || []) as Reg[]))
      .catch(e => setLoadErr(e?.message || "Could not load players"));
  }, []);

  const all = regs || [];
  const q = search.toLowerCase();
  const filtered = all.filter(r =>
    (r.user?.name || "").toLowerCase().includes(q) ||
    (r.trialCity || "").toLowerCase().includes(q) ||
    (r.regNumber || "").toLowerCase().includes(q)
  );

  const phase1Selected = all.filter(r => r.phase1Status === "selected").length;
  const inPhase2       = all.filter(r => r.phase2Status && r.phase2Status !== "rejected").length;
  const auctionReady   = all.filter(r => r.phase2Status === "kyc_done" || r.phase2Status === "selected").length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <div style={{ fontSize: 20, fontWeight: 800, color: "#F1F5F9" }}>Player Profiles</div>
        <div style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}>Every registered player — live from the registration database</div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
        {[
          { label: "Total Registered",  value: regs ? all.length : "…",      color: "#6366F1" },
          { label: "Phase 1 Selected",  value: regs ? phase1Selected : "…",  color: "#10B981" },
          { label: "In Phase 2",        value: regs ? inPhase2 : "…",        color: "#FF6B00" },
          { label: "Auction-Ready",     value: regs ? auctionReady : "…",    color: "#F59E0B" },
        ].map(s => (
          <div key={s.label} style={{ ...card, borderTop: `3px solid ${s.color}` }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 11, color: "#64748B", marginTop: 5 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Honest note about public pages */}
      <div style={{ padding: "12px 18px", background: "#6366F110", border: "1px solid #6366F130", borderRadius: 12, display: "flex", gap: 10, alignItems: "center" }}>
        <span style={{ fontSize: 18, lineHeight: 1 }}>💡</span>
        <div style={{ fontSize: 12, color: "#94A3B8", lineHeight: 1.6 }}>
          Public shareable profile pages (<strong style={{ color: "#FF6B00" }}>bcplt20.com/player/…</strong>) are not live yet.
          This list shows real registered players with their real BCPL IDs — share links will switch on once the public pages launch.
        </div>
      </div>

      {loadErr && (
        <div style={{ padding: "14px 18px", background: "#EF444412", border: "1px solid #EF444440", borderRadius: 12, color: "#F87171", fontSize: 13 }}>
          {loadErr} — refresh to try again.
        </div>
      )}

      {!regs && !loadErr && (
        <div style={{ ...card, textAlign: "center", color: "#475569", fontSize: 13, padding: "40px 20px" }}>Loading players…</div>
      )}

      {regs && (
        <div style={{ display: "grid", gridTemplateColumns: sel ? "1fr 360px" : "1fr", gap: 16 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, city or BCPL ID…"
              style={{ padding: "10px 14px", borderRadius: 9, border: "1px solid #1E293B", background: "#0D1526", color: "#E2E8F0", fontSize: 13, outline: "none" }}/>

            {filtered.length === 0 && (
              <div style={{ ...card, textAlign: "center", color: "#475569", fontSize: 13 }}>
                {all.length === 0 ? "No registrations yet." : "No players match this search."}
              </div>
            )}

            {filtered.map(r => {
              const st = stageOf(r);
              return (
                <div key={r.id} onClick={() => setSel(ps => ps?.id === r.id ? null : r)} style={{ ...card, cursor: "pointer", border: `1px solid ${sel?.id === r.id ? "#FF6B0060" : "#1E293B"}`, padding: "14px 16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: "linear-gradient(135deg,#FF6B0030,#1E293B)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 800, color: "#FF8C40", flexShrink: 0 }}>
                      {(r.user?.name || "?").split(/\s+/).map(w => w[0]).join("").slice(0, 2).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#F1F5F9" }}>{r.user?.name || "Unknown"}</div>
                      <div style={{ fontSize: 11, color: "#475569", marginTop: 2 }}>{ROLE_LABEL[r.role] || r.role}{r.trialCity ? ` · ${r.trialCity}` : ""}</div>
                      {r.regNumber && <div style={{ fontSize: 11, color: "#334155", marginTop: 2, fontFamily: "monospace" }}>{r.regNumber}</div>}
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 800, padding: "3px 9px", borderRadius: 6, background: `${st.color}22`, color: st.color, flexShrink: 0 }}>{st.label}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Player preview */}
          {sel && (
            <div style={{ ...card, alignSelf: "start", position: "sticky", top: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#94A3B8", marginBottom: 14, textTransform: "uppercase", letterSpacing: .5 }}>Player Details</div>
              <div style={{ background: "#06101E", borderRadius: 12, overflow: "hidden", border: "1px solid #1E293B" }}>
                <div style={{ height: 80, background: "linear-gradient(135deg,#FF7A29,#06101E)", position: "relative" }}>
                  <div style={{ position: "absolute", bottom: -24, left: 20, width: 52, height: 52, borderRadius: "50%", background: "linear-gradient(135deg,#FF6B0040,#1E293B)", border: "3px solid #06101E", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, fontWeight: 800, color: "#FF8C40" }}>
                    {(sel.user?.name || "?").split(/\s+/).map(w => w[0]).join("").slice(0, 2).toUpperCase()}
                  </div>
                </div>
                <div style={{ padding: "32px 20px 20px" }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: "#F1F5F9" }}>{sel.user?.name || "Unknown"}</div>
                  <div style={{ fontSize: 12, color: "#FF6B00", marginTop: 2 }}>{ROLE_LABEL[sel.role] || sel.role}{sel.trialCity ? ` · ${sel.trialCity}` : ""}</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 16 }}>
                    {[
                      ["BCPL ID", sel.regNumber || "Not assigned yet"],
                      ["Phase 1", STATUS_LABEL[sel.phase1Status] || sel.phase1Status],
                      ["Phase 2", sel.phase2Status ? (STATUS_LABEL[sel.phase2Status] || sel.phase2Status) : "Not started"],
                      ["Registered", sel.createdAt ? new Date(sel.createdAt).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", year: "numeric" }) : "—"],
                    ].map(([l, v]) => (
                      <div key={l} style={{ display: "flex", justifyContent: "space-between", gap: 10, padding: "7px 10px", background: "#0D1526", borderRadius: 8 }}>
                        <span style={{ fontSize: 11, color: "#475569" }}>{l}</span>
                        <span style={{ fontSize: 11, fontWeight: 700, color: "#E2E8F0", textAlign: "right" }}>{v}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: 14, fontSize: 11, color: "#334155", lineHeight: 1.6 }}>
                    Public profile page for this player will be available once the profile pages feature goes live.
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

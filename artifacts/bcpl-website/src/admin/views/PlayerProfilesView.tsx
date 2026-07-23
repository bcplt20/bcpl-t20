import { useEffect, useState } from "react";
import { adminGetRegistrations } from "../../lib/api";
import { adminReq } from "../../lib/adminHttp";

/* ────────────────────────────────────────────────────────────────────
   MASTER PLAYER PROFILE (admin)
   List → search any player → full journey view: one screen that shows
   where the player is in the BCPL lifecycle, every payment, video,
   AI evaluation, KYC state and all communications. Read-only —
   AI scores are never editable here (spec rule).
──────────────────────────────────────────────────────────────────── */

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

type Step = { id: string; label: string; state: "done" | "current" | "attention" | "locked"; detail: string | null; at: string | null };

type Journey = {
  player: {
    registrationId: string; regNumber: string | null; name: string | null; phone: string | null; email: string | null;
    role: string; roleLabel: string; trialCity: string | null; phase1Status: string; phase2Status: string | null;
    videoDeadline: string | null; registeredAt: string;
  };
  journey: { masterStatus: string; steps: Step[] };
  phase1Payment: { amount: string; status: string; orderId: string; paymentId: string | null; paidAt: string | null; attempts: number } | null;
  phase2Payment: { amount: string; status: string; orderId: string; paymentId: string | null; paidAt: string | null; attempts: number } | null;
  videos: { id: string; status: string; durationSeconds: number | null; mimeType: string | null; sizeBytes: number | null; declarationAccepted: boolean; uploadedAt: string }[];
  evaluation: {
    attemptNumber: number; status: string; reasonCode: string | null;
    pass1Score: number | null; pass2Score: number | null; pass3Score: number | null;
    finalScore: number | null; confidence: number | null; scoreVariance: number | null;
    passesUsed: number | null; result: string | null; categoryScores: Record<string, number> | null;
    strongestArea: string | null; improvementArea: string | null;
    resultReleaseAt: string | null; resultReleasedAt: string | null;
    modelVersion: string | null; promptVersion: string | null; rubricVersion: string | null; assessmentVersion: string | null;
  } | null;
  passes: { passNumber: number; kind: string; status: string; model: string | null; score: number | null; confidence: number | null; latencyMs: number | null; at: string | null }[];
  ranking: { cityRank: number | null; cityTotal: number | null; roleRank: number | null; roleTotal: number | null; percentile: number | null; snapshotAt: string } | null;
  kyc: { status: string; aadhaarVerified: boolean; panVerified: boolean; profession: string | null; verifiedAt: string | null } | null;
  profile: { company: string | null; jobTitle: string | null; experience: string | null; tshirtSize: string | null; bloodGroup: string | null; emergencyName: string | null; emergencyRelation: string | null; emergencyPhone: string | null } | null;
  notifications: { type: string; template: string; status: string; error: string | null; at: string }[];
};

const ROLE_LABEL: Record<string, string> = { bat: "Batsman", bowl: "Bowler", wk: "Wicket-keeper", ar: "All-rounder" };

const STEP_COLORS: Record<Step["state"], { bg: string; border: string; text: string; icon: string }> = {
  done:      { bg: "rgba(16,185,129,0.10)", border: "#10B98155", text: "#10B981", icon: "✓" },
  current:   { bg: "rgba(245,158,11,0.12)", border: "#F59E0B66", text: "#F59E0B", icon: "●" },
  attention: { bg: "rgba(239,68,68,0.12)",  border: "#EF444466", text: "#EF4444", icon: "!" },
  locked:    { bg: "rgba(51,65,85,0.25)",   border: "#33415555", text: "#64748B", icon: "○" },
};

const card: React.CSSProperties = { background: "linear-gradient(135deg,#0D1526,#0A1020)", border: "1px solid #1E293B", borderRadius: 16, padding: 20 };
const label: React.CSSProperties = { fontSize: 11, letterSpacing: ".08em", color: "#64748B", textTransform: "uppercase", fontWeight: 700 };
const mono: React.CSSProperties = { fontFamily: "ui-monospace,monospace" };

function fmtDate(d: string | null | undefined, withTime = false): string {
  if (!d) return "—";
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return String(d);
  return withTime
    ? dt.toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
    : dt.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}
function fmtBytes(n: number | null): string {
  if (n == null) return "—";
  if (n > 1024 * 1024) return (n / (1024 * 1024)).toFixed(1) + " MB";
  if (n > 1024) return Math.round(n / 1024) + " KB";
  return n + " B";
}

function Field({ k, v, monospace }: { k: string; v: React.ReactNode; monospace?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "7px 0", borderBottom: "1px solid #131C2E" }}>
      <span style={{ fontSize: 12.5, color: "#64748B", flexShrink: 0 }}>{k}</span>
      <span style={{ fontSize: 13, color: "#E2E8F0", textAlign: "right", ...(monospace ? mono : {}), wordBreak: "break-all" }}>{v ?? "—"}</span>
    </div>
  );
}

function StatusChip({ text, color }: { text: string; color: string }) {
  return (
    <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: ".04em", color, background: color + "1A", border: "1px solid " + color + "44", padding: "3px 10px", borderRadius: 999, whiteSpace: "nowrap" }}>
      {text}
    </span>
  );
}

/* ── Journey timeline ── */
function Timeline({ steps }: { steps: Step[] }) {
  return (
    <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 6 }}>
      {steps.map(s => {
        const c = STEP_COLORS[s.state];
        return (
          <div key={s.id} style={{ minWidth: 118, flex: "0 0 auto", background: c.bg, border: "1px solid " + c.border, borderRadius: 12, padding: "10px 12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 18, height: 18, borderRadius: "50%", background: c.text + "22", color: c.text, fontSize: 11, fontWeight: 900, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>{c.icon}</span>
              <span style={{ fontSize: 11.5, fontWeight: 800, color: c.text, letterSpacing: ".02em" }}>{s.label}</span>
            </div>
            <div style={{ fontSize: 11, color: s.state === "locked" ? "#475569" : "#94A3B8", marginTop: 5, lineHeight: 1.35 }}>
              {s.detail || (s.state === "locked" ? "Locked" : "")}
              {s.at ? <div style={{ color: "#475569", marginTop: 2 }}>{fmtDate(s.at)}</div> : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── Detail (Master Profile) ── */
function MasterProfile({ regKey, onBack }: { regKey: string; onBack: () => void }) {
  const [data, setData] = useState<Journey | null>(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    adminReq<Journey>("GET", "/admin/players/" + encodeURIComponent(regKey) + "/journey")
      .then(d => { setData(d); setErr(""); })
      .catch(e => setErr(e?.message || "Could not load player journey"))
      .finally(() => setLoading(false));
  };
  useEffect(load, [regKey]);

  if (loading && !data) return <div style={{ color: "#64748B", padding: 40, textAlign: "center" }}>Loading player journey…</div>;
  if (err) return (
    <div style={{ ...card, borderColor: "#EF444455" }}>
      <div style={{ color: "#EF4444", fontWeight: 700, marginBottom: 8 }}>{err}</div>
      <button onClick={onBack} style={btnGhost}>← Back to players</button>
    </div>
  );
  if (!data) return null;

  const p = data.player;
  const ev = data.evaluation;
  const initials = (p.name || "?").split(/\s+/).map(w => w[0]).slice(0, 2).join("").toUpperCase();
  const masterColor = data.journey.steps.some(s => s.state === "attention") ? "#EF4444"
    : data.journey.masterStatus.includes("NOT SHORTLISTED") ? "#EF4444"
    : data.journey.masterStatus === "ALL STEPS COMPLETE" ? "#10B981" : "#F59E0B";

  return (
    <div style={{ display: "grid", gap: 14 }}>
      {/* Header */}
      <div style={{ ...card, display: "flex", flexWrap: "wrap", alignItems: "center", gap: 16 }}>
        <button onClick={onBack} style={btnGhost}>←</button>
        <div style={{ width: 56, height: 56, borderRadius: 14, background: "linear-gradient(135deg,#FF7A29,#D95E10)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 20, color: "#fff", flexShrink: 0 }}>
          {initials}
        </div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ fontSize: 19, fontWeight: 900, color: "#F1F5F9", letterSpacing: ".01em" }}>{p.name || "Unknown"}</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 6, alignItems: "center" }}>
            <span style={{ ...mono, fontSize: 12.5, color: "#FF7A29", fontWeight: 700 }}>{p.regNumber || "No ID yet"}</span>
            <StatusChip text={p.roleLabel} color="#6366F1" />
            {p.trialCity ? <StatusChip text={p.trialCity} color="#3B82F6" /> : null}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={label}>Current status</div>
          <div style={{ marginTop: 6 }}><StatusChip text={data.journey.masterStatus} color={masterColor} /></div>
        </div>
        <button onClick={load} style={{ ...btnGhost, marginLeft: "auto" }} title="Refresh">↻</button>
      </div>

      {/* Journey timeline */}
      <div style={card}>
        <div style={{ ...label, marginBottom: 12 }}>Player journey</div>
        <Timeline steps={data.journey.steps} />
      </div>

      {/* Cards grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 14 }}>
        <div style={card}>
          <div style={{ ...label, marginBottom: 8 }}>Basic details</div>
          <Field k="Phone" v={p.phone} monospace />
          <Field k="Email" v={p.email} />
          <Field k="Registered" v={fmtDate(p.registeredAt, true)} />
          <Field k="Phase 1 status" v={p.phase1Status} monospace />
          <Field k="Phase 2 status" v={p.phase2Status || "—"} monospace />
          <Field k="Video deadline" v={fmtDate(p.videoDeadline)} />
        </div>

        <div style={card}>
          <div style={{ ...label, marginBottom: 8 }}>Phase 1 payment</div>
          {data.phase1Payment ? (<>
            <Field k="Amount" v={"₹" + data.phase1Payment.amount} />
            <Field k="Status" v={<StatusChip text={data.phase1Payment.status.toUpperCase()} color={["success","paid"].includes(data.phase1Payment.status) ? "#10B981" : data.phase1Payment.status === "failed" ? "#EF4444" : "#F59E0B"} />} />
            <Field k="Order ID" v={data.phase1Payment.orderId} monospace />
            <Field k="Payment ID" v={data.phase1Payment.paymentId} monospace />
            <Field k="Paid at" v={fmtDate(data.phase1Payment.paidAt, true)} />
            <Field k="Attempts" v={data.phase1Payment.attempts} />
          </>) : <div style={{ color: "#64748B", fontSize: 13 }}>No payment attempt yet.</div>}
        </div>

        <div style={card}>
          <div style={{ ...label, marginBottom: 8 }}>Trial video</div>
          {data.videos.length ? data.videos.map((v, i) => (
            <div key={v.id} style={{ marginBottom: i < data.videos.length - 1 ? 10 : 0, paddingBottom: i < data.videos.length - 1 ? 10 : 0, borderBottom: i < data.videos.length - 1 ? "1px dashed #1E293B" : "none" }}>
              <Field k={"Attempt " + (data.videos.length - i)} v={<StatusChip text={v.status.toUpperCase()} color={v.status === "submitted" ? "#10B981" : "#64748B"} />} />
              <Field k="Duration" v={v.durationSeconds != null ? v.durationSeconds + " sec" : "—"} />
              <Field k="Format / size" v={(v.mimeType || "—") + " · " + fmtBytes(v.sizeBytes)} />
              <Field k="Uploaded" v={fmtDate(v.uploadedAt, true)} />
            </div>
          )) : <div style={{ color: "#64748B", fontSize: 13 }}>No video uploaded yet.</div>}
        </div>

        <div style={card}>
          <div style={{ ...label, marginBottom: 8 }}>AI evaluation <span style={{ color: "#475569", textTransform: "none", letterSpacing: 0 }}>· read-only</span></div>
          {ev ? (<>
            {ev.finalScore != null && (
              <div style={{ textAlign: "center", margin: "6px 0 12px" }}>
                <span style={{ fontSize: 34, fontWeight: 900, color: "#F1F5F9" }}>{ev.finalScore}</span>
                <span style={{ fontSize: 15, color: "#64748B", fontWeight: 700 }}> / 100</span>
              </div>
            )}
            <Field k="Status" v={ev.status} monospace />
            {ev.reasonCode ? <Field k="Reason" v={ev.reasonCode} monospace /> : null}
            <Field k="Pass 1 / 2 / 3" v={[ev.pass1Score, ev.pass2Score, ev.pass3Score].map(x => x == null ? "—" : x).join(" · ")} />
            <Field k="Variance" v={ev.scoreVariance != null ? ev.scoreVariance : "—"} />
            <Field k="Confidence" v={ev.confidence != null ? Math.round(ev.confidence * 100) + "%" : "—"} />
            {ev.strongestArea ? <Field k="Strongest" v={ev.strongestArea} /> : null}
            {ev.improvementArea ? <Field k="Improvement" v={ev.improvementArea} /> : null}
            <Field k="Model" v={ev.modelVersion} monospace />
            <Field k="Prompt / rubric" v={(ev.promptVersion || "—") + " / " + (ev.rubricVersion || "—")} monospace />
          </>) : <div style={{ color: "#64748B", fontSize: 13 }}>Not evaluated yet.</div>}
        </div>

        <div style={card}>
          <div style={{ ...label, marginBottom: 8 }}>Result & ranking</div>
          {ev && (ev.resultReleaseAt || ev.resultReleasedAt) ? (<>
            <Field k="Release scheduled" v={fmtDate(ev.resultReleaseAt, true)} />
            <Field k="Released" v={ev.resultReleasedAt ? fmtDate(ev.resultReleasedAt, true) : "Not yet"} />
            <Field k="Result" v={ev.result ? <StatusChip text={ev.result.toUpperCase()} color={ev.result === "selected" ? "#10B981" : "#EF4444"} /> : "—"} />
          </>) : <div style={{ color: "#64748B", fontSize: 13, marginBottom: 6 }}>No result scheduled yet.</div>}
          {data.ranking ? (<>
            <Field k="City rank" v={"#" + data.ranking.cityRank + " / " + data.ranking.cityTotal} />
            <Field k="Role rank" v={"#" + data.ranking.roleRank + " / " + data.ranking.roleTotal} />
            <Field k="Percentile" v={data.ranking.percentile != null ? "Top " + data.ranking.percentile + "%" : "—"} />
          </>) : null}
        </div>

        <div style={card}>
          <div style={{ ...label, marginBottom: 8 }}>Phase 2 payment</div>
          {data.phase2Payment ? (<>
            <Field k="Amount" v={"₹" + data.phase2Payment.amount} />
            <Field k="Status" v={<StatusChip text={data.phase2Payment.status.toUpperCase()} color={["success","paid"].includes(data.phase2Payment.status) ? "#10B981" : data.phase2Payment.status === "failed" ? "#EF4444" : "#F59E0B"} />} />
            <Field k="Order ID" v={data.phase2Payment.orderId} monospace />
            <Field k="Paid at" v={fmtDate(data.phase2Payment.paidAt, true)} />
          </>) : <div style={{ color: "#64748B", fontSize: 13 }}>No Phase 2 payment yet.</div>}
        </div>

        <div style={card}>
          <div style={{ ...label, marginBottom: 8 }}>Identity / KYC</div>
          {data.kyc ? (<>
            <Field k="Status" v={<StatusChip text={data.kyc.status.toUpperCase()} color={data.kyc.status === "verified" ? "#10B981" : data.kyc.status === "failed" ? "#EF4444" : "#F59E0B"} />} />
            <Field k="Aadhaar" v={data.kyc.aadhaarVerified ? "Verified ✓" : "Not verified"} />
            <Field k="PAN" v={data.kyc.panVerified ? "Verified ✓" : "Manual review required"} />
            <Field k="Profession" v={data.kyc.profession} />
            <Field k="Verified at" v={fmtDate(data.kyc.verifiedAt, true)} />
          </>) : <div style={{ color: "#64748B", fontSize: 13 }}>KYC not started.</div>}
        </div>

        <div style={card}>
          <div style={{ ...label, marginBottom: 8 }}>Player essentials</div>
          {data.profile ? (<>
            <Field k="T-shirt size" v={data.profile.tshirtSize} />
            <Field k="Blood group" v={data.profile.bloodGroup} />
            <Field k="Emergency contact" v={data.profile.emergencyName ? data.profile.emergencyName + (data.profile.emergencyRelation ? " (" + data.profile.emergencyRelation + ")" : "") : "—"} />
            <Field k="Emergency phone" v={data.profile.emergencyPhone} monospace />
            <Field k="Company" v={data.profile.company} />
            <Field k="Designation" v={data.profile.jobTitle} />
          </>) : <div style={{ color: "#64748B", fontSize: 13 }}>Not submitted yet.</div>}
        </div>
      </div>

      {/* Communication history */}
      <div style={card}>
        <div style={{ ...label, marginBottom: 10 }}>Communication history <span style={{ color: "#475569", textTransform: "none", letterSpacing: 0 }}>· last {data.notifications.length}</span></div>
        {data.notifications.length ? (
          <div style={{ maxHeight: 320, overflowY: "auto", display: "grid", gap: 6 }}>
            {data.notifications.map((n, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 10px", background: "rgba(15,23,42,0.5)", border: "1px solid #131C2E", borderRadius: 10, flexWrap: "wrap" }}>
                <StatusChip text={n.type.toUpperCase()} color={n.type === "email" ? "#3B82F6" : n.type === "sms" ? "#A855F7" : "#10B981"} />
                <span style={{ ...mono, fontSize: 12.5, color: "#CBD5E1", flex: 1 }}>{n.template}</span>
                <StatusChip text={n.status.toUpperCase()} color={n.status === "sent" ? "#10B981" : n.status === "failed" ? "#EF4444" : "#64748B"} />
                <span style={{ fontSize: 11.5, color: "#475569" }}>{fmtDate(n.at, true)}</span>
                {n.error ? <span style={{ fontSize: 11.5, color: "#EF4444", width: "100%" }}>{n.error}</span> : null}
              </div>
            ))}
          </div>
        ) : <div style={{ color: "#64748B", fontSize: 13 }}>No messages logged for this player yet.</div>}
      </div>
    </div>
  );
}

const btnGhost: React.CSSProperties = { background: "rgba(30,41,59,0.5)", border: "1px solid #1E293B", color: "#94A3B8", borderRadius: 10, padding: "8px 14px", cursor: "pointer", fontSize: 14, fontWeight: 700 };

/* ── Main view: list + search → master profile ── */
export default function PlayerProfilesView() {
  const [regs, setRegs] = useState<Reg[] | null>(null);
  const [loadErr, setLoadErr] = useState("");
  const [selKey, setSelKey] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    adminGetRegistrations()
      .then(d => setRegs((d.registrations || []) as Reg[]))
      .catch(e => setLoadErr(e?.message || "Could not load players"));
  }, []);

  if (selKey) return <MasterProfile regKey={selKey} onBack={() => setSelKey(null)} />;

  const all = regs || [];
  const q = search.trim().toLowerCase();
  const filtered = all.filter(r =>
    (r.user?.name || "").toLowerCase().includes(q) ||
    (r.user?.phone || "").toLowerCase().includes(q) ||
    (r.trialCity || "").toLowerCase().includes(q) ||
    (r.regNumber || "").toLowerCase().includes(q)
  );

  const paid = all.filter(r => r.phase1Status !== "pending").length;
  const qualified = all.filter(r => r.phase1Status === "selected" || r.phase2Status).length;
  const inPhase2 = all.filter(r => r.phase2Status && r.phase2Status !== "rejected").length;

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 12 }}>
        {[
          { k: "Total players", v: all.length, c: "#3B82F6" },
          { k: "Phase 1 active", v: paid, c: "#F59E0B" },
          { k: "Phase 1 qualified", v: qualified, c: "#10B981" },
          { k: "In Phase 2", v: inPhase2, c: "#A855F7" },
        ].map(x => (
          <div key={x.k} style={card}>
            <div style={label}>{x.k}</div>
            <div style={{ fontSize: 26, fontWeight: 900, color: x.c, marginTop: 4 }}>{x.v}</div>
          </div>
        ))}
      </div>

      <div style={card}>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginBottom: 12 }}>
          <div style={{ ...label }}>Master player profile</div>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search name, phone, BCPL ID or city…"
            style={{ flex: 1, minWidth: 220, background: "rgba(15,23,42,0.6)", border: "1px solid #1E293B", borderRadius: 10, padding: "9px 13px", color: "#E2E8F0", fontSize: 13.5, outline: "none" }}
          />
        </div>

        {loadErr && <div style={{ color: "#EF4444", fontSize: 13, marginBottom: 10 }}>{loadErr}</div>}
        {!regs && !loadErr && <div style={{ color: "#64748B", fontSize: 13 }}>Loading players…</div>}
        {regs && !filtered.length && <div style={{ color: "#64748B", fontSize: 13 }}>No players match.</div>}

        <div style={{ display: "grid", gap: 8 }}>
          {filtered.slice(0, 200).map(r => (
            <button
              key={r.id}
              onClick={() => setSelKey(r.regNumber || r.id)}
              style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 14px", background: "rgba(15,23,42,0.45)", border: "1px solid #16203A", borderRadius: 12, cursor: "pointer", textAlign: "left", width: "100%" }}
            >
              <span style={{ width: 38, height: 38, borderRadius: 10, background: "linear-gradient(135deg,#FF7A2933,#D95E1033)", color: "#FF9A4D", fontWeight: 900, fontSize: 14, display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                {(r.user?.name || "?").split(/\s+/).map(w => w[0]).slice(0, 2).join("").toUpperCase()}
              </span>
              <span style={{ flex: 1, minWidth: 140 }}>
                <span style={{ display: "block", fontSize: 14, fontWeight: 800, color: "#E2E8F0" }}>{r.user?.name || "Unknown"}</span>
                <span style={{ display: "block", fontSize: 12, color: "#64748B", marginTop: 2 }}>
                  {(ROLE_LABEL[r.role] || r.role) + (r.trialCity ? " · " + r.trialCity : "")}
                </span>
              </span>
              <span style={{ ...mono, fontSize: 12, color: "#FF7A29", fontWeight: 700 }}>{r.regNumber || "—"}</span>
              <span style={{ fontSize: 12, color: "#94A3B8" }}>→</span>
            </button>
          ))}
        </div>
        {filtered.length > 200 && <div style={{ color: "#475569", fontSize: 12, marginTop: 8 }}>Showing first 200 — refine your search.</div>}
      </div>
    </div>
  );
}
